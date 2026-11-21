'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  computeHeaderScrollState,
  computeParallaxOffsets,
  computeStaggerDelayMs,
  stepDampedValue,
} from '@/lib/scroll-motion';

export function LiquidGlassMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 1. Zero-Reflow Compositor Scroll & Pointer Engine
  //    - Never mutates inherited CSS variables on :root during scroll
  //    - Dirty-checks header state & updates header elements directly
  //    - Smoothly damps GPU translate3d on [data-parallax-layer] nodes and auto-sleeps at rest
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const finePointerQuery = window.matchMedia('(pointer: fine)');

    let headers: HTMLElement[] = [];
    let layerA: HTMLElement[] = [];
    let layerB: HTMLElement[] = [];
    let layerC: HTMLElement[] = [];

    const refreshTargets = () => {
      headers = Array.from(
        document.querySelectorAll<HTMLElement>('[data-scroll-header]'),
      );
      layerA = Array.from(
        document.querySelectorAll<HTMLElement>('[data-parallax-layer="a"]'),
      );
      layerB = Array.from(
        document.querySelectorAll<HTMLElement>('[data-parallax-layer="b"]'),
      );
      layerC = Array.from(
        document.querySelectorAll<HTMLElement>('[data-parallax-layer="c"]'),
      );
    };

    refreshTargets();

    let prevScrollY = window.scrollY || 0;
    let prevHidden: boolean | null = null;
    let prevScrolled: boolean | null = null;
    let prevBlurPx: number | null = null;

    let currentA = 0;
    let currentB = 0;
    let currentC = 0;
    let targetA = 0;
    let targetB = 0;
    let targetC = 0;

    let rafId = 0;

    const applyHeaderState = (
      hidden: boolean,
      scrolled: boolean,
      blurPx: number,
    ) => {
      if (headers.length === 0) return;
      const hiddenChanged = prevHidden !== hidden;
      const scrolledChanged = prevScrolled !== scrolled;
      const blurChanged = prevBlurPx !== blurPx;
      if (!hiddenChanged && !scrolledChanged && !blurChanged) return;

      prevHidden = hidden;
      prevScrolled = scrolled;
      prevBlurPx = blurPx;

      for (const header of headers) {
        if (scrolledChanged) {
          header.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
        }
        if (hiddenChanged) {
          header.setAttribute('data-hidden', hidden ? 'true' : 'false');
        }
        if (blurChanged) {
          header.style.setProperty('--header-glass-blur', `${blurPx}px`);
        }
      }
    };

    const applyParallaxTransforms = (a: number, b: number, c: number) => {
      for (const el of layerA) {
        el.style.transform = `translate3d(0, ${a}px, 0)`;
      }
      for (const el of layerB) {
        el.style.transform = `translate3d(0, ${b}px, 0)`;
      }
      for (const el of layerC) {
        el.style.transform = `translate3d(0, ${c}px, 0)`;
      }
    };

    const runAnimationTick = () => {
      rafId = 0;
      const reduced = reducedMotionQuery.matches;

      if (reduced) {
        currentA = 0;
        currentB = 0;
        currentC = 0;
        applyParallaxTransforms(0, 0, 0);
        return;
      }

      const stepA = stepDampedValue(currentA, targetA, 0.24, 0.15);
      const stepB = stepDampedValue(currentB, targetB, 0.24, 0.15);
      const stepC = stepDampedValue(currentC, targetC, 0.24, 0.15);

      currentA = stepA.value;
      currentB = stepB.value;
      currentC = stepC.value;

      applyParallaxTransforms(currentA, currentB, currentC);

      if (!stepA.settled || !stepB.settled || !stepC.settled) {
        rafId = window.requestAnimationFrame(runAnimationTick);
      }
    };

    const syncScroll = (immediate = false) => {
      const y = window.scrollY || 0;
      const reduced = reducedMotionQuery.matches;

      // Lazily re-query if a page mounts its header/backdrop slightly after hydration
      if (headers.length === 0 || (layerA.length === 0 && !reduced)) {
        refreshTargets();
      }

      const headerState = computeHeaderScrollState(
        y,
        prevScrollY,
        prevHidden ?? false,
      );
      prevScrollY = y;

      applyHeaderState(
        reduced ? false : headerState.hidden,
        headerState.scrolled,
        headerState.blurPx,
      );

      if (reduced) {
        targetA = 0;
        targetB = 0;
        targetC = 0;
        if (currentA !== 0 || currentB !== 0 || currentC !== 0) {
          currentA = 0;
          currentB = 0;
          currentC = 0;
          applyParallaxTransforms(0, 0, 0);
        }
        return;
      }

      const parallax = computeParallaxOffsets(y);
      targetA = parallax.blobA;
      targetB = parallax.blobB;
      targetC = parallax.blobC;

      if (immediate) {
        currentA = targetA;
        currentB = targetB;
        currentC = targetC;
        applyParallaxTransforms(currentA, currentB, currentC);
        return;
      }

      if (rafId === 0) {
        rafId = window.requestAnimationFrame(runAnimationTick);
      }
    };

    const handleScroll = () => {
      syncScroll(false);
    };

    const handleResize = () => {
      refreshTargets();
      syncScroll(true);
    };

    // Subtle pointer sheen modulation ONLY on desktop fine-pointer devices
    // (Never runs on touch phones, preventing mobile style recalc during touch scroll)
    let pointerRafId = 0;
    let latestClientX = 0;
    let latestClientY = 0;
    let lastSheenX = 0;
    let lastSheenY = 0;

    const applyPointerSheen = () => {
      pointerRafId = 0;
      if (reducedMotionQuery.matches || !finePointerQuery.matches) return;
      const nextX =
        Math.round(
          (latestClientX / Math.max(1, window.innerWidth) - 0.5) * 16 * 2,
        ) / 2;
      const nextY =
        Math.round(
          (latestClientY / Math.max(1, window.innerHeight) - 0.5) * 12 * 2,
        ) / 2;
      if (nextX === lastSheenX && nextY === lastSheenY) return;
      lastSheenX = nextX;
      lastSheenY = nextY;
      root.style.setProperty('--glass-sheen-shift', `${nextX}%`);
      root.style.setProperty('--glass-sheen-y', `${nextY}%`);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      latestClientX = e.clientX;
      latestClientY = e.clientY;
      if (pointerRafId !== 0) return;
      pointerRafId = window.requestAnimationFrame(applyPointerSheen);
    };

    syncScroll(true);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    if (finePointerQuery.matches) {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (pointerRafId) window.cancelAnimationFrame(pointerRafId);
    };
  }, [pathname]);

  // 2. Proactive IntersectionObserver Scroll Reveal with Brisk Stagger (45ms)
  //    & Zero-Reflow Coalesced MutationObserver (inspects only addedNodes)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduced || typeof IntersectionObserver === 'undefined') {
      root.classList.remove('glass-motion-ready');
      document
        .querySelectorAll<HTMLElement>('[data-glass-reveal]')
        .forEach((el) => el.setAttribute('data-glass-visible', 'true'));
      return;
    }

    root.classList.add('glass-motion-ready');

    const observed = new WeakSet<Element>();
    const pendingNodes = new Set<HTMLElement>();
    let flushRafId = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        let batchIndex = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const explicitDelay = el.getAttribute('data-glass-delay');
          const delayMs =
            explicitDelay !== null
              ? Math.min(180, Number(explicitDelay))
              : computeStaggerDelayMs(batchIndex, 45, 180);
          batchIndex += 1;

          if (delayMs > 0) {
            el.style.setProperty('--reveal-delay', `${delayMs}ms`);
          }
          el.setAttribute('data-glass-visible', 'true');
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.01,
        rootMargin: '0px 0px 90px 0px',
      },
    );

    const registerElements = (elements: Iterable<HTMLElement>) => {
      const viewportLimit = window.innerHeight * 1.04;
      for (const el of elements) {
        if (observed.has(el) || el.getAttribute('data-glass-visible') === 'true') {
          continue;
        }
        observed.add(el);
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportLimit && rect.bottom > -40) {
          const explicitDelay = el.getAttribute('data-glass-delay');
          if (explicitDelay !== null) {
            const clamped = Math.min(160, Math.max(0, Number(explicitDelay)));
            if (clamped > 0) {
              el.style.setProperty('--reveal-delay', `${clamped}ms`);
            }
          }
          el.setAttribute('data-glass-visible', 'true');
        } else {
          observer.observe(el);
        }
      }
    };

    // Initial scan once on mount/route transition
    registerElements(document.querySelectorAll<HTMLElement>('[data-glass-reveal]'));

    const flushPending = () => {
      flushRafId = 0;
      if (pendingNodes.size === 0) return;
      const batch = Array.from(pendingNodes);
      pendingNodes.clear();
      registerElements(batch);
    };

    const mutationObserver = new MutationObserver((mutations) => {
      let foundNew = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          const el = node as HTMLElement;
          if (el.hasAttribute('data-glass-reveal')) {
            pendingNodes.add(el);
            foundNew = true;
          }
          if (el.firstElementChild) {
            const nested = el.querySelectorAll<HTMLElement>('[data-glass-reveal]');
            if (nested.length > 0) {
              nested.forEach((child) => pendingNodes.add(child));
              foundNew = true;
            }
          }
        }
      }
      if (foundNew && flushRafId === 0) {
        flushRafId = window.requestAnimationFrame(flushPending);
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      if (flushRafId) window.cancelAnimationFrame(flushRafId);
    };
  }, [pathname]);

  return <>{children}</>;
}

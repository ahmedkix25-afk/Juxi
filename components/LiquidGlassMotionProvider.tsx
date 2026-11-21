'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  computeHeaderScrollState,
  computeParallaxOffsets,
  computeScrollSheenShift,
  computeStaggerDelayMs,
} from '@/lib/scroll-motion';

export function LiquidGlassMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 1. Passive rAF Scroll & Pointer Engine (Header Hide/Blur, Parallax Blobs, Glass Sheen)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const finePointerQuery = window.matchMedia('(pointer: fine)');

    let prevScrollY = window.scrollY || 0;
    let prevHidden = false;
    let rafId = 0;

    const syncScrollFrame = () => {
      rafId = 0;
      const y = window.scrollY || 0;
      const reduced = reducedMotionQuery.matches;

      const headerState = computeHeaderScrollState(y, prevScrollY, prevHidden);
      prevScrollY = y;
      prevHidden = reduced ? false : headerState.hidden;

      root.style.setProperty(
        '--header-glass-blur',
        `${headerState.blurPx}px`,
      );

      const headers = document.querySelectorAll<HTMLElement>(
        '[data-scroll-header]',
      );
      headers.forEach((header) => {
        header.setAttribute(
          'data-scrolled',
          headerState.scrolled ? 'true' : 'false',
        );
        header.setAttribute(
          'data-hidden',
          prevHidden ? 'true' : 'false',
        );
      });

      if (reduced) {
        root.style.setProperty('--parallax-y-a', '0px');
        root.style.setProperty('--parallax-y-b', '0px');
        root.style.setProperty('--parallax-y-c', '0px');
        root.style.setProperty('--glass-sheen-shift', '0%');
        root.style.setProperty('--glass-sheen-y', '0%');
        return;
      }

      const parallax = computeParallaxOffsets(y);
      root.style.setProperty('--parallax-y-a', `${parallax.blobA}px`);
      root.style.setProperty('--parallax-y-b', `${parallax.blobB}px`);
      root.style.setProperty('--parallax-y-c', `${parallax.blobC}px`);

      const sheenShift = computeScrollSheenShift(y);
      root.style.setProperty('--glass-sheen-shift', `${sheenShift}%`);
    };

    const scheduleScrollFrame = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(syncScrollFrame);
    };

    // Subtle mouse/pointer sheen modulation on desktop fine-pointer devices
    let pointerRafId = 0;
    let latestClientX = 0;
    let latestClientY = 0;

    const applyPointerSheen = () => {
      pointerRafId = 0;
      if (reducedMotionQuery.matches || !finePointerQuery.matches) return;
      const nx = latestClientX / Math.max(1, window.innerWidth) - 0.5;
      const ny = latestClientY / Math.max(1, window.innerHeight) - 0.5;
      root.style.setProperty('--glass-sheen-shift', `${(nx * 18).toFixed(1)}%`);
      root.style.setProperty('--glass-sheen-y', `${(ny * 14).toFixed(1)}%`);
    };

    const handlePointerMove = (e: PointerEvent) => {
      latestClientX = e.clientX;
      latestClientY = e.clientY;
      if (pointerRafId !== 0) return;
      pointerRafId = window.requestAnimationFrame(applyPointerSheen);
    };

    syncScrollFrame();

    window.addEventListener('scroll', scheduleScrollFrame, { passive: true });
    window.addEventListener('resize', scheduleScrollFrame, { passive: true });
    if (finePointerQuery.matches) {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
    }

    return () => {
      window.removeEventListener('scroll', scheduleScrollFrame);
      window.removeEventListener('resize', scheduleScrollFrame);
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (pointerRafId) window.cancelAnimationFrame(pointerRafId);
    };
  }, [pathname]);

  // 2. IntersectionObserver Scroll Reveal with Sibling Stagger (60–80ms)
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

    const observer = new IntersectionObserver(
      (entries) => {
        let batchIndex = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const explicitDelay = el.getAttribute('data-glass-delay');
          const delayMs =
            explicitDelay !== null
              ? Number(explicitDelay)
              : computeStaggerDelayMs(batchIndex, 70);
          batchIndex += 1;

          el.style.setProperty('--reveal-delay', `${Math.max(0, delayMs)}ms`);
          el.setAttribute('data-glass-visible', 'true');
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.06,
        rootMargin: '0px 0px -20px 0px',
      },
    );

    const scanElements = () => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-glass-reveal]');
      nodes.forEach((el) => {
        if (observed.has(el) || el.getAttribute('data-glass-visible') === 'true') {
          return;
        }
        observed.add(el);
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
          const explicitDelay = el.getAttribute('data-glass-delay');
          if (explicitDelay !== null) {
            el.style.setProperty('--reveal-delay', `${Number(explicitDelay)}ms`);
          }
          el.setAttribute('data-glass-visible', 'true');
        } else {
          observer.observe(el);
        }
      });
    };

    scanElements();

    const mutationObserver = new MutationObserver(() => {
      scanElements();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return <>{children}</>;
}

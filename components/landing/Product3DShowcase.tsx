'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  ChevronRight,
  ChevronLeft,
  Package,
  Box,
  Images,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DESIGN_TOKENS } from '@/lib/design-tokens';

const ThreeModelViewer = dynamic(() => import('./ThreeModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] w-full rounded-[28px] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin text-[var(--lg-primary)]" />
      <span>جاري تحميل محرك العرض ثلاثي الأبعاد...</span>
    </div>
  ),
});

interface Product3DShowcaseProps {
  images: string[];
  model3dUrl?: string;
  productName: string;
  accentHex?: string;
  isDark?: boolean;
  lightweight?: boolean;
  supportsWebGL2?: boolean;
}

export function Product3DShowcase({
  images,
  model3dUrl,
  productName,
  accentHex = '#0F766E',
  isDark = false,
  lightweight = false,
  supportsWebGL2 = true,
}: Product3DShowcaseProps) {
  const validImages = images.filter((src) => Boolean(src && src.trim()));
  const hasGlbModel = Boolean(model3dUrl && model3dUrl.trim());
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'card3d' | 'webgl3d'>(() =>
    hasGlbModel && !lightweight && supportsWebGL2 ? 'webgl3d' : 'card3d',
  );

  // Multi-layer 3D Parallax/Tilt DOM refs (zero re-render smooth motion)
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  const tiltRafRef = useRef<number>(0);

  const safeIndex =
    activeIndex >= validImages.length ? 0 : Math.max(0, activeIndex);
  const currentUrl = validImages[safeIndex];
  const hasMultiple = validImages.length > 1;
  const canUseWebGL = hasGlbModel && supportsWebGL2 && !lightweight;
  const showModeSwitcher = canUseWebGL && validImages.length > 0;

  // Optional gentle mobile device-tilt parallax throttled to display refresh rate (rAF)
  useEffect(() => {
    if (lightweight || viewMode !== 'card3d' || typeof window === 'undefined') {
      return;
    }
    let orientRaf = 0;
    let lastRx = 0;
    let lastRy = 0;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null || !cardRef.current) return;
      lastRx = Math.max(-7, Math.min(7, (event.beta - 45) * 0.14));
      lastRy = Math.max(-8, Math.min(8, event.gamma * 0.18));
      if (orientRaf) return;
      orientRaf = window.requestAnimationFrame(() => {
        orientRaf = 0;
        if (!cardRef.current) return;
        cardRef.current.style.transform = `perspective(1100px) rotateX(${(-lastRx).toFixed(2)}deg) rotateY(${lastRy.toFixed(2)}deg) translateZ(0)`;
      });
    };
    window.addEventListener('deviceorientation', handleOrientation, {
      passive: true,
    });
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (orientRaf) window.cancelAnimationFrame(orientRaf);
    };
  }, [lightweight, viewMode]);

  const handleTiltMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || lightweight || !cardRef.current) return;
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (tiltRafRef.current) return;

    tiltRafRef.current = window.requestAnimationFrame(() => {
      tiltRafRef.current = 0;
      if (!cardRef.current) return;
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * 13;
      const rotateX = -py * 10;

      cardRef.current.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;

      if (shadowRef.current) {
        shadowRef.current.style.transform = `translate3d(${(-px * 22).toFixed(1)}px, ${(12 - py * 10).toFixed(1)}px, 0) scale(0.95)`;
      }
      if (glossRef.current) {
        glossRef.current.style.opacity = '1';
        glossRef.current.style.background = `radial-gradient(420px circle at ${((px + 0.5) * 100).toFixed(1)}% ${((py + 0.5) * 100).toFixed(1)}%, rgba(255,255,255,0.34), transparent 58%)`;
      }
    });
  };

  const handleTiltLeave = () => {
    if (tiltRafRef.current) {
      window.cancelAnimationFrame(tiltRafRef.current);
      tiltRafRef.current = 0;
    }
    if (cardRef.current) {
      cardRef.current.style.transform =
        'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (shadowRef.current) {
      shadowRef.current.style.transform = 'translate3d(0, 10px, 0) scale(0.94)';
    }
    if (glossRef.current) {
      glossRef.current.style.opacity = '0';
    }
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % validImages.length);
  };

  const goPrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length,
    );
  };

  const markFailed = (url: string) => {
    setFailedUrls((prev) => ({ ...prev, [url]: true }));
  };

  const isOptimizedHost = (url: string) => {
    if (url.startsWith('/') && !url.startsWith('/api/uploads/')) return true;
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname === 'firebasestorage.googleapis.com' ||
        parsed.hostname === 'storage.googleapis.com' ||
        parsed.hostname === 'picsum.photos'
      );
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4" data-testid="product-image-slider">
      {/* Mode Switcher Bar only when an actual GLB 3D model is uploaded */}
      {showModeSwitcher && (
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="وضع عرض المنتج"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'card3d'}
            onClick={() => setViewMode('card3d')}
            className={`h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'card3d'
                ? 'liquid-btn-glass text-slate-950 dark:text-white ring-1 ring-[var(--lg-primary)]/40'
                : 'glass-interactive text-slate-700 dark:text-slate-300 opacity-80 hover:opacity-100'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>صور المنتج</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'webgl3d'}
            data-testid="toggle-webgl-3d"
            onClick={() => setViewMode('webgl3d')}
            className={`h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'webgl3d'
                ? 'liquid-btn-glass text-slate-950 dark:text-white ring-1 ring-[var(--lg-primary)]/40'
                : 'glass-interactive text-slate-700 dark:text-slate-300 opacity-80 hover:opacity-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>مجسم 3D (GLB)</span>
          </button>
        </div>
      )}

      {/* Active Viewport */}
      {viewMode === 'webgl3d' && canUseWebGL ? (
        <ThreeModelViewer
          imageUrl={currentUrl}
          model3dUrl={model3dUrl}
          productName={productName}
          accentHex={accentHex}
          isDark={isDark}
        />
      ) : (
        <div
          className="relative"
          onPointerMove={handleTiltMove}
          onPointerLeave={handleTiltLeave}
        >
          {/* Realistic soft ground shadow underneath the 3D card */}
          {!lightweight && (
            <div
              ref={shadowRef}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 inset-x-8 h-10 rounded-full blur-2xl opacity-35 dark:opacity-55 transition-transform duration-300 ease-out"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.55) 0%, transparent 72%)',
                transform: 'translate3d(0, 10px, 0) scale(0.94)',
              }}
            />
          )}

          {/* Multi-layer 3D Parallax Card */}
          <div
            ref={cardRef}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] liquid-glass-strong transition-transform duration-300 ease-out"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {currentUrl && !failedUrls[currentUrl] ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentUrl}
                  initial={lightweight ? false : { opacity: 0.3, scale: 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={lightweight ? undefined : { opacity: 0.3 }}
                  transition={{
                    duration: DESIGN_TOKENS.motion.fastMs / 1000,
                    ease: DESIGN_TOKENS.motion.ease,
                  }}
                  className="relative w-full h-full"
                >
                  {isOptimizedHost(currentUrl) ? (
                    <Image
                      src={currentUrl}
                      alt={`${productName} - صورة ${safeIndex + 1}`}
                      fill
                      priority={safeIndex === 0}
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => markFailed(currentUrl)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUrl}
                      alt={`${productName} - صورة ${safeIndex + 1}`}
                      loading={safeIndex === 0 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => markFailed(currentUrl)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 p-6 text-center">
                <Package className="w-10 h-10 mb-2 opacity-60" />
                <span className="text-sm font-medium">{productName}</span>
              </div>
            )}

            {/* Dynamic specular light reflection layer */}
            {!lightweight && (
              <div
                ref={glossRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
              />
            )}

            {/* Inner glass bezel refraction border */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/45 dark:ring-white/15"
            />

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="الصورة السابقة"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full liquid-btn-glass text-slate-900 dark:text-white flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="الصورة التالية"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full liquid-btn-glass text-slate-900 dark:text-white flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3.5 left-3.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-xs font-mono tabular-nums border border-white/15">
                  {safeIndex + 1} / {validImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail Strip */}
      {hasMultiple && (
        <div
          className="flex items-center gap-3 overflow-x-auto pb-1"
          role="tablist"
          aria-label="صور المنتج"
        >
          {validImages.map((imgUrl, idx) => {
            const active = idx === safeIndex;
            return (
              <button
                key={`${imgUrl}-${idx}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`عرض صورة ${idx + 1} من ${validImages.length}`}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-16 shrink-0 rounded-[18px] overflow-hidden border transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-primary)] ${
                  active
                    ? 'border-[var(--lg-primary)] ring-2 ring-[var(--lg-primary)]/30 scale-[1.02]'
                    : 'border-white/50 dark:border-white/15 opacity-70 hover:opacity-100'
                }`}
              >
                {!failedUrls[imgUrl] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => markFailed(imgUrl)}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Package className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

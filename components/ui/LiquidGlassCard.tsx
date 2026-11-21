'use client';

import React, { useRef } from 'react';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
  dense?: boolean;
  reveal?: boolean;
  revealDelay?: number;
  interactiveSheen?: boolean;
  lightweight?: boolean;
}

export function LiquidGlassCard({
  children,
  className = '',
  variant = 'default',
  dense = false,
  reveal = false,
  revealDelay,
  interactiveSheen = true,
  lightweight = false,
  ...rest
}: LiquidGlassCardProps) {
  const sheenRef = useRef<HTMLDivElement>(null);
  const sheenRafRef = useRef<number>(0);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      e.pointerType !== 'mouse' ||
      !interactiveSheen ||
      lightweight ||
      !sheenRef.current
    ) {
      return;
    }
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (sheenRafRef.current) return;
    sheenRafRef.current = window.requestAnimationFrame(() => {
      sheenRafRef.current = 0;
      if (!sheenRef.current) return;
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      sheenRef.current.style.setProperty('--mx', `${x.toFixed(1)}%`);
      sheenRef.current.style.setProperty('--my', `${y.toFixed(1)}%`);
      sheenRef.current.style.opacity = '1';
    });
  };

  const handlePointerLeave = () => {
    if (sheenRafRef.current) {
      window.cancelAnimationFrame(sheenRafRef.current);
      sheenRafRef.current = 0;
    }
    if (!sheenRef.current) return;
    sheenRef.current.style.opacity = '0';
  };

  const surfaceClass =
    variant === 'strong'
      ? 'glass liquid-glass-strong'
      : variant === 'subtle'
        ? 'glass liquid-glass-subtle'
        : 'glass';

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-glass-reveal={reveal ? '' : undefined}
      data-glass-delay={
        reveal && typeof revealDelay === 'number' ? String(revealDelay) : undefined
      }
      className={`rounded-[22px] ${surfaceClass} ${dense ? 'glass-dense' : ''} ${className}`}
      {...rest}
    >
      {/* Dynamic pointer-reactive reflective specular sheen */}
      {interactiveSheen && !lightweight && (
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 z-[1]"
          style={{
            background:
              'radial-gradient(420px circle at var(--mx, 50%) var(--my, 20%), rgba(255, 255, 255, 0.22), transparent 62%)',
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

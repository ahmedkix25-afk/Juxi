'use client';

import React, { useRef } from 'react';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
  interactiveSheen?: boolean;
  lightweight?: boolean;
}

export function LiquidGlassCard({
  children,
  className = '',
  variant = 'default',
  interactiveSheen = true,
  lightweight = false,
  ...rest
}: LiquidGlassCardProps) {
  const sheenRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveSheen || lightweight || !sheenRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    sheenRef.current.style.setProperty('--mx', `${x.toFixed(1)}%`);
    sheenRef.current.style.setProperty('--my', `${y.toFixed(1)}%`);
    sheenRef.current.style.opacity = '1';
  };

  const handlePointerLeave = () => {
    if (!sheenRef.current) return;
    sheenRef.current.style.opacity = '0';
  };

  const surfaceClass =
    variant === 'strong'
      ? 'liquid-glass-strong'
      : variant === 'subtle'
        ? 'liquid-glass-subtle'
        : 'liquid-glass';

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative overflow-hidden rounded-[28px] transition-colors duration-300 ${surfaceClass} ${className}`}
      {...rest}
    >
      {/* Soft top edge light refraction */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-white/80 dark:via-white/30 to-transparent"
      />

      {/* Dynamic pointer-reactive reflective specular sheen */}
      {interactiveSheen && !lightweight && (
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(460px circle at var(--mx, 50%) var(--my, 20%), rgba(255, 255, 255, 0.24), transparent 62%)',
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

'use client';

import React from 'react';

interface MeshGradientBackdropProps {
  lightweight?: boolean;
}

export function MeshGradientBackdrop({
  lightweight = false,
}: MeshGradientBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--lg-canvas)] transition-colors duration-500"
    >
      {/* Calm Base Mesh Gradient */}
      <div
        className="absolute inset-0 opacity-90 dark:opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(at 88% 12%, rgba(var(--lg-primary-rgb), 0.16) 0px, transparent 52%),
            radial-gradient(at 14% 24%, rgba(var(--lg-secondary-rgb), 0.14) 0px, transparent 54%),
            radial-gradient(at 72% 86%, rgba(var(--lg-secondary-rgb), 0.10) 0px, transparent 56%),
            radial-gradient(at 18% 82%, rgba(var(--lg-primary-rgb), 0.11) 0px, transparent 50%)
          `,
        }}
      />

      {/* Slowly Animated Ambient Light Blobs (disabled in lightweight mode) */}
      {!lightweight && (
        <>
          <div
            className="animate-blob-slow absolute -top-24 right-[-6%] w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full blur-3xl opacity-35 dark:opacity-25"
            style={{
              background:
                'radial-gradient(circle, rgba(var(--lg-primary-rgb), 0.52) 0%, transparent 70%)',
            }}
          />
          <div
            className="animate-blob-slower absolute top-[38%] -left-24 w-[380px] h-[380px] sm:w-[520px] sm:h-[520px] rounded-full blur-3xl opacity-30 dark:opacity-22"
            style={{
              background:
                'radial-gradient(circle, rgba(var(--lg-secondary-rgb), 0.48) 0%, transparent 70%)',
            }}
          />
        </>
      )}
    </div>
  );
}

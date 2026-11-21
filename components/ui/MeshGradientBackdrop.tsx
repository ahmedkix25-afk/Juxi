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
      {/* Calm Layered Mesh Gradient (Fixed behind entire page so glass blur stands out) */}
      <div
        className="absolute inset-0 opacity-100 dark:opacity-85"
        style={{
          backgroundImage: `
            radial-gradient(at 88% 12%, rgba(var(--lg-primary-rgb), 0.24) 0px, transparent 52%),
            radial-gradient(at 12% 24%, rgba(var(--lg-secondary-rgb), 0.22) 0px, transparent 54%),
            radial-gradient(at 74% 84%, rgba(var(--lg-secondary-rgb), 0.16) 0px, transparent 56%),
            radial-gradient(at 18% 82%, rgba(var(--lg-primary-rgb), 0.18) 0px, transparent 52%)
          `,
        }}
      />

      {/* Slowly Animated Ambient Light Blobs with Compositor Parallax */}
      {!lightweight && (
        <>
          <div
            data-testid="parallax-blob-a"
            className="animate-blob-slow absolute -top-24 right-[-6%] w-[440px] h-[440px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl opacity-45 dark:opacity-35"
            style={{
              background:
                'radial-gradient(circle, rgba(var(--lg-primary-rgb), 0.58) 0%, transparent 70%)',
            }}
          />
          <div
            data-testid="parallax-blob-b"
            className="animate-blob-slower absolute top-[34%] -left-24 w-[400px] h-[400px] sm:w-[560px] sm:h-[560px] rounded-full blur-3xl opacity-40 dark:opacity-30"
            style={{
              background:
                'radial-gradient(circle, rgba(var(--lg-secondary-rgb), 0.54) 0%, transparent 70%)',
            }}
          />
          <div
            data-testid="parallax-blob-c"
            className="animate-blob-mid absolute -bottom-24 right-[26%] w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full blur-3xl opacity-32 dark:opacity-25"
            style={{
              background:
                'radial-gradient(circle, rgba(var(--lg-primary-rgb), 0.44) 0%, rgba(var(--lg-secondary-rgb), 0.24) 45%, transparent 72%)',
            }}
          />
        </>
      )}
    </div>
  );
}

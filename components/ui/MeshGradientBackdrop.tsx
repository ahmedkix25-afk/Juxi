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
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--lg-canvas)] transition-colors duration-300 [contain:strict]"
    >
      {/* Calm Layered Mesh Gradient (Fixed behind entire page so glass blur stands out) */}
      <div
        className="absolute inset-0 opacity-100 dark:opacity-85"
        style={{
          backgroundImage: `
            radial-gradient(at 88% 12%, rgba(var(--lg-primary-rgb), 0.24) 0px, transparent 54%),
            radial-gradient(at 12% 24%, rgba(var(--lg-secondary-rgb), 0.22) 0px, transparent 56%),
            radial-gradient(at 74% 84%, rgba(var(--lg-secondary-rgb), 0.16) 0px, transparent 58%),
            radial-gradient(at 18% 82%, rgba(var(--lg-primary-rgb), 0.18) 0px, transparent 54%)
          `,
        }}
      />

      {/* Slowly Animated Ambient Light Blobs with Separate Compositor Parallax Wrappers
          (Multi-stop Gaussian radial falloff gives velvety blur-3xl softness with zero live filter GPU tax) */}
      {!lightweight && (
        <>
          <div
            data-parallax-layer="a"
            className="absolute -top-28 right-[-8%] w-[520px] h-[520px] sm:w-[700px] sm:h-[700px] will-change-transform"
          >
            <div
              data-testid="parallax-blob-a"
              className="animate-blob-slow w-full h-full rounded-full opacity-55 dark:opacity-42"
              style={{
                background:
                  'radial-gradient(circle, rgba(var(--lg-primary-rgb), 0.56) 0%, rgba(var(--lg-primary-rgb), 0.34) 26%, rgba(var(--lg-primary-rgb), 0.14) 50%, rgba(var(--lg-primary-rgb), 0.03) 68%, transparent 76%)',
              }}
            />
          </div>

          <div
            data-parallax-layer="b"
            className="absolute top-[30%] -left-28 w-[480px] h-[480px] sm:w-[660px] sm:h-[660px] will-change-transform"
          >
            <div
              data-testid="parallax-blob-b"
              className="animate-blob-slower w-full h-full rounded-full opacity-50 dark:opacity-38"
              style={{
                background:
                  'radial-gradient(circle, rgba(var(--lg-secondary-rgb), 0.52) 0%, rgba(var(--lg-secondary-rgb), 0.30) 26%, rgba(var(--lg-secondary-rgb), 0.12) 50%, rgba(var(--lg-secondary-rgb), 0.03) 68%, transparent 76%)',
              }}
            />
          </div>

          <div
            data-parallax-layer="c"
            className="absolute -bottom-28 right-[22%] w-[440px] h-[440px] sm:w-[580px] sm:h-[580px] will-change-transform"
          >
            <div
              data-testid="parallax-blob-c"
              className="animate-blob-mid w-full h-full rounded-full opacity-42 dark:opacity-32"
              style={{
                background:
                  'radial-gradient(circle, rgba(var(--lg-primary-rgb), 0.42) 0%, rgba(var(--lg-secondary-rgb), 0.24) 30%, rgba(var(--lg-secondary-rgb), 0.09) 54%, transparent 74%)',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React from 'react';

interface DepthRevealProps {
  children: React.ReactNode;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function DepthReveal({
  children,
  delay = 0,
  disabled = false,
  className = '',
}: DepthRevealProps) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      data-glass-reveal=""
      data-glass-delay={delay > 0 ? String(Math.round(delay * 1000)) : undefined}
      className={className}
    >
      {children}
    </div>
  );
}

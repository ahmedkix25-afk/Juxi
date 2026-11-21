'use client';

import React from 'react';
import Link, { type LinkProps } from 'next/link';

export type LiquidButtonVariant = 'primary' | 'glass' | 'danger';

const VARIANT_CLASSES: Record<LiquidButtonVariant, string> = {
  primary: 'liquid-btn-glass text-slate-950 dark:text-white font-bold',
  glass: 'liquid-btn-glass text-slate-900 dark:text-white font-semibold',
  danger: 'liquid-btn-glass text-red-600 dark:text-red-400 font-bold',
};

interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: LiquidButtonVariant;
  reducedMotion?: boolean;
}

export function LiquidButton({
  children,
  variant = 'primary',
  className = '',
  reducedMotion = false,
  disabled,
  ...props
}: LiquidButtonProps) {
  return (
    <button
      disabled={disabled}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      className={`rounded-full inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

interface LiquidLinkButtonProps extends LinkProps {
  children: React.ReactNode;
  variant?: LiquidButtonVariant;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
  'aria-label'?: string;
  title?: string;
}

export function LiquidLinkButton({
  children,
  variant = 'primary',
  className = '',
  style,
  target,
  rel,
  'aria-label': ariaLabel,
  title,
  ...linkProps
}: LiquidLinkButtonProps) {
  return (
    <Link
      {...linkProps}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      title={title}
      style={style}
      className={`rounded-full inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}

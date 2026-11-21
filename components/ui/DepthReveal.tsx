'use client';

import React from 'react';
import { motion } from 'motion/react';
import { DESIGN_TOKENS } from '@/lib/design-tokens';

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
    <motion.div
      initial={{ opacity: 0.9, y: 16, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: DESIGN_TOKENS.motion.baseMs / 1000,
        delay,
        ease: DESIGN_TOKENS.motion.ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

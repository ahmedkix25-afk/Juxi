'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Flame } from 'lucide-react';
import { getCountdownParts, type CountdownParts } from '@/lib/design-tokens';

interface DiscountCountdownProps {
  countdownEndsAt?: string;
  remainingStock?: number;
}

export function DiscountCountdown({
  countdownEndsAt,
  remainingStock,
}: DiscountCountdownProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    if (!countdownEndsAt) return;
    queueMicrotask(() => setNowMs(Date.now()));
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [countdownEndsAt]);

  const parts: CountdownParts =
    nowMs !== null
      ? getCountdownParts(countdownEndsAt, nowMs)
      : { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

  const showCountdown = Boolean(countdownEndsAt && !parts.expired);
  const showStock =
    typeof remainingStock === 'number' &&
    remainingStock > 0 &&
    remainingStock <= 30;

  if (!showCountdown && !showStock) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      data-testid="offer-urgency-bar"
      className="rounded-[22px] liquid-glass-subtle px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
    >
      {showStock && (
        <div className="inline-flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
          <Flame className="w-4 h-4 shrink-0" />
          <span>
            متبقي{' '}
            <strong className="font-mono tabular-nums">{remainingStock}</strong>{' '}
            قطع فقط بالمخزون الحالي
          </span>
        </div>
      )}

      {showCountdown && (
        <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Clock className="w-4 h-4 text-[var(--lg-primary)] shrink-0" />
          <span className="text-slate-600 dark:text-slate-400">ينتهي العرض خلال:</span>
          <span
            dir="ltr"
            className="font-mono font-bold tabular-nums text-slate-950 dark:text-white tracking-tight"
          >
            {parts.days > 0 ? `${parts.days}d ` : ''}
            {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
          </span>
        </div>
      )}
    </div>
  );
}

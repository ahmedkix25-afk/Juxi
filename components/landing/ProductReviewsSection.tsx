'use client';

import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { DepthReveal } from '@/components/ui/DepthReveal';
import type { ProductReview } from '@/lib/types';

interface ProductReviewsSectionProps {
  reviews: ProductReview[];
  lightweight?: boolean;
}

export function ProductReviewsSection({
  reviews,
  lightweight = false,
}: ProductReviewsSectionProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const avgRating = (
    reviews.reduce((sum, r) => sum + Math.min(5, Math.max(1, r.rating)), 0) /
    reviews.length
  ).toFixed(1);

  return (
    <DepthReveal disabled={lightweight}>
      <section
        aria-labelledby="reviews-heading"
        data-testid="product-reviews-section"
        className="space-y-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2
              id="reviews-heading"
              className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white glass-text-shadow"
            >
              آراء وتجارب العملاء
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 glass-text-shadow">
              تقييمات حقيقية من عملاء استلموا المنتج وعاينوه قبل الدفع
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100 glass-text-shadow">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-mono font-bold tabular-nums">{avgRating}</span>
            <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">
              ·
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {reviews.length} تقييمات
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((review, idx) => (
            <LiquidGlassCard
              key={review.id}
              dense
              reveal={!lightweight}
              revealDelay={idx * 45}
              lightweight={lightweight}
              className="p-5 flex flex-col justify-between gap-4 rounded-[22px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-0.5"
                    aria-label={`تقييم ${review.rating} من 5`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {review.dateLabel && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {review.dateLabel}
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {review.comment}
                </p>

                {review.imageUrl && (
                  <div className="relative aspect-[16/10] w-full rounded-[18px] overflow-hidden border border-white/50 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.imageUrl}
                      alt={`صورة تجربة ${review.authorName}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {review.authorName}
                  {review.city ? (
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {' '}
                      · {review.city}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex items-center gap-1 text-[var(--lg-primary)] font-medium shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  عميل موثق
                </span>
              </div>
            </LiquidGlassCard>
          ))}
        </div>
      </section>
    </DepthReveal>
  );
}

'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { DepthReveal } from '@/components/ui/DepthReveal';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import type { ProductFaq } from '@/lib/types';

interface ProductFaqSectionProps {
  faqs: ProductFaq[];
  lightweight?: boolean;
}

export function ProductFaqSection({
  faqs,
  lightweight = false,
}: ProductFaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <DepthReveal disabled={lightweight}>
      <section
        aria-labelledby="faq-heading"
        data-testid="product-faq-section"
        className="space-y-4"
      >
        <div className="space-y-1">
          <h2
            id="faq-heading"
            className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white glass-text-shadow"
          >
            الأسئلة الشائعة
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 glass-text-shadow">
            إجابات واضحة حول الشحن، المعاينة، والضمان قبل تأكيد طلبك
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openId === item.id;
            const panelId = `faq-panel-${item.id}`;
            return (
              <LiquidGlassCard
                key={item.id}
                dense
                reveal={!lightweight}
                revealDelay={idx * 65}
                lightweight={lightweight}
                interactiveSheen={false}
                className="rounded-[20px]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full px-5 py-4 text-right flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-primary)] rounded-[24px]"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[var(--lg-primary)]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      initial={
                        lightweight ? false : { height: 0, opacity: 0 }
                      }
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={lightweight ? undefined : { height: 0, opacity: 0 }}
                      transition={{
                        duration: DESIGN_TOKENS.motion.fastMs / 1000,
                        ease: DESIGN_TOKENS.motion.ease,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-white/10">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </LiquidGlassCard>
            );
          })}
        </div>
      </section>
    </DepthReveal>
  );
}

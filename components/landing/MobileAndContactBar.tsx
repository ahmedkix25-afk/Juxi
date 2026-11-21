'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle, ArrowDown } from 'lucide-react';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { formatPrice, normalizePhoneDigits } from '@/lib/commerce';

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
  productName: string;
}

export function FloatingWhatsAppButton({
  whatsappNumber,
  productName,
}: FloatingWhatsAppProps) {
  const digits = normalizePhoneDigits(whatsappNumber || '').replace(/^\+/, '');
  if (!digits) return null;

  const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(
    `مرحباً، لدي استفسار بخصوص المنتج: ${productName}`,
  )}`;

  return (
    <a
      href={waHref}
      target="_blank"
      rel="noreferrer"
      data-testid="floating-whatsapp-button"
      aria-label="تواصل معنا عبر واتساب"
      title="تواصل عبر واتساب"
      className="fixed bottom-[84px] lg:bottom-6 right-4 sm:right-6 z-40 h-11 sm:h-12 px-4 sm:px-5 rounded-full liquid-btn-glass text-slate-900 dark:text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <MessageCircle className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline">استفسار واتساب</span>
    </a>
  );
}

interface MobileStickyOrderBarProps {
  price: number;
  originalPrice: number;
  currency: string;
  formElementId?: string;
  lightweight?: boolean;
}

export function MobileStickyOrderBar({
  price,
  originalPrice,
  currency,
  formElementId = 'order-form',
  lightweight = false,
}: MobileStickyOrderBarProps) {
  const [hideBar, setHideBar] = useState(false);

  useEffect(() => {
    const target = document.getElementById(formElementId);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setHideBar(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.15 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [formElementId]);

  const scrollToForm = () => {
    const target = document.getElementById(formElementId);
    if (target) {
      target.scrollIntoView({
        behavior: lightweight ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  if (hideBar) return null;

  return (
    <div
      data-testid="mobile-sticky-order-bar"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden px-4 pb-3.5 pt-2 pointer-events-none"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="pointer-events-auto glass liquid-glass-strong rounded-full px-4 py-2 min-w-0 leading-tight">
          <div className="text-sm sm:text-base font-bold text-[var(--lg-primary)] tabular-nums truncate">
            {formatPrice(price, currency)}
          </div>
          {originalPrice > price && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-through tabular-nums">
              {formatPrice(originalPrice, currency)}
            </div>
          )}
        </div>

        <LiquidButton
          type="button"
          reducedMotion={lightweight}
          onClick={scrollToForm}
          className="pointer-events-auto h-11 px-5 text-sm shrink-0 whitespace-nowrap"
        >
          <span>اطلب الآن</span>
          <ArrowDown className="w-4 h-4" />
        </LiquidButton>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { CheckCircle2, Truck, Banknote, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import type { Order } from '@/lib/types';
import { formatPrice, formatArabicDateTime } from '@/lib/commerce';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface OrderConfirmationProps {
  order: Order;
  lightweight?: boolean;
  onOrderAnother: () => void;
}

export function OrderConfirmation({
  order,
  lightweight = false,
  onOrderAnother,
}: OrderConfirmationProps) {
  return (
    <motion.div
      initial={lightweight ? false : { opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: DESIGN_TOKENS.motion.baseMs / 1000,
        ease: DESIGN_TOKENS.motion.ease,
      }}
      data-testid="order-confirmation"
      className="max-w-xl mx-auto my-8 sm:my-14 px-4"
    >
      <LiquidGlassCard
        variant="strong"
        lightweight={lightweight}
        className="p-6 sm:p-10"
      >
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(var(--lg-primary-rgb), 0.14)',
                color: 'var(--lg-primary)',
              }}
            >
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              شكراً لك، تم استلام طلبك بنجاح
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              تم تسجيل طلبك وسيتواصل معك فريق التوصيل قريباً لتأكيد موعد الشحن.
            </p>
          </div>

          <div className="border-t border-b border-slate-200/70 dark:border-white/10 py-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">
                رقم الطلب
              </span>
              <span className="font-mono font-semibold text-slate-950 dark:text-white tabular-nums">
                {order.orderCode}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">المنتج</span>
              <span className="font-semibold text-slate-950 dark:text-white text-left">
                {order.productName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">الكمية</span>
              <span className="font-mono font-semibold text-slate-950 dark:text-white tabular-nums">
                {order.quantity}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">
                الإجمالي المطلوب عند الاستلام
              </span>
              <span className="text-base font-bold text-[var(--lg-primary)] tabular-nums">
                {formatPrice(order.totalPrice, order.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">
                تاريخ الطلب
              </span>
              <span className="text-slate-700 dark:text-slate-200">
                {formatArabicDateTime(order.createdAt)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-200 liquid-glass-subtle rounded-[22px] p-4">
            <div className="font-semibold text-slate-950 dark:text-white">
              بيانات التوصيل
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>
                {order.customerName} ·{' '}
                <span className="font-mono tabular-nums" dir="ltr">
                  {order.customerPhone}
                </span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>
                {order.governorate} — {order.address}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Banknote className="w-4 h-4 text-[var(--lg-primary)] mt-0.5 shrink-0" />
              <span className="text-[var(--lg-primary)] font-semibold">
                طريقة الدفع: الدفع نقداً عند الاستلام (COD)
              </span>
            </div>
          </div>

          <div className="pt-2 text-center">
            <LiquidButton
              type="button"
              variant="glass"
              reducedMotion={lightweight}
              onClick={onOrderAnother}
              className="h-11 px-6 text-sm"
            >
              <span>العودة إلى صفحة المنتج</span>
            </LiquidButton>
          </div>
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}

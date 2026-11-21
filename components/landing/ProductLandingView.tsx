'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Banknote,
  RotateCcw,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { fetchProductBySlug, createCustomerOrder } from '@/lib/firestore-service';
import {
  GOVERNORATES,
  calculateDiscountPercent,
  calculateOrderTotal,
  checkDuplicateOrderCooldown,
  formatPrice,
  isLikelySpamSubmission,
  normalizePhoneDigits,
  validateOrderInput,
  type DuplicateOrderRecord,
} from '@/lib/commerce';
import {
  buildProductThemeCssVars,
  deriveAdaptiveTheme,
} from '@/lib/design-tokens';
import {
  detectDeviceRenderProfile,
  type DeviceRenderProfile,
} from '@/lib/device-capability';
import type { Order, OrderFormInput, Product } from '@/lib/types';
import { ThemeToggle, useTheme } from '@/components/ThemeProvider';
import { MeshGradientBackdrop } from '@/components/ui/MeshGradientBackdrop';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { DepthReveal } from '@/components/ui/DepthReveal';
import { Product3DShowcase } from './Product3DShowcase';
import { DiscountCountdown } from './DiscountCountdown';
import { ProductReviewsSection } from './ProductReviewsSection';
import { ProductFaqSection } from './ProductFaqSection';
import {
  FloatingWhatsAppButton,
  MobileStickyOrderBar,
} from './MobileAndContactBar';
import { OrderConfirmation } from './OrderConfirmation';

interface ProductLandingViewProps {
  slug: string;
}

const DUPLICATE_STORAGE_KEY = 'safha-recent-orders-v1';

const INITIAL_FORM: OrderFormInput = {
  customerName: '',
  customerPhone: '',
  governorate: '',
  address: '',
  quantity: 1,
  notes: '',
  honeypot: '',
};

const DEFAULT_DEVICE_PROFILE: DeviceRenderProfile = {
  prefersReducedMotion: false,
  isLowEndDevice: false,
  supportsWebGL2: true,
  isSoftwareWebGL: false,
  shouldUseLightweightMode: false,
};

function readRecentOrders(): DuplicateOrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DUPLICATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DuplicateOrderRecord =>
        item &&
        typeof item.productSlug === 'string' &&
        typeof item.phone === 'string' &&
        typeof item.submittedAt === 'number',
    );
  } catch {
    return [];
  }
}

function recordSubmittedOrder(productSlug: string, phone: string): void {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    const existing = readRecentOrders().filter(
      (rec) => now - rec.submittedAt < 60 * 60 * 1000,
    );
    existing.unshift({
      productSlug,
      phone: normalizePhoneDigits(phone),
      submittedAt: now,
    });
    window.localStorage.setItem(
      DUPLICATE_STORAGE_KEY,
      JSON.stringify(existing.slice(0, 20)),
    );
  } catch {
    // Ignore storage failures in restricted browsing modes
  }
}

export function ProductLandingView({ slug }: ProductLandingViewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loadedState, setLoadedState] = useState<{
    slug: string;
    product: Product | null;
  } | null>(null);
  const [deviceProfile, setDeviceProfile] = useState<DeviceRenderProfile>(
    DEFAULT_DEVICE_PROFILE,
  );
  const [form, setForm] = useState<OrderFormInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const formMountedAtRef = useRef<number>(0);

  useEffect(() => {
    formMountedAtRef.current = Date.now();
    queueMicrotask(() => {
      setDeviceProfile(detectDeviceRenderProfile());
    });
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    fetchProductBySlug(slug)
      .then((res) => {
        if (!cancelled) {
          setLoadedState({ slug, product: res });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedState({ slug, product: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loading = loadedState?.slug !== slug;
  const product = loadedState?.slug === slug ? loadedState.product : null;

  const adaptiveTheme = useMemo(
    () => deriveAdaptiveTheme(product?.slug ?? slug, product?.theme),
    [product?.slug, product?.theme, slug],
  );

  const themeCssVars = useMemo(
    () => buildProductThemeCssVars(adaptiveTheme) as React.CSSProperties,
    [adaptiveTheme],
  );

  const lightweight = deviceProfile.shouldUseLightweightMode;

  if (loading) {
    return (
      <main
        style={themeCssVars}
        className="relative min-h-screen py-8 px-4 overflow-x-clip"
      >
        <MeshGradientBackdrop lightweight />
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-6 space-y-5">
            <div className="aspect-[4/3] w-full rounded-[28px] liquid-glass" />
            <div className="h-9 w-3/4 rounded-[18px] liquid-glass" />
            <div className="h-24 w-full rounded-[24px] liquid-glass" />
          </div>
          <div className="lg:col-span-6">
            <div className="h-[560px] w-full rounded-[28px] liquid-glass" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main
        style={themeCssVars}
        className="relative min-h-screen flex items-center justify-center p-6 overflow-x-clip"
      >
        <MeshGradientBackdrop lightweight={lightweight} />
        <div className="fixed top-4 left-4 z-30">
          <ThemeToggle />
        </div>
        <LiquidGlassCard
          variant="strong"
          lightweight={lightweight}
          className="max-w-md w-full p-8 text-center"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">
              هذا المنتج غير متوفر حالياً
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              ربما انتهى العرض أو تم إيقاف هذه الصفحة مؤقتاً. يرجى التحقق من الرابط
              المباشر للمنتج.
            </p>
          </div>
        </LiquidGlassCard>
      </main>
    );
  }

  if (confirmedOrder) {
    return (
      <main
        style={themeCssVars}
        className="relative min-h-screen py-6 overflow-x-clip"
      >
        <MeshGradientBackdrop lightweight={lightweight} />
        <div className="fixed top-4 left-4 z-30">
          <ThemeToggle />
        </div>
        <OrderConfirmation
          order={confirmedOrder}
          lightweight={lightweight}
          onOrderAnother={() => {
            setConfirmedOrder(null);
            setForm(INITIAL_FORM);
            setErrors({});
            setSubmitError('');
            formMountedAtRef.current = Date.now();
          }}
        />
      </main>
    );
  }

  const discountPct = calculateDiscountPercent(
    product.price,
    product.originalPrice,
  );
  const totalPrice = calculateOrderTotal(product.price, form.quantity);

  const updateField = <K extends keyof OrderFormInput>(
    field: K,
    value: OrderFormInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Anti-spam check: honeypot field + minimum human dwell time
    const elapsedMs = Date.now() - (formMountedAtRef.current || 0);
    if (isLikelySpamSubmission(form.honeypot, elapsedMs, 800)) {
      setSubmitError(
        'تم اكتشاف إرسال تلقائي سريع. يرجى مراجعة بياناتك ثم الضغط على اطلب الآن مرة أخرى.',
      );
      return;
    }

    const validation = validateOrderInput(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Duplicate order cooldown protection (same phone + same product)
    const duplicateCheck = checkDuplicateOrderCooldown(
      readRecentOrders(),
      product.slug,
      form.customerPhone,
    );
    if (duplicateCheck.blocked && duplicateCheck.message) {
      setSubmitError(duplicateCheck.message);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCustomerOrder(product, form);
      recordSubmittedOrder(product.slug, form.customerPhone);
      setConfirmedOrder(created);
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          behavior: lightweight ? 'auto' : 'smooth',
        });
      }
    } catch {
      setSubmitError(
        'تعذر إرسال الطلب حالياً. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={themeCssVars}
      data-testid="product-landing-page"
      data-theme-primary={adaptiveTheme.primaryColor}
      className="relative min-h-screen pt-6 pb-24 lg:py-10 px-4 overflow-x-clip"
    >
      <MeshGradientBackdrop lightweight={lightweight} />

      {/* Minimal Floating Theme Toggle (Zero navigation menu, zero footer, zero links to other products) */}
      <div className="max-w-5xl mx-auto flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Core Conversion Fold (Strict Order: 1. 3D Images -> 2. Name -> 3. Price -> 4. Description & Features -> 5. Form -> 6. Order Now CTA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Product Showcase Column */}
          <section
            aria-label="تفاصيل المنتج"
            className="lg:col-span-6 space-y-6"
          >
            {/* 1. Interactive 3D Product Showcase (GLB or Layered 3D Parallax Card) */}
            <Product3DShowcase
              images={product.images}
              model3dUrl={product.model3dUrl}
              productName={product.name}
              accentHex={adaptiveTheme.primaryColor}
              isDark={isDark}
              lightweight={lightweight}
              supportsWebGL2={deviceProfile.supportsWebGL2}
            />

            {/* 2. Product Name + Optional Countdown / Remaining Stock */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white leading-tight tracking-tight">
                {product.name}
              </h1>

              <DiscountCountdown
                countdownEndsAt={product.countdownEndsAt}
                remainingStock={product.remainingStock}
              />

              {/* 3. Liquid Glass Pricing Section */}
              <LiquidGlassCard
                variant="strong"
                lightweight={lightweight}
                className="p-5 sm:p-6"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                      <span
                        data-testid="product-price"
                        className="text-3xl sm:text-4xl font-bold text-[var(--lg-primary)] tabular-nums"
                      >
                        {formatPrice(product.price, product.currency)}
                      </span>

                      {product.originalPrice > product.price && (
                        <span className="text-lg text-slate-400 dark:text-slate-500 line-through tabular-nums">
                          {formatPrice(product.originalPrice, product.currency)}
                        </span>
                      )}
                    </div>

                    {discountPct > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--lg-primary)]">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        وفر {discountPct}% الآن
                      </span>
                    )}
                  </div>

                  {/* Trust Indicators: COD · Fast Shipping · Return Guarantee */}
                  <div
                    data-testid="trust-indicators"
                    className="grid grid-cols-3 gap-2 pt-3.5 border-t border-slate-200/70 dark:border-white/10 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-[var(--lg-primary)] shrink-0" />
                      <span>الدفع عند الاستلام</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[var(--lg-secondary)] shrink-0" />
                      <span>شحن سريع</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-[var(--lg-primary)] shrink-0" />
                      <span>ضمان الاسترجاع</span>
                    </div>
                  </div>
                </div>
              </LiquidGlassCard>
            </div>

            {/* 4. Short Description & Product Features */}
            <DepthReveal disabled={lightweight}>
              <LiquidGlassCard
                lightweight={lightweight}
                className="p-5 sm:p-6"
              >
                <div className="space-y-5">
                  <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>

                  {product.features.length > 0 && (
                    <div className="pt-4 border-t border-slate-200/70 dark:border-white/10 space-y-3">
                      <h2 className="text-base font-bold text-slate-950 dark:text-white">
                        أبرز مميزات المنتج
                      </h2>
                      <ul className="space-y-2.5">
                        {product.features.map((feature, idx) => (
                          <li
                            key={`${feature}-${idx}`}
                            className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed"
                          >
                            <span
                              className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor:
                                  'rgba(var(--lg-primary-rgb), 0.14)',
                                color: 'var(--lg-primary)',
                              }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </LiquidGlassCard>
            </DepthReveal>
          </section>

          {/* 5. Liquid Glass Order Form & 6. Liquid "Order Now" Button */}
          <section
            id="order-form"
            aria-label="نموذج الطلب"
            className="lg:col-span-6 lg:sticky lg:top-6 scroll-mt-4"
          >
            <LiquidGlassCard
              variant="strong"
              lightweight={lightweight}
              className="p-5 sm:p-6"
            >
              <div className="space-y-4">
                <div className="space-y-0.5 border-b border-slate-200/70 dark:border-white/10 pb-3.5">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    سجّل بياناتك لإتمام الطلب
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    الدفع عند الاستلام فقط — بدون أي رسوم مسبقة أو بطاقة بنكية
                  </p>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    data-testid="order-submit-error"
                    className="p-3 rounded-[16px] bg-red-500/12 dark:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-200 text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-3"
                >
                  {/* Anti-Spam Honeypot Field (hidden from real users, visible to automated bots) */}
                  <div
                    aria-hidden="true"
                    className="sr-only"
                  >
                    <label htmlFor="website_url">الموقع الإلكتروني</label>
                    <input
                      id="website_url"
                      name="website_url"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.honeypot || ''}
                      onChange={(e) => updateField('honeypot', e.target.value)}
                    />
                  </div>

                  {/* Customer Name + Egyptian Mobile (2-col on sm+ so full form + CTA fits above desktop fold) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="customerName"
                        className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                      >
                        الاسم الكامل <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customerName"
                        name="customerName"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={form.customerName}
                        onChange={(e) =>
                          updateField('customerName', e.target.value)
                        }
                        placeholder="مثال: محمد أحمد علي"
                        className={`liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                          errors.customerName ? '!border-red-500/80' : ''
                        }`}
                      />
                      {errors.customerName && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                          {errors.customerName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="customerPhone"
                        className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                      >
                        رقم الموبايل <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        dir="ltr"
                        required
                        maxLength={24}
                        value={form.customerPhone}
                        onChange={(e) =>
                          updateField('customerPhone', e.target.value)
                        }
                        placeholder="01012345678"
                        className={`liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-right font-mono tabular-nums text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                          errors.customerPhone ? '!border-red-500/80' : ''
                        }`}
                      />
                      {errors.customerPhone && (
                        <p
                          data-testid="phone-error-message"
                          className="text-xs font-medium text-red-600 dark:text-red-400"
                        >
                          {errors.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Governorate */}
                  <div className="space-y-1">
                    <label
                      htmlFor="governorate"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      المحافظة <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="governorate"
                      name="governorate"
                      required
                      value={form.governorate}
                      onChange={(e) =>
                        updateField('governorate', e.target.value)
                      }
                      className={`liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white dark:bg-slate-900/90 ${
                        errors.governorate ? '!border-red-500/80' : ''
                      }`}
                    >
                      <option value="">اختر المحافظة</option>
                      {GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                    {errors.governorate && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.governorate}
                      </p>
                    )}
                  </div>

                  {/* Full Detailed Address */}
                  <div className="space-y-1">
                    <label
                      htmlFor="address"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      العنوان التفصيلي <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={2}
                      required
                      maxLength={400}
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="الحي / المنطقة، اسم الشارع، رقم العقار والشقة، وأقرب علامة مميزة"
                      className={`liquid-input w-full p-3 rounded-[16px] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none ${
                        errors.address ? '!border-red-500/80' : ''
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      الكمية <span className="text-red-500">*</span>
                    </label>
                    <div className="liquid-input flex items-center justify-between gap-4 rounded-[16px] px-3 h-11">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="زيادة الكمية"
                          onClick={() =>
                            updateField(
                              'quantity',
                              Math.min(99, form.quantity + 1),
                            )
                          }
                          className="w-8 h-8 rounded-full liquid-btn-glass text-slate-900 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min={1}
                          max={99}
                          value={form.quantity}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            updateField(
                              'quantity',
                              Number.isNaN(parsed)
                                ? 1
                                : Math.min(99, Math.max(1, parsed)),
                            );
                          }}
                          className="w-12 text-center font-mono font-bold text-slate-950 dark:text-white bg-transparent tabular-nums focus:outline-none"
                        />
                        <button
                          type="button"
                          aria-label="تقليل الكمية"
                          onClick={() =>
                            updateField(
                              'quantity',
                              Math.max(1, form.quantity - 1),
                            )
                          }
                          className="w-8 h-8 rounded-full liquid-btn-glass text-slate-900 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      <span
                        data-testid="order-total-preview"
                        className="text-sm font-bold text-[var(--lg-primary)] font-mono tabular-nums"
                      >
                        الإجمالي: {formatPrice(totalPrice, product.currency)}
                      </span>
                    </div>
                    {errors.quantity && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  {/* Notes (Optional) */}
                  <div className="space-y-1">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      ملاحظات إضافية{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        (اختياري)
                      </span>
                    </label>
                    <input
                      id="notes"
                      name="notes"
                      type="text"
                      maxLength={500}
                      value={form.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="مثال: يفضل التوصيل بعد الساعة 5 مساءً"
                      className="liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Compact Glass Order Summary Box */}
                  <div className="rounded-[18px] liquid-glass-subtle px-4 py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-950 dark:text-white">
                        المبلغ الإجمالي
                      </span>
                      <span className="text-xs block">
                        الدفع نقداً عند الاستلام (COD)
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[var(--lg-primary)] font-mono tabular-nums">
                      {formatPrice(totalPrice, product.currency)}
                    </span>
                  </div>

                  {/* 6. Liquid Spring-Animated "Order Now" Button */}
                  <LiquidButton
                    type="submit"
                    disabled={submitting}
                    reducedMotion={lightweight}
                    data-testid="order-submit-button"
                    className="w-full h-13 px-6 text-base"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري تأكيد الطلب...</span>
                      </>
                    ) : (
                      <span>اطلب الآن — الدفع عند الاستلام</span>
                    )}
                  </LiquidButton>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-[var(--lg-primary)] shrink-0" />
                    بياناتك محمية وتُستخدم لتأكيد الطلب وتوصيل الشحنة فقط
                  </p>
                </form>
              </div>
            </LiquidGlassCard>
          </section>
        </div>

        {/* Customer Reviews with Images & Comments */}
        {product.reviews && product.reviews.length > 0 && (
          <ProductReviewsSection
            reviews={product.reviews}
            lightweight={lightweight}
          />
        )}

        {/* Glass Accordion FAQ Section */}
        {product.faqs && product.faqs.length > 0 && (
          <ProductFaqSection faqs={product.faqs} lightweight={lightweight} />
        )}
      </div>

      {/* Floating WhatsApp Contact Button */}
      <FloatingWhatsAppButton
        whatsappNumber={product.whatsappNumber}
        productName={product.name}
      />

      {/* Mobile Sticky Bottom Order Bar (hides automatically when #order-form is visible) */}
      <MobileStickyOrderBar
        price={product.price}
        originalPrice={product.originalPrice}
        currency={product.currency}
        lightweight={lightweight}
      />
    </main>
  );
}

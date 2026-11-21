'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Box,
} from 'lucide-react';
import { fetchActiveProducts } from '@/lib/firestore-service';
import { SEED_PRODUCTS } from '@/lib/seed-products';
import { calculateDiscountPercent, formatPrice } from '@/lib/commerce';
import { deriveAdaptiveTheme } from '@/lib/design-tokens';
import type { Product } from '@/lib/types';
import { ThemeToggle } from '@/components/ThemeProvider';
import { MeshGradientBackdrop } from '@/components/ui/MeshGradientBackdrop';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidLinkButton } from '@/components/ui/LiquidButton';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchActiveProducts()
      .then((list) => {
        if (active && list.length > 0) {
          setProducts(list);
        }
      })
      .catch(() => {
        // Keep seeded previews
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCopy = async (slug: string) => {
    if (typeof window === 'undefined') return;
    await navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col overflow-x-clip">
      <MeshGradientBackdrop />

      {/* Clean 3-Zone Liquid Glass Header (Portal Only — Customer /p/[slug] pages have ZERO nav/footer) */}
      <header className="sticky top-0 z-20 px-4 pt-3">
        <div className="max-w-6xl mx-auto liquid-glass-strong rounded-[24px] px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0"
          >
            صفحة بيع
          </Link>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#live-pages"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              صفحات المعاينة
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              مميزات النظام
            </a>
            <Link
              href="/admin/products"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              إدارة المنتجات
            </Link>
            <Link
              href="/admin/orders"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              سجل الطلبات
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <LiquidLinkButton
              href="/admin"
              className="h-10 px-5 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <span>لوحة التحكم</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </LiquidLinkButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Focused Liquid Glass Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-14 sm:pb-16">
          <LiquidGlassCard variant="strong" className="p-7 sm:p-12 rounded-[32px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5">
                <p className="text-xs sm:text-sm font-bold text-[var(--lg-primary)]">
                  نظام صفحات البيع المباشر · Liquid Glass &amp; 3D · الدفع عند الاستلام
                </p>
                <h1 className="text-3xl sm:text-5xl font-bold text-slate-950 dark:text-white leading-[1.2] tracking-tight">
                  صفحة هبوط مستقلة لكل منتج بتجربة زجاجية ثلاثية الأبعاد
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  أنشئ رابط بيع مباشر فريد لكل منتج بصيغة{' '}
                  <code
                    className="inline-block font-mono text-sm text-slate-900 dark:text-slate-100 bg-slate-900/6 dark:bg-white/10 px-2 py-0.5 rounded-lg"
                    dir="ltr"
                  >
                    /p/product-slug
                  </code>{' '}
                  خالٍ تماماً من القوائم والروابط المشتتة، بألوان تتكيف مع كل منتج،
                  مع استقبال فوري للطلبات وتنبيهات لحظية وتصدير Excel.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <LiquidLinkButton
                    href="/admin"
                    className="h-12 px-6 text-sm whitespace-nowrap"
                  >
                    <span>الدخول إلى لوحة التحكم</span>
                    <ArrowLeft className="w-4 h-4" />
                  </LiquidLinkButton>
                  {products[0] && (
                    <LiquidLinkButton
                      href={`/p/${products[0].slug}`}
                      variant="glass"
                      className="h-12 px-5 text-sm whitespace-nowrap"
                    >
                      <span>معاينة صفحة بيع حية</span>
                      <ExternalLink className="w-4 h-4" />
                    </LiquidLinkButton>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="liquid-glass-subtle rounded-[24px] p-6 space-y-4">
                  <div className="text-sm font-bold text-slate-950 dark:text-white">
                    مسار العميل داخل صفحة المنتج
                  </div>
                  <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                    <li className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-2.5">
                      <span>01. عرض ثلاثي الأبعاد ومعرض صور</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        3D &amp; Parallax
                      </span>
                    </li>
                    <li className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-2.5">
                      <span>02. السعر، المؤقت، ومؤشرات الثقة</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Liquid Glass
                      </span>
                    </li>
                    <li className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-2.5">
                      <span>03. نموذج طلب ذكي بحماية من التكرار</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        تحقق 01x
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>04. تقييمات العملاء والأسئلة الشائعة</span>
                      <span className="text-xs font-bold text-[var(--lg-primary)]">
                        تحويل مباشر
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        </section>

        {/* Active Independent Landing Pages Preview Section */}
        <section
          id="live-pages"
          className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                صفحات الهبوط الجاهزة للمعاينة
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                افتح أي رابط لتجربة صفحة العميل المستقلة بألوانها المتكيفة ووضع
                العرض ثلاثي الأبعاد والوضع النهاري/الليلي
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-sm font-bold text-[var(--lg-primary)] hover:opacity-80 inline-flex items-center gap-1 transition-opacity"
            >
              إضافة منتج جديد من لوحة التحكم
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => {
              const discount = calculateDiscountPercent(
                product.price,
                product.originalPrice,
              );
              const palette = deriveAdaptiveTheme(product.slug, product.theme);

              return (
                <LiquidGlassCard
                  key={product.slug}
                  variant="strong"
                  className="flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900 border-b border-white/40 dark:border-white/10">
                    {product.images[0] &&
                    !product.images[0].startsWith('/api/uploads/') ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 560px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-2 font-mono" dir="ltr">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: palette.primaryColor }}
                          />
                          /p/{product.slug}
                        </span>
                        {discount > 0 && (
                          <span
                            className="font-bold"
                            style={{ color: palette.primaryColor }}
                          >
                            خصم {discount}%
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-3">
                        <span
                          className="text-xl font-bold font-mono tabular-nums"
                          style={{ color: palette.primaryColor }}
                        >
                          {formatPrice(product.price, product.currency)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm font-mono text-slate-400 dark:text-slate-500 line-through tabular-nums">
                            {formatPrice(product.originalPrice, product.currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-3 border-t border-slate-200/70 dark:border-white/10">
                      <LiquidLinkButton
                        href={`/p/${product.slug}`}
                        className="flex-1 h-11 px-5 text-sm whitespace-nowrap"
                      >
                        <span>فتح صفحة البيع</span>
                        <ExternalLink className="w-4 h-4" />
                      </LiquidLinkButton>
                      <button
                        type="button"
                        onClick={() => handleCopy(product.slug)}
                        aria-label={`نسخ رابط ${product.name}`}
                        className="h-11 px-4 rounded-full liquid-btn-glass text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {copiedSlug === product.slug ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </LiquidGlassCard>
              );
            })}
          </div>
        </section>

        {/* Core Capabilities Section */}
        <section id="capabilities" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <LiquidGlassCard className="p-6">
              <div className="space-y-2.5">
                <Box className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  عرض 3D وتصميم Liquid Glass
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  أسطح زجاجية بتمويه متدرج وتفاعل 3D مع حركة المؤشر والهاتف مع
                  وضع خفيف تلقائي للأجهزة الاقتصادية.
                </p>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-6">
              <div className="space-y-2.5">
                <Bell className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  إشعارات لحظية متعددة القنوات
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  تنبيه صوتي وعداد فوري داخل لوحة التحكم مع دعم الإرسال الفوري عبر
                  تيليجرام وواتساب والبريد الإلكتروني.
                </p>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-6">
              <div className="space-y-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  فلترة وتصدير Excel
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  تصفية الطلبات حسب المنتج أو الحالة أو التاريخ وتصديرها بضغطة زر
                  لملف Excel منسق جاهز لشركات الشحن.
                </p>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-6">
              <div className="space-y-2.5">
                <ShieldCheck className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  حماية ذكية من السبام والتكرار
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  تحقق ذكي لأرقام الموبايل المصرية، ومنع الطلبات المكررة، وحماية
                  Honeypot بجانب قواعد أمان Firestore.
                </p>
              </div>
            </LiquidGlassCard>
          </div>
        </section>
      </main>

      <footer className="px-4 pb-6">
        <div className="max-w-6xl mx-auto liquid-glass-subtle rounded-[22px] px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span>
            صفحة بيع — نظام صفحات الهبوط المستقلة للمنتجات بنظام الدفع عند الاستلام
          </span>
          <Link
            href="/admin"
            className="hover:text-slate-950 dark:hover:text-white font-bold transition-colors"
          >
            دخول المسؤول
          </Link>
        </div>
      </footer>
    </div>
  );
}

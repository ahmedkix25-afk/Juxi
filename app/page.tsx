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

      {/* Scroll-Aware Floating Header — Pure Layout Only (No Large Wrapper Box; Each Control Has Its Own Glass) */}
      <header
        data-scroll-header=""
        className="sticky top-0 z-40 px-4 sm:px-6 py-3.5"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <Link
            href="/"
            className="h-10 px-4 rounded-full glass-interactive inline-flex items-center text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0"
          >
            <span>صفحة بيع</span>
          </Link>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-100"
          >
            <a
              href="#live-pages"
              className="h-9 px-4 rounded-full glass-interactive inline-flex items-center hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              <span>صفحات المعاينة</span>
            </a>
            <a
              href="#capabilities"
              className="h-9 px-4 rounded-full glass-interactive inline-flex items-center hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              <span>مميزات النظام</span>
            </a>
            <Link
              href="/admin/products"
              className="h-9 px-4 rounded-full glass-interactive inline-flex items-center hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              <span>إدارة المنتجات</span>
            </Link>
            <Link
              href="/admin/orders"
              className="h-9 px-4 rounded-full glass-interactive inline-flex items-center hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              <span>سجل الطلبات</span>
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
        {/* Open Hero Layout — No Large Wrapping Container Box */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-14 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5" data-glass-reveal="">
              <p className="text-xs sm:text-sm font-bold text-[var(--lg-primary)] glass-text-shadow">
                نظام صفحات البيع المباشر · Liquid Glass &amp; 3D · الدفع عند الاستلام
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-950 dark:text-white leading-[1.2] tracking-tight glass-text-shadow">
                صفحة هبوط مستقلة لكل منتج بتجربة زجاجية ثلاثية الأبعاد
              </h1>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl glass-text-shadow">
                أنشئ رابط بيع مباشر فريد لكل منتج بصيغة{' '}
                <code
                  className="inline-block font-mono text-sm text-slate-900 dark:text-slate-100 glass rounded-full px-2.5 py-0.5 align-middle"
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

            {/* Individual Floating Liquid Glass Journey Card */}
            <div className="lg:col-span-5">
              <LiquidGlassCard
                variant="strong"
                reveal
                revealDelay={70}
                className="p-6 rounded-[24px] space-y-4"
              >
                <div className="text-sm font-bold text-slate-950 dark:text-white">
                  مسار العميل داخل صفحة المنتج
                </div>
                <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  <li className="flex items-center justify-between border-b border-slate-300/40 dark:border-white/10 pb-2.5">
                    <span>01. عرض ثلاثي الأبعاد ومعرض صور</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      3D &amp; Parallax
                    </span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-300/40 dark:border-white/10 pb-2.5">
                    <span>02. السعر، المؤقت، ومؤشرات الثقة</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Liquid Glass
                    </span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-300/40 dark:border-white/10 pb-2.5">
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
              </LiquidGlassCard>
            </div>
          </div>
        </section>

        {/* Active Independent Landing Pages Preview Section */}
        <section
          id="live-pages"
          className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-6"
        >
          <div
            data-glass-reveal=""
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white glass-text-shadow">
                صفحات الهبوط الجاهزة للمعاينة
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 glass-text-shadow">
                افتح أي رابط لتجربة صفحة العميل المستقلة بألوانها المتكيفة ووضع
                العرض ثلاثي الأبعاد والوضع النهاري/الليلي
              </p>
            </div>
            <Link
              href="/admin/products"
              className="h-10 px-4 rounded-full glass-interactive text-sm font-bold text-[var(--lg-primary)] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>إضافة منتج جديد من لوحة التحكم</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product, index) => {
              const discount = calculateDiscountPercent(
                product.price,
                product.originalPrice,
              );
              const palette = deriveAdaptiveTheme(product.slug, product.theme);

              return (
                <LiquidGlassCard
                  key={product.slug}
                  variant="strong"
                  reveal
                  revealDelay={index * 75}
                  className="flex flex-col rounded-[24px]"
                >
                  <div className="relative aspect-[4/3] w-full bg-slate-100/70 dark:bg-slate-900/70 border-b border-white/40 dark:border-white/10">
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
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
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

                    <div className="flex items-center gap-2.5 pt-3 border-t border-slate-300/40 dark:border-white/10">
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

        {/* Core Capabilities Section — 4 Individual Staggered Glass Cards */}
        <section id="capabilities" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <LiquidGlassCard reveal revealDelay={0} dense className="p-6 rounded-[22px]">
              <div className="space-y-2.5">
                <Box className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  عرض 3D وتصميم Liquid Glass
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  أسطح زجاجية بتمويه متدرج وتفاعل 3D مع حركة المؤشر والهاتف مع
                  وضع خفيف تلقائي للأجهزة الاقتصادية.
                </p>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard reveal revealDelay={70} dense className="p-6 rounded-[22px]">
              <div className="space-y-2.5">
                <Bell className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  إشعارات لحظية متعددة القنوات
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  تنبيه صوتي وعداد فوري داخل لوحة التحكم مع دعم الإرسال الفوري عبر
                  تيليجرام وواتساب والبريد الإلكتروني.
                </p>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard reveal revealDelay={140} dense className="p-6 rounded-[22px]">
              <div className="space-y-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  فلترة وتصدير Excel
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  تصفية الطلبات حسب المنتج أو الحالة أو التاريخ وتصديرها بضغطة زر
                  لملف Excel منسق جاهز لشركات الشحن.
                </p>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard reveal revealDelay={210} dense className="p-6 rounded-[22px]">
              <div className="space-y-2.5">
                <ShieldCheck className="w-5 h-5 text-[var(--lg-primary)]" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  حماية ذكية من السبام والتكرار
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  تحقق ذكي لأرقام الموبايل المصرية، ومنع الطلبات المكررة، وحماية
                  Honeypot بجانب قواعد أمان Firestore.
                </p>
              </div>
            </LiquidGlassCard>
          </div>
        </section>
      </main>

      {/* Open Layout Footer — No Large Container Box */}
      <footer className="px-4 sm:px-6 pb-8 pt-2">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700 dark:text-slate-300">
          <span className="glass-text-shadow">
            صفحة بيع — نظام صفحات الهبوط المستقلة للمنتجات بنظام الدفع عند الاستلام
          </span>
          <Link
            href="/admin"
            className="h-9 px-4 rounded-full liquid-btn-glass inline-flex items-center font-bold text-slate-900 dark:text-white"
          >
            <span>دخول المسؤول</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

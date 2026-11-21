'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAdminData } from '@/components/admin/AdminDataContext';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import {
  toggleProductStatus,
  deleteProduct,
  seedDemoProductsToFirestore,
} from '@/lib/firestore-service';
import { formatPrice } from '@/lib/commerce';
import { deriveAdaptiveTheme } from '@/lib/design-tokens';
import type { Product } from '@/lib/types';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton, LiquidLinkButton } from '@/components/ui/LiquidButton';

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const { products, settings, loadingProducts } = useAdminData();

  const [modalOpen, setModalOpen] = useState(
    () => searchParams.get('new') === '1',
  );
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [recentlyCreated, setRecentlyCreated] = useState<Product | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(
    null,
  );
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const getFullLandingUrl = (slug: string) => {
    if (typeof window === 'undefined') return `/p/${slug}`;
    return `${window.location.origin}/p/${slug}`;
  };

  const handleCopyLink = async (slug: string) => {
    const fullUrl = getFullLandingUrl(slug);
    await navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggleStatus = async (product: Product) => {
    setBusySlug(product.slug);
    try {
      await toggleProductStatus(
        product.slug,
        product.status === 'active' ? 'hidden' : 'active',
      );
    } finally {
      setBusySlug(null);
    }
  };

  const handleDelete = async (slug: string) => {
    setBusySlug(slug);
    try {
      await deleteProduct(slug);
      setConfirmDeleteSlug(null);
      if (recentlyCreated?.slug === slug) {
        setRecentlyCreated(null);
      }
    } finally {
      setBusySlug(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemoProductsToFirestore();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        data-glass-reveal=""
        className="flex flex-wrap items-center justify-between gap-4 pt-1"
      >
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white glass-text-shadow">
            إدارة المنتجات وصفحات الهبوط
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 glass-text-shadow">
            كل منتج يُنشئ تلقائياً صفحة هبوط مستقلة جاهزة للنسخ والإعلانات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {products.length === 0 && !loadingProducts && (
            <LiquidButton
              type="button"
              variant="glass"
              disabled={seeding}
              onClick={handleSeed}
              className="h-11 px-5 text-sm whitespace-nowrap"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[var(--lg-primary)]" />
              )}
              <span>إضافة منتجات تجريبية</span>
            </LiquidButton>
          )}

          <LiquidButton
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="h-11 px-5 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </LiquidButton>
        </div>
      </div>

      {/* Ready-to-copy link banner immediately after creating a product */}
      {recentlyCreated && (
        <LiquidGlassCard
          variant="strong"
          className="p-5 rounded-[22px] border border-[var(--lg-primary)]/30"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="text-sm font-bold text-[var(--lg-primary)]">
                تم إنشاء صفحة الهبوط لـ «{recentlyCreated.name}» بنجاح!
              </div>
              <div
                className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate"
                dir="ltr"
              >
                {getFullLandingUrl(recentlyCreated.slug)}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <LiquidButton
                type="button"
                onClick={() => handleCopyLink(recentlyCreated.slug)}
                className="h-10 px-4 text-xs"
              >
                {copiedSlug === recentlyCreated.slug ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم نسخ الرابط</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ رابط الصفحة</span>
                  </>
                )}
              </LiquidButton>
              <LiquidLinkButton
                href={`/p/${recentlyCreated.slug}`}
                target="_blank"
                variant="glass"
                className="h-10 px-4 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة الصفحة</span>
              </LiquidLinkButton>
            </div>
          </div>
        </LiquidGlassCard>
      )}

      {/* Products Table (Dense Blur for Long Lists) */}
      <LiquidGlassCard variant="strong" dense reveal className="rounded-[24px]">
        {loadingProducts ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            جاري تحميل المنتجات...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full liquid-glass-subtle text-slate-400 mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                لا توجد منتجات بعد
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                أضف أول منتج ليتم توليد صفحة هبوط مستقلة له فوراً مع رابط جاهز
                للنشر.
              </p>
            </div>
            <LiquidButton
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="h-11 px-6 text-sm mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول منتج</span>
            </LiquidButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-900/[0.03] dark:bg-white/[0.03] border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 px-5 font-semibold">المنتج</th>
                  <th className="py-4 px-4 font-semibold">السعر</th>
                  <th className="py-4 px-4 font-semibold">رابط الصفحة</th>
                  <th className="py-4 px-4 font-semibold">الحالة</th>
                  <th className="py-4 px-5 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                {products.map((product) => {
                  const palette = deriveAdaptiveTheme(
                    product.slug,
                    product.theme,
                  );
                  return (
                    <tr
                      key={product.slug}
                      className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-13 h-11 rounded-[14px] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-white/50 dark:border-white/10 shrink-0">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-950 dark:text-white truncate max-w-[240px]">
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {product.images.length} صور ·{' '}
                              {product.features.length} ميزة
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-950 dark:text-white tabular-nums">
                          {formatPrice(product.price, product.currency)}
                        </div>
                        {product.originalPrice > product.price && (
                          <div className="text-xs font-mono text-slate-400 line-through tabular-nums">
                            {formatPrice(product.originalPrice, product.currency)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 truncate max-w-[180px]"
                            dir="ltr"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: palette.primaryColor }}
                            />
                            /p/{product.slug}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(product.slug)}
                            aria-label={`نسخ رابط صفحة ${product.name}`}
                            className="h-9 px-3.5 rounded-full liquid-btn-glass text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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
                          <Link
                            href={`/p/${product.slug}`}
                            target="_blank"
                            aria-label={`فتح صفحة ${product.name}`}
                            className="h-9 w-9 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-100 inline-flex items-center justify-center shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-bold ${
                            product.status === 'active'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {product.status === 'active' ? 'نشط' : 'مخفي'}
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busySlug === product.slug}
                            onClick={() => handleToggleStatus(product)}
                            aria-label={
                              product.status === 'active'
                                ? `إخفاء ${product.name}`
                                : `تفعيل ${product.name}`
                            }
                            title={
                              product.status === 'active'
                                ? 'إيقاف الصفحة مؤقتاً'
                                : 'تفعيل الصفحة'
                            }
                            className="h-9 px-3.5 rounded-full liquid-btn-glass text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            {product.status === 'active' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>إخفاء</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>تفعيل</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setModalOpen(true);
                            }}
                            aria-label={`تعديل ${product.name}`}
                            className="h-9 w-9 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-100 inline-flex items-center justify-center cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteSlug === product.slug ? (
                            <button
                              type="button"
                              disabled={busySlug === product.slug}
                              onClick={() => handleDelete(product.slug)}
                              className="h-9 px-3.5 rounded-full liquid-btn-glass text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                            >
                              <span>تأكيد الحذف</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSlug(product.slug)}
                              aria-label={`حذف ${product.name}`}
                              className="h-9 w-9 rounded-full liquid-btn-glass text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LiquidGlassCard>

      {modalOpen && (
        <ProductFormModal
          initialProduct={editingProduct}
          defaultCurrency={settings.defaultCurrency}
          onClose={() => setModalOpen(false)}
          onSaved={(savedProduct, wasNew) => {
            setModalOpen(false);
            if (wasNew) {
              setRecentlyCreated(savedProduct);
            }
          }}
        />
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          جاري تحميل المنتجات...
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}

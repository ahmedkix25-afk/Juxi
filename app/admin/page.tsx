'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Bell,
  Wallet,
  Package,
} from 'lucide-react';
import { useAdminData } from '@/components/admin/AdminDataContext';
import { seedDemoProductsToFirestore } from '@/lib/firestore-service';
import {
  ORDER_STATUS_LABELS,
  formatPrice,
  formatArabicDateTime,
} from '@/lib/commerce';
import { deriveAdaptiveTheme } from '@/lib/design-tokens';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton, LiquidLinkButton } from '@/components/ui/LiquidButton';

export default function AdminOverviewPage() {
  const { products, orders, settings, loadingProducts, loadingOrders } =
    useAdminData();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const activeProductsCount = products.filter((p) => p.status === 'active').length;
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const confirmedAndDeliveredRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const copyLandingLink = async (slug: string) => {
    if (typeof window === 'undefined') return;
    const fullUrl = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await seedDemoProductsToFirestore();
    } finally {
      setSeeding(false);
    }
  };

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Open Header Action Strip — Pure Layout Only */}
      <div
        data-glass-reveal=""
        className="flex flex-wrap items-center justify-between gap-4 pt-1"
      >
        <div className="space-y-1">
          <p className="text-xs font-bold text-[var(--lg-primary)] glass-text-shadow">
            لوحة المتابعة اللحظية · الدفع عند الاستلام (COD)
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight glass-text-shadow">
            مرحباً بك في إدارة المبيعات المباشرة
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 glass-text-shadow">
            متابعة فورية لصفحات الهبوط النشطة وطلبات العملاء الواردة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!loadingProducts && products.length === 0 && (
            <LiquidButton
              type="button"
              variant="glass"
              disabled={seeding}
              onClick={handleSeedDemo}
              className="h-11 px-5 text-sm whitespace-nowrap"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[var(--lg-primary)]" />
              )}
              <span>إضافة منتجين تجريبيين</span>
            </LiquidButton>
          )}

          <LiquidLinkButton
            href="/admin/products?new=1"
            className="h-11 px-6 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </LiquidLinkButton>
        </div>
      </div>

      {/* KPI Summary Grid (Individual Staggered Liquid Glass Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiquidGlassCard reveal revealDelay={0} dense className="p-5 rounded-[22px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>طلبات جديدة بانتظار التأكيد</span>
              <Bell className="w-4 h-4 text-[var(--lg-primary)]" />
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-[var(--lg-primary)]">
              {loadingOrders ? '—' : newOrdersCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              من أصل {orders.length} إجمالي الطلبات
            </div>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard reveal revealDelay={70} dense className="p-5 rounded-[22px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>إجمالي الطلبات المسجلة</span>
              <ShoppingBag className="w-4 h-4 text-[var(--lg-secondary)]" />
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
              {loadingOrders ? '—' : orders.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              الدفع عند الاستلام (COD)
            </div>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard reveal revealDelay={140} dense className="p-5 rounded-[22px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>قيمة الطلبات النشطة</span>
              <Wallet className="w-4 h-4 text-[var(--lg-primary)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
              {loadingOrders
                ? '—'
                : formatPrice(
                    confirmedAndDeliveredRevenue,
                    settings.defaultCurrency,
                  )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              باستثناء الطلبات الملغاة
            </div>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard reveal revealDelay={210} dense className="p-5 rounded-[22px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>صفحات المنتجات النشطة</span>
              <Package className="w-4 h-4 text-[var(--lg-secondary)]" />
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
              {loadingProducts ? '—' : activeProductsCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              إجمالي المنتجات: {products.length}
            </div>
          </div>
        </LiquidGlassCard>
      </div>

      {/* Main Split: Recent Orders + Active Product Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <LiquidGlassCard
          variant="strong"
          dense
          reveal
          revealDelay={60}
          className="lg:col-span-7 rounded-[24px]"
        >
          <div className="px-6 py-4 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              أحدث الطلبات
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[var(--lg-primary)] hover:opacity-80 inline-flex items-center gap-1 transition-opacity"
            >
              عرض جميع الطلبات
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              لا توجد طلبات مسجلة بعد. شارك رابط أي منتج لبدء استقبال الطلبات
              الفورية.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-900/[0.03] dark:bg-white/[0.03] border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3.5 px-5 font-semibold">العميل</th>
                    <th className="py-3.5 px-4 font-semibold">المنتج</th>
                    <th className="py-3.5 px-4 font-semibold">الإجمالي</th>
                    <th className="py-3.5 px-5 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-950 dark:text-white">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {order.governorate} ·{' '}
                          {formatArabicDateTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                        {order.productName}{' '}
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          ×{order.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--lg-primary)] tabular-nums whitespace-nowrap">
                        {formatPrice(order.totalPrice, order.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {ORDER_STATUS_LABELS[order.status]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LiquidGlassCard>

        <LiquidGlassCard
          variant="strong"
          dense
          reveal
          revealDelay={130}
          className="lg:col-span-5 rounded-[24px]"
        >
          <div className="px-6 py-4 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              روابط صفحات الهبوط
            </h3>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[var(--lg-primary)] hover:opacity-80 inline-flex items-center gap-1 transition-opacity"
            >
              إدارة المنتجات
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                لم يتم إنشاء صفحات منتجات بعد في قاعدة البيانات.
              </p>
              <LiquidButton
                type="button"
                disabled={seeding}
                onClick={handleSeedDemo}
                className="h-10 px-5 text-xs"
              >
                <span>
                  {seeding
                    ? 'جاري الإضافة...'
                    : 'تفعيل المنتجين التجريبيين الآن'}
                </span>
              </LiquidButton>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200/60 dark:divide-white/10">
              {products.slice(0, 6).map((product) => {
                const palette = deriveAdaptiveTheme(product.slug, product.theme);
                return (
                  <li
                    key={product.slug}
                    className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-950 dark:text-white truncate">
                        {product.name}
                      </div>
                      <div
                        className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5"
                        dir="ltr"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: palette.primaryColor }}
                        />
                        /p/{product.slug} ·{' '}
                        {product.status === 'active' ? 'نشط' : 'مخفي'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyLandingLink(product.slug)}
                        aria-label={`نسخ رابط ${product.name}`}
                        className="h-9 px-3.5 rounded-full liquid-btn-glass text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedSlug === product.slug ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                      <Link
                        href={`/p/${product.slug}`}
                        target="_blank"
                        aria-label={`فتح صفحة ${product.name}`}
                        className="h-9 w-9 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-100 inline-flex items-center justify-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </LiquidGlassCard>
      </div>
    </div>
  );
}

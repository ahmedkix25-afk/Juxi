'use client';

import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Search,
  Trash2,
  Phone,
  MessageCircle,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import { useAdminData } from '@/components/admin/AdminDataContext';
import { updateOrderStatus, deleteOrder } from '@/lib/firestore-service';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  buildExcelOrderRows,
  filterOrders,
  formatArabicDateTime,
  formatPrice,
  normalizePhoneDigits,
} from '@/lib/commerce';
import type { OrderFilterParams, OrderStatus } from '@/lib/types';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton } from '@/components/ui/LiquidButton';

const STATUS_TEXT_STYLES: Record<OrderStatus, string> = {
  new: 'text-amber-800 dark:text-amber-300 border-amber-400/50 bg-amber-500/12',
  confirmed: 'text-blue-800 dark:text-blue-300 border-blue-400/50 bg-blue-500/12',
  shipped: 'text-indigo-800 dark:text-indigo-300 border-indigo-400/50 bg-indigo-500/12',
  delivered:
    'text-emerald-800 dark:text-emerald-300 border-emerald-400/50 bg-emerald-500/12',
  cancelled: 'text-red-800 dark:text-red-300 border-red-400/50 bg-red-500/12',
};

const INITIAL_FILTERS: OrderFilterParams = {
  productSlug: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  searchQuery: '',
};

export default function AdminOrdersPage() {
  const { orders, products, loadingOrders } = useAdminData();
  const [filters, setFilters] = useState<OrderFilterParams>(INITIAL_FILTERS);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredOrders = useMemo(
    () => filterOrders(orders, filters),
    [orders, filters],
  );

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      map.set(p.slug, p.name);
    }
    for (const o of orders) {
      if (!map.has(o.productSlug)) {
        map.set(o.productSlug, o.productName);
      }
    }
    return Array.from(map.entries());
  }, [products, orders]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await deleteOrder(orderId);
      setConfirmDeleteId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportExcel = () => {
    const rows = buildExcelOrderRows(filteredOrders);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 16 },
      { wch: 15 },
      { wch: 36 },
      { wch: 26 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 18 },
      { wch: 14 },
      { wch: 24 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `orders-${dateStamp}.xlsx`);
  };

  const hasActiveFilters =
    filters.productSlug !== 'all' ||
    filters.status !== 'all' ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.searchQuery.trim());

  return (
    <div className="space-y-6">
      {/* Open Header Layout — No Wrapping Box */}
      <div
        data-glass-reveal=""
        className="flex flex-wrap items-center justify-between gap-4 pt-1"
      >
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white glass-text-shadow">
            إدارة الطلبات
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 glass-text-shadow">
            تحديث فوري للطلبات الواردة، تغيير الحالة، وتصدير التقارير بصيغة
            Excel
          </p>
        </div>

        <LiquidButton
          type="button"
          disabled={filteredOrders.length === 0}
          onClick={handleExportExcel}
          className="h-11 px-5 text-sm whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>تصدير Excel ({filteredOrders.length})</span>
        </LiquidButton>
      </div>

      {/* Individual Glass Status Tabs (No Outer Wrapper Box) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, status: 'all' }))}
          className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap ${
            filters.status === 'all'
              ? 'liquid-btn-glass text-slate-950 dark:text-white ring-1 ring-[var(--lg-primary)]/40'
              : 'glass-interactive text-slate-700 dark:text-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <span>الكل ({orders.length})</span>
        </button>
        {ORDER_STATUS_ORDER.map((st) => {
          const count = orders.filter((o) => o.status === st).length;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, status: st }))}
              className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap ${
                filters.status === st
                  ? 'liquid-btn-glass text-slate-950 dark:text-white ring-1 ring-[var(--lg-primary)]/40'
                  : 'glass-interactive text-slate-700 dark:text-slate-300 opacity-80 hover:opacity-100'
              }`}
            >
              <span>
                {ORDER_STATUS_LABELS[st]} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Individual Glass Filter Inputs (Pure Grid Layout — No Wrapping Toolbar Box) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="بحث بالاسم، الهاتف، أو رقم الطلب..."
            aria-label="بحث في الطلبات"
            className="liquid-input w-full h-11 pr-10 pl-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>

        <select
          aria-label="تصفية حسب المنتج"
          value={filters.productSlug}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, productSlug: e.target.value }))
          }
          className="liquid-input h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white dark:bg-slate-900/80"
        >
          <option value="all">جميع المنتجات</option>
          {productOptions.map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="date"
          aria-label="من تاريخ"
          value={filters.dateFrom}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
          }
          className="liquid-input h-11 px-3.5 rounded-[16px] text-sm font-mono text-slate-950 dark:text-white"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="إلى تاريخ"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
            }
            className="liquid-input flex-1 min-w-0 h-11 px-3.5 rounded-[16px] text-sm font-mono text-slate-950 dark:text-white"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              aria-label="إعادة تعيين الفلاتر"
              title="مسح الفلاتر"
              className="h-11 w-11 shrink-0 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-100 inline-flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table (Dense Blur for Long Lists) */}
      <LiquidGlassCard variant="strong" dense reveal className="rounded-[24px]">
        {loadingOrders ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            جاري تحميل الطلبات...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-14 h-14 rounded-full liquid-glass-subtle text-slate-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              {orders.length === 0
                ? 'لا توجد طلبات واردة بعد'
                : 'لا توجد طلبات تطابق خيارات التصفية'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {orders.length === 0
                ? 'عند قيام أي عميل بالطلب من صفحة منتج سيظهر هنا فوراً مع إشعار صوتي.'
                : 'جرّب تعديل الفلاتر أو مسح البحث لعرض جميع الطلبات.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-900/[0.03] dark:bg-white/[0.03] border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 px-5 font-semibold">الطلب والتاريخ</th>
                  <th className="py-4 px-4 font-semibold">بيانات العميل</th>
                  <th className="py-4 px-4 font-semibold">العنوان</th>
                  <th className="py-4 px-4 font-semibold">المنتج والكمية</th>
                  <th className="py-4 px-4 font-semibold">الإجمالي</th>
                  <th className="py-4 px-4 font-semibold">الحالة</th>
                  <th className="py-4 px-5 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                {filteredOrders.map((order) => {
                  const cleanPhone = normalizePhoneDigits(order.customerPhone);
                  const waHref = `https://wa.me/${cleanPhone.replace(/^\+/, '')}?text=${encodeURIComponent(
                    `مرحباً ${order.customerName}، نؤكد معك طلبك رقم ${order.orderCode} لمنتج ${order.productName}.`,
                  )}`;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors align-top"
                    >
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-950 dark:text-white tabular-nums">
                          {order.orderCode}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatArabicDateTime(order.createdAt)}
                        </div>
                      </td>

                      <td className="py-4 px-4 min-w-[170px]">
                        <div className="font-semibold text-slate-950 dark:text-white">
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white tabular-nums"
                            dir="ltr"
                          >
                            <Phone className="w-3 h-3" />
                            {order.customerPhone}
                          </a>
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`مراسلة ${order.customerName} عبر واتساب`}
                            title="تواصل واتساب"
                            className="text-emerald-600 dark:text-emerald-400 hover:opacity-80"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-4 px-4 min-w-[200px] max-w-[260px]">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {order.governorate}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {order.address}
                        </div>
                        {order.notes && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ملاحظة: {order.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 min-w-[160px]">
                        <div className="font-semibold text-slate-950 dark:text-white">
                          {order.productName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                          الكمية: {order.quantity} ×{' '}
                          {formatPrice(order.unitPrice, order.currency)}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-[var(--lg-primary)] tabular-nums">
                          {formatPrice(order.totalPrice, order.currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          الدفع عند الاستلام
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <select
                          aria-label={`حالة الطلب ${order.orderCode}`}
                          disabled={updatingId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className={`h-9 px-3 rounded-[14px] border text-xs font-bold focus:outline-none cursor-pointer ${
                            STATUS_TEXT_STYLES[order.status]
                          }`}
                        >
                          {ORDER_STATUS_ORDER.map((st) => (
                            <option
                              key={st}
                              value={st}
                              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                              {ORDER_STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        {confirmDeleteId === order.id ? (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-9 px-3.5 rounded-full liquid-btn-glass text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                          >
                            <span>تأكيد</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(order.id)}
                            aria-label={`حذف الطلب ${order.orderCode}`}
                            className="h-9 w-9 rounded-full liquid-btn-glass text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
}

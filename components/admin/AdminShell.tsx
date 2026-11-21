'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  Menu,
  X,
  ShieldAlert,
  Loader2,
  Phone,
  MapPin,
  Home,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useFirebaseAuth } from '@/components/FirebaseProvider';
import { useAdminData } from './AdminDataContext';
import { formatPrice, formatArabicDateTime } from '@/lib/commerce';
import { ThemeToggle } from '@/components/ThemeProvider';
import { MeshGradientBackdrop } from '@/components/ui/MeshGradientBackdrop';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { DESIGN_TOKENS } from '@/lib/design-tokens';

const NAV_ITEMS = [
  { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'المنتجات والصفحات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
  { href: '/admin/settings', label: 'إعدادات الإشعارات', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, authReady, logout } = useFirebaseAuth();
  const {
    newOrdersCount,
    soundEnabled,
    toggleSound,
    recentAlerts,
    dismissAlert,
  } = useAdminData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (!authReady || isLoginRoute) return;
    if (!user) {
      router.replace('/admin/login');
    }
  }, [authReady, user, isLoginRoute, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!authReady || !user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-x-clip">
        <MeshGradientBackdrop />
        <LiquidGlassCard variant="strong" className="px-6 py-4 rounded-[24px]">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--lg-primary)]" />
            <span>جاري التحقق من صلاحية الدخول...</span>
          </div>
        </LiquidGlassCard>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-x-clip">
        <MeshGradientBackdrop />
        <div className="fixed top-5 left-5 z-30">
          <ThemeToggle />
        </div>
        <LiquidGlassCard
          variant="strong"
          className="max-w-md w-full p-8 rounded-[32px] text-center"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">
              حساب غير مصرح له بالدخول
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              أنت مسجل الدخول بحساب{' '}
              <span
                className="font-mono font-semibold text-slate-950 dark:text-white"
                dir="ltr"
              >
                {user.email}
              </span>
              {!user.emailVerified
                ? '، لكن البريد الإلكتروني غير مُفعّل بعد. يرجى تأكيد البريد الإلكتروني ثم إعادة المحاولة.'
                : '، وهذا الحساب غير مدرج ضمن مسؤولي لوحة التحكم.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <LiquidButton
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace('/admin/login');
                }}
                className="h-11 px-6 text-sm"
              >
                <span>تسجيل الخروج وتبديل الحساب</span>
              </LiquidButton>
            </div>
          </div>
        </LiquidGlassCard>
      </div>
    );
  }

  const activeNav =
    NAV_ITEMS.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    ) || NAV_ITEMS[0];

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav className="space-y-1.5" aria-label="قائمة لوحة التحكم">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const showCounter = item.href === '/admin/orders' && newOrdersCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-full text-sm font-semibold whitespace-nowrap ${
              active
                ? 'liquid-btn-glass text-slate-950 dark:text-white'
                : 'glass-interactive text-slate-800 dark:text-slate-200 opacity-85 hover:opacity-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </span>
            {showCounter && (
              <span
                data-testid="sidebar-new-orders-count"
                className="min-w-6 h-5 px-1.5 rounded-full text-xs font-mono font-bold tabular-nums flex items-center justify-center bg-slate-950/10 dark:bg-white/20 text-slate-950 dark:text-white"
              >
                {newOrdersCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="relative min-h-screen flex text-slate-900 dark:text-slate-100 overflow-x-clip">
      <MeshGradientBackdrop />

      {/* Desktop Open-Layout Sidebar — No Large Container Box; Each Item Floats Individually */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 lg:shrink-0 sticky top-0 h-screen p-4">
        <div className="flex flex-col h-full">
          <div className="h-14 px-2 flex items-center justify-between gap-2">
            <Link
              href="/admin"
              className="h-10 px-4 rounded-full glass-interactive inline-flex items-center text-base font-bold text-slate-950 dark:text-white tracking-tight whitespace-nowrap"
            >
              <span>صفحة بيع</span>
            </Link>
            <Link
              href="/"
              title="العودة للرئيسية"
              aria-label="العودة للصفحة الرئيسية"
              className="w-10 h-10 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-200 flex items-center justify-center"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex-1 py-4 px-1 overflow-y-auto">{renderNavLinks()}</div>

          <div className="pt-3 px-1 space-y-2.5">
            <div
              className="text-xs text-slate-600 dark:text-slate-300 truncate px-2 glass-text-shadow"
              dir="ltr"
            >
              {user.email}
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace('/admin/login');
              }}
              className="w-full h-10 flex items-center justify-center gap-2 px-4 text-xs font-semibold text-slate-800 dark:text-slate-100 liquid-btn-glass rounded-full cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Liquid Glass Drawer (Modal Surface) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                duration: DESIGN_TOKENS.motion.fastMs / 1000,
                ease: DESIGN_TOKENS.motion.ease,
              }}
              className="relative z-10 w-72 max-w-[84vw] p-3 h-full flex"
            >
              <div className="glass liquid-glass-strong rounded-[24px] w-full h-full flex flex-col overflow-hidden">
                <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/50 dark:border-white/10">
                  <span className="text-lg font-bold text-slate-950 dark:text-white">
                    صفحة بيع
                  </span>
                  <button
                    type="button"
                    aria-label="إغلاق القائمة"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 p-3.5 overflow-y-auto">
                  {renderNavLinks(() => setMobileMenuOpen(false))}
                </div>
                <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-3">
                  <div
                    className="text-xs text-slate-500 dark:text-slate-400 truncate"
                    dir="ltr"
                  >
                    {user.email}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      router.replace('/admin/login');
                    }}
                    className="w-full h-10 flex items-center justify-center gap-2 px-4 text-xs font-semibold text-slate-800 dark:text-slate-100 liquid-btn-glass rounded-full cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Scroll-Aware Floating Top Header — Pure Layout Only (No Large Bar Wrapper) */}
        <header
          data-scroll-header=""
          className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5"
        >
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                aria-label="فتح القائمة"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-10 h-10 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-100 flex items-center justify-center cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white truncate glass-text-shadow">
                {activeNav.label}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={
                  soundEnabled
                    ? 'كتم صوت إشعارات الطلبات'
                    : 'تفعيل صوت إشعارات الطلبات'
                }
                title={
                  soundEnabled ? 'صوت الإشعارات مفعل' : 'صوت الإشعارات مكتوم'
                }
                className="h-10 px-4 rounded-full liquid-btn-glass text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[var(--lg-primary)]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="hidden sm:inline">
                  {soundEnabled ? 'الصوت مفعل' : 'الصوت مكتوم'}
                </span>
              </button>

              <Link
                href="/admin/orders"
                aria-label={`الطلبات الجديدة: ${newOrdersCount}`}
                className="h-10 px-4 rounded-full liquid-btn-glass text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Bell className="w-4 h-4 text-[var(--lg-primary)]" />
                <span className="hidden sm:inline">طلبات جديدة</span>
                <span className="font-mono font-bold tabular-nums text-[var(--lg-primary)]">
                  {newOrdersCount}
                </span>
              </Link>

              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Live Instant Order Notification Toasts (Liquid Glass) */}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 w-full max-w-sm space-y-3 pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {recentAlerts.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{
                duration: DESIGN_TOKENS.motion.fastMs / 1000,
                ease: DESIGN_TOKENS.motion.ease,
              }}
              className="pointer-events-auto liquid-glass-strong rounded-[24px] p-4 space-y-2.5 text-sm border border-[var(--lg-primary)]/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[var(--lg-primary)]">
                    طلب جديد ({order.orderCode})
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatArabicDateTime(order.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="إغلاق الإشعار"
                  onClick={() => dismissAlert(order.id)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200 border-t border-slate-200/60 dark:border-white/10 pt-2">
                <div className="font-semibold text-slate-950 dark:text-white">
                  {order.productName} × {order.quantity} —{' '}
                  <span className="font-mono text-[var(--lg-primary)] tabular-nums">
                    {formatPrice(order.totalPrice, order.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {order.customerName} ·{' '}
                    <span className="font-mono tabular-nums" dir="ltr">
                      {order.customerPhone}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {order.governorate} — {order.address}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Link
                  href="/admin/orders"
                  onClick={() => dismissAlert(order.id)}
                  className="text-xs font-bold text-[var(--lg-primary)] hover:opacity-80 underline underline-offset-2"
                >
                  فتح جدول الطلبات
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useFirebaseAuth } from '@/components/FirebaseProvider';
import { ThemeToggle } from '@/components/ThemeProvider';
import { MeshGradientBackdrop } from '@/components/ui/MeshGradientBackdrop';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton } from '@/components/ui/LiquidButton';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, authReady, signInWithEmail, signInWithGoogle } =
    useFirebaseAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (authReady && user && isAdmin) {
      router.replace('/admin');
    }
  }, [authReady, user, isAdmin, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/admin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('auth/operation-not-allowed') ||
        msg.includes('auth/configuration-not-found')
      ) {
        setError(
          'مزود البريد وكلمة المرور غير مُفعّل بعد في Firebase Console. يمكنك تفعيله من Authentication → Sign-in method، أو تسجيل الدخول مباشرة بحساب Google أدناه.',
        );
      } else if (
        msg.includes('auth/invalid-credential') ||
        msg.includes('auth/wrong-password') ||
        msg.includes('auth/user-not-found')
      ) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
        setError('تعذر تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/admin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setError('تعذر تسجيل الدخول بحساب Google. حاول مرة أخرى.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-x-clip">
      <MeshGradientBackdrop />

      <div className="fixed top-5 left-5 z-30">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-[var(--lg-primary)]">
            صفحة بيع · بوابة الإدارة الآمنة
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-tight">
            تسجيل دخول لوحة التحكم
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            أدخل بيانات المسؤول لإدارة صفحات المنتجات والطلبات الفورية
          </p>
        </div>

        <LiquidGlassCard variant="strong" className="p-6 sm:p-8 rounded-[32px]">
          <div className="space-y-5">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-[18px] bg-red-500/12 dark:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-200 text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                >
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="liquid-input w-full h-12 pr-10 pl-3.5 rounded-[18px] text-sm text-right text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password"
                    type="password"
                    dir="ltr"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="liquid-input w-full h-12 pr-10 pl-3.5 rounded-[18px] text-sm text-right text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <LiquidButton
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-sm"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>دخول بالبريد وكلمة المرور</span>
              </LiquidButton>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-1 border-t border-slate-200/70 dark:border-white/10" />
              <span className="px-3 text-xs text-slate-400">أو</span>
              <div className="flex-1 border-t border-slate-200/70 dark:border-white/10" />
            </div>

            <LiquidButton
              type="button"
              variant="glass"
              disabled={googleLoading}
              onClick={handleGoogleLogin}
              className="w-full h-12 text-sm"
            >
              {googleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>الدخول السريع بحساب Google المعتمد</span>
            </LiquidButton>
          </div>
        </LiquidGlassCard>

        <div className="text-center">
          <Link
            href="/"
            className="h-9 px-4 rounded-full liquid-btn-glass inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

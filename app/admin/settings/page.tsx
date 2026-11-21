'use client';

import React, { useState } from 'react';
import {
  Save,
  Send,
  Volume2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAdminData } from '@/components/admin/AdminDataContext';
import {
  saveNotificationSettings,
  seedDemoProductsToFirestore,
} from '@/lib/firestore-service';
import { playOrderNotificationSound } from '@/lib/sound';
import type { NotificationSettings } from '@/lib/types';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidButton } from '@/components/ui/LiquidButton';

export default function AdminSettingsPage() {
  const { settings, refreshSettings } = useAdminData();
  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const form = draft ?? settings;
  const setForm = (
    updater: (prev: NotificationSettings) => NotificationSettings,
  ) => {
    setDraft((prev) => updater(prev ?? settings));
  };
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await saveNotificationSettings(form);
      await refreshSettings();
      setDraft(null);
      setFeedback({ type: 'success', text: 'تم حفظ إعدادات الإشعارات بنجاح.' });
    } catch {
      setFeedback({
        type: 'error',
        text: 'تعذر حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      if (form.soundEnabled) {
        playOrderNotificationSound();
      }
      const res = await fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            orderCode: 'ORD-TEST-001',
            customerName: 'عميل تجريبي',
            customerPhone: '01012345678',
            governorate: 'القاهرة',
            address: 'شارع التحرير، عمارة 12',
            productName: 'ساعة التيتانيوم الذكية',
            quantity: 1,
            totalPrice: 1850,
            currency: form.defaultCurrency || 'ج.م',
            notes: 'إشعار تجريبي من لوحة التحكم',
            createdAt: new Date().toISOString(),
          },
          channels: {
            telegramBotToken: form.telegramEnabled ? form.telegramBotToken : '',
            telegramChatId: form.telegramEnabled ? form.telegramChatId : '',
            whatsappPhone: form.whatsappEnabled ? form.whatsappPhone : '',
            whatsappApiKey: form.whatsappEnabled ? form.whatsappApiKey : '',
            notificationEmail: form.emailEnabled ? form.notificationEmail : '',
            webhookUrl: form.webhookUrl,
          },
        }),
      });
      const data = (await res.json()) as {
        sentChannels?: string[];
        errors?: Record<string, string>;
      };
      const sent = data.sentChannels || [];
      if (sent.length > 0) {
        setFeedback({
          type: 'success',
          text: `تم تشغيل صوت التنبيه وإرسال إشعار تجريبي عبر: ${sent.join(', ')}`,
        });
      } else {
        setFeedback({
          type: 'success',
          text: 'تم اختبار تنبيه الصوت داخل اللوحة. لإرسال إشعارات خارجية، فعّل Telegram أو WhatsApp أو Email وأضف بيانات الربط.',
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'تعذر إرسال الإشعار التجريبي.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    setFeedback(null);
    try {
      const count = await seedDemoProductsToFirestore();
      setFeedback({
        type: 'success',
        text:
          count > 0
            ? `تمت إضافة ${count} منتجات تجريبية بنجاح.`
            : 'المنتجات التجريبية موجودة بالفعل في قاعدة البيانات.',
      });
    } catch {
      setFeedback({ type: 'error', text: 'تعذر إضافة المنتجات التجريبية.' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <LiquidGlassCard variant="strong" className="p-6 rounded-[28px]">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">
            إعدادات الإشعارات والمتجر
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            تحكم في تنبيهات لوحة التحكم وربط Telegram و WhatsApp والبريد
            الإلكتروني
          </p>
        </div>
      </LiquidGlassCard>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-[20px] border text-sm flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/12 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-500/12 dark:bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <LiquidGlassCard variant="strong" className="p-6 sm:p-7 rounded-[28px]">
        <form onSubmit={handleSave} className="space-y-6">
          {/* General Store Defaults */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-950 dark:text-white border-b border-slate-200/70 dark:border-white/10 pb-2.5">
              الإعدادات العامة والتنبيه الصوتي
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="store-name"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                >
                  اسم المتجر / المشروع
                </label>
                <input
                  id="store-name"
                  type="text"
                  maxLength={80}
                  value={form.storeName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, storeName: e.target.value }))
                  }
                  className="liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="default-currency"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                >
                  العملة الافتراضية
                </label>
                <input
                  id="default-currency"
                  type="text"
                  maxLength={16}
                  value={form.defaultCurrency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      defaultCurrency: e.target.value,
                    }))
                  }
                  placeholder="ج.م / ر.س / د.إ"
                  className="liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.soundEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      soundEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[var(--lg-primary)] rounded"
                />
                تشغيل صوت تنبيه فوري عند وصول طلب جديد في لوحة التحكم
              </label>
              <button
                type="button"
                onClick={() => playOrderNotificationSound()}
                className="h-9 px-3.5 rounded-full liquid-btn-glass text-xs font-bold text-[var(--lg-primary)] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>تجربة الصوت</span>
              </button>
            </div>
          </div>

          {/* Telegram */}
          <div className="space-y-3 border-t border-slate-200/70 dark:border-white/10 pt-5">
            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-950 dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.telegramEnabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    telegramEnabled: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[var(--lg-primary)] rounded"
              />
              تفعيل إشعارات تيليجرام (Telegram Bot)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                dir="ltr"
                placeholder="Bot Token (from @BotFather)"
                value={form.telegramBotToken}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    telegramBotToken: e.target.value,
                  }))
                }
                className="liquid-input h-11 px-3.5 rounded-[16px] text-xs font-mono text-slate-950 dark:text-white placeholder:text-slate-400"
              />
              <input
                type="text"
                dir="ltr"
                placeholder="Chat ID (e.g. 123456789)"
                value={form.telegramChatId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    telegramChatId: e.target.value,
                  }))
                }
                className="liquid-input h-11 px-3.5 rounded-[16px] text-xs font-mono text-slate-950 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              للتشغيل التلقائي مع كل طلب عميل على السيرفر، أضف{' '}
              <code className="font-mono">TELEGRAM_BOT_TOKEN</code> و{' '}
              <code className="font-mono">TELEGRAM_CHAT_ID</code> في متغيرات
              البيئة على Vercel.
            </p>
          </div>

          {/* WhatsApp */}
          <div className="space-y-3 border-t border-slate-200/70 dark:border-white/10 pt-5">
            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-950 dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.whatsappEnabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    whatsappEnabled: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[var(--lg-primary)] rounded"
              />
              تفعيل إشعارات واتساب (CallMeBot أو WhatsApp Cloud API)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                dir="ltr"
                placeholder="Phone with country code (+2010...)"
                value={form.whatsappPhone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    whatsappPhone: e.target.value,
                  }))
                }
                className="liquid-input h-11 px-3.5 rounded-[16px] text-xs font-mono text-slate-950 dark:text-white placeholder:text-slate-400"
              />
              <input
                type="text"
                dir="ltr"
                placeholder="CallMeBot API Key"
                value={form.whatsappApiKey}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    whatsappApiKey: e.target.value,
                  }))
                }
                className="liquid-input h-11 px-3.5 rounded-[16px] text-xs font-mono text-slate-950 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email & Webhook */}
          <div className="space-y-3 border-t border-slate-200/70 dark:border-white/10 pt-5">
            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-950 dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emailEnabled: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[var(--lg-primary)] rounded"
              />
              تفعيل إشعارات البريد الإلكتروني (Resend) أو Webhook
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="email"
                dir="ltr"
                placeholder="orders-admin@example.com"
                value={form.notificationEmail}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    notificationEmail: e.target.value,
                  }))
                }
                className="liquid-input h-11 px-3.5 rounded-[16px] text-xs font-mono text-slate-950 dark:text-white placeholder:text-slate-400"
              />
              <input
                type="url"
                dir="ltr"
                placeholder="Webhook URL (Make / Zapier / n8n)"
                value={form.webhookUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, webhookUrl: e.target.value }))
                }
                className="liquid-input h-11 px-3.5 rounded-[16px] text-xs font-mono text-slate-950 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <LiquidButton
                type="button"
                variant="glass"
                disabled={testing}
                onClick={handleTestNotification}
                className="h-11 px-4.5 text-xs"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>إرسال إشعار تجريبي</span>
              </LiquidButton>

              <LiquidButton
                type="button"
                variant="glass"
                disabled={seeding}
                onClick={handleSeedDemo}
                className="h-11 px-4.5 text-xs"
              >
                {seeding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[var(--lg-primary)]" />
                )}
                <span>تفعيل المنتجات التجريبية</span>
              </LiquidButton>
            </div>

            <LiquidButton
              type="submit"
              disabled={saving}
              className="h-11 px-6 text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ الإعدادات</span>
            </LiquidButton>
          </div>
        </form>
      </LiquidGlassCard>
    </div>
  );
}

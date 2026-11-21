import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'صفحة بيع — نظام صفحات الهبوط للمنتجات',
  description:
    'نظام متكامل لإنشاء صفحات هبوط بيع مباشر مستقلة لكل منتج بنظام الدفع عند الاستلام مع لوحة تحكم وإشعارات فورية للطلبات.',
  openGraph: {
    title: 'صفحة بيع — نظام صفحات الهبوط للمنتجات',
    description:
      'نظام متكامل لإنشاء صفحات هبوط بيع مباشر مستقلة لكل منتج بنظام الدفع عند الاستلام مع لوحة تحكم وإشعارات فورية للطلبات.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'صفحة بيع — نظام صفحات الهبوط للمنتجات',
    description:
      'نظام متكامل لإنشاء صفحات هبوط بيع مباشر مستقلة لكل منتج بنظام الدفع عند الاستلام مع لوحة تحكم وإشعارات فورية للطلبات.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[var(--lg-canvas)] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 selection:bg-teal-100 selection:text-teal-950 dark:selection:bg-teal-900 dark:selection:text-teal-100"
      >
        <ErrorBoundary>
          <ThemeProvider>
            <FirebaseProvider>{children}</FirebaseProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

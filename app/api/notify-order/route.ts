import { NextRequest, NextResponse } from 'next/server';
import {
  formatOrderNotificationMessage,
  formatPrice,
  formatArabicDateTime,
  type NotificationOrderPayload,
} from '@/lib/commerce';

interface NotifyRequestBody {
  order?: NotificationOrderPayload;
  channels?: {
    telegramBotToken?: string;
    telegramChatId?: string;
    whatsappPhone?: string;
    whatsappApiKey?: string;
    notificationEmail?: string;
    webhookUrl?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NotifyRequestBody;
    const order = body.order;

    if (
      !order ||
      !order.customerName ||
      !order.customerPhone ||
      !order.productName
    ) {
      return NextResponse.json(
        { error: 'بيانات الطلب غير مكتملة' },
        { status: 400 },
      );
    }

    const messageText = formatOrderNotificationMessage(order);
    const sentChannels: string[] = [];
    const errors: Record<string, string> = {};

    // 1. Telegram Bot Notification
    const telegramToken =
      body.channels?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '';
    const telegramChatId =
      body.channels?.telegramChatId || process.env.TELEGRAM_CHAT_ID || '';

    if (telegramToken && telegramChatId) {
      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${encodeURIComponent(telegramToken)}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: messageText,
            }),
          },
        );
        if (tgRes.ok) {
          sentChannels.push('telegram');
        } else {
          errors.telegram = `Telegram HTTP ${tgRes.status}`;
        }
      } catch (e) {
        errors.telegram = e instanceof Error ? e.message : 'Telegram error';
      }
    }

    // 2. WhatsApp Notification (WhatsApp Cloud API or CallMeBot)
    const waCloudToken = process.env.WHATSAPP_CLOUD_TOKEN || '';
    const waCloudPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || '';
    const waPhone =
      body.channels?.whatsappPhone || process.env.WHATSAPP_PHONE || '';
    const waApiKey =
      body.channels?.whatsappApiKey || process.env.WHATSAPP_API_KEY || '';

    if (waCloudToken && waCloudPhoneId && waPhone) {
      try {
        const waRes = await fetch(
          `https://graph.facebook.com/v20.0/${encodeURIComponent(waCloudPhoneId)}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waCloudToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: waPhone.replace(/[^\d]/g, ''),
              type: 'text',
              text: { body: messageText },
            }),
          },
        );
        if (waRes.ok) {
          sentChannels.push('whatsapp');
        } else {
          errors.whatsapp = `WhatsApp Cloud HTTP ${waRes.status}`;
        }
      } catch (e) {
        errors.whatsapp = e instanceof Error ? e.message : 'WhatsApp error';
      }
    } else if (waPhone && waApiKey) {
      try {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(waPhone)}&text=${encodeURIComponent(messageText)}&apikey=${encodeURIComponent(waApiKey)}`;
        const waRes = await fetch(url);
        if (waRes.ok) {
          sentChannels.push('whatsapp');
        } else {
          errors.whatsapp = `CallMeBot HTTP ${waRes.status}`;
        }
      } catch (e) {
        errors.whatsapp = e instanceof Error ? e.message : 'WhatsApp error';
      }
    }

    // 3. Email Notification via Resend API
    const resendKey = process.env.RESEND_API_KEY || '';
    const toEmail =
      body.channels?.notificationEmail ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      '';
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'orders@resend.dev';

    if (resendKey && toEmail) {
      try {
        const htmlBody = `
          <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0f172a; max-width: 560px;">
            <h2 style="margin-bottom: 12px; color: #047857;">طلب جديد — ${order.orderCode}</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #475569;">اسم العميل:</td><td style="padding: 6px 0; font-weight: bold;">${order.customerName}</td></tr>
              <tr><td style="padding: 6px 0; color: #475569;">رقم الهاتف:</td><td style="padding: 6px 0; font-weight: bold;">${order.customerPhone}</td></tr>
              <tr><td style="padding: 6px 0; color: #475569;">العنوان:</td><td style="padding: 6px 0;">${order.governorate} - ${order.address}</td></tr>
              <tr><td style="padding: 6px 0; color: #475569;">المنتج:</td><td style="padding: 6px 0; font-weight: bold;">${order.productName}</td></tr>
              <tr><td style="padding: 6px 0; color: #475569;">الكمية:</td><td style="padding: 6px 0;">${order.quantity}</td></tr>
              <tr><td style="padding: 6px 0; color: #475569;">الإجمالي:</td><td style="padding: 6px 0; font-weight: bold; color: #047857;">${formatPrice(order.totalPrice, order.currency)} (الدفع عند الاستلام)</td></tr>
              <tr><td style="padding: 6px 0; color: #475569;">التاريخ والوقت:</td><td style="padding: 6px 0;">${formatArabicDateTime(order.createdAt)}</td></tr>
              ${order.notes ? `<tr><td style="padding: 6px 0; color: #475569;">ملاحظات:</td><td style="padding: 6px 0;">${order.notes}</td></tr>` : ''}
            </table>
          </div>
        `;
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject: `طلب جديد (${order.orderCode}) — ${order.productName}`,
            text: messageText,
            html: htmlBody,
          }),
        });
        if (emailRes.ok) {
          sentChannels.push('email');
        } else {
          errors.email = `Resend HTTP ${emailRes.status}`;
        }
      } catch (e) {
        errors.email = e instanceof Error ? e.message : 'Email error';
      }
    }

    // 4. Generic Webhook (Zapier / Make / n8n)
    const webhookUrl =
      body.channels?.webhookUrl || process.env.NOTIFICATION_WEBHOOK_URL || '';
    if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
      try {
        const whRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order.created',
            message: messageText,
            order,
          }),
        });
        if (whRes.ok) {
          sentChannels.push('webhook');
        } else {
          errors.webhook = `Webhook HTTP ${whRes.status}`;
        }
      } catch (e) {
        errors.webhook = e instanceof Error ? e.message : 'Webhook error';
      }
    }

    return NextResponse.json({
      ok: true,
      sentChannels,
      errors,
      formattedMessage: messageText,
    });
  } catch {
    return NextResponse.json(
      { error: 'تعذر معالجة طلب الإشعار' },
      { status: 500 },
    );
  }
}

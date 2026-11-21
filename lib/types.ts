import type { ProductThemeColors } from './design-tokens';

export type ProductStatus = 'active' | 'hidden';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface ProductReview {
  id: string;
  authorName: string;
  city?: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  dateLabel?: string;
}

export interface ProductFaq {
  id: string;
  question: string;
  answer: string;
}

export interface Product {
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  currency: string;
  description: string;
  features: string[];
  images: string[];
  status: ProductStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSeedPreview?: boolean;
  // Phase 1 Liquid Glass & 3D Landing Page extensions (optional for full backward compatibility)
  theme?: ProductThemeColors;
  model3dUrl?: string;
  countdownEndsAt?: string;
  remainingStock?: number;
  whatsappNumber?: string;
  reviews?: ProductReview[];
  faqs?: ProductFaq[];
}

export interface ProductFormInput {
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  currency: string;
  description: string;
  features: string[];
  images: string[];
  status: ProductStatus;
  theme?: ProductThemeColors;
  model3dUrl?: string;
  countdownEndsAt?: string;
  remainingStock?: number;
  whatsappNumber?: string;
  reviews?: ProductReview[];
  faqs?: ProductFaq[];
}

export interface Order {
  id: string;
  orderCode: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  notes: string;
  paymentMethod: 'cod';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormInput {
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  quantity: number;
  notes: string;
  honeypot?: string;
}

export interface OrderFilterParams {
  productSlug: string;
  status: 'all' | OrderStatus;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
}

export interface NotificationSettings {
  storeName: string;
  defaultCurrency: string;
  soundEnabled: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  whatsappEnabled: boolean;
  whatsappPhone: string;
  whatsappApiKey: string;
  emailEnabled: boolean;
  notificationEmail: string;
  webhookUrl: string;
  updatedAt?: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  storeName: 'صفحة بيع',
  defaultCurrency: 'ج.م',
  soundEnabled: true,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  whatsappEnabled: false,
  whatsappPhone: '',
  whatsappApiKey: '',
  emailEnabled: false,
  notificationEmail: '',
  webhookUrl: '',
};

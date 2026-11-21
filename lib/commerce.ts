import type {
  Order,
  OrderFilterParams,
  OrderFormInput,
  OrderStatus,
  ProductFormInput,
} from './types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'new',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

export const GOVERNORATES: string[] = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'الغربية',
  'المنوفية',
  'القليوبية',
  'البحيرة',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'دمياط',
  'كفر الشيخ',
  'البحر الأحمر',
  'مطروح',
  'الرياض',
  'جدة',
  'الدمام',
  'مكة المكرمة',
  'المدينة المنورة',
  'دبي',
  'أبوظبي',
  'الشارقة',
  'عمان',
  'الكويت',
  'الدوحة',
  'المنامة',
];

const ARABIC_TO_LATIN_MAP: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 'a',
  و: 'w',
  ؤ: 'o',
  ي: 'y',
  ى: 'a',
  ئ: 'e',
  ء: '',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

export const SLUG_PATTERN = /^[a-z0-9-]+$/;
export const EGYPTIAN_MOBILE_PATTERN = /^01[0125][0-9]{8}$/;
export const DUPLICATE_ORDER_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export function slugifyProductName(input: string): string {
  const trimmed = input.trim().toLowerCase();
  let transliterated = '';
  for (const ch of trimmed) {
    if (ARABIC_TO_LATIN_MAP[ch] !== undefined) {
      transliterated += ARABIC_TO_LATIN_MAP[ch];
    } else {
      transliterated += ch;
    }
  }

  return transliterated
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function calculateDiscountPercent(
  price: number,
  originalPrice: number,
): number {
  if (!Number.isFinite(price) || !Number.isFinite(originalPrice)) return 0;
  if (originalPrice <= price || originalPrice <= 0 || price <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function calculateOrderTotal(unitPrice: number, quantity: number): number {
  const safePrice = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
  const safeQty =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= 99 ? quantity : 1;
  return Math.round(safePrice * safeQty * 100) / 100;
}

export function generateOrderCode(now: Date = new Date()): string {
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${y}${m}${d}-${randomPart}`;
}

export function formatPrice(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return `${formatted} ${currency}`;
}

export function formatArabicDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function normalizePhoneDigits(phone: string): string {
  const digits = phone
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d+]/g, '');

  // Normalize Egyptian international format (+2010... / 002010... / 2010...) to 01xxxxxxxxx
  if (/^\+20(1[0125]\d{8})$/.test(digits)) {
    return `0${digits.slice(3)}`;
  }
  if (/^0020(1[0125]\d{8})$/.test(digits)) {
    return `0${digits.slice(4)}`;
  }
  if (/^20(1[0125]\d{8})$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

export interface EgyptianPhoneValidation {
  valid: boolean;
  normalized: string;
  error?: string;
}

export function validateEgyptianMobile(phone: string): EgyptianPhoneValidation {
  const normalized = normalizePhoneDigits(phone.trim());
  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      error: 'يرجى إدخال رقم الموبايل المصري للتواصل وتأكيد الطلب.',
    };
  }
  if (!normalized.startsWith('01')) {
    return {
      valid: false,
      normalized,
      error: 'رقم الموبايل المصري يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015.',
    };
  }
  if (!/^01[0125]/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'كود الشبكة غير صحيح — يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015.',
    };
  }
  if (normalized.length !== 11 || !EGYPTIAN_MOBILE_PATTERN.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'رقم الموبايل يجب أن يتكون من 11 رقماً بالضبط (مثال: 01012345678).',
    };
  }
  return { valid: true, normalized };
}

export interface DuplicateOrderRecord {
  productSlug: string;
  phone: string;
  submittedAt: number;
}

export interface DuplicateOrderCheckResult {
  blocked: boolean;
  remainingMinutes: number;
  message?: string;
}

export function checkDuplicateOrderCooldown(
  records: DuplicateOrderRecord[],
  productSlug: string,
  phone: string,
  nowMs: number = Date.now(),
  cooldownMs: number = DUPLICATE_ORDER_COOLDOWN_MS,
): DuplicateOrderCheckResult {
  const normalizedPhone = normalizePhoneDigits(phone);
  const matching = records.find(
    (rec) =>
      rec.productSlug === productSlug &&
      normalizePhoneDigits(rec.phone) === normalizedPhone &&
      nowMs - rec.submittedAt < cooldownMs,
  );
  if (!matching) {
    return { blocked: false, remainingMinutes: 0 };
  }
  const remainingMs = Math.max(0, cooldownMs - (nowMs - matching.submittedAt));
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return {
    blocked: true,
    remainingMinutes,
    message: `تم تسجيل طلب لهذا المنتج بنفس الرقم منذ قليل. يرجى الانتظار ${remainingMinutes} دقيقة قبل إرسال طلب جديد، أو تواصل معنا عبر واتساب لتعديل طلبك.`,
  };
}

export function isLikelySpamSubmission(
  honeypotValue: string | undefined,
  elapsedMs: number,
  minDwellMs: number = 1200,
): boolean {
  if (honeypotValue && honeypotValue.trim().length > 0) {
    return true;
  }
  if (Number.isFinite(elapsedMs) && elapsedMs < minDwellMs) {
    return true;
  }
  return false;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateOrderInput(input: OrderFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const name = input.customerName.trim();
  const phoneCheck = validateEgyptianMobile(input.customerPhone);
  const governorate = input.governorate.trim();
  const address = input.address.trim();
  const notes = input.notes.trim();

  if (name.length < 2 || name.length > 100) {
    errors.customerName = 'يرجى إدخال الاسم الكامل (حرفين على الأقل).';
  }
  if (!phoneCheck.valid && phoneCheck.error) {
    errors.customerPhone = phoneCheck.error;
  }
  if (governorate.length < 2 || governorate.length > 60) {
    errors.governorate = 'يرجى اختيار المحافظة.';
  }
  if (address.length < 5 || address.length > 400) {
    errors.address = 'يرجى كتابة العنوان التفصيلي (الشارع، رقم العقار، علامة مميزة).';
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 99) {
    errors.quantity = 'الكمية يجب أن تكون بين 1 و 99.';
  }
  if (notes.length > 500) {
    errors.notes = 'الملاحظات يجب ألا تتجاوز 500 حرف.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProductInput(input: ProductFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const description = input.description.trim();
  const currency = input.currency.trim();
  const features = input.features.map((f) => f.trim()).filter(Boolean);
  const images = input.images.map((i) => i.trim()).filter(Boolean);

  if (name.length < 2 || name.length > 120) {
    errors.name = 'اسم المنتج يجب أن يكون بين حرفين و 120 حرفاً.';
  }
  if (slug.length < 2 || slug.length > 100 || !SLUG_PATTERN.test(slug)) {
    errors.slug =
      'رابط الصفحة يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: smart-watch).';
  }
  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 10000000) {
    errors.price = 'يرجى إدخال سعر بيع صحيح أكبر من صفر.';
  }
  if (
    !Number.isFinite(input.originalPrice) ||
    input.originalPrice < 0 ||
    input.originalPrice > 10000000
  ) {
    errors.originalPrice = 'السعر قبل الخصم غير صالح.';
  }
  if (input.originalPrice > 0 && input.originalPrice <= input.price) {
    errors.originalPrice = 'السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي (أو اتركه فارغاً).';
  }
  if (currency.length < 1 || currency.length > 16) {
    errors.currency = 'يرجى إدخال رمز العملة.';
  }
  if (description.length < 5 || description.length > 2000) {
    errors.description = 'وصف المنتج يجب أن يكون بين 5 و 2000 حرف.';
  }
  if (features.length > 15) {
    errors.features = 'الحد الأقصى للمميزات هو 15 ميزة.';
  }
  if (images.length < 1 || images.length > 8) {
    errors.images = 'يرجى إضافة صورة واحدة على الأقل للمنتج (بحد أقصى 8 صور).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterOrders(orders: Order[], filters: OrderFilterParams): Order[] {
  const q = filters.searchQuery.trim().toLowerCase();
  const fromTs = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
  const toTs = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).getTime() : null;

  return orders.filter((order) => {
    if (filters.productSlug && filters.productSlug !== 'all' && order.productSlug !== filters.productSlug) {
      return false;
    }
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    if (fromTs !== null || toTs !== null) {
      const createdTs = new Date(order.createdAt).getTime();
      if (!Number.isNaN(createdTs)) {
        if (fromTs !== null && createdTs < fromTs) return false;
        if (toTs !== null && createdTs > toTs) return false;
      }
    }
    if (q) {
      const haystack = [
        order.orderCode,
        order.customerName,
        order.customerPhone,
        order.productName,
        order.governorate,
        order.address,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface NotificationOrderPayload {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  notes?: string;
  createdAt: string;
}

export function formatOrderNotificationMessage(order: NotificationOrderPayload): string {
  const fullAddress = `${order.governorate} - ${order.address}`;
  const formattedTime = formatArabicDateTime(order.createdAt);
  const formattedTotal = formatPrice(order.totalPrice, order.currency);

  const lines = [
    `طلب جديد (${order.orderCode})`,
    `العميل: ${order.customerName}`,
    `الهاتف: ${order.customerPhone}`,
    `العنوان: ${fullAddress}`,
    `المنتج: ${order.productName}`,
    `الكمية: ${order.quantity}`,
    `الإجمالي: ${formattedTotal} (الدفع عند الاستلام)`,
    `التاريخ والوقت: ${formattedTime}`,
  ];

  if (order.notes && order.notes.trim().length > 0) {
    lines.push(`ملاحظات: ${order.notes.trim()}`);
  }

  return lines.join('\n');
}

export interface ExcelOrderRow {
  'رقم الطلب': string;
  'تاريخ ووقت الطلب': string;
  'اسم العميل': string;
  'رقم الهاتف': string;
  'المحافظة': string;
  'العنوان التفصيلي': string;
  'المنتج': string;
  'الكمية': number;
  'سعر الوحدة': number;
  'الإجمالي': number;
  'العملة': string;
  'طريقة الدفع': string;
  'الحالة': string;
  'ملاحظات': string;
}

export function buildExcelOrderRows(orders: Order[]): ExcelOrderRow[] {
  return orders.map((o) => ({
    'رقم الطلب': o.orderCode,
    'تاريخ ووقت الطلب': formatArabicDateTime(o.createdAt),
    'اسم العميل': o.customerName,
    'رقم الهاتف': o.customerPhone,
    'المحافظة': o.governorate,
    'العنوان التفصيلي': o.address,
    'المنتج': o.productName,
    'الكمية': o.quantity,
    'سعر الوحدة': o.unitPrice,
    'الإجمالي': o.totalPrice,
    'العملة': o.currency,
    'طريقة الدفع': 'الدفع عند الاستلام',
    'الحالة': ORDER_STATUS_LABELS[o.status] || o.status,
    'ملاحظات': o.notes || '',
  }));
}

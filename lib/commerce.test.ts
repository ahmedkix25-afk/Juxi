import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugifyProductName,
  calculateDiscountPercent,
  calculateOrderTotal,
  validateOrderInput,
  validateEgyptianMobile,
  checkDuplicateOrderCooldown,
  isLikelySpamSubmission,
  validateProductInput,
  filterOrders,
  formatOrderNotificationMessage,
  buildExcelOrderRows,
  generateOrderCode,
} from './commerce';
import {
  buildProductThemeCssVars,
  deriveAdaptiveTheme,
  getCountdownParts,
  hexToRgbTriplet,
} from './design-tokens';
import type { Order } from './types';

test('slugifyProductName handles Arabic, Latin, symbols, and spaces cleanly', () => {
  assert.equal(slugifyProductName('Smart Watch Ultra!'), 'smart-watch-ultra');
  assert.equal(slugifyProductName('ساعة ذكية برو'), 'saaa-dhkya-brw');
  assert.equal(slugifyProductName('  Coffee Maker 2026  '), 'coffee-maker-2026');
  assert.match(slugifyProductName('منتج مميز 100%'), /^[a-z0-9-]+$/);
});

test('calculateDiscountPercent and calculateOrderTotal compute exact figures', () => {
  assert.equal(calculateDiscountPercent(1850, 2450), 24);
  assert.equal(calculateDiscountPercent(500, 500), 0);
  assert.equal(calculateDiscountPercent(500, 0), 0);
  assert.equal(calculateOrderTotal(1850, 2), 3700);
  assert.equal(calculateOrderTotal(19.99, 3), 59.97);
});

test('generateOrderCode produces uppercase schema-compliant reference', () => {
  const code = generateOrderCode(new Date('2026-11-20T12:00:00Z'));
  assert.match(code, /^ORD-261120-[A-Z0-9]{4}$/);
});

test('validateEgyptianMobile accepts valid 010/011/012/015, Arabic numerals, and +20 prefix', () => {
  assert.equal(validateEgyptianMobile('01012345678').valid, true);
  assert.equal(validateEgyptianMobile('01198765432').valid, true);
  assert.equal(validateEgyptianMobile('01255556666').valid, true);
  assert.equal(validateEgyptianMobile('01544443333').valid, true);
  assert.equal(validateEgyptianMobile('٠١٠١٢٣٤٥٦٧٨').normalized, '01012345678');
  assert.equal(validateEgyptianMobile('+201099887766').normalized, '01099887766');

  const wrongPrefix = validateEgyptianMobile('01912345678');
  assert.equal(wrongPrefix.valid, false);
  assert.ok(wrongPrefix.error?.includes('010'));

  const wrongLength = validateEgyptianMobile('0101234');
  assert.equal(wrongLength.valid, false);
  assert.ok(wrongLength.error?.includes('11'));
});

test('checkDuplicateOrderCooldown blocks rapid repeat orders for same phone and product', () => {
  const now = 1_700_000_000_000;
  const records = [
    {
      productSlug: 'smart-watch-ultra',
      phone: '01099887766',
      submittedAt: now - 2 * 60 * 1000, // 2 minutes ago
    },
  ];
  const blocked = checkDuplicateOrderCooldown(
    records,
    'smart-watch-ultra',
    '٠١٠٩٩٨٨٧٧٦٦',
    now,
  );
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.remainingMinutes, 8);

  const differentProduct = checkDuplicateOrderCooldown(
    records,
    'portable-espresso-pro',
    '01099887766',
    now,
  );
  assert.equal(differentProduct.blocked, false);

  const expired = checkDuplicateOrderCooldown(
    records,
    'smart-watch-ultra',
    '01099887766',
    now + 15 * 60 * 1000,
  );
  assert.equal(expired.blocked, false);
});

test('isLikelySpamSubmission catches honeypot fills and instant bot submissions', () => {
  assert.equal(isLikelySpamSubmission('http://spam.bot', 5000), true);
  assert.equal(isLikelySpamSubmission('', 300), true);
  assert.equal(isLikelySpamSubmission('', 2500), false);
});

test('design tokens derive adaptive CSS vars and compute countdown accurately', () => {
  assert.equal(hexToRgbTriplet('#0F766E'), '15, 118, 110');
  const theme = deriveAdaptiveTheme('smart-watch-ultra', {
    primaryColor: '#0F766E',
    secondaryColor: '#2563EB',
  });
  const vars = buildProductThemeCssVars(theme);
  assert.equal(vars['--lg-primary'], '#0F766E');
  assert.equal(vars['--lg-primary-rgb'], '15, 118, 110');

  const now = new Date('2026-11-20T00:00:00.000Z').getTime();
  const cd = getCountdownParts('2026-11-21T02:30:15.000Z', now);
  assert.equal(cd.expired, false);
  assert.equal(cd.days, 1);
  assert.equal(cd.hours, 2);
  assert.equal(cd.minutes, 30);
  assert.equal(cd.seconds, 15);
});

test('validateOrderInput rejects empty/invalid inputs and accepts complete COD form', () => {
  const invalid = validateOrderInput({
    customerName: '',
    customerPhone: '123',
    governorate: '',
    address: 'قصير',
    quantity: 0,
    notes: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.customerPhone);
  assert.ok(invalid.errors.governorate);
  assert.ok(invalid.errors.address);
  assert.ok(invalid.errors.quantity);

  const valid = validateOrderInput({
    customerName: 'أحمد محمود',
    customerPhone: '٠١٠١٢٣٤٥٦٧٨',
    governorate: 'القاهرة',
    address: '15 شارع التحرير، الدور الرابع، بجوار محطة المترو',
    quantity: 2,
    notes: 'الاتصال قبل الوصول بساعة',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('validateProductInput enforces slug regex, prices, and image requirement', () => {
  const bad = validateProductInput({
    name: 'أ',
    slug: 'INVALID SLUG!',
    price: 200,
    originalPrice: 150,
    currency: 'ج.م',
    description: 'قصير',
    features: [],
    images: [],
    status: 'active',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.name);
  assert.ok(bad.errors.slug);
  assert.ok(bad.errors.originalPrice);
  assert.ok(bad.errors.images);

  const good = validateProductInput({
    name: 'ساعة ذكية ألترا',
    slug: 'smart-watch-ultra',
    price: 1850,
    originalPrice: 2450,
    currency: 'ج.م',
    description: 'ساعة ذكية مقاومة للماء مع شاشة عالية الدقة وبطارية طويلة العمر.',
    features: ['بطارية 10 أيام', 'مقاومة للماء'],
    images: ['/images/watch-front.jpg'],
    status: 'active',
  });
  assert.equal(good.valid, true);
});

const sampleOrders: Order[] = [
  {
    id: 'o1',
    orderCode: 'ORD-261119-AA11',
    productSlug: 'smart-watch-ultra',
    productName: 'ساعة التيتانيوم الذكية',
    unitPrice: 1850,
    quantity: 1,
    totalPrice: 1850,
    currency: 'ج.م',
    customerName: 'كريم سعيد',
    customerPhone: '01099887766',
    governorate: 'القاهرة',
    address: 'شارع عباس العقاد، مدينة نصر',
    notes: '',
    paymentMethod: 'cod',
    status: 'new',
    createdAt: '2026-11-19T14:00:00.000Z',
    updatedAt: '2026-11-19T14:00:00.000Z',
  },
  {
    id: 'o2',
    orderCode: 'ORD-261120-BB22',
    productSlug: 'portable-espresso-pro',
    productName: 'ماكينة إسبريسو متنقلة',
    unitPrice: 2290,
    quantity: 2,
    totalPrice: 4580,
    currency: 'ج.م',
    customerName: 'منى علي',
    customerPhone: '01233445566',
    governorate: 'الإسكندرية',
    address: 'شارع فؤاد، محطة الرمل',
    notes: 'توصيل مساءً',
    paymentMethod: 'cod',
    status: 'delivered',
    createdAt: '2026-11-20T18:30:00.000Z',
    updatedAt: '2026-11-20T19:00:00.000Z',
  },
];

test('filterOrders filters accurately by product, status, date range, and search query', () => {
  assert.equal(
    filterOrders(sampleOrders, {
      productSlug: 'smart-watch-ultra',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
    }).length,
    1,
  );

  assert.equal(
    filterOrders(sampleOrders, {
      productSlug: 'all',
      status: 'delivered',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
    })[0].id,
    'o2',
  );

  assert.equal(
    filterOrders(sampleOrders, {
      productSlug: 'all',
      status: 'all',
      dateFrom: '2026-11-20',
      dateTo: '2026-11-20',
      searchQuery: '',
    }).length,
    1,
  );

  assert.equal(
    filterOrders(sampleOrders, {
      productSlug: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '0109988',
    })[0].customerName,
    'كريم سعيد',
  );
});

test('formatOrderNotificationMessage includes all 7 required order fields', () => {
  const msg = formatOrderNotificationMessage(sampleOrders[1]);
  assert.ok(msg.includes('منى علي'));
  assert.ok(msg.includes('01233445566'));
  assert.ok(msg.includes('الإسكندرية'));
  assert.ok(msg.includes('شارع فؤاد'));
  assert.ok(msg.includes('ماكينة إسبريسو متنقلة'));
  assert.ok(msg.includes('2'));
  assert.ok(msg.includes('4,580'));
  assert.ok(msg.includes('التاريخ والوقت:'));
});

test('buildExcelOrderRows maps orders to localized Arabic spreadsheet columns', () => {
  const rows = buildExcelOrderRows(sampleOrders);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]['الحالة'], 'جديد');
  assert.equal(rows[1]['الحالة'], 'تم التسليم');
  assert.equal(rows[1]['الإجمالي'], 4580);
  assert.equal(rows[0]['طريقة الدفع'], 'الدفع عند الاستلام');
});

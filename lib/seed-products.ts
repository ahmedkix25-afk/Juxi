import type { Product } from './types';

// Deterministic future discount countdown target (48h window from build/runtime baseline)
const OFFER_END_WATCH = '2026-11-23T23:59:59.000Z';
const OFFER_END_ESPRESSO = '2026-11-24T23:59:59.000Z';

export const SEED_PRODUCTS: Product[] = [
  {
    slug: 'smart-watch-ultra',
    name: 'ساعة التيتانيوم الذكية ألترا برو',
    price: 1850,
    originalPrice: 2450,
    currency: 'ج.م',
    description:
      'ساعة ذكية بإطار من التيتانيوم المصقول وزجاج مقاوم للخدش، تجمع بين دقة القياسات الصحية وعمر بطارية يدوم حتى 10 أيام متواصلة مع مقاومة كاملة للماء.',
    features: [
      'هيكل تيتانيوم خفيف ومقاوم للصدمات والخدوش',
      'شاشة AMOLED فائقة السطوع واضحة تحت أشعة الشمس المباشرة',
      'بطارية تدوم حتى 10 أيام بشحنة واحدة مع شحن مغناطيسي سريع',
      'إجراء واستقبال المكالمات وإشعارات واتساب باللغة العربية كاملة',
      'قياس دقيق لمعدل نبضات القلب، الأكسجين في الدم، وجودة النوم',
      'ضمان استبدال فوري لمدة 12 شهراً مع معاينة قبل الدفع',
    ],
    images: ['/images/watch-front.jpg', '/images/watch-side.jpg'],
    status: 'active',
    createdBy: 'seed',
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
    isSeedPreview: true,
    theme: {
      primaryColor: '#0F766E',
      secondaryColor: '#2563EB',
    },
    countdownEndsAt: OFFER_END_WATCH,
    remainingStock: 7,
    whatsappNumber: '201000000000',
    reviews: [
      {
        id: 'rev-w1',
        authorName: 'كريم المنصور',
        city: 'القاهرة',
        rating: 5,
        comment:
          'الخامة ممتازة جداً والهيكل التيتانيوم شكله فخم في اللبس. الشاشة واضحة جداً في الشمس والبطارية كملت معايا 8 أيام فعلياً.',
        imageUrl: '/images/watch-front.jpg',
        dateLabel: 'منذ 3 أيام',
      },
      {
        id: 'rev-w2',
        authorName: 'سلمى عبد الرحمن',
        city: 'الإسكندرية',
        rating: 5,
        comment:
          'وصلت خلال يومين وفتحت العلبة وعاينتها قبل الدفع للمندوب. الإشعارات العربية مظبوطة بدون تقطيع.',
        imageUrl: '/images/watch-side.jpg',
        dateLabel: 'منذ 5 أيام',
      },
      {
        id: 'rev-w3',
        authorName: 'أحمد فاروق',
        city: 'الجيزة',
        rating: 5,
        comment:
          'قيمة ممتازة مقابل السعر، مريحة أثناء الجيم والمشي والمكالمات صوتها نقي.',
        dateLabel: 'منذ أسبوع',
      },
    ],
    faqs: [
      {
        id: 'faq-w1',
        question: 'هل يمكنني معاينة الساعة قبل الدفع للمندوب؟',
        answer:
          'نعم بكل تأكيد. نوفر خدمة المعاينة الكاملة عند الاستلام للتأكد من مطابقة المنتج وجودته قبل سداد أي مبلغ.',
      },
      {
        id: 'faq-w2',
        question: 'هل الساعة تعمل مع هواتف آيفون وأندرويد؟',
        answer:
          'نعم، تتوافق الساعة بالكامل مع جميع هواتف iOS و Android عبر تطبيق مخصص يدعم اللغة العربية.',
      },
      {
        id: 'faq-w3',
        question: 'كم تستغرق مدة الشحن وما هي سياسة الاستبدال؟',
        answer:
          'الشحن خلال 24 إلى 48 ساعة للقاهرة والجيزة والإسكندرية، ومن 2 إلى 4 أيام لباقي المحافظات، مع ضمان استبدال واسترجاع مجاني خلال 14 يوماً.',
      },
    ],
  },
  {
    slug: 'portable-espresso-pro',
    name: 'ماكينة إسبريسو متنقلة بضغط 20 بار',
    price: 2290,
    originalPrice: 2950,
    currency: 'ج.م',
    description:
      'استمتع بكوب إسبريسو غني بالكريما الذهبية في السيارة أو المكتب أو السفر. تعمل مع كبسولات نسبريسو والبن المطحون بضغطة زر واحدة.',
    features: [
      'ضغط احترافي 20 بار لاستخلاص كريما كثيفة وغنية مثل المقاهي',
      'متوافقة مع كبسولات القهوة والبن المطحون الطازج',
      'تسخين تلقائي للماء البارد خلال 3 دقائق فقط',
      'بطارية قابلة للشحن عبر منفذ USB-C تكفي لتحضير 50 كوباً',
      'هيكل ألمنيوم أنيق سهل الفك والتنظيف خلال ثوانٍ',
      'شحن سريع لجميع المحافظات والدفع نقداً عند الاستلام',
    ],
    images: ['/images/espresso-main.jpg', '/images/espresso-detail.jpg'],
    status: 'active',
    createdBy: 'seed',
    createdAt: '2026-11-19T12:30:00.000Z',
    updatedAt: '2026-11-19T12:30:00.000Z',
    isSeedPreview: true,
    theme: {
      primaryColor: '#9A3412',
      secondaryColor: '#0F766E',
    },
    countdownEndsAt: OFFER_END_ESPRESSO,
    remainingStock: 5,
    whatsappNumber: '201000000000',
    reviews: [
      {
        id: 'rev-e1',
        authorName: 'محمود الشريف',
        city: 'القاهرة',
        rating: 5,
        comment:
          'فعلاً بتطلع وش كريما ممتاز جداً سواء بالكبسولات أو بالبن المطحون، وبستخدمها يومياً في المكتب والسيارة.',
        imageUrl: '/images/espresso-detail.jpg',
        dateLabel: 'منذ يومين',
      },
      {
        id: 'rev-e2',
        authorName: 'ندى حسين',
        city: 'المنصورة',
        rating: 5,
        comment:
          'سهلة جداً في التنظيف وخامة الألمنيوم ممتازة. وصلت متغلفة بشكل آمن جداً.',
        imageUrl: '/images/espresso-main.jpg',
        dateLabel: 'منذ 6 أيام',
      },
    ],
    faqs: [
      {
        id: 'faq-e1',
        question: 'هل تسخن الماء البارد أم تحتاج ماءً ساخناً فقط؟',
        answer:
          'تدعم الخيارين: يمكنك إضافة ماء بارد لتسخينه ذاتياً خلال 3 دقائق، أو إضافة ماء ساخن للاستخلاص الفوري خلال 30 ثانية.',
      },
      {
        id: 'faq-e2',
        question: 'ما نوع الكبسولات المتوافقة معها؟',
        answer:
          'متوافقة مع جميع كبسولات نسبريسو القياسية بالإضافة إلى سلة مخصصة للبن المطحون الطازج.',
      },
      {
        id: 'faq-e3',
        question: 'هل يوجد ضمان واسترجاع؟',
        answer:
          'نعم، الماكينة مشمولة بضمان 12 شهراً ضد عيوب الصناعة مع حق الاسترجاع أو الاستبدال خلال 14 يوماً من الاستلام.',
      },
    ],
  },
];

export function getSeedProductBySlug(slug: string): Product | undefined {
  return SEED_PRODUCTS.find((p) => p.slug === slug);
}

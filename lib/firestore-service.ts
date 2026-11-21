import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  db,
  auth,
  storage,
  OperationType,
  handleFirestoreError,
  timestampToIso,
} from './firebase';
import {
  calculateOrderTotal,
  generateOrderCode,
  normalizePhoneDigits,
} from './commerce';
import { SEED_PRODUCTS, getSeedProductBySlug } from './seed-products';
import type {
  NotificationSettings,
  Order,
  OrderFormInput,
  OrderStatus,
  Product,
  ProductFormInput,
  ProductStatus,
} from './types';
import { DEFAULT_NOTIFICATION_SETTINGS } from './types';

function mapProductDoc(id: string, data: Record<string, unknown>): Product {
  const rawTheme =
    data.theme && typeof data.theme === 'object'
      ? (data.theme as Record<string, unknown>)
      : null;

  return {
    slug: String(data.slug || id),
    name: String(data.name || ''),
    price: Number(data.price || 0),
    originalPrice: Number(data.originalPrice || 0),
    currency: String(data.currency || 'ج.م'),
    description: String(data.description || ''),
    features: Array.isArray(data.features)
      ? data.features.map((f) => String(f))
      : [],
    images: Array.isArray(data.images) ? data.images.map((i) => String(i)) : [],
    status: data.status === 'hidden' ? 'hidden' : 'active',
    createdBy: String(data.createdBy || ''),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    isSeedPreview: false,
    ...(rawTheme &&
    typeof rawTheme.primaryColor === 'string' &&
    typeof rawTheme.secondaryColor === 'string'
      ? {
          theme: {
            primaryColor: rawTheme.primaryColor,
            secondaryColor: rawTheme.secondaryColor,
          },
        }
      : {}),
    ...(typeof data.model3dUrl === 'string' && data.model3dUrl
      ? { model3dUrl: data.model3dUrl }
      : {}),
    ...(typeof data.countdownEndsAt === 'string' && data.countdownEndsAt
      ? { countdownEndsAt: data.countdownEndsAt }
      : {}),
    ...(typeof data.remainingStock === 'number'
      ? { remainingStock: data.remainingStock }
      : {}),
    ...(typeof data.whatsappNumber === 'string' && data.whatsappNumber
      ? { whatsappNumber: data.whatsappNumber }
      : {}),
    ...(Array.isArray(data.reviews)
      ? { reviews: data.reviews as Product['reviews'] }
      : {}),
    ...(Array.isArray(data.faqs) ? { faqs: data.faqs as Product['faqs'] } : {}),
  };
}

function mapOrderDoc(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    orderCode: String(data.orderCode || id),
    productSlug: String(data.productSlug || ''),
    productName: String(data.productName || ''),
    unitPrice: Number(data.unitPrice || 0),
    quantity: Number(data.quantity || 1),
    totalPrice: Number(data.totalPrice || 0),
    currency: String(data.currency || 'ج.م'),
    customerName: String(data.customerName || ''),
    customerPhone: String(data.customerPhone || ''),
    governorate: String(data.governorate || ''),
    address: String(data.address || ''),
    notes: String(data.notes || ''),
    paymentMethod: 'cod',
    status: (data.status as OrderStatus) || 'new',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function checkIsUserAdmin(
  uid: string,
  email: string | null | undefined,
  emailVerified: boolean,
): Promise<boolean> {
  if (emailVerified && email === 'ahmdkhaaadd@gmail.com') {
    return true;
  }
  if (!emailVerified) {
    return false;
  }
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fetchProductBySlug(
  slug: string,
): Promise<Product | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
    return null;
  }
  const path = `products/${cleanSlug}`;
  try {
    const snap = await getDoc(doc(db, 'products', cleanSlug));
    if (snap.exists()) {
      const product = mapProductDoc(
        snap.id,
        snap.data() as Record<string, unknown>,
      );
      if (product.status !== 'active') {
        return null;
      }
      return product;
    }
    const seed = getSeedProductBySlug(cleanSlug);
    return seed ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Missing or insufficient permissions')) {
      return null;
    }
    const seed = getSeedProductBySlug(cleanSlug);
    if (seed) return seed;
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchActiveProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const q = query(collection(db, 'products'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    if (snap.empty) {
      return SEED_PRODUCTS;
    }
    return snap.docs
      .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return SEED_PRODUCTS;
  }
}

export function subscribeAllProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'products';
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapProductDoc(d.id, d.data() as Record<string, unknown>),
      );
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export async function saveProduct(
  input: ProductFormInput,
  isEditing: boolean,
): Promise<Product> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يجب تسجيل الدخول كمسؤول لحفظ المنتج.');
  }

  const cleanSlug = input.slug.trim().toLowerCase();
  const path = `products/${cleanSlug}`;
  const docRef = doc(db, 'products', cleanSlug);

  const sanitizedFeatures = input.features
    .map((f) => f.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 15);
  const sanitizedImages = input.images
    .map((i) => i.trim().slice(0, 1000))
    .filter(Boolean)
    .slice(0, 8);

  try {
    if (isEditing) {
      await updateDoc(docRef, {
        name: input.name.trim().slice(0, 120),
        price: Number(input.price),
        originalPrice: Number(input.originalPrice || 0),
        currency: input.currency.trim().slice(0, 16),
        description: input.description.trim().slice(0, 2000),
        features: sanitizedFeatures,
        images: sanitizedImages,
        status: input.status,
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        throw new Error('رابط الصفحة (Slug) مستخدم بالفعل لمنتج آخر. يرجى اختيار رابط مختلف.');
      }
      await setDoc(docRef, {
        name: input.name.trim().slice(0, 120),
        slug: cleanSlug,
        price: Number(input.price),
        originalPrice: Number(input.originalPrice || 0),
        currency: input.currency.trim().slice(0, 16),
        description: input.description.trim().slice(0, 2000),
        features: sanitizedFeatures,
        images: sanitizedImages,
        status: input.status,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const nowIso = new Date().toISOString();
    return {
      slug: cleanSlug,
      name: input.name.trim(),
      price: Number(input.price),
      originalPrice: Number(input.originalPrice || 0),
      currency: input.currency.trim(),
      description: input.description.trim(),
      features: sanitizedFeatures,
      images: sanitizedImages,
      status: input.status,
      createdBy: user.uid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('رابط الصفحة (Slug) مستخدم')
    ) {
      throw error;
    }
    handleFirestoreError(
      error,
      isEditing ? OperationType.UPDATE : OperationType.CREATE,
      path,
    );
  }
}

export async function toggleProductStatus(
  slug: string,
  nextStatus: ProductStatus,
): Promise<void> {
  const path = `products/${slug}`;
  try {
    await updateDoc(doc(db, 'products', slug), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(slug: string): Promise<void> {
  const path = `products/${slug}`;
  try {
    await deleteDoc(doc(db, 'products', slug));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDemoProductsToFirestore(): Promise<number> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يجب تسجيل الدخول أولاً.');
  }
  let createdCount = 0;
  for (const seed of SEED_PRODUCTS) {
    const path = `products/${seed.slug}`;
    try {
      const refDoc = doc(db, 'products', seed.slug);
      const existingSnap = await getDoc(refDoc);
      if (!existingSnap.exists()) {
        await setDoc(refDoc, {
          name: seed.name,
          slug: seed.slug,
          price: seed.price,
          originalPrice: seed.originalPrice,
          currency: seed.currency,
          description: seed.description,
          features: seed.features,
          images: seed.images,
          status: 'active',
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(seed.theme ? { theme: seed.theme } : {}),
          ...(seed.countdownEndsAt ? { countdownEndsAt: seed.countdownEndsAt } : {}),
          ...(typeof seed.remainingStock === 'number' ? { remainingStock: seed.remainingStock } : {}),
          ...(seed.whatsappNumber ? { whatsappNumber: seed.whatsappNumber } : {}),
          ...(seed.reviews ? { reviews: seed.reviews } : {}),
          ...(seed.faqs ? { faqs: seed.faqs } : {}),
        });
        createdCount += 1;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
  return createdCount;
}

export async function createCustomerOrder(
  product: Product,
  input: OrderFormInput,
): Promise<Order> {
  const orderCode = generateOrderCode();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const quantity = Math.min(99, Math.max(1, Math.floor(input.quantity)));
  const totalPrice = calculateOrderTotal(product.price, quantity);
  const nowIso = new Date().toISOString();

  const orderData = {
    orderCode,
    productSlug: product.slug,
    productName: product.name.slice(0, 120),
    unitPrice: Number(product.price),
    quantity,
    totalPrice,
    currency: product.currency.slice(0, 16),
    customerName: input.customerName.trim().slice(0, 100),
    customerPhone: normalizePhoneDigits(input.customerPhone.trim()).slice(0, 24),
    governorate: input.governorate.trim().slice(0, 60),
    address: input.address.trim().slice(0, 400),
    notes: input.notes.trim().slice(0, 500),
    paymentMethod: 'cod' as const,
    status: 'new' as const,
  };

  if (!product.isSeedPreview) {
    const path = `orders/${orderId}`;
    try {
      await setDoc(doc(db, 'orders', orderId), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  // Fire external notifications asynchronously (Telegram / WhatsApp / Email / Webhook)
  try {
    await fetch('/api/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          ...orderData,
          createdAt: nowIso,
        },
      }),
    });
  } catch {
    // External notification failure must never block order confirmation
  }

  return {
    id: orderId,
    ...orderData,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onNewOrder?: (order: Order) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  let initialized = false;
  const knownIds = new Set<string>();

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapOrderDoc(d.id, d.data() as Record<string, unknown>),
      );

      if (!initialized) {
        for (const item of items) {
          knownIds.add(item.id);
        }
        initialized = true;
      } else {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' && !knownIds.has(change.doc.id)) {
            knownIds.add(change.doc.id);
            const newOrder = mapOrderDoc(
              change.doc.id,
              change.doc.data() as Record<string, unknown>,
            );
            onNewOrder?.(newOrder);
          }
        }
      }

      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const path = 'settings/notifications';
  try {
    const snap = await getDoc(doc(db, 'settings', 'notifications'));
    if (!snap.exists()) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
    const d = snap.data() as Record<string, unknown>;
    return {
      storeName: String(d.storeName || DEFAULT_NOTIFICATION_SETTINGS.storeName),
      defaultCurrency: String(
        d.defaultCurrency || DEFAULT_NOTIFICATION_SETTINGS.defaultCurrency,
      ),
      soundEnabled:
        typeof d.soundEnabled === 'boolean' ? d.soundEnabled : true,
      telegramEnabled: Boolean(d.telegramEnabled),
      telegramBotToken: String(d.telegramBotToken || ''),
      telegramChatId: String(d.telegramChatId || ''),
      whatsappEnabled: Boolean(d.whatsappEnabled),
      whatsappPhone: String(d.whatsappPhone || ''),
      whatsappApiKey: String(d.whatsappApiKey || ''),
      emailEnabled: Boolean(d.emailEnabled),
      notificationEmail: String(d.notificationEmail || ''),
      webhookUrl: String(d.webhookUrl || ''),
      updatedAt: timestampToIso(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings,
): Promise<void> {
  const path = 'settings/notifications';
  try {
    await setDoc(doc(db, 'settings', 'notifications'), {
      storeName: settings.storeName.trim().slice(0, 80) || 'صفحة بيع',
      defaultCurrency: settings.defaultCurrency.trim().slice(0, 16) || 'ج.م',
      soundEnabled: Boolean(settings.soundEnabled),
      telegramEnabled: Boolean(settings.telegramEnabled),
      telegramBotToken: settings.telegramBotToken.trim().slice(0, 160),
      telegramChatId: settings.telegramChatId.trim().slice(0, 64),
      whatsappEnabled: Boolean(settings.whatsappEnabled),
      whatsappPhone: settings.whatsappPhone.trim().slice(0, 32),
      whatsappApiKey: settings.whatsappApiKey.trim().slice(0, 200),
      emailEnabled: Boolean(settings.emailEnabled),
      notificationEmail: settings.notificationEmail.trim().slice(0, 120),
      webhookUrl: settings.webhookUrl.trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function uploadProductImage(
  file: File,
  slugHint: string,
): Promise<string> {
  const safeSlug = (slugHint || 'product').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'product';
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const storagePath = `products/${safeSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  // Attempt Firebase Storage upload first
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    return await getDownloadURL(snapshot.ref);
  } catch {
    // Graceful fallback to server-side /api/upload when Firebase Storage bucket rules aren't yet open
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || 'تعذر رفع الصورة. يرجى المحاولة مرة أخرى.');
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }
}

'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Link2,
  AlertCircle,
} from 'lucide-react';
import {
  slugifyProductName,
  validateProductInput,
} from '@/lib/commerce';
import { saveProduct, uploadProductImage } from '@/lib/firestore-service';
import type { Product, ProductFormInput, ProductStatus } from '@/lib/types';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface ProductFormModalProps {
  initialProduct?: Product | null;
  defaultCurrency: string;
  onClose: () => void;
  onSaved: (product: Product, wasNew: boolean) => void;
}

export function ProductFormModal({
  initialProduct,
  defaultCurrency,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = Boolean(initialProduct);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.price) : '',
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialProduct && initialProduct.originalPrice > 0
      ? String(initialProduct.originalPrice)
      : '',
  );
  const [currency, setCurrency] = useState(
    initialProduct?.currency || defaultCurrency || 'ج.م',
  );
  const [description, setDescription] = useState(
    initialProduct?.description || '',
  );
  const [features, setFeatures] = useState<string[]>(
    initialProduct && initialProduct.features.length > 0
      ? initialProduct.features
      : [''],
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [status, setStatus] = useState<ProductStatus>(
    initialProduct?.status || 'active',
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(slugifyProductName(val));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 8 - images.length);
    const toUpload = files.slice(0, remainingSlots);
    if (toUpload.length === 0) {
      setServerError('الحد الأقصى للصور هو 8 صور لكل منتج.');
      return;
    }

    setUploading(true);
    setServerError('');
    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const url = await uploadProductImage(file, slug || 'product');
        uploadedUrls.push(url);
      }
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 8));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'تعذر رفع الصورة. حاول مرة أخرى.',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (images.length >= 8) {
      setServerError('الحد الأقصى للصور هو 8 صور لكل منتج.');
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setImageUrlInput('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const payload: ProductFormInput = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      price: Number(price),
      originalPrice: originalPrice.trim() ? Number(originalPrice) : 0,
      currency: currency.trim() || 'ج.م',
      description: description.trim(),
      features: features.map((f) => f.trim()).filter(Boolean),
      images: images.map((i) => i.trim()).filter(Boolean),
      status,
    };

    const validation = validateProductInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      const saved = await saveProduct(payload, isEditing);
      onSaved(saved, !isEditing);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md"
    >
      <div className="glass liquid-glass-strong rounded-[24px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between">
          <h2
            id="product-modal-title"
            className="text-lg font-bold text-slate-950 dark:text-white"
          >
            {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد وصفحة هبوط'}
          </h2>
          <button
            type="button"
            aria-label="إغلاق النافذة"
            onClick={onClose}
            className="w-9 h-9 rounded-full liquid-btn-glass text-slate-700 dark:text-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {serverError && (
            <div
              role="alert"
              className="p-3.5 rounded-[18px] bg-red-500/12 dark:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-200 text-sm flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="prod-name"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-name"
              type="text"
              maxLength={120}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: ساعة ذكية ألترا برو مقاومة للماء"
              className={`liquid-input w-full h-11 px-4 rounded-[16px] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                errors.name ? '!border-red-500/80' : ''
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Slug & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor="prod-slug"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                رابط صفحة الهبوط (Slug) <span className="text-red-500">*</span>
              </label>
              <div
                className="liquid-input flex items-center rounded-[16px] overflow-hidden"
                dir="ltr"
              >
                <span className="px-3 h-11 flex items-center bg-slate-900/5 dark:bg-white/5 border-r border-slate-200/70 dark:border-white/10 text-xs font-mono text-slate-500 dark:text-slate-400">
                  /p/
                </span>
                <input
                  id="prod-slug"
                  type="text"
                  disabled={isEditing}
                  maxLength={100}
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    );
                  }}
                  placeholder="smart-watch-ultra"
                  className="flex-1 h-11 px-3 text-sm font-mono bg-transparent text-slate-950 dark:text-white disabled:opacity-60 focus:outline-none"
                />
              </div>
              {errors.slug && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="prod-status"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                حالة المنتج
              </label>
              <select
                id="prod-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="liquid-input w-full h-11 px-3 rounded-[16px] text-sm text-slate-950 dark:text-white dark:bg-slate-900/90"
              >
                <option value="active">نشط (متاح للطلب)</option>
                <option value="hidden">مخفي (متوقف مؤقتاً)</option>
              </select>
            </div>
          </div>

          {/* Price, Original Price, Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="prod-price"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                السعر الحالي <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1850"
                className={`liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm font-mono tabular-nums text-slate-950 dark:text-white ${
                  errors.price ? '!border-red-500/80' : ''
                }`}
              />
              {errors.price && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.price}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="prod-orig-price"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                السعر قبل الخصم (اختياري)
              </label>
              <input
                id="prod-orig-price"
                type="number"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="2450"
                className={`liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm font-mono tabular-nums text-slate-950 dark:text-white ${
                  errors.originalPrice ? '!border-red-500/80' : ''
                }`}
              />
              {errors.originalPrice && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.originalPrice}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="prod-currency"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                العملة
              </label>
              <input
                id="prod-currency"
                type="text"
                maxLength={16}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="ج.م / ر.س"
                className="liquid-input w-full h-11 px-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="prod-desc"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              وصف مختصر للمنتج <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً مقنعاً ومختصراً يبرز قيمة المنتج للعميل..."
              className={`liquid-input w-full p-3.5 rounded-[16px] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                errors.description ? '!border-red-500/80' : ''
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                مميزات المنتج
              </label>
              <button
                type="button"
                disabled={features.length >= 15}
                onClick={() => setFeatures((prev) => [...prev, ''])}
                className="h-8 px-3 rounded-full liquid-btn-glass inline-flex items-center gap-1 text-xs font-bold text-[var(--lg-primary)] disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة ميزة</span>
              </button>
            </div>
            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={200}
                    value={feat}
                    onChange={(e) => {
                      const next = [...features];
                      next[idx] = e.target.value;
                      setFeatures(next);
                    }}
                    placeholder={`ميزة رقم ${idx + 1}`}
                    className="liquid-input flex-1 h-10 px-3.5 rounded-[14px] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      aria-label={`حذف ميزة ${idx + 1}`}
                      onClick={() =>
                        setFeatures((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-2 text-slate-400 hover:text-red-500 rounded-[12px] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Images Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
              صور المنتج (1 إلى 8 صور) <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading || images.length >= 8}
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 rounded-full liquid-btn-glass text-sm font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploading ? 'جاري الرفع...' : 'رفع صور من جهازك'}</span>
              </button>

              <div className="flex-1 min-w-[200px] flex items-center gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="أو الصق رابط صورة مباشر (https://...)"
                  dir="ltr"
                  className="liquid-input flex-1 h-10 px-3 rounded-[14px] text-xs text-slate-950 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="h-10 px-4 rounded-full liquid-btn-glass text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {errors.images && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.images}
              </p>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                {images.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative aspect-[4/3] rounded-[16px] overflow-hidden border border-white/50 dark:border-white/15 bg-slate-100 dark:bg-slate-800 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`صورة المنتج ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      aria-label={`حذف صورة ${idx + 1}`}
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full liquid-btn-glass text-slate-900 dark:text-white flex items-center justify-center hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-slate-950/75 text-white text-[10px]">
                        رئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-end gap-3">
            <LiquidButton
              type="button"
              variant="glass"
              onClick={onClose}
              className="h-11 px-5 text-sm"
            >
              <span>إلغاء</span>
            </LiquidButton>
            <LiquidButton
              type="submit"
              disabled={saving || uploading}
              className="h-11 px-6 text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'حفظ التعديلات' : 'إنشاء صفحة المنتج الآن'}</span>
            </LiquidButton>
          </div>
        </form>
      </div>
    </div>
  );
}

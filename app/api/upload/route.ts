import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_MIME_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'لم يتم إرسال ملف صورة.' },
        { status: 400 },
      );
    }

    const ext = ALLOWED_MIME_MAP[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: 'صيغة الصورة غير مدعومة. الصيغ المدعومة: JPG, PNG, WebP.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({
      url: `/api/uploads/${filename}`,
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الصورة.' },
      { status: 500 },
    );
  }
}

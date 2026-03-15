import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/upload-image
 * Accepts a multipart/form-data request with a 'file' field.
 * Saves the image to /public/uploads/ and returns the public URL.
 *
 * For production (Vercel), the file system is not persistent.
 * In that case, you should replace this with Cloudinary/S3/Vercel Blob.
 * The API gracefully falls back to a base64 data URL if the write fails.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WebP, GIF, AVIF allowed.' }, { status: 400 });
    }

    // Cap file size to 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Attempt local disk write (works in dev, not in Vercel serverless)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      const publicUrl = `/uploads/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } catch {
      // Fallback: return a base64 data URL (works everywhere but is large)
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl, fallback: true });
    }
  } catch (e: any) {
    console.error('[Image Upload Error]:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

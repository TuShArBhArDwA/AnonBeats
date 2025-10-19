// FILENAME: src/app/api/tracks/[...publicId]/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function DELETE(_req: Request, { params }: { params: { publicId: string[] } }) {
  try {
    const publicId = decodeURIComponent(params.publicId.join('/'));
    const resp = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
      invalidate: true,
    });
    return NextResponse.json({ ok: true, result: resp.result });
  } catch (e: any) {
    console.error('destroy error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// PATCH /api/tracks/:publicId  body: { title?: string; artist?: string; album?: string }
export async function PATCH(req: Request, { params }: { params: { publicId: string[] } }) {
  try {
    const { title, artist, album } = await req.json();
    if (!title && !artist && !album) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const publicId = decodeURIComponent(params.publicId.join('/'));

    const context: Record<string, string> = {};
    if (typeof title === 'string' && title.trim()) context.title = title.trim();
    if (typeof artist === 'string' && artist.trim()) context.artist = artist.trim();
    if (typeof album === 'string' && album.trim()) context.album = album.trim();

    const resp = await cloudinary.api.update(publicId, {
      resource_type: 'video',
      context,
      invalidate: true,
    });

    return NextResponse.json({ ok: true, result: resp });
  } catch (e: any) {
    console.error('update context error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to update context' }, { status: 500 });
  }
}
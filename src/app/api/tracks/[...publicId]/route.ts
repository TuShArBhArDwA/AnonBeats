import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { loadStore, saveStore } from '../../playlists/_store';
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// DELETE /api/tracks/:publicId
export async function DELETE(_req: Request, ctx: { params: Promise<{ publicId: string[] }> }) {
  try {
    const { publicId: segments } = await ctx.params;
    const publicId = decodeURIComponent(segments.join('/'));

    // 1) Delete from Cloudinary
    const resp = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
      invalidate: true,
    });

    // 2) Cascade: remove this id from all playlists
    try {
      const store = await loadStore();
      let changed = false;
      store.playlists.forEach((p) => {
        const before = p.itemIds.length;
        p.itemIds = p.itemIds.filter((id) => id !== publicId);
        if (p.itemIds.length !== before) changed = true;
      });
      if (changed) await saveStore(store);
    } catch (e: any) {
      console.error('Playlist cascade remove failed:', e?.message || e);
    }

    return NextResponse.json({ ok: true, result: resp.result });
  } catch (e: any) {
    console.error('destroy error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// PATCH /api/tracks/:publicId  body: { title?: string; artist?: string; album?: string; coverUrl?: string }
export async function PATCH(req: Request, ctx: { params: Promise<{ publicId: string[] }> }) {
  try {
    const { publicId: segments } = await ctx.params;
    const publicId = decodeURIComponent(segments.join('/'));

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : undefined;
    const artist = typeof body.artist === 'string' ? body.artist.trim() : undefined;
    const album = typeof body.album === 'string' ? body.album.trim() : undefined;
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim() : undefined;

    if (!title && !artist && !album && !coverUrl) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Build context string "key=value|key=value" for Admin API
    const parts: string[] = [];
    if (title) parts.push(`title=${title}`);
    if (artist) parts.push(`artist=${artist}`);
    if (album) parts.push(`album=${album}`);
    if (coverUrl) parts.push(`coverUrl=${coverUrl}`);
    const context = parts.join('|');

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
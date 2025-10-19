import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function safeDecode(v?: string) { try { return v ? decodeURIComponent(v) : undefined; } catch { return v; } }

export async function GET() {
  try {
    const folder = process.env.CLOUDINARY_FOLDER || 'anonbeats/tracks';

    // Use Admin API list to get fresh context immediately
    const list = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      prefix: folder,
      context: true,
      tags: true,
      max_results: 200,
    });

    const resources = (list.resources || []).sort((a: any, b: any) =>
      a.created_at < b.created_at ? 1 : -1
    );

    const tracks = resources.map((r: any) => {
      const c = r.context?.custom || {};
      return {
        publicId: r.public_id,
        title: safeDecode(c.title) || r.public_id.split('/').pop() || 'Untitled',
        artist: safeDecode(c.artist) || '',
        album: safeDecode(c.album) || '',
        audioUrl: r.secure_url,
        duration: r.duration,
        bytes: r.bytes,
        format: r.format,
        coverUrl: safeDecode(c.coverUrl),
        createdAt: r.created_at,
        tags: r.tags || [],
      };
    });

    return NextResponse.json(tracks);
  } catch (e: any) {
    console.error('tracks GET failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
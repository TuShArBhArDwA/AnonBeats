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

function safeDecode(v?: string) {
  if (!v) return undefined;
  try { return decodeURIComponent(v); } catch { return v; }
}

function mapResource(r: any) {
  const c = r.context?.custom || {};
  const title = safeDecode(c.title) || r.public_id.split('/').pop() || 'Untitled';
  const artist = safeDecode(c.artist) || '';
  const album = safeDecode(c.album) || '';
  return {
    publicId: r.public_id,
    title,
    artist,
    album,
    audioUrl: r.secure_url,
    duration: r.duration,
    bytes: r.bytes,
    format: r.format,
    coverUrl: safeDecode(c.coverUrl),
    createdAt: r.created_at,
    tags: r.tags || [],
  };
}

export async function GET() {
  try {
    const folder = process.env.CLOUDINARY_FOLDER || 'anonbeats/tracks';

    const expressions = [
      'resource_type:video AND tags=anonbeats',
      `resource_type:video AND folder:${folder}`,
      `resource_type:video AND public_id:${folder}/*`,
    ];

    let resources: any[] = [];
    for (const expr of expressions) {
      try {
        const result = await cloudinary.search
          .expression(expr)
          .with_field('context')
          .with_field('tags')
          .sort_by('created_at', 'desc')
          .max_results(200)
          .execute();
        if (result.resources?.length) {
          resources = result.resources;
          break;
        }
      } catch (e) {
        // keep trying fallbacks
      }
    }

    // Fallback list by prefix if search returns nothing
    if (!resources.length) {
      try {
        const list = await cloudinary.api.resources({
          type: 'upload',
          resource_type: 'video',
          prefix: folder,
          context: true,
          tags: true,
          max_results: 200,
        });
        resources = list.resources || [];
      } catch {}
    }

    return NextResponse.json(resources.map(mapResource));
  } catch (e: any) {
    console.error('tracks GET failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
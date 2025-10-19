import { NextResponse } from 'next/server';
import { loadStore, saveStore } from '../../_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { publicId } = await req.json();
    if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 });

    const store = await loadStore();
    const p = store.playlists.find((x) => x.id === id);
    if (!p) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    if (!p.itemIds.includes(publicId)) p.itemIds.push(publicId);
    await saveStore(store);
    return NextResponse.json({ ok: true, itemIds: p.itemIds });
  } catch (e: any) {
    console.error('POST /api/playlists/:id/tracks failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');
    if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 });

    const store = await loadStore();
    const p = store.playlists.find((x) => x.id === id);
    if (!p) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    p.itemIds = p.itemIds.filter((pid) => pid !== publicId);
    await saveStore(store);
    return NextResponse.json({ ok: true, itemIds: p.itemIds });
  } catch (e: any) {
    console.error('DELETE /api/playlists/:id/tracks failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
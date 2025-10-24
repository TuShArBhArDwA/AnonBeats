import { NextResponse } from 'next/server';
import { loadStore, saveStore } from '../_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const store = await loadStore();
    const p = (store.playlists || []).find((x) => x.id === id) || null;
    return NextResponse.json(p);
  } catch (e: any) {
    console.error('GET /api/playlists/:id failed:', e?.message || e);
    return NextResponse.json(null, { status: 200 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // Guard: prevent deleting the "liked" system playlist
    if (id?.toLowerCase() === 'liked') {
      return NextResponse.json({ error: 'Cannot delete liked' }, { status: 400 });
    }

    const store = await loadStore();
    const before = Array.isArray(store.playlists) ? store.playlists.length : 0;

    store.playlists = (store.playlists || []).filter((x) => x.id !== id);

    if ((store.playlists || []).length === before) {
      // nothing was removed -> not found
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    await saveStore(store);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE /api/playlists/:id failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
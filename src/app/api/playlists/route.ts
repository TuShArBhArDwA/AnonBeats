import { NextResponse } from 'next/server';
import { loadStore, saveStore } from './_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const store = await loadStore();
    const url = new URL(req.url);
    if (url.searchParams.get('debug') === '1') {
      // Inspect the whole store at /api/playlists?debug=1
      return NextResponse.json(store);
    }
    const lists = (store.playlists || []).sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(lists);
  } catch (e: any) {
    console.error('GET /api/playlists failed:', e?.message || e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, coverUrl } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    const store = await loadStore();
    const p = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: Date.now(),
      itemIds: [],
      coverUrl: typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : undefined,
    };
    store.playlists = [p, ...(store.playlists || [])];
    await saveStore(store);
    return NextResponse.json(p);
  } catch (e: any) {
    console.error('POST /api/playlists failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
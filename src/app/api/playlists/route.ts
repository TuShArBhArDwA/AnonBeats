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
    const body = await req.json();
    const name: string | undefined = body?.name?.trim();
    const coverUrl: string | undefined = typeof body?.coverUrl === 'string' && body?.coverUrl?.trim()
      ? body.coverUrl.trim()
      : undefined;
    const requestedId: string | undefined = typeof body?.id === 'string' && body?.id?.trim()
      ? body.id.trim()
      : undefined;

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const store = await loadStore();
    store.playlists = Array.isArray(store.playlists) ? store.playlists : [];

    // If a specific id is requested, be idempotent
    if (requestedId) {
      const existing = store.playlists.find((p: any) => p.id === requestedId);
      if (existing) {
        // Optionally update name/cover if provided
        if (name && existing.name !== name) existing.name = name;
        if (coverUrl) existing.coverUrl = coverUrl;
        await saveStore(store);
        return NextResponse.json(existing);
      }
    }

    const p = {
      id: requestedId || crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      itemIds: [] as string[],
      coverUrl,
    };

    store.playlists = [p, ...store.playlists];
    await saveStore(store);
    return NextResponse.json(p);
  } catch (e: any) {
    console.error('POST /api/playlists failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
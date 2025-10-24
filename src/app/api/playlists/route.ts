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
    const requestedId: string | undefined =
      typeof body?.id === 'string' && body?.id?.trim() ? body.id.trim() : undefined;

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const isLiked =
      (requestedId && requestedId.toLowerCase() === 'liked') ||
      name.toLowerCase() === 'liked songs';

    // Only liked gets a forced default cover; others leave cover undefined unless provided
    const coverUrl: string | undefined =
      typeof body?.coverUrl === 'string' && body.coverUrl.trim()
        ? body.coverUrl.trim()
        : (isLiked ? '/logo.jpeg' : undefined);

    const store = await loadStore();
    store.playlists = Array.isArray(store.playlists) ? store.playlists : [];

    if (requestedId) {
      const existing = store.playlists.find((p: any) => p.id === requestedId);
      if (existing) {
        // Update name/cover only if provided, and only force cover for liked
        if (name && existing.name !== name) existing.name = name;
        if (isLiked && (!existing.coverUrl || coverUrl)) {
          existing.coverUrl = coverUrl || existing.coverUrl || '/logo.jpeg';
        } else if (coverUrl) {
          existing.coverUrl = coverUrl;
        }
        await saveStore(store);
        return NextResponse.json(existing);
      }
    }

    const p = {
      id: requestedId || crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      itemIds: [] as string[],
      coverUrl, // undefined for normal playlists unless user provided it; '/logo.jpeg' for liked
    };

    store.playlists = [p, ...store.playlists];
    await saveStore(store);
    return NextResponse.json(p);
  } catch (e: any) {
    console.error('POST /api/playlists failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
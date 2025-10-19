import { NextResponse } from 'next/server';
import { loadStore, saveStore } from './_store';

export const runtime = 'nodejs';

export async function GET() {
  const store = await loadStore();
  return NextResponse.json(store.playlists.sort((a, b) => b.createdAt - a.createdAt));
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const store = await loadStore();
  const p = { id: crypto.randomUUID(), name: name.trim(), createdAt: Date.now(), itemIds: [] };
  store.playlists.unshift(p);
  await saveStore(store);
  return NextResponse.json(p);
}
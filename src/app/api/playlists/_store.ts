import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export type Playlist = { id: string; name: string; createdAt: number; itemIds: string[] };
export type Store = { version: number; updatedAt: number; playlists: Playlist[] };

const PUBLIC_ID = 'anonbeats/meta/playlists';

function emptyStore(): Store {
  return { version: 1, updatedAt: Date.now(), playlists: [] };
}

async function fetchJsonFromUrl(url: string): Promise<Store> {
  const fresh = `${url}${url.includes('?') ? '&' : '?'}ts=${Date.now()}`;
  const res = await fetch(fresh, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch store failed HTTP ${res.status}`);
  return (await res.json()) as Store;
}

export async function loadStore(): Promise<Store> {
  // Try resource by id (w/ and w/o extension), then list by prefix
  const candidates = [PUBLIC_ID, `${PUBLIC_ID}.json`];

  for (const id of candidates) {
    try {
      const res: any = await cloudinary.api.resource(id, { resource_type: 'raw', type: 'upload' });
      if (res?.secure_url) return await fetchJsonFromUrl(res.secure_url);
    } catch (e: any) {
      // ignore, try next
    }
  }

  try {
    const list: any = await cloudinary.api.resources({
      resource_type: 'raw',
      type: 'upload',
      prefix: PUBLIC_ID,
      max_results: 1,
    });
    const r = list?.resources?.[0];
    if (r?.secure_url) return await fetchJsonFromUrl(r.secure_url);
  } catch (e: any) {
    console.error('loadStore list fallback error:', e?.message || e);
  }

  // If nothing exists yet, return empty store
  return emptyStore();
}

export async function saveStore(store: Store) {
  store.updatedAt = Date.now();
  const payload = Buffer.from(JSON.stringify(store, null, 2)).toString('base64');
  // Creates/overwrites anonbeats/meta/playlists(.json) as a raw asset
  return cloudinary.uploader.upload(`data:application/json;base64,${payload}`, {
    resource_type: 'raw',
    public_id: PUBLIC_ID, // public_id WITHOUT extension; format sets .json
    overwrite: true,
    invalidate: true,
    format: 'json',
    type: 'upload',
    tags: ['anonbeats', 'anonbeats-playlists'],
  });
}
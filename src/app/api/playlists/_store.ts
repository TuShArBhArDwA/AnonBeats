import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  itemIds: string[]; // track publicIds
};

export type Store = {
  version: number;
  updatedAt: number;
  playlists: Playlist[];
};

const PUBLIC_ID = 'anonbeats/meta/playlists';

export async function loadStore(): Promise<Store> {
  try {
    const res: any = await cloudinary.api.resource(PUBLIC_ID, { resource_type: 'raw' });
    const url: string = res.secure_url;
    const json = await fetch(url).then((r) => r.json());
    return json as Store;
  } catch (e: any) {
    if (e?.http_code === 404) {
      return { version: 1, updatedAt: Date.now(), playlists: [] };
    }
    throw e;
  }
}

export async function saveStore(store: Store) {
  store.updatedAt = Date.now();
  const payload = Buffer.from(JSON.stringify(store, null, 2)).toString('base64');
  return cloudinary.uploader.upload(`data:application/json;base64,${payload}`, {
    resource_type: 'raw',
    public_id: PUBLIC_ID,
    overwrite: true,
    invalidate: true,
    tags: ['anonbeats', 'anonbeats-playlists'],
    format: 'json',
  });
}
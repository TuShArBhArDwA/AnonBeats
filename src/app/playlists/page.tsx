'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Trash2, Image as ImageIcon, ListMusic } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';

type Playlist = { id: string; name: string; createdAt: number; itemIds: string[]; coverUrl?: string };
type Track = {
  publicId: string; title: string; artist?: string; album?: string;
  audioUrl: string; duration?: number; coverUrl?: string;
};

const btn = {
  base: 'inline-flex items-center gap-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-white/10 active:translate-y-[0.5px]',
  primary: 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_8px_24px_-6px_rgba(236,72,153,0.5)] hover:shadow-[0_10px_28px_-6px_rgba(236,72,153,0.65)]',
  glass: 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white',
  tiny: 'px-2.5 py-1.5 text-[11px]',
  md: 'px-3 py-2 text-sm',
  icon: 'p-1.5',
  danger: 'border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-200'
};

export default function PlaylistsPage() {
  const { setQueue } = usePlayer();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackMap = useMemo(() => new Map(tracks.map((t) => [t.publicId, t])), [tracks]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [plRes, trRes] = await Promise.all([
          fetch('/api/playlists', { cache: 'no-store' }),
          fetch('/api/tracks', { cache: 'no-store' }),
        ]);
        const [pl, tr] = await Promise.all([plRes.json(), trRes.json()]);
        setPlaylists(Array.isArray(pl) ? pl : []);
        setTracks(Array.isArray(tr) ? tr : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!coverFile) { setPreview(''); return; }
    const url = URL.createObjectURL(coverFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  async function uploadCoverIfAny(): Promise<string | undefined> {
    if (!coverFile) return undefined;
    const sign = await fetch('/api/cloudinary/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'anonbeats/playlist-covers', tags: 'anonbeats,playlist-cover', context: name ? `name=${name}` : undefined }),
    }).then((r) => r.json());

    const form = new FormData();
    form.append('file', coverFile);
    form.append('api_key', sign.apiKey);
    form.append('timestamp', String(sign.timestamp));
    form.append('signature', sign.signature);
    form.append('folder', sign.folder);
    if (sign.tags) form.append('tags', sign.tags);
    if (sign.context) form.append('context', sign.context);

    const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
    const res = await fetch(endpoint, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Cover upload failed');
    const data = await res.json();
    return data.secure_url as string;
  }

  async function create() {
    try {
      if (!name.trim()) return;
      setCreating(true);
      const coverUrl = await uploadCoverIfAny();
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), coverUrl }),
      });
      if (!res.ok) throw new Error(`Create failed: HTTP ${res.status}`);
      const p = await res.json();
      setPlaylists((prev) => [p, ...prev]);
      setName('');
      setCoverFile(null);
      setPreview('');
      setTimeout(() => refresh(), 600);
    } catch (e: any) {
      setError(e?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  }

  async function refresh() {
    try {
      const pl = await fetch('/api/playlists', { cache: 'no-store' }).then((r) => r.json());
      setPlaylists(Array.isArray(pl) ? pl : []);
    } catch {}
  }

  async function remove(id: string) {
    try {
      if (!confirm('Delete this playlist?')) return;
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
      setPlaylists((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete playlist');
    }
  }

  function playAll(p: Playlist) {
    const list = p.itemIds.map((pid) => trackMap.get(pid)).filter(Boolean) as Track[];
    if (!list.length) return;
    const q = list.map((t) => ({
      id: t.publicId, publicId: t.publicId, title: t.title, artist: t.artist,
      album: t.album, audioUrl: t.audioUrl, duration: t.duration, coverUrl: t.coverUrl,
    }));
    setQueue(q, 0);
  }

  const Cards = () => {
    if (loading) {
      return (
        <div className="grid gap-4 grid-cols-2 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="aspect-[4/3] md:aspect-square rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="mt-2 h-4 w-1/2 rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      );
    }
    if (!playlists.length) {
      return (
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/70">
          No playlists yet. Create your first mix above.
        </div>
      );
    }

    return (
      <div className="grid gap-4 grid-cols-2 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {playlists.map((p) => {
          const first = p.itemIds[0] ? trackMap.get(p.itemIds[0]) : undefined;
          const cover = p.coverUrl || first?.coverUrl || '/logo.jpeg';
          const count = p.itemIds.filter((id) => trackMap.has(id)).length;

          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/20"
            >
              {/* Delete */}
              <button
                onClick={() => remove(p.id)}
                className={`${btn.base} ${btn.icon} ${btn.danger} absolute right-2 top-2 z-10 rounded-md`}
                title="Delete playlist"
              >
                <Trash2 size={14} />
              </button>

              {/* Cover */}
              <div className="relative aspect-[4/3] md:aspect-square w-full overflow-hidden rounded-lg ring-1 ring-inset ring-white/10">
                {/* Track count pill */}
                <div className="absolute left-2 top-2 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-md">
                    <ListMusic size={12} />
                    {count} {count === 1 ? 'track' : 'tracks'}
                  </span>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" className="h-full w-full object-cover" />

                {/* Play overlay */}
                <button
                  onClick={() => playAll(p)}
                  className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 focus-visible:bg-black/30 focus-visible:opacity-100 outline-none"
                  title="Play"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow ring-1 ring-black/10 md:h-12 md:w-12">
                    <Play size={18} />
                  </span>
                </button>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/0 via-transparent to-pink-500/12 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Meta + actions */}
              <div className="mt-2">
                <h3 className="truncate text-sm font-semibold" title={p.name}>{p.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => playAll(p)}
                    className={`${btn.base} ${btn.tiny} ${btn.primary}`}
                  >
                    Play
                  </button>
                  <Link
                    href={`/playlists/${p.id}`}
                    className={`${btn.base} ${btn.tiny} ${btn.glass}`}
                  >
                    Open
                  </Link>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Playlists</h1>

      {/* Create bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex-1 min-w-[220px]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New playlist name"
            className="w-full rounded-md border border-transparent bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${btn.base} ${btn.md} ${btn.glass}`}
          title="Choose cover"
        >
          <ImageIcon size={16} /> Choose cover
        </button>

        <button
          onClick={create}
          disabled={!name.trim() || creating}
          className={`${btn.base} ${btn.md} ${btn.primary} disabled:opacity-60`}
        >
          {creating ? 'Creating…' : 'Create'}
        </button>

        {preview && (
          <div className="ml-auto h-10 w-10 overflow-hidden rounded-md ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="cover preview" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {error && <p className="mb-3 text-red-400">{error}</p>}

      <Cards />
    </section>
  );
}
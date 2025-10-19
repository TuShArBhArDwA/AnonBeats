'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Trash2, Image as ImageIcon } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';

type Playlist = { id: string; name: string; createdAt: number; itemIds: string[]; coverUrl?: string };
type Track = {
  publicId: string; title: string; artist?: string; album?: string;
  audioUrl: string; duration?: number; coverUrl?: string;
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
    // Sign image upload
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

      // 1) upload cover if present
      const coverUrl = await uploadCoverIfAny();

      // 2) create playlist with coverUrl
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), coverUrl }),
      });
      if (!res.ok) throw new Error(`Create failed: HTTP ${res.status}`);
      const p = await res.json();

      // optimistic + refresh after a tick for Cloudinary raw JSON indexing
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
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
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
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {playlists.map((p) => {
          const first = p.itemIds[0] ? trackMap.get(p.itemIds[0]) : undefined;
          const cover = p.coverUrl || first?.coverUrl || '/logo.jpeg';
          const count = p.itemIds.filter((id) => trackMap.has(id)).length;

          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -2, scale: 1.01 }}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold truncate">{p.name}</h3>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                  title="Delete playlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => playAll(p)}
                    className="absolute inset-0 hidden place-items-center rounded-lg bg-black/40 text-white opacity-0 transition group-hover:grid group-hover:opacity-100"
                    title="Play"
                  >
                    <Play size={16} />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-white/70">{count} track{count !== 1 ? 's' : ''}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => playAll(p)}
                      className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                    >
                      Play
                    </button>
                    <Link href={`/playlists/${p.id}`} className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">
                      Open
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/0 via-transparent to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Playlists</h1>

      {/* Create bar with cover picker */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex-1 min-w-[240px]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New playlist name"
            className="w-full rounded-md border border-transparent bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
          />
        </div>

        {/* Hidden native input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
        />

        {/* Visible control + preview */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white hover:bg-white/10"
          title="Choose cover"
        >
          <ImageIcon size={16} /> Choose cover
        </button>

        <button
          onClick={create}
          disabled={!name.trim() || creating}
          className="rounded-md border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60"
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
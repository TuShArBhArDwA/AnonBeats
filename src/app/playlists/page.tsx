'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';

type Playlist = { id: string; name: string; createdAt: number; itemIds: string[] };
type Track = {
  publicId: string;
  title: string;
  artist?: string;
  album?: string;
  audioUrl: string;
  duration?: number;
  coverUrl?: string;
};

export default function PlaylistsPage() {
  const { setQueue } = usePlayer();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackMap = useMemo(() => new Map(tracks.map((t) => [t.publicId, t])), [tracks]);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [plRes, trRes] = await Promise.all([
        fetch('/api/playlists', { cache: 'no-store' }),
        fetch('/api/tracks', { cache: 'no-store' }),
      ]);
      const [pl, tr] = await Promise.all([plRes.json(), trRes.json()]);
      setPlaylists(Array.isArray(pl) ? pl : []);
      setTracks(Array.isArray(tr) ? tr : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function create() {
    try {
      if (!name.trim()) return;
      setCreating(true);
      // Create
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error(`Create failed: HTTP ${res.status}`);
      const p = await res.json();
      // Optimistic + retry refresh after a short delay (Cloudinary raw indexing)
      setPlaylists((prev) => [p, ...prev]);
      setName('');
      setTimeout(() => refresh(), 600);
    } catch (e: any) {
      setError(e?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
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
    const list = p.itemIds
      .map((pid) => trackMap.get(pid))
      .filter(Boolean) as Track[];
    if (!list.length) return;
    // Map to player shape (id required)
    const queue = list.map((t) => ({
      id: t.publicId,
      publicId: t.publicId,
      title: t.title,
      artist: t.artist,
      album: t.album,
      audioUrl: t.audioUrl,
      duration: t.duration,
      coverUrl: t.coverUrl,
    }));
    setQueue(queue, 0);
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
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/70">No playlists yet. Create your first mix above.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {playlists.map((p) => {
          const first = p.itemIds[0] ? trackMap.get(p.itemIds[0]) : undefined;
          const cover = first?.coverUrl || '/logo.jpeg';
          const count = p.itemIds.length;

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
                {/* Cover */}
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
                    <Link
                      href={`/playlists/${p.id}`}
                      className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>

              {/* Glow */}
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

      {/* Create bar */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
        />
        <button
          onClick={create}
          disabled={!name.trim() || creating}
          className="rounded-md border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </div>

      {error && <p className="mb-3 text-red-400">{error}</p>}

      <Cards />
    </section>
  );
}
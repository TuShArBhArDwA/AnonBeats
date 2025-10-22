'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, ListPlus, Shuffle, Search, X } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';
import Link from 'next/link';

type Track = {
  publicId: string;
  title: string;
  artist?: string;
  album?: string;
  audioUrl: string;
  duration?: number;
  coverUrl?: string;
};

type Playlist = { id: string; name: string; createdAt: number; itemIds: string[] };

export default function LibraryPage() {
  const { setQueue, queue, index } = usePlayer();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlName, setNewPlName] = useState('');
  const [durations, setDurations] = useState<Record<string, number>>({});

  const currentId = queue[index]?.publicId;

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tracks', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Track[];
      setTracks(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  async function fetchPlaylists() {
    try {
      const res = await fetch('/api/playlists', { cache: 'no-store' });
      const data = await res.json();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch {}
  }

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  // Close picker on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setPickerFor(null); }
    if (pickerFor) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [pickerFor]);

  // Measure duration if missing
  useEffect(() => {
    const missing = tracks.filter((t) => !(t.duration && t.duration > 0) && !durations[t.publicId]);
    if (!missing.length) return;

    let unmounted = false;
    missing.forEach((t) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      audio.src = t.audioUrl;
      audio.onloadedmetadata = () => {
        if (unmounted) return;
        const d = Math.round(audio.duration || 0);
        if (d > 0) setDurations((prev) => ({ ...prev, [t.publicId]: d }));
      };
      try { audio.load(); } catch {}
    });

    return () => { unmounted = true; };
  }, [tracks, durations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.artist || '').toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q)
    );
  }, [tracks, query]);

  function fmt(sec?: number) {
    if (!sec || !isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function toPlayerQueue(list: Track[]) {
    return list.map((t) => ({
      id: t.publicId,
      publicId: t.publicId,
      title: t.title,
      artist: t.artist,
      album: t.album,
      audioUrl: t.audioUrl,
      duration: durations[t.publicId] ?? t.duration,
      coverUrl: t.coverUrl,
    }));
  }

  function playAll(list: Track[]) {
    if (!list.length) return;
    setQueue(toPlayerQueue(list), 0);
  }

  function shuffleAll(list: Track[]) {
    if (!list.length) return;
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setQueue(toPlayerQueue(arr), 0);
  }

  async function remove(publicId: string) {
    if (!confirm('Delete this track from Cloudinary?')) return;
    await fetch(`/api/tracks/${encodeURIComponent(publicId)}`, { method: 'DELETE' });
    fetchTracks();
  }

  function openPicker(publicId: string) {
    setPickerFor((prev) => (prev === publicId ? null : publicId));
    fetchPlaylists();
  }

  async function addToPlaylist(playlistId: string, publicId: string) {
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    setPickerFor(null);
  }

  async function createAndAdd(publicId: string) {
    if (!newPlName.trim()) return;
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlName.trim() }),
    });
    const p = await res.json();
    setNewPlName('');
    addToPlaylist(p.id, publicId);
  }

  // UI: Loading / error / empty
  if (loading) {
    return (
      <section className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Your Library</h1>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-9 w-60 rounded-md border border-white/10 bg-white/[0.03] animate-pulse" />
          <div className="h-9 w-24 rounded-md border border-white/10 bg-white/[0.03] animate-pulse" />
          <div className="h-9 w-24 rounded-md border border-white/10 bg-white/[0.03] animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-2 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="aspect-[4/3] md:aspect-square rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="mt-2 h-4 w-1/2 rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Your Library</h1>
        <p className="text-red-400">{error}</p>
      </section>
    );
  }

  if (!tracks.length) {
    return (
      <section className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Your Library</h1>
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/70">No tracks yet.</p>
          <Link href="/upload" className="mt-3 inline-block rounded-md border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
            Upload some
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Your Library</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs…"
              className="peer w-64 rounded-md border border-white/10 bg-white/[0.02] px-8 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20 focus:ring-2 focus:ring-white/10"
            />
            <Search size={16} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/50 peer-focus:text-white/70" />
          </div>
          <button
            onClick={() => playAll(filtered)}
            className="rounded-md border border-white/10 bg-white text-black px-3 py-2 text-sm hover:opacity-90 active:opacity-80"
          >
            Play all
          </button>
          <button
            onClick={() => shuffleAll(filtered)}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/10"
          >
            <Shuffle size={16} /> Shuffle
          </button>
        </div>
      </div>

      {/* Shorter cards: 2 cols on mobile, shorter cover on small screens */}
      <div className="grid gap-4 grid-cols-2 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((t, i) => {
          const isCurrent = currentId === t.publicId;
          const d = durations[t.publicId] ?? t.duration;
          const cover = t.coverUrl || '/logo.jpeg';

          return (
            <motion.div
              key={t.publicId}
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`group relative flex flex-col overflow-hidden rounded-xl border p-3 transition-colors ${
                isCurrent
                  ? 'border-pink-500/60 bg-pink-500/[0.07]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              {/* Cover: shorter on small screens, square from md up */}
              <div className="relative aspect-[4/3] md:aspect-square w-full overflow-hidden rounded-lg ring-1 ring-inset ring-white/10">
                {isCurrent && (
                  <div className="absolute left-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/90 px-2 py-0.5 text-[10px] font-medium text-white shadow ring-1 ring-white/20">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                      Now playing
                    </span>
                  </div>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" className="h-full w-full object-cover" />

                <button
                  onClick={() => setQueue(toPlayerQueue(filtered), i)}
                  className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 focus-visible:bg-black/30 focus-visible:opacity-100 outline-none"
                  title="Play"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-sm ring-1 ring-black/10 md:h-12 md:w-12">
                    <Play size={18} />
                  </span>
                </button>
              </div>

              {/* Meta (compact) */}
              <div className="mt-2">
                <div className="min-w-0 truncate text-sm font-medium" title={t.title}>
                  {t.title}
                </div>
                <div className="truncate text-[11px] text-white/60">
                  {t.artist || ''} {d ? `• ${fmt(d)}` : ''}
                </div>
              </div>

              {/* Actions (compact) */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => openPicker(t.publicId)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/10"
                  title="Add to playlist"
                >
                  <ListPlus size={13} /> Add to playlist
                </button>
                <button
                  onClick={() => remove(t.publicId)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/10"
                  title="Remove from library"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>

              {/* Playlist picker as overlay */}
              <AnimatePresence>
                {pickerFor === t.publicId && (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-end"
                    aria-modal="true"
                    role="dialog"
                  >
                    <div
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setPickerFor(null)}
                    />
                    <motion.div
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 12, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      className="relative z-10 m-3 w-full rounded-xl border border-white/10 bg-[#0b0b12]/95 p-3 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-white/70">Add “{t.title}” to…</div>
                        <button
                          onClick={() => setPickerFor(null)}
                          className="rounded-md p-1 text-white/60 hover:bg-white/5 hover:text-white/80"
                          aria-label="Close"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {playlists.length ? (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {playlists.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => addToPlaylist(p.id, t.publicId)}
                              className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                            >
                              + {p.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-2 text-xs text-white/60">No playlists yet</div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          value={newPlName}
                          onChange={(e) => setNewPlName(e.target.value)}
                          placeholder="New playlist name"
                          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs outline-none placeholder:text-white/40 focus:border-white/20"
                        />
                        <button
                          onClick={() => createAndAdd(t.publicId)}
                          disabled={!newPlName.trim()}
                          className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-50"
                        >
                          Create & add
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
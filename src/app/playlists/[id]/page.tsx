'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, X, Trash2, Clock, ListMusic, ArrowLeft } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';
import { useLikes } from '@/lib/likes-context';

type ApiTrack = {
  publicId: string;
  title: string;
  artist?: string;
  album?: string;
  audioUrl: string;
  duration?: number;
  coverUrl?: string;
};
type Playlist = { id: string; name: string; createdAt: number; itemIds: string[]; coverUrl?: string; };
type PlayerTrack = ApiTrack & { id: string };

const btn = {
  base: 'inline-flex items-center gap-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-white/10 active:translate-y-[0.5px]',
  primary: 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_8px_24px_-6px_rgba(236,72,153,0.5)] hover:shadow-[0_10px_28px_-6px_rgba(236,72,153,0.65)]',
  glass: 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white',
  danger: 'border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-200',
  tiny: 'px-2.5 py-1.5 text-[11px]',
  md: 'px-3 py-2 text-sm'
};

export default function PlaylistDetail() {
  const params = useParams<{ id: string }>();
  const { setQueue } = usePlayer();
  const { like, unlike, isLiked: isLikedTrack } = useLikes();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [allTracks, setAllTracks] = useState<ApiTrack[]>([]);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<string, number>>({});

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [p, t] = await Promise.all([
        fetch(`/api/playlists/${params.id}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/tracks', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setPlaylist(p);
      setAllTracks(Array.isArray(t) ? t : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [params.id]);

  const trackMap = useMemo(() => new Map(allTracks.map((t) => [t.publicId, t])), [allTracks]);

  const playlistTracks: ApiTrack[] = useMemo(() => {
    if (!playlist) return [];
    return playlist.itemIds.map((id) => trackMap.get(id)).filter(Boolean) as ApiTrack[];
  }, [playlist, trackMap]);

  const playerQueue: PlayerTrack[] = useMemo(
    () => playlistTracks.map((t) => ({ ...t, id: t.publicId })),
    [playlistTracks]
  );

  useEffect(() => {
    const missing = playlistTracks.filter((t) => !(t.duration && t.duration > 0) && !durations[t.publicId]);
    if (!missing.length) return;
    let cancelled = false;
    missing.forEach((t) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      audio.src = t.audioUrl;
      audio.onloadedmetadata = () => {
        if (cancelled) return;
        const d = Math.round(audio.duration || 0);
        if (d > 0) setDurations((prev) => ({ ...prev, [t.publicId]: d }));
      };
      try { audio.load(); } catch {}
    });
    return () => { cancelled = true; };
  }, [playlistTracks, durations]);

  const totalDurationSec = useMemo(() => {
    return playlistTracks.reduce((acc, t) => acc + (durations[t.publicId] ?? t.duration ?? 0), 0);
  }, [playlistTracks, durations]);

  const isLikedPlaylist = useMemo(
    () => playlist?.id === 'liked' || playlist?.name?.toLowerCase() === 'liked songs',
    [playlist]
  );

  const coverHero = useMemo(() => {
    if (isLikedPlaylist) return playlist?.coverUrl || '/liked.png';
    return playlist?.coverUrl || playlistTracks[0]?.coverUrl || '/logo.jpeg';
  }, [isLikedPlaylist, playlist, playlistTracks]);

  const candidates = useMemo(() => {
    const missing = allTracks.filter((t) => !playlist?.itemIds.includes(t.publicId));
    const q = query.trim().toLowerCase();
    if (!q) return missing;
    return missing.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.artist || '').toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q)
    );
  }, [allTracks, playlist, query]);

  async function removeFromPlaylist(publicId: string) {
    if (!playlist) return;
    if (isLikedPlaylist) {
      // Use LikesContext to unlike (updates global heart immediately)
      await unlike(publicId);
      await refresh();
      return;
    }
    await fetch(`/api/playlists/${playlist.id}/tracks?publicId=${encodeURIComponent(publicId)}`, { method: 'DELETE' });
    refresh();
  }

  async function addToPlaylist(publicId: string) {
    if (!playlist) return;
    if (isLikedPlaylist) {
      // Use LikesContext to like (updates global heart immediately)
      await like(publicId);
      await refresh();
      return;
    }
    await fetch(`/api/playlists/${playlist.id}/tracks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    refresh();
  }

  async function deletePlaylist() {
    if (!playlist) return;
    if (!confirm('Delete this playlist?')) return;
    await fetch(`/api/playlists/${playlist.id}`, { method: 'DELETE' });
    location.href = '/playlists';
  }

  function playAll() {
    if (!playerQueue.length) return;
    setQueue(playerQueue, 0);
  }

  const fmtTime = (sec?: number) => {
    if (!sec || !isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fmtTotal = (sec: number) => {
    if (!sec || !isFinite(sec) || sec <= 0) return '0m';
    if (sec < 60) return `${Math.round(sec)}s`;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto pb-28">
        <div className="h-32 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />
        <div className="mt-4 h-10 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-5xl mx-auto pb-28">
        <p className="text-red-400">{error}</p>
        <Link href="/playlists" className={`${btn.base} ${btn.md} ${btn.glass} mt-2 inline-flex`}>
          <ArrowLeft size={16} /> Back to Playlists
        </Link>
      </section>
    );
  }

  if (!playlist) {
    return (
      <section className="max-w-5xl mx-auto pb-28">
        <p className="text-white/70">Playlist not found.</p>
        <Link href="/playlists" className={`${btn.base} ${btn.md} ${btn.glass} mt-2 inline-flex`}>
          <ArrowLeft size={16} /> Back to Playlists
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto pb-28">
      {/* Back button */}
      <div className="mb-3">
        <Link href="/playlists" className={`${btn.base} ${btn.tiny} ${btn.glass}`}>
          <ArrowLeft size={14} /> Back to Playlists
        </Link>
      </div>

      {/* COMPACT HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="absolute inset-0 opacity-30 blur-sm scale-110">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverHero} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-t from-black/50 to-black/0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverHero} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold truncate">{playlist.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-white/90 backdrop-blur">
                  <ListMusic size={14} /> {playerQueue.length} {playerQueue.length === 1 ? 'track' : 'tracks'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-white/90 backdrop-blur">
                  <Clock size={14} /> {fmtTotal(totalDurationSec)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={playAll} className={`${btn.base} ${btn.md} ${btn.primary}`}>Play all</button>
            <button onClick={() => setAdding(true)} className={`${btn.base} ${btn.md} ${btn.glass}`}>Add tracks</button>
            {/* Hide Delete for liked */}
            {!isLikedPlaylist && (
              <button onClick={deletePlaylist} className={`${btn.base} ${btn.md} ${btn.danger}`}>Delete</button>
            )}
          </div>
        </div>
      </div>

      {/* TRACK CARDS */}
      <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {playerQueue.length === 0 ? (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-white/70">
            No tracks yet. Use “Add tracks”.
          </div>
        ) : (
          playerQueue.map((t, i) => {
            const d = durations[t.publicId] ?? t.duration;
            return (
              <motion.div
                key={t.publicId}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2 hover:border-white/20"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-inset ring-white/10">
                  <div className="absolute right-2 bottom-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-md">
                      <Clock size={12} /> {fmtTime(d)}
                    </span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.coverUrl || '/logo.jpeg'} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setQueue(playerQueue, i)}
                    className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 focus-visible:bg-black/30 focus-visible:opacity-100 outline-none"
                    title="Play"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow ring-1 ring-black/10 sm:h-10 sm:w-10">
                      <Play size={16} />
                    </span>
                  </button>
                </div>

                <div className="mt-2">
                  <div className="truncate text-sm font-medium" title={t.title}>{t.title}</div>
                  <div className="truncate text-[11px] text-white/60">{t.artist || ''}</div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button onClick={() => setQueue(playerQueue, i)} className={`${btn.base} ${btn.tiny} ${btn.glass}`}>Play</button>
                  <button onClick={() => removeFromPlaylist(t.publicId)} className={`${btn.base} ${btn.tiny} ${btn.danger}`}>Remove</button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add tracks slide-over */}
      <AnimatePresence>
        {adding && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAdding(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto border-l border-white/10 bg-[#0b0b12]/95 p-4 shadow-2xl"
              initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">Add tracks</div>
                <button onClick={() => setAdding(false)} className={`${btn.base} ${btn.tiny} ${btn.glass}`}>
                  <X size={14} />
                </button>
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your library…"
                className="mb-3 w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
              />

              {!candidates.length ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm text-white/60">
                  No more tracks to add.
                </div>
              ) : (
                <div className="space-y-2">
                  {candidates.map((t) => (
                    <div key={t.publicId} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 overflow-hidden rounded-md ring-1 ring-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.coverUrl || '/logo.jpeg'} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{t.title}</div>
                          <div className="truncate text-xs text-white/60">{t.artist || ''}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => (isLikedPlaylist ? like(t.publicId) : addToPlaylist(t.publicId))}
                        className={`${btn.base} ${btn.tiny} ${btn.primary}`}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
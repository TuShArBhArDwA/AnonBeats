'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Plus, X, Trash2, Clock } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';

type ApiTrack = {
  publicId: string;
  title: string;
  artist?: string;
  album?: string;
  audioUrl: string;
  duration?: number;
  coverUrl?: string;
};
type Playlist = { id: string; name: string; createdAt: number; itemIds: string[] };
type PlayerTrack = ApiTrack & { id: string };

export default function PlaylistDetail() {
  const params = useParams<{ id: string }>();
  const { setQueue } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [allTracks, setAllTracks] = useState<ApiTrack[]>([]);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Measured durations map (publicId -> seconds)
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

  // Measure durations for tracks missing it
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
        if (d > 0) {
          setDurations((prev) => ({ ...prev, [t.publicId]: d }));
        }
      };
      audio.onerror = () => {
        // ignore
      };
      // Safari sometimes needs an explicit load
      try { audio.load(); } catch {}
    });

    return () => { cancelled = true; };
  }, [playlistTracks, durations]);

  // Compute total duration using measured where available
  const totalDurationSec = useMemo(() => {
    return playlistTracks.reduce((acc, t) => acc + (durations[t.publicId] ?? t.duration ?? 0), 0);
  }, [playlistTracks, durations]);

  const coverHero = useMemo(
    () => playlistTracks[0]?.coverUrl || '/logo.jpeg',
    [playlistTracks]
  );

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
    await fetch(`/api/playlists/${playlist.id}/tracks?publicId=${encodeURIComponent(publicId)}`, { method: 'DELETE' });
    refresh();
  }

  async function addToPlaylist(publicId: string) {
    if (!playlist) return;
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

  // Show "Xs" if total under a minute, "Xm" else, "Xh Ym" if long
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
      <section className="max-w-5xl mx-auto">
        <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />
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
      <section className="max-w-5xl mx-auto">
        <p className="text-red-400">{error}</p>
        <Link href="/playlists" className="underline mt-2 inline-block">Back to Playlists</Link>
      </section>
    );
  }

  if (!playlist) {
    return (
      <section className="max-w-5xl mx-auto">
        <p className="text-white/70">Playlist not found.</p>
        <Link href="/playlists" className="underline">Back to Playlists</Link>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="absolute inset-0 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverHero} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 p-6 sm:p-8 bg-gradient-to-t from-black/60 to-black/0">
          <div className="flex flex-wrap items-end gap-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-xl ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverHero} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold truncate">{playlist.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-white/70">
                <span>{playlist.itemIds.length} track{playlist.itemIds.length !== 1 ? 's' : ''}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> {fmtTotal(totalDurationSec)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={playAll}
              className="rounded-md border border-white/10 bg-white text-black px-3 py-2 text-sm hover:opacity-90"
            >
              Play all
            </button>
            <button
              onClick={() => setAdding((v) => !v)}
              className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            >
              {adding ? 'Close add' : 'Add tracks'}
            </button>
            <button
              onClick={deletePlaylist}
              className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Add tracks panel */}
      {adding && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-white/70">Add tracks to {playlist.name}</div>
            <button onClick={() => setAdding(false)} className="rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5">
              <X size={14} />
            </button>
          </div>

          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library…"
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
            />
          </div>

          {!candidates.length ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm text-white/60">
              No more tracks to add.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {candidates.map((t) => (
                <div key={t.publicId} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 overflow-hidden rounded-md ring-1 ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.coverUrl || '/logo.jpeg'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.title}</div>
                      <div className="truncate text-xs text-white/60">{t.artist || ''}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => addToPlaylist(t.publicId)}
                    className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 inline-flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracks list */}
      <div className="mt-4 space-y-2">
        {!playerQueue.length ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-white/70">
            No tracks yet. Use “Add tracks”.
          </div>
        ) : (
          playerQueue.map((t, i) => (
            <motion.div
              key={t.publicId}
              whileHover={{ y: -1, scale: 1.001 }}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 overflow-hidden rounded-md ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.coverUrl || '/logo.jpeg'} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-xs text-white/60">{t.artist || ''}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-white/60">
                  {fmtTime(durations[t.publicId] ?? t.duration)}
                </span>
                <button
                  onClick={() => setQueue(playerQueue, i)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  Play
                </button>
                <button
                  onClick={() => removeFromPlaylist(t.publicId)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-6">
        <Link href="/playlists" className="underline">Back to Playlists</Link>
      </div>
    </section>
  );
}
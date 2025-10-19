'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, Plus } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';

type Track = {
  publicId: string;
  title: string;
  artist?: string;
  album?: string;
  audioUrl: string;
  duration?: number;
  coverUrl?: string;
};

export default function LibraryPage() {
  const { setQueue, queue, index } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tracks', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTracks(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const currentId = queue[index]?.publicId;

  async function remove(publicId: string) {
    if (!confirm('Delete this track from Cloudinary?')) return;
    await fetch(`/api/tracks/${encodeURIComponent(publicId)}`, { method: 'DELETE' });
    fetchTracks();
  }

  if (loading) return <section><h1 className="text-2xl font-semibold mb-4">Your Library</h1><p className="text-white/70">Loading…</p></section>;
  if (error) return <section><h1 className="text-2xl font-semibold mb-4">Your Library</h1><p className="text-red-400">{error}</p></section>;
  if (!tracks.length) return <section><h1 className="text-2xl font-semibold mb-4">Your Library</h1><p className="text-white/70">No tracks yet. Upload some!</p></section>;

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Your Library</h1>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {tracks.map((t, i) => {
          const isCurrent = currentId === t.publicId;
          return (
            <motion.div
              key={t.publicId}
              whileHover={{ y: -2, scale: 1.01 }}
              className={`group relative overflow-hidden rounded-xl border p-3 transition
                ${isCurrent ? 'border-pink-500/50 bg-pink-500/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <button onClick={() => setQueue(tracks as any, i)} className="block w-full text-left">
                <div className="aspect-square w-full overflow-hidden rounded-lg">
                  {t.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.coverUrl} alt={t.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-fuchsia-500/15 to-pink-500/15" />
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {t.title}{isCurrent && <span className="ml-2 text-xs text-pink-400">Now playing</span>}
                    </div>
                    <div className="truncate text-xs text-white/60">
                      {t.artist || ''}{t.duration ? ` • ${Math.round(t.duration)}s` : ''}
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center justify-center rounded-full bg-white text-black p-2 opacity-0 group-hover:opacity-100 transition">
                    <Play size={16} />
                  </span>
                </div>
              </button>

              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => alert('Add to playlist (coming next)')}
                  className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/5 inline-flex items-center gap-1"
                  title="Add to playlist"
                >
                  <Plus size={14} /> Add to playlist
                </button>
                <button
                  onClick={() => remove(t.publicId)}
                  className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/5 inline-flex items-center gap-1"
                  title="Delete from Cloudinary"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '@/lib/player-context';
import { Pause, Play, SkipBack, SkipForward, Volume2, Repeat, Repeat1, Heart } from 'lucide-react';

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type LikedPlaylist = { id: string; name: string; itemIds: string[] };

export default function PlayerBar() {
  const { queue, index, playing, audioRef, next, prev, play, pause, setVolume, repeat, setRepeat } = usePlayer();
  const track = queue[index];
  const disabled = !track;

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Liked songs state
  const [likedPlaylistId, setLikedPlaylistId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeBusy, setLikeBusy] = useState(false);

  // Ensure liked exists and load once
  useEffect(() => {
    let cancelled = false;
    async function ensureAndLoadLiked() {
      try {
        let pid: string | null = null;
        let items: string[] = [];

        const res = await fetch('/api/playlists/liked', { cache: 'no-store' });
        const body = res.ok ? await res.json() : null;

        if (body && body?.id) {
          pid = body.id;
          items = Array.isArray(body.itemIds) ? body.itemIds : [];
          if (!body.coverUrl) {
            await fetch('/api/playlists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: 'liked', name: 'Liked songs', coverUrl: '/liked.png' }),
            }).catch(() => {});
          }
        } else {
          const cr = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'liked', name: 'Liked songs', coverUrl: '/liked.png' }),
          });
          if (cr.ok) {
            const p = await cr.json();
            pid = p.id;
            items = [];
          }
        }

        if (!cancelled) {
          if (pid) setLikedPlaylistId(pid);
          setLikedIds(new Set(items));
        }
      } catch {
        // ignore
      }
    }

    ensureAndLoadLiked();
    return () => { cancelled = true; };
  }, []);

  // Reload helper
  async function reloadLiked() {
    try {
      const res = await fetch('/api/playlists/liked', { cache: 'no-store' });
      if (res.ok) {
        const p = await res.json();
        const items: string[] = Array.isArray(p?.itemIds) ? p.itemIds : [];
        setLikedPlaylistId(p?.id || 'liked');
        setLikedIds(new Set(items));
      }
    } catch {}
  }

  // Listen for broadcasts, cross-tab storage, and refocus
  useEffect(() => {
    function onExternalChange() {
      reloadLiked();
    }
    function onStorage(e: StorageEvent) {
      if (e.key === 'likes:version') reloadLiked();
    }

    window.addEventListener('likes:changed', onExternalChange);
    window.addEventListener('focus', onExternalChange);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('likes:changed', onExternalChange);
      window.removeEventListener('focus', onExternalChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isLiked = useMemo(() => (track ? likedIds.has(track.publicId) : false), [track, likedIds]);

  async function toggleLike() {
    if (!track || likeBusy) return;
    if (!likedPlaylistId) {
      try {
        const cr = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'liked', name: 'Liked songs', coverUrl: '/liked.png' }),
        });
        if (cr.ok) {
          const p = (await cr.json()) as LikedPlaylist;
          setLikedPlaylistId(p.id);
        }
      } catch {}
    }

    const pid = likedPlaylistId || 'liked';
    const tId = track.publicId;
    setLikeBusy(true);

    // optimistic
    setLikedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(tId)) copy.delete(tId);
      else copy.add(tId);
      return copy;
    });

    try {
      if (!isLiked) {
        const r = await fetch(`/api/playlists/${encodeURIComponent(pid)}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: tId }),
        });
        if (!r.ok) throw new Error('Failed to like');
      } else {
        const r = await fetch(`/api/playlists/${encodeURIComponent(pid)}/tracks?publicId=${encodeURIComponent(tId)}`, {
          method: 'DELETE',
        });
        if (!r.ok) throw new Error('Failed to unlike');
      }

      // Broadcast to update PlayerBar and other pages
      window.dispatchEvent(new Event('likes:changed'));
      localStorage.setItem('likes:version', String(Date.now()));
    } catch {
      // revert
      setLikedIds((prev) => {
        const copy = new Set(prev);
        if (!isLiked) copy.delete(tId);
        else copy.add(tId);
        return copy;
      });
    } finally {
      setLikeBusy(false);
    }
  }

  // Keyboard shortcut: L
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'l') { e.preventDefault(); toggleLike(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLiked, likedPlaylistId, track]);

  // Time/duration listeners
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrentTime(a.currentTime || 0);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
    };
  }, [audioRef, track?.audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => {}); else audioRef.current.pause();
  }, [playing, track?.audioUrl, audioRef]);

  const cycleRepeat = () => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');

  const disabledBtn = 'opacity-40 cursor-not-allowed';
  const disabledRange = 'opacity-40 cursor-not-allowed';

  // Desktop UI
  const Desktop = (
    <div className="hidden md:block">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-3 gap-4 items-center">
        <div className="min-w-0">
          <div className="truncate font-medium">{track?.title || 'AnonBEATS'}</div>
          <div className="truncate text-xs text-white/60">{track?.artist || ''}</div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button onClick={prev} disabled={disabled} className={`p-2 rounded-md hover:bg:white/5 ${disabled ? disabledBtn : 'hover:bg-white/5'}`} title={disabled ? 'No track' : 'Previous'}>
              <SkipBack size={18} />
            </button>
            <button
              onClick={playing ? pause : play}
              disabled={disabled}
              className={`p-3 rounded-full ${disabled ? 'bg-white/30 text-black/60 ' + disabledBtn : 'bg-white text-black hover:opacity-90 transition'}`}
              title={disabled ? 'No track' : (playing ? 'Pause' : 'Play')}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={next} disabled={disabled} className={`p-2 rounded-md ${disabled ? disabledBtn : 'hover:bg-white/5'}`} title={disabled ? 'No track' : 'Next'}>
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex w-full items-center gap-3 text-xs text:white/60">
            <span className="tabular-nums">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.25}
              value={currentTime}
              onChange={(e) => {
                const t = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = t;
                setCurrentTime(t);
              }}
              disabled={disabled}
              className={`w-full accent-pink-500 ${disabled ? disabledRange : ''}`}
            />
            <span className="tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Volume2 size={18} className={`text-white/70 ${disabled ? 'opacity-40' : ''}`} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={disabled}
            className={`w-28 accent-pink-500 ${disabled ? disabledRange : ''}`}
          />
          <button
            onClick={toggleLike}
            disabled={disabled || likeBusy}
            className={`p-2 rounded-md ${disabled ? disabledBtn : 'hover:bg-white/5'} ${isLiked ? 'text-pink-400' : 'text-white/70'}`}
            title={disabled ? 'No track' : isLiked ? 'Unlike (L)' : 'Like (L)'}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className="transition" />
          </button>
          <button
            onClick={cycleRepeat}
            disabled={disabled}
            className={`p-2 rounded-md ${disabled ? disabledBtn : 'hover:bg-white/5'} ${repeat !== 'off' ? 'text-pink-400' : 'text-white/70'}`}
            title={disabled ? 'No track' : repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
          >
            {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile UI
  const Mobile = (
    <div className="md:hidden px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="text-xs text-white/70 truncate">{track?.title || 'AnonBEATS'}</div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button onClick={prev} disabled={disabled} className={`p-2 rounded-md text-white/80 ${disabled ? disabledBtn : 'hover:bg-white/5'}`}>
          <SkipBack size={18} />
        </button>
        <button
          onClick={playing ? pause : play}
          disabled={disabled}
          className={`grid h-10 w-10 place-items-center rounded-full ${disabled ? 'bg-white/30 text-black/60 ' + disabledBtn : 'bg-white text-black hover:opacity-90 transition'}`}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={next} disabled={disabled} className={`p-2 rounded-md text-white/80 ${disabled ? disabledBtn : 'hover:bg-white/5'}`}>
          <SkipForward size={18} />
        </button>
        <button
          onClick={toggleLike}
          disabled={disabled || likeBusy}
          className={`p-2 rounded-md ${disabled ? disabledBtn : 'hover:bg-white/5'} ${isLiked ? 'text-pink-400' : 'text-white/70'}`}
          title={disabled ? 'No track' : isLiked ? 'Unlike (L)' : 'Like (L)'}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className="transition" />
        </button>
        <button
          onClick={cycleRepeat}
          disabled={disabled}
          className={`p-2 rounded-md ${disabled ? disabledBtn : 'hover:bg-white/5'} ${repeat !== 'off' ? 'text-pink-400' : 'text-white/70'}`}
          title={disabled ? 'No track' : repeat === 'off' ? 'Repeat off' : 'Repeat all/off'}
        >
          {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-white/60">
        <span className="tabular-nums">{fmt(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={currentTime}
          onChange={(e) => {
            const t = Number(e.target.value);
            if (audioRef.current) audioRef.current.currentTime = t;
            setCurrentTime(t);
          }}
          disabled={disabled}
          className={`w-full accent-pink-500 h-1 ${disabled ? disabledRange : ''}`}
        />
        <span className="tabular-nums">{fmt(duration)}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/70 backdrop-blur-xl">
      {Desktop}
      {Mobile}
    </div>
  );
}
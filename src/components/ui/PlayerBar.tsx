'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '@/lib/player-context';
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';

export default function PlayerBar() {
  const { queue, index, playing, play, pause, next, prev, audioRef, setVolume, seek, currentTime } = usePlayer();
  const track = queue[index];
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    audio.addEventListener('loadedmetadata', onLoaded);
    if (playing) audio.play().catch(() => {});
    return () => audio.removeEventListener('loadedmetadata', onLoaded);
  }, [audioRef, playing, track?.audioUrl]);

  const pct = useMemo(() => (duration ? (currentTime / duration) * 100 : 0), [currentTime, duration]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-3 gap-4 items-center">
        {/* Left: Title */}
        <div className="min-w-0">
          <div className="truncate font-medium">{track?.title || 'Nothing playing'}</div>
          <div className="truncate text-xs text-white/60">{track?.artist || ''}</div>
        </div>

        {/* Middle: Controls + Seek */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button onClick={prev} className="p-2 hover:bg-white/5 rounded-md"><SkipBack size={18} /></button>
            <button onClick={playing ? pause : play} className="p-3 rounded-full bg-white text-black hover:opacity-90 transition">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={next} className="p-2 hover:bg-white/5 rounded-md"><SkipForward size={18} /></button>
          </div>
          <div className="flex w-full items-center gap-3 text-xs text-white/60">
            <span className="tabular-nums">{fmt(currentTime)}</span>
            <input
              type="range" min={0} max={duration || 0} step={0.25} value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full accent-pink-500"
            />
            <span className="tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center gap-2 justify-end">
          <Volume2 size={18} className="text-white/70" />
          <input
            type="range" min={0} max={1} step={0.01}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-28 accent-pink-500"
          />
        </div>
      </div>
    </div>
  );
}

function fmt(sec: number) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '@/lib/player-context';
import { Pause, Play, SkipBack, SkipForward, Volume2, Repeat, Repeat1 } from 'lucide-react';

export default function PlayerBar() {
  const {
    queue,
    index,
    playing,
    setCurrentTime, // if you don't expose this, remove and rely on onTimeUpdate only
    currentTime,
    audioRef,
    next,
    prev,
    play,
    pause,
    setVolume,
    repeat,
    setRepeat,
  } = usePlayer() as any;

  const track = queue[index];
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => {}; // handled in context via onEnded
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    if (playing) audio.play().catch(() => {});
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioRef, playing, track?.audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing, track?.audioUrl]);

  const fmt = (sec: number) => {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cycleRepeat = () => {
    setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');
  };

  const repeatTitle = repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-3 gap-4 items-center">
        {/* Left: Title/artist */}
        <div className="min-w-0">
          <div className="truncate font-medium">{track?.title || 'Nothing playing'}</div>
          <div className="truncate text-xs text-white/60">{track?.artist || ''}</div>
        </div>

        {/* Middle: Controls + Seek */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="p-2 hover:bg-white/5 rounded-md"><SkipBack size={18} /></button>
            <button onClick={playing ? pause : play} className="p-3 rounded-full bg-white text-black hover:opacity-90 transition">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={next} className="p-2 hover:bg-white/5 rounded-md"><SkipForward size={18} /></button>

            {/* Repeat toggle */}
            <button
              onClick={cycleRepeat}
              title={repeatTitle}
              className={`p-2 rounded-md hover:bg-white/5 transition ${repeat !== 'off' ? 'text-pink-400' : 'text-white/70'}`}
            >
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="flex w-full items-center gap-3 text-xs text-white/60">
            <span className="tabular-nums">{fmt(currentTime || 0)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.25}
              value={currentTime || 0}
              onChange={(e) => {
                const t = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = t;
              }}
              className="w-full accent-pink-500"
            />
            <span className="tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center gap-2 justify-end">
          <Volume2 size={18} className="text-white/70" />
          <input
            type="range"
            min={0} max={1} step={0.01}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-28 accent-pink-500"
          />
        </div>
      </div>
    </div>
  );
}
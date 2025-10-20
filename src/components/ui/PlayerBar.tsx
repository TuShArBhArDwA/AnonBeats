'use client';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/lib/player-context';
import {
  Pause, Play, SkipBack, SkipForward, Volume2,
  Repeat, Repeat1, Shuffle as ShuffleIcon, ChevronUp, ChevronDown
} from 'lucide-react';

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar() {
  const {
    queue, index, playing, audioRef,
    next, prev, play, pause,
    setVolume, repeat, setRepeat, 
  } = usePlayer();

  const track = queue[index];
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded] = useState(false); // mobile expand/collapse

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
    if (playing) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing, track?.audioUrl, audioRef]);

  const cycleRepeat = () =>
    setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');

  // Desktop bar (unchanged feel)
  const Desktop = (
    <div className="hidden md:block">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-3 gap-4 items-center">
        {/* Left: meta */}
        <div className="min-w-0">
          <div className="truncate font-medium">{track?.title || 'Nothing playing'}</div>
          <div className="truncate text-xs text-white/60">{track?.artist || ''}</div>
        </div>

        {/* Middle: controls + seek */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="p-2 hover:bg-white/5 rounded-md"><SkipBack size={18} /></button>
            <button onClick={playing ? pause : play} className="p-3 rounded-full bg-white text-black hover:opacity-90 transition">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={next} className="p-2 hover:bg-white/5 rounded-md"><SkipForward size={18} /></button>

            <button
              onClick={cycleRepeat}
              title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
              className={`p-2 rounded-md hover:bg-white/5 transition ${repeat !== 'off' ? 'text-pink-400' : 'text-white/70'}`}
            >
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="flex w-full items-center gap-3 text-xs text-white/60">
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
              className="w-full accent-pink-500"
            />
            <span className="tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: volume */}
        <div className="flex items-center gap-2 justify-end">
          <Volume2 size={18} className="text-white/70" />
          <input type="range" min={0} max={1} step={0.01} onChange={(e) => setVolume(Number(e.target.value))} className="w-28 accent-pink-500" />
        </div>
      </div>
    </div>
  );

  // Mobile layout (compact, repeat inline — no expand)
const Mobile = (
  <div className="md:hidden px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
    {/* Transport row with repeat at the end */}
    <div className="flex items-center justify-center gap-3">
      <button onClick={prev} className="p-2 hover:bg-white/5 rounded-md text-white/80">
        <SkipBack size={18} />
      </button>

      <button
        onClick={playing ? pause : play}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-black hover:opacity-90 transition"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <button onClick={next} className="p-2 hover:bg-white/5 rounded-md text-white/80">
        <SkipForward size={18} />
      </button>

      {/* Repeat on the rightmost side */}
      <button
        onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
        title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
        className={`p-2 rounded-md hover:bg-white/5 transition ${repeat !== 'off' ? 'text-pink-400' : 'text-white/70'}`}
      >
        {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
      </button>
    </div>

    {/* Tiny progress bar */}
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
        className="w-full accent-pink-500 h-1"
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
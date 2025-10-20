'use client';
import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';

import type { Track } from '@/lib/library';

type RepeatMode = 'off' | 'all' | 'one';

type PlayerState = {
  queue: Track[];
  index: number;
  playing: boolean;
  volume: number;
  currentTime: number;
  repeat: RepeatMode;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  setRepeat: (m: RepeatMode) => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
};

const PlayerContext = createContext<PlayerState | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQ] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [repeat, setRepeat] = useState<RepeatMode>('off');

  const current = queue[index] ?? null;

  const setQueue = (tracks: Track[], startIndex = 0) => {
    setQ(tracks);
    setIndex(startIndex);
    setPlaying(true);
    setCurrentTime(0);
  };

  const play = () => {
    setPlaying(true);
    audioRef.current?.play().catch(() => {});
  };

  const pause = () => {
    setPlaying(false);
    audioRef.current?.pause();
  };

  const next = () => {
    if (!queue.length) return;
  setIndex((i) => {
    const len = queue.length;
    if (len === 1) {
      // restart the same track
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
      return 0;
    }
    return (i + 1) % len;
  });
  };

  const prev = () => {
    if (!queue.length) return;
    setIndex((i) => (i - 1 + queue.length) % queue.length);
  };

  const seek = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const setVol = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing && current) a.play().catch(() => {});
    else a.pause();
  }, [playing, current?.audioUrl]);

  // Media Session metadata (optional – keep if you already had it)
  useEffect(() => {
    if (!current) return;
    const nav: any = typeof navigator !== 'undefined' ? (navigator as any) : null;
    const MM: any = typeof window !== 'undefined' ? (window as any).MediaMetadata : undefined;
    if (nav?.mediaSession && typeof MM === 'function') {
      nav.mediaSession.metadata = new MM({
        title: current.title,
        artist: current.artist || '',
        album: current.album || '',
        artwork: current.coverUrl ? [{ src: current.coverUrl, sizes: '512x512', type: 'image/png' }] : [],
      });
      nav.mediaSession.setActionHandler?.('play', play);
      nav.mediaSession.setActionHandler?.('pause', pause);
      nav.mediaSession.setActionHandler?.('previoustrack', prev);
      nav.mediaSession.setActionHandler?.('nexttrack', next);
    }
  }, [current?.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<PlayerState>(
    () => ({
      queue,
      index,
      playing,
      volume,
      currentTime,
      repeat,
      setQueue,
      play,
      pause,
      next,
      prev,
      seek,
      setVolume: setVol,
      setRepeat,
      audioRef,
    }),
    [queue, index, playing, volume, currentTime, repeat]
  );

  // Use a handler that respects repeat mode when a track ends
  const handleEnded = () => {
    if (!queue.length) return;
    const len = queue.length;
    const isLast = index >= len - 1;

    if (repeat === 'one') {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
      return;
    }

    if (!isLast) {
      setIndex(index + 1);
      return;
    }

    if (repeat === 'all') {
      setIndex(0);
    } else {
      setPlaying(false);
    }
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        key={current?.publicId || 'empty'}
        ref={audioRef}
        {...(current ? { src: current.audioUrl, preload: 'metadata' } : { preload: 'none' })}
        onLoadedMetadata={() => setCurrentTime(0)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
'use client';
import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';
import type { Track } from '@/lib/library';

type PlayerState = {
  queue: Track[];
  index: number;
  playing: boolean;
  volume: number;
  currentTime: number;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  // Use MutableRefObject to match useRef(...) return type
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
    setIndex((i) => Math.min(queue.length - 1, i + 1));
  };

  const prev = () => {
    if (!queue.length) return;
    setIndex((i) => Math.max(0, i - 1));
  };

  const seek = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const setVol = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  // Keep volume synced
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Ensure play/pause reflects state and track changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing && current) a.play().catch(() => {});
    else a.pause();
  }, [playing, current?.audioUrl]);

  // Media Session (guard against missing types/constructors)
  useEffect(() => {
    if (!current) return;
    // Ensure we're in the browser and Media Session API exists
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.audioUrl]);

  const value = useMemo<PlayerState>(
    () => ({
      queue,
      index,
      playing,
      volume,
      currentTime,
      setQueue,
      play,
      pause,
      next,
      prev,
      seek,
      setVolume: setVol,
      audioRef,
    }),
    [queue, index, playing, volume, currentTime]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* Only set src when we have a track to avoid the empty-src warning */}
      <audio
        key={current?.publicId || 'empty'}
        ref={audioRef}
        {...(current ? { src: current.audioUrl, preload: 'metadata' } : { preload: 'none' })}
        onLoadedMetadata={() => setCurrentTime(0)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={next}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
export type Track = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  audioUrl: string;
  duration?: number;
  publicId: string;
  bytes?: number;
  format?: string;
  coverUrl?: string;
};

const KEY = 'anonbeats:tracks';

export function addToLibrary(track: Track) {
  try {
    const arr: Track[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const exists = arr.some((t) => t.publicId === track.publicId);
    const next = exists ? arr : [track, ...arr];
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function getLibrary(): Track[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
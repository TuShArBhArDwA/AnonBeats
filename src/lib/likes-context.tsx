'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type LikesCtx = {
  ready: boolean;
  ids: Set<string>;
  isLiked: (id?: string) => boolean;
  like: (id: string) => Promise<void>;
  unlike: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const Ctx = createContext<LikesCtx | null>(null);

async function ensureLikedPlaylist() {
  await fetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'liked', name: 'Liked songs', coverUrl: '/liked.png' }),
  }).catch(() => {});
}

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const loading = useRef(false);

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await fetch('/api/playlists/liked', { cache: 'no-store' });
      if (res.ok) {
        const p = await res.json();
        const items: string[] = Array.isArray(p?.itemIds) ? p.itemIds : [];
        setIds(new Set(items));
      } else {
        await ensureLikedPlaylist();
        const r2 = await fetch('/api/playlists/liked', { cache: 'no-store' });
        const p2 = r2.ok ? await r2.json() : null;
        const items: string[] = Array.isArray(p2?.itemIds) ? p2.itemIds : [];
        setIds(new Set(items));
      }
    } finally {
      setReady(true);
      loading.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'likes:version') load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [load]);

  const isLiked = useCallback((id?: string) => !!id && ids.has(id), [ids]);

  const like = useCallback(async (id: string) => {
    if (!id) return;
    setIds((prev) => new Set(prev).add(id)); // optimistic
    try {
      await ensureLikedPlaylist();
      const r = await fetch('/api/playlists/liked/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: id }),
      });
      if (!r.ok) throw new Error('like failed');
      localStorage.setItem('likes:version', String(Date.now()));
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const unlike = useCallback(async (id: string) => {
    if (!id) return;
    setIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const r = await fetch(`/api/playlists/liked/tracks?publicId=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('unlike failed');
      localStorage.setItem('likes:version', String(Date.now()));
    } catch {
      setIds((prev) => new Set(prev).add(id));
    }
  }, []);

  const toggle = useCallback(async (id: string) => (ids.has(id) ? unlike(id) : like(id)), [ids, like, unlike]);

  const reload = load;

  const value = useMemo<LikesCtx>(() => ({ ready, ids, isLiked, like, unlike, toggle, reload }), [ready, ids, isLiked, like, unlike, toggle, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLikes() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLikes must be used within LikesProvider');
  return v;
}
'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { parseBlob } from 'music-metadata-browser';
import { FileUpload } from '@/components/ui/file-upload';
import UploadDetailsModal from '@/components/UploadDetailsModal';

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  url?: string;
  publicId?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
};

const AUDIO_ACCEPT = /\.(mp3|wav|flac|aac|m4a|ogg)$/i;

// Embedded cover → base64 data URL (robust)
async function extractEmbeddedCoverDataUrl(file: File): Promise<{ dataUrl: string; mime: string } | null> {
  try {
    const meta = await parseBlob(file);
    const pic = meta.common.picture?.[0];
    if (!pic?.data) return null;
    const mime = pic.format || 'image/jpeg';

    let u8: Uint8Array | null = null;
    if (pic.data instanceof Uint8Array) u8 = pic.data;
    else if (Array.isArray(pic.data)) u8 = new Uint8Array(pic.data);
    else if ((pic.data as any)?.data && Array.isArray((pic.data as any).data)) u8 = new Uint8Array((pic.data as any).data);
    else if ((pic.data as any)?.buffer instanceof ArrayBuffer) u8 = new Uint8Array((pic.data as any).buffer);
    if (!u8) return null;

    let binary = '';
    for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
    const base64 = btoa(binary);
    return { dataUrl: `data:${mime};base64,${base64}`, mime };
  } catch {
    return null;
  }
}

export function FileUploadDemo({ onComplete }: { onComplete?: (count: number) => void }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [queue, setQueue] = useState<File[]>([]);
  const [idx, setIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialDetails, setInitialDetails] = useState<{ title: string; artist?: string; album?: string }>({ title: '' });

  async function startQueue(files: File[]) {
    const audioFiles = files.filter((f) => f.type.startsWith('audio/') || AUDIO_ACCEPT.test(f.name));
    if (!audioFiles.length) return;
    setQueue(audioFiles);
    setIdx(0);
    const f = audioFiles[0];
    const def = await getDefaults(f);
    setInitialDetails(def);
    setModalOpen(true);
  }

  async function getDefaults(file: File) {
    let title = file.name.replace(/\.[^.]+$/, '');
    let artist: string | undefined;
    let album: string | undefined;
    try {
      const meta = await parseBlob(file);
      title = meta.common.title || title;
      artist = meta.common.artist || undefined;
      album = meta.common.album || undefined;
    } catch {}
    return { title, artist, album };
  }

  async function uploadOne(file: File, details: { title: string; artist?: string; album?: string; coverFile?: File | null }) {
    const id = crypto.randomUUID();
    setUploads((u) => [{ id, file, progress: 0, status: 'uploading' }, ...u]);

    // 1) Sign + upload AUDIO (video endpoint)
    const contextStr = [
      details.title ? `title=${details.title}` : '',
      details.artist ? `artist=${details.artist}` : '',
      details.album ? `album=${details.album}` : '',
    ].filter(Boolean).join('|');

    const signAudio = await fetch('/api/cloudinary/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: contextStr, tags: 'anonbeats' }),
    }).then((r) => r.json());

    const audioForm = new FormData();
    audioForm.append('file', file);
    audioForm.append('api_key', signAudio.apiKey);
    audioForm.append('timestamp', String(signAudio.timestamp));
    audioForm.append('signature', signAudio.signature);
    audioForm.append('folder', signAudio.folder);
    if (signAudio.tags) audioForm.append('tags', signAudio.tags);
    if (signAudio.context) audioForm.append('context', signAudio.context);

    const audioEndpoint = `https://api.cloudinary.com/v1_1/${signAudio.cloudName}/video/upload`;
    const audioRes = await axios.post(audioEndpoint, audioForm, {
      onUploadProgress: (e) => {
        const pct = Math.round((e.loaded * 100) / (e.total || file.size));
        setUploads((u) => u.map((it) => (it.id === id ? { ...it, progress: pct } : it)));
      },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const up = audioRes.data as { secure_url: string; public_id: string; duration?: number };

    // 2) COVER (embedded > user-chosen)
    let coverUrl: string | undefined;
    const embedded = await extractEmbeddedCoverDataUrl(file);
    if (embedded || details.coverFile) {
      const signCover = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'anonbeats/covers',
          tags: 'anonbeats,cover',
          context: `for=${up.public_id}`,
        }),
      }).then((r) => r.json());

      const coverForm = new FormData();
      coverForm.append('api_key', signCover.apiKey);
      coverForm.append('timestamp', String(signCover.timestamp));
      coverForm.append('signature', signCover.signature);
      coverForm.append('folder', signCover.folder);
      if (signCover.tags) coverForm.append('tags', signCover.tags);
      if (signCover.context) coverForm.append('context', signCover.context);

      if (embedded) {
        coverForm.append('file', embedded.dataUrl);
      } else if (details.coverFile) {
        coverForm.append('file', details.coverFile);
      }

      const coverEndpoint = `https://api.cloudinary.com/v1_1/${signCover.cloudName}/image/upload`;
      const coverRes = await axios.post(coverEndpoint, coverForm, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      coverUrl = coverRes.data.secure_url;
    }
    else {
    coverUrl = '/logo.jpeg';
}

    // 3) PATCH audio context to ensure final metadata is persisted
    await fetch(`/api/tracks/${encodeURIComponent(up.public_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: details.title, artist: details.artist, album: details.album, coverUrl }),
    });

    // Update UI
    setUploads((u) =>
      u.map((it) =>
        it.id === id
          ? {
              ...it,
              status: 'done',
              progress: 100,
              url: up.secure_url,
              publicId: up.public_id,
              duration: up.duration,
              title: details.title,
              artist: details.artist,
              album: details.album,
              coverUrl,
            }
          : it
      )
    );
  }

  async function onSubmitDetails(d: { title: string; artist?: string; album?: string; coverFile?: File | null }) {
    const file = queue[idx];
    setModalOpen(false);
    await uploadOne(file, d);
    const next = idx + 1;
    if (next < queue.length) {
      setIdx(next);
      const def = await getDefaults(queue[next]);
      setInitialDetails(def);
      setModalOpen(true);
    } else {
      onComplete?.(queue.length);
      setQueue([]);
      setIdx(0);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FileUpload onChange={startQueue} />

      <UploadDetailsModal
        open={modalOpen}
        fileName={queue[idx]?.name || ''}
        initial={initialDetails}
        onCancel={() => {
          setModalOpen(false);
          setQueue([]);
          setIdx(0);
        }}
        onSubmit={onSubmitDetails}
      />

      <ul className="mt-4 space-y-3">
        {uploads.map((u) => (
          <li key={u.id} className="rounded-md border border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">{u.title || u.file.name}</div>
                <div className="text-xs text-white/60 truncate">
                  {u.artist ? `${u.artist} — ` : ''}{u.album || ''}
                </div>
              </div>
              <div className="text-sm text-white/70">
                {u.status === 'uploading' ? `${u.progress}%` : u.status === 'done' ? 'Done' : 'Error'}
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
              <div
                className={`h-full transition-all ${u.status === 'error' ? 'bg-red-500' : 'bg-pink-500'}`}
                style={{ width: `${u.status === 'done' ? 100 : u.progress}%` }}
              />
            </div>
            {u.status === 'done' && (
              <div className="mt-2 text-xs text-white/70 flex items-center gap-3">
                {u.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-white/10" />
                )}
                <a href={u.url} target="_blank" rel="noreferrer" className="underline break-all">Open file</a>
                {u.duration ? ` • ${Math.round(u.duration)}s` : ''}
              </div>
            )}
            {u.status === 'error' && <div className="mt-2 text-xs text-red-400">{u.error}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
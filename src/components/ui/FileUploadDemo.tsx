'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { parseBlob } from 'music-metadata-browser';
import { FileUpload } from '@/components/ui/file-upload';

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
};

const ACCEPT = /\.(mp3|wav|flac|aac|m4a|ogg)$/i;

export function FileUploadDemo({ onComplete }: { onComplete?: (count: number) => void }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const handleFileUpload = async (files: File[]) => {
    const audioFiles = files.filter((f) => f.type.startsWith('audio/') || ACCEPT.test(f.name));
    if (!audioFiles.length) return;

    let successCount = 0;

    for (const file of audioFiles) {
      const id = crypto.randomUUID();
      setUploads((u) => [{ id, file, progress: 0, status: 'uploading' }, ...u]);

      // Default metadata from tags/filename
      // Build defaults from tags/filename
let title = file.name.replace(/\.[^.]+$/, '');
let artist: string | undefined;
let album: string | undefined;
try {
  const meta = await parseBlob(file);
  title = meta.common.title || title;
  artist = meta.common.artist || undefined;
  album = meta.common.album || undefined;
} catch {}

// Prompt for a custom title
if (typeof window !== 'undefined') {
  const input = window.prompt('Name for this song?', title);
  if (input && input.trim()) title = input.trim();
}

// Build context string (no URL encoding)
const parts: string[] = [];
if (title) parts.push(`title=${title}`);
if (artist) parts.push(`artist=${artist}`);
if (album) parts.push(`album=${album}`);
const context = parts.join('|');
const tags = 'anonbeats';

// 1) sign EXACTLY these params
const signRes = await fetch('/api/cloudinary/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context, tags }),
});
const sign = await signRes.json();
try{
// 2) upload using the signed values
const form = new FormData();
form.append('file', file);
form.append('api_key', sign.apiKey);
form.append('timestamp', String(sign.timestamp));
form.append('signature', sign.signature);
form.append('folder', sign.folder);
if (sign.tags) form.append('tags', sign.tags);
if (sign.context) form.append('context', sign.context);

const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`;
const res = await axios.post(endpoint, form, {
  onUploadProgress: (e) => {
    const pct = Math.round((e.loaded * 100) / (e.total || file.size));
    setUploads((u) => u.map((it) => (it.id === id ? { ...it, progress: pct } : it)));
  },
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

        const up = res.data; // secure_url, public_id, duration, bytes, format
        await fetch(`/api/tracks/${encodeURIComponent(up.public_id)}/context`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, artist, album }),
        });
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
                  title,
                  artist,
                  album,
                }
              : it
          )
        );

        successCount++;
      } catch (err: any) {
        setUploads((u) =>
          u.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: 'error',
                  error: err?.response?.data?.error?.message || err?.message || 'Upload failed',
                }
              : it
          )
        );
      }
    }

    onComplete?.(successCount);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FileUpload onChange={handleFileUpload} />
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
            {u.status === 'done' && u.url && (
              <div className="mt-2 text-xs text-white/70 break-all">
                <a href={u.url} target="_blank" rel="noreferrer" className="underline">Open file</a>
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
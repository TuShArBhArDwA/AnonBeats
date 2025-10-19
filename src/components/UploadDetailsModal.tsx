'use client';
import { useEffect, useRef, useState } from 'react';

type Details = {
  title: string;
  artist?: string;
  album?: string;
  coverFile?: File | null;
};

export default function UploadDetailsModal({
  open,
  fileName,
  initial,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  fileName: string;
  initial: { title: string; artist?: string; album?: string };
  onCancel: () => void;
  onSubmit: (d: Details) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [artist, setArtist] = useState(initial.artist || '');
  const [album, setAlbum] = useState(initial.album || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial.title);
      setArtist(initial.artist || '');
      setAlbum(initial.album || '');
      setCoverFile(null);
      setPreview('');
    }
  }, [open, initial]);

  // Create/revoke preview URL for selected cover
  useEffect(() => {
    if (!coverFile) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="w-[min(95vw,900px)] max-h-[85vh] overflow-auto rounded-2xl border border-white/10 bg-[#0b0b12] p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Song details</h3>
          <p className="text-sm text-white/60 mt-1">File: {fileName}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-white/70">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title"
                className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </label>

            <label className="block text-sm">
              <span className="text-white/70">Artist (optional)</span>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist"
                className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </label>

            <label className="block text-sm">
              <span className="text-white/70">Album (optional)</span>
              <input
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album"
                className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-white/70">Cover image (optional)</span>

              {/* Hidden native input */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="sr-only"
              />

              {/* Visible trigger + filename */}
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white hover:bg-white/10"
                >
                  Choose cover
                </button>
                <span className="text-xs text-white/60 truncate max-w-[240px]">
                  {coverFile ? coverFile.name : 'No file chosen'}
                </span>
              </div>
            </label>

            {/* Preview (clickable to open picker) */}
            <div
              onClick={() => inputRef.current?.click()}
              className="mt-2 h-40 w-full overflow-hidden rounded-lg border border-white/10 bg-white/5 grid place-items-center cursor-pointer hover:bg-white/10"
              title="Click to choose cover"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-white/50">Click to choose a cover</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSubmit({
                title: title.trim(),
                artist: artist.trim() || undefined,
                album: album.trim() || undefined,
                coverFile,
              })
            }
            disabled={!title.trim()}
            className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Start upload
          </button>
        </div>
      </div>
    </div>
  );
}
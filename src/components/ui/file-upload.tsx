'use client';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function FileUpload({
  onChange,
  accept = { 'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg'] },
  multiple = true,
  className,
}: {
  onChange: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const open = () => inputRef.current?.click();
  const handleFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    onChange(Array.from(list));
  }, [onChange]);

  return (
    <div
      onClick={open}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        'cursor-pointer rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center hover:border-white/20 transition',
        isOver && 'border-white/30 bg-white/[0.04]',
        className
      )}
    >
      <div className="text-white/80">Drag & drop your songs here</div>
      <div className="mt-2 text-xs text-white/50">or click to browse (MP3, WAV, FLAC, AAC, M4A, OGG)</div>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={Object.entries(accept).map(([k, v]) => [k, ...v].join(',')).join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShinyButton } from '@/components/ui/shiny-button';

const FileUploadDemo = dynamic(
  () => import('@/components/ui/FileUploadDemo').then((m) => m.FileUploadDemo),
  { ssr: false }
);

export default function UploadModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ShinyButton type="button" onClick={() => { console.log('open modal'); setOpen(true); }}>
        Upload Songs
      </ShinyButton>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="w-[min(95vw,900px)] max-h-[85vh] overflow-auto rounded-2xl border border-white/10 bg-[#0b0b12] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload your songs</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
              >
                Close
              </button>
            </div>
            <FileUploadDemo onComplete={(count) => { setOpen(false); if (count > 0) location.href = '/library'; }} />
          </div>
        </div>
      )}
    </>
  );
}
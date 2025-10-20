'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useState } from 'react';

export default function LockButton({ compact = false }: { compact?: boolean }) {
  // Always call hooks first
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isWelcome = pathname?.startsWith('/welcome');
  if (isWelcome) return null; // Safe to early-return after hooks

  async function onLock() {
    try {
      setLoading(true);
      // Stop audio immediately (no context needed)
      const audio = document.querySelector('audio') as HTMLAudioElement | null;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      // Clear cookie and go to welcome
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/welcome');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onLock}
      disabled={loading}
      title="Lock (logout)"
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-white/10 ${
        compact ? 'h-9 w-9 px-0' : 'px-3 py-1.5'
      } text-sm hover:bg-white/5 disabled:opacity-50`}
      aria-label="Lock"
    >
      <Lock size={16} />
      {!compact && <span className="hidden sm:inline">Lock</span>}
    </button>
  );
}
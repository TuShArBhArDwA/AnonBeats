'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import LockButton from '@/components/LockButton';

const links = [
  { href: '/library', label: 'Library' },
  { href: '/playlists', label: 'Playlists' },
  { href: '/upload', label: 'Upload' },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/lines.png"
            alt="AnonBeats logo"
            width={24}
            height={24}
            className="h-6 w-6 rounded-md object-contain ring-1 ring-white/10 shadow-sm"
            priority
          />
          <span className="inline-block bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            AnonBeats
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 hover:text-white transition">
              {l.label}
            </Link>
          ))}
          <span className="h-6 w-px bg-white/10" />
          <LockButton />
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <LockButton compact />
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-white/10 p-2 text-white/80 hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden">
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <div className="rounded-lg border border-white/10 bg-[#0b0b12]/95 p-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
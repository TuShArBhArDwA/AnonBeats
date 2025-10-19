import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PlayerProvider } from '@/lib/player-context';
import PlayerBar from '@/components/ui/PlayerBar'; 
import SocialsBar from '@/components/SocialsBar';
export const metadata: Metadata = {
  title: 'AnonBEATS',
  description: 'Your personal, ad-free music player',
  icons: {
icon: [{ url: '/logo.jpeg', type: 'image/jpeg' }],
shortcut: ['/logo.jpeg'],
apple: [{ url: '/logo.jpeg' }], 
},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#0b0b12] text-slate-100 antialiased flex flex-col">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
              <Image src="/lines.png" alt="AnonBeats logo" width={24} height={24} className="h-6 w-6 object-contain rounded-md ring-1 ring-white/10 shadow-sm" priority />
              <span className="inline-block bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent">AnonBeats</span>
            </Link>
            <nav className="hidden sm:flex gap-6 text-sm">
              <Link href="/library" className="hover:text-white/90">Library</Link>
              <Link href="/playlists" className="hover:text-white/90">Playlists</Link>
              <Link href="/upload" className="hover:text-white/90">Upload</Link>
            </nav>
          </div>
        </header>

        <PlayerProvider>
          <main className="mx-auto max-w-6xl px-4 py-6 flex-1 pb-24">{children}</main>
          <SocialsBar /> 
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
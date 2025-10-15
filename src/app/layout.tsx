import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'AnonBEATS',
  description: 'Your personal, ad-free music player',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#0b0b12] text-slate-100 antialiased flex flex-col">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight"> <Image src="/lines.png" alt="AnonBeats logo" width={24} height={24} className="h-6 w-6 object-contain rounded-md ring-1 ring-white/10 shadow-sm" priority /> <span className="inline-block bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]"> AnonBeats </span> </Link>
            <nav className="hidden sm:flex gap-6 text-sm">
              <Link href="/library" className="hover:text-white/90">Library</Link>
              <Link href="/playlists" className="hover:text-white/90">Playlists</Link>
              <Link href="/upload" className="hover:text-white/90">Upload</Link>
            </nav>
          </div>
        </header>

         <main className="mx-auto max-w-6xl px-4 py-6 flex-1">{children}</main>

        <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <p className="text-center text-sm text-white/70">
              Made with <span aria-hidden="true">❤️</span> by{' '}
              <a
                href="https://tushar-bhardwaj.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white hover:text-pink-400 hover:underline underline-offset-4"
              >
                Tushar Bhardwaj
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
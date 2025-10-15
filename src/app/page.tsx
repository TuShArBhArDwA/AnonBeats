import Link from 'next/link';
import { Spotlight } from '@/components/ui/spotlight';
import { ShinyButton } from '@/components/ui/shiny-button';

export default function Home() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-10 max-w-5xl mx-auto">
      <Spotlight className="absolute inset-0" />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
          Your music. Zero ads.
          <br />
          <span className="inline-block bg-gradient-to-r from-pink-300 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
              Beautiful. Personal. Fast.
            </span>
        </h1>
        <p className="mt-4 text-white/70">
          Upload your songs, build playlists, and play exactly what you want—anytime.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/library">
            <ShinyButton>Open Library</ShinyButton>
          </Link>
          <Link
            href="/upload"
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition"
          >
            Upload Songs
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-hero-a" />
      <div className="pointer-events-none absolute inset-0 bg-hero-b" />
    </section>
  );
}
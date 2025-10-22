import Link from 'next/link';
import { Spotlight } from '@/components/ui/spotlight';
import { ShinyButton } from '@/components/ui/shiny-button';

export default function Home() {
  return (
    <section className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 sm:px-10 sm:py-12">
      <Spotlight className="pointer-events-none absolute inset-0" />

      {/* Decorative radial grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_50%_-200px,rgba(236,72,153,0.12),transparent)]" />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Your music. Zero ads.
          <br />
          <span className="inline-block bg-gradient-to-r from-pink-300 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
            Beautiful. Personal. Fast.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Upload your songs, build playlists, and play exactly what you want—anytime.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/library">
            <ShinyButton>Open Library</ShinyButton>
          </Link>

          <Link
            href="/playlists"
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm hover:bg-white/[0.08] transition"
          >
            Open Playlists
          </Link>

          <Link
            href="/upload"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            Upload Songs
          </Link>
        </div>
      </div>

      {/* subtle inner edges */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
    </section>
  );
}
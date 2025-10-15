'use client';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const tracks = [
  { id: '1', title: 'Aurora', artist: 'Cloudscapes', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80&auto=format&fit=crop' },
  { id: '2', title: 'Neon Nights', artist: 'Citywave', cover: 'https://images.unsplash.com/photo-1490122417551-6ee9691429d0?w=800&q=80&auto=format&fit=crop' },
  { id: '3', title: 'Drift', artist: 'Windsong', cover: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=800&q=80&auto=format&fit=crop' },
  { id: '4', title: 'Midnight Drive', artist: 'Airstream', cover: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&q=80&auto=format&fit=crop' },
  { id: '5', title: 'Echoes', artist: 'Seaforth', cover: 'https://images.unsplash.com/photo-1534330207526-8e81f10ec6c8?w=800&q=80&auto=format&fit=crop' },
  { id: '6', title: 'Haze', artist: 'Night Owl', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80&auto=format&fit=crop' },
];

export default function LibraryPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Your Library</h1>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {tracks.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ y: -2, scale: 1.01 }}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left"
          >
            <div className="aspect-square w-full overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt={t.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">{t.title}</div>
                <div className="truncate text-xs text-white/60">{t.artist}</div>
              </div>
              <span className="hidden sm:inline-flex items-center justify-center rounded-full bg-white text-black p-2 opacity-0 group-hover:opacity-100 transition">
                <Play size={16} />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
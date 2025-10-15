import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';

export default function PlaylistsPage() {
  const items = [
    { title: 'Daily Drive', desc: 'Chill electronic for focus', rows: 'row-span-2', cols: 'lg:col-span-2' },
    { title: 'Gym Mode', desc: 'High-energy bangers', rows: '', cols: '' },
    { title: 'Night Vibes', desc: 'Late-night downtempo', rows: '', cols: '' },
    { title: 'Throwbacks', desc: '2000s and classics', rows: '', cols: '' },
  ];

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Playlists</h1>
      <BentoGrid>
        {items.map((it, i) => (
          <BentoCard
            key={i}
            className={`${it.cols} ${it.rows}`}
            title={it.title}
            description={it.desc}
            header={<div className="h-24 rounded-xl bg-gradient-to-br from-brand-500/20 to-pink-500/20" />}
          />
        ))}
      </BentoGrid>
    </section>
  );
}
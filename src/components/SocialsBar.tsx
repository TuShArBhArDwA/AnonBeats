'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Linkedin, Instagram, Globe, Mail, Twitter, Link2 } from 'lucide-react';

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const SOCIALS: Item[] = [
  { href: 'https://github.com/TuShArBhArDwA', label: 'GitHub', Icon: Github },
  { href: 'https://www.linkedin.com/in/bhardwajtushar2004/', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://topmate.io/tusharbhardwaj', label: 'Topmate', Icon: Link2 },
  { href: 'mailto:tusharbhardwaj2617@gmail.com', label: 'Email', Icon: Mail },
  { href: 'https://tushar-bhardwaj.vercel.app/', label: 'Portfolio', Icon: Globe },
];

export default function SocialsBar() {
  return (
    <>
      {/* Desktop: vertical pill, right-center */}
      <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col items-center gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <motion.div
                key={label}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="group grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/80 outline-none
                             ring-0 transition hover:text-white hover:bg-white/15 hover:border-white/20 focus:ring-2 focus:ring-pink-500/60"
                >
                  <Icon size={18} className="transition-transform group-hover:scale-110" />
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md
                                   border border-white/10 bg-black/70 px-2 py-1 text-[10px] text-white/80 opacity-0 shadow
                                   transition group-hover:block group-hover:opacity-100">
                    {label}
                  </span>
                  {/* Brand ring on hover */}
                  <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/0 transition group-hover:ring-pink-400/30" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] tracking-widest text-white/50">SOCIALS</div>
      </aside>

      {/* Mobile: compact row above the player */}
      <aside className="fixed bottom-24 right-3 z-40 md:hidden">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          {SOCIALS.slice(0,4).map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/80
                         hover:text-white hover:bg-white/15 hover:border-white/20"
            >
              <Icon size={16} />
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
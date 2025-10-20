'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Github, Linkedin, Link2, Mail, Globe, Plus, X } from 'lucide-react';

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const LINKS: Item[] = [
  { href: 'https://github.com/TuShArBhArDwA', label: 'GitHub', Icon: Github },
  { href: 'https://www.linkedin.com/in/bhardwajtushar2004/', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://topmate.io/tusharbhardwaj', label: 'Topmate', Icon: Link2 },
  { href: 'mailto:tusharbhardwaj2617@gmail.com', label: 'Email', Icon: Mail },
  { href: 'https://tushar-bhardwaj.vercel.app/', label: 'Portfolio', Icon: Globe },
];

export default function MobileSocialsFab() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | PointerEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Vertical fan settings
  const offset = 56; // px between items

  return (
    <div
      ref={ref}
      className="fixed bottom-24 right-4 z-50 md:hidden select-none"
      aria-live="polite"
    >
      {/* Expanded icons */}
      <AnimatePresence>
        {open && (
          <ul className="relative">
            {LINKS.map(({ href, label, Icon }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 0, scale: 0.9 }}
                animate={{ opacity: 1, y: -(i + 1) * offset, scale: 1 }}
                exit={{ opacity: 0, y: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.03 }}
                className="absolute right-0"
              >
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/40 text-white/85 backdrop-blur
                             shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:bg-white/15 hover:text-white"
                >
                  <Icon size={18} />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <button
        aria-label={open ? 'Close socials' : 'Open socials'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/10 text-white
                   backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-white/15"
      >
        <motion.span
          key={open ? 'x' : 'plus'}
          initial={{ rotate: 0, scale: 0.9, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 0, scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-white"
        >
          {open ? <X size={20} /> : <Plus size={20} />}
        </motion.span>
      </button>
    </div>
  );
}
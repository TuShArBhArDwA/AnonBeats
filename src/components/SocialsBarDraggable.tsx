'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Link2, Mail, Globe, GripVertical } from 'lucide-react';

type SocialItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const LINKS: SocialItem[] = [
  { href: 'https://github.com/TuShArBhArDwA', label: 'GitHub', Icon: Github },
  { href: 'https://www.linkedin.com/in/bhardwajtushar2004/', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://topmate.io/tusharbhardwaj', label: 'Topmate', Icon: Link2 },
  { href: 'mailto:tusharbhardwaj2617@gmail.com', label: 'Email', Icon: Mail },
  { href: 'https://tushar-bhardwaj.vercel.app/', label: 'Portfolio', Icon: Globe },
];

const PADDING = 8;        // screen padding
const SNAP = 24;          // snap to left/right edges if close
const BOTTOM_SAFE = 96;   // keep above player bar

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SocialsBarDraggable() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Default position: right-center on every mount (no persistence)
  useEffect(() => {
    const el = wrapRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = (el?.offsetWidth ?? 72);
    const h = (el?.offsetHeight ?? 220);
    const x = vw - w - PADDING;                   // right with padding
    const y = clamp(Math.round(vh / 2 - h / 2), PADDING, vh - h - PADDING - BOTTOM_SAFE);
    setPos({ x, y });
  }, []);

  // Keep inside viewport on resize (still not persisted)
  useEffect(() => {
    const onResize = () => {
      const el = wrapRef.current;
      if (!el) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = el.offsetWidth || 72;
      const h = el.offsetHeight || 220;
      setPos((p) => ({
        x: clamp(p.x, PADDING, vw - w - PADDING),
        y: clamp(p.y, PADDING, vh - h - PADDING - BOTTOM_SAFE),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    // Start drag only from the handle
    const handle = (e.target as HTMLElement).closest('[data-drag-handle="1"]');
    if (!handle) return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const el = wrapRef.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth || 72;
    const h = el.offsetHeight || 220;
    const nx = clamp(e.clientX - offsetRef.current.x, PADDING, vw - w - PADDING);
    const ny = clamp(e.clientY - offsetRef.current.y, PADDING, vh - h - PADDING - BOTTOM_SAFE);
    setPos({ x: nx, y: ny });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    const el = wrapRef.current;
    if (!el) return;
    const vw = window.innerWidth;
    const w = el.offsetWidth || 72;

    // Snap to left/right edges if close (still no persistence)
    let nx = pos.x;
    if (nx < PADDING + SNAP) nx = PADDING;
    if (vw - (nx + w) < SNAP) nx = vw - w - PADDING;
    setPos({ x: nx, y: pos.y });
    try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
  };

  return (
    <>
      {/* Desktop draggable pill */}
      <div
        ref={wrapRef}
        className={`fixed z-50 hidden md:block touch-none select-none ${dragging ? 'cursor-grabbing' : 'cursor-default'}`}
        style={{ left: 0, top: 0, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          {/* Drag handle */}
          <button
            data-drag-handle="1"
            aria-label="Drag socials"
            title="Drag to move"
            className="mb-2 grid h-6 w-full place-items-center rounded-md border border-white/10 bg-black/30 text-white/60 hover:text-white"
          >
            <GripVertical size={14} />
          </button>

          <div className="flex flex-col items-center gap-2">
            {LINKS.map(({ href, label, Icon }) => (
                <motion.div
                key={label}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="group grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/80 transition
                           hover:text-white hover:bg-white/15 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md
                                 border border-white/10 bg-black/70 px-2 py-1 text-[10px] text-white/80 opacity-0 shadow
                                 transition group-hover:block group-hover:opacity-100">
                  {label}
                </span>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-1 text-center text-[10px] tracking-widest text-white/50">SOCIALS</div>
      </div>

      {/* Mobile mini row (kept as you had) */}
      <aside className="fixed bottom-24 right-3 z-50 md:hidden">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-2 py-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          {LINKS.slice(0, 4).map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/80
                         transition hover:text-white hover:bg-white/15 hover:border-white/20"
            >
              <Icon size={16} />
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
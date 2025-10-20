'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function WelcomePage() {
    useEffect(() => {
  const audio = document.querySelector('audio') as HTMLAudioElement | null;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}, []);
  const router = useRouter();
  const sp = useSearchParams();
  const cont = sp.get('continue') || '/';

  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Hide the header while on /welcome (and restore on unmount)
  useEffect(() => {
    const header = document.querySelector('header') as HTMLElement | null;
    const prev = header?.style.display ?? '';
    if (header) header.style.display = 'none';
    return () => {
      if (header) header.style.display = prev;
    };
  }, []);

  // Disable page scroll while on /welcome (no micro-scroll)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflowY;
    const prevBody = document.body.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';
    return () => {
      document.documentElement.style.overflowY = prevHtml;
      document.body.style.overflowY = prevBody;
    };
  }, []);

  // Clear error when typing
  useEffect(() => setErr(null), [pw]);

  // With header hidden, just fill viewport
  const mainStyle = useMemo(() => ({ minHeight: '100dvh' }), []);

  async function submit() {
    if (!pw.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw.trim() }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j?.message || 'Invalid password');
        setLoading(false);
        return;
      }
      // Success animation then redirect
      setOk(true);
      setTimeout(() => {
        router.push(cont);
        router.refresh();
      }, 900);
    } catch {
      setErr('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  // Ref to the card for responsive, contained animation
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    // 2-row grid: centered card (no scroll)
    <main className="grid grid-rows-[1fr_auto] place-items-center px-4 overflow-hidden" style={mainStyle}>
      {/* subtle radial tint */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(700px_300px_at_80%_-10%,rgba(236,72,153,0.12),transparent)]" />

      {/* Center card */}
      <div className="z-10 grid place-items-center w-full">
        <section
          ref={cardRef}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(0,0,0,.35)]"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold">Welcome to AnonBeats</h1>
          <p className="mt-2 text-sm text-white/70">
            Your music. Zero ads. Enter the passcode to continue.
          </p>

          {/* password */}
          <div className="mt-5">
            <label className="block text-sm text-white/80">Passcode</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Enter passcode"
                autoFocus
                className="flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
            {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

            <button
              onClick={submit}
              disabled={!pw.trim() || loading}
              className="mt-4 w-full rounded-md border border-white/10 bg-white text-black py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Unlocking…' : 'Enter'}
            </button>
          </div>

          {/* contained success animation */}
          <AnimatePresence>{ok && <SuccessBurst containerRef={cardRef} />}</AnimatePresence>
        </section>
      </div>

    
    </main>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-white/70 hover:text-white underline underline-offset-4"
      title={label}
      aria-label={label}
    >
      {label}
    </Link>
  );
}

/* Contained success animation: computes circle to fully cover the card */
function SuccessBurst({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [diameter, setDiameter] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Circle big enough to cover the diagonal of the card (with a little margin)
    const d = Math.ceil(Math.hypot(rect.width, rect.height)) * 1.1;
    setDiameter(d);
  }, [containerRef]);

  const particles = useMemo(() => {
    const count = 22;
    const r = Math.max(40, diameter / 5);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist = r + (i % 5) * (r / 6);
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: i * 0.01 };
    });
  }, [diameter]);

  if (!diameter) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
      {/* Expanding circle (contained by overflow-hidden on the section) */}
      <motion.div
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: diameter,
          height: diameter,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute rounded-full bg-pink-500"
      />

      {/* Check icon pop */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
        className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-pink-500 shadow-[0_0_0_8px_rgba(255,255,255,0.15)]"
      >
        <Check size={28} />
      </motion.div>

      {/* Sparks */}
      {particles.map((p, idx) => (
        <motion.span
          key={idx}
          initial={{ x: 0, y: 0, scale: 0.6, opacity: 0.9 }}
          animate={{ x: p.x, y: p.y, scale: 1, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: p.delay }}
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              idx % 3 === 0
                ? '#ec4899'
                : idx % 3 === 1
                ? 'rgba(255,255,255,0.9)'
                : 'rgba(236,72,153,0.6)',
          }}
        />
      ))}
    </motion.div>
  );
}
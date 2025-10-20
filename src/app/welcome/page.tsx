'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Github, Linkedin, Link2, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Optional: force dynamic (no SSG caching for this route)
// export const dynamic = 'force-dynamic';

export default function WelcomePage() {
  // Stop any audio as soon as we arrive
  useEffect(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement | null;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const router = useRouter();

  // Read ?continue=... on the client (avoid useSearchParams SSR warning)
  const [cont, setCont] = useState('/');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      setCont(url.searchParams.get('continue') || '/');
    }
  }, []);

  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Hide the header on welcome (restore on unmount)
  useEffect(() => {
    const header = document.querySelector('header') as HTMLElement | null;
    const prev = header?.style.display ?? '';
    if (header) header.style.display = 'none';
    return () => {
      if (header) header.style.display = prev;
    };
  }, []);

  // Disable page scroll while on welcome
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

  // Full viewport height (header hidden)
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
        setErr(j?.message || 'Invalid passcode');
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

  // Ref for contained animation + cursor spotlight
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const onCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpot({ x, y });
  };

  // “Shake” when error appears
  const shake = err
    ? { x: [0, -10, 10, -7, 7, -4, 4, 0], transition: { duration: 0.45 } }
    : { x: 0 };

  return (
    <main className="relative grid place-items-center px-4 overflow-hidden" style={mainStyle}>
      {/* subtle background tint */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_400px_at_80%_-10%,rgba(236,72,153,0.12),transparent)]" />

      {/* Center card */}
      <section
        ref={cardRef}
        onMouseMove={onCardMouseMove}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(0,0,0,.35)]"
      >
        {/* interactive spotlight (desktop) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 md:opacity-100"
          style={{
            background: `radial-gradient(180px 140px at ${spot.x}% ${spot.y}%, rgba(255,255,255,0.08), transparent 60%)`,
          }}
        />

        {/* Heading */}
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">
            <span className="bg-gradient-to-r from-white to-white/75 bg-clip-text text-transparent">Welcome to</span>
            <br />
            <span className="bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent">AnonBeats</span>
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Your music. Zero ads. Enter the passcode to continue.
          </p>

          {/* Socials row */}
          <div className="mt-4 flex items-center gap-3">
            <Social href="https://github.com/TuShArBhArDwA" label="GitHub" Icon={Github} />
            <Social href="https://www.linkedin.com/in/bhardwajtushar2004/" label="LinkedIn" Icon={Linkedin} />
            <Social href="https://topmate.io/tusharbhardwaj" label="Topmate" Icon={Link2} />
          </div>

          {/* Passcode form */}
          <motion.div className="mt-5" animate={shake}>
            <label className="block text-sm text-white/80">Passcode</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="Enter passcode"
                  autoFocus
                  className={`w-full rounded-md border bg-white/[0.02] px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20 ${
                    err ? 'border-red-400/30' : 'border-white/10'
                  }`}
                />
                {err && (
                  <span className="pointer-events-none absolute -bottom-5 left-0 flex items-center gap-1 text-[11px] text-red-400">
                    <AlertCircle size={12} /> {err}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
                {show ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              onClick={submit}
              disabled={!pw.trim() || loading}
              className="mt-4 w-full rounded-md border border-white/10 bg-white py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Unlocking…
                </span>
              ) : (
                'Enter'
              )}
            </button>
          </motion.div>
        </div>

        {/* Contained success animation */}
        <AnimatePresence>{ok && <SuccessBurst containerRef={cardRef} />}</AnimatePresence>
      </section>
    </main>
  );
}

function Social({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="group grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/80 transition hover:text-white hover:bg-white/15 hover:border-white/20"
    >
      <Icon size={16} className="transition-transform group-hover:scale-110" />
    </Link>
  );
}

/* Contained success animation: responsive circle + check + sparks */
function SuccessBurst({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [diameter, setDiameter] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const d = Math.ceil(Math.hypot(rect.width, rect.height)) * 1.1; // covers diagonal
    setDiameter(d);
  }, [containerRef]);

  const particles = useMemo(() => {
    const count = 22;
    const base = Math.max(40, diameter / 5);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist = base + (i % 5) * (base / 6);
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: i * 0.01 };
    });
  }, [diameter]);

  if (!diameter) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
      {/* Expanding circle */}
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
      {/* Check pop */}
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
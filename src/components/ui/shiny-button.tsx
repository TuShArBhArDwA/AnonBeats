'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

export function ShinyButton({ className, children, type = 'button', ...props }: Props) {
  return (
    <button
      type={type} // important
      className={cn(
        'group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,.25)] transition hover:bg-white/10',
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.5),transparent)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
    </button>
  );
}
'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Spotlight({ className }: { className?: string }) {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  return (
    <div
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      className={cn('pointer-events-none relative', className)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(400px 200px at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.08), transparent 60%)`,
        }}
      />
    </div>
  );
}
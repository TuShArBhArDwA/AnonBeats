import { cn } from '@/lib/utils';

export function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('grid auto-rows-[14rem] gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>{children}</div>;
}

export function BentoCard({
  className, title, description, header, footer,
}: {
  className?: string; title: string; description?: string;
  header?: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className={cn('group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4', className)}>
      {header && <div className="mb-3">{header}</div>}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-white/60">{description}</p>}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/0 via-transparent to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
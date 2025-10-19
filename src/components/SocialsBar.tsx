import Link from 'next/link';
import { Github, Linkedin, Instagram, Globe, Mail, Twitter } from 'lucide-react';

type Item = { href: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> };

const links: Item[] = [
  // TODO: replace with your actual URLs
  { href: 'https://github.com/TuShArBhArDwA', label: 'GitHub', Icon: Github },
  { href: 'https://www.linkedin.com/in/bhardwajtushar2004/', label: 'LinkedIn', Icon: Linkedin },
  { href: 'mailto:tusharbhardwaj2617@gmail.com', label: 'Email', Icon: Mail },
  { href: 'https://tushar-bhardwaj.vercel.app/', label: 'Portfolio', Icon: Globe },
];

export default function SocialsBar() {
  return (
    <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-2 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
        <div className="flex flex-col items-center gap-2">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="group grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/80 transition
                         hover:text-white hover:bg-white/15 hover:border-white/20"
            >
              <Icon size={18} className="transition-transform group-hover:scale-110" />
            </Link>
          ))}
        </div>
      </div>

      {/* tiny vertical label */}
      <div className="mt-2 flex items-center justify-center text-[10px] tracking-wider text-white/50">
      
      </div>
    </aside>
  );
}
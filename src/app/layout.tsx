import './globals.css';
import type { Metadata } from 'next';
import { PlayerProvider } from '@/lib/player-context';
import { NavBar } from '@/components/NavBar';
import AppChrome from '@/components/AppChrome';

export const metadata: Metadata = {
  title: 'AnonBEATS',
  description: 'Your personal, ad-free music player',
  icons: {
    icon: [{ url: '/logo.jpeg', type: 'image/jpeg' }],
    shortcut: ['/logo.jpeg'],
    apple: [{ url: '/logo.jpeg' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#0b0b12] text-slate-100 antialiased flex flex-col">
        {/* Single, responsive header */}
        <NavBar />

        {/* Player context + page content */}
        <PlayerProvider>
          {/* pb-28: keep content above sticky player on mobile */}
          <main className="mx-auto max-w-6xl px-4 py-6 pb-28 flex-1">
            {children}
          </main>

          {/* Your floating chrome (socials, player UI wrapper, etc.) */}
          <AppChrome />
        </PlayerProvider>
      </body>
    </html>
  );
}
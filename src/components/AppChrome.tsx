'use client';
import { usePathname } from 'next/navigation';
import PlayerBar from '@/components/ui/PlayerBar';
import SocialsBarDraggable from '@/components/SocialsBarDraggable';
import MobileSocialsFab from './MobileSocialsFab';

export default function AppChrome() {
  const pathname = usePathname();
  const isWelcome = pathname?.startsWith('/welcome');

  return (
    <>
      <SocialsBarDraggable />
      <MobileSocialsFab />
      {!isWelcome && <PlayerBar />}
    </>
  );
}
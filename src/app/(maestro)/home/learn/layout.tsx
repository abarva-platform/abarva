'use client';
// Learn sub-shell — AppTopBarBlack + LearnSideNav for all /home/learn/*
// routes. Aligned with the canonical /home top bar (black / 22px wordmark
// / "AI Success Platform" tagline) so chrome stays consistent across
// every /home surface.

import { AppTopBarBlack } from '@/components/shell/AppTopBarBlack';
import { LearnSideNav } from '@/components/home/learn/LearnSideNav';

export default function HomeLearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <AppTopBarBlack />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LearnSideNav />

        <main
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

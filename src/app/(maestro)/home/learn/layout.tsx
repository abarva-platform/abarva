'use client';
// Learn sub-shell — AppTopBar + LearnSideNav for all /home/learn/* routes.
// The root /home uses its own AppShell (HomeIndexPage); this layout is
// scoped to the learn guide only so the two shells never conflict.

import { AppTopBar } from '@/components/shell/AppTopBar';
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
      <AppTopBar />

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

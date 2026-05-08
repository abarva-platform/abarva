'use client';
// Home-area shell — AppTopBar + LearnSideNav persist across /home and all
// /home/learn/* routes. Individual page components render content only,
// no AppShell wrapper needed.

import { AppTopBar } from '@/components/shell/AppTopBar';
import { LearnSideNav } from '@/components/home/learn/LearnSideNav';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
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

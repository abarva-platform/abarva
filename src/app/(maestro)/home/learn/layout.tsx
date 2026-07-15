'use client';
// /home/learn shell — LearnSideNav + content for all /home/learn/* routes.
// MaestroChrome owns the single persisted NexusTopNav for shell-native routes.

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
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LearnSideNav />

        <main
          aria-label="Learn content"
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

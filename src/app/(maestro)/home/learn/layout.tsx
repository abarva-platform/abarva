'use client';
// /home/learn shell — NexusTopNav + LearnSideNav for all /home/learn/* routes.
// /home/layout.tsx is a passthrough so this is the only chrome rendered here.

import { NexusTopNav } from '@/components/navigation/NexusTopNav';
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
      <NexusTopNav />

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

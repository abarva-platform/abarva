'use client';
// Source Learn primer · sub-shell — AppTopBar + SourceLearnSideNav for
// all /source/learn/* routes. Mirrors src/app/(maestro)/home/learn/
// layout.tsx with a Source-specific side nav.

import { AppTopBar } from '@/components/shell/AppTopBar';
import { SourceLearnSideNav } from '@/components/source/learn/SourceLearnSideNav';

export default function SourceLearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <SourceLearnSideNav />

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

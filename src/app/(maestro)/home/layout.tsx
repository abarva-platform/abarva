'use client';
// Home-area layout — persistent left sidebar visible on /home and all
// /home/learn/* routes. The sidebar renders Learn navigation; when on
// the main dashboard the sidebar is still shown so "Learn" is always
// one click away.

import { LearnSideNav } from '@/components/home/learn/LearnSideNav';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      {/* Persistent left sidebar */}
      <div
        style={{
          flexShrink: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <LearnSideNav />
      </div>

      {/* Main content — fills remaining width, independently scrollable */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

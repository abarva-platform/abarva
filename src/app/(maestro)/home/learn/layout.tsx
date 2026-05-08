'use client';
// /home/learn layout — persistent left sidebar + scrollable content area.
// The sidebar always shows; content fills the remaining width.
// Both the sidebar and content are independently scrollable.

import { LearnSideNav } from '@/components/home/learn/LearnSideNav';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      {/* Left sidebar — fixed height, independent scroll */}
      <div
        style={{
          height: '100vh',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <LearnSideNav />
      </div>

      {/* Content area — fills remaining width, independently scrollable */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          background: '#ffffff',
        }}
      >
        {children}
      </main>
    </div>
  );
}

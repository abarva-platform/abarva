'use client';

import { usePathname } from 'next/navigation';
import AbarvaNav from '@/components/AbarvaNav';

const BG = '#0A0A0A';

export function MaestroChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const activePage = pathname.startsWith('/admin') || pathname.startsWith('/platform/admin') ? 'admin' : 'dashboard';

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F5F5F0' }}>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <nav aria-label="Primary"><AbarvaNav activePage={activePage} /></nav>
      <main id="main-content">{children}</main>
    </div>
  );
}

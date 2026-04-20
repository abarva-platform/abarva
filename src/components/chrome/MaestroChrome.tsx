'use client';

import { usePathname } from 'next/navigation';
import AbarvaNav from '@/components/AbarvaNav';
import { PrimaryNav } from './PrimaryNav';

const BG = '#0A0A0A';

export function MaestroChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const activePage = pathname.startsWith('/admin') || pathname.startsWith('/platform/admin') ? 'admin' : 'dashboard';

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F5F5F0' }}>
      <AbarvaNav activePage={activePage} compact />
      <PrimaryNav />
      <div>{children}</div>
    </div>
  );
}

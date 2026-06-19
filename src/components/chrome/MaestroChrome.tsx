'use client';

import { usePathname } from 'next/navigation';
import AbarvaNav from '@/components/AbarvaNav';

// Shell-native surfaces render AppShell themselves — these routes bypass
// MaestroChrome so AbarvaNav doesn't double-render with the AppRail.
// Entries are startsWith-matched so /admin/connectors also passes through.
const SHELL_SURFACE_PREFIXES = [
  '/admin',
  '/home',
  '/tower',
  '/source',
  '/intelligence',
  '/learn',
  '/product',
  '/strategic-moves',
] as const;

export function MaestroChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  // Pass-through for shell-native surfaces (they render AppShell themselves)
  if (SHELL_SURFACE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  const activePage =
    pathname.startsWith('/admin') || pathname.startsWith('/platform/admin')
      ? 'admin'
      : 'dashboard';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F2EA', color: '#171412' }}>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <nav aria-label="Primary"><AbarvaNav activePage={activePage} /></nav>
      <main id="main-content">{children}</main>
    </div>
  );
}

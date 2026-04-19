'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = '#8B8680';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';

const ITEMS: Array<{ label: string; href: string; match: (p: string) => boolean }> = [
  { label: 'Dashboard', href: '/dashboard', match: (p) => p === '/dashboard' || p.startsWith('/dashboard/') },
  { label: 'Engagements', href: '/engagements', match: (p) => p === '/engagements' || p.startsWith('/engagements/') || p.startsWith('/engage/') },
  { label: 'Data setup', href: '/data', match: (p) => p === '/data' || p.startsWith('/data/') },
  { label: 'User setup', href: '/users/new', match: (p) => p === '/users/new' || p.startsWith('/users/') },
  { label: 'Intelligence', href: '/intelligence', match: (p) => p === '/intelligence' || p.startsWith('/intelligence/') },
  { label: 'Control Tower', href: '/tower', match: (p) => p === '/tower' || p.startsWith('/tower/') },
  { label: 'Admin', href: '/admin', match: (p) => p === '/admin' || p.startsWith('/admin/') },
];

export function PrimaryNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      style={{
        height: 44,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 16px',
        gap: 4,
        fontFamily: FONT_BODY,
      }}
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              fontSize: 13,
              color: active ? INK : MUTE,
              textDecoration: 'none',
              borderBottom: `2px solid ${active ? TEAL : 'transparent'}`,
              transition: 'color 120ms ease, border-color 120ms ease',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = INK;
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = MUTE;
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

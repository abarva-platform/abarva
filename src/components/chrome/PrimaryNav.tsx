'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';

// Pack F Part 1: 6 peer items. User setup folded into Admin.
// Design-fix override: all items render at equal primary weight — no opacity.
const ITEMS: Array<{ label: string; href: string; match: (p: string) => boolean }> = [
  { label: 'Home', href: '/dashboard', match: (p) => p === '/dashboard' || p === '/' || p.startsWith('/dashboard/') },
  { label: 'Engagements', href: '/engagements', match: (p) => p === '/engagements' || p.startsWith('/engagements/') || p.startsWith('/engage/') },
  { label: 'Data', href: '/data', match: (p) => p === '/data' || p.startsWith('/data/') },
  { label: 'Intelligence', href: '/intelligence', match: (p) => p === '/intelligence' || p.startsWith('/intelligence/') },
  { label: 'Control Tower', href: '/tower', match: (p) => p === '/tower' || p.startsWith('/tower/') },
  { label: 'Admin', href: '/admin', match: (p) => p === '/admin' || p.startsWith('/admin/') || p.startsWith('/users/') },
];

export function PrimaryNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      style={{
        height: 52,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 40px',
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
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              fontSize: 15,
              fontWeight: active ? 700 : 600,
              letterSpacing: '-0.01em',
              color: active ? TEAL : INK,
              textDecoration: 'none',
              transition: 'color 120ms ease, font-weight 120ms ease',
            }}
            onMouseEnter={(e) => {
              if (active) return;
              e.currentTarget.style.color = TEAL;
              e.currentTarget.style.fontWeight = '700';
              const bar = e.currentTarget.querySelector('.nav-underline') as HTMLSpanElement | null;
              if (bar) bar.style.background = TEAL;
            }}
            onMouseLeave={(e) => {
              if (active) return;
              e.currentTarget.style.color = INK;
              e.currentTarget.style.fontWeight = '600';
              const bar = e.currentTarget.querySelector('.nav-underline') as HTMLSpanElement | null;
              if (bar) bar.style.background = 'transparent';
            }}
          >
            {item.label}
            <span
              className="nav-underline"
              style={{
                position: 'absolute',
                bottom: 10,
                left: 20,
                right: 20,
                height: 1,
                background: active ? TEAL : 'transparent',
                transition: 'background 120ms ease',
              }}
            />
          </Link>
        );
      })}
    </nav>
  );
}

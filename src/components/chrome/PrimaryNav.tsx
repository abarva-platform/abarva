'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';

// Product-map final: 5 peer items · Home / Engagements / Intelligence /
// Control Tower / Platform. Data + Users + Admin all fold under Platform.
// Design-fix override: all items render at equal primary weight — no opacity.
const ITEMS: Array<{ label: string; href: string; match: (p: string) => boolean }> = [
  { label: 'Home', href: '/home', match: (p) => p === '/home' || p === '/' || p.startsWith('/home/') || p === '/dashboard' || p.startsWith('/dashboard/') },
  { label: 'Programs', href: '/preview/programs', match: (p) => p === '/preview/programs' || p.startsWith('/preview/programs/') || p === '/engagements' || p.startsWith('/engagements/') || p.startsWith('/engage/') || p === '/programs' || p.startsWith('/programs/') },
  { label: 'Intelligence', href: '/preview/intelligence', match: (p) => p === '/preview/intelligence' || p.startsWith('/preview/intelligence/') || p === '/intelligence' || p.startsWith('/intelligence/') },
  { label: 'Control Tower', href: '/preview/tower', match: (p) => p === '/preview/tower' || p.startsWith('/preview/tower/') || p === '/tower' || p.startsWith('/tower/') },
  { label: 'Platform', href: '/platform', match: (p) => p === '/platform' || p.startsWith('/platform/') || p.startsWith('/admin') || p.startsWith('/data') || p.startsWith('/users') },
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
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 4 }}>
        <Link
          href="/home/queue"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '7px 11px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.85)',
            textDecoration: 'none',
          }}
        >
          Queue
        </Link>
        <NotificationBell />
      </div>
    </nav>
  );
}

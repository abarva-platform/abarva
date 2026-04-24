'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const SERIF = 'Georgia, serif';
const BODY = 'DM Sans, -apple-system, sans-serif';
const MONO = 'JetBrains Mono, monospace';

function isTenantProgramsPath(pathname: string): boolean {
  return pathname.startsWith('/tenant/') && pathname.includes('/programs');
}

function isTenantTowerPath(pathname: string): boolean {
  return pathname.startsWith('/tenant/') && pathname.includes('/tower');
}

interface ClientInfo {
  clientId: string;
  name: string;
}

// Product-map role visibility: client_viewer sees only Home / Engagements /
// Control Tower. No Intelligence (cross-client knowledge), no Platform
// (admin surfaces). Observer gets the same, minus Engagements.
const ITEMS_CLIENT_VIEWER: Array<{ label: string; href: string; match: (p: string) => boolean }> = [
  { label: 'Home', href: '/home', match: (p) => p === '/home' || p === '/dashboard' || p === '/' },
  { label: 'Programs', href: '/engagements', match: (p) => p === '/preview/programs' || p.startsWith('/preview/programs/') || p === '/engagements' || p.startsWith('/engagements/') || p.startsWith('/engage/') || p === '/programs' || p.startsWith('/programs/') || isTenantProgramsPath(p) },
  { label: 'Control Tower', href: '/tower', match: (p) => p === '/preview/tower' || p.startsWith('/preview/tower/') || p === '/tower' || p.startsWith('/tower/') || isTenantTowerPath(p) },
];

const ITEMS_OBSERVER: Array<{ label: string; href: string; match: (p: string) => boolean }> = [
  { label: 'Home', href: '/home', match: (p) => p === '/home' || p === '/dashboard' || p === '/' },
  { label: 'Control Tower', href: '/tower', match: (p) => p === '/preview/tower' || p.startsWith('/preview/tower/') || p === '/tower' || p.startsWith('/tower/') || isTenantTowerPath(p) },
];

export function ClientChrome({
  client,
  role,
  children,
}: {
  client: ClientInfo;
  role?: 'client_viewer' | 'observer';
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const ITEMS = role === 'observer' ? ITEMS_OBSERVER : ITEMS_CLIENT_VIEWER;
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'User';
  const firstName = user?.firstName || displayName.split(' ')[0];
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: BODY }}>
      {/* Top bar — client name dominant, AbarVa secondary */}
      <div
        style={{
          height: 60,
          background: '#020408',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 40px',
          gap: 24,
        }}
      >
        <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
            {client.name}
          </span>
        </Link>

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>{firstName}</div>
              <div style={{ fontSize: 9, color: TEAL, fontFamily: MONO, letterSpacing: '0.08em' }}>CLIENT</div>
            </div>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(20,184,166,0.14)',
                border: '0.5px solid rgba(20,184,166,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: TEAL,
                fontFamily: MONO,
              }}
            >
              {initials}
            </div>
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                padding: 6,
                minWidth: 220,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                zIndex: 400,
              }}
            >
              <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid #E5E7EB', marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: '#0C0C0C', fontWeight: 600 }}>{displayName}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{user?.emailAddresses?.[0]?.emailAddress}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut(() => router.push('/'));
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  fontSize: 13,
                  color: '#0C0C0C',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 6,
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Single-tenant nav — no Admin, no client selector */}
      <nav
        style={{
          height: 52,
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'stretch',
          padding: '0 40px',
          gap: 4,
          fontFamily: BODY,
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
            >
              {item.label}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 20,
                    right: 20,
                    height: 1,
                    background: TEAL,
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {children}

      {/* Footer — "Powered by AbarVa" small */}
      <footer
        style={{
          padding: '32px 40px 24px',
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
          marginTop: 64,
        }}
      >
        <span style={{ fontSize: 11, color: 'rgba(245,245,240,0.4)', fontFamily: BODY }}>
          Powered by <span style={{ fontFamily: SERIF, color: 'rgba(245,245,240,0.5)' }}>AbarVa</span>
        </span>
      </footer>
    </div>
  );
}

export const _unused = MUTE;

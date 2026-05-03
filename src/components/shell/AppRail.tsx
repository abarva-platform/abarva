'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { SHELL } from '@/lib/shell/shell-tokens';
import { clearActiveClientContext } from '@/lib/auth/client-context-storage';
import { resolveModuleAccess, type ProductModule } from '@/lib/auth/module-access';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppRailProps {}

const NAV_ITEMS = [
  { key: 'home',         label: 'Home',     glyph: 'Hm', href: '/home' },
  { key: 'setup',        label: 'Setup',    glyph: 'St', href: '/admin' },
  { key: 'programs',     label: 'Moves',    glyph: 'Mv', href: '/strategic-moves' },
  { key: 'source',       label: 'Source',   glyph: 'So', href: '/source' },
  { key: 'intelligence', label: 'Intel',    glyph: 'In', href: '/intelligence' },
  { key: 'tower',        label: 'Tower',    glyph: 'Tw', href: '/tower' },
] as const;

type SurfaceKey = 'home' | 'setup' | 'programs' | 'source' | 'intelligence' | 'tower';

function detectSurface(pathname: string | null): SurfaceKey | null {
  if (!pathname) return null;
  if (pathname === '/home' || pathname.startsWith('/home/') || pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'home';
  if (pathname.startsWith('/strategic-moves') || pathname.startsWith('/programs')) return 'programs';
  if (pathname.startsWith('/intelligence')) return 'intelligence';
  if (pathname.startsWith('/tower')) return 'tower';
  if (pathname.startsWith('/source')) return 'source';
  if (pathname.startsWith('/admin') || pathname.startsWith('/platform')) return 'setup';
  return null;
}

export function AppRail() {
  const pathname = usePathname();
  const router = useRouter();
  const active = detectSurface(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? null;
  const moduleAccess = user
    ? resolveModuleAccess({
        role: user.publicMetadata?.role as string | undefined,
        email,
        publicMetadata: user.publicMetadata as Record<string, unknown> | null | undefined,
      })
    : { modules: [], explicit: false, noWorkspaceAssigned: true };
  const canShow = (module: ProductModule) => moduleAccess.modules.includes(module);
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.key === 'home' || canShow(item.key),
  );

  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        width: 76,
        minHeight: '100vh',
        background: SHELL.PAPER_SOFT,
        borderRight: `1px solid ${SHELL.CARD_LINE}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        flexShrink: 0,
      }}
    >
      {/* Brand mark — AbarVa "A" icon */}
      <Link href="/home" style={{ textDecoration: 'none', flexShrink: 0, marginBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.svg"
          alt="AbarVa"
          style={{ width: 36, height: 33, display: 'block' }}
        />
      </Link>

      {/* Nav items */}
      {visibleNavItems.map((item) => {
        const isActive = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            style={{
              width: 56,
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              borderRadius: 8,
              textDecoration: 'none',
              background: isActive ? SHELL.INK : 'transparent',
              cursor: 'pointer',
              marginBottom: 2,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(12,26,58,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }
            }}
          >
            {/* Icon glyph */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: `1.5px solid ${isActive ? SHELL.PAPER : SHELL.INK_SOFT}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: isActive ? SHELL.PAPER : SHELL.INK_SOFT,
                  lineHeight: 1,
                }}
              >
                {item.glyph}
              </span>
            </div>
            {/* Label */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: isActive ? SHELL.PAPER : SHELL.INK_SOFT,
                fontWeight: isActive ? 600 : 400,
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom avatar + sign-out */}
      <div style={{ position: 'relative', marginBottom: 8, flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          title={`${displayName} — click to sign out`}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: SHELL.PAPER_DEEP,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 600, color: SHELL.INK, lineHeight: 1 }}>
            {initials}
          </span>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 36,
              left: 0,
              background: '#FFFFFF',
              border: '1px solid rgba(12,26,58,0.12)',
              borderRadius: 8,
              padding: '6px 0',
              zIndex: 400,
              minWidth: 140,
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            }}
          >
            <div style={{ padding: '6px 12px 8px', borderBottom: '1px solid rgba(12,26,58,0.08)', marginBottom: 4 }}>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 600, color: SHELL.INK }}>{displayName}</div>
            </div>
            {canShow('setup') && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '7px 12px', textDecoration: 'none', fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK }}
              >
                Setup / Admin
              </Link>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                clearActiveClientContext();
                signOut(() => router.push('/'));
              }}
              style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12, color: SHELL.INK, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: SHELL.SANS }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

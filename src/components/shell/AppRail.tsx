'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppRailProps {}

const NAV_ITEMS = [
  { key: 'setup',        label: 'Setup',    glyph: 'St', href: '/admin' },
  { key: 'programs',     label: 'Programs', glyph: 'Pr', href: '/programs' },
  { key: 'source',       label: 'Source',   glyph: 'So', href: '/source' },
  { key: 'intelligence', label: 'Intel',    glyph: 'In', href: '/intelligence' },
  { key: 'tower',        label: 'Tower',    glyph: 'Tw', href: '/tower' },
] as const;

type SurfaceKey = 'setup' | 'programs' | 'source' | 'intelligence' | 'tower';

function detectSurface(pathname: string): SurfaceKey | null {
  if (pathname.startsWith('/programs')) return 'programs';
  if (pathname.startsWith('/intelligence')) return 'intelligence';
  if (pathname.startsWith('/tower')) return 'tower';
  if (pathname.startsWith('/source')) return 'source';
  if (pathname.startsWith('/admin') || pathname.startsWith('/platform')) return 'setup';
  return null;
}

export function AppRail(_props: AppRailProps) {
  const pathname = usePathname();
  const active = detectSurface(pathname);

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
      {/* Brand mark */}
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, marginBottom: 18 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: SHELL.INK,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              fontWeight: 600,
              fontStyle: 'italic',
              color: SHELL.PAPER,
              lineHeight: 1,
            }}
          >
            A
          </span>
        </div>
      </Link>

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
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

      {/* Bottom avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: SHELL.PAPER_DEEP,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontWeight: 600,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          D
        </span>
      </div>
    </div>
  );
}

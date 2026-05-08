// Intelligence v3 · top navigation strip.
//
// Canonical 5-item nav per Home Refinement Package
// (NAV_REORGANIZATION.md): Home · Intelligence (active) · Moves ·
// Source · Tower. The Q5 "no Tower references until Tower ships"
// rule from the original design intent is superseded by the
// Home Refinement Package — Tower is now a first-class top-nav
// item across the tenant-side surface.

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING } from '@/lib/design/abarva-theme';

interface NavLink {
  label: string;
  href: string;
}

const LINKS: ReadonlyArray<NavLink> = [
  { label: 'Home', href: '/home' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Moves', href: '/strategic-moves' },
  { label: 'Source', href: '/source' },
  { label: 'Tower', href: '/tower' },
];

interface Props {
  tenantName: string;
  /** Two-character monogram shown in the user pill. */
  userMonogram?: string;
}

export function IntelligenceV3TopNav({ tenantName, userMonogram = 'EB' }: Props) {
  return (
    <nav
      aria-label="AbarVa top navigation"
      style={{
        height: 56,
        background: COLORS.surface,
        borderBottom: BORDER.hairline,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${SPACING.xxl}px`,
        gap: SPACING.lg,
        boxSizing: 'border-box',
        boxShadow: '0 6px 18px rgba(27, 43, 92, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}
    >
      <Link
        href="/"
        aria-label="AbarVa home"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 18,
          color: COLORS.ink,
          marginRight: SPACING.md,
          flexShrink: 0,
        }}
      >
        <span style={{ color: COLORS.ink }}>Abar</span>
        <span style={{ color: COLORS.navy }}>Va</span>
      </Link>

      <div style={{ display: 'flex', gap: SPACING.xs, flex: 1, minWidth: 0 }}>
        {LINKS.map((link) => {
          const active = link.label === 'Intelligence';
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: FONT.body,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? COLORS.navy : COLORS.body,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                textDecoration: 'none',
                borderBottom: active
                  ? `2px solid ${COLORS.navy}`
                  : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            color: COLORS.muted,
            fontWeight: 500,
          }}
        >
          {tenantName}
        </span>
        <span
          aria-label="User"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: COLORS.navy,
            color: COLORS.surface,
            fontFamily: FONT.mono,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {userMonogram}
        </span>
      </div>
    </nav>
  );
}

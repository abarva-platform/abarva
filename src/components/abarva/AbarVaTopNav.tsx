// DES2 · AbarVa top nav and wordmark.
//
// Pure presentational components. No state, no navigation hooks, no
// auth — the only runtime dependency is `next/link` for href-driven
// surface entries.
//
// Wordmark rule: "Abar" near-black bold + "Va" navy at 1.05–1.10×
// larger, rendered as plain text inside one inline-flex container —
// no SVG, no gap.

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING } from '@/lib/design/abarva-theme';
import { AbarvaWordmark as AbarVaWordmarkPrimitive } from '@/components/abarva/AbarVaWordmark';

// ---------------------------------------------------------------------
// SURFACE LIST  (canonical order)
// ---------------------------------------------------------------------

export interface AbarvaTopNavSurface {
  key: 'programs' | 'tower' | 'intelligence' | 'source' | 'admin';
  label: string;
  href: string;
}

export const ABARVA_TOP_NAV_SURFACES: ReadonlyArray<AbarvaTopNavSurface> = [
  { key: 'programs', label: 'Programs', href: '/engagements' },
  { key: 'tower', label: 'Control Tower', href: '/tower' },
  { key: 'intelligence', label: 'Intelligence', href: '/intelligence' },
  { key: 'source', label: 'Source', href: '/source' },
  { key: 'admin', label: 'Admin', href: '/platform/admin' },
];

// ---------------------------------------------------------------------
// WORDMARK
// ---------------------------------------------------------------------

interface AbarvaWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  inkColor?: string;
}

export function AbarvaWordmark({ size = 'md', inkColor = COLORS.ink }: AbarvaWordmarkProps) {
  return (
    <AbarVaWordmarkPrimitive
      size={size}
      inkColor={inkColor}
      aria-hidden={false}
    />
  );
}

// ---------------------------------------------------------------------
// TOP NAV
// ---------------------------------------------------------------------

interface AbarvaTopNavProps {
  /**
   * Key of the active surface (highlights its nav link). Optional —
   * if omitted no surface is marked active.
   */
  active?: AbarvaTopNavSurface['key'];
  /**
   * Optional homepage href for the wordmark. Defaults to "/".
   */
  homeHref?: string;
}

export function AbarvaTopNav({ active, homeHref = '/' }: AbarvaTopNavProps) {
  return (
    <nav
      aria-label="AbarVa top navigation"
      style={{
        height: 54,
        background: COLORS.surface,
        borderBottom: BORDER.hairline,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${SPACING.xxl}px`,
        gap: SPACING.lg,
        boxSizing: 'border-box',
        fontFamily: FONT.body,
      }}
    >
      <Link
        href={homeHref}
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          marginRight: SPACING.xl,
        }}
      >
        <AbarvaWordmark size="sm" />
      </Link>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        {ABARVA_TOP_NAV_SURFACES.map((s) => {
          const isActive = active === s.key;
          return (
            <Link
              key={s.key}
              href={s.href}
              data-active={isActive ? 'true' : 'false'}
              style={{
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? COLORS.navy : COLORS.body,
                padding: `${SPACING.xs}px ${SPACING.md}px`,
                borderRadius: 6,
                borderBottom: isActive
                  ? `2px solid ${COLORS.navy}`
                  : '2px solid transparent',
                letterSpacing: '-0.005em',
              }}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

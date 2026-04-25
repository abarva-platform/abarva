// DES2 · AbarVaTopNav + AbarvaWordmark.
//
// Thin top navigation per the canon §G. The wordmark renders as
// "Abar" near-black bold + "Va" navy slightly larger — a single
// inline-flex container with two spans. No SVG, no glyph, no
// animation.
//
// Imports restricted to next/link and the AbarVa theme module.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  type AbarvaAgent,
} from '@/lib/design/abarva-theme';

export type AbarvaTopNavSurface =
  | 'home'
  | 'programs'
  | 'tower'
  | 'intelligence'
  | 'source'
  | 'admin';

export interface AbarvaTopNavProps {
  activeSurface?: AbarvaTopNavSurface;
  operator?: { initials: string; role?: string };
  workspaceLabel?: string;
}

export type AbarvaWordmarkSize = 'sm' | 'md' | 'lg';

export interface AbarvaWordmarkProps {
  size?: AbarvaWordmarkSize;
  /** Override the default `INK` color for "Abar" (e.g. for dark surfaces). */
  inkOverride?: string;
  /** Override the default `NAVY` color for "Va" (e.g. for dark surfaces). */
  navyOverride?: string;
}

const WORDMARK_SIZE: Record<
  AbarvaWordmarkSize,
  { abar: number; va: number }
> = {
  sm: { abar: 16, va: 18 },
  md: { abar: 18, va: 20 },
  lg: { abar: 24, va: 28 },
};

export function AbarvaWordmark({
  size = 'md',
  inkOverride,
  navyOverride,
}: AbarvaWordmarkProps) {
  const sizes = WORDMARK_SIZE[size];
  return (
    <span
      aria-label="AbarVa"
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: FONT.body,
        letterSpacing: '-0.01em',
      }}
    >
      <span
        style={{
          color: inkOverride ?? COLORS.ink,
          fontSize: sizes.abar,
          fontWeight: 800,
        }}
      >
        Abar
      </span>
      <span
        style={{
          color: navyOverride ?? COLORS.navy,
          fontSize: sizes.va,
          fontWeight: 700,
        }}
      >
        Va
      </span>
    </span>
  );
}

const SURFACES: Array<{ key: AbarvaTopNavSurface; label: string; href: string }> = [
  { key: 'programs', label: 'Programs', href: '/programs' },
  { key: 'tower', label: 'Tower', href: '/tower' },
  { key: 'intelligence', label: 'Intelligence', href: '/intelligence' },
  { key: 'source', label: 'Source', href: '/source' },
  { key: 'admin', label: 'Admin', href: '/platform/admin' },
];

export function AbarvaTopNav({
  activeSurface,
  operator,
  workspaceLabel,
}: AbarvaTopNavProps) {
  return (
    <nav
      aria-label="AbarVa top navigation"
      style={{
        height: 56,
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(16px, 3vw, 32px)',
        gap: 24,
        fontFamily: FONT.body,
      }}
    >
      <Link
        href="/home"
        aria-label="AbarVa home"
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'baseline',
        }}
      >
        <AbarvaWordmark size="md" />
      </Link>

      <ul
        style={{
          display: 'flex',
          gap: 18,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          flex: 1,
          justifyContent: 'flex-start',
        }}
      >
        {SURFACES.map((s) => {
          const isActive = activeSurface === s.key;
          return (
            <li key={s.key}>
              <Link
                href={s.href}
                data-abarva-nav-key={s.key}
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? COLORS.ink : COLORS.muted,
                  textDecoration: 'none',
                  paddingBottom: 4,
                  borderBottom: isActive
                    ? `2px solid ${COLORS.navy}`
                    : '2px solid transparent',
                  transition: 'color 120ms ease',
                }}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {workspaceLabel ? (
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          {workspaceLabel}
        </span>
      ) : null}

      {operator ? (
        <span
          aria-label={operator.role ?? 'operator'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: COLORS.body,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 999,
              background: COLORS.surface2,
              color: COLORS.ink,
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.04em',
            }}
          >
            {operator.initials.slice(0, 2).toUpperCase()}
          </span>
          {operator.role ? (
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: COLORS.muted,
              }}
            >
              {operator.role}
            </span>
          ) : null}
        </span>
      ) : null}
    </nav>
  );
}

// Test-only export — pure data for snapshot / structure assertions.
export const ABARVA_TOP_NAV_SURFACES: ReadonlyArray<{
  key: AbarvaTopNavSurface;
  label: string;
  href: string;
}> = SURFACES;

// Re-export for convenience (test compatibility).
export type AbarvaAgentReexport = AbarvaAgent;

// DES2 · EmptyInspector.
//
// Dashed-border placeholder used to mark surfaces that are honestly
// empty until a downstream slice lands. Caption is required and must
// name *why* the inspector is empty. Optional `routeHint` renders a
// NAVY-link pointer to the surface that will fill it.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';

export interface EmptyInspectorProps {
  /** Required honest caption naming WHY the inspector is empty. */
  caption: string;
  /** Optional NAVY link suggesting where to go next. */
  routeHint?: { label: string; href: string };
  /** Optional title shown above the caption. */
  title?: string;
}

export function EmptyInspector({
  caption,
  routeHint,
  title,
}: EmptyInspectorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: COLORS.surface,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        alignItems: 'flex-start',
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      {title ? (
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {title}
        </span>
      ) : null}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.55,
          color: COLORS.body,
        }}
      >
        {caption}
      </p>
      {routeHint ? (
        <Link
          href={routeHint.href}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.navy,
            textDecoration: 'none',
          }}
        >
          {routeHint.label} →
        </Link>
      ) : null}
    </div>
  );
}

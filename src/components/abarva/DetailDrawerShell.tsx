// DES2 · DetailDrawerShell.
//
// Right-side overlay drawer used to reveal hidden detail without
// breaking the surface canvas. The shell is purely structural — it
// renders an eyebrow, title, plain-text "Close ✕" affordance, the
// child body, and an optional source-label footer caption.
//
// Width: 360–480px. The shell is presentational only (no portal, no
// state) — callers control mount and dismissal.

import {
  COLORS,
  FONT,
  BORDER,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';

export interface DetailDrawerShellProps {
  eyebrow: string;
  title: string;
  /** Optional href / link target for the close affordance. */
  closeHref?: string;
  /** Width in px (clamped to 360–480). */
  width?: number;
  /** Optional source caption rendered in the footer. */
  sourceCaption?: string;
  children?: React.ReactNode;
}

const MIN_WIDTH = 360;
const MAX_WIDTH = 480;

function clampWidth(w: number | undefined): number {
  if (w === undefined) return 400;
  if (w < MIN_WIDTH) return MIN_WIDTH;
  if (w > MAX_WIDTH) return MAX_WIDTH;
  return w;
}

export function DetailDrawerShell({
  eyebrow,
  title,
  closeHref,
  width,
  sourceCaption,
  children,
}: DetailDrawerShellProps) {
  const w = clampWidth(width);
  return (
    <aside
      role="complementary"
      aria-label={title}
      style={{
        width: w,
        background: COLORS.card,
        borderLeft: BORDER.hairline,
        boxShadow: '-8px 0 32px rgba(10,12,18,0.06)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT.body,
        color: COLORS.ink,
        height: '100%',
        boxSizing: 'border-box',
        borderTopLeftRadius: RADIUS.lg,
        borderBottomLeftRadius: RADIUS.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.md,
          padding: SPACING.lg,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
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
            {eyebrow}
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.005em',
              color: COLORS.ink,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
        </div>
        <a
          href={closeHref ?? '#'}
          aria-label="Close drawer"
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            fontWeight: 500,
            color: COLORS.muted,
            textDecoration: 'none',
            letterSpacing: '0.04em',
            padding: '4px 6px',
          }}
        >
          Close ✕
        </a>
      </header>
      <div
        style={{
          flex: 1,
          padding: SPACING.lg,
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
      {sourceCaption ? (
        <footer
          style={{
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderTop: BORDER.hairlineSoft,
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          {sourceCaption}
        </footer>
      ) : null}
    </aside>
  );
}

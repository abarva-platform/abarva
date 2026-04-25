// DES2 · PressureCard.
//
// Atlas pressure-card primitive. Severity-tone top border (NAVY for
// low/medium, AMBER for high, RED for critical), compact eyebrow
// "<severity> pressure · <programCode>", title, summary, missing-
// inputs preview (top 3 + overflow), recommended action, and a plain
// "Open program →" link.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  BORDER,
  RADIUS,
  SPACING,
  statusAccent,
  type AbarvaStatus,
} from '@/lib/design/abarva-theme';

export interface PressureCardProps {
  programCode: string;
  severity: Extract<AbarvaStatus, 'low' | 'medium' | 'high' | 'critical'>;
  title: string;
  summary: string;
  missingInputs?: ReadonlyArray<string>;
  recommendedAction?: string;
  programHref: string;
}

const MISSING_PREVIEW = 3;

export function PressureCard({
  programCode,
  severity,
  title,
  summary,
  missingInputs,
  recommendedAction,
  programHref,
}: PressureCardProps) {
  const accent = statusAccent(severity);
  const visibleMissing = (missingInputs ?? []).slice(0, MISSING_PREVIEW);
  const overflow = (missingInputs ?? []).length - visibleMissing.length;

  return (
    <article
      data-severity={severity}
      data-program={programCode}
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderTop: `3px solid ${accent.ring}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        fontFamily: FONT.body,
        color: COLORS.ink,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: accent.fg,
        }}
      >
        {severity} pressure · {programCode}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.005em',
          lineHeight: 1.3,
          color: COLORS.ink,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: COLORS.body,
        }}
      >
        {summary}
      </p>
      {visibleMissing.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: COLORS.surface,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm}px ${SPACING.md}px`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            missing inputs
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 14,
              fontSize: 12,
              color: COLORS.body,
              lineHeight: 1.4,
            }}
          >
            {visibleMissing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          {overflow > 0 ? (
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                color: COLORS.mutedSoft,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              +{overflow} more
            </div>
          ) : null}
        </div>
      ) : null}
      {recommendedAction ? (
        <div
          style={{
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: accent.fg,
              marginRight: 6,
            }}
          >
            next
          </span>
          {recommendedAction}
        </div>
      ) : null}
      <Link
        href={programHref}
        style={{
          marginTop: SPACING.xs,
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.navy,
          textDecoration: 'none',
        }}
      >
        Open program →
      </Link>
    </article>
  );
}

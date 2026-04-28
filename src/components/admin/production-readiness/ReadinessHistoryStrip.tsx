// ADMIN16 — Readiness history strip.
//
// Server component. Renders the deterministic seed list of recent readiness
// state transitions (timestamp · who · from→to · note).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ReadinessHistoryEntry } from '@/lib/admin/production-readiness-page-view';

export interface ReadinessHistoryStripProps {
  history: ReadonlyArray<ReadinessHistoryEntry>;
}

export function ReadinessHistoryStrip({ history }: ReadinessHistoryStripProps) {
  return (
    <section
      data-readiness-history-strip="true"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.lg,
        }}
      >
        Readiness history
      </h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {history.map((entry) => (
          <li
            key={entry.id}
            data-history-id={entry.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 110px 1fr',
              gap: SPACING.md,
              alignItems: 'baseline',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: COLORS.ink,
              borderTop: `1px solid ${COLORS.ink}10`,
              paddingTop: SPACING.sm,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: `${COLORS.ink}99`,
              }}
            >
              {entry.timestamp}
            </span>
            <span style={{ fontWeight: 600 }}>{entry.who}</span>
            <span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: `${COLORS.ink}aa`,
                }}
              >
                {entry.from} → {entry.to}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: SPACING.xs,
                  color: `${COLORS.ink}cc`,
                }}
              >
                {entry.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

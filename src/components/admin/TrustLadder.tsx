import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { TrustLadderRung } from '@/lib/admin/data-trust-page-view';

export interface TrustLadderProps {
  rungs: ReadonlyArray<TrustLadderRung>;
}

export function TrustLadder({ rungs }: TrustLadderProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-trust-ladder="true"
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
        Trust ladder
      </h2>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${rungs.length}, 1fr)`,
          gap: SPACING.md,
        }}
      >
        {rungs.map((rung) => (
          <li
            key={rung.id}
            style={{
              padding: SPACING.md,
              border: `1px solid ${COLORS.ink}10`,
              borderRadius: RADIUS.md,
              fontFamily: TYPOGRAPHY.sans,
              background: COLORS.cream,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
            data-rung-id={rung.id}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}80`,
              }}
            >
              {rung.label}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.ink,
                lineHeight: 1,
              }}
            >
              {rung.count}
            </span>
            <span style={{ fontSize: 12, color: `${COLORS.ink}cc`, lineHeight: 1.4 }}>
              {rung.description}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

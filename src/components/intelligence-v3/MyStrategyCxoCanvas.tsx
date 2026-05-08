// Intelligence v3 · My strategy (CXO mode · PR-K2.4).
//
// Three numbered narrative bullets. Reads as the CIO's strategy
// summary — what they're committing to and the evidence basis.

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import { MERIDIAN_STRATEGY_BULLETS, type StrategyBullet } from './cxo-fixtures';

interface Props {
  bullets?: ReadonlyArray<StrategyBullet>;
}

export function MyStrategyCxoCanvas({ bullets = MERIDIAN_STRATEGY_BULLETS }: Props) {
  return (
    <section data-canvas="my-strategy">
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>My strategy</span>
          </>
        }
        title="What you're committing to · the evidence basis · and what stays unresolved."
        lead="Three numbered moves. Each one names the bet, the why, and the pattern that binds it. Sentinel pushes back on framing in the right rail."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>{bullets.length}</strong> strategic posture statements ·{' '}
            <strong style={{ color: COLORS.ink }}>last reviewed 4d ago</strong>
          </>
        }
      />

      <article
        style={{
          background: COLORS.card,
          border: BORDER.hairline,
          borderRadius: RADIUS.md,
          padding: `${SPACING.lg}px ${SPACING.xxl}px ${SPACING.xl}px`,
        }}
      >
        {bullets.map((b, i) => (
          <div
            key={b.number}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: SPACING.xl,
              padding: `${SPACING.lg}px 0`,
              borderBottom: i === bullets.length - 1 ? 'none' : BORDER.hairlineSoft,
            }}
          >
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 56,
                fontWeight: 200,
                color: COLORS.amber,
                lineHeight: 1,
                letterSpacing: '-0.022em',
              }}
            >
              {b.number}
            </div>
            <div>
              <h3
                style={{
                  fontFamily: FONT.display,
                  fontSize: 22,
                  fontWeight: 400,
                  color: COLORS.ink,
                  letterSpacing: '-0.012em',
                  margin: '0 0 8px',
                  lineHeight: 1.25,
                }}
              >
                {b.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: COLORS.body,
                  margin: '0 0 10px',
                  maxWidth: '68ch',
                }}
              >
                {b.body}
              </p>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10.5,
                  letterSpacing: '0.06em',
                  color: COLORS.muted,
                  paddingTop: SPACING.xs,
                  borderTop: `1px dotted ${COLORS.border}`,
                }}
              >
                evidence · {b.evidence}
              </div>
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}

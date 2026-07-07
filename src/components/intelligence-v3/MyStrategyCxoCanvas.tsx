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

/**
 * Intelligence→Move hand-off (loop wiring · GAP-2). Deep-links the
 * pressure-tested bet brief into the Strategic Moves originate flow,
 * carrying the binding pattern via the `fromIntelligence` query
 * contract that `/strategic-moves/new` already parses. The originated
 * Move then joins back to Intelligence in the cross-module trace
 * viewer at `/strategic-moves/[moveId]/trace`.
 */
function ShapeIntoMoveCta({ betLink }: { betLink: NonNullable<StrategyBullet['betLink']> }) {
  const params = new URLSearchParams({
    fromIntelligence: '1',
    patternId: betLink.patternId,
    patternName: betLink.patternName,
    useCaseName: betLink.useCaseName ?? betLink.patternName,
    intelligenceSessionId: `my-strategy:${betLink.patternId}:${betLink.useCaseName ?? betLink.patternName}`
      .toLowerCase()
      .replace(/[^a-z0-9:.-]+/g, '-'),
  });
  return (
    <a
      data-testid="my-strategy-shape-into-move"
      href={`/strategic-moves/new?${params.toString()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: SPACING.sm,
        minHeight: 32,
        padding: '0 14px',
        borderRadius: 6,
        background: COLORS.ink,
        color: COLORS.card,
        textDecoration: 'none',
        fontFamily: FONT.body,
        fontSize: 12.5,
        fontWeight: 700,
      }}
    >
      Shape into Move
      <span aria-hidden style={{ fontFamily: FONT.mono }}>→</span>
    </a>
  );
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
        lead="Three numbered moves. Each one names the bet, the why, and the pattern that binds it. Ava pushes back on framing in the right rail."
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
              {b.betLink ? <ShapeIntoMoveCta betLink={b.betLink} /> : null}
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}

'use client';

import type { CSSProperties } from 'react';
import { ANALYTICS, valueTypeMeta } from './analytics-tokens';
import { ValueTypeChip, ValueTypeLegend } from './ValueTypeChip';
import type { FactConfidence, ValueUnit, ValueWaterfallView } from './view-model';

interface ValueWaterfallProps {
  waterfall: ValueWaterfallView;
}

const USD_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtAmount(value: number, unit: ValueUnit): string {
  switch (unit) {
    case 'usd':
    case 'usd_per_year':
      return USD_FMT.format(value);
    case 'pct':
      return `${value}%`;
    case 'fte':
      return `${value} FTE`;
    case 'months':
      return `${value} mo`;
    case 'count':
    case 'ratio':
    default:
      return String(value);
  }
}

function fmtRange(low: number, high: number, unit: ValueUnit): string {
  if (low === high) return fmtAmount(low, unit);
  return `${fmtAmount(low, unit)}–${fmtAmount(high, unit)}`;
}

const CONFIDENCE_LABEL: Record<FactConfidence, string> = {
  low: 'low confidence',
  med: 'med confidence',
  high: 'high confidence',
};

/**
 * The value-type WATERFALL — the classified value story. Each band is one
 * movement, classified into a canonical value type, shown as a RANGE with a
 * confidence band and provenance. Bands with insufficient evidence render as
 * "needs evidence", never as a fabricated $0 (honesty rule).
 *
 * This proves the value story is a chain of classified, evidenced movements —
 * not a single "savings %" the buyer is asked to trust.
 */
export function ValueWaterfall({ waterfall }: ValueWaterfallProps) {
  const { bands, unit, baselineLabel, baselineAmount } = waterfall;

  // Scale bars against the largest quantified high value, so proportion reads.
  const maxHigh = Math.max(
    1,
    ...bands.filter((b) => b.state === 'quantified').map((b) => b.amountHigh),
  );

  // Total the quantified bands to a defensible range (never a point).
  const quantified = bands.filter((b) => b.state === 'quantified');
  const totalLow = quantified.reduce((acc, b) => acc + b.amountLow, 0);
  const totalHigh = quantified.reduce((acc, b) => acc + b.amountHigh, 0);
  const pctLow = baselineAmount > 0 ? Math.round((totalLow / baselineAmount) * 100) : 0;
  const pctHigh = baselineAmount > 0 ? Math.round((totalHigh / baselineAmount) * 100) : 0;

  const cardStyle: CSSProperties = {
    border: `1px solid ${ANALYTICS.LINE}`,
    borderRadius: ANALYTICS.RADIUS_LG,
    background: ANALYTICS.CARD,
    padding: '18px 20px',
  };

  return (
    <section style={cardStyle} data-testid="value-waterfall">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              color: ANALYTICS.INK,
              margin: 0,
            }}
          >
            Value-type waterfall
          </h3>
          <div style={{ fontSize: 12.5, color: ANALYTICS.MUTED, marginTop: 4 }}>
            {baselineLabel}: <b style={{ color: ANALYTICS.INK_2 }}>{fmtAmount(baselineAmount, unit)}</b>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.6px',
              color: ANALYTICS.INK,
            }}
          >
            {fmtRange(totalLow, totalHigh, unit)}
          </div>
          <div
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 11,
              color: ANALYTICS.MUTED,
              marginTop: 2,
            }}
          >
            {pctLow}–{pctHigh}% of baseline · classified value
          </div>
        </div>
      </div>

      <div style={{ margin: '16px 0 14px' }}>
        <ValueTypeLegend />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bands.map((band) => {
          const meta = valueTypeMeta(band.valueType);
          const insufficient = band.state === 'insufficient_evidence';
          const widthPct = insufficient
            ? 0
            : Math.max(6, Math.round((band.amountHigh / maxHigh) * 100));
          return (
            <div
              key={band.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1.4fr) minmax(90px,1fr) auto',
                gap: 14,
                alignItems: 'center',
                padding: '11px 13px',
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: ANALYTICS.RADIUS,
                background: ANALYTICS.CARD,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: 5 }}>
                  <ValueTypeChip valueType={band.valueType} />
                </div>
                <div style={{ fontSize: 13, color: ANALYTICS.INK, lineHeight: 1.4 }}>
                  {band.label}
                </div>
                {band.citation ? (
                  <div style={{ fontSize: 11, color: ANALYTICS.FAINT, marginTop: 4 }}>
                    {band.citation.doc} · {band.citation.locator}
                  </div>
                ) : null}
              </div>

              <div>
                <div
                  style={{
                    height: 22,
                    borderRadius: 6,
                    background: ANALYTICS.SOFT,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {!insufficient ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${widthPct}%`,
                        borderRadius: 6,
                        background: meta.fg,
                        opacity: 0.32,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {insufficient ? (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: ANALYTICS.AMBER_TEXT,
                    }}
                  >
                    needs evidence
                  </span>
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily: ANALYTICS.MONO,
                        fontSize: 13,
                        fontWeight: 700,
                        color: ANALYTICS.INK,
                      }}
                    >
                      {fmtRange(band.amountLow, band.amountHigh, band.unit)}
                    </div>
                    <div style={{ fontSize: 10.5, color: ANALYTICS.FAINT, marginTop: 2 }}>
                      {CONFIDENCE_LABEL[band.confidence]}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 12,
          color: ANALYTICS.MUTED,
          lineHeight: 1.5,
          marginTop: 12,
          marginBottom: 0,
          fontStyle: 'italic',
        }}
      >
        Every band is a classified movement, not a headline discount — the first
        bid is the vendor&rsquo;s opening position, not the baseline. Ranges carry
        confidence; a band without evidence shows &ldquo;needs evidence,&rdquo; never a
        guessed number.
      </p>
    </section>
  );
}

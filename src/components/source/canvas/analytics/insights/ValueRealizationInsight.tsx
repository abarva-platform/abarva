'use client';

// Value — COMMITTED vs REALIZED over time.
//
// The killer insight of the Value step: "committed $X; realization tracked here
// once actuals land." A LineChart over the term — the COMMITTED value track (from
// the awarded levers) and the REALIZED track (pending until periodic realized-value
// actuals are ingested). The realized series is null until it lands, so the chart
// shows the gap honestly rather than a fabricated realization number.
//
// MODEL — realized-value actuals are not in the fact model yet. The badge reads
// "Model" and the note names the fact that flips it live.
//
// LIVE (snapshot) — once realized-to-date actuals are ingested (one
// realized_value_usd fact per lever via VALUE_REALIZATION_V1), the insight goes
// live: the realized-to-date TOTAL is marked as the current point on the committed
// track, and a per-lever realized-to-date-vs-committed list is shown. This is a
// realized-to-date snapshot, not a per-period ramp — a lever with no realized fact
// is shown as "not yet realized", never fabricated. The full per-period time-series
// is a deferred enhancement.

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ANALYTICS, valueTypeMeta } from '../analytics-tokens';
import { InsightShell } from './InsightShell';
import type { ValueRealizationInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

const COMMITTED_STROKE = ANALYTICS.INK;
const REALIZED_STROKE = ANALYTICS.GREEN;

interface ValueRealizationInsightProps {
  insight: ValueRealizationInsightView;
}

export function ValueRealizationInsight({
  insight,
}: ValueRealizationInsightProps) {
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  const chartRows = insight.points.map((p) => ({
    period: p.period,
    committed: p.committed,
    realized: p.realized, // null renders as a gap — never a fabricated 0-as-fact
  }));

  // LIVE snapshot only — the per-lever realized-to-date-vs-committed list.
  const bars = insight.bars ?? [];

  return (
    <InsightShell
      eyebrow="Value · Committed vs realized"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel={insight.isModel}
      advisor={advisor}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartRows}
          margin={{ top: 8, right: 24, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke={ANALYTICS.LINE} />
          <XAxis
            dataKey="period"
            tick={{ fontFamily: ANALYTICS.SANS, fontSize: 11, fill: ANALYTICS.MUTED }}
            axisLine={{ stroke: ANALYTICS.LINE }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => fmtUsd(value)}
            tick={{ fontFamily: ANALYTICS.SANS, fontSize: 11, fill: ANALYTICS.MUTED }}
            axisLine={{ stroke: ANALYTICS.LINE }}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: ANALYTICS.LINE }}
            formatter={(value, name) => {
              if (value === null || value === undefined) return ['pending', 'Realized'];
              const amount = typeof value === 'number' ? value : Number(value) || 0;
              return [fmtUsd(amount), name === 'committed' ? 'Committed' : 'Realized'];
            }}
            contentStyle={{
              fontFamily: ANALYTICS.SANS,
              fontSize: 12,
              border: `1px solid ${ANALYTICS.LINE}`,
              borderRadius: 8,
            }}
          />
          <Legend
            formatter={(value) =>
              value === 'committed' ? 'Committed value' : 'Realized (pending)'
            }
            wrapperStyle={{ fontFamily: ANALYTICS.SANS, fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="committed"
            stroke={COMMITTED_STROKE}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="realized"
            stroke={REALIZED_STROKE}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* LIVE snapshot — per-lever realized-to-date vs committed. A lever with no
          realized fact is shown honestly as "not yet realized", never fabricated. */}
      {bars.length > 0 ? (
        <div
          data-testid="value-realization-bars"
          style={{ marginTop: 12, display: 'grid', gap: 6 }}
        >
          {bars.map((bar) => {
            const meta = valueTypeMeta(bar.valueType);
            const realizedLabel =
              bar.realized === undefined
                ? 'Not yet realized'
                : `${fmtUsd(bar.realized)} realized`;
            return (
              <div
                key={bar.leverKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: ANALYTICS.SANS,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: ANALYTICS.INK,
                    minWidth: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: meta.fg,
                      flex: '0 0 auto',
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bar.label}
                  </span>
                </span>
                <span
                  style={{
                    color:
                      bar.realized === undefined
                        ? ANALYTICS.MUTED
                        : ANALYTICS.INK,
                    flex: '0 0 auto',
                  }}
                >
                  {realizedLabel}{' '}
                  <span style={{ color: ANALYTICS.MUTED }}>
                    / {fmtUsd(bar.committed)} committed
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* The fact that flips this MODEL → LIVE, named for the operator. */}
      <div
        data-testid="value-realization-flip"
        style={{
          marginTop: 12,
          fontSize: 12,
          color: ANALYTICS.INK_2,
          lineHeight: 1.5,
        }}
      >
        <b style={{ color: ANALYTICS.INK }}>Goes live when:</b> {insight.flipFact}
      </div>
    </InsightShell>
  );
}

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
import { ANALYTICS } from '../analytics-tokens';
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

  return (
    <InsightShell
      eyebrow="Value · Committed vs realized"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel
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

'use client';

// Strategy — VALUE POOL decomposed by lever.
//
// The killer insight of the Strategy step: "is the prize worth the event?" One
// horizontal bar per value LEVER, showing each lever's low–high $ RANGE at stake,
// colored by value type, biggest-first. A range is a floating bar (low→high), not
// a point — the honesty rule. Real from the fact/lever engine when facts exist;
// a clearly-badged sample from the archetype's illustrative values otherwise; an
// honest empty state when there is nothing to size.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ANALYTICS, valueTypeMeta } from '../analytics-tokens';
import { ValueTypeLegend } from '../ValueTypeChip';
import { InsightShell } from './InsightShell';
import type { ValuePoolInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

interface ValuePoolInsightProps {
  insight: ValuePoolInsightView;
}

export function ValuePoolInsight({ insight }: ValuePoolInsightProps) {
  const { bars } = insight;

  // Empty state: no bar to draw — never a fabricated chart.
  if (bars.length === 0) {
    return (
      <InsightShell
        eyebrow="Strategy · Value pool"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
      >
        <div
          data-testid="value-pool-empty"
          style={{
            padding: '28px 16px',
            textAlign: 'center',
            border: `1px dashed ${ANALYTICS.LINE}`,
            borderRadius: ANALYTICS.RADIUS,
            color: ANALYTICS.MUTED,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Provide run-cost, ticket-volume, and contract evidence to size the
          value pool for this event. We name every lever; we never guess a number.
        </div>
      </InsightShell>
    );
  }

  // The floating range bar: recharts stacks an invisible "offset" (= low) then a
  // visible "span" (= high − low), so the visible bar starts at low and ends at
  // high. This renders the RANGE, never a point.
  const chartRows = bars.map((b) => ({
    leverKey: b.leverKey,
    label: b.label.length > 30 ? `${b.label.slice(0, 28)}…` : b.label,
    fullLabel: b.label,
    valueType: b.valueType,
    offset: b.low,
    span: Math.max(b.high - b.low, 0),
    low: b.low,
    high: b.high,
    confidence: b.confidence,
  }));

  const height = Math.max(180, chartRows.length * 52);

  return (
    <InsightShell
      eyebrow="Strategy · Value pool"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
    >
      <div style={{ margin: '0 0 12px' }}>
        <ValueTypeLegend />
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
          barCategoryGap={16}
        >
          <CartesianGrid horizontal={false} stroke={ANALYTICS.LINE} />
          <XAxis
            type="number"
            tickFormatter={(value: number) => fmtUsd(value)}
            tick={{ fontFamily: ANALYTICS.SANS, fontSize: 11, fill: ANALYTICS.MUTED }}
            axisLine={{ stroke: ANALYTICS.LINE }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={200}
            tick={{ fontFamily: ANALYTICS.SANS, fontSize: 12, fill: ANALYTICS.INK }}
            axisLine={{ stroke: ANALYTICS.LINE }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(10,10,11,0.03)' }}
            formatter={(_value: number, _name: string, entry) => {
              const row = entry?.payload as
                | { low: number; high: number }
                | undefined;
              if (!row) return ['', ''];
              return [`${fmtUsd(row.low)}–${fmtUsd(row.high)} at stake`, 'Range'];
            }}
            labelFormatter={(_label: string, payload) =>
              (payload?.[0]?.payload as { fullLabel?: string })?.fullLabel ??
              _label
            }
            contentStyle={{
              fontFamily: ANALYTICS.SANS,
              fontSize: 12,
              border: `1px solid ${ANALYTICS.LINE}`,
              borderRadius: 8,
            }}
          />
          {/* Invisible offset positions the visible span at `low`. */}
          <Bar dataKey="offset" stackId="range" fill="transparent" />
          <Bar dataKey="span" stackId="range" radius={[4, 4, 4, 4]}>
            {chartRows.map((row) => (
              <Cell key={row.leverKey} fill={valueTypeMeta(row.valueType).fg} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {insight.needsEvidenceLevers.length > 0 ? (
        <p
          style={{
            fontSize: 12,
            color: ANALYTICS.MUTED,
            lineHeight: 1.5,
            margin: '10px 0 0',
          }}
        >
          <b style={{ color: ANALYTICS.AMBER_TEXT }}>
            {insight.needsEvidenceLevers.length} more{' '}
            {insight.needsEvidenceLevers.length === 1 ? 'lever' : 'levers'}
          </b>{' '}
          can be sized once evidence lands:{' '}
          {insight.needsEvidenceLevers.join(', ')}. Named, never guessed.
        </p>
      ) : null}
    </InsightShell>
  );
}

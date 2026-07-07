'use client';

// Selection — COMMITTED VALUE by lever (compact).
//
// The lightweight insight of the Selection step: the value the award locks, by
// lever. A compact horizontal BarChart — one floating range bar per lever, colored
// by value type — so the total the award commits reads at a glance. Low-signal by
// design: a compact summary, not an over-built surface.
//
// MODEL — award facts are not in the fact model yet, so committed value is the
// awarded-lever roll-up. The badge reads "Model" and the note names the fact that
// flips it live.

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
import { InsightShell } from './InsightShell';
import type { CommittedValueInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

interface CommittedValueInsightProps {
  insight: CommittedValueInsightView;
}

export function CommittedValueInsight({ insight }: CommittedValueInsightProps) {
  const { bars } = insight;
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  if (bars.length === 0) {
    return (
      <InsightShell
        eyebrow="Selection · Committed value"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
        isModel
        advisor={advisor}
      >
        <div
          data-testid="committed-value-empty"
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
          No value levers are wired for this archetype yet.
        </div>
      </InsightShell>
    );
  }

  const chartRows = bars.map((b) => ({
    leverKey: b.leverKey,
    label: b.label.length > 30 ? `${b.label.slice(0, 28)}…` : b.label,
    fullLabel: b.label,
    valueType: b.valueType,
    offset: b.low,
    span: Math.max(b.high - b.low, 0),
    low: b.low,
    high: b.high,
  }));

  const height = Math.max(160, chartRows.length * 46);

  return (
    <InsightShell
      eyebrow="Selection · Committed value"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel
      advisor={advisor}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
          barCategoryGap={14}
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
            formatter={(_value, _name, entry) => {
              const row = (entry?.payload ?? undefined) as
                | { low: number; high: number }
                | undefined;
              if (!row) return '';
              return `${fmtUsd(row.low)}–${fmtUsd(row.high)} committed`;
            }}
            labelFormatter={(label, payload) =>
              (payload?.[0]?.payload as { fullLabel?: string } | undefined)
                ?.fullLabel ?? label
            }
            contentStyle={{
              fontFamily: ANALYTICS.SANS,
              fontSize: 12,
              border: `1px solid ${ANALYTICS.LINE}`,
              borderRadius: 8,
            }}
          />
          <Bar dataKey="offset" stackId="range" fill="transparent" />
          <Bar dataKey="span" stackId="range" radius={[4, 4, 4, 4]}>
            {chartRows.map((row) => (
              <Cell key={row.leverKey} fill={valueTypeMeta(row.valueType).fg} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div
        data-testid="committed-value-flip"
        style={{ marginTop: 12, fontSize: 12, color: ANALYTICS.INK_2, lineHeight: 1.5 }}
      >
        <b style={{ color: ANALYTICS.INK }}>Goes live when:</b> {insight.flipFact}
      </div>
    </InsightShell>
  );
}

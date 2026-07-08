'use client';

// BAFO — VALUE CAPTURED vs TARGET.
//
// The killer insight of the BAFO step: value captured vs target by lever, with the
// remaining ask (the lever left to pull). A horizontal BarChart per lever — the
// TARGET (list, ink) as the full bar and the CAPTURED (green) overlaid — so the gap
// still to close reads at a glance. Beneath, a read-out surfaces each lever's BAFO
// ask (the concession to press).
//
// MODEL — BAFO concession actuals are not in the fact model yet, so captured is a
// placeholder (0) against each lever's target. LIVE — once concession actuals are
// ingested (one bafo_concession_captured_usd fact per lever) each bar carries the
// captured value the BAFO round booked against its target. The badge and note key
// off insight.isModel, never provenance alone.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ANALYTICS } from '../analytics-tokens';
import { InsightShell } from './InsightShell';
import type { BafoProgressInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

const TARGET_FILL = ANALYTICS.LINE_STRONG;
const CAPTURED_FILL = ANALYTICS.GREEN;

interface BafoProgressInsightProps {
  insight: BafoProgressInsightView;
}

export function BafoProgressInsight({ insight }: BafoProgressInsightProps) {
  const { rows, isModel } = insight;
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  if (rows.length === 0) {
    return (
      <InsightShell
        eyebrow="BAFO · Captured vs target"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
        isModel={isModel}
        advisor={advisor}
      >
        <div
          data-testid="bafo-progress-empty"
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

  // Each lever: target (midpoint of the range) as the full bar, captured overlaid.
  const chartRows = rows.map((r) => ({
    leverKey: r.leverKey,
    label: r.label.length > 30 ? `${r.label.slice(0, 28)}…` : r.label,
    fullLabel: r.label,
    target: Math.round((r.targetLow + r.targetHigh) / 2),
    captured: r.captured,
  }));

  const height = Math.max(180, chartRows.length * 52);

  return (
    <InsightShell
      eyebrow="BAFO · Captured vs target"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel={isModel}
      advisor={advisor}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
          barGap={-18}
          barCategoryGap={18}
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
            formatter={(value, name) => {
              const amount = typeof value === 'number' ? value : Number(value) || 0;
              return [fmtUsd(amount), name === 'target' ? 'Target' : 'Captured'];
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
          <Legend
            formatter={(value) => (value === 'target' ? 'Target' : 'Captured')}
            wrapperStyle={{ fontFamily: ANALYTICS.SANS, fontSize: 11 }}
          />
          <Bar dataKey="target" fill={TARGET_FILL} radius={[4, 4, 4, 4]} barSize={18} />
          <Bar dataKey="captured" fill={CAPTURED_FILL} radius={[4, 4, 4, 4]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>

      {/* The remaining BAFO ask per lever — the concession to press. */}
      <div
        data-testid="bafo-progress-asks"
        style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {rows.map((r) => (
          <div
            key={r.leverKey}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 11px',
              border: `1px solid ${ANALYTICS.LINE_SOFT}`,
              borderRadius: ANALYTICS.RADIUS,
              background: ANALYTICS.SOFT,
            }}
          >
            <span style={{ fontSize: 12.5, color: ANALYTICS.INK, flex: '0 0 38%' }}>
              {r.label}
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: ANALYTICS.INK_2,
                textAlign: 'right',
                lineHeight: 1.4,
              }}
            >
              Ask: {r.bafoAsk}
            </span>
          </div>
        ))}
      </div>

      <div
        data-testid="bafo-progress-flip"
        style={{ marginTop: 12, fontSize: 12, color: ANALYTICS.INK_2, lineHeight: 1.5 }}
      >
        <b style={{ color: ANALYTICS.INK }}>Goes live when:</b> {insight.flipFact}
      </div>
    </InsightShell>
  );
}

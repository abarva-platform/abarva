'use client';

// Evaluation — SHOULD-COST NORMALIZATION.
//
// The killer insight of the Evaluation step: "the cheapest bid is a trap." A
// grouped/stacked BarChart per vendor — the HEADLINE (list) price, then the
// normalizing ADJUSTMENTS (retained FTE, SLA / transition risk) stacked on top to
// reach true NORMALIZED TCO. The vendor cheapest on headline flips after
// normalization; the winner is marked.
//
// Vendor-bid facts are NOT in the fact model yet, so this ships as a clearly
// badged MODEL (illustrative vendors) that demonstrates the normalization logic.
// It is never presented as real bids — the badge reads "Model" and the note says
// it goes live when vendor responses are ingested.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ANALYTICS } from '../analytics-tokens';
import { InsightShell } from './InsightShell';
import type { ShouldCostInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

interface ShouldCostInsightProps {
  insight: ShouldCostInsightView;
}

const HEADLINE_FILL = ANALYTICS.INK;
const ADJUST_FILL = ANALYTICS.AMBER;
const WINNER_STROKE = ANALYTICS.GREEN;

export function ShouldCostInsight({ insight }: ShouldCostInsightProps) {
  const { vendors } = insight;

  // One row per vendor: headline (base) + total adjustments (stacked) = TCO.
  const chartRows = vendors.map((v) => {
    const adjustmentTotal = v.adjustments.reduce((s, a) => s + a.amount, 0);
    return {
      vendorKey: v.vendorKey,
      label: v.label,
      headline: v.headlinePrice,
      adjustments: adjustmentTotal,
      normalizedTco: v.normalizedTco,
      adjustmentBreakdown: v.adjustments,
      isNormalizedWinner: v.vendorKey === insight.normalizedWinnerKey,
      isHeadlineWinner: v.vendorKey === insight.headlineWinnerKey,
    };
  });

  const height = Math.max(220, chartRows.length * 84);

  return (
    <InsightShell
      eyebrow="Evaluation · Should-cost"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel
      advisor={{
        bestPractice: insight.bestPractice,
        benchmark: insight.benchmark,
        downstreamImpact: insight.downstreamImpact,
      }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 64, left: 4, bottom: 4 }}
          barCategoryGap={22}
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
            width={90}
            tick={{ fontFamily: ANALYTICS.SANS, fontSize: 12, fill: ANALYTICS.INK }}
            axisLine={{ stroke: ANALYTICS.LINE }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(10,10,11,0.03)' }}
            formatter={(value, name) => {
              const amount = typeof value === 'number' ? value : Number(value) || 0;
              const label =
                name === 'headline'
                  ? 'Headline price'
                  : 'Normalization (retained + risk)';
              return [fmtUsd(amount), label];
            }}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload as
                | { label?: string; normalizedTco?: number }
                | undefined;
              return row?.label
                ? `${row.label} — normalized TCO ${fmtUsd(row.normalizedTco ?? 0)}`
                : label;
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
              value === 'headline' ? 'Headline price' : 'Normalization added'
            }
            wrapperStyle={{ fontFamily: ANALYTICS.SANS, fontSize: 11 }}
          />
          <Bar dataKey="headline" stackId="tco" fill={HEADLINE_FILL} radius={[4, 0, 0, 4]}>
            {chartRows.map((row) => (
              <Cell
                key={row.vendorKey}
                fill={HEADLINE_FILL}
                stroke={row.isNormalizedWinner ? WINNER_STROKE : undefined}
                strokeWidth={row.isNormalizedWinner ? 2 : 0}
              />
            ))}
          </Bar>
          <Bar dataKey="adjustments" stackId="tco" fill={ADJUST_FILL} radius={[0, 4, 4, 0]}>
            {chartRows.map((row) => (
              <Cell
                key={row.vendorKey}
                fill={ADJUST_FILL}
                stroke={row.isNormalizedWinner ? WINNER_STROKE : undefined}
                strokeWidth={row.isNormalizedWinner ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* The read-out: headline-cheapest vs normalized-winner, so the flip is legible. */}
      <div
        data-testid="should-cost-readout"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 12,
        }}
      >
        {chartRows.map((row) => (
          <div
            key={row.vendorKey}
            style={{
              flex: '1 1 150px',
              border: `1px solid ${row.isNormalizedWinner ? WINNER_STROKE : ANALYTICS.LINE_SOFT}`,
              borderRadius: ANALYTICS.RADIUS,
              padding: '10px 12px',
              background: row.isNormalizedWinner ? ANALYTICS.GREEN_TINT : ANALYTICS.CARD,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: ANALYTICS.INK }}>
              {row.label}
              {row.isNormalizedWinner ? (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    color: ANALYTICS.GREEN_TEXT,
                  }}
                >
                  ✓ normalized winner
                </span>
              ) : row.isHeadlineWinner ? (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    color: ANALYTICS.AMBER_TEXT,
                  }}
                >
                  cheapest on paper
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 11, color: ANALYTICS.MUTED, marginTop: 4 }}>
              Headline {fmtUsd(row.headline)} → TCO{' '}
              <b style={{ color: ANALYTICS.INK }}>{fmtUsd(row.normalizedTco)}</b>
            </div>
          </div>
        ))}
      </div>
    </InsightShell>
  );
}

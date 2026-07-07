'use client';

// Executive Decision — VALUE + RISK, BOARD-READY.
//
// The killer insight of the Executive Decision step: the board read of the
// classified value. A horizontal BarChart — one floating range bar per bucket:
// NEGOTIABLE (earned: incremental + solution), PROTECTED (a risk hedge), and
// RISK-ADJUSTED (a TCO normalization) — each stated APART, never summed into one
// savings headline. Beneath, a residual-risk read names the levers still needing
// evidence (the confidence caveat).
//
// LIVE from the value bridge (`buildValueWaterfall`). Sample-marked when no lever
// computes. The bucket accents follow the canonical value-type palette so the
// board read is consistent with the value bridge.

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
import type {
  ExecDecisionInsightView,
  ExecDecisionSliceView,
} from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

interface ExecDecisionInsightProps {
  insight: ExecDecisionInsightView;
}

/** Bucket → accent color (aligned with the canonical value-type palette). */
function bucketFill(bucket: ExecDecisionSliceView['bucket']): string {
  switch (bucket) {
    case 'negotiable':
      return valueTypeMeta('incremental_negotiated').fg;
    case 'protected':
      return valueTypeMeta('protected').fg;
    case 'risk_adjusted':
    default:
      return valueTypeMeta('risk_adjusted').fg;
  }
}

export function ExecDecisionInsight({ insight }: ExecDecisionInsightProps) {
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  const chartRows = insight.slices.map((s) => ({
    bucket: s.bucket,
    label: s.label,
    offset: s.low,
    span: Math.max(s.high - s.low, 0),
    low: s.low,
    high: s.high,
    fill: bucketFill(s.bucket),
  }));

  const height = Math.max(160, Math.max(chartRows.length, 1) * 56);

  return (
    <InsightShell
      eyebrow="Executive Decision · Value + risk"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      advisor={advisor}
    >
      {chartRows.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartRows}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
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
              width={210}
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
                return `${fmtUsd(row.low)}–${fmtUsd(row.high)}`;
              }}
              labelFormatter={(label) => String(label)}
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
                <Cell key={row.bucket} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div
          data-testid="exec-decision-empty"
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            border: `1px dashed ${ANALYTICS.LINE}`,
            borderRadius: ANALYTICS.RADIUS,
            color: ANALYTICS.MUTED,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          No classified value yet — provide evidence to size the board read. No
          bucket is shown as $0.
        </div>
      )}

      {/* Residual-risk read — the levers still needing evidence (the caveat). */}
      {insight.residualRiskLeverCount > 0 ? (
        <div
          data-testid="exec-decision-residual"
          style={{
            marginTop: 12,
            padding: '10px 12px',
            border: `1px solid ${ANALYTICS.LINE_SOFT}`,
            borderRadius: ANALYTICS.RADIUS,
            background: ANALYTICS.SOFT,
            fontSize: 12,
            color: ANALYTICS.INK_2,
            lineHeight: 1.5,
          }}
        >
          <b style={{ color: ANALYTICS.INK }}>
            Residual risk · {insight.residualRiskLeverCount}{' '}
            {insight.residualRiskLeverCount === 1 ? 'lever' : 'levers'} unsized:
          </b>{' '}
          {insight.residualRiskLevers.join(', ')} — stated as pending, never as a
          number.
        </div>
      ) : null}
    </InsightShell>
  );
}

'use client';

// Transition — TRANSITION-RISK EXPOSURE.
//
// The killer insight of the Transition step: "$X at risk if the transition
// overruns; milestone fees cap it at $Y." A horizontal BarChart with two bars —
// the probability-weighted EXPOSURE (conservative→expected, a floating range) and
// the TRANSITION FEE (the fee-at-risk a milestone plan caps the exposure with).
//
// LIVE from the seeded transition facts: the AMS.TRANSITION_RISK lever computes
// `transition_fee × overrun_cost_multiple × overrun_probability`. When the fee /
// probability facts are absent the exposure cannot be sized — an honest empty
// state renders, never a $0 or a guess.

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
import { ANALYTICS } from '../analytics-tokens';
import { InsightShell } from './InsightShell';
import type { TransitionRiskInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

const EXPOSURE_FILL = ANALYTICS.AMBER;
const CAP_FILL = ANALYTICS.GREEN;

interface TransitionRiskInsightProps {
  insight: TransitionRiskInsightView;
}

export function TransitionRiskInsight({ insight }: TransitionRiskInsightProps) {
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  // Not quantified → honest empty (never a $0 chart).
  if (!insight.quantified) {
    return (
      <InsightShell
        eyebrow="Transition · Transition-risk exposure"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
        advisor={advisor}
      >
        <div
          data-testid="transition-risk-empty"
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
          The transition-risk exposure sizes from a quoted transition fee and a
          benchmarked overrun probability. We name the missing evidence; we never
          guess a number.
        </div>
      </InsightShell>
    );
  }

  // Two rows: the exposure (floating range low→high) and the fee-at-risk cap.
  const chartRows = [
    {
      key: 'exposure',
      label: 'Exposure if overrun',
      offset: insight.exposureLow,
      span: Math.max(insight.exposureHigh - insight.exposureLow, 0),
      low: insight.exposureLow,
      high: insight.exposureHigh,
      fill: EXPOSURE_FILL,
    },
    {
      key: 'cap',
      label: 'Fee-at-risk (milestone cap)',
      offset: 0,
      span: insight.transitionFee,
      low: insight.transitionFee,
      high: insight.transitionFee,
      fill: CAP_FILL,
    },
  ];

  return (
    <InsightShell
      eyebrow="Transition · Transition-risk exposure"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      advisor={advisor}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
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
            width={190}
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
              return row.low === row.high
                ? fmtUsd(row.low)
                : `${fmtUsd(row.low)}–${fmtUsd(row.high)}`;
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
              <Cell key={row.key} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* The read-out: the drivers behind the exposure (probability × multiple). */}
      <div
        data-testid="transition-risk-readout"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 12,
        }}
      >
        <ReadoutCell
          label="Overrun probability"
          value={`${Math.round(insight.overrunProbabilityPct)}%`}
        />
        <ReadoutCell
          label="Overrun cost multiple"
          value={`${insight.overrunCostMultiple}×`}
        />
        <ReadoutCell label="Transition fee" value={fmtUsd(insight.transitionFee)} />
      </div>
    </InsightShell>
  );
}

function ReadoutCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: '1 1 150px',
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS,
        padding: '10px 12px',
        background: ANALYTICS.CARD,
      }}
    >
      <div style={{ fontSize: 11, color: ANALYTICS.MUTED }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: ANALYTICS.INK, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

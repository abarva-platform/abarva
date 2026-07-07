'use client';

// Responses — VENDOR DODGE-MAP.
//
// The killer insight of the Responses step: per value dimension, whether vendors
// ANSWERED (committed) or DODGED. A horizontal BarChart — one floating range bar
// per value dimension, colored by answered (green) vs dodged (amber). Beneath, a
// dodged read-out surfaces the evaluation impact of each unanswered dimension (the
// advisor's "here's what to press in evaluation").
//
// MODEL — vendor-response facts are not in the fact model yet, so every dimension
// is shown as dodged (the exposure) until proven answered. The badge reads "Model"
// and the note names the fact that flips it live.

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
import type { ResponseCoverageInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

const ANSWERED_FILL = ANALYTICS.GREEN;
const DODGED_FILL = ANALYTICS.AMBER;

interface ResponseCoverageInsightProps {
  insight: ResponseCoverageInsightView;
}

export function ResponseCoverageInsight({
  insight,
}: ResponseCoverageInsightProps) {
  const { rows } = insight;
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  if (rows.length === 0) {
    return (
      <InsightShell
        eyebrow="Responses · Vendor dodge-map"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
        isModel
        advisor={advisor}
      >
        <div
          data-testid="response-coverage-empty"
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
          No value dimensions are wired for this archetype yet.
        </div>
      </InsightShell>
    );
  }

  const chartRows = rows.map((r) => ({
    leverKey: r.leverKey,
    label: r.label.length > 30 ? `${r.label.slice(0, 28)}…` : r.label,
    fullLabel: r.label,
    status: r.status,
    offset: r.low,
    span: Math.max(r.high - r.low, 0),
    low: r.low,
    high: r.high,
  }));

  const height = Math.max(180, chartRows.length * 52);
  const answeredCount = rows.filter((r) => r.status === 'answered').length;
  const dodgedCount = rows.length - answeredCount;

  return (
    <InsightShell
      eyebrow="Responses · Vendor dodge-map"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel
      advisor={advisor}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          margin: '0 0 12px',
          fontFamily: ANALYTICS.SANS,
          fontSize: 11.5,
        }}
      >
        <LegendSwatch color={ANSWERED_FILL} label={`Answered · ${answeredCount}`} />
        <LegendSwatch color={DODGED_FILL} label={`Dodged · ${dodgedCount}`} />
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
            formatter={(_value, _name, entry) => {
              const row = (entry?.payload ?? undefined) as
                | { low: number; high: number; status: string }
                | undefined;
              if (!row) return '';
              return `${fmtUsd(row.low)}–${fmtUsd(row.high)} at stake · ${row.status}`;
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
              <Cell
                key={row.leverKey}
                fill={row.status === 'answered' ? ANSWERED_FILL : DODGED_FILL}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Dodged read-out — the evaluation impact to press for each unanswered one. */}
      {dodgedCount > 0 ? (
        <div
          data-testid="response-coverage-dodged"
          style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {rows
            .filter((r) => r.status === 'dodged')
            .map((r) => (
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
                <span style={{ fontSize: 12.5, color: ANALYTICS.INK, flex: '0 0 40%' }}>
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
                  {r.evaluationImpact}
                </span>
              </div>
            ))}
        </div>
      ) : null}

      <div
        data-testid="response-coverage-flip"
        style={{ marginTop: 12, fontSize: 12, color: ANALYTICS.INK_2, lineHeight: 1.5 }}
      >
        <b style={{ color: ANALYTICS.INK }}>Goes live when:</b> {insight.flipFact}
      </div>
    </InsightShell>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          display: 'inline-block',
        }}
      />
      <span style={{ color: ANALYTICS.MUTED }}>{label}</span>
    </span>
  );
}

'use client';

// RFP — LEVER-TO-CLAUSE COVERAGE (protected vs exposed).
//
// The advisor-grade insight of the RFP step: "the RFP is the last point to lock a
// lever into a requirement." One horizontal bar per value LEVER (its low–high $ at
// stake). A lever is PROTECTED (green accent) when the RFP requires its clause, or
// EXPOSED (amber accent) when it does not — an unprotected lever cannot be
// recovered in Evaluation or BAFO. A range is a floating bar (low→high), never a
// point (the honesty rule).
//
// There is no structured RFP-draft in the fact model yet, so by default every
// lever is EXPOSED ("to require") — a clearly-badged MODEL — until an RFP-draft
// signal exists. Beneath the chart the InsightShell renders the advisor layer, and
// the exposed levers carry a CLAUSE LIBRARY: the exact rfpClause + bafoAsk text to
// drop into the RFP.

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
import type { RfpClauseInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

const PROTECTED_FILL = ANALYTICS.GREEN;
const EXPOSED_FILL = ANALYTICS.AMBER;

interface RfpClauseInsightProps {
  insight: RfpClauseInsightView;
}

export function RfpClauseInsight({ insight }: RfpClauseInsightProps) {
  const { rows } = insight;
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  if (rows.length === 0) {
    return (
      <InsightShell
        eyebrow="RFP · Lever-to-clause coverage"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
        isModel={insight.isModel}
        advisor={advisor}
      >
        <div
          data-testid="rfp-clause-empty"
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
          No value levers are wired for this archetype yet — there is no clause set
          to protect. We name every clause; we never guess a number.
        </div>
      </InsightShell>
    );
  }

  const chartRows = rows.map((r) => ({
    leverKey: r.leverKey,
    label: r.label.length > 30 ? `${r.label.slice(0, 28)}…` : r.label,
    fullLabel: r.label,
    protected: r.protected,
    offset: r.low,
    span: Math.max(r.high - r.low, 0),
    low: r.low,
    high: r.high,
  }));

  const height = Math.max(180, chartRows.length * 52);

  const protectedCount = rows.filter((r) => r.protected).length;
  const exposedRows = rows.filter((r) => !r.protected);

  return (
    <InsightShell
      eyebrow="RFP · Lever-to-clause coverage"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel={insight.isModel}
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
        <LegendSwatch color={PROTECTED_FILL} label={`Protected · ${protectedCount}`} />
        <LegendSwatch color={EXPOSED_FILL} label={`Exposed · ${exposedRows.length}`} />
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
                | { low: number; high: number; protected: boolean }
                | undefined;
              if (!row) return '';
              const state = row.protected ? 'protected by clause' : 'exposed';
              return `${fmtUsd(row.low)}–${fmtUsd(row.high)} at stake · ${state}`;
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
                fill={row.protected ? PROTECTED_FILL : EXPOSED_FILL}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* The CLAUSE LIBRARY — the exact rfpClause + bafoAsk text to drop into the
          RFP for each exposed lever. This is the advisor's deliverable. */}
      {exposedRows.length > 0 ? (
        <div
          data-testid="rfp-clause-library"
          style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <span
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 9.5,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontWeight: 800,
              color: ANALYTICS.AMBER_TEXT,
            }}
          >
            Clauses to require ({exposedRows.length})
          </span>
          {exposedRows.map((r) => (
            <div
              key={r.leverKey}
              style={{
                padding: '10px 12px',
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: ANALYTICS.RADIUS,
                background: ANALYTICS.SOFT,
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: ANALYTICS.INK,
                  marginBottom: 4,
                }}
              >
                {r.label}{' '}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: ANALYTICS.AMBER_TEXT,
                  }}
                >
                  · {fmtUsd(r.low)}–{fmtUsd(r.high)} exposed
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: ANALYTICS.INK_2, lineHeight: 1.5, margin: '0 0 4px' }}>
                <b>RFP clause:</b> {r.rfpClause}
              </p>
              <p style={{ fontSize: 12, color: ANALYTICS.MUTED, lineHeight: 1.5, margin: 0 }}>
                <b>Fallback (BAFO):</b> {r.bafoAsk}
              </p>
            </div>
          ))}
        </div>
      ) : null}
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

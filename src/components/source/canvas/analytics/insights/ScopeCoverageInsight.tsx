'use client';

// Scope — SCOPE-TO-VALUE COVERAGE (reachable vs stranded).
//
// The advisor-grade insight of the Scope step: "scope sets your ceiling." One
// horizontal bar per value LEVER, showing each lever's low–high $ RANGE at stake.
// A lever is REACHABLE (green accent) when every fact its computation requires is
// present under the current scope/evidence, or STRANDED (amber accent) when
// required evidence is missing / out of scope — a lever left out of scope cannot
// be recovered in RFP / Evaluation / BAFO. A range is a floating bar (low→high),
// never a point (the honesty rule).
//
// Live from real facts where present; a clearly-badged MODEL (from the archetype)
// when the event has no scope facts yet — showing what a complete scope unlocks.
// Beneath the chart the InsightShell renders the advisor layer (best-practice,
// benchmark, downstream impact) so the CXO sees the cost of scoping this wrong.

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
import type { ScopeCoverageInsightView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

const REACHABLE_FILL = ANALYTICS.GREEN;
const STRANDED_FILL = ANALYTICS.AMBER;

interface ScopeCoverageInsightProps {
  insight: ScopeCoverageInsightView;
}

export function ScopeCoverageInsight({ insight }: ScopeCoverageInsightProps) {
  const { rows } = insight;
  const advisor = {
    bestPractice: insight.bestPractice,
    benchmark: insight.benchmark,
    downstreamImpact: insight.downstreamImpact,
  };

  // Empty state: nothing to size — never a fabricated chart.
  if (rows.length === 0) {
    return (
      <InsightShell
        eyebrow="Scope · Scope-to-value coverage"
        headline={insight.headline}
        provenance={insight.provenance}
        note={insight.note}
        isModel={insight.isModel}
        advisor={advisor}
      >
        <div
          data-testid="scope-coverage-empty"
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
          No value levers are wired for this archetype yet — there is nothing to
          judge reachable vs stranded. We name every lever; we never guess a
          number.
        </div>
      </InsightShell>
    );
  }

  // Floating range bar (offset = low, span = high − low) so the visible bar starts
  // at low and ends at high — the RANGE, never a point.
  const chartRows = rows.map((r) => ({
    leverKey: r.leverKey,
    label: r.label.length > 30 ? `${r.label.slice(0, 28)}…` : r.label,
    fullLabel: r.label,
    reachable: r.reachable,
    offset: r.low,
    span: Math.max(r.high - r.low, 0),
    low: r.low,
    high: r.high,
    missingEvidence: r.missingEvidence,
  }));

  const height = Math.max(180, chartRows.length * 52);

  const reachableCount = rows.filter((r) => r.reachable).length;
  const strandedCount = rows.length - reachableCount;

  return (
    <InsightShell
      eyebrow="Scope · Scope-to-value coverage"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
      isModel={insight.isModel}
      advisor={advisor}
    >
      {/* Reachable / stranded legend. */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          margin: '0 0 12px',
          fontFamily: ANALYTICS.SANS,
          fontSize: 11.5,
        }}
      >
        <LegendSwatch color={REACHABLE_FILL} label={`Reachable · ${reachableCount}`} />
        <LegendSwatch color={STRANDED_FILL} label={`Stranded · ${strandedCount}`} />
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
                | { low: number; high: number; reachable: boolean }
                | undefined;
              if (!row) return '';
              const state = row.reachable ? 'reachable' : 'stranded';
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
                fill={row.reachable ? REACHABLE_FILL : STRANDED_FILL}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stranded read-out — WHY each stranded lever is stranded (the missing
          evidence family). This is the advisor's "here's what to scope for". */}
      {strandedCount > 0 ? (
        <div
          data-testid="scope-coverage-stranded"
          style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {rows
            .filter((r) => !r.reachable)
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
                <span
                  style={{
                    fontSize: 12.5,
                    color: ANALYTICS.INK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {r.label}
                  {/* Benchmark-based POTENTIAL AT RISK badge — honest wording so this
                      reads as an "if unblocked", benchmark-scaled potential, never a
                      computed tenant number or a savings claim. */}
                  {r.potentialAtRisk ? (
                    <span
                      data-testid="scope-coverage-potential-badge"
                      title="Benchmark-based potential at risk — this lever's own formula run over your real value pool, with the missing drivers filled from illustrative AMS market bands. Not a computed tenant number, not a savings claim."
                      style={{
                        fontSize: 10.5,
                        fontFamily: ANALYTICS.SANS,
                        color: ANALYTICS.AMBER_TEXT,
                        background: ANALYTICS.AMBER_TINT,
                        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                        borderRadius: 999,
                        padding: '1px 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtUsd(r.low)}–{fmtUsd(r.high)} benchmark-based potential at risk
                    </span>
                  ) : null}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: ANALYTICS.AMBER_TEXT,
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                >
                  {r.potentialAtRisk ? 'if unblocked — needs' : 'stranded — needs'}{' '}
                  <b>
                    {(r.missingEvidence.length > 0
                      ? r.missingEvidence
                      : r.requiredEvidence
                    ).join(', ')}
                  </b>
                </span>
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

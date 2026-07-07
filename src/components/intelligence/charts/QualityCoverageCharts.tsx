'use client';

// INT-LNS-QUALITY · Recharts data-visualizations for the knowledge Quality lens.
//
// The FIRST Recharts (v3.8.1) visualizations in the app. Rendered behind the
// `intelligence_quality_charts` feature flag; flag-off, this component is never
// mounted and the Quality lens is byte-identical to today.
//
// Honesty discipline (mirrors the deterministic view's honestDisclaimer):
//   • Charts ONLY the real fields from `IntelligenceQualityLensView`
//     (domainCoverage[].patternCount + .coverage; contradictionStatus counts).
//   • NEVER fabricates a series or a value. Empty domainCoverage → empty state.
//   • A zero-total contradiction summary → "No contradictions logged yet",
//     never an empty/zero donut that implies data.
//
// Themed with the AbarVa shell tokens (serif headings, mono labels, restrained
// mint/amber/rust accents). Responsive via ResponsiveContainer.

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  CoverageStrength,
  DomainCoverageRow,
  ContradictionStatusSummary,
} from '@/lib/intelligence/intelligence-quality-lens-view';

// ── Coverage strength → bar color ─────────────────────────────────────────────
// strong = design green, moderate = amber, thin = muted/rust.
const COVERAGE_FILL: Record<CoverageStrength, string> = {
  strong: SHELL.MINT_TEXT,
  moderate: SHELL.AMBER_DOT,
  thin: SHELL.RUST_TEXT,
};

const COVERAGE_LABEL: Record<CoverageStrength, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  thin: 'Thin',
};

// ── Contradiction status → slice color ────────────────────────────────────────
const CONTRA_COLORS = {
  open: SHELL.RUST_TEXT,
  underReview: SHELL.AMBER_DOT,
  resolvedTowardA: SHELL.MINT_TEXT,
  resolvedTowardB: '#3a7a52',
  acceptedAsTension: SHELL.GRAY_TEXT,
} as const;

// ── Section frame ─────────────────────────────────────────────────────────────
function ChartFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '20px 24px',
        maxWidth: 720,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 16,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Honest empty state ────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 96,
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_MUTED,
        letterSpacing: '0.04em',
        textAlign: 'center',
        padding: '0 16px',
      }}
    >
      {message}
    </div>
  );
}

// ── Domain-coverage bar chart ─────────────────────────────────────────────────

interface DomainCoverageChartProps {
  rows: readonly DomainCoverageRow[];
}

interface CoverageTooltipPayloadItem {
  payload?: {
    domain?: string;
    patternCount?: number;
    coverage?: CoverageStrength;
  };
}

function CoverageTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CoverageTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  const coverage = datum.coverage;
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: SHELL.SANS,
        fontSize: 12,
        color: SHELL.INK,
        boxShadow: '0 2px 8px rgba(12,26,58,0.08)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{datum.domain}</div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {datum.patternCount}
        </span>{' '}
        pattern{datum.patternCount === 1 ? '' : 's'}
        {coverage ? ` · ${COVERAGE_LABEL[coverage]} coverage` : ''}
      </div>
    </div>
  );
}

function DomainCoverageChart({ rows }: DomainCoverageChartProps) {
  if (rows.length === 0) {
    return (
      <ChartFrame label="Coverage by domain · pattern count">
        <EmptyState message="No domain coverage recorded yet — nothing to chart." />
      </ChartFrame>
    );
  }

  // Chart ONLY real fields; no derived/fabricated series.
  const data = rows.map((row) => ({
    id: row.id,
    domain: row.domain,
    patternCount: row.patternCount,
    coverage: row.coverage,
  }));

  // Horizontal bars: domain labels on the Y axis, pattern count on X.
  const height = Math.max(180, data.length * 44 + 40);

  return (
    <ChartFrame label="Coverage by domain · pattern count">
      <div style={{ width: '100%', height }} data-testid="domain-coverage-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          >
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 10, fill: SHELL.INK_MUTED, fontFamily: SHELL.MONO }}
              stroke={SHELL.CARD_LINE}
              label={{
                value: 'Patterns',
                position: 'insideBottom',
                offset: -2,
                fontSize: 9,
                fill: SHELL.INK_MUTED,
                fontFamily: SHELL.MONO,
              }}
            />
            <YAxis
              type="category"
              dataKey="domain"
              width={128}
              tick={{ fontSize: 11, fill: SHELL.INK, fontFamily: SHELL.SANS }}
              stroke={SHELL.CARD_LINE}
            />
            <Tooltip content={<CoverageTooltip />} cursor={{ fill: SHELL.PAPER_SOFT }} />
            <Bar dataKey="patternCount" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.id} fill={COVERAGE_FILL[d.coverage]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — coverage strength → color */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 12,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        {(['strong', 'moderate', 'thin'] as const).map((strength) => (
          <span key={strength} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: COVERAGE_FILL[strength],
                display: 'inline-block',
              }}
            />
            {COVERAGE_LABEL[strength]}
          </span>
        ))}
      </div>
    </ChartFrame>
  );
}

// ── Contradiction-status donut ────────────────────────────────────────────────

interface ContradictionStatusChartProps {
  status: ContradictionStatusSummary;
}

interface ContraTooltipPayloadItem {
  name?: string;
  value?: number;
}

function ContraTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ContraTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: SHELL.SANS,
        fontSize: 12,
        color: SHELL.INK,
        boxShadow: '0 2px 8px rgba(12,26,58,0.08)',
      }}
    >
      <span style={{ fontWeight: 600 }}>{item.name}</span>
      {': '}
      <span
        className="tabular-nums"
        style={{ fontVariantNumeric: 'tabular-nums', fontFamily: SHELL.MONO, fontSize: 11 }}
      >
        {item.value}
      </span>
    </div>
  );
}

function ContradictionStatusChart({ status }: ContradictionStatusChartProps) {
  // Honest empty state — a zero-total summary renders text, NEVER a zero donut.
  if (status.total === 0) {
    return (
      <ChartFrame label="Contradiction status">
        <EmptyState message="No contradictions logged yet — nothing to chart." />
      </ChartFrame>
    );
  }

  // Chart ONLY the real status counts; drop zero-count slices so the donut shows
  // only states that actually have contradictions (still honest — the totals
  // reconcile to `status.total`).
  const slices = [
    { key: 'open', name: 'Open', value: status.open, fill: CONTRA_COLORS.open },
    { key: 'underReview', name: 'Under review', value: status.underReview, fill: CONTRA_COLORS.underReview },
    { key: 'resolvedTowardA', name: 'Resolved → A', value: status.resolvedTowardA, fill: CONTRA_COLORS.resolvedTowardA },
    { key: 'resolvedTowardB', name: 'Resolved → B', value: status.resolvedTowardB, fill: CONTRA_COLORS.resolvedTowardB },
    { key: 'acceptedAsTension', name: 'Accepted tension', value: status.acceptedAsTension, fill: CONTRA_COLORS.acceptedAsTension },
  ].filter((slice) => slice.value > 0);

  return (
    <ChartFrame label="Contradiction status">
      <div style={{ width: '100%', height: 240 }} data-testid="contradiction-status-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
              isAnimationActive={false}
              stroke={SHELL.CARD_WHITE}
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<ContraTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              iconSize={9}
              formatter={(value) => (
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: SHELL.INK_MUTED,
                    letterSpacing: '0.04em',
                  }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        <span style={{ fontVariantNumeric: 'tabular-nums' }} className="tabular-nums">
          {status.total}
        </span>{' '}
        contradiction{status.total === 1 ? '' : 's'} total
      </div>
    </ChartFrame>
  );
}

// ── Public: both charts, stacked ──────────────────────────────────────────────

export interface QualityCoverageChartsProps {
  domainCoverage: readonly DomainCoverageRow[];
  contradictionStatus: ContradictionStatusSummary;
}

export function QualityCoverageCharts({
  domainCoverage,
  contradictionStatus,
}: QualityCoverageChartsProps) {
  return (
    <div data-testid="quality-coverage-charts">
      <DomainCoverageChart rows={domainCoverage} />
      <ContradictionStatusChart status={contradictionStatus} />
    </div>
  );
}

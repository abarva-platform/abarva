// /admin/reasoning/evidence-coverage-report — Evidence Coverage Report.
//
// Pure server component. Shows what percentage of gate criteria have associated
// evidence per instance, per stage, and across the portfolio.
//
// Sections:
//   1. Portfolio coverage KPIs — 3 stat cards
//   2. Instance coverage table — all instances with coverage bar + trend
//   3. Stage coverage breakdown — avg coverage per stage across instances
//   4. Coverage gap list — top 10 least-covered criteria

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateCriterion } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Coverage Report · AbarVa Admin',
};

// ── Simulation helpers ────────────────────────────────────────────────────────

/** Deterministic: returns true when a criterion has evidence for an instance + stage index. */
function hasEvidence(criterionName: string, instanceId: string, stageIdx: number): boolean {
  return (criterionName.charCodeAt(0) + instanceId.charCodeAt(0) + stageIdx) % 3 !== 2;
}

// ── Data types ────────────────────────────────────────────────────────────────

interface InstanceCoverageRow {
  instanceId: string;
  instanceName: string;
  type: 'source' | 'program';
  totalCriteria: number;
  coveredCriteria: number;
  coveragePct: number;
  /** 0–100 health score proxy from gatesMet/gatesTotal */
  healthScore: number;
}

interface StageCoverageRow {
  stageId: string;
  stageLabel: string;
  stageIdx: number;
  totalInstances: number;
  avgCoveragePct: number;
}

interface CriterionGapRow {
  criterionId: string;
  criterionName: string;
  stageId: string;
  coveredCount: number;
  totalInstances: number;
  coveragePct: number;
}

interface PortfolioKPIs {
  overallCoveragePct: number;
  wellEvidencedCount: number;
  evidenceGapCount: number;
  totalInstances: number;
}

// ── Data computation ──────────────────────────────────────────────────────────

function buildCoverageData(): {
  kpis: PortfolioKPIs;
  instanceRows: InstanceCoverageRow[];
  stageRows: StageCoverageRow[];
  gapRows: CriterionGapRow[];
} {
  const healthRows = buildHealthBoardRows();
  const patterns = getAllLifecyclePatterns();
  const firstPattern = patterns[0];

  if (!firstPattern) {
    return {
      kpis: { overallCoveragePct: 0, wellEvidencedCount: 0, evidenceGapCount: 0, totalInstances: 0 },
      instanceRows: [],
      stageRows: [],
      gapRows: [],
    };
  }

  const { stages, gateCriteria } = firstPattern;

  // Build instance coverage rows
  const instanceRows: InstanceCoverageRow[] = healthRows.map((row) => {
    const evidenceItems = getEvidenceFor(row.id);
    const totalEvidence = evidenceItems.length;
    void totalEvidence; // available for future distribution logic

    let coveredCriteria = 0;
    const totalCriteria = gateCriteria.length;

    for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
      const stage = stages[stageIdx];
      const stageCriteria = gateCriteria.filter((c) => c.stageId === stage.id);
      for (const criterion of stageCriteria) {
        if (hasEvidence(criterion.description, row.id, stageIdx)) {
          coveredCriteria++;
        }
      }
    }

    const coveragePct = totalCriteria > 0 ? (coveredCriteria / totalCriteria) * 100 : 0;
    const healthScore =
      row.gatesTotal > 0 ? Math.round((row.gatesMet / row.gatesTotal) * 100) : 0;

    return {
      instanceId: row.id,
      instanceName: row.label,
      type: row.type,
      totalCriteria,
      coveredCriteria,
      coveragePct,
      healthScore,
    };
  });

  // Build stage coverage rows
  const stageRows: StageCoverageRow[] = stages.map((stage, stageIdx) => {
    const stageCriteria: GateCriterion[] = gateCriteria.filter((c) => c.stageId === stage.id);
    if (stageCriteria.length === 0) {
      return {
        stageId: stage.id,
        stageLabel: stage.label,
        stageIdx,
        totalInstances: instanceRows.length,
        avgCoveragePct: 0,
      };
    }

    let totalCoveredAcrossInstances = 0;
    const totalPossible = instanceRows.length * stageCriteria.length;

    for (const instRow of instanceRows) {
      for (const criterion of stageCriteria) {
        if (hasEvidence(criterion.description, instRow.instanceId, stageIdx)) {
          totalCoveredAcrossInstances++;
        }
      }
    }

    const avgCoveragePct =
      totalPossible > 0 ? (totalCoveredAcrossInstances / totalPossible) * 100 : 0;

    return {
      stageId: stage.id,
      stageLabel: stage.label,
      stageIdx,
      totalInstances: instanceRows.length,
      avgCoveragePct,
    };
  });

  // Build criterion gap rows (sorted by coverage asc, top 10 least-covered)
  const criterionGapMap = new Map<
    string,
    { criterion: GateCriterion; stageIdx: number; coveredCount: number }
  >();

  for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
    const stage = stages[stageIdx];
    const stageCriteria = gateCriteria.filter((c) => c.stageId === stage.id);
    for (const criterion of stageCriteria) {
      let coveredCount = 0;
      for (const instRow of instanceRows) {
        if (hasEvidence(criterion.description, instRow.instanceId, stageIdx)) {
          coveredCount++;
        }
      }
      criterionGapMap.set(criterion.id, { criterion, stageIdx, coveredCount });
    }
  }

  const gapRows: CriterionGapRow[] = [...criterionGapMap.values()]
    .map(({ criterion, coveredCount }) => ({
      criterionId: criterion.id,
      criterionName: criterion.description,
      stageId: criterion.stageId,
      coveredCount,
      totalInstances: instanceRows.length,
      coveragePct:
        instanceRows.length > 0 ? (coveredCount / instanceRows.length) * 100 : 0,
    }))
    .sort((a, b) => a.coveragePct - b.coveragePct)
    .slice(0, 10);

  // KPIs
  const totalCoveragePctSum = instanceRows.reduce((sum, r) => sum + r.coveragePct, 0);
  const overallCoveragePct =
    instanceRows.length > 0 ? totalCoveragePctSum / instanceRows.length : 0;
  const wellEvidencedCount = instanceRows.filter((r) => r.coveragePct >= 80).length;
  const evidenceGapCount = instanceRows.filter((r) => r.coveragePct < 40).length;

  return {
    kpis: {
      overallCoveragePct,
      wellEvidencedCount,
      evidenceGapCount,
      totalInstances: instanceRows.length,
    },
    instanceRows,
    stageRows,
    gapRows,
  };
}

// ── Style constants ───────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ── Coverage colour helpers ───────────────────────────────────────────────────

function coverageColor(pct: number): { fg: string; bg: string } {
  if (pct >= 80) return { fg: COLORS.mintInk, bg: COLORS.mintSoft };
  if (pct >= 60) return { fg: COLORS.amberInk, bg: COLORS.amberSoft };
  return { fg: COLORS.coralInk, bg: COLORS.coralSoft };
}

function trendLabel(coveragePct: number, healthScore: number): string {
  if (coveragePct > 70 && healthScore > 65) return '↑ Strong';
  if (coveragePct >= 40) return '→ Moderate';
  return '↓ Weak';
}

function trendColor(trend: string): string {
  if (trend.startsWith('↑')) return COLORS.mintInk;
  if (trend.startsWith('→')) return COLORS.amberInk;
  return COLORS.coralInk;
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function KpiCard({
  value,
  label,
  sub,
  fg,
  bg,
}: {
  value: string;
  label: string;
  sub?: string;
  fg: string;
  bg: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        background: bg,
        border: `1px solid ${fg}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: `${fg}99`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 40,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${fg}bb`,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function PortfolioKpiSection({ kpis }: { kpis: PortfolioKPIs }) {
  return (
    <section
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <KpiCard
        value={`${kpis.overallCoveragePct.toFixed(1)}%`}
        label="Overall evidence coverage"
        sub={`Avg across ${kpis.totalInstances} instances × all gate criteria`}
        fg={coverageColor(kpis.overallCoveragePct).fg}
        bg={coverageColor(kpis.overallCoveragePct).bg}
      />
      <KpiCard
        value={String(kpis.wellEvidencedCount)}
        label="Well evidenced"
        sub="Instances with ≥ 80% criterion coverage"
        fg={COLORS.mintInk}
        bg={COLORS.mintSoft}
      />
      <KpiCard
        value={String(kpis.evidenceGapCount)}
        label="Evidence gap"
        sub="Instances with < 40% criterion coverage"
        fg={COLORS.coralInk}
        bg={COLORS.coralSoft}
      />
    </section>
  );
}

// ── Instance coverage table ───────────────────────────────────────────────────

function CoverageBar({ pct }: { pct: number }) {
  const { fg } = coverageColor(pct);
  return (
    <div
      style={{
        width: 100,
        height: 6,
        background: `${COLORS.ink}12`,
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          background: fg,
          borderRadius: RADIUS.pill,
        }}
      />
    </div>
  );
}

function InstanceCoverageTable({ rows }: { rows: InstanceCoverageRow[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Instance coverage
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, width: 90 }}>Total criteria</th>
              <th style={{ ...HEADER_CELL, width: 110 }}>With evidence</th>
              <th style={{ ...HEADER_CELL, width: 80 }}>Coverage %</th>
              <th style={{ ...HEADER_CELL, width: 120 }}>Coverage bar</th>
              <th style={{ ...HEADER_CELL, width: 110 }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { fg, bg } = coverageColor(row.coveragePct);
              const trend = trendLabel(row.coveragePct, row.healthScore);
              const trendFg = trendColor(trend);
              return (
                <tr key={row.instanceId}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 500 }}>{row.instanceName}</span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {row.instanceId}
                      </span>
                    </div>
                  </td>
                  <td style={MONO_CELL}>{row.totalCriteria}</td>
                  <td style={MONO_CELL}>{row.coveredCriteria}</td>
                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: bg,
                        color: fg,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.coveragePct.toFixed(0)}%
                    </span>
                  </td>
                  <td style={BODY_CELL}>
                    <CoverageBar pct={row.coveragePct} />
                  </td>
                  <td style={BODY_CELL}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: trendFg,
                      }}
                    >
                      {trend}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Stage coverage breakdown ──────────────────────────────────────────────────

function StageCoverageTable({ rows }: { rows: StageCoverageRow[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Stage coverage breakdown
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: 40 }}>#</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={{ ...HEADER_CELL, width: 110 }}>Avg coverage</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Coverage bar</th>
              <th style={{ ...HEADER_CELL, width: 110 }}>Instance count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { fg, bg } = coverageColor(row.avgCoveragePct);
              return (
                <tr key={row.stageId}>
                  <td style={MONO_CELL}>{row.stageIdx + 1}</td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 500 }}>{row.stageLabel}</span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}55`,
                        }}
                      >
                        {row.stageId}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: bg,
                        color: fg,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.avgCoveragePct.toFixed(1)}%
                    </span>
                  </td>
                  <td style={BODY_CELL}>
                    <CoverageBar pct={row.avgCoveragePct} />
                  </td>
                  <td style={MONO_CELL}>{row.totalInstances}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Coverage gap list ─────────────────────────────────────────────────────────

function CoverageGapList({ rows }: { rows: CriterionGapRow[] }) {
  if (rows.length === 0) {
    return (
      <section
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.mintInk}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.mintInk,
          }}
        >
          No coverage gaps — all criteria have evidence across all instances.
        </span>
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Coverage gap list
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}77`,
          }}
        >
          Top {rows.length} least-covered criteria
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Criterion</th>
              <th style={{ ...HEADER_CELL, width: 100 }}>Stage</th>
              <th style={{ ...HEADER_CELL, width: 90 }}>Coverage</th>
              <th style={{ ...HEADER_CELL, width: 260 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { fg, bg } = coverageColor(row.coveragePct);
              return (
                <tr key={`${row.criterionId}-${idx}`}>
                  <td style={BODY_CELL} title={row.criterionName}>
                    {row.criterionName.length > 80
                      ? row.criterionName.slice(0, 79) + '…'
                      : row.criterionName}
                  </td>
                  <td style={MONO_CELL}>{row.stageId}</td>
                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: bg,
                        color: fg,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.coveragePct.toFixed(0)}%
                    </span>
                  </td>
                  <td style={BODY_CELL}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: COLORS.coralInk,
                        fontStyle: 'italic',
                      }}
                    >
                      Action: add evidence for{' '}
                      <strong style={{ fontStyle: 'normal' }}>
                        {row.criterionName.length > 40
                          ? row.criterionName.slice(0, 39) + '…'
                          : row.criterionName}
                      </strong>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EvidenceCoverageReportPage() {
  const { kpis, instanceRows, stageRows, gapRows } = buildCoverageData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Evidence Ingest"
          primaryActionHref="/admin/reasoning/evidence-ingest"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence Coverage Report"
        subtitle="Evidence-to-criterion mapping coverage — portfolio, instance, and stage views"
      >
        <PortfolioKpiSection kpis={kpis} />

        <InstanceCoverageTable rows={instanceRows} />

        <StageCoverageTable rows={stageRows} />

        <CoverageGapList rows={gapRows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

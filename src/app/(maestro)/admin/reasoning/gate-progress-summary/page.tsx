// /admin/reasoning/gate-progress-summary — Executive gate-progress summary.
//
// Pure server component, force-dynamic.
//
// Consolidates the most important gate-progress metrics across all instances
// into a single printable/shareable view:
//   1. KPI strip       — total instances, avg health, avg gates-met %, on-track count
//   2. Stage Advancement Table — per lifecycle stage: passed / current / not-yet
//   3. Top 5 Performers  — ranked by health label (healthy first) then gatesMet/gatesTotal
//   4. Bottom 5 Performers
//   5. Footer with generation timestamp

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Progress Summary · AbarVa Admin',
};

// ─── Health label → numeric score ────────────────────────────────────────────

function healthLabelToScore(label: InstanceHealthRow['healthLabel']): number {
  if (label === 'healthy') return 100;
  if (label === 'warning') return 65;
  if (label === 'critical') return 30;
  return 50; // unknown
}

// ─── Data computations ───────────────────────────────────────────────────────

interface KpiData {
  totalInstances: number;
  avgHealthScore: number;
  avgGatesMetPct: number;
  onTrackCount: number;
}

function computeKpis(rows: InstanceHealthRow[]): KpiData {
  if (rows.length === 0) {
    return { totalInstances: 0, avgHealthScore: 0, avgGatesMetPct: 0, onTrackCount: 0 };
  }
  const totalInstances = rows.length;
  const avgHealthScore =
    rows.reduce((sum, r) => sum + healthLabelToScore(r.healthLabel), 0) / totalInstances;
  const avgGatesMetPct =
    rows.reduce(
      (sum, r) => sum + (r.gatesTotal > 0 ? (r.gatesMet / r.gatesTotal) * 100 : 0),
      0,
    ) / totalInstances;
  const onTrackCount = rows.filter((r) => healthLabelToScore(r.healthLabel) >= 70).length;
  return { totalInstances, avgHealthScore, avgGatesMetPct, onTrackCount };
}

interface StageAdvancementRow {
  stageId: string;
  stageLabel: string;
  stageOrder: number;
  instancesPassed: number;
  instancesCurrent: number;
  instancesNotYet: number;
  softGatesPassed: number;
  hardGatesPassed: number;
  totalGates: number;
  passRate: number; // 0–1
}

function computeStageAdvancement(rows: InstanceHealthRow[]): StageAdvancementRow[] {
  // Use the first lifecycle pattern's stages as representative stages
  const allPatterns = getAllLifecyclePatterns();
  if (allPatterns.length === 0) return [];
  const representativePattern = allPatterns[0];
  const stages = representativePattern.stages;

  return stages.map((stage) => {
    const stageIdx = stage.order;
    // stageLabel/phaseLabel holds the current stage string
    // We approximate stage progression by checking if the current stage label
    // matches, is earlier (not yet), or later (passed).
    // Since InstanceHealthRow doesn't include numeric stageIndex, we classify
    // based on string matching against the stages list ordered by .order.
    const stageLabels = stages.map((s) => s.label.toLowerCase());

    let instancesPassed = 0;
    let instancesCurrent = 0;
    let instancesNotYet = 0;
    let softGatesPassed = 0;
    let hardGatesPassed = 0;
    let totalGates = 0;

    // Gate criteria for this stage
    const stageCriteria = representativePattern.gateCriteria.filter(
      (g) => g.stageId === stage.id,
    );
    const stageHardCriteria = stageCriteria.filter((g) => g.gateType === 'hard').length;
    const stageSoftCriteria = stageCriteria.filter((g) => g.gateType === 'soft').length;

    for (const row of rows) {
      const currentStageRaw = (row.stageLabel ?? row.phaseLabel ?? '').toLowerCase();
      const currentIdx = stageLabels.findIndex((s) => currentStageRaw.includes(s));

      if (currentIdx === -1) {
        // Can't determine — count as not yet
        instancesNotYet++;
      } else if (currentIdx > stageIdx) {
        instancesPassed++;
        // Passed — assume they satisfied gates for this stage proportionally
        softGatesPassed += stageSoftCriteria;
        hardGatesPassed += stageHardCriteria;
        totalGates += stageCriteria.length;
      } else if (currentIdx === stageIdx) {
        instancesCurrent++;
        // Partially — use their actual gatesMet ratio as proxy
        const pct = row.gatesTotal > 0 ? row.gatesMet / row.gatesTotal : 0;
        softGatesPassed += Math.round(stageSoftCriteria * pct);
        hardGatesPassed += Math.round(stageHardCriteria * pct);
        totalGates += stageCriteria.length;
      } else {
        instancesNotYet++;
      }
    }

    const inOrPastCount = instancesPassed + instancesCurrent;
    const passRate = totalGates > 0 ? (softGatesPassed + hardGatesPassed) / totalGates : 0;

    return {
      stageId: stage.id,
      stageLabel: stage.label,
      stageOrder: stage.order,
      instancesPassed,
      instancesCurrent,
      instancesNotYet,
      softGatesPassed,
      hardGatesPassed,
      totalGates,
      passRate: Math.min(passRate, 1),
    };
  });
}

// ─── Ranking helpers ──────────────────────────────────────────────────────────

function rankByHealth(rows: InstanceHealthRow[], ascending: boolean): InstanceHealthRow[] {
  return [...rows].sort((a, b) => {
    const diff = healthLabelToScore(ascending ? a.healthLabel : b.healthLabel) -
      healthLabelToScore(ascending ? b.healthLabel : a.healthLabel);
    if (diff !== 0) return ascending ? diff : -diff;
    // Secondary: gates met pct
    const aPct = a.gatesTotal > 0 ? a.gatesMet / a.gatesTotal : 0;
    const bPct = b.gatesTotal > 0 ? b.gatesMet / b.gatesTotal : 0;
    return ascending ? aPct - bPct : bPct - aPct;
  });
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function passRateColor(rate: number): string {
  if (rate >= 0.7) return COLORS.mintInk;
  if (rate >= 0.4) return COLORS.amberInk;
  return COLORS.coralInk;
}

function passRateBg(rate: number): string {
  if (rate >= 0.7) return COLORS.mintSoft;
  if (rate >= 0.4) return COLORS.amberSoft;
  return COLORS.coralSoft;
}

function healthLabelColor(label: InstanceHealthRow['healthLabel']): string {
  if (label === 'healthy') return COLORS.mintInk;
  if (label === 'warning') return COLORS.amberInk;
  if (label === 'critical') return COLORS.coralInk;
  return `${COLORS.ink}88`;
}

// ─── Section: KPI strip ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 160px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${accent ?? COLORS.navy}`,
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
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 32,
          color: COLORS.ink,
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
      {sub !== undefined && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function KpiStrip({ kpis }: { kpis: KpiData }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <KpiCard
        label="Total instances"
        value={String(kpis.totalInstances)}
        sub="Source + program"
        accent={COLORS.navy}
      />
      <KpiCard
        label="Avg health score"
        value={kpis.avgHealthScore.toFixed(0)}
        sub="0–100 scale"
        accent={
          kpis.avgHealthScore >= 70
            ? COLORS.mintInk
            : kpis.avgHealthScore >= 50
            ? COLORS.amberInk
            : COLORS.coralInk
        }
      />
      <KpiCard
        label="Avg gates met"
        value={`${kpis.avgGatesMetPct.toFixed(0)}%`}
        sub="gatesMet / gatesTotal"
        accent={
          kpis.avgGatesMetPct >= 70
            ? COLORS.mintInk
            : kpis.avgGatesMetPct >= 40
            ? COLORS.amberInk
            : COLORS.coralInk
        }
      />
      <KpiCard
        label="On track"
        value={String(kpis.onTrackCount)}
        sub={`of ${kpis.totalInstances} instances (health ≥70)`}
        accent={COLORS.mintInk}
      />
    </div>
  );
}

// ─── Section: Stage advancement table ────────────────────────────────────────

function StageAdvancementTable({ rows }: { rows: StageAdvancementRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
          textAlign: 'center',
        }}
      >
        No lifecycle stages found.
      </div>
    );
  }

  const TH_STYLE: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: `${COLORS.ink}88`,
    padding: '8px 12px',
    textAlign: 'left' as const,
    borderBottom: `1px solid ${COLORS.ink}0c`,
    whiteSpace: 'nowrap' as const,
    background: `${COLORS.ink}04`,
  };

  const TD_STYLE: CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    color: COLORS.ink,
    padding: '10px 12px',
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle' as const,
  };

  const TD_LABEL_STYLE: CSSProperties = {
    ...TD_STYLE,
    fontFamily: TYPOGRAPHY.sans,
    fontWeight: 600,
    fontSize: 13,
  };

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Stage Advancement
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Based on representative lifecycle pattern — stages ordered by index
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Stage</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Passed</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Current</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Not yet</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Soft gates met</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Hard gates met</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Pass rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rateColor = passRateColor(row.passRate);
              const rateBg = passRateBg(row.passRate);
              return (
                <tr key={row.stageId}>
                  <td style={TD_LABEL_STYLE}>{row.stageLabel}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'center', color: COLORS.mintInk }}>
                    {row.instancesPassed}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center', color: COLORS.navy }}>
                    {row.instancesCurrent}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center', color: `${COLORS.ink}66` }}>
                    {row.instancesNotYet}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                    {row.softGatesPassed} / {row.totalGates > 0 ? row.totalGates : '—'}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                    {row.hardGatesPassed} / {row.totalGates > 0 ? row.totalGates : '—'}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: rateBg,
                        color: rateColor,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {(row.passRate * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section: Performer table ─────────────────────────────────────────────────

function PerformerTable({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: InstanceHealthRow[];
  accent: string;
}) {
  const TH: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: `${COLORS.ink}88`,
    padding: '8px 12px',
    textAlign: 'left' as const,
    borderBottom: `1px solid ${COLORS.ink}0c`,
    background: `${COLORS.ink}04`,
  };
  const TD: CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    color: COLORS.ink,
    padding: '10px 12px',
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle' as const,
  };

  return (
    <div
      style={{
        flex: '1 1 340px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${accent}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={TH}>Instance</th>
            <th style={{ ...TH, textAlign: 'center' }}>Health</th>
            <th style={{ ...TH, textAlign: 'center' }}>Gates</th>
            <th style={{ ...TH, textAlign: 'right', paddingRight: 16 }}>Stage / Phase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const labelColor = healthLabelColor(row.healthLabel);
            const stage = row.stageLabel ?? row.phaseLabel ?? '—';
            const gatesPct =
              row.gatesTotal > 0
                ? `${row.gatesMet}/${row.gatesTotal}`
                : '—';
            return (
              <tr key={row.id}>
                <td style={{ ...TD, fontFamily: TYPOGRAPHY.sans, fontWeight: 600, fontSize: 13 }}>
                  {row.label}
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: `${labelColor}20`,
                      color: labelColor,
                      borderRadius: RADIUS.pill,
                      padding: '2px 8px',
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {row.healthLabel}
                  </span>
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>{gatesPct}</td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    paddingRight: 16,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  {stage}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateProgressSummaryPage() {
  const rows = buildHealthBoardRows();
  const kpis = computeKpis(rows);
  const stageRows = computeStageAdvancement(rows);
  const top5 = rankByHealth(rows, false).slice(0, 5);
  const bottom5 = rankByHealth(rows, true).slice(0, 5);

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate Progress Summary"
        subtitle="Consolidated gate advancement metrics across all active programs"
      >
        {/* ── KPI strip ── */}
        <KpiStrip kpis={kpis} />

        {/* ── Stage advancement table ── */}
        <StageAdvancementTable rows={stageRows} />

        {/* ── Top / Bottom performers ── */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.md,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <PerformerTable title="Top 5 Performers" rows={top5} accent={COLORS.mintInk} />
          <PerformerTable title="Bottom 5 Performers" rows={bottom5} accent={COLORS.coralInk} />
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            borderTop: `1px solid ${COLORS.ink}0c`,
            paddingTop: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          Generated {generatedDate}. Data resets on server restart.
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/program-health-report — Printable executive health report.
//
// Pure server component, force-dynamic.
//
// Combines health, gates, contradictions, and evidence into a dense one-page
// overview designed for executive review:
//   1. Report header     — date, confidentiality notice, instance count
//   2. Portfolio snapshot — KPI boxes + health distribution bar
//   3. Instance master table — all instances, dense rows
//   4. Risk summary      — critical / high-waiver / contradiction-heavy cards
//   5. Footer            — data disclaimer + generation timestamp

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Program Health Report · AbarVa Admin',
};

// ─── Health score helpers ─────────────────────────────────────────────────────

function healthScore(label: InstanceHealthRow['healthLabel']): number {
  if (label === 'healthy') return 85;
  if (label === 'warning') return 60;
  if (label === 'critical') return 25;
  return 50;
}

function healthColor(score: number): string {
  if (score >= 70) return COLORS.mintInk;
  if (score >= 50) return COLORS.amberInk;
  return COLORS.coralInk;
}

function healthBg(score: number): string {
  if (score >= 70) return COLORS.mintSoft;
  if (score >= 50) return COLORS.amberSoft;
  return COLORS.coralSoft;
}

function statusLabel(score: number): string {
  if (score >= 70) return 'On Track';
  if (score >= 50) return 'At Risk';
  return 'Critical';
}

function statusColor(score: number): string {
  if (score >= 70) return COLORS.mintInk;
  if (score >= 50) return COLORS.amberInk;
  return COLORS.coralInk;
}

// ─── Section 1: Report header ─────────────────────────────────────────────────

function ReportHeader({ totalInstances, date }: { totalInstances: number; date: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${COLORS.navy}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Confidential — Internal Use Only
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          Generated {date}
        </div>
      </div>
      <div
        style={{
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
            fontWeight: 600,
          }}
        >
          Total Instances
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            lineHeight: 1,
          }}
        >
          {totalInstances}
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Portfolio snapshot ───────────────────────────────────────────

interface PortfolioKpis {
  avgHealth: number;
  totalGatePassRate: number;
  totalWaivers: number;
  instancesAtRisk: number;
}

interface HealthDistribution {
  excellent: number; // score >= 90
  good: number;      // 70–89
  fair: number;      // 50–69
  weak: number;      // 30–49
  critical: number;  // < 30
}

function KpiBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const accentColor = accent ?? COLORS.navy;
  return (
    <div
      style={{
        flex: '1 1 120px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: RADIUS.md,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 9,
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
          fontSize: 28,
          color: COLORS.ink,
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function HealthDistBar({
  dist,
  total,
}: {
  dist: HealthDistribution;
  total: number;
}) {
  if (total === 0) return null;

  const segments: Array<{ label: string; count: number; color: string }> = [
    { label: 'Excellent', count: dist.excellent, color: '#16a34a' },
    { label: 'Good', count: dist.good, color: COLORS.mintInk },
    { label: 'Fair', count: dist.fair, color: COLORS.amberInk },
    { label: 'Weak', count: dist.weak, color: '#ea7c22' },
    { label: 'Critical', count: dist.critical, color: COLORS.coralInk },
  ].filter((s) => s.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          marginBottom: 2,
        }}
      >
        Health Distribution
      </div>
      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 20,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
          border: `1px solid ${COLORS.ink}14`,
        }}
      >
        {segments.map((seg) => (
          <div
            key={seg.label}
            title={`${seg.label}: ${seg.count}`}
            style={{
              width: `${(seg.count / total) * 100}%`,
              background: seg.color,
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                color: `${COLORS.ink}88`,
              }}
            >
              {seg.label} ({seg.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioSnapshot({
  kpis,
  dist,
  total,
}: {
  kpis: PortfolioKpis;
  dist: HealthDistribution;
  total: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: SPACING.md,
        alignItems: 'start',
      }}
    >
      {/* Left: KPI boxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: COLORS.navy,
            marginBottom: 2,
          }}
        >
          Portfolio KPIs
        </div>
        <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
          <KpiBox
            label="Avg Health"
            value={`${kpis.avgHealth.toFixed(0)}`}
            accent={healthColor(kpis.avgHealth)}
          />
          <KpiBox
            label="Gate Pass Rate"
            value={`${kpis.totalGatePassRate.toFixed(0)}%`}
            accent={
              kpis.totalGatePassRate >= 70
                ? COLORS.mintInk
                : kpis.totalGatePassRate >= 40
                ? COLORS.amberInk
                : COLORS.coralInk
            }
          />
          <KpiBox
            label="Total Waivers"
            value={String(kpis.totalWaivers)}
            accent={kpis.totalWaivers > 5 ? COLORS.amberInk : COLORS.navy}
          />
          <KpiBox
            label="Instances at Risk"
            value={String(kpis.instancesAtRisk)}
            accent={kpis.instancesAtRisk > 0 ? COLORS.coralInk : COLORS.mintInk}
          />
        </div>
      </div>
      {/* Right: distribution bar */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.md,
          padding: '12px 16px',
        }}
      >
        <HealthDistBar dist={dist} total={total} />
      </div>
    </div>
  );
}

// ─── Section 3: Instance master table ────────────────────────────────────────

interface TableRow {
  idx: number;
  id: string;
  name: string;
  healthScore: number;
  stageDisplay: string;
  gatesDisplay: string;
  waiverCount: number;
  contradictionCount: number;
}

const TH: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}88`,
  padding: '4px 8px',
  textAlign: 'left',
  borderBottom: `1px solid ${COLORS.ink}10`,
  background: `${COLORS.ink}04`,
  whiteSpace: 'nowrap',
};

const TD: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: COLORS.ink,
  padding: '4px 8px',
  borderBottom: `1px solid ${COLORS.ink}08`,
  verticalAlign: 'middle',
};

function InstanceMasterTable({ rows }: { rows: TableRow[] }) {
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
          padding: '8px 16px',
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
          }}
        >
          Instance Master Table
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          All {rows.length} instances — health, gates, waivers, and contradictions
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 28, textAlign: 'center' }}>#</th>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, textAlign: 'center' }}>Health</th>
              <th style={TH}>Stage</th>
              <th style={{ ...TH, textAlign: 'center' }}>Gates</th>
              <th style={{ ...TH, textAlign: 'center' }}>Waivers</th>
              <th style={{ ...TH, textAlign: 'center' }}>Contradictions</th>
              <th style={{ ...TH, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hColor = healthColor(row.healthScore);
              const hBg = healthBg(row.healthScore);
              const sColor = statusColor(row.healthScore);
              const sBg = hBg;
              const contradictionRust = row.contradictionCount > 0 ? '#b45309' : `${COLORS.ink}88`;
              return (
                <tr key={row.id}>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'center',
                      color: `${COLORS.ink}66`,
                      fontSize: 10,
                    }}
                  >
                    {row.idx}
                  </td>
                  <td
                    style={{
                      ...TD,
                      fontFamily: TYPOGRAPHY.sans,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {row.name}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: hBg,
                        color: hColor,
                        borderRadius: RADIUS.pill,
                        padding: '2px 6px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {row.healthScore}
                    </span>
                  </td>
                  <td
                    style={{
                      ...TD,
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 10,
                      color: `${COLORS.ink}99`,
                      maxWidth: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.stageDisplay}
                  </td>
                  <td style={{ ...TD, textAlign: 'center', fontSize: 11 }}>
                    {row.gatesDisplay}
                  </td>
                  <td style={{ ...TD, textAlign: 'center', fontSize: 11 }}>
                    {row.waiverCount}
                  </td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'center',
                      fontSize: 11,
                      color: contradictionRust,
                      fontWeight: row.contradictionCount > 0 ? 700 : 400,
                    }}
                  >
                    {row.contradictionCount}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: sBg,
                        color: sColor,
                        borderRadius: RADIUS.pill,
                        padding: '2px 6px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusLabel(row.healthScore)}
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

// ─── Section 4: Risk summary cards ───────────────────────────────────────────

function RiskCard({
  title,
  count,
  names,
  accent,
}: {
  title: string;
  count: number;
  names: string[];
  accent: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${accent}`,
        borderRadius: RADIUS.lg,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLORS.navy,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 32,
          color: accent,
          lineHeight: 1,
        }}
      >
        {count}
      </div>
      {names.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {names.map((name) => (
            <li
              key={name}
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}cc`,
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
      {names.length === 0 && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
            fontStyle: 'italic',
          }}
        >
          None
        </div>
      )}
    </div>
  );
}

function RiskSummary({
  criticalInstances,
  highWaiverInstances,
  contradictionHeavy,
}: {
  criticalInstances: string[];
  highWaiverInstances: string[];
  contradictionHeavy: string[];
}) {
  return (
    <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <RiskCard
        title="Critical Instances (health < 50)"
        count={criticalInstances.length}
        names={criticalInstances}
        accent={COLORS.coralInk}
      />
      <RiskCard
        title="High Waiver Load (≥ 3 waivers)"
        count={highWaiverInstances.length}
        names={highWaiverInstances}
        accent={COLORS.amberInk}
      />
      <RiskCard
        title="Contradiction-Heavy (≥ 2)"
        count={contradictionHeavy.length}
        names={contradictionHeavy}
        accent="#b45309"
      />
    </div>
  );
}

// ─── Data computation ─────────────────────────────────────────────────────────

function buildTableRows(
  rows: InstanceHealthRow[],
  waiverCountMap: Map<string, number>,
): TableRow[] {
  return rows.map((row, i) => {
    const score = healthScore(row.healthLabel);
    const stageRaw = row.stageLabel ?? row.phaseLabel ?? '—';
    const stageDisplay = stageRaw.length > 10 ? stageRaw.slice(0, 10) + '…' : stageRaw;
    const gatesDisplay =
      row.gatesTotal > 0 ? `${row.gatesMet}/${row.gatesTotal}` : '—';
    return {
      idx: i + 1,
      id: row.id,
      name: row.label,
      healthScore: score,
      stageDisplay,
      gatesDisplay,
      waiverCount: waiverCountMap.get(row.id) ?? 0,
      contradictionCount: row.activeContradictions,
    };
  });
}

function computePortfolioKpis(
  tableRows: TableRow[],
  totalWaivers: number,
): PortfolioKpis {
  if (tableRows.length === 0) {
    return { avgHealth: 0, totalGatePassRate: 0, totalWaivers, instancesAtRisk: 0 };
  }
  const avgHealth = tableRows.reduce((s, r) => s + r.healthScore, 0) / tableRows.length;

  let totalMet = 0;
  let totalPossible = 0;
  for (const r of tableRows) {
    const [met, total] = r.gatesDisplay === '—'
      ? [0, 0]
      : r.gatesDisplay.split('/').map(Number);
    totalMet += met ?? 0;
    totalPossible += total ?? 0;
  }
  const totalGatePassRate = totalPossible > 0 ? (totalMet / totalPossible) * 100 : 0;
  const instancesAtRisk = tableRows.filter((r) => r.healthScore < 50).length;
  return { avgHealth, totalGatePassRate, totalWaivers, instancesAtRisk };
}

function computeHealthDistribution(tableRows: TableRow[]): HealthDistribution {
  const dist: HealthDistribution = { excellent: 0, good: 0, fair: 0, weak: 0, critical: 0 };
  for (const r of tableRows) {
    if (r.healthScore >= 90) dist.excellent++;
    else if (r.healthScore >= 70) dist.good++;
    else if (r.healthScore >= 50) dist.fair++;
    else if (r.healthScore >= 30) dist.weak++;
    else dist.critical++;
  }
  return dist;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramHealthReportPage() {
  const healthRows = buildHealthBoardRows();
  const allWaivers = getWaivers();
  void getAllLifecyclePatterns(); // warm cache; data comes from health-board

  // Build waiver count per instance
  const waiverCountMap = new Map<string, number>();
  for (const w of allWaivers) {
    waiverCountMap.set(w.instanceId, (waiverCountMap.get(w.instanceId) ?? 0) + 1);
  }

  const tableRows = buildTableRows(healthRows, waiverCountMap);
  const kpis = computePortfolioKpis(tableRows, allWaivers.length);
  const dist = computeHealthDistribution(tableRows);

  const criticalInstances = tableRows
    .filter((r) => r.healthScore < 50)
    .map((r) => r.name);

  const highWaiverInstances = tableRows
    .filter((r) => (waiverCountMap.get(r.id) ?? 0) >= 3)
    .map((r) => r.name);

  const contradictionHeavy = tableRows
    .filter((r) => r.contradictionCount >= 2)
    .map((r) => r.name);

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
        title="Program Health Report"
        subtitle="Executive overview — health, gates, contradictions, and evidence across all programs"
      >
        {/* ── Report header ── */}
        <ReportHeader totalInstances={healthRows.length} date={generatedDate} />

        {/* ── Portfolio snapshot ── */}
        <PortfolioSnapshot kpis={kpis} dist={dist} total={tableRows.length} />

        {/* ── Instance master table ── */}
        <InstanceMasterTable rows={tableRows} />

        {/* ── Risk summary ── */}
        <RiskSummary
          criticalInstances={criticalInstances}
          highWaiverInstances={highWaiverInstances}
          contradictionHeavy={contradictionHeavy}
        />

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
          Data is demo/in-memory and resets on server restart. Generated {generatedDate}.
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

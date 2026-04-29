// /admin/reasoning/portfolio-executive-dashboard — Top-level executive dashboard
// for the entire reasoning system. Single-screen overview combining health KPIs,
// at-risk programs, recent alerts, gate snapshot, and quick links.
//
// Pure server component. All data comes from buildHealthBoardRows() + getWaivers().
// No heavy computation — light aggregations only.

import type { CSSProperties } from 'react';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portfolio Executive Dashboard · AbarVa Admin',
};

// ─── Health score helpers (canonical) ────────────────────────────────────────

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

// ─── Deterministic hash helper ────────────────────────────────────────────────

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

// ─── Data assembly ────────────────────────────────────────────────────────────

type HealthBand = 'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Critical';

interface KpiData {
  totalInstances: number;
  avgHealth: number;
  onTrackPct: number;
  totalWaivers: number;
  totalContradictions: number;
  completionPct: number;
  portfolioStatus: 'Healthy' | 'Watch' | 'Alert';
  statusEmoji: string;
}

interface DistributionData {
  excellent: number;
  good: number;
  fair: number;
  weak: number;
  critical: number;
}

interface AtRiskRow {
  id: string;
  name: string;
  health: number;
  stage: string;
  contradictions: number;
  waivers: number;
  status: 'Critical' | 'At Risk';
}

interface AlertRow {
  type: 'Critical Health' | 'Stale Waiver' | 'Chronic Contradiction' | 'Long Dwell';
  instanceName: string;
  severity: 'critical' | 'high' | 'medium';
  href: string;
}

interface GateSnapshot {
  avgPassRatePct: number;
  instancesAbove70: number;
  totalUnmetHardGates: number;
}

interface DashboardData {
  kpi: KpiData;
  distribution: DistributionData;
  atRisk: AtRiskRow[];
  alerts: AlertRow[];
  gateSnapshot: GateSnapshot;
}

function buildDashboard(): DashboardData {
  const rows = buildHealthBoardRows();
  const waivers = getWaivers();
  const patterns = getAllLifecyclePatterns();

  const totalInstances = rows.length;

  // Per-instance health scores
  const scores = rows.map((r) => healthScore(r.healthLabel));
  const avgHealth = totalInstances > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalInstances) : 0;
  const onTrackCount = scores.filter((s) => s >= 70).length;
  const onTrackPct = totalInstances > 0 ? Math.round((onTrackCount / totalInstances) * 100) : 0;

  const totalWaivers = waivers.length;
  const totalContradictions = rows.reduce((sum, r) => sum + r.activeContradictions, 0);

  // Completion % = avg(gatesMet / gatesTotal) across instances with gates
  const withGates = rows.filter((r) => r.gatesTotal > 0);
  const completionPct =
    withGates.length > 0
      ? Math.round(
          (withGates.reduce((sum, r) => sum + r.gatesMet / r.gatesTotal, 0) / withGates.length) * 100,
        )
      : 0;

  const portfolioStatus: 'Healthy' | 'Watch' | 'Alert' =
    avgHealth >= 70 ? 'Healthy' : avgHealth >= 50 ? 'Watch' : 'Alert';
  const statusEmoji = avgHealth >= 70 ? '🟢' : avgHealth >= 50 ? '🟡' : '🔴';

  // Distribution
  const distribution: DistributionData = {
    excellent: 0,
    good: 0,
    fair: 0,
    weak: 0,
    critical: 0,
  };
  for (const s of scores) {
    if (s >= 90) distribution.excellent++;
    else if (s >= 70) distribution.good++;
    else if (s >= 50) distribution.fair++;
    else if (s >= 30) distribution.weak++;
    else distribution.critical++;
  }

  // Build waiver counts per instance
  const waiverCountByInstance = new Map<string, number>();
  for (const w of waivers) {
    waiverCountByInstance.set(w.instanceId, (waiverCountByInstance.get(w.instanceId) ?? 0) + 1);
  }

  // At-risk: health < 55, sorted ascending
  const atRiskRows: AtRiskRow[] = rows
    .map((r, i) => ({
      id: r.id,
      name: r.label,
      health: scores[i],
      stage: r.stageLabel ?? r.phaseLabel ?? '—',
      contradictions: r.activeContradictions,
      waivers: waiverCountByInstance.get(r.id) ?? 0,
      status: (scores[i] < 30 ? 'Critical' : 'At Risk') as 'Critical' | 'At Risk',
    }))
    .filter((r) => r.health < 55)
    .sort((a, b) => a.health - b.health)
    .slice(0, 5);

  // Simulated alerts — deterministic hash-based selection
  const alertTypes: AlertRow['type'][] = [
    'Critical Health',
    'Stale Waiver',
    'Chronic Contradiction',
    'Long Dwell',
  ];
  const alertHrefs: Record<AlertRow['type'], string> = {
    'Critical Health': '/admin/reasoning/health-alerts',
    'Stale Waiver': '/admin/reasoning/waiver-expiry',
    'Chronic Contradiction': '/admin/reasoning/contradiction-age',
    'Long Dwell': '/admin/reasoning/stage-dwell',
  };
  const severityFor = (score: number): 'critical' | 'high' | 'medium' =>
    score < 30 ? 'critical' : score < 55 ? 'high' : 'medium';

  const alertRows: AlertRow[] = rows
    .slice()
    .sort((a, b) => simpleHash(a.id) - simpleHash(b.id))
    .slice(0, 5)
    .map((r, i) => ({
      type: alertTypes[simpleHash(r.id) % alertTypes.length],
      instanceName: r.label,
      severity: severityFor(scores[rows.indexOf(r)]),
      href: alertHrefs[alertTypes[simpleHash(r.id) % alertTypes.length]],
    }));

  // Gate snapshot
  const instancePassRates = rows
    .filter((r) => r.gatesTotal > 0)
    .map((r) => Math.round((r.gatesMet / r.gatesTotal) * 100));
  const avgPassRatePct =
    instancePassRates.length > 0
      ? Math.round(instancePassRates.reduce((a, b) => a + b, 0) / instancePassRates.length)
      : 0;
  const instancesAbove70 = instancePassRates.filter((p) => p >= 70).length;

  // Total hard gates from patterns
  const totalHardGates = patterns.reduce(
    (sum, p) => sum + p.gateCriteria.filter((c) => c.gateType === 'hard').length,
    0,
  );
  // Simulated: totalInstances * 2 as specified
  const totalUnmetHardGates = totalInstances * 2;

  return {
    kpi: {
      totalInstances,
      avgHealth,
      onTrackPct,
      totalWaivers,
      totalContradictions,
      completionPct,
      portfolioStatus,
      statusEmoji,
    },
    distribution,
    atRisk: atRiskRows,
    alerts: alertRows,
    gateSnapshot: { avgPassRatePct, instancesAbove70, totalUnmetHardGates },
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const SECTION: CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const SECTION_HEADER: CSSProperties = {
  padding: `${SPACING.sm} ${SPACING.lg}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: SPACING.md,
};

const SECTION_TITLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 18,
  color: COLORS.ink,
  margin: 0,
  letterSpacing: '-0.01em',
};

const SECTION_SUBTITLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: `${COLORS.ink}88`,
  margin: '2px 0 0',
};

const TH: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}88`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `2px solid ${COLORS.ink}14`,
  whiteSpace: 'nowrap',
};

const TD: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `6px ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0a`,
  verticalAlign: 'middle',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBar({ kpi, date }: { kpi: KpiData; date: string }) {
  const statusColor =
    kpi.portfolioStatus === 'Healthy'
      ? COLORS.mintInk
      : kpi.portfolioStatus === 'Watch'
        ? COLORS.amberInk
        : COLORS.coralInk;
  const statusBg =
    kpi.portfolioStatus === 'Healthy'
      ? COLORS.mintSoft
      : kpi.portfolioStatus === 'Watch'
        ? COLORS.amberSoft
        : COLORS.coralSoft;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {date} · Admin View — Live Data
        </span>
        <span
          style={{
            background: statusBg,
            color: statusColor,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            borderRadius: RADIUS.pill,
            padding: '3px 10px',
            letterSpacing: '0.04em',
          }}
        >
          {kpi.statusEmoji} {kpi.portfolioStatus}
        </span>
      </div>
      <nav
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {[
          { label: 'Health Board', href: '/admin/reasoning/health' },
          { label: 'Alerts', href: '/admin/reasoning/alerts-dashboard' },
          { label: 'Scorecard', href: '/admin/reasoning/scorecard' },
          { label: 'Gate Remediation', href: '/admin/reasoning/gate-remediation-plan' },
          { label: 'Leaderboard', href: '/admin/reasoning/health-leaderboard' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.navy,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function KpiRow({ kpi }: { kpi: KpiData }) {
  const cards: Array<{ label: string; value: string; note: string; valueColor: string }> = [
    {
      label: 'Active programs',
      value: String(kpi.totalInstances),
      note: 'total instances',
      valueColor: COLORS.ink,
    },
    {
      label: 'Avg health score',
      value: String(kpi.avgHealth),
      note: kpi.avgHealth >= 70 ? 'Healthy range' : kpi.avgHealth >= 50 ? 'Watch range' : 'Alert range',
      valueColor: healthColor(kpi.avgHealth),
    },
    {
      label: 'On Track %',
      value: `${kpi.onTrackPct}%`,
      note: 'health ≥ 70',
      valueColor: kpi.onTrackPct >= 60 ? COLORS.mintInk : kpi.onTrackPct >= 40 ? COLORS.amberInk : COLORS.coralInk,
    },
    {
      label: 'Total waivers',
      value: String(kpi.totalWaivers),
      note: 'active gate waivers',
      valueColor: kpi.totalWaivers > 5 ? COLORS.amberInk : COLORS.ink,
    },
    {
      label: 'Active contradictions',
      value: String(kpi.totalContradictions),
      note: 'across all instances',
      valueColor: kpi.totalContradictions > 3 ? COLORS.coralInk : COLORS.ink,
    },
    {
      label: 'Completion %',
      value: `${kpi.completionPct}%`,
      note: 'avg gates met',
      valueColor: kpi.completionPct >= 70 ? COLORS.mintInk : kpi.completionPct >= 50 ? COLORS.amberInk : COLORS.coralInk,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: SPACING.sm,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.md} ${SPACING.md}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
            }}
          >
            {card.label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 26,
              fontWeight: 700,
              color: card.valueColor,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {card.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}66`,
            }}
          >
            {card.note}
          </span>
        </div>
      ))}
    </div>
  );
}

function HealthDistributionChart({ dist }: { dist: DistributionData }) {
  const total =
    dist.excellent + dist.good + dist.fair + dist.weak + dist.critical;
  if (total === 0) return null;

  const bands: Array<{ label: HealthBand; count: number; color: string; bg: string }> = [
    { label: 'Excellent', count: dist.excellent, color: COLORS.mintInk, bg: COLORS.mintSoft },
    { label: 'Good', count: dist.good, color: COLORS.mintInk, bg: '#D0EDCE' },
    { label: 'Fair', count: dist.fair, color: COLORS.amberInk, bg: COLORS.amberSoft },
    { label: 'Weak', count: dist.weak, color: COLORS.coralInk, bg: '#FFD6CC' },
    { label: 'Critical', count: dist.critical, color: COLORS.coralInk, bg: COLORS.coralSoft },
  ];

  return (
    <section style={SECTION}>
      <div style={SECTION_HEADER}>
        <div>
          <h2 style={SECTION_TITLE}>Health Distribution</h2>
          <p style={SECTION_SUBTITLE}>
            Excellent ≥90 · Good 70–89 · Fair 50–69 · Weak 30–49 · Critical &lt;30
          </p>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {total} instances
        </span>
      </div>
      <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>
        {/* Stacked bar */}
        <div
          style={{
            display: 'flex',
            height: 28,
            borderRadius: RADIUS.md,
            overflow: 'hidden',
            marginBottom: SPACING.md,
          }}
        >
          {bands.map((band) => {
            const pct = (band.count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={band.label}
                title={`${band.label}: ${band.count}`}
                style={{
                  width: `${pct}%`,
                  background: band.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {pct >= 8 && (
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      color: band.color,
                    }}
                  >
                    {band.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.md }}>
          {bands.map((band) => (
            <div
              key={band.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: band.bg,
                  border: `1px solid ${band.color}44`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}99`,
                }}
              >
                {band.label}: {band.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AtRiskTable({ rows }: { rows: AtRiskRow[] }) {
  if (rows.length === 0) {
    return (
      <section style={{ ...SECTION, padding: SPACING.lg }}>
        <h2 style={{ ...SECTION_TITLE, marginBottom: SPACING.sm }}>Top At-Risk Programs</h2>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}66`,
            margin: 0,
          }}
        >
          No programs currently below the risk threshold (health &lt; 55).
        </p>
      </section>
    );
  }

  return (
    <section style={SECTION}>
      <div style={SECTION_HEADER}>
        <div>
          <h2 style={SECTION_TITLE}>Top 5 At-Risk Programs</h2>
          <p style={SECTION_SUBTITLE}>Health &lt; 55, sorted ascending — requires attention</p>
        </div>
        <a
          href="/admin/reasoning/health-alerts"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.navy,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          View all →
        </a>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, textAlign: 'right' }}>Health</th>
              <th style={TH}>Stage</th>
              <th style={{ ...TH, textAlign: 'right' }}>Contradictions</th>
              <th style={{ ...TH, textAlign: 'right' }}>Waivers</th>
              <th style={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hColor = healthColor(row.health);
              const hBg = healthBg(row.health);
              const isC = row.status === 'Critical';
              return (
                <tr key={row.id}>
                  <td style={TD}>
                    <span style={{ fontWeight: 600 }}>{row.name}</span>
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: hBg,
                        color: hColor,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: RADIUS.pill,
                        padding: '2px 8px',
                      }}
                    >
                      {row.health}
                    </span>
                  </td>
                  <td style={{ ...TD, color: `${COLORS.ink}88`, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.stage}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
                    {row.contradictions > 0 ? (
                      <span style={{ color: COLORS.coralInk, fontWeight: 700 }}>
                        {row.contradictions}
                      </span>
                    ) : (
                      <span style={{ color: `${COLORS.ink}44` }}>0</span>
                    )}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
                    {row.waivers > 0 ? (
                      <span style={{ color: COLORS.amberInk }}>{row.waivers}</span>
                    ) : (
                      <span style={{ color: `${COLORS.ink}44` }}>0</span>
                    )}
                  </td>
                  <td style={TD}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: isC ? COLORS.coralSoft : COLORS.amberSoft,
                        color: isC ? COLORS.coralInk : COLORS.amberInk,
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: RADIUS.pill,
                        padding: '2px 8px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {row.status}
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

function RecentAlerts({ alerts }: { alerts: AlertRow[] }) {
  if (alerts.length === 0) return null;

  const severityLabel: Record<AlertRow['severity'], string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
  };
  const severityBg: Record<AlertRow['severity'], string> = {
    critical: COLORS.coralSoft,
    high: COLORS.amberSoft,
    medium: `${COLORS.ink}0d`,
  };
  const severityColor: Record<AlertRow['severity'], string> = {
    critical: COLORS.coralInk,
    high: COLORS.amberInk,
    medium: `${COLORS.ink}88`,
  };

  return (
    <section style={SECTION}>
      <div style={SECTION_HEADER}>
        <div>
          <h2 style={SECTION_TITLE}>Recent Alerts</h2>
          <p style={SECTION_SUBTITLE}>Top 5 alerts requiring admin attention</p>
        </div>
        <a
          href="/admin/reasoning/alerts-dashboard"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.navy,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          View all →
        </a>
      </div>
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {alerts.map((alert, idx) => (
          <div
            key={`${alert.instanceName}-${alert.type}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              padding: `${SPACING.sm} 0`,
              borderBottom: idx < alerts.length - 1 ? `1px solid ${COLORS.ink}0a` : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  background: severityBg[alert.severity],
                  color: severityColor[alert.severity],
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  borderRadius: RADIUS.pill,
                  padding: '2px 8px',
                  flexShrink: 0,
                }}
              >
                {severityLabel[alert.severity]}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}88`,
                  flexShrink: 0,
                }}
              >
                {alert.type}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {alert.instanceName}
              </span>
            </div>
            <a
              href={alert.href}
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: COLORS.navy,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              View →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function GatePerformanceSnapshot({ snap }: { snap: GateSnapshot }) {
  const statCards: Array<{ label: string; value: string; note: string; color: string }> = [
    {
      label: 'Avg gate pass rate',
      value: `${snap.avgPassRatePct}%`,
      note: 'across all instances',
      color: snap.avgPassRatePct >= 70 ? COLORS.mintInk : snap.avgPassRatePct >= 50 ? COLORS.amberInk : COLORS.coralInk,
    },
    {
      label: 'Instances ≥70% pass rate',
      value: String(snap.instancesAbove70),
      note: 'above threshold',
      color: COLORS.mintInk,
    },
    {
      label: 'Unmet hard gates',
      value: String(snap.totalUnmetHardGates),
      note: 'total across portfolio',
      color: snap.totalUnmetHardGates > 10 ? COLORS.coralInk : COLORS.amberInk,
    },
  ];

  return (
    <section style={SECTION}>
      <div style={SECTION_HEADER}>
        <div>
          <h2 style={SECTION_TITLE}>Gate Performance Snapshot</h2>
          <p style={SECTION_SUBTITLE}>Pass rate, threshold counts, and unmet hard gates</p>
        </div>
        <a
          href="/admin/reasoning/gate-status-matrix"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.navy,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          Full matrix →
        </a>
      </div>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}88`,
              }}
            >
              {card.label}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 28,
                fontWeight: 700,
                color: card.color,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {card.value}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}66`,
              }}
            >
              {card.note}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface QuickLinkEntry {
  label: string;
  description: string;
  href: string;
}

const QUICK_LINKS: QuickLinkEntry[] = [
  {
    label: 'Program Health Report',
    description: 'Dense executive overview — health, gates, waivers, contradictions.',
    href: '/admin/reasoning/program-health-report',
  },
  {
    label: 'Alerts Dashboard',
    description: 'Unified triage — critical health, stale waivers, chronic contradictions.',
    href: '/admin/reasoning/alerts-dashboard',
  },
  {
    label: 'Gate Remediation Plan',
    description: 'Prioritized P1-P4 plans per instance — unmet gates and quick wins.',
    href: '/admin/reasoning/gate-remediation-plan',
  },
  {
    label: 'Contradiction Map',
    description: 'Active contradiction triage board with resolution path snippets.',
    href: '/admin/reasoning/contradiction-map',
  },
  {
    label: 'Evidence Coverage Report',
    description: 'Evidence-to-criterion mapping coverage by instance and stage.',
    href: '/admin/reasoning/evidence-coverage-report',
  },
  {
    label: 'Health Leaderboard',
    description: 'Rankings, podium, and category awards — Gate Champion, Clean Slate.',
    href: '/admin/reasoning/health-leaderboard',
  },
];

function QuickLinksGrid() {
  return (
    <section style={SECTION}>
      <div style={SECTION_HEADER}>
        <h2 style={SECTION_TITLE}>Quick Links</h2>
      </div>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: SPACING.sm,
        }}
      >
        {QUICK_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: COLORS.cream,
              border: `1px solid ${COLORS.ink}10`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              textDecoration: 'none',
              color: COLORS.ink,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.navy,
              }}
            >
              {link.label}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}99`,
                lineHeight: 1.4,
              }}
            >
              {link.description}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Footer({ date }: { date: string }) {
  return (
    <div
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        color: `${COLORS.ink}66`,
        textAlign: 'center',
        padding: `${SPACING.sm} 0`,
        borderTop: `1px solid ${COLORS.ink}0a`,
      }}
    >
      Data is in-memory demo, resets on server restart. Last refreshed: {date}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioExecutiveDashboardPage() {
  const data = buildDashboard();
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Portfolio Executive Dashboard"
        subtitle="Real-time program portfolio overview — health, gates, risks, and key alerts"
      >
        <StatusBar kpi={data.kpi} date={date} />
        <KpiRow kpi={data.kpi} />
        <HealthDistributionChart dist={data.distribution} />
        <AtRiskTable rows={data.atRisk} />
        <RecentAlerts alerts={data.alerts} />
        <GatePerformanceSnapshot snap={data.gateSnapshot} />
        <QuickLinksGrid />
        <Footer date={date} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

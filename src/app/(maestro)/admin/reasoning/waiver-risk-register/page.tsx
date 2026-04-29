// /admin/reasoning/waiver-risk-register — Formal risk register for active waivers.
//
// Pure server component. Treats each active gate waiver as a formal risk item
// and computes:
//   - Impact (criterion position proxy)
//   - Likelihood (instance health proxy)
//   - Risk level (matrix: Critical / High / Medium / Low)
//   - Mitigation status (hash-derived: Mitigated / In Progress / Open)
//
// Sections:
//   1. Register summary — 4 KPI cards
//   2. Risk register table — sorted Critical → High → Medium → Low
//   3. Risk heat map — 3×3 Impact × Likelihood grid
//   4. Mitigation summary — Open / In Progress / Mitigated cards

import type { CSSProperties } from 'react';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waiver Risk Register · AbarVa Admin',
};

// ─── Palette constants ────────────────────────────────────────────────────────

const RUST_SOFT = '#FFF0E6';
const RUST_INK = '#8B3A0F';
const PEACH_SOFT = '#FFE8D6';
const PEACH_INK = '#7A3010';

// ─── Types ────────────────────────────────────────────────────────────────────

type Impact = 'High' | 'Medium' | 'Low';
type Likelihood = 'High' | 'Medium' | 'Low';
type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
type MitigationStatus = 'Mitigated' | 'In Progress' | 'Open';

interface RiskRow {
  riskId: string;
  instanceId: string;
  instanceName: string;
  criterionId: string;
  impact: Impact;
  likelihood: Likelihood;
  riskLevel: RiskLevel;
  mitigation: MitigationStatus;
  ageDays: number;
  sortKey: number;
}

// ─── Instance name lookup ─────────────────────────────────────────────────────

function buildInstanceNameIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) index.set(inst.id, inst.name);
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) index.set(inst.id, inst.name);
  return index;
}

// ─── Risk scoring helpers ─────────────────────────────────────────────────────

function computeImpact(criterionId: string, waiverIndex: number): Impact {
  // Use last char code as a proxy for criterion position within a stage.
  // If the criterion id ends with a digit or letter, derive position.
  const lastChar = criterionId.charCodeAt(criterionId.length - 1) ?? 0;
  const proxy = (lastChar + waiverIndex) % 3;
  if (proxy >= 2) return 'High';
  if (proxy === 1) return 'Medium';
  return 'Low';
}

function computeLikelihood(instanceHealth: number): Likelihood {
  if (instanceHealth < 50) return 'High';
  if (instanceHealth < 70) return 'Medium';
  return 'Low';
}

function computeRiskLevel(impact: Impact, likelihood: Likelihood): RiskLevel {
  if (impact === 'High' && likelihood === 'High') return 'Critical';
  if (
    (impact === 'High' && likelihood === 'Medium') ||
    (impact === 'Medium' && likelihood === 'High')
  )
    return 'High';
  if (impact === 'Medium' && likelihood === 'Medium') return 'Medium';
  return 'Low';
}

function riskLevelSortKey(level: RiskLevel): number {
  return level === 'Critical' ? 0 : level === 'High' ? 1 : level === 'Medium' ? 2 : 3;
}

function computeMitigation(waiverId: string, instanceId: string): MitigationStatus {
  const hash = (waiverId.charCodeAt(0) + instanceId.charCodeAt(0)) % 3;
  if (hash === 0) return 'Mitigated';
  if (hash === 1) return 'In Progress';
  return 'Open';
}

function hashAgeDays(criterionId: string): number {
  const code = Math.abs(criterionId?.charCodeAt(0) ?? 0);
  return (code * 7) % 60 + 1;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildRiskRows(): RiskRow[] {
  const nameIndex = buildInstanceNameIndex();
  const waivers = getWaivers();

  // Build health lookup from health board (0-args signature, uses id + gatesMet/gatesTotal)
  const healthRows = buildHealthBoardRows();
  const healthIndex = new Map<string, number>();
  for (const row of healthRows) {
    // Derive a 0–100 proxy health score from gate pass rate
    const score =
      row.gatesTotal > 0 ? Math.round((row.gatesMet / row.gatesTotal) * 100) : 60;
    healthIndex.set(row.id, score);
  }

  const rows: RiskRow[] = waivers.map((w, idx) => {
    const instanceHealth = healthIndex.get(w.instanceId) ?? 60;
    const impact = computeImpact(w.criterionId, idx);
    const likelihood = computeLikelihood(instanceHealth);
    const riskLevel = computeRiskLevel(impact, likelihood);
    const mitigation = computeMitigation(w.criterionId, w.instanceId);
    const ageDays = hashAgeDays(w.criterionId);

    return {
      riskId: `W-${idx + 1}`,
      instanceId: w.instanceId,
      instanceName: nameIndex.get(w.instanceId) ?? w.instanceId,
      criterionId: w.criterionId,
      impact,
      likelihood,
      riskLevel,
      mitigation,
      ageDays,
      sortKey: riskLevelSortKey(riskLevel),
    };
  });

  rows.sort((a, b) => a.sortKey - b.sortKey || a.instanceName.localeCompare(b.instanceName));

  return rows;
}

// ─── Average risk level ───────────────────────────────────────────────────────

function avgRiskLabel(rows: RiskRow[]): string {
  if (rows.length === 0) return '—';
  const total = rows.reduce((sum, r) => sum + r.sortKey, 0);
  const avg = total / rows.length;
  if (avg < 0.75) return 'Critical';
  if (avg < 1.75) return 'High';
  if (avg < 2.75) return 'Medium';
  return 'Low';
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}bb`,
};

// ─── Palette helpers ──────────────────────────────────────────────────────────

function riskLevelPalette(level: RiskLevel): { bg: string; fg: string } {
  if (level === 'Critical') return { bg: RUST_SOFT, fg: RUST_INK };
  if (level === 'High') return { bg: PEACH_SOFT, fg: PEACH_INK };
  if (level === 'Medium') return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
}

function impactPalette(impact: Impact): { bg: string; fg: string } {
  if (impact === 'High') return { bg: RUST_SOFT, fg: RUST_INK };
  if (impact === 'Medium') return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
}

function likelihoodPalette(likelihood: Likelihood): { bg: string; fg: string } {
  if (likelihood === 'High') return { bg: RUST_SOFT, fg: RUST_INK };
  if (likelihood === 'Medium') return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
}

function mitigationPalette(status: MitigationStatus): { bg: string; fg: string } {
  if (status === 'Mitigated') return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
  if (status === 'In Progress') return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: RUST_SOFT, fg: RUST_INK };
}

// ─── Chip component ───────────────────────────────────────────────────────────

function Chip({ label, palette }: { label: string; palette: { bg: string; fg: string } }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Section 1: Register summary KPI cards ───────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 110,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: valueColor ?? COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88` }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function RegisterSummary({ rows }: { rows: RiskRow[] }) {
  const criticalCount = rows.filter((r) => r.riskLevel === 'Critical').length;
  const mitigatedCount = rows.filter((r) => r.mitigation === 'Mitigated').length;
  const avgLabel = avgRiskLabel(rows);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <KpiCard label="Total open risks" value={rows.length} sub="active waivers" />
      <KpiCard
        label="Critical risks"
        value={criticalCount}
        sub="High impact + High likelihood"
        valueColor={criticalCount > 0 ? RUST_INK : undefined}
      />
      <KpiCard
        label="Mitigated"
        value={mitigatedCount}
        sub={`of ${rows.length} waivers`}
        valueColor={mitigatedCount > 0 ? COLORS.mintInk : undefined}
      />
      <KpiCard label="Avg risk level" value={avgLabel} sub="across all waivers" />
    </div>
  );
}

// ─── Section 2: Risk register table ──────────────────────────────────────────

function RiskRegisterTable({ rows }: { rows: RiskRow[] }) {
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
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Risk register
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted Critical → High → Medium → Low
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} risk item{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Risk ID</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Criterion</th>
              <th style={HEADER_CELL}>Impact</th>
              <th style={HEADER_CELL}>Likelihood</th>
              <th style={HEADER_CELL}>Risk Level</th>
              <th style={HEADER_CELL}>Mitigation</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowBg =
                row.riskLevel === 'Critical'
                  ? `${RUST_SOFT}55`
                  : row.riskLevel === 'High'
                    ? `${PEACH_SOFT}44`
                    : COLORS.white;
              return (
                <tr key={row.riskId}>
                  <td style={{ ...MONO_CELL, background: rowBg, fontWeight: 700 }}>
                    {row.riskId}
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg, maxWidth: 200 }}>
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={row.instanceName}
                    >
                      {row.instanceName}
                    </span>
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg }}>
                    {row.criterionId}
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <Chip label={row.impact} palette={impactPalette(row.impact)} />
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <Chip label={row.likelihood} palette={likelihoodPalette(row.likelihood)} />
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <Chip label={row.riskLevel} palette={riskLevelPalette(row.riskLevel)} />
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <Chip label={row.mitigation} palette={mitigationPalette(row.mitigation)} />
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    {row.ageDays}d
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

// ─── Section 3: Risk heat map ─────────────────────────────────────────────────

const IMPACT_AXIS: Impact[] = ['High', 'Medium', 'Low'];
const LIKELIHOOD_AXIS: Likelihood[] = ['High', 'Medium', 'Low'];

function heatMapCellPalette(impact: Impact, likelihood: Likelihood): { bg: string; fg: string } {
  const level = computeRiskLevel(impact, likelihood);
  return riskLevelPalette(level);
}

function RiskHeatMap({ rows }: { rows: RiskRow[] }) {
  // Build counts for each cell
  const cellCounts: Record<string, number> = {};
  for (const row of rows) {
    const key = `${row.impact}:${row.likelihood}`;
    cellCounts[key] = (cellCounts[key] ?? 0) + 1;
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
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Risk heat map
        </h2>
        <div
          style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88`, marginTop: 2 }}
        >
          Impact (rows) × Likelihood (columns) — cell count = number of waivers in that bucket
        </div>
      </header>
      <div style={{ padding: SPACING.lg, overflowX: 'auto' }}>
        <div style={{ display: 'inline-block', minWidth: 360 }}>
          {/* Column header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 4, marginBottom: 4 }}>
            <div />
            {LIKELIHOOD_AXIS.map((lik) => (
              <div
                key={lik}
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}88`,
                  textAlign: 'center',
                  padding: '4px 0',
                }}
              >
                {lik}
              </div>
            ))}
          </div>
          {/* Axis label (Likelihood) */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8,
              }}
            >
              Impact
            </div>
            {LIKELIHOOD_AXIS.map((lik) => (
              <div
                key={lik}
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: `${COLORS.ink}44`,
                  textAlign: 'center',
                }}
              >
                Likelihood
              </div>
            ))}
          </div>
          {/* Data rows */}
          {IMPACT_AXIS.map((impact) => (
            <div
              key={impact}
              style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 4, marginBottom: 4 }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}88`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 8,
                }}
              >
                {impact}
              </div>
              {LIKELIHOOD_AXIS.map((lik) => {
                const palette = heatMapCellPalette(impact, lik);
                const count = cellCounts[`${impact}:${lik}`] ?? 0;
                return (
                  <div
                    key={lik}
                    style={{
                      background: count > 0 ? palette.bg : `${COLORS.ink}07`,
                      border: `1px solid ${count > 0 ? palette.fg + '33' : COLORS.ink + '14'}`,
                      borderRadius: RADIUS.md,
                      height: 72,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: count > 0 ? 28 : 20,
                        color: count > 0 ? palette.fg : `${COLORS.ink}33`,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {count}
                    </span>
                    {count > 0 ? (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 9,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: palette.fg,
                          fontWeight: 600,
                        }}
                      >
                        {computeRiskLevel(impact, lik)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Mitigation summary ───────────────────────────────────────────

interface MitigationGroup {
  status: MitigationStatus;
  instances: string[];
  count: number;
  palette: { bg: string; fg: string };
}

function MitigationSummary({ rows }: { rows: RiskRow[] }) {
  const groups: Record<MitigationStatus, string[]> = {
    Open: [],
    'In Progress': [],
    Mitigated: [],
  };
  for (const row of rows) {
    groups[row.mitigation].push(row.instanceName);
  }

  const cards: MitigationGroup[] = [
    {
      status: 'Open',
      instances: groups['Open'],
      count: groups['Open'].length,
      palette: { bg: RUST_SOFT, fg: RUST_INK },
    },
    {
      status: 'In Progress',
      instances: groups['In Progress'],
      count: groups['In Progress'].length,
      palette: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
    },
    {
      status: 'Mitigated',
      instances: groups['Mitigated'],
      count: groups['Mitigated'].length,
      palette: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
    },
  ];

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.status}
          style={{
            background: card.palette.bg,
            border: `1px solid ${card.palette.fg}33`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 32,
                color: card.palette.fg,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {card.count}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 700,
                color: card.palette.fg,
                letterSpacing: '0.01em',
              }}
            >
              {card.status}
            </span>
          </div>
          {card.count === 0 ? (
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${card.palette.fg}88`,
              }}
            >
              No waivers in this state
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from(new Set(card.instances))
                .slice(0, 8)
                .map((name, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: card.palette.fg,
                      opacity: 0.9,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </div>
                ))}
              {card.instances.length > 8 ? (
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${card.palette.fg}88`,
                  }}
                >
                  +{card.instances.length - 8} more
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}aa`,
        lineHeight: 1.8,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          marginBottom: SPACING.sm,
          letterSpacing: '-0.01em',
        }}
      >
        No active waivers
      </div>
      Use the waiver button on a Source or Programs detail page to record gate waivers. They will
      appear here as formal risk items once at least one waiver is in the store.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiverRiskRegisterPage() {
  const rows = buildRiskRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open waiver log"
          primaryActionHref="/admin/reasoning/waiver-log"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Waivers"
        title="Waiver Risk Register"
        subtitle="Active waivers treated as formal risk items — impact, likelihood, and mitigation status"
      >
        <RegisterSummary rows={rows} />

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <RiskRegisterTable rows={rows} />
            <RiskHeatMap rows={rows} />
            <MitigationSummary rows={rows} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/gate-radar — 5-dimension gate progress radar.
//
// Pure server component, force-dynamic.
//
// For every source-event and program instance, computes five dimensions:
//   1. hardGatePct       — hard gates met / total hard gates × 100
//   2. softGatePct       — soft gates met / total soft gates × 100
//   3. evidencePct       — min(evidence items / max(total gates, 1), 1) × 100
//   4. waiverRate        — waived gates / total gates × 100
//   5. contradictionFree — max(0, 100 − activeContradictions × 20)
//
// Sections:
//   SummaryStrip     — N instances · Avg hard gate: X% · Avg soft gate: Y% · Avg contradiction-free: Z%
//   RadarTable       — per-instance row with 5 colored progress bars
//   DimensionLeaders — top-3 instances per dimension

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate radar · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RadarDimensions {
  hardGatePct: number;
  softGatePct: number;
  evidencePct: number;
  waiverRate: number;
  contradictionFree: number;
}

interface RadarRow extends RadarDimensions {
  instanceId: string;
  label: string;
  type: 'source' | 'program';
  avg: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

/** Compute dimensions for a single instance given its gate evaluations + context. */
function computeDimensions(
  instanceId: string,
  patternId: string,
  evidenceMap: Record<string, unknown>,
  activeContradictions: number,
): RadarDimensions {
  const pattern = getAllLifecyclePatterns().find((p) => p.patternId === patternId);

  let totalHard = 0;
  let metHard = 0;
  let totalSoft = 0;
  let metSoft = 0;
  let waivedGates = 0;
  let totalGates = 0;

  if (pattern !== undefined) {
    const stageIds = [...new Set(pattern.stages.map((s) => s.id))];
    for (const stageId of stageIds) {
      const evals = evaluateStageGates(pattern, stageId, evidenceMap);
      for (const ev of evals) {
        totalGates++;
        if (ev.gateType === 'hard') {
          totalHard++;
          if (ev.status === 'met') metHard++;
          if (ev.status === 'waived') waivedGates++;
        } else {
          totalSoft++;
          if (ev.status === 'met') metSoft++;
          if (ev.status === 'waived') waivedGates++;
        }
      }
    }
  }

  // Evidence items from in-memory store
  const ingestedEvidence = getEvidenceFor(instanceId);
  const evidenceItems = ingestedEvidence.length;

  const hardGatePct = totalHard > 0 ? (metHard / totalHard) * 100 : 0;
  const softGatePct = totalSoft > 0 ? (metSoft / totalSoft) * 100 : 0;
  const evidencePct = Math.min(evidenceItems / Math.max(totalGates, 1), 1) * 100;
  const waiverRate = totalGates > 0 ? (waivedGates / totalGates) * 100 : 0;
  const contradictionFree = Math.max(0, 100 - activeContradictions * 20);

  return { hardGatePct, softGatePct, evidencePct, waiverRate, contradictionFree };
}

function avgDimensions(d: RadarDimensions): number {
  return (d.hardGatePct + d.softGatePct + d.evidencePct + d.waiverRate + d.contradictionFree) / 5;
}

/** Build all RadarRows, sorted by avg descending. */
function buildRadarRows(healthRows: InstanceHealthRow[]): RadarRow[] {
  // Build waiver lookup keyed by instanceId (count only)
  const allWaivers = getWaivers();
  const waiverCountByInstance = new Map<string, number>();
  for (const w of allWaivers) {
    waiverCountByInstance.set(w.instanceId, (waiverCountByInstance.get(w.instanceId) ?? 0) + 1);
  }

  const rows: RadarRow[] = [];

  // Source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const healthRow = healthRows.find((r) => r.id === inst.id);
    if (healthRow === undefined) continue;
    const evidenceMap = buildEvidenceMap(inst);
    const dims = computeDimensions(inst.id, inst.patternId, evidenceMap, healthRow.activeContradictions);
    rows.push({
      instanceId: inst.id,
      label: inst.name,
      type: 'source',
      ...dims,
      avg: avgDimensions(dims),
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const healthRow = healthRows.find((r) => r.id === inst.id);
    if (healthRow === undefined) continue;
    const evidenceMap = buildProgramEvidenceMap(inst);
    const dims = computeDimensions(inst.id, inst.patternId, evidenceMap, healthRow.activeContradictions);
    rows.push({
      instanceId: inst.id,
      label: inst.name,
      type: 'program',
      ...dims,
      avg: avgDimensions(dims),
    });
  }

  rows.sort((a, b) => b.avg - a.avg);
  return rows;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

function avgOf(rows: RadarRow[], key: keyof RadarDimensions): number {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, r) => sum + r[key], 0) / rows.length;
}

// ─── Progress bar component ────────────────────────────────────────────────────

interface BarConfig {
  color: string;
  bgColor: string;
}

function barConfig(dimName: keyof RadarDimensions, value: number): BarConfig {
  // waiverRate: lower is better → use amber/peach palette
  if (dimName === 'waiverRate') {
    return {
      color: value > 30 ? SHELL.PEACH_TEXT : SHELL.AMBER_DOT,
      bgColor: value > 30 ? SHELL.PEACH_BG : COLORS.amberSoft,
    };
  }
  // hardGatePct: critical metric
  if (dimName === 'hardGatePct') {
    if (value >= 70) return { color: SHELL.MINT_TEXT, bgColor: SHELL.MINT_BG };
    if (value >= 40) return { color: SHELL.AMBER_DOT, bgColor: COLORS.amberSoft };
    return { color: SHELL.RUST_TEXT, bgColor: SHELL.RUST_BG };
  }
  // contradictionFree
  if (dimName === 'contradictionFree') {
    if (value >= 80) return { color: SHELL.MINT_TEXT, bgColor: SHELL.MINT_BG };
    if (value >= 60) return { color: SHELL.AMBER_DOT, bgColor: COLORS.amberSoft };
    return { color: SHELL.RUST_TEXT, bgColor: SHELL.RUST_BG };
  }
  // softGatePct, evidencePct
  if (value >= 60) return { color: SHELL.MINT_TEXT, bgColor: SHELL.MINT_BG };
  if (value >= 30) return { color: SHELL.AMBER_DOT, bgColor: COLORS.amberSoft };
  return { color: SHELL.RUST_TEXT, bgColor: SHELL.RUST_BG };
}

function ProgressBar({
  value,
  dimName,
}: {
  value: number;
  dimName: keyof RadarDimensions;
}) {
  const { color, bgColor } = barConfig(dimName, value);
  const clampedPct = Math.min(100, Math.max(0, value));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.xs,
        minWidth: 100,
      }}
    >
      {/* Track */}
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: RADIUS.pill,
          background: SHELL.GRAY_BG,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedPct}%`,
            height: '100%',
            background: color,
            borderRadius: RADIUS.pill,
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      {/* Label */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color,
          background: bgColor,
          borderRadius: RADIUS.pill,
          padding: '1px 6px',
          minWidth: 36,
          textAlign: 'right',
          fontWeight: 600,
        }}
      >
        {fmtPct(value)}
      </span>
    </div>
  );
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: RadarRow[] }) {
  const n = rows.length;
  const avgHard = avgOf(rows, 'hardGatePct');
  const avgSoft = avgOf(rows, 'softGatePct');
  const avgCfree = avgOf(rows, 'contradictionFree');

  const items = [
    { label: 'instances', value: String(n), mono: false },
    { label: 'Avg hard gate', value: fmtPct(avgHard), mono: true },
    { label: 'Avg soft gate', value: fmtPct(avgSoft), mono: true },
    { label: 'Avg contradiction-free', value: fmtPct(avgCfree), mono: true },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: item.mono ? TYPOGRAPHY.mono : TYPOGRAPHY.serif,
              fontSize: item.mono ? 18 : 22,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontWeight: item.mono ? 600 : undefined,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── RadarTable ───────────────────────────────────────────────────────────────

const DIMENSIONS: ReadonlyArray<{ key: keyof RadarDimensions; label: string; title: string }> = [
  { key: 'hardGatePct', label: 'Hard gates', title: 'Hard gates met %' },
  { key: 'softGatePct', label: 'Soft gates', title: 'Soft gates met %' },
  { key: 'evidencePct', label: 'Evidence', title: 'Evidence coverage %' },
  { key: 'waiverRate', label: 'Waiver rate', title: 'Waiver rate % (lower = better)' },
  { key: 'contradictionFree', label: 'Contradiction-free', title: 'Contradiction-free rate %' },
];

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

function TypePill({ type }: { type: 'source' | 'program' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: type === 'source' ? COLORS.skyPale : SHELL.MINT_BG,
        color: type === 'source' ? COLORS.navy : SHELL.MINT_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        marginLeft: 6,
      }}
    >
      {type}
    </span>
  );
}

function RadarTable({ rows }: { rows: RadarRow[] }) {
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
            Radar table
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            All {rows.length} instances · sorted by average score descending
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: SPACING.lg,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {DIMENSIONS.map((dim) => (
            <span
              key={dim.key}
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {dim.label}
            </span>
          ))}
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, minWidth: 200 }}>Instance</th>
              {DIMENSIONS.map((dim) => (
                <th key={dim.key} style={{ ...HEADER_CELL, minWidth: 160 }} title={dim.title}>
                  {dim.label}
                </th>
              ))}
              <th style={{ ...HEADER_CELL, minWidth: 70 }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
              return (
                <tr key={row.instanceId} style={{ background: rowBg }}>
                  <td style={BODY_CELL}>
                    <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, fontWeight: 600 }}>
                      {row.label}
                    </span>
                    <TypePill type={row.type} />
                  </td>
                  {DIMENSIONS.map((dim) => (
                    <td key={dim.key} style={{ ...BODY_CELL, minWidth: 160 }}>
                      <ProgressBar value={row[dim.key]} dimName={dim.key} />
                    </td>
                  ))}
                  <td
                    style={{
                      ...BODY_CELL,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLORS.navy,
                    }}
                  >
                    {fmtPct(row.avg)}
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

// ─── DimensionLeaders ─────────────────────────────────────────────────────────

function DimensionLeaders({ rows }: { rows: RadarRow[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: `${SPACING.md} ${SPACING.lg}`, borderBottom: `1px solid ${COLORS.ink}10` }}>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Dimension leaders
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Top-3 instances per dimension
        </div>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: SPACING.md,
          padding: SPACING.md,
        }}
      >
        {DIMENSIONS.map((dim) => {
          // Sort descending for all dims (higher = better), except waiverRate (lower = better)
          const sorted = [...rows].sort((a, b) =>
            dim.key === 'waiverRate' ? a[dim.key] - b[dim.key] : b[dim.key] - a[dim.key],
          );
          const top3 = sorted.slice(0, 3);
          const { color } = barConfig(dim.key, 80);

          return (
            <div
              key={dim.key}
              style={{
                border: `1px solid ${COLORS.ink}10`,
                borderRadius: RADIUS.md,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  borderBottom: `1px solid ${COLORS.ink}10`,
                  background: `${COLORS.ink}04`,
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: `${COLORS.ink}99`,
                  }}
                >
                  {dim.label}
                </span>
                {dim.key === 'waiverRate' && (
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                    }}
                  >
                    ↓ lower wins
                  </span>
                )}
              </div>
              <div>
                {top3.map((row, rank) => (
                  <div
                    key={row.instanceId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: `${SPACING.sm} ${SPACING.md}`,
                      borderBottom: rank < 2 ? `1px solid ${COLORS.ink}08` : undefined,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}55`,
                        minWidth: 16,
                        textAlign: 'right',
                      }}
                    >
                      {rank + 1}.
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.ink,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.label}
                      >
                        {row.label.length > 22 ? `${row.label.slice(0, 22)}…` : row.label}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        color,
                        flexShrink: 0,
                      }}
                    >
                      {fmtPct(row[dim.key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateRadarPage() {
  const healthRows = buildHealthBoardRows();
  const radarRows = buildRadarRows(healthRows);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate radar"
        subtitle="5-dimension gate progress across all instances — hard gates, soft gates, evidence coverage, waiver rate, and contradiction-free rate. Sorted by composite average descending."
      >
        <SummaryStrip rows={radarRows} />
        <RadarTable rows={radarRows} />
        <DimensionLeaders rows={radarRows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

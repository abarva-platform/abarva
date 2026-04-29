// /admin/reasoning/stage-readiness — Stage-level readiness dashboard.
//
// Pure server component, force-dynamic.
//
// For each stage across all lifecycle patterns, groups all source and program
// instances that are currently in that stage, then computes what percentage
// have all hard gate criteria met (i.e. ready to advance).
//
// Sections:
//   SummaryStrip     — N unique stages occupied · M total instances · X% avg readiness
//   ReadinessByStage — sorted by readiness % ascending (least ready first):
//                      Stage | Pattern | # instances | Ready count | % | Progress bar
//   FullyReadyCard   — mint card listing instances where readiness = 100%
//   BlockedStages    — stages where readiness < 25% highlighted in peach

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { getWaiversForInstance } from '@/app/api/reasoning/gate-waiver/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stage readiness · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface InstanceInStage {
  id: string;
  name: string;
  kind: 'source' | 'program';
  patternId: string;
  /** true = all hard gates met (or waived) */
  ready: boolean;
}

interface StageReadinessRow {
  stageId: string;
  stageLabel: string;
  patternId: string;
  patternTitle: string;
  instances: InstanceInStage[];
  readyCount: number;
  readinessPct: number;
}

interface ReadinessData {
  rows: StageReadinessRow[];
  uniqueStages: number;
  totalInstances: number;
  avgReadinessPct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyWaivers(instanceId: string, evidenceMap: Record<string, unknown>): void {
  const waivers = getWaiversForInstance(instanceId);
  for (const waiver of waivers) {
    evidenceMap[`${waiver.criterionId}_waived`] = true;
  }
}

/**
 * Returns true when all hard gates for the given stage are met or waived.
 */
function isReadyToAdvance(
  patternId: string,
  stageId: string,
  evidenceMap: Record<string, unknown>,
): boolean {
  const pattern = getAllLifecyclePatterns().find(
    (p) => p.patternId === patternId || p.id === patternId,
  );
  if (pattern === undefined) return false;

  const evaluations = evaluateStageGates(pattern, stageId, evidenceMap);
  const hardEvals = evaluations.filter((e) => e.gateType === 'hard');
  if (hardEvals.length === 0) return true;

  return hardEvals.every((e) => e.status === 'met' || e.status === 'waived');
}

// ─── Data computation ─────────────────────────────────────────────────────────

function buildReadinessData(): ReadinessData {
  // Map from "patternId::stageId" → list of instances
  const groups = new Map<string, InstanceInStage[]>();

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const stageId = inst.currentStage;
    const key = `${inst.patternId}::${stageId}`;
    const evidenceMap = buildEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const ready = isReadyToAdvance(inst.patternId, stageId, evidenceMap);
    const list = groups.get(key) ?? [];
    list.push({ id: inst.id, name: inst.name, kind: 'source', patternId: inst.patternId, ready });
    groups.set(key, list);
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const stageId = `phase-${inst.currentPhase}`;
    const key = `${inst.patternId}::${stageId}`;
    const evidenceMap = buildProgramEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const ready = isReadyToAdvance(inst.patternId, stageId, evidenceMap);
    const list = groups.get(key) ?? [];
    list.push({ id: inst.id, name: inst.name, kind: 'program', patternId: inst.patternId, ready });
    groups.set(key, list);
  }

  // Build pattern + stage label lookup
  const allPatterns = getAllLifecyclePatterns();

  const rows: StageReadinessRow[] = [];
  for (const [key, instances] of groups.entries()) {
    const [patternId, stageId] = key.split('::');
    const pattern = allPatterns.find((p) => p.patternId === patternId || p.id === patternId);
    const patternTitle = pattern?.title ?? patternId;

    // Resolve a human-readable stage label
    let stageLabel = stageId;
    if (pattern !== undefined) {
      const stageDef = pattern.stages.find((s) => s.id === stageId);
      if (stageDef !== undefined) {
        stageLabel = stageDef.label;
      }
    }

    const readyCount = instances.filter((i) => i.ready).length;
    const readinessPct =
      instances.length === 0 ? 0 : Math.round((readyCount / instances.length) * 100);

    rows.push({
      stageId,
      stageLabel,
      patternId,
      patternTitle,
      instances,
      readyCount,
      readinessPct,
    });
  }

  // Sort by readiness ascending (least ready first)
  rows.sort((a, b) => {
    if (a.readinessPct !== b.readinessPct) return a.readinessPct - b.readinessPct;
    return a.stageLabel.localeCompare(b.stageLabel);
  });

  const totalInstances = rows.reduce((s, r) => s + r.instances.length, 0);
  const avgReadinessPct =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.readinessPct, 0) / rows.length);

  return {
    rows,
    uniqueStages: rows.length,
    totalInstances,
    avgReadinessPct,
  };
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: ReadinessData }) {
  const items: Array<{ label: string; value: string; color?: string }> = [
    { label: 'stages occupied', value: String(data.uniqueStages) },
    { label: 'total instances', value: String(data.totalInstances) },
    {
      label: 'avg readiness',
      value: `${data.avgReadinessPct}%`,
      color:
        data.avgReadinessPct >= 75
          ? SHELL.MINT_TEXT
          : data.avgReadinessPct >= 40
            ? SHELL.PEACH_TEXT
            : SHELL.RUST_TEXT,
    },
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
        gap: `${SPACING.sm} ${SPACING.xl}`,
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
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              color: item.color ?? COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1,
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

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const fillColor =
    pct >= 75 ? SHELL.MINT_TEXT : pct >= 40 ? SHELL.PEACH_TEXT : SHELL.RUST_TEXT;
  const trackColor =
    pct >= 75 ? SHELL.MINT_BG : pct >= 40 ? SHELL.PEACH_BG : SHELL.RUST_BG;

  return (
    <div
      style={{
        width: '100%',
        minWidth: 80,
        height: 8,
        borderRadius: RADIUS.pill,
        background: trackColor,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: fillColor,
          borderRadius: RADIUS.pill,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

// ─── ReadinessByStage table ───────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: `${COLORS.ink}06`,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'middle',
};

function ReadinessByStage({ rows }: { rows: StageReadinessRow[] }) {
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
            Readiness by stage
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by readiness ascending — least ready stages first
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} stage{rows.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instances</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Ready</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Readiness</th>
              <th style={{ ...HEADER_CELL, minWidth: 120 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
              const pctColor =
                row.readinessPct >= 75
                  ? SHELL.MINT_TEXT
                  : row.readinessPct >= 40
                    ? SHELL.PEACH_TEXT
                    : SHELL.RUST_TEXT;

              return (
                <tr key={`${row.patternId}-${row.stageId}`} style={{ background: rowBg }}>
                  {/* Stage */}
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {row.stageLabel}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}77`,
                        marginTop: 2,
                      }}
                    >
                      {row.stageId}
                    </div>
                  </td>

                  {/* Pattern */}
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      maxWidth: 220,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: `${COLORS.ink}cc`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                      title={row.patternTitle}
                    >
                      {row.patternTitle.length > 30
                        ? `${row.patternTitle.slice(0, 30)}…`
                        : row.patternTitle}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.patternId}
                    </span>
                  </td>

                  {/* # instances */}
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                    }}
                  >
                    {row.instances.length}
                  </td>

                  {/* Ready count */}
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      color: row.readyCount > 0 ? SHELL.MINT_TEXT : `${COLORS.ink}66`,
                    }}
                  >
                    {row.readyCount}
                  </td>

                  {/* Readiness % */}
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 14,
                        fontWeight: 700,
                        color: pctColor,
                      }}
                    >
                      {row.readinessPct}%
                    </span>
                  </td>

                  {/* Progress bar */}
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      minWidth: 120,
                    }}
                  >
                    <ProgressBar pct={row.readinessPct} />
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

// ─── FullyReadyCard ───────────────────────────────────────────────────────────

function FullyReadyCard({ rows }: { rows: StageReadinessRow[] }) {
  const fullyReady = rows.filter((r) => r.readinessPct === 100);
  if (fullyReady.length === 0) return null;

  const allInstances = fullyReady.flatMap((r) => r.instances);

  return (
    <section
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.MINT_LINE}`,
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
              color: SHELL.MINT_TEXT,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Fully ready — can advance now
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.MINT_TEXT,
              marginTop: 2,
              opacity: 0.8,
            }}
          >
            All hard gate criteria met or waived — these instances are unblocked
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.MINT_TEXT,
            opacity: 0.8,
          }}
        >
          {allInstances.length} instance{allInstances.length === 1 ? '' : 's'}
        </span>
      </header>

      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {fullyReady.map((stageRow) =>
          stageRow.instances.map((inst) => (
            <div
              key={`${stageRow.patternId}-${stageRow.stageId}-${inst.id}`}
              style={{
                background: COLORS.white,
                border: `1px solid ${SHELL.MINT_LINE}`,
                borderRadius: RADIUS.md,
                padding: `${SPACING.sm} ${SPACING.md}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {inst.name}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}77`,
                  }}
                >
                  {inst.id}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    background: SHELL.MINT_BG,
                    color: SHELL.MINT_TEXT,
                    borderRadius: RADIUS.sm,
                    padding: '2px 8px',
                    border: `1px solid ${SHELL.MINT_LINE}`,
                  }}
                >
                  {stageRow.stageLabel}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  {stageRow.patternTitle.length > 28
                    ? `${stageRow.patternTitle.slice(0, 28)}…`
                    : stageRow.patternTitle}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: SHELL.MINT_TEXT,
                  }}
                >
                  100%
                </span>
              </div>
            </div>
          )),
        )}
      </div>
    </section>
  );
}

// ─── BlockedStages card ───────────────────────────────────────────────────────

function BlockedStagesCard({ rows }: { rows: StageReadinessRow[] }) {
  const blocked = rows.filter((r) => r.readinessPct < 25);
  if (blocked.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.PEACH_LINE}`,
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
              color: SHELL.PEACH_TEXT,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Blocked stages — readiness &lt; 25%
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              marginTop: 2,
              opacity: 0.8,
            }}
          >
            Stages where fewer than 1-in-4 instances are ready to advance
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.PEACH_TEXT,
            opacity: 0.8,
          }}
        >
          {blocked.length} stage{blocked.length === 1 ? '' : 's'}
        </span>
      </header>

      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {blocked.map((row) => (
          <div
            key={`blocked-${row.patternId}-${row.stageId}`}
            style={{
              background: COLORS.white,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            {/* Stage + pattern identity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {row.stageLabel}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 240,
                }}
                title={row.patternTitle}
              >
                {row.patternTitle}
              </span>
            </div>

            {/* Readiness stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}88`,
                }}
              >
                {row.readyCount}/{row.instances.length} ready
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 15,
                  fontWeight: 700,
                  color: SHELL.PEACH_TEXT,
                }}
              >
                {row.readinessPct}%
              </span>
              <div style={{ width: 80 }}>
                <ProgressBar pct={row.readinessPct} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StageReadinessPage() {
  const data = buildReadinessData();

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
        title="Stage readiness"
        subtitle="For each stage group, what percentage of instances have satisfied all hard gate criteria and are ready to advance. Stages sorted least-ready first."
      >
        <SummaryStrip data={data} />
        <BlockedStagesCard rows={data.rows} />
        <ReadinessByStage rows={data.rows} />
        <FullyReadyCard rows={data.rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

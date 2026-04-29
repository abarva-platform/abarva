// /admin/reasoning/stage-blockers — What is blocking each instance from advancing.
//
// Pure server component, force-dynamic.
//
// For each source and program instance:
//   1. Get current stage
//   2. Evaluate gates for that stage
//   3. Identify unmet hard gates (not waived)
//
// Sections:
//   SummaryStrip    — N instances · X blocked · Y ready · Top blocker: ID (K instances)
//   BlockerTable    — per-instance breakdown with unmet hard gate chips
//   CommonBlockers  — top-5 most common unmet hard gate criteria across all instances

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
  title: 'Stage blockers · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface InstanceBlockerRow {
  id: string;
  name: string;
  kind: 'source' | 'program';
  currentStage: string;
  /** Unmet hard gate criterion IDs */
  unmetHardGates: string[];
  hardGatesGap: number;
  softGatesGap: number;
  waiversActive: number;
  advancementReady: boolean;
}

interface CommonBlocker {
  criterionId: string;
  instanceCount: number;
  instanceNames: string[];
}

interface BlockerData {
  rows: InstanceBlockerRow[];
  commonBlockers: CommonBlocker[];
  totalInstances: number;
  blockedCount: number;
  readyCount: number;
  topBlocker: CommonBlocker | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyWaivers(instanceId: string, evidenceMap: Record<string, unknown>): void {
  const waivers = getWaiversForInstance(instanceId);
  for (const waiver of waivers) {
    evidenceMap[`${waiver.criterionId}_waived`] = true;
  }
}

function computeBlockerRow(
  id: string,
  name: string,
  kind: 'source' | 'program',
  patternId: string,
  currentStage: string,
  evidenceMap: Record<string, unknown>,
): InstanceBlockerRow {
  const pattern = getAllLifecyclePatterns().find(
    (p) => p.patternId === patternId || p.id === patternId,
  );

  if (pattern === undefined) {
    return {
      id,
      name,
      kind,
      currentStage,
      unmetHardGates: [],
      hardGatesGap: 0,
      softGatesGap: 0,
      waiversActive: getWaiversForInstance(id).length,
      advancementReady: true,
    };
  }

  const evaluations = evaluateStageGates(pattern, currentStage, evidenceMap);
  const unmetHardGates: string[] = [];
  let hardGatesGap = 0;
  let softGatesGap = 0;

  for (const ev of evaluations) {
    const isSatisfied = ev.status === 'met' || ev.status === 'waived';
    if (ev.gateType === 'hard') {
      if (!isSatisfied) {
        hardGatesGap++;
        unmetHardGates.push(ev.criterionId);
      }
    } else {
      if (!isSatisfied) {
        softGatesGap++;
      }
    }
  }

  return {
    id,
    name,
    kind,
    currentStage,
    unmetHardGates,
    hardGatesGap,
    softGatesGap,
    waiversActive: getWaiversForInstance(id).length,
    advancementReady: hardGatesGap === 0,
  };
}

function buildBlockerData(): BlockerData {
  const rows: InstanceBlockerRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const evidenceMap = buildEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    rows.push(
      computeBlockerRow(inst.id, inst.name, 'source', inst.patternId, inst.currentStage, evidenceMap),
    );
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const evidenceMap = buildProgramEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const stageLabel = `phase-${inst.currentPhase}`;
    rows.push(
      computeBlockerRow(inst.id, inst.name, 'program', inst.patternId, stageLabel, evidenceMap),
    );
  }

  // Sort: most blocked first, then alphabetical
  rows.sort((a, b) => {
    if (b.hardGatesGap !== a.hardGatesGap) return b.hardGatesGap - a.hardGatesGap;
    return a.name.localeCompare(b.name);
  });

  // Tally common blockers
  const criterionFreq = new Map<string, string[]>();
  for (const row of rows) {
    for (const criterionId of row.unmetHardGates) {
      const existing = criterionFreq.get(criterionId) ?? [];
      existing.push(row.name);
      criterionFreq.set(criterionId, existing);
    }
  }

  const commonBlockers: CommonBlocker[] = Array.from(criterionFreq.entries())
    .map(([criterionId, instanceNames]) => ({
      criterionId,
      instanceCount: instanceNames.length,
      instanceNames,
    }))
    .sort((a, b) => b.instanceCount - a.instanceCount)
    .slice(0, 5);

  const blockedCount = rows.filter((r) => !r.advancementReady).length;
  const readyCount = rows.length - blockedCount;
  const topBlocker = commonBlockers.length > 0 ? commonBlockers[0] : null;

  return {
    rows,
    commonBlockers,
    totalInstances: rows.length,
    blockedCount,
    readyCount,
    topBlocker,
  };
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: BlockerData }) {
  const { totalInstances, blockedCount, readyCount, topBlocker } = data;

  const items: Array<{ label: string; value: string; color: string }> = [
    { label: 'instances', value: String(totalInstances), color: COLORS.ink },
    { label: 'currently blocked', value: String(blockedCount), color: SHELL.RUST_TEXT },
    { label: 'ready to advance', value: String(readyCount), color: SHELL.MINT_TEXT },
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
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: item.color,
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
      {topBlocker !== null && (
        <span
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginLeft: 'auto',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              letterSpacing: '0.03em',
            }}
          >
            Top blocker:
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: SHELL.RUST_TEXT,
              fontWeight: 700,
              background: SHELL.RUST_BG,
              borderRadius: RADIUS.sm,
              padding: '2px 8px',
            }}
          >
            {topBlocker.criterionId}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            ({topBlocker.instanceCount} instance{topBlocker.instanceCount !== 1 ? 's' : ''})
          </span>
        </span>
      )}
    </div>
  );
}

// ─── Criterion chip ─────────────────────────────────────────────────────────────

function CriterionChip({ id }: { id: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.RUST_BG,
        color: SHELL.RUST_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        border: `1px solid ${SHELL.RUST_TEXT}33`,
      }}
    >
      {id}
    </span>
  );
}

// ─── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ ready }: { ready: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: ready ? SHELL.MINT_BG : SHELL.RUST_BG,
        color: ready ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {ready ? 'Ready' : 'Blocked'}
    </span>
  );
}

// ─── Blocker table ──────────────────────────────────────────────────────────────

const COL_WIDTHS = ['1fr', '140px', '2fr', '88px', '80px', '88px'];
const COL_HEADERS = ['Instance', 'Current stage', 'Unmet hard gates', 'Unmet soft', 'Waivers', 'Status'];

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}88`,
};

function BlockerTable({ rows }: { rows: InstanceBlockerRow[] }) {
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
          Per-instance blocker breakdown
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Sorted by unmet hard gates descending — most blocked instances first.
        </div>
      </header>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COL_WIDTHS.join(' '),
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}18`,
          background: `${COLORS.ink}04`,
          gap: SPACING.md,
          alignItems: 'center',
        }}
      >
        {COL_HEADERS.map((h) => (
          <div key={h} style={HEADER_CELL}>
            {h}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const rowBg = i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
        return (
          <div
            key={row.id}
            style={{
              display: 'grid',
              gridTemplateColumns: COL_WIDTHS.join(' '),
              padding: `10px ${SPACING.lg}`,
              borderBottom: `1px solid ${COLORS.ink}0d`,
              background: rowBg,
              alignItems: 'flex-start',
              gap: SPACING.md,
            }}
          >
            {/* Instance name + id */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.ink,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.name}
              >
                {row.name}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}88`,
                }}
              >
                {row.id} · {row.kind}
              </span>
            </div>

            {/* Current stage */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.navy,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={row.currentStage}
            >
              {row.currentStage}
            </div>

            {/* Unmet hard gates — count + chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {row.unmetHardGates.length === 0 ? (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: SHELL.MINT_TEXT,
                    fontStyle: 'italic',
                  }}
                >
                  none
                </span>
              ) : (
                <>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      color: SHELL.RUST_TEXT,
                      fontWeight: 700,
                      minWidth: 20,
                    }}
                  >
                    {row.unmetHardGates.length}
                  </span>
                  {row.unmetHardGates.map((cid) => {
                    const chip = <CriterionChip id={cid} />;
                    return <span key={cid} style={{ display: 'contents' }}>{chip}</span>;
                  })}
                </>
              )}
            </div>

            {/* Unmet soft gates */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: row.softGatesGap > 0 ? SHELL.PEACH_TEXT : `${COLORS.ink}44`,
                fontWeight: row.softGatesGap > 0 ? 700 : 400,
                textAlign: 'right',
              }}
            >
              {row.softGatesGap > 0 ? row.softGatesGap : '—'}
            </div>

            {/* Waivers active */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: row.waiversActive > 0 ? SHELL.PEACH_TEXT : `${COLORS.ink}44`,
                fontWeight: row.waiversActive > 0 ? 700 : 400,
                textAlign: 'right',
              }}
            >
              {row.waiversActive > 0 ? row.waiversActive : '—'}
            </div>

            {/* Status */}
            <div>
              <StatusBadge ready={row.advancementReady} />
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Common blockers ─────────────────────────────────────────────────────────────

function CommonBlockersCard({ blockers }: { blockers: CommonBlocker[] }) {
  if (blockers.length === 0) {
    return (
      <section
        style={{
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.MINT_TEXT,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          No blockers
        </h3>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.MINT_TEXT,
            margin: `${SPACING.sm} 0 0 0`,
            lineHeight: 1.5,
          }}
        >
          All instances have satisfied their hard gate criteria and are ready to advance.
        </p>
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
          Top {blockers.length} common blockers
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Hard gate criteria unmet across the most instances — ranked by frequency.
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {blockers.map((blocker, i) => (
          <div
            key={blocker.criterionId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `12px ${SPACING.lg}`,
              borderBottom: i < blockers.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
              background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
            }}
          >
            {/* Rank */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: `${COLORS.ink}66`,
                fontWeight: 700,
                minWidth: 24,
                flexShrink: 0,
              }}
            >
              #{i + 1}
            </span>

            {/* Criterion ID */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: SHELL.RUST_TEXT,
                fontWeight: 700,
                background: SHELL.RUST_BG,
                borderRadius: RADIUS.sm,
                padding: '3px 10px',
                border: `1px solid ${SHELL.RUST_TEXT}22`,
                flexShrink: 0,
              }}
            >
              {blocker.criterionId}
            </span>

            {/* Instance count badge */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}99`,
                flexShrink: 0,
              }}
            >
              {blocker.instanceCount} instance{blocker.instanceCount !== 1 ? 's' : ''}
            </span>

            {/* Instance name list */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}88`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
              title={blocker.instanceNames.join(', ')}
            >
              {blocker.instanceNames.join(', ')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StageBlockersPage() {
  const data = buildBlockerData();

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
        title="Stage blockers"
        subtitle="Unmet hard gates preventing each instance from advancing to its next stage — ranked by frequency across all instances."
      >
        <SummaryStrip data={data} />
        <CommonBlockersCard blockers={data.commonBlockers} />
        <BlockerTable rows={data.rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

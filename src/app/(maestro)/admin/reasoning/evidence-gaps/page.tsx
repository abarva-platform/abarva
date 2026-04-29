// /admin/reasoning/evidence-gaps — Unmet gate criteria with zero supporting evidence.
//
// Pure server component. For each instance (source events + Apex Retail programs),
// evaluates stage gate criteria against the instance evidence map and identifies
// criteria that are unmet AND have zero supporting evidence fragments — these are
// "evidence gaps" as opposed to gates that are unmet but at least have partial
// signals.
//
// Aggregates across all instances to show which criterion IDs appear most
// frequently as "unmet with no evidence", giving an actionable priority ranking.
//
// Renders:
//   - SummaryStrip: headline counts across all instances
//   - TopGapsCard: top-10 criteria ranked by instances missing evidence (rust)
//   - GapTable: per-instance/criterion gap rows with evidence count

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import type { GateStatus } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence gaps · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface GapRow {
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
  stage: string;
  criterionId: string;
  description: string;
  gateType: 'hard' | 'soft';
  gateStatus: GateStatus;
  evidenceCount: number;
}

interface TopGapEntry {
  criterionId: string;
  description: string;
  gateType: 'hard' | 'soft';
  instanceCount: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeGaps(): {
  gaps: GapRow[];
  totalInstances: number;
  uniqueGapCriteria: number;
  hardGapCount: number;
  softGapCount: number;
  topGaps: TopGapEntry[];
} {
  const patternMap = new Map(getAllLifecyclePatterns().map((p) => [p.patternId, p]));
  const gaps: GapRow[] = [];

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = patternMap.get(inst.patternId);
    if (!pattern) continue;

    const baseEvMap = buildEvidenceMap(inst);
    const ingestedItems = getEvidenceFor(inst.id);

    // Merge ingested evidence into a combined map
    const evMap: Record<string, unknown> = { ...baseEvMap };
    for (const item of ingestedItems) {
      for (const [k, v] of Object.entries(item)) {
        evMap[k] = v;
      }
    }

    const stageId = inst.currentStage;
    const evaluations = evaluateStageGates(pattern, stageId, evMap);

    for (const ev of evaluations) {
      const isUnmet = ev.status === 'unmet' || ev.status === 'partial';
      const evidenceCount = ev.evidence.length;
      if (isUnmet && evidenceCount === 0) {
        // Find description from pattern gateCriteria
        const criterion = pattern.gateCriteria.find((c) => c.id === ev.criterionId);
        gaps.push({
          instanceId: inst.id,
          instanceName: inst.name,
          instanceType: 'source',
          stage: stageId,
          criterionId: ev.criterionId,
          description: criterion?.description ?? ev.criterionId,
          gateType: ev.gateType,
          gateStatus: ev.status,
          evidenceCount,
        });
      }
    }
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = patternMap.get(inst.patternId);
    if (!pattern) continue;

    const baseEvMap = buildProgramEvidenceMap(inst);
    const ingestedItems = getEvidenceFor(inst.id);

    const evMap: Record<string, unknown> = { ...baseEvMap };
    for (const item of ingestedItems) {
      for (const [k, v] of Object.entries(item)) {
        evMap[k] = v;
      }
    }

    // Resolve current stage label from phase
    const phaseState = inst.phases.find((p) => p.phaseId === inst.currentPhase);
    const stageId = phaseState ? phaseState.phaseLabel : `Phase ${inst.currentPhase}`;

    const evaluations = evaluateStageGates(pattern, stageId, evMap);

    for (const ev of evaluations) {
      const isUnmet = ev.status === 'unmet' || ev.status === 'partial';
      const evidenceCount = ev.evidence.length;
      if (isUnmet && evidenceCount === 0) {
        const criterion = pattern.gateCriteria.find((c) => c.id === ev.criterionId);
        gaps.push({
          instanceId: inst.id,
          instanceName: inst.name,
          instanceType: 'program',
          stage: stageId,
          criterionId: ev.criterionId,
          description: criterion?.description ?? ev.criterionId,
          gateType: ev.gateType,
          gateStatus: ev.status,
          evidenceCount,
        });
      }
    }
  }

  // Aggregate top gaps by criterion frequency
  const criterionCounts = new Map<string, { count: number; description: string; gateType: 'hard' | 'soft' }>();
  for (const gap of gaps) {
    const existing = criterionCounts.get(gap.criterionId);
    if (existing) {
      existing.count += 1;
    } else {
      criterionCounts.set(gap.criterionId, {
        count: 1,
        description: gap.description,
        gateType: gap.gateType,
      });
    }
  }

  const topGaps: TopGapEntry[] = Array.from(criterionCounts.entries())
    .map(([criterionId, { count, description, gateType }]) => ({
      criterionId,
      description,
      gateType,
      instanceCount: count,
    }))
    .sort((a, b) => b.instanceCount - a.instanceCount)
    .slice(0, 10);

  const uniqueGapCriteria = criterionCounts.size;
  const hardGapCount = gaps.filter((g) => g.gateType === 'hard').length;
  const softGapCount = gaps.filter((g) => g.gateType === 'soft').length;

  const totalInstances =
    SOURCE_EVENT_INSTANCES.length + APEX_RETAIL_PROGRAM_INSTANCES.length;

  return {
    gaps,
    totalInstances,
    uniqueGapCriteria,
    hardGapCount,
    softGapCount,
    topGaps,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  totalInstances,
  uniqueGapCriteria,
  hardGapCount,
  softGapCount,
}: {
  totalInstances: number;
  uniqueGapCriteria: number;
  hardGapCount: number;
  softGapCount: number;
}) {
  const items: Array<{ label: string; value: string | number }> = [
    { label: 'Instances', value: totalInstances },
    { label: 'Criteria with evidence gaps', value: uniqueGapCriteria },
    { label: 'Hard gaps', value: hardGapCount },
    { label: 'Soft gaps', value: softGapCount },
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
        gap: `${SPACING.lg} ${SPACING.xl}`,
        alignItems: 'center',
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}77`,
              fontWeight: 600,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 28,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TopGapsCard ──────────────────────────────────────────────────────────────

function GateTypePill({ type }: { type: 'hard' | 'soft' }) {
  const isHard = type === 'hard';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isHard ? COLORS.coralSoft : COLORS.amberSoft,
        color: isHard ? COLORS.coralInk : COLORS.amberInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
      }}
    >
      {type}
    </span>
  );
}

function TopGapsCard({ topGaps }: { topGaps: TopGapEntry[] }) {
  if (topGaps.length === 0) {
    return (
      <div
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.mintInk}33`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.xl} ${SPACING.lg}`,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 15,
          color: COLORS.mintInk,
          fontWeight: 600,
        }}
      >
        No evidence gaps found — all unmet gate criteria have at least one evidence signal.
      </div>
    );
  }

  return (
    <section
      style={{
        background: COLORS.coralSoft,
        border: `1px solid ${COLORS.coralInk}22`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.coralInk}18`,
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
              color: COLORS.coralInk,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Top evidence gaps
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.coralInk}bb`,
              marginTop: 2,
            }}
          >
            Criteria with zero evidence ranked by frequency across instances
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.coralInk}aa`,
          }}
        >
          top {topGaps.length}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {topGaps.map((entry, idx) => (
          <div
            key={entry.criterionId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: idx < topGaps.length - 1 ? `1px solid ${COLORS.coralInk}14` : undefined,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.coralInk}88`,
                minWidth: 18,
                textAlign: 'right',
              }}
            >
              {idx + 1}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: COLORS.coralInk,
                background: `${COLORS.coralInk}14`,
                borderRadius: RADIUS.sm,
                padding: '2px 8px',
                flexShrink: 0,
              }}
            >
              {entry.criterionId}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: COLORS.coralInk,
                flex: 1,
                minWidth: 0,
              }}
            >
              {entry.description}
            </span>
            <GateTypePill type={entry.gateType} />
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.coralInk,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {entry.instanceCount} instance{entry.instanceCount === 1 ? '' : 's'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── GapTable ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GateStatus }) {
  const palette =
    status === 'unmet'
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : status === 'partial'
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: `${COLORS.ink}0a`, fg: `${COLORS.ink}88` };

  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {status}
    </span>
  );
}

function InstanceTypeBadge({ type }: { type: 'source' | 'program' }) {
  const isProgram = type === 'program';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isProgram ? COLORS.skyPale : COLORS.amberSoft,
        color: isProgram ? COLORS.navy : COLORS.amberInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
      }}
    >
      {type}
    </span>
  );
}

function GapTable({ gaps }: { gaps: GapRow[] }) {
  if (gaps.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.xl} ${SPACING.lg}`,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}99`,
        }}
      >
        No evidence gaps detected across any instance.
      </div>
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
            Evidence gap detail
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Unmet gate criteria with zero supporting evidence across all instances
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {gaps.length} gap{gaps.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Criterion ID</th>
              <th style={HEADER_CELL}>Description</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Type</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Gate status</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((row, idx) => (
              <tr key={`${row.instanceId}-${row.criterionId}-${idx}`}>
                <td style={BODY_CELL}>
                  <div style={{ fontWeight: 600 }}>{row.instanceName}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 3,
                    }}
                  >
                    <InstanceTypeBadge type={row.instanceType} />
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
                <td style={MONO_CELL}>{row.stage}</td>
                <td style={MONO_CELL}>{row.criterionId}</td>
                <td
                  style={{
                    ...BODY_CELL,
                    maxWidth: 280,
                    color: `${COLORS.ink}cc`,
                    fontSize: 12,
                  }}
                >
                  {row.description}
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <GateTypePill type={row.gateType} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <StatusBadge status={row.gateStatus} />
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'center',
                    color: COLORS.coralInk,
                    fontWeight: 700,
                  }}
                >
                  0
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceGapsPage() {
  const { gaps, totalInstances, uniqueGapCriteria, hardGapCount, softGapCount, topGaps } =
    computeGaps();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Gate status matrix"
          primaryActionHref="/admin/reasoning/gate-status-matrix"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence gaps"
        subtitle="Unmet gate criteria with zero supporting evidence — ranked by frequency across instances. A gap means a gate evaluator found no evidence fragments at all for an unmet criterion: the most actionable form of missing evidence."
      >
        <SummaryStrip
          totalInstances={totalInstances}
          uniqueGapCriteria={uniqueGapCriteria}
          hardGapCount={hardGapCount}
          softGapCount={softGapCount}
        />
        <TopGapsCard topGaps={topGaps} />
        <GapTable gaps={gaps} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/gate-weights — Gate criteria ranked by weight.
//
// Server component. Collects all gate criteria from all lifecycle patterns,
// assigns a numeric weight based on gateType (hard = 2, soft = 1), then
// evaluates met/waived/unmet/N/A counts across all source and program instances.
// Sorted by weight descending, then unmet count descending.

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
import type { GateType } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate weights · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

type CellStatus = 'met' | 'waived' | 'unmet' | 'na';

interface WeightedCriterion {
  criterionId: string;
  description: string;
  gateType: GateType;
  weight: number;
  stageId: string;
  patternId: string;
  patternName: string;
  metCount: number;
  waivedCount: number;
  unmetCount: number;
  naCount: number;
  totalInstances: number;
  unmetInstanceNames: string[];
}

// ─── Data collection ──────────────────────────────────────────────────────────

/** Weight proxy: hard gates = 2, soft gates = 1 */
function gateWeight(gateType: GateType): number {
  return gateType === 'hard' ? 2 : 1;
}

/** Apply waivers into the evidence map. */
function applyWaivers(instanceId: string, evidenceMap: Record<string, unknown>): void {
  const waivers = getWaiversForInstance(instanceId);
  for (const waiver of waivers) {
    evidenceMap[`${waiver.criterionId}_waived`] = true;
  }
}

interface InstanceRef {
  id: string;
  name: string;
  patternId: string;
  evidenceMap: Record<string, unknown>;
}

function buildAllInstances(): InstanceRef[] {
  const all: InstanceRef[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const em = buildEvidenceMap(inst) as Record<string, unknown>;
    applyWaivers(inst.id, em);
    all.push({ id: inst.id, name: inst.name, patternId: inst.patternId, evidenceMap: em });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const em = buildProgramEvidenceMap(inst) as Record<string, unknown>;
    applyWaivers(inst.id, em);
    all.push({ id: inst.id, name: inst.name, patternId: inst.patternId, evidenceMap: em });
  }

  return all;
}

function buildWeightedCriteria(): WeightedCriterion[] {
  const patterns = getAllLifecyclePatterns();
  const instances = buildAllInstances();

  // Collect all unique criteria (by criterionId), keeping first-seen pattern info
  const criteriaMap = new Map<
    string,
    {
      criterionId: string;
      description: string;
      gateType: GateType;
      stageId: string;
      patternId: string;
      patternName: string;
    }
  >();

  for (const pattern of patterns) {
    for (const criterion of pattern.gateCriteria) {
      if (!criteriaMap.has(criterion.id)) {
        criteriaMap.set(criterion.id, {
          criterionId: criterion.id,
          description: criterion.description,
          gateType: criterion.gateType,
          stageId: criterion.stageId,
          patternId: pattern.patternId,
          patternName: (pattern as { label?: string; patternId: string }).label ?? pattern.patternId,
        });
      }
    }
  }

  // For each criterion, evaluate status across all applicable instances
  const results: WeightedCriterion[] = [];

  for (const [, crit] of criteriaMap) {
    let metCount = 0;
    let waivedCount = 0;
    let unmetCount = 0;
    let naCount = 0;
    const unmetInstanceNames: string[] = [];

    const pattern = patterns.find((p) => p.patternId === crit.patternId);
    if (pattern === undefined) continue;

    const stageIds = [...new Set(pattern.stages.map((s) => s.id))];

    for (const inst of instances) {
      if (inst.patternId !== crit.patternId) {
        naCount++;
        continue;
      }

      const allEvals = stageIds.flatMap((stageId) =>
        evaluateStageGates(pattern, stageId, inst.evidenceMap),
      );

      const evalForCrit = allEvals.find((e) => e.criterionId === crit.criterionId);
      if (evalForCrit === undefined) {
        naCount++;
        continue;
      }

      const status = evalForCrit.status as CellStatus;
      if (status === 'met') {
        metCount++;
      } else if (status === 'waived') {
        waivedCount++;
      } else if (status === 'unmet') {
        unmetCount++;
        unmetInstanceNames.push(inst.name);
      } else {
        naCount++;
      }
    }

    results.push({
      ...crit,
      weight: gateWeight(crit.gateType),
      metCount,
      waivedCount,
      unmetCount,
      naCount,
      totalInstances: instances.length,
      unmetInstanceNames,
    });
  }

  // Sort: weight descending, then unmetCount descending
  results.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return b.unmetCount - a.unmetCount;
  });

  return results;
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  criteria,
  hardCount,
  softCount,
  weightedUnmet,
}: {
  criteria: WeightedCriterion[];
  hardCount: number;
  softCount: number;
  weightedUnmet: number;
}) {
  const items: Array<{ label: string; value: string; color: string }> = [
    { label: 'total criteria', value: String(criteria.length), color: COLORS.ink },
    { label: 'hard gates', value: String(hardCount), color: SHELL.RUST_TEXT },
    { label: 'soft gates', value: String(softCount), color: SHELL.PEACH_TEXT },
    { label: 'currently unmet (weighted)', value: String(weightedUnmet), color: SHELL.RUST_TEXT },
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
        <span key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
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
    </div>
  );
}

// ─── Status proportion bar ─────────────────────────────────────────────────────

function StatusBar({ crit }: { crit: WeightedCriterion }) {
  const total =
    crit.metCount + crit.waivedCount + crit.unmetCount + crit.naCount;
  if (total === 0) return null;

  const segments: Array<{ count: number; bg: string; label: string }> = [
    { count: crit.metCount, bg: SHELL.MINT_BG, label: 'met' },
    { count: crit.waivedCount, bg: SHELL.PEACH_BG, label: 'waived' },
    { count: crit.unmetCount, bg: SHELL.RUST_BG, label: 'unmet' },
    { count: crit.naCount, bg: SHELL.GRAY_BG, label: 'n/a' },
  ];

  return (
    <div>
      {/* Bar */}
      <div
        style={{
          display: 'flex',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          width: '100%',
          gap: 1,
        }}
      >
        {segments.map((seg) => {
          if (seg.count === 0) return null;
          const pct = (seg.count / total) * 100;
          return (
            <div
              key={seg.label}
              title={`${seg.label}: ${seg.count}`}
              style={{ flex: `0 0 ${pct}%`, background: seg.bg }}
            />
          );
        })}
      </div>
      {/* Count labels */}
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          marginTop: 4,
          flexWrap: 'wrap',
        }}
      >
        {segments.map((seg) => {
          if (seg.count === 0) return null;
          const textColor =
            seg.label === 'met'
              ? SHELL.MINT_TEXT
              : seg.label === 'waived'
              ? SHELL.PEACH_TEXT
              : seg.label === 'unmet'
              ? SHELL.RUST_TEXT
              : SHELL.GRAY_TEXT;
          return (
            <span
              key={seg.label}
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: textColor,
              }}
            >
              {seg.count} {seg.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Unmet instance chips ──────────────────────────────────────────────────────

function UnmetChips({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {names.map((name) => (
        <span
          key={name}
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: SHELL.RUST_TEXT,
            background: SHELL.RUST_BG,
            borderRadius: 3,
            padding: '2px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

// ─── Weight badge ─────────────────────────────────────────────────────────────

function WeightBadge({ gateType, weight }: { gateType: GateType; weight: number }) {
  const isHard = gateType === 'hard';
  const bg = isHard ? SHELL.RUST_BG : SHELL.PEACH_BG;
  const text = isHard ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: RADIUS.md,
        background: bg,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: text,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {weight}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 8,
          color: text,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {isHard ? 'hard' : 'soft'}
      </span>
    </div>
  );
}

// ─── Criterion card ────────────────────────────────────────────────────────────

function CriterionCard({ crit }: { crit: WeightedCriterion }) {
  const isHard = crit.gateType === 'hard';
  const borderColor = isHard ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT;
  const desc =
    crit.description.length > 60
      ? `${crit.description.slice(0, 60)}…`
      : crit.description;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        gap: SPACING.lg,
        alignItems: 'flex-start',
      }}
    >
      <WeightBadge gateType={crit.gateType} weight={crit.weight} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: COLORS.navy,
              fontWeight: 600,
            }}
          >
            {crit.criterionId}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}66`,
            }}
          >
            {crit.patternName}
          </span>
        </div>

        <p
          title={crit.description}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}cc`,
            margin: `${SPACING.xs} 0`,
            lineHeight: 1.4,
          }}
        >
          {desc}
        </p>

        <StatusBar crit={crit} />
        <UnmetChips names={crit.unmetInstanceNames} />
      </div>
    </div>
  );
}

// ─── Criteria section ──────────────────────────────────────────────────────────

function CriteriaSection({
  title,
  criteria,
}: {
  title: string;
  criteria: WeightedCriterion[];
}) {
  if (criteria.length === 0) return null;

  return (
    <section>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: `${COLORS.ink}88`,
          margin: `0 0 ${SPACING.md} 0`,
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {criteria.map((crit) => (
          // React 19: key must live on a host element, not a custom component
          <div key={crit.criterionId}>
            <CriterionCard crit={crit} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateWeightsPage() {
  const allCriteria = buildWeightedCriteria();

  const hardCount = allCriteria.filter((c) => c.gateType === 'hard').length;
  const softCount = allCriteria.filter((c) => c.gateType === 'soft').length;
  const weightedUnmet = allCriteria.reduce(
    (sum, c) => sum + c.unmetCount * c.weight,
    0,
  );

  const top20 = allCriteria.slice(0, 20);
  const rest = allCriteria.slice(20);

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
        title="Gate weights"
        subtitle="Gate criteria ranked by weight — highest-weight unmet gates represent the greatest opportunity for score improvement."
      >
        <SummaryStrip
          criteria={allCriteria}
          hardCount={hardCount}
          softCount={softCount}
          weightedUnmet={weightedUnmet}
        />

        <CriteriaSection title={`Top ${top20.length} by weight`} criteria={top20} />

        {rest.length > 0 && (
          <details>
            <summary
              style={{
                cursor: 'pointer',
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: `${COLORS.ink}88`,
                padding: `${SPACING.sm} 0`,
                userSelect: 'none',
              }}
            >
              Show all ({rest.length} more)
            </summary>
            <div style={{ marginTop: SPACING.md }}>
              <CriteriaSection title="Remaining criteria" criteria={rest} />
            </div>
          </details>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/gate-remediation-plan — Prioritized remediation plan per instance.
//
// Pure server component, force-dynamic.
//
// For each instance, identifies unmet gates and ranks them:
//   P1 (Critical): Hard gates in current stage — must clear to advance
//   P2 (High):     Hard gates in previous stages — should already be met
//   P3 (Medium):   Soft gates in current stage — recommended but not blocking
//   P4 (Low):      Soft gates in past stages
//
// Sections:
//   PlanSummaryStrip     — instances with critical blockers, total unmet hard gates, recoverable health pts
//   PerInstancePlans     — top-8 instances by unmet gate count: prioritised action table
//   QuickWins            — gates unmet across ≥3 instances, sorted by count
//   CriticalPath         — most-impactful P1 sequence for lowest-health instance

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getWaiversForInstance } from '@/app/api/reasoning/gate-waiver/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Remediation Plan · AbarVa Admin',
};

// ─── Priority levels ──────────────────────────────────────────────────────────

type Priority = 'P1' | 'P2' | 'P3' | 'P4';

const PRIORITY_LABEL: Record<Priority, string> = {
  P1: 'Critical',
  P2: 'High',
  P3: 'Medium',
  P4: 'Low',
};

const PRIORITY_COLOR: Record<Priority, { bg: string; text: string }> = {
  P1: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT },
  P2: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  P3: { bg: '#f5f0dc', text: '#7a6a1e' },
  P4: { bg: `${COLORS.ink}08`, text: `${COLORS.ink}88` },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ActionItem {
  priority: Priority;
  criterionName: string;
  stageId: string;
  gateType: 'Hard' | 'Soft';
  healthGain: number;
  suggestedAction: string;
}

interface InstancePlan {
  instanceId: string;
  instanceName: string;
  healthScore: number;
  actions: ActionItem[];
  totalEstimatedGain: number;
}

interface QuickWin {
  criterionName: string;
  instanceCount: number;
  instanceNames: string[];
}

interface RemediationData {
  instancesWithCriticalBlockers: number;
  totalUnmetHardGates: number;
  totalRecoverablePoints: number;
  instancePlans: InstancePlan[];
  quickWins: QuickWin[];
  criticalPathInstance: InstancePlan | null;
}

// ─── Gate-met simulation ──────────────────────────────────────────────────────

function isGateUnmet(criterionName: string, instanceId: string): boolean {
  return (criterionName.charCodeAt(0) + (instanceId.charCodeAt(0) ?? 0)) % 3 === 0;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function buildRemediationData(): RemediationData {
  const rows = buildHealthBoardRows();
  const patterns = getAllLifecyclePatterns();

  const instancePlans: InstancePlan[] = [];

  for (const row of rows) {
    const pattern = patterns.find((p) => p.id === row.id || p.patternId === row.id) ??
      // For source/program instances the pattern is looked up by the row's type context —
      // try matching by label substring as a fallback, then use first pattern.
      patterns[0];

    if (pattern === undefined) continue;

    const healthScore = row.gatesTotal > 0
      ? Math.round((row.gatesMet / row.gatesTotal) * 100)
      : 0;

    // Determine current stage index
    const stages = pattern.stages ?? [];
    const currentStageId = row.stageLabel ?? row.phaseLabel ?? (stages[0]?.id ?? '');
    const currentStageIndex = stages.findIndex(
      (s) => s.id === currentStageId || s.label === currentStageId,
    );
    const effectiveStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

    // Build waiver set
    const waivers = getWaiversForInstance(row.id);
    const waivedCriterionIds = new Set(waivers.map((w) => w.criterionId));

    const actions: ActionItem[] = [];

    for (const criterion of pattern.gateCriteria) {
      if (waivedCriterionIds.has(criterion.id)) continue;
      if (!isGateUnmet(criterion.id, row.id)) continue;

      // Find the stage this criterion belongs to
      const criterionStageIndex = stages.findIndex((s) => s.id === criterion.stageId);
      const isCurrentStage = criterionStageIndex === effectiveStageIndex;
      const isPastStage = criterionStageIndex < effectiveStageIndex;
      const isHard = criterion.gateType === 'hard';

      let priority: Priority;
      if (isHard && isCurrentStage) priority = 'P1';
      else if (isHard && isPastStage) priority = 'P2';
      else if (!isHard && isCurrentStage) priority = 'P3';
      else priority = 'P4';

      const healthGain = isHard ? 5 : 2;
      const suggestedAction = waivedCriterionIds.has(criterion.id)
        ? `Obtain waiver for ${criterion.id}`
        : `Provide evidence for ${criterion.id}`;

      actions.push({
        priority,
        criterionName: criterion.id,
        stageId: criterion.stageId,
        gateType: isHard ? 'Hard' : 'Soft',
        healthGain,
        suggestedAction: `Provide evidence for ${criterion.id}`,
      });
    }

    if (actions.length === 0) continue;

    // Sort by priority, then health gain descending
    const PRIORITY_ORDER: Record<Priority, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
    actions.sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pd !== 0) return pd;
      return b.healthGain - a.healthGain;
    });

    const rawGain = actions.reduce((sum, a) => sum + a.healthGain, 0);
    const totalEstimatedGain = Math.min(rawGain, 100 - healthScore);

    instancePlans.push({
      instanceId: row.id,
      instanceName: row.label,
      healthScore,
      actions,
      totalEstimatedGain,
    });
  }

  // Sort by action count descending, take top 8
  instancePlans.sort((a, b) => b.actions.length - a.actions.length);

  const top8 = instancePlans.slice(0, 8);

  // Quick wins — same criterion unmet in ≥3 instances
  const criterionFreq = new Map<string, string[]>();
  for (const plan of instancePlans) {
    for (const action of plan.actions) {
      const existing = criterionFreq.get(action.criterionName) ?? [];
      existing.push(plan.instanceName);
      criterionFreq.set(action.criterionName, existing);
    }
  }

  const quickWins: QuickWin[] = Array.from(criterionFreq.entries())
    .filter(([, names]) => names.length >= 3)
    .map(([criterionName, instanceNames]) => ({
      criterionName,
      instanceCount: instanceNames.length,
      instanceNames,
    }))
    .sort((a, b) => b.instanceCount - a.instanceCount);

  // Critical path — lowest-health instance
  const lowestHealthPlan = instancePlans.length > 0
    ? instancePlans.reduce((min, p) => (p.healthScore < min.healthScore ? p : min), instancePlans[0])
    : null;

  // Summary stats
  const instancesWithCriticalBlockers = instancePlans.filter((p) =>
    p.actions.some((a) => a.priority === 'P1'),
  ).length;

  const totalUnmetHardGates = instancePlans.reduce(
    (sum, p) => sum + p.actions.filter((a) => a.gateType === 'Hard').length,
    0,
  );

  const totalRecoverablePoints = instancePlans.reduce(
    (sum, p) => sum + p.totalEstimatedGain,
    0,
  );

  return {
    instancesWithCriticalBlockers,
    totalUnmetHardGates,
    totalRecoverablePoints,
    instancePlans: top8,
    quickWins,
    criticalPathInstance: lowestHealthPlan,
  };
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  color: `${COLORS.ink}88`,
};

// ─── Summary strip ──────────────────────────────────────────────────────────────

function PlanSummaryStrip({
  instancesWithCriticalBlockers,
  totalUnmetHardGates,
  totalRecoverablePoints,
}: {
  instancesWithCriticalBlockers: number;
  totalUnmetHardGates: number;
  totalRecoverablePoints: number;
}) {
  const items = [
    {
      value: String(instancesWithCriticalBlockers),
      label: 'instances with critical blockers',
      color: SHELL.RUST_TEXT,
    },
    {
      value: String(totalUnmetHardGates),
      label: 'total unmet hard gates',
      color: SHELL.PEACH_TEXT,
    },
    {
      value: `+${totalRecoverablePoints}`,
      label: 'recoverable health points',
      color: SHELL.MINT_TEXT,
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
    </div>
  );
}

// ─── Priority badge ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const { bg, text } = PRIORITY_COLOR[priority];
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {priority} · {PRIORITY_LABEL[priority]}
    </span>
  );
}

// ─── Health score badge ─────────────────────────────────────────────────────────

function HealthScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? SHELL.MINT_TEXT :
    score >= 40 ? SHELL.PEACH_TEXT :
    SHELL.RUST_TEXT;
  const bg =
    score >= 70 ? SHELL.MINT_BG :
    score >= 40 ? SHELL.PEACH_BG :
    SHELL.RUST_BG;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {score}
    </span>
  );
}

// ─── Action table ───────────────────────────────────────────────────────────────

const ACTION_COL_WIDTHS = ['120px', '1fr', '100px', '70px', '80px', '2fr'];
const ACTION_COL_HEADERS = ['Priority', 'Gate', 'Stage', 'Type', 'Health gain', 'Suggested action'];

function ActionTable({ actions }: { actions: ActionItem[] }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        marginTop: SPACING.sm,
      }}
    >
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: ACTION_COL_WIDTHS.join(' '),
          padding: `8px ${SPACING.md}`,
          background: `${COLORS.ink}05`,
          borderBottom: `1px solid ${COLORS.ink}12`,
          gap: SPACING.sm,
          alignItems: 'center',
        }}
      >
        {ACTION_COL_HEADERS.map((h) => (
          <div key={h} style={HEADER_CELL}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {actions.map((action, i) => (
        <div
          key={`${action.criterionName}-${action.stageId}-${i}`}
          style={{
            display: 'grid',
            gridTemplateColumns: ACTION_COL_WIDTHS.join(' '),
            padding: `8px ${SPACING.md}`,
            borderBottom: i < actions.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
            background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          {/* Priority */}
          <div>
            <PriorityBadge priority={action.priority} />
          </div>

          {/* Gate name */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: COLORS.navy,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={action.criterionName}
          >
            {action.criterionName}
          </div>

          {/* Stage */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {action.stageId}
          </div>

          {/* Type */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              color: action.gateType === 'Hard' ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT,
            }}
          >
            {action.gateType}
          </div>

          {/* Health gain */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: SHELL.MINT_TEXT,
              fontWeight: 700,
            }}
          >
            +{action.healthGain} pts
          </div>

          {/* Suggested action */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}cc`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={action.suggestedAction}
          >
            {action.suggestedAction}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Per-instance plans ─────────────────────────────────────────────────────────

function PerInstancePlans({ plans }: { plans: InstancePlan[] }) {
  if (plans.length === 0) {
    return (
      <section
        style={{
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: SHELL.MINT_TEXT,
            margin: 0,
          }}
        >
          No unmet gates found
        </h2>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.MINT_TEXT,
            margin: `${SPACING.sm} 0 0`,
            lineHeight: 1.5,
          }}
        >
          All instances have satisfied their gate criteria — no remediation actions required.
        </p>
      </section>
    );
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
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
        Per-instance remediation plans
      </h2>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          marginTop: -12,
        }}
      >
        Top {plans.length} instances by unmet gate count — sorted by most unmet gates first.
      </div>

      {plans.map((plan) => {
        const targetHealth = Math.min(plan.healthScore + plan.totalEstimatedGain, 100);
        return (
          <div
            key={plan.instanceId}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.lg,
              overflow: 'hidden',
            }}
          >
            {/* Instance header */}
            <div
              style={{
                padding: `${SPACING.md} ${SPACING.lg}`,
                borderBottom: `1px solid ${COLORS.ink}10`,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLORS.ink,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={plan.instanceName}
                >
                  {plan.instanceName}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {plan.instanceId}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexShrink: 0 }}>
                <HealthScoreBadge score={plan.healthScore} />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  {plan.actions.length} unmet gate{plan.actions.length !== 1 ? 's' : ''} → estimated
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: SHELL.MINT_TEXT,
                  }}
                >
                  +{plan.totalEstimatedGain} pts
                </span>
              </div>
            </div>

            {/* Action table */}
            <div style={{ padding: `${SPACING.sm} ${SPACING.lg} ${SPACING.md}` }}>
              <ActionTable actions={plan.actions} />

              {/* Expected health after remediation */}
              <div
                style={{
                  marginTop: SPACING.sm,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}99`,
                  display: 'flex',
                  gap: 6,
                  alignItems: 'baseline',
                }}
              >
                <span>Expected health after remediation:</span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: SHELL.MINT_TEXT,
                  }}
                >
                  {targetHealth}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Quick wins ─────────────────────────────────────────────────────────────────

function QuickWinsCard({ quickWins }: { quickWins: QuickWin[] }) {
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
          Quick wins
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Gates unmet across 3+ instances — high-leverage criteria to address portfolio-wide.
        </div>
      </header>

      {quickWins.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}66`,
            fontStyle: 'italic',
          }}
        >
          No single gate is unmet across 3 or more instances.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {quickWins.map((win, i) => (
            <div
              key={win.criterionName}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `12px ${SPACING.lg}`,
                borderBottom: i < quickWins.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
                background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
                flexWrap: 'wrap',
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: `${COLORS.ink}55`,
                  fontWeight: 700,
                  minWidth: 24,
                  flexShrink: 0,
                }}
              >
                #{i + 1}
              </span>

              {/* Criterion */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  color: COLORS.navy,
                  fontWeight: 700,
                  background: `${COLORS.navy}12`,
                  borderRadius: RADIUS.sm,
                  padding: '3px 10px',
                  flexShrink: 0,
                }}
              >
                {win.criterionName}
              </span>

              {/* Summary sentence */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}cc`,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                Addressing{' '}
                <strong style={{ fontWeight: 700 }}>{win.criterionName}</strong>{' '}
                would unblock{' '}
                <strong style={{ fontWeight: 700 }}>
                  {win.instanceCount} instance{win.instanceCount !== 1 ? 's' : ''}
                </strong>
              </span>

              {/* Instance name list */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}77`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 300,
                  flexShrink: 0,
                }}
                title={win.instanceNames.join(', ')}
              >
                {win.instanceNames.join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Critical path ──────────────────────────────────────────────────────────────

function CriticalPathCard({ plan }: { plan: InstancePlan | null }) {
  if (plan === null) {
    return null;
  }

  const p1Actions = plan.actions.filter((a) => a.priority === 'P1');
  const p1Gain = Math.min(
    p1Actions.reduce((sum, a) => sum + a.healthGain, 0),
    100 - plan.healthScore,
  );
  const targetHealth = plan.healthScore + p1Gain;

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
          Critical path
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Most-impactful P1 gate sequence for the lowest-health instance.
        </div>
      </header>

      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        {/* Instance summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            For {plan.instanceName}:
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}88`,
            }}
          >
            Address P1 gates first → estimated health{' '}
            <strong style={{ fontFamily: TYPOGRAPHY.mono, color: SHELL.RUST_TEXT }}>
              {plan.healthScore}
            </strong>{' '}
            →{' '}
            <strong style={{ fontFamily: TYPOGRAPHY.mono, color: SHELL.MINT_TEXT }}>
              {targetHealth}
            </strong>
          </span>
        </div>

        {p1Actions.length === 0 ? (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: SHELL.MINT_TEXT,
              fontStyle: 'italic',
            }}
          >
            No P1 gates outstanding — this instance has no critical current-stage blockers.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p1Actions.map((action, i) => (
              <div
                key={`critical-${action.criterionName}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  padding: `8px ${SPACING.md}`,
                  background: i % 2 === 0 ? SHELL.RUST_BG : `${COLORS.ink}03`,
                  borderRadius: RADIUS.sm,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: SHELL.RUST_TEXT,
                    fontWeight: 700,
                    minWidth: 20,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}.
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: COLORS.navy,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {action.criterionName}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}aa`,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {action.suggestedAction}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: SHELL.MINT_TEXT,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  +{action.healthGain} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateRemediationPlanPage() {
  const data = buildRemediationData();

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
        title="Gate Remediation Plan"
        subtitle="Prioritized action plans per instance — which gates to address first for maximum health impact"
      >
        <PlanSummaryStrip
          instancesWithCriticalBlockers={data.instancesWithCriticalBlockers}
          totalUnmetHardGates={data.totalUnmetHardGates}
          totalRecoverablePoints={data.totalRecoverablePoints}
        />
        <PerInstancePlans plans={data.instancePlans} />
        <QuickWinsCard quickWins={data.quickWins} />
        <CriticalPathCard plan={data.criticalPathInstance} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

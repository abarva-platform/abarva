// /admin/reasoning/stage-completion-forecast — Velocity-based stage completion forecast.
//
// Pure server component. Projects when each instance will complete its remaining
// lifecycle stages using gate velocity and dwell time as inputs.
//
// Sections:
//   FleetSummary          — 3 summary cards: on-track / at-risk / avg days to completion
//   InstanceForecastTable — per-instance: current stage, stages remaining, days/stage, est. completion, confidence
//   GanttLite             — top-5 by stages remaining; horizontal stage block strips
//   CompletionDistribution — group instances by projected completion quarter

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stage Completion Forecast · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_DAYS_PER_STAGE = 14;
const START_DATE = new Date('2025-11-01');
const MAX_STAGES = 8;

// ─── Forecast helpers ─────────────────────────────────────────────────────────

function velocityMultiplier(healthScore: number): number {
  if (healthScore >= 75) return 0.7;
  if (healthScore >= 55) return 1.0;
  if (healthScore >= 35) return 1.4;
  return 1.8;
}

function contradictionPenalty(contradictions: number): number {
  return contradictions * 3;
}

function computeDaysPerStage(healthScore: number, contradictions: number): number {
  return Math.round(
    BASE_DAYS_PER_STAGE * velocityMultiplier(healthScore) +
      contradictionPenalty(contradictions),
  );
}

function computeHealthScore(gatesMet: number, gatesTotal: number, activeContradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
      (1 - Math.min(activeContradictions / 5, 1)) * 30 +
      10,
  );
}

function completionConfidence(daysPerStage: number): 'Fast' | 'Normal' | 'Slow' | 'Stalled' {
  if (daysPerStage <= 10) return 'Fast';
  if (daysPerStage <= 18) return 'Normal';
  if (daysPerStage <= 28) return 'Slow';
  return 'Stalled';
}

function confidenceColor(confidence: 'Fast' | 'Normal' | 'Slow' | 'Stalled'): { color: string; bg: string } {
  switch (confidence) {
    case 'Fast':    return { color: COLORS.mintInk,   bg: COLORS.mintSoft };
    case 'Normal':  return { color: COLORS.amberInk,  bg: COLORS.amberSoft };
    case 'Slow':    return { color: '#b26200',         bg: '#fff1e0' };
    case 'Stalled': return { color: COLORS.coralInk,  bg: COLORS.coralSoft };
  }
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function completionQuarter(d: Date): string {
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  if (y >= 2027) return '2027+';
  return `Q${q} ${y}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForecastInstance {
  id: string;
  name: string;
  type: 'source' | 'program';
  currentStage: string;
  stageIndex: number;
  stagesRemaining: number;
  remainingStageLabels: string[];
  healthScore: number;
  daysPerStage: number;
  totalProjectedDays: number;
  estCompletionDate: Date;
  confidence: 'Fast' | 'Normal' | 'Slow' | 'Stalled';
  quarter: string;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function buildForecastInstances(): ForecastInstance[] {
  const healthRows = buildHealthBoardRows();
  const patterns = getAllLifecyclePatterns();
  const allStages = (patterns[0]?.stages ?? []).slice(0, MAX_STAGES);
  const allStageLabels = allStages.map((s) => s.label);

  // Build stage-index and stage-name maps from source instances
  const srcCurrentStage = new Map<string, string>();
  const srcStageIndex = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const history = (inst.stageHistory ?? []) as Array<{ stageId: string }>;
    const completed = history.length;
    srcStageIndex.set(inst.id, completed);
    const patternObj = patterns.find((p) => p.patternId === inst.patternId);
    const stages = patternObj ? patternObj.stages.slice(0, MAX_STAGES) : allStages;
    const currentStageObj = stages[completed] ?? stages[stages.length - 1];
    srcCurrentStage.set(inst.id, currentStageObj?.label ?? 'Unknown');
  }

  // Build stage-index and stage-name maps from program instances
  const prgCurrentStage = new Map<string, string>();
  const prgStageIndex = new Map<string, number>();
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    prgStageIndex.set(inst.id, inst.currentPhase ?? 0);
    const phases = inst.phases as Array<{ phaseId: number; phaseLabel?: string }>;
    const currentPhaseObj = phases.find((p) => p.phaseId === (inst.currentPhase ?? 0));
    prgCurrentStage.set(
      inst.id,
      currentPhaseObj?.phaseLabel
        ? `P${currentPhaseObj.phaseId} ${currentPhaseObj.phaseLabel}`
        : `Phase ${inst.currentPhase ?? 0}`,
    );
  }

  const result: ForecastInstance[] = [];

  for (const hr of healthRows) {
    const healthScore = computeHealthScore(hr.gatesMet, hr.gatesTotal, hr.activeContradictions);
    const daysPerStage = computeDaysPerStage(healthScore, hr.activeContradictions);

    const stageIndex =
      hr.type === 'source'
        ? (srcStageIndex.get(hr.id) ?? 0)
        : (prgStageIndex.get(hr.id) ?? 0);

    const currentStage =
      hr.type === 'source'
        ? (srcCurrentStage.get(hr.id) ?? hr.stageLabel ?? 'Unknown')
        : (prgCurrentStage.get(hr.id) ?? hr.phaseLabel ?? 'Unknown');

    const stagesRemaining = Math.max(0, MAX_STAGES - stageIndex);
    const remainingStageLabels = allStageLabels.slice(stageIndex, stageIndex + stagesRemaining);

    const elapsed = stageIndex * daysPerStage;
    const totalProjectedDays = elapsed + stagesRemaining * daysPerStage;

    const estCompletionDate = new Date(
      START_DATE.getTime() + totalProjectedDays * 86_400_000,
    );

    result.push({
      id: hr.id,
      name: hr.label,
      type: hr.type,
      currentStage,
      stageIndex,
      stagesRemaining,
      remainingStageLabels,
      healthScore,
      daysPerStage,
      totalProjectedDays,
      estCompletionDate,
      confidence: completionConfidence(daysPerStage),
      quarter: completionQuarter(estCompletionDate),
    });
  }

  // Sort by stages remaining descending, then alphabetically
  result.sort((a, b) => b.stagesRemaining - a.stagesRemaining || a.name.localeCompare(b.name));

  return result;
}

// ─── Cell styles ─────────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
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

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── FleetSummary ─────────────────────────────────────────────────────────────

function FleetSummary({ instances }: { instances: ForecastInstance[] }) {
  const onTrack = instances.filter(
    (i) => i.stagesRemaining * i.daysPerStage <= 120,
  ).length;
  const atRisk = instances.filter(
    (i) => i.stagesRemaining * i.daysPerStage > 180,
  ).length;
  const avgDays =
    instances.length > 0
      ? Math.round(
          instances.reduce((s, i) => s + i.totalProjectedDays, 0) / instances.length,
        )
      : 0;

  const cards: Array<{ label: string; value: string | number; color: string; bg: string; sub: string }> = [
    {
      label: 'On track',
      value: onTrack,
      color: COLORS.mintInk,
      bg: COLORS.mintSoft,
      sub: 'complete within 120 days',
    },
    {
      label: 'At risk',
      value: atRisk,
      color: COLORS.coralInk,
      bg: COLORS.coralSoft,
      sub: 'projected > 180 days',
    },
    {
      label: 'Avg days to completion',
      value: `${avgDays}d`,
      color: COLORS.navy,
      bg: COLORS.skyPale,
      sub: 'across all instances',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: SPACING.md,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: c.bg,
            border: `1px solid ${c.color}22`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: c.color,
              fontWeight: 700,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 34,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginTop: 6,
            }}
          >
            {c.value}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── InstanceForecastTable ────────────────────────────────────────────────────

function InstanceForecastTable({ instances }: { instances: ForecastInstance[] }) {
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
            Instance forecast
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Velocity-adjusted projected completion per instance — sorted by stages remaining
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {instances.length} instance{instances.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Current stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Stages left</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Days/stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Est. completion</th>
              <th style={HEADER_CELL}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((inst) => {
              const { color, bg } = confidenceColor(inst.confidence);
              return (
                <tr key={inst.id}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <a
                        href={`/admin/reasoning/instances/${inst.id}`}
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.navy,
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        {inst.name}
                      </a>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}55`,
                        }}
                      >
                        {inst.type}
                      </span>
                    </div>
                  </td>

                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: `${COLORS.ink}08`,
                        color: COLORS.ink,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {inst.currentStage}
                    </span>
                  </td>

                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>
                    {inst.stagesRemaining}
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      fontWeight: 700,
                      color:
                        inst.daysPerStage <= 10
                          ? COLORS.mintInk
                          : inst.daysPerStage > 28
                            ? COLORS.coralInk
                            : `${COLORS.ink}cc`,
                    }}
                  >
                    {inst.daysPerStage}d
                  </td>

                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>
                    {fmtMonth(inst.estCompletionDate)}
                  </td>

                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: bg,
                        color,
                        borderRadius: RADIUS.pill,
                        padding: '3px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {inst.confidence}
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

// ─── GanttLite ────────────────────────────────────────────────────────────────

function GanttLite({ instances }: { instances: ForecastInstance[] }) {
  // Top 5 by stages remaining
  const top5 = instances.slice(0, 5);
  if (top5.length === 0) return null;

  const BLOCK_WIDTH_PX = 48; // base width per stage block

  const STAGE_COLORS = [
    COLORS.skyPale,
    COLORS.mintSoft,
    COLORS.amberSoft,
    '#e8e0f8',
    '#d8eef8',
    COLORS.coralSoft,
    '#f0f8e0',
    '#f8f0e0',
  ];

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
          Gantt-lite
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Top 5 instances by stages remaining — each block = 1 remaining stage (width proportional to days/stage)
        </div>
      </header>

      <div style={{ padding: `${SPACING.md} ${SPACING.lg}`, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {top5.map((inst) => (
          <div
            key={inst.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            {/* Row header */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.ink,
                width: 200,
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={inst.name}
            >
              {inst.name}
            </span>

            {/* Stage blocks */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
              {inst.remainingStageLabels.map((stageName, i) => (
                <div
                  key={`${inst.id}-stage-${i}`}
                  style={{
                    width: Math.round(BLOCK_WIDTH_PX * (inst.daysPerStage / BASE_DAYS_PER_STAGE)),
                    minWidth: 32,
                    height: 28,
                    background: STAGE_COLORS[i % STAGE_COLORS.length],
                    borderRadius: RADIUS.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  title={stageName}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 9,
                      color: `${COLORS.ink}99`,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      padding: '0 4px',
                    }}
                  >
                    {stageName.slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total projected days */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {inst.stagesRemaining * inst.daysPerStage}d total
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CompletionDistribution ───────────────────────────────────────────────────

function CompletionDistribution({ instances }: { instances: ForecastInstance[] }) {
  const QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', '2027+'];

  const QUARTER_COLORS: Record<string, { color: string; bg: string }> = {
    'Q1 2026': { color: COLORS.mintInk,  bg: COLORS.mintSoft },
    'Q2 2026': { color: COLORS.mintInk,  bg: COLORS.mintSoft },
    'Q3 2026': { color: COLORS.amberInk, bg: COLORS.amberSoft },
    'Q4 2026': { color: COLORS.amberInk, bg: COLORS.amberSoft },
    '2027+':   { color: COLORS.coralInk, bg: COLORS.coralSoft },
  };

  const counts = QUARTERS.map((q) => ({
    quarter: q,
    count: instances.filter((i) => i.quarter === q).length,
    ...QUARTER_COLORS[q],
  }));

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

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
          Completion date distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Instances grouped by projected completion quarter — earlier is better
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: SPACING.lg,
        }}
      >
        {counts.map((c) => {
          const barHeight = c.count > 0 ? Math.max(24, Math.round((c.count / maxCount) * 120)) : 8;
          return (
            <div
              key={c.quarter}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: SPACING.sm,
                flex: 1,
              }}
            >
              {/* Count label */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 22,
                  color: c.count > 0 ? c.color : `${COLORS.ink}33`,
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}
              >
                {c.count}
              </span>

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 80,
                  height: barHeight,
                  background: c.count > 0 ? c.bg : `${COLORS.ink}0a`,
                  border: `1px solid ${c.count > 0 ? c.color : COLORS.ink}22`,
                  borderRadius: RADIUS.sm,
                }}
              />

              {/* Quarter label */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: c.count > 0 ? c.color : `${COLORS.ink}55`,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {c.quarter}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StageCompletionForecastPage() {
  const instances = buildForecastInstances();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Lifecycle"
        title="Stage Completion Forecast"
        subtitle="Projected stage completion timeline — velocity-based forecasts for remaining lifecycle stages"
      >
        <FleetSummary instances={instances} />
        <InstanceForecastTable instances={instances} />
        <GanttLite instances={instances} />
        <CompletionDistribution instances={instances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

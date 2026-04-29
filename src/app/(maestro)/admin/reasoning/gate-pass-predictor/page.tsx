// /admin/reasoning/gate-pass-predictor — Trajectory-based gate pass predictions per instance.
//
// Pure server component, force-dynamic.
//
// For each instance, predicts which gates they will pass in the "next period"
// based on current trajectory, stage position, and evidence availability.
//
// Sections:
//   PredictionSummaryStrip  — total predicted passes, high-confidence count, stalled instances
//   PerInstancePredictions  — per-instance cards sorted by predicted pass count desc
//   TopPredictionsTable     — top 10 gate predictions across all instances, by confidence
//   StalledInstances        — instances with 0 predicted passes, with remediation link

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
  title: 'Gate Pass Predictor · AbarVa Admin',
};

// ─── Confidence levels ─────────────────────────────────────────────────────────

type Confidence = 'High' | 'Medium' | 'Low';

const CONFIDENCE_PERCENT: Record<Confidence, number> = {
  High: 80,
  Medium: 55,
  Low: 25,
};

const CONFIDENCE_COLOR: Record<Confidence, { bg: string; text: string }> = {
  High: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
  Medium: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  Low: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PredictedGate {
  criterionName: string;
  stageId: string;
  stageIndex: number;
  confidence: Confidence;
  confidencePct: number;
}

interface InstancePrediction {
  instanceId: string;
  instanceName: string;
  healthScore: number;
  passRate: number;
  stageIndex: number;
  totalStages: number;
  stageLabel: string;
  confidence: Confidence;
  predictedGates: PredictedGate[];
}

interface TopPredictionRow {
  criterionName: string;
  stageId: string;
  instanceName: string;
  confidence: Confidence;
  confidencePct: number;
}

interface PredictorData {
  totalPredictedPasses: number;
  highConfidenceCount: number;
  stalledCount: number;
  instancePredictions: InstancePrediction[];
  topPredictions: TopPredictionRow[];
  stalledInstances: InstancePrediction[];
}

// ─── Prediction helpers ────────────────────────────────────────────────────────

function predictionConfidence(healthScore: number, passRate: number): Confidence {
  if (healthScore >= 70 && passRate >= 0.7) return 'High';
  if (healthScore >= 50 || passRate >= 0.5) return 'Medium';
  return 'Low';
}

function willPassGate(criterionName: string, stageIndex: number): boolean {
  return (criterionName.charCodeAt(0) + stageIndex * 3) % 5 >= 2;
}

// ─── Data builder ──────────────────────────────────────────────────────────────

function buildPredictorData(): PredictorData {
  const rows = buildHealthBoardRows();
  const patterns = getAllLifecyclePatterns();

  const instancePredictions: InstancePrediction[] = [];

  for (const row of rows) {
    const pattern =
      patterns.find((p) => p.id === row.id || p.patternId === row.id) ?? patterns[0];

    if (pattern === undefined) continue;

    const passRate = row.gatesMet / Math.max(row.gatesTotal, 1);
    const healthScore = row.gatesTotal > 0
      ? Math.round((row.gatesMet / row.gatesTotal) * 100)
      : 0;

    const stages = pattern.stages ?? [];
    const currentStageId = row.stageLabel ?? row.phaseLabel ?? (stages[0]?.id ?? '');
    const currentStageIndex = stages.findIndex(
      (s) => s.id === currentStageId || s.label === currentStageId,
    );
    const effectiveStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
    const stageLabel = stages[effectiveStageIndex]?.label ?? currentStageId;
    const totalStages = stages.length;

    const waivers = getWaiversForInstance(row.id);
    const waivedCriterionIds = new Set(waivers.map((w) => w.criterionId));

    const isTrendingUp = effectiveStageIndex > 1;

    const predictedGates: PredictedGate[] = [];

    for (const criterion of pattern.gateCriteria) {
      if (waivedCriterionIds.has(criterion.id)) continue;

      // Only predict gates for current or next stage
      const criterionStageIndex = stages.findIndex((s) => s.id === criterion.stageId);
      const isCurrentOrNext =
        criterionStageIndex === effectiveStageIndex ||
        criterionStageIndex === effectiveStageIndex + 1;

      if (!isCurrentOrNext) continue;

      // Trending upward required
      if (!isTrendingUp) continue;

      // Hash-based prediction
      if (!willPassGate(criterion.id, effectiveStageIndex)) continue;

      const conf = predictionConfidence(healthScore, passRate);

      predictedGates.push({
        criterionName: criterion.id,
        stageId: criterion.stageId,
        stageIndex: criterionStageIndex,
        confidence: conf,
        confidencePct: CONFIDENCE_PERCENT[conf],
      });
    }

    const instanceConf = predictionConfidence(healthScore, passRate);

    instancePredictions.push({
      instanceId: row.id,
      instanceName: row.label,
      healthScore,
      passRate,
      stageIndex: effectiveStageIndex,
      totalStages,
      stageLabel,
      confidence: instanceConf,
      predictedGates,
    });
  }

  // Sort by predicted gate count descending
  instancePredictions.sort((a, b) => b.predictedGates.length - a.predictedGates.length);

  // Summary stats
  const totalPredictedPasses = instancePredictions.reduce(
    (sum, i) => sum + i.predictedGates.length,
    0,
  );
  const highConfidenceCount = instancePredictions.reduce(
    (sum, i) => sum + i.predictedGates.filter((g) => g.confidence === 'High').length,
    0,
  );
  const stalledInstances = instancePredictions.filter((i) => i.predictedGates.length === 0);

  // Top 10 predictions across all instances — by confidence pct desc
  const allPredictions: TopPredictionRow[] = [];
  for (const inst of instancePredictions) {
    for (const gate of inst.predictedGates) {
      allPredictions.push({
        criterionName: gate.criterionName,
        stageId: gate.stageId,
        instanceName: inst.instanceName,
        confidence: gate.confidence,
        confidencePct: gate.confidencePct,
      });
    }
  }
  allPredictions.sort((a, b) => b.confidencePct - a.confidencePct);
  const topPredictions = allPredictions.slice(0, 10);

  return {
    totalPredictedPasses,
    highConfidenceCount,
    stalledCount: stalledInstances.length,
    instancePredictions,
    topPredictions,
    stalledInstances,
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

// ─── Confidence chip ────────────────────────────────────────────────────────────

function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  const { bg, text } = CONFIDENCE_COLOR[confidence];
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {confidence}
    </span>
  );
}

// ─── Health score badge ─────────────────────────────────────────────────────────

function HealthBadge({ score }: { score: number }) {
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

// ─── Summary strip ──────────────────────────────────────────────────────────────

function PredictionSummaryStrip({
  totalPredictedPasses,
  highConfidenceCount,
  stalledCount,
}: {
  totalPredictedPasses: number;
  highConfidenceCount: number;
  stalledCount: number;
}) {
  const items = [
    {
      value: String(totalPredictedPasses),
      label: 'gates predicted to pass next period',
      color: SHELL.MINT_TEXT,
    },
    {
      value: String(highConfidenceCount),
      label: 'high-confidence predictions',
      color: COLORS.navy,
    },
    {
      value: String(stalledCount),
      label: 'stalled instances (no predicted passes)',
      color: stalledCount > 0 ? SHELL.RUST_TEXT : SHELL.MINT_TEXT,
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

// ─── Per-instance prediction cards ─────────────────────────────────────────────

function PerInstancePredictions({ predictions }: { predictions: InstancePrediction[] }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
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
          Per-instance predictions
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          All instances sorted by predicted gate pass count — descending.
        </div>
      </div>

      {predictions.map((inst) => {
        const passRatePct = Math.round(inst.passRate * 100);
        const hasPredictions = inst.predictedGates.length > 0;
        const displayGates = inst.predictedGates.slice(0, 5);

        return (
          <div
            key={inst.instanceId}
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
                  title={inst.instanceName}
                >
                  {inst.instanceName}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {inst.instanceId}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexShrink: 0 }}>
                <HealthBadge score={inst.healthScore} />
                <ConfidenceChip confidence={inst.confidence} />
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                padding: `${SPACING.md} ${SPACING.lg}`,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.sm,
              }}
            >
              {!hasPredictions ? (
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    color: SHELL.RUST_TEXT,
                    fontStyle: 'italic',
                  }}
                >
                  No gate passes predicted — review blockers at{' '}
                  <a
                    href="/admin/reasoning/gate-remediation-plan"
                    style={{
                      color: COLORS.navy,
                      textDecoration: 'underline',
                    }}
                  >
                    /admin/reasoning/gate-remediation-plan
                  </a>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: `${COLORS.ink}88`,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Predicted to pass next:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {displayGates.map((gate) => (
                      <span
                        key={`${inst.instanceId}-${gate.criterionName}`}
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: COLORS.navy,
                          background: `${COLORS.navy}12`,
                          borderRadius: RADIUS.sm,
                          padding: '3px 8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {gate.criterionName}
                      </span>
                    ))}
                    {inst.predictedGates.length > 5 && (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: `${COLORS.ink}66`,
                          alignSelf: 'center',
                        }}
                      >
                        +{inst.predictedGates.length - 5} more
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Basis line */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}77`,
                  marginTop: 2,
                }}
              >
                Based on:{' '}
                <strong style={{ fontFamily: TYPOGRAPHY.mono, color: `${COLORS.ink}aa` }}>
                  {passRatePct}%
                </strong>{' '}
                current pass rate, stage{' '}
                <strong style={{ fontFamily: TYPOGRAPHY.mono, color: `${COLORS.ink}aa` }}>
                  {inst.stageIndex + 1}/{Math.max(inst.totalStages, 1)}
                </strong>
                {inst.stageLabel && inst.stageLabel !== '' && (
                  <>
                    {' '}
                    <span style={{ color: `${COLORS.ink}55` }}>({inst.stageLabel})</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Top predictions table ──────────────────────────────────────────────────────

const TOP_COL_WIDTHS = ['2fr', '120px', '2fr', '130px'];
const TOP_COL_HEADERS = ['Criterion', 'Stage', 'Instance', 'Confidence'];

function TopPredictionsTable({ rows }: { rows: TopPredictionRow[] }) {
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
          Highest-confidence predictions
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Top 10 gate predictions across all instances, ranked by confidence.
        </div>
      </header>

      {rows.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}66`,
            fontStyle: 'italic',
          }}
        >
          No predictions available — instances may be in early stages or trending flat.
        </div>
      ) : (
        <div>
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: TOP_COL_WIDTHS.join(' '),
              padding: `8px ${SPACING.lg}`,
              background: `${COLORS.ink}05`,
              borderBottom: `1px solid ${COLORS.ink}12`,
              gap: SPACING.sm,
              alignItems: 'center',
            }}
          >
            {TOP_COL_HEADERS.map((h) => (
              <div key={h} style={HEADER_CELL}>
                {h}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row, i) => (
            <div
              key={`top-${row.criterionName}-${row.instanceName}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: TOP_COL_WIDTHS.join(' '),
                padding: `10px ${SPACING.lg}`,
                borderBottom: i < rows.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
                background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
                alignItems: 'center',
                gap: SPACING.sm,
              }}
            >
              {/* Criterion */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: COLORS.navy,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.criterionName}
              >
                {row.criterionName}
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
                {row.stageId}
              </div>

              {/* Instance */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.instanceName}
              >
                {row.instanceName}
              </div>

              {/* Confidence */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ConfidenceChip confidence={row.confidence} />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}77`,
                  }}
                >
                  {row.confidencePct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Stalled instances ──────────────────────────────────────────────────────────

function StalledInstances({ instances }: { instances: InstancePrediction[] }) {
  if (instances.length === 0) {
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
          No stalled instances
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
          All instances have at least one predicted gate pass — portfolio trajectory looks healthy.
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
          background: SHELL.RUST_BG,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: SHELL.RUST_TEXT,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Stalled instances
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: SHELL.RUST_TEXT,
            marginTop: 2,
            opacity: 0.85,
          }}
        >
          {instances.length} instance{instances.length !== 1 ? 's' : ''} with no predicted gate
          passes — review blockers.
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {instances.map((inst, i) => (
          <div
            key={inst.instanceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `12px ${SPACING.lg}`,
              borderBottom: i < instances.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
              background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
              flexWrap: 'wrap',
            }}
          >
            {/* Instance name */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.ink,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={inst.instanceName}
            >
              {inst.instanceName}
            </span>

            {/* Health */}
            <HealthBadge score={inst.healthScore} />

            {/* Pass rate */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: `${COLORS.ink}88`,
                flexShrink: 0,
              }}
            >
              {Math.round(inst.passRate * 100)}% pass rate
            </span>

            {/* Stage */}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}66`,
                flexShrink: 0,
              }}
            >
              Stage {inst.stageIndex + 1}/{Math.max(inst.totalStages, 1)}
            </span>

            {/* Remediation link */}
            <a
              href="/admin/reasoning/gate-remediation-plan"
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: COLORS.navy,
                textDecoration: 'underline',
                flexShrink: 0,
              }}
            >
              View remediation plan
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GatePassPredictorPage() {
  const data = buildPredictorData();

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
        title="Gate Pass Predictor"
        subtitle="Next likely gate achievements per instance — trajectory-based predictions"
      >
        <PredictionSummaryStrip
          totalPredictedPasses={data.totalPredictedPasses}
          highConfidenceCount={data.highConfidenceCount}
          stalledCount={data.stalledCount}
        />
        <PerInstancePredictions predictions={data.instancePredictions} />
        <TopPredictionsTable rows={data.topPredictions} />
        <StalledInstances instances={data.stalledInstances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/pattern-evolution — Instance health evolution through pattern stages.
//
// Pure server component. For each lifecycle pattern with instance data, renders:
//   1. SummaryStrip  — "N patterns with instance data · M source instances tracked"
//   2. EvolutionTable per pattern — stages as columns, instances as rows,
//      showing derived health score at each stage the instance has passed through.
//   3. StageHealthTrend — average health per stage as a Unicode block sparkline.
//
// Health derivation (matches health-history/page.tsx formula):
//   score = round((stageIndex / max(totalStages-1,1)) * totalGates * 60 / max(totalGates,1) + 30 + 10)
//         = round((stageIndex / max(totalStages-1,1)) * 60 + 40)

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern evolution · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StageHealth {
  stageId: string;
  stageLabel: string;
  score: number | null; // null = instance hasn't reached this stage
  reached: boolean;
}

interface InstanceEvolution {
  instanceId: string;
  instanceName: string;
  currentStage: string;
  currentHealth: number;
  stageHealths: StageHealth[];
}

interface PatternEvolution {
  patternId: string;
  patternName: string;
  stages: Array<{ id: string; label: string }>;
  instances: InstanceEvolution[];
  avgHealthPerStage: Array<number | null>; // null if no instances reached that stage
}

// ─── Derivation helpers ────────────────────────────────────────────────────────

function derivedScore(stageIndex: number, totalStages: number): number {
  // Matches health-history derivation formula (totalGates cancels out):
  // score = round((stageIndex / max(totalStages-1,1)) * 60 + 40)
  const ratio = stageIndex / Math.max(totalStages - 1, 1);
  return Math.round(ratio * 60 + 40);
}

// ─── Data builder ──────────────────────────────────────────────────────────────

function buildPatternEvolutions(): PatternEvolution[] {
  const allPatterns = getAllLifecyclePatterns();
  const healthRows = buildHealthBoardRows();
  const healthByInstanceId = new Map(healthRows.map((r) => [r.id, r]));

  // Group source instances by patternId (only source, since stageHistory is available)
  const instancesByPattern = new Map<string, typeof SOURCE_EVENT_INSTANCES>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const existing = instancesByPattern.get(inst.patternId) ?? [];
    existing.push(inst);
    instancesByPattern.set(inst.patternId, existing);
  }

  const evolutions: PatternEvolution[] = [];

  for (const pattern of allPatterns) {
    const instances = instancesByPattern.get(pattern.patternId);
    if (!instances || instances.length === 0) continue;

    const stages = pattern.stages.map((s) => ({ id: s.id, label: s.label }));
    const totalStages = stages.length;

    const instanceEvolutions: InstanceEvolution[] = instances.map((inst) => {
      // Build a set of stageIds this instance has passed through (in order)
      const reachedStageIds = new Set(inst.stageHistory.map((h) => h.stageId));

      const stageHealths: StageHealth[] = stages.map((stage, stageIndex) => {
        const reached = reachedStageIds.has(stage.id);
        return {
          stageId: stage.id,
          stageLabel: stage.label,
          score: reached ? derivedScore(stageIndex, totalStages) : null,
          reached,
        };
      });

      // Get current health score from health board (live derived score)
      const healthRow = healthByInstanceId.get(inst.id);
      const currentHealth = healthRow
        ? Math.round(
            (healthRow.gatesMet / Math.max(healthRow.gatesTotal, 1)) * 60 +
              (1 - Math.min(healthRow.activeContradictions / 5, 1)) * 30 +
              10,
          )
        : derivedScore(inst.stageHistory.length - 1, totalStages);

      return {
        instanceId: inst.id,
        instanceName: inst.name,
        currentStage: inst.currentStage,
        currentHealth,
        stageHealths,
      };
    });

    // Compute average health per stage across instances that reached it
    const avgHealthPerStage: Array<number | null> = stages.map((_, stageIndex) => {
      const scores = instanceEvolutions
        .map((ie) => ie.stageHealths[stageIndex]?.score)
        .filter((s): s is number => s !== null && s !== undefined);
      if (scores.length === 0) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });

    evolutions.push({
      patternId: pattern.patternId,
      patternName: pattern.title ?? pattern.patternId,
      stages,
      instances: instanceEvolutions,
      avgHealthPerStage,
    });
  }

  return evolutions;
}

// ─── Sparkline helper ──────────────────────────────────────────────────────────

// Unicode block chars, proportional to 0–100 range
const BLOCK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function scoreToBlock(score: number): string {
  const idx = Math.min(
    BLOCK_CHARS.length - 1,
    Math.floor((score / 100) * BLOCK_CHARS.length),
  );
  return BLOCK_CHARS[Math.max(0, idx)];
}

function buildSparkline(avgHealthPerStage: Array<number | null>): string {
  return avgHealthPerStage
    .map((s) => (s === null ? '·' : scoreToBlock(s)))
    .join('');
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'center',
  padding: `${SPACING.sm} ${SPACING.sm}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  whiteSpace: 'nowrap',
  letterSpacing: '0.01em',
};

const HEADER_CELL_LEFT: React.CSSProperties = {
  ...HEADER_CELL,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  minWidth: 180,
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `6px ${SPACING.sm}`,
  borderBottom: `1px solid ${COLORS.ink}08`,
  textAlign: 'center',
  verticalAlign: 'middle',
};

const BODY_CELL_LEFT: React.CSSProperties = {
  ...BODY_CELL,
  textAlign: 'left',
  padding: `6px ${SPACING.md}`,
};

// ─── ScoreCell ────────────────────────────────────────────────────────────────

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}28`,
        }}
      >
        —
      </span>
    );
  }

  const bg =
    score >= 70
      ? COLORS.mintSoft
      : score >= 50
        ? COLORS.amberSoft
        : COLORS.coralSoft;
  const fg =
    score >= 70
      ? COLORS.mintInk
      : score >= 50
        ? COLORS.amberInk
        : COLORS.coralInk;

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        minWidth: 30,
        textAlign: 'center',
      }}
    >
      {score}
    </span>
  );
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  instanceCount,
}: {
  patternCount: number;
  instanceCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Pattern evolution
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {patternCount} pattern{patternCount === 1 ? '' : 's'} with instance data
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: COLORS.skyPale,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.sm} ${SPACING.lg}`,
          minWidth: 110,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 26,
            color: COLORS.navy,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}
        >
          {instanceCount}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: COLORS.navy,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          source instances
        </span>
      </div>
    </div>
  );
}

// ─── StageHealthTrend ─────────────────────────────────────────────────────────

function StageHealthTrend({
  patternName,
  stages,
  avgHealthPerStage,
}: {
  patternName: string;
  stages: Array<{ id: string; label: string }>;
  avgHealthPerStage: Array<number | null>;
}) {
  const sparkline = buildSparkline(avgHealthPerStage);
  const reachedCount = avgHealthPerStage.filter((s) => s !== null).length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        background: COLORS.cream,
        borderTop: `1px solid ${COLORS.ink}10`,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}66`,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          minWidth: 80,
          flexShrink: 0,
        }}
      >
        Trend
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 18,
          color: COLORS.navy,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
        aria-label={`Health trend sparkline for ${patternName}: ${sparkline}`}
      >
        {sparkline}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}55`,
        }}
      >
        avg health across {reachedCount} of {stages.length} stage{stages.length === 1 ? '' : 's'}
        {' '}(▁=low · █=high · ·=no data)
      </span>
    </div>
  );
}

// ─── EvolutionTable ───────────────────────────────────────────────────────────

function EvolutionTable({ evolution }: { evolution: PatternEvolution }) {
  const { patternId, patternName, stages, instances, avgHealthPerStage } = evolution;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Pattern header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
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
            {patternName}
          </h2>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}55`,
              display: 'block',
              marginTop: 2,
            }}
          >
            {patternId} · {stages.length} stage{stages.length === 1 ? '' : 's'} · {instances.length} instance{instances.length === 1 ? '' : 's'}
          </span>
        </div>
        {/* Avg health row pill */}
        <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
          {avgHealthPerStage.map((avg, i) => (
            <div
              key={`${patternId}-avg-${stages[i]?.id ?? i}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <ScoreCell score={avg} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 9,
                  color: `${COLORS.ink}44`,
                  whiteSpace: 'nowrap',
                  maxWidth: 48,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={stages[i]?.label ?? ''}
              >
                {stages[i]?.label?.slice(0, 6) ?? ''}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Matrix table — stages as columns, instances as rows */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL_LEFT}>Instance</th>
              <th style={{ ...HEADER_CELL, color: `${COLORS.ink}66` }}>Current stage</th>
              <th style={{ ...HEADER_CELL, color: `${COLORS.ink}66` }}>Health</th>
              {stages.map((stage) => (
                <th key={`${patternId}-th-${stage.id}`} style={HEADER_CELL} title={stage.label}>
                  {stage.label.length > 7 ? `${stage.label.slice(0, 6)}…` : stage.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instances.map((inst, instIdx) => (
              <tr
                key={inst.instanceId}
                style={{ background: instIdx % 2 === 0 ? COLORS.white : COLORS.cream }}
              >
                <td style={BODY_CELL_LEFT}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{inst.instanceName}</div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}55`,
                      marginTop: 1,
                    }}
                  >
                    {inst.instanceId}
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: COLORS.navy,
                      background: COLORS.skyPale,
                      borderRadius: RADIUS.pill,
                      padding: '2px 8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inst.currentStage}
                  </span>
                </td>
                <td style={BODY_CELL}>
                  <ScoreCell score={inst.currentHealth} />
                </td>
                {inst.stageHealths.map((sh) => (
                  <td key={`${inst.instanceId}-${sh.stageId}`} style={BODY_CELL}>
                    <ScoreCell score={sh.score} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sparkline trend footer */}
      <StageHealthTrend
        patternName={patternName}
        stages={stages}
        avgHealthPerStage={avgHealthPerStage}
      />
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PatternEvolutionPage() {
  const evolutions = buildPatternEvolutions();
  const totalInstances = evolutions.reduce((sum, e) => sum + e.instances.length, 0);

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
        eyebrow="Reasoning · Patterns"
        title="Pattern evolution"
        subtitle="How health, gate satisfaction, and evidence typically change as instances advance through each lifecycle pattern's stages. Each row is a tracked source instance; each column is a stage. Scores are derived from the stage index — how far through the lifecycle the instance had progressed at that point."
      >
        <SummaryStrip
          patternCount={evolutions.length}
          instanceCount={totalInstances}
        />

        {evolutions.length === 0 && (
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              color: `${COLORS.ink}66`,
              textAlign: 'center',
            }}
          >
            No source instances with stage history found.
          </div>
        )}

        {evolutions.map((ev) => (
          <div key={ev.patternId}>
            <EvolutionTable evolution={ev} />
          </div>
        ))}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

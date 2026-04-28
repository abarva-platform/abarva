// src/components/source/GateCriteriaPanel.tsx
//
// REASON-23 — Gate criteria detail panel driven by the gate evaluator.
//
// Renders the criterion-level pass / partial / unmet / waived state for the
// current stage of a Source event detail page. The component is server-rendered
// and depends only on:
//   - the `GateEvaluation[]` produced by `LifecycleGateEvaluator.evaluateStageGates`
//   - the parent `LifecyclePatternSeed` (for description + evaluation hint lookup)
//
// All status colors and copy are derived from the evaluator output — there is
// no fixture text in this surface.
//
// Status rendering:
//   - met      → mint check
//   - partial  → peach dot
//   - unmet    → ink-muted dot
//   - waived   → small "waived" pill
//
// Empty input is handled gracefully (renders an honest-disclaimer placeholder).
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { GateEvaluation, GateStatus } from '@/lib/reasoning/types';
import type { LifecyclePatternSeed, GateCriterion } from '@/lib/intelligence/seed-types';

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 12,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: 14,
};

const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
};

const TITLE: CSSProperties = {
  margin: '4px 0 0',
  color: SHELL.INK,
  fontFamily: SHELL.SERIF,
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '-0.01em',
};

const SUMMARY: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
};

const STAGE_GROUP: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 12,
};

const STAGE_HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 8,
  flexWrap: 'wrap',
};

const STAGE_TITLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 600,
  color: SHELL.INK,
};

const CRITERION_ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '20px 1fr auto',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  alignItems: 'start',
};

const CRITERION_ID: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  letterSpacing: '0.06em',
};

const CRITERION_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: SHELL.INK,
};

const HINT_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.5,
  color: SHELL.INK_SOFT,
  fontStyle: 'italic',
  marginTop: 4,
};

const STATUS_PILL_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderRadius: 999,
  padding: '3px 8px',
  border: '1px solid',
  whiteSpace: 'nowrap',
};

const DOT_BASE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
};

function statusVisuals(status: GateStatus): {
  pillStyle: CSSProperties;
  dotStyle: CSSProperties;
  label: string;
} {
  switch (status) {
    case 'met':
      return {
        pillStyle: {
          ...STATUS_PILL_BASE,
          color: SHELL.MINT_TEXT,
          borderColor: SHELL.MINT_LINE,
          background: SHELL.MINT_BG,
        },
        dotStyle: { ...DOT_BASE, background: SHELL.MINT_TEXT },
        label: 'passed',
      };
    case 'waived':
      return {
        pillStyle: {
          ...STATUS_PILL_BASE,
          color: SHELL.INK_SOFT,
          borderColor: SHELL.CARD_LINE,
          background: SHELL.PAPER_SOFT,
        },
        dotStyle: { ...DOT_BASE, background: SHELL.INK_MUTED },
        label: 'waived',
      };
    case 'partial':
      return {
        pillStyle: {
          ...STATUS_PILL_BASE,
          color: SHELL.PEACH_TEXT,
          borderColor: SHELL.PEACH_LINE,
          background: SHELL.PEACH_BG,
        },
        dotStyle: { ...DOT_BASE, background: SHELL.PEACH_TEXT },
        label: 'partial',
      };
    case 'unmet':
    default:
      return {
        pillStyle: {
          ...STATUS_PILL_BASE,
          color: SHELL.INK_MUTED,
          borderColor: SHELL.CARD_LINE,
          background: SHELL.CARD_WHITE,
        },
        dotStyle: { ...DOT_BASE, background: SHELL.INK_MUTED },
        label: 'pending',
      };
  }
}

interface GateCriteriaPanelProps {
  /**
   * Gate evaluations produced by `LifecycleGateEvaluator.evaluateStageGates`
   * (or the flat union across stages). The panel groups by `stageId`.
   */
  evaluations: GateEvaluation[];
  /**
   * The lifecycle pattern that produced these evaluations. Used to look up
   * description and evaluation-hint text per criterion.
   */
  pattern: LifecyclePatternSeed;
  /**
   * The stage the instance is currently in. Used to highlight the stage
   * grouping that gates entry to the next stage. Optional.
   */
  currentStageId?: string;
  /** Optional override for the panel header title. */
  title?: string;
}

interface StageGroup {
  stageId: string;
  stageLabel: string;
  evaluations: GateEvaluation[];
}

function groupByStage(
  evaluations: GateEvaluation[],
  pattern: LifecyclePatternSeed,
): StageGroup[] {
  const stageOrder = new Map<string, number>();
  const stageLabels = new Map<string, string>();
  for (const stage of pattern.stages) {
    stageOrder.set(stage.id, stage.order);
    stageLabels.set(stage.id, stage.label);
  }

  const buckets = new Map<string, GateEvaluation[]>();
  for (const evaluation of evaluations) {
    const list = buckets.get(evaluation.stageId) ?? [];
    list.push(evaluation);
    buckets.set(evaluation.stageId, list);
  }

  const groups: StageGroup[] = [];
  for (const [stageId, evals] of buckets.entries()) {
    groups.push({
      stageId,
      stageLabel: stageLabels.get(stageId) ?? stageId,
      evaluations: evals,
    });
  }

  // Sort by stage order in the pattern; unknown stages drift to the end.
  groups.sort((a, b) => {
    const ao = stageOrder.get(a.stageId) ?? Number.MAX_SAFE_INTEGER;
    const bo = stageOrder.get(b.stageId) ?? Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });
  return groups;
}

function summarize(evals: GateEvaluation[]): string {
  const total = evals.length;
  if (total === 0) return 'No criteria defined';
  const met = evals.filter((e) => e.status === 'met' || e.status === 'waived').length;
  const partial = evals.filter((e) => e.status === 'partial').length;
  const unmet = evals.filter((e) => e.status === 'unmet').length;
  const parts = [`${met}/${total} met`];
  if (partial > 0) parts.push(`${partial} partial`);
  if (unmet > 0) parts.push(`${unmet} pending`);
  return parts.join(' · ');
}

export function GateCriteriaPanel({
  evaluations,
  pattern,
  currentStageId,
  title = 'Gate criteria',
}: GateCriteriaPanelProps) {
  const criteriaById = new Map<string, GateCriterion>();
  for (const c of pattern.gateCriteria) criteriaById.set(c.id, c);

  if (!evaluations || evaluations.length === 0) {
    return (
      <section style={SECTION} aria-label="Gate criteria panel">
        <div>
          <div style={SECTION_LABEL}>Reasoning · gate criteria</div>
          <h4 style={TITLE}>{title}</h4>
          <p style={{ ...SUMMARY, marginTop: 6 }}>
            No gate criteria are defined for this pattern at the current stage.
          </p>
        </div>
      </section>
    );
  }

  const groups = groupByStage(evaluations, pattern);
  const totalSummary = summarize(evaluations);

  return (
    <section
      style={SECTION}
      aria-label="Gate criteria panel"
      data-testid="gate-criteria-panel"
    >
      <div style={HEADER}>
        <div>
          <div style={SECTION_LABEL}>Reasoning · gate criteria</div>
          <h4 style={TITLE}>{title}</h4>
          <p style={{ ...SUMMARY, marginTop: 6 }}>
            Criteria evaluated by{' '}
            <span style={{ fontFamily: SHELL.MONO }}>
              {pattern.patternId}@{pattern.version}
            </span>{' '}
            · {totalSummary}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {groups.map((group) => {
          const isCurrentTarget =
            currentStageId !== undefined && group.stageId === currentStageId;
          return (
            <div
              key={group.stageId}
              style={STAGE_GROUP}
              data-testid={`gate-criteria-stage-${group.stageId}`}
            >
              <div style={STAGE_HEADER}>
                <div>
                  <div style={SECTION_LABEL}>Gate to advance into</div>
                  <div style={STAGE_TITLE}>
                    {group.stageLabel}
                    {isCurrentTarget && (
                      <span
                        style={{
                          marginLeft: 8,
                          ...STATUS_PILL_BASE,
                          color: SHELL.INK,
                          borderColor: SHELL.CARD_LINE,
                          background: SHELL.PAPER_DEEP,
                        }}
                      >
                        active
                      </span>
                    )}
                  </div>
                </div>
                <div style={SUMMARY}>{summarize(group.evaluations)}</div>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {group.evaluations.map((evaluation) => {
                  const criterion = criteriaById.get(evaluation.criterionId);
                  const visuals = statusVisuals(evaluation.status);
                  const showHint =
                    !!criterion?.evaluationHint &&
                    evaluation.status !== 'met' &&
                    evaluation.status !== 'waived';

                  return (
                    <div
                      key={evaluation.criterionId}
                      style={CRITERION_ROW}
                      data-testid={`gate-criterion-${evaluation.criterionId}`}
                      data-status={evaluation.status}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          ...visuals.dotStyle,
                          marginTop: 6,
                        }}
                      />
                      <div>
                        <div style={CRITERION_ID}>
                          {evaluation.criterionId}
                          {evaluation.gateType === 'soft' && (
                            <span
                              style={{
                                marginLeft: 8,
                                color: SHELL.INK_MUTED,
                                fontStyle: 'italic',
                              }}
                            >
                              · soft
                            </span>
                          )}
                        </div>
                        <div style={CRITERION_TEXT}>
                          {criterion?.description ??
                            'Criterion description not found in pattern.'}
                        </div>
                        {showHint && criterion?.evaluationHint && (
                          <div style={HINT_TEXT}>{criterion.evaluationHint}</div>
                        )}
                      </div>
                      <span style={visuals.pillStyle}>
                        <span aria-hidden="true" style={visuals.dotStyle} />
                        {visuals.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        data-honest-disclaimer="gate-criteria-panel"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.08em',
        }}
      >
        Status derived live from gate evaluator · pattern{' '}
        {pattern.patternId}@{pattern.version}
      </div>
    </section>
  );
}

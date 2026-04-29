/**
 * Stage micro-synthesis — REASON-30 follow-up
 *
 * Per-stage advisory text rendered on the lifecycle mini-graph. Where the
 * full synthesis quote summarises the WHOLE instance, this helper produces a
 * 1–2 sentence rule-based string for ONE stage, derived deterministically
 * from the pre-computed `StageEvaluationResult` and the governing
 * `LifecyclePatternSeed`.
 *
 * Pure, deterministic, no LLM call: same inputs → same output.
 *
 * Output shape (by branch):
 * - Stage with no gate criteria:
 *     "{stageLabel}: no gate criteria defined."
 * - Stage already passed:
 *     "{stageLabel}: all N gate criteria satisfied. Stage clear."
 * - Stage current with all hard gates met:
 *     "{stageLabel}: all hard gates met. Ready to advance."
 * - Stage current with hard gates blocked:
 *     "{H} hard gate{s} blocked, {P} pending. Address {topBlocker} to advance."
 *     (when there are pending soft criteria, the second clause names them)
 * - Stage upcoming with all pending:
 *     "{stageLabel}: {N} criteria pending. Start with {firstHardCriterion}."
 * - Stage upcoming with partial evidence:
 *     "{stageLabel}: {met}/{total} gate criteria met."
 *
 * The strings are intentionally terse so they fit inside a small SVG title
 * tooltip or a compact popover. They contain no PII, no LLM-generated prose,
 * and are stable across renders.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { GateEvaluation, StageEvaluationResult } from './types';

/** Result of evaluating ALL stages (the shape `evaluateAllStages` returns). */
type StageEval = StageEvaluationResult;

function isOpen(e: GateEvaluation): boolean {
  return e.status !== 'met' && e.status !== 'waived';
}

function describeCriterion(
  pattern: LifecyclePatternSeed,
  criterionId: string,
): string {
  const c = pattern.gateCriteria.find((x) => x.id === criterionId);
  return c?.description?.trim() || criterionId;
}

/**
 * Build a deterministic 1–2 sentence advisory for one stage.
 *
 * @param stageId   The stage being summarised.
 * @param evaluation The pre-computed evaluation result for that stage. Must
 *                   correspond to `stageId` (this is not re-checked here).
 * @param pattern   The governing lifecycle pattern, used to look up criterion
 *                   descriptions.
 */
export function buildStageMicroSynthesis(
  stageId: string,
  evaluation: StageEval,
  pattern: LifecyclePatternSeed,
): string {
  const stageLabel = evaluation.stageLabel || stageId;
  const gates = evaluation.gateEvaluations ?? [];
  const total = evaluation.gatesTotal ?? gates.length;

  // No criteria defined for this stage — explicit, not silent.
  if (total === 0) {
    return `${stageLabel}: no gate criteria defined.`;
  }

  const open = gates.filter(isOpen);
  const openHard = open.filter((g) => g.gateType === 'hard');
  const openSoft = open.filter((g) => g.gateType === 'soft');

  // Stage already in the past.
  if (evaluation.status === 'passed') {
    return `${stageLabel}: all ${total} gate criteria satisfied. Stage clear.`;
  }

  // Stage is the current one.
  if (evaluation.status === 'current') {
    // 'current' means all hard gates are met (per evaluateAllStages contract).
    if (openSoft.length === 0) {
      return `${stageLabel}: all hard gates met. Ready to advance.`;
    }
    return `${stageLabel}: hard gates met; ${openSoft.length} soft criterion${
      openSoft.length === 1 ? '' : 's'
    } still pending.`;
  }

  // Stage is currently blocked (instance is here but hard gates unmet).
  if (evaluation.status === 'blocked') {
    const hard = openHard.length;
    const soft = openSoft.length;
    const top = openHard[0] ?? open[0];
    const topDesc = top ? describeCriterion(pattern, top.criterionId) : '';
    const tail = soft > 0
      ? `${hard} hard gate${hard === 1 ? '' : 's'} blocked, ${soft} pending`
      : `${hard} hard gate${hard === 1 ? '' : 's'} blocked`;
    return topDesc
      ? `${tail}. Address ${topDesc} to advance.`
      : `${tail}.`;
  }

  // Stage is upcoming.
  // Partial evidence path — some criteria already met before stage entry.
  if (evaluation.gatesMet > 0 && evaluation.gatesMet < total) {
    return `${stageLabel}: ${evaluation.gatesMet}/${total} gate criteria met.`;
  }

  // All-pending fallback. Prefer naming the first hard criterion as the
  // starting point; fall back to the first criterion if no hard gate exists.
  const firstHard = gates.find((g) => g.gateType === 'hard') ?? gates[0];
  const firstDesc = firstHard
    ? describeCriterion(pattern, firstHard.criterionId)
    : '';
  if (firstDesc) {
    return `${stageLabel}: ${total} criteri${
      total === 1 ? 'on' : 'a'
    } pending. Start with ${firstDesc}.`;
  }
  return `${stageLabel}: ${total} criteri${
    total === 1 ? 'on' : 'a'
  } pending.`;
}

/**
 * Convenience: build a `Record<stageId, microSynthesis>` map in one pass.
 * Caller is expected to pass the full `evaluateAllStages` output.
 */
export function buildStageMicroSynthesisMap(
  evaluations: StageEval[],
  pattern: LifecyclePatternSeed,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const ev of evaluations) {
    map[ev.stageId] = buildStageMicroSynthesis(ev.stageId, ev, pattern);
  }
  return map;
}

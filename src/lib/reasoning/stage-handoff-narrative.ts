/**
 * Stage handoff narrative — REASON-31
 *
 * Per-transition advisory text describing what evidence flows from one
 * lifecycle stage to the next. Where `stage-micro-synthesis` describes the
 * STATE of a single stage, this helper describes the HANDOFF between
 * consecutive stages — the required artifacts the prior stage produces and
 * the gate criteria the next stage will need to clear.
 *
 * Pure, deterministic, no LLM call: same inputs → same output.
 *
 * Output shape (one entry per `(stages[i], stages[i+1])` pair, in stage order):
 *   {
 *     fromStageId, toStageId,
 *     fromLabel, toLabel,
 *     expectedHandoffArtifacts,   // required artifacts on fromStageId
 *     nextStageGateCriteria,       // gate criteria gating entry to toStageId
 *     narrative,                   // 1-2 sentence rule-based string
 *   }
 *
 * Narrative branches:
 * - With required artifacts:
 *     "{fromLabel} hands {N} required artifact(s) to {toLabel}: {top 2 labels}.
 *      {toLabel} requires {G} gate criteri{a|on} before it can advance, of
 *      which {H} {is|are} hard."
 * - Without required artifacts:
 *     "{fromLabel} produces no required artifacts; {toLabel} relies on
 *      stage-internal evidence."
 *   (with the second sentence about gates appended when {G} > 0)
 *
 * The strings are intentionally terse and grounded in the pattern definition.
 * They contain no PII, no LLM-generated prose, and are stable across renders.
 */

import type {
  ExpectedArtifact,
  GateCriterion,
  LifecyclePatternSeed,
  LifecycleStage,
} from '@/lib/intelligence/seed-types';

/**
 * One handoff descriptor between two consecutive lifecycle stages.
 */
export interface HandoffNarrative {
  /** Identifier of the stage producing the handoff. */
  fromStageId: string;
  /** Identifier of the stage receiving the handoff. */
  toStageId: string;
  /** Human-readable label for the producing stage. */
  fromLabel: string;
  /** Human-readable label for the receiving stage. */
  toLabel: string;
  /**
   * Required artifacts produced ON `fromStageId`. Filtered to
   * `requirement === 'required'` so the narrative speaks only to material
   * handoff evidence — recommended/optional artifacts are excluded.
   */
  expectedHandoffArtifacts: ExpectedArtifact[];
  /**
   * Gate criteria that gate entry to `toStageId`. Includes both hard and
   * soft criteria so the consumer can render the full incoming bar.
   */
  nextStageGateCriteria: GateCriterion[];
  /** Pre-rendered 1-2 sentence advisory string. */
  narrative: string;
}

function compareStageOrder(a: LifecycleStage, b: LifecycleStage): number {
  return a.order - b.order;
}

function pluralCriteria(n: number): string {
  return n === 1 ? 'criterion' : 'criteria';
}

function pluralIs(n: number): string {
  return n === 1 ? 'is' : 'are';
}

function buildNarrative(
  fromLabel: string,
  toLabel: string,
  artifacts: ExpectedArtifact[],
  gates: GateCriterion[],
): string {
  const hardCount = gates.filter((g) => g.gateType === 'hard').length;
  const totalGates = gates.length;

  if (artifacts.length === 0) {
    const base = `${fromLabel} produces no required artifacts; ${toLabel} relies on stage-internal evidence.`;
    if (totalGates === 0) return base;
    return `${base} ${toLabel} requires ${totalGates} gate ${pluralCriteria(
      totalGates,
    )} before it can advance, of which ${hardCount} ${pluralIs(hardCount)} hard.`;
  }

  const topLabels = artifacts.slice(0, 2).map((a) => a.label).join(', ');
  const artifactNoun = artifacts.length === 1 ? 'artifact' : 'artifacts';
  const lead = `${fromLabel} hands ${artifacts.length} required ${artifactNoun} to ${toLabel}: ${topLabels}.`;

  if (totalGates === 0) {
    return `${lead} ${toLabel} has no gate criteria of its own.`;
  }

  return `${lead} ${toLabel} requires ${totalGates} gate ${pluralCriteria(
    totalGates,
  )} before it can advance, of which ${hardCount} ${pluralIs(hardCount)} hard.`;
}

/**
 * Build the ordered list of handoff narratives for a lifecycle pattern.
 *
 * Returns one entry for each `(stages[i], stages[i+1])` pair in pattern order
 * (stages sorted by their `order` field). A single-stage lifecycle yields an
 * empty array — there is no handoff to describe.
 *
 * Pure: same `pattern` → same output, every time.
 */
export function buildStageHandoffNarratives(
  pattern: LifecyclePatternSeed,
): HandoffNarrative[] {
  const ordered = [...pattern.stages].sort(compareStageOrder);
  if (ordered.length < 2) return [];

  const out: HandoffNarrative[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i]!;
    const to = ordered[i + 1]!;

    const expectedHandoffArtifacts = pattern.expectedArtifacts.filter(
      (a) => a.stageId === from.id && a.requirement === 'required',
    );
    const nextStageGateCriteria = pattern.gateCriteria.filter(
      (g) => g.stageId === to.id,
    );

    out.push({
      fromStageId: from.id,
      toStageId: to.id,
      fromLabel: from.label,
      toLabel: to.label,
      expectedHandoffArtifacts,
      nextStageGateCriteria,
      narrative: buildNarrative(
        from.label,
        to.label,
        expectedHandoffArtifacts,
        nextStageGateCriteria,
      ),
    });
  }

  return out;
}

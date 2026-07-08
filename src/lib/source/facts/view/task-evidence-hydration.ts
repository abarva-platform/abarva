// ─────────────────────────────────────────────────────────────────────────────
// Hydrate a stage's task checklist done-state from ALREADY-PERSISTED evidence.
//
// The redesigned canvas checklist (`TaskChecklist`) tracks a task's "done" flag in
// client `useState`, which starts empty on every mount. A successful upload flips
// it in-session, but on a page reload / tab switch the persisted evidence is not
// read back, so an upload task that HAS landed facts/artifacts renders "not done"
// and the "N of M complete" counter resets — even though the ✦ Intelligence insight
// (fact-derived, server-rendered) stays live. This is the read-back seam that fixes
// that: given the facts already read for the stage (`readEventFacts`) and the
// artifacts already listed for the event (`listSourceArtifactsForSourceEventId`), it
// stamps each task's `evidenceComplete` from real persisted evidence.
//
// HONESTY RULE (load-bearing): `evidenceComplete` is true ONLY because the task's
// evidence reached a usable, PERSISTED state —
//   • a `provide` task bound to a `factTemplateCode` is complete when ANY of that
//     template's column fact keys already exists in the event's committed facts
//     (the same facts that flip the step insight LIVE); and
//   • a `provide` task with no template (its evidence is a stored document, e.g. the
//     signed sponsor letter) is complete when at least one artifact is registered
//     for the task's stage.
// It is NEVER a fabricated "done" without evidence. `confirm` / `decide` tasks and
// tasks with no derivable evidence are left untouched (undefined), so the checklist
// keeps its existing behavior for them. This is purely additive + deterministic — it
// derives done-state from persisted evidence and renders it; it writes nothing.
// ─────────────────────────────────────────────────────────────────────────────

import type { StageTaskView } from '@/components/source/canvas/analytics/view-model';
import type { EvaluatorInputs } from '@/lib/source/facts/evaluators/types';
import { templateFactMapByCode } from '@/lib/source/facts/template-fact-map';

/** The minimal artifact shape this hydrator needs (from the registry record). */
export interface HydrationArtifact {
  /** The canonical stage the artifact was uploaded under. */
  stageKey: string;
}

export interface HydrateTaskEvidenceInput {
  /** The stage tasks to stamp (returned unchanged in count/order). */
  tasks: readonly StageTaskView[];
  /**
   * factKey → numeric value for the event, from `readEventFacts`. A template's
   * task is complete when ANY of its bound column fact keys is present here.
   */
  factInputs: EvaluatorInputs;
  /**
   * The event's registered artifacts (from `listSourceArtifactsForSourceEventId`).
   * A template-less `provide` task is complete when at least one artifact exists
   * for its stage. Empty / omitted → no artifact-derived completion.
   */
  artifacts?: readonly HydrationArtifact[];
  /**
   * The canonical stage key being rendered. Used to match artifacts to a
   * template-less `provide` task (the artifact carries the stage it landed under).
   */
  stageKey?: string;
}

/**
 * True when ANY of the template's column fact keys is present in the read facts.
 * The template's columns each bind to a canonical fact key; a single populated
 * column proves the template's file was ingested for this event.
 */
export function templateFactsPresent(
  factTemplateCode: string,
  factInputs: EvaluatorInputs,
): boolean {
  const map = templateFactMapByCode(factTemplateCode);
  if (!map) return false;
  return map.columns.some((column) => {
    const value = factInputs[column.factKey];
    return typeof value === 'number' && Number.isFinite(value);
  });
}

/**
 * Return the tasks with `evidenceComplete` stamped from persisted evidence.
 * Same length + order as the input; a task is only stamped `true` when its
 * evidence is genuinely persisted (see the honesty rule at the top). Tasks with
 * no derivable evidence are returned untouched.
 */
export function hydrateTaskEvidenceState(
  input: HydrateTaskEvidenceInput,
): StageTaskView[] {
  const { tasks, factInputs, artifacts = [], stageKey } = input;

  // Which stages have at least one registered artifact — for template-less
  // `provide` tasks whose evidence is a stored document, not typed facts.
  const stagesWithArtifact = new Set<string>();
  for (const artifact of artifacts) {
    if (artifact.stageKey) stagesWithArtifact.add(artifact.stageKey);
  }

  return tasks.map((task) => {
    // Only `provide` tasks carry uploadable evidence; leave confirm/decide alone.
    if (task.type !== 'provide') return task;

    if (task.factTemplateCode) {
      if (templateFactsPresent(task.factTemplateCode, factInputs)) {
        return { ...task, evidenceComplete: true };
      }
      return task;
    }

    // Template-less `provide` task → its evidence is a stored artifact. Complete
    // when at least one artifact is registered for this task's stage.
    const taskStage = stageKey ?? undefined;
    if (taskStage && stagesWithArtifact.has(taskStage)) {
      return { ...task, evidenceComplete: true };
    }
    return task;
  });
}

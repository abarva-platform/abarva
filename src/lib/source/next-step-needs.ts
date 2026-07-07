// Next-step look-ahead — derives "what the next stage will need" from the
// canonical evidence requirements, so the operator can start gathering ahead of
// time. Pure + spec-driven: this is the same data the readiness ledger uses,
// just read one stage forward. Part of the universal step loop (every stage
// previews the next), not a P0/Scope special-case.

import { SOURCE_STAGE_ORDER, SOURCE_STAGE_LABELS } from "./constants";
import {
  evidenceForStage,
  type SourceEvidenceRequirement,
} from "./canonical-specs";
import type { SourceStageKey } from "./types";

export interface NextStepNeeds {
  /** The stage after `stage`, or null at the end of the lifecycle. */
  readonly nextStage: SourceStageKey | null;
  /** Human label for the next stage. */
  readonly nextStageLabel: string | null;
  /** The next stage's required evidence — what to start gathering now. */
  readonly needs: readonly SourceEvidenceRequirement[];
}

/**
 * What the stage *after* `stage` will require. Only `required` evidence is
 * returned (the things that will block its gate); recommended items are left
 * out of the look-ahead to keep it to the essentials.
 */
export function nextStepNeeds(stage: SourceStageKey): NextStepNeeds {
  const index = SOURCE_STAGE_ORDER.indexOf(stage);
  const nextStage =
    index >= 0 && index + 1 < SOURCE_STAGE_ORDER.length
      ? SOURCE_STAGE_ORDER[index + 1]
      : null;
  if (!nextStage) {
    return { nextStage: null, nextStageLabel: null, needs: [] };
  }
  return {
    nextStage,
    nextStageLabel: SOURCE_STAGE_LABELS[nextStage],
    needs: evidenceForStage(nextStage).filter(
      (requirement) => requirement.level === "required",
    ),
  };
}

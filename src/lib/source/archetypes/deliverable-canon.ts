// Deliverable canon — the quality gate for every archetype deliverable.
//
// A deliverable is not "done" because text was produced. It must clear the
// archetype's qualityBar: minimum sections, citations present when required,
// correct altitude, and the rubric points the Master Agent reviews against.
// This is the reviewer/challenger discipline encoded as a check.

import type { DeliverableSpec, SourceEventArchetype } from './types';

export interface DeliverableDraft {
  /** Section title → body text. */
  sections: Record<string, string>;
  /** Citation identifiers present in the draft (evidence refs, doc ids). */
  citations: string[];
  /** Claims the author could not ground (MUST be empty to pass). */
  unsupportedClaims?: string[];
}

export interface DeliverableQualityResult {
  deliverableKey: string;
  pass: boolean;
  failures: string[];
  /** Rubric checks the reviewer must still apply by reading (advisory). */
  rubricToReview: string[];
}

export function getDeliverableSpec(
  archetype: SourceEventArchetype,
  key: string,
): DeliverableSpec | undefined {
  return archetype.deliverablePack.find((d) => d.key === key);
}

/**
 * Evaluate a draft against its archetype deliverable qualityBar. Hard checks
 * fail the deliverable; the rubric is returned for human/LLM review.
 */
export function evaluateDeliverableQuality(
  spec: DeliverableSpec,
  draft: DeliverableDraft,
): DeliverableQualityResult {
  const failures: string[] = [];
  const filled = Object.entries(draft.sections).filter(([, v]) => v && v.trim().length > 0);

  if (filled.length < spec.qualityBar.minSections) {
    failures.push(
      `Has ${filled.length} non-empty sections; quality bar requires ${spec.qualityBar.minSections}.`,
    );
  }
  if (spec.qualityBar.requiresCitations && draft.citations.length === 0) {
    failures.push('Quality bar requires citations but none are present.');
  }
  if (draft.unsupportedClaims && draft.unsupportedClaims.length > 0) {
    failures.push(
      `Contains ${draft.unsupportedClaims.length} unsupported claim(s): ${draft.unsupportedClaims.join('; ')}. Must be grounded or removed.`,
    );
  }

  return {
    deliverableKey: spec.key,
    pass: failures.length === 0,
    failures,
    rubricToReview: spec.qualityBar.rubric,
  };
}

/** The board-grade deliverables (gate artifacts) an archetype must produce. */
export function gateDeliverables(archetype: SourceEventArchetype): DeliverableSpec[] {
  return archetype.deliverablePack.filter((d) => d.gateArtifact);
}

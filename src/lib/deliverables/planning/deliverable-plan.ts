// Moves Deliverable Story Redo — the DeliverablePlan (reason first) — PR-A
//
// The hidden reasoning object the model MUST emit before any artifact is
// generated. Generation flow: tenant context → use-case → profile →
// current-state interpretation → gap analysis → target-state hypothesis →
// storyline → exhibit plan → visual gen → narrative gen → gate → render.
//
// No artifact may be generated directly from input files; a validated plan must
// exist first. Shared across every tenant.

import type { DeliverableKey, ExhibitId } from "@/lib/deliverables/profiles/types";

/** One beat of the story spine (the visible narrative arc). */
export interface StoryBeat {
  id: string;
  /** What this beat says, in client-specific judgment language. */
  point: string;
}

/** A planned exhibit and the narrative role it plays (not decoration). */
export interface PlannedExhibit {
  exhibit: ExhibitId;
  /** Why this exhibit exists — the question it answers for the reader. */
  purpose: string;
  /** The so-what: what it means for the client's decision. */
  soWhat: string;
}

export interface ObservedGap {
  id: string;
  /** Current-state observation that reveals the gap. */
  observation: string;
  /** The gap itself. */
  gap: string;
  /** The design implication / target capability the gap drives. */
  designImplication: string;
}

export interface DeliverablePlan {
  artifactType: DeliverableKey;
  audience: string;
  decisionPurpose: string;
  /** ONE sentence — the spine of the whole artifact. */
  storyline: string;
  /** Current state interpreted (not listed). */
  currentStateInterpretation: string;
  /** The major gaps, each bridged to a design implication. */
  majorGaps: ObservedGap[];
  /** What the target state changes. */
  targetStateHypothesis: string;
  /** Decisions the artifact asks the reader to make. */
  requiredDecisions: string[];
  /** Exhibits to render, each with purpose + so-what. */
  requiredExhibits: PlannedExhibit[];
  /** The visible narrative sequence (story beats in order). */
  narrativeSequence: StoryBeat[];
  evidenceNeeded: string[];
  missingInputs: string[];
  assumptions: string[];
  risks: string[];
  /** What the reader should be able to say after reading. */
  readerTakeaway: string;
}

export interface PlanValidationIssue {
  level: "error" | "warn";
  message: string;
}

/**
 * Validate that a plan is real reasoning, not a stub. Architecture artifacts
 * carry stricter requirements (current→gap→target chain must be present).
 */
export function validateDeliverablePlan(
  plan: DeliverablePlan,
  opts: { requireGapChain?: boolean } = {},
): PlanValidationIssue[] {
  const issues: PlanValidationIssue[] = [];
  const need = (cond: boolean, message: string, level: "error" | "warn" = "error") => {
    if (!cond) issues.push({ level, message });
  };

  need(plan.storyline.trim().split(/\s+/).length >= 6, "Storyline is not a real one-sentence spine.");
  need(plan.currentStateInterpretation.trim().length > 0, "Current state is not interpreted.");
  need(plan.targetStateHypothesis.trim().length > 0, "No target-state hypothesis.");
  need(plan.requiredDecisions.length > 0, "No required decisions — the artifact asks for no decision.");
  need(plan.narrativeSequence.length >= 3, "Story spine has fewer than 3 beats.");
  need(plan.requiredExhibits.length > 0, "No planned exhibits.");
  need(plan.readerTakeaway.trim().length > 0, "No reader takeaway.");

  // Every planned exhibit must carry purpose + so-what (no decorative visuals).
  for (const ex of plan.requiredExhibits) {
    need(!!ex.purpose?.trim(), `Exhibit ${ex.exhibit} has no purpose.`);
    need(!!ex.soWhat?.trim(), `Exhibit ${ex.exhibit} has no so-what interpretation.`);
  }

  if (opts.requireGapChain) {
    need(plan.majorGaps.length > 0, "Architecture plan has no gaps — current→gap→target chain missing.");
    for (const g of plan.majorGaps) {
      need(
        !!g.observation?.trim() && !!g.gap?.trim() && !!g.designImplication?.trim(),
        `Gap ${g.id} is missing observation / gap / designImplication (broken reasoning chain).`,
      );
    }
  }

  return issues;
}

/** A plan is ready to generate from only when it has no error-level issues. */
export function planIsReady(
  plan: DeliverablePlan,
  opts?: { requireGapChain?: boolean },
): boolean {
  return !validateDeliverablePlan(plan, opts).some((i) => i.level === "error");
}

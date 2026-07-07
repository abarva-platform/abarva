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
  if (!plan || typeof plan !== "object") {
    return [{ level: "error", message: "Deliverable plan is missing." }];
  }

  const text = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";
  const requiredDecisions = Array.isArray(plan.requiredDecisions)
    ? plan.requiredDecisions
    : [];
  const narrativeSequence = Array.isArray(plan.narrativeSequence)
    ? plan.narrativeSequence
    : [];
  const requiredExhibits = Array.isArray(plan.requiredExhibits)
    ? plan.requiredExhibits
    : [];
  const majorGaps = Array.isArray(plan.majorGaps) ? plan.majorGaps : [];

  need(text(plan.storyline).split(/\s+/).filter(Boolean).length >= 6, "Storyline is not a real one-sentence spine.");
  need(text(plan.currentStateInterpretation).length > 0, "Current state is not interpreted.");
  need(text(plan.targetStateHypothesis).length > 0, "No target-state hypothesis.");
  need(requiredDecisions.length > 0, "No required decisions — the artifact asks for no decision.");
  need(narrativeSequence.length >= 3, "Story spine has fewer than 3 beats.");
  need(requiredExhibits.length > 0, "No planned exhibits.");
  need(text(plan.readerTakeaway).length > 0, "No reader takeaway.");

  // Every planned exhibit must carry purpose + so-what (no decorative visuals).
  for (const ex of requiredExhibits) {
    need(!!text(ex.purpose), `Exhibit ${ex.exhibit} has no purpose.`);
    need(!!text(ex.soWhat), `Exhibit ${ex.exhibit} has no so-what interpretation.`);
  }

  if (opts.requireGapChain) {
    need(majorGaps.length > 0, "Architecture plan has no gaps — current→gap→target chain missing.");
    for (const g of majorGaps) {
      need(
        !!text(g.observation) && !!text(g.gap) && !!text(g.designImplication),
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

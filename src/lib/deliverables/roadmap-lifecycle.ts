// PR2 — one unified lifecycle model for a governed phase artifact.
//
// Before this, "is this a draft?" / "is the gate approved?" were expressed as
// scattered booleans and hardcoded banner strings that could drift between the
// route, the banner, the artifact status, the downloads and each renderer. One
// ambiguous "Phase N gate approved" flag cannot represent all of: the phase was
// entered, generation is permitted, a review draft exists, and the phase exit
// gate is finally approved.
//
// This module is the SINGLE source of that truth. Every route and renderer
// derives the phase artifact's lifecycle state from here — no renderer-specific
// booleans. It is pure so every transition is unit-tested without the data plane.

/**
 * The lifecycle of a governed phase artifact, in strict progression order:
 *  - entry_approved:      the phase has been entered (its ENTRY gate — the prior
 *                         phase's exit gate — is approved), but capture is not yet
 *                         complete, so no review draft can be generated.
 *  - generation_eligible: entered AND phase capture is complete → a review draft
 *                         may be generated (before the exit gate).
 *  - review_draft:        a review draft has been generated. Generation BEFORE the
 *                         exit gate is intentional; the exit approval is pending.
 *  - exit_approved_final: the phase EXIT gate is approved and the sponsor has
 *                         accepted → final / board-ready.
 */
export const ROADMAP_LIFECYCLE_STATES = [
  "entry_approved",
  "generation_eligible",
  "review_draft",
  "exit_approved_final",
] as const;
export type RoadmapLifecycleState = (typeof ROADMAP_LIFECYCLE_STATES)[number];

export interface RoadmapLifecycleInput {
  phase: number;
  /** The phase's ENTRY gate — the prior phase's exit gate (true for phase 0). */
  entryGateApproved: boolean;
  /** Is this phase's capture complete enough to generate a review draft? */
  captureComplete: boolean;
  /** Has this phase's EXIT gate been approved (final sponsor acceptance)? */
  exitGateApproved: boolean;
  /** Has an artifact (review draft) actually been generated for this phase? */
  artifactGenerated: boolean;
}

export interface RoadmapLifecycle {
  state: RoadmapLifecycleState;
  /** Has the phase been entered at all (entry gate approved)? */
  isEntered: boolean;
  /** Is the artifact final/board-ready (exit gate approved)? */
  isFinal: boolean;
  /** Is the artifact a pre-exit review draft (generated, not yet final)? */
  isReviewDraft: boolean;
}

/**
 * Derive the single lifecycle state from authoritative gate/generation signals.
 * Highest reached state wins; the states are strictly ordered.
 */
export function deriveRoadmapLifecycle(
  input: RoadmapLifecycleInput,
): RoadmapLifecycle {
  const state: RoadmapLifecycleState = input.exitGateApproved
    ? "exit_approved_final"
    : input.artifactGenerated
      ? "review_draft"
      : input.entryGateApproved && input.captureComplete
        ? "generation_eligible"
        : "entry_approved";
  return {
    state,
    isEntered: input.entryGateApproved,
    isFinal: state === "exit_approved_final",
    isReviewDraft: state === "review_draft",
  };
}

/**
 * The one client-facing lifecycle sentence — every renderer uses this so the
 * banner never contradicts the artifact's real state (and never says "no
 * generation until the gate is approved" on a draft that already exists).
 */
export function roadmapLifecycleSentence(
  lifecycle: RoadmapLifecycle,
  phase: number,
): string {
  switch (lifecycle.state) {
    case "exit_approved_final":
      return `Final — the Phase ${phase} exit gate is approved and the sponsor has accepted this artifact.`;
    case "review_draft":
      return `Review draft generated after Phase ${phase} entry and capture completion. Phase ${phase} exit approval and final sponsor acceptance remain pending.`;
    case "generation_eligible":
      return `Phase ${phase} is entered and capture is complete — a review draft may be generated; the Phase ${phase} exit gate is not yet approved.`;
    case "entry_approved":
    default:
      return lifecycle.isEntered
        ? `Phase ${phase} is entered; capture is being completed before a review draft can be generated.`
        : `Phase ${phase} has not been entered — its entry gate is not yet approved.`;
  }
}

/** A short status tag for compact surfaces (artifact status chips, download labels). */
export function roadmapLifecycleTag(lifecycle: RoadmapLifecycle): string {
  switch (lifecycle.state) {
    case "exit_approved_final":
      return "Final";
    case "review_draft":
      return "Review draft";
    case "generation_eligible":
      return "Ready to draft";
    case "entry_approved":
    default:
      return lifecycle.isEntered ? "Entered" : "Not entered";
  }
}

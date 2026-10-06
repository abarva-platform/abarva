// ─────────────────────────────────────────────────────────────────────────────
// What the TERMINAL Source stage's gate says.
//
// ITEM U-406 (the claimable half of U-543 half (2)). Every other stage's gate
// answers one question — what does approval advance to? — and `nextSourceStage`
// answers it from `SOURCE_STAGE_ORDER`. The final stage has no answer, and
// U-543 refused to invent one: "it approves nothing onward, so 'Approve &
// advance to …' has no referent. Do not invent one."
//
// Before this module the answer was implied in five places and stated in none.
// `ScopeGate` inferred terminality from `gate.nextStageName === null`,
// `StageAdvanceButton` and `SourceStageCanvasPanel` from an index into the
// order, `buildStageGateGrounding` from the same nullable label, and
// `buildSourceAvaStageGateSummary` from `nextSourceStage` — with a FALLBACK to
// the view's own label that fires only when the stage is terminal. That
// fallback read exemplar copy: the terminal stage exemplar carried
// `nextStageName: 'Closed'`, a label that is not a `SourceStageKey`, is absent
// from `SOURCE_STAGE_ORDER`, and cannot be produced by `nextSourceStage`. An
// invented onward target, reachable by the model through the grounding block
// and by the canvas through the same view (U-533 established both consume it
// independently).
//
// So the contract is stated here once, derived from the canonical order rather
// than hand-typed a second time, and enforced by `withTerminalGateContract` at
// the points that build a terminal gate. Deriving the rest of that stage's
// beats is deliberately NOT part of this module: U-406's acceptance puts it
// after the contract exists, against a real tenant-scoped Value signal.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SOURCE_STAGE_ORDER,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";

/**
 * The final stage in the canonical order. Read from `SOURCE_STAGE_ORDER` rather
 * than written as `'value'`, so appending a stage after it moves the contract
 * instead of leaving a second hand-typed key to drift.
 */
export const TERMINAL_SOURCE_STAGE_KEY: SourceStageKey =
  SOURCE_STAGE_ORDER[SOURCE_STAGE_ORDER.length - 1]!;

/**
 * Is this the terminal stage? Legacy aliases are normalized first, because a
 * persisted `value_realization` is the same stage and a gate built from it must
 * carry the same contract.
 */
export function isTerminalSourceStage(stageKey: unknown): boolean {
  const canonical = normalizeSourceStageKey(stageKey);
  return canonical !== null && canonical === TERMINAL_SOURCE_STAGE_KEY;
}

/**
 * What KIND of decision a stage gate asks for. Two kinds, and the distinction
 * is the whole point: `advance` has an onward stage to name, `completion_review`
 * has none and must not imply one.
 */
export type SourceGateDecisionKind = "advance" | "completion_review";

export function sourceGateDecisionKindFor(
  stageKey: unknown,
): SourceGateDecisionKind {
  return isTerminalSourceStage(stageKey) ? "completion_review" : "advance";
}

export interface SourceTerminalGateContract {
  /** The stage this contract governs — the terminal entry of the canonical order. */
  readonly stageKey: SourceStageKey;
  /** A completion review, never an advance: there is nothing onward to approve. */
  readonly decisionKind: "completion_review";
  /** Stated as `null` so a consumer reads the absence rather than inferring it. */
  readonly nextStageName: null;
  /**
   * A ROLE, never a person. `bafo-fact-beats` documents why a role is the
   * established answer, and U-543 half (1) removed the person-named approver
   * this stage used to expose.
   */
  readonly approverRole: string;
  /** What the surface offers instead of "Approve & advance to …". */
  readonly decisionLabel: string;
  /** The terminal outcome, as a value a consumer can branch on. */
  readonly outcome: "event_closed";
  /** One sentence naming the decision and its outcome, for a client surface. */
  readonly outcomeSentence: string;
  /** The gate's own summary line, replacing the advance-shaped one. */
  readonly gateSummarySentence: string;
  /** The line the model's stage-gate grounding block carries. */
  readonly groundingSentence: string;
}

export const SOURCE_TERMINAL_GATE_CONTRACT: SourceTerminalGateContract = {
  stageKey: TERMINAL_SOURCE_STAGE_KEY,
  decisionKind: "completion_review",
  nextStageName: null,
  approverRole: "Event Owner",
  decisionLabel: "Open the completion review",
  outcome: "event_closed",
  outcomeSentence:
    "The decision on this stage is a completion review: it records whether the " +
    "realized value has been booked against what the award committed, and its " +
    "outcome closes the event.",
  gateSummarySentence:
    "This is the final stage, so the decision here reviews completion rather " +
    "than opening anything further. The event approval workspace records the " +
    "human rationale and the closing decision.",
  groundingSentence:
    "This is the FINAL stage. The gate decision is a completion review whose " +
    "outcome closes the event; there is no onward stage. Do not name one, and " +
    "do not describe this approval as advancing the event.",
};

/**
 * The shape this enforcement needs from a gate: who confirms it, and whether it
 * names an onward stage. Kept structural rather than importing `StageGateView`
 * so a server-side builder can apply the contract without pulling a component
 * module's types into the data path.
 */
interface GateWithOnwardTarget {
  approver: string;
  nextStageName: string | null;
}

/**
 * Apply the contract to a gate being built for `stageKey`. On the terminal stage
 * the onward target is removed and the approver is the contract's role; every
 * other stage is returned untouched.
 *
 * This runs at the boundary — where a gate is produced for a consumer — because
 * that is the only place that can stop exemplar copy reaching one. A contract
 * nothing calls is a comment.
 */
export function withTerminalGateContract<G extends GateWithOnwardTarget>(
  gate: G,
  stageKey: unknown,
): G {
  if (!isTerminalSourceStage(stageKey)) return gate;
  return {
    ...gate,
    approver: SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    nextStageName: SOURCE_TERMINAL_GATE_CONTRACT.nextStageName,
  };
}

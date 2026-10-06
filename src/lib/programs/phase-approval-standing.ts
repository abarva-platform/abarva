// What the phase workspace may claim about a phase's approval.
//
// The workspace held ONE boolean, `gateApproved`, seeded from
// `isHistoricalPhase` (`terminalComplete || phase.phase < currentPhase`) — the
// fact that the Move has advanced PAST this phase. From that seed it rendered
// "Approved" in the progress header and "<code> is already approved" on the
// approve step.
//
// Advancement is gated, so the sound reading of that seed is that the phase's
// GATE PASSED. It is not a reading of an approval: nothing on this screen
// fetches a gate-approval record, so there is no approver, no decision date,
// and no record id behind the word. A person opening a phase the Move walked
// past months ago was told it was approved on the strength of an inference the
// screen never named, and had no way to tell that claim from the one made a
// second after they clicked Approve & Build — which IS a read of a real
// decision, the response this session just handled.
//
// This module keeps the two apart. `recorded` is an approval this session
// performed and saw succeed; `advanced-past` is the inference. They produce
// different words, and every inferred claim carries its basis so the reader can
// see what measured it. Same defect class as the approvals overview's constant
// "Approved" column — a claim about a decision nobody read.
//
// Permissiveness is deliberately NOT this module's business. Whether the gate
// controls unlock still turns on `isHistoricalPhase || gateApproved`, unchanged;
// only what the screen SAYS is decided here.

export type PhaseApprovalStanding =
  /** The Move is complete and has handed off; inferred from `terminalComplete`. */
  | "handed-off"
  /** The Move has advanced past this phase, so its gate passed; inferred. */
  | "advanced-past"
  /** This session approved the gate and the server accepted it; recorded. */
  | "recorded"
  /** Nothing approved: the phase is open. */
  | "open";

export interface PhaseApprovalStandingInput {
  /** The Move has completed and handed off to the execution surface. */
  terminalComplete: boolean;
  /** The phase being viewed. */
  phaseNumber: number;
  /** The phase the Move is currently seated at. */
  currentPhase: number;
  /**
   * An approval this SESSION performed and the server accepted. Never seeded
   * from advancement — that is the whole point of this module.
   */
  approvalRecordedThisSession: boolean;
}

/**
 * A recorded approval outranks the inferences, because it is the only input
 * that is a reading of a decision rather than a deduction from position. Among
 * the inferences, hand-off outranks advancement: a handed-off Move has advanced
 * past every phase, so testing it second would never be reached.
 */
export function resolvePhaseApprovalStanding(
  input: PhaseApprovalStandingInput,
): PhaseApprovalStanding {
  if (input.approvalRecordedThisSession) return "recorded";
  if (input.terminalComplete) return "handed-off";
  if (input.phaseNumber < input.currentPhase) return "advanced-past";
  return "open";
}

/**
 * The progress header's status word. `null` for an open phase, whose header
 * states its readiness instead and is decided by the caller.
 */
export function phaseApprovalHeaderLabel(
  standing: PhaseApprovalStanding,
): string | null {
  switch (standing) {
    case "recorded":
      return "Approved";
    case "handed-off":
    case "advanced-past":
      return "Gate passed";
    case "open":
      return null;
  }
}

/**
 * Why the header says what it says, rendered as its `title`. A recorded
 * approval needs no basis line: the reader performed it. An inferred one always
 * does, and says plainly that no approval record was read.
 */
export function phaseApprovalHeaderBasis(
  standing: PhaseApprovalStanding,
): string | null {
  switch (standing) {
    case "handed-off":
      return "The Move has handed off, so every phase gate passed. No approval record was read on this screen.";
    case "advanced-past":
      return "The Move has advanced past this phase, so its gate passed. No approval record was read on this screen.";
    case "recorded":
    case "open":
      return null;
  }
}

/**
 * The approve step's decision heading. `null` for an open phase, which the
 * caller words from its blocked/ready state.
 */
export function phaseApprovalDecisionTitle(
  standing: PhaseApprovalStanding,
  phaseCode: string,
): string | null {
  switch (standing) {
    case "handed-off":
      return "Move handed off to Tower";
    case "advanced-past":
      return `${phaseCode}'s gate has passed`;
    case "recorded":
      return `${phaseCode} approved`;
    case "open":
      return null;
  }
}

/**
 * The approve step's decision body. The advanced-past branch no longer calls
 * the carried output "the approved output": what carries forward is this
 * phase's output, and that it carried at all is the evidence the gate passed.
 */
export function phaseApprovalDecisionText(
  standing: PhaseApprovalStanding,
  nextPhaseLabel: string,
): string | null {
  switch (standing) {
    case "handed-off":
      return "Tower is now the execution and value-tracking surface for this Move.";
    case "advanced-past":
      return `This phase's output is carrying forward into ${nextPhaseLabel}. Its gate passed when the Move advanced; no approval record is read on this screen.`;
    case "recorded":
      return "The governed build and gate record are on file. Review artifacts in Files & Evidence before using them externally.";
    case "open":
      return null;
  }
}

/**
 * The gate panel's standing note, above the approval control.
 *
 * Said "This phase is already approved and read-only. The approved output is
 * carrying forward into X" off the same advancement inference — twice in one
 * sentence. Read-only is true and is kept; approved is not read and is not.
 */
export function phaseApprovalGateNote(
  standing: PhaseApprovalStanding,
  nextPhaseLabel: string,
): string | null {
  switch (standing) {
    case "handed-off":
      return "This Move has completed P5 and handed off to Tower. Its output is carrying forward into the execution and value-tracking surface.";
    case "advanced-past":
      return `This phase's gate has passed and the phase is read-only. Its output is carrying forward into ${nextPhaseLabel}. No approval record is read on this screen.`;
    case "recorded":
      return "The gate for this phase was approved in this session and the phase is now read-only.";
    case "open":
      return null;
  }
}

/**
 * The completion banner's headline on a closed phase. The tick stays: the
 * phase IS closed. What it is closed BY is what changes.
 */
export function phaseApprovalCompletionHeadline(
  standing: PhaseApprovalStanding,
  phaseCode: string,
): string | null {
  switch (standing) {
    case "handed-off":
      return `${phaseCode}'s gate has passed and the Move handed off to Tower.`;
    case "advanced-past":
      return `${phaseCode}'s gate has passed.`;
    case "recorded":
      return `${phaseCode} approved.`;
    case "open":
      return null;
  }
}

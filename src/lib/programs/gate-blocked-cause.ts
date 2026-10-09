/**
 * Why a phase gate is blocked — resolved ONCE, in one order, for every slot on
 * the phase approval surface that reports it.
 *
 * The gate panel had the same four causes written out five times by hand, and
 * the copies did not agree. The decision sentence resolved them in the right
 * order (readiness unverified → required evidence open → phase inputs
 * incomplete → hard criteria open); the next-action label resolved only three
 * of the four, in a different order, with NO phase-inputs arm at all; and the
 * "Why blocked" primary line collapsed all four onto "Blocked by an open hard
 * gate." whenever it had no hard criterion label to name.
 *
 * The result rendered on one screen, at a phase whose only open item was its
 * capture: the decision sentence said "Complete 7 phase inputs before Approve
 * & Build.", the ledger beside it said "1/1 hard gates met", and the same
 * panel then said "Blocked by an open hard gate." and "Clear hard blockers"
 * twice. A reader who trusts the headline goes looking for a hard gate the
 * same panel reports as met.
 *
 * So the cause is a value, not a ladder re-typed per slot: `resolveGateBlockedCause`
 * returns `null` when nothing blocks the gate — which is what `isGateBlocked`
 * now means — and otherwise returns the cause together with every sentence the
 * surface renders for it. A slot cannot name a different cause than its
 * neighbour, because there is only one.
 *
 * Adding a cause means adding a `GateBlockedCauseKey` and a branch in the
 * `switch`, which does not compile until every sentence is written for it.
 */

/**
 * The causes, in the order the surface reports them. Earlier causes win: an
 * unverifiable readiness read makes every count below it untrustworthy, so it
 * is named first rather than reported as a count of zero.
 *
 * Exported so a surface that renders its OWN prose for these causes can be
 * cross-checked against this order instead of re-deriving it.
 */
export const GATE_BLOCKED_CAUSE_ORDER = [
  "readiness_unverified",
  "required_evidence_open",
  "phase_inputs_incomplete",
  "hard_criteria_open",
] as const;

export type GateBlockedCauseKey = (typeof GATE_BLOCKED_CAUSE_ORDER)[number];

export interface GateBlockedCauseInput {
  /**
   * True on a historical phase, or once this gate is approved. Nothing is
   * blocked then, whatever the counts below say.
   */
  gateClosed: boolean;
  /** False when the evidence readiness check could not run for this phase. */
  evidenceReadinessAvailable: boolean;
  /** Required evidence needs still awaiting upload and human review. */
  openRequiredEvidenceCount: number;
  /**
   * The phase-capture ladder's own sentence, or `null` when the phase inputs
   * are complete. Passed as the sentence rather than a count because the
   * capture ladder distinguishes unsaved, saving, dirty and unanswered inputs,
   * and each of those has its own remedy.
   */
  phaseInputsBlocker: string | null;
  /**
   * Open hard criteria the reader can act on. At P0 this EXCLUDES the criteria
   * the approval itself completes, so a gate whose only open hard checks are
   * approval-generated is not reported as blocked by them.
   */
  actionableOpenHardCount: number;
  /**
   * The first actionable open hard criterion's label, when there is one. The
   * primary line names it; without it the line says only that a hard gate is
   * open, which is the honest fallback rather than the default.
   */
  firstActionableHardLabel: string | null;
}

export interface GateBlockedCause {
  key: GateBlockedCauseKey;
  /** The reason sentence on the decision surface. */
  decisionText: string;
  /** The "Why blocked" primary line. */
  summaryLine: string;
  /** The next-action control label. */
  nextActionLabel: string;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

/**
 * Resolve why the gate is blocked, or `null` when it is not.
 *
 * `null` is the single definition of "not blocked" for this surface: the four
 * causes below ARE the blocked condition, so a slot cannot report a block
 * without a cause, and cannot report a cause the reckoning did not find.
 */
export function resolveGateBlockedCause(
  input: GateBlockedCauseInput,
): GateBlockedCause | null {
  if (input.gateClosed) return null;
  const key = resolveKey(input);
  if (!key) return null;
  switch (key) {
    case "readiness_unverified": {
      const sentence =
        "Evidence readiness could not be verified. Refresh this phase before approval.";
      return {
        key,
        decisionText: sentence,
        summaryLine: sentence,
        nextActionLabel: "Refresh evidence status",
      };
    }
    case "required_evidence_open": {
      const count = input.openRequiredEvidenceCount;
      const sentence = `${count} required evidence ${plural(
        count,
        "item",
        "items",
      )} still ${plural(
        count,
        "needs",
        "need",
      )} upload and human review before this phase can advance.`;
      return {
        key,
        decisionText: sentence,
        summaryLine: sentence,
        nextActionLabel: "Upload and review evidence",
      };
    }
    case "phase_inputs_incomplete": {
      // The capture ladder already wrote the remedy for its own arm. Reusing
      // its sentence in both slots is what stops the panel prescribing one
      // action in the decision text and a different one in the action label.
      const sentence = input.phaseInputsBlocker ?? "";
      return {
        key,
        decisionText: sentence,
        summaryLine: sentence,
        nextActionLabel: "Complete phase inputs",
      };
    }
    case "hard_criteria_open": {
      const count = input.actionableOpenHardCount;
      return {
        key,
        decisionText: `Resolve ${count} hard gate ${plural(
          count,
          "blocker",
          "blockers",
        )} before advancing. Soft items can carry as caveats.`,
        summaryLine: input.firstActionableHardLabel
          ? `Blocked by: ${input.firstActionableHardLabel}.`
          : "Blocked by an open hard gate.",
        nextActionLabel: "Clear hard blockers",
      };
    }
  }
}

function resolveKey(input: GateBlockedCauseInput): GateBlockedCauseKey | null {
  if (!input.evidenceReadinessAvailable) return "readiness_unverified";
  if (input.openRequiredEvidenceCount > 0) return "required_evidence_open";
  if (input.phaseInputsBlocker !== null) return "phase_inputs_incomplete";
  if (input.actionableOpenHardCount > 0) return "hard_criteria_open";
  return null;
}

// Did the gate ledger's criteria get EVALUATED, or is it showing a default?
//
// `buildGateCriteria` (`transformers.ts`) already carries the distinction, and
// says why in its own header: "If the evaluator cannot run (e.g. a transient
// read error) every criterion is returned `completed: false, verified: false`
// so the surface shows the criteria explicitly as 'not yet verified' rather
// than guessing a state."
//
// No surface showed anything of the kind. `verified` had ZERO readers
// repo-wide: the phase workspace's gate ledger renders
// `criterion.completed ? "✓" : "○"` and a `{met} of {total}` tally, both of
// which read an unevaluated criterion exactly like an evaluated-and-unmet one.
// So the flag whose whole purpose is to stop the surface guessing was computed
// and dropped, and the ledger stated `0 of 6` — with the same glyphs, the same
// tone and the same tally it uses for a Move that really has met nothing —
// whenever the evaluator could not run
// [[feedback_an_emitted_field_no_reader_consumes_leaves_the_fix_inert]].
//
// This module is that reader. It does not change which criteria are open or
// whether the gate is blocked: an unevaluated criterion stays `completed:
// false`, so the gate stays closed, which is the correct direction. It changes
// only what the ledger CLAIMS — a tally and a per-row mark that say the state
// was not read, in their own vocabulary rather than the met/unmet vocabulary
// they would otherwise borrow
// [[feedback_a_badge_that_repeats_its_section_pill_lets_either_test_pass_on_the_other]].

/** The two fields of a gate criterion this derivation reads. */
export interface GateCriterionVerification {
  /** Whether the evaluator actually ran for this Move. */
  verified: boolean;
}

export type GateCriteriaVerification =
  | { evaluated: true }
  | {
      evaluated: false;
      /** Replaces the `{met} of {total}` tally, which cannot be stated. */
      countLabel: string;
      /** Per-row mark, distinct from both `✓`/`○` and from `countLabel`. */
      markLabel: string;
      /** One sentence saying what the ledger does and does not know. */
      notice: string;
      /**
       * The one-line gate summary. Replaces `Blocked by: <criterion label>`,
       * which named a specific criterion as the blocker on the strength of an
       * answer nobody computed.
       */
      summaryLabel: string;
    };

/** The tally slot's text when no criterion was evaluated. */
export const GATE_CRITERIA_UNEVALUATED_COUNT_LABEL = "Not evaluated";

/** The per-row mark when no criterion was evaluated. */
export const GATE_CRITERIA_UNEVALUATED_MARK_LABEL = "State unread";

/** The one-line gate summary when no criterion was evaluated. */
export const GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL =
  "Blocked: this Move's gate state could not be read.";

/** The sentence shown once, beside the tally. */
export const GATE_CRITERIA_UNEVALUATED_NOTICE =
  "The gate evaluator could not read this Move's recorded state, so no criterion below has " +
  "been checked. An unchecked criterion is not a failed one: nothing here says a deliverable " +
  "is missing or unsigned. Refresh this phase, and retry Approve & Build.";

/**
 * Whether a gate-criteria list was evaluated, and what to show when it was not.
 *
 * An EMPTY list is `evaluated: true` — the terminal phase has no outgoing gate,
 * so there is nothing to have evaluated and nothing to warn about. That falls
 * out of `every` being vacuously true rather than being tested for, because a
 * separate `length === 0` guard ahead of it is unkillable: no input can reach
 * one branch and not the other.
 *
 * A single unverified entry is enough. `buildGateCriteria` sets the flag
 * uniformly across the list, and "not every" is the direction that cannot claim
 * a check which did not happen.
 */
export function gateCriteriaVerification(
  criteria: readonly GateCriterionVerification[],
): GateCriteriaVerification {
  if (criteria.every((criterion) => criterion.verified)) {
    return { evaluated: true };
  }
  return {
    evaluated: false,
    countLabel: GATE_CRITERIA_UNEVALUATED_COUNT_LABEL,
    markLabel: GATE_CRITERIA_UNEVALUATED_MARK_LABEL,
    notice: GATE_CRITERIA_UNEVALUATED_NOTICE,
    summaryLabel: GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL,
  };
}

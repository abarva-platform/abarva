import type { P1CharterBasisInput } from "./p1-charter-evidence";

/**
 * What the per-field charter basis control (`moves_charter_basis_v1`) says
 * about the relationship between an answer and the basis recorded against it.
 *
 * The behaviour this explains already exists and is correct: the phase-capture
 * route records a basis against the answer AS SAVED, so a save that changes the
 * answer and carries no basis of its own clears the one on file
 * (`route.ts`: `else if (valueChanged) p1BasisInputs[key] = null`). A basis
 * that was true of the previous wording must not silently vouch for new
 * wording.
 *
 * Until now nothing at the field said so. Two people hit that silence from
 * different directions:
 *
 * - someone who declares a basis, then tightens the sentence, and finds the
 *   basis gone after the save with no account of why;
 * - someone who inserts an answer from pasted notes — which stamps its own
 *   `workspace_assertion` basis BEFORE the answer is saved — and then saves the
 *   answer, which clears exactly the basis the insert just recorded.
 *
 * Both are the same rule, so one notice covers them. This module is the
 * decision alone, pure and independent of the control, so each branch can be
 * pinned without rendering anything. It only ever explains — it never clears a
 * basis, never saves, and never changes what the gate reads.
 */
export type CharterBasisEditNoticeState =
  /** Say nothing: the basis surface is not active here. */
  | "surface_off"
  /** Say nothing: this field's answer carries no charter basis. */
  | "not_a_charter_field"
  /** Say nothing: no basis is recorded, so no basis is at risk. */
  | "no_basis_recorded"
  /** A basis is recorded and the saved answer still matches it. */
  | "basis_matches_answer"
  /** The answer has been edited since the basis was recorded — a save clears it. */
  | "pending_clear";

export interface CharterBasisEditNotice {
  state: CharterBasisEditNoticeState;
  /** The sentence to render, or null when the field says nothing. */
  message: string | null;
  /**
   * True only for `pending_clear`. The control renders the amber wording for
   * this case, because the person is about to lose something they declared.
   */
  warn: boolean;
}

export interface CharterBasisEditNoticeArgs {
  /** Canonical phase-capture section key being explained. */
  sectionKey: string;
  /**
   * True when the per-field basis control is rendering for this phase — i.e.
   * `moves_charter_basis_v1` is on for the tenant AND this is P1.
   */
  basisSurfaceActive: boolean;
  /** Section keys whose answers carry a charter basis on this phase. */
  charterBasisSectionKeys: ReadonlySet<string>;
  /** The basis recorded against this field, if any. */
  recordedBasis: P1CharterBasisInput | null | undefined;
  /** The answer as last persisted — what the recorded basis vouches for. */
  persistedAnswer: string | null | undefined;
  /** The answer as currently shown in the field, edits included. */
  visibleAnswer: string | null | undefined;
}

/**
 * True when a save of this answer would clear its recorded basis.
 *
 * Deliberately the SAME comparison the route makes — `diffCaptureValues`
 * trims both sides and compares as strings — so the notice cannot promise a
 * clear the server will not perform, or stay quiet through one it will.
 */
export function charterAnswerEditedSinceBasis(
  persistedAnswer: string | null | undefined,
  visibleAnswer: string | null | undefined,
): boolean {
  return String(visibleAnswer ?? "").trim() !== String(persistedAnswer ?? "").trim();
}

/**
 * Decide what the field says about its recorded basis.
 *
 * Branches are ordered widest-first — surface, then field, then whether there
 * is anything to lose, then whether it is at risk — so a caller reading the
 * state gets the narrowest true statement about this field.
 */
export function charterBasisEditNotice(
  args: CharterBasisEditNoticeArgs,
): CharterBasisEditNotice {
  if (!args.basisSurfaceActive) {
    return { state: "surface_off", message: null, warn: false };
  }
  if (!args.charterBasisSectionKeys.has(args.sectionKey)) {
    return { state: "not_a_charter_field", message: null, warn: false };
  }
  if (!args.recordedBasis) {
    return { state: "no_basis_recorded", message: null, warn: false };
  }
  if (charterAnswerEditedSinceBasis(args.persistedAnswer, args.visibleAnswer)) {
    return {
      state: "pending_clear",
      message:
        "This answer has changed since you recorded how you know it. Saving the answer clears the basis — record it again afterwards, so it describes what the answer now says.",
      warn: true,
    };
  }
  return {
    state: "basis_matches_answer",
    message:
      "Recorded against this answer as saved. Change the answer and this clears, so it never vouches for wording you have not reviewed.",
    warn: false,
  };
}

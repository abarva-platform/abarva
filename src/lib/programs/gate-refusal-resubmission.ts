/**
 * Does the phase-gate refusal on screen allow the reader to submit again?
 *
 * `POST /api/v1/programs/:id/phase-gate-approval` already answers that. Three
 * of its refusals are classified by `transition-evidence-basis.ts`, which
 * carries a per-cause `resubmitCanSatisfy` for exactly this question and sets
 * it `false` for `gap_assessment_failed` (HTTP 422): both reads answered and
 * the pure reduction over them threw, so recomputing it cannot answer
 * differently. That refusal's own `detail` says so in words — "Submitting the
 * gate again will not change the answer — the same records are reduced the same
 * way."
 *
 * The one surface that submits a phase gate then appended its standing remedy
 * to every refusal without exception: review the open gate item, approve the
 * draft or upload an edited version, and use the submit control again. So the
 * screen stated the route's sentence ruling a re-submission out and, in the
 * same breath, prescribed one — the defect `transition-evidence-basis.ts` was
 * written to prevent on the route, re-introduced by the reader.
 *
 * This module is the missing reader. It relaxes nothing: the route still
 * refuses, the gate still does not advance, nothing is waived, and the
 * refusal's own text is still shown in full. Only the remedy that follows it
 * is withheld, and only where the route has already ruled it out.
 */

/** The part of a refusal body this module reads. Shape is untrusted JSON. */
export interface GateRefusalResubmissionLike {
  resubmitCanSatisfy?: unknown;
}

/**
 * Whether a reader should still be told to submit the gate again.
 *
 * Defaults to `true`. Most refusal codes carry no `resubmitCanSatisfy` at all
 * — a hard-gate block, an incomplete capture, an open evidence slot are all
 * answerable by doing the named work and submitting again — and those keep the
 * remedy they have today. Only an explicit `false` withholds it, so a body
 * that omits the field, sends it as a string, or fails to parse is never read
 * as a refusal nobody can clear.
 */
export function gateRefusalAllowsResubmission(
  payload: GateRefusalResubmissionLike | null | undefined,
): boolean {
  return payload?.resubmitCanSatisfy !== false;
}

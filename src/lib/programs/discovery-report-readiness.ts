/**
 * P2 readiness reads the Discovery Report's TEXT, and both halves of that read
 * were unsound.
 *
 * 1. The text was assembled as
 *    `[content ?? "", structured_data ? JSON.stringify(...) : ""].join("\n")`.
 *    When a report row carries no readable version, both halves are `""` and the
 *    join still yields `"\n"` — length 1. Every caller then tested
 *    `latestDiscoveryReportText.length > 0` as its "a report exists and says
 *    something" guard, and that test could never fail once a row existed.
 *
 *    `p2_readiness_cleared` is the criterion this broke, because it is the one
 *    that passes on the ABSENCE of blocking language rather than the presence of
 *    a clearance statement: non-empty + no hard gap + no "conditional proceed".
 *    A contentless report satisfies all three, so a HARD criterion on the P2
 *    gate was cleared by a report that said nothing at all. The two sibling
 *    readers (`discoveryReportHasWorkshopEvidence`,
 *    `discovery_stakeholders_named`) also require a positive regex match, so the
 *    vacuity never changed their answer — this is why it stayed invisible.
 *
 * 2. The failure-reason ladder had three arms and no final else, so the state
 *    "row present, text genuinely empty" had no sentence. That state was
 *    unreachable only BECAUSE of the vacuity above: fixing the length test
 *    without extending the ladder would hand a signed-in reviewer a failed HARD
 *    gate with no stated cause. The two defects masked each other, so both are
 *    fixed here, together.
 *
 * Reachability, measured: every live writer of a `deliverable_versions` row
 * supplies content (`completeDeliverable` falls back to the title;
 * `signOffDeliverable`'s upload path throws `approved_final_content_required`;
 * both write adapters insert the row and its version in ONE transaction). The
 * one creator of a contentless row, `ensurePhaseGateDeliverable` — whose own doc
 * says "a hollow record still satisfies the gate" — has no live callers today.
 * So this is a GUARD on a HARD gate criterion, not a fix for a live misread:
 * it makes the emptiness test mean what every caller already assumed, so that
 * wiring that helper up cannot silently open the P2 gate.
 */

/** The shape `deliverable_versions` is selected into by the gate evaluator. */
export interface DiscoveryReportVersionRow {
  content: string | null;
  structured_data: Record<string, unknown> | null;
}

/**
 * The Discovery Report's searchable text, lowercased, or `""` when the row
 * carries nothing readable.
 *
 * Returning `""` for "nothing readable" is the whole point: callers guard on
 * `.length > 0`, and that guard has to be able to fail.
 */
export function discoveryReportTextFromLatestVersion(
  version: DiscoveryReportVersionRow | null | undefined,
): string {
  const parts = [
    typeof version?.content === "string" ? version.content : "",
    version?.structured_data &&
    !isGeneratedReportRecord(version.structured_data)
      ? JSON.stringify(version.structured_data)
      : "",
  ].filter((part) => part.trim().length > 0);
  return parts.join("\n").toLowerCase();
}

/**
 * The `structured_data.source` the Moves generator stamps on every report it
 * writes (`persistMoveGeneratedArtifact`).
 */
export const GENERATED_REPORT_SOURCE = "moves_program_generate";

/**
 * Whether a version's structured data is the generator's record ABOUT the
 * report rather than the report.
 *
 * A generated report's words are all in `content` (the rendered HTML, draft
 * banner included). Its `structured_data` carries what generation READ and how
 * it was measured: `solution_context` — the Move's whole P2 capture, gaps and
 * open questions included — and `golden_bar`, whose `missingExactEvidenceTerms`
 * lists the terms the report LACKS. Reading that JSON as report text judged the
 * report by its inputs, in both directions: a current-state finding such as
 * "lineage unverified" in the capture read as the report's own hard gap (and the
 * refusal's remedy, regenerate, re-embeds the same capture), while "stakeholder"
 * or "baseline" in the inputs credited a report that never says either.
 *
 * Generated approval is "as is" — no new version is written — so this is the
 * version the gate reads after sign-off. Uploaded or other versions keep their
 * structured data, whose shape this module does not own.
 */
function isGeneratedReportRecord(
  structuredData: Record<string, unknown>,
): boolean {
  return structuredData.source === GENERATED_REPORT_SOURCE;
}

/** Inputs the P2 readiness sentence is derived from. */
export interface P2ReadinessBlockedReasonInput {
  /** Whether a `discovery_report` (or alias) deliverable row was found. */
  hasReportRow: boolean;
  /** The row's latest version text, from the helper above. */
  reportText: string;
  /** Whether that text carries unresolved hard-gap language. */
  hasHardGap: boolean;
}

/**
 * The sentence for a FAILED `p2_readiness_cleared`, for every way it can fail.
 *
 * Exhaustive by construction: the last arm takes the remaining case rather than
 * testing for it, so a new failing state cannot fall through to no sentence
 * [[feedback_an_enumerated_ladder_passes_what_the_broad_guard_refused]].
 *
 * The last arm is DEFENSIVE and is not reachable from the gate evaluator today,
 * and the reason is worth knowing before anyone reads it as a live sentence:
 * `p2_readiness_cleared` is a NEGATIVE test. Its passing arm is "text is
 * readable AND carries no hard-gap language AND does not say conditional
 * proceed", so any readable Discovery Report that merely avoids those words
 * clears the criterion — including one that records no proceed decision at all.
 * Requiring an affirmative clearance statement instead would make the HARD P2
 * criterion strictly harder to satisfy for reports that read as fine today, so
 * it is a governance/product decision rather than a defect fix, and it is not
 * made here. The arm exists so that tightening it later cannot reintroduce a
 * failing state with no sentence.
 */
export function p2ReadinessBlockedReason(
  input: P2ReadinessBlockedReasonInput,
): string {
  if (!input.hasReportRow) {
    return "No signed Discovery Report is available for P2 readiness. Approve or upload the client-approved Discovery Report in Files & Evidence, then rerun Approve & Build.";
  }
  if (input.hasHardGap) {
    return "The signed Discovery Report still contains unresolved hard-gap, hold, unverified, or not-yet-attested language. Upload a client-approved replacement or regenerate/edit the Discovery Report so it explicitly clears P2 or carries only non-blocking P3 design caveats.";
  }
  if (/\bconditional proceed\b/.test(input.reportText)) {
    return "The signed Discovery Report says conditional proceed. Replace it with a client-approved decision that either clears P2 or records a hold/discontinue decision.";
  }
  if (!input.reportText.length) {
    return "The Discovery Report record for this Move has no readable content, so P2 readiness cannot be assessed from it. Regenerate the Discovery Report, or upload the client-approved version in Files & Evidence, then rerun Approve & Build.";
  }
  return "The Discovery Report does not state that P2 is clear. Regenerate or edit it so it records an explicit proceed decision for P3, then rerun Approve & Build.";
}

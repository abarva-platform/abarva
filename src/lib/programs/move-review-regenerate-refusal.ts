// Moves · review regeneration · what a reviewer is told when it is refused.
//
// `POST /api/v1/programs/:programId/artifacts/:artifactId/review-regenerate`
// is the "Create next version" control in `FileCabinetPanel` — the one way a
// reviewer turns review notes into the next durable version of a Move
// deliverable. It is the route's only product reader, and it renders
// `json.detail || json.error || HTTP n`.
//
// That reader is correct; the producer was not. Of the route's exits:
//
//   - `feedback_required` and `source_artifact_not_extractable` carried
//     authored prose, so they read as product copy.
//   - `artifact_not_found` carried NO detail, so the reader printed the bare
//     token `artifact_not_found` to a signed-in reviewer.
//   - every other failure had no code at all. The handler's catch was a bare
//     `return tenancyErrorResponse(err)`, and that helper RE-THROWS anything
//     that is not a `TenancyError` — so a storage, database, document-build or
//     model-stream failure threw a second time from inside the catch, the
//     handler rejected, and the reader fell all the way through to `HTTP 500`.
//
// The second half is the one that matters, because this handler writes TWICE:
// `saveMoveArtifact` stores the revised artifact, and only then is the
// editable Word companion built and stored. A failure in that second half
// leaves the revised version ALREADY RECORDED. A reviewer who reads `HTTP 500`
// as "nothing happened" and sends the same notes again records a second
// version pair.
//
// So each code is labelled with what is true of the vault when it is emitted,
// and the sentence has to agree with the label:
//
//   `nothing`  refused before either write; may say nothing was created.
//   `landed`   refused after the revised version was stored; must say so, and
//              must warn that repeating the request would record another.
//   `unknown`  the catch-all, reachable on EITHER side of the writes, so it
//              claims neither and sends the reviewer to look instead.
//
// Order the exits against the writes before writing any of their copy.

/**
 * The exact clause every `nothing` refusal states, and that no other refusal
 * may state. Held as a constant so the suite asserts the claim rather than a
 * paraphrase of it.
 */
export const NOTHING_RECORDED_CLAUSE = "No revised version was created.";

/**
 * The exact clause the `landed` refusal states. The catch-all must NOT state
 * it — that is the over-claim direction, and it is mutated.
 */
export const VERSION_RECORDED_CLAUSE = "The revised version was recorded";

/** What is true of the artifact vault when a given refusal is emitted. */
export type MoveReviewRegenerateRecordedState =
  | "nothing"
  | "landed"
  | "unknown";

/**
 * The refusal codes the review-regenerate route declares. The route annotates
 * each emit with `satisfies MoveReviewRegenerateRefusalCode`, so a sixth code
 * cannot be added there without this list being edited.
 *
 * The shared tenancy codes (`unauthenticated`, `forbidden`, `no_client`,
 * `tenant_lookup_unavailable`) are deliberately absent: they are owned by
 * `tenancyErrorResponse` and shared across every v1 route, so their copy is
 * not this route's to author. Two of them still reach a reader as a bare
 * token; that is a separate change over the shared helper.
 */
export const MOVE_REVIEW_REGENERATE_REFUSAL_CODES = [
  "feedback_required",
  "artifact_not_found",
  "source_artifact_not_extractable",
  "editable_companion_failed",
  "internal_error",
] as const;

export type MoveReviewRegenerateRefusalCode =
  (typeof MOVE_REVIEW_REGENERATE_REFUSAL_CODES)[number];

/**
 * What the vault holds when each code is emitted, measured against the two
 * `saveMoveArtifact` calls in the handler.
 */
export const MOVE_REVIEW_REGENERATE_RECORDED_STATE: Record<
  MoveReviewRegenerateRefusalCode,
  MoveReviewRegenerateRecordedState
> = {
  // Refused before the plan is built, let alone stored.
  feedback_required: "nothing",
  artifact_not_found: "nothing",
  source_artifact_not_extractable: "nothing",
  // Emitted only from the segment after the revised artifact is stored.
  editable_companion_failed: "landed",
  // The catch-all. Reachable from the artifact read, the body download, the
  // text extraction, the model stream, EITHER store, and the document build.
  internal_error: "unknown",
};

/**
 * The sentence a reviewer is shown for each refusal, in `detail`.
 *
 * Every sentence names a next action, and none of them returns the code: a
 * code is not something a reviewer can do. The code stays in the response body
 * for whoever is reading logs.
 */
export const MOVE_REVIEW_REGENERATE_REFUSAL_DETAIL: Record<
  MoveReviewRegenerateRefusalCode,
  string
> = {
  feedback_required: `Review feedback is required before regeneration. ${NOTHING_RECORDED_CLAUSE}`,
  artifact_not_found: `That document is not on this Move. ${NOTHING_RECORDED_CLAUSE} Reopen the document list and start from the document you want revised.`,
  source_artifact_not_extractable: `The source artifact could not be read as a supported text, DOCX, or PPTX document. ${NOTHING_RECORDED_CLAUSE}`,
  editable_companion_failed: `${VERSION_RECORDED_CLAUSE}, but its editable Word copy could not be produced. Open the document list to find the new version — sending the same notes again would record a second version.`,
  internal_error:
    "Creating the next version failed. A revised version may or may not " +
    "have been recorded, so open the document list to check before sending " +
    "the same notes again.",
};

/** True for a refusal code this module names. */
export function isMoveReviewRegenerateRefusalCode(
  code: unknown,
): code is MoveReviewRegenerateRefusalCode {
  return (
    typeof code === "string" &&
    (MOVE_REVIEW_REGENERATE_REFUSAL_CODES as readonly string[]).includes(code)
  );
}

/**
 * The `detail` sentence for a code this route declares.
 *
 * Takes the code as a literal type so a caller cannot ask for a sentence that
 * does not exist, and so adding a code to the route without adding its copy
 * here is a compile error rather than a missing sentence at runtime.
 */
export function moveReviewRegenerateRefusalDetail(
  code: MoveReviewRegenerateRefusalCode,
): string {
  return MOVE_REVIEW_REGENERATE_REFUSAL_DETAIL[code];
}

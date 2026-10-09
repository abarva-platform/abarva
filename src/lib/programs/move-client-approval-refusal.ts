// Moves · client approval · what a reviewer is told when an approval is refused.
//
// `POST /api/v1/programs/:programId/artifacts/:artifactId/client-approval` is
// how a reviewer accepts an AI-prepared draft as the AUTHORITATIVE phase
// deliverable — either by accepting the draft as it stands or by uploading an
// edited final to replace it. The decision it records is read back downstream
// before the next phase will generate, so a refusal that leaves the reviewer
// without a next action stalls the phase rather than merely annoying them.
//
// The route declares nineteen distinct refusal codes across twenty-one emits.
// Both of its product readers (`acceptGeneratedDraft` and
// `uploadApprovedReplacement`, the only two in the repository) rendered them as
// `json.detail || json.error || HTTP <status>` — detail-first — and `detail` on
// THIS route is not uniformly prose:
//
//   - `unsupported_type` carries the raw MIME string, so a reviewer who
//     attached an archive was shown `application/zip`;
//   - `file_too_large` carries a retyped byte count, which reached the screen
//     as `max 104857600 bytes`;
//   - `generated_artifact_final_render_failed` prefers a thrown `Error.message`
//     over the authored fallback sitting beside it, so the renderer's internal
//     text was shown whenever one was thrown;
//   - `internal_error` carries `(err as Error).message` — a raw JS message to a
//     signed-in product user;
//   - and both `not_found` emits carry NO detail at all, so detail-first fell
//     through to the bare token `not_found`.
//
// No reader precedence fixes a field that is prose for some codes and a machine
// value for others, which is why this module keys the sentence on the CODE and
// consults `detail` only for the codes whose server text is written for a
// reviewer. `DETAIL_IS_REVIEWER_PROSE` is that whole list. Do not widen it to
// "harmonise" with `describeEvidenceDecisionRefusal`, whose route emits no
// machine values and therefore can prefer `detail` for everything.
//
// WHAT WAS RECORDED is the second thing each sentence has to settle, and it is
// not uniform either. Every code up to and including `generated_artifact_*` and
// the upload validations refuses BEFORE any write, so those sentences may state
// that nothing was recorded. `sign_off_failed` cannot: it is reached only after
// `saveMoveArtifact` has stored the document and `draftModuleDeliverable` has
// recorded a draft version, so the document IS in the cabinet and only the
// approval is missing. Its previous sentence ("Deliverable could not be signed
// off.") said neither, and a reviewer who reads it as "nothing happened" and
// approves again adds a second draft version. `internal_error` can fire on
// either side of those writes, so it claims NEITHER and sends the reviewer to
// look.
//
// Reachability differs by approval mode and the sentences do not: the five
// upload validations (`file_required`, `file_too_large`, `unsupported_type`,
// `approved_upload_not_extractable`, `unsupported_financial_claim_delta`) sit
// inside the route's `isFileUploadApproval` branch and so are unreachable from
// the accept-the-draft reader, while the three final-render codes
// (`generated_artifact_final_render_failed`,
// `generated_artifact_final_not_available`, `artifact_storage_unavailable`) sit
// in the other branch and are unreachable from the upload reader. Both readers
// write the same `actionErr` state, so one describer serves both.
//
// The raw code is never returned. It is not an action a reviewer can take, and
// it stays visible to an engineer in the response body itself.

import { APPROVED_EVIDENCE_BASIS_REFUSAL_CODES } from "@/lib/programs/approved-evidence-basis-refusal";
// The same attachment cap governs both upload paths into a Move, so the
// megabyte wording is the evidence upload describer's, not a second copy of
// the same arithmetic.
import { describeUploadSizeLimit } from "@/lib/programs/move-upload-refusal";

/**
 * The refusal codes the client-approval route declares in its own body. The
 * route annotates each with `satisfies MoveClientApprovalRefusalCode`, so a
 * twentieth cannot be added there without this list being edited — a tsc
 * error, not a source scrape.
 *
 * The approved-evidence basis codes are NOT listed here: the route emits them
 * through `approvedEvidenceBasisRefusalCode(refusal)`, whose matching
 * `describeApprovedEvidenceBasisRefusal(refusal, "approval")` already writes a
 * reviewer sentence into `detail`. They are folded in below from that module's
 * own export so the two cannot drift.
 */
export const MOVE_CLIENT_APPROVAL_OWN_REFUSAL_CODES = [
  "not_found",
  "wrong_move",
  "unsupported_artifact_type",
  "unsupported_phase",
  "architecture_lineage_not_current",
  "forbidden",
  "generated_artifact_not_extractable",
  "file_required",
  "file_too_large",
  "unsupported_type",
  "approved_upload_not_extractable",
  "unsupported_financial_claim_delta",
  "generated_artifact_final_render_failed",
  "generated_artifact_final_not_available",
  "artifact_storage_unavailable",
  "sign_off_failed",
  "internal_error",
] as const;

export type MoveClientApprovalOwnRefusalCode =
  (typeof MOVE_CLIENT_APPROVAL_OWN_REFUSAL_CODES)[number];

/** Every code either reader can receive, including the delegated basis codes. */
export const MOVE_CLIENT_APPROVAL_REFUSAL_CODES = [
  ...MOVE_CLIENT_APPROVAL_OWN_REFUSAL_CODES,
  ...APPROVED_EVIDENCE_BASIS_REFUSAL_CODES,
] as const;

export type MoveClientApprovalRefusalCode =
  (typeof MOVE_CLIENT_APPROVAL_REFUSAL_CODES)[number];

/**
 * The codes whose server `detail` is a sentence written for a reviewer. For
 * every other code `detail` holds a machine value, a thrown message, or
 * nothing, and is discarded in favour of the authored sentence below.
 *
 * `architecture_lineage_not_current` is here because all three of its emits
 * take their detail from `classifyP3ArchitectureLineagePrecondition` or
 * `validateArchitectureGenerationLineage`, both of which author per-cause
 * reviewer prose that names the remedy — text this module cannot improve on
 * and must not flatten to one sentence. The basis codes are here for the same
 * reason.
 */
export const DETAIL_IS_REVIEWER_PROSE: readonly MoveClientApprovalRefusalCode[] =
  [
    "wrong_move",
    "unsupported_artifact_type",
    "unsupported_phase",
    "architecture_lineage_not_current",
    "forbidden",
    "generated_artifact_not_extractable",
    "approved_upload_not_extractable",
    "unsupported_financial_claim_delta",
    ...APPROVED_EVIDENCE_BASIS_REFUSAL_CODES,
  ];

/** The file formats the approval upload allowlist accepts, in reviewer language. */
const ACCEPTED_FORMATS =
  "PDF, Word, Excel, PowerPoint, CSV, JSON, Markdown or plain text";

/** True for a refusal code this module names. */
export function isMoveClientApprovalRefusalCode(
  code: unknown,
): code is MoveClientApprovalRefusalCode {
  return (
    typeof code === "string" &&
    (MOVE_CLIENT_APPROVAL_REFUSAL_CODES as readonly string[]).includes(code)
  );
}

function authoredSentence(code: MoveClientApprovalRefusalCode): string {
  switch (code) {
    case "not_found":
      return (
        "This Move or this document could not be read, so the approval was " +
        "not recorded. Reload Files & Evidence and open the document again."
      );
    case "file_required":
      return (
        "No file reached the server, so the approval was not recorded. " +
        "Choose the edited final again, or accept the prepared draft as it " +
        "stands."
      );
    case "file_too_large":
      return (
        `The edited final is over the ${describeUploadSizeLimit()} ` +
        "upload limit, so the approval was not recorded. Save it smaller — " +
        "flatten embedded images or remove attachments — and upload it again."
      );
    case "unsupported_type":
      return (
        "That file is not a format this workspace can read as an approved " +
        `final, so the approval was not recorded. Save it as ` +
        `${ACCEPTED_FORMATS} and upload it again.`
      );
    case "generated_artifact_final_render_failed":
      return (
        "The prepared draft could not be rendered into the final editable " +
        "file the approval has to store, so nothing was recorded. Rebuild " +
        "the deliverable and approve the version that rebuild produces, or " +
        "download this draft, edit it, and upload it as the approved final."
      );
    case "generated_artifact_final_not_available":
      return (
        "Accepting this draft needs a structured version that can render to " +
        "a final Word or PowerPoint file, and this one has none, so nothing " +
        "was recorded. Rebuild the deliverable, or download it, edit it, and " +
        "upload it as the approved final."
      );
    case "artifact_storage_unavailable":
      return (
        "The final editable file could not be stored, so the approval was " +
        "not recorded. Nothing changed on this Move — try again shortly."
      );
    case "sign_off_failed":
      return (
        "The document was stored and a draft version recorded, but the " +
        "approval itself was not. Reload Files & Evidence to see the stored " +
        "draft, then approve that version rather than approving this one " +
        "again — approving twice records a second draft."
      );
    case "internal_error":
      return (
        "The approval failed and the server did not say where. It may have " +
        "stored the document before failing, so reload Files & Evidence and " +
        "check what is recorded before approving again."
      );
    default:
      // Reachable only for a `DETAIL_IS_REVIEWER_PROSE` code whose `detail`
      // arrived empty — the route always sends one, so this is the
      // belt-and-braces arm, not a cause with its own remedy.
      return UNNAMED_REFUSAL;
  }
}

const UNNAMED_REFUSAL =
  "The approval was refused and the reason was not recognised. Reload Files " +
  "& Evidence and check whether the approval was recorded before trying " +
  "again.";

/**
 * Say, in product language, why a client approval was refused.
 *
 * A named code gets its authored sentence. `detail` wins only for the codes in
 * `DETAIL_IS_REVIEWER_PROSE`, where the server's own text is per-cause
 * reviewer prose that this module cannot improve on. Anything else — an
 * unnamed code, a blank body, a bare HTTP status — gets the default, which
 * claims nothing about what was recorded.
 */
export function describeMoveClientApprovalRefusal(input: {
  code?: unknown;
  detail?: unknown;
}): string {
  if (isMoveClientApprovalRefusalCode(input.code)) {
    if (DETAIL_IS_REVIEWER_PROSE.includes(input.code)) {
      const detail =
        typeof input.detail === "string" ? input.detail.trim() : "";
      if (detail) return detail;
    }
    return authoredSentence(input.code);
  }
  return UNNAMED_REFUSAL;
}

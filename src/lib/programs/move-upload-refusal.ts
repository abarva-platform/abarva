// Moves · evidence upload · what a reviewer is told when an upload is refused.
//
// `POST /api/v1/programs/:programId/artifacts/upload` is how off-platform
// evidence enters a Move, and approving that evidence is a HARD precondition
// for crossing the discovery gate. A refused upload therefore has to leave the
// reviewer with a next action, not a token.
//
// It did not. The route declares six refusal codes and its three readers each
// rendered them differently, none of them in product language:
//
//   - `FileCabinetPanel.onUpload` read `error || detail`, so five of the six
//     reached the screen as the bare code (`unsupported_type`). This is the
//     only reader the redesigned capture flow can reach, so it is the one the
//     demo walk meets.
//   - `EvidenceUploadControl.uploadOne` and
//     `CurrentStateFamilyUploadPanel.uploadSessionArtifact` read `detail` FIRST
//     — which is worse for exactly the codes the first reader mangled, because
//     the route puts a machine value there: `unsupported_type` carries the raw
//     MIME string, `file_too_large` a byte count, `file_required` the name of a
//     multipart form field. Both are reachable only with `moves_capture_v2`
//     off, so they serve every tenant that has not been enrolled.
//
// No reader precedence fixes that, which is the point of this module: `detail`
// is NOT uniformly prose on this route, so a named code earns an authored
// sentence instead. `detail` is consulted only for the two codes whose server
// text is written for a reviewer, and `DETAIL_IS_REVIEWER_PROSE` is the whole
// list — do not widen it to "harmonise" with
// `describeEvidenceDecisionRefusal`, whose route emits no machine values and
// which therefore can and does prefer `detail` for everything.
//
// The raw code is never returned. It is not an action a reviewer can take, and
// it stays visible to an engineer in the response body itself.

import { MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/programs/attachments/mime";

/**
 * The quarantine code, declared by `sensitiveUploadRejectedResponse` in
 * `@/lib/security/sensitive-upload-guard`. Repeated here rather than imported
 * because that module reaches a regex-table scanner, and every reader of this
 * copy is a client component — the sentence is not worth the bundle. The
 * suite imports the guard's own export and asserts the two agree, so the
 * repetition cannot drift unnoticed.
 */
const SENSITIVE_UPLOAD_QUARANTINE_CODE = "sensitive_data_quarantined";

/**
 * The refusal codes the Moves upload route declares. The route annotates each
 * of its own five with `satisfies MoveUploadRefusalCode`, so a sixth cannot be
 * added there without this list being edited; the quarantine code is the
 * shared guard's, pinned against it in the suite.
 */
export const MOVE_UPLOAD_REFUSAL_CODES = [
  "file_required",
  "file_too_large",
  "unsupported_type",
  "evidence_family_requires_evidence_upload",
  "unknown_evidence_family",
  SENSITIVE_UPLOAD_QUARANTINE_CODE,
] as const;

export type MoveUploadRefusalCode = (typeof MOVE_UPLOAD_REFUSAL_CODES)[number];

/**
 * The codes whose server `detail` is a sentence written for a reviewer. For
 * every other code `detail` holds a machine value and is discarded.
 */
export const DETAIL_IS_REVIEWER_PROSE: readonly MoveUploadRefusalCode[] = [
  "evidence_family_requires_evidence_upload",
  "unknown_evidence_family",
];

/** The upload cap as the limit itself states it, never a retyped literal. */
export function describeUploadSizeLimit(
  bytes: number = MAX_ATTACHMENT_SIZE_BYTES,
): string {
  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}

/** The file formats the upload allowlist accepts, in reviewer language. */
const ACCEPTED_FORMATS =
  "PDF, Word, Excel, PowerPoint, CSV, JSON, Markdown or plain text, a PNG or " +
  "JPEG image, or an MP3/M4A/MP4 recording";

function namedFile(fileName: unknown): string {
  const name = typeof fileName === "string" ? fileName.trim() : "";
  return name || "That file";
}

/** True for a refusal code this module names. */
export function isMoveUploadRefusalCode(
  code: unknown,
): code is MoveUploadRefusalCode {
  return (
    typeof code === "string" &&
    (MOVE_UPLOAD_REFUSAL_CODES as readonly string[]).includes(code)
  );
}

/**
 * Say, in product language, why an evidence upload was refused.
 *
 * Every named code refuses BEFORE the bytes are stored, so each sentence may
 * state that nothing was stored. An unnamed code may have come from the
 * catch-all after a partial write, so the default deliberately does not claim
 * it — it sends the reviewer to the cabinet to look instead.
 */
export function describeMoveUploadRefusal(input: {
  code?: unknown;
  detail?: unknown;
  fileName?: unknown;
}): string {
  const subject = namedFile(input.fileName);
  if (isMoveUploadRefusalCode(input.code)) {
    if (DETAIL_IS_REVIEWER_PROSE.includes(input.code)) {
      const detail =
        typeof input.detail === "string" ? input.detail.trim() : "";
      if (detail) return detail;
    }
    switch (input.code) {
      case "file_required":
        return (
          `${subject} did not reach the server, so nothing was stored. ` +
          "Choose the file again and upload it."
        );
      case "file_too_large":
        return (
          `${subject} is over the ${describeUploadSizeLimit()} upload limit, ` +
          "so nothing was stored. Upload a smaller export, or split it and " +
          "upload the parts."
        );
      case "unsupported_type":
        return (
          `${subject} is not a file type this workspace can read, so nothing ` +
          `was stored. Upload it as ${ACCEPTED_FORMATS}.`
        );
      case "evidence_family_requires_evidence_upload":
        return (
          "A required evidence family can only be declared for an evidence " +
          "upload. Change the upload type to evidence, or upload the file " +
          "without declaring a family."
        );
      case "unknown_evidence_family":
        return (
          `${subject} was not stored: the evidence family it was declared ` +
          "against is not one this Move requires. Pick a family from the " +
          "list, or upload it without declaring one."
        );
      case SENSITIVE_UPLOAD_QUARANTINE_CODE:
        return (
          `${subject} was not uploaded. It appears to contain personal or ` +
          "regulated identifiers, so nothing was stored. Remove the " +
          "identifiers and upload again."
        );
    }
  }
  return (
    `${subject} was not uploaded, and the server did not say why. Try again; ` +
    "if it keeps failing, open Files & Evidence to check whether a partial " +
    "record landed before uploading it a third time."
  );
}

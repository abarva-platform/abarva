// Moves · evidence upload · which writes had already happened when it failed.
//
// `POST /api/v1/programs/:programId/artifacts/upload` is how off-platform
// evidence enters a Move, and approving that evidence is a HARD precondition
// for crossing the discovery gate. It performs two writes, in this order,
// inside `saveMoveArtifact`: the bytes go to the Blob container, then a
// `move_artifacts` row registers them. Registration is what puts a file in the
// File Cabinet, so bytes without a row are invisible to the reviewer.
//
// The route's catch was `return tenancyErrorResponse(err)`. That helper's last
// statement is `throw err`, so anything that is not a `TenancyError` — a
// failed insert, a malformed multipart body, a scanner throw — was thrown a
// SECOND time from inside the catch, the handler rejected, and the framework
// answered with no body at all. All three live readers do
// `await res.json().catch(() => ({}))`, so `error` arrived `undefined` and
// `describeMoveUploadRefusal` fell to its unnamed default. That sentence opens
// "was not uploaded" — an assertion about the two writes that nothing had
// checked, and that is FALSE for one of the three exits below.
//
// Ordered against the writes, the catch has exactly three exits. The route
// records which one it is in with a single variable, because the thrown value
// cannot tell them apart: the insert rejects with a driver error that looks the
// same as a scanner's.
//
//   before_storage  Form parsing, the archetype read behind a declared
//                   evidence family, the sensitive-data assessment, reading
//                   the file's bytes, and choosing the artifact type. Nothing
//                   was stored and no row exists. Uploading again is the whole
//                   remedy.
//
//   storing         `saveMoveArtifact` threw. Its blob upload swallows its own
//                   failure into a boolean, so the throw that reaches here is
//                   the `move_artifacts` insert: the bytes MAY be sitting in
//                   the container while no row names them. The reviewer cannot
//                   find that by looking, because the cabinet lists rows.
//                   Uploading again is safe — it takes a fresh version number
//                   and supersedes nothing, since nothing was registered.
//
//   stored          The row is written, the extraction is queued, and the
//                   RESPONSE failed. The ingestion summary carries model
//                   output, so a value `JSON` cannot represent throws at
//                   serialization time, after every write has landed. This is
//                   the exit whose sentence matters most: it is a completed
//                   upload, and telling this reviewer "nothing was stored,
//                   upload it again" is precisely what files a second copy of
//                   a file that is already there.
//
// Kept out of the route file and free of `server-only` so a suite can import
// the mapping directly, and kept separate from `move-upload-refusal` because
// that module is pulled into three client components and has no business
// knowing HTTP status codes.

import type { MoveUploadRefusalCode } from "@/lib/programs/move-upload-refusal";

/** Where the upload was, relative to its two writes, when it threw. */
export type MoveUploadWriteStage = "before_storage" | "storing" | "stored";

/** What a reviewer can be told actually landed. */
export type MoveUploadLandedState =
  | "nothing"
  | "bytes_without_registration"
  | "bytes_and_registration";

export type MoveUploadWriteFailure = {
  /** The response body's `error`; `describeMoveUploadRefusal` owns its sentence. */
  code: MoveUploadRefusalCode;
  /** Which writes had landed. Named so the sentence cannot drift from it. */
  landed: MoveUploadLandedState;
  /** Engineer-facing. Deliberately NOT in `DETAIL_IS_REVIEWER_PROSE`. */
  detail: string;
  /**
   * 500 for all three. Two are genuine server failures; the third is a
   * completed write whose response could not be produced, which is still a
   * failure of this request even though the upload succeeded. The reviewer is
   * steered by the code's sentence, not by the status.
   */
  status: number;
  /** True when uploading the same file again is the right next action. */
  retryIsSafe: boolean;
};

const BY_STAGE: Record<MoveUploadWriteStage, MoveUploadWriteFailure> = {
  before_storage: {
    code: "upload_failed_before_storage",
    landed: "nothing",
    detail:
      "The upload failed before any bytes were stored and before any artifact row was written.",
    status: 500,
    retryIsSafe: true,
  },
  storing: {
    code: "upload_not_registered",
    landed: "bytes_without_registration",
    detail:
      "saveMoveArtifact threw: the blob may have been written but the move_artifacts row was not.",
    status: 500,
    retryIsSafe: true,
  },
  stored: {
    code: "upload_registered_response_failed",
    landed: "bytes_and_registration",
    detail:
      "The artifact was stored and registered; serialising the success response failed.",
    status: 500,
    retryIsSafe: false,
  },
};

/** Name an upload failure by the writes that had already happened. */
export function classifyMoveUploadWriteFailure(
  stage: MoveUploadWriteStage,
): MoveUploadWriteFailure {
  return BY_STAGE[stage];
}

/** Every code this classifier can emit, for the copy module to be pinned against. */
export const MOVE_UPLOAD_WRITE_STAGE_CODES: readonly MoveUploadRefusalCode[] = [
  BY_STAGE.before_storage.code,
  BY_STAGE.storing.code,
  BY_STAGE.stored.code,
];

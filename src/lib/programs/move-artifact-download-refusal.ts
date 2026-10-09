// Why a Move artifact download was refused — three causes, three remedies.
//
// `GET /api/v1/programs/:programId/artifacts/:artifactId/download` is the href
// behind BOTH controls on every row of a Move's document cabinet ("Open" and
// "Download"). They are plain anchors, so whatever body this route returns is
// rendered to the signed-in reader verbatim, as a page. It is a product
// surface, not a machine channel.
//
// Until this module the route answered one `null` from `downloadArtifactBytes`
// with one 404 reading `artifact_unavailable` / "not found or storage
// unconfigured" — a disjunction the reader is left to resolve, naming no
// remedy, for three causes that need three different responses:
//
//   • No such row for this reader. The id is not filed under this Move for
//     this client — a mistyped or stale link. Terminal; the file is not here.
//   • The row exists and records that its contents were NEVER written to
//     object storage (`metadata.storage === "unconfigured"`, which
//     `saveMoveArtifact` stamps when its best-effort Blob write fails). The
//     only copy was the request body, nothing re-attempts the write, and no
//     later attempt at this URL can ever succeed. Terminal AND the reader's
//     file is gone: the remedy is to upload or rebuild it.
//   • The row exists and claims its contents ARE in storage, but the fetch
//     threw. Nothing is lost and nothing is owed by the reader — waiting is
//     the remedy.
//
// Conflating the second with the first is the costly one: "storage
// unconfigured" reads as an environment problem to wait out, so a reader whose
// only copy of an evidence file is unrecoverable is invited to retry forever
// instead of uploading it again.
//
// Deliberately NOT `server-only`: the producer that classifies these
// (`downloadArtifactBytes` in `deliverables/move-artifacts.ts`) is, so the
// naming has to live somewhere a suite can reach without a mocked route.

/** Every way an artifact download can fail to produce bytes. */
export type MoveArtifactDownloadRefusalReason =
  | "artifact_not_found"
  | "bytes_never_retained"
  | "storage_unreachable";

export interface MoveArtifactDownloadRefusal {
  /** HTTP status. Only `storage_unreachable` is retryable, so only it is 5xx. */
  status: number;
  error: string;
  /** Authored prose. This is what the reader's browser renders. */
  detail: string;
  /** Whether a later attempt at the same URL could succeed. */
  retryable: boolean;
}

const REFUSALS: Record<
  MoveArtifactDownloadRefusalReason,
  MoveArtifactDownloadRefusal
> = {
  // Stays 404, and stays deliberately silent about whether the id exists for
  // some other client or Move: a foreign artifact and a nonexistent one must
  // remain indistinguishable from outside.
  artifact_not_found: {
    status: 404,
    error: "artifact_not_found",
    detail:
      "No file with that id is filed under this Move. Open the Move's document cabinet and use the control on the row you meant.",
    retryable: false,
  },
  bytes_never_retained: {
    status: 410,
    error: "artifact_bytes_never_retained",
    detail:
      "This file is listed on the Move, but its contents were never written to secure storage, so there is nothing to download and retrying will not change that. Upload the file again, or rebuild the deliverable, to replace it.",
    retryable: false,
  },
  storage_unreachable: {
    status: 503,
    error: "artifact_storage_unreachable",
    detail:
      "This file's contents are recorded as stored, but secure storage could not be reached just now. Nothing has been lost — try the download again shortly.",
    retryable: true,
  },
};

export function moveArtifactDownloadRefusal(
  reason: MoveArtifactDownloadRefusalReason,
): MoveArtifactDownloadRefusal {
  return REFUSALS[reason];
}

/**
 * Whether a `move_artifacts` row DECLARES that its bytes were never written.
 *
 * Only an explicit `storage: "unconfigured"` stamp counts. A row with no
 * `storage` key at all (written before the stamp existed, or by a path that
 * does not set it) is NOT evidence of loss, and must not be reported as
 * unrecoverable — telling a reader their file is gone when we do not know is
 * the one error this classification cannot make.
 */
export function moveArtifactBytesNeverRetained(metadata: unknown): boolean {
  const record = asRecord(metadata);
  return record?.storage === "unconfigured";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

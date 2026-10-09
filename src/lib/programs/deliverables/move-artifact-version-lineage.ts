// Moves · Artifact Vault · what the next version of an artifact is, and whether
// we are entitled to say so.
//
// `saveMoveArtifact` embeds the version number in the blob path it writes to
// (`.../generated/p3/solution_architecture/v2/<file>`), and the file name is
// stable per artifact type. So the version is not a label — it is the ADDRESS.
// Getting it wrong does not mislabel a row, it overwrites the bytes of the
// version that already lives there, while that older row goes on recording the
// path and the `blob_sha256` of a document that is no longer at it.
//
// The version comes from one read: the highest-versioned `current` row for this
// `(move_id, artifact_type)`. That read has three outcomes, and only two of
// them license a version:
//
//   - rows came back and there are none  → genuinely the first version. v1.
//   - rows came back and one is prior    → v(prior + 1), and prior is superseded.
//   - the read FAILED                    → we do not know. Nothing licenses v1.
//
// The third was previously answered as the first. The compat data-plane client
// never rejects — `execute()` catches everything and returns
// `{ data: null, error }` — so the `try/catch` that wrapped the read could not
// be reached by a query failure, and the `error` it returned instead was
// destructured away. A failed read therefore restarted the lineage at v1: the
// new bytes landed on the previous v1's path, the prior row stayed
// `lifecycle_state: "current"` with `supersedes_artifact_id: null`, and
// `move_artifacts` has no UNIQUE constraint on `(move_id, artifact_type,
// version)` to stop the duplicate. Two rows claimed the same version and one
// document was gone. For a REGENERATION this is the live case: the client-facing
// label (`review-regenerate`'s `Version ${saved.version}`) said "Version 1" of
// a revision, and the revision it replaced could not be produced again.
//
// Refusing is safe in the ordering sense — this read happens BEFORE the blob
// upload and before the registry insert, so a refusal here means nothing
// landed. It is the only exit in `saveMoveArtifact` with that property.
//
// Deliberately NOT `server-only`: the data plane is upstream of this decision,
// not part of it, so the decision is testable on its own.

/** Why a version read cannot license a version number. */
export type MoveArtifactVersionUnreadableReason =
  /** The query itself failed. We know nothing about prior versions. */
  | "read_failed"
  /** The result carried no row collection, so it is not an answer. */
  | "no_rows_returned"
  /** A prior row came back but its version is not a usable number. */
  | "prior_version_unreadable";

export type MoveArtifactVersionLineage =
  | { kind: "first"; version: 1; priorArtifactId: null }
  | { kind: "supersedes"; version: number; priorArtifactId: string }
  | { kind: "unreadable"; reason: MoveArtifactVersionUnreadableReason };

/**
 * The error `saveMoveArtifact` throws when it cannot establish the lineage.
 *
 * Named, not bare, because the blob path is derived from the version: a caller
 * that sees this knows the refusal happened before any write, so there is
 * nothing to clean up and a retry is safe.
 */
export const MOVE_ARTIFACT_VERSION_LINEAGE_UNREADABLE =
  "artifact_version_lineage_unreadable";

/** The operator log tag for a supersede that did not take. */
export const MOVE_ARTIFACT_SUPERSEDE_FAILED = "artifact_supersede_failed";

interface PriorVersionRowLike {
  artifact_id?: unknown;
  version?: unknown;
}

/**
 * Read the prior-version query's result and say what version the next artifact
 * is entitled to.
 *
 * `error` is authoritative over `data`: the compat client returns
 * `{ data: null, error }` on failure, and a null/absent row collection next to
 * a null error is not an empty answer either — it is no answer.
 */
export function resolveMoveArtifactVersionLineage(result: {
  data?: unknown;
  error?: { message?: string } | null;
}): MoveArtifactVersionLineage {
  if (result.error) return { kind: "unreadable", reason: "read_failed" };
  if (!Array.isArray(result.data)) {
    return { kind: "unreadable", reason: "no_rows_returned" };
  }

  const prior = (result.data as PriorVersionRowLike[])[0];
  if (!prior) return { kind: "first", version: 1, priorArtifactId: null };

  const priorVersion = prior.version;
  const priorId = prior.artifact_id;
  if (
    typeof priorVersion !== "number" ||
    !Number.isInteger(priorVersion) ||
    priorVersion < 1 ||
    typeof priorId !== "string" ||
    priorId.length === 0
  ) {
    return { kind: "unreadable", reason: "prior_version_unreadable" };
  }

  return {
    kind: "supersedes",
    version: priorVersion + 1,
    priorArtifactId: priorId,
  };
}

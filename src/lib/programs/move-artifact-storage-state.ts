// Moves · Files & Evidence · what the cabinet says about where a file's bytes are.
//
// The File Cabinet is where a reviewer confirms that evidence and deliverables
// actually landed, and it drew that confirmation from one boolean —
// `a.stored === "azure_blob"` — rendered as `Vault` or `Storage pending`.
// THREE different situations reached the second label and only one of them is
// a problem:
//
//   - A row read from `generated_artifacts` carries no `stored` field at all.
//     Those artifacts are rendered from their recorded content when the
//     reviewer downloads them (`/api/v1/artifacts/:id`) and never occupy the
//     blob vault, so EVERY generated deliverable — the output of Approve &
//     Build — was marked red with nothing pending and nothing to do.
//   - A vault row written while object storage was unavailable records
//     `storage: "unconfigured"`. For an UPLOAD that is unrecoverable: the only
//     copy of the bytes was the request body, nothing re-attempts the upload,
//     and `GET .../artifacts/:artifactId/download` answers 404
//     `artifact_unavailable`. "Pending" names a wait that never ends; the
//     reviewer has to upload the file again.
//   - A row whose metadata predates the storage marker records nothing, which
//     is not the same claim as "not stored".
//
// Because the one state that needs action shared its words with the state that
// needs none — and the needless one is on every generated row — the warning
// carried no information at all. The states are declared here with their
// label, tooltip and tone as DATA so a sentence cannot be authored for one
// state and silently serve another.
//
// Client-safe on purpose: `FileCabinetPanel` is a client component, so this
// module imports nothing from the data plane.

/** Where a cabinet row's bytes are, as the row itself records it. */
export type MoveArtifactStorageState =
  /** The bytes are in the secure blob vault. */
  | "vault"
  /** A vault row whose bytes were not stored. Unrecoverable for an upload. */
  | "not_retained"
  /** The row does not say. Not the same claim as "not stored". */
  | "unrecorded"
  /** A generated deliverable, rendered on download; no vault involvement. */
  | "rendered_on_request";

/** The marker `saveMoveArtifact` writes when the blob upload succeeded. */
export const MOVE_ARTIFACT_STORED_MARKER = "azure_blob";

/** The marker it writes when the blob upload did not happen. */
export const MOVE_ARTIFACT_NOT_STORED_MARKER = "unconfigured";

/**
 * Resolve the storage state of one cabinet row.
 *
 * A recorded marker is authoritative: it is a fact the writer put there.
 * `renderedOnRequest` only explains an ABSENT marker, which is the shape every
 * `generated_artifacts` row has.
 */
export function resolveMoveArtifactStorageState(input: {
  stored?: string | null;
  renderedOnRequest?: boolean;
}): MoveArtifactStorageState {
  const marker = typeof input.stored === "string" ? input.stored.trim() : "";
  if (marker === MOVE_ARTIFACT_STORED_MARKER) return "vault";
  if (marker === MOVE_ARTIFACT_NOT_STORED_MARKER) return "not_retained";
  if (marker) return "unrecorded";
  return input.renderedOnRequest ? "rendered_on_request" : "unrecorded";
}

export interface MoveArtifactStoragePresentation {
  /** The chip's words. */
  label: string;
  /** The chip's tooltip. Never a restatement of the label. */
  title: string;
  tone: "ok" | "alert" | "muted";
  /** True only when the reviewer has to do something about this row. */
  needsAction: boolean;
}

export const MOVE_ARTIFACT_STORAGE_PRESENTATION: Record<
  MoveArtifactStorageState,
  MoveArtifactStoragePresentation
> = {
  vault: {
    label: "Vault",
    title: "Stored in the secure artifact vault",
    tone: "ok",
    needsAction: false,
  },
  not_retained: {
    label: "Not retained",
    title:
      "The file's contents were not stored, so this record cannot be opened " +
      "or re-read and nothing re-attempts it. Upload the file again.",
    tone: "alert",
    needsAction: true,
  },
  unrecorded: {
    label: "Storage not recorded",
    title:
      "This record does not say whether the file's contents were stored. " +
      "Download it to check before relying on it.",
    tone: "muted",
    needsAction: false,
  },
  rendered_on_request: {
    label: "Rendered on request",
    title:
      "This deliverable is rendered from its recorded content when you " +
      "download it, so it does not occupy the file vault.",
    tone: "muted",
    needsAction: false,
  },
};

/** The chip for one cabinet row. */
export function describeMoveArtifactStorage(input: {
  stored?: string | null;
  renderedOnRequest?: boolean;
}): MoveArtifactStoragePresentation {
  return MOVE_ARTIFACT_STORAGE_PRESENTATION[
    resolveMoveArtifactStorageState(input)
  ];
}

/**
 * Whether an upload's bytes were retained, from the upload response's own
 * `blobStored` field.
 *
 * An ABSENT or non-boolean field is `unknown`, never "not retained": a reply
 * that does not carry the fact must not be turned into a claim about it. The
 * `unknown` sentences are byte-for-byte the ones this surface has always
 * rendered when the field was falsy, so nothing regresses for a producer that
 * omits it.
 */
export type MoveUploadRetention = "retained" | "not_retained" | "unknown";

export function resolveMoveUploadRetention(
  blobStored: unknown,
): MoveUploadRetention {
  if (blobStored === true) return "retained";
  if (blobStored === false) return "not_retained";
  return "unknown";
}

export interface MoveUploadOutcome {
  retention: MoveUploadRetention;
  /** True when the upload left the reviewer something to do. */
  needsAction: boolean;
  /** What the uploader is told. */
  message: string;
}

/**
 * Say what an accepted upload actually left behind.
 *
 * Retention leads when it failed, because it is the unrecoverable half: the
 * extraction can be re-run from a stored file, and a file whose bytes are gone
 * cannot be produced for the citation that an approval would create.
 */
export function describeMoveUploadOutcome(input: {
  fileName: string;
  phaseLabel: string;
  blobStored?: unknown;
  /** The upload family is a working-session file rather than evidence. */
  sessionFile?: boolean;
  evidence?: {
    status?: string | null;
    reviewStatus?: string | null;
    parseMethod?: string | null;
    warning?: string | null;
  } | null;
}): MoveUploadOutcome {
  const retention = resolveMoveUploadRetention(input.blobStored);
  const notCaptured = input.evidence?.status === "not_captured";
  const storedClause = retention === "retained" ? " to secure storage" : "";

  if (retention === "not_retained") {
    return {
      retention,
      needsAction: true,
      message:
        `${input.fileName} was registered for ${input.phaseLabel}, but its ` +
        "contents were not retained in secure storage, so it cannot be " +
        "opened or re-read and nothing re-attempts it. Upload the file " +
        "again, and do not approve evidence from this attempt — its source " +
        "document can no longer be produced." +
        (notCaptured
          ? " Its extraction did not register either, so nothing from this " +
            "attempt can reach generation."
          : ""),
    };
  }

  if (notCaptured) {
    return {
      retention,
      needsAction: true,
      message:
        `Uploaded ${input.fileName} for ${input.phaseLabel}, but ` +
        "parsing/review registration failed. This file is not available to " +
        `generation. ${input.evidence?.warning ?? "Retry ingestion or contact support."}`,
    };
  }

  if (input.evidence?.reviewStatus) {
    return {
      retention,
      needsAction: false,
      message:
        `Uploaded ${input.fileName} for ${input.phaseLabel} as ` +
        `${input.sessionFile ? "a session file" : "evidence"}${storedClause}; ` +
        `parsed via ${input.evidence.parseMethod ?? "parser"}. Human review ` +
        "is required before it can inform generation.",
    };
  }

  return {
    retention,
    needsAction: false,
    message: `Uploaded ${input.fileName} for ${input.phaseLabel}${storedClause}.`,
  };
}

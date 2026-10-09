// The cabinet's "Open" and "Download" controls are plain anchors at
// `GET /api/v1/programs/:programId/artifacts/:artifactId/download`, so this
// route's body is rendered to a signed-in reader as a page. One 404 reading
// "not found or storage unconfigured" served three causes with three different
// remedies, and for the worst of them it was actively misleading: a row whose
// bytes were NEVER written is unrecoverable, and "storage unconfigured" invites
// the reader to wait for an environment fix that will never produce the file.
//
// These cases pin the three names, their statuses, and the one direction this
// classification is not allowed to get wrong — claiming loss it cannot prove.
//
// This suite lives here rather than beside the route because
// `src/lib/programs/__tests__` is swept wholesale by the required AI surface
// control catalog, so it is merge-blocking with no workflow edit.

import {
  moveArtifactBytesNeverRetained,
  moveArtifactDownloadRefusal,
  type MoveArtifactDownloadRefusalReason,
} from "@/lib/programs/move-artifact-download-refusal";
import {
  MOVE_ARTIFACT_NOT_STORED_MARKER,
  MOVE_ARTIFACT_STORED_MARKER,
  resolveMoveArtifactStorageState,
} from "@/lib/programs/move-artifact-storage-state";

const ALL_REASONS: MoveArtifactDownloadRefusalReason[] = [
  "artifact_not_found",
  "bytes_never_retained",
  "storage_unreachable",
];

describe("moveArtifactDownloadRefusal", () => {
  it("gives every reason its own status, code and sentence", () => {
    const refusals = ALL_REASONS.map((reason) =>
      moveArtifactDownloadRefusal(reason),
    );

    expect(new Set(refusals.map((r) => r.status)).size).toBe(
      ALL_REASONS.length,
    );
    expect(new Set(refusals.map((r) => r.error)).size).toBe(ALL_REASONS.length);
    expect(new Set(refusals.map((r) => r.detail)).size).toBe(
      ALL_REASONS.length,
    );
  });

  it("keeps an absent artifact a 404, which is the cross-tenant contract", () => {
    // A foreign artifact and a nonexistent one must stay indistinguishable,
    // so this is the one status that may not move.
    const refusal = moveArtifactDownloadRefusal("artifact_not_found");

    expect(refusal.status).toBe(404);
    expect(refusal.retryable).toBe(false);
  });

  it("marks only unreachable storage as retryable, and only it as 5xx", () => {
    for (const reason of ALL_REASONS) {
      const refusal = moveArtifactDownloadRefusal(reason);
      expect(refusal.retryable).toBe(reason === "storage_unreachable");
      expect(refusal.status >= 500).toBe(reason === "storage_unreachable");
    }
  });

  it("reports unretained bytes as permanent, not as something to wait for", () => {
    const refusal = moveArtifactDownloadRefusal("bytes_never_retained");

    expect(refusal.status).toBe(410);
    expect(refusal.retryable).toBe(false);
    // The remedy is to produce the file again; retrying this URL cannot work.
    expect(refusal.detail).toMatch(/retrying will not change that/i);
    expect(refusal.detail).toMatch(/upload the file again|rebuild/i);
  });

  it("says nothing has been lost when storage is merely unreachable", () => {
    const refusal = moveArtifactDownloadRefusal("storage_unreachable");

    expect(refusal.detail).toMatch(/nothing has been lost/i);
    expect(refusal.detail).toMatch(/again shortly/i);
    // It must NOT prescribe a re-upload: the bytes are still there.
    expect(refusal.detail).not.toMatch(/upload the file again|rebuild/i);
  });

  it("names a next action in every refusal, never a bare code", () => {
    for (const reason of ALL_REASONS) {
      const { detail, error } = moveArtifactDownloadRefusal(reason);
      expect(detail.length).toBeGreaterThan(40);
      expect(detail).not.toBe(error);
      expect(detail).not.toMatch(/server log|contact support/i);
    }
  });

  it("does not say whether an absent id exists for another client or Move", () => {
    const { detail } = moveArtifactDownloadRefusal("artifact_not_found");

    expect(detail).not.toMatch(/another|different|other (client|tenant|move)/i);
    expect(detail).not.toMatch(/belongs to/i);
  });
});

describe("moveArtifactBytesNeverRetained", () => {
  it("is true only for an explicit unconfigured stamp", () => {
    expect(moveArtifactBytesNeverRetained({ storage: "unconfigured" })).toBe(
      true,
    );
    expect(moveArtifactBytesNeverRetained({ storage: "azure_blob" })).toBe(
      false,
    );
  });

  it("reads the stamp through a JSON-encoded metadata column", () => {
    expect(
      moveArtifactBytesNeverRetained(
        JSON.stringify({ sha256: "abc", storage: "unconfigured" }),
      ),
    ).toBe(true);
    expect(
      moveArtifactBytesNeverRetained(JSON.stringify({ storage: "azure_blob" })),
    ).toBe(false);
  });

  it("agrees with the cabinet chip's own authority on the same stamp", () => {
    // The refusal and the chip describe ONE fact to ONE reader, and before
    // this release they contradicted each other. A second literal marker here
    // would let them drift apart again, so the comparison is delegated.
    expect(
      resolveMoveArtifactStorageState({
        stored: MOVE_ARTIFACT_NOT_STORED_MARKER,
      }),
    ).toBe("not_retained");
    expect(
      moveArtifactBytesNeverRetained({
        storage: MOVE_ARTIFACT_NOT_STORED_MARKER,
      }),
    ).toBe(true);
    expect(
      moveArtifactBytesNeverRetained({ storage: MOVE_ARTIFACT_STORED_MARKER }),
    ).toBe(false);
  });

  it("tolerates a stamp recorded with surrounding whitespace", () => {
    // Delegation also inherits the shared resolver's trim, so a stamp written
    // with stray whitespace is still read as the loss it records.
    expect(moveArtifactBytesNeverRetained({ storage: " unconfigured " })).toBe(
      true,
    );
  });

  it.each([
    ["absent metadata", undefined],
    ["null metadata", null],
    ["metadata with no storage key", { sha256: "abc" }],
    ["an unrecognised storage value", { storage: "somewhere_else" }],
    ["unparseable metadata", "{not json"],
    ["an array", [{ storage: "unconfigured" }]],
  ])("does not claim loss it cannot prove: %s", (_label, metadata) => {
    // Reporting a file as gone when the row does not say so is the one error
    // this classification may not make — the reader would be told to replace a
    // file that is still there.
    expect(moveArtifactBytesNeverRetained(metadata)).toBe(false);
  });
});

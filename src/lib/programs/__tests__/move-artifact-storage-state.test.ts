/**
 * What the document cabinet says about where a file's bytes are.
 *
 * Three different situations used to render as one red `Storage pending`
 * chip, and only one of them is a problem: a generated deliverable (no vault
 * involvement at all), a vault row whose bytes were NOT stored (unrecoverable
 * for an upload), and a row that records nothing. Because the needless label
 * sat on every generated row, the one that needed action carried no signal.
 *
 * These cases assert the partition, the per-state copy as data, and — for the
 * upload confirmation — that an absent `blobStored` is never turned into a
 * claim that the bytes were lost.
 */

import {
  describeMoveArtifactStorage,
  describeMoveUploadOutcome,
  MOVE_ARTIFACT_NOT_STORED_MARKER,
  MOVE_ARTIFACT_STORAGE_PRESENTATION,
  MOVE_ARTIFACT_STORED_MARKER,
  resolveMoveArtifactStorageState,
  resolveMoveUploadRetention,
  type MoveArtifactStorageState,
} from "../move-artifact-storage-state";

const ALL_STATES: MoveArtifactStorageState[] = [
  "vault",
  "not_retained",
  "unrecorded",
  "rendered_on_request",
];

describe("a cabinet row's storage state", () => {
  it("reads the marker saveMoveArtifact writes on a successful upload", () => {
    expect(
      resolveMoveArtifactStorageState({ stored: MOVE_ARTIFACT_STORED_MARKER }),
    ).toBe("vault");
    // Pinned against the writer's own value, not a retyped string.
    expect(MOVE_ARTIFACT_STORED_MARKER).toBe("azure_blob");
  });

  it("reads the marker it writes when the blob upload did not happen", () => {
    expect(
      resolveMoveArtifactStorageState({
        stored: MOVE_ARTIFACT_NOT_STORED_MARKER,
      }),
    ).toBe("not_retained");
    expect(MOVE_ARTIFACT_NOT_STORED_MARKER).toBe("unconfigured");
  });

  it("calls a row with no marker on the generated route rendered on request", () => {
    // Every `generated_artifacts` row has this shape: the list route sets no
    // `stored` field for them, because they are rendered from their recorded
    // content on download and never occupy the vault.
    expect(resolveMoveArtifactStorageState({ renderedOnRequest: true })).toBe(
      "rendered_on_request",
    );
    expect(
      resolveMoveArtifactStorageState({
        stored: null,
        renderedOnRequest: true,
      }),
    ).toBe("rendered_on_request");
  });

  it("does not claim a vault row with no marker was not stored", () => {
    // A row whose metadata predates the storage marker records nothing, which
    // is a different claim from "not stored".
    expect(resolveMoveArtifactStorageState({ stored: null })).toBe(
      "unrecorded",
    );
    expect(resolveMoveArtifactStorageState({})).toBe("unrecorded");
  });

  it("does not read an unrecognised marker as either answer", () => {
    expect(resolveMoveArtifactStorageState({ stored: "s3" })).toBe(
      "unrecorded",
    );
    expect(resolveMoveArtifactStorageState({ stored: "   " })).toBe(
      "unrecorded",
    );
  });

  it("lets a recorded marker outrank the route the row is served from", () => {
    // The two signals cannot disagree in production — a generated row carries
    // no marker and a vault row is not on the generated route — so the rule is
    // stated here rather than left to whichever branch happens to run first.
    expect(
      resolveMoveArtifactStorageState({
        stored: MOVE_ARTIFACT_NOT_STORED_MARKER,
        renderedOnRequest: true,
      }),
    ).toBe("not_retained");
  });
});

describe("the storage chip's copy", () => {
  it("asks the reviewer to act in exactly one state", () => {
    const needing = ALL_STATES.filter(
      (state) => MOVE_ARTIFACT_STORAGE_PRESENTATION[state].needsAction,
    );
    expect(needing).toEqual(["not_retained"]);
  });

  it("gives every state a label and a tooltip that is not the label again", () => {
    for (const state of ALL_STATES) {
      const presentation = MOVE_ARTIFACT_STORAGE_PRESENTATION[state];
      expect(presentation.label.length).toBeGreaterThan(3);
      expect(presentation.title.length).toBeGreaterThan(
        presentation.label.length,
      );
      expect(presentation.title).not.toBe(presentation.label);
    }
  });

  it("stops describing an unrecoverable loss as a wait", () => {
    // `Storage pending` named a wait that never ends: nothing re-attempts the
    // upload and the only copy of the bytes was the request body.
    for (const state of ALL_STATES) {
      expect(MOVE_ARTIFACT_STORAGE_PRESENTATION[state].label).not.toMatch(
        /pending/i,
      );
      expect(MOVE_ARTIFACT_STORAGE_PRESENTATION[state].title).not.toMatch(
        /pending/i,
      );
    }
  });

  it("tells the reviewer of a lost file to upload it again", () => {
    const presentation = MOVE_ARTIFACT_STORAGE_PRESENTATION.not_retained;
    expect(presentation.tone).toBe("alert");
    expect(presentation.title).toMatch(/Upload the file again/);
  });

  it("does not alarm about a deliverable that never uses the vault", () => {
    const presentation = MOVE_ARTIFACT_STORAGE_PRESENTATION.rendered_on_request;
    expect(presentation.tone).toBe("muted");
    expect(presentation.needsAction).toBe(false);
    expect(presentation.title).toMatch(/rendered/i);
  });

  it("describes a row end to end from what the row records", () => {
    expect(
      describeMoveArtifactStorage({ stored: MOVE_ARTIFACT_STORED_MARKER }),
    ).toBe(MOVE_ARTIFACT_STORAGE_PRESENTATION.vault);
    expect(describeMoveArtifactStorage({ renderedOnRequest: true })).toBe(
      MOVE_ARTIFACT_STORAGE_PRESENTATION.rendered_on_request,
    );
  });
});

describe("whether an upload's bytes were retained", () => {
  it("reads the response field only as the boolean it is", () => {
    expect(resolveMoveUploadRetention(true)).toBe("retained");
    expect(resolveMoveUploadRetention(false)).toBe("not_retained");
  });

  it("does not turn a missing field into a claim about the bytes", () => {
    // A reply that does not carry the fact must not be read as a loss; the
    // `unknown` sentences are the ones this surface has always rendered.
    for (const value of [undefined, null, "", "false", "true", 0, 1]) {
      expect(resolveMoveUploadRetention(value)).toBe("unknown");
    }
  });
});

describe("what an accepted upload is reported to have left behind", () => {
  const BASE = {
    fileName: "discovery-workshop.pdf",
    phaseLabel: "Discover",
  };
  const CAPTURED = {
    reviewStatus: "pending_review",
    parseMethod: "pdf-parse",
  };

  it("confirms a retained evidence upload exactly as before", () => {
    const outcome = describeMoveUploadOutcome({
      ...BASE,
      blobStored: true,
      evidence: CAPTURED,
    });
    expect(outcome.retention).toBe("retained");
    expect(outcome.needsAction).toBe(false);
    expect(outcome.message).toBe(
      "Uploaded discovery-workshop.pdf for Discover as evidence to secure " +
        "storage; parsed via pdf-parse. Human review is required before it " +
        "can inform generation.",
    );
  });

  it("names a session file as one", () => {
    expect(
      describeMoveUploadOutcome({
        ...BASE,
        blobStored: true,
        evidence: CAPTURED,
        sessionFile: true,
      }).message,
    ).toContain("as a session file to secure storage");
  });

  it("says the bytes were not retained, and what that costs", () => {
    const outcome = describeMoveUploadOutcome({
      ...BASE,
      blobStored: false,
      evidence: CAPTURED,
    });
    expect(outcome.retention).toBe("not_retained");
    expect(outcome.needsAction).toBe(true);
    expect(outcome.message).toMatch(/not retained in secure storage/);
    expect(outcome.message).toMatch(/Upload the file again/);
    // The reason it matters: approving this extraction would create a citation
    // whose source document can no longer be produced.
    expect(outcome.message).toMatch(/do not approve evidence/);
    // And it must not read as a completed upload.
    expect(outcome.message).not.toMatch(/^Uploaded /);
    expect(outcome.message).not.toContain("to secure storage;");
  });

  it("states both halves when the extraction also failed to register", () => {
    const outcome = describeMoveUploadOutcome({
      ...BASE,
      blobStored: false,
      evidence: { status: "not_captured", warning: "parser crashed" },
    });
    expect(outcome.needsAction).toBe(true);
    expect(outcome.message).toMatch(/not retained in secure storage/);
    expect(outcome.message).toMatch(/extraction did not register either/);
  });

  it("does not claim the extraction failed when it did not", () => {
    expect(
      describeMoveUploadOutcome({
        ...BASE,
        blobStored: false,
        evidence: CAPTURED,
      }).message,
    ).not.toMatch(/extraction did not register/);
  });

  it("keeps the unregistered-extraction sentence for a retained file", () => {
    const outcome = describeMoveUploadOutcome({
      ...BASE,
      blobStored: true,
      evidence: { status: "not_captured", warning: "parser crashed" },
    });
    expect(outcome.needsAction).toBe(true);
    expect(outcome.message).toBe(
      "Uploaded discovery-workshop.pdf for Discover, but parsing/review " +
        "registration failed. This file is not available to generation. " +
        "parser crashed",
    );
  });

  it("confirms a retained file with no evidence pipeline", () => {
    // A template or approval record: the route runs no extraction for those.
    expect(
      describeMoveUploadOutcome({ ...BASE, blobStored: true }).message,
    ).toBe("Uploaded discovery-workshop.pdf for Discover to secure storage.");
  });

  it("omits the storage clause, and only that, when the field is absent", () => {
    // Byte-for-byte what this surface rendered before the field was read, so a
    // producer that stops sending it cannot regress into a false alarm.
    const outcome = describeMoveUploadOutcome({ ...BASE, evidence: CAPTURED });
    expect(outcome.retention).toBe("unknown");
    expect(outcome.needsAction).toBe(false);
    expect(outcome.message).toBe(
      "Uploaded discovery-workshop.pdf for Discover as evidence; parsed via " +
        "pdf-parse. Human review is required before it can inform generation.",
    );
    expect(describeMoveUploadOutcome({ ...BASE }).message).toBe(
      "Uploaded discovery-workshop.pdf for Discover.",
    );
  });
});

// The version number `saveMoveArtifact` writes is the blob PATH, not a label.
// These cases pin the one rule that matters: a read that failed licenses no
// version, and in particular it does not license v1.
import {
  MOVE_ARTIFACT_SUPERSEDE_FAILED,
  MOVE_ARTIFACT_VERSION_LINEAGE_UNREADABLE,
  resolveMoveArtifactVersionLineage,
} from "../move-artifact-version-lineage";

describe("resolveMoveArtifactVersionLineage", () => {
  it("licenses v1 only when rows came back and there were none", () => {
    expect(
      resolveMoveArtifactVersionLineage({ data: [], error: null }),
    ).toEqual({ kind: "first", version: 1, priorArtifactId: null });
  });

  it("licenses prior + 1 and names the row to supersede", () => {
    expect(
      resolveMoveArtifactVersionLineage({
        data: [{ artifact_id: "prior-artifact", version: 3 }],
        error: null,
      }),
    ).toEqual({
      kind: "supersedes",
      version: 4,
      priorArtifactId: "prior-artifact",
    });
  });

  it("refuses when the read failed, rather than restarting the lineage at v1", () => {
    expect(
      resolveMoveArtifactVersionLineage({
        data: null,
        error: { message: "relation does not exist" },
      }),
    ).toEqual({ kind: "unreadable", reason: "read_failed" });
  });

  it("treats an error as authoritative even when rows are also present", () => {
    // The compat client returns `{data: null, error}`, but a partial result
    // must never be read as an answer about prior versions.
    expect(
      resolveMoveArtifactVersionLineage({
        data: [{ artifact_id: "prior-artifact", version: 3 }],
        error: { message: "statement timeout" },
      }),
    ).toEqual({ kind: "unreadable", reason: "read_failed" });
  });

  it("refuses a result that carried no row collection", () => {
    expect(
      resolveMoveArtifactVersionLineage({ data: null, error: null }),
    ).toEqual({ kind: "unreadable", reason: "no_rows_returned" });
    expect(resolveMoveArtifactVersionLineage({})).toEqual({
      kind: "unreadable",
      reason: "no_rows_returned",
    });
  });

  it.each([
    {
      label: "a version that is a string",
      row: { artifact_id: "p", version: "3" },
    },
    { label: "a fractional version", row: { artifact_id: "p", version: 1.5 } },
    { label: "a zero version", row: { artifact_id: "p", version: 0 } },
    { label: "an absent version", row: { artifact_id: "p" } },
    { label: "an absent id", row: { version: 3 } },
    { label: "an empty id", row: { artifact_id: "", version: 3 } },
  ])("refuses a prior row with $label", ({ row }) => {
    expect(
      resolveMoveArtifactVersionLineage({ data: [row], error: null }),
    ).toEqual({ kind: "unreadable", reason: "prior_version_unreadable" });
  });

  it("keeps the two named codes distinct", () => {
    // They name opposite sides of the insert: one refuses before any write,
    // the other reports a repair owed after both writes committed.
    expect(MOVE_ARTIFACT_VERSION_LINEAGE_UNREADABLE).not.toEqual(
      MOVE_ARTIFACT_SUPERSEDE_FAILED,
    );
  });
});

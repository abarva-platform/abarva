import { approvedGeneratedArtifactIds } from "../approved-artifact-context";

describe("approved generated artifact context", () => {
  it("selects only the artifact linked to the exact signed-off deliverable version", () => {
    expect(
      approvedGeneratedArtifactIds({
        deliverables: [
          { id: "d1", status: "draft", signed_off_version: 2 },
          { id: "d2", status: "draft", signed_off_version: null },
          { id: "d3", status: "superseded", signed_off_version: 1 },
        ],
        versions: [
          {
            deliverable_id: "d1",
            version: 1,
            structured_data: { generated_artifact_id: "draft-v1" },
          },
          {
            deliverable_id: "d1",
            version: 2,
            structured_data: { generated_artifact_id: "approved-v2" },
          },
          {
            deliverable_id: "d2",
            version: 1,
            structured_data: { generated_artifact_id: "unsigned-draft" },
          },
          {
            deliverable_id: "d3",
            version: 1,
            structured_data: { generated_artifact_id: "approved-v1" },
          },
        ],
      }),
    ).toEqual(["approved-v2"]);
  });

  it("fails closed when linkage is absent or malformed", () => {
    expect(
      approvedGeneratedArtifactIds({
        deliverables: [
          { id: "d1", status: "signed_off", signed_off_version: 1 },
        ],
        versions: [
          { deliverable_id: "d1", version: 1, structured_data: null },
          {
            deliverable_id: "d1",
            version: 2,
            structured_data: { generated_artifact_id: "not-approved" },
          },
        ],
      }),
    ).toEqual([]);
  });
});

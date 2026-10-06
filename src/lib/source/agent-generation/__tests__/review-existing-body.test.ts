import { resolveSourceArtifactGenerationInput } from "../review-existing-body";

describe("resolveSourceArtifactGenerationInput", () => {
  it("uses the persisted human-edited body for an explicit re-review", () => {
    expect(
      resolveSourceArtifactGenerationInput({
        requestedReview: true,
        existingBody: "  # Corrected RFP\n\nEvidence-bound body.  ",
      }),
    ).toEqual({
      reviewExistingBody: true,
      body: "# Corrected RFP\n\nEvidence-bound body.",
      error: null,
    });
  });

  it("rejects re-review when no authored body exists", () => {
    expect(
      resolveSourceArtifactGenerationInput({
        requestedReview: true,
        existingBody: "   ",
      }),
    ).toEqual({
      reviewExistingBody: true,
      body: "",
      error: "artifact_body_required",
    });
  });

  it("keeps ordinary generation behavior when re-review is not requested", () => {
    expect(
      resolveSourceArtifactGenerationInput({
        requestedReview: false,
        existingBody: "Existing draft",
      }),
    ).toEqual({ reviewExistingBody: false, body: "", error: null });
  });
});

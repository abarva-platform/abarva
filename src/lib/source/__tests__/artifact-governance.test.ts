import {
  deriveSourceArtifactGovernanceStage,
  sourceArtifactGovernanceBanner,
  hasComplianceReviewFlag,
  withComplianceReviewFlag,
  SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
  SOURCE_APPROVED_EXTERNAL_GOVERNANCE_MESSAGE,
  SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
  SOURCE_SUPERSEDED_GOVERNANCE_MESSAGE,
  SOURCE_VENDOR_NOT_APPROVED_GOVERNANCE_MESSAGE,
} from "../artifact-governance";

describe("deriveSourceArtifactGovernanceStage", () => {
  it("defaults to ai_draft when nothing else is set", () => {
    expect(deriveSourceArtifactGovernanceStage({})).toBe("ai_draft");
    expect(
      deriveSourceArtifactGovernanceStage({ status: "draft" }),
    ).toBe("ai_draft");
  });

  it("treats review-in-progress statuses as human_review", () => {
    for (const status of [
      "preliminary",
      "issue_ready",
      "client_to_complete",
      "legal_review_required",
      "procurement_review_required",
    ]) {
      expect(deriveSourceArtifactGovernanceStage({ status })).toBe(
        "human_review",
      );
    }
  });

  it("treats a populated approvalState as human_review even with an unrelated status", () => {
    expect(
      deriveSourceArtifactGovernanceStage({
        status: "draft",
        approvalState: "pending_procurement",
      }),
    ).toBe("human_review");
  });

  it("requires BOTH approved status and a named approver for approved_for_external_use", () => {
    expect(
      deriveSourceArtifactGovernanceStage({ status: "approved" }),
    ).not.toBe("approved_for_external_use");
    expect(
      deriveSourceArtifactGovernanceStage({
        status: "approved",
        approvedBy: "procurement-lead",
      }),
    ).toBe("approved_for_external_use");
  });

  it("treats isClientFinal or status=client_final as client_final", () => {
    expect(
      deriveSourceArtifactGovernanceStage({ isClientFinal: true }),
    ).toBe("client_final");
    expect(
      deriveSourceArtifactGovernanceStage({ status: "client_final" }),
    ).toBe("client_final");
  });

  it("lets supersession win over every other signal", () => {
    expect(
      deriveSourceArtifactGovernanceStage({
        lifecycleState: "superseded",
        isClientFinal: true,
        status: "approved",
        approvedBy: "someone",
      }),
    ).toBe("superseded");
  });
});

describe("sourceArtifactGovernanceBanner", () => {
  it("returns the standard messages for each stage when no artifact code is given", () => {
    expect(sourceArtifactGovernanceBanner("ai_draft").message).toBe(
      SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
    );
    expect(
      sourceArtifactGovernanceBanner("approved_for_external_use").message,
    ).toBe(SOURCE_APPROVED_EXTERNAL_GOVERNANCE_MESSAGE);
    expect(sourceArtifactGovernanceBanner("client_final").message).toBe(
      SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
    );
    expect(sourceArtifactGovernanceBanner("superseded").message).toBe(
      SOURCE_SUPERSEDED_GOVERNANCE_MESSAGE,
    );
  });

  it("shows the vendor-not-approved variant for vendor-facing profiles still in draft", () => {
    // d11 = Vendor Response Control Pack, audience: "vendor".
    const banner = sourceArtifactGovernanceBanner("ai_draft", {
      artifactCode: "d11",
    });
    expect(banner.message).toBe(SOURCE_VENDOR_NOT_APPROVED_GOVERNANCE_MESSAGE);
  });

  it("does not show the vendor-not-approved variant once approved or client-final", () => {
    const approved = sourceArtifactGovernanceBanner(
      "approved_for_external_use",
      { artifactCode: "d11" },
    );
    expect(approved.message).toBe(SOURCE_APPROVED_EXTERNAL_GOVERNANCE_MESSAGE);

    const clientFinal = sourceArtifactGovernanceBanner("client_final", {
      artifactCode: "d11",
    });
    expect(clientFinal.message).toBe(SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE);
  });

  it("does not apply the vendor variant to a non-vendor-facing artifact", () => {
    // d04 = Application Inventory & Tiering, audience: procurement/delivery.
    const banner = sourceArtifactGovernanceBanner("ai_draft", {
      artifactCode: "d04",
    });
    expect(banner.message).toBe(SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE);
  });

  it("falls back gracefully for an unknown artifact code", () => {
    const banner = sourceArtifactGovernanceBanner("ai_draft", {
      artifactCode: "not-a-real-code",
    });
    expect(banner.message).toBe(SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE);
  });
});

describe("compliance-review flag helpers", () => {
  it("appends the marker to a plain description", () => {
    const flagged = withComplianceReviewFlag("Generated Source deliverable.");
    expect(flagged.startsWith("Generated Source deliverable.")).toBe(true);
    expect(hasComplianceReviewFlag(flagged)).toBe(true);
  });

  it("does not double-append when the marker is already present", () => {
    const once = withComplianceReviewFlag("Base text.");
    const twice = withComplianceReviewFlag(once);
    expect(twice).toBe(once);
  });

  it("reports false for descriptions without the marker", () => {
    expect(hasComplianceReviewFlag("Generated Source deliverable.")).toBe(
      false,
    );
    expect(hasComplianceReviewFlag(null)).toBe(false);
    expect(hasComplianceReviewFlag(undefined)).toBe(false);
    expect(hasComplianceReviewFlag("")).toBe(false);
  });

  it("never requires the raw matched banned term to appear in the flagged text", () => {
    // The flag must be detectable without the caller ever concatenating a
    // banned term into the description — that's the whole point of the flag.
    const flagged = withComplianceReviewFlag(
      "AI-prepared draft. Human review is required before external use.",
    );
    expect(flagged).not.toMatch(/\bd0\d\b|\bdx\d/i);
    expect(flagged).not.toContain("substrate");
    expect(flagged).not.toContain("Anthropic");
    expect(hasComplianceReviewFlag(flagged)).toBe(true);
  });
});

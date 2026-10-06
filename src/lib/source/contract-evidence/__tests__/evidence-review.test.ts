import {
  contractEvidenceReviewTarget,
  normalizeEvidenceReviewReason,
} from "../evidence-review";

describe("structured contract evidence review", () => {
  it("maps Scope requirements to exact structured families and minimum states", () => {
    expect(contractEvidenceReviewTarget("EVID-SRC-SCOPE-APP-INV")).toEqual({
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      family: "application_inventory",
      targetState: "Usable Evidence",
    });
    expect(contractEvidenceReviewTarget("EVID-SRC-SCOPE-SLA-BASELINE")).toEqual(
      expect.objectContaining({ family: "sla_performance", targetState: "Parsed" }),
    );
  });

  it("does not allow unrelated requirements through the review action", () => {
    expect(contractEvidenceReviewTarget("EVID-SRC-RFP-LEGAL-TEMPLATE")).toBeNull();
    expect(contractEvidenceReviewTarget("UNKNOWN")).toBeNull();
  });

  it("requires a substantive human review rationale", () => {
    expect(normalizeEvidenceReviewReason("too short")).toBeNull();
    expect(
      normalizeEvidenceReviewReason(
        "Reviewed the accepted application inventory against the governed scope package.",
      ),
    ).toContain("Reviewed the accepted application inventory");
  });
});

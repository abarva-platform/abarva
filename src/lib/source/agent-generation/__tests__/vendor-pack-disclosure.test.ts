import {
  findD09VendorDisclosureViolations,
  markD09VendorDisclosureReview,
} from "../vendor-pack-disclosure";

describe("D09 vendor disclosure fence", () => {
  it("finds private buyer targets and workflow metadata in the signed-in draft", () => {
    const body = [
      "The commercial rationale is a 12–15% run-rate improvement planning hypothesis.",
      "Every upstream artifact is a QA draft with approval_granted=false.",
      "The internal review and negotiation workbook is not part of the pack.",
      "LOW/UNVALIDATED confidence; release hold RH-04 remains.",
    ].join("\n");

    expect(findD09VendorDisclosureViolations(body)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "buyer_value_target" }),
      expect.objectContaining({ code: "internal_workflow_metadata" }),
      expect.objectContaining({ code: "internal_negotiation_material" }),
    ]));
  });

  it("rejects unapproved evaluation and invented release timing from the signed-in draft", () => {
    const body = [
      "Weight status — UNAPPROVED. The weights below are a proposed draft for internal RFP drafting only.",
      "| Service capability | 30 | 0–5 scored against requirements |",
      "| Proposal due | T₀ + 20 business days |",
      "Release hold RH-05 blocks external distribution.",
    ].join("\n");

    expect(findD09VendorDisclosureViolations(body)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "unapproved_evaluation" }),
      expect.objectContaining({ code: "unverified_timeline" }),
      expect.objectContaining({ code: "internal_release_control" }),
    ]));
  });

  it("allows vendor pricing and evaluation instructions without a buyer savings target", () => {
    const body = [
      "Submit separate run and change prices in the Pricing Response tab.",
      "Commercial evaluation has a 20% weight, subject to the issued scoring rules.",
      "Offer an optional 24x7 coverage price and describe the associated SLA credits.",
    ].join("\n");

    expect(findD09VendorDisclosureViolations(body)).toEqual([]);
  });

  it("overrides a passing D09 quality receipt when the finished draft leaks", () => {
    const prior = {
      required: true,
      standardId: "partner-grade-consulting-deliverable-v1" as const,
      minRequiredScore: 8 as const,
      passed: true,
      rewriteAttempted: false,
      attempts: 1,
      finalSummary: "Model review passed.",
      reviews: [],
    };

    const result = markD09VendorDisclosureReview({
      artifactCode: "d09_rfp_pack",
      body: "The buyer's planning hypothesis is 12–15% run-rate improvement.",
      qualityGate: prior,
    });

    expect(result.failureDetail).toContain("buyer_value_target");
    expect(result.qualityGate).toMatchObject({ passed: false });
    expect(prior.passed).toBe(true);
    expect(markD09VendorDisclosureReview({
      artifactCode: "d11_response_checklist",
      body: "The buyer's planning hypothesis is 12–15% run-rate improvement.",
      qualityGate: prior,
    })).toEqual({ qualityGate: prior, failureDetail: null });
  });
});

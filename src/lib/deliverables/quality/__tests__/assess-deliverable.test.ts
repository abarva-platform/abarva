import {
  assessClientDeliverable,
  resolveArtifactTitle,
} from "../assess-deliverable";

describe("assessClientDeliverable (W1/W4 seam)", () => {
  it("passes a clean charter and keeps its title", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText: "We recommend approving a focused discovery gate.",
      renderedExhibits: [
        "decision_box",
        "known_unknown_table",
        "proceed_hold_stop_gate",
        "open_inputs_required",
      ],
    });
    expect(a.report.passed).toBe(true);
    expect(a.resolvedTitle).toBe("Initiative Charter");
  });

  it("downgrades a thin-data business case to a readiness memo title", () => {
    const a = assessClientDeliverable({
      deliverableKey: "business_case",
      narrativeText: "We recommend funding the program.",
      renderedExhibits: ["value_tree", "decision_box", "open_inputs_required"],
      financialInputs: {
        hasBaseline: false,
        hasCost: false,
        hasBenefit: false,
        hasSensitivity: false,
      },
    });
    expect(a.report.businessCaseMode).toBe("readiness_memo");
    expect(a.resolvedTitle).toBe("Business Case Readiness Memo");
  });

  it("keeps the full Business Case title when finance-grade inputs exist", () => {
    expect(resolveArtifactTitle("business_case", "full_business_case")).toBe(
      "Business Case",
    );
  });

  it("surfaces blocking findings from the gates", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText:
        "Per the P2 source register the substrate context rows show this.",
      renderedExhibits: [
        "decision_box",
        "known_unknown_table",
        "proceed_hold_stop_gate",
        "open_inputs_required",
      ],
    });
    expect(a.report.passed).toBe(false);
    expect(a.report.findings.some((f) => f.gate === "machinery")).toBe(true);
  });
});

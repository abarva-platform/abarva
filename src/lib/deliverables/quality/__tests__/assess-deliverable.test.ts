import {
  assessClientDeliverable,
  resolveArtifactTitle,
} from "../assess-deliverable";

const CHARTER_EXHIBITS = [
  "decision_box",
  "known_unknown_table",
  "proceed_hold_stop_gate",
  "open_inputs_required",
] as const;

describe("assessClientDeliverable — the blocking quality gate", () => {
  it("returns client_ready for a clean, decision-led charter", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText: "We recommend approving a focused discovery gate.",
      renderedExhibits: [...CHARTER_EXHIBITS],
    });
    expect(a.state).toBe("client_ready");
    expect(a.clientReady).toBe(true);
    expect(a.resolvedTitle).toBe("Initiative Charter");
  });

  it("blocks_missing_exhibits when a required exhibit is absent", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText: "We recommend approving a focused discovery gate.",
      renderedExhibits: ["decision_box"],
    });
    expect(a.state).toBe("blocked_missing_exhibits");
    expect(a.clientReady).toBe(false);
  });

  it("blocks_missing_inputs when placeholders are scattered", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText:
        "We recommend proceeding. Volume [CLIENT TO COMPLETE]. Cost [CLIENT TO COMPLETE]. Cycle TBC. Rate to be confirmed.",
      renderedExhibits: [...CHARTER_EXHIBITS],
    });
    expect(a.state).toBe("blocked_missing_inputs");
  });

  it("blocks_quality for mechanical / machinery-exposed writing", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText:
        "We recommend proceeding. Per the P2 source register, the substrate context rows indicate the initiative is not authorized to build.",
      renderedExhibits: [...CHARTER_EXHIBITS],
    });
    expect(a.state).toBe("blocked_quality");
    expect(
      a.quality.findings.some((f) => f.dimension === "non_mechanical_writing"),
    ).toBe(true);
  });

  it("blocks_quality when the decision is not stated up front", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText:
        "The trade finance process involves many steps and stakeholders across the organisation.",
      renderedExhibits: [...CHARTER_EXHIBITS],
    });
    expect(a.state).toBe("blocked_quality");
    expect(
      a.quality.findings.some((f) => f.dimension === "decision_clarity"),
    ).toBe(true);
  });

  it("treats an explicit choice as a clear first-screen decision", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText:
        "Choose Option B: governed recommendation workflow for the next phase. This keeps human approval on customer-impacting actions.",
      renderedExhibits: [...CHARTER_EXHIBITS],
    });
    expect(
      a.quality.findings.some((f) => f.dimension === "decision_clarity"),
    ).toBe(false);
  });

  it("blocks_quality for generic prose with no tenant specificity", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText:
        "We recommend a transformation programme to modernise operations and unlock value across the enterprise.",
      renderedExhibits: [...CHARTER_EXHIBITS],
      tenantTerms: ["First Capital", "Letter of Credit", "FIS"],
    });
    expect(a.state).toBe("blocked_quality");
    expect(
      a.quality.findings.some((f) => f.dimension === "client_specificity"),
    ).toBe(true);
  });

  it("blocks_governance when egress/data governance failed", () => {
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText: "We recommend approving a focused discovery gate.",
      renderedExhibits: [...CHARTER_EXHIBITS],
      governanceOk: false,
    });
    expect(a.state).toBe("blocked_governance");
  });

  it("downgrades a thin-data business case to a Readiness Memo", () => {
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
    expect(a.quality.businessCaseMode).toBe("readiness_memo");
    expect(a.resolvedTitle).toBe("Business Case Readiness Memo");
  });

  it("keeps the full Business Case title with finance-grade inputs", () => {
    expect(resolveArtifactTitle("business_case", "full_business_case")).toBe(
      "Business Case",
    );
  });
});

import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "../phase-capture-contract";
import { resolveConfirmedSolutionRoute } from "../solution-route-assessment";

const businessChangeAssessment = JSON.stringify({
  expectedWorkflowChange: "none",
  expectedRoleAccountabilityChange: "none",
  adoptionOwner: "Business analytics lead",
  adoptionResponsibility: "business",
  evidenceReference: "P1 operating-owner interview",
  validatedBy: "Business sponsor",
});

function captureValues(phase: number): Record<string, string> {
  const values = Object.fromEntries(
    getPhaseCaptureSections(phase).map((section) => [
      section.key,
      `${section.label} captured`,
    ]),
  );
  if (phase === 1) values.business_change_assessment = businessChangeAssessment;
  if (phase === 2) {
    values.solution_route_validation = JSON.stringify({
      businessChangeAssessmentSnapshot: JSON.parse(businessChangeAssessment),
      solutionOutput: "reports_dashboards",
      workflowChange: "none",
      roleAccountabilityChange: "none",
      evidenceReference: "evidence-p2-1",
      decision: "confirm",
      selectedRoute: "technical_product",
      correctionRationale: "",
      validatedBy: "Business sponsor",
    });
  }
  if (phase === 4) {
    const shared = {
      pairId: "pair-1",
      workPackage: "Reporting foundation",
      role: "Data engineer",
      lowHours: 10,
      baseHours: 20,
      highHours: 30,
      rateSource: "Planning rate card",
      inputBasis: "assumption",
      evidenceReference: "",
      assumption: "Bounded first release",
      confidence: "medium",
      aiEligiblePct: 0,
      aiToolAssumption: "",
      humanReviewHours: 0,
    };
    values.estimates_capacity = JSON.stringify({
      currency: "USD",
      reviewer: "Finance reviewer",
      reviewConfirmed: true,
      sourceNotes: "",
      rows: [
        { ...shared, deliveryModel: "internal", ratePerHour: 100 },
        { ...shared, deliveryModel: "vendor", ratePerHour: 150 },
      ],
    });
  }
  return values;
}

describe("phase-capture-contract", () => {
  it("defines a complete P0 capture binder for real Move origination", () => {
    const sections = getPhaseCaptureSections(0);
    expect(sections.map((section) => section.key)).toEqual([
      "business_trigger",
      "problem_statement",
      "affected_function_process",
      "scope_out",
      "initial_value_hypothesis",
      "outcomes_success",
      "discovery_questions",
      "stakeholder_owner_view",
      "known_evidence",
      "missing_evidence_open_questions",
      "recommendation_to_advance",
    ]);
    expect(sections.every((section) => section.required)).toBe(true);
  });

  it("blocks completion when a required section is missing", () => {
    const result = evaluatePhaseCapture(0, {
      business_trigger: "Invoice exceptions are delaying AP close.",
      problem_statement: "Exception handling is fragmented.",
    });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("In scope");
    expect(result.missing).toContain("Recommendation to advance");
  });

  it("marks capture complete only when every required section has content", () => {
    const values = captureValues(0);
    const result = evaluatePhaseCapture(0, values);
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.sections.every((section) => section.complete)).toBe(true);
  });

  it("uses stable module keys that the generation guard can read", () => {
    expect(phaseCaptureModuleKey(0, "business_trigger")).toBe(
      "phase_0_business_trigger",
    );
    expect(phaseCaptureModuleKey(2, "current_state_findings")).toBe(
      "phase_2_current_state_findings",
    );
  });

  it("does not complete P1/P2 from arbitrary text in structured decisions", () => {
    const p1 = captureValues(1);
    p1.business_change_assessment = "looks technical, business owns adoption";
    expect(evaluatePhaseCapture(1, p1).complete).toBe(false);

    const p2 = captureValues(2);
    p2.solution_route_validation = "technical product confirmed";
    expect(
      evaluatePhaseCapture(2, p2, {
        businessChangeAssessment,
        approvedEvidenceReferences: ["evidence-p2-1"],
      }).complete,
    ).toBe(false);
  });

  it("does not complete roadmap capture until estimate math and human review are valid", () => {
    const p4 = captureValues(4);
    expect(evaluatePhaseCapture(4, p4).complete).toBe(true);

    const model = JSON.parse(p4.estimates_capacity);
    model.reviewConfirmed = false;
    p4.estimates_capacity = JSON.stringify(model);
    const result = evaluatePhaseCapture(4, p4);
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("Estimates & capacity");
  });

  it("opens the technical-product P3 contract only after P2 confirms the matching P1 snapshot", () => {
    const p2 = captureValues(2);
    const confirmed = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: p2.solution_route_validation,
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    expect(confirmed?.route).toBe("technical_product");
    expect(
      getPhaseCaptureSections(3, confirmed).map((section) => section.key),
    ).toEqual([
      "solution_approach",
      "business_change_boundary",
      "controls_governance",
      "architecture_integration",
      "evidence_confidence",
      "recommendation",
    ]);
    const staleP1 = JSON.stringify({
      ...JSON.parse(businessChangeAssessment),
      adoptionOwner: "Different owner",
    });
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment: staleP1,
        routeValidation: p2.solution_route_validation,
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBeNull();
  });

  it("uses bounded estimate-ready P3 capture for limited process change only", () => {
    const p2 = captureValues(2);
    const limitedProcess = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: JSON.stringify({
        ...JSON.parse(p2.solution_route_validation),
        solutionOutput: "workflow_automation",
        workflowChange: "limited",
        selectedRoute: "process_change",
      }),
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    expect(
      getPhaseCaptureSections(3, limitedProcess).map((section) => section.key),
    ).toEqual([
      "solution_approach",
      "workflow_delta",
      "process_adoption_boundary",
      "controls_governance",
      "architecture_integration",
      "evidence_confidence",
      "estimate_assumptions",
      "recommendation",
    ]);

    const materialProcess = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: JSON.stringify({
        ...JSON.parse(p2.solution_route_validation),
        solutionOutput: "workflow_automation",
        workflowChange: "material",
        selectedRoute: "process_change",
      }),
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    expect(
      getPhaseCaptureSections(3, materialProcess).map((section) => section.key),
    ).toEqual([
      "solution_approach",
      "operating_model",
      "process_design",
      "controls_governance",
      "architecture_integration",
      "evidence_confidence",
      "recommendation",
    ]);
  });
});

describe("P1 charter capture guidance (clarity)", () => {
  const sections = getPhaseCaptureSections(1);

  it("gives every free-text charter input a worked example for the placeholder", () => {
    for (const s of sections) {
      if (s.structured) continue; // structured widgets render their own guidance
      expect(typeof s.example).toBe("string");
      expect((s.example ?? "").toLowerCase()).toContain("e.g.");
    }
  });

  it("phrases the sponsor input in plain language, not system jargon", () => {
    const sponsor = sections.find((s) => s.key === "sponsor_commitment");
    // No internal phrasing on the client surface, and a worked example to fill.
    expect(sponsor?.description ?? "").not.toMatch(/resolvable workspace identity/i);
    expect((sponsor?.example ?? "").toLowerCase()).toContain("e.g.");
  });
});

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
});

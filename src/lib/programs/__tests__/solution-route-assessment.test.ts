import {
  isBusinessChangeAssessmentComplete,
  isSolutionRouteValidationComplete,
  recommendSolutionRoute,
  resolveConfirmedSolutionRoute,
  stampSolutionRouteReviewer,
} from "../solution-route-assessment";

const businessChangeAssessment = JSON.stringify({
  expectedWorkflowChange: "none",
  expectedRoleAccountabilityChange: "none",
  adoptionOwner: "Business analytics lead",
  adoptionResponsibility: "business",
  evidenceReference: "P1 operating-owner interview notes",
  validatedBy: "Business sponsor",
});

function routeValidation(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    businessChangeAssessmentSnapshot: JSON.parse(businessChangeAssessment),
    solutionOutput: "reports_dashboards",
    workflowChange: "none",
    roleAccountabilityChange: "none",
    evidenceReference: "evidence-p2-1",
    decision: "confirm",
    selectedRoute: "technical_product",
    correctionRationale: "",
    validatedBy: "Business sponsor",
    ...overrides,
  });
}

describe("Moves solution route assessment", () => {
  it("requires P1 impact, adoption ownership, evidence, and human validation", () => {
    expect(isBusinessChangeAssessmentComplete(businessChangeAssessment)).toBe(
      true,
    );
    expect(
      isBusinessChangeAssessmentComplete(
        JSON.stringify({
          ...JSON.parse(businessChangeAssessment),
          adoptionOwner: "",
        }),
      ),
    ).toBe(false);
  });

  it("recommends a technical product for reporting with no material business change", () => {
    expect(
      recommendSolutionRoute({
        solutionOutput: "reports_dashboards",
        workflowChange: "none",
        roleAccountabilityChange: "limited",
      }),
    ).toBe("technical_product");
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment,
        routeValidation: routeValidation(),
        approvedEvidenceReferences: ["evidence-p2-1"],
      })?.route,
    ).toBe("technical_product");
  });

  it.each([
    [
      "material workflow change",
      "workflow_automation",
      "material",
      "none",
      "process_change",
    ],
    [
      "material role change",
      "data_product",
      "none",
      "material",
      "operating_model_change",
    ],
    [
      "material workflow and role change",
      "data_product",
      "material",
      "material",
      "combined_change",
    ],
    [
      "service model output",
      "service_operating_model",
      "none",
      "none",
      "operating_model_change",
    ],
  ])(
    "routes %s without conflating it with a technical product",
    (_label, output, workflow, roles, expected) => {
      expect(
        recommendSolutionRoute({
          solutionOutput: output as "data_product",
          workflowChange: workflow as "none",
          roleAccountabilityChange: roles as "none",
        }),
      ).toBe(expected);
    },
  );

  it("requires a rationale when a human corrects the recommendation", () => {
    const corrected = routeValidation({
      decision: "correct",
      selectedRoute: "process_change",
      correctionRationale: "A new exception workflow is required.",
    });
    expect(
      isSolutionRouteValidationComplete({
        businessChangeAssessment,
        routeValidation: corrected,
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBe(true);
    expect(
      isSolutionRouteValidationComplete({
        businessChangeAssessment,
        routeValidation: routeValidation({
          decision: "correct",
          selectedRoute: "process_change",
        }),
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBe(false);
  });

  it("uses authenticated reviewer identity instead of a client-typed identity", () => {
    const stamped = stampSolutionRouteReviewer(
      routeValidation({ validatedBy: "client-supplied name" }),
      "reviewer-123",
    );
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment,
        routeValidation: stamped,
        approvedEvidenceReferences: ["evidence-p2-1"],
      })?.validatedBy,
    ).toBe("reviewer-123");
  });

  it("does not allow a technical-product correction to erase material change", () => {
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment,
        routeValidation: routeValidation({
          workflowChange: "material",
          decision: "correct",
          selectedRoute: "technical_product",
          correctionRationale: "We still believe this is only a dashboard.",
        }),
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBeNull();
  });

  it("fails closed on unresolved, unconfirmed, or unsupported responses", () => {
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment,
        routeValidation: routeValidation({ decision: "unconfirmed" }),
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBeNull();
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment,
        routeValidation: routeValidation({ solutionOutput: "mixed" }),
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBeNull();
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment: "not-json",
        routeValidation: routeValidation(),
        approvedEvidenceReferences: ["evidence-p2-1"],
      }),
    ).toBeNull();
  });

  it("rejects a route when its cited evidence is not approved for P2", () => {
    expect(
      resolveConfirmedSolutionRoute({
        businessChangeAssessment,
        routeValidation: routeValidation(),
        approvedEvidenceReferences: [],
      }),
    ).toBeNull();
  });
});

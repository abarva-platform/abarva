import {
  formatSolutionRouteForP4Prompt,
  formatSolutionRouteDepthForPrompt,
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

  it("preserves validated impact detail for downstream P3 scoping", () => {
    const resolved = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: routeValidation({
        solutionOutput: "workflow_automation",
        workflowChange: "limited",
        selectedRoute: "process_change",
      }),
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    expect(resolved).toMatchObject({
      route: "process_change",
      solutionOutput: "workflow_automation",
      workflowChange: "limited",
      roleAccountabilityChange: "none",
      adoptionOwner: "Business analytics lead",
      adoptionResponsibility: "business",
    });
  });

  it("keeps technical-only P3 compact and assigns adoption to the validated owner", () => {
    const route = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: routeValidation(),
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    const prompt = formatSolutionRouteDepthForPrompt(route);

    expect(prompt).toContain("Technical product / data solution");
    expect(prompt).toContain("Do not request an end-to-end process redesign");
    expect(prompt).toContain("Business analytics lead (business)");
    expect(prompt).toContain("internal and vendor rates");
    expect(prompt).toContain("project execution remains outside Moves");
  });

  it("does not turn limited workflow change into a full process redesign", () => {
    const route = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: routeValidation({
        solutionOutput: "workflow_automation",
        workflowChange: "limited",
        selectedRoute: "process_change",
      }),
      approvedEvidenceReferences: ["evidence-p2-1"],
    });

    expect(formatSolutionRouteDepthForPrompt(route)).toContain(
      "Capture only the process delta",
    );
  });

  it("refuses to assume P3 depth while route validation is missing", () => {
    const prompt = formatSolutionRouteDepthForPrompt(null);

    expect(prompt).toContain("No current solution route is validated");
    expect(prompt).toContain("Do not assume a technical-only");
    expect(prompt).toContain("Return to discovery");
  });

  it("makes P4's estimate method transparent and preserves the validated scope", () => {
    const route = resolveConfirmedSolutionRoute({
      businessChangeAssessment,
      routeValidation: routeValidation(),
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    const prompt = formatSolutionRouteForP4Prompt(route);

    expect(prompt).toContain("APPROVED SCOPE BASIS: Technical product / data solution.");
    expect(prompt).toContain("Do not add end-to-end process redesign");
    expect(prompt).toContain("Business analytics lead (business)");
    expect(prompt).toContain("effort × rate arithmetic");
    expect(prompt).toContain("named human reviewer");
    expect(prompt).toContain("Claude Code/Codex");
    expect(prompt).toContain("execution remains outside Moves");
  });

  it("does not infer P4 scope if the upstream route is unavailable", () => {
    const prompt = formatSolutionRouteForP4Prompt(null);

    expect(prompt).toContain("No current route is validated");
    expect(prompt).toContain("do not infer a process or operating-model redesign");
    expect(prompt).toContain("require human resolution before final approval");
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

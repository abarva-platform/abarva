import {
  capturePhaseSectionTotal,
  capturePhaseTotalDependsOnRoute,
} from "@/lib/programs/capture-phase-section-totals";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

function route(
  overrides: Partial<ConfirmedSolutionRoute> = {},
): ConfirmedSolutionRoute {
  return {
    route: "process_change",
    recommendation: "process_change",
    solutionOutput: "workflow_automation",
    workflowChange: "material",
    roleAccountabilityChange: "material",
    adoptionOwner: "Named business owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "evidence-ref",
    validatedBy: "Validator",
    rationale: "Route confirmed against P2 evidence.",
    ...overrides,
  };
}

const TECHNICAL_PRODUCT = route({
  route: "technical_product",
  recommendation: "technical_product",
  solutionOutput: "data_product",
  workflowChange: "limited",
  roleAccountabilityChange: "none",
});

const LIMITED_PROCESS = route({
  workflowChange: "limited",
  roleAccountabilityChange: "none",
});

const MATERIAL_PROCESS = route({
  workflowChange: "material",
  roleAccountabilityChange: "material",
});

describe("capturePhaseSectionTotal", () => {
  it("states the total of the section set the capture surface will render", () => {
    for (const phase of [0, 1, 2, 3, 4, 5]) {
      for (const confirmed of [
        null,
        TECHNICAL_PRODUCT,
        LIMITED_PROCESS,
        MATERIAL_PROCESS,
      ]) {
        expect(capturePhaseSectionTotal(phase, confirmed)).toBe(
          getPhaseCaptureSections(phase, confirmed).length,
        );
      }
    }
  });

  it("gives P3 a narrower total on a technical-product route", () => {
    const unconfirmed = capturePhaseSectionTotal(3, null);
    const technical = capturePhaseSectionTotal(3, TECHNICAL_PRODUCT);

    expect(technical).toBeLessThan(unconfirmed);
    // The route-blind figure would have reported `unconfirmed` here, so a Move
    // on this route could answer every P3 section and still never reach its
    // own stated total.
    expect(technical).toBe(
      getPhaseCaptureSections(3, TECHNICAL_PRODUCT).length,
    );
  });

  it("gives P3 a wider total on a limited process change", () => {
    const unconfirmed = capturePhaseSectionTotal(3, null);
    const limited = capturePhaseSectionTotal(3, LIMITED_PROCESS);

    expect(limited).toBeGreaterThan(unconfirmed);
    // This is the impossible-count direction: answering all of them against a
    // route-blind total renders more answers than questions.
    expect(limited).toBe(getPhaseCaptureSections(3, LIMITED_PROCESS).length);
  });

  it("keeps P3's default total when a confirmed process change is material", () => {
    expect(capturePhaseSectionTotal(3, MATERIAL_PROCESS)).toBe(
      capturePhaseSectionTotal(3, null),
    );
  });

  it("leaves every phase other than P3 route-invariant", () => {
    for (const phase of [0, 1, 2, 4, 5]) {
      expect(capturePhaseTotalDependsOnRoute(phase, TECHNICAL_PRODUCT)).toBe(
        false,
      );
      expect(capturePhaseTotalDependsOnRoute(phase, LIMITED_PROCESS)).toBe(
        false,
      );
    }
  });

  it("confirms P3 is a phase that actually discriminates on the route", () => {
    // Without this, a fix that silently dropped the route argument would still
    // satisfy every equality above.
    expect(capturePhaseTotalDependsOnRoute(3, TECHNICAL_PRODUCT)).toBe(true);
    expect(capturePhaseTotalDependsOnRoute(3, LIMITED_PROCESS)).toBe(true);
    expect(capturePhaseTotalDependsOnRoute(3, null)).toBe(false);
  });
});

describe("the per-phase strip's answered-vs-total invariant", () => {
  // The strip's viewed row takes its answered count from the route-aware
  // section list and its total from this module. They have to agree, or the row
  // reads `8 of 7` (limited process) or caps at `6 of 7` (technical product).
  it("never lets a fully answered viewed phase exceed its own total", () => {
    for (const confirmed of [null, TECHNICAL_PRODUCT, LIMITED_PROCESS]) {
      const answeredWhenComplete = getPhaseCaptureSections(3, confirmed).length;
      expect(answeredWhenComplete).toBeLessThanOrEqual(
        capturePhaseSectionTotal(3, confirmed),
      );
      expect(answeredWhenComplete).toBe(capturePhaseSectionTotal(3, confirmed));
    }
  });
});

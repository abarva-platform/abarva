import {
  phaseDocumentDisplaySet,
} from "@/lib/programs/phase-document-display-set";
import { captureValueFromModuleRows } from "@/lib/programs/load-move-confirmed-route";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

// The two sets this suite is about, written out as literals rather than read
// from the registry: an expectation derived from the declaration under test
// cannot see the declaration change.
const P3_FULL_SET = [
  "target_state_architecture",
  "solution_design",
  "operating_model_design",
  "requirements_traceability",
  "sourcing_strategy",
  "planning_workshop_guide",
];
const P3_TECHNICAL_PRODUCT_SET = [
  "target_state_architecture",
  "requirements_traceability",
];
const P3_BOUNDED_PROCESS_CHANGE_SET = [
  "target_state_architecture",
  "process_change_estimate_brief",
  "requirements_traceability",
];

function route(
  over: Partial<ConfirmedSolutionRoute> = {},
): ConfirmedSolutionRoute {
  return {
    route: "technical_product",
    recommendation: "technical_product",
    solutionOutput: "data_product",
    workflowChange: "limited",
    roleAccountabilityChange: "none",
    adoptionOwner: "Named owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "evidence-1",
    validatedBy: "reviewer@example.com",
    rationale: "Confirmed system recommendation.",
    ...over,
  };
}

const keysOf = (specs: Array<{ deliverableTypeKey: string }>) =>
  specs.map((spec) => spec.deliverableTypeKey);

describe("phaseDocumentDisplaySet", () => {
  it("shows the full canonical set for a Move with no recorded route", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: null,
      hasOutput: () => false,
    });
    expect(keysOf(set.specs)).toEqual(P3_FULL_SET);
    expect(set.buildSetKeys).toEqual(P3_FULL_SET);
    expect(set.retainedOffRouteKeys).toEqual([]);
  });

  it("shows only the two documents a technical-product route builds", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route(),
      hasOutput: () => false,
    });
    expect(keysOf(set.specs)).toEqual(P3_TECHNICAL_PRODUCT_SET);
    expect(set.retainedOffRouteKeys).toEqual([]);
  });

  // The regression this module exists for. A technical-product Move that has
  // built everything its route declares read "2/6" on Files & Evidence: the
  // phase was complete and the page stated it was a third done. The denominator
  // is the displayed set, so it is asserted here as a count, against the full
  // set's own literal length so the contrast stays visible.
  it("counts a finished route-narrowed phase as complete, not as a shortfall", () => {
    const built = new Set(P3_TECHNICAL_PRODUCT_SET);
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route(),
      hasOutput: (key) => built.has(key),
    });
    expect(set.specs).toHaveLength(2);
    expect(P3_FULL_SET).toHaveLength(6);
    expect(set.specs.filter((s) => built.has(s.deliverableTypeKey))).toHaveLength(
      set.specs.length,
    );
  });

  it("keeps a document outside the build set when the Move has output for it", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route(),
      hasOutput: (key) => key === "solution_design",
    });
    expect(keysOf(set.specs)).toEqual([
      ...P3_TECHNICAL_PRODUCT_SET,
      "solution_design",
    ]);
    expect(set.retainedOffRouteKeys).toEqual(["solution_design"]);
    expect(set.buildSetKeys).toEqual(P3_TECHNICAL_PRODUCT_SET);
  });

  it("retains several off-route documents in canonical order", () => {
    // Answered in an order that is neither canonical nor reverse-canonical, so
    // the assertion cannot pass by echoing the predicate's call order.
    const retained = ["sourcing_strategy", "operating_model_design"];
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route(),
      hasOutput: (key) => retained.includes(key),
    });
    expect(set.retainedOffRouteKeys).toEqual([
      "operating_model_design",
      "sourcing_strategy",
    ]);
    expect(keysOf(set.specs)).toEqual([
      ...P3_TECHNICAL_PRODUCT_SET,
      "operating_model_design",
      "sourcing_strategy",
    ]);
  });

  // The control for the retention rule: `hasOutput` may only ADD rows. A
  // document the route declares is shown whether or not anything has been built
  // for it, because that is the work the phase still owes.
  it("never hides a build-set document for having no output", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route(),
      hasOutput: () => false,
    });
    expect(keysOf(set.specs)).toEqual(P3_TECHNICAL_PRODUCT_SET);
  });

  it("narrows a bounded process-change route to its three documents", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route({
        route: "process_change",
        recommendation: "process_change",
        solutionOutput: "workflow_automation",
        workflowChange: "limited",
        roleAccountabilityChange: "none",
      }),
      hasOutput: () => false,
    });
    expect(keysOf(set.specs)).toEqual(P3_BOUNDED_PROCESS_CHANGE_SET);
  });

  it("does not narrow a process-change route whose workflow change is material", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: route({
        route: "process_change",
        recommendation: "process_change",
        solutionOutput: "workflow_automation",
        workflowChange: "material",
      }),
      hasOutput: () => false,
    });
    expect(keysOf(set.specs)).toEqual(P3_FULL_SET);
    expect(set.retainedOffRouteKeys).toEqual([]);
  });

  // Only P3 is route-scoped today. A route must not change any other phase's
  // list, or a narrowed Move would lose rows it still owes.
  it.each([1, 2, 4, 5])("leaves phase %i unchanged by the route", (phase) => {
    const withRoute = phaseDocumentDisplaySet({
      phase,
      route: route(),
      hasOutput: () => false,
    });
    const withoutRoute = phaseDocumentDisplaySet({
      phase,
      route: null,
      hasOutput: () => false,
    });
    expect(keysOf(withRoute.specs)).toEqual(keysOf(withoutRoute.specs));
    expect(withRoute.specs.length).toBeGreaterThan(0);
  });

  it("returns an empty set for a phase with no canonical keys", () => {
    const set = phaseDocumentDisplaySet({
      phase: 9,
      route: null,
      hasOutput: () => true,
    });
    expect(set.specs).toEqual([]);
    expect(set.retainedOffRouteKeys).toEqual([]);
  });

  // A canonical key that no longer resolves to a registry spec drops its row
  // rather than rendering an empty one — the same resolution the build path
  // uses, which refuses the build naming the key.
  it("drops a declared key that resolves to no spec", () => {
    const set = phaseDocumentDisplaySet({
      phase: 3,
      route: null,
      hasOutput: () => false,
      deps: {
        canonicalKeys: { 3: ["target_state_architecture", "no_such_document"] },
        buildSet: (phase, _route, deps) => {
          const keys = deps?.keysForPhase
            ? deps.keysForPhase(phase, null)
            : ["target_state_architecture", "no_such_document"];
          return {
            declaredKeys: keys,
            specs: keys
              .filter((key) => key === "target_state_architecture")
              .map(
                (key) =>
                  ({ deliverableTypeKey: key }) as unknown as ReturnType<
                    typeof phaseDocumentDisplaySet
                  >["specs"][number],
              ),
            unresolvedKeys: keys.filter(
              (key) => key !== "target_state_architecture",
            ),
          };
        },
      },
    });
    expect(keysOf(set.specs)).toEqual(["target_state_architecture"]);
    expect(set.buildSetKeys).toEqual([
      "target_state_architecture",
      "no_such_document",
    ]);
  });
});

describe("captureValueFromModuleRows", () => {
  it("reads the stored value for a phase's section key", () => {
    expect(
      captureValueFromModuleRows(
        [
          { module_key: "phase_1_business_change_assessment", state_jsonb: { value: "{}" } },
          { module_key: "phase_2_solution_route_validation", state_jsonb: { value: "recorded" } },
        ],
        2,
        "solution_route_validation",
      ),
    ).toBe("recorded");
  });

  it("does not read one phase's answer for another phase", () => {
    expect(
      captureValueFromModuleRows(
        [{ module_key: "phase_1_recommendation", state_jsonb: { value: "p1" } }],
        2,
        "recommendation",
      ),
    ).toBe("");
  });

  it("returns empty for a missing row and for a non-string value", () => {
    expect(captureValueFromModuleRows([], 2, "solution_route_validation")).toBe(
      "",
    );
    expect(
      captureValueFromModuleRows(
        [{ module_key: "phase_2_x", state_jsonb: { value: { not: "a string" } } }],
        2,
        "x",
      ),
    ).toBe("");
  });
});

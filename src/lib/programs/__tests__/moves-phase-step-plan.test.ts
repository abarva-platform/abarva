import {
  phaseStepPlan,
  resolvePhaseStepGroups,
} from "../moves-phase-step-plan";
import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "../phase-capture-contract";
import type { ConfirmedSolutionRoute } from "../solution-route-assessment";

const PHASES = [0, 1, 2, 3, 4, 5] as const;

const confirmedRoute = (
  over: Partial<ConfirmedSolutionRoute>,
): ConfirmedSolutionRoute => ({
  route: "technical_product",
  recommendation: "technical_product",
  solutionOutput: "data_product",
  workflowChange: "none",
  roleAccountabilityChange: "none",
  adoptionOwner: "Named business owner",
  adoptionResponsibility: "business",
  decision: "confirm",
  evidenceReference: "EV-1",
  validatedBy: "reviewer",
  rationale: "Route confirmed from Discover evidence.",
  ...over,
});

/** The P3 route shapes that re-declare the phase's question set. */
const TECHNICAL_PRODUCT = confirmedRoute({});
const LIMITED_PROCESS_CHANGE = confirmedRoute({
  route: "process_change",
  recommendation: "process_change",
  solutionOutput: "workflow_automation",
  workflowChange: "limited",
  roleAccountabilityChange: "limited",
});
/** A material process change keeps the DEFAULT P3 set. */
const MATERIAL_PROCESS_CHANGE = confirmedRoute({
  route: "process_change",
  recommendation: "process_change",
  solutionOutput: "workflow_automation",
  workflowChange: "material",
  roleAccountabilityChange: "material",
});

const keysOf = (groups: readonly { sectionKeys: readonly string[] }[]) =>
  groups.flatMap((group) => [...group.sectionKeys]);

describe("resolvePhaseStepGroups — every declared question is reachable", () => {
  // The property the whole module exists for. A question the contract marks
  // required but no step mounts can never be answered, so `evaluatePhaseCapture`
  // reports it missing for ever and the phase can never be built.
  const cases: readonly [string, number, ConfirmedSolutionRoute | null][] = [
    ["phase 0", 0, null],
    ["phase 1", 1, null],
    ["phase 2", 2, null],
    ["phase 3 · default", 3, null],
    ["phase 3 · material process change", 3, MATERIAL_PROCESS_CHANGE],
    ["phase 3 · technical product", 3, TECHNICAL_PRODUCT],
    ["phase 3 · limited process change", 3, LIMITED_PROCESS_CHANGE],
    ["phase 4", 4, null],
    ["phase 5", 5, null],
  ];

  it.each(cases)(
    "%s: covers each declared key exactly once and references no undeclared key",
    (_name, phase, route) => {
      const declared = getPhaseCaptureSections(phase, route).map((s) => s.key);
      const referenced = keysOf(resolvePhaseStepGroups(phase, declared.map(
        (key) => ({ key, label: key, description: key, required: true }),
      )));

      expect([...referenced].sort()).toEqual([...declared].sort());
      expect(new Set(referenced).size).toBe(referenced.length);
    },
  );

  it.each(cases)("%s: keeps the three-step shape with no empty step", (
    _name,
    phase,
    route,
  ) => {
    const groups = resolvePhaseStepGroups(
      phase,
      getPhaseCaptureSections(phase, route),
    );
    expect(groups).toHaveLength(3);
    for (const group of groups) {
      expect(group.sectionKeys.length).toBeGreaterThan(0);
      expect(group.title.trim().length).toBeGreaterThan(0);
      expect(group.intro.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("the P3 route variants", () => {
  it("mounts the technical-product boundary question the default grouping never asked", () => {
    const sections = getPhaseCaptureSections(3, TECHNICAL_PRODUCT);
    // The question the route declares, and the two the route drops.
    expect(sections.map((s) => s.key)).toContain("business_change_boundary");

    const plan = phaseStepPlan(3, sections);
    expect(plan.basis).toBe("variant");
    expect(keysOf(plan.groups)).toContain("business_change_boundary");
    // The operating-model/process-design pair is not asked for on this route,
    // and no step may reference it — a step whose keys do not all resolve reads
    // as permanently incomplete and is where a reload lands.
    expect(keysOf(plan.groups)).not.toContain("operating_model");
    expect(keysOf(plan.groups)).not.toContain("process_design");
  });

  it("mounts all three questions the limited-process route declares", () => {
    const plan = phaseStepPlan(
      3,
      getPhaseCaptureSections(3, LIMITED_PROCESS_CHANGE),
    );
    expect(plan.basis).toBe("variant");
    const referenced = keysOf(plan.groups);
    expect(referenced).toContain("workflow_delta");
    expect(referenced).toContain("process_adoption_boundary");
    expect(referenced).toContain("estimate_assumptions");
    expect(referenced).not.toContain("operating_model");
  });

  it("leaves the default grouping in place for every phase it already fits", () => {
    for (const phase of PHASES) {
      expect(phaseStepPlan(phase, getPhaseCaptureSections(phase)).basis).toBe(
        "default",
      );
    }
    expect(
      phaseStepPlan(3, getPhaseCaptureSections(3, MATERIAL_PROCESS_CHANGE)).basis,
    ).toBe("default");
  });
});

describe("the repair path — a declared key no grouping anticipated", () => {
  const section = (key: string): PhaseCaptureSection => ({
    key,
    label: key,
    description: key,
    required: true,
  });

  it("appends an unanticipated key to the last step rather than dropping it", () => {
    const sections = [
      ...getPhaseCaptureSections(3),
      section("future_route_question"),
    ];
    const plan = phaseStepPlan(3, sections);

    expect(plan.basis).toBe("repaired");
    expect(plan.appendedKeys).toEqual(["future_route_question"]);
    expect(plan.droppedKeys).toEqual([]);
    expect(keysOf(plan.groups)).toContain("future_route_question");
    expect(plan.groups[plan.groups.length - 1].sectionKeys).toContain(
      "future_route_question",
    );
    expect(plan.groups).toHaveLength(3);
  });

  it("drops a grouped key the contract no longer declares, and reports it", () => {
    const sections = getPhaseCaptureSections(3).filter(
      (s) => s.key !== "process_design",
    );
    const plan = phaseStepPlan(3, sections);

    expect(plan.basis).toBe("repaired");
    expect(plan.droppedKeys).toEqual(["process_design"]);
    expect(keysOf(plan.groups)).not.toContain("process_design");
    expect([...keysOf(plan.groups)].sort()).toEqual(
      sections.map((s) => s.key).sort(),
    );
  });

  it("covers a set that both drops and adds, in contract order", () => {
    const sections = [
      section("solution_approach"),
      section("brand_new_one"),
      section("brand_new_two"),
      section("recommendation"),
    ];
    const plan = phaseStepPlan(3, sections);

    expect(plan.basis).toBe("repaired");
    expect(plan.appendedKeys).toEqual(["brand_new_one", "brand_new_two"]);
    expect([...keysOf(plan.groups)].sort()).toEqual(
      ["brand_new_one", "brand_new_two", "recommendation", "solution_approach"],
    );
  });
});

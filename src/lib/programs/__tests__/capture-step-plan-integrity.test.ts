import {
  MOVES_CAPTURE_STEP_BAR_STEPS,
  auditCaptureStepPlan,
  auditEveryCaptureStepPlan,
  auditedCapturePhases,
  captureRouteConfigurations,
  describeCaptureStepPlanDefects,
  type CaptureStepPlanDefectKind,
} from "../capture-step-plan-integrity";
import { phaseStepPlan } from "../moves-phase-step-plan";
import { getPhaseCaptureSections } from "../phase-capture-contract";
import type { PhaseCaptureSection } from "../phase-capture-contract";
import type { PhaseStepPlan } from "../moves-phase-step-plan";

const section = (key: string): PhaseCaptureSection => ({
  key,
  label: key,
  description: key,
  required: true,
});

const plan = (
  groups: ReadonlyArray<readonly string[]>,
  overrides: Partial<PhaseStepPlan> = {},
): PhaseStepPlan => ({
  groups: groups.map((sectionKeys, index) => ({
    title: `Step ${index + 1}`,
    intro: "",
    sectionKeys,
  })),
  basis: "default",
  droppedKeys: [],
  appendedKeys: [],
  ...overrides,
});

const kinds = (
  defects: ReadonlyArray<{ kind: CaptureStepPlanDefectKind }>,
): CaptureStepPlanDefectKind[] => defects.map((defect) => defect.kind);

// ── The property this suite exists for ──
describe("the shipped capture declarations hold every question a phase asks", () => {
  it("reports no defect on any phase the product serves, under any route", () => {
    const defects = auditEveryCaptureStepPlan();
    expect(describeCaptureStepPlanDefects(defects)).toBe(
      "No capture step-plan defects.",
    );
    expect(defects).toEqual([]);
  });

  // A sweep that audits nothing would also report no defect, so the inputs are
  // asserted to be real before the clean result above is believed.
  it("audits the whole phase range the route parser serves", () => {
    expect(auditedCapturePhases()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("audits more than one route configuration, including the unconfirmed one", () => {
    const configurations = captureRouteConfigurations();
    expect(configurations.length).toBeGreaterThan(1);
    expect(configurations[0]).toEqual({
      label: "no confirmed route",
      route: null,
    });
    // 4 confirmable routes x 3 assessable impact levels, both axes, plus the
    // unconfirmed case. Derived from the constants, so this is the count the
    // constants imply rather than a number chosen here.
    expect(configurations).toHaveLength(1 + 4 * 3 * 3);
  });

  it("reaches more than one distinct declared key set, so the dedupe does not collapse the sweep", () => {
    const signatures = new Set(
      captureRouteConfigurations().map((configuration) =>
        getPhaseCaptureSections(3, configuration.route)
          .map((item) => item.key)
          .join("|"),
      ),
    );
    expect(signatures.size).toBeGreaterThan(1);
  });

  // The sweep DEDUPES route configurations per phase. A dedupe that collapsed
  // to one visit per phase — or to nothing — would still report no defect, so
  // what it actually visited is asserted rather than inferred from a clean
  // result.
  it("visits every audited phase, and P3 once per distinct declared key set", () => {
    const visited: Array<{ phase: number; keys: string }> = [];
    auditEveryCaptureStepPlan({
      planFor: (phase, sections) => {
        visited.push({
          phase,
          keys: sections.map((item) => item.key).join("|"),
        });
        return phaseStepPlan(phase, sections);
      },
    });
    expect([...new Set(visited.map((visit) => visit.phase))]).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    const distinctP3 = new Set(
      visited.filter((visit) => visit.phase === 3).map((visit) => visit.keys),
    );
    expect(distinctP3.size).toBe(
      visited.filter((visit) => visit.phase === 3).length,
    );
    expect(distinctP3.size).toBeGreaterThan(1);
    // A route-insensitive phase is visited exactly once despite many
    // configurations, which is what the dedupe is for.
    expect(visited.filter((visit) => visit.phase === 1)).toHaveLength(1);
  });

  it("resolves every audited phase on an anticipated basis at the flow's step count", () => {
    for (const phase of auditedCapturePhases()) {
      for (const configuration of captureRouteConfigurations()) {
        const sections = getPhaseCaptureSections(phase, configuration.route);
        const resolved = phaseStepPlan(phase, sections);
        expect(resolved.basis).not.toBe("repaired");
        expect(resolved.groups).toHaveLength(MOVES_CAPTURE_STEP_BAR_STEPS);
      }
    }
  });
});

// ── Each invariant is proven to be CHECKED, on a constructed violation ──
describe("auditCaptureStepPlan detects each drift it exists to catch", () => {
  const sections = [section("a"), section("b"), section("c")];
  const clean = {
    phase: 2,
    routeLabel: "constructed",
    sections,
    plan: plan([["a"], ["b"], ["c"]]),
  };

  it("passes a grouping that holds every declared question exactly once", () => {
    expect(auditCaptureStepPlan(clean)).toEqual([]);
  });

  it("catches a question no step holds — the shape that stalls Save", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([["a"], ["b"], []]),
    });
    expect(kinds(defects)).toContain("question_in_no_step");
    expect(
      defects.find((defect) => defect.kind === "question_in_no_step")?.subjects,
    ).toEqual(["c"]);
  });

  it("catches a question two steps both hold", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([["a", "b"], ["b"], ["c"]]),
    });
    expect(kinds(defects)).toContain("question_in_many_steps");
    expect(
      defects.find((defect) => defect.kind === "question_in_many_steps")
        ?.subjects,
    ).toEqual(["b"]);
  });

  it("catches a step holding a key the contract no longer declares", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([["a"], ["b"], ["c", "retired_key"]]),
    });
    expect(kinds(defects)).toContain("step_holds_undeclared_question");
    expect(
      defects.find((defect) => defect.kind === "step_holds_undeclared_question")
        ?.subjects,
    ).toEqual(["retired_key"]);
  });

  it("catches a step left holding nothing", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([["a", "c"], [], ["b"]]),
    });
    expect(kinds(defects)).toContain("step_holds_no_question");
    expect(
      defects.find((defect) => defect.kind === "step_holds_no_question")
        ?.subjects,
    ).toEqual(["Step 2"]);
  });

  it("catches a grouping of the wrong length for the flow's step bar", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([["a", "b"], ["c"]]),
    });
    expect(kinds(defects)).toContain("step_count_off_flow_shape");
  });

  it("catches a grouping that only covered the contract after repair", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([["a"], ["b"], ["c"]], {
        basis: "repaired",
        droppedKeys: ["retired_key"],
        appendedKeys: ["c"],
      }),
    });
    expect(kinds(defects)).toContain("grouping_did_not_anticipate_contract");
    expect(
      defects.find(
        (defect) => defect.kind === "grouping_did_not_anticipate_contract",
      )?.subjects,
    ).toEqual(["dropped retired_key", "appended c"]);
  });

  it("accepts the variant basis, which is an anticipated grouping", () => {
    expect(
      auditCaptureStepPlan({
        ...clean,
        plan: plan([["a"], ["b"], ["c"]], { basis: "variant" }),
      }),
    ).toEqual([]);
  });

  // The latent loss in `repair`: with no grouping to repair there is no last
  // step to append to, so every declared question is reported as appended and
  // held by nothing. Unreachable through the product today — the route parser
  // rejects a phase outside 0-5 before a page renders — so this is the
  // mechanism pinned, not a live break.
  it("catches an empty grouping as every question reaching no step", () => {
    const defects = auditCaptureStepPlan({
      ...clean,
      plan: plan([], {
        basis: "repaired",
        appendedKeys: ["a", "b", "c"],
      }),
    });
    expect(kinds(defects)).toContain("question_in_no_step");
    expect(
      defects.find((defect) => defect.kind === "question_in_no_step")?.subjects,
    ).toEqual(["a", "b", "c"]);
    expect(kinds(defects)).toContain("step_count_off_flow_shape");
  });
});

describe("describeCaptureStepPlanDefects", () => {
  it("names the phase, the route configuration and the drift", () => {
    const defects = auditCaptureStepPlan({
      phase: 3,
      routeLabel: "technical_product · workflow none · role none",
      sections: [section("a"), section("b"), section("c")],
      plan: plan([["a"], ["b"], []]),
    });
    const described = describeCaptureStepPlanDefects(defects);
    expect(described).toContain("P3");
    expect(described).toContain("technical_product · workflow none · role none");
    expect(described).toContain("question_in_no_step");
    expect(described).toContain("c");
  });
});

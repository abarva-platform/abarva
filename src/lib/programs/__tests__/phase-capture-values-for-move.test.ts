import {
  PHASE_CAPTURE_PHASES,
  phaseCaptureModuleValueReader,
  phaseCaptureValuesByPhase,
  resolveMoveConfirmedSolutionRoute,
} from "../phase-capture-values-for-move";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "../phase-capture-contract";
import {
  buildAvaPhaseInputProposals,
  describeAvaPhaseInputDraftRefusal,
} from "../phase-input-draft-proposals";
import type { ConfirmedSolutionRoute } from "../solution-route-assessment";

const BUSINESS_CHANGE_ASSESSMENT = {
  expectedWorkflowChange: "none",
  expectedRoleAccountabilityChange: "none",
  adoptionOwner: "Business analytics lead",
  adoptionResponsibility: "business",
  evidenceReference: "P1 operating-owner interview",
  validatedBy: "Business sponsor",
} as const;

const P2_EVIDENCE_ID = "evidence-p2-1";

/** A P2 route validation that resolves to the `technical_product` route. */
const TECHNICAL_PRODUCT_VALIDATION = JSON.stringify({
  businessChangeAssessmentSnapshot: BUSINESS_CHANGE_ASSESSMENT,
  solutionOutput: "reports_dashboards",
  workflowChange: "none",
  roleAccountabilityChange: "none",
  evidenceReference: P2_EVIDENCE_ID,
  decision: "confirm",
  selectedRoute: "technical_product",
  correctionRationale: "",
  validatedBy: "Business sponsor",
});

/** Module-state rows in the shape `getModuleState` returns them. */
function moduleRows(
  values: Record<number, Record<string, string>>,
): Array<{ moduleKey: string; state: Record<string, unknown> }> {
  return Object.entries(values).flatMap(([phase, byKey]) =>
    Object.entries(byKey).map(([sectionKey, value]) => ({
      moduleKey: phaseCaptureModuleKey(Number(phase), sectionKey),
      state: { value },
    })),
  );
}

/** Every section a phase declares, answered. */
function answeredSections(
  phase: number,
  route: ConfirmedSolutionRoute | null = null,
): Record<string, string> {
  return Object.fromEntries(
    getPhaseCaptureSections(phase, route).map((section) => [
      section.key,
      `${section.label} captured`,
    ]),
  );
}

function routedMove(): {
  moduleValue: (phase: number, key: string) => string;
  route: ConfirmedSolutionRoute;
} {
  const moduleValue = phaseCaptureModuleValueReader(
    moduleRows({
      1: { business_change_assessment: JSON.stringify(BUSINESS_CHANGE_ASSESSMENT) },
      2: { solution_route_validation: TECHNICAL_PRODUCT_VALIDATION },
    }),
  );
  const route = resolveMoveConfirmedSolutionRoute(moduleValue, [P2_EVIDENCE_ID]);
  if (!route) throw new Error("fixture does not resolve a route");
  return { moduleValue, route };
}

describe("resolveMoveConfirmedSolutionRoute", () => {
  it("resolves the route from the Move's own P1 + P2 captures", () => {
    expect(routedMove().route.route).toBe("technical_product");
  });

  it("resolves nothing until the route validation's evidence is approved", () => {
    const { moduleValue } = routedMove();
    expect(resolveMoveConfirmedSolutionRoute(moduleValue, [])).toBeNull();
    expect(
      resolveMoveConfirmedSolutionRoute(moduleValue, ["some-other-evidence"]),
    ).toBeNull();
  });

  it("resolves nothing when P2 has not validated a route", () => {
    const moduleValue = phaseCaptureModuleValueReader(
      moduleRows({
        1: {
          business_change_assessment: JSON.stringify(BUSINESS_CHANGE_ASSESSMENT),
        },
      }),
    );
    expect(
      resolveMoveConfirmedSolutionRoute(moduleValue, [P2_EVIDENCE_ID]),
    ).toBeNull();
  });
});

describe("phaseCaptureModuleValueReader", () => {
  it("reads a non-string stored value as no answer, not as its coercion", () => {
    // Module state is untyped JSON from the data plane. A number, object or
    // boolean where a capture answer belongs is not an answer — coercing it
    // would make "0", "false" or "[object Object]" count as a filled field and
    // close a gate on it.
    const reader = phaseCaptureModuleValueReader([
      { moduleKey: phaseCaptureModuleKey(3, "controls_governance"), state: { value: 0 } },
      { moduleKey: phaseCaptureModuleKey(3, "architecture_integration"), state: { value: false } },
      { moduleKey: phaseCaptureModuleKey(3, "evidence_confidence"), state: { value: { note: "x" } } },
      { moduleKey: phaseCaptureModuleKey(3, "solution_approach"), state: {} },
    ]);
    expect(reader(3, "controls_governance")).toBe("");
    expect(reader(3, "architecture_integration")).toBe("");
    expect(reader(3, "evidence_confidence")).toBe("");
    expect(reader(3, "solution_approach")).toBe("");
  });

  it("returns no answer for a section nothing stored", () => {
    expect(phaseCaptureModuleValueReader([])(3, "solution_approach")).toBe("");
  });
});

describe("phaseCaptureValuesByPhase — the keys the Move was asked for", () => {
  it("reads P3 against the route's own section set, not the default list", () => {
    const { moduleValue, route } = routedMove();
    const keysOf = (r: ConfirmedSolutionRoute | null) =>
      Object.keys(
        phaseCaptureValuesByPhase({
          moduleValue,
          confirmedSolutionRoute: r,
        })[3] ?? {},
      );

    // The route declares `business_change_boundary` and drops the
    // operating-model and process-design questions. Reading the default list
    // hid the first and reported the other two as permanently unanswered.
    expect(keysOf(route)).toContain("business_change_boundary");
    expect(keysOf(route)).not.toContain("operating_model");
    expect(keysOf(route)).not.toContain("process_design");

    // Unrouted is unchanged: the full default P3 set.
    expect(keysOf(null)).not.toContain("business_change_boundary");
    expect(keysOf(null)).toContain("operating_model");
    expect(keysOf(null)).toContain("process_design");
  });

  it("surfaces the route question's saved answer", () => {
    const { route } = routedMove();
    const moduleValue = phaseCaptureModuleValueReader(
      moduleRows({ 3: { business_change_boundary: "Named adoption owner" } }),
    );
    expect(
      phaseCaptureValuesByPhase({ moduleValue, confirmedSolutionRoute: route })[3]
        ?.business_change_boundary,
    ).toBe("Named adoption owner");
  });

  it("keeps an unanswered section present with an empty answer", () => {
    const moduleValue = phaseCaptureModuleValueReader([]);
    const values = phaseCaptureValuesByPhase({
      moduleValue,
      confirmedSolutionRoute: null,
    });
    for (const phase of PHASE_CAPTURE_PHASES) {
      const declared = getPhaseCaptureSections(phase).map((s) => s.key);
      expect(Object.keys(values[phase] ?? {})).toEqual(declared);
      expect(Object.values(values[phase] ?? {})).toEqual(declared.map(() => ""));
    }
  });

  it("covers every canonical phase, P0 through P5", () => {
    const moduleValue = phaseCaptureModuleValueReader([]);
    // Written out, not read off `PHASE_CAPTURE_PHASES`: an expectation derived
    // from the declaration under test cannot see the declaration shrink.
    expect(
      Object.keys(
        phaseCaptureValuesByPhase({ moduleValue, confirmedSolutionRoute: null }),
      ).map(Number),
    ).toEqual([0, 1, 2, 3, 4, 5]);
    expect([...PHASE_CAPTURE_PHASES]).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("phase-input draft assist — what is still open on a routed Move", () => {
  // Resolved per test, not at describe scope: a fixture that stops resolving
  // then reports as failing TESTS rather than a suite that cannot load.
  let route: ConfirmedSolutionRoute;
  beforeEach(() => {
    route = routedMove().route;
  });

  it("says nothing is empty once the route's own questions are answered", () => {
    const currentValues = answeredSections(3, route);
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 3,
        currentValues,
        upstreamValuesByPhase: {},
        confirmedSolutionRoute: route,
      }),
    ).toMatch(/already have current values/);
  });

  it("still reports an unanswered route question as open", () => {
    const currentValues = answeredSections(3, route);
    delete currentValues.business_change_boundary;
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 3,
        currentValues,
        upstreamValuesByPhase: {},
        confirmedSolutionRoute: route,
      }),
    ).not.toMatch(/already have current values/);
  });

  it("does not hold a complete routed P3 open on the questions the route dropped", () => {
    // The same complete answer set, read route-blind: `operating_model` and
    // `process_design` are absent because the route never asked for them, so a
    // route-blind read called a finished phase unfinished.
    const currentValues = answeredSections(3, route);
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 3,
        currentValues,
        upstreamValuesByPhase: {},
      }),
    ).not.toMatch(/already have current values/);
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 3,
        currentValues,
        upstreamValuesByPhase: {},
        confirmedSolutionRoute: route,
      }),
    ).toMatch(/already have current values/);
  });

  it("proposes nothing for a complete routed P3", () => {
    expect(
      buildAvaPhaseInputProposals({
        phase: 3,
        currentValues: answeredSections(3, route),
        upstreamValuesByPhase: {},
        confirmedSolutionRoute: route,
      }),
    ).toEqual([]);
  });

  it("leaves P1 drafting unchanged — P1 declares no route variants", () => {
    const p1 = answeredSections(1);
    delete p1.sponsor_commitment;
    const withRoute = buildAvaPhaseInputProposals({
      phase: 1,
      currentValues: p1,
      upstreamValuesByPhase: { 0: answeredSections(0) },
      confirmedSolutionRoute: route,
    });
    const withoutRoute = buildAvaPhaseInputProposals({
      phase: 1,
      currentValues: p1,
      upstreamValuesByPhase: { 0: answeredSections(0) },
    });
    // Non-vacuous: P1 really does propose here, and the route changes nothing.
    expect(withoutRoute.length).toBeGreaterThan(0);
    expect(withRoute).toEqual(withoutRoute);
  });
});

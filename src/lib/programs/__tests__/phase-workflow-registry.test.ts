import {
  KNOWN_CAPTURE_GAPS,
  resolveChangeProfile,
  resolvePhaseWorkflow,
  type ChangeProfile,
} from "@/lib/programs/phase-workflow-registry";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { phaseCanonicalKeysForRoute } from "@/lib/programs/deliverable-registry";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

function route(
  overrides: Partial<ConfirmedSolutionRoute>,
): ConfirmedSolutionRoute {
  return {
    route: "process_change",
    recommendation: "process_change",
    solutionOutput: "data_product",
    workflowChange: "limited",
    roleAccountabilityChange: "limited",
    adoptionOwner: "Data governance lead",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "evidence-1",
    validatedBy: "reviewer",
    rationale: "fixture",
    ...overrides,
  };
}

// Every route shape the capture contract distinguishes, with the profile it
// must resolve to. An unconfirmed route falls back to the full profile.
const CASES: Array<{
  name: string;
  route: ConfirmedSolutionRoute | null;
  profile: ChangeProfile;
}> = [
  { name: "no confirmed route", route: null, profile: "full" },
  {
    name: "technical product",
    route: route({
      route: "technical_product",
      workflowChange: "none",
      roleAccountabilityChange: "none",
    }),
    profile: "technical",
  },
  {
    name: "technical product with material change",
    route: route({
      route: "technical_product",
      workflowChange: "material",
      roleAccountabilityChange: "material",
    }),
    profile: "technical",
  },
  { name: "process change, limited", route: route({}), profile: "limited" },
  {
    name: "process change, no change",
    route: route({ workflowChange: "none", roleAccountabilityChange: "none" }),
    profile: "limited",
  },
  {
    name: "process change, material workflow",
    route: route({ workflowChange: "material" }),
    profile: "full",
  },
  {
    name: "process change, material role",
    route: route({ roleAccountabilityChange: "material" }),
    profile: "full",
  },
  {
    name: "operating model change",
    route: route({
      route: "operating_model_change",
      workflowChange: "limited",
    }),
    profile: "full",
  },
  {
    name: "combined change",
    route: route({
      route: "combined_change",
      workflowChange: "none",
      roleAccountabilityChange: "none",
    }),
    profile: "full",
  },
];

const keysOf = (phase: number, r: ConfirmedSolutionRoute | null) =>
  getPhaseCaptureSections(phase, r).map((s) => s.key);

const registryKeys = (phase: number, r: ConfirmedSolutionRoute | null) =>
  resolvePhaseWorkflow(phase, r).flatMap((step) => step.sectionKeys);

describe("resolveChangeProfile", () => {
  it.each(CASES)("$name resolves to $profile", ({ route: r, profile }) => {
    expect(resolveChangeProfile(r)).toBe(profile);
  });
});

describe("phase workflow registry reproduces today's capture contract", () => {
  it.each(CASES)(
    "P3, $name: the steps own exactly the captured keys",
    ({ route: r }) => {
      expect([...registryKeys(3, r)].sort()).toEqual([...keysOf(3, r)].sort());
    },
  );

  it.each(CASES)(
    "P2, $name: the steps own exactly the captured keys",
    ({ route: r }) => {
      expect([...registryKeys(2, r)].sort()).toEqual([...keysOf(2, r)].sort());
    },
  );

  it.each(CASES)("$name: no key is owned by two steps", ({ route: r }) => {
    for (const phase of [2, 3]) {
      const keys = registryKeys(phase, r);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it.each(CASES)(
    "$name: operating & adoption depth matches the capture variant",
    ({ route: r, profile }) => {
      const step = resolvePhaseWorkflow(3, r).find((s) => s.id === "P3.3");
      const expected = { technical: "skip", limited: "light", full: "full" }[
        profile
      ];
      expect(step?.depth).toBe(expected);
    },
  );
});

describe("the P3 document set reads the same change profile", () => {
  const DOCUMENTS: Record<ChangeProfile, string[]> = {
    technical: ["target_state_architecture", "requirements_traceability"],
    limited: [
      "target_state_architecture",
      "process_change_estimate_brief",
      "requirements_traceability",
    ],
    full: [
      "target_state_architecture",
      "solution_design",
      "operating_model_design",
      "requirements_traceability",
      "sourcing_strategy",
      "planning_workshop_guide",
    ],
  };

  it.each(CASES)("$name builds the $profile document set", ({ route: r, profile }) => {
    expect(phaseCanonicalKeysForRoute(3, r)).toEqual(DOCUMENTS[profile]);
  });

  it("leaves other phases on their canonical set whatever the route", () => {
    const technical = route({ route: "technical_product" });
    expect(phaseCanonicalKeysForRoute(2, technical)).toEqual(
      phaseCanonicalKeysForRoute(2, null),
    );
  });
});

describe("known capture gaps", () => {
  // A step that should capture something at its depth but owns no key. The
  // list is a ratchet: a new empty step fails here, and closing a gap means
  // removing its entry.
  const PROFILE_ROUTE: Record<ChangeProfile, ConfirmedSolutionRoute | null> = {
    technical: route({ route: "technical_product" }),
    limited: route({}),
    full: null,
  };

  it("lists exactly the steps that capture nothing at a non-skip depth", () => {
    const found: string[] = [];
    for (const profile of ["technical", "limited", "full"] as ChangeProfile[]) {
      for (const phase of [2, 3]) {
        for (const step of resolvePhaseWorkflow(
          phase,
          PROFILE_ROUTE[profile],
        )) {
          if (step.depth !== "skip" && step.sectionKeys.length === 0) {
            found.push(`${step.id}:${profile}`);
          }
        }
      }
    }
    const declared = KNOWN_CAPTURE_GAPS.flatMap((gap) =>
      gap.profiles.map((profile) => `${gap.stepId}:${profile}`),
    );
    expect(found.sort()).toEqual(declared.sort());
  });

  it("a skipped step still leaves something on record", () => {
    for (const profile of ["technical", "limited", "full"] as ChangeProfile[]) {
      for (const step of resolvePhaseWorkflow(3, PROFILE_ROUTE[profile])) {
        if (step.depth === "skip")
          expect(step.sectionKeys.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("unmodelled phases", () => {
  it("returns no steps for a phase the registry does not model", () => {
    expect(resolvePhaseWorkflow(4, null)).toEqual([]);
  });
});

/**
 * Can a Move finish AFTER adaptive depth has removed documents from the build?
 *
 * `phase-gate-deliverable-reachability.test.ts` pins the join between what a
 * phase BUILDS (`phaseCanonicalKeysForRoute`) and what its HARD exit criteria
 * ACCEPT (the alias lists inside `evaluateGate`). That guard reads the DECLARED
 * build set, and its own header names the hazard it was written against as a
 * future one: "a pack that omits, say, the readiness-and-change plan would
 * silently make P4 un-exitable".
 *
 * An omission mechanism is already present. The generate-phase route resolves
 * `resolveAdaptiveDepth` and then filters the specs it enqueues through
 * `shouldGenerateArtifact`, which drops every key resolved `not_applicable` or
 * `merge_into_parent`. So the set that actually reaches the queue is strictly
 * smaller than the set the existing guard pins, and neither that guard nor
 * `gate-criterion-document-satisfiability.test.ts` mentions depth at all —
 * both were satisfiable-by-construction against a set the product no longer
 * builds verbatim.
 *
 * The failure this prevents is the same one the sibling guard exists for, and
 * it is the worst shape the product has: capture completes, every answer is
 * saved, the build reports success with the omitted documents listed as
 * deliberate, and the gate still refuses — with no control on screen that
 * could produce the missing document, because the route decided not to build
 * it. P3 and P4 enqueue their documents as a SEQUENTIAL chain, so one missing
 * document holds the rest of the phase behind it.
 *
 * It holds today — this suite passes on the current declarations. That is the
 * point: nothing asserted it, the two declarations sit in different files
 * (`adaptive-depth.ts` decides applicability; `governance.ts` decides what the
 * gate accepts) and neither mentions the other.
 *
 * Three joins are pinned, over every route shape the build path distinguishes
 * crossed with every complexity tier and the signal profiles that drive the
 * omissions:
 *
 *   J1  the post-depth set is never empty — the route answers 422
 *       `no_applicable_deliverables` when it is, which is a dead end for the
 *       phase rather than a smaller build;
 *   J2  every HARD deliverable-only exit criterion still has a document in the
 *       post-depth set that it accepts, including the route-specific keys
 *       `design_approved` requires ALL of; and
 *   J3  a `merge_into_parent` decision never names a parent the same filter
 *       omits — an absorbed brief whose parent is also gone has no home.
 *
 * The criterion/alias table is written out as literals rather than imported
 * from the sibling suite, for the reason the sibling states: an expectation
 * read off the module under test cannot see a drift in it. To stop the two
 * tables drifting from the real checks instead, every criterion here is also
 * asserted to still be declared `hard` for its phase in `governance.ts`.
 */
import { gateCriteriaForPhase } from "@/lib/programs/governance";
import { phaseCanonicalKeysForRoute } from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import {
  resolveAdaptiveDepth,
  shouldGenerateArtifact,
  type AdaptiveDepthSignals,
  type ComplexityTier,
} from "@/lib/deliverables/adaptive-depth";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/** A confirmed route carries more than its name; only these fields branch. */
function route(
  name: ConfirmedSolutionRoute["route"],
  change: ConfirmedSolutionRoute["workflowChange"],
): ConfirmedSolutionRoute {
  return {
    route: name,
    recommendation: name,
    solutionOutput: "workflow_automation",
    workflowChange: change,
    roleAccountabilityChange: change,
    adoptionOwner: "Named owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "EV-1",
    validatedBy: "reviewer@example.com",
    rationale: "Recorded for this fixture.",
  };
}

const ROUTES: ReadonlyArray<{
  label: string;
  value: ConfirmedSolutionRoute | null;
}> = [
  { label: "no confirmed route", value: null },
  { label: "technical product", value: route("technical_product", "none") },
  {
    label: "bounded process change",
    value: route("process_change", "limited"),
  },
  {
    label: "material process change",
    value: route("process_change", "material"),
  },
];

/**
 * Signal profiles, not hand-built decisions. `resolveAdaptiveDepth` takes
 * declared signals as a sanctioned input, so driving the sweep through them
 * exercises the real resolution rather than asserting against an applicability
 * map this suite wrote itself — which could state a combination no input
 * produces.
 *
 * The adversarial profile is the minimal one: every optional complexity signal
 * off and `declaredStraightforward` set. That is the profile that omits the
 * most documents, so it is the one most likely to omit a gate-required one.
 */
const SIGNAL_PROFILES: ReadonlyArray<{
  label: string;
  expectTier: ComplexityTier;
  signals: Partial<AdaptiveDepthSignals>;
}> = [
  {
    label: "minimal confirmed scope",
    expectTier: "straightforward",
    signals: {
      declaredStraightforward: true,
      businessProcessCount: 1,
      dataSourceCount: 1,
      analyticsCapabilityCount: 1,
      integrationPointCount: 0,
      uncertaintyEvidenceGapCount: 0,
      identityResolutionNeeded: false,
      platformNovelty: false,
      workflowChange: false,
      clinicalRegulatorySensitivity: false,
      modelAiComplexity: false,
      aiAgentComponent: false,
      realTimeRequirement: false,
      vendorSourcingDecision: false,
      operatingModelImpact: false,
      humanDecisionImpact: false,
    },
  },
  {
    label: "mid scope",
    expectTier: "standard",
    signals: {
      declaredStraightforward: false,
      businessProcessCount: 2,
      dataSourceCount: 3,
      analyticsCapabilityCount: 2,
      integrationPointCount: 2,
      workflowChange: true,
      operatingModelImpact: true,
    },
  },
  {
    label: "full scope",
    expectTier: "complex",
    signals: {
      declaredStraightforward: false,
      businessProcessCount: 6,
      dataSourceCount: 8,
      analyticsCapabilityCount: 5,
      integrationPointCount: 9,
      uncertaintyEvidenceGapCount: 4,
      identityResolutionNeeded: true,
      platformNovelty: true,
      workflowChange: true,
      clinicalRegulatorySensitivity: true,
      modelAiComplexity: true,
      aiAgentComponent: true,
      realTimeRequirement: true,
      vendorSourcingDecision: true,
      operatingModelImpact: true,
      humanDecisionImpact: true,
    },
  },
];

/**
 * HARD exit criteria with NO capture-text fallback, and the deliverable type
 * keys `evaluateGate` accepts for each. `routes` narrows an entry to the routes
 * on which the criterion is deliverable-only.
 */
const DELIVERABLE_ONLY_HARD_CRITERIA: ReadonlyArray<{
  fromPhase: number;
  criterion: string;
  aliases: readonly string[];
  routes?: readonly string[];
}> = [
  { fromPhase: 1, criterion: "charter_signed_off", aliases: ["charter"] },
  {
    fromPhase: 2,
    criterion: "discovery_report_signed_off",
    aliases: ["discovery_report", "discovery_synthesis", "discovery_findings"],
  },
  {
    fromPhase: 3,
    criterion: "design_approved",
    aliases: [
      "design_spec",
      "design",
      "design_brief",
      "solution_design",
      "operating_model_design",
      "target_state_architecture",
      "process_change_estimate_brief",
    ],
  },
  {
    fromPhase: 3,
    criterion: "requirements_design_outcome_trace",
    aliases: [
      "requirements_traceability",
      "requirements_design_outcome_trace",
      "traceability_matrix",
    ],
    routes: ["technical product", "bounded process change"],
  },
  {
    fromPhase: 4,
    criterion: "execution_roadmap_drafted",
    aliases: [
      "execution_roadmap",
      "execution_plan",
      "roadmap",
      "mobilization_roadmap",
    ],
  },
  {
    fromPhase: 4,
    criterion: "business_case_approved",
    aliases: [
      "business_case",
      "funding_business_case",
      "approval_business_case",
    ],
  },
  {
    fromPhase: 4,
    criterion: "readiness_and_change_plan_signed_off",
    aliases: [
      "change_management_plan",
      "business_readiness_plan",
      "readiness_and_change_plan",
    ],
  },
  {
    fromPhase: 5,
    criterion: "handoff_package_signed_off",
    aliases: [
      "handoff_package",
      "mobilization_handoff_package",
      "mobilization_package",
    ],
  },
  {
    fromPhase: 5,
    criterion: "value_measurement_contract_signed_off",
    aliases: [
      "value_measurement_contract",
      "benefits_realization_plan",
      "value_contract",
    ],
  },
];

/**
 * The route-specific keys `design_approved` requires ALL of. The other routes
 * accept any one of the design aliases; these two name exact documents, so
 * depth has to leave both standing.
 */
const DESIGN_APPROVED_REQUIRED_BY_ROUTE: Readonly<
  Record<string, readonly string[]>
> = {
  "technical product": ["target_state_architecture"],
  "bounded process change": [
    "target_state_architecture",
    "process_change_estimate_brief",
  ],
};

const PHASES = [1, 2, 3, 4, 5] as const;

/**
 * The post-depth enqueue set, resolved the way the generate-phase route
 * resolves it: both id spellings are offered to the resolver (the route passes
 * the registry key AND the orchestrator type), and the filter is applied on the
 * registry key, which is what the route filters its specs by.
 */
function postDepthKeys(
  declared: readonly string[],
  signals: Partial<AdaptiveDepthSignals>,
): { kept: string[]; decision: ReturnType<typeof resolveAdaptiveDepth> } {
  const decision = resolveAdaptiveDepth({
    archetype: "governed_data_foundation",
    signals,
    artifactKeys: [
      ...declared,
      ...declared.map((key) => orchestratorDeliverableType(key)),
    ],
  });
  return {
    kept: declared.filter((key) => shouldGenerateArtifact(decision, key)),
    decision,
  };
}

function declaredKeysFor(
  phase: number,
  confirmedRoute: ConfirmedSolutionRoute | null,
): string[] {
  return [
    ...(phaseCanonicalKeysForRoute(
      phase as Parameters<typeof phaseCanonicalKeysForRoute>[0],
      confirmedRoute as Parameters<typeof phaseCanonicalKeysForRoute>[1],
    ) ?? []),
  ] as string[];
}

describe("adaptive depth leaves every phase exitable", () => {
  it("still declares every pinned criterion as a hard exit criterion of its phase", () => {
    for (const entry of DELIVERABLE_ONLY_HARD_CRITERIA) {
      const match = gateCriteriaForPhase(entry.fromPhase)?.find(
        (c) => c.key === entry.criterion,
      );
      expect({
        phase: entry.fromPhase,
        criterion: entry.criterion,
        severity: match?.severity ?? "ABSENT",
      }).toEqual({
        phase: entry.fromPhase,
        criterion: entry.criterion,
        severity: "hard",
      });
    }
  });

  it("reaches all three complexity tiers from the swept signal profiles", () => {
    // Guards the sweep itself: profiles that all landed on one tier would make
    // every case below a single-tier test wearing a three-tier name.
    const tiers = SIGNAL_PROFILES.map((profile) => ({
      label: profile.label,
      tier: resolveAdaptiveDepth({
        archetype: "governed_data_foundation",
        signals: profile.signals,
      }).complexityTier,
    }));
    expect(tiers).toEqual(
      SIGNAL_PROFILES.map((profile) => ({
        label: profile.label,
        tier: profile.expectTier,
      })),
    );
  });

  describe.each(ROUTES)("on the $label route", ({ label, value }) => {
    describe.each(SIGNAL_PROFILES)("at $label", ({ signals }) => {
      it.each(PHASES)(
        "phase %i still enqueues at least one document",
        (phase) => {
          const declared = declaredKeysFor(phase, value);
          if (declared.length === 0) return;
          // J1 — an empty post-depth set is the route's 422
          // `no_applicable_deliverables`, which is a dead end for the phase.
          expect(postDepthKeys(declared, signals).kept).not.toHaveLength(0);
        },
      );

      it.each(PHASES)(
        "phase %i still builds a document every hard exit criterion accepts",
        (phase) => {
          const declared = declaredKeysFor(phase, value);
          if (declared.length === 0) return;
          const { kept } = postDepthKeys(declared, signals);
          const unsatisfiable = DELIVERABLE_ONLY_HARD_CRITERIA.filter(
            (entry) =>
              entry.fromPhase === phase &&
              (entry.routes ? entry.routes.includes(label) : true) &&
              // Only a criterion the DECLARED set could satisfy is in scope:
              // one no route builds for is the sibling guard's subject, not
              // depth's.
              declared.some((key) => entry.aliases.includes(key)) &&
              !kept.some((key) => entry.aliases.includes(key)),
          ).map((entry) => entry.criterion);
          expect(unsatisfiable).toEqual([]);
        },
      );

      it("phase 3 still builds every document its route requires ALL of", () => {
        const required = DESIGN_APPROVED_REQUIRED_BY_ROUTE[label];
        if (!required) return;
        const declared = declaredKeysFor(3, value);
        const { kept } = postDepthKeys(declared, signals);
        expect(
          required.filter(
            (key) => declared.includes(key) && !kept.includes(key),
          ),
        ).toEqual([]);
      });

      it.each(PHASES)(
        "phase %i never absorbs a document into a parent it also omits",
        (phase) => {
          const declared = declaredKeysFor(phase, value);
          if (declared.length === 0) return;
          const { kept, decision } = postDepthKeys(declared, signals);
          // J3 — `mergeInto` is stated only in the absorbed document's own
          // prompt, which is never built; a parent that is itself omitted
          // leaves the absorbed brief with no home at all.
          const orphaned = declared
            .filter((key) => !kept.includes(key))
            .map((key) => ({
              key,
              parent: decision.artifactApplicability[key]?.mergeInto,
            }))
            .filter(
              (entry) =>
                entry.parent !== undefined &&
                declared.includes(entry.parent) &&
                !kept.includes(entry.parent),
            );
          expect(orphaned).toEqual([]);
        },
      );
    });
  });
});

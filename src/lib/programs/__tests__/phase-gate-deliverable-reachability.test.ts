/**
 * Can a Move actually finish?
 *
 * Several phase-exit criteria are HARD and can be satisfied ONLY by a
 * `deliverables_v2` row of a specific type — they have no capture-text
 * fallback at all. For those, a phase is exitable only if that phase's
 * generation set actually produces a deliverable the criterion recognises.
 * If the two drift apart the product fails in the worst possible way: capture
 * completes, the build succeeds, every answer is saved, and the gate still
 * refuses — with nothing on screen that a user could do about it. The last two
 * phases are entirely made of such criteria, so a drift there means a Move can
 * never reach Tower.
 *
 * Nothing proved this held. `phaseCanonicalKeysForRoute` (what gets built) and
 * the criterion alias lists inside `evaluateGate` (what gets accepted) are in
 * different files, neither mentions the other, and both are actively edited —
 * the deliverable-type registry gained per-type table requirements, and the
 * archetype work is moving toward letting a configured artifact pack decide
 * what a Move produces. A pack that omits, say, the readiness-and-change plan
 * would silently make P4 un-exitable.
 *
 * So this pins the join. The alias lists are written out as literals on
 * purpose: reading them off the module under test would let a rename pass. To
 * stop the literals drifting from the real checks instead, each one is also
 * asserted to still appear in `governance.ts`, and each criterion is asserted
 * to still be declared `hard` for its phase.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { gateCriteriaForPhase } from "@/lib/programs/governance";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

const GOVERNANCE_SOURCE = readFileSync(
  path.join(process.cwd(), "src/lib/programs/governance.ts"),
  "utf8",
);

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

/**
 * Every route shape the build path distinguishes. `null` is the ordinary case
 * — a Move that has not confirmed a route yet still has to be able to exit its
 * phases, so it is a route under test, not an absence.
 */
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
 * HARD exit criteria with NO capture-text fallback, and the deliverable type
 * keys `evaluateGate` accepts for each. `routes` narrows the entry to the
 * routes on which the criterion is deliverable-only: the requirements trace
 * keeps a capture fallback on the material-process route, so only the two
 * routes that drop that fallback are pinned here.
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
 * accept any one of the design aliases, which the generic case already covers;
 * these two routes name exact documents, so both have to be built.
 */
const DESIGN_APPROVED_REQUIRED_BY_ROUTE: ReadonlyArray<{
  label: string;
  requiredKeys: readonly string[];
}> = [
  { label: "technical product", requiredKeys: ["target_state_architecture"] },
  {
    label: "bounded process change",
    requiredKeys: [
      "target_state_architecture",
      "process_change_estimate_brief",
    ],
  },
];

describe("phase gate deliverable reachability", () => {
  it("still declares every pinned criterion as a hard exit criterion of its phase", () => {
    for (const entry of DELIVERABLE_ONLY_HARD_CRITERIA) {
      const criteria = gateCriteriaForPhase(entry.fromPhase);
      expect(criteria).not.toBeNull();
      const match = criteria?.find((c) => c.key === entry.criterion);
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

  it("keeps every pinned alias spelled the same way in the gate evaluator", () => {
    // A rename in governance.ts would otherwise leave this file asserting a
    // join against keys the evaluator no longer accepts.
    for (const entry of DELIVERABLE_ONLY_HARD_CRITERIA) {
      for (const alias of entry.aliases) {
        expect({
          criterion: entry.criterion,
          alias,
          presentInGovernance: GOVERNANCE_SOURCE.includes(`"${alias}"`),
        }).toEqual({
          criterion: entry.criterion,
          alias,
          presentInGovernance: true,
        });
      }
    }
  });

  it("builds a deliverable that satisfies every deliverable-only hard criterion, on every route", () => {
    const unreachable: string[] = [];
    for (const entry of DELIVERABLE_ONLY_HARD_CRITERIA) {
      for (const r of ROUTES) {
        if (entry.routes && !entry.routes.includes(r.label)) continue;
        const built = phaseCanonicalKeysForRoute(entry.fromPhase, r.value);
        if (!entry.aliases.some((alias) => built.includes(alias))) {
          unreachable.push(
            `P${entry.fromPhase} ${entry.criterion} on "${r.label}": builds [${built.join(", ")}], accepts [${entry.aliases.join(", ")}]`,
          );
        }
      }
    }
    expect(unreachable).toEqual([]);
  });

  it("builds every document the route-specific design approval requires all of", () => {
    for (const expected of DESIGN_APPROVED_REQUIRED_BY_ROUTE) {
      const r = ROUTES.find((candidate) => candidate.label === expected.label);
      expect(r).toBeDefined();
      const built = phaseCanonicalKeysForRoute(3, r?.value ?? null);
      for (const key of expected.requiredKeys) {
        expect({
          route: expected.label,
          key,
          built: built.includes(key),
        }).toEqual({ route: expected.label, key, built: true });
      }
    }
  });

  it("names a registered deliverable type, at that phase, for every canonical key", () => {
    // Derived, not literal: a typo or a key whose registry entry moved phase
    // would generate nothing, so no gate reading it could ever pass.
    const misregistered: string[] = [];
    for (const [phaseKey, keys] of Object.entries(PHASE_CANONICAL_KEYS)) {
      const phase = Number(phaseKey);
      for (const key of keys) {
        const spec = DELIVERABLE_REGISTRY.find(
          (candidate) => candidate.deliverableTypeKey === key,
        );
        if (!spec) {
          misregistered.push(`P${phase} ${key}: not in DELIVERABLE_REGISTRY`);
          continue;
        }
        if (spec.phase !== phase) {
          misregistered.push(
            `P${phase} ${key}: registered at phase ${spec.phase}`,
          );
        }
      }
    }
    expect(misregistered).toEqual([]);
  });
});

/**
 * Can the gate SEE the documents the Move builds?
 *
 * `phase-gate-deliverable-reachability.test.ts` asks the other half of this
 * question: for every HARD criterion that can be satisfied only by a
 * deliverable, does the phase's generation set build something the criterion
 * accepts? That one protects against a Move that cannot advance.
 *
 * This one protects against the quieter failure. A deliverable type declared
 * `gateArtifact: true` is, by its own registry entry, "a formal gate criterion
 * artifact" — the product builds it, lands it in `deliverables_v2`, and asks a
 * user to sign it off so a gate can read it. If no criterion in
 * `governance.ts` names that key, nothing goes red: the Move still advances,
 * because the criteria that cover the same ground keep capture-text fallbacks.
 * What is lost is the basis. The gate reports a satisfied criterion because a
 * word appeared in free text, while the signed document that was built to
 * settle it was never consulted. On screen that is a ✓ next to a question the
 * product answered with vocabulary.
 *
 * That is exactly how `tower_metrics_plan` drifted. The criterion is spelled
 * `tower_metric_plan_drafted` and its lookup list carried `tower_metric_plan`
 * — singular, a key no registry entry, canonical phase set, or acceptance
 * route has ever written. The P4 Tower metrics plan generated on every route
 * was invisible to the only check that asks for it.
 *
 * The join is asserted against `governance.ts` source text rather than a
 * behavioural fixture on purpose: the point is coverage of the whole
 * `gateArtifact` set, and a per-key fixture would need a gate transition and a
 * signed row for each. The behavioural proof for the key this test was written
 * over lives in `governance-evaluate-gates.test.ts`. Source text makes the
 * assertion cheap enough to cover every key, and the two tests fail together
 * if the evaluator stops accepting a key it names.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DELIVERABLE_REGISTRY,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";

const GOVERNANCE_SOURCE = readFileSync(
  path.join(process.cwd(), "src/lib/programs/governance.ts"),
  "utf8",
);

/**
 * Written out as literals, not derived from the registry: reading the expected
 * set off the module under test would let a key that stopped being a gate
 * artifact, or a new one that nobody wired, pass unnoticed. Adding a
 * `gateArtifact: true` entry to the registry is meant to fail this list first.
 */
const EXPECTED_BUILT_GATE_ARTIFACTS: readonly string[] = [
  "charter",
  "discovery_report",
  "target_state_architecture",
  "process_change_estimate_brief",
  "requirements_traceability",
  "sourcing_strategy",
  "execution_roadmap",
  "business_case",
  "tower_metrics_plan",
  "readiness_and_change_plan",
  "handoff_package",
  "value_measurement_contract",
];

/**
 * Keys deliberately NOT named by any gate criterion, with the reason. An
 * exception has to be argued, not just listed — and it has to stay argued,
 * because the test fails if an exception becomes reachable and nobody removed
 * it from here.
 */
const DELIBERATELY_UNREAD: ReadonlyArray<{ key: string; because: string }> = [
  {
    key: "sourcing_strategy",
    because:
      "The nearest criterion, vendor_selection_approved, is scoped 'if applicable' and " +
      "passes when no vendor row exists. Teaching it to read the sourcing strategy would " +
      "turn a built-but-unsigned document into a new gate refusal, which is a product " +
      "decision about the P4 bar, not a drift to repair here.",
  },
];

/** Every route shape the build path distinguishes, including the ordinary none. */
const ROUTES = [
  null,
  {
    route: "technical_product",
    recommendation: "technical_product",
    solutionOutput: "reports_dashboards",
    workflowChange: "none",
    roleAccountabilityChange: "none",
    adoptionOwner: "Named owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "EV-1",
    validatedBy: "reviewer@example.com",
    rationale: "Recorded for this fixture.",
  },
  {
    route: "process_change",
    recommendation: "process_change",
    solutionOutput: "workflow_automation",
    workflowChange: "limited",
    roleAccountabilityChange: "limited",
    adoptionOwner: "Named owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "EV-1",
    validatedBy: "reviewer@example.com",
    rationale: "Recorded for this fixture.",
  },
  {
    route: "process_change",
    recommendation: "process_change",
    solutionOutput: "workflow_automation",
    workflowChange: "material",
    roleAccountabilityChange: "material",
    adoptionOwner: "Named owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "EV-1",
    validatedBy: "reviewer@example.com",
    rationale: "Recorded for this fixture.",
  },
] as const;

/** Keys the build path can produce for some phase on some route. */
function builtKeys(): Set<string> {
  const built = new Set<string>();
  for (let phase = 0; phase <= 5; phase += 1) {
    for (const route of ROUTES) {
      for (const key of phaseCanonicalKeysForRoute(
        phase,
        route as Parameters<typeof phaseCanonicalKeysForRoute>[1],
      )) {
        built.add(key);
      }
    }
  }
  return built;
}

describe("gate artifact visibility", () => {
  it("builds exactly the gate artifacts this test claims to cover", () => {
    const built = builtKeys();
    const declaredGateArtifacts = DELIVERABLE_REGISTRY.filter(
      (spec) => spec.gateArtifact && built.has(spec.deliverableTypeKey),
    ).map((spec) => spec.deliverableTypeKey);

    expect([...declaredGateArtifacts].sort()).toEqual(
      [...EXPECTED_BUILT_GATE_ARTIFACTS].sort(),
    );
  });

  it("names every built gate artifact somewhere in the gate evaluator", () => {
    const excused = new Set(DELIBERATELY_UNREAD.map((entry) => entry.key));
    const invisible = EXPECTED_BUILT_GATE_ARTIFACTS.filter(
      (key) =>
        !excused.has(key) && !GOVERNANCE_SOURCE.includes(`"${key}"`),
    );

    expect(invisible).toEqual([]);
  });

  it("keeps every excused key genuinely unread, so a stale excuse cannot hide", () => {
    // The mirror of the case above. If someone wires one of these up, the
    // argument recorded here is out of date and should be deleted rather than
    // left standing as a false claim about the product.
    for (const entry of DELIBERATELY_UNREAD) {
      expect({
        key: entry.key,
        readByEvaluator: GOVERNANCE_SOURCE.includes(`"${entry.key}"`),
      }).toEqual({ key: entry.key, readByEvaluator: false });
    }
  });

  it("still declares every excused key as a gate artifact the product builds", () => {
    // An excuse for a key that no longer exists, or is no longer a gate
    // artifact, is dead weight that would silently stop guarding anything.
    const built = builtKeys();
    for (const entry of DELIBERATELY_UNREAD) {
      const spec = DELIVERABLE_REGISTRY.find(
        (candidate) => candidate.deliverableTypeKey === entry.key,
      );
      expect({
        key: entry.key,
        gateArtifact: spec?.gateArtifact ?? false,
        built: built.has(entry.key),
      }).toEqual({ key: entry.key, gateArtifact: true, built: true });
    }
  });
});

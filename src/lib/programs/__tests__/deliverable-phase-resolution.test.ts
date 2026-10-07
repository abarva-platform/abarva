import {
  canonicalPhaseForDeliverableKey,
  type DeliverablePhaseSpec,
} from "@/lib/programs/deliverable-phase-resolution";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
} from "@/lib/programs/deliverable-registry";
import {
  orchestratorDeliverableType,
  phaseForOrchestratorDeliverableType,
} from "@/lib/programs/orchestrated-deliverable-map";
import { normalizeDeliverableKey } from "@/lib/ai/document-generation-policy";

const identity = (k: string) => k;

describe("canonicalPhaseForDeliverableKey", () => {
  it("resolves a key that only the orchestrator spelling carries", () => {
    const specs: DeliverablePhaseSpec[] = [
      { deliverableTypeKey: "handoff_package", phase: 5 },
    ];
    expect(
      canonicalPhaseForDeliverableKey({
        key: "handoff_pack",
        specs,
        normalize: identity,
        toOrchestratorType: () => "handoff_pack",
      }),
    ).toBe(5);
  });

  it("resolves a key that only the REGISTRY spelling carries", () => {
    // The case the orchestrator-only comparison returned null for.
    const specs: DeliverablePhaseSpec[] = [
      { deliverableTypeKey: "handoff_package", phase: 5 },
    ];
    expect(
      canonicalPhaseForDeliverableKey({
        key: "handoff_package",
        specs,
        normalize: identity,
        toOrchestratorType: () => "handoff_pack",
      }),
    ).toBe(5);
  });

  it("returns null for a key no spec carries under either spelling", () => {
    expect(
      canonicalPhaseForDeliverableKey({
        key: "not_a_deliverable",
        specs: [{ deliverableTypeKey: "charter", phase: 1 }],
        normalize: identity,
        toOrchestratorType: identity,
      }),
    ).toBeNull();
  });

  it("returns null for an empty key even when a spec would match it", () => {
    // A malformed spec is the only way the empty-key guard is observable: with
    // it removed, "" matches the empty spelling and is handed a phase.
    expect(
      canonicalPhaseForDeliverableKey({
        key: "",
        specs: [
          { deliverableTypeKey: "", phase: 2 },
          { deliverableTypeKey: "charter", phase: 1 },
        ],
        normalize: identity,
        toOrchestratorType: identity,
      }),
    ).toBeNull();
  });

  it("returns null when matching specs disagree about the phase", () => {
    // Not reachable in the shipped registry; the rule must still withhold a
    // phase, because the phase scopes which approved evidence reaches
    // generation and the wrong one would send the wrong scope.
    const specs: DeliverablePhaseSpec[] = [
      { deliverableTypeKey: "handoff_package", phase: 5 },
      { deliverableTypeKey: "handoff_pack", phase: 4 },
    ];
    expect(
      canonicalPhaseForDeliverableKey({
        key: "handoff_pack",
        specs,
        normalize: identity,
        toOrchestratorType: (k) =>
          k === "handoff_package" ? "handoff_pack" : k,
      }),
    ).toBeNull();
  });

  it("widening does not let one spec's two spellings count as a disagreement", () => {
    const specs: DeliverablePhaseSpec[] = [
      { deliverableTypeKey: "execution_roadmap", phase: 4 },
    ];
    for (const key of ["execution_roadmap", "roadmap"]) {
      expect(
        canonicalPhaseForDeliverableKey({
          key,
          specs,
          normalize: identity,
          toOrchestratorType: () => "roadmap",
        }),
      ).toBe(4);
    }
  });

  it("compares through the normalizer on the registry spelling", () => {
    expect(
      canonicalPhaseForDeliverableKey({
        key: "handoff_package",
        specs: [{ deliverableTypeKey: "  Handoff-Package  ", phase: 5 }],
        normalize: normalizeDeliverableKey,
        // Nothing to match on the orchestrator side, so only the normalized
        // registry spelling can resolve this.
        toOrchestratorType: () => "unrelated_type",
      }),
    ).toBe(5);
  });

  it("compares through the normalizer on the orchestrator spelling", () => {
    expect(
      canonicalPhaseForDeliverableKey({
        key: "handoff_pack",
        specs: [{ deliverableTypeKey: "handoff_package", phase: 5 }],
        normalize: normalizeDeliverableKey,
        toOrchestratorType: () => "  Handoff-Pack  ",
      }),
    ).toBe(5);
  });
});

describe("phaseForOrchestratorDeliverableType over the shipped registry", () => {
  // The five canonical keys whose registry and orchestrator spellings differ.
  // Every one of them returned null when passed its own registry key.
  const ALIASED_CANONICAL_KEYS: ReadonlyArray<[string, number]> = [
    ["operating_model_design", 3],
    ["execution_roadmap", 4],
    ["financial_model", 4],
    ["tower_metrics_plan", 4],
    ["handoff_package", 5],
  ];

  it("the five aliased keys are exactly the canonical keys whose spellings differ", () => {
    const differ = Object.values(PHASE_CANONICAL_KEYS)
      .flat()
      .filter((k) => orchestratorDeliverableType(k) !== k)
      .sort();
    expect(differ).toEqual(
      ALIASED_CANONICAL_KEYS.map(([k]) => k)
        .slice()
        .sort(),
    );
  });

  it.each(ALIASED_CANONICAL_KEYS)(
    "resolves the registry key %s to P%i",
    (registryKey, phase) => {
      expect(phaseForOrchestratorDeliverableType(registryKey)).toBe(phase);
    },
  );

  it.each(ALIASED_CANONICAL_KEYS)(
    "resolves the orchestrator spelling of %s to P%i",
    (registryKey, phase) => {
      expect(
        phaseForOrchestratorDeliverableType(
          orchestratorDeliverableType(registryKey),
        ),
      ).toBe(phase);
    },
  );

  it("resolves every canonical key under both spellings to its declared phase", () => {
    for (const [phase, keys] of Object.entries(PHASE_CANONICAL_KEYS)) {
      for (const key of keys) {
        expect([key, phaseForOrchestratorDeliverableType(key)]).toEqual([
          key,
          Number(phase),
        ]);
        expect([
          key,
          phaseForOrchestratorDeliverableType(orchestratorDeliverableType(key)),
        ]).toEqual([key, Number(phase)]);
      }
    }
  });

  it("introduces no phase ambiguity across every key the registry can produce", () => {
    // Both spellings of every spec, deprecated ones included: each must still
    // resolve exactly one phase, or the widening has made a key unresolvable
    // that the orchestrator-only rule answered.
    const inputs = new Set<string>();
    for (const spec of DELIVERABLE_REGISTRY) {
      inputs.add(spec.deliverableTypeKey);
      inputs.add(orchestratorDeliverableType(spec.deliverableTypeKey));
    }
    const unresolved = [...inputs].filter(
      (key) => phaseForOrchestratorDeliverableType(key) === null,
    );
    expect(unresolved).toEqual([]);
  });

  it("still returns null for a key the registry does not carry", () => {
    expect(phaseForOrchestratorDeliverableType("not_a_deliverable")).toBeNull();
  });
});

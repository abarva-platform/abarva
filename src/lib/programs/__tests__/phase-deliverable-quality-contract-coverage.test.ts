// Every deliverable a Moves phase can GENERATE must be covered by the
// Deliverable Quality Contract.
//
// `persistDeliverable` (src/lib/deliverables/orchestrator/persistence.ts) runs
// the contract as a blocking gate before persistence — but only inside
// `if (contractDeliverableKey)`. That key is resolved from the profile registry:
//
//   qualityContractDeliverableKey({ registryKey, orchestratorDeliverableType })
//
// A generatable key that resolves NEITHER skips the contract silently, and the
// skip is indistinguishable downstream from a pass: `quarantined` stays false
// and `quarantineReason` stays null, so an unassessed document is served as
// client-ready. The failure direction is the unsafe one, which is why this is a
// totality guard rather than a per-key example.
//
// The same resolution decides whether the generation prompt is even TOLD which
// exhibits the contract will look for (`requiredExhibitsInstruction` returns ""
// when the orchestrator type resolves no profile), so both halves are pinned:
// an entry added to one map and not the other would ask for exhibits nothing
// checks, or check exhibits nothing asked for.
//
// Enumerated over every route shape `phaseCanonicalKeysForRoute` branches on,
// because the P3 build set is route-dependent: `process_change_estimate_brief`
// is reachable ONLY on the bounded process-change route, and it was one of the
// two keys this guard first caught.

import {
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import {
  deliverableKeyForOrchestratorType,
  qualityContractDeliverableKey,
} from "@/lib/deliverables/quality/deliverable-key-map";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

type ChangeImpact = ConfirmedSolutionRoute["workflowChange"];

const CHANGE_IMPACTS: ChangeImpact[] = ["material", "limited", "none"];

/** Every route shape the build-set resolver branches on, not just the default. */
function everyRouteShape(): Array<ConfirmedSolutionRoute | null> {
  const shapes: Array<ConfirmedSolutionRoute | null> = [null];
  for (const route of ["technical_product", "process_change"] as const) {
    for (const workflowChange of CHANGE_IMPACTS) {
      for (const roleAccountabilityChange of CHANGE_IMPACTS) {
        shapes.push({
          route,
          workflowChange,
          roleAccountabilityChange,
        } as ConfirmedSolutionRoute);
      }
    }
  }
  return shapes;
}

/** Union of every key any phase can request, on any route. */
function everyGeneratableKey(): string[] {
  const keys = new Set<string>();
  for (const phase of [1, 2, 3, 4, 5]) {
    for (const shape of everyRouteShape()) {
      for (const key of phaseCanonicalKeysForRoute(phase, shape)) {
        keys.add(key);
      }
    }
  }
  return [...keys].sort();
}

/**
 * The same function `persistDeliverable` calls to decide whether to assess —
 * imported, not re-derived, so a change to that chain reaches this guard.
 */
function contractKeyFor(registryKey: string) {
  return qualityContractDeliverableKey({
    registryKey,
    orchestratorDeliverableType: orchestratorDeliverableType(registryKey),
  });
}

describe("every generatable Moves phase deliverable is quality-assessed", () => {
  it("enumerates the build sets without collapsing to the default route", () => {
    const keys = everyGeneratableKey();
    // The default sets alone miss the route-only keys; if this stops being
    // true the enumeration above has silently narrowed.
    const defaultKeys = new Set(
      [1, 2, 3, 4, 5].flatMap((phase) => PHASE_CANONICAL_KEYS[phase] ?? []),
    );
    const routeOnly = keys.filter((key) => !defaultKeys.has(key));
    expect(routeOnly).toEqual(["process_change_estimate_brief"]);
    expect(keys.length).toBeGreaterThanOrEqual(21);
  });

  it("resolves a quality-contract key for every generatable key", () => {
    const unassessed = everyGeneratableKey().filter(
      (key) => contractKeyFor(key) === undefined,
    );
    // Listing the keys, not a count: a failure must name what goes unassessed.
    expect(unassessed).toEqual([]);
  });

  it("resolves a profile from the ORCHESTRATOR type, so the generation prompt can state the contract's exhibits", () => {
    const unprompted = everyGeneratableKey().filter(
      (key) =>
        deliverableKeyForOrchestratorType(
          orchestratorDeliverableType(key),
        ) === undefined,
    );
    expect(unprompted).toEqual([]);
  });

  it("gives every generatable key a profile with declared exhibits and acceptance checks", () => {
    for (const key of everyGeneratableKey()) {
      const contractKey = contractKeyFor(key);
      expect(contractKey).toBeDefined();
      const profile = DELIVERABLE_PROFILES[contractKey!];
      expect(profile).toBeDefined();
      expect(Array.isArray(profile.requiredExhibits)).toBe(true);
      expect(profile.acceptanceChecks.length).toBeGreaterThan(0);
    }
  });

  // For every generatable key BOTH arms of the resolver happen to answer the
  // same profile, so removing either one changes nothing an enumeration over
  // those keys can observe. These two cases discriminate the arms directly, so
  // the precedence and the fallback are each pinned by something.
  it("prefers the registry key's profile over the orchestrator type's", () => {
    expect(
      qualityContractDeliverableKey({
        registryKey: "charter",
        orchestratorDeliverableType: "discovery_plan",
      }),
    ).toBe("charter");
  });

  it("falls back to the orchestrator type when no registry key is passed", () => {
    // `roadmap` is the orchestrator's name for execution_roadmap; a caller that
    // passes no registry key has only this arm.
    expect(
      qualityContractDeliverableKey({
        orchestratorDeliverableType: "roadmap",
      }),
    ).toBe("execution_roadmap");
    expect(
      qualityContractDeliverableKey({
        registryKey: null,
        orchestratorDeliverableType: "handoff_pack",
      }),
    ).toBe("handoff_package");
  });

  it("covers both P3 gate artifacts that the contract used to skip", () => {
    // Named explicitly: these two are the reason the guard exists, and both
    // back a HARD P3 criterion (`design_approved` on the bounded
    // process-change route, and `requirements_design_outcome_trace`).
    for (const key of [
      "requirements_traceability",
      "process_change_estimate_brief",
    ]) {
      expect(contractKeyFor(key)).toBe(key);
      expect(
        deliverableKeyForOrchestratorType(orchestratorDeliverableType(key)),
      ).toBe(key);
      // A profile with no exhibits would resolve, run the contract's prose
      // dimensions, and still tell the generation pass nothing — so the
      // table-led exhibit each registry spec's own sections name is asserted.
      const profile = DELIVERABLE_PROFILES[contractKeyFor(key)!];
      expect(profile.requiredExhibits.length).toBeGreaterThan(0);
      expect(profile.visualRendererRequired ?? false).toBe(false);
    }
  });
});

// The editable companion's phase must come from what the generation request
// DECLARED, not from a second derivation over the deliverable key.
//
// Why this is worth pinning: the key derivation answers nothing for a key the
// registry does not carry, and the registry declares no phase 0, so the old
// `?? 0` made "no phase resolved" indistinguishable from Originate — which the
// phase page selects on by exact equality. These cases assert BOTH halves of the
// result (the value and the basis) so a mutation that keeps one and drops the
// other is killed.

import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import {
  resolveGeneratedCompanionPhase,
  UNRESOLVED_COMPANION_PHASE,
} from "../generated-companion-phase";

const registryKeys = DELIVERABLE_REGISTRY.map((s) => s.deliverableTypeKey);

describe("resolveGeneratedCompanionPhase", () => {
  it("takes the declared phase over the key's registry phase", () => {
    // `charter` is a P1 registry key; a run declared at P2 is filed at P2.
    expect(
      resolveGeneratedCompanionPhase({
        declaredPhase: 2,
        deliverableTypeKey: "charter",
      }),
    ).toEqual({ phase: 2, basis: "declared" });
  });

  it("derives the phase from the registry when the request declared none", () => {
    expect(
      resolveGeneratedCompanionPhase({ deliverableTypeKey: "charter" }),
    ).toEqual({ phase: 1, basis: "registry_key" });
    expect(
      resolveGeneratedCompanionPhase({ deliverableTypeKey: "handoff_package" }),
    ).toEqual({ phase: 5, basis: "registry_key" });
  });

  it("reports an unresolved phase as unresolved, not as Originate", () => {
    // A profiled key the registry does not carry. The VALUE is unchanged from the
    // prior fallback; the basis is what stops it reading back as a real P0.
    const resolved = resolveGeneratedCompanionPhase({
      deliverableTypeKey: "source_rfp_package",
    });
    expect(resolved.basis).toBe("unresolved");
    expect(resolved.phase).toBe(0);
    expect(UNRESOLVED_COMPANION_PHASE).toBe(0);
    // The registry declares no phase 0, so "unresolved" is the only way this
    // value can be produced by a key derivation.
    expect(DELIVERABLE_REGISTRY.some((s) => s.phase === 0)).toBe(false);
  });

  it("declares a phase of 0 on its own authority", () => {
    // P0 Originate is declarable even though no registry key carries it, so a
    // declared 0 must read as `declared`, never as the unresolved fallback.
    expect(
      resolveGeneratedCompanionPhase({
        declaredPhase: 0,
        deliverableTypeKey: "source_rfp_package",
      }),
    ).toEqual({ phase: 0, basis: "declared" });
  });

  it.each([
    ["above the canonical range", 6],
    ["below the canonical range", -1],
    ["not an integer", 2.5],
    ["null", null],
    ["undefined", undefined],
  ])(
    "ignores a declared phase that is %s and falls back to the key",
    (_label, declaredPhase) => {
      expect(
        resolveGeneratedCompanionPhase({
          declaredPhase: declaredPhase as number | null | undefined,
          deliverableTypeKey: "discovery_report",
        }),
      ).toEqual({ phase: 2, basis: "registry_key" });
    },
  );

  it("resolves a non-zero phase for every registry key", () => {
    // Guards the fallback arm: if a registry entry ever carried phase 0, the
    // `unresolved` sentinel would stop being distinguishable from it.
    for (const key of registryKeys) {
      const resolved = resolveGeneratedCompanionPhase({
        deliverableTypeKey: key,
      });
      expect(resolved.basis).toBe("registry_key");
      expect(resolved.phase).toBeGreaterThan(0);
    }
  });

  it("has profiled keys outside the registry, so the unresolved arm is not vacuous", () => {
    const profileOnly = Object.keys(DELIVERABLE_PROFILES).filter(
      (key) => !registryKeys.includes(key),
    );
    expect(profileOnly.length).toBeGreaterThan(0);
    for (const key of profileOnly) {
      expect(
        resolveGeneratedCompanionPhase({ deliverableTypeKey: key }).basis,
      ).toBe("unresolved");
    }
  });
});

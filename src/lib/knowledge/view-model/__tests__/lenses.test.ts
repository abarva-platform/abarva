/**
 * The nine airline lenses — proves the exact id set and the resolution logic.
 * See VIEW_MODEL_ASSEMBLER_INTERFACES.md §2 for the provenance note: 7 of
 * these 9 come directly from the task brief; 2 are placeholders pending
 * confirmation against the real prototype (not present in this repo).
 */

import {
  AIRLINE_LENSES,
  AIRLINE_LENS_DEFINITIONS,
  resolveAirlineLenses,
} from "../lenses";
import { KNOWLEDGE_LENSES } from "../../consumption-contracts";

describe("AIRLINE_LENSES", () => {
  it("is exactly the 9 lens ids named in the reconciliation report", () => {
    expect([...AIRLINE_LENSES].sort()).toEqual(
      [
        "understand",
        "irops_disruption_recovery",
        "crew",
        "baggage",
        "loyalty",
        "revenue",
        "mro",
        "network_scheduling",
        "safety_compliance",
      ].sort(),
    );
    expect(AIRLINE_LENSES.length).toBe(9);
  });

  it("every lens definition maps to a real, valid KnowledgeLens value", () => {
    for (const lens of AIRLINE_LENS_DEFINITIONS) {
      expect(KNOWLEDGE_LENSES).toContain(lens.nearestRealLens);
    }
  });

  it("every lens definition has at least one primary domain key", () => {
    for (const lens of AIRLINE_LENS_DEFINITIONS) {
      expect(lens.primaryDomainKeys.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveAirlineLenses", () => {
  it("marks a lens resolved only when one of its primary domain keys is in the available set", () => {
    const resolved = resolveAirlineLenses(new Set(["technology"]));
    const crew = resolved.find((l) => l.lensId === "crew");
    expect(crew?.resolved).toBe(true);
    const revenue = resolved.find((l) => l.lensId === "revenue");
    // revenue's primaryDomainKeys are ["enterprise", "data"] — neither is "technology".
    expect(revenue?.resolved).toBe(false);
  });

  it("marks every lens unresolved when the available set is empty", () => {
    const resolved = resolveAirlineLenses(new Set());
    expect(resolved.every((l) => l.resolved === false)).toBe(true);
    expect(resolved.length).toBe(9);
  });

  it("marks every lens resolved when every domain is available", () => {
    const allDomains = new Set(
      AIRLINE_LENS_DEFINITIONS.flatMap((l) => l.primaryDomainKeys),
    );
    const resolved = resolveAirlineLenses(allDomains);
    expect(resolved.every((l) => l.resolved === true)).toBe(true);
  });
});

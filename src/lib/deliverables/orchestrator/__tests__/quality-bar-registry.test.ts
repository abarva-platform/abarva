// Per-artifact-type depth bands: the range replaces "one floor for every type,
// no ceiling anywhere" with a phase-appropriate band, and a concise artifact
// (Charter) enforces its ceiling while a substantial one (Target State
// Architecture) only warns on it.

import { resolveQualityBar } from "../quality-bar-registry";

describe("resolveQualityBar", () => {
  it("gives the Charter a real ceiling that BLOCKS export", () => {
    const qb = resolveQualityBar("moves", "charter");
    expect(qb.targetBodyWordsMax).toBeDefined();
    expect(qb.enforceMaxAsBlocker).toBe(true);
    // the Charter's whole point is staying concise — its band must be
    // materially smaller than the architecture doc's.
    expect(qb.targetBodyWordsMax!).toBeLessThan(4_000);
  });

  it("gives Target State Architecture a substantial band whose ceiling only WARNS", () => {
    const qb = resolveQualityBar("moves", "target_state_architecture");
    expect(qb.minBodyWords).toBeGreaterThanOrEqual(9_000);
    expect(qb.targetBodyWordsMax).toBeGreaterThan(qb.minBodyWords);
    expect(qb.enforceMaxAsBlocker).toBeFalsy();
    expect(qb.requiresCentralTension).toBe(true);
    expect(qb.requiresOptionsConsidered).toBe(true);
  });

  it("gives Business Case a narrative-spine requirement and a non-blocking ceiling", () => {
    const qb = resolveQualityBar("moves", "business_case");
    expect(qb.requiresCentralTension).toBe(true);
    expect(qb.requiresOptionsConsidered).toBe(true);
    expect(qb.requiresEvidenceGapsNoted).toBe(true);
    expect(qb.enforceMaxAsBlocker).toBeFalsy();
  });

  it("falls back to the shared default for an artifact type with no override", () => {
    const qb = resolveQualityBar("moves", "some_future_artifact_type");
    expect(qb.minSections).toBe(6);
    expect(qb.minBodyWords).toBe(600);
    expect(qb.targetBodyWordsMax).toBeUndefined();
  });

  it("does not cross-contaminate overrides across modules with the same deliverableType string", () => {
    // "business_case" only has a moves override; a hypothetical source-module
    // deliverable of the same name must not pick it up.
    const qb = resolveQualityBar("source", "business_case");
    expect(qb.minBodyWords).toBe(600);
    expect(qb.requiresCentralTension).toBeFalsy();
  });
});

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
    // 9 sections since the 2026-07-25 redesign (Discovery Preparation as its
    // own first-class section) — see shared/artifact-contracts.ts.
    expect(qb.minSections).toBe(9);
    // Aligned to the shared contract (src/lib/deliverables/shared/
    // artifact-contracts.ts) — reconciled 2026-07-25 to equal the target
    // range's own minimum, not a looser historical value.
    expect(qb.minBodyWords).toBe(900);
    expect(qb.targetBodyWordsMax!).toBe(1_300);
  });

  it("measures Charter length as prose only, so required tables do not consume the band", () => {
    const qb = resolveQualityBar("moves", "charter");
    expect(qb.excludeNonProseFromBody).toBe(true);
  });

  it("gives Target State Architecture a substantial band whose ceiling only WARNS", () => {
    const qb = resolveQualityBar("moves", "target_state_architecture");
    expect(qb.minBodyWords).toBeGreaterThanOrEqual(9_000);
    expect(qb.targetBodyWordsMax).toBeGreaterThan(qb.minBodyWords);
    expect(qb.enforceMaxAsBlocker).toBeFalsy();
    expect(qb.requiresCentralTension).toBe(true);
    expect(qb.requiresOptionsConsidered).toBe(true);
  });

  it("gives Business Case a narrative-spine requirement and a hard ceiling", () => {
    // Band re-set 2026-08-19 from 5,000-9,500 to 3,000-5,000. The deterministic
    // pricing and value model now owns every authoritative number, so the
    // document's job is the investment ARGUMENT, not carrying the financial
    // reasoning in prose. See P3_P4_WORD_BAND_CONTRACTS.business_case.
    const qb = resolveQualityBar("moves", "business_case");
    expect(qb.minSections).toBe(9);
    expect(qb.minBodyWords).toBe(3_000);
    expect(qb.targetBodyWordsMax).toBe(5_000);
    expect(qb.advisoryBandMax).toBe(5_800);
    expect(qb.requiresCentralTension).toBe(true);
    expect(qb.requiresOptionsConsidered).toBe(true);
    expect(qb.requiresEvidenceGapsNoted).toBe(true);
    expect(qb.enforceMaxAsBlocker).toBe(true);
  });

  it("measures Business Case length as prose only, so exhibits do not consume the band", () => {
    // The tighter band and prose-only counting are one change: tightening while
    // still counting tables would penalise the visual density this artifact is
    // supposed to have.
    expect(
      resolveQualityBar("moves", "business_case").excludeNonProseFromBody,
    ).toBe(true);
  });

  it("leaves every other artifact on whole-body counting", () => {
    for (const type of [
      "target_state_architecture",
      "solution_design",
      "roadmap",
      "discovery_report",
    ]) {
      expect(
        resolveQualityBar("moves", type).excludeNonProseFromBody,
      ).toBeUndefined();
    }
  });

  it("gives Root-Cause Worksheet a concise hard-blocking issue-tree band", () => {
    const qb = resolveQualityBar("moves", "root_cause_worksheet");
    expect(qb.minSections).toBe(5);
    expect(qb.minBodyWords).toBe(1_200);
    expect(qb.targetBodyWordsMax).toBe(3_200);
    expect(qb.enforceMaxAsBlocker).toBe(true);
    expect(qb.requiresCentralTension).toBe(true);
    expect(qb.requiresEvidenceGapsNoted).toBe(true);
  });

  it.each([
    ["solution_design", 8, 2_800, 5_200],
    ["operating_model_design", 8, 2_400, 4_600],
    ["sourcing_strategy", 7, 1_800, 3_600],
  ] as const)(
    "gives %s a right-sized hard-blocking band",
    (deliverableType, minSections, minBodyWords, targetBodyWordsMax) => {
      const qb = resolveQualityBar("moves", deliverableType);
      expect(qb.minSections).toBe(minSections);
      expect(qb.minBodyWords).toBe(minBodyWords);
      expect(qb.targetBodyWordsMax).toBe(targetBodyWordsMax);
      expect(qb.enforceMaxAsBlocker).toBe(true);
      expect(qb.requiresEvidenceGapsNoted).toBe(true);
    },
  );

  it("applies the P3 operating-model ceiling to the canonical orchestrator key", () => {
    const qb = resolveQualityBar("moves", "operating_model");
    expect(qb.minSections).toBe(8);
    expect(qb.targetBodyWordsMax).toBe(4_600);
    expect(qb.enforceMaxAsBlocker).toBe(true);
  });

  it.each([
    ["roadmap", 6, 5_000, 11_000],
    ["handoff_pack", 6, 5_000, 11_000],
    ["estimate_model", 6, 1_600, 4_200],
    ["value_model", 6, 1_800, 4_600],
    ["value_measurement_contract", 6, 1_800, 4_200],
  ] as const)(
    "gives %s a phase-close hard ceiling",
    (deliverableType, minSections, minBodyWords, targetBodyWordsMax) => {
      const qb = resolveQualityBar("moves", deliverableType);
      expect(qb.minSections).toBe(minSections);
      expect(qb.minBodyWords).toBe(minBodyWords);
      expect(qb.targetBodyWordsMax).toBe(targetBodyWordsMax);
      expect(qb.enforceMaxAsBlocker).toBe(true);
      expect(qb.requiresEvidenceGapsNoted).toBe(true);
    },
  );

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

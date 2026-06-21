import type { ExpertPack } from "./expert-pack";
import { healthcareRevenueCycleExpert } from "./packs/healthcare-revenue-cycle";
import {
  toExpertPackStoreRow,
  validateExpertPackCollection,
  validateExpertPackForStore,
} from "./store";

describe("ExpertPack store validation", () => {
  it("loads the healthcare revenue-cycle reference pack into retrievable index keys", () => {
    const validation = validateExpertPackForStore(healthcareRevenueCycleExpert);
    const row = toExpertPackStoreRow(healthcareRevenueCycleExpert);

    expect(validation.pass).toBe(true);
    expect(row.pack_id).toBe("xp.healthcare-provider.revenue-cycle");
    expect(row.industry).toBe("healthcare_provider");
    expect(row.function_key).toBe("revenue-cycle");
    expect(row.cross_cutting_domain).toBeNull();
    expect(row.gate_pass).toBe(true);
    expect(row.depth_counts.operatingMetrics).toBeGreaterThanOrEqual(10);
    expect(row.depth_counts.outputRecipes).toBeGreaterThanOrEqual(4);
    expect(row.pack_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a sub-bar pack before it can be indexed", () => {
    const subBarPack: ExpertPack = {
      ...healthcareRevenueCycleExpert,
      identity: {
        ...healthcareRevenueCycleExpert.identity,
        id: "xp.test.sub-bar",
        expertName: "Sub-Bar Test Expert",
      },
      domain: {
        ...healthcareRevenueCycleExpert.domain,
        operatingMetrics: [],
        painThemes: [],
        aiUseCaseArchetypes: [],
        referenceSolutionPatterns: [],
        evidenceAnchors: [],
      },
      diagnostics: {
        ...healthcareRevenueCycleExpert.diagnostics,
        discoveryQuestions: [],
        redFlags: [],
      },
      outputRecipes: [],
    };

    const validation = validateExpertPackForStore(subBarPack);
    const collection = validateExpertPackCollection([subBarPack]);

    expect(validation.pass).toBe(false);
    expect(validation.gateResult.blockerCount).toBeGreaterThan(0);
    expect(collection.rows).toHaveLength(0);
    expect(collection.invalid).toEqual([
      expect.objectContaining({
        packId: "xp.test.sub-bar",
        expertName: "Sub-Bar Test Expert",
      }),
    ]);
  });
});

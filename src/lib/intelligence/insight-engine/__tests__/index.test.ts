import { dedupeInsightsForUpsert } from "../index";

describe("dedupeInsightsForUpsert", () => {
  const baseInsight = {
    clientId: "client-1",
    tenantKey: "skyharbor-air",
    headline: "Baseline headline",
    soWhat: "Baseline so what",
    domain: "service",
    materiality: "medium" as const,
    derivedFromRecordIds: ["record-a"],
    derivedFromFactIds: ["fact-a"],
    ruleId: "sla-breach-worsening",
    evidence: "Baseline evidence",
    confidence: "medium" as const,
    freshnessStatus: "fresh" as const,
    lifecycleState: "active" as const,
    action: "Review",
    entityName: "Storage service",
    entityType: "service",
  };

  it("merges duplicate tenant/rule/entity insights before a batch upsert", () => {
    const result = dedupeInsightsForUpsert([
      baseInsight,
      {
        ...baseInsight,
        headline: "Higher severity headline",
        materiality: "high",
        confidence: "high",
        derivedFromRecordIds: ["record-a", "record-b"],
        derivedFromFactIds: ["fact-b"],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      headline: "Higher severity headline",
      materiality: "high",
      confidence: "high",
      derivedFromRecordIds: ["record-a", "record-b"],
      derivedFromFactIds: ["fact-a", "fact-b"],
    });
  });

  it("does not collapse insights without an entity name", () => {
    const result = dedupeInsightsForUpsert([
      { ...baseInsight, entityName: null },
      { ...baseInsight, entityName: null, headline: "Second anonymous insight" },
    ]);

    expect(result).toHaveLength(2);
  });
});

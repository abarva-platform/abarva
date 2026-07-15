import type {
  CanonicalFact,
  ContextPack,
  EvidenceRef,
} from "../../contracts";
import { buildTowerContextPackFields } from "../tower-context-pack-builder";

const evidence: EvidenceRef = {
  evidenceId: "evidence-1",
  tenantKey: "meridian-health",
  sourceLabel: "Finance actuals extract",
  sourceType: "metric_extract",
  authority: "authoritative",
  truthStatus: "active",
  confidence: 0.92,
  citationStatus: "citable",
};

function fact(overrides: Partial<CanonicalFact>): CanonicalFact {
  return {
    factId: "fact-1",
    tenantKey: "meridian-health",
    domain: "metrics_outcomes",
    subjectEntityId: "initiative-1",
    predicate: "measured_value",
    value: 12_000_000,
    valueType: "currency",
    evidenceRefs: [evidence],
    truthStatus: "active",
    confidence: "high",
    caveats: [],
    inferred: false,
    ...overrides,
  };
}

function contextPack(facts: CanonicalFact[]): ContextPack {
  return {
    tenantKey: "meridian-health",
    facts,
    metrics: facts.filter((item) => item.predicate === "metric"),
  } as ContextPack;
}

describe("Tower context pack builder", () => {
  it("maps existing v3 dimensions into the Tower context pack fields", () => {
    const fields = buildTowerContextPackFields(
      contextPack([
        fact({
          factId: "budget-fact",
          domain: "programs",
          predicate: "fy26_budget",
          value: 40_000_000,
        }),
        fact({
          factId: "risk-fact",
          domain: "risks_controls",
          predicate: "control_gap",
          value: "Outcome signoff missing",
          valueType: "string",
        }),
        fact({
          factId: "metric-fact",
          domain: "metrics_outcomes",
          predicate: "metric",
          value: "Cycle time",
          valueType: "string",
        }),
      ]),
    );

    expect(fields.sourceOfTruthPath).toBe("v3_enterprise_context_layer");
    expect(fields.projectionPath).toBe("path_a_derived_projection");
    expect(fields.v3SourceDimensions).toHaveLength(6);
    expect(
      fields.v3SourceDimensions.find((dimension) => dimension.dimensionKey === "08_spend_value")?.recordCount,
    ).toBe(1);
    expect(
      fields.v3SourceDimensions.find((dimension) => dimension.dimensionKey === "11_risks_controls")?.recordCount,
    ).toBe(1);
    expect(fields.towerMetricRecords).toHaveLength(1);
    expect(fields.towerValueRecords).toHaveLength(1);
  });

  it("blocks realized-value claims when the fact is not active v3 context", () => {
    const fields = buildTowerContextPackFields(
      contextPack([
        fact({
          factId: "bridge-measured-fact",
          predicate: "realized_value",
          truthStatus: "source_adapter",
        }),
      ]),
    );

    expect(fields.projectionStatus).toBe("bridge_only");
    expect(fields.blockedValueClaims).toHaveLength(1);
    expect(fields.blockedValueClaims[0]?.realizedValueLanguageAllowed).toBe(false);
  });
});

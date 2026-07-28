/**
 * Canonical → V1 shaping tests. Proves the shapers honor the partial-data
 * contract (withheld/missing → no value, never zero) and produce contract-valid
 * V1 payloads.
 */

import {
  shapeEnterpriseIdentity,
  shapeEntitySummary,
  shapeEvidenceGap,
  shapeMetric,
  type EvidenceGapRow,
  type KnowledgeEntityRow,
  type MetricRow,
} from "../shape";

describe("shapeMetric", () => {
  it("withheld disclosure yields no value (never 0)", () => {
    const m = shapeMetric({ metric_ref: "m1", metric_name: "Spend", unit: "USD", period_start: "2026-01-01", period_end: "2026-12-31", metric_value: 1000, disclosure_mode: "withheld", evidence_refs: [] } as MetricRow);
    expect(m.value).toBeNull();
    expect(m.availabilityState).toBe("withheld");
  });
  it("null value is not_measured, not 0", () => {
    const m = shapeMetric({ metric_ref: "m2", metric_name: "Cloud%", unit: "percent", period_start: null, period_end: null, metric_value: null, disclosure_mode: "open", evidence_refs: [] } as MetricRow);
    expect(m.value).toBeNull();
    expect(m.availabilityState).toBe("not_measured");
  });
  it("present value is available", () => {
    const m = shapeMetric({ metric_ref: "m3", metric_name: "Apps", unit: "count", period_start: null, period_end: null, metric_value: 214, disclosure_mode: "open", evidence_refs: ["ev1"] } as MetricRow);
    expect(m.value).toBe(214);
    expect(m.availabilityState).toBe("available");
    expect(m.evidenceRefs).toEqual(["ev1"]);
  });
});

describe("shapeEnterpriseIdentity", () => {
  it("pulls identity from canonical_payload with fallbacks", () => {
    const entity: KnowledgeEntityRow = {
      entity_ref: "org-1", entity_type: "enterprise", display_name: "Airline Demo New",
      canonical_payload: { industry: "Global network airline", footprint: "6 hubs" },
      authority_state: "accepted", availability_state: "available", accepted_evidence_refs: [],
    };
    const id = shapeEnterpriseIdentity(entity, [
      { entity_ref: "org-1", fact_type: "annual_revenue", fact_value: { value: 48200, unit: "USD_millions" }, evidence_refs: ["ev-ar"] },
    ]);
    expect(id.displayName).toBe("Airline Demo New");
    expect(id.industry).toBe("Global network airline");
    expect(id.revenue?.value).toBe(48200);
    expect(id.revenue?.availabilityState).toBe("available");
  });

  it("null entity yields not_loaded footprint", () => {
    const id = shapeEnterpriseIdentity(null, []);
    expect(id.footprintState).toBe("not_loaded");
    expect(id.displayName).toBeNull();
  });
});

describe("shapeEntitySummary", () => {
  it("maps facts to fields and withheld fact to no value", () => {
    const entity: KnowledgeEntityRow = {
      entity_ref: "app-1", entity_type: "application", display_name: "Crew Scheduling",
      canonical_payload: { domain: "technology" }, authority_state: "accepted",
      availability_state: "available", accepted_evidence_refs: ["ev1"],
    };
    const s = shapeEntitySummary(entity, [
      { entity_ref: "app-1", fact_type: "annual_cost", fact_value: { value: 14 }, evidence_refs: [], availability_state: "withheld" },
      { entity_ref: "app-1", fact_type: "hosting", fact_value: { text: "on_prem" }, evidence_refs: [] },
    ]);
    expect(s.domainKey).toBe("technology");
    const cost = s.fields.find((f) => f.key === "annual_cost");
    expect(cost?.value).toBeNull();
    expect(cost?.availabilityState).toBe("withheld");
    expect(s.fields.find((f) => f.key === "hosting")?.value).toBe("on_prem");
  });
});

describe("shapeEvidenceGap", () => {
  it("maps a gap row into an EvidenceGapV1", () => {
    const row: EvidenceGapRow = {
      gap_ref: "gap-1", domain_ref: "risks", missing_evidence_type: "Reconciled risk register",
      why_it_matters: "Blocks a single board view", severity: "critical",
      availability_state: "conflicting", source_request_text: "Provide reconciled register",
    };
    const g = shapeEvidenceGap(row);
    expect(g.contentClass).toBe("evidence_gap");
    expect(g.severity).toBe("critical");
    expect(g.gapState).toBe("conflicting");
    expect(g.businessImpact).toBe("Blocks a single board view");
  });
});

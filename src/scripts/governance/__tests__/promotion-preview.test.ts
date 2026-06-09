import { describe, it, expect } from "@jest/globals";
import { buildPreviewData, renderPreviewMarkdown } from "@/lib/governance/promotion-preview-render";
import { evaluatePromotion, type ReadinessRow } from "@/lib/governance/promotion-evaluator";

function r(o: Partial<ReadinessRow>): ReadinessRow {
  return {
    object_table: "enterprise_context_chunks", object_id: "x", client_key: "meridian-health",
    tenant_id: "t", source_layer: "tenant_context", agent_readiness_status: "not_reviewed",
    retrievability: "fts_indexed", classification: "internal", source_basis: "doc",
    confidence_level: "high", applicable_agents: ["sentinel"], cited_render_verified_at: "2026-06-08",
    policy_validation_status: "pass", provenance: { source_file: "f" }, ...o,
  };
}

describe("buildPreviewData", () => {
  it("aggregates counts by tenant, type, and recommendation", () => {
    const evals = [
      r({ client_key: "meridian-health" }),
      r({ client_key: "skyharbor-air", tenant_id: "s" }),
      r({ client_key: "skyharbor-air", tenant_id: null }), // blocked
      r({ classification: "phi" }), // restricted
      r({ cited_render_verified_at: null }), // remain_not_reviewed
    ].map(evaluatePromotion);
    const d = buildPreviewData(evals);
    expect(d.total).toBe(5);
    // WS-F: fully-eligible-but-unapproved rows are promotion_candidates, not
    // agent_ready (agent_ready is reached only through governed sign-off).
    expect(d.byRecommendation.promotion_candidate).toBe(2);
    expect(d.byRecommendation.agent_ready ?? 0).toBe(0);
    expect(d.byRecommendation.blocked).toBe(1);
    expect(d.byRecommendation.restricted).toBe(1);
    expect(d.byRecommendation.remain_not_reviewed).toBe(1);
    expect(d.skyharbor.total).toBe(2);
    expect(d.byObjectType.enterprise_context_chunks).toBe(5);
  });

  it("renders markdown with totals, SkyHarbor section, and the SQL plan", () => {
    const d = buildPreviewData([r({})].map(evaluatePromotion));
    const md = renderPreviewMarkdown(d, "2026-05-09T00:00:00Z");
    expect(md).toMatch(/Total rows evaluated: 1/);
    expect(md).toMatch(/SkyHarbor Air/);
    expect(md).toMatch(/READ-ONLY: no source rows mutated/);
    expect(md).toMatch(/UPDATE public\.governed_object_readiness/);
  });
});

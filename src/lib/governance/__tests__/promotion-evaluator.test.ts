import { describe, it, expect } from "@jest/globals";
import {
  evaluatePromotion,
  isPromotionCandidate,
  type ReadinessRow,
} from "../promotion-evaluator";

function row(overrides: Partial<ReadinessRow> = {}): ReadinessRow {
  // A fully-eligible baseline (would be agent_ready).
  return {
    object_table: "enterprise_context_chunks",
    object_id: "row-1",
    client_key: "meridian-health",
    tenant_id: "6e419b6e",
    source_layer: "tenant_context",
    agent_readiness_status: "not_reviewed",
    retrievability: "fts_indexed",
    classification: "internal",
    source_basis: "11-changes.csv row CHG-MH-00034",
    confidence_level: "high",
    applicable_agents: ["sentinel", "nexus"],
    cited_render_verified_at: "2026-06-08T00:00:00Z",
    policy_validation_status: "pass",
    provenance: { source_file: "11-changes.csv", ingestion_run_id: "run-1" },
    ...overrides,
  };
}

describe("evaluatePromotion", () => {
  it("recommends promotion_candidate when every criterion passes but not yet approved", () => {
    const e = evaluatePromotion(row());
    expect(e.recommendation).toBe("promotion_candidate");
    expect(isPromotionCandidate(e)).toBe(true);
    expect(e.failure_reasons).toEqual([]);
    expect(Object.values(e.criteria).every(Boolean)).toBe(true);
  });

  it("recommends agent_ready only when already governed-approved (status=agent_ready) and criteria still pass", () => {
    const e = evaluatePromotion(row({ agent_readiness_status: "agent_ready" }));
    expect(e.recommendation).toBe("agent_ready");
    expect(isPromotionCandidate(e)).toBe(false);
  });

  it("never reaches agent_ready directly from ingestion (committed_not_indexed stays a gap, not agent_ready)", () => {
    const e = evaluatePromotion(row({ agent_readiness_status: "committed_not_indexed" }));
    expect(e.recommendation).toBe("promotion_candidate");
  });

  it("blocks a tenant object missing tenant_id", () => {
    const e = evaluatePromotion(row({ tenant_id: null }));
    expect(e.recommendation).toBe("blocked");
    expect(e.criteria.tenant_scoped).toBe(false);
    expect(e.failure_reasons.join()).toMatch(/missing tenant_id/);
  });

  it("blocks sensitive classification in shared corpus", () => {
    const e = evaluatePromotion(
      row({ source_layer: "industry_corpus", client_key: "corpus_global", tenant_id: null, classification: "phi" }),
    );
    expect(e.recommendation).toBe("blocked");
    expect(e.criteria.classification_allowed).toBe(false);
  });

  it("blocks rows whose status is quarantined/blocked/retired", () => {
    for (const s of ["blocked", "quarantined", "retired"] as const) {
      expect(evaluatePromotion(row({ agent_readiness_status: s })).recommendation).toBe("blocked");
    }
  });

  it("blocks a non-canonical client_key", () => {
    const e = evaluatePromotion(row({ client_key: "Meridian Health System" }));
    expect(e.recommendation).toBe("blocked");
    expect(e.criteria.policy_valid).toBe(false);
  });

  it("restricts a sensitive (pii/phi/restricted) tenant object", () => {
    for (const c of ["pii", "phi", "restricted"] as const) {
      const e = evaluatePromotion(row({ classification: c }));
      expect(e.recommendation).toBe("restricted");
    }
  });

  it("remains not_reviewed when source_basis/confidence/provenance missing", () => {
    expect(evaluatePromotion(row({ source_basis: null })).recommendation).toBe("remain_not_reviewed");
    expect(evaluatePromotion(row({ confidence_level: null })).recommendation).toBe("remain_not_reviewed");
    expect(evaluatePromotion(row({ provenance: {} })).recommendation).toBe("remain_not_reviewed");
  });

  it("remains not_reviewed when not retrievable", () => {
    const e = evaluatePromotion(row({ retrievability: "committed_not_indexed" }));
    expect(e.recommendation).toBe("remain_not_reviewed");
    expect(e.criteria.indexed_or_retrievable).toBe(false);
  });

  it("remains not_reviewed when not cite-render-verified (no auto-promotion)", () => {
    const e = evaluatePromotion(row({ cited_render_verified_at: null }));
    expect(e.recommendation).toBe("remain_not_reviewed");
    expect(e.criteria.citation_renderable).toBe(false);
    expect(e.failure_reasons.join()).toMatch(/cite-render/);
  });

  it("remains not_reviewed when applicable_agents missing/invalid", () => {
    expect(evaluatePromotion(row({ applicable_agents: [] })).recommendation).toBe("remain_not_reviewed");
    expect(evaluatePromotion(row({ applicable_agents: ["bogus"] })).criteria.applicable_agents_valid).toBe(false);
  });

  it("treats corpus_global (no tenant_id) as tenant_scoped", () => {
    const e = evaluatePromotion(
      row({ client_key: "corpus_global", tenant_id: null, source_layer: "industry_corpus" }),
    );
    expect(e.criteria.tenant_scoped).toBe(true);
    expect(e.recommendation).toBe("promotion_candidate");
  });
});

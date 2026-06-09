import {
  computeProposedReadiness,
  summarizeBackfill,
  renderBackfillReportMarkdown,
  emptyStatusCounts,
  type ReadinessSignals,
  type BackfillCell,
} from "../readiness-backfill";

function signals(over: Partial<ReadinessSignals> = {}): ReadinessSignals {
  return {
    source_layer: "tenant_context",
    client_key: "lakeshore-holdings",
    has_tenant_id: true,
    has_source_basis: true,
    has_confidence: true,
    classification: "internal",
    retrievable: true,
    cite_render_verified: false,
    ...over,
  };
}

describe("computeProposedReadiness", () => {
  it("NEVER auto-promotes to agent_ready when not cite-render-verified (the #3322 gate)", () => {
    const r = computeProposedReadiness(
      signals({ retrievable: true, cite_render_verified: false }),
    );
    expect(r.agent_readiness_status).toBe("not_reviewed");
    expect(r.agent_readiness_status).not.toBe("agent_ready");
  });

  it("only reaches agent_ready when grounded, retrievable, AND cite-render-verified", () => {
    const r = computeProposedReadiness(signals({ cite_render_verified: true }));
    expect(r.agent_readiness_status).toBe("agent_ready");
  });

  it("maps un-indexed objects to committed_not_indexed (the Lakeshore trap)", () => {
    const r = computeProposedReadiness(signals({ retrievable: false }));
    expect(r.agent_readiness_status).toBe("committed_not_indexed");
    expect(r.retrievability).toBe("committed_not_indexed");
  });

  it("maps grounding gaps to not_reviewed", () => {
    expect(
      computeProposedReadiness(signals({ has_source_basis: false }))
        .agent_readiness_status,
    ).toBe("not_reviewed");
    expect(
      computeProposedReadiness(signals({ has_confidence: false }))
        .agent_readiness_status,
    ).toBe("not_reviewed");
  });

  it("fences sensitive tenant data to restricted", () => {
    for (const c of ["pii", "phi", "restricted"] as const) {
      expect(
        computeProposedReadiness(signals({ classification: c }))
          .agent_readiness_status,
      ).toBe("restricted");
    }
  });

  it("blocks sensitive data that would land in shared corpus", () => {
    const r = computeProposedReadiness(
      signals({
        source_layer: "industry_corpus",
        client_key: "corpus_global",
        has_tenant_id: false,
        classification: "phi",
      }),
    );
    expect(r.agent_readiness_status).toBe("blocked");
  });

  it("blocks tenant objects missing tenant_id", () => {
    const r = computeProposedReadiness(signals({ has_tenant_id: false }));
    expect(r.agent_readiness_status).toBe("blocked");
    expect(r.reason).toMatch(/tenant_id/);
  });

  it("does not require tenant_id for corpus_global objects", () => {
    const r = computeProposedReadiness(
      signals({
        client_key: "corpus_global",
        source_layer: "industry_corpus",
        has_tenant_id: false,
        cite_render_verified: true,
      }),
    );
    expect(r.agent_readiness_status).toBe("agent_ready");
  });
});

describe("summarizeBackfill", () => {
  function cell(over: Partial<BackfillCell>): BackfillCell {
    return {
      client_key: "lakeshore-holdings",
      store: "enterprise_context_chunks",
      source_layer: "tenant_context",
      total: 0,
      by_status: emptyStatusCounts(),
      ...over,
    };
  }

  it("totals across cells and proves auto_promoted is 0 for a conservative backfill", () => {
    const c1 = cell({
      total: 179,
      by_status: { ...emptyStatusCounts(), not_reviewed: 179 },
    });
    const c2 = cell({
      store: "program_evidence_items",
      total: 20,
      by_status: { ...emptyStatusCounts(), restricted: 20 },
    });
    const s = summarizeBackfill([c1, c2]);
    expect(s.total_objects).toBe(199);
    expect(s.by_status.not_reviewed).toBe(179);
    expect(s.by_status.restricted).toBe(20);
    expect(s.auto_promoted).toBe(0);
  });

  it("renders a report that surfaces the no-auto-promotion guarantee", () => {
    const s = summarizeBackfill([
      cell({
        total: 5,
        by_status: { ...emptyStatusCounts(), not_reviewed: 5 },
      }),
    ]);
    const md = renderBackfillReportMarkdown(
      s,
      "2026-06-08T00:00:00Z",
      "dry-run",
    );
    expect(md).toMatch(/never auto-promotes/);
    expect(md).toMatch(/must be 0/);
    expect(md).toMatch(/dry-run/);
  });
});

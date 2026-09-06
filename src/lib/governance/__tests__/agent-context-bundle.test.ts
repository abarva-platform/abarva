import {
  buildValidatedAgentContextBundle,
  buildDecisionReasoningRequest,
  type GovernedCandidate,
} from "../agent-context-bundle";
import {
  fromEnterpriseBundle,
  fromAskSource,
} from "../context-bundle-adapters";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

const TEST_TENANT_KEY = CANONICAL_TENANT_KEYS[0];

function candidate(over: Partial<GovernedCandidate> = {}): GovernedCandidate {
  return {
    id: "c1",
    client_key: TEST_TENANT_KEY,
    tenant_id: "tenant-1",
    source_layer: "tenant_context",
    source_basis: "tenant_admin_upload",
    classification: "internal",
    retrievability: "committed_not_indexed",
    agent_readiness_status: "not_reviewed",
    confidence_level: null,
    cited_render_verified_at: null,
    citations: [],
    ...over,
  };
}

describe("buildValidatedAgentContextBundle", () => {
  it("keeps usable (warn-level) candidates and surfaces caveats", () => {
    const b = buildValidatedAgentContextBundle([candidate()]);
    expect(b.usable).toHaveLength(1);
    expect(b.blocked).toHaveLength(0);
    expect(b.decision).toBe("warn"); // usable for grounding, not yet agent-ready
    expect(b.agentReadyCount).toBe(0);
  });

  it("blocks a tenant candidate missing tenant_id — it never reaches the model", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({ tenant_id: null }),
    ]);
    expect(b.usable).toHaveLength(0);
    expect(b.blocked).toHaveLength(1);
    expect(b.blocked[0].errors.join(" ")).toMatch(/tenant_id/);
  });

  it("blocks sensitive data destined for shared corpus", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({
        client_key: "corpus_global",
        tenant_id: null,
        source_layer: "industry_corpus",
        classification: "phi",
      }),
    ]);
    expect(b.usable).toHaveLength(0);
    expect(b.blocked).toHaveLength(1);
  });

  it("blocks sensitive product docs before they can enter a model bundle", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({
        client_key: "corpus_global",
        tenant_id: null,
        source_layer: "product_docs",
        classification: "restricted",
      }),
    ]);

    expect(b.usable).toHaveLength(0);
    expect(b.blocked).toHaveLength(1);
    expect(b.blocked[0].errors.join(" ")).toMatch(/sensitive classification/);
  });

  it("blocks a non-canonical client_key (real client name leak guard)", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({ client_key: "morgan-street", tenant_id: "t" }),
    ]);
    expect(b.blocked).toHaveLength(1);
  });

  it("counts a fully agent-ready candidate and de-dupes citations", () => {
    const ready = candidate({
      retrievability: "search_indexed",
      agent_readiness_status: "agent_ready",
      confidence_level: "high",
      cited_render_verified_at: "2026-06-08T00:00:00Z",
      citations: ["doc#1", "doc#1", "doc#2"],
    });
    const b = buildValidatedAgentContextBundle([ready]);
    expect(b.agentReadyCount).toBe(1);
    expect(b.citations.sort()).toEqual(["doc#1", "doc#2"]);
  });

  it("blocks retired candidates from every model-visible bundle", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({
        agent_readiness_status: "retired",
        retrievability: "search_indexed",
        confidence_level: "high",
        cited_render_verified_at: "2026-06-08T00:00:00Z",
      }),
    ]);
    expect(b.usable).toHaveLength(0);
    expect(b.blocked).toHaveLength(1);
    expect(b.blocked[0].errors.join(" ")).toMatch(/retired/);
  });

  it("can require agent_ready for advisory packets, blocking loaded-but-unpromoted facts", () => {
    const ready = candidate({
      id: "ready",
      retrievability: "search_indexed",
      agent_readiness_status: "agent_ready",
      confidence_level: "high",
      cited_render_verified_at: "2026-06-08T00:00:00Z",
      citations: ["doc#ready"],
    });
    const loadedButUnreviewed = candidate({
      id: "loaded",
      retrievability: "search_indexed",
      agent_readiness_status: "not_reviewed",
      confidence_level: "medium",
      cited_render_verified_at: "2026-06-08T00:00:00Z",
      citations: ["doc#loaded"],
    });

    const diagnostic = buildValidatedAgentContextBundle([
      ready,
      loadedButUnreviewed,
    ]);
    expect(diagnostic.usable.map((c) => c.id)).toEqual(["ready", "loaded"]);

    const advisory = buildValidatedAgentContextBundle(
      [ready, loadedButUnreviewed],
      { requireAgentReady: true },
    );
    expect(advisory.usable.map((c) => c.id)).toEqual(["ready"]);
    expect(advisory.blocked.map((b) => b.candidate.id)).toEqual(["loaded"]);
    expect(advisory.blocked[0].errors.join(" ")).toMatch(/require agent_ready/);
  });

  it("blocks Source artifacts whose acceptance policy excludes downstream context", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({
        id: "accepted-artifact",
        downstream_context_policy: "exclude",
      }),
    ]);

    expect(b.usable).toHaveLength(0);
    expect(b.blocked).toHaveLength(1);
    expect(b.blocked[0].errors.join(" ")).toMatch(
      /downstream_context_policy is "exclude"/,
    );
  });

  it("blocks restricted Source artifact context unless a caller explicitly opts in", () => {
    const restricted = candidate({
      id: "restricted-artifact",
      downstream_context_policy: "restricted",
    });

    const defaultBundle = buildValidatedAgentContextBundle([restricted]);
    expect(defaultBundle.usable).toHaveLength(0);
    expect(defaultBundle.blocked).toHaveLength(1);
    expect(defaultBundle.blocked[0].errors.join(" ")).toMatch(
      /explicit downstream review is required/,
    );

    const reviewedBundle = buildValidatedAgentContextBundle([restricted], {
      allowRestrictedDownstreamContext: true,
    });
    expect(reviewedBundle.usable.map((c) => c.id)).toEqual([
      "restricted-artifact",
    ]);
  });

  it("allows Source artifacts explicitly accepted for downstream context", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({
        id: "included-artifact",
        downstream_context_policy: "include",
      }),
    ]);

    expect(b.usable.map((c) => c.id)).toEqual(["included-artifact"]);
    expect(b.blocked).toHaveLength(0);
  });

  it("decision is block when every candidate is blocked", () => {
    const b = buildValidatedAgentContextBundle([
      candidate({ tenant_id: null }),
      candidate({ id: "c2", tenant_id: null }),
    ]);
    expect(b.decision).toBe("block");
    expect(b.usable).toHaveLength(0);
  });

  it("decision is pass for an empty candidate set (nothing to govern)", () => {
    expect(buildValidatedAgentContextBundle([]).decision).toBe("pass");
  });
});

describe("buildDecisionReasoningRequest", () => {
  it("wraps the validated bundle in the reasoning envelope", () => {
    const req = buildDecisionReasoningRequest({
      task: "summarize cloud posture",
      agent: "sentinel",
      tenantKey: "lakeshore-holdings",
      candidates: [candidate()],
    });
    expect(req.task).toMatch(/cloud posture/);
    expect(req.agent).toBe("sentinel");
    expect(req.retrievalBundle.usable).toHaveLength(1);
    expect(req.policy_version).toBeTruthy();
  });
});

describe("bundle-shape adapters", () => {
  it("adapts a broker EnterpriseAgentContextBundle, fencing restricted items", () => {
    const bundle = {
      tenantKey: TEST_TENANT_KEY,
      items: [
        {
          id: "i1",
          kind: "kpi_metric",
          title: "ARR",
          sourceBasis: "tenant_admin_upload",
          dataClassification: "internal",
          linkedEvidence: [{ citationLocator: "ev#1" }],
        },
        {
          id: "i2",
          kind: "doc",
          dataClassification: "restricted",
          linkedEvidence: [],
        },
      ],
    };
    const candidates = fromEnterpriseBundle(
      bundle,
      TEST_TENANT_KEY,
      TEST_TENANT_KEY,
    );
    expect(candidates).toHaveLength(2);
    const b = buildValidatedAgentContextBundle(candidates);
    // restricted item is fenced; the internal kpi is usable.
    expect(b.usable.map((c) => c.id)).toContain("i1");
    expect(b.usable.some((c) => c.id === "i2")).toBe(false);
  });

  it("preserves downstream context policy from enterprise bundle items", () => {
    const candidates = fromEnterpriseBundle(
      {
        tenantKey: TEST_TENANT_KEY,
        items: [
          {
            id: "source-artifact-1",
            dataClassification: "internal",
            downstreamContextPolicy: "exclude",
          },
        ],
      },
      TEST_TENANT_KEY,
      TEST_TENANT_KEY,
    );

    expect(candidates[0].downstream_context_policy).toBe("exclude");
    const b = buildValidatedAgentContextBundle(candidates);
    expect(b.usable).toHaveLength(0);
    expect(b.blocked[0].errors.join(" ")).toMatch(/exclude/);
  });

  it("maps AskSource confidence to a confidence level", () => {
    const c = fromAskSource(
      { id: "s1", name: "Annual report", confidence: 0.9 },
      TEST_TENANT_KEY,
      TEST_TENANT_KEY,
    );
    expect(c.confidence_level).toBe("high");
    expect(c.citations).toEqual(["s1"]);
  });
});

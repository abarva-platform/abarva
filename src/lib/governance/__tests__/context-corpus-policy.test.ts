import {
  evaluateGovernedObject,
  isAgentUsable,
  isCanonicalClientKey,
  POLICY_VERSION,
  SOURCE_LAYERS,
  type GovernedObject,
} from "../context-corpus-policy";

function ready(over: Partial<GovernedObject> = {}): GovernedObject {
  return {
    id: "obj-1",
    tenant_id: "tenant-uuid-1",
    client_key: "meridian-health",
    object_type: "enterprise_context_chunk",
    source_layer: "tenant_context",
    industry: "DIVERSIFIED",
    enterprise_area: "cross_enterprise",
    function: "IT",
    process_area: "infrastructure",
    use_case_category: "current-state",
    strategic_move_phase_applicability: ["P2"],
    applicable_agents: ["sentinel", "nexus"],
    source_basis: "Lakeshore 360 Intelligence substrate",
    source_references: ["chunk-123"],
    classification: "confidential",
    compliance_basis: null,
    agent_readiness_status: "agent_ready",
    retrievability: "search_indexed",
    confidence_level: "high",
    confidence_rationale: "tenant-loaded structured fact",
    cited_render_verified_at: "2026-06-08T00:00:00Z",
    last_reviewed_at: "2026-06-08T00:00:00Z",
    owner: "ops",
    data_domains: ["it_landscape"],
    required_kpis: [],
    baseline_requirements: [],
    measurement_method: null,
    value_levers: [],
    known_failure_modes: [],
    guardrails: [],
    human_in_loop_controls: [],
    allowed_agent_actions: ["cite"],
    blocked_agent_actions: [],
    provenance: {
      source_file: "it.csv",
      ingestion_run_id: "run-1",
      indexed_at: "2026-06-08T00:00:00Z",
    },
    policy_version: POLICY_VERSION,
    contract_hash: null,
    created_at: null,
    updated_at: null,
    ...over,
  };
}

describe("context-corpus policy contract", () => {
  it("passes a fully-grounded, indexed, cite-render-verified object", () => {
    const r = evaluateGovernedObject(ready());
    expect(r.decision).toBe("pass");
    expect(r.agentReady).toBe(true);
  });

  it("BLOCKS an object that claims agent_ready but is only committed (not indexed) — the Lakeshore trap", () => {
    const r = evaluateGovernedObject(
      ready({ retrievability: "committed_not_indexed" }),
    );
    expect(r.decision).toBe("block");
    expect(r.agentReady).toBe(false);
    expect(r.errors.join(" ")).toMatch(/not retrievable/);
  });

  it("BLOCKS agent_ready without cite-render verification — the #3322 trap", () => {
    const r = evaluateGovernedObject(ready({ cited_render_verified_at: null }));
    expect(r.decision).toBe("block");
  });

  it("BLOCKS sensitive (PHI/PII/restricted) content in shared corpus", () => {
    const r = evaluateGovernedObject(
      ready({
        source_layer: "industry_corpus",
        client_key: "corpus_global",
        tenant_id: null,
        classification: "phi",
      }),
    );
    expect(r.decision).toBe("block");
    expect(r.errors.join(" ")).toMatch(/shared corpus/);
  });

  it("BLOCKS a tenant object missing tenant_id", () => {
    expect(evaluateGovernedObject(ready({ tenant_id: null })).decision).toBe(
      "block",
    );
  });

  it("BLOCKS a non-canonical client_key (catches tenant drift / real-name leakage)", () => {
    const r = evaluateGovernedObject(ready({ client_key: "morgan-street" }));
    expect(r.decision).toBe("block");
    expect(r.errors.join(" ")).toMatch(/not a canonical tenant key/);
  });

  it("warns (not blocks) when an object is honestly not_reviewed with gaps", () => {
    const r = evaluateGovernedObject(
      ready({
        agent_readiness_status: "not_reviewed",
        source_basis: null,
        confidence_level: null,
      }),
    );
    expect(r.decision).toBe("warn");
    expect(r.agentReady).toBe(false);
    expect(
      isAgentUsable(
        ready({ agent_readiness_status: "not_reviewed", source_basis: null }),
      ),
    ).toBe(true);
  });

  it("blocks an object that fails the schema entirely", () => {
    expect(evaluateGovernedObject({ id: "" }).decision).toBe("block");
  });

  describe("public_source layer (v1.1.0)", () => {
    // A public web page found by Move research, reviewed before use.
    function publicSource(over: Partial<GovernedObject> = {}): GovernedObject {
      return ready({
        object_type: "move_public_source",
        source_layer: "public_source",
        classification: "internal",
        agent_readiness_status: "not_reviewed",
        retrievability: "not_indexed",
        cited_render_verified_at: null,
        applicable_agents: ["nexus"],
        source_basis:
          "Public web pages retrieved by the Anthropic web search/fetch tools; URL and retrieval date per object",
        provenance: {
          source_file: "https://example.org/rule",
          ingestion_run_id: "run-1",
          parse_method: "anthropic_web_citation",
          committed_at: "2026-10-10T00:00:00Z",
        },
        ...over,
      });
    }

    it("is a declared layer under policy version 1.1.0", () => {
      expect(POLICY_VERSION).toBe("1.1.0");
      expect(SOURCE_LAYERS).toContain("public_source");
    });

    it("admits a tenant-scoped, not-yet-reviewed public source as warn, never ready", () => {
      const r = evaluateGovernedObject(publicSource());
      expect(r.decision).toBe("warn");
      expect(r.agentReady).toBe(false);
    });

    it("BLOCKS a public source in shared corpus", () => {
      const r = evaluateGovernedObject(
        publicSource({ client_key: "corpus_global", tenant_id: null }),
      );
      expect(r.decision).toBe("block");
      expect(r.errors.join(" ")).toMatch(/cannot be corpus_global/);
    });

    it("BLOCKS a public source claiming agent_ready, even when fully grounded", () => {
      const r = evaluateGovernedObject(
        publicSource({
          agent_readiness_status: "agent_ready",
          retrievability: "search_indexed",
          cited_render_verified_at: "2026-10-10T00:00:00Z",
        }),
      );
      expect(r.decision).toBe("block");
      expect(r.agentReady).toBe(false);
      expect(r.errors).toEqual(["public_source objects are never agent_ready"]);
      // The same fully-grounded object on another layer is ready.
      expect(
        evaluateGovernedObject(
          publicSource({
            source_layer: "uploaded_evidence",
            agent_readiness_status: "agent_ready",
            retrievability: "search_indexed",
            cited_render_verified_at: "2026-10-10T00:00:00Z",
          }),
        ).agentReady,
      ).toBe(true);
    });
  });

  it("recognizes canonical client keys + corpus_global", () => {
    expect(isCanonicalClientKey("skyharbor-air")).toBe(true);
    expect(isCanonicalClientKey("corpus_global")).toBe(true);
    expect(isCanonicalClientKey("morgan-street")).toBe(false);
  });
});

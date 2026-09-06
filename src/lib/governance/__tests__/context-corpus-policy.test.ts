import {
  evaluateGovernedObject,
  isAgentUsable,
  isCanonicalClientKey,
  POLICY_VERSION,
  type GovernedObject,
} from "../context-corpus-policy";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

const TEST_TENANT_KEY = CANONICAL_TENANT_KEYS[0];

function ready(over: Partial<GovernedObject> = {}): GovernedObject {
  return {
    id: "obj-1",
    tenant_id: "tenant-uuid-1",
    client_key: TEST_TENANT_KEY,
    object_type: "enterprise_context_chunk",
    source_layer: "tenant_context",
    industry: "DIVERSIFIED",
    enterprise_area: "cross_enterprise",
    function: "IT",
    process_area: "infrastructure",
    use_case_category: "current-state",
    strategic_move_phase_applicability: ["P2"],
    applicable_agents: ["sentinel", "nexus"],
    source_basis: "tenant 360 Intelligence substrate",
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

  it("BLOCKS an object that claims agent_ready but is only committed (not indexed)", () => {
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

  it("BLOCKS sensitive product documentation in shared corpus", () => {
    const r = evaluateGovernedObject(
      ready({
        source_layer: "product_docs",
        client_key: "corpus_global",
        tenant_id: null,
        classification: "restricted",
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

  it("recognizes canonical client keys + corpus_global", () => {
    expect(isCanonicalClientKey(TEST_TENANT_KEY)).toBe(true);
    expect(isCanonicalClientKey("corpus_global")).toBe(true);
    expect(isCanonicalClientKey("morgan-street")).toBe(false);
  });
});

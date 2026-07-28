/**
 * ConsumptionReader tests — envelope assembly + honest partial-data, with an
 * in-memory query (no DB). Proves the reader maps phase3c2e columns to the
 * ConsumptionEnvelope contract and returns not_loaded when a baseline or
 * projection is absent.
 */

import { ConsumptionReader } from "../reader";
import type { ConsumptionQuery } from "../db";
import { envelopeMetaSchema, type ConsumptionEnvelope } from "../../consumption-contracts";

const TENANT = "airline-demo-new";
const BASELINE = "kb-airline-2026";

/** Build an in-memory query from a table→rows map keyed by a matched SQL fragment. */
function fakeQuery(handlers: Array<{ match: RegExp; rows: unknown[] }>): ConsumptionQuery {
  return {
    async rows<T>(sql: string): Promise<T[]> {
      for (const h of handlers) if (h.match.test(sql)) return h.rows as T[];
      return [] as T[];
    },
  };
}

const activeBaselineRow = {
  match: /FROM publication\.knowledge_baseline/,
  rows: [{ knowledge_baseline_ref: BASELINE, baseline_content_hash: "hash-1", domain_publication_refs: ["enterprise:v1", "technology:v1"], activated_at: "2026-07-28T00:00:00.000Z" }],
};

function metaOf(env: ConsumptionEnvelope<unknown>) {
  const m: Record<string, unknown> = { ...env };
  delete m.data;
  return m;
}

describe("ConsumptionReader — no active baseline", () => {
  const reader = new ConsumptionReader(fakeQuery([]));

  it("returns not_loaded for the brief and a valid envelope", async () => {
    const env = await reader.getEnterpriseBrief({ tenantKey: TENANT });
    expect(env.availabilityState).toBe("not_loaded");
    expect(env.freshnessState).toBe("not_loaded");
    expect(env.warnings.some((w) => w.code === "not_loaded")).toBe(true);
    expect(envelopeMetaSchema.safeParse(metaOf(env)).success).toBe(true);
  });

  it("returns not_loaded relationships", async () => {
    const env = await reader.getRelationships({
      tenantKey: TENANT, knowledgeBaselineRef: "", focalEntityRefs: [],
      direction: "both", hopDepth: 1, currentTargetScope: "current",
      authorityMinimum: "accepted", maxNodes: 40, maxEdges: 60,
    });
    expect(env.availabilityState).toBe("not_loaded");
    expect(env.data.nodes).toEqual([]);
  });
});

describe("ConsumptionReader — active baseline with data", () => {
  const reader = new ConsumptionReader(fakeQuery([
    activeBaselineRow,
    { match: /FROM consumption\.relationship_node_v1/, rows: [
      { node_ref: "n1", entity_ref: "app-ehr", node_type: "application", label: "EHR", authority_state: "accepted", availability_state: "available" },
      { node_ref: "n2", entity_ref: "app-analytics", node_type: "application", label: "Analytics", authority_state: "candidate", availability_state: "candidate" },
    ]},
    { match: /FROM consumption\.relationship_edge_v1/, rows: [
      { edge_ref: "e1", from_node_ref: "n1", to_node_ref: "n2", relationship_type_ref: "feeds", current_target_state: "current", evidence_refs: ["ev1"], authority_state: "accepted", availability_state: "available" },
      { edge_ref: "e2", from_node_ref: "n1", to_node_ref: "n2", relationship_type_ref: "candidate_link", current_target_state: "current", evidence_refs: [], authority_state: "candidate", availability_state: "candidate" },
    ]},
    { match: /FROM consumption\.search_document_v1/, rows: [
      { object_ref: "sd1", display_name: "EHR", payload: { snippet: "the EHR" } },
    ]},
  ]));

  it("maps relationship rows and pins publication versions from the baseline", async () => {
    const env = await reader.getRelationships({
      tenantKey: TENANT, knowledgeBaselineRef: BASELINE, focalEntityRefs: ["app-ehr"],
      direction: "both", hopDepth: 1, currentTargetScope: "current",
      authorityMinimum: "accepted", maxNodes: 40, maxEdges: 60,
    });
    expect(env.availabilityState).toBe("available");
    expect(env.knowledgeBaselineRef).toBe(BASELINE);
    expect(env.domainPublicationVersions).toEqual({ enterprise: "v1", technology: "v1" });
    expect(env.data.nodes).toHaveLength(2);
    expect(env.data.nodes.find((n) => n.nodeId === "n1")?.hop).toBe(0); // focal
    // candidate edge excluded by default
    expect(env.data.edges).toHaveLength(1);
    expect(env.data.acceptedEdgeCount).toBe(1);
    expect(envelopeMetaSchema.safeParse(metaOf(env)).success).toBe(true);
  });

  it("includes candidate edges only on request", async () => {
    const env = await reader.getRelationships({
      tenantKey: TENANT, knowledgeBaselineRef: BASELINE, focalEntityRefs: ["app-ehr"],
      direction: "both", hopDepth: 1, currentTargetScope: "current",
      authorityMinimum: "accepted", maxNodes: 40, maxEdges: 60, includeCandidates: true,
    });
    expect(env.data.edges).toHaveLength(2);
    expect(env.data.candidateEdgeCount).toBe(1);
  });

  it("returns search hits from search_document_v1", async () => {
    const env = await reader.searchKnowledge({ tenantKey: TENANT, query: "EHR" });
    expect(env.availabilityState).toBe("available");
    expect(env.data.hits).toHaveLength(1);
    expect(env.data.hits[0].title).toBe("EHR");
  });

  it("returns not_loaded for projections not yet built (brief)", async () => {
    const env = await reader.getEnterpriseBrief({ tenantKey: TENANT });
    expect(env.availabilityState).toBe("not_loaded");
    // baseline metadata is still pinned even when the projection is empty
    expect(env.knowledgeBaselineRef).toBe(BASELINE);
  });
});

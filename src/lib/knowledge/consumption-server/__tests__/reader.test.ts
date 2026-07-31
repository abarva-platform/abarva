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

  it("preserves stable identity, domain and evidence refs on search hits", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /FROM consumption\.search_document_v1/, rows: [
        {
          object_ref: "fact:airport-station-001",
          display_name: "application_profile",
          payload: {
            entityRef: "entity:application_platform:airport-001",
            entityType: "application_platform",
            displayName: "Airport station gate ramp baggage 001",
            domainKey: "application_platform",
            snippet: "Airport station gate ramp baggage workflow.",
            evidenceRefs: ["ev-airport-001"],
          },
        },
      ]},
    ]));

    const env = await reader.searchKnowledge({ tenantKey: TENANT, query: "Airport station" });
    expect(env.projectionName).toBe("consumption.search_document_v1");
    expect(env.knowledgeBaselineRef).toBe(BASELINE);
    expect(env.data.hits[0]).toMatchObject({
      id: "fact:airport-station-001",
      searchDocId: "fact:airport-station-001",
      title: "Airport station gate ramp baggage 001",
      snippet: "Airport station gate ramp baggage workflow.",
      domainKey: "technology",
      entityRef: "entity:application_platform:airport-001",
      evidenceRefs: ["ev-airport-001"],
    });
  });

  it("returns not_loaded for projections not yet built (brief)", async () => {
    const env = await reader.getEnterpriseBrief({ tenantKey: TENANT });
    expect(env.availabilityState).toBe("not_loaded");
    // baseline metadata is still pinned even when the projection is empty
    expect(env.knowledgeBaselineRef).toBe(BASELINE);
  });
});

describe("ConsumptionReader — Home Knowledge D0 projection reconciliation", () => {
  it("normalizes built airline inventory projection payloads to the Home Explore domain contract", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /FROM consumption\.domain_summary_v1/, rows: [
        { payload: { domainKey: "application_platform", label: "Application platform", availabilityState: "available", evidenceCoverage: 1, entityCount: null, openGapCount: 0, summary: null } },
        { payload: { domainKey: "data_product", label: "Data product", availabilityState: "available", evidenceCoverage: 1, entityCount: null, openGapCount: 0, summary: null } },
        { payload: { domainKey: "vendor", label: "Vendor", availabilityState: "available", evidenceCoverage: 1, entityCount: null, openGapCount: 0, summary: null } },
      ]},
      { match: /FROM consumption\.application_inventory_v1/, rows: [
        { payload: { entityRef: "entity:application_platform:airport-001", entityType: "application_platform", displayName: "Airport station gate ramp baggage 001", domainKey: "application_platform", availabilityState: "available", fields: [], evidenceRefs: [] } },
      ]},
      { match: /FROM consumption\.technology_estate_v1/, rows: [
        { payload: { entityRef: "entity:application_platform:airport-platform-001", entityType: "application_platform", displayName: "Airport station cloud platform 001", domainKey: "application_platform", availabilityState: "available", fields: [], evidenceRefs: [] } },
      ]},
      { match: /FROM consumption\.data_product_inventory_v1/, rows: [
        { payload: { entityRef: "entity:data_product:ops-mart-001", entityType: "data_product", displayName: "Operations mart 001", domainKey: "data_product", availabilityState: "available", fields: [], evidenceRefs: [] } },
      ]},
      { match: /FROM consumption\.vendor_contract_inventory_v1/, rows: [
        { payload: { entityRef: "entity:vendor:supplier-001", entityType: "vendor", displayName: "Synthetic Supplier 001", domainKey: "vendor", availabilityState: "available", fields: [], evidenceRefs: [] } },
      ]},
    ]));

    const applications = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "technology" });
    expect(applications.projectionName).toBe("consumption.application_inventory_v1");
    expect(applications.availabilityState).toBe("available");
    expect(applications.data.entities).toHaveLength(1);
    expect(applications.data.entities[0]).toMatchObject({
      entityType: "application",
      domainKey: "technology",
    });
    expect(applications.data.domains.map((d) => d.domainKey)).toEqual([
      "technology",
      "data_product",
      "vendors",
    ]);

    const infrastructure = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "technology_estate" });
    expect(infrastructure.projectionName).toBe("consumption.technology_estate_v1");
    expect(infrastructure.availabilityState).toBe("available");
    expect(infrastructure.data.entities).toHaveLength(1);
    expect(infrastructure.data.entities[0]).toMatchObject({
      entityType: "technology_estate",
      domainKey: "technology_estate",
    });

    const dataProducts = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "data_products" });
    expect(dataProducts.projectionName).toBe("consumption.data_product_inventory_v1");
    expect(dataProducts.availabilityState).toBe("available");
    expect(dataProducts.data.entities).toHaveLength(1);
    expect(dataProducts.data.entities[0]).toMatchObject({
      entityType: "data_product",
      domainKey: "data_products",
    });

    const vendors = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "vendors" });
    expect(vendors.projectionName).toBe("consumption.vendor_contract_inventory_v1");
    expect(vendors.availabilityState).toBe("available");
    expect(vendors.data.entities).toHaveLength(1);
    expect(vendors.data.entities[0]).toMatchObject({
      entityType: "vendor",
      domainKey: "vendors",
    });

    const applicationAlias = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "application_platform" });
    expect(applicationAlias.projectionName).toBe("consumption.application_inventory_v1");
    expect(applicationAlias.availabilityState).toBe("available");
    expect(applicationAlias.data.domainKey).toBe("technology");
    expect(applicationAlias.data.entities).toHaveLength(1);

    const vendorAlias = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "vendor" });
    expect(vendorAlias.projectionName).toBe("consumption.vendor_contract_inventory_v1");
    expect(vendorAlias.availabilityState).toBe("available");
    expect(vendorAlias.data.domainKey).toBe("vendors");
    expect(vendorAlias.data.entities).toHaveLength(1);
  });

  it("reports totalCount independently from the paginated entity rows", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /FROM consumption\.domain_summary_v1/, rows: [
        { payload: { domainKey: "application_platform", label: "Application platform", availabilityState: "available", evidenceCoverage: 1, entityCount: null, openGapCount: 0, summary: null } },
      ]},
      { match: /FROM consumption\.application_inventory_v1/, rows: [
        { payload: { entityRef: "entity:application_platform:airport-001", entityType: "application_platform", displayName: "Airport station gate ramp baggage 001", domainKey: "application_platform", availabilityState: "available", fields: [], evidenceRefs: [] } },
        { payload: { entityRef: "entity:application_platform:airport-002", entityType: "application_platform", displayName: "Airport station gate ramp baggage 002", domainKey: "application_platform", availabilityState: "available", fields: [], evidenceRefs: [] } },
      ]},
      { match: /FROM consumption\.technology_estate_v1/, rows: [] },
      { match: /FROM consumption\.data_product_inventory_v1/, rows: [] },
      { match: /FROM consumption\.vendor_contract_inventory_v1/, rows: [] },
    ]));

    const env = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "technology", page: 1, pageSize: 1 });
    expect(env.availabilityState).toBe("available");
    expect(env.data.entities).toHaveLength(1);
    expect(env.data.totalCount).toBe(2);
    expect(env.data.pageSize).toBe(1);
  });

  it("uses the vendor inventory projection for vendor entity detail envelopes", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /FROM consumption\.application_inventory_v1/, rows: [] },
      { match: /FROM consumption\.technology_estate_v1/, rows: [] },
      { match: /FROM consumption\.data_product_inventory_v1/, rows: [] },
      { match: /FROM consumption\.vendor_contract_inventory_v1/, rows: [
        { payload: { entityRef: "entity:vendor:supplier-001", entityType: "vendor", displayName: "Synthetic Supplier 001", domainKey: "vendor", availabilityState: "available", fields: [], evidenceRefs: ["ev-vendor-001"] } },
      ]},
    ]));

    const env = await reader.getEntityDetail({
      tenantKey: TENANT,
      entityRef: "entity:vendor:supplier-001",
      lens: "none",
    });
    expect(env.projectionName).toBe("consumption.vendor_contract_inventory_v1");
    expect(env.availabilityState).toBe("available");
    expect(env.data.entity).toMatchObject({
      entityRef: "entity:vendor:supplier-001",
      domainKey: "vendors",
      evidenceRefs: ["ev-vendor-001"],
    });
  });

  it("does not report an unsupported Explore domain as an available zero when projections contain rows", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /FROM consumption\.domain_summary_v1/, rows: [
        { payload: { domainKey: "application_platform", label: "Application platform", availabilityState: "available", evidenceCoverage: 1, entityCount: null, openGapCount: 0, summary: null } },
      ]},
      { match: /FROM consumption\.application_inventory_v1/, rows: [
        { payload: { entityRef: "entity:application_platform:airport-001", entityType: "application_platform", displayName: "Airport station gate ramp baggage 001", domainKey: "application_platform", availabilityState: "available", fields: [], evidenceRefs: [] } },
      ]},
      { match: /FROM consumption\.technology_estate_v1/, rows: [] },
      { match: /FROM consumption\.data_product_inventory_v1/, rows: [] },
      { match: /FROM consumption\.vendor_contract_inventory_v1/, rows: [] },
    ]));

    const env = await reader.exploreEntities({ tenantKey: TENANT, domainKey: "unsupported-domain" });
    expect(env.availabilityState).toBe("not_loaded");
    expect(env.data.entities).toHaveLength(0);
    expect(env.warnings[0]?.message).toMatch(/No built Explore projection rows matched/);
  });

  it("reports search_document_v1 as not_loaded when the active-baseline table is empty", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /count\(\*\)::int AS total_count FROM consumption\.search_document_v1/, rows: [
        { total_count: 0 },
      ]},
    ]));

    const env = await reader.searchKnowledge({ tenantKey: TENANT, query: "Crew Scheduling" });
    expect(env.availabilityState).toBe("not_loaded");
    expect(env.data.hits).toHaveLength(0);
  });

  it("preserves available empty search results when search_document_v1 exists but the term is absent", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /count\(\*\)::int AS total_count FROM consumption\.search_document_v1/, rows: [
        { total_count: 37000 },
      ]},
    ]));

    const env = await reader.searchKnowledge({ tenantKey: TENANT, query: "Crew Scheduling" });
    expect(env.availabilityState).toBe("available");
    expect(env.data.hits).toHaveLength(0);
  });

  it("does not report suggested questions as available when module_knowledge_packet_v1 is absent", async () => {
    const reader = new ConsumptionReader(fakeQuery([activeBaselineRow]));

    const env = await reader.getSuggestedQuestions({ tenantKey: TENANT, mode: "brief" });
    expect(env.availabilityState).toBe("not_loaded");
    expect(env.data).toEqual([]);
  });

  it("reads mode-scoped suggested questions from module_knowledge_packet_v1 when built", async () => {
    const reader = new ConsumptionReader(fakeQuery([
      activeBaselineRow,
      { match: /FROM consumption\.module_knowledge_packet_v1/, rows: [
        { payload: { questions: [
          { id: "sq-brief", question: "What changed?", mode: "brief", requiresModel: true },
          { id: "sq-explore", question: "Which systems matter?", mode: "explore", requiresModel: false },
        ] } },
      ]},
    ]));

    const env = await reader.getSuggestedQuestions({ tenantKey: TENANT, mode: "brief" });
    expect(env.availabilityState).toBe("available");
    expect(env.data).toEqual([
      { id: "sq-brief", question: "What changed?", mode: "brief", requiresModel: true },
    ]);
  });
});

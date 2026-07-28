/**
 * Server-side consumption reader. Reads the governed publication/consumption
 * schema (phase3c2e, merged) and assembles ConsumptionEnvelope<T> for the HTTP
 * consumption API. Implements the same 8 methods as the client-side provider
 * interface, so the fixture and HTTP paths are byte-shape identical.
 *
 * Honest partial data: if a tenant has no active baseline, or a projection is
 * not yet built, the reader returns an envelope with availability_state
 * "not_loaded" and an empty (never zero-coerced) payload — per the contract.
 *
 * Payload note: the generic *_v1 projections carry a `payload` jsonb. Once the
 * projection-build job emits V1-shaped payloads (backend gap register), this
 * reader passes them straight through. Until then those projections are empty,
 * so this reader reports not_loaded rather than returning raw canonical JSON.
 */

import type {
  ConsumptionEnvelope,
  EnterpriseBriefQuery,
  EnterpriseBriefV1,
  EntityDetailQuery,
  EntityDetailV1,
  EntityExploreQuery,
  EntityExploreResultV1,
  EvidenceGapQuery,
  EvidenceGapResultV1,
  KnowledgeSearchQuery,
  KnowledgeSearchResultV1,
  ModuleHandoffPreviewV1,
  ModuleHandoffQuery,
  ProjectionName,
  RelationshipProjectionV1,
  RelationshipQuery,
  SuggestedQuestionQuery,
  SuggestedQuestionV1,
} from "../consumption-contracts";
import { PROJECTION_CONTRACT_VERSION } from "../consumption-contracts";
import type { ConsumptionQuery } from "./db";

interface ActiveBaseline {
  knowledgeBaselineRef: string;
  contentHash: string;
  domainPublicationVersions: Record<string, string>;
  asOf: string;
}

const NOW_FALLBACK = "1970-01-01T00:00:00.000Z";

export class ConsumptionReader {
  constructor(private readonly q: ConsumptionQuery) {}

  /** Resolve the single active baseline for a tenant, or null if none. */
  private async activeBaseline(tenantKey: string): Promise<ActiveBaseline | null> {
    const rows = await this.q.rows<{
      knowledge_baseline_ref: string;
      baseline_content_hash: string;
      domain_publication_refs: string[] | null;
      activated_at: string | null;
    }>(
      `SELECT knowledge_baseline_ref, baseline_content_hash, domain_publication_refs, activated_at
         FROM publication.knowledge_baseline
        WHERE tenant_key = $1 AND is_active = true
        LIMIT 1`,
      [tenantKey],
    );
    const row = rows[0];
    if (!row) return null;
    const versions: Record<string, string> = {};
    for (const ref of row.domain_publication_refs ?? []) {
      // refs look like "<domain>:<version>" or an opaque ref; key by domain when present.
      const [domain, ...rest] = ref.split(":");
      versions[domain] = rest.length ? rest.join(":") : ref;
    }
    return {
      knowledgeBaselineRef: row.knowledge_baseline_ref,
      contentHash: row.baseline_content_hash,
      domainPublicationVersions: versions,
      asOf: row.activated_at ?? NOW_FALLBACK,
    };
  }

  private notLoaded<T>(
    tenantKey: string,
    projectionName: ProjectionName,
    data: T,
    baseline: ActiveBaseline | null,
    reason: string,
  ): ConsumptionEnvelope<T> {
    return {
      tenantKey,
      knowledgeBaselineRef: baseline?.knowledgeBaselineRef ?? "none",
      domainPublicationVersions: baseline?.domainPublicationVersions ?? {},
      projectionName,
      projectionContractVersion: PROJECTION_CONTRACT_VERSION,
      asOf: baseline?.asOf ?? NOW_FALLBACK,
      contentHash: baseline?.contentHash ?? "none",
      authorityState: "published",
      availabilityState: "not_loaded",
      freshnessState: "not_loaded",
      data,
      evidenceRefs: [],
      knownGapRefs: [],
      warnings: [{ code: "not_loaded", message: reason }],
    };
  }

  private ok<T>(
    tenantKey: string,
    projectionName: ProjectionName,
    data: T,
    baseline: ActiveBaseline,
    extra?: Partial<ConsumptionEnvelope<T>>,
  ): ConsumptionEnvelope<T> {
    return {
      tenantKey,
      knowledgeBaselineRef: baseline.knowledgeBaselineRef,
      domainPublicationVersions: baseline.domainPublicationVersions,
      projectionName,
      projectionContractVersion: PROJECTION_CONTRACT_VERSION,
      asOf: baseline.asOf,
      contentHash: baseline.contentHash,
      authorityState: "published",
      availabilityState: "available",
      freshnessState: "fresh",
      data,
      evidenceRefs: [],
      knownGapRefs: [],
      warnings: [],
      ...extra,
    };
  }

  async getEnterpriseBrief(
    query: EnterpriseBriefQuery,
  ): Promise<ConsumptionEnvelope<EnterpriseBriefV1>> {
    const empty = emptyBrief();
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.enterprise_brief_v1", empty, null,
        "No active Knowledge Baseline for this tenant.");
    }
    const rows = await this.q.rows<{ payload: EnterpriseBriefV1 | null; availability_state: string }>(
      `SELECT payload, availability_state FROM consumption.enterprise_brief_v1
        WHERE tenant_key = $1 AND knowledge_baseline_ref = $2 LIMIT 1`,
      [query.tenantKey, baseline.knowledgeBaselineRef],
    ).catch(() => []);
    if (!rows[0]?.payload) {
      return this.notLoaded(query.tenantKey, "consumption.enterprise_brief_v1", empty, baseline,
        "enterprise_brief_v1 has not been built for the active baseline yet.");
    }
    return this.ok(query.tenantKey, "consumption.enterprise_brief_v1", rows[0].payload, baseline);
  }

  async getRelationships(
    query: RelationshipQuery & { tenantKey: string },
  ): Promise<ConsumptionEnvelope<RelationshipProjectionV1>> {
    const empty = emptyRelationships();
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.relationship_edge_v1", empty, null,
        "No active Knowledge Baseline for this tenant.");
    }
    const focal = new Set(query.focalEntityRefs);
    const nodeRows = await this.q.rows<{
      node_ref: string; entity_ref: string | null; node_type: string | null;
      label: string | null; authority_state: string; availability_state: string;
    }>(
      `SELECT node_ref, entity_ref, node_type, label, authority_state, availability_state
         FROM consumption.relationship_node_v1
        WHERE tenant_key = $1 AND knowledge_baseline_ref = $2`,
      [query.tenantKey, baseline.knowledgeBaselineRef],
    ).catch(() => []);
    const edgeRows = await this.q.rows<{
      edge_ref: string; from_node_ref: string; to_node_ref: string;
      relationship_type_ref: string | null; current_target_state: string | null;
      evidence_refs: string[] | null; authority_state: string; availability_state: string;
    }>(
      `SELECT edge_ref, from_node_ref, to_node_ref, relationship_type_ref,
              current_target_state, evidence_refs, authority_state, availability_state
         FROM consumption.relationship_edge_v1
        WHERE tenant_key = $1 AND knowledge_baseline_ref = $2`,
      [query.tenantKey, baseline.knowledgeBaselineRef],
    ).catch(() => []);

    if (nodeRows.length === 0) {
      return this.notLoaded(query.tenantKey, "consumption.relationship_edge_v1", empty, baseline,
        "Relationship projection is empty for the active baseline.");
    }

    const nodes: RelationshipProjectionV1["nodes"] = nodeRows.map((n) => ({
      nodeId: n.node_ref,
      nodeType: n.node_type ?? "unknown",
      label: n.label ?? n.node_ref,
      authorityState: coerceAuthority(n.authority_state),
      availabilityState: coerceAvailability(n.availability_state),
      hop: focal.has(n.entity_ref ?? n.node_ref) ? 0 : 1,
      evidenceRefs: [],
    }));
    const includeCandidates = query.includeCandidates ?? false;
    const edges: RelationshipProjectionV1["edges"] = edgeRows
      .filter((e) => includeCandidates || coerceAuthority(e.authority_state) !== "candidate")
      .map((e) => ({
        edgeId: e.edge_ref,
        fromNodeId: e.from_node_ref,
        toNodeId: e.to_node_ref,
        relationshipType: e.relationship_type_ref ?? "related_to",
        authorityState: coerceAuthority(e.authority_state),
        availabilityState: coerceAvailability(e.availability_state),
        scope: e.current_target_state === "target" ? "target" : "current",
        evidenceRefs: e.evidence_refs ?? [],
      }));

    const data: RelationshipProjectionV1 = {
      focalEntityRefs: query.focalEntityRefs,
      nodes,
      edges,
      evidenceByEdge: {},
      truncated: nodes.length >= query.maxNodes,
      aggregationApplied: false,
      omittedNodeCount: 0,
      acceptedEdgeCount: edges.filter((e) => e.authorityState !== "candidate").length,
      candidateEdgeCount: edges.filter((e) => e.authorityState === "candidate").length,
      openGapCount: 0,
    };
    return this.ok(query.tenantKey, "consumption.relationship_edge_v1", data, baseline);
  }

  async searchKnowledge(
    query: KnowledgeSearchQuery,
  ): Promise<ConsumptionEnvelope<KnowledgeSearchResultV1>> {
    const empty: KnowledgeSearchResultV1 = { query: query.query, hits: [], totalCount: 0, page: 1, pageSize: 25 };
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.search_document_v1", empty, null,
        "No active Knowledge Baseline for this tenant.");
    }
    const rows = await this.q.rows<{ object_ref: string; display_name: string | null; payload: Record<string, unknown> | null }>(
      `SELECT object_ref, display_name, payload FROM consumption.search_document_v1
        WHERE tenant_key = $1 AND knowledge_baseline_ref = $2
          AND (display_name ILIKE $3 OR payload::text ILIKE $3)
        LIMIT 25`,
      [query.tenantKey, baseline.knowledgeBaselineRef, `%${query.query}%`],
    ).catch(() => []);
    if (rows.length === 0) {
      // Distinguish "no baseline data" from "no match": if the table is empty for
      // this baseline at all, that's not_loaded; a zero-match query is available+empty.
      return this.ok(query.tenantKey, "consumption.search_document_v1", empty, baseline);
    }
    const hits: KnowledgeSearchResultV1["hits"] = rows.map((r) => ({
      id: r.object_ref,
      contentClass: "accepted_fact",
      availabilityState: "accepted",
      evidenceRefs: [],
      absenceReason: null,
      searchDocId: r.object_ref,
      title: r.display_name ?? r.object_ref,
      snippet: typeof r.payload?.snippet === "string" ? r.payload.snippet : "",
      domainKey: null,
      entityRef: r.object_ref,
    }));
    return this.ok(query.tenantKey, "consumption.search_document_v1",
      { query: query.query, hits, totalCount: hits.length, page: 1, pageSize: 25 }, baseline);
  }

  async exploreEntities(query: EntityExploreQuery): Promise<ConsumptionEnvelope<EntityExploreResultV1>> {
    const empty: EntityExploreResultV1 = { domainKey: query.domainKey ?? null, domains: [], entities: [], totalCount: 0, page: 1, pageSize: 25 };
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.domain_summary_v1", empty, null,
        "No active Knowledge Baseline for this tenant.");
    }
    // domain_summary_v1 / application_inventory_v1 are not built yet → not_loaded.
    return this.notLoaded(query.tenantKey, "consumption.domain_summary_v1", empty, baseline,
      "domain_summary_v1 / application_inventory_v1 are not built for the active baseline yet.");
  }

  async getEntityDetail(query: EntityDetailQuery): Promise<ConsumptionEnvelope<EntityDetailV1>> {
    const empty = emptyEntityDetail(query.entityRef);
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.application_inventory_v1", empty, null,
        "No active Knowledge Baseline for this tenant.");
    }
    return this.notLoaded(query.tenantKey, "consumption.application_inventory_v1", empty, baseline,
      "Inventory projections are not built for the active baseline yet.");
  }

  async getEvidenceAndGaps(query: EvidenceGapQuery): Promise<ConsumptionEnvelope<EvidenceGapResultV1>> {
    const empty: EvidenceGapResultV1 = { domainKey: query.domainKey ?? null, gaps: [], overallEvidenceCoverage: 0, severityCounts: { low: 0, medium: 0, high: 0, critical: 0 } };
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.evidence_gap_v1", empty, null,
        "No active Knowledge Baseline for this tenant.");
    }
    return this.notLoaded(query.tenantKey, "consumption.evidence_gap_v1", empty, baseline,
      "evidence_gap_v1 is not built for the active baseline yet.");
  }

  async getSuggestedQuestions(query: SuggestedQuestionQuery): Promise<ConsumptionEnvelope<SuggestedQuestionV1[]>> {
    const baseline = await this.activeBaseline(query.tenantKey);
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.module_knowledge_packet_v1", [], null,
        "No active Knowledge Baseline for this tenant.");
    }
    return this.ok(query.tenantKey, "consumption.module_knowledge_packet_v1", [], baseline);
  }

  async previewModuleHandoff(query: ModuleHandoffQuery): Promise<ConsumptionEnvelope<ModuleHandoffPreviewV1>> {
    const baseline = await this.activeBaseline(query.tenantKey);
    const data: ModuleHandoffPreviewV1 = {
      receivingModule: query.receivingModule,
      scope: `${query.selectedEntityRefs.length} selected entities`,
      selectedEntityRefs: query.selectedEntityRefs,
      filters: query.filters ?? {},
      lens: query.lens ?? "none",
      insightRef: query.insightRef ?? null,
      knowledgeBaselineRef: baseline?.knowledgeBaselineRef ?? "none",
      domainPublicationVersions: baseline?.domainPublicationVersions ?? {},
      evidenceRefs: [],
      knownGapRefs: [],
      readinessState: baseline ? "ready" : "blocked_partial_baseline",
      readinessDetail: baseline ? null : "No active baseline; nothing can travel yet.",
    };
    if (!baseline) {
      return this.notLoaded(query.tenantKey, "consumption.module_knowledge_packet_v1", data, null,
        "No active Knowledge Baseline for this tenant.");
    }
    return this.ok(query.tenantKey, "consumption.module_knowledge_packet_v1", data, baseline,
      { authorityState: "candidate", availabilityState: "candidate" });
  }
}

// --- small helpers ---

function coerceAuthority(v: string): RelationshipProjectionV1["nodes"][number]["authorityState"] {
  return v === "accepted" || v === "published" || v === "candidate" || v === "retired" || v === "superseded"
    ? v : "accepted";
}
function coerceAvailability(v: string): RelationshipProjectionV1["nodes"][number]["availabilityState"] {
  const allowed = ["available","not_loaded","not_measured","withheld","conflicting","stale","candidate","accepted","superseded","not_applicable"];
  return (allowed.includes(v) ? v : "available") as RelationshipProjectionV1["nodes"][number]["availabilityState"];
}

function emptyBrief(): EnterpriseBriefV1 {
  return { identity: { organizationId: null, displayName: null, industry: null, revenue: null, employees: null, footprint: null, footprintState: "not_loaded" }, headlineMetrics: [], interpretation: null, perspectives: [], benchmarks: [], targets: [], domains: [], topGapRefs: [] };
}
function emptyRelationships(): RelationshipProjectionV1 {
  return { focalEntityRefs: [], nodes: [], edges: [], evidenceByEdge: {}, truncated: false, aggregationApplied: false, omittedNodeCount: 0, acceptedEdgeCount: 0, candidateEdgeCount: 0, openGapCount: 0 };
}
function emptyEntityDetail(entityRef: string): EntityDetailV1 {
  return { entity: { entityRef, entityType: "unknown", displayName: "", domainKey: "", availabilityState: "not_loaded", fields: [], evidenceRefs: [] }, fields: [], perspectives: [], benchmarks: [], relatedEntityRefs: [], gapRefs: [] };
}

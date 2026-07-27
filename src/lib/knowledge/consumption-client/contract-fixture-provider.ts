/**
 * ContractFixtureConsumptionProvider — serves contract-valid fixture packs
 * through the exact KnowledgeConsumptionProvider interface. Interchangeable with
 * HttpConsumptionApiProvider; components cannot tell which is active.
 *
 * FIXTURE-ONLY. No legacy/real data is ever read here. When a scenario suppresses
 * data (withheld / not_loaded) an emptied payload is returned so nothing leaks.
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
  KnowledgeConsumptionProvider,
  KnowledgeSearchQuery,
  KnowledgeSearchResultV1,
  ModuleHandoffPreviewV1,
  ModuleHandoffQuery,
  ProviderBinding,
  RelationshipProjectionV1,
  RelationshipQuery,
  SuggestedQuestionQuery,
  SuggestedQuestionV1,
} from "../consumption-contracts";
import {
  emptyBrief,
  emptyEntityDetail,
  emptyEvidence,
  emptyExplore,
  emptyRelationships,
  emptySearch,
  getFixturePack,
  SCENARIO_EFFECTS,
  type FixturePack,
  type FixtureScenario,
} from "../fixtures";
import { buildEnvelope } from "./envelope-factory";

export interface FixtureProviderOptions {
  tenantKey: string;
  scenario: FixtureScenario;
}

export class ContractFixtureConsumptionProvider
  implements KnowledgeConsumptionProvider
{
  readonly binding: ProviderBinding;
  private readonly pack: FixturePack;
  private readonly scenario: FixtureScenario;

  constructor(opts: FixtureProviderOptions) {
    const pack = getFixturePack(opts.tenantKey);
    if (!pack) {
      // No fallback to any legacy/real pack — fail closed.
      throw new Error(
        `No fixture pack for synthetic tenant "${opts.tenantKey}". ` +
          `Fixtures are the only source; there is no legacy fallback.`,
      );
    }
    this.pack = pack;
    this.scenario = opts.scenario;
    this.binding = {
      kind: "contract_fixture",
      tenantKey: pack.meta.tenantKey,
      fixtureScenario: opts.scenario,
    };
  }

  private get suppress(): boolean {
    return Boolean(SCENARIO_EFFECTS[this.scenario].suppressData);
  }

  /** Resolve evidence refs to descriptors for the evidence drawer. */
  resolveEvidence(refs: string[]) {
    return refs
      .map((r) => this.pack.evidenceDescriptors[r])
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
  }

  async getEnterpriseBrief(
    _query: EnterpriseBriefQuery,
  ): Promise<ConsumptionEnvelope<EnterpriseBriefV1>> {
    const data = this.suppress ? emptyBrief() : this.pack.brief;
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.enterprise_brief_v1",
      data,
      scenario: this.scenario,
      evidenceRefs: this.suppress ? [] : data.interpretation?.evidenceRefs ?? [],
      knownGapRefs: this.suppress ? [] : this.pack.brief.topGapRefs,
    });
  }

  async exploreEntities(
    query: EntityExploreQuery,
  ): Promise<ConsumptionEnvelope<EntityExploreResultV1>> {
    let data = this.suppress ? emptyExplore() : this.pack.exploreLanding;
    if (!this.suppress && query.domainKey) {
      const entities = this.pack.exploreLanding.entities.filter(
        (e) => e.domainKey === query.domainKey,
      );
      data = { ...this.pack.exploreLanding, domainKey: query.domainKey, entities, totalCount: entities.length };
    }
    if (!this.suppress && query.search) {
      const q = query.search.toLowerCase();
      const entities = data.entities.filter((e) =>
        e.displayName.toLowerCase().includes(q),
      );
      data = { ...data, entities, totalCount: entities.length };
    }
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.domain_summary_v1",
      data,
      scenario: this.scenario,
    });
  }

  async getEntityDetail(
    query: EntityDetailQuery,
  ): Promise<ConsumptionEnvelope<EntityDetailV1>> {
    const detail = this.pack.entityDetails[query.entityRef];
    const data =
      this.suppress || !detail ? emptyEntityDetail(query.entityRef) : detail;
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.application_inventory_v1",
      data,
      scenario: this.scenario,
      availabilityState: !detail && !this.suppress ? "not_loaded" : undefined,
      evidenceRefs: this.suppress ? [] : data.entity.evidenceRefs,
      knownGapRefs: this.suppress ? [] : data.gapRefs,
    });
  }

  async getRelationships(
    query: RelationshipQuery & { tenantKey: string },
  ): Promise<ConsumptionEnvelope<RelationshipProjectionV1>> {
    let data = this.suppress ? emptyRelationships() : this.pack.relationships;
    if (!this.suppress) {
      // Honor one-hop default; two-hop only on request. Candidates opt-in.
      const maxHop = query.hopDepth === 2 ? 2 : 1;
      const nodes = data.nodes.filter((n) => n.hop <= maxHop);
      const nodeIds = new Set(nodes.map((n) => n.nodeId));
      let edges = data.edges.filter(
        (e) => nodeIds.has(e.fromNodeId) && nodeIds.has(e.toNodeId),
      );
      if (!query.includeCandidates) {
        edges = edges.filter((e) => e.authorityState !== "candidate");
      }
      const truncated = nodes.length < data.nodes.length;
      data = {
        ...data,
        nodes,
        edges,
        truncated,
        omittedNodeCount: data.nodes.length - nodes.length,
        acceptedEdgeCount: edges.filter((e) => e.authorityState !== "candidate").length,
        candidateEdgeCount: edges.filter((e) => e.authorityState === "candidate").length,
      };
    }
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.relationship_edge_v1",
      data,
      scenario: this.scenario,
    });
  }

  async getEvidenceAndGaps(
    query: EvidenceGapQuery,
  ): Promise<ConsumptionEnvelope<EvidenceGapResultV1>> {
    let data = this.suppress ? emptyEvidence() : this.pack.evidence;
    if (!this.suppress && query.domainKey) {
      const gaps = this.pack.evidence.gaps.filter((g) => g.domainKey === query.domainKey);
      data = { ...this.pack.evidence, domainKey: query.domainKey, gaps };
    }
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.evidence_gap_v1",
      data,
      scenario: this.scenario,
      knownGapRefs: this.suppress ? [] : data.gaps.map((g) => g.gapId),
    });
  }

  async searchKnowledge(
    query: KnowledgeSearchQuery,
  ): Promise<ConsumptionEnvelope<KnowledgeSearchResultV1>> {
    if (this.suppress) {
      return buildEnvelope({
        pack: this.pack,
        projectionName: "consumption.search_document_v1",
        data: emptySearch(query.query),
        scenario: this.scenario,
      });
    }
    const q = query.query.toLowerCase();
    const hits = this.pack.searchDocs.filter(
      (d) => d.title.toLowerCase().includes(q) || d.snippet.toLowerCase().includes(q),
    );
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.search_document_v1",
      data: { query: query.query, hits, totalCount: hits.length, page: 1, pageSize: 25 },
      scenario: this.scenario,
    });
  }

  async getSuggestedQuestions(
    query: SuggestedQuestionQuery,
  ): Promise<ConsumptionEnvelope<SuggestedQuestionV1[]>> {
    const data = this.suppress
      ? []
      : this.pack.suggestedQuestions.filter((s) => s.mode === query.mode);
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.module_knowledge_packet_v1",
      data,
      scenario: this.scenario,
    });
  }

  async previewModuleHandoff(
    query: ModuleHandoffQuery,
  ): Promise<ConsumptionEnvelope<ModuleHandoffPreviewV1>> {
    const preview =
      this.pack.handoffPreviews[query.receivingModule] ?? {
        receivingModule: query.receivingModule,
        scope: "No governed handoff is available for this selection.",
        selectedEntityRefs: query.selectedEntityRefs,
        filters: query.filters ?? {},
        lens: query.lens ?? "none",
        insightRef: query.insightRef ?? null,
        knowledgeBaselineRef: this.pack.meta.knowledgeBaselineRef,
        domainPublicationVersions: this.pack.meta.domainPublicationVersions,
        evidenceRefs: [],
        knownGapRefs: [],
        readinessState: "not_applicable" as const,
        readinessDetail: "No preview defined for this module in the fixture.",
      };
    return buildEnvelope({
      pack: this.pack,
      projectionName: "consumption.module_knowledge_packet_v1",
      data: preview,
      scenario: this.scenario,
      authorityState: "candidate",
      availabilityState: "candidate",
      evidenceRefs: preview.evidenceRefs,
      knownGapRefs: preview.knownGapRefs,
    });
  }
}

/**
 * GovernedKnowledgeProvider: the ONLY provider a production Knowledge UI component
 * may bind to. Requires tenant + active baseline, returns ConsumptionEnvelope<T>
 * for every read, and never falls back to design-harness (illustrative) data under
 * any condition -- including when a real API call fails. A failed call is a
 * withheld envelope, not a fallback to mock data.
 *
 * The methods below are typed against KNOWLEDGE_TARGET_READ_MODEL_CONTRACTS.md's
 * documented target shapes (reports/airline-knowledge-ui-binding-2026-07-29/).
 * Per that package: 0 of 62 matrix rows are SUPPORTED_AND_RECONCILED today, so the
 * live implementation of this interface has real work to do before any method can
 * return `availabilityState: "available"` for airline-demo-new. Until then,
 * `createUnreconciledGovernedKnowledgeProvider` below satisfies the interface
 * honestly -- everything withheld, nothing fabricated -- so UI shells have a real
 * provider to build and test against today.
 */

import {
  type AvailabilityState,
  type BaselineMetadata,
  type ConsumptionEnvelope,
  withheldEnvelope,
} from "./types";
import type {
  AvaAnswer,
  AvaProviderStatus,
  AvaSearchResultGroup,
  AvaSuggestedQuestion,
  ConditionTile,
  ContradictionRow,
  CurrentVsTargetComparison,
  DataProductInventoryRow,
  DecisionLane,
  DecisionReadinessQuadrantPoint,
  DecisionReadinessSummary,
  DecisionRow,
  DomainCoverageRow,
  GoalRow,
  IndustryBenchmarkRow,
  IndustryPatternRow,
  InfrastructureInventoryRow,
  IntegrationInventoryRow,
  LeadershipPerspectiveRow,
  LensDefinition,
  MeasureInventoryRow,
  MetricTrajectory,
  ModuleHandoffPreview,
  ModuleKnowledgePacketSummary,
  ProgramInventoryRow,
  PurposeStatementRow,
  RelationshipEdgeDetailRow,
  RelationshipEvidenceDetail,
  RelationshipNodeRow,
  RelationshipPresetRow,
  RiskInventoryRow,
  SourceRegistryRow,
  StrategicViewRow,
  HandoffTargetModule,
} from "./read-models";

export interface EnterpriseIdentitySummary {
  readonly profileText: string;
  readonly operatingStats: readonly {
    readonly statKey: string;
    readonly label: string;
    readonly value: number | null;
    readonly unit: string | null;
    readonly availabilityState: AvailabilityState;
    readonly evidenceRef: string | null;
  }[];
}

export interface ApplicationInventoryRow {
  readonly applicationId: string;
  readonly name: string;
  readonly applicationType: string;
  readonly domain: string;
  readonly lifecycleState: string;
  readonly owner: string | null;
}

export interface VendorContractRow {
  readonly vendorId: string;
  readonly vendorName: string;
  readonly annualSpend: number | null;
  readonly category: string;
}

export interface RelationshipEdgeRow {
  readonly edgeId: string;
  readonly fromObjectId: string;
  readonly toObjectId: string;
  readonly predicate: string;
  readonly stateScope: "current" | "target";
  readonly evidenceBacked: boolean;
  readonly endpointCatalogBacked: boolean;
}

export interface EvidenceGapRow {
  readonly gapId: string;
  readonly gapType: AvailabilityState;
  readonly summary: string;
  readonly owner: string | null;
  readonly dueDate: string | null;
  readonly affectedDomains: readonly string[];
}

export interface KnowledgeProviderContext {
  readonly tenantKey: string;
  readonly knowledgeBaselineRef: string;
}

/** Extra context a lens-scoped or entity-scoped read needs beyond tenant + baseline. */
export interface LensScopedContext extends KnowledgeProviderContext {
  readonly lensId: string;
}

/** Typed provider surface every Knowledge UI component reads through. Extend as
 * additional target read-model contracts are implemented -- do not add fields a
 * component needs "for now" without a corresponding target contract entry. */
export interface GovernedKnowledgeProvider {
  // -- Brief mode -----------------------------------------------------------

  getEnterpriseIdentity(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<EnterpriseIdentitySummary>>;

  listLenses(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly LensDefinition[]>>;

  getStrategicView(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<StrategicViewRow>>;

  listAbarvaViews(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<readonly StrategicViewRow[]>>;

  listPurposeStatements(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly PurposeStatementRow[]>>;

  listGoals(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<readonly GoalRow[]>>;

  listLeadershipPerspectives(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<readonly LeadershipPerspectiveRow[]>>;

  listIndustryBenchmarks(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<readonly IndustryBenchmarkRow[]>>;

  listIndustryPatterns(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<readonly IndustryPatternRow[]>>;

  listDecisionLanes(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly DecisionLane[]>>;

  listSources(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly SourceRegistryRow[]>>;

  getConditionSummary(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly ConditionTile[]>>;

  // -- Explore mode -----------------------------------------------------------

  listApplications(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly ApplicationInventoryRow[]>>;

  listDataProducts(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly DataProductInventoryRow[]>>;

  listIntegrations(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly IntegrationInventoryRow[]>>;

  listInfrastructure(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly InfrastructureInventoryRow[]>>;

  listVendorContracts(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly VendorContractRow[]>>;

  listPrograms(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly ProgramInventoryRow[]>>;

  listRisks(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly RiskInventoryRow[]>>;

  listMeasures(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly MeasureInventoryRow[]>>;

  // -- Relationships mode -----------------------------------------------------------

  listRelationshipPresets(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly RelationshipPresetRow[]>>;

  listRelationshipNodes(
    ctx: KnowledgeProviderContext,
    focalNodeId: string,
    hops: 1 | 2,
  ): Promise<ConsumptionEnvelope<readonly RelationshipNodeRow[]>>;

  listRelationshipEdges(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly RelationshipEdgeRow[]>>;

  listRelationshipEdgeDetails(
    ctx: KnowledgeProviderContext,
    focalNodeId: string,
    hops: 1 | 2,
  ): Promise<ConsumptionEnvelope<readonly RelationshipEdgeDetailRow[]>>;

  getRelationshipEvidence(
    ctx: KnowledgeProviderContext,
    edgeId: string,
  ): Promise<ConsumptionEnvelope<RelationshipEvidenceDetail>>;

  // -- Evidence & gaps mode -----------------------------------------------------------

  getDecisionReadinessSummary(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<DecisionReadinessSummary>>;

  listDecisions(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly DecisionRow[]>>;

  listDomainCoverage(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly DomainCoverageRow[]>>;

  listContradictions(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly ContradictionRow[]>>;

  listEvidenceGaps(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly EvidenceGapRow[]>>;

  // -- aVa -----------------------------------------------------------

  getModuleKnowledgePacket(
    ctx: KnowledgeProviderContext,
    targetModule: ModuleKnowledgePacketSummary["targetModule"],
  ): Promise<ConsumptionEnvelope<ModuleKnowledgePacketSummary>>;

  listAvaSuggestedQuestions(
    ctx: LensScopedContext,
  ): Promise<ConsumptionEnvelope<readonly AvaSuggestedQuestion[]>>;

  askAva(
    ctx: KnowledgeProviderContext,
    questionText: string,
  ): Promise<ConsumptionEnvelope<AvaAnswer>>;

  searchKnowledge(
    ctx: KnowledgeProviderContext,
    query: string,
  ): Promise<ConsumptionEnvelope<readonly AvaSearchResultGroup[]>>;

  getAvaProviderStatus(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<AvaProviderStatus>>;

  // -- Current vs target / trajectory / decision readiness -----------------------------------------------------------

  getCurrentVsTargetComparison(
    ctx: KnowledgeProviderContext,
    entityId: string,
  ): Promise<ConsumptionEnvelope<CurrentVsTargetComparison>>;

  getMetricTrajectory(
    ctx: KnowledgeProviderContext,
    metricId: string,
  ): Promise<ConsumptionEnvelope<MetricTrajectory>>;

  listDecisionReadinessQuadrant(
    ctx: KnowledgeProviderContext,
  ): Promise<ConsumptionEnvelope<readonly DecisionReadinessQuadrantPoint[]>>;

  // -- Module handoff -----------------------------------------------------------

  getModuleHandoffPreview(
    ctx: KnowledgeProviderContext,
    targetModule: HandoffTargetModule,
  ): Promise<ConsumptionEnvelope<ModuleHandoffPreview>>;
}

function unreconciledMeta(ctx: KnowledgeProviderContext): BaselineMetadata {
  return {
    tenantKey: ctx.tenantKey,
    knowledgeBaselineRef: ctx.knowledgeBaselineRef,
    domainPublicationRef: null,
    projectionContractVersion: "target-v1-unimplemented",
    asOfDate: new Date(0).toISOString(),
    authorityState: "candidate",
    freshnessState: "unknown",
    availabilityState: "not_loaded",
    evidenceCoverage: null,
    contentHash: null,
  };
}

/**
 * Honest stub: every method returns a withheld envelope with a clear reason,
 * never fabricated data. This is what "implement the UI before the data fixes
 * land" actually binds to today -- swap for a real implementation per read model
 * as each one closes in KNOWLEDGE_UI_IMPLEMENTATION_PLAN.md's Phase 5, not
 * all at once.
 */
const UNRECONCILED_WARNING =
  "airline-demo-new is not wired into any product surface yet (SD-15); " +
  "no consumption projection has passed live reconciliation for this read model.";

export function createUnreconciledGovernedKnowledgeProvider(): GovernedKnowledgeProvider {
  const withhold = <T>(ctx: KnowledgeProviderContext) =>
    Promise.resolve(
      withheldEnvelope<T>(unreconciledMeta(ctx), "not_loaded", [
        UNRECONCILED_WARNING,
      ]),
    );

  return {
    // Brief mode
    getEnterpriseIdentity: (ctx) => withhold(ctx),
    listLenses: (ctx) => withhold(ctx),
    getStrategicView: (ctx) => withhold(ctx),
    listAbarvaViews: (ctx) => withhold(ctx),
    listPurposeStatements: (ctx) => withhold(ctx),
    listGoals: (ctx) => withhold(ctx),
    listLeadershipPerspectives: (ctx) => withhold(ctx),
    listIndustryBenchmarks: (ctx) => withhold(ctx),
    listIndustryPatterns: (ctx) => withhold(ctx),
    listDecisionLanes: (ctx) => withhold(ctx),
    listSources: (ctx) => withhold(ctx),
    getConditionSummary: (ctx) => withhold(ctx),

    // Explore mode
    listApplications: (ctx) => withhold(ctx),
    listDataProducts: (ctx) => withhold(ctx),
    listIntegrations: (ctx) => withhold(ctx),
    listInfrastructure: (ctx) => withhold(ctx),
    listVendorContracts: (ctx) => withhold(ctx),
    listPrograms: (ctx) => withhold(ctx),
    listRisks: (ctx) => withhold(ctx),
    listMeasures: (ctx) => withhold(ctx),

    // Relationships mode
    listRelationshipPresets: (ctx) => withhold(ctx),
    listRelationshipNodes: (ctx) => withhold(ctx),
    listRelationshipEdges: (ctx) => withhold(ctx),
    listRelationshipEdgeDetails: (ctx) => withhold(ctx),
    getRelationshipEvidence: (ctx) => withhold(ctx),

    // Evidence & gaps mode
    getDecisionReadinessSummary: (ctx) => withhold(ctx),
    listDecisions: (ctx) => withhold(ctx),
    listDomainCoverage: (ctx) => withhold(ctx),
    listContradictions: (ctx) => withhold(ctx),
    listEvidenceGaps: (ctx) => withhold(ctx),

    // aVa: the packet itself is honestly withheld (no module_knowledge_packet_v1
    // row exists for airline-demo-new -- SD-15). But the REFUSAL that follows
    // from that fact, and the "no suggestion currently gates" fact, are both
    // real and deterministically computable today -- they are not fabricated
    // tenant data, they are honest statements about the packet's absence. Per
    // KNOWLEDGE_AVA_CONTEXT_CONTRACT.md Section 3, this refusal shape is "the
    // single most implementable aVa behavior in the entire surface" and is
    // shipped for real rather than left as a generic withheld stub.
    getModuleKnowledgePacket: (ctx) => withhold(ctx),
    listAvaSuggestedQuestions: (ctx) =>
      Promise.resolve({
        data: [],
        availabilityState: "available" as AvailabilityState,
        authorityState: "accepted",
        freshnessState: "current",
        evidence: [],
        knownGaps: [],
        warnings: [
          "No suggested question currently resolves to a gate-passing answer for airline-demo-new; " +
            "a suggestion is only offered once its underlying evidence would actually resolve.",
        ],
        meta: { ...unreconciledMeta(ctx), availabilityState: "available" },
      }),
    askAva: (ctx, questionText) =>
      Promise.resolve({
        data: {
          questionText,
          refusal: true,
          avaMode: "Investigate",
          ephemeralUntilPromoted: true,
          blocks: [
            {
              key: "Not answerable yet",
              text:
                "This cannot be answered from what is published. airline-demo-new has no reconciled " +
                "module_knowledge_packet_v1 -- the packet aVa would filter and cite from does not exist yet.",
              items: null,
            },
            {
              key: "What is present",
              text:
                "The governed filtering discipline that keeps unreviewed or restricted content out of any " +
                "answer (buildValidatedAgentContextBundle / evaluateGovernedObject) is real, shipped code and " +
                "is already enforced -- it simply has nothing populated to filter yet for this tenant.",
              items: null,
            },
            {
              key: "What is missing",
              items: [
                "A populated module_knowledge_packet_v1 for this tenant and baseline",
                "Accepted facts, relationships, metrics, and known gaps the packet would carry",
                "Free-text intent classification and citation-verified retrieval (today's routing is an admitted keyword-match stub, not a grounding pipeline)",
              ],
              text: null,
            },
            {
              key: "What we will not do",
              text:
                "aVa will not borrow an industry-average or another tenant's figure and present it as this " +
                "airline's number, and will not answer from a best-guess keyword match dressed up as a grounded response.",
              items: null,
            },
          ],
        },
        availabilityState: "available" as AvailabilityState,
        authorityState: "accepted",
        freshnessState: "current",
        evidence: [],
        knownGaps: [],
        warnings: [],
        meta: { ...unreconciledMeta(ctx), availabilityState: "available" },
      }),
    searchKnowledge: (ctx) => withhold(ctx),
    getAvaProviderStatus: (ctx) =>
      Promise.resolve({
        data: {
          modelProviderConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        },
        availabilityState: "available" as AvailabilityState,
        authorityState: "accepted",
        freshnessState: "current",
        evidence: [],
        knownGaps: [],
        warnings: [
          "This is a deterministic runtime-config check (ANTHROPIC_API_KEY presence), " +
            "not a governed knowledge projection -- it is the one field on this page that " +
            "is legitimately computable today without any tenant data reconciliation.",
        ],
        meta: { ...unreconciledMeta(ctx), availabilityState: "available" },
      }),

    // Current vs target / trajectory / decision readiness
    getCurrentVsTargetComparison: (ctx) => withhold(ctx),
    getMetricTrajectory: (ctx) => withhold(ctx),
    listDecisionReadinessQuadrant: (ctx) => withhold(ctx),

    // Module handoff
    getModuleHandoffPreview: (ctx) => withhold(ctx),
  };
}

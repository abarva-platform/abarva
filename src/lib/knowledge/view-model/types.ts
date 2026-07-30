/**
 * KnowledgeUiViewModelAssembler — shared types.
 *
 * See reports/airline-knowledge-provider-reconciliation-2026-07-30/VIEW_MODEL_ASSEMBLER_INTERFACES.md
 * for the full spec this module implements.
 *
 * This module sits strictly ABOVE the real KnowledgeConsumptionProvider / ConsumptionRuntime
 * (src/lib/knowledge/consumption-client, src/lib/knowledge/consumption-contracts) and STRICTLY
 * BELOW the UI (src/components/knowledge/**). It performs no fetch/HTTP/pg of its own; every
 * output field traces to a real ConsumptionEnvelope field or is explicitly marked unavailable via
 * ComponentReadinessState. It must never fabricate a value.
 */

import type {
  AbarVaInterpretationV1,
  BenchmarkV1,
  ConsumptionWarning,
  DepthLevel,
  DomainReadinessV1,
  EnterpriseIdentityV1,
  EntitySummaryV1,
  EvidenceGapV1,
  GovernedMetricValue,
  KnowledgeLens,
  KnowledgeMode,
  LeadershipPerspectiveV1,
  RelationshipEdgeV1,
  RelationshipNodeV1,
  SuggestedQuestionV1,
  TargetV1,
} from "../consumption-contracts";
import type { ConsumptionRuntime } from "../consumption-client";

// ---------------------------------------------------------------------------
// 1. ComponentReadinessState — the 11-value enum (replaces the duplicate
//    provider's 5-value ReadinessState; see reconciliation matrix row 40).
// ---------------------------------------------------------------------------

export const COMPONENT_READINESS_STATES = [
  "ENABLED_AND_PROVEN",
  "DATA_RECONCILED_BUT_UI_UNPROVEN",
  "SOURCE_INCOMPLETE",
  "PROJECTION_UNAVAILABLE",
  "CUBE_UNPROVEN",
  "WITHHELD",
  "RESTRICTED",
  "STALE",
  "DISPUTED",
  "NOT_MEASURED",
  "NOT_ASSESSED",
] as const;
export type ComponentReadinessState =
  (typeof COMPONENT_READINESS_STATES)[number];

const COMPONENT_READINESS_SET: ReadonlySet<string> = new Set(
  COMPONENT_READINESS_STATES,
);
export const isComponentReadinessState = (
  v: unknown,
): v is ComponentReadinessState =>
  typeof v === "string" && COMPONENT_READINESS_SET.has(v);

// ---------------------------------------------------------------------------
// 2. The nine airline lenses (assembler-layer content, not a real provider
//    concept — see interface spec §2 for the provenance note on the two
//    lens ids that are placeholders pending prototype confirmation).
// ---------------------------------------------------------------------------

export const AIRLINE_LENSES = [
  "understand",
  "irops_disruption_recovery",
  "crew",
  "baggage",
  "loyalty",
  "revenue",
  "mro",
  "network_scheduling",
  "safety_compliance",
] as const;
export type AirlineLensId = (typeof AIRLINE_LENSES)[number];

export interface AirlineLensDefinition {
  readonly lensId: AirlineLensId;
  readonly label: string;
  /** Which domainKey(s) this lens principally scopes Explore/Relationships to. */
  readonly primaryDomainKeys: readonly string[];
  /** The nearest real KnowledgeLens re-ranking filter to pass through to queries. */
  readonly nearestRealLens: KnowledgeLens;
}

export interface ResolvedAirlineLens extends AirlineLensDefinition {
  /** True only when at least one primaryDomainKey returned available data for this baseline. */
  readonly resolved: boolean;
}

// ---------------------------------------------------------------------------
// 3. ViewModelEnvelope<T> — every assembler method returns this, never a bare value.
// ---------------------------------------------------------------------------

export interface ViewModelEnvelope<T> {
  readonly readiness: ComponentReadinessState;
  /** Present whenever readiness is not one of the two "safe to render as fact" states. */
  readonly unavailableReason: string | null;
  /** Null whenever readiness would make the data unsafe to render as fact. */
  readonly data: T | null;
  readonly evidenceRefs: readonly string[];
  readonly knownGapRefs: readonly string[];
  readonly asOf: string;
  readonly knowledgeBaselineRef: string;
  readonly warnings: readonly ConsumptionWarning[];
}

// ---------------------------------------------------------------------------
// 4. AssemblerQuery — the input every assembler method takes.
// ---------------------------------------------------------------------------

export interface AssemblerQuery {
  readonly runtime: ConsumptionRuntime;
  readonly tenantKey: string;
  readonly lens?: AirlineLensId;
  readonly depth?: DepthLevel;
  readonly currentTargetScope?: "current" | "target" | "both";
}

// ---------------------------------------------------------------------------
// 5. View-model payload shapes (the `data` inside a ViewModelEnvelope).
//    Each is a thin, renamed/reshaped projection of real contract types —
//    never a parallel re-declaration of governed fields.
// ---------------------------------------------------------------------------

export interface EnterpriseBriefViewModel {
  readonly identity: EnterpriseIdentityV1;
  readonly headlineMetrics: readonly GovernedMetricValue[];
  readonly domains: readonly DomainReadinessV1[];
  readonly topGapRefs: readonly string[];
}

export type EnterpriseProfileViewModel = EnterpriseIdentityV1;

export interface StrategicContextViewModel {
  readonly interpretation: AbarVaInterpretationV1 | null;
  readonly lens: AirlineLensId | undefined;
}

export interface LeadershipAgendaViewModel {
  readonly perspectives: readonly LeadershipPerspectiveV1[];
}

export interface IndustryContextViewModel {
  readonly benchmarks: readonly BenchmarkV1[];
  readonly patterns: readonly BenchmarkV1[];
}

export type AbarVaViewViewModel = StrategicContextViewModel;

export interface TopOpportunitiesViewModel {
  readonly targets: readonly TargetV1[];
  readonly domains: readonly DomainReadinessV1[];
}

export interface TopUseCasesViewModel {
  readonly patterns: readonly BenchmarkV1[];
}

export interface DecisionReadinessRollup {
  readonly domainKey: string | null;
  readonly label: string;
  readonly readiness: ComponentReadinessState;
  readonly openGapCount: number | null;
}

export interface DecisionsWaitingViewModel {
  readonly rollups: readonly DecisionReadinessRollup[];
}

export interface ExploreInventoryViewModel {
  readonly domainKey: string;
  readonly entities: readonly EntitySummaryV1[];
  readonly totalCount: number;
}

export interface RelationshipNeighborhoodViewModel {
  readonly focalEntityRefs: readonly string[];
  readonly nodes: readonly RelationshipNodeV1[];
  readonly edges: readonly (RelationshipEdgeV1 & {
    readonly readiness: ComponentReadinessState;
  })[];
  readonly truncated: boolean;
}

export interface EvidenceAndGapsViewModel {
  readonly gaps: readonly EvidenceGapV1[];
  readonly overallEvidenceCoverage: number;
  readonly severityCounts: Record<string, number>;
}

export interface CurrentVsTargetSide {
  readonly readiness: ComponentReadinessState;
  readonly value: GovernedMetricValue | null;
}

export interface CurrentVsTargetViewModel {
  readonly label: string;
  readonly current: CurrentVsTargetSide;
  readonly target: CurrentVsTargetSide;
}

export interface DecisionReadinessViewModel {
  readonly domains: readonly DecisionReadinessRollup[];
  readonly overallEvidenceCoverage: number | null;
}

export interface AvaContextViewModel {
  readonly suggestedQuestions: readonly SuggestedQuestionV1[];
  readonly modelsEnabled: boolean;
}

// ---------------------------------------------------------------------------
// 6. The assembler interface itself.
// ---------------------------------------------------------------------------

export interface KnowledgeUiViewModelAssembler {
  getEnterpriseBrief(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<EnterpriseBriefViewModel>>;
  getEnterpriseProfile(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<EnterpriseProfileViewModel>>;
  getStrategicContext(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<StrategicContextViewModel>>;
  getLeadershipAgenda(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<LeadershipAgendaViewModel>>;
  getIndustryContext(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<IndustryContextViewModel>>;
  getAbarVaView(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<AbarVaViewViewModel>>;
  getTopOpportunities(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<TopOpportunitiesViewModel>>;
  getTopUseCases(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<TopUseCasesViewModel>>;
  getDecisionsWaiting(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<DecisionsWaitingViewModel>>;
  getExploreInventory(
    query: AssemblerQuery & { domainKey: string },
  ): Promise<ViewModelEnvelope<ExploreInventoryViewModel>>;
  getRelationshipNeighborhood(
    query: AssemblerQuery & { focalEntityRefs: string[]; hopDepth: 1 | 2 },
  ): Promise<ViewModelEnvelope<RelationshipNeighborhoodViewModel>>;
  getEvidenceAndGaps(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<EvidenceAndGapsViewModel>>;
  getCurrentVsTarget(
    query: AssemblerQuery & { entityRef?: string },
  ): Promise<ViewModelEnvelope<CurrentVsTargetViewModel>>;
  getDecisionReadiness(
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<DecisionReadinessViewModel>>;
  getAvaContext(
    query: AssemblerQuery & { mode: KnowledgeMode },
  ): Promise<ViewModelEnvelope<AvaContextViewModel>>;
  listAirlineLenses(
    query: AssemblerQuery,
  ): Promise<readonly ResolvedAirlineLens[]>;
}

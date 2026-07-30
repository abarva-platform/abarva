/**
 * Additional target read-model row/domain types for the airline-demo-new Knowledge UI,
 * extending governed-knowledge-provider.ts's original five methods to cover every
 * component in KNOWLEDGE_UI_DATA_BINDING_MATRIX.csv (62 rows).
 *
 * Every shape here is named and fielded against
 * reports/airline-knowledge-ui-binding-2026-07-29/KNOWLEDGE_TARGET_READ_MODEL_CONTRACTS.md
 * and KNOWLEDGE_GRAPH_BINDING_CONTRACT.md. Where a matrix row's provider work is
 * genuinely "Not applicable" (docking controls, saved-view links, the graph legend),
 * no type is declared here -- those stay pure UI/local state, per the target
 * read-model contracts doc's own "objects intentionally NOT given a target
 * read-model contract" section.
 *
 * Nothing in this file computes or fabricates a value. It only names the shape a
 * real projection will eventually fill.
 */

import type {
  AuthorityState,
  AvailabilityState,
  ReadinessState,
} from "./types";

// ---------------------------------------------------------------------------
// Brief mode
// ---------------------------------------------------------------------------

/** GAP-09: lens -> canonical BusinessFunction/Capability resolution. A lens
 * remains selectable even when unresolved (matrix row 2's render_gate) -- the
 * `resolved` flag is what downstream Brief content keys off, not the lens's
 * mere presence in this list. */
export interface LensDefinition {
  readonly lensId: string;
  readonly label: string;
  readonly scopeText: string;
  readonly resolved: boolean;
  readonly resolvedBusinessFunctionId: string | null;
}

/** consumption.strategic_interpretation_v1 -- the Brief's headline/lede narrative
 * and the "AbarVa view" interpretive cards both come from this shape, scoped by
 * (tenant, lens, baseline). */
export interface StrategicViewRow {
  readonly viewId: string;
  readonly lensId: string;
  readonly contentClass: "abarva_view" | "candidate_insight";
  readonly headline: string;
  readonly observed: string;
  readonly why: string;
  readonly implication: string;
  readonly metricRefs: readonly string[];
  readonly assumption: string;
  readonly proof: readonly {
    readonly sourceName: string;
    readonly assertion: string;
    readonly reviewState: AuthorityState;
  }[];
}

/** executive_perspective_v1 -- both the Purpose/priorities statements and the
 * leadership-perspective quote cards read from this family; Purpose reads the
 * `statementType` union, Perspectives reads the quote + 4 structured rows. */
export interface PurposeStatementRow {
  readonly statementType: "operating_priority" | "stated_ambition";
  readonly text: string;
  readonly sourceLabel: string;
}

export interface LeadershipPerspectiveRow {
  readonly perspectiveId: string;
  readonly lensId: string;
  readonly who: string;
  readonly meta: string;
  readonly quote: string;
  readonly sensitive: boolean;
  readonly evidenceSupports: string | null;
  readonly evidenceChallenges: string | null;
  readonly stillUncertain: string | null;
  readonly ourReading: string | null;
}

/** Goal is not yet a ratified canonical object type (matrix row 6) -- this shape
 * names the target so the UI can be built against it, not a claim that it exists. */
export interface GoalRow {
  readonly goalId: string;
  readonly title: string;
  readonly detail: string;
  readonly readinessState: ReadinessState;
  readonly lensIds: readonly string[];
  readonly focalGraphKey: string | null;
}

/** consumption.industry_benchmark_v1 -- tenant_value_ref is a pointer, resolved
 * server-side before this row reaches the UI; a null tenantValue means "not
 * measured", never plotted as 0. */
export interface IndustryBenchmarkRow {
  readonly metricId: string;
  readonly metricLabel: string;
  readonly tenantValue: number | null;
  readonly tenantValueAvailability: AvailabilityState;
  readonly cohortMedian: number;
  readonly cohortTopQuartile: number;
  readonly cohortMax: number;
  readonly unit: string;
  readonly badDirection: "high" | "low";
  readonly cohortDefinition: string;
}

/** consumption.industry_pattern_v1 -- applicabilityRating is withheld (null),
 * never defaulted to "low", when linkedGapIds fail to resolve. */
export interface IndustryPatternRow {
  readonly patternId: string;
  readonly title: string;
  readonly body: string;
  readonly applicabilityRating: "high" | "medium" | "low" | null;
  readonly applicabilityRationale: string | null;
  readonly linkedGapIds: readonly string[];
  readonly missingHereText: string | null;
}

/** Decision lanes (Fund / Resolve / Validate / Act) -- a Decision-object-derived
 * grouping (GAP-06's `governance.decision`), never lane-derived client-side. */
export interface DecisionLaneItem {
  readonly decisionId: string;
  readonly title: string;
  readonly meta: string;
  readonly lensIds: readonly string[];
}

export interface DecisionLane {
  readonly laneKey: "fund" | "resolve" | "validate" | "act";
  readonly label: string;
  readonly sublabel: string;
  readonly items: readonly DecisionLaneItem[];
}

/** Condition strip -- one row per tile. `value` is a display string because one
 * tile ("Open proof gaps") must be able to render "Withheld" rather than a
 * number when the gap view is uncertified (matrix row 12). */
export interface ConditionTile {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly sublabel: string;
  readonly attention: boolean;
}

/** consumption.source_registry_summary_v1 */
export interface SourceRegistryRow {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly receivedDate: string | null;
  readonly sourceKind:
    | "structured_extract"
    | "interview"
    | "streaming_feed"
    | "vendor_feed"
    | "narrative";
  readonly sourceState: "accepted" | "partial" | "awaited";
  readonly usedForText: string;
  readonly ownerSteward: string | null;
}

// ---------------------------------------------------------------------------
// Explore mode -- one row type per inventory kind, matching the prototype's
// INVENTORIES constant 1:1 in column intent so the generic table framework can
// stay config-driven rather than hand-built per inventory.
// ---------------------------------------------------------------------------

export type ExploreInventoryKind =
  | "applications"
  | "dataProducts"
  | "integrations"
  | "infrastructure"
  | "vendors"
  | "programs"
  | "risks"
  | "measures";

export interface DataProductInventoryRow {
  readonly dataProductId: string;
  readonly name: string;
  readonly domain: string;
  readonly steward: string | null;
  readonly certificationState: "certified" | "provisional" | "uncertified";
  readonly sensitivity: "internal" | "personal_data" | "restricted";
  readonly consumerCount: number | null;
  readonly refreshCadence: string | null;
  readonly readinessState: string;
}

export interface IntegrationInventoryRow {
  readonly integrationId: string;
  readonly name: string;
  readonly sourceSystem: string;
  readonly targetSystem: string;
  readonly pattern: "api" | "batch" | "streaming";
  readonly criticality: "tier_1" | "tier_2" | "tier_3";
  readonly messagesPerDay: number | null;
  readonly readinessState: string;
}

export interface InfrastructureInventoryRow {
  readonly platformId: string;
  readonly name: string;
  readonly owner: string | null;
  readonly hostingModel:
    | "on_prem"
    | "private_cloud"
    | "aws"
    | "azure"
    | "saas"
    | "hybrid"
    | "edge"
    | "mainframe";
  readonly criticality: "tier_1" | "tier_2" | "tier_3";
  readonly runCostThousands: number | null;
  readonly recoveryObjective: string | null;
  readonly readinessState: string;
}

export interface ProgramInventoryRow {
  readonly programId: string;
  readonly name: string;
  readonly executiveOwner: string;
  readonly supportsGoalId: string | null;
  readonly stage: "proposed" | "planning" | "funded" | "execution";
  readonly fundedThousands: number | null;
  readonly outcomeBaselineState: "baselined" | "not_set";
  readonly readinessState: string;
}

export interface RiskInventoryRow {
  readonly riskId: string;
  readonly title: string;
  readonly owner: string | null;
  readonly severity: "critical" | "high" | "medium";
  readonly controlState: "controlled" | "partial" | "none";
  readonly controlCount: number;
  readonly lastTestedDate: string | null;
  readonly readinessState: string;
}

export interface MeasureInventoryRow {
  readonly metricId: string;
  readonly name: string;
  readonly owner: string;
  readonly currentValue: string | null;
  readonly targetValue: string | null;
  readonly disclosureLevel: "board" | "operational";
  readonly observedDate: string | null;
  readonly readinessState: string;
}

/** Facet/column metadata for the generic InventoryTable -- names the fields a
 * facet or numeric-chart control is *allowed* to bind to. A facet whose field
 * is not populated must be hidden (matrix row "Per-inventory facets/filters"),
 * so this shape carries an `available` flag per facet rather than a bare list. */
export interface InventoryFacetDefinition {
  readonly fieldKey: string;
  readonly label: string;
  readonly options: readonly string[];
  readonly available: boolean;
}

// ---------------------------------------------------------------------------
// Relationships mode
// ---------------------------------------------------------------------------

/** relationship_node_v1, extended per Graph Binding Contract Section 1. A node
 * that fails the render gate (unresolved node_type or endpointCatalogBacked
 * false) still carries enough fields for the UI to render it distinctly --
 * the UI must not simply drop it silently, per Section 1's "if shown at all"
 * language. */
export interface RelationshipNodeRow {
  readonly nodeId: string;
  readonly label: string;
  readonly nodeType: string;
  readonly canonicalObjectTypeResolved: boolean;
  readonly endpointCatalogBacked: boolean;
  readonly authorityState: AuthorityState;
  readonly stateScope: "current" | "target" | null;
  readonly targetApprovalState: "proposed" | "approved" | null;
  readonly isGap: boolean;
  readonly isConflict: boolean;
}

/** relationship_edge_v1, extended per Graph Binding Contract Section 2. */
export interface RelationshipEdgeDetailRow {
  readonly edgeId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly relationshipTypeRef: string | null;
  readonly relationshipTypeResolved: boolean;
  readonly authorityState: AuthorityState;
  readonly endpointCatalogBacked: boolean;
  readonly stateScope: "current" | "target" | null;
  readonly targetApprovalState: "proposed" | "approved" | null;
  readonly isGap: boolean;
  readonly isConflict: boolean;
  readonly isStale: boolean;
}

/** consumption.relationship_evidence_v1, extended per Graph Binding Contract
 * Section 3. Any field left null must render "Not yet captured" in the drawer,
 * never a plausible-looking default. */
export interface RelationshipEvidenceDetail {
  readonly sourceCitation: string;
  readonly confidence: "high" | "medium" | "low" | null;
  readonly reviewState: "pending" | "reviewed" | null;
  readonly authorityStateDetail: "authoritative" | "not_authoritative" | null;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
}

/** A named focal-graph question (the prototype's PRESETS). Operational UI
 * config, not a canonical projection -- but "hide a preset whose focal node
 * does not resolve" (matrix row 28) means the picker still needs a resolution
 * check against real node data, hence `focalNodeResolved` here rather than in
 * a static constant. */
export interface RelationshipPresetRow {
  readonly presetId: string;
  readonly questionText: string;
  readonly focalNodeId: string;
  readonly focalNodeResolved: boolean;
  readonly lensIds: readonly string[];
}

// ---------------------------------------------------------------------------
// Evidence & gaps mode
// ---------------------------------------------------------------------------

export interface DecisionReadinessSummary {
  readonly counts: Readonly<Record<ReadinessState, number>>;
  readonly countsWithheldReason: string | null;
}

export interface DecisionRow {
  readonly decisionId: string;
  readonly title: string;
  readonly readinessState: ReadinessState;
  readonly closingDependencyText: string;
}

export interface DomainCoverageRow {
  readonly domainId: string;
  readonly domainLabel: string;
  readonly coveragePct: number | null;
  readonly freshness: "current" | "ageing" | "not_assessed";
  readonly readinessState: ReadinessState;
  readonly gapCount: number | null;
  readonly gapCountAvailability: AvailabilityState;
  readonly conflictCount: number | null;
  readonly sourceListText: string;
}

/** governance.contradiction (GAP-06, not yet a ratified canonical object). */
export interface ContradictionRow {
  readonly contradictionId: string;
  readonly title: string;
  readonly statementA: string;
  readonly statementASource: string;
  readonly statementB: string;
  readonly statementBSource: string;
  readonly owner: string | null;
  readonly openedDate: string | null;
  readonly downstreamEffectText: string;
}

// ---------------------------------------------------------------------------
// aVa
// ---------------------------------------------------------------------------

/** module_knowledge_packet_v1 -- the gate every aVa answer and every module
 * handoff must pass through before rendering anything but a refusal. */
export interface ModuleKnowledgePacketSummary {
  readonly packetHash: string | null;
  readonly targetModule:
    | "knowledge"
    | "home"
    | "moves"
    | "source"
    | "tower"
    | "intelligence";
  readonly headerResolved: boolean;
  readonly entitiesCarriedText: string | null;
  readonly acceptedFactCount: number | null;
  readonly acceptedRelationshipCount: number | null;
  readonly evidenceSourceCount: number | null;
  readonly openGapsTravellingText: string | null;
  readonly permissionBoundaryText: string | null;
}

export interface AvaSuggestedQuestion {
  readonly questionId: string;
  readonly questionText: string;
  readonly avaMode: "Explain" | "Investigate" | "Compare" | "Act";
  readonly lensIds: readonly string[];
  readonly gatePasses: boolean;
}

export interface AvaAnswerBlock {
  readonly key: string;
  readonly text: string | null;
  readonly items: readonly string[] | null;
}

/** The 6-part answer contract, or the refusal shape when `refusal` is true.
 * `refusal` and a populated answer are mutually exclusive; a consumer must
 * never render blocks from a refusal answer as if they were an accepted
 * grounded claim. */
export interface AvaAnswer {
  readonly questionText: string;
  readonly refusal: boolean;
  readonly avaMode: "Explain" | "Investigate" | "Compare" | "Act";
  readonly blocks: readonly AvaAnswerBlock[];
  readonly ephemeralUntilPromoted: boolean;
}

export interface AvaSearchResultGroup {
  readonly groupLabel: "Systems" | "Measures" | "Perspectives" | "Open gaps";
  readonly indexed: boolean;
  readonly results: readonly {
    readonly name: string;
    readonly matchedOn: string;
  }[];
}

/** Deterministic, server-checkable: is a reasoning model provider configured at
 * all. This is a real boolean this UI is allowed to compute (env var presence
 * is config, not Azure/Postgres data-plane state) -- it powers the
 * "Models off" banner honestly instead of leaving it as another stub. */
export interface AvaProviderStatus {
  readonly modelProviderConfigured: boolean;
}

// ---------------------------------------------------------------------------
// Current vs target / trajectory / decision-readiness quadrant
// ---------------------------------------------------------------------------

export interface CurrentVsTargetPanelSide {
  readonly label: string;
  readonly stateScope: "current" | "target";
  readonly targetApprovalState: "proposed" | "approved" | null;
  readonly headline: string;
  readonly lines: readonly { readonly key: string; readonly value: string }[];
}

export interface CurrentVsTargetComparison {
  readonly entityId: string;
  readonly current: CurrentVsTargetPanelSide;
  readonly target: CurrentVsTargetPanelSide | null;
}

export interface TrajectoryPoint {
  readonly period: string;
  readonly value: number;
  readonly isProjected: boolean;
}

export interface MetricTrajectory {
  readonly metricId: string;
  readonly metricLabel: string;
  readonly unit: string;
  readonly boardTargetValue: number | null;
  readonly points: readonly TrajectoryPoint[];
  readonly projectionFundedInitiativeRef: string | null;
}

export interface DecisionReadinessQuadrantPoint {
  readonly programId: string;
  readonly label: string;
  readonly evidenceReadinessPct: number;
  readonly valueAtStakePct: number;
  readonly valueAtStakeIsEstimated: boolean;
}

// ---------------------------------------------------------------------------
// Module handoff
// ---------------------------------------------------------------------------

export type HandoffTargetModule = "Moves" | "Tower" | "Source" | "Intelligence";

export interface ModuleHandoffPreview {
  readonly targetModule: HandoffTargetModule;
  readonly businessProblem: string;
  readonly scopeCarried: string;
  readonly insightReference: string | null;
  readonly entitiesCarriedText: string;
  readonly knowledgeSnapshotRef: string;
  readonly evidenceCarriedText: string;
  readonly readinessText: string;
  readonly knownGapsTravellingText: string;
  readonly confirmEnabled: boolean;
  readonly confirmDisabledReason: string | null;
}

/**
 * Scenario effects. Each FixtureScenario decorates a ConsumptionEnvelope's
 * governance metadata + warnings, and (for withheld/not_loaded) substitutes an
 * emptied payload so no content leaks. This is how one base pack demonstrates
 * all ten required conditions honestly.
 */

import type {
  AuthorityState,
  AvailabilityState,
  ConsumptionWarning,
  EnterpriseBriefV1,
  EntityDetailV1,
  EntityExploreResultV1,
  EvidenceGapResultV1,
  FreshnessState,
  KnowledgeSearchResultV1,
  RelationshipProjectionV1,
} from "../consumption-contracts";
import type { FixtureScenario } from "./types";

export interface ScenarioEffect {
  availabilityState?: AvailabilityState;
  authorityState?: AuthorityState;
  freshnessState?: FreshnessState;
  /** Days to backdate asOf, to demonstrate staleness. */
  backdateDays?: number;
  warnings: ConsumptionWarning[];
  /** Replace payload with an emptied one (no content). */
  suppressData?: boolean;
  /** aVa reasoning unavailable — deterministic page must still fully render. */
  modelsDisabled?: boolean;
  /** Provider serves last-known-good after an upstream API failure. */
  lastKnownGood?: boolean;
}

export const SCENARIO_EFFECTS: Record<FixtureScenario, ScenarioEffect> = {
  normal: { warnings: [] },
  partial: {
    availabilityState: "available",
    warnings: [
      { code: "partial_domain", message: "Some domains are not yet loaded; figures shown are partial." },
    ],
  },
  stale: {
    availabilityState: "stale",
    freshnessState: "stale",
    backdateDays: 45,
    warnings: [
      { code: "conflict_detected", message: "This snapshot is stale; a refresh is pending.", scope: "baseline" },
    ],
  },
  conflicting: {
    availabilityState: "conflicting",
    warnings: [
      { code: "conflict_detected", message: "Sources disagree; no single value is asserted." },
    ],
  },
  withheld: {
    availabilityState: "withheld",
    suppressData: true,
    warnings: [
      { code: "evidence_withheld", message: "Required evidence is restricted; content is withheld." },
    ],
  },
  not_measured: {
    availabilityState: "not_measured",
    warnings: [
      { code: "not_measured", message: "The underlying source has not been measured. Values are shown as no-value, never zero." },
    ],
  },
  not_loaded: {
    availabilityState: "not_loaded",
    freshnessState: "not_loaded",
    suppressData: true,
    warnings: [
      { code: "not_loaded", message: "This projection has not been loaded for the active baseline." },
    ],
  },
  models_disabled: {
    modelsDisabled: true,
    warnings: [
      { code: "models_disabled", message: "aVa reasoning is disabled. The deterministic page is fully available." },
    ],
  },
  newer_baseline: {
    warnings: [
      { code: "newer_baseline_available", message: "A newer Knowledge Baseline is available. You are viewing the active one." },
    ],
  },
  api_failure_lkg: {
    freshnessState: "stale",
    lastKnownGood: true,
    warnings: [
      { code: "last_known_good", message: "The live API is unavailable. Showing the last known-good response." },
    ],
  },
};

export const scenarioDisablesModels = (s: FixtureScenario): boolean =>
  Boolean(SCENARIO_EFFECTS[s].modelsDisabled);

// --- Emptied payloads (used when suppressData) — structurally valid, no content ---

export const emptyBrief = (): EnterpriseBriefV1 => ({
  identity: {
    organizationId: null,
    displayName: null,
    industry: null,
    revenue: null,
    employees: null,
    footprint: null,
    footprintState: "withheld",
  },
  headlineMetrics: [],
  interpretation: null,
  perspectives: [],
  benchmarks: [],
  targets: [],
  domains: [],
  topGapRefs: [],
});

export const emptyExplore = (): EntityExploreResultV1 => ({
  domainKey: null,
  domains: [],
  entities: [],
  totalCount: 0,
  page: 1,
  pageSize: 25,
});

export const emptyEvidence = (): EvidenceGapResultV1 => ({
  domainKey: null,
  gaps: [],
  overallEvidenceCoverage: 0,
  severityCounts: { low: 0, medium: 0, high: 0, critical: 0 },
});

export const emptyRelationships = (): RelationshipProjectionV1 => ({
  focalEntityRefs: [],
  nodes: [],
  edges: [],
  evidenceByEdge: {},
  truncated: false,
  aggregationApplied: false,
  omittedNodeCount: 0,
  acceptedEdgeCount: 0,
  candidateEdgeCount: 0,
  openGapCount: 0,
});

export const emptySearch = (query: string): KnowledgeSearchResultV1 => ({
  query,
  hits: [],
  totalCount: 0,
  page: 1,
  pageSize: 25,
});

export const emptyEntityDetail = (entityRef: string): EntityDetailV1 => ({
  entity: {
    entityRef,
    entityType: "unknown",
    displayName: "",
    domainKey: "",
    availabilityState: "withheld",
    fields: [],
    evidenceRefs: [],
  },
  fields: [],
  perspectives: [],
  benchmarks: [],
  relatedEntityRefs: [],
  gapRefs: [],
});

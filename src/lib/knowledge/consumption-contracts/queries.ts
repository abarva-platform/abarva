/**
 * Query input types for the KnowledgeConsumptionProvider.
 *
 * A query never carries a raw tenant key trusted from the browser. The server
 * seam (requireTenancy) resolves the authenticated tenant; the provider is
 * handed a resolved, validated `tenantKey`. The admin fixture selector is the
 * only place a tenant key is chosen by a human, and only for fixture_only data.
 */

/** The four primary modes. The left navigation changes contextually per mode. */
export const KNOWLEDGE_MODES = [
  "brief",
  "explore",
  "relationships",
  "evidence",
] as const;
export type KnowledgeMode = (typeof KNOWLEDGE_MODES)[number];

/** Global depth control. Changes level of detail consistently across the page. */
export const DEPTH_LEVELS = ["executive", "analytical", "proof"] as const;
export type DepthLevel = (typeof DEPTH_LEVELS)[number];

/**
 * Business-problem lenses re-rank the same governed Knowledge; they never
 * create a separate truth. `none` is the unfiltered baseline ranking.
 */
export const KNOWLEDGE_LENSES = [
  "none",
  "cost_efficiency",
  "risk_resilience",
  "growth_innovation",
  "data_ai_readiness",
  "vendor_consolidation",
] as const;
export type KnowledgeLens = (typeof KNOWLEDGE_LENSES)[number];

/** Current vs target state scope — a target must never render as current. */
export type CurrentTargetScope = "current" | "target" | "both";

/** Fields shared by every query — resolved server-side, never browser-trusted. */
export interface BaseQuery {
  tenantKey: string;
  /** Pins the read to one active baseline; provider may default to the active one. */
  knowledgeBaselineRef?: string;
  depth?: DepthLevel;
  lens?: KnowledgeLens;
}

export interface EnterpriseBriefQuery extends BaseQuery {
  currentTargetScope?: CurrentTargetScope;
}

export interface EntityExploreQuery extends BaseQuery {
  /** Domain key (enterprise/technology/data/vendors/risks/programs) or null for landing. */
  domainKey?: string | null;
  /** Free-text filter within the domain. */
  search?: string;
  filters?: Record<string, string[]>;
  /** Pagination — the UI must never mount 1,000+ rows at once. */
  page?: number;
  pageSize?: number;
}

export interface EntityDetailQuery extends BaseQuery {
  entityRef: string;
}

export interface EvidenceGapQuery extends BaseQuery {
  /** Optionally scope gaps to one domain. */
  domainKey?: string | null;
  /** Filter by minimum severity. */
  minSeverity?: EvidenceGapSeverity;
}

export type EvidenceGapSeverity = "low" | "medium" | "high" | "critical";

export interface KnowledgeSearchQuery extends BaseQuery {
  query: string;
  page?: number;
  pageSize?: number;
}

export interface SuggestedQuestionQuery extends BaseQuery {
  mode: KnowledgeMode;
  /** Entities currently in focus, to tailor the suggestions. */
  focalEntityRefs?: string[];
}

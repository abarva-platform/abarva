/**
 * aVa reasoning-path contract. aVa is a SEPARATE path from the deterministic
 * page. The page (load, navigation, filters, charts, search, relationships,
 * evidence, gaps, quotes, benchmarks) must work with all model providers
 * disabled; only aVa reasoning disappears.
 *
 * aVa output is ephemeral, never automatically accepted Knowledge, cannot alter
 * displayed facts, cannot manufacture missing numbers, and must identify
 * evidence, limits and what would change the answer. When required evidence is
 * unavailable, aVa refuses rather than estimating.
 *
 * The packet shape follows AVA_KNOWLEDGE_PACKET_MAPPING.xlsx.
 */

import type { DepthLevel, KnowledgeLens, KnowledgeMode } from "./queries";

export type AvaIntent = "explain" | "investigate" | "compare" | "act";

/**
 * The context aVa receives. Scope is inherited from the current lens, filters,
 * snapshot and permission boundary — aVa cannot see beyond the page's boundary.
 * Mirrors AVA_KNOWLEDGE_PACKET_MAPPING (packet_header/tenant_context/facts/
 * relationships/metrics/evidence/gaps/safety).
 */
export interface AvaKnowledgePacket {
  // packet_header
  tenantKey: string;
  knowledgeBaselineRef: string;
  domainPublicationVersions: Record<string, string>;
  consumptionProjectionVersions: Record<string, string>;
  /** Required only when metrics are queried. */
  cubeSemanticModelVersion: string | null;

  // page context
  mode: KnowledgeMode;
  lens: KnowledgeLens;
  depth: DepthLevel;
  currentTargetScope: "current" | "target" | "both";
  focalEntityRefs: string[];
  activeFilters: Record<string, string[]>;
  /** Opaque handle for the caller's permission boundary; aVa cannot widen it. */
  permissionBoundaryRef: string;

  // tenant_context
  executivePerspectiveRefs: string[];

  // facts — only accepted/published, never working candidates
  acceptedFactRefs: string[];

  // relationships — accepted edges with evidence + endpoint validation
  relationshipEdgeRefs: string[];

  // metrics — required when metrics used
  metricQueryHashes: string[];

  // evidence — displayable refs, not hidden truth
  evidenceRefs: string[];

  // gaps — missing/withheld/conflicting surfaced plainly
  knownGapRefs: string[];

  // safety — records exclusion without leaking restricted content
  blockedSourceRefs: string[];
}

export interface AvaRequest {
  intent: AvaIntent;
  question: string;
  packet: AvaKnowledgePacket;
}

/** A single structured section of an aVa answer (stable structure per prototype). */
export interface AvaAnswerSection {
  heading: string;
  body: string;
  evidenceRefs: string[];
}

export type AvaOutcome = "answered" | "refused" | "partial";

/**
 * aVa's answer. Ephemeral by construction: `promoted` is always false from the
 * reasoning path — promotion to accepted Knowledge is a separate governed action
 * that this contract does not perform.
 */
export interface AvaAnswer {
  outcome: AvaOutcome;
  /** Stable answer structure; empty when refused. */
  sections: AvaAnswerSection[];
  /** Evidence aVa relied on — a subset of the packet's evidenceRefs. */
  evidenceRefs: string[];
  /** Limits of the answer aVa must state. */
  limitations: string[];
  /** What additional evidence would change the answer. */
  whatWouldChangeIt: string[];
  /** Populated when outcome==="refused" — e.g. required evidence unavailable. */
  refusalReason: string | null;
  /** Always false: an aVa answer is never automatically accepted Knowledge. */
  promoted: false;
}

/**
 * Provider for the aVa reasoning path. A null implementation (models disabled)
 * is a first-class state — the deterministic page renders fully without it.
 */
export interface AvaReasoningProvider {
  /** True when a model provider is configured and reasoning is available. */
  isAvailable(): boolean;
  ask(request: AvaRequest): Promise<AvaAnswer>;
}

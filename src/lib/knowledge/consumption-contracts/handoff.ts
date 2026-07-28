/**
 * Module handoff PREVIEW contract. Handoffs are previews only. The preview
 * shows what would travel to a receiving module; it does NOT create a Move,
 * Source event or Tower action. The receiving module is intended to retain
 * references, not become another truth store. No governed backend action is
 * invoked here.
 */

import type { KnowledgeLens } from "./queries";

export type ReceivingModule =
  | "source"
  | "moves"
  | "tower"
  | "intelligence";

export type HandoffReadinessState =
  | "ready"
  | "blocked_missing_evidence"
  | "blocked_partial_baseline"
  | "blocked_conflicting"
  | "not_applicable";

export interface ModuleHandoffQuery {
  tenantKey: string;
  knowledgeBaselineRef: string;
  receivingModule: ReceivingModule;
  selectedEntityRefs: string[];
  filters?: Record<string, string[]>;
  lens?: KnowledgeLens;
  /** The candidate insight / interpretation that motivates the handoff. */
  insightRef?: string | null;
}

/** What travels — references only, plus a readiness verdict. */
export interface ModuleHandoffPreviewV1 {
  receivingModule: ReceivingModule;
  /** Human summary of the scope that would travel. */
  scope: string;
  selectedEntityRefs: string[];
  filters: Record<string, string[]>;
  lens: KnowledgeLens;
  insightRef: string | null;

  knowledgeBaselineRef: string;
  domainPublicationVersions: Record<string, string>;
  evidenceRefs: string[];
  knownGapRefs: string[];

  readinessState: HandoffReadinessState;
  /** Plain-language reason when not ready. */
  readinessDetail: string | null;
}

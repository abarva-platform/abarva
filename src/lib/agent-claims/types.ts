// Claim & Citation Validation · contract (PR-4).
//
// Post-response validation: detect the major claims an answer made, map each to
// supporting evidence in the context-bundle trace, and flag the unsupported
// ones. Also validates pattern citations against the tenant's grounding
// namespace (not just global existence) and detects cross-tenant leakage.
//
// Pure + injectable: live pattern-existence checks come through an injected
// PatternCatalog so the library stays testable without a DB.

import type { TraceRetrievedObject } from '@/lib/agent-trace/types';
import type {
  NamespaceFinding,
  RemediationLane,
  TenantLeakageFinding,
  UnsupportedClaim,
} from '@/lib/agent-eval/types';

export type {
  NamespaceFinding,
  RemediationLane,
  TenantLeakageFinding,
  UnsupportedClaim,
} from '@/lib/agent-eval/types';

export const CLAIM_TYPES = [
  'value_claim',
  'system_vendor_claim',
  'architecture_claim',
  'kpi_outcome_claim',
  'sourcing_recommendation',
  'risk_failure_mode_claim',
  'next_action_recommendation',
  'leadership_org_claim',
  'company_scale_claim',
  'technology_stack_claim',
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

/** Factual claim types that MUST be backed by evidence (else auto-fail). */
export const CRITICAL_CLAIM_TYPES: readonly ClaimType[] = [
  'value_claim',
  'system_vendor_claim',
  'architecture_claim',
  'kpi_outcome_claim',
  'leadership_org_claim',
  'company_scale_claim',
  'technology_stack_claim',
] as const;

export interface DetectedClaim {
  text: string;
  type: ClaimType;
}

/** Per-claim verdict with the evidence (if any) that supports it. */
export interface ClaimVerdict {
  claim: DetectedClaim;
  supported: boolean;
  /** ids of trace objects that support the claim. */
  supportingObjectIds: string[];
  /** how it was supported, when it was. */
  supportBasis:
    | 'trace_evidence'
    | 'stated_assumption'
    | 'advisory_no_citation_required'
    | null;
}

/** A pattern catalog the harness injects (live Azure-backed at runtime). */
export interface PatternCatalogEntry {
  id: string;
  /** grounding namespaces / industry overlays this pattern belongs to. */
  namespaces: string[];
}

export interface PatternCatalog {
  /** Case-insensitive lookup. Returns null when the id exists nowhere. */
  lookup(patternId: string): PatternCatalogEntry | null;
}

export interface ValidateInput {
  trace: {
    tenant_key: string | null;
    retrieved_tenant_context: TraceRetrievedObject[];
    retrieved_corpus_patterns: TraceRetrievedObject[];
    retrieved_artifacts: TraceRetrievedObject[];
    citation_objects_emitted: string[];
  };
  answerText: string;
  /** Pattern ids the answer cited (defaults to trace.citation_objects_emitted). */
  citedPatternIds?: string[];
  /** Injected live pattern catalog for phantom detection (optional). */
  patternCatalog?: PatternCatalog;
  /** Other tenants to scan for leakage (defaults to canonical roster minus own). */
  tenantRoster?: Array<{ key: string; name: string }>;
}

export interface ClaimValidationResult {
  claims: ClaimVerdict[];
  unsupportedClaims: UnsupportedClaim[];
  namespaceFindings: NamespaceFinding[];
  tenantLeakage: TenantLeakageFinding[];
  /** 'pass' | 'fail' — fail when any critical claim is unsupported or any
   *  phantom/cross-namespace pattern citation exists. */
  claimValidationStatus: 'pass' | 'fail';
  /** 'pass' | 'fail' — fail when any cross-tenant leakage is detected. */
  tenantIsolationStatus: 'pass' | 'fail';
}

/** Default remediation lane per claim type when unsupported. */
export const CLAIM_FIX_LANE: Record<ClaimType, RemediationLane> = {
  value_claim: 'answer_prompt_synthesis',
  kpi_outcome_claim: 'provenance_source_state',
  system_vendor_claim: 'ingestion_data_load',
  architecture_claim: 'ingestion_data_load',
  technology_stack_claim: 'ingestion_data_load',
  company_scale_claim: 'ingestion_data_load',
  leadership_org_claim: 'ingestion_data_load',
  sourcing_recommendation: 'binder_pattern_validation',
  risk_failure_mode_claim: 'answer_prompt_synthesis',
  next_action_recommendation: 'answer_prompt_synthesis',
};

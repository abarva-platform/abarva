// SourceContextBundleTrace — the governed reasoning-chain trace for every
// Source/Sentinel/Nexus answer. It proves the COMPLETE chain, not just that
// "retrieval returned sources": tenant + archetype + phase resolution → evidence
// requirements → retrieval → governance gate (eligible vs excluded-by-reason) →
// current-fact accounting → grounding decision → model-call gate → answer claim
// mapping → citations → tenant-leakage check.
//
// Hard rule: a governed Source model call (Claude/OpenAI) is allowed ONLY when a
// trace exists and `model_call_allowed === true` (or an explicit warning override
// is recorded). Asserting this contract is how we keep ungoverned prompts away
// from the model.

export type GroundingStatus = 'pass' | 'warn' | 'block';

/** Why a retrieved/candidate object was excluded from the governed bundle. */
export interface ExcludedByReason {
  wrong_tenant: number;
  not_reviewed: number;
  blocked: number;
  quarantined: number;
  restricted: number;
  superseded: number;
  retired: number;
  missing_source_basis: number;
  missing_confidence: number;
  not_indexed: number;
  not_retrievable: number;
  not_citation_ready: number;
}

export interface RetrievalQueryExecuted {
  query: string;
  index: string;
  filter: string; // OData tenant filter actually applied
  returned: number;
}

export interface ClaimMapEntry {
  claim: string;
  /** 'fact' | 'chunk' | 'corpus' | 'assumption' | 'unsupported' */
  basis: 'fact' | 'chunk' | 'corpus' | 'assumption' | 'unsupported';
  citation: string | null; // source_uri / chunk_id / record_id when supported
}

export interface CitationObject {
  chunk_id: string;
  record_id: string | null;
  source_segment: string | null;
  source_uri: string | null; // citation pointer (blob/source path)
  source_basis: string | null;
  confidence: number | null;
  snippet: string;
}

/** The wisdom rubric (0–5 each) — does the answer read like a senior advisor? */
export interface WisdomScore {
  tenant_grounding: number;
  archetype_grounding: number;
  evidence_completeness: number;
  sourcing_judgment: number;
  pricing_commercial_specificity: number;
  risk_awareness: number;
  deliverable_usefulness: number;
  source_discipline: number;
  no_hallucination: number;
  overall: number; // mean
}

export interface SourceContextBundleTrace {
  trace_id: string;
  question_id: string;
  question: string;

  tenant_id: string;
  tenant_key: string;
  source_event_id: string | null;
  source_event_archetype: string;
  user_intent: string;
  sourcing_phase: string;

  evidence_requirements_resolved: string[];
  eligible_evidence_families: string[];
  missing_evidence_families: string[];

  retrieval_queries_executed: RetrievalQueryExecuted[];
  tenant_context_objects_retrieved: number;
  corpus_patterns_retrieved: number;
  vendor_contracts_retrieved: number;
  financial_facts_retrieved: number;
  sla_kpi_facts_retrieved: number;
  itsm_telemetry_facts_retrieved: number;
  org_workforce_facts_retrieved: number;
  application_system_facts_retrieved: number;
  artifacts_retrieved: number;

  excluded_objects_by_reason: ExcludedByReason;

  current_fact_count: number;
  superseded_fact_count_excluded: number;
  citation_ready_count: number;
  confidence_distribution: Record<string, number>; // e.g. {high, medium, low}
  source_basis_distribution: Record<string, number>; // by source file/segment

  grounding_status: GroundingStatus;
  grounding_warnings: string[];

  model_input_context_hash: string;
  model_call_allowed: boolean;
  model_call_override_warning: string | null;

  response_id: string | null;
  claims_detected: number;
  claims_supported: number;
  claims_unsupported: number;
  claim_map: ClaimMapEntry[];
  citations_emitted: CitationObject[];
  evidence_drawer_objects_emitted: number;

  tenant_leakage_status: 'clean' | 'leak_detected';
  wisdom_score: WisdomScore | null;
}

/** Decide the grounding status from required vs eligible families. */
export function deriveGrounding(
  required: string[],
  eligibleFamilies: string[],
): { status: GroundingStatus; warnings: string[]; missing: string[] } {
  const have = new Set(eligibleFamilies);
  const missing = required.filter((f) => !have.has(f));
  const warnings: string[] = [];
  if (eligibleFamilies.length === 0) {
    return { status: 'block', warnings: ['no eligible (agent_ready) evidence for this tenant/archetype'], missing };
  }
  if (missing.length > 0) {
    warnings.push(`missing required evidence families: ${missing.join(', ')}`);
    return { status: 'warn', warnings, missing };
  }
  return { status: 'pass', warnings, missing };
}

/**
 * The contract gate: a governed model call is allowed only when the trace says so.
 * block → never call; warn → call but the answer MUST state the gaps; pass → call.
 */
export function modelCallAllowed(status: GroundingStatus): boolean {
  return status !== 'block';
}

// Agent Context-Bundle Trace · canonical contract
//
// Every governed Nexus / Sentinel response emits one AgentContextTrace. The
// trace is the audit spine that proves Claude reasoning is DOWNSTREAM of
// retrieval / context-bundle assembly, records what was included vs excluded
// (and why), and carries the post-response validation verdicts that PR-3
// (wisdom rubric) and PR-4 (claim/citation validation) attach.
//
// Truth-standard discipline (AGENTS.md): the trace stores object IDs, source
// IDs, chunk IDs, record IDs, pattern IDs, artifact IDs, and policy decisions.
// It does NOT store raw PHI/PII or full prompt text by default — the model
// input is hashed, and the redacted trace mode strips excerpts. See
// `redaction.ts`.

/** Which governed agent produced the response. */
export type TraceAgent = 'ava' | 'nexus' | 'sentinel';

/** Surface the response was served from. */
export type TraceSurface =
  | 'moves'
  | 'intelligence'
  | 'source'
  | 'tower'
  | 'chat'
  | 'unknown';

/**
 * Why an eligible-looking context object was NOT placed in the bundle. These
 * are the governance exclusion reasons the brief requires us to record so a
 * reviewer can see "this object existed and was deliberately withheld".
 */
export type ExclusionReason =
  | 'not_reviewed' // pending approval / not yet agent-ready
  | 'blocked' // hard policy block (e.g. l4_raw_not_allowed)
  | 'restricted' // restricted classification, policy did not permit
  | 'tenant_mismatch' // belongs to another tenant
  | 'missing_policy' // no policy decision available, fail-closed
  | 'low_confidence' // below the retrieval confidence floor
  | 'unsupported_namespace'; // pattern outside the tenant's grounding namespace

/** A context object that was retrieved and placed into the bundle. */
export interface TraceRetrievedObject {
  /** Stable object/source/chunk/record/pattern/artifact id. */
  id: string;
  /** Coarse kind so reviewers can group without raw text. */
  kind:
    | 'tenant_context'
    | 'structured_fact'
    | 'context_record'
    | 'corpus_pattern'
    | 'artifact'
    | 'evidence'
    | 'kpi_baseline'
    | 'source_event'
    | 'worldview'
    | 'graph'
    | 'surface_context';
  /** Short non-sensitive label (e.g. pattern slug, segment id). */
  label?: string;
  /** 0..1 retrieval/source confidence when known. */
  confidence?: number | null;
  /** Where the object originated (persisted vs fixture vs derived). */
  sourceBasis?: string | null;
  /** Grounding namespace for patterns (industry scope), when applicable. */
  namespace?: string | null;
}

/** A context object that was excluded, with the governance reason. */
export interface TraceExcludedObject {
  id: string;
  kind: TraceRetrievedObject['kind'];
  reason: ExclusionReason;
  /** Optional free-text detail (never raw source text — a status/string). */
  detail?: string | null;
  namespace?: string | null;
}

/** Distribution of source confidence across the retrieved set. */
export interface TraceConfidenceDistribution {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  /** Bucketed counts for quick scanning. */
  buckets: { low: number; medium: number; high: number }; // <0.4 / 0.4-0.7 / >0.7
}

/**
 * Deterministic grounding report — proves the assembly state the model saw.
 * This is computed BEFORE the model call and is the core "Claude is
 * downstream" evidence.
 */
export interface TraceGroundingReport {
  /** True if assembly completed before the model was invoked. */
  retrievalPrecededModel: true;
  /** Total objects assembled into the bundle. */
  bundleObjectCount: number;
  /** Counts by kind for quick triage. */
  byKind: Partial<Record<TraceRetrievedObject['kind'], number>>;
  /** Counts of exclusions by reason. */
  excludedByReason: Partial<Record<ExclusionReason, number>>;
  /** Whether any tenant-grounded evidence was present. */
  hasTenantEvidence: boolean;
  /** Whether any approved corpus pattern was present. */
  hasApprovedPattern: boolean;
  /** Context-bundle state when the platform adapter ran. */
  bundleState?: string | null;
  /** Context-bundle overall quality score (0..1) when available. */
  bundleQuality?: number | null;
}

/** Post-response validation verdicts (filled by PR-3 / PR-4 / leakage tests). */
export type TraceValidationStatus =
  | 'pending'
  | 'pass'
  | 'fail'
  | 'not_run';

/** The full trace record. Field names mirror the brief 1:1. */
export interface AgentContextTrace {
  /** Stable id of the question/turn this trace describes. */
  question_id: string;
  /** Resolved tenant identity. */
  tenant_id: string | null;
  tenant_key: string | null;
  agent: TraceAgent;
  surface: TraceSurface;
  /** Classified user intent (model/heuristic intent label). */
  user_intent: string | null;
  /** Resolved phase or workflow stage when applicable. */
  resolved_phase: string | null;
  /** Datasets/domains the broker considered eligible for this request. */
  eligible_datasets: string[];
  /** Retrieved tenant context objects (facts, records, chunks). */
  retrieved_tenant_context: TraceRetrievedObject[];
  /** Retrieved corpus / industry patterns. */
  retrieved_corpus_patterns: TraceRetrievedObject[];
  /** Retrieved artifacts / evidence objects. */
  retrieved_artifacts: TraceRetrievedObject[];
  /** Objects excluded with governance reason. */
  excluded_objects: TraceExcludedObject[];
  /** Count of distinct source bases backing the answer. */
  source_basis_count: number;
  confidence_distribution: TraceConfidenceDistribution;
  /** Domains/topics the user asked about for which no evidence was found. */
  missing_context: string[];
  grounding_report: TraceGroundingReport;
  /** sha256 of the full model input (system + user). Never the raw text. */
  model_input_hash: string;
  /** Id of the produced response (turn id / answer id). */
  response_id: string | null;
  /** Citation/evidence object ids the answer emitted. */
  citation_objects_emitted: string[];
  /** Overall validation gate (PR-3). */
  validation_status: TraceValidationStatus;
  /** Claim/citation validation gate (PR-4). */
  claim_validation_status: TraceValidationStatus;
  /** Tenant-isolation gate (leakage tests). */
  tenant_isolation_status: TraceValidationStatus;
  /** Trace schema version + emission metadata. */
  trace_version: string;
  /** True when excerpts/labels have been stripped (redacted mode). */
  redacted: boolean;
  /** ISO timestamp the trace was emitted. */
  emitted_at: string;
}

export const AGENT_TRACE_VERSION = 'agent_context_trace_v1';

export const ALL_EXCLUSION_REASONS: readonly ExclusionReason[] = [
  'not_reviewed',
  'blocked',
  'restricted',
  'tenant_mismatch',
  'missing_policy',
  'low_confidence',
  'unsupported_namespace',
] as const;

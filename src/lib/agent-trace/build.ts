// Pure builders that map the real Nexus / Sentinel bundle objects into an
// AgentContextTrace. Kept dependency-light (types only) so the governance
// mapping is fully unit-testable without a DB, Clerk, or the model.

import {
  AGENT_TRACE_VERSION,
  type AgentContextTrace,
  type ExclusionReason,
  type TraceConfidenceDistribution,
  type TraceExcludedObject,
  type TraceGroundingReport,
  type TraceRetrievedObject,
} from './types';

// ── Structural (duck-typed) inputs ───────────────────────────────────────
// We intentionally type these structurally rather than importing the heavy
// Nexus/Sentinel modules, so this file stays pure and cheap to test.

/** Nexus Source (intelligence/types.ts Source) — only the fields we read. */
export interface RawNexusSource {
  id: string;
  type:
    | 'pattern'
    | 'benchmark'
    | 'vendor'
    | 'regulation'
    | 'framework'
    | 'research'
    | 'news'
    | 'engagement'
    | 'emergent'
    | 'client_fact';
  name: string;
  confidence?: 'high' | 'medium' | 'low';
}

/** Sentinel AskSource — only the fields we read. */
export interface RawAskSource {
  type:
    | 'VENDOR'
    | 'PATTERN'
    | 'TOPIC'
    | 'RESEARCH'
    | 'REGULATION'
    | 'BENCHMARK'
    | 'INSIGHT'
    | 'GENERAL'
    | 'WORLDVIEW'
    | 'TENANT'
    | 'GRAPH'
    | 'SURFACE';
  name: string;
  id: string | null;
  confidence?: number;
}

const NEXUS_CONFIDENCE_NUMERIC: Record<string, number> = {
  high: 0.85,
  medium: 0.55,
  low: 0.25,
};

export function nexusConfidenceToNumeric(c?: string | null): number | null {
  if (!c) return null;
  return NEXUS_CONFIDENCE_NUMERIC[c] ?? null;
}

// ── kind classification ──────────────────────────────────────────────────

function nexusKind(type: RawNexusSource['type']): TraceRetrievedObject['kind'] {
  switch (type) {
    case 'pattern':
    case 'benchmark':
    case 'framework':
      return 'corpus_pattern';
    case 'client_fact':
      return 'tenant_context';
    case 'engagement':
      return 'source_event';
    default:
      return 'context_record';
  }
}

function askKind(type: RawAskSource['type']): TraceRetrievedObject['kind'] {
  switch (type) {
    case 'PATTERN':
    case 'BENCHMARK':
      return 'corpus_pattern';
    case 'TENANT':
      return 'tenant_context';
    case 'WORLDVIEW':
      return 'worldview';
    case 'GRAPH':
      return 'graph';
    case 'SURFACE':
      return 'surface_context';
    default:
      return 'context_record';
  }
}

/** Route a retrieved object into one of the three trace buckets. */
function bucketOf(
  kind: TraceRetrievedObject['kind'],
): 'tenant' | 'pattern' | 'artifact' {
  if (kind === 'corpus_pattern') return 'pattern';
  if (kind === 'artifact' || kind === 'evidence') return 'artifact';
  return 'tenant';
}

// ── metrics ────────────────────────────────────────────────────────────

export function computeConfidenceDistribution(
  objects: TraceRetrievedObject[],
): TraceConfidenceDistribution {
  const vals = objects
    .map((o) => o.confidence)
    .filter((c): c is number => typeof c === 'number' && !Number.isNaN(c));
  if (vals.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      buckets: { low: 0, medium: 0, high: 0 },
    };
  }
  let low = 0;
  let medium = 0;
  let high = 0;
  for (const v of vals) {
    if (v < 0.4) low += 1;
    else if (v <= 0.7) medium += 1;
    else high += 1;
  }
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    count: vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
    mean: sum / vals.length,
    buckets: { low, medium, high },
  };
}

function buildGroundingReport(args: {
  tenant: TraceRetrievedObject[];
  patterns: TraceRetrievedObject[];
  artifacts: TraceRetrievedObject[];
  excluded: TraceExcludedObject[];
  bundleState?: string | null;
  bundleQuality?: number | null;
}): TraceGroundingReport {
  const all = [...args.tenant, ...args.patterns, ...args.artifacts];
  const byKind: TraceGroundingReport['byKind'] = {};
  for (const o of all) byKind[o.kind] = (byKind[o.kind] ?? 0) + 1;
  const excludedByReason: Partial<Record<ExclusionReason, number>> = {};
  for (const e of args.excluded) {
    excludedByReason[e.reason] = (excludedByReason[e.reason] ?? 0) + 1;
  }
  return {
    retrievalPrecededModel: true,
    bundleObjectCount: all.length,
    byKind,
    excludedByReason,
    hasTenantEvidence: args.tenant.length > 0,
    hasApprovedPattern: args.patterns.length > 0,
    bundleState: args.bundleState ?? null,
    bundleQuality: args.bundleQuality ?? null,
  };
}

function distinctSourceBases(objects: TraceRetrievedObject[]): number {
  const set = new Set<string>();
  for (const o of objects) {
    set.add(o.sourceBasis ?? o.kind);
  }
  return set.size;
}

// ── public builders ──────────────────────────────────────────────────────

export interface BuildTraceCommon {
  questionId: string;
  tenantId: string | null;
  tenantKey: string | null;
  surface: AgentContextTrace['surface'];
  userIntent: string | null;
  resolvedPhase?: string | null;
  eligibleDatasets?: string[];
  excluded?: TraceExcludedObject[];
  missingContext?: string[];
  modelInputHash: string;
  responseId?: string | null;
  citationObjectsEmitted?: string[];
  emittedAt: string;
  bundleState?: string | null;
  bundleQuality?: number | null;
}

function finalize(
  agent: AgentContextTrace['agent'],
  common: BuildTraceCommon,
  buckets: {
    tenant: TraceRetrievedObject[];
    patterns: TraceRetrievedObject[];
    artifacts: TraceRetrievedObject[];
  },
): AgentContextTrace {
  const all = [...buckets.tenant, ...buckets.patterns, ...buckets.artifacts];
  const excluded = common.excluded ?? [];
  return {
    question_id: common.questionId,
    tenant_id: common.tenantId,
    tenant_key: common.tenantKey,
    agent,
    surface: common.surface,
    user_intent: common.userIntent,
    resolved_phase: common.resolvedPhase ?? null,
    eligible_datasets: common.eligibleDatasets ?? [],
    retrieved_tenant_context: buckets.tenant,
    retrieved_corpus_patterns: buckets.patterns,
    retrieved_artifacts: buckets.artifacts,
    excluded_objects: excluded,
    source_basis_count: distinctSourceBases(all),
    confidence_distribution: computeConfidenceDistribution(all),
    missing_context: common.missingContext ?? [],
    grounding_report: buildGroundingReport({
      ...buckets,
      excluded,
      bundleState: common.bundleState,
      bundleQuality: common.bundleQuality,
    }),
    model_input_hash: common.modelInputHash,
    response_id: common.responseId ?? null,
    citation_objects_emitted: common.citationObjectsEmitted ?? [],
    validation_status: 'pending',
    claim_validation_status: 'pending',
    tenant_isolation_status: 'pending',
    trace_version: AGENT_TRACE_VERSION,
    redacted: false,
    emitted_at: common.emittedAt,
  };
}

export function buildNexusTrace(
  input: BuildTraceCommon & {
    sources: RawNexusSource[];
    /** industry grounding namespace for pattern sources, when known. */
    patternNamespace?: string | null;
  },
): AgentContextTrace {
  const tenant: TraceRetrievedObject[] = [];
  const patterns: TraceRetrievedObject[] = [];
  const artifacts: TraceRetrievedObject[] = [];
  for (const s of input.sources) {
    const kind = nexusKind(s.type);
    const obj: TraceRetrievedObject = {
      id: s.id,
      kind,
      label: s.name,
      confidence: nexusConfidenceToNumeric(s.confidence),
      namespace: kind === 'corpus_pattern' ? input.patternNamespace ?? null : null,
    };
    const b = bucketOf(kind);
    if (b === 'pattern') patterns.push(obj);
    else if (b === 'artifact') artifacts.push(obj);
    else tenant.push(obj);
  }
  return finalize('nexus', input, { tenant, patterns, artifacts });
}

export function buildSentinelTrace(
  input: BuildTraceCommon & {
    sources: RawAskSource[];
    patternNamespace?: string | null;
  },
): AgentContextTrace {
  return buildAvaTrace(input, 'sentinel');
}

export function buildAvaTrace(
  input: BuildTraceCommon & {
    sources: RawAskSource[];
    patternNamespace?: string | null;
  },
  compatibilityAgent: 'ava' | 'sentinel' = 'ava',
): AgentContextTrace {
  const tenant: TraceRetrievedObject[] = [];
  const patterns: TraceRetrievedObject[] = [];
  const artifacts: TraceRetrievedObject[] = [];
  for (const s of input.sources) {
    const kind = askKind(s.type);
    const obj: TraceRetrievedObject = {
      id: s.id ?? `${s.type}:${s.name}`,
      kind,
      label: s.name,
      confidence: typeof s.confidence === 'number' ? s.confidence : null,
      namespace: kind === 'corpus_pattern' ? input.patternNamespace ?? null : null,
    };
    const b = bucketOf(kind);
    if (b === 'pattern') patterns.push(obj);
    else if (b === 'artifact') artifacts.push(obj);
    else tenant.push(obj);
  }
  return finalize(compatibilityAgent, input, { tenant, patterns, artifacts });
}

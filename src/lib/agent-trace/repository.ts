import 'server-only';

import { randomUUID } from 'node:crypto';

import {
  getAzureWriteFluentClient,
  resolveDatabaseUrlCandidates,
} from '@/lib/data-plane/postgresCompat';
import type { AgentContextTrace } from './types';

/** Whether trace emission is enabled at all (default on; opt-out only). */
export function isTraceEmitEnabled(): boolean {
  return process.env.AGENT_TRACE_ENABLED !== 'false';
}

const PLACEHOLDER_DB = /placeholder|example\.com|your-?db|changeme/i;

/**
 * Whether traces should be persisted to the Azure/Postgres data plane. When
 * no real DATABASE_URL is configured (lab / local without the private DB),
 * emission falls back to structured logs instead — see emit.ts.
 */
export function isTraceStorageEnabled(): boolean {
  if (!isTraceEmitEnabled()) return false;
  try {
    const urls = resolveDatabaseUrlCandidates();
    if (urls.length === 0) return false;
    return !urls.every((u) => PLACEHOLDER_DB.test(u));
  } catch {
    return false;
  }
}

function traceToRow(trace: AgentContextTrace): Record<string, unknown> {
  return {
    id: randomUUID(),
    question_id: trace.question_id,
    tenant_id: trace.tenant_id,
    tenant_key: trace.tenant_key,
    agent: trace.agent,
    surface: trace.surface,
    user_intent: trace.user_intent,
    resolved_phase: trace.resolved_phase,
    source_basis_count: trace.source_basis_count,
    model_input_hash: trace.model_input_hash,
    response_id: trace.response_id,
    validation_status: trace.validation_status,
    claim_validation_status: trace.claim_validation_status,
    tenant_isolation_status: trace.tenant_isolation_status,
    redacted: trace.redacted,
    trace_version: trace.trace_version,
    emitted_at: trace.emitted_at,
    trace: {
      eligible_datasets: trace.eligible_datasets,
      retrieved_tenant_context: trace.retrieved_tenant_context,
      retrieved_corpus_patterns: trace.retrieved_corpus_patterns,
      retrieved_artifacts: trace.retrieved_artifacts,
      excluded_objects: trace.excluded_objects,
      confidence_distribution: trace.confidence_distribution,
      missing_context: trace.missing_context,
      grounding_report: trace.grounding_report,
      citation_objects_emitted: trace.citation_objects_emitted,
    },
  };
}

/**
 * Persist one trace. Returns the new row id, or null when storage is not
 * enabled. Throws only on a genuine DB error (callers swallow via emit.ts).
 */
export async function saveAgentContextTrace(
  trace: AgentContextTrace,
): Promise<string | null> {
  if (!isTraceStorageEnabled()) return null;
  const row = traceToRow(trace);
  const { error } = await getAzureWriteFluentClient()
    .from('agent_context_traces')
    .insert(row);
  if (error) throw new Error(`agent_context_traces insert failed: ${error.message}`);
  return String(row.id);
}

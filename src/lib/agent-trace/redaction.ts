// Agent trace redaction + hashing.
//
// Policy (AGENTS.md context-ingestion truth standard + the brief):
//  - Never store raw full prompts or sensitive source text by default.
//  - Hash the model input (system + user message) with sha256.
//  - The "safe redacted trace mode" strips human-readable labels/details that
//    could echo source content, keeping only ids, kinds, reasons, and counts.

import { createHash } from 'node:crypto';

import type { AgentContextTrace } from './types';

/**
 * Deterministic sha256 over the exact bytes the model received. We hash the
 * concatenation of the system prompt and the user content so the trace can
 * prove which input produced the response without ever persisting the text.
 */
export function hashModelInput(parts: {
  system: string;
  user: string;
}): string {
  const h = createHash('sha256');
  h.update('system\n', 'utf8');
  h.update(parts.system ?? '', 'utf8');
  h.update('\nuser\n', 'utf8');
  h.update(parts.user ?? '', 'utf8');
  return h.digest('hex');
}

/**
 * Whether redacted mode is the default for this environment. Redacted mode is
 * ON unless an operator explicitly opts into label retention via
 * AGENT_TRACE_RETAIN_LABELS=true. Retained labels are still non-sensitive
 * (slugs, segment ids) but we fail closed.
 */
export function redactedModeDefault(): boolean {
  return process.env.AGENT_TRACE_RETAIN_LABELS !== 'true';
}

/**
 * Strip human-readable label/detail fields from a trace, leaving the
 * machine-readable spine (ids, kinds, reasons, counts, hash). Idempotent.
 */
export function redactTrace(trace: AgentContextTrace): AgentContextTrace {
  if (trace.redacted) return trace;
  const stripObj = <T extends { label?: string | null }>(o: T): T => ({
    ...o,
    label: undefined,
  });
  return {
    ...trace,
    retrieved_tenant_context: trace.retrieved_tenant_context.map(stripObj),
    retrieved_corpus_patterns: trace.retrieved_corpus_patterns.map(stripObj),
    retrieved_artifacts: trace.retrieved_artifacts.map(stripObj),
    excluded_objects: trace.excluded_objects.map((o) => ({
      ...o,
      detail: o.detail ? '[redacted]' : o.detail,
    })),
    // missing_context is a list of topics the user asked about; topics can
    // echo the question, so in redacted mode we keep only the count signal.
    missing_context: trace.missing_context.map(() => '[redacted]'),
    redacted: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Write adapter for source_value_levers.
//
// Persists computed ValueLeverResult[] (from the orchestrator) as per-event value
// lever rows. Deterministic in → row out: a computed lever writes its band; an
// insufficient lever writes null bounds + insufficient_evidence = true (never a
// guessed number). Insert-only; the table is append-with-recompute (computed_at
// orders the newest run). Mirrors the RLS/service-role convention of the source
// write adapters.
// ─────────────────────────────────────────────────────────────────────────────

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type { ValueLeverResult } from './types';

/** The formulaId is not on ValueLeverResult; the caller supplies it per lever key. */
export interface ValueLeverWriteInput {
  sourceEventId: string;
  clientKey: string;
  /** The computed results from the orchestrator. */
  results: readonly ValueLeverResult[];
  /**
   * Optional map from lever key → formulaId (for the audit column). When a key is
   * absent the row records an empty formula id rather than failing the write.
   */
  formulaIdByLeverKey?: Record<string, string>;
}

export interface ValueLeverWriteResult {
  ok: boolean;
  inserted: number;
  error?: string;
}

/** Shape of one insert row (mirrors the migration columns). */
interface ValueLeverRowInsert {
  source_event_id: string;
  client_key: string;
  lever_key: string;
  lever_name: string;
  value_type: string;
  formula_id: string;
  est_low_usd: number | null;
  est_high_usd: number | null;
  confidence: string;
  basis: string | null;
  derivation_trace: string | null;
  evidence_refs: unknown;
  insufficient_evidence: boolean;
  missing_evidence: unknown;
}

/** Map a ValueLeverResult to its persisted row shape. */
export function toValueLeverRow(
  result: ValueLeverResult,
  sourceEventId: string,
  clientKey: string,
  formulaId: string,
): ValueLeverRowInsert {
  return {
    source_event_id: sourceEventId,
    client_key: clientKey,
    lever_key: result.key,
    lever_name: result.name,
    value_type: result.valueType,
    formula_id: formulaId,
    est_low_usd: result.insufficientEvidence ? null : result.low,
    est_high_usd: result.insufficientEvidence ? null : result.high,
    confidence: result.confidence,
    basis: result.basis ?? null,
    derivation_trace: result.derivationTrace ?? null,
    evidence_refs: result.evidenceRefs,
    insufficient_evidence: result.insufficientEvidence,
    missing_evidence: result.missingEvidence,
  };
}

/**
 * Persist a batch of computed value-lever results for an event. Returns the count
 * inserted; a DB error is returned (not thrown) so the compute path can degrade
 * gracefully. A no-op (empty results) succeeds with inserted = 0.
 */
export async function writeValueLevers(
  input: ValueLeverWriteInput,
): Promise<ValueLeverWriteResult> {
  if (input.results.length === 0) {
    return { ok: true, inserted: 0 };
  }

  const rows = input.results.map((result) =>
    toValueLeverRow(
      result,
      input.sourceEventId,
      input.clientKey,
      input.formulaIdByLeverKey?.[result.key] ?? '',
    ),
  );

  const { error } = await getAzureWriteFluentClient()
    .from('source_value_levers')
    .insert(rows);

  if (error) {
    return { ok: false, inserted: 0, error: error.message };
  }
  return { ok: true, inserted: rows.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read an event's committed facts into the two shapes the value engine needs.
//
// The deterministic evaluators consume an `EvaluatorInputs` map (factKey → numeric
// value); the UI's value-waterfall bands additionally need a citation per
// contributing fact so every rendered number traces to the `source_event_facts`
// row it was built from. This reader produces BOTH from one tenant-scoped read of
// `source_event_facts`: the newest, non-stale numeric row per fact_key wins.
//
// It goes through the same data-plane seam the rest of Source uses
// (`getAzureWriteFluentClient` — the Supabase-compatible fluent API over Azure
// Postgres), NOT the AgentContextBroker (that is for enterprise context, not
// Source-owned tables). If the table is empty for the event it returns empty maps,
// and the caller honestly falls back to the sample view.
//
// This mirrors src/lib/source/door1/facts-reader.ts (which returns a Door1FactMap);
// it does not duplicate that shape — it returns the evaluator-input + citation
// pair the analytics canvas adapter wants.
// ─────────────────────────────────────────────────────────────────────────────

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { isCatalogFactKey } from './fact-catalog';
import type { FactSourceCitation, SourceEventFactRow } from './fact-types';
import type { EvaluatorInputs } from './evaluators/types';

/** The two shapes the analytics adapter consumes from one facts read. */
export interface EventFactsReadResult {
  /** factKey → numeric value (the evaluator input bag). */
  inputs: EvaluatorInputs;
  /** factKey → citation (provenance for the rendered band). Null when the row carried none. */
  citations: Record<string, FactSourceCitation | null>;
}

/**
 * Read the newest non-stale numeric facts for an event. When the same fact key has
 * multiple non-stale rows (e.g. one per tower), the newest capture wins for the
 * event-level input map — the evaluator reads one value per key. Only catalog fact
 * keys are admitted (a row bound to a non-fact key is ignored). Tenant-scoped by
 * client_key (RLS).
 */
export async function readEventFacts(input: {
  eventId: string;
  clientKey: string;
}): Promise<EventFactsReadResult> {
  const { eventId, clientKey } = input;
  const supabase = getAzureWriteFluentClient();

  const { data, error } = await supabase
    .from('source_event_facts')
    .select('fact_key, value_numeric, unit, source_citation, is_stale, captured_at')
    .eq('source_event_id', eventId)
    .eq('client_key', clientKey)
    .eq('is_stale', false)
    .order('captured_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<
    Pick<
      SourceEventFactRow,
      'fact_key' | 'value_numeric' | 'unit' | 'source_citation' | 'captured_at'
    >
  >;

  const inputs: EvaluatorInputs = {};
  const citations: Record<string, FactSourceCitation | null> = {};

  for (const row of rows) {
    if (!row.fact_key || !isCatalogFactKey(row.fact_key)) continue;
    if (row.value_numeric === null || row.value_numeric === undefined) continue;
    const value = Number(row.value_numeric);
    if (!Number.isFinite(value)) continue;
    // Rows are ordered newest-first; keep the first value seen per key.
    if (inputs[row.fact_key] !== undefined) continue;
    inputs[row.fact_key] = value;
    citations[row.fact_key] = row.source_citation ?? null;
  }

  return { inputs, citations };
}

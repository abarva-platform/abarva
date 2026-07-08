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

/**
 * The RFP-clause presence read for the RFP clause-coverage insight.
 *
 * Unlike `readEventFacts` (which collapses to ONE value per fact_key), this needs
 * the per-lever presence of the `rfp_clause_present` signal fact — a
 * `value_lever`-kind fact whose `entity_ref` is a canonical lever key and whose
 * value is 0/1. It returns:
 *   • `signalPresent` — whether ANY non-stale rfp_clause_present fact exists for
 *     the event (drives live vs model in the insight); and
 *   • `presentLeverKeys` — the set of lever keys whose newest non-stale fact = 1.
 *
 * Newest-non-stale-per-lever wins (a lever reassessed to 0 flips back to exposed).
 * Tenant-scoped by client_key (RLS). Returns `signalPresent: false` + an empty set
 * when the table has no rfp_clause_present rows for the event — the insight then
 * honestly stays a MODEL.
 */
export async function readRfpClausePresentLeverKeys(input: {
  eventId: string;
  clientKey: string;
}): Promise<{ signalPresent: boolean; presentLeverKeys: Set<string> }> {
  const { eventId, clientKey } = input;
  const supabase = getAzureWriteFluentClient();

  const { data, error } = await supabase
    .from('source_event_facts')
    .select('entity_ref, value_numeric, captured_at')
    .eq('source_event_id', eventId)
    .eq('client_key', clientKey)
    .eq('fact_key', 'rfp_clause_present')
    .eq('entity_kind', 'value_lever')
    .eq('is_stale', false)
    .order('captured_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<
    Pick<SourceEventFactRow, 'entity_ref' | 'value_numeric'>
  >;

  const presentLeverKeys = new Set<string>();
  // Rows are ordered newest-first; keep the FIRST value seen per lever key so a
  // reassessment supersedes older captures.
  const seen = new Set<string>();
  let signalPresent = false;
  for (const row of rows) {
    const leverKey = row.entity_ref?.trim();
    if (!leverKey) continue;
    signalPresent = true;
    if (seen.has(leverKey)) continue;
    seen.add(leverKey);
    if (Number(row.value_numeric) === 1) presentLeverKeys.add(leverKey);
  }

  return { signalPresent, presentLeverKeys };
}

/**
 * The committed-value read for the committed-value insight (Selection stage).
 *
 * Like `readRfpClausePresentLeverKeys`, this needs the per-lever value of the
 * `committed_value_usd` signal fact — a `value_lever`-kind fact whose `entity_ref`
 * is a canonical lever key and whose value is the USD-over-term the award locked
 * for that lever. It returns:
 *   • `signalPresent` — whether ANY non-stale committed_value_usd fact exists for
 *     the event (drives live vs model in the insight); and
 *   • `committedByLeverKey` — the newest non-stale committed value per lever key.
 *
 * Newest-non-stale-per-lever wins (a lever re-awarded to a new number supersedes
 * the older capture). Only FINITE, non-negative numbers are admitted — a bad cell
 * never fabricates a committed number. Tenant-scoped by client_key (RLS). Returns
 * `signalPresent: false` + an empty map when the table has no committed_value_usd
 * rows for the event — the insight then honestly stays a MODEL.
 */
export async function readCommittedValueLevers(input: {
  eventId: string;
  clientKey: string;
}): Promise<{ signalPresent: boolean; committedByLeverKey: Map<string, number> }> {
  const { eventId, clientKey } = input;
  const supabase = getAzureWriteFluentClient();

  const { data, error } = await supabase
    .from('source_event_facts')
    .select('entity_ref, value_numeric, captured_at')
    .eq('source_event_id', eventId)
    .eq('client_key', clientKey)
    .eq('fact_key', 'committed_value_usd')
    .eq('entity_kind', 'value_lever')
    .eq('is_stale', false)
    .order('captured_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<
    Pick<SourceEventFactRow, 'entity_ref' | 'value_numeric'>
  >;

  const committedByLeverKey = new Map<string, number>();
  // Rows are ordered newest-first; keep the FIRST value seen per lever key so a
  // re-award supersedes older captures.
  const seen = new Set<string>();
  let signalPresent = false;
  for (const row of rows) {
    const leverKey = row.entity_ref?.trim();
    if (!leverKey) continue;
    signalPresent = true;
    if (seen.has(leverKey)) continue;
    seen.add(leverKey);
    const value = Number(row.value_numeric);
    // Never fabricate a magnitude: only admit a finite, non-negative committed $.
    if (Number.isFinite(value) && value >= 0) {
      committedByLeverKey.set(leverKey, value);
    }
  }

  return { signalPresent, committedByLeverKey };
}

/**
 * The BAFO-concession read for the BAFO progress insight (BAFO stage).
 *
 * Like `readCommittedValueLevers`, this needs the per-lever value of the
 * `bafo_concession_captured_usd` signal fact — a `value_lever`-kind fact whose
 * `entity_ref` is a canonical lever key and whose value is the USD-over-term the
 * BAFO round captured for that lever. It returns:
 *   • `signalPresent` — whether ANY non-stale bafo_concession_captured_usd fact
 *     exists for the event (drives live vs model in the insight); and
 *   • `capturedByLeverKey` — the newest non-stale captured value per lever key.
 *
 * Newest-non-stale-per-lever wins (a lever re-captured to a new number supersedes
 * the older capture). Only FINITE, non-negative numbers are admitted — a bad cell
 * never fabricates a captured number. Tenant-scoped by client_key (RLS). Returns
 * `signalPresent: false` + an empty map when the table has no
 * bafo_concession_captured_usd rows for the event — the insight then honestly stays
 * a MODEL.
 */
export async function readBafoConcessionLevers(input: {
  eventId: string;
  clientKey: string;
}): Promise<{ signalPresent: boolean; capturedByLeverKey: Map<string, number> }> {
  const { eventId, clientKey } = input;
  const supabase = getAzureWriteFluentClient();

  const { data, error } = await supabase
    .from('source_event_facts')
    .select('entity_ref, value_numeric, captured_at')
    .eq('source_event_id', eventId)
    .eq('client_key', clientKey)
    .eq('fact_key', 'bafo_concession_captured_usd')
    .eq('entity_kind', 'value_lever')
    .eq('is_stale', false)
    .order('captured_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<
    Pick<SourceEventFactRow, 'entity_ref' | 'value_numeric'>
  >;

  const capturedByLeverKey = new Map<string, number>();
  // Rows are ordered newest-first; keep the FIRST value seen per lever key so a
  // re-capture supersedes older captures.
  const seen = new Set<string>();
  let signalPresent = false;
  for (const row of rows) {
    const leverKey = row.entity_ref?.trim();
    if (!leverKey) continue;
    signalPresent = true;
    if (seen.has(leverKey)) continue;
    seen.add(leverKey);
    const value = Number(row.value_numeric);
    // Never fabricate a magnitude: only admit a finite, non-negative captured $.
    if (Number.isFinite(value) && value >= 0) {
      capturedByLeverKey.set(leverKey, value);
    }
  }

  return { signalPresent, capturedByLeverKey };
}

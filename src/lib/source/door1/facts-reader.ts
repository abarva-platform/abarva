// ─────────────────────────────────────────────────────────────────────────────
// Door 1 — read the event's facts out of `source_event_facts` into a Door1FactMap.
//
// The diagnose step consumes a `factKey → value` map. This reader resolves it from
// the persisted fact model: newest, non-stale row per (fact_key), scoped to the
// event + tenant (RLS). It reads `value_numeric` (the value engine's numeric
// facts) and carries `source_citation` so the bridge stays defensible line-by-line.
//
// It goes through the same data-plane seam the rest of Source uses
// (`getAzureWriteFluentClient` — Supabase-compatible fluent API over Azure
// Postgres). If the table is empty (ingestion hasn't run for the event) it returns
// an empty map, and the diagnosis honestly reports every lever as needs-evidence.
// ─────────────────────────────────────────────────────────────────────────────

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { isCatalogFactKey } from '../facts/fact-catalog';
import type { SourceEventFactRow } from '../facts/fact-types';
import type { Door1FactMap, Door1FactValue } from './types';

/**
 * Read the newest non-stale numeric facts for an event into a Door1FactMap. When
 * the same fact key has multiple non-stale rows (e.g. per-tower), the newest
 * capture wins for the event-level map — the diagnose step reads one value per key.
 * Only catalog fact keys are admitted (a row bound to a non-fact key is ignored).
 */
export async function readEventFactMap(input: {
  eventId: string;
  clientKey: string;
}): Promise<Door1FactMap> {
  const { eventId, clientKey } = input;
  const supabase = getAzureWriteFluentClient();

  const { data, error } = await supabase
    .from('source_event_facts')
    .select(
      'fact_key, value_numeric, unit, source_citation, is_stale, captured_at',
    )
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

  const map: Door1FactMap = {};
  for (const row of rows) {
    if (!row.fact_key || !isCatalogFactKey(row.fact_key)) continue;
    if (row.value_numeric === null || row.value_numeric === undefined) continue;
    // Rows are ordered newest-first; keep the first value seen per key.
    if (map[row.fact_key] !== undefined) continue;
    const value: Door1FactValue = {
      factKey: row.fact_key,
      value: Number(row.value_numeric),
      unit: row.unit,
      citation: row.source_citation
        ? { doc: row.source_citation.doc, locator: row.source_citation.locator }
        : null,
    };
    map[row.fact_key] = value;
  }

  return map;
}

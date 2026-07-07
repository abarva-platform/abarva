// ─────────────────────────────────────────────────────────────────────────────
// The persisted Source fact model — `source_event_facts`.
//
// One row = one typed, cited fact captured against a source event. This is the
// substrate the deterministic value levers read: the value engine resolves each
// `computation.inputs[].key` to the newest, non-stale `source_event_facts` row for
// the event (optionally scoped to an entity_ref), reads `value_numeric` /
// `value_text` + `unit`, and carries `source_citation` + `confidence` into the
// grounded answer envelope. A fact with `citationRequired` and no `source_citation`
// is not consumable — the lever renders `insufficient_evidence` rather than guess.
//
// TS mirror of the migration:
//   supabase/migrations/20260706120000_source_event_facts.sql
// Keep the two in lockstep.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactEntityKind } from './fact-catalog';

/**
 * How a fact value was obtained.
 *  - `structured_map`  — deterministically mapped from an intake template column
 *                        (see template-fact-map.ts). No LLM. Highest trust.
 *  - `parsed`          — extracted from an uploaded document (vendor proposal,
 *                        contract). May be model-assisted; MUST carry a citation.
 *  - `analyst_entered` — a human explicitly entered / overrode the value. Logged,
 *                        overridable, auditable.
 */
export type FactSourceMethod = 'structured_map' | 'parsed' | 'analyst_entered';

/** Confidence in the captured fact value. */
export type FactConfidence = 'low' | 'med' | 'high';

/**
 * Provenance for a fact value — where an auditor can go to verify it. `doc` names
 * the evidence (a document key/name or template code); `locator` points inside it
 * (a page/section, a cell reference, a contract clause, a ticket-export column).
 * Extra keys are permitted for method-specific provenance (kept open on purpose).
 */
export interface FactSourceCitation {
  /** The evidence source: document name/key, template code, or system of record. */
  doc: string;
  /** Where within the source: page, section, cell, clause, column, etc. */
  locator: string;
  /** Optional free-form provenance detail (e.g. template row index, extractor id). */
  [extra: string]: string | number | boolean | null | undefined;
}

/**
 * A persisted fact row. `value_numeric` XOR `value_text` carries the value
 * depending on the catalog unit — numeric for usd / pct / count / fte / months /
 * ratio; text for the rare categorical fact. `entity_ref` is null for event-level
 * facts and otherwise references a tower / vendor / app id per `entity_kind`.
 */
export interface SourceEventFactRow {
  id: string;
  /** FK → source_events.id. */
  source_event_id: string;
  /** Tenant key (matches active_clients.key). RLS scope. */
  client_key: string;
  /** Canonical fact key — resolves to a FactSpec via factSpecByKey. */
  fact_key: string;
  /** The entity the fact attaches to. */
  entity_kind: FactEntityKind;
  /** Nullable reference to the tower / vendor / app the fact is about. */
  entity_ref: string | null;
  /** Numeric value (usd / pct / count / fte / months / ratio). Nullable. */
  value_numeric: number | null;
  /** Text value (categorical facts). Nullable. */
  value_text: string | null;
  /** Unit string, mirrors the catalog FactSpec.unit (a ValueUnit). */
  unit: string;
  /** How the value was obtained. */
  source_method: FactSourceMethod;
  /** Provenance for audit + citation. Nullable for analyst-entered stubs. */
  source_citation: FactSourceCitation | null;
  /** Confidence in the value. */
  confidence: FactConfidence;
  /** When the fact was captured. */
  captured_at: string;
  /** True when superseded by a newer capture / invalidated evidence. */
  is_stale: boolean;
}

/** Shape for inserting a new fact (DB fills id, captured_at, is_stale defaults). */
export type SourceEventFactInsert = Omit<
  SourceEventFactRow,
  'id' | 'captured_at' | 'is_stale'
> & {
  captured_at?: string;
  is_stale?: boolean;
};

export const FACT_SOURCE_METHODS: readonly FactSourceMethod[] = [
  'structured_map',
  'parsed',
  'analyst_entered',
] as const;

export const FACT_CONFIDENCES: readonly FactConfidence[] = [
  'low',
  'med',
  'high',
] as const;

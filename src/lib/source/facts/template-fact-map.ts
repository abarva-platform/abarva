// ─────────────────────────────────────────────────────────────────────────────
// Template → fact mapping contract — the deterministic structured-map intake.
//
// When a client supplies a structured intake template (an app-inventory export, a
// volumetrics workbook), each column maps to a canonical fact key. This contract
// declares that mapping so intake is DETERMINISTIC — a CSV/XLSX column becomes a
// `source_event_facts` row with `source_method = 'structured_map'` and NO LLM in
// the loop. The header→factKey binding, the fact's entity, and the unit are all
// stated here; an ingestion routine walks the rows and writes one fact per mapped
// cell, citing the template code + column as provenance.
//
// This is the contract/structure only (the keystone). The row-walking ingestion
// routine is a downstream slice that consumes this map. Every `factKey` here MUST
// resolve to a catalog entry and its `entityKind`/`unit` MUST match the catalog —
// tests assert this so a template can never bind a column to a non-fact or drift
// from the canonical unit.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueUnit } from '../archetypes/types';
import type { FactEntityKind } from './fact-catalog';

/** One template column bound to a canonical fact. */
export interface TemplateColumnMapping {
  /** The column header as it appears in the client's template. */
  header: string;
  /** The canonical fact key this column populates (must be in the catalog). */
  factKey: string;
  /** The entity a row of this template represents (must match the catalog spec). */
  entityKind: FactEntityKind;
  /** The unit of the column's values (must match the catalog spec). */
  unit: ValueUnit;
  /** Optional intake note (e.g. expected format, derivation hint). */
  note?: string;
}

/** A structured intake template and its column→fact bindings. */
export interface TemplateFactMap {
  /** Stable template code, e.g. 'APP_INVENTORY_V1'. */
  templateCode: string;
  /** Human label for the template. */
  label: string;
  /** What one row of the template represents (the entity_ref carrier). */
  rowEntity: FactEntityKind;
  /**
   * The column that identifies the row's entity (its entity_ref), e.g. the tower
   * name or app id. Not itself a fact — it becomes `entity_ref` on each fact row.
   *
   * Exactly one of `entityRefColumn` / `entityRefColumns` is set per template (a
   * template-fact-map test asserts this). Single-column templates set this.
   */
  entityRefColumn?: string;
  /**
   * The columns whose canonical join (with `::`) forms a COMPOSITE entity_ref, for
   * a `vendor_lever`-style row where one entity spans two axes (e.g.
   * `['Vendor', 'Lever Key']` → `<Vendor>::<Lever Key>`). Additive Phase-2 option
   * (see docs/build/source-multivendor-fact-model.md); when set, `entityRefColumn`
   * is unset and the structured map joins these columns per row. Every column must
   * be present + non-empty on a row or the cell is rejected loudly.
   */
  entityRefColumns?: string[];
  /** The fact-bearing column bindings. */
  columns: TemplateColumnMapping[];
}

/** The `::` separator that joins a composite entity_ref's canonical parts. */
export const COMPOSITE_ENTITY_REF_SEP = '::' as const;

// ── App / system inventory template ──────────────────────────────────────────
// One row per application. Feeds the run-cost / retained-cost economics per app,
// rolled up to the tower level by the value engine.
const APP_INVENTORY_TEMPLATE: TemplateFactMap = {
  templateCode: 'APP_INVENTORY_V1',
  label: 'Application & system inventory',
  rowEntity: 'app',
  entityRefColumn: 'Application ID',
  columns: [
    {
      header: 'Annual Run Cost (USD)',
      factKey: 'annual_run_cost',
      entityKind: 'tower',
      unit: 'usd_per_year',
      note: 'Per-app annual run cost; rolled up per service tower by the value engine.',
    },
    {
      header: 'Loaded FTE Cost (USD)',
      factKey: 'loaded_fte_cost',
      entityKind: 'event',
      unit: 'usd_per_year',
      note: 'Loaded annual cost of a retained FTE supporting this app.',
    },
    {
      header: 'Variable Cost Share (%)',
      factKey: 'variable_cost_share_pct',
      entityKind: 'tower',
      unit: 'pct',
      note: 'Share of the app run cost that flexes with volume.',
    },
  ],
};

// ── Volumetrics template ─────────────────────────────────────────────────────
// One row per service tower. Feeds volume-band pricing, scope-leakage, and
// productivity-credit economics.
const VOLUMETRICS_TEMPLATE: TemplateFactMap = {
  templateCode: 'VOLUMETRICS_V1',
  label: 'Ticket volumes & volumetrics',
  rowEntity: 'tower',
  entityRefColumn: 'Service Tower',
  columns: [
    {
      header: 'Annual Change-Order Spend (USD)',
      factKey: 'annual_change_order_spend',
      entityKind: 'event',
      unit: 'usd_per_year',
      note: 'Change-order / enhancement spend attributable to the tower.',
    },
    {
      header: 'Recurring/Avoidable Share (%)',
      factKey: 'recurring_avoidable_pct',
      entityKind: 'event',
      unit: 'pct',
      note: 'Share of change-order spend that recurs and is foldable into base scope.',
    },
    {
      header: 'Projected Volume Decline (%)',
      factKey: 'projected_volume_decline_pct',
      entityKind: 'tower',
      unit: 'pct',
      note: 'Expected ticket-volume decline over the contract term.',
    },
    {
      header: 'Automatable Effort Pool (USD)',
      factKey: 'automatable_effort_pool',
      entityKind: 'event',
      unit: 'usd_per_year',
      note: 'Annual effort addressable by automation for this tower.',
    },
    {
      header: 'Chronic SLA Miss Rate (%)',
      factKey: 'chronic_miss_rate',
      entityKind: 'event',
      unit: 'pct',
      note: 'Historical chronic-miss rate for the tower SLAs.',
    },
  ],
};

// ── Vendor commercials / contract terms template ─────────────────────────────
// One row per vendor/bid. Carries the commercial + benchmark scalars the AMS
// value levers need beyond volumetrics and the app inventory: transition risk,
// SLA credit economics, committed productivity credits, retained-effort delta,
// and the contract term. Some columns are vendor-entity facts (they take the
// row's vendor id as entity_ref); others are event-level benchmarks/term (they
// write with a null entity_ref) — the structured map splits them by the FACT's
// entityKind, so a single row lands both. The vendor id column is therefore
// required: a vendor-entity fact with no vendor id is rejected loudly, never
// silently dropped.
//
// IMPORTANT (unit discipline, matched to the catalog / lever inputs): pct facts
// are WHOLE NUMBERS (18 = 18%), `ratio` is a plain multiple (1.6), `count`
// (term_years) is a plain number (5). Do NOT pre-divide — the value math owns
// the scaling.
const CONTRACT_TERMS_TEMPLATE: TemplateFactMap = {
  templateCode: 'CONTRACT_TERMS_V1',
  label: 'Vendor commercials & contract terms',
  rowEntity: 'vendor',
  entityRefColumn: 'Vendor',
  columns: [
    {
      header: 'Transition Fee (USD)',
      factKey: 'transition_fee',
      entityKind: 'vendor',
      unit: 'usd',
      note: 'One-time transition / KT fee the vendor quotes. The value at risk if transition overruns.',
    },
    {
      header: 'Transition Overrun Probability (%)',
      factKey: 'overrun_probability',
      entityKind: 'event',
      unit: 'pct',
      note: 'Benchmark probability that transition overruns (whole number, e.g. 30 = 30%).',
    },
    {
      header: 'Overrun Cost Multiple (x)',
      factKey: 'overrun_cost_multiple',
      entityKind: 'event',
      unit: 'ratio',
      note: 'Overrun cost as a plain multiple of the transition fee (e.g. 1.6). Do not pre-divide.',
    },
    {
      header: 'SLA Credit Cap (%)',
      factKey: 'credit_cap_pct',
      entityKind: 'vendor',
      unit: 'pct',
      note: 'Maximum share of the fee pool recoverable as SLA credits (whole number).',
    },
    {
      header: 'At-Risk Fee Pool (USD/yr)',
      factKey: 'at_risk_fee_pool',
      entityKind: 'vendor',
      unit: 'usd_per_year',
      note: 'Annual fee pool exposed to SLA credits. The base of the protected-value SLA calc.',
    },
    {
      header: 'Committed Productivity Credit (%)',
      factKey: 'committed_credit_pct',
      entityKind: 'vendor',
      unit: 'pct',
      note: 'Year-over-year productivity/automation credit the vendor commits to in writing (whole number).',
    },
    {
      header: 'Retained FTE Delta',
      factKey: 'retained_fte_delta',
      entityKind: 'vendor',
      unit: 'fte',
      note: "Difference in retained client/SME FTE vs the baseline model. Normalizes over-cheap bids.",
    },
    {
      header: 'Contract Term (Years)',
      factKey: 'term_years',
      entityKind: 'event',
      unit: 'count',
      note: 'Length of the contract term in years (plain number). Multiplies annualized levers over the deal.',
    },
  ],
};

// ── RFP clause coverage template (downstream-insight Shape 1) ────────────────
// One row per VALUE LEVER. Carries the per-lever RFP-clause presence signal that
// flips RFP clause coverage from a model to a live protected-vs-exposed read (see
// docs/build/source-downstream-insight-fact-model.md). The row entity is
// `value_lever`: the `Lever Key` column MUST be a canonical archetype lever key
// (e.g. 'AMS.VOLUME_BAND_PRICING') — it becomes the fact's entity_ref, and the
// insight only marks a lever protected when a row's key matches a lever the
// archetype actually declares (a phantom key can never inject a lever).
//
// The single fact column is a boolean carried as 0/1 on the `ratio` unit
// (1 = clause present/required, 0 = absent) — the lower-churn representation vs a
// new `flag` unit. Do NOT pre-scale; 1 means present, 0 means absent.
const RFP_CLAUSES_TEMPLATE: TemplateFactMap = {
  templateCode: 'RFP_CLAUSES_V1',
  label: 'RFP clause coverage checklist',
  rowEntity: 'value_lever',
  entityRefColumn: 'Lever Key',
  columns: [
    {
      header: 'Clause Included (1/0)',
      factKey: 'rfp_clause_present',
      entityKind: 'value_lever',
      unit: 'ratio',
      note: "Whether the RFP draft requires this lever's protecting clause (1 = present/required, 0 = absent). One row per canonical lever key.",
    },
  ],
};

// ── Committed value template (downstream-insight Shape 1) ────────────────────
// One row per VALUE LEVER. Carries the per-lever value the executed award/contract
// COMMITTED, which flips committed value from a model to a live committed-vs-target
// read (see docs/build/source-downstream-insight-fact-model.md). The row entity is
// `value_lever`: the `Lever Key` column MUST be a canonical archetype lever key
// (e.g. 'AMS.VOLUME_BAND_PRICING') — it becomes the fact's entity_ref, and the
// insight only marks a lever committed when a row's key matches a lever the
// archetype actually declares (a phantom key can never inject a lever).
//
// The single fact column is a total-over-term $ figure on the `usd` unit — the same
// basis the lever's computed target band is expressed in — so committed can be
// compared directly against target. Enter the value the AWARD locks, not an annual
// figure.
const COMMITTED_VALUE_TEMPLATE: TemplateFactMap = {
  templateCode: 'COMMITTED_VALUE_V1',
  label: 'Committed value at award',
  rowEntity: 'value_lever',
  entityRefColumn: 'Lever Key',
  columns: [
    {
      header: 'Committed Value (USD)',
      factKey: 'committed_value_usd',
      entityKind: 'value_lever',
      unit: 'usd',
      note: 'The value the executed award/contract commits for this lever, in USD over the contract term (not annualized). One row per canonical lever key.',
    },
  ],
};

// ── BAFO concessions template (downstream-insight Shape 1) ───────────────────
// One row per VALUE LEVER. Carries the per-lever concession the BAFO round
// CAPTURED, which flips BAFO progress from a model to a live captured-vs-target
// read (see docs/build/source-downstream-insight-fact-model.md). The row entity is
// `value_lever`: the `Lever Key` column MUST be a canonical archetype lever key
// (e.g. 'AMS.VOLUME_BAND_PRICING') — it becomes the fact's entity_ref, and the
// insight only marks a lever captured when a row's key matches a lever the
// archetype actually declares (a phantom key can never inject a lever).
//
// The single fact column is a total-over-term $ figure on the `usd` unit — the same
// basis the lever's computed target band is expressed in — so captured can be
// compared directly against target. Enter the concession the BAFO round BOOKED for
// the lever, not an annual figure; a lever with no row stays 0-captured / still-open.
const BAFO_CONCESSIONS_TEMPLATE: TemplateFactMap = {
  templateCode: 'BAFO_CONCESSIONS_V1',
  label: 'BAFO concession actuals',
  rowEntity: 'value_lever',
  entityRefColumn: 'Lever Key',
  columns: [
    {
      header: 'Concession Captured (USD)',
      factKey: 'bafo_concession_captured_usd',
      entityKind: 'value_lever',
      unit: 'usd',
      note: 'The concession the BAFO round captured for this lever, in USD over the contract term (not annualized). One row per canonical lever key; a lever with no row stays 0-captured / still-open.',
    },
  ],
};

// ── Response coverage template (multi-vendor Shape 2) ────────────────────────
// One row per VENDOR × VALUE LEVER. Carries the per-vendor / per-lever
// response-coverage signal that flips Responses coverage from a model to a live
// answered-vs-dodged read (see docs/build/source-multivendor-fact-model.md). The
// row entity is `vendor_lever`: its entity_ref is the CANONICAL COMPOSITE of the
// `Vendor` and `Lever Key` columns (`<Vendor>::<Lever Key>`). The `Lever Key`
// column MUST be a canonical archetype lever key (e.g. 'AMS.VOLUME_BAND_PRICING');
// the `Vendor` column is a governed (present, non-empty) tenant vendor id — the
// event's bidding-vendor set is DERIVED from the distinct Vendor values across the
// rows (no separate registry — see the doc's vendor-registry decision).
//
// The single fact column is 0/1/0.5 on the `ratio` unit (1 = addressed,
// 0.5 = partial, 0 = dodged) — the lower-churn representation vs a new unit. Do
// NOT pre-scale.
const RESPONSE_COVERAGE_TEMPLATE: TemplateFactMap = {
  templateCode: 'RESPONSE_COVERAGE_V1',
  label: 'Vendor response coverage matrix',
  rowEntity: 'vendor_lever',
  entityRefColumns: ['Vendor', 'Lever Key'],
  columns: [
    {
      header: 'Addressed (1/0/0.5)',
      factKey: 'response_addressed',
      entityKind: 'vendor_lever',
      unit: 'ratio',
      note: "Whether this vendor addressed this lever in its response (1 = addressed, 0.5 = partial, 0 = dodged). One row per vendor×lever; the Lever Key must be a canonical archetype lever key.",
    },
  ],
};

// ── Vendor bids template (multi-vendor Shape 2 · Evaluation should-cost) ──────
// One row per VENDOR. Carries the per-vendor bid line items the should-cost /
// TCO-normalization insight reads, which flips Evaluation should-cost from a model
// (illustrative Vendor A/B/C) to a live per-vendor read (see
// docs/build/source-multivendor-fact-model.md, build order item 2). The row entity
// is `vendor` (already an allowed kind — NO new entity kind, NO migration): the
// `Vendor` column is a governed (present, non-empty) tenant vendor id and becomes
// each fact's entity_ref. This reuses the existing SINGLE entityRefColumn path —
// bid line items are per-vendor, not per-vendor×lever, so this is NOT composite.
// The event's bidding-vendor set is DERIVED from the distinct Vendor values across
// the rows (same rows-as-registry decision as CONTRACT_TERMS_V1 / RESPONSE_COVERAGE_V1).
//
// IMPORTANT (unit discipline, matched to the catalog): the headline bid is a
// USD-over-term total, the retained-FTE delta is a plain FTE count (e.g. 4), and
// the SLA credit cap is a WHOLE-NUMBER pct (12 = 12%). Do NOT pre-divide or
// pre-scale — the should-cost normalization owns the pricing.
const VENDOR_BIDS_TEMPLATE: TemplateFactMap = {
  templateCode: 'VENDOR_BIDS_V1',
  label: 'Vendor bids (should-cost normalization)',
  rowEntity: 'vendor',
  entityRefColumn: 'Vendor',
  columns: [
    {
      header: 'Headline Bid (USD)',
      factKey: 'vendor_headline_bid',
      entityKind: 'vendor',
      unit: 'usd',
      note: "The vendor's stated / list price for the deal, in USD over the contract term (before normalization). One row per vendor.",
    },
    {
      header: 'Retained FTE Delta',
      factKey: 'vendor_retained_fte_delta',
      entityKind: 'vendor',
      unit: 'fte',
      note: "Retained client/SME FTE this vendor's model assumes the buyer keeps (a plain count, e.g. 4). Priced by the should-cost normalization to debit an over-cheap headline.",
    },
    {
      header: 'SLA Credit Cap (%)',
      factKey: 'vendor_sla_credit_cap_pct',
      entityKind: 'vendor',
      unit: 'pct',
      note: "Maximum share of the fee pool recoverable as SLA credits under this vendor's regime (whole number, e.g. 12 = 12%). A thin cap is a weak-remedy risk debit in the normalized TCO. Do not pre-divide.",
    },
  ],
};

/** All shipped structured intake templates, keyed by templateCode. */
export const TEMPLATE_FACT_MAPS: Record<string, TemplateFactMap> = {
  [APP_INVENTORY_TEMPLATE.templateCode]: APP_INVENTORY_TEMPLATE,
  [VOLUMETRICS_TEMPLATE.templateCode]: VOLUMETRICS_TEMPLATE,
  [CONTRACT_TERMS_TEMPLATE.templateCode]: CONTRACT_TERMS_TEMPLATE,
  [RFP_CLAUSES_TEMPLATE.templateCode]: RFP_CLAUSES_TEMPLATE,
  [COMMITTED_VALUE_TEMPLATE.templateCode]: COMMITTED_VALUE_TEMPLATE,
  [BAFO_CONCESSIONS_TEMPLATE.templateCode]: BAFO_CONCESSIONS_TEMPLATE,
  [RESPONSE_COVERAGE_TEMPLATE.templateCode]: RESPONSE_COVERAGE_TEMPLATE,
  [VENDOR_BIDS_TEMPLATE.templateCode]: VENDOR_BIDS_TEMPLATE,
  // Add new intake templates here — no engine change required.
};

/** Lookup a template fact map by code. */
export function templateFactMapByCode(
  templateCode: string,
): TemplateFactMap | undefined {
  return TEMPLATE_FACT_MAPS[templateCode];
}

/** All shipped template maps. */
export function listTemplateFactMaps(): TemplateFactMap[] {
  return Object.values(TEMPLATE_FACT_MAPS);
}

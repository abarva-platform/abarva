// ─────────────────────────────────────────────────────────────────────────────
// Door 1 — existing-contract "Diagnose → Recover" — the flow model.
//
// Source has two front doors (redesign brief §2 / §7). Door 1 is the wedge: no
// RFP, a short four-step loop over an already-signed contract —
//
//   ingest → diagnose → quantify → play
//
// (upload the contract + 12 months of invoices → parse to typed, cited facts →
// diagnose leakage via the archetype value levers → roll findings into a cited
// recoverable value bridge → recommend the play: renegotiate / restructure /
// rebid — where rebid escalates into Door 2's 11-stage event).
//
// This module owns the ORCHESTRATION of that flow against two contracts that
// already exist in the codebase:
//   • the persisted fact model  — src/lib/source/facts/* (source_event_facts).
//   • the value-lever rules      — src/lib/source/archetypes/{types,registry}.
//
// It REUSES both; it does not re-model value math. The one interface it declares
// locally is `ValueLeverResult` (below), the output shape of a single evaluated
// value lever. A parallel slice is building the deterministic evaluators; Door 1
// is coded against this declared result shape so the two reconcile at integration
// (see the RECONCILIATION CONTRACT note on `ValueLeverResult`).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ValueLeverCategory,
  ValueType,
  ValueUnit,
} from '../archetypes/types';

// ─────────────────────────────────────────────────────────────────────────────
// RECONCILIATION CONTRACT — `ValueLeverResult`
//
// This is the DECLARED output shape of one evaluated value lever. Door 1 (and the
// value-type waterfall) consume arrays of these. The deterministic "evaluator"
// slice (now merged: `src/lib/source/facts/evaluators/`) owns the function that
// PRODUCES value-lever results from `ValueLeverRule.computation` + the event's
// facts. Door 1 currently computes results with a self-contained reference
// evaluator (see `evaluate.ts`) that emits THIS shape, so the flow is testable
// end-to-end today. The evaluator slice's `ValueLeverResult` (in
// `facts/evaluators/types.ts`) is a SIBLING shape with different field names — the
// two do NOT unify by structural typing; the integration wires a small ADAPTER.
//
// Integration reconciliation — the adapter maps `evaluators.ValueLeverResult`
// (LHS) onto this Door 1 shape (RHS), field by field:
//   • `key`                  → `ruleKey`   (both are the archetype ValueLeverRule.key)
//   • `name`                 → `name`
//   • `valueType`            → `valueType` (the classification spine — never re-derived)
//   • `confidence`           → `confidence` (same 'low'|'med'|'high' union)
//   • `basis`                → `basis`
//   • `insufficientEvidence` → `status`    (true → 'insufficient_evidence', else 'computed')
//   • `low`/`high`           → `low`/`high` (null them when status is insufficient)
//   • `missingEvidence`      → `missingFactKeys`
//   • `evidenceRefs[]` ({factKey,value}) → `citations[]` ({factKey,doc,locator}) —
//        the evaluator result carries NO doc/locator, so the adapter must JOIN each
//        `evidenceRef.factKey` back to its `source_event_facts` row to recover the
//        citation. Door 1's bridge is defensible line-by-line off `citations`.
//   • `category` and `unit` are NOT on the evaluator result — the adapter reads
//        them from the archetype `ValueLeverRule` (by `key`) / the fact `FactSpec`.
// Invariant preserved across the seam: a lever MUST NOT emit a number when a
// `citationRequired` input is absent; those route to the "needs evidence" list,
// never into the recoverable $.
// ─────────────────────────────────────────────────────────────────────────────

/** Whether a lever produced a defensible number or must abstain. */
export type ValueLeverResultStatus = 'computed' | 'insufficient_evidence';

/** A resolved citation for one input a lever consumed (mirrors FactSourceCitation). */
export interface ValueLeverCitation {
  /** The fact key the lever read. */
  factKey: string;
  /** The evidence source (document/template/system-of-record). */
  doc: string;
  /** Where within the source (page, cell, clause, column). */
  locator: string;
}

/**
 * The output of evaluating ONE value-lever rule against an event's facts. See the
 * RECONCILIATION CONTRACT note above — this is the seam with the evaluator slice.
 */
export interface ValueLeverResult {
  /** The archetype `ValueLeverRule.key` this result came from. */
  ruleKey: string;
  /** Human name of the lever (from the rule). */
  name: string;
  /** The lever category (from the rule). */
  category: ValueLeverCategory;
  /**
   * The value TYPE this lever produces — the classification spine. Door 1 buckets
   * the bridge off this (protected / risk_adjusted / incremental / …).
   */
  valueType: ValueType;
  /** 'computed' when a defensible band was derived; else 'insufficient_evidence'. */
  status: ValueLeverResultStatus;
  /** Low end of the mandatory band. Present only when status === 'computed'. */
  low: number | null;
  /** High end of the mandatory band. Present only when status === 'computed'. */
  high: number | null;
  /** Unit of low/high (usd / usd_per_year / …). */
  unit: ValueUnit;
  /** The evaluator's confidence in the band. */
  confidence: 'low' | 'med' | 'high';
  /** Human-readable basis (the rule's `valueBasis` / `computation.method`). */
  basis: string;
  /** Cited facts the lever consumed — the audit trail for the number. */
  citations: ValueLeverCitation[];
  /**
   * When `insufficient_evidence`, the `citationRequired` fact keys that were
   * absent — surfaced as "provide this to unlock the number", never guessed.
   */
  missingFactKeys: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — INGEST & BASELINE
//
// Door 1's fact map: what the diagnose step reads. The ingest/extraction itself is
// a parallel slice; Door 1 consumes the resulting `factKey → value` map that a
// caller reads out of `source_event_facts`. This type names that contract.
// ─────────────────────────────────────────────────────────────────────────────

/** One resolved fact value the diagnose step reads (mirror of a source_event_facts row, narrowed). */
export interface Door1FactValue {
  /** Canonical fact key (resolves to a FactSpec). */
  factKey: string;
  /** Numeric value (usd / pct / count / fte / …). */
  value: number;
  /** Unit string (mirrors the catalog FactSpec.unit). */
  unit: string;
  /** Provenance for the number, if the fact carried a citation. */
  citation?: { doc: string; locator: string } | null;
}

/**
 * The diagnose step's input: a `factKey → value` map, exactly as a caller reads it
 * out of `source_event_facts` for the event (newest, non-stale rows). Values may
 * be a bare number or the fuller `Door1FactValue`; the diagnose normalizes both.
 */
export type Door1FactMap = Record<string, number | Door1FactValue>;

/** Descriptor of the ingested baseline (contract + invoices → facts). */
export interface Door1Baseline {
  /** The event the optimization runs against. */
  eventId: string;
  /** Resolved archetype id (e.g. 'AMS_MANAGED_SERVICES'). */
  archetypeId: string;
  /** Count of distinct facts available to the diagnose step. */
  factCount: number;
  /** The canonical fact keys present in the baseline. */
  presentFactKeys: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — DIAGNOSE  (leakage findings, classified + cited)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single leakage finding = one evaluated leakage lever, tagged with the Door-1
 * recovery bucket its value type maps to. This is a `ValueLeverResult` plus the
 * classification the bridge rolls up on.
 */
export interface LeakageFinding extends ValueLeverResult {
  /** Which recovery bucket this finding rolls into (derived from valueType). */
  recoveryBucket: RecoveryBucket;
}

/**
 * The Door-1 recovery buckets — the analogue of the Door-2 value-type waterfall,
 * narrowed to what an existing-contract diagnosis produces:
 *  - `protected`      — leakage AVOIDED (scope/SLA/change-order). Real, but a hedge,
 *                       never summed into a headline "cash back" figure.
 *  - `risk_adjusted`  — value remaining after discounting delivery/normalization
 *                       risk (the defensible, not headline, figure).
 *  - `incremental`    — price/term movement recoverable by renegotiation beyond any
 *                       giveback the vendor would concede on asking.
 */
export type RecoveryBucket = 'protected' | 'risk_adjusted' | 'incremental';

/** The output of the diagnose step. */
export interface LeakageDiagnosis {
  eventId: string;
  archetypeId: string;
  /** Findings that produced a defensible band, sorted by high value desc. */
  findings: LeakageFinding[];
  /** Levers that fired but lacked evidence — "provide this to quantify". */
  needsEvidence: LeakageFinding[];
  /** Distinct fact keys that, if provided, would unlock a needs-evidence lever. */
  unlockFactKeys: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — QUANTIFY  (the value bridge → recoverable range)
// ─────────────────────────────────────────────────────────────────────────────

/** A single classified band in the value bridge (one recovery bucket). */
export interface ValueBridgeBand {
  bucket: RecoveryBucket;
  /** Sum of the low ends of the findings in this bucket. */
  low: number;
  /** Sum of the high ends of the findings in this bucket. */
  high: number;
  /** The rule keys that contributed to this band. */
  contributingRuleKeys: string[];
  /** Plain-English gloss of what this bucket represents. */
  note: string;
}

/**
 * The value bridge — recoverable $ range, classified by recovery bucket. The
 * `recoverable*` figures deliberately EXCLUDE the `protected` bucket (it is a risk
 * hedge, not recoverable cash — the honesty rule from the archetype ValueType
 * spine). `protected*` is reported alongside, never folded in.
 */
export interface Door1ValueBridge {
  eventId: string;
  /** Per-bucket bands. */
  bands: ValueBridgeBand[];
  /** Low end of the recoverable range (incremental + risk_adjusted; excl. protected). */
  recoverableLow: number;
  /** High end of the recoverable range (incremental + risk_adjusted; excl. protected). */
  recoverableHigh: number;
  /** Protected value reported alongside — a hedge, not summed into recoverable. */
  protectedLow: number;
  protectedHigh: number;
  /** Confidence in the bridge, derived from the contributing findings. */
  confidence: 'low' | 'med' | 'high';
  /** Currency unit of the figures (usd). */
  unit: 'usd';
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — PLAY  (the recommended move + Door-2 handoff)
// ─────────────────────────────────────────────────────────────────────────────

export type Door1PlayKind = 'renegotiate' | 'restructure' | 'rebid';

/** An evidence-backed ask the play carries into the negotiation. */
export interface Door1PlayAsk {
  /** The rule key this ask derives from. */
  ruleKey: string;
  /** The ask, phrased for the vendor conversation (the rule's `bafoAsk`). */
  ask: string;
  /** The recovery bucket + band this ask defends. */
  bucket: RecoveryBucket;
  low: number;
  high: number;
}

/**
 * The Door-2 handoff descriptor — produced ONLY when the play is `rebid`. It names
 * the archetype + the value thesis the 11-stage event should open on, so Door 2
 * never starts cold (redesign brief §7: "rebid hands off into Door 2's 11-stage
 * flow"). This is a descriptor, not a side effect — the caller opens the event.
 */
export interface Door2Handoff {
  /** Signal to the caller: escalate this into a Door-2 event. */
  escalate: true;
  /** The archetype the Door-2 event should run under (carried from Door 1). */
  archetypeId: string;
  /** The event the diagnosis came from (audit lineage). */
  sourceEventId: string;
  /** The recoverable range that justifies the rebid (the opening value thesis). */
  valueThesisLow: number;
  valueThesisHigh: number;
  /** The stage a rebid opens on. */
  entryStage: 'strategy';
  /** Human-readable rationale for the escalation. */
  reason: string;
}

/** The output of the play step. */
export interface Door1Play {
  kind: Door1PlayKind;
  /** Human rationale for the chosen play (deterministic, rule-based). */
  rationale: string;
  /** The evidence-backed asks the play carries. */
  asks: Door1PlayAsk[];
  /** Present only when kind === 'rebid'. */
  handoff: Door2Handoff | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// The whole flow — `SourceOptimization`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The full Door-1 existing-contract optimization: the four steps rolled into one
 * shape. `baseline` + `diagnosis` + `bridge` + `play`. This is what the diagnose
 * route returns and what the Door-1 canvas renders.
 */
export interface SourceOptimization {
  eventId: string;
  archetypeId: string;
  baseline: Door1Baseline;
  diagnosis: LeakageDiagnosis;
  bridge: Door1ValueBridge;
  play: Door1Play;
}

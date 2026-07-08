// ─────────────────────────────────────────────────────────────────────────────
// Source analytics canvas — the VIEW-MODEL contract.
//
// This is the interface the redesigned (three-beat) Source stage canvas renders
// from. It is DECLARED here by the UI slice so the canvas can ship — the parallel
// value-analytics slice (fact model → value-lever evaluators → value-type
// waterfall) produces the real object at integration time.
//
// RECONCILIATION NOTE (read before wiring the evaluator output):
//   - Value classification reuses the CANONICAL `ValueType` from
//     `src/lib/source/archetypes/types.ts` — the five value types
//     (expected_concession · incremental_negotiated · solution_tightening ·
//     protected · risk_adjusted). Do not fork this enum.
//   - Value units reuse the CANONICAL `ValueUnit` from the same module.
//   - Provenance + confidence reuse the fact-model's `FactSourceCitation` and
//     `FactConfidence` from `src/lib/source/facts/fact-types.ts`, so a
//     `ValueWaterfallBandView` band traces straight back to the
//     `source_event_facts` rows the evaluator read.
//   - Everything numeric is a RANGE (`low`/`high`) with a `FactConfidence`.
//     A point estimate is never presented as fact (honesty rule). When the
//     evaluator returns `insufficient_evidence`, the band's `state` is
//     `'insufficient_evidence'` and it renders as "needs evidence", not $0.
//
// The evaluator slice should return `SourceIntelViewModel` (per stage) and
// `ValueWaterfallView` (per event); the UI does not care how they were computed.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueType, ValueUnit } from '@/lib/source/archetypes/types';
import type { FactConfidence, FactSourceCitation } from '@/lib/source/facts/fact-types';

// Re-export the canonical types so the UI + evaluator import one surface.
export type { ValueType, ValueUnit } from '@/lib/source/archetypes/types';
export type { FactConfidence, FactSourceCitation } from '@/lib/source/facts/fact-types';

/**
 * Whether the numbers backing this view came from the live engine (real facts,
 * real evaluators) or are sample intelligence shown while the structured intake
 * that feeds the engine is still being built. `sample` MUST render the honesty
 * note; `live` may drop it. There is no third state — we never dress sample data
 * as live.
 */
export type IntelProvenance = 'live' | 'sample';

// ── Beat 1 · "Intel we bring" ────────────────────────────────────────────────

/**
 * The tone/category of an intel point — drives the tag chip color. Mirrors the
 * approved prototype's five families so the on-page intelligence reads
 * consistently across every stage.
 */
export type IntelPointTone =
  | 'found' // something the engine read from the estate / evidence
  | 'archetype' // knowledge the loaded archetype pre-wires
  | 'benchmark' // a market / peer comparison
  | 'traps' // a trap the archetype closes that a naive run leaves open
  | 'without' // what a cold start would miss (the cost of not doing this)
  | 'muted'; // a caveat / not-yet-wired note

/** One line of on-page intelligence: a tagged, plain-English finding. */
export interface IntelPointView {
  tone: IntelPointTone;
  /** Short tag shown in the chip, e.g. 'Found', 'Benchmark', 'Without this'. */
  tag: string;
  /** The finding, in plain English. */
  text: string;
}

/** Beat 1 — the engine's read for this stage, rendered on the page. */
export interface SourceIntelViewModel {
  /** Whether these points are live-engine or sample intelligence. */
  provenance: IntelProvenance;
  /** One-line framing of what the engine brings to this stage. */
  lead: string;
  /** The tagged findings. */
  points: readonly IntelPointView[];
}

// ── Beat 2 · "Your inputs & feedback" — the task checklist ────────────────────

/** The three task verbs. Drives the "Upload / Review / Decide" affordance. */
export type TaskType = 'provide' | 'confirm' | 'decide';

/** A task's completion state on the active stage. */
export type TaskState = 'todo' | 'done';

/** A key/value review row (with optional attention flag) shown inside a task. */
export interface TaskReviewRowView {
  key: string;
  value: string;
  /** True renders the value in the attention hue (e.g. "4 — worth a look"). */
  flag?: boolean;
}

/** An uploaded / attached file surfaced inside a `provide` task. */
export interface TaskFileView {
  /** Format badge, e.g. 'XLS', 'PDF'. */
  format: string;
  /** File name. */
  name: string;
  /** Sub-line, e.g. '18-month service baseline · uploaded'. */
  meta: string;
}

/** An input template the user downloads, fills, and uploads. */
export interface TaskTemplateView {
  format: string;
  name: string;
  /** What the template is pre-filled with / why it exists. */
  meta: string;
}

/**
 * The deterministic "where this comes from" line. Per the honesty rules this is
 * the NAMED OWNER from intake, not a live pull — there is no integration to
 * ticket systems / catalogs / vendor portals.
 */
export interface TaskProvenanceView {
  /** The named owner responsible, e.g. 'Ravi Menon, IT-Ops'. */
  owner: string;
  /** The system / template the input comes out of, e.g. 'ServiceNow export'. */
  source: string;
}

/** One task in the stage checklist — beat 2. */
export interface StageTaskView {
  /** Stable id for keys + completion toggling. */
  id: string;
  title: string;
  /** Short sub-line, e.g. '147 apps · pre-filled'. */
  subtitle: string;
  type: TaskType;
  state: TaskState;
  /** The instruction — what to do and why. */
  guide: string;
  /** Review rows (confirm/decide tasks). */
  rows?: readonly TaskReviewRowView[];
  /** An attached/uploaded file (provide/decide tasks). */
  file?: TaskFileView;
  /** A fill-and-upload template (decide tasks). */
  template?: TaskTemplateView;
  /** The deterministic owner · source line. */
  provenance?: TaskProvenanceView;
  /** The complete-this-task button label, e.g. 'Confirm volumetrics'. */
  cta: string;
  /**
   * When set, a file uploaded to this task's dropzone is ALSO parsed into typed
   * `source_event_facts` via `/facts/ingest-file` using this template code (e.g.
   * 'VOLUMETRICS_V1', 'APP_INVENTORY_V1'). The upload still stores as an artifact;
   * this additionally flips the step insight LIVE. Absent → registry-only upload.
   */
  factTemplateCode?: string;
  /**
   * SERVER-DERIVED done-state from ALREADY-PERSISTED evidence (facts or a stored
   * artifact), computed on page load so a reloaded / tab-switched page reflects
   * real persisted evidence — not just the client/session "just uploaded" flag.
   *
   * Honesty rule: this is true ONLY because the task's evidence reached a usable,
   * persisted state — a `provide` task's template facts exist for the event, or
   * its mapped artifact is registered. It is NEVER a fabricated "done" without
   * evidence. Absent/undefined → the checklist falls back to its in-session
   * behavior (the just-uploaded success path still flips a task done live).
   */
  evidenceComplete?: boolean;
}

// ── Beat 3 · the gate ────────────────────────────────────────────────────────

/** One of the three sponsor-confirm boxes at the gate. */
export interface GateConfirmView {
  /** Bold label, e.g. 'Evidence complete'. */
  label: string;
  /** Sub-line explaining what "green" attests to. */
  detail: string;
}

/** A deliverable that auto-generates once the gate is approved (no build step). */
export interface GateDeliverableView {
  /** Display label, e.g. 'Scope Memo'. */
  label: string;
  /** Optional artifact code, e.g. 'd05'. */
  code?: string;
  /** True when this is a NEXT-phase readiness pack (rendered in the gold hue). */
  isReadinessPack?: boolean;
}

/**
 * When present, the gate's Approve button is LIVE: clicking it POSTs to the
 * existing Source approval backend (the same route the standalone
 * `/source/events/[eventId]/approval` page calls) so approving in-canvas
 * persists and advances the event identically. This is how the P0 approval is
 * FOLDED into the Strategy gate — the canvas reuses the real persistence, it
 * does not fork it. When absent, the Approve button is a presentational
 * end-state (the current Scope-exemplar behavior).
 */
export interface StageGateActionView {
  /** The event id to approve. */
  eventId: string;
  /**
   * The rationale recorded on the append-only approval record. The route
   * requires a human-readable note; the canvas sends this verbatim.
   */
  rationale: string;
  /**
   * The confirmation keys the approve route requires (all sent `true` once the
   * user has ticked the three gate boxes). Mirrors
   * `SourceApprovalConfirmations` so the canvas gate attests exactly what the
   * standalone approval page attests.
   */
  confirmationKeys: readonly string[];
  /** Where to land after a successful approve (defaults to the next stage). */
  redirectStageKey?: string | null;
}

/** Beat 3 — the 3-box sponsor confirm + what generates after approval. */
export interface StageGateView {
  /** Who confirms the gate, e.g. 'K. Oshima, CIO'. */
  approver: string;
  /** The three confirmation boxes (honest — earned, not attested). */
  confirms: readonly GateConfirmView[];
  /** What auto-generates on approval (deliverables + next readiness pack). */
  generates: readonly GateDeliverableView[];
  /** The next stage name, or null if this closes the event. */
  nextStageName: string | null;
  /**
   * Optional live-approve wiring. Present only when this gate IS the P0 approval
   * (Strategy stage, `source_analytics` on); absent renders the presentational
   * end-state.
   */
  action?: StageGateActionView;
}

// ── Value-type waterfall (analytical stages / value proof) ────────────────────

/**
 * A single band of the value-type waterfall — one classified movement in the
 * value story. `valueType` is the CANONICAL classification; `amountLow`/
 * `amountHigh` is the mandatory range; `confidence` and `citation` carry the
 * provenance so an auditor can trace the number to the facts it was built from.
 */
export interface ValueWaterfallBandView {
  /** Stable id for keys. */
  id: string;
  /** The canonical value-type classification for this movement. */
  valueType: ValueType;
  /** Short label, e.g. 'Change-order leakage folded to base'. */
  label: string;
  /** Low end of the range. */
  amountLow: number;
  /** High end of the range. */
  amountHigh: number;
  /** Unit — usd / usd_per_year / pct etc. */
  unit: ValueUnit;
  /** Confidence in the band. */
  confidence: FactConfidence;
  /**
   * Whether the evaluator could quantify this band. When
   * `'insufficient_evidence'` the amounts are not shown — the band renders as
   * "needs evidence", never as $0 or a guess.
   */
  state: 'quantified' | 'insufficient_evidence';
  /** Optional provenance for audit + citation. */
  citation?: FactSourceCitation | null;
}

/** The full value-type waterfall for an event — beat that proves the ≥20%. */
export interface ValueWaterfallView {
  /** Whether the waterfall is live-engine or sample intelligence. */
  provenance: IntelProvenance;
  /** The baseline the movements are measured against (e.g. incumbent spend). */
  baselineLabel: string;
  baselineAmount: number;
  unit: ValueUnit;
  /** The classified movements, in narrative order. */
  bands: readonly ValueWaterfallBandView[];
}

// ── Per-step killer insight (the "✦ Intelligence" tab's value-proving chart) ──
//
// Each Source workflow step's Intelligence tab delivers ITS killer, value-proving
// insight: a plain-English "so what" headline + a Recharts chart, grounded in the
// fact/lever engine. A step insight is a DISCRIMINATED UNION by `kind`; each kind
// carries exactly the chart-shaped data its component needs, plus the honesty
// metadata every AbarVa number carries (provenance + an optional note). This is
// the substrate the parallel evaluator slice already produces (levers, waterfall);
// the insight layer reshapes it into the per-step "what does this tell the buyer
// they couldn't see without AbarVa?" moment.
//
// Honesty invariants (mirroring the value-waterfall doctrine):
//   • `provenance: 'sample'` (or a MODEL kind whose data is illustrative) MUST
//     carry a note; it is never dressed as live.
//   • A kind with no evidence renders an honest empty state ("provide evidence to
//     size this"), never a fabricated number.
//   • Ranges, never bare point estimates, on every $ figure.

/**
 * The insight kinds. Every Source workflow step foregrounds its killer insight:
 *   • value_pool (Strategy) · scope_coverage (Scope) · rfp_clause_coverage (RFP) ·
 *     value_bridge (Pricing) · should_cost_normalization (Evaluation) — LIVE/MODEL
 *     as their facts allow (shipped in #4537 / #4539).
 *   • transition_risk (Transition) — LIVE from the seeded transition facts.
 *   • exec_decision (Executive Decision) — LIVE from the value bridge + risk read.
 *   • value_realization (Value) · response_coverage (Responses) ·
 *     bafo_progress (BAFO) · committed_value (Selection) — MODEL until their fact
 *     lands (each names the fact that flips it live).
 */
export type StepInsightKind =
  | 'value_pool' // Strategy — value pool decomposed by lever (LIVE/SAMPLE)
  | 'scope_coverage' // Scope — $ reachable vs stranded under current scope/evidence
  | 'rfp_clause_coverage' // RFP — $ protected by a clause vs still exposed
  | 'value_bridge' // Pricing — the value-type waterfall (≥20% proof)
  | 'should_cost_normalization' // Evaluation — normalized TCO flips the winner
  | 'transition_risk' // Transition — $ exposed on overrun vs fee-at-risk (LIVE)
  | 'exec_decision' // Executive Decision — negotiable/protected/risk value + risk (LIVE)
  | 'value_realization' // Value — committed vs realized over the term (MODEL)
  | 'response_coverage' // Responses — vendor answered vs dodged per dimension (MODEL)
  | 'bafo_progress' // BAFO — value captured vs target by lever (MODEL)
  | 'committed_value'; // Selection — value locked by the awarded contract (MODEL)

// ── The advisor layer — what makes an insight advisor-grade, not just a chart ──
//
// An insight is NOT a chart. It is advisor GUIDANCE. Every step insight may carry
// this advisor layer alongside its chart data, and the InsightShell renders it as
// labeled lines beneath the chart so EVERY insight — not just Scope/RFP — can show
// best-practice, benchmark, and the downstream cost of getting the step wrong.
//
// Honesty:
//   • `bestPractice` lines are advisor knowledge pulled VERBATIM (where sensible)
//     from the archetype's value-lever playbook fields (whatToWatch, rfpClause,
//     bafoAsk, executiveImplication, …). They are real advisor knowledge, not
//     invented prose.
//   • `benchmark` is a market/peer comparison. Unless it is sourced to the tenant
//     it is a LABELED market range ("comparable AMS events …"), never presented as
//     the client's own number.
//   • `downstreamImpact` states how THIS step's decision determines what is still
//     capturable later — the cost of getting it wrong.
export interface AdvisorLayer {
  /**
   * Best-practice guidance for this step — what a great sourcing advisor for THIS
   * archetype knows. Sourced from the value-lever playbook fields, not invented.
   */
  bestPractice?: readonly string[];
  /**
   * A peer/industry benchmark line. Real if sourced; otherwise a clearly-LABELED
   * market range (the renderer prefixes it so it never reads as a tenant number).
   */
  benchmark?: string;
  /**
   * How this step's decision determines what is still capturable downstream — the
   * cost of getting this step wrong (scope sets the ceiling; the RFP is the last
   * lock point; …).
   */
  downstreamImpact?: string;
}

/** One horizontal bar in the value-pool insight — a lever's low–high $ range. */
export interface ValuePoolBarView {
  /** Stable id (the lever key) for chart keys + sort stability. */
  leverKey: string;
  /** Human lever name, e.g. 'Change-order leakage'. */
  label: string;
  /** The value type — drives the bar color. */
  valueType: ValueType;
  /** Low end of the at-stake range (USD over term). */
  low: number;
  /** High end of the at-stake range (USD over term). */
  high: number;
  /** Confidence in the range. */
  confidence: FactConfidence;
}

/** Strategy — VALUE POOL decomposed by lever. "Is the prize worth the event?" */
export interface ValuePoolInsightView extends AdvisorLayer {
  kind: 'value_pool';
  provenance: IntelProvenance;
  /** The "so what" — e.g. "$X–Y at stake across N levers; biggest is <lever> ($Z)". */
  headline: string;
  /** One bar per QUANTIFIED lever, biggest-first. Empty → honest empty state. */
  bars: readonly ValuePoolBarView[];
  /** Levers that could not be sized yet (named, not fabricated). */
  needsEvidenceLevers: readonly string[];
  /** Sample/model honesty note when provenance is 'sample'. */
  note?: string;
}

// ── Scope · SCOPE-TO-VALUE COVERAGE (reachable vs stranded) ───────────────────

/**
 * One value lever, judged for whether the current scope + landed evidence make it
 * REACHABLE. A lever is reachable when every fact its computation requires is
 * present; it is STRANDED when required evidence is missing / out of scope — its $
 * at stake cannot be captured downstream because the event never scoped for it.
 */
export interface ScopeCoverageRowView {
  /** The lever key (stable id). */
  leverKey: string;
  /** Human lever name, e.g. 'Change-order leakage'. */
  label: string;
  /** The value type — drives the bar accent. */
  valueType: ValueType;
  /** Low end of the $ at stake for this lever (USD over term). */
  low: number;
  /** High end of the $ at stake for this lever (USD over term). */
  high: number;
  /** Reachable (all required evidence present) vs stranded (missing). */
  reachable: boolean;
  /**
   * The human-readable evidence families this lever needs (from the rule's
   * `requiredEvidence`) — shown so a stranded lever says WHY it is stranded.
   */
  requiredEvidence: readonly string[];
  /**
   * When stranded, the specific required-evidence family names still missing.
   * Empty when reachable.
   */
  missingEvidence: readonly string[];
  /**
   * True when this (stranded) row's low/high is a benchmark-based POTENTIAL AT RISK
   * — the lever's own formula run over the event's REAL value pool with the missing
   * citationRequired drivers filled from illustrative AMS market bands (low→high),
   * rather than the flat illustrative scale. It is a benchmark-scaled
   * potential-if-unblocked, NOT a computed tenant number and NOT a savings claim; the
   * UI badges it so a reader never mistakes it for a cited figure. Reachable rows and
   * flat-scale stranded rows leave this false/undefined.
   */
  potentialAtRisk?: boolean;
}

/**
 * Scope — SCOPE-TO-VALUE COVERAGE. "Scope sets your ceiling." Each lever is
 * reachable or stranded under the current scope/evidence; the headline sizes the
 * reachable-vs-stranded split. Live from real facts where present; a clearly
 * badged MODEL (from the archetype) when the event has no facts yet — showing what
 * a complete scope unlocks. Carries the advisor layer (best-practice / benchmark /
 * downstream) so the CXO sees the cost of scoping this wrong.
 */
export interface ScopeCoverageInsightView extends AdvisorLayer {
  kind: 'scope_coverage';
  provenance: IntelProvenance;
  /**
   * The "so what" — e.g. "$X of $Y reachable under current scope; $Z stranded
   * because <missing evidence>."
   */
  headline: string;
  /** One row per lever, reachable-first then stranded, biggest-$ within each. */
  rows: readonly ScopeCoverageRowView[];
  /** Whether the reachable/stranded split is a MODEL (no client scope facts yet). */
  isModel: boolean;
  /** Sample/model honesty note when provenance is 'sample'. */
  note?: string;
}

// ── RFP · LEVER-TO-CLAUSE COVERAGE (protected vs exposed) ─────────────────────

/**
 * One value lever, judged for whether the RFP PROTECTS it with a required clause.
 * There is no structured RFP-draft in the fact model yet, so by default the
 * archetype's recommended clause set is treated as "to require" (a MODEL) — every
 * lever is EXPOSED until its clause is confirmed required. When a real RFP-draft
 * signal exists, that determines protected vs exposed instead.
 */
export interface RfpClauseRowView {
  /** The lever key (stable id). */
  leverKey: string;
  /** Human lever name. */
  label: string;
  /** The value type — drives the bar accent. */
  valueType: ValueType;
  /** Low end of the $ at stake this clause protects (USD over term). */
  low: number;
  /** High end of the $ at stake this clause protects (USD over term). */
  high: number;
  /** Protected (the RFP requires the clause) vs exposed (it does not / not yet). */
  protected: boolean;
  /** The exact RFP clause text to require for this lever (from the playbook). */
  rfpClause: string;
  /** The BAFO ask this lever becomes if not locked in the RFP (from the playbook). */
  bafoAsk: string;
}

/**
 * RFP — LEVER-TO-CLAUSE COVERAGE. "The RFP is the last point to lock a lever into
 * a requirement." Each lever is protected by a clause or exposed; the headline
 * sizes the exposed pool. Defaults to a MODEL (all "to require") until an RFP-draft
 * signal exists. Carries the advisor layer + a clause library (the exact clauses
 * to drop into the RFP).
 */
export interface RfpClauseInsightView extends AdvisorLayer {
  kind: 'rfp_clause_coverage';
  provenance: IntelProvenance;
  /**
   * The "so what" — e.g. "your $X pool depends on N levers; best-in-class AMS RFPs
   * protect each with a clause; M exposed ($Z)."
   */
  headline: string;
  /** One row per lever, exposed-first then protected, biggest-$ within each. */
  rows: readonly RfpClauseRowView[];
  /** Whether protected/exposed is a MODEL (no RFP-draft signal yet). */
  isModel: boolean;
  /** Sample/model honesty note when provenance is 'sample'. */
  note?: string;
}

/** Pricing — the VALUE BRIDGE (the value-type waterfall wrapped as an insight). */
export interface ValueBridgeInsightView extends AdvisorLayer {
  kind: 'value_bridge';
  provenance: IntelProvenance;
  /** The "so what" — the ≥20% classified-value framing. */
  headline: string;
  /** The full waterfall (all its honesty rules preserved by the renderer). */
  waterfall: ValueWaterfallView;
  note?: string;
}

/** One vendor's headline vs normalized cost, decomposed for the grouped bars. */
export interface ShouldCostVendorView {
  /** Vendor id (cover name for the model; the derived tenant vendor id when live). */
  vendorKey: string;
  /** Display name, e.g. 'Vendor A' (the derived vendor id itself when live). */
  label: string;
  /** The headline / list price the vendor bid (USD over term). */
  headlinePrice: number;
  /**
   * The normalizing adjustments added on top of headline to reach true TCO —
   * e.g. retained FTE cost, weak-SLA risk. Each is a debit that makes bids
   * comparable. Rendered stacked above headline in the normalized bar.
   */
  adjustments: readonly { label: string; amount: number }[];
  /** headlinePrice + Σ adjustments — the normalized TCO. */
  normalizedTco: number;
  /**
   * When LIVE from vendor-bid facts: the bid inputs this vendor DID NOT provide
   * (e.g. 'headline bid', 'retained-FTE delta'). A vendor missing a required input
   * is shown honestly as needs-evidence and is NOT ranked as the winner — its
   * normalization is incomplete. Absent/empty for a complete vendor and for the
   * MODEL (illustrative vendors are always complete).
   */
  needsEvidence?: readonly string[];
}

/**
 * Evaluation — SHOULD-COST NORMALIZATION. "The cheapest bid is a trap." Goes LIVE
 * per-vendor when vendor-bid facts exist (`VENDOR_BIDS_V1` → vendor_headline_bid /
 * vendor_retained_fte_delta / vendor_sla_credit_cap_pct), running the SAME
 * deterministic normalization the model demonstrates (headline + retained-cost
 * debit + SLA-risk debit → normalized TCO) over the real per-vendor bids and
 * surfacing the trap from real facts. Ships as a clearly-badged MODEL (illustrative
 * Vendor A/B/C) when no vendor-bid fact exists — `provenance` 'sample',
 * `isModel: true`, and the note says so.
 */
export interface ShouldCostInsightView extends AdvisorLayer {
  kind: 'should_cost_normalization';
  provenance: IntelProvenance;
  /** The "so what" — the trap ("Vendor B is cheapest on paper; normalized, A wins by $X"). */
  headline: string;
  /** The vendors compared (headline vs normalized). */
  vendors: readonly ShouldCostVendorView[];
  /** The vendor key that wins on HEADLINE price (the paper-cheapest). */
  headlineWinnerKey: string;
  /** The vendor key that wins on NORMALIZED TCO (the real winner). */
  normalizedWinnerKey: string;
  /**
   * True when illustrative vendors (no vendor-bid facts); false when normalized
   * from real per-vendor bids. Drives the Model/Live badge honestly.
   */
  isModel: boolean;
  /** States it goes live when vendor bids ingest (model) or the live provenance. */
  note?: string;
}

// ── Transition · TRANSITION-RISK EXPOSURE (LIVE) ─────────────────────────────

/**
 * Transition — TRANSITION-RISK EXPOSURE. LIVE from the seeded transition facts:
 * the AMS.TRANSITION_RISK lever computes `transition_fee × overrun_cost_multiple ×
 * overrun_probability` — the probability-weighted $ at risk if the transition
 * overruns. The chart bands the exposure (conservative→expected) against the
 * fee-at-risk the milestone plan can cap it with. Renders insufficient-evidence
 * honestly (never $0) when the fee/probability facts are absent.
 */
export interface TransitionRiskInsightView extends AdvisorLayer {
  kind: 'transition_risk';
  provenance: IntelProvenance;
  /** The "so what" — "$X at risk if transition overruns; milestone fees cap it at $Y." */
  headline: string;
  /**
   * True when the lever computed from real facts (LIVE); false when the fact is
   * absent and the exposure could not be sized (honest empty — never a guess).
   */
  quantified: boolean;
  /** The quoted transition fee (the fee-at-risk a milestone plan can cap). */
  transitionFee: number;
  /** The probability-weighted exposure band, conservative→expected (USD). */
  exposureLow: number;
  exposureHigh: number;
  /** The overrun probability used (pct, 0–100) — surfaced for the read-out. */
  overrunProbabilityPct: number;
  /** The overrun cost multiple used (ratio) — surfaced for the read-out. */
  overrunCostMultiple: number;
  /** Confidence in the exposure band. */
  confidence: FactConfidence;
  /** Sample/model honesty note (present only when not quantified). */
  note?: string;
}

// ── Executive Decision · VALUE + RISK, BOARD-READY (LIVE) ────────────────────

/**
 * One classified slice of the executive decision read — a value-type total the
 * board sees stated in its own right (negotiable earned value; protected and
 * risk-adjusted stated SEPARATELY, never folded into a savings headline).
 */
export interface ExecDecisionSliceView {
  /** 'negotiable' (earned: incremental + solution) · 'protected' · 'risk_adjusted'. */
  bucket: 'negotiable' | 'protected' | 'risk_adjusted';
  /** Display label, e.g. 'Net negotiable value'. */
  label: string;
  low: number;
  high: number;
  /** The value types folded into this bucket (audit trail). */
  valueTypes: readonly ValueType[];
}

/**
 * Executive Decision — VALUE + RISK, BOARD-READY. LIVE from the value bridge
 * (`buildValueWaterfall`): the classified value split into what is NEGOTIABLE
 * (incremental + solution — the earned ask), what is PROTECTED (a risk hedge), and
 * what is RISK-ADJUSTED (a normalization) — each stated apart with a confidence
 * band, plus a residual-risk read (the levers still needing evidence). Never a
 * single savings number; protected/risk are never summed into the negotiable ask.
 */
export interface ExecDecisionInsightView extends AdvisorLayer {
  kind: 'exec_decision';
  provenance: IntelProvenance;
  /** The "so what" — "net negotiable value $X–Y; protected $P, risk-adjusted $R stated apart — confidence <band>." */
  headline: string;
  /** The classified slices (negotiable / protected / risk-adjusted), each apart. */
  slices: readonly ExecDecisionSliceView[];
  /** The rolled-up confidence across the negotiable slice (weakest link). */
  confidence: FactConfidence;
  /** Count of levers computed from facts (the value the board can bank). */
  computedLeverCount: number;
  /** Count of levers still needing evidence (the residual-risk read). */
  residualRiskLeverCount: number;
  /** Names of the levers still needing evidence (named, never guessed). */
  residualRiskLevers: readonly string[];
  /** Sample/model honesty note when provenance is 'sample'. */
  note?: string;
}

// ── Value · COMMITTED vs REALIZED over time (MODEL) ──────────────────────────

/** One period point on the committed-vs-realized track. */
export interface ValueRealizationPointView {
  /** Period label, e.g. 'Y1', 'Y2'. */
  period: string;
  /** Cumulative committed value at this period (USD, from the awarded levers). */
  committed: number;
  /**
   * Cumulative realized value at this period (USD). 0 / null until periodic
   * realized-value actuals are ingested — the chart shows the gap honestly.
   */
  realized: number | null;
}

/**
 * Value — COMMITTED vs REALIZED over the term. MODEL: realized-value actuals are
 * not in the fact model yet, so the realized track is a placeholder (0) against the
 * committed track (from the awarded levers). Goes live when periodic realized-value
 * actuals per lever are ingested. Never fabricates a realization number.
 */
export interface ValueRealizationInsightView extends AdvisorLayer {
  kind: 'value_realization';
  provenance: IntelProvenance;
  /** The "so what" — "committed $X; realization tracked here once actuals land." */
  headline: string;
  /** The committed vs realized track over the term. */
  points: readonly ValueRealizationPointView[];
  /** The fact that flips this MODEL → LIVE, named for the operator. */
  flipFact: string;
  /** Always present — states this is a model and what makes it live. */
  note?: string;
}

// ── Responses · VENDOR DODGE-MAP (MODEL) ─────────────────────────────────────

/** One value dimension × whether vendors answered or dodged (illustrative). */
export interface ResponseCoverageRowView {
  /** The lever key (stable id). */
  leverKey: string;
  /** The value dimension, e.g. 'Volume-band price flex-down'. */
  label: string;
  /** The value type — drives the accent. */
  valueType: ValueType;
  /** Low end of the $ at stake this dimension carries (USD over term). */
  low: number;
  high: number;
  /** 'answered' (vendor committed) vs 'dodged' (illustrative until responses ingest). */
  status: 'answered' | 'dodged';
  /** The evaluation impact this dimension carries (from the playbook). */
  evaluationImpact: string;
}

/**
 * One vendor's coverage across the archetype's levers (multi-vendor Shape 2).
 * LIVE only — derived from the vendor's `response_addressed` facts. A lever the
 * vendor has no fact for is "not yet answered" (counted in `notYetAnswered`),
 * never fabricated as addressed or dodged.
 */
export interface VendorCoverageView {
  /** The vendor id (the derived bidding-vendor identifier). */
  vendorId: string;
  /** Levers this vendor ADDRESSED (response_addressed >= 1). */
  addressed: number;
  /** Levers this vendor PARTIALLY addressed (0 < value < 1). */
  partial: number;
  /** Levers this vendor DODGED (response_addressed = 0). */
  dodged: number;
  /** Levers this vendor has no response fact for yet (not fabricated). */
  notYetAnswered: number;
  /** Total levers in the archetype (the denominator). */
  totalLevers: number;
  /** $ at stake (over term) this vendor ADDRESSED (sum of addressed levers' high). */
  addressedHighUsd: number;
  /** $ at stake (over term) this vendor left DODGED/unanswered (high). */
  exposedHighUsd: number;
  /**
   * Per-lever status for this vendor: leverKey → 'addressed' | 'partial' |
   * 'dodged' | 'not_answered'. One entry per archetype lever.
   */
  byLever: readonly {
    leverKey: string;
    label: string;
    valueType: ValueType;
    high: number;
    status: 'addressed' | 'partial' | 'dodged' | 'not_answered';
  }[];
}

/**
 * Responses — VENDOR DODGE-MAP. MODEL: vendor-response facts are not in the fact
 * model yet, so every dimension is shown as "dodged" (the exposure) until proven
 * answered. LIVE (multi-vendor Shape 2 — see
 * docs/build/source-multivendor-fact-model.md): once `response_addressed` facts
 * are ingested per vendor×lever, `rows` reports each lever's answered-vs-dodged
 * (answered iff ANY vendor addressed it) and `vendors` reports per-vendor coverage
 * across the levers. The $ at stake is real where the lever computes, else the
 * illustrative scale.
 */
export interface ResponseCoverageInsightView extends AdvisorLayer {
  kind: 'response_coverage';
  provenance: IntelProvenance;
  /** The "so what" — the dodged-vs-answered pool. */
  headline: string;
  /** One row per value dimension (dodged-first, biggest-$ within). */
  rows: readonly ResponseCoverageRowView[];
  /**
   * Per-vendor coverage across the levers — LIVE only. Undefined/empty in MODEL
   * mode. Additive to the existing per-lever `rows`; the renderer reads it when
   * present without changing its existing per-lever chart.
   */
  vendors?: readonly VendorCoverageView[];
  /**
   * True when this is the honest MODEL (no response_addressed fact yet); false
   * when LIVE (≥1 vendor-response fact exists). The renderer keys its badge off
   * this — never off `provenance` alone.
   */
  isModel: boolean;
  /** The fact that flips this MODEL → LIVE, named for the operator. */
  flipFact: string;
  /** Always present — states this is a model and what makes it live. */
  note?: string;
}

// ── BAFO · CAPTURED vs TARGET (MODEL) ────────────────────────────────────────

/** One lever's captured-vs-target progress + its remaining BAFO ask. */
export interface BafoProgressRowView {
  /** The lever key (stable id). */
  leverKey: string;
  /** Human lever name. */
  label: string;
  /** The value type — drives the accent. */
  valueType: ValueType;
  /** The target value to capture on this lever (USD over term). */
  targetLow: number;
  targetHigh: number;
  /**
   * Value captured so far (USD over term) — from this lever's
   * `bafo_concession_captured_usd` fact in LIVE mode, or 0 in MODEL mode / when a
   * lever has no concession fact (shown honestly as still-open, never fabricated).
   */
  captured: number;
  /** The BAFO ask (the lever left to pull) — from the playbook. */
  bafoAsk: string;
}

/**
 * BAFO — VALUE CAPTURED vs TARGET. MODEL: BAFO concession actuals are not in the
 * fact model yet, so captured is a placeholder (0) against the target (from the
 * awarded levers). LIVE: each lever's captured is read from its
 * `bafo_concession_captured_usd` fact and compared against its target band; a lever
 * with no concession fact stays 0-captured / still-open, never fabricated. Each row
 * carries its remaining BAFO ask (the lever left to pull). Goes live when BAFO
 * concession actuals per lever are ingested.
 */
export interface BafoProgressInsightView extends AdvisorLayer {
  kind: 'bafo_progress';
  provenance: IntelProvenance;
  /** The "so what" — target pool + levers still to pull. */
  headline: string;
  /** One row per lever (biggest-target first) with its remaining BAFO ask. */
  rows: readonly BafoProgressRowView[];
  /** The fact that flips this MODEL → LIVE, named for the operator. */
  flipFact: string;
  /**
   * True when this is the honest MODEL (no bafo_concession_captured_usd fact yet);
   * false when LIVE (≥1 concession fact exists and rows carry a captured value). The
   * renderer keys its badge and note off this — never off `provenance` alone.
   */
  isModel: boolean;
  /** Always present — states model-vs-live and what makes it live. */
  note?: string;
}

// ── Selection · COMMITTED VALUE by lever (MODEL, compact) ─────────────────────

/** One committed-value bar — the value locked by the awarded contract. */
export interface CommittedValueBarView {
  /** The lever key (stable id). */
  leverKey: string;
  /** Human lever name. */
  label: string;
  /** The value type — drives the bar color. */
  valueType: ValueType;
  /**
   * The lever's TARGET band (USD over term) — its computed economic band where the
   * lever computes, else the illustrative scale. In MODEL mode this is the whole
   * bar; in LIVE mode it is the reference the committed value is compared against.
   */
  low: number;
  high: number;
  /** Confidence in the range. */
  confidence: FactConfidence;
  /**
   * LIVE only — the value the executed award COMMITTED for this lever (USD over
   * term), from the `committed_value_usd` fact. `undefined` when this lever has no
   * committed fact (shown honestly as awaiting-award, never fabricated as 0) or in
   * MODEL mode. `null` is never used — absence is `undefined`.
   */
  committed?: number;
}

/**
 * Selection — COMMITTED VALUE by lever. A compact committed-value summary: the value
 * locked by the awarded contract, by lever. MODEL until award facts land (the award
 * confirms which levers the winning vendor committed). Low-signal by design — a
 * compact bar set, not an over-built surface.
 */
export interface CommittedValueInsightView extends AdvisorLayer {
  kind: 'committed_value';
  provenance: IntelProvenance;
  /** The "so what" — the total value the award locks. */
  headline: string;
  /** One bar per lever, biggest-first. */
  bars: readonly CommittedValueBarView[];
  /** The fact that flips this MODEL → LIVE, named for the operator. */
  flipFact: string;
  /**
   * True when this is the honest MODEL (no committed_value_usd fact yet); false
   * when LIVE (≥1 committed fact exists and bars carry a `committed` value). The
   * renderer keys its badge and note off this — never off `provenance` alone.
   */
  isModel: boolean;
  /** Always present — states model-vs-live and what makes it live. */
  note?: string;
}

/**
 * The per-step insight the "✦ Intelligence" tab foregrounds. A discriminated
 * union — the renderer switches on `kind`. Absent → the tab falls back to the
 * existing IntelPanel read (+ optional waterfall). This is additive; the intake
 * beats and the value-waterfall beat are untouched.
 */
export type StepInsightView =
  | ValuePoolInsightView
  | ScopeCoverageInsightView
  | RfpClauseInsightView
  | ValueBridgeInsightView
  | ShouldCostInsightView
  | TransitionRiskInsightView
  | ExecDecisionInsightView
  | ValueRealizationInsightView
  | ResponseCoverageInsightView
  | BafoProgressInsightView
  | CommittedValueInsightView;

// ── The stage-level composite the canvas renders ─────────────────────────────

/**
 * Everything the redesigned canvas needs to render one stage's three beats. The
 * evaluator slice returns this per stage; the UI is a pure function of it.
 */
export interface StageAnalyticsView {
  /** Stage key, e.g. 'scope'. */
  stageKey: string;
  /** Display name, e.g. 'Scope'. */
  stageName: string;
  /** One-line purpose statement under the H1. */
  purpose: string;
  /** Beat 1. */
  intel: SourceIntelViewModel;
  /** Beat 2. */
  tasks: readonly StageTaskView[];
  /** Beat 3. */
  gate: StageGateView;
  /**
   * Optional value-type waterfall — present on analytical stages / when the
   * value proof is available. Absent on pure-intake stages.
   */
  waterfall?: ValueWaterfallView;
  /**
   * Optional per-step KILLER INSIGHT — the value-proving chart the "✦
   * Intelligence" tab foregrounds for THIS step (value pool at Strategy, value
   * bridge at Pricing, should-cost at Evaluation, …). Additive: when present the
   * tab leads with it; when absent it falls back to the IntelPanel read.
   */
  stepInsight?: StepInsightView;
}

/**
 * Which docked-launcher context aVa is scoped to (its role line + suggestions).
 * Kept minimal — the launcher is a pull-in, not a standing panel.
 */
export interface AvaLauncherView {
  /** aVa's role for this stage, e.g. 'Analyst · Scope'. */
  role: string;
  /** The context read-back shown when the launcher opens. */
  context: string;
  /** Suggested questions scoped to real capabilities (§9 of the brief). */
  suggestions: readonly string[];
}

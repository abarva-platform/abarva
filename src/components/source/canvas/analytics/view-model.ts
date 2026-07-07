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

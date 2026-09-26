// ─────────────────────────────────────────────────────────────────────────────
// Compose a LIVE StageAnalyticsView from an event's committed facts.
//
// This is the integration seam the event route calls when `source_analytics` is
// ON: read the event's facts → run the deterministic evaluators for the event's
// archetype → roll them into the value waterfall → build the canvas view. The
// value-waterfall beat is fully live (real facts, real math, cited). Selected
// stages derive tasks and gates; the others explicitly carry sample structure.
// The builder states the
// live value proof through the waterfall — the intel lead is rewritten to reflect
// the real computed/insufficient counts so nothing is dressed as more than it is.
//
// Returns null when there are not enough facts to compute at least one lever; the
// route then passes nothing and the canvas shows the honestly-marked SAMPLE view.
// ─────────────────────────────────────────────────────────────────────────────

import {
  evaluateValueLevers,
  type EventFactMap,
} from '@/lib/source/facts/evaluators/orchestrator';
import { buildValueWaterfall } from '@/lib/source/facts/evaluators/waterfall';
import {
  getSourceArchetype,
  archetypeForEventType,
  listSourceArchetypes,
} from '@/lib/source/archetypes/registry';
import { resolveArchetypeForEvent } from '@/lib/source/archetypes/event-archetype-resolver';
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from '@/lib/source/taxonomy/category-taxonomy';
import type { SourceEventArchetype } from '@/lib/source/archetypes/types';
import type { FactSourceCitation } from '@/lib/source/facts/fact-types';
import type { EvaluatorInputs } from '@/lib/source/facts/evaluators/types';
import {
  buildLiveWaterfallView,
  quantifiedRollup,
} from './waterfall-view-adapter';
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
} from '@/components/source/canvas/analytics/sample-view-model';
import {
  BAFO_STAGE_KEY,
  buildBafoFactDerivedGate,
  buildBafoFactDerivedTasks,
} from './bafo-fact-beats';
import {
  EVALUATION_STAGE_KEY,
  buildEvaluationFactDerivedGate,
  buildEvaluationFactDerivedTasks,
} from './evaluation-fact-beats';
import {
  RESPONSES_STAGE_KEY,
  buildResponsesFactDerivedGate,
  buildResponsesFactDerivedTasks,
  type VendorResponseCoverage,
} from './responses-fact-beats';
import {
  SOURCE_STAGE_LABELS,
  nextSourceStage,
} from '@/lib/source/constants';
import type {
  IntelPointView,
  StageAnalyticsView,
  StageBeatProvenanceView,
} from '@/components/source/canvas/analytics/view-model';

/**
 * Resolve the archetype whose value-lever rules should evaluate this event.
 * Prefers the event's classified category, then accepts an unambiguous exact
 * event-type match. It never substitutes another archetype merely because that
 * archetype happens to have authored rules.
 */
export function resolveValueArchetype(
  eventType: string | null | undefined,
  classifiedCategory?: string | null,
): SourceEventArchetype | null {
  const categoryId =
    classifiedCategory &&
    (SOURCE_CATEGORY_IDS as readonly string[]).includes(classifiedCategory)
      ? (classifiedCategory as SourceCategoryId)
      : null;
  const resolution = resolveArchetypeForEvent({ categoryId, eventType });
  if (
    resolution.archetype &&
    (resolution.archetype.valueLeverRules?.length ?? 0) > 0
  ) {
    return resolution.archetype;
  }

  // A valid classifier result is authoritative. If that archetype has no rules,
  // report not-ready instead of falling back to a different raw event type.
  if (categoryId) return null;

  if (!eventType) return null;
  const exactMatches = listSourceArchetypes().filter(
    (candidate) =>
      candidate.eventType === eventType &&
      (candidate.valueLeverRules?.length ?? 0) > 0,
  );
  if (exactMatches.length === 1) return exactMatches[0];

  const mapped = archetypeForEventType(eventType);
  return mapped && (mapped.valueLeverRules?.length ?? 0) > 0 ? mapped : null;
}

export interface BuildLiveStageInput {
  /** factKey → numeric value, from event-facts-reader. */
  inputs: EvaluatorInputs;
  /** factKey → citation, from event-facts-reader. */
  citations: Record<string, FactSourceCitation | null>;
  /** The event's raw event_type (used to resolve the archetype). */
  eventType?: string | null;
  /** Preferred deterministic classifier category for archetype resolution. */
  classifiedCategory?: string | null;
  /** Explicit archetype id override (skips event_type resolution) — used in tests. */
  archetypeId?: string;
  /** The value baseline label / amount to show the movements against. */
  baselineLabel?: string;
  baselineAmount?: number;
  /** Stage identity for the canvas (defaults to the sample Scope exemplar). */
  stageKey?: string;
  stageName?: string;
  /** Existing tenant-scoped vendor-by-lever response signal, when available. */
  vendorResponses?: VendorResponseCoverage;
}

/**
 * Build a live StageAnalyticsView, or null when the facts are too thin to compute
 * a single lever. The waterfall beat is live + cited; the intel lead reflects the
 * real computed / needs-evidence counts.
 */
export function buildLiveStageView(
  input: BuildLiveStageInput,
): StageAnalyticsView | null {
  const archetype = input.archetypeId
    ? getSourceArchetype(input.archetypeId) ?? null
    : resolveValueArchetype(input.eventType, input.classifiedCategory);
  if (!archetype) return null;

  const factMap: EventFactMap = input.inputs;
  const leverResults = evaluateValueLevers(archetype, factMap);
  const waterfall = buildValueWaterfall(leverResults);

  // Gate: only go live when at least one lever actually computed. Otherwise the
  // canvas falls back to the honestly-marked sample view.
  if (waterfall.computedLeverCount < 1) return null;

  const waterfallView = buildLiveWaterfallView({
    leverResults,
    archetypeId: archetype.id,
    citations: input.citations,
    baselineLabel: input.baselineLabel ?? 'Committed value baseline',
    baselineAmount: input.baselineAmount ?? 0,
  });

  const rollup = quantifiedRollup(waterfallView.bands);
  const insufficientCount = waterfall.insufficientLevers.length;

  const intelPoints: IntelPointView[] = [
    {
      tone: 'found',
      tag: 'Computed',
      text:
        `${rollup.quantifiedBandCount} value ${rollup.quantifiedBandCount === 1 ? 'lever' : 'levers'} ` +
        `computed from committed facts — every figure traces to a cited ${'source_event_facts'} row.`,
    },
    {
      tone: 'archetype',
      tag: 'Archetype',
      text: `${archetype.name} value-lever rules drove the classification into the five value types.`,
    },
  ];
  if (insufficientCount > 0) {
    intelPoints.push({
      tone: 'muted',
      tag: 'Needs evidence',
      text:
        `${insufficientCount} ${insufficientCount === 1 ? 'lever' : 'levers'} could not be quantified yet — ` +
        `shown as "needs evidence", never as a guess.`,
    });
  }

  const requestedStageKey = input.stageKey ?? SAMPLE_SCOPE_STAGE.stageKey;
  const scaffold = liveStageScaffoldFor(requestedStageKey);

  // The next stage this gate advances to, resolved through the canonical order so
  // the gate CTA ("Approve & advance to …") and the presentational nextStageName
  // match the stage actually being built — not the exemplar's fixed next stage.
  const stageKey = input.stageKey ?? scaffold.stageKey;
  const nextStage = nextSourceStage(stageKey);
  const nextStageName = nextStage
    ? SOURCE_STAGE_LABELS[nextStage] ?? nextStage
    : null;

  // Items U-534, U-535 and U-538. Three stages' intake beats are derived from
  // event facts and the resolved archetype. The other seven carry exemplar
  // content and say so below. `factBeats`
  // is the single switch: nothing downstream infers which stage is derived, and
  // the beat provenance is declared from the same value so the label cannot
  // drift from what this function actually returned.
  //
  // Kept as a lookup rather than a chain of `if`s so that adding the next stage
  // is one entry: a second derived stage arriving as a second ternary was how
  // this would have grown into the ten-arm switch below it, which is the shape
  // `liveStageScaffoldFor` is and the reason `LIVE_STAGE_SCAFFOLD_SOURCE` has to
  // exist beside it.
  const beatInput = {
    archetype,
    leverResults,
    citations: input.citations,
    nextStageName,
  };
  const responsesBeatInput = {
    archetype,
    vendorResponses: input.vendorResponses,
    nextStageName,
  };
  const FACT_DERIVED_BEATS: Readonly<
    Record<string, () => { tasks: StageAnalyticsView['tasks']; gate: StageAnalyticsView['gate'] }>
  > = {
    [BAFO_STAGE_KEY]: () => ({
      tasks: buildBafoFactDerivedTasks(beatInput),
      gate: buildBafoFactDerivedGate(beatInput),
    }),
    [EVALUATION_STAGE_KEY]: () => ({
      tasks: buildEvaluationFactDerivedTasks(beatInput),
      gate: buildEvaluationFactDerivedGate(beatInput),
    }),
    [RESPONSES_STAGE_KEY]: () => ({
      tasks: buildResponsesFactDerivedTasks(responsesBeatInput),
      gate: buildResponsesFactDerivedGate(responsesBeatInput),
    }),
  };
  const factBeats = FACT_DERIVED_BEATS[requestedStageKey]?.() ?? null;

  return {
    stageKey,
    stageName: input.stageName ?? scaffold.stageName,
    purpose: scaffold.purpose,
    intel: {
      provenance: 'live',
      lead:
        "Here's the value we computed from your committed facts — each band is math over a cited fact, not an estimate.",
      points: intelPoints,
    },
    // Derived where `factBeats` is present; otherwise the intake beats are not
    // fact-derived on this stage, so reuse the sample structure to render while
    // the value proof above stays fully live.
    tasks: factBeats?.tasks ?? scaffold.tasks,
    // Derived where `factBeats` is present. Otherwise reuse the sample gate's
    // confirm boxes + generates (not yet fact-derived on this stage) but correct
    // the next-stage label for the stage being built.
    gate: factBeats?.gate ?? { ...scaffold.gate, nextStageName },
    waterfall: waterfallView,
    // Item U-533. Say so at the boundary. The two comments above were the only
    // record that `tasks` and `gate` are exemplar content, and a comment is
    // readable by a maintainer and by nothing else -- the canvas and the chat
    // grounding builder both consumed this view with no way to tell carried
    // copy from computed fact, and the grounding block called the exemplar's
    // task titles and its fixture approver "authoritative". This field is the
    // machine-readable form of those two comments, written HERE because this is
    // where the carriage happens.
    beatProvenance: liveStageBeatProvenanceFor(requestedStageKey, factBeats !== null),
  };
}

/**
 * The exemplar constant `liveStageScaffoldFor` returns for a stage key.
 *
 * Kept as a table beside that switch rather than derived from it, because the
 * constants are imported bindings: at runtime a `SAMPLE_*_STAGE` object carries
 * no name to read back, and `.stageKey` is the exemplar's OWN key, which is not
 * the same thing (nine arms match their key; `default` catches every unlisted
 * key and returns the Scope exemplar). `u533-stage-scaffold-provenance` asserts
 * the two agree arm for arm, so a new arm cannot land here unnamed.
 */
const LIVE_STAGE_SCAFFOLD_SOURCE: Readonly<Record<string, string>> = {
  rfp: 'SAMPLE_RFP_STAGE',
  responses: 'SAMPLE_RESPONSES_STAGE',
  evaluation: 'SAMPLE_EVALUATION_STAGE',
  pricing: 'SAMPLE_PRICING_STAGE',
  bafo: 'SAMPLE_BAFO_STAGE',
  executive_decision: 'SAMPLE_EXECUTIVE_DECISION_STAGE',
  selection: 'SAMPLE_SELECTION_STAGE',
  transition: 'SAMPLE_TRANSITION_STAGE',
  value: 'SAMPLE_VALUE_STAGE',
  scope: 'SAMPLE_SCOPE_STAGE',
};

/** The exemplar `liveStageScaffoldFor` resolves `stageKey` to, by name. */
export function liveStageScaffoldSourceFor(stageKey: string): string {
  return LIVE_STAGE_SCAFFOLD_SOURCE[stageKey] ?? 'SAMPLE_SCOPE_STAGE';
}

/**
 * Per-beat provenance for a view built by `buildLiveStageView`.
 *
 * Item U-533 recorded the measured before-state -- both beats `scaffold` on all
 * ten armed stages -- in `docs/architecture/u533-stage-scaffold-provenance.json`.
 * Item U-534 flipped ONE stage, so this now has two answers, and `derived` is
 * passed in by the caller rather than re-derived from `stageKey` here: the label
 * must be a reading of what the builder ACTUALLY returned, not a second opinion
 * about it that can drift.
 *
 * `scaffoldSource` is null on the derived stage because neither declared beat was
 * carried from an exemplar, which is the field's documented contract. Note that
 * this stage's `purpose` IS still exemplar copy -- `beatProvenance` covers the two
 * intake beats only, and the per-field artifact above is where the remaining
 * carriage stays visible.
 */
/*
 * Module-private on purpose. Exporting it would add a second exported gate with
 * no caller outside this file, which is the exact shape item C-408 is filed
 * about; `buildLiveStageView` is the only thing that should decide a view's
 * provenance, and the suite drives the builder rather than this function.
 */
function liveStageBeatProvenanceFor(
  stageKey: string,
  derived: boolean,
): StageBeatProvenanceView {
  if (derived) {
    return { tasks: 'fact_derived', gate: 'fact_derived', scaffoldSource: null };
  }
  return {
    tasks: 'scaffold',
    gate: 'scaffold',
    scaffoldSource: liveStageScaffoldSourceFor(stageKey),
  };
}

export function liveStageScaffoldFor(stageKey: string): StageAnalyticsView {
  switch (stageKey) {
    case 'rfp':
      return SAMPLE_RFP_STAGE;
    case 'responses':
      return SAMPLE_RESPONSES_STAGE;
    case 'evaluation':
      return SAMPLE_EVALUATION_STAGE;
    case 'pricing':
      return SAMPLE_PRICING_STAGE;
    case 'bafo':
      return SAMPLE_BAFO_STAGE;
    case 'executive_decision':
      return SAMPLE_EXECUTIVE_DECISION_STAGE;
    case 'selection':
      return SAMPLE_SELECTION_STAGE;
    case 'transition':
      return SAMPLE_TRANSITION_STAGE;
    case 'value':
      return SAMPLE_VALUE_STAGE;
    case 'scope':
    default:
      return SAMPLE_SCOPE_STAGE;
  }
}

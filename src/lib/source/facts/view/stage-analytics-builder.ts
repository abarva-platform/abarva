// ─────────────────────────────────────────────────────────────────────────────
// Compose a LIVE StageAnalyticsView from an event's committed facts.
//
// This is the integration seam the event route calls when `source_analytics` is
// ON: read the event's facts → run the deterministic evaluators for the event's
// archetype → roll them into the value waterfall → build the canvas view. The
// value-waterfall beat is fully live (real facts, real math, cited). The intake
// beats (intel points / tasks / gate) are not fact-derived in this slice, so the
// builder reuses the sample scaffold's STRUCTURE for those beats and states the
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
import type { SourceEventArchetype } from '@/lib/source/archetypes/types';
import type { FactSourceCitation } from '@/lib/source/facts/fact-types';
import type { EvaluatorInputs } from '@/lib/source/facts/evaluators/types';
import {
  buildLiveWaterfallView,
  quantifiedRollup,
} from './waterfall-view-adapter';
import { SAMPLE_SCOPE_STAGE } from '@/components/source/canvas/analytics/sample-view-model';
import type {
  IntelPointView,
  StageAnalyticsView,
} from '@/components/source/canvas/analytics/view-model';

/**
 * Resolve the archetype whose value-lever rules should evaluate this event.
 * Prefers the archetype mapped from the event's `event_type` WHEN it declares
 * value-lever rules; otherwise falls back to the first archetype that has rules
 * (today only AMS is authored). Returns null when no archetype carries rules.
 */
export function resolveValueArchetype(
  eventType: string | null | undefined,
): SourceEventArchetype | null {
  if (eventType) {
    const mapped = archetypeForEventType(eventType);
    if (mapped && (mapped.valueLeverRules?.length ?? 0) > 0) return mapped;
  }
  const withRules = listSourceArchetypes().find(
    (a) => (a.valueLeverRules?.length ?? 0) > 0,
  );
  return withRules ?? null;
}

export interface BuildLiveStageInput {
  /** factKey → numeric value, from event-facts-reader. */
  inputs: EvaluatorInputs;
  /** factKey → citation, from event-facts-reader. */
  citations: Record<string, FactSourceCitation | null>;
  /** The event's raw event_type (used to resolve the archetype). */
  eventType?: string | null;
  /** Explicit archetype id override (skips event_type resolution) — used in tests. */
  archetypeId?: string;
  /** The value baseline label / amount to show the movements against. */
  baselineLabel?: string;
  baselineAmount?: number;
  /** Stage identity for the canvas (defaults to the sample Scope exemplar). */
  stageKey?: string;
  stageName?: string;
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
    : resolveValueArchetype(input.eventType);
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

  const scaffold = SAMPLE_SCOPE_STAGE;

  return {
    stageKey: input.stageKey ?? scaffold.stageKey,
    stageName: input.stageName ?? scaffold.stageName,
    purpose: scaffold.purpose,
    intel: {
      provenance: 'live',
      lead:
        "Here's the value we computed from your committed facts — each band is math over a cited fact, not an estimate.",
      points: intelPoints,
    },
    // The intake beats are not fact-derived in this slice; reuse the sample
    // structure so the page renders, while the value proof above is fully live.
    tasks: scaffold.tasks,
    gate: scaffold.gate,
    waterfall: waterfallView,
  };
}

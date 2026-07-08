// ─────────────────────────────────────────────────────────────────────────────
// aVa DETERMINISTIC GROUNDING for a Source event — the anti-contradiction wire.
//
// The Source product is deterministic: `source_event_facts` + the archetype
// value-lever math own every number, and the canvas renders the computed
// StepInsight / value bridge from them. aVa (the Source chat dock) must answer
// value questions ("what's my value at stake?") FROM those same numbers, never
// from the LLM's own reasoning — a self-computed figure that contradicts the
// canvas ($46M–$65M) would destroy trust in the whole deterministic design.
//
// This module is the missing wire. It runs the SAME deterministic builders the
// canvas call-site runs (`readEventFacts` → `buildStepInsight`, and
// `buildLiveStageView` for the value bridge), reads their output, and renders a
// compact AUTHORITATIVE GROUNDING block plus a QUOTE-NOT-COMPUTE guard directive
// for the agent's system prompt. It does NOT re-implement any math: every number
// it prints is quoted verbatim from a builder the canvas already trusts, so the
// grounding block and the canvas can never diverge for the same facts.
//
// Governing rule (CLAUDE.md / AGENTS.md, Tower doctrine applied to Source): read
// models own values; the agent owns NARRATIVE; it must NEVER calculate spend,
// value, ROI, or risk. This block gives aVa the numbers to quote and the guard
// forbids it from computing new ones.
//
// Additive + flag-gated: the caller only invokes this when `source_analytics` is
// ON for the tenant AND the chat surface carries a Source event id. When either
// is absent it is never called and the chat behaves exactly as before.
// ─────────────────────────────────────────────────────────────────────────────

import { readEventFacts } from '@/lib/source/facts/event-facts-reader';
import { buildStepInsight } from '@/lib/source/facts/view/step-insight-builder';
import { buildLiveStageView } from '@/lib/source/facts/view/stage-analytics-builder';
import type {
  StepInsightView,
  ValueWaterfallBandView,
} from '@/components/source/canvas/analytics/view-model';

// Compact USD, matching the canvas ValueWaterfall / insight renderers so the
// number aVa quotes is byte-identical to the number on screen.
const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

function fmtUsdRange(low: number, high: number): string {
  if (low === high) return fmtUsd(low);
  return `${fmtUsd(low)}–${fmtUsd(high)}`;
}

/** The baseline label the canvas call-site uses — kept in one place so the
 * grounding block and the canvas quote the same denominator label. */
export const AVA_GROUNDING_BASELINE_LABEL = 'Value at stake (event estimate)';

export interface BuildAvaSourceGroundingInput {
  /** The Source event UUID from surfaceContext (sourceEventId). */
  eventId: string;
  /** The active tenant key (RLS scope for the facts read). */
  clientKey: string;
  /** The stage the user is viewing (from surfaceContext.viewStage), decides which
   * insight is foregrounded — mirrors the canvas. Defaults to 'strategy'. */
  stageKey?: string | null;
  /** The event's value-at-stake, used as the value-bridge baseline (the same
   * `event.valueAtStakeUsd` the canvas passes). Optional. */
  baselineAmount?: number | null;
  /** The event's raw event_type, used to resolve the value archetype (the same
   * resolution the canvas uses when eventType is unset). Optional. */
  eventType?: string | null;
}

export interface AvaSourceGrounding {
  /** The authoritative grounding block to inject into the agent system prompt.
   * Empty string when no deterministic numbers exist for the event yet (so the
   * join-filter strips it and aVa answers "not computed yet — provide X"). */
  block: string;
  /** True when the block carries at least one live (fact-derived) number. */
  hasLiveNumbers: boolean;
  /** The verbatim numeric lines that appear in the block — surfaced for the
   * divergence eval so a test can assert they equal the canvas builder output. */
  quotableLines: string[];
}

/**
 * The QUOTE-NOT-COMPUTE guard directive. Injected alongside the grounding block
 * (and independently useful as a standalone policy string). It tells aVa: only
 * state $ / % that appear verbatim in the grounding block, never compute, and say
 * "not computed yet — provide X" when a number is absent. Narrative, navigation,
 * and drafting are encouraged; number-invention is forbidden.
 *
 * Exported as a constant so the same string is asserted in the eval and injected
 * in the route — the guard and its test can never drift.
 */
export const AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD = [
  '- SOURCE VALUE DISCIPLINE (deterministic grounding is authoritative): the DETERMINISTIC SOURCE GROUNDING block above is the single source of truth for every dollar, percentage, range, ROI, savings, risk-exposure, and value-at-stake figure on this event. The canvas renders these EXACT numbers.',
  '- QUOTE, NEVER COMPUTE: you may only state a $ or % figure that appears VERBATIM in the DETERMINISTIC SOURCE GROUNDING block, and you must attribute it (e.g. "the value bridge shows …", "the value pool sizes …"). You must NEVER add, subtract, multiply, annualize, extrapolate, average, discount, infer, or otherwise CALCULATE a value, spend, ROI, savings, or risk number yourself — even if the arithmetic looks trivial. If the user asks you to compute one, explain that the deterministic engine owns the math and point them to the value the grounding block already carries.',
  '- IF A NUMBER IS NOT IN THE GROUNDING BLOCK, it is not computed yet: say so honestly ("that is not computed yet — provide/upload <the named evidence> and the engine will size it") and name the missing evidence. Do not fill the gap with a benchmark, a guess, or a headline discount.',
  '- NEVER CONTRADICT THE CANVAS: if your read of the situation seems to imply a different number than the grounding block, the grounding block wins — the canvas the user is looking at shows that number. Narrative framing, what-to-do-next navigation (why a lever is exposed, what evidence unblocks it), and drafting clause / memo language are encouraged; inventing or overriding a number is not.',
  '- TABLE FORMAT (when presenting per-lever, per-vendor, or BAFO-ask data as a table): use a properly-formed GFM markdown table — a header row, then a separator row of the exact form "| --- | --- | --- |" (one "---" per column), then one data row per line. Every row MUST be on its own line; never run rows together in one paragraph. If you are not confident you can produce a clean multi-line table, use a bulleted list instead ("- Lever: value — detail") rather than emit pipe characters that are not a valid table — a broken table is worse than a plain list.',
].join('\n');

/**
 * Format a single StepInsight into quotable grounding lines. Only the headline
 * (the exact "so what" the canvas prints) plus, for the value bridge, each
 * quantified band's classified $ range — every line quoted verbatim from the
 * builder output so the block cannot diverge from the canvas.
 */
function formatInsightLines(insight: StepInsightView): string[] {
  const lines: string[] = [];
  const provenanceTag =
    insight.provenance === 'live'
      ? '[LIVE — computed from this event\'s cited facts]'
      : '[SAMPLE/MODEL — illustrative shape, not a tenant number; do not quote as this event\'s value]';
  lines.push(`Headline ${provenanceTag}: ${insight.headline}`);

  if (insight.kind === 'value_bridge' && insight.waterfall) {
    const quantified = insight.waterfall.bands.filter(
      (b: ValueWaterfallBandView) => b.state === 'quantified',
    );
    if (quantified.length > 0) {
      const total = quantified.reduce(
        (acc, b) => ({ low: acc.low + b.amountLow, high: acc.high + b.amountHigh }),
        { low: 0, high: 0 },
      );
      lines.push(
        `Value bridge total classified value: ${fmtUsdRange(total.low, total.high)} across ${quantified.length} classified band(s).`,
      );
      for (const band of quantified) {
        lines.push(
          `  • ${band.label} (${band.valueType}): ${fmtUsdRange(band.amountLow, band.amountHigh)}.`,
        );
      }
    }
  }
  return lines;
}

/** Inputs to the PURE grounding renderer (facts already read). */
export interface RenderAvaGroundingFromFactsInput {
  /** factKey → numeric value (from event-facts-reader — the evaluator bag). */
  inputs: Record<string, number>;
  /** factKey → citation (from event-facts-reader). */
  citations: Record<string, import('@/lib/source/facts/fact-types').FactSourceCitation | null>;
  /** The viewing stage (decides the foregrounded insight). Defaults to 'strategy'. */
  stageKey?: string | null;
  /** The value-at-stake baseline for the value bridge. Optional. */
  baselineAmount?: number | null;
  /** The event's raw event_type (archetype resolution). Optional. */
  eventType?: string | null;
}

/**
 * PURE grounding renderer: given an already-read fact map, run the SAME builders
 * the canvas runs and render the authoritative block + quotable lines. No I/O, no
 * LLM — so a test can assert its numbers equal `buildStepInsight` / value-bridge
 * output for the SAME facts (the real anti-contradiction guarantee). The async
 * `buildAvaSourceGrounding` is a thin DB wrapper around this.
 */
export function renderAvaSourceGroundingFromFacts(
  input: RenderAvaGroundingFromFactsInput,
): AvaSourceGrounding {
  const empty: AvaSourceGrounding = {
    block: '',
    hasLiveNumbers: false,
    quotableLines: [],
  };

  const stageKey = input.stageKey?.trim() || 'strategy';
  const baselineAmount = input.baselineAmount ?? 0;
  const inputs = input.inputs;
  const citations = input.citations;

  // The per-step insight for the viewing stage — same call the canvas makes.
  const stepInsight = buildStepInsight({
    stageKey,
    inputs,
    citations,
    eventType: input.eventType ?? undefined,
    baselineLabel: AVA_GROUNDING_BASELINE_LABEL,
    baselineAmount,
  });

  // The value bridge is the canonical event-level value view. Build it from the
  // Pricing stage regardless of viewing stage so aVa always has the classified
  // value total to quote (the "$46M–$65M" moment), matching the canvas Pricing
  // insight. buildStepInsight('pricing') reuses buildValueBridgeInsight.
  const valueBridge =
    stageKey === 'pricing'
      ? stepInsight
      : buildStepInsight({
          stageKey: 'pricing',
          inputs,
          citations,
          eventType: input.eventType ?? undefined,
          baselineLabel: AVA_GROUNDING_BASELINE_LABEL,
          baselineAmount,
        });

  // buildLiveStageView returns null when facts are too thin to compute a lever —
  // its presence is the honest signal that the value bridge is LIVE (cited) for
  // this event. When null, the insights above are sample/model and the block says
  // so. We do not print the stage view itself (the insight headlines carry the
  // quotable numbers); we only use its presence to confirm live-vs-sample.
  const liveStageView = buildLiveStageView({
    inputs,
    citations,
    eventType: input.eventType ?? undefined,
    baselineLabel: AVA_GROUNDING_BASELINE_LABEL,
    baselineAmount,
    stageKey: stageKey === 'strategy' ? 'scope' : stageKey,
  });

  const quotableLines: string[] = [];
  let hasLiveNumbers = false;

  if (stepInsight) {
    const stageLines = formatInsightLines(stepInsight);
    quotableLines.push(
      `Current stage (${stageKey}) insight:`,
      ...stageLines.map((l) => `  ${l}`),
    );
    if (stepInsight.provenance === 'live') hasLiveNumbers = true;
  }

  if (valueBridge && valueBridge !== stepInsight) {
    const bridgeLines = formatInsightLines(valueBridge);
    quotableLines.push(
      'Event value bridge (Pricing insight — the classified value at stake):',
      ...bridgeLines.map((l) => `  ${l}`),
    );
    if (valueBridge.provenance === 'live') hasLiveNumbers = true;
  }

  if (quotableLines.length === 0) {
    return empty;
  }

  const liveNote = hasLiveNumbers
    ? 'These numbers are LIVE — computed by the deterministic engine from this event\'s cited facts. They match the canvas exactly. Quote them; do not recompute them.'
    : 'These numbers are SAMPLE/MODEL — the deterministic engine has no cited facts for this event yet, so they are an illustrative shape, NOT this tenant\'s value. Do not quote them as this event\'s value at stake; tell the user what evidence to provide so the engine can size it.';

  const block = [
    'DETERMINISTIC SOURCE GROUNDING (authoritative — the value numbers the canvas renders for this event):',
    ...quotableLines,
    `Provenance: ${liveStageView ? 'value bridge is LIVE (facts computed at least one value lever).' : 'value bridge is SAMPLE/MODEL (facts too thin to compute a lever).'}`,
    liveNote,
  ].join('\n');

  return { block, hasLiveNumbers, quotableLines };
}

/**
 * Build the deterministic grounding for aVa on a Source event. Reads the event's
 * facts (tenant-scoped, RLS) and delegates to the PURE renderer above. Returns an
 * empty block (never throws) when facts are absent or a read fails — the caller
 * then lets aVa answer honestly that nothing is computed yet. Never fabricates.
 */
export async function buildAvaSourceGrounding(
  input: BuildAvaSourceGroundingInput,
): Promise<AvaSourceGrounding> {
  const empty: AvaSourceGrounding = {
    block: '',
    hasLiveNumbers: false,
    quotableLines: [],
  };

  let read: Awaited<ReturnType<typeof readEventFacts>>;
  try {
    read = await readEventFacts({
      eventId: input.eventId,
      clientKey: input.clientKey,
    });
  } catch {
    // A facts-read failure must never break the chat turn — aVa keeps its
    // existing (ungrounded) behavior and answers from the honest "not computed"
    // posture. Never fabricate.
    return empty;
  }

  return renderAvaSourceGroundingFromFacts({
    inputs: read.inputs,
    citations: read.citations,
    stageKey: input.stageKey,
    baselineAmount: input.baselineAmount,
    eventType: input.eventType,
  });
}

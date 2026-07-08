// ─────────────────────────────────────────────────────────────────────────────
// THE DIVERGENCE EVAL — the safety gate that lets aVa be turned on without fear.
//
// aVa (the Source chat dock) must answer value questions FROM the deterministic
// numbers the canvas renders, never from the LLM's own arithmetic. The risk is
// CONTRADICTION: aVa emitting a value that disagrees with the canvas ($46M–$65M).
//
// This suite is the anti-contradiction guarantee. It proves, WITHOUT a live LLM,
// that the grounding block aVa receives contains the SAME value-bridge / lever
// numbers the canvas computes for the same facts — by asserting the grounding
// renderer's output equals the canvas builders' output (`buildStepInsight` /
// `buildValueBridgeInsight`) for the identical AMS fixtures the insight tests use.
// If the two ever diverged, this test fails.
//
// It also asserts the QUOTE-NOT-COMPUTE guard forbids computing.
// ─────────────────────────────────────────────────────────────────────────────

import {
  renderAvaSourceGroundingFromFacts,
  AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD,
  AVA_GROUNDING_BASELINE_LABEL,
} from '../ava-grounding-context';
import {
  buildStepInsight,
  buildValueBridgeInsight,
} from '../step-insight-builder';
import { resolveValueArchetype } from '../stage-analytics-builder';
import type { EventFactMap } from '@/lib/source/facts/evaluators/orchestrator';
import type { ValueBridgeInsightView } from '@/components/source/canvas/analytics/view-model';

// The SAME AMS fixtures the insight builder tests use — a fact map that quantifies
// the AMS change-order-leakage lever (protected value type):
//   recurring_avoidable_pct × annual_change_order_spend × term_years
const FACTS_ONE_LEVER: EventFactMap = {
  annual_change_order_spend: 4_000_000,
  recurring_avoidable_pct: 0.35,
  term_years: 3,
};

// A richer fact set exercising several AMS levers so the value bridge classifies
// multiple bands (the "$46M–$65M" shape at event scale).
const FACTS_MULTI_LEVER: EventFactMap = {
  annual_change_order_spend: 4_000_000,
  recurring_avoidable_pct: 0.35,
  annual_run_cost: 46_000_000,
  projected_volume_decline_pct: 0.2,
  variable_cost_share_pct: 0.6,
  automatable_effort_pool: 3_000_000,
  committed_credit_pct: 0.1,
  retained_fte_delta: 4,
  loaded_fte_cost: 195_000,
  at_risk_fee_pool: 5_000_000,
  credit_cap_pct: 0.1,
  chronic_miss_rate: 0.05,
  transition_fee: 2_000_000,
  overrun_probability: 30,
  overrun_cost_multiple: 1.6,
  term_years: 3,
};

const NO_CITATIONS: Record<string, null> = {};
const BASELINE = 65_000_000;

/** Extract the value-bridge total $ range fragment the canvas headline prints,
 * exactly as the builder computes it — used to assert the grounding block quotes
 * the identical number. */
function canvasValueBridgeTotalFragment(facts: EventFactMap): string | null {
  const archetype = resolveValueArchetype(null);
  expect(archetype).not.toBeNull();
  const bridge = buildValueBridgeInsight(archetype!, {
    stageKey: 'pricing',
    inputs: facts,
    citations: NO_CITATIONS,
    baselineLabel: AVA_GROUNDING_BASELINE_LABEL,
    baselineAmount: BASELINE,
  }) as ValueBridgeInsightView;
  const quantified = bridge.waterfall.bands.filter(
    (b) => b.state === 'quantified',
  );
  if (quantified.length === 0) return null;
  // The grounding block prints the same compact-USD range the canvas headline
  // uses; reuse the builder headline itself as the divergence anchor.
  return bridge.headline;
}

describe('aVa Source grounding — the divergence eval (anti-contradiction)', () => {
  it('grounds aVa in the SAME value-bridge headline the canvas builder computes (no divergence)', () => {
    const grounding = renderAvaSourceGroundingFromFacts({
      inputs: FACTS_MULTI_LEVER,
      citations: NO_CITATIONS,
      stageKey: 'pricing',
      baselineAmount: BASELINE,
      eventType: null,
    });

    // The canvas value-bridge headline (the authoritative "$…" moment).
    const canvasHeadline = canvasValueBridgeTotalFragment(FACTS_MULTI_LEVER);
    expect(canvasHeadline).toBeTruthy();

    // The grounding block aVa receives must contain that EXACT headline string —
    // aVa can only quote a number that appears verbatim here, and this is the
    // same string on screen. If the builder output changed, this would fail.
    expect(grounding.block).toContain(canvasHeadline!);
    expect(grounding.quotableLines.join('\n')).toContain(canvasHeadline!);
  });

  it('the grounding numbers equal buildStepInsight output for the SAME facts (viewing stage)', () => {
    const stageKey = 'strategy';
    const grounding = renderAvaSourceGroundingFromFacts({
      inputs: FACTS_ONE_LEVER,
      citations: NO_CITATIONS,
      stageKey,
      baselineAmount: BASELINE,
      eventType: null,
    });

    // The canvas builds the SAME insight the same way (page.tsx call-site).
    const canvasInsight = buildStepInsight({
      stageKey,
      inputs: FACTS_ONE_LEVER,
      citations: NO_CITATIONS,
      baselineLabel: AVA_GROUNDING_BASELINE_LABEL,
      baselineAmount: BASELINE,
    });
    expect(canvasInsight).not.toBeNull();

    // The grounding block must quote the canvas insight's headline verbatim.
    expect(grounding.block).toContain(canvasInsight!.headline);
  });

  it('marks live facts as LIVE and thin facts as SAMPLE/MODEL (honest provenance)', () => {
    const live = renderAvaSourceGroundingFromFacts({
      inputs: FACTS_ONE_LEVER,
      citations: NO_CITATIONS,
      stageKey: 'strategy',
      baselineAmount: BASELINE,
      eventType: null,
    });
    expect(live.hasLiveNumbers).toBe(true);
    expect(live.block).toContain('LIVE');

    const empty = renderAvaSourceGroundingFromFacts({
      inputs: {},
      citations: NO_CITATIONS,
      stageKey: 'strategy',
      baselineAmount: BASELINE,
      eventType: null,
    });
    // No cited facts → the numbers are illustrative shape, marked SAMPLE/MODEL,
    // never dressed as this event's value.
    expect(empty.hasLiveNumbers).toBe(false);
    expect(empty.block).toContain('SAMPLE/MODEL');
  });

  it('never emits an empty grounding block that claims a live number when facts are absent', () => {
    const grounding = renderAvaSourceGroundingFromFacts({
      inputs: {},
      citations: NO_CITATIONS,
      stageKey: 'strategy',
      baselineAmount: 0,
      eventType: null,
    });
    // A sample/model block may still render (the shape), but it must NOT be tagged
    // LIVE and must carry the "provide evidence" honesty note.
    expect(grounding.hasLiveNumbers).toBe(false);
    expect(grounding.block).toContain('provide');
  });
});

describe('aVa Source quote-not-compute guard — forbids computing', () => {
  it('forbids the agent from calculating a value and requires verbatim quoting', () => {
    const guard = AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD.toLowerCase();
    // The guard must forbid computing / inferring a number.
    expect(guard).toContain('never compute');
    expect(guard).toContain('verbatim');
    // The guard must name the deterministic block as authoritative.
    expect(guard).toContain('deterministic source grounding');
    // The guard must direct the honest "not computed yet — provide X" path.
    expect(guard).toContain('not computed yet');
    // The guard must forbid contradicting the canvas.
    expect(guard).toContain('never contradict');
  });

  it('encourages narrative / navigation / drafting (only number-invention is banned)', () => {
    const guard = AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD.toLowerCase();
    expect(guard).toContain('narrative');
    expect(guard).toContain('drafting');
  });
});

// Builder tests for the per-step insight layer. The builder is a pure function:
// facts + archetype + stageKey → the right StepInsightView, live where facts
// exist, else a clearly-marked sample, else honest empty — never a fabricated
// number.

import {
  buildStepInsight,
  buildValuePoolInsight,
  buildShouldCostModelInsight,
  stepInsightKindForStage,
} from '../step-insight-builder';
import { AMS_MANAGED_SERVICES } from '@/lib/source/archetypes/registry';
import type { EventFactMap } from '@/lib/source/facts/evaluators/orchestrator';

// A fact map that quantifies the AMS change-order-leakage lever (protected):
//   avoidable_pct × annual_change_order_spend × term_years
const FACTS_ONE_LEVER: EventFactMap = {
  annual_change_order_spend: 4_000_000,
  recurring_avoidable_pct: 0.35,
  term_years: 3,
};

describe('stepInsightKindForStage', () => {
  it('maps the three shipped steps to their kinds', () => {
    expect(stepInsightKindForStage('strategy')).toBe('value_pool');
    expect(stepInsightKindForStage('pricing')).toBe('value_bridge');
    expect(stepInsightKindForStage('evaluation')).toBe(
      'should_cost_normalization',
    );
  });

  it('normalizes case / separators', () => {
    expect(stepInsightKindForStage('Strategy')).toBe('value_pool');
    expect(stepInsightKindForStage('  pricing  ')).toBe('value_bridge');
  });

  it('returns null for steps not yet wired (falls back to the read)', () => {
    expect(stepInsightKindForStage('scope')).toBeNull();
    expect(stepInsightKindForStage('transition')).toBeNull();
  });
});

describe('buildValuePoolInsight — Strategy', () => {
  it('builds a LIVE value pool with one bar per quantified lever from facts', () => {
    const insight = buildValuePoolInsight(AMS_MANAGED_SERVICES, FACTS_ONE_LEVER);
    expect(insight.kind).toBe('value_pool');
    expect(insight.provenance).toBe('live');
    // At least the change-order lever quantifies from these facts.
    expect(insight.bars.length).toBeGreaterThanOrEqual(1);
    // Bars are ranges, biggest-first (high descending).
    for (let i = 1; i < insight.bars.length; i += 1) {
      expect(insight.bars[i - 1].high).toBeGreaterThanOrEqual(
        insight.bars[i].high,
      );
      expect(insight.bars[i].high).toBeGreaterThanOrEqual(insight.bars[i].low);
    }
    // The headline names the total and the biggest lever.
    expect(insight.headline).toMatch(/at stake/i);
    // Unsized levers are NAMED, not dropped or guessed.
    expect(Array.isArray(insight.needsEvidenceLevers)).toBe(true);
  });

  it('falls back to a clearly-marked SAMPLE when no facts quantify a lever', () => {
    const insight = buildValuePoolInsight(AMS_MANAGED_SERVICES, {});
    expect(insight.provenance).toBe('sample');
    expect(insight.note).toBeTruthy();
    // Sample still shows the shape: one bar per declared lever.
    expect(insight.bars.length).toBe(
      (AMS_MANAGED_SERVICES.valueLeverRules ?? []).length,
    );
    // Ranges only — never a bare point (low ≤ high, and a real range).
    for (const bar of insight.bars) {
      expect(bar.high).toBeGreaterThan(bar.low);
    }
  });
});

describe('buildStepInsight — dispatch', () => {
  it('returns the value pool for strategy from facts', () => {
    const insight = buildStepInsight({
      stageKey: 'strategy',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight?.kind).toBe('value_pool');
    expect(insight?.provenance).toBe('live');
  });

  it('returns a live value bridge for pricing when facts quantify', () => {
    const insight = buildStepInsight({
      stageKey: 'pricing',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
      baselineAmount: 30_000_000,
    });
    expect(insight?.kind).toBe('value_bridge');
    expect(insight?.provenance).toBe('live');
    if (insight?.kind === 'value_bridge') {
      // The waterfall carries at least one quantified band.
      const quantified = insight.waterfall.bands.filter(
        (b) => b.state === 'quantified',
      );
      expect(quantified.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns null for a step with no insight in this slice', () => {
    const insight = buildStepInsight({
      stageKey: 'scope',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight).toBeNull();
  });
});

describe('buildShouldCostModelInsight — Evaluation (MODEL)', () => {
  it('is always a sample/model — never presented as real bids', () => {
    const insight = buildShouldCostModelInsight(AMS_MANAGED_SERVICES);
    expect(insight.kind).toBe('should_cost_normalization');
    expect(insight.provenance).toBe('sample');
    expect(insight.note).toMatch(/model|illustrative/i);
    expect(insight.note).toMatch(/vendor responses are ingested/i);
  });

  it('flips the winner after normalization (the trap)', () => {
    const insight = buildShouldCostModelInsight(AMS_MANAGED_SERVICES);
    // The paper-cheapest is NOT the normalized winner — that is the whole point.
    expect(insight.headlineWinnerKey).not.toBe(insight.normalizedWinnerKey);
    // Every vendor: normalizedTco = headline + Σ adjustments (comparable).
    for (const v of insight.vendors) {
      const adj = v.adjustments.reduce((s, a) => s + a.amount, 0);
      expect(v.normalizedTco).toBe(v.headlinePrice + adj);
    }
    expect(insight.headline).toMatch(/cheapest on paper/i);
  });
});

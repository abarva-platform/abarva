// Builder tests for the per-step insight layer. The builder is a pure function:
// facts + archetype + stageKey → the right StepInsightView, live where facts
// exist, else a clearly-marked sample, else honest empty — never a fabricated
// number.

import {
  buildStepInsight,
  buildValuePoolInsight,
  buildScopeCoverageInsight,
  buildRfpClauseInsight,
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
  it('maps the shipped steps to their kinds', () => {
    expect(stepInsightKindForStage('strategy')).toBe('value_pool');
    expect(stepInsightKindForStage('scope')).toBe('scope_coverage');
    expect(stepInsightKindForStage('rfp')).toBe('rfp_clause_coverage');
    expect(stepInsightKindForStage('pricing')).toBe('value_bridge');
    expect(stepInsightKindForStage('evaluation')).toBe(
      'should_cost_normalization',
    );
  });

  it('normalizes case / separators', () => {
    expect(stepInsightKindForStage('Strategy')).toBe('value_pool');
    expect(stepInsightKindForStage('  pricing  ')).toBe('value_bridge');
    expect(stepInsightKindForStage('RFP')).toBe('rfp_clause_coverage');
  });

  it('returns null for steps not yet wired (falls back to the read)', () => {
    expect(stepInsightKindForStage('transition')).toBeNull();
    expect(stepInsightKindForStage('selection')).toBeNull();
  });
});

describe('buildScopeCoverageInsight — Scope', () => {
  it('marks a lever REACHABLE when its required evidence is present, others STRANDED', () => {
    const insight = buildScopeCoverageInsight(
      AMS_MANAGED_SERVICES,
      FACTS_ONE_LEVER,
    );
    expect(insight.kind).toBe('scope_coverage');
    // With real facts (not empty) this is LIVE, not a model.
    expect(insight.provenance).toBe('live');
    expect(insight.isModel).toBe(false);
    // The change-order leakage lever is reachable (its citationRequired inputs
    // annual_change_order_spend + recurring_avoidable_pct are present).
    const leakage = insight.rows.find(
      (r) => r.leverKey === 'AMS.ENHANCEMENT_LEAKAGE',
    );
    expect(leakage?.reachable).toBe(true);
    // At least one other lever is stranded, and its missing evidence is NAMED.
    const stranded = insight.rows.filter((r) => !r.reachable);
    expect(stranded.length).toBeGreaterThan(0);
    expect(stranded[0].missingEvidence.length).toBeGreaterThan(0);
    // Stranded $ is counted in the honest headline (reachable vs stranded).
    expect(insight.headline).toMatch(/reachable/i);
    expect(insight.headline).toMatch(/stranded/i);
    // Reachable-first ordering.
    const firstStrandedIdx = insight.rows.findIndex((r) => !r.reachable);
    const lastReachableIdx = insight.rows.reduce(
      (acc, r, i) => (r.reachable ? i : acc),
      -1,
    );
    if (firstStrandedIdx >= 0) {
      expect(lastReachableIdx).toBeLessThan(firstStrandedIdx);
    }
    // Advisor layer renders best-practice / benchmark / downstream.
    expect(insight.bestPractice?.length ?? 0).toBeGreaterThan(0);
    expect(insight.benchmark).toMatch(/market range/i);
    expect(insight.downstreamImpact).toMatch(/ceiling/i);
  });

  it('all-evidence → all reachable, nothing stranded', () => {
    // Provide every citationRequired input across all AMS levers.
    const ALL_EVIDENCE: EventFactMap = {
      annual_change_order_spend: 4_000_000,
      recurring_avoidable_pct: 0.35,
      annual_run_cost: 12_000_000,
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
      overrun_probability: 0.3,
      term_years: 3,
    };
    const insight = buildScopeCoverageInsight(AMS_MANAGED_SERVICES, ALL_EVIDENCE);
    expect(insight.provenance).toBe('live');
    expect(insight.rows.every((r) => r.reachable)).toBe(true);
    expect(insight.rows.every((r) => r.missingEvidence.length === 0)).toBe(true);
    expect(insight.headline).toMatch(/nothing stranded/i);
  });

  it('no facts → honest MODEL badge, no fabricated tenant numbers', () => {
    const insight = buildScopeCoverageInsight(AMS_MANAGED_SERVICES, {});
    expect(insight.provenance).toBe('sample');
    expect(insight.isModel).toBe(true);
    expect(insight.note).toMatch(/model/i);
    // A model shows what a complete scope unlocks — ranges only, never a point.
    for (const r of insight.rows) {
      expect(r.high).toBeGreaterThan(r.low);
    }
    expect(insight.headline).toMatch(/complete scope/i);
  });
});

describe('buildRfpClauseInsight — RFP', () => {
  it('lists exposed levers with their real rfpClause + bafoAsk text (MODEL)', () => {
    const insight = buildRfpClauseInsight(AMS_MANAGED_SERVICES, FACTS_ONE_LEVER);
    expect(insight.kind).toBe('rfp_clause_coverage');
    // No RFP-draft signal in the fact model yet → always a model, all exposed.
    expect(insight.isModel).toBe(true);
    expect(insight.provenance).toBe('sample');
    expect(insight.rows.every((r) => !r.protected)).toBe(true);
    // Each row carries the EXACT clause text from the archetype playbook.
    const leakage = insight.rows.find(
      (r) => r.leverKey === 'AMS.ENHANCEMENT_LEAKAGE',
    );
    expect(leakage?.rfpClause).toMatch(/classify recurring support/i);
    expect(leakage?.bafoAsk).toMatch(/fixed service catalog/i);
    // Headline sizes the pool + the exposed count.
    expect(insight.headline).toMatch(/pool depends on/i);
    expect(insight.headline).toMatch(/exposed/i);
    // Advisor layer.
    expect(insight.bestPractice?.length ?? 0).toBeGreaterThan(0);
    expect(insight.benchmark).toMatch(/market range/i);
    expect(insight.downstreamImpact).toMatch(/last point to lock/i);
    // Honesty note explains what makes it fully live.
    expect(insight.note).toMatch(/RFP-draft signal/i);
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

  it('returns scope coverage for scope, rfp clause coverage for rfp', () => {
    const scope = buildStepInsight({
      stageKey: 'scope',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(scope?.kind).toBe('scope_coverage');
    const rfp = buildStepInsight({
      stageKey: 'rfp',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(rfp?.kind).toBe('rfp_clause_coverage');
  });

  it('returns null for a step with no insight in this slice', () => {
    const insight = buildStepInsight({
      stageKey: 'transition',
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

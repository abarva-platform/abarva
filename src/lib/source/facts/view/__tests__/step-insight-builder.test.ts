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
  buildTransitionRiskInsight,
  buildExecDecisionInsight,
  buildValueRealizationInsight,
  buildResponseCoverageInsight,
  buildBafoProgressInsight,
  buildCommittedValueInsight,
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

// The seeded transition facts (the values the Lakeshore seed persists). The
// AMS.TRANSITION_RISK lever computes transition_fee × overrun_cost_multiple ×
// (overrun_probability / 100).
const FACTS_TRANSITION: EventFactMap = {
  transition_fee: 3_100_000,
  overrun_probability: 30,
  overrun_cost_multiple: 1.6,
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

  it('maps the remaining steps to their kinds', () => {
    expect(stepInsightKindForStage('transition')).toBe('transition_risk');
    expect(stepInsightKindForStage('exec_decision')).toBe('exec_decision');
    expect(stepInsightKindForStage('executive_decision')).toBe('exec_decision');
    expect(stepInsightKindForStage('value')).toBe('value_realization');
    expect(stepInsightKindForStage('responses')).toBe('response_coverage');
    expect(stepInsightKindForStage('bafo')).toBe('bafo_progress');
    expect(stepInsightKindForStage('selection')).toBe('committed_value');
  });

  it('returns null for a step with no insight in this slice', () => {
    expect(stepInsightKindForStage('closeout')).toBeNull();
    expect(stepInsightKindForStage('unknown-stage')).toBeNull();
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

  it('returns a LIVE transition-risk insight for transition from seeded facts', () => {
    const insight = buildStepInsight({
      stageKey: 'transition',
      inputs: FACTS_TRANSITION,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight?.kind).toBe('transition_risk');
    expect(insight?.provenance).toBe('live');
  });

  it('returns a LIVE exec-decision insight for the decision step when facts quantify', () => {
    const insight = buildStepInsight({
      stageKey: 'exec_decision',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight?.kind).toBe('exec_decision');
    expect(insight?.provenance).toBe('live');
  });

  it('returns MODEL insights for value / responses / bafo / selection', () => {
    const value = buildStepInsight({
      stageKey: 'value',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(value?.kind).toBe('value_realization');
    expect(value?.provenance).toBe('sample');

    const responses = buildStepInsight({
      stageKey: 'responses',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(responses?.kind).toBe('response_coverage');
    expect(responses?.provenance).toBe('sample');

    const bafo = buildStepInsight({
      stageKey: 'bafo',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(bafo?.kind).toBe('bafo_progress');
    expect(bafo?.provenance).toBe('sample');

    const selection = buildStepInsight({
      stageKey: 'selection',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(selection?.kind).toBe('committed_value');
    expect(selection?.provenance).toBe('sample');
  });

  it('returns null for a step with no insight in this slice', () => {
    const insight = buildStepInsight({
      stageKey: 'closeout',
      inputs: FACTS_ONE_LEVER,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight).toBeNull();
  });
});

describe('buildTransitionRiskInsight — Transition (LIVE)', () => {
  it('computes the exposure band + fee-at-risk from the seeded transition facts', () => {
    const insight = buildTransitionRiskInsight(
      AMS_MANAGED_SERVICES,
      FACTS_TRANSITION,
    );
    expect(insight.kind).toBe('transition_risk');
    expect(insight.provenance).toBe('live');
    expect(insight.quantified).toBe(true);
    // The fee-at-risk cap is the real transition fee.
    expect(insight.transitionFee).toBe(3_100_000);
    // Exposure = fee × multiple × (prob/100) = 3.1M × 1.6 × 0.3 = 1.488M (expected),
    // with a conservative haircut low end. Real $, a range (low < high), never $0.
    expect(insight.exposureHigh).toBeCloseTo(3_100_000 * 1.6 * 0.3, 0);
    expect(insight.exposureLow).toBeGreaterThan(0);
    expect(insight.exposureHigh).toBeGreaterThan(insight.exposureLow);
    expect(insight.overrunProbabilityPct).toBe(30);
    expect(insight.overrunCostMultiple).toBe(1.6);
    // Headline states the at-risk $ and the milestone cap.
    expect(insight.headline).toMatch(/at risk/i);
    expect(insight.headline).toMatch(/milestone/i);
    // Advisor layer surfaces the playbook clause + downstream.
    expect(insight.bestPractice?.some((l) => /milestone/i.test(l))).toBe(true);
    expect(insight.downstreamImpact).toMatch(/retained-cost|delayed value/i);
  });

  it('renders an honest empty (never $0) when the transition facts are absent', () => {
    const insight = buildTransitionRiskInsight(AMS_MANAGED_SERVICES, {});
    expect(insight.provenance).toBe('sample');
    expect(insight.quantified).toBe(false);
    expect(insight.exposureLow).toBe(0);
    expect(insight.exposureHigh).toBe(0);
    expect(insight.note).toMatch(/needs evidence/i);
    // Still no fabricated tenant number in the headline.
    expect(insight.headline).toMatch(/provide the transition fee/i);
  });
});

describe('buildExecDecisionInsight — Executive Decision (LIVE)', () => {
  it('classifies computed value into negotiable / protected / risk, stated apart', () => {
    // Facts that quantify multiple value types: change-order (protected),
    // volume-band (incremental), transition (risk_adjusted).
    const FACTS_MULTI: EventFactMap = {
      annual_change_order_spend: 4_000_000,
      recurring_avoidable_pct: 0.35,
      annual_run_cost: 12_000_000,
      projected_volume_decline_pct: 0.2,
      variable_cost_share_pct: 0.6,
      transition_fee: 3_100_000,
      overrun_probability: 30,
      overrun_cost_multiple: 1.6,
      term_years: 3,
    };
    const insight = buildExecDecisionInsight(AMS_MANAGED_SERVICES, {
      stageKey: 'exec_decision',
      inputs: FACTS_MULTI,
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight.kind).toBe('exec_decision');
    expect(insight.provenance).toBe('live');
    expect(insight.computedLeverCount).toBeGreaterThanOrEqual(1);
    // Slices are stated apart (each bucket present appears once, with a real range).
    const buckets = insight.slices.map((s) => s.bucket);
    expect(new Set(buckets).size).toBe(buckets.length); // no bucket duplicated
    for (const s of insight.slices) {
      expect(s.high).toBeGreaterThanOrEqual(s.low);
    }
    // Headline never folds protected/risk into the negotiable number.
    expect(insight.headline).toMatch(/negotiable/i);
    expect(insight.headline).toMatch(/stated apart|apart|confidence/i);
  });

  it('falls back to a clearly-marked SAMPLE when no lever computes', () => {
    const insight = buildExecDecisionInsight(AMS_MANAGED_SERVICES, {
      stageKey: 'exec_decision',
      inputs: {},
      citations: {},
      archetypeId: 'AMS_MANAGED_SERVICES',
    });
    expect(insight.provenance).toBe('sample');
    expect(insight.computedLeverCount).toBe(0);
    expect(insight.note).toBeTruthy();
    // Residual-risk names the unsized levers, never a fabricated $.
    expect(insight.residualRiskLeverCount).toBeGreaterThan(0);
    expect(insight.residualRiskLevers.length).toBe(insight.residualRiskLeverCount);
  });
});

describe('MODEL step insights — value / responses / bafo / selection', () => {
  it('value_realization: committed track + null realized, names the flip fact', () => {
    const insight = buildValueRealizationInsight(
      AMS_MANAGED_SERVICES,
      FACTS_ONE_LEVER,
    );
    expect(insight.kind).toBe('value_realization');
    expect(insight.provenance).toBe('sample');
    // Committed is a positive track; realized is null (never a fabricated number).
    expect(insight.points.length).toBeGreaterThan(0);
    expect(insight.points.every((p) => p.committed >= 0)).toBe(true);
    expect(insight.points.every((p) => p.realized === null)).toBe(true);
    expect(insight.flipFact).toMatch(/realized-value actuals/i);
    expect(insight.note).toMatch(/model/i);
    // Advisor layer present.
    expect(insight.bestPractice?.length ?? 0).toBeGreaterThan(0);
  });

  it('response_coverage: every dimension dodged (MODEL), carries evaluationImpact', () => {
    const insight = buildResponseCoverageInsight(
      AMS_MANAGED_SERVICES,
      FACTS_ONE_LEVER,
    );
    expect(insight.kind).toBe('response_coverage');
    expect(insight.provenance).toBe('sample');
    expect(insight.rows.length).toBeGreaterThan(0);
    expect(insight.rows.every((r) => r.status === 'dodged')).toBe(true);
    expect(insight.rows.every((r) => r.evaluationImpact.length > 0)).toBe(true);
    expect(insight.flipFact).toMatch(/vendor responses ingested/i);
  });

  it('bafo_progress: captured 0 vs target, carries the bafoAsk, names the flip', () => {
    const insight = buildBafoProgressInsight(
      AMS_MANAGED_SERVICES,
      FACTS_ONE_LEVER,
    );
    expect(insight.kind).toBe('bafo_progress');
    expect(insight.provenance).toBe('sample');
    expect(insight.rows.length).toBeGreaterThan(0);
    // Captured is 0 (never fabricated); target is a real range.
    expect(insight.rows.every((r) => r.captured === 0)).toBe(true);
    expect(insight.rows.every((r) => r.targetHigh >= r.targetLow)).toBe(true);
    expect(insight.rows.every((r) => r.bafoAsk.length > 0)).toBe(true);
    // Biggest-target first.
    for (let i = 1; i < insight.rows.length; i += 1) {
      expect(insight.rows[i - 1].targetHigh).toBeGreaterThanOrEqual(
        insight.rows[i].targetHigh,
      );
    }
    expect(insight.flipFact).toMatch(/BAFO concession actuals/i);
  });

  it('committed_value: compact bars by lever, names the award flip fact', () => {
    const insight = buildCommittedValueInsight(
      AMS_MANAGED_SERVICES,
      FACTS_ONE_LEVER,
    );
    expect(insight.kind).toBe('committed_value');
    expect(insight.provenance).toBe('sample');
    expect(insight.bars.length).toBeGreaterThan(0);
    expect(insight.bars.every((b) => b.high >= b.low)).toBe(true);
    expect(insight.flipFact).toMatch(/award facts/i);
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

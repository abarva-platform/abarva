// Pricing/negotiation proof: deterministic, evidence-grounded commercial
// analysis. Every figure carries a citation; missing inputs are surfaced, never
// silently assumed; negotiation levers sequence by archetype DNA.

import { AMS_MANAGED_SERVICES, CONTRACT_RENEWAL } from '../registry';
import {
  negotiationPlan,
  normalizeProposals,
  shouldCostModel,
  switchingLeverage,
} from '../pricing-engine';

describe('should-cost model (AMS)', () => {
  it('sums grounded components and propagates citations', () => {
    const r = shouldCostModel(AMS_MANAGED_SERVICES, {
      components: [
        { value: 4_000_000, citation: 'ev:run_cost_baseline#labor', label: 'labor' },
        { value: 800_000, citation: 'ev:run_cost_baseline#tooling', label: 'tooling' },
        { value: 600_000, citation: 'ev:run_cost_baseline#shift', label: 'shift' },
      ],
      productivityGlidePath: 0.1,
    });
    expect(r.totalShouldCost).toBe(5_400_000);
    expect(r.glidePathYear2).toBe(4_860_000); // 10% productivity
    expect(r.confidence).toBe('high');
    expect(r.citations).toHaveLength(3);
    expect(r.traps.length).toBeGreaterThan(0);
  });

  it('refuses to assert a number with no grounded inputs', () => {
    const r = shouldCostModel(AMS_MANAGED_SERVICES, { components: [] });
    expect(r.confidence).toBe('insufficient_evidence');
    expect(r.missingInputs).toContain('run_cost_baseline');
  });
});

describe('TCO normalization', () => {
  it('adds back excluded components from peer median and names the exclusion', () => {
    const r = normalizeProposals(AMS_MANAGED_SERVICES, [
      { vendor: 'Acme', lines: [
        { value: 5_000_000, citation: 'p:acme#base', label: 'base' },
        { value: 500_000, citation: 'p:acme#transition', label: 'transition' },
      ] },
      { vendor: 'Globex', lines: [
        { value: 4_600_000, citation: 'p:globex#base', label: 'base' },
      ], excludedComponents: ['transition'] }, // excluded transition
    ]);
    const globex = r.vendors.find((v) => v.vendor === 'Globex')!;
    expect(globex.statedTotal).toBe(4_600_000);
    // peer median for 'transition' = 500k added back
    expect(globex.normalizedTotal).toBe(5_100_000);
    expect(globex.excludedComponents).toContain('transition');
    // Acme stated 5.5M (base 5.0M + transition 0.5M); Globex normalizes to 5.1M
    // → Globex wins on a true apples-to-apples basis
    expect(r.vendors.find((v) => v.vendor === 'Acme')!.normalizedTotal).toBe(5_500_000);
    expect(r.bestVendor).toBe('Globex');
    expect(r.confidence).toBe('high');
  });

  it('reports insufficient evidence with no proposals', () => {
    const r = normalizeProposals(AMS_MANAGED_SERVICES, []);
    expect(r.confidence).toBe('insufficient_evidence');
    expect(r.bestVendor).toBeNull();
  });
});

describe('switching leverage (renewal BATNA)', () => {
  it('computes payback and a strong BATNA when switch pays back fast near renewal', () => {
    const r = switchingLeverage(CONTRACT_RENEWAL, {
      currentAnnualSpend: { value: 2_000_000, citation: 'ev:spend_baseline#total' },
      switchingCost: { value: 1_500_000, citation: 'ev:switching_cost#est' },
      monthsToRenewal: 4,
    });
    expect(r.switchPaybackYears).toBe(0.75);
    expect(r.batna).toBe('strong');
    expect(r.confidence).toBe('high');
    expect(r.citations).toHaveLength(2);
  });

  it('surfaces missing inputs and refuses a verdict when ungrounded', () => {
    const r = switchingLeverage(CONTRACT_RENEWAL, {
      currentAnnualSpend: { value: 2_000_000, citation: 'ev:spend_baseline#total' },
      // switchingCost missing
    });
    expect(r.switchPaybackYears).toBeNull();
    expect(r.batna).toBe('unknown');
    expect(r.missingInputs).toContain('switching_cost');
  });
});

describe('negotiation plan — sequenced by archetype DNA', () => {
  it('orders AMS levers by timing and includes productivity glide-path', () => {
    const plan = negotiationPlan(AMS_MANAGED_SERVICES);
    const timings = plan.sequence.map((g) => g.timing);
    // pre_rfp must come before bafo/final
    expect(timings.indexOf('pre_rfp')).toBeLessThan(timings.indexOf('bafo'));
    const allLevers = plan.sequence.flatMap((g) => g.levers.map((l) => l.key));
    expect(allLevers).toContain('productivity_glidepath');
    expect(plan.pricingModel).toMatch(/resource-unit/);
  });

  it('renewal plan leads with renewal-timing pressure pre-RFP', () => {
    const plan = negotiationPlan(CONTRACT_RENEWAL);
    const preRfp = plan.sequence.find((g) => g.timing === 'pre_rfp')!;
    expect(preRfp.levers.map((l) => l.key)).toContain('renewal_timing');
  });
});

/**
 * @jest-environment jsdom
 */
// Apex × customer care — the function-aware Intelligence substrate, verified
// against the experience spec §3 / §4 bar.
//
// Mirrors the Meridian × VBC reference tests:
//   • binds the Customer-care Function Pack as the frame;
//   • renders the four §4 decision-home blocks, in order;
//   • surfaces the audited self-service-resolution-rate as the off-benchmark
//     vital (Apex containment 28% vs. the 30–70 planning band);
//   • renders Apex's seed gaps honestly — cost per contact, contacts per
//     order, service level, abandonment, avoidable-contact share, service NPS,
//     agent attrition — never as fabricated numbers;
//   • bet-selection ranks the conversational-self-service archetype top and
//     reads it as `fund_first`, because it is the bet whose moved metrics
//     include Apex's measured off-benchmark containment;
//   • the surface does NOT render Meridian content under any code path.

// Importing the Apex binding modules registers them with the tenant-binding
// registry as a side effect — every test below reads through the generic
// builders and so depends on this registration.
import '../apex-decision-home';
import '../apex-bet-selection';

import {
  APEX_FUNCTION_KEY,
  APEX_INDUSTRY_KEY,
  APEX_GROUNDED_CUSTOMER_CARE_METRIC_KEYS,
  buildApexCustomerCareDecisionHome,
} from '../apex-decision-home';
import { buildApexCustomerCareBetSelection } from '../apex-bet-selection';
import { resolveFunctionPack } from '../function-pack-registry';

describe('Apex × customer-care decision home', () => {
  it('binds the Customer-care Function Pack as the frame', () => {
    const pack = resolveFunctionPack(APEX_INDUSTRY_KEY, APEX_FUNCTION_KEY);
    expect(pack).not.toBeNull();
    expect(pack!.functionKey).toBe('customer_care');

    const home = buildApexCustomerCareDecisionHome('Apex Retail');
    expect(home).not.toBeNull();
    expect(home!.functionLabel).toBe(pack!.functionLabel);

    // Every vital is one of the Function Pack's operating metrics.
    const packMetricKeys = new Set(pack!.operatingMetrics.map((m) => m.key));
    const vitalKeys = [...home!.vitals.off, ...home!.vitals.rest].map(
      (v) => v.key,
    );
    expect(vitalKeys.length).toBe(pack!.operatingMetrics.length);
    for (const key of vitalKeys) {
      expect(packMetricKeys.has(key)).toBe(true);
    }
  });

  it('assembles the four §4 blocks', () => {
    const home = buildApexCustomerCareDecisionHome('Apex Retail')!;
    // 1 — the one thing
    expect(home.headline.statement.length).toBeGreaterThan(0);
    expect(home.headline.honestyClause.length).toBeGreaterThan(0);
    // 2 — decisions that need you (2–3 answer-first cards)
    expect(home.decisions.length).toBeGreaterThanOrEqual(2);
    for (const card of home.decisions) {
      expect(card.recommendedAction.length).toBeGreaterThan(0);
      expect(card.stake.length).toBeGreaterThan(0);
      expect(card.evidence.length).toBeGreaterThan(0);
      expect(card.gestureHref.length).toBeGreaterThan(0);
    }
    // 3 — the function's vitals
    expect(home.vitals.expectedCount).toBe(
      home.vitals.off.length + home.vitals.rest.length,
    );
    // 4 — where you are in the cadence
    expect(home.cadence.stages.length).toBeGreaterThanOrEqual(3);
    expect(home.cadence.stages.some((s) => s.isCurrent)).toBe(true);
  });

  it('surfaces self-service-resolution-rate as the off-benchmark vital', () => {
    const home = buildApexCustomerCareDecisionHome('Apex Retail')!;
    // Apex containment at 28% sits below the 30–70 Function Pack planning
    // band — the one measured-and-off metric Apex's audited substrate carries.
    expect(home.vitals.off.length).toBeGreaterThan(0);
    const offKeys = home.vitals.off.map((v) => v.key);
    expect(offKeys).toContain('self_service_resolution_rate');

    const containment = home.vitals.off.find(
      (v) => v.key === 'self_service_resolution_rate',
    )!;
    expect(containment.state).toBe('off');
    expect(containment.meridianValue).toBe(28);
    expect(containment.source.toLowerCase()).toContain('apex');
  });

  it('renders Apex seed gaps honestly (never fabricates a missing metric)', () => {
    const home = buildApexCustomerCareDecisionHome('Apex Retail')!;
    const seedGaps = home.vitals.rest.filter((v) => v.state === 'seed_gap');
    expect(seedGaps.length).toBeGreaterThan(0);

    // Cost per contact is Apex's headline seed gap — the explicit tenant
    // action item due 2026-05-15.
    const costGap = seedGaps.find((v) => v.key === 'cost_per_contact');
    expect(costGap).toBeDefined();
    expect(costGap!.meridianValue).toBeNull();
    expect(costGap!.read.toLowerCase()).toContain('cost');
  });

  it('only grounds the Function-Pack metric keys Apex has audited', () => {
    // The grounded set is the closed list of metrics Apex's audited substrate
    // carries — anything else is honestly a seed gap.
    const home = buildApexCustomerCareDecisionHome('Apex Retail')!;
    const groundedKeys = [...home.vitals.off, ...home.vitals.rest]
      .filter((v) => v.meridianValue !== null)
      .map((v) => v.key);
    for (const key of groundedKeys) {
      expect(APEX_GROUNDED_CUSTOMER_CARE_METRIC_KEYS.has(key)).toBe(true);
    }
  });

  it('does not leak Meridian content — copy speaks Apex / retail language', () => {
    const home = buildApexCustomerCareDecisionHome('Apex Retail')!;
    // The Meridian-flavoured words must never appear in Apex copy.
    const allCopy = [
      home.headline.statement,
      home.headline.honestyClause,
      home.headline.eyebrow,
      home.cadence.frameName,
      home.cadence.framing,
      home.cadence.currentDemand,
      ...home.decisions.map((d) => `${d.recommendedAction} ${d.stake} ${d.evidence}`),
    ]
      .join(' ')
      .toLowerCase();
    expect(allCopy).not.toContain('meridian');
    expect(allCopy).not.toContain('mssp');
    expect(allCopy).not.toMatch(/\braf\b/);
    expect(allCopy).not.toMatch(/\bhcc\b/);
    expect(allCopy).not.toContain('shared savings');
  });
});

describe('Apex × customer-care bet selection', () => {
  it('binds the Customer-care Function Pack as the frame', () => {
    const pack = resolveFunctionPack(APEX_INDUSTRY_KEY, APEX_FUNCTION_KEY);
    const selection = buildApexCustomerCareBetSelection('Apex Retail');
    expect(selection).not.toBeNull();
    expect(selection!.functionLabel).toBe(pack!.functionLabel);
  });

  it('renders Function Pack archetypes as the ranked candidate bets', () => {
    const pack = resolveFunctionPack(APEX_INDUSTRY_KEY, APEX_FUNCTION_KEY)!;
    const selection = buildApexCustomerCareBetSelection('Apex Retail')!;
    const archetypeKeys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(selection.bets.length).toBe(pack.aiUseCaseArchetypes.length);
    for (const bet of selection.bets) {
      expect(archetypeKeys.has(bet.key)).toBe(true);
      expect(bet.valueMechanism.length).toBeGreaterThan(0);
      expect(['fund_first', 'shape', 'hold_for_evidence']).toContain(bet.read);
    }
  });

  it('ranks the conversational-self-service bet as fund_first', () => {
    const selection = buildApexCustomerCareBetSelection('Apex Retail')!;
    // The conversational-self-service archetype moves Apex's one measured-and-
    // off metric (self_service_resolution_rate), so it earns the top rank AND
    // the fund_first read — every other bet is shape / hold_for_evidence.
    const topBet = selection.bets[0];
    expect(topBet.key).toBe('conversational_self_service');
    expect(topBet.rank).toBe(1);
    expect(topBet.read).toBe('fund_first');
    expect(topBet.restsOnSeedGap).toBe(false);
  });

  it('renders held-for-evidence bets where the substrate is unseeded', () => {
    const selection = buildApexCustomerCareBetSelection('Apex Retail')!;
    const heldBets = selection.bets.filter((b) => b.read === 'hold_for_evidence');
    // The service-demand-forecasting bet moves only metrics Apex has not
    // seeded — service level, abandonment, cost per contact, attrition — so
    // it is honestly held for evidence rather than ranked on a fabricated
    // number.
    expect(heldBets.length).toBeGreaterThan(0);
    expect(heldBets.map((b) => b.key)).toContain(
      'service_demand_forecasting_scheduling',
    );
    for (const bet of heldBets) {
      expect(bet.restsOnSeedGap).toBe(true);
    }
  });

  it('names the cost-per-contact gate plainly', () => {
    const selection = buildApexCustomerCareBetSelection('Apex Retail')!;
    expect(selection.gates.length).toBeGreaterThan(0);
    const gateCopy = selection.gates
      .map((g) => `${g.title} ${g.description} ${g.whatItWouldMove}`)
      .join(' ')
      .toLowerCase();
    expect(gateCopy).toContain('cost-per-contact');
  });

  it('does not leak Meridian content', () => {
    const selection = buildApexCustomerCareBetSelection('Apex Retail')!;
    const allCopy = [
      selection.headline.question,
      selection.headline.answer,
      selection.headline.rationale,
      selection.headline.honestyClause,
      selection.headline.eyebrow,
      ...selection.gates.map(
        (g) => `${g.title} ${g.description} ${g.whatItWouldMove}`,
      ),
    ]
      .join(' ')
      .toLowerCase();
    expect(allCopy).not.toContain('meridian');
    expect(allCopy).not.toContain('mssp');
    expect(allCopy).not.toContain('raf');
    expect(allCopy).not.toContain('shared savings');
  });

  it('is not flagged as a reference example for Apex', () => {
    const selection = buildApexCustomerCareBetSelection('Apex Retail')!;
    expect(selection.isReferenceExample).toBe(false);
  });
});

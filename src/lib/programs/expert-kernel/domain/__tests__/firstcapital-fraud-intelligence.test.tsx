/**
 * @jest-environment jsdom
 */
// First Capital × Fraud & financial crime — the function-aware Intelligence
// substrate, verified against the experience spec §3 / §4 bar.

import '../firstcapital-decision-home';
import '../firstcapital-bet-selection';

import {
  FIRSTCAPITAL_FUNCTION_KEY,
  FIRSTCAPITAL_INDUSTRY_KEY,
  FIRSTCAPITAL_GROUNDED_FRAUD_METRIC_KEYS,
  buildFirstCapitalFraudDecisionHome,
} from '../firstcapital-decision-home';
import { buildFirstCapitalFraudBetSelection } from '../firstcapital-bet-selection';
import { resolveFunctionPack } from '../function-pack-registry';

describe('First Capital × fraud decision home', () => {
  it('binds the Fraud-and-Financial-Crime Function Pack as the frame', () => {
    const pack = resolveFunctionPack(
      FIRSTCAPITAL_INDUSTRY_KEY,
      FIRSTCAPITAL_FUNCTION_KEY,
    );
    expect(pack).not.toBeNull();
    expect(pack!.functionKey).toBe('fraud_financial_crime');

    const home = buildFirstCapitalFraudDecisionHome('First Capital Financial');
    expect(home).not.toBeNull();
    expect(home!.functionLabel).toBe(pack!.functionLabel);

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
    const home = buildFirstCapitalFraudDecisionHome('First Capital Financial')!;
    expect(home.headline.statement.length).toBeGreaterThan(0);
    expect(home.headline.honestyClause.length).toBeGreaterThan(0);
    expect(home.decisions.length).toBeGreaterThanOrEqual(2);
    for (const card of home.decisions) {
      expect(card.recommendedAction.length).toBeGreaterThan(0);
      expect(card.stake.length).toBeGreaterThan(0);
      expect(card.evidence.length).toBeGreaterThan(0);
      expect(card.gestureHref.length).toBeGreaterThan(0);
    }
    expect(home.vitals.expectedCount).toBe(
      home.vitals.off.length + home.vitals.rest.length,
    );
    expect(home.cadence.stages.length).toBeGreaterThanOrEqual(3);
    expect(home.cadence.stages.some((s) => s.isCurrent)).toBe(true);
  });

  it('grounds the alert-to-SAR-conversion and SAR-timeliness vitals', () => {
    const home = buildFirstCapitalFraudDecisionHome('First Capital Financial')!;
    const allVitals = [...home.vitals.off, ...home.vitals.rest];
    const aml = allVitals.find((v) => v.key === 'alert_to_sar_conversion');
    expect(aml).toBeDefined();
    expect(aml!.meridianValue).toBe(6);
    expect(aml!.source.toLowerCase()).toContain('first capital');

    const sar = allVitals.find((v) => v.key === 'sar_filing_timeliness');
    expect(sar).toBeDefined();
    expect(sar!.meridianValue).toBe(92);
  });

  it('renders First Capital seed gaps honestly', () => {
    const home = buildFirstCapitalFraudDecisionHome('First Capital Financial')!;
    const seedGaps = home.vitals.rest.filter((v) => v.state === 'seed_gap');
    expect(seedGaps.length).toBeGreaterThan(0);

    // Basis-points fraud loss and account-takeover rate are FC's headline
    // seed gaps — both directly referenced in the binding's grounded copy.
    const bpsGap = seedGaps.find((v) => v.key === 'fraud_loss_basis_points');
    expect(bpsGap).toBeDefined();
    expect(bpsGap!.meridianValue).toBeNull();
    const atoGap = seedGaps.find((v) => v.key === 'account_takeover_rate');
    expect(atoGap).toBeDefined();
    expect(atoGap!.meridianValue).toBeNull();
  });

  it('only grounds the Function-Pack metric keys First Capital has audited', () => {
    const home = buildFirstCapitalFraudDecisionHome('First Capital Financial')!;
    const groundedKeys = [...home.vitals.off, ...home.vitals.rest]
      .filter((v) => v.meridianValue !== null)
      .map((v) => v.key);
    for (const key of groundedKeys) {
      expect(FIRSTCAPITAL_GROUNDED_FRAUD_METRIC_KEYS.has(key)).toBe(true);
    }
  });

  it('does not leak Meridian or retail content — copy is banking-operator', () => {
    const home = buildFirstCapitalFraudDecisionHome('First Capital Financial')!;
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
    expect(allCopy).not.toContain('apex');
    expect(allCopy).not.toContain('retail peak');
    expect(allCopy).not.toContain('zendesk');
    // Affirmatively contains banking-operator language.
    expect(allCopy).toContain('aml');
    expect(allCopy).toContain('sar');
  });
});

describe('First Capital × fraud bet selection', () => {
  it('renders Function Pack archetypes as the ranked candidate bets', () => {
    const pack = resolveFunctionPack(
      FIRSTCAPITAL_INDUSTRY_KEY,
      FIRSTCAPITAL_FUNCTION_KEY,
    )!;
    const selection = buildFirstCapitalFraudBetSelection(
      'First Capital Financial',
    )!;
    const archetypeKeys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(selection.bets.length).toBe(pack.aiUseCaseArchetypes.length);
    for (const bet of selection.bets) {
      expect(archetypeKeys.has(bet.key)).toBe(true);
      expect(bet.valueMechanism.length).toBeGreaterThan(0);
      expect(['fund_first', 'shape', 'hold_for_evidence']).toContain(bet.read);
    }
  });

  it('ranks the AML-monitoring-uplift bet at the top', () => {
    const selection = buildFirstCapitalFraudBetSelection(
      'First Capital Financial',
    )!;
    // AML-monitoring-uplift moves both of FC's grounded metrics (alert-to-SAR
    // conversion AND investigator productivity / cycle time which it shares
    // with several others) — it scores highest among grounded bets AND is the
    // most-adopted archetype among the grounded set.
    const topBet = selection.bets[0];
    expect(topBet.key).toBe('aml_monitoring_uplift_alert_triage');
    expect(topBet.rank).toBe(1);
    // None of FC's grounded metrics is off the planning band, so the top bet
    // reads as `shape` rather than `fund_first` — that is the §3 honest read.
    expect(['shape', 'fund_first']).toContain(topBet.read);
  });

  it('honestly holds real-time-fraud bets for evidence', () => {
    const selection = buildFirstCapitalFraudBetSelection(
      'First Capital Financial',
    )!;
    const heldBets = selection.bets.filter((b) => b.read === 'hold_for_evidence');
    expect(heldBets.length).toBeGreaterThan(0);
    const heldKeys = heldBets.map((b) => b.key);
    // The real-time transaction-fraud archetype moves only metrics FC has not
    // seeded (bps, detection rate, decision latency) and so is held.
    expect(heldKeys).toContain('real_time_transaction_fraud_detection');
    for (const bet of heldBets) {
      expect(bet.restsOnSeedGap).toBe(true);
    }
  });

  it('names the real-time-fraud-substrate gate plainly', () => {
    const selection = buildFirstCapitalFraudBetSelection(
      'First Capital Financial',
    )!;
    expect(selection.gates.length).toBeGreaterThan(0);
    const gateCopy = selection.gates
      .map((g) => `${g.title} ${g.description} ${g.whatItWouldMove}`)
      .join(' ')
      .toLowerCase();
    expect(gateCopy).toContain('basis points');
    expect(gateCopy).toContain('decision latency');
  });

  it('does not leak Meridian or retail content', () => {
    const selection = buildFirstCapitalFraudBetSelection(
      'First Capital Financial',
    )!;
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
    expect(allCopy).not.toContain('apex');
    expect(allCopy).toContain('aml');
  });

  it('is not flagged as a reference example for First Capital', () => {
    const selection = buildFirstCapitalFraudBetSelection(
      'First Capital Financial',
    )!;
    expect(selection.isReferenceExample).toBe(false);
  });
});

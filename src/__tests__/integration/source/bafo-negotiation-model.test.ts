import {
  buildBafoNegotiationSummary,
  BafoLeverType,
  BafoNegotiationOpportunityStrength,
  BafoNegotiationRiskLevel,
  BafoScenarioOutcome,
  BafoSummary,
} from '../../../lib/source/bafo-negotiation-model';

const LEVER_TYPES: BafoLeverType[] = [
  'price', 'scope', 'term', 'transition', 'governance',
  'liability', 'exclusion', 'timing', 'volume',
  'service_level', 'evidence', 'payment_terms',
];

const OPPORTUNITY_STRENGTHS: BafoNegotiationOpportunityStrength[] = ['strong', 'moderate', 'weak'];
const RISK_LEVELS: BafoNegotiationRiskLevel[] = ['high', 'medium', 'low'];
const SCENARIO_OUTCOMES: BafoScenarioOutcome[] = ['accept', 'counter', 'reject', 'escalate'];

describe('bafo-negotiation-model - BafoLeverType vocabulary', () => {
  it('defines exactly 12 lever types', () => {
    expect(LEVER_TYPES).toHaveLength(12);
  });

  it('includes all expected lever types', () => {
    const expected = ['price', 'scope', 'term', 'transition', 'governance',
      'liability', 'exclusion', 'timing', 'volume', 'service_level', 'evidence', 'payment_terms'];
    for (const t of expected) {
      expect(LEVER_TYPES).toContain(t);
    }
  });
});

describe('bafo-negotiation-model - buildBafoNegotiationSummary', () => {
  const input = {
    eventId: 'evt-test-bafo',
    eventName: 'Test BAFO Event',
    vendorIds: ['vendor-a', 'vendor-b'],
    stage: 'bafo',
  };

  let summary: BafoSummary;
  beforeAll(() => {
    summary = buildBafoNegotiationSummary(input);
  });

  it('returns a BafoSummary with correct eventId and eventName', () => {
    expect(summary.eventId).toBe('evt-test-bafo');
    expect(summary.eventName).toBe('Test BAFO Event');
  });

  it('sets generatedAt to the deterministic stamp 2026-04-26', () => {
    expect(summary.generatedAt).toBe('2026-04-26');
  });

  it('sets modelVersion to 1.0', () => {
    expect(summary.modelVersion).toBe('1.0');
  });

  it('returns at least one opportunity per vendor', () => {
    expect(summary.opportunities.length).toBeGreaterThanOrEqual(2);
    const vendorIds = summary.opportunities.map((o) => o.vendorId);
    expect(vendorIds).toContain('vendor-a');
    expect(vendorIds).toContain('vendor-b');
  });

  it('every opportunity has a valid strength', () => {
    for (const opp of summary.opportunities) {
      expect(OPPORTUNITY_STRENGTHS).toContain(opp.strength);
    }
  });

  it('every opportunity has a valid leverType', () => {
    for (const opp of summary.opportunities) {
      expect(LEVER_TYPES).toContain(opp.lever);
    }
  });

  it('returns at least one lever', () => {
    expect(summary.levers.length).toBeGreaterThan(0);
  });

  it('every lever has a valid leverType', () => {
    for (const lever of summary.levers) {
      expect(LEVER_TYPES).toContain(lever.leverType);
    }
  });

  it('every lever has non-empty description, currentPosition, targetPosition', () => {
    for (const lever of summary.levers) {
      expect(lever.description.length).toBeGreaterThan(0);
      expect(lever.currentPosition.length).toBeGreaterThan(0);
      expect(lever.targetPosition.length).toBeGreaterThan(0);
    }
  });

  it('returns at least one risk', () => {
    expect(summary.risks.length).toBeGreaterThan(0);
  });

  it('every risk has a valid level', () => {
    for (const risk of summary.risks) {
      expect(RISK_LEVELS).toContain(risk.level);
    }
  });

  it('returns at least one scenario', () => {
    expect(summary.scenarios.length).toBeGreaterThan(0);
  });

  it('every scenario has a valid expectedOutcome', () => {
    for (const scenario of summary.scenarios) {
      expect(SCENARIO_OUTCOMES).toContain(scenario.expectedOutcome);
    }
  });

  it('every scenario has non-empty leversActivated', () => {
    for (const scenario of summary.scenarios) {
      expect(Array.isArray(scenario.leversActivated)).toBe(true);
      expect(scenario.leversActivated.length).toBeGreaterThan(0);
    }
  });

  it('returns at least one recommendation', () => {
    expect(summary.recommendations.length).toBeGreaterThan(0);
  });

  it('totalLeversActivated equals levers array length', () => {
    expect(summary.totalLeversActivated).toBe(summary.levers.length);
  });

  it('highPriorityAsks is a non-negative integer', () => {
    expect(Number.isInteger(summary.highPriorityAsks)).toBe(true);
    expect(summary.highPriorityAsks).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic — two calls with same input return same output', () => {
    const s1 = buildBafoNegotiationSummary(input);
    const s2 = buildBafoNegotiationSummary(input);
    expect(JSON.stringify(s1)).toBe(JSON.stringify(s2));
  });
});

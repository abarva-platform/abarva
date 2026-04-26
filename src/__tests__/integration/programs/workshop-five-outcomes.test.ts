// MW9 · Workshop Five Outcomes — deterministic seed tests
// Pure TypeScript + Jest. No jsdom, no React, no model calls.

import {
  buildWorkshopFiveOutcomes,
  WorkshopFiveOutcomes,
} from '../../../lib/programs/workshop-five-outcomes';

describe('buildWorkshopFiveOutcomes', () => {
  let outcomes: WorkshopFiveOutcomes;

  beforeAll(() => {
    outcomes = buildWorkshopFiveOutcomes();
  });

  it('returns an object', () => {
    expect(outcomes).toBeDefined();
    expect(typeof outcomes).toBe('object');
  });

  it('workshopId is "workshop-5-synthesis"', () => {
    expect(outcomes.workshopId).toBe('workshop-5-synthesis');
  });

  it('programCode is "APX-CDP-2026"', () => {
    expect(outcomes.programCode).toBe('APX-CDP-2026');
  });

  it('tenantSlug is "apex-retail"', () => {
    expect(outcomes.tenantSlug).toBe('apex-retail');
  });

  it('decisionsReached has 3 items', () => {
    expect(outcomes.decisionsReached).toHaveLength(3);
  });

  it('all decisions have status "reached"', () => {
    for (const decision of outcomes.decisionsReached) {
      expect(decision.status).toBe('reached');
    }
  });

  it('tensionsResolved has 1 item with status "resolved"', () => {
    expect(outcomes.tensionsResolved).toHaveLength(1);
    expect(outcomes.tensionsResolved[0].status).toBe('resolved');
  });

  it('evidenceCaptured has 2 items', () => {
    expect(outcomes.evidenceCaptured).toHaveLength(2);
  });

  it('remainingMissingEvidence has 3 items', () => {
    expect(outcomes.remainingMissingEvidence).toHaveLength(3);
  });

  it('gateNarrative is non-empty', () => {
    expect(typeof outcomes.gateNarrative).toBe('string');
    expect(outcomes.gateNarrative.length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true', () => {
    expect(outcomes.deterministicSeed).toBe(true);
  });

  it('no decision has status "approved" (not fake-completing anything)', () => {
    for (const decision of outcomes.decisionsReached) {
      // WorkshopOutcomeDecisionStatus does not include 'approved'
      expect(decision.status).not.toBe('approved');
    }
  });

  it('is deterministic — repeated calls return identical output', () => {
    const a = buildWorkshopFiveOutcomes();
    const b = buildWorkshopFiveOutcomes();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

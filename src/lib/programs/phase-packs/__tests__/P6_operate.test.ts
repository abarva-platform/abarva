import type { PhasePack } from '../types';
import { P6_OPERATE } from '../P6_operate';

describe('P6 Tower Handoff · PhasePack contract', () => {
  it('conforms to PhasePack and uses corrected Tower Handoff label', () => {
    const pack: PhasePack = P6_OPERATE;
    expect(pack.phase).toBe(6);
    expect(pack.label).toBe('P6 Tower Handoff');
    expect(pack.outcome).toContain('execution tracking contract');
    expect(pack.outcome).toContain('Tower knows what to monitor');
  });

  it('requires tracking contract, external feed, alerts, benefits cadence, and owner handoff', () => {
    const dodIds = P6_OPERATE.definitionOfDone.map((d) => d.id);
    expect(dodIds).toEqual(expect.arrayContaining([
      'execution-tracking-contract-signed',
      'external-status-feed-defined',
      'tower-alerts-configured',
      'benefits-tracking-cadence-defined',
      'execution-owner-handoff-complete',
    ]));
  });

  it('declares 8 Tower handoff steps', () => {
    const ids = (P6_OPERATE.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([
      'p6-handoff-intake',
      'p6-tracking-contract',
      'p6-status-feed',
      'p6-alerts',
      'p6-benefits',
      'p6-owner-handoff',
      'p6-first-status',
      'p6-closeout',
    ]);
  });

  it('keeps Tower in observe-and-escalate mode, not PMO mode', () => {
    expect(P6_OPERATE.antiPatterns.map((a) => a.id)).toContain('tower-as-pmo');
    expect(P6_OPERATE.rightQuestions.open.map((q) => q.id)).toContain('handoff-boundary');
  });
});

import type { PhasePack } from '../types';
import { P5_ACTIVATE } from '../P5_activate';

describe('P5 Mobilize & Handoff · PhasePack contract', () => {
  it('conforms to PhasePack and defines P5 as handoff, not execution', () => {
    const pack: PhasePack = P5_ACTIVATE;
    expect(pack.phase).toBe(5);
    expect(pack.label).toBe('P5 Mobilize & Handoff');
    expect(pack.outcome).toContain('approved P4 roadmap');
    expect(pack.outcome).toContain('project delivery occurs in their execution environment');
    expect(pack.outcome).not.toContain('execution should start outside AbarVa');
  });

  it('requires approved P4 carry-forward, named owners, and Tower handoff acceptance', () => {
    const dodIds = P5_ACTIVATE.definitionOfDone.map((d) => d.id);
    expect(dodIds).toEqual(expect.arrayContaining([
      'business-case-approved',
      'sponsor-alignment-confirmed',
      'readiness-and-change-plan-signed-off',
      'tower-handoff-plan-accepted',
    ]));
    expect(P5_ACTIVATE.definitionOfDone[0]?.evaluationHint).toContain(
      'P5 does not recompute or silently alter them',
    );
    expect(P5_ACTIVATE.steps?.find((step) => step.id === 'p5-p6-readiness')?.label)
      .toContain('Tower measurement handoff');
  });

  it('declares 8 approval and mobilization steps', () => {
    const ids = (P5_ACTIVATE.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([
      'p5-intake',
      'p5-business-case',
      'p5-stakeholder-alignment',
      'p5-readiness',
      'p5-risk-acceptance',
      'p5-decision-memo',
      'p5-multi-approval',
      'p5-p6-readiness',
    ]);
  });

  it('guards against approval theater and business-case leakage', () => {
    const antiPatternIds = P5_ACTIVATE.antiPatterns.map((a) => a.id);
    expect(antiPatternIds).toContain('approval-theater');
    expect(antiPatternIds).toContain('business-case-leak');
  });
});

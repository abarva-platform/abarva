import type { PhasePack } from '../types';
import { P5_ACTIVATE } from '../P5_activate';

describe('P5 Approval & Mobilization · PhasePack contract', () => {
  it('conforms to PhasePack and uses corrected approval package label', () => {
    const pack: PhasePack = P5_ACTIVATE;
    expect(pack.phase).toBe(5);
    expect(pack.label).toBe('P5 Mobilize & Handoff');
    expect(pack.outcome).toContain('funding-and-authority package');
    expect(pack.outcome).toContain('Control Tower can begin monitoring setup');
  });

  it('requires business case, sponsor alignment, readiness, and Tower handoff plan', () => {
    const dodIds = P5_ACTIVATE.definitionOfDone.map((d) => d.id);
    expect(dodIds).toEqual(expect.arrayContaining([
      'business-case-approved',
      'sponsor-alignment-confirmed',
      'readiness-and-change-plan-signed-off',
      'tower-handoff-plan-accepted',
    ]));
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

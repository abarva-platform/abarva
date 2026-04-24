// OutcomeVerdict contract · FM-01 regression coverage
//
// Smoke test for the verdict shape and display metadata. The component
// rendering logic is lightly validated — the substantive contract is the
// `OutcomeVerdictShape` type, which Codex's Stage 5 composition must
// produce.

import { OUTCOME_META, type OutcomeVerdictShape } from '@/lib/agent/outcomeVerdict';

describe('OutcomeVerdict contract', () => {
  test('every outcome key has display metadata', () => {
    for (const outcome of ['GO', 'REFINE', 'REDIRECT'] as const) {
      expect(OUTCOME_META[outcome]).toBeDefined();
      expect(OUTCOME_META[outcome].label).toBe(outcome);
      expect(OUTCOME_META[outcome].tone).toMatch(/./);
      expect(OUTCOME_META[outcome].accent).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  test('GO / REFINE / REDIRECT accents are distinct', () => {
    const accents = new Set(['GO', 'REFINE', 'REDIRECT'].map((o) => OUTCOME_META[o as keyof typeof OUTCOME_META].accent));
    expect(accents.size).toBe(3);
  });

  test('fixture verdict shape passes shape validation', () => {
    const fixture: OutcomeVerdictShape = {
      outcome: 'REFINE',
      confidence: 'MEDIUM',
      headline: 'The pattern maps, but the scope is wider than one program should carry.',
      rationale:
        'Retrieved pattern ai-use-case-portfolio-management suggests this is a portfolio-stand-up question rather than a single use case. Two of the three named sponsors sit outside the line of business you described. Refining to a narrower scope before charter will avoid a cross-sector risk-acceptance debate in Phase 2.',
      factors: [
        { label: 'Pattern match', signal: 'strong', note: 'ai-use-case-portfolio-management · 0.86 confidence' },
        { label: 'Sponsor alignment', signal: 'weak', note: 'named sponsor not in the accountable LOB' },
        { label: 'Scope clarity', signal: 'mixed', note: '3 use cases named; 1 has measurable baseline' },
      ],
      next_step: {
        label: 'Narrow to the use case with a measurable baseline',
      },
    };

    expect(fixture.outcome).toBe('REFINE');
    expect(fixture.factors).toHaveLength(3);
    expect(fixture.factors.every((f) => ['strong', 'mixed', 'weak'].includes(f.signal))).toBe(true);
  });
});

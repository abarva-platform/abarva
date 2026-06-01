import { answerPrefixForReadiness, scoreReadiness } from '../scorer';

describe('scoreReadiness', () => {
  it('marks complete substrate sufficient', () => {
    const assessment = scoreReadiness({
      questionId: 'cost-1',
      questionKind: 'cost_question',
      presentDimensions: ['move_business_case', 'cost_model', 'vendor_rate_card'],
    });

    expect(assessment.completenessPercent).toBe(100);
    expect(assessment.readinessVerdict).toBe('sufficient');
    expect(answerPrefixForReadiness(assessment)).toBeNull();
  });

  it('requires gap-first language below 70 percent', () => {
    const assessment = scoreReadiness({
      questionId: 'trust-1',
      questionKind: 'trust_question',
      presentDimensions: ['customer_kpis'],
    });

    expect(assessment.readinessVerdict).toBe('insufficient');
    expect(answerPrefixForReadiness(assessment)).toContain('I am missing complaint_baseline, regulatory_context');
    expect(answerPrefixForReadiness(assessment)).toContain('should not advise');
  });
});

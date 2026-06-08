import { briefToDiscoveryShape } from '../brief-to-shape';
import { EMPTY_BRIEF } from '../../origination/ProgramBriefPanel';

describe('briefToDiscoveryShape', () => {
  it('maps filled brief fields into chat-captured shape fields', () => {
    const shape = briefToDiscoveryShape({
      ...EMPTY_BRIEF,
      problemStatement: 'Reduce avoidable admissions',
      targetOutcome: '↓ admission rate',
      classification: 'Healthcare data-platform modernization',
      sponsor: 'Dr. A. Okafor, CMIO',
    });
    expect(shape.problem.value).toBe('Reduce avoidable admissions');
    expect(shape.problem.sources).toEqual(['chat']);
    expect(shape.valueHypothesis.value).toBe('↓ admission rate');
    expect(shape.archetype.value).toBe('Healthcare data-platform modernization');
    expect(shape.sponsor.value).toBe('Dr. A. Okafor, CMIO');
  });

  it('leaves unfilled fields empty', () => {
    const shape = briefToDiscoveryShape(EMPTY_BRIEF);
    expect(shape.problem.value).toBeNull();
    expect(shape.problem.review).toBe('empty');
    expect(shape.sponsor.value).toBeNull();
  });
});

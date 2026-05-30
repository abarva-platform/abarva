import {
  QUESTION_CATEGORIES,
  assertCoverage,
  categoryToRequiredSegments,
  classifyQuestionCategory,
  inferSegmentsFromSource,
} from '@/lib/knowledge/coverage';

describe('Packet 30 Phase 3 coverage contract', () => {
  it('defines all 25 Tier-1 question categories', () => {
    expect(Object.keys(QUESTION_CATEGORIES)).toHaveLength(25);
  });

  it('requires at least three tenant segments per category', () => {
    for (const [category, segments] of Object.entries(categoryToRequiredSegments)) {
      expect({ category, segments }).toEqual({
        category,
        segments: expect.arrayContaining([]),
      });
      expect(segments.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('routes Tier-1 questions through the coverage map', () => {
    expect(classifyQuestionCategory('Is our IBM mainframe dependency still defensible?')).toBe('IBM_DEPENDENCY');
    expect(classifyQuestionCategory('Who approves an 8M AI spend from the FY26 budget?')).toBe('BUDGET_AUTHORITY');
    expect(classifyQuestionCategory('What is the current state of our analytics data platform?')).toBe('DATA_PLATFORM');
    expect(classifyQuestionCategory('Where are cross-program blockers likely to hit the roadmap?')).toBe('CROSS_PROGRAM_RISK');
    expect(classifyQuestionCategory('Compare credible vendors for this renewal.')).toBe('VENDOR_CONTRACTS');
  });

  it('infers required tenant segments from retrieved source payloads', () => {
    const segments = inferSegmentsFromSource({
      type: 'TENANT',
      id: 'skyharbor-air:it_landscape',
      name: 'IT landscape (skyharbor-air)',
      detail: 'Vendor contracts and program inventory also mention the IBM renewal.',
    });

    expect(segments).toEqual(expect.arrayContaining(['it_landscape', 'vendor_contracts', 'program_inventory']));
  });

  it('reports full, partial, and missing coverage states', () => {
    expect(assertCoverage('IBM_DEPENDENCY', [
      { id: 'skyharbor-air:it_landscape', detail: 'IT landscape records.' },
      { id: 'skyharbor-air:vendor_contracts', detail: 'Vendor contracts records.' },
      { id: 'skyharbor-air:program_inventory', detail: 'Program inventory records.' },
    ])).toMatchObject({
      status: 'full',
      missingSegments: [],
    });

    expect(assertCoverage('IBM_DEPENDENCY', [
      { id: 'skyharbor-air:it_landscape', detail: 'IT landscape records.' },
    ])).toMatchObject({
      status: 'partial',
      missingSegments: ['vendor_contracts', 'program_inventory'],
    });

    expect(assertCoverage('IBM_DEPENDENCY', [])).toMatchObject({
      status: 'missing',
      presentSegments: [],
    });
  });
});

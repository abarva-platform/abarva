import { validatePatternGraph } from '@/lib/intelligence/pattern-graph-validation';

describe('pattern graph validation', () => {
  it('keeps the intelligence graph structurally sound', () => {
    const result = validatePatternGraph();

    expect(result.errors).toEqual([]);
    expect(result.orphanPatternSlugs).toEqual([]);
    expect(result.summary.patternCount).toBeGreaterThanOrEqual(13);
    expect(result.summary.tenantCount).toBeGreaterThanOrEqual(3);
    expect(result.summary.programCount).toBeGreaterThanOrEqual(13);
    expect(result.summary.edgeCounts.relatedTo).toBeGreaterThan(0);
    expect(result.summary.edgeCounts.appliedIn).toBeGreaterThan(0);
    expect(result.summary.edgeCounts.applicableToTenant).toBeGreaterThan(0);
    expect(result.summary.edgeCounts.sourcedFrom).toBeGreaterThan(0);
  });
});

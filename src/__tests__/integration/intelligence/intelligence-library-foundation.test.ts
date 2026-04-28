import {
  filterIntelligencePatterns,
  getIntelligenceLibraryFilterLabel,
  INTELLIGENCE_INDEX_VIEW,
  INTELLIGENCE_LIBRARY_FILTERS,
  normalizeIntelligenceLibraryFilter,
} from '@/lib/intelligence/shell-intelligence-fixture';

describe('Intelligence library foundation', () => {
  it('defines the canonical I1 filter strip from the catalog states', () => {
    expect(INTELLIGENCE_LIBRARY_FILTERS.map((filter) => filter.label)).toEqual([
      'All',
      'M · Meta',
      'T1 · Craft',
      'T3 · Use-case',
      'In review',
      'Candidates',
    ]);
    expect(INTELLIGENCE_LIBRARY_FILTERS.map((filter) => filter.catalogEntry)).toEqual([
      'INT-IDX-DEFAULT',
      'INT-IDX-FILTERED-M',
      'INT-IDX-FILTERED-T1',
      'INT-IDX-FILTERED-T3',
      'INT-IDX-FILTERED-INREVIEW',
      'INT-IDX-FILTERED-CANDIDATE',
    ]);
  });

  it('normalizes legacy or shorthand filter params into canonical library states', () => {
    expect(normalizeIntelligenceLibraryFilter(null)).toBe('all');
    expect(normalizeIntelligenceLibraryFilter('t2')).toBe('m');
    expect(normalizeIntelligenceLibraryFilter('meta')).toBe('m');
    expect(normalizeIntelligenceLibraryFilter('candidates')).toBe('candidate');
    expect(normalizeIntelligenceLibraryFilter('validated')).toBe('validated');
  });

  it('filters deterministic pattern rows for each I1 state', () => {
    const patterns = INTELLIGENCE_INDEX_VIEW.patterns;

    expect(filterIntelligencePatterns(patterns, 'all')).toHaveLength(8);
    expect(filterIntelligencePatterns(patterns, 'm').map((pattern) => pattern.id)).toEqual([
      'T2-C01',
      'T2-C02',
      'T2-C03',
    ]);
    expect(filterIntelligencePatterns(patterns, 't1').map((pattern) => pattern.id)).toEqual([
      'T1-F01',
      'T1-F02',
    ]);
    expect(filterIntelligencePatterns(patterns, 't3').map((pattern) => pattern.id)).toEqual([
      'T3-H01',
      'T3-H02',
      'T3-H03',
    ]);
    expect(filterIntelligencePatterns(patterns, 'in-review').map((pattern) => pattern.id)).toEqual(['T3-H03']);
    expect(filterIntelligencePatterns(patterns, 'candidate').map((pattern) => pattern.id)).toEqual(['T1-F02']);
  });

  it('labels validated as an action-only state without adding it to the middle strip', () => {
    expect(getIntelligenceLibraryFilterLabel('validated')).toBe('Validated');
    expect(INTELLIGENCE_LIBRARY_FILTERS.some((filter) => filter.key === 'validated')).toBe(false);
    expect(filterIntelligencePatterns(INTELLIGENCE_INDEX_VIEW.patterns, 'validated').every(
      (pattern) => pattern.status === 'validated',
    )).toBe(true);
  });
});

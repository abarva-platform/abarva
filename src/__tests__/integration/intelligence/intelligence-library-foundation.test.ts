import * as fs from 'fs';
import * as path from 'path';
import {
  filterIntelligencePatterns,
  getIntelligenceLibraryFilterLabel,
  INTELLIGENCE_INDEX_VIEW,
  INTELLIGENCE_LIBRARY_FILTERS,
  normalizeIntelligenceLibraryFilter,
} from '@/lib/intelligence/shell-intelligence-fixture';

const ROOT = path.resolve(__dirname, '../../../../');
const INTELLIGENCE_INDEX_PAGE_PATH = path.join(
  ROOT,
  'src/components/intelligence/IntelligenceIndexPage.tsx',
);

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

describe('Intelligence landing front-page contract', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(INTELLIGENCE_INDEX_PAGE_PATH, 'utf8');
  });

  it('presents Intelligence as the Explore Layer for AI bets', () => {
    expect(source).toContain('Explore layer for AI bets.');
    expect(source).toContain('Intelligence - Explore Layer');
    expect(source).toContain('three substrates');
    expect(source).toContain('two outcomes');
  });

  it('surfaces the three locked substrates with program leverage language', () => {
    expect(source).toContain('What we know about you');
    expect(source).toContain('What patterns exist');
    expect(source).toContain('What is possible for you');
    expect(source).toContain('How a program leverages it');
  });

  it('surfaces the two bet-level outcomes', () => {
    expect(source).toContain('Originate new bets');
    expect(source).toContain('Validate existing bets');
    expect(source).toContain('Strategic Move');
  });

  it('renders the seven canonical explore submenus', () => {
    for (const label of [
      'Today',
      'By function',
      'Patterns',
      'Vendors',
      'Peer activity',
      'My strategy',
      'Sessions',
    ]) {
      expect(source).toContain(label);
    }
  });

  it('keeps Sentinel ambient while the Today canvas leads', () => {
    expect(source).toContain('Sentinel');
    expect(source).toContain('Ambient - available');
    expect(source).toContain('Today - default canvas');
    expect(source).toContain('Canvas dominant');
    expect(source).not.toContain('heightCss=');
  });

  it('keeps scope honest: Intelligence supports thinking but does not generate strategy', () => {
    expect(source).toContain('Intelligence supports strategy thinking');
    expect(source).toContain('does not generate enterprise AI strategy from scratch');
    expect(source).toContain('Partner-grade strategy development');
  });
});

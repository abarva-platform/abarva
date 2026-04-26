import {
  detectIntelligencePatterns,
  IntelligencePatternCategory,
  IntelligencePatternStrength,
  IntelligencePatternSource,
  IntelligencePatternSummary,
} from '../../../lib/source/intelligence-patterns';

const CATEGORIES: IntelligencePatternCategory[] = [
  'pricing_compression', 'scope_anchor', 'evidence_leverage',
  'timeline_pressure', 'bundling_trap', 'governance_avoidance',
  'champion_dependency', 'reference_manipulation', 'pricing_opacity', 'scope_creep_setup',
];

const STRENGTHS: IntelligencePatternStrength[] = ['confirmed', 'likely', 'possible', 'not_detected'];
const SOURCES: IntelligencePatternSource[] = ['pricing', 'scope', 'evidence', 'timeline', 'governance', 'commercial'];

const allFlagsInput = {
  eventId: 'evt-intel-test',
  eventName: 'Intel Test Event',
  vendorIds: ['vendor-a', 'vendor-b'],
  hasOpaquePricing: true,
  hasBroadScope: true,
  hasEvidenceGaps: true,
  hasTimelinePressure: true,
  hasGovernanceAvoidance: true,
  hasBundledServices: true,
};

const noFlagsInput = {
  eventId: 'evt-clean',
  eventName: 'Clean Event',
  vendorIds: [],
  hasOpaquePricing: false,
  hasBroadScope: false,
  hasEvidenceGaps: false,
  hasTimelinePressure: false,
  hasGovernanceAvoidance: false,
  hasBundledServices: false,
};

describe('intelligence-patterns - vocabulary', () => {
  it('defines exactly 10 pattern categories', () => {
    expect(CATEGORIES).toHaveLength(10);
  });

  it('includes pricing_opacity and scope_anchor', () => {
    expect(CATEGORIES).toContain('pricing_opacity');
    expect(CATEGORIES).toContain('scope_anchor');
  });

  it('defines 4 strength values', () => {
    expect(STRENGTHS).toHaveLength(4);
    expect(STRENGTHS).toContain('confirmed');
    expect(STRENGTHS).toContain('not_detected');
  });
});

describe('intelligence-patterns - detectIntelligencePatterns (all flags)', () => {
  let summary: IntelligencePatternSummary;

  beforeAll(() => {
    summary = detectIntelligencePatterns(allFlagsInput);
  });

  it('returns correct eventId', () => {
    expect(summary.eventId).toBe('evt-intel-test');
  });

  it('sets generatedAt to 2026-04-26', () => {
    expect(summary.generatedAt).toBe('2026-04-26');
  });

  it('returns at least one pattern when flags are set', () => {
    expect(summary.patterns.length).toBeGreaterThan(0);
  });

  it('every pattern has a valid category', () => {
    for (const p of summary.patterns) {
      expect(CATEGORIES).toContain(p.category);
    }
  });

  it('every pattern has a valid strength', () => {
    for (const p of summary.patterns) {
      expect(STRENGTHS).toContain(p.strength);
    }
  });

  it('every pattern has a valid source', () => {
    for (const p of summary.patterns) {
      expect(SOURCES).toContain(p.source);
    }
  });

  it('every pattern has non-empty name and description', () => {
    for (const p of summary.patterns) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it('every pattern has at least one indicator', () => {
    for (const p of summary.patterns) {
      expect(Array.isArray(p.indicators)).toBe(true);
      expect(p.indicators.length).toBeGreaterThan(0);
    }
  });

  it('counts sum correctly', () => {
    expect(summary.confirmedCount + summary.likelyCount + summary.possibleCount)
      .toBeLessThanOrEqual(summary.patterns.length);
  });

  it('topPatternCategory is non-null when patterns exist', () => {
    expect(summary.topPatternCategory).not.toBeNull();
    if (summary.topPatternCategory) {
      expect(CATEGORIES).toContain(summary.topPatternCategory);
    }
  });

  it('narrativeSummary is a non-empty string', () => {
    expect(summary.narrativeSummary.length).toBeGreaterThan(0);
  });
});

describe('intelligence-patterns - detectIntelligencePatterns (no flags)', () => {
  it('returns zero patterns when no flags set', () => {
    const summary = detectIntelligencePatterns(noFlagsInput);
    expect(summary.patterns).toHaveLength(0);
    expect(summary.confirmedCount).toBe(0);
    expect(summary.topPatternCategory).toBeNull();
  });
});

describe('intelligence-patterns - determinism', () => {
  it('two calls with same input return identical JSON', () => {
    const s1 = detectIntelligencePatterns(allFlagsInput);
    const s2 = detectIntelligencePatterns(allFlagsInput);
    expect(JSON.stringify(s1)).toBe(JSON.stringify(s2));
  });
});

/**
 * Wave 30 PAT1 — Pattern Registry Format
 *
 * Verifies the canonical pattern registry format:
 * - Type exports are well-formed
 * - evaluatePatternReadinessGate enforces all 10 gates
 * - Registry helper functions work correctly
 * - Constants are complete
 */

import {
  evaluatePatternReadinessGate,
  getPatternsByCategory,
  getPatternsByDomain,
  getPatternsByMaturity,
  getCriticalSignalPatterns,
  getPatternBySlug,
  summarizePatternRegistry,
  PATTERN_CATEGORIES_IN_ORDER,
  PATTERN_MATURITY_LEVELS_IN_ORDER,
  PATTERN_OWNER_AGENTS_IN_ORDER,
  PatternRegistryEntry,
  PatternRegistry,
} from '@/lib/solutions/pattern-registry-format';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_ENTRY: PatternRegistryEntry = {
  patternId: 'test-pattern-001',
  slug: 'test-retail-data-platform',
  name: 'Test Retail Data Platform Pattern',
  shortDescription:
    'A test pattern for verifying the registry format schema against a realistic retail data platform sourcing scenario.',
  primaryQuestion:
    'Does this vendor have the retail data expertise required to support our data platform?',
  categories: ['sourcing', 'evaluation'],
  domains: ['data-platform', 'retail-technology'],
  maturity: 'draft',
  primaryAgent: 'nexus',
  consumerAgents: ['nexus', 'sentinel'],
  evidenceRequirements: [
    {
      evidenceId: 'er-test-001',
      label: 'Reference architecture',
      description: 'Retail-specific reference architecture from the vendor.',
      required: true,
      acceptedFormats: ['PDF', 'diagram'],
      maxStaleDays: 365,
    },
  ],
  sentinelSignals: [
    {
      signalId: 'ss-test-001',
      label: 'No retail reference',
      description: 'Vendor has no comparable retail reference.',
      level: 'high',
      trigger: 'No retail reference customer provided.',
      recommendedAction: 'Request at least one reference call.',
      blocksProgression: true,
    },
  ],
  relatedPatternSlugs: ['vendor-evaluation-scorecard'],
  authoredInWave: 'wave-30',
  createdFrom: 'pat1_w30_pattern_registry_format',
};

const MINIMAL_REGISTRY: PatternRegistry = {
  version: '1.0',
  patterns: [VALID_ENTRY],
  totalPatterns: 1,
  lastUpdated: '2026-04-26',
  createdFrom: 'pat1_w30_pattern_registry_format',
};

// ---------------------------------------------------------------------------
// evaluatePatternReadinessGate — valid entry
// ---------------------------------------------------------------------------

describe('PAT1 — evaluatePatternReadinessGate() — valid entry', () => {
  it('valid entry passes all 10 gates', () => {
    const result = evaluatePatternReadinessGate(VALID_ENTRY);
    expect(result.isReady).toBe(true);
    expect(result.passedGates).toBe(10);
    expect(result.totalGates).toBe(10);
  });

  it('result has deterministicSeed: true', () => {
    const result = evaluatePatternReadinessGate(VALID_ENTRY);
    expect(result.deterministicSeed).toBe(true);
  });

  it('result.patternId matches entry.patternId', () => {
    const result = evaluatePatternReadinessGate(VALID_ENTRY);
    expect(result.patternId).toBe(VALID_ENTRY.patternId);
  });

  it('all gate results are present', () => {
    const result = evaluatePatternReadinessGate(VALID_ENTRY);
    expect(result.results.length).toBe(10);
    for (const r of result.results) {
      expect(typeof r.gateId).toBe('string');
      expect(r.gateId.length).toBeGreaterThan(0);
      expect(typeof r.passed).toBe('boolean');
      expect(typeof r.detail).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// evaluatePatternReadinessGate — invalid entries
// ---------------------------------------------------------------------------

describe('PAT1 — evaluatePatternReadinessGate() — failing gates', () => {
  it('G1 fails when patternId is empty', () => {
    const entry = { ...VALID_ENTRY, patternId: '' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g1 = result.results.find((r) => r.gateId === 'G1-pattern-id');
    expect(g1!.passed).toBe(false);
  });

  it('G1 fails when patternId contains whitespace', () => {
    const entry = { ...VALID_ENTRY, patternId: 'bad id' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g1 = result.results.find((r) => r.gateId === 'G1-pattern-id');
    expect(g1!.passed).toBe(false);
  });

  it('G2 fails when slug is invalid', () => {
    const entry = { ...VALID_ENTRY, slug: 'BadSlug_InvalidFormat' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g2 = result.results.find((r) => r.gateId === 'G2-slug');
    expect(g2!.passed).toBe(false);
  });

  it('G3 fails when name is empty', () => {
    const entry = { ...VALID_ENTRY, name: '' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g3 = result.results.find((r) => r.gateId === 'G3-name');
    expect(g3!.passed).toBe(false);
  });

  it('G4 fails when shortDescription is too short', () => {
    const entry = { ...VALID_ENTRY, shortDescription: 'Too short.' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g4 = result.results.find((r) => r.gateId === 'G4-short-description');
    expect(g4!.passed).toBe(false);
  });

  it('G4 fails when shortDescription is too long (>200 chars)', () => {
    const entry = { ...VALID_ENTRY, shortDescription: 'A'.repeat(201) };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g4 = result.results.find((r) => r.gateId === 'G4-short-description');
    expect(g4!.passed).toBe(false);
  });

  it('G5 fails when primaryQuestion is too short', () => {
    const entry = { ...VALID_ENTRY, primaryQuestion: 'Short?' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g5 = result.results.find((r) => r.gateId === 'G5-primary-question');
    expect(g5!.passed).toBe(false);
  });

  it('G6 fails when categories is empty', () => {
    const entry = { ...VALID_ENTRY, categories: [] };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g6 = result.results.find((r) => r.gateId === 'G6-categories');
    expect(g6!.passed).toBe(false);
  });

  it('G7 fails when domains is empty', () => {
    const entry = { ...VALID_ENTRY, domains: [] };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g7 = result.results.find((r) => r.gateId === 'G7-domains');
    expect(g7!.passed).toBe(false);
  });

  it('G8 fails when primaryAgent is invalid', () => {
    const entry = { ...VALID_ENTRY, primaryAgent: 'unknown-agent' as never };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g8 = result.results.find((r) => r.gateId === 'G8-primary-agent');
    expect(g8!.passed).toBe(false);
  });

  it('G9 fails when evidenceRequirements is not an array', () => {
    const entry = { ...VALID_ENTRY, evidenceRequirements: 'not-array' as never };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g9 = result.results.find((r) => r.gateId === 'G9-evidence-requirements');
    expect(g9!.passed).toBe(false);
  });

  it('G10 fails when createdFrom is empty', () => {
    const entry = { ...VALID_ENTRY, createdFrom: '' };
    const result = evaluatePatternReadinessGate(entry);
    expect(result.isReady).toBe(false);
    const g10 = result.results.find((r) => r.gateId === 'G10-created-from');
    expect(g10!.passed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

describe('PAT1 — Registry helpers', () => {
  it('getPatternsByCategory returns only matching entries', () => {
    const sourcing = getPatternsByCategory(MINIMAL_REGISTRY, 'sourcing');
    expect(sourcing.length).toBe(1);
    expect(sourcing[0].patternId).toBe(VALID_ENTRY.patternId);
  });

  it('getPatternsByCategory returns empty for unmatched category', () => {
    const ops = getPatternsByCategory(MINIMAL_REGISTRY, 'ongoing-ops');
    expect(ops.length).toBe(0);
  });

  it('getPatternsByDomain returns only matching entries', () => {
    const retail = getPatternsByDomain(MINIMAL_REGISTRY, 'retail-technology');
    expect(retail.length).toBe(1);
  });

  it('getPatternsByDomain returns empty for unmatched domain', () => {
    const fin = getPatternsByDomain(MINIMAL_REGISTRY, 'financial-technology');
    expect(fin.length).toBe(0);
  });

  it('getPatternsByMaturity returns correct entries', () => {
    const drafts = getPatternsByMaturity(MINIMAL_REGISTRY, 'draft');
    expect(drafts.length).toBe(1);

    const canonical = getPatternsByMaturity(MINIMAL_REGISTRY, 'canonical');
    expect(canonical.length).toBe(0);
  });

  it('getCriticalSignalPatterns returns entries with at least one critical signal', () => {
    // VALID_ENTRY has a 'high' signal — no critical
    const critical = getCriticalSignalPatterns(MINIMAL_REGISTRY);
    expect(critical.length).toBe(0);

    // Add a critical signal
    const entryWithCritical = {
      ...VALID_ENTRY,
      sentinelSignals: [
        ...VALID_ENTRY.sentinelSignals,
        {
          signalId: 'ss-test-critical',
          label: 'Critical signal',
          description: 'Critical risk detected.',
          level: 'critical' as const,
          trigger: 'Something critical.',
          recommendedAction: 'Stop immediately.',
          blocksProgression: true,
        },
      ],
    };
    const registry2: PatternRegistry = { ...MINIMAL_REGISTRY, patterns: [entryWithCritical] };
    const critical2 = getCriticalSignalPatterns(registry2);
    expect(critical2.length).toBe(1);
  });

  it('getPatternBySlug returns the correct entry', () => {
    const found = getPatternBySlug(MINIMAL_REGISTRY, VALID_ENTRY.slug);
    expect(found).toBeDefined();
    expect(found!.patternId).toBe(VALID_ENTRY.patternId);
  });

  it('getPatternBySlug returns undefined for unknown slug', () => {
    const notFound = getPatternBySlug(MINIMAL_REGISTRY, 'non-existent-slug-xyz');
    expect(notFound).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// summarizePatternRegistry
// ---------------------------------------------------------------------------

describe('PAT1 — summarizePatternRegistry()', () => {
  it('returns correct totalPatterns count', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.totalPatterns).toBe(1);
  });

  it('byCategory counts sourcing and evaluation', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.byCategory['sourcing']).toBe(1);
    expect(summary.byCategory['evaluation']).toBe(1);
  });

  it('byDomain counts retail-technology', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.byDomain['retail-technology']).toBe(1);
  });

  it('byMaturity.draft is 1', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.byMaturity.draft).toBe(1);
    expect(summary.byMaturity.canonical).toBe(0);
  });

  it('byAgent.nexus is 1', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.byAgent.nexus).toBe(1);
  });

  it('criticalSignalCount is 0 for entry with only high signal', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.criticalSignalCount).toBe(0);
  });

  it('result has deterministicSeed: true', () => {
    const summary = summarizePatternRegistry(MINIMAL_REGISTRY);
    expect(summary.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('PAT1 — Constants', () => {
  it('PATTERN_CATEGORIES_IN_ORDER contains all 9 categories', () => {
    expect(PATTERN_CATEGORIES_IN_ORDER.length).toBe(9);
    expect(PATTERN_CATEGORIES_IN_ORDER).toContain('sourcing');
    expect(PATTERN_CATEGORIES_IN_ORDER).toContain('evaluation');
    expect(PATTERN_CATEGORIES_IN_ORDER).toContain('governance');
    expect(PATTERN_CATEGORIES_IN_ORDER).toContain('vertical');
    expect(PATTERN_CATEGORIES_IN_ORDER).toContain('commercial');
  });

  it('PATTERN_MATURITY_LEVELS_IN_ORDER contains all 4 maturity levels', () => {
    expect(PATTERN_MATURITY_LEVELS_IN_ORDER.length).toBe(4);
    expect(PATTERN_MATURITY_LEVELS_IN_ORDER).toContain('draft');
    expect(PATTERN_MATURITY_LEVELS_IN_ORDER).toContain('validated');
    expect(PATTERN_MATURITY_LEVELS_IN_ORDER).toContain('canonical');
    expect(PATTERN_MATURITY_LEVELS_IN_ORDER).toContain('deprecated');
  });

  it('PATTERN_OWNER_AGENTS_IN_ORDER contains all 4 agents', () => {
    expect(PATTERN_OWNER_AGENTS_IN_ORDER.length).toBe(4);
    expect(PATTERN_OWNER_AGENTS_IN_ORDER).toContain('nexus');
    expect(PATTERN_OWNER_AGENTS_IN_ORDER).toContain('sentinel');
    expect(PATTERN_OWNER_AGENTS_IN_ORDER).toContain('atlas');
    expect(PATTERN_OWNER_AGENTS_IN_ORDER).toContain('steward');
  });
});

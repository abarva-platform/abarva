// ACT11 · Adoption × Cost × Productivity Correlation Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - All 4 signal kinds present.
// - All 4 directions present.
// - All 4 strengths present.
// - Every entry carries `seed_value: true`.
// - Every entry carries the canonical createdFrom marker.
// - Byte-equal determinism across calls.
// - `summarizeCorrelations` reconciles totals.
// - `getStrongCorrelations` returns only strong pairings.
// - No-fabrication invariants.
// - Module hygiene: no banned imports, no banned APIs.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  CORRELATION_DIRECTIONS,
  CORRELATION_SIGNAL_KINDS,
  CORRELATION_STRENGTHS,
  buildCorrelationSeed,
  getStrongCorrelations,
  summarizeCorrelations,
  type CorrelationDirection,
  type CorrelationPairing,
  type CorrelationSignalKind,
  type CorrelationStrength,
  type CorrelationSummary,
} from '@/lib/tower/adoption-cost-productivity-correlation';

const pairings: readonly CorrelationPairing[] = buildCorrelationSeed();

const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'adoption-cost-productivity-correlation.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildCorrelationSeed · shape and determinism', () => {
  it('returns at least one pairing', () => {
    expect(pairings.length).toBeGreaterThan(0);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildCorrelationSeed();
    const b = buildCorrelationSeed();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes the canonical signal kind tuple in stable order', () => {
    expect([...CORRELATION_SIGNAL_KINDS]).toEqual([
      'adoption',
      'cost',
      'productivity_dora',
      'value_realization',
    ]);
  });

  it('exposes the canonical direction tuple in stable order', () => {
    expect([...CORRELATION_DIRECTIONS]).toEqual([
      'positive',
      'negative',
      'neutral',
      'unknown',
    ]);
  });

  it('exposes the canonical strength tuple in stable order', () => {
    expect([...CORRELATION_STRENGTHS]).toEqual([
      'weak',
      'moderate',
      'strong',
      'unknown',
    ]);
  });

  it('every pairing carries seed_value: true', () => {
    for (const pairing of pairings) {
      expect(pairing.seed_value).toBe(true);
    }
  });

  it('every pairing carries the canonical createdFrom marker', () => {
    for (const pairing of pairings) {
      expect(pairing.createdFrom).toBe(
        'deterministic_adoption_cost_productivity_correlation_seed',
      );
    }
  });

  it('every id matches the canonical "correlation-seed-{n}" shape', () => {
    for (const pairing of pairings) {
      expect(pairing.id).toMatch(/^correlation-seed-\d+$/);
    }
  });

  it('pairing ids are unique', () => {
    const ids = pairings.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every pairing has non-empty leftSignalId, rightSignalId, and rationale', () => {
    for (const pairing of pairings) {
      expect(pairing.leftSignalId.length).toBeGreaterThan(0);
      expect(pairing.rightSignalId.length).toBeGreaterThan(0);
      expect(pairing.rationale.length).toBeGreaterThan(0);
    }
  });

  it('every pairing carries at least one note', () => {
    for (const pairing of pairings) {
      expect(pairing.notes.length).toBeGreaterThanOrEqual(1);
      for (const note of pairing.notes) {
        expect(note.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Coverage of the four × four × four taxonomy
// ---------------------------------------------------------------------

describe('signal kind / direction / strength coverage', () => {
  it.each(CORRELATION_SIGNAL_KINDS.map((k) => [k]))(
    'has at least one pairing involving signal kind %s',
    (kind) => {
      const matches = pairings.filter(
        (p) => p.leftKind === kind || p.rightKind === kind,
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(CORRELATION_DIRECTIONS.map((d) => [d]))(
    'has at least one pairing with direction %s',
    (direction) => {
      const matches = pairings.filter((p) => p.direction === direction);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(CORRELATION_STRENGTHS.map((s) => [s]))(
    'has at least one pairing with strength %s',
    (strength) => {
      const matches = pairings.filter((p) => p.strength === strength);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical signal kinds', () => {
    const allowed = new Set<CorrelationSignalKind>([...CORRELATION_SIGNAL_KINDS]);
    for (const pairing of pairings) {
      expect(allowed.has(pairing.leftKind)).toBe(true);
      expect(allowed.has(pairing.rightKind)).toBe(true);
    }
  });

  it('only uses canonical directions', () => {
    const allowed = new Set<CorrelationDirection>([...CORRELATION_DIRECTIONS]);
    for (const pairing of pairings) {
      expect(allowed.has(pairing.direction)).toBe(true);
    }
  });

  it('only uses canonical strengths', () => {
    const allowed = new Set<CorrelationStrength>([...CORRELATION_STRENGTHS]);
    for (const pairing of pairings) {
      expect(allowed.has(pairing.strength)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// summarizeCorrelations
// ---------------------------------------------------------------------

describe('summarizeCorrelations', () => {
  const summary: CorrelationSummary = summarizeCorrelations(pairings);

  it('totalPairings equals input length', () => {
    expect(summary.totalPairings).toBe(pairings.length);
  });

  it('byDirection counts reconcile to totalPairings', () => {
    const sum = Object.values(summary.byDirection).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalPairings);
  });

  it('byStrength counts reconcile to totalPairings', () => {
    const sum = Object.values(summary.byStrength).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalPairings);
  });

  it('bySignalKind counts reconcile to totalPairings * 2', () => {
    const sum = Object.values(summary.bySignalKind).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalPairings * 2);
  });

  it('byDirection exposes every canonical direction key', () => {
    for (const direction of CORRELATION_DIRECTIONS) {
      expect(typeof summary.byDirection[direction]).toBe('number');
    }
  });

  it('byStrength exposes every canonical strength key', () => {
    for (const strength of CORRELATION_STRENGTHS) {
      expect(typeof summary.byStrength[strength]).toBe('number');
    }
  });

  it('bySignalKind exposes every canonical signal kind key', () => {
    for (const kind of CORRELATION_SIGNAL_KINDS) {
      expect(typeof summary.bySignalKind[kind]).toBe('number');
    }
  });

  it('strongCount equals byStrength.strong', () => {
    expect(summary.strongCount).toBe(summary.byStrength.strong);
  });

  it('unknownDirectionCount equals byDirection.unknown', () => {
    expect(summary.unknownDirectionCount).toBe(summary.byDirection.unknown);
  });

  it('uniquePairKinds is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniquePairKinds].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniquePairKinds).toEqual(sorted);
    const unique = new Set(summary.uniquePairKinds);
    expect(unique.size).toBe(summary.uniquePairKinds.length);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeCorrelations();
    expect(defaultSummary.totalPairings).toBe(pairings.length);
  });

  it('returns zero counts for an empty input list', () => {
    const empty = summarizeCorrelations([]);
    expect(empty.totalPairings).toBe(0);
    expect(empty.strongCount).toBe(0);
    expect(empty.unknownDirectionCount).toBe(0);
    expect(empty.uniquePairKinds).toEqual([]);
    for (const direction of CORRELATION_DIRECTIONS) {
      expect(empty.byDirection[direction]).toBe(0);
    }
    for (const strength of CORRELATION_STRENGTHS) {
      expect(empty.byStrength[strength]).toBe(0);
    }
    for (const kind of CORRELATION_SIGNAL_KINDS) {
      expect(empty.bySignalKind[kind]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------
// getStrongCorrelations
// ---------------------------------------------------------------------

describe('getStrongCorrelations', () => {
  it('returns only pairings with strength "strong"', () => {
    const strong = getStrongCorrelations(pairings);
    expect(strong.length).toBeGreaterThan(0);
    for (const pairing of strong) {
      expect(pairing.strength).toBe('strong');
    }
  });

  it('excludes non-strong pairings', () => {
    const strong = getStrongCorrelations(pairings);
    const strongIds = new Set(strong.map((p) => p.id));
    for (const pairing of pairings) {
      if (pairing.strength !== 'strong') {
        expect(strongIds.has(pairing.id)).toBe(false);
      }
    }
  });

  it('defaults to the canonical seed when called with no arguments', () => {
    expect(getStrongCorrelations().length).toBe(
      getStrongCorrelations(pairings).length,
    );
  });
});

// ---------------------------------------------------------------------
// No-fabrication invariants
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(pairings);

  it('no string field invents a $-prefixed dollar narrative', () => {
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not carry branded vendor endorsements', () => {
    const denyList = [
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft Copilot',
      'GitHub Copilot',
    ];
    for (const brand of denyList) {
      expect(serialized).not.toContain(brand);
    }
  });

  it('does not carry banned placeholder language', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(serialized).not.toContain(phrase);
    }
  });

  it('does not claim a numeric statistical coefficient', () => {
    // Statistical coefficient names should not appear anywhere in the
    // serialized seed — the model is a structural pairing only.
    const banned = [
      'pearson',
      'spearman',
      'kendall',
      'r-squared',
      'r2',
      'p-value',
      'pvalue',
      'regression',
    ];
    const lowered = serialized.toLowerCase();
    for (const phrase of banned) {
      expect(lowered).not.toContain(phrase);
    }
  });

  it('every pairing carries seed_value: true (provenance flag)', () => {
    for (const pairing of pairings) {
      expect(pairing.seed_value).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  it('does not import from forbidden runtime areas', () => {
    const forbidden = [
      "from '@/lib/source",
      "from '@/lib/sentinel",
      "from '@/lib/atlas",
      "from '@/lib/nexus",
      "from '@/lib/agent",
      "from '@/lib/auth",
      "from 'supabase",
      "from '@/supabase",
    ];
    for (const fragment of forbidden) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not call banned timing / randomness / network APIs', () => {
    const bannedFragments = [
      'Date.now',
      'Math.random',
      'new Date(',
      'fetch(',
      'anthropic',
      'openai',
      'useState',
      'useEffect',
    ];
    for (const fragment of bannedFragments) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not contain placeholder language in the source', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(MODULE_SOURCE).not.toContain(phrase);
    }
  });
});

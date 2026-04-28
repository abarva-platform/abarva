// ACT8 · Tech & Data Readiness Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 20 signals.
// - All 6 readiness dimensions covered (≥ 1 each).
// - All 4 readiness levels present (≥ 1 each).
// - ≥ 3 low-level signals; ≥ 1 unknown-level signal.
// - ≥ 5 unique domain labels.
// - Every signal carries `liveTelemetry: false`.
// - Every signal carries a seed-tagged assessment source.
// - Byte-equal determinism across repeated calls.
// - summarizeTechDataReadiness reconciles totals.
// - getReadinessGaps behaves as documented.
// - Module hygiene: no banned imports, no banned APIs, no live
//   telemetry claims in source.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  TECH_READINESS_DIMENSIONS,
  TECH_READINESS_LEVELS,
  TECH_READINESS_ASSESSMENT_SOURCES,
  buildTechDataReadinessSeed,
  getReadinessGaps,
  summarizeTechDataReadiness,
  type TechReadinessSignal,
  type TechReadinessSummary,
} from '@/lib/tower/tech-data-readiness';

const signals: readonly TechReadinessSignal[] = buildTechDataReadinessSeed();

// Resolved absolute path to the module source so we can run static
// inspection without re-importing it.
const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'tech-data-readiness.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildTechDataReadinessSeed · shape and determinism', () => {
  it('returns at least 20 signals', () => {
    expect(signals.length).toBeGreaterThanOrEqual(20);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildTechDataReadinessSeed();
    const b = buildTechDataReadinessSeed();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes the six canonical readiness dimensions', () => {
    expect([...TECH_READINESS_DIMENSIONS]).toEqual([
      'data_quality',
      'integration_apis',
      'cloud_readiness',
      'model_gateway_readiness',
      'security_posture',
      'observability',
    ]);
  });

  it('exposes the four canonical readiness levels', () => {
    expect([...TECH_READINESS_LEVELS]).toEqual([
      'low',
      'medium',
      'high',
      'unknown',
    ]);
  });

  it('every signal carries createdFrom: "deterministic_tech_data_readiness_seed"', () => {
    for (const signal of signals) {
      expect(signal.createdFrom).toBe('deterministic_tech_data_readiness_seed');
    }
  });

  it('every signal id matches the canonical "tech-readiness-seed-{domain}-{dimension}" shape', () => {
    for (const signal of signals) {
      expect(signal.id).toMatch(/^tech-readiness-seed-[a-z0-9-]+-[a-z_]+$/);
    }
  });

  it('signal ids are unique', () => {
    const ids = signals.map((signal) => signal.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every signal has at least one note and notes are non-empty', () => {
    for (const signal of signals) {
      expect(signal.notes.length).toBeGreaterThanOrEqual(1);
      for (const note of signal.notes) {
        expect(note.length).toBeGreaterThan(0);
      }
    }
  });

  it('every signal has a non-empty headline', () => {
    for (const signal of signals) {
      expect(signal.headline.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Dimension & level coverage
// ---------------------------------------------------------------------

describe('dimension and level coverage', () => {
  it.each(TECH_READINESS_DIMENSIONS.map((dim) => [dim]))(
    'has at least one signal for dimension %s',
    (dimension) => {
      const matches = signals.filter((signal) => signal.dimension === dimension);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(TECH_READINESS_LEVELS.map((level) => [level]))(
    'has at least one signal for level %s',
    (level) => {
      const matches = signals.filter((signal) => signal.level === level);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('has at least three low-level signals', () => {
    const low = signals.filter((signal) => signal.level === 'low');
    expect(low.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least one unknown-level signal', () => {
    const unknown = signals.filter((signal) => signal.level === 'unknown');
    expect(unknown.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('every signal carries liveTelemetry: false', () => {
    for (const signal of signals) {
      expect(signal.liveTelemetry).toBe(false);
    }
  });

  it('every signal carries a canonical seed-tagged assessment source', () => {
    const allowed = new Set<string>([...TECH_READINESS_ASSESSMENT_SOURCES]);
    for (const signal of signals) {
      expect(allowed.has(signal.assessmentSource)).toBe(true);
    }
  });

  it('every signal has a non-empty domain label', () => {
    for (const signal of signals) {
      expect(signal.domainLabel.length).toBeGreaterThan(0);
    }
  });

  it('every signal carries a canonical dimension', () => {
    const allowed = new Set<string>([...TECH_READINESS_DIMENSIONS]);
    for (const signal of signals) {
      expect(allowed.has(signal.dimension)).toBe(true);
    }
  });

  it('every signal carries a canonical level', () => {
    const allowed = new Set<string>([...TECH_READINESS_LEVELS]);
    for (const signal of signals) {
      expect(allowed.has(signal.level)).toBe(true);
    }
  });

  it('every signal carries an array of remediations (possibly empty)', () => {
    for (const signal of signals) {
      expect(Array.isArray(signal.remediations)).toBe(true);
      for (const item of signal.remediations) {
        expect(item.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT8 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('covers at least 5 unique domain labels', () => {
    const domains = new Set(signals.map((signal) => signal.domainLabel));
    expect(domains.size).toBeGreaterThanOrEqual(5);
  });

  it('covers a sample of required role-based domain labels', () => {
    const domains = new Set(signals.map((signal) => signal.domainLabel));
    for (const required of [
      'Customer Data Domain',
      'Contact Center Platform',
      'Demand Forecasting Domain',
      'Identity & Access Domain',
      'Platform Cloud Foundations',
    ]) {
      expect(domains.has(required)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// summarizeTechDataReadiness
// ---------------------------------------------------------------------

describe('summarizeTechDataReadiness', () => {
  const summary: TechReadinessSummary = summarizeTechDataReadiness(signals);

  it('totalSignals equals the input length', () => {
    expect(summary.totalSignals).toBe(signals.length);
  });

  it('byDimension counts reconcile to totalSignals', () => {
    const sum = Object.values(summary.byDimension).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalSignals);
  });

  it('byLevel counts reconcile to totalSignals', () => {
    const sum = Object.values(summary.byLevel).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalSignals);
  });

  it('low + medium + high + unknown counts equal totalSignals', () => {
    const sum =
      summary.lowCount +
      summary.mediumCount +
      summary.highCount +
      summary.unknownCount;
    expect(sum).toBe(summary.totalSignals);
  });

  it('byDimension exposes every canonical dimension key', () => {
    for (const dimension of TECH_READINESS_DIMENSIONS) {
      expect(typeof summary.byDimension[dimension]).toBe('number');
    }
  });

  it('byLevel exposes every canonical level key', () => {
    for (const level of TECH_READINESS_LEVELS) {
      expect(typeof summary.byLevel[level]).toBe('number');
    }
  });

  it('per-level scalar counts mirror byLevel', () => {
    expect(summary.lowCount).toBe(summary.byLevel.low);
    expect(summary.mediumCount).toBe(summary.byLevel.medium);
    expect(summary.highCount).toBe(summary.byLevel.high);
    expect(summary.unknownCount).toBe(summary.byLevel.unknown);
  });

  it('uniqueDomains is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueDomains].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueDomains).toEqual(sorted);
    const unique = new Set(summary.uniqueDomains);
    expect(unique.size).toBe(summary.uniqueDomains.length);
  });

  it('uniquePrograms is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniquePrograms].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniquePrograms).toEqual(sorted);
    const unique = new Set(summary.uniquePrograms);
    expect(unique.size).toBe(summary.uniquePrograms.length);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeTechDataReadiness();
    expect(defaultSummary.totalSignals).toBe(signals.length);
  });

  it('returns 0 totals for an empty input list', () => {
    const empty = summarizeTechDataReadiness([]);
    expect(empty.totalSignals).toBe(0);
    expect(empty.lowCount).toBe(0);
    expect(empty.mediumCount).toBe(0);
    expect(empty.highCount).toBe(0);
    expect(empty.unknownCount).toBe(0);
    expect(empty.uniqueDomains).toEqual([]);
    expect(empty.uniquePrograms).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// getReadinessGaps
// ---------------------------------------------------------------------

describe('getReadinessGaps', () => {
  it('returns only low or unknown level entries', () => {
    const gaps = getReadinessGaps(signals);
    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(['low', 'unknown']).toContain(gap.level);
    }
  });

  it('excludes signals whose level is medium or high', () => {
    const gaps = getReadinessGaps(signals);
    const gapIds = new Set(gaps.map((gap) => gap.id));
    for (const signal of signals) {
      if (signal.level === 'medium' || signal.level === 'high') {
        expect(gapIds.has(signal.id)).toBe(false);
      }
    }
  });

  it('every gap carries the upstream signal headline and remediations', () => {
    const byId = new Map(signals.map((signal) => [signal.id, signal]));
    for (const gap of getReadinessGaps(signals)) {
      const upstream = byId.get(gap.id);
      expect(upstream).toBeDefined();
      if (upstream) {
        expect(gap.headline).toBe(upstream.headline);
        expect(gap.remediations).toEqual(upstream.remediations);
        expect(gap.dimension).toBe(upstream.dimension);
        expect(gap.domainLabel).toBe(upstream.domainLabel);
      }
    }
  });

  it('defaults to scanning the canonical seed when called with no arguments', () => {
    expect(getReadinessGaps().length).toBeGreaterThan(0);
  });

  it('returns an empty list for an empty input', () => {
    expect(getReadinessGaps([]).length).toBe(0);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(signals);

  it('does not invent dollar amounts in any string field', () => {
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

  it('does not claim live telemetry in any note', () => {
    const positiveLiveClaim = /\blive\s+telemetry(?!\s*[:=]?\s*false)/i;
    for (const signal of signals) {
      for (const note of signal.notes) {
        expect(positiveLiveClaim.test(note)).toBe(false);
      }
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

  it('does not assert live telemetry anywhere outside negated context', () => {
    const positivePatterns = [
      /captures\s+live\s+telemetry/i,
      /live\s+telemetry\s+feed/i,
      /live\s+telemetry\s+is\s+connected/i,
      /live\s+telemetry\s+pipeline\s+is\s+connected/i,
    ];
    for (const pattern of positivePatterns) {
      expect(pattern.test(MODULE_SOURCE)).toBe(false);
    }
  });
});

// ACT7 · AI Productivity / DORA Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 20 entries.
// - All 4 DORA metrics covered (≥ 1 each).
// - All 6 productivity metrics covered (≥ 1 each).
// - All 4 bands present (≥ 1 each).
// - All 4 trends present (≥ 1 each).
// - ≥ 3 declining entries.
// - ≥ 5 unique team labels.
// - Every entry carries `liveTelemetry: false`.
// - Every entry carries a seed-tagged measurement source.
// - Byte-equal determinism across repeated calls.
// - summarizeProductivityDora reconciles totals.
// - getDoraEntries / getProductivityEntries / getDecliningOrLowBandEntries
//   behave as documented.
// - Module hygiene: no banned imports, no banned APIs, no live
//   telemetry claims in source.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  DORA_METRICS,
  PRODUCTIVITY_METRICS,
  METRIC_BANDS,
  METRIC_TRENDS,
  METRIC_MEASUREMENT_SOURCES,
  buildProductivityDoraEntries,
  getDecliningOrLowBandEntries,
  getDoraEntries,
  getProductivityEntries,
  summarizeProductivityDora,
  type ProductivityDoraEntry,
  type ProductivityDoraSummary,
} from '@/lib/tower/ai-productivity-dora';

const entries: readonly ProductivityDoraEntry[] =
  buildProductivityDoraEntries();

// Resolved absolute path to the module source so we can run static
// inspection without re-importing it.
const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-productivity-dora.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildProductivityDoraEntries · shape and determinism', () => {
  it('returns at least 20 entries', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildProductivityDoraEntries();
    const b = buildProductivityDoraEntries();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes the four canonical DORA metrics', () => {
    expect([...DORA_METRICS]).toEqual([
      'deployment_frequency',
      'lead_time_for_changes',
      'change_failure_rate',
      'mean_time_to_recovery',
    ]);
  });

  it('exposes the six canonical productivity metrics', () => {
    expect([...PRODUCTIVITY_METRICS]).toEqual([
      'pr_cycle_time',
      'pr_merge_rate',
      'review_turnaround',
      'defect_leakage',
      'rework_ratio',
      'spike_to_ship_ratio',
    ]);
  });

  it('every entry carries createdFrom: "deterministic_productivity_dora_seed"', () => {
    for (const entry of entries) {
      expect(entry.createdFrom).toBe('deterministic_productivity_dora_seed');
    }
  });

  it('every entry id matches the canonical "dora-seed-{team}-{metric}" shape', () => {
    for (const entry of entries) {
      expect(entry.id).toMatch(/^dora-seed-[a-z0-9-]+-[a-z_]+$/);
    }
  });

  it('entry ids are unique', () => {
    const ids = entries.map((entry) => entry.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every entry has at least one note and notes are non-empty', () => {
    for (const entry of entries) {
      expect(entry.notes.length).toBeGreaterThanOrEqual(1);
      for (const note of entry.notes) {
        expect(note.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Metric coverage
// ---------------------------------------------------------------------

describe('metric coverage', () => {
  it.each(DORA_METRICS.map((metric) => [metric]))(
    'has at least one entry for DORA metric %s',
    (metric) => {
      const matches = entries.filter((entry) => entry.metric === metric);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(PRODUCTIVITY_METRICS.map((metric) => [metric]))(
    'has at least one entry for productivity metric %s',
    (metric) => {
      const matches = entries.filter((entry) => entry.metric === metric);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('every DORA-kind entry carries one of the canonical DORA metrics', () => {
    const allowed = new Set<string>([...DORA_METRICS]);
    for (const entry of entries) {
      if (entry.metricKind === 'dora') {
        expect(allowed.has(entry.metric)).toBe(true);
      }
    }
  });

  it('every productivity-kind entry carries one of the canonical productivity metrics', () => {
    const allowed = new Set<string>([...PRODUCTIVITY_METRICS]);
    for (const entry of entries) {
      if (entry.metricKind === 'productivity') {
        expect(allowed.has(entry.metric)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Band & trend coverage
// ---------------------------------------------------------------------

describe('band and trend coverage', () => {
  it.each(METRIC_BANDS.map((band) => [band]))(
    'has at least one entry for band %s',
    (band) => {
      const matches = entries.filter((entry) => entry.band === band);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(METRIC_TRENDS.map((trend) => [trend]))(
    'has at least one entry for trend %s',
    (trend) => {
      const matches = entries.filter((entry) => entry.trend === trend);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('has at least three declining entries', () => {
    const declining = entries.filter((entry) => entry.trend === 'declining');
    expect(declining.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('every entry carries liveTelemetry: false', () => {
    for (const entry of entries) {
      expect(entry.liveTelemetry).toBe(false);
    }
  });

  it('every entry carries a canonical seed-tagged measurement source', () => {
    const allowed = new Set<string>([...METRIC_MEASUREMENT_SOURCES]);
    for (const entry of entries) {
      expect(allowed.has(entry.measurementSource)).toBe(true);
    }
  });

  it('every entry has a non-empty team label', () => {
    for (const entry of entries) {
      expect(entry.teamLabel.length).toBeGreaterThan(0);
    }
  });

  it('delta equals currentValue minus baselineValue', () => {
    for (const entry of entries) {
      const expected = entry.currentValue - entry.baselineValue;
      // Use a small epsilon so floating-point seed values reconcile
      // without forcing every value to be an integer.
      expect(Math.abs(entry.delta - expected)).toBeLessThan(1e-9);
    }
  });

  it('every entry uses a canonical metric kind', () => {
    for (const entry of entries) {
      expect(['dora', 'productivity']).toContain(entry.metricKind);
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT7 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('covers at least 5 unique team labels', () => {
    const teams = new Set(entries.map((entry) => entry.teamLabel));
    expect(teams.size).toBeGreaterThanOrEqual(5);
  });

  it('every required team label is present (sample)', () => {
    const teams = new Set(entries.map((entry) => entry.teamLabel));
    for (const required of [
      'Customer Support Engineering',
      'Platform Squad',
      'Data Platform Team',
      'Risk & Compliance Engineering',
      'Sales Engineering',
    ]) {
      expect(teams.has(required)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// summarizeProductivityDora
// ---------------------------------------------------------------------

describe('summarizeProductivityDora', () => {
  const summary: ProductivityDoraSummary = summarizeProductivityDora(entries);

  it('totalEntries equals the input length', () => {
    expect(summary.totalEntries).toBe(entries.length);
  });

  it('byBand counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byBand).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byTrend counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byTrend).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('doraCount + productivityCount equals totalEntries', () => {
    expect(summary.doraCount + summary.productivityCount).toBe(
      summary.totalEntries,
    );
  });

  it('byBand exposes every canonical band key', () => {
    for (const band of METRIC_BANDS) {
      expect(typeof summary.byBand[band]).toBe('number');
    }
  });

  it('byTrend exposes every canonical trend key', () => {
    for (const trend of METRIC_TRENDS) {
      expect(typeof summary.byTrend[trend]).toBe('number');
    }
  });

  it('byMetric counts sum to totalEntries', () => {
    const sum = Object.values(summary.byMetric).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byMetric exposes every metric that appears in the seed', () => {
    const seenMetrics = new Set(entries.map((entry) => entry.metric));
    for (const metric of seenMetrics) {
      expect(summary.byMetric[metric]).toBeGreaterThan(0);
    }
  });

  it('uniqueTeams is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueTeams].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueTeams).toEqual(sorted);
    const unique = new Set(summary.uniqueTeams);
    expect(unique.size).toBe(summary.uniqueTeams.length);
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
    const defaultSummary = summarizeProductivityDora();
    expect(defaultSummary.totalEntries).toBe(entries.length);
  });
});

// ---------------------------------------------------------------------
// Helper behaviors
// ---------------------------------------------------------------------

describe('helpers', () => {
  it('getDoraEntries returns only DORA-kind entries', () => {
    const dora = getDoraEntries(entries);
    expect(dora.length).toBeGreaterThan(0);
    for (const entry of dora) {
      expect(entry.metricKind).toBe('dora');
    }
  });

  it('getProductivityEntries returns only productivity-kind entries', () => {
    const prod = getProductivityEntries(entries);
    expect(prod.length).toBeGreaterThan(0);
    for (const entry of prod) {
      expect(entry.metricKind).toBe('productivity');
    }
  });

  it('getDoraEntries and getProductivityEntries partition the input', () => {
    const dora = getDoraEntries(entries);
    const prod = getProductivityEntries(entries);
    expect(dora.length + prod.length).toBe(entries.length);
  });

  it('getDecliningOrLowBandEntries returns only declining or low-band entries', () => {
    const flagged = getDecliningOrLowBandEntries(entries);
    expect(flagged.length).toBeGreaterThan(0);
    for (const entry of flagged) {
      const matches = entry.trend === 'declining' || entry.band === 'low';
      expect(matches).toBe(true);
    }
  });

  it('getDecliningOrLowBandEntries excludes entries that are improving and not in the low band', () => {
    const flagged = getDecliningOrLowBandEntries(entries);
    const flaggedIds = new Set(flagged.map((entry) => entry.id));
    for (const entry of entries) {
      if (entry.trend === 'improving' && entry.band !== 'low') {
        expect(flaggedIds.has(entry.id)).toBe(false);
      }
    }
  });

  it('helpers default to summarizing the canonical seed when called with no arguments', () => {
    expect(getDoraEntries().length).toBeGreaterThan(0);
    expect(getProductivityEntries().length).toBeGreaterThan(0);
    expect(getDecliningOrLowBandEntries().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(entries);

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
    // Match any phrase that asserts live telemetry was captured. The
    // seed only ever appears in negated form ("no live telemetry",
    // "no live ... pipeline is connected"), so a positive match would
    // indicate a fabricated claim.
    const positiveLiveClaim = /\blive\s+telemetry(?!\s*[:=]?\s*false)/i;
    for (const entry of entries) {
      for (const note of entry.notes) {
        // Notes never reference 'live telemetry' positively in the
        // seed; assert that explicitly.
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
    // Strip out the comment lines and string literals that mention
    // "live telemetry" only inside a negated phrase or the literal
    // boolean field. What remains must not mention live telemetry as
    // a positive claim.
    //
    // We check this by counting two patterns:
    //
    // - any positive "captures live telemetry" / "live telemetry feed"
    //   style phrase is forbidden,
    // - the boolean field `liveTelemetry: false` is permitted.
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

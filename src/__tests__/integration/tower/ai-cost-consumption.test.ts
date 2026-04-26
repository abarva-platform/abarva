// ACT6 · AI Cost / Consumption Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 16 cost / consumption entries.
// - All 4 canonical scopes present (≥ 1 each).
// - All 5 canonical units present (≥ 1 each).
// - All 4 utilization levels reachable from the seed (≥ 1 each).
// - ≥ 2 entries are over budget.
// - Every entry carries `seed_value: true` and a placeholder provider
//   label (no real vendor names).
// - Every USD cost is one of the canonical round-number placeholders.
// - `summarizeAiCostConsumption` reconciles totals.
// - `getOverBudgetEntries` returns only over-budget rows.
// - `calculateAiCostUtilization` math is correct for all four bands.
// - Byte-equal determinism across repeated calls.
// - Module hygiene (no Date.now, Math.random, new Date, fetch,
//   anthropic, openai, no real provider names, no banned imports).

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AI_COST_CONSUMPTION_SCOPES,
  AI_COST_UNITS,
  AI_COST_UTILIZATION_LEVELS,
  buildAiCostConsumptionSeed,
  calculateAiCostUtilization,
  getOverBudgetEntries,
  summarizeAiCostConsumption,
  type AiCostBudget,
  type AiCostConsumptionEntry,
  type AiCostConsumptionScope,
  type AiCostConsumptionSummary,
  type AiCostUnit,
  type AiCostUtilization,
} from '@/lib/tower/ai-cost-consumption';

const seed: readonly AiCostConsumptionEntry[] = buildAiCostConsumptionSeed();

const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-cost-consumption.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildAiCostConsumptionSeed · shape and determinism', () => {
  it('returns at least 16 entries', () => {
    expect(seed.length).toBeGreaterThanOrEqual(16);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildAiCostConsumptionSeed();
    const b = buildAiCostConsumptionSeed();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes the canonical scope tuple in stable order', () => {
    expect([...AI_COST_CONSUMPTION_SCOPES]).toEqual([
      'tenant',
      'program',
      'workflow',
      'user',
    ]);
  });

  it('exposes the canonical unit tuple in stable order', () => {
    expect([...AI_COST_UNITS]).toEqual([
      'licenses',
      'tokens_input',
      'tokens_output',
      'api_calls',
      'usd_cost',
    ]);
  });

  it('exposes the canonical utilization tuple in stable order', () => {
    expect([...AI_COST_UTILIZATION_LEVELS]).toEqual([
      'underused',
      'normal',
      'high',
      'over_budget',
    ]);
  });

  it('every entry carries seed_value: true', () => {
    for (const entry of seed) {
      expect(entry.seed_value).toBe(true);
    }
  });

  it('every entry carries createdFrom "deterministic_ai_cost_consumption_seed"', () => {
    for (const entry of seed) {
      expect(entry.createdFrom).toBe('deterministic_ai_cost_consumption_seed');
    }
  });

  it('every id matches the canonical "cost-seed-{n}" shape', () => {
    for (const entry of seed) {
      expect(entry.id).toMatch(/^cost-seed-\d+$/);
    }
  });

  it('entry ids are unique', () => {
    const ids = seed.map((entry) => entry.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every entry has a non-empty scopeKey, scopeLabel, and ≥ 1 note', () => {
    for (const entry of seed) {
      expect(entry.scopeKey.length).toBeGreaterThan(0);
      expect(entry.scopeLabel.length).toBeGreaterThan(0);
      expect(entry.notes.length).toBeGreaterThanOrEqual(1);
      for (const note of entry.notes) {
        expect(note.length).toBeGreaterThan(0);
      }
    }
  });

  it('every numeric value is a finite, non-negative number', () => {
    for (const entry of seed) {
      expect(Number.isFinite(entry.consumption)).toBe(true);
      expect(Number.isFinite(entry.budget)).toBe(true);
      expect(Number.isFinite(entry.usdCostSeed)).toBe(true);
      expect(entry.consumption).toBeGreaterThanOrEqual(0);
      expect(entry.budget).toBeGreaterThanOrEqual(0);
      expect(entry.usdCostSeed).toBeGreaterThanOrEqual(0);
    }
  });

  it('every USD cost is one of the canonical round-number placeholders', () => {
    const allowed = new Set([0, 100, 500, 1000, 2500, 5000]);
    for (const entry of seed) {
      expect(allowed.has(entry.usdCostSeed)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Scope, unit, and utilization coverage
// ---------------------------------------------------------------------

describe('scope / unit / utilization coverage', () => {
  it.each(AI_COST_CONSUMPTION_SCOPES.map((s) => [s]))(
    'has at least one entry for scope %s',
    (scope) => {
      const matches = seed.filter((entry) => entry.scope === scope);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(AI_COST_UNITS.map((u) => [u]))(
    'has at least one entry for unit %s',
    (unit) => {
      const matches = seed.filter((entry) => entry.unit === unit);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(AI_COST_UTILIZATION_LEVELS.map((l) => [l]))(
    'has at least one entry whose computed utilization is %s',
    (level) => {
      const matches = seed.filter(
        (entry) => calculateAiCostUtilization(entry) === level,
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical scopes', () => {
    const allowed = new Set<AiCostConsumptionScope>([
      ...AI_COST_CONSUMPTION_SCOPES,
    ]);
    for (const entry of seed) {
      expect(allowed.has(entry.scope)).toBe(true);
    }
  });

  it('only uses canonical units', () => {
    const allowed = new Set<AiCostUnit>([...AI_COST_UNITS]);
    for (const entry of seed) {
      expect(allowed.has(entry.unit)).toBe(true);
    }
  });

  it('only uses placeholder provider labels (no real vendor names)', () => {
    const allowed = new Set([
      'provider_alpha',
      'provider_beta',
      'provider_gamma',
    ]);
    for (const entry of seed) {
      expect(allowed.has(entry.providerLabel)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT6 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('has at least 2 entries that are over budget', () => {
    const overBudget = seed.filter(
      (entry) => calculateAiCostUtilization(entry) === 'over_budget',
    );
    expect(overBudget.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 2 entries linked to a canonical programKey', () => {
    const linked = seed.filter(
      (entry) =>
        typeof entry.programKey === 'string' && entry.programKey.length > 0,
    );
    expect(linked.length).toBeGreaterThanOrEqual(2);
    const allowed = new Set([
      'contact-center-ai',
      'unified-customer-data-platform',
      'store-associate-productivity',
      'demand-forecasting-ai',
    ]);
    for (const entry of linked) {
      expect(allowed.has(entry.programKey as string)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// calculateAiCostUtilization
// ---------------------------------------------------------------------

describe('calculateAiCostUtilization', () => {
  const baseEntry: AiCostConsumptionEntry = {
    id: 'cost-seed-test',
    scope: 'tenant',
    scopeKey: 'tenant-test',
    scopeLabel: 'Tenant test',
    providerLabel: 'provider_alpha',
    unit: 'licenses',
    consumption: 0,
    budget: 0,
    usdCostSeed: 0,
    notes: ['test'],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  };

  it('returns "underused" when ratio < 0.5', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 40,
      budget: 100,
    };
    expect(calculateAiCostUtilization(sample)).toBe('underused');
  });

  it('returns "normal" when ratio is exactly 0.5', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 50,
      budget: 100,
    };
    expect(calculateAiCostUtilization(sample)).toBe('normal');
  });

  it('returns "normal" when 0.5 ≤ ratio ≤ 0.85', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 80,
      budget: 100,
    };
    expect(calculateAiCostUtilization(sample)).toBe('normal');
  });

  it('returns "high" when 0.85 < ratio ≤ 1.0', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 95,
      budget: 100,
    };
    expect(calculateAiCostUtilization(sample)).toBe('high');
  });

  it('returns "high" when ratio is exactly 1.0', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 100,
      budget: 100,
    };
    expect(calculateAiCostUtilization(sample)).toBe('high');
  });

  it('returns "over_budget" when ratio > 1.0', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 150,
      budget: 100,
    };
    expect(calculateAiCostUtilization(sample)).toBe('over_budget');
  });

  it('returns "normal" when both consumption and budget are 0', () => {
    expect(calculateAiCostUtilization(baseEntry)).toBe('normal');
  });

  it('returns "over_budget" when budget is 0 and consumption is positive', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 5,
      budget: 0,
    };
    expect(calculateAiCostUtilization(sample)).toBe('over_budget');
  });

  it('honors an explicit AiCostBudget override over the entry budget', () => {
    const sample: AiCostConsumptionEntry = {
      ...baseEntry,
      consumption: 80,
      budget: 100,
    };
    // Without the override, ratio = 0.8 → "normal".
    expect(calculateAiCostUtilization(sample)).toBe('normal');

    // With the override, ratio = 80 / 200 = 0.4 → "underused".
    const override: AiCostBudget = {
      scope: 'tenant',
      scopeKey: 'tenant-test',
      unit: 'licenses',
      budget: 200,
    };
    expect(calculateAiCostUtilization(sample, override)).toBe('underused');
  });
});

// ---------------------------------------------------------------------
// summarizeAiCostConsumption
// ---------------------------------------------------------------------

describe('summarizeAiCostConsumption', () => {
  const summary: AiCostConsumptionSummary = summarizeAiCostConsumption(seed);

  it('totalEntries equals the seed length', () => {
    expect(summary.totalEntries).toBe(seed.length);
  });

  it('byScope counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byScope).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byUnit counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byUnit).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byUtilization counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byUtilization).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byScope exposes every canonical scope key', () => {
    for (const scope of AI_COST_CONSUMPTION_SCOPES) {
      expect(typeof summary.byScope[scope]).toBe('number');
    }
  });

  it('byUnit exposes every canonical unit key', () => {
    for (const unit of AI_COST_UNITS) {
      expect(typeof summary.byUnit[unit]).toBe('number');
    }
  });

  it('byUtilization exposes every canonical utilization key', () => {
    for (const level of AI_COST_UTILIZATION_LEVELS) {
      expect(typeof summary.byUtilization[level]).toBe('number');
    }
  });

  it('totalUsdCostSeed equals the sum of usdCostSeed across all entries', () => {
    const expected = seed.reduce((a, e) => a + e.usdCostSeed, 0);
    expect(summary.totalUsdCostSeed).toBe(expected);
  });

  it('overBudgetCount equals byUtilization.over_budget', () => {
    expect(summary.overBudgetCount).toBe(summary.byUtilization.over_budget);
  });

  it('uniqueScopeKeys is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueScopeKeys].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueScopeKeys).toEqual(sorted);
    const unique = new Set(summary.uniqueScopeKeys);
    expect(unique.size).toBe(summary.uniqueScopeKeys.length);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeAiCostConsumption();
    expect(defaultSummary.totalEntries).toBe(seed.length);
  });

  it('returns reconciled zero-state for an empty input list', () => {
    const empty = summarizeAiCostConsumption([]);
    expect(empty.totalEntries).toBe(0);
    expect(empty.totalUsdCostSeed).toBe(0);
    expect(empty.overBudgetCount).toBe(0);
    for (const scope of AI_COST_CONSUMPTION_SCOPES) {
      expect(empty.byScope[scope]).toBe(0);
    }
    for (const unit of AI_COST_UNITS) {
      expect(empty.byUnit[unit]).toBe(0);
    }
    for (const level of AI_COST_UTILIZATION_LEVELS) {
      expect(empty.byUtilization[level]).toBe(0);
    }
    expect(empty.uniqueScopeKeys).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// getOverBudgetEntries
// ---------------------------------------------------------------------

describe('getOverBudgetEntries', () => {
  it('returns only over-budget rows', () => {
    const overBudget = getOverBudgetEntries(seed);
    expect(overBudget.length).toBeGreaterThan(0);
    for (const entry of overBudget) {
      expect(calculateAiCostUtilization(entry)).toBe('over_budget');
    }
  });

  it('excludes entries that are not over budget', () => {
    const overBudget = getOverBudgetEntries(seed);
    const overBudgetIds = new Set(overBudget.map((entry) => entry.id));
    for (const entry of seed) {
      if (calculateAiCostUtilization(entry) !== 'over_budget') {
        expect(overBudgetIds.has(entry.id)).toBe(false);
      }
    }
  });

  it('defaults to the canonical seed when called with no arguments', () => {
    expect(getOverBudgetEntries().length).toBe(getOverBudgetEntries(seed).length);
  });
});

// ---------------------------------------------------------------------
// No-fabrication invariants
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(seed);

  it('does not invent a $-prefixed dollar narrative', () => {
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
      'Claude',
      'GPT-4',
      'Gemini',
      'Bedrock',
      'Azure OpenAI',
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

  it('every entry carries seed_value: true (provenance flag)', () => {
    for (const entry of seed) {
      expect(entry.seed_value).toBe(true);
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

  it('does not contain real provider names in the source', () => {
    const providerDenyList = [
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft Copilot',
      'GitHub Copilot',
      'Claude',
      'GPT-4',
      'Gemini',
      'Bedrock',
      'Azure OpenAI',
    ];
    for (const brand of providerDenyList) {
      expect(MODULE_SOURCE).not.toContain(brand);
    }
  });

  it('does not contain placeholder language in the source', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(MODULE_SOURCE).not.toContain(phrase);
    }
  });
});

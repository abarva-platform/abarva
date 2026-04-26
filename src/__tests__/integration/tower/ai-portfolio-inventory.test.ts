// ACT2 · AI Portfolio Inventory Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 18 use cases.
// - All seven canonical stages present.
// - Byte-equal determinism across repeated calls.
// - Every blocked record carries a non-empty blockerReason.
// - Every record carries ≥ 1 technology stack entry.
// - ≥ 6 unique business functions.
// - ≥ 2 production records carry valueReadiness === 'measured_in_production'.
// - ≥ 2 records carry governanceStatus === 'flagged'.
// - summarizeAiPortfolioInventory reconciles totals.
// - getAiUseCasesByStage('blocked') matches getBlockedAiUseCases.
// - getValueReadinessGaps returns only unmeasured / declined records.
// - No invented dollar amounts (regex on JSON.stringify).
// - No branded vendor endorsements (deny-list scan).
// - Module hygiene: no banned imports, no banned APIs.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AI_USE_CASE_STAGES,
  AI_USE_CASE_RISK_LEVELS,
  buildAiPortfolioInventory,
  getAiUseCasesByStage,
  getBlockedAiUseCases,
  getValueReadinessGaps,
  summarizeAiPortfolioInventory,
  type AiPortfolioInventorySummary,
  type AiUseCaseInventoryItem,
  type AiUseCaseStage,
} from '@/lib/tower/ai-portfolio-inventory';

const inventory: readonly AiUseCaseInventoryItem[] = buildAiPortfolioInventory();

// Resolved absolute path to the module source so we can run static
// inspection without re-importing it.
const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-portfolio-inventory.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildAiPortfolioInventory · shape and determinism', () => {
  it('returns at least 18 use cases', () => {
    expect(inventory.length).toBeGreaterThanOrEqual(18);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildAiPortfolioInventory();
    const b = buildAiPortfolioInventory();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes all seven canonical stages in AI_USE_CASE_STAGES', () => {
    expect([...AI_USE_CASE_STAGES]).toEqual([
      'idea',
      'discovery',
      'pilot',
      'production',
      'scaled',
      'retired',
      'blocked',
    ]);
  });

  it('every record carries createdFrom: "deterministic_ai_portfolio_seed"', () => {
    for (const item of inventory) {
      expect(item.createdFrom).toBe('deterministic_ai_portfolio_seed');
    }
  });

  it('every record id matches the canonical "ai-use-case-seed-{n}" shape', () => {
    for (const item of inventory) {
      expect(item.id).toMatch(/^ai-use-case-seed-\d+$/);
    }
  });

  it('record ids are unique', () => {
    const ids = inventory.map((item) => item.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every record has a non-empty name and nextAction', () => {
    for (const item of inventory) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.nextAction.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Stage coverage
// ---------------------------------------------------------------------

describe('stage coverage', () => {
  it.each(AI_USE_CASE_STAGES.map((stage) => [stage]))(
    'has at least one record for stage %s',
    (stage) => {
      const matches = inventory.filter((item) => item.stage === stage);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('has at least two records for every canonical stage (per ACT2 distribution)', () => {
    for (const stage of AI_USE_CASE_STAGES) {
      const matches = inventory.filter((item) => item.stage === stage);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('only uses canonical stages', () => {
    const allowed = new Set<AiUseCaseStage>([...AI_USE_CASE_STAGES]);
    for (const item of inventory) {
      expect(allowed.has(item.stage)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('every blocked record has a non-empty blockerReason', () => {
    const blocked = inventory.filter((item) => item.stage === 'blocked');
    expect(blocked.length).toBeGreaterThanOrEqual(2);
    for (const item of blocked) {
      expect(item.blockerReason).toBeDefined();
      expect((item.blockerReason ?? '').length).toBeGreaterThan(0);
    }
  });

  it('only blocked records carry blockerReason', () => {
    for (const item of inventory) {
      if (item.stage !== 'blocked') {
        expect(item.blockerReason).toBeUndefined();
      }
    }
  });

  it('every record carries at least one technology stack entry', () => {
    for (const item of inventory) {
      expect(item.technologyStack.length).toBeGreaterThanOrEqual(1);
      for (const tech of item.technologyStack) {
        expect(tech.length).toBeGreaterThan(0);
      }
    }
  });

  it('every record carries an owner role and responsibility scope', () => {
    const allowedScopes = new Set([
      'business_function',
      'technology',
      'governance',
      'value_office',
    ]);
    for (const item of inventory) {
      expect(item.owner.role.length).toBeGreaterThan(0);
      expect(allowedScopes.has(item.owner.responsibilityScope)).toBe(true);
    }
  });

  it('linkedPrograms and linkedPatterns are arrays (possibly empty)', () => {
    for (const item of inventory) {
      expect(Array.isArray(item.linkedPrograms)).toBe(true);
      expect(Array.isArray(item.linkedPatterns)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT2 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('covers at least 6 unique business functions', () => {
    const fns = new Set(inventory.map((item) => item.businessFunction));
    expect(fns.size).toBeGreaterThanOrEqual(6);
  });

  it('has at least 2 production records with valueReadiness "measured_in_production"', () => {
    const matches = inventory.filter(
      (item) =>
        item.stage === 'production' &&
        item.valueReadiness === 'measured_in_production',
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 2 records with governanceStatus "flagged"', () => {
    const matches = inventory.filter(
      (item) => item.governanceStatus === 'flagged',
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------
// summarizeAiPortfolioInventory
// ---------------------------------------------------------------------

describe('summarizeAiPortfolioInventory', () => {
  const summary: AiPortfolioInventorySummary =
    summarizeAiPortfolioInventory(inventory);

  it('totalUseCases equals the inventory length', () => {
    expect(summary.totalUseCases).toBe(inventory.length);
  });

  it('byStage counts reconcile to totalUseCases', () => {
    const sum = Object.values(summary.byStage).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalUseCases);
  });

  it('byRiskLevel counts reconcile to totalUseCases', () => {
    const sum = Object.values(summary.byRiskLevel).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalUseCases);
  });

  it('byStage exposes every canonical stage key (zero allowed)', () => {
    for (const stage of AI_USE_CASE_STAGES) {
      expect(typeof summary.byStage[stage]).toBe('number');
    }
  });

  it('byRiskLevel exposes every canonical risk level key (zero allowed)', () => {
    for (const level of AI_USE_CASE_RISK_LEVELS) {
      expect(typeof summary.byRiskLevel[level]).toBe('number');
    }
  });

  it('blockedCount equals byStage.blocked', () => {
    expect(summary.blockedCount).toBe(summary.byStage.blocked);
  });

  it('measuredInProductionCount counts records with valueReadiness "measured_in_production"', () => {
    const expected = inventory.filter(
      (item) => item.valueReadiness === 'measured_in_production',
    ).length;
    expect(summary.measuredInProductionCount).toBe(expected);
  });

  it('ungovernedCount counts records with governanceStatus "undefined" or "flagged"', () => {
    const expected = inventory.filter(
      (item) =>
        item.governanceStatus === 'undefined' ||
        item.governanceStatus === 'flagged',
    ).length;
    expect(summary.ungovernedCount).toBe(expected);
  });

  it('uniqueBusinessFunctions is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueBusinessFunctions].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueBusinessFunctions).toEqual(sorted);
    const unique = new Set(summary.uniqueBusinessFunctions);
    expect(unique.size).toBe(summary.uniqueBusinessFunctions.length);
  });

  it('uniqueTechnologyStacks is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueTechnologyStacks].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueTechnologyStacks).toEqual(sorted);
    const unique = new Set(summary.uniqueTechnologyStacks);
    expect(unique.size).toBe(summary.uniqueTechnologyStacks.length);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeAiPortfolioInventory();
    expect(defaultSummary.totalUseCases).toBe(inventory.length);
  });
});

// ---------------------------------------------------------------------
// getAiUseCasesByStage / getBlockedAiUseCases / getValueReadinessGaps
// ---------------------------------------------------------------------

describe('helpers', () => {
  it('getAiUseCasesByStage("blocked") matches getBlockedAiUseCases', () => {
    const a = getAiUseCasesByStage(inventory, 'blocked');
    const b = getBlockedAiUseCases(inventory);
    expect(a.length).toBe(b.length);
    expect(a.map((item) => item.id)).toEqual(b.map((item) => item.id));
  });

  it('getAiUseCasesByStage returns only matching stage', () => {
    for (const stage of AI_USE_CASE_STAGES) {
      const matches = getAiUseCasesByStage(inventory, stage);
      for (const item of matches) {
        expect(item.stage).toBe(stage);
      }
    }
  });

  it('getValueReadinessGaps returns only unmeasured/declined items', () => {
    const gaps = getValueReadinessGaps(inventory);
    expect(gaps.length).toBeGreaterThan(0);
    for (const item of gaps) {
      expect(['unmeasured', 'declined']).toContain(item.valueReadiness);
    }
  });

  it('getValueReadinessGaps excludes items with measured/projected/in_pilot value readiness', () => {
    const gaps = getValueReadinessGaps(inventory);
    const gapIds = new Set(gaps.map((item) => item.id));
    for (const item of inventory) {
      if (
        item.valueReadiness === 'measured_in_production' ||
        item.valueReadiness === 'projected' ||
        item.valueReadiness === 'in_pilot_measurement'
      ) {
        expect(gapIds.has(item.id)).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(inventory);

  it('does not invent dollar amounts in any string field', () => {
    // Matches "$" followed by optional whitespace and a digit.
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not carry branded vendor endorsements', () => {
    // Deny-list scan. Vendor names should not appear as branded
    // endorsements anywhere in the serialized seed. Phrasing such as
    // "(vendor not selected)" is the canonical neutral form.
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

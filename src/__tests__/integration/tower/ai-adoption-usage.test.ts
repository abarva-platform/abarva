// ACT3 · AI Adoption & Usage Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 18 records.
// - All ten canonical tools represented.
// - All six canonical adoption health states represented.
// - Byte-equal determinism across repeated calls.
// - Every record's adoptionRate equals activeUsers / potentialUsers.
// - Every record carries ≥ 1 workflow covered.
// - ≥ 6 distinct business functions.
// - ≥ 2 records carry governanceFlag === 'flagged'.
// - summarizeAiAdoptionUsage reconciles totals.
// - getAiAdoptionByTool returns only matching tool.
// - getDecliningOrRetiredTools and getUngovernedAdoption partition correctly.
// - No invented dollar amounts.
// - Module hygiene: no banned imports, no banned APIs.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AI_TOOL_KEYS,
  AI_ADOPTION_HEALTH_STATES,
  AI_USAGE_VOLUME_BANDS,
  AI_WORKFLOW_COVERAGE_STATUSES,
  AI_ADOPTION_GOVERNANCE_FLAGS,
  buildAiAdoptionUsageInventory,
  getAiAdoptionByTool,
  getDecliningOrRetiredTools,
  getUngovernedAdoption,
  summarizeAiAdoptionUsage,
  type AiAdoptionUsageSummary,
  type AiToolAdoptionRecord,
  type AiToolKey,
  type AiAdoptionHealth,
  type AiUsageVolumeBand,
} from '@/lib/tower/ai-adoption-usage';

const inventory: readonly AiToolAdoptionRecord[] =
  buildAiAdoptionUsageInventory();

// Resolved absolute path to the module source so we can run static
// inspection without re-importing it.
const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-adoption-usage.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildAiAdoptionUsageInventory · shape and determinism', () => {
  it('returns at least 18 records', () => {
    expect(inventory.length).toBeGreaterThanOrEqual(18);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildAiAdoptionUsageInventory();
    const b = buildAiAdoptionUsageInventory();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes all ten canonical tool keys in AI_TOOL_KEYS', () => {
    expect([...AI_TOOL_KEYS]).toEqual([
      'github_copilot',
      'claude_code',
      'codex',
      'cursor',
      'servicenow_ai_agents',
      'workday_ai_assistant',
      'erp_agents_generic',
      'salesforce_einstein',
      'microsoft_copilot_m365',
      'custom_internal_agents',
    ]);
  });

  it('exposes all six canonical adoption health states', () => {
    expect([...AI_ADOPTION_HEALTH_STATES]).toEqual([
      'not_started',
      'piloting',
      'partial_adoption',
      'broad_adoption',
      'declining',
      'retired',
    ]);
  });

  it('exposes all five canonical usage volume bands', () => {
    expect([...AI_USAGE_VOLUME_BANDS]).toEqual([
      'none',
      'low',
      'medium',
      'high',
      'very_high',
    ]);
  });

  it('exposes all three canonical workflow coverage statuses', () => {
    expect([...AI_WORKFLOW_COVERAGE_STATUSES]).toEqual([
      'not_covered',
      'partial',
      'fully_covered',
    ]);
  });

  it('exposes all three canonical governance flag states', () => {
    expect([...AI_ADOPTION_GOVERNANCE_FLAGS]).toEqual([
      'none',
      'review_required',
      'flagged',
    ]);
  });

  it('every record carries createdFrom: "deterministic_ai_adoption_seed"', () => {
    for (const record of inventory) {
      expect(record.createdFrom).toBe('deterministic_ai_adoption_seed');
    }
  });

  it('every record id matches the canonical "ai-adopt-seed-{tool}-{n}" shape', () => {
    const toolPattern = AI_TOOL_KEYS.join('|');
    const re = new RegExp(`^ai-adopt-seed-(${toolPattern})-\\d+$`);
    for (const record of inventory) {
      expect(record.id).toMatch(re);
    }
  });

  it('record ids are unique', () => {
    const ids = inventory.map((record) => record.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every record has a non-empty toolName and businessFunction', () => {
    for (const record of inventory) {
      expect(record.toolName.length).toBeGreaterThan(0);
      expect(record.businessFunction.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Tool coverage
// ---------------------------------------------------------------------

describe('tool coverage', () => {
  it.each(AI_TOOL_KEYS.map((tool) => [tool]))(
    'has at least one record for tool %s',
    (tool) => {
      const matches = inventory.filter((record) => record.tool === tool);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical tool keys', () => {
    const allowed = new Set<AiToolKey>([...AI_TOOL_KEYS]);
    for (const record of inventory) {
      expect(allowed.has(record.tool)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Health state coverage
// ---------------------------------------------------------------------

describe('health state coverage', () => {
  it.each(AI_ADOPTION_HEALTH_STATES.map((state) => [state]))(
    'has at least one record for health state %s',
    (state) => {
      const matches = inventory.filter(
        (record) => record.adoptionHealth === state,
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical health states', () => {
    const allowed = new Set<AiAdoptionHealth>([...AI_ADOPTION_HEALTH_STATES]);
    for (const record of inventory) {
      expect(allowed.has(record.adoptionHealth)).toBe(true);
    }
  });

  it('only uses canonical usage volume bands', () => {
    const allowed = new Set<AiUsageVolumeBand>([...AI_USAGE_VOLUME_BANDS]);
    for (const record of inventory) {
      expect(allowed.has(record.usageVolume)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('every record carries at least one workflow covered', () => {
    for (const record of inventory) {
      expect(record.workflowsCovered.length).toBeGreaterThanOrEqual(1);
      for (const workflow of record.workflowsCovered) {
        expect(workflow.length).toBeGreaterThan(0);
      }
    }
  });

  it('activeUsers is a non-negative integer ≤ potentialUsers', () => {
    for (const record of inventory) {
      expect(Number.isInteger(record.activeUsers)).toBe(true);
      expect(Number.isInteger(record.potentialUsers)).toBe(true);
      expect(record.activeUsers).toBeGreaterThanOrEqual(0);
      expect(record.potentialUsers).toBeGreaterThanOrEqual(0);
      expect(record.activeUsers).toBeLessThanOrEqual(record.potentialUsers);
    }
  });

  it('adoptionRate equals activeUsers / potentialUsers (rounded to 4 decimals)', () => {
    for (const record of inventory) {
      const expected =
        record.potentialUsers === 0
          ? 0
          : Math.round((record.activeUsers / record.potentialUsers) * 10000) /
            10000;
      expect(record.adoptionRate).toBe(expected);
      expect(record.adoptionRate).toBeGreaterThanOrEqual(0);
      expect(record.adoptionRate).toBeLessThanOrEqual(1);
    }
  });

  it('workflowCoverageStatus is canonical', () => {
    const allowed = new Set<string>([...AI_WORKFLOW_COVERAGE_STATUSES]);
    for (const record of inventory) {
      expect(allowed.has(record.workflowCoverageStatus)).toBe(true);
    }
  });

  it('governanceFlag is canonical', () => {
    const allowed = new Set<string>([...AI_ADOPTION_GOVERNANCE_FLAGS]);
    for (const record of inventory) {
      expect(allowed.has(record.governanceFlag)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT3 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('covers at least 6 distinct business functions', () => {
    const fns = new Set(inventory.map((record) => record.businessFunction));
    expect(fns.size).toBeGreaterThanOrEqual(6);
  });

  it('has at least 2 records with governanceFlag "flagged"', () => {
    const matches = inventory.filter(
      (record) => record.governanceFlag === 'flagged',
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 1 retired record', () => {
    const matches = inventory.filter(
      (record) => record.adoptionHealth === 'retired',
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 1 declining record', () => {
    const matches = inventory.filter(
      (record) => record.adoptionHealth === 'declining',
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 1 broad_adoption record', () => {
    const matches = inventory.filter(
      (record) => record.adoptionHealth === 'broad_adoption',
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 1 partial_adoption record', () => {
    const matches = inventory.filter(
      (record) => record.adoptionHealth === 'partial_adoption',
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 1 piloting record', () => {
    const matches = inventory.filter(
      (record) => record.adoptionHealth === 'piloting',
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 1 not_started record', () => {
    const matches = inventory.filter(
      (record) => record.adoptionHealth === 'not_started',
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// summarizeAiAdoptionUsage
// ---------------------------------------------------------------------

describe('summarizeAiAdoptionUsage', () => {
  const summary: AiAdoptionUsageSummary = summarizeAiAdoptionUsage(inventory);

  it('totalRecords equals the inventory length', () => {
    expect(summary.totalRecords).toBe(inventory.length);
  });

  it('byTool counts reconcile to totalRecords', () => {
    const sum = Object.values(summary.byTool).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalRecords);
  });

  it('byHealth counts reconcile to totalRecords', () => {
    const sum = Object.values(summary.byHealth).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalRecords);
  });

  it('byUsageVolume counts reconcile to totalRecords', () => {
    const sum = Object.values(summary.byUsageVolume).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalRecords);
  });

  it('byTool exposes every canonical tool key (zero allowed)', () => {
    for (const tool of AI_TOOL_KEYS) {
      expect(typeof summary.byTool[tool]).toBe('number');
    }
  });

  it('byHealth exposes every canonical health state key (zero allowed)', () => {
    for (const state of AI_ADOPTION_HEALTH_STATES) {
      expect(typeof summary.byHealth[state]).toBe('number');
    }
  });

  it('byUsageVolume exposes every canonical band key (zero allowed)', () => {
    for (const band of AI_USAGE_VOLUME_BANDS) {
      expect(typeof summary.byUsageVolume[band]).toBe('number');
    }
  });

  it('totalActiveUsers equals the sum of activeUsers across records', () => {
    const expected = inventory.reduce(
      (acc, record) => acc + record.activeUsers,
      0,
    );
    expect(summary.totalActiveUsers).toBe(expected);
  });

  it('totalPotentialUsers equals the sum of potentialUsers across records', () => {
    const expected = inventory.reduce(
      (acc, record) => acc + record.potentialUsers,
      0,
    );
    expect(summary.totalPotentialUsers).toBe(expected);
  });

  it('uniqueBusinessFunctions is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueBusinessFunctions].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueBusinessFunctions).toEqual(sorted);
    const unique = new Set(summary.uniqueBusinessFunctions);
    expect(unique.size).toBe(summary.uniqueBusinessFunctions.length);
  });

  it('uniqueWorkflows is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueWorkflows].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueWorkflows).toEqual(sorted);
    const unique = new Set(summary.uniqueWorkflows);
    expect(unique.size).toBe(summary.uniqueWorkflows.length);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeAiAdoptionUsage();
    expect(defaultSummary.totalRecords).toBe(inventory.length);
  });
});

// ---------------------------------------------------------------------
// helpers: getAiAdoptionByTool / getDecliningOrRetiredTools /
// getUngovernedAdoption
// ---------------------------------------------------------------------

describe('helpers', () => {
  it('getAiAdoptionByTool returns only matching tool', () => {
    for (const tool of AI_TOOL_KEYS) {
      const matches = getAiAdoptionByTool(tool, inventory);
      for (const record of matches) {
        expect(record.tool).toBe(tool);
      }
    }
  });

  it('getAiAdoptionByTool defaults to canonical seed when records argument omitted', () => {
    const a = getAiAdoptionByTool('github_copilot');
    const b = getAiAdoptionByTool('github_copilot', inventory);
    expect(a.map((record) => record.id)).toEqual(b.map((record) => record.id));
  });

  it('getDecliningOrRetiredTools returns only declining or retired records', () => {
    const matches = getDecliningOrRetiredTools(inventory);
    expect(matches.length).toBeGreaterThan(0);
    for (const record of matches) {
      expect(['declining', 'retired']).toContain(record.adoptionHealth);
    }
  });

  it('getDecliningOrRetiredTools partitions correctly: every declining/retired record is included', () => {
    const matches = getDecliningOrRetiredTools(inventory);
    const matchIds = new Set(matches.map((record) => record.id));
    for (const record of inventory) {
      const shouldInclude =
        record.adoptionHealth === 'declining' ||
        record.adoptionHealth === 'retired';
      expect(matchIds.has(record.id)).toBe(shouldInclude);
    }
  });

  it('getUngovernedAdoption returns only review_required or flagged records', () => {
    const matches = getUngovernedAdoption(inventory);
    expect(matches.length).toBeGreaterThan(0);
    for (const record of matches) {
      expect(['review_required', 'flagged']).toContain(record.governanceFlag);
    }
  });

  it('getUngovernedAdoption partitions correctly: every review_required/flagged record is included', () => {
    const matches = getUngovernedAdoption(inventory);
    const matchIds = new Set(matches.map((record) => record.id));
    for (const record of inventory) {
      const shouldInclude =
        record.governanceFlag === 'review_required' ||
        record.governanceFlag === 'flagged';
      expect(matchIds.has(record.id)).toBe(shouldInclude);
    }
  });

  it('getDecliningOrRetiredTools defaults to canonical seed', () => {
    const a = getDecliningOrRetiredTools();
    const b = getDecliningOrRetiredTools(inventory);
    expect(a.map((record) => record.id)).toEqual(b.map((record) => record.id));
  });

  it('getUngovernedAdoption defaults to canonical seed', () => {
    const a = getUngovernedAdoption();
    const b = getUngovernedAdoption(inventory);
    expect(a.map((record) => record.id)).toEqual(b.map((record) => record.id));
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

  it('does not carry banned placeholder language', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(serialized).not.toContain(phrase);
    }
  });

  it('does not frame any tool as a recommendation or endorsement', () => {
    // Per spec: vendor names appear only as toolName / tool keys,
    // never as recommendations. Scan for endorsement-style language.
    const endorsementPhrases = [
      'recommended tool',
      'best-in-class',
      'industry leader',
      'we endorse',
      'our preferred',
      'guaranteed roi',
    ];
    const lower = serialized.toLowerCase();
    for (const phrase of endorsementPhrases) {
      expect(lower).not.toContain(phrase);
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

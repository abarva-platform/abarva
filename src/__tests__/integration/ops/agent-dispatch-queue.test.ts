// OPS2 - Multi-Agent Dispatch Queue Automation Read Model tests.
//
// Deterministic, file-pure suite. No model providers, no shell, no spawning.

import {
  DISPATCH_QUEUE_BLOCK_REASONS,
  DISPATCH_QUEUE_LANE_TYPES,
  DISPATCH_QUEUE_PRIORITIES,
  DISPATCH_QUEUE_STATES,
  getBlockedDispatchItems,
  getDispatchQueueItemsByState,
  getReadyDispatchItems,
  listDispatchQueueItems,
  recommendNextBatch,
  summarizeDispatchQueue,
  type DispatchQueueItem,
  type DispatchQueueState,
} from '@/lib/ops/agent-dispatch-queue';

// ---------------------------------------------------------------------
// JSON file contract
// ---------------------------------------------------------------------

describe('agent-dispatch-queue.json · file contract', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const filePath = path.resolve(
    __dirname,
    '../../../../docs/build/agent-dispatch-queue.json',
  );

  it('exists and parses as valid JSON', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('has schemaVersion 1, a lastUpdated date, a non-empty source, and at least 5 items', () => {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      schemaVersion: number;
      lastUpdated: string;
      source: string;
      items: ReadonlyArray<unknown>;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(typeof parsed.lastUpdated).toBe('string');
    expect(parsed.lastUpdated.length).toBeGreaterThan(0);
    expect(typeof parsed.source).toBe('string');
    expect(parsed.source.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.items)).toBe(true);
    expect(parsed.items.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------
// Canonical state vocabulary
// ---------------------------------------------------------------------

describe('DISPATCH_QUEUE_STATES · canonical lifecycle', () => {
  it('contains all 7 canonical lifecycle states', () => {
    expect([...DISPATCH_QUEUE_STATES]).toEqual([
      'proposed',
      'ready',
      'blocked',
      'in_progress',
      'completed',
      'failed',
      'deferred',
    ]);
  });

  it('every item state in the seed is a valid DispatchQueueState', () => {
    const items = listDispatchQueueItems();
    expect(items.length).toBeGreaterThan(0);
    const validStates = new Set<DispatchQueueState>(DISPATCH_QUEUE_STATES);
    for (const item of items) {
      expect(validStates.has(item.state)).toBe(true);
    }
  });

  it('exposes lane, priority, and block-reason vocabularies as readonly tuples', () => {
    expect(DISPATCH_QUEUE_LANE_TYPES.length).toBeGreaterThan(0);
    expect(DISPATCH_QUEUE_PRIORITIES.length).toBe(3);
    expect(DISPATCH_QUEUE_BLOCK_REASONS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// listDispatchQueueItems · normalization + provenance
// ---------------------------------------------------------------------

describe('listDispatchQueueItems · normalization', () => {
  it('returns deterministic results across repeated calls', () => {
    const first = JSON.stringify(listDispatchQueueItems());
    const second = JSON.stringify(listDispatchQueueItems());
    const third = JSON.stringify(listDispatchQueueItems());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('every item carries createdFrom: deterministic_dispatch_queue_read_model', () => {
    for (const item of listDispatchQueueItems()) {
      expect(item.createdFrom).toBe(
        'deterministic_dispatch_queue_read_model',
      );
    }
  });

  it('every item id is unique and non-empty', () => {
    const items = listDispatchQueueItems();
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(items.length);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('every item exposes a derived targetAgent label that is documentary only', () => {
    for (const item of listDispatchQueueItems()) {
      expect(item.targetAgent.startsWith('lane_agent_')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// getReadyDispatchItems · ready filter
// ---------------------------------------------------------------------

describe('getReadyDispatchItems', () => {
  it('returns only items whose state is ready', () => {
    const ready = getReadyDispatchItems();
    expect(ready.length).toBeGreaterThan(0);
    for (const item of ready) {
      expect(item.state).toBe('ready');
    }
  });

  it('matches getDispatchQueueItemsByState("ready") exactly', () => {
    expect(JSON.stringify(getReadyDispatchItems())).toBe(
      JSON.stringify(getDispatchQueueItemsByState('ready')),
    );
  });
});

// ---------------------------------------------------------------------
// getBlockedDispatchItems · block reason invariant
// ---------------------------------------------------------------------

describe('getBlockedDispatchItems', () => {
  it('returns only items whose state is blocked', () => {
    for (const item of getBlockedDispatchItems()) {
      expect(item.state).toBe('blocked');
    }
  });

  it('every blocked item has a defined blockReason from the canonical vocabulary', () => {
    const valid = new Set<string>(DISPATCH_QUEUE_BLOCK_REASONS);
    for (const item of getBlockedDispatchItems()) {
      expect(item.blockReason).toBeDefined();
      expect(valid.has(item.blockReason as string)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// recommendNextBatch · deterministic ordering
// ---------------------------------------------------------------------

describe('recommendNextBatch', () => {
  it('returns a deterministic ordered list across repeated calls', () => {
    const first = JSON.stringify(recommendNextBatch());
    const second = JSON.stringify(recommendNextBatch());
    expect(second).toBe(first);
  });

  it('only ever recommends ready items', () => {
    const recommendation = recommendNextBatch(20);
    for (const item of recommendation.items) {
      expect(item.state).toBe('ready');
    }
  });

  it('honors the maxItems cap', () => {
    const small = recommendNextBatch(2);
    expect(small.items.length).toBeLessThanOrEqual(2);
    const zero = recommendNextBatch(0);
    expect(zero.items.length).toBe(0);
  });

  it('orders by priority then conflict risk then dependency count then id', () => {
    const recommendation = recommendNextBatch(20);
    const priorityRank: Record<DispatchQueueItem['priority'], number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    const riskRank: Record<DispatchQueueItem['conflictRisk'], number> = {
      low: 0,
      medium: 1,
      high: 2,
      unknown: 3,
    };
    for (let i = 1; i < recommendation.items.length; i += 1) {
      const previous = recommendation.items[i - 1];
      const current = recommendation.items[i];
      const prevKey = [
        priorityRank[previous.priority],
        riskRank[previous.conflictRisk],
        previous.dependencies.length,
        previous.id,
      ];
      const currKey = [
        priorityRank[current.priority],
        riskRank[current.conflictRisk],
        current.dependencies.length,
        current.id,
      ];
      // Lexicographic non-decreasing
      const prevSerialized = JSON.stringify(prevKey);
      const currSerialized = JSON.stringify(currKey);
      expect(prevSerialized <= currSerialized).toBe(true);
    }
  });

  it('carries the deterministic provenance tag', () => {
    const recommendation = recommendNextBatch();
    expect(recommendation.createdFrom).toBe(
      'deterministic_dispatch_queue_read_model',
    );
    expect(recommendation.batchId.startsWith('dispatch-batch-deterministic-')).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------
// summarizeDispatchQueue · totals reconciliation
// ---------------------------------------------------------------------

describe('summarizeDispatchQueue', () => {
  it('totalItems equals listDispatchQueueItems().length', () => {
    const summary = summarizeDispatchQueue();
    expect(summary.totalItems).toBe(listDispatchQueueItems().length);
  });

  it('byState totals reconcile with totalItems', () => {
    const summary = summarizeDispatchQueue();
    const stateTotal = (Object.values(summary.byState) as number[]).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(stateTotal).toBe(summary.totalItems);
  });

  it('byLane totals reconcile with totalItems', () => {
    const summary = summarizeDispatchQueue();
    const laneTotal = (Object.values(summary.byLane) as number[]).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(laneTotal).toBe(summary.totalItems);
  });

  it('byPriority totals reconcile with totalItems', () => {
    const summary = summarizeDispatchQueue();
    const priorityTotal = (
      Object.values(summary.byPriority) as number[]
    ).reduce((sum, count) => sum + count, 0);
    expect(priorityTotal).toBe(summary.totalItems);
  });

  it('readyCount equals getReadyDispatchItems().length', () => {
    const summary = summarizeDispatchQueue();
    expect(summary.readyCount).toBe(getReadyDispatchItems().length);
  });

  it('blockedCount equals getBlockedDispatchItems().length', () => {
    const summary = summarizeDispatchQueue();
    expect(summary.blockedCount).toBe(getBlockedDispatchItems().length);
  });

  it('blockedReasonCounts sum to blockedCount', () => {
    const summary = summarizeDispatchQueue();
    const reasonTotal = (
      Object.values(summary.blockedReasonCounts) as number[]
    ).reduce((sum, count) => sum + count, 0);
    expect(reasonTotal).toBe(summary.blockedCount);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · no agent runtime / network / nondeterminism / spawning
// ---------------------------------------------------------------------

describe('module hygiene · agent-dispatch-queue.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/ops/agent-dispatch-queue.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth / Supabase runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agents\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not use child_process / shell exec', () => {
    expect(codeOnly).not.toMatch(/child_process/);
    expect(codeOnly).not.toMatch(/\bexecSync\(/);
    expect(codeOnly).not.toMatch(/\bspawnSync\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not spawn or invoke agents at runtime', () => {
    // Defensive guard: no top-level spawn(/exec(/Agent( call patterns. This is
    // a read model, not an orchestrator.
    expect(codeOnly).not.toMatch(/\bspawn\(/);
    expect(codeOnly).not.toMatch(/\bexec\(/);
    expect(codeOnly).not.toMatch(/\bnew Agent\(/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('does not invent dollar amounts in normalized output', () => {
    const serialized = JSON.stringify(listDispatchQueueItems());
    expect(serialized).not.toMatch(/\$\s*\d/);
  });
});

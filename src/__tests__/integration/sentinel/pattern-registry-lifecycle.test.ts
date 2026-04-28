/**
 * PAT1 — pattern-registry-lifecycle integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildPatternRegistryView() shape and counts
 *   - getPatternEntry() for key patterns + nonexistent
 *   - listActivePatterns() count and stage invariants
 *   - getPatternsBySignalStrength() for strong and definitive
 *   - describePatternRegistry() prose format
 *   - Array invariants: triggerConditions, contraIndicators, remedyHooks non-empty
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildPatternRegistryView,
  getPatternEntry,
  listActivePatterns,
  getPatternsBySignalStrength,
  describePatternRegistry,
  type PatternRegistryView,
  type PatternRegistryEntry,
} from '@/lib/sentinel/pattern-registry-lifecycle';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/sentinel/pattern-registry-lifecycle.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

// ---------------------------------------------------------------------------
// buildPatternRegistryView shape
// ---------------------------------------------------------------------------

describe('PAT1 — buildPatternRegistryView shape', () => {
  let view: PatternRegistryView;

  beforeAll(() => {
    view = buildPatternRegistryView();
  });

  it('totalCount is 8', () => {
    expect(view.totalCount).toBe(8);
  });

  it('activeCount is 6', () => {
    expect(view.activeCount).toBe(6);
  });

  it('proposedCount is 1', () => {
    expect(view.proposedCount).toBe(1);
  });

  it('deprecatedCount is 1', () => {
    expect(view.deprecatedCount).toBe(1);
  });

  it('archivedCount is 0', () => {
    expect(view.archivedCount).toBe(0);
  });

  it('counts sum to totalCount', () => {
    expect(
      view.activeCount +
        view.proposedCount +
        view.deprecatedCount +
        view.archivedCount,
    ).toBe(view.totalCount);
  });

  it('entries array length equals totalCount', () => {
    expect(view.entries.length).toBe(view.totalCount);
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('every entry has deterministicSeed: true', () => {
    for (const entry of view.entries) {
      expect(entry.deterministicSeed).toBe(true);
    }
  });

  it('every entry has a non-empty patternKey', () => {
    for (const entry of view.entries) {
      expect(typeof entry.patternKey).toBe('string');
      expect(entry.patternKey.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty name', () => {
    for (const entry of view.entries) {
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty description', () => {
    for (const entry of view.entries) {
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('all patternKeys are unique', () => {
    const keys = view.entries.map((e) => e.patternKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// Per-entry: triggerConditions, contraIndicators, remedyHooks non-empty
// ---------------------------------------------------------------------------

describe('PAT1 — all entries have non-empty triggerConditions, contraIndicators, remedyHooks', () => {
  let view: PatternRegistryView;

  beforeAll(() => {
    view = buildPatternRegistryView();
  });

  it('every entry has at least 1 triggerCondition', () => {
    for (const entry of view.entries) {
      expect(Array.isArray(entry.triggerConditions)).toBe(true);
      expect(entry.triggerConditions.length).toBeGreaterThan(0);
    }
  });

  it('every entry has at least 1 contraIndicator', () => {
    for (const entry of view.entries) {
      expect(Array.isArray(entry.contraIndicators)).toBe(true);
      expect(entry.contraIndicators.length).toBeGreaterThan(0);
    }
  });

  it('every entry has at least 1 remedyHook', () => {
    for (const entry of view.entries) {
      expect(Array.isArray(entry.remedyHooks)).toBe(true);
      expect(entry.remedyHooks.length).toBeGreaterThan(0);
    }
  });

  it('every triggerCondition string is non-empty', () => {
    for (const entry of view.entries) {
      for (const cond of entry.triggerConditions) {
        expect(cond.length).toBeGreaterThan(0);
      }
    }
  });

  it('every remedyHook string is non-empty', () => {
    for (const entry of view.entries) {
      for (const hook of entry.remedyHooks) {
        expect(hook.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getPatternEntry — per-key assertions
// ---------------------------------------------------------------------------

describe('PAT1 — getPatternEntry: data-silo-fragmentation (active / strong)', () => {
  let entry: PatternRegistryEntry;

  beforeAll(() => {
    entry = getPatternEntry('data-silo-fragmentation') as PatternRegistryEntry;
  });

  it('returns a non-null value', () => {
    expect(entry).not.toBeNull();
  });

  it('lifecycleStage is active', () => {
    expect(entry.lifecycleStage).toBe('active');
  });

  it('signalStrength is strong', () => {
    expect(entry.signalStrength).toBe('strong');
  });

  it('deterministicSeed is true', () => {
    expect(entry.deterministicSeed).toBe(true);
  });

  it('deprecationNote is null', () => {
    expect(entry.deprecationNote).toBeNull();
  });
});

describe('PAT1 — getPatternEntry: shadow-it-proliferation (deprecated)', () => {
  let entry: PatternRegistryEntry;

  beforeAll(() => {
    entry = getPatternEntry('shadow-it-proliferation') as PatternRegistryEntry;
  });

  it('returns a non-null value', () => {
    expect(entry).not.toBeNull();
  });

  it('lifecycleStage is deprecated', () => {
    expect(entry.lifecycleStage).toBe('deprecated');
  });

  it('deprecationNote is non-null', () => {
    expect(entry.deprecationNote).not.toBeNull();
  });

  it('deprecationNote is a non-empty string', () => {
    expect(typeof entry.deprecationNote).toBe('string');
    expect((entry.deprecationNote as string).length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true', () => {
    expect(entry.deterministicSeed).toBe(true);
  });
});

describe('PAT1 — getPatternEntry: roi-measurement-gap (proposed)', () => {
  let entry: PatternRegistryEntry;

  beforeAll(() => {
    entry = getPatternEntry('roi-measurement-gap') as PatternRegistryEntry;
  });

  it('returns a non-null value', () => {
    expect(entry).not.toBeNull();
  });

  it('lifecycleStage is proposed', () => {
    expect(entry.lifecycleStage).toBe('proposed');
  });

  it('deterministicSeed is true', () => {
    expect(entry.deterministicSeed).toBe(true);
  });
});

describe('PAT1 — getPatternEntry: nonexistent key', () => {
  it('returns null for an unknown pattern key', () => {
    expect(getPatternEntry('nonexistent')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getPatternEntry('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listActivePatterns
// ---------------------------------------------------------------------------

describe('PAT1 — listActivePatterns', () => {
  let active: readonly PatternRegistryEntry[];

  beforeAll(() => {
    active = listActivePatterns();
  });

  it('returns exactly 6 entries', () => {
    expect(active.length).toBe(6);
  });

  it('all returned entries have lifecycleStage: active', () => {
    for (const entry of active) {
      expect(entry.lifecycleStage).toBe('active');
    }
  });

  it('includes data-silo-fragmentation', () => {
    const keys = active.map((e) => e.patternKey);
    expect(keys).toContain('data-silo-fragmentation');
  });

  it('does not include deprecated shadow-it-proliferation', () => {
    const keys = active.map((e) => e.patternKey);
    expect(keys).not.toContain('shadow-it-proliferation');
  });

  it('does not include proposed roi-measurement-gap', () => {
    const keys = active.map((e) => e.patternKey);
    expect(keys).not.toContain('roi-measurement-gap');
  });
});

// ---------------------------------------------------------------------------
// getPatternsBySignalStrength
// ---------------------------------------------------------------------------

describe('PAT1 — getPatternsBySignalStrength', () => {
  it('"strong" returns entries with signalStrength: strong', () => {
    const entries = getPatternsBySignalStrength('strong');
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.signalStrength).toBe('strong');
    }
  });

  it('"strong" includes data-silo-fragmentation', () => {
    const keys = getPatternsBySignalStrength('strong').map((e) => e.patternKey);
    expect(keys).toContain('data-silo-fragmentation');
  });

  it('"definitive" returns governance-gap', () => {
    const entries = getPatternsBySignalStrength('definitive');
    const keys = entries.map((e) => e.patternKey);
    expect(keys).toContain('governance-gap');
  });

  it('"definitive" entries all have signalStrength: definitive', () => {
    for (const e of getPatternsBySignalStrength('definitive')) {
      expect(e.signalStrength).toBe('definitive');
    }
  });

  it('"weak" returns roi-measurement-gap', () => {
    const keys = getPatternsBySignalStrength('weak').map((e) => e.patternKey);
    expect(keys).toContain('roi-measurement-gap');
  });
});

// ---------------------------------------------------------------------------
// describePatternRegistry
// ---------------------------------------------------------------------------

describe('PAT1 — describePatternRegistry', () => {
  let view: PatternRegistryView;

  beforeAll(() => {
    view = buildPatternRegistryView();
  });

  it('returns a non-empty string', () => {
    const desc = describePatternRegistry(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('includes "8 patterns"', () => {
    expect(describePatternRegistry(view)).toContain('8 patterns');
  });

  it('includes "6 active"', () => {
    expect(describePatternRegistry(view)).toContain('6 active');
  });

  it('includes "1 proposed"', () => {
    expect(describePatternRegistry(view)).toContain('1 proposed');
  });

  it('includes "1 deprecated"', () => {
    expect(describePatternRegistry(view)).toContain('1 deprecated');
  });

  it('includes "0 archived"', () => {
    expect(describePatternRegistry(view)).toContain('0 archived');
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('PAT1 — module hygiene', () => {
  let src: string;

  beforeAll(() => {
    src = readSource();
  });

  it('does not call Date.now()', () => {
    expect(src).not.toContain('Date.now(');
  });

  it('does not call Math.random()', () => {
    expect(src).not.toContain('Math.random(');
  });

  it('does not construct new Date(', () => {
    expect(src).not.toContain('new Date(');
  });

  it('does not call fetch(', () => {
    expect(src).not.toContain('fetch(');
  });

  it('does not import useState', () => {
    expect(src).not.toContain('useState');
  });

  it('does not import useEffect', () => {
    expect(src).not.toContain('useEffect');
  });

  it('does not contain "Coming soon"', () => {
    expect(src).not.toContain('Coming soon');
  });

  it('does not contain "TBD"', () => {
    expect(src).not.toContain('TBD');
  });

  it('does not contain "Lorem ipsum"', () => {
    expect(src).not.toContain('Lorem ipsum');
  });

  it('does not import from supabase', () => {
    expect(src).not.toContain('@supabase/supabase-js');
  });

  it('does not import from @clerk/nextjs', () => {
    expect(src).not.toContain('@clerk/nextjs');
  });
});

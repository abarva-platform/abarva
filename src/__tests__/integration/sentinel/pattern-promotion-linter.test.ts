/**
 * PAT2 — pattern-promotion-linter integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - PATTERN_PROMOTION_RULES has 6 rules
 *   - lintPatternPromotion on a fully valid 'proposed' → 'active' returns isAllowed: true
 *   - Returns isAllowed: false when triggerConditions is empty
 *   - Returns isAllowed: false when remedyHooks is empty
 *   - Returns isAllowed: false when description < 20 chars
 *   - Returns isAllowed: false when promoting to 'deprecated' without deprecationNote
 *   - Returns a warning (not error) when contraIndicators is empty
 *   - isPromotionAllowed mirrors lintPatternPromotion.isAllowed
 *   - listPromotionFindings returns findings array consistent with lintPatternPromotion
 *   - Test against real registry entries: at least one active entry passes lint for proposed→active
 *   - deterministicSeed: true on results
 *   - Determinism across calls
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PATTERN_PROMOTION_RULES,
  lintPatternPromotion,
  isPromotionAllowed,
  listPromotionFindings,
  buildPatternRegistryView,
  type PatternPromotionResult,
  type PatternPromotionFinding,
} from '@/lib/sentinel/pattern-promotion-linter';
import type { PatternRegistryEntry } from '@/lib/sentinel/pattern-registry-lifecycle';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/sentinel/pattern-promotion-linter.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

// ---------------------------------------------------------------------------
// Helper: build a valid 'proposed' entry that should pass proposed→active lint
// ---------------------------------------------------------------------------

function makeValidProposedEntry(
  overrides: Partial<PatternRegistryEntry> = {},
): PatternRegistryEntry {
  return {
    patternKey: 'test-valid-proposed',
    name: 'Test Valid Proposed',
    lifecycleStage: 'proposed',
    signalStrength: 'weak',
    description: 'A sufficiently long description for this pattern.',
    triggerConditions: ['Trigger condition one', 'Trigger condition two'],
    contraIndicators: ['Contra indicator one'],
    remedyHooks: ['remedy-hook-one'],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PATTERN_PROMOTION_RULES shape
// ---------------------------------------------------------------------------

describe('PAT2 — PATTERN_PROMOTION_RULES', () => {
  it('has exactly 6 rules', () => {
    expect(PATTERN_PROMOTION_RULES.length).toBe(6);
  });

  it('every rule has a non-empty id', () => {
    for (const rule of PATTERN_PROMOTION_RULES) {
      expect(typeof rule.id).toBe('string');
      expect(rule.id.length).toBeGreaterThan(0);
    }
  });

  it('every rule has a non-empty description', () => {
    for (const rule of PATTERN_PROMOTION_RULES) {
      expect(typeof rule.description).toBe('string');
      expect(rule.description.length).toBeGreaterThan(0);
    }
  });

  it('every rule has a valid severity', () => {
    const valid = new Set(['error', 'warning', 'info']);
    for (const rule of PATTERN_PROMOTION_RULES) {
      expect(valid.has(rule.severity)).toBe(true);
    }
  });

  it('every rule has a non-empty appliesTo array', () => {
    for (const rule of PATTERN_PROMOTION_RULES) {
      expect(Array.isArray(rule.appliesTo)).toBe(true);
      expect(rule.appliesTo.length).toBeGreaterThan(0);
    }
  });

  it('all rule ids are unique', () => {
    const ids = PATTERN_PROMOTION_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires_trigger_conditions is in the set', () => {
    const ids = PATTERN_PROMOTION_RULES.map((r) => r.id);
    expect(ids).toContain('requires_trigger_conditions');
  });

  it('requires_deprecation_note_when_retiring is in the set', () => {
    const ids = PATTERN_PROMOTION_RULES.map((r) => r.id);
    expect(ids).toContain('requires_deprecation_note_when_retiring');
  });
});

// ---------------------------------------------------------------------------
// lintPatternPromotion — fully valid proposed → active
// ---------------------------------------------------------------------------

describe('PAT2 — lintPatternPromotion: valid proposed → active', () => {
  let result: PatternPromotionResult;

  beforeAll(() => {
    result = lintPatternPromotion(makeValidProposedEntry(), 'active');
  });

  it('isAllowed is true', () => {
    expect(result.isAllowed).toBe(true);
  });

  it('errorCount is 0', () => {
    expect(result.errorCount).toBe(0);
  });

  it('deterministicSeed is true', () => {
    expect(result.deterministicSeed).toBe(true);
  });

  it('fromStage is proposed', () => {
    expect(result.fromStage).toBe('proposed');
  });

  it('toStage is active', () => {
    expect(result.toStage).toBe('active');
  });

  it('patternKey matches entry patternKey', () => {
    expect(result.patternKey).toBe('test-valid-proposed');
  });

  it('findings is an array', () => {
    expect(Array.isArray(result.findings)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// lintPatternPromotion — triggerConditions empty blocks active promotion
// ---------------------------------------------------------------------------

describe('PAT2 — lintPatternPromotion: empty triggerConditions → active', () => {
  let result: PatternPromotionResult;

  beforeAll(() => {
    result = lintPatternPromotion(
      makeValidProposedEntry({ triggerConditions: [] }),
      'active',
    );
  });

  it('isAllowed is false', () => {
    expect(result.isAllowed).toBe(false);
  });

  it('errorCount >= 1', () => {
    expect(result.errorCount).toBeGreaterThanOrEqual(1);
  });

  it('findings include requires_trigger_conditions', () => {
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain('requires_trigger_conditions');
  });

  it('requires_trigger_conditions finding has severity: error', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_trigger_conditions',
    );
    expect(finding?.severity).toBe('error');
  });

  it('requires_trigger_conditions finding has field: triggerConditions', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_trigger_conditions',
    );
    expect(finding?.field).toBe('triggerConditions');
  });
});

// ---------------------------------------------------------------------------
// lintPatternPromotion — remedyHooks empty blocks active promotion
// ---------------------------------------------------------------------------

describe('PAT2 — lintPatternPromotion: empty remedyHooks → active', () => {
  let result: PatternPromotionResult;

  beforeAll(() => {
    result = lintPatternPromotion(
      makeValidProposedEntry({ remedyHooks: [] }),
      'active',
    );
  });

  it('isAllowed is false', () => {
    expect(result.isAllowed).toBe(false);
  });

  it('findings include requires_remedy_hooks', () => {
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain('requires_remedy_hooks');
  });

  it('requires_remedy_hooks finding has severity: error', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_remedy_hooks',
    );
    expect(finding?.severity).toBe('error');
  });

  it('requires_remedy_hooks finding has field: remedyHooks', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_remedy_hooks',
    );
    expect(finding?.field).toBe('remedyHooks');
  });
});

// ---------------------------------------------------------------------------
// lintPatternPromotion — short description blocks active promotion
// ---------------------------------------------------------------------------

describe('PAT2 — lintPatternPromotion: description < 20 chars → active', () => {
  let result: PatternPromotionResult;

  beforeAll(() => {
    result = lintPatternPromotion(
      makeValidProposedEntry({ description: 'Too short.' }),
      'active',
    );
  });

  it('isAllowed is false', () => {
    expect(result.isAllowed).toBe(false);
  });

  it('findings include requires_description_length', () => {
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain('requires_description_length');
  });

  it('requires_description_length finding has severity: error', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_description_length',
    );
    expect(finding?.severity).toBe('error');
  });

  it('requires_description_length finding has field: description', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_description_length',
    );
    expect(finding?.field).toBe('description');
  });
});

// ---------------------------------------------------------------------------
// lintPatternPromotion — missing deprecationNote blocks deprecated promotion
// ---------------------------------------------------------------------------

describe('PAT2 — lintPatternPromotion: no deprecationNote → deprecated', () => {
  let result: PatternPromotionResult;

  beforeAll(() => {
    // deprecationNote: null should fail the deprecated rule
    result = lintPatternPromotion(
      makeValidProposedEntry({ deprecationNote: null }),
      'deprecated',
    );
  });

  it('isAllowed is false', () => {
    expect(result.isAllowed).toBe(false);
  });

  it('findings include requires_deprecation_note_when_retiring', () => {
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain('requires_deprecation_note_when_retiring');
  });

  it('requires_deprecation_note_when_retiring finding has severity: error', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_deprecation_note_when_retiring',
    );
    expect(finding?.severity).toBe('error');
  });

  it('requires_deprecation_note_when_retiring finding has field: deprecationNote', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_deprecation_note_when_retiring',
    );
    expect(finding?.field).toBe('deprecationNote');
  });
});

// ---------------------------------------------------------------------------
// lintPatternPromotion — empty contraIndicators is a warning, not an error
// ---------------------------------------------------------------------------

describe('PAT2 — lintPatternPromotion: empty contraIndicators → active (warning only)', () => {
  let result: PatternPromotionResult;

  beforeAll(() => {
    result = lintPatternPromotion(
      makeValidProposedEntry({ contraIndicators: [] }),
      'active',
    );
  });

  it('findings include requires_contra_indicators', () => {
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain('requires_contra_indicators');
  });

  it('requires_contra_indicators finding has severity: warning', () => {
    const finding = result.findings.find(
      (f) => f.ruleId === 'requires_contra_indicators',
    );
    expect(finding?.severity).toBe('warning');
  });

  it('isAllowed is true (warning does not block promotion)', () => {
    expect(result.isAllowed).toBe(true);
  });

  it('warningCount >= 1', () => {
    expect(result.warningCount).toBeGreaterThanOrEqual(1);
  });

  it('errorCount is 0', () => {
    expect(result.errorCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isPromotionAllowed mirrors lintPatternPromotion.isAllowed
// ---------------------------------------------------------------------------

describe('PAT2 — isPromotionAllowed mirrors lintPatternPromotion.isAllowed', () => {
  it('returns true for valid proposed → active', () => {
    const entry = makeValidProposedEntry();
    expect(isPromotionAllowed(entry, 'active')).toBe(
      lintPatternPromotion(entry, 'active').isAllowed,
    );
  });

  it('returns false for empty triggerConditions → active', () => {
    const entry = makeValidProposedEntry({ triggerConditions: [] });
    expect(isPromotionAllowed(entry, 'active')).toBe(
      lintPatternPromotion(entry, 'active').isAllowed,
    );
  });

  it('returns false for empty remedyHooks → active', () => {
    const entry = makeValidProposedEntry({ remedyHooks: [] });
    expect(isPromotionAllowed(entry, 'active')).toBe(
      lintPatternPromotion(entry, 'active').isAllowed,
    );
  });

  it('returns false for null deprecationNote → deprecated', () => {
    const entry = makeValidProposedEntry({ deprecationNote: null });
    expect(isPromotionAllowed(entry, 'deprecated')).toBe(
      lintPatternPromotion(entry, 'deprecated').isAllowed,
    );
  });

  it('returns true when only a warning is present', () => {
    const entry = makeValidProposedEntry({ contraIndicators: [] });
    expect(isPromotionAllowed(entry, 'active')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// listPromotionFindings consistent with lintPatternPromotion
// ---------------------------------------------------------------------------

describe('PAT2 — listPromotionFindings consistent with lintPatternPromotion', () => {
  it('for valid entry → active: findings array length matches', () => {
    const entry = makeValidProposedEntry();
    const findings = listPromotionFindings(entry, 'active');
    const result = lintPatternPromotion(entry, 'active');
    expect(findings.length).toBe(result.findings.length);
  });

  it('for invalid entry (no triggerConditions) → active: findings contains error', () => {
    const entry = makeValidProposedEntry({ triggerConditions: [] });
    const findings = listPromotionFindings(entry, 'active');
    expect(findings.some((f) => f.severity === 'error')).toBe(true);
  });

  it('for invalid entry → active: finding ruleIds match lintPatternPromotion findings', () => {
    const entry = makeValidProposedEntry({ triggerConditions: [], remedyHooks: [] });
    const findings = listPromotionFindings(entry, 'active');
    const result = lintPatternPromotion(entry, 'active');
    const findingIds = findings.map((f) => f.ruleId).sort();
    const resultIds = result.findings.map((f) => f.ruleId).sort();
    expect(findingIds).toEqual(resultIds);
  });

  it('each finding has a non-null ruleId', () => {
    const entry = makeValidProposedEntry({ triggerConditions: [], contraIndicators: [] });
    for (const finding of listPromotionFindings(entry, 'active')) {
      expect(typeof finding.ruleId).toBe('string');
      expect(finding.ruleId.length).toBeGreaterThan(0);
    }
  });

  it('each finding has a non-empty message', () => {
    const entry = makeValidProposedEntry({ triggerConditions: [] });
    for (const finding of listPromotionFindings(entry, 'active')) {
      expect(typeof finding.message).toBe('string');
      expect(finding.message.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Real registry entries — at least one active entry passes proposed→active lint
// ---------------------------------------------------------------------------

describe('PAT2 — real registry entries', () => {
  it('buildPatternRegistryView() returns entries', () => {
    const view = buildPatternRegistryView();
    expect(view.entries.length).toBeGreaterThan(0);
  });

  it('at least one active entry passes lint when treated as proposed → active', () => {
    const view = buildPatternRegistryView();
    const activeEntries = view.entries.filter(
      (e) => e.lifecycleStage === 'active',
    );
    // Simulate each active entry as if it were a proposed entry being promoted
    const promoted = activeEntries.map((e) => {
      const asProposed: PatternRegistryEntry = { ...e, lifecycleStage: 'proposed' };
      return lintPatternPromotion(asProposed, 'active');
    });
    const anyAllowed = promoted.some((r) => r.isAllowed);
    expect(anyAllowed).toBe(true);
  });

  it('data-silo-fragmentation passes proposed → active lint', () => {
    const view = buildPatternRegistryView();
    const entry = view.entries.find((e) => e.patternKey === 'data-silo-fragmentation')!;
    const asProposed: PatternRegistryEntry = { ...entry, lifecycleStage: 'proposed' };
    const result = lintPatternPromotion(asProposed, 'active');
    expect(result.isAllowed).toBe(true);
  });

  it('shadow-it-proliferation (deprecated) has a deprecationNote and passes deprecated lint', () => {
    const view = buildPatternRegistryView();
    const entry = view.entries.find(
      (e) => e.patternKey === 'shadow-it-proliferation',
    )!;
    // It already has a deprecationNote, so the deprecation note rule should not fire
    const result = lintPatternPromotion(entry, 'deprecated');
    const noteError = result.findings.find(
      (f) => f.ruleId === 'requires_deprecation_note_when_retiring',
    );
    expect(noteError).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// deterministicSeed: true on results
// ---------------------------------------------------------------------------

describe('PAT2 — deterministicSeed on results', () => {
  it('lintPatternPromotion result has deterministicSeed: true', () => {
    const result = lintPatternPromotion(makeValidProposedEntry(), 'active');
    expect(result.deterministicSeed).toBe(true);
  });

  it('deterministicSeed is the literal boolean true (not truthy)', () => {
    const result = lintPatternPromotion(makeValidProposedEntry(), 'active');
    expect(result.deterministicSeed).toStrictEqual(true);
  });
});

// ---------------------------------------------------------------------------
// Determinism across calls
// ---------------------------------------------------------------------------

describe('PAT2 — determinism across calls', () => {
  it('lintPatternPromotion returns same isAllowed on repeated calls', () => {
    const entry = makeValidProposedEntry();
    const r1 = lintPatternPromotion(entry, 'active');
    const r2 = lintPatternPromotion(entry, 'active');
    expect(r1.isAllowed).toBe(r2.isAllowed);
  });

  it('lintPatternPromotion returns same errorCount on repeated calls', () => {
    const entry = makeValidProposedEntry({ triggerConditions: [] });
    const r1 = lintPatternPromotion(entry, 'active');
    const r2 = lintPatternPromotion(entry, 'active');
    expect(r1.errorCount).toBe(r2.errorCount);
  });

  it('listPromotionFindings returns same length on repeated calls', () => {
    const entry = makeValidProposedEntry();
    const f1 = listPromotionFindings(entry, 'active');
    const f2 = listPromotionFindings(entry, 'active');
    expect(f1.length).toBe(f2.length);
  });

  it('isPromotionAllowed returns same result on repeated calls', () => {
    const entry = makeValidProposedEntry();
    const r1 = isPromotionAllowed(entry, 'active');
    const r2 = isPromotionAllowed(entry, 'active');
    expect(r1).toBe(r2);
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('PAT2 — module hygiene', () => {
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

  it('does not import from supabase', () => {
    expect(src).not.toContain('@supabase/supabase-js');
  });

  it('does not import from @clerk/nextjs', () => {
    expect(src).not.toContain('@clerk/nextjs');
  });

  it('does not contain "Coming soon"', () => {
    expect(src).not.toContain('Coming soon');
  });

  it('does not contain "TBD"', () => {
    expect(src).not.toContain('TBD');
  });
});

/**
 * Wave 29 OPS4 — Pack Spec Validator
 *
 * Verifies the deterministic pack spec validation read model:
 * - Valid entries pass all checks
 * - Invalid entries produce correct violations
 * - Pack-level aggregation is accurate
 * - Utility helpers work correctly
 */

import {
  validatePackSpecEntry,
  validatePackSpec,
  flattenPackSpecViolations,
  summarizePackValidation,
  PackSpecEntryShape,
  SLUG_PATTERN,
  ID_PATTERN,
  MIN_DESCRIPTION_LENGTH,
  MIN_PRIMARY_QUESTION_LENGTH,
  MIN_CRITERIA_COUNT,
} from '@/lib/ops/pack-spec-validator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_ENTRY: PackSpecEntryShape = {
  id: 'test-001',
  slug: 'test-data-platform-sourcing',
  name: 'Test Data Platform Sourcing',
  category: 'sourcing',
  shortDescription:
    'A robust sourcing pattern for selecting data platform vendors with technical depth, governance, and transition risk evaluation.',
  primaryQuestion:
    'Does this vendor have the right operational model for our data platform?',
  criteria: [
    {
      id: 'c001',
      area: 'Technical Depth',
      criterion: 'Data engineering breadth',
    },
  ],
  failureModes: [
    { id: 'fm001', title: 'Vendor lock-in', description: 'Over-reliance on proprietary APIs.' },
  ],
  sentinelSignals: ['No reference customers in comparable verticals'],
  relatedPatternSlugs: ['ims-managed-services'],
  createdFrom: 'test_deterministic_seed',
};

const VALID_MINIMAL_ENTRY: PackSpecEntryShape = {
  id: 'min-001',
  slug: 'minimal-valid-entry',
  name: 'Minimal Valid Entry',
  category: 'evaluation',
  shortDescription: 'A short but sufficiently descriptive entry for the validator tests.',
  primaryQuestion: 'Is this entry structurally complete for validation?',
  criteria: [{ id: 'c001' }],
  createdFrom: 'test_minimal_seed',
};

// ---------------------------------------------------------------------------
// validatePackSpecEntry — valid entries
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — valid entries', () => {
  it('valid full entry passes with 0 errors', () => {
    const result = validatePackSpecEntry(VALID_ENTRY);
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('valid minimal entry passes with 0 errors', () => {
    const result = validatePackSpecEntry(VALID_MINIMAL_ENTRY);
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('result has deterministicSeed: true', () => {
    const result = validatePackSpecEntry(VALID_ENTRY);
    expect(result.deterministicSeed).toBe(true);
  });

  it('result.entryId matches the entry id', () => {
    const result = validatePackSpecEntry(VALID_ENTRY);
    expect(result.entryId).toBe(VALID_ENTRY.id);
  });

  it('result.entrySlug matches the entry slug', () => {
    const result = validatePackSpecEntry(VALID_ENTRY);
    expect(result.entrySlug).toBe(VALID_ENTRY.slug);
  });
});

// ---------------------------------------------------------------------------
// validatePackSpecEntry — id violations
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — id violations', () => {
  it('empty id produces an error violation', () => {
    const entry = { ...VALID_ENTRY, id: '' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    const violation = result.violations.find((v) => v.field === 'id');
    expect(violation).toBeDefined();
    expect(violation!.severity).toBe('error');
    expect(violation!.category).toBe('identity');
  });

  it('id with spaces produces an error violation', () => {
    const entry = { ...VALID_ENTRY, id: 'bad id here' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'id' && v.severity === 'error')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePackSpecEntry — slug violations
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — slug violations', () => {
  it('empty slug produces an error violation', () => {
    const entry = { ...VALID_ENTRY, slug: '' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'slug' && v.severity === 'error')).toBe(true);
  });

  it('slug with uppercase produces an error violation', () => {
    const entry = { ...VALID_ENTRY, slug: 'InvalidSlug' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'slug' && v.severity === 'error')).toBe(true);
  });

  it('slug with underscore produces an error violation', () => {
    const entry = { ...VALID_ENTRY, slug: 'bad_slug' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'slug' && v.severity === 'error')).toBe(true);
  });

  it('slug too short (2 chars) produces an error violation', () => {
    const entry = { ...VALID_ENTRY, slug: 'ab' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'slug' && v.severity === 'error')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePackSpecEntry — name violations
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — name violations', () => {
  it('empty name produces an error violation', () => {
    const entry = { ...VALID_ENTRY, name: '' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'name' && v.severity === 'error')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePackSpecEntry — content violations
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — content violations', () => {
  it('empty shortDescription produces an error', () => {
    const entry = { ...VALID_ENTRY, shortDescription: '' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'shortDescription' && v.severity === 'error')).toBe(true);
  });

  it(`shortDescription shorter than ${MIN_DESCRIPTION_LENGTH} chars produces a warning`, () => {
    const entry = { ...VALID_ENTRY, shortDescription: 'Too short.' };
    const result = validatePackSpecEntry(entry);
    const warning = result.violations.find((v) => v.field === 'shortDescription' && v.severity === 'warning');
    expect(warning).toBeDefined();
    // Warning alone doesn't make it invalid (warnings don't fail validation)
    expect(result.errorCount).toBe(0);
  });

  it('empty primaryQuestion produces an error', () => {
    const entry = { ...VALID_ENTRY, primaryQuestion: '' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'primaryQuestion' && v.severity === 'error')).toBe(true);
  });

  it(`primaryQuestion shorter than ${MIN_PRIMARY_QUESTION_LENGTH} chars produces a warning`, () => {
    const entry = { ...VALID_ENTRY, primaryQuestion: 'Short?' };
    const result = validatePackSpecEntry(entry);
    const warning = result.violations.find((v) => v.field === 'primaryQuestion' && v.severity === 'warning');
    expect(warning).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// validatePackSpecEntry — structure violations
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — structure violations', () => {
  it('empty criteria array produces an error', () => {
    const entry = { ...VALID_ENTRY, criteria: [] };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'criteria' && v.severity === 'error')).toBe(true);
  });

  it('non-array criteria produces an error', () => {
    const entry = { ...VALID_ENTRY, criteria: 'not-an-array' as never };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'criteria' && v.severity === 'error')).toBe(true);
  });

  it('failureModes as string produces an error', () => {
    const entry = { ...VALID_ENTRY, failureModes: 'not-an-array' as never };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'failureModes' && v.severity === 'error')).toBe(true);
  });

  it('empty sentinelSignals array produces a warning', () => {
    const entry = { ...VALID_ENTRY, sentinelSignals: [] };
    const result = validatePackSpecEntry(entry);
    const warning = result.violations.find((v) => v.field === 'sentinelSignals' && v.severity === 'warning');
    expect(warning).toBeDefined();
    // Warning only — entry still valid
    expect(result.errorCount).toBe(0);
  });

  it('invalid relatedPatternSlug produces a warning', () => {
    const entry = { ...VALID_ENTRY, relatedPatternSlugs: ['Invalid_Slug'] };
    const result = validatePackSpecEntry(entry);
    const warning = result.violations.find((v) => v.field.startsWith('relatedPatternSlugs') && v.severity === 'warning');
    expect(warning).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// validatePackSpecEntry — provenance violations
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpecEntry() — provenance violations', () => {
  it('empty createdFrom produces an error', () => {
    const entry = { ...VALID_ENTRY, createdFrom: '' };
    const result = validatePackSpecEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.field === 'createdFrom' && v.severity === 'error')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePackSpec — pack-level aggregation
// ---------------------------------------------------------------------------

describe('OPS4 — validatePackSpec()', () => {
  it('all-valid pack returns overallStatus pass', () => {
    const report = validatePackSpec('TEST-PACK', [VALID_ENTRY, VALID_MINIMAL_ENTRY]);
    expect(report.overallStatus).toBe('pass');
  });

  it('pack with one invalid entry returns overallStatus fail', () => {
    const badEntry = { ...VALID_ENTRY, id: '' };
    const report = validatePackSpec('TEST-PACK', [VALID_ENTRY, badEntry]);
    expect(report.overallStatus).toBe('fail');
    expect(report.invalidEntries).toBe(1);
  });

  it('pack with only warnings returns overallStatus warn', () => {
    const warnEntry: PackSpecEntryShape = {
      ...VALID_ENTRY,
      shortDescription: 'Too short.',  // warning only
      sentinelSignals: [],              // warning only
    };
    const report = validatePackSpec('TEST-PACK', [warnEntry]);
    expect(report.overallStatus).toBe('warn');
    expect(report.totalErrors).toBe(0);
    expect(report.totalWarnings).toBeGreaterThan(0);
  });

  it('totalEntries matches input array length', () => {
    const report = validatePackSpec('TEST-PACK', [VALID_ENTRY, VALID_MINIMAL_ENTRY]);
    expect(report.totalEntries).toBe(2);
  });

  it('validEntries + invalidEntries === totalEntries', () => {
    const badEntry = { ...VALID_ENTRY, id: '' };
    const report = validatePackSpec('TEST-PACK', [VALID_ENTRY, VALID_MINIMAL_ENTRY, badEntry]);
    expect(report.validEntries + report.invalidEntries).toBe(report.totalEntries);
  });

  it('results array has same length as input', () => {
    const report = validatePackSpec('TEST-PACK', [VALID_ENTRY, VALID_MINIMAL_ENTRY]);
    expect(report.results.length).toBe(2);
  });

  it('report has deterministicSeed: true', () => {
    const report = validatePackSpec('TEST-PACK', [VALID_ENTRY]);
    expect(report.deterministicSeed).toBe(true);
  });

  it('empty pack returns totalEntries 0 and overallStatus pass', () => {
    const report = validatePackSpec('EMPTY-PACK', []);
    expect(report.totalEntries).toBe(0);
    expect(report.totalErrors).toBe(0);
    expect(report.overallStatus).toBe('pass');
  });

  it('packId is preserved in the report', () => {
    const report = validatePackSpec('MY-PACK-ID', [VALID_ENTRY]);
    expect(report.packId).toBe('MY-PACK-ID');
  });
});

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

describe('OPS4 — flattenPackSpecViolations()', () => {
  it('returns all violations with entryId and entrySlug attached', () => {
    const badEntry = { ...VALID_ENTRY, id: '', createdFrom: '' };
    const report = validatePackSpec('TEST', [badEntry]);
    const flat = flattenPackSpecViolations(report);
    expect(flat.length).toBeGreaterThan(0);
    for (const fv of flat) {
      expect(typeof fv.entryId).toBe('string');
      expect(typeof fv.entrySlug).toBe('string');
      expect(typeof fv.field).toBe('string');
      expect(typeof fv.message).toBe('string');
    }
  });

  it('returns empty array for a clean pack', () => {
    const report = validatePackSpec('TEST', [VALID_ENTRY, VALID_MINIMAL_ENTRY]);
    const flat = flattenPackSpecViolations(report);
    expect(flat.length).toBe(0);
  });
});

describe('OPS4 — summarizePackValidation()', () => {
  it('returns a non-empty string', () => {
    const report = validatePackSpec('TEST', [VALID_ENTRY]);
    const summary = summarizePackValidation(report);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('includes pack id in summary', () => {
    const report = validatePackSpec('MYPACK', [VALID_ENTRY]);
    const summary = summarizePackValidation(report);
    expect(summary).toContain('MYPACK');
  });

  it('includes PASS in summary for a valid pack', () => {
    const report = validatePackSpec('GOODPACK', [VALID_ENTRY, VALID_MINIMAL_ENTRY]);
    const summary = summarizePackValidation(report);
    expect(summary.toUpperCase()).toContain('PASS');
  });

  it('includes FAIL in summary for an invalid pack', () => {
    const badEntry = { ...VALID_ENTRY, id: '' };
    const report = validatePackSpec('BADPACK', [badEntry]);
    const summary = summarizePackValidation(report);
    expect(summary.toUpperCase()).toContain('FAIL');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('OPS4 — Constants', () => {
  it('SLUG_PATTERN accepts valid slugs', () => {
    expect(SLUG_PATTERN.test('my-slug')).toBe(true);
    expect(SLUG_PATTERN.test('data-platform-managed-services')).toBe(true);
    expect(SLUG_PATTERN.test('abc')).toBe(true);
    expect(SLUG_PATTERN.test('a1b2-c3')).toBe(true);
  });

  it('SLUG_PATTERN rejects invalid slugs', () => {
    expect(SLUG_PATTERN.test('BadSlug')).toBe(false);
    expect(SLUG_PATTERN.test('bad_slug')).toBe(false);
    expect(SLUG_PATTERN.test('')).toBe(false);
    // Note: length < 3 is enforced in validatePackSpecEntry, not SLUG_PATTERN alone
  });

  it('ID_PATTERN accepts strings without whitespace', () => {
    expect(ID_PATTERN.test('entry-001')).toBe(true);
    expect(ID_PATTERN.test('dpms-c001')).toBe(true);
  });

  it('ID_PATTERN rejects strings with whitespace', () => {
    expect(ID_PATTERN.test('bad id')).toBe(false);
    expect(ID_PATTERN.test('')).toBe(false);
  });

  it('MIN_DESCRIPTION_LENGTH is a positive number', () => {
    expect(typeof MIN_DESCRIPTION_LENGTH).toBe('number');
    expect(MIN_DESCRIPTION_LENGTH).toBeGreaterThan(0);
  });

  it('MIN_PRIMARY_QUESTION_LENGTH is a positive number', () => {
    expect(typeof MIN_PRIMARY_QUESTION_LENGTH).toBe('number');
    expect(MIN_PRIMARY_QUESTION_LENGTH).toBeGreaterThan(0);
  });

  it('MIN_CRITERIA_COUNT is at least 1', () => {
    expect(MIN_CRITERIA_COUNT).toBeGreaterThanOrEqual(1);
  });
});

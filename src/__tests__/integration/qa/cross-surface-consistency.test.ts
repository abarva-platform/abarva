// QA17 — Cross-Surface Consistency Validator · integration tests
// ≥30 tests covering check structure, consistency logic, mismatch
// detection, extraneous value detection, and report aggregates.

import {
  ALL_SURFACES,
  CREATED_FROM,
  buildConsistencyChecks,
  buildCrossSurfaceConsistencyReport,
  type ConsistencyCheck,
  type CrossSurfaceConsistencyReport,
  type Surface,
} from '../../../lib/qa/cross-surface-consistency'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_SURFACE_KEYS: Surface[] = ['programs', 'tower', 'intelligence', 'admin']

function allSurfaceKeysPresent(sv: Record<Surface, string[]>): boolean {
  return ALL_SURFACE_KEYS.every((s) => Object.prototype.hasOwnProperty.call(sv, s))
}

// ---------------------------------------------------------------------------
// buildConsistencyChecks()
// ---------------------------------------------------------------------------

describe('buildConsistencyChecks()', () => {
  let checks: ConsistencyCheck[]

  beforeAll(() => {
    checks = buildConsistencyChecks()
  })

  test('returns an array', () => {
    expect(Array.isArray(checks)).toBe(true)
  })

  test('returns at least 6 checks', () => {
    expect(checks.length).toBeGreaterThanOrEqual(6)
  })

  test('every check has a non-empty checkId', () => {
    checks.forEach((c) => {
      expect(typeof c.checkId).toBe('string')
      expect(c.checkId.length).toBeGreaterThan(0)
    })
  })

  test('every check has a non-empty label', () => {
    checks.forEach((c) => {
      expect(typeof c.label).toBe('string')
      expect(c.label.length).toBeGreaterThan(0)
    })
  })

  test('every check has a non-empty surfaces array', () => {
    checks.forEach((c) => {
      expect(Array.isArray(c.surfaces)).toBe(true)
      expect(c.surfaces.length).toBeGreaterThan(0)
    })
  })

  test('every check surfaces array contains only valid Surface values', () => {
    checks.forEach((c) => {
      c.surfaces.forEach((s) => {
        expect(ALL_SURFACE_KEYS).toContain(s)
      })
    })
  })

  test('every check has a non-empty expectedValues array', () => {
    checks.forEach((c) => {
      expect(Array.isArray(c.expectedValues)).toBe(true)
      expect(c.expectedValues.length).toBeGreaterThan(0)
    })
  })

  test('every check has a surfaceValues object with all 4 surface keys', () => {
    checks.forEach((c) => {
      expect(allSurfaceKeysPresent(c.surfaceValues)).toBe(true)
    })
  })

  test('every check has a mismatches array', () => {
    checks.forEach((c) => {
      expect(Array.isArray(c.mismatches)).toBe(true)
    })
  })

  test('every check has an extraneousValues array', () => {
    checks.forEach((c) => {
      expect(Array.isArray(c.extraneousValues)).toBe(true)
    })
  })

  test('every check has an isConsistent boolean', () => {
    checks.forEach((c) => {
      expect(typeof c.isConsistent).toBe('boolean')
    })
  })

  test('isConsistent is true iff mismatches and extraneousValues are both empty', () => {
    checks.forEach((c) => {
      const expectedConsistent = c.mismatches.length === 0 && c.extraneousValues.length === 0
      expect(c.isConsistent).toBe(expectedConsistent)
    })
  })

  test('every check has createdFrom === CREATED_FROM constant', () => {
    checks.forEach((c) => {
      expect(c.createdFrom).toBe(CREATED_FROM)
    })
  })

  test('CREATED_FROM constant equals qa17_cross_surface_consistency', () => {
    expect(CREATED_FROM).toBe('qa17_cross_surface_consistency')
  })

  test('all checkIds are unique', () => {
    const ids = checks.map((c) => c.checkId)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  test('at least 4 of 6+ checks have isConsistent === true (healthy system)', () => {
    const passing = checks.filter((c) => c.isConsistent)
    expect(passing.length).toBeGreaterThanOrEqual(4)
  })

  test('at least 1 check has isConsistent === false (known drift)', () => {
    const failing = checks.filter((c) => !c.isConsistent)
    expect(failing.length).toBeGreaterThanOrEqual(1)
  })

  test('at least 1 check involves both programs and tower surfaces', () => {
    const programsAndTower = checks.filter(
      (c) => c.surfaces.includes('programs') && c.surfaces.includes('tower'),
    )
    expect(programsAndTower.length).toBeGreaterThanOrEqual(1)
  })

  test('mismatches in inconsistent checks are all strings', () => {
    checks
      .filter((c) => !c.isConsistent)
      .forEach((c) => {
        c.mismatches.forEach((m) => {
          expect(typeof m).toBe('string')
        })
      })
  })

  test('extraneousValues in inconsistent checks are all strings', () => {
    checks
      .filter((c) => !c.isConsistent)
      .forEach((c) => {
        c.extraneousValues.forEach((e) => {
          expect(typeof e).toBe('string')
        })
      })
  })

  test('CHK-PROG-IDS check exists and involves programs and tower', () => {
    const check = checks.find((c) => c.checkId === 'CHK-PROG-IDS')
    expect(check).toBeDefined()
    expect(check!.surfaces).toContain('programs')
    expect(check!.surfaces).toContain('tower')
  })

  test('CHK-TENANT-IDS check is consistent', () => {
    const check = checks.find((c) => c.checkId === 'CHK-TENANT-IDS')
    expect(check).toBeDefined()
    expect(check!.isConsistent).toBe(true)
  })

  test('CHK-ARCH-IDS check is not consistent (programs surface has drift)', () => {
    const check = checks.find((c) => c.checkId === 'CHK-ARCH-IDS')
    expect(check).toBeDefined()
    expect(check!.isConsistent).toBe(false)
  })

  test('CHK-ARCH-IDS mismatch set is non-empty', () => {
    const check = checks.find((c) => c.checkId === 'CHK-ARCH-IDS')
    expect(check!.mismatches.length).toBeGreaterThan(0)
  })

  test('CHK-MODULE-LABELS check is consistent', () => {
    const check = checks.find((c) => c.checkId === 'CHK-MODULE-LABELS')
    expect(check).toBeDefined()
    expect(check!.isConsistent).toBe(true)
  })

  test('CHK-NAV-ITEMS check is not consistent (admin has extraneous settings item)', () => {
    const check = checks.find((c) => c.checkId === 'CHK-NAV-ITEMS')
    expect(check).toBeDefined()
    expect(check!.isConsistent).toBe(false)
  })

  test('CHK-NAV-ITEMS extraneous values includes settings', () => {
    const check = checks.find((c) => c.checkId === 'CHK-NAV-ITEMS')
    expect(check!.extraneousValues).toContain('settings')
  })

  test('CHK-AGENT-NAMES check is consistent', () => {
    const check = checks.find((c) => c.checkId === 'CHK-AGENT-NAMES')
    expect(check).toBeDefined()
    expect(check!.isConsistent).toBe(true)
  })

  test('surfaceValues has exactly the 4 canonical surface keys on CHK-AGENT-NAMES', () => {
    const check = checks.find((c) => c.checkId === 'CHK-AGENT-NAMES')!
    const keys = Object.keys(check.surfaceValues).sort()
    expect(keys).toEqual(['admin', 'intelligence', 'programs', 'tower'])
  })
})

// ---------------------------------------------------------------------------
// buildCrossSurfaceConsistencyReport()
// ---------------------------------------------------------------------------

describe('buildCrossSurfaceConsistencyReport()', () => {
  let report: CrossSurfaceConsistencyReport

  beforeAll(() => {
    report = buildCrossSurfaceConsistencyReport()
  })

  test('returns an object', () => {
    expect(typeof report).toBe('object')
    expect(report).not.toBeNull()
  })

  test('passedChecks + failedChecks === checks.length', () => {
    expect(report.passedChecks + report.failedChecks).toBe(report.checks.length)
  })

  test('passedChecks equals count of isConsistent === true checks', () => {
    const expected = report.checks.filter((c) => c.isConsistent).length
    expect(report.passedChecks).toBe(expected)
  })

  test('failedChecks equals count of isConsistent === false checks', () => {
    const expected = report.checks.filter((c) => !c.isConsistent).length
    expect(report.failedChecks).toBe(expected)
  })

  test('overallConsistencyPercent is a number', () => {
    expect(typeof report.overallConsistencyPercent).toBe('number')
  })

  test('overallConsistencyPercent is in [0, 100]', () => {
    expect(report.overallConsistencyPercent).toBeGreaterThanOrEqual(0)
    expect(report.overallConsistencyPercent).toBeLessThanOrEqual(100)
  })

  test('overallConsistencyPercent === (passedChecks / checks.length) * 100', () => {
    const expected = (report.passedChecks / report.checks.length) * 100
    expect(report.overallConsistencyPercent).toBeCloseTo(expected, 10)
  })

  test('criticalMismatches contains only isConsistent === false checks', () => {
    report.criticalMismatches.forEach((c) => {
      expect(c.isConsistent).toBe(false)
    })
  })

  test('criticalMismatches length equals failedChecks', () => {
    expect(report.criticalMismatches.length).toBe(report.failedChecks)
  })

  test('createdFrom === qa17_cross_surface_consistency', () => {
    expect(report.createdFrom).toBe('qa17_cross_surface_consistency')
  })

  test('generatedAt is a non-empty string', () => {
    expect(typeof report.generatedAt).toBe('string')
    expect(report.generatedAt.length).toBeGreaterThan(0)
  })

  test('generatedAt is a valid ISO date string', () => {
    const parsed = new Date(report.generatedAt)
    expect(isNaN(parsed.getTime())).toBe(false)
    // ISO strings round-trip through Date
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  test('checks contains at least 6 entries', () => {
    expect(report.checks.length).toBeGreaterThanOrEqual(6)
  })

  test('all checks in report have createdFrom === CREATED_FROM', () => {
    report.checks.forEach((c) => {
      expect(c.createdFrom).toBe(CREATED_FROM)
    })
  })

  test('passedChecks is at least 4 (healthy system invariant)', () => {
    expect(report.passedChecks).toBeGreaterThanOrEqual(4)
  })

  test('overallConsistencyPercent > 50 (majority of checks pass)', () => {
    expect(report.overallConsistencyPercent).toBeGreaterThan(50)
  })
})

// ---------------------------------------------------------------------------
// ALL_SURFACES export
// ---------------------------------------------------------------------------

describe('ALL_SURFACES constant', () => {
  test('contains exactly 4 surfaces', () => {
    expect(ALL_SURFACES.length).toBe(4)
  })

  test('contains programs, tower, intelligence, admin', () => {
    expect(ALL_SURFACES).toContain('programs')
    expect(ALL_SURFACES).toContain('tower')
    expect(ALL_SURFACES).toContain('intelligence')
    expect(ALL_SURFACES).toContain('admin')
  })
})

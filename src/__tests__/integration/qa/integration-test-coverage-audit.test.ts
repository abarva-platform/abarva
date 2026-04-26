import {
  buildCoverageCategories,
  buildSurfaceCoverageRow,
  buildIntegrationTestCoverageReport,
  type TestSurface,
} from '../../../lib/qa/integration-test-coverage-audit'

const CANONICAL_SURFACES: TestSurface[] = [
  'programs',
  'tower',
  'intelligence',
  'admin',
  'solutions',
  'ops',
  'qa',
]

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

describe('buildCoverageCategories()', () => {
  const categories = buildCoverageCategories()

  it('returns at least 20 categories', () => {
    expect(categories.length).toBeGreaterThanOrEqual(20)
  })

  it('every category has a non-empty id', () => {
    categories.forEach((c) => {
      expect(c.id.trim().length).toBeGreaterThan(0)
    })
  })

  it('every category has a non-empty label', () => {
    categories.forEach((c) => {
      expect(c.label.trim().length).toBeGreaterThan(0)
    })
  })

  it('every category has a non-empty testFilePattern', () => {
    categories.forEach((c) => {
      expect(c.testFilePattern.trim().length).toBeGreaterThan(0)
    })
  })

  it('every surface value is one of the 7 canonical surfaces', () => {
    categories.forEach((c) => {
      expect(CANONICAL_SURFACES).toContain(c.surface)
    })
  })

  it('every sliceIds is an array', () => {
    categories.forEach((c) => {
      expect(Array.isArray(c.sliceIds)).toBe(true)
    })
  })

  it('every estimatedTestCount is a non-negative number', () => {
    categories.forEach((c) => {
      expect(c.estimatedTestCount).toBeGreaterThanOrEqual(0)
    })
  })

  it('isPresent is a boolean for every category', () => {
    categories.forEach((c) => {
      expect(typeof c.isPresent).toBe('boolean')
    })
  })

  it('all 7 canonical surfaces are represented', () => {
    const presentSurfaces = new Set(categories.map((c) => c.surface))
    CANONICAL_SURFACES.forEach((s) => {
      expect(presentSurfaces.has(s)).toBe(true)
    })
  })

  it('category ids are unique', () => {
    const ids = categories.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('buildSurfaceCoverageRow()', () => {
  const categories = buildCoverageCategories()

  it('returns correct coveredCount for programs', () => {
    const row = buildSurfaceCoverageRow('programs', categories)
    const expected = categories.filter((c) => c.surface === 'programs' && c.isPresent).length
    expect(row.coveredCount).toBe(expected)
  })

  it('returns correct totalCount for programs', () => {
    const row = buildSurfaceCoverageRow('programs', categories)
    const expected = categories.filter((c) => c.surface === 'programs').length
    expect(row.totalCount).toBe(expected)
  })

  it('coveragePercent is in [0, 100]', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      expect(row.coveragePercent).toBeGreaterThanOrEqual(0)
      expect(row.coveragePercent).toBeLessThanOrEqual(100)
    })
  })

  it('status is one of the three valid values', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      expect(['well_covered', 'partial', 'sparse']).toContain(row.status)
    })
  })

  it('well_covered status requires coveragePercent >= 80', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      if (row.status === 'well_covered') {
        expect(row.coveragePercent).toBeGreaterThanOrEqual(80)
      }
    })
  })

  it('partial status requires coveragePercent in [50, 80)', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      if (row.status === 'partial') {
        expect(row.coveragePercent).toBeGreaterThanOrEqual(50)
        expect(row.coveragePercent).toBeLessThan(80)
      }
    })
  })

  it('sparse status requires coveragePercent < 50', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      if (row.status === 'sparse') {
        expect(row.coveragePercent).toBeLessThan(50)
      }
    })
  })

  it('surface field matches the requested surface', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      expect(row.surface).toBe(s)
    })
  })

  it('categories array only contains entries for the given surface', () => {
    CANONICAL_SURFACES.forEach((s) => {
      const row = buildSurfaceCoverageRow(s, categories)
      row.categories.forEach((c) => {
        expect(c.surface).toBe(s)
      })
    })
  })
})

describe('buildIntegrationTestCoverageReport()', () => {
  const report = buildIntegrationTestCoverageReport()
  const categories = buildCoverageCategories()

  it('totalCategories equals buildCoverageCategories().length', () => {
    expect(report.totalCategories).toBe(categories.length)
  })

  it('overallCoveragePercent is in [0, 100]', () => {
    expect(report.overallCoveragePercent).toBeGreaterThanOrEqual(0)
    expect(report.overallCoveragePercent).toBeLessThanOrEqual(100)
  })

  it('coveredCategories is <= totalCategories', () => {
    expect(report.coveredCategories).toBeLessThanOrEqual(report.totalCategories)
  })

  it('coveredCategories is >= 0', () => {
    expect(report.coveredCategories).toBeGreaterThanOrEqual(0)
  })

  it('surfaces.length === 7', () => {
    expect(report.surfaces.length).toBe(7)
  })

  it('each surface coveragePercent is in [0, 100]', () => {
    report.surfaces.forEach((s) => {
      expect(s.coveragePercent).toBeGreaterThanOrEqual(0)
      expect(s.coveragePercent).toBeLessThanOrEqual(100)
    })
  })

  it('each surface status is valid', () => {
    report.surfaces.forEach((s) => {
      expect(['well_covered', 'partial', 'sparse']).toContain(s.status)
    })
  })

  it('topCoveredSurface has the highest coveragePercent', () => {
    const max = Math.max(...report.surfaces.map((s) => s.coveragePercent))
    const topRow = report.surfaces.find((s) => s.surface === report.topCoveredSurface)
    expect(topRow?.coveragePercent).toBe(max)
  })

  it('leastCoveredSurface has the lowest coveragePercent', () => {
    const min = Math.min(...report.surfaces.map((s) => s.coveragePercent))
    const leastRow = report.surfaces.find((s) => s.surface === report.leastCoveredSurface)
    expect(leastRow?.coveragePercent).toBe(min)
  })

  it('uncoveredCategories are exactly categories with isPresent === false', () => {
    const expectedUncovered = categories.filter((c) => !c.isPresent).map((c) => c.id).sort()
    const actualUncovered = report.uncoveredCategories.map((c) => c.id).sort()
    expect(actualUncovered).toEqual(expectedUncovered)
  })

  it('uncoveredCategories all have isPresent === false', () => {
    report.uncoveredCategories.forEach((c) => {
      expect(c.isPresent).toBe(false)
    })
  })

  it('createdFrom === qa15_integration_test_coverage_audit', () => {
    expect(report.createdFrom).toBe('qa15_integration_test_coverage_audit')
  })

  it('generatedAt matches ISO date format', () => {
    expect(report.generatedAt).toMatch(ISO_DATE_RE)
  })

  it('all 7 canonical surfaces appear in surfaces array', () => {
    const surfaceNames = report.surfaces.map((s) => s.surface)
    CANONICAL_SURFACES.forEach((s) => {
      expect(surfaceNames).toContain(s)
    })
  })

  it('sum of surface totalCounts equals totalCategories', () => {
    const sum = report.surfaces.reduce((acc, s) => acc + s.totalCount, 0)
    expect(sum).toBe(report.totalCategories)
  })

  it('sum of surface coveredCounts equals coveredCategories', () => {
    const sum = report.surfaces.reduce((acc, s) => acc + s.coveredCount, 0)
    expect(sum).toBe(report.coveredCategories)
  })

  it('topCoveredSurface is one of the canonical surfaces', () => {
    expect(CANONICAL_SURFACES).toContain(report.topCoveredSurface)
  })

  it('leastCoveredSurface is one of the canonical surfaces', () => {
    expect(CANONICAL_SURFACES).toContain(report.leastCoveredSurface)
  })
})

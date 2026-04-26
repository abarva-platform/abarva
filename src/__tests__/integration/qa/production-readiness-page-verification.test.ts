import {
  buildProductionReadinessPageVerificationReport,
  type PageVerificationStatus,
  type PageVerificationRecord,
  type ReadinessManifestVerification,
  type ProductionReadinessPageVerificationReport,
} from '@/lib/qa/production-readiness-page-verification'

// ---------------------------------------------------------------------------
// Shared report (built once for all tests)
// ---------------------------------------------------------------------------

let report: ProductionReadinessPageVerificationReport

beforeAll(() => {
  report = buildProductionReadinessPageVerificationReport()
})

// ---------------------------------------------------------------------------
// Top-level shape
// ---------------------------------------------------------------------------

describe('buildProductionReadinessPageVerificationReport — shape', () => {
  it('returns a valid report object', () => {
    expect(report).toBeDefined()
    expect(typeof report).toBe('object')
  })

  it('schemaVersion is 1', () => {
    expect(report.schemaVersion).toBe(1)
  })

  it("generatedAt is '2026-04-26'", () => {
    expect(report.generatedAt).toBe('2026-04-26')
  })

  it('pages array is non-empty', () => {
    expect(Array.isArray(report.pages)).toBe(true)
    expect(report.pages.length).toBeGreaterThan(0)
  })

  it('verificationCaveats has at least 2 entries', () => {
    expect(Array.isArray(report.verificationCaveats)).toBe(true)
    expect(report.verificationCaveats.length).toBeGreaterThanOrEqual(2)
  })

  it('allCriticalPagesPresent is a boolean', () => {
    expect(typeof report.allCriticalPagesPresent).toBe('boolean')
  })
})

// ---------------------------------------------------------------------------
// Manifest verification
// ---------------------------------------------------------------------------

describe('manifestVerification', () => {
  let mv: ReadinessManifestVerification

  beforeAll(() => {
    mv = report.manifestVerification
  })

  it('parsesCleanly is true', () => {
    expect(mv.parsesCleanly).toBe(true)
  })

  it('hasNoFalseProductionReady is true', () => {
    expect(mv.hasNoFalseProductionReady).toBe(true)
  })

  it('componentCount is greater than 0', () => {
    expect(mv.componentCount).toBeGreaterThan(0)
  })

  it('staticManifestNote is a non-empty string', () => {
    expect(typeof mv.staticManifestNote).toBe('string')
    expect(mv.staticManifestNote.trim().length).toBeGreaterThan(0)
  })

  it('liveStatusCaveatExplicit is true', () => {
    expect(mv.liveStatusCaveatExplicit).toBe(true)
  })

  it('manifestPath is a non-empty string', () => {
    expect(typeof mv.manifestPath).toBe('string')
    expect(mv.manifestPath.trim().length).toBeGreaterThan(0)
  })

  it('componentsWithNotes is >= 0', () => {
    expect(mv.componentsWithNotes).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// Page records integrity
// ---------------------------------------------------------------------------

const VALID_STATUSES: PageVerificationStatus[] = ['present', 'missing', 'deferred', 'not_checked']

describe('page records', () => {
  it('every page has a non-empty routeId', () => {
    for (const page of report.pages) {
      expect(typeof page.routeId).toBe('string')
      expect(page.routeId.trim().length).toBeGreaterThan(0)
    }
  })

  it('every page has a non-empty route', () => {
    for (const page of report.pages) {
      expect(typeof page.route).toBe('string')
      expect(page.route.trim().length).toBeGreaterThan(0)
    }
  })

  it('every page has a non-empty description', () => {
    for (const page of report.pages) {
      expect(typeof page.description).toBe('string')
      expect(page.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('every page has a non-empty filePath', () => {
    for (const page of report.pages) {
      expect(typeof page.filePath).toBe('string')
      expect(page.filePath.trim().length).toBeGreaterThan(0)
    }
  })

  it('every page has a non-empty caveat', () => {
    for (const page of report.pages) {
      expect(typeof page.caveat).toBe('string')
      expect(page.caveat.trim().length).toBeGreaterThan(0)
    }
  })

  it('every status is a valid PageVerificationStatus value', () => {
    for (const page of report.pages) {
      expect(VALID_STATUSES).toContain(page.status)
    }
  })

  it('no duplicate routeId values', () => {
    const ids = report.pages.map((p: PageVerificationRecord) => p.routeId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('at least one page record has status present', () => {
    const presentPages = report.pages.filter(
      (p: PageVerificationRecord) => p.status === 'present',
    )
    expect(presentPages.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// allCriticalPagesPresent logic
// ---------------------------------------------------------------------------

describe('allCriticalPagesPresent', () => {
  it('is true only when admin page and API route are both present', () => {
    const adminPage = report.pages.find(
      (p: PageVerificationRecord) => p.routeId === 'admin-production-readiness-page',
    )
    const apiRoute = report.pages.find(
      (p: PageVerificationRecord) => p.routeId === 'api-admin-production-readiness',
    )
    if (adminPage && apiRoute) {
      const expected =
        adminPage.status === 'present' && apiRoute.status === 'present'
      expect(report.allCriticalPagesPresent).toBe(expected)
    }
  })
})

// ---------------------------------------------------------------------------
// verificationCaveats content
// ---------------------------------------------------------------------------

describe('verificationCaveats content', () => {
  it('includes a caveat about live CI/Vercel status', () => {
    const match = report.verificationCaveats.some((c: string) =>
      c.toLowerCase().includes('live') || c.toLowerCase().includes('vercel'),
    )
    expect(match).toBe(true)
  })

  it('includes a caveat about the static manifest state', () => {
    const match = report.verificationCaveats.some((c: string) =>
      c.toLowerCase().includes('manifest') || c.toLowerCase().includes('static'),
    )
    expect(match).toBe(true)
  })
})

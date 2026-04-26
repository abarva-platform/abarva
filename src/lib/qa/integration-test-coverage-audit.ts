// QA15 · Integration Test Coverage Audit
// Static-manifest-based coverage report across 7 surfaces.
// No file system reads, no model calls, no DB writes, no 'use client'.
// createdFrom: 'qa15_integration_test_coverage_audit'

type TestSurface = 'programs' | 'tower' | 'intelligence' | 'admin' | 'solutions' | 'ops' | 'qa'

interface CoverageCategory {
  id: string
  surface: TestSurface
  label: string
  testFilePattern: string
  sliceIds: string[]
  isPresent: boolean
  estimatedTestCount: number
}

interface SurfaceCoverageRow {
  surface: TestSurface
  categories: CoverageCategory[]
  coveredCount: number
  totalCount: number
  coveragePercent: number
  status: 'well_covered' | 'partial' | 'sparse'
}

interface IntegrationTestCoverageReport {
  surfaces: SurfaceCoverageRow[]
  totalCategories: number
  coveredCategories: number
  overallCoveragePercent: number
  uncoveredCategories: CoverageCategory[]
  topCoveredSurface: TestSurface
  leastCoveredSurface: TestSurface
  generatedAt: string
  createdFrom: 'qa15_integration_test_coverage_audit'
}

function buildCoverageCategories(): CoverageCategory[] {
  return [
    // programs — well covered
    {
      id: 'programs-list-view',
      surface: 'programs',
      label: 'Programs List View',
      testFilePattern: 'src/__tests__/integration/programs/',
      sliceIds: ['PW1', 'PW2'],
      isPresent: true,
      estimatedTestCount: 18,
    },
    {
      id: 'programs-detail-view',
      surface: 'programs',
      label: 'Programs Detail View',
      testFilePattern: 'src/__tests__/integration/programs/',
      sliceIds: ['PW3', 'PW4'],
      isPresent: true,
      estimatedTestCount: 22,
    },
    {
      id: 'programs-deliverables',
      surface: 'programs',
      label: 'Programs Deliverables',
      testFilePattern: 'src/__tests__/integration/programs/',
      sliceIds: ['PDEL5', 'PDEL6'],
      isPresent: true,
      estimatedTestCount: 15,
    },
    {
      id: 'programs-phase-gates',
      surface: 'programs',
      label: 'Programs Phase Gates',
      testFilePattern: 'src/__tests__/integration/programs/',
      sliceIds: ['PW5', 'PW6'],
      isPresent: true,
      estimatedTestCount: 12,
    },
    // tower — well covered
    {
      id: 'tower-vendor-portfolio',
      surface: 'tower',
      label: 'Tower Vendor Portfolio',
      testFilePattern: 'src/__tests__/integration/tower/',
      sliceIds: ['TW1', 'TW2'],
      isPresent: true,
      estimatedTestCount: 20,
    },
    {
      id: 'tower-pressure-cards',
      surface: 'tower',
      label: 'Tower Pressure Cards',
      testFilePattern: 'src/__tests__/integration/tower/',
      sliceIds: ['TW3', 'FM10'],
      isPresent: true,
      estimatedTestCount: 16,
    },
    {
      id: 'tower-atlas-proactive',
      surface: 'tower',
      label: 'Tower Atlas Proactive Surfacing',
      testFilePattern: 'src/__tests__/integration/tower/',
      sliceIds: ['FM10'],
      isPresent: true,
      estimatedTestCount: 14,
    },
    // intelligence — well covered
    {
      id: 'intelligence-sentinel-rail',
      surface: 'intelligence',
      label: 'Intelligence Sentinel Pattern Rail',
      testFilePattern: 'src/__tests__/integration/intelligence/',
      sliceIds: ['I7', 'I8'],
      isPresent: true,
      estimatedTestCount: 24,
    },
    {
      id: 'intelligence-sentinel-interaction',
      surface: 'intelligence',
      label: 'Intelligence Sentinel Interaction Rail',
      testFilePattern: 'src/__tests__/integration/intelligence/',
      sliceIds: ['I8'],
      isPresent: true,
      estimatedTestCount: 18,
    },
    {
      id: 'intelligence-executive-views',
      surface: 'intelligence',
      label: 'Intelligence Executive Views',
      testFilePattern: 'src/__tests__/integration/intelligence/',
      sliceIds: ['I3', 'I4'],
      isPresent: true,
      estimatedTestCount: 20,
    },
    // admin — well covered
    {
      id: 'admin-tenant-management',
      surface: 'admin',
      label: 'Admin Tenant Management',
      testFilePattern: 'src/__tests__/integration/admin/',
      sliceIds: ['ADM1', 'ADM2'],
      isPresent: true,
      estimatedTestCount: 19,
    },
    {
      id: 'admin-production-readiness',
      surface: 'admin',
      label: 'Admin Production Readiness',
      testFilePattern: 'src/__tests__/integration/admin/',
      sliceIds: ['PROD2', 'PROD3'],
      isPresent: true,
      estimatedTestCount: 17,
    },
    {
      id: 'admin-user-roles',
      surface: 'admin',
      label: 'Admin User Roles',
      testFilePattern: 'src/__tests__/integration/admin/',
      sliceIds: ['ADM3'],
      isPresent: true,
      estimatedTestCount: 11,
    },
    // solutions — well covered
    {
      id: 'solutions-pack-list',
      surface: 'solutions',
      label: 'Solutions Pack List',
      testFilePattern: 'src/__tests__/integration/solutions/',
      sliceIds: ['SOL1', 'SOL2'],
      isPresent: true,
      estimatedTestCount: 16,
    },
    {
      id: 'solutions-pack-detail',
      surface: 'solutions',
      label: 'Solutions Pack Detail',
      testFilePattern: 'src/__tests__/integration/solutions/',
      sliceIds: ['SOL3'],
      isPresent: true,
      estimatedTestCount: 13,
    },
    {
      id: 'solutions-roi-calculator',
      surface: 'solutions',
      label: 'Solutions ROI Calculator',
      testFilePattern: 'src/__tests__/integration/solutions/',
      sliceIds: ['SOL4'],
      isPresent: false,
      estimatedTestCount: 0,
    },
    // ops — partial
    {
      id: 'ops-dispatch-queue',
      surface: 'ops',
      label: 'Ops Agent Dispatch Queue',
      testFilePattern: 'src/__tests__/integration/ops/',
      sliceIds: ['OPS1'],
      isPresent: true,
      estimatedTestCount: 10,
    },
    {
      id: 'ops-ci-gates',
      surface: 'ops',
      label: 'Ops CI Gates Automation',
      testFilePattern: 'src/__tests__/integration/ops/',
      sliceIds: ['OPS2'],
      isPresent: false,
      estimatedTestCount: 0,
    },
    // qa — partial
    {
      id: 'qa-route-smoke',
      surface: 'qa',
      label: 'QA Route Smoke Inventory',
      testFilePattern: 'src/__tests__/integration/qa/',
      sliceIds: ['QA5'],
      isPresent: true,
      estimatedTestCount: 21,
    },
    {
      id: 'qa-secret-hygiene',
      surface: 'qa',
      label: 'QA Secret Hygiene Patterns',
      testFilePattern: 'src/__tests__/integration/qa/',
      sliceIds: ['QA8'],
      isPresent: true,
      estimatedTestCount: 15,
    },
    {
      id: 'qa-persona-crawler',
      surface: 'qa',
      label: 'QA Persona Crawler Automation',
      testFilePattern: 'src/__tests__/integration/qa/',
      sliceIds: ['QA10'],
      isPresent: false,
      estimatedTestCount: 0,
    },
    {
      id: 'qa-coverage-audit',
      surface: 'qa',
      label: 'QA Integration Test Coverage Audit',
      testFilePattern: 'src/__tests__/integration/qa/',
      sliceIds: ['QA15'],
      isPresent: true,
      estimatedTestCount: 28,
    },
  ]
}

function deriveStatus(coveragePercent: number): 'well_covered' | 'partial' | 'sparse' {
  if (coveragePercent >= 80) return 'well_covered'
  if (coveragePercent >= 50) return 'partial'
  return 'sparse'
}

function buildSurfaceCoverageRow(
  surface: TestSurface,
  categories: CoverageCategory[],
): SurfaceCoverageRow {
  const surfaceCategories = categories.filter((c) => c.surface === surface)
  const coveredCount = surfaceCategories.filter((c) => c.isPresent).length
  const totalCount = surfaceCategories.length
  const coveragePercent = totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100)
  return {
    surface,
    categories: surfaceCategories,
    coveredCount,
    totalCount,
    coveragePercent,
    status: deriveStatus(coveragePercent),
  }
}

function buildIntegrationTestCoverageReport(): IntegrationTestCoverageReport {
  const allCategories = buildCoverageCategories()
  const surfaces: TestSurface[] = [
    'programs',
    'tower',
    'intelligence',
    'admin',
    'solutions',
    'ops',
    'qa',
  ]
  const surfaceRows = surfaces.map((s) => buildSurfaceCoverageRow(s, allCategories))

  const totalCategories = allCategories.length
  const coveredCategories = allCategories.filter((c) => c.isPresent).length
  const overallCoveragePercent =
    totalCategories === 0 ? 0 : Math.round((coveredCategories / totalCategories) * 100)

  const uncoveredCategories = allCategories.filter((c) => !c.isPresent)

  const topRow = surfaceRows.reduce((best, row) =>
    row.coveragePercent > best.coveragePercent ? row : best,
  )
  const leastRow = surfaceRows.reduce((worst, row) =>
    row.coveragePercent < worst.coveragePercent ? row : worst,
  )

  return {
    surfaces: surfaceRows,
    totalCategories,
    coveredCategories,
    overallCoveragePercent,
    uncoveredCategories,
    topCoveredSurface: topRow.surface,
    leastCoveredSurface: leastRow.surface,
    generatedAt: new Date().toISOString(),
    createdFrom: 'qa15_integration_test_coverage_audit',
  }
}

export type { TestSurface, CoverageCategory, SurfaceCoverageRow, IntegrationTestCoverageReport }
export { buildCoverageCategories, buildSurfaceCoverageRow, buildIntegrationTestCoverageReport }

import {
  buildPatternCoverageRow,
  buildPatternCoverageSummary,
  PatternCoverageRow,
} from '@/lib/solutions/pattern-coverage-summary'
import { SOLUTION_ARCHETYPE_KEYS } from '@/lib/solutions/solution-archetype-registry'

const KNOWN_ARCHETYPE_IDS = [...SOLUTION_ARCHETYPE_KEYS]

describe('buildPatternCoverageRow', () => {
  it('returns a row for every known archetype without throwing', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      expect(() => buildPatternCoverageRow(id)).not.toThrow()
    }
  })

  it('throws for an unknown archetypeId', () => {
    expect(() => buildPatternCoverageRow('unknown_archetype_xyz')).toThrow()
  })

  it('sets createdFrom to sol16_pattern_coverage_summary on each row', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(row.createdFrom).toBe('sol16_pattern_coverage_summary')
    }
  })

  it('workshopCoverage is in [0, 1] for every archetype', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(row.workshopCoverage).toBeGreaterThanOrEqual(0)
      expect(row.workshopCoverage).toBeLessThanOrEqual(1)
    }
  })

  it('deliverableCoverage is in [0, 1] for every archetype', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(row.deliverableCoverage).toBeGreaterThanOrEqual(0)
      expect(row.deliverableCoverage).toBeLessThanOrEqual(1)
    }
  })

  it('overallScore equals (workshopCoverage + deliverableCoverage) / 2 for every archetype', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      const expected = (row.workshopCoverage + row.deliverableCoverage) / 2
      expect(row.overallScore).toBeCloseTo(expected, 10)
    }
  })

  it('archetypeId on the row matches the input id', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(row.archetypeId).toBe(id)
    }
  })

  it('archetypeLabel is a non-empty string', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(typeof row.archetypeLabel).toBe('string')
      expect(row.archetypeLabel.length).toBeGreaterThan(0)
    }
  })

  it('hasRiskFlags is a boolean for every archetype', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(typeof row.hasRiskFlags).toBe('boolean')
    }
  })

  it('overallScore is in [0, 1] for every archetype', () => {
    for (const id of KNOWN_ARCHETYPE_IDS) {
      const row = buildPatternCoverageRow(id)
      expect(row.overallScore).toBeGreaterThanOrEqual(0)
      expect(row.overallScore).toBeLessThanOrEqual(1)
    }
  })

  it('spot-check: ai_led_pdlc_transformation workshopCoverage = 5/7', () => {
    const row = buildPatternCoverageRow('ai_led_pdlc_transformation')
    expect(row.workshopCoverage).toBeCloseTo(5 / 7, 10)
  })

  it('spot-check: build_buy_partner_evaluation workshopCoverage = 2/7 (minimum)', () => {
    const row = buildPatternCoverageRow('build_buy_partner_evaluation')
    expect(row.workshopCoverage).toBeCloseTo(2 / 7, 10)
  })

  it('spot-check: prior_authorization_utilization_management deliverableCoverage = 2/5', () => {
    const row = buildPatternCoverageRow('prior_authorization_utilization_management')
    expect(row.deliverableCoverage).toBeCloseTo(2 / 5, 10)
  })

  it('spot-check: service_operations_agentic_automation overallScore is max possible', () => {
    const row = buildPatternCoverageRow('service_operations_agentic_automation')
    // 5 workshops / 7, 4 deliverables / 5
    const expected = (5 / 7 + 4 / 5) / 2
    expect(row.overallScore).toBeCloseTo(expected, 10)
  })
})

describe('buildPatternCoverageSummary', () => {
  let summary: ReturnType<typeof buildPatternCoverageSummary>

  beforeAll(() => {
    summary = buildPatternCoverageSummary()
  })

  it('returns totalArchetypes > 0', () => {
    expect(summary.totalArchetypes).toBeGreaterThan(0)
  })

  it('totalArchetypes equals SOLUTION_ARCHETYPE_KEYS length', () => {
    expect(summary.totalArchetypes).toBe(KNOWN_ARCHETYPE_IDS.length)
  })

  it('rows array length equals totalArchetypes', () => {
    expect(summary.rows.length).toBe(summary.totalArchetypes)
  })

  it('rows are sorted descending by overallScore', () => {
    for (let i = 0; i < summary.rows.length - 1; i++) {
      expect(summary.rows[i].overallScore).toBeGreaterThanOrEqual(summary.rows[i + 1].overallScore)
    }
  })

  it('all row archetypeIds are unique', () => {
    const ids = summary.rows.map((r) => r.archetypeId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('createdFrom is sol16_pattern_coverage_summary on summary object', () => {
    expect(summary.createdFrom).toBe('sol16_pattern_coverage_summary')
  })

  it('every row in summary has createdFrom sol16_pattern_coverage_summary', () => {
    for (const row of summary.rows) {
      expect(row.createdFrom).toBe('sol16_pattern_coverage_summary')
    }
  })

  it('averageOverallScore is in [0, 1]', () => {
    expect(summary.averageOverallScore).toBeGreaterThanOrEqual(0)
    expect(summary.averageOverallScore).toBeLessThanOrEqual(1)
  })

  it('averageOverallScore equals mean of all row overallScores', () => {
    const mean = summary.rows.reduce((s, r) => s + r.overallScore, 0) / summary.rows.length
    expect(summary.averageOverallScore).toBeCloseTo(mean, 10)
  })

  it('topCoveredArchetype is the archetypeId of the row with maximum overallScore', () => {
    const maxScore = Math.max(...summary.rows.map((r) => r.overallScore))
    const topRow = summary.rows.find((r) => r.archetypeId === summary.topCoveredArchetype)!
    expect(topRow).toBeDefined()
    expect(topRow.overallScore).toBeCloseTo(maxScore, 10)
  })

  it('leastCoveredArchetype is the archetypeId of the row with minimum overallScore', () => {
    const minScore = Math.min(...summary.rows.map((r) => r.overallScore))
    const leastRow = summary.rows.find((r) => r.archetypeId === summary.leastCoveredArchetype)!
    expect(leastRow).toBeDefined()
    expect(leastRow.overallScore).toBeCloseTo(minScore, 10)
  })

  it('topCoveredArchetype is rows[0].archetypeId (highest score first)', () => {
    expect(summary.topCoveredArchetype).toBe(summary.rows[0].archetypeId)
  })

  it('leastCoveredArchetype is rows[last].archetypeId (lowest score last)', () => {
    expect(summary.leastCoveredArchetype).toBe(summary.rows[summary.rows.length - 1].archetypeId)
  })

  it('all known archetype IDs appear in summary rows', () => {
    const summaryIds = new Set(summary.rows.map((r) => r.archetypeId))
    for (const id of KNOWN_ARCHETYPE_IDS) {
      expect(summaryIds.has(id)).toBe(true)
    }
  })

  it('every row has workshopCoverage in [0, 1]', () => {
    for (const row of summary.rows) {
      expect(row.workshopCoverage).toBeGreaterThanOrEqual(0)
      expect(row.workshopCoverage).toBeLessThanOrEqual(1)
    }
  })

  it('every row has deliverableCoverage in [0, 1]', () => {
    for (const row of summary.rows) {
      expect(row.deliverableCoverage).toBeGreaterThanOrEqual(0)
      expect(row.deliverableCoverage).toBeLessThanOrEqual(1)
    }
  })

  it('every row overallScore equals (workshopCoverage + deliverableCoverage) / 2', () => {
    for (const row of summary.rows) {
      const expected = (row.workshopCoverage + row.deliverableCoverage) / 2
      expect(row.overallScore).toBeCloseTo(expected, 10)
    }
  })

  it('summary is deterministic — two calls return same averageOverallScore', () => {
    const second = buildPatternCoverageSummary()
    expect(second.averageOverallScore).toBeCloseTo(summary.averageOverallScore, 10)
  })

  it('summary is deterministic — two calls return same topCoveredArchetype', () => {
    const second = buildPatternCoverageSummary()
    expect(second.topCoveredArchetype).toBe(summary.topCoveredArchetype)
  })

  it('summary is deterministic — two calls return same leastCoveredArchetype', () => {
    const second = buildPatternCoverageSummary()
    expect(second.leastCoveredArchetype).toBe(summary.leastCoveredArchetype)
  })
})

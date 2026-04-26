import {
  evaluateComponentForPromotion,
  buildPromotionGateReport,
  getDefaultComponentAssessments,
  ComponentStatus,
  PromotionCriteria,
} from '../../../lib/qa/production-readiness-promotion-gate'

const allTrue: PromotionCriteria = {
  hasGreenTests: true,
  hasNoBlockers: true,
  hasHonestDisclaimers: true,
  hasNoFakeLiveStatus: true,
  hasSliceDoc: true,
}

const allFalse: PromotionCriteria = {
  hasGreenTests: false,
  hasNoBlockers: false,
  hasHonestDisclaimers: false,
  hasNoFakeLiveStatus: false,
  hasSliceDoc: false,
}

// ---------------------------------------------------------------------------
// evaluateComponentForPromotion — all criteria true
// ---------------------------------------------------------------------------

describe('evaluateComponentForPromotion — all criteria true', () => {
  const statuses: ComponentStatus[] = ['planned', 'in_progress', 'partial']

  statuses.forEach((status) => {
    it(`qualifiesForPromotion === true when status is ${status}`, () => {
      const result = evaluateComponentForPromotion('comp-a', status, allTrue)
      expect(result.qualifiesForPromotion).toBe(true)
    })

    it(`recommendedAction === 'promote' when status is ${status}`, () => {
      const result = evaluateComponentForPromotion('comp-a', status, allTrue)
      expect(result.recommendedAction).toBe('promote')
    })

    it(`blockingReasons is empty when status is ${status}`, () => {
      const result = evaluateComponentForPromotion('comp-a', status, allTrue)
      expect(result.blockingReasons).toHaveLength(0)
    })
  })
})

// ---------------------------------------------------------------------------
// evaluateComponentForPromotion — any criterion false
// ---------------------------------------------------------------------------

describe('evaluateComponentForPromotion — failing criteria', () => {
  const criteriaKeys = Object.keys(allTrue) as (keyof PromotionCriteria)[]

  criteriaKeys.forEach((key) => {
    it(`qualifiesForPromotion === false when ${key} is false`, () => {
      const criteria = { ...allTrue, [key]: false }
      const result = evaluateComponentForPromotion('comp-b', 'in_progress', criteria)
      expect(result.qualifiesForPromotion).toBe(false)
    })

    it(`blockingReasons.length > 0 when ${key} is false`, () => {
      const criteria = { ...allTrue, [key]: false }
      const result = evaluateComponentForPromotion('comp-b', 'in_progress', criteria)
      expect(result.blockingReasons.length).toBeGreaterThan(0)
    })
  })

  it('all criteria false → blockingReasons has 5 entries', () => {
    const result = evaluateComponentForPromotion('comp-c', 'planned', allFalse)
    expect(result.blockingReasons).toHaveLength(5)
  })

  it('all criteria false → recommendedAction === fix_blockers', () => {
    const result = evaluateComponentForPromotion('comp-c', 'planned', allFalse)
    expect(result.recommendedAction).toBe('fix_blockers')
  })
})

// ---------------------------------------------------------------------------
// evaluateComponentForPromotion — already production_ready
// ---------------------------------------------------------------------------

describe('evaluateComponentForPromotion — production_ready status', () => {
  it('qualifiesForPromotion === false', () => {
    const result = evaluateComponentForPromotion('comp-d', 'production_ready', allTrue)
    expect(result.qualifiesForPromotion).toBe(false)
  })

  it('recommendedAction === already_promoted', () => {
    const result = evaluateComponentForPromotion('comp-d', 'production_ready', allTrue)
    expect(result.recommendedAction).toBe('already_promoted')
  })

  it('blockingReasons is empty', () => {
    const result = evaluateComponentForPromotion('comp-d', 'production_ready', allTrue)
    expect(result.blockingReasons).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// evaluateComponentForPromotion — deferred status
// ---------------------------------------------------------------------------

describe('evaluateComponentForPromotion — deferred status', () => {
  it('qualifiesForPromotion === false', () => {
    const result = evaluateComponentForPromotion('comp-e', 'deferred', allTrue)
    expect(result.qualifiesForPromotion).toBe(false)
  })

  it('recommendedAction === deferred', () => {
    const result = evaluateComponentForPromotion('comp-e', 'deferred', allTrue)
    expect(result.recommendedAction).toBe('deferred')
  })

  it('blockingReasons is empty for deferred', () => {
    const result = evaluateComponentForPromotion('comp-e', 'deferred', allFalse)
    expect(result.blockingReasons).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// createdFrom field
// ---------------------------------------------------------------------------

describe('createdFrom field', () => {
  it('evaluateComponentForPromotion sets createdFrom correctly', () => {
    const result = evaluateComponentForPromotion('comp-f', 'planned', allTrue)
    expect(result.createdFrom).toBe('qa16_readiness_promotion_gate')
  })

  it('buildPromotionGateReport sets createdFrom correctly', () => {
    const report = buildPromotionGateReport([
      { id: 'x', status: 'planned', criteria: allTrue },
    ])
    expect(report.createdFrom).toBe('qa16_readiness_promotion_gate')
  })
})

// ---------------------------------------------------------------------------
// PromotionGateReport — advisoryOnly and note
// ---------------------------------------------------------------------------

describe('PromotionGateReport — advisoryOnly and note', () => {
  const makeReport = () =>
    buildPromotionGateReport([
      { id: 'a', status: 'planned', criteria: allTrue },
      { id: 'b', status: 'production_ready', criteria: allTrue },
      { id: 'c', status: 'deferred', criteria: allFalse },
    ])

  it('advisoryOnly === true', () => {
    expect(makeReport().advisoryOnly).toBe(true)
  })

  it('note contains "advisory only"', () => {
    expect(makeReport().note.toLowerCase()).toContain('advisory only')
  })

  it('note contains "no manifest writes"', () => {
    expect(makeReport().note.toLowerCase()).toContain('no manifest writes')
  })
})

// ---------------------------------------------------------------------------
// PromotionGateReport — count invariants
// ---------------------------------------------------------------------------

describe('PromotionGateReport — count invariants', () => {
  it('eligibleCount + blockedCount + alreadyPromotedCount + deferredCount === evaluations.length', () => {
    const components = [
      { id: 'a', status: 'planned' as ComponentStatus, criteria: allTrue },
      { id: 'b', status: 'in_progress' as ComponentStatus, criteria: allFalse },
      { id: 'c', status: 'production_ready' as ComponentStatus, criteria: allTrue },
      { id: 'd', status: 'deferred' as ComponentStatus, criteria: allTrue },
      { id: 'e', status: 'partial' as ComponentStatus, criteria: allTrue },
    ]
    const report = buildPromotionGateReport(components)
    expect(
      report.eligibleCount +
        report.blockedCount +
        report.alreadyPromotedCount +
        report.deferredCount
    ).toBe(report.evaluations.length)
  })

  it('all-eligible input → eligibleCount === input.length', () => {
    const components = [
      { id: 'a', status: 'planned' as ComponentStatus, criteria: allTrue },
      { id: 'b', status: 'in_progress' as ComponentStatus, criteria: allTrue },
      { id: 'c', status: 'partial' as ComponentStatus, criteria: allTrue },
    ]
    const report = buildPromotionGateReport(components)
    expect(report.eligibleCount).toBe(components.length)
  })

  it('empty input → all counts are 0', () => {
    const report = buildPromotionGateReport([])
    expect(report.eligibleCount).toBe(0)
    expect(report.blockedCount).toBe(0)
    expect(report.alreadyPromotedCount).toBe(0)
    expect(report.deferredCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// PromotionGateReport — overallReadinessPercent
// ---------------------------------------------------------------------------

describe('PromotionGateReport — overallReadinessPercent', () => {
  it('is in [0, 100]', () => {
    const report = buildPromotionGateReport(getDefaultComponentAssessments())
    expect(report.overallReadinessPercent).toBeGreaterThanOrEqual(0)
    expect(report.overallReadinessPercent).toBeLessThanOrEqual(100)
  })

  it('is 0 for empty input', () => {
    const report = buildPromotionGateReport([])
    expect(report.overallReadinessPercent).toBe(0)
  })

  it('is 100 when all components are already_promoted', () => {
    const components = [
      { id: 'a', status: 'production_ready' as ComponentStatus, criteria: allTrue },
      { id: 'b', status: 'production_ready' as ComponentStatus, criteria: allTrue },
    ]
    const report = buildPromotionGateReport(components)
    expect(report.overallReadinessPercent).toBe(100)
  })

  it('is 0 when all components are blocked', () => {
    const components = [
      { id: 'a', status: 'planned' as ComponentStatus, criteria: allFalse },
      { id: 'b', status: 'in_progress' as ComponentStatus, criteria: allFalse },
    ]
    const report = buildPromotionGateReport(components)
    expect(report.overallReadinessPercent).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getDefaultComponentAssessments
// ---------------------------------------------------------------------------

describe('getDefaultComponentAssessments', () => {
  it('returns between 8 and 10 items', () => {
    const items = getDefaultComponentAssessments()
    expect(items.length).toBeGreaterThanOrEqual(8)
    expect(items.length).toBeLessThanOrEqual(10)
  })

  it('each item has an id', () => {
    const items = getDefaultComponentAssessments()
    items.forEach((item) => {
      expect(typeof item.id).toBe('string')
      expect(item.id.length).toBeGreaterThan(0)
    })
  })

  it('each item has a valid status', () => {
    const validStatuses: ComponentStatus[] = [
      'planned',
      'in_progress',
      'partial',
      'production_ready',
      'deferred',
    ]
    const items = getDefaultComponentAssessments()
    items.forEach((item) => {
      expect(validStatuses).toContain(item.status)
    })
  })

  it('each item has a complete criteria object', () => {
    const items = getDefaultComponentAssessments()
    items.forEach((item) => {
      expect(typeof item.criteria.hasGreenTests).toBe('boolean')
      expect(typeof item.criteria.hasNoBlockers).toBe('boolean')
      expect(typeof item.criteria.hasHonestDisclaimers).toBe('boolean')
      expect(typeof item.criteria.hasNoFakeLiveStatus).toBe('boolean')
      expect(typeof item.criteria.hasSliceDoc).toBe('boolean')
    })
  })

  it('covers programs, tower, intelligence, admin, solutions, qa, ops', () => {
    const items = getDefaultComponentAssessments()
    const ids = items.map((i) => i.id)
    expect(ids).toContain('programs')
    expect(ids).toContain('tower')
    expect(ids).toContain('intelligence')
    expect(ids).toContain('admin')
    expect(ids).toContain('solutions')
    expect(ids).toContain('qa')
    expect(ids).toContain('ops')
  })
})

// ---------------------------------------------------------------------------
// Each evaluation shape
// ---------------------------------------------------------------------------

describe('Each evaluation has required fields', () => {
  it('every evaluation has componentId, criteria, recommendedAction', () => {
    const report = buildPromotionGateReport(getDefaultComponentAssessments())
    report.evaluations.forEach((ev) => {
      expect(typeof ev.componentId).toBe('string')
      expect(ev.criteria).toBeDefined()
      expect(['promote', 'fix_blockers', 'already_promoted', 'deferred']).toContain(
        ev.recommendedAction
      )
    })
  })

  it('every evaluation has createdFrom', () => {
    const report = buildPromotionGateReport(getDefaultComponentAssessments())
    report.evaluations.forEach((ev) => {
      expect(ev.createdFrom).toBe('qa16_readiness_promotion_gate')
    })
  })
})

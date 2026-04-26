import {
  buildProgramHealthScorecard,
  buildProgramHealthSummary,
  getDefaultProgramIds,
  ProgramHealthScorecard,
  ProgramHealthDimension,
} from '../../../lib/programs/program-health-scorecard'

const DEFAULT_IDS = getDefaultProgramIds()
const SAMPLE_ID = DEFAULT_IDS[0]
const VALID_GRADES = ['A', 'B', 'C', 'D', 'F'] as const
const VALID_STATUSES = ['healthy', 'at_risk', 'critical'] as const
const DIMENSION_IDS = [
  'phase_gate_health',
  'workshop_coverage',
  'evidence_quality',
  'deliverable_completion',
  'risk_posture',
]

// ---------------------------------------------------------------------------
// getDefaultProgramIds
// ---------------------------------------------------------------------------

describe('getDefaultProgramIds', () => {
  it('returns an array', () => {
    expect(Array.isArray(DEFAULT_IDS)).toBe(true)
  })

  it('returns 3–5 canonical demo program IDs', () => {
    expect(DEFAULT_IDS.length).toBeGreaterThanOrEqual(3)
    expect(DEFAULT_IDS.length).toBeLessThanOrEqual(5)
  })

  it('every entry is a non-empty string', () => {
    DEFAULT_IDS.forEach((id) => {
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// buildProgramHealthScorecard — non-null / basic shape
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — basic shape', () => {
  DEFAULT_IDS.forEach((programId) => {
    it(`returns non-null for programId="${programId}"`, () => {
      const sc = buildProgramHealthScorecard(programId)
      expect(sc).not.toBeNull()
      expect(sc).toBeDefined()
    })
  })

  it('returns the correct programId', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    expect(sc.programId).toBe(SAMPLE_ID)
  })

  it('createdFrom is prog9_program_health_scorecard', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    expect(sc.createdFrom).toBe('prog9_program_health_scorecard')
  })

  it('createdFrom is stable across all default IDs', () => {
    DEFAULT_IDS.forEach((id) => {
      const sc = buildProgramHealthScorecard(id)
      expect(sc.createdFrom).toBe('prog9_program_health_scorecard')
    })
  })
})

// ---------------------------------------------------------------------------
// overallScore
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — overallScore', () => {
  DEFAULT_IDS.forEach((programId) => {
    it(`overallScore in [0,1] for "${programId}"`, () => {
      const sc = buildProgramHealthScorecard(programId)
      expect(sc.overallScore).toBeGreaterThanOrEqual(0)
      expect(sc.overallScore).toBeLessThanOrEqual(1)
    })
  })
})

// ---------------------------------------------------------------------------
// grade
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — grade', () => {
  DEFAULT_IDS.forEach((programId) => {
    it(`grade is in ['A','B','C','D','F'] for "${programId}"`, () => {
      const sc = buildProgramHealthScorecard(programId)
      expect(VALID_GRADES).toContain(sc.grade)
    })
  })

  it('grade A requires overallScore >= 0.80', () => {
    DEFAULT_IDS.forEach((id) => {
      const sc = buildProgramHealthScorecard(id)
      if (sc.grade === 'A') expect(sc.overallScore).toBeGreaterThanOrEqual(0.8)
    })
  })

  it('grade F requires overallScore < 0.35', () => {
    DEFAULT_IDS.forEach((id) => {
      const sc = buildProgramHealthScorecard(id)
      if (sc.grade === 'F') expect(sc.overallScore).toBeLessThan(0.35)
    })
  })

  it('grade B requires overallScore in [0.65, 0.8)', () => {
    DEFAULT_IDS.forEach((id) => {
      const sc = buildProgramHealthScorecard(id)
      if (sc.grade === 'B') {
        expect(sc.overallScore).toBeGreaterThanOrEqual(0.65)
        expect(sc.overallScore).toBeLessThan(0.8)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// dimensions
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — dimensions', () => {
  let sc: ProgramHealthScorecard

  beforeEach(() => {
    sc = buildProgramHealthScorecard(SAMPLE_ID)
  })

  it('has exactly 5 dimensions', () => {
    expect(sc.dimensions).toHaveLength(5)
  })

  it('contains all expected dimension IDs', () => {
    const ids = sc.dimensions.map((d) => d.id)
    DIMENSION_IDS.forEach((expected) => {
      expect(ids).toContain(expected)
    })
  })

  it('every dimension score is in [0, 1]', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      expect(d.score).toBeGreaterThanOrEqual(0)
      expect(d.score).toBeLessThanOrEqual(1)
    })
  })

  it('every dimension status is in valid set', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      expect(VALID_STATUSES).toContain(d.status)
    })
  })

  it('every dimension has a non-empty label', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      expect(typeof d.label).toBe('string')
      expect(d.label.length).toBeGreaterThan(0)
    })
  })

  it('every dimension has at least one note', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      expect(Array.isArray(d.notes)).toBe(true)
      expect(d.notes.length).toBeGreaterThan(0)
    })
  })

  it('healthy status requires score >= 0.65', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      if (d.status === 'healthy') expect(d.score).toBeGreaterThanOrEqual(0.65)
    })
  })

  it('critical status requires score < 0.35', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      if (d.status === 'critical') expect(d.score).toBeLessThan(0.35)
    })
  })

  it('at_risk status requires score in [0.35, 0.65)', () => {
    sc.dimensions.forEach((d: ProgramHealthDimension) => {
      if (d.status === 'at_risk') {
        expect(d.score).toBeGreaterThanOrEqual(0.35)
        expect(d.score).toBeLessThan(0.65)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// topStrength / topRisk
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — topStrength and topRisk', () => {
  DEFAULT_IDS.forEach((programId) => {
    it(`topStrength has the max dimension score for "${programId}"`, () => {
      const sc = buildProgramHealthScorecard(programId)
      const strengthDim = sc.dimensions.find((d) => d.id === sc.topStrength)!
      const maxScore = Math.max(...sc.dimensions.map((d) => d.score))
      expect(strengthDim).toBeDefined()
      expect(strengthDim.score).toBe(maxScore)
    })

    it(`topRisk has the min dimension score for "${programId}"`, () => {
      const sc = buildProgramHealthScorecard(programId)
      const riskDim = sc.dimensions.find((d) => d.id === sc.topRisk)!
      const minScore = Math.min(...sc.dimensions.map((d) => d.score))
      expect(riskDim).toBeDefined()
      expect(riskDim.score).toBe(minScore)
    })
  })

  it('topStrength is a valid dimension id', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    expect(DIMENSION_IDS).toContain(sc.topStrength)
  })

  it('topRisk is a valid dimension id', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    expect(DIMENSION_IDS).toContain(sc.topRisk)
  })
})

// ---------------------------------------------------------------------------
// honestDisclaimer
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — honestDisclaimer', () => {
  it('honestDisclaimer is a non-empty string', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    expect(typeof sc.honestDisclaimer).toBe('string')
    expect(sc.honestDisclaimer.length).toBeGreaterThan(0)
  })

  it('honestDisclaimer is present for all default IDs', () => {
    DEFAULT_IDS.forEach((id) => {
      const sc = buildProgramHealthScorecard(id)
      expect(sc.honestDisclaimer).toBeTruthy()
    })
  })

  it('honestDisclaimer mentions seed / deterministic nature', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    const lower = sc.honestDisclaimer.toLowerCase()
    expect(lower).toMatch(/seed|deterministic|demo|illustrative/)
  })
})

// ---------------------------------------------------------------------------
// recommendedNextAction
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — recommendedNextAction', () => {
  it('is a non-empty string', () => {
    const sc = buildProgramHealthScorecard(SAMPLE_ID)
    expect(typeof sc.recommendedNextAction).toBe('string')
    expect(sc.recommendedNextAction.length).toBeGreaterThan(0)
  })

  it('is non-empty for all default IDs', () => {
    DEFAULT_IDS.forEach((id) => {
      const sc = buildProgramHealthScorecard(id)
      expect(sc.recommendedNextAction.length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('buildProgramHealthScorecard — determinism', () => {
  DEFAULT_IDS.forEach((programId) => {
    it(`same programId always returns the same scorecard for "${programId}"`, () => {
      const sc1 = buildProgramHealthScorecard(programId)
      const sc2 = buildProgramHealthScorecard(programId)
      expect(sc1.overallScore).toBe(sc2.overallScore)
      expect(sc1.grade).toBe(sc2.grade)
      expect(sc1.topStrength).toBe(sc2.topStrength)
      expect(sc1.topRisk).toBe(sc2.topRisk)
      sc1.dimensions.forEach((d1, i) => {
        const d2 = sc2.dimensions[i]
        expect(d1.score).toBe(d2.score)
        expect(d1.status).toBe(d2.status)
      })
    })
  })

  it('different programIds produce different overallScores', () => {
    const scores = DEFAULT_IDS.map((id) => buildProgramHealthScorecard(id).overallScore)
    const unique = new Set(scores)
    // Not all should be identical
    expect(unique.size).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// buildProgramHealthSummary
// ---------------------------------------------------------------------------

describe('buildProgramHealthSummary', () => {
  it('returns scorecards.length === input.length for default IDs', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    expect(summary.scorecards).toHaveLength(DEFAULT_IDS.length)
  })

  it('returns scorecards.length === 1 for a single ID', () => {
    const summary = buildProgramHealthSummary([SAMPLE_ID])
    expect(summary.scorecards).toHaveLength(1)
  })

  it('returns scorecards.length === 0 for empty input', () => {
    const summary = buildProgramHealthSummary([])
    expect(summary.scorecards).toHaveLength(0)
  })

  it('healthyCount + atRiskCount + criticalCount === scorecards.length', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    expect(summary.healthyCount + summary.atRiskCount + summary.criticalCount).toBe(
      summary.scorecards.length,
    )
  })

  it('count invariant holds for single-element input', () => {
    const summary = buildProgramHealthSummary([SAMPLE_ID])
    expect(summary.healthyCount + summary.atRiskCount + summary.criticalCount).toBe(1)
  })

  it('count invariant holds for empty input', () => {
    const summary = buildProgramHealthSummary([])
    expect(summary.healthyCount + summary.atRiskCount + summary.criticalCount).toBe(0)
  })

  it('averageOverallScore is in [0, 1] for default IDs', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    expect(summary.averageOverallScore).toBeGreaterThanOrEqual(0)
    expect(summary.averageOverallScore).toBeLessThanOrEqual(1)
  })

  it('averageOverallScore is 0 for empty input', () => {
    const summary = buildProgramHealthSummary([])
    expect(summary.averageOverallScore).toBe(0)
  })

  it('createdFrom is prog9_program_health_scorecard', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    expect(summary.createdFrom).toBe('prog9_program_health_scorecard')
  })

  it('every scorecard in summary has createdFrom tag', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    summary.scorecards.forEach((sc) => {
      expect(sc.createdFrom).toBe('prog9_program_health_scorecard')
    })
  })

  it('each scorecard in summary has 5 dimensions', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    summary.scorecards.forEach((sc) => {
      expect(sc.dimensions).toHaveLength(5)
    })
  })

  it('healthyCount matches grade A or B scorecards', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    const expected = summary.scorecards.filter(
      (sc) => sc.grade === 'A' || sc.grade === 'B',
    ).length
    expect(summary.healthyCount).toBe(expected)
  })

  it('atRiskCount matches grade C or D scorecards', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    const expected = summary.scorecards.filter(
      (sc) => sc.grade === 'C' || sc.grade === 'D',
    ).length
    expect(summary.atRiskCount).toBe(expected)
  })

  it('criticalCount matches grade F scorecards', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    const expected = summary.scorecards.filter((sc) => sc.grade === 'F').length
    expect(summary.criticalCount).toBe(expected)
  })

  it('summary is deterministic — same IDs produce same averageOverallScore', () => {
    const s1 = buildProgramHealthSummary(DEFAULT_IDS)
    const s2 = buildProgramHealthSummary(DEFAULT_IDS)
    expect(s1.averageOverallScore).toBe(s2.averageOverallScore)
    expect(s1.healthyCount).toBe(s2.healthyCount)
    expect(s1.atRiskCount).toBe(s2.atRiskCount)
    expect(s1.criticalCount).toBe(s2.criticalCount)
  })

  it('averageOverallScore equals mean of individual scorecards overallScore', () => {
    const summary = buildProgramHealthSummary(DEFAULT_IDS)
    const manualAvg =
      Math.round(
        (summary.scorecards.reduce((s, sc) => s + sc.overallScore, 0) /
          summary.scorecards.length) *
          100,
      ) / 100
    expect(summary.averageOverallScore).toBe(manualAvg)
  })
})

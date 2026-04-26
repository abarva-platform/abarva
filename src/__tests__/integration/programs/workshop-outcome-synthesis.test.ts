// MW8 · Workshop Outcome Synthesis — integration tests
//
// ≥35 tests covering:
//   - Core return shape & invariants
//   - Capture classification into each bucket
//   - synthesisQuality scoring rules
//   - nextWorkshopRecommendation determinism
//   - buildDefaultWorkshopCaptures contract
//   - synthesizePortfolioOutcomes contract
//   - Honesty / proposed constraints

import {
  synthesizeWorkshopOutcomes,
  buildDefaultWorkshopCaptures,
  synthesizePortfolioOutcomes,
  type WorkshopCapture,
  type SynthesizedOutcome,
} from '@/lib/programs/workshop-outcome-synthesis'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCapture(
  workshopId: string,
  captureType: WorkshopCapture['captureType'],
  priority: WorkshopCapture['priority'] = 'medium'
): WorkshopCapture {
  return { workshopId, captureType, content: `Sample ${captureType}`, priority }
}

const WID = 'test_workshop_001'

const FULL_CAPTURES: WorkshopCapture[] = [
  makeCapture(WID, 'decision', 'high'),
  makeCapture(WID, 'decision', 'medium'),
  makeCapture(WID, 'action', 'high'),
  makeCapture(WID, 'action', 'low'),
  makeCapture(WID, 'risk', 'medium'),
  makeCapture(WID, 'question', 'high'),
  makeCapture(WID, 'evidence_gap', 'medium'),
]

// ---------------------------------------------------------------------------
// 1. Basic return contract
// ---------------------------------------------------------------------------

describe('synthesizeWorkshopOutcomes — return shape', () => {
  let result: SynthesizedOutcome

  beforeAll(() => {
    result = synthesizeWorkshopOutcomes(WID, FULL_CAPTURES)
  })

  it('returns a non-null value', () => {
    expect(result).toBeTruthy()
  })

  it('workshopId matches input', () => {
    expect(result.workshopId).toBe(WID)
  })

  it('proposed is always true', () => {
    expect(result.proposed).toBe(true)
  })

  it('createdFrom is mw8_workshop_outcome_synthesis', () => {
    expect(result.createdFrom).toBe('mw8_workshop_outcome_synthesis')
  })

  it('honestDisclaimer contains "proposed only"', () => {
    expect(result.honestDisclaimer).toContain('proposed only')
  })

  it('honestDisclaimer mentions no program state modified', () => {
    expect(result.honestDisclaimer.toLowerCase()).toContain('no program state has been modified')
  })

  it('nextWorkshopRecommendation is a non-empty string', () => {
    expect(typeof result.nextWorkshopRecommendation).toBe('string')
    expect(result.nextWorkshopRecommendation.length).toBeGreaterThan(0)
  })

  it('synthesisQuality is one of high | medium | low', () => {
    expect(['high', 'medium', 'low']).toContain(result.synthesisQuality)
  })
})

// ---------------------------------------------------------------------------
// 2. Capture classification
// ---------------------------------------------------------------------------

describe('synthesizeWorkshopOutcomes — capture classification', () => {
  let result: SynthesizedOutcome

  beforeAll(() => {
    result = synthesizeWorkshopOutcomes(WID, FULL_CAPTURES)
  })

  it('confirmedDecisions contains only decision captures', () => {
    result.confirmedDecisions.forEach((c) => expect(c.captureType).toBe('decision'))
  })

  it('confirmedDecisions count matches input decisions', () => {
    const expected = FULL_CAPTURES.filter((c) => c.captureType === 'decision').length
    expect(result.confirmedDecisions).toHaveLength(expected)
  })

  it('openActions contains only action captures', () => {
    result.openActions.forEach((c) => expect(c.captureType).toBe('action'))
  })

  it('openActions count matches input actions', () => {
    const expected = FULL_CAPTURES.filter((c) => c.captureType === 'action').length
    expect(result.openActions).toHaveLength(expected)
  })

  it('openQuestions contains only question captures', () => {
    result.openQuestions.forEach((c) => expect(c.captureType).toBe('question'))
  })

  it('openQuestions count matches input questions', () => {
    const expected = FULL_CAPTURES.filter((c) => c.captureType === 'question').length
    expect(result.openQuestions).toHaveLength(expected)
  })

  it('evidenceGaps contains only evidence_gap captures', () => {
    result.evidenceGaps.forEach((c) => expect(c.captureType).toBe('evidence_gap'))
  })

  it('evidenceGaps count matches input evidence_gaps', () => {
    const expected = FULL_CAPTURES.filter((c) => c.captureType === 'evidence_gap').length
    expect(result.evidenceGaps).toHaveLength(expected)
  })

  it('risks contains only risk captures', () => {
    result.risks.forEach((c) => expect(c.captureType).toBe('risk'))
  })

  it('risks count matches input risks', () => {
    const expected = FULL_CAPTURES.filter((c) => c.captureType === 'risk').length
    expect(result.risks).toHaveLength(expected)
  })

  it('no capture is placed in a bucket whose type it does not match', () => {
    result.confirmedDecisions.forEach((c) => expect(c.captureType).toBe('decision'))
    result.openActions.forEach((c) => expect(c.captureType).toBe('action'))
    result.openQuestions.forEach((c) => expect(c.captureType).toBe('question'))
    result.evidenceGaps.forEach((c) => expect(c.captureType).toBe('evidence_gap'))
    result.risks.forEach((c) => expect(c.captureType).toBe('risk'))
  })
})

// ---------------------------------------------------------------------------
// 3. synthesisQuality scoring
// ---------------------------------------------------------------------------

describe('synthesizeWorkshopOutcomes — synthesisQuality', () => {
  it('returns high when captures.length === 6', () => {
    const caps = Array.from({ length: 6 }, (_, i) => makeCapture(WID, 'action'))
    expect(synthesizeWorkshopOutcomes(WID, caps).synthesisQuality).toBe('high')
  })

  it('returns high when captures.length > 6', () => {
    const caps = Array.from({ length: 9 }, () => makeCapture(WID, 'decision'))
    expect(synthesizeWorkshopOutcomes(WID, caps).synthesisQuality).toBe('high')
  })

  it('returns medium when captures.length === 3', () => {
    const caps = Array.from({ length: 3 }, () => makeCapture(WID, 'risk'))
    expect(synthesizeWorkshopOutcomes(WID, caps).synthesisQuality).toBe('medium')
  })

  it('returns medium when captures.length === 5', () => {
    const caps = Array.from({ length: 5 }, () => makeCapture(WID, 'question'))
    expect(synthesizeWorkshopOutcomes(WID, caps).synthesisQuality).toBe('medium')
  })

  it('returns low when captures.length === 0', () => {
    expect(synthesizeWorkshopOutcomes(WID, []).synthesisQuality).toBe('low')
  })

  it('returns low when captures.length === 1', () => {
    const caps = [makeCapture(WID, 'action')]
    expect(synthesizeWorkshopOutcomes(WID, caps).synthesisQuality).toBe('low')
  })

  it('returns low when captures.length === 2', () => {
    const caps = Array.from({ length: 2 }, () => makeCapture(WID, 'evidence_gap'))
    expect(synthesizeWorkshopOutcomes(WID, caps).synthesisQuality).toBe('low')
  })
})

// ---------------------------------------------------------------------------
// 4. Empty captures — edge case
// ---------------------------------------------------------------------------

describe('synthesizeWorkshopOutcomes — empty captures', () => {
  let result: SynthesizedOutcome

  beforeAll(() => {
    result = synthesizeWorkshopOutcomes('empty_wid', [])
  })

  it('returns non-null', () => {
    expect(result).toBeTruthy()
  })

  it('proposed is true', () => {
    expect(result.proposed).toBe(true)
  })

  it('synthesisQuality is low', () => {
    expect(result.synthesisQuality).toBe('low')
  })

  it('all buckets are empty arrays', () => {
    expect(result.confirmedDecisions).toHaveLength(0)
    expect(result.openActions).toHaveLength(0)
    expect(result.openQuestions).toHaveLength(0)
    expect(result.evidenceGaps).toHaveLength(0)
    expect(result.risks).toHaveLength(0)
  })

  it('nextWorkshopRecommendation still set', () => {
    expect(result.nextWorkshopRecommendation.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 5. nextWorkshopRecommendation determinism
// ---------------------------------------------------------------------------

describe('synthesizeWorkshopOutcomes — nextWorkshopRecommendation', () => {
  it('discovery workshopId → value_mapping', () => {
    const r = synthesizeWorkshopOutcomes('current_state_discovery', [])
    expect(r.nextWorkshopRecommendation).toBe('value_mapping')
  })

  it('value_mapping workshopId → architecture_review', () => {
    const r = synthesizeWorkshopOutcomes('value_mapping', [])
    expect(r.nextWorkshopRecommendation).toBe('architecture_review')
  })

  it('architecture_review workshopId → governance_alignment', () => {
    const r = synthesizeWorkshopOutcomes('architecture_review', [])
    expect(r.nextWorkshopRecommendation).toBe('governance_alignment')
  })

  it('governance workshopId → adoption_planning', () => {
    const r = synthesizeWorkshopOutcomes('governance_alignment', [])
    expect(r.nextWorkshopRecommendation).toBe('adoption_planning')
  })

  it('adoption workshopId → executive_review', () => {
    const r = synthesizeWorkshopOutcomes('adoption_planning', [])
    expect(r.nextWorkshopRecommendation).toBe('executive_review')
  })

  it('executive_review workshopId → program_close', () => {
    const r = synthesizeWorkshopOutcomes('executive_review', [])
    expect(r.nextWorkshopRecommendation).toBe('program_close')
  })

  it('same workshopId always returns same recommendation (deterministic)', () => {
    const r1 = synthesizeWorkshopOutcomes('some_stable_id', [])
    const r2 = synthesizeWorkshopOutcomes('some_stable_id', [])
    expect(r1.nextWorkshopRecommendation).toBe(r2.nextWorkshopRecommendation)
  })
})

// ---------------------------------------------------------------------------
// 6. buildDefaultWorkshopCaptures
// ---------------------------------------------------------------------------

describe('buildDefaultWorkshopCaptures', () => {
  it('returns between 5 and 8 items', () => {
    const captures = buildDefaultWorkshopCaptures('sample_workshop')
    expect(captures.length).toBeGreaterThanOrEqual(5)
    expect(captures.length).toBeLessThanOrEqual(8)
  })

  it('all captures have the correct workshopId', () => {
    const id = 'wshop_abc'
    buildDefaultWorkshopCaptures(id).forEach((c) => expect(c.workshopId).toBe(id))
  })

  it('all captures have non-empty content', () => {
    buildDefaultWorkshopCaptures('x').forEach((c) =>
      expect(c.content.length).toBeGreaterThan(0)
    )
  })

  it('all captures have valid priority values', () => {
    buildDefaultWorkshopCaptures('x').forEach((c) =>
      expect(['high', 'medium', 'low']).toContain(c.priority)
    )
  })

  it('all captures have valid captureType values', () => {
    const valid = ['decision', 'action', 'risk', 'question', 'evidence_gap']
    buildDefaultWorkshopCaptures('x').forEach((c) =>
      expect(valid).toContain(c.captureType)
    )
  })

  it('includes at least one decision capture', () => {
    const caps = buildDefaultWorkshopCaptures('x')
    expect(caps.some((c) => c.captureType === 'decision')).toBe(true)
  })

  it('includes at least one action capture', () => {
    const caps = buildDefaultWorkshopCaptures('x')
    expect(caps.some((c) => c.captureType === 'action')).toBe(true)
  })

  it('is deterministic across repeated calls', () => {
    const a = buildDefaultWorkshopCaptures('stable_id')
    const b = buildDefaultWorkshopCaptures('stable_id')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

// ---------------------------------------------------------------------------
// 7. synthesizePortfolioOutcomes
// ---------------------------------------------------------------------------

describe('synthesizePortfolioOutcomes', () => {
  it('returns same length as input array', () => {
    const ids = ['w1', 'w2', 'w3']
    expect(synthesizePortfolioOutcomes(ids)).toHaveLength(ids.length)
  })

  it('returns empty array for empty input', () => {
    expect(synthesizePortfolioOutcomes([])).toHaveLength(0)
  })

  it('each result has proposed === true', () => {
    synthesizePortfolioOutcomes(['w1', 'w2']).forEach((r) =>
      expect(r.proposed).toBe(true)
    )
  })

  it('each result has correct createdFrom', () => {
    synthesizePortfolioOutcomes(['w1']).forEach((r) =>
      expect(r.createdFrom).toBe('mw8_workshop_outcome_synthesis')
    )
  })

  it('each result workshopId matches input order', () => {
    const ids = ['alpha', 'beta', 'gamma']
    const results = synthesizePortfolioOutcomes(ids)
    ids.forEach((id, i) => expect(results[i].workshopId).toBe(id))
  })

  it('each result has honestDisclaimer with "proposed only"', () => {
    synthesizePortfolioOutcomes(['w1', 'w2']).forEach((r) =>
      expect(r.honestDisclaimer).toContain('proposed only')
    )
  })

  it('synthesisQuality is high for default captures (8 items)', () => {
    // buildDefaultWorkshopCaptures returns 8 items → quality = high
    synthesizePortfolioOutcomes(['any_id']).forEach((r) =>
      expect(r.synthesisQuality).toBe('high')
    )
  })
})

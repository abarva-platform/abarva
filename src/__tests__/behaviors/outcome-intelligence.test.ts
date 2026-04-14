import {
  calcProgress,
  calcExpectedProgress,
  calcInitiativeStatus,
  calcVariance,
  calcOutcomeFee,
  calcPortfolioSummary,
  type InitiativeStatus,
} from '@/lib/outcome-intelligence'

describe('Outcome Intelligence behaviors', () => {
  describe('calcProgress', () => {
    it('calculates % improvement toward target', () => {
      // Denial rate: 18.2% baseline, 16.8% current, 11.4% target
      // Achieved: 18.2 - 16.8 = 1.4pp; Total: 18.2 - 11.4 = 6.8pp
      // Progress: 1.4/6.8 = ~21%
      const progress = calcProgress(18.2, 16.8, 11.4)
      expect(progress).toBe(21)
    })

    it('returns 100 when target is reached', () => {
      expect(calcProgress(18.2, 11.4, 11.4)).toBe(100)
    })

    it('returns 0 when no improvement from baseline', () => {
      expect(calcProgress(18.2, 18.2, 11.4)).toBe(0)
    })

    it('caps at 100 when exceeding target', () => {
      expect(calcProgress(18.2, 10.0, 11.4)).toBe(100)
    })

    it('works for increasing metrics (revenue)', () => {
      // Revenue: $0 baseline, $8.2M current, $28M target = ~29%
      const progress = calcProgress(0, 8_200_000, 28_000_000)
      expect(progress).toBe(29)
    })
  })

  describe('calcExpectedProgress', () => {
    it('returns 0 at day 0', () => {
      expect(calcExpectedProgress(0, 420)).toBe(0)
    })

    it('returns 100 at end of programme', () => {
      expect(calcExpectedProgress(420, 420)).toBe(100)
    })

    it('returns ~50 at midpoint', () => {
      expect(calcExpectedProgress(210, 420)).toBe(50)
    })

    it('at day 127 of 420: ~30%', () => {
      const expected = calcExpectedProgress(127, 420)
      expect(expected).toBeGreaterThan(25)
      expect(expected).toBeLessThan(35)
    })
  })

  describe('calcInitiativeStatus', () => {
    it('on_track when actual within 10pp of expected', () => {
      expect(calcInitiativeStatus(25, 30)).toBe('on_track') // 5pp behind
    })

    it('warning when 10-20pp behind expected', () => {
      expect(calcInitiativeStatus(10, 25)).toBe('warning') // 15pp behind
    })

    it('behind when >20pp behind expected', () => {
      expect(calcInitiativeStatus(5, 30)).toBe('behind') // 25pp behind
    })

    it('on_track when ahead of expected', () => {
      expect(calcInitiativeStatus(35, 30)).toBe('on_track')
    })
  })

  describe('calcVariance', () => {
    it('detects when ahead for downward metric', () => {
      // Denial rate: baseline 18.2, current 16.8, expected 17.1
      // Actual improvement: 18.2 - 16.8 = 1.4pp
      // Expected improvement: 18.2 - 17.1 = 1.1pp
      // Variance: 1.4 - 1.1 = 0.3pp AHEAD
      const result = calcVariance(18.2, 16.8, 17.1, true)
      expect(result.ahead).toBe(true)
      expect(result.variancePP).toBe(0.3)
    })

    it('detects when behind for downward metric', () => {
      const result = calcVariance(18.2, 17.5, 17.1, true)
      expect(result.ahead).toBe(false)
    })

    it('handles upward metrics correctly', () => {
      // Revenue: baseline 0, current 8.2M, expected 7M
      const result = calcVariance(0, 8_200_000, 7_000_000, false)
      expect(result.ahead).toBe(true)
    })
  })

  describe('calcOutcomeFee', () => {
    it('calculates 15% fee correctly', () => {
      expect(calcOutcomeFee(8_200_000, 0.15)).toBe(1_230_000)
    })

    it('calculates 20% fee correctly', () => {
      expect(calcOutcomeFee(8_200_000, 0.20)).toBe(1_640_000)
    })

    it('returns 0 for zero savings', () => {
      expect(calcOutcomeFee(0, 0.15)).toBe(0)
    })
  })

  describe('calcPortfolioSummary', () => {
    it('sums committed and verified values correctly', () => {
      const initiatives = [
        { committedValue: 28_000_000, verifiedValue: 8_200_000, status: 'on_track' as InitiativeStatus },
        { committedValue: 22_000_000, verifiedValue: 0, status: 'on_track' as InitiativeStatus },
        { committedValue: 12_000_000, verifiedValue: 0, status: 'warning' as InitiativeStatus },
        { committedValue: 8_000_000, verifiedValue: 0, status: 'on_track' as InitiativeStatus },
        { committedValue: 7_000_000, verifiedValue: 0, status: 'behind' as InitiativeStatus },
      ]
      const summary = calcPortfolioSummary(initiatives)
      expect(summary.totalCommitted).toBe(77_000_000)
      expect(summary.totalVerified).toBe(8_200_000)
      expect(summary.onTrackCount).toBe(3)
      expect(summary.atRiskCount).toBe(2)
    })
  })
})

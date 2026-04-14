import {
  scoreVendorFit,
  vendorColorBucket,
  rankVendors,
  calculateSlaCredit,
  type VendorScore,
} from '@/lib/vendor-intelligence'

describe('Vendor Intelligence behaviors', () => {
  const meridianProfile = {
    epicIntegration: true,
    azureIntegration: true,
    dataReadiness: 67,
    techReadiness: 52,
    orgReadiness: 41,
    cdoPresent: false,
    priorAuthCoverage: 23,
  }

  describe('scoreVendorFit', () => {
    it('gives bonus for Epic-native vendor when client uses Epic', () => {
      const epicVendor = { epicNative: true, azureNative: false, outcomeRate: 71, avgComplexity: 50 }
      const nonEpicVendor = { epicNative: false, azureNative: false, outcomeRate: 71, avgComplexity: 50 }
      const epicScore = scoreVendorFit(epicVendor, meridianProfile)
      const nonEpicScore = scoreVendorFit(nonEpicVendor, meridianProfile)
      expect(epicScore).toBeGreaterThan(nonEpicScore)
    })

    it('penalizes high-complexity vendors for lower-readiness clients', () => {
      const highComplexity = { epicNative: true, azureNative: true, outcomeRate: 71, avgComplexity: 90 }
      const lowComplexity = { epicNative: true, azureNative: true, outcomeRate: 71, avgComplexity: 20 }
      const highScore = scoreVendorFit(highComplexity, meridianProfile)
      const lowScore = scoreVendorFit(lowComplexity, meridianProfile)
      expect(lowScore).toBeGreaterThan(highScore)
    })

    it('returns a score between 0 and 100', () => {
      const vendor = { epicNative: true, azureNative: true, outcomeRate: 95, avgComplexity: 10 }
      const score = scoreVendorFit(vendor, meridianProfile)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('vendorColorBucket', () => {
    it('returns teal for scores >= 70', () => {
      expect(vendorColorBucket(75)).toBe('teal')
      expect(vendorColorBucket(70)).toBe('teal')
    })
    it('returns blue for scores 55-69', () => {
      expect(vendorColorBucket(65)).toBe('blue')
      expect(vendorColorBucket(55)).toBe('blue')
    })
    it('returns amber for scores 40-54', () => {
      expect(vendorColorBucket(50)).toBe('amber')
    })
    it('returns gray for scores < 40', () => {
      expect(vendorColorBucket(30)).toBe('gray')
    })
  })

  describe('rankVendors', () => {
    it('sorts vendors by outcomeRate descending', () => {
      const vendors: VendorScore[] = [
        { id: 'v1', name: 'A', outcomeRate: 60, complexityScore: 50, referenceMatchScore: 5, color: 'blue' },
        { id: 'v2', name: 'B', outcomeRate: 85, complexityScore: 40, referenceMatchScore: 8, color: 'teal' },
        { id: 'v3', name: 'C', outcomeRate: 45, complexityScore: 70, referenceMatchScore: 2, color: 'amber' },
      ]
      const ranked = rankVendors(vendors)
      expect(ranked[0].id).toBe('v2')
      expect(ranked[1].id).toBe('v1')
      expect(ranked[2].id).toBe('v3')
    })

    it('does not mutate original array', () => {
      const vendors: VendorScore[] = [
        { id: 'v1', name: 'A', outcomeRate: 60, complexityScore: 50, referenceMatchScore: 5, color: 'blue' },
        { id: 'v2', name: 'B', outcomeRate: 85, complexityScore: 40, referenceMatchScore: 8, color: 'teal' },
      ]
      const original = [...vendors]
      rankVendors(vendors)
      expect(vendors[0].id).toBe(original[0].id)
    })
  })

  describe('calculateSlaCredit', () => {
    it('returns 0 when actual uptime meets contracted uptime', () => {
      expect(calculateSlaCredit(4200000, 99.5, 99.5)).toBe(0)
      expect(calculateSlaCredit(4200000, 99.5, 100)).toBe(0)
    })

    it('calculates credit for SLA breach', () => {
      // 4.2M spend, 99.5% contracted, 97.1% actual = 2.4pp gap = $100,800
      const credit = calculateSlaCredit(4200000, 99.5, 97.1)
      expect(credit).toBeGreaterThan(0)
      expect(credit).toBe(Math.round(4200000 * (2.4 / 100)))
    })

    it('Ensemble $4.2M 99.5% vs 97.1% = ~$100,800 credit', () => {
      const credit = calculateSlaCredit(4200000, 99.5, 97.1)
      expect(credit).toBe(100800)
    })
  })
})

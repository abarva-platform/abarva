import {
  filterSolutions,
  buildSolutionUrl,
  objectiveColor,
  type Solution,
} from '@/lib/solution-library'

const ALL_SOLUTIONS: Solution[] = [
  { code: 'HC-01', name: 'Health Growth',         objective: 'Grow',     office: 'Front Office',  vertical: 'Healthcare' },
  { code: 'AM-01', name: 'Analytics Modernise',   objective: 'Optimise', office: 'Back Office',   vertical: 'All' },
  { code: 'IT-01', name: 'IT Optimise',           objective: 'Optimise', office: 'Back Office',   vertical: 'All' },
  { code: 'FS-01', name: 'FS Growth',             objective: 'Grow',     office: 'Front Office',  vertical: 'Financial Services' },
  { code: 'AI-01', name: 'AI Protect',            objective: 'Protect',  office: 'Middle Office', vertical: 'All' },
]

describe('Solution Library behaviors', () => {
  describe('filterSolutions', () => {
    it('returns all solutions when no filter applied', () => {
      expect(filterSolutions(ALL_SOLUTIONS, {})).toHaveLength(5)
    })

    it('filters by objective', () => {
      const results = filterSolutions(ALL_SOLUTIONS, { objective: 'Grow' })
      expect(results).toHaveLength(2)
      expect(results.map(s => s.code)).toEqual(expect.arrayContaining(['HC-01', 'FS-01']))
    })

    it('filters by office', () => {
      const results = filterSolutions(ALL_SOLUTIONS, { office: 'Back Office' })
      expect(results).toHaveLength(2)
      expect(results.map(s => s.code)).toEqual(expect.arrayContaining(['AM-01', 'IT-01']))
    })

    it('filters by vertical — only returns matching + All verticals', () => {
      const results = filterSolutions(ALL_SOLUTIONS, { vertical: 'Healthcare' })
      // HC-01 (Healthcare) + AM-01 (All) + IT-01 (All) + AI-01 (All)
      const codes = results.map(s => s.code)
      expect(codes).toContain('HC-01')
      expect(codes).not.toContain('FS-01')
    })

    it('filters by Financial Services — excludes Healthcare solution', () => {
      const results = filterSolutions(ALL_SOLUTIONS, { vertical: 'Financial Services' })
      const codes = results.map(s => s.code)
      expect(codes).toContain('FS-01')
      expect(codes).not.toContain('HC-01')
    })

    it('combines multiple filters', () => {
      const results = filterSolutions(ALL_SOLUTIONS, { objective: 'Optimise', office: 'Back Office' })
      expect(results).toHaveLength(2)
    })
  })

  describe('buildSolutionUrl', () => {
    it('builds correct handoff URL', () => {
      const url = buildSolutionUrl('meridian', 'HC-01')
      expect(url).toBe('/diagnose?client=meridian&solution=HC-01')
    })

    it('encodes spaces in client names', () => {
      const url = buildSolutionUrl('first capital', 'FS-01')
      expect(url).toContain('first%20capital')
    })
  })

  describe('objectiveColor', () => {
    it('returns green for Grow', () => {
      expect(objectiveColor('Grow')).toBe('#34D399')
    })
    it('returns amber for Optimise', () => {
      expect(objectiveColor('Optimise')).toBe('#FBBF24')
    })
    it('returns indigo for Protect', () => {
      expect(objectiveColor('Protect')).toBe('#818CF8')
    })
  })
})

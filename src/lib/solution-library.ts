// Solution Library — pure business logic functions
// Tested in src/__tests__/behaviors/solution-library.test.ts

export type SolutionObjective = 'Grow' | 'Optimise' | 'Protect'
export type SolutionOffice = 'Front Office' | 'Middle Office' | 'Back Office'
export type SolutionVertical = 'Healthcare' | 'Financial Services' | 'Retail' | 'All'

export type Solution = {
  code: string
  objective: SolutionObjective
  office: SolutionOffice
  vertical: SolutionVertical
  name: string
}

export type SolutionFilter = {
  objective?: SolutionObjective
  office?: SolutionOffice
  vertical?: SolutionVertical
}

// Filter solutions by active criteria
export function filterSolutions(solutions: Solution[], filter: SolutionFilter): Solution[] {
  return solutions.filter(s => {
    if (filter.objective && s.objective !== filter.objective) return false
    if (filter.office && s.office !== filter.office) return false
    if (filter.vertical && filter.vertical !== 'All') {
      if (s.vertical !== filter.vertical && s.vertical !== 'All') return false
    }
    return true
  })
}

// Build the solution handoff URL
export function buildSolutionUrl(client: string, solutionCode: string): string {
  return `/diagnose?client=${encodeURIComponent(client)}&solution=${encodeURIComponent(solutionCode)}`
}

// Get objective bar color
export function objectiveColor(objective: SolutionObjective): string {
  const colors: Record<SolutionObjective, string> = {
    Grow: '#34D399',
    Optimise: '#FBBF24',
    Protect: '#818CF8',
  }
  return colors[objective]
}

// Role-weighted issue sorting for Situation Intelligence

export const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
  CIO:     { technology: 5, ai: 5, vendor: 4, digital: 4, financial: 2, clinical: 1, workforce: 2 },
  CFO:     { financial: 5, rcm: 5, revenue: 5, cost: 5, vendor: 3, technology: 2, clinical: 1 },
  CMIO:    { clinical: 5, quality: 5, epic: 5, prior_auth: 5, ai: 3, workforce: 3, financial: 1 },
  COO:     { operations: 5, workforce: 5, throughput: 4, clinical: 3, financial: 3, technology: 2 },
  CEO:     { financial: 4, strategic: 5, risk: 4, clinical: 3, technology: 3, workforce: 3 },
  CMO:     { digital: 5, revenue: 5, ai: 4, vendor: 3, financial: 3, operations: 2, technology: 2 },
  Maestro: { financial: 3, clinical: 3, technology: 3, ai: 3, workforce: 3, vendor: 3 },
}

interface IssueBase {
  category: string
  severity: 'critical' | 'warning' | 'watch'
}

export function filterIssuesByRole<T extends IssueBase>(
  issues: T[],
  role: string,
  _client: string,
): T[] {
  const weights = ROLE_WEIGHTS[role] ?? ROLE_WEIGHTS['CEO']
  return [...issues].sort((a, b) => {
    const sevMult = (s: string) => (s === 'critical' ? 3 : s === 'warning' ? 2 : 1)
    const aScore = (weights[a.category] ?? 1) * sevMult(a.severity)
    const bScore = (weights[b.category] ?? 1) * sevMult(b.severity)
    return bScore - aScore
  })
}

import { ROLE_WEIGHTS, filterIssuesByRole } from '@/lib/situation-intelligence'

const MERIDIAN_ISSUES = [
  { id: 'M01', severity: 'critical' as const, category: 'rcm',       title: 'RCM Denial Rate', body: '', impact: '', owner: '', roles: [] },
  { id: 'M02', severity: 'critical' as const, category: 'ai',        title: 'CDO Vacant',      body: '', impact: '', owner: '', roles: [] },
  { id: 'M03', severity: 'critical' as const, category: 'workforce', title: 'Travel Nurse',    body: '', impact: '', owner: '', roles: [] },
  { id: 'M04', severity: 'warning'  as const, category: 'epic',      title: 'Epic Score',      body: '', impact: '', owner: '', roles: [] },
  { id: 'M05', severity: 'warning'  as const, category: 'prior_auth',title: 'Prior Auth',      body: '', impact: '', owner: '', roles: [] },
  { id: 'M06', severity: 'warning'  as const, category: 'clinical',  title: 'MA Star',         body: '', impact: '', owner: '', roles: [] },
  { id: 'M07', severity: 'watch'    as const, category: 'ai',        title: 'AI Pilots',       body: '', impact: '', owner: '', roles: [] },
]

describe('ROLE_WEIGHTS', () => {
  it('defines all expected roles', () => {
    expect(Object.keys(ROLE_WEIGHTS)).toEqual(
      expect.arrayContaining(['CIO', 'CFO', 'CMIO', 'COO', 'CEO', 'CMO', 'Maestro'])
    )
  })

  it('CIO weights technology and ai highest', () => {
    expect(ROLE_WEIGHTS.CIO.technology).toBe(5)
    expect(ROLE_WEIGHTS.CIO.ai).toBe(5)
  })

  it('CFO weights rcm and financial highest', () => {
    expect(ROLE_WEIGHTS.CFO.rcm).toBe(5)
    expect(ROLE_WEIGHTS.CFO.financial).toBe(5)
  })

  it('CMIO weights epic and prior_auth highest', () => {
    expect(ROLE_WEIGHTS.CMIO.epic).toBe(5)
    expect(ROLE_WEIGHTS.CMIO.prior_auth).toBe(5)
  })
})

describe('filterIssuesByRole', () => {
  it('CIO top issue is ai/critical (CDO Vacant)', () => {
    const result = filterIssuesByRole(MERIDIAN_ISSUES, 'CIO', 'meridian')
    expect(result[0].id).toBe('M02')
  })

  it('CFO top issue is rcm/critical (RCM Denial Rate)', () => {
    const result = filterIssuesByRole(MERIDIAN_ISSUES, 'CFO', 'meridian')
    expect(result[0].id).toBe('M01')
  })

  it('CMIO top issue is not M01 or M02', () => {
    const result = filterIssuesByRole(MERIDIAN_ISSUES, 'CMIO', 'meridian')
    expect(result[0].id).not.toBe('M01')
    expect(result[0].id).not.toBe('M02')
  })

  it('CIO top !== CFO top !== CMIO top (role switcher produces different results)', () => {
    const cioTop = filterIssuesByRole(MERIDIAN_ISSUES, 'CIO', 'meridian')[0].id
    const cfoTop = filterIssuesByRole(MERIDIAN_ISSUES, 'CFO', 'meridian')[0].id
    const cmioTop = filterIssuesByRole(MERIDIAN_ISSUES, 'CMIO', 'meridian')[0].id
    expect(cioTop).not.toBe(cfoTop)
    expect(cioTop).not.toBe(cmioTop)
    expect(cfoTop).not.toBe(cmioTop)
  })

  it('returns all issues (no filtering, only sorting)', () => {
    const result = filterIssuesByRole(MERIDIAN_ISSUES, 'CFO', 'meridian')
    expect(result).toHaveLength(MERIDIAN_ISSUES.length)
  })

  it('falls back to CEO weights for unknown role', () => {
    const result = filterIssuesByRole(MERIDIAN_ISSUES, 'UNKNOWN', 'meridian')
    expect(result).toHaveLength(MERIDIAN_ISSUES.length)
  })

  it('does not mutate original array', () => {
    const original = [...MERIDIAN_ISSUES]
    filterIssuesByRole(MERIDIAN_ISSUES, 'CIO', 'meridian')
    expect(MERIDIAN_ISSUES[0].id).toBe(original[0].id)
  })

  it('critical issues score higher than warning for same category', () => {
    const issues = [
      { id: 'W', severity: 'warning' as const, category: 'ai', title: '', body: '', impact: '', owner: '', roles: [] },
      { id: 'C', severity: 'critical' as const, category: 'ai', title: '', body: '', impact: '', owner: '', roles: [] },
    ]
    const result = filterIssuesByRole(issues, 'CIO', 'meridian')
    expect(result[0].id).toBe('C')
  })

  it('CMO top issue at apexretail is digital/critical (Cart Abandonment)', () => {
    const apexIssues = [
      { id: 'AX01', severity: 'critical' as const, category: 'ai',        title: 'Einstein', body: '', impact: '', owner: '', roles: [] },
      { id: 'AX02', severity: 'critical' as const, category: 'digital',   title: 'Cart',     body: '', impact: '', owner: '', roles: [] },
      { id: 'AX03', severity: 'warning'  as const, category: 'operations',title: 'Inv',      body: '', impact: '', owner: '', roles: [] },
      { id: 'AX04', severity: 'warning'  as const, category: 'technology',title: 'Shadow',   body: '', impact: '', owner: '', roles: [] },
    ]
    // CMO: digital:5 > ai:4, both critical → digital wins
    const result = filterIssuesByRole(apexIssues, 'CMO', 'apexretail')
    expect(result[0].id).toBe('AX02')
  })
})

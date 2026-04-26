import {
  buildLiveCiStatusStubReport,
  getLiveCiStatusProviders,
  type LiveCiStatusStubReport,
  type CiProviderStub,
} from '@/lib/admin/live-ci-status-stub'

describe('buildLiveCiStatusStubReport', () => {
  let report: LiveCiStatusStubReport

  beforeEach(() => {
    report = buildLiveCiStatusStubReport()
  })

  it('returns a non-null report', () => {
    expect(report).not.toBeNull()
  })

  it('returns an object', () => {
    expect(typeof report).toBe('object')
  })

  it('stubMode is "stub"', () => {
    expect(report.stubMode).toBe('stub')
  })

  it('notTrueLiveMonitoring is true', () => {
    expect(report.notTrueLiveMonitoring).toBe(true)
  })

  it('remainDeferred is true', () => {
    expect(report.remainDeferred).toBe(true)
  })

  it('createdFrom is "prod6_live_ci_status_stub"', () => {
    expect(report.createdFrom).toBe('prod6_live_ci_status_stub')
  })

  it('providers array has exactly 2 entries', () => {
    expect(report.providers).toHaveLength(2)
  })

  it('providers includes github_actions', () => {
    const providers = report.providers.map((p) => p.provider)
    expect(providers).toContain('github_actions')
  })

  it('providers includes vercel', () => {
    const providers = report.providers.map((p) => p.provider)
    expect(providers).toContain('vercel')
  })

  it('each provider has tokenConfigured === false', () => {
    for (const provider of report.providers) {
      expect(provider.tokenConfigured).toBe(false)
    }
  })

  it('each provider has stubMode === "stub"', () => {
    for (const provider of report.providers) {
      expect(provider.stubMode).toBe('stub')
    }
  })

  it('unifiedControlPlaneNote contains "unified control plane"', () => {
    expect(report.unifiedControlPlaneNote.toLowerCase()).toContain('unified control plane')
  })

  it('unifiedControlPlaneNote contains "not true live monitoring"', () => {
    expect(report.unifiedControlPlaneNote.toLowerCase()).toContain('not true live monitoring')
  })

  it('unifiedControlPlaneNote contains "remain deferred"', () => {
    expect(report.unifiedControlPlaneNote.toLowerCase()).toContain('remain deferred')
  })

  it('unifiedControlPlaneNote contains "github checks"', () => {
    expect(report.unifiedControlPlaneNote.toLowerCase()).toContain('github checks')
  })

  it('unifiedControlPlaneNote contains "vercel deployments"', () => {
    expect(report.unifiedControlPlaneNote.toLowerCase()).toContain('vercel deployments')
  })

  it('generatedAt is a valid ISO date string', () => {
    const date = new Date(report.generatedAt)
    expect(date.toISOString()).toBe(report.generatedAt)
  })

  it('generatedAt matches expected format YYYY-MM-DDTHH:mm:ss.sssZ', () => {
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('is deterministic — two calls return identical reports', () => {
    const r2 = buildLiveCiStatusStubReport()
    expect(JSON.stringify(report)).toBe(JSON.stringify(r2))
  })

  it('github_actions provider has a non-empty wouldPollEndpoint', () => {
    const gh = report.providers.find((p) => p.provider === 'github_actions')!
    expect(gh.wouldPollEndpoint.length).toBeGreaterThan(0)
  })

  it('vercel provider has a non-empty wouldPollEndpoint', () => {
    const v = report.providers.find((p) => p.provider === 'vercel')!
    expect(v.wouldPollEndpoint.length).toBeGreaterThan(0)
  })

  it('github_actions provider requiredEnvVar is set', () => {
    const gh = report.providers.find((p) => p.provider === 'github_actions')!
    expect(gh.requiredEnvVar).toBeTruthy()
  })

  it('vercel provider requiredEnvVar is set', () => {
    const v = report.providers.find((p) => p.provider === 'vercel')!
    expect(v.requiredEnvVar).toBeTruthy()
  })

  it('each provider has a non-empty note', () => {
    for (const provider of report.providers) {
      expect(provider.note.length).toBeGreaterThan(0)
    }
  })

  it('each provider has a lastStubRefreshedAt that is ISO-shaped', () => {
    for (const provider of report.providers) {
      expect(provider.lastStubRefreshedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    }
  })
})

describe('getLiveCiStatusProviders', () => {
  it('returns same providers as the report', () => {
    const report = buildLiveCiStatusStubReport()
    const standalone = getLiveCiStatusProviders()
    expect(JSON.stringify(standalone)).toBe(JSON.stringify(report.providers))
  })

  it('returns exactly 2 providers', () => {
    expect(getLiveCiStatusProviders()).toHaveLength(2)
  })

  it('is deterministic across calls', () => {
    const first = getLiveCiStatusProviders()
    const second = getLiveCiStatusProviders()
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })
})

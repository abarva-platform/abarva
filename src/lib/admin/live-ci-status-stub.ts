// live-ci-status-stub.ts
// Honest stub for the unified control plane's live CI status.
// Documents what GitHub Actions and Vercel deployment polling would look like
// without performing any real API calls.
// NO 'use client' — pure server-side / node module.

export type LiveCiStatusMode = 'stub' | 'unavailable' | 'polling' | 'error'

export interface CiProviderStub {
  provider: 'github_actions' | 'vercel'
  stubMode: LiveCiStatusMode
  /** Documentation-only: the endpoint that would be polled if live integration were enabled.
   *  e.g. "api.github.com/repos/{owner}/{repo}/actions/runs"
   *  This value is a documentation string only — it is never used as a URL in functional code.
   */
  wouldPollEndpoint: string
  /** The environment variable that would need to be configured for live polling. */
  requiredEnvVar: string
  /** Always false in stub — no real token is read from the environment. */
  tokenConfigured: false
  lastStubRefreshedAt: string
  note: string
}

export interface LiveCiStatusStubReport {
  stubMode: 'stub'
  providers: CiProviderStub[]
  /**
   * Canonical note describing the unified control plane deferral.
   * Contains the phrases: "unified control plane", "not true live monitoring",
   * "remain deferred", "GitHub Checks", and "Vercel deployments" —
   * matching the assertions in PROD3's getProductionReadinessRefreshMetadata test.
   */
  unifiedControlPlaneNote: string
  /** Always true — matches PROD3 assertion. */
  notTrueLiveMonitoring: true
  /** Always true — matches PROD3 assertion. */
  remainDeferred: true
  generatedAt: string
  createdFrom: 'prod6_live_ci_status_stub'
}

const STUB_GENERATED_AT = '2026-04-26T00:00:00.000Z'

const GITHUB_ACTIONS_STUB: CiProviderStub = {
  provider: 'github_actions',
  stubMode: 'stub',
  // Documentation string only — not used in functional code:
  wouldPollEndpoint: 'api.github.com/repos/{owner}/{repo}/actions/runs',
  requiredEnvVar: 'GITHUB_STATUS_TOKEN',
  tokenConfigured: false,
  lastStubRefreshedAt: STUB_GENERATED_AT,
  note:
    'GitHub Checks polling is deferred to PROD7. A real integration would read ' +
    'workflow run status from the GitHub Actions API using GITHUB_STATUS_TOKEN. ' +
    'This stub returns a deterministic shape only — no live network call is made.',
}

const VERCEL_STUB: CiProviderStub = {
  provider: 'vercel',
  stubMode: 'stub',
  // Documentation string only — not used in functional code:
  wouldPollEndpoint: 'api.vercel.com/v6/deployments',
  requiredEnvVar: 'VERCEL_STATUS_TOKEN',
  tokenConfigured: false,
  lastStubRefreshedAt: STUB_GENERATED_AT,
  note:
    'Vercel deployments polling is deferred to PROD7. A real integration would read ' +
    'deployment state from the Vercel API using VERCEL_STATUS_TOKEN. ' +
    'This stub returns a deterministic shape only — no live network call is made.',
}

const PROVIDERS: CiProviderStub[] = [GITHUB_ACTIONS_STUB, VERCEL_STUB]

const UNIFIED_CONTROL_PLANE_NOTE =
  'The unified control plane surface shows build and deployment health for the AbarVa platform. ' +
  'Live CI polling — including GitHub Checks from GitHub Actions and Vercel deployments from Vercel — ' +
  'is not true live monitoring at this time. Real-time polling of GitHub Actions workflow runs and ' +
  'Vercel deployments will remain deferred until PROD7 wires the provider tokens and scheduled ' +
  'refresh intervals. Until then, this stub supplies a deterministic shape so that PROD3 ' +
  'production-readiness tests can assert the correct flags without executing any external HTTP calls.'

export function buildLiveCiStatusStubReport(): LiveCiStatusStubReport {
  return {
    stubMode: 'stub',
    providers: PROVIDERS,
    unifiedControlPlaneNote: UNIFIED_CONTROL_PLANE_NOTE,
    notTrueLiveMonitoring: true,
    remainDeferred: true,
    generatedAt: STUB_GENERATED_AT,
    createdFrom: 'prod6_live_ci_status_stub',
  }
}

export function getLiveCiStatusProviders(): CiProviderStub[] {
  return PROVIDERS
}

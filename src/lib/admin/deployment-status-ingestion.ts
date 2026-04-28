/**
 * PROD4 Deployment Status Ingestion (V1)
 *
 * Honest, deterministic representation of GitHub / Vercel deployment status.
 *
 * V1 explicitly does NOT:
 *  - call any GitHub provider host
 *  - call any Vercel provider host
 *  - read or expose the value of any token
 *  - log, return, or stringify token values
 *  - mutate the production-readiness manifest
 *  - promote any component
 *
 * The only environment-aware behavior is to detect whether ingestion env tokens
 * are configured (via process.env presence checks). When tokens are absent we
 * return a deterministic 'unavailable' result. When tokens are present we
 * return 'configured' (NOT 'live') because no real polling is wired yet.
 *
 * `liveStatus` deliberately never takes the value 'live' in V1.
 */

export type DeploymentStatusProvider = 'github' | 'vercel';

export type DeploymentCheckStatus =
  | 'success'
  | 'failure'
  | 'in_progress'
  | 'queued'
  | 'cancelled'
  | 'skipped'
  | 'unknown';

export type DeploymentStatusLiveStatus = 'unavailable' | 'configured' | 'error';

export type DeploymentStatusSourceTag = 'github_vercel_optional';

export type DeploymentStatusCreatedFrom = 'deterministic_deployment_status_ingestion_seed';

export interface DeploymentStatusError {
  code: 'token_missing' | 'token_invalid' | 'ingestion_disabled' | 'unknown';
  message: string;
}

export interface DeploymentStatusSource {
  provider: DeploymentStatusProvider;
  envVarName: string;
  configured: boolean;
}

export interface DeploymentStatusResult {
  provider: DeploymentStatusProvider;
  liveStatus: DeploymentStatusLiveStatus;
  checkStatus: DeploymentCheckStatus;
  checkedAt: string | null;
  generatedAt: string;
  source: DeploymentStatusSourceTag;
  message: string;
  error: DeploymentStatusError | null;
  createdFrom: DeploymentStatusCreatedFrom;
}

export interface ProductionReadinessDeploymentSignal {
  generatedAt: string;
  source: DeploymentStatusSourceTag;
  liveStatus: DeploymentStatusLiveStatus;
  message: string;
  results: ReadonlyArray<DeploymentStatusResult>;
  sources: ReadonlyArray<DeploymentStatusSource>;
  createdFrom: DeploymentStatusCreatedFrom;
}

const SOURCE_TAG: DeploymentStatusSourceTag = 'github_vercel_optional';
const CREATED_FROM: DeploymentStatusCreatedFrom = 'deterministic_deployment_status_ingestion_seed';

/**
 * Canonical token env-var names. These are detected for presence ONLY.
 * The token value itself is never read into a variable, returned, logged, or stringified.
 */
const PROVIDER_TOKEN_ENV: Record<DeploymentStatusProvider, string> = {
  github: 'GITHUB_STATUS_TOKEN',
  vercel: 'VERCEL_STATUS_TOKEN',
};

const FALLBACK_GENERATED_AT = '2026-04-26T00:00:00.000Z';

/**
 * Returns a deterministic generatedAt without invoking new Date() or Date.now().
 * Allows test/runtime override via process.env.PROD4_FIXED_GENERATED_AT.
 */
export function getDeploymentStatusGeneratedAt(): string {
  const override = process.env.PROD4_FIXED_GENERATED_AT;
  if (typeof override === 'string' && override.length > 0) {
    return override;
  }
  return FALLBACK_GENERATED_AT;
}

/**
 * Token presence detection. Reads ONLY the typeof / length of the env var.
 * The value is never returned, logged, or copied.
 */
function isProviderConfigured(provider: DeploymentStatusProvider): boolean {
  const envName = PROVIDER_TOKEN_ENV[provider];
  const raw = process.env[envName];
  return typeof raw === 'string' && raw.length > 0;
}

export function getDeploymentStatusSources(): ReadonlyArray<DeploymentStatusSource> {
  const providers: ReadonlyArray<DeploymentStatusProvider> = ['github', 'vercel'];
  return providers.map((provider) => ({
    provider,
    envVarName: PROVIDER_TOKEN_ENV[provider],
    configured: isProviderConfigured(provider),
  }));
}

/**
 * Build an honest 'unavailable' deployment status struct for one provider.
 * Used when no token is configured. No external call is performed.
 */
export function buildDeploymentStatusUnavailable(
  provider: DeploymentStatusProvider,
  generatedAt: string = getDeploymentStatusGeneratedAt(),
): DeploymentStatusResult {
  return {
    provider,
    liveStatus: 'unavailable',
    checkStatus: 'unknown',
    checkedAt: null,
    generatedAt,
    source: SOURCE_TAG,
    message:
      provider === 'github'
        ? 'GitHub deployment status ingestion is unavailable: GITHUB_STATUS_TOKEN is not configured. PROD4 V1 does not call any GitHub provider host.'
        : 'Vercel deployment status ingestion is unavailable: VERCEL_STATUS_TOKEN is not configured. PROD4 V1 does not call any Vercel provider host.',
    error: {
      code: 'token_missing',
      message: `Environment variable ${PROVIDER_TOKEN_ENV[provider]} is not set; ingestion is intentionally not invoked.`,
    },
    createdFrom: CREATED_FROM,
  };
}

/**
 * Build a 'configured' deployment status struct (no real call performed).
 * V1 reports 'configured' rather than 'live' because no polling is wired.
 */
function buildDeploymentStatusConfigured(
  provider: DeploymentStatusProvider,
  generatedAt: string,
): DeploymentStatusResult {
  return {
    provider,
    liveStatus: 'configured',
    checkStatus: 'unknown',
    checkedAt: null,
    generatedAt,
    source: SOURCE_TAG,
    message:
      provider === 'github'
        ? 'GitHub deployment status token is configured. PROD4 V1 does not yet poll any GitHub provider host; live ingestion remains deferred.'
        : 'Vercel deployment status token is configured. PROD4 V1 does not yet poll any Vercel provider host; live ingestion remains deferred.',
    error: null,
    createdFrom: CREATED_FROM,
  };
}

/**
 * Returns one DeploymentStatusResult per supported provider.
 * Token presence drives 'unavailable' vs 'configured'. No external call is made.
 */
export function getDeploymentStatusResults(
  generatedAt: string = getDeploymentStatusGeneratedAt(),
): ReadonlyArray<DeploymentStatusResult> {
  const providers: ReadonlyArray<DeploymentStatusProvider> = ['github', 'vercel'];
  return providers.map((provider) =>
    isProviderConfigured(provider)
      ? buildDeploymentStatusConfigured(provider, generatedAt)
      : buildDeploymentStatusUnavailable(provider, generatedAt),
  );
}

/**
 * Roll up provider-level results into a single ProductionReadinessDeploymentSignal.
 *
 * Aggregate rules:
 *  - If any provider reports 'error'   → liveStatus 'error'.
 *  - Else if any provider is 'configured' → liveStatus 'configured'.
 *  - Else 'unavailable'.
 *
 * V1 NEVER returns 'live'.
 */
export function summarizeDeploymentStatus(
  results: ReadonlyArray<DeploymentStatusResult> = getDeploymentStatusResults(),
): ProductionReadinessDeploymentSignal {
  const generatedAt = results[0]?.generatedAt ?? getDeploymentStatusGeneratedAt();
  const sources = getDeploymentStatusSources();

  const hasError = results.some((result) => result.liveStatus === 'error');
  const hasConfigured = results.some((result) => result.liveStatus === 'configured');

  const liveStatus: DeploymentStatusLiveStatus = hasError
    ? 'error'
    : hasConfigured
      ? 'configured'
      : 'unavailable';

  const message = buildSummaryMessage(liveStatus, results);

  return {
    generatedAt,
    source: SOURCE_TAG,
    liveStatus,
    message,
    results,
    sources,
    createdFrom: CREATED_FROM,
  };
}

function buildSummaryMessage(
  liveStatus: DeploymentStatusLiveStatus,
  results: ReadonlyArray<DeploymentStatusResult>,
): string {
  if (liveStatus === 'unavailable') {
    return 'Deployment status ingestion is unavailable: no provider tokens are configured. PROD4 V1 does not call GitHub or Vercel.';
  }
  if (liveStatus === 'configured') {
    const configuredProviders = results
      .filter((result) => result.liveStatus === 'configured')
      .map((result) => result.provider)
      .join(', ');
    return `Deployment status tokens are configured for: ${configuredProviders}. PROD4 V1 still does not poll provider APIs; live ingestion remains deferred.`;
  }
  return 'Deployment status ingestion reported an error for at least one provider. PROD4 V1 does not call provider APIs; this state is reserved for future ingestion failures.';
}

/**
 * Public, side-effect-free merge helper. Returns a new view payload with the
 * deployment signal attached under `deploymentStatus`. The caller decides
 * whether to actually surface this in the production-readiness API. This
 * helper does NOT mutate the input view and does NOT change readiness scoring.
 */
export function mergeDeploymentStatusIntoReadinessView<T extends Record<string, unknown>>(
  view: T,
  signal: ProductionReadinessDeploymentSignal,
): T & { deploymentStatus: ProductionReadinessDeploymentSignal } {
  return {
    ...view,
    deploymentStatus: signal,
  };
}

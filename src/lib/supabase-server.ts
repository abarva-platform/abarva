import {
  getAzureReadFluentClient,
  type PostgresCompatClient,
} from './data-plane/postgresCompat';

export {
  isConnectionFallbackError,
  resolvePostgresPoolMax,
  resolveDatabaseUrlCandidates,
  runtimePostgresPoolConfig,
} from './data-plane/postgresCompat';
export {
  maskConnectionString,
  normalizeTenantConnectionToken,
  resolveDatabaseUrlCandidatesForScope,
  resolveTenantDatabaseConnection,
  tenantConnectionScopeFromEnv,
  tenantDatabaseEnvNamesForScope,
} from './data-plane/tenantConnectionResolver';
export type { PostgresCompatClient } from './data-plane/postgresCompat';
export type {
  TenantConnectionResolution,
  TenantConnectionResolutionOptions,
  TenantConnectionScope,
  TenantConnectionStatus,
} from './data-plane/tenantConnectionResolver';

/**
 * Compatibility alias retained during the Supabase-to-Postgres retirement.
 * New code should use direct Postgres adapters; this helper no longer creates
 * or depends on a Supabase client, URL, anon key, service-role key, or JWT.
 */
export function getServerSupabase(): PostgresCompatClient {
  return getAzureReadFluentClient();
}

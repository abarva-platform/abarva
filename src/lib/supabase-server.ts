import {
  getAzureReadFluentClient,
  type PostgresCompatClient,
} from './data-plane/postgresCompat';

export {
  isConnectionFallbackError,
  resolveDatabaseUrlCandidates,
} from './data-plane/postgresCompat';
export type { PostgresCompatClient } from './data-plane/postgresCompat';

/**
 * Compatibility alias retained during the Supabase-to-Postgres retirement.
 * New code should use direct Postgres adapters; this helper no longer creates
 * or depends on a Supabase client, URL, anon key, service-role key, or JWT.
 */
export function getServerSupabase(): PostgresCompatClient {
  return getAzureReadFluentClient();
}

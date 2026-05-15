// Neo4j feature-flag gate · graph_neo4j_enabled (default OFF)
//
// Postgres `enterprise_graph_nodes` / `enterprise_graph_edges` are the real
// system of record for the relationship graph. Neo4j is kept as a driver +
// Cypher migrations but is unhealthy in Azure and on the path to removal.
//
// Every Neo4j entry point in this codebase asks `isNeo4jEnabled()` first.
// When the flag is OFF (the default) the call returns the equivalent
// "empty / fallback" shape without loading the driver — see
// `src/lib/graph/driver.ts` for the matching lazy-import.
//
// The deprecation plan is captured in
// `docs/architecture/azure/NEO4J-DEPRECATION-PLAN.md`.

import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

/**
 * Process-wide override for tests and the rare opt-in lab environment
 * that wants to re-introduce Neo4j without flipping the registry. Set
 * via `setNeo4jEnabledOverride()` from test code or boot scripts; never
 * read from a request context.
 */
let neo4jEnabledOverride: boolean | null = null;

/**
 * Test-only helper that flips the gate without editing the registry. Call
 * with `null` to clear the override. Production code MUST NOT call this.
 */
export function setNeo4jEnabledOverride(value: boolean | null): void {
  neo4jEnabledOverride = value;
}

/**
 * Server-side check used by every Neo4j entry point. Returns true only
 * when the `graph_neo4j_enabled` flag is on for the current request.
 *
 * Most graph call sites have no tenancy context — they are invoked from
 * scripts, sync jobs, or shared helpers. In that case the flag falls to
 * its registry default (OFF), which is exactly what we want.
 *
 * Pass a tenancy context only when you have one and want per-tenant
 * opt-in. Otherwise omit it.
 */
export function isNeo4jEnabled(
  ctx?: { clientKey?: string | null; clientId?: string | null } | null,
): boolean {
  if (neo4jEnabledOverride !== null) return neo4jEnabledOverride;
  return isFeatureEnabled(ctx ?? null, 'graph_neo4j_enabled');
}

/**
 * Log helper — used at gated call sites so the operator can see that a
 * graph traversal is degrading to its Postgres / seed fallback because
 * Neo4j is off. Keep the message stable; it shows up in production logs.
 */
export function logNeo4jSkipped(callSite: string): void {
  // eslint-disable-next-line no-console
  console.info(
    `[neo4j-gate] ${callSite}: graph_neo4j_enabled is OFF; using fallback.`,
  );
}

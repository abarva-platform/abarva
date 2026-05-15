// Neo4j driver factory · gated by `graph_neo4j_enabled` (default OFF).
//
// The driver is dynamically imported so that when the flag is off the
// `neo4j-driver` module is never loaded at boot — no connection attempt,
// no module-side effects. Once the deprecation plan reaches Phase C,
// this whole file can be deleted along with `neo4j-driver` itself.

import type { Driver, Session } from 'neo4j-driver';

import { isNeo4jEnabled, logNeo4jSkipped } from './neo4j-gate';

let driver: Driver | null = null;

/**
 * Thrown when a Neo4j entry point is reached with the
 * `graph_neo4j_enabled` flag off. Call sites should catch this and
 * fall back to the Postgres/seed equivalent — never propagate it.
 */
export class Neo4jDisabledError extends Error {
  constructor(callSite: string) {
    super(
      `Neo4j is disabled (graph_neo4j_enabled=false). Caller: ${callSite}.`,
    );
    this.name = 'Neo4jDisabledError';
  }
}

/**
 * Async driver accessor. Returns `null` when the gate is off, otherwise
 * lazily imports `neo4j-driver` and opens the singleton driver.
 *
 * Prefer `withGraphSession()` at call sites — it handles flag-off,
 * session lifetime, and fallback in one shot.
 */
export async function getGraphDriverIfEnabled(
  ctx?: { clientKey?: string | null; clientId?: string | null } | null,
): Promise<Driver | null> {
  if (!isNeo4jEnabled(ctx)) return null;
  if (driver) return driver;
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !username || !password) {
    throw new Error('Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD');
  }
  const neo4jModule = await import('neo4j-driver');
  const neo4j = neo4jModule.default;
  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

/**
 * Back-compat sync accessor used by code paths that still expect a
 * Driver synchronously. Throws `Neo4jDisabledError` when the flag is off
 * so call sites can catch and degrade. Prefer `getGraphDriverIfEnabled`
 * for new code.
 *
 * The first call must come from inside an `await getGraphDriverIfEnabled()`
 * code path (so the lazy import has already loaded the module) — or the
 * caller must accept that the first invocation will throw because the
 * sync path cannot perform a dynamic import.
 */
export function getGraphDriver(): Driver {
  if (!isNeo4jEnabled()) {
    throw new Neo4jDisabledError('getGraphDriver()');
  }
  if (!driver) {
    throw new Error(
      'Neo4j driver not initialized. Call getGraphDriverIfEnabled() first.',
    );
  }
  return driver;
}

/**
 * Run `fn` against a Neo4j session if the gate is on; otherwise return
 * `fallback` after logging the skip. This is the only entry point most
 * call sites should use.
 */
export async function withGraphSession<T>(
  callSite: string,
  fn: (session: Session) => Promise<T>,
  fallback: T,
  ctx?: { clientKey?: string | null; clientId?: string | null } | null,
): Promise<T> {
  const activeDriver = await getGraphDriverIfEnabled(ctx);
  if (!activeDriver) {
    logNeo4jSkipped(callSite);
    return fallback;
  }
  const session = activeDriver.session();
  try {
    return await fn(session);
  } finally {
    await session.close().catch(() => undefined);
  }
}

export async function closeGraphDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

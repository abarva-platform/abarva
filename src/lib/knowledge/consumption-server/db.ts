/**
 * Governed read seam for the consumption layer. Pooled pg client following the
 * repo's canonical pattern (cf. src/lib/tower/value-states/db.ts). READ-ONLY by
 * intent: the consumption API only SELECTs from publication.* / consumption.*.
 *
 * Boundary note: this reader lives inside src/lib/knowledge/** so app-tier
 * routes reach the data plane through the knowledge boundary, not by importing
 * pg/tenant-data directly (feedback_broker_boundary).
 */

import { ManagedIdentityCredential } from "@azure/identity";
import { Pool, type PoolClient, type PoolConfig } from "pg";
import {
  maskConnectionString,
  normalizeTenantConnectionToken,
  resolveTenantDatabaseConnection,
} from "@/lib/data-plane/tenantConnectionResolver";
import {
  resolvePostgresPoolMax,
  runtimePostgresPoolConfig,
} from "@/lib/data-plane/postgresCompat";

/** Minimal query surface — injectable so the reader is unit-testable without a DB. */
export interface ConsumptionQuery {
  rows<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
}

const pools = new Map<string, Pool>();
const POSTGRES_AAD_RESOURCE =
  "https://ossrdbms-aad.database.windows.net/.default";

function poolKey(config: PoolConfig, applicationName: string): string {
  if (config.connectionString)
    return `${applicationName}:${maskConnectionString(config.connectionString)}`;
  return `${applicationName}:${config.user ?? "unknown"}@${config.host ?? "unknown"}/${config.database ?? "unknown"}`;
}

function getConsumptionPool(config: PoolConfig, applicationName: string): Pool {
  const key = poolKey(config, applicationName);
  const existing = pools.get(key);
  if (existing) return existing;
  const pool = new Pool({ ...config, application_name: applicationName });
  pools.set(key, pool);
  return pool;
}

function resolveSharedConsumptionConnection(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for shared consumption reads.");
  }
  return connectionString;
}

export interface ResolvedConsumptionDatabase {
  readonly config: PoolConfig;
  readonly sourceEnvName: string;
  readonly maskedConnectionString: string;
}

function tenantScopedEnvName(tenantKey: string, suffix: string): string {
  const token = normalizeTenantConnectionToken(tenantKey);
  if (!token)
    throw new Error(
      `Invalid tenant key for consumption database config: ${tenantKey}`,
    );
  return `ABARVA_TENANT_${suffix}_${token}`;
}

async function postgresAadAccessToken(clientId: string): Promise<string> {
  const credential = new ManagedIdentityCredential(clientId);
  const token = await credential.getToken(POSTGRES_AAD_RESOURCE);
  if (!token?.token)
    throw new Error(
      "Azure Postgres Entra token response did not include an access token.",
    );
  return token.token;
}

function resolveTenantHostConfig(
  tenantKey: string,
  env: NodeJS.ProcessEnv,
): ResolvedConsumptionDatabase | null {
  const hostEnv = tenantScopedEnvName(tenantKey, "PGHOST");
  const userEnv = tenantScopedEnvName(tenantKey, "PGUSER");
  const databaseEnv = tenantScopedEnvName(tenantKey, "PGDATABASE");
  const aadClientEnv = tenantScopedEnvName(tenantKey, "POSTGRES_AAD_CLIENT_ID");
  const passwordEnv = tenantScopedEnvName(tenantKey, "PGPASSWORD");

  const host = env[hostEnv]?.trim();
  const user = env[userEnv]?.trim();
  const database = env[databaseEnv]?.trim();
  const aadClientId = env[aadClientEnv]?.trim();
  const password = env[passwordEnv]?.trim();

  if (!host && !user && !database && !aadClientId && !password) return null;

  const missing = [
    [hostEnv, host],
    [userEnv, user],
    [databaseEnv, database],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (!password && !aadClientId)
    missing.push(`${passwordEnv} or ${aadClientEnv}`);
  if (missing.length > 0) {
    throw new Error(
      `Incomplete tenant-scoped Postgres config for ${tenantKey}; missing ${missing.join(", ")}.`,
    );
  }

  const port = Number.parseInt(
    env[tenantScopedEnvName(tenantKey, "PGPORT")] ?? "5432",
    10,
  );
  const sslMode =
    env[tenantScopedEnvName(tenantKey, "PGSSLMODE")]?.trim() ?? "require";
  return {
    config: {
      host,
      port: Number.isFinite(port) ? port : 5432,
      user,
      database,
      password: password || (async () => postgresAadAccessToken(aadClientId!)),
      max: resolvePostgresPoolMax(env),
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
      ssl: sslMode === "disable" ? false : { rejectUnauthorized: false },
    },
    sourceEnvName: aadClientId ? aadClientEnv : passwordEnv,
    maskedConnectionString: `postgresql://${user}@${host}:${Number.isFinite(port) ? port : 5432}/${database}`,
  };
}

export function resolveConsumptionDatabaseForTenant(
  tenantKey: string,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedConsumptionDatabase {
  const hostConfig = resolveTenantHostConfig(tenantKey, env);
  if (hostConfig) return hostConfig;

  const resolution = resolveTenantDatabaseConnection(
    { clientKey: tenantKey },
    env,
    { allowSharedFallback: false },
  );
  const connectionString = resolution.candidates[0]?.trim();
  const sourceEnvName = resolution.sourceEnvNames[0];
  if (!connectionString || !sourceEnvName) {
    const attempted = resolution.attemptedEnvNames.length
      ? resolution.attemptedEnvNames.join(", ")
      : "none";
    throw new Error(
      `Tenant-scoped consumption database URL is required for ${tenantKey}; ` +
        `refusing shared DATABASE_URL fallback. Attempted env: ${attempted}.`,
    );
  }
  return {
    config: runtimePostgresPoolConfig(
      connectionString,
      `nexus-knowledge-consumption-${tenantKey}`,
    ),
    sourceEnvName,
    maskedConnectionString:
      resolution.maskedCandidates[0] ?? maskConnectionString(connectionString),
  };
}

async function withClient<T>(
  config: PoolConfig,
  applicationName: string,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getConsumptionPool(config, applicationName).connect();
  try {
    // Belt-and-braces: this connection is read-only for the request's lifetime.
    await client.query("SET TRANSACTION READ ONLY").catch(() => undefined);
    return await fn(client);
  } finally {
    client.release();
  }
}

export function createPgConsumptionQuery(
  config: PoolConfig,
  applicationName = "nexus-knowledge-consumption",
): ConsumptionQuery {
  return {
    async rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      return withClient(config, applicationName, async (c) => {
        const r = await c.query(sql, params);
        return r.rows as T[];
      });
    },
  };
}

export function createTenantScopedConsumptionQuery(
  tenantKey: string,
  env: NodeJS.ProcessEnv = process.env,
): ConsumptionQuery {
  const resolved = resolveConsumptionDatabaseForTenant(tenantKey, env);
  return createPgConsumptionQuery(
    resolved.config,
    `nexus-knowledge-consumption-${tenantKey}`,
  );
}

/** The legacy/shared pg-backed query implementation for non-foundation tenants. */
export const pgConsumptionQuery: ConsumptionQuery = {
  async rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return withClient(
      runtimePostgresPoolConfig(
        resolveSharedConsumptionConnection(),
        "nexus-knowledge-consumption",
      ),
      "nexus-knowledge-consumption",
      async (c) => {
        const r = await c.query(sql, params);
        return r.rows as T[];
      },
    );
  },
};

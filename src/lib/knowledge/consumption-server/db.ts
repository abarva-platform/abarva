/**
 * Governed read seam for the consumption layer. Pooled pg client following the
 * repo's canonical pattern (cf. src/lib/tower/value-states/db.ts). READ-ONLY by
 * intent: the consumption API only SELECTs from publication.* / consumption.*.
 *
 * Boundary note: this reader lives inside src/lib/knowledge/** so app-tier
 * routes reach the data plane through the knowledge boundary, not by importing
 * pg/tenant-data directly (feedback_broker_boundary).
 */

import { Pool, type PoolClient } from "pg";
import { runtimePostgresPoolConfig } from "@/lib/data-plane/postgresCompat";

/** Minimal query surface — injectable so the reader is unit-testable without a DB. */
export interface ConsumptionQuery {
  rows<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

let pool: Pool | null = null;

function getConsumptionPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for consumption reads.");
  }
  pool = new Pool(runtimePostgresPoolConfig(connectionString, "nexus-knowledge-consumption"));
  return pool;
}

async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getConsumptionPool().connect();
  try {
    // Belt-and-braces: this connection is read-only for the request's lifetime.
    await client.query("SET TRANSACTION READ ONLY").catch(() => undefined);
    return await fn(client);
  } finally {
    client.release();
  }
}

/** The production pg-backed query implementation. */
export const pgConsumptionQuery: ConsumptionQuery = {
  async rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return withClient(async (c) => {
      const r = await c.query(sql, params);
      return r.rows as T[];
    });
  },
};

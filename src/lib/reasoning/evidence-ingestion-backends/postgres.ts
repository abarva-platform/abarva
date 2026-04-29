/**
 * Postgres evidence-ingestion backend.
 *
 * Persists evidence ingestions to the `reasoning_evidence_ingestions` table
 * (migration 20260428190000) using the `pg` driver with a connection string
 * from `DATABASE_URL`. Wired by `evidence-ingestion-init.ts` only when both
 *   - `process.env.DATABASE_URL` is set, AND
 *   - `process.env.REASONING_INGESTION_BACKEND === 'postgres'`
 * are true.
 *
 * Contract notes (from {@link EvidenceIngestionBackend}):
 *   - `write` and `clearForInstance` are best-effort. The store fires-and-
 *     forgets, so failures here cannot stall a request. We still swallow +
 *     log internally so errors surface in server logs.
 *   - The table uses an append-only BIGSERIAL primary key — every
 *     `addEvidence` call inserts a fresh row tagged with `instance_id` so the
 *     timeline can recover the ingestion order after a restart.
 *
 * Pure module: no top-level connections, no I/O on import.
 */

import type { EvidenceIngestionBackend } from '@/lib/reasoning/evidence-ingestion-store';

export interface PostgresSqlExecutor {
  query<TRow = unknown>(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<{ rows: TRow[] }>;
}

export type PostgresSqlExecutorFactory = () => PostgresSqlExecutor;

function defaultExecutorFactory(): PostgresSqlExecutor {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '[evidence-ingestion-backends/postgres] DATABASE_URL is required',
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg') as typeof import('pg');
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 4,
  });
}

const INSERT_SQL = `
  INSERT INTO reasoning_evidence_ingestions (
    instance_id, item
  ) VALUES (
    $1, $2
  )
`;

const DELETE_INSTANCE_SQL = `
  DELETE FROM reasoning_evidence_ingestions
   WHERE instance_id = $1
`;

export class PostgresEvidenceIngestionBackend implements EvidenceIngestionBackend {
  private readonly factory: PostgresSqlExecutorFactory;
  private executor: PostgresSqlExecutor | null = null;

  constructor(factory: PostgresSqlExecutorFactory = defaultExecutorFactory) {
    this.factory = factory;
  }

  private getExecutor(): PostgresSqlExecutor {
    if (!this.executor) {
      this.executor = this.factory();
    }
    return this.executor;
  }

  async write(instanceId: string, item: unknown): Promise<void> {
    try {
      const executor = this.getExecutor();
      // pg accepts a JS object as the JSONB binding — node-postgres
      // serializes it. Tests assert the binding is the original reference.
      await executor.query(INSERT_SQL, [instanceId, item]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[evidence-ingestion-backends/postgres] write failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async clearForInstance(instanceId: string): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(DELETE_INSTANCE_SQL, [instanceId]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[evidence-ingestion-backends/postgres] clearForInstance failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

export function createPostgresEvidenceIngestionBackend(
  factory?: PostgresSqlExecutorFactory,
): PostgresEvidenceIngestionBackend {
  return new PostgresEvidenceIngestionBackend(factory);
}

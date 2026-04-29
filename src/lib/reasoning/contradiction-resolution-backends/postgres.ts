/**
 * Postgres contradiction-resolution backend.
 *
 * Persists "marked resolved" contradiction ids to the
 * `reasoning_resolved_contradictions` table (migration 20260428190000) using
 * the `pg` driver with a connection string from `DATABASE_URL`. Wired by
 * `contradiction-resolution-init.ts` only when both
 *   - `process.env.DATABASE_URL` is set, AND
 *   - `process.env.REASONING_RESOLUTION_BACKEND === 'postgres'`
 * are true.
 *
 * Contract notes (from {@link ContradictionResolutionBackend}):
 *   - `mark` and `clearAll` are best-effort. The store fires-and-forgets, so
 *     failures here cannot stall a request. We still swallow + log internally.
 *   - `mark` uses `ON CONFLICT DO NOTHING` because the in-memory store
 *     enforces "first resolution wins" — re-marking the same id is a no-op.
 *
 * Pure module: no top-level connections, no I/O on import.
 */

import type { ContradictionResolutionBackend } from '@/lib/reasoning/contradiction-resolution-state';

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
      '[contradiction-resolution-backends/postgres] DATABASE_URL is required',
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
  INSERT INTO reasoning_resolved_contradictions (
    contradiction_id, resolved_at
  ) VALUES (
    $1, $2
  )
  ON CONFLICT (contradiction_id) DO NOTHING
`;

const CLEAR_ALL_SQL = `
  DELETE FROM reasoning_resolved_contradictions
`;

export class PostgresContradictionResolutionBackend
  implements ContradictionResolutionBackend
{
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

  async mark(id: string, timestamp: string): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(INSERT_SQL, [id, timestamp]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[contradiction-resolution-backends/postgres] mark failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async clearAll(): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(CLEAR_ALL_SQL);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[contradiction-resolution-backends/postgres] clearAll failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

export function createPostgresContradictionResolutionBackend(
  factory?: PostgresSqlExecutorFactory,
): PostgresContradictionResolutionBackend {
  return new PostgresContradictionResolutionBackend(factory);
}

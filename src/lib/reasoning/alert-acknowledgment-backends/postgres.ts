/**
 * Postgres alert-acknowledgment backend.
 *
 * Persists alert acknowledgment / dismissal entries to the
 * `reasoning_alert_states` table using the `pg` driver with a connection
 * string from `DATABASE_URL`. Wired by `alert-acknowledgment-init.ts` only
 * when both
 *   - `process.env.DATABASE_URL` is set, AND
 *   - `process.env.REASONING_ALERT_BACKEND === 'postgres'`
 * are true. Otherwise the in-memory-only default stays installed.
 *
 * Contract notes (from {@link AlertAcknowledgmentBackend}):
 *   - `write` and `clear` are best-effort. The store fires-and-forgets via
 *     `void backend.x().catch(() => {})`, so failures here cannot stall a
 *     request. We still swallow + log internally so errors surface in server
 *     logs without escaping the promise.
 *   - `write` is an UPSERT keyed on `alert_id` because the in-memory mutation
 *     happens first and idempotent re-marks need to win the row.
 *
 * Pure module: no top-level connections, no I/O on import. The pool is
 * created lazily on first call so tests can inject a mock SQL executor.
 */

import type {
  AlertAcknowledgmentBackend,
  AlertStatus,
} from '@/lib/reasoning/alert-acknowledgment-state';

/**
 * Minimal shape of the SQL executor we depend on. The real implementation is
 * `pg.Pool` (or `pg.Client`); tests inject a fake matching this signature.
 */
export interface PostgresSqlExecutor {
  query<TRow = unknown>(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<{ rows: TRow[] }>;
}

/** Factory returning a SQL executor. Defaults to a lazily-built pg.Pool. */
export type PostgresSqlExecutorFactory = () => PostgresSqlExecutor;

function defaultExecutorFactory(): PostgresSqlExecutor {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '[alert-acknowledgment-backends/postgres] DATABASE_URL is required',
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

const UPSERT_SQL = `
  INSERT INTO reasoning_alert_states (
    alert_id, status, timestamp, note
  ) VALUES (
    $1, $2, $3, $4
  )
  ON CONFLICT (alert_id) DO UPDATE SET
    status = EXCLUDED.status,
    timestamp = EXCLUDED.timestamp,
    note = EXCLUDED.note
`;

const DELETE_SQL = `
  DELETE FROM reasoning_alert_states
   WHERE alert_id = $1
`;

export class PostgresAlertAcknowledgmentBackend
  implements AlertAcknowledgmentBackend
{
  private readonly factory: PostgresSqlExecutorFactory;
  private executor: PostgresSqlExecutor | null = null;

  constructor(factory: PostgresSqlExecutorFactory = defaultExecutorFactory) {
    this.factory = factory;
  }

  /** Lazily resolve the SQL executor on first use. */
  private getExecutor(): PostgresSqlExecutor {
    if (!this.executor) {
      this.executor = this.factory();
    }
    return this.executor;
  }

  async write(state: {
    id: string;
    status: AlertStatus;
    timestamp: string;
    note?: string;
  }): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(UPSERT_SQL, [
        state.id,
        state.status,
        state.timestamp,
        state.note ?? null,
      ]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[alert-acknowledgment-backends/postgres] write failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async clear(id: string): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(DELETE_SQL, [id]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[alert-acknowledgment-backends/postgres] clear failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

/** Build a backend instance bound to the default `pg.Pool` factory. */
export function createPostgresAlertAcknowledgmentBackend(
  factory?: PostgresSqlExecutorFactory,
): PostgresAlertAcknowledgmentBackend {
  return new PostgresAlertAcknowledgmentBackend(factory);
}

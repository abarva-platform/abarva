/**
 * Postgres telemetry backend.
 *
 * Persists synthesis telemetry events to the `reasoning_telemetry_events`
 * table (migration 20260428180000) using the `pg` driver with a connection
 * string from `DATABASE_URL`. Wired by `telemetry-init.ts` only when both
 *   - `process.env.DATABASE_URL` is set, AND
 *   - `process.env.REASONING_TELEMETRY_BACKEND === 'postgres'`
 * are true. Otherwise the in-memory-extended backend stays installed.
 *
 * Contract notes (from {@link TelemetryBackend}):
 *   - `write` and `writeFeedback` are best-effort. `synthesis-telemetry.ts`
 *     fires-and-forgets via `void backend.x().catch(() => {})`, so failures
 *     here cannot stall a request. We still swallow + log internally so
 *     errors surface in server logs without escaping the promise.
 *   - `write` is an UPSERT keyed on `id` because the in-memory buffer write
 *     happens first; if a feedback signal raced ahead and fired before the
 *     row existed the UPSERT keeps the table consistent.
 *
 * Pure module: no top-level connections, no I/O on import. The pool is
 * created lazily on first call and held by the backend instance so tests
 * can inject a mock SQL executor.
 */

import type {
  SynthesisFeedback,
  SynthesisTelemetryEvent,
  TelemetryBackend,
} from '@/lib/reasoning/synthesis-telemetry';

/**
 * Minimal shape of the SQL executor we depend on. The real implementation
 * is `pg.Pool` (or `pg.Client`); tests inject a fake matching this signature.
 */
export interface PostgresSqlExecutor {
  query<TRow = unknown>(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<{ rows: TRow[] }>;
}

/** Factory returning a SQL executor. Defaults to a lazily-built pg.Pool. */
export type PostgresSqlExecutorFactory = () => PostgresSqlExecutor;

/**
 * Default factory — builds a `pg.Pool` against `DATABASE_URL`. Imported via
 * `require` so test files that mock `pg` see the mock and so loading the
 * module never opens a connection by accident.
 */
function defaultExecutorFactory(): PostgresSqlExecutor {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('[telemetry-backends/postgres] DATABASE_URL is required');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg') as typeof import('pg');
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    // Telemetry writes are tiny; keep the pool small.
    max: 4,
  });
}

const INSERT_SQL = `
  INSERT INTO reasoning_telemetry_events (
    id, timestamp, surface, instance_id, pattern_id,
    cache_hit, latency_ms, citation_count, contradiction_count,
    failure_mode_count, gate_count, feedback, feedback_timestamp
  ) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    $10, $11, $12, $13
  )
  ON CONFLICT (id) DO UPDATE SET
    timestamp = EXCLUDED.timestamp,
    surface = EXCLUDED.surface,
    instance_id = EXCLUDED.instance_id,
    pattern_id = EXCLUDED.pattern_id,
    cache_hit = EXCLUDED.cache_hit,
    latency_ms = EXCLUDED.latency_ms,
    citation_count = EXCLUDED.citation_count,
    contradiction_count = EXCLUDED.contradiction_count,
    failure_mode_count = EXCLUDED.failure_mode_count,
    gate_count = EXCLUDED.gate_count,
    feedback = COALESCE(EXCLUDED.feedback, reasoning_telemetry_events.feedback),
    feedback_timestamp = COALESCE(EXCLUDED.feedback_timestamp, reasoning_telemetry_events.feedback_timestamp)
`;

const UPDATE_FEEDBACK_SQL = `
  UPDATE reasoning_telemetry_events
     SET feedback = $2,
         feedback_timestamp = $3
   WHERE id = $1
`;

const SELECT_RECENT_SQL = `
  SELECT
    id,
    timestamp,
    surface,
    instance_id,
    pattern_id,
    cache_hit,
    latency_ms,
    citation_count,
    contradiction_count,
    failure_mode_count,
    gate_count,
    feedback,
    feedback_timestamp
  FROM reasoning_telemetry_events
  ORDER BY timestamp DESC
  LIMIT $1
`;

const DEFAULT_READ_LIMIT = 500;

interface RawTelemetryRow {
  id: string;
  timestamp: string | Date;
  surface: string;
  tenant_id?: string | null;
  instance_id: string;
  pattern_id: string | null;
  cache_hit: boolean;
  latency_ms: number;
  citation_count: number;
  contradiction_count: number;
  failure_mode_count: number;
  gate_count: number;
  feedback: string | null;
  feedback_timestamp: string | Date | null;
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToEvent(row: RawTelemetryRow): SynthesisTelemetryEvent {
  const event: SynthesisTelemetryEvent = {
    id: row.id,
    timestamp: toIso(row.timestamp),
    surface: row.surface as SynthesisTelemetryEvent['surface'],
    // Older rows persisted before the multi-tenant scaffolding column landed
    // get back-filled with the default tenant on read so the in-memory shape
    // is stable even against legacy databases.
    tenantId: row.tenant_id ?? 'apex-retail',
    instanceId: row.instance_id,
    patternId: row.pattern_id,
    cacheHit: row.cache_hit,
    latencyMs: row.latency_ms,
    citationCount: row.citation_count,
    contradictionCount: row.contradiction_count,
    failureModeCount: row.failure_mode_count,
    gateCount: row.gate_count,
  };
  if (row.feedback === 'up' || row.feedback === 'down') {
    event.feedback = row.feedback;
  }
  if (row.feedback_timestamp) {
    event.feedbackTimestamp = toIso(row.feedback_timestamp);
  }
  return event;
}

export class PostgresTelemetryBackend implements TelemetryBackend {
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

  async write(event: SynthesisTelemetryEvent): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(INSERT_SQL, [
        event.id,
        event.timestamp,
        event.surface,
        event.instanceId,
        event.patternId,
        event.cacheHit,
        event.latencyMs,
        event.citationCount,
        event.contradictionCount,
        event.failureModeCount,
        event.gateCount,
        event.feedback ?? null,
        event.feedbackTimestamp ?? null,
      ]);
    } catch (err) {
      // Best-effort: log + swallow so the in-memory write path is unaffected.
      // eslint-disable-next-line no-console
      console.warn(
        '[telemetry-backends/postgres] write failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async writeFeedback(eventId: string, feedback: SynthesisFeedback): Promise<void> {
    try {
      const executor = this.getExecutor();
      await executor.query(UPDATE_FEEDBACK_SQL, [
        eventId,
        feedback,
        new Date().toISOString(),
      ]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[telemetry-backends/postgres] writeFeedback failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /**
   * Read recent events ordered by timestamp DESC. Not part of the
   * {@link TelemetryBackend} interface — exposed for admin/dev tooling that
   * wants a longer-than-buffer history.
   */
  async read(limit: number = DEFAULT_READ_LIMIT): Promise<SynthesisTelemetryEvent[]> {
    try {
      const executor = this.getExecutor();
      const { rows } = await executor.query<RawTelemetryRow>(SELECT_RECENT_SQL, [limit]);
      return rows.map(rowToEvent);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[telemetry-backends/postgres] read failed',
        err instanceof Error ? err.message : String(err),
      );
      return [];
    }
  }
}

/** Build a backend instance bound to the default `pg.Pool` factory. */
export function createPostgresTelemetryBackend(
  factory?: PostgresSqlExecutorFactory,
): PostgresTelemetryBackend {
  return new PostgresTelemetryBackend(factory);
}

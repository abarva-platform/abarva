import type { Pool, PoolClient } from 'pg';

import { upsertCmdbExtract } from '@/lib/tower/ingest/servicenow-cmdb/upsert';
import { buildSyntheticNorthwindCmdb } from '@/lib/tower/ingest/servicenow-cmdb/sample';

/**
 * Hand-rolled pg.Pool double that models exactly the two tables the
 * upsert layer touches. Strictly enough behaviour to verify:
 *   * the transaction is opened + committed
 *   * a re-run produces zero new inserts (idempotency)
 *   * rollback is invoked on error
 *
 * Implementing pg-mem would be overkill — we test the SQL contract by
 * pattern-matching, not by executing real SQL.
 */

interface TableRow {
  pk: string;
  data: Record<string, unknown>;
  /** Set to true on first insert; cleared by ON CONFLICT update */
  freshlyInserted: boolean;
}

function makeFakePool(): {
  pool: Pool;
  cis: Map<string, TableRow>;
  deps: Map<string, TableRow>;
  beginCount: number;
  commitCount: number;
  rollbackCount: number;
} {
  const cis = new Map<string, TableRow>();
  const deps = new Map<string, TableRow>();
  let beginCount = 0;
  let commitCount = 0;
  let rollbackCount = 0;

  const client: Partial<PoolClient> = {
    query: (async (sql: string, params?: unknown[]) => {
      const text = typeof sql === 'string' ? sql : (sql as { text: string }).text;
      if (/^\s*BEGIN/i.test(text)) {
        beginCount += 1;
        return { rows: [], rowCount: 0 };
      }
      if (/^\s*COMMIT/i.test(text)) {
        commitCount += 1;
        return { rows: [], rowCount: 0 };
      }
      if (/^\s*ROLLBACK/i.test(text)) {
        rollbackCount += 1;
        return { rows: [], rowCount: 0 };
      }
      if (/INSERT INTO public\.tower_cmdb_cis/i.test(text)) {
        const [clientId, ciSysId, ciName, ciType, ciClass, lifecycle, ownerTeam, businessService, criticality, environment, sourceSystem, ingestRunId] = params as string[];
        const key = `${clientId}::${ciSysId}`;
        const existing = cis.get(key);
        if (existing) {
          existing.data = { ciName, ciType, ciClass, lifecycle, ownerTeam, businessService, criticality, environment, sourceSystem, ingestRunId };
          existing.freshlyInserted = false;
          return { rows: [{ inserted: false }], rowCount: 1 };
        }
        cis.set(key, {
          pk: key,
          data: { ciName, ciType, ciClass, lifecycle, ownerTeam, businessService, criticality, environment, sourceSystem, ingestRunId },
          freshlyInserted: true,
        });
        return { rows: [{ inserted: true }], rowCount: 1 };
      }
      if (/INSERT INTO public\.tower_cmdb_dependencies/i.test(text)) {
        const [clientId, source, target, depType, sourceSystem, ingestRunId] = params as string[];
        const key = `${clientId}::${source}::${target}::${depType}`;
        const existing = deps.get(key);
        if (existing) {
          existing.data = { sourceSystem, ingestRunId };
          existing.freshlyInserted = false;
          return { rows: [{ inserted: false }], rowCount: 1 };
        }
        deps.set(key, {
          pk: key,
          data: { sourceSystem, ingestRunId },
          freshlyInserted: true,
        });
        return { rows: [{ inserted: true }], rowCount: 1 };
      }
      throw new Error(`unexpected SQL in test: ${text.slice(0, 80)}`);
    }) as PoolClient['query'],
    release: () => undefined,
  };

  const pool: Partial<Pool> = {
    connect: async () => client as PoolClient,
  };

  return {
    pool: pool as Pool,
    cis,
    deps,
    get beginCount() { return beginCount; },
    get commitCount() { return commitCount; },
    get rollbackCount() { return rollbackCount; },
  } as ReturnType<typeof makeFakePool>;
}

describe('ServiceNow CMDB · upsertCmdbExtract', () => {
  it('writes every row on first run and zero new rows on a re-run (idempotency)', async () => {
    const fake = makeFakePool();
    const sample = buildSyntheticNorthwindCmdb();
    const context = {
      clientId: 'apexretail',
      ingestRunId: 'run-1',
      sourceSystem: 'servicenow_cmdb',
    };

    const first = await upsertCmdbExtract({
      pool: fake.pool,
      context,
      cis: sample.cis,
      dependencies: sample.dependencies,
    });
    expect(first.cisInserted).toBe(sample.cis.length);
    expect(first.cisUpdated).toBe(0);
    expect(first.dependenciesInserted).toBe(sample.dependencies.length);
    expect(first.dependenciesUpdated).toBe(0);
    expect(fake.beginCount).toBe(1);
    expect(fake.commitCount).toBe(1);

    const second = await upsertCmdbExtract({
      pool: fake.pool,
      context: { ...context, ingestRunId: 'run-2' },
      cis: sample.cis,
      dependencies: sample.dependencies,
    });
    expect(second.cisInserted).toBe(0);
    expect(second.cisUpdated).toBe(sample.cis.length);
    expect(second.dependenciesInserted).toBe(0);
    expect(second.dependenciesUpdated).toBe(sample.dependencies.length);
    // Two separate transactions across two runs.
    expect(fake.beginCount).toBe(2);
    expect(fake.commitCount).toBe(2);
    expect(fake.rollbackCount).toBe(0);
  });

  it('rolls back the transaction on a database error', async () => {
    let queryCount = 0;
    let rollbackCount = 0;
    const failingClient: Partial<PoolClient> = {
      query: (async (sql: string) => {
        queryCount += 1;
        const text = typeof sql === 'string' ? sql : (sql as { text: string }).text;
        if (/^\s*BEGIN/i.test(text)) return { rows: [], rowCount: 0 };
        if (/^\s*ROLLBACK/i.test(text)) {
          rollbackCount += 1;
          return { rows: [], rowCount: 0 };
        }
        if (/INSERT INTO public\.tower_cmdb_cis/i.test(text)) {
          throw new Error('check_violation: lifecycle_state');
        }
        return { rows: [], rowCount: 0 };
      }) as PoolClient['query'],
      release: () => undefined,
    };
    const failingPool = {
      connect: async () => failingClient as PoolClient,
    } as Pool;

    await expect(
      upsertCmdbExtract({
        pool: failingPool,
        context: { clientId: 'apexretail', ingestRunId: 'run-bad' },
        cis: [
          {
            ciSysId: 'a'.repeat(32),
            ciName: 'bad ci',
            ciType: 'application',
            ciClass: 'cmdb_ci_appl',
            lifecycleState: 'production',
            ownerTeam: 'A',
            businessService: 'A',
            criticality: 'tier_1',
            environment: 'prod',
          },
        ],
        dependencies: [],
      }),
    ).rejects.toThrow(/check_violation/);
    expect(queryCount).toBeGreaterThan(0);
    expect(rollbackCount).toBe(1);
  });
});

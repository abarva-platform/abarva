import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
  withAzureWriteTransaction,
  writeTransactionOutcome,
} from '../postgresCompat';
import { azureRead, createAzureReadClient } from '../azureRead';
import type { SqlRunner } from '../read-adapters/azureSession';

type Connection = Pick<import('pg').PoolClient, 'query' | 'release'>;

function transactionConnection(options: {
  failReadback?: boolean;
  failCommit?: boolean;
  failRollback?: boolean;
} = {}) {
  const statements: string[] = [];
  let pendingWrites = 0;
  let committedWrites = 0;
  const release = jest.fn();
  const query = jest.fn(async (sql: string) => {
    statements.push(sql);
    if (sql === 'BEGIN ISOLATION LEVEL SERIALIZABLE') {
      pendingWrites = 0;
      return { command: 'BEGIN', rows: [], rowCount: null };
    }
    if (sql.startsWith('INSERT INTO ')) {
      pendingWrites += 1;
      return { command: 'INSERT', rows: [{ id: 'seed-row' }], rowCount: 1 };
    }
    if (sql.startsWith('SELECT ') && options.failReadback) {
      throw new Error('late_capture_readback_failed');
    }
    if (sql === 'COMMIT') {
      if (options.failCommit) throw new Error('connection_lost_during_commit');
      committedWrites += pendingWrites;
      pendingWrites = 0;
      return { command: 'COMMIT', rows: [], rowCount: null };
    }
    if (sql === 'ROLLBACK') {
      if (options.failRollback) throw new Error('connection_lost_during_rollback');
      pendingWrites = 0;
      return { command: 'ROLLBACK', rows: [], rowCount: null };
    }
    return { command: 'SELECT', rows: [{ id: 'seed-row' }], rowCount: 1 };
  });
  const connection = { query, release } as unknown as Connection;
  const connect = jest.fn(async () => connection);
  return {
    connect,
    query,
    release,
    statements,
    get committedWrites() { return committedWrites; },
    get pendingWrites() { return pendingWrites; },
  };
}

describe('Postgres compat write transaction', () => {
  it('ordinary Azure reads do not initialize the compatibility writer', () => {
    try {
      jest.isolateModules(() => {
        jest.doMock('../postgresCompat', () => {
          throw new Error('compatibility_writer_loaded_by_independent_reader');
        });
        const readModule = jest.requireActual<typeof import('../azureRead')>('../azureRead');
        expect(typeof readModule.createAzureReadClient().query).toBe('function');
      });
    } finally {
      jest.dontMock('../postgresCompat');
    }
  });

  it.each([false, true])('restores ordinary raw reads after an opted-in transaction (aborted=%s)', async (aborted) => {
    const db = transactionConnection();
    const session = jest.fn(async <T>(work: (run: SqlRunner) => Promise<T>) =>
      work(async <R>() => [{ id: 'independent-row' }] as R[]));
    const read = createAzureReadClient(session);
    const sql = 'SELECT id FROM phase_snapshots WHERE engagement_id = $1';
    const outcome = withAzureWriteTransaction('unused', async () => {
      expect(await read.query(sql, ['move-1'])).toEqual([{ id: 'seed-row' }]);
      expect(session).not.toHaveBeenCalled();
      if (aborted) throw new Error('review_basis_refused');
    }, { connect: db.connect, includeReads: true });
    if (aborted) await expect(outcome).rejects.toThrow('review_basis_refused');
    else await outcome;
    expect(await read.query(sql, ['move-1'])).toEqual([{ id: 'independent-row' }]);
    expect(session).toHaveBeenCalledTimes(1);
    expect(db.statements).toContain(aborted ? 'ROLLBACK' : 'COMMIT');
    expect(db.release).toHaveBeenCalledTimes(1);
  });

  it('opt-in policy and evidence reads share the transaction and restore the independent reader afterward', async () => {
    const db = transactionConnection();
    const independent = getAzureReadFluentClient();
    await withAzureWriteTransaction('unused', async () => {
      expect(getAzureReadFluentClient()).toBe(getAzureWriteFluentClient());
      const result = await getAzureReadFluentClient().from('program_modules').select('id').eq('engagement_id', 'move-1');
      expect(result.error).toBeNull();
      expect(await azureRead.query('SELECT id FROM phase_snapshots WHERE engagement_id = $1', ['move-1'])).toEqual([{ id: 'seed-row' }]);
    }, { connect: db.connect, includeReads: true });
    expect(db.statements.some(sql => sql.includes('FROM "program_modules"'))).toBe(true);
    expect(db.statements).toContain('SELECT id FROM phase_snapshots WHERE engagement_id = $1');
    expect(getAzureReadFluentClient()).toBe(independent);
  });

  it('default transaction callers keep their independent read client', async () => {
    const db = transactionConnection();
    const independent = getAzureReadFluentClient();
    await withAzureWriteTransaction('unused', async () => {
      expect(getAzureReadFluentClient()).toBe(independent);
      expect(getAzureReadFluentClient()).not.toBe(getAzureWriteFluentClient());
    }, { connect: db.connect });
  });

  it('keeps direct locks and every fluent write on one connection, then commits once', async () => {
    const db = transactionConnection();
    const result = await withAzureWriteTransaction('unused', async (query) => {
      await query('SELECT id FROM engagements WHERE id = $1 FOR UPDATE', ['move-1']);
      const scoped = getAzureWriteFluentClient();
      await Promise.resolve();
      expect(getAzureWriteFluentClient()).toBe(scoped);
      const first = await scoped.from('move_assumptions').insert({ id: 'one' }).select('id').single();
      const second = await getAzureWriteFluentClient()
        .from('program_modules').insert({ id: 'two' }).select('id').single();
      expect(first.error).toBeNull();
      expect(second.error).toBeNull();
      return 'complete';
    }, { connect: db.connect });

    expect(result).toBe('complete');
    expect(db.connect).toHaveBeenCalledTimes(1);
    expect(db.statements).toEqual([
      'BEGIN ISOLATION LEVEL SERIALIZABLE',
      "SET LOCAL statement_timeout = '60s'",
      "SET LOCAL lock_timeout = '15s'",
      'SELECT id FROM engagements WHERE id = $1 FOR UPDATE',
      'INSERT INTO "move_assumptions" ("id") VALUES ($1) RETURNING "id"',
      'INSERT INTO "program_modules" ("id") VALUES ($1) RETURNING "id"',
      'COMMIT',
    ]);
    expect(db.committedWrites).toBe(2);
    expect(db.pendingWrites).toBe(0);
    expect(db.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back register writes when a later capture readback fails', async () => {
    const db = transactionConnection({ failReadback: true });
    let failure: unknown;
    try {
      await withAzureWriteTransaction('unused', async () => {
        const inserted = await getAzureWriteFluentClient()
          .from('move_assumptions').insert({ id: 'one' }).select('id').single();
        expect(inserted.error).toBeNull();
        const readback = await getAzureWriteFluentClient()
          .from('program_modules').select('id').eq('id', 'capture').maybeSingle();
        if (readback.error) throw new Error(readback.error.message);
      }, { connect: db.connect });
    } catch (error) {
      failure = error;
    }

    expect((failure as Error).message).toBe('late_capture_readback_failed');
    expect(writeTransactionOutcome(failure)).toBe('rolled_back');
    expect(db.statements.some((sql) => sql.startsWith('INSERT INTO "move_assumptions"'))).toBe(true);
    expect(db.statements.at(-1)).toBe('ROLLBACK');
    expect(db.statements).not.toContain('COMMIT');
    expect(db.committedWrites).toBe(0);
    expect(db.pendingWrites).toBe(0);
    expect(db.release).toHaveBeenCalledTimes(1);
  });

  it('reports an uncertain outcome when COMMIT loses its acknowledgement', async () => {
    const db = transactionConnection({ failCommit: true });
    let failure: unknown;
    try {
      await withAzureWriteTransaction('unused', async () => {
        const inserted = await getAzureWriteFluentClient()
          .from('move_assumptions').insert({ id: 'one' }).select('id').single();
        expect(inserted.error).toBeNull();
      }, { connect: db.connect });
    } catch (error) {
      failure = error;
    }

    expect((failure as Error).message).toBe('connection_lost_during_commit');
    expect(writeTransactionOutcome(failure)).toBe('unknown');
    expect(db.statements.slice(-2)).toEqual(['COMMIT', 'ROLLBACK']);
    expect(db.release).toHaveBeenCalledTimes(1);
  });

  it('reports an uncertain outcome when ROLLBACK fails after a write', async () => {
    const db = transactionConnection({ failRollback: true });
    let failure: unknown;
    try {
      await withAzureWriteTransaction('unused', async () => {
        const inserted = await getAzureWriteFluentClient()
          .from('move_assumptions').insert({ id: 'one' }).select('id').single();
        expect(inserted.error).toBeNull();
        throw new Error('late_capture_write_failed');
      }, { connect: db.connect });
    } catch (error) {
      failure = error;
    }

    expect((failure as Error).message).toBe('late_capture_write_failed');
    expect(writeTransactionOutcome(failure)).toBe('unknown');
    expect(db.statements.at(-1)).toBe('ROLLBACK');
    expect(db.statements).not.toContain('COMMIT');
    expect(db.release).toHaveBeenCalledTimes(1);
  });
});

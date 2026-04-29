/**
 * Postgres alert-acknowledgment backend — unit tests.
 *
 * Mocks the SQL executor so no real database is required. Asserts the SQL
 * strings + parameter bindings the Postgres backend issues for write / clear,
 * and that errors are swallowed (best-effort contract).
 */

import {
  PostgresAlertAcknowledgmentBackend,
  createPostgresAlertAcknowledgmentBackend,
  type PostgresSqlExecutor,
} from '@/lib/reasoning/alert-acknowledgment-backends/postgres';

interface QueryCall {
  sql: string;
  params: ReadonlyArray<unknown> | undefined;
}

function makeFakeExecutor(opts: { throwOn?: 'query' | null } = {}): {
  executor: PostgresSqlExecutor;
  calls: QueryCall[];
} {
  const calls: QueryCall[] = [];
  const executor: PostgresSqlExecutor = {
    async query(text, params) {
      calls.push({ sql: text, params });
      if (opts.throwOn === 'query') {
        throw new Error('simulated db failure');
      }
      return { rows: [] };
    },
  };
  return { executor, calls };
}

describe('PostgresAlertAcknowledgmentBackend', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('write', () => {
    it('issues an INSERT ... ON CONFLICT (alert_id) DO UPDATE with id+status+ts+note', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresAlertAcknowledgmentBackend(() => executor);

      await backend.write({
        id: 'health::inst-1',
        status: 'acknowledged',
        timestamp: '2026-04-28T12:00:00.000Z',
        note: 'seen by ops',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/INSERT INTO reasoning_alert_states/);
      expect(calls[0].sql).toMatch(/ON CONFLICT \(alert_id\) DO UPDATE/);
      expect(calls[0].params).toEqual([
        'health::inst-1',
        'acknowledged',
        '2026-04-28T12:00:00.000Z',
        'seen by ops',
      ]);
    });

    it('substitutes null when the note is undefined', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresAlertAcknowledgmentBackend(() => executor);

      await backend.write({
        id: 'cascade::inst-2::inst-3::depends-on',
        status: 'dismissed',
        timestamp: '2026-04-28T12:00:00.000Z',
      });

      expect(calls[0].params?.[3]).toBeNull();
    });

    it('swallows write errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresAlertAcknowledgmentBackend(() => executor);

      await expect(
        backend.write({
          id: 'health::inst-1',
          status: 'acknowledged',
          timestamp: '2026-04-28T12:00:00.000Z',
        }),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('write failed'),
        expect.stringContaining('simulated db failure'),
      );
    });
  });

  describe('clear', () => {
    it('issues a DELETE FROM reasoning_alert_states WHERE alert_id = $1', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresAlertAcknowledgmentBackend(() => executor);

      await backend.clear('health::inst-1');

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/DELETE FROM reasoning_alert_states/);
      expect(calls[0].sql).toMatch(/WHERE alert_id = \$1/);
      expect(calls[0].params).toEqual(['health::inst-1']);
    });

    it('swallows delete errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresAlertAcknowledgmentBackend(() => executor);

      await expect(backend.clear('health::inst-1')).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('clear failed'),
        expect.any(String),
      );
    });
  });

  describe('lazy executor + factory wiring', () => {
    it('does not call the executor factory until the first query', () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _backend = new PostgresAlertAcknowledgmentBackend(factory);
      expect(factory).not.toHaveBeenCalled();
    });

    it('reuses a single executor across multiple calls', async () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      const backend = new PostgresAlertAcknowledgmentBackend(factory);

      await backend.write({
        id: 'a',
        status: 'acknowledged',
        timestamp: '2026-04-28T12:00:00.000Z',
      });
      await backend.write({
        id: 'b',
        status: 'dismissed',
        timestamp: '2026-04-28T12:01:00.000Z',
      });
      await backend.clear('a');

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('createPostgresAlertAcknowledgmentBackend builds an instance bound to the supplied factory', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = createPostgresAlertAcknowledgmentBackend(() => executor);

      await backend.write({
        id: 'z',
        status: 'acknowledged',
        timestamp: '2026-04-28T12:00:00.000Z',
      });
      expect(calls).toHaveLength(1);
    });
  });
});

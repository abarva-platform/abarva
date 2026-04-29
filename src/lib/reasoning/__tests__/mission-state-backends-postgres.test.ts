/**
 * Postgres mission-state backend — unit tests.
 *
 * Mocks the SQL executor at the module level so no real database is required.
 * Asserts the SQL strings + parameter bindings PostgresMissionStateBackend
 * issues for write / clear, and that errors are swallowed (best-effort
 * contract).
 */

import {
  PostgresMissionStateBackend,
  createPostgresMissionStateBackend,
  type PostgresSqlExecutor,
} from '@/lib/reasoning/mission-state-backends/postgres';

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

describe('PostgresMissionStateBackend', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('write', () => {
    it('issues an INSERT ... ON CONFLICT (mission_id) DO UPDATE with the entry fields in order', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresMissionStateBackend(() => executor);

      await backend.write({
        id: 'inst-1:crit-2',
        status: 'complete',
        timestamp: '2026-04-28T12:00:00.000Z',
        note: 'shipped',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/INSERT INTO reasoning_mission_states/);
      expect(calls[0].sql).toMatch(/ON CONFLICT \(mission_id\) DO UPDATE/);
      expect(calls[0].params).toEqual([
        'inst-1:crit-2',
        'complete',
        '2026-04-28T12:00:00.000Z',
        'shipped',
      ]);
    });

    it('passes note as null when omitted', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresMissionStateBackend(() => executor);

      await backend.write({
        id: 'inst-1:crit-3',
        status: 'dismissed',
        timestamp: '2026-04-28T12:01:00.000Z',
      });

      expect(calls[0].params?.[3]).toBeNull();
    });

    it('swallows query errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresMissionStateBackend(() => executor);

      await expect(
        backend.write({
          id: 'inst-1:crit-x',
          status: 'complete',
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
    it('issues a DELETE ... WHERE mission_id = $1', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresMissionStateBackend(() => executor);

      await backend.clear('inst-1:crit-2');

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/DELETE FROM reasoning_mission_states/);
      expect(calls[0].sql).toMatch(/WHERE mission_id = \$1/);
      expect(calls[0].params).toEqual(['inst-1:crit-2']);
    });

    it('swallows delete errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresMissionStateBackend(() => executor);

      await expect(backend.clear('inst-1:crit-2')).resolves.toBeUndefined();
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
      const _backend = new PostgresMissionStateBackend(factory);
      expect(factory).not.toHaveBeenCalled();
    });

    it('reuses a single executor across multiple calls', async () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      const backend = new PostgresMissionStateBackend(factory);

      await backend.write({
        id: 'inst-1:crit-1',
        status: 'complete',
        timestamp: '2026-04-28T12:00:00.000Z',
      });
      await backend.clear('inst-1:crit-1');
      await backend.write({
        id: 'inst-1:crit-2',
        status: 'dismissed',
        timestamp: '2026-04-28T12:01:00.000Z',
      });

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('createPostgresMissionStateBackend builds an instance bound to the supplied factory', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = createPostgresMissionStateBackend(() => executor);

      await backend.write({
        id: 'inst-1:crit-1',
        status: 'complete',
        timestamp: '2026-04-28T12:00:00.000Z',
      });
      expect(calls).toHaveLength(1);
    });
  });
});

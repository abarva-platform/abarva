/**
 * Postgres contradiction-resolution backend — unit tests.
 *
 * Mocks the SQL executor so no real database is required. Asserts the SQL
 * strings + parameter bindings PostgresContradictionResolutionBackend issues
 * for mark / clearAll, and that errors are swallowed (best-effort contract).
 */

import {
  PostgresContradictionResolutionBackend,
  createPostgresContradictionResolutionBackend,
  type PostgresSqlExecutor,
} from '@/lib/reasoning/contradiction-resolution-backends/postgres';

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

describe('PostgresContradictionResolutionBackend', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('mark', () => {
    it('issues an INSERT ... ON CONFLICT (contradiction_id) DO NOTHING with id + timestamp', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresContradictionResolutionBackend(() => executor);

      await backend.mark('inst-1::tpl-9', '2026-04-28T12:00:00.000Z');

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(
        /INSERT INTO reasoning_resolved_contradictions/,
      );
      expect(calls[0].sql).toMatch(
        /ON CONFLICT \(contradiction_id\) DO NOTHING/,
      );
      expect(calls[0].params).toEqual([
        'inst-1::tpl-9',
        '2026-04-28T12:00:00.000Z',
      ]);
    });

    it('preserves the caller-supplied timestamp verbatim', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresContradictionResolutionBackend(() => executor);

      await backend.mark('inst-2::tpl-1', '2026-01-01T00:00:00.000Z');
      expect(calls[0].params?.[1]).toBe('2026-01-01T00:00:00.000Z');
    });

    it('swallows insert errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresContradictionResolutionBackend(() => executor);

      await expect(
        backend.mark('inst-1::tpl-9', '2026-04-28T12:00:00.000Z'),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('mark failed'),
        expect.stringContaining('simulated db failure'),
      );
    });
  });

  describe('clearAll', () => {
    it('issues a DELETE FROM reasoning_resolved_contradictions with no parameters', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresContradictionResolutionBackend(() => executor);

      await backend.clearAll();

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/DELETE FROM reasoning_resolved_contradictions/);
      expect(calls[0].params).toBeUndefined();
    });

    it('swallows delete errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresContradictionResolutionBackend(() => executor);

      await expect(backend.clearAll()).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('clearAll failed'),
        expect.any(String),
      );
    });
  });

  describe('lazy executor + factory wiring', () => {
    it('does not call the executor factory until the first query', () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _backend = new PostgresContradictionResolutionBackend(factory);
      expect(factory).not.toHaveBeenCalled();
    });

    it('reuses a single executor across multiple calls', async () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      const backend = new PostgresContradictionResolutionBackend(factory);

      await backend.mark('a', '2026-04-28T12:00:00.000Z');
      await backend.mark('b', '2026-04-28T12:01:00.000Z');
      await backend.clearAll();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('createPostgresContradictionResolutionBackend builds an instance bound to the supplied factory', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = createPostgresContradictionResolutionBackend(() => executor);

      await backend.mark('z', '2026-04-28T12:00:00.000Z');
      expect(calls).toHaveLength(1);
    });
  });
});

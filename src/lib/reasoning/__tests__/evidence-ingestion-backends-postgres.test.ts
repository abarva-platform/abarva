/**
 * Postgres evidence-ingestion backend — unit tests.
 *
 * Mocks the SQL executor so no real database is required. Asserts the SQL
 * strings + parameter bindings PostgresEvidenceIngestionBackend issues for
 * write / clearForInstance, and that errors are swallowed (best-effort
 * contract).
 */

import {
  PostgresEvidenceIngestionBackend,
  createPostgresEvidenceIngestionBackend,
  type PostgresSqlExecutor,
} from '@/lib/reasoning/evidence-ingestion-backends/postgres';

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

describe('PostgresEvidenceIngestionBackend', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('write', () => {
    it('issues an INSERT INTO reasoning_evidence_ingestions with instance_id + JSONB item', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresEvidenceIngestionBackend(() => executor);

      const item = {
        id: 'ev-1',
        kind: 'metric',
        field: 'spend',
        value: 1234,
      };
      await backend.write('apex-cdp-2026', item);

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/INSERT INTO reasoning_evidence_ingestions/);
      expect(calls[0].sql).toMatch(/instance_id, item/);
      expect(calls[0].params).toEqual(['apex-cdp-2026', item]);
      // Assert the binding is the original reference — pg serializes objects.
      expect(calls[0].params?.[1]).toBe(item);
    });

    it('forwards arbitrary item shapes unchanged (loose typing on the store)', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresEvidenceIngestionBackend(() => executor);

      const item = { freeform: true, nested: { a: [1, 2, 3] } };
      await backend.write('inst-x', item);

      expect(calls[0].params?.[1]).toEqual(item);
    });

    it('swallows insert errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresEvidenceIngestionBackend(() => executor);

      await expect(
        backend.write('inst-1', { id: 'ev-1' }),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('write failed'),
        expect.stringContaining('simulated db failure'),
      );
    });
  });

  describe('clearForInstance', () => {
    it('issues a DELETE ... WHERE instance_id = $1', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresEvidenceIngestionBackend(() => executor);

      await backend.clearForInstance('apex-cdp-2026');

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/DELETE FROM reasoning_evidence_ingestions/);
      expect(calls[0].sql).toMatch(/WHERE instance_id = \$1/);
      expect(calls[0].params).toEqual(['apex-cdp-2026']);
    });

    it('swallows delete errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresEvidenceIngestionBackend(() => executor);

      await expect(
        backend.clearForInstance('inst-1'),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('clearForInstance failed'),
        expect.any(String),
      );
    });
  });

  describe('lazy executor + factory wiring', () => {
    it('does not call the executor factory until the first query', () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _backend = new PostgresEvidenceIngestionBackend(factory);
      expect(factory).not.toHaveBeenCalled();
    });

    it('reuses a single executor across multiple calls', async () => {
      const factory = jest.fn(() => makeFakeExecutor().executor);
      const backend = new PostgresEvidenceIngestionBackend(factory);

      await backend.write('inst-1', { id: 'ev-1' });
      await backend.write('inst-1', { id: 'ev-2' });
      await backend.clearForInstance('inst-1');

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('createPostgresEvidenceIngestionBackend builds an instance bound to the supplied factory', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = createPostgresEvidenceIngestionBackend(() => executor);

      await backend.write('inst-1', { id: 'ev-1' });
      expect(calls).toHaveLength(1);
    });
  });
});

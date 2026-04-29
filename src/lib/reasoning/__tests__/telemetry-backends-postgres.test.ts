/**
 * Postgres telemetry backend — unit tests.
 *
 * Mocks the SQL executor at the module level so no real database is required.
 * Asserts the SQL strings + parameter bindings that PostgresTelemetryBackend
 * issues for write / writeFeedback / read, and that errors are swallowed
 * (best-effort contract from the TelemetryBackend interface).
 */

import {
  PostgresTelemetryBackend,
  createPostgresTelemetryBackend,
  type PostgresSqlExecutor,
} from '@/lib/reasoning/telemetry-backends/postgres';
import type {
  SynthesisTelemetryEvent,
} from '@/lib/reasoning/synthesis-telemetry';

const baseEvent: SynthesisTelemetryEvent = {
  id: 'tlm_test_1',
  timestamp: '2026-04-28T12:00:00.000Z',
  surface: 'source',
  tenantId: 'apex-retail',
  instanceId: 'ams-vendor-consolidation-2026',
  patternId: 'PAT-SRC-AMS-001',
  cacheHit: false,
  latencyMs: 312,
  citationCount: 4,
  contradictionCount: 1,
  failureModeCount: 0,
  gateCount: 5,
};

interface QueryCall {
  sql: string;
  params: ReadonlyArray<unknown> | undefined;
}

function makeFakeExecutor(opts: {
  rows?: unknown[];
  throwOn?: 'query' | null;
} = {}): { executor: PostgresSqlExecutor; calls: QueryCall[] } {
  const calls: QueryCall[] = [];
  const executor: PostgresSqlExecutor = {
    async query(text, params) {
      calls.push({ sql: text, params });
      if (opts.throwOn === 'query') {
        throw new Error('simulated db failure');
      }
      return { rows: (opts.rows ?? []) as never[] };
    },
  };
  return { executor, calls };
}

describe('PostgresTelemetryBackend', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('write', () => {
    it('issues an INSERT ... ON CONFLICT (id) DO UPDATE with the event fields in order', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresTelemetryBackend(() => executor);

      await backend.write(baseEvent);

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/INSERT INTO reasoning_telemetry_events/);
      expect(calls[0].sql).toMatch(/ON CONFLICT \(id\) DO UPDATE/);
      expect(calls[0].params).toEqual([
        baseEvent.id,
        baseEvent.timestamp,
        baseEvent.surface,
        baseEvent.instanceId,
        baseEvent.patternId,
        baseEvent.cacheHit,
        baseEvent.latencyMs,
        baseEvent.citationCount,
        baseEvent.contradictionCount,
        baseEvent.failureModeCount,
        baseEvent.gateCount,
        null, // feedback not set on baseEvent
        null, // feedbackTimestamp not set
      ]);
    });

    it('passes pattern_id null when patternId is null (Atlas portfolio events)', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresTelemetryBackend(() => executor);

      await backend.write({ ...baseEvent, patternId: null });

      expect(calls[0].params?.[4]).toBeNull();
    });

    it('persists feedback fields when present on the event', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresTelemetryBackend(() => executor);

      await backend.write({
        ...baseEvent,
        feedback: 'up',
        feedbackTimestamp: '2026-04-28T12:05:00.000Z',
      });

      const params = calls[0].params!;
      expect(params[11]).toBe('up');
      expect(params[12]).toBe('2026-04-28T12:05:00.000Z');
    });

    it('swallows query errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresTelemetryBackend(() => executor);

      await expect(backend.write(baseEvent)).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('write failed'),
        expect.stringContaining('simulated db failure'),
      );
    });
  });

  describe('writeFeedback', () => {
    it('issues an UPDATE ... SET feedback = $2, feedback_timestamp = $3 WHERE id = $1', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = new PostgresTelemetryBackend(() => executor);

      await backend.writeFeedback('tlm_xyz', 'down');

      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/UPDATE reasoning_telemetry_events/);
      expect(calls[0].sql).toMatch(/SET\s+feedback = \$2/);
      expect(calls[0].sql).toMatch(/feedback_timestamp = \$3/);
      expect(calls[0].sql).toMatch(/WHERE id = \$1/);

      const params = calls[0].params!;
      expect(params[0]).toBe('tlm_xyz');
      expect(params[1]).toBe('down');
      // params[2] is an ISO timestamp generated at call time.
      expect(typeof params[2]).toBe('string');
      expect(() => new Date(params[2] as string).toISOString()).not.toThrow();
    });

    it('swallows update errors and does not throw', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresTelemetryBackend(() => executor);

      await expect(backend.writeFeedback('tlm_xyz', 'up')).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('writeFeedback failed'),
        expect.any(String),
      );
    });
  });

  describe('read', () => {
    it('issues SELECT ... ORDER BY timestamp DESC LIMIT $1 with the default limit', async () => {
      const { executor, calls } = makeFakeExecutor({ rows: [] });
      const backend = new PostgresTelemetryBackend(() => executor);

      const events = await backend.read();

      expect(events).toEqual([]);
      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toMatch(/SELECT[\s\S]+FROM reasoning_telemetry_events/);
      expect(calls[0].sql).toMatch(/ORDER BY timestamp DESC/);
      expect(calls[0].sql).toMatch(/LIMIT \$1/);
      expect(calls[0].params).toEqual([500]);
    });

    it('forwards an explicit limit argument as the bound LIMIT parameter', async () => {
      const { executor, calls } = makeFakeExecutor({ rows: [] });
      const backend = new PostgresTelemetryBackend(() => executor);

      await backend.read(25);
      expect(calls[0].params).toEqual([25]);
    });

    it('maps snake_case row columns into typed SynthesisTelemetryEvents', async () => {
      const { executor } = makeFakeExecutor({
        rows: [
          {
            id: 'tlm_a',
            timestamp: '2026-04-28T11:00:00.000Z',
            surface: 'programs',
            instance_id: 'apex-cdp-2026',
            pattern_id: 'PAT-PRG-CDP-001',
            cache_hit: true,
            latency_ms: 50,
            citation_count: 2,
            contradiction_count: 0,
            failure_mode_count: 1,
            gate_count: 4,
            feedback: 'up',
            feedback_timestamp: '2026-04-28T11:05:00.000Z',
          },
          {
            id: 'tlm_b',
            timestamp: new Date('2026-04-28T10:00:00.000Z'),
            surface: 'tower',
            instance_id: 'tower',
            pattern_id: null,
            cache_hit: false,
            latency_ms: 900,
            citation_count: 7,
            contradiction_count: 2,
            failure_mode_count: 0,
            gate_count: 0,
            feedback: null,
            feedback_timestamp: null,
          },
        ],
      });
      const backend = new PostgresTelemetryBackend(() => executor);

      const events = await backend.read();

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({
        id: 'tlm_a',
        timestamp: '2026-04-28T11:00:00.000Z',
        surface: 'programs',
        // Legacy rows without a tenant_id column are back-filled with the
        // default tenant on read so the in-memory shape matches the typed
        // SynthesisTelemetryEvent contract.
        tenantId: 'apex-retail',
        instanceId: 'apex-cdp-2026',
        patternId: 'PAT-PRG-CDP-001',
        cacheHit: true,
        latencyMs: 50,
        citationCount: 2,
        contradictionCount: 0,
        failureModeCount: 1,
        gateCount: 4,
        feedback: 'up',
        feedbackTimestamp: '2026-04-28T11:05:00.000Z',
      });
      expect(events[1].patternId).toBeNull();
      expect(events[1].feedback).toBeUndefined();
      expect(events[1].feedbackTimestamp).toBeUndefined();
      // Date column got normalized to an ISO string.
      expect(events[1].timestamp).toBe('2026-04-28T10:00:00.000Z');
    });

    it('returns [] and swallows errors when the query rejects', async () => {
      const { executor } = makeFakeExecutor({ throwOn: 'query' });
      const backend = new PostgresTelemetryBackend(() => executor);

      const result = await backend.read();
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('read failed'),
        expect.any(String),
      );
    });
  });

  describe('lazy executor + factory wiring', () => {
    it('does not call the executor factory until the first query', () => {
      const factory = jest.fn(() => {
        const { executor } = makeFakeExecutor();
        return executor;
      });
      // Instantiating must not open a connection.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _backend = new PostgresTelemetryBackend(factory);
      expect(factory).not.toHaveBeenCalled();
    });

    it('reuses a single executor across multiple writes', async () => {
      const factory = jest.fn(() => {
        const { executor } = makeFakeExecutor();
        return executor;
      });
      const backend = new PostgresTelemetryBackend(factory);

      await backend.write(baseEvent);
      await backend.write({ ...baseEvent, id: 'tlm_test_2' });
      await backend.writeFeedback('tlm_test_1', 'up');

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('createPostgresTelemetryBackend builds an instance bound to the supplied factory', async () => {
      const { executor, calls } = makeFakeExecutor();
      const backend = createPostgresTelemetryBackend(() => executor);

      await backend.write(baseEvent);
      expect(calls).toHaveLength(1);
    });
  });
});

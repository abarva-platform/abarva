/**
 * Synthesis telemetry — retention + persistence backend tests.
 *
 * Deterministic: no network, no real persistence. Each case calls
 * `_resetForTests()` which clears the buffer and restores the default
 * retention window + null backend.
 */

import {
  recordSynthesisEvent,
  getRecentSynthesisEvents,
  recordFeedback,
  setRetentionDays,
  getRetentionDays,
  setTelemetryBackend,
  getTelemetryBackend,
  _resetForTests,
  DEFAULT_TELEMETRY_RETENTION_DAYS,
  type SynthesisTelemetryEvent,
  type SynthesisFeedback,
  type SynthesisTelemetryInput,
  type TelemetryBackend,
} from '@/lib/reasoning/synthesis-telemetry';
import {
  InMemoryExtendedTelemetryBackend,
  inMemoryExtendedTelemetryBackend,
  IN_MEMORY_EXTENDED_CAPACITY,
} from '@/lib/reasoning/telemetry-backends/in-memory-extended';
import { NoOpTelemetryBackend } from '@/lib/reasoning/telemetry-backends/no-op';

const baseInput: SynthesisTelemetryInput = {
  surface: 'source',
  instanceId: 'ams-vendor-consolidation-2026',
  patternId: 'PAT-SRC-AMS-001',
  cacheHit: false,
  latencyMs: 250,
  citationCount: 3,
  contradictionCount: 1,
  failureModeCount: 0,
  gateCount: 5,
};

beforeEach(() => {
  _resetForTests();
  inMemoryExtendedTelemetryBackend.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

class CapturingBackend implements TelemetryBackend {
  writes: SynthesisTelemetryEvent[] = [];
  feedbacks: Array<{ eventId: string; feedback: SynthesisFeedback }> = [];

  async write(event: SynthesisTelemetryEvent): Promise<void> {
    this.writes.push(event);
  }

  async writeFeedback(eventId: string, feedback: SynthesisFeedback): Promise<void> {
    this.feedbacks.push({ eventId, feedback });
  }
}

class RejectingBackend implements TelemetryBackend {
  writeCalls = 0;
  feedbackCalls = 0;

  async write(_event: SynthesisTelemetryEvent): Promise<void> {
    this.writeCalls += 1;
    throw new Error('boom');
  }

  async writeFeedback(_eventId: string, _feedback: SynthesisFeedback): Promise<void> {
    this.feedbackCalls += 1;
    throw new Error('boom');
  }
}

describe('retention policy', () => {
  it('defaults to 30 days', () => {
    expect(getRetentionDays()).toBe(DEFAULT_TELEMETRY_RETENTION_DAYS);
    expect(DEFAULT_TELEMETRY_RETENTION_DAYS).toBe(30);
  });

  it('drops events older than the retention window at write time', () => {
    setRetentionDays(30);

    jest.useFakeTimers();
    const oldNow = new Date('2026-03-01T00:00:00.000Z').getTime();
    jest.setSystemTime(oldNow);
    recordSynthesisEvent({ ...baseInput, instanceId: 'ancient' });
    expect(getRecentSynthesisEvents()).toHaveLength(1);

    // Jump 40 days forward and record again — old event is past cutoff.
    const newNow = oldNow + 40 * 86_400_000;
    jest.setSystemTime(newNow);
    recordSynthesisEvent({ ...baseInput, instanceId: 'fresh' });

    const events = getRecentSynthesisEvents();
    expect(events).toHaveLength(1);
    expect(events[0].instanceId).toBe('fresh');
  });

  it('keeps events still inside the retention window', () => {
    setRetentionDays(30);

    jest.useFakeTimers();
    const oldNow = new Date('2026-04-01T00:00:00.000Z').getTime();
    jest.setSystemTime(oldNow);
    recordSynthesisEvent({ ...baseInput, instanceId: 'recent' });

    // Advance 5 days — well inside the window — and record another.
    jest.setSystemTime(oldNow + 5 * 86_400_000);
    recordSynthesisEvent({ ...baseInput, instanceId: 'newer' });

    const ids = getRecentSynthesisEvents().map(e => e.instanceId);
    expect(ids).toEqual(['newer', 'recent']);
  });

  it('disables pruning when retentionDays is 0', () => {
    setRetentionDays(0);

    jest.useFakeTimers();
    const oldNow = new Date('2024-01-01T00:00:00.000Z').getTime();
    jest.setSystemTime(oldNow);
    recordSynthesisEvent({ ...baseInput, instanceId: 'old' });

    jest.setSystemTime(oldNow + 365 * 86_400_000);
    recordSynthesisEvent({ ...baseInput, instanceId: 'new' });

    expect(getRecentSynthesisEvents()).toHaveLength(2);
  });

  it('setRetentionDays mutates the read-back value', () => {
    setRetentionDays(7);
    expect(getRetentionDays()).toBe(7);
    setRetentionDays(90);
    expect(getRetentionDays()).toBe(90);
  });
});

describe('telemetry backend wiring', () => {
  it('default backend is null', () => {
    expect(getTelemetryBackend()).toBeNull();
  });

  it('forwards every recordSynthesisEvent to the configured backend', async () => {
    const backend = new CapturingBackend();
    setTelemetryBackend(backend);

    const a = recordSynthesisEvent({ ...baseInput, instanceId: 'a' });
    const b = recordSynthesisEvent({ ...baseInput, instanceId: 'b' });

    // Backend writes are best-effort and async; flush microtasks.
    await Promise.resolve();
    await Promise.resolve();

    expect(backend.writes).toHaveLength(2);
    expect(backend.writes.map(e => e.id)).toEqual([a.id, b.id]);
    expect(backend.writes[0].instanceId).toBe('a');
  });

  it('forwards recordFeedback to the configured backend', async () => {
    const backend = new CapturingBackend();
    setTelemetryBackend(backend);

    const event = recordSynthesisEvent(baseInput);
    expect(recordFeedback(event.id, 'up')).toBe(true);

    await Promise.resolve();
    await Promise.resolve();

    expect(backend.feedbacks).toEqual([{ eventId: event.id, feedback: 'up' }]);
  });

  it('does not call writeFeedback when the event id is unknown', async () => {
    const backend = new CapturingBackend();
    setTelemetryBackend(backend);

    expect(recordFeedback('tlm_does_not_exist', 'down')).toBe(false);

    await Promise.resolve();
    expect(backend.feedbacks).toHaveLength(0);
  });

  it('swallows backend write rejections without breaking the in-memory write', async () => {
    const backend = new RejectingBackend();
    setTelemetryBackend(backend);

    const event = recordSynthesisEvent(baseInput);

    // The in-memory write must succeed regardless.
    expect(getRecentSynthesisEvents()).toHaveLength(1);
    expect(getRecentSynthesisEvents()[0].id).toBe(event.id);

    // Drain microtasks so the swallowed rejection settles.
    await Promise.resolve();
    await Promise.resolve();
    expect(backend.writeCalls).toBe(1);
  });

  it('swallows backend feedback rejections without breaking in-memory state', async () => {
    const backend = new RejectingBackend();
    setTelemetryBackend(backend);

    const event = recordSynthesisEvent(baseInput);
    expect(recordFeedback(event.id, 'down')).toBe(true);

    const stored = getRecentSynthesisEvents().find(e => e.id === event.id);
    expect(stored?.feedback).toBe('down');

    await Promise.resolve();
    await Promise.resolve();
    expect(backend.feedbackCalls).toBe(1);
  });

  it('setTelemetryBackend(null) restores the default no-write behavior', async () => {
    const backend = new CapturingBackend();
    setTelemetryBackend(backend);
    recordSynthesisEvent({ ...baseInput, instanceId: 'first' });
    await Promise.resolve();
    await Promise.resolve();
    expect(backend.writes).toHaveLength(1);

    setTelemetryBackend(null);
    recordSynthesisEvent({ ...baseInput, instanceId: 'second' });
    await Promise.resolve();
    await Promise.resolve();

    // No additional writes after detach.
    expect(backend.writes).toHaveLength(1);
    expect(getTelemetryBackend()).toBeNull();
  });
});

describe('NoOpTelemetryBackend', () => {
  it('write and writeFeedback resolve without error', async () => {
    const backend = new NoOpTelemetryBackend();
    setTelemetryBackend(backend);

    const event = recordSynthesisEvent(baseInput);
    recordFeedback(event.id, 'up');

    // No throw, in-memory state untouched.
    await Promise.resolve();
    expect(getRecentSynthesisEvents()).toHaveLength(1);
  });
});

describe('InMemoryExtendedTelemetryBackend', () => {
  it('reads back what was written via the synthesis pipeline', async () => {
    const backend = new InMemoryExtendedTelemetryBackend();
    setTelemetryBackend(backend);

    const a = recordSynthesisEvent({ ...baseInput, instanceId: 'one' });
    const b = recordSynthesisEvent({ ...baseInput, instanceId: 'two' });
    const c = recordSynthesisEvent({ ...baseInput, instanceId: 'three' });

    // Drain the queued writes.
    await Promise.resolve();
    await Promise.resolve();

    const stored = backend.read();
    expect(stored.map(e => e.id)).toEqual([a.id, b.id, c.id]);
    expect(stored.map(e => e.instanceId)).toEqual(['one', 'two', 'three']);
  });

  it('captures feedback writes against previously-written events', async () => {
    const backend = new InMemoryExtendedTelemetryBackend();
    setTelemetryBackend(backend);

    const event = recordSynthesisEvent(baseInput);
    await Promise.resolve();
    expect(recordFeedback(event.id, 'down')).toBe(true);
    await Promise.resolve();
    await Promise.resolve();

    const stored = backend.read();
    expect(stored).toHaveLength(1);
    expect(stored[0].feedback).toBe('down');
    expect(typeof stored[0].feedbackTimestamp).toBe('string');
  });

  it('evicts oldest entries when its capacity is exceeded', async () => {
    const backend = new InMemoryExtendedTelemetryBackend(3);
    setTelemetryBackend(backend);

    recordSynthesisEvent({ ...baseInput, instanceId: 'a' });
    recordSynthesisEvent({ ...baseInput, instanceId: 'b' });
    recordSynthesisEvent({ ...baseInput, instanceId: 'c' });
    recordSynthesisEvent({ ...baseInput, instanceId: 'd' });

    await Promise.resolve();
    await Promise.resolve();

    const ids = backend.read().map(e => e.instanceId);
    expect(ids).toEqual(['b', 'c', 'd']);
  });

  it('exposes its default capacity constant', () => {
    expect(IN_MEMORY_EXTENDED_CAPACITY).toBe(5000);
  });
});

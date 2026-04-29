/**
 * violationsRecorder — F0.3 verification
 *
 * Verifies the in-memory ring buffer, optional pluggable backend, and
 * best-effort failure semantics (backend errors must not propagate).
 */

import {
  __testing__,
  getRecentViolations,
  recordViolations,
  setViolationsBackend,
  type ViolationsBackend,
} from '../violationsRecorder';
import type { Violation } from '../outputValidator';

beforeEach(() => {
  __testing__.reset();
});

const sampleViolation: Violation = {
  type: 'rigid-scope-refusal',
  detail: 'sample',
  span: [0, 10],
};

describe('recordViolations', () => {
  it('appends events to the ring buffer with stable ids and timestamps', () => {
    recordViolations({
      route: '/api/chat/agent',
      surface: '/programs/new',
      violations: [sampleViolation],
      responseLength: 200,
    });
    recordViolations({
      route: '/api/chat/agent',
      surface: '/home',
      violations: [],
      responseLength: 50,
    });
    expect(__testing__.size()).toBe(2);
    const recent = getRecentViolations();
    expect(recent[0].surface).toBe('/home');
    expect(recent[1].surface).toBe('/programs/new');
    expect(recent[0].id).toMatch(/^vlt_/);
    expect(recent[0].id).not.toEqual(recent[1].id);
  });

  it('records violationCount and distinct violationTypes', () => {
    const event = recordViolations({
      route: '/api/chat/agent',
      surface: '/programs/new',
      violations: [
        { type: 'rigid-scope-refusal', detail: 'a' },
        { type: 'rigid-scope-refusal', detail: 'b' },
        { type: 'uncited-pattern', detail: 'c' },
      ],
      responseLength: 100,
    });
    expect(event.violationCount).toBe(3);
    expect(event.violationTypes.sort()).toEqual(['rigid-scope-refusal', 'uncited-pattern']);
  });

  it('defaults tenantId to apex-retail when not supplied', () => {
    const event = recordViolations({
      route: '/api/chat',
      violations: [],
      responseLength: 0,
    });
    expect(event.tenantId).toBe('apex-retail');
  });

  it('respects an explicit tenantId / userId', () => {
    const event = recordViolations({
      route: '/api/chat',
      tenantId: 'meridian-health',
      userId: 'person_123',
      violations: [],
      responseLength: 0,
    });
    expect(event.tenantId).toBe('meridian-health');
    expect(event.userId).toBe('person_123');
  });

  it('writes through to the configured backend', async () => {
    const writes: unknown[] = [];
    const backend: ViolationsBackend = {
      async write(event) {
        writes.push(event);
      },
    };
    setViolationsBackend(backend);
    const event = recordViolations({
      route: '/api/chat/agent',
      violations: [sampleViolation],
      responseLength: 80,
    });
    // Backend write is async + best-effort; give it a tick.
    await Promise.resolve();
    await Promise.resolve();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ id: event.id });
  });

  it('swallows backend errors so the caller never sees them', () => {
    const backend: ViolationsBackend = {
      async write() {
        throw new Error('backend down');
      },
    };
    setViolationsBackend(backend);
    expect(() =>
      recordViolations({
        route: '/api/chat/agent',
        violations: [sampleViolation],
        responseLength: 80,
      }),
    ).not.toThrow();
  });
});

describe('getRecentViolations', () => {
  it('returns the most-recent N events in reverse chronological order', () => {
    for (let i = 0; i < 5; i++) {
      recordViolations({
        route: '/api/chat/agent',
        surface: `/surface-${i}`,
        violations: [],
        responseLength: i,
      });
    }
    const recent = getRecentViolations(3);
    expect(recent.map((e) => e.surface)).toEqual(['/surface-4', '/surface-3', '/surface-2']);
  });

  it('returns an empty array when limit is zero or negative', () => {
    recordViolations({
      route: '/api/chat/agent',
      violations: [],
      responseLength: 0,
    });
    expect(getRecentViolations(0)).toEqual([]);
    expect(getRecentViolations(-3)).toEqual([]);
  });
});

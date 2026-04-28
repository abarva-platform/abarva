/**
 * agent-mission-derived helpers — deterministic, pure tests for the
 * single-instance lookups used by Source and Programs detail pages.
 *
 * No network, no LLM calls, no randomness. Same inputs always produce
 * the same outputs.
 */

import {
  getMissionsForSourceEvent,
  getMissionsForProgram,
} from '@/lib/agent/agent-mission-derived';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';

describe('getMissionsForSourceEvent', () => {
  it('returns AMS Vendor Consolidation 2026 missions for the canonical id', () => {
    const missions = getMissionsForSourceEvent(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id,
    );
    expect(missions.length).toBeGreaterThanOrEqual(3);
    for (const m of missions) {
      expect(m.instanceId).toBe(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id);
      expect(m.patternId).toBe('PAT-SRC-AMS-001');
    }
  });

  it('returns [] when no source event matches the id', () => {
    expect(getMissionsForSourceEvent('does-not-exist')).toEqual([]);
  });

  it('is deterministic — same input → same output ids and order', () => {
    const a = getMissionsForSourceEvent(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id);
    const b = getMissionsForSourceEvent(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
    expect(a.map((m) => m.priority)).toEqual(b.map((m) => m.priority));
  });
});

describe('getMissionsForProgram', () => {
  it('returns missions for APX-CDP-2026 (case-insensitive on id)', () => {
    const upper = getMissionsForProgram('APX-CDP-2026');
    const lower = getMissionsForProgram('apx-cdp-2026');
    expect(upper.length).toBeGreaterThan(0);
    expect(upper.map((m) => m.id)).toEqual(lower.map((m) => m.id));
    for (const m of upper) {
      expect(m.patternId).toBe('PAT-PRG-CDP-001');
    }
  });

  it('returns [] when no program matches the id', () => {
    expect(getMissionsForProgram('not-a-program')).toEqual([]);
  });
});

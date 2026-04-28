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
  getPortfolioMissions,
} from '@/lib/agent/agent-mission-derived';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

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

describe('getPortfolioMissions', () => {
  it('returns up to `limit` missions sorted high → medium → low', () => {
    const missions = getPortfolioMissions(10);
    expect(missions.length).toBeGreaterThan(0);
    expect(missions.length).toBeLessThanOrEqual(10);
    // Default priorityFloor = 'medium' — no 'low' rows in the slice.
    for (const m of missions) {
      expect(m.priority === 'high' || m.priority === 'medium').toBe(true);
    }
    // Sorted: every adjacent pair must be in non-decreasing priority rank.
    const RANK = { high: 0, medium: 1, low: 2 } as const;
    for (let i = 1; i < missions.length; i++) {
      expect(RANK[missions[i - 1].priority]).toBeLessThanOrEqual(
        RANK[missions[i].priority],
      );
    }
  });

  it('honours the `limit` parameter and returns [] for limit=0', () => {
    const five = getPortfolioMissions(5);
    expect(five.length).toBeLessThanOrEqual(5);
    expect(getPortfolioMissions(0)).toEqual([]);
    expect(getPortfolioMissions(-1)).toEqual([]);
  });

  it('priorityFloor=low surfaces low-priority missions when present', () => {
    const decisive = getPortfolioMissions(50);
    const everything = getPortfolioMissions(50, { priorityFloor: 'low' });
    // Including 'low' must never reduce the result count.
    expect(everything.length).toBeGreaterThanOrEqual(decisive.length);
  });

  it('priorityFloor=high keeps only hard-pending missions', () => {
    const onlyHigh = getPortfolioMissions(50, { priorityFloor: 'high' });
    for (const m of onlyHigh) {
      expect(m.priority).toBe('high');
    }
  });

  it('spans multiple instances (portfolio view, not single-instance)', () => {
    const missions = getPortfolioMissions(50, { priorityFloor: 'low' });
    const uniqueInstanceIds = new Set(missions.map((m) => m.instanceId));
    // The Apex catalogue ships 4 programs + 1 source event = 5 instances;
    // any healthy portfolio view should touch at least 2 of them.
    expect(uniqueInstanceIds.size).toBeGreaterThanOrEqual(2);
  });

  it('every mission carries a non-empty instanceDisplayId for badge prefixes', () => {
    const missions = getPortfolioMissions(20);
    expect(missions.length).toBeGreaterThan(0);
    const validDisplayIds = new Set([
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.displayId,
      ...APEX_RETAIL_PROGRAM_INSTANCES.map((p) => p.displayId),
    ]);
    for (const m of missions) {
      expect(typeof m.instanceDisplayId).toBe('string');
      expect(m.instanceDisplayId.length).toBeGreaterThan(0);
      expect(validDisplayIds.has(m.instanceDisplayId)).toBe(true);
    }
  });

  it('is deterministic — same args → identical mission ids in identical order', () => {
    const a = getPortfolioMissions(8);
    const b = getPortfolioMissions(8);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });
});

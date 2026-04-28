/**
 * Mission derivation tests — pure, deterministic.
 *
 * Verifies that `deriveMissionsFromInstance` and `deriveAllMissions`
 * convert pending / partial gate-evaluator output into a stable mission
 * queue suitable for the Steward agent surface.
 *
 * No network, no LLM calls, no randomness.
 */

import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import {
  PAT_SRC_AMS_001,
  SOURCE_LIFECYCLE_PATTERNS,
} from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import {
  deriveMissionsFromInstance,
  deriveAllMissions,
  type DerivedMission,
} from '@/lib/reasoning/mission-derivation';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<DerivedMission['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function makeEmptyAmsInstance(): SourceEventInstance {
  // A minimal valid SourceEventInstance bound to PAT-SRC-AMS-001 with no
  // evidence, no artifacts, no responses — so every criterion is unmet.
  return {
    id: 'empty-ams-instance',
    displayId: 'EMPTY',
    tenantSlug: 'test-tenant',
    name: 'Empty AMS Instance',
    patternId: 'PAT-SRC-AMS-001',
    patternVersion: '1.0',
    currentStage: 'Plan',
    stageHistory: [],
    vendors: [],
    responses: [],
    artifacts: [],
    evidence: [],
    linkedPrograms: [],
    linkedSourceEvents: [],
    sponsor: { id: 'u1', name: 'Test', title: 'Sponsor' },
    flags: [],
    createdAt: '2026-01-01',
    lastModifiedAt: '2026-01-01',
    valueAtStakeUsd: 0,
  };
}

// ─── 1. Empty / no-pending cases ─────────────────────────────────────────────

describe('deriveMissionsFromInstance — empty cases', () => {
  it('returns an empty array when the pattern has no gate criteria', () => {
    const stubPattern: LifecyclePatternSeed = {
      ...PAT_SRC_AMS_001,
      gateCriteria: [],
      expectedArtifacts: [],
      contradictionTemplates: [],
    };
    const missions = deriveMissionsFromInstance(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      stubPattern,
    );
    expect(missions).toEqual([]);
  });

  it('deriveAllMissions returns [] for empty input arrays', () => {
    expect(deriveAllMissions([], [])).toEqual([]);
    expect(deriveAllMissions([AMS_VENDOR_CONSOLIDATION_2026_INSTANCE], [])).toEqual([]);
  });
});

// ─── 2. AMS Vendor Consolidation 2026 — end-to-end ───────────────────────────

describe('deriveMissionsFromInstance — AMS Vendor Consolidation 2026', () => {
  const missions = deriveMissionsFromInstance(
    AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    PAT_SRC_AMS_001,
  );

  it('produces at least 3 derived missions covering pending criteria', () => {
    expect(missions.length).toBeGreaterThanOrEqual(3);
  });

  it('every mission carries a stable id of the form `${instanceId}:${criterionId}`', () => {
    for (const mission of missions) {
      expect(mission.id).toBe(
        `${AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id}:${mission.criterionId}`,
      );
    }
  });

  it('every mission references PAT-SRC-AMS-001 and the AMS instance label', () => {
    for (const mission of missions) {
      expect(mission.patternId).toBe('PAT-SRC-AMS-001');
      expect(mission.instanceId).toBe(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id);
      expect(mission.instanceLabel).toBe(
        AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.name,
      );
    }
  });

  it('hard-pending criteria are prioritised above soft-pending criteria (hard > soft)', () => {
    const firstSoftIdx = missions.findIndex((m) => m.gateType === 'soft');
    if (firstSoftIdx === -1) return; // no soft criteria — trivially satisfied
    // No hard mission should come AFTER any soft mission in the sorted list.
    for (let i = firstSoftIdx; i < missions.length; i++) {
      expect(missions[i].gateType).toBe('soft');
    }
  });

  it('contains at least one hard-pending mission with priority "high"', () => {
    const hardHigh = missions.filter(
      (m) => m.gateType === 'hard' && m.priority === 'high',
    );
    expect(hardHigh.length).toBeGreaterThanOrEqual(1);
  });

  it('dedupes criteria — every criterionId appears exactly once', () => {
    const ids = missions.map((m) => m.criterionId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every mission has a non-empty description and evaluationHint copied from the pattern', () => {
    for (const mission of missions) {
      expect(mission.description.length).toBeGreaterThan(0);
      expect(mission.evaluationHint.length).toBeGreaterThan(0);
    }
  });
});

// ─── 3. Determinism / stable IDs ─────────────────────────────────────────────

describe('deriveMissionsFromInstance — determinism', () => {
  it('repeated calls produce identical output (same ids, same order)', () => {
    const a = deriveMissionsFromInstance(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      PAT_SRC_AMS_001,
    );
    const b = deriveMissionsFromInstance(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      PAT_SRC_AMS_001,
    );
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
    expect(a.map((m) => m.priority)).toEqual(b.map((m) => m.priority));
  });

  it('mission ids are unique across the result list', () => {
    const missions = deriveMissionsFromInstance(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      PAT_SRC_AMS_001,
    );
    const ids = missions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── 4. Hard vs soft prioritisation (synthetic instance) ─────────────────────

describe('deriveMissionsFromInstance — hard-vs-soft prioritisation', () => {
  it('every hard mission appears before every soft mission in sorted output', () => {
    const missions = deriveMissionsFromInstance(
      makeEmptyAmsInstance(),
      PAT_SRC_AMS_001,
    );
    expect(missions.length).toBeGreaterThan(0);
    let seenSoft = false;
    for (const mission of missions) {
      if (mission.gateType === 'soft') {
        seenSoft = true;
      } else {
        // gateType === 'hard'
        expect(seenSoft).toBe(false);
      }
    }
  });

  it('hard criteria are priority "high" or "medium" (never low)', () => {
    const missions = deriveMissionsFromInstance(
      makeEmptyAmsInstance(),
      PAT_SRC_AMS_001,
    );
    const hardMissions = missions.filter((m) => m.gateType === 'hard');
    expect(hardMissions.length).toBeGreaterThan(0);
    for (const m of hardMissions) {
      expect(['high', 'medium']).toContain(m.priority);
    }
  });

  it('soft criteria are always priority "low"', () => {
    const missions = deriveMissionsFromInstance(
      makeEmptyAmsInstance(),
      PAT_SRC_AMS_001,
    );
    const softMissions = missions.filter((m) => m.gateType === 'soft');
    for (const m of softMissions) {
      expect(m.priority).toBe('low');
    }
  });
});

// ─── 5. Sort order — priority + (stageId, criterionId) tie-breakers ──────────

describe('deriveMissionsFromInstance — sort order', () => {
  it('sorts by priority rank ascending (high < medium < low)', () => {
    const missions = deriveMissionsFromInstance(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      PAT_SRC_AMS_001,
    );
    for (let i = 1; i < missions.length; i++) {
      expect(PRIORITY_RANK[missions[i].priority]).toBeGreaterThanOrEqual(
        PRIORITY_RANK[missions[i - 1].priority],
      );
    }
  });

  it('within the same priority, ties break by (instanceId, stageId, criterionId)', () => {
    const missions = deriveMissionsFromInstance(
      makeEmptyAmsInstance(),
      PAT_SRC_AMS_001,
    );
    for (let i = 1; i < missions.length; i++) {
      const a = missions[i - 1];
      const b = missions[i];
      if (a.priority !== b.priority) continue;
      // Same priority — instanceId is identical (single instance), so check
      // stageId, then criterionId order.
      if (a.stageId !== b.stageId) {
        expect(a.stageId < b.stageId).toBe(true);
      } else {
        expect(a.criterionId <= b.criterionId).toBe(true);
      }
    }
  });
});

// ─── 6. deriveAllMissions across programs + source events ────────────────────

describe('deriveAllMissions — programs + source events', () => {
  const all = deriveAllMissions(
    [AMS_VENDOR_CONSOLIDATION_2026_INSTANCE, ...APEX_RETAIL_PROGRAM_INSTANCES],
    [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS],
  );

  it('produces missions covering both source events and programs', () => {
    const sourceMissions = all.filter(
      (m) => m.instanceId === AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id,
    );
    const programMissions = all.filter((m) =>
      APEX_RETAIL_PROGRAM_INSTANCES.some((p) => p.id === m.instanceId),
    );
    expect(sourceMissions.length).toBeGreaterThan(0);
    expect(programMissions.length).toBeGreaterThan(0);
  });

  it('skips instances whose pattern is not in the supplied catalogue', () => {
    // Only supply program patterns — source instance should be silently skipped.
    const missions = deriveAllMissions(
      [AMS_VENDOR_CONSOLIDATION_2026_INSTANCE, ...APEX_RETAIL_PROGRAM_INSTANCES],
      [...PROGRAM_LIFECYCLE_PATTERNS],
    );
    const sourceIds = missions.filter(
      (m) => m.instanceId === AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id,
    );
    expect(sourceIds.length).toBe(0);
  });

  it('overall list is globally sorted with high → medium → low', () => {
    for (let i = 1; i < all.length; i++) {
      expect(PRIORITY_RANK[all[i].priority]).toBeGreaterThanOrEqual(
        PRIORITY_RANK[all[i - 1].priority],
      );
    }
  });
});

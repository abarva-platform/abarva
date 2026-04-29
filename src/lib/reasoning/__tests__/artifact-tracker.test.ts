/**
 * Artifact tracker tests — REASON-8
 *
 * Deterministic: no network, no LLM calls, no randomness, no Date.now.
 * Same inputs always produce the same outputs.
 *
 * Uses PAT_SRC_AMS_001 (33 expected artifacts across 10 stages) and
 * AMS_VENDOR_CONSOLIDATION_2026_INSTANCE (18 instance artifacts) as the
 * canonical end-to-end fixture for at least 3 of the test groups.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import {
  createArtifactTracker,
  LifecycleArtifactTracker,
  trackArtifacts,
} from '@/lib/reasoning/artifact-tracker';
import type {
  SourceArtifactRef,
  SourceEventInstance,
} from '@/lib/source/source-event-instance';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';

// ─── Fixture helpers ───────────────────────────────────────────────────────────

/**
 * Build a minimal SourceEventInstance with a custom artifacts list.
 * All non-artifact fields are stubbed; the tracker only reads `artifacts`.
 */
function makeInstance(artifacts: SourceArtifactRef[]): SourceEventInstance {
  return {
    id: 'INST-TEST',
    displayId: 'TEST-001',
    tenantSlug: 'test',
    tenantId: 'apex-retail',
    name: 'Test instance',
    patternId: 'PAT-SRC-AMS-001',
    patternVersion: '1.0',
    currentStage: 'Plan',
    stageHistory: [],
    vendors: [],
    responses: [],
    artifacts,
    evidence: [],
    linkedPrograms: [],
    linkedSourceEvents: [],
    sponsor: { id: 's', name: 's', title: 's' },
    flags: [],
    createdAt: '2026-01-01',
    lastModifiedAt: '2026-01-01',
    valueAtStakeUsd: 0,
  };
}

/**
 * Build an artifact ref that fulfils a given expected-artifact id.
 */
function makeArtifact(
  expectedArtifactId: string,
  stageId: string,
  status: SourceArtifactRef['status'],
): SourceArtifactRef {
  return {
    id: `${expectedArtifactId}-inst`,
    label: expectedArtifactId,
    stageId,
    expectedArtifactId,
    status,
    createdAt: '2026-01-01',
  };
}

/**
 * Build an instance with one approved/locked artifact for every expected
 * artifact in PAT_SRC_AMS_001 (regardless of requirement).
 */
function makeAllPresentInstance(): SourceEventInstance {
  const artifacts = PAT_SRC_AMS_001.expectedArtifacts.map((e) =>
    makeArtifact(e.id, e.stageId, 'locked'),
  );
  return makeInstance(artifacts);
}

// ─── 1. Empty instance — every expectation reported missing ───────────────────

describe('trackForStage — empty instance', () => {
  let tracker: LifecycleArtifactTracker;

  beforeEach(() => {
    tracker = createArtifactTracker(PAT_SRC_AMS_001);
  });

  it('Plan stage reports all 4 expectations as missing when instance has no artifacts', () => {
    const result = tracker.trackForStage('Plan', makeInstance([]));
    expect(result.missing).toHaveLength(4);
    expect(result.present).toHaveLength(0);
    expect(result.inProgress).toHaveLength(0);
  });

  it('Plan stage reports 3 required-missing (PLAN-04 is recommended)', () => {
    const result = tracker.trackForStage('Plan', makeInstance([]));
    // ART-AMS-PLAN-01/02/03 are required; ART-AMS-PLAN-04 is recommended.
    expect(result.requiredMissingCount).toBe(3);
  });

  it('every expected stage reports requiredMissingCount > 0 when instance is empty', () => {
    const allStages = tracker.trackAll(makeInstance([]));
    for (const stage of allStages) {
      expect(stage.requiredMissingCount).toBeGreaterThan(0);
    }
  });
});

// ─── 2. All-present instance — every expectation present, none missing ───────

describe('trackForStage — all expectations present', () => {
  let tracker: LifecycleArtifactTracker;

  beforeEach(() => {
    tracker = createArtifactTracker(PAT_SRC_AMS_001);
  });

  it('reports zero missing for every stage when every expectation has a locked artifact', () => {
    const instance = makeAllPresentInstance();
    const allStages = tracker.trackAll(instance);
    for (const stage of allStages) {
      expect(stage.missing).toHaveLength(0);
      expect(stage.requiredMissingCount).toBe(0);
      expect(stage.inProgress).toHaveLength(0);
    }
  });

  it('Plan stage reports all 4 expectations as present', () => {
    const instance = makeAllPresentInstance();
    const result = tracker.trackForStage('Plan', instance);
    expect(result.present).toHaveLength(4);
    expect(result.missing).toHaveLength(0);
  });
});

// ─── 3. Mixed states — present + in-progress + missing on a single stage ──────

describe('trackForStage — mixed states', () => {
  it('separates present/inProgress/missing correctly for the BAFO stage', () => {
    // BAFO expectations: -01 required, -02 required, -03 required, -04 required, -05 recommended
    const instance = makeInstance([
      makeArtifact('ART-AMS-BAFO-01', 'BAFO', 'locked'),    // present
      makeArtifact('ART-AMS-BAFO-03', 'BAFO', 'draft'),     // in-progress
      makeArtifact('ART-AMS-BAFO-04', 'BAFO', 'approved'),  // present
      // BAFO-02 missing (required), BAFO-05 missing (recommended)
    ]);
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const result = tracker.trackForStage('BAFO', instance);

    expect(result.present.map((a) => a.artifactId).sort()).toEqual([
      'ART-AMS-BAFO-01',
      'ART-AMS-BAFO-04',
    ]);
    expect(result.inProgress.map((a) => a.artifactId)).toEqual([
      'ART-AMS-BAFO-03',
    ]);
    expect(result.missing.map((a) => a.artifactId).sort()).toEqual([
      'ART-AMS-BAFO-02',
      'ART-AMS-BAFO-05',
    ]);
    // BAFO-02 is required, BAFO-05 is recommended → 1 required missing.
    expect(result.requiredMissingCount).toBe(1);
  });
});

// ─── 4. isStageReady — required vs recommended ───────────────────────────────

describe('isStageReady', () => {
  let tracker: LifecycleArtifactTracker;

  beforeEach(() => {
    tracker = createArtifactTracker(PAT_SRC_AMS_001);
  });

  it('returns true when every required artifact is present (recommended may be missing)', () => {
    // Plan: -01/-02/-03 required, -04 recommended.
    const instance = makeInstance([
      makeArtifact('ART-AMS-PLAN-01', 'Plan', 'locked'),
      makeArtifact('ART-AMS-PLAN-02', 'Plan', 'locked'),
      makeArtifact('ART-AMS-PLAN-03', 'Plan', 'locked'),
      // PLAN-04 (recommended) intentionally omitted.
    ]);
    expect(tracker.isStageReady('Plan', instance)).toBe(true);
  });

  it('returns false when any required artifact is missing', () => {
    const instance = makeInstance([
      makeArtifact('ART-AMS-PLAN-01', 'Plan', 'locked'),
      makeArtifact('ART-AMS-PLAN-02', 'Plan', 'locked'),
      // PLAN-03 (required) missing.
    ]);
    expect(tracker.isStageReady('Plan', instance)).toBe(false);
  });

  it('returns false when a required artifact exists only in draft (in-progress)', () => {
    const instance = makeInstance([
      makeArtifact('ART-AMS-PLAN-01', 'Plan', 'locked'),
      makeArtifact('ART-AMS-PLAN-02', 'Plan', 'locked'),
      makeArtifact('ART-AMS-PLAN-03', 'Plan', 'draft'),
    ]);
    expect(tracker.isStageReady('Plan', instance)).toBe(false);
  });

  it('returns true for a stage with no expected artifacts (vacuous readiness)', () => {
    // No AMS stage is artifact-less, but if asked about an unknown stage the
    // tracker treats it as ready by definition (zero requirements).
    const instance = makeInstance([]);
    expect(tracker.isStageReady('NoSuchStage', instance)).toBe(true);
  });
});

// ─── 5. Stage filter — only that stage's artifacts come back ─────────────────

describe('trackForStage — stage scoping', () => {
  it('returns only artifacts for the requested stage', () => {
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const result = tracker.trackForStage('Plan', makeInstance([]));
    const stageIds = new Set([
      ...result.present.map((a) => a.stageId),
      ...result.inProgress.map((a) => a.stageId),
      ...result.missing.map((a) => a.stageId),
    ]);
    expect([...stageIds]).toEqual(['Plan']);
  });

  it('returns empty buckets for a stage id that has no expectations', () => {
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const result = tracker.trackForStage('UnknownStage', makeInstance([]));
    expect(result.present).toEqual([]);
    expect(result.inProgress).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.requiredMissingCount).toBe(0);
  });
});

// ─── 6. trackAll — pattern stage order + coverage ────────────────────────────

describe('trackAll', () => {
  it('returns one entry per artifact-bearing stage in pattern stage order', () => {
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const all = tracker.trackAll(makeInstance([]));
    // PAT_SRC_AMS_001 has 10 stages; every stage has at least one expected artifact.
    expect(all).toHaveLength(10);
    expect(all.map((s) => s.stageId)).toEqual([
      'Plan',
      'RFI',
      'Shortlist',
      'RFP',
      'Q&A',
      'Initial-Bid',
      'BAFO',
      'Selection',
      'Award',
      'Onboard',
    ]);
  });
});

// ─── 7. Determinism — running twice yields identical output ──────────────────

describe('determinism', () => {
  it('two runs of trackAll on the same fixture produce identical output', () => {
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const a = tracker.trackAll(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const b = tracker.trackAll(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('two trackers built from the same pattern produce identical output', () => {
    const a = createArtifactTracker(PAT_SRC_AMS_001).trackAll(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    const b = createArtifactTracker(PAT_SRC_AMS_001).trackAll(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    expect(a).toEqual(b);
  });
});

// ─── 8. Convenience top-level — trackArtifacts ───────────────────────────────

describe('trackArtifacts (convenience function)', () => {
  it('returns the same output as createArtifactTracker(...).trackAll(...)', () => {
    const direct = createArtifactTracker(PAT_SRC_AMS_001).trackAll(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    const convenience = trackArtifacts(
      PAT_SRC_AMS_001,
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    expect(convenience).toEqual(direct);
  });
});

// ─── 9. End-to-end against the canonical fixture ─────────────────────────────

describe('end-to-end — AMS_VENDOR_CONSOLIDATION_2026_INSTANCE', () => {
  let tracker: LifecycleArtifactTracker;

  beforeEach(() => {
    tracker = createArtifactTracker(PAT_SRC_AMS_001);
  });

  it('the fixture has 19 instance artifacts (sanity check)', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.artifacts).toHaveLength(19);
  });

  it('Plan stage: all 3 required artifacts are present, recommended PLAN-04 is missing', () => {
    const result = tracker.trackForStage(
      'Plan',
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    expect(result.present.map((a) => a.artifactId).sort()).toEqual([
      'ART-AMS-PLAN-01',
      'ART-AMS-PLAN-02',
      'ART-AMS-PLAN-03',
    ]);
    expect(result.missing.map((a) => a.artifactId)).toEqual([
      'ART-AMS-PLAN-04',
    ]);
    expect(result.requiredMissingCount).toBe(0);
  });

  it('BAFO stage: BAFO-01 present, BAFO-03/04 in progress, BAFO-02 + BAFO-05 missing', () => {
    const result = tracker.trackForStage(
      'BAFO',
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    expect(result.present.map((a) => a.artifactId)).toEqual([
      'ART-AMS-BAFO-01',
    ]);
    expect(result.inProgress.map((a) => a.artifactId).sort()).toEqual([
      'ART-AMS-BAFO-03',
      'ART-AMS-BAFO-04',
    ]);
    expect(result.missing.map((a) => a.artifactId).sort()).toEqual([
      'ART-AMS-BAFO-02',
      'ART-AMS-BAFO-05',
    ]);
    // BAFO-02 is required (missing), BAFO-05 is recommended.
    expect(result.requiredMissingCount).toBe(1);
  });

  it('isStageReady("Plan", fixture) is true (Plan completed in storyline)', () => {
    expect(
      tracker.isStageReady('Plan', AMS_VENDOR_CONSOLIDATION_2026_INSTANCE),
    ).toBe(true);
  });

  it('isStageReady("BAFO", fixture) is false (BAFO not yet complete)', () => {
    expect(
      tracker.isStageReady('BAFO', AMS_VENDOR_CONSOLIDATION_2026_INSTANCE),
    ).toBe(false);
  });

  it('Selection stage: every required artifact missing (selection has not happened)', () => {
    const result = tracker.trackForStage(
      'Selection',
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    );
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.requiredMissingCount).toBe(
      PAT_SRC_AMS_001.expectedArtifacts.filter(
        (e) => e.stageId === 'Selection' && e.requirement === 'required',
      ).length,
    );
  });
});

// ─── 10. ArtifactExpectation provenance ──────────────────────────────────────

describe('patternRef provenance', () => {
  it('every returned expectation carries pattern id + version + stage section', () => {
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const result = tracker.trackForStage('Plan', makeInstance([]));
    for (const exp of result.missing) {
      expect(exp.patternRef.patternId).toBe('PAT-SRC-AMS-001');
      expect(exp.patternRef.patternVersion).toBe(PAT_SRC_AMS_001.version);
      expect(exp.patternRef.section).toBe('§ Expected artifacts — Plan');
    }
  });
});

// ─── 11. present flag mirrors bucket placement ───────────────────────────────

describe('ArtifactExpectation.present flag', () => {
  it('present=true for entries in the present bucket; present=false elsewhere', () => {
    const instance = makeInstance([
      makeArtifact('ART-AMS-PLAN-01', 'Plan', 'locked'),
      makeArtifact('ART-AMS-PLAN-02', 'Plan', 'draft'),
    ]);
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const result = tracker.trackForStage('Plan', instance);
    expect(result.present.every((a) => a.present === true)).toBe(true);
    expect(result.inProgress.every((a) => a.present === false)).toBe(true);
    expect(result.missing.every((a) => a.present === false)).toBe(true);
  });
});

// ─── 12. Approved status is treated as present (not in-progress) ─────────────

describe('approved vs locked status', () => {
  it('approved status counts as present (gate-clearable)', () => {
    const instance = makeInstance([
      makeArtifact('ART-AMS-PLAN-01', 'Plan', 'approved'),
      makeArtifact('ART-AMS-PLAN-02', 'Plan', 'approved'),
      makeArtifact('ART-AMS-PLAN-03', 'Plan', 'approved'),
    ]);
    const tracker = createArtifactTracker(PAT_SRC_AMS_001);
    const result = tracker.trackForStage('Plan', instance);
    expect(result.present).toHaveLength(3);
    expect(result.inProgress).toHaveLength(0);
    expect(tracker.isStageReady('Plan', instance)).toBe(true);
  });
});

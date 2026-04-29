/**
 * Stage handoff narrative tests — REASON-31
 *
 * Pure deterministic helper: identical inputs always yield identical outputs.
 * No network, no LLM, no randomness.
 *
 * Tests use a small synthetic pattern so each branch is exercised in
 * isolation, plus a sanity-check against the live PAT_SRC_AMS_001 and
 * PAT_PRG_CDP_001 patterns to confirm transition counts and pattern wiring.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { PAT_PRG_CDP_001 } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildStageHandoffNarratives } from '@/lib/reasoning/stage-handoff-narrative';
import type {
  ExpectedArtifact,
  GateCriterion,
  LifecyclePatternSeed,
  LifecycleStage,
} from '@/lib/intelligence/seed-types';

function makeSyntheticPattern(overrides: {
  stages: LifecycleStage[];
  expectedArtifacts?: ExpectedArtifact[];
  gateCriteria?: GateCriterion[];
}): LifecyclePatternSeed {
  return {
    id: 'PAT-TEST-HANDOFF',
    slug: 'test-handoff',
    title: 'Test Handoff Pattern',
    domain: 'sourcing',
    tier: 'authoritative',
    vertical: 'cross-industry',
    thesis: '',
    applicability: '',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.5,
    createdFrom: 'deterministic_seed',
    createdBy: 'test',
    createdAt: '2026-04-28',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [],
    relatedPatternIds: [],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: '',
    kind: 'lifecycle',
    patternId: 'PAT-SRC-AMS-001',
    stages: overrides.stages,
    gateCriteria: overrides.gateCriteria ?? [],
    expectedArtifacts: overrides.expectedArtifacts ?? [],
    contradictionTemplates: [],
    failureModes: [],
    coAppliesWithPatternIds: [],
    typicalDurationDays: { min: 1, max: 1 },
  };
}

// ─── 1. Happy path ────────────────────────────────────────────────────────────

describe('buildStageHandoffNarratives — happy path', () => {
  it('produces N-1 transitions for N stages with required artifacts and gates', () => {
    const pattern = makeSyntheticPattern({
      stages: [
        { id: 'A', label: 'Alpha', description: '', order: 1 },
        { id: 'B', label: 'Beta', description: '', order: 2 },
        { id: 'C', label: 'Gamma', description: '', order: 3 },
      ],
      expectedArtifacts: [
        { id: 'art-A1', label: 'Charter', stageId: 'A', requirement: 'required', gateType: 'hard', description: '' },
        { id: 'art-A2', label: 'Plan',    stageId: 'A', requirement: 'required', gateType: 'hard', description: '' },
        { id: 'art-A3', label: 'Notes',   stageId: 'A', requirement: 'optional', gateType: 'soft', description: '' },
        { id: 'art-B1', label: 'Report',  stageId: 'B', requirement: 'required', gateType: 'hard', description: '' },
      ],
      gateCriteria: [
        { id: 'gate-B1', description: 'Charter present',  gateType: 'hard', stageId: 'B', evaluationHint: '' },
        { id: 'gate-B2', description: 'Plan ratified',    gateType: 'hard', stageId: 'B', evaluationHint: '' },
        { id: 'gate-B3', description: 'Stakeholders met', gateType: 'soft', stageId: 'B', evaluationHint: '' },
        { id: 'gate-C1', description: 'Report approved',  gateType: 'hard', stageId: 'C', evaluationHint: '' },
      ],
    });

    const out = buildStageHandoffNarratives(pattern);
    expect(out).toHaveLength(2);

    const ab = out[0]!;
    expect(ab.fromStageId).toBe('A');
    expect(ab.toStageId).toBe('B');
    expect(ab.fromLabel).toBe('Alpha');
    expect(ab.toLabel).toBe('Beta');
    // Optional artifact ART-A3 is excluded — only required ones are reported.
    expect(ab.expectedHandoffArtifacts.map((a) => a.id)).toEqual(['art-A1', 'art-A2']);
    expect(ab.nextStageGateCriteria).toHaveLength(3);
    expect(ab.narrative).toBe(
      'Alpha hands 2 required artifacts to Beta: Charter, Plan. Beta requires 3 gate criteria before it can advance, of which 2 are hard.',
    );

    const bc = out[1]!;
    expect(bc.narrative).toBe(
      'Beta hands 1 required artifact to Gamma: Report. Gamma requires 1 gate criterion before it can advance, of which 1 is hard.',
    );
  });
});

// ─── 2. Stage with no required artifacts ──────────────────────────────────────

describe('buildStageHandoffNarratives — no required artifacts', () => {
  it('uses the stage-internal-evidence wording when fromStage produces no required artifacts', () => {
    const pattern = makeSyntheticPattern({
      stages: [
        { id: 'A', label: 'Alpha', description: '', order: 1 },
        { id: 'B', label: 'Beta',  description: '', order: 2 },
      ],
      expectedArtifacts: [
        { id: 'art-A1', label: 'Soft Note', stageId: 'A', requirement: 'recommended', gateType: 'soft', description: '' },
      ],
      gateCriteria: [
        { id: 'gate-B1', description: 'Sponsor sign-off', gateType: 'hard', stageId: 'B', evaluationHint: '' },
      ],
    });

    const out = buildStageHandoffNarratives(pattern);
    expect(out).toHaveLength(1);
    expect(out[0]!.expectedHandoffArtifacts).toHaveLength(0);
    expect(out[0]!.narrative).toBe(
      'Alpha produces no required artifacts; Beta relies on stage-internal evidence. Beta requires 1 gate criterion before it can advance, of which 1 is hard.',
    );
  });

  it('omits the gate clause when there are no required artifacts AND no gate criteria', () => {
    const pattern = makeSyntheticPattern({
      stages: [
        { id: 'A', label: 'Alpha', description: '', order: 1 },
        { id: 'B', label: 'Beta',  description: '', order: 2 },
      ],
    });

    const out = buildStageHandoffNarratives(pattern);
    expect(out[0]!.narrative).toBe(
      'Alpha produces no required artifacts; Beta relies on stage-internal evidence.',
    );
  });
});

// ─── 3. End-of-lifecycle (single-stage / fewer than 2 stages) ─────────────────

describe('buildStageHandoffNarratives — end of lifecycle', () => {
  it('returns an empty array for a single-stage lifecycle', () => {
    const pattern = makeSyntheticPattern({
      stages: [{ id: 'Solo', label: 'Solo', description: '', order: 1 }],
    });
    expect(buildStageHandoffNarratives(pattern)).toEqual([]);
  });

  it('returns an empty array for a zero-stage lifecycle', () => {
    const pattern = makeSyntheticPattern({ stages: [] });
    expect(buildStageHandoffNarratives(pattern)).toEqual([]);
  });

  it('respects stage `order` rather than array order when emitting transitions', () => {
    const pattern = makeSyntheticPattern({
      stages: [
        // Out-of-order array, in-order `order` field
        { id: 'C', label: 'Gamma', description: '', order: 3 },
        { id: 'A', label: 'Alpha', description: '', order: 1 },
        { id: 'B', label: 'Beta',  description: '', order: 2 },
      ],
    });
    const out = buildStageHandoffNarratives(pattern);
    expect(out.map((h) => `${h.fromStageId}->${h.toStageId}`)).toEqual([
      'A->B',
      'B->C',
    ]);
  });
});

// ─── 4. Top-2 truncation when many artifacts exist ────────────────────────────

describe('buildStageHandoffNarratives — top-2 artifact label truncation', () => {
  it('only inlines the first two required artifact labels', () => {
    const pattern = makeSyntheticPattern({
      stages: [
        { id: 'A', label: 'Alpha', description: '', order: 1 },
        { id: 'B', label: 'Beta',  description: '', order: 2 },
      ],
      expectedArtifacts: [
        { id: 'art-A1', label: 'First',  stageId: 'A', requirement: 'required', gateType: 'hard', description: '' },
        { id: 'art-A2', label: 'Second', stageId: 'A', requirement: 'required', gateType: 'hard', description: '' },
        { id: 'art-A3', label: 'Third',  stageId: 'A', requirement: 'required', gateType: 'hard', description: '' },
        { id: 'art-A4', label: 'Fourth', stageId: 'A', requirement: 'required', gateType: 'hard', description: '' },
      ],
    });
    const out = buildStageHandoffNarratives(pattern);
    expect(out[0]!.expectedHandoffArtifacts).toHaveLength(4);
    expect(out[0]!.narrative).toContain('First, Second');
    expect(out[0]!.narrative).not.toContain('Third');
    expect(out[0]!.narrative).not.toContain('Fourth');
    // 4 artifacts noted in the count
    expect(out[0]!.narrative.startsWith('Alpha hands 4 required artifacts to Beta')).toBe(true);
  });
});

// ─── 5. Determinism ───────────────────────────────────────────────────────────

describe('buildStageHandoffNarratives — determinism', () => {
  it('returns identical output on repeated calls with the same pattern', () => {
    const a = buildStageHandoffNarratives(PAT_SRC_AMS_001);
    const b = buildStageHandoffNarratives(PAT_SRC_AMS_001);
    expect(a).toEqual(b);
    // Strict deep-equality of the narrative strings
    expect(a.map((x) => x.narrative)).toEqual(b.map((x) => x.narrative));
  });
});

// ─── 6. Live AMS pattern wiring ───────────────────────────────────────────────

describe('buildStageHandoffNarratives — PAT_SRC_AMS_001 integration', () => {
  it('produces 9 transitions for the 10-stage AMS lifecycle', () => {
    const out = buildStageHandoffNarratives(PAT_SRC_AMS_001);
    expect(out).toHaveLength(9);
    // First transition is Plan -> RFI
    expect(out[0]!.fromStageId).toBe('Plan');
    expect(out[0]!.toStageId).toBe('RFI');
    // Plan has 3 required artifacts; RFI has no gate criteria of its own.
    expect(out[0]!.expectedHandoffArtifacts).toHaveLength(3);
    expect(out[0]!.narrative).toContain('Plan hands 3 required artifacts to RFI');
    // Last transition ends at Onboard
    expect(out[out.length - 1]!.toStageId).toBe('Onboard');
  });
});

// ─── 7. Live CDP program pattern wiring ───────────────────────────────────────

describe('buildStageHandoffNarratives — PAT_PRG_CDP_001 integration', () => {
  it('produces 6 transitions for the 7-phase CDP programme lifecycle', () => {
    const out = buildStageHandoffNarratives(PAT_PRG_CDP_001);
    expect(out).toHaveLength(6);
    // First transition: P0-Originate -> P1-Discovery
    expect(out[0]!.fromStageId).toBe('P0-Originate');
    expect(out[0]!.toStageId).toBe('P1-Discovery');
    // Final transition: P5-Activate -> P6-Operate
    const last = out[out.length - 1]!;
    expect(last.fromStageId).toBe('P5-Activate');
    expect(last.toStageId).toBe('P6-Operate');
    // Every narrative is non-empty
    for (const h of out) {
      expect(typeof h.narrative).toBe('string');
      expect(h.narrative.length).toBeGreaterThan(0);
    }
  });
});

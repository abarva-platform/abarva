/**
 * Program synthesis context builder tests — REASON-15
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Same inputs always produce the same outputs.
 *
 * Uses APX_CDP_2026_INSTANCE as the canonical fixture because it has the
 * richest state: P3 Design, pending gate, open blocker, linked source event.
 */

import {
  APX_CDP_2026_INSTANCE,
  APX_LPM_2026_INSTANCE,
  APX_SAP_2026_INSTANCE,
  APX_DFV2_INSTANCE,
} from '@/lib/programs/program-instances';
import {
  buildProgramSynthesisContext,
  programInstanceStateHash,
} from '@/lib/reasoning/program-synthesis-context-builder';
import { PAT_PRG_CDP_001, PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { ProgramInstance, ProgramPatternId } from '@/lib/programs/program-instance';

// ─── 1. instanceType === 'program' ────────────────────────────────────────────

describe('buildProgramSynthesisContext — instanceType', () => {
  it('returns instanceType: "program"', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.instanceType).toBe('program');
  });
});

// ─── 2. patternId matches ─────────────────────────────────────────────────────

describe('buildProgramSynthesisContext — patternId', () => {
  it('patternId matches the instance patternId', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.patternId).toBe(APX_CDP_2026_INSTANCE.patternId);
  });

  it('patternVersion is a non-empty string', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    // Pattern version comes from the resolved LifecyclePatternSeed when
    // available (authoritative), otherwise from the instance itself.
    expect(typeof ctx.patternVersion).toBe('string');
    expect(ctx.patternVersion.length).toBeGreaterThan(0);
  });
});

// ─── 3. currentStage starts with 'P3' for the CDP instance ───────────────────

describe('buildProgramSynthesisContext — currentStage', () => {
  it('currentStage starts with "P3" for APX_CDP_2026_INSTANCE (phase 3)', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.currentStage).toMatch(/^P3/);
  });

  it('currentStage includes the phase label', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    // CDP instance is at phase 3 → 'Design'
    expect(ctx.currentStage).toContain('Design');
  });
});

// ─── 4. cascadeContext has at least one entry (AMS source event link) ─────────

describe('buildProgramSynthesisContext — cascadeContext', () => {
  it('cascadeContext has at least one entry for APX_CDP_2026_INSTANCE', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.cascadeContext.length).toBeGreaterThan(0);
  });

  it('first cascade entry has sourceInstanceId = SRC-AMS-2026', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.cascadeContext[0].sourceInstanceId).toBe('SRC-AMS-2026');
  });

  it('first cascade entry has targetInstanceId = APX-CDP-2026', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.cascadeContext[0].targetInstanceId).toBe('APX-CDP-2026');
  });

  it('AMS depends-on link is mapped to blocking severity', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    const amsLink = ctx.cascadeContext.find(c => c.sourceInstanceId === 'SRC-AMS-2026');
    expect(amsLink?.severity).toBe('blocking');
  });
});

// ─── 5. instanceSnapshot carries expected shape ───────────────────────────────

describe('buildProgramSynthesisContext — instanceSnapshot', () => {
  it('instanceSnapshot.name matches instance name', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.instanceSnapshot['name']).toBe(APX_CDP_2026_INSTANCE.name);
  });

  it('instanceSnapshot.currentPhase === 3', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.instanceSnapshot['currentPhase']).toBe(3);
  });

  it('instanceSnapshot.openBlockers is a non-empty array', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    const blockers = ctx.instanceSnapshot['openBlockers'] as string[];
    expect(Array.isArray(blockers)).toBe(true);
    expect(blockers.length).toBeGreaterThan(0);
  });

  it('instanceSnapshot.linkedSourceEvents contains AMS entry', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    const linked = ctx.instanceSnapshot['linkedSourceEvents'] as Array<{ id: string; name: string; type: string }>;
    expect(linked.some(l => l.id === 'SRC-AMS-2026')).toBe(true);
  });
});

// ─── 6. gatesSummary reflects pending gate ────────────────────────────────────

describe('buildProgramSynthesisContext — gatesSummary', () => {
  it('gatesSummary.unmet > 0 when gate is pending', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    // P3 gate is pending; pattern wiring evaluates multiple Build-gate criteria
    // and the shape-only fallback returns a single unmet entry — both are > 0.
    expect(ctx.gatesSummary.unmet).toBeGreaterThan(0);
    expect(ctx.gatesSummary.total).toBeGreaterThanOrEqual(1);
  });

  it('gatesSummary.blocked is non-empty for the pending CDP gate', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.gatesSummary.blocked.length).toBeGreaterThan(0);
  });
});

// ─── 7. missingArtifacts surfaces gap signals ────────────────────────────────

describe('buildProgramSynthesisContext — missingArtifacts', () => {
  it('missingArtifacts is non-empty for APX_CDP_2026_INSTANCE at P3', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.missingArtifacts.length).toBeGreaterThan(0);
  });

  it('missingArtifacts does not include complete deliverables (when shape-only fallback is used)', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    const completeIds = APX_CDP_2026_INSTANCE.deliverables
      .filter(d => d.status === 'complete')
      .map(d => d.id);
    const missingIds = ctx.missingArtifacts.map(a => a.artifactId);
    for (const id of completeIds) {
      expect(missingIds).not.toContain(id);
    }
  });
});

// ─── 8. programInstanceStateHash — determinism ───────────────────────────────

describe('programInstanceStateHash', () => {
  it('returns the same hash for the same instance state', () => {
    const h1 = programInstanceStateHash(APX_CDP_2026_INSTANCE);
    const h2 = programInstanceStateHash(APX_CDP_2026_INSTANCE);
    expect(h1).toBe(h2);
  });

  it('returns a non-empty string', () => {
    const h = programInstanceStateHash(APX_CDP_2026_INSTANCE);
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });

  it('hash changes when currentPhase changes', () => {
    const original = programInstanceStateHash(APX_CDP_2026_INSTANCE);
    const modified = programInstanceStateHash({
      ...APX_CDP_2026_INSTANCE,
      currentPhase: APX_CDP_2026_INSTANCE.currentPhase + 1,
    });
    expect(original).not.toBe(modified);
  });

  it('hash changes when deliverable count changes', () => {
    const original = programInstanceStateHash(APX_CDP_2026_INSTANCE);
    const modified = programInstanceStateHash({
      ...APX_CDP_2026_INSTANCE,
      deliverables: APX_CDP_2026_INSTANCE.deliverables.slice(0, 3),
    });
    expect(original).not.toBe(modified);
  });
});

// ─── 9. Pattern wiring (REASON-3) ─────────────────────────────────────────────
//
// New behaviour: when the instance's patternId resolves to a typed
// LifecyclePatternSeed in PROGRAM_LIFECYCLE_PATTERNS, the builder runs the
// gate evaluator, contradiction detector, failure-mode detector, and artifact
// tracker against the program evidence map. The Programs surface gets
// first-class reasoning parity with Source.

describe('buildProgramSynthesisContext — pattern wiring (CDP P3)', () => {
  it('resolves PAT-PRG-CDP-001 from PROGRAM_LIFECYCLE_PATTERNS without an explicit pattern argument', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.patternId).toBe('PAT-PRG-CDP-001');
    // Pattern version is sourced from the resolved pattern, not the placeholder
    // version on the instance. PAT_PRG_CDP_001.version is the source of truth.
    expect(ctx.patternVersion).toBe(PAT_PRG_CDP_001.version);
  });

  it('produces a non-empty gatesSummary.total when the pattern is resolved', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    // Pattern wiring → multiple Build-gate criteria evaluated
    expect(ctx.gatesSummary.total).toBeGreaterThanOrEqual(1);
  });

  it('explicit pattern argument is honoured (overrides automatic resolution)', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);
    expect(ctx.patternId).toBe(PAT_PRG_CDP_001.patternId);
    expect(ctx.patternVersion).toBe(PAT_PRG_CDP_001.version);
  });

  it('stageGuidance comes from the pattern stage description when wired', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);
    const stageDef = PAT_PRG_CDP_001.stages.find(s => s.id === 'P3-Design');
    expect(stageDef).toBeDefined();
    expect(ctx.stageGuidance).toBe(stageDef!.description);
  });

  it('citations include the current stage definition reference', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);
    expect(ctx.citations.length).toBeGreaterThan(0);
    expect(ctx.citations[0].ref.section).toContain('P3-Design');
  });

  it('instanceSnapshot.canAdvance is a boolean when pattern is wired', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);
    expect(typeof ctx.instanceSnapshot['canAdvance']).toBe('boolean');
  });

  it('detectors run deterministically — same inputs produce same outputs', () => {
    const a = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);
    const b = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);

    // Strip wall-clock timestamps (evaluatedAt, detectedAt, builtAt) before
    // comparing — the underlying detection logic is pure but the contexts
    // stamp Date.now at the boundary so callers can age-out stale results.
    const stripTimestamps = (obj: unknown): unknown =>
      JSON.parse(
        JSON.stringify(obj, (key, value) =>
          key === 'evaluatedAt' || key === 'detectedAt' || key === 'builtAt' ? 0 : value,
        ),
      );

    expect(stripTimestamps(a.gatesSummary)).toEqual(stripTimestamps(b.gatesSummary));
    expect(stripTimestamps(a.activeContradictions)).toEqual(stripTimestamps(b.activeContradictions));
    expect(stripTimestamps(a.failureModes)).toEqual(stripTimestamps(b.failureModes));
    expect(stripTimestamps(a.missingArtifacts)).toEqual(stripTimestamps(b.missingArtifacts));
  });

  it('activeContradictions and failureModes are arrays (may be empty depending on evidence overlap)', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, PAT_PRG_CDP_001);
    expect(Array.isArray(ctx.activeContradictions)).toBe(true);
    expect(Array.isArray(ctx.failureModes)).toBe(true);
  });
});

// ─── 10. Back-compat: unknown patternId falls back to shape-only ─────────────

describe('buildProgramSynthesisContext — back-compat for unknown patternId', () => {
  it('returns a valid SynthesisContext with empty detector arrays when pattern is not resolvable', () => {
    const unknownInstance: ProgramInstance = {
      ...APX_CDP_2026_INSTANCE,
      patternId: 'PAT-PRG-NOT-A-REAL-PATTERN' as unknown as ProgramPatternId,
    };
    const ctx = buildProgramSynthesisContext(unknownInstance);
    expect(ctx.instanceType).toBe('program');
    expect(ctx.activeContradictions).toEqual([]);
    expect(ctx.failureModes).toEqual([]);
    // Shape-only fallback uses the legacy single-gate summary
    expect(ctx.gatesSummary.total).toBe(1);
  });

  it('falls back to deliverable-derived missingArtifacts for unknown pattern ids', () => {
    const unknownInstance: ProgramInstance = {
      ...APX_CDP_2026_INSTANCE,
      patternId: 'PAT-PRG-NOT-A-REAL-PATTERN' as unknown as ProgramPatternId,
    };
    const ctx = buildProgramSynthesisContext(unknownInstance);
    // Builder excludes 'complete' and 'in-progress'; includes 'not-started' and 'blocked'.
    const expectedCount = APX_CDP_2026_INSTANCE.deliverables.filter(
      d =>
        d.status !== 'complete' &&
        d.status !== 'in-progress' &&
        d.phaseId === APX_CDP_2026_INSTANCE.currentPhase,
    ).length;
    expect(ctx.missingArtifacts.length).toBe(expectedCount);
  });
});

// ─── 11. Cross-instance smoke — every Apex Retail program produces a context ──

describe('buildProgramSynthesisContext — cross-instance smoke', () => {
  it.each([
    APX_CDP_2026_INSTANCE,
    APX_LPM_2026_INSTANCE,
    APX_SAP_2026_INSTANCE,
    APX_DFV2_INSTANCE,
  ])('produces a SynthesisContext for $id', (instance) => {
    const ctx = buildProgramSynthesisContext(instance);
    expect(ctx.instanceId).toBe(instance.id);
    expect(ctx.instanceType).toBe('program');
    expect(ctx.patternId).toBe(instance.patternId);
    // Every Apex pattern id should resolve from PROGRAM_LIFECYCLE_PATTERNS
    expect(PROGRAM_LIFECYCLE_PATTERNS.some(p => p.patternId === instance.patternId)).toBe(true);
  });
});

/**
 * Program synthesis context builder tests — REASON-15
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Same inputs always produce the same outputs.
 *
 * Uses APX_CDP_2026_INSTANCE as the canonical fixture because it has the
 * richest state: P3 Design, pending gate, open blocker, linked source event.
 */

import { APX_CDP_2026_INSTANCE } from '@/lib/programs/program-instances';
import {
  buildProgramSynthesisContext,
  programInstanceStateHash,
} from '@/lib/reasoning/program-synthesis-context-builder';

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

  it('patternVersion matches the instance patternVersion', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    expect(ctx.patternVersion).toBe(APX_CDP_2026_INSTANCE.patternVersion);
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
  it('gatesSummary.unmet === 1 when gate is pending', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    // P3 gate status is 'pending' → not approved → unmet
    expect(ctx.gatesSummary.unmet).toBe(1);
    expect(ctx.gatesSummary.met).toBe(0);
  });

  it('gatesSummary.blocked has one entry per open blocker flag', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    const openBlockerCount = APX_CDP_2026_INSTANCE.flags.filter(
      f => f.kind === 'blocker' && f.status === 'open',
    ).length;
    expect(ctx.gatesSummary.blocked.length).toBe(openBlockerCount);
  });
});

// ─── 7. missingArtifacts from not-started deliverables ───────────────────────

describe('buildProgramSynthesisContext — missingArtifacts', () => {
  it('missingArtifacts includes not-started and blocked deliverables in current phase', () => {
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE);
    // Builder excludes 'complete' and 'in-progress'; includes 'not-started' and 'blocked'
    const expectedCount = APX_CDP_2026_INSTANCE.deliverables.filter(
      d =>
        d.status !== 'complete' &&
        d.status !== 'in-progress' &&
        d.phaseId === APX_CDP_2026_INSTANCE.currentPhase,
    ).length;
    expect(ctx.missingArtifacts.length).toBe(expectedCount);
  });

  it('missingArtifacts does not include complete deliverables', () => {
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

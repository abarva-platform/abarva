/**
 * Tower synthesis context builder tests — REASON-17
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Same inputs always produce the same outputs.
 *
 * Atlas reasons across the whole portfolio: every active program plus every
 * active source event. Tests verify aggregate gate counts, cascade context,
 * portfolio snapshot shape, and hash stability.
 */

import { APEX_RETAIL_PROGRAM_INSTANCES, APX_CDP_2026_INSTANCE } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import {
  buildTowerSynthesisContext,
  towerStateHash,
} from '@/lib/reasoning/tower-synthesis-context-builder';

// ─── 1. instanceType === 'tower' ──────────────────────────────────────────────

describe('buildTowerSynthesisContext — instanceType', () => {
  it('returns instanceType: "tower"', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.instanceType).toBe('tower');
  });

  it('returns a fixed instanceId of "tower"', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.instanceId).toBe('tower');
  });
});

// ─── 2. gatesSummary aggregates across portfolio ──────────────────────────────

describe('buildTowerSynthesisContext — gatesSummary', () => {
  it('total gates equals program count + source-event count', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.gatesSummary.total).toBe(
      APEX_RETAIL_PROGRAM_INSTANCES.length + SOURCE_EVENT_INSTANCES.length,
    );
  });

  it('met + unmet equals total', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.gatesSummary.met + ctx.gatesSummary.unmet).toBe(ctx.gatesSummary.total);
  });

  it('aggregates open blockers across all instances into gatesSummary.blocked', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const expectedBlockerCount =
      APEX_RETAIL_PROGRAM_INSTANCES.reduce(
        (n, p) => n + p.flags.filter(f => f.kind === 'blocker' && f.status === 'open').length,
        0,
      ) +
      SOURCE_EVENT_INSTANCES.reduce(
        (n, s) => n + s.flags.filter(f => f.kind === 'blocker' && f.status === 'open').length,
        0,
      );
    expect(ctx.gatesSummary.blocked.length).toBe(expectedBlockerCount);
  });
});

// ─── 3. cascadeContext aggregates cross-instance links ────────────────────────

describe('buildTowerSynthesisContext — cascadeContext', () => {
  it('cascadeContext is non-empty for the Apex Retail portfolio', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.cascadeContext.length).toBeGreaterThan(0);
  });

  it('contains a SRC-AMS-2026 → APX-CDP-2026 dependency link', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const link = ctx.cascadeContext.find(
      c => c.sourceInstanceId === 'SRC-AMS-2026' && c.targetInstanceId === 'APX-CDP-2026',
    );
    expect(link).toBeDefined();
  });

  it('depends-on links from programs map to blocking severity', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const dependsOn = ctx.cascadeContext.find(
      c => c.targetInstanceId === 'APX-CDP-2026' && c.linkType === 'depends-on',
    );
    expect(dependsOn?.severity).toBe('blocking');
  });
});

// ─── 4. instanceSnapshot shape ────────────────────────────────────────────────

describe('buildTowerSynthesisContext — instanceSnapshot', () => {
  it('instanceSnapshot.programCount matches input length', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.instanceSnapshot['programCount']).toBe(APEX_RETAIL_PROGRAM_INSTANCES.length);
  });

  it('instanceSnapshot.sourceEventCount matches input length', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.instanceSnapshot['sourceEventCount']).toBe(SOURCE_EVENT_INSTANCES.length);
  });

  it('instanceSnapshot.programs entries reference programs by ID', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const programs = ctx.instanceSnapshot['programs'] as Array<{ id: string }>;
    const ids = programs.map(p => p.id);
    expect(ids).toContain('APX-CDP-2026');
  });

  it('instanceSnapshot.sourceEvents entries reference every source-event instance by ID', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const sources = ctx.instanceSnapshot['sourceEvents'] as Array<{ id: string }>;
    const ids = sources.map(s => s.id);
    for (const s of SOURCE_EVENT_INSTANCES) {
      expect(ids).toContain(s.id);
    }
  });
});

// ─── 5. citations include patterns from both program + source instances ──────

describe('buildTowerSynthesisContext — citations', () => {
  it('citations is non-empty', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.citations.length).toBeGreaterThan(0);
  });

  it('includes at least one program-pattern citation', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const programPattern = ctx.citations.find(c => c.ref.patternId.startsWith('PAT-PRG-'));
    expect(programPattern).toBeDefined();
  });
});

// ─── 6. towerStateHash — determinism ─────────────────────────────────────────

describe('towerStateHash', () => {
  it('returns the same hash for the same portfolio state', () => {
    const h1 = towerStateHash(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const h2 = towerStateHash(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(h1).toBe(h2);
  });

  it('returns a non-empty string', () => {
    const h = towerStateHash(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });

  it('hash changes when an instance phase changes', () => {
    const original = towerStateHash(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const mutated = APEX_RETAIL_PROGRAM_INSTANCES.map(p =>
      p.id === APX_CDP_2026_INSTANCE.id ? { ...p, currentPhase: p.currentPhase + 1 } : p,
    );
    const modified = towerStateHash(mutated, SOURCE_EVENT_INSTANCES);
    expect(original).not.toBe(modified);
  });

  it('hash changes when a source event blocker count changes', () => {
    const original = towerStateHash(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    const mutatedSources = SOURCE_EVENT_INSTANCES.map(s => ({
      ...s,
      flags: [
        ...s.flags,
        {
          id: 'synthetic-blocker-test',
          kind: 'blocker' as const,
          description: 'test blocker',
          raisedBy: 'test',
          raisedAt: '2026-04-28',
          status: 'open' as const,
        },
      ],
    }));
    const modified = towerStateHash(APEX_RETAIL_PROGRAM_INSTANCES, mutatedSources);
    expect(original).not.toBe(modified);
  });

  it('hash is invariant under empty-portfolio inputs', () => {
    const h1 = towerStateHash([], []);
    const h2 = towerStateHash([], []);
    expect(h1).toBe(h2);
  });
});

// ─── 7. patternId for the portfolio context ──────────────────────────────────

describe('buildTowerSynthesisContext — pattern identity', () => {
  it('uses a portfolio-level pattern id', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.patternId).toBe('PAT-TOWER-PORTFOLIO');
  });

  it('currentStage is "portfolio" (not a per-instance stage label)', () => {
    const ctx = buildTowerSynthesisContext(APEX_RETAIL_PROGRAM_INSTANCES, SOURCE_EVENT_INSTANCES);
    expect(ctx.currentStage).toBe('portfolio');
  });
});

// ─── 8. handles empty portfolio gracefully ────────────────────────────────────

describe('buildTowerSynthesisContext — empty portfolio', () => {
  it('returns zero counts when both arrays are empty', () => {
    const ctx = buildTowerSynthesisContext([], []);
    expect(ctx.gatesSummary.total).toBe(0);
    expect(ctx.gatesSummary.met).toBe(0);
    expect(ctx.gatesSummary.unmet).toBe(0);
    expect(ctx.gatesSummary.blocked.length).toBe(0);
    expect(ctx.cascadeContext.length).toBe(0);
    expect(ctx.citations.length).toBe(0);
  });
});

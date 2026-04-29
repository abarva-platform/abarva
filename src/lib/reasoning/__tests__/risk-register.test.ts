/**
 * Risk register tests — joins contradictions + failure modes into a unified
 * RiskItem[] view at instance and portfolio level.
 *
 * Deterministic: no network, no LLM calls, no randomness.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import {
  buildRiskRegisterForInstance,
  buildPortfolioRiskRegister,
  type RiskItem,
} from '@/lib/reasoning/risk-register';
import type {
  ContradictionDetection,
  FailureModeDetection,
  SynthesisContext,
} from '@/lib/reasoning/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeContradiction(
  templateId: string,
  severity: ContradictionDetection['severity'],
  confidence: number,
  label = `Contradiction ${templateId}`,
): ContradictionDetection {
  return {
    templateId,
    label,
    severity,
    confidence,
    partyA: 'A',
    partyB: 'B',
    triggeringEvidence: [],
    resolutionPath: `Resolve ${templateId}`,
    patternRef: { patternId: 'P', patternVersion: '1.0', section: '§ test' },
    detectedAt: 1,
  };
}

function makeFailureMode(
  failureModeId: string,
  confidence: number,
  mitigations: string[] = [`Mitigate ${failureModeId}`],
): FailureModeDetection {
  return {
    id: failureModeId,
    failureModeId,
    label: `Failure ${failureModeId}`,
    description: `desc ${failureModeId}`,
    stages: [],
    mitigations,
    confidence,
    matchedKeywords: [],
    detectedFromKeys: [],
  };
}

function makeContext(
  contradictions: ContradictionDetection[],
  failureModes: FailureModeDetection[],
  instanceId = 'INST-1',
): SynthesisContext {
  return {
    instanceId,
    instanceType: 'source-event',
    patternId: 'P',
    patternVersion: '1.0',
    currentStage: 'BAFO',
    gatesSummary: { total: 0, met: 0, unmet: 0, blocked: [] },
    activeContradictions: contradictions,
    failureModes,
    missingArtifacts: [],
    cascadeContext: [],
    citations: [],
    instanceSnapshot: {},
    stageGuidance: '',
    builtAt: 0,
  };
}

// ─── 1. Empty context → empty register ──────────────────────────────────────

describe('buildRiskRegisterForInstance — empty context', () => {
  it('returns an empty array when no contradictions or failure modes', () => {
    const ctx = makeContext([], []);
    expect(buildRiskRegisterForInstance(ctx, 'Label')).toEqual([]);
  });
});

// ─── 2. Joining contradictions + failure modes ──────────────────────────────

describe('buildRiskRegisterForInstance — joins both detector outputs', () => {
  it('emits one row per contradiction and one row per failure mode', () => {
    const ctx = makeContext(
      [makeContradiction('C1', 'medium', 0.6), makeContradiction('C2', 'low', 0.4)],
      [makeFailureMode('F1', 0.8), makeFailureMode('F2', 0.5)],
    );
    const rows = buildRiskRegisterForInstance(ctx, 'AMS');
    expect(rows).toHaveLength(4);

    const kinds = rows.map((r) => r.kind).sort();
    expect(kinds).toEqual(['contradiction', 'contradiction', 'failure-mode', 'failure-mode']);
  });

  it('contradiction.mitigation copies the resolutionPath', () => {
    const ctx = makeContext([makeContradiction('C1', 'high', 0.8)], []);
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows[0]?.mitigation).toBe('Resolve C1');
    expect(rows[0]?.kind).toBe('contradiction');
  });

  it('failure-mode.mitigation copies the first mitigation entry', () => {
    const ctx = makeContext([], [makeFailureMode('F1', 0.7, ['Tighten scope', 'Add review'])]);
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows[0]?.mitigation).toBe('Tighten scope');
    expect(rows[0]?.kind).toBe('failure-mode');
  });

  it('failure-mode with no mitigations yields empty mitigation string', () => {
    const ctx = makeContext([], [makeFailureMode('F1', 0.7, [])]);
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows[0]?.mitigation).toBe('');
  });
});

// ─── 3. Sorting: high → medium → low, then confidence desc ──────────────────

describe('buildRiskRegisterForInstance — sort order', () => {
  it('orders severity high → medium → low', () => {
    const ctx = makeContext(
      [
        makeContradiction('C-low', 'low', 0.9),
        makeContradiction('C-high', 'high', 0.3),
        makeContradiction('C-med', 'medium', 0.5),
      ],
      [],
    );
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows.map((r) => r.severity)).toEqual(['high', 'medium', 'low']);
  });

  it('within the same severity, orders by confidence desc', () => {
    const ctx = makeContext(
      [
        makeContradiction('C-a', 'high', 0.4),
        makeContradiction('C-b', 'high', 0.9),
        makeContradiction('C-c', 'high', 0.6),
      ],
      [],
    );
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows.map((r) => r.id)).toEqual(['C-b', 'C-c', 'C-a']);
  });

  it('failure-mode confidence ≥0.7 maps to severity high', () => {
    const ctx = makeContext([], [makeFailureMode('F-hi', 0.85)]);
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows[0]?.severity).toBe('high');
  });

  it('failure-mode confidence ≥0.5 and <0.7 maps to severity medium', () => {
    const ctx = makeContext([], [makeFailureMode('F-med', 0.6)]);
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows[0]?.severity).toBe('medium');
  });

  it('failure-mode confidence <0.5 maps to severity low', () => {
    const ctx = makeContext([], [makeFailureMode('F-lo', 0.3)]);
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows[0]?.severity).toBe('low');
  });
});

// ─── 4. Dedupe within an instance ───────────────────────────────────────────

describe('buildRiskRegisterForInstance — dedupe', () => {
  it('dedupes contradictions by templateId within the same instance', () => {
    const ctx = makeContext(
      [makeContradiction('DUP', 'high', 0.8), makeContradiction('DUP', 'medium', 0.5)],
      [],
    );
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.severity).toBe('high');
  });

  it('keeps a contradiction and a failure-mode that share an id (different kinds)', () => {
    const ctx = makeContext(
      [makeContradiction('SAME', 'high', 0.8)],
      [makeFailureMode('SAME', 0.8)],
    );
    const rows = buildRiskRegisterForInstance(ctx, 'X');
    expect(rows).toHaveLength(2);
    const kinds = rows.map((r) => r.kind).sort();
    expect(kinds).toEqual(['contradiction', 'failure-mode']);
  });
});

// ─── 5. Instance label propagation ──────────────────────────────────────────

describe('buildRiskRegisterForInstance — instance label', () => {
  it('every row carries the supplied instanceLabel and context.instanceId', () => {
    const ctx = makeContext(
      [makeContradiction('C1', 'high', 0.7)],
      [makeFailureMode('F1', 0.7)],
      'AMS-INST',
    );
    const rows = buildRiskRegisterForInstance(ctx, 'AMS Vendor 2026');
    for (const r of rows) {
      expect(r.instanceId).toBe('AMS-INST');
      expect(r.instanceLabel).toBe('AMS Vendor 2026');
    }
  });
});

// ─── 6. Real fixture: AMS source event ──────────────────────────────────────

describe('buildRiskRegisterForInstance — AMS fixture', () => {
  it('produces at least one row from the AMS instance', () => {
    const ctx = buildSourceSynthesisContext(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      PAT_SRC_AMS_001,
    );
    const rows = buildRiskRegisterForInstance(
      ctx,
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.displayId,
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it('every row carries a non-empty label', () => {
    const ctx = buildSourceSynthesisContext(
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      PAT_SRC_AMS_001,
    );
    const rows = buildRiskRegisterForInstance(
      ctx,
      AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.displayId,
    );
    for (const r of rows) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

// ─── 7. Real fixture: APX-CDP-2026 program ──────────────────────────────────

describe('buildRiskRegisterForInstance — APX-CDP-2026 fixture', () => {
  it('produces at least one row from the CDP program', () => {
    const cdp = APEX_RETAIL_PROGRAM_INSTANCES.find((p) => p.id === 'APX-CDP-2026');
    expect(cdp).toBeDefined();
    if (!cdp) return;
    const ctx = buildProgramSynthesisContext(cdp);
    const rows = buildRiskRegisterForInstance(ctx, cdp.displayId);
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ─── 8. Portfolio register ──────────────────────────────────────────────────

describe('buildPortfolioRiskRegister', () => {
  it('returns at least 5 rows aggregated across instances', () => {
    const rows = buildPortfolioRiskRegister();
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('is sorted by severity high → medium → low globally', () => {
    const rows = buildPortfolioRiskRegister();
    const rank: Record<RiskItem['severity'], number> = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < rows.length; i += 1) {
      const prev = rows[i - 1];
      const cur = rows[i];
      if (!prev || !cur) continue;
      expect(rank[prev.severity]).toBeLessThanOrEqual(rank[cur.severity]);
    }
  });

  it('every row carries an instanceLabel and instanceId', () => {
    const rows = buildPortfolioRiskRegister();
    for (const r of rows) {
      expect(r.instanceId.length).toBeGreaterThan(0);
      expect(r.instanceLabel.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic — two calls return identical row sequences', () => {
    const a = buildPortfolioRiskRegister();
    const b = buildPortfolioRiskRegister();
    expect(a).toEqual(b);
  });
});

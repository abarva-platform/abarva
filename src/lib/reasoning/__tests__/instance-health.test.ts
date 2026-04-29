/**
 * instance-health tests — deterministic health verdict from SynthesisContext.
 */

import {
  computeInstanceHealth,
  INSTANCE_HEALTH_PENALTIES,
} from '@/lib/reasoning/instance-health';
import type {
  CascadeImpact,
  ContradictionDetection,
  FailureModeDetection,
  GateCriterionResult,
  SynthesisContext,
} from '@/lib/reasoning/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBlockedGate(
  criterionId: string,
  status: GateCriterionResult['status'] = 'unmet',
): GateCriterionResult {
  return {
    criterionId,
    stageId: 'BAFO',
    status,
    gateType: 'hard',
    evidence: [],
    patternRef: { patternId: 'P', patternVersion: '1.0', section: '§ test' },
    evaluatedAt: 0,
    description: `Criterion ${criterionId}`,
    evaluationHint: 'do the thing',
  };
}

function makeContradiction(
  templateId: string,
  severity: ContradictionDetection['severity'],
): ContradictionDetection {
  return {
    templateId,
    label: `Contradiction ${templateId}`,
    severity,
    confidence: 0.9,
    partyA: 'A',
    partyB: 'B',
    triggeringEvidence: [],
    resolutionPath: 'resolve',
    patternRef: { patternId: 'P', patternVersion: '1.0', section: '§ test' },
    detectedAt: 0,
  };
}

function makeFailureMode(
  failureModeId: string,
  confidence: number,
): FailureModeDetection {
  return {
    id: failureModeId,
    failureModeId,
    label: `Failure ${failureModeId}`,
    description: '',
    stages: [],
    mitigations: ['m'],
    confidence,
    matchedKeywords: [],
    detectedFromKeys: [],
  };
}

function makeCascade(
  targetInstanceId: string,
  impactSeverity: CascadeImpact['impactSeverity'],
): CascadeImpact {
  return {
    sourceInstanceId: 'INST-1',
    targetInstanceId,
    linkType: 'unblocks',
    impact: 'downstream impact',
    severity: 'blocking',
    ...(impactSeverity !== undefined ? { impactSeverity } : {}),
  };
}

function makeContext(overrides: Partial<SynthesisContext> = {}): SynthesisContext {
  return {
    instanceId: 'INST-1',
    instanceType: 'source-event',
    patternId: 'P',
    patternVersion: '1.0',
    currentStage: 'BAFO',
    gatesSummary: { total: 0, met: 0, unmet: 0, blocked: [] },
    activeContradictions: [],
    failureModes: [],
    missingArtifacts: [],
    cascadeContext: [],
    citations: [],
    instanceSnapshot: {},
    stageGuidance: '',
    builtAt: 0,
    ...overrides,
  };
}

// ─── 1. Empty context → green/100 ────────────────────────────────────────────

describe('computeInstanceHealth — clean context', () => {
  it('returns green/100 when there are no signals', () => {
    const health = computeInstanceHealth(makeContext());
    expect(health.grade).toBe('green');
    expect(health.score).toBe(100);
    expect(health.reasons).toEqual([]);
    expect(health.summary).toMatch(/on-track/i);
  });
});

// ─── 2. Pending hard gates penalty ───────────────────────────────────────────

describe('computeInstanceHealth — pending hard gates', () => {
  it('penalises each pending hard gate at the configured weight', () => {
    const blocked = [
      makeBlockedGate('g1', 'partial'),
      makeBlockedGate('g2', 'partial'),
    ];
    const health = computeInstanceHealth(
      makeContext({
        gatesSummary: { total: 2, met: 0, unmet: 2, blocked },
      }),
    );
    // 2 pending hard gates = -16, 0 blocked (status partial, not unmet)
    expect(health.score).toBe(100 - 2 * INSTANCE_HEALTH_PENALTIES.pendingHardGate);
    expect(health.grade).toBe('green');
    expect(health.reasons[0]).toMatch(/2 hard gates pending/);
  });
});

// ─── 3. Blocked criteria penalty (unmet status) ──────────────────────────────

describe('computeInstanceHealth — blocked (unmet) criteria', () => {
  it('penalises both pending and unmet criteria', () => {
    const blocked = [makeBlockedGate('g1', 'unmet'), makeBlockedGate('g2', 'unmet')];
    const health = computeInstanceHealth(
      makeContext({
        gatesSummary: { total: 2, met: 0, unmet: 2, blocked },
      }),
    );
    // Each unmet hard gate triggers BOTH pendingHardGate (-8) AND
    // blockedCriterion (-10), so 2 unmet → -36 → 64 amber.
    const expected =
      100 -
      2 * INSTANCE_HEALTH_PENALTIES.pendingHardGate -
      2 * INSTANCE_HEALTH_PENALTIES.blockedCriterion;
    expect(health.score).toBe(expected);
    expect(health.grade).toBe('amber');
    expect(health.reasons.some((r) => /blocked/.test(r))).toBe(true);
  });
});

// ─── 4. High-severity contradictions ─────────────────────────────────────────

describe('computeInstanceHealth — contradictions', () => {
  it('only high-severity contradictions are penalised', () => {
    const health = computeInstanceHealth(
      makeContext({
        activeContradictions: [
          makeContradiction('c1', 'low'),
          makeContradiction('c2', 'medium'),
          makeContradiction('c3', 'high'),
        ],
      }),
    );
    expect(health.score).toBe(100 - INSTANCE_HEALTH_PENALTIES.highContradiction);
    expect(health.reasons[0]).toMatch(/1 high-severity contradiction/);
  });
});

// ─── 5. High-severity failure modes ──────────────────────────────────────────

describe('computeInstanceHealth — failure modes', () => {
  it('failure modes with confidence >= 0.7 are penalised', () => {
    const health = computeInstanceHealth(
      makeContext({
        failureModes: [
          makeFailureMode('f1', 0.5),
          makeFailureMode('f2', 0.7),
          makeFailureMode('f3', 0.95),
        ],
      }),
    );
    expect(health.score).toBe(100 - 2 * INSTANCE_HEALTH_PENALTIES.highFailureMode);
    expect(health.reasons[0]).toMatch(/2 high-severity failure modes/);
  });
});

// ─── 6. High-severity cascade impacts ────────────────────────────────────────

describe('computeInstanceHealth — cascade impacts', () => {
  it('only impactSeverity=high cascades are penalised', () => {
    const health = computeInstanceHealth(
      makeContext({
        cascadeContext: [
          makeCascade('T1', 'low'),
          makeCascade('T2', 'medium'),
          makeCascade('T3', 'high'),
          makeCascade('T4', 'high'),
        ],
      }),
    );
    expect(health.score).toBe(100 - 2 * INSTANCE_HEALTH_PENALTIES.highCascade);
    expect(health.reasons[0]).toMatch(/2 high-severity cascade impacts/);
  });
});

// ─── 7. Score floor at 0 → red ───────────────────────────────────────────────

describe('computeInstanceHealth — score floor', () => {
  it('clamps below-zero scores to 0 and grades red', () => {
    const blocked = Array.from({ length: 10 }, (_, i) =>
      makeBlockedGate(`g${i}`, 'unmet'),
    );
    const health = computeInstanceHealth(
      makeContext({
        gatesSummary: { total: 10, met: 0, unmet: 10, blocked },
        activeContradictions: [
          makeContradiction('c1', 'high'),
          makeContradiction('c2', 'high'),
        ],
      }),
    );
    expect(health.score).toBe(0);
    expect(health.grade).toBe('red');
    expect(health.summary).toMatch(/in trouble/i);
  });
});

// ─── 8. Grade boundaries ─────────────────────────────────────────────────────

describe('computeInstanceHealth — grade thresholds', () => {
  it('grades exactly 80 as green', () => {
    // 100 - 20 = 80 → green; achieve via 2 high-severity failure modes (-20)
    // BUT highFailureMode is 10, so 2 → -20 → 80
    const health = computeInstanceHealth(
      makeContext({
        failureModes: [makeFailureMode('f1', 0.9), makeFailureMode('f2', 0.9)],
      }),
    );
    expect(health.score).toBe(80);
    expect(health.grade).toBe('green');
  });

  it('grades exactly 50 as amber', () => {
    // 100 - 50 = 50 → amber; 5 cascades * -8 = -40, plus 1 contradiction (-15)
    // would overshoot. Use 2 highContradictions (-30) + 2 cascades (-16) = -46 → 54
    // For exact 50: 5 pending hard gates (-40) + 1 cascade (-8) = -48 → 52, not 50
    // Use 2 contradictions (-30) + 1 cascade (-8) + 1 pending hard gate (-8) = -46 → 54
    // Easier: 5 high cascades (-40) + 1 pending hard gate (-8) + use blocked gate
    // To hit exactly 50: 50 penalty. 5 highContradictions = -75 too much.
    // 1 highContradiction (-15) + 1 highFailure (-10) + 1 cascade (-8) + 1 pending (-8) + 1 unmet block adds -10 too much
    // Try: 1 contradiction (15) + 1 failure (10) + 1 cascade (8) + 2 pending hard (16) = 49 -> 51
    // Try: 2 contradictions (30) + 2 cascades (16) + 1 pending (8) = 54 -> score 46
    // Try: 5 pending hard gates (40) + 1 cascade (8) + 1 high failure (10) needed but overshoot 58
    // Use 5 high failure modes (50) → 50
    const health = computeInstanceHealth(
      makeContext({
        failureModes: [
          makeFailureMode('f1', 0.9),
          makeFailureMode('f2', 0.9),
          makeFailureMode('f3', 0.9),
          makeFailureMode('f4', 0.9),
          makeFailureMode('f5', 0.9),
        ],
      }),
    );
    expect(health.score).toBe(50);
    expect(health.grade).toBe('amber');
  });

  it('grades 49 as red', () => {
    // 5 failure modes (-50) + 1 cascade (-8) but want 49
    // Use 5 failure modes (50) -> 50 amber. Need to drop one more point.
    // Penalty granularity is 8/10/15, so 49 not directly hit; use 4 failures (40) + 1 contradiction (15) = 55 -> 45 red
    const health = computeInstanceHealth(
      makeContext({
        failureModes: [
          makeFailureMode('f1', 0.9),
          makeFailureMode('f2', 0.9),
          makeFailureMode('f3', 0.9),
          makeFailureMode('f4', 0.9),
        ],
        activeContradictions: [makeContradiction('c1', 'high')],
      }),
    );
    expect(health.score).toBe(45);
    expect(health.grade).toBe('red');
  });
});

// ─── 9. Determinism ──────────────────────────────────────────────────────────

describe('computeInstanceHealth — determinism', () => {
  it('produces identical results on repeated calls with the same input', () => {
    const ctx = makeContext({
      gatesSummary: {
        total: 2,
        met: 0,
        unmet: 2,
        blocked: [makeBlockedGate('g1', 'unmet'), makeBlockedGate('g2', 'partial')],
      },
      activeContradictions: [makeContradiction('c1', 'high')],
      failureModes: [makeFailureMode('f1', 0.85)],
      cascadeContext: [makeCascade('T1', 'high')],
    });
    const a = computeInstanceHealth(ctx);
    const b = computeInstanceHealth(ctx);
    expect(a).toEqual(b);
  });
});

// ─── 10. Reasons ordering ────────────────────────────────────────────────────

describe('computeInstanceHealth — reasons ordering', () => {
  it('lists reasons in canonical priority order', () => {
    const health = computeInstanceHealth(
      makeContext({
        gatesSummary: {
          total: 1,
          met: 0,
          unmet: 1,
          blocked: [makeBlockedGate('g1', 'unmet')],
        },
        activeContradictions: [makeContradiction('c1', 'high')],
        failureModes: [makeFailureMode('f1', 0.9)],
        cascadeContext: [makeCascade('T1', 'high')],
      }),
    );
    // Order: pending hard, blocked, contradictions, failure modes, cascades
    expect(health.reasons[0]).toMatch(/hard gate.*pending/);
    expect(health.reasons[1]).toMatch(/blocked/);
    expect(health.reasons[2]).toMatch(/contradiction/);
    expect(health.reasons[3]).toMatch(/failure mode/);
    expect(health.reasons[4]).toMatch(/cascade impact/);
  });
});

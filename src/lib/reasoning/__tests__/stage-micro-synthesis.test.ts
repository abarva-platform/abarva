/**
 * Stage micro-synthesis tests — REASON-30 follow-up
 *
 * Pure deterministic helper: identical inputs always yield identical strings.
 * No network, no LLM, no randomness, no Date.now-dependent text.
 *
 * The tests construct `StageEvaluationResult` shapes directly so each branch
 * is exercised in isolation, then sanity-check the integration helper against
 * the live `evaluateAllStages` output for PAT_SRC_AMS_001.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import {
  buildStageMicroSynthesis,
  buildStageMicroSynthesisMap,
} from '@/lib/reasoning/stage-micro-synthesis';
import type {
  GateEvaluation,
  StageEvaluationResult,
} from '@/lib/reasoning/types';

const PATTERN_REF = {
  patternId: PAT_SRC_AMS_001.id,
  patternVersion: PAT_SRC_AMS_001.version,
  section: '§test',
};

function makeGate(
  overrides: Partial<GateEvaluation> & {
    criterionId: string;
    stageId: string;
  },
): GateEvaluation {
  return {
    status: 'unmet',
    gateType: 'hard',
    evidence: [],
    patternRef: PATTERN_REF,
    evaluatedAt: 0,
    ...overrides,
  };
}

function makeStageEval(
  overrides: Partial<StageEvaluationResult> & {
    stageId: string;
    stageLabel: string;
    status: StageEvaluationResult['status'];
  },
): StageEvaluationResult {
  const gateEvaluations = overrides.gateEvaluations ?? [];
  const total = overrides.gatesTotal ?? gateEvaluations.length;
  const met =
    overrides.gatesMet ??
    gateEvaluations.filter(
      (g) => g.status === 'met' || g.status === 'waived',
    ).length;
  return {
    order: 0,
    gateEvaluations,
    gatesMet: met,
    gatesTotal: total,
    missingArtifacts: [],
    ...overrides,
  };
}

// ─── 1. No criteria defined ────────────────────────────────────────────────────

describe('buildStageMicroSynthesis — empty stage', () => {
  it('reports "no gate criteria defined" when total is 0', () => {
    const ev = makeStageEval({
      stageId: 'EmptyStage',
      stageLabel: 'Empty Stage',
      status: 'upcoming',
      gateEvaluations: [],
      gatesTotal: 0,
    });
    expect(buildStageMicroSynthesis('EmptyStage', ev, PAT_SRC_AMS_001)).toBe(
      'Empty Stage: no gate criteria defined.',
    );
  });
});

// ─── 2. Passed stages ──────────────────────────────────────────────────────────

describe('buildStageMicroSynthesis — passed stage', () => {
  it('reports all criteria satisfied when status is passed', () => {
    const ev = makeStageEval({
      stageId: 'Shortlist',
      stageLabel: 'Shortlist',
      status: 'passed',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-RFI-01', stageId: 'Shortlist', status: 'met' }),
        makeGate({ criterionId: 'GATE-AMS-RFI-02', stageId: 'Shortlist', status: 'met' }),
        makeGate({ criterionId: 'GATE-AMS-RFI-03', stageId: 'Shortlist', status: 'met' }),
      ],
    });
    const out = buildStageMicroSynthesis('Shortlist', ev, PAT_SRC_AMS_001);
    expect(out).toBe('Shortlist: all 3 gate criteria satisfied. Stage clear.');
  });
});

// ─── 3. Current stage — hard gates met ────────────────────────────────────────

describe('buildStageMicroSynthesis — current stage', () => {
  it('says "Ready to advance" when no soft criteria are pending', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'current',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'met' }),
        makeGate({ criterionId: 'GATE-AMS-BAFO-02', stageId: 'Selection', status: 'met' }),
      ],
    });
    expect(buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001)).toBe(
      'BAFO: all hard gates met. Ready to advance.',
    );
  });

  it('mentions remaining soft criteria when hard gates are met but soft pending', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'current',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'met' }),
        makeGate({
          criterionId: 'GATE-AMS-BAFO-04',
          stageId: 'Selection',
          gateType: 'soft',
          status: 'unmet',
        }),
      ],
    });
    const out = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(out).toBe('BAFO: hard gates met; 1 soft criterion still pending.');
  });
});

// ─── 4. Blocked stages ─────────────────────────────────────────────────────────

describe('buildStageMicroSynthesis — blocked stage', () => {
  it('names the top blocked criterion and the soft pending count', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'blocked',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'unmet' }),
        makeGate({ criterionId: 'GATE-AMS-BAFO-02', stageId: 'Selection', status: 'partial' }),
        makeGate({
          criterionId: 'GATE-AMS-BAFO-04',
          stageId: 'Selection',
          gateType: 'soft',
          status: 'unmet',
        }),
      ],
    });
    const out = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(out).toMatch(/^2 hard gates blocked, 1 pending\. Address /);
    expect(out).toContain('Minimum 2 vendor BAFO responses received');
    expect(out.endsWith(' to advance.')).toBe(true);
  });

  it('uses singular "hard gate" and omits "pending" when no soft criteria exist', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'blocked',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'unmet' }),
        makeGate({ criterionId: 'GATE-AMS-BAFO-02', stageId: 'Selection', status: 'met' }),
      ],
    });
    const out = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(out.startsWith('1 hard gate blocked.')).toBe(true);
    expect(out).not.toMatch(/pending/);
    expect(out).toContain('Minimum 2 vendor BAFO responses received');
  });
});

// ─── 5. Upcoming stages — all pending ─────────────────────────────────────────

describe('buildStageMicroSynthesis — upcoming all-pending', () => {
  it('starts with the first HARD criterion when both hard and soft exist', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'upcoming',
      gateEvaluations: [
        makeGate({
          criterionId: 'GATE-AMS-BAFO-04',
          stageId: 'Selection',
          gateType: 'soft',
          status: 'unmet',
        }),
        makeGate({
          criterionId: 'GATE-AMS-BAFO-01',
          stageId: 'Selection',
          gateType: 'hard',
          status: 'unmet',
        }),
      ],
    });
    const out = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(out).toBe(
      'BAFO: 2 criteria pending. Start with Minimum 2 vendor BAFO responses received.',
    );
  });

  it('uses singular "criterion" when there is exactly one pending criterion', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'upcoming',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'unmet' }),
      ],
    });
    const out = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(out).toBe(
      'BAFO: 1 criterion pending. Start with Minimum 2 vendor BAFO responses received.',
    );
  });
});

// ─── 6. Upcoming stages — partial evidence ────────────────────────────────────

describe('buildStageMicroSynthesis — upcoming partial', () => {
  it('reports met/total when some but not all criteria are satisfied', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'upcoming',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'met' }),
        makeGate({ criterionId: 'GATE-AMS-BAFO-02', stageId: 'Selection', status: 'unmet' }),
        makeGate({ criterionId: 'GATE-AMS-BAFO-03', stageId: 'Selection', status: 'unmet' }),
      ],
    });
    const out = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(out).toBe('BAFO: 1/3 gate criteria met.');
  });
});

// ─── 7. Determinism ────────────────────────────────────────────────────────────

describe('buildStageMicroSynthesis — determinism', () => {
  it('returns the exact same string on repeated calls', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'blocked',
      gateEvaluations: [
        makeGate({ criterionId: 'GATE-AMS-BAFO-01', stageId: 'Selection', status: 'unmet' }),
      ],
    });
    const a = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    const b = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    const c = buildStageMicroSynthesis('BAFO', ev, PAT_SRC_AMS_001);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});

// ─── 8. Integration with evaluateAllStages ────────────────────────────────────

describe('buildStageMicroSynthesisMap — integration', () => {
  it('produces a non-empty string for every stage in the AMS pattern', () => {
    const evaluator = createGateEvaluator(PAT_SRC_AMS_001);
    const stages = evaluator.evaluateAllStages('BAFO', {});
    const map = buildStageMicroSynthesisMap(stages, PAT_SRC_AMS_001);
    for (const stage of stages) {
      expect(typeof map[stage.stageId]).toBe('string');
      expect(map[stage.stageId]!.length).toBeGreaterThan(0);
    }
    // Every pattern stage is keyed in the map
    expect(Object.keys(map).sort()).toEqual(
      stages.map((s) => s.stageId).sort(),
    );
  });

  it('current/blocked stage advisory references the BAFO criterion when pre-stage evidence is empty', () => {
    const evaluator = createGateEvaluator(PAT_SRC_AMS_001);
    const stages = evaluator.evaluateAllStages('BAFO', {});
    const map = buildStageMicroSynthesisMap(stages, PAT_SRC_AMS_001);
    const bafoStage = stages.find((s) => s.stageId === 'BAFO');
    expect(bafoStage).toBeDefined();
    expect(['current', 'blocked']).toContain(bafoStage!.status);
    // Blocked branch must name the top hard criterion description.
    if (bafoStage!.status === 'blocked') {
      expect(map['BAFO']).toContain('Minimum 2 vendor BAFO responses received');
    }
  });
});

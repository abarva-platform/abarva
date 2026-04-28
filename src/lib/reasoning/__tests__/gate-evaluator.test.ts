/**
 * Gate evaluator tests — REASON-6
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Same inputs always produce the same outputs.
 *
 * Test structure uses PAT_SRC_AMS_001 as the canonical fixture because it is
 * the most complete lifecycle pattern in the codebase and its gate criteria are
 * exhaustively defined.
 *
 * Convention used by PAT_SRC_AMS_001:
 *   Each GateCriterion's `stageId` names the DESTINATION stage that the criterion
 *   must be satisfied before entering.  So GATE-AMS-BAFO-* criteria have
 *   `stageId: 'Selection'` — they guard the BAFO→Selection transition.
 *   `evaluateStage('BAFO', ...)` therefore returns these criteria (it looks up
 *   the next stage after BAFO, which is Selection, and returns matching criteria).
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import {
  createGateEvaluator,
  evaluateStageGates,
  LifecycleGateEvaluator,
} from '@/lib/reasoning';

// ─── Fixture helpers ───────────────────────────────────────────────────────────

/** IDs of the three hard gate criteria guarding the BAFO→Selection transition. */
const BAFO_HARD_GATE_IDS = [
  'GATE-AMS-BAFO-01',
  'GATE-AMS-BAFO-02',
  'GATE-AMS-BAFO-03',
] as const;

/** ID of the soft gate criterion in the same group. */
const BAFO_SOFT_GATE_ID = 'GATE-AMS-BAFO-04';

/** Evidence map that satisfies all three hard gates for the BAFO stage. */
const ALL_HARD_GATES_MET_EVIDENCE: Record<string, unknown> = {
  'GATE-AMS-BAFO-01': true,
  'GATE-AMS-BAFO-02': true,
  'GATE-AMS-BAFO-03': true,
};

// ─── 1. Empty evidence map → all unmet ────────────────────────────────────────

describe('evaluateStage — empty evidence map', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('returns one result per BAFO-stage criterion', () => {
    const results = evaluator.evaluateStage('BAFO', {});
    // PAT_SRC_AMS_001 defines 4 criteria with stageId 'Selection' (3 hard + 1 soft)
    expect(results).toHaveLength(4);
  });

  it('all criteria are unmet when no evidence is provided', () => {
    const results = evaluator.evaluateStage('BAFO', {});
    for (const result of results) {
      expect(result.status).toBe('unmet');
    }
  });

  it('each result carries the correct criterionId and stageId', () => {
    const results = evaluator.evaluateStage('BAFO', {});
    const ids = results.map((r) => r.criterionId);
    expect(ids).toContain('GATE-AMS-BAFO-01');
    expect(ids).toContain('GATE-AMS-BAFO-02');
    expect(ids).toContain('GATE-AMS-BAFO-03');
    expect(ids).toContain('GATE-AMS-BAFO-04');
  });

  it('each result carries a patternRef pointing to PAT_SRC_AMS_001', () => {
    const results = evaluator.evaluateStage('BAFO', {});
    for (const result of results) {
      expect(result.patternRef.patternId).toBe('PAT-SRC-AMS-001');
      expect(result.patternRef.patternVersion).toBe('1.0');
    }
  });

  it('each result carries an evaluatedAt timestamp (ms)', () => {
    const before = Date.now();
    const results = evaluator.evaluateStage('BAFO', {});
    const after = Date.now();
    for (const result of results) {
      expect(result.evaluatedAt).toBeGreaterThanOrEqual(before);
      expect(result.evaluatedAt).toBeLessThanOrEqual(after);
    }
  });
});

// ─── 2. Direct key match → met ────────────────────────────────────────────────

describe('evaluateStage — direct key match', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('criterion is met when its id is set to true in the evidence map', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-01': true,
    });
    const gate01 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-01');
    expect(gate01?.status).toBe('met');
  });

  it('criterion is met when its id is set to "met"', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-02': 'met',
    });
    const gate02 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-02');
    expect(gate02?.status).toBe('met');
  });

  it('criterion is met when its id is set to "done"', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-03': 'done',
    });
    const gate03 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-03');
    expect(gate03?.status).toBe('met');
  });

  it('other criteria remain unmet when only one is satisfied', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-01': true,
    });
    const unmet = results.filter(
      (r) => r.criterionId !== 'GATE-AMS-BAFO-01' && r.status !== 'met',
    );
    expect(unmet.length).toBeGreaterThan(0);
  });

  it('direct match criterion has the criterion id in its evidence array', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-01': true,
    });
    const gate01 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-01');
    expect(gate01?.evidence.some((e) => e.includes('GATE-AMS-BAFO-01'))).toBe(true);
  });
});

// ─── 3. Waiver key → waived ───────────────────────────────────────────────────

describe('evaluateStage — waiver key', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('criterion is waived when the _waived sentinel key is true', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-01_waived': true,
    });
    const gate01 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-01');
    expect(gate01?.status).toBe('waived');
  });

  it('waiver does not affect other criteria', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-01_waived': true,
    });
    const others = results.filter((r) => r.criterionId !== 'GATE-AMS-BAFO-01');
    for (const r of others) {
      expect(r.status).toBe('unmet');
    }
  });

  it('waiver key set to false does not waive the criterion', () => {
    const results = evaluator.evaluateStage('BAFO', {
      'GATE-AMS-BAFO-01_waived': false,
    });
    const gate01 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-01');
    expect(gate01?.status).not.toBe('waived');
  });
});

// ─── 4. Hard gate blocker ─────────────────────────────────────────────────────

describe('isHardGateMet', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('returns false when no evidence is provided (hard gates unmet)', () => {
    expect(evaluator.isHardGateMet('BAFO', {})).toBe(false);
  });

  it('returns false when only soft gates are satisfied', () => {
    const softOnlyEvidence: Record<string, unknown> = {
      [BAFO_SOFT_GATE_ID]: true,
    };
    expect(evaluator.isHardGateMet('BAFO', softOnlyEvidence)).toBe(false);
  });

  it('returns false when only some hard gates are met', () => {
    expect(
      evaluator.isHardGateMet('BAFO', { 'GATE-AMS-BAFO-01': true }),
    ).toBe(false);
  });

  it('returns true when all hard gates are met', () => {
    expect(evaluator.isHardGateMet('BAFO', ALL_HARD_GATES_MET_EVIDENCE)).toBe(true);
  });

  it('returns true when all hard gates are waived', () => {
    const waivedEvidence: Record<string, unknown> = {};
    for (const id of BAFO_HARD_GATE_IDS) {
      waivedEvidence[`${id}_waived`] = true;
    }
    expect(evaluator.isHardGateMet('BAFO', waivedEvidence)).toBe(true);
  });

  it('returns true when a mix of met and waived hard gates covers all hard gates', () => {
    expect(
      evaluator.isHardGateMet('BAFO', {
        'GATE-AMS-BAFO-01': true,
        'GATE-AMS-BAFO-02_waived': true,
        'GATE-AMS-BAFO-03': 'done',
      }),
    ).toBe(true);
  });
});

// ─── 5. evaluateAllStages ordering ────────────────────────────────────────────

describe('evaluateAllStages', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('returns one result per stage in the pattern', () => {
    const results = evaluator.evaluateAllStages('BAFO', {});
    expect(results).toHaveLength(PAT_SRC_AMS_001.stages.length);
  });

  it('stages before current are marked passed', () => {
    const results = evaluator.evaluateAllStages('BAFO', {});
    // BAFO is order 7 — stages with order < 7 should be 'passed'
    const currentOrder = PAT_SRC_AMS_001.stages.find((s) => s.id === 'BAFO')!.order;
    const before = results.filter((r) => {
      const stage = PAT_SRC_AMS_001.stages.find((s) => s.id === r.stageId)!;
      return stage.order < currentOrder;
    });
    for (const r of before) {
      expect(r.status).toBe('passed');
    }
  });

  it('stages after current are marked upcoming', () => {
    const results = evaluator.evaluateAllStages('BAFO', {});
    const currentOrder = PAT_SRC_AMS_001.stages.find((s) => s.id === 'BAFO')!.order;
    const after = results.filter((r) => {
      const stage = PAT_SRC_AMS_001.stages.find((s) => s.id === r.stageId)!;
      return stage.order > currentOrder;
    });
    for (const r of after) {
      expect(r.status).toBe('upcoming');
    }
  });

  it('current stage is blocked when hard gates are unmet', () => {
    const results = evaluator.evaluateAllStages('BAFO', {});
    const current = results.find((r) => r.stageId === 'BAFO');
    expect(current?.status).toBe('blocked');
  });

  it('current stage is current when all hard gates are met', () => {
    const results = evaluator.evaluateAllStages('BAFO', ALL_HARD_GATES_MET_EVIDENCE);
    const current = results.find((r) => r.stageId === 'BAFO');
    expect(current?.status).toBe('current');
  });

  it('results are ordered by stage order ascending', () => {
    const results = evaluator.evaluateAllStages('BAFO', {});
    for (let i = 1; i < results.length; i++) {
      expect(results[i].order).toBeGreaterThan(results[i - 1].order);
    }
  });

  it('each result carries correct gatesTotal count', () => {
    const results = evaluator.evaluateAllStages('BAFO', {});
    for (const r of results) {
      expect(r.gatesTotal).toBe(r.gateEvaluations.length);
    }
  });
});

// ─── 6. canAdvance requires all hard gates met ────────────────────────────────

describe('canAdvance', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('returns false with empty evidence', () => {
    expect(evaluator.canAdvance('BAFO', {})).toBe(false);
  });

  it('returns false when only partial evidence is present', () => {
    expect(evaluator.canAdvance('BAFO', { 'GATE-AMS-BAFO-01': true })).toBe(false);
  });

  it('returns true after all hard gates are met', () => {
    expect(evaluator.canAdvance('BAFO', ALL_HARD_GATES_MET_EVIDENCE)).toBe(true);
  });

  it('soft gate unmet does not block advance', () => {
    // Hard gates met; soft gate (BAFO-04) intentionally absent
    expect(evaluator.canAdvance('BAFO', ALL_HARD_GATES_MET_EVIDENCE)).toBe(true);
  });
});

// ─── 7. unmetCriteria enrichment ──────────────────────────────────────────────

describe('unmetCriteria', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('returns all 4 criteria as unmet when evidence is empty', () => {
    const unmet = evaluator.unmetCriteria('BAFO', {});
    expect(unmet).toHaveLength(4);
  });

  it('each unmet result includes description and evaluationHint', () => {
    const unmet = evaluator.unmetCriteria('BAFO', {});
    for (const item of unmet) {
      expect(item.description).toBeTruthy();
      expect(item.evaluationHint).toBeTruthy();
    }
  });

  it('met criteria are excluded from unmet results', () => {
    const unmet = evaluator.unmetCriteria('BAFO', { 'GATE-AMS-BAFO-01': true });
    const ids = unmet.map((u) => u.criterionId);
    expect(ids).not.toContain('GATE-AMS-BAFO-01');
  });

  it('waived criteria are excluded from unmet results', () => {
    const unmet = evaluator.unmetCriteria('BAFO', {
      'GATE-AMS-BAFO-01_waived': true,
    });
    const ids = unmet.map((u) => u.criterionId);
    expect(ids).not.toContain('GATE-AMS-BAFO-01');
  });

  it('returns empty array when all criteria are met or waived', () => {
    const allClear: Record<string, unknown> = {
      ...ALL_HARD_GATES_MET_EVIDENCE,
      [BAFO_SOFT_GATE_ID]: true,
    };
    expect(evaluator.unmetCriteria('BAFO', allClear)).toHaveLength(0);
  });
});

// ─── 8. evaluateStageGates convenience export ─────────────────────────────────

describe('evaluateStageGates (module-level function)', () => {
  it('produces the same results as evaluator.evaluateStage', () => {
    const evidence = { 'GATE-AMS-BAFO-01': true };
    const direct = createGateEvaluator(PAT_SRC_AMS_001).evaluateStage(
      'BAFO',
      evidence,
    );
    const convenience = evaluateStageGates(PAT_SRC_AMS_001, 'BAFO', evidence);

    expect(convenience.map((r) => r.criterionId)).toEqual(
      direct.map((r) => r.criterionId),
    );
    expect(convenience.map((r) => r.status)).toEqual(
      direct.map((r) => r.status),
    );
  });
});

// ─── 9. Partial evidence produces partial status ──────────────────────────────

describe('partial evidence status', () => {
  let evaluator: LifecycleGateEvaluator;

  beforeEach(() => {
    evaluator = createGateEvaluator(PAT_SRC_AMS_001);
  });

  it('keyword match in evidence map yields partial status for a criterion', () => {
    // GATE-AMS-BAFO-01 description: "Minimum 2 vendor BAFO responses received"
    // A key containing "bafo" should be a partial match
    const results = evaluator.evaluateStage('BAFO', {
      bafoResponseCount: 1,
    });
    const gate01 = results.find((r) => r.criterionId === 'GATE-AMS-BAFO-01');
    // Should be partial (keyword "bafo" appears in the description)
    expect(gate01?.status).toBe('partial');
    expect(gate01?.evidence.length).toBeGreaterThan(0);
  });
});

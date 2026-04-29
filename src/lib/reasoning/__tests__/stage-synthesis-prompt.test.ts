/**
 * Stage synthesis prompt tests — REASON-32 follow-up
 *
 * Pure deterministic helper. Identical inputs always produce identical
 * `{ system, user }` strings; no time, randomness, or IO.
 *
 * Each test exercises one aspect of prompt shape so a regression in the
 * structured prompt body fails loudly.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { buildStageSynthesisPrompt } from '@/lib/reasoning/stage-synthesis-prompt';
import type {
  GateEvaluation,
  StageEvaluationResult,
  ArtifactExpectation,
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

function makeArtifact(
  overrides: Partial<ArtifactExpectation> & {
    artifactId: string;
    label: string;
  },
): ArtifactExpectation {
  return {
    stageId: 'BAFO',
    requirement: 'required',
    gateType: 'hard',
    present: false,
    patternRef: PATTERN_REF,
    ...overrides,
  };
}

// ─── 1. System block is stable validator voice ───────────────────────────────

describe('buildStageSynthesisPrompt — system block', () => {
  it('uses the validator voice register and is stable across calls', () => {
    const ev = makeStageEval({
      stageId: 'Plan',
      stageLabel: 'Plan',
      status: 'current',
    });
    const a = buildStageSynthesisPrompt({
      stageId: 'Plan',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    const b = buildStageSynthesisPrompt({
      stageId: 'Plan',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    expect(a.system).toBe(b.system);
    expect(a.system).toMatch(/60–80 word/);
    expect(a.system).toMatch(/Plain prose/);
    expect(a.system).toMatch(/no markdown/i);
  });
});

// ─── 2. Empty stage → "none defined" hint ────────────────────────────────────

describe('buildStageSynthesisPrompt — empty stage', () => {
  it('says "none defined" when the stage has no gate criteria', () => {
    const ev = makeStageEval({
      stageId: 'EmptyStage',
      stageLabel: 'Empty Stage',
      status: 'upcoming',
      gateEvaluations: [],
      gatesTotal: 0,
    });
    const out = buildStageSynthesisPrompt({
      stageId: 'EmptyStage',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    expect(out.user).toMatch(/Stage: Empty Stage/);
    expect(out.user).toMatch(/Gate criteria: none defined/);
    expect(out.user).not.toMatch(/^ {2}- \[/m);
  });
});

// ─── 3. Gate criteria are listed with type + status ──────────────────────────

describe('buildStageSynthesisPrompt — gate listing', () => {
  it('lists each criterion with [type/STATUS] and uses the pattern description', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'blocked',
      gateEvaluations: [
        makeGate({
          criterionId: 'GATE-AMS-BAFO-PRICING',
          stageId: 'BAFO',
          gateType: 'hard',
          status: 'unmet',
        }),
        makeGate({
          criterionId: 'GATE-AMS-BAFO-SLA',
          stageId: 'BAFO',
          gateType: 'soft',
          status: 'partial',
        }),
      ],
      gatesTotal: 2,
      gatesMet: 0,
    });
    const out = buildStageSynthesisPrompt({
      stageId: 'BAFO',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    expect(out.user).toMatch(/\[hard\/UNMET\]/);
    expect(out.user).toMatch(/\[soft\/PARTIAL\]/);
    expect(out.user).toMatch(/Gate progress: 0 of 2 criteria met\./);
  });
});

// ─── 4. Missing artifacts are surfaced with hard ones first ──────────────────

describe('buildStageSynthesisPrompt — missing artifacts', () => {
  it('lists hard-required artifacts ahead of soft, capped at 5 with overflow note', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'blocked',
      gateEvaluations: [],
      gatesTotal: 0,
      missingArtifacts: [
        makeArtifact({ artifactId: 'a1', label: 'Soft One', gateType: 'soft' }),
        makeArtifact({ artifactId: 'a2', label: 'Hard One', gateType: 'hard' }),
        makeArtifact({ artifactId: 'a3', label: 'Hard Two', gateType: 'hard' }),
        makeArtifact({ artifactId: 'a4', label: 'Soft Two', gateType: 'soft' }),
        makeArtifact({ artifactId: 'a5', label: 'Hard Three', gateType: 'hard' }),
        makeArtifact({ artifactId: 'a6', label: 'Hard Four', gateType: 'hard' }),
        makeArtifact({ artifactId: 'a7', label: 'Soft Three', gateType: 'soft' }),
      ],
    });
    const out = buildStageSynthesisPrompt({
      stageId: 'BAFO',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    // First listed missing artifact should be a hard one (not "Soft One").
    const firstMissingIdx = out.user.indexOf('  - [hard');
    const softOneIdx = out.user.indexOf('Soft One');
    expect(firstMissingIdx).toBeGreaterThan(-1);
    expect(softOneIdx).toBeGreaterThan(firstMissingIdx);
    // Truncation note appears (7 missing, 5 shown).
    expect(out.user).toMatch(/and 2 more/);
  });
});

// ─── 5. Determinism — identical inputs → byte-identical user prompts ────────

describe('buildStageSynthesisPrompt — determinism', () => {
  it('produces byte-identical prompts for the same input twice', () => {
    const ev = makeStageEval({
      stageId: 'BAFO',
      stageLabel: 'BAFO',
      status: 'blocked',
      gateEvaluations: [
        makeGate({
          criterionId: 'GATE-AMS-BAFO-PRICING',
          stageId: 'BAFO',
          gateType: 'hard',
          status: 'unmet',
        }),
      ],
      gatesTotal: 1,
      gatesMet: 0,
    });
    const a = buildStageSynthesisPrompt({
      stageId: 'BAFO',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    const b = buildStageSynthesisPrompt({
      stageId: 'BAFO',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001,
      instanceLabel: 'AMS Vendor 2026',
      surface: 'source',
    });
    expect(a.system).toBe(b.system);
    expect(a.user).toBe(b.user);
  });
});

// ─── 6. Surface label + instance label propagate into user prompt ────────────

describe('buildStageSynthesisPrompt — header propagation', () => {
  it('includes surface, instance label, stage label, and stage id', () => {
    const ev = makeStageEval({
      stageId: 'P3-Design',
      stageLabel: 'Design',
      status: 'current',
    });
    const out = buildStageSynthesisPrompt({
      stageId: 'P3-Design',
      evaluation: ev,
      pattern: PAT_SRC_AMS_001, // any pattern works for the header check
      instanceLabel: 'Apex CDP 2026',
      surface: 'programs',
    });
    expect(out.user).toMatch(/^Surface: programs/m);
    expect(out.user).toMatch(/^Instance: Apex CDP 2026/m);
    expect(out.user).toMatch(/Stage: Design \(id: P3-Design, status: current\)/);
  });
});

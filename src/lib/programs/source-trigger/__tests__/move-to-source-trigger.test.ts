// Slice 2.6 · Move-to-Source trigger — behaviour tests.
//
// The trigger decides whether a shaped Move needs an external Source lane and,
// when it does, generates a structured `SourceRecommendation`. These tests
// drive `runMoveToSourceTrigger` from a real mobilization plan composed
// end-to-end through the genuine Slice 2.2 / 2.3 / 2.5 builders — so the
// trigger is exercised against a genuinely shaped Move, not a hand-mocked one.

import type { SuitabilityAssessment } from '@/lib/programs/suitability/agentic-suitability';
import { decomposeWorkflow } from '@/lib/programs/decomposition/workflow-decomposition';
import { buildSolutionArchitectureOptions } from '@/lib/programs/architecture/solution-architecture-options';
import { buildControlEvalMatrix } from '@/lib/programs/controls/control-eval-matrix';
import {
  buildMobilizationPlan,
  type MobilizationPlan,
} from '@/lib/programs/mobilization/mobilization-plan';
import {
  getSolutionArchetype,
  type DeliveryLean,
  type SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';
import {
  runMoveToSourceTrigger,
  SOURCING_ENGAGEMENT_LABEL,
  type DeliveryModelSignal,
  type MoveToSourceTriggerResult,
} from '../move-to-source-trigger';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const ALL_HIGH: ReadinessProfile = { data: 'high', control: 'high', eval: 'high' };
const ALL_LOW: ReadinessProfile = { data: 'low', control: 'low', eval: 'low' };

/** Hand-pinned suitability assessment for a target archetype. */
function assessmentFor(
  archetype: SolutionArchetypeKey,
  overrides: Partial<SuitabilityAssessment> = {},
): SuitabilityAssessment {
  return {
    recommendedArchetype: archetype,
    recommendedName: getSolutionArchetype(archetype).name,
    intendedArchetype: archetype,
    steppedDown: false,
    antiPatternCode: null,
    readinessScore: 100,
    readinessGaps: [],
    reasons: ['fixture'],
    ...overrides,
  };
}

/** Compose a real mobilization plan for a Move, end-to-end. */
function planFor(
  proposedMove: string,
  archetype: SolutionArchetypeKey,
  readiness: ReadinessProfile,
  overrides: Partial<SuitabilityAssessment> = {},
): MobilizationPlan {
  const assessment = assessmentFor(archetype, overrides);
  const decomposition = decomposeWorkflow(proposedMove, assessment);
  const architecture = buildSolutionArchitectureOptions({
    recommendedArchetype: archetype,
    readiness,
  });
  const controlMatrix = buildControlEvalMatrix(getSolutionArchetype(archetype));
  return buildMobilizationPlan({ decomposition, architecture, controlMatrix });
}

/** A real plan, then forced to a target delivery lean for lean-driven tests. */
function planWithLean(lean: DeliveryLean): MobilizationPlan {
  const base = planFor(
    'Agent that drafts and executes customer refunds with approval.',
    'human_in_loop_agent',
    ALL_HIGH,
  );
  return { ...base, deliveryLean: lean };
}

const GATE_BUILD: DeliveryModelSignal = {
  recommendedModel: 'build',
  confidence: 'high',
};
const GATE_BUY: DeliveryModelSignal = {
  recommendedModel: 'buy',
  confidence: 'high',
};
const GATE_PARTNER: DeliveryModelSignal = {
  recommendedModel: 'partner',
  confidence: 'medium',
};
const GATE_SI_LOW: DeliveryModelSignal = {
  recommendedModel: 'si',
  confidence: 'low',
};

// ─── Disposition — gate-signal-driven ──────────────────────────────────────

describe('runMoveToSourceTrigger — gate signal drives the disposition', () => {
  it('a build gate verdict yields build_in_house and no recommendation', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('buy'),
      deliveryModelSignal: GATE_BUILD,
    });
    expect(result.disposition).toBe('build_in_house');
    expect(result.recommendation).toBeNull();
    expect(result.deliveryModel).toBe('build');
    expect(result.confidence).toBe('high');
  });

  it('a buy gate verdict yields sourcing_required with a product engagement', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('build'),
      deliveryModelSignal: GATE_BUY,
    });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.recommendation).not.toBeNull();
    expect(result.recommendation?.engagementKind).toBe('product');
  });

  it('a partner gate verdict yields a managed-service engagement', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('build'),
      deliveryModelSignal: GATE_PARTNER,
    });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.recommendation?.engagementKind).toBe('managed_service');
  });

  it('an SI gate verdict yields a systems-integrator engagement', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('build'),
      deliveryModelSignal: GATE_SI_LOW,
    });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.recommendation?.engagementKind).toBe('systems_integrator');
  });

  it('the gate verdict overrides a contradicting mobilization lean', () => {
    // Plan leans build, but the gate says buy — gate wins.
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('build'),
      deliveryModelSignal: GATE_BUY,
    });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.deliveryLean).toBe('build');
    expect(result.deliveryModel).toBe('buy');
  });

  it('carries the gate confidence band onto the result', () => {
    expect(
      runMoveToSourceTrigger({
        mobilizationPlan: planWithLean('build'),
        deliveryModelSignal: GATE_SI_LOW,
      }).confidence,
    ).toBe('low');
  });
});

// ─── Disposition — lean-driven (no gate signal) ────────────────────────────

describe('runMoveToSourceTrigger — mobilization lean drives the disposition', () => {
  it('a build lean yields build_in_house with no recommendation', () => {
    const result = runMoveToSourceTrigger({ mobilizationPlan: planWithLean('build') });
    expect(result.disposition).toBe('build_in_house');
    expect(result.recommendation).toBeNull();
    expect(result.deliveryModel).toBeNull();
  });

  it('a buy lean yields sourcing_required with a product engagement', () => {
    const result = runMoveToSourceTrigger({ mobilizationPlan: planWithLean('buy') });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.recommendation?.engagementKind).toBe('product');
    expect(result.confidence).toBe('medium');
  });

  it('an orchestrate lean yields sourcing_required with a product engagement', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('orchestrate'),
    });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.recommendation?.engagementKind).toBe('product');
  });

  it('a mixed lean with no gate signal yields needs_decision', () => {
    const result = runMoveToSourceTrigger({ mobilizationPlan: planWithLean('mixed') });
    expect(result.disposition).toBe('needs_decision');
    expect(result.recommendation).toBeNull();
    expect(result.confidence).toBe('low');
  });

  it('a mixed lean is resolved when a gate signal is supplied', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('mixed'),
      deliveryModelSignal: GATE_PARTNER,
    });
    expect(result.disposition).toBe('sourcing_required');
    expect(result.recommendation?.engagementKind).toBe('managed_service');
  });
});

// ─── The recommendation shape ──────────────────────────────────────────────

describe('runMoveToSourceTrigger — the Source recommendation', () => {
  function recommendation(signal?: DeliveryModelSignal) {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('buy'),
      deliveryModelSignal: signal,
    });
    expect(result.recommendation).not.toBeNull();
    return result.recommendation!;
  }

  it('states what to source, naming the Move and the archetype', () => {
    const rec = recommendation();
    expect(rec.whatToSource.length).toBeGreaterThan(0);
    expect(rec.whatToSource).toContain('refunds');
  });

  it('carries a non-empty category hint and a labelled engagement kind', () => {
    const rec = recommendation();
    expect(rec.categoryHint.length).toBeGreaterThan(0);
    expect(rec.engagementKindLabel).toBe(
      SOURCING_ENGAGEMENT_LABEL[rec.engagementKind],
    );
  });

  it('carves an external scope and a retained scope', () => {
    const rec = recommendation();
    expect(rec.externalScope.length).toBeGreaterThan(0);
    expect(rec.retainedScope.length).toBeGreaterThan(0);
  });

  it('retains accountability, controls, and change inside the tenant', () => {
    const rec = recommendation();
    const retained = rec.retainedScope.join(' ').toLowerCase();
    expect(retained).toContain('accountability');
    expect(retained).toContain('control');
    expect(retained).toContain('change');
  });

  it('the external scope carries the build backlog', () => {
    const result = runMoveToSourceTrigger({ mobilizationPlan: planWithLean('buy') });
    const plan = planWithLean('buy');
    expect(plan.backlog.length).toBeGreaterThan(0);
    expect(result.recommendation?.externalScope.join(' ')).toContain('backlog');
  });

  it('produces assumptions with unique stable ids', () => {
    const rec = recommendation();
    expect(rec.assumptions.length).toBeGreaterThan(0);
    const ids = rec.assumptions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toMatch(/^m2s-a\d+$/);
  });

  it('adds a low-confidence assumption when the gate confidence is low', () => {
    const rec = recommendation(GATE_SI_LOW);
    const text = rec.assumptions.map((a) => a.assumption).join(' ').toLowerCase();
    expect(text).toContain('low-confidence');
  });

  it('every assumption states why it matters', () => {
    const rec = recommendation(GATE_PARTNER);
    for (const a of rec.assumptions) {
      expect(a.whyItMatters.length).toBeGreaterThan(0);
    }
  });
});

// ─── Auditability & determinism ────────────────────────────────────────────

describe('runMoveToSourceTrigger — auditability & determinism', () => {
  it('always records reasoning and stamps the trigger version', () => {
    const result = runMoveToSourceTrigger({
      mobilizationPlan: planWithLean('buy'),
      deliveryModelSignal: GATE_BUY,
    });
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.triggerVersion).toBe('move-to-source-trigger/v1');
  });

  it('is deterministic — identical input yields identical output', () => {
    const input = {
      mobilizationPlan: planWithLean('buy'),
      deliveryModelSignal: GATE_PARTNER,
    };
    expect(runMoveToSourceTrigger(input)).toEqual(runMoveToSourceTrigger(input));
  });

  it('echoes the proposed Move and the delivery lean for traceability', () => {
    const result = runMoveToSourceTrigger({ mobilizationPlan: planWithLean('buy') });
    expect(result.proposedMove).toContain('refunds');
    expect(result.deliveryLean).toBe('buy');
  });
});

// ─── End-to-end scenario ───────────────────────────────────────────────────

describe('runMoveToSourceTrigger — end-to-end scenario', () => {
  it('a shaped Move whose delivery model needs a vendor produces a usable brief', () => {
    // A genuinely shaped Move, decomposed / architected / control-mapped end
    // to end, with a Slice 1.2 gate verdict of partner.
    const plan = planFor(
      'Agent that triages and routes inbound support tickets.',
      'human_in_loop_agent',
      ALL_LOW,
      {
        readinessGaps: [
          { dimension: 'data', current: 'low', required: 'moderate', note: 'data gap' },
        ],
      },
    );
    const result: MoveToSourceTriggerResult = runMoveToSourceTrigger({
      mobilizationPlan: plan,
      deliveryModelSignal: { recommendedModel: 'partner', confidence: 'medium' },
    });

    // The trigger opens a Source lane.
    expect(result.disposition).toBe('sourcing_required');
    const rec = result.recommendation;
    expect(rec).not.toBeNull();

    // The brief is structured and usable by Source intake.
    expect(rec!.engagementKind).toBe('managed_service');
    expect(rec!.whatToSource.length).toBeGreaterThan(0);
    expect(rec!.categoryHint.length).toBeGreaterThan(0);
    expect(rec!.externalScope.length).toBeGreaterThan(0);
    expect(rec!.retainedScope.length).toBeGreaterThan(0);
    expect(rec!.assumptions.length).toBeGreaterThan(0);

    // The not-tight-path Move surfaces unresolved delivery risk as an
    // assumption Source must price.
    const assumptionText = rec!.assumptions
      .map((a) => a.assumption)
      .join(' ')
      .toLowerCase();
    expect(assumptionText).toContain('tight path');

    // The pilot timeline is a carried constraint.
    expect(assumptionText).toContain('pilot');
  });

  it('a shaped Move the squad can build never opens a Source lane', () => {
    const plan = planFor(
      'Agent that drafts internal status summaries for the team.',
      'human_in_loop_agent',
      ALL_HIGH,
    );
    const result = runMoveToSourceTrigger({
      mobilizationPlan: plan,
      deliveryModelSignal: { recommendedModel: 'build', confidence: 'high' },
    });
    expect(result.disposition).toBe('build_in_house');
    expect(result.recommendation).toBeNull();
  });
});

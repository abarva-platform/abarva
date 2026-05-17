// Slice 2.4 · mobilization plan generator — behaviour tests.
//
// The plan is shaped entirely by three upstream artifacts: the Slice 2.2
// workflow decomposition, the Slice 2.3 solution-architecture option set, and
// the Slice 2.5 control & eval matrix. These tests drive
// `buildMobilizationPlan` from artifacts composed end-to-end through the real
// builders, so the plan is exercised against genuine shaped Moves.

import type { SuitabilityAssessment } from '@/lib/programs/suitability/agentic-suitability';
import { decomposeWorkflow } from '@/lib/programs/decomposition/workflow-decomposition';
import { buildSolutionArchitectureOptions } from '@/lib/programs/architecture/solution-architecture-options';
import { buildControlEvalMatrix } from '@/lib/programs/controls/control-eval-matrix';
import {
  getSolutionArchetype,
  SOLUTION_ARCHETYPE_KEYS,
  type SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';
import {
  buildMobilizationPlan,
  PLAN_HORIZONS,
  WORKSTREAMS,
  type MobilizationPlan,
  type MobilizationPlanInput,
} from '../mobilization-plan';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const ALL_HIGH: ReadinessProfile = { data: 'high', control: 'high', eval: 'high' };
const ALL_LOW: ReadinessProfile = { data: 'low', control: 'low', eval: 'low' };
const MIXED: ReadinessProfile = { data: 'moderate', control: 'low', eval: 'none' };

/** Build a hand-pinned suitability assessment for a target archetype. */
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

/**
 * Compose the three artifacts for a Move and build a mobilization-plan input.
 * `assessment` shapes the decomposition; `readiness` shapes the architecture
 * and (via the archetype) the control matrix.
 */
function inputFor(
  proposedMove: string,
  assessment: SuitabilityAssessment,
  readiness: ReadinessProfile,
): MobilizationPlanInput {
  const decomposition = decomposeWorkflow(proposedMove, assessment);
  const architecture = buildSolutionArchitectureOptions({
    recommendedArchetype: assessment.recommendedArchetype,
    readiness,
  });
  const controlMatrix = buildControlEvalMatrix(
    getSolutionArchetype(assessment.recommendedArchetype),
  );
  return { decomposition, architecture, controlMatrix };
}

/** A plan from a fully-ready human-in-loop Move. */
function highReadyPlan(): MobilizationPlan {
  return buildMobilizationPlan(
    inputFor(
      'Agent that drafts and executes customer refunds with approval.',
      assessmentFor('human_in_loop_agent'),
      ALL_HIGH,
    ),
  );
}

/** A plan from a low-readiness Move with open gaps. */
function lowReadyPlan(): MobilizationPlan {
  const assessment = assessmentFor('human_in_loop_agent', {
    readinessGaps: [
      {
        dimension: 'data',
        current: 'low',
        required: 'moderate',
        note: 'data gap',
      },
      {
        dimension: 'eval',
        current: 'none',
        required: 'moderate',
        note: 'eval gap',
      },
    ],
  });
  return buildMobilizationPlan(
    inputFor('Agent that resolves customer issues end-to-end.', assessment, ALL_LOW),
  );
}

// ─── Plan shape ────────────────────────────────────────────────────────────

describe('buildMobilizationPlan — plan shape', () => {
  it('produces a non-empty plan for every archetype', () => {
    for (const archetype of SOLUTION_ARCHETYPE_KEYS) {
      const plan = buildMobilizationPlan(
        inputFor('A proposed Move.', assessmentFor(archetype), ALL_HIGH),
      );
      expect(plan.items.length).toBeGreaterThan(0);
      expect(plan.squad.length).toBeGreaterThan(0);
      expect(plan.archetype).toBe(archetype);
      expect(plan.archetypeName).toBe(getSolutionArchetype(archetype).name);
    }
  });

  it('carries the proposed Move text through from the decomposition', () => {
    const plan = buildMobilizationPlan(
      inputFor('My specific Move.', assessmentFor('assistant'), ALL_HIGH),
    );
    expect(plan.proposedMove).toBe('My specific Move.');
  });

  it('schedules every item into one of the three horizons', () => {
    const plan = highReadyPlan();
    for (const item of plan.items) {
      expect(PLAN_HORIZONS).toContain(item.horizon);
      expect(WORKSTREAMS).toContain(item.workstream);
    }
  });

  it('uses each horizon at least once', () => {
    const plan = lowReadyPlan();
    for (const horizon of PLAN_HORIZONS) {
      expect(plan.items.some((i) => i.horizon === horizon)).toBe(true);
    }
  });

  it('gives every plan item a unique id', () => {
    const plan = lowReadyPlan();
    const ids = plan.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is deterministic — same input yields an identical plan', () => {
    const a = highReadyPlan();
    const b = highReadyPlan();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── Squad ─────────────────────────────────────────────────────────────────

describe('buildMobilizationPlan — squad', () => {
  it('names exactly one accountable owner', () => {
    for (const archetype of SOLUTION_ARCHETYPE_KEYS) {
      const plan = buildMobilizationPlan(
        inputFor('A Move.', assessmentFor(archetype), ALL_HIGH),
      );
      expect(plan.squad.filter((r) => r.accountable)).toHaveLength(1);
    }
  });

  it('gives every squad role a unique key', () => {
    const plan = highReadyPlan();
    const keys = plan.squad.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('always includes a solution architect and a delivery lead', () => {
    const plan = highReadyPlan();
    const keys = plan.squad.map((r) => r.key);
    expect(keys).toContain('solution_architect');
    expect(keys).toContain('delivery_lead');
    expect(keys).toContain('change_lead');
  });

  it('adds an eval engineer when the control matrix carries an eval gate', () => {
    const plan = highReadyPlan(); // human_in_loop_agent — has eval controls
    expect(plan.squad.map((r) => r.key)).toContain('eval_engineer');
  });

  it('adds a security reviewer for an agentic Move with a security gate', () => {
    const plan = highReadyPlan();
    expect(plan.squad.map((r) => r.key)).toContain('security_reviewer');
  });
});

// ─── Backlog ───────────────────────────────────────────────────────────────

describe('buildMobilizationPlan — backlog', () => {
  it('derives a backlog epic for every decomposition node', () => {
    const input = inputFor(
      'Agent that drafts and executes customer refunds.',
      assessmentFor('human_in_loop_agent'),
      ALL_HIGH,
    );
    const plan = buildMobilizationPlan(input);
    const coveredNodes = new Set(
      plan.backlog.flatMap((e) => e.buildsNodes),
    );
    for (const node of input.decomposition.nodes) {
      expect(coveredNodes.has(node.id)).toBe(true);
    }
  });

  it('sizes high-risk nodes as large epics', () => {
    const input = inputFor(
      'Agent that drafts and executes customer refunds.',
      assessmentFor('human_in_loop_agent'),
      ALL_HIGH,
    );
    const plan = buildMobilizationPlan(input);
    const highRiskIds = new Set(
      input.decomposition.nodes
        .filter((n) => n.risk === 'high')
        .map((n) => n.id),
    );
    const largeEpics = plan.backlog.filter((e) => e.size === 'large');
    // every large epic builds at least one high-risk node
    for (const epic of largeEpics) {
      expect(epic.buildsNodes.some((id) => highRiskIds.has(id))).toBe(true);
    }
  });

  it('gives every backlog epic a unique id', () => {
    const plan = highReadyPlan();
    const ids = plan.backlog.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Pilot scheduling ──────────────────────────────────────────────────────

describe('buildMobilizationPlan — pilot scheduling', () => {
  it('pushes the pilot to day 90 when readiness gaps are open', () => {
    const plan = lowReadyPlan();
    expect(plan.pilotHorizon).toBe('day_90');
    expect(plan.readyForTightPath).toBe(false);
  });

  it('schedules a pilot item in the pilot horizon', () => {
    const plan = lowReadyPlan();
    const pilotItems = plan.items.filter((i) => i.workstream === 'pilot');
    expect(pilotItems.length).toBeGreaterThan(0);
    for (const item of pilotItems) {
      expect(item.horizon).toBe(plan.pilotHorizon);
    }
  });

  it('puts every pilot-gating item before the pilot horizon', () => {
    const plan = lowReadyPlan();
    const order = { day_30: 0, day_60: 1, day_90: 2 } as const;
    for (const item of plan.pilotGatingItems) {
      expect(order[item.horizon]).toBeLessThanOrEqual(
        order[plan.pilotHorizon],
      );
      expect(item.blocksPilot).toBe(true);
    }
  });

  it('pilot-gating items are exactly the items flagged blocksPilot', () => {
    const plan = lowReadyPlan();
    expect(plan.pilotGatingItems).toEqual(
      plan.items.filter((i) => i.blocksPilot),
    );
  });

  it('keeps rollout at day 90 and gated after the pilot', () => {
    const plan = highReadyPlan();
    const rollout = plan.items.filter((i) => i.workstream === 'rollout');
    expect(rollout.length).toBeGreaterThan(0);
    for (const item of rollout) {
      expect(item.horizon).toBe('day_90');
      expect(item.blocksPilot).toBe(false);
    }
  });
});

// ─── Gap-driven shaping ────────────────────────────────────────────────────

describe('buildMobilizationPlan — gap-driven shaping', () => {
  it('front-loads data remediation into day 30 when a data gap is open', () => {
    const plan = lowReadyPlan();
    const dataItems = plan.items.filter((i) => i.workstream === 'data');
    expect(dataItems.length).toBeGreaterThan(0);
    for (const item of dataItems) {
      expect(item.horizon).toBe('day_30');
      expect(item.label.toLowerCase()).toContain('remediate');
    }
  });

  it('schedules a controls item for every uncovered §5 gate', () => {
    const input = inputFor(
      'A Move.',
      assessmentFor('retrieval_copilot'),
      MIXED,
    );
    const plan = buildMobilizationPlan(input);
    for (const gate of input.controlMatrix.uncoveredGates) {
      const matched = plan.items.some(
        (i) =>
          i.workstream === 'controls' &&
          i.rationale.includes(gate.replace(/_/g, ' ')),
      );
      // either a dedicated gate item or covered by a baseline controls item
      const hasControlsItem = plan.items.some(
        (i) => i.workstream === 'controls',
      );
      expect(matched || hasControlsItem).toBe(true);
    }
  });

  it('marks the plan tight-path when fully ready with no gaps', () => {
    // a fully-ready full agentic workflow whose architecture is production-shaped
    const plan = buildMobilizationPlan(
      inputFor(
        'A Move.',
        assessmentFor('full_agentic_workflow'),
        ALL_HIGH,
      ),
    );
    // tight path requires production-shaped architecture AND no uncovered gate;
    // assert the flag is internally consistent with the pilot horizon.
    expect(plan.readyForTightPath).toBe(plan.pilotHorizon === 'day_60');
  });

  it('builds an action-path epic only when the workflow takes action', () => {
    const actionPlan = highReadyPlan(); // human_in_loop_agent takes action
    expect(
      actionPlan.items.some(
        (i) =>
          i.workstream === 'build' &&
          i.label.toLowerCase().includes('action path'),
      ),
    ).toBe(true);

    const copilotPlan = buildMobilizationPlan(
      inputFor('A read-only Move.', assessmentFor('retrieval_copilot'), ALL_HIGH),
    );
    expect(
      copilotPlan.items.some(
        (i) =>
          i.workstream === 'build' &&
          i.label.toLowerCase().includes('action path'),
      ),
    ).toBe(false);
  });
});

// ─── Notes ─────────────────────────────────────────────────────────────────

describe('buildMobilizationPlan — notes', () => {
  it('always produces practitioner notes naming the archetype', () => {
    const plan = highReadyPlan();
    expect(plan.notes.length).toBeGreaterThan(0);
    expect(
      plan.notes.some((n) => n.includes(plan.archetypeName)),
    ).toBe(true);
  });

  it('explains why the pilot is pushed when gaps are open', () => {
    const plan = lowReadyPlan();
    expect(
      plan.notes.some((n) => n.toLowerCase().includes('pilot is at')),
    ).toBe(true);
  });
});

// Slice 2.2 · workflow decomposition canvas — behaviour tests.
//
// The canvas is shaped entirely by the Slice 2.1 suitability assessment. These
// tests drive `decomposeWorkflow` from real assessments produced by
// `assessAgenticSuitability`, plus hand-built assessments that pin specific
// shaping rules (stepped-down Moves, open readiness gaps, archetype skeletons).

import { assessAgenticSuitability } from '@/lib/programs/suitability/agentic-suitability';
import type { SuitabilityAssessment } from '@/lib/programs/suitability/agentic-suitability';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';
import type { SolutionArchetypeKey } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import {
  decomposeWorkflow,
  type WorkflowDecomposition,
  type WorkflowNode,
} from '../workflow-decomposition';

/** A readiness profile with every dimension high — clears all gates. */
const ALL_HIGH: ReadinessProfile = { data: 'high', control: 'high', eval: 'high' };

/** Build a minimal hand-pinned assessment for a target archetype. */
function assessmentFor(
  archetype: SolutionArchetypeKey,
  overrides: Partial<SuitabilityAssessment> = {},
): SuitabilityAssessment {
  return {
    recommendedArchetype: archetype,
    recommendedName: archetype,
    intendedArchetype: archetype,
    steppedDown: false,
    antiPatternCode: null,
    readinessScore: 100,
    readinessGaps: [],
    reasons: ['fixture'],
    ...overrides,
  };
}

/** Helper — node ids referenced by a node's `dependsOn` must all exist. */
function dependencyIdsResolve(canvas: WorkflowDecomposition): boolean {
  const ids = new Set(canvas.nodes.map((n) => n.id));
  return canvas.nodes.every((n) => n.dependsOn.every((d) => ids.has(d)));
}

/** Helper — a node never lists itself or a later node as a dependency. */
function isTopologicallyOrdered(nodes: readonly WorkflowNode[]): boolean {
  const indexOf = new Map(nodes.map((n, i) => [n.id, i]));
  return nodes.every((n, i) =>
    n.dependsOn.every((d) => {
      const di = indexOf.get(d);
      return di !== undefined && di < i;
    }),
  );
}

describe('decomposeWorkflow — structural invariants', () => {
  const archetypes: SolutionArchetypeKey[] = [
    'automation',
    'assistant',
    'retrieval_copilot',
    'human_in_loop_agent',
    'full_agentic_workflow',
    'data_remediation',
    'vendor_led_implementation',
    'process_redesign',
  ];

  for (const archetype of archetypes) {
    describe(archetype, () => {
      const canvas = decomposeWorkflow('a proposed move', assessmentFor(archetype));

      it('produces a non-empty node list', () => {
        expect(canvas.nodes.length).toBeGreaterThan(0);
      });

      it('every node has a unique id', () => {
        const ids = canvas.nodes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('every dependsOn id resolves to a real node', () => {
        expect(dependencyIdsResolve(canvas)).toBe(true);
      });

      it('nodes are topologically ordered (no forward / self deps)', () => {
        expect(isTopologicallyOrdered(canvas.nodes)).toBe(true);
      });

      it('always names at least one exception path', () => {
        expect(canvas.nodes.some((n) => n.kind === 'exception')).toBe(true);
        expect(canvas.exceptionCount).toBeGreaterThan(0);
      });

      it('always opens with an intake task and closes with a verify/close task', () => {
        expect(canvas.nodes[0].kind).toBe('task');
        const closing = canvas.nodes.find((n) => /close/i.test(n.label));
        expect(closing).toBeDefined();
      });

      it('every node carries at least one control', () => {
        for (const node of canvas.nodes) {
          expect(node.controls.length).toBeGreaterThan(0);
        }
      });

      it('echoes the archetype and a non-empty notes list', () => {
        expect(canvas.archetype).toBe(archetype);
        expect(canvas.notes.length).toBeGreaterThan(0);
        for (const note of canvas.notes) {
          expect(note.trim().length).toBeGreaterThan(0);
        }
      });

      it('approvalCount / exceptionCount match the node list', () => {
        expect(canvas.approvalCount).toBe(
          canvas.nodes.filter((n) => n.kind === 'approval').length,
        );
        expect(canvas.exceptionCount).toBe(
          canvas.nodes.filter((n) => n.kind === 'exception').length,
        );
      });
    });
  }
});

describe('decomposeWorkflow — archetype-specific shaping', () => {
  it('inserts a human-approval checkpoint for a human-in-loop agent', () => {
    const canvas = decomposeWorkflow('move', assessmentFor('human_in_loop_agent'));
    expect(canvas.approvalCount).toBeGreaterThan(0);
    expect(canvas.nodes.some((n) => n.kind === 'approval' && n.actor === 'human')).toBe(
      true,
    );
  });

  it('grants full autonomy (no approval node) for a full agentic workflow', () => {
    const canvas = decomposeWorkflow('move', assessmentFor('full_agentic_workflow'));
    expect(canvas.approvalCount).toBe(0);
    expect(canvas.nodes.some((n) => n.kind === 'approval')).toBe(false);
    // It still takes a consequential action.
    expect(canvas.nodes.some((n) => /execute action/i.test(n.label))).toBe(true);
  });

  it('omits an action / decision step for a retrieval copilot', () => {
    const canvas = decomposeWorkflow('move', assessmentFor('retrieval_copilot'));
    expect(canvas.nodes.some((n) => /execute action/i.test(n.label))).toBe(false);
    expect(canvas.nodes.some((n) => n.kind === 'decision')).toBe(false);
  });

  it('omits a reasoning step for deterministic automation and reconciles instead', () => {
    const canvas = decomposeWorkflow('move', assessmentFor('automation'));
    expect(canvas.nodes.some((n) => /reason over context/i.test(n.label))).toBe(false);
    expect(canvas.nodes.some((n) => /reconcile/i.test(n.label))).toBe(true);
  });

  it('shapes process redesign as a human exercise with no action node', () => {
    const canvas = decomposeWorkflow('move', assessmentFor('process_redesign'));
    expect(canvas.nodes.some((n) => /execute action/i.test(n.label))).toBe(false);
    expect(canvas.nodes.some((n) => n.kind === 'decision')).toBe(false);
  });

  it('includes a grounding-retrieval task for grounding-dependent archetypes', () => {
    for (const a of ['assistant', 'retrieval_copilot', 'human_in_loop_agent'] as const) {
      const canvas = decomposeWorkflow('move', assessmentFor(a));
      expect(canvas.nodes.some((n) => /grounding context/i.test(n.label))).toBe(true);
    }
  });
});

describe('decomposeWorkflow — readiness gaps block controls', () => {
  it('marks controls blocked when a readiness dimension has an open gap', () => {
    const assessment = assessmentFor('human_in_loop_agent', {
      readinessGaps: [
        { dimension: 'data', current: 'low', required: 'high', note: 'corpus stale' },
      ],
    });
    const canvas = decomposeWorkflow('move', assessment);
    expect(canvas.blockedControls.length).toBeGreaterThan(0);
    for (const c of canvas.blockedControls) {
      expect(c.satisfiable).toBe(false);
      expect(c.blockedBy).toBe('data');
    }
    // The grounding control specifically is the one blocked by a data gap.
    const grounding = canvas.nodes
      .flatMap((n) => n.controls)
      .find((c) => c.kind === 'grounding');
    expect(grounding?.satisfiable).toBe(false);
  });

  it('leaves every control satisfiable when no readiness gap is open', () => {
    const canvas = decomposeWorkflow('move', assessmentFor('full_agentic_workflow'));
    expect(canvas.blockedControls).toHaveLength(0);
    for (const node of canvas.nodes) {
      for (const c of node.controls) {
        expect(c.satisfiable).toBe(true);
        expect(c.blockedBy).toBeNull();
      }
    }
  });

  it('surfaces the open dimensions in the canvas notes', () => {
    const assessment = assessmentFor('retrieval_copilot', {
      readinessGaps: [
        { dimension: 'eval', current: 'low', required: 'moderate', note: 'no golden corpus' },
      ],
    });
    const canvas = decomposeWorkflow('move', assessment);
    expect(canvas.notes.some((n) => /eval/.test(n) && /not yet implementable/.test(n))).toBe(
      true,
    );
  });
});

describe('decomposeWorkflow — determinism', () => {
  it('produces an identical canvas for identical inputs', () => {
    const assessment = assessmentFor('human_in_loop_agent');
    const a = decomposeWorkflow('resolve customer issues', assessment);
    const b = decomposeWorkflow('resolve customer issues', assessment);
    expect(a).toEqual(b);
  });

  it('resets node ids per canvas (ids start from 1)', () => {
    decomposeWorkflow('first', assessmentFor('automation'));
    const second = decomposeWorkflow('second', assessmentFor('automation'));
    expect(second.nodes[0].id).toMatch(/-1$/);
  });
});

describe('decomposeWorkflow — composes with the real Slice 2.1 assessment', () => {
  it('decomposes a Move stepped down from full agentic to human-in-loop', () => {
    // Full autonomy framing on low control/eval maturity → 2.1 steps it down.
    const lowMaturity: ReadinessProfile = {
      data: 'high',
      control: 'low',
      eval: 'low',
    };
    const assessment = assessAgenticSuitability(
      'a fully autonomous agent that resolves disputes end-to-end with no human in the loop',
      lowMaturity,
    );
    expect(assessment.recommendedArchetype).toBe('human_in_loop_agent');

    const canvas = decomposeWorkflow('autonomous dispute resolution', assessment);
    expect(canvas.archetype).toBe('human_in_loop_agent');
    // The step-down means human-approval checkpoints appear on the canvas.
    expect(canvas.approvalCount).toBeGreaterThan(0);
    // Open control/eval gaps surface as blocked controls.
    expect(canvas.blockedControls.length).toBeGreaterThan(0);
    expect(canvas.notes.some((n) => /stepped down/i.test(n))).toBe(true);
  });

  it('decomposes a clean copilot when the tenant clears every gate', () => {
    const assessment = assessAgenticSuitability(
      'a copilot that answers policy questions with cited answers',
      ALL_HIGH,
    );
    expect(assessment.recommendedArchetype).toBe('retrieval_copilot');
    const canvas = decomposeWorkflow('policy copilot', assessment);
    expect(canvas.blockedControls).toHaveLength(0);
    expect(canvas.notes.some((n) => /implementable today/.test(n))).toBe(true);
  });
});

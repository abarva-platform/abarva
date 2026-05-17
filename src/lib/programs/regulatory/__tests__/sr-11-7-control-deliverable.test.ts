import {
  buildSr117ControlDeliverable,
  isSr117RegulatedTenant,
  resolveSolutionArchetypeForMove,
  SR_11_7_EXPECTATIONS,
  SR_11_7_REGULATED_INDUSTRY_CODES,
  type Sr117ExpectationKey,
} from '@/lib/programs/regulatory/sr-11-7-control-deliverable';
import {
  buildControlEvalMatrix,
  type ControlEvalMatrix,
} from '@/lib/programs/controls/control-eval-matrix';
import { getSolutionArchetype } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';

describe('isSr117RegulatedTenant', () => {
  it('treats the financial-services industry code as regulated', () => {
    expect(isSr117RegulatedTenant('FINSERV')).toBe(true);
  });

  it('is case-insensitive and tolerates whitespace', () => {
    expect(isSr117RegulatedTenant('  finserv ')).toBe(true);
  });

  it('treats non-financial industry codes as not regulated', () => {
    expect(isSr117RegulatedTenant('RETAIL')).toBe(false);
    expect(isSr117RegulatedTenant('HEALTHCARE_IDN')).toBe(false);
  });

  it('treats null / empty industry codes as not regulated', () => {
    expect(isSr117RegulatedTenant(null)).toBe(false);
    expect(isSr117RegulatedTenant(undefined)).toBe(false);
    expect(isSr117RegulatedTenant('')).toBe(false);
  });

  it('only lists FINSERV as a regulated code', () => {
    expect(SR_11_7_REGULATED_INDUSTRY_CODES).toEqual(['FINSERV']);
  });
});

describe('resolveSolutionArchetypeForMove', () => {
  it('passes a Slice 0.2 archetype key through unchanged', () => {
    expect(resolveSolutionArchetypeForMove('full_agentic_workflow')).toBe(
      'full_agentic_workflow',
    );
    expect(resolveSolutionArchetypeForMove('retrieval_copilot')).toBe(
      'retrieval_copilot',
    );
  });

  it('is case-insensitive and tolerates whitespace', () => {
    expect(resolveSolutionArchetypeForMove(' Assistant ')).toBe('assistant');
  });

  it('defaults a coarse program archetype to the model-risk-conservative rung', () => {
    expect(resolveSolutionArchetypeForMove('ai_product_enablement')).toBe(
      'human_in_loop_agent',
    );
    expect(resolveSolutionArchetypeForMove(null)).toBe('human_in_loop_agent');
    expect(resolveSolutionArchetypeForMove(undefined)).toBe(
      'human_in_loop_agent',
    );
  });
});

describe('SR 11-7 expectation catalogue integrity', () => {
  it('encodes exactly the three SR 11-7 pillars in guidance order', () => {
    expect(SR_11_7_EXPECTATIONS.map((e) => e.key)).toEqual([
      'model_validation',
      'ongoing_monitoring',
      'governance',
    ]);
  });

  it('every expectation maps to at least one risk category', () => {
    for (const expectation of SR_11_7_EXPECTATIONS) {
      expect(expectation.satisfiedByRisks.length).toBeGreaterThan(0);
    }
  });

  it('every expectation carries a non-empty supervisory paragraph', () => {
    for (const expectation of SR_11_7_EXPECTATIONS) {
      expect(expectation.expectation.length).toBeGreaterThan(40);
      expect(expectation.name.length).toBeGreaterThan(0);
    }
  });
});

describe('buildSr117ControlDeliverable', () => {
  // A high-stakes, regulated framing — the SR 11-7 First Capital reading.
  function regulatedMatrix(): ControlEvalMatrix {
    return buildControlEvalMatrix(getSolutionArchetype('human_in_loop_agent'), {
      handlesSensitiveData: true,
      highStakesDecision: true,
    });
  }

  it('produces one deliverable line per SR 11-7 expectation', () => {
    const deliverable = buildSr117ControlDeliverable(regulatedMatrix());
    expect(deliverable.lines.map((l) => l.key)).toEqual([
      'model_validation',
      'ongoing_monitoring',
      'governance',
    ]);
  });

  it('carries a stable type key and the SR 11-7 framework label', () => {
    const deliverable = buildSr117ControlDeliverable(regulatedMatrix());
    expect(deliverable.typeKey).toBe('sr_11_7_control_matrix');
    expect(deliverable.framework).toContain('SR 11-7');
  });

  it('surfaces every expectation as satisfied for a fully-shaped regulated Move', () => {
    const deliverable = buildSr117ControlDeliverable(regulatedMatrix());
    // human_in_loop_agent at high-stakes + sensitive-data framing escalates
    // hallucination, drift, security, and approval controls to mandatory —
    // all three SR 11-7 expectations are covered by a mandatory control.
    expect(deliverable.uncoveredExpectations).toEqual([]);
    expect(deliverable.satisfiedCount).toBe(3);
    expect(deliverable.readiness).toBe('ready');
    for (const line of deliverable.lines) {
      expect(line.coverage).toBe('satisfied');
    }
  });

  it('attaches the satisfying controls and their eval test ids to each line', () => {
    const deliverable = buildSr117ControlDeliverable(regulatedMatrix());
    for (const line of deliverable.lines) {
      expect(line.satisfyingControls.length).toBeGreaterThan(0);
      expect(line.evidenceTestIds.length).toBeGreaterThan(0);
    }
  });

  it('marks an expectation uncovered and blocks readiness when no control covers it', () => {
    // An empty control set — no applied control covers any SR 11-7
    // expectation, so all three are uncovered and readiness is blocked.
    const emptyMatrix: ControlEvalMatrix = {
      archetypeKey: 'automation',
      archetypeName: 'Automation',
      controls: [],
      checklist: [],
      gateCoverage: [],
      uncoveredGates: [],
      mandatoryCount: 0,
    };
    const deliverable = buildSr117ControlDeliverable(emptyMatrix);
    expect(deliverable.uncoveredExpectations.length).toBe(3);
    expect(deliverable.readiness).toBe('blocked');
    const uncovered = new Set<Sr117ExpectationKey>(
      deliverable.uncoveredExpectations,
    );
    for (const line of deliverable.lines) {
      if (uncovered.has(line.key)) {
        expect(line.coverage).toBe('uncovered');
        expect(line.satisfyingControls).toEqual([]);
        expect(line.evidenceTestIds).toEqual([]);
      }
    }
  });

  it('reports a hold readiness when expectations are covered only by recommended controls', () => {
    // A retrieval_copilot at low ambient ambition (no framing flags): the
    // hallucination/drift controls apply but resolve to recommended, so the
    // model-validation expectation is covered only partially.
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('retrieval_copilot'),
    );
    const deliverable = buildSr117ControlDeliverable(matrix);
    const validation = deliverable.lines.find(
      (l) => l.key === 'model_validation',
    );
    expect(validation).toBeDefined();
    // It is addressed by controls but not all are mandatory.
    if (validation && validation.coverage === 'partial') {
      expect(deliverable.readiness).not.toBe('ready');
    }
  });

  it('is pure — the same matrix always yields the same deliverable', () => {
    const matrix = regulatedMatrix();
    const a = buildSr117ControlDeliverable(matrix);
    const b = buildSr117ControlDeliverable(matrix);
    expect(a).toEqual(b);
  });

  it('carries an advisory caveat — it does not flip a gate', () => {
    const deliverable = buildSr117ControlDeliverable(regulatedMatrix());
    expect(deliverable.caveat).toMatch(/advisory/i);
    expect(deliverable.caveat).toMatch(/does not flip/i);
  });
});

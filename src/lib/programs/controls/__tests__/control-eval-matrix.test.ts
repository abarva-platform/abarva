import {
  buildControlEvalMatrix,
  CONTROL_CATALOGUE,
  CONTROL_BY_ID,
  READINESS_GATE_ITEMS,
  type ControlDefinition,
  type ReadinessGateItem,
} from '@/lib/programs/controls/control-eval-matrix';
import {
  getSolutionArchetype,
  SOLUTION_ARCHETYPE_KEYS,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';

describe('control catalogue integrity', () => {
  it('has unique control ids', () => {
    const ids = CONTROL_CATALOGUE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique test ids across the whole catalogue', () => {
    const testIds = CONTROL_CATALOGUE.flatMap((c) =>
      c.tests.map((t) => t.id),
    );
    expect(new Set(testIds).size).toBe(testIds.length);
  });

  it('covers all seven named agentic risks', () => {
    const risks = new Set(CONTROL_CATALOGUE.map((c) => c.risk));
    expect(risks).toEqual(
      new Set([
        'hallucination',
        'phi_pii_exposure',
        'model_drift',
        'adoption_risk',
        'vendor_lock_in',
        'security_review',
        'human_approvals',
      ]),
    );
  });

  it('maps every control to a valid §5 readiness-gate item', () => {
    for (const control of CONTROL_CATALOGUE) {
      expect(READINESS_GATE_ITEMS).toContain(control.gate);
    }
  });

  it('gives every control at least one verification test', () => {
    for (const control of CONTROL_CATALOGUE) {
      expect(control.tests.length).toBeGreaterThan(0);
    }
  });

  it('only references valid archetype keys in appliesTo', () => {
    for (const control of CONTROL_CATALOGUE) {
      for (const key of control.appliesTo) {
        expect(SOLUTION_ARCHETYPE_KEYS).toContain(key);
      }
    }
  });

  it('indexes the catalogue by id', () => {
    expect(Object.keys(CONTROL_BY_ID).length).toBe(CONTROL_CATALOGUE.length);
    expect(CONTROL_BY_ID['ctrl.security.review']?.risk).toBe(
      'security_review',
    );
  });
});

describe('buildControlEvalMatrix — applicability', () => {
  it('applies universal (empty appliesTo) controls to every archetype', () => {
    const universal: ControlDefinition[] = CONTROL_CATALOGUE.filter(
      (c) => c.appliesTo.length === 0,
    );
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const matrix = buildControlEvalMatrix(getSolutionArchetype(key));
      const ids = new Set(matrix.controls.map((c) => c.id));
      for (const u of universal) {
        expect(ids.has(u.id)).toBe(true);
      }
    }
  });

  it('excludes hallucination evals for deterministic automation', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('automation'),
    );
    expect(
      matrix.controls.some((c) => c.id === 'ctrl.hallucination.grounded_output'),
    ).toBe(false);
  });

  it('includes hallucination + approval controls for a full agentic workflow', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('full_agentic_workflow'),
    );
    const ids = matrix.controls.map((c) => c.id);
    expect(ids).toContain('ctrl.hallucination.grounded_output');
    expect(ids).toContain('ctrl.approvals.human_checkpoint');
  });

  it('applies the vendor exit control only to vendor-led implementation', () => {
    const vendor = buildControlEvalMatrix(
      getSolutionArchetype('vendor_led_implementation'),
    );
    expect(
      vendor.controls.some((c) => c.id === 'ctrl.vendor.lock_in_exit'),
    ).toBe(true);

    const assistant = buildControlEvalMatrix(
      getSolutionArchetype('assistant'),
    );
    expect(
      assistant.controls.some((c) => c.id === 'ctrl.vendor.lock_in_exit'),
    ).toBe(false);
  });
});

describe('buildControlEvalMatrix — enforcement resolution', () => {
  it('escalates a recommended control to mandatory above the ambition threshold', () => {
    // human_in_loop_agent ambition is high enough for the kill switch
    // (mandatoryAtAmbition 3) to be mandatory.
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('full_agentic_workflow'),
    );
    const killSwitch = matrix.controls.find(
      (c) => c.id === 'ctrl.approvals.kill_switch',
    );
    expect(killSwitch?.enforcement).toBe('mandatory');
  });

  it('makes PHI/PII + security controls mandatory when handlesSensitiveData', () => {
    const matrix = buildControlEvalMatrix(getSolutionArchetype('assistant'), {
      handlesSensitiveData: true,
    });
    const privacy = matrix.controls.find(
      (c) => c.id === 'ctrl.phi_pii.data_minimization',
    );
    const security = matrix.controls.find(
      (c) => c.id === 'ctrl.security.review',
    );
    expect(privacy?.enforcement).toBe('mandatory');
    expect(security?.enforcement).toBe('mandatory');
  });

  it('makes the vendor exit control mandatory when vendorDelivered', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('vendor_led_implementation'),
      { vendorDelivered: true },
    );
    const vendor = matrix.controls.find(
      (c) => c.id === 'ctrl.vendor.lock_in_exit',
    );
    expect(vendor?.enforcement).toBe('mandatory');
  });

  it('makes approval controls mandatory for a high-stakes decision', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('human_in_loop_agent'),
      { highStakesDecision: true },
    );
    for (const c of matrix.controls.filter(
      (x) => x.risk === 'human_approvals',
    )) {
      expect(c.enforcement).toBe('mandatory');
    }
  });
});

describe('buildControlEvalMatrix — checklist and gate coverage', () => {
  it('emits one checklist line per control test', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('retrieval_copilot'),
    );
    const expected = matrix.controls.reduce(
      (n, c) => n + c.tests.length,
      0,
    );
    expect(matrix.checklist.length).toBe(expected);
  });

  it('marks checklist lines from mandatory controls as blocking', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('full_agentic_workflow'),
    );
    for (const line of matrix.checklist) {
      const control = matrix.controls.find((c) => c.id === line.controlId);
      expect(line.blocking).toBe(control?.enforcement === 'mandatory');
    }
  });

  it('reports gate coverage for all ten §5 gate items', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('full_agentic_workflow'),
    );
    expect(matrix.gateCoverage.length).toBe(READINESS_GATE_ITEMS.length);
    const gates = matrix.gateCoverage.map((g) => g.gate);
    expect(new Set(gates)).toEqual(new Set(READINESS_GATE_ITEMS));
  });

  it('lists uncovered gates consistently with gateCoverage', () => {
    const matrix = buildControlEvalMatrix(getSolutionArchetype('automation'));
    const uncovered = matrix.gateCoverage
      .filter((g) => !g.covered)
      .map((g) => g.gate);
    expect(matrix.uncoveredGates).toEqual(uncovered);
  });

  it('counts mandatory controls correctly', () => {
    const matrix = buildControlEvalMatrix(
      getSolutionArchetype('full_agentic_workflow'),
      { handlesSensitiveData: true, highStakesDecision: true },
    );
    const counted = matrix.controls.filter(
      (c) => c.enforcement === 'mandatory',
    ).length;
    expect(matrix.mandatoryCount).toBe(counted);
  });

  it('is pure — repeated builds yield deeply equal matrices', () => {
    const a = buildControlEvalMatrix(getSolutionArchetype('assistant'), {
      handlesSensitiveData: true,
    });
    const b = buildControlEvalMatrix(getSolutionArchetype('assistant'), {
      handlesSensitiveData: true,
    });
    expect(a).toEqual(b);
  });

  it('produces a non-empty matrix for every archetype', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const matrix = buildControlEvalMatrix(getSolutionArchetype(key));
      expect(matrix.controls.length).toBeGreaterThan(0);
      expect(matrix.checklist.length).toBeGreaterThan(0);
      const gate: ReadinessGateItem = 'accountable_owner';
      // The named-owner control is universal — every Move must cover it.
      expect(
        matrix.gateCoverage.find((g) => g.gate === gate)?.controlCount,
      ).toBeGreaterThan(0);
    }
  });
});

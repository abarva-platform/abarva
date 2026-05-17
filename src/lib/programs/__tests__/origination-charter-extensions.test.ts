// Wave 2 charter-extensions adapter tests — wiring of Slices 2.2 / 2.3 / 2.5
// into the Moves origination charter, composed from the Slice 2.1 result.

import { assessOriginationBrief } from '@/lib/programs/suitability/origination-suitability';
import { originationCharterExtensions } from '../origination-charter-extensions';

const SUITABILITY = assessOriginationBrief({
  programName: 'Policy Copilot',
  problemStatement:
    'Let staff ask questions about payer policies and get cited answers.',
});

describe('originationCharterExtensions', () => {
  it('produces all three Wave 2 charter fragments from one suitability result', () => {
    const ext = originationCharterExtensions(SUITABILITY);
    expect(ext.workflow_decomposition).toBeDefined();
    expect(ext.solution_architecture).toBeDefined();
    expect(ext.control_eval_matrix).toBeDefined();
  });

  it('Slice 2.2 — workflow decomposition fragment is stable and versioned', () => {
    const f = originationCharterExtensions(SUITABILITY).workflow_decomposition;
    expect(f.version).toBe(1);
    expect(typeof f.archetype).toBe('string');
    expect(Array.isArray(f.nodes)).toBe(true);
    expect((f.nodes as unknown[]).length).toBe(f.node_count);
    expect(Array.isArray(f.blocked_controls)).toBe(true);
    expect(Array.isArray(f.notes)).toBe(true);
  });

  it('Slice 2.3 — solution architecture fragment is stable and versioned', () => {
    const f = originationCharterExtensions(SUITABILITY).solution_architecture;
    expect(f.version).toBe(1);
    expect(typeof f.recommended_option_id).toBe('string');
    expect(Array.isArray(f.options)).toBe(true);
    expect((f.options as unknown[]).length).toBeGreaterThan(0);
    expect(Array.isArray(f.open_component_gaps)).toBe(true);
  });

  it('Slice 2.5 — control & eval matrix fragment is stable and versioned', () => {
    const f = originationCharterExtensions(SUITABILITY).control_eval_matrix;
    expect(f.version).toBe(1);
    expect(typeof f.archetype_key).toBe('string');
    expect(Array.isArray(f.controls)).toBe(true);
    expect(Array.isArray(f.checklist)).toBe(true);
    expect(Array.isArray(f.gate_coverage)).toBe(true);
    expect(typeof f.mandatory_count).toBe('number');
  });

  it('every fragment archetype agrees with the 2.1 recommendation', () => {
    const ext = originationCharterExtensions(SUITABILITY);
    const recommended = SUITABILITY.assessment.recommendedArchetype;
    expect(ext.workflow_decomposition.archetype).toBe(recommended);
    expect(ext.solution_architecture.archetype).toBe(recommended);
    expect(ext.control_eval_matrix.archetype_key).toBe(recommended);
  });

  it('is deterministic — same brief yields identical fragments', () => {
    const a = originationCharterExtensions(SUITABILITY);
    const b = originationCharterExtensions(SUITABILITY);
    // derived_at differs by clock; compare the structural payloads.
    const strip = (f: Record<string, unknown>) => {
      const rest = { ...f };
      delete rest.derived_at;
      return rest;
    };
    expect(strip(a.workflow_decomposition)).toEqual(
      strip(b.workflow_decomposition),
    );
    expect(strip(a.solution_architecture)).toEqual(
      strip(b.solution_architecture),
    );
    expect(strip(a.control_eval_matrix)).toEqual(strip(b.control_eval_matrix));
  });
});

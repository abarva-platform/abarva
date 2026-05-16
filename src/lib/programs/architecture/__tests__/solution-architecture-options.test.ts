// Slice 2.3 · solution-architecture options builder tests.
//
// Golden-answer + behaviour tests for `buildSolutionArchitectureOptions`:
// the pure builder must turn a shaped Move (recommended archetype + tenant
// readiness) into 2-3 solution-architecture options, each scored against the
// methodology §4 reference architecture's eight components.

import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';
import { SOLUTION_ARCHETYPE_KEYS } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import {
  buildSolutionArchitectureOptions,
  REFERENCE_COMPONENTS,
  REFERENCE_COMPONENT_LABEL,
  type SolutionArchitectureOption,
} from '../solution-architecture-options';

const HIGH: ReadinessProfile = { data: 'high', control: 'high', eval: 'high' };
const LOW: ReadinessProfile = { data: 'low', control: 'low', eval: 'low' };
const MIXED: ReadinessProfile = {
  data: 'moderate',
  control: 'low',
  eval: 'none',
};

describe('buildSolutionArchitectureOptions — option set shape', () => {
  it('produces 2-3 options for every archetype', () => {
    for (const archetype of SOLUTION_ARCHETYPE_KEYS) {
      const result = buildSolutionArchitectureOptions({
        recommendedArchetype: archetype,
        readiness: HIGH,
      });
      expect(result.options.length).toBeGreaterThanOrEqual(2);
      expect(result.options.length).toBeLessThanOrEqual(3);
      expect(result.archetype).toBe(archetype);
    }
  });

  it('gives options ambition-ascending and stable ids', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: HIGH,
    });
    expect(result.options.map((o) => o.id)).toEqual([
      'opt-retrieval-copilot',
      'opt-human-in-loop-agent',
      'opt-full-agentic-workflow',
    ]);
  });

  it('recommends an option that is in the option set', () => {
    for (const archetype of SOLUTION_ARCHETYPE_KEYS) {
      const result = buildSolutionArchitectureOptions({
        recommendedArchetype: archetype,
        readiness: MIXED,
      });
      const ids = result.options.map((o) => o.id);
      expect(ids).toContain(result.recommendedOptionId);
    }
  });

  it('is deterministic — same input yields identical output', () => {
    const input = {
      recommendedArchetype: 'full_agentic_workflow' as const,
      readiness: MIXED,
    };
    expect(buildSolutionArchitectureOptions(input)).toEqual(
      buildSolutionArchitectureOptions(input),
    );
  });

  it('ignores proposedMove for branching (contract stays stable)', () => {
    const base = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: HIGH,
    });
    const withText = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: HIGH,
      proposedMove: 'Resolve tier-1 tickets with supervisor approval.',
    });
    expect(withText).toEqual(base);
  });
});

describe('every option is fully specified', () => {
  const allOptions: SolutionArchitectureOption[] = SOLUTION_ARCHETYPE_KEYS.flatMap(
    (archetype) =>
      buildSolutionArchitectureOptions({
        recommendedArchetype: archetype,
        readiness: HIGH,
      }).options,
  );

  it('names data sources, tools, gateway, audit, security, integration', () => {
    for (const o of allOptions) {
      expect(o.dataSources.length).toBeGreaterThan(0);
      expect(o.tools.length).toBeGreaterThan(0);
      expect(o.modelGateway).not.toHaveLength(0);
      expect(o.audit).not.toHaveLength(0);
      expect(o.security).not.toHaveLength(0);
      expect(o.integrationNeeds.length).toBeGreaterThan(0);
      expect(o.tradeOffs.length).toBeGreaterThan(0);
    }
  });

  it('scores every §4 reference-architecture component exactly once', () => {
    for (const o of allOptions) {
      const components = o.componentCoverage.map((c) => c.component).sort();
      expect(components).toEqual([...REFERENCE_COMPONENTS].sort());
      for (const c of o.componentCoverage) {
        expect(c.note).not.toHaveLength(0);
      }
    }
  });
});

describe('§4 reference-architecture scoring', () => {
  it('scores every component native at high readiness — productionShaped', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: HIGH,
    });
    for (const o of result.options) {
      expect(o.componentCoverage.every((c) => c.coverage === 'native')).toBe(
        true,
      );
      expect(o.referenceScore).toBe(100);
      expect(o.productionShaped).toBe(true);
    }
  });

  it('downgrades grounding / evals / guardrails at low readiness', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: LOW,
    });
    const agent = result.options.find(
      (o) => o.shape === 'human_in_loop_agent',
    )!;
    const coverageOf = (c: string) =>
      agent.componentCoverage.find((x) => x.component === c)!.coverage;
    expect(coverageOf('grounding_context')).toBe('partial');
    expect(coverageOf('guardrails')).toBe('partial');
    expect(coverageOf('evals')).toBe('partial');
    // Broker boundary, observability and lifecycle are always native.
    expect(coverageOf('broker_boundary')).toBe('native');
    expect(coverageOf('observability')).toBe('native');
    expect(coverageOf('lifecycle_versioning')).toBe('native');
    expect(agent.referenceScore).toBeLessThan(100);
    expect(agent.productionShaped).toBe(false);
  });

  it('partial coverage earns half credit in the reference score', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'full_agentic_workflow',
      readiness: LOW,
    });
    for (const o of result.options) {
      const native = o.componentCoverage.filter(
        (c) => c.coverage === 'native',
      ).length;
      const partial = o.componentCoverage.filter(
        (c) => c.coverage === 'partial',
      ).length;
      const expected = Math.round(
        ((native + partial * 0.5) / o.componentCoverage.length) * 100,
      );
      expect(o.referenceScore).toBe(expected);
    }
  });
});

describe('recommendation discipline', () => {
  it('recommends the most ambitious production-shaped option at high readiness', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: HIGH,
    });
    // All options are production-shaped, so the most ambitious offered wins.
    expect(result.recommendedOptionId).toBe('opt-full-agentic-workflow');
    expect(result.openComponentGaps).toHaveLength(0);
  });

  it('surfaces open §4 component gaps when readiness is weak', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'full_agentic_workflow',
      readiness: LOW,
    });
    expect(result.openComponentGaps.length).toBeGreaterThan(0);
    const recommended = result.options.find(
      (o) => o.id === result.recommendedOptionId,
    )!;
    expect(recommended.productionShaped).toBe(false);
    // Every open gap is a real §4 component.
    for (const g of result.openComponentGaps) {
      expect(REFERENCE_COMPONENTS).toContain(g);
      expect(REFERENCE_COMPONENT_LABEL[g]).not.toHaveLength(0);
    }
  });

  it('explains the recommendation with readiness-grounded reasons', () => {
    const result = buildSolutionArchitectureOptions({
      recommendedArchetype: 'human_in_loop_agent',
      readiness: MIXED,
    });
    expect(result.reasons.length).toBeGreaterThan(1);
    // A weak control / eval profile must be named in the reasons.
    const joined = result.reasons.join(' ');
    expect(joined).toMatch(/control \/ guardrail|eval \/ regression/);
  });
});

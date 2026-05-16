// Slice 2.1 · agentic suitability classifier — fixture-driven acceptance.
//
// The Slice 0.2 fixtures ARE the contract: `assessAgenticSuitability` must
// reproduce every fixture's expected archetype and readiness gaps from the
// proposed-Move free text + the tenant readiness profile alone.

import { ARCHETYPE_FIXTURES } from '@/lib/programs/taxonomy/archetype-fixtures';
import { getSolutionArchetype } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import {
  assessAgenticSuitability,
  intendedArchetypeFor,
} from '../agentic-suitability';

describe('assessAgenticSuitability — Slice 0.2 fixture contract', () => {
  for (const fx of ARCHETYPE_FIXTURES) {
    describe(fx.id, () => {
      const result = assessAgenticSuitability(fx.proposedMove, fx.readiness);

      it('recommends the expected archetype', () => {
        expect(result.recommendedArchetype).toBe(fx.expectedArchetype);
      });

      it('reports the expected readiness gaps (dimension / current / required)', () => {
        const got = result.readinessGaps
          .map((g) => ({ dimension: g.dimension, current: g.current, required: g.required }))
          .sort((a, b) => a.dimension.localeCompare(b.dimension));
        const want = fx.expectedReadinessGaps
          .map((g) => ({ dimension: g.dimension, current: g.current, required: g.required }))
          .sort((a, b) => a.dimension.localeCompare(b.dimension));
        expect(got).toEqual(want);
      });

      it('surfaces a non-empty practitioner rationale', () => {
        expect(result.reasons.length).toBeGreaterThan(0);
        for (const reason of result.reasons) {
          expect(reason.trim().length).toBeGreaterThan(0);
        }
      });

      it('produces a 0–100 readiness score consistent with the gaps', () => {
        expect(result.readinessScore).toBeGreaterThanOrEqual(0);
        expect(result.readinessScore).toBeLessThanOrEqual(100);
        if (result.readinessGaps.length === 0 && result.recommendedArchetype === fx.expectedArchetype) {
          // The recommended archetype's own gates are fully met.
          const gaps = getSolutionArchetype(result.recommendedArchetype).readinessGates;
          if (gaps.length > 0 && !result.steppedDown) {
            expect(result.readinessScore).toBe(100);
          }
        }
      });

      it('when a temptingButWrong pick is declared, the classifier corrects it', () => {
        if (!fx.temptingButWrong) {
          expect(result.steppedDown).toBe(false);
          return;
        }
        // The classifier recommends the expert pick, not the demo pick.
        expect(result.recommendedArchetype).toBe(fx.expectedArchetype);
        expect(result.recommendedArchetype).not.toBe(fx.temptingButWrong.archetype);
      });
    });
  }

  it('passes 100% of the Slice 0.2 fixtures', () => {
    const pass = ARCHETYPE_FIXTURES.filter(
      (fx) =>
        assessAgenticSuitability(fx.proposedMove, fx.readiness).recommendedArchetype ===
        fx.expectedArchetype,
    );
    expect(pass).toHaveLength(ARCHETYPE_FIXTURES.length);
  });
});

describe('assessAgenticSuitability — overbuild guardrail', () => {
  it('steps a full agentic workflow down to a human-in-loop agent when the gate is unmet', () => {
    const result = assessAgenticSuitability(
      'Stand up a fully autonomous agent that runs the workflow with no human in the loop.',
      { data: 'moderate', control: 'low', eval: 'low' },
    );
    expect(result.intendedArchetype).toBe('full_agentic_workflow');
    expect(result.recommendedArchetype).toBe('human_in_loop_agent');
    expect(result.steppedDown).toBe(true);
    expect(result.antiPatternCode).toBe('full_agentic_on_low_data_readiness');
    expect(result.readinessGaps.length).toBeGreaterThan(0);
  });

  it('does not step down when the full-workflow gate is fully met', () => {
    const result = assessAgenticSuitability(
      'Promote the agent to run ticket resolution autonomously, supervised by exception.',
      { data: 'high', control: 'high', eval: 'high' },
    );
    expect(result.recommendedArchetype).toBe('full_agentic_workflow');
    expect(result.steppedDown).toBe(false);
    expect(result.readinessScore).toBe(100);
  });

  it('reroutes a grounded copilot with no corpus to data remediation', () => {
    const result = assessAgenticSuitability(
      'Give advisors a copilot that answers questions about client holdings.',
      { data: 'none', control: 'moderate', eval: 'low' },
    );
    expect(result.recommendedArchetype).toBe('data_remediation');
    expect(result.steppedDown).toBe(true);
    expect(result.readinessGaps).toEqual([
      expect.objectContaining({ dimension: 'data', current: 'none', required: 'high' }),
    ]);
  });
});

describe('intendedArchetypeFor — intent extraction', () => {
  it('reads explicit full autonomy as a full agentic workflow', () => {
    expect(
      intendedArchetypeFor('a fully autonomous agent with no human in the loop'),
    ).toBe('full_agentic_workflow');
  });

  it('reads "instead of building" as a vendor-led implementation', () => {
    expect(
      intendedArchetypeFor('adopt an ambient scribe instead of building one in-house'),
    ).toBe('vendor_led_implementation');
  });

  it('reads "exactly as it runs today" as process redesign', () => {
    expect(
      intendedArchetypeFor('automate the current 14-step process exactly as it runs today'),
    ).toBe('process_redesign');
  });

  it('reads cited Q&A as a retrieval copilot', () => {
    expect(
      intendedArchetypeFor('let staff ask questions about policies and get cited answers'),
    ).toBe('retrieval_copilot');
  });

  it('reads a bare drafting helper as an assistant', () => {
    expect(intendedArchetypeFor('help managers draft weekly updates faster')).toBe('assistant');
  });
});

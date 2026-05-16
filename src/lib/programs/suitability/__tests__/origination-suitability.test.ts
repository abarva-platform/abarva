// Slice 2.1 · origination ↔ suitability adapter tests.

import type { ReadinessDimensionInput } from '@/lib/workflow/dataReadiness';
import {
  assessOriginationBrief,
  readinessProfileFromLedger,
  suitabilityCharterFragment,
} from '../origination-suitability';

const READY_LEDGER: ReadinessDimensionInput[] = [
  { dimension: 'availability', status: 'ready', owner: 'A', note: 'sources accessible and current' },
  { dimension: 'quality', status: 'ready', owner: 'A', note: 'schema-conformant and fresh data' },
  { dimension: 'governance', status: 'ready', owner: 'B', note: 'contracts and access controls in place' },
  { dimension: 'skills', status: 'ready', owner: 'B', note: 'data engineers and stewards staffed' },
  { dimension: 'integration', status: 'ready', owner: 'C', note: 'production-grade pipelines live' },
];

describe('readinessProfileFromLedger', () => {
  it('maps a fully-ready ledger to high maturity on every dimension', () => {
    expect(readinessProfileFromLedger(READY_LEDGER)).toEqual({
      data: 'high',
      control: 'high',
      eval: 'high',
    });
  });

  it('maps a blocked dimension down toward absent maturity', () => {
    const ledger = READY_LEDGER.map((d) =>
      d.dimension === 'availability' ? { ...d, status: 'blocked' as const } : d,
    );
    // availability=none(0), quality=high(3) → mean 1.5 → round → moderate(2)
    expect(readinessProfileFromLedger(ledger).data).toBe('moderate');
  });

  it('defaults missing dimensions to low maturity', () => {
    expect(readinessProfileFromLedger([])).toEqual({
      data: 'low',
      control: 'low',
      eval: 'low',
    });
  });
});

describe('assessOriginationBrief', () => {
  it('runs end to end with no readiness ledger (conservative defaults)', () => {
    const result = assessOriginationBrief({
      programName: 'Merchandising Assistant',
      problemStatement: 'Help copywriters draft product descriptions faster.',
    });
    expect(result.assessment.recommendedArchetype).toBe('assistant');
    expect(result.readiness).toEqual({ data: 'low', control: 'low', eval: 'low' });
  });

  it('recommends a full agentic workflow when brief and ledger both clear the bar', () => {
    const result = assessOriginationBrief(
      {
        programName: 'Autonomous Ticket Agent',
        problemStatement:
          'Promote the supervised agent to run ticket resolution autonomously, supervised by exception.',
      },
      READY_LEDGER,
    );
    expect(result.assessment.recommendedArchetype).toBe('full_agentic_workflow');
    expect(result.assessment.steppedDown).toBe(false);
  });

  it('steps a thin-readiness autonomous ask down rather than overbuilding', () => {
    const thin = READY_LEDGER.map((d) =>
      d.dimension === 'governance' || d.dimension === 'skills' || d.dimension === 'integration'
        ? { ...d, status: 'blocked' as const }
        : d,
    );
    const result = assessOriginationBrief(
      {
        programName: 'Autonomous PA Agent',
        problemStatement:
          'Stand up a fully autonomous agent that runs prior-auth with no human in the loop.',
      },
      thin,
    );
    expect(result.assessment.steppedDown).toBe(true);
    expect(result.assessment.recommendedArchetype).not.toBe('full_agentic_workflow');
  });
});

describe('suitabilityCharterFragment', () => {
  it('serializes a stable, versioned charter fragment', () => {
    const result = assessOriginationBrief({
      programName: 'Policy Copilot',
      problemStatement: 'Let staff ask questions about payer policies and get cited answers.',
    });
    const fragment = suitabilityCharterFragment(result);
    expect(fragment.version).toBe(1);
    expect(typeof fragment.recommended_archetype).toBe('string');
    expect(Array.isArray(fragment.readiness_gaps)).toBe(true);
    expect(Array.isArray(fragment.reasons)).toBe(true);
    expect(fragment.readiness_profile).toEqual(result.readiness);
  });
});

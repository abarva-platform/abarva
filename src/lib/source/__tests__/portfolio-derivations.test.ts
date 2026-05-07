import {
  deriveBlockerLine,
  deriveValuePosture,
  formatStageEntered,
  formatValuePosture,
  leadAgentForStage,
  stageIndex,
  stageStepCount,
} from '../portfolio-derivations';
import type { SourcingEventSummary } from '../types';

function makeEvent(overrides: Partial<SourcingEventSummary> = {}): SourcingEventSummary {
  return {
    id: 'evt-1',
    code: 'SRC-APX-001',
    name: 'AMS Outsourcing 2026',
    accountName: 'Apex Retail Group',
    leadAgent: 'Sentinel',
    archetype: 'Managed Service',
    rigor: 'standard',
    status: 'active',
    statusLabel: 'Active',
    priority: 'medium',
    currentStageKey: 'scope',
    currentStageLabel: 'Scope',
    openAlerts: 0,
    owner: 'Maya Desai',
    agingDays: 4,
    blocker: null,
    nextAction: 'Run scope cycle',
    isAtRisk: false,
    valueAtStakeUsd: 10_000_000,
    projectedValueUsd: 10_000_000,
    realizedValueUsd: 0,
    nextDecision: 'Lock scope memo',
    ...overrides,
  };
}

describe('leadAgentForStage', () => {
  it('returns the canonical lead agent per stage', () => {
    expect(leadAgentForStage('strategy')).toBe('Atlas');
    expect(leadAgentForStage('scope')).toBe('Nexus');
    expect(leadAgentForStage('rfp')).toBe('Nexus');
    expect(leadAgentForStage('responses')).toBe('Sentinel');
    expect(leadAgentForStage('evaluation')).toBe('Steward');
    expect(leadAgentForStage('pricing')).toBe('Sentinel');
    expect(leadAgentForStage('bafo')).toBe('Nexus');
    expect(leadAgentForStage('executive_decision')).toBe('Atlas');
    expect(leadAgentForStage('selection')).toBe('Steward');
    expect(leadAgentForStage('transition')).toBe('Nexus');
    expect(leadAgentForStage('value')).toBe('Atlas');
  });

  it('routes legacy stage aliases to the canonical leader', () => {
    expect(leadAgentForStage('intake')).toBe('Atlas');
    expect(leadAgentForStage('vendor_responses')).toBe('Sentinel');
    expect(leadAgentForStage('orals_bafo')).toBe('Nexus');
    expect(leadAgentForStage('value_realization')).toBe('Atlas');
  });
});

describe('deriveBlockerLine', () => {
  it('returns null when no blocker and not at risk', () => {
    expect(deriveBlockerLine(makeEvent())).toBeNull();
  });

  it('formats blocker with the stage lead agent', () => {
    const result = deriveBlockerLine(
      makeEvent({
        currentStageKey: 'scope',
        blocker: 'Ticket history missing from L2/L3 incidents',
      }),
    );
    expect(result).not.toBeNull();
    expect(result?.agent).toBe('Nexus'); // Scope lead
    expect(result?.body).toContain('Ticket history');
  });

  it('falls through to nextDecision when at risk without explicit blocker', () => {
    const result = deriveBlockerLine(
      makeEvent({ isAtRisk: true, blocker: null, nextDecision: 'Re-baseline scorecard' }),
    );
    expect(result?.body).toBe('Re-baseline scorecard');
  });

  it('uses the right agent for evaluation-stage blockers', () => {
    const result = deriveBlockerLine(
      makeEvent({ currentStageKey: 'evaluation', blocker: 'EA weight dispute' }),
    );
    expect(result?.agent).toBe('Steward');
  });
});

describe('deriveValuePosture', () => {
  it('returns null for zero or invalid values', () => {
    expect(deriveValuePosture(makeEvent({ valueAtStakeUsd: 0 }))).toBeNull();
    expect(deriveValuePosture(makeEvent({ valueAtStakeUsd: -1 }))).toBeNull();
  });

  it('derives a ±20% band with isDerivedBand flag set', () => {
    const result = deriveValuePosture(makeEvent({ valueAtStakeUsd: 10_000_000 }));
    expect(result).not.toBeNull();
    expect(result!.low).toBe(8_000_000);
    expect(result!.high).toBe(12_000_000);
    expect(result!.isDerivedBand).toBe(true);
  });
});

describe('formatValuePosture', () => {
  it('formats a band with v2 pending caveat', () => {
    const out = formatValuePosture(
      { low: 8_400_000, high: 14_200_000, isDerivedBand: true },
      true,
    );
    expect(out.primary).toBe('$8.4M – $14.2M');
    expect(out.secondary).toBe('v2 pending');
  });

  it('redacts when financial visibility is off', () => {
    const out = formatValuePosture({ low: 1, high: 2, isDerivedBand: true }, false);
    expect(out.primary).toContain('restricted');
  });

  it('handles a degenerate single-point band', () => {
    const out = formatValuePosture(
      { low: 5_000_000, high: 5_000_000, isDerivedBand: false },
      true,
    );
    expect(out.primary).toBe('$5.0M');
    expect(out.secondary).toBe('projected');
  });

  it('returns a placeholder when posture is null', () => {
    const out = formatValuePosture(null, true);
    expect(out.primary).toBe('—');
  });
});

describe('stageIndex / stageStepCount', () => {
  it('returns 0-indexed canonical position', () => {
    expect(stageIndex('strategy')).toBe(0);
    expect(stageIndex('scope')).toBe(1);
    expect(stageIndex('value')).toBe(10);
  });

  it('resolves legacy aliases', () => {
    expect(stageIndex('intake')).toBe(0);
    expect(stageIndex('value_realization')).toBe(10);
  });

  it('reports 11 total steps', () => {
    expect(stageStepCount()).toBe(11);
  });
});

describe('formatStageEntered', () => {
  it('special-cases zero days', () => {
    expect(formatStageEntered(0)).toBe('entered today');
  });
  it('special-cases one day', () => {
    expect(formatStageEntered(1)).toBe('entered 1 day ago');
  });
  it('uses plural for multi-day', () => {
    expect(formatStageEntered(4)).toBe('entered 4 days ago');
    expect(formatStageEntered(14)).toBe('entered 14 days ago');
  });
  it('clamps negative input', () => {
    expect(formatStageEntered(-3)).toBe('entered today');
  });
});

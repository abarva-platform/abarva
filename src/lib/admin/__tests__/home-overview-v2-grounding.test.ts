/**
 * home-overview-v2 grounding integration · Wave 3 PR-1.
 *
 * Verifies that Section 05 Agent Readiness panel surfaces honest
 * per-agent grounding text when a `capabilityGrounding` rollup is
 * supplied, and falls back to the conservative substrate-only
 * heuristic when it's omitted.  The hard-coded
 *   "Sentinel L3 · others L2"
 * label from before this PR must never reappear in the foot text
 * unless that's the *real* derived state.
 */

import { composeHomeV2Extras } from '../home-overview-v2';
import type { CapabilityGrounding } from '../broker/capability-grounding-broker';

const BASE_INPUT = {
  segments: [],
  programsCount: 4,
  programsP6Count: 0,
  sourceEventsCount: 0,
  sourceEventsAtRiskCount: 0,
  initiativesCount: 4,
  initiativesAtRiskCount: 0,
  lastIngestedAt: '2026-05-30T00:00:00Z',
} as const;

function grounding(overrides: Partial<CapabilityGrounding> = {}): CapabilityGrounding {
  return {
    perAgent: [
      {
        agent: 'nexus',
        highestLevel: 'L2',
        averageLevel: 'L1',
        families: [],
      },
      {
        agent: 'sentinel',
        highestLevel: 'L3',
        averageLevel: 'L3',
        families: [],
      },
      {
        agent: 'steward',
        highestLevel: 'L2',
        averageLevel: 'L2',
        families: [],
      },
      {
        agent: 'atlas',
        highestLevel: 'L1',
        averageLevel: 'L1',
        families: [],
      },
    ],
    refreshedAtIso: '2026-05-30T00:00:00Z',
    evidence: 'estimated',
    ...overrides,
  };
}

describe('home-overview-v2 · panel 05 grounding wiring', () => {
  it('renders live per-agent grounding text when capabilityGrounding is supplied', () => {
    const extras = composeHomeV2Extras({
      ...BASE_INPUT,
      capabilityGrounding: grounding(),
    });
    const panel05 = extras.panels.find((p) => p.num === '05');
    expect(panel05).toBeDefined();
    expect(panel05!.foot).toBe(
      'Sentinel L3 · 3 others avg L1 · estimated',
    );
    expect(panel05!.status).toBe('ready');
  });

  it('falls back to a conservative substrate-only foot when grounding is omitted, still marked estimated', () => {
    const extras = composeHomeV2Extras({
      ...BASE_INPUT,
    });
    const panel05 = extras.panels.find((p) => p.num === '05');
    expect(panel05).toBeDefined();
    // The fallback foot must explicitly say 'estimated' so the
    // surface is never silently claiming live grounding without
    // the broker (verdict §3 honesty doctrine).
    expect(panel05!.foot).toMatch(/estimated$/);
    expect(panel05!.foot).toMatch(/Sentinel L[023]/);
  });
});

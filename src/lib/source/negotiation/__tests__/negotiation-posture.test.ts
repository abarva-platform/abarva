// Slice 1.5 — Tests for the negotiation posture generator.

import { buildNegotiationPosture } from '../negotiation-posture';
import type { NegotiationPostureInput } from '../negotiation-posture-types';
import {
  APEX_AMS_NEGOTIATION_INPUT,
  APEX_AMS_NO_CONTEXT_INPUT,
  APEX_AMS_PROPOSAL_MATRIX,
  APEX_AMS_SHOULD_COST_ESTIMATE,
  APEX_AMS_WEAK_POSITION_INPUT,
} from '../negotiation-posture-fixtures';

const strong = buildNegotiationPosture(APEX_AMS_NEGOTIATION_INPUT);
const weak = buildNegotiationPosture(APEX_AMS_WEAK_POSITION_INPUT);
const bare = buildNegotiationPosture(APEX_AMS_NO_CONTEXT_INPUT);

// ── Shape ────────────────────────────────────────────────────────────────────

describe('negotiation posture — shape', () => {
  it('echoes the deal label and a fixed model version', () => {
    expect(strong.dealLabel).toBe(APEX_AMS_NEGOTIATION_INPUT.dealLabel);
    expect(strong.modelVersion).toBe('1.0');
  });

  it('produces all five posture sections', () => {
    expect(strong.levers.length).toBeGreaterThan(0);
    expect(strong.walkAwayRisks.length).toBeGreaterThan(0);
    expect(strong.concessions.length).toBeGreaterThan(0);
    expect(strong.incumbentLeverage).toBeDefined();
    expect(strong.clauseIssues.length).toBeGreaterThan(0);
  });

  it('caps the levers list at five', () => {
    expect(strong.levers.length).toBeLessThanOrEqual(5);
    expect(weak.levers.length).toBeLessThanOrEqual(5);
  });

  it('uses the supplied generatedAt and falls back when omitted', () => {
    expect(strong.generatedAt).toBe('2026-05-16T00:00:00.000Z');
    const noTimestamp = buildNegotiationPosture({
      dealLabel: 'x',
      shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
      proposalMatrix: APEX_AMS_PROPOSAL_MATRIX,
    });
    expect(noTimestamp.generatedAt).toBe('1970-01-01T00:00:00.000Z');
  });

  it('is deterministic — same input yields the same output', () => {
    const again = buildNegotiationPosture(APEX_AMS_NEGOTIATION_INPUT);
    expect(again).toEqual(strong);
  });
});

// ── Levers ───────────────────────────────────────────────────────────────────

describe('negotiation posture — levers', () => {
  it('always anchors on the modelled should-cost gap', () => {
    const gap = strong.levers.find((l) => l.kind === 'should_cost_gap');
    expect(gap).toBeDefined();
    expect(gap?.estimatedValueUsd).toBeGreaterThan(0);
    expect(gap?.rationale).toContain('hidden iceberg');
  });

  it('ranks levers strongest first', () => {
    const rank = { strong: 0, moderate: 1, weak: 2 } as const;
    for (let i = 1; i < strong.levers.length; i += 1) {
      expect(rank[strong.levers[i].strength]).toBeGreaterThanOrEqual(
        rank[strong.levers[i - 1].strength],
      );
    }
  });

  it('treats a credible alternative as a strong competitive-tension lever', () => {
    const tension = strong.levers.find((l) => l.kind === 'competitive_tension');
    expect(tension?.strength).toBe('strong');
  });

  it('offers a multi-year / reference lever only when the buyer can give it', () => {
    expect(
      strong.levers.some(
        (l) => l.kind === 'multi_year' || l.kind === 'reference_value',
      ),
    ).toBe(true);
    // Weak fixture supplies neither — no such lever appears.
    expect(
      weak.levers.some(
        (l) => l.kind === 'multi_year' || l.kind === 'reference_value',
      ),
    ).toBe(false);
  });

  it('surfaces the consumption-volatility lever from the should-cost model', () => {
    const model = strong.levers.find((l) => l.kind === 'commercial_model');
    expect(model).toBeDefined();
    expect(model?.ask).toMatch(/cap/i);
  });

  it('still produces grounded levers with no commercial context', () => {
    expect(bare.levers.length).toBeGreaterThan(0);
    expect(bare.levers.some((l) => l.kind === 'should_cost_gap')).toBe(true);
    // No buyer-side concessions context → no multi-year/reference lever.
    expect(
      bare.levers.some(
        (l) => l.kind === 'multi_year' || l.kind === 'reference_value',
      ),
    ).toBe(false);
  });
});

// ── Walk-away risks ──────────────────────────────────────────────────────────

describe('negotiation posture — walk-away risks', () => {
  it('flags a budget-ceiling breach as a high-severity risk', () => {
    const breach = weak.walkAwayRisks.find((r) =>
      r.title.includes('budget ceiling'),
    );
    expect(breach).toBeDefined();
    expect(breach?.severity).toBe('high');
  });

  it('does not flag a budget breach when the ceiling comfortably covers TCO', () => {
    // Strong fixture ceiling is $6M, above the modelled should-cost midpoint.
    expect(
      strong.walkAwayRisks.some((r) => r.title.includes('budget ceiling')),
    ).toBe(false);
  });

  it('flags undisclosed proposal terms as a high-severity risk', () => {
    // The Slice 1.4 fixture leaves BlueMaster's SLA dimension blank.
    expect(APEX_AMS_PROPOSAL_MATRIX.summary.undisclosedGapRows).toBeGreaterThan(0);
    const undisclosed = strong.walkAwayRisks.find((r) =>
      r.title.includes('undisclosed'),
    );
    expect(undisclosed?.severity).toBe('high');
  });

  it('flags "no credible alternative" when the buyer is cornered', () => {
    expect(
      weak.walkAwayRisks.some((r) => r.title.includes('credible alternative')),
    ).toBe(true);
    expect(
      strong.walkAwayRisks.some((r) =>
        r.title.includes('credible alternative'),
      ),
    ).toBe(false);
  });

  it('orders high-severity risks ahead of moderate ones', () => {
    const severities = weak.walkAwayRisks.map((r) => r.severity);
    const firstModerate = severities.indexOf('moderate');
    const lastHigh = severities.lastIndexOf('high');
    if (firstModerate !== -1 && lastHigh !== -1) {
      expect(lastHigh).toBeLessThan(firstModerate);
    }
  });
});

// ── Concessions ──────────────────────────────────────────────────────────────

describe('negotiation posture — concessions', () => {
  it('offers multi-year and reference concessions only when the buyer can', () => {
    expect(strong.concessions.some((c) => c.title.includes('Multi-year'))).toBe(
      true,
    );
    expect(strong.concessions.some((c) => c.title.includes('Reference'))).toBe(
      true,
    );
    expect(weak.concessions.some((c) => c.title.includes('Multi-year'))).toBe(
      false,
    );
  });

  it('always offers payment-cadence and phasing as cheap concessions', () => {
    expect(weak.concessions.some((c) => c.title.includes('payment'))).toBe(true);
    expect(weak.concessions.some((c) => c.title.includes('Phased'))).toBe(true);
  });

  it('every concession names a specific counter-ask', () => {
    for (const c of strong.concessions) {
      expect(c.tradeFor.length).toBeGreaterThan(0);
    }
  });
});

// ── Incumbent leverage ───────────────────────────────────────────────────────

describe('negotiation posture — incumbent leverage', () => {
  it('reports no incumbent and buyer leverage when none is supplied', () => {
    expect(bare.incumbentLeverage.hasIncumbent).toBe(false);
    expect(bare.incumbentLeverage.leverageHolder).toBe('buyer');
  });

  it('keeps leverage with the buyer when a credible alternative exists', () => {
    expect(strong.incumbentLeverage.hasIncumbent).toBe(true);
    expect(strong.incumbentLeverage.leverageHolder).toBe('buyer');
  });

  it('tilts leverage to the vendor in a sole-source incumbent re-compete', () => {
    expect(weak.incumbentLeverage.hasIncumbent).toBe(true);
    expect(weak.incumbentLeverage.leverageHolder).toBe('vendor');
    expect(weak.incumbentLeverage.assessment).toMatch(/switching cost/i);
  });
});

// ── Clause issues (methodology §6) ───────────────────────────────────────────

describe('negotiation posture — clause issues', () => {
  it('covers the full ten-clause AI-sourcing library', () => {
    expect(strong.clauseIssues).toHaveLength(10);
  });

  it('orders must-have clauses ahead of should-have clauses', () => {
    const priorities = strong.clauseIssues.map((c) => c.priority);
    const lastMust = priorities.lastIndexOf('must_have');
    const firstShould = priorities.indexOf('should_have');
    expect(lastMust).toBeLessThan(firstShould);
  });

  it('marks clauses surfaced by the proposal matrix', () => {
    // The weak fixture prefers BlueMaster, whose ip_terms cell ("vendor may
    // use ... to improve its models") is unfavorable — IP clauses surface.
    const ipTraining = weak.clauseIssues.find(
      (c) => c.clause === 'Model-training rights',
    );
    expect(ipTraining?.surfacedByMatrix).toBe(true);
  });

  it('every clause issue carries a why and an ask', () => {
    for (const c of strong.clauseIssues) {
      expect(c.whyItMatters.length).toBeGreaterThan(0);
      expect(c.ask.length).toBeGreaterThan(0);
    }
  });
});

// ── Headline + recommended opening ───────────────────────────────────────────

describe('negotiation posture — headline & opening', () => {
  it('headline carries the should-cost framing', () => {
    expect(strong.headline).toContain('should-cost');
  });

  it('opens by retiring the top walk-away risk when a high risk exists', () => {
    // The shared Slice 1.4 matrix leaves a dimension undisclosed — a high risk.
    expect(weak.walkAwayRisks.some((r) => r.severity === 'high')).toBe(true);
    expect(weak.recommendedOpening).toMatch(/do not negotiate price first/i);
  });

  it('leads with the strongest lever when no high walk-away risk exists', () => {
    // A fully-disclosed, low-exposure matrix → no high-severity risk.
    const cleanInput: NegotiationPostureInput = {
      dealLabel: 'clean deal',
      shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
      proposalMatrix: {
        eventId: 'e',
        eventName: 'e',
        stage: 'BAFO',
        generatedAt: '2026-05-16T00:00:00.000Z',
        rows: [],
        vendorSummaries: [],
        summary: {
          totalVendors: 2,
          totalDimensions: 8,
          comparableVendors: 2,
          materialDivergenceRows: 0,
          undisclosedGapRows: 0,
          totalExposureSpreadUsd: 0,
        },
        buyerBlindSpots: [],
        recommendedNextAction: 'proceed to scoring',
      },
      context: { hasCredibleAlternative: true, multiYearCommitmentPossible: true },
    };
    const clean = buildNegotiationPosture(cleanInput);
    expect(clean.walkAwayRisks.some((r) => r.severity === 'high')).toBe(false);
    expect(clean.recommendedOpening).toMatch(/lead with the strongest lever/i);
  });
});

// ── Degenerate input ─────────────────────────────────────────────────────────

describe('negotiation posture — degenerate input', () => {
  it('handles an empty proposal matrix without throwing', () => {
    const emptyMatrixInput: NegotiationPostureInput = {
      dealLabel: 'empty',
      shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
      proposalMatrix: {
        eventId: 'e',
        eventName: 'e',
        stage: 'RFP',
        generatedAt: '2026-05-16T00:00:00.000Z',
        rows: [],
        vendorSummaries: [],
        summary: {
          totalVendors: 0,
          totalDimensions: 0,
          comparableVendors: 0,
          materialDivergenceRows: 0,
          undisclosedGapRows: 0,
          totalExposureSpreadUsd: 0,
        },
        buyerBlindSpots: [],
        recommendedNextAction: 'collect responses',
      },
    };
    const posture = buildNegotiationPosture(emptyMatrixInput);
    expect(posture.clauseIssues).toHaveLength(10);
    // Should-cost gap lever still stands even with no proposals.
    expect(posture.levers.some((l) => l.kind === 'should_cost_gap')).toBe(true);
  });
});

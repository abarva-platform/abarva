// Source risk in Tower · Wave 3, Slice 3.3 · view-model tests.
//
// Integration-style: builds Slice 1.6 Source-to-Move handoff records
// and a Slice 3.1 outcome ledger view, then exercises the join +
// classification the source-risk view performs.

import type {
  HandoffDelta,
  SourceToMoveHandoff,
} from '@/lib/source/handoff/source-to-move-handoff-types';
import {
  buildOutcomeLedgerView,
  type OutcomeLedgerRow,
  type OutcomeLedgerView,
} from '@/lib/tower/outcome-ledger';
import {
  buildSourceRiskView,
  SOURCE_RISK_LEVELS,
  summarizeSourceRisk,
  toMoveSourceRisk,
} from '../index';

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** A clean, firm handoff; override per test. */
function handoff(
  overrides: Partial<SourceToMoveHandoff> = {},
): SourceToMoveHandoff {
  return {
    eventId: 'EVT-1',
    targetMoveId: 'MOVE-1',
    eventLabel: 'Contact Center AI platform sourcing',
    handoffVersion: 'source-to-move-handoff/v1',
    handedOffAt: '2026-05-01T00:00:00.000Z',
    readiness: 'ready',
    sourcingRecommendation: 'Source via a vendor-run partner model.',
    recommendedDeliveryModel: 'partner',
    plannedCostUsd: 1_200_000,
    deltas: [],
    mobilizationAssumptions: [],
    carriedOpenItems: [],
    receivingMoveGuidance: 'Mobilize directly.',
    ...overrides,
  };
}

function delta(overrides: Partial<HandoffDelta> = {}): HandoffDelta {
  return {
    dimension: 'cost',
    title: 'Should-cost exceeds the chartered Move budget',
    direction: 'adverse',
    baseline: 'Chartered against $1,000,000.',
    decided: 'Should-cost midpoint is $1,400,000.',
    deltaUsd: 400_000,
    implication: 'Escalate for re-funding.',
    ...overrides,
  };
}

function ledgerRow(overrides: Partial<OutcomeLedgerRow> = {}): OutcomeLedgerRow {
  return {
    id: 'entry-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: 'apexretail',
    clientId: 'client-1',
    subjectKind: 'move',
    subjectRef: 'MOVE-1',
    subjectLabel: 'Contact Center AI rollout',
    valueRung: 'measured_in_production',
    valueCategory: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedAmount: 500_000,
    realizedAmount: 480_000,
    baselineAmount: 0,
    counterfactualConfidence: 'medium',
    governanceReviewStatus: 'approved',
    measurementOwnerRole: 'cfo',
    evidencePointer: 'EVID-1',
    evidenceClaimIds: ['EVID-1'],
    note: null,
    recordedBy: 'user-1',
    recordedAt: '2026-05-10T00:00:00.000Z',
    ...overrides,
  };
}

function ledger(rows: OutcomeLedgerRow[] = []): OutcomeLedgerView {
  return buildOutcomeLedgerView('apexretail', rows);
}

const NO_LEDGER_VALUE: ReadonlySet<string> = new Set<string>();

// ── Risk classification ──────────────────────────────────────────────────────

describe('toMoveSourceRisk — risk classification', () => {
  it('classifies a firm, aligned handoff with no deltas as clear', () => {
    const r = toMoveSourceRisk(handoff(), NO_LEDGER_VALUE);
    expect(r.riskLevel).toBe('clear');
    expect(r.drivers).toHaveLength(0);
    expect(r.costExposureUsd).toBe(0);
  });

  it('classifies a not-ready handoff as blocked', () => {
    const r = toMoveSourceRisk(
      handoff({ readiness: 'not_ready' }),
      NO_LEDGER_VALUE,
    );
    expect(r.riskLevel).toBe('blocked');
  });

  it('classifies a non-cost adverse delta as exposed', () => {
    const r = toMoveSourceRisk(
      handoff({
        deltas: [
          delta({ dimension: 'delivery_model', deltaUsd: null }),
        ],
      }),
      NO_LEDGER_VALUE,
    );
    expect(r.riskLevel).toBe('exposed');
  });

  it('classifies a material adverse cost gap as exposed', () => {
    const r = toMoveSourceRisk(
      handoff({ deltas: [delta({ deltaUsd: 300_000 })] }),
      NO_LEDGER_VALUE,
    );
    expect(r.riskLevel).toBe('exposed');
    expect(r.costExposureUsd).toBe(300_000);
  });

  it('classifies a sub-material adverse cost gap as watch', () => {
    const r = toMoveSourceRisk(
      handoff({ deltas: [delta({ deltaUsd: 100_000 })] }),
      NO_LEDGER_VALUE,
    );
    expect(r.riskLevel).toBe('watch');
    expect(r.costExposureUsd).toBe(100_000);
  });

  it('classifies carried open items (no adverse delta) as watch', () => {
    const r = toMoveSourceRisk(
      handoff({
        readiness: 'ready_with_open_items',
        carriedOpenItems: [
          { id: 'open-1', question: 'Who owns SLAs?', whyItMatters: 'Blocks kickoff.' },
        ],
      }),
      NO_LEDGER_VALUE,
    );
    expect(r.riskLevel).toBe('watch');
    expect(r.carriedOpenItemCount).toBe(1);
  });

  it('excludes favorable cost deltas from cost exposure', () => {
    const r = toMoveSourceRisk(
      handoff({
        deltas: [delta({ direction: 'favorable', deltaUsd: -200_000 })],
      }),
      NO_LEDGER_VALUE,
    );
    expect(r.costExposureUsd).toBe(0);
    expect(r.riskLevel).toBe('clear');
  });
});

// ── Drivers ──────────────────────────────────────────────────────────────────

describe('toMoveSourceRisk — drivers', () => {
  it('carries adverse deltas and open items as drivers', () => {
    const r = toMoveSourceRisk(
      handoff({
        readiness: 'ready_with_open_items',
        deltas: [
          delta({ dimension: 'delivery_model', deltaUsd: null }),
          delta({ direction: 'favorable', deltaUsd: -50_000 }),
        ],
        carriedOpenItems: [
          { id: 'open-1', question: 'SLA owner?', whyItMatters: 'Blocks kickoff.' },
        ],
      }),
      NO_LEDGER_VALUE,
    );
    // one adverse delta + one open item; the favorable delta is excluded.
    expect(r.drivers).toHaveLength(2);
    expect(r.drivers[0].dimension).toBe('delivery_model');
    expect(r.drivers[1].title).toContain('Open gate item');
  });
});

// ── Ledger join ──────────────────────────────────────────────────────────────

describe('toMoveSourceRisk — outcome ledger join', () => {
  it('flags hasLedgerValueClaim when the Move carries a ledger value claim', () => {
    const r = toMoveSourceRisk(
      handoff({ targetMoveId: 'MOVE-1' }),
      new Set(['MOVE-1']),
    );
    expect(r.hasLedgerValueClaim).toBe(true);
  });

  it('does not flag hasLedgerValueClaim for an unmatched Move', () => {
    const r = toMoveSourceRisk(
      handoff({ targetMoveId: 'MOVE-9' }),
      new Set(['MOVE-1']),
    );
    expect(r.hasLedgerValueClaim).toBe(false);
  });

  it('readout names the portfolio-fine / vendor-risk tension', () => {
    const r = toMoveSourceRisk(
      handoff({
        targetMoveId: 'MOVE-1',
        deltas: [delta({ dimension: 'delivery_model', deltaUsd: null })],
      }),
      new Set(['MOVE-1']),
    );
    expect(r.riskLevel).toBe('exposed');
    expect(r.towerReadout).toContain('portfolio value claim');
    expect(r.towerReadout).toContain('real risk');
  });
});

// ── Summary ──────────────────────────────────────────────────────────────────

describe('summarizeSourceRisk', () => {
  it('reconciles byRiskLevel against movesInScope', () => {
    const moves = [
      toMoveSourceRisk(handoff({ targetMoveId: 'M1' }), NO_LEDGER_VALUE),
      toMoveSourceRisk(
        handoff({ targetMoveId: 'M2', readiness: 'not_ready' }),
        NO_LEDGER_VALUE,
      ),
    ];
    const s = summarizeSourceRisk(moves);
    expect(s.movesInScope).toBe(2);
    const total = SOURCE_RISK_LEVELS.reduce(
      (sum, lvl) => sum + s.byRiskLevel[lvl],
      0,
    );
    expect(total).toBe(2);
  });

  it('every canonical risk level is present in the summary', () => {
    const s = summarizeSourceRisk([]);
    for (const lvl of SOURCE_RISK_LEVELS) {
      expect(s.byRiskLevel[lvl]).toBe(0);
    }
    expect(s.movesInScope).toBe(0);
  });

  it('sums total cost exposure across moves', () => {
    const moves = [
      toMoveSourceRisk(
        handoff({ targetMoveId: 'M1', deltas: [delta({ deltaUsd: 300_000 })] }),
        NO_LEDGER_VALUE,
      ),
      toMoveSourceRisk(
        handoff({ targetMoveId: 'M2', deltas: [delta({ deltaUsd: 100_000 })] }),
        NO_LEDGER_VALUE,
      ),
    ];
    expect(summarizeSourceRisk(moves).totalCostExposureUsd).toBe(400_000);
  });

  it('counts value-claiming-but-sourcing-exposed moves', () => {
    const moves = [
      // value claim + exposed -> counted.
      toMoveSourceRisk(
        handoff({
          targetMoveId: 'M1',
          deltas: [delta({ dimension: 'incumbent', deltaUsd: null })],
        }),
        new Set(['M1']),
      ),
      // value claim + clear -> not counted.
      toMoveSourceRisk(handoff({ targetMoveId: 'M2' }), new Set(['M2'])),
      // no value claim + blocked -> not counted.
      toMoveSourceRisk(
        handoff({ targetMoveId: 'M3', readiness: 'not_ready' }),
        NO_LEDGER_VALUE,
      ),
    ];
    expect(summarizeSourceRisk(moves).valueClaimingButSourcingExposedCount).toBe(
      1,
    );
  });
});

// ── Top-level builder ────────────────────────────────────────────────────────

describe('buildSourceRiskView', () => {
  it('joins handoffs to the outcome ledger by Move id', () => {
    const view = buildSourceRiskView({
      tenantClientKey: 'apexretail',
      handoffs: [
        handoff({ targetMoveId: 'MOVE-1', eventId: 'EVT-1' }),
        handoff({ targetMoveId: 'MOVE-2', eventId: 'EVT-2' }),
      ],
      ledger: ledger([ledgerRow({ subjectRef: 'MOVE-1' })]),
    });
    expect(view.tenantClientKey).toBe('apexretail');
    expect(view.moves).toHaveLength(2);
    const m1 = view.moves.find((m) => m.moveId === 'MOVE-1');
    const m2 = view.moves.find((m) => m.moveId === 'MOVE-2');
    expect(m1?.hasLedgerValueClaim).toBe(true);
    expect(m2?.hasLedgerValueClaim).toBe(false);
  });

  it('ignores non-move ledger subjects in the value-claim join', () => {
    const view = buildSourceRiskView({
      tenantClientKey: 'apexretail',
      handoffs: [handoff({ targetMoveId: 'MOVE-1' })],
      ledger: ledger([
        ledgerRow({ subjectKind: 'source_event', subjectRef: 'MOVE-1' }),
      ]),
    });
    expect(view.moves[0].hasLedgerValueClaim).toBe(false);
  });

  it('sorts most-exposed first, tie-breaking by cost exposure then id', () => {
    const view = buildSourceRiskView({
      tenantClientKey: 'apexretail',
      handoffs: [
        handoff({ targetMoveId: 'M-clear', eventId: 'E1' }),
        handoff({
          targetMoveId: 'M-blocked',
          eventId: 'E2',
          readiness: 'not_ready',
        }),
        handoff({
          targetMoveId: 'M-exposed-lo',
          eventId: 'E3',
          deltas: [delta({ deltaUsd: 300_000 })],
        }),
        handoff({
          targetMoveId: 'M-exposed-hi',
          eventId: 'E4',
          deltas: [delta({ deltaUsd: 900_000 })],
        }),
      ],
      ledger: ledger(),
    });
    expect(view.moves.map((m) => m.moveId)).toEqual([
      'M-blocked',
      'M-exposed-hi',
      'M-exposed-lo',
      'M-clear',
    ]);
  });

  it('produces a reconciled summary over the joined view', () => {
    const view = buildSourceRiskView({
      tenantClientKey: 'apexretail',
      handoffs: [
        handoff({ targetMoveId: 'M1' }),
        handoff({
          targetMoveId: 'M2',
          deltas: [delta({ dimension: 'risk', deltaUsd: null })],
        }),
      ],
      ledger: ledger([ledgerRow({ subjectRef: 'M2' })]),
    });
    expect(view.summary.movesInScope).toBe(2);
    expect(view.summary.valueClaimingButSourcingExposedCount).toBe(1);
  });

  it('returns an empty view for no handoffs', () => {
    const view = buildSourceRiskView({
      tenantClientKey: 'apexretail',
      handoffs: [],
      ledger: ledger(),
    });
    expect(view.moves).toHaveLength(0);
    expect(view.summary.movesInScope).toBe(0);
  });
});

// Outcome ledger · Wave 3, Slice 3.4 · adoption & value-realization
// instrumentation view-model unit tests.
//
// Pure. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - `buildTowerValueRealizationSignal` computes the realization ratio
//   only from verified-AND-evidenced earned value; unevidenced
//   verified value is excluded and surfaced separately.
// - The realization severity band comes from the Slice 0.3 taxonomy.
// - `buildTowerAdoptionSignal` honestly reports `unknown` — the outcome
//   ledger holds no adoption telemetry, so no percentage is fabricated.
// - `composeEarningSummary` answers "is this earning?" deterministically.
// - `buildAtlasExecutiveBriefView` gains the optional Slice 3.4 field
//   without breaking the deterministic-seed brief shape.

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger/types';
import { buildOutcomeLedgerView } from '@/lib/tower/outcome-ledger/view-model';
import {
  buildTowerAdoptionRealizationView,
  buildTowerAdoptionSignal,
  buildTowerValueRealizationSignal,
  composeEarningSummary,
} from '@/lib/tower/outcome-ledger/adoption-realization-view';
import { buildAtlasExecutiveBriefView } from '@/lib/tower/atlas-executive-brief-canvas';

function row(overrides: Partial<OutcomeLedgerRow> = {}): OutcomeLedgerRow {
  return {
    id: 'ol-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: 'apexretail',
    clientId: 'client-1',
    subjectKind: 'move',
    subjectRef: 'move-101',
    subjectLabel: 'Contact Center AI deflection',
    valueRung: 'projected_only',
    valueCategory: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedAmount: 1_000_000,
    realizedAmount: null,
    baselineAmount: null,
    counterfactualConfidence: 'low',
    governanceReviewStatus: 'not_started',
    measurementOwnerRole: 'VP Customer Experience',
    evidencePointer: null,
    evidenceClaimIds: [],
    note: null,
    recordedBy: 'svc',
    recordedAt: '2026-05-16T10:00:00.000Z',
    ...overrides,
  };
}

function ledger(rows: readonly OutcomeLedgerRow[]) {
  return buildOutcomeLedgerView('apexretail', rows);
}

describe('buildTowerValueRealizationSignal', () => {
  it('counts only verified-and-evidenced realized value as earned', () => {
    const signal = buildTowerValueRealizationSignal(
      ledger([
        // verified + evidenced — earned
        row({
          id: 'a',
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 800_000,
          evidencePointer: 'evidence://ledger/a',
        }),
        // verified but UNevidenced — excluded from earned
        row({
          id: 'b',
          valueRung: 'measured_in_pilot',
          projectedAmount: 1_000_000,
          realizedAmount: 900_000,
          evidencePointer: null,
          evidenceClaimIds: [],
        }),
      ]),
    );
    expect(signal.totalProjectedAmount).toBe(2_000_000);
    expect(signal.earnedVerifiedAmount).toBe(800_000);
    expect(signal.unevidencedVerifiedAmount).toBe(900_000);
    // 800k earned / 2m projected = 0.4
    expect(signal.realizationRatio).toBeCloseTo(0.4);
  });

  it('classifies the realization band via the Slice 0.3 taxonomy', () => {
    // 900k earned / 1m projected = 0.9 -> on_track (>= 0.75)
    const onTrack = buildTowerValueRealizationSignal(
      ledger([
        row({
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 900_000,
          evidencePointer: 'evidence://x',
        }),
      ]),
    );
    expect(onTrack.severity).toBe('on_track');

    // 100k earned / 1m = 0.1 -> critical (< 0.25)
    const critical = buildTowerValueRealizationSignal(
      ledger([
        row({
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 100_000,
          evidencePointer: 'evidence://y',
        }),
      ]),
    );
    expect(critical.severity).toBe('critical');
  });

  it('returns a null ratio when there is no projected value', () => {
    const signal = buildTowerValueRealizationSignal(
      ledger([row({ projectedAmount: 0 })]),
    );
    expect(signal.realizationRatio).toBeNull();
    expect(signal.severity).toBe('critical');
  });

  it('reports tier counts from the ledger summary', () => {
    const signal = buildTowerValueRealizationSignal(
      ledger([
        row({ id: 'p', valueRung: 'projected_only' }),
        row({ id: 't', valueRung: 'baseline_set' }),
        row({
          id: 'v',
          valueRung: 'measured_in_pilot',
          realizedAmount: 1,
          evidencePointer: 'e',
        }),
      ]),
    );
    expect(signal.projectedTierCount).toBe(1);
    expect(signal.trackedTierCount).toBe(1);
    expect(signal.verifiedTierCount).toBe(1);
  });
});

describe('buildTowerAdoptionSignal', () => {
  it('reports adoption as unknown — no telemetry is fabricated', () => {
    const adoption = buildTowerAdoptionSignal(ledger([row()]));
    expect(adoption.state).toBe('unknown');
    expect(adoption.instrumentationGap).toBe(true);
    expect(adoption.impliedAction).toBeNull();
  });

  it('handles an empty ledger', () => {
    const adoption = buildTowerAdoptionSignal(ledger([]));
    expect(adoption.state).toBe('unknown');
    expect(adoption.headline).toContain('No outcome ledger entries');
  });
});

describe('composeEarningSummary', () => {
  it('answers "is this earning?" for an on-track portfolio', () => {
    const view = buildTowerAdoptionRealizationView(
      ledger([
        row({
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 950_000,
          evidencePointer: 'evidence://z',
        }),
      ]),
    );
    expect(view.earningSummary).toContain('earning its projection');
    expect(view.earningSummary).toContain('95%');
  });

  it('flags unevidenced verified value for challenge', () => {
    const view = buildTowerAdoptionRealizationView(
      ledger([
        row({
          valueRung: 'measured_in_pilot',
          projectedAmount: 1_000_000,
          realizedAmount: 500_000,
          evidencePointer: null,
        }),
      ]),
    );
    expect(view.earningSummary).toContain('unevidenced');
  });

  it('is deterministic — identical input yields identical output', () => {
    const rows = [row({ realizedAmount: 1, valueRung: 'measured_in_pilot', evidencePointer: 'e' })];
    const a = buildTowerAdoptionRealizationView(ledger(rows));
    const b = buildTowerAdoptionRealizationView(ledger(rows));
    expect(a).toEqual(b);
  });

  it('handles a ledger with no projected value', () => {
    const summary = composeEarningSummary(
      buildTowerAdoptionSignal(ledger([])),
      buildTowerValueRealizationSignal(ledger([])),
    );
    expect(summary).toContain('not yet instrumented');
  });
});

describe('buildAtlasExecutiveBriefView — Slice 3.4 field', () => {
  it('omits valueRealization when no adoption-realization view is supplied', () => {
    expect(buildAtlasExecutiveBriefView('apex-retail').valueRealization).toBeNull();
  });

  it('projects the adoption-realization view onto the brief', () => {
    const arView = buildTowerAdoptionRealizationView(
      ledger([
        row({
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 900_000,
          evidencePointer: 'evidence://q',
        }),
      ]),
    );
    const brief = buildAtlasExecutiveBriefView('apex-retail', arView);
    expect(brief.valueRealization).not.toBeNull();
    expect(brief.valueRealization?.realizationSeverity).toBe('on_track');
    expect(brief.valueRealization?.adoptionState).toBe('unknown');
    expect(brief.valueRealization?.adoptionInstrumentationGap).toBe(true);
    // The deterministic-seed brief shape is untouched.
    expect(brief.deterministicSeed).toBe(true);
    expect(brief.adoptionSignal.signalType).toBe('adoption');
  });
});

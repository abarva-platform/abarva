// Tower · Wave 3, Slice 3.5 — Board/ELT pack generator unit tests.
//
// Pure. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - `buildBoardPack` composes a one-pager from the Slice 3.1 outcome
//   ledger view, the Slice 3.4 adoption/value-realization view and the
//   Slice 3.2 executive action queue.
// - Spend at risk is committed projected value minus verified-and-
//   evidenced earned value; it never goes negative.
// - Unevidenced verified-tier value is surfaced as a challenge, never
//   folded into earned value.
// - Decisions and actions are capped at the one-pager limit and carry
//   the action queue's deterministic ranking.
// - Evidence links resolve to a pointer, a claim-id list, or an
//   explicit gap marker.
// - The pack is byte-identical across repeated calls (golden snapshot).

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger/types';
import { buildOutcomeLedgerView } from '@/lib/tower/outcome-ledger/view-model';
import { buildTowerAdoptionRealizationView } from '@/lib/tower/outcome-ledger/adoption-realization-view';
import { buildExecutiveActionQueue } from '@/lib/tower/action-queue/executive-action-queue';
import type { ValueLedgerEntry } from '@/lib/tower/ai-value-outcome-ledger';
import {
  buildBoardPack,
  buildBoardDecisions,
  buildBoardSpendAtRisk,
  buildBoardEvidenceLinks,
} from '@/lib/tower/board-pack/board-pack-generator';

// ---------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------

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

function valueEntry(overrides: Partial<ValueLedgerEntry>): ValueLedgerEntry {
  const base: ValueLedgerEntry = {
    id: 'value-seed-x',
    initiative: 'Test initiative',
    category: 'productivity',
    measurementUnit: 'percent',
    projectedValue: 100,
    realizedValue: null,
    baselineValue: 0,
    varianceAbs: null,
    variancePercent: null,
    measurementOwnerRole: 'VP Test',
    counterfactual: 'comparison condition',
    counterfactualConfidence: 'medium',
    readiness: 'projected_only',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'not_started',
    notes: ['seed projection only'],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  };
  return { ...base, ...overrides };
}

// A leakage entry (critical) and a projected-only entry (watch).
const LEAKAGE = valueEntry({
  id: 'value-leak',
  initiative: 'Demand Forecasting',
  readiness: 'measured_in_production',
  realizedValue: 60,
  variancePercent: -40,
});
const PROJECTED = valueEntry({
  id: 'value-proj',
  initiative: 'Store Associate Productivity',
  readiness: 'projected_only',
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe('buildBoardSpendAtRisk', () => {
  it('computes spend at risk as committed minus verified-and-evidenced value', () => {
    const realization = buildTowerAdoptionRealizationView(
      ledger([
        row({
          id: 'a',
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 800_000,
          evidencePointer: 'evidence://ledger/a',
        }),
        row({ id: 'b', projectedAmount: 500_000 }),
      ]),
    );
    const sar = buildBoardSpendAtRisk(realization);
    expect(sar.totalCommittedAmount).toBe(1_500_000);
    expect(sar.earnedVerifiedAmount).toBe(800_000);
    expect(sar.spendAtRiskAmount).toBe(700_000);
  });

  it('never reports negative spend at risk', () => {
    const realization = buildTowerAdoptionRealizationView(
      ledger([
        row({
          id: 'a',
          valueRung: 'measured_in_production',
          projectedAmount: 100,
          realizedAmount: 1_000_000,
          evidencePointer: 'evidence://ledger/a',
        }),
      ]),
    );
    expect(buildBoardSpendAtRisk(realization).spendAtRiskAmount).toBe(0);
  });

  it('surfaces unevidenced verified-tier value as a separate challenge figure', () => {
    const realization = buildTowerAdoptionRealizationView(
      ledger([
        row({
          id: 'a',
          valueRung: 'measured_in_production',
          projectedAmount: 1_000_000,
          realizedAmount: 900_000,
          evidencePointer: null,
          evidenceClaimIds: [],
        }),
      ]),
    );
    const sar = buildBoardSpendAtRisk(realization);
    expect(sar.earnedVerifiedAmount).toBe(0);
    expect(sar.unevidencedClaimedAmount).toBe(900_000);
    expect(sar.headline).toContain('challenged');
  });

  it('reports cleanly when no committed value exists', () => {
    const realization = buildTowerAdoptionRealizationView(ledger([]));
    const sar = buildBoardSpendAtRisk(realization);
    expect(sar.totalCommittedAmount).toBe(0);
    expect(sar.headline).toContain('cannot be computed');
  });
});

describe('buildBoardDecisions', () => {
  it('ranks decisions severity-first and caps at the one-pager limit', () => {
    const queue = buildExecutiveActionQueue([
      LEAKAGE,
      PROJECTED,
      valueEntry({ id: 'v3', initiative: 'C', readiness: 'declined' }),
      valueEntry({ id: 'v4', initiative: 'D', readiness: 'projected_only' }),
      valueEntry({ id: 'v5', initiative: 'E', readiness: 'projected_only' }),
      valueEntry({ id: 'v6', initiative: 'F', readiness: 'projected_only' }),
    ]);
    const decisions = buildBoardDecisions(queue);
    expect(decisions.length).toBeLessThanOrEqual(5);
    expect(decisions[0].severity).toBe('critical');
    expect(decisions[0].initiative).toBe('Demand Forecasting');
    expect(decisions[0].id).toBe('bd-value-leak');
  });

  it('returns an empty decision list when nothing needs the board', () => {
    const queue = buildExecutiveActionQueue([
      valueEntry({
        id: 'ok',
        readiness: 'measured_in_production',
        realizedValue: 120,
        variancePercent: 20,
      }),
    ]);
    expect(buildBoardDecisions(queue)).toHaveLength(0);
  });
});

describe('buildBoardEvidenceLinks', () => {
  it('resolves pointers, claim-id lists, and explicit gaps', () => {
    const links = buildBoardEvidenceLinks(
      ledger([
        row({ id: 'a', evidencePointer: 'evidence://ledger/a' }),
        row({ id: 'b', evidenceClaimIds: ['c1', 'c2'] }),
        row({ id: 'c' }),
      ]),
    );
    const byId = Object.fromEntries(links.map((l) => [l.entryId, l]));
    expect(byId.a.isGap).toBe(false);
    expect(byId.a.reference).toBe('evidence://ledger/a');
    expect(byId.b.isGap).toBe(false);
    expect(byId.b.reference).toContain('2 evidence claims');
    expect(byId.c.isGap).toBe(true);
  });
});

describe('buildBoardPack', () => {
  function pack() {
    const view = ledger([
      row({
        id: 'a',
        subjectLabel: 'Demand Forecasting',
        valueRung: 'measured_in_production',
        projectedAmount: 1_000_000,
        realizedAmount: 600_000,
        evidencePointer: 'evidence://ledger/a',
      }),
      row({
        id: 'b',
        subjectLabel: 'Store Associate Productivity',
        projectedAmount: 500_000,
      }),
    ]);
    const realization = buildTowerAdoptionRealizationView(view);
    const queue = buildExecutiveActionQueue([LEAKAGE, PROJECTED]);
    return buildBoardPack(view, realization, queue);
  }

  it('assembles all five pack sections', () => {
    const p = pack();
    expect(p.tenantClientKey).toBe('apexretail');
    expect(p.topDecisions.length).toBeGreaterThan(0);
    expect(p.spendAtRisk.totalCommittedAmount).toBe(1_500_000);
    expect(p.valueChange.realizationRatio).not.toBeUndefined();
    expect(p.actionsRequired.length).toBeGreaterThan(0);
    expect(p.evidenceLinks).toHaveLength(2);
  });

  it('surfaces critical decisions in the headline', () => {
    expect(pack().headline).toContain('critical');
  });

  it('flags evidence gaps in the headline', () => {
    const p = pack();
    expect(p.headline).toContain('carry no evidence');
  });

  it('value change re-projects the Slice 3.4 earning summary verbatim', () => {
    const view = ledger([row({ id: 'a' })]);
    const realization = buildTowerAdoptionRealizationView(view);
    const queue = buildExecutiveActionQueue([PROJECTED]);
    const p = buildBoardPack(view, realization, queue);
    expect(p.valueChange.earningSummary).toBe(realization.earningSummary);
    expect(p.valueChange.adoptionInstrumentationGap).toBe(true);
  });

  it('is deterministic — repeated calls return a byte-identical pack', () => {
    expect(JSON.stringify(pack())).toBe(JSON.stringify(pack()));
    expect(pack().deterministicSeed).toBe(true);
  });
});

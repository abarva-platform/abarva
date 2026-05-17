// Move portfolio card · GAP-4 · view-model unit tests.
//
// Pure. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - `buildMovePortfolioCard` joins outcome-ledger, source-risk, and
//   adoption-realization reads by Move id into one portfolio card.
// - The ledger status resolves to the strongest value tier the Move
//   carries; projected value sums only `move`-subject entries.
// - Source-risk posture + readout + cost exposure are lifted from the
//   source-risk join; `null`/0 when no Source handoff is linked.
// - Every card exposes navigation into the Move and its trace.
// - The Apex contact-centre derivation builds a card for the seeded
//   loop-completed Move.

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger/types';
import { buildOutcomeLedgerView } from '@/lib/tower/outcome-ledger/view-model';
import { buildTowerAdoptionRealizationView } from '@/lib/tower/outcome-ledger/adoption-realization-view';
import { buildSourceRiskView } from '@/lib/tower/source-risk';
import type { SourceToMoveHandoff } from '@/lib/source/handoff/source-to-move-handoff-types';
import {
  buildMovePortfolioCard,
  buildMovePortfolioCards,
} from '@/lib/tower/move-portfolio-card';
import {
  APEX_CONTACT_CENTER_MOVE,
  APEX_TENANT_KEY,
  buildApexPortfolioCards,
} from '@/lib/tower/apex-contact-center-portfolio-fixture';

const TENANT = 'apexretail';
const MOVE_ID = 'move-test-001';

function ledgerRow(overrides: Partial<OutcomeLedgerRow>): OutcomeLedgerRow {
  return {
    id: 'row-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: TENANT,
    clientId: null,
    subjectKind: 'move',
    subjectRef: MOVE_ID,
    subjectLabel: 'Test Move value claim',
    valueRung: 'projected_only',
    valueCategory: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedAmount: 1_000_000,
    realizedAmount: null,
    baselineAmount: null,
    counterfactualConfidence: 'medium',
    governanceReviewStatus: 'in_review',
    measurementOwnerRole: null,
    evidencePointer: null,
    evidenceClaimIds: [],
    note: null,
    recordedBy: null,
    recordedAt: '2026-05-10T00:00:00.000Z',
    ...overrides,
  };
}

function handoff(overrides: Partial<SourceToMoveHandoff>): SourceToMoveHandoff {
  return {
    eventId: 'evt-001',
    targetMoveId: MOVE_ID,
    eventLabel: 'Test sourcing event',
    handoffVersion: 'source-to-move-handoff/v1',
    handedOffAt: '2026-05-08T00:00:00.000Z',
    readiness: 'ready',
    sourcingRecommendation: 'Buy from a specialist vendor.',
    recommendedDeliveryModel: 'buy',
    plannedCostUsd: 2_000_000,
    deltas: [],
    mobilizationAssumptions: [],
    carriedOpenItems: [],
    receivingMoveGuidance: 'Mobilize on the buy decision.',
    ...overrides,
  };
}

describe('buildMovePortfolioCard', () => {
  it('joins ledger, source-risk and adoption reads into one card', () => {
    const ledger = buildOutcomeLedgerView(TENANT, [ledgerRow({})]);
    const sourceRisk = buildSourceRiskView({
      tenantClientKey: TENANT,
      handoffs: [handoff({})],
      ledger,
    });
    const adoptionRealization = buildTowerAdoptionRealizationView(ledger);

    const card = buildMovePortfolioCard(
      { moveId: MOVE_ID, moveName: 'Test Move', phaseLabel: 'P3 Design' },
      { moves: [], ledger, sourceRisk, adoptionRealization },
    );

    expect(card.moveId).toBe(MOVE_ID);
    expect(card.moveName).toBe('Test Move');
    expect(card.ledgerStatus).toBe('projected');
    expect(card.projectedValueUsd).toBe(1_000_000);
    expect(card.sourceRiskLevel).toBe('clear');
    expect(card.sourceRiskReadout).toBeTruthy();
    expect(card.earningSummary).toBeTruthy();
  });

  it('resolves the strongest value tier the Move carries', () => {
    const ledger = buildOutcomeLedgerView(TENANT, [
      ledgerRow({ id: 'r1', valueRung: 'projected_only' }),
      ledgerRow({ id: 'r2', valueRung: 'measured_in_production', realizedAmount: 900_000 }),
    ]);
    const card = buildMovePortfolioCard(
      { moveId: MOVE_ID, moveName: 'Test Move', phaseLabel: 'P3 Design' },
      {
        moves: [],
        ledger,
        sourceRisk: buildSourceRiskView({ tenantClientKey: TENANT, handoffs: [], ledger }),
        adoptionRealization: buildTowerAdoptionRealizationView(ledger),
      },
    );
    expect(card.ledgerStatus).toBe('verified');
    expect(card.projectedValueUsd).toBe(2_000_000);
  });

  it('reports no value claim and no source risk when none is linked', () => {
    const ledger = buildOutcomeLedgerView(TENANT, []);
    const card = buildMovePortfolioCard(
      { moveId: MOVE_ID, moveName: 'Test Move', phaseLabel: 'P2 Diagnose' },
      {
        moves: [],
        ledger,
        sourceRisk: buildSourceRiskView({ tenantClientKey: TENANT, handoffs: [], ledger }),
        adoptionRealization: buildTowerAdoptionRealizationView(ledger),
      },
    );
    expect(card.ledgerStatus).toBe('none');
    expect(card.projectedValueUsd).toBe(0);
    expect(card.sourceRiskLevel).toBeNull();
    expect(card.sourceRiskReadout).toBeNull();
    expect(card.sourceCostExposureUsd).toBe(0);
  });

  it('exposes navigation into the Move and its cross-module trace', () => {
    const ledger = buildOutcomeLedgerView(TENANT, []);
    const card = buildMovePortfolioCard(
      { moveId: MOVE_ID, moveName: 'Test Move', phaseLabel: 'P3 Design' },
      {
        moves: [],
        ledger,
        sourceRisk: buildSourceRiskView({ tenantClientKey: TENANT, handoffs: [], ledger }),
        adoptionRealization: buildTowerAdoptionRealizationView(ledger),
      },
    );
    const hrefs = card.links.map((l) => l.href);
    expect(hrefs).toContain(`/strategic-moves/${MOVE_ID}`);
    expect(hrefs).toContain(`/strategic-moves/${MOVE_ID}/trace`);
  });

  it('builds one card per Move in input order', () => {
    const ledger = buildOutcomeLedgerView(TENANT, []);
    const cards = buildMovePortfolioCards({
      moves: [
        { moveId: 'm-a', moveName: 'Move A', phaseLabel: 'P3 Design' },
        { moveId: 'm-b', moveName: 'Move B', phaseLabel: 'P4 Mobilize' },
      ],
      ledger,
      sourceRisk: buildSourceRiskView({ tenantClientKey: TENANT, handoffs: [], ledger }),
      adoptionRealization: buildTowerAdoptionRealizationView(ledger),
    });
    expect(cards.map((c) => c.moveId)).toEqual(['m-a', 'm-b']);
  });
});

describe('buildApexPortfolioCards', () => {
  it('builds a portfolio card for the seeded contact-centre Move', () => {
    const cards = buildApexPortfolioCards();
    expect(cards).toHaveLength(1);

    const [card] = cards;
    expect(card.moveId).toBe(APEX_CONTACT_CENTER_MOVE.moveId);
    expect(card.moveName).toBe('Contact Center AI Routing');
    expect(card.phaseLabel).toBe('P3 Design');
    // baseline_set rung projects to the `tracked` value tier.
    expect(card.ledgerStatus).toBe('tracked');
    expect(card.projectedValueUsd).toBeGreaterThan(0);
    // The handoff carries one open gate item → `watch` sourcing risk.
    expect(card.sourceRiskLevel).toBe('watch');
    expect(card.sourceRiskReadout).toBeTruthy();
    expect(card.earningSummary).toBeTruthy();
    expect(card.links.map((l) => l.href)).toContain(
      `/strategic-moves/${APEX_CONTACT_CENTER_MOVE.moveId}/trace`,
    );
  });

  it('keys the derivation off the canonical Apex tenant key', () => {
    expect(APEX_TENANT_KEY).toBe('apexretail');
  });
});

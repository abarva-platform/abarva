import {
  buildAiOpsVarianceAlert,
  buildTowerAiOpsCostLedger,
  buildTowerAiOpsCostLedgerFromValueLayers,
  type TowerAiOpsCostLedgerEntry,
} from '../ai-ops-cost-ledger';
import type { ValueLayerState } from '../value-states/types';

const baseEntry: TowerAiOpsCostLedgerEntry = {
  projectedThreeYearUsd: 100,
  realizedToDateUsd: 100,
  realizedAsOf: '2026-05-31',
  varianceReasonCode: null,
  tierBreachAlert: null,
  modelTierDriftAlert: null,
  evidence: 'estimated',
  source: 'unit-test',
};

function valueLayer(overrides: Partial<ValueLayerState> = {}): ValueLayerState {
  return {
    id: null,
    moveId: 'move-1',
    layer: 'license_dollars',
    definition: {
      layer: 'license_dollars',
      label: 'License $',
      format: 'usd',
      description: 'Annual AI tooling spend under measurement.',
    },
    projected: {
      kind: 'projected',
      value: 1000,
      unit: 'usd',
      label: 'Projected annual AI tooling spend',
      confidence: 'medium',
      basis: 'unit-test',
      computedAt: '2026-05-31T00:00:00.000Z',
      evidence: [],
    },
    tracked: {
      kind: 'tracked',
      value: 1200,
      unit: 'usd',
      label: 'Tracked annual AI tooling spend',
      confidence: 'medium',
      basis: 'unit-test',
      computedAt: '2026-05-31T00:00:00.000Z',
      evidence: [],
    },
    verified: {
      kind: 'verified',
      value: null,
      unit: 'usd',
      label: 'Not attested',
      confidence: 'stub',
      basis: 'unit-test',
      computedAt: null,
      evidence: [],
    },
    variance: {
      trackedVsProjected: 200,
      verifiedVsProjected: null,
      unit: 'usd',
    },
    updatedAt: '2026-05-31T00:00:00.000Z',
    ...overrides,
  };
}

describe('Tower AI ops cost ledger', () => {
  it('keeps the AI ops cost shape parallel to the value ledger contract', () => {
    const ledger = buildTowerAiOpsCostLedger({
      projectedThreeYearUsd: 3000,
      realizedToDateUsd: 1400,
      realizedAsOf: '2026-05-31',
      tierBreachAlert: { threshold: 100000, projectedDate: '2026-11-01' },
      modelTierDriftAlert: { fromTier: 'cost_optimized', toTier: 'frontier', deltaUsd: 900 },
    });

    expect(ledger.entry.projectedThreeYearUsd).toBe(3000);
    expect(ledger.entry.realizedToDateUsd).toBe(1400);
    expect(ledger.entry.varianceReasonCode).toBeNull();
    expect(ledger.entry.tierBreachAlert?.threshold).toBe(100000);
    expect(ledger.entry.modelTierDriftAlert?.toTier).toBe('frontier');
  });

  it('emits a variance alert when realized cost is more than 10% above projection without a reason code', () => {
    const alert = buildAiOpsVarianceAlert({
      ...baseEntry,
      projectedThreeYearUsd: 1000,
      realizedToDateUsd: 1120,
    });

    expect(alert?.severity).toBe('warning');
    expect(alert?.message).toContain('above the locked three-year projection');
  });

  it('suppresses the variance alert when a reason code is on file', () => {
    const alert = buildAiOpsVarianceAlert({
      ...baseEntry,
      projectedThreeYearUsd: 1000,
      realizedToDateUsd: 1400,
      varianceReasonCode: 'model_tier_upgrade_approved',
    });

    expect(alert).toBeNull();
  });

  it('builds an estimated ledger from the Tower license-dollar layer until live run-cost fields exist', () => {
    const ledger = buildTowerAiOpsCostLedgerFromValueLayers([
      valueLayer(),
    ], '2026-05-31');

    expect(ledger.entry.projectedThreeYearUsd).toBe(3000);
    expect(ledger.entry.realizedToDateUsd).toBe(1200);
    expect(ledger.entry.evidence).toBe('estimated');
    expect(ledger.entry.source).toContain('inference, embedding, and eval cost ledgers');
  });
});

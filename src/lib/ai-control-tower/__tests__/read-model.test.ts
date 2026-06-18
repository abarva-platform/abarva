import { getAiControlTowerReadModel } from '../read-model';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: jest.fn(() => Promise.resolve(null)),
    select: jest.fn(() => Promise.resolve([])),
  },
}));

describe('AI Control Tower read model', () => {
  it('binds the First Capital synthetic substrate into the right tower lenses', async () => {
    const model = await getAiControlTowerReadModel({
      clientId: null,
      clientKey: 'arcturus',
      tenantName: 'First Capital Financial',
    });

    expect(model.source).toBe('first_capital_local_synthetic_fallback');
    expect(model.rowCounts).toMatchObject({
      initiatives: 12,
      usage: 7,
      productivity: 8,
      agents: 17,
      benefits: 13,
      spend: 12,
      risks: 27,
      actions: 10,
      evidence: 25,
    });

    expect(model.kpis.map((kpi) => [kpi.key, kpi.value])).toEqual([
      ['initiatives', '12'],
      ['value', '$34.5M'],
      ['spend', '$71.9M'],
      ['adoption', '67%'],
      ['evidence', '21'],
    ]);

    expect(model.initiatives.every((initiative) => initiative.functionName !== 'Unassigned')).toBe(true);
    expect(model.functions.find((fn) => fn.name === 'Unassigned')?.risks ?? 0).toBe(0);
  });

  it('keeps benefit, spend, and risk rows attached to their source initiatives and functions', async () => {
    const model = await getAiControlTowerReadModel({
      clientKey: 'first-capital',
      tenantName: 'First Capital Financial',
    });

    expect(model.initiatives.find((initiative) => initiative.id === 'FCF-INIT-004')).toMatchObject({
      title: 'Fraud Graph Analytics v2',
      functionName: 'Risk & Compliance',
      promisedUsd: 28600000,
      realizedPct: 91,
    });

    expect(model.spend.find((row) => row.initiativeId === 'FCF-INIT-001')).toMatchObject({
      functionName: 'Operations',
      vendor: 'ACI Worldwide | The Clearing House',
      annualizedSpendUsd: 18_600_000,
    });

    expect(model.risks.find((risk) => risk.id === 'FCF-AIRSK-002')).toMatchObject({
      functionName: 'Human Resources',
      severity: 'medium',
    });
    expect(model.risks.find((risk) => risk.id === 'FCF-AIRSK-003')).toMatchObject({
      functionName: 'Finance & Accounting',
      severity: 'high',
    });
    expect(model.risks.find((risk) => risk.id === 'FCF-AIRSK-008')).toMatchObject({
      initiativeId: 'FCF-INIT-010',
      functionName: 'Technology',
    });
  });
});

import {
  emptyAiControlTowerReadModel,
  getAiControlTowerReadModel,
} from '../read-model';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: jest.fn(async () => null),
    select: jest.fn(async () => []),
  },
}));

describe('ai-control-tower read model', () => {
  it('keeps an unloaded tenant honest', () => {
    const model = emptyAiControlTowerReadModel({
      clientId: 'client-empty',
      clientKey: 'empty',
      tenantName: 'Empty Client',
    });

    expect(model.source).toBe('empty');
    expect(model.rowCounts.initiatives).toBe(0);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.tone).toBe('red');
    expect(model.kpis.find((kpi) => kpi.key === 'evidence')?.tone).toBe('red');
  });

  it('normalizes the First Capital synthetic substrate when data-plane rows are not present', async () => {
    const model = await getAiControlTowerReadModel({
      clientId: 'client-firstcapital',
      clientKey: 'firstcapital',
      tenantName: 'First Capital Financial',
    });

    expect(model.source).toBe('first_capital_local_synthetic_fallback');
    expect(model.rowCounts.initiatives).toBeGreaterThan(0);
    expect(model.rowCounts.spend).toBeGreaterThan(0);
    expect(model.rowCounts.risks).toBeGreaterThan(0);
    expect(model.functions.some((row) => row.name === 'Technology')).toBe(true);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.value).not.toBe('$0');
  });
});

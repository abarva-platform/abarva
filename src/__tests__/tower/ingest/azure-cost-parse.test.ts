import {
  parseAzureCostRow,
  parseAzureCostRows,
  parseAzureCostCsv,
  AZURE_COST_HEADERS,
} from '@/lib/tower/ingest/azure-cost/parse';

describe('azure-cost parser', () => {
  const goodRaw = {
    subscription_id: '00000000-0000-0000-0000-0000000a0001',
    resource_group: 'rg-ecom-prod-eus',
    resource_name: 'ca-storefront-eus',
    service: 'Container Apps',
    tag_program: 'pgm-ecom',
    tag_environment: 'prod',
    period_start: '2026-04-01',
    period_end: '2026-04-30',
    monthly_cost_usd: '4820.55',
    currency: 'USD',
    meter_category: 'Compute',
    location: 'eastus',
  };

  it('parses a clean row', () => {
    const result = parseAzureCostRow(goodRaw, 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.row.monthlyCostUsd).toBeCloseTo(4820.55);
      expect(result.row.tagProgram).toBe('pgm-ecom');
      expect(result.row.currency).toBe('USD');
    }
  });

  it('rolls a missing tag_program into __untagged__', () => {
    const result = parseAzureCostRow({ ...goodRaw, tag_program: '' }, 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.row.tagProgram).toBe('__untagged__');
  });

  it('rejects non-USD currency', () => {
    const result = parseAzureCostRow({ ...goodRaw, currency: 'EUR' }, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.field === 'currency')).toBe(true);
  });

  it('rejects negative cost', () => {
    const result = parseAzureCostRow({ ...goodRaw, monthly_cost_usd: '-1' }, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.field === 'monthly_cost_usd')).toBe(true);
  });

  it('rejects non-numeric cost', () => {
    const result = parseAzureCostRow({ ...goodRaw, monthly_cost_usd: 'NaN-ish' }, 1);
    expect(result.ok).toBe(false);
  });

  it('rejects malformed dates', () => {
    const result = parseAzureCostRow({ ...goodRaw, period_start: '04/01/2026' }, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.field === 'period_start')).toBe(true);
  });

  it('rejects period_end before period_start', () => {
    const result = parseAzureCostRow({ ...goodRaw, period_end: '2026-03-15' }, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.field === 'period_end')).toBe(true);
  });

  it('requires subscription_id and resource_group', () => {
    const result = parseAzureCostRow({ ...goodRaw, subscription_id: '', resource_group: '' }, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.field === 'subscription_id')).toBe(true);
      expect(result.issues.some((i) => i.field === 'resource_group')).toBe(true);
    }
  });

  it('parses comma-separated numbers', () => {
    const result = parseAzureCostRow({ ...goodRaw, monthly_cost_usd: '12,345.67' }, 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.row.monthlyCostUsd).toBeCloseTo(12345.67);
  });

  it('parseAzureCostRows separates good rows from issues', () => {
    const out = parseAzureCostRows([goodRaw, { ...goodRaw, currency: 'EUR' }, goodRaw]);
    expect(out.rows.length).toBe(2);
    expect(out.issues.length).toBeGreaterThan(0);
  });

  it('parseAzureCostCsv flags missing headers', () => {
    const csv = 'subscription_id,resource_group,period_start\nfoo,bar,2026-04-01\n';
    const out = parseAzureCostCsv(csv);
    expect(out.rows.length).toBe(0);
    expect(out.issues.length).toBeGreaterThan(0);
  });

  it('parseAzureCostCsv handles a well-formed CSV', () => {
    const headers = AZURE_COST_HEADERS.join(',');
    const row = [
      '00000000-0000-0000-0000-0000000a0001', 'rg-ecom-prod-eus', 'ca-storefront-eus',
      'Container Apps', 'pgm-ecom', 'prod', '2026-04-01', '2026-04-30',
      '4820.55', 'USD', 'Compute', 'eastus',
    ].join(',');
    const csv = `${headers}\n${row}\n`;
    const out = parseAzureCostCsv(csv);
    expect(out.issues).toEqual([]);
    expect(out.rows.length).toBe(1);
    expect(out.rows[0].tagProgram).toBe('pgm-ecom');
  });
});

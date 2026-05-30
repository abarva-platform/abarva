import { validateAzureCostRows, validateParseResult } from '@/lib/tower/ingest/azure-cost/validate';
import { parseAzureCostRows, type AzureCostRow } from '@/lib/tower/ingest/azure-cost/parse';
import { generateSampleRows } from '@/lib/tower/ingest/azure-cost/sample';

function baseRow(overrides: Partial<AzureCostRow> = {}): AzureCostRow {
  return {
    subscriptionId: '00000000-0000-0000-0000-0000000a0001',
    resourceGroup: 'rg-ecom-prod-eus',
    resourceName: 'ca-storefront-eus',
    service: 'Container Apps',
    tagProgram: 'pgm-ecom',
    tagEnvironment: 'prod',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    monthlyCostUsd: 4820.55,
    currency: 'USD',
    meterCategory: 'Compute',
    location: 'eastus',
    ...overrides,
  };
}

describe('azure-cost validator', () => {
  it('passes a clean batch', () => {
    const report = validateAzureCostRows([baseRow(), baseRow({ resourceName: 'pg-ecom' })]);
    expect(report.ok).toBe(true);
    expect(report.errorCount).toBe(0);
    expect(report.warnings.length).toBe(0);
  });

  it('warns on > 5% untagged share', () => {
    const rows = Array.from({ length: 10 }, (_, i) => baseRow({
      resourceName: `r${i}`,
      tagProgram: i < 2 ? '__untagged__' : 'pgm-ecom',
    }));
    const report = validateAzureCostRows(rows);
    expect(report.warnings.some((w) => w.code === 'untagged_share_high')).toBe(true);
    expect(report.untaggedShare).toBeCloseTo(0.2);
  });

  it('warns on large monthly cost outliers', () => {
    const report = validateAzureCostRows([baseRow({ monthlyCostUsd: 250_000 })]);
    expect(report.warnings.some((w) => w.code === 'large_monthly_cost')).toBe(true);
  });

  it('warns on non-month-start period_start', () => {
    const report = validateAzureCostRows([baseRow({ periodStart: '2026-04-15' })]);
    expect(report.warnings.some((w) => w.code === 'non_month_start')).toBe(true);
  });

  it('warns on duplicate natural keys', () => {
    const a = baseRow();
    const b = baseRow();
    const report = validateAzureCostRows([a, b]);
    expect(report.warnings.some((w) => w.code === 'duplicate_key')).toBe(true);
  });

  it('reports totals and dimensions', () => {
    const report = validateAzureCostRows([
      baseRow({ monthlyCostUsd: 100, tagProgram: 'pgm-ecom' }),
      baseRow({ resourceName: 'r2', monthlyCostUsd: 200, tagProgram: 'pgm-supply' }),
      baseRow({ subscriptionId: 'sub-2', resourceName: 'r3', monthlyCostUsd: 300, periodStart: '2026-05-01', periodEnd: '2026-05-31' }),
    ]);
    expect(report.totalUsd).toBeCloseTo(600);
    expect(report.programs).toBeGreaterThanOrEqual(2);
    expect(report.subscriptions).toBe(2);
    expect(report.months).toBe(2);
  });

  it('validateParseResult marks failure if parser had issues', () => {
    const parsed = parseAzureCostRows([
      { subscription_id: '', resource_group: '', period_start: 'bad' } as never,
    ]);
    const report = validateParseResult(parsed);
    expect(report.ok).toBe(false);
    expect(report.errorCount).toBeGreaterThan(0);
  });

  it('validates the synthetic sample cleanly (no errors, expected scale)', () => {
    const rows = generateSampleRows();
    const report = validateAzureCostRows(rows);
    expect(report.ok).toBe(true);
    expect(report.errorCount).toBe(0);
    expect(report.rowCount).toBeGreaterThan(1500);
    expect(report.rowCount).toBeLessThan(2500);
    expect(report.subscriptions).toBe(5);
    expect(report.months).toBe(12);
    // Some untagged rows are intentional in the synthetic data.
    expect(report.programs).toBeGreaterThanOrEqual(5);
  });
});

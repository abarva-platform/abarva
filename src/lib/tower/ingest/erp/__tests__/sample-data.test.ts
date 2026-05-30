// Tower · ERP ingest · synthetic dataset properties.

import { buildSyntheticNorthwindDataset, SYNTHETIC_BANNER } from '../sample-data';

describe('buildSyntheticNorthwindDataset', () => {
  it('produces 30 vendors and 12 monthly periods per program', () => {
    const ds = buildSyntheticNorthwindDataset({ programCount: 75 });
    expect(ds.vendors).toHaveLength(30);
    expect(ds.financials).toHaveLength(75 * 12);
  });

  it('is deterministic for a given seed', () => {
    const a = buildSyntheticNorthwindDataset({ programCount: 50, seed: 42 });
    const b = buildSyntheticNorthwindDataset({ programCount: 50, seed: 42 });
    expect(a.financials[0]).toEqual(b.financials[0]);
    expect(a.vendors[0]).toEqual(b.vendors[0]);
  });

  it('respects capex + opex ≤ actual on every financial row', () => {
    const ds = buildSyntheticNorthwindDataset({ programCount: 60 });
    for (const f of ds.financials) {
      expect(f.actual_usd).not.toBeNull();
      const sum = (f.capex_usd ?? 0) + (f.opex_usd ?? 0);
      expect(sum).toBeLessThanOrEqual((f.actual_usd ?? 0) + 1);
    }
  });

  it('keeps actual within ±15% of budget', () => {
    const ds = buildSyntheticNorthwindDataset({ programCount: 60 });
    for (const f of ds.financials) {
      const budget = f.budget_usd ?? 0;
      const actual = f.actual_usd ?? 0;
      // 0.85*budget - 0.01 (rounding) ≤ actual ≤ 1.15*budget + 0.01
      expect(actual).toBeGreaterThanOrEqual(budget * 0.85 - 1);
      expect(actual).toBeLessThanOrEqual(budget * 1.15 + 1);
    }
  });

  it('clamps program count to the documented 50-200 range', () => {
    const lo = buildSyntheticNorthwindDataset({ programCount: 10 });
    const hi = buildSyntheticNorthwindDataset({ programCount: 999 });
    expect(lo.financials.length).toBe(50 * 12);
    expect(hi.financials.length).toBe(200 * 12);
  });

  it('exposes a synthetic banner constant', () => {
    expect(SYNTHETIC_BANNER).toMatch(/SYNTHETIC/i);
    expect(SYNTHETIC_BANNER).toMatch(/Northwind/i);
  });
});

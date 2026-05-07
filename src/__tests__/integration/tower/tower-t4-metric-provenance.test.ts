// TOWER · T-4 — Metric provenance view-model unit tests.
//
// Pure deterministic coverage of metric-provenance.ts.
// No React rendering, no DOM, no model calls.

import {
  listTowerMetricProvenance,
  getTowerMetricProvenance,
  complexityLabel,
  sourceAllowsLabel,
  type MetricProvenanceKey,
} from '@/lib/tower/metric-provenance';

describe('listTowerMetricProvenance', () => {
  it('returns exactly five panels (one per Tower CFO band tile)', () => {
    expect(listTowerMetricProvenance()).toHaveLength(5);
  });

  it('panels appear in band-tile order', () => {
    expect(listTowerMetricProvenance().map((p) => p.key)).toEqual([
      'portfolio_roi',
      'active_pressures',
      'spend_at_risk',
      'renewals_90d',
      'adoption_rate',
    ]);
  });

  it('every panel has all four sections populated', () => {
    for (const panel of listTowerMetricProvenance()) {
      expect(panel.metricLabel.length).toBeGreaterThan(0);
      expect(panel.calculation.length).toBeGreaterThan(0);
      expect(panel.day1.templateField.length).toBeGreaterThan(0);
      expect(panel.day1.sourceTemplate.length).toBeGreaterThan(0);
      expect(panel.dayN.target.length).toBeGreaterThan(0);
      expect(['easy', 'medium', 'hard']).toContain(panel.dayN.complexity);
      expect(panel.sourceAllows.explanation.length).toBeGreaterThan(0);
      expect(panel.lastRefreshed.length).toBeGreaterThan(0);
    }
  });

  it('day-1 templateField references real registry fields for portfolio ROI', () => {
    const panel = getTowerMetricProvenance('portfolio_roi');
    expect(panel?.day1.templateField).toMatch(/measured_value_usd/);
    expect(panel?.day1.templateField).toMatch(/committed_annual_usd/);
  });
});

describe('getTowerMetricProvenance', () => {
  it.each<MetricProvenanceKey>([
    'portfolio_roi',
    'active_pressures',
    'spend_at_risk',
    'renewals_90d',
    'adoption_rate',
  ])('returns a panel for %s', (key) => {
    expect(getTowerMetricProvenance(key)).not.toBeNull();
    expect(getTowerMetricProvenance(key)?.key).toBe(key);
  });

  it('is pure — same key yields identical object reference each call', () => {
    const a = getTowerMetricProvenance('portfolio_roi');
    const b = getTowerMetricProvenance('portfolio_roi');
    expect(a).toBe(b);
  });
});

describe('complexityLabel', () => {
  it('maps each tier to its plain-English label', () => {
    expect(complexityLabel('easy')).toBe('easy');
    expect(complexityLabel('medium')).toBe('medium');
    expect(complexityLabel('hard')).toBe('hard');
  });
});

describe('sourceAllowsLabel', () => {
  it('marks customer-owned and universal as ✅', () => {
    expect(sourceAllowsLabel('universal')).toContain('✅');
    expect(sourceAllowsLabel('customer_owned')).toContain('✅');
  });

  it('marks per-tool variation as ⚠️', () => {
    expect(sourceAllowsLabel('per_tool_varies')).toContain('⚠️');
  });

  it('marks restricted as ❌', () => {
    expect(sourceAllowsLabel('restricted')).toContain('❌');
  });
});

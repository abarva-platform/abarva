// TOWER · T-4 — Deferred metrics manifest unit tests.
//
// Pure deterministic coverage of deferred-metrics.ts.

import { listDeferredMetrics } from '@/lib/tower/deferred-metrics';

describe('listDeferredMetrics', () => {
  it('returns exactly 5 deferred metrics for tower-cfo (per Load Path Manifest v1.0.0)', () => {
    expect(listDeferredMetrics('tower-cfo')).toHaveLength(5);
  });

  it('returns exactly 5 deferred metrics for cio', () => {
    expect(listDeferredMetrics('cio')).toHaveLength(5);
  });

  it('includes the four risk-component deferrals + one adoption deferral', () => {
    const keys = listDeferredMetrics('tower-cfo').map((m) => m.key);
    expect(keys).toEqual([
      'ai_assisted_workflows_pct',
      'bias_reviews_complete',
      'drift_alerts',
      'phi_incidents',
      'audit_trail_coverage_pct',
    ]);
  });

  it('every metric has a label and a comingWhen prerequisite', () => {
    for (const m of listDeferredMetrics('tower-cfo')) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.comingWhen.length).toBeGreaterThan(0);
    }
  });

  it('groups four metrics under the risk component', () => {
    const riskMetrics = listDeferredMetrics('tower-cfo').filter((m) => m.component === 'risk');
    expect(riskMetrics).toHaveLength(4);
  });

  it('groups one metric under the adoption component', () => {
    const adoptionMetrics = listDeferredMetrics('tower-cfo').filter(
      (m) => m.component === 'adoption',
    );
    expect(adoptionMetrics).toHaveLength(1);
  });

  it('comingWhen for bias_reviews mentions Credo AI / Fiddler', () => {
    const bias = listDeferredMetrics('tower-cfo').find((m) => m.key === 'bias_reviews_complete');
    expect(bias?.comingWhen).toMatch(/Credo AI|Fiddler/);
  });
});

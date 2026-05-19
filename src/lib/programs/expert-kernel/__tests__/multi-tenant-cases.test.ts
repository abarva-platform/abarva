// Multi-tenant Expert Kernel anchors + the tenant-switchable Expert Review
// Console registry.
//
// The kernel was first proven on one tenant (Apex). These tests pin the two
// new grounded anchors — Meridian Health System and First Capital Financial —
// and assert the console registry resolves all three. Each anchor must render
// grounded: real audited baselines surfaced, declared seed gaps surfaced as
// missing evidence, no fabricated numbers, and the haircut/critic honest about
// whether the case pays back.

import { buildMeridianAmbientClinicalCase } from '../meridian-ambient-clinical-case';
import { buildFirstCapitalFraudDetectionCase } from '../firstcapital-fraud-detection-case';
import { buildExpertReviewConsole } from '../expert-review-console';
import {
  EXPERT_REVIEW_CASES,
  EXPERT_REVIEW_CASE_IDS,
  resolveExpertReviewCase,
  isExpertReviewCaseId,
  DEFAULT_EXPERT_REVIEW_CASE_ID,
} from '../expert-review-cases';

describe('Meridian Ambient Clinical anchor — grounded render', () => {
  const { skeleton } = buildMeridianAmbientClinicalCase();
  const view = buildExpertReviewConsole(skeleton, []);

  it('renders the Meridian Move scoped to the Meridian tenant', () => {
    expect(view.moveName).toBe('Ambient Clinical Value Chain Activation');
    expect(view.tenantKey).toBe('meridian-health');
  });

  it('surfaces the real audited baselines from the evidence base', () => {
    const byKey = new Map(
      skeleton.baseline.recordedMetrics.map((m) => [m.key, m.value]),
    );
    // Real, source-cited baselines — pajama time 2h09m, MBI-HSS 54%,
    // HCC capture 58%, CDI volume 40/wk, quality-measure capture 34%.
    expect(byKey.get('pajama_time_minutes')).toBe(129);
    expect(byKey.get('mbi_hss_emotional_exhaustion_pct')).toBe(54);
    expect(byKey.get('hcc_capture_pct')).toBe(58);
    expect(byKey.get('cdi_query_volume_weekly')).toBe(40);
    expect(byKey.get('quality_measure_capture_pct')).toBe(34);
    // Every recorded metric carries a source citation — none fabricated.
    expect(
      skeleton.baseline.recordedMetrics.every((m) => m.source.trim().length > 0),
    ).toBe(true);
  });

  it('declares the three modeled coefficients as seed gaps, never invented', () => {
    expect(view.missingEvidence.length).toBe(3);
    expect(view.missingEvidence.every((m) => m.value === null)).toBe(true);
    expect(view.missingEvidence.every((m) => !!m.seedGapReason)).toBe(true);
    const gapKeys = view.missingEvidence.map((m) => m.key).sort();
    expect(gapKeys).toEqual([
      'cost_per_clinician_hour_usd',
      'locum_avoidance_basis_usd',
      'raf_to_revenue_coefficient_usd',
    ]);
  });

  it('refuses to monetise — the seed gaps block payback honestly', () => {
    // The gross value rests on three modeled coefficients (seed gaps), so the
    // kernel returns no payback rather than a fabricated return.
    expect(skeleton.economics.monetisable).toBe(false);
    expect(skeleton.economics.paybackMonths).toBeNull();
    // A monetisation blocker is a critic blocker; the case lands at "shape".
    expect(skeleton.critic.hasBlocker).toBe(true);
    expect(skeleton.recommendation).toBe('shape');
  });
});

describe('First Capital Fraud Detection anchor — grounded render', () => {
  const { skeleton } = buildFirstCapitalFraudDetectionCase();
  const view = buildExpertReviewConsole(skeleton, []);

  it('renders the First Capital Move scoped to the First Capital tenant', () => {
    expect(view.moveName).toBe('Fraud Detection Enhancement');
    expect(view.tenantKey).toBe('first-capital');
  });

  it('surfaces the real audited baselines from the KPI dictionary', () => {
    const byKey = new Map(
      skeleton.baseline.recordedMetrics.map((m) => [m.key, m.value]),
    );
    // Real, source-cited baselines from the First Capital KPI dictionary.
    expect(byKey.get('card_fraud_losses_usd')).toBe(2_100_000);
    expect(byKey.get('card_fraud_peer_median_usd')).toBe(1_200_000);
    expect(byKey.get('annual_fraud_losses_usd')).toBe(7_000_000);
    expect(byKey.get('aml_false_positive_pct')).toBe(94);
    expect(byKey.get('automated_disposition_pct')).toBe(34);
    expect(byKey.get('sar_past_deadline_pct')).toBe(8);
    expect(byKey.get('program_investment_usd')).toBe(1_800_000);
    expect(
      skeleton.baseline.recordedMetrics.every((m) => m.source.trim().length > 0),
    ).toBe(true);
  });

  it('declares the three operational cost bases as seed gaps', () => {
    expect(view.missingEvidence.length).toBe(3);
    expect(view.missingEvidence.every((m) => m.value === null)).toBe(true);
    expect(view.missingEvidence.every((m) => !!m.seedGapReason)).toBe(true);
    const gapKeys = view.missingEvidence.map((m) => m.key).sort();
    expect(gapKeys).toEqual([
      'alert_volume_annual',
      'false_positive_operational_cost_usd',
      'fraud_analyst_fte_cost_usd',
    ]);
  });

  it('comes back kill — the should-cost effort exceeds the haircut value', () => {
    // Card fraud loss-avoidance has a hard $0.9M/yr ceiling ($2.1M → $1.2M).
    // The kernel's should-cost effort exceeds the haircut net value, so the
    // base-case net return is negative — the kernel honestly says kill.
    expect(skeleton.economics.monetisable).toBe(false);
    expect(skeleton.economics.netReturn.point).toBeLessThan(0);
    expect(skeleton.recommendation).toBe('kill');
  });
});

describe('no anchor fabricates a number', () => {
  it('every seed-gap metric across both anchors has a null value + a reason', () => {
    for (const build of [
      buildMeridianAmbientClinicalCase,
      buildFirstCapitalFraudDetectionCase,
    ]) {
      const { skeleton } = build();
      for (const gap of skeleton.baseline.seedGaps) {
        expect(gap.value).toBeNull();
        expect(gap.sourceQuality).toBe('absent');
        expect(gap.seedGapReason && gap.seedGapReason.length).toBeGreaterThan(0);
      }
      // Every recorded metric has a usable value and a non-empty source.
      for (const rec of skeleton.baseline.recordedMetrics) {
        expect(rec.value).not.toBeNull();
        expect(rec.source.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Expert Review Console case registry', () => {
  it('resolves all three kernel-anchored tenants', () => {
    expect(EXPERT_REVIEW_CASE_IDS).toEqual(['apexretail', 'meridian', 'arcturus']);
    for (const id of EXPERT_REVIEW_CASE_IDS) {
      const entry = EXPERT_REVIEW_CASES[id];
      expect(entry.id).toBe(id);
      expect(entry.tenantKey.length).toBeGreaterThan(0);
      expect(entry.moveRef.length).toBeGreaterThan(0);
      // The build function runs the kernel and returns a grounded skeleton.
      const { skeleton } = entry.buildCase();
      expect(skeleton.moveName.length).toBeGreaterThan(0);
      expect(skeleton.baseline.recordedMetrics.length).toBeGreaterThan(0);
    }
  });

  it('maps each case id to a distinct tenant and Move ref', () => {
    const tenantKeys = EXPERT_REVIEW_CASE_IDS.map(
      (id) => EXPERT_REVIEW_CASES[id].tenantKey,
    );
    const moveRefs = EXPERT_REVIEW_CASE_IDS.map(
      (id) => EXPERT_REVIEW_CASES[id].moveRef,
    );
    expect(new Set(tenantKeys).size).toBe(3);
    expect(new Set(moveRefs).size).toBe(3);
  });

  it('defaults to the Apex case for an unknown or absent selector', () => {
    expect(resolveExpertReviewCase('meridian').id).toBe('meridian');
    expect(resolveExpertReviewCase('arcturus').id).toBe('arcturus');
    expect(resolveExpertReviewCase('nonsense').id).toBe(DEFAULT_EXPERT_REVIEW_CASE_ID);
    expect(resolveExpertReviewCase(null).id).toBe(DEFAULT_EXPERT_REVIEW_CASE_ID);
    expect(resolveExpertReviewCase(undefined).id).toBe('apexretail');
  });

  it('isExpertReviewCaseId guards the three known ids', () => {
    expect(isExpertReviewCaseId('apexretail')).toBe(true);
    expect(isExpertReviewCaseId('meridian')).toBe(true);
    expect(isExpertReviewCaseId('arcturus')).toBe(true);
    expect(isExpertReviewCaseId('apex-retail')).toBe(false);
    expect(isExpertReviewCaseId(42)).toBe(false);
  });
});

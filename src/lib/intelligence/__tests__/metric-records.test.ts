import { loadCorpus } from '@/lib/intelligence/loader';
import {
  METRIC_RECORDS,
  getMetricRecordById,
  getMetricRecordsByIndustryDomain,
  getTier1MetricRecords,
  summarizeMetricCoverage,
  validateMetricRecords,
} from '@/lib/intelligence/metric-records';

describe('PAT-MET metric corpus foundation', () => {
  it('validates the initial structured metric records', () => {
    expect(() => validateMetricRecords()).not.toThrow();
  });

  it('starts with balanced tier-1 coverage across the three pilot industries and domains', () => {
    const coverage = summarizeMetricCoverage();

    expect(coverage.total).toBe(18);
    expect(coverage.verifiedOrLocked).toBe(18);
    expect(coverage.byIndustry).toEqual({
      specialty_retail: 6,
      healthcare_idn: 6,
      financial_services: 6,
    });
    expect(coverage.byDomain).toEqual({
      front_office: 6,
      middle_office: 6,
      back_office: 6,
    });
  });

  it('uses the reserved PAT-MET id blocks from the authoring brief', () => {
    const retail = getMetricRecordsByIndustryDomain('specialty_retail', 'middle_office');
    const healthcare = getMetricRecordsByIndustryDomain('healthcare_idn', 'middle_office');
    const finserv = getMetricRecordsByIndustryDomain('financial_services', 'middle_office');

    expect(retail.map((record) => record.id)).toEqual(['PAT-MET-003', 'PAT-MET-004']);
    expect(healthcare.map((record) => record.id)).toEqual(['PAT-MET-203', 'PAT-MET-204']);
    expect(finserv.map((record) => record.id)).toEqual(['PAT-MET-403', 'PAT-MET-404']);
  });

  it('includes healthcare depth markers for prior auth, coding, clinical workflow, and RCM', () => {
    expect(getMetricRecordById('PAT-MET-201')?.theme).toBe('patient_access_prior_auth');
    expect(getMetricRecordById('PAT-MET-203')?.theme).toBe('coding_quality_cdi');
    expect(getMetricRecordById('PAT-MET-204')?.vendorLandscape.map((entry) => entry.vendorName)).toContain(
      'Epic BestPractice Advisories',
    );
    expect(getMetricRecordById('PAT-MET-205')?.theme).toBe('revenue_cycle_denials');
  });

  it('loads metric records into the canonical corpus index', () => {
    const corpus = loadCorpus({ loadedAt: '2026-05-02T00:00:00.000Z' });

    expect(corpus.metrics).toHaveLength(METRIC_RECORDS.length);
    expect(corpus.metricsById.get('PAT-MET-003')?.name).toBe('Forecast accuracy at SKU-week');
    expect(corpus.byId.get('PAT-MET-205')?.id).toBe('PAT-MET-205');
  });

  it('marks every initial metric as tier 1 and retrievable by default maturity', () => {
    const tier1 = getTier1MetricRecords();

    expect(tier1).toHaveLength(METRIC_RECORDS.length);
    expect(tier1.every((record) => record.priorityTier === 'tier_1')).toBe(true);
    expect(tier1.every((record) => record.maturityStatus === 'verified')).toBe(true);
  });
});

import {
  buildCommercialReadinessViewModel,
  SourceCommercialReadinessCheck,
  SourceCommercialReadinessViewModel,
} from '../../../lib/source/source-commercial-readiness';
import { SourceCommercialReadinessView } from '../../../components/source/SourceCommercialReadinessView';

const EXPECTED_CHECK_IDS = [
  'pricing-normalized',
  'risks-assessed',
  'bafo-strategy',
  'vendor-comparison',
  'evidence-basis',
  'executive-ready',
];

const VALID_OVERALL_STATUSES: SourceCommercialReadinessViewModel['overallStatus'][] = [
  'ready',
  'partial',
  'not-ready',
];

describe('buildCommercialReadinessViewModel - type shape', () => {
  it('returns exactly 6 checks', () => {
    const vm = buildCommercialReadinessViewModel('rfp-test', []);
    expect(vm.checks).toHaveLength(6);
  });

  it('checks array has the correct checkIds in order', () => {
    const vm = buildCommercialReadinessViewModel('rfp-test', ['vendor-a', 'vendor-b']);
    const ids = vm.checks.map((c: SourceCommercialReadinessCheck) => c.checkId);
    expect(ids).toEqual(EXPECTED_CHECK_IDS);
  });

  it('readyCount + missing count sums to totalCount', () => {
    const vm = buildCommercialReadinessViewModel('rfp-test', ['vendor-a'], { towers: [] }, null, null);
    const readyCount = vm.checks.filter((c) => c.status === 'complete').length;
    const partialCount = vm.checks.filter((c) => c.status === 'partial').length;
    const missingCount = vm.checks.filter((c) => c.status === 'missing').length;
    expect(readyCount + partialCount + missingCount).toBe(vm.totalCount);
    expect(vm.totalCount).toBe(6);
  });

  it('readinessPercent is between 0 and 100 (inclusive)', () => {
    const empty = buildCommercialReadinessViewModel('rfp-empty', []);
    expect(empty.readinessPercent).toBeGreaterThanOrEqual(0);
    expect(empty.readinessPercent).toBeLessThanOrEqual(100);

    const full = buildCommercialReadinessViewModel(
      'rfp-full',
      ['vendor-a'],
      { pricing: true },
      { risks: [] },
      { bafo: true },
    );
    expect(full.readinessPercent).toBeGreaterThanOrEqual(0);
    expect(full.readinessPercent).toBeLessThanOrEqual(100);
  });

  it('overallStatus is one of the 3 valid values', () => {
    const vm = buildCommercialReadinessViewModel('rfp-test', ['vendor-a']);
    expect(VALID_OVERALL_STATUSES).toContain(vm.overallStatus);
  });

  it('generatedAt is exactly "2026-04-26"', () => {
    const vm = buildCommercialReadinessViewModel('rfp-test', []);
    expect(vm.generatedAt).toBe('2026-04-26');
  });

  it('caveat is a non-empty string', () => {
    const vm = buildCommercialReadinessViewModel('rfp-test', []);
    expect(typeof vm.caveat).toBe('string');
    expect(vm.caveat.length).toBeGreaterThan(0);
  });
});

describe('SourceCommercialReadinessView - export shape', () => {
  it('exports SourceCommercialReadinessView as a function', () => {
    expect(typeof SourceCommercialReadinessView).toBe('function');
  });
});

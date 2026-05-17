import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';
import {
  buildRenewalCockpit,
  type RenewalCockpitInput,
} from '../cockpit';

const AS_OF = new Date('2026-05-17T00:00:00Z');

function isoOffset(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: 'vc:test',
    vendorName: 'TestVendor',
    product: 'Test Product',
    category: 'crm',
    annualSpendUsd: 500_000,
    termEndDate: isoOffset(120),
    autoRenew: false,
    noticePeriodDays: null,
    utilizationRate: 0.9,
    criticality: 'medium',
    ...overrides,
  };
}

function cockpitInput(overrides: Partial<RenewalCockpitInput> = {}): RenewalCockpitInput {
  return {
    clientKey: 'apexretail',
    contract: contract(),
    categoryBenchmarkUsd: null,
    alternatives: [],
    asOf: AS_OF,
    ...overrides,
  };
}

describe('buildRenewalCockpit — posture derivation', () => {
  it('recommends EXIT for shelfware with material spend', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({ contract: contract({ utilizationRate: 0.3, annualSpendUsd: 410_000 }) }),
    );
    expect(cockpit.recommendedPosture).toBe('exit');
    expect(cockpit.postureRationale).toMatch(/does not earn its renewal/i);
  });

  it('recommends CONSOLIDATE for shelfware when an alternative exists', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ utilizationRate: 0.3 }),
        alternatives: [
          { vendorName: 'AltVendor', indicativeAnnualUsd: 300_000, switchingNote: 'ready' },
        ],
      }),
    );
    expect(cockpit.recommendedPosture).toBe('consolidate');
  });

  it('recommends REBID when over benchmark with a credible alternative', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ annualSpendUsd: 700_000, utilizationRate: 0.9 }),
        categoryBenchmarkUsd: 400_000,
        alternatives: [
          { vendorName: 'AltVendor', indicativeAnnualUsd: 420_000, switchingNote: 'ready' },
        ],
      }),
    );
    expect(cockpit.recommendedPosture).toBe('rebid');
  });

  it('recommends RENEGOTIATE when over benchmark with no alternative', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ annualSpendUsd: 700_000, utilizationRate: 0.9 }),
        categoryBenchmarkUsd: 400_000,
      }),
    );
    expect(cockpit.recommendedPosture).toBe('renegotiate');
  });

  it('recommends RENEGOTIATE when an auto-renewal notice window is closing', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({
          autoRenew: true,
          noticePeriodDays: 60,
          termEndDate: isoOffset(70),
          utilizationRate: 0.9,
        }),
      }),
    );
    expect(cockpit.recommendedPosture).toBe('renegotiate');
    expect(cockpit.timing.noticeWindowAtRisk).toBe(true);
  });

  it('recommends RENEW for a healthy, in-benchmark contract', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ annualSpendUsd: 380_000, utilizationRate: 0.9 }),
        categoryBenchmarkUsd: 400_000,
      }),
    );
    expect(cockpit.recommendedPosture).toBe('renew');
  });
});

describe('buildRenewalCockpit — evidence sections', () => {
  it('reuses the should-cost module and exposes a total range', () => {
    const cockpit = buildRenewalCockpit(cockpitInput());
    expect(cockpit.shouldCost.estimate.totalLow).toBeGreaterThan(0);
    expect(cockpit.shouldCost.estimate.totalHigh).toBeGreaterThanOrEqual(
      cockpit.shouldCost.estimate.totalLow,
    );
  });

  it('computes overspend vs benchmark when both are present', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ annualSpendUsd: 700_000 }),
        categoryBenchmarkUsd: 400_000,
      }),
    );
    expect(cockpit.shouldCost.overspendVsBenchmarkUsd).toBe(300_000);
  });

  it('reports shelfware estimate when utilization is low', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({ contract: contract({ utilizationRate: 0.4, annualSpendUsd: 500_000 }) }),
    );
    expect(cockpit.usage.isShelfware).toBe(true);
    expect(cockpit.usage.estimatedShelfwareUsd).toBeCloseTo(300_000);
  });

  it('is deterministic — identical input yields identical cockpit', () => {
    const a = buildRenewalCockpit(cockpitInput());
    const b = buildRenewalCockpit(cockpitInput());
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('hands leverage to the buyer when an alternative exists and timing is safe', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        alternatives: [
          { vendorName: 'AltVendor', indicativeAnnualUsd: 300_000, switchingNote: 'ready' },
        ],
      }),
    );
    expect(cockpit.leverage.leverageHolder).toBe('buyer');
  });
});

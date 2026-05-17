import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';
import {
  buildRenewalCockpit,
  type RenewalCockpitInput,
} from '../cockpit';
import { buildRenewalNegotiationBrief } from '../negotiation-brief';

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

describe('buildRenewalNegotiationBrief', () => {
  it('produces a brief flagged isBrief with the always-present blocks', () => {
    const brief = buildRenewalNegotiationBrief(buildRenewalCockpit(cockpitInput()));
    expect(brief.isBrief).toBe(true);
    expect(brief.dealLabel).toContain('TestVendor');
    expect(brief.walkAway.title.length).toBeGreaterThan(0);
    expect(brief.batna.title.length).toBeGreaterThan(0);
    expect(brief.levers.length).toBeGreaterThan(0);
    expect(brief.concessions.length).toBe(2);
  });

  it('surfaces the benchmark-gap lever when there is real overspend', () => {
    const brief = buildRenewalNegotiationBrief(
      buildRenewalCockpit(
        cockpitInput({
          contract: contract({ annualSpendUsd: 700_000 }),
          categoryBenchmarkUsd: 400_000,
        }),
      ),
    );
    expect(brief.levers.some((l) => /benchmark gap/i.test(l.title))).toBe(true);
  });

  it('does not surface a benchmark-gap lever when spend is within benchmark', () => {
    const brief = buildRenewalNegotiationBrief(
      buildRenewalCockpit(cockpitInput()),
    );
    expect(brief.levers.some((l) => /benchmark gap/i.test(l.title))).toBe(false);
  });

  it('uses a scouted alternative as the BATNA when one exists', () => {
    const brief = buildRenewalNegotiationBrief(
      buildRenewalCockpit(
        cockpitInput({
          alternatives: [
            {
              vendorName: 'RivalCo',
              indicativeAnnualUsd: 300_000,
              switchingNote: 'Deal-ready in the estate.',
            },
          ],
        }),
      ),
    );
    expect(brief.batna.title).toContain('RivalCo');
    expect(brief.levers.some((l) => /competitive tension/i.test(l.title))).toBe(true);
  });

  it('flags a thin BATNA when no alternative is scouted', () => {
    const brief = buildRenewalNegotiationBrief(buildRenewalCockpit(cockpitInput()));
    expect(brief.batna.title).toMatch(/thin/i);
  });

  it('adds a right-size lever for shelfware utilization', () => {
    const brief = buildRenewalNegotiationBrief(
      buildRenewalCockpit(
        cockpitInput({ contract: contract({ utilizationRate: 0.3 }) }),
      ),
    );
    expect(brief.levers.some((l) => /right-size/i.test(l.title))).toBe(true);
  });

  it('is deterministic for a fixed cockpit', () => {
    const cockpit = buildRenewalCockpit(cockpitInput());
    expect(buildRenewalNegotiationBrief(cockpit)).toEqual(
      buildRenewalNegotiationBrief(cockpit),
    );
  });
});

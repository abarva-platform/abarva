import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';
import {
  buildRenewalCockpit,
  type RenewalCockpitInput,
} from '../cockpit';
import { buildVendorEmailDraft } from '../vendor-email-draft';

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

describe('buildVendorEmailDraft', () => {
  it('produces a draft (never sends) flagged isDraft true', () => {
    const draft = buildVendorEmailDraft(buildRenewalCockpit(cockpitInput()));
    expect(draft.isDraft).toBe(true);
    expect(draft.subject).toContain('TestVendor');
    expect(draft.body.length).toBeGreaterThan(0);
  });

  it('writes from the recommended posture — renegotiation tone for over-benchmark', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ annualSpendUsd: 700_000 }),
        categoryBenchmarkUsd: 400_000,
      }),
    );
    const draft = buildVendorEmailDraft(cockpit);
    expect(draft.posture).toBe('renegotiate');
    expect(draft.body).toMatch(/revisit the commercial terms/i);
  });

  it('includes the benchmark gap only when there is a real overspend', () => {
    const overspend = buildVendorEmailDraft(
      buildRenewalCockpit(
        cockpitInput({
          contract: contract({ annualSpendUsd: 700_000 }),
          categoryBenchmarkUsd: 400_000,
        }),
      ),
    );
    expect(overspend.body).toMatch(/above a defensible category benchmark/i);

    const noBenchmark = buildVendorEmailDraft(
      buildRenewalCockpit(cockpitInput()),
    );
    expect(noBenchmark.body).not.toMatch(/above a defensible category benchmark/i);
  });

  it('names scouted alternatives only when posture is not a plain renew', () => {
    const cockpit = buildRenewalCockpit(
      cockpitInput({
        contract: contract({ annualSpendUsd: 700_000 }),
        categoryBenchmarkUsd: 400_000,
        alternatives: [
          { vendorName: 'RivalCo', indicativeAnnualUsd: 420_000, switchingNote: 'ready' },
        ],
      }),
    );
    const draft = buildVendorEmailDraft(cockpit);
    expect(draft.body).toContain('RivalCo');
  });

  it('never fabricates a price for an unpriced contract', () => {
    const draft = buildVendorEmailDraft(
      buildRenewalCockpit(
        cockpitInput({ contract: contract({ annualSpendUsd: null }) }),
      ),
    );
    expect(draft.body).not.toMatch(/current annual spend on this contract is \$/i);
  });

  it('is deterministic for a fixed cockpit', () => {
    const cockpit = buildRenewalCockpit(cockpitInput());
    expect(buildVendorEmailDraft(cockpit)).toEqual(buildVendorEmailDraft(cockpit));
  });
});

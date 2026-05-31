import { buildPricingTierLockClause } from '../bafo-counter-templates';

describe('buildPricingTierLockClause', () => {
  it('renders a pricing-tier lock when projected usage breaches a ladder within 24 months', () => {
    const clause = buildPricingTierLockClause({
      vendorId: 'vendor:apex:adobe',
      vendorName: 'Adobe',
      generatedAt: '2026-05-31',
      inferenceEconomics: {
        perCallUsd: 0.02,
        pricingTierLadder: [{ thresholdCallsPerMonth: 250_000, perCallUsd: 0.028 }],
        repricingClauseText: null,
        repricingNoticeDays: null,
        volumeLockExpiresOn: '2027-12',
        contractCeilingUsdPerYear: null,
        asOf: '2026-05-31',
      },
      projectedCallRamp: [
        { month: '2026-10', callsPerMonth: 100_000 },
        { month: '2027-03', callsPerMonth: 260_000 },
      ],
    });

    expect(clause).toMatchObject({
      clauseKey: 'pricingTierLock',
      breachThresholdCallsPerMonth: 250_000,
      projectedBreachMonth: '2027-03',
      peerProvenance: ['Peer A', 'Peer B'],
    });
    expect(clause?.clauseText).toContain(
      "pricing tier breach requires 90 days' notice and 30-day re-negotiation window",
    );
  });

  it('does not render when the projected breach is outside the 24-month window', () => {
    const clause = buildPricingTierLockClause({
      vendorId: 'vendor:apex:adobe',
      vendorName: 'Adobe',
      generatedAt: '2026-05-31',
      inferenceEconomics: {
        perCallUsd: 0.02,
        pricingTierLadder: [{ thresholdCallsPerMonth: 250_000, perCallUsd: 0.028 }],
        repricingClauseText: null,
        repricingNoticeDays: null,
        volumeLockExpiresOn: null,
        contractCeilingUsdPerYear: null,
        asOf: '2026-05-31',
      },
      projectedCallRamp: [{ month: '2028-08', callsPerMonth: 260_000 }],
    });

    expect(clause).toBeNull();
  });
});

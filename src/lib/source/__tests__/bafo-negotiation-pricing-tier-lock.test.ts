import {
  buildSourceBafoNegotiationPlan,
  formatSourceBafoNegotiationAsMarkdown,
} from '../bafo-negotiation';
import type { SourceBafoNegotiationInput } from '../bafo-negotiation-types';

const baseInput: SourceBafoNegotiationInput = {
  generatedAt: '2026-05-31T00:00:00.000Z',
  event: {
    id: 'apex-adobe-cdp-bafo',
    name: 'Apex Adobe CDP BAFO',
    currentStageKey: 'bafo',
    vendorResponses: [
      {
        vendorId: 'vendor:apex:adobe',
        vendorName: 'Adobe',
        responseStatus: 'submitted',
        receivedAt: '2026-05-30',
        requiredSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Transition plan',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        submittedSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Transition plan',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        assumptions: [],
        exclusions: [],
        pricingTemplateStatus: 'complete',
        transitionPlanStatus: 'complete',
        securityResponseStatus: 'complete',
        automationRoadmapStatus: 'complete',
        evidenceStatus: 'Loaded',
        evidenceUsability: 'usable',
        responseRiskLevel: 'low',
      },
    ],
    vendorInferencePricing: [
      {
        vendorId: 'vendor:apex:adobe',
        vendorName: 'Adobe',
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
          { month: '2026-12', callsPerMonth: 180_000 },
          { month: '2027-03', callsPerMonth: 260_000 },
        ],
      },
    ],
  },
};

describe('Source BAFO pricing-tier lock', () => {
  it('adds the pricing-tier-lock counter clause to the BAFO plan and markdown rendering', () => {
    const plan = buildSourceBafoNegotiationPlan(baseInput);
    const markdown = formatSourceBafoNegotiationAsMarkdown(plan);

    expect(plan.counterClauses).toHaveLength(1);
    expect(plan.vendorNegotiationPlans[0]?.counterClauses[0]).toMatchObject({
      title: 'Pricing-tier lock',
      peerProvenance: ['Peer A', 'Peer B'],
      projectedBreachMonth: '2027-03',
    });
    expect(markdown).toContain('Pricing-tier lock');
    expect(markdown).toContain('Peer provenance: Peer A, Peer B');
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  adaptBafoNegotiationToCommercialSignals,
  adaptCommercialRisksToCommercialSignals,
  adaptPricingNormalizationToCommercialSignals,
  buildSourceCommercialAgentMissions,
  buildSourceBafoNegotiationPlan,
  buildSourceCommercialSignals,
  buildSourceExecutiveDecisionSummary,
  buildSourcePricingNormalization,
  detectCommercialRisks,
  formatSourceCommercialSignalsAsMarkdown,
  summarizeSourceCommercialSignals,
} from '@/lib/source';

describe('Source commercial signals adapter', () => {
  function buildSeededSignals() {
    return buildSourceCommercialSignals({
      event: {
        id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        name: 'Digital App Build Partner Selection',
        currentStageKey: 'selection',
      },
    });
  }

  it('produces deterministic converged commercial signals', () => {
    const first = buildSeededSignals();
    const second = buildSeededSignals();

    expect(first).toEqual(second);
    expect(first.eventId).toBe(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(first.pricingSignals.status).toBeDefined();
    expect(first.bafoSignals.overallReadiness).toBeDefined();
    expect(first.riskSignals.overallRiskLevel).toBeDefined();
    expect(first.vendorTradeoffs.length).toBeGreaterThan(0);
    expect(first.sourceModulesUsed).toEqual([
      'pricing-normalization',
      'bafo-negotiation',
      'commercial-risk-detection',
    ]);
  });

  it('adapts pricing, BAFO, and risk outputs from existing module builders', () => {
    const pricing = buildSourcePricingNormalization({
      event: {
        id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        name: 'Digital App Build Partner Selection',
        currentStageKey: 'selection',
      },
    });
    const bafo = buildSourceBafoNegotiationPlan({
      event: {
        id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        name: 'Digital App Build Partner Selection',
        currentStageKey: 'selection',
      },
    });
    const risks = detectCommercialRisks({
      eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
      eventName: 'Digital App Build Partner Selection',
      vendorIds: bafo.vendorNegotiationPlans.map((vendor) => vendor.vendorId),
      hasIncompleteEvidence: true,
      hasPricingAnomalies: true,
      hasScopeAmbiguity: true,
      hasGovernanceGap: true,
    });

    const pricingSignals = adaptPricingNormalizationToCommercialSignals(pricing);
    const bafoSignals = adaptBafoNegotiationToCommercialSignals(bafo);
    const riskSignals = adaptCommercialRisksToCommercialSignals(risks);

    expect(pricingSignals.status).toBe(pricing.status);
    expect(pricingSignals.comparableVendors).toBe(pricing.comparableVendors);
    expect(bafoSignals.overallReadiness).toBe(bafo.overallNegotiationReadiness);
    expect(bafoSignals.vendorBlockedCount).toBeGreaterThanOrEqual(0);
    expect(riskSignals.totalCount).toBe(risks.totalCount);
    expect(riskSignals.overallRiskLevel).toBe(risks.overallRiskLevel);
  });

  it('provides summary and markdown formatter output', () => {
    const signals = buildSeededSignals();
    const summary = summarizeSourceCommercialSignals(signals);
    const markdown = formatSourceCommercialSignalsAsMarkdown(signals);

    expect(summary).toContain('Commercial signals');
    expect(summary).toContain(signals.commercialReadiness);

    expect(markdown).toContain('# Source Commercial Signals');
    expect(markdown).toContain('## Pricing signals');
    expect(markdown).toContain('## BAFO signals');
    expect(markdown).toContain('## Risk signals');
    expect(markdown).toContain('Source modules used: pricing-normalization, bafo-negotiation, commercial-risk-detection');
  });

  it('feeds executive decision summary through canonical commercial signal contract', () => {
    const signals = buildSeededSignals();
    const missions = buildSourceCommercialAgentMissions({
      queueInput: {
        eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        eventName: 'Digital App Build Partner Selection',
        stage: 'selection',
        vendorIds: signals.vendorTradeoffs.map((vendor) => vendor.vendorId),
        needsPriceBenchmark: signals.pricingSignals.status !== 'comparable',
        needsScopeClarification: true,
        needsEvidenceCollection: true,
        needsGovernanceReview: true,
        isBafoPhase: true,
      },
    });
    const summary = buildSourceExecutiveDecisionSummary({
      event: {
        id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        name: 'Digital App Build Partner Selection',
        currentStageKey: 'selection',
      },
      commercialSignals: signals,
      unifiedMissions: missions.adaptedMissions,
    });

    expect(summary.sourceModulesUsed).toEqual(['commercial-signals', 'commercial-mission-adapter']);
    expect(summary.vendorTradeoffs.length).toBeGreaterThan(0);
    expect(summary.blockers.length).toBeGreaterThan(0);
  });

  it('keeps adapter files free of model/upload imports and duplicate model logic wiring', () => {
    const sources = [
      'src/lib/source/commercial-signals.ts',
      'src/lib/source/commercial-signal-types.ts',
      'src/lib/source/index.ts',
      'src/__tests__/integration/source/source-commercial-signals.test.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|scorecard-ui)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
    expect(sources).toMatch(/buildSourcePricingNormalization/);
    expect(sources).toMatch(/buildSourceBafoNegotiationPlan/);
    expect(sources).toMatch(/detectCommercialRisks/);
  });
});

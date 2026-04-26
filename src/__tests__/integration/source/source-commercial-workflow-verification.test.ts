// QA21 — Source Commercial Workflow Verification
// Cross-file shape and consistency check for the Wave-14 commercial intelligence layer.
// File-pure, deterministic — no model calls, no network calls.
//
// This test is designed to run AFTER all Wave-14 lanes are integrated.
// It verifies exports and cross-module consistency.

/* eslint-disable @typescript-eslint/no-require-imports */

describe('source-commercial-workflow-verification - bafo-negotiation-model', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(() => {
    mod = require('../../../lib/source/bafo-negotiation-model');
  });

  it('exports buildBafoNegotiationSummary as a function', () => {
    expect(typeof mod.buildBafoNegotiationSummary).toBe('function');
  });

  it('buildBafoNegotiationSummary returns a summary with modelVersion 1.0', () => {
    const result = mod.buildBafoNegotiationSummary({
      eventId: 'evt-qa21-bafo',
      eventName: 'QA21 BAFO Test',
      vendorIds: ['vendor-x'],
      stage: 'bafo',
    });
    expect(result.modelVersion).toBe('1.0');
    expect(result.eventId).toBe('evt-qa21-bafo');
    expect(Array.isArray(result.levers)).toBe(true);
    expect(Array.isArray(result.opportunities)).toBe(true);
    expect(Array.isArray(result.scenarios)).toBe(true);
  });
});

describe('source-commercial-workflow-verification - pricing-normalization-model', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(() => {
    mod = require('../../../lib/source/pricing-normalization-model');
  });

  it('exports buildPricingNormalizationModel as a function', () => {
    expect(typeof mod.buildPricingNormalizationModel).toBe('function');
  });

  it('buildPricingNormalizationModel returns a result with modelVersion 1.0', () => {
    const result = mod.buildPricingNormalizationModel({
      eventId: 'evt-qa21-pricing',
      eventName: 'QA21 Pricing Test',
      vendors: [
        { vendorId: 'vendor-x', vendorName: 'Vendor X', totalQuotedCost: 500_000, currency: 'USD' },
      ],
    });
    expect(result.modelVersion).toBe('1.0');
    expect(result.eventId).toBe('evt-qa21-pricing');
    expect(Array.isArray(result.lines)).toBe(true);
    expect(Array.isArray(result.vendorSnapshots)).toBe(true);
    expect(result.vendorSnapshots).toHaveLength(1);
  });
});

describe('source-commercial-workflow-verification - commercial-risk-detection', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(() => {
    mod = require('../../../lib/source/commercial-risk-detection');
  });

  it('exports detectCommercialRisks as a function', () => {
    expect(typeof mod.detectCommercialRisks).toBe('function');
  });

  it('detectCommercialRisks returns no exceptions when all flags false', () => {
    const result = mod.detectCommercialRisks({
      eventId: 'evt-qa21-risk',
      eventName: 'QA21 Risk Test',
      vendorIds: [],
      hasIncompleteEvidence: false,
      hasPricingAnomalies: false,
      hasScopeAmbiguity: false,
      hasGovernanceGap: false,
    });
    expect(result.totalCount).toBe(0);
    expect(result.overallRiskLevel).toBe('low');
  });

  it('detectCommercialRisks returns exceptions when flags set', () => {
    const result = mod.detectCommercialRisks({
      eventId: 'evt-qa21-risk-active',
      eventName: 'QA21 Active Risk Test',
      vendorIds: ['vendor-x'],
      hasIncompleteEvidence: true,
      hasPricingAnomalies: true,
      hasScopeAmbiguity: false,
      hasGovernanceGap: false,
    });
    expect(result.totalCount).toBeGreaterThan(0);
  });
});

describe('source-commercial-workflow-verification - control-tower-signals', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(() => {
    mod = require('../../../lib/source/control-tower-signals');
  });

  it('exports buildSourceControlTowerSignals as a function', () => {
    expect(typeof mod.buildSourceControlTowerSignals).toBe('function');
  });

  it('emits bafo_ready signal when isBafoReady true', () => {
    const bundle = mod.buildSourceControlTowerSignals({
      eventId: 'evt-qa21-signals',
      eventName: 'QA21 Signals Test',
      stage: 'bafo',
      vendorIds: [],
      hasPricingAnomalies: false,
      hasScopeGap: false,
      hasEvidenceDeficit: false,
      hasGovernanceGap: false,
      isBafoReady: true,
      evaluationDaysStalled: 0,
    });
    const types = bundle.signals.map((s: { signalType: string }) => s.signalType);
    expect(types).toContain('bafo_ready');
  });
});

describe('source-commercial-workflow-verification - intelligence-patterns', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(() => {
    mod = require('../../../lib/source/intelligence-patterns');
  });

  it('exports detectIntelligencePatterns as a function', () => {
    expect(typeof mod.detectIntelligencePatterns).toBe('function');
  });

  it('returns zero patterns when no flags set', () => {
    const summary = mod.detectIntelligencePatterns({
      eventId: 'evt-qa21-intel',
      eventName: 'QA21 Intel Test',
      vendorIds: [],
      hasOpaquePricing: false,
      hasBroadScope: false,
      hasEvidenceGaps: false,
      hasTimelinePressure: false,
      hasGovernanceAvoidance: false,
      hasBundledServices: false,
    });
    expect(summary.patterns).toHaveLength(0);
    expect(summary.topPatternCategory).toBeNull();
  });
});

describe('source-commercial-workflow-verification - commercial-mission-queue', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(() => {
    mod = require('../../../lib/source/commercial-mission-queue');
  });

  it('exports buildCommercialMissionQueue as a function', () => {
    expect(typeof mod.buildCommercialMissionQueue).toBe('function');
  });

  it('returns empty queue when no flags set', () => {
    const queue = mod.buildCommercialMissionQueue({
      eventId: 'evt-qa21-queue',
      eventName: 'QA21 Queue Test',
      stage: 'rfp',
      vendorIds: [],
      needsPriceBenchmark: false,
      needsScopeClarification: false,
      needsEvidenceCollection: false,
      needsGovernanceReview: false,
      isBafoPhase: false,
    });
    expect(queue.totalCount).toBe(0);
    expect(queue.nextMission).toBeNull();
  });

  it('returns non-empty queue when flags set', () => {
    const queue = mod.buildCommercialMissionQueue({
      eventId: 'evt-qa21-queue-active',
      eventName: 'QA21 Active Queue',
      stage: 'bafo',
      vendorIds: ['vendor-x'],
      needsPriceBenchmark: true,
      needsScopeClarification: false,
      needsEvidenceCollection: false,
      needsGovernanceReview: false,
      isBafoPhase: false,
    });
    expect(queue.totalCount).toBeGreaterThan(0);
  });
});

describe('source-commercial-workflow-verification - cross-module consistency', () => {
  it('all 6 commercial intelligence modules are importable', () => {
    const mods = [
      '../../../lib/source/bafo-negotiation-model',
      '../../../lib/source/pricing-normalization-model',
      '../../../lib/source/commercial-risk-detection',
      '../../../lib/source/control-tower-signals',
      '../../../lib/source/intelligence-patterns',
      '../../../lib/source/commercial-mission-queue',
    ];
    for (const modPath of mods) {
      expect(() => require(modPath)).not.toThrow();
    }
  });

  it('all builder functions return objects with generatedAt 2026-04-26', () => {
    const bafoMod = require('../../../lib/source/bafo-negotiation-model');
    const pricingMod = require('../../../lib/source/pricing-normalization-model');
    const riskMod = require('../../../lib/source/commercial-risk-detection');
    const signalsMod = require('../../../lib/source/control-tower-signals');
    const patternsMod = require('../../../lib/source/intelligence-patterns');
    const queueMod = require('../../../lib/source/commercial-mission-queue');

    const bafoResult = bafoMod.buildBafoNegotiationSummary({ eventId: 'e', eventName: 'E', vendorIds: [], stage: 'bafo' });
    const pricingResult = pricingMod.buildPricingNormalizationModel({ eventId: 'e', eventName: 'E', vendors: [] });
    const riskResult = riskMod.detectCommercialRisks({ eventId: 'e', eventName: 'E', vendorIds: [], hasIncompleteEvidence: false, hasPricingAnomalies: false, hasScopeAmbiguity: false, hasGovernanceGap: false });
    const signalsResult = signalsMod.buildSourceControlTowerSignals({ eventId: 'e', eventName: 'E', stage: 'rfp', vendorIds: [], hasPricingAnomalies: false, hasScopeGap: false, hasEvidenceDeficit: false, hasGovernanceGap: false, isBafoReady: false, evaluationDaysStalled: 0 });
    const patternsResult = patternsMod.detectIntelligencePatterns({ eventId: 'e', eventName: 'E', vendorIds: [], hasOpaquePricing: false, hasBroadScope: false, hasEvidenceGaps: false, hasTimelinePressure: false, hasGovernanceAvoidance: false, hasBundledServices: false });
    const queueResult = queueMod.buildCommercialMissionQueue({ eventId: 'e', eventName: 'E', stage: 'rfp', vendorIds: [], needsPriceBenchmark: false, needsScopeClarification: false, needsEvidenceCollection: false, needsGovernanceReview: false, isBafoPhase: false });

    expect(bafoResult.generatedAt).toBe('2026-04-26');
    expect(pricingResult.generatedAt).toBe('2026-04-26');
    expect(riskResult.generatedAt).toBe('2026-04-26');
    expect(signalsResult.generatedAt).toBe('2026-04-26');
    expect(patternsResult.generatedAt).toBe('2026-04-26');
    expect(queueResult.generatedAt).toBe('2026-04-26');
  });
});

import { buildSourceBafoNegotiationPlan } from './bafo-negotiation';
import type { CommercialRiskDetectionResult, CommercialRiskException, CommercialRiskSeverity } from './commercial-risk-detection';
import { detectCommercialRisks } from './commercial-risk-detection';
import { getSourceVendorResponseSeed } from './mock-seed';
import { buildSourcePricingNormalization } from './pricing-normalization';
import type { SourcePricingNormalization, SourcePricingVendorSnapshot } from './pricing-normalization-types';
import type { SourceBafoNegotiationPlan, SourceBafoVendorNegotiationPlan } from './bafo-negotiation-types';
import type {
  SourceCommercialBafoSignals,
  SourceCommercialExecutiveImplications,
  SourceCommercialPricingSignals,
  SourceCommercialReadiness,
  SourceCommercialRiskSignals,
  SourceCommercialSignals,
  SourceCommercialSignalsInput,
  SourceCommercialVendorTradeoff,
} from './commercial-signal-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const SOURCE_MODULES_USED = [
  'pricing-normalization',
  'bafo-negotiation',
  'commercial-risk-detection',
] as const;

function severityRank(severity: CommercialRiskSeverity): number {
  if (severity === 'critical') return 4;
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

function maxSeverity(a: CommercialRiskSeverity, b: CommercialRiskSeverity): CommercialRiskSeverity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

function buildRiskDetectionInput(input: SourceCommercialSignalsInput, pricing: SourcePricingNormalization, bafo: SourceBafoNegotiationPlan) {
  const vendorIds = input.event.vendorIds && input.event.vendorIds.length > 0
    ? input.event.vendorIds
    : bafo.vendorNegotiationPlans.map((vendor) => vendor.vendorId);

  const hasPricingAnomalies = pricing.traps.some((trap) => (
    trap.category === 'Pricing template'
    || trap.category === 'Rate escalation'
    || trap.category === 'Volume trap'
  ));
  const hasScopeAmbiguity = bafo.excludedScopeList.length > 0;
  const hasGovernanceGap = bafo.stewardGateNotes.some((note) => note.toLowerCase().includes('do not proceed'));
  const hasIncompleteEvidence = bafo.sentinelEvidenceNotes.length > 0
    || pricing.traps.some((trap) => trap.category === 'Evidence');

  return {
    eventId: input.event.id,
    eventName: input.event.name,
    vendorIds,
    hasIncompleteEvidence,
    hasPricingAnomalies,
    hasScopeAmbiguity,
    hasGovernanceGap,
  };
}

function riskByVendor(exceptions: CommercialRiskException[]): Map<string, CommercialRiskSeverity> {
  const map = new Map<string, CommercialRiskSeverity>();
  for (const exception of exceptions) {
    if (exception.vendorId === 'all') continue;
    const current = map.get(exception.vendorId);
    map.set(exception.vendorId, current ? maxSeverity(current, exception.severity) : exception.severity);
  }
  return map;
}

export function adaptPricingNormalizationToCommercialSignals(
  pricing: SourcePricingNormalization,
): SourceCommercialPricingSignals {
  return {
    status: pricing.status,
    readinessScore: pricing.readinessScore,
    comparableVendors: pricing.comparableVendors,
    notComparableVendors: pricing.notComparableVendors,
    topTraps: pricing.topCommercialTraps.slice(0, 5).map((trap) => `${trap.vendorName}: ${trap.signal}`),
    blockers: pricing.blockers,
    narrative: pricing.summaryNarrative,
  };
}

export function adaptBafoNegotiationToCommercialSignals(
  plan: SourceBafoNegotiationPlan,
): SourceCommercialBafoSignals {
  const vendorReadyCount = plan.vendorNegotiationPlans.filter((vendor) => vendor.readiness === 'ready').length;
  const vendorConditionalCount = plan.vendorNegotiationPlans.filter((vendor) => vendor.readiness === 'conditional').length;
  const vendorBlockedCount = plan.vendorNegotiationPlans.filter((vendor) => (
    vendor.readiness === 'blocked' || vendor.readiness === 'not_comparable'
  )).length;

  return {
    overallReadiness: plan.overallNegotiationReadiness,
    vendorReadyCount,
    vendorConditionalCount,
    vendorBlockedCount,
    priorities: plan.recommendedBafoPriorities,
    blockers: plan.blockers,
    nextAction: plan.nextAction,
  };
}

export function adaptCommercialRisksToCommercialSignals(
  risks: CommercialRiskDetectionResult,
): SourceCommercialRiskSignals {
  return {
    overallRiskLevel: risks.overallRiskLevel,
    totalCount: risks.totalCount,
    criticalCount: risks.criticalCount,
    highCount: risks.highCount,
    openExceptionTitles: risks.exceptions
      .filter((exception) => exception.status === 'open')
      .map((exception) => exception.title)
      .slice(0, 8),
  };
}

function toVendorTradeoff(
  snapshot: SourcePricingVendorSnapshot | undefined,
  pricingRank: number | null,
  vendorPlan: SourceBafoVendorNegotiationPlan | undefined,
  vendorRisk: CommercialRiskSeverity | undefined,
): SourceCommercialVendorTradeoff {
  const vendorId = snapshot?.vendorId ?? vendorPlan?.vendorId ?? 'unknown';
  const vendorName = snapshot?.vendorName ?? vendorPlan?.vendorName ?? vendorId;
  const blockers = [
    ...(snapshot?.commercialTraps.filter((trap) => trap.severity !== 'low').map((trap) => trap.signal) ?? []),
    ...(vendorPlan?.blockers ?? []),
  ];

  return {
    vendorId,
    vendorName,
    pricingRank,
    pricingStatus: snapshot?.comparabilityStatus ?? 'unknown',
    bafoReadiness: vendorPlan?.readiness ?? 'unknown',
    riskLevel: vendorRisk ?? 'low',
    blockers: Array.from(new Set(blockers)),
  };
}

function deriveCommercialReadiness(
  pricingSignals: SourceCommercialPricingSignals,
  bafoSignals: SourceCommercialBafoSignals,
  riskSignals: SourceCommercialRiskSignals,
): SourceCommercialReadiness {
  if (pricingSignals.status === 'blocked' || bafoSignals.overallReadiness === 'blocked' || riskSignals.criticalCount > 0) {
    return 'blocked';
  }
  if (pricingSignals.status === 'comparable' && bafoSignals.overallReadiness === 'ready' && riskSignals.highCount === 0) {
    return 'ready';
  }
  return 'partially_ready';
}

function deriveRecommendedNextAction(
  readiness: SourceCommercialReadiness,
  bafoSignals: SourceCommercialBafoSignals,
  pricingSignals: SourceCommercialPricingSignals,
  riskSignals: SourceCommercialRiskSignals,
): string {
  if (readiness === 'blocked' && riskSignals.criticalCount > 0) {
    return 'Resolve critical commercial risk exceptions before advancing decision posture.';
  }
  if (readiness === 'blocked') {
    return bafoSignals.nextAction;
  }
  if (readiness === 'ready') {
    return 'Use this converged commercial package as input to executive decision and vendor selection readiness checks.';
  }
  if (pricingSignals.blockers.length > 0) {
    return `Close top pricing blocker: ${pricingSignals.blockers[0]}`;
  }
  return bafoSignals.nextAction;
}

function buildExecutiveImplications(
  pricing: SourcePricingNormalization,
  bafo: SourceBafoNegotiationPlan,
): SourceCommercialExecutiveImplications {
  return {
    nexusGuidance: bafo.nexusGuidance,
    atlasExecutiveImplication: `${bafo.atlasExecutiveImplication} ${pricing.atlasExecutiveImplication}`.trim(),
    sentinelEvidenceNotes: Array.from(new Set([
      ...bafo.sentinelEvidenceNotes,
      ...pricing.sentinelEvidenceNotes,
    ])),
    stewardGateNotes: Array.from(new Set([
      ...bafo.stewardGateNotes,
      ...pricing.stewardGateNotes,
    ])),
  };
}

export function buildSourceCommercialSignals(input: SourceCommercialSignalsInput): SourceCommercialSignals {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const pricing = buildSourcePricingNormalization({
    event: {
      id: input.event.id,
      name: input.event.name,
      currentStageKey: input.event.currentStageKey,
    },
  });
  const bafo = buildSourceBafoNegotiationPlan({
    event: {
      id: input.event.id,
      name: input.event.name,
      currentStageKey: input.event.currentStageKey,
      pricingNormalizationSnapshots: pricing.snapshots,
      vendorResponses: getSourceVendorResponseSeed(input.event.id).responses,
    },
  });
  const risks = detectCommercialRisks(buildRiskDetectionInput(input, pricing, bafo));

  const pricingSignals = adaptPricingNormalizationToCommercialSignals(pricing);
  const bafoSignals = adaptBafoNegotiationToCommercialSignals(bafo);
  const riskSignals = adaptCommercialRisksToCommercialSignals(risks);

  const riskLevels = riskByVendor(risks.exceptions);
  const snapshotByVendor = new Map(pricing.snapshots.map((snapshot) => [snapshot.vendorId, snapshot]));
  const pricingRankByVendor = new Map(pricing.comparison.map((row) => [row.vendorId, row.rank]));
  const planByVendor = new Map(bafo.vendorNegotiationPlans.map((vendor) => [vendor.vendorId, vendor]));
  const vendorIds = Array.from(new Set([
    ...pricing.snapshots.map((snapshot) => snapshot.vendorId),
    ...bafo.vendorNegotiationPlans.map((vendor) => vendor.vendorId),
    ...Array.from(riskLevels.keys()),
  ]));
  const vendorTradeoffs = vendorIds.map((vendorId) => (
    toVendorTradeoff(
      snapshotByVendor.get(vendorId),
      pricingRankByVendor.get(vendorId) ?? null,
      planByVendor.get(vendorId),
      riskLevels.get(vendorId),
    )
  ));

  const blockers = Array.from(new Set([
    ...pricingSignals.blockers,
    ...bafoSignals.blockers,
    ...riskSignals.openExceptionTitles,
  ]));
  const commercialReadiness = deriveCommercialReadiness(pricingSignals, bafoSignals, riskSignals);
  const executiveImplications = buildExecutiveImplications(pricing, bafo);
  const recommendedNextAction = deriveRecommendedNextAction(
    commercialReadiness,
    bafoSignals,
    pricingSignals,
    riskSignals,
  );

  return {
    eventId: input.event.id,
    generatedAt,
    pricingSignals,
    bafoSignals,
    riskSignals,
    vendorTradeoffs,
    commercialReadiness,
    executiveImplications,
    blockers,
    recommendedNextAction,
    sourceModulesUsed: [...SOURCE_MODULES_USED],
  };
}

export function summarizeSourceCommercialSignals(input: SourceCommercialSignals): string {
  return `Commercial signals (${input.eventId}): readiness=${input.commercialReadiness};`
    + ` pricing=${input.pricingSignals.status}; bafo=${input.bafoSignals.overallReadiness};`
    + ` risk=${input.riskSignals.overallRiskLevel} (${input.riskSignals.totalCount} exception(s)).`;
}

export function formatSourceCommercialSignalsAsMarkdown(input: SourceCommercialSignals): string {
  const lines = [
    '# Source Commercial Signals',
    '',
    `Event: ${input.eventId}`,
    `Generated: ${input.generatedAt}`,
    `Commercial readiness: ${input.commercialReadiness}`,
    '',
    '## Pricing signals',
    `- Status: ${input.pricingSignals.status}`,
    `- Readiness score: ${input.pricingSignals.readinessScore}`,
    `- Comparable vendors: ${input.pricingSignals.comparableVendors}`,
    `- Not comparable vendors: ${input.pricingSignals.notComparableVendors}`,
    '',
    '## BAFO signals',
    `- Overall readiness: ${input.bafoSignals.overallReadiness}`,
    `- Vendors ready: ${input.bafoSignals.vendorReadyCount}`,
    `- Vendors conditional: ${input.bafoSignals.vendorConditionalCount}`,
    `- Vendors blocked/not-comparable: ${input.bafoSignals.vendorBlockedCount}`,
    '',
    '## Risk signals',
    `- Overall risk level: ${input.riskSignals.overallRiskLevel}`,
    `- Exceptions: ${input.riskSignals.totalCount} (critical=${input.riskSignals.criticalCount}, high=${input.riskSignals.highCount})`,
    '',
    '## Blockers',
    ...(input.blockers.length > 0 ? input.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    `Recommended next action: ${input.recommendedNextAction}`,
    '',
    `Source modules used: ${input.sourceModulesUsed.join(', ')}`,
  ];

  return lines.join('\n');
}

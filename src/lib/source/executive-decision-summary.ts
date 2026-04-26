import type { SourceAgentMission } from './agent-mission-types';
import { buildSourceCommercialAgentMissions } from './commercial-mission-adapter';
import { buildSourceCommercialSignals } from './commercial-signals';
import type { SourceCommercialSignals, SourceCommercialVendorTradeoff } from './commercial-signal-types';
import type {
  SourceExecutiveDecisionInput,
  SourceExecutiveDecisionPosture,
  SourceExecutiveDecisionSummary,
  SourceExecutiveDecisionVendorTradeoffInput,
  SourceExecutiveEvidenceConfidence,
  SourceExecutiveRiskLevel,
  SourceExecutiveVendorTradeoff,
} from './executive-decision-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const SOURCE_MODULES_USED = [
  'commercial-signals',
  'commercial-mission-adapter',
] as const;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function toRiskLevel(level: SourceCommercialVendorTradeoff['riskLevel']): SourceExecutiveRiskLevel {
  if (level === 'critical' || level === 'high') return 'high';
  if (level === 'medium') return 'medium';
  return 'low';
}

function scoreForRisk(level: SourceExecutiveRiskLevel): number {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}

function toEvidenceConfidence(tradeoff: SourceCommercialVendorTradeoff): SourceExecutiveEvidenceConfidence {
  const lowEvidenceBlocker = tradeoff.blockers.some((blocker) => (
    normalizeText(blocker).includes('evidence')
    || normalizeText(blocker).includes('proof')
    || normalizeText(blocker).includes('citation')
  ));
  if (lowEvidenceBlocker) return 'low';
  if (tradeoff.riskLevel === 'critical' || tradeoff.riskLevel === 'high') return 'medium';
  return 'high';
}

function collectUnresolvedAssumptions(tradeoff: SourceCommercialVendorTradeoff): string[] {
  return tradeoff.blockers.filter((blocker) => {
    const text = normalizeText(blocker);
    return text.includes('assumption') || text.includes('exclusion') || text.includes('transition');
  });
}

function toVendorViability(
  tradeoff: SourceCommercialVendorTradeoff,
  evidenceConfidence: SourceExecutiveEvidenceConfidence,
): SourceExecutiveVendorTradeoff['viability'] {
  if (tradeoff.pricingStatus === 'not_comparable') {
    return 'not_viable';
  }
  if (evidenceConfidence === 'low') {
    return 'conditional';
  }
  if (tradeoff.riskLevel === 'critical' || tradeoff.riskLevel === 'high') {
    return 'conditional';
  }
  return 'viable';
}

function resolveTransitionRisk(blockers: string[]): SourceExecutiveRiskLevel {
  const hasTransitionBlocker = blockers.some((blocker) => normalizeText(blocker).includes('transition'));
  if (hasTransitionBlocker) return 'high';
  return 'medium';
}

function missionKey(mission: SourceAgentMission): string {
  return [
    mission.agentName,
    mission.missionType,
    mission.stageId ?? 'none',
    normalizeText(mission.title),
  ].join('::');
}

function mergeMissions(
  provided: SourceAgentMission[],
  adapted: SourceAgentMission[],
): SourceAgentMission[] {
  const seen = new Set<string>(provided.map(missionKey));
  const merged = [...provided];
  for (const mission of adapted) {
    const key = missionKey(mission);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(mission);
  }
  return merged;
}

function buildUnifiedMissions(
  input: SourceExecutiveDecisionInput,
  signals: SourceCommercialSignals,
): SourceAgentMission[] {
  const adapted = buildSourceCommercialAgentMissions({
    queueInput: {
      eventId: input.event.id,
      eventName: input.event.name,
      stage: input.event.currentStageKey,
      vendorIds: signals.vendorTradeoffs.map((vendor) => vendor.vendorId),
      needsPriceBenchmark: signals.pricingSignals.status !== 'comparable',
      needsScopeClarification: signals.vendorTradeoffs.some((vendor) => (
        vendor.blockers.some((blocker) => normalizeText(blocker).includes('scope'))
      )),
      needsEvidenceCollection: signals.executiveImplications.sentinelEvidenceNotes.length > 0,
      needsGovernanceReview: signals.executiveImplications.stewardGateNotes.length > 0,
      isBafoPhase: signals.bafoSignals.overallReadiness !== 'ready',
    },
    generatedAt: input.generatedAt,
  });

  if (input.unifiedMissions && input.unifiedMissions.length > 0) {
    return mergeMissions(input.unifiedMissions, adapted.adaptedMissions);
  }

  return adapted.adaptedMissions;
}

function buildMissionSummary(missions: SourceAgentMission[]): SourceExecutiveDecisionSummary['missionSummary'] {
  const byPriority: SourceExecutiveDecisionSummary['missionSummary']['byPriority'] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  let blocked = 0;
  for (const mission of missions) {
    byPriority[mission.priority] += 1;
    if (mission.state === 'blocked') blocked += 1;
  }
  return {
    total: missions.length,
    critical: byPriority.critical,
    high: byPriority.high,
    blocked,
    byPriority,
  };
}

export function buildSourceExecutiveVendorTradeoffs(
  input: SourceExecutiveDecisionVendorTradeoffInput,
): SourceExecutiveVendorTradeoff[] {
  return input.commercialSignals.vendorTradeoffs.map((tradeoff) => {
    const evidenceConfidence = toEvidenceConfidence(tradeoff);
    const unresolvedAssumptions = collectUnresolvedAssumptions(tradeoff);
    return {
      vendorId: tradeoff.vendorId,
      vendorName: tradeoff.vendorName,
      viability: toVendorViability(tradeoff, evidenceConfidence),
      valuePotential: tradeoff.bafoReadiness === 'ready'
        ? 'Vendor signals BAFO-ready value delivery posture.'
        : 'Value delivery remains conditional on BAFO clarifications.',
      costPosition: tradeoff.pricingRank
        ? `Pricing rank ${tradeoff.pricingRank}; status ${tradeoff.pricingStatus}.`
        : `Pricing status ${tradeoff.pricingStatus}; rank unavailable.`,
      pricingRank: tradeoff.pricingRank,
      pricingStatus: tradeoff.pricingStatus,
      bafoReadiness: tradeoff.bafoReadiness,
      commercialRisk: toRiskLevel(tradeoff.riskLevel),
      transitionRisk: resolveTransitionRisk(tradeoff.blockers),
      evidenceConfidence,
      blockers: tradeoff.blockers,
      unresolvedAssumptions,
    };
  });
}

function deriveEvidenceConfidence(
  vendorTradeoffs: SourceExecutiveVendorTradeoff[],
  signals: SourceCommercialSignals,
): SourceExecutiveEvidenceConfidence {
  if (vendorTradeoffs.some((vendor) => vendor.evidenceConfidence === 'low')) return 'low';
  if (signals.executiveImplications.sentinelEvidenceNotes.length > 0) return 'medium';
  return 'high';
}

function deriveDecisionPosture(
  blockers: string[],
  evidenceConfidence: SourceExecutiveEvidenceConfidence,
  missionSummary: SourceExecutiveDecisionSummary['missionSummary'],
  signals: SourceCommercialSignals,
): SourceExecutiveDecisionPosture {
  const hasPricingBlocker = blockers.some((blocker) => {
    const text = normalizeText(blocker);
    return text.includes('pricing') || text.includes('template') || text.includes('comparable');
  });
  if (hasPricingBlocker) return 'blocked_missing_pricing';

  if (evidenceConfidence === 'low') return 'blocked_low_evidence';

  const hasWaiver = blockers.some((blocker) => normalizeText(blocker).includes('waiver'))
    || signals.executiveImplications.stewardGateNotes.some((note) => normalizeText(note).includes('waiver'));
  if (hasWaiver) return 'waiver_required';

  if (missionSummary.blocked > 0 || signals.commercialReadiness === 'blocked') {
    return 'defer_pending_clarifications';
  }

  if (signals.bafoSignals.overallReadiness !== 'ready') {
    return 'proceed_to_bafo';
  }

  return 'ready_for_selection_review';
}

function deriveDecisionOptions(posture: SourceExecutiveDecisionPosture): string[] {
  const options: Record<SourceExecutiveDecisionPosture, string[]> = {
    ready_for_selection_review: [
      'Move to selection review because blocking pricing and evidence issues are closed.',
      'Move with explicit caveats and named owners for residual risks.',
      'Run one final cross-functional sanity pass before recommendation lock.',
    ],
    proceed_to_bafo: [
      'Proceed to BAFO with a targeted clarification list by vendor.',
      'Issue one deterministic clarification pack for scope, pricing, and evidence asks.',
      'Return to executive review after BAFO deltas are captured.',
    ],
    defer_pending_clarifications: [
      'Defer selection review until current blockers are resolved.',
      'Close mission and commercial blockers before advancing posture.',
      'Rebuild executive summary after clarification evidence is validated.',
    ],
    blocked_missing_pricing: [
      'Block selection review until required pricing templates are complete.',
      'Request full pricing templates and comparable line-item breakdowns.',
      'Escalate unresolved pricing completeness gaps to procurement lead.',
    ],
    blocked_low_evidence: [
      'Block selection review until evidence confidence improves.',
      'Run an evidence recovery sprint for unsupported vendor claims.',
      'Recompute posture after Sentinel cautions are closed.',
    ],
    waiver_required: [
      'Document waiver scope and residual commercial risk ownership.',
      'Seek formal waiver approval before posture advances.',
      'Track waived assumptions and exclusions as explicit decision caveats.',
    ],
  };
  return options[posture];
}

function deriveCommercialRisk(vendorTradeoffs: SourceExecutiveVendorTradeoff[]): SourceExecutiveRiskLevel {
  if (vendorTradeoffs.length === 0) return 'medium';
  const score = vendorTradeoffs.reduce((total, tradeoff) => total + scoreForRisk(tradeoff.commercialRisk), 0);
  const average = score / vendorTradeoffs.length;
  if (average >= 2.5) return 'high';
  if (average >= 1.8) return 'medium';
  return 'low';
}

function deriveTransitionRisk(vendorTradeoffs: SourceExecutiveVendorTradeoff[]): SourceExecutiveRiskLevel {
  if (vendorTradeoffs.length === 0) return 'medium';
  const score = vendorTradeoffs.reduce((total, tradeoff) => total + scoreForRisk(tradeoff.transitionRisk), 0);
  const average = score / vendorTradeoffs.length;
  if (average >= 2.5) return 'high';
  if (average >= 1.8) return 'medium';
  return 'low';
}

export function getSourceExecutiveDecisionBlockers(summary: SourceExecutiveDecisionSummary): string[] {
  return summary.blockers;
}

export function getSourceExecutiveDecisionOptions(summary: SourceExecutiveDecisionSummary): string[] {
  return summary.decisionOptions;
}

export function buildSourceExecutiveDecisionSummary(
  input: SourceExecutiveDecisionInput,
): SourceExecutiveDecisionSummary {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const signals = input.commercialSignals ?? buildSourceCommercialSignals({
    event: {
      id: input.event.id,
      name: input.event.name,
      currentStageKey: input.event.currentStageKey,
    },
    generatedAt,
  });
  const unifiedMissions = buildUnifiedMissions(input, signals);
  const missionSummary = buildMissionSummary(unifiedMissions);
  const vendorTradeoffs = buildSourceExecutiveVendorTradeoffs({
    commercialSignals: signals,
    unifiedMissions,
  });
  const blockers = Array.from(new Set([
    ...signals.blockers,
    ...vendorTradeoffs.flatMap((vendor) => vendor.blockers),
    ...unifiedMissions
      .filter((mission) => mission.state === 'blocked')
      .map((mission) => mission.blockerReason)
      .filter((reason): reason is string => Boolean(reason)),
  ])).slice(0, 15);
  const unresolvedAssumptions = Array.from(new Set(vendorTradeoffs.flatMap((vendor) => vendor.unresolvedAssumptions))).slice(0, 12);
  const evidenceConfidence = deriveEvidenceConfidence(vendorTradeoffs, signals);
  const decisionPosture = deriveDecisionPosture(blockers, evidenceConfidence, missionSummary, signals);
  const decisionOptions = deriveDecisionOptions(decisionPosture);
  const viableVendors = vendorTradeoffs
    .filter((vendor) => vendor.viability !== 'not_viable')
    .map((vendor) => vendor.vendorName);
  const recommendedNextAction = decisionOptions[0] ?? signals.recommendedNextAction;

  const atlasExecutiveBrief = [
    `Decision posture: ${decisionPosture}.`,
    `Viable vendors: ${viableVendors.length > 0 ? viableVendors.join(', ') : 'none'}.`,
    `Commercial readiness: ${signals.commercialReadiness}.`,
    `Top blocker: ${blockers[0] ?? 'none'}.`,
  ].join(' ');

  return {
    eventId: input.event.id,
    generatedAt,
    decisionNeeded: 'Confirm whether this sourcing event can advance to executive selection review.',
    decisionPosture,
    recommendedDecisionPosture: decisionPosture,
    viableVendors,
    vendorTradeoffs,
    valueAtStake: {
      amountUsd: input.event.valueAtStakeUsd ?? 0,
      note: input.event.valueAtStakeUsd
        ? 'Value at stake provided from event context.'
        : 'Value at stake was not provided in event context.',
    },
    commercialRisk: deriveCommercialRisk(vendorTradeoffs),
    transitionRisk: deriveTransitionRisk(vendorTradeoffs),
    evidenceConfidence,
    unresolvedAssumptions,
    blockers,
    decisionOptions,
    recommendedNextAction,
    nexusRecommendation: signals.executiveImplications.nexusGuidance,
    sentinelCautions: signals.executiveImplications.sentinelEvidenceNotes,
    stewardGateNotes: signals.executiveImplications.stewardGateNotes,
    atlasExecutiveBrief,
    sourceModulesUsed: [...SOURCE_MODULES_USED],
    missionSummary,
  };
}

export function summarizeSourceExecutiveDecision(summary: SourceExecutiveDecisionSummary): string {
  return `Executive decision (${summary.eventId}): posture=${summary.decisionPosture};`
    + ` vendors=${summary.viableVendors.length}; blockers=${summary.blockers.length};`
    + ` evidence=${summary.evidenceConfidence}.`;
}

export function formatSourceExecutiveDecisionSummaryAsMarkdown(summary: SourceExecutiveDecisionSummary): string {
  const lines = [
    '# Source Executive Decision Summary',
    '',
    `Event: ${summary.eventId}`,
    `Generated: ${summary.generatedAt}`,
    `Decision posture: ${summary.decisionPosture}`,
    `Decision needed: ${summary.decisionNeeded}`,
    '',
    '## Vendor tradeoffs',
    ...(summary.vendorTradeoffs.length > 0
      ? summary.vendorTradeoffs.map((vendor) => (
        `- ${vendor.vendorName}: viability=${vendor.viability}, pricing=${vendor.pricingStatus},`
        + ` commercialRisk=${vendor.commercialRisk}, evidence=${vendor.evidenceConfidence}`
      ))
      : ['- none']),
    '',
    '## Blockers',
    ...(summary.blockers.length > 0 ? summary.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    '## Decision options',
    ...summary.decisionOptions.map((option) => `- ${option}`),
    '',
    `Recommended next action: ${summary.recommendedNextAction}`,
    '',
    `Atlas brief: ${summary.atlasExecutiveBrief}`,
    '',
    `Source modules used: ${summary.sourceModulesUsed.join(', ')}`,
  ];
  return lines.join('\n');
}

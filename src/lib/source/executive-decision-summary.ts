import { buildSourceBafoNegotiationPlan } from './bafo-negotiation';
import { getSourceVendorResponseSeed } from './mock-seed';
import { buildSourcePricingNormalization } from './pricing-normalization';
import { buildSourceVendorResponseCompleteness } from './vendor-response-completeness';
import type {
  SourceExecutiveDecisionInput,
  SourceExecutiveDecisionPosture,
  SourceExecutiveDecisionSummary,
  SourceExecutiveEvidenceConfidence,
  SourceExecutiveRiskLevel,
  SourceExecutiveVendorTradeoff,
  SourceExecutiveVendorViability,
} from './executive-decision-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

function toRiskLevel(score: number): SourceExecutiveRiskLevel {
  if (score >= 8) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function toEvidenceConfidence(score: number): SourceExecutiveEvidenceConfidence {
  if (score >= 6) return 'low';
  if (score >= 3) return 'medium';
  return 'high';
}

function toViability(input: {
  hasPricingBlocker: boolean;
  hasHighTransitionRisk: boolean;
  evidenceConfidence: SourceExecutiveEvidenceConfidence;
}): SourceExecutiveVendorViability {
  if (input.hasPricingBlocker) {
    return 'not_viable';
  }
  if (input.evidenceConfidence === 'low' || input.hasHighTransitionRisk) {
    return 'conditional';
  }
  return 'viable';
}

export function buildSourceExecutiveVendorTradeoffs(
  input: SourceExecutiveDecisionInput,
): SourceExecutiveVendorTradeoff[] {
  const completeness = buildSourceVendorResponseCompleteness({ event: input.event, generatedAt: input.generatedAt });
  const pricing = buildSourcePricingNormalization({ event: input.event, generatedAt: input.generatedAt });
  const bafo = buildSourceBafoNegotiationPlan({
    event: {
      ...input.event,
      currentStageKey: 'orals_bafo',
    },
    generatedAt: input.generatedAt,
  });

  const pricingByVendor = new Map(pricing.snapshots.map((snapshot) => [snapshot.vendorId, snapshot]));
  const bafoByVendor = new Map(bafo.vendorNegotiationPlans.map((vendor) => [vendor.vendorId, vendor]));
  const vendorSeeds = input.event.vendorResponses ?? getSourceVendorResponseSeed(input.event.id).responses;
  const vendorSeedByVendor = new Map(vendorSeeds.map((seed) => [seed.vendorId, seed]));

  return completeness.records.map((record) => {
    const pricingSnapshot = pricingByVendor.get(record.vendorId);
    const bafoVendor = bafoByVendor.get(record.vendorId);
    const vendorSeed = vendorSeedByVendor.get(record.vendorId);

    let commercialRiskScore = 0;
    let transitionRiskScore = 0;
    let evidenceRiskScore = 0;

    if (record.pricingTemplateStatus !== 'complete') {
      commercialRiskScore += 5;
    }
    if (pricingSnapshot?.commercialTraps.some((trap) => trap.severity === 'high')) {
      commercialRiskScore += 4;
    }
    if (record.responseStatus === 'blocked') {
      commercialRiskScore += 3;
    }
    if (record.transitionPlanStatus !== 'complete') {
      transitionRiskScore += 5;
    }
    if (vendorSeed?.responseRiskLevel === 'high') {
      transitionRiskScore += 3;
    }
    if (vendorSeed?.evidenceUsability === 'low_confidence' || vendorSeed?.evidenceUsability === 'restricted') {
      evidenceRiskScore += 6;
    }
    if (record.evidenceStatus === 'Low Confidence') {
      evidenceRiskScore += 3;
    }

    const commercialRisk = toRiskLevel(commercialRiskScore);
    const transitionRisk = toRiskLevel(transitionRiskScore);
    const evidenceConfidence = toEvidenceConfidence(evidenceRiskScore);

    const hasPricingBlocker = record.blockers.some((blocker) => blocker.toLowerCase().includes('pricing template'));
    const viability = toViability({
      hasPricingBlocker,
      hasHighTransitionRisk: transitionRisk === 'high',
      evidenceConfidence,
    });

    const keyStrengths: string[] = [];
    if (record.automationRoadmapStatus === 'complete') {
      keyStrengths.push('Automation and productivity scope is documented.');
    }
    if (record.securityResponseStatus === 'complete') {
      keyStrengths.push('Security and compliance response is complete.');
    }
    if (record.pricingTemplateStatus === 'complete') {
      keyStrengths.push('Pricing template is available for normalized comparison.');
    }

    const keyConcerns: string[] = [];
    if (record.pricingTemplateStatus !== 'complete') {
      keyConcerns.push('Pricing template is missing or incomplete.');
    }
    if (record.transitionPlanStatus !== 'complete') {
      keyConcerns.push('Transition plan detail remains incomplete.');
    }
    if (vendorSeed?.evidenceUsability === 'low_confidence' || vendorSeed?.evidenceUsability === 'restricted') {
      keyConcerns.push('Evidence quality is too weak for selection lock.');
    }
    if (record.exclusions.length > 0) {
      keyConcerns.push('Exclusions require commercial clarification before recommendation lock.');
    }

    const requiredResolutions = Array.from(new Set([
      ...record.blockers,
      ...(bafoVendor?.requiredClarifications ?? []),
    ])).slice(0, 8);

    const costPosition = pricingSnapshot
      ? `Year 1 ${pricingSnapshot.costByYear.year1.toLocaleString('en-US')} USD, readiness ${pricingSnapshot.readinessStatus}.`
      : 'Pricing normalization snapshot unavailable.';

    const valuePotential = bafoVendor?.expectedValueImpact
      ?? 'Value potential is not yet stable due to unresolved commercial inputs.';

    return {
      vendorId: record.vendorId,
      vendorName: record.vendorName,
      viability,
      valuePotential,
      costPosition,
      commercialRisk,
      transitionRisk,
      evidenceConfidence,
      evidenceUsability: vendorSeed?.evidenceUsability ?? 'not_available',
      keyStrengths,
      keyConcerns,
      blockers: record.blockers,
      requiredResolutions,
    };
  });
}

function resolveDecisionPosture(summary: {
  tradeoffs: SourceExecutiveVendorTradeoff[];
  blockers: string[];
  evidenceConfidence: SourceExecutiveEvidenceConfidence;
}): SourceExecutiveDecisionPosture {
  const viableCount = summary.tradeoffs.filter((tradeoff) => tradeoff.viability !== 'not_viable').length;
  const hasPricingBlocker = summary.blockers.some((blocker) => blocker.toLowerCase().includes('pricing template'));
  const hasEvidenceBlocker = summary.tradeoffs.some((tradeoff) => (
    tradeoff.evidenceConfidence === 'low' && tradeoff.viability !== 'not_viable'
  ));

  if (viableCount === 0 && hasPricingBlocker) {
    return 'blocked_missing_pricing';
  }
  if (viableCount === 0 && hasEvidenceBlocker) {
    return 'blocked_low_evidence';
  }
  if (summary.blockers.length === 0 && summary.evidenceConfidence === 'high') {
    return 'ready_for_selection_review';
  }
  if (hasPricingBlocker || hasEvidenceBlocker) {
    return 'defer_pending_clarifications';
  }
  return 'proceed_to_bafo';
}

function resolveDecisionOptions(posture: SourceExecutiveDecisionPosture): string[] {
  const optionsByPosture: Record<SourceExecutiveDecisionPosture, string[]> = {
    ready_for_selection_review: [
      'Move to steering committee selection review with a clear recommendation.',
      'Proceed with conditional approval notes and explicit assumption lock list.',
      'Request one final commercial sanity pass before decision lock.',
    ],
    proceed_to_bafo: [
      'Proceed to BAFO with a focused clarification list by vendor.',
      'Run one short negotiation loop on exclusions, transition, and risk terms.',
      'Return to review after BAFO deltas are captured.',
    ],
    defer_pending_clarifications: [
      'Defer selection review until pricing and transition clarifications are submitted.',
      'Issue a deterministic clarification pack to all vendors with due dates.',
      'Re-evaluate posture after clarifications are verified.',
    ],
    blocked_missing_pricing: [
      'Block selection review until required pricing templates are complete.',
      'Request complete pricing package and transition line-items from blocked vendors.',
      'Escalate to procurement sponsor if templates remain missing.',
    ],
    blocked_low_evidence: [
      'Block selection review until evidence quality is improved.',
      'Require contractable evidence for automation and value claims.',
      'Re-score evidence confidence before reopening decision review.',
    ],
    waiver_required: [
      'Document explicit waiver scope and residual risk ownership.',
      'Require executive waiver approval before recommendation lock.',
      'Track waived assumptions and exclusions in decision record.',
    ],
  };
  return optionsByPosture[posture];
}

export function getSourceExecutiveDecisionOptions(summary: SourceExecutiveDecisionSummary): string[] {
  return summary.decisionOptions;
}

export function getSourceExecutiveDecisionBlockers(summary: SourceExecutiveDecisionSummary): string[] {
  return summary.blockers;
}

export function buildSourceExecutiveDecisionSummary(
  input: SourceExecutiveDecisionInput,
): SourceExecutiveDecisionSummary {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const tradeoffs = buildSourceExecutiveVendorTradeoffs(input);
  const completeness = buildSourceVendorResponseCompleteness({ event: input.event, generatedAt });
  const pricing = buildSourcePricingNormalization({ event: input.event, generatedAt });
  const bafo = buildSourceBafoNegotiationPlan({
    event: {
      ...input.event,
      currentStageKey: 'orals_bafo',
    },
    generatedAt,
  });

  const blockers = Array.from(new Set([
    ...completeness.blockers,
    ...pricing.missingInputs,
    ...bafo.blockers,
  ])).slice(0, 12);

  const evidenceConfidenceScore = tradeoffs.reduce((score, tradeoff) => {
    if (tradeoff.evidenceConfidence === 'low') return score + 3;
    if (tradeoff.evidenceConfidence === 'medium') return score + 1;
    return score;
  }, 0);
  const evidenceConfidence = toEvidenceConfidence(evidenceConfidenceScore);

  const commercialRiskScore = tradeoffs.reduce((score, tradeoff) => (
    score + (tradeoff.commercialRisk === 'high' ? 3 : tradeoff.commercialRisk === 'medium' ? 1 : 0)
  ), 0);
  const transitionRiskScore = tradeoffs.reduce((score, tradeoff) => (
    score + (tradeoff.transitionRisk === 'high' ? 3 : tradeoff.transitionRisk === 'medium' ? 1 : 0)
  ), 0);

  const commercialRisk = toRiskLevel(commercialRiskScore);
  const transitionRisk = toRiskLevel(transitionRiskScore);

  const posture = resolveDecisionPosture({
    tradeoffs,
    blockers,
    evidenceConfidence,
  });

  const unresolvedAssumptions = Array.from(new Set([
    ...tradeoffs.flatMap((tradeoff) => tradeoff.requiredResolutions.filter((item) => (
      item.toLowerCase().includes('assumption') || item.toLowerCase().includes('exclusion')
    ))),
    ...pricing.snapshots.flatMap((snapshot) => [
      `${snapshot.vendorName}: assumptions use ${snapshot.assumptions.applicationCount} apps and ${snapshot.assumptions.ticketVolumePerMonth} tickets/month.`,
      `${snapshot.vendorName}: rate escalation ${snapshot.costInputs.rateEscalationPercent}% with support hours ${snapshot.assumptions.supportHoursPerWeek}/week.`,
    ]),
  ])).slice(0, 10);

  const viableVendors = tradeoffs
    .filter((tradeoff) => tradeoff.viability !== 'not_viable')
    .map((tradeoff) => tradeoff.vendorName);

  const sentinelCautions = Array.from(new Set([
    ...tradeoffs
      .filter((tradeoff) => tradeoff.evidenceConfidence === 'low')
      .map((tradeoff) => `${tradeoff.vendorName}: evidence confidence is low for selection-level commitment.`),
    ...bafo.sentinelEvidenceNotes,
  ])).slice(0, 6);

  const stewardGateNotes = Array.from(new Set([
    ...bafo.stewardGateNotes,
    ...(blockers.length > 0
      ? ['Selection gate should stay closed until pricing, transition, and evidence blockers are resolved.']
      : ['Selection gate can open for executive review with no hard blockers.']),
  ]));

  const decisionOptions = resolveDecisionOptions(posture);
  const recommendedNextAction = decisionOptions[0];

  const valueAtStakeAmount = input.event.valueAtStakeUsd ?? 0;

  const nexusRecommendation = posture === 'ready_for_selection_review'
    ? 'Proceed to selection review with a documented assumption and exclusion register.'
    : 'Hold final selection and run the next deterministic clarification cycle before executive lock.';

  const atlasExecutiveBrief = [
    `Decision posture: ${posture}.`,
    `Viable vendors: ${viableVendors.length > 0 ? viableVendors.join(', ') : 'none yet'}.`,
    `Commercial risk: ${commercialRisk}; transition risk: ${transitionRisk}; evidence confidence: ${evidenceConfidence}.`,
    `Top blocker: ${blockers[0] ?? 'No blocker currently flagged.'}`,
  ].join(' ');

  return {
    eventId: input.event.id,
    generatedAt,
    decisionNeeded: 'Determine whether the event can move to selection review or should remain in BAFO clarifications.',
    recommendedDecisionPosture: posture,
    viableVendors,
    vendorTradeoffs: tradeoffs,
    valueAtStake: {
      amountUsd: valueAtStakeAmount,
      note: valueAtStakeAmount > 0
        ? 'Value at stake is sourced from seeded Source event value fields.'
        : 'Value at stake is not available in current seeded input.',
    },
    commercialRisk,
    transitionRisk,
    evidenceConfidence,
    unresolvedAssumptions,
    blockers,
    decisionOptions,
    recommendedNextAction,
    nexusRecommendation,
    sentinelCautions,
    stewardGateNotes,
    atlasExecutiveBrief,
  };
}

export function summarizeSourceExecutiveDecision(summary: SourceExecutiveDecisionSummary): string {
  return `Executive decision posture ${summary.recommendedDecisionPosture};`
    + ` viable vendors ${summary.viableVendors.length};`
    + ` blockers ${summary.blockers.length};`
    + ` next action "${summary.recommendedNextAction}".`;
}

export function formatSourceExecutiveDecisionSummaryAsMarkdown(
  summary: SourceExecutiveDecisionSummary,
): string {
  const lines = [
    '# Source Executive Decision Summary',
    '',
    `Event: ${summary.eventId}`,
    `Generated: ${summary.generatedAt}`,
    `Decision needed: ${summary.decisionNeeded}`,
    `Decision posture: ${summary.recommendedDecisionPosture}`,
    `Value at stake: ${summary.valueAtStake.amountUsd.toLocaleString('en-US')} USD`,
    `Commercial risk: ${summary.commercialRisk}`,
    `Transition risk: ${summary.transitionRisk}`,
    `Evidence confidence: ${summary.evidenceConfidence}`,
    '',
    '## Viable vendors',
    ...(summary.viableVendors.length > 0 ? summary.viableVendors.map((vendor) => `- ${vendor}`) : ['- none']),
    '',
    '## Decision options',
    ...summary.decisionOptions.map((option) => `- ${option}`),
    '',
    '## Top blockers',
    ...summary.blockers.map((blocker) => `- ${blocker}`),
    '',
    '## Vendor tradeoffs',
  ];

  for (const tradeoff of summary.vendorTradeoffs) {
    lines.push(
      `- ${tradeoff.vendorName}: ${tradeoff.viability};`
      + ` cost=${tradeoff.costPosition};`
      + ` value=${tradeoff.valuePotential};`
      + ` commercialRisk=${tradeoff.commercialRisk};`
      + ` transitionRisk=${tradeoff.transitionRisk};`
      + ` evidence=${tradeoff.evidenceConfidence}.`,
    );
  }

  lines.push('');
  lines.push('## Atlas executive brief');
  lines.push(summary.atlasExecutiveBrief);

  return lines.join('\n');
}

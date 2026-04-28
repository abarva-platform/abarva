import type { SourceArtifactStatusStripSeedItem, SourceArtifactStatusStripSeed } from './mock-seed';
import { getSourceArtifactStatusStripSeed, getSourceEventSeed } from './mock-seed';
import { buildSourceCommercialSignals } from './commercial-signals';
import { buildSourceExecutiveDecisionSummary } from './executive-decision-summary';
import { buildSourceStageGateReadiness } from './source-stage-gates';
import type { SourceStageGateReadiness } from './source-stage-gate-types';
import type { SourceExecutiveDecisionSummary } from './executive-decision-types';
import type { SourceCommercialSignals } from './commercial-signal-types';
import type {
  SourceVendorSelectionReadiness,
  SourceVendorSelectionReadinessInput,
  SourceVendorSelectionReadinessStatus,
} from './vendor-selection-readiness-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const SOURCE_MODULES_USED = [
  'commercial-signals',
  'commercial-mission-adapter',
  'executive-decision-summary',
  'source-stage-gates',
] as const;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}

function isPricingBlocker(text: string): boolean {
  const lower = normalizeText(text);
  return lower.includes('pricing') && (lower.includes('template') || lower.includes('comparable') || lower.includes('missing'));
}

function toArtifactSourceSeed(
  eventId: string,
  provided?: SourceArtifactStatusStripSeedItem[],
): SourceArtifactStatusStripSeed {
  if (provided && provided.length > 0) {
    return { eventId, artifacts: provided };
  }
  return getSourceArtifactStatusStripSeed(eventId);
}

function deriveVendorSignals(summary: SourceExecutiveDecisionSummary): {
  viableVendors: string[];
  blockedVendors: string[];
} {
  const viableVendors = summary.vendorTradeoffs
    .filter((vendor) => vendor.viability === 'viable')
    .map((vendor) => vendor.vendorName);

  const blockedVendors = summary.vendorTradeoffs
    .filter((vendor) => vendor.viability !== 'viable')
    .map((vendor) => vendor.vendorName);

  return {
    viableVendors: sortUnique(viableVendors),
    blockedVendors: sortUnique(blockedVendors),
  };
}

function resolveArtifactIssues(artifacts: SourceArtifactStatusStripSeedItem[]): {
  unresolvedArtifacts: string[];
  unresolvedApprovals: string[];
} {
  const unresolvedArtifacts: string[] = [];
  const unresolvedApprovals: string[] = [];

  for (const artifact of artifacts) {
    if (artifact.status !== 'approved' && artifact.status !== 'locked') {
      unresolvedArtifacts.push(artifact.artifactName);
    }

    if (
      artifact.approvalState === 'not_started'
      || artifact.approvalState === 'in_review'
      || artifact.approvalState === 'changes_requested'
    ) {
      unresolvedApprovals.push(`${artifact.artifactName}: ${artifact.approvalState}`);
    }
  }

  return {
    unresolvedArtifacts: sortUnique(unresolvedArtifacts),
    unresolvedApprovals: sortUnique(unresolvedApprovals),
  };
}

function deriveReadinessStatus(args: {
  execPosture: SourceExecutiveDecisionSummary['decisionPosture'];
  commercialSignals: SourceCommercialSignals;
  unresolvedCommercialIssues: string[];
  unresolvedEvidenceIssues: string[];
  stageGateOverallState: SourceStageGateReadiness['overallState'];
}): SourceVendorSelectionReadinessStatus {
  if (args.execPosture === 'waiver_required') {
    return 'waiver_required';
  }

  if (
    args.execPosture === 'blocked_missing_pricing'
    || args.commercialSignals.commercialReadiness === 'blocked'
    || args.unresolvedCommercialIssues.some(isPricingBlocker)
  ) {
    return 'blocked_missing_pricing';
  }

  if (
    args.execPosture === 'blocked_low_evidence'
    || args.unresolvedEvidenceIssues.length > 0
    || args.commercialSignals.executiveImplications.sentinelEvidenceNotes.length > 0
  ) {
    return 'blocked_low_evidence';
  }

  if (
    args.stageGateOverallState === 'blocked'
    || args.stageGateOverallState === 'needs_approval'
    || args.stageGateOverallState === 'waiting'
  ) {
    return 'blocked_gate_not_ready';
  }

  if (args.execPosture === 'proceed_to_bafo') {
    return 'proceed_to_bafo';
  }

  if (
    args.unresolvedCommercialIssues.length > 0
    || args.unresolvedEvidenceIssues.length > 0
  ) {
    return 'defer_pending_clarifications';
  }

  return 'ready_for_selection_review';
}

function getRequiredArtifactsFromGates(gates: SourceStageGateReadiness): string[] {
  const requiredArtifacts = gates.gates.flatMap((gate) => (
    gate.state === 'blocked' || gate.state === 'needs_approval'
      ? gate.requiredArtifacts
      : []
  ));
  return sortUnique(requiredArtifacts);
}

function getRequiredApprovalsFromGates(gates: SourceStageGateReadiness): string[] {
  return sortUnique(
    gates.gates
      .flatMap((gate) => (gate.state === 'needs_approval' || gate.state === 'blocked' ? gate.requiredApprovals : [])),
  );
}

function recommendedNextAction(
  readiness: SourceVendorSelectionReadinessStatus,
  commercialIssues: string[],
  evidenceIssues: string[],
  gateIssues: string[],
  requiredApprovals: string[],
): string {
  if (readiness === 'blocked_missing_pricing') {
    return commercialIssues[0] ?? 'Collect complete pricing templates and comparable line-item support.';
  }
  if (readiness === 'blocked_low_evidence') {
    return evidenceIssues[0] ?? 'Request contract-backed evidence before advancing to selection review.';
  }
  if (readiness === 'blocked_gate_not_ready') {
    return gateIssues[0] ?? 'Resolve open stage-gate blockers and required approvals.';
  }
  if (readiness === 'waiver_required') {
    return 'Record explicit waivers and ownership for any residual selection exceptions.';
  }
  if (readiness === 'defer_pending_clarifications' || readiness === 'proceed_to_bafo') {
    return requiredApprovals[0] ?? 'Align commercial, evidence, and approval posture before selection review.';
  }
  return 'Selection review posture remains stable; proceed with executive summary after all blockers are closed.';
}

export function buildSourceVendorSelectionReadiness(
  input: SourceVendorSelectionReadinessInput,
): SourceVendorSelectionReadiness {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const event = input.event;

  const commercialSignals = input.commercialSignals ?? buildSourceCommercialSignals({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey,
      vendorIds: undefined,
    },
    generatedAt,
  });

  const executiveDecisionSummary = input.executiveDecisionSummary ?? buildSourceExecutiveDecisionSummary({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey,
      valueAtStakeUsd: event.valueAtStakeUsd,
    },
    commercialSignals,
    generatedAt,
  });

  const sourceSeed = getSourceEventSeed(event.id);
  const stageGateReadiness = input.stageGateReadiness ?? buildSourceStageGateReadiness({
    event: {
      id: sourceSeed?.id ?? event.id,
      name: sourceSeed?.name ?? event.name,
      currentStageKey: sourceSeed?.currentStageKey ?? event.currentStageKey,
      currentStageLabel: sourceSeed?.currentStageLabel ?? event.currentStageLabel,
      stages: (sourceSeed?.stages ?? []).map((stage) => ({
        key: stage.key,
        label: stage.label,
        status: stage.status,
        summary: stage.summary,
        gate: {
          status: stage.gate.status,
          ownerRole: stage.gate.ownerRole,
          requiredArtifacts: stage.gate.requiredArtifacts,
          blocker: stage.gate.blocker,
        },
      })),
    },
    generatedAt,
  });

  const artifactSeed = toArtifactSourceSeed(event.id, input.artifactStatus);
  const artifactNeeds = resolveArtifactIssues(artifactSeed.artifacts);
  const { viableVendors, blockedVendors } = deriveVendorSignals(executiveDecisionSummary);

  const unresolvedCommercialIssues = sortUnique([
    ...commercialSignals.blockers,
    ...executiveDecisionSummary.blockers,
  ]);

  const unresolvedEvidenceIssues = sortUnique([
    ...commercialSignals.riskSignals.openExceptionTitles,
    ...executiveDecisionSummary.sentinelCautions,
    ...commercialSignals.executiveImplications.sentinelEvidenceNotes,
  ]);

  const unresolvedGateIssues = sortUnique(
    stageGateReadiness.blockers.length > 0
      ? stageGateReadiness.blockers
      : artifactNeeds.unresolvedApprovals,
  );

  const readinessStatus = deriveReadinessStatus({
    execPosture: executiveDecisionSummary.decisionPosture,
    commercialSignals,
    unresolvedCommercialIssues,
    unresolvedEvidenceIssues,
    stageGateOverallState: stageGateReadiness.overallState,
  });

  const requiredArtifacts = sortUnique([
    ...getRequiredArtifactsFromGates(stageGateReadiness),
    ...artifactNeeds.unresolvedArtifacts,
  ]);

  const requiredApprovals = sortUnique([
    ...getRequiredApprovalsFromGates(stageGateReadiness),
    ...artifactNeeds.unresolvedApprovals,
    ...(stageGateReadiness.overallState === 'needs_approval' ? ['Steward gate review'] : []),
  ]);

  const atlasExecutiveImplication = readinessStatus === 'ready_for_selection_review'
    ? `${event.name} has viable vendors with remaining residual risk notes already captured.`
    : `${event.name}: selection review is not yet safe; retain steering committee context and blocker ownership.`;

  const nextAction = recommendedNextAction(
    readinessStatus,
    unresolvedCommercialIssues,
    unresolvedEvidenceIssues,
    unresolvedGateIssues,
    requiredApprovals,
  );

  return {
    eventId: event.id,
    eventName: event.name,
    generatedAt,
    readinessStatus,
    selectionPosture: readinessStatus,
    selectionReviewReady: readinessStatus === 'ready_for_selection_review',
    viableVendors,
    blockedVendors,
    unresolvedCommercialIssues,
    unresolvedEvidenceIssues,
    unresolvedGateIssues,
    requiredArtifacts: requiredArtifacts.length > 0
      ? requiredArtifacts
      : ['Selection artifacts and approvals must be completed before readiness is raised.'],
    requiredApprovals,
    requiredApprovalsForSelection: requiredApprovals,
    recommendedNextAction: nextAction,
    nexusRecommendation:
      readinessStatus === 'ready_for_selection_review'
        ? 'Run a structured selection review with explicit residual risks and conditional assumptions.'
        : 'Keep in clarification and evidence-repair mode until blockers are closed.',
    sentinelCautions: unresolvedEvidenceIssues,
    stewardGateNotes: [
      ...stageGateReadiness.blockers,
      ...artifactNeeds.unresolvedApprovals,
      ...(commercialSignals.blockers.length > 0 ? ['Commercial blocker remains open.'] : []),
    ],
    atlasExecutiveImplication,
    sourceModulesUsed: [...SOURCE_MODULES_USED],
    rationale: `Selection readiness derived from executive decision summary, commercial signals, and stage-gate/artifact completion for ${event.id}.`,
  };
}

export function getSourceVendorSelectionBlockers(readiness: SourceVendorSelectionReadiness): string[] {
  return sortUnique([
    ...readiness.unresolvedCommercialIssues,
    ...readiness.unresolvedEvidenceIssues,
    ...readiness.unresolvedGateIssues,
  ]);
}

export function getSourceVendorSelectionNextActions(readiness: SourceVendorSelectionReadiness): string[] {
  const actions = [readiness.recommendedNextAction];
  if (readiness.selectionReviewReady) {
    return ['Hold selection review for a final cross-functional check before recommendation.'];
  }
  if (readiness.requiredApprovals.length > 0) {
    actions.push(`Resolve approvals: ${readiness.requiredApprovals[0]}`);
  }
  return sortUnique(actions);
}

export function summarizeSourceVendorSelectionReadiness(readiness: SourceVendorSelectionReadiness): string {
  return [
    `Source vendor-selection readiness (${readiness.eventId})`,
    `Selection posture: ${readiness.selectionPosture}`,
    `Selection ready: ${readiness.selectionReviewReady ? 'yes' : 'no'}`,
    `Viable vendors: ${readiness.viableVendors.length > 0 ? readiness.viableVendors.join(', ') : 'none'}`,
    `Blocked vendors: ${readiness.blockedVendors.length > 0 ? readiness.blockedVendors.join(', ') : 'none'}`,
    `Top blocker: ${(getSourceVendorSelectionBlockers(readiness)[0]) ?? 'none'}`,
  ].join(' | ');
}

export function formatSourceVendorSelectionReadinessAsMarkdown(readiness: SourceVendorSelectionReadiness): string {
  return [
    '# Source Vendor Selection Readiness',
    '',
    `- Event: ${readiness.eventName} (${readiness.eventId})`,
    `- Generated: ${readiness.generatedAt}`,
    `- Readiness status: ${readiness.readinessStatus}`,
    `- Selection-ready: ${readiness.selectionReviewReady ? 'Yes' : 'No'}`,
    '',
    '## Vendor posture',
    `- Viable vendors: ${readiness.viableVendors.length > 0 ? readiness.viableVendors.join(', ') : 'none'}`,
    `- Blocked vendors: ${readiness.blockedVendors.length > 0 ? readiness.blockedVendors.join(', ') : 'none'}`,
    '',
    `- Unresolved commercial issues: ${readiness.unresolvedCommercialIssues.join('; ') || 'none'}`,
    `- Unresolved evidence issues: ${readiness.unresolvedEvidenceIssues.join('; ') || 'none'}`,
    `- Unresolved gate issues: ${readiness.unresolvedGateIssues.join('; ') || 'none'}`,
    '',
    `- Required artifacts: ${readiness.requiredArtifacts.join(', ')}`,
    `- Required approvals: ${readiness.requiredApprovals.join(', ')}`,
    `- Required approvals for selection: ${readiness.requiredApprovalsForSelection.join(', ')}`,
    '',
    `- Nexus recommendation: ${readiness.nexusRecommendation}`,
    `- Atlas executive implication: ${readiness.atlasExecutiveImplication}`,
    `- Sentinel cautions: ${readiness.sentinelCautions.join('; ')}`,
    '',
    `- Source modules used: ${readiness.sourceModulesUsed.join(', ')}`,
    '',
    `- Recommended next action: ${readiness.recommendedNextAction}`,
  ].join('\n');
}

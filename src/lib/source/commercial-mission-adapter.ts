import { getSourceContextUsed } from './context-builder';
import type { SourceContextUsed } from './agent-context';
import type {
  SourceAgentMission,
  SourceAgentMissionEvidenceStatus,
  SourceAgentMissionPriority,
  SourceAgentMissionState,
  SourceAgentMissionTrigger,
  SourceAgentMissionType,
} from './agent-mission-types';
import { prioritizeSourceAgentMissions } from './agent-missions';
import type {
  SourceAgentName,
  SourceSuggestedAgentAction,
} from './multi-agent-types';
import {
  buildCommercialMissionQueue,
  type CommercialMissionOwner,
  type CommercialMissionQueueItem,
  type CommercialMissionStatus,
  type CommercialMissionType,
} from './commercial-mission-queue';
import type {
  SourceCommercialMissionAdapterInput,
  SourceCommercialMissionAdapterResult,
  SourceCommercialMissionBuildInput,
  SourceCommercialMissionMarkdownInput,
  SourceCommercialMissionSummary,
} from './commercial-mission-adapter-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const COMMERCIAL_OWNER_TO_AGENT: Record<CommercialMissionOwner, SourceAgentName> = {
  nexus: 'nexus',
  sentinel: 'sentinel',
  atlas: 'atlas',
  steward: 'steward',
  buyer_team: 'steward',
};

const COMMERCIAL_MISSION_TO_CANONICAL_TYPE: Record<CommercialMissionType, SourceAgentMissionType> = {
  price_benchmark: 'value_risk',
  scope_clarification: 'next_action',
  evidence_collection: 'evidence_gap',
  bafo_preparation: 'next_action',
  governance_review: 'gate_check',
  vendor_negotiation: 'next_action',
  risk_mitigation: 'workflow_blocker',
  contract_review: 'artifact_review',
  award_recommendation: 'executive_brief',
  transition_planning: 'gate_check',
};

const COMMERCIAL_STATUS_TO_CANONICAL_STATE: Record<CommercialMissionStatus, SourceAgentMissionState> = {
  queued: 'proposed',
  in_progress: 'active',
  blocked: 'blocked',
  complete: 'completed',
  skipped: 'dismissed',
};

const MISSION_TRIGGER_BY_TYPE: Record<CommercialMissionType, SourceAgentMissionTrigger> = {
  price_benchmark: 'value_at_stake_detected',
  scope_clarification: 'missing_inputs_detected',
  evidence_collection: 'missing_inputs_detected',
  bafo_preparation: 'stage_focus',
  governance_review: 'workflow_validation_report',
  vendor_negotiation: 'stage_focus',
  risk_mitigation: 'workflow_block_detected',
  contract_review: 'workflow_validation_report',
  award_recommendation: 'multi_agent_briefing',
  transition_planning: 'stage_focus',
};

function toEvidenceStatus(item: CommercialMissionQueueItem): SourceAgentMissionEvidenceStatus {
  if (item.missionType === 'evidence_collection') return 'missing';
  if (item.missionType === 'price_benchmark') return 'lowConfidence';
  if (item.status === 'blocked') return 'lowConfidence';
  return 'usable';
}

function toCanonicalPriority(priority: SourceAgentMissionPriority): SourceAgentMissionPriority {
  return priority;
}

function toCanonicalContextUsed(
  item: CommercialMissionQueueItem,
  baseContext: SourceContextUsed[],
): SourceContextUsed[] {
  if (baseContext.length > 0) {
    return baseContext.map((context) => ({
      ...context,
      deterministicFieldsUsed: Array.from(new Set([
        ...context.deterministicFieldsUsed,
        `commercialMission:${item.missionType}`,
        `commercialPriority:${item.priority}`,
        `commercialStatus:${item.status}`,
      ])),
      missingContext: item.blockedBy.length > 0
        ? Array.from(new Set([...context.missingContext, ...item.blockedBy]))
        : context.missingContext,
    }));
  }

  return [{
    eventStateUsed: true,
    patternPackUsed: undefined,
    patternSectionsUsed: [],
    artifactsUsed: [],
    uploadedFilesUsed: [],
    scorecardUsed: false,
    valueLedgerUsed: false,
    citationsUsed: [],
    deterministicFieldsUsed: [
      `commercialMission:${item.missionType}`,
      `commercialPriority:${item.priority}`,
      `commercialStatus:${item.status}`,
      `commercialStage:${item.stage}`,
    ],
    modelAssistedFieldsUsed: [],
    evidenceGatedFieldsUsed: [],
    missingContext: [...item.blockedBy],
  }];
}

function getAgentSuggestedActions(agentName: SourceAgentName, missionId: string): SourceSuggestedAgentAction[] {
  if (agentName === 'nexus') {
    return [
      {
        id: `${missionId}-next`,
        label: 'Explain readiness',
        description: 'Explain what should be done next and why.',
        actionType: 'explainReadiness',
        agentName,
        enabled: true,
      },
      {
        id: `${missionId}-gaps`,
        label: 'Show missing inputs',
        description: 'List missing inputs that block this commercial mission.',
        actionType: 'showMissingInputs',
        agentName,
        enabled: true,
      },
    ];
  }
  if (agentName === 'sentinel') {
    return [
      {
        id: `${missionId}-evidence`,
        label: 'Show evidence gaps',
        description: 'Highlight evidence requirements that remain unresolved.',
        actionType: 'showEvidenceGaps',
        agentName,
        enabled: true,
      },
      {
        id: `${missionId}-validation`,
        label: 'Show validation',
        description: 'Show deterministic validation context for this mission.',
        actionType: 'showContextValidation',
        agentName,
        enabled: true,
      },
    ];
  }
  if (agentName === 'atlas') {
    return [
      {
        id: `${missionId}-tradeoffs`,
        label: 'Prepare executive brief',
        description: 'Summarize vendor tradeoffs for executive review.',
        actionType: 'prepareExecutiveBrief',
        agentName,
        enabled: true,
      },
      {
        id: `${missionId}-value`,
        label: 'Show value at stake',
        description: 'Show value impact and commercial downside signals.',
        actionType: 'showValueAtStake',
        agentName,
        enabled: true,
      },
    ];
  }

  return [
    {
      id: `${missionId}-approvals`,
      label: 'Show required approvals',
      description: 'Show governance approvals needed to clear this mission.',
      actionType: 'showRequiredApprovals',
      agentName,
      enabled: true,
    },
    {
      id: `${missionId}-waiver`,
      label: 'Explain waiver path',
      description: 'Explain waiver options if this gate cannot be closed now.',
      actionType: 'explainWaiverPath',
      agentName,
      enabled: true,
    },
  ];
}

function createRecommendedAction(item: CommercialMissionQueueItem): string {
  const inputs = item.inputs.length > 0 ? ` Inputs: ${item.inputs.join(', ')}.` : '';
  const outputs = item.outputs.length > 0 ? ` Outputs: ${item.outputs.join(', ')}.` : '';
  return `${item.objective}${inputs}${outputs}`;
}

function createBlockerReason(item: CommercialMissionQueueItem): string | undefined {
  if (item.blockedBy.length === 0) return undefined;
  return `Blocked by: ${item.blockedBy.join(', ')}`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isSemanticDuplicate(candidate: SourceAgentMission, existing: SourceAgentMission): boolean {
  const exactMatch = candidate.agentName === existing.agentName
    && candidate.missionType === existing.missionType
    && candidate.sourceEventId === existing.sourceEventId
    && candidate.stageId === existing.stageId
    && normalizeText(candidate.title) === normalizeText(existing.title);
  if (exactMatch) return true;

  const summaryOverlap = normalizeText(existing.summary).includes(normalizeText(candidate.title))
    || normalizeText(candidate.summary).includes(normalizeText(existing.title));
  return candidate.agentName === existing.agentName
    && candidate.missionType === existing.missionType
    && candidate.sourceEventId === existing.sourceEventId
    && summaryOverlap;
}

function toStageId(stage: string): SourceAgentMission['stageId'] {
  const knownStages = new Set([
    'intake',
    'scope',
    'sourcing_strategy',
    'rfp_rfi_package',
    'vendor_responses',
    'evaluation',
    'orals_bafo',
    'selection',
    'contract_mobilization',
    'value_realization',
  ]);
  return knownStages.has(stage) ? stage as SourceAgentMission['stageId'] : undefined;
}

function createCanonicalMission(
  item: CommercialMissionQueueItem,
  contextUsed: SourceContextUsed[],
  generatedAt: string,
): SourceAgentMission {
  const agentName = COMMERCIAL_OWNER_TO_AGENT[item.owner];
  const missionType = COMMERCIAL_MISSION_TO_CANONICAL_TYPE[item.missionType];
  const state = COMMERCIAL_STATUS_TO_CANONICAL_STATE[item.status];
  const trigger = MISSION_TRIGGER_BY_TYPE[item.missionType];
  const summarySuffix = item.owner === 'buyer_team'
    ? ' Human-owner follow-through is required.'
    : '';
  const blockerReason = createBlockerReason(item);

  return {
    missionId: `commercial-${item.missionId}`,
    agentName,
    missionType,
    title: item.title,
    summary: `${item.objective}${summarySuffix}`,
    priority: toCanonicalPriority(item.priority),
    state,
    trigger,
    sourceEventId: item.eventId,
    stageId: toStageId(item.stage),
    relatedArtifactId: undefined,
    evidenceStatus: toEvidenceStatus(item),
    blockerReason,
    recommendedAction: createRecommendedAction(item),
    suggestedActions: getAgentSuggestedActions(agentName, item.missionId),
    handoffTarget: item.owner === 'buyer_team' ? 'steward' : undefined,
    contextUsed: toCanonicalContextUsed(item, contextUsed),
    createdAt: generatedAt,
  };
}

export function adaptCommercialMissionsToSourceAgentMissions(
  input: SourceCommercialMissionAdapterInput,
): SourceCommercialMissionAdapterResult {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const baseContextUsed = input.contextBundle ? getSourceContextUsed(input.contextBundle) : [];
  const existing = input.existingMissions ?? [];
  const adaptedMissions: SourceAgentMission[] = [];
  let duplicateSuppressedCount = 0;

  for (const item of input.commercialQueue.items) {
    const candidate = createCanonicalMission(item, baseContextUsed, generatedAt);
    const duplicateInExisting = existing.some((mission) => isSemanticDuplicate(candidate, mission));
    const duplicateInAdapted = adaptedMissions.some((mission) => isSemanticDuplicate(candidate, mission));

    if (duplicateInExisting || duplicateInAdapted) {
      duplicateSuppressedCount += 1;
      continue;
    }

    adaptedMissions.push(candidate);
  }

  const orderedMissions = prioritizeSourceAgentMissions(adaptedMissions);
  const summary = summarizeSourceCommercialAgentMissions({
    eventId: input.commercialQueue.eventId,
    stage: input.commercialQueue.stage,
    generatedAt,
    adaptedMissions: orderedMissions,
    duplicateSuppressedCount,
    sourceQueueCount: input.commercialQueue.totalCount,
    sourceQueueCriticalCount: input.commercialQueue.criticalCount,
    sourceQueueBlockedCount: input.commercialQueue.blockedCount,
    sourceQueueItems: input.commercialQueue.items,
    summary: '',
  });

  return {
    eventId: input.commercialQueue.eventId,
    stage: input.commercialQueue.stage,
    generatedAt,
    adaptedMissions: orderedMissions,
    duplicateSuppressedCount,
    sourceQueueCount: input.commercialQueue.totalCount,
    sourceQueueCriticalCount: input.commercialQueue.criticalCount,
    sourceQueueBlockedCount: input.commercialQueue.blockedCount,
    sourceQueueItems: input.commercialQueue.items,
    summary: summary.summary,
  };
}

export function buildSourceCommercialAgentMissions(
  input: SourceCommercialMissionBuildInput,
): SourceCommercialMissionAdapterResult {
  const commercialQueue = buildCommercialMissionQueue(input.queueInput);
  return adaptCommercialMissionsToSourceAgentMissions({
    commercialQueue,
    existingMissions: input.existingMissions,
    contextBundle: input.contextBundle,
    generatedAt: input.generatedAt,
  });
}

export function summarizeSourceCommercialAgentMissions(
  result: SourceCommercialMissionAdapterResult,
): SourceCommercialMissionSummary {
  const byAgent: SourceCommercialMissionSummary['byAgent'] = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  const byPriority: SourceCommercialMissionSummary['byPriority'] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let blockedCount = 0;
  for (const mission of result.adaptedMissions) {
    byAgent[mission.agentName] += 1;
    byPriority[mission.priority] += 1;
    if (mission.state === 'blocked') blockedCount += 1;
  }

  return {
    eventId: result.eventId,
    generatedAt: result.generatedAt,
    total: result.adaptedMissions.length,
    byAgent,
    byPriority,
    blockedCount,
    duplicateSuppressedCount: result.duplicateSuppressedCount,
    summary: `Commercial mission adapter: ${result.adaptedMissions.length}/${result.sourceQueueCount}`
      + ` mission(s) mapped to canonical contract for ${result.eventId}.`
      + ` Blocked=${blockedCount}, duplicates suppressed=${result.duplicateSuppressedCount}.`,
  };
}

export function formatSourceCommercialAgentMissionsAsMarkdown(
  input: SourceCommercialMissionMarkdownInput,
): string {
  const summary = summarizeSourceCommercialAgentMissions(input.result);
  const lines = [
    '# Source Commercial Mission Adapter',
    '',
    `Event: ${input.result.eventId}`,
    `Stage: ${input.result.stage}`,
    `Generated: ${input.result.generatedAt}`,
    '',
    `Mapped missions: ${summary.total}/${input.result.sourceQueueCount}`,
    `Duplicates suppressed: ${summary.duplicateSuppressedCount}`,
    `Blocked missions: ${summary.blockedCount}`,
    '',
    '## By agent',
    `- Nexus: ${summary.byAgent.nexus}`,
    `- Sentinel: ${summary.byAgent.sentinel}`,
    `- Atlas: ${summary.byAgent.atlas}`,
    `- Steward: ${summary.byAgent.steward}`,
    '',
    '## By priority',
    `- Critical: ${summary.byPriority.critical}`,
    `- High: ${summary.byPriority.high}`,
    `- Medium: ${summary.byPriority.medium}`,
    `- Low: ${summary.byPriority.low}`,
    '',
    '## Missions',
    ...(input.result.adaptedMissions.length > 0
      ? input.result.adaptedMissions.map((mission) => (
        `- [${mission.priority}/${mission.state}] ${mission.agentName}: ${mission.title}`
      ))
      : ['- none']),
  ];

  if (input.contextUsed && input.contextUsed.length > 0) {
    lines.push('', '## Context used');
    lines.push(...input.contextUsed.map((context) => (
      `- deterministic fields: ${context.deterministicFieldsUsed.join(', ') || 'none'}`
    )));
  }

  return lines.join('\n');
}

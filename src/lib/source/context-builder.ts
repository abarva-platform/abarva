import {
  SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS,
  SOURCE_GOLDEN_EVENT_IDS,
} from './constants';
import { getActiveStage } from './lifecycle';
import {
  getSourceDashboardSeed,
  getSourceEventSeed,
} from './mock-seed';
import type {
  SourceAgentContextBundle,
  SourceAllowedAction,
  SourceArtifactSnapshot,
  SourceCitationCoverage,
  SourceContextAssemblyFailure,
  SourceContextAssemblyInput,
  SourceContextAssemblyResult,
  SourceContextUsed,
  SourceDecisionSnapshot,
  SourceEventSnapshot,
  SourceGateSnapshot,
  SourcePatternContext,
  SourcePersona,
  SourceRiskSnapshot,
  SourceScorecardSnapshot,
  SourceStageSnapshot,
  SourceUserRole,
  SourceValueLedgerLineSnapshot,
  SourceWaitState,
} from './agent-context';
import type { SourceSuggestedAction } from './chat-types';
import type {
  SourceContextQualityAssessment,
  SourceContextQualityDimension,
  SourceContextQualityScore,
  SourceContextQualityScoreValue,
} from './context-quality';
import {
  DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS,
} from './context-quality';
import type {
  ScorecardCriterionStatus,
  SourceLifecycleStatus,
  SourceStageKey,
  SourceStageStatus,
  SourcingEventDetail,
  WorkflowStage,
} from './types';

export type SourceContextBuilderInput = SourceContextAssemblyInput & {
  userRole?: SourceUserRole;
  persona?: SourcePersona;
};

type SourceContextFailureReason = SourceContextAssemblyFailure['code'] | string;

const SEED_UPDATED_AT = '2026-04-24';

const EMPTY_CONTEXT_QUALITY: SourceContextQualityScore = {
  contextCompleteness: 0,
  patternGrounding: 0,
  evidenceCoverage: 0,
  eventStateGrounding: 0,
  missingInputAwareness: 0,
  actionability: 0,
  vanillaResponseRisk: 5,
  overallConfidence: 'low',
  missingContextReasons: [],
};

const MISSING_INPUT_STATUSES: ScorecardCriterionStatus[] = ['blocked', 'draft'];

export function buildSourceAgentContextBundle(input: SourceContextBuilderInput): SourceAgentContextBundle {
  return buildSourceContextFromSeed(input);
}

export function buildSourceContextFromSeed(input: SourceContextBuilderInput): SourceAgentContextBundle {
  if (!input.eventId) {
    return finalizeBundle(createPortfolioContextBundle(input));
  }

  const event = getSourceEventSeed(input.eventId);
  if (!event) {
    return finalizeBundle(createEmptySourceContextBundle(input));
  }

  const requestedStage = input.stageKey
    ? event.stages.find((stage) => stage.key === input.stageKey)
    : undefined;
  const activeStage = requestedStage ?? getActiveStage(event.stages);
  const requiredInputs = getRequiredInputs(event, activeStage);
  const missingInputs = getMissingInputs(event, activeStage);
  const blockers = uniqueStrings([event.blocker, activeStage.gate.blocker].filter(Boolean) as string[]);

  const bundle: SourceAgentContextBundle = {
    ...createEmptySourceContextBundle(input),
    contextScope: input.stageKey ? 'stage' : 'event',
    sourcingEvent: toEventSnapshot(event),
    sourcingArchetype: event.archetype,
    rigorLevel: event.rigor,
    workflowStage: toStageSnapshot(activeStage),
    lifecycleStatus: event.status,
    stageReadinessScore: getStageReadinessScore(activeStage, event.scorecard.criteria),
    nextAction: event.nextAction,
    nextActionOwner: event.owner,
    eventOwner: event.owner,
    stageOwner: activeStage.gate.ownerRole,
    decisionOwner: event.scorecard.decisionOwner,
    agingDays: event.agingDays,
    blockers,
    waitState: toWaitState(event, activeStage),
    requiredInputs,
    missingInputs,
    stageGates: event.stages.map(toGateSnapshot),
    artifacts: event.artifacts.map(toArtifactSnapshot),
    scorecard: toScorecardSnapshot(event),
    projectedValueLedger: event.valueLedger.projected.map(toValueLedgerLineSnapshot),
    realizedValueLedger: event.valueLedger.realized.map(toValueLedgerLineSnapshot),
    risks: event.alerts.map((alert) => toRiskSnapshot(event, activeStage.key, alert)),
    decisions: event.nextDecision ? [toDecisionSnapshot(event)] : [],
    selectedPatternPack: toPatternContext(event),
    citationCoverage: toCitationCoverage(event),
    sourceOfTruthTimestamps: [
      { source: 'source-seed-event', updatedAt: SEED_UPDATED_AT, stale: false },
      { source: 'source-seed-value-ledger', updatedAt: event.valueLedger.updatedAt, stale: false },
      ...event.artifacts.map((artifact) => ({
        source: `source-seed-artifact:${artifact.id}`,
        updatedAt: artifact.updatedAt,
        stale: false,
      })),
    ],
  };

  return finalizeBundle(bundle);
}

export function buildSourceContextAssemblyResultFromSeed(
  input: SourceContextBuilderInput,
): SourceContextAssemblyResult {
  if (input.eventId && !getSourceEventSeed(input.eventId)) {
    return {
      ok: false,
      failure: createSourceContextAssemblyFailure(input, 'eventNotFound'),
    };
  }

  return {
    ok: true,
    bundle: buildSourceContextFromSeed(input),
  };
}

export function createEmptySourceContextBundle(input: SourceContextBuilderInput): SourceAgentContextBundle {
  return {
    tenant: input.tenant,
    user: input.user,
    userRole: input.userRole ?? 'unknown',
    persona: input.persona ?? input.userRole ?? 'unknown',
    route: input.route,
    surface: input.surface,
    contextScope: input.eventId ? 'event' : 'portfolio',
    blockers: [],
    requiredInputs: [],
    missingInputs: [],
    stageGates: [],
    artifacts: [],
    projectedValueLedger: [],
    realizedValueLedger: [],
    uploadedFiles: [],
    selectedAttachmentIds: input.selectedAttachmentIds ?? [],
    allowedActions: [],
    sourceOfTruthTimestamps: [
      { source: 'source-seed', updatedAt: SEED_UPDATED_AT, stale: false },
    ],
    risks: [],
    decisions: [],
    parsedFileSummaries: [],
    evidenceCitations: [],
    relevantPatternSections: [],
    priorConversationTurns: input.priorConversationTurns ?? [],
    userPrompt: input.userPrompt,
    normalizedIntent: 'unknown',
    systemProposedActions: [],
    contextQuality: {
      ...EMPTY_CONTEXT_QUALITY,
      missingContextReasons: input.eventId ? ['Sourcing event context is unavailable.'] : [],
    },
  };
}

export function assessSourceContextQuality(bundle: SourceAgentContextBundle): SourceContextQualityAssessment {
  const hasEvent = Boolean(bundle.sourcingEvent);
  const hasStage = Boolean(bundle.workflowStage);
  const hasPattern = Boolean(bundle.selectedPatternPack);
  const hasPatternSections = bundle.relevantPatternSections.length > 0;
  const hasEvidence = bundle.evidenceCitations.length > 0 || Boolean(bundle.citationCoverage?.citedClaims.length);
  const hasSeedEvidenceSignals = bundle.projectedValueLedger.some((line) => line.evidenceCount > 0)
    || bundle.artifacts.some((artifact) => artifact.status !== 'not_started');
  const hasAction = Boolean(bundle.nextAction) || bundle.allowedActions.some((action) => action.allowed);

  const score: SourceContextQualityScore = {
    contextCompleteness: scoreValue(
      hasEvent ? (hasStage ? 4 : 3) : bundle.contextScope === 'portfolio' ? 3 : 1,
    ),
    patternGrounding: scoreValue(hasPattern ? (hasPatternSections ? 4 : 2) : 0),
    evidenceCoverage: scoreValue(hasEvidence ? 4 : hasSeedEvidenceSignals ? 2 : 0),
    eventStateGrounding: scoreValue(
      hasEvent && hasStage && bundle.lifecycleStatus ? 4 : hasEvent ? 2 : bundle.contextScope === 'portfolio' ? 2 : 0,
    ),
    missingInputAwareness: scoreValue(bundle.missingInputs.length > 0 ? 5 : hasEvent ? 4 : 2),
    actionability: scoreValue(hasAction ? (bundle.allowedActions.some((action) => action.allowed) ? 4 : 3) : 0),
    vanillaResponseRisk: scoreValue(hasEvent && hasStage ? (hasPattern ? 1 : 2) : bundle.contextScope === 'portfolio' ? 2 : 4),
    overallConfidence: 'low',
    missingContextReasons: getMissingContextReasons(bundle),
  };

  score.overallConfidence = getOverallConfidence(score);

  const failedDimensions: SourceContextQualityDimension[] = [];
  if (score.contextCompleteness < DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS.minimumContextGrounding) {
    failedDimensions.push('contextCompleteness');
  }
  if (score.actionability < DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS.minimumActionability) {
    failedDimensions.push('actionability');
  }
  if (hasEvent && score.evidenceCoverage < DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS.minimumEvidenceForEventSpecificAnswer) {
    failedDimensions.push('evidenceCoverage');
  }
  if (score.vanillaResponseRisk > DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS.maximumVanillaResponseRisk) {
    failedDimensions.push('vanillaResponseRisk');
  }

  return {
    score,
    thresholds: DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS,
    passes: failedDimensions.length === 0,
    failedDimensions,
    notes: getMissingContextReasons(bundle),
  };
}

export function getSourceContextUsed(bundle: SourceAgentContextBundle): SourceContextUsed[] {
  return [
    {
      eventStateUsed: Boolean(bundle.sourcingEvent),
      patternPackUsed: bundle.selectedPatternPack?.id,
      patternSectionsUsed: bundle.relevantPatternSections.map((section) => section.id),
      artifactsUsed: bundle.artifacts.map((artifact) => artifact.id),
      uploadedFilesUsed: bundle.uploadedFiles.map((file) => file.id),
      scorecardUsed: Boolean(bundle.scorecard),
      valueLedgerUsed: bundle.projectedValueLedger.length > 0 || Boolean(bundle.realizedValueLedger?.length),
      citationsUsed: bundle.evidenceCitations.map((citation) => citation.id),
      deterministicFieldsUsed: [
        'tenant',
        'user',
        'route',
        'surface',
        ...(bundle.sourcingEvent ? ['sourcingEvent'] : []),
        ...(bundle.workflowStage ? ['workflowStage'] : []),
        ...(bundle.lifecycleStatus ? ['lifecycleStatus'] : []),
        ...(bundle.nextAction ? ['nextAction'] : []),
        ...(bundle.eventOwner ? ['eventOwner'] : []),
        ...(typeof bundle.agingDays === 'number' ? ['agingDays'] : []),
        ...(bundle.stageGates.length ? ['stageGates'] : []),
        ...(bundle.artifacts.length ? ['artifacts'] : []),
        ...(bundle.scorecard ? ['scorecard'] : []),
        ...(bundle.uploadedFiles.length ? ['uploadedFiles'] : []),
      ],
      modelAssistedFieldsUsed: [
        ...(bundle.selectedPatternPack ? ['selectedPatternPack'] : []),
        ...(bundle.relevantPatternSections.length ? ['relevantPatternSections'] : []),
        ...(bundle.priorConversationTurns.length ? ['priorConversationTurns'] : []),
      ],
      evidenceGatedFieldsUsed: [
        ...(bundle.risks.length ? ['risks'] : []),
        ...(bundle.decisions.length ? ['decisions'] : []),
        ...(bundle.projectedValueLedger.length ? ['projectedValueLedger'] : []),
        ...(bundle.realizedValueLedger?.length ? ['realizedValueLedger'] : []),
        ...(bundle.evidenceCitations.length ? ['evidenceCitations'] : []),
        ...(bundle.citationCoverage ? ['citationCoverage'] : []),
      ],
      missingContext: getMissingContextReasons(bundle),
    },
  ];
}

export function getAllowedSourceActions(bundle: SourceAgentContextBundle): SourceAllowedAction[] {
  const actions: SourceAllowedAction[] = [];

  if (bundle.contextScope === 'portfolio') {
    actions.push(
      allowedAction('source-action-review-portfolio', 'Review portfolio attention items', 'navigate'),
      allowedAction('source-action-view-value-ledger', 'View Source value ledger', 'navigate'),
    );
  }

  if (bundle.missingInputs.length > 0) {
    actions.push(
      allowedAction('source-action-show-missing-inputs', 'Show missing inputs', 'requestInput'),
      allowedAction('source-action-generate-minimum-data-request', 'Generate minimum data request', 'requestInput'),
    );
  }

  if (bundle.workflowStage?.key === 'scope') {
    actions.push(allowedAction('source-action-explain-scope-readiness', 'Explain scope readiness', 'ask'));
  }

  if (bundle.waitState?.status === 'waitingOnClient') {
    actions.push(
      allowedAction('source-action-send-client-reminder', 'Send client reminder', 'requestInput'),
      allowedAction('source-action-update-owner', 'Update owner', 'assignOwner'),
      allowedAction('source-action-upload-data', 'Upload supporting data', 'uploadEvidence'),
    );
  }

  if (bundle.scorecard?.lockStatus === 'unlocked') {
    actions.push(allowedAction('source-action-review-scorecard', 'Review scorecard governance', 'reviewScorecard'));
  }

  if (bundle.projectedValueLedger.length > 0 || bundle.realizedValueLedger?.length) {
    actions.push(allowedAction('source-action-view-value-context', 'View value ledger context', 'navigate'));
  }

  if (bundle.artifacts.length > 0) {
    actions.push(allowedAction('source-action-review-artifacts', 'Review available artifacts', 'openArtifact'));
  }

  return uniqueActions(actions);
}

export function getMissingContextReasons(bundle: SourceAgentContextBundle): string[] {
  const reasons: string[] = [];

  if (bundle.contextScope !== 'portfolio' && !bundle.sourcingEvent) {
    reasons.push('Sourcing event context is missing.');
  }
  if (bundle.sourcingEvent && !bundle.workflowStage) {
    reasons.push('Workflow stage context is missing.');
  }
  if (bundle.sourcingEvent && !bundle.selectedPatternPack) {
    reasons.push('Pattern pack context is missing.');
  }
  if (bundle.sourcingEvent && bundle.evidenceCitations.length === 0) {
    reasons.push('No evidence citations are available in the current seed context.');
  }
  if (bundle.missingInputs.length > 0) {
    reasons.push(`Missing inputs remain: ${bundle.missingInputs.join('; ')}.`);
  }
  if (bundle.selectedAttachmentIds.length > 0 && bundle.parsedFileSummaries.length === 0) {
    reasons.push('Selected attachments do not have parsed summaries yet.');
  }

  return uniqueStrings(reasons);
}

export function createSourceContextAssemblyFailure(
  input: SourceContextBuilderInput,
  reason: SourceContextFailureReason,
): SourceContextAssemblyFailure {
  const code = normalizeFailureCode(reason);
  const missingFields = getFailureMissingFields(input, code);

  return {
    code,
    message: getFailureMessage(code, input),
    recoverable: code !== 'permissionDenied',
    missingFields,
  };
}

function createPortfolioContextBundle(input: SourceContextBuilderInput): SourceAgentContextBundle {
  const dashboard = getSourceDashboardSeed();
  const events = dashboard.events;
  const waitingOrBlocked = events.filter((event) => event.blocker || event.status.startsWith('waiting_on'));

  return {
    ...createEmptySourceContextBundle(input),
    contextScope: 'portfolio',
    nextAction: 'Review Source portfolio attention items',
    nextActionOwner: 'Nexus',
    blockers: waitingOrBlocked.map((event) => `${event.name}: ${event.blocker ?? event.statusLabel}`),
    risks: dashboard.attentionItems.map((item) => ({
      id: item.id,
      title: item.title,
      severity: item.severity,
      description: item.detail,
      owner: item.owner,
      evidenceIds: [],
    })),
    decisions: dashboard.attentionItems.map((item) => ({
      id: `decision-${item.id}`,
      title: item.actionLabel,
      owner: item.owner,
      status: 'needed',
      options: [],
      evidenceIds: [],
    })),
    projectedValueLedger: [],
    sourceOfTruthTimestamps: [
      { source: 'source-seed-dashboard', updatedAt: SEED_UPDATED_AT, stale: false },
    ],
  };
}

function finalizeBundle(bundle: SourceAgentContextBundle): SourceAgentContextBundle {
  const allowedActions = getAllowedSourceActions(bundle);
  const withActions: SourceAgentContextBundle = {
    ...bundle,
    allowedActions,
    systemProposedActions: toSuggestedActions(allowedActions),
  };
  const assessment = assessSourceContextQuality(withActions);
  return {
    ...withActions,
    contextQuality: assessment.score,
  };
}

function toEventSnapshot(event: SourcingEventDetail): SourceEventSnapshot {
  return {
    id: event.id,
    code: event.code,
    name: event.name,
    accountName: event.accountName,
    archetype: event.archetype,
    rigor: event.rigor,
    lifecycleStatus: event.status,
    owner: event.owner,
    currentStageKey: event.currentStageKey,
    valueAtStakeUsd: event.valueAtStakeUsd,
    projectedValueUsd: event.projectedValueUsd,
    realizedValueUsd: event.realizedValueUsd,
  };
}

function toStageSnapshot(stage: WorkflowStage): SourceStageSnapshot {
  return {
    key: stage.key,
    label: stage.label,
    status: stage.status,
    readinessScore: getGateStatusScore(stage.gate.status),
    owner: stage.gate.ownerRole,
    summary: stage.summary,
  };
}

function toGateSnapshot(stage: WorkflowStage): SourceGateSnapshot {
  return {
    id: stage.gate.id,
    label: stage.gate.label,
    status: stage.gate.status,
    ownerRole: stage.gate.ownerRole,
    requiredArtifacts: stage.gate.requiredArtifacts,
    blocker: stage.gate.blocker,
    evidenceRequired: [],
  };
}

function toRiskSnapshot(
  event: SourcingEventDetail,
  stageKey: SourceStageKey,
  alert: SourcingEventDetail['alerts'][number],
): SourceRiskSnapshot {
  return {
    id: alert.id,
    title: alert.title,
    severity: alert.severity,
    description: alert.detail,
    owner: event.owner,
    stageKey,
    evidenceIds: [],
  };
}

function toDecisionSnapshot(event: SourcingEventDetail): SourceDecisionSnapshot {
  return {
    id: `decision-${event.id}-next`,
    title: event.nextDecision,
    owner: event.scorecard.decisionOwner || event.owner,
    status: 'needed',
    options: [],
    evidenceIds: [],
  };
}

function toArtifactSnapshot(artifact: SourcingEventDetail['artifacts'][number]): SourceArtifactSnapshot {
  return {
    id: artifact.id,
    title: artifact.title,
    kind: artifact.kind,
    status: artifact.status,
    tier: artifact.tier,
    readiness: artifact.status === 'approved' || artifact.status === 'locked' ? 'ready' : 'needsInputs',
    requiredInputIds: [],
    evidenceIds: [],
    updatedAt: artifact.updatedAt,
  };
}

function toScorecardSnapshot(event: SourcingEventDetail): SourceScorecardSnapshot {
  return {
    approvalState: event.scorecard.approvalState,
    criteria: event.scorecard.criteria,
    defaultWeights: [],
    overrides: [],
    lockStatus: 'unlocked',
  };
}

function toValueLedgerLineSnapshot(
  line: SourcingEventDetail['valueLedger']['projected'][number],
): SourceValueLedgerLineSnapshot {
  return {
    ...line,
    assumption: line.note,
    citationIds: [],
  };
}

function toPatternContext(event: SourcingEventDetail): SourcePatternContext {
  return {
    id: getPatternId(event),
    name: `${event.archetype} Sourcing`,
    version: 'seed',
    archetype: event.archetype,
    rigorLevel: event.rigor,
    relevantSections: [],
  };
}

function toCitationCoverage(event: SourcingEventDetail): SourceCitationCoverage {
  const requiredClaims = [
    event.valueAtStakeUsd > 0 ? 'valueAtStakeUsd' : null,
    event.projectedValueUsd > 0 ? 'projectedValueUsd' : null,
    event.isAtRisk ? 'riskStatus' : null,
  ].filter(Boolean) as string[];

  return {
    requiredClaims,
    citedClaims: [],
    missingCitationClaims: requiredClaims,
    confidence: requiredClaims.length > 0 ? 'low' : 'medium',
  };
}

function toWaitState(event: SourcingEventDetail, stage: WorkflowStage): SourceWaitState {
  return {
    status: toWaitStatus(event.status, stage.status),
    reason: event.blocker ?? stage.gate.blocker ?? undefined,
    owner: event.owner,
    agingDays: event.agingDays,
    escalationThreshold: event.status.startsWith('waiting_on') ? 'Review if aging exceeds 7 days.' : undefined,
  };
}

function getRequiredInputs(event: SourcingEventDetail, stage: WorkflowStage): string[] {
  return uniqueStrings([
    ...stage.gate.requiredArtifacts,
    ...event.scorecard.criteria.filter((criterion) => criterion.required).map((criterion) => criterion.label),
  ]);
}

function getMissingInputs(event: SourcingEventDetail, stage: WorkflowStage): string[] {
  return uniqueStrings([
    stage.gate.blocker,
    event.blocker,
    ...event.scorecard.criteria
      .filter((criterion) => criterion.required && MISSING_INPUT_STATUSES.includes(criterion.status))
      .map((criterion) => criterion.label),
  ].filter(Boolean) as string[]);
}

function getStageReadinessScore(stage: WorkflowStage, criteria: SourcingEventDetail['scorecard']['criteria']): number {
  const gateScore = getGateStatusScore(stage.gate.status);
  const requiredCriteria = criteria.filter((criterion) => criterion.required);
  if (requiredCriteria.length === 0) return gateScore;

  const completeCriteria = requiredCriteria.filter((criterion) => criterion.status === 'approved' || criterion.status === 'ready');
  const criteriaScore = Math.round((completeCriteria.length / requiredCriteria.length) * 100);
  return Math.round((gateScore + criteriaScore) / 2);
}

function getGateStatusScore(status: WorkflowStage['gate']['status']): number {
  switch (status) {
    case 'approved':
      return 100;
    case 'ready':
      return 85;
    case 'in_review':
      return 70;
    case 'blocked':
      return 30;
    case 'not_started':
      return 0;
  }
}

function toWaitStatus(
  status: SourceLifecycleStatus,
  stageStatus: SourceStageStatus,
): SourceWaitState['status'] {
  if (status === 'waiting_on_client') return 'waitingOnClient';
  if (status === 'waiting_on_vendor') return 'waitingOnVendor';
  if (status === 'waiting_on_procurement') return 'waitingOnProcurement';
  if (status === 'waiting_on_executive_decision') return 'waitingOnExecutive';
  if (status === 'paused') return 'paused';
  if (stageStatus === 'blocked') return 'blocked';
  return 'notWaiting';
}

function getPatternId(event: SourcingEventDetail): string {
  if (event.id === SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) {
    return SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.dataAiModernization;
  }
  if (event.id === SOURCE_GOLDEN_EVENT_IDS.amsConsolidation) {
    return SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.amsManagedServices;
  }
  if (event.id === SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild) {
    return SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.digitalProductBuild;
  }
  return event.archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function allowedAction(
  id: string,
  label: string,
  kind: SourceAllowedAction['kind'],
  overrides: Partial<SourceAllowedAction> = {},
): SourceAllowedAction {
  return {
    id,
    label,
    kind,
    allowed: true,
    requiresGateCheck: kind === 'reviewGate' || kind === 'reviewScorecard',
    requiresEvidenceCheck: kind === 'uploadEvidence' || kind === 'openArtifact',
    ...overrides,
  };
}

function toSuggestedActions(actions: SourceAllowedAction[]): SourceSuggestedAction[] {
  return actions.slice(0, 3).map((action, index) => ({
    id: `suggested-${action.id}`,
    label: action.label,
    kind: index === 0 ? 'primary' : 'secondary',
    intent: toSuggestedIntent(action),
    requiresGateCheck: action.requiresGateCheck,
    requiresEvidenceCheck: action.requiresEvidenceCheck,
    allowedAction: action,
    disabledReason: action.blockedReason,
  }));
}

function toSuggestedIntent(action: SourceAllowedAction): SourceSuggestedAction['intent'] {
  if (action.id.includes('missing-inputs')) return 'showMissingInputs';
  if (action.id.includes('minimum-data-request')) return 'generateDataRequest';
  if (action.id.includes('scope-readiness')) return 'explainReadiness';
  if (action.id.includes('scorecard')) return 'showDefaultWeights';
  if (action.id.includes('value')) return 'explainProjectedValue';
  if (action.id.includes('reminder')) return 'draftReminder';
  if (action.id.includes('upload')) return 'askCustomQuestion';
  return 'askCustomQuestion';
}

function uniqueActions(actions: SourceAllowedAction[]): SourceAllowedAction[] {
  return Array.from(new Map(actions.map((action) => [action.id, action])).values());
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function scoreValue(value: number): SourceContextQualityScoreValue {
  return Math.max(0, Math.min(5, Math.round(value))) as SourceContextQualityScoreValue;
}

function getOverallConfidence(score: SourceContextQualityScore): SourceContextQualityScore['overallConfidence'] {
  if (
    score.contextCompleteness >= 4
    && score.actionability >= 4
    && score.evidenceCoverage >= 3
    && score.vanillaResponseRisk <= 1
  ) {
    return 'high';
  }
  if (score.contextCompleteness >= 3 && score.actionability >= 3 && score.vanillaResponseRisk <= 2) {
    return 'medium';
  }
  return 'low';
}

function normalizeFailureCode(reason: SourceContextFailureReason): SourceContextAssemblyFailure['code'] {
  const knownCodes: SourceContextAssemblyFailure['code'][] = [
    'missingTenant',
    'missingUser',
    'eventNotFound',
    'stageNotFound',
    'patternNotFound',
    'evidenceUnavailable',
    'permissionDenied',
    'unknown',
  ];
  return knownCodes.includes(reason as SourceContextAssemblyFailure['code'])
    ? reason as SourceContextAssemblyFailure['code']
    : 'unknown';
}

function getFailureMissingFields(
  input: SourceContextBuilderInput,
  code: SourceContextAssemblyFailure['code'],
): string[] {
  switch (code) {
    case 'missingTenant':
      return ['tenant'];
    case 'missingUser':
      return ['user'];
    case 'eventNotFound':
      return input.eventId ? [`event:${input.eventId}`] : ['eventId'];
    case 'stageNotFound':
      return input.stageKey ? [`stage:${input.stageKey}`] : ['stageKey'];
    case 'patternNotFound':
      return ['selectedPatternPack'];
    case 'evidenceUnavailable':
      return ['evidenceCitations'];
    case 'permissionDenied':
      return ['allowedActions'];
    case 'unknown':
      return [];
  }
}

function getFailureMessage(
  code: SourceContextAssemblyFailure['code'],
  input: SourceContextBuilderInput,
): string {
  switch (code) {
    case 'missingTenant':
      return 'Tenant context is required to assemble Source agent context.';
    case 'missingUser':
      return 'Authenticated user context is required to assemble Source agent context.';
    case 'eventNotFound':
      return `Sourcing event ${input.eventId ?? '(missing event id)'} was not found in the Source seed data.`;
    case 'stageNotFound':
      return `Workflow stage ${input.stageKey ?? '(missing stage key)'} was not found for the selected event.`;
    case 'patternNotFound':
      return 'Pattern context is unavailable for the selected Source event.';
    case 'evidenceUnavailable':
      return 'Evidence citations are unavailable for the selected Source context.';
    case 'permissionDenied':
      return 'The current user is not permitted to assemble this Source context.';
    case 'unknown':
      return 'Source context assembly failed for an unknown deterministic reason.';
  }
}

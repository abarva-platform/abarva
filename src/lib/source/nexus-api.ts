import type {
  SourceAgentContextBundle,
  SourceAuthenticatedUser,
  SourceTenantContext,
  SourceUserRole,
} from './agent-context';
import {
  getSourceContextValidationReadableReport,
  type SourceContextValidationReadableReport,
} from './agent-validation-report';
import {
  buildSourceContextAssemblyResultFromSeed,
} from './context-builder';
import {
  buildSourceMultiAgentBriefing,
  getSourceMultiAgentSuggestedActions,
  summarizeSourceMultiAgentBriefing,
} from './multi-agent-briefing';
import type {
  SourceAgentBriefingMode,
  SourceMultiAgentBriefing,
  SourceSuggestedAgentAction,
} from './multi-agent-types';
import type { SourceStageKey } from './types';
import {
  getSourceWorkflowValidationReadableReport,
  type SourceWorkflowValidationReadableReport,
} from './workflow-validation-report';

export const SOURCE_NEXUS_API_STUB_VERSION = 'source-nexus-api-stub/v1';
export const SOURCE_NEXUS_API_STUB_GENERATED_AT = '2026-04-25T00:00:00.000Z';

export type SourceNexusApiAnswerStatus =
  | 'answered'
  | 'blocked'
  | 'deferred'
  | 'low_context'
  | 'error';

export interface SourceNexusApiRequestBody {
  prompt?: string;
  mode?: SourceAgentBriefingMode;
  focusArea?: string;
  userRole?: SourceUserRole;
  selectedAttachmentIds?: string[];
  stageKey?: SourceStageKey;
}

export interface SourceNexusApiStubInput extends SourceNexusApiRequestBody {
  eventId?: string;
  tenant: SourceTenantContext;
  user: SourceAuthenticatedUser;
  generatedAt?: string;
}

export interface SourceNexusApiValidationSummary {
  verdict: string;
  total: number;
  passCount?: number;
  deferCount: number;
  rejectCount?: number;
  blockCount?: number;
  failCount?: number;
  mismatchCount?: number;
  remainingGaps: string[];
}

export interface SourceNexusIntakeFact {
  id: string;
  label: string;
  prompt: string;
}

export interface SourceNexusIntakeGuidance {
  detectedIntent: 'it_sourcing_event_intake';
  eventType: string;
  opening: string;
  facts: SourceNexusIntakeFact[];
  nextStep: string;
}

export interface SourceNexusApiStubError {
  code:
    | 'missing_event_id'
    | 'event_not_found'
    | 'context_unavailable'
    | 'invalid_request';
  message: string;
  recoverable: boolean;
  missingFields: string[];
}

export interface SourceNexusApiStubResponse {
  ok: boolean;
  httpStatus: number;
  requestId: string;
  eventId: string | null;
  prompt: string;
  mode: SourceAgentBriefingMode;
  focusArea?: string;
  generatedAt: string;
  noModel: true;
  answerStatus: SourceNexusApiAnswerStatus;
  contextScope: SourceAgentContextBundle['contextScope'] | 'unknown';
  contextQuality: SourceAgentContextBundle['contextQuality'] | null;
  context: {
    eventName?: string;
    stageLabel?: string;
    missingInputs: string[];
    blockers: string[];
    selectedAttachmentIds: string[];
  };
  multiAgentBriefing: SourceMultiAgentBriefing | null;
  nexusSummary: {
    title: string;
    summary: string;
    primaryFinding: string;
    recommendedNextAction: string;
    confidence: string;
  } | null;
  suggestedActions: SourceSuggestedAgentAction[];
  contextValidationSummary: SourceNexusApiValidationSummary | null;
  workflowValidationSummary: SourceNexusApiValidationSummary | null;
  warnings: string[];
  defers: string[];
  cannotProceedReasons: string[];
  summary: string;
  intakeGuidance?: SourceNexusIntakeGuidance;
  error?: SourceNexusApiStubError;
}

const DEFAULT_PROMPT = 'Provide the current Source command read.';
const DEFAULT_MODE: SourceAgentBriefingMode = 'event';

export function createSourceNexusApiStubResponse(
  input: SourceNexusApiStubInput,
): SourceNexusApiStubResponse {
  const generatedAt = input.generatedAt ?? SOURCE_NEXUS_API_STUB_GENERATED_AT;
  const prompt = normalizeText(input.prompt) ?? DEFAULT_PROMPT;
  const mode = input.mode ?? DEFAULT_MODE;
  const eventId = normalizeText(input.eventId);

  if (!eventId) {
    return createErrorResponse({
      eventId: null,
      prompt,
      mode,
      generatedAt,
      error: {
        code: 'missing_event_id',
        message: 'eventId is required for the Source Nexus API stub.',
        recoverable: true,
        missingFields: ['eventId'],
      },
      httpStatus: 400,
    });
  }

  const contextResult = buildSourceContextAssemblyResultFromSeed({
    tenant: input.tenant,
    user: input.user,
    userRole: input.userRole ?? 'unknown',
    persona: input.userRole ?? 'unknown',
    route: `/api/v1/source/${eventId}/nexus/ask`,
    surface: 'nexusPanel',
    userPrompt: prompt,
    eventId,
    stageKey: input.stageKey,
    selectedAttachmentIds: input.selectedAttachmentIds ?? [],
  });

  if (!contextResult.ok || !contextResult.bundle) {
    const failure = contextResult.failure;
    return createErrorResponse({
      eventId,
      prompt,
      mode,
      generatedAt,
      error: {
        code: failure?.code === 'eventNotFound' ? 'event_not_found' : 'context_unavailable',
        message: failure?.message ?? 'Source context could not be assembled.',
        recoverable: failure?.recoverable ?? true,
        missingFields: failure?.missingFields ?? [],
      },
      httpStatus: failure?.code === 'eventNotFound' ? 404 : 424,
    });
  }

  const contextValidationReport = getSourceContextValidationReadableReport({ generatedAt });
  const workflowValidationReport = getSourceWorkflowValidationReadableReport({ generatedAt });
  const multiAgentBriefing = buildSourceMultiAgentBriefing({
    contextBundle: contextResult.bundle,
    contextValidationReport,
    workflowValidationReport,
    focusArea: input.focusArea,
    userRole: input.userRole,
    mode,
    generatedAt,
  });
  const suggestedActions = getSourceMultiAgentSuggestedActions(multiAgentBriefing);
  const answerStatus = deriveAnswerStatus(contextResult.bundle, contextValidationReport, workflowValidationReport, multiAgentBriefing);
  const intakeGuidance = maybeBuildIntakeGuidance(prompt);
  const summary = intakeGuidance
    ? formatIntakeGuidanceSummary(intakeGuidance)
    : summarizeSourceMultiAgentBriefing(multiAgentBriefing);

  return {
    ok: answerStatus !== 'error',
    httpStatus: 200,
    requestId: createRequestId(eventId, generatedAt),
    eventId,
    prompt,
    mode,
    focusArea: input.focusArea,
    generatedAt,
    noModel: true,
    answerStatus,
    contextScope: contextResult.bundle.contextScope,
    contextQuality: contextResult.bundle.contextQuality,
    context: {
      eventName: contextResult.bundle.sourcingEvent?.name,
      stageLabel: contextResult.bundle.workflowStage?.label,
      missingInputs: [...contextResult.bundle.missingInputs],
      blockers: [...contextResult.bundle.blockers],
      selectedAttachmentIds: [...contextResult.bundle.selectedAttachmentIds],
    },
    multiAgentBriefing,
    nexusSummary: {
      title: intakeGuidance ? 'Event intake facts required' : multiAgentBriefing.nexus.title,
      summary: intakeGuidance?.opening ?? multiAgentBriefing.nexus.summary,
      primaryFinding: intakeGuidance
        ? 'The event can be opened once the minimum facts are captured.'
        : multiAgentBriefing.nexus.primaryFinding,
      recommendedNextAction: intakeGuidance?.nextStep ?? multiAgentBriefing.nexus.recommendedNextAction,
      confidence: intakeGuidance ? 'medium' : multiAgentBriefing.nexus.confidence,
    },
    suggestedActions,
    contextValidationSummary: summarizeContextValidation(contextValidationReport),
    workflowValidationSummary: summarizeWorkflowValidation(workflowValidationReport),
    warnings: createWarnings(contextResult.bundle, contextValidationReport, workflowValidationReport),
    defers: [
      ...contextValidationReport.deferReasons.map((defer) => `${defer.fixtureId}: ${defer.reason}`),
      ...workflowValidationReport.intentionalDefers.map((defer) => `${defer.fixtureId}: ${defer.explanation}`),
    ],
    cannotProceedReasons: [
      ...multiAgentBriefing.nexus.cannotProceedReasons,
      ...multiAgentBriefing.steward.cannotProceedReasons,
    ],
    summary,
    intakeGuidance,
  };
}

export function normalizeSourceNexusApiRequestBody(body: unknown): SourceNexusApiRequestBody {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const record = body as Record<string, unknown>;

  return {
    prompt: normalizeText(record.prompt),
    mode: normalizeMode(record.mode),
    focusArea: normalizeText(record.focusArea),
    userRole: normalizeUserRole(record.userRole),
    selectedAttachmentIds: normalizeStringArray(record.selectedAttachmentIds),
    stageKey: normalizeStageKey(record.stageKey),
  };
}

function createErrorResponse(args: {
  eventId: string | null;
  prompt: string;
  mode: SourceAgentBriefingMode;
  generatedAt: string;
  error: SourceNexusApiStubError;
  httpStatus: number;
}): SourceNexusApiStubResponse {
  return {
    ok: false,
    httpStatus: args.httpStatus,
    requestId: createRequestId(args.eventId ?? 'missing-event', args.generatedAt),
    eventId: args.eventId,
    prompt: args.prompt,
    mode: args.mode,
    generatedAt: args.generatedAt,
    noModel: true,
    answerStatus: 'error',
    contextScope: 'unknown',
    contextQuality: null,
    context: {
      missingInputs: [],
      blockers: [],
      selectedAttachmentIds: [],
    },
    multiAgentBriefing: null,
    nexusSummary: null,
    suggestedActions: [],
    contextValidationSummary: null,
    workflowValidationSummary: null,
    warnings: ['No model was called. No Source state was mutated.'],
    defers: [],
    cannotProceedReasons: [args.error.message],
    summary: args.error.message,
    error: args.error,
  };
}

function deriveAnswerStatus(
  bundle: SourceAgentContextBundle,
  contextValidationReport: SourceContextValidationReadableReport,
  workflowValidationReport: SourceWorkflowValidationReadableReport,
  briefing: SourceMultiAgentBriefing,
): SourceNexusApiAnswerStatus {
  if (contextValidationReport.suite.rejectCount > 0 || workflowValidationReport.failedExpectations.length > 0) {
    return 'error';
  }
  if (briefing.overallReadiness === 'lowContext' || bundle.contextQuality.overallConfidence === 'low') {
    return 'low_context';
  }
  if (briefing.overallReadiness === 'blocked' || briefing.blockers.length > 0) {
    return 'blocked';
  }
  if (briefing.overallReadiness === 'deferred' || briefing.defers.length > 0) {
    return 'deferred';
  }
  return 'answered';
}

function summarizeContextValidation(
  report: SourceContextValidationReadableReport,
): SourceNexusApiValidationSummary {
  return {
    verdict: report.suite.verdict,
    total: report.suite.totalFixtures,
    passCount: report.suite.passCount,
    deferCount: report.suite.deferCount,
    rejectCount: report.suite.rejectCount,
    remainingGaps: report.remainingContextGaps.map((gap) => `${gap.id}: ${gap.summary}`),
  };
}

function summarizeWorkflowValidation(
  report: SourceWorkflowValidationReadableReport,
): SourceNexusApiValidationSummary {
  const blockCount = report.outcomeDistribution.find((item) => item.outcome === 'BLOCK')?.count ?? 0;
  const deferCount = report.outcomeDistribution.find((item) => item.outcome === 'DEFER')?.count ?? 0;
  const failCount = report.outcomeDistribution.find((item) => item.outcome === 'FAIL')?.count ?? 0;

  return {
    verdict: report.suiteVerdict,
    total: report.totalFixtures,
    deferCount,
    blockCount,
    failCount,
    mismatchCount: report.mismatchCount,
    remainingGaps: [...report.remainingWorkflowGaps],
  };
}

function createWarnings(
  bundle: SourceAgentContextBundle,
  contextValidationReport: SourceContextValidationReadableReport,
  workflowValidationReport: SourceWorkflowValidationReadableReport,
): string[] {
  return unique([
    'No model was called. Response is deterministic.',
    'No Source state was persisted or mutated.',
    ...(bundle.uploadedFiles.length > 0 ? ['Uploaded files are seed context only; no upload/parsing was performed.'] : []),
    ...bundle.contextQuality.missingContextReasons,
    ...contextValidationReport.deferReasons.map((defer) => `Context defer: ${defer.reason}`),
    ...workflowValidationReport.intentionalDefers.map((defer) => `Workflow defer: ${defer.explanation}`),
  ]);
}

function createRequestId(eventId: string, generatedAt: string): string {
  return `source-nexus-api-stub:${eventId}:${generatedAt}`;
}

function maybeBuildIntakeGuidance(prompt: string): SourceNexusIntakeGuidance | undefined {
  if (!isConciseSourcingIntakePrompt(prompt)) return undefined;

  return {
    detectedIntent: 'it_sourcing_event_intake',
    eventType: prompt,
    opening: `To stand up "${prompt}", capture these event-specific gaps.`,
    facts: [
      {
        id: 'why-now',
        label: 'Why now',
        prompt: 'Trigger, deadline, renewal date, risk, or savings mandate.',
      },
      {
        id: 'scope-boundary',
        label: 'Scope boundary',
        prompt: 'In scope, out of scope, geographies, business units, and retained roles.',
      },
      {
        id: 'value-target',
        label: 'Value/savings target',
        prompt: 'Target range, budget baseline, or commercial outcome to protect.',
      },
      {
        id: 'baseline-owner',
        label: 'Required baseline/data owner',
        prompt: 'Owner for inventory, workload/ticket baseline, spend, contracts, and SLAs.',
      },
      {
        id: 'approval-owner',
        label: 'Approval owner',
        prompt: 'Owner/forum for launch, scope, spend guardrails, and shortlist moves.',
      },
    ],
    nextStep: 'Open Intake once the baseline/data owner and approval owner are named.',
  };
}

function isConciseSourcingIntakePrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.length > 120) return false;
  if (/[?]/.test(normalized)) return false;
  if (/\b(why|how|what|when|who|explain|summarize|compare|show|give|draft|generate|advance|readiness|blocker|next)\b/.test(normalized)) {
    return false;
  }
  return /\b(application|managed services|outsourcing|technology|it|cloud|infrastructure|service desk|cyber|vendor|sourcing|procurement|rfp|rfi|ams)\b/.test(normalized);
}

function formatIntakeGuidanceSummary(guidance: SourceNexusIntakeGuidance): string {
  return [
    guidance.opening,
    ...guidance.facts.map((fact, index) => `${index + 1}. ${fact.label}: ${fact.prompt}`),
    guidance.nextStep,
  ].join('\n');
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));
  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

function normalizeMode(value: unknown): SourceAgentBriefingMode | undefined {
  const mode = normalizeText(value);
  if (!mode) return undefined;
  return SOURCE_AGENT_BRIEFING_MODES.has(mode as SourceAgentBriefingMode)
    ? mode as SourceAgentBriefingMode
    : undefined;
}

function normalizeUserRole(value: unknown): SourceUserRole | undefined {
  const role = normalizeText(value);
  if (!role) return undefined;
  return SOURCE_USER_ROLES.has(role as SourceUserRole) ? role as SourceUserRole : undefined;
}

function normalizeStageKey(value: unknown): SourceStageKey | undefined {
  const stageKey = normalizeText(value);
  if (!stageKey) return undefined;
  return SOURCE_STAGE_KEYS.has(stageKey as SourceStageKey) ? stageKey as SourceStageKey : undefined;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

const SOURCE_AGENT_BRIEFING_MODES = new Set<SourceAgentBriefingMode>([
  'dashboard',
  'event',
  'stage',
  'evidence',
  'workflow',
  'executive',
  'lowContext',
]);

const SOURCE_USER_ROLES = new Set<SourceUserRole>([
  'cio',
  'cfo',
  'cto',
  'procurementLeader',
  'pmoLead',
  'legalCompliance',
  'businessSponsor',
  'sourcingLead',
  'operator',
  'viewer',
  'unknown',
]);

const SOURCE_STAGE_KEYS = new Set<SourceStageKey>([
  'strategy',
  'scope',
  'rfp',
  'responses',
  'evaluation',
  'pricing',
  'bafo',
  'executive_decision',
  'selection',
  'transition',
  'value',
  'intake',
  'sourcing_strategy',
  'rfp_rfi_package',
  'vendor_responses',
  'orals_bafo',
  'contract_mobilization',
  'value_realization',
]);

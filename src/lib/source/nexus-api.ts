import type {
  SourceAgentContextBundle,
  SourceAuthenticatedUser,
  SourceLiveTenantContextSnapshot,
  SourceTenantContext,
  SourceUserRole,
} from "./agent-context";
import {
  getSourceContextValidationReadableReport,
  type SourceContextValidationReadableReport,
} from "./agent-validation-report";
import {
  buildSourceContextAssemblyResultFromSeed,
  buildSourceContextFromEventDetail,
} from "./context-builder";
import { getSourceMultiAgentSuggestedActions } from "./multi-agent-briefing";
import type {
  SourceAgentBriefingMode,
  SourceMultiAgentBriefing,
  SentinelSourceBriefing,
  SourceSuggestedAgentAction,
} from "./multi-agent-types";
import {
  buildSentinelSourceBriefing,
  adaptSentinelBriefingToMultiAgent,
} from "./sentinel-source-orchestrator";
import {
  buildSourceAnswerEngine,
  type SourceAnswerEngineOutput,
} from "./source-answer-engine";
import type { AgentResponsePart } from "@/lib/agent/response-parts";
import type { SourceStageKey, SourcingEventDetail } from "./types";
import {
  getSourceWorkflowValidationReadableReport,
  type SourceWorkflowValidationReadableReport,
} from "./workflow-validation-report";
import {
  evaluateLiveAgentAnswerQuality,
  type LiveAgentAnswerQualityResult,
} from "@/lib/agent/quality/live-answer-quality";
import type { ComposeEvidenceLedgerInput } from "@/lib/agent/evidence-ledger/composer";
import type { ScoreReadinessInput } from "@/lib/agent/readiness-score/scorer";

export const SOURCE_SENTINEL_API_VERSION = "source-sentinel-api/v1";
export const SOURCE_SENTINEL_API_GENERATED_AT = "2026-04-25T00:00:00.000Z";
// Back-compat aliases — remove in next major version
export const SOURCE_NEXUS_API_STUB_VERSION = SOURCE_SENTINEL_API_VERSION;
export const SOURCE_NEXUS_API_STUB_GENERATED_AT =
  SOURCE_SENTINEL_API_GENERATED_AT;

export type SourceNexusApiAnswerStatus =
  | "answered"
  | "blocked"
  | "deferred"
  | "low_context"
  | "error";

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
  liveEventDetail?: SourcingEventDetail;
  liveTenantContext?: SourceLiveTenantContextSnapshot;
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
  detectedIntent: "it_sourcing_event_intake";
  eventType: string;
  opening: string;
  facts: SourceNexusIntakeFact[];
  nextStep: string;
}

export interface SourceNexusApiStubError {
  code:
    | "missing_event_id"
    | "event_not_found"
    | "context_unavailable"
    | "invalid_request";
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
  noModel: boolean;
  answerStatus: SourceNexusApiAnswerStatus;
  contextScope: SourceAgentContextBundle["contextScope"] | "unknown";
  contextQuality: SourceAgentContextBundle["contextQuality"] | null;
  context: {
    eventName?: string;
    stageLabel?: string;
    missingInputs: string[];
    blockers: string[];
    selectedAttachmentIds: string[];
  };
  sourceIntelligence: SourceNexusSourceIntelligenceSummary | null;
  sourceAnswer: SourceAnswerEngineOutput | null;
  agentResponseParts: AgentResponsePart[];
  answerQuality?: LiveAgentAnswerQualityResult;
  sentinelBriefing: SentinelSourceBriefing | null;
  /** @deprecated Use sentinelBriefing. Reconstructed via adapter for back-compat; retire in next wave. */
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

export interface SourceNexusSourceIntelligenceSummary {
  liveContextAvailable: boolean;
  sourceEventFound: boolean;
  inventoryRecordCount: number;
  contextChunkCount: number;
  embeddedContextChunkCount: number;
  currentStateAreas: string[];
  evidenceBasis: string[];
  warnings: string[];
}

const DEFAULT_PROMPT = "Provide the current Source command read.";
const DEFAULT_MODE: SourceAgentBriefingMode = "event";

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
        code: "missing_event_id",
        message: "eventId is required for the Source Nexus API stub.",
        recoverable: true,
        missingFields: ["eventId"],
      },
      httpStatus: 400,
    });
  }

  const sourceContextInput = {
    tenant: input.tenant,
    user: input.user,
    userRole: input.userRole ?? "unknown",
    persona: input.userRole ?? "unknown",
    route: `/api/v1/source/${eventId}/nexus/ask`,
    surface: "nexusPanel" as const,
    userPrompt: prompt,
    eventId,
    stageKey: input.stageKey,
    selectedAttachmentIds: input.selectedAttachmentIds ?? [],
  };
  const contextResult = input.liveEventDetail
    ? {
        ok: true as const,
        bundle: buildSourceContextFromEventDetail(
          sourceContextInput,
          input.liveEventDetail,
          {
            liveTenantContext: input.liveTenantContext,
          },
        ),
      }
    : buildSourceContextAssemblyResultFromSeed(sourceContextInput);

  if (!contextResult.ok || !contextResult.bundle) {
    const failure = contextResult.failure;
    return createErrorResponse({
      eventId,
      prompt,
      mode,
      generatedAt,
      error: {
        code:
          failure?.code === "eventNotFound"
            ? "event_not_found"
            : "context_unavailable",
        message: failure?.message ?? "Source context could not be assembled.",
        recoverable: failure?.recoverable ?? true,
        missingFields: failure?.missingFields ?? [],
      },
      httpStatus: failure?.code === "eventNotFound" ? 404 : 424,
    });
  }

  const contextValidationReport = getSourceContextValidationReadableReport({
    generatedAt,
  });
  const workflowValidationReport = getSourceWorkflowValidationReadableReport({
    generatedAt,
  });
  const sentinelBriefing = buildSentinelSourceBriefing({
    contextBundle: contextResult.bundle,
    contextValidationReport,
    workflowValidationReport,
    focusArea: input.focusArea,
    userRole: input.userRole,
    mode,
    generatedAt,
  });
  const multiAgentBriefing =
    adaptSentinelBriefingToMultiAgent(sentinelBriefing);
  const suggestedActions =
    getSourceMultiAgentSuggestedActions(multiAgentBriefing);
  const answerStatus = deriveAnswerStatus(
    contextResult.bundle,
    contextValidationReport,
    workflowValidationReport,
    sentinelBriefing,
  );
  const hasExistingEvent = Boolean(contextResult.bundle.sourcingEvent);
  const intakeGuidance = hasExistingEvent
    ? undefined
    : maybeBuildIntakeGuidance(prompt);
  const sourceAnswer = intakeGuidance
    ? null
    : buildSourceAnswerEngine({
        prompt,
        contextBundle: contextResult.bundle,
        userRole: input.userRole,
        mode,
      });
  const answerQuality = sourceAnswer
    ? evaluateSourceAnswerQuality({
        eventId,
        generatedAt,
        bundle: contextResult.bundle,
        sourceAnswer,
      })
    : undefined;
  const renderedSourceAnswer =
    sourceAnswer && answerQuality
      ? { ...sourceAnswer, answerText: answerQuality.answerText }
      : sourceAnswer;
  const summary = intakeGuidance
    ? formatIntakeGuidanceSummary(intakeGuidance)
    : (renderedSourceAnswer?.answerText ?? sentinelBriefing.combinedSummary);

  return {
    ok: answerStatus !== "error",
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
    sourceIntelligence: summarizeSourceIntelligence(contextResult.bundle),
    sourceAnswer: renderedSourceAnswer,
    agentResponseParts: intakeGuidance
      ? buildIntakeGuidanceParts(intakeGuidance)
      : renderedSourceAnswer?.responseParts ?? [],
    answerQuality,
    sentinelBriefing,
    multiAgentBriefing,
    nexusSummary: {
      title: intakeGuidance
        ? "Event intake facts required"
        : (renderedSourceAnswer?.title ?? sentinelBriefing.primaryVoice.title),
      summary:
        intakeGuidance?.opening ??
        renderedSourceAnswer?.answerText ??
        sentinelBriefing.primaryVoice.summary,
      primaryFinding: intakeGuidance
        ? "The event can be opened once the minimum facts are captured."
        : (renderedSourceAnswer?.currentStateFindings[0] ??
          sentinelBriefing.primaryVoice.primaryFinding),
      recommendedNextAction:
        intakeGuidance?.nextStep ??
        renderedSourceAnswer?.recommendedNextAction ??
        sentinelBriefing.primaryVoice.recommendedNextAction,
      confidence: intakeGuidance
        ? "medium"
        : (renderedSourceAnswer?.confidence ??
          sentinelBriefing.primaryVoice.confidence),
    },
    suggestedActions,
    contextValidationSummary: summarizeContextValidation(
      contextValidationReport,
    ),
    workflowValidationSummary: summarizeWorkflowValidation(
      workflowValidationReport,
    ),
    warnings: createWarnings(
      contextResult.bundle,
      contextValidationReport,
      workflowValidationReport,
    ),
    defers: [
      ...contextValidationReport.deferReasons.map(
        (defer) => `${defer.fixtureId}: ${defer.reason}`,
      ),
      ...workflowValidationReport.intentionalDefers.map(
        (defer) => `${defer.fixtureId}: ${defer.explanation}`,
      ),
    ],
    cannotProceedReasons: sentinelBriefing.primaryVoice.cannotProceedReasons,
    summary,
    intakeGuidance,
  };
}

function evaluateSourceAnswerQuality(args: {
  eventId: string;
  generatedAt: string;
  bundle: SourceAgentContextBundle;
  sourceAnswer: SourceAnswerEngineOutput;
}): LiveAgentAnswerQualityResult {
  return evaluateLiveAgentAnswerQuality({
    tenantKey:
      args.bundle.liveTenantContext?.clientKey ??
      args.bundle.tenant.tenantKey ??
      args.bundle.tenant.tenantId,
    answerText: args.sourceAnswer.answerText,
    evidenceLedger: buildSourceEvidenceLedgerInput(args),
    readiness: buildSourceReadinessInput(args),
  });
}

function buildSourceEvidenceLedgerInput(args: {
  generatedAt: string;
  bundle: SourceAgentContextBundle;
  sourceAnswer: SourceAnswerEngineOutput;
}): ComposeEvidenceLedgerInput {
  const liveContext = args.bundle.liveTenantContext;
  const dataUsed =
    liveContext?.retrievedEvidence.map((item) => ({
      substrateId: item.id,
      label: item.title,
      sourceTable: item.sourceDoc ?? item.sourceType,
      rowCount: 1,
      asOf: args.generatedAt,
    })) ??
    args.sourceAnswer.evidenceCitations.map((item) => ({
      substrateId: item.id,
      label: item.label,
      sourceTable: item.sourceDoc ?? "source_answer_evidence",
      rowCount: 1,
      asOf: args.generatedAt,
    }));
  const missing = [
    ...args.bundle.missingInputs,
    ...args.sourceAnswer.missingData,
  ];

  return {
    owner:
      args.bundle.decisionOwner ??
      args.bundle.eventOwner ??
      args.bundle.nextActionOwner ??
      args.bundle.tenant.activeClientName ??
      args.bundle.tenant.tenantName ??
      null,
    dataUsed,
    dataMissing: Array.from(new Set(missing.filter(Boolean))).map((gap) => ({
      requiredFor: "source answer",
      gapDescription: gap,
      nextLoadStep:
        "Load or confirm this Source evidence before the next gate.",
    })),
    confidence:
      args.sourceAnswer.confidence === "high"
        ? 90
        : args.sourceAnswer.confidence === "medium"
          ? 75
          : 55,
    now: new Date(args.generatedAt),
  };
}

function buildSourceReadinessInput(args: {
  eventId: string;
  bundle: SourceAgentContextBundle;
  sourceAnswer: SourceAnswerEngineOutput;
}): ScoreReadinessInput {
  const presentDimensions = [
    args.bundle.sourcingEvent ? "source_event" : null,
    args.sourceAnswer.evidenceCitations.length > 0 ||
    (args.bundle.liveTenantContext?.retrievedEvidence.length ?? 0) > 0
      ? "supplier_responses"
      : null,
    args.bundle.decisionOwner ||
    args.bundle.stageGates.length > 0 ||
    args.bundle.allowedActions.length > 0
      ? "approval_chain"
      : null,
  ].filter((dimension): dimension is string => Boolean(dimension));

  return {
    questionId: `source:${args.eventId}`,
    questionKind: "source_question",
    presentDimensions,
  };
}

export function normalizeSourceNexusApiRequestBody(
  body: unknown,
): SourceNexusApiRequestBody {
  if (!body || typeof body !== "object") {
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
    requestId: createRequestId(
      args.eventId ?? "missing-event",
      args.generatedAt,
    ),
    eventId: args.eventId,
    prompt: args.prompt,
    mode: args.mode,
    generatedAt: args.generatedAt,
    noModel: true,
    answerStatus: "error",
    contextScope: "unknown",
    contextQuality: null,
    context: {
      missingInputs: [],
      blockers: [],
      selectedAttachmentIds: [],
    },
    sourceIntelligence: null,
    sourceAnswer: null,
    agentResponseParts: [],
    sentinelBriefing: null,
    multiAgentBriefing: null,
    nexusSummary: null,
    suggestedActions: [],
    contextValidationSummary: null,
    workflowValidationSummary: null,
    warnings: ["No model was called. No Source state was mutated."],
    defers: [],
    cannotProceedReasons: [args.error.message],
    summary: args.error.message,
    error: args.error,
  };
}

function buildIntakeGuidanceParts(
  guidance: SourceNexusIntakeGuidance,
): AgentResponsePart[] {
  return [
    {
      type: 'text',
      title: 'aVa intake read',
      text: guidance.opening,
    },
    {
      type: 'table',
      title: 'Minimum facts before sourcing starts',
      columns: ['Fact', 'What aVa needs'],
      rows: guidance.facts.map((fact) => [fact.label, fact.prompt]),
      caption: 'These are capture requirements, not optional notes.',
    },
    {
      type: 'nextAction',
      label: 'Recommended next action',
      detail: guidance.nextStep,
      confidence: 'medium',
    },
  ];
}

function summarizeSourceIntelligence(
  bundle: SourceAgentContextBundle,
): SourceNexusSourceIntelligenceSummary | null {
  const live = bundle.liveTenantContext;
  if (!live) return null;
  return {
    liveContextAvailable: true,
    sourceEventFound: live.sourceEventFound,
    inventoryRecordCount: live.inventoryRecordCount,
    contextChunkCount: live.contextChunkCount,
    embeddedContextChunkCount: live.embeddedContextChunkCount,
    currentStateAreas: [...live.currentStateAreas],
    evidenceBasis: [...live.evidenceBasis],
    warnings: [...live.warnings],
  };
}

function deriveAnswerStatus(
  bundle: SourceAgentContextBundle,
  contextValidationReport: SourceContextValidationReadableReport,
  workflowValidationReport: SourceWorkflowValidationReadableReport,
  briefing: Pick<
    SentinelSourceBriefing,
    "overallReadiness" | "blockers" | "defers"
  >,
): SourceNexusApiAnswerStatus {
  if (
    contextValidationReport.suite.rejectCount > 0 ||
    workflowValidationReport.failedExpectations.length > 0
  ) {
    return "error";
  }
  if (
    briefing.overallReadiness === "lowContext" ||
    bundle.contextQuality.overallConfidence === "low"
  ) {
    return "low_context";
  }
  if (briefing.overallReadiness === "blocked" || briefing.blockers.length > 0) {
    return "blocked";
  }
  if (briefing.overallReadiness === "deferred" || briefing.defers.length > 0) {
    return "deferred";
  }
  return "answered";
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
    remainingGaps: report.remainingContextGaps.map(
      (gap) => `${gap.id}: ${gap.summary}`,
    ),
  };
}

function summarizeWorkflowValidation(
  report: SourceWorkflowValidationReadableReport,
): SourceNexusApiValidationSummary {
  const blockCount =
    report.outcomeDistribution.find((item) => item.outcome === "BLOCK")
      ?.count ?? 0;
  const deferCount =
    report.outcomeDistribution.find((item) => item.outcome === "DEFER")
      ?.count ?? 0;
  const failCount =
    report.outcomeDistribution.find((item) => item.outcome === "FAIL")?.count ??
    0;

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
    "No model was called. Response is deterministic.",
    "No Source state was persisted or mutated.",
    ...(bundle.uploadedFiles.length > 0
      ? [
          "Uploaded files are seed context only; no upload/parsing was performed.",
        ]
      : []),
    ...bundle.contextQuality.missingContextReasons,
    ...contextValidationReport.deferReasons.map(
      (defer) => `Context defer: ${defer.reason}`,
    ),
    ...workflowValidationReport.intentionalDefers.map(
      (defer) => `Workflow defer: ${defer.explanation}`,
    ),
  ]);
}

function createRequestId(eventId: string, generatedAt: string): string {
  return `source-sentinel-api:${eventId}:${generatedAt}`;
}

function maybeBuildIntakeGuidance(
  prompt: string,
): SourceNexusIntakeGuidance | undefined {
  if (!isConciseSourcingIntakePrompt(prompt)) return undefined;

  return {
    detectedIntent: "it_sourcing_event_intake",
    eventType: prompt,
    opening: `To stand up "${prompt}", capture these event-specific gaps.`,
    facts: [
      {
        id: "why-now",
        label: "Why now",
        prompt: "Trigger, deadline, renewal date, risk, or savings mandate.",
      },
      {
        id: "scope-boundary",
        label: "Scope boundary",
        prompt:
          "In scope, out of scope, geographies, business units, and retained roles.",
      },
      {
        id: "value-target",
        label: "Value/savings target",
        prompt:
          "Target range, budget baseline, or commercial outcome to protect.",
      },
      {
        id: "baseline-owner",
        label: "Required baseline/data owner",
        prompt:
          "Owner for inventory, workload/ticket baseline, spend, contracts, and SLAs.",
      },
      {
        id: "approval-owner",
        label: "Approval owner",
        prompt:
          "Owner/forum for launch, scope, spend guardrails, and shortlist moves.",
      },
    ],
    nextStep:
      "Open Intake once the baseline/data owner and approval owner are named.",
  };
}

function isConciseSourcingIntakePrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.length > 120) return false;
  if (/[?]/.test(normalized)) return false;
  if (
    /\b(why|how|what|when|who|explain|summarize|compare|show|give|draft|generate|advance|readiness|blocker|next)\b/.test(
      normalized,
    )
  ) {
    return false;
  }
  return /\b(application|managed services|outsourcing|technology|it|cloud|infrastructure|service desk|cyber|vendor|sourcing|procurement|rfp|rfi|ams)\b/.test(
    normalized,
  );
}

function formatIntakeGuidanceSummary(
  guidance: SourceNexusIntakeGuidance,
): string {
  return [
    guidance.opening,
    ...guidance.facts.map(
      (fact, index) => `${index + 1}. ${fact.label}: ${fact.prompt}`,
    ),
    guidance.nextStep,
  ].join("\n");
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
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
    ? (mode as SourceAgentBriefingMode)
    : undefined;
}

function normalizeUserRole(value: unknown): SourceUserRole | undefined {
  const role = normalizeText(value);
  if (!role) return undefined;
  return SOURCE_USER_ROLES.has(role as SourceUserRole)
    ? (role as SourceUserRole)
    : undefined;
}

function normalizeStageKey(value: unknown): SourceStageKey | undefined {
  const stageKey = normalizeText(value);
  if (!stageKey) return undefined;
  return SOURCE_STAGE_KEYS.has(stageKey as SourceStageKey)
    ? (stageKey as SourceStageKey)
    : undefined;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

const SOURCE_AGENT_BRIEFING_MODES = new Set<SourceAgentBriefingMode>([
  "dashboard",
  "event",
  "stage",
  "evidence",
  "workflow",
  "executive",
  "lowContext",
]);

const SOURCE_USER_ROLES = new Set<SourceUserRole>([
  "cio",
  "cfo",
  "cto",
  "procurementLeader",
  "pmoLead",
  "legalCompliance",
  "businessSponsor",
  "sourcingLead",
  "operator",
  "viewer",
  "unknown",
]);

const SOURCE_STAGE_KEYS = new Set<SourceStageKey>([
  "strategy",
  "scope",
  "rfp",
  "responses",
  "evaluation",
  "pricing",
  "bafo",
  "executive_decision",
  "selection",
  "transition",
  "value",
  "intake",
  "sourcing_strategy",
  "rfp_rfi_package",
  "vendor_responses",
  "orals_bafo",
  "contract_mobilization",
  "value_realization",
]);

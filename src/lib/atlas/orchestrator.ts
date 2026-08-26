import { classifyAtlasIntent } from "@/lib/atlas/classifier";
import { runAtlasLlm } from "@/lib/atlas/llm";
import { isTowerFactualSpineCandidate } from "@/lib/atlas/tower-factual-spine";
import { query_tower_current_state } from "@/lib/atlas/tool-belt";
import {
  buildAtlasSystemPrompt,
  ATLAS_PROMPT_VERSION,
} from "@/lib/atlas/prompt";
import {
  appendAtlasTrace,
  appendAtlasReasoningTrace,
  createAtlasObservation,
  getOrCreateAtlasThread,
  touchAtlasThread,
} from "@/lib/atlas/repository";
import {
  makeScriptedChatResponse,
  runScriptedAtlasIntent,
} from "@/lib/atlas/scripted-engine";
import {
  listInitiativesForClient,
  listVendorsForClient,
} from "@/lib/admin/ai-initiatives/queries";
import {
  buildTowerBandMetrics,
  type TowerLens,
} from "@/lib/tower/band-metrics-view";
import {
  buildMetricExplanation,
  renderMetricExplanationForAtlas,
} from "@/lib/tower/metric-explanation-view";
import { buildAtlasGroundingDisclosure } from "@/lib/atlas/value-grounding";
import {
  ATLAS_REASONING_MODEL,
  ATLAS_TRAINING_PACKAGE_VERSION,
} from "@/lib/tower/atlas-reasoning-trace";
import { resolveTowerToday } from "@/lib/tower/today-resolution";
import { selectAtlasPatterns } from "@/lib/tower/atlas-pattern-selectors";
import {
  canonicalCioTowerTenantKey,
} from "@/lib/tower/metric-packet";
import { canonicalCioTowerTenantDisplayName } from "@/lib/tower/metric-packet";
import { answerCurrentTowerQuestion } from "@/lib/tower/current-layer-answer";
import type {
  AtlasChatResponse,
  AtlasDebugTrace,
  AtlasMetricExplanationRequest,
  AtlasObservation,
  AtlasTenancyCtx,
  AtlasToolResultMap,
  AtlasTurnResult,
} from "@/lib/atlas/types";

const METRIC_KEYS = new Set([
  "portfolio_roi",
  "active_pressures",
  "spend_at_risk",
  "renewals_90d",
  "adoption_rate",
]);

const PRESSURE_FLAGS = new Set([
  "cost_overrun",
  "value_lag",
  "stalled",
  "duplication_risk",
  "adoption_gap",
]);

function guessObservationKind(
  intent: AtlasChatResponse["intent"],
): AtlasObservation["observationKind"] {
  if (intent === "morning_summary" || intent === "portfolio_status")
    return "summary";
  if (intent === "shadow_ai_detail" || intent === "signal_detail")
    return "anomaly";
  if (intent === "cohort_position") return "cohort_context";
  if (intent === "strategy_refusal") return "recommendation";
  return "summary";
}

function extractSeverity(text: string): AtlasObservation["severity"] {
  const normalized = text.toLowerCase();
  if (normalized.includes("critical") || normalized.includes("loudest issue"))
    return "critical";
  if (normalized.includes("warning") || normalized.includes("lag"))
    return "warning";
  return "info";
}

function resolveLens(value: unknown): TowerLens {
  if (value === "risk" || value === "contract" || value === "adopt")
    return value;
  return "value";
}

function confidenceFloorFromBand(
  bandMetrics: ReturnType<typeof buildTowerBandMetrics>,
): "high" | "med" | "low" | "none" {
  const values = bandMetrics.metrics.map((metric) => metric.confidence);
  if (values.includes("low")) return "low";
  if (values.includes("med")) return "med";
  if (values.includes("none")) return "none";
  return "high";
}

function lowerConfidence(
  value: "HIGH" | "MED" | "LOW",
): "high" | "med" | "low" {
  if (value === "HIGH") return "high";
  if (value === "MED") return "med";
  return "low";
}

function confidenceFloorFromTowerState(
  towerState: NonNullable<AtlasToolResultMap["towerState"]>,
): "high" | "med" | "low" | "none" {
  const values = towerState.bandMetrics.metrics.map(
    (metric) => metric.confidence,
  );
  if (values.includes("low")) return "low";
  if (values.includes("med")) return "med";
  if (values.includes("none")) return "none";
  return "high";
}

function shouldLeadAtlasWithEnterpriseRead(message: string, intent: AtlasChatResponse['intent']): boolean {
  if (intent === 'morning_summary' || intent === 'portfolio_status') return true;
  return /\b(context|current state|what.*telling|landscape|overall|summary|where are we|what should i know)\b/i.test(message);
}

function enrichWithEnterpriseRead(input: {
  message: string;
  response: AtlasChatResponse;
  toolResults: AtlasToolResultMap;
}): AtlasChatResponse {
  const read = input.toolResults.derivedEnterpriseRead;
  if (!read || !shouldLeadAtlasWithEnterpriseRead(input.message, input.response.intent)) return input.response;
  if (input.response.response.includes(read.headline)) return input.response;
  const move = read.recommendedMoves[0];
  return {
    ...input.response,
    response: [
      `Enterprise read: ${read.headline}`,
      move ? `First move: ${move.title} — ${move.decision}` : null,
      input.response.response,
    ].filter(Boolean).join('\n\n'),
  };
}

function traceConfidenceFloor(value: 'high' | 'med' | 'low' | 'none'): 'HIGH' | 'MED' | 'LOW' {
  if (value === 'high') return 'HIGH';
  if (value === 'med') return 'MED';
  return 'LOW';
}

function readMetricExplanationRequest(
  surfaceContext: Record<string, unknown> | undefined,
): AtlasMetricExplanationRequest | null {
  const raw = surfaceContext?.metricExplanationRequest;
  if (!raw || typeof raw !== "object") return null;
  const request = raw as Partial<AtlasMetricExplanationRequest>;
  if (request.source !== "tower_metric_provenance") return null;
  if (
    typeof request.metricKey !== "string" ||
    !METRIC_KEYS.has(request.metricKey)
  )
    return null;
  return {
    source: "tower_metric_provenance",
    metricKey: request.metricKey,
    displayValue:
      typeof request.displayValue === "string"
        ? request.displayValue
        : undefined,
    displayConfidence:
      request.displayConfidence === "high" ||
      request.displayConfidence === "med" ||
      request.displayConfidence === "low" ||
      request.displayConfidence === "none"
        ? request.displayConfidence
        : undefined,
    mode: request.mode === "levers" ? "levers" : "why",
  };
}

function wantsDebugTrace(
  surfaceContext: Record<string, unknown> | undefined,
): boolean {
  return (
    surfaceContext?.traceMode === true || surfaceContext?.auditTrace === true
  );
}

function makeFallbackDebugTrace(input: {
  enabled: boolean;
  routeType: AtlasChatResponse["routeType"];
  intent: AtlasChatResponse["intent"];
  rawResponse: string;
}): AtlasDebugTrace | undefined {
  if (!input.enabled) return undefined;
  return {
    routing: {
      promptVersion: ATLAS_PROMPT_VERSION,
      dossierId: null,
      dossierVersion: null,
      dossierBuiltAt: null,
      fallbackUsed: true,
      fallbackReason: `${input.routeType}:${input.intent}`,
      shapeIssues: [],
    },
    finalPrompt: null,
    rawModelResponse: input.rawResponse,
    renderedResponse: "",
    replacements: [],
  };
}

async function runGovernedCioTowerTurn(input: {
  ctx: AtlasTenancyCtx;
  threadId: string;
  message: string;
  surfaceContext?: Record<string, unknown>;
}): Promise<{
  response: AtlasChatResponse;
  toolResults: AtlasToolResultMap;
  modelName: string | null;
}> {
  const towerState = await query_tower_current_state(
    input.ctx,
    input.surfaceContext,
  );
  const tenantKey = canonicalCioTowerTenantKey(
    towerState.client.tenantKey ?? input.ctx.clientKey ?? input.ctx.clientId,
  );
  const tenantName =
    canonicalCioTowerTenantDisplayName({
      key: tenantKey,
      name: towerState.client.clientName,
    }) ??
    towerState.client.clientName ??
    tenantKey;
  const answer = await answerCurrentTowerQuestion({
    tenantId: input.ctx.clientId,
    userId: input.ctx.userId,
    tenantKey,
    tenantName,
    question: input.message,
  });

  return {
    toolResults: { towerState },
    modelName: answer.model,
    response: {
      threadId: input.threadId,
      routeType: "tool_augmented",
      intent: "llm",
      response: answer.response,
      suggestions: [
        {
          label: "Show source proof",
          value: "Show the source evidence behind this Tower answer.",
          kind: "message",
        },
        {
          label: "Compare value proof",
          value: "Compare budget commitment against measured value proof.",
          kind: "message",
        },
      ],
      signalId: null,
      observationId: null,
      toolsUsed: ["query_tower_current_state", "answer_current_tower_question"],
      atlasMode: "live",
      fallbackReason: null,
      debugTrace: wantsDebugTrace(input.surfaceContext)
        ? ({
            routing: {
              promptVersion: ATLAS_PROMPT_VERSION,
              dossierId: null,
              dossierVersion: null,
              dossierBuiltAt: null,
              fallbackUsed: false,
              fallbackReason: null,
              shapeIssues: [],
            },
            finalPrompt: answer.promptPackageKey,
            rawModelResponse: answer.modelOutputRaw,
            renderedResponse: "",
            replacements: [],
          } satisfies AtlasDebugTrace)
        : undefined,
    },
  };
}

async function runMetricExplanationTurn(input: {
  ctx: AtlasTenancyCtx;
  threadId: string;
  surfaceContext?: Record<string, unknown>;
  request: AtlasMetricExplanationRequest;
}): Promise<{ response: AtlasChatResponse; toolResults: AtlasToolResultMap }> {
  const [initiatives, vendors] = await Promise.all([
    listInitiativesForClient(input.ctx.clientId),
    listVendorsForClient(input.ctx.clientId),
  ]);
  const todayIso = resolveTowerToday();
  const lens = resolveLens(input.surfaceContext?.activeTowerLens);
  const bandMetrics = buildTowerBandMetrics(
    initiatives,
    vendors,
    todayIso,
    lens,
  );
  const explanation = buildMetricExplanation({
    tenant: {
      name:
        typeof input.surfaceContext?.tenantName === "string"
          ? input.surfaceContext.tenantName
          : "Active client",
      clientId: input.ctx.clientId,
    },
    metricKey: input.request.metricKey,
    displayValue: input.request.displayValue,
    displayConfidence: input.request.displayConfidence,
    todayIso,
    initiatives,
    vendors,
    bandMetrics,
  });
  await appendAtlasReasoningTrace({
    threadId: input.threadId,
    tenantId: input.ctx.clientId,
    userId: input.ctx.userId,
    trigger: "metric_explanation",
    inputSummary: {
      initiativesCount: initiatives.length,
      vendorsCount: vendors.length,
      pressuresCount: initiatives.filter((initiative) =>
        PRESSURE_FLAGS.has(initiative.statusFlag),
      ).length,
      bandConfidenceFloor: confidenceFloorFromBand(bandMetrics),
      lens,
      todayIso,
      metricKey: explanation.metricKey,
    },
    patternsFired: [],
    patternsSkipped: [],
    observations: [
      {
        number: 1,
        topic: explanation.metricKey,
        body: explanation.headline,
        confidenceFloor: explanation.confidenceFloor.level,
        citationsCount: explanation.citations.length,
        actionsCount: explanation.levers.length,
      },
    ],
    ifYouOnlyDoOneToday: explanation.levers[0]?.action ?? null,
    citations: explanation.citations,
    interpretationConfidence: lowerConfidence(
      explanation.confidenceFloor.level,
    ),
    fallbackUsed: false,
    fallbackReason: null,
    model: ATLAS_REASONING_MODEL,
    promptVersion: ATLAS_PROMPT_VERSION,
    packageVersion: ATLAS_TRAINING_PACKAGE_VERSION,
  }).catch(() => null);

  return {
    toolResults: { metricExplanation: explanation },
    response: {
      threadId: input.threadId,
      routeType: "tool_augmented",
      intent: "metric_explanation",
      response: renderMetricExplanationForAtlas(explanation),
      suggestions: [
        {
          label: "Show levers",
          value: `Show the lever map for ${explanation.metricKey}`,
          kind: "message",
        },
        {
          label: "Audit confidence",
          value: `Why is confidence ${explanation.confidenceFloor.level} for ${explanation.metricKey}?`,
          kind: "message",
        },
      ],
      signalId: null,
      observationId: null,
      toolsUsed: ["tower_metric_explanation"],
      atlasMode: "live",
      fallbackReason: null,
      metricExplanation: explanation,
    },
  };
}

async function appendChatReasoningTrace(input: {
  ctx: AtlasTenancyCtx;
  threadId: string;
  response: AtlasChatResponse;
  toolResults: AtlasToolResultMap;
  latencyMs: number;
  modelName: string | null;
  atlasMode: AtlasChatResponse["atlasMode"];
  fallbackReason: string | null;
}): Promise<void> {
  const towerState = input.toolResults.towerState;
  if (!towerState) return;

  const patterns = selectAtlasPatterns({
    initiatives: towerState.initiatives,
    vendors: towerState.vendors,
    pressuresView: towerState.pressuresView,
    alignment2x2View: towerState.alignment2x2View,
    todayIso: towerState.todayIso,
  });
  const patternsFired = [patterns.leadPattern, ...patterns.secondaryPatterns];
  const bandFloor = confidenceFloorFromTowerState(towerState);
  const citations = [
    {
      field: "tower_view.initiative_count",
      value: towerState.substrateCounts.initiatives,
    },
    {
      field: "tower_view.vendor_count",
      value: towerState.substrateCounts.vendors,
    },
    {
      field: "tower_view.kpi_snapshot_count",
      value: towerState.substrateCounts.kpiSnapshots,
    },
    {
      field: "tower_view.pressure_count",
      value: towerState.substrateCounts.pressures,
    },
    {
      field: "tower_view.observation_count",
      value: towerState.substrateCounts.observations,
    },
  ];

  await appendAtlasReasoningTrace({
    threadId: input.threadId,
    tenantId: input.ctx.clientId,
    userId: input.ctx.userId,
    trigger: "atlas_chat_turn",
    inputSummary: {
      initiativesCount: towerState.substrateCounts.initiatives,
      vendorsCount: towerState.substrateCounts.vendors,
      pressuresCount: towerState.substrateCounts.pressures,
      bandConfidenceFloor: bandFloor,
      lens: towerState.activeLens,
      todayIso: towerState.todayIso,
    },
    patternsFired,
    patternsSkipped: [],
    observations: [
      {
        number: 1,
        topic: input.response.intent,
        body: input.response.response.slice(0, 900),
        confidenceFloor: traceConfidenceFloor(bandFloor),
        citationsCount: citations.length,
        actionsCount: input.response.suggestions.length,
      },
    ],
    ifYouOnlyDoOneToday: input.response.suggestions[0]?.value ?? null,
    citations,
    interpretationConfidence:
      towerState.substrateCounts.initiatives === 0
        ? "low"
        : bandFloor === "low" || bandFloor === "none"
          ? "med"
          : "high",
    fallbackUsed: input.atlasMode === "fallback",
    fallbackReason: input.fallbackReason,
    latencyMs: input.latencyMs,
    model: input.modelName ?? ATLAS_REASONING_MODEL,
    promptVersion: ATLAS_PROMPT_VERSION,
    packageVersion: ATLAS_TRAINING_PACKAGE_VERSION,
  }).catch(() => null);
}

export async function runAtlasTurn(input: {
  ctx: AtlasTenancyCtx;
  message: string;
  threadId?: string | null;
  signalId?: string | null;
  surfaceContext?: Record<string, unknown>;
}): Promise<AtlasChatResponse> {
  const detailed = await runAtlasTurnDetailed(input);
  return {
    threadId: detailed.threadId,
    routeType: detailed.routeType,
    intent: detailed.intent,
    response: detailed.response,
    suggestions: detailed.suggestions,
    signalId: detailed.signalId ?? null,
    observationId: detailed.observationId ?? null,
    toolsUsed: detailed.toolsUsed,
    atlasMode: detailed.atlasMode,
    fallbackReason: detailed.fallbackReason ?? null,
    groundingDisclosure: detailed.groundingDisclosure,
    debugTrace: detailed.debugTrace,
  };
}

export async function runAtlasTurnDetailed(input: {
  ctx: AtlasTenancyCtx;
  message: string;
  threadId?: string | null;
  signalId?: string | null;
  surfaceContext?: Record<string, unknown>;
}): Promise<AtlasTurnResult> {
  const startedAt = Date.now();
  const classification = classifyAtlasIntent(input.message);
  const thread = await getOrCreateAtlasThread(input.ctx, {
    threadId: input.threadId,
    title: input.message.slice(0, 80),
    signalId: input.signalId,
  });

  await appendAtlasTrace({
    threadId: thread.id,
    role: "user",
    routeType: classification.routeType,
    content: {
      message: input.message,
      signalId: input.signalId ?? null,
      surfaceContext: input.surfaceContext ?? null,
    },
    promptVersion: ATLAS_PROMPT_VERSION,
  });

  let response: AtlasChatResponse;
  let toolResults: AtlasToolResultMap = {};
  let modelName: string | null = null;
  const metricExplanationRequest = readMetricExplanationRequest(
    input.surfaceContext,
  );
  if (isTowerFactualSpineCandidate(input.message)) {
    const governed = await runGovernedCioTowerTurn({
      ctx: input.ctx,
      threadId: thread.id,
      message: input.message,
      surfaceContext: input.surfaceContext,
    });
    response = governed.response;
    toolResults = governed.toolResults;
    modelName = governed.modelName;
  } else if (metricExplanationRequest) {
    const metricTurn = await runMetricExplanationTurn({
      ctx: input.ctx,
      threadId: thread.id,
      surfaceContext: input.surfaceContext,
      request: metricExplanationRequest,
    });
    response = metricTurn.response;
    toolResults = metricTurn.toolResults;
    response.debugTrace = makeFallbackDebugTrace({
      enabled: wantsDebugTrace(input.surfaceContext),
      routeType: response.routeType,
      intent: response.intent,
      rawResponse: response.response,
    });
  } else if (
    classification.routeType === "scripted" ||
    classification.routeType === "hybrid"
  ) {
    const scripted = await runScriptedAtlasIntent(
      input.ctx,
      classification.intent,
      input.message,
      input.surfaceContext,
    );
    toolResults = scripted.toolResults;
    response = makeScriptedChatResponse(
      {
        threadId: thread.id,
        observationId: null,
      },
      classification.intent,
      scripted,
    );
    response.debugTrace = makeFallbackDebugTrace({
      enabled: wantsDebugTrace(input.surfaceContext),
      routeType: response.routeType,
      intent: response.intent,
      rawResponse: response.response,
    });
  } else {
    const llm = await runAtlasLlm(
      input.ctx,
      input.message,
      input.surfaceContext,
    );
    modelName = llm.modelName;
    toolResults = llm.toolResults;
    response = {
      threadId: thread.id,
      routeType: "llm",
      intent: "llm",
      response: llm.response,
      suggestions: llm.suggestions,
      toolsUsed: llm.toolsUsed,
      atlasMode: llm.atlasMode,
      fallbackReason: llm.fallbackReason,
      signalId:
        llm.toolResults.signalDetail?.id ??
        llm.toolResults.signals?.[0]?.id ??
        null,
      observationId: null,
      debugTrace: llm.debugTrace,
    };
  }

  const groundingDisclosure = buildAtlasGroundingDisclosure(
    toolResults.valueGrounding,
  );
  if (groundingDisclosure) {
    response = {
      ...response,
      groundingDisclosure,
    };
  }
  response = enrichWithEnterpriseRead({
    message: input.message,
    response,
    toolResults,
  });
  response = {
    ...response,
    debugTrace: response.debugTrace
      ? {
          ...response.debugTrace,
          routing: {
            ...response.debugTrace.routing,
            shapeIssues: [],
          },
          renderedResponse: response.response,
          replacements: [],
        }
      : undefined,
  };

  const observationId = await createAtlasObservation({
    ctx: input.ctx,
    threadId: thread.id,
    signalId: response.signalId ?? input.signalId ?? null,
    summary: response.response.slice(0, 480),
    details: {
      source_message: input.message,
      system_prompt: buildAtlasSystemPrompt(
        toolResults.towerState?.client.clientName ??
          toolResults.portfolio?.clientName ??
          "Active client",
      ),
      suggestions: response.suggestions,
      surface_context: input.surfaceContext ?? null,
      metric_explanation: response.metricExplanation ?? null,
      atlas_mode: response.atlasMode,
      fallback_reason: response.fallbackReason ?? null,
    },
    severity: extractSeverity(response.response),
    observationKind: guessObservationKind(response.intent),
    routeType: response.routeType,
  });

  await appendAtlasTrace({
    threadId: thread.id,
    role: "atlas",
    routeType: response.routeType,
    content: {
      response: response.response,
      suggestions: response.suggestions,
      signalId: response.signalId ?? null,
      metricExplanation: response.metricExplanation ?? null,
      atlasMode: response.atlasMode,
      fallbackReason: response.fallbackReason ?? null,
    },
    toolsUsed: response.toolsUsed,
    modelName,
    promptVersion: ATLAS_PROMPT_VERSION,
    latencyMs: Date.now() - startedAt,
    observationId,
  });

  await appendChatReasoningTrace({
    ctx: input.ctx,
    threadId: thread.id,
    response,
    toolResults,
    latencyMs: Date.now() - startedAt,
    modelName,
    atlasMode: response.atlasMode,
    fallbackReason: response.fallbackReason ?? null,
  });

  await touchAtlasThread(thread.id);

  return {
    ...response,
    observationId,
    toolResults,
    modelName,
    promptVersion: ATLAS_PROMPT_VERSION,
  };
}

import { classifyAtlasIntent } from '@/lib/atlas/classifier';
import { runAtlasLlm } from '@/lib/atlas/llm';
import { buildAtlasSystemPrompt, ATLAS_PROMPT_VERSION } from '@/lib/atlas/prompt';
import {
  appendAtlasTrace,
  createAtlasObservation,
  getOrCreateAtlasThread,
  touchAtlasThread,
} from '@/lib/atlas/repository';
import { makeScriptedChatResponse, runScriptedAtlasIntent } from '@/lib/atlas/scripted-engine';
import { listInitiativesForClient, listVendorsForClient } from '@/lib/admin/ai-initiatives/queries';
import { buildTowerBandMetrics, type TowerLens } from '@/lib/tower/band-metrics-view';
import { buildMetricExplanation, renderMetricExplanationForAtlas } from '@/lib/tower/metric-explanation-view';
import { resolveTowerToday } from '@/lib/tower/today-resolution';
import type {
  AtlasChatResponse,
  AtlasMetricExplanationRequest,
  AtlasObservation,
  AtlasTenancyCtx,
  AtlasToolResultMap,
  AtlasTurnResult,
} from '@/lib/atlas/types';

const METRIC_KEYS = new Set([
  'portfolio_roi',
  'active_pressures',
  'spend_at_risk',
  'renewals_90d',
  'adoption_rate',
]);

function guessObservationKind(intent: AtlasChatResponse['intent']): AtlasObservation['observationKind'] {
  if (intent === 'morning_summary' || intent === 'portfolio_status') return 'summary';
  if (intent === 'shadow_ai_detail' || intent === 'signal_detail') return 'anomaly';
  if (intent === 'cohort_position') return 'cohort_context';
  if (intent === 'strategy_refusal') return 'recommendation';
  return 'summary';
}

function extractSeverity(text: string): AtlasObservation['severity'] {
  const normalized = text.toLowerCase();
  if (normalized.includes('critical') || normalized.includes('loudest issue')) return 'critical';
  if (normalized.includes('warning') || normalized.includes('lag')) return 'warning';
  return 'info';
}

function resolveLens(value: unknown): TowerLens {
  if (value === 'risk' || value === 'contract' || value === 'adopt') return value;
  return 'value';
}

function readMetricExplanationRequest(
  surfaceContext: Record<string, unknown> | undefined,
): AtlasMetricExplanationRequest | null {
  const raw = surfaceContext?.metricExplanationRequest;
  if (!raw || typeof raw !== 'object') return null;
  const request = raw as Partial<AtlasMetricExplanationRequest>;
  if (request.source !== 'tower_metric_provenance') return null;
  if (typeof request.metricKey !== 'string' || !METRIC_KEYS.has(request.metricKey)) return null;
  return {
    source: 'tower_metric_provenance',
    metricKey: request.metricKey,
    displayValue: typeof request.displayValue === 'string' ? request.displayValue : undefined,
    displayConfidence:
      request.displayConfidence === 'high' ||
      request.displayConfidence === 'med' ||
      request.displayConfidence === 'low' ||
      request.displayConfidence === 'none'
        ? request.displayConfidence
        : undefined,
    mode: request.mode === 'levers' ? 'levers' : 'why',
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
  const bandMetrics = buildTowerBandMetrics(initiatives, vendors, todayIso, lens);
  const explanation = buildMetricExplanation({
    tenant: {
      name: typeof input.surfaceContext?.tenantName === 'string' ? input.surfaceContext.tenantName : 'Active client',
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

  return {
    toolResults: { metricExplanation: explanation },
    response: {
      threadId: input.threadId,
      routeType: 'tool_augmented',
      intent: 'metric_explanation',
      response: renderMetricExplanationForAtlas(explanation),
      suggestions: [
        {
          label: 'Show levers',
          value: `Show the lever map for ${explanation.metricKey}`,
          kind: 'message',
        },
        {
          label: 'Audit confidence',
          value: `Why is confidence ${explanation.confidenceFloor.level} for ${explanation.metricKey}?`,
          kind: 'message',
        },
      ],
      signalId: null,
      observationId: null,
      toolsUsed: ['tower_metric_explanation'],
      metricExplanation: explanation,
    },
  };
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
    role: 'user',
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
  const metricExplanationRequest = readMetricExplanationRequest(input.surfaceContext);

  if (metricExplanationRequest) {
    const metricTurn = await runMetricExplanationTurn({
      ctx: input.ctx,
      threadId: thread.id,
      surfaceContext: input.surfaceContext,
      request: metricExplanationRequest,
    });
    response = metricTurn.response;
    toolResults = metricTurn.toolResults;
  } else if (classification.routeType === 'scripted' || classification.routeType === 'hybrid') {
    const scripted = await runScriptedAtlasIntent(input.ctx, classification.intent, input.message);
    toolResults = scripted.toolResults;
    response = makeScriptedChatResponse(
      {
        threadId: thread.id,
        observationId: null,
      },
      classification.intent,
      scripted,
    );
  } else {
    const llm = await runAtlasLlm(input.ctx, input.message);
    modelName = llm.modelName;
    toolResults = llm.toolResults;
    response = {
      threadId: thread.id,
      routeType: 'llm',
      intent: 'llm',
      response: llm.response,
      suggestions: llm.suggestions,
      toolsUsed: llm.toolsUsed,
      signalId: llm.toolResults.signalDetail?.id ?? llm.toolResults.signals?.[0]?.id ?? null,
      observationId: null,
    };
  }

  const observationId = await createAtlasObservation({
    ctx: input.ctx,
    threadId: thread.id,
    signalId: response.signalId ?? input.signalId ?? null,
    summary: response.response.slice(0, 480),
    details: {
      source_message: input.message,
      system_prompt: buildAtlasSystemPrompt(toolResults.portfolio?.clientName ?? 'Apex Retail Group'),
      suggestions: response.suggestions,
      surface_context: input.surfaceContext ?? null,
      metric_explanation: response.metricExplanation ?? null,
    },
    severity: extractSeverity(response.response),
    observationKind: guessObservationKind(response.intent),
    routeType: response.routeType,
  });

  await appendAtlasTrace({
    threadId: thread.id,
    role: 'atlas',
    routeType: response.routeType,
    content: {
      response: response.response,
      suggestions: response.suggestions,
      signalId: response.signalId ?? null,
      metricExplanation: response.metricExplanation ?? null,
    },
    toolsUsed: response.toolsUsed,
    modelName,
    promptVersion: ATLAS_PROMPT_VERSION,
    latencyMs: Date.now() - startedAt,
    observationId,
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

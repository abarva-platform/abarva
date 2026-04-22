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
import type { AtlasChatResponse, AtlasObservation, AtlasTenancyCtx } from '@/lib/atlas/types';

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

export async function runAtlasTurn(input: {
  ctx: AtlasTenancyCtx;
  message: string;
  threadId?: string | null;
  signalId?: string | null;
}): Promise<AtlasChatResponse> {
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
    content: { message: input.message, signalId: input.signalId ?? null },
    promptVersion: ATLAS_PROMPT_VERSION,
  });

  let response: AtlasChatResponse;
  let modelName: string | null = null;

  if (classification.routeType === 'scripted' || classification.routeType === 'hybrid') {
    const scripted = await runScriptedAtlasIntent(input.ctx, classification.intent, input.message);
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
      system_prompt: buildAtlasSystemPrompt('Active client'),
      suggestions: response.suggestions,
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
  };
}

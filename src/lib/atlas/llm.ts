import { getAuditedAnthropicClient } from '@/lib/agent/stream';
import { buildAtlasSystemPrompt, ATLAS_PROMPT_VERSION } from '@/lib/atlas/prompt';
import {
  query_cohort_benchmarks,
  query_portfolio_aggregates,
  query_programs,
  query_signal_evidence,
  query_signals,
  query_tower_current_state,
  query_use_cases,
} from '@/lib/atlas/tool-belt';
import { assembleRetrievalContext } from '@/lib/agent/retrieval';
import { CITATION_INSTRUCTION, formatRetrievedContext } from '@/lib/agent/retrieval-format';
import { formatTowerCurrentStateForPrompt } from '@/lib/atlas/tower-grounding';
import { buildAtlasValueGrounding, renderAtlasValueGrounding } from '@/lib/atlas/value-grounding';
import type { AtlasExecutionMode, AtlasSuggestion, AtlasTenancyCtx, AtlasToolResultMap } from '@/lib/atlas/types';
import {
  AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
  sanitizeAutonomousDecisionLanguage,
} from '@/lib/ai-liability/human-decision-controls';

/**
 * Atlas live-prod composition wiring (ATLAS-RUNLLM-COMPOSITION 2026-05-31).
 *
 * The deployed `/api/v1/atlas/ask` route invokes `runAtlasLlm` for any prompt
 * the scripted classifier doesn't catch. Before this change, hybrid and
 * initiative-deep questions (e.g. "How does our Copilot pace in AR-02 compare
 * to peers?") were sent to Claude with the composed four-section answer
 * embedded as RETRIEVED CONTEXT — the LLM then paraphrased it, dropping the
 * `Your data / Industry context / The gap / Next move` structure. The
 * 2026-05-30 live-prod smoke caught this: 0/2 hybrid turns rendered the
 * four-section structure even though the in-process composer harness
 * produced it 21/21.
 *
 * Fix: when `composeAtlasIacAnswer` (already invoked inside
 * `assembleRetrievalContext`) returns a hybrid or initiative-specific
 * composition, return that composed text directly and skip the Anthropic
 * call. Mode stays `live` because the composer is a deterministic substrate
 * read, not a degraded fallback. `archetype-specific` (no tenant initiative
 * anchor) continues to flow through the LLM since the model adds value by
 * weaving the corpus context with the user question.
 */
const COMPOSITION_MODEL_NAME = 'atlas-composition-deterministic';

/**
 * Atlas Fix C (truncation): canonical CXO response shapes range from short
 * lead-bullet briefs (3–7 lines) to industry-context reads (12–20 lines) and
 * lead-tables. The original 500-token cap chopped industry-context responses
 * mid-sentence. 2000 covers the canon with headroom and stays well under
 * Anthropic per-request limits.
 */
export const ATLAS_MAX_TOKENS = 2000;

/**
 * Atlas Fix C (determinism): all Atlas Anthropic calls use temperature=0 so
 * identical input → identical output. Exported for assertion in tests.
 */
export const ATLAS_TEMPERATURE = 0;

function sanitizeForTenantPrompt(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForTenantPrompt(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const safe: Record<string, unknown> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const safeKey = key === 'apexValue'
      ? 'tenantValue'
      : key === 'apexPercentile'
        ? 'tenantPercentile'
        : key === 'apex_to_median_ratio'
          ? 'tenant_to_median_ratio'
          : key;
    safe[safeKey] = sanitizeForTenantPrompt(rawValue);
  }
  return safe;
}

function buildFallback(toolResults: AtlasToolResultMap): string {
  const tower = toolResults.towerState;
  const portfolio = toolResults.portfolio;
  const topSignal = toolResults.signalDetail ?? toolResults.signals?.[0];
  const programCount = toolResults.programs?.length ?? 0;
  if (tower) {
    const hero = tower.bandMetrics.metrics.find((metric) => metric.hero) ?? tower.bandMetrics.metrics[0];
    const topPressure = tower.pressuresView.cards[0];
    const corpusNote =
      toolResults.retrievalContext &&
      (toolResults.retrievalContext.industryChunks.length > 0 ||
        toolResults.retrievalContext.topicChunks.length > 0 ||
        toolResults.retrievalContext.clientChunks.length > 0 ||
        Boolean(toolResults.retrievalContext.atlasIacComposition))
        ? 'I also pulled corpus or industry context for this turn.'
        : 'No corpus or industry chunks were retrieved for this turn, so I will keep external comparisons qualified.';
    return [
      `${tower.client.clientName} Tower is grounded on ${tower.substrateCounts.initiatives} initiatives, ${tower.substrateCounts.vendors} vendors, ${tower.substrateCounts.kpiSnapshots} KPI snapshots, ${tower.substrateCounts.decisions} decisions, and ${tower.substrateCounts.scenarios} scenarios.`,
      hero ? `The lead displayed metric is ${hero.label}: ${hero.value} (${hero.confidence}).` : null,
      topPressure ? `The lead pressure is ${topPressure.headline}` : 'No active pressure card is displayed from the DB.',
      toolResults.valueGrounding ? renderAtlasValueGrounding(toolResults.valueGrounding) : null,
      corpusNote,
    ].filter(Boolean).join(' ');
  }
  const lines = [
    portfolio
      ? `${portfolio.clientName} is carrying ${portfolio.activeUseCaseCount} active use cases with ${portfolio.criticalSignalCount} critical and ${portfolio.warningSignalCount} warning signals.`
      : null,
    topSignal
      ? `${topSignal.signalTitle} is the loudest issue at ${typeof topSignal.impactUsd === 'number' ? `$${(topSignal.impactUsd / 1_000_000).toFixed(1)}M` : 'material impact'}.`
      : null,
    programCount > 0 ? `${programCount} programs are already active, so any new move should be sequenced against current capacity.` : null,
    'I can go deeper on Shadow AI, peer position, or current program load.',
  ];
  return lines.filter(Boolean).join(' ');
}

function normalizeFallbackReason(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 240);
  }
  const value = String(error ?? '').trim();
  return value ? value.slice(0, 240) : 'unknown_model_error';
}

function logAtlasMode(args: {
  tenantId: string;
  mode: AtlasExecutionMode;
  reason: string | null;
  model: string;
  workflow: string;
}): void {
  const payload = {
    event: 'atlas_model_mode',
    tenantId: args.tenantId,
    mode: args.mode,
    reason: args.reason,
    model: args.model,
    workflow: args.workflow,
  };
  if (args.mode === 'fallback') {
    console.warn('[atlas.mode]', JSON.stringify(payload));
    return;
  }
  console.info('[atlas.mode]', JSON.stringify(payload));
}

export async function runAtlasLlm(
  ctx: AtlasTenancyCtx,
  message: string,
  surfaceContext?: Record<string, unknown>,
): Promise<{
  response: string;
  toolsUsed: string[];
  suggestions: AtlasSuggestion[];
  toolResults: AtlasToolResultMap;
  modelName: string | null;
  atlasMode: AtlasExecutionMode;
  fallbackReason: string | null;
  promptVersion: string;
}> {
  const towerState = await query_tower_current_state(ctx, surfaceContext);
  const [portfolio, signals, programs, useCases, benchmark, retrievalContext] = await Promise.all([
    query_portfolio_aggregates(ctx),
    query_signals(ctx, { limit: 4 }),
    query_programs(ctx),
    query_use_cases(ctx),
    query_cohort_benchmarks(ctx, 'adoption_penetration_pct_avg'),
    assembleRetrievalContext({
      clientId: ctx.clientId,
      industry: towerState.client.industryCode,
      userQuery: message,
      topKClient: 3,
      topKIndustry: 4,
      topKTopic: 3,
      atlasTenancy: ctx,
    }),
  ]);

  const toolResults: AtlasToolResultMap = {
    towerState,
    retrievalContext,
    portfolio,
    signals,
    programs,
    useCases,
    benchmark,
  };
  const valueGrounding = await buildAtlasValueGrounding({
    ctx,
    message,
    portfolio,
    towerState,
  });
  toolResults.valueGrounding = valueGrounding;

  const toolsUsed = [
    'query_tower_current_state',
    'assemble_retrieval_context',
    'query_portfolio_aggregates',
    'query_signals',
    'query_programs',
    'query_use_cases',
    'query_cohort_benchmarks',
    'search_canonical_pattern_index',
  ];

  const topSignal = signals[0];
  if (topSignal && /shadow ai|signal|evidence|provenance|vendor/i.test(message)) {
    toolResults.signalDetail = await query_signal_evidence(ctx, topSignal.id);
    toolsUsed.push('query_signal_evidence');
  }

  // ATLAS-RUNLLM-COMPOSITION 2026-05-31 — short-circuit to the deterministic
  // four-section composer when the prompt is an IAC hybrid or initiative-
  // specific question and the composer produced a real answer. This wires
  // the in-process IAC E2E harness path (21/21 four-section render) into
  // the live deployed route so live prod no longer paraphrases the
  // structure away.
  //
  // Eligibility:
  //   - intent.kind === 'hybrid'              (initiative + archetype)
  //   - intent.kind === 'initiative-specific' (tenant initiative anchor)
  // The 'archetype-specific' path (no tenant anchor) still flows through the
  // LLM — the model adds value weaving corpus context with the user prompt
  // there, and forcing a one-section composer answer would regress.
  const iac = retrievalContext.atlasIacComposition;
  const eligibleForCompositionShortCircuit =
    !!iac &&
    (iac.intent.kind === 'hybrid' || iac.intent.kind === 'initiative-specific');
  if (eligibleForCompositionShortCircuit && iac) {
    logAtlasMode({
      tenantId: ctx.clientId,
      mode: 'live',
      reason: null,
      model: COMPOSITION_MODEL_NAME,
      workflow: 'atlas-llm',
    });
    return {
      response: sanitizeAutonomousDecisionLanguage(iac.response),
      toolsUsed: [...toolsUsed, 'compose_atlas_iac_answer'],
      suggestions: [
        { label: 'Peer context', value: 'How do we compare to peers?', kind: 'message' },
        { label: 'Industry moves', value: 'What are others doing in this industry?', kind: 'message' },
        topSignal
          ? { label: 'Open top signal', value: `signal:${topSignal.id}`, kind: 'signal' }
          : { label: 'Programs', value: 'Show active programs', kind: 'message' },
      ],
      toolResults,
      modelName: COMPOSITION_MODEL_NAME,
      atlasMode: 'live',
      fallbackReason: null,
      promptVersion: ATLAS_PROMPT_VERSION,
    };
  }

  const apiKeyPresent = !!process.env.ANTHROPIC_API_KEY;
  if (!apiKeyPresent) {
    logAtlasMode({
      tenantId: ctx.clientId,
      mode: 'fallback',
      reason: 'missing_anthropic_api_key',
      model: 'claude-opus-4-7',
      workflow: 'atlas-llm',
    });
    return {
      response: sanitizeAutonomousDecisionLanguage(buildFallback(toolResults)),
      toolsUsed,
      suggestions: [
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
        { label: 'Programs', value: 'Show active programs', kind: 'message' },
      ],
      toolResults,
      modelName: null,
      atlasMode: 'fallback',
      fallbackReason: 'missing_anthropic_api_key',
      promptVersion: ATLAS_PROMPT_VERSION,
    };
  }

  const system = buildAtlasSystemPrompt(towerState.client.clientName);
  const towerContext = formatTowerCurrentStateForPrompt(towerState);
  const retrievedContext = formatRetrievedContext(retrievalContext);
  const valueGroundingContext = renderAtlasValueGrounding(valueGrounding);
  const payload = JSON.stringify(sanitizeForTenantPrompt(toolResults), null, 2);
  const userText = [
    `User question: ${message}`,
    '',
    AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
    '',
    'Answer from the current Tower state first. Then use retrieved corpus / industry context when present. For financial or value advice, keep projected, tracked, and verified value separate and ground recommendations in the canonical pattern confidence, KPIs, baseline requirements, and measurement method. If any baseline, measurement, or provenance field is missing, say so instead of quantifying an outcome. If the ask is strategic, explain the implications but route the actual choice to Intelligence or a Program charter.',
    '',
    towerContext,
    '',
    `ATLAS VALUE GROUNDING\n${valueGroundingContext}`,
    '',
    retrievedContext || 'RETRIEVED CONTEXT\nNo corpus, industry, or client vector chunks were retrieved for this turn.',
    '',
    CITATION_INSTRUCTION,
    '',
    'Raw tool context follows for exact IDs and auditability. Do not surface raw JSON unless asked.',
    payload,
  ].join('\n');
  const { client } = await getAuditedAnthropicClient({
    tenantId: ctx.clientId,
    userId: ctx.userId ?? undefined,
    workflow: 'atlas-llm',
    model: 'claude-opus-4-7',
    prompt: [system, userText].join('\n\n'),
    dataClass: 'confidential',
    metadata: { surface: 'tower' },
  });

  let response: string;
  let modelName: string | null = 'claude-opus-4-7';
  let fallbackReason: string | null = null;
  try {
    const result = await client.messages.create({
      model: 'claude-opus-4-7',
      // Atlas Fix C (determinism): claude-opus-4-7 has deprecated the
      // `temperature` parameter (Anthropic returns 400 invalid_request_error
      // when it is set). Determinism on opus-4-7 is now intrinsic to the model
      // family rather than tunable. The `ATLAS_TEMPERATURE` constant is kept
      // exported (set to 0) for unit-test assertion of intent.
      // Atlas Fix C (truncation): 500 tokens cut industry-context responses
      // mid-sentence (audit example: "...vs peer median."). ATLAS_MAX_TOKENS
      // covers the canonical CXO response shapes with headroom.
      max_tokens: ATLAS_MAX_TOKENS,
      system,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userText,
            },
          ],
        },
      ],
    });

    const responseParts: string[] = [];
    for (const item of result.content) {
      if (item.type === 'text') {
        responseParts.push(item.text);
      }
    }
    response = responseParts.join('\n').trim();
    if (!response) {
      logAtlasMode({
        tenantId: ctx.clientId,
        mode: 'fallback',
        reason: 'empty_model_response',
        model: 'claude-opus-4-7',
        workflow: 'atlas-llm',
      });
      response = `Model unavailable — deterministic read. ${buildFallback(toolResults)}`;
      modelName = null;
      fallbackReason = 'empty_model_response';
    } else {
      logAtlasMode({
        tenantId: ctx.clientId,
        mode: 'live',
        reason: null,
        model: modelName,
        workflow: 'atlas-llm',
      });
    }
  } catch (err) {
    // Degraded model service (timeout / 429 / 5xx) must not surface as a
    // raw 500 on the Atlas chat surface. Fall back to the deterministic
    // tool-grounded read and disclose that the model was unavailable, so
    // the caller still gets a substrate-grounded answer.
    fallbackReason = normalizeFallbackReason(err);
    console.error('[atlas.llm] model call failed — serving deterministic fallback:', err);
    logAtlasMode({
      tenantId: ctx.clientId,
      mode: 'fallback',
      reason: fallbackReason,
      model: 'claude-opus-4-7',
      workflow: 'atlas-llm',
    });
    response = `Model unavailable — deterministic read. ${buildFallback(toolResults)}`;
    modelName = null;
  }

  return {
      response: sanitizeAutonomousDecisionLanguage(response),
    toolsUsed,
    suggestions: [
      { label: 'Peer context', value: 'How do we compare to peers?', kind: 'message' },
      { label: 'Industry moves', value: 'What are others doing in this industry?', kind: 'message' },
      topSignal ? { label: 'Open top signal', value: `signal:${topSignal.id}`, kind: 'signal' } : { label: 'Programs', value: 'Show active programs', kind: 'message' },
    ],
    toolResults,
    modelName,
    atlasMode: modelName ? 'live' : 'fallback',
    fallbackReason: modelName ? null : fallbackReason ?? 'deterministic_fallback',
    promptVersion: ATLAS_PROMPT_VERSION,
  };
}

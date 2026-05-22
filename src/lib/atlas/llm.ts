import { getAnthropicClient } from '@/lib/agent/stream';
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
import type { AtlasSuggestion, AtlasTenancyCtx, AtlasToolResultMap } from '@/lib/atlas/types';

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
        toolResults.retrievalContext.clientChunks.length > 0)
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

  const apiKeyPresent = !!process.env.ANTHROPIC_API_KEY;
  if (!apiKeyPresent) {
    return {
      response: buildFallback(toolResults),
      toolsUsed,
      suggestions: [
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
        { label: 'Programs', value: 'Show active programs', kind: 'message' },
      ],
      toolResults,
      modelName: null,
      promptVersion: ATLAS_PROMPT_VERSION,
    };
  }

  const client = getAnthropicClient();
  const system = buildAtlasSystemPrompt(towerState.client.clientName);
  const towerContext = formatTowerCurrentStateForPrompt(towerState);
  const retrievedContext = formatRetrievedContext(retrievalContext);
  const valueGroundingContext = renderAtlasValueGrounding(valueGrounding);
  const payload = JSON.stringify(sanitizeForTenantPrompt(toolResults), null, 2);

  let response: string;
  let modelName: string | null = 'claude-opus-4-7';
  try {
    const result = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 500,
      system,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                `User question: ${message}`,
                '',
                'Answer from the current Tower state first. Then use retrieved corpus / industry context when present. For financial or value advice, keep projected, tracked, and verified value separate and ground recommendations in the canonical pattern confidence, KPIs, baseline requirements, and measurement method. If any baseline, measurement, or provenance field is missing, say so instead of quantifying an outcome. If the ask is strategic, explain the implications but route the actual choice to Sentinel or a Program charter.',
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
              ].join('\n'),
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
    response = responseParts.join('\n').trim() || buildFallback(toolResults);
  } catch (err) {
    // Degraded model service (timeout / 429 / 5xx) must not surface as a
    // raw 500 on the Atlas chat surface. Fall back to the deterministic
    // tool-grounded read and disclose that the model was unavailable, so
    // the caller still gets a substrate-grounded answer.
    console.error('[atlas.llm] model call failed — serving deterministic fallback:', err);
    response = `Model unavailable — deterministic read. ${buildFallback(toolResults)}`;
    modelName = null;
  }

  return {
    response,
    toolsUsed,
    suggestions: [
      { label: 'Peer context', value: 'How do we compare to peers?', kind: 'message' },
      { label: 'Industry moves', value: 'What are others doing in this industry?', kind: 'message' },
      topSignal ? { label: 'Open top signal', value: `signal:${topSignal.id}`, kind: 'signal' } : { label: 'Programs', value: 'Show active programs', kind: 'message' },
    ],
    toolResults,
    modelName,
    promptVersion: ATLAS_PROMPT_VERSION,
  };
}

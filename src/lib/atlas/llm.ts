import { getAnthropicClient } from '@/lib/agent/stream';
import { buildAtlasSystemPrompt, ATLAS_PROMPT_VERSION } from '@/lib/atlas/prompt';
import {
  query_cohort_benchmarks,
  query_portfolio_aggregates,
  query_programs,
  query_signal_evidence,
  query_signals,
  query_use_cases,
} from '@/lib/atlas/tool-belt';
import type { AtlasSuggestion, AtlasTenancyCtx, AtlasToolResultMap } from '@/lib/atlas/types';

function buildFallback(toolResults: AtlasToolResultMap): string {
  const portfolio = toolResults.portfolio;
  const topSignal = toolResults.signalDetail ?? toolResults.signals?.[0];
  const programCount = toolResults.programs?.length ?? 0;
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
): Promise<{
  response: string;
  toolsUsed: string[];
  suggestions: AtlasSuggestion[];
  toolResults: AtlasToolResultMap;
  modelName: string | null;
  promptVersion: string;
}> {
  const [portfolio, signals, programs, useCases, benchmark] = await Promise.all([
    query_portfolio_aggregates(ctx),
    query_signals(ctx, { limit: 4 }),
    query_programs(ctx),
    query_use_cases(ctx),
    query_cohort_benchmarks(ctx, 'adoption_penetration_pct_avg'),
  ]);

  const toolResults: AtlasToolResultMap = {
    portfolio,
    signals,
    programs,
    useCases,
    benchmark,
  };

  const toolsUsed = [
    'query_portfolio_aggregates',
    'query_signals',
    'query_programs',
    'query_use_cases',
    'query_cohort_benchmarks',
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
  const system = buildAtlasSystemPrompt(portfolio.clientName);
  const payload = JSON.stringify(toolResults, null, 2);

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
              'Use only the tool context below. If the ask is strategic, answer with scope discipline and route to Sentinel or a Program charter.',
              '',
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
  const response = responseParts.join('\n').trim();

  return {
    response: response || buildFallback(toolResults),
    toolsUsed,
    suggestions: [
      { label: 'Peer context', value: 'How do we compare to peers?', kind: 'message' },
      topSignal ? { label: 'Open top signal', value: `signal:${topSignal.id}`, kind: 'signal' } : { label: 'Programs', value: 'Show active programs', kind: 'message' },
    ],
    toolResults,
    modelName: 'claude-opus-4-7',
    promptVersion: ATLAS_PROMPT_VERSION,
  };
}

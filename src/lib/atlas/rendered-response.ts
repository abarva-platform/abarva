import type { ConfidenceSignal, FollowUpAction, HandoffAffordance, RenderedResponse } from '@/lib/agent/renderedResponse';
import type { AtlasSuggestion, AtlasTurnResult } from '@/lib/atlas/types';

interface AtlasRenderedArgs {
  clientName: string;
  message: string;
  result: AtlasTurnResult;
}

function inferConfidenceSignal(result: AtlasTurnResult): ConfidenceSignal {
  const evidenceCount = result.toolResults.signalDetail?.evidence.length ?? 0;
  const hasBenchmark = Boolean(result.toolResults.benchmark);
  const hasPortfolio = Boolean(result.toolResults.portfolio);

  if (evidenceCount >= 3 && hasBenchmark) return 'high';
  if (evidenceCount > 0 || hasBenchmark || hasPortfolio) return 'medium';
  return result.intent === 'strategy_refusal' ? 'low' : 'none';
}

function inferSparsity(result: AtlasTurnResult): boolean {
  if (result.intent === 'strategy_refusal') return true;
  const evidenceCount = result.toolResults.signalDetail?.evidence.length ?? 0;
  const hasBenchmark = Boolean(result.toolResults.benchmark);
  const observationCount = result.toolResults.observations?.length ?? 0;
  return evidenceCount === 0 && !hasBenchmark && observationCount === 0;
}

function mapSuggestionToFollowUp(suggestion: AtlasSuggestion): FollowUpAction | null {
  if (suggestion.kind === 'link' && suggestion.href) {
    return {
      id: `atlas-followup-${suggestion.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: suggestion.label,
      kind: 'navigate',
      target: suggestion.href,
    };
  }

  return null;
}

function defaultFollowUps(result: AtlasTurnResult): FollowUpAction[] {
  const fromSuggestions = result.suggestions
    .map(mapSuggestionToFollowUp)
    .filter((action): action is FollowUpAction => Boolean(action));

  if (fromSuggestions.length > 0) {
    return fromSuggestions.slice(0, 3);
  }

  const fallbacks: FollowUpAction[] = [
    {
      id: 'atlas-open-programs',
      label: 'Open programs',
      sub: 'inspect the program chain behind this pressure',
      kind: 'navigate',
      target: '/engagements',
    },
    {
      id: 'atlas-open-intelligence',
      label: 'Open intelligence',
      sub: 'pull pattern context before taking a board-safe stance',
      kind: 'navigate',
      target: '/preview/intelligence',
    },
  ];

  return fallbacks;
}

function inferHandoff(args: AtlasRenderedArgs): HandoffAffordance | null {
  const text = args.message.toLowerCase();

  if (/(patient safety|burnout|clinical workflow|evidence ledger|pattern|regulatory|hipaa|fda|bias)/i.test(text)) {
    return {
      to_agent: 'sentinel',
      reason: 'This question needs evidence and pattern context beyond Tower pressure state.',
      context_carried: `Last Atlas turn for ${args.clientName} plus the user question about clinical or evidence support.`,
      target_href: '/preview/intelligence',
    };
  }

  if (/(deliverable|decision memo|business case|charter|phase|counterfactual|npv|irr|funding|board)/i.test(text)) {
    return {
      to_agent: 'nexus',
      reason: 'This question needs program and deliverable context, not just Tower pressure state.',
      context_carried: `Last Atlas turn for ${args.clientName} plus the user question about program execution or decision artifacts.`,
      target_href: '/engagements',
    };
  }

  if (args.result.intent === 'strategy_refusal') {
    return {
      to_agent: 'sentinel',
      reason: 'Atlas can summarize portfolio pressure, but strategy trade-offs belong in pattern and evidence context.',
      context_carried: `Last Atlas turn for ${args.clientName} plus the strategy question that triggered the refusal.`,
      target_href: '/preview/intelligence',
    };
  }

  return null;
}

export function buildAtlasRenderedResponse(args: AtlasRenderedArgs): RenderedResponse {
  const followUps = defaultFollowUps(args.result);

  return {
    response_text: args.result.response.trim(),
    citations: [],
    confidence_signal: inferConfidenceSignal(args.result),
    sparsity_flag: inferSparsity(args.result),
    follow_up_actions: followUps,
    handoff_affordance: inferHandoff(args),
    quality_issues: inferSparsity(args.result) ? ['sparse_retrieval'] : [],
  };
}

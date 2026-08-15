import type { ConfidenceSignal, FollowUpAction, HandoffAffordance, RenderedResponse } from '@/lib/agent/renderedResponse';
import { shapeAgentResponseForSurface } from '@/lib/agent/response-shape';
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

function normalizeAtlasVisibleText(text: string): string {
  return text
    .replace(
      /\bsignal\s*:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      'the referenced portfolio signal',
    )
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      'the referenced portfolio signal',
    )
    .replace(/\bAtlas\b/g, 'aVa')
    .replace(/\bindustry standard\b/gi, 'market benchmark')
    .replace(/\bbest practice\b/gi, 'strong operating pattern')
    .replace(/\beveryone is doing\b/gi, 'market adoption is moving toward')
    .replace(/\btenant evidence\b/gi, 'client evidence')
    .replace(/\bdata rows\b/gi, 'records')
    .replace(/\brows\b/gi, 'records')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasConcreteNextAction(text: string): boolean {
  return /\b(next step|next move|recommend|open|review|validate|pause|approve|reshape|escalate|assign|decide|close|measure|baseline|owner|by the next|before the next)\b/i.test(text);
}

function inferNextAction(message: string, result: AtlasTurnResult): string {
  if (result.intent === 'strategy_refusal') {
    return 'The next step is to open Intelligence with this question and confirm what evidence is missing before making a board claim.';
  }

  if (/signal\s*:/i.test(message)) {
    return 'The next step is to review the business fact behind that portfolio signal and assign one owner to validate whether action is needed before the next governance meeting.';
  }

  if (/(copi?plot|copilot|adoption|usage|value)/i.test(message)) {
    return 'The next step is to review measured adoption, value evidence, and accountable owner status before deciding whether to scale, pause, or reshape the initiative.';
  }

  if (/(industry|benchmark|compare|trend)/i.test(message)) {
    return 'The next step is to compare the loaded tenant evidence with the relevant market pattern and mark any missing benchmark as a decision gap.';
  }

  return 'The next step is to pick one accountable owner, one evidence gap, and one decision date before the next governance review.';
}

function shouldUseFourSectionAtlasShape(message: string): boolean {
  return /(copi?plot|copilot|industry|benchmark|compare|trend)/i.test(message);
}

function hasFourSectionAtlasShape(text: string): boolean {
  return /^Your data\b/m.test(text)
    && /^Industry context\b/m.test(text)
    && /^The gap\b/m.test(text)
    && /^Next move\b/m.test(text);
}

function shapeAtlasVisibleResponse(args: AtlasRenderedArgs): string {
  const base = normalizeAtlasVisibleText(shapeAgentResponseForSurface('/tower', args.result.response));
  const withAction = hasConcreteNextAction(base)
    ? base
    : `${base}\n\n${inferNextAction(args.message, args.result)}`;

  if (!shouldUseFourSectionAtlasShape(args.message) || hasFourSectionAtlasShape(withAction)) {
    return normalizeAtlasVisibleText(withAction);
  }

  return normalizeAtlasVisibleText([
    'Your data',
    base,
    '',
    'Industry context',
    'Use the loaded industry context as a comparison point, not as a claim that the tenant has achieved the benchmark.',
    '',
    'The gap',
    'The decision is not complete until the owner, measured adoption, and value evidence are tied to the same initiative.',
    '',
    'Next move',
    inferNextAction(args.message, args.result),
  ].join('\n'));
}

function inferHandoff(args: AtlasRenderedArgs): HandoffAffordance | null {
  const text = args.message.toLowerCase();

  if (/(patient safety|burnout|clinical workflow|evidence ledger|pattern|regulatory|hipaa|fda|bias)/i.test(text)) {
    return {
      to_agent: 'sentinel',
      reason: 'This question needs evidence and pattern context beyond Tower pressure state.',
      context_carried: `Last aVa Tower turn for ${args.clientName} plus the user question about clinical or evidence support.`,
      target_href: '/preview/intelligence',
    };
  }

  if (/(deliverable|decision memo|business case|charter|phase|counterfactual|npv|irr|funding|board)/i.test(text)) {
    return {
      to_agent: 'nexus',
      reason: 'This question needs program and deliverable context, not just Tower pressure state.',
      context_carried: `Last aVa Tower turn for ${args.clientName} plus the user question about program execution or decision artifacts.`,
      target_href: '/engagements',
    };
  }

  if (args.result.intent === 'strategy_refusal') {
    return {
      to_agent: 'intelligence',
      reason: 'Tower can summarize portfolio pressure, but strategy trade-offs belong in Intelligence pattern and evidence context.',
      context_carried: `Last aVa Tower turn for ${args.clientName} plus the strategy question that triggered the refusal.`,
      target_href: '/preview/intelligence',
    };
  }

  return null;
}

export function buildAtlasRenderedResponse(args: AtlasRenderedArgs): RenderedResponse {
  const followUps = defaultFollowUps(args.result);

  return {
    response_text: shapeAtlasVisibleResponse(args),
    citations: [],
    confidence_signal: inferConfidenceSignal(args.result),
    sparsity_flag: inferSparsity(args.result),
    follow_up_actions: followUps,
    handoff_affordance: inferHandoff(args),
    quality_issues: inferSparsity(args.result) ? ['sparse_retrieval'] : [],
  };
}

// Source BAFO negotiation view model — uses Wave-14 bafo-negotiation-model.ts
// Deterministic — no model calls, no network calls.

import {
  buildBafoNegotiationSummary,
  BafoSummary,
  BafoNegotiationLever,
  BafoNegotiationOpportunity,
  BafoRecommendation,
  BafoNegotiationScenario,
  BafoLeverType,
} from './bafo-negotiation-model';

export interface SourceBafoNegotiationViewContext {
  eventId: string;
  eventName: string;
  vendorIds: string[];
  stage: string;
}

export interface SourceBafoNegotiationViewModel {
  summary: BafoSummary;
  topLevers: BafoNegotiationLever[];
  topOpportunities: BafoNegotiationOpportunity[];
  topRecommendations: BafoRecommendation[];
  activeScenario: BafoNegotiationScenario | null;
  highPriorityAskCount: number;
  leverTypesSummary: BafoLeverType[];
  caveat: string;
  missingInputs: string[];
}

export function buildBafoNegotiationViewModel(
  ctx: SourceBafoNegotiationViewContext,
): SourceBafoNegotiationViewModel {
  const summary = buildBafoNegotiationSummary({
    eventId: ctx.eventId,
    eventName: ctx.eventName,
    vendorIds: ctx.vendorIds,
    stage: ctx.stage,
  });

  const missingInputs: string[] = [];
  if (ctx.vendorIds.length === 0) missingInputs.push('No vendors selected');
  if (ctx.stage !== 'bafo') missingInputs.push('Not yet in BAFO stage');

  return {
    summary,
    topLevers: summary.levers.slice(0, 3),
    topOpportunities: summary.opportunities.slice(0, 3),
    topRecommendations: summary.recommendations.slice(0, 2),
    activeScenario: summary.scenarios[0] ?? null,
    highPriorityAskCount: summary.highPriorityAsks,
    leverTypesSummary: summary.levers.map((l) => l.leverType),
    caveat:
      'BAFO guidance is deterministic and for internal review only. Not legal or procurement advice. No live model assistance.',
    missingInputs,
  };
}

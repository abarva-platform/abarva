'use client';

import { SourceStageCanvasPanel } from '@/components/source/SourceStageCanvasPanel';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { StrategyCanvas } from './StrategyCanvas';
import { EvaluationCanvas } from './EvaluationCanvas';
import { PricingCanvas } from './PricingCanvas';
import { BAFOCanvas } from './BAFOCanvas';
import { ExecutiveDecisionCanvas } from './ExecutiveDecisionCanvas';

interface StageCanvasRouterProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

/**
 * Routes to the stage-specific canvas component.
 * Each canonical stage gets rich, stage-specific content in the right panel.
 * Unmapped stages fall back to the generic SourceStageCanvasPanel.
 */
export function StageCanvasRouter({ stageKey, event, nextGateEvaluations = [] }: StageCanvasRouterProps) {
  const props = { stageKey, event, nextGateEvaluations };

  switch (stageKey) {
    case 'strategy':
    case 'intake':
    case 'sourcing_strategy':
      return <StrategyCanvas {...props} />;

    case 'evaluation':
      return <EvaluationCanvas {...props} />;

    case 'pricing':
      return <PricingCanvas {...props} />;

    case 'bafo':
    case 'orals_bafo':
      return <BAFOCanvas {...props} />;

    case 'executive_decision':
      return <ExecutiveDecisionCanvas {...props} />;

    default:
      return (
        <SourceStageCanvasPanel
          stageKey={stageKey}
          event={event}
          nextGateEvaluations={nextGateEvaluations}
        />
      );
  }
}

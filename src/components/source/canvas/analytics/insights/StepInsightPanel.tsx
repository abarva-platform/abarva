'use client';

// The per-step INSIGHT switch. Given a `StepInsightView`, render the right
// value-proving chart by `kind`. This is what the "✦ Intelligence" tab mounts
// when the step carries a killer insight; when it doesn't (`stepInsight` absent),
// the tab falls back to the IntelPanel read (+ optional waterfall) upstream.

import { ValuePoolInsight } from './ValuePoolInsight';
import { ScopeCoverageInsight } from './ScopeCoverageInsight';
import { RfpClauseInsight } from './RfpClauseInsight';
import { ValueBridgeInsight } from './ValueBridgeInsight';
import { ShouldCostInsight } from './ShouldCostInsight';
import { TransitionRiskInsight } from './TransitionRiskInsight';
import { ExecDecisionInsight } from './ExecDecisionInsight';
import { ValueRealizationInsight } from './ValueRealizationInsight';
import { ResponseCoverageInsight } from './ResponseCoverageInsight';
import { BafoProgressInsight } from './BafoProgressInsight';
import { CommittedValueInsight } from './CommittedValueInsight';
import type { StepInsightView } from '../view-model';

interface StepInsightPanelProps {
  insight: StepInsightView;
}

export function StepInsightPanel({ insight }: StepInsightPanelProps) {
  switch (insight.kind) {
    case 'value_pool':
      return <ValuePoolInsight insight={insight} />;
    case 'scope_coverage':
      return <ScopeCoverageInsight insight={insight} />;
    case 'rfp_clause_coverage':
      return <RfpClauseInsight insight={insight} />;
    case 'value_bridge':
      return <ValueBridgeInsight insight={insight} />;
    case 'should_cost_normalization':
      return <ShouldCostInsight insight={insight} />;
    case 'transition_risk':
      return <TransitionRiskInsight insight={insight} />;
    case 'exec_decision':
      return <ExecDecisionInsight insight={insight} />;
    case 'value_realization':
      return <ValueRealizationInsight insight={insight} />;
    case 'response_coverage':
      return <ResponseCoverageInsight insight={insight} />;
    case 'bafo_progress':
      return <BafoProgressInsight insight={insight} />;
    case 'committed_value':
      return <CommittedValueInsight insight={insight} />;
    default:
      return null;
  }
}

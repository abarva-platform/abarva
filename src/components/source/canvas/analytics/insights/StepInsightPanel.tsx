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
    default:
      return null;
  }
}

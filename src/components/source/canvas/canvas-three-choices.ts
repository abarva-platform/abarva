// Per-stage three-choices catalog for the universal canvas chat lane.
//
// Rendered above the input as suggested next moves. The user can click one,
// edit it, or ignore it and type their own. Wave 1 ships static choices;
// Wave 2 will personalize from event state (gate progress, blockers).

import type { SourceStageKey } from '@/lib/source/types';

export const CANVAS_THREE_CHOICES: Record<SourceStageKey, string[]> = {
  strategy: [
    'Help me write the strategy memo from the event facts',
    'Show me the value-target levers for this archetype',
    'Recommend the rigor level based on deal size',
  ],
  scope: [
    'Hold scope until ticket history is parsed',
    'Lock outline-tier scope now and flag the gap',
    'Split scope by application criticality',
  ],
  rfp: [
    'Generate the RFP from the scope memo',
    'Build the response checklist for vendors',
    'Draft the vendor shortlist with rationale',
  ],
  responses: [
    'Run the completeness check across all responses',
    'Surface anomalies in the proposals',
    'Open the Q&A log',
  ],
  evaluation: [
    'Run sensitivity at proposed weight changes',
    'Show evidence backing the top-ranked vendor',
    'Lock weights and Steward sign-off',
  ],
  pricing: [
    'Show the pricing trap log',
    'Generate the BAFO question pack',
    'Re-baseline TCO at a 5-year horizon',
  ],
  bafo: [
    'Draft round 2 questions for the open P0 traps',
    'Summarize concessions accepted by each finalist',
    'Compare BAFO deltas across rounds',
  ],
  executive_decision: [
    'Walk me through the Atlas decision brief',
    'Show the runner-up case',
    'Surface the 3 open risks needing attention',
  ],
  selection: [
    'Draft the selection memo',
    'List outstanding contract items before signature',
    'Plan the transition kickoff',
  ],
  transition: [
    'Show milestone status against plan',
    'Surface checkpoint risks',
    'Confirm KT sign-offs are recorded',
  ],
  value: [
    'Update the value ledger for this quarter',
    'Show value lines under target',
    'Plan the next governance review',
  ],
  // Legacy aliases — unlikely to be used but keep coverage.
  intake: ['Help me write the strategy memo', 'Show value levers', 'Recommend rigor level'],
  sourcing_strategy: [
    'Help me write the strategy memo',
    'Show value levers',
    'Recommend rigor level',
  ],
  rfp_rfi_package: [
    'Generate the RFP',
    'Build the response checklist',
    'Draft the vendor shortlist',
  ],
  vendor_responses: ['Run completeness check', 'Surface anomalies', 'Open the Q&A log'],
  orals_bafo: [
    'Draft BAFO round 2 questions',
    'Summarize accepted concessions',
    'Compare BAFO deltas',
  ],
  contract_mobilization: ['Show milestone status', 'Surface checkpoint risks', 'Confirm KT sign-offs'],
  value_realization: [
    'Update the value ledger',
    'Show value lines under target',
    'Plan governance review',
  ],
};

export function threeChoicesForStage(stage: SourceStageKey): string[] {
  return CANVAS_THREE_CHOICES[stage] ?? [];
}

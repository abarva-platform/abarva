export type ReadinessQuestionKind =
  | 'cost_question'
  | 'value_question'
  | 'vendor_question'
  | 'portfolio_question'
  | 'trust_question'
  | 'source_question';

export const QUESTION_REQUIREMENTS: Record<ReadinessQuestionKind, string[]> = {
  cost_question: ['move_business_case', 'cost_model', 'vendor_rate_card'],
  value_question: ['baseline_kpi', 'value_forecast', 'realized_value_ledger'],
  vendor_question: ['vendor_scorecards', 'contract_terms', 'pricing_history'],
  portfolio_question: ['move_inventory', 'dependency_graph', 'resource_capacity'],
  trust_question: ['customer_kpis', 'complaint_baseline', 'regulatory_context'],
  source_question: ['source_event', 'supplier_responses', 'approval_chain'],
};

export function requirementsForQuestion(kind: ReadinessQuestionKind): string[] {
  return QUESTION_REQUIREMENTS[kind];
}

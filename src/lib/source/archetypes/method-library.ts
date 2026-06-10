// Sourcing analysis methods — a LIBRARY of composable method declarations.
//
// Archetypes compose methods by KEY; the implementations live in dedicated
// modules (TCO normalization, should-cost, scorecard weighting, etc.). A new
// archetype reuses these methods; a new method is added here once and wired to
// its implementation. Mirrors src/lib/programs/archetypes/method-library.ts.

export interface SourcingMethodSpec {
  key: string;
  label: string;
  description: string;
  /** Evidence family keys this method reads. */
  consumesFamilies: string[];
  /** Object key this method produces. */
  producesArtifact: string;
}

export const SOURCING_METHODS: Record<string, SourcingMethodSpec> = {
  should_cost: {
    key: 'should_cost',
    label: 'Should-cost model',
    description:
      'Bottom-up should-cost from role mix, rate cards, volumes, and location split — the independent baseline a buyer negotiates against.',
    consumesFamilies: ['run_cost_baseline', 'staffing_baseline', 'rate_card', 'ticket_volumes'],
    producesArtifact: 'should_cost_model',
  },
  tco_normalization: {
    key: 'tco_normalization',
    label: 'TCO normalization',
    description:
      'Normalizes vendor proposals to a common cost basis (horizon, FX, escalators, in/out-of-scope) so prices are comparable apples-to-apples.',
    consumesFamilies: ['run_cost_baseline', 'contract_baseline'],
    producesArtifact: 'tco_normalization_workbook',
  },
  sla_gap: {
    key: 'sla_gap',
    label: 'SLA gap analysis',
    description:
      'Compares current SLA performance against baseline/target and quantifies the service gap an outsourcing/renewal must close.',
    consumesFamilies: ['sla_baseline', 'incident_problem_change'],
    producesArtifact: 'sla_gap_analysis',
  },
  scorecard_weighting: {
    key: 'scorecard_weighting',
    label: 'Weighted evaluation scorecard',
    description:
      'Builds a governed vendor × criteria scorecard with event-type weights and disqualifiers; every score cited or marked missing.',
    consumesFamilies: [],
    producesArtifact: 'evaluation_scorecard',
  },
  market_benchmark: {
    key: 'market_benchmark',
    label: 'Market / comparable benchmark',
    description:
      'Compares proposed pricing/terms against governed comparable benchmarks; never asserts a benchmark without a cited source.',
    consumesFamilies: ['contract_baseline', 'spend_baseline'],
    producesArtifact: 'benchmark_memo',
  },
  transition_risk_model: {
    key: 'transition_risk_model',
    label: 'Transition risk & cost model',
    description:
      'Models transition cost, ramp, knowledge-transfer, and termination-assistance risk for an incumbent change.',
    consumesFamilies: ['transition_constraints', 'staffing_baseline', 'application_inventory'],
    producesArtifact: 'transition_risk_register',
  },
  retained_org_sizing: {
    key: 'retained_org_sizing',
    label: 'Retained organization sizing',
    description:
      'Sizes the retained organization (governance, architecture, vendor management) required to run an outsourced/managed service.',
    consumesFamilies: ['staffing_baseline', 'retained_org_model', 'service_tower_scope'],
    producesArtifact: 'retained_org_model',
  },
  consumption_forecast: {
    key: 'consumption_forecast',
    label: 'Consumption / utilization forecast',
    description:
      'Forecasts consumption (seats, compute, tokens, tickets) to right-size commitments and avoid over/under-provisioning.',
    consumesFamilies: ['utilization', 'use_case_portfolio'],
    producesArtifact: 'consumption_forecast',
  },
  switching_cost_model: {
    key: 'switching_cost_model',
    label: 'Switching-cost / leverage model',
    description:
      'Quantifies switching cost and renewal-timing leverage to set the walk-away (BATNA) for a renewal/renegotiation.',
    consumesFamilies: ['current_contract', 'switching_cost', 'renewal_timeline'],
    producesArtifact: 'leverage_model',
  },
  data_migration_complexity: {
    key: 'data_migration_complexity',
    label: 'Data migration / integration complexity',
    description:
      'Scores data-migration and integration complexity to size SI effort and de-risk an ERP/platform implementation.',
    consumesFamilies: ['integration_landscape', 'data_migration_scope', 'customization_inventory'],
    producesArtifact: 'complexity_assessment',
  },
};

export function getSourcingMethod(key: string): SourcingMethodSpec | undefined {
  return SOURCING_METHODS[key];
}

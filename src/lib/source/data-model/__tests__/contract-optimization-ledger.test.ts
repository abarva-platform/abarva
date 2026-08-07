import { buildContractOptimizationLedger } from '@/lib/source/data-model/contract-optimization-ledger';
import { buildContract360View } from '@/lib/source/data-model/contract-360-view';
import type {
  SourceContract360Row,
  SourceContractFinancialExposureRow,
  SourceContractOperationalPerformanceRow,
  TowerValueClaimRow,
} from '@/lib/source/data-model/types';
import type { ContractLeverageEntry } from '@/lib/source/data-model/vendor-contract-portfolio';

function contract(overrides: Partial<SourceContract360Row> = {}): SourceContract360Row {
  return {
    tenant_key: 'skyharbor_global',
    contract_id: 'CTR-091',
    vendor_ref: 'salesforce',
    vendor_name: 'Salesforce',
    vendor_category: 'SaaS',
    contract_name: 'Salesforce Cybersecurity Agreement 4',
    scope_summary: null,
    annual_value: 24_600_000,
    total_committed_value: 73_800_000,
    committed_annual_spend: 24_600_000,
    actual_annual_spend: 24_100_000,
    end_date: '2027-07-28',
    notice_period_days: 90,
    auto_renew: true,
    renewal_decision_state: null,
    renewal_owner_ref: 'role-vendor-management',
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: null,
    source_confidence: 0.9,
    resolved_annual_value: null,
    annual_value_conflict_flag: false,
    resolved_total_committed_value: null,
    total_committed_value_conflict_flag: false,
    scoped_application_count: 3,
    critical_application_count: 2,
    linked_budget_amount: null,
    linked_actual_amount: null,
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: null,
    operational_evidence_gap: null,
    initiative_dependency_count: null,
    ...overrides,
  };
}

function financialExposure(overrides: Partial<SourceContractFinancialExposureRow> = {}): SourceContractFinancialExposureRow {
  return {
    tenant_key: 'skyharbor_global',
    contract_id: 'CTR-091',
    vendor_ref: 'salesforce',
    vendor_name: 'Salesforce',
    contracted_annual_value: 24_600_000,
    total_committed_value: 73_800_000,
    committed_annual_spend: 24_600_000,
    actual_annual_spend: 24_100_000,
    linked_budget_amount: null,
    linked_forecast_amount: null,
    linked_actual_amount: null,
    linked_committed_amount: null,
    linked_budget_lines: null,
    ...overrides,
  };
}

function operationalPerformance(overrides: Partial<SourceContractOperationalPerformanceRow> = {}): SourceContractOperationalPerformanceRow {
  return {
    tenant_key: 'skyharbor_global',
    contract_id: 'CTR-091',
    vendor_ref: 'salesforce',
    vendor_name: 'Salesforce',
    sla_summary: 'Monthly SLA credit register loaded.',
    scoped_application_count: 3,
    critical_application_count: 2,
    cloud_sev1_sev2_incidents: 1,
    avg_cloud_change_failure_rate: null,
    service_credits_earned: 420_000,
    service_credits_claimed: 80_000,
    evidence_gap: false,
    ...overrides,
  };
}

function towerClaim(overrides: Partial<TowerValueClaimRow> = {}): TowerValueClaimRow {
  return {
    claim_id: 'claim-1',
    tenant_key: 'skyharbor_global',
    subject_ref: 'CTR-091',
    outcome_metric_ref: 'source.contract.realized_value',
    baseline_observation_id: null,
    target_observation_id: null,
    actual_observation_id: null,
    promised_value: null,
    calculated_value: 125_000,
    currency: 'USD',
    attribution_basis: 'finance attested',
    quality_guardrail_state: 'pass',
    risk_guardrail_state: 'pass',
    claim_state: 'accepted',
    claim_rule_version: 'v1',
    claim_input_hash: null,
    caveat: null,
    blocked_reason: null,
    next_gate: null,
    next_gate_owner_role: null,
    evaluated_at: '2027-06-30',
    stale_at: null,
    stale_reason: null,
    ...overrides,
  };
}

const leverage: ContractLeverageEntry = {
  contractId: 'CTR-091',
  vendorRef: 'salesforce',
  vendorName: 'Salesforce',
  annualValue: 24_600_000,
  weakSignals: {
    benchmarking: true,
    alternatives: true,
    skill_dependency: false,
    regional_dependency: false,
  },
  weakSignalCount: 2,
  isHighPriority: true,
};

describe('buildContractOptimizationLedger', () => {
  it('quantifies only SLA credits earned above claimed as recoverable leakage', () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [],
      financialExposure: [financialExposure()],
      operationalPerformance: [operationalPerformance()],
      initiativeDependencies: [],
      towerObservations: [],
      towerValueClaims: [],
    });

    const ledger = buildContractOptimizationLedger({ view, leverage });

    expect(ledger.quantifiedLeakageUsd).toBe(340_000);
    expect(ledger.lines.find((line) => line.id === 'recoverable:sla-credit-gap')).toMatchObject({
      amountUsd: 340_000,
      state: 'quantified',
    });
    expect(ledger.lines.find((line) => line.id === 'recoverable:invoice-rate-card')).toMatchObject({
      amountUsd: null,
      state: 'needs_evidence',
    });
  });

  it('does not turn annual-to-actual variance into avoided cost without classification evidence', () => {
    const ledger = buildContractOptimizationLedger({
      view: null,
      contract: contract({ annual_value: 24_600_000, actual_annual_spend: 24_100_000 }),
      leverage,
    });

    expect(ledger.lines.find((line) => line.id === 'avoided:renewal-uplift')).toMatchObject({
      amountUsd: null,
      state: 'workflow_required',
    });
  });

  it('recognizes only finance-cleared Tower claims as realized value', () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [],
      financialExposure: [],
      operationalPerformance: [],
      initiativeDependencies: [],
      towerObservations: [],
      towerValueClaims: [
        towerClaim({ claim_id: 'accepted', claim_state: 'accepted', calculated_value: 125_000 }),
        towerClaim({ claim_id: 'draft', claim_state: 'draft', calculated_value: 500_000 }),
      ],
    });

    const ledger = buildContractOptimizationLedger({ view, leverage });

    expect(ledger.realizedValueUsd).toBe(125_000);
    expect(ledger.lines.find((line) => line.id === 'realized:tower-finance-proof')).toMatchObject({
      amountUsd: 125_000,
      state: 'quantified',
    });
  });
});

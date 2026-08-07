export type ContractOptimizationLedgerType =
  | 'recoverable_leakage'
  | 'avoided_cost'
  | 'negotiated_improvement'
  | 'realized_value';

export type ContractOptimizationAmountState =
  | 'not_quantified'
  | 'quantified'
  | 'addressable_exposure'
  | 'workflow_required'
  | 'finance_validated'
  | 'not_established';

export type ContractOptimizationEvidenceClass =
  | 'system_evidenced'
  | 'document_evidenced'
  | 'human_validated'
  | 'inferred'
  | 'missing';

export type ContractOptimizationReviewState =
  | 'system_extracted'
  | 'document_extracted'
  | 'procurement_reviewed'
  | 'legal_reviewed'
  | 'finance_validated'
  | 'needs_review'
  | 'missing';

export type ContractOptimizationDecisionState =
  | 'candidate'
  | 'workflow_required'
  | 'approved'
  | 'executed'
  | 'finance_accepted'
  | 'missing';

export interface ContractOptimizationEvidenceItem {
  readonly ledger_item_id: string;
  readonly contract_id: string;
  readonly ledger_type: ContractOptimizationLedgerType;
  readonly amount: number | null;
  readonly amount_state: ContractOptimizationAmountState;
  readonly evidence_class: ContractOptimizationEvidenceClass;
  readonly evidence_refs: readonly string[];
  readonly source_systems: readonly string[];
  readonly source_record_ids: readonly string[];
  readonly document_refs: readonly string[];
  readonly page_spans: readonly string[];
  readonly calculation_rule: string | null;
  readonly confidence: number | null;
  readonly review_state: ContractOptimizationReviewState;
  readonly decision_state: ContractOptimizationDecisionState;
  readonly workflow_event_id: string | null;
  readonly tower_claim_id: string | null;
}

export interface ContractOptimizationEvidencePack {
  readonly tenant_key: string | null;
  readonly dataset_version: string;
  readonly contract_id: string;
  readonly ledger_items: readonly ContractOptimizationEvidenceItem[];
}

export function evidenceItemsById(
  pack: ContractOptimizationEvidencePack | null | undefined,
): ReadonlyMap<string, ContractOptimizationEvidenceItem> {
  const byId = new Map<string, ContractOptimizationEvidenceItem>();
  for (const item of pack?.ledger_items ?? []) byId.set(item.ledger_item_id, item);
  return byId;
}

export function buildContractOptimizationEvidencePack(input: {
  readonly tenantKey: string | null;
  readonly datasetVersion?: string;
  readonly contractId: string;
  readonly ledgerItems: readonly ContractOptimizationEvidenceItem[];
}): ContractOptimizationEvidencePack {
  return {
    tenant_key: input.tenantKey,
    dataset_version: input.datasetVersion ?? 'unknown',
    contract_id: input.contractId,
    ledger_items: input.ledgerItems.filter(
      (item) => item.contract_id === input.contractId,
    ),
  };
}

export function buildGoldenContractEvidenceCanary(input: {
  readonly tenantKey?: string | null;
  readonly datasetVersion?: string;
  readonly contractId: string;
  readonly workflowEventId?: string | null;
  readonly towerClaimId?: string | null;
}): ContractOptimizationEvidencePack {
  const tenantKey = input.tenantKey ?? null;
  const contractId = input.contractId;
  const workflowEventId = input.workflowEventId ?? null;
  const towerClaimId = input.towerClaimId ?? 'tower-claim-finance-accepted-value';

  return buildContractOptimizationEvidencePack({
    tenantKey,
    datasetVersion: input.datasetVersion ?? 'synthetic-canary-v4',
    contractId,
    ledgerItems: [
      {
        ledger_item_id: 'recoverable:sla-credit-gap',
        contract_id: contractId,
        ledger_type: 'recoverable_leakage',
        amount: 620_000,
        amount_state: 'quantified',
        evidence_class: 'system_evidenced',
        evidence_refs: [
          'servicenow.sla_performance_history',
          'clm.sla_exhibit',
          'service_credit_register.monthly_claim_log',
        ],
        source_systems: ['ServiceNow', 'CLM', 'Service credit register'],
        source_record_ids: ['SLA-CREDIT-FY27-001', 'SLA-CREDIT-FY27-012'],
        document_refs: ['SLA Exhibit 4.2'],
        page_spans: ['SLA Exhibit p37-p39'],
        calculation_rule:
          'Sum earned service credits less claimed credits for reviewed monthly SLA periods.',
        confidence: 0.91,
        review_state: 'procurement_reviewed',
        decision_state: 'candidate',
        workflow_event_id: workflowEventId,
        tower_claim_id: null,
      },
      {
        ledger_item_id: 'recoverable:invoice-rate-card',
        contract_id: contractId,
        ledger_type: 'recoverable_leakage',
        amount: 685_000,
        amount_state: 'quantified',
        evidence_class: 'system_evidenced',
        evidence_refs: [
          'erp_ap.invoice_lines',
          'fieldglass.rate_card',
          'clm.pricing_schedule',
        ],
        source_systems: ['ERP / AP', 'Fieldglass', 'CLM'],
        source_record_ids: [
          'AP-RATE-VAR-FY27',
          'AP-OFF-CONTRACT-FY27',
          'AP-DUPLICATE-FY27',
        ],
        document_refs: ['Pricing Schedule 2.1'],
        page_spans: ['Pricing Schedule p18-p24'],
        calculation_rule:
          'Rate-card variance plus off-contract invoice lines plus duplicate invoice exceptions.',
        confidence: 0.88,
        review_state: 'procurement_reviewed',
        decision_state: 'candidate',
        workflow_event_id: workflowEventId,
        tower_claim_id: null,
      },
      {
        ledger_item_id: 'avoided:renewal-uplift',
        contract_id: contractId,
        ledger_type: 'avoided_cost',
        amount: 1_580_000,
        amount_state: 'addressable_exposure',
        evidence_class: 'inferred',
        evidence_refs: [
          'saas_admin.usage_export',
          'apm.retirement_roadmap',
          'clm.renewal_quote',
          'cmdb.application_scope',
        ],
        source_systems: ['SaaS admin', 'APM / CMDB', 'CLM'],
        source_record_ids: ['USAGE-FY27-Q2', 'APP-RETIREMENT-WAVE-4', 'RENEWAL-QUOTE-001'],
        document_refs: ['Renewal quote', 'Scope schedule'],
        page_spans: ['Renewal quote p4-p7', 'Scope schedule p12-p16'],
        calculation_rule:
          'Unused license exposure plus retireable application scope plus avoidable quoted renewal uplift.',
        confidence: 0.73,
        review_state: 'needs_review',
        decision_state: 'workflow_required',
        workflow_event_id: workflowEventId,
        tower_claim_id: null,
      },
      {
        ledger_item_id: 'negotiated:commercial-levers',
        contract_id: contractId,
        ledger_type: 'negotiated_improvement',
        amount: 1_100_000,
        amount_state: 'quantified',
        evidence_class: 'document_evidenced',
        evidence_refs: [
          'sourcing.bafo_response',
          'clm.executed_amendment',
          'benchmark.rate_comparison',
        ],
        source_systems: ['Sourcing platform', 'CLM', 'Benchmark'],
        source_record_ids: ['BAFO-ROUND-2', 'AMENDMENT-EXECUTED-001'],
        document_refs: ['Executed amendment', 'Approved negotiation position'],
        page_spans: ['Amendment p3-p9', 'Negotiation position p2-p5'],
        calculation_rule:
          'Signed annual rate reduction only; index cap, credit cap, notice, and transition funding remain terms.',
        confidence: 0.86,
        review_state: 'legal_reviewed',
        decision_state: 'executed',
        workflow_event_id: workflowEventId,
        tower_claim_id: null,
      },
      {
        ledger_item_id: 'realized:tower-finance-proof',
        contract_id: contractId,
        ledger_type: 'realized_value',
        amount: 1_185_000,
        amount_state: 'finance_validated',
        evidence_class: 'human_validated',
        evidence_refs: [
          'clm.executed_amendment',
          'erp_ap.post_amendment_invoices',
          'tower.finance_value_confirmation',
        ],
        source_systems: ['CLM', 'ERP / AP', 'Tower'],
        source_record_ids: ['AMENDMENT-EXECUTED-001', 'INVOICE-RUNRATE-Q3', 'FIN-ATTEST-001'],
        document_refs: ['Finance value attestation'],
        page_spans: ['Finance attestation p1-p2'],
        calculation_rule:
          'Actual invoice run-rate reduction plus recovered credits accepted by Finance and Tower.',
        confidence: 0.94,
        review_state: 'finance_validated',
        decision_state: 'finance_accepted',
        workflow_event_id: workflowEventId,
        tower_claim_id: towerClaimId,
      },
    ],
  });
}

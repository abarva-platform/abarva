export type ContractOptimizationEvidenceRole =
  | "master_services_agreement"
  | "statement_of_work"
  | "pricing_schedule"
  | "sla_exhibit"
  | "invoice_history"
  | "service_performance"
  | "staffing_roster"
  | "change_order_log"
  | "renewal_notice"
  | "governance_minutes";

export interface ContractOptimizationEvidenceRef {
  evidenceId: string;
  role: ContractOptimizationEvidenceRole;
  title: string;
  sourceType: "synthetic_demo" | "client_uploaded" | "vendor_provided" | "system_export";
  artifactId?: string | null;
  reference: string;
  syntheticDemoLabel?: string;
}

export interface ContractOptimizationTerm {
  termKey: string;
  label: string;
  value: string;
  evidenceId: string;
  riskLevel: "low" | "medium" | "high";
}

export interface ContractOptimizationSla {
  serviceLevel: string;
  target: string;
  actual: string;
  creditMechanism: string;
  creditCap: string;
  chronicMissLanguage: string;
  evidenceId: string;
}

export interface ContractOptimizationInvoiceLine {
  month: string;
  category: string;
  contractedAmountUsd: number;
  invoicedAmountUsd: number;
  varianceReason: string;
  evidenceId: string;
}

export interface ContractOptimizationOperationalBaseline {
  metric: string;
  baseline: number;
  current: number;
  unit: string;
  evidenceId: string;
  implication: string;
}

export interface ContractOptimizationStaffingCommitment {
  tower: string;
  committedFte: number;
  observedFte: number;
  locationMix: string;
  coverage: string;
  evidenceId: string;
}

export interface ContractOptimizationInput {
  tenantKey: string;
  sourceEventId: string;
  contractName: string;
  incumbentVendorName: string;
  syntheticDemo: boolean;
  currentAnnualRunRateUsd: number;
  termStart: string;
  termEnd: string;
  renewalNoticeDate: string;
  evidenceRefs: ContractOptimizationEvidenceRef[];
  terms: ContractOptimizationTerm[];
  slas: ContractOptimizationSla[];
  invoiceLines: ContractOptimizationInvoiceLine[];
  operationalBaselines: ContractOptimizationOperationalBaseline[];
  staffingCommitments: ContractOptimizationStaffingCommitment[];
}

export type ContractOptimizationFindingCategory =
  | "price_leakage"
  | "sla_credit_leakage"
  | "staffing_coverage_gap"
  | "scope_change_order_exposure"
  | "renewal_window"
  | "service_performance_risk"
  | "automation_value_gap"
  | "governance_gap";

export interface ContractOptimizationFinding {
  findingId: string;
  category: ContractOptimizationFindingCategory;
  title: string;
  evidenceLabels: string[];
  severity: "high" | "medium" | "low";
  currentState: string;
  sourcingImplication: string;
  recommendedAction: string;
  estimatedAnnualImpactUsd: number | null;
  confidence: "high" | "medium" | "low";
}

export interface ContractOptimizationLever {
  leverId: string;
  leverType:
    | "recover_invoice_leakage"
    | "tighten_service_credit_economics"
    | "reprice_staffing_coverage"
    | "convert_change_orders_to_catalog"
    | "force_productivity_commitment"
    | "use_renewal_window";
  findingId: string;
  buyerAsk: string;
  negotiationLanguage: string;
  valueBasis: "evidenced" | "opportunity_to_test";
  annualImpactLowUsd: number | null;
  annualImpactHighUsd: number | null;
  ownerRole: string;
  priority: "P0" | "P1" | "P2";
}

export interface ContractOptimizationMveProfile {
  tenantKey: string;
  sourceEventId: string;
  contractName: string;
  incumbentVendorName: string;
  syntheticDemo: boolean;
  decisionUse: "optimize_existing_contract" | "renewal_negotiation" | "rebid_or_renegotiate";
  extractionBoundary: string;
  contractBaseline: {
    termStart: string;
    termEnd: string;
    renewalNoticeDate: string;
    currentAnnualRunRateUsd: number;
    termCount: number;
    evidenceCount: number;
  };
  minimumViableExtractionAreas: Array<{
    area: string;
    status: "covered" | "partial" | "missing";
    evidenceLabels: string[];
    whyItMatters: string;
  }>;
  findings: ContractOptimizationFinding[];
  levers: ContractOptimizationLever[];
  clientToComplete: string[];
  readyForOptimization: "yes" | "conditional" | "no";
  readyReason: string;
}

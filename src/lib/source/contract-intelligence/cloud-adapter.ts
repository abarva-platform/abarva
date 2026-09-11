import type { CsvRecord, ContractDepthPackageInput } from "../contract-depth-package/projection";
import { buildContractIntelligenceRecords } from "./build";
import type { ContractIntelligenceRecord } from "./types";

export interface CloudContractIntelligencePackageInput {
  readonly contracts: readonly CsvRecord[];
  readonly applicationScope: readonly CsvRecord[];
  readonly contractClauses: readonly CsvRecord[];
  readonly evidenceManifest: readonly CsvRecord[];
  readonly monthlySpend: readonly CsvRecord[];
  readonly serviceUsage: readonly CsvRecord[];
  readonly commitmentCoverage: readonly CsvRecord[];
  readonly apReconciliation: readonly CsvRecord[];
  readonly resourceInventory: readonly CsvRecord[];
  readonly optimizationOpportunities: readonly CsvRecord[];
}

function text(row: CsvRecord, key: string): string {
  return row[key]?.trim() ?? "";
}

function mapCloudOpportunityToLever(row: CsvRecord): CsvRecord {
  return {
    tenant_key: text(row, "tenant_key"),
    dataset_version: text(row, "dataset_version"),
    contract_id: text(row, "contract_id"),
    lever_id: text(row, "opportunity_id"),
    lever_type: text(row, "opportunity_type"),
    current_term: text(row, "native_vs_nexus_note"),
    target_term: text(row, "buyer_ask"),
    buyer_ask: text(row, "buyer_ask"),
    negotiation_language: text(row, "negotiation_language"),
    vendor_give: text(row, "vendor_concession"),
    value_basis: text(row, "evidence_family"),
    annual_impact_low_usd: text(row, "amount_low_usd"),
    annual_impact_high_usd: text(row, "amount_high_usd"),
    timing_dependency: text(row, "timing_dependency"),
    owner_role: text(row, "owner_role"),
    priority: text(row, "priority"),
    risk_if_ignored: text(row, "risk_if_ignored"),
    amount_state: text(row, "amount_state"),
    stage: text(row, "stage"),
    evidence_grade: text(row, "evidence_grade"),
    blocking_gap: text(row, "blocking_gap"),
    source_row_id: text(row, "opportunity_id"),
    source_file_id: text(row, "source_file_id"),
  };
}

function mapApRowToInvoice(row: CsvRecord): CsvRecord {
  return {
    ...row,
    invoice_line_id: text(row, "source_row_id"),
    source_row_id: text(row, "source_row_id"),
  };
}

/**
 * Normalizes the cloud-consumption intake shape into the shared contract
 * intelligence builder. Cloud loaders retain their native adapters and Layer
 * 3 tables; this bridge only creates the common intelligence projection.
 */
export function buildCloudContractIntelligenceRecords(
  input: CloudContractIntelligencePackageInput,
): ContractIntelligenceRecord[] {
  const opportunityLevers = input.optimizationOpportunities.map(
    mapCloudOpportunityToLever,
  );
  const invoiceEvidence = input.apReconciliation.map(mapApRowToInvoice);

  const normalized: ContractDepthPackageInput = {
    contracts: input.contracts,
    applicationScope: input.applicationScope,
    changeOrders: [],
    contractPageText: [],
    resourceModel: [],
    pricingBridge: [],
    invoiceLineDetail: invoiceEvidence,
    batchJobVolumetrics: [],
    qbrScorecards: [],
    monthlySpend: input.monthlySpend,
    slaPerformance: [],
    ticketVolumetrics: [],
    contractClauses: input.contractClauses,
    evidenceManifest: input.evidenceManifest,
    optimizationOpportunities: input.optimizationOpportunities,
    negotiationFindings: [],
    negotiationLevers: opportunityLevers,
    usageObservations: input.serviceUsage,
    commitmentCoverage: input.commitmentCoverage,
    apReconciliation: input.apReconciliation,
    resourceInventory: input.resourceInventory,
  };

  return buildContractIntelligenceRecords(normalized);
}

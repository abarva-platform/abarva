export type CsvRecord = Record<string, string>;

export interface ContractDepthPackageInput {
  readonly contracts: readonly CsvRecord[];
  readonly applicationScope: readonly CsvRecord[];
  readonly monthlySpend: readonly CsvRecord[];
  readonly slaPerformance: readonly CsvRecord[];
  readonly ticketVolumetrics: readonly CsvRecord[];
  readonly contractClauses: readonly CsvRecord[];
  readonly evidenceManifest: readonly CsvRecord[];
  readonly optimizationOpportunities: readonly CsvRecord[];
}

export interface ContractDepthProjection {
  readonly contract360: readonly CsvRecord[];
  readonly contractVendor360: readonly CsvRecord[];
  readonly vendorContractPortfolio: readonly CsvRecord[];
  readonly contractApplicationScope: readonly CsvRecord[];
  readonly contractFinancialExposure: readonly CsvRecord[];
  readonly contractOperationalPerformance: readonly CsvRecord[];
  readonly contractPdfDocumentInventory: readonly CsvRecord[];
  readonly contractPdfClauseExtractions: readonly CsvRecord[];
  readonly optimizationOpportunities: readonly CsvRecord[];
  readonly qualityGate: {
    readonly status: 'PASS' | 'FAIL';
    readonly failures: readonly string[];
    readonly rowCounts: Record<string, number>;
  };
}

const REQUIRED_CONTRACT_FIELDS = [
  'tenant_key',
  'dataset_version',
  'contract_id',
  'vendor_ref',
  'vendor_name',
  'contract_name',
  'annual_value_usd',
  'actual_annual_spend_usd',
  'end_date',
  'notice_period_days',
  'auto_renew',
  'benchmarking_clause',
  'source_confidence',
] as const;

function value(row: CsvRecord, key: string): string {
  return row[key] ?? '';
}

function numberValue(row: CsvRecord, key: string): number {
  const parsed = Number(value(row, key).replace(/[$,%]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolText(row: CsvRecord, key: string): string {
  const raw = value(row, key).trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' ? 'true' : 'false';
}

function groupBy<T extends CsvRecord>(rows: readonly T[], key: string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const groupKey = value(row, key);
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), row]);
  }
  return grouped;
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function sum(rows: readonly CsvRecord[], key: string): number {
  return rows.reduce((total, row) => total + numberValue(row, key), 0);
}

function hasSyntheticPolicy(row: CsvRecord): boolean {
  return value(row, 'synthetic_policy') === 'synthetic_demo_only_not_client_truth';
}

export function projectContractDepthPackage(input: ContractDepthPackageInput): ContractDepthProjection {
  const failures: string[] = [];
  for (const row of input.contracts) {
    for (const field of REQUIRED_CONTRACT_FIELDS) {
      if (!value(row, field)) failures.push(`contract ${value(row, 'contract_id') || '<missing>'} missing ${field}`);
    }
  }

  const contractsById = groupBy(input.contracts, 'contract_id');
  const scopeByContract = groupBy(input.applicationScope, 'contract_id');
  const spendByContract = groupBy(input.monthlySpend, 'contract_id');
  const slaByContract = groupBy(input.slaPerformance, 'contract_id');
  const ticketsByContract = groupBy(input.ticketVolumetrics, 'contract_id');
  const docsByContract = groupBy(input.evidenceManifest, 'contract_id');

  for (const doc of input.evidenceManifest) {
    if (!hasSyntheticPolicy(doc)) {
      failures.push(`document ${value(doc, 'source_file_id') || '<missing>'} missing synthetic demo policy`);
    }
  }

  const contract360 = input.contracts.map((contract) => {
    const contractId = value(contract, 'contract_id');
    const scope = scopeByContract.get(contractId) ?? [];
    const spend = spendByContract.get(contractId) ?? [];
    const sla = slaByContract.get(contractId) ?? [];
    const tickets = ticketsByContract.get(contractId) ?? [];
    const docs = docsByContract.get(contractId) ?? [];
    const criticalApps = scope.filter((row) => value(row, 'criticality').toLowerCase() === 'tier 1').length;
    const sev1Sev2Tickets = tickets
      .filter((row) => ['p1', 'p2', 'sev1', 'sev2'].includes(value(row, 'severity').toLowerCase()))
      .reduce((total, row) => total + numberValue(row, 'ticket_count'), 0);
    const creditsEarned = sum(sla, 'credit_owed_usd');
    const creditsRecovered = sum(sla, 'credit_recovered_usd');
    return {
      tenant_key: value(contract, 'tenant_key'),
      contract_id: contractId,
      vendor_ref: value(contract, 'vendor_ref'),
      vendor_name: value(contract, 'vendor_name'),
      vendor_category: value(contract, 'category'),
      contract_name: value(contract, 'contract_name'),
      scope_summary: `${scope.length} in-scope applications/services; ${criticalApps} critical.`,
      annual_value: value(contract, 'annual_value_usd'),
      total_committed_value: value(contract, 'committed_annual_spend_usd'),
      committed_annual_spend: value(contract, 'committed_annual_spend_usd'),
      actual_annual_spend: spend.length ? String(sum(spend, 'actual_spend_usd')) : value(contract, 'actual_annual_spend_usd'),
      end_date: value(contract, 'end_date'),
      notice_period_days: value(contract, 'notice_period_days'),
      auto_renew: boolText(contract, 'auto_renew'),
      renewal_decision_state: 'candidate_review',
      renewal_owner_ref: value(contract, 'business_owner'),
      benchmarking_clause: value(contract, 'benchmarking_clause'),
      exit_rights_summary: value(contract, 'termination_rights'),
      alternatives_available: value(contract, 'archetype') === 'ehr_platform' ? 'limited' : 'available',
      concentration_note: '',
      source_confidence: value(contract, 'source_confidence'),
      resolved_annual_value: value(contract, 'annual_value_usd'),
      resolved_total_committed_value: value(contract, 'committed_annual_spend_usd'),
      annual_value_conflict_flag: 'false',
      total_committed_value_conflict_flag: 'false',
      scoped_application_count: String(scope.length),
      critical_application_count: String(criticalApps),
      linked_budget_amount: value(contract, 'committed_annual_spend_usd'),
      linked_actual_amount: spend.length ? String(sum(spend, 'actual_spend_usd')) : value(contract, 'actual_annual_spend_usd'),
      linked_budget_lines: String(spend.length),
      cloud_sev1_sev2_incidents: String(sev1Sev2Tickets),
      operational_evidence_gap: sla.length || tickets.length ? 'false' : 'true',
      initiative_dependency_count: '0',
      dataset_version: value(contract, 'dataset_version'),
      document_count: String(docs.length),
      service_credits_earned: String(creditsEarned),
      service_credits_claimed: String(creditsRecovered),
    };
  });

  const contractVendor360 = contract360.map((row) => {
    const copy = { ...row };
    delete copy.scoped_application_count;
    delete copy.critical_application_count;
    delete copy.linked_budget_amount;
    delete copy.linked_actual_amount;
    delete copy.linked_budget_lines;
    delete copy.cloud_sev1_sev2_incidents;
    delete copy.operational_evidence_gap;
    delete copy.initiative_dependency_count;
    return copy;
  });

  const vendorContractPortfolio = Array.from(groupBy(contract360, 'vendor_ref').entries()).map(([vendorRef, rows]) => ({
    tenant_key: value(rows[0], 'tenant_key'),
    vendor_ref: vendorRef,
    vendor_name: value(rows[0], 'vendor_name'),
    vendor_category: unique(rows.map((row) => value(row, 'vendor_category'))).join('; '),
    contract_count: String(rows.length),
    annual_value: String(sum(rows, 'annual_value')),
    total_committed_value: String(sum(rows, 'total_committed_value')),
    auto_renew_contracts: String(rows.filter((row) => value(row, 'auto_renew') === 'true').length),
    next_end_date: unique(rows.map((row) => value(row, 'end_date'))).sort()[0] ?? '',
    contract_refs: `{${unique(rows.map((row) => value(row, 'contract_id'))).join(',')}}`,
  }));

  const contractFinancialExposure = input.contracts.map((contract) => {
    const contractId = value(contract, 'contract_id');
    const spend = spendByContract.get(contractId) ?? [];
    return {
      tenant_key: value(contract, 'tenant_key'),
      contract_id: contractId,
      vendor_ref: value(contract, 'vendor_ref'),
      vendor_name: value(contract, 'vendor_name'),
      contracted_annual_value: value(contract, 'annual_value_usd'),
      total_committed_value: value(contract, 'committed_annual_spend_usd'),
      committed_annual_spend: value(contract, 'committed_annual_spend_usd'),
      actual_annual_spend: spend.length ? String(sum(spend, 'actual_spend_usd')) : value(contract, 'actual_annual_spend_usd'),
      linked_budget_amount: value(contract, 'committed_annual_spend_usd'),
      linked_forecast_amount: value(contract, 'annual_value_usd'),
      linked_actual_amount: spend.length ? String(sum(spend, 'actual_spend_usd')) : value(contract, 'actual_annual_spend_usd'),
      linked_committed_amount: spend.length ? String(sum(spend, 'committed_base_amount_usd')) : value(contract, 'committed_annual_spend_usd'),
      linked_budget_lines: String(spend.length),
    };
  });

  const contractOperationalPerformance = input.contracts.map((contract) => {
    const contractId = value(contract, 'contract_id');
    const sla = slaByContract.get(contractId) ?? [];
    const scope = scopeByContract.get(contractId) ?? [];
    const tickets = ticketsByContract.get(contractId) ?? [];
    const creditsEarned = sum(sla, 'credit_owed_usd');
    const creditsRecovered = sum(sla, 'credit_recovered_usd');
    const breached = sla.filter((row) => value(row, 'breach_state') === 'breached').length;
    return {
      tenant_key: value(contract, 'tenant_key'),
      contract_id: contractId,
      vendor_ref: value(contract, 'vendor_ref'),
      vendor_name: value(contract, 'vendor_name'),
      sla_summary: sla.length
        ? `${breached} breached SLA periods; ${creditsEarned.toFixed(2)} credits earned; ${creditsRecovered.toFixed(2)} recovered.`
        : 'No SLA rows loaded.',
      scoped_application_count: String(scope.length),
      critical_application_count: String(scope.filter((row) => value(row, 'criticality').toLowerCase() === 'tier 1').length),
      cloud_sev1_sev2_incidents: String(tickets.filter((row) => ['p1', 'p2', 'sev1', 'sev2'].includes(value(row, 'severity').toLowerCase())).reduce((total, row) => total + numberValue(row, 'ticket_count'), 0)),
      avg_cloud_change_failure_rate: '',
      service_credits_earned: String(creditsEarned),
      service_credits_claimed: String(creditsRecovered),
      evidence_gap: sla.length || tickets.length ? 'false' : 'true',
    };
  });

  const contractPdfDocumentInventory = input.evidenceManifest.map((doc) => ({
    tenant_key: value(doc, 'tenant_key'),
    dataset_version: value(doc, 'dataset_version'),
    source_file_id: value(doc, 'source_file_id'),
    source_file_name: value(doc, 'file_name'),
    source_file_sha256: '',
    document_type: value(doc, 'document_type'),
    contract_id: value(doc, 'contract_id'),
    vendor_name: value(doc, 'vendor_name'),
    mapping_status: 'mapped_to_register_contract',
    storage_target: 'synthetic_contract_documents',
    page_count: '1',
    parser_version: 'synthetic-contract-depth-v1',
    loaded_policy: value(doc, 'synthetic_policy'),
  }));

  const contractPdfClauseExtractions = input.contractClauses.map((clause) => ({
    ...clause,
    source_file_name: `${value(clause, 'source_file_id')}.docx`,
    source_file_sha256: '',
    source_excerpt: value(clause, 'value_text'),
    extractor_version: 'synthetic-contract-depth-v1',
    extracted_at: '2026-08-28T00:00:00.000Z',
  }));

  for (const opportunity of input.optimizationOpportunities) {
    if (value(opportunity, 'finance_confirmation_state') !== 'not_confirmed') {
      failures.push(`opportunity ${value(opportunity, 'opportunity_id') || '<missing>'} must remain not_confirmed`);
    }
    if (!value(opportunity, 'evidence_rows')) {
      failures.push(`opportunity ${value(opportunity, 'opportunity_id') || '<missing>'} missing evidence rows`);
    }
    if (!contractsById.has(value(opportunity, 'contract_id'))) {
      failures.push(`opportunity ${value(opportunity, 'opportunity_id') || '<missing>'} points to unknown contract`);
    }
  }

  const projection = {
    contract360,
    contractVendor360,
    vendorContractPortfolio,
    contractApplicationScope: input.applicationScope,
    contractFinancialExposure,
    contractOperationalPerformance,
    contractPdfDocumentInventory,
    contractPdfClauseExtractions,
    optimizationOpportunities: input.optimizationOpportunities,
  } as const;

  return {
    ...projection,
    qualityGate: {
      status: failures.length ? 'FAIL' : 'PASS',
      failures,
      rowCounts: {
        contract360: projection.contract360.length,
        contractVendor360: projection.contractVendor360.length,
        vendorContractPortfolio: projection.vendorContractPortfolio.length,
        contractApplicationScope: projection.contractApplicationScope.length,
        contractFinancialExposure: projection.contractFinancialExposure.length,
        contractOperationalPerformance: projection.contractOperationalPerformance.length,
        contractPdfDocumentInventory: projection.contractPdfDocumentInventory.length,
        contractPdfClauseExtractions: projection.contractPdfClauseExtractions.length,
        optimizationOpportunities: projection.optimizationOpportunities.length,
      },
    },
  };
}

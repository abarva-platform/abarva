export type CsvRecord = Record<string, string>;

export interface ContractDepthPackageInput {
  readonly contracts: readonly CsvRecord[];
  readonly applicationScope: readonly CsvRecord[];
  readonly changeOrders: readonly CsvRecord[];
  readonly contractPageText: readonly CsvRecord[];
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
  readonly contractPdfPageText: readonly CsvRecord[];
  readonly contractChangeOrders: readonly CsvRecord[];
  readonly contractEvidenceCoverage: readonly CsvRecord[];
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

function isTrue(row: CsvRecord, key: string): boolean {
  return ['true', '1', 'yes', 'y'].includes(value(row, key).trim().toLowerCase());
}

function omitKeys(row: CsvRecord, keys: readonly string[]): CsvRecord {
  const omit = new Set(keys);
  return Object.fromEntries(Object.entries(row).filter(([key]) => !omit.has(key)));
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
  const changeOrdersByContract = groupBy(input.changeOrders, 'contract_id');
  const pageTextByFile = groupBy(input.contractPageText, 'source_file_id');
  const pageTextByContract = groupBy(input.contractPageText, 'contract_id');

  for (const doc of input.evidenceManifest) {
    if (!hasSyntheticPolicy(doc)) {
      failures.push(`document ${value(doc, 'source_file_id') || '<missing>'} missing synthetic demo policy`);
    }
    if ((pageTextByFile.get(value(doc, 'source_file_id')) ?? []).length === 0) {
      failures.push(`document ${value(doc, 'source_file_id') || '<missing>'} missing page text`);
    }
  }
  for (const row of input.changeOrders) {
    if (!hasSyntheticPolicy(row)) {
      failures.push(`change order ${value(row, 'source_row_id') || '<missing>'} missing synthetic demo policy`);
    }
    if (!contractsById.has(value(row, 'contract_id'))) {
      failures.push(`change order ${value(row, 'source_row_id') || '<missing>'} points to unknown contract`);
    }
  }
  for (const row of input.contractPageText) {
    if (!hasSyntheticPolicy(row)) {
      failures.push(`page text ${value(row, 'source_file_id') || '<missing>'} missing synthetic demo policy`);
    }
    if (!value(row, 'page_text')) {
      failures.push(`page text ${value(row, 'source_file_id') || '<missing>'} missing page_text`);
    }
  }

  const contract360 = input.contracts.map((contract) => {
    const contractId = value(contract, 'contract_id');
    const scope = scopeByContract.get(contractId) ?? [];
    const spend = spendByContract.get(contractId) ?? [];
    const sla = slaByContract.get(contractId) ?? [];
    const tickets = ticketsByContract.get(contractId) ?? [];
    const docs = docsByContract.get(contractId) ?? [];
    const changeOrders = changeOrdersByContract.get(contractId) ?? [];
    const pageRows = pageTextByContract.get(contractId) ?? [];
    const criticalApps = scope.filter((row) => value(row, 'criticality').toLowerCase() === 'tier 1').length;
    const sev1Sev2Tickets = tickets
      .filter((row) => ['p1', 'p2', 'sev1', 'sev2'].includes(value(row, 'severity').toLowerCase()))
      .reduce((total, row) => total + numberValue(row, 'ticket_count'), 0);
    const creditsEarned = sum(sla, 'credit_owed_usd');
    const creditsRecovered = sum(sla, 'credit_recovered_usd');
    const recurringChangeOrderSpend = sum(changeOrders.filter((row) => isTrue(row, 'recurring')), 'annualized_spend_usd');
    const oneTimeChangeOrderSpend = sum(changeOrders, 'one_time_spend_usd');
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
      alternatives_available: '',
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
      document_page_text_count: String(pageRows.length),
      change_order_count: String(changeOrders.length),
      recurring_change_order_count: String(changeOrders.filter((row) => isTrue(row, 'recurring')).length),
      recurring_change_order_exposure_usd: String(recurringChangeOrderSpend),
      one_time_change_order_exposure_usd: String(oneTimeChangeOrderSpend),
      service_credits_earned: String(creditsEarned),
      service_credits_claimed: String(creditsRecovered),
    };
  });

  const contractVendor360 = contract360.map((row) =>
    omitKeys(row, [
      'scoped_application_count',
      'critical_application_count',
      'linked_budget_amount',
      'linked_actual_amount',
      'linked_budget_lines',
      'cloud_sev1_sev2_incidents',
      'operational_evidence_gap',
      'initiative_dependency_count',
    ]),
  );

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
      change_order_count: String((changeOrdersByContract.get(contractId) ?? []).length),
      recurring_change_order_exposure_usd: String(sum((changeOrdersByContract.get(contractId) ?? []).filter((row) => isTrue(row, 'recurring')), 'annualized_spend_usd')),
      evidence_gap: sla.length || tickets.length ? 'false' : 'true',
    };
  });

  const contractPdfDocumentInventory = input.evidenceManifest.map((doc) => ({
    _tenant_key: value(doc, 'tenant_key'),
    _dataset_id: value(doc, 'dataset_version'),
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
    page_count: String((pageTextByFile.get(value(doc, 'source_file_id')) ?? []).length || 1),
    parser_version: 'synthetic-contract-depth-v1',
    loaded_policy: value(doc, 'synthetic_policy'),
  }));

  const contractPdfClauseExtractions = input.contractClauses.map((clause) => ({
    _tenant_key: value(clause, 'tenant_key'),
    _dataset_id: value(clause, 'dataset_version'),
    ...clause,
    source_file_name: `${value(clause, 'source_file_id')}.docx`,
    source_file_sha256: '',
    source_excerpt: value(clause, 'value_text'),
    extractor_version: 'synthetic-contract-depth-v1',
    extracted_at: '2026-08-28T00:00:00.000Z',
  }));

  const contractPdfPageText = input.contractPageText.map((page) => ({
    _tenant_key: value(page, 'tenant_key'),
    _dataset_id: value(page, 'dataset_version'),
    tenant_key: value(page, 'tenant_key'),
    dataset_version: value(page, 'dataset_version'),
    page_id: `${value(page, 'source_file_id')}:p${value(page, 'source_page')}`,
    source_file_id: value(page, 'source_file_id'),
    contract_id: value(page, 'contract_id'),
    vendor_ref: value(page, 'vendor_ref'),
    vendor_name: value(page, 'vendor_name'),
    source_page: value(page, 'source_page'),
    page_text: value(page, 'page_text'),
    page_text_sha256: value(page, 'page_text_sha256'),
    mapping_status: value(page, 'mapping_status'),
    parser_version: value(page, 'parser_version'),
    loaded_policy: value(page, 'synthetic_policy'),
  }));

  const contractChangeOrders = input.changeOrders.map((row) => ({
    ...row,
    annualized_spend_usd: String(numberValue(row, 'annualized_spend_usd')),
    one_time_spend_usd: String(numberValue(row, 'one_time_spend_usd')),
    evidence_class: 'change_order_ledger',
    review_state: 'system_extracted_synthetic_demo',
  }));

  const contractEvidenceCoverage = input.contracts.map((contract) => {
    const contractId = value(contract, 'contract_id');
    const docs = docsByContract.get(contractId) ?? [];
    const pages = pageTextByContract.get(contractId) ?? [];
    const clauses = input.contractClauses.filter((row) => value(row, 'contract_id') === contractId);
    const changes = changeOrdersByContract.get(contractId) ?? [];
    const sla = slaByContract.get(contractId) ?? [];
    const spend = spendByContract.get(contractId) ?? [];
    return {
      tenant_key: value(contract, 'tenant_key'),
      dataset_version: value(contract, 'dataset_version'),
      contract_id: contractId,
      vendor_ref: value(contract, 'vendor_ref'),
      vendor_name: value(contract, 'vendor_name'),
      document_count: String(docs.length),
      page_text_rows: String(pages.length),
      clause_extractions: String(clauses.length),
      monthly_spend_rows: String(spend.length),
      sla_rows: String(sla.length),
      change_order_rows: String(changes.length),
      coverage_state:
        docs.length >= 5 && pages.length >= docs.length && spend.length >= 12 && clauses.length > 0
          ? 'contract_brain_ready'
          : 'partial',
      synthetic_policy: 'synthetic_demo_only_not_client_truth',
    };
  });

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
    contractPdfPageText,
    contractChangeOrders,
    contractEvidenceCoverage,
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
        contractPdfPageText: projection.contractPdfPageText.length,
        contractChangeOrders: projection.contractChangeOrders.length,
        contractEvidenceCoverage: projection.contractEvidenceCoverage.length,
        optimizationOpportunities: projection.optimizationOpportunities.length,
      },
    },
  };
}

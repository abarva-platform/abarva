import type { ContractDepthPackageInput, CsvRecord } from './projection';

export interface ContractDepthSourceFileInput extends ContractDepthPackageInput {
  readonly applications: readonly CsvRecord[];
  readonly saasUsage: readonly CsvRecord[];
}

export interface ContractDepthAdapterOutput {
  readonly contractRegisterAdapter: readonly CsvRecord[];
  readonly contractClauseAdapter: readonly CsvRecord[];
  readonly changeOrderAdapter: readonly CsvRecord[];
  readonly contractPageTextAdapter: readonly CsvRecord[];
  readonly cmdbApplicationAdapter: readonly CsvRecord[];
  readonly contractScopeAdapter: readonly CsvRecord[];
  readonly spendAdapter: readonly CsvRecord[];
  readonly usageAdapter: readonly CsvRecord[];
  readonly ticketVolumeAdapter: readonly CsvRecord[];
  readonly performanceAdapter: readonly CsvRecord[];
  readonly optimizationAdapter: readonly CsvRecord[];
  readonly evidenceDocumentAdapter: readonly CsvRecord[];
  readonly qualityGate: {
    readonly status: 'PASS' | 'FAIL';
    readonly tenantKey: string;
    readonly datasetVersion: string;
    readonly failures: readonly string[];
    readonly rowCounts: Record<string, number>;
    readonly richness: {
      readonly contractsWithTwelveSpendMonths: number;
      readonly contractsWithDocuments: number;
      readonly contractsWithScope: number;
      readonly contractsWithOpportunities: number;
      readonly contractsWithChangeOrders: number;
      readonly contractsWithPageText: number;
      readonly contractsWithRecurringChangeOrders: number;
      readonly managedServiceContractsWithSlaEvidence: number;
      readonly distinctVendors: number;
      readonly distinctCategories: number;
    };
  };
}

const EXPECTED_TENANT_KEY = 'meridian-health';
const EXPECTED_DATASET_VERSION = 'meridian-contract-depth-v1-20260828';
const SYNTHETIC_POLICY = 'synthetic_demo_only_not_client_truth';

function value(row: CsvRecord, key: string): string {
  return row[key] ?? '';
}

function groupBy(rows: readonly CsvRecord[], key: string): Map<string, CsvRecord[]> {
  const groups = new Map<string, CsvRecord[]>();
  for (const row of rows) {
    const groupKey = value(row, key);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), row]);
  }
  return groups;
}

function unique(rows: readonly CsvRecord[], key: string): Set<string> {
  return new Set(rows.map((row) => value(row, key)).filter(Boolean));
}

function withAdapterLineage(rows: readonly CsvRecord[], adapterName: string): CsvRecord[] {
  return rows.map((row, index) => ({
    ...row,
    adapter_name: adapterName,
    adapter_row_number: String(index + 1),
    adapter_version: 'source-contract-depth-v1',
  }));
}

function requireKnownContracts(
  failures: string[],
  rows: readonly CsvRecord[],
  contractIds: ReadonlySet<string>,
  label: string,
): void {
  for (const row of rows) {
    const contractId = value(row, 'contract_id');
    if (!contractIds.has(contractId)) {
      failures.push(`${label} row ${value(row, 'source_row_id') || value(row, 'source_file_id') || '<missing>'} points to unknown contract ${contractId || '<missing>'}`);
    }
  }
}

function requireTenantAndVersion(
  failures: string[],
  rows: readonly CsvRecord[],
  label: string,
  options: { requireDatasetVersion: boolean },
): void {
  for (const row of rows) {
    if (value(row, 'tenant_key') !== EXPECTED_TENANT_KEY) {
      failures.push(`${label} row ${value(row, 'source_row_id') || value(row, 'source_file_id') || '<missing>'} has wrong tenant_key`);
    }
    if (options.requireDatasetVersion && value(row, 'dataset_version') !== EXPECTED_DATASET_VERSION) {
      failures.push(`${label} row ${value(row, 'source_row_id') || value(row, 'source_file_id') || '<missing>'} has wrong dataset_version`);
    }
  }
}

export function adaptContractDepthPackage(
  input: ContractDepthSourceFileInput,
): ContractDepthAdapterOutput {
  const failures: string[] = [];
  const contractIds = unique(input.contracts, 'contract_id');
  const duplicateContractCount = input.contracts.length - contractIds.size;
  if (duplicateContractCount > 0) failures.push(`${duplicateContractCount} duplicate contract IDs in contract register`);

  const sourceRowIds = [
    ...input.applicationScope,
    ...input.monthlySpend,
    ...input.slaPerformance,
    ...input.ticketVolumetrics,
    ...input.saasUsage,
    ...input.changeOrders,
  ].map((row) => value(row, 'source_row_id')).filter(Boolean);
  const duplicateSourceRowCount = sourceRowIds.length - new Set(sourceRowIds).size;
  if (duplicateSourceRowCount > 0) failures.push(`${duplicateSourceRowCount} duplicate source_row_id values`);

  requireTenantAndVersion(failures, input.contracts, 'contracts', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.applicationScope, 'application scope', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.monthlySpend, 'monthly spend', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.slaPerformance, 'SLA performance', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.ticketVolumetrics, 'ticket volumetrics', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.contractClauses, 'contract clauses', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.changeOrders, 'change orders', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.contractPageText, 'contract page text', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.evidenceManifest, 'evidence manifest', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.optimizationOpportunities, 'optimization opportunities', { requireDatasetVersion: true });
  requireTenantAndVersion(failures, input.applications, 'applications', { requireDatasetVersion: false });
  requireTenantAndVersion(failures, input.saasUsage, 'SaaS usage', { requireDatasetVersion: true });

  requireKnownContracts(failures, input.applicationScope, contractIds, 'application scope');
  requireKnownContracts(failures, input.monthlySpend, contractIds, 'monthly spend');
  requireKnownContracts(failures, input.slaPerformance, contractIds, 'SLA performance');
  requireKnownContracts(failures, input.ticketVolumetrics, contractIds, 'ticket volumetrics');
  requireKnownContracts(failures, input.contractClauses, contractIds, 'contract clause');
  requireKnownContracts(failures, input.changeOrders, contractIds, 'change order');
  requireKnownContracts(failures, input.contractPageText, contractIds, 'contract page text');
  requireKnownContracts(failures, input.evidenceManifest, contractIds, 'evidence manifest');
  requireKnownContracts(failures, input.optimizationOpportunities, contractIds, 'optimization opportunity');
  requireKnownContracts(failures, input.saasUsage, contractIds, 'SaaS usage');

  const spendByContract = groupBy(input.monthlySpend, 'contract_id');
  const docsByContract = groupBy(input.evidenceManifest, 'contract_id');
  const scopeByContract = groupBy(input.applicationScope, 'contract_id');
  const opportunitiesByContract = groupBy(input.optimizationOpportunities, 'contract_id');
  const slaByContract = groupBy(input.slaPerformance, 'contract_id');
  const changeOrdersByContract = groupBy(input.changeOrders, 'contract_id');
  const pageTextByContract = groupBy(input.contractPageText, 'contract_id');
  const pageTextByFile = groupBy(input.contractPageText, 'source_file_id');
  const evidenceFileIds = unique(input.evidenceManifest, 'source_file_id');
  const managedServiceContracts = input.contracts.filter((row) =>
    value(row, 'category').toLowerCase().includes('managed services') ||
    value(row, 'contract_name').toLowerCase().includes('managed services') ||
    value(row, 'contract_name').toLowerCase().includes('service desk'),
  );

  for (const contract of input.contracts) {
    const contractId = value(contract, 'contract_id');
    const spendMonths = unique(spendByContract.get(contractId) ?? [], 'month').size;
    if (spendMonths !== 12) failures.push(`${contractId} must carry 12 monthly spend rows, found ${spendMonths}`);
    if ((docsByContract.get(contractId) ?? []).length < 5) failures.push(`${contractId} must carry at least 5 evidence documents`);
    if ((scopeByContract.get(contractId) ?? []).length === 0) failures.push(`${contractId} must carry application/scope rows`);
    if ((opportunitiesByContract.get(contractId) ?? []).length === 0) failures.push(`${contractId} must carry at least one optimization opportunity`);
    if ((pageTextByContract.get(contractId) ?? []).length === 0) failures.push(`${contractId} must carry contract page text rows`);
  }

  for (const contract of managedServiceContracts) {
    const contractId = value(contract, 'contract_id');
    const rows = slaByContract.get(contractId) ?? [];
    if (!rows.some((row) => value(row, 'breach_state') === 'breached' && value(row, 'credit_claimed') === 'false')) {
      failures.push(`${contractId} managed-services contract must carry breached unclaimed-credit SLA evidence`);
    }
  }

  for (const doc of input.evidenceManifest) {
    if (value(doc, 'synthetic_policy') !== SYNTHETIC_POLICY) {
      failures.push(`document ${value(doc, 'source_file_id') || '<missing>'} missing ${SYNTHETIC_POLICY}`);
    }
    if ((pageTextByFile.get(value(doc, 'source_file_id')) ?? []).length === 0) {
      failures.push(`document ${value(doc, 'source_file_id') || '<missing>'} missing page text`);
    }
  }
  for (const row of input.changeOrders) {
    if (value(row, 'synthetic_policy') !== SYNTHETIC_POLICY) {
      failures.push(`change order ${value(row, 'source_row_id') || '<missing>'} missing ${SYNTHETIC_POLICY}`);
    }
    if (!evidenceFileIds.has(value(row, 'source_file_id'))) {
      failures.push(`change order ${value(row, 'source_row_id') || '<missing>'} cites unknown source_file_id`);
    }
    if (!value(row, 'approval_owner')) failures.push(`change order ${value(row, 'source_row_id') || '<missing>'} missing approval_owner`);
    if (!value(row, 'linked_application_ref')) failures.push(`change order ${value(row, 'source_row_id') || '<missing>'} missing linked_application_ref`);
  }
  for (const row of input.contractPageText) {
    if (value(row, 'synthetic_policy') !== SYNTHETIC_POLICY) {
      failures.push(`page text ${value(row, 'source_file_id') || '<missing>'} missing ${SYNTHETIC_POLICY}`);
    }
    if (!evidenceFileIds.has(value(row, 'source_file_id'))) {
      failures.push(`page text ${value(row, 'source_file_id') || '<missing>'} is not in evidence manifest`);
    }
    if (!value(row, 'page_text')) failures.push(`page text ${value(row, 'source_file_id') || '<missing>'} missing page_text`);
  }
  const evidenceRowIds = new Set([
    ...sourceRowIds,
    ...input.contractClauses.map((row) => value(row, 'extraction_id')).filter(Boolean),
    ...input.evidenceManifest.map((row) => value(row, 'source_file_id')).filter(Boolean),
  ]);
  for (const opportunity of input.optimizationOpportunities) {
    if (value(opportunity, 'finance_confirmation_state') !== 'not_confirmed') {
      failures.push(`opportunity ${value(opportunity, 'opportunity_id') || '<missing>'} must remain not_confirmed`);
    }
    if (!value(opportunity, 'evidence_rows')) {
      failures.push(`opportunity ${value(opportunity, 'opportunity_id') || '<missing>'} missing evidence_rows`);
    }
    for (const evidenceRow of value(opportunity, 'evidence_rows').split(';').map((row) => row.trim()).filter(Boolean)) {
      if (!evidenceRowIds.has(evidenceRow)) {
        failures.push(`opportunity ${value(opportunity, 'opportunity_id') || '<missing>'} cites unknown evidence row ${evidenceRow}`);
      }
    }
  }

  const output = {
    contractRegisterAdapter: withAdapterLineage(input.contracts, 'contract_register_adapter'),
    contractClauseAdapter: withAdapterLineage(input.contractClauses, 'contract_clause_adapter'),
    changeOrderAdapter: withAdapterLineage(input.changeOrders, 'change_order_adapter'),
    contractPageTextAdapter: withAdapterLineage(input.contractPageText, 'contract_page_text_adapter'),
    cmdbApplicationAdapter: withAdapterLineage(input.applications, 'cmdb_application_adapter'),
    contractScopeAdapter: withAdapterLineage(input.applicationScope, 'contract_scope_adapter'),
    spendAdapter: withAdapterLineage(input.monthlySpend, 'contract_consumption_adapter'),
    usageAdapter: withAdapterLineage(input.saasUsage, 'usage_entitlement_adapter'),
    ticketVolumeAdapter: withAdapterLineage(input.ticketVolumetrics, 'ticket_volumetrics_adapter'),
    performanceAdapter: withAdapterLineage(input.slaPerformance, 'contract_performance_adapter'),
    optimizationAdapter: withAdapterLineage(input.optimizationOpportunities, 'optimization_opportunity_adapter'),
    evidenceDocumentAdapter: withAdapterLineage(input.evidenceManifest, 'evidence_document_adapter'),
  } as const;

  return {
    ...output,
    qualityGate: {
      status: failures.length ? 'FAIL' : 'PASS',
      tenantKey: EXPECTED_TENANT_KEY,
      datasetVersion: EXPECTED_DATASET_VERSION,
      failures,
      rowCounts: {
        contractRegisterAdapter: output.contractRegisterAdapter.length,
        contractClauseAdapter: output.contractClauseAdapter.length,
        changeOrderAdapter: output.changeOrderAdapter.length,
        contractPageTextAdapter: output.contractPageTextAdapter.length,
        cmdbApplicationAdapter: output.cmdbApplicationAdapter.length,
        contractScopeAdapter: output.contractScopeAdapter.length,
        spendAdapter: output.spendAdapter.length,
        usageAdapter: output.usageAdapter.length,
        ticketVolumeAdapter: output.ticketVolumeAdapter.length,
        performanceAdapter: output.performanceAdapter.length,
        optimizationAdapter: output.optimizationAdapter.length,
        evidenceDocumentAdapter: output.evidenceDocumentAdapter.length,
      },
      richness: {
        contractsWithTwelveSpendMonths: input.contracts.filter((contract) => unique(spendByContract.get(value(contract, 'contract_id')) ?? [], 'month').size === 12).length,
        contractsWithDocuments: input.contracts.filter((contract) => (docsByContract.get(value(contract, 'contract_id')) ?? []).length >= 5).length,
        contractsWithScope: input.contracts.filter((contract) => (scopeByContract.get(value(contract, 'contract_id')) ?? []).length > 0).length,
        contractsWithOpportunities: input.contracts.filter((contract) => (opportunitiesByContract.get(value(contract, 'contract_id')) ?? []).length > 0).length,
        contractsWithChangeOrders: input.contracts.filter((contract) => (changeOrdersByContract.get(value(contract, 'contract_id')) ?? []).length > 0).length,
        contractsWithPageText: input.contracts.filter((contract) => (pageTextByContract.get(value(contract, 'contract_id')) ?? []).length > 0).length,
        contractsWithRecurringChangeOrders: input.contracts.filter((contract) =>
          (changeOrdersByContract.get(value(contract, 'contract_id')) ?? []).some((row) => value(row, 'recurring') === 'true'),
        ).length,
        managedServiceContractsWithSlaEvidence: managedServiceContracts.filter((contract) =>
          (slaByContract.get(value(contract, 'contract_id')) ?? []).some((row) => value(row, 'breach_state') === 'breached' && value(row, 'credit_claimed') === 'false'),
        ).length,
        distinctVendors: unique(input.contracts, 'vendor_ref').size,
        distinctCategories: unique(input.contracts, 'category').size,
      },
    },
  };
}

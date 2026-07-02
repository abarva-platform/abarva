import fs from 'node:fs';
import path from 'node:path';

import type { DossierRecord } from '@/lib/semantic-dossiers';

const DATASET_ROOT_BY_CLIENT_KEY: Record<string, string> = {
  apexretail: 'apex-retail-synthetic-v4',
  apex: 'apex-retail-synthetic-v4',
  arcturus: 'first-capital-financial-synthetic-v4',
  firstcapital: 'first-capital-financial-synthetic-v4',
  'first-capital-financial': 'first-capital-financial-synthetic-v4',
  lakeshore: 'lakeshore-holdings-synthetic-v4',
  'lakeshore-holdings': 'lakeshore-holdings-synthetic-v4',
  meridian: 'meridian-health-synthetic-v4',
  'meridian-health': 'meridian-health-synthetic-v4',
  northstar: 'northstar-clinical-tech-synthetic-v1',
  skyharbor: 'skyharbor-air-synthetic-v4',
  'skyharbor-air': 'skyharbor-air-synthetic-v4',
};

const SOURCE_FILE_BY_KEY: Record<string, string> = {
  F01_enterprise_profile: 'family-1-enterprise-operating-model/F01_enterprise-profile.yaml',
  F02_business_org_functions: 'family-1-enterprise-operating-model/F02_business-org-functions.csv',
  F03_it_org_ownership: 'family-1-enterprise-operating-model/F03_it-org-ownership.csv',
  F04_capabilities_value_streams: 'family-1-enterprise-operating-model/F04_capabilities-value-streams.csv',
  F05_applications_systems: 'family-2-technology-estate/F05_applications-systems.csv',
  F06_system_function_mapping: 'family-2-technology-estate/F06_system-function-mapping.csv',
  F07_infrastructure_cloud: 'family-2-technology-estate/F07_infrastructure-cloud.csv',
  F08_platform_volumetrics: 'family-2-technology-estate/F08_platform-volumetrics.csv',
  F09_data_analytics_estate: 'family-3-data-connectivity/F09_data-analytics-estate.csv',
  F10_integrations_interfaces: 'family-3-data-connectivity/F10_integrations-interfaces.csv',
  F11_vendors_contracts_licenses: 'family-4-financial-commercial/F11_vendors-contracts-licenses.csv',
  F12_it_budget_financials: 'family-4-financial-commercial/F12_it-budget-financials.csv',
  F13_initiatives_portfolio: 'family-5-execution-operations/F13_initiatives-portfolio.csv',
  F14_operations_service_management: 'family-5-execution-operations/F14_operations-service-management.csv',
  F15_kpis_outcome_evidence: 'family-5-execution-operations/F15_kpis-outcome-evidence.csv',
  F16_security_risk_compliance: 'family-6-governance-ai-evidence/F16_security-risk-compliance.csv',
  F17_ai_automation_footprint: 'family-6-governance-ai-evidence/F17_ai-automation-footprint.csv',
  D19_personas_workforce: 'D19-personas-workforce/D19_personas-workforce.csv',
  O01_business_metrics: 'family-7-outcome-intelligence/O01_business-metrics.csv',
  O04_benefits_realization: 'family-7-outcome-intelligence/O04_benefits-realization.csv',
  O05_raid_log: 'family-7-outcome-intelligence/O05_raid-log.csv',
  O06_ai_governance: 'family-7-outcome-intelligence/O06_ai-governance.csv',
  F18_leadership_org_chart: 'family-8-semantic-enrichment/F18_leadership-org-chart.csv',
  F19_team_application_ownership: 'family-8-semantic-enrichment/F19_team-application-ownership.csv',
  F20_capability_system_dependency: 'family-8-semantic-enrichment/F20_capability-system-dependency.csv',
  F21_data_product_ownership_lineage: 'family-8-semantic-enrichment/F21_data-product-ownership-lineage.csv',
  F22_contract_system_service_map: 'family-8-semantic-enrichment/F22_contract-system-service-map.csv',
  F23_operational_service_map: 'family-8-semantic-enrichment/F23_operational-service-map.csv',
  F24_ai_use_case_system_value_map: 'family-8-semantic-enrichment/F24_ai-use-case-system-value-map.csv',
  F25_context_node_dictionary: 'family-8-semantic-enrichment/F25_context-node-dictionary.csv',
  F26_dimension_question_contracts: 'family-8-semantic-enrichment/F26_dimension-question-contracts.yaml',
  F27_source_context_narratives: 'family-8-semantic-enrichment/F27_source-context-narratives.yaml',
};

function datasetRootForTenant(tenantKey: string): string | null {
  return DATASET_ROOT_BY_CLIENT_KEY[tenantKey] ?? DATASET_ROOT_BY_CLIENT_KEY[tenantKey.replace(/_/g, '-') as keyof typeof DATASET_ROOT_BY_CLIENT_KEY] ?? null;
}

function parseCsv(text: string): DossierRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some(Boolean)) rows.push(row);
  }

  const headers = rows[0] ?? [];
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}

function yamlToRecord(sourceKey: string, text: string, relPath: string): DossierRecord[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#'));
  return [{
    source_key: sourceKey,
    source_file: relPath,
    summary: lines.slice(0, 16).join(' ').slice(0, 2000),
  }];
}

function readSourceFile(root: string, sourceKey: string): DossierRecord[] {
  const relPath = SOURCE_FILE_BY_KEY[sourceKey];
  if (!relPath) return [];
  const filePath = path.join(process.cwd(), 'datasets', root, relPath);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  if (relPath.endsWith('.csv')) return parseCsv(raw);
  if (relPath.endsWith('.jsonl')) {
    return raw.split(/\r?\n/).filter(Boolean).map((line) => {
      try {
        return JSON.parse(line) as DossierRecord;
      } catch {
        return { raw: line };
      }
    });
  }
  return yamlToRecord(sourceKey, raw, relPath);
}

export function loadHomeKnowDossierSources(tenantKey: string, sourceKeys: string[]): Record<string, DossierRecord[]> {
  const root = datasetRootForTenant(tenantKey);
  if (!root) return {};
  const sources: Record<string, DossierRecord[]> = {};
  for (const sourceKey of sourceKeys) {
    sources[sourceKey] = readSourceFile(root, sourceKey);
  }
  return sources;
}

export function sourceFilePathForKey(sourceKey: string): string | null {
  return SOURCE_FILE_BY_KEY[sourceKey] ?? null;
}

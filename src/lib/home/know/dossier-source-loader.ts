import fs from "node:fs";
import path from "node:path";

import type { DossierRecord } from "@/lib/semantic-dossiers";

const DATASET_ROOTS_BY_CLIENT_KEY: Record<string, string[]> = {
  apexretail: ["apex-retail-synthetic-v4"],
  apex: ["apex-retail-synthetic-v4"],
  arcturus: [
    "first-capital-financial-v3-v7-context-v1",
    "first-capital-financial-synthetic-v4",
  ],
  firstcapital: [
    "first-capital-financial-v3-v7-context-v1",
    "first-capital-financial-synthetic-v4",
  ],
  "first-capital": [
    "first-capital-financial-v3-v7-context-v1",
    "first-capital-financial-synthetic-v4",
  ],
  "first-capital-financial": [
    "first-capital-financial-v3-v7-context-v1",
    "first-capital-financial-synthetic-v4",
  ],
  lakeshore: [
    "lakeshore-industries-synthetic-v7-holdco",
    "lakeshore-holdings-synthetic-v4",
  ],
  "lakeshore-holdings": [
    "lakeshore-industries-synthetic-v7-holdco",
    "lakeshore-holdings-synthetic-v4",
  ],
  meridian: [
    "meridian-health-v6-v7-current-state-v1",
    "meridian-health-synthetic-v4",
  ],
  "meridian-health": [
    "meridian-health-v6-v7-current-state-v1",
    "meridian-health-synthetic-v4",
  ],
  northstar: ["northstar-clinical-tech-synthetic-v1"],
  skyharbor: ["skyharbor-air-v3-v7-context-v1", "skyharbor-air-synthetic-v4"],
  "skyharbor-air": [
    "skyharbor-air-v3-v7-context-v1",
    "skyharbor-air-synthetic-v4",
  ],
};

const TENANT_INPUT_ROOT_BY_CLIENT_KEY: Record<string, string> = {
  firstcapital: "first-capital",
  "first-capital": "first-capital",
  "first-capital-financial": "first-capital",
  lakeshore: "lakeshore-holdings",
  "lakeshore-holdings": "lakeshore-holdings",
  meridian: "meridian-health",
  "meridian-health": "meridian-health",
  skyharbor: "skyharbor-air",
  "skyharbor-air": "skyharbor-air",
};

const LEGACY_SOURCE_FILE_BY_KEY: Record<string, string> = {
  F01_enterprise_profile:
    "family-1-enterprise-operating-model/F01_enterprise-profile.yaml",
  F02_business_org_functions:
    "family-1-enterprise-operating-model/F02_business-org-functions.csv",
  F03_it_org_ownership:
    "family-1-enterprise-operating-model/F03_it-org-ownership.csv",
  F04_capabilities_value_streams:
    "family-1-enterprise-operating-model/F04_capabilities-value-streams.csv",
  F05_applications_systems:
    "family-2-technology-estate/F05_applications-systems.csv",
  F06_system_function_mapping:
    "family-2-technology-estate/F06_system-function-mapping.csv",
  F07_infrastructure_cloud:
    "family-2-technology-estate/F07_infrastructure-cloud.csv",
  F08_platform_volumetrics:
    "family-2-technology-estate/F08_platform-volumetrics.csv",
  F09_data_analytics_estate:
    "family-3-data-connectivity/F09_data-analytics-estate.csv",
  F10_integrations_interfaces:
    "family-3-data-connectivity/F10_integrations-interfaces.csv",
  F11_vendors_contracts_licenses:
    "family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
  F12_it_budget_financials:
    "family-4-financial-commercial/F12_it-budget-financials.csv",
  F13_initiatives_portfolio:
    "family-5-execution-operations/F13_initiatives-portfolio.csv",
  F14_operations_service_management:
    "family-5-execution-operations/F14_operations-service-management.csv",
  F15_kpis_outcome_evidence:
    "family-5-execution-operations/F15_kpis-outcome-evidence.csv",
  F16_security_risk_compliance:
    "family-6-governance-ai-evidence/F16_security-risk-compliance.csv",
  F17_ai_automation_footprint:
    "family-6-governance-ai-evidence/F17_ai-automation-footprint.csv",
  D19_personas_workforce: "D19-personas-workforce/D19_personas-workforce.csv",
  O01_business_metrics:
    "family-7-outcome-intelligence/O01_business-metrics.csv",
  O04_benefits_realization:
    "family-7-outcome-intelligence/O04_benefits-realization.csv",
  O05_raid_log: "family-7-outcome-intelligence/O05_raid-log.csv",
  O06_ai_governance: "family-7-outcome-intelligence/O06_ai-governance.csv",
  F18_leadership_org_chart:
    "family-8-semantic-enrichment/F18_leadership-org-chart.csv",
  F19_team_application_ownership:
    "family-8-semantic-enrichment/F19_team-application-ownership.csv",
  F20_capability_system_dependency:
    "family-8-semantic-enrichment/F20_capability-system-dependency.csv",
  F21_data_product_ownership_lineage:
    "family-8-semantic-enrichment/F21_data-product-ownership-lineage.csv",
  F22_contract_system_service_map:
    "family-8-semantic-enrichment/F22_contract-system-service-map.csv",
  F23_operational_service_map:
    "family-8-semantic-enrichment/F23_operational-service-map.csv",
  F24_ai_use_case_system_value_map:
    "family-8-semantic-enrichment/F24_ai-use-case-system-value-map.csv",
  F25_context_node_dictionary:
    "family-8-semantic-enrichment/F25_context-node-dictionary.csv",
  F26_dimension_question_contracts:
    "family-8-semantic-enrichment/F26_dimension-question-contracts.yaml",
  F27_source_context_narratives:
    "family-8-semantic-enrichment/F27_source-context-narratives.yaml",
};

const V7_SOURCE_FILE_BY_KEY: Record<string, string[]> = {
  F01_enterprise_profile: ["V7_01_enterprise_profile.csv"],
  F02_business_org_functions: ["V7_02_business_functions.csv"],
  F03_it_org_ownership: ["V7_03_org_ownership.csv"],
  F04_capabilities_value_streams: ["V7_02_business_functions.csv"],
  F05_applications_systems: ["V7_05_applications_systems.csv"],
  F06_system_function_mapping: ["V7_18_function_system_data_vendor_bridge.csv"],
  F07_infrastructure_cloud: ["V7_24_infrastructure_cloud_estate.csv"],
  F08_platform_volumetrics: ["V7_24_infrastructure_cloud_estate.csv"],
  F09_data_analytics_estate: ["V7_06_data_assets_integrations.csv"],
  F10_integrations_interfaces: ["V7_18_function_system_data_vendor_bridge.csv"],
  F11_vendors_contracts_licenses: ["V7_07_vendors_contracts.csv"],
  F12_it_budget_financials: ["V7_08_spend_value.csv"],
  F13_initiatives_portfolio: [
    "V7_09_programs_initiatives_business_priorities.csv",
  ],
  F14_operations_service_management: [
    "V7_22_operational_evidence_process_intelligence.csv",
  ],
  F15_kpis_outcome_evidence: ["V7_14_metric_definitions.csv"],
  F16_security_risk_compliance: ["V7_11_operations_risk_controls.csv"],
  F17_ai_automation_footprint: ["V7_10_ai_initiatives.csv"],
  D19_personas_workforce: ["V7_04_workforce_personas.csv"],
  O01_business_metrics: ["V7_14_metric_definitions.csv"],
  O04_benefits_realization: [
    "V7_10_ai_initiatives.csv",
    "V7_08_spend_value.csv",
  ],
  O05_raid_log: ["V7_11_operations_risk_controls.csv"],
  O06_ai_governance: ["V7_11_operations_risk_controls.csv"],
  F18_leadership_org_chart: ["V7_03_org_ownership.csv"],
  F19_team_application_ownership: [
    "V7_18_function_system_data_vendor_bridge.csv",
  ],
  F20_capability_system_dependency: [
    "V7_18_function_system_data_vendor_bridge.csv",
    "V7_12_relationships_graph_edges.csv",
  ],
  F21_data_product_ownership_lineage: [
    "V7_18_function_system_data_vendor_bridge.csv",
    "V7_12_relationships_graph_edges.csv",
  ],
  F22_contract_system_service_map: [
    "V7_18_function_system_data_vendor_bridge.csv",
    "V7_12_relationships_graph_edges.csv",
  ],
  F23_operational_service_map: [
    "V7_18_function_system_data_vendor_bridge.csv",
    "V7_12_relationships_graph_edges.csv",
  ],
  F24_ai_use_case_system_value_map: [
    "V7_18_function_system_data_vendor_bridge.csv",
    "V7_10_ai_initiatives.csv",
  ],
  F25_context_node_dictionary: [
    "V7_21_graph_registry_relationship_dictionary.csv",
  ],
  F26_dimension_question_contracts: [
    "V7_21_graph_registry_relationship_dictionary.csv",
  ],
  F27_source_context_narratives: ["V7_13_source_evidence_registry.csv"],
  F23_external_benchmark_market_corpus: [
    "V7_23_external_benchmark_market_corpus.csv",
  ],
};

function normalizeTenantKey(tenantKey: string): string {
  return tenantKey.trim().toLowerCase().replace(/_/g, "-");
}

function datasetRootsForTenant(tenantKey: string): string[] {
  const normalized = normalizeTenantKey(tenantKey);
  return DATASET_ROOTS_BY_CLIENT_KEY[normalized] ?? [];
}

function tenantInputRootForTenant(tenantKey: string): string | null {
  const normalized = normalizeTenantKey(tenantKey);
  return TENANT_INPUT_ROOT_BY_CLIENT_KEY[normalized] ?? normalized;
}

function parseCsv(text: string): DossierRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some(Boolean)) rows.push(row);
  }

  const headers = rows[0] ?? [];
  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
}

function yamlToRecord(
  sourceKey: string,
  text: string,
  relPath: string,
): DossierRecord[] {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  return [
    {
      source_key: sourceKey,
      source_file: relPath,
      summary: lines.slice(0, 16).join(" ").slice(0, 2000),
    },
  ];
}

function readRecordsFromPath(
  filePath: string,
  sourceKey: string,
  relPath: string,
): DossierRecord[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  if (relPath.endsWith(".csv")) return parseCsv(raw);
  if (relPath.endsWith(".jsonl")) {
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as DossierRecord;
        } catch {
          return { raw: line };
        }
      });
  }
  return yamlToRecord(sourceKey, raw, relPath);
}

function sourceFileCandidatesForKey(sourceKey: string): string[] {
  const candidates: string[] = [];
  for (const v7File of V7_SOURCE_FILE_BY_KEY[sourceKey] ?? []) {
    candidates.push(path.join("v7", v7File));
    candidates.push(v7File);
    candidates.push(path.join("client_templates", v7File));
  }
  const legacy = LEGACY_SOURCE_FILE_BY_KEY[sourceKey];
  if (legacy) candidates.push(legacy);
  return [...new Set(candidates)];
}

function readSourceFile(root: string, sourceKey: string): DossierRecord[] {
  for (const relPath of sourceFileCandidatesForKey(sourceKey)) {
    const filePath = path.join(process.cwd(), "datasets", root, relPath);
    const records = readRecordsFromPath(filePath, sourceKey, relPath);
    if (records.length > 0) return records;
  }
  return [];
}

function readTenantInputSourceFile(
  tenantKey: string,
  sourceKey: string,
): DossierRecord[] {
  if (sourceKey !== "executive_interviews") return [];
  const tenantInputRoot = tenantInputRootForTenant(tenantKey);
  if (!tenantInputRoot) return [];
  const candidates = [
    path.join("interviews", "executive_interviews.csv"),
    path.join("approved-content", "executive_interviews.csv"),
  ];
  for (const relPath of candidates) {
    const filePath = path.join(
      process.cwd(),
      "datasets",
      "tenant-inputs",
      tenantInputRoot,
      relPath,
    );
    const records = readRecordsFromPath(filePath, sourceKey, relPath);
    if (records.length > 0) return records;
  }
  return [];
}

export function loadHomeKnowDossierSources(
  tenantKey: string,
  sourceKeys: string[],
): Record<string, DossierRecord[]> {
  const roots = datasetRootsForTenant(tenantKey);
  const sources: Record<string, DossierRecord[]> = {};
  for (const sourceKey of sourceKeys) {
    const tenantInputRecords = readTenantInputSourceFile(tenantKey, sourceKey);
    if (tenantInputRecords.length > 0) {
      sources[sourceKey] = tenantInputRecords;
      continue;
    }
    let records: DossierRecord[] = [];
    for (const root of roots) {
      records = readSourceFile(root, sourceKey);
      if (records.length > 0) break;
    }
    sources[sourceKey] = records;
  }
  return sources;
}

export function sourceFilePathForKey(sourceKey: string): string | null {
  return sourceFileCandidatesForKey(sourceKey)[0] ?? null;
}

import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";

import { getHomeReviewBundle, type HomePreviewTenantKey } from "./golden-snapshot";
import type { HomeReviewBundle, TechnologyEstateBundle, TechObjectType, TechRecordType } from "./types";

const DENSE_ASSESSMENT_ID = "assessment-dense-source-room-20260823";

type JsonRecord = Record<string, unknown>;

export interface HomeProjectionRow {
  page_key: string;
  row_key: string;
  row_type: string;
  title: string;
  summary: string | null;
  display_payload_json: JsonRecord | null;
}

const COLUMN_ORDER: Record<TechObjectType, string[]> = {
  application_system: [
    "systemName",
    "businessFunction",
    "systemCategory",
    "criticality",
    "lifecycleState",
    "vendor",
    "interfacesCount",
    "annualCostUsd",
    "deploymentModel",
    "hostingLocation",
    "environmentCount",
    "userCountEstimate",
    "dataDomains",
    "dataClassification",
    "contractRef",
  ],
  vendor_contract: [
    "vendorName",
    "contractName",
    "serviceCategory",
    "annualSpendUsd",
    "renewalDate",
    "riskRating",
    "autoRenewFlag",
    "noticePeriodDays",
    "benchmarkClause",
    "minimumCommitmentUsd",
    "exitCostUsd",
    "supportedSystems",
    "supportedFunctions",
  ],
  infrastructure_platform: [
    "platformName",
    "platformType",
    "hostingModel",
    "dataCenterOrRegion",
    "technologyStack",
    "operationalOwner",
    "criticality",
    "lifecycleState",
    "utilizationPct",
    "capacityHeadroomPct",
    "drTier",
    "endOfLifeDate",
  ],
  data_asset_or_integration: [
    "dataAssetName",
    "dataDomain",
    "sourceSystem",
    "targetSystem",
    "integrationType",
    "platformOrDatabase",
    "refreshFrequency",
    "qualityStatus",
    "regulatedDataFlag",
    "landingLayer",
    "consumptionLayer",
    "cadence",
    "ownerFunction",
  ],
};

const LABELS: Record<TechObjectType, string> = {
  application_system: "Applications & Systems",
  vendor_contract: "Vendor Contracts",
  infrastructure_platform: "Infrastructure & Platforms",
  data_asset_or_integration: "Data Assets & Integrations",
};

const PRIMARY_DIMENSION: Record<TechObjectType, string> = {
  application_system: "businessFunction",
  vendor_contract: "serviceCategory",
  infrastructure_platform: "platformType",
  data_asset_or_integration: "dataDomain",
};

function text(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolish(value: unknown): boolean | string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return String(value);
}

function rowPayload(row: HomeProjectionRow): JsonRecord {
  return row.display_payload_json && typeof row.display_payload_json === "object"
    ? row.display_payload_json
    : {};
}

function applicationRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    systemName: text(payload.application_name) ?? row.title,
    businessFunction: text(payload.business_function),
    systemCategory: text(payload.application_category),
    criticality: text(payload.criticality_tier),
    lifecycleState: text(payload.lifecycle_state),
    vendor: text(payload.vendor_name),
    interfacesCount: numberValue(payload.interface_count),
    annualCostUsd: numberValue(payload.annual_cost_usd),
    deploymentModel: text(payload.deployment_model ?? payload.hosting_model),
    hostingLocation: text(payload.hosting_location),
    environmentCount: numberValue(payload.environment_count),
    userCountEstimate: numberValue(payload.user_count_estimate),
    dataDomains: text(payload.data_domains),
    dataClassification: text(payload.data_classification),
    contractRef: text(payload.contract_ids),
    originalRowId: text(payload.application_id ?? row.row_key),
  };
}

function contractRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    vendorName: text(payload.supplier_name) ?? row.title.split(" · ")[0] ?? row.title,
    contractName: text(payload.contract_name) ?? row.title,
    serviceCategory: text(payload.service_tower ?? payload.commercial_category),
    annualSpendUsd: numberValue(payload.annualized_value_usd),
    renewalDate: text(payload.renewal_notice_date ?? payload.end_date),
    riskRating: text(payload.risk_rating),
    autoRenewFlag: boolish(payload.auto_renew_flag),
    noticePeriodDays: numberValue(payload.notice_window_days),
    benchmarkClause: text(payload.benchmarking_right),
    minimumCommitmentUsd: numberValue(payload.minimum_commitment_usd),
    exitCostUsd: numberValue(payload.estimated_tfc_cost_usd),
    supportedSystems: text(payload.scoped_application_ids ?? payload.supported_systems),
    supportedFunctions: text(payload.supported_functions),
    originalRowId: text(payload.contract_id ?? row.row_key),
  };
}

function infrastructureRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    platformName: text(payload.platform_name) ?? row.title,
    platformType: text(payload.platform_type),
    hostingModel: text(payload.hosting_model),
    dataCenterOrRegion: text(payload.hosting_location ?? payload.data_center_or_region),
    technologyStack: text(payload.technology_stack),
    operationalOwner: text(payload.operational_owner),
    criticality: text(payload.criticality_tier),
    lifecycleState: text(payload.lifecycle_state),
    utilizationPct: numberValue(payload.utilization_percent),
    capacityHeadroomPct: numberValue(payload.capacity_headroom_percent),
    drTier: text(payload.dr_tier),
    endOfLifeDate: text(payload.end_of_life_date),
    originalRowId: text(payload.platform_id ?? row.row_key),
  };
}

function dataFlowRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    dataAssetName: text(payload.data_asset_name ?? payload.flow_name) ?? row.title,
    dataDomain: text(payload.data_domain ?? payload.function),
    sourceSystem: text(payload.source_system ?? payload.source_object_ref),
    targetSystem: text(payload.target_system ?? payload.target_object_ref),
    integrationType: text(payload.integration_type ?? payload.integration_pattern),
    platformOrDatabase: text(payload.platform_or_database ?? payload.landing_platform),
    refreshFrequency: text(payload.refresh_frequency ?? payload.cadence),
    qualityStatus: text(payload.quality_status ?? payload.quality_state),
    regulatedDataFlag: boolish(payload.regulated_data_flag),
    landingLayer: text(payload.landing_layer),
    consumptionLayer: text(payload.consumption_layer),
    cadence: text(payload.cadence),
    ownerFunction: text(payload.owner_function ?? payload.function),
    originalRowId: text(payload.flow_id ?? payload.source_row_id ?? row.row_key),
  };
}

function stripEmpty(row: JsonRecord): Record<string, string | number | boolean | null> {
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      cleaned[key] = value;
    } else {
      cleaned[key] = JSON.stringify(value);
    }
  }
  return cleaned;
}

function dimensionCounts(rows: Array<Record<string, string | number | boolean | null>>, field: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[field];
    const value = raw === null || raw === undefined || raw === "" ? "(not specified)" : String(raw);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

function recordType(objectType: TechObjectType, rows: Array<Record<string, string | number | boolean | null>>): TechRecordType | null {
  if (rows.length === 0) return null;
  const columns = COLUMN_ORDER[objectType].filter((column) =>
    rows.some((row) => row[column] !== null && row[column] !== undefined && row[column] !== ""),
  );
  const primaryDimension = columns.includes(PRIMARY_DIMENSION[objectType]) ? PRIMARY_DIMENSION[objectType] : null;
  return {
    objectType,
    label: LABELS[objectType],
    columns,
    rows,
    primaryDimension,
    dimensionCounts: primaryDimension ? dimensionCounts(rows, primaryDimension) : [],
  };
}

export function buildTechnologyEstateFromHomeProjectionRows(rows: HomeProjectionRow[]): TechnologyEstateBundle {
  const applications = rows
    .filter((row) => row.page_key === "applications_systems" && row.row_type === "application")
    .map((row) => stripEmpty(applicationRow(row)));
  const contracts = rows
    .filter((row) => row.page_key === "vendor_contracts" && row.row_type === "contract")
    .map((row) => stripEmpty(contractRow(row)));
  const infrastructure = rows
    .filter((row) => row.page_key === "infrastructure_platforms" && row.row_type === "infrastructure")
    .map((row) => stripEmpty(infrastructureRow(row)));
  const dataFlows = rows
    .filter((row) => row.page_key === "current_state_data_flow" && row.row_type === "data_flow")
    .map((row) => stripEmpty(dataFlowRow(row)));

  return {
    recordTypes: [
      recordType("application_system", applications),
      recordType("vendor_contract", contracts),
      recordType("infrastructure_platform", infrastructure),
      recordType("data_asset_or_integration", dataFlows),
    ].filter((row): row is TechRecordType => Boolean(row)),
  };
}

async function readHomeProjectionRows(tenantKey: string): Promise<HomeProjectionRow[]> {
  return azureRead.query<HomeProjectionRow>(
    `
      select
        page_key,
        row_key,
        row_type,
        title,
        summary,
        display_payload_json
      from ecl_projection.home_enterprise_landscape
      where tenant_key = $1
        and assessment_id = $2
      order by page_key, section_key, row_key
    `,
    [tenantKey, DENSE_ASSESSMENT_ID],
    { missingTable: "empty" },
  );
}

export async function getHomeEclProjectionBundle(tenantKey: HomePreviewTenantKey): Promise<HomeReviewBundle> {
  const base = getHomeReviewBundle(tenantKey);
  if (!base) {
    throw new Error(`Home ECL preview: missing base deterministic bundle for ${tenantKey}.`);
  }

  const rows = await readHomeProjectionRows(tenantKey);
  if (rows.length === 0) {
    throw new Error(`Home ECL preview: no ecl_projection.home_enterprise_landscape rows for ${tenantKey}/${DENSE_ASSESSMENT_ID}.`);
  }

  return {
    ...base,
    provenance: {
      ...base.provenance,
      canonical_snapshot_hash: `ecl:${DENSE_ASSESSMENT_ID}:home_enterprise_landscape:${rows.length}`,
    },
    technologyEstate: buildTechnologyEstateFromHomeProjectionRows(rows),
  };
}

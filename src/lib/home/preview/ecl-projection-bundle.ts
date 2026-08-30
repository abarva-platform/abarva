import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";

import { getHomeReviewBundle, type HomePreviewTenantKey } from "./golden-snapshot";
import type {
  ChapterId,
  ChapterView,
  ContextItem,
  EnterpriseSignalPacket,
  EnterpriseThesis,
  GroundedClaim,
  HomeReviewBundle,
  Signal,
  TechnologyEstateBundle,
  TechObjectType,
  TechRecordType,
  VisualOpportunity,
} from "./types";

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

function criticalityValue(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["p0", "critical", "missioncritical", "tier1", "tier01"].includes(normalized)) return "tier1";
  if (["high", "tier2", "tier02"].includes(normalized)) return normalized === "high" ? "high" : "tier2";
  if (["medium", "tier3", "tier03"].includes(normalized)) return normalized === "medium" ? "medium" : "tier3";
  return raw;
}

function endpointLabel(ref: unknown, labelsByRef: Map<string, string>): string | null {
  const raw = text(ref);
  if (!raw) return null;
  return labelsByRef.get(raw) ?? raw;
}

function endpointLabelsFromRows(rows: HomeProjectionRow[]): Map<string, string> {
  const labelsByRef = new Map<string, string>();
  for (const row of rows) {
    if (row.page_key === "applications_systems" && row.row_type === "application") {
      const mapped = applicationRow(row);
      const ref = text(mapped.originalRowId);
      const label = text(mapped.systemName);
      if (ref && label) labelsByRef.set(ref, label);
    }
    if (row.page_key === "infrastructure_platforms" && row.row_type === "infrastructure") {
      const mapped = infrastructureRow(row);
      const ref = text(mapped.originalRowId);
      const label = text(mapped.platformName);
      if (ref && label) labelsByRef.set(ref, label);
    }
  }
  return labelsByRef;
}

function rowPayload(row: HomeProjectionRow): JsonRecord {
  if (!row.display_payload_json || typeof row.display_payload_json !== "object") return {};
  const payload = row.display_payload_json;
  const nestedPayload = payload.display_payload_json;
  if (!nestedPayload || typeof nestedPayload !== "object" || Array.isArray(nestedPayload)) return payload;
  return { ...payload, ...(nestedPayload as JsonRecord) };
}

function applicationRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    systemName: text(payload.application_name) ?? row.title,
    businessFunction: text(payload.business_function),
    systemCategory: text(payload.application_category),
    criticality: criticalityValue(payload.criticality_tier),
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
    autoRenewFlag: boolish(payload.auto_renew ?? payload.auto_renew_flag),
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
    criticality: criticalityValue(payload.criticality_tier),
    lifecycleState: text(payload.lifecycle_state),
    utilizationPct: numberValue(payload.utilization_percent),
    capacityHeadroomPct: numberValue(payload.capacity_headroom_percent),
    drTier: text(payload.dr_tier),
    endOfLifeDate: text(payload.support_end_date ?? payload.end_of_life_date),
    originalRowId: text(payload.platform_id ?? row.row_key),
  };
}

function dataFlowRow(row: HomeProjectionRow, labelsByRef: Map<string, string> = new Map()): JsonRecord {
  const payload = rowPayload(row);
  const sourceRef = text(payload.source_object_ref ?? payload.source_system_ref_id ?? payload.source_system_id);
  const targetRef = text(payload.target_object_ref ?? payload.target_system_ref_id ?? payload.target_system_id);
  return {
    dataAssetName: text(payload.data_asset_name ?? payload.flow_name) ?? row.title,
    dataDomain: text(payload.data_domain ?? payload.data_domain_name ?? payload.target_function ?? payload.source_function ?? payload.owner_function ?? payload.function),
    sourceSystem: endpointLabel(sourceRef, labelsByRef) ?? text(payload.source_system_name ?? payload.source_system),
    targetSystem: endpointLabel(targetRef, labelsByRef) ?? text(payload.target_system_name ?? payload.target_system),
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
  const applicationRows = rows.filter((row) => row.page_key === "applications_systems" && row.row_type === "application");
  const infrastructureRows = rows.filter((row) => row.page_key === "infrastructure_platforms" && row.row_type === "infrastructure");
  const applications = rows
    .filter((row) => row.page_key === "applications_systems" && row.row_type === "application")
    .map((row) => stripEmpty(applicationRow(row)));
  const contracts = rows
    .filter((row) => row.page_key === "vendor_contracts" && row.row_type === "contract")
    .map((row) => stripEmpty(contractRow(row)));
  const infrastructure = infrastructureRows.map((row) => stripEmpty(infrastructureRow(row)));
  const labelsByRef = new Map<string, string>();
  for (const row of applicationRows) {
    const mapped = applicationRow(row);
    const ref = text(mapped.originalRowId);
    const label = text(mapped.systemName);
    if (ref && label) labelsByRef.set(ref, label);
  }
  for (const row of infrastructureRows) {
    const mapped = infrastructureRow(row);
    const ref = text(mapped.originalRowId);
    const label = text(mapped.platformName);
    if (ref && label) labelsByRef.set(ref, label);
  }
  const dataFlows = rows
    .filter((row) => row.page_key === "current_state_data_flow" && row.row_type === "data_flow")
    .map((row) => stripEmpty(dataFlowRow(row, labelsByRef)));

  return {
    recordTypes: [
      recordType("application_system", applications),
      recordType("vendor_contract", contracts),
      recordType("infrastructure_platform", infrastructure),
      recordType("data_asset_or_integration", dataFlows),
    ].filter((row): row is TechRecordType => Boolean(row)),
  };
}

const CHAPTER_DEFS: Array<{ id: ChapterId; title: string; guidingQuestion: string }> = [
  { id: "executive_brief", title: "Executive Brief", guidingQuestion: "What should I understand in my first ten minutes?" },
  { id: "our_business", title: "Our Business", guidingQuestion: "How does this enterprise work and create value?" },
  { id: "strategy_value_creation", title: "Strategy & Value Creation", guidingQuestion: "Where are we trying to go, and what bets are we making?" },
  { id: "how_we_operate", title: "How We Operate", guidingQuestion: "How is the enterprise organized and how does work get done?" },
  { id: "technology_data", title: "Technology & Data", guidingQuestion: "What enables the business, and where is complexity or dependency concentrated?" },
  { id: "performance_value", title: "Performance & Value", guidingQuestion: "Are we moving toward outcomes, and can we prove the value?" },
  { id: "leadership_perspective", title: "Leadership Perspective", guidingQuestion: "What do leaders agree on, disagree on, and worry about?" },
  { id: "what_needs_attention", title: "What Needs Attention", guidingQuestion: "What tensions, risks, dependencies and decisions deserve executive attention?" },
];

function rowsForType(estate: TechnologyEstateBundle, objectType: TechObjectType): Array<Record<string, string | number | boolean | null>> {
  return estate.recordTypes.find((recordType) => recordType.objectType === objectType)?.rows ?? [];
}

function sumNumeric(rows: Array<Record<string, string | number | boolean | null>>, field: string): number {
  return rows.reduce((sum, row) => sum + (typeof row[field] === "number" ? row[field] : Number(row[field]) || 0), 0);
}

function formatUsd(value: number | null): string | null {
  if (value === null || value <= 0) return null;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString()}`;
}

function topShareRows(
  rows: Array<Record<string, string | number | boolean | null>>,
  labelField: string,
  valueField: string,
  limit: number,
): Array<Record<string, unknown>> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = text(row[labelField]) ?? "(not specified)";
    totals.set(label, (totals.get(label) ?? 0) + (typeof row[valueField] === "number" ? row[valueField] : Number(row[valueField]) || 0));
  }
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals, ([label, value]) => ({ label, sharePct: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0 }))
    .sort((a, b) => Number(b.sharePct) - Number(a.sharePct))
    .slice(0, limit);
}

function dimensionShareRows(recordType: TechRecordType | undefined, limit: number): Array<Record<string, unknown>> {
  const total = recordType?.rows.length ?? 0;
  return (recordType?.dimensionCounts ?? [])
    .slice(0, limit)
    .map((row) => ({ label: row.value, sharePct: total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0 }));
}

function chapterSummaryRows(rows: HomeProjectionRow[]): Map<string, HomeProjectionRow> {
  return new Map(
    rows
      .filter((row) => row.row_type === "summary" && row.row_key.endsWith("_summary"))
      .map((row) => [row.page_key, row]),
  );
}

function visual(
  datasetRef: string,
  title: string,
  keyMessage: string,
  evidenceIds: string[],
): VisualOpportunity {
  return {
    visual_type: "horizontal_bar",
    title,
    purpose: "Render a deterministic ECL projection dataset without generating new values.",
    dataset_ref: datasetRef,
    key_message: keyMessage,
    evidence_ids: evidenceIds,
    priority: "high",
  };
}

function contextIdForRow(row: HomeProjectionRow): string {
  return `ctx_ecl_${row.page_key}_${row.row_type}_${row.row_key}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function rowDomains(row: HomeProjectionRow): string[] {
  switch (row.page_key) {
    case "applications_systems":
      return ["application_system"];
    case "vendor_contracts":
      return ["vendor_contract"];
    case "infrastructure_platforms":
      return ["infrastructure_platform"];
    case "current_state_data_flow":
      return ["data_asset_or_integration", "application_system"];
    default:
      return ["evidence_sources"];
  }
}

function rowContextStatement(row: HomeProjectionRow, labelsByRef: Map<string, string> = new Map()): string {
  switch (row.page_key) {
    case "applications_systems": {
      const app = applicationRow(row);
      const parts = [
        `${text(app.systemName) ?? row.title} is loaded as an application`,
        text(app.businessFunction) ? `for ${text(app.businessFunction)}` : null,
        text(app.vendor) ? `supplied by ${text(app.vendor)}` : null,
        text(app.criticality) ? `with ${text(app.criticality)} criticality` : null,
        formatUsd(numberValue(app.annualCostUsd)) ? `and ${formatUsd(numberValue(app.annualCostUsd))} annual cost` : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "vendor_contracts": {
      const contract = contractRow(row);
      const parts = [
        `${text(contract.contractName) ?? row.title} is loaded as a contract`,
        text(contract.vendorName) ? `with ${text(contract.vendorName)}` : null,
        text(contract.serviceCategory) ? `for ${text(contract.serviceCategory)}` : null,
        formatUsd(numberValue(contract.annualSpendUsd)) ? `with ${formatUsd(numberValue(contract.annualSpendUsd))} annualized value` : null,
        numberValue(contract.noticePeriodDays) !== null ? `and ${numberValue(contract.noticePeriodDays)} days notice` : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "infrastructure_platforms": {
      const platform = infrastructureRow(row);
      const parts = [
        `${text(platform.platformName) ?? row.title} is loaded as an infrastructure or platform record`,
        text(platform.platformType) ? `of type ${text(platform.platformType)}` : null,
        text(platform.hostingModel) ? `on ${text(platform.hostingModel)}` : null,
        text(platform.criticality) ? `with ${text(platform.criticality)} criticality` : null,
        numberValue(platform.capacityHeadroomPct) !== null ? `and ${numberValue(platform.capacityHeadroomPct)}% capacity headroom` : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "current_state_data_flow": {
      const flow = dataFlowRow(row, labelsByRef);
      const source = text(flow.sourceSystem) ?? "an unspecified source";
      const target = text(flow.targetSystem) ?? "an unspecified target";
      const parts = [
        `${text(flow.dataAssetName) ?? row.title} is loaded as a data movement from ${source} to ${target}`,
        text(flow.integrationType) ? `using ${text(flow.integrationType)}` : null,
        text(flow.landingLayer) ? `landing in ${text(flow.landingLayer)}` : null,
        text(flow.consumptionLayer) ? `and serving ${text(flow.consumptionLayer)}` : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    default:
      return row.summary ?? row.title;
  }
}

function projectionContextItems(rows: HomeProjectionRow[]): ContextItem[] {
  const labelsByRef = endpointLabelsFromRows(rows);
  return rows
    .filter((row) => row.row_type !== "summary" && row.row_type !== "chapter_claim")
    .map((row) => ({
      id: contextIdForRow(row),
      statement: rowContextStatement(row, labelsByRef),
      domains: rowDomains(row),
    }));
}

function buildEclSignalPacket(
  rows: HomeProjectionRow[],
  estate: TechnologyEstateBundle,
  assessmentId: string,
): EnterpriseSignalPacket {
  const applications = rowsForType(estate, "application_system");
  const contracts = rowsForType(estate, "vendor_contract");
  const infrastructure = rowsForType(estate, "infrastructure_platform");
  const dataFlows = rowsForType(estate, "data_asset_or_integration");
  const applicationRecordType = estate.recordTypes.find((recordType) => recordType.objectType === "application_system");
  const contractSpend = sumNumeric(contracts, "annualSpendUsd");
  const vendorRows = topShareRows(contracts, "vendorName", "annualSpendUsd", 8);
  const topVendor = vendorRows[0];
  const topFunctions = dimensionShareRows(applicationRecordType, 8);
  const topFunction = topFunctions[0];
  const applicationCost = sumNumeric(applications, "annualCostUsd");
  const tierOneApplications = applications.filter((row) => criticalityValue(row.criticality) === "tier1");
  const lifecycleWatch = applications.filter((row) =>
    /watch|aging|replace|legacy|retir/i.test(`${text(row.lifecycleState) ?? ""} ${text(row.replacementCandidate) ?? ""}`),
  );
  const autoRenewContracts = contracts.filter((row) => row.autoRenewFlag === true);
  const longNoticeContracts = contracts.filter((row) => numberValue(row.noticePeriodDays) !== null && numberValue(row.noticePeriodDays)! >= 180);
  const supportDatedPlatforms = infrastructure.filter((row) => Boolean(text(row.endOfLifeDate)));
  const criticalPlatforms = infrastructure.filter((row) => criticalityValue(row.criticality) === "tier1" || /critical/i.test(text(row.criticality) ?? ""));
  const topFlowTarget = dimensionCounts(dataFlows, "targetSystem")[0];
  const integrationPatterns = dimensionCounts(dataFlows, "integrationType");
  const topIntegrationPattern = integrationPatterns[0];
  const consumptionLayers = dimensionCounts(dataFlows, "consumptionLayer")
    .filter((item) => item.value !== "(not specified)")
    .slice(0, 4)
    .map((item) => `${item.value} (${item.count.toLocaleString()})`);

  const signals: Signal[] = [
    {
      id: "sig_ecl_estate_001",
      kind: "portfolio",
      statement: `The ECL projection contains ${applications.length.toLocaleString()} applications, ${contracts.length.toLocaleString()} contracts, ${infrastructure.length.toLocaleString()} infrastructure/platform records, and ${dataFlows.length.toLocaleString()} data-flow rows.`,
      domains: ["application_system", "vendor_contract", "infrastructure_platform", "data_asset_or_integration"],
      evidenceRefs: ["serving.home_executive_brief"],
    },
    ...(topFunction
      ? [
          {
            id: "sig_ecl_application_function_002",
            kind: "concentration" as const,
            statement: `${String(topFunction.label)} is the largest application function in the current estate at ${Number(topFunction.sharePct).toFixed(1)}% of applications.`,
            domains: ["application_system"],
            evidenceRefs: ["serving.home_applications_systems"],
          },
        ]
      : []),
    {
      id: "sig_ecl_application_criticality_003",
      kind: "risk",
      statement: `${tierOneApplications.length.toLocaleString()} of ${applications.length.toLocaleString()} applications are marked tier-one; ${lifecycleWatch.length.toLocaleString()} carry lifecycle or replacement-watch evidence.`,
      domains: ["application_system"],
      evidenceRefs: ["serving.home_applications_systems"],
    },
    {
      id: "sig_ecl_vendor_concentration_004",
      kind: "concentration",
      statement: topVendor
        ? `${String(topVendor.label)} is the largest visible supplier group at ${Number(topVendor.sharePct).toFixed(1)}% of the loaded contract value.`
        : "No supplier group carries annualized contract value in the loaded Home contract view.",
      domains: ["vendor_contract"],
      evidenceRefs: ["serving.home_vendor_contracts"],
    },
    {
      id: "sig_ecl_contract_value_005",
      kind: "portfolio",
      statement: `${contracts.length.toLocaleString()} contracts carry annualized-value evidence totaling ${formatUsd(contractSpend) ?? "$0"} across the visible contract base.`,
      domains: ["vendor_contract"],
      evidenceRefs: ["serving.home_vendor_contracts"],
    },
    {
      id: "sig_ecl_contract_flexibility_006",
      kind: "risk",
      statement: `${autoRenewContracts.length.toLocaleString()} of ${contracts.length.toLocaleString()} contracts are marked auto-renewal and ${longNoticeContracts.length.toLocaleString()} require at least 180 days notice.`,
      domains: ["vendor_contract"],
      evidenceRefs: ["serving.home_vendor_contracts"],
    },
    {
      id: "sig_ecl_platform_resilience_008",
      kind: "risk",
      statement: `${infrastructure.length.toLocaleString()} infrastructure or platform records are visible; ${supportDatedPlatforms.length.toLocaleString()} carry support-end dates and ${criticalPlatforms.length.toLocaleString()} carry tier-one or criticality evidence.`,
      domains: ["infrastructure_platform"],
      evidenceRefs: ["serving.home_infrastructure_platforms"],
    },
    ...(topFlowTarget
      ? [
          {
            id: "sig_ecl_data_flow_convergence_009",
            kind: "dependency" as const,
            statement: `${topFlowTarget.value} is the most frequent recorded data-movement destination at ${topFlowTarget.count.toLocaleString()} of ${dataFlows.length.toLocaleString()} visible movements (${((topFlowTarget.count / Math.max(1, dataFlows.length)) * 100).toFixed(1)}%).`,
            domains: ["data_asset_or_integration", "application_system"],
            evidenceRefs: ["serving.home_current_state_data_flow"],
          },
        ]
      : []),
    ...(topIntegrationPattern
      ? [
          {
            id: "sig_ecl_integration_pattern_010",
            kind: "complexity" as const,
            statement: `${topIntegrationPattern.value} is the most common recorded integration pattern at ${topIntegrationPattern.count.toLocaleString()} of ${dataFlows.length.toLocaleString()} movements.`,
            domains: ["data_asset_or_integration"],
            evidenceRefs: ["serving.home_current_state_data_flow"],
          },
        ]
      : []),
    ...(consumptionLayers.length
      ? [
          {
            id: "sig_ecl_data_consumption_011",
            kind: "portfolio" as const,
            statement: `The data-movement record names consumption layers including ${consumptionLayers.join(", ")}.`,
            domains: ["data_asset_or_integration"],
            evidenceRefs: ["serving.home_current_state_data_flow"],
          },
        ]
      : []),
    ...(topFunctions.length
      ? [
          {
            id: "sig_ecl_application_function_ranking_012",
            kind: "portfolio" as const,
            statement: `The largest application functions by recorded application count are ${topFunctions
              .map((item) => `${item.label} (${Number(item.sharePct).toFixed(1)}%)`)
              .join(", ")}.`,
            domains: ["application_system"],
            evidenceRefs: ["serving.home_applications_systems"],
          },
        ]
      : []),
    {
      id: "sig_ecl_application_cost_013",
      kind: "portfolio",
      statement: `${applications.length.toLocaleString()} applications carry annual-cost evidence totaling ${formatUsd(applicationCost) ?? "$0"}.`,
      domains: ["application_system"],
      evidenceRefs: ["serving.home_applications_systems"],
    },
    {
      id: "sig_ecl_data_flow_total_014",
      kind: "portfolio",
      statement: `The data-movement inventory contains ${dataFlows.length.toLocaleString()} recorded source-to-target movement rows; this is not transaction volume, data volume, business usage, or proof of analytics consumption.`,
      domains: ["data_asset_or_integration"],
      evidenceRefs: ["serving.home_current_state_data_flow"],
    },
    {
      id: "sig_ecl_application_named_examples_015",
      kind: "portfolio",
      statement: "Named high-cost application examples are available in the application register.",
      domains: ["application_system"],
      evidenceRefs: ["serving.home_applications_systems"],
    },
    {
      id: "sig_ecl_platform_named_resilience_016",
      kind: "risk",
      statement: "Named infrastructure or platform examples with resilience evidence are available in the infrastructure register.",
      domains: ["infrastructure_platform"],
      evidenceRefs: ["serving.home_infrastructure_platforms"],
    },
    {
      id: "sig_ecl_source_breadth_guardrail_019",
      kind: "data_quality",
      statement: `This narrative packet is built from ${rows.filter((row) => row.row_type !== "summary" && row.row_type !== "chapter_claim").length.toLocaleString()} governed projection rows; source-family summaries describe intake breadth but are not evidence for a business claim by themselves.`,
      domains: ["evidence_sources"],
      evidenceRefs: ["serving.home_executive_brief"],
    },
    {
      id: "sig_ecl_vendor_002",
      kind: "concentration",
      statement: topVendor
        ? `The ECL contract view shows ${contracts.length.toLocaleString()} contracts with $${(contractSpend / 1_000_000).toFixed(1)}M annualized value; ${String(topVendor.label)} is the largest visible supplier group at ${Number(topVendor.sharePct).toFixed(1)}% of the loaded contract value.`
        : "The ECL contract view has no supplier spend rows loaded.",
      domains: ["vendor_contract"],
      evidenceRefs: ["serving.home_vendor_contracts"],
    },
    {
      id: "sig_ecl_data_flow_003",
      kind: "complexity",
      statement: `The ECL data-flow view carries ${dataFlows.length.toLocaleString()} source-target movement rows, so architecture and data-flow pages should render from topology evidence instead of from static snapshot counts.`,
      domains: ["data_asset_or_integration", "application_system"],
      evidenceRefs: ["serving.home_current_state_data_flow"],
    },
    {
      id: "sig_ecl_gap_004",
      kind: "gap",
      statement: "This Home preview is served from governed ECL rows by default; retrieval indexing, client attestation, and narrative-quality review remain separate gates.",
      domains: ["evidence_sources"],
      evidenceRefs: ["serving.home_executive_brief"],
    },
  ];

  const contextItems: ContextItem[] = [
    {
      id: "ctx_ecl_assessment_001",
      statement: `This Home preview is based on ECL assessment ${assessmentId}; it is synthetic, not client-attested.`,
      domains: ["enterprise_profile", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_business_economics_001",
      statement:
        "Segment revenue, customer/channel economics, and formal enterprise identity attributes are not supplied by the current Home narrative input; business-model conclusions should therefore be limited to cited technology, commercial, infrastructure, and data-movement facts.",
      domains: ["enterprise_profile", "spend_value_fact", "application_system", "vendor_contract"],
    },
    {
      id: "ctx_ecl_scope_strategy_programs_001",
      statement:
        "Declared strategic priorities, funded programs, and program-to-outcome linkage are not supplied by the current Home narrative input; strategy chapters should treat strategy as an evidence gap rather than infer a transformation agenda.",
      domains: ["spend_value_fact", "vendor_contract", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_leadership_001",
      statement:
        "Leadership interview excerpts are not supplied by the current Home narrative input; leadership perspective should remain deferred until cited interview evidence is loaded.",
      domains: ["evidence_sources"],
    },
    ...projectionContextItems(rows),
  ];

  return {
    signals,
    contextItems,
    candidateRelationships: [],
    visualDatasets: {
      application_landscape_by_function: dimensionShareRows(applicationRecordType, 8),
      vendor_spend_concentration: vendorRows,
    },
  } as unknown as EnterpriseSignalPacket;
}

const CHAPTER_ID_SET = new Set<ChapterId>(CHAPTER_DEFS.map((definition) => definition.id));

function isChapterId(value: string): value is ChapterId {
  return CHAPTER_ID_SET.has(value as ChapterId);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function claimType(value: unknown): GroundedClaim["claim_type"] {
  return ["FACT", "OBSERVATION", "ADVISORY_INFERENCE"].includes(String(value))
    ? (String(value) as GroundedClaim["claim_type"])
    : "OBSERVATION";
}

function confidence(value: unknown): GroundedClaim["confidence"] {
  return ["high", "medium", "low"].includes(String(value))
    ? (String(value) as GroundedClaim["confidence"])
    : "medium";
}

function chapterClaimsByPage(rows: HomeProjectionRow[]): Map<ChapterId, GroundedClaim[]> {
  const claims = new Map<ChapterId, GroundedClaim[]>();
  for (const row of rows) {
    if (row.row_type !== "chapter_claim" || !isChapterId(row.page_key)) continue;
    const payload = rowPayload(row);
    const statement = text(row.summary) ?? text(row.title);
    if (!statement) continue;
    const claim: GroundedClaim = {
      statement,
      evidence_ids: stringArray(payload.evidence_ids),
      confidence: confidence(payload.confidence),
      claim_type: claimType(payload.claim_type),
    };
    claims.set(row.page_key, [...(claims.get(row.page_key) ?? []), claim]);
  }
  return claims;
}

function summaryText(summaries: Map<string, HomeProjectionRow>, chapterId: ChapterId): string {
  const summary = summaries.get(chapterId)?.summary;
  if (!summary) throw new Error(`Home ECL preview: missing published summary for ${chapterId}.`);
  return summary;
}

function publishedThesisFromRows(rows: HomeProjectionRow[]): EnterpriseThesis {
  const summaries = chapterSummaryRows(rows);
  const claims = chapterClaimsByPage(rows);
  const claimCount = Array.from(claims.values()).reduce((sum, pageClaims) => sum + pageClaims.length, 0);
  if (claimCount === 0) {
    throw new Error("Home ECL preview: no published chapter_claim rows; refusing to synthesize fallback narrative.");
  }
  const executive = claims.get("executive_brief") ?? [];
  const business = claims.get("our_business") ?? [];
  const strategy = claims.get("strategy_value_creation") ?? [];
  const operations = claims.get("how_we_operate") ?? [];
  const technology = claims.get("technology_data") ?? [];
  const performance = claims.get("performance_value") ?? [];
  const leadership = claims.get("leadership_perspective") ?? [];
  const attention = claims.get("what_needs_attention") ?? [];

  return {
    enterprise_story: summaryText(summaries, "executive_brief"),
    enterprise_story_claims: executive,
    value_creation_model: {
      summary: summaryText(summaries, "our_business"),
      primary_value_drivers: business,
      economic_dependencies: business,
    },
    strategic_bets: strategy,
    structural_constraints: [...operations, ...technology],
    operating_tensions: attention,
    leadership_consensus: leadership,
    leadership_disagreements: [],
    performance_story: { where_improving: [], where_off_track: [], where_unknown: performance },
    technology_and_data_implications: technology,
    material_risks: attention,
    value_realization_tensions: strategy,
    what_needs_attention: attention,
    evidence_gaps: [],
    things_a_new_cxo_should_know: executive,
    questions_for_management: [],
    visual_opportunities: [
      visual("application_landscape_by_function", "Applications grouped by business function", "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.", ["sig_ecl_estate_001"]),
      visual("vendor_spend_concentration", "Supplier concentration in loaded contract value", "Commercial concentration is now visible in the ECL contract projection.", ["sig_ecl_vendor_002"]),
    ],
  };
}

function buildPublishedChapters(rows: HomeProjectionRow[], claims: Map<ChapterId, GroundedClaim[]>): ChapterView[] {
  const summaries = chapterSummaryRows(rows);
  return CHAPTER_DEFS.map((definition) => {
    const summaryRow = summaries.get(definition.id);
    if (!summaryRow) throw new Error(`Home ECL preview: missing published summary row for ${definition.id}.`);
    const pageClaims = claims.get(definition.id) ?? [];
    return {
      chapterId: definition.id,
      title: definition.title,
      guidingQuestion: definition.guidingQuestion,
      headline: summaryRow.title,
      executive_synthesis: summaryRow.summary ?? summaryRow.title,
      key_insights: pageClaims,
      tensions: [],
      what_to_watch: [],
      questions_to_ask: [],
      visual_opportunities:
        definition.id === "technology_data"
          ? [
              visual("application_landscape_by_function", "Applications grouped by business function", "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.", ["sig_ecl_estate_001"]),
              visual("vendor_spend_concentration", "Supplier concentration in loaded contract value", "Commercial concentration is now visible in the ECL contract projection.", ["sig_ecl_vendor_002"]),
            ]
          : definition.id === "executive_brief"
            ? [visual("application_landscape_by_function", "Applications grouped by business function", "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.", ["sig_ecl_estate_001"])]
            : [],
      limitations: [],
    };
  });
}

export function buildHomeReviewBundleFromEclProjectionRows(
  base: HomeReviewBundle,
  rows: HomeProjectionRow[],
  assessmentId = denseAssessmentIdForTenant(base.tenantKey),
): HomeReviewBundle {
  const technologyEstate = buildTechnologyEstateFromHomeProjectionRows(rows);
  const signalPacket = buildEclSignalPacket(rows, technologyEstate, assessmentId);
  const claims = chapterClaimsByPage(rows);
  const thesis = publishedThesisFromRows(rows);
  const chapters = buildPublishedChapters(rows, claims);
  return {
    tenantKey: base.tenantKey,
    provenance: {
      ...base.provenance,
      home_synthesis_contract_version: `${base.provenance.home_synthesis_contract_version}+ecl-projection-v1`,
      model: "deterministic-ecl-projection",
      canonical_snapshot_hash: `ecl:${assessmentId}:home_enterprise_landscape:${rows.length}`,
    },
    chapters,
    thesis: {
      signalPacket,
      publishedGeneration: thesis,
      verificationLedger: [],
      structuralIssues: [],
    },
    technologyEstate,
  };
}

async function readHomeProjectionRows(
  tenantKey: string,
  assessmentId: string,
): Promise<HomeProjectionRow[]> {
  return azureRead.query<HomeProjectionRow>(
    `
      select
        page_key,
        row_key,
        row_type,
        title,
        summary,
        payload_json as display_payload_json
      from serving.home_executive_brief
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_our_business
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_strategy_value_creation
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_how_we_operate
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_technology_data
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_performance_value
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_leadership_perspective
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_needs_attention
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_current_state_architecture
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_current_state_data_flow
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_loaded_record
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_browse_record
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_applications_systems
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_vendor_contracts
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_infrastructure_platforms
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_data_assets_integrations
      where tenant_key = $1 and assessment_id = $2
      order by page_key, row_key
    `,
    [tenantKey, assessmentId],
    { missingTable: "empty" },
  );
}

export async function getHomeEclProjectionBundle(tenantKey: HomePreviewTenantKey): Promise<HomeReviewBundle> {
  const base = getHomeReviewBundle(tenantKey);
  if (!base) {
    throw new Error(`Home ECL preview: missing base deterministic bundle for ${tenantKey}.`);
  }

  const assessmentId = denseAssessmentIdForTenant(tenantKey);
  const rows = await readHomeProjectionRows(tenantKey, assessmentId);
  if (rows.length === 0) {
    throw new Error(`Home ECL preview: no serving Home rows for ${tenantKey}/${assessmentId}.`);
  }

  return {
    ...buildHomeReviewBundleFromEclProjectionRows(base, rows, assessmentId),
  };
}

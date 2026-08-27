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

function claim(statement: string, evidenceIds: string[], claimType: GroundedClaim["claim_type"] = "FACT", confidence: GroundedClaim["confidence"] = "high"): GroundedClaim {
  return { statement, evidence_ids: evidenceIds, confidence, claim_type: claimType };
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

function rowContextStatement(row: HomeProjectionRow): string {
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
      const flow = dataFlowRow(row);
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
  return rows
    .filter((row) => row.row_type !== "summary")
    .map((row) => ({
      id: contextIdForRow(row),
      statement: rowContextStatement(row),
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

  const signals: Signal[] = [
    {
      id: "sig_ecl_estate_001",
      kind: "portfolio",
      statement: `The ECL projection contains ${applications.length.toLocaleString()} applications, ${contracts.length.toLocaleString()} contracts, ${infrastructure.length.toLocaleString()} infrastructure/platform records, and ${dataFlows.length.toLocaleString()} data-flow rows.`,
      domains: ["application_system", "vendor_contract", "infrastructure_platform", "data_asset_or_integration"],
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
      statement: "This Home preview is a governed ECL projection read, but retrieval indexing and default-provider cutover remain separate gates.",
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

function buildEclThesis(signalPacket: EnterpriseSignalPacket): EnterpriseThesis {
  const estateClaim = claim(signalPacket.signals[0]?.statement ?? "The ECL estate projection is loaded.", ["sig_ecl_estate_001"]);
  const vendorClaim = claim(signalPacket.signals[1]?.statement ?? "The ECL vendor projection is loaded.", ["sig_ecl_vendor_002"], "OBSERVATION");
  const flowClaim = claim(signalPacket.signals[2]?.statement ?? "The ECL data-flow projection is loaded.", ["sig_ecl_data_flow_003"], "OBSERVATION");
  const gapClaim = claim(signalPacket.signals[3]?.statement ?? "Retrieval indexing and default-provider cutover remain pending.", ["sig_ecl_gap_004"], "OBSERVATION", "medium");
  return {
    enterprise_story: `${estateClaim.statement} The dense record is ready for current-state exploration; executive narrative generation and cutover remain governed follow-on decisions.`,
    enterprise_story_claims: [estateClaim, gapClaim],
    value_creation_model: {
      summary: "ECL Home establishes estate shape, commercial concentration and data-movement context from governed projection rows; interpretation should stay tied to the cited projection facts.",
      primary_value_drivers: [vendorClaim],
      economic_dependencies: [vendorClaim],
    },
    strategic_bets: [],
    structural_constraints: [flowClaim],
    operating_tensions: [gapClaim],
    leadership_consensus: [],
    leadership_disagreements: [],
    performance_story: { where_improving: [], where_off_track: [], where_unknown: [gapClaim] },
    technology_and_data_implications: [estateClaim, flowClaim],
    material_risks: [gapClaim],
    value_realization_tensions: [vendorClaim, gapClaim],
    what_needs_attention: [gapClaim],
    evidence_gaps: ["Retrieval indexing and default-provider cutover are not established by the Home ECL projection itself."],
    things_a_new_cxo_should_know: [estateClaim, vendorClaim, flowClaim, gapClaim],
    questions_for_management: [
      claim("Which Home chapter claims should be promoted from deterministic ECL exploration into a regenerated executive narrative?", ["sig_ecl_gap_004"], "ADVISORY_INFERENCE", "medium"),
    ],
    visual_opportunities: [
      visual("application_landscape_by_function", "Applications grouped by business function", "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.", ["sig_ecl_estate_001"]),
      visual("vendor_spend_concentration", "Supplier concentration in loaded contract value", "Commercial concentration is now visible in the ECL contract projection.", ["sig_ecl_vendor_002"]),
    ],
  };
}

function buildEclChapters(rows: HomeProjectionRow[], thesis: EnterpriseThesis): ChapterView[] {
  const summaries = chapterSummaryRows(rows);
  const byChapterClaims: Record<ChapterId, GroundedClaim[]> = {
    executive_brief: thesis.things_a_new_cxo_should_know,
    our_business: thesis.value_creation_model.primary_value_drivers,
    strategy_value_creation: thesis.value_realization_tensions,
    how_we_operate: [thesis.structural_constraints[0]].filter(Boolean),
    technology_data: thesis.technology_and_data_implications,
    performance_value: thesis.performance_story.where_unknown,
    leadership_perspective: [claim("Director-and-above interview rows are present in the dense source room, but leadership narrative synthesis has not been regenerated from ECL yet.", ["sig_ecl_gap_004"], "OBSERVATION", "medium")],
    what_needs_attention: thesis.what_needs_attention,
  };
  return CHAPTER_DEFS.map((definition) => {
    const summaryRow = summaries.get(definition.id);
    const primary = byChapterClaims[definition.id][0] ?? thesis.things_a_new_cxo_should_know[0];
    return {
      chapterId: definition.id,
      title: definition.title,
      guidingQuestion: definition.guidingQuestion,
      headline: summaryRow?.title ?? primary.statement,
      executive_synthesis: summaryRow?.summary ?? primary.statement,
      key_insights: byChapterClaims[definition.id].slice(0, 3),
      tensions: definition.id === "what_needs_attention" || definition.id === "executive_brief" ? thesis.operating_tensions : [],
      what_to_watch: definition.id === "technology_data" ? thesis.structural_constraints : thesis.material_risks.slice(0, 1),
      questions_to_ask: definition.id === "executive_brief" ? thesis.questions_for_management.map((item) => item.statement) : [],
      visual_opportunities:
        definition.id === "technology_data"
          ? thesis.visual_opportunities
          : definition.id === "executive_brief"
            ? thesis.visual_opportunities.slice(0, 1)
            : [],
      limitations: definition.id === "executive_brief" || definition.id === "what_needs_attention" ? thesis.evidence_gaps : [],
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
  const thesis = buildEclThesis(signalPacket);
  const chapters = buildEclChapters(rows, thesis);
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

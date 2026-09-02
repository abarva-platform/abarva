import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";
import { normalizeHomeReviewBundle } from "./bundle-normalization";

import {
  getHomeReviewBundle,
  type HomePreviewTenantKey,
} from "./golden-snapshot";
import type {
  ChapterId,
  ChapterView,
  ContextItem,
  EnterpriseSignalPacket,
  EnterpriseThesis,
  HomeExecutiveStoryPlanV1,
  HomeExecutiveStorySectionId,
  HomeExecutiveStoryTerminalState,
  GroundedClaim,
  HomeReviewBundle,
  Signal,
  TechnologyEstateBundle,
  TechObjectType,
  TechRecordType,
  VisualOpportunity,
} from "./types";

type JsonRecord = Record<string, unknown>;
type SourceSummary = EnterpriseSignalPacket["sourceSummaries"][number];
type DeterministicCategorySummary = {
  key: string;
  label: string;
  sourcePaths: string[];
  recordCount: number;
  denominator: string;
  topDimensions: Array<{
    field: string;
    values: Array<{ label: string; count: number; sharePct: number }>;
  }>;
  measures: Record<string, number>;
  gaps: string[];
};

export interface HomeProjectionRow {
  page_key: string;
  row_key: string;
  row_type: string;
  title: string;
  summary: string | null;
  display_payload_json: JsonRecord | null;
}

const COLUMN_ORDER: Record<TechObjectType, string[]> = {
  // An edge reads as a sentence: this object, this verb, that object. The endpoints sit either side
  // of the verb rather than being grouped as "from" fields and "to" fields, because that is how a
  // reader parses it.
  relationship_edge: [
    "fromObjectName",
    "fromObjectType",
    "relationshipType",
    "toObjectName",
    "toObjectType",
    "relationshipStrength",
    "evidenceBasis",
    "currentStateOrTargetState",
    "confidence",
    "knownGaps",
    "originalRowId",
  ],
  // The interview record, in the order the intake declares it: who was asked, what they were
  // asked, what they said, and then every estate object the answer names -- which is the half that
  // makes this family joinable to the rest of the record rather than a transcript.
  executive_interview: [
    "executiveArea",
    "stakeholderRole",
    "interviewGroup",
    "priorityTheme",
    "question",
    "response",
    "businessPriority",
    "painPoint",
    "knownChallenge",
    "keyInitiative",
    "systemOrVendorMentioned",
    "dataDomainMentioned",
    "metricMentioned",
    "riskOrControlMentioned",
    "decisionSupported",
    "evidenceNeeded",
    "responseBasis",
    "interviewDate",
    "confidence",
    "originalRowId",
  ],
  metric_outcome: [
    "metricName",
    "metricDomain",
    "businessFunction",
    "baselineValue",
    "targetValue",
    "actualValue",
    "claimReadiness",
    "valueClaimStatus",
    "claimBlockedReason",
    "unblockAction",
    "unblockTargetPeriod",
    "owner",
  ],
  risk_control: [
    "riskOrControlName",
    "riskDomain",
    "businessFunction",
    "severity",
    "likelihood",
    "controlStatus",
    "systemsImpacted",
    "remediationCostUsd",
    "regulatoryDriver",
    "controlOwner",
  ],
  program_initiative: [
    "programName",
    "status",
    "phase",
    "pctComplete",
    "budgetUsd",
    "expectedValueUsd",
    "stageGate",
    "blockedReason",
    "businessSponsor",
    "technologyOwner",
  ],
  organization_ownership: [
    "orgUnit",
    "leaderNameOrRole",
    "roleLevel",
    "decisionRights",
    "budgetAuthorityUsd",
    "ownedFunctions",
    "ownedSystems",
    "ownedDataDomains",
    "headcount",
  ],
  ai_use_case: [
    "useCaseName",
    "businessSegment",
    "businessFunction",
    "currentStatus",
    "aiPattern",
    "functionType",
    "officeLensAbarva",
    "valueClaimStatus",
    "financeValidatedValueUsd",
    "realizedValueAllowed",
  ],
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
    "recordKind",
    "dataAssetName",
    "dataDomain",
    "sourceSystem",
    "targetSystem",
    "integrationType",
    "workloadType",
    "platformName",
    "technologyName",
    "workloadCount",
    "activeUserCount",
    "dataVolumeTb",
    "governanceState",
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
  metric_outcome: "Metrics & Outcomes",
  risk_control: "Risks & Controls",
  program_initiative: "Programs & Initiatives",
  organization_ownership: "Organization & Ownership",
  ai_use_case: "AI & Automation Use Cases",
  executive_interview: "Leadership Interviews",
  relationship_edge: "Declared Relationships",
};

const PRIMARY_DIMENSION: Record<TechObjectType, string> = {
  executive_interview: "executiveArea",
  relationship_edge: "relationshipType",
  application_system: "businessFunction",
  vendor_contract: "serviceCategory",
  infrastructure_platform: "platformType",
  data_asset_or_integration: "dataDomain",
  metric_outcome: "metricDomain",
  risk_control: "riskDomain",
  program_initiative: "status",
  organization_ownership: "roleLevel",
  ai_use_case: "currentStatus",
};

const SOURCE_SUMMARY_BY_OBJECT_TYPE: Record<
  TechObjectType,
  { domain: string; sourcePath: string; authority?: string[] }
> = {
  metric_outcome: {
    domain: "metric_outcome",
    sourcePath: "serving.home_metrics_outcomes",
  },
  risk_control: {
    domain: "risk_control",
    sourcePath: "serving.home_risks_controls",
  },
  program_initiative: {
    domain: "program_initiative",
    sourcePath: "serving.home_programs_initiatives",
  },
  organization_ownership: {
    domain: "organization_ownership",
    sourcePath: "serving.home_org_ownership",
  },
  ai_use_case: {
    domain: "ai_use_case",
    sourcePath: "serving.home_ai_use_cases",
  },
  executive_interview: {
    domain: "executive_interview",
    sourcePath: "serving.home_executive_interviews",
  },
  relationship_edge: {
    domain: "relationship_edge",
    sourcePath: "serving.home_relationships",
  },
  application_system: {
    domain: "application_system",
    sourcePath: "serving.home_applications_systems",
  },
  vendor_contract: {
    domain: "vendor_contract",
    sourcePath: "serving.home_vendor_contracts",
  },
  infrastructure_platform: {
    domain: "infrastructure_platform",
    sourcePath: "serving.home_infrastructure_platforms",
  },
  data_asset_or_integration: {
    domain: "data_asset_or_integration",
    sourcePath:
      "serving.home_current_state_data_flow + serving.home_data_assets_integrations",
    authority: [
      "serving.home_current_state_data_flow",
      "serving.home_data_assets_integrations",
    ],
  },
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
  if (
    ["p0", "critical", "missioncritical", "tier1", "tier01"].includes(
      normalized,
    )
  )
    return "tier1";
  if (["high", "tier2", "tier02"].includes(normalized))
    return normalized === "high" ? "high" : "tier2";
  if (["medium", "tier3", "tier03"].includes(normalized))
    return normalized === "medium" ? "medium" : "tier3";
  return raw;
}

function endpointLabel(
  ref: unknown,
  labelsByRef: Map<string, string>,
): string | null {
  const raw = text(ref);
  if (!raw) return null;
  return labelsByRef.get(raw) ?? raw;
}

function endpointLabelsFromRows(
  rows: HomeProjectionRow[],
): Map<string, string> {
  const labelsByRef = new Map<string, string>();
  for (const row of rows) {
    if (
      row.page_key === "applications_systems" &&
      row.row_type === "application"
    ) {
      const mapped = applicationRow(row);
      const ref = text(mapped.originalRowId);
      const label = text(mapped.systemName);
      if (ref && label) labelsByRef.set(ref, label);
    }
    if (
      row.page_key === "infrastructure_platforms" &&
      row.row_type === "infrastructure"
    ) {
      const mapped = infrastructureRow(row);
      const ref = text(mapped.originalRowId);
      const label = text(mapped.platformName);
      if (ref && label) labelsByRef.set(ref, label);
    }
  }
  return labelsByRef;
}

function rowPayload(row: HomeProjectionRow): JsonRecord {
  if (!row.display_payload_json || typeof row.display_payload_json !== "object")
    return {};
  const payload = row.display_payload_json;
  const nestedPayload = payload.display_payload_json;
  if (
    !nestedPayload ||
    typeof nestedPayload !== "object" ||
    Array.isArray(nestedPayload)
  )
    return payload;
  return { ...payload, ...(nestedPayload as JsonRecord) };
}

/**
 * The five intake families the projection now carries.
 *
 * The loader puts the whole intake row into the payload, so the keys here are the CSV's own column
 * names. Each mapper renames to camelCase and does nothing else: no defaulting, no deriving, no
 * filling. A field the intake did not record stays undefined, which is what lets a surface say the
 * view cannot be built rather than showing a zero that reads as an assessment.
 */
function metricOutcomeRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    metricName: text(payload.metric_name) ?? row.title,
    metricDomain: text(payload.metric_domain),
    businessFunction: text(payload.business_function),
    definition: text(payload.definition),
    baselineValue: text(payload.baseline_value),
    baselinePeriod: text(payload.baseline_period),
    targetValue: text(payload.target_value),
    actualValue: text(payload.actual_value),
    owner: text(payload.owner),
    dataSource: text(payload.data_source),
    financeAttestedValueUsd: numberValue(payload.finance_attested_value_usd),
    valueClaimStatus: text(payload.value_claim_status),
    claimReadiness: text(payload.claim_readiness),
    claimBlockedReason: text(payload.claim_blocked_reason),
    unblockAction: text(payload.unblock_action),
    unblockTargetPeriod: text(payload.unblock_target_period),
    attestationOwner: text(payload.attestation_owner),
    originalRowId: text(payload.metric_id ?? row.row_key),
  };
}

function riskControlRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    riskOrControlName:
      text(
        payload.risk_or_control_name ??
          payload.risk_name ??
          payload.control_name,
      ) ?? row.title,
    riskDomain: text(payload.risk_domain),
    businessFunction: text(payload.business_function),
    systemsImpacted: text(payload.systems_impacted),
    severity: text(payload.severity),
    likelihood: text(payload.likelihood),
    controlOwner: text(payload.control_owner),
    controlStatus: text(payload.control_status ?? payload.control_state),
    inherentRiskScore: numberValue(payload.inherent_risk_score),
    residualRiskScore: numberValue(payload.residual_risk_score),
    remediationCostUsd: numberValue(payload.remediation_cost_usd),
    regulatoryDriver: text(payload.regulatory_driver),
    lastTestedDate: text(payload.last_tested_date),
    originalRowId: text(payload.risk_id ?? row.row_key),
  };
}

function programInitiativeRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    programName:
      text(payload.program_name ?? payload.initiative_name) ?? row.title,
    businessSponsor: text(payload.business_sponsor ?? payload.sponsor_function),
    technologyOwner: text(payload.technology_owner),
    objective: text(payload.objective),
    status: text(payload.status),
    phase: text(payload.phase),
    stageGate: text(payload.stage_gate),
    pctComplete: numberValue(payload.pct_complete),
    budgetUsd: numberValue(payload.budget_usd ?? payload.approved_budget_usd),
    expectedValueUsd: numberValue(
      payload.expected_value_usd ?? payload.target_value_usd,
    ),
    blockedReason: text(payload.blocked_reason),
    startDate: text(payload.start_date),
    endDate: text(payload.end_date),
    originalRowId: text(payload.program_id ?? row.row_key),
  };
}

function organizationOwnershipRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    orgUnit: text(payload.org_unit) ?? row.title,
    parentOrgUnit: text(payload.parent_org_unit),
    leaderNameOrRole: text(payload.leader_name_or_role),
    roleLevel: text(payload.role_level),
    decisionRights: text(payload.decision_rights),
    ownedFunctions: text(payload.owned_functions),
    ownedSystems: text(payload.owned_systems),
    ownedDataDomains: text(payload.owned_data_domains),
    headcount: numberValue(payload.headcount),
    budgetAuthorityUsd: numberValue(payload.budget_authority_usd),
    spanOfControl: numberValue(payload.span_of_control),
    successionRisk: text(payload.succession_risk),
    costCenterName: text(payload.cost_center_name),
    originalRowId: text(payload.org_unit_id ?? row.row_key),
  };
}

/**
 * One interview answer, with the basis of the answer carried beside it.
 *
 * The intake's response column is named `synthetic_answer`, and on the current records that is
 * literally what it holds. A modelled answer rendered as leadership testimony is the most
 * damaging thing this page could do: a reader takes a quotation from a named role as something a
 * person said. So the response and the basis of the response travel together, and the basis is
 * read from WHICH column supplied the text rather than assumed -- a record that later carries a
 * real transcript says so without this needing to change.
 */
function executiveInterviewRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  const attributed = text(payload.answer ?? payload.response);
  const modelled = text(payload.synthetic_answer);
  return {
    executiveArea: text(payload.executive_area),
    stakeholderRole: text(payload.stakeholder_role),
    interviewGroup: text(payload.interview_group),
    priorityTheme: text(payload.priority_theme),
    question: text(payload.question) ?? row.title,
    response: attributed ?? modelled,
    responseBasis: attributed
      ? "attributed"
      : modelled
        ? "modelled — not a transcript"
        : null,
    businessPriority: text(payload.business_priority),
    painPoint: text(payload.pain_point),
    knownChallenge: text(payload.known_challenge),
    keyInitiative: text(payload.key_initiative),
    initiativeLink: text(payload.initiative_link),
    systemOrVendorMentioned: text(payload.system_or_vendor_mentioned),
    dataDomainMentioned: text(payload.data_domain_mentioned),
    metricMentioned: text(payload.metric_mentioned),
    riskOrControlMentioned: text(payload.risk_or_control_mentioned),
    decisionSupported: text(payload.decision_supported),
    evidenceNeeded: text(payload.evidence_needed),
    interviewDate: text(payload.interview_date),
    confidence: text(payload.confidence),
    originalRowId: text(payload.interview_id ?? row.row_key),
  };
}

/**
 * One declared edge between two objects.
 *
 * The endpoints are names, not ids -- the intake declares "Epic Clarity" rather than a key -- so a
 * join to the application estate is a name match and can miss. That is the record's shape, and it
 * is left as the record has it rather than resolved here, because a silent near-match is worse than
 * an unresolved name a reader can see.
 */
function relationshipEdgeRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    fromObjectName: text(payload.from_object_name) ?? row.title,
    fromObjectType: text(payload.from_object_type),
    relationshipType: text(payload.relationship_type),
    toObjectName: text(payload.to_object_name),
    toObjectType: text(payload.to_object_type),
    relationshipStrength: text(payload.relationship_strength),
    evidenceBasis: text(payload.evidence_basis),
    currentStateOrTargetState: text(payload.current_state_or_target_state),
    confidence: text(payload.confidence),
    knownGaps: text(payload.known_gaps),
    originalRowId: text(payload.relationship_id ?? row.row_key),
  };
}

function aiUseCaseRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    useCaseName: text(payload.use_case_name) ?? row.title,
    businessSegment: text(payload.business_segment),
    businessFunction: text(payload.business_function),
    processArea: text(payload.process_area),
    functionType: text(payload.function_type),
    officeLensAbarva: text(payload.office_lens_abarva),
    aiPattern: text(payload.ai_pattern),
    currentStatus: text(payload.current_status),
    valueHypothesis: text(payload.value_hypothesis),
    expectedValueArchetype: text(payload.expected_value_archetype),
    sponsorRole: text(payload.sponsor_role),
    governanceCouncil: text(payload.governance_council),
    toolName: text(payload.tool_name),
    valueClaimStatus: text(payload.value_claim_status),
    financeValidatedValueUsd: numberValue(payload.finance_validated_value_usd),
    realizedValueAllowed: text(payload.realized_value_allowed),
    originalRowId: text(payload.use_case_id ?? row.row_key),
  };
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
    // Four columns the intake declares and this mapper used to drop. Home's estate tables read
    // them -- cloud readiness, lifecycle posture, the authentication-against-classification
    // crossing, and whether a cost is modelled or booked -- so dropping them here made those
    // tables silently absent on this path while they rendered from the golden snapshot. Absent in
    // the payload they resolve undefined, which is exactly what happened before.
    cloudReadiness: text(payload.cloud_readiness),
    authenticationMethod: text(payload.authentication_method),
    annualCostBasis: text(payload.annual_cost_basis),
    endOfSupportDate: text(payload.end_of_support_date),
    contractRef: text(payload.contract_ids),
    originalRowId: text(payload.application_id ?? row.row_key),
  };
}

function contractRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    vendorName:
      text(payload.supplier_name) ?? row.title.split(" · ")[0] ?? row.title,
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
    supportedSystems: text(
      payload.scoped_application_ids ?? payload.supported_systems,
    ),
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
    dataCenterOrRegion: text(
      payload.hosting_location ?? payload.data_center_or_region,
    ),
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

function dataFlowRow(
  row: HomeProjectionRow,
  labelsByRef: Map<string, string> = new Map(),
): JsonRecord {
  const payload = rowPayload(row);
  const sourceRef = text(
    payload.source_object_ref ??
      payload.source_system_ref_id ??
      payload.source_system_id,
  );
  const targetRef = text(
    payload.target_object_ref ??
      payload.target_system_ref_id ??
      payload.target_system_id,
  );
  return {
    recordKind: "data_movement",
    dataAssetName:
      text(payload.data_asset_name ?? payload.flow_name) ?? row.title,
    dataDomain: text(
      payload.data_domain ??
        payload.data_domain_name ??
        payload.target_function ??
        payload.source_function ??
        payload.owner_function ??
        payload.function,
    ),
    sourceSystem:
      endpointLabel(sourceRef, labelsByRef) ??
      text(payload.source_system_name ?? payload.source_system),
    targetSystem:
      endpointLabel(targetRef, labelsByRef) ??
      text(payload.target_system_name ?? payload.target_system),
    integrationType: text(
      payload.integration_type ?? payload.integration_pattern,
    ),
    platformOrDatabase: text(
      payload.platform_or_database ?? payload.landing_platform,
    ),
    refreshFrequency: text(payload.refresh_frequency ?? payload.cadence),
    qualityStatus: text(payload.quality_status ?? payload.quality_state),
    regulatedDataFlag: boolish(payload.regulated_data_flag),
    landingLayer: text(payload.landing_layer),
    consumptionLayer: text(payload.consumption_layer),
    cadence: text(payload.cadence),
    ownerFunction: text(payload.owner_function ?? payload.function),
    originalRowId: text(
      payload.flow_id ?? payload.source_row_id ?? row.row_key,
    ),
  };
}

function dataAnalyticsWorkloadRow(row: HomeProjectionRow): JsonRecord {
  const payload = rowPayload(row);
  return {
    recordKind: "data_analytics_workload",
    dataAssetName:
      text(payload.workload_name ?? payload.platform_name ?? row.title) ??
      row.title,
    dataDomain: text(payload.data_domain ?? payload.domain ?? payload.function),
    sourceSystem: text(payload.source_system_name ?? payload.source_system),
    targetSystem: text(payload.platform_name),
    integrationType: text(payload.workload_type),
    workloadType: text(payload.workload_type),
    platformName: text(payload.platform_name),
    technologyName: text(payload.technology_name),
    workloadCount: numberValue(payload.workload_count),
    activeUserCount: numberValue(payload.active_user_count),
    dataVolumeTb: numberValue(payload.data_volume_tb),
    governanceState: text(payload.governance_state),
    platformOrDatabase: text(payload.platform_name),
    refreshFrequency: text(payload.refresh_frequency ?? payload.cadence),
    qualityStatus: text(
      payload.quality_status ??
        payload.quality_state ??
        payload.governance_state,
    ),
    regulatedDataFlag: boolish(payload.regulated_data_flag),
    landingLayer: text(payload.landing_layer),
    consumptionLayer: text(payload.consumption_layer),
    cadence: text(payload.cadence ?? payload.refresh_frequency),
    ownerFunction: text(payload.owner_function ?? payload.function),
    originalRowId: text(
      payload.source_row_id ?? payload.workload_id ?? row.row_key,
    ),
  };
}

function stripEmpty(
  row: JsonRecord,
): Record<string, string | number | boolean | null> {
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      cleaned[key] = value;
    } else {
      cleaned[key] = JSON.stringify(value);
    }
  }
  return cleaned;
}

function dimensionCounts(
  rows: Array<Record<string, string | number | boolean | null>>,
  field: string,
) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[field];
    const value =
      raw === null || raw === undefined || raw === ""
        ? "(not specified)"
        : String(raw);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (a, b) => b.count - a.count,
  );
}

function topDimension(
  rows: Array<Record<string, string | number | boolean | null>>,
  field: string,
  limit: number,
) {
  return dimensionCounts(rows, field)
    .slice(0, limit)
    .map((item) => ({
      label: item.value,
      count: item.count,
      sharePct: rows.length
        ? Number(((item.count / rows.length) * 100).toFixed(1))
        : 0,
    }));
}

function workloadSummaryRows(
  rows: Array<Record<string, string | number | boolean | null>>,
  field: string,
  limit: number,
): Array<Record<string, unknown>> {
  const groups = new Map<
    string,
    {
      rows: number;
      workloadItems: number;
      activeUsers: number;
      dataVolumeTb: number;
      technologies: Map<string, number>;
    }
  >();
  for (const row of rows) {
    const label =
      text(row[field]) ??
      text(row.ownerFunction) ??
      text(row.dataDomain) ??
      "(not specified)";
    const group = groups.get(label) ?? {
      rows: 0,
      workloadItems: 0,
      activeUsers: 0,
      dataVolumeTb: 0,
      technologies: new Map<string, number>(),
    };
    group.rows += 1;
    group.workloadItems += numberValue(row.workloadCount) ?? 0;
    group.activeUsers += numberValue(row.activeUserCount) ?? 0;
    group.dataVolumeTb += numberValue(row.dataVolumeTb) ?? 0;
    const technology = text(row.technologyName);
    if (technology)
      group.technologies.set(
        technology,
        (group.technologies.get(technology) ?? 0) + 1,
      );
    groups.set(label, group);
  }
  return Array.from(groups, ([label, group]) => ({
    label,
    segments: group.rows,
    workloadItems: Math.round(group.workloadItems),
    activeUsers: Math.round(group.activeUsers),
    dataVolumeTb: Number(group.dataVolumeTb.toFixed(1)),
    topTechnologies: Array.from(group.technologies, ([technology, count]) => ({
      technology,
      count,
    }))
      .sort(
        (a, b) => b.count - a.count || a.technology.localeCompare(b.technology),
      )
      .slice(0, 5),
  }))
    .sort(
      (a, b) =>
        Number(b.workloadItems) - Number(a.workloadItems) ||
        String(a.label).localeCompare(String(b.label)),
    )
    .slice(0, limit);
}

function buildCategorySummaries(args: {
  applications: Array<Record<string, string | number | boolean | null>>;
  contracts: Array<Record<string, string | number | boolean | null>>;
  infrastructure: Array<Record<string, string | number | boolean | null>>;
  dataFlows: Array<Record<string, string | number | boolean | null>>;
  dataWorkloads: Array<Record<string, string | number | boolean | null>>;
}): DeterministicCategorySummary[] {
  const { applications, contracts, infrastructure, dataFlows, dataWorkloads } =
    args;
  const workloadItems = sumNumeric(dataWorkloads, "workloadCount");
  const activeUsers = sumNumeric(dataWorkloads, "activeUserCount");
  const dataVolumeTb = sumNumeric(dataWorkloads, "dataVolumeTb");
  return [
    {
      key: "applications_by_business_function",
      label: "Applications by business function",
      sourcePaths: ["serving.home_applications_systems"],
      recordCount: applications.length,
      denominator:
        "application_v rows, not deployments or raw canonical objects",
      topDimensions: [
        {
          field: "businessFunction",
          values: topDimension(applications, "businessFunction", 8),
        },
      ],
      measures: {
        applications: applications.length,
        annualCostUsd: sumNumeric(applications, "annualCostUsd"),
      },
      gaps: applications.length
        ? []
        : ["No governed application rows reached the Home packet."],
    },
    {
      key: "contracts_by_supplier_and_service",
      label: "Contracts by supplier and service",
      sourcePaths: ["serving.home_vendor_contracts"],
      recordCount: contracts.length,
      denominator: "contract rows with known value state",
      topDimensions: [
        {
          field: "vendorName",
          values: topDimension(contracts, "vendorName", 8),
        },
        {
          field: "serviceCategory",
          values: topDimension(contracts, "serviceCategory", 8),
        },
      ],
      measures: {
        contracts: contracts.length,
        annualizedValueUsd: sumNumeric(contracts, "annualSpendUsd"),
      },
      gaps: contracts.length
        ? []
        : ["No governed contract rows reached the Home packet."],
    },
    {
      key: "infrastructure_by_hosting_and_lifecycle",
      label: "Infrastructure by hosting and lifecycle",
      sourcePaths: ["serving.home_infrastructure_platforms"],
      recordCount: infrastructure.length,
      denominator:
        "platform and infrastructure records, not confirmed app-hosting joins",
      topDimensions: [
        {
          field: "hostingModel",
          values: topDimension(infrastructure, "hostingModel", 8),
        },
        {
          field: "platformType",
          values: topDimension(infrastructure, "platformType", 8),
        },
      ],
      measures: { platforms: infrastructure.length },
      gaps: infrastructure.length
        ? []
        : ["No governed infrastructure/platform rows reached the Home packet."],
    },
    {
      key: "data_movements_by_domain_and_mechanism",
      label: "Data movements by domain and mechanism",
      sourcePaths: ["serving.home_current_state_data_flow"],
      recordCount: dataFlows.length,
      denominator:
        "source-to-target movement rows, not reports, users, jobs, or data volume",
      topDimensions: [
        {
          field: "dataDomain",
          values: topDimension(dataFlows, "dataDomain", 8),
        },
        {
          field: "integrationType",
          values: topDimension(dataFlows, "integrationType", 8),
        },
      ],
      measures: { dataMovements: dataFlows.length },
      gaps: dataFlows.length
        ? []
        : [
            "No governed source-to-target data movement rows reached the Home packet.",
          ],
    },
    {
      key: "data_bi_etl_workloads_by_function_and_technology",
      label: "Data, BI, ETL, report, script, and analytics workloads",
      sourcePaths: ["serving.home_data_assets_integrations"],
      recordCount: dataWorkloads.length,
      denominator:
        "segment-level workload rows; not one row per report, job, script, or user",
      topDimensions: [
        {
          field: "ownerFunction",
          values: topDimension(dataWorkloads, "ownerFunction", 8),
        },
        {
          field: "technologyName",
          values: topDimension(dataWorkloads, "technologyName", 8),
        },
        {
          field: "workloadType",
          values: topDimension(dataWorkloads, "workloadType", 8),
        },
      ],
      measures: {
        workloadSegments: dataWorkloads.length,
        workloadItems: Math.round(workloadItems),
        activeUsers: Math.round(activeUsers),
        dataVolumeTb: Number(dataVolumeTb.toFixed(1)),
      },
      gaps: dataWorkloads.length
        ? []
        : [
            "No segment-level data/BI/ETL workload rows reached the Home packet; pages must not infer report, job, user, script, or data-volume counts from movement rows.",
          ],
    },
  ];
}

function recordType(
  objectType: TechObjectType,
  rows: Array<Record<string, string | number | boolean | null>>,
): TechRecordType | null {
  if (rows.length === 0) return null;
  const populated = (column: string) =>
    rows.some(
      (row) =>
        row[column] !== null && row[column] !== undefined && row[column] !== "",
    );
  const declared = COLUMN_ORDER[objectType].filter(populated);
  // Keys the rows carry that the declared order does not name.
  //
  // The order is maintained by hand and the mappers are maintained by hand, and the moment one
  // changes without the other the difference is silent -- `columns` is what search, the table and
  // the constant-column detector all read, so a field the mapper emits but the order omits is
  // carried on every row and reachable from nothing. Seven of the nine families were in that state:
  // the parent link the reporting structure is built from, the register's own residual score, what
  // a programme is FOR.
  //
  // Appended rather than merged into the order, so the curated sequence still leads and the tail is
  // whatever the record turned out to have.
  const undeclared = [
    ...new Set(rows.flatMap((row) => Object.keys(row))),
  ].filter((column) => !declared.includes(column) && populated(column));
  const columns = [...declared, ...undeclared];
  const primaryDimension = columns.includes(PRIMARY_DIMENSION[objectType])
    ? PRIMARY_DIMENSION[objectType]
    : null;
  return {
    objectType,
    label: LABELS[objectType],
    columns,
    rows,
    primaryDimension,
    dimensionCounts: primaryDimension
      ? dimensionCounts(rows, primaryDimension)
      : [],
  };
}

export function buildTechnologyEstateFromHomeProjectionRows(
  rows: HomeProjectionRow[],
): TechnologyEstateBundle {
  const applicationRows = rows.filter(
    (row) =>
      row.page_key === "applications_systems" && row.row_type === "application",
  );
  const infrastructureRows = rows.filter(
    (row) =>
      row.page_key === "infrastructure_platforms" &&
      row.row_type === "infrastructure",
  );
  const applications = rows
    .filter(
      (row) =>
        row.page_key === "applications_systems" &&
        row.row_type === "application",
    )
    .map((row) => stripEmpty(applicationRow(row)));
  const contracts = rows
    .filter(
      (row) =>
        row.page_key === "vendor_contracts" && row.row_type === "contract",
    )
    .map((row) => stripEmpty(contractRow(row)));
  const infrastructure = infrastructureRows.map((row) =>
    stripEmpty(infrastructureRow(row)),
  );
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
    .filter(
      (row) =>
        row.page_key === "current_state_data_flow" &&
        row.row_type === "data_flow",
    )
    .map((row) => stripEmpty(dataFlowRow(row, labelsByRef)));
  const dataWorkloads = rows
    .filter(
      (row) =>
        row.page_key === "data_assets_integrations" &&
        row.row_type === "data_analytics_workload",
    )
    .map((row) => stripEmpty(dataAnalyticsWorkloadRow(row)));

  // The five intake families the projection carries as of the active-intake page-key slice. Each
  // builds only when its page key has rows: a family the projection has not loaded yet produces no
  // record type at all, which is what lets a surface report the absence rather than an empty table.
  const intakeFamily = (
    pageKey: string,
    map: (row: HomeProjectionRow) => JsonRecord,
  ) =>
    rows
      .filter((row) => row.page_key === pageKey)
      .map((row) => stripEmpty(map(row)));

  const metrics = intakeFamily("metrics_outcomes", metricOutcomeRow);
  const risks = intakeFamily("risks_controls", riskControlRow);
  const programs = intakeFamily("programs_initiatives", programInitiativeRow);
  const orgUnits = intakeFamily("org_ownership", organizationOwnershipRow);
  const aiUseCases = intakeFamily("ai_use_cases", aiUseCaseRow);
  const interviews = intakeFamily(
    "executive_interviews",
    executiveInterviewRow,
  );
  const relationships = intakeFamily("relationships", relationshipEdgeRow);

  return {
    recordTypes: [
      recordType("application_system", applications),
      recordType("vendor_contract", contracts),
      recordType("infrastructure_platform", infrastructure),
      recordType("data_asset_or_integration", [...dataFlows, ...dataWorkloads]),
      recordType("metric_outcome", metrics),
      recordType("risk_control", risks),
      recordType("program_initiative", programs),
      recordType("organization_ownership", orgUnits),
      recordType("ai_use_case", aiUseCases),
      recordType("executive_interview", interviews),
      recordType("relationship_edge", relationships),
    ].filter((row): row is TechRecordType => Boolean(row)),
  };
}

const CHAPTER_DEFS: Array<{
  id: ChapterId;
  title: string;
  guidingQuestion: string;
}> = [
  {
    id: "executive_brief",
    title: "Executive Brief",
    guidingQuestion: "What should I understand in my first ten minutes?",
  },
  {
    id: "our_business",
    title: "Our Business",
    guidingQuestion: "How does this enterprise work and create value?",
  },
  {
    id: "strategy_value_creation",
    title: "Strategy & Value Creation",
    guidingQuestion: "Where are we trying to go, and what bets are we making?",
  },
  {
    id: "how_we_operate",
    title: "How We Operate",
    guidingQuestion:
      "How is the enterprise organized and how does work get done?",
  },
  {
    id: "technology_data",
    title: "Technology & Data",
    guidingQuestion:
      "What enables the business, and where is complexity or dependency concentrated?",
  },
  {
    id: "performance_value",
    title: "Performance & Value",
    guidingQuestion:
      "Are we moving toward outcomes, and can we prove the value?",
  },
  {
    id: "leadership_perspective",
    title: "Leadership Perspective",
    guidingQuestion: "What do leaders agree on, disagree on, and worry about?",
  },
  {
    id: "what_needs_attention",
    title: "What Needs Attention",
    guidingQuestion:
      "What tensions, risks, dependencies and decisions deserve executive attention?",
  },
];

function rowsForType(
  estate: TechnologyEstateBundle,
  objectType: TechObjectType,
): Array<Record<string, string | number | boolean | null>> {
  return (
    estate.recordTypes.find(
      (recordType) => recordType.objectType === objectType,
    )?.rows ?? []
  );
}

function sumNumeric(
  rows: Array<Record<string, string | number | boolean | null>>,
  field: string,
): number {
  return rows.reduce(
    (sum, row) =>
      sum +
      (typeof row[field] === "number" ? row[field] : Number(row[field]) || 0),
    0,
  );
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
    totals.set(
      label,
      (totals.get(label) ?? 0) +
        (typeof row[valueField] === "number"
          ? row[valueField]
          : Number(row[valueField]) || 0),
    );
  }
  const total = Array.from(totals.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  return Array.from(totals, ([label, value]) => ({
    label,
    sharePct: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
  }))
    .sort((a, b) => Number(b.sharePct) - Number(a.sharePct))
    .slice(0, limit);
}

function dimensionShareRows(
  recordType: TechRecordType | undefined,
  limit: number,
): Array<Record<string, unknown>> {
  const total = recordType?.rows.length ?? 0;
  return (recordType?.dimensionCounts ?? []).slice(0, limit).map((row) => ({
    label: row.value,
    sharePct: total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
  }));
}

function chapterSummaryRows(
  rows: HomeProjectionRow[],
): Map<string, HomeProjectionRow> {
  return new Map(
    rows
      .filter(
        (row) => row.row_type === "summary" && row.row_key.endsWith("_summary"),
      )
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
    purpose:
      "Render a deterministic ECL projection dataset without generating new values.",
    dataset_ref: datasetRef,
    key_message: keyMessage,
    evidence_ids: evidenceIds,
    priority: "high",
  };
}

function contextIdForRow(row: HomeProjectionRow): string {
  return `ctx_ecl_${row.page_key}_${row.row_type}_${row.row_key}`.replace(
    /[^a-zA-Z0-9_]/g,
    "_",
  );
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
    case "data_assets_integrations":
      return ["data_asset_or_integration", "infrastructure_platform"];
    default:
      return ["evidence_sources"];
  }
}

function rowContextStatement(
  row: HomeProjectionRow,
  labelsByRef: Map<string, string> = new Map(),
): string {
  switch (row.page_key) {
    case "applications_systems": {
      const app = applicationRow(row);
      const parts = [
        `${text(app.systemName) ?? row.title} is loaded as an application`,
        text(app.businessFunction) ? `for ${text(app.businessFunction)}` : null,
        text(app.vendor) ? `supplied by ${text(app.vendor)}` : null,
        text(app.criticality)
          ? `with ${text(app.criticality)} criticality`
          : null,
        formatUsd(numberValue(app.annualCostUsd))
          ? `and ${formatUsd(numberValue(app.annualCostUsd))} annual cost`
          : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "vendor_contracts": {
      const contract = contractRow(row);
      const parts = [
        `${text(contract.contractName) ?? row.title} is loaded as a contract`,
        text(contract.vendorName) ? `with ${text(contract.vendorName)}` : null,
        text(contract.serviceCategory)
          ? `for ${text(contract.serviceCategory)}`
          : null,
        formatUsd(numberValue(contract.annualSpendUsd))
          ? `with ${formatUsd(numberValue(contract.annualSpendUsd))} annualized value`
          : null,
        numberValue(contract.noticePeriodDays) !== null
          ? `and ${numberValue(contract.noticePeriodDays)} days notice`
          : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "infrastructure_platforms": {
      const platform = infrastructureRow(row);
      const parts = [
        `${text(platform.platformName) ?? row.title} is loaded as an infrastructure or platform record`,
        text(platform.platformType)
          ? `of type ${text(platform.platformType)}`
          : null,
        text(platform.hostingModel)
          ? `on ${text(platform.hostingModel)}`
          : null,
        text(platform.criticality)
          ? `with ${text(platform.criticality)} criticality`
          : null,
        numberValue(platform.capacityHeadroomPct) !== null
          ? `and ${numberValue(platform.capacityHeadroomPct)}% capacity headroom`
          : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "current_state_data_flow": {
      const flow = dataFlowRow(row, labelsByRef);
      const source = text(flow.sourceSystem) ?? "an unspecified source";
      const target = text(flow.targetSystem) ?? "an unspecified target";
      const parts = [
        `${text(flow.dataAssetName) ?? row.title} is loaded as a data movement from ${source} to ${target}`,
        text(flow.integrationType)
          ? `using ${text(flow.integrationType)}`
          : null,
        text(flow.landingLayer)
          ? `landing in ${text(flow.landingLayer)}`
          : null,
        text(flow.consumptionLayer)
          ? `and serving ${text(flow.consumptionLayer)}`
          : null,
      ].filter(Boolean);
      return `${parts.join(" ")}.`;
    }
    case "data_assets_integrations": {
      const workload = dataAnalyticsWorkloadRow(row);
      const parts = [
        `${text(workload.dataAssetName) ?? row.title} is loaded as a data, BI, ETL, or analytics workload segment`,
        text(workload.ownerFunction)
          ? `for ${text(workload.ownerFunction)}`
          : null,
        text(workload.technologyName)
          ? `using ${text(workload.technologyName)}`
          : null,
        numberValue(workload.workloadCount) !== null
          ? `with ${numberValue(workload.workloadCount)?.toLocaleString()} workload items`
          : null,
        numberValue(workload.activeUserCount) !== null
          ? `${numberValue(workload.activeUserCount)?.toLocaleString()} active users`
          : null,
        numberValue(workload.dataVolumeTb) !== null
          ? `${numberValue(workload.dataVolumeTb)?.toLocaleString()} TB`
          : null,
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
    .filter(
      (row) => row.row_type !== "summary" && row.row_type !== "chapter_claim",
    )
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
  const dataRecords = rowsForType(estate, "data_asset_or_integration");
  const dataFlows = dataRecords.filter(
    (row) => row.recordKind !== "data_analytics_workload",
  );
  const dataWorkloads = dataRecords.filter(
    (row) => row.recordKind === "data_analytics_workload",
  );
  const applicationRecordType = estate.recordTypes.find(
    (recordType) => recordType.objectType === "application_system",
  );
  const contractSpend = sumNumeric(contracts, "annualSpendUsd");
  const vendorRows = topShareRows(contracts, "vendorName", "annualSpendUsd", 8);
  const topVendor = vendorRows[0];
  const topFunctions = dimensionShareRows(applicationRecordType, 8);
  const topFunction = topFunctions[0];
  const applicationCost = sumNumeric(applications, "annualCostUsd");
  const tierOneApplications = applications.filter(
    (row) => criticalityValue(row.criticality) === "tier1",
  );
  const lifecycleWatch = applications.filter((row) =>
    /watch|aging|replace|legacy|retir/i.test(
      `${text(row.lifecycleState) ?? ""} ${text(row.replacementCandidate) ?? ""}`,
    ),
  );
  const autoRenewContracts = contracts.filter(
    (row) => row.autoRenewFlag === true,
  );
  const longNoticeContracts = contracts.filter(
    (row) =>
      numberValue(row.noticePeriodDays) !== null &&
      numberValue(row.noticePeriodDays)! >= 180,
  );
  const supportDatedPlatforms = infrastructure.filter((row) =>
    Boolean(text(row.endOfLifeDate)),
  );
  const criticalPlatforms = infrastructure.filter(
    (row) =>
      criticalityValue(row.criticality) === "tier1" ||
      /critical/i.test(text(row.criticality) ?? ""),
  );
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
      statement: `The ECL projection contains ${applications.length.toLocaleString()} applications, ${contracts.length.toLocaleString()} contracts, ${infrastructure.length.toLocaleString()} infrastructure/platform records, ${dataFlows.length.toLocaleString()} data-flow rows, and ${dataWorkloads.length.toLocaleString()} data/BI/ETL workload segments.`,
      domains: [
        "application_system",
        "vendor_contract",
        "infrastructure_platform",
        "data_asset_or_integration",
      ],
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
              .map(
                (item) =>
                  `${item.label} (${Number(item.sharePct).toFixed(1)}%)`,
              )
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
    ...(dataWorkloads.length
      ? [
          {
            id: "sig_ecl_data_workload_segments_017",
            kind: "portfolio" as const,
            statement: `The data, BI, ETL, and analytics inventory contains ${dataWorkloads.length.toLocaleString()} workload segments with summarized workload, active-user, and data-volume measures; it is a segment-level inventory, not a row-per-report dump.`,
            domains: ["data_asset_or_integration", "infrastructure_platform"],
            evidenceRefs: ["serving.home_data_assets_integrations"],
          },
        ]
      : []),
    {
      id: "sig_ecl_application_named_examples_015",
      kind: "portfolio",
      statement:
        "Named high-cost application examples are available in the application register.",
      domains: ["application_system"],
      evidenceRefs: ["serving.home_applications_systems"],
    },
    {
      id: "sig_ecl_platform_named_resilience_016",
      kind: "risk",
      statement:
        "Named infrastructure or platform examples with resilience evidence are available in the infrastructure register.",
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
      statement:
        "This Home preview is served from governed ECL rows by default; retrieval indexing, client attestation, and narrative-quality review remain separate gates.",
      domains: ["evidence_sources"],
      evidenceRefs: ["serving.home_executive_brief"],
    },
  ];

  const contextItems: ContextItem[] = [
    {
      id: "ctx_ecl_assessment_001",
      // The packet must name the record it came from. Without the id two tenants' packets read
      // identically in the model's context, and a caveat that cannot be traced to a record is a
      // caveat about nothing.
      statement: `This briefing is built from assessment record ${assessmentId}, a synthetic record. It is not client-attested.`,
      domains: ["enterprise_profile", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_business_economics_001",
      statement:
        "Segment revenue, customer/channel economics, and formal enterprise identity attributes are not supplied by the current Home narrative input; business-model conclusions should therefore be limited to cited technology, commercial, infrastructure, and data-movement facts.",
      domains: [
        "enterprise_profile",
        "spend_value_fact",
        "application_system",
        "vendor_contract",
      ],
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
  const sourceSummaries = buildEclSourceSummaries(estate);

  return {
    signals,
    contextItems,
    candidateRelationships: [],
    sourceSummaries,
    visualDatasets: {
      application_landscape_by_function: dimensionShareRows(
        applicationRecordType,
        8,
      ),
      vendor_spend_concentration: vendorRows,
      data_workload_by_function: workloadSummaryRows(
        dataWorkloads,
        "ownerFunction",
        12,
      ),
      data_workload_by_technology: workloadSummaryRows(
        dataWorkloads,
        "technologyName",
        12,
      ),
    },
    categorySummaries: buildCategorySummaries({
      applications,
      contracts,
      infrastructure,
      dataFlows,
      dataWorkloads,
    }),
  } as unknown as EnterpriseSignalPacket;
}

function buildEclSourceSummaries(
  estate: TechnologyEstateBundle,
): SourceSummary[] {
  return estate.recordTypes
    .map((recordType): SourceSummary | null => {
      const config = SOURCE_SUMMARY_BY_OBJECT_TYPE[recordType.objectType];
      if (!config || recordType.rows.length === 0) return null;
      const materialFields = recordType.columns.slice(0, 12);
      const exampleRecords = recordType.rows
        .map(
          (row) =>
            text(row.systemName) ??
            text(row.vendorName) ??
            text(row.platformName) ??
            text(row.dataAssetName) ??
            text(row.originalRowId),
        )
        .filter((value): value is string => Boolean(value))
        .slice(0, 5);
      const primaryDimension = recordType.primaryDimension;
      const dimensionContext = primaryDimension
        ? recordType.dimensionCounts
            .slice(0, 3)
            .map((item) => `${item.value} (${item.count})`)
        : [];
      return {
        sourcePath: config.sourcePath,
        domain: config.domain,
        objectTypes: [recordType.objectType],
        recordCount: recordType.rows.length,
        canonicalRecordCount: recordType.rows.length,
        sourceKind: "serving_projection",
        basis: ["deterministic_ecl_projection"],
        authority: config.authority ?? [config.sourcePath],
        qualityStates: ["projection_row_read"],
        materialFields: dimensionContext.length
          ? [
              ...materialFields,
              `top_${primaryDimension}: ${dimensionContext.join(", ")}`,
            ].slice(0, 12)
          : materialFields,
        exampleRecords,
      };
    })
    .filter((summary): summary is SourceSummary => Boolean(summary))
    .sort(
      (a, b) =>
        b.recordCount - a.recordCount ||
        a.sourcePath.localeCompare(b.sourcePath),
    );
}

const CHAPTER_ID_SET = new Set<ChapterId>(
  CHAPTER_DEFS.map((definition) => definition.id),
);
const STORY_PLAN_CONTRACT_VERSION = "home-executive-story-plan/v1" as const;
const STORY_SECTION_IDS: HomeExecutiveStorySectionId[] = [
  "enterprise",
  "bets",
  "runs-on",
  "costs-returns",
  "exposed",
  "attention",
];
const STORY_PLAN_ROW_TYPE = "story_plan";

function isChapterId(value: string): value is ChapterId {
  return CHAPTER_ID_SET.has(value as ChapterId);
}

function isStorySectionId(
  value: unknown,
): value is HomeExecutiveStorySectionId {
  return STORY_SECTION_IDS.includes(value as HomeExecutiveStorySectionId);
}

function isTerminalState(
  value: unknown,
): value is HomeExecutiveStoryTerminalState {
  return value === "published" || value === "refused" || value === "deferred";
}

function terminalStateForChapter(
  chapterId: ChapterId,
  claims: Map<ChapterId, GroundedClaim[]>,
): HomeExecutiveStoryTerminalState {
  return (claims.get(chapterId) ?? []).length > 0 ? "published" : "deferred";
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

function chapterClaimsByPage(
  rows: HomeProjectionRow[],
): Map<ChapterId, GroundedClaim[]> {
  const claims = new Map<ChapterId, GroundedClaim[]>();
  for (const row of rows) {
    if (row.row_type !== "chapter_claim" || !isChapterId(row.page_key))
      continue;
    const payload = rowPayload(row);
    const statement = text(row.summary) ?? text(row.title);
    if (!statement) continue;
    const claim: GroundedClaim = {
      claim_ref: row.row_key,
      statement,
      evidence_ids: stringArray(payload.evidence_ids),
      confidence: confidence(payload.confidence),
      claim_type: claimType(payload.claim_type),
    };
    claims.set(row.page_key, [...(claims.get(row.page_key) ?? []), claim]);
  }
  return claims;
}

function claimRefs(claims: Map<ChapterId, GroundedClaim[]>): Set<string> {
  return new Set(
    Array.from(claims.values())
      .flat()
      .map((claim) => claim.claim_ref)
      .filter((ref): ref is string => Boolean(ref)),
  );
}

function requireKnownClaimRef(
  refs: Set<string>,
  ref: unknown,
  field: string,
): string | null {
  const value = text(ref);
  if (!value) return null;
  if (!refs.has(value)) {
    throw new Error(
      `Home ECL preview: story_plan ${field} references missing chapter_claim ${value}.`,
    );
  }
  return value;
}

function requireKnownClaimRefs(
  refs: Set<string>,
  value: unknown,
  field: string,
): string[] {
  const values = stringArray(value);
  const unknown = values.find((ref) => !refs.has(ref));
  if (unknown) {
    throw new Error(
      `Home ECL preview: story_plan ${field} references missing chapter_claim ${unknown}.`,
    );
  }
  return values;
}

function storyPlanRow(rows: HomeProjectionRow[]): HomeProjectionRow | null {
  return rows.find((row) => row.row_type === STORY_PLAN_ROW_TYPE) ?? null;
}

function storyPlanFromRows(
  tenantKey: string,
  assessmentId: string,
  rows: HomeProjectionRow[],
  claims: Map<ChapterId, GroundedClaim[]>,
): HomeExecutiveStoryPlanV1 {
  const row = storyPlanRow(rows);
  if (!row) return blockedStoryPlan(tenantKey, assessmentId);

  const payload = rowPayload(row);
  const planPayload =
    payload.story_plan && typeof payload.story_plan === "object"
      ? (payload.story_plan as JsonRecord)
      : payload;
  const refs = claimRefs(claims);
  const rawChapterStates =
    planPayload.chapterStates && typeof planPayload.chapterStates === "object"
      ? (planPayload.chapterStates as JsonRecord)
      : {};
  const chapterStates = Object.fromEntries(
    CHAPTER_DEFS.map((definition) => {
      const raw = rawChapterStates[definition.id];
      const statePayload =
        raw && typeof raw === "object" ? (raw as JsonRecord) : {};
      const state = isTerminalState(statePayload.state)
        ? statePayload.state
        : terminalStateForChapter(definition.id, claims);
      return [
        definition.id,
        {
          state,
          reasonCode: text(statePayload.reasonCode ?? statePayload.reason_code),
        },
      ];
    }),
  ) as HomeExecutiveStoryPlanV1["chapterStates"];
  const sectionsInput = Array.isArray(planPayload.sections)
    ? planPayload.sections
    : [];
  const requestedSectionOrder = stringArray(
    planPayload.sectionOrder ?? planPayload.section_order,
  );
  const sectionOrder =
    requestedSectionOrder.length > 0
      ? requestedSectionOrder.filter(isStorySectionId)
      : STORY_SECTION_IDS;
  if (
    sectionOrder.length !== STORY_SECTION_IDS.length ||
    new Set(sectionOrder).size !== STORY_SECTION_IDS.length
  ) {
    throw new Error(
      "Home ECL preview: story_plan sectionOrder must contain each executive story section exactly once.",
    );
  }
  const sections = STORY_SECTION_IDS.map((sectionId) => {
    const raw = sectionsInput.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as JsonRecord).sectionId === sectionId,
    ) as JsonRecord | undefined;
    const state = isTerminalState(raw?.state) ? raw.state : "deferred";
    return {
      sectionId,
      state,
      leadClaimRef: requireKnownClaimRef(
        refs,
        raw?.leadClaimRef ?? raw?.lead_claim_ref,
        `sections.${sectionId}.leadClaimRef`,
      ),
      supportingClaimRefs: requireKnownClaimRefs(
        refs,
        raw?.supportingClaimRefs ?? raw?.supporting_claim_refs,
        `sections.${sectionId}.supportingClaimRefs`,
      ),
      reasonCode: text(raw?.reasonCode ?? raw?.reason_code),
    };
  });
  const decisions = (
    Array.isArray(planPayload.decisions) ? planPayload.decisions : []
  )
    .filter(
      (item): item is JsonRecord => Boolean(item) && typeof item === "object",
    )
    .slice(0, 3)
    .map((item, index) => ({
      decisionId:
        text(item.decisionId ?? item.decision_id) ?? `decision-${index + 1}`,
      question:
        text(item.question) ??
        "What decision should the executive team make next?",
      whyNowClaimRefs: requireKnownClaimRefs(
        refs,
        item.whyNowClaimRefs ?? item.why_now_claim_refs,
        `decisions.${index}.whyNowClaimRefs`,
      ),
      ownerRef: text(item.ownerRef ?? item.owner_ref),
      handoffModule: ["moves", "source", "tower", "intelligence"].includes(
        String(item.handoffModule ?? item.handoff_module),
      )
        ? (String(item.handoffModule ?? item.handoff_module) as
            | "moves"
            | "source"
            | "tower"
            | "intelligence")
        : null,
      evidenceNeeded: stringArray(item.evidenceNeeded ?? item.evidence_needed),
    }));

  return {
    contractVersion: STORY_PLAN_CONTRACT_VERSION,
    tenantKey,
    assessmentId,
    snapshotId: text(planPayload.snapshotId ?? planPayload.snapshot_id),
    openingThesisClaimRef: requireKnownClaimRef(
      refs,
      planPayload.openingThesisClaimRef ?? planPayload.opening_thesis_claim_ref,
      "openingThesisClaimRef",
    ),
    openingSupportingClaimRefs: requireKnownClaimRefs(
      refs,
      planPayload.openingSupportingClaimRefs ??
        planPayload.opening_supporting_claim_refs,
      "openingSupportingClaimRefs",
    ),
    scaleFactRef: requireKnownClaimRef(
      refs,
      planPayload.scaleFactRef ?? planPayload.scale_fact_ref,
      "scaleFactRef",
    ),
    decisions,
    sectionOrder,
    sections,
    chapterStates,
    heroVisualDatasetRef: text(
      planPayload.heroVisualDatasetRef ?? planPayload.hero_visual_dataset_ref,
    ),
    overallEvidenceBoundary:
      text(
        planPayload.overallEvidenceBoundary ??
          planPayload.overall_evidence_boundary,
      ) ?? "Story plan row is present, but no evidence boundary was supplied.",
    sourceClaimRefs: requireKnownClaimRefs(
      refs,
      planPayload.sourceClaimRefs ?? planPayload.source_claim_refs,
      "sourceClaimRefs",
    ),
    storyPlanHash:
      text(planPayload.storyPlanHash ?? planPayload.story_plan_hash) ??
      "missing-story-plan-hash",
  };
}

function blockedStoryPlan(
  tenantKey: string,
  assessmentId: string,
): HomeExecutiveStoryPlanV1 {
  const chapterStates = Object.fromEntries(
    CHAPTER_DEFS.map((definition) => [
      definition.id,
      {
        state: "deferred" as const,
        reasonCode: "story_plan_not_published",
      },
    ]),
  ) as HomeExecutiveStoryPlanV1["chapterStates"];
  return {
    contractVersion: STORY_PLAN_CONTRACT_VERSION,
    tenantKey,
    assessmentId,
    snapshotId: null,
    openingThesisClaimRef: null,
    openingSupportingClaimRefs: [],
    scaleFactRef: null,
    decisions: [],
    sectionOrder: STORY_SECTION_IDS,
    sections: STORY_SECTION_IDS.map((sectionId) => ({
      sectionId,
      state: "deferred",
      leadClaimRef: null,
      supportingClaimRefs: [],
      reasonCode: "story_plan_not_published",
    })),
    chapterStates,
    heroVisualDatasetRef: null,
    overallEvidenceBoundary:
      "The executive storyline is deferred because a verified story plan has not been published for this tenant.",
    sourceClaimRefs: [],
    storyPlanHash: "story_plan_not_published",
  };
}

function summaryText(
  summaries: Map<string, HomeProjectionRow>,
  chapterId: ChapterId,
): string {
  const summary = summaries.get(chapterId)?.summary;
  if (!summary)
    throw new Error(
      `Home ECL preview: missing published summary for ${chapterId}.`,
    );
  return summary;
}

function publishedThesisFromRows(rows: HomeProjectionRow[]): EnterpriseThesis {
  const summaries = chapterSummaryRows(rows);
  const claims = chapterClaimsByPage(rows);
  const claimCount = Array.from(claims.values()).reduce(
    (sum, pageClaims) => sum + pageClaims.length,
    0,
  );
  if (claimCount === 0) {
    return deferredThesis();
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
    performance_story: {
      where_improving: [],
      where_off_track: [],
      where_unknown: performance,
    },
    technology_and_data_implications: technology,
    material_risks: attention,
    value_realization_tensions: strategy,
    what_needs_attention: attention,
    evidence_gaps: [],
    things_a_new_cxo_should_know: executive,
    questions_for_management: [],
    visual_opportunities: [
      visual(
        "application_landscape_by_function",
        "Applications grouped by business function",
        "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.",
        ["sig_ecl_estate_001"],
      ),
      visual(
        "vendor_spend_concentration",
        "Supplier concentration in loaded contract value",
        "Commercial concentration is now visible in the ECL contract projection.",
        ["sig_ecl_vendor_002"],
      ),
    ],
  };
}

function deferredThesis(): EnterpriseThesis {
  return {
    enterprise_story:
      "The Home narrative is deferred until verified chapter claims are available.",
    enterprise_story_claims: [],
    value_creation_model: {
      summary:
        "The value-creation narrative is deferred until verified chapter claims are available.",
      primary_value_drivers: [],
      economic_dependencies: [],
    },
    strategic_bets: [],
    structural_constraints: [],
    operating_tensions: [],
    leadership_consensus: [],
    leadership_disagreements: [],
    performance_story: {
      where_improving: [],
      where_off_track: [],
      where_unknown: [],
    },
    technology_and_data_implications: [],
    material_risks: [],
    value_realization_tensions: [],
    what_needs_attention: [],
    evidence_gaps: [],
    things_a_new_cxo_should_know: [],
    questions_for_management: [],
    visual_opportunities: [],
  };
}

function hasPublishedChapterClaims(
  claims: Map<ChapterId, GroundedClaim[]>,
): boolean {
  return Array.from(claims.values()).some(
    (pageClaims) => pageClaims.length > 0,
  );
}

function buildDeferredChapters(): ChapterView[] {
  return CHAPTER_DEFS.map((definition) => ({
    chapterId: definition.id,
    title: definition.title,
    guidingQuestion: definition.guidingQuestion,
    headline: `${definition.title} is deferred pending verified claims`,
    executive_synthesis:
      "No statements citing this chapter's records have been published, so the chapter asserts nothing.",
    key_insights: [],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [
      "Which records and interviews should this chapter be built from?",
    ],
    visual_opportunities: [],
    limitations: [
      "Counts alone do not carry a conclusion. Nothing is asserted for this chapter until statements citing its own records are published.",
    ],
  }));
}

function buildPublishedChapters(
  rows: HomeProjectionRow[],
  claims: Map<ChapterId, GroundedClaim[]>,
): ChapterView[] {
  const summaries = chapterSummaryRows(rows);
  return CHAPTER_DEFS.map((definition) => {
    const summaryRow = summaries.get(definition.id);
    if (!summaryRow)
      throw new Error(
        `Home ECL preview: missing published summary row for ${definition.id}.`,
      );
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
              visual(
                "application_landscape_by_function",
                "Applications grouped by business function",
                "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.",
                ["sig_ecl_estate_001"],
              ),
              visual(
                "vendor_spend_concentration",
                "Supplier concentration in loaded contract value",
                "Commercial concentration is now visible in the ECL contract projection.",
                ["sig_ecl_vendor_002"],
              ),
            ]
          : definition.id === "executive_brief"
            ? [
                visual(
                  "application_landscape_by_function",
                  "Applications grouped by business function",
                  "The loaded ECL estate is function-segmented, not a 306-row legacy snapshot.",
                  ["sig_ecl_estate_001"],
                ),
              ]
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
  const signalPacket = buildEclSignalPacket(
    rows,
    technologyEstate,
    assessmentId,
  );
  const claims = chapterClaimsByPage(rows);
  const thesis = publishedThesisFromRows(rows);
  const chapters = hasPublishedChapterClaims(claims)
    ? buildPublishedChapters(rows, claims)
    : buildDeferredChapters();
  const executiveStoryPlan = storyPlanFromRows(
    base.tenantKey,
    assessmentId,
    rows,
    claims,
  );
  return normalizeHomeReviewBundle({
    tenantKey: base.tenantKey,
    provenance: {
      ...base.provenance,
      home_synthesis_contract_version: `${base.provenance.home_synthesis_contract_version}+ecl-projection-v1`,
      model: "deterministic-ecl-projection",
      canonical_snapshot_hash: `ecl:${assessmentId}:serving.home_*:${rows.length}`,
    },
    chapters,
    executiveStoryPlan,
    thesis: {
      signalPacket,
      publishedGeneration: thesis,
      verificationLedger: [],
      structuralIssues: [],
    },
    technologyEstate,
  });
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
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_metrics_outcomes
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_risks_controls
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_programs_initiatives
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_org_ownership
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_ai_use_cases
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_executive_interviews
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_relationships
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_business_unit_profile
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_data_maturity
      where tenant_key = $1 and assessment_id = $2
      union all
      select page_key, row_key, row_type, title, summary, payload_json as display_payload_json
      from serving.home_kpi_register
      where tenant_key = $1 and assessment_id = $2
      order by page_key, row_key
    `,
    [tenantKey, assessmentId],
    { missingTable: "empty" },
  );
}

export async function getHomeEclProjectionBundle(
  tenantKey: HomePreviewTenantKey,
): Promise<HomeReviewBundle> {
  const base = getHomeReviewBundle(tenantKey);
  if (!base) {
    throw new Error(
      `Home ECL preview: missing base deterministic bundle for ${tenantKey}.`,
    );
  }

  const assessmentId = denseAssessmentIdForTenant(tenantKey);
  const rows = await readHomeProjectionRows(tenantKey, assessmentId);
  if (rows.length === 0) {
    throw new Error(
      `Home ECL preview: no serving Home rows for ${tenantKey}/${assessmentId}.`,
    );
  }

  return {
    ...buildHomeReviewBundleFromEclProjectionRows(base, rows, assessmentId),
  };
}

export async function getHomeEclProjectionBundleOrReviewedSnapshot(
  tenantKey: HomePreviewTenantKey,
): Promise<HomeReviewBundle> {
  const base = getHomeReviewBundle(tenantKey);
  if (!base) {
    throw new Error(
      `Home ECL preview: missing base deterministic bundle for ${tenantKey}.`,
    );
  }

  try {
    return await getHomeEclProjectionBundle(tenantKey);
  } catch (error) {
    console.warn(
      `[home] ECL projection unavailable for ${tenantKey}; rendering reviewed Home snapshot.`,
      error,
    );
    return base;
  }
}

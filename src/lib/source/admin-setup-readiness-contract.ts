import { SOURCE_GOLDEN_EVENT_IDS } from './constants';
import type {
  SourceClientItContextSnapshot,
  SourceSetupDataLayerReference,
} from './agent-context';
import type {
  SourceDataReadinessItem,
  SourceDataReadinessState,
  SourceDataRequirementLevel,
  SourceEvidenceUsability,
  SourceStageKey,
  ValueConfidence,
} from './types';

export const SOURCE_ADMIN_SETUP_READINESS_CONTRACT_VERSION =
  'source-admin-setup-readiness-contract/v1';

export type SourceAdminSetupReadinessAccessState =
  | 'allowed'
  | 'restricted'
  | 'pending_approval'
  | 'not_applicable';

export type SourceAdminSetupReadinessSourceType =
  | 'system'
  | 'file'
  | 'manual_request'
  | 'repository'
  | 'derived'
  | 'unknown';

export type SourceAdminSetupHandoffTarget =
  | 'admin_setup'
  | 'data_owner'
  | 'procurement'
  | 'legal'
  | 'security'
  | 'operations'
  | 'waiver_owner';

export type SourceReadinessFreshnessStatus =
  | 'current'
  | 'aging'
  | 'stale'
  | 'unknown';

export interface SourceAdminSetupReadinessWaiver {
  owner: string;
  reason: string;
  approvedAt: string;
  downstreamImpact: string;
}

export interface SourceAdminSetupReadinessRecord {
  recordId: string;
  tenantId: string;
  datasetId: string;
  datasetDomain: string;
  categoryKey: string;
  categoryLabel: string;
  readinessState: SourceDataReadinessState;
  evidenceUsability: SourceEvidenceUsability;
  ownerName: string;
  ownerRole: string;
  sourceSystem: string;
  sourceType: SourceAdminSetupReadinessSourceType;
  lastUpdated: string | null;
  confidence: ValueConfidence;
  accessState: SourceAdminSetupReadinessAccessState;
  freshnessStatus: SourceReadinessFreshnessStatus;
  provenance: string;
  waiver?: SourceAdminSetupReadinessWaiver;
}

export interface SourceEventDataRequirement {
  eventId: string;
  categoryKey: string;
  categoryLabel: string;
  requirementLevel: SourceDataRequirementLevel;
  requiredStages: SourceStageKey[];
  datasetDomain: string;
  defaultOwnerRole: string;
  workflowImpact: string;
  agentRecommendation: string;
  handoffTarget: SourceAdminSetupHandoffTarget;
  rfpTierImpact: 'rich_blocker' | 'outline_caveat' | 'stub_only' | 'no_impact';
  stageGateImpact: 'blocks_current_stage' | 'creates_caveat' | 'watch_only' | 'none';
  scorecardImpact: 'blocks_defaulting' | 'lowers_confidence' | 'none';
  pricingImpact: 'blocks_normalization' | 'requires_caveat' | 'none';
  valueImpact: 'lowers_confidence' | 'none';
}

export interface SourceDataReadinessProgressSummary {
  contractVersion: typeof SOURCE_ADMIN_SETUP_READINESS_CONTRACT_VERSION;
  eventId: string;
  generatedFrom: 'admin_setup_contract_seed';
  totalItems: number;
  requiredItems: number;
  recommendedItems: number;
  optionalItems: number;
  usableEvidenceItems: number;
  missingRequiredItems: number;
  cautionItems: number;
  readinessPercent: number;
  usableEvidencePercent: number;
  progressLabel: string;
  progressBasis: string;
  blockers: string[];
  defers: string[];
}

export interface SourceDataReadinessProjection {
  eventId: string;
  contractVersion: typeof SOURCE_ADMIN_SETUP_READINESS_CONTRACT_VERSION;
  generatedFrom: 'admin_setup_contract_seed';
  items: SourceDataReadinessItem[];
  summary: SourceDataReadinessProgressSummary;
}

export interface BuildSourceDataReadinessProjectionInput {
  eventId: string;
  requirements?: SourceEventDataRequirement[];
  platformRecords?: SourceAdminSetupReadinessRecord[];
}

const DEFAULT_TENANT_ID = 'tenant-source-seed';

export function buildSourceDataReadinessProjectionFromAdminSetup(
  input: BuildSourceDataReadinessProjectionInput,
): SourceDataReadinessProjection {
  const requirements = input.requirements ?? getSourceEventDataRequirements(input.eventId);
  const platformRecords = input.platformRecords
    ?? getSeededAdminSetupReadinessRecordsForSourceEvent(input.eventId);
  const recordByCategory = new Map(platformRecords.map((record) => [record.categoryKey, record]));
  const items = requirements.map((requirement) => (
    mapAdminSetupReadinessToSourceItem({
      requirement,
      record: recordByCategory.get(requirement.categoryKey),
    })
  ));

  return {
    eventId: input.eventId,
    contractVersion: SOURCE_ADMIN_SETUP_READINESS_CONTRACT_VERSION,
    generatedFrom: 'admin_setup_contract_seed',
    items,
    summary: summarizeSourceDataReadinessProgress(input.eventId, items),
  };
}

export function mapAdminSetupReadinessToSourceItem(input: {
  requirement: SourceEventDataRequirement;
  record?: SourceAdminSetupReadinessRecord;
}): SourceDataReadinessItem {
  const { requirement, record } = input;
  const readinessState = record?.readinessState ?? 'Missing';
  const evidenceUsability = record?.evidenceUsability ?? 'not_available';
  const owner = record ? `${record.ownerName} (${record.ownerRole})` : requirement.defaultOwnerRole;
  const sourceSystemOrFile = record?.sourceSystem ?? 'Admin/Setup readiness request';

  return {
    id: `source-data-contract:${requirement.eventId}:${requirement.categoryKey}`,
    category: requirement.categoryLabel,
    requirementLevel: requirement.requirementLevel,
    readinessState,
    evidenceUsability,
    owner,
    sourceSystemOrFile,
    lastUpdated: record?.lastUpdated ?? null,
    confidence: record?.confidence ?? 'low',
    workflowImpact: getWorkflowImpact(requirement, readinessState, evidenceUsability),
    agentRecommendation: getAgentRecommendation(requirement, readinessState, evidenceUsability),
    stewardAdminHandoffLabel: getHandoffLabel(requirement, record),
  };
}

export function summarizeSourceDataReadinessProgress(
  eventId: string,
  items: SourceDataReadinessItem[],
): SourceDataReadinessProgressSummary {
  const totalWeight = items.reduce((total, item) => total + requirementWeight(item.requirementLevel), 0);
  const weightedScore = items.reduce((total, item) => (
    total + readinessScore(item) * requirementWeight(item.requirementLevel)
  ), 0);
  const readinessPercent = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const usableEvidenceItems = items.filter((item) => item.evidenceUsability === 'usable').length;
  const usableEvidencePercent = items.length > 0
    ? Math.round((usableEvidenceItems / items.length) * 100)
    : 0;
  const missingRequired = items.filter((item) => (
    item.requirementLevel === 'required' && item.evidenceUsability === 'not_available'
  ));
  const cautionItems = items.filter((item) => (
    item.evidenceUsability === 'loaded_not_usable'
    || item.evidenceUsability === 'available_not_validated'
    || item.evidenceUsability === 'low_confidence'
    || item.evidenceUsability === 'restricted'
  ));

  return {
    contractVersion: SOURCE_ADMIN_SETUP_READINESS_CONTRACT_VERSION,
    eventId,
    generatedFrom: 'admin_setup_contract_seed',
    totalItems: items.length,
    requiredItems: items.filter((item) => item.requirementLevel === 'required').length,
    recommendedItems: items.filter((item) => item.requirementLevel === 'recommended').length,
    optionalItems: items.filter((item) => item.requirementLevel === 'optional').length,
    usableEvidenceItems,
    missingRequiredItems: missingRequired.length,
    cautionItems: cautionItems.length,
    readinessPercent,
    usableEvidencePercent,
    progressLabel: `${readinessPercent}% toward event data readiness`,
    progressBasis: 'Weighted by requirement level and evidence usability. Seeded contract only; not live monitoring.',
    blockers: missingRequired.map((item) => `${item.category}: ${item.workflowImpact}`),
    defers: cautionItems.map((item) => `${item.category}: ${item.evidenceUsability}`),
  };
}

export function getSourceEventDataRequirements(eventId: string): SourceEventDataRequirement[] {
  if (eventId !== SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) {
    return [];
  }

  return DATA_AI_MODERNIZATION_REQUIREMENTS.map((requirement) => ({ ...requirement }));
}

export function getSeededAdminSetupReadinessRecordsForSourceEvent(
  eventId: string,
): SourceAdminSetupReadinessRecord[] {
  if (eventId !== SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) {
    return [];
  }

  return DATA_AI_MODERNIZATION_ADMIN_SETUP_RECORDS.map((record) => ({ ...record }));
}

export function getSourceTechnologySourcingContextFromSetupSeed(
  eventId: string,
): SourceClientItContextSnapshot | null {
  if (eventId !== SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026) {
    return null;
  }

  return cloneSourceClientItContext(APEX_RETAIL_TECHNOLOGY_SOURCING_CONTEXT);
}

function getWorkflowImpact(
  requirement: SourceEventDataRequirement,
  readinessState: SourceDataReadinessState,
  evidenceUsability: SourceEvidenceUsability,
): string {
  if (evidenceUsability === 'usable') {
    return requirement.workflowImpact;
  }

  if (evidenceUsability === 'loaded_not_usable') {
    return 'Loaded in Admin/Setup, but not usable evidence until parsing and validation complete.';
  }

  if (evidenceUsability === 'available_not_validated') {
    return 'Available to Source, but not validated enough for confident claims or decisions.';
  }

  if (evidenceUsability === 'low_confidence') {
    return 'Evidence exists, but confidence is too low for approval-grade Source language.';
  }

  if (evidenceUsability === 'restricted') {
    return 'Evidence exists, but access restrictions prevent Source agents from using it.';
  }

  if (readinessState === 'Waived' || evidenceUsability === 'waived') {
    return 'Gap is waived; Source must show waiver owner, reason, and downstream impact.';
  }

  return requirement.workflowImpact;
}

function getAgentRecommendation(
  requirement: SourceEventDataRequirement,
  readinessState: SourceDataReadinessState,
  evidenceUsability: SourceEvidenceUsability,
): string {
  if (evidenceUsability === 'usable') return requirement.agentRecommendation;
  if (evidenceUsability === 'loaded_not_usable') {
    return 'Sentinel should keep this out of citations until Admin/Setup marks it usable evidence.';
  }
  if (evidenceUsability === 'available_not_validated' || evidenceUsability === 'low_confidence') {
    return 'Sentinel should flag low evidence confidence and Nexus should caveat downstream outputs.';
  }
  if (evidenceUsability === 'restricted') {
    return 'Steward should route an access review before Source uses this data.';
  }
  if (readinessState === 'Waived' || evidenceUsability === 'waived') {
    return 'Steward should preserve the waiver rationale and Nexus should explain downstream caveats.';
  }

  return requirement.agentRecommendation;
}

function getHandoffLabel(
  requirement: SourceEventDataRequirement,
  record?: SourceAdminSetupReadinessRecord,
): string {
  if (record?.waiver) return `Waived by ${record.waiver.owner}`;
  if (record?.accessState === 'restricted' || record?.accessState === 'pending_approval') {
    return 'Steward to access owner';
  }

  const labelByTarget: Record<SourceAdminSetupHandoffTarget, string> = {
    admin_setup: 'Steward to Admin/Setup intake',
    data_owner: 'Steward to data owner',
    procurement: 'Steward to procurement owner',
    legal: 'Steward to legal owner',
    security: 'Steward to security owner',
    operations: 'Steward to operations owner',
    waiver_owner: 'Steward to waiver owner',
  };

  return labelByTarget[requirement.handoffTarget];
}

function readinessScore(item: SourceDataReadinessItem): number {
  if (item.readinessState === 'Not Applicable') return 1;
  if (item.readinessState === 'Waived' || item.evidenceUsability === 'waived') return 0.5;

  const scores: Record<SourceEvidenceUsability, number> = {
    not_available: 0,
    loaded_not_usable: 0.4,
    available_not_validated: 0.65,
    usable: 1,
    low_confidence: 0.45,
    restricted: 0.2,
    waived: 0.5,
  };

  return scores[item.evidenceUsability];
}

function requirementWeight(level: SourceDataRequirementLevel): number {
  if (level === 'required') return 3;
  if (level === 'recommended') return 2;
  return 1;
}

const DATA_AI_EVENT_ID = SOURCE_GOLDEN_EVENT_IDS.dataAiModernization;

const DATA_AI_MODERNIZATION_REQUIREMENTS: SourceEventDataRequirement[] = [
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'application_inventory',
    categoryLabel: 'Application Inventory',
    requirementLevel: 'required',
    requiredStages: ['scope', 'rfp_rfi_package'],
    datasetDomain: 'application_portfolio',
    defaultOwnerRole: 'Client PMO Lead',
    workflowImpact: 'Can support Scope framing and RFP application portfolio language.',
    agentRecommendation: 'Nexus can use this as scope evidence, but should still caveat workload sizing.',
    handoffTarget: 'admin_setup',
    rfpTierImpact: 'outline_caveat',
    stageGateImpact: 'creates_caveat',
    scorecardImpact: 'none',
    pricingImpact: 'requires_caveat',
    valueImpact: 'none',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'workload_baseline',
    categoryLabel: 'Workload Baseline',
    requirementLevel: 'required',
    requiredStages: ['scope'],
    datasetDomain: 'analytics_workload_baseline',
    defaultOwnerRole: 'Data Platform Lead',
    workflowImpact: 'Blocks Rich-tier Scope and makes pricing normalization unsafe.',
    agentRecommendation: 'Nexus should request workload volumes before strategy design expands.',
    handoffTarget: 'data_owner',
    rfpTierImpact: 'rich_blocker',
    stageGateImpact: 'blocks_current_stage',
    scorecardImpact: 'lowers_confidence',
    pricingImpact: 'blocks_normalization',
    valueImpact: 'lowers_confidence',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'ticket_history',
    categoryLabel: 'Ticket History',
    requirementLevel: 'recommended',
    requiredStages: ['scope', 'sourcing_strategy'],
    datasetDomain: 'service_management',
    defaultOwnerRole: 'Service Management Lead',
    workflowImpact: 'Limits support sizing and weakens vendor run-cost comparison.',
    agentRecommendation: 'Nexus should include ticket history in the minimum data request.',
    handoffTarget: 'admin_setup',
    rfpTierImpact: 'outline_caveat',
    stageGateImpact: 'creates_caveat',
    scorecardImpact: 'lowers_confidence',
    pricingImpact: 'requires_caveat',
    valueImpact: 'lowers_confidence',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'vendor_spend',
    categoryLabel: 'Vendor Spend',
    requirementLevel: 'required',
    requiredStages: ['scope', 'sourcing_strategy'],
    datasetDomain: 'finance_cost_baseline',
    defaultOwnerRole: 'Procurement Lead',
    workflowImpact: 'Supports directional value framing but should not be treated as validated baseline.',
    agentRecommendation: 'Sentinel should keep spend claims caveated until evidence is validated.',
    handoffTarget: 'procurement',
    rfpTierImpact: 'outline_caveat',
    stageGateImpact: 'creates_caveat',
    scorecardImpact: 'lowers_confidence',
    pricingImpact: 'requires_caveat',
    valueImpact: 'lowers_confidence',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'sla_baseline',
    categoryLabel: 'SLA Baseline',
    requirementLevel: 'recommended',
    requiredStages: ['sourcing_strategy', 'rfp_rfi_package'],
    datasetDomain: 'service_level_baseline',
    defaultOwnerRole: 'Operations Lead',
    workflowImpact: 'Prevents confident service-level requirements and transition risk sizing.',
    agentRecommendation: 'Nexus should request current SLA performance before RFP release.',
    handoffTarget: 'operations',
    rfpTierImpact: 'outline_caveat',
    stageGateImpact: 'creates_caveat',
    scorecardImpact: 'lowers_confidence',
    pricingImpact: 'none',
    valueImpact: 'lowers_confidence',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'vendor_contracts',
    categoryLabel: 'Vendor Contracts',
    requirementLevel: 'recommended',
    requiredStages: ['sourcing_strategy', 'rfp_rfi_package'],
    datasetDomain: 'contract_repository',
    defaultOwnerRole: 'Legal / Procurement',
    workflowImpact: 'Shows contract presence, but exclusions and termination terms are not citeable yet.',
    agentRecommendation: 'Sentinel should not cite contract terms until parsing and validation complete.',
    handoffTarget: 'legal',
    rfpTierImpact: 'outline_caveat',
    stageGateImpact: 'creates_caveat',
    scorecardImpact: 'none',
    pricingImpact: 'requires_caveat',
    valueImpact: 'none',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'security_compliance',
    categoryLabel: 'Security / Compliance Requirements',
    requirementLevel: 'required',
    requiredStages: ['scope', 'rfp_rfi_package'],
    datasetDomain: 'security_compliance',
    defaultOwnerRole: 'Security Lead',
    workflowImpact: 'Security requirements can be outlined, but approval-grade language needs validation.',
    agentRecommendation: 'Steward should route security requirements back for owner confirmation.',
    handoffTarget: 'security',
    rfpTierImpact: 'outline_caveat',
    stageGateImpact: 'creates_caveat',
    scorecardImpact: 'lowers_confidence',
    pricingImpact: 'none',
    valueImpact: 'lowers_confidence',
  },
  {
    eventId: DATA_AI_EVENT_ID,
    categoryKey: 'retained_roles',
    categoryLabel: 'Retained Roles',
    requirementLevel: 'required',
    requiredStages: ['scope'],
    datasetDomain: 'organization_ownership',
    defaultOwnerRole: 'Client PMO Lead',
    workflowImpact: 'Blocks clear scope split and transition responsibility language.',
    agentRecommendation: 'Nexus should ask the client to confirm retained roles before RFP drafting.',
    handoffTarget: 'data_owner',
    rfpTierImpact: 'rich_blocker',
    stageGateImpact: 'blocks_current_stage',
    scorecardImpact: 'lowers_confidence',
    pricingImpact: 'none',
    valueImpact: 'lowers_confidence',
  },
];

const DATA_AI_MODERNIZATION_ADMIN_SETUP_RECORDS: SourceAdminSetupReadinessRecord[] = [
  {
    recordId: 'admin-source-readiness-application-inventory',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-application-inventory',
    datasetDomain: 'application_portfolio',
    categoryKey: 'application_inventory',
    categoryLabel: 'Application Inventory',
    readinessState: 'Usable Evidence',
    evidenceUsability: 'usable',
    ownerName: 'Client PMO Lead',
    ownerRole: 'Portfolio owner',
    sourceSystem: 'Application inventory workbook',
    sourceType: 'file',
    lastUpdated: '2026-04-24',
    confidence: 'high',
    accessState: 'allowed',
    freshnessStatus: 'current',
    provenance: 'Seeded Admin/Setup readiness contract fixture.',
  },
  {
    recordId: 'admin-source-readiness-workload-baseline',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-workload-baseline',
    datasetDomain: 'analytics_workload_baseline',
    categoryKey: 'workload_baseline',
    categoryLabel: 'Workload Baseline',
    readinessState: 'Requested',
    evidenceUsability: 'not_available',
    ownerName: 'Data Platform Lead',
    ownerRole: 'Data owner',
    sourceSystem: 'Minimum data request',
    sourceType: 'manual_request',
    lastUpdated: null,
    confidence: 'low',
    accessState: 'allowed',
    freshnessStatus: 'unknown',
    provenance: 'Seeded Admin/Setup readiness request.',
  },
  {
    recordId: 'admin-source-readiness-ticket-history',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-ticket-history',
    datasetDomain: 'service_management',
    categoryKey: 'ticket_history',
    categoryLabel: 'Ticket History',
    readinessState: 'Missing',
    evidenceUsability: 'not_available',
    ownerName: 'Service Management Lead',
    ownerRole: 'Data owner',
    sourceSystem: 'ITSM export',
    sourceType: 'system',
    lastUpdated: null,
    confidence: 'low',
    accessState: 'allowed',
    freshnessStatus: 'unknown',
    provenance: 'Seeded missing platform readiness record.',
  },
  {
    recordId: 'admin-source-readiness-vendor-spend',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-vendor-spend',
    datasetDomain: 'finance_cost_baseline',
    categoryKey: 'vendor_spend',
    categoryLabel: 'Vendor Spend',
    readinessState: 'Available',
    evidenceUsability: 'available_not_validated',
    ownerName: 'Procurement Lead',
    ownerRole: 'Procurement owner',
    sourceSystem: 'Spend cube extract',
    sourceType: 'system',
    lastUpdated: '2026-04-23',
    confidence: 'medium',
    accessState: 'allowed',
    freshnessStatus: 'current',
    provenance: 'Seeded available-not-validated platform readiness record.',
  },
  {
    recordId: 'admin-source-readiness-sla-baseline',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-sla-baseline',
    datasetDomain: 'service_level_baseline',
    categoryKey: 'sla_baseline',
    categoryLabel: 'SLA Baseline',
    readinessState: 'Missing',
    evidenceUsability: 'not_available',
    ownerName: 'Operations Lead',
    ownerRole: 'Operations owner',
    sourceSystem: 'Service report',
    sourceType: 'system',
    lastUpdated: null,
    confidence: 'low',
    accessState: 'allowed',
    freshnessStatus: 'unknown',
    provenance: 'Seeded missing platform readiness record.',
  },
  {
    recordId: 'admin-source-readiness-vendor-contracts',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-vendor-contracts',
    datasetDomain: 'contract_repository',
    categoryKey: 'vendor_contracts',
    categoryLabel: 'Vendor Contracts',
    readinessState: 'Loaded',
    evidenceUsability: 'loaded_not_usable',
    ownerName: 'Legal / Procurement',
    ownerRole: 'Contract owner',
    sourceSystem: 'Contract repository, parsing pending',
    sourceType: 'repository',
    lastUpdated: '2026-04-22',
    confidence: 'medium',
    accessState: 'allowed',
    freshnessStatus: 'aging',
    provenance: 'Seeded loaded-not-usable platform readiness record.',
  },
  {
    recordId: 'admin-source-readiness-security-compliance',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-security-compliance',
    datasetDomain: 'security_compliance',
    categoryKey: 'security_compliance',
    categoryLabel: 'Security / Compliance Requirements',
    readinessState: 'Low Confidence',
    evidenceUsability: 'low_confidence',
    ownerName: 'Security Lead',
    ownerRole: 'Security owner',
    sourceSystem: 'Security requirements notes',
    sourceType: 'file',
    lastUpdated: '2026-04-24',
    confidence: 'low',
    accessState: 'allowed',
    freshnessStatus: 'current',
    provenance: 'Seeded low-confidence platform readiness record.',
  },
  {
    recordId: 'admin-source-readiness-retained-roles',
    tenantId: DEFAULT_TENANT_ID,
    datasetId: 'dataset-retained-roles',
    datasetDomain: 'organization_ownership',
    categoryKey: 'retained_roles',
    categoryLabel: 'Retained Roles',
    readinessState: 'Requested',
    evidenceUsability: 'not_available',
    ownerName: 'Client PMO Lead',
    ownerRole: 'Organization owner',
    sourceSystem: 'Retained organization worksheet',
    sourceType: 'manual_request',
    lastUpdated: null,
    confidence: 'low',
    accessState: 'allowed',
    freshnessStatus: 'unknown',
    provenance: 'Seeded requested platform readiness record.',
  },
];

const setupRecordRef = (
  segmentId: string,
  recordId: string,
  sourceDoc: string,
  sourcePath: string,
  confidence: SourceSetupDataLayerReference['confidence'],
  lastReviewed = '2026-04-22',
): SourceSetupDataLayerReference => ({
  table: 'data_inventory_records',
  segmentId,
  recordId,
  sourceDoc,
  sourcePath,
  lastReviewed,
  confidence,
});

const EXECUTIVE_BENCH_REF = setupRecordRef(
  'org_structure',
  'org_structure:executive-bench',
  'executive_bench.json',
  '02_org_structure/executive_bench.json',
  'high',
);

const IT_LEADERSHIP_REF = setupRecordRef(
  'org_structure',
  'org_structure:it-leadership',
  'it_leadership.json',
  '02_org_structure/it_leadership.json',
  'high',
);

const IT_LANDSCAPE_REF = setupRecordRef(
  'it_landscape',
  'it_landscape:systems-inventory',
  'systems_inventory.csv',
  '03_it_landscape/systems_inventory.csv',
  'high',
  '2026-04-29',
);

const INTEGRATION_MAP_REF = setupRecordRef(
  'it_landscape',
  'it_landscape:integration-map',
  'integration_map.json',
  '03_it_landscape/integration_map.json',
  'high',
  '2026-04-10',
);

const AMS_BAFO_TRACKER_REF = setupRecordRef(
  'sourcing_artifacts',
  'sourcing_artifacts:ams-bafo-tracker',
  'ams_bafo_tracker.md',
  '07_sourcing_artifacts/ams_bafo_tracker.md',
  'high',
  '2026-04-25',
);

const AMS_ARB_ATTESTATION_REF = setupRecordRef(
  'program_deliverables',
  'program_deliverables:ams-arb-attestation',
  'ams_arb_attestation.md',
  '08_program_deliverables/ams_arb_attestation.md',
  'high',
  '2026-04-08',
);

const APEX_RETAIL_TECHNOLOGY_SOURCING_CONTEXT: SourceClientItContextSnapshot = {
  tenantKey: 'apex-retail',
  tenantName: 'Apex Retail Group',
  contextName: 'Apex Retail IT sourcing context',
  sourcingScope: 'technology_sourcing',
  updatedAt: '2026-04-29',
  leadership: [
    {
      roleKey: 'cio',
      roleLabel: 'CIO / AMS executive sponsor',
      personId: 'person:apex:carlos-rivera',
      name: 'Carlos Rivera',
      title: 'Chief Information Officer',
      sourcingRelevance:
        'Sponsors AMS Consolidation 2026 and owns IT cost stabilization, AMS completion, cloud migration phase 2, and AI platform readiness.',
      setupDataReferences: [EXECUTIVE_BENCH_REF, AMS_BAFO_TRACKER_REF],
    },
    {
      roleKey: 'cfo',
      roleLabel: 'CFO / value and investment authority',
      personId: 'person:apex:margaret-chen',
      name: 'Margaret Chen',
      title: 'Chief Financial Officer',
      sourcingRelevance:
        'Owns cost discipline, vendor consolidation savings, IT spend rationalization, and realized-savings scrutiny for the AMS award.',
      setupDataReferences: [EXECUTIVE_BENCH_REF, AMS_ARB_ATTESTATION_REF],
    },
    {
      roleKey: 'procurementLead',
      roleLabel: 'IT procurement lead',
      personId: 'person:apex:nathan-kohl',
      name: 'Nathan Kohl',
      title: 'VP, IT Procurement & Vendor Management',
      sourcingRelevance:
        'Leads IT vendor contracts, renewals, BAFO negotiations, and vendor risk management; named procurement lead for AMS Consolidation 2026.',
      setupDataReferences: [IT_LEADERSHIP_REF, AMS_BAFO_TRACKER_REF],
    },
    {
      roleKey: 'itOperationsLead',
      roleLabel: 'Application services / IT operations lead',
      personId: 'person:apex:diana-lopez',
      name: 'Diana Lopez',
      title: 'VP, Application Services',
      sourcingRelevance:
        'Co-leads AMS Consolidation 2026 and owns the application-services domains that define the transition and support baseline.',
      setupDataReferences: [IT_LEADERSHIP_REF, AMS_ARB_ATTESTATION_REF],
    },
  ],
  systemLandscapeSummary:
    'Setup data layer records show Apex Retail as a technology-sourcing client with a cloud-first SAP S/4HANA core, Salesforce customer platforms, Oracle Retail legacy store/POS systems, Snowflake/Databricks data platforms, ServiceNow ITSM, and mixed SaaS/on-prem operations. AMS scope should stay bounded to the 22 in-scope merchandising and supply-chain applications unless live setup data says otherwise.',
  coreSystems: [
    {
      systemId: 'sys:apex:sap-s4',
      name: 'SAP S/4HANA',
      category: 'ERP',
      ownerRole: 'Diana Lopez / Margaret Chen',
      sourcingRelevance:
        'Critical finance and inventory core with renewal leverage in 2027; AMS answers should preserve ERP boundary clarity.',
      setupDataReferences: [IT_LANDSCAPE_REF],
    },
    {
      systemId: 'sys:apex:salesforce-commerce',
      name: 'Salesforce Commerce Cloud',
      category: 'E-commerce platform',
      ownerRole: 'Priya Iyer / Jennifer Park',
      sourcingRelevance:
        'Customer-facing platform is an out-of-scope dependency for AMS cross-portfolio incidents, not a default AMS tower.',
      setupDataReferences: [IT_LANDSCAPE_REF, AMS_ARB_ATTESTATION_REF],
    },
    {
      systemId: 'sys:apex:oracle-retail-pos',
      name: 'Oracle Retail POS',
      category: 'POS',
      ownerRole: 'Acting store technology owner',
      sourcingRelevance:
        'Aging, mission-critical store system with amber transition risk; Source should mention POS transition risk rather than asking whether it exists.',
      setupDataReferences: [IT_LANDSCAPE_REF, AMS_ARB_ATTESTATION_REF],
    },
    {
      systemId: 'sys:apex:servicenow',
      name: 'ServiceNow ITSM',
      category: 'ITSM',
      ownerRole: 'Raj Patel',
      sourcingRelevance:
        'Current ITSM baseline is ServiceNow ITSM only; do not infer HR or broader ServiceNow modules without live evidence.',
      setupDataReferences: [IT_LANDSCAPE_REF, IT_LEADERSHIP_REF],
    },
    {
      systemId: 'sys:apex:snowflake',
      name: 'Snowflake Data Cloud',
      category: 'Data warehouse',
      ownerRole: 'James Wright / Lynne Stratham',
      sourcingRelevance:
        'Analytics foundation and CDP dependency; AMS vendor responsibilities should maintain application boundaries around data integrations.',
      setupDataReferences: [IT_LANDSCAPE_REF, INTEGRATION_MAP_REF],
    },
  ],
  applicationSupportBaselineHints: [
    'AMS Consolidation 2026 is scoped to 22 applications: 15 merchandising and 7 supply-chain applications.',
    'Store technology and customer-facing platforms are excluded by default, with cross-portfolio incident handoff required where dependencies exist.',
    'Per-application discovery is complete at P1/P2, but service-level values remain generic until authored with the selected vendor.',
    'Transition design expects per-application plans, named technical leads, knowledge-transfer documentation, and tier-based shadow periods.',
  ],
  serviceManagementBaselineHints: [
    'ServiceNow ITSM is the seeded service-management platform and is owned by Raj Patel in the setup data layer.',
    'ServiceNow is ITSM-only in the seeded landscape; HR or other ServiceNow modules are considered but not adopted.',
    'The selected AMS vendor should maintain the existing integration topology; legacy EDI, SAP CPI, and custom Snowflake ETL paths stay outside the AMS replacement scope.',
  ],
  disclosure: {
    contextMode: 'setup_seed_projection',
    userFacingDisclosure:
      'Using seeded Apex setup context from the Admin/Setup data layer; live tenant retrieval and recency verification are not running in this Source seed path.',
    liveOverrideRule:
      'If live setup-data retrieval is available and conflicts with this seed projection, live setup data wins and Source must disclose the conflict.',
    agentInstructions: [
      'Do not ask the user for seeded Apex leadership roles, core IT landscape, or service-management baseline facts when this context is present.',
      'Say "seeded setup context" when using these facts, and say "live setup data" only when a live retrieval path supplied the fact.',
      'Ask for confirmation only when the user asks for current/live state, when a fact conflicts with uploaded evidence, or when the required detail is not present in setup references.',
      'Keep Source answers limited to technology sourcing; route non-IT procurement questions away from this context.',
    ],
  },
  setupDataReferences: [
    EXECUTIVE_BENCH_REF,
    IT_LEADERSHIP_REF,
    IT_LANDSCAPE_REF,
    INTEGRATION_MAP_REF,
    AMS_BAFO_TRACKER_REF,
    AMS_ARB_ATTESTATION_REF,
  ],
};

function cloneSourceClientItContext(
  context: SourceClientItContextSnapshot,
): SourceClientItContextSnapshot {
  return {
    ...context,
    leadership: context.leadership.map((role) => ({
      ...role,
      setupDataReferences: role.setupDataReferences.map((reference) => ({ ...reference })),
    })),
    coreSystems: context.coreSystems.map((system) => ({
      ...system,
      setupDataReferences: system.setupDataReferences.map((reference) => ({ ...reference })),
    })),
    applicationSupportBaselineHints: [...context.applicationSupportBaselineHints],
    serviceManagementBaselineHints: [...context.serviceManagementBaselineHints],
    disclosure: {
      ...context.disclosure,
      agentInstructions: [...context.disclosure.agentInstructions],
    },
    setupDataReferences: context.setupDataReferences.map((reference) => ({ ...reference })),
  };
}

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  CanonicalDomain,
  CanonicalIngestionRecord,
  CanonicalRelationship,
  CanonicalValidationFinding,
  CanonicalValue,
  DataStatus,
  EvidenceReference,
  QualityStatus,
} from "../contracts/canonical-ingestion";
import {
  isMissingSourceValue,
  parseCsv,
} from "../source-adapters/csv-source-adapter";

export const CANONICAL_DATA_BUILD_REPORT_DIR =
  "reports/canonical-data-build/latest";
export const CANONICAL_DATA_BUILD_REGISTRY_PATH =
  "datasets/tenant-inputs/tenant-input-registry.json";
export const CANONICAL_DATA_BUILD_VERSION = "canonical-tenant-data-build/v1";

const BLOCKED_TENANT_KEYS = new Set(["northstar-clinical"]);
const PLACEHOLDER_TOKENS = new Set([
  "not_loaded",
  "not_provided",
  "not_available",
  "unknown",
  ["tb", "d"].join(""),
  "to_be_determined",
  "n_a",
  "na",
  "sample",
  "lorem_ipsum",
  "blank",
  "null",
  "synthetic_placeholder",
  "placeholder",
]);

type TemplateManifest = {
  templateSetId: string;
  templates: Array<{ file: string; required: boolean; columns: string[] }>;
};

type QualityDepthRules = {
  companySizeBands: Record<string, { minRows: Record<string, number> }>;
};

type Packet = {
  packetId: string;
  path: string;
  classification: string;
  status: string;
  note?: string;
};

type Tenant = {
  tenantKey: string;
  displayName: string;
  companySizeBand: string;
  canonicalInputRoot: string;
  packets: Packet[];
};

type Registry = {
  canonicalRoot: string;
  activeRoot: string;
  archiveRoot: string;
  universalTemplateSet: {
    templateSetId: string;
    root: string;
    manifest: string;
    qualityDepthRules: string;
  };
  activeTenants: Tenant[];
  retiredTenants: Array<{
    tenantKey: string;
    displayName: string;
    status: string;
    reason?: string;
  }>;
};

type DomainKey =
  | "enterprise_profile"
  | "business_functions"
  | "org_ownership"
  | "workforce_roles"
  | "applications_systems"
  | "data_assets_integrations"
  | "infrastructure_platforms"
  | "vendors_contracts"
  | "spend_value"
  | "programs_initiatives"
  | "ai_automation_use_cases"
  | "risks_controls"
  | "relationships"
  | "evidence_sources"
  | "metrics_outcomes"
  | "industry_context_patterns"
  | "expert_lenses"
  | "service_scope_managed_services"
  | "operational_process_evidence";

type SourceFile = {
  tenantKey: string;
  tenantDisplayName: string;
  packetId: string;
  packetPath: string;
  relativePath: string;
  repoRelativePath: string;
  absolutePath: string;
  classification: string;
  domain: DomainKey | null;
  rowCount: number;
  contentFingerprint: string;
};

type CanonicalBuildFinding = {
  tenantKey: string;
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  sourcePath?: string;
  rowNumber?: number;
  domain?: DomainKey;
  field?: string;
  value?: string;
};

type CanonicalRecordSummary = {
  tenantKey: string;
  tenantDisplayName: string;
  totalAcceptedRecords: number;
  totalQuarantinedRecords: number;
  totalSkippedRows: number;
  byDomain: Record<
    string,
    {
      sourceFiles: number;
      sourceRows: number;
      acceptedRecords: number;
      quarantinedRecords: number;
      skippedRows: number;
      duplicateNames: number;
    }
  >;
  sampleObjects: Array<{
    domain: string;
    objectType: string;
    name: string;
    sourcePath: string;
    rowNumber: number;
  }>;
};

type EnterpriseProfileBuild = {
  tenantKey: string;
  tenantDisplayName: string;
  sourceFiles: string[];
  status: "ready" | "gaps" | "missing";
  facts: {
    industry?: string;
    subIndustry?: string;
    headquarters?: string;
    revenueUsd?: string;
    employeeCount?: string;
    locations?: string[];
    leadership?: string[];
    mission?: string;
    vision?: string;
    strategy?: string[];
    businessModel?: string;
    segments?: string[];
    source?: string;
    asOf?: string;
  };
  missingFields: string[];
  sourceLineage: Array<{
    sourcePath: string;
    rowNumber: number;
    evidenceKey: string;
  }>;
};

type RelationshipCandidate = {
  tenantKey: string;
  relationshipType: string;
  sourceObjectType: string;
  sourceObjectName: string;
  targetObjectType: string;
  targetObjectName: string;
  confidence: number;
  evidenceKey: string;
  sourcePath: string;
  rowNumber: number;
};

export type CanonicalDataBuildReport = {
  generatedAt: string;
  sourceRoot: string;
  templateSetId: string;
  guardrails: {
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    homeDefaultRuntimeChanged: false;
    readsArchiveOrLegacyInputs: boolean;
    northstarExcluded: boolean;
  };
  sourcePathEnforcement: {
    canonicalRoot: string;
    activeRoot: string;
    archiveRoot: string;
    disallowedRoots: string[];
    activeFilesInspected: number;
    violations: CanonicalBuildFinding[];
  };
  archiveReadViolations: CanonicalBuildFinding[];
  tenants: Array<{
    tenantKey: string;
    displayName: string;
    companySizeBand: string;
    packets: Packet[];
    sourceFiles: SourceFile[];
  }>;
  canonicalRecordSummary: CanonicalRecordSummary[];
  evidenceAttachmentSummary: Array<{
    tenantKey: string;
    recordsWithEvidence: number;
    recordsWithoutEvidence: number;
    evidenceAttachmentCount: number;
    sourceFileCount: number;
  }>;
  relationshipCandidatesSummary: Array<{
    tenantKey: string;
    candidateCount: number;
    byType: Record<string, number>;
    gapCount: number;
    samples: RelationshipCandidate[];
  }>;
  enterpriseProfileBuild: EnterpriseProfileBuild[];
  placeholderRejectionReport: CanonicalBuildFinding[];
  tenantGaps: Record<string, CanonicalBuildFinding[]>;
  tenantQualityDepth: Array<{
    tenantKey: string;
    companySizeBand: string;
    totalSourceRows: number;
    totalAcceptedRecords: number;
    domainsMeetingDepth: number;
    domainsBelowDepth: Array<{
      domain: string;
      rows: number;
      minimumRows: number;
      gap: number;
    }>;
    qualityScore: number;
  }>;
  homeAvaReadiness: Array<{
    tenantKey: string;
    ready: boolean;
    profileReady: boolean;
    evidenceReady: boolean;
    relationshipReady: boolean;
    canonicalRecordCount: number;
    evidenceAttachmentCount: number;
    relationshipCandidateCount: number;
    caveats: string[];
    canAnswer: string[];
    mustNotClaim: string[];
  }>;
  canonicalRecords: CanonicalIngestionRecord[];
  relationshipCandidates: RelationshipCandidate[];
  findings: CanonicalBuildFinding[];
  summary: {
    tenantsProcessed: number;
    canonicalRecordsAccepted: number;
    canonicalRecordsQuarantined: number;
    evidenceAttachments: number;
    relationshipCandidates: number;
    placeholderRejections: number;
    archiveReadViolations: number;
    errorCount: number;
    inactiveOnly: true;
  };
};

const DOMAIN_CONFIG: Record<
  DomainKey,
  {
    canonicalDomain: CanonicalDomain;
    objectType: string;
    primaryFields: string[];
    nameLabel: string;
    relationshipFields?: Array<{
      field: string;
      relationshipType: string;
      targetObjectType: string;
    }>;
  }
> = {
  enterprise_profile: {
    canonicalDomain: "enterprise_structure",
    objectType: "tenant_profile",
    primaryFields: [
      "entity_name",
      "client_display_name",
      "legal_name",
      "tenant_key",
      "company_name",
    ],
    nameLabel: "entity",
  },
  business_functions: {
    canonicalDomain: "enterprise_structure",
    objectType: "business_function",
    primaryFields: ["function_name", "business_capability", "capability_name"],
    nameLabel: "function",
    relationshipFields: [
      {
        field: "parent_function",
        relationshipType: "rolls_up_to",
        targetObjectType: "business_function",
      },
      {
        field: "executive_owner",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
    ],
  },
  org_ownership: {
    canonicalDomain: "enterprise_structure",
    objectType: "org_owner",
    primaryFields: [
      "org_unit",
      "org_unit_name",
      "leader_name_or_role",
      "leader_role",
      "role_name",
      "team_name",
    ],
    nameLabel: "org owner",
    relationshipFields: [
      {
        field: "owned_functions",
        relationshipType: "owns_function",
        targetObjectType: "business_function",
      },
      {
        field: "owned_systems",
        relationshipType: "owns_system",
        targetObjectType: "application_system",
      },
      {
        field: "owned_data_domains",
        relationshipType: "owns_data_domain",
        targetObjectType: "data_domain",
      },
    ],
  },
  workforce_roles: {
    canonicalDomain: "enterprise_structure",
    objectType: "workforce_role",
    primaryFields: [
      "persona_or_role",
      "persona_name",
      "role",
      "persona",
      "role_name",
    ],
    nameLabel: "role",
    relationshipFields: [
      {
        field: "function_name",
        relationshipType: "supports_function",
        targetObjectType: "business_function",
      },
    ],
  },
  applications_systems: {
    canonicalDomain: "technology_estate",
    objectType: "application_system",
    primaryFields: ["system_name", "application_name", "app_name", "name"],
    nameLabel: "system",
    relationshipFields: [
      {
        field: "business_function",
        relationshipType: "supports_function",
        targetObjectType: "business_function",
      },
      {
        field: "business_owner",
        relationshipType: "business_owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "technology_owner",
        relationshipType: "technology_owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "vendor",
        relationshipType: "provided_by",
        targetObjectType: "vendor",
      },
      {
        field: "data_domains",
        relationshipType: "handles_data_domain",
        targetObjectType: "data_domain",
      },
      {
        field: "hosting_location",
        relationshipType: "hosted_on",
        targetObjectType: "infrastructure_platform",
      },
      {
        field: "platform_or_database",
        relationshipType: "runs_on",
        targetObjectType: "infrastructure_platform",
      },
    ],
  },
  data_assets_integrations: {
    canonicalDomain: "technology_estate",
    objectType: "data_asset_or_integration",
    primaryFields: [
      "data_asset_name",
      "integration_name",
      "edge_id",
      "asset_name",
      "data_product_name",
    ],
    nameLabel: "data asset",
    relationshipFields: [
      {
        field: "source_system",
        relationshipType: "sourced_from",
        targetObjectType: "application_system",
      },
      {
        field: "source_app_id",
        relationshipType: "sourced_from",
        targetObjectType: "application_system",
      },
      {
        field: "target_system",
        relationshipType: "feeds",
        targetObjectType: "application_system",
      },
      {
        field: "target_app_id",
        relationshipType: "feeds",
        targetObjectType: "application_system",
      },
      {
        field: "platform_or_database",
        relationshipType: "stored_on",
        targetObjectType: "infrastructure_platform",
      },
      {
        field: "data_owner",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "data_steward",
        relationshipType: "stewarded_by",
        targetObjectType: "person_or_role",
      },
    ],
  },
  infrastructure_platforms: {
    canonicalDomain: "technology_estate",
    objectType: "infrastructure_platform",
    primaryFields: [
      "platform_name",
      "estate_item_name",
      "asset_name",
      "platform",
      "data_center_or_region",
      "technology_stack",
    ],
    nameLabel: "platform",
    relationshipFields: [
      {
        field: "operational_owner",
        relationshipType: "operated_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "owner",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
    ],
  },
  vendors_contracts: {
    canonicalDomain: "vendor_commercial_estate",
    objectType: "vendor_contract",
    primaryFields: ["vendor_name", "contract_name", "supplier_name"],
    nameLabel: "vendor",
    relationshipFields: [
      {
        field: "supported_systems",
        relationshipType: "supports_system",
        targetObjectType: "application_system",
      },
      {
        field: "supported_functions",
        relationshipType: "supports_function",
        targetObjectType: "business_function",
      },
      {
        field: "business_owner",
        relationshipType: "business_owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "contract_owner",
        relationshipType: "contract_owned_by",
        targetObjectType: "person_or_role",
      },
    ],
  },
  spend_value: {
    canonicalDomain: "financial_value",
    objectType: "spend_value_fact",
    primaryFields: [
      "spend_category",
      "spend_id",
      "cost_center_or_owner",
      "value_driver",
      "metric_name",
    ],
    nameLabel: "spend category",
    relationshipFields: [
      {
        field: "cost_center_or_owner",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "value_driver",
        relationshipType: "drives_value",
        targetObjectType: "value_driver",
      },
    ],
  },
  programs_initiatives: {
    canonicalDomain: "transformation_ai_portfolio",
    objectType: "program_initiative",
    primaryFields: [
      "program_name",
      "program_id",
      "initiative_name",
      "priority_name",
    ],
    nameLabel: "program",
    relationshipFields: [
      {
        field: "business_sponsor",
        relationshipType: "sponsored_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "technology_owner",
        relationshipType: "technology_owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "business_function",
        relationshipType: "changes_function",
        targetObjectType: "business_function",
      },
      {
        field: "target_outcomes",
        relationshipType: "targets_metric",
        targetObjectType: "metric",
      },
      {
        field: "dependencies",
        relationshipType: "depends_on",
        targetObjectType: "dependency",
      },
    ],
  },
  ai_automation_use_cases: {
    canonicalDomain: "transformation_ai_portfolio",
    objectType: "ai_automation_use_case",
    primaryFields: [
      "use_case_name",
      "use_case",
      "initiative_name",
      "ai_initiative",
      "tool_name",
    ],
    nameLabel: "AI use case",
    relationshipFields: [
      {
        field: "business_function",
        relationshipType: "automates_function",
        targetObjectType: "business_function",
      },
      {
        field: "dependent_systems",
        relationshipType: "depends_on_system",
        targetObjectType: "application_system",
      },
      {
        field: "data_domains",
        relationshipType: "uses_data_domain",
        targetObjectType: "data_domain",
      },
    ],
  },
  risks_controls: {
    canonicalDomain: "risk_control_governance",
    objectType: "risk_or_control",
    primaryFields: [
      "risk_or_control_name",
      "process_control_name",
      "risk_name",
      "control_name",
      "control",
      "risk",
      "process",
    ],
    nameLabel: "risk/control",
    relationshipFields: [
      {
        field: "linked_control",
        relationshipType: "mitigated_by",
        targetObjectType: "control",
      },
      {
        field: "control_owner",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "affected_systems",
        relationshipType: "affects_system",
        targetObjectType: "application_system",
      },
    ],
  },
  relationships: {
    canonicalDomain: "memory_learning",
    objectType: "relationship_source_row",
    primaryFields: [
      "source_name",
      "from_entity",
      "source_object",
      "relationship_id",
      "edge_id",
    ],
    nameLabel: "relationship",
  },
  evidence_sources: {
    canonicalDomain: "intelligence_answering",
    objectType: "evidence_source",
    primaryFields: [
      "evidence_id",
      "source_artifact_label",
      "source_artifact_uri",
      "source_file",
      "document_name",
      "title",
    ],
    nameLabel: "evidence",
  },
  metrics_outcomes: {
    canonicalDomain: "tower_outcomes",
    objectType: "metric_outcome",
    primaryFields: [
      "metric_name",
      "kpi_name",
      "outcome_name",
      "team_id",
      "sla_id",
      "metric",
    ],
    nameLabel: "metric",
    relationshipFields: [
      {
        field: "business_function",
        relationshipType: "measures_function",
        targetObjectType: "business_function",
      },
      {
        field: "owner",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
      {
        field: "owner_role",
        relationshipType: "owned_by",
        targetObjectType: "person_or_role",
      },
    ],
  },
  industry_context_patterns: {
    canonicalDomain: "intelligence_answering",
    objectType: "industry_context_pattern",
    primaryFields: [
      "pattern_name",
      "industry_pattern",
      "theme",
      "market_pattern_id",
    ],
    nameLabel: "pattern",
  },
  expert_lenses: {
    canonicalDomain: "intelligence_answering",
    objectType: "expert_lens",
    primaryFields: ["lens_name", "expert_lens_name", "expert_lens", "role"],
    nameLabel: "expert lens",
  },
  service_scope_managed_services: {
    canonicalDomain: "sourcing_procurement",
    objectType: "managed_service_scope",
    primaryFields: [
      "service_tower",
      "service_scope",
      "service_name",
      "tower_name",
    ],
    nameLabel: "service scope",
    relationshipFields: [
      {
        field: "supported_functions",
        relationshipType: "supports_function",
        targetObjectType: "business_function",
      },
      {
        field: "supported_systems",
        relationshipType: "supports_system",
        targetObjectType: "application_system",
      },
    ],
  },
  operational_process_evidence: {
    canonicalDomain: "moves_execution",
    objectType: "operational_process_evidence",
    primaryFields: [
      "process_name",
      "process",
      "process_id",
      "incident_id",
      "evidence_name",
      "event_name",
      "case_id",
    ],
    nameLabel: "process evidence",
    relationshipFields: [
      {
        field: "related_systems",
        relationshipType: "uses_system",
        targetObjectType: "application_system",
      },
      {
        field: "system_id",
        relationshipType: "uses_system",
        targetObjectType: "application_system",
      },
      {
        field: "business_function",
        relationshipType: "evidences_function",
        targetObjectType: "business_function",
      },
    ],
  },
};

const DOMAIN_MATCHERS: Array<{ domain: DomainKey; patterns: RegExp[] }> = [
  {
    domain: "enterprise_profile",
    patterns: [/enterprise[_-]profile/i, /portfolio[_-]entity[_-]registry/i],
  },
  {
    domain: "business_functions",
    patterns: [/business[_-]functions/i, /business[_-]capabilities/i],
  },
  {
    domain: "org_ownership",
    patterns: [/org[_-]ownership/i, /org[_-]roles/i, /team[_-]topology/i],
  },
  {
    domain: "workforce_roles",
    patterns: [/workforce[_-](roles|personas)/i, /personas/i],
  },
  {
    domain: "applications_systems",
    patterns: [
      /applications[_-]systems/i,
      /application[_-]portfolio/i,
      /apps?[_-]systems?/i,
    ],
  },
  {
    domain: "data_assets_integrations",
    patterns: [
      /data[_-]assets?[_-]integrations?/i,
      /integration[_-]topology/i,
      /data[_-]inventory/i,
    ],
  },
  {
    domain: "infrastructure_platforms",
    patterns: [/infrastructure/i, /cloud[_-]estate/i, /data[_-]center/i],
  },
  {
    domain: "vendors_contracts",
    patterns: [/vendors?[_-]contracts?/i, /vendor[_-]contracts?/i],
  },
  {
    domain: "spend_value",
    patterns: [
      /spend[_-]value/i,
      /it[_-]financials/i,
      /financial[_-]kpi/i,
      /rate[_-]card/i,
      /cost[_-]basis/i,
    ],
  },
  {
    domain: "programs_initiatives",
    patterns: [
      /programs?[_-]initiatives?/i,
      /(^|\/)initiatives\.csv$/i,
      /business[_-]priorities/i,
    ],
  },
  {
    domain: "ai_automation_use_cases",
    patterns: [
      /ai[_-](automation[_-])?use[_-]cases/i,
      /ai[_-]initiatives/i,
      /ai[_-]tooling/i,
    ],
  },
  {
    domain: "risks_controls",
    patterns: [
      /risks?[_-]controls?/i,
      /operations[_-]risk[_-]controls/i,
      /qms/i,
    ],
  },
  {
    domain: "relationships",
    patterns: [/relationships?/i, /graph[_-]edges?/i, /bridge/i],
  },
  {
    domain: "evidence_sources",
    patterns: [
      /evidence[_-]sources/i,
      /source[_-]evidence[_-]registry/i,
      /chunk[_-]retrieval[_-]registry/i,
    ],
  },
  {
    domain: "metrics_outcomes",
    patterns: [
      /metrics?[_-]outcomes?/i,
      /metric[_-]definitions/i,
      /dora[_-]baseline/i,
      /sla[_-]register/i,
    ],
  },
  {
    domain: "industry_context_patterns",
    patterns: [
      /industry[_-](context|corpus|market|knowledge)[_-]patterns/i,
      /market[_-]corpus/i,
    ],
  },
  { domain: "expert_lenses", patterns: [/expert[_-]lenses/i] },
  {
    domain: "service_scope_managed_services",
    patterns: [
      /service[_-](scope|tower)[_-]managed[_-]services/i,
      /managed[_-]services[_-]scope/i,
    ],
  },
  {
    domain: "operational_process_evidence",
    patterns: [
      /operational[_-]evidence/i,
      /process[_-]intelligence/i,
      /incidents/i,
    ],
  },
];

const REQUIRED_PROFILE_FIELDS = [
  "industry",
  "headquarters",
  "revenue",
  "employees",
  "locations",
  "leadership",
  "mission",
  "vision",
  "strategy",
  "businessModel",
  "segments",
  "source",
  "asOf",
] as const;

export async function buildCanonicalTenantDataReport(options: {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
  tenantKeys?: string[];
}): Promise<CanonicalDataBuildReport> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const repoRoot = options.repoRoot;
  const registry = await readJson<Registry>(
    repoRoot,
    CANONICAL_DATA_BUILD_REGISTRY_PATH,
  );
  const manifest = await readJson<TemplateManifest>(
    repoRoot,
    registry.universalTemplateSet.manifest,
  );
  const qualityRules = await readJson<QualityDepthRules>(
    repoRoot,
    registry.universalTemplateSet.qualityDepthRules,
  );
  const findings: CanonicalBuildFinding[] = [];

  const tenants = [];
  const canonicalRecords: CanonicalIngestionRecord[] = [];
  const relationshipCandidates: RelationshipCandidate[] = [];
  const placeholderRejectionReport: CanonicalBuildFinding[] = [];
  const sourcePathViolations: CanonicalBuildFinding[] = [];

  const northstarExcluded =
    !registry.activeTenants.some((tenant) =>
      BLOCKED_TENANT_KEYS.has(tenant.tenantKey),
    ) &&
    registry.retiredTenants.some((tenant) =>
      BLOCKED_TENANT_KEYS.has(tenant.tenantKey),
    );

  if (!northstarExcluded) {
    findings.push({
      tenantKey: "global",
      severity: "error",
      code: "northstar_not_retired",
      message:
        "Northstar must be absent from active tenants and explicitly retired/excluded.",
    });
  }

  for (const template of manifest.templates.filter(
    (template) => template.required,
  )) {
    const absoluteTemplate = path.resolve(
      repoRoot,
      registry.universalTemplateSet.root,
      template.file,
    );
    if (!(await exists(absoluteTemplate))) {
      findings.push({
        tenantKey: "global",
        severity: "error",
        code: "universal_template_missing",
        message: `Required universal template is missing: ${template.file}`,
      });
    }
  }

  const requestedTenantKeys = options.tenantKeys
    ? new Set(options.tenantKeys)
    : null;
  const activeTenants = requestedTenantKeys
    ? registry.activeTenants.filter((tenant) =>
        requestedTenantKeys.has(tenant.tenantKey),
      )
    : registry.activeTenants;
  if (
    requestedTenantKeys &&
    activeTenants.length !== requestedTenantKeys.size
  ) {
    const found = new Set(activeTenants.map((tenant) => tenant.tenantKey));
    const missing = [...requestedTenantKeys].filter(
      (tenantKey) => !found.has(tenantKey),
    );
    throw new Error(`Unknown or inactive tenant key(s): ${missing.join(", ")}`);
  }

  for (const tenant of activeTenants) {
    const sourceFiles = await discoverTenantSourceFiles(
      repoRoot,
      registry,
      tenant,
      findings,
      sourcePathViolations,
    );
    tenants.push({
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      companySizeBand: tenant.companySizeBand,
      packets: tenant.packets,
      sourceFiles,
    });

    for (const sourceFile of sourceFiles) {
      if (!sourceFile.domain) continue;
      const text = await fs.readFile(sourceFile.absolutePath, "utf8");
      const parsed = parseCsv(text);
      parsed.rows.forEach((row, rowIndex) => {
        const result = buildRecordFromRow({
          tenant,
          sourceFile,
          row,
          rowNumber: rowIndex + 2,
          generatedAt,
        });
        findings.push(...result.findings);
        placeholderRejectionReport.push(...result.placeholderRejections);
        if (result.record) {
          canonicalRecords.push(result.record);
          relationshipCandidates.push(
            ...relationshipCandidatesForRecord(
              result.record,
              sourceFile,
              row,
              rowIndex + 2,
            ),
          );
        }
      });
    }
  }

  const canonicalRecordSummary = summarizeCanonicalRecords(
    tenants,
    canonicalRecords,
    findings,
  );
  const evidenceAttachmentSummary = tenants.map((tenant) =>
    evidenceSummaryForTenant(tenant.tenantKey, canonicalRecords),
  );
  const relationshipCandidatesSummary = tenants.map((tenant) =>
    relationshipSummaryForTenant(
      tenant.tenantKey,
      relationshipCandidates,
      findings,
    ),
  );
  const enterpriseProfileBuild = tenants.map((tenant) =>
    profileBuildForTenant(
      tenant.tenantKey,
      tenant.displayName,
      canonicalRecords,
      findings,
    ),
  );
  const tenantGaps = Object.fromEntries(
    tenants.map((tenant) => [
      tenant.tenantKey,
      findings.filter(
        (finding) =>
          finding.tenantKey === tenant.tenantKey && finding.severity !== "info",
      ),
    ]),
  );
  const tenantQualityDepth = tenants.map((tenant) =>
    qualityDepthForTenant(tenant, canonicalRecords, qualityRules),
  );
  const homeAvaReadiness = tenants.map((tenant) =>
    readinessForTenant(
      tenant.tenantKey,
      canonicalRecords,
      relationshipCandidates,
      enterpriseProfileBuild,
      tenantQualityDepth,
      findings,
    ),
  );

  const archiveReadViolations = sourcePathViolations.filter(
    (finding) => finding.code === "archive_or_legacy_source_read",
  );
  const report: CanonicalDataBuildReport = {
    generatedAt,
    sourceRoot: registry.activeRoot,
    templateSetId: registry.universalTemplateSet.templateSetId,
    guardrails: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      homeDefaultRuntimeChanged: false,
      readsArchiveOrLegacyInputs: archiveReadViolations.length > 0,
      northstarExcluded,
    },
    sourcePathEnforcement: {
      canonicalRoot: registry.canonicalRoot,
      activeRoot: registry.activeRoot,
      archiveRoot: registry.archiveRoot,
      disallowedRoots: [
        registry.archiveRoot,
        "datasets/*-synthetic-*",
        "datasets/*upgrade-candidate* outside canonical active root",
        "Downloads",
        "/private/tmp",
      ],
      activeFilesInspected: tenants.reduce(
        (sum, tenant) => sum + tenant.sourceFiles.length,
        0,
      ),
      violations: sourcePathViolations,
    },
    archiveReadViolations,
    tenants,
    canonicalRecordSummary,
    evidenceAttachmentSummary,
    relationshipCandidatesSummary,
    enterpriseProfileBuild,
    placeholderRejectionReport,
    tenantGaps,
    tenantQualityDepth,
    homeAvaReadiness,
    canonicalRecords,
    relationshipCandidates,
    findings,
    summary: {
      tenantsProcessed: tenants.length,
      canonicalRecordsAccepted: canonicalRecords.filter(
        (record) => record.qualityStatus !== "quarantined",
      ).length,
      canonicalRecordsQuarantined: canonicalRecords.filter(
        (record) => record.qualityStatus === "quarantined",
      ).length,
      evidenceAttachments: canonicalRecords.reduce(
        (sum, record) => sum + record.evidenceReferences.length,
        0,
      ),
      relationshipCandidates: relationshipCandidates.length,
      placeholderRejections: placeholderRejectionReport.length,
      archiveReadViolations: archiveReadViolations.length,
      errorCount: findings.filter((finding) => finding.severity === "error")
        .length,
      inactiveOnly: true,
    },
  };

  if (options.outputDir) {
    await writeCanonicalTenantDataReport(repoRoot, options.outputDir, report);
  }

  return report;
}

export async function writeCanonicalTenantDataReport(
  repoRoot: string,
  outputDir: string,
  report: CanonicalDataBuildReport,
): Promise<void> {
  const absoluteOutputDir = path.resolve(repoRoot, outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "summary.md"),
    summaryMarkdown(report),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "tenant-build-index.json"),
    json(report.tenants),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "canonical-records-summary.json"),
    json(report.canonicalRecordSummary),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "evidence-attachment-summary.json"),
    json(report.evidenceAttachmentSummary),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "relationship-candidates-summary.json"),
    json(report.relationshipCandidatesSummary),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "enterprise-profile-build.json"),
    json(report.enterpriseProfileBuild),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "placeholder-rejection-report.json"),
    json(compactFindings(report.placeholderRejectionReport)),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "tenant-gaps.json"),
    json(
      Object.fromEntries(
        Object.entries(report.tenantGaps).map(([tenantKey, findings]) => [
          tenantKey,
          compactFindings(findings),
        ]),
      ),
    ),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "tenant-quality-depth.json"),
    json(report.tenantQualityDepth),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "home-ava-readiness.json"),
    json(report.homeAvaReadiness),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "source-path-enforcement.json"),
    json(report.sourcePathEnforcement),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "archive-read-violations.json"),
    json(report.archiveReadViolations),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-build-control.html"),
    controlHtml(report),
  );
}

function buildRecordFromRow(args: {
  tenant: Tenant;
  sourceFile: SourceFile;
  row: Record<string, string>;
  rowNumber: number;
  generatedAt: string;
}): {
  record: CanonicalIngestionRecord | null;
  findings: CanonicalBuildFinding[];
  placeholderRejections: CanonicalBuildFinding[];
} {
  const { tenant, sourceFile, row, rowNumber, generatedAt } = args;
  const findings: CanonicalBuildFinding[] = [];
  const placeholderRejections: CanonicalBuildFinding[] = [];
  const config = DOMAIN_CONFIG[sourceFile.domain as DomainKey];
  const primary = firstValue(row, [
    ...config.primaryFields,
    "record_name",
    "record_id",
    "entity_name",
    "entity_id",
    "name",
    "id",
  ]);
  const rowTenant = firstValue(row, ["tenant_key", "tenantKey", "client_key"]);

  if (rowTenant && !tenantKeyMatches(rowTenant, tenant)) {
    findings.push({
      tenantKey: tenant.tenantKey,
      severity: "error",
      code: "tenant_key_mismatch",
      message: `Row tenant key "${rowTenant}" does not match active tenant ${tenant.tenantKey}.`,
      sourcePath: sourceFile.repoRelativePath,
      rowNumber,
      domain: sourceFile.domain ?? undefined,
      field: "tenant_key",
      value: rowTenant,
    });
  }

  if (!primary || isPlaceholder(primary)) {
    const finding = {
      tenantKey: tenant.tenantKey,
      severity: "warning" as const,
      code: "primary_identity_missing_or_placeholder",
      message: `Row cannot become a canonical ${config.objectType} because ${config.nameLabel} identity is missing or placeholder.`,
      sourcePath: sourceFile.repoRelativePath,
      rowNumber,
      domain: sourceFile.domain ?? undefined,
      field: config.primaryFields.join("|"),
      value: primary ?? "",
    };
    findings.push(finding);
    placeholderRejections.push(finding);
    return { record: null, findings, placeholderRejections };
  }

  const evidence = evidenceFor(tenant, sourceFile, row, rowNumber, primary);
  const validationFindings: CanonicalValidationFinding[] = [];
  const attributes: Record<string, CanonicalValue> = {};

  for (const [field, value] of Object.entries(row)) {
    if (isMissingSourceValue(value) || isPlaceholder(value)) {
      if (value.trim()) {
        const finding = {
          tenantKey: tenant.tenantKey,
          severity: "warning" as const,
          code: "placeholder_value_omitted",
          message: `Placeholder value in field ${field} was omitted and recorded as a gap, not a fact.`,
          sourcePath: sourceFile.repoRelativePath,
          rowNumber,
          domain: sourceFile.domain ?? undefined,
          field,
          value,
        };
        findings.push(finding);
        placeholderRejections.push(finding);
        validationFindings.push({
          severity: "warning",
          code: "placeholder_value_omitted",
          message: finding.message,
          evidenceKey: evidence.evidenceKey,
          sourceObjectId: normalizeIdentifier(primary),
        });
      }
      continue;
    }
    attributes[toAttributeName(field)] = canonicalValue(value);
  }

  attributes.displayName = {
    value: primary,
    valueType: "string",
    confidence: 0.9,
  };
  attributes.sourcePath = {
    value: sourceFile.repoRelativePath,
    valueType: "string",
    confidence: 1,
  };
  attributes.sourceRowNumber = {
    value: rowNumber,
    valueType: "number",
    confidence: 1,
  };

  const sourceObjectId = `${sourceFile.domain}:${normalizeIdentifier(primary)}:${rowNumber}`;
  const relationships = relationshipCandidatesForRow(
    sourceFile.domain as DomainKey,
    primary,
    row,
    evidence,
  ).map(
    (candidate): CanonicalRelationship => ({
      relationshipType: candidate.relationshipType,
      targetObjectType: candidate.targetObjectType,
      targetObjectKey: `${tenant.tenantKey}:${candidate.targetObjectType}:${normalizeIdentifier(candidate.targetObjectName)}`,
      evidenceReferences: [evidence],
      confidence: candidate.confidence,
    }),
  );

  const qualityStatus: QualityStatus = validationFindings.some(
    (finding) => finding.severity === "error",
  )
    ? "quarantined"
    : validationFindings.length > 0
      ? "warning"
      : "valid";

  return {
    record: {
      tenantKey: tenant.tenantKey,
      packetVersion: `${sourceFile.packetId}/${CANONICAL_DATA_BUILD_VERSION}`,
      domain: config.canonicalDomain,
      objectType: config.objectType,
      sourceObjectId,
      canonicalObjectKey: `${tenant.tenantKey}:${config.objectType}:${normalizeIdentifier(primary)}:${rowNumber}`,
      attributes,
      relationships,
      evidenceReferences: [evidence],
      sourceAuthority: {
        sourceSystem: "canonical-tenant-inputs",
        sourceType: sourceFile.domain ?? "unknown",
        owner: sourceFile.packetId,
        authority: sourceFile.classification.includes("benchmark")
          ? "benchmark"
          : "self_reported",
      },
      observedAt: generatedAt,
      confidence: confidenceFor(row),
      sensitivity: "internal",
      dataStatus: dataStatusFor(sourceFile.classification),
      qualityStatus,
      validationFindings,
      lineage: [
        {
          step: "canonical_tenant_input_to_inactive_data_layer_build",
          version: CANONICAL_DATA_BUILD_VERSION,
          at: generatedAt,
          adapterKey: "canonical-csv-file-builder",
          mappingProfile: `${sourceFile.domain}/canonical-input`,
          contractVersion: "canonical-tenant-input-standard-2026-07",
          notes:
            "Inactive file-based build output only. No production data writes, promotion, or module runtime reads.",
        },
      ],
    },
    findings,
    placeholderRejections,
  };
}

async function discoverTenantSourceFiles(
  repoRoot: string,
  registry: Registry,
  tenant: Tenant,
  findings: CanonicalBuildFinding[],
  sourcePathViolations: CanonicalBuildFinding[],
): Promise<SourceFile[]> {
  const sourceFiles: SourceFile[] = [];
  for (const packet of tenant.packets) {
    const absolutePacketPath = path.resolve(repoRoot, packet.path);
    if (!isUnder(repoRoot, packet.path, registry.activeRoot)) {
      const violation = {
        tenantKey: tenant.tenantKey,
        severity: "error" as const,
        code: "archive_or_legacy_source_read",
        message: `Packet ${packet.packetId} is outside canonical active root: ${packet.path}`,
        sourcePath: packet.path,
      };
      findings.push(violation);
      sourcePathViolations.push(violation);
      continue;
    }
    for (const absolutePath of await walk(absolutePacketPath)) {
      if (!absolutePath.toLowerCase().endsWith(".csv")) continue;
      const repoRelativePath = path.relative(repoRoot, absolutePath);
      if (!isUnder(repoRoot, repoRelativePath, registry.activeRoot)) {
        const violation = {
          tenantKey: tenant.tenantKey,
          severity: "error" as const,
          code: "archive_or_legacy_source_read",
          message: `Source file is outside canonical active root: ${repoRelativePath}`,
          sourcePath: repoRelativePath,
        };
        findings.push(violation);
        sourcePathViolations.push(violation);
        continue;
      }
      const text = await fs.readFile(absolutePath, "utf8");
      const parsed = parseCsv(text);
      sourceFiles.push({
        tenantKey: tenant.tenantKey,
        tenantDisplayName: tenant.displayName,
        packetId: packet.packetId,
        packetPath: packet.path,
        relativePath: path.relative(absolutePacketPath, absolutePath),
        repoRelativePath,
        absolutePath,
        classification: packet.classification,
        domain: detectDomain(repoRelativePath),
        rowCount: parsed.rows.length,
        contentFingerprint: fingerprint(text),
      });
    }
  }
  return sourceFiles.sort((left, right) =>
    left.repoRelativePath.localeCompare(right.repoRelativePath),
  );
}

function relationshipCandidatesForRecord(
  record: CanonicalIngestionRecord,
  sourceFile: SourceFile,
  row: Record<string, string>,
  rowNumber: number,
): RelationshipCandidate[] {
  const sourceName = String(
    record.attributes.displayName?.value ?? record.sourceObjectId,
  );
  return relationshipCandidatesForRow(
    sourceFile.domain as DomainKey,
    sourceName,
    row,
    record.evidenceReferences[0],
  ).map((candidate) => ({
    tenantKey: record.tenantKey,
    relationshipType: candidate.relationshipType,
    sourceObjectType: record.objectType,
    sourceObjectName: sourceName,
    targetObjectType: candidate.targetObjectType,
    targetObjectName: candidate.targetObjectName,
    confidence: candidate.confidence,
    evidenceKey: candidate.evidenceKey,
    sourcePath: sourceFile.repoRelativePath,
    rowNumber,
  }));
}

function relationshipCandidatesForRow(
  domain: DomainKey,
  sourceName: string,
  row: Record<string, string>,
  evidence: EvidenceReference,
): Array<{
  relationshipType: string;
  targetObjectType: string;
  targetObjectName: string;
  confidence: number;
  evidenceKey: string;
}> {
  const config = DOMAIN_CONFIG[domain];
  const candidates = [];
  for (const relation of config.relationshipFields ?? []) {
    for (const target of splitValues(row[relation.field])) {
      if (
        isPlaceholder(target) ||
        normalizeName(target) === normalizeName(sourceName)
      )
        continue;
      candidates.push({
        relationshipType: relation.relationshipType,
        targetObjectType: relation.targetObjectType,
        targetObjectName: target,
        confidence: 0.72,
        evidenceKey: evidence.evidenceKey,
      });
    }
  }
  if (domain === "relationships") {
    const target = firstValue(row, [
      "target_name",
      "to_entity",
      "target_object",
    ]);
    const type = firstValue(row, [
      "relationship_type",
      "relationship",
      "edge_type",
    ]);
    if (target && type && !isPlaceholder(target) && !isPlaceholder(type)) {
      candidates.push({
        relationshipType: normalizeIdentifier(type),
        targetObjectType:
          firstValue(row, ["target_type", "to_type"]) || "related_object",
        targetObjectName: target,
        confidence: 0.78,
        evidenceKey: evidence.evidenceKey,
      });
    }
  }
  return candidates;
}

function summarizeCanonicalRecords(
  tenants: CanonicalDataBuildReport["tenants"],
  records: CanonicalIngestionRecord[],
  findings: CanonicalBuildFinding[],
): CanonicalRecordSummary[] {
  return tenants.map((tenant) => {
    const tenantRecords = records.filter(
      (record) => record.tenantKey === tenant.tenantKey,
    );
    const byDomain: CanonicalRecordSummary["byDomain"] = {};
    for (const domain of Object.keys(DOMAIN_CONFIG)) {
      const domainFiles = tenant.sourceFiles.filter(
        (file) => file.domain === domain,
      );
      const domainRecords = tenantRecords.filter(
        (record) =>
          record.lineage[0]?.mappingProfile === `${domain}/canonical-input`,
      );
      const names = domainRecords.map((record) =>
        normalizeName(String(record.attributes.displayName?.value ?? "")),
      );
      byDomain[domain] = {
        sourceFiles: domainFiles.length,
        sourceRows: domainFiles.reduce((sum, file) => sum + file.rowCount, 0),
        acceptedRecords: domainRecords.filter(
          (record) => record.qualityStatus !== "quarantined",
        ).length,
        quarantinedRecords: domainRecords.filter(
          (record) => record.qualityStatus === "quarantined",
        ).length,
        skippedRows: findings.filter(
          (finding) =>
            finding.tenantKey === tenant.tenantKey &&
            finding.domain === domain &&
            finding.code === "primary_identity_missing_or_placeholder",
        ).length,
        duplicateNames: names.length - new Set(names).size,
      };
    }
    return {
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.displayName,
      totalAcceptedRecords: tenantRecords.filter(
        (record) => record.qualityStatus !== "quarantined",
      ).length,
      totalQuarantinedRecords: tenantRecords.filter(
        (record) => record.qualityStatus === "quarantined",
      ).length,
      totalSkippedRows: findings.filter(
        (finding) =>
          finding.tenantKey === tenant.tenantKey &&
          finding.code === "primary_identity_missing_or_placeholder",
      ).length,
      byDomain,
      sampleObjects: tenantRecords.slice(0, 25).map((record) => ({
        domain:
          record.lineage[0]?.mappingProfile?.replace("/canonical-input", "") ??
          record.domain,
        objectType: record.objectType,
        name: String(
          record.attributes.displayName?.value ?? record.sourceObjectId,
        ),
        sourcePath: String(record.attributes.sourcePath?.value ?? ""),
        rowNumber: Number(record.attributes.sourceRowNumber?.value ?? 0),
      })),
    };
  });
}

function evidenceSummaryForTenant(
  tenantKey: string,
  records: CanonicalIngestionRecord[],
) {
  const tenantRecords = records.filter(
    (record) => record.tenantKey === tenantKey,
  );
  const sourceFiles = new Set(
    tenantRecords
      .map((record) => String(record.attributes.sourcePath?.value ?? ""))
      .filter(Boolean),
  );
  return {
    tenantKey,
    recordsWithEvidence: tenantRecords.filter(
      (record) => record.evidenceReferences.length > 0,
    ).length,
    recordsWithoutEvidence: tenantRecords.filter(
      (record) => record.evidenceReferences.length === 0,
    ).length,
    evidenceAttachmentCount: tenantRecords.reduce(
      (sum, record) => sum + record.evidenceReferences.length,
      0,
    ),
    sourceFileCount: sourceFiles.size,
  };
}

function relationshipSummaryForTenant(
  tenantKey: string,
  candidates: RelationshipCandidate[],
  findings: CanonicalBuildFinding[],
) {
  const tenantCandidates = candidates.filter(
    (candidate) => candidate.tenantKey === tenantKey,
  );
  const byType: Record<string, number> = {};
  for (const candidate of tenantCandidates) {
    byType[candidate.relationshipType] =
      (byType[candidate.relationshipType] ?? 0) + 1;
  }
  return {
    tenantKey,
    candidateCount: tenantCandidates.length,
    byType,
    gapCount: findings.filter(
      (finding) =>
        finding.tenantKey === tenantKey &&
        finding.code.includes("relationship"),
    ).length,
    samples: tenantCandidates.slice(0, 20),
  };
}

function profileBuildForTenant(
  tenantKey: string,
  tenantDisplayName: string,
  records: CanonicalIngestionRecord[],
  findings: CanonicalBuildFinding[],
): EnterpriseProfileBuild {
  const profileRecords = records.filter(
    (record) =>
      record.tenantKey === tenantKey && record.objectType === "tenant_profile",
  );
  const sourceFiles = [
    ...new Set(
      profileRecords.map((record) =>
        String(record.attributes.sourcePath?.value ?? ""),
      ),
    ),
  ];
  const facts: EnterpriseProfileBuild["facts"] = {};
  for (const record of profileRecords) {
    facts.industry ??= stringAttribute(record, ["industry"]);
    facts.subIndustry ??= stringAttribute(record, [
      "subIndustry",
      "sub_industry",
    ]);
    facts.headquarters ??= stringAttribute(record, ["headquarters"]);
    facts.revenueUsd ??= stringAttribute(record, ["revenueUsd", "revenue_usd"]);
    facts.employeeCount ??= stringAttribute(record, [
      "employeeCount",
      "employee_count",
    ]);
    facts.businessModel ??= stringAttribute(record, [
      "businessModel",
      "business_model",
    ]);
    facts.mission ??= stringAttribute(record, [
      "mission",
      "missionStatement",
      "mission_statement",
    ]);
    facts.vision ??= stringAttribute(record, [
      "vision",
      "visionStatement",
      "vision_statement",
    ]);
    facts.source ??= stringAttribute(record, ["sourceFile", "source_file"]);
    facts.asOf ??= stringAttribute(record, [
      "sourceDate",
      "source_date",
      "sourceAsOfDate",
      "source_as_of_date",
    ]);
    fillListFact(
      facts,
      "locations",
      splitValues(
        stringAttribute(record, [
          "operatingRegions",
          "operating_regions",
          "globalLocations",
          "global_locations",
        ]),
      ),
    );
    fillListFact(
      facts,
      "leadership",
      splitValues(
        stringAttribute(record, [
          "leadershipTeam",
          "leadership_team",
          "leadershipRoles",
          "leadership_roles",
        ]),
      ),
    );
    fillListFact(
      facts,
      "strategy",
      splitValues(
        stringAttribute(record, [
          "strategicPriorities",
          "strategic_priorities",
        ]),
      ),
    );
    fillListFact(
      facts,
      "segments",
      splitValues(
        stringAttribute(record, [
          "customerSegments",
          "customer_segments",
          "businessSegments",
          "business_segments",
        ]),
      ),
    );
  }

  const missingFields = REQUIRED_PROFILE_FIELDS.filter((field) => {
    const value = profileFactValue(facts, field);
    return Array.isArray(value) ? value.length === 0 : !value;
  });
  for (const missingField of missingFields) {
    findings.push({
      tenantKey,
      severity: "warning",
      code: "enterprise_profile_gap",
      message: `Enterprise profile field ${missingField} is missing from canonical tenant inputs.`,
      domain: "enterprise_profile",
      field: missingField,
    });
  }
  return {
    tenantKey,
    tenantDisplayName,
    sourceFiles,
    status:
      profileRecords.length === 0
        ? "missing"
        : missingFields.length > 0
          ? "gaps"
          : "ready",
    facts,
    missingFields,
    sourceLineage: profileRecords.map((record) => ({
      sourcePath: String(record.attributes.sourcePath?.value ?? ""),
      rowNumber: Number(record.attributes.sourceRowNumber?.value ?? 0),
      evidenceKey: record.evidenceReferences[0]?.evidenceKey ?? "",
    })),
  };
}

function fillListFact(
  facts: EnterpriseProfileBuild["facts"],
  field: "locations" | "leadership" | "strategy" | "segments",
  values: string[],
): void {
  if (values.length > 0 && (!facts[field] || facts[field].length === 0)) {
    facts[field] = values;
  }
}

function profileFactValue(
  facts: EnterpriseProfileBuild["facts"],
  field: (typeof REQUIRED_PROFILE_FIELDS)[number],
): string | string[] | undefined {
  if (field === "revenue") return facts.revenueUsd;
  if (field === "employees") return facts.employeeCount;
  return facts[field];
}

function qualityDepthForTenant(
  tenant: CanonicalDataBuildReport["tenants"][number],
  records: CanonicalIngestionRecord[],
  qualityRules: QualityDepthRules,
) {
  const thresholds =
    qualityRules.companySizeBands[tenant.companySizeBand]?.minRows ?? {};
  const tenantRecords = records.filter(
    (record) => record.tenantKey === tenant.tenantKey,
  );
  const domainsBelowDepth = Object.entries(thresholds)
    .map(([domain, minimumRows]) => {
      const rows = tenant.sourceFiles
        .filter((file) => file.domain === domain)
        .reduce((sum, file) => sum + file.rowCount, 0);
      return {
        domain,
        rows,
        minimumRows,
        gap: Math.max(0, minimumRows - rows),
      };
    })
    .filter((item) => item.gap > 0);
  const totalDomains = Object.keys(thresholds).length;
  const domainsMeetingDepth = Math.max(
    0,
    totalDomains - domainsBelowDepth.length,
  );
  return {
    tenantKey: tenant.tenantKey,
    companySizeBand: tenant.companySizeBand,
    totalSourceRows: tenant.sourceFiles.reduce(
      (sum, file) => sum + file.rowCount,
      0,
    ),
    totalAcceptedRecords: tenantRecords.filter(
      (record) => record.qualityStatus !== "quarantined",
    ).length,
    domainsMeetingDepth,
    domainsBelowDepth,
    qualityScore:
      totalDomains === 0
        ? 0
        : Math.round((domainsMeetingDepth / totalDomains) * 100),
  };
}

function readinessForTenant(
  tenantKey: string,
  records: CanonicalIngestionRecord[],
  candidates: RelationshipCandidate[],
  profiles: EnterpriseProfileBuild[],
  qualityDepth: CanonicalDataBuildReport["tenantQualityDepth"],
  findings: CanonicalBuildFinding[],
) {
  const tenantRecords = records.filter(
    (record) => record.tenantKey === tenantKey,
  );
  const evidenceAttachmentCount = tenantRecords.reduce(
    (sum, record) => sum + record.evidenceReferences.length,
    0,
  );
  const relationshipCandidateCount = candidates.filter(
    (candidate) => candidate.tenantKey === tenantKey,
  ).length;
  const profile = profiles.find((item) => item.tenantKey === tenantKey);
  const quality = qualityDepth.find((item) => item.tenantKey === tenantKey);
  const blockingFindings = findings.filter(
    (finding) =>
      finding.tenantKey === tenantKey && finding.severity === "error",
  );
  const profileReady = profile?.status === "ready";
  const evidenceReady =
    evidenceAttachmentCount >= tenantRecords.length && tenantRecords.length > 0;
  const relationshipReady = relationshipCandidateCount > 0;
  const ready =
    blockingFindings.length === 0 &&
    profileReady &&
    evidenceReady &&
    relationshipReady;
  return {
    tenantKey,
    ready,
    profileReady,
    evidenceReady,
    relationshipReady,
    canonicalRecordCount: tenantRecords.length,
    evidenceAttachmentCount,
    relationshipCandidateCount,
    caveats: [
      ...(profile?.missingFields.map(
        (field) => `Enterprise profile missing ${field}.`,
      ) ?? []),
      ...(quality?.domainsBelowDepth
        .slice(0, 8)
        .map((gap) => `${gap.domain} below depth by ${gap.gap} rows.`) ?? []),
      ...blockingFindings.map((finding) => finding.message),
    ],
    canAnswer: [
      "which active canonical input files were loaded",
      "what source-backed records exist by domain",
      "which fields, relationships, and evidence still need work",
      "which tenant facts have source lineage",
    ],
    mustNotClaim: [
      "candidate data is active tenant truth",
      "production data was written",
      "candidate was promoted",
      "modules read this build by default",
      "unsupported realized value or ROI",
    ],
  };
}

function detectDomain(relativePath: string): DomainKey | null {
  for (const matcher of DOMAIN_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(relativePath)))
      return matcher.domain;
  }
  return null;
}

function evidenceFor(
  tenant: Tenant,
  sourceFile: SourceFile,
  row: Record<string, string>,
  rowNumber: number,
  primary: string,
): EvidenceReference {
  return {
    evidenceKey: `${tenant.tenantKey}:${sourceFile.packetId}:${path.basename(sourceFile.repoRelativePath)}:${rowNumber}`,
    sourceObjectId: `${sourceFile.repoRelativePath}#${rowNumber}`,
    excerpt: bestExcerpt(row, primary),
    confidence: confidenceFor(row),
  };
}

function bestExcerpt(row: Record<string, string>, fallback: string): string {
  const values = Object.entries(row)
    .filter(([, value]) => value && !isPlaceholder(value))
    .slice(0, 6)
    .map(([field, value]) => `${field}: ${value}`);
  return values.length > 0 ? values.join("; ").slice(0, 500) : fallback;
}

function firstValue(
  row: Record<string, string>,
  fields: string[],
): string | undefined {
  for (const field of fields) {
    const value = row[field];
    if (value && !isMissingSourceValue(value) && !isPlaceholder(value))
      return value.trim();
  }
  return undefined;
}

function stringAttribute(
  record: CanonicalIngestionRecord,
  fields: string[],
): string | undefined {
  for (const field of fields) {
    const value =
      record.attributes[toAttributeName(field)]?.value ??
      record.attributes[field]?.value;
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
    if (Array.isArray(value) && value.length > 0) {
      const joined = value
        .filter((item): item is string | number | boolean =>
          ["string", "number", "boolean"].includes(typeof item),
        )
        .map((item) => String(item).trim())
        .filter(Boolean)
        .join("; ");
      if (joined) return joined;
    }
  }
  return undefined;
}

function splitValues(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\s*[|;]\s*/)
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 0 && !isPlaceholder(item) && !isMissingSourceValue(item),
    );
}

function isPlaceholder(value: string | undefined): boolean {
  if (value === undefined) return true;
  const normalized = normalizeIdentifier(value);
  if (PLACEHOLDER_TOKENS.has(normalized)) return true;
  return /^(owner|client|sme)\s+to\s+confirm/i.test(value.trim());
}

function canonicalValue(rawValue: string): CanonicalValue {
  const value = rawValue.trim();
  const numberValue = Number(value.replace(/[$,%]/g, "").replace(/,/g, ""));
  if (/^\$?[\d,]+(?:\.\d+)?$/.test(value)) {
    return {
      value: numberValue,
      valueType: value.includes("$") ? "currency" : "number",
      unit: value.includes("$") ? "USD" : undefined,
      confidence: 0.8,
    };
  }
  if (/^[\d.]+%$/.test(value)) {
    return { value: numberValue / 100, valueType: "percent", confidence: 0.8 };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { value, valueType: "date", confidence: 0.85 };
  }
  if (value.includes("|") || value.includes(";")) {
    return { value: splitValues(value), valueType: "json", confidence: 0.75 };
  }
  return { value, valueType: "string", confidence: 0.78 };
}

function confidenceFor(row: Record<string, string>): number {
  const value = firstValue(row, [
    "confidence",
    "confidence_score",
    "source_confidence",
  ]);
  if (!value) return 0.78;
  const parsed = Number(value.replace("%", ""));
  if (!Number.isFinite(parsed)) return 0.78;
  return parsed > 1
    ? Math.max(0, Math.min(1, parsed / 100))
    : Math.max(0, Math.min(1, parsed));
}

function dataStatusFor(classification: string): DataStatus {
  if (classification.includes("benchmark")) return "benchmark";
  if (classification.includes("synthetic")) return "synthetic";
  return "curated";
}

function toAttributeName(field: string): string {
  return field.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function tenantKeyMatches(rowTenantKey: string, tenant: Tenant): boolean {
  const row = normalizeIdentifier(rowTenantKey);
  const active = normalizeIdentifier(tenant.tenantKey);
  const display = normalizeIdentifier(tenant.displayName);
  return (
    row === active ||
    row === display ||
    active.startsWith(`${row}_`) ||
    active.startsWith(`${row}-`) ||
    display.startsWith(`${row}_`) ||
    display.startsWith(`${row}-`)
  );
}

function fingerprint(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function walk(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const results: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(full)));
    if (entry.isFile()) results.push(full);
  }
  return results;
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(repoRoot: string, relativePath: string): Promise<T> {
  return JSON.parse(
    await fs.readFile(path.resolve(repoRoot, relativePath), "utf8"),
  ) as T;
}

function isUnder(
  repoRoot: string,
  childRelativePath: string,
  parentRelativePath: string,
): boolean {
  const relative = path.relative(
    path.resolve(repoRoot, parentRelativePath),
    path.resolve(repoRoot, childRelativePath),
  );
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function summaryMarkdown(report: CanonicalDataBuildReport): string {
  const lines = [
    "# Canonical Tenant Data Build",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Truth Split",
    "",
    "- This is an inactive, deterministic file-based build from canonical tenant inputs.",
    "- No production tenant data was written.",
    "- The Active Tenant Access Layer was not updated.",
    "- No candidate was promoted.",
    "- No module runtime reads changed.",
    "",
    "## Summary",
    "",
    `- Source root: \`${report.sourceRoot}\``,
    `- Template set: \`${report.templateSetId}\``,
    `- Tenants processed: ${report.summary.tenantsProcessed}`,
    `- Accepted canonical records: ${report.summary.canonicalRecordsAccepted.toLocaleString()}`,
    `- Quarantined canonical records: ${report.summary.canonicalRecordsQuarantined.toLocaleString()}`,
    `- Evidence attachments: ${report.summary.evidenceAttachments.toLocaleString()}`,
    `- Relationship candidates: ${report.summary.relationshipCandidates.toLocaleString()}`,
    `- Placeholder rejections/gaps: ${report.summary.placeholderRejections.toLocaleString()}`,
    `- Archive/legacy read violations: ${report.summary.archiveReadViolations}`,
    `- Error findings: ${report.summary.errorCount}`,
    "",
    "## Tenants",
    "",
    "| Tenant | Source files | Source rows | Accepted records | Relationship candidates | Profile | Home/aVa ready |",
    "| --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...report.tenants.map((tenant) => {
      const recordSummary = report.canonicalRecordSummary.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      const relationSummary = report.relationshipCandidatesSummary.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      const profile = report.enterpriseProfileBuild.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      const readiness = report.homeAvaReadiness.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      return `| ${tenant.displayName} | ${tenant.sourceFiles.length.toLocaleString()} | ${tenant.sourceFiles.reduce((sum, file) => sum + file.rowCount, 0).toLocaleString()} | ${(recordSummary?.totalAcceptedRecords ?? 0).toLocaleString()} | ${(relationSummary?.candidateCount ?? 0).toLocaleString()} | ${profile?.status ?? "missing"} | ${readiness?.ready ? "ready" : "not ready"} |`;
    }),
    "",
    "## Domain Counts",
    "",
    "| Tenant | Domain | Source rows | Accepted records | Skipped rows | Duplicate names |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...report.canonicalRecordSummary.flatMap((tenant) =>
      Object.entries(tenant.byDomain).map(
        ([domain, summary]) =>
          `| ${tenant.tenantDisplayName} | ${domain} | ${summary.sourceRows.toLocaleString()} | ${summary.acceptedRecords.toLocaleString()} | ${summary.skippedRows.toLocaleString()} | ${summary.duplicateNames.toLocaleString()} |`,
      ),
    ),
    "",
    "## Proof Files",
    "",
    "- `tenant-build-index.json`",
    "- `canonical-records-summary.json`",
    "- `evidence-attachment-summary.json`",
    "- `relationship-candidates-summary.json`",
    "- `enterprise-profile-build.json`",
    "- `placeholder-rejection-report.json`",
    "- `tenant-gaps.json`",
    "- `tenant-quality-depth.json`",
    "- `home-ava-readiness.json`",
    "- `source-path-enforcement.json`",
    "- `archive-read-violations.json`",
    "- `all-tenant-build-control.html`",
    "",
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}

function controlHtml(report: CanonicalDataBuildReport): string {
  const tenantRows = report.tenants
    .map((tenant) => {
      const records = report.canonicalRecordSummary.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      const readiness = report.homeAvaReadiness.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      const quality = report.tenantQualityDepth.find(
        (item) => item.tenantKey === tenant.tenantKey,
      );
      return `<tr><td>${escapeHtml(tenant.displayName)}</td><td>${tenant.sourceFiles.length}</td><td>${tenant.sourceFiles.reduce((sum, file) => sum + file.rowCount, 0).toLocaleString()}</td><td>${(records?.totalAcceptedRecords ?? 0).toLocaleString()}</td><td>${quality?.qualityScore ?? 0}%</td><td>${readiness?.ready ? "Ready" : "Not ready"}</td></tr>`;
    })
    .join("");
  const cards = [
    ["Tenants", report.summary.tenantsProcessed],
    [
      "Accepted Records",
      report.summary.canonicalRecordsAccepted.toLocaleString(),
    ],
    [
      "Evidence Attachments",
      report.summary.evidenceAttachments.toLocaleString(),
    ],
    [
      "Relationship Candidates",
      report.summary.relationshipCandidates.toLocaleString(),
    ],
    ["Archive Reads", report.summary.archiveReadViolations],
    ["Runtime Writes", "false"],
  ]
    .map(
      ([label, value]) =>
        `<section><span>${label}</span><strong>${value}</strong></section>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Canonical Tenant Data Build</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #08172f; background: #f7f5f0; }
    main { max-width: 1440px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 40px; margin: 0 0 8px; letter-spacing: 0; }
    p { color: #50617a; font-size: 16px; line-height: 1.5; }
    .cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin: 28px 0; }
    section { background: white; border: 1px solid #ddd6ca; border-radius: 8px; padding: 18px; }
    section span { display: block; color: #7b8797; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    section strong { display: block; margin-top: 8px; font-size: 26px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd6ca; border-radius: 8px; overflow: hidden; }
    th, td { text-align: left; padding: 14px 16px; border-bottom: 1px solid #ebe4d9; font-size: 14px; }
    th { color: #657186; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; background: #fbfaf7; }
    .truth { border-left: 4px solid #0f8d72; background: #eefaf6; padding: 16px 20px; border-radius: 8px; }
    @media (max-width: 980px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } main { padding: 24px; } }
  </style>
</head>
<body>
  <main>
    <h1>Canonical Tenant Data Build</h1>
    <p>Inactive proof that canonical tenant input files can become source-backed canonical records, evidence attachments, relationship candidates, quality posture, and Home/aVa readiness artifacts.</p>
    <div class="truth"><strong>Truth split:</strong> no production tenant data writes, no Active Tenant Access update, no candidate promotion, no module runtime read change.</div>
    <div class="cards">${cards}</div>
    <h2>All-Tenant Build Control</h2>
    <table>
      <thead><tr><th>Tenant</th><th>Files</th><th>Rows</th><th>Accepted records</th><th>Depth score</th><th>Home/aVa</th></tr></thead>
      <tbody>${tenantRows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function compactFindings(findings: CanonicalBuildFinding[]): {
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  byDomain: Record<string, number>;
  samples: CanonicalBuildFinding[];
} {
  const byCode: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  for (const finding of findings) {
    byCode[finding.code] = (byCode[finding.code] ?? 0) + 1;
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
    if (finding.domain)
      byDomain[finding.domain] = (byDomain[finding.domain] ?? 0) + 1;
  }
  return {
    total: findings.length,
    byCode,
    bySeverity,
    byDomain,
    samples: representativeSamples(findings, 80),
  };
}

function representativeSamples(
  findings: CanonicalBuildFinding[],
  maxSamples: number,
): CanonicalBuildFinding[] {
  const seen = new Set<string>();
  const samples: CanonicalBuildFinding[] = [];
  for (const finding of findings) {
    const key = [
      finding.tenantKey,
      finding.code,
      finding.domain,
      finding.sourcePath,
      finding.field,
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    samples.push(finding);
    if (samples.length >= maxSamples) break;
  }
  return samples;
}

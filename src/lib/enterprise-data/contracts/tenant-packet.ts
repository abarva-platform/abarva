import type {
  CanonicalDomain,
  DataClassification,
  DataStatus,
} from "./canonical-ingestion";

export type TenantPacketContractVersion = "tenant-packet/v1";

export type TenantPacketSourceClass =
  | "enterprise_profile"
  | "organization_functions"
  | "applications_systems"
  | "data_assets_integrations"
  | "infrastructure_platforms"
  | "vendors_contracts"
  | "spend_value"
  | "service_scope_managed_services"
  | "programs_priorities"
  | "ai_automation_use_cases"
  | "risks_controls"
  | "relationships"
  | "metric_definitions"
  | "metrics_outcomes"
  | "operational_process_evidence"
  | "industry_context_patterns"
  | "expert_lenses"
  | "evidence_registry"
  | "module_memory"
  | "outcome_measurements"
  | "benchmark_context";

export type TenantPacketModule =
  | "home"
  | "intelligence"
  | "moves"
  | "source"
  | "tower"
  | "export";

export type TenantPacketLoadState =
  | "packet_received"
  | "manifest_validated"
  | "source_classified"
  | "adapter_selected"
  | "mapping_validated"
  | "canonical_records_generated"
  | "canonical_records_validated"
  | "unmapped_fields_reported"
  | "quarantine_reviewed"
  | "target_write_planned"
  | "candidate_version_created"
  | "proof_bundle_generated"
  | "promotion_approved"
  | "active_version_promoted"
  | "module_consumption_verified";

export interface TenantPacketSourceProfile {
  sourceClass: TenantPacketSourceClass;
  sourceProfile: string;
  mappingProfile: string;
  adapterKey: string;
  parserVersion: string;
}

export interface TenantPacketFile {
  path: string;
  sourceClass: TenantPacketSourceClass;
  sourceProfile: string;
  mappingProfile: string;
  adapterKey: string;
  dataStatus?: DataStatus;
  sensitivity?: DataClassification;
  evidenceBasis:
    | "source_file"
    | "workshop"
    | "system_extract"
    | "benchmark"
    | "generated_artifact";
  required: boolean;
  expectedDomains: CanonicalDomain[];
  contentFingerprint?: string;
}

export interface TenantPacketQualityGates {
  requireEvidenceRegistry: boolean;
  minimumMappingCoveragePercent: number;
  allowQuarantinedRecords: boolean;
  requirePromotionApproval: boolean;
  requireModuleConsumptionProof: boolean;
}

export interface TenantPacketPromotionPolicy {
  createCandidateVersion: boolean;
  promoteAutomatically: false;
  preservePriorActiveVersion: boolean;
  rollbackWindowDays: number;
}

export interface TenantPacketManifest {
  contractVersion: TenantPacketContractVersion;
  packetId: string;
  tenantKey: string;
  tenantDisplayName: string;
  dataStatus: DataStatus;
  sensitivity: DataClassification;
  sourceOwner: string;
  effectiveDate: string;
  legacyMigrationName?: string;
  intendedDomains: CanonicalDomain[];
  intendedModules: TenantPacketModule[];
  sourceProfiles: TenantPacketSourceProfile[];
  files: TenantPacketFile[];
  qualityGates: TenantPacketQualityGates;
  promotionPolicy: TenantPacketPromotionPolicy;
}

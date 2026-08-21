import type { EnrichmentSchema } from "./enrichment-firewall";

/**
 * Declared enrichment schemas for the first three templates.
 *
 * WHAT BELONGS HERE, AND WHAT DOES NOT
 *
 * Every column below either follows from recorded fields in the same file (derived) or is computed
 * by us from them (deterministic). None is `aug__`. Augmentation means adding a fact the client
 * never gave us -- a vendor's market position, a benchmark, a typical refresh cadence for this kind
 * of system -- and none of the three files needs it. These templates carry the technology estate,
 * where an outside-sourced fact would be the least defensible thing on the page.
 *
 * The derived columns are not new inventions. They are the judgements the render layer has been
 * making silently at display time -- deciding that a thing is a mart, that it runs on SQL Server,
 * that a flow is batch ETL. Moving them here changes nothing about what is decided; it changes WHO
 * decides it and whether anyone saw it. A judgement made in a projection is invisible and
 * unreviewable; a judgement made here is a proposal with evidence, a reviewer and a date.
 *
 * Vocabularies are closed on purpose. An open field lets a model widen the taxonomy one row at a
 * time until the categories no longer partition anything, and nobody notices because each
 * individual value looked reasonable.
 */

/**
 * What the entity IS, architecturally.
 *
 * Kept separate from what it RUNS ON, because a mart hosted on SQL Server is a mart -- and
 * collapsing the two is how "SQL Server" ends up rendered as an integration layer.
 */
const ARCHITECTURE_ROLE = [
  "source_system",
  "integration_middleware",
  "etl_elt_platform",
  "etl_pipeline_artifact",
  "enterprise_data_warehouse",
  "data_mart",
  "operational_reporting_database",
  "analytics_bi_platform",
  "data_lake_or_lakehouse",
  "master_data_management",
  "business_application",
  "infrastructure_service",
  "unknown",
] as const;

const MOVEMENT_MECHANISM = [
  "batch_etl",
  "change_data_capture",
  "api_realtime",
  "message_queue",
  "file_transfer",
  "database_replication",
  "manual_extract",
  "unknown",
] as const;

const PLATFORM_ROLE = [
  "compute_platform",
  "database_platform",
  "storage_platform",
  "container_platform",
  "integration_runtime",
  "network_service",
  "end_user_computing",
  "security_service",
  "unknown",
] as const;

export const APPLICATIONS_SYSTEMS_ENRICHMENT: EnrichmentSchema = {
  schemaVersion: "2026-08-v1",
  templateFile: "04_applications_systems.csv",
  columns: [
    {
      column: "drv__architecture_role",
      basis: "derived",
      targetAttribute: "architectureRole",
      vocabulary: [...ARCHITECTURE_ROLE],
      evidenceFields: ["system_name", "system_type", "system_category", "data_domains"],
    },
    {
      // The host is a separate fact from the entity. Recording it explicitly is what lets a view
      // place "Radiology Utilization Mart" in the mart zone while still knowing it sits on SQL
      // Server -- rather than placing SQL Server itself somewhere and calling that architecture.
      column: "drv__hosting_platform",
      basis: "derived",
      targetAttribute: "hostingPlatform",
      unenumerable:
        "A product name, not a classification. It cannot be listed ahead of time and is reconciled against the reviewed alias table instead.",
      evidenceFields: ["system_name", "system_type", "deployment_model", "hosting_location"],
    },
    {
      column: "det__interface_intensity",
      basis: "deterministic",
      targetAttribute: "interfaceIntensity",
      vocabulary: ["isolated", "lightly_integrated", "integrated", "heavily_integrated", "unknown"],
      evidenceFields: ["interfaces_count"],
    },
  ],
};

export const DATA_ASSETS_INTEGRATIONS_ENRICHMENT: EnrichmentSchema = {
  schemaVersion: "2026-08-v1",
  templateFile: "05_data_assets_integrations.csv",
  columns: [
    {
      column: "drv__movement_mechanism",
      basis: "derived",
      targetAttribute: "movementMechanism",
      vocabulary: [...MOVEMENT_MECHANISM],
      evidenceFields: ["integration_type", "refresh_frequency", "platform_or_database"],
    },
    {
      // Properties of the target and the source across the WHOLE file, not of the row. Computed
      // per-row, fan-in is always 1 and measures nothing.
      column: "det__target_fan_in",
      basis: "deterministic",
      targetAttribute: "targetFanIn",
      unenumerable: "A count. Its range is the size of the file.",
      evidenceFields: ["source_system", "target_system"],
    },
    {
      column: "det__source_fan_out",
      basis: "deterministic",
      targetAttribute: "sourceFanOut",
      unenumerable: "A count. Its range is the size of the file.",
      evidenceFields: ["source_system", "target_system"],
    },
  ],
};

export const INFRASTRUCTURE_PLATFORMS_ENRICHMENT: EnrichmentSchema = {
  schemaVersion: "2026-08-v1",
  templateFile: "06_infrastructure_platforms.csv",
  columns: [
    {
      column: "drv__platform_role",
      basis: "derived",
      targetAttribute: "platformRole",
      vocabulary: [...PLATFORM_ROLE],
      evidenceFields: ["platform_name", "platform_type", "technology_stack", "hosting_model"],
    },
    {
      column: "det__criticality_rank",
      basis: "deterministic",
      targetAttribute: "criticalityRank",
      vocabulary: ["1", "2", "3", "4", "unknown"],
      evidenceFields: ["criticality"],
    },
  ],
};

export const ENRICHMENT_SCHEMAS: EnrichmentSchema[] = [
  APPLICATIONS_SYSTEMS_ENRICHMENT,
  DATA_ASSETS_INTEGRATIONS_ENRICHMENT,
  INFRASTRUCTURE_PLATFORMS_ENRICHMENT,
];

export function enrichmentSchemaFor(templateFile: string): EnrichmentSchema | undefined {
  return ENRICHMENT_SCHEMAS.find((s) => s.templateFile === templateFile);
}

// Moves Expert Kernel — Lakebridge/Analyzer inventory upload template.
//
// This template is intentionally metadata-only. AbarVa consumes Analyzer-style
// inventory exports; it does not ingest source code or run a converter.

import type { UploadedFileFormat } from "@/lib/context-ingestion/types";

export type ModernizationObjectType = "lakebridge_analyzer_inventory";

export interface ModernizationTemplateDefinition {
  id: string;
  objectType: ModernizationObjectType;
  label: string;
  description: string;
  acceptedFormats: Extract<UploadedFileFormat, "csv" | "xlsx" | "json">[];
  requiredFields: string[];
  optionalFields: string[];
  ownerRole: string;
  segmentFamily: "modernization_workload_inventory";
  tenantScoped: boolean;
  unlocks: string[];
}

export const MODERNIZATION_TEMPLATE_DEFINITIONS: ModernizationTemplateDefinition[] =
  [
    {
      id: "modernization-lakebridge-analyzer-inventory",
      objectType: "lakebridge_analyzer_inventory",
      label: "Lakebridge / Analyzer workload inventory",
      description:
        "Tenant-owned metadata export for legacy tables, ETL jobs, stored procedures, SAS programs, and reporting artifacts.",
      acceptedFormats: ["csv", "xlsx", "json"],
      requiredFields: [
        "tenant_workload_id",
        "workload_name",
        "source_platform",
        "source_type",
        "artifact_type",
        "complexity",
        "disposition",
        "automation_confidence",
        "source",
        "as_of",
        "confidence",
      ],
      optionalFields: [
        "business_domain",
        "owner_role",
        "loc",
        "object_count",
        "dependency_count",
        "table_count",
        "record_count",
        "volume_gb",
        "automation_rate_low",
        "automation_rate_high",
        "source_file",
        "source_row",
        "notes",
      ],
      ownerRole: "CDAO / Data platform modernization lead",
      segmentFamily: "modernization_workload_inventory",
      tenantScoped: true,
      unlocks: [
        "Modernization estimates can use a real tenant workload inventory instead of archetype-only planning ranges",
        "Source RFP comparisons can normalize SI bids against the same workload scope",
        "Disposition and automation assumptions can be tested workload by workload",
      ],
    },
  ];

export function getModernizationTemplateByObjectType(
  objectType: ModernizationObjectType,
): ModernizationTemplateDefinition | null {
  return (
    MODERNIZATION_TEMPLATE_DEFINITIONS.find(
      (template) => template.objectType === objectType,
    ) ?? null
  );
}

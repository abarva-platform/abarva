// Moves Expert Kernel — Lakebridge/Analyzer inventory intake.
//
// Pure parser/validator for Analyzer-style workload metadata. AbarVa consumes
// Analyzer output and adds decision/value/cost/evaluation logic; it never
// rescans, transpiles, or converts client code.

import type { Confidence } from "../types";
import {
  getModernizationTemplateByObjectType,
  type ModernizationObjectType,
  type ModernizationTemplateDefinition,
} from "./analyzer-inventory-templates";

export const SOURCE_PLATFORMS = [
  "DB2",
  "DataStage",
  "SQL Server",
  "SAS",
  "Tableau",
  "BusinessObjects",
  "Epic Clarity",
  "Epic Caboodle",
  "Oracle",
  "Teradata",
  "Informatica",
  "Synapse",
  "Snowflake",
  "Other",
] as const;

export const SOURCE_TYPES = [
  "database",
  "etl",
  "stored_logic",
  "reporting",
  "analytics",
  "source_system",
  "data_mart",
  "orchestration",
] as const;

export const ARTIFACT_TYPES = [
  "table",
  "view",
  "etl_job",
  "stored_procedure",
  "sql_script",
  "sas_program",
  "report",
  "dashboard",
  "semantic_model",
  "orchestration_job",
  "data_source",
  "data_mart",
] as const;

export const WORKLOAD_COMPLEXITIES = [
  "low",
  "medium",
  "high",
  "unknown",
] as const;

export const DISPOSITIONS = [
  "rehost",
  "relocate",
  "replatform",
  "refactor",
  "repurchase",
  "retire",
  "retain",
] as const;

export type SourcePlatform = (typeof SOURCE_PLATFORMS)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];
export type WorkloadComplexity = (typeof WORKLOAD_COMPLEXITIES)[number];
export type Disposition = (typeof DISPOSITIONS)[number];

export interface AnalyzerInventoryProvenance {
  source: string;
  asOf: string;
  confidence: Confidence;
  sourceFile?: string;
  sourceRow?: number;
}

export interface AnalyzerInventoryRow extends AnalyzerInventoryProvenance {
  /** Tenant-owned stable key from the Analyzer export or client inventory. */
  tenantWorkloadId: string;
  workloadName: string;
  businessDomain?: string;
  ownerRole?: string;
  sourcePlatform: SourcePlatform;
  sourceType: SourceType;
  artifactType: ArtifactType;
  complexity: WorkloadComplexity;
  disposition: Disposition;
  automationConfidence: Confidence;
  loc?: number;
  objectCount?: number;
  dependencyCount?: number;
  tableCount?: number;
  recordCount?: number;
  volumeGb?: number;
  automationRateLow?: number;
  automationRateHigh?: number;
  notes?: string;
}

export type RawAnalyzerInventoryRecord = Record<string, unknown>;

export interface AnalyzerInventoryValidationMessage {
  severity: "error" | "warning";
  rowIndex: number;
  field: string;
  message: string;
}

export interface AnalyzerInventoryValidationResult {
  valid: boolean;
  errors: AnalyzerInventoryValidationMessage[];
  warnings: AnalyzerInventoryValidationMessage[];
}

export interface ParsedAnalyzerInventoryRows {
  objectType: ModernizationObjectType;
  template: ModernizationTemplateDefinition;
  rows: AnalyzerInventoryRow[];
  validation: AnalyzerInventoryValidationResult;
}

const FIELD_ALIASES = {
  tenantWorkloadId: [
    "tenant_workload_id",
    "tenant workload id",
    "workload_id",
    "workload id",
    "asset_id",
    "object_id",
    "analyzer_object_id",
  ],
  workloadName: [
    "workload_name",
    "workload name",
    "asset_name",
    "object_name",
    "name",
  ],
  businessDomain: [
    "business_domain",
    "business domain",
    "domain",
    "subject_area",
  ],
  ownerRole: ["owner_role", "owner role", "owner", "business_owner"],
  sourcePlatform: [
    "source_platform",
    "source platform",
    "platform",
    "legacy_platform",
    "technology",
  ],
  sourceType: [
    "source_type",
    "source type",
    "workload_type",
    "asset_type",
    "category",
  ],
  artifactType: [
    "artifact_type",
    "artifact type",
    "object_type",
    "object type",
    "component_type",
  ],
  complexity: [
    "complexity",
    "complexity_band",
    "complexity band",
    "analyzer_complexity",
  ],
  disposition: [
    "disposition",
    "migration_disposition",
    "migration disposition",
    "7r",
    "7 r",
    "r_disposition",
  ],
  automationConfidence: [
    "automation_confidence",
    "automation confidence",
    "automation_feasibility",
    "conversion_confidence",
  ],
  loc: ["loc", "lines_of_code", "lines of code", "code_lines"],
  objectCount: ["object_count", "object count", "objects", "asset_count"],
  dependencyCount: [
    "dependency_count",
    "dependency count",
    "dependencies",
    "downstream_dependencies",
  ],
  tableCount: ["table_count", "table count", "tables"],
  recordCount: ["record_count", "record count", "rows", "row_count"],
  volumeGb: ["volume_gb", "volume gb", "data_size_gb", "size_gb"],
  automationRateLow: [
    "automation_rate_low",
    "automation rate low",
    "automation_low",
  ],
  automationRateHigh: [
    "automation_rate_high",
    "automation rate high",
    "automation_high",
  ],
  source: ["source", "citation", "source_url", "source url"],
  asOf: ["as_of", "asOf", "as of", "exported_at", "effective_date"],
  confidence: ["confidence", "source_confidence", "source confidence"],
  sourceFile: ["source_file", "source file", "file_name", "filename"],
  sourceRow: ["source_row", "source row", "row", "row_number"],
  notes: ["notes", "rationale", "comments"],
} as const;

const RAW_CODE_ALIASES = [
  "source_code",
  "source code",
  "sql_text",
  "sql text",
  "ddl",
  "procedure_body",
  "procedure body",
  "script_text",
  "script text",
  "sas_code",
  "sas code",
] as const;

const PLATFORM_ALIASES: Record<string, SourcePlatform> = {
  db2: "DB2",
  ibmdb2: "DB2",
  datastage: "DataStage",
  ibmdatastage: "DataStage",
  sqlserver: "SQL Server",
  mssql: "SQL Server",
  microsoftsqlserver: "SQL Server",
  sas: "SAS",
  tableau: "Tableau",
  businessobjects: "BusinessObjects",
  bo: "BusinessObjects",
  epicclarity: "Epic Clarity",
  clarity: "Epic Clarity",
  epiccaboodle: "Epic Caboodle",
  caboodle: "Epic Caboodle",
  oracle: "Oracle",
  teradata: "Teradata",
  informatica: "Informatica",
  synapse: "Synapse",
  azuresynapse: "Synapse",
  snowflake: "Snowflake",
  other: "Other",
};

const SOURCE_TYPE_ALIASES: Record<string, SourceType> = {
  database: "database",
  db: "database",
  etl: "etl",
  pipeline: "etl",
  storedlogic: "stored_logic",
  storedprocedure: "stored_logic",
  storedprocedures: "stored_logic",
  reporting: "reporting",
  report: "reporting",
  bi: "reporting",
  analytics: "analytics",
  sourcesystem: "source_system",
  systemofrecord: "source_system",
  datamart: "data_mart",
  mart: "data_mart",
  orchestration: "orchestration",
  scheduler: "orchestration",
};

const ARTIFACT_ALIASES: Record<string, ArtifactType> = {
  table: "table",
  view: "view",
  etljob: "etl_job",
  job: "etl_job",
  pipeline: "etl_job",
  storedprocedure: "stored_procedure",
  proc: "stored_procedure",
  procedure: "stored_procedure",
  sqlscript: "sql_script",
  script: "sql_script",
  sasprogram: "sas_program",
  sas: "sas_program",
  report: "report",
  dashboard: "dashboard",
  workbook: "dashboard",
  semanticmodel: "semantic_model",
  universe: "semantic_model",
  orchestrationjob: "orchestration_job",
  datasource: "data_source",
  datamart: "data_mart",
  mart: "data_mart",
};

const COMPLEXITY_ALIASES: Record<string, WorkloadComplexity> = {
  low: "low",
  simple: "low",
  small: "low",
  s: "low",
  medium: "medium",
  moderate: "medium",
  med: "medium",
  m: "medium",
  high: "high",
  complex: "high",
  large: "high",
  l: "high",
  unknown: "unknown",
  pendingclassification: "unknown",
};

const DISPOSITION_ALIASES: Record<string, Disposition> = {
  rehost: "rehost",
  liftandshift: "rehost",
  relocate: "relocate",
  replatform: "replatform",
  refactor: "refactor",
  rearchitect: "refactor",
  rearchitecture: "refactor",
  rearchitectrefactor: "refactor",
  repurchase: "repurchase",
  replace: "repurchase",
  retire: "retire",
  decommission: "retire",
  retain: "retain",
  keep: "retain",
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeToken(value: unknown): string {
  return normalizeKey(parseText(value));
}

function buildCellMap(
  record: RawAnalyzerInventoryRecord,
): Map<string, unknown> {
  return new Map(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value]),
  );
}

function readCell(
  cells: Map<string, unknown>,
  aliases: readonly string[],
): unknown {
  for (const alias of aliases) {
    const value = cells.get(normalizeKey(alias));
    if (value !== undefined) return value;
  }
  return undefined;
}

function parseText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseOptionalText(value: unknown): string | undefined {
  const text = parseText(value);
  return text || undefined;
}

function parseNumberCell(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return value;
  const text = parseText(value);
  if (!text) return undefined;
  const percentage = text.endsWith("%");
  const cleaned = text.replace(/[$,%\s]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return percentage ? parsed / 100 : parsed;
}

function normalizeChoice<T extends string>(
  value: unknown,
  aliases: Record<string, T>,
): T | string {
  const token = normalizeToken(value);
  return aliases[token] ?? parseText(value);
}

function parseConfidence(value: unknown): Confidence {
  return parseText(value).toLowerCase() as Confidence;
}

function template(): ModernizationTemplateDefinition {
  const found = getModernizationTemplateByObjectType(
    "lakebridge_analyzer_inventory",
  );
  if (!found) {
    throw new Error(
      "unknown_modernization_template:lakebridge_analyzer_inventory",
    );
  }
  return found;
}

function pushMessage(
  target: AnalyzerInventoryValidationMessage[],
  severity: AnalyzerInventoryValidationMessage["severity"],
  rowIndex: number,
  field: string,
  message: string,
): void {
  target.push({ severity, rowIndex, field, message });
}

function hasIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFiniteNumber(value: number | undefined): boolean {
  return value === undefined || Number.isFinite(value);
}

function isOneOf<T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

function validateProvenance(
  row: AnalyzerInventoryRow,
  index: number,
  errors: AnalyzerInventoryValidationMessage[],
  warnings: AnalyzerInventoryValidationMessage[],
): void {
  if (!row.source.trim()) {
    pushMessage(
      warnings,
      "warning",
      index,
      "source",
      "Missing Analyzer export/source reference; keep row reviewable and lower confidence before estimation.",
    );
  }
  if (!hasIsoDate(row.asOf)) {
    pushMessage(
      warnings,
      "warning",
      index,
      "asOf",
      "Missing or invalid as-of date; keep row reviewable and lower confidence before estimation.",
    );
  }
  if (!["low", "medium", "high"].includes(row.confidence)) {
    pushMessage(
      errors,
      "error",
      index,
      "confidence",
      "Confidence must be low, medium, or high.",
    );
  }
}

function validateOptionalNonNegativeNumber(
  value: number | undefined,
  field: string,
  index: number,
  errors: AnalyzerInventoryValidationMessage[],
): void {
  if (!isFiniteNumber(value) || (value !== undefined && value < 0)) {
    pushMessage(
      errors,
      "error",
      index,
      field,
      `${field} must be a non-negative number when present.`,
    );
  }
}

function validateRawCodeBoundary(
  record: RawAnalyzerInventoryRecord,
  index: number,
  errors: AnalyzerInventoryValidationMessage[],
): void {
  const cells = buildCellMap(record);
  for (const alias of RAW_CODE_ALIASES) {
    const value = cells.get(normalizeKey(alias));
    if (parseText(value)) {
      pushMessage(
        errors,
        "error",
        index,
        alias,
        "Raw code/script bodies are out of scope. Upload Analyzer metadata only; AbarVa must not rescan or convert code.",
      );
    }
  }
}

export function validateAnalyzerInventoryRows(
  rows: AnalyzerInventoryRow[],
  rawRecords: RawAnalyzerInventoryRecord[] = [],
): AnalyzerInventoryValidationResult {
  const errors: AnalyzerInventoryValidationMessage[] = [];
  const warnings: AnalyzerInventoryValidationMessage[] = [];
  const workloadIds = new Map<string, number>();

  rows.forEach((row, index) => {
    validateRawCodeBoundary(rawRecords[index] ?? {}, index, errors);
    validateProvenance(row, index, errors, warnings);

    if (!row.tenantWorkloadId.trim()) {
      pushMessage(
        errors,
        "error",
        index,
        "tenantWorkloadId",
        "Tenant workload identity is required.",
      );
    } else {
      const seen = workloadIds.get(row.tenantWorkloadId);
      if (seen !== undefined) {
        pushMessage(
          errors,
          "error",
          index,
          "tenantWorkloadId",
          `Duplicate tenant workload identity; first seen at row ${seen + 1}.`,
        );
      } else {
        workloadIds.set(row.tenantWorkloadId, index);
      }
    }

    if (!row.workloadName.trim()) {
      pushMessage(
        errors,
        "error",
        index,
        "workloadName",
        "Workload name is required.",
      );
    }
    if (!isOneOf(row.sourcePlatform, SOURCE_PLATFORMS)) {
      pushMessage(
        errors,
        "error",
        index,
        "sourcePlatform",
        "Unknown source platform.",
      );
    }
    if (!isOneOf(row.sourceType, SOURCE_TYPES)) {
      pushMessage(errors, "error", index, "sourceType", "Unknown source type.");
    }
    if (!isOneOf(row.artifactType, ARTIFACT_TYPES)) {
      pushMessage(
        errors,
        "error",
        index,
        "artifactType",
        "Unknown artifact type.",
      );
    }
    if (!isOneOf(row.complexity, WORKLOAD_COMPLEXITIES)) {
      pushMessage(
        errors,
        "error",
        index,
        "complexity",
        "Complexity must be low, medium, high, or unknown.",
      );
    }
    if (!isOneOf(row.disposition, DISPOSITIONS)) {
      pushMessage(
        errors,
        "error",
        index,
        "disposition",
        "Disposition must use the 7 R taxonomy.",
      );
    }
    if (!["low", "medium", "high"].includes(row.automationConfidence)) {
      pushMessage(
        errors,
        "error",
        index,
        "automationConfidence",
        "Automation confidence must be low, medium, or high.",
      );
    }

    validateOptionalNonNegativeNumber(row.loc, "loc", index, errors);
    validateOptionalNonNegativeNumber(
      row.objectCount,
      "objectCount",
      index,
      errors,
    );
    validateOptionalNonNegativeNumber(
      row.dependencyCount,
      "dependencyCount",
      index,
      errors,
    );
    validateOptionalNonNegativeNumber(
      row.tableCount,
      "tableCount",
      index,
      errors,
    );
    validateOptionalNonNegativeNumber(
      row.recordCount,
      "recordCount",
      index,
      errors,
    );
    validateOptionalNonNegativeNumber(row.volumeGb, "volumeGb", index, errors);

    if (
      row.automationRateLow !== undefined &&
      (row.automationRateLow < 0 || row.automationRateLow > 1)
    ) {
      pushMessage(
        errors,
        "error",
        index,
        "automationRateLow",
        "Automation low rate must be between 0 and 1.",
      );
    }
    if (
      row.automationRateHigh !== undefined &&
      (row.automationRateHigh < 0 || row.automationRateHigh > 1)
    ) {
      pushMessage(
        errors,
        "error",
        index,
        "automationRateHigh",
        "Automation high rate must be between 0 and 1.",
      );
    }
    if (
      row.automationRateLow !== undefined &&
      row.automationRateHigh !== undefined &&
      row.automationRateLow > row.automationRateHigh
    ) {
      pushMessage(
        errors,
        "error",
        index,
        "automationRateHigh",
        "Automation high rate must be >= low.",
      );
    }

    if (
      row.complexity === "unknown" &&
      row.loc === undefined &&
      row.objectCount === undefined &&
      row.dependencyCount === undefined
    ) {
      pushMessage(
        warnings,
        "warning",
        index,
        "complexity",
        "Unknown complexity without LOC/object/dependency counts will remain a low-confidence planning range.",
      );
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function parseAnalyzerInventoryRows(
  records: RawAnalyzerInventoryRecord[],
): ParsedAnalyzerInventoryRows {
  const rows = records.map((record): AnalyzerInventoryRow => {
    const cells = buildCellMap(record);
    return {
      tenantWorkloadId: parseText(
        readCell(cells, FIELD_ALIASES.tenantWorkloadId),
      ),
      workloadName: parseText(readCell(cells, FIELD_ALIASES.workloadName)),
      businessDomain: parseOptionalText(
        readCell(cells, FIELD_ALIASES.businessDomain),
      ),
      ownerRole: parseOptionalText(readCell(cells, FIELD_ALIASES.ownerRole)),
      sourcePlatform: normalizeChoice(
        readCell(cells, FIELD_ALIASES.sourcePlatform),
        PLATFORM_ALIASES,
      ) as SourcePlatform,
      sourceType: normalizeChoice(
        readCell(cells, FIELD_ALIASES.sourceType),
        SOURCE_TYPE_ALIASES,
      ) as SourceType,
      artifactType: normalizeChoice(
        readCell(cells, FIELD_ALIASES.artifactType),
        ARTIFACT_ALIASES,
      ) as ArtifactType,
      complexity: normalizeChoice(
        readCell(cells, FIELD_ALIASES.complexity),
        COMPLEXITY_ALIASES,
      ) as WorkloadComplexity,
      disposition: normalizeChoice(
        readCell(cells, FIELD_ALIASES.disposition),
        DISPOSITION_ALIASES,
      ) as Disposition,
      automationConfidence: parseConfidence(
        readCell(cells, FIELD_ALIASES.automationConfidence),
      ),
      loc: parseNumberCell(readCell(cells, FIELD_ALIASES.loc)),
      objectCount: parseNumberCell(readCell(cells, FIELD_ALIASES.objectCount)),
      dependencyCount: parseNumberCell(
        readCell(cells, FIELD_ALIASES.dependencyCount),
      ),
      tableCount: parseNumberCell(readCell(cells, FIELD_ALIASES.tableCount)),
      recordCount: parseNumberCell(readCell(cells, FIELD_ALIASES.recordCount)),
      volumeGb: parseNumberCell(readCell(cells, FIELD_ALIASES.volumeGb)),
      automationRateLow: parseNumberCell(
        readCell(cells, FIELD_ALIASES.automationRateLow),
      ),
      automationRateHigh: parseNumberCell(
        readCell(cells, FIELD_ALIASES.automationRateHigh),
      ),
      source: parseText(readCell(cells, FIELD_ALIASES.source)),
      asOf: parseText(readCell(cells, FIELD_ALIASES.asOf)),
      confidence: parseConfidence(readCell(cells, FIELD_ALIASES.confidence)),
      sourceFile: parseOptionalText(readCell(cells, FIELD_ALIASES.sourceFile)),
      sourceRow: parseNumberCell(readCell(cells, FIELD_ALIASES.sourceRow)),
      notes: parseOptionalText(readCell(cells, FIELD_ALIASES.notes)),
    };
  });

  return {
    objectType: "lakebridge_analyzer_inventory",
    template: template(),
    rows,
    validation: validateAnalyzerInventoryRows(rows, records),
  };
}

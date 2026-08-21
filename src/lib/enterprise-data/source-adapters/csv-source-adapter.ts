import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  CanonicalIngestionRecord,
  CanonicalValidationFinding,
  CanonicalValue,
  QualityStatus,
} from "../contracts/canonical-ingestion";
import type { MappingRule } from "../contracts/mapping-registry";
import type {
  SourceAdapter,
  SourceAdapterFinding,
  SourceAdapterInput,
  SourceAdapterResult,
} from "../contracts/source-adapter";
import { getBuiltInMappingProfile } from "./mapping-profiles";
import { isReservedColumn } from "../intake/enrichment-firewall";

const DERIVED_SOURCE_PATH_FIELD = "__source_path";

interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export class CsvSourceAdapter implements SourceAdapter {
  adapterKey = "csv";
  adapterVersion = "csv-adapter/v1";
  acceptedSourceShapes = ["text/csv", "csv"];
  acceptedSourceClasses = [
    "enterprise_profile",
    "organization_functions",
    "applications_systems",
    "data_assets_integrations",
    "infrastructure_platforms",
    "vendors_contracts",
    "spend_value",
    "service_scope_managed_services",
    "programs_priorities",
    "ai_automation_use_cases",
    "risks_controls",
    "relationships",
    "metric_definitions",
    "metrics_outcomes",
    "operational_process_evidence",
    "industry_context_patterns",
    "expert_lenses",
    "evidence_registry",
    "module_memory",
    "outcome_measurements",
    "benchmark_context",
  ];

  async parse(input: SourceAdapterInput): Promise<SourceAdapterResult> {
    const text = await fs.readFile(input.sourcePath, "utf8");
    const contentFingerprint = fingerprint(text);
    const parsed = parseCsv(text);
    const mappingProfile = getBuiltInMappingProfile(input.mappingProfile);
    const findings: SourceAdapterFinding[] = [];

    if (!mappingProfile) {
      return {
        records: [],
        findings: [
          {
            severity: "error",
            code: "mapping_profile_not_found",
            message: `No built-in mapping profile exists for ${input.mappingProfile}.`,
          },
        ],
        unmappedFields: parsed.headers,
        sourceFieldCount: parsed.headers.length,
        mappedFieldCount: 0,
        requiredFieldCount: 0,
        missingRequiredFieldCount: 0,
        quarantinedRecordCount: parsed.rows.length,
        contentFingerprint,
        mappingCoveragePercent: 0,
      };
    }

    const mappedFields = new Set(
      mappingProfile.rules.flatMap(sourceFieldsForRule),
    );
    // Reserved enrichment columns are excluded from the coverage denominator: they are not
    // supposed to have mapping rules, so counting them as gaps would push an operator toward
    // adding one.
    const mappableHeaders = parsed.headers.filter(
      (header) => !isReservedColumn(header),
    );
    const unmappedFields = mappableHeaders.filter(
      (header) => !mappedFields.has(header),
    );
    const requiredFields = mappingProfile.rules.filter((rule) => rule.required);
    const mappingCoveragePercent =
      mappableHeaders.length === 0
        ? 0
        : roundPercent(
            ((mappableHeaders.length - unmappedFields.length) /
              mappableHeaders.length) *
              100,
          );

    for (const header of parsed.headers) {
      if (mappedFields.has(header)) continue;
      if (isReservedColumn(header)) {
        // The other ingestion route hard-fails on this. Here the column is simply dropped, which
        // is safe but silent -- and reporting it as "unmapped" would read as an instruction to add
        // a mapping rule, which is the one repair that must never be made.
        findings.push({
          severity: "error",
          code: "enrichment_column_in_recorded_path",
          message: `Reserved enrichment column ${header} reached the recorded adapter. Do not map it: enrichment enters canonical state only as an approved overlay. This file was not split at intake.`,
          sourceField: header,
        });
        continue;
      }
      findings.push({
        severity: "warning",
        code: "source_field_unmapped",
        message: `Source field ${header} has no rule in ${input.mappingProfile}.`,
        sourceField: header,
      });
    }

    const records = parsed.rows.map((row, index) => {
      const rowFindings = validateRow(
        input,
        mappingProfile.rules,
        row,
        index + 1,
      );
      findings.push(
        ...rowFindings.map(
          (finding) =>
            ({
              severity: finding.severity,
              code: finding.code,
              message: finding.message,
              sourceObjectId: finding.sourceObjectId,
            }) satisfies SourceAdapterFinding,
        ),
      );
      return buildRecord(
        input,
        row,
        index,
        mappingProfile.rules,
        rowFindings,
        contentFingerprint,
      );
    });

    return {
      records,
      findings,
      unmappedFields,
      sourceFieldCount: parsed.headers.length,
      mappedFieldCount: parsed.headers.length - unmappedFields.length,
      requiredFieldCount: requiredFields.length,
      missingRequiredFieldCount: findings.filter(
        (finding) => finding.code === "required_source_field_missing",
      ).length,
      quarantinedRecordCount: records.filter(
        (record) => record.qualityStatus === "quarantined",
      ).length,
      contentFingerprint,
      mappingCoveragePercent,
    };
  }
}

export function parseCsv(text: string): ParsedCsv {
  const rows = parseCsvRows(text.trim());
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return {
    headers,
    rows: rows.map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index]?.trim() ?? ""]),
      ),
    ),
  };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && inQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += character;
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((csvRow) =>
    csvRow.some((value) => value.trim().length > 0),
  );
}

function buildRecord(
  input: SourceAdapterInput,
  row: Record<string, string>,
  rowIndex: number,
  rules: MappingRule[],
  validationFindings: CanonicalValidationFinding[],
  contentFingerprint: string,
): CanonicalIngestionRecord {
  const requiredIdRule = rules.find((rule) => rule.required);
  const sourceObjectId =
    normalizeIdentifier(requiredIdRule ? sourceValueForRule(input, row, requiredIdRule) ?? "" : "") ||
    `${path.basename(input.sourcePath)}#row-${rowIndex + 1}`;
  const firstRule = rules[0];
  const observedAt = input.observedAt ?? new Date(0).toISOString();
  const qualityStatus: QualityStatus = validationFindings.some(
    (finding) => finding.severity === "error",
  )
    ? "quarantined"
    : validationFindings.some((finding) => finding.severity === "warning")
      ? "warning"
      : "valid";
  const attributes: Record<string, CanonicalValue> = {};

  for (const rule of rules) {
    if (!rule.targetAttribute) continue;
    const rawValue = sourceValueForRule(input, row, rule);
    if (!hasSourceValue(rawValue)) continue;
    attributes[rule.targetAttribute] = toCanonicalValue(rawValue, rule);
  }

  return {
    tenantKey: input.tenantKey,
    packetVersion: input.packetVersion,
    domain: firstRule.targetDomain,
    objectType: firstRule.targetObjectType,
    sourceObjectId,
    canonicalObjectKey: `${input.tenantKey}:${firstRule.targetObjectType}:${sourceObjectId}`,
    attributes,
    relationships: [],
    evidenceReferences: [
      {
        evidenceKey: `${input.packetId}:${path.basename(input.sourcePath)}:${sourceObjectId}`,
        sourceObjectId,
        excerpt: bestExcerpt(row),
        confidence: 0.8,
      },
    ],
    sourceAuthority: {
      sourceSystem: input.packetFile.sourceProfile,
      sourceType: input.packetFile.sourceClass,
      owner: input.packetFile.evidenceBasis,
      authority:
        input.packetFile.dataStatus === "benchmark"
          ? "benchmark"
          : "self_reported",
    },
    effectiveDate: undefined,
    observedAt,
    confidence: averageConfidence(rules),
    sensitivity: input.packetFile.sensitivity ?? "internal",
    dataStatus: input.packetFile.dataStatus ?? "synthetic",
    qualityStatus,
    validationFindings,
    lineage: [
      {
        step: "source_adapter_dry_run",
        version: "pr3-source-adapter-dry-run/v1",
        at: observedAt,
        adapterKey: input.packetFile.adapterKey,
        mappingProfile: input.mappingProfile,
        contractVersion: "tenant-packet/v1",
        notes: `Dry-run only. Source fingerprint ${contentFingerprint}.`,
      },
    ],
  };
}

function validateRow(
  input: SourceAdapterInput,
  rules: MappingRule[],
  row: Record<string, string>,
  rowNumber: number,
): CanonicalValidationFinding[] {
  return rules
    .filter(
      (rule) => rule.required && isMissingSourceValue(sourceValueForRule(input, row, rule)),
    )
    .map((rule) => ({
      severity: "error",
      code: "required_source_field_missing",
      message: `Required source field ${rule.sourceField}${aliasLabel(rule)} is missing on row ${rowNumber}.`,
      sourceObjectId: `row-${rowNumber}`,
    }));
}

function sourceFieldsForRule(rule: MappingRule): string[] {
  return [rule.sourceField, ...(rule.sourceAliases ?? [])];
}

function sourceValueForRule(
  input: SourceAdapterInput,
  row: Record<string, string>,
  rule: MappingRule,
): string | undefined {
  for (const sourceField of sourceFieldsForRule(rule)) {
    const value = sourceField === DERIVED_SOURCE_PATH_FIELD
      ? input.sourcePath
      : row[sourceField];
    if (hasSourceValue(value)) return value;
  }
  return undefined;
}

function aliasLabel(rule: MappingRule): string {
  const aliases = rule.sourceAliases?.filter((alias) => alias !== DERIVED_SOURCE_PATH_FIELD) ?? [];
  if (aliases.length === 0) return "";
  return ` or alias ${aliases.join("/")}`;
}

export function isMissingSourceValue(value: string | undefined): boolean {
  if (value === undefined) return true;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_");
  return (
    normalized === "" ||
    normalized === "not_loaded" ||
    normalized === "unknown" ||
    // dom-integrity-ignore-line: validator intentionally rejects placeholder input tokens.
    normalized === "tbd" ||
    normalized === "to_be_determined" ||
    normalized === "n_a" ||
    normalized === "na" ||
    normalized === "none" ||
    normalized === "null" ||
    normalized === "sample" ||
    normalized === "lorem_ipsum" ||
    normalized === "placeholder"
  );
}

function hasSourceValue(value: string | undefined): value is string {
  return !isMissingSourceValue(value);
}

function toCanonicalValue(rawValue: string, rule: MappingRule): CanonicalValue {
  const value = rawValue.trim();
  if (rule.transform === "parse_number") {
    return {
      value: Number(value.replace(/,/g, "")),
      valueType: "number",
      confidence: rule.confidenceDefault,
    };
  }
  if (rule.transform === "parse_currency") {
    return {
      value: Number(value.replace(/[$,]/g, "")),
      valueType: "currency",
      unit: "USD",
      confidence: rule.confidenceDefault,
    };
  }
  if (rule.transform === "parse_percent") {
    return {
      value: Number(value.replace("%", "")) / 100,
      valueType: "percent",
      confidence: rule.confidenceDefault,
    };
  }
  if (rule.transform === "parse_date") {
    return { value, valueType: "date", confidence: rule.confidenceDefault };
  }
  if (rule.transform === "split_list") {
    return {
      value: splitList(value),
      valueType: "json",
      confidence: rule.confidenceDefault,
    };
  }
  if (rule.transform === "json") {
    return {
      value: parseLooseJson(value),
      valueType: "json",
      confidence: rule.confidenceDefault,
    };
  }
  if (rule.transform === "normalize_code") {
    return {
      value: normalizeIdentifier(value),
      valueType: "string",
      confidence: rule.confidenceDefault,
    };
  }
  return { value, valueType: "string", confidence: rule.confidenceDefault };
}

function splitList(value: string): string[] {
  return value
    .split(/\s*[|;]\s*/)
    .map((item) => item.trim())
    .filter((item) => !isMissingSourceValue(item));
}

function parseLooseJson(
  value: string,
): string | number | boolean | Record<string, unknown> | unknown[] | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      parsed === null ||
      typeof parsed === "string" ||
      typeof parsed === "number" ||
      typeof parsed === "boolean" ||
      Array.isArray(parsed) ||
      (typeof parsed === "object" && parsed !== null)
    ) {
      return parsed as
        | string
        | number
        | boolean
        | Record<string, unknown>
        | unknown[]
        | null;
    }
    return value;
  } catch {
    return splitList(value);
  }
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function bestExcerpt(row: Record<string, string>): string | undefined {
  return row.excerpt || row.notes || row.entity_name || row.evidence_title;
}

function averageConfidence(rules: MappingRule[]): number {
  const confidences = rules.map((rule) => rule.confidenceDefault ?? 0.75);
  return Number(
    (
      confidences.reduce((sum, value) => sum + value, 0) /
      Math.max(confidences.length, 1)
    ).toFixed(2),
  );
}

function fingerprint(text: string): string {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
}

function roundPercent(value: number): number {
  return Number(value.toFixed(2));
}

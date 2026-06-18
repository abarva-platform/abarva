import yaml from "js-yaml";

import type { ParsedContextFact, ParsedContextRecord } from "./context-commit";
import {
  DIMENSION_FAMILY_MAP,
  type ContextDimension,
  type ContextDimensionFamily,
} from "./types";

export interface YamlLoadResult {
  dimension: ContextDimension;
  dimensionFamily: ContextDimensionFamily;
  records: ParsedContextRecord[];
  facts: ParsedContextFact[];
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("yaml_loader_expected_object");
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "profile"
  );
}

export async function loadYamlToContext(input: {
  yamlText: string;
  tenantKey: string;
  fileName: string;
  templateId: string;
}): Promise<YamlLoadResult> {
  const parsed = asObject(yaml.load(input.yamlText));
  const dimension = String(
    parsed.dimension ?? "enterprise_profile",
  ) as ContextDimension;
  const dimensionFamily =
    (parsed.dimension_family as ContextDimensionFamily | undefined) ??
    DIMENSION_FAMILY_MAP[dimension];
  const canonicalRecordId = `${input.tenantKey}_enterprise_profile`;
  const title =
    stringValue(parsed.company_name).trim() ||
    `${input.tenantKey} enterprise profile`;
  const payload = { ...parsed };

  const record: ParsedContextRecord = {
    canonicalRecordId,
    recordType: "enterprise_profile",
    title,
    sourceRecordId: canonicalRecordId,
    sourceRowNumber: null,
    payload,
    owner: "Strategy Office",
    confidence: 0.9,
  };

  const facts: ParsedContextFact[] = Object.entries(payload)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => ({
      canonicalRecordId,
      factKey: `${canonicalRecordId}:${safeSlug(key)}`,
      factType: `enterprise_profile.${key}`,
      factValue: {
        value,
        raw: stringValue(value),
        key,
        source_state: "synthetic_manifest_loader_backed",
      },
      factText: `${title} - ${key}: ${stringValue(value)}`,
      sourceRecordId: canonicalRecordId,
      sourceRowNumber: null,
      owner: "Strategy Office",
      confidence: 0.9,
    }));

  return {
    dimension,
    dimensionFamily,
    records: [record],
    facts,
  };
}

import { numberFromDb } from "./vendor-contract-portfolio";
import type { SourceContract360Row } from "./types";

export const SOURCE_CATEGORY_RULE_VERSION = "source-category-quality/v1";
export const NEEDS_CLASSIFICATION_CATEGORY = "Needs classification";

export type SourceCategoryQualityState =
  | "clean"
  | "suspect"
  | "conflicted"
  | "reviewed_confirmed"
  | "reviewed_corrected"
  | "unclassified";

export interface SourceContractCategorySemanticRow {
  readonly tenant_key: string;
  readonly contract_id: string;
  readonly source_category: string | null;
  readonly suggested_category: string | null;
  readonly effective_category: string | null;
  readonly category_quality_state: SourceCategoryQualityState;
  readonly category_quality_reason: string;
  readonly category_quality_reasons: readonly string[];
  readonly category_review_status: "not_reviewed" | "reviewed";
  readonly review_status: "not_reviewed" | "reviewed";
  readonly review_ref: string | null;
  readonly category_reviewed_by_role: string | null;
  readonly category_reviewed_at: string | null;
  readonly category_rule_version: string;
}

export interface SourceContractCategoryIssue {
  readonly contractId: string;
  readonly vendorName: string;
  readonly contractName: string;
  readonly sourceCategory: string | null;
  readonly suggestedCategory: string | null;
  readonly effectiveCategory: string | null;
  readonly state: SourceCategoryQualityState;
  readonly reason: string;
  readonly annualValue: number;
}

export interface SourceContractCategoryQualitySummary {
  readonly ruleVersion: string;
  readonly totalRows: number;
  readonly totalAnnualValue: number;
  readonly affectedRows: number;
  readonly affectedAnnualValue: number;
  readonly cleanRows: number;
  readonly cleanOrReviewedRows: number;
  readonly conflictedRows: number;
  readonly suspectRows: number;
  readonly unclassifiedRows: number;
  readonly reviewedRows: number;
  readonly categoryCleanContractPct: number;
  readonly categoryCleanValuePct: number;
  readonly categoryConflictedContractCount: number;
  readonly categoryUnclassifiedContractCount: number;
  readonly categoryReviewedCount: number;
  readonly authorityGate: "lab_warning" | "primary_ready" | "blocked";
  readonly qualityState: "available" | "provisional" | "blocked";
  readonly qualityMessage: string;
  readonly semanticRows: readonly SourceContractCategorySemanticRow[];
  readonly issues: readonly SourceContractCategoryIssue[];
}

interface CategoryRule {
  readonly canonical: string;
  readonly aliases: readonly RegExp[];
  readonly evidence: readonly RegExp[];
}

const CATEGORY_RULES: readonly CategoryRule[] = [
  {
    canonical: "Application managed services",
    aliases: [/application managed services/i, /\bams\b/i, /managed application/i],
    evidence: [/managed application/i, /\bams\b/i, /application support/i, /run support/i, /managed services/i],
  },
  {
    canonical: "Implementation services",
    aliases: [/implementation/i, /consulting/i, /systems integrator/i, /\bsi\b/i],
    evidence: [/implementation/i, /consulting/i, /migration/i, /integration/i, /program delivery/i, /professional services/i],
  },
  {
    canonical: "Cloud platform",
    aliases: [/cloud platform/i, /cloud infrastructure/i, /\biaas\b/i, /\bpaas\b/i],
    evidence: [/cloud/i, /azure/i, /\baws\b/i, /gcp/i, /compute/i, /hosting/i, /infrastructure/i],
  },
  {
    canonical: "Cybersecurity",
    aliases: [/cyber/i, /security/i, /identity/i, /soc/i],
    evidence: [/cyber/i, /security/i, /identity/i, /zero trust/i, /endpoint/i, /threat/i, /siem/i, /vulnerability/i],
  },
  {
    canonical: "Data platform",
    aliases: [/data platform/i, /analytics/i, /\bbi\b/i, /warehouse/i],
    evidence: [/data platform/i, /analytics/i, /\bbi\b/i, /warehouse/i, /lakehouse/i, /etl/i, /snowflake/i, /databricks/i],
  },
  {
    canonical: "Network",
    aliases: [/network/i, /telecom/i, /connectivity/i],
    evidence: [/network/i, /telecom/i, /connectivity/i, /\bwan\b/i, /\blan\b/i, /sd-wan/i],
  },
  {
    canonical: "SaaS",
    aliases: [/\bsaas\b/i, /software as a service/i, /subscription/i],
    evidence: [/\bsaas\b/i, /software as a service/i, /subscription/i, /license/i, /seat/i],
  },
];

export function normalizeContractCategory(value: string | null | undefined): string | null {
  const text = cleanText(value);
  if (!text) return null;
  const matched = CATEGORY_RULES.find((rule) =>
    rule.aliases.some((pattern) => pattern.test(text)),
  );
  return matched?.canonical ?? titleCase(text);
}

export function inferContractCategorySignal(row: SourceContract360Row): string | null {
  const evidenceText = [
    stripVendorName(row.contract_name, row.vendor_name),
    stripVendorName(row.scope_summary, row.vendor_name),
    row.exit_rights_summary,
    row.concentration_note,
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  if (!evidenceText) return null;

  const matches = CATEGORY_RULES
    .map((rule) => ({
      category: rule.canonical,
      hits: rule.evidence.filter((pattern) => pattern.test(evidenceText)).length,
    }))
    .filter((match) => match.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (matches.length === 0) return null;
  if (matches.length > 1 && matches[0].hits === matches[1].hits) return null;
  return matches[0].category;
}

export function evaluateContractCategoryQuality(
  rows: readonly SourceContract360Row[],
): SourceContractCategoryQualitySummary {
  const semanticRows = rows.map(categorySemanticRow);
  const byId = new Map(rows.map((row) => [row.contract_id, row]));
  const issues = semanticRows
    .filter((row) => row.category_quality_state !== "clean")
    .map((row): SourceContractCategoryIssue => {
      const source = byId.get(row.contract_id);
      return {
        contractId: row.contract_id,
        vendorName: source?.vendor_name ?? "Unknown vendor",
        contractName: source?.contract_name ?? row.contract_id,
        sourceCategory: row.source_category,
        suggestedCategory: row.suggested_category,
        effectiveCategory: row.effective_category,
        state: row.category_quality_state,
        reason: row.category_quality_reason,
        annualValue: numberFromDb(source?.annual_value) ?? 0,
      };
    });
  const totalAnnualValue = rows.reduce((total, row) => total + (numberFromDb(row.annual_value) ?? 0), 0);
  const affectedAnnualValue = issues.reduce((total, issue) => total + issue.annualValue, 0);
  const cleanOrReviewedRows = semanticRows.filter((row) =>
    ["clean", "reviewed_confirmed", "reviewed_corrected"].includes(row.category_quality_state),
  );
  const cleanOrReviewedValue = cleanOrReviewedRows.reduce((total, row) => {
    const source = byId.get(row.contract_id);
    return total + (numberFromDb(source?.annual_value) ?? 0);
  }, 0);
  const affectedShare = totalAnnualValue > 0 ? affectedAnnualValue / totalAnnualValue : 0;
  const affectedRowShare = rows.length > 0 ? issues.length / rows.length : 0;
  const cleanContractPct = rows.length > 0 ? cleanOrReviewedRows.length / rows.length : 1;
  const cleanValuePct = totalAnnualValue > 0 ? cleanOrReviewedValue / totalAnnualValue : 1;
  const conflictedRows = semanticRows.filter((row) => row.category_quality_state === "conflicted").length;
  const unclassifiedRows = semanticRows.filter((row) => row.category_quality_state === "unclassified").length;
  const reviewedRows = semanticRows.filter((row) => row.category_review_status === "reviewed").length;
  const qualityState =
    issues.length === 0
      ? "available"
      : affectedShare >= 0.2 || affectedRowShare >= 0.2
        ? "blocked"
        : "provisional";
  const authorityGate =
    cleanContractPct >= 0.9 && cleanValuePct >= 0.95 && conflictedRows === 0
      ? "primary_ready"
      : qualityState === "blocked"
        ? "blocked"
        : "lab_warning";

  return {
    ruleVersion: SOURCE_CATEGORY_RULE_VERSION,
    totalRows: rows.length,
    totalAnnualValue,
    affectedRows: issues.length,
    affectedAnnualValue,
    cleanRows: semanticRows.filter((row) => row.category_quality_state === "clean").length,
    cleanOrReviewedRows: cleanOrReviewedRows.length,
    conflictedRows,
    suspectRows: semanticRows.filter((row) => row.category_quality_state === "suspect").length,
    unclassifiedRows,
    reviewedRows,
    categoryCleanContractPct: cleanContractPct,
    categoryCleanValuePct: cleanValuePct,
    categoryConflictedContractCount: conflictedRows,
    categoryUnclassifiedContractCount: unclassifiedRows,
    categoryReviewedCount: reviewedRows,
    authorityGate,
    qualityState,
    qualityMessage:
      qualityState === "available"
        ? "Category analysis is available. Contract categories reconcile to the semantic rule set."
        : "Category analysis is provisional. Contract and vendor totals reconcile, but the current category assignments have material semantic conflicts. Category-based conclusions are withheld pending review.",
    semanticRows,
    issues,
  };
}

function categorySemanticRow(row: SourceContract360Row): SourceContractCategorySemanticRow {
  const sourceCategory = normalizeContractCategory(row.vendor_category);
  const suggestedCategory = inferContractCategorySignal(row);
  const state = categoryQualityState(sourceCategory, suggestedCategory);
  const reason = categoryQualityReason(state, sourceCategory, suggestedCategory);
  const effectiveCategory = state === "clean" ? sourceCategory : NEEDS_CLASSIFICATION_CATEGORY;

  return {
    tenant_key: row.tenant_key,
    contract_id: row.contract_id,
    source_category: sourceCategory,
    suggested_category: suggestedCategory,
    effective_category: effectiveCategory,
    category_quality_state: state,
    category_quality_reason: reason,
    category_quality_reasons: [reason],
    category_review_status: "not_reviewed",
    review_status: "not_reviewed",
    review_ref: null,
    category_reviewed_by_role: null,
    category_reviewed_at: null,
    category_rule_version: SOURCE_CATEGORY_RULE_VERSION,
  };
}

function categoryQualityState(
  sourceCategory: string | null,
  suggestedCategory: string | null,
): SourceCategoryQualityState {
  if (!sourceCategory && !suggestedCategory) return "unclassified";
  if (!sourceCategory && suggestedCategory) return "suspect";
  if (sourceCategory && !suggestedCategory) return "suspect";
  return sourceCategory === suggestedCategory ? "clean" : "conflicted";
}

function categoryQualityReason(
  state: SourceCategoryQualityState,
  sourceCategory: string | null,
  suggestedCategory: string | null,
): string {
  if (state === "clean") return "Source category agrees with contract evidence.";
  if (state === "conflicted") {
    return `Source category ${sourceCategory ?? "Unclassified"} conflicts with evidence signal ${suggestedCategory ?? "none"}.`;
  }
  if (state === "unclassified") return "No source category or evidence signal is available.";
  if (!sourceCategory) return `No source category; evidence suggests ${suggestedCategory}.`;
  return `Source category ${sourceCategory} lacks a confirming evidence signal.`;
}

function stripVendorName(value: string | null | undefined, vendorName: string | null | undefined): string {
  const text = cleanText(value);
  const vendor = cleanText(vendorName);
  if (!text || !vendor) return text;
  const vendorTokens = vendor
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .map(escapeRegExp);
  if (vendorTokens.length === 0) return text;
  return text.replace(new RegExp(`\\b(${vendorTokens.join("|")})\\b`, "gi"), " ");
}

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

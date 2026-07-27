#!/usr/bin/env node
// Gate 2 of the evidence-v4 workstream (read-only). Answers a different
// question than quality-depth-rules.json's minRows floor: not "are there
// enough rows" but "is the content substantive, distinct, connected, and
// usable". A row count is only a structural-depth signal and must never, by
// itself, produce semantic_pass -- see semantic-quality-rules.json, the
// declarative contract this script is the only reader of.
//
// HARD GUARANTEES:
// - Zero writes to active/current, tenant-input-registry.json, Postgres, or
//   any runtime path. Output lands only under reports/tenant-semantic-quality/.
// - Zero Claude calls, zero candidate regeneration, zero v4 promotion.
// - Rules are declarative; this script does not silently tune a threshold to
//   make a tenant pass -- a semantic_blocker is a valid, expected outcome.
//
// Run: node scripts/audit/tenant-input-semantic-quality.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Papa from "papaparse";
import { VALID_DIMENSION_KEYS } from "../data-build/evidence-v4-migration-dry-run.mjs";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tenant-semantic-quality");
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const v3Manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json"), "utf8"),
);
const v4Manifest = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/template-manifest.json"),
    "utf8",
  ),
);
const qualityDepthRules = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/quality-depth-rules.json"), "utf8"),
);
const semanticRules = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/semantic-quality-rules.json"),
    "utf8",
  ),
);
const migrationSummary = JSON.parse(fs.readFileSync(path.join(repoRoot, "reports/evidence-v4-migration/all-tenant-migration-summary.json"), "utf8"));
const migrationDir = path.join(repoRoot, "reports/evidence-v4-migration");

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function nonBlank(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function wordCount(value) {
  const t = String(value ?? "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

// --- CSV loading ---
function readCsvFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const headerColumns = firstLine.split(",").map((c) => c.trim());
  return { rows: parsed.data, columns: parsed.data.length > 0 ? Object.keys(parsed.data[0]) : headerColumns, hash: sha256(text) };
}

function domainFileForTenant(tenantRoot, numericPrefix) {
  const dir = path.join(repoRoot, tenantRoot);
  if (!fs.existsSync(dir)) return null;
  const match = fs.readdirSync(dir).find((f) => f.startsWith(`${numericPrefix}_`) && f.endsWith(".csv"));
  return match ? path.join(dir, match) : null;
}

function auxiliaryFilesForTenant(tenantRoot) {
  const dir = path.join(repoRoot, tenantRoot);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^SA\d{2}_/.test(f) && f.endsWith(".csv"))
    .map((f) => ({ name: f.replace(/\.csv$/, ""), path: path.join(dir, f) }));
}

// --- Placeholder detection ---
const PLACEHOLDER_REGEXES = semanticRules.placeholderPatterns.map((p) => new RegExp(p, "i"));
function matchesPlaceholder(value) {
  const t = normalizeText(value);
  if (!t) return false;
  return PLACEHOLDER_REGEXES.some((re) => re.test(t));
}

// --- Identity / substantive row logic ---
function rowIdentityValue(row, identityFields) {
  for (const f of identityFields || []) {
    if (nonBlank(row[f])) return String(row[f]).trim();
  }
  return "";
}

function countRealContent(row, fields) {
  return (fields || []).filter((f) => nonBlank(row[f]) && !matchesPlaceholder(row[f])).length;
}

function countNonBlank(row, fields) {
  return (fields || []).filter((f) => nonBlank(row[f])).length;
}

function isRowSubstantive(domainKey, row, rule) {
  const hasIdentity = nonBlank(rowIdentityValue(row, rule.identityFields));
  if (!hasIdentity) return false;
  if (domainKey === "industry_context_patterns") {
    const hasContext = nonBlank(row.business_context) && !matchesPlaceholder(row.business_context);
    const hasOneMore = ["applicability", "evidence_basis", "caveats", "module_next_actions"].some(
      (f) => nonBlank(row[f]) && !matchesPlaceholder(row[f]),
    );
    return hasContext && hasOneMore;
  }
  const realContent = countRealContent(row, rule.substantiveFields || []);
  return realContent >= (rule.substantiveMinCount ?? 2);
}

// --- Duplicate detection ---
function extraDuplicates(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let extra = 0;
  for (const c of counts.values()) if (c > 1) extra += c - 1;
  return extra;
}

const ENVELOPE_COLUMNS = new Set([
  "tenant_key", "source_file", "source_date", "confidence", "known_gaps",
  "original_source_file", "original_packet", "original_row_number", "original_row_id",
  "source_classification", "source_fingerprint", "consolidation_rule_used", "conflict_status",
]);

function exactDuplicateKey(row, columns) {
  const payloadCols = columns.filter((c) => !ENVELOPE_COLUMNS.has(c));
  const values = payloadCols.map((c) => normalizeText(row[c]));
  if (values.every((v) => !v)) return "";
  return values.join("|");
}

function normalizedContentKey(row, rule) {
  const identity = normalizeText(rowIdentityValue(row, rule.identityFields));
  if (!identity) return "";
  const substantive = (rule.substantiveFields || []).map((f) => normalizeText(row[f]));
  return [identity, ...substantive].join("|");
}

// --- Manifest / rule-universe assertion (Gate 2 section 1) ---
function buildEffectiveDomainSet() {
  const set = semanticRules.effectiveDomainSet;
  return [...set.unchangedFromV3, ...set.revisedInV4, ...set.v4Additions];
}

function assertRuleUniverse() {
  const effectiveDomains = buildEffectiveDomainSet();
  const declaredRuleKeys = Object.keys(semanticRules.domains);
  const missingRules = effectiveDomains.filter((d) => !declaredRuleKeys.includes(d));
  const unknownRules = declaredRuleKeys.filter((d) => !effectiveDomains.includes(d));
  const v3ManifestDomainKeys = v3Manifest.templates.map((t) => t.file.replace(/^\d{2}_/, "").replace(/\.csv$/, ""));
  const v4AdditionKeys = v4Manifest.templates.filter((t) => t.file !== "13_evidence_sources.csv").map((t) => t.file.replace(/^\d{2}_/, "").replace(/\.csv$/, ""));
  const domainsNotInAnyManifest = effectiveDomains.filter(
    (d) => !v3ManifestDomainKeys.includes(d) && !v4AdditionKeys.includes(d) && d !== "evidence_sources",
  );
  const universe = {
    generated_by: "scripts/audit/tenant-input-semantic-quality.mjs",
    effective_domain_count: effectiveDomains.length,
    canonical_v3_unchanged_domains: semanticRules.effectiveDomainSet.unchangedFromV3,
    v4_revised_domains: semanticRules.effectiveDomainSet.revisedInV4,
    v4_addition_domains: semanticRules.effectiveDomainSet.v4Additions,
    auxiliary_noncanonical_domains: semanticRules.auxiliaryNoncanonicalDomains,
    every_effective_domain_has_a_rule: missingRules.length === 0,
    missing_rules_for_domains: missingRules,
    every_rule_points_to_a_known_domain: unknownRules.length === 0,
    rules_pointing_to_unknown_domains: unknownRules,
    every_effective_domain_traces_to_a_manifest: domainsNotInAnyManifest.length === 0,
    domains_not_in_any_manifest: domainsNotInAnyManifest,
    canonical_and_auxiliary_universes_are_disjoint: semanticRules.auxiliaryNoncanonicalDomains.every((a) => !effectiveDomains.includes(a)),
  };
  if (missingRules.length > 0) {
    throw new Error(`Gate 2 rule-universe assertion failed: effective domains with no semantic rule: ${missingRules.join(", ")}`);
  }
  if (unknownRules.length > 0) {
    throw new Error(`Gate 2 rule-universe assertion failed: semantic rules pointing to unknown domains: ${unknownRules.join(", ")}`);
  }
  return universe;
}

// --- Generic per-domain metric computation ---
function evaluateGenericDomain(domainKey, rule, rows, columns, tenant) {
  const rawRowCount = rows.length;
  const identityFieldsPresent = (rule.identityFields || []).some((f) => columns.includes(f));
  const shapeMismatch = rawRowCount > 0 && !identityFieldsPresent;

  if (shapeMismatch) {
    return {
      domain: domainKey,
      raw_row_count: rawRowCount,
      shape_mismatch: true,
      columns_present: columns,
      semantic_status: "semantic_blocker",
      blocking_reasons: [
        `schema_shape_mismatch: none of this domain's declared identity fields (${(rule.identityFields || []).join(", ")}) ` +
          `are present in the active file's columns (${columns.slice(0, 12).join(", ")}${columns.length > 12 ? ", ..." : ""}). ` +
          `Identity/substantive-field rules cannot be evaluated against a schema this different from the v3 canonical shape.`,
      ],
      recommended_remediation:
        "Normalize this tenant's active file to the v3 canonical schema for this domain, or declare an explicit alias mapping " +
        "in semantic-quality-rules.json for this tenant's known alternate shape. Do not silently reinterpret unfamiliar columns.",
    };
  }

  if (rawRowCount === 0) {
    const notApplicable = Boolean(rule.notApplicableWhen);
    return {
      domain: domainKey,
      raw_row_count: 0,
      semantic_status: notApplicable ? "not_applicable" : "semantic_blocker",
      blocking_reasons: notApplicable ? [] : ["zero_rows: this domain is required and has no data for this tenant"],
      not_applicable_rationale: notApplicable ? rule.notApplicableWhen : undefined,
      recommended_remediation: notApplicable ? "" : "Load at least one real row for this required domain before semantic validation can pass.",
    };
  }

  const identityBearingRows = rows.filter((r) => nonBlank(rowIdentityValue(r, rule.identityFields)));
  const distinctIdentities = new Set(identityBearingRows.map((r) => normalizeText(rowIdentityValue(r, rule.identityFields))));
  const substantiveRows = rows.filter((r) => isRowSubstantive(domainKey, r, rule));
  const placeholderOnlyRows = identityBearingRows.filter((r) => {
    const nonBlankCount = countNonBlank(r, rule.substantiveFields || []);
    const realCount = countRealContent(r, rule.substantiveFields || []);
    return nonBlankCount > 0 && realCount === 0;
  });
  const lineageOnlyRows = identityBearingRows.filter((r) => countNonBlank(r, rule.substantiveFields || []) === 0);

  const requiredFieldCoverage = {};
  for (const f of rule.requiredFields || []) {
    requiredFieldCoverage[f] = pct(rows.filter((r) => nonBlank(r[f])).length, rawRowCount);
  }

  const exactDupCount = extraDuplicates(rows, (r) => exactDuplicateKey(r, columns));
  const normalizedDupCount = extraDuplicates(rows, (r) => normalizedContentKey(r, rule));

  const ownerCoveragePct = rule.ownerField ? pct(rows.filter((r) => nonBlank(r[rule.ownerField])).length, rawRowCount) : null;
  const dateCoveragePct = rule.dateField ? pct(rows.filter((r) => nonBlank(r[rule.dateField])).length, rawRowCount) : null;
  const confidenceCoveragePct = rule.confidenceField ? pct(rows.filter((r) => nonBlank(r[rule.confidenceField])).length, rawRowCount) : null;

  const enumResults = {};
  for (const [field, allowed] of Object.entries(rule.enumerations || semanticRules.commonEnumerations || {})) {
    if (!columns.includes(field)) continue;
    const nonBlankRows = rows.filter((r) => nonBlank(r[field]));
    if (nonBlankRows.length === 0) continue;
    const validRows = nonBlankRows.filter((r) => allowed.includes(String(r[field]).trim().toLowerCase()) || allowed.includes(String(r[field]).trim()));
    enumResults[field] = { checked: nonBlankRows.length, valid: validRows.length, valid_rate_pct: pct(validRows.length, nonBlankRows.length) };
  }

  const identityCoveragePct = pct(identityBearingRows.length, rawRowCount);
  const substantiveCoveragePct = pct(substantiveRows.length, rawRowCount);
  const placeholderRatePct = pct(placeholderOnlyRows.length, rawRowCount);
  const lineageOnlyRatePct = pct(lineageOnlyRows.length, rawRowCount);
  const normalizedDuplicateRatePct = pct(normalizedDupCount, rawRowCount);

  const bandMinRows = qualityDepthRules.companySizeBands?.[tenant.companySizeBand]?.minRows?.[domainKey];
  const minimumDistinctIdentities = rule.isSingleRowProfile ? 1 : rule.minimumDistinctIdentities ?? bandMinRows ?? null;

  return {
    domain: domainKey,
    raw_row_count: rawRowCount,
    distinct_identity_count: distinctIdentities.size,
    identity_bearing_rows: identityBearingRows.length,
    identity_coverage_pct: identityCoveragePct,
    substantive_rows: substantiveRows.length,
    substantive_coverage_pct: substantiveCoveragePct,
    required_field_coverage: requiredFieldCoverage,
    exact_duplicate_count: exactDupCount,
    normalized_content_duplicate_count: normalizedDupCount,
    normalized_duplicate_pct: normalizedDuplicateRatePct,
    placeholder_only_rows: placeholderOnlyRows.length,
    placeholder_rate_pct: placeholderRatePct,
    lineage_or_status_only_rows: lineageOnlyRows.length,
    lineage_only_rate_pct: lineageOnlyRatePct,
    owner_coverage_pct: ownerCoveragePct,
    date_coverage_pct: dateCoveragePct,
    confidence_coverage_pct: confidenceCoveragePct,
    enum_validation: enumResults,
    minimum_distinct_identities_required: minimumDistinctIdentities,
    meets_minimum_distinct_identities: minimumDistinctIdentities === null ? null : distinctIdentities.size >= minimumDistinctIdentities,
  };
}

function determineSemanticStatus(domainKey, rule, metrics) {
  if (metrics.semantic_status) return metrics; // shape_mismatch / not_applicable / zero-row blocker already decided
  const thresholds = { ...semanticRules.defaultThresholds };
  const blockingReasons = [];

  // Hard blocker conditions -- never demoted to partial regardless of row count.
  if (metrics.identity_coverage_pct < 50) {
    blockingReasons.push(`no_usable_identity: only ${metrics.identity_coverage_pct}% of rows carry a real identity value (floor: 50%)`);
  }
  if (metrics.substantive_rows === 0) {
    blockingReasons.push(`substantively_empty_despite_row_count: ${metrics.raw_row_count} rows, 0 pass the substantive-row rule for ${domainKey}`);
  }
  if (metrics.placeholder_rate_pct >= 50) {
    blockingReasons.push(`placeholder_dominant: ${metrics.placeholder_rate_pct}% of identity-bearing rows have only placeholder content (floor: 50%)`);
  }

  if (blockingReasons.length > 0) {
    return {
      ...metrics,
      semantic_status: "semantic_blocker",
      blocking_reasons: blockingReasons,
      recommended_remediation: `Governed data enrichment required: real, non-placeholder ${domainKey} content is missing for most rows, not just a formatting gap.`,
    };
  }

  // Partial conditions -- real content exists but one or more quality bars are unmet.
  const partialReasons = [];
  if (metrics.identity_coverage_pct < thresholds.minimumIdentityCoveragePct) {
    partialReasons.push(`identity_coverage_pct ${metrics.identity_coverage_pct}% below minimum ${thresholds.minimumIdentityCoveragePct}%`);
  }
  if (metrics.substantive_coverage_pct < thresholds.minimumSubstantiveCoveragePct) {
    partialReasons.push(`substantive_coverage_pct ${metrics.substantive_coverage_pct}% below minimum ${thresholds.minimumSubstantiveCoveragePct}%`);
  }
  if (metrics.placeholder_rate_pct > thresholds.maximumPlaceholderRatePct) {
    partialReasons.push(`placeholder_rate_pct ${metrics.placeholder_rate_pct}% above maximum ${thresholds.maximumPlaceholderRatePct}%`);
  }
  if (metrics.lineage_only_rate_pct > thresholds.maximumLineageOnlyRatePct) {
    partialReasons.push(`lineage_only_rate_pct ${metrics.lineage_only_rate_pct}% above maximum ${thresholds.maximumLineageOnlyRatePct}%`);
  }
  if (metrics.normalized_duplicate_pct > thresholds.maximumNormalizedDuplicateRatePct) {
    partialReasons.push(`normalized_duplicate_pct ${metrics.normalized_duplicate_pct}% above maximum ${thresholds.maximumNormalizedDuplicateRatePct}%`);
  }
  if (metrics.meets_minimum_distinct_identities === false) {
    partialReasons.push(
      `distinct_identity_count ${metrics.distinct_identity_count} below minimum ${metrics.minimum_distinct_identities_required} for this company-size band`,
    );
  }
  for (const [field, req] of Object.entries(rule.requiredFields ? Object.fromEntries(rule.requiredFields.map((f) => [f, true])) : {})) {
    void req;
    const coverage = metrics.required_field_coverage?.[field];
    if (coverage !== undefined && coverage < thresholds.minimumIdentityCoveragePct) {
      partialReasons.push(`required field "${field}" only ${coverage}% covered`);
    }
  }

  if (partialReasons.length > 0) {
    return {
      ...metrics,
      semantic_status: "semantic_partial",
      blocking_reasons: partialReasons,
      recommended_remediation: `Usable evidence exists but does not yet meet the semantic-quality bar: ${partialReasons[0]}. Caveat any Knowledge content drawn from this domain.`,
    };
  }

  return { ...metrics, semantic_status: "semantic_pass", blocking_reasons: [], recommended_remediation: "" };
}

// --- Evidence-sources special rules (Gate 2 section 6) ---
function evaluateEvidenceSources(tenant, rows) {
  const rawRowCount = rows.length;
  const distinctSourceVersionIds = new Set(rows.map((r) => r.source_version_id).filter(Boolean));
  const distinctSourceIds = new Set(rows.map((r) => r.source_id).filter(Boolean));
  const duplicateSourceVersionIds = rawRowCount - distinctSourceVersionIds.size;
  // A source_ref pointing at the evidence_sources registry file itself is
  // the ORIGINAL PR-A/Gate-1.1 defect (consolidation overwrote source_ref
  // with its own output path, destroying real business identity) UNLESS
  // source_kind is context_bundle/registry_snapshot -- Gate 1.2 deliberately
  // makes the active registry file itself the source identity for those
  // shapes (e.g. meridian-health's legacy_context_bundle), which is correct
  // by design, not a regression of the original defect.
  const selfReferentialSourceRef = rows.filter(
    (r) => /(^|\/)13_evidence_sources\.csv$/i.test(String(r.source_ref || "").trim()) && !["context_bundle", "registry_snapshot"].includes(r.source_kind),
  );
  const blankFingerprintUnexplained = rows.filter((r) => !nonBlank(r.content_fingerprint) && !nonBlank(r.quality_notes));
  const invalidSourceKind = rows.filter((r) => nonBlank(r.source_kind) && !semanticRules.domains.evidence_sources.enumerations.source_kind.includes(r.source_kind));
  const supersedesUnresolved = rows.filter((r) => nonBlank(r.supersedes_source_version_id) && !distinctSourceVersionIds.has(r.supersedes_source_version_id));
  const ownerCoveragePct = pct(rows.filter((r) => nonBlank(r.source_owner)).length, rawRowCount);
  const dateCoveragePct = pct(rows.filter((r) => nonBlank(r.source_date) || nonBlank(r.as_of_date)).length, rawRowCount);
  const confidentialityCoveragePct = pct(rows.filter((r) => nonBlank(r.confidentiality)).length, rawRowCount);
  const statusCoveragePct = pct(rows.filter((r) => nonBlank(r.approved_for_loading)).length, rawRowCount);
  const migrationRow = migrationSummary.tenants.find((t) => t.tenant_key === tenant.tenantKey) || {};

  const blockingReasons = [];
  if (duplicateSourceVersionIds > 0) blockingReasons.push(`${duplicateSourceVersionIds} duplicate source_version_id values -- source-version identity is not unique`);
  if (selfReferentialSourceRef.length > 0) blockingReasons.push(`${selfReferentialSourceRef.length} rows whose source_ref points back at the evidence_sources registry file itself, not a real source artifact`);
  if (invalidSourceKind.length > 0) blockingReasons.push(`${invalidSourceKind.length} rows with a source_kind outside the declared enumeration`);
  if ((migrationRow.blocking_source_metadata_conflicts ?? 0) > 0) blockingReasons.push(`${migrationRow.blocking_source_metadata_conflicts} unresolved source-metadata conflicts from Gate 1.2`);

  const partialReasons = [];
  if (blankFingerprintUnexplained.length > 0) partialReasons.push(`${blankFingerprintUnexplained.length} sources have a blank content_fingerprint with no quality_notes explanation`);
  if (supersedesUnresolved.length > 0) partialReasons.push(`${supersedesUnresolved.length} supersedes_source_version_id values do not resolve to a real source_version_id`);
  if (ownerCoveragePct < semanticRules.defaultThresholds.minimumOwnerCoveragePct) partialReasons.push(`source_owner coverage ${ownerCoveragePct}% below ${semanticRules.defaultThresholds.minimumOwnerCoveragePct}%`);

  const status = blockingReasons.length > 0 ? "semantic_blocker" : partialReasons.length > 0 ? "semantic_partial" : "semantic_pass";

  return {
    domain: "evidence_sources",
    raw_row_count: rawRowCount,
    distinct_source_id_count: distinctSourceIds.size,
    distinct_source_version_id_count: distinctSourceVersionIds.size,
    duplicate_source_version_ids: duplicateSourceVersionIds,
    self_referential_source_ref_count: selfReferentialSourceRef.length,
    blank_fingerprint_unexplained_count: blankFingerprintUnexplained.length,
    invalid_source_kind_count: invalidSourceKind.length,
    supersedes_unresolved_count: supersedesUnresolved.length,
    source_owner_coverage_pct: ownerCoveragePct,
    source_date_coverage_pct: dateCoveragePct,
    confidentiality_coverage_pct: confidentialityCoveragePct,
    approval_status_coverage_pct: statusCoveragePct,
    blocking_source_metadata_conflicts_from_gate_1_2: migrationRow.blocking_source_metadata_conflicts ?? null,
    semantic_status: status,
    blocking_reasons: [...blockingReasons, ...partialReasons],
    recommended_remediation: status === "semantic_pass" ? "" : blockingReasons.length > 0 ? "Code fix: evidence-v4-migration-dry-run.mjs source-identity resolution." : "Governed data enrichment: real content fingerprints / owner attestation.",
  };
}

// --- Evidence-items special rules (Gate 2 section 7) ---
function evaluateEvidenceItems(tenant, rows, evidenceSourceVersionIds) {
  const rawRowCount = rows.length;
  const distinctEvidenceIds = new Set(rows.map((r) => r.evidence_id).filter(Boolean));
  const duplicateEvidenceIds = rawRowCount - distinctEvidenceIds.size;
  const orphanItems = rows.filter((r) => !evidenceSourceVersionIds.has(r.source_version_id));
  const blankSummary = rows.filter((r) => !nonBlank(r.evidence_summary));
  const locatorShapedSummary = rows.filter((r) => nonBlank(r.evidence_summary) && wordCount(r.evidence_summary) <= 2);
  const blankLocator = rows.filter((r) => !nonBlank(r.locator));
  const invalidLocatorType = rows.filter((r) => nonBlank(r.locator_type) && !semanticRules.domains.evidence_items.enumerations.locator_type.includes(r.locator_type));
  const invalidEvidenceType = rows.filter((r) => nonBlank(r.evidence_type) && !semanticRules.domains.evidence_items.enumerations.evidence_type.includes(r.evidence_type));
  const invalidClassification = rows.filter((r) => nonBlank(r.classification) && !semanticRules.domains.evidence_items.enumerations.classification.includes(r.classification));

  let dimensionsAssigned = 0;
  let dimensionsInvalid = 0;
  const invalidDimensionKeys = new Set();
  for (const r of rows) {
    const keys = String(r.dimension_keys || "").split("|").map((k) => k.trim()).filter(Boolean);
    if (keys.length > 0) dimensionsAssigned += 1;
    for (const k of keys) {
      if (!VALID_DIMENSION_KEYS.has(k)) {
        dimensionsInvalid += 1;
        invalidDimensionKeys.add(k);
      }
    }
  }

  const businessObjectRefCoveragePct = pct(rows.filter((r) => nonBlank(r.business_object_refs)).length, rawRowCount);
  const normalizedSummaryDupCount = extraDuplicates(rows, (r) => {
    const norm = normalizeText(r.evidence_summary);
    return norm ? `${r.source_version_id}|${norm}` : "";
  });

  const direct = rows.filter((r) => r.evidence_type !== "interview_signal");
  const interviewDerived = rows.filter((r) => r.evidence_type === "interview_signal");

  const blockingReasons = [];
  if (duplicateEvidenceIds > 0) blockingReasons.push(`${duplicateEvidenceIds} duplicate evidence_id values`);
  if (orphanItems.length > 0) blockingReasons.push(`${orphanItems.length} evidence items whose source_version_id does not resolve to any evidence source (orphan claim)`);
  if (blankLocator.length > 0) blockingReasons.push(`${blankLocator.length} evidence items with a blank locator`);
  if (blankSummary.length > 0) blockingReasons.push(`${blankSummary.length} evidence items with a blank evidence_summary`);

  const partialReasons = [];
  const locatorShapedRatePct = pct(locatorShapedSummary.length, rawRowCount);
  if (locatorShapedRatePct > 20) {
    partialReasons.push(`${locatorShapedRatePct}% of evidence items carry a bare locator/file-path as their summary, not real narrative content (>2 words)`);
  }
  if (invalidLocatorType.length > 0) partialReasons.push(`${invalidLocatorType.length} items with an invalid locator_type`);
  if (invalidEvidenceType.length > 0) partialReasons.push(`${invalidEvidenceType.length} items with an invalid evidence_type`);
  if (invalidClassification.length > 0) partialReasons.push(`${invalidClassification.length} items with an invalid classification`);
  if (dimensionsInvalid > 0) partialReasons.push(`${dimensionsInvalid} dimension_keys values not in the real 38-key catalog: ${[...invalidDimensionKeys].join(", ")}`);
  if (normalizedSummaryDupCount > 0) partialReasons.push(`${normalizedSummaryDupCount} evidence items are normalized-content duplicates of another item under the same source`);
  const dimensionCoveragePct = pct(dimensionsAssigned, rawRowCount);
  if (dimensionCoveragePct < 50) partialReasons.push(`only ${dimensionCoveragePct}% of evidence items have any dimension_keys assigned`);

  const status = blockingReasons.length > 0 ? "semantic_blocker" : partialReasons.length > 0 ? "semantic_partial" : "semantic_pass";

  return {
    domain: "evidence_items",
    raw_row_count: rawRowCount,
    direct_evidence_items: direct.length,
    interview_derived_evidence_items: interviewDerived.length,
    distinct_evidence_id_count: distinctEvidenceIds.size,
    duplicate_evidence_ids: duplicateEvidenceIds,
    orphan_items_count: orphanItems.length,
    blank_summary_count: blankSummary.length,
    locator_shaped_summary_count: locatorShapedSummary.length,
    locator_shaped_summary_rate_pct: locatorShapedRatePct,
    blank_locator_count: blankLocator.length,
    invalid_locator_type_count: invalidLocatorType.length,
    invalid_evidence_type_count: invalidEvidenceType.length,
    invalid_classification_count: invalidClassification.length,
    dimension_coverage_pct: dimensionCoveragePct,
    invalid_dimension_key_count: dimensionsInvalid,
    invalid_dimension_keys_observed: [...invalidDimensionKeys],
    business_object_refs_coverage_pct: businessObjectRefCoveragePct,
    normalized_summary_duplicate_count: normalizedSummaryDupCount,
    semantic_status: status,
    blocking_reasons: [...blockingReasons, ...partialReasons],
    recommended_remediation:
      status === "semantic_pass"
        ? ""
        : blockingReasons.length > 0
          ? "Code fix: evidence-v4-migration-dry-run.mjs item resolution/locator handling."
          : "Governed data enrichment: real narrative evidence_summary content and dimension routing, not just locators.",
  };
}

// --- Executive-interviews special rules (Gate 2 section 8) ---
function evaluateExecutiveInterviews(tenant, rows, evidenceSourceVersionIds, evidenceItemRows) {
  const rawRowCount = rows.length;
  if (rawRowCount === 0) {
    return {
      domain: "executive_interviews",
      raw_row_count: 0,
      semantic_status: "not_applicable",
      blocking_reasons: [],
      not_applicable_rationale: "No interview evidence was recovered for this tenant -- an honest not_applicable, not a fabricated finding.",
      recommended_remediation: "",
    };
  }
  const distinctInterviewIds = new Set(rows.map((r) => r.interview_id).filter(Boolean));
  const duplicateInterviewIds = rawRowCount - distinctInterviewIds.size;
  const orphanInterviews = rows.filter((r) => !evidenceSourceVersionIds.has(r.source_version_id));
  const blankStakeholderRole = rows.filter((r) => !nonBlank(r.stakeholder_role));
  const blankQuestion = rows.filter((r) => !nonBlank(r.question));
  const blankOrPlaceholderAnswer = rows.filter((r) => !nonBlank(r.answer) || matchesPlaceholder(r.answer) || wordCount(r.answer) <= 3);
  const noSignalField = rows.filter(
    (r) => !["priority_theme", "pain_point", "initiative_link", "business_priority", "evidence_needed"].some((f) => nonBlank(r[f])),
  );
  const invalidConfidence = rows.filter((r) => nonBlank(r.confidence) && !semanticRules.domains.executive_interviews.enumerations.confidence.includes(String(r.confidence).toLowerCase()));
  const invalidApproval = rows.filter((r) => nonBlank(r.approval_status) && !semanticRules.domains.executive_interviews.enumerations.approval_status.includes(r.approval_status));

  // The v4-candidate executive_interviews schema carries no evidence_id or
  // source_record_id column pointing back to its derived evidence_items row
  // -- confirmed against datasets/tenant-inputs/templates/universal/
  // standard-2026-07-v4-candidate/template-manifest.json's column list.
  // Correspondence exists only positionally inside evidence-v4-migration-
  // dry-run.mjs's row loop, not as a persisted, auditable foreign key -- so
  // this is measured as a count reconciliation, not a fabricated per-row
  // match against a column that doesn't exist.
  const interviewDerivedItemCount = evidenceItemRows.filter((i) => i.evidence_type === "interview_signal").length;
  const interviewToEvidenceItemCountGap = rawRowCount - interviewDerivedItemCount;
  const rowLevelForeignKeyPersistedInSchema = false;

  const stakeholderRoleDiversity = new Set(rows.map((r) => normalizeText(r.stakeholder_role))).size;
  const executiveAreaDiversity = new Set(rows.map((r) => normalizeText(r.executive_area))).size;
  const questionDiversity = new Set(rows.map((r) => normalizeText(r.question))).size;
  const answerDistinctCount = new Set(rows.map((r) => normalizeText(r.answer))).size;
  const distinctPriorityThemes = new Set(rows.map((r) => normalizeText(r.priority_theme)).filter(Boolean)).size;
  const distinctPainPoints = new Set(rows.map((r) => normalizeText(r.pain_point)).filter(Boolean)).size;
  const distinctInitiativeLinks = new Set(rows.map((r) => normalizeText(r.initiative_link)).filter(Boolean)).size;

  // Template-word fraction: for each question_id, find words that recur in
  // >=60% of the answers given to THAT question (grouping by question since
  // different questions legitimately use different vocabulary), then measure
  // what share of an answer's total words are such recurring "scaffold"
  // words vs distinctive content. A high fraction means many rows are the
  // same templated sentence with different entity names substituted in, not
  // independent insights -- this survives even when every answer string is
  // technically unique (which per-row exact-match dedup would miss).
  function tokenize(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  }
  const byQuestionId = new Map();
  for (const r of rows) {
    const qid = r.question_id || "__no_question_id__";
    if (!byQuestionId.has(qid)) byQuestionId.set(qid, []);
    byQuestionId.get(qid).push(r);
  }
  let totalWords = 0;
  let totalTemplateWords = 0;
  for (const group of byQuestionId.values()) {
    if (group.length < 2) continue; // need at least 2 samples to detect recurrence
    const tokenizedAnswers = group.map((r) => tokenize(r.answer));
    const documentFrequency = new Map();
    for (const tokens of tokenizedAnswers) {
      for (const w of new Set(tokens)) documentFrequency.set(w, (documentFrequency.get(w) || 0) + 1);
    }
    for (const tokens of tokenizedAnswers) {
      totalWords += tokens.length;
      totalTemplateWords += tokens.filter((w) => (documentFrequency.get(w) || 0) / group.length >= 0.6).length;
    }
  }
  const distinctAnswerCount = new Set(rows.map((r) => normalizeText(r.answer))).size;
  const templateWordFractionPct = pct(totalTemplateWords, totalWords);

  const blockingReasons = [];
  if (duplicateInterviewIds > 0) blockingReasons.push(`${duplicateInterviewIds} duplicate interview_id values`);
  if (orphanInterviews.length > 0) blockingReasons.push(`${orphanInterviews.length} interviews whose source_version_id does not resolve`);
  if (pct(blankStakeholderRole.length, rawRowCount) > 10) blockingReasons.push(`${blankStakeholderRole.length} interviews with a blank stakeholder_role`);
  if (pct(blankQuestion.length, rawRowCount) > 10) blockingReasons.push(`${blankQuestion.length} interviews with a blank question`);
  if (pct(blankOrPlaceholderAnswer.length, rawRowCount) >= 50) blockingReasons.push(`${pct(blankOrPlaceholderAnswer.length, rawRowCount)}% of answers are blank, placeholder, or under 4 words (floor: 50%)`);

  const partialReasons = [];
  if (noSignalField.length > 0) partialReasons.push(`${noSignalField.length} interviews carry none of priority_theme/pain_point/initiative_link/business_priority/evidence_needed`);
  if (invalidConfidence.length > 0) partialReasons.push(`${invalidConfidence.length} interviews with an invalid confidence value`);
  if (invalidApproval.length > 0) partialReasons.push(`${invalidApproval.length} interviews with an invalid approval_status`);
  if (interviewToEvidenceItemCountGap !== 0) {
    partialReasons.push(
      `${Math.abs(interviewToEvidenceItemCountGap)} interview rows and interview-derived evidence items don't reconcile 1:1 ` +
        `(${rawRowCount} interviews vs ${interviewDerivedItemCount} interview-derived items)`,
    );
  }
  if (!rowLevelForeignKeyPersistedInSchema) {
    partialReasons.push(
      "the v4-candidate executive_interviews schema has no persisted foreign key (evidence_id/source_record_id) back to its derived " +
        "evidence_items row -- correspondence exists only positionally inside the migration script, not as an auditable column",
    );
  }
  if (templateWordFractionPct > 55) {
    partialReasons.push(
      `${templateWordFractionPct}% of answer words are scaffold words recurring in 60%+ of same-question answers -- ` +
        `${distinctAnswerCount} lexically distinct answers across ${rawRowCount} rows still share one heavily templated sentence structure, not ${rawRowCount} independent insights`,
    );
  }
  if (questionDiversity < 5 && rawRowCount >= 20) partialReasons.push(`only ${questionDiversity} distinct questions asked across ${rawRowCount} interview rows`);

  const status = blockingReasons.length > 0 ? "semantic_blocker" : partialReasons.length > 0 ? "semantic_partial" : "semantic_pass";

  return {
    domain: "executive_interviews",
    raw_row_count: rawRowCount,
    distinct_interview_id_count: distinctInterviewIds.size,
    duplicate_interview_ids: duplicateInterviewIds,
    orphan_interviews_count: orphanInterviews.length,
    blank_stakeholder_role_count: blankStakeholderRole.length,
    blank_question_count: blankQuestion.length,
    blank_or_placeholder_answer_count: blankOrPlaceholderAnswer.length,
    no_signal_field_count: noSignalField.length,
    invalid_confidence_count: invalidConfidence.length,
    invalid_approval_status_count: invalidApproval.length,
    interview_derived_evidence_item_count: interviewDerivedItemCount,
    interview_to_evidence_item_count_gap: interviewToEvidenceItemCountGap,
    row_level_foreign_key_persisted_in_schema: rowLevelForeignKeyPersistedInSchema,
    stakeholder_role_diversity: stakeholderRoleDiversity,
    executive_area_diversity: executiveAreaDiversity,
    question_diversity: questionDiversity,
    answer_distinct_count: answerDistinctCount,
    distinct_priority_themes: distinctPriorityThemes,
    distinct_pain_points: distinctPainPoints,
    distinct_initiative_links: distinctInitiativeLinks,
    template_word_fraction_pct: templateWordFractionPct,
    semantic_status: status,
    blocking_reasons: [...blockingReasons, ...partialReasons],
    recommended_remediation:
      status === "semantic_pass"
        ? ""
        : blockingReasons.length > 0
          ? "Code fix: evidence-v4-migration-dry-run.mjs interview resolution."
          : "Governed data enrichment: vary the underlying interview source content, not just the substituted entity names in one template sentence.",
  };
}

// --- Cross-domain integrity (Gate 2 section 9) ---
function buildIdentitySet(rows, identityFields) {
  const set = new Set();
  for (const r of rows) {
    const v = rowIdentityValue(r, identityFields);
    if (nonBlank(v)) set.add(normalizeText(v));
  }
  return set;
}

function checkReferentialField(rows, field, targetIdentitySet, mode) {
  const checkedRows = rows.filter((r) => nonBlank(r[field]));
  if (checkedRows.length === 0) return { checked: 0, resolved: 0, resolution_rate_pct: 0, status: "not_applicable" };
  let resolved = 0;
  for (const r of checkedRows) {
    const raw = String(r[field]);
    if (mode === "list_any_match") {
      const parts = raw.split(/[;,]/).map((p) => normalizeText(p)).filter(Boolean);
      if (parts.some((p) => targetIdentitySet.has(p))) resolved += 1;
    } else if (targetIdentitySet.has(normalizeText(raw))) {
      resolved += 1;
    }
  }
  const rate = pct(resolved, checkedRows.length);
  const status = rate >= 80 ? "pass" : rate >= 40 ? "partial" : "blocker";
  return { checked: checkedRows.length, resolved, resolution_rate_pct: rate, status };
}

function crossDomainIntegrity(tenant, domainRowsByKey, evidenceItemRows, interviewRows) {
  const checks = [];
  for (const [domainKey, rule] of Object.entries(semanticRules.domains)) {
    if (!rule.referentialIntegrity) continue;
    const sourceRows = domainRowsByKey[domainKey];
    if (!sourceRows || sourceRows.shapeMismatch) continue;
    for (const ref of rule.referentialIntegrity) {
      const targetRows = domainRowsByKey[ref.resolvesToDomain];
      if (!targetRows || targetRows.shapeMismatch) {
        checks.push({ domain: domainKey, field: ref.field, resolves_to: `${ref.resolvesToDomain}.${ref.resolvesToField}`, status: "not_applicable", reason: "target domain shape mismatch or missing" });
        continue;
      }
      const targetIdentitySet = buildIdentitySet(targetRows.rows, [ref.resolvesToField]);
      const result = checkReferentialField(sourceRows.rows, ref.field, targetIdentitySet, ref.mode);
      checks.push({ domain: domainKey, field: ref.field, resolves_to: `${ref.resolvesToDomain}.${ref.resolvesToField}`, ...result });
    }
  }

  // Evidence dimension keys resolve (already computed in evidence-item quality, surfaced here too for a single integrity view).
  const dimensionKeysChecked = evidenceItemRows.filter((r) => nonBlank(r.dimension_keys)).length;
  const dimensionKeysAllValid = evidenceItemRows.filter((r) => {
    const keys = String(r.dimension_keys || "").split("|").map((k) => k.trim()).filter(Boolean);
    return keys.length > 0 && keys.every((k) => VALID_DIMENSION_KEYS.has(k));
  }).length;
  checks.push({
    domain: "evidence_items",
    field: "dimension_keys",
    resolves_to: "38-dimension catalog",
    checked: dimensionKeysChecked,
    resolved: dimensionKeysAllValid,
    resolution_rate_pct: pct(dimensionKeysAllValid, dimensionKeysChecked),
    status: dimensionKeysChecked === 0 ? "not_applicable" : pct(dimensionKeysAllValid, dimensionKeysChecked) >= 80 ? "pass" : pct(dimensionKeysAllValid, dimensionKeysChecked) >= 40 ? "partial" : "blocker",
  });

  // Interview initiative_link resolves to programs_initiatives or ai_automation_use_cases.
  if (interviewRows.length > 0) {
    const programsSet = domainRowsByKey.programs_initiatives && !domainRowsByKey.programs_initiatives.shapeMismatch
      ? buildIdentitySet(domainRowsByKey.programs_initiatives.rows, ["program_name"])
      : new Set();
    const aiUseCasesSet = domainRowsByKey.ai_automation_use_cases && !domainRowsByKey.ai_automation_use_cases.shapeMismatch
      ? buildIdentitySet(domainRowsByKey.ai_automation_use_cases.rows, ["use_case_name"])
      : new Set();
    const combined = new Set([...programsSet, ...aiUseCasesSet]);
    const result = checkReferentialField(interviewRows, "initiative_link", combined, "exact");
    checks.push({ domain: "executive_interviews", field: "initiative_link", resolves_to: "programs_initiatives.program_name OR ai_automation_use_cases.use_case_name", ...result });
  }

  return checks;
}

// --- Orchestration ---
function auditTenant(tenant) {
  const domainRowsByKey = {};
  const domainQuality = [];

  for (const [domainKey, rule] of Object.entries(semanticRules.domains)) {
    if (rule.special) continue; // handled separately below
    const filePath = domainFileForTenant(tenant.canonicalInputRoot, rule.numericPrefix);
    if (!filePath) {
      domainQuality.push({ domain: domainKey, raw_row_count: 0, semantic_status: "semantic_blocker", blocking_reasons: [`no file found for numeric prefix ${rule.numericPrefix}_*`], recommended_remediation: "Locate or restore this domain's canonical file." });
      domainRowsByKey[domainKey] = { rows: [], columns: [], shapeMismatch: true };
      continue;
    }
    const { rows, columns } = readCsvFile(filePath);
    const generic = evaluateGenericDomain(domainKey, rule, rows, columns, tenant);
    const decided = determineSemanticStatus(domainKey, rule, generic);
    domainQuality.push(decided);
    domainRowsByKey[domainKey] = { rows, columns, shapeMismatch: Boolean(decided.shape_mismatch) };
  }

  // v4 migration-candidate inputs (Gate 1.2 output), replacing the raw active
  // 13_evidence_sources.csv for the evidence_sources domain per Gate 2's
  // explicit input list.
  const tenantMigrationDir = path.join(migrationDir, tenant.tenantKey);
  const sourcesPath = path.join(tenantMigrationDir, "evidence-sources-candidate.csv");
  const itemsPath = path.join(tenantMigrationDir, "evidence-items-candidate.csv");
  const interviewsPath = path.join(tenantMigrationDir, "executive-interviews-candidate.csv");
  const sourceRows = fs.existsSync(sourcesPath) ? readCsvFile(sourcesPath).rows : [];
  const itemRows = fs.existsSync(itemsPath) ? readCsvFile(itemsPath).rows : [];
  const interviewRows = fs.existsSync(interviewsPath) ? readCsvFile(interviewsPath).rows : [];

  const evidenceSourceQuality = evaluateEvidenceSources(tenant, sourceRows);
  const evidenceSourceVersionIds = new Set(sourceRows.map((r) => r.source_version_id).filter(Boolean));
  const evidenceItemQuality = evaluateEvidenceItems(tenant, itemRows, evidenceSourceVersionIds);
  const interviewQuality = evaluateExecutiveInterviews(tenant, interviewRows, evidenceSourceVersionIds, itemRows);

  domainRowsByKey.evidence_sources = { rows: sourceRows, columns: sourceRows[0] ? Object.keys(sourceRows[0]) : [], shapeMismatch: false };
  domainQuality.push(evidenceSourceQuality);

  const crossDomain = crossDomainIntegrity(tenant, domainRowsByKey, itemRows, interviewRows);

  const auxiliaryFiles = auxiliaryFilesForTenant(tenant.canonicalInputRoot);
  const auxiliarySummary = auxiliaryFiles.map(({ name, path: p }) => {
    const { rows } = readCsvFile(p);
    return { name, raw_row_count: rows.length, note: "auxiliary noncanonical artifact -- excluded from the canonical denominator" };
  });

  const semanticBlockers = domainQuality
    .filter((d) => d.semantic_status === "semantic_blocker")
    .flatMap((d) => (d.blocking_reasons || []).map((reason) => ({ domain: d.domain, reason, remediation: d.recommended_remediation || "" })));

  const remediationPlan = [...domainQuality, evidenceItemQuality, interviewQuality]
    .filter((d, idx, arr) => arr.findIndex((x) => x.domain === d.domain) === idx)
    .filter((d) => d.semantic_status === "semantic_blocker" || d.semantic_status === "semantic_partial")
    .map((d) => ({
      domain: d.domain,
      semantic_status: d.semantic_status,
      blocking_reasons: d.blocking_reasons || [],
      recommended_remediation: d.recommended_remediation || "",
    }));

  return {
    tenant_key: tenant.tenantKey,
    company_size_band: tenant.companySizeBand,
    domain_quality: domainQuality,
    evidence_source_quality: evidenceSourceQuality,
    evidence_item_quality: evidenceItemQuality,
    interview_quality: interviewQuality,
    cross_domain_integrity: crossDomain,
    auxiliary_domains: auxiliarySummary,
    semantic_blockers: semanticBlockers,
    remediation_plan: remediationPlan,
  };
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(","), ...rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","))];
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}

function main() {
  const universe = assertRuleUniverse();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "audit-universe.json"), JSON.stringify(universe, null, 2));

  const allTenantResults = [];
  for (const tenant of registry.activeTenants) {
    const result = auditTenant(tenant);
    allTenantResults.push(result);

    const tenantDir = path.join(outDir, tenant.tenantKey);
    fs.mkdirSync(tenantDir, { recursive: true });
    fs.writeFileSync(path.join(tenantDir, "domain-semantic-quality.json"), JSON.stringify(result.domain_quality, null, 2));
    fs.writeFileSync(path.join(tenantDir, "evidence-source-quality.json"), JSON.stringify(result.evidence_source_quality, null, 2));
    fs.writeFileSync(path.join(tenantDir, "evidence-item-quality.json"), JSON.stringify(result.evidence_item_quality, null, 2));
    fs.writeFileSync(path.join(tenantDir, "interview-quality.json"), JSON.stringify(result.interview_quality, null, 2));
    fs.writeFileSync(path.join(tenantDir, "cross-domain-integrity.json"), JSON.stringify(result.cross_domain_integrity, null, 2));
    writeCsv(path.join(tenantDir, "semantic-blockers.csv"), result.semantic_blockers, ["domain", "reason", "remediation"]);
    fs.writeFileSync(path.join(tenantDir, "remediation-plan.json"), JSON.stringify(result.remediation_plan, null, 2));
  }

  const matrixRows = [];
  const summaryCounts = {};
  for (const result of allTenantResults) {
    const allDomainEntries = [...result.domain_quality, result.evidence_item_quality, result.interview_quality];
    const counts = { semantic_pass: 0, semantic_partial: 0, semantic_blocker: 0, not_applicable: 0 };
    for (const d of allDomainEntries) {
      counts[d.semantic_status] = (counts[d.semantic_status] || 0) + 1;
      matrixRows.push({
        tenant_key: result.tenant_key,
        domain: d.domain,
        raw_row_count: d.raw_row_count ?? "",
        semantic_status: d.semantic_status,
        blocking_reason_count: (d.blocking_reasons || []).length,
        top_blocking_reason: (d.blocking_reasons || [])[0] || "",
      });
    }
    summaryCounts[result.tenant_key] = counts;
  }
  writeCsv(path.join(outDir, "all-tenant-domain-quality-matrix.csv"), matrixRows, ["tenant_key", "domain", "raw_row_count", "semantic_status", "blocking_reason_count", "top_blocking_reason"]);

  const summary = {
    generated_by: "scripts/audit/tenant-input-semantic-quality.mjs",
    rule_set_id: semanticRules.ruleSetId,
    tenants_audited: allTenantResults.length,
    per_tenant_status_counts: summaryCounts,
    per_tenant_semantic_blocker_count: Object.fromEntries(allTenantResults.map((r) => [r.tenant_key, r.semantic_blockers.length])),
    schema_shape_mismatches: allTenantResults.flatMap((r) => r.domain_quality.filter((d) => d.shape_mismatch).map((d) => `${r.tenant_key}.${d.domain}`)),
  };
  fs.writeFileSync(path.join(outDir, "all-tenant-semantic-quality-summary.json"), JSON.stringify(summary, null, 2));

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Gate 2: Tenant Semantic Quality</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;color:#1a1a1a}table{border-collapse:collapse;width:100%;margin-bottom:2rem}
th,td{border:1px solid #ccc;padding:4px 8px;font-size:13px;text-align:left}th{background:#f0f0f0}
.semantic_pass{color:#1a7a1a}.semantic_partial{color:#a66a00}.semantic_blocker{color:#b00020;font-weight:600}.not_applicable{color:#888}</style>
</head><body>
<h1>Gate 2: Tenant Semantic Quality</h1>
<p>Generated by scripts/audit/tenant-input-semantic-quality.mjs. Zero-write, read-only.</p>
<table><tr><th>Tenant</th><th>Domain</th><th>Rows</th><th>Status</th><th>Top blocking reason</th></tr>
${matrixRows.map((r) => `<tr><td>${r.tenant_key}</td><td>${r.domain}</td><td>${r.raw_row_count}</td><td class="${r.semantic_status}">${r.semantic_status}</td><td>${(r.top_blocking_reason || "").replace(/</g, "&lt;")}</td></tr>`).join("\n")}
</table>
</body></html>`;
  fs.writeFileSync(path.join(outDir, "all-tenant-semantic-quality.html"), html);

  console.log(JSON.stringify(summary, null, 2));
  return { universe, summary, allTenantResults };
}

export {
  matchesPlaceholder,
  isRowSubstantive,
  evaluateGenericDomain,
  determineSemanticStatus,
  evaluateEvidenceSources,
  evaluateEvidenceItems,
  evaluateExecutiveInterviews,
  assertRuleUniverse,
  auditTenant,
  semanticRules,
  registry,
  outDir,
};

const isDirectlyExecuted = import.meta.url === `file://${process.argv[1]}`;
if (isDirectlyExecuted) {
  main();
}

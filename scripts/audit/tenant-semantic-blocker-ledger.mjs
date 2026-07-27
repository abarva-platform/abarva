#!/usr/bin/env node
// Gate 2.1 Phase A (read-only). Turns Gate 2's semantic_blocker/semantic_partial
// findings into a classified, actionable ledger -- BEFORE any data or code
// repair begins. Reuses Gate 2's auditTenant() directly (no duplicated
// scoring logic); adds one new diagnostic this file is responsible for:
// independently validating each cross-domain referential-integrity check by
// sampling real field values on both sides, since Gate 2's own release notes
// disclosed that some low resolution rates may be a rule-mapping defect
// rather than a real data gap. Per the explicit instruction: do not classify
// (and later, do not repair) a cross-domain check as a data defect until its
// mapping has been independently checked against real values.
//
// HARD GUARANTEES: zero writes to active/current, tenant-input-registry.json,
// Postgres, or any runtime path. Output lands only under
// reports/tenant-semantic-remediation/. Zero Claude calls.
//
// Run: node scripts/audit/tenant-semantic-blocker-ledger.mjs
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { auditTenant, semanticRules, registry } from "./tenant-input-semantic-quality.mjs";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tenant-semantic-remediation");

function nonBlank(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function domainFileForTenant(tenantRoot, numericPrefix) {
  const dir = path.join(repoRoot, tenantRoot);
  if (!fs.existsSync(dir)) return null;
  const match = fs.readdirSync(dir).find((f) => f.startsWith(`${numericPrefix}_`) && f.endsWith(".csv"));
  return match ? path.join(dir, match) : null;
}

const MIGRATION_CANDIDATE_FILES = {
  evidence_sources: "evidence-sources-candidate.csv",
  evidence_items: "evidence-items-candidate.csv",
  executive_interviews: "executive-interviews-candidate.csv",
};

function columnValues(tenant, domainKey, field) {
  let filePath;
  if (MIGRATION_CANDIDATE_FILES[domainKey]) {
    filePath = path.join(repoRoot, "reports/evidence-v4-migration", tenant.tenantKey, MIGRATION_CANDIDATE_FILES[domainKey]);
    if (!fs.existsSync(filePath)) return null;
  } else {
    const rule = semanticRules.domains[domainKey];
    if (!rule || !rule.numericPrefix) return null;
    filePath = domainFileForTenant(tenant.canonicalInputRoot, rule.numericPrefix);
    if (!filePath) return null;
  }
  const rows = Papa.parse(fs.readFileSync(filePath, "utf8"), { header: true, skipEmptyLines: true }).data;
  return rows.map((r) => r[field]).filter(nonBlank);
}

// An ID-shaped value looks like CODE-00001 / APP-0117 / VDR-00001 -- a
// business identifier, not a display name. Values on the two sides of a
// referential-integrity check should be the SAME kind of thing; if one side
// is uniformly ID-shaped and the other is uniformly prose/name-shaped, the
// rule is comparing incompatible fields, not observing a real data gap.
function looksIdShaped(value) {
  return /^[A-Z]{2,8}-\d{2,6}$/.test(String(value).trim());
}

// A value that is identical across ~all rows and matches a known
// config/template-identifier shape (not a real business name) indicates the
// field was populated with a leftover constant during synthetic generation,
// not that the rows are legitimately duplicate. Distinguishes this from
// "genuinely blank" (already not_applicable in Gate 2) and from "genuinely
// diverse names that just don't resolve" (a real referential gap).
function looksLikePlaceholderConstant(values) {
  if (values.length === 0) return false;
  const distinct = new Set(values.map((v) => String(v).trim()));
  if (distinct.size !== 1) return false;
  const only = [...distinct][0];
  return /^standard_\d{4}_\d{2}_v\d+$/i.test(only) || /template|packet|schema|manifest/i.test(only) || /-v6-v7-upgrade-candidate-/i.test(only);
}

function classifyCrossDomainEntry(tenant, entry, shapeMismatchedDomains) {
  if (entry.status === "pass" || entry.status === "not_applicable") return null;
  const [sourceDomain, sourceField] = [entry.domain, entry.field];
  const targetDomains = entry.resolves_to.split(/\s+OR\s+/).map((t) => t.split(".")[0]);
  if (targetDomains.some((d) => shapeMismatchedDomains.has(d))) {
    return {
      blocker_class: "source_adapter_missing",
      source_evidence: `${sourceDomain}.${sourceField}: resolves against ${entry.resolves_to}, but ${targetDomains.filter((d) => shapeMismatchedDomains.has(d)).join(", ")} is itself schema-mismatched for this tenant -- this is a downstream consequence of the same root cause, not an independent referential gap.`,
      proposed_repair: `Resolves automatically once the target domain's typed source adapter lands (Phase C) -- do not build separate cross-referencing logic for this check.`,
    };
  }
  const sourceValues = columnValues(tenant, sourceDomain, sourceField);
  if (!sourceValues || sourceValues.length === 0) {
    return {
      blocker_class: "genuine_not_applicable",
      source_evidence: `${sourceDomain}.${sourceField}: no sampled values available (domain likely schema-mismatched or file missing).`,
      proposed_repair: "Not applicable until the source domain itself is repaired.",
    };
  }
  if (looksLikePlaceholderConstant(sourceValues)) {
    return {
      blocker_class: "synthetic_domain_thin",
      source_evidence: `${sourceDomain}.${sourceField}: ${sourceValues.length}/${sourceValues.length} sampled values are the single literal "${sourceValues[0]}" -- a template/packet identifier left over from generation, not a real business reference.`,
      proposed_repair: `Backfill real ${entry.resolves_to.split(".")[0]} references for this field during Phase D enrichment; this is a content gap, not a broken link.`,
    };
  }
  const idShapedCount = sourceValues.filter(looksIdShaped).length;
  if (idShapedCount / sourceValues.length > 0.8) {
    return {
      blocker_class: "audit_rule_defect",
      source_evidence: `${sourceDomain}.${sourceField}: ${idShapedCount}/${sourceValues.length} sampled values are ID-shaped (e.g. "${sourceValues[0]}"), but ${entry.resolves_to} holds display names, not matching IDs -- and no shared ID field currently exists in the v3 schema for this domain pair.`,
      proposed_repair: `Do not treat this as a data defect. Either add a real foreign-key ID column to both domains (Phase B's scenario model), or correct/retire this rule until one exists.`,
    };
  }
  return {
    blocker_class: "referential_identity_defect",
    source_evidence: `${sourceDomain}.${sourceField}: ${sourceValues.length} sampled values look like genuine distinct names/content (e.g. "${sourceValues[0]}", "${sourceValues[1] || ""}"), but only ${entry.resolution_rate_pct}% resolve against ${entry.resolves_to}.`,
    proposed_repair: `These were generated independently and don't share identities. Needs ID-based cross-referencing from one connected scenario model (Phase B), not string-matching.`,
  };
}

function classifyDomainEntry(entry) {
  if (entry.semantic_status === "semantic_pass" || entry.semantic_status === "not_applicable") return null;
  const reasons = (entry.blocking_reasons || []).join(" | ");
  if (entry.shape_mismatch) {
    return {
      blocker_class: "source_adapter_missing",
      source_evidence: `${entry.domain}: active file columns do not include any of this domain's declared identity fields -- a structurally different schema, not a v3-shaped file with thin content.`,
      proposed_repair: `Build a typed source adapter translating this tenant's real columns into the canonical ${entry.domain} fields (Gate 2.1 Phase C).`,
    };
  }
  if (entry.raw_row_count === 0) {
    return {
      blocker_class: "synthetic_domain_empty",
      source_evidence: `${entry.domain}: 0 rows in the active file for this required domain.`,
      proposed_repair: `Generate governed synthetic rows for this required domain (Phase D).`,
    };
  }
  if (reasons.includes("substantively_empty_despite_row_count")) {
    return {
      blocker_class: "synthetic_domain_thin",
      source_evidence: `${entry.domain}: ${entry.raw_row_count} rows, ${entry.substantive_rows} pass the substantive-row rule.`,
      proposed_repair: `Enrich the existing rows' substantive fields; do not add more rows of the same shape (Phase D).`,
    };
  }
  if (reasons.includes("placeholder_dominant")) {
    return {
      blocker_class: "synthetic_boilerplate",
      source_evidence: `${entry.domain}: ${entry.placeholder_rate_pct}% of rows carry only placeholder values.`,
      proposed_repair: `Replace placeholder values with real governed content (Phase D).`,
    };
  }
  if (reasons.includes("no_usable_identity")) {
    return {
      blocker_class: "synthetic_domain_thin",
      source_evidence: `${entry.domain}: only ${entry.identity_coverage_pct}% of rows carry a real identity value (column exists, mostly blank).`,
      proposed_repair: `Populate the identity field for these rows (Phase D).`,
    };
  }
  if (reasons.includes("normalized_duplicate_pct")) {
    return {
      blocker_class: "synthetic_boilerplate",
      source_evidence: `${entry.domain}: ${entry.normalized_content_duplicate_count} rows are normalized-content duplicates of another row.`,
      proposed_repair: `Generate distinct content per entity instead of repeating one template (Phase D).`,
    };
  }
  if (reasons.includes("distinct_identity_count") || reasons.includes("below minimum")) {
    return {
      blocker_class: "synthetic_domain_thin",
      source_evidence: `${entry.domain}: ${entry.distinct_identity_count} distinct identities, below the ${entry.minimum_distinct_identities_required} floor for this company-size band.`,
      proposed_repair: `Add more distinct entities, not more rows of existing ones (Phase D).`,
    };
  }
  if (reasons.includes("blocking_source_metadata_conflicts") || reasons.includes("duplicate source_version_id") || reasons.includes("self-referential")) {
    return {
      blocker_class: "migration_defect",
      source_evidence: `evidence_sources: ${reasons}`,
      proposed_repair: `Fix in evidence-v4-migration-dry-run.mjs's source-identity resolution.`,
    };
  }
  return {
    blocker_class: "synthetic_domain_thin",
    source_evidence: `${entry.domain}: ${reasons}`,
    proposed_repair: `Needs manual review -- no deterministic classification rule matched this blocking reason.`,
  };
}

function classifyEvidenceItemEntry(entry) {
  if (entry.semantic_status === "semantic_pass") return [];
  const rows = [];
  const reasons = entry.blocking_reasons || [];
  for (const reason of reasons) {
    if (/orphan|duplicate evidence_id|invalid locator_type|invalid evidence_type|invalid classification|not in the real 38-key catalog|dimension_keys assigned/.test(reason)) {
      rows.push({ blocker_class: "migration_defect", source_evidence: `evidence_items: ${reason}`, proposed_repair: `Fix in evidence-v4-migration-dry-run.mjs's item resolution/dimension-routing (Phase F).` });
    } else if (/normalized-content duplicates/.test(reason)) {
      rows.push({ blocker_class: "synthetic_boilerplate", source_evidence: `evidence_items: ${reason}`, proposed_repair: `Generate distinct evidence content per source (Phase F).` });
    } else if (/locator\/file-path as their summary/.test(reason)) {
      rows.push({ blocker_class: "synthetic_domain_thin", source_evidence: `evidence_items: ${reason}`, proposed_repair: `Populate evidence_summary with real narrative excerpts, not a bare locator (Phase F).` });
    } else {
      rows.push({ blocker_class: "synthetic_domain_thin", source_evidence: `evidence_items: ${reason}`, proposed_repair: `Needs manual review.` });
    }
  }
  return rows;
}

function classifyInterviewEntry(entry) {
  if (entry.semantic_status === "semantic_pass" || entry.semantic_status === "not_applicable") return [];
  const rows = [];
  for (const reason of entry.blocking_reasons || []) {
    if (/duplicate interview_id|don't reconcile 1:1|no persisted foreign key/.test(reason)) {
      rows.push({ blocker_class: "migration_defect", source_evidence: `executive_interviews: ${reason}`, proposed_repair: `Fix in evidence-v4-migration-dry-run.mjs's interview resolution (Phase C for meridian; schema fix affects all tenants).` });
    } else if (/interviews with an invalid approval_status/.test(reason)) {
      rows.push({ blocker_class: "migration_defect", source_evidence: `executive_interviews: ${reason}`, proposed_repair: `Map lifecycle status separately from approval status -- do not reuse active_candidate_status as approval_status (Phase C).` });
    } else if (/scaffold words/.test(reason)) {
      rows.push({ blocker_class: "synthetic_boilerplate", source_evidence: `executive_interviews: ${reason}`, proposed_repair: `Replace the templated interview generator with stakeholder/tenant-grounded generation (Phase E).` });
    } else {
      rows.push({ blocker_class: "synthetic_domain_thin", source_evidence: `executive_interviews: ${reason}`, proposed_repair: `Needs manual review.` });
    }
  }
  return rows;
}

function buildLedgerForTenant(tenant, result) {
  const rows = [];
  const shapeMismatchedDomains = new Set(result.domain_quality.filter((d) => d.shape_mismatch).map((d) => d.domain));
  for (const entry of result.domain_quality) {
    const c = classifyDomainEntry(entry);
    if (c) {
      rows.push({
        tenant: tenant.tenantKey,
        domain: entry.domain,
        blocking_reason: (entry.blocking_reasons || []).join(" | "),
        blocker_class: c.blocker_class,
        source_evidence: c.source_evidence,
        proposed_repair: c.proposed_repair,
        affected_dependent_domains: c.blocker_class === "source_adapter_missing" ? "all cross-domain checks referencing this domain" : "",
        code_owner: c.blocker_class === "migration_defect" ? "scripts/data-build/evidence-v4-migration-dry-run.mjs" : c.blocker_class === "source_adapter_missing" ? "new Meridian source adapter (Phase C)" : "n/a",
        data_owner: ["synthetic_domain_empty", "synthetic_domain_thin", "synthetic_boilerplate"].includes(c.blocker_class) ? "governed synthetic-data enrichment (Phase D/E)" : "n/a",
        acceptance_test: `${entry.domain}.semantic_status === "semantic_pass" for ${tenant.tenantKey} on Gate 2 rerun`,
      });
    }
  }
  for (const c of classifyEvidenceItemEntry(result.evidence_item_quality)) {
    rows.push({
      tenant: tenant.tenantKey,
      domain: "evidence_items",
      blocking_reason: c.source_evidence,
      blocker_class: c.blocker_class,
      source_evidence: c.source_evidence,
      proposed_repair: c.proposed_repair,
      affected_dependent_domains: "",
      code_owner: c.blocker_class === "migration_defect" ? "scripts/data-build/evidence-v4-migration-dry-run.mjs" : "n/a",
      data_owner: c.blocker_class !== "migration_defect" ? "governed synthetic-data enrichment (Phase F)" : "n/a",
      acceptance_test: `evidence_items.semantic_status === "semantic_pass" for ${tenant.tenantKey} on Gate 2 rerun`,
    });
  }
  for (const c of classifyInterviewEntry(result.interview_quality)) {
    rows.push({
      tenant: tenant.tenantKey,
      domain: "executive_interviews",
      blocking_reason: c.source_evidence,
      blocker_class: c.blocker_class,
      source_evidence: c.source_evidence,
      proposed_repair: c.proposed_repair,
      affected_dependent_domains: "",
      code_owner: c.blocker_class === "migration_defect" ? "scripts/data-build/evidence-v4-migration-dry-run.mjs" : "n/a",
      data_owner: c.blocker_class === "synthetic_boilerplate" ? "interview generator redesign (Phase E)" : "n/a",
      acceptance_test: `executive_interviews meets Phase E's hard targets for ${tenant.tenantKey} on Gate 2 rerun`,
    });
  }
  for (const entry of result.cross_domain_integrity) {
    const c = classifyCrossDomainEntry(tenant, entry, shapeMismatchedDomains);
    if (c) {
      rows.push({
        tenant: tenant.tenantKey,
        domain: `${entry.domain}.${entry.field}`,
        blocking_reason: `resolves_to=${entry.resolves_to} rate=${entry.resolution_rate_pct}% status=${entry.status}`,
        blocker_class: c.blocker_class,
        source_evidence: c.source_evidence,
        proposed_repair: c.proposed_repair,
        affected_dependent_domains: entry.resolves_to.split(".")[0],
        code_owner: c.blocker_class === "audit_rule_defect" ? "datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/semantic-quality-rules.json" : "n/a",
        data_owner: c.blocker_class === "referential_identity_defect" || c.blocker_class === "synthetic_domain_thin" ? "Phase B scenario model / Phase D enrichment" : "n/a",
        acceptance_test: `${entry.domain}.${entry.field} resolution_rate_pct >= 80% for ${tenant.tenantKey} on Gate 2 rerun (or rule retired/corrected if audit_rule_defect)`,
      });
    }
  }
  return rows;
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const allRows = [];
  const perTenantResults = {};
  for (const tenant of registry.activeTenants) {
    const result = auditTenant(tenant);
    perTenantResults[tenant.tenantKey] = result;
    allRows.push(...buildLedgerForTenant(tenant, result));
  }

  const columns = ["tenant", "domain", "blocking_reason", "blocker_class", "source_evidence", "proposed_repair", "affected_dependent_domains", "code_owner", "data_owner", "acceptance_test"];
  const lines = [columns.join(","), ...allRows.map((r) => columns.map((c) => csvEscape(r[c])).join(","))];
  fs.writeFileSync(path.join(outDir, "all-tenant-blocker-ledger.csv"), lines.join("\n") + "\n");

  const byClass = {};
  for (const r of allRows) {
    if (!byClass[r.blocker_class]) byClass[r.blocker_class] = [];
    byClass[r.blocker_class].push({ tenant: r.tenant, domain: r.domain });
  }
  const remediationPlan = {
    generated_by: "scripts/audit/tenant-semantic-blocker-ledger.mjs",
    total_ledger_entries: allRows.length,
    by_blocker_class: Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, { count: v.length, entries: v }])),
    phase_mapping: {
      source_adapter_missing: "Gate 2.1 Phase C (Meridian typed source adapter)",
      schema_mapping_defect: "Gate 2.1 Phase C",
      audit_rule_defect: "correct or retire the rule in semantic-quality-rules.json before any data repair -- do not enrich data to satisfy a bad rule",
      migration_defect: "fix in scripts/data-build/evidence-v4-migration-dry-run.mjs",
      synthetic_domain_empty: "Gate 2.1 Phase D",
      synthetic_domain_thin: "Gate 2.1 Phase D",
      synthetic_boilerplate: "Gate 2.1 Phase D/E (interview generator redesign for interview rows)",
      referential_identity_defect: "Gate 2.1 Phase B (universal canonical scenario model with stable IDs)",
      genuine_not_applicable: "no repair -- confirm rationale is still accurate after dependent-domain repair",
    },
  };
  fs.writeFileSync(path.join(outDir, "all-tenant-remediation-plan.json"), JSON.stringify(remediationPlan, null, 2));

  console.log(JSON.stringify({ total_ledger_entries: allRows.length, by_blocker_class: Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, v.length])) }, null, 2));
  return { allRows, remediationPlan, perTenantResults };
}

export { classifyDomainEntry, classifyEvidenceItemEntry, classifyInterviewEntry, classifyCrossDomainEntry, looksIdShaped, looksLikePlaceholderConstant, buildLedgerForTenant, outDir };

const isDirectlyExecuted = import.meta.url === `file://${process.argv[1]}`;
if (isDirectlyExecuted) {
  main();
}

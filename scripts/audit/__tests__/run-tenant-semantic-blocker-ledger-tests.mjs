#!/usr/bin/env node
// Gate 2.1 Phase A regression suite for scripts/audit/tenant-semantic-blocker-ledger.mjs.
// Proves the classification logic sorts real Gate 2 findings into the right
// blocker class BEFORE any repair phase touches data or code -- especially
// that cross-domain checks are validated against real field-value shapes
// rather than assumed to be data defects.
//
// Run: node scripts/audit/__tests__/run-tenant-semantic-blocker-ledger-tests.mjs
import {
  classifyDomainEntry,
  classifyEvidenceItemEntry,
  classifyInterviewEntry,
  classifyCrossDomainEntry,
  looksIdShaped,
  looksLikePlaceholderConstant,
  buildLedgerForTenant,
} from "../tenant-semantic-blocker-ledger.mjs";
import { auditTenant, registry } from "../tenant-input-semantic-quality.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// --- Shape helpers ---
assert(looksIdShaped("VDR-00001") === true, "VDR-00001 is recognized as ID-shaped");
assert(looksIdShaped("APP-0117") === true, "APP-0117 is recognized as ID-shaped");
assert(looksIdShaped("Salesforce") === false, "a real vendor name is not ID-shaped");
assert(looksIdShaped("MER-MOVE-001") === false, "a two-segment code is not treated as simple ID-shaped (avoids over-firing on real business codes)");
assert(looksLikePlaceholderConstant(["standard_2026_07_v3", "standard_2026_07_v3"]) === true, "a repeated template-set-ID literal is recognized as a placeholder constant");
assert(looksLikePlaceholderConstant(["Oracle Retail Merchandising", "Manhattan Active WMS"]) === false, "genuine distinct system names are not flagged as a placeholder constant");
assert(looksLikePlaceholderConstant(["Oracle", "Oracle"]) === false, "a repeated REAL name (not template/packet-shaped) is not misflagged as a placeholder constant");

// --- classifyDomainEntry ---
assert(classifyDomainEntry({ semantic_status: "semantic_pass" }) === null, "a passing domain entry produces no ledger row");
assert(
  classifyDomainEntry({ domain: "org_ownership", semantic_status: "semantic_blocker", shape_mismatch: true, blocking_reasons: ["schema_shape_mismatch: ..."] }).blocker_class === "source_adapter_missing",
  "a shape-mismatched domain classifies as source_adapter_missing",
);
assert(
  classifyDomainEntry({ domain: "infrastructure_platforms", semantic_status: "semantic_blocker", raw_row_count: 0, blocking_reasons: ["zero_rows: ..."] }).blocker_class === "synthetic_domain_empty",
  "a zero-row required domain classifies as synthetic_domain_empty",
);
assert(
  classifyDomainEntry({ domain: "business_functions", semantic_status: "semantic_blocker", raw_row_count: 26, substantive_rows: 0, blocking_reasons: ["substantively_empty_despite_row_count: 26 rows, 0 pass..."] }).blocker_class === "synthetic_domain_thin",
  "rows-present-but-substantively-empty classifies as synthetic_domain_thin, distinct from empty",
);
assert(
  classifyDomainEntry({ domain: "org_ownership", semantic_status: "semantic_blocker", raw_row_count: 20, placeholder_rate_pct: 80, blocking_reasons: ["placeholder_dominant: 80% ..."] }).blocker_class === "synthetic_boilerplate",
  "placeholder-dominant content classifies as synthetic_boilerplate",
);

// --- classifyEvidenceItemEntry ---
{
  const c = classifyEvidenceItemEntry({ semantic_status: "semantic_blocker", blocking_reasons: ["2 evidence items whose source_version_id does not resolve to any evidence source (orphan claim)"] });
  assert(c.length === 1 && c[0].blocker_class === "migration_defect", "orphan evidence items classify as migration_defect");
}
{
  const c = classifyEvidenceItemEntry({ semantic_status: "semantic_partial", blocking_reasons: ["63.64% of evidence items carry a bare locator/file-path as their summary, not real narrative content (>2 words)"] });
  assert(c.length === 1 && c[0].blocker_class === "synthetic_domain_thin", "locator-shaped summaries classify as synthetic_domain_thin (content gap), not a code bug");
}

// --- classifyInterviewEntry ---
{
  const c = classifyInterviewEntry({ semantic_status: "semantic_blocker", blocking_reasons: ["198 duplicate interview_id values"] });
  assert(c.length === 1 && c[0].blocker_class === "migration_defect", "duplicate interview_id classifies as migration_defect");
}
{
  const c = classifyInterviewEntry({ semantic_status: "semantic_partial", blocking_reasons: ["68.46% of answer words are scaffold words recurring in 60%+ of same-question answers"] });
  assert(c.length === 1 && c[0].blocker_class === "synthetic_boilerplate", "templated interview answers classify as synthetic_boilerplate");
}
assert(classifyInterviewEntry({ semantic_status: "not_applicable" }).length === 0, "a not_applicable interview domain produces no ledger rows");

// --- classifyCrossDomainEntry against REAL data (the core Phase A requirement: validate before classifying) ---
{
  const apex = registry.activeTenants.find((t) => t.tenantKey === "apex-retail");
  const c = classifyCrossDomainEntry(
    apex,
    { domain: "applications_systems", field: "vendor", resolves_to: "vendors_contracts.vendor_name", checked: 122, resolved: 6, resolution_rate_pct: 4.92, status: "blocker" },
    new Set(),
  );
  assert(c.blocker_class === "audit_rule_defect", `apex-retail's applications_systems.vendor check is correctly identified as comparing an ID field against a name field, not a real data gap (got ${c.blocker_class})`);
}
{
  const apex = registry.activeTenants.find((t) => t.tenantKey === "apex-retail");
  const c = classifyCrossDomainEntry(
    apex,
    { domain: "data_assets_integrations", field: "source_system", resolves_to: "applications_systems.system_name", checked: 235, resolved: 0, resolution_rate_pct: 0, status: "blocker" },
    new Set(),
  );
  assert(c.blocker_class === "synthetic_domain_thin", `apex-retail's data_assets_integrations.source_system check correctly identifies the real defect (a leftover template-set-ID literal), not a rule problem (got ${c.blocker_class})`);
}
{
  const lakeshoreIndustries = registry.activeTenants.find((t) => t.tenantKey === "lakeshore-industries");
  const c = classifyCrossDomainEntry(
    lakeshoreIndustries,
    { domain: "applications_systems", field: "vendor", resolves_to: "vendors_contracts.vendor_name", checked: 152, resolved: 7, resolution_rate_pct: 4.61, status: "blocker" },
    new Set(),
  );
  assert(c.blocker_class === "referential_identity_defect", `lakeshore-industries' applications_systems.vendor check (real distinct names that don't resolve) is a genuine referential gap, not a rule defect (got ${c.blocker_class})`);
}
{
  const meridian = registry.activeTenants.find((t) => t.tenantKey === "meridian-health");
  const c = classifyCrossDomainEntry(
    meridian,
    { domain: "executive_interviews", field: "initiative_link", resolves_to: "programs_initiatives.program_name OR ai_automation_use_cases.use_case_name", checked: 221, resolved: 0, resolution_rate_pct: 0, status: "blocker" },
    new Set(["programs_initiatives", "ai_automation_use_cases"]),
  );
  assert(c.blocker_class === "source_adapter_missing", `meridian-health's interview initiative_link check correctly attributes the failure to its schema-mismatched target domains, not a separate referential defect (got ${c.blocker_class})`);
}

// --- Real-tenant regression: build the full ledger and check internal consistency ---
{
  const VALID_CLASSES = new Set([
    "audit_rule_defect", "source_adapter_missing", "schema_mapping_defect", "migration_defect",
    "synthetic_domain_empty", "synthetic_domain_thin", "synthetic_boilerplate",
    "referential_identity_defect", "genuine_not_applicable",
  ]);
  let allRows = [];
  for (const tenant of registry.activeTenants) {
    const result = auditTenant(tenant);
    allRows = allRows.concat(buildLedgerForTenant(tenant, result));
  }
  assert(allRows.length > 0, "the full 6-tenant ledger produces at least one row");
  assert(allRows.every((r) => VALID_CLASSES.has(r.blocker_class)), "every ledger row's blocker_class is one of the nine declared classes");
  assert(allRows.every((r) => r.proposed_repair && r.proposed_repair.length > 0), "every ledger row carries a nonblank proposed_repair");
  assert(allRows.every((r) => r.acceptance_test && r.acceptance_test.length > 0), "every ledger row carries a nonblank acceptance_test");
  const meridianRows = allRows.filter((r) => r.tenant === "meridian-health" && r.blocker_class === "source_adapter_missing");
  assert(meridianRows.length >= 16, `meridian-health has at least 16 source_adapter_missing entries (the 16 schema-mismatched domains) (got ${meridianRows.length})`);
  const apexEmptyRows = allRows.filter((r) => r.tenant === "apex-retail" && r.blocker_class === "synthetic_domain_empty");
  assert(apexEmptyRows.length === 3, `apex-retail has exactly 3 synthetic_domain_empty entries (its 3 genuinely header-only domains) (got ${apexEmptyRows.length})`);
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

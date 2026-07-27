#!/usr/bin/env node
// Gate 2.1 Phase C (read-only, zero-write). A typed, deterministic adapter
// translating meridian-health's real "tower fact" rows (business_name/
// context_item/dimension/evidence_id/... -- Gate 2's confirmed schema
// divergence across 16 domains) into the Phase B universal scenario model.
//
// TWO findings from direct investigation of the real active files drove this
// design, both disclosed in the reconciliation report this script produces:
//
// 1. Every affected domain file except workforce_roles/enterprise_profile/
//    infrastructure_platforms/industry_context_patterns/expert_lenses mixes
//    a small number of genuine domain-specific rows (source_type =
//    "synthetic_v3_context_generation") with the SAME 221 executive-interview
//    rows (source_type = "executive_interview") broadcast identically across
//    every file under a different `dimension` label. Those interview rows
//    are NOT that domain's content -- they are already correctly handled by
//    evidence-v4-migration-dry-run.mjs's executive_interviews/evidence_items
//    pipeline. Filtering them out is this adapter's first, universal step.
// 2. Several domains' remaining "real" rows duplicate ANOTHER domain's
//    content rather than carrying anything distinct: 15_industry_context_
//    patterns and 16_expert_lenses share the exact same 7 rows;
//    18_operational_process_evidence's 7 real rows populate only the same
//    generic industry_context/signals fields (zero process-specific columns);
//    05_data_assets_integrations's real rows share the same use_case-grouped
//    narrative as 09_programs_initiatives/10_ai_automation_use_cases, not
//    discrete named data assets; 14_metrics_outcomes's real rows are
//    use_case+risk_or_gap duplicates of 11_risks_controls with no real
//    metric_name identity. workforce_roles has ZERO non-interview rows: no
//    real workforce content exists to normalize. These are explicitly NOT
//    adapted here -- forcing an adapter over content that isn't really there
//    would be exactly the "silently infer unsupported identity" this phase
//    must not do. They're flagged for Phase D governed generation instead.
//
// HARD GUARANTEES: zero writes to active/current, tenant-input-registry.json,
// Postgres, or any runtime path. Zero Claude calls. Output lands only under
// reports/tenant-semantic-remediation/.
//
// Run: node scripts/data-build/tenant-scenario-model/meridian-tower-fact-adapter.mjs
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { createGraph, addEntity, validateGraph, buildCrosswalk, UNRESOLVED_REF } from "./scenario-model.mjs";

const repoRoot = process.cwd();
const MERIDIAN_ROOT = "datasets/tenant-inputs/active/meridian-health/current";
const outDir = path.join(repoRoot, "reports/tenant-semantic-remediation");

function nonBlank(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function readDomainCsv(numericPrefix) {
  const dir = path.join(repoRoot, MERIDIAN_ROOT);
  const match = fs.readdirSync(dir).find((f) => f.startsWith(`${numericPrefix}_`) && f.endsWith(".csv"));
  if (!match) throw new Error(`No active file found for meridian-health domain prefix ${numericPrefix}_`);
  const rows = Papa.parse(fs.readFileSync(path.join(dir, match), "utf8"), { header: true, skipEmptyLines: true }).data;
  return { fileName: match, rows };
}

// Step 1, universal: exclude the broadcast executive-interview rows -- they
// are not this domain's content.
function realContentRows(rows) {
  return rows.filter((r) => r.source_type !== "executive_interview");
}

function dedupeByField(rows, field) {
  const seen = new Map();
  const dropped = [];
  for (const row of rows) {
    const key = String(row[field] || "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      dropped.push(row);
    } else {
      seen.set(key, row);
    }
  }
  return { unique: [...seen.values()], droppedDuplicateCount: dropped.length };
}

function groupByField(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row[field] || "").trim();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function joinDistinct(values) {
  return [...new Set(values.map((v) => String(v || "").trim()).filter(Boolean))].join("; ");
}

// Shared leader registry: owner names appear as free text on several
// domains (owner_role on function/business_unit, owner on application/
// platform). Rather than storing each as a disconnected string, this
// resolves them to real leader entities -- deduped by display name, created
// once, referenced everywhere -- so the graph's references are genuinely
// ID-based, matching the manifest's own projectsTo contract (which expects
// e.g. "executive_owner_ref->display_name", a reference, not a plain field).
function getOrCreateLeader(graph, leaderRegistry, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (leaderRegistry.has(key)) return leaderRegistry.get(key);
  const leader = addEntity(graph, "leader", { display_name: trimmed });
  leaderRegistry.set(key, leader);
  return leader;
}

// Records the reconciliation entry for one target canonical field.
function field(canonicalField, classification, sourceExpression, note) {
  return { canonical_field: canonicalField, classification, source_expression: sourceExpression, note: note || "" };
}

const reconciliation = [];
function recordDomainReconciliation(domain, entry) {
  reconciliation.push({ domain, ...entry });
}

// --- Enterprise (00): row 1 carries identity, row 2 (explicitly labeled a
// disclosed "planning_assumption", confidence=low) carries the real detail
// fields. Merged into ONE entity, not two. ---
function buildEnterprise(graph) {
  const { rows } = readDomainCsv("00");
  const identityRow = rows.find((r) => r.source_type === "synthetic_v3_context_generation");
  const detailRow = rows.find((r) => r.source_type === "profile_planning_assumption");
  const entity = addEntity(graph, "enterprise", {
    entity_name: identityRow?.business_name || "",
    industry: identityRow?.industry || "",
    sub_industry: detailRow?.sub_industry || "",
    revenue_usd: detailRow?.revenue_usd || "",
    employee_count: detailRow?.employee_count || "",
    headquarters: detailRow?.headquarters || "",
    operating_regions: detailRow?.operating_regions || "",
    business_model: detailRow?.business_model || "",
    customer_segments: detailRow?.business_segments || "",
    mission: detailRow?.mission_statement || "",
    vision: detailRow?.vision_statement || "",
    strategic_priorities: detailRow?.strategic_priorities || "",
    leadership_team: detailRow?.leadership_roles || "",
  });
  entity.rawSourceRows = [identityRow, detailRow].filter(Boolean);
  entity.sourceEvidenceIds = [identityRow?.evidence_id, detailRow?.evidence_id].filter(nonBlank);
  recordDomainReconciliation("enterprise_profile", {
    real_content_rows: [identityRow, detailRow].filter(Boolean).length,
    total_raw_rows: rows.length,
    fields: [
      field("entity_name", "direct", "row1.business_name"),
      field("industry", "direct", "row1.industry"),
      field("revenue_usd/employee_count/headquarters/business_model/leadership_team/strategic_priorities/mission/vision", "direct", "row2 (explicitly disclosed profile_planning_assumption, confidence=low -- preserved as-is, not upgraded to high confidence)"),
    ],
    notes: "Two source rows merge into one entity: row1 is identity-only, row2 is the disclosed detail row. No fields required inference beyond this merge.",
  });
  return entity;
}

// --- Simple one-row-per-entity domains: function, business_unit,
// application, platform, spend_line. Same shape: filter interview rows,
// dedupe by business_name, direct-map identity + a handful of real fields. ---
function buildSimpleDomain(graph, entityType, numericPrefix, domainKey, fieldMap, options = {}) {
  const { rows, fileName } = readDomainCsv(numericPrefix);
  const real = realContentRows(rows);
  const { unique, droppedDuplicateCount } = dedupeByField(real, options.identityColumn || "business_name");
  const refFieldMap = options.refFieldMap || {};
  const entities = unique.map((row) => {
    const fields = {};
    for (const [target, source] of Object.entries(fieldMap)) {
      fields[target] = typeof source === "function" ? source(row) : row[source] || "";
    }
    const refs = {};
    for (const [target, resolver] of Object.entries(refFieldMap)) {
      refs[target] = resolver(row);
    }
    const entity = addEntity(graph, entityType, fields, refs);
    entity.rawSourceRows = [row];
    entity.sourceEvidenceIds = [row.evidence_id].filter(nonBlank);
    return entity;
  });
  recordDomainReconciliation(domainKey, {
    source_file: fileName,
    total_raw_rows: rows.length,
    interview_rows_excluded: rows.length - real.length,
    real_content_rows: real.length,
    duplicate_rows_within_domain: droppedDuplicateCount,
    entities_created: entities.length,
    fields: [
      ...Object.entries(fieldMap).map(([target, source]) => field(target, "direct", typeof source === "string" ? `row.${source}` : "derived (see adapter code)")),
      ...Object.keys(refFieldMap).map((target) => field(target, "derived", "resolved to a real leader entity, deduped by name across all domains that mention this owner")),
    ],
  });
  return entities;
}

// --- Use-case-grouped domains (program, ai_use_case): meridian's real rows
// are one row per (use_case, data_domain) pair, not one row per program.
// Group by use_case; data_domain values across the group become supporting
// context, not a separate identity. ---
function buildUseCaseGroupedDomain(graph, entityType, numericPrefix, domainKey, targetIdentityField, requiredUnresolvedRefs = {}) {
  const { rows, fileName } = readDomainCsv(numericPrefix);
  const real = realContentRows(rows);
  const groups = groupByField(real, "use_case");
  const entities = [];
  for (const [useCase, groupRows] of groups) {
    const first = groupRows[0];
    // Budget/value fields are only trusted when the source itself doesn't
    // explicitly disclaim them (meridian's real rows mark most of these
    // "not_budget_fact"/"excluded_from_program_funding"/"not_provided" --
    // honoring that disclaimer means leaving the canonical field unresolved
    // rather than fabricating a budget figure the source itself rejects).
    const hasRealBudget = groupRows.some((r) => nonBlank(r.approved_funding_usd) && r.approved_funding_usd !== "0");
    const fields = {
      [targetIdentityField]: useCase,
      objective: first.value_hypothesis || "",
      dependencies: joinDistinct(groupRows.map((r) => r.data_domain)),
      risks: joinDistinct(groupRows.flatMap((r) => String(r.evidence_needed || "").split(";").map((s) => s.trim()))),
      budget_usd: hasRealBudget ? groupRows.find((r) => nonBlank(r.approved_funding_usd) && r.approved_funding_usd !== "0").approved_funding_usd : "",
      status: first.initiative_status || first.use_case_status || "",
    };
    const entity = addEntity(graph, entityType, fields, { ...requiredUnresolvedRefs });
    entity.rawSourceRows = groupRows;
    entity.sourceEvidenceIds = groupRows.map((r) => r.evidence_id).filter(nonBlank);
    entity.meridianSystemsMentioned = joinDistinct(groupRows.flatMap((r) => String(r.systems || "").split(";").map((s) => s.trim())));
    entities.push(entity);
  }
  recordDomainReconciliation(domainKey, {
    source_file: fileName,
    total_raw_rows: rows.length,
    interview_rows_excluded: rows.length - real.length,
    real_content_rows: real.length,
    entities_created: entities.length,
    fields: [
      field(targetIdentityField, "direct", "use_case (grouping key)"),
      field("objective", "derived", "value_hypothesis (first row in group)", "A description of the program rationale, not an exact objective statement."),
      field("dependencies", "derived", "joined distinct data_domain values across the group"),
      field("risks", "derived", "joined distinct evidence_needed clauses across the group"),
      field("budget_usd", "unresolved unless approved_funding_usd is real and nonzero", "approved_funding_usd", "Most rows explicitly disclaim these as \"not_budget_fact\"/\"excluded_from_program_funding\" -- honored by leaving blank, not fabricating a figure."),
      field("status", "direct", "initiative_status or use_case_status"),
      field("systems mentioned", "preserved as entity.meridianSystemsMentioned for a future cross-reference pass, not yet resolved to application entity IDs", "systems", "Real system names (e.g. \"Epic Clarity\") that DO match application entities built from 04 -- resolving these into system_refs is a follow-up, not done in this pass to avoid guessing at partial/ambiguous name matches without a review step."),
      ...(Object.keys(requiredUnresolvedRefs).length > 0
        ? [field(Object.keys(requiredUnresolvedRefs).join(", "), "unresolved (explicitly disclosed via UNRESOLVED_REF)", "no source column corresponds to a program/use-case sponsor or owner", "None of the grouped rows carry any owner-like field -- confirmed by direct sampling, not assumed. The scenario model declares this required for a complete program entity; marked UNRESOLVED_REF rather than fabricated or silently omitted.")]
        : []),
    ],
    notes: `Grouped ${real.length} raw rows into ${entities.length} distinct ${targetIdentityField} entities by use_case. One row per (use_case, data_domain) pair in the source, not one row per program.`,
  });
  return entities;
}

// --- Risk (union of 11_risks_controls + 14_metrics_outcomes, which are
// use_case+risk_or_gap duplicates of each other with no real metric_name
// identity in 14 -- confirmed by direct sampling, not assumed). ---
function buildRiskDomain(graph) {
  const { rows: riskRows, fileName: riskFile } = readDomainCsv("11");
  const { rows: metricRows, fileName: metricFile } = readDomainCsv("14");
  const realRisk = realContentRows(riskRows);
  const realMetric = realContentRows(metricRows);
  const { unique, droppedDuplicateCount } = dedupeByField(realRisk, "business_name");
  const entities = unique.map((row) => {
    const entity = addEntity(graph, "risk", {
      risk_or_control_name: row.risk_or_gap || row.business_name || "",
      severity: "",
      likelihood: "",
      mitigation_plan: joinDistinct(String(row.forbidden_claims || "").split(";")),
      evidence_required: row.metric_boundary || "",
    });
    entity.rawSourceRows = [row];
    entity.sourceEvidenceIds = [row.evidence_id].filter(nonBlank);
    return entity;
  });
  recordDomainReconciliation("risks_controls", {
    source_file: riskFile,
    total_raw_rows: riskRows.length,
    interview_rows_excluded: riskRows.length - realRisk.length,
    real_content_rows: realRisk.length,
    duplicate_rows_within_domain: droppedDuplicateCount,
    entities_created: entities.length,
    fields: [
      field("risk_or_control_name", "direct", "risk_or_gap"),
      field("mitigation_plan", "derived", "joined forbidden_claims clauses"),
      field("evidence_required", "direct", "metric_boundary"),
      field("severity/likelihood/control_owner/control_status", "unresolved", "no source column corresponds to these", "Not present in the tower-fact shape at all -- genuinely missing, not mismapped."),
    ],
    notes: "risk_or_control_name uses risk_or_gap, not business_name (which is a compound \"use_case: risk_or_gap\" string and would be a derived duplicate identity).",
  });
  recordDomainReconciliation("metrics_outcomes", {
    source_file: metricFile,
    total_raw_rows: metricRows.length,
    interview_rows_excluded: metricRows.length - realMetric.length,
    real_content_rows: realMetric.length,
    entities_created: 0,
    fields: [field("metric_name", "unresolved", "none", "This domain's real rows are use_case+risk_or_gap duplicates of 11_risks_controls with no distinct metric_name identity -- confirmed by sampling, not assumed. No metric entities created; would fabricate identity that isn't in the source.")],
    notes: "NOT ADAPTED. Flagged for Phase D: real, distinct metric definitions (metric_name/baseline_value/target_value/owner) need to be governed-generated, not extracted from this domain's current content.",
  });
  return entities;
}

// --- Vendor + contract (07): v3 combines vendor and contract into one row;
// one meridian row = one vendor entity + one contract entity referencing it. ---
function buildVendorsAndContracts(graph) {
  const { rows, fileName } = readDomainCsv("07");
  const real = realContentRows(rows);
  const { unique, droppedDuplicateCount } = dedupeByField(real, "business_name");
  const entities = unique.map((row) => {
    const vendor = addEntity(graph, "vendor", { vendor_name: row.business_name || "" });
    const contract = addEntity(graph, "contract", { contract_name: `${row.business_name}-contract`, service_category: row.service || "", risk_rating: row.contract_risk || "" }, { vendor_ref: vendor.id });
    vendor.rawSourceRows = contract.rawSourceRows = [row];
    vendor.sourceEvidenceIds = contract.sourceEvidenceIds = [row.evidence_id].filter(nonBlank);
    return { vendor, contract };
  });
  recordDomainReconciliation("vendors_contracts", {
    source_file: fileName,
    total_raw_rows: rows.length,
    interview_rows_excluded: rows.length - real.length,
    real_content_rows: real.length,
    duplicate_rows_within_domain: droppedDuplicateCount,
    entities_created: entities.length * 2,
    fields: [
      field("vendor_name", "direct", "business_name"),
      field("service_category", "direct", "service"),
      field("risk_rating", "direct", "contract_risk"),
      field("annual_spend_usd/renewal_date/commercial_model", "unresolved", "no source column corresponds to these"),
    ],
    notes: "One meridian row produces one vendor + one contract entity, per v3's own vendor+contract row combination.",
  });
  return entities;
}

// --- Thin/duplicate-content domains: real rows exist but populate only the
// generic industry_context/signals fields shared identically between
// industry_context_patterns and expert_lenses. Both get an entity (identity
// is real), but nearly every domain-specific field is honestly unresolved. ---
function buildThinSignalsDomain(graph, entityType, numericPrefix, domainKey, identityField) {
  const { rows, fileName } = readDomainCsv(numericPrefix);
  const real = realContentRows(rows);
  const entities = real.map((row) => {
    const entity = addEntity(graph, entityType, { [identityField]: row.business_name || "" });
    entity.rawSourceRows = [row];
    entity.sourceEvidenceIds = [row.evidence_id].filter(nonBlank);
    return entity;
  });
  recordDomainReconciliation(domainKey, {
    source_file: fileName,
    total_raw_rows: rows.length,
    interview_rows_excluded: rows.length - real.length,
    real_content_rows: real.length,
    entities_created: entities.length,
    fields: [
      field(identityField, "direct", "business_name"),
      field("all other domain-specific fields", "unresolved", "none", "These rows populate only industry_context/signals/module_next_actions -- fields shared identically with the sibling domain this content also appears in. No domain-specific content exists to map."),
    ],
    notes: `Identity is real and distinct (${entities.length} entities); everything else is thin. Flagged for Phase D governed enrichment, not further Phase C mapping.`,
  });
  return entities;
}

function recordNotAdaptedDomain(domainKey, numericPrefix, reason) {
  const { rows, fileName } = readDomainCsv(numericPrefix);
  const real = realContentRows(rows);
  recordDomainReconciliation(domainKey, {
    source_file: fileName,
    total_raw_rows: rows.length,
    interview_rows_excluded: rows.length - real.length,
    real_content_rows: real.length,
    entities_created: 0,
    fields: [],
    notes: `NOT ADAPTED. ${reason}`,
  });
}

function buildMeridianGraph() {
  const graph = createGraph("meridian-health");
  const leaderRegistry = new Map();
  buildEnterprise(graph);
  buildSimpleDomain(graph, "function", "01", "business_functions", { function_name: "business_name", current_state_notes: (r) => [r.operating_model, r.metrics_or_kpis, r.processes].filter(Boolean).join(" | ") }, { refFieldMap: { executive_owner_ref: (r) => getOrCreateLeader(graph, leaderRegistry, r.owner_role)?.id } });
  buildSimpleDomain(graph, "business_unit", "02", "org_ownership", { org_unit: "business_name", location_scope: "operating_model" }, { refFieldMap: { leader_ref: (r) => getOrCreateLeader(graph, leaderRegistry, r.owner_role)?.id } });
  buildSimpleDomain(graph, "application", "04", "applications_systems", { system_name: "business_name", system_category: "capability", criticality: "criticality", lifecycle_state: "lifecycle_status" }, { refFieldMap: { business_owner_ref: (r) => getOrCreateLeader(graph, leaderRegistry, r.owner)?.id } });
  buildSimpleDomain(graph, "platform", "06", "infrastructure_platforms", { platform_name: "business_name", platform_type: "capability", criticality: "criticality", lifecycle_state: "lifecycle_status" }, { refFieldMap: { operational_owner_ref: (r) => getOrCreateLeader(graph, leaderRegistry, r.owner)?.id } });
  buildVendorsAndContracts(graph);
  buildSimpleDomain(graph, "spend_line", "08", "spend_value", { spend_category: "business_name", annual_spend_usd: (r) => (nonBlank(r.amount_usd) && r.amount_usd !== "not_provided" ? r.amount_usd : ""), value_driver: "value_hypothesis" });
  buildUseCaseGroupedDomain(graph, "program", "09", "programs_initiatives", "program_name", { sponsor_ref: UNRESOLVED_REF });
  buildUseCaseGroupedDomain(graph, "ai_use_case", "10", "ai_automation_use_cases", "use_case_name");
  buildRiskDomain(graph);
  buildThinSignalsDomain(graph, "industry_pattern", "15", "industry_context_patterns", "pattern_name");
  buildThinSignalsDomain(graph, "expert_lens", "16", "expert_lenses", "lens_name");
  recordNotAdaptedDomain("workforce_roles", "03", "Zero non-interview rows exist (100% of 221 rows are the broadcast SA07 executive-interview content, already handled by the executive_interviews pipeline). No real workforce-role content (persona, skills, pain points) exists anywhere in this tenant's active data to normalize. Requires Phase D governed generation, not a Phase C adapter.");
  recordNotAdaptedDomain("data_assets_integrations", "05", "Real rows share the same use_case-grouped narrative as 09_programs_initiatives/10_ai_automation_use_cases at data_domain grain, not discrete named data assets. Creating data_asset entities from this would fabricate identity (a data_domain tag like \"EMR clinical\" is not a named data asset). Requires Phase D governed generation of real, named data assets.");
  recordNotAdaptedDomain("operational_process_evidence", "18", "Real rows populate only the same generic industry_context/signals fields as 15/16 -- zero process-specific columns (process_owner, systems_used, cycle_time, etc.) are populated anywhere. No process content exists to adapt. Requires Phase D governed generation.");
  return graph;
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
  const graph = buildMeridianGraph();
  const validation = validateGraph(graph);
  if (!validation.valid) {
    throw new Error(`Meridian scenario graph failed validation: ${JSON.stringify(validation.errors, null, 2)}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const graphSummary = [...graph.entities.values()].map((e) => ({
    id: e.id,
    entityType: e.entityType,
    fields: e.fields,
    refs: e.refs,
    sourceEvidenceIds: e.sourceEvidenceIds || [],
    rawSourceRowCount: (e.rawSourceRows || []).length,
  }));
  fs.writeFileSync(path.join(outDir, "meridian-scenario-graph.json"), JSON.stringify({ tenantKey: "meridian-health", entityCount: graphSummary.length, entities: graphSummary }, null, 2));

  const crosswalk = buildCrosswalk(graph);
  writeCsv(path.join(outDir, "meridian-scenario-id-crosswalk.csv"), crosswalk, ["entity_type", "stable_id", "display_name", "projected_domain", "projected_row_identity"]);

  fs.writeFileSync(path.join(outDir, "meridian-source-to-canonical-reconciliation.json"), JSON.stringify({
    tenant_key: "meridian-health",
    headline_finding: "Every affected domain except workforce_roles/enterprise_profile/infrastructure_platforms/industry_context_patterns/expert_lenses mixes a small number of genuine rows with the SAME 221 executive-interview rows broadcast identically across every file under a different dimension label -- those rows are not that domain's content. After excluding them, real per-domain row counts are 2-77, not 221-869.",
    domains: reconciliation,
    entities_by_type: Object.fromEntries(
      [...new Set(graphSummary.map((e) => e.entityType))].map((t) => [t, graphSummary.filter((e) => e.entityType === t).length]),
    ),
    validation: { valid: validation.valid, errors: validation.errors },
  }, null, 2));

  console.log(JSON.stringify({ entityCount: graphSummary.length, entities_by_type: Object.fromEntries([...new Set(graphSummary.map((e) => e.entityType))].map((t) => [t, graphSummary.filter((e) => e.entityType === t).length])), validation_valid: validation.valid }, null, 2));
  return { graph, reconciliation, crosswalk };
}

export { buildMeridianGraph, realContentRows, dedupeByField, groupByField, joinDistinct, readDomainCsv };

const isDirectlyExecuted = import.meta.url === `file://${process.argv[1]}`;
if (isDirectlyExecuted) {
  main();
}

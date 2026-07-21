#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readCsv, writeCsv } from "../tenant-v3/lib/csv.mjs";

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();
const reportDir = path.join(repoRoot, "reports/home-tenant-coverage");

const HEADERS = [
  "tenant_key",
  "from_object_type",
  "from_object_name",
  "relationship_type",
  "to_object_type",
  "to_object_name",
  "relationship_strength",
  "evidence_basis",
  "current_state_or_target_state",
  "source_file",
  "source_date",
  "confidence",
  "known_gaps",
  "record_id",
  "evidence_id",
  "source_row_id",
  "dimension_key",
  "dimension_name",
  "active_candidate_status",
  "candidate_contract_version",
  "load_run_id",
  "generated_at",
  "generation_method",
  "source_basis",
  "truth_statement",
];

const TENANTS = [
  {
    tenantKey: "skyharbor-air",
    routeKey: "skyharbor-air",
    prefix: "SHA",
    mode: "promote_candidate",
    candidateDir:
      "datasets/tenant-inputs/candidates/skyharbor-air/rich-synthetic-2026-07-v3",
    generatedGraphDir:
      "datasets/tenant-inputs/generated/skyharbor-air/rich-synthetic-2026-07-v3",
    baselineBeforeFixRows: 77,
    contractVersion: "skyharbor-air-rich-standard-active-planning-20260721",
    sourceBasis:
      "validated promotion from rich synthetic airline relationship candidate",
    truthStatement:
      "Planning-grade synthetic airline relationship context; not real airline production data and not client-certified.",
    forbiddenPatterns: [/Lakeshore Industries/i, /First Capital Financial/i],
  },
  {
    tenantKey: "first-capital-financial",
    routeKey: "first-capital",
    prefix: "FCF",
    mode: "promote_candidate",
    candidateDir:
      "datasets/tenant-inputs/candidates/first-capital-financial/rich-synthetic-2026-07-v3",
    generatedGraphDir:
      "datasets/tenant-inputs/generated/first-capital-financial/rich-synthetic-2026-07-v3",
    baselineBeforeFixRows: 11,
    contractVersion:
      "first-capital-financial-rich-standard-active-planning-20260721",
    sourceBasis:
      "validated promotion from rich synthetic financial-services relationship candidate",
    truthStatement:
      "Planning-grade synthetic financial-services relationship context; not real bank production data and not client-certified.",
    forbiddenPatterns: [/Lakeshore Industries/i, /SkyHarbor Air/i],
  },
  {
    tenantKey: "meridian-health",
    routeKey: "meridian-health",
    prefix: "MER",
    mode: "derive_active",
    baselineBeforeFixRows: 298,
    contractVersion: "meridian-health-active-relationship-depth-20260721",
    sourceBasis: "derived from active healthcare tenant source rows",
    truthStatement:
      "Planning-grade synthetic healthcare relationship context derived from active source rows; not real health-system production data and not client-certified.",
    forbiddenPatterns: [/Lakeshore Industries/i, /First Capital Financial/i, /SkyHarbor Air/i],
  },
  {
    tenantKey: "apex-retail",
    routeKey: "apex-retail",
    prefix: "APX",
    mode: "derive_active",
    baselineBeforeFixRows: 13,
    contractVersion: "apex-retail-active-relationship-depth-20260721",
    sourceBasis: "derived from active retail tenant source rows",
    truthStatement:
      "Planning-grade synthetic retail relationship context derived from active source rows; not real retailer production data and not client-certified.",
    forbiddenPatterns: [/Lakeshore Industries/i, /First Capital Financial/i, /SkyHarbor Air/i],
  },
  {
    tenantKey: "lakeshore-holdings",
    routeKey: "lakeshore-holdings",
    prefix: "LKH",
    mode: "derive_active",
    baselineBeforeFixRows: 10,
    contractVersion: "lakeshore-holdings-active-relationship-depth-20260721",
    sourceBasis: "derived from active holding-company source rows",
    truthStatement:
      "Planning-grade synthetic holding-company relationship context derived from active source rows; holdco direct revenue remains zero by design and facts are not client-certified.",
    forbiddenPatterns: [/Lakeshore Industries/i, /First Capital Financial/i, /SkyHarbor Air/i],
  },
];

function activeDir(tenantKey) {
  return path.join(repoRoot, "datasets/tenant-inputs/active", tenantKey, "current");
}

function activeRelationshipFile(tenantKey) {
  return path.join(activeDir(tenantKey), "12_relationships.csv");
}

function exists(file) {
  return fs.existsSync(file);
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function splitValues(value) {
  return clean(value)
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter((item) => item && !/^not_provided$/i.test(item))
    .slice(0, 24);
}

function hash(value, length = 12) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

function first(row, keys) {
  for (const key of keys) {
    const value = clean(row[key]);
    if (value) return value;
  }
  return "";
}

function readRowsIfPresent(file) {
  return exists(file) ? readCsv(file) : [];
}

function activeRows(tenantKey, fileName) {
  return readRowsIfPresent(path.join(activeDir(tenantKey), fileName)).filter(
    (row) => !/^(retired|inactive|blocked|rejected|deleted)$/i.test(clean(row.active_candidate_status || row.status)),
  );
}

function makeRelationship(tenant, input) {
  const fromName = clean(input.from_object_name);
  const toName = clean(input.to_object_name);
  const relationshipType = normalizeRelationshipType(input.relationship_type);
  const fromType = normalizeType(input.from_object_type);
  const toType = normalizeType(input.to_object_type);
  const seed = `${tenant.tenantKey}:${fromType}:${fromName}:${relationshipType}:${toType}:${toName}`;
  return {
    tenant_key: tenant.tenantKey,
    from_object_type: fromType,
    from_object_name: fromName,
    relationship_type: relationshipType,
    to_object_type: toType,
    to_object_name: toName,
    relationship_strength: clean(input.relationship_strength) || "medium",
    evidence_basis:
      clean(input.evidence_basis) ||
      clean(input.evidence_id) ||
      `${tenant.prefix}-REL-EVID-${hash(seed, 8)}`,
    current_state_or_target_state:
      clean(input.current_state_or_target_state) ||
      "planning_grade_active_relationship_context",
    source_file: clean(input.source_file),
    source_date: clean(input.source_date) || "2026-07-21",
    confidence: clean(input.confidence) || "medium",
    known_gaps:
      clean(input.known_gaps) ||
      "Relationship is planning-grade and needs source-owner validation before board-grade use.",
    record_id: clean(input.record_id) || `${tenant.prefix}-12-${hash(seed, 10).toUpperCase()}`,
    evidence_id:
      clean(input.evidence_id) ||
      clean(input.evidence_basis) ||
      `${tenant.prefix}-REL-EVID-${hash(seed, 8).toUpperCase()}`,
    source_row_id:
      clean(input.source_row_id) ||
      `${tenant.prefix}-12_RELATIONSHIPS-SRC-${hash(seed, 10).toUpperCase()}`,
    dimension_key: "12_relationships",
    dimension_name: "Relationships",
    active_candidate_status: "active_planning_grade",
    candidate_contract_version: tenant.contractVersion,
    load_run_id: `${tenant.prefix}-RELATIONSHIP-PROMOTION-20260721`,
    generated_at: generatedAt,
    generation_method:
      input.generation_method === "deterministic synthetic enterprise context generator"
        ? "validated_candidate_promotion"
        : clean(input.generation_method) || "active_source_relationship_derivation",
    source_basis: tenant.sourceBasis,
    truth_statement: tenant.truthStatement,
  };
}

function normalizeType(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_/-]/g, "_")
    .replace(/^_+|_+$/g, "") || "entity";
}

function normalizeRelationshipType(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_/-]/g, "_")
    .replace(/^_+|_+$/g, "") || "related_to";
}

function addEdge(tenant, out, seen, input) {
  const relationship = makeRelationship(tenant, input);
  if (!relationship.from_object_name || !relationship.to_object_name) return false;
  if (
    relationship.from_object_name.toLowerCase() ===
    relationship.to_object_name.toLowerCase()
  ) {
    return false;
  }
  const key = [
    relationship.from_object_type,
    relationship.from_object_name.toLowerCase(),
    relationship.relationship_type,
    relationship.to_object_type,
    relationship.to_object_name.toLowerCase(),
  ].join("|");
  if (seen.has(key)) return false;
  seen.add(key);
  out.push(relationship);
  return true;
}

function addSplit(tenant, out, seen, row, fromType, fromName, relationshipType, toType, toValues, sourceFile, sourceRowNumber) {
  for (const toName of splitValues(toValues)) {
    addEdge(tenant, out, seen, {
      from_object_type: fromType,
      from_object_name: fromName,
      relationship_type: relationshipType,
      to_object_type: toType,
      to_object_name: toName,
      relationship_strength: row.relationship_strength || row.criticality || row.risk_rating || "medium",
      evidence_basis: row.evidence_id || row.record_id || row.original_row_id || `${sourceFile}:${sourceRowNumber}`,
      source_file: `datasets/tenant-inputs/active/${tenant.tenantKey}/current/${sourceFile}`,
      source_date: row.source_date,
      confidence: row.confidence,
      known_gaps: row.known_gaps,
    });
  }
}

function promoteCandidateRelationships(tenant) {
  const file = path.join(repoRoot, tenant.candidateDir, "12_relationships.csv");
  if (!exists(file)) throw new Error(`Missing candidate relationships for ${tenant.tenantKey}`);
  const rows = readCsv(file);
  return rows
    .map((row) =>
      makeRelationship(tenant, {
      ...row,
      current_state_or_target_state:
        clean(row.current_state_or_target_state).replace(/candidate/gi, "planning_grade_active") ||
        "planning_grade_active_relationship_context",
      source_file: `datasets/tenant-inputs/candidates/${tenant.tenantKey}/rich-synthetic-2026-07-v3/12_relationships.csv`,
      known_gaps: [
        clean(row.known_gaps),
        "Promoted from candidate after local structural validation; still requires client/source-owner certification.",
      ].filter(Boolean).join(" "),
      }),
    )
    .filter(
      (row) =>
        row.from_object_name &&
        row.to_object_name &&
        row.from_object_name.toLowerCase() !== row.to_object_name.toLowerCase(),
    );
}

function deriveActiveRelationships(tenant) {
  const out = [];
  const seen = new Set();
  for (const row of activeRows(tenant.tenantKey, "01_business_functions.csv")) {
    const fn = first(row, ["function_name", "business_name"]);
    addSplit(tenant, out, seen, row, "function", fn, "owned_by", "leader", row.executive_owner || row.owner || row.business_owner, "01_business_functions.csv", row.__sourceRowNumber);
  }
  for (const row of activeRows(tenant.tenantKey, "04_applications_systems.csv")) {
    const system = first(row, ["system_name", "application_name", "business_name", "context_item"]);
    const functionName = row.business_function || row.capability || row.use_case || row.data_domain;
    addSplit(tenant, out, seen, row, "function", functionName, "uses", "system", system, "04_applications_systems.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "leader", row.business_owner, "owns_business_use_of", "system", system, "04_applications_systems.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "leader", row.technology_owner || row.owner, "owns_technology_for", "system", system, "04_applications_systems.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "vendor", row.vendor || row.vendor_id, "supports", "system", system, "04_applications_systems.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "system", system, "uses_data_domain", "data_domain", row.data_domains || row.data_dependencies || row.data_domain, "04_applications_systems.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "system", system, "integrates_with", "system", row.integrations, "04_applications_systems.csv", row.__sourceRowNumber);
  }
  for (const row of activeRows(tenant.tenantKey, "05_data_assets_integrations.csv")) {
    const asset = first(row, ["data_asset_name", "data_domain", "business_name", "context_item"]);
    addSplit(tenant, out, seen, row, "system", row.source_system || row.systems, "feeds", "data_asset", asset, "05_data_assets_integrations.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "data_asset", asset, "feeds", "system", row.target_system || row.systems, "05_data_assets_integrations.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "owner", row.data_owner, "owns", "data_asset", asset, "05_data_assets_integrations.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "data_asset", asset, "runs_on", "platform", row.platform_or_database, "05_data_assets_integrations.csv", row.__sourceRowNumber);
  }
  for (const row of activeRows(tenant.tenantKey, "07_vendors_contracts.csv")) {
    const vendor = first(row, ["vendor_name", "vendor_id", "business_name"]);
    const contract = first(row, ["contract_name", "service_category", "context_item"]);
    addSplit(tenant, out, seen, row, "vendor", vendor, "provides", "contract", contract, "07_vendors_contracts.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "vendor", vendor, "supports", "system", row.supported_systems || row.linked_systems || row.systems || row.affected_systems, "07_vendors_contracts.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "vendor", vendor, "supports", "function", row.supported_functions || row.capability || row.use_case, "07_vendors_contracts.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "leader", row.business_owner || row.contract_owner, "owns_vendor_relationship", "vendor", vendor, "07_vendors_contracts.csv", row.__sourceRowNumber);
  }
  for (const row of activeRows(tenant.tenantKey, "09_programs_initiatives.csv")) {
    const program = first(row, ["program_name", "initiative_name", "business_name", "context_item"]);
    addSplit(tenant, out, seen, row, "program", program, "sponsored_by", "leader", row.business_sponsor || row.owner, "09_programs_initiatives.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "leader", row.technology_owner || row.owner, "owns_technology_for", "program", program, "09_programs_initiatives.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "program", program, "depends_on", "dependency", row.dependencies || row.affected_systems || row.systems, "09_programs_initiatives.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "program", program, "has_risk", "risk", row.risks || row.risk_or_gap, "09_programs_initiatives.csv", row.__sourceRowNumber);
  }
  for (const row of activeRows(tenant.tenantKey, "10_ai_automation_use_cases.csv")) {
    const useCase = first(row, ["use_case_name", "ai_use_case", "use_case", "business_name", "context_item"]);
    addSplit(tenant, out, seen, row, "function", row.business_function || row.capability, "has_ai_use_case", "ai_use_case", useCase, "10_ai_automation_use_cases.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "process", row.process_area || row.affected_process, "is_supported_by", "ai_use_case", useCase, "10_ai_automation_use_cases.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "ai_use_case", useCase, "requires_data", "data_domain", row.required_data || row.required_data_domains || row.data_domain, "10_ai_automation_use_cases.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "ai_use_case", useCase, "requires_system", "system", row.required_systems || row.systems || row.affected_systems, "10_ai_automation_use_cases.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "ai_use_case", useCase, "has_control", "control", row.risk_controls, "10_ai_automation_use_cases.csv", row.__sourceRowNumber);
  }
  for (const row of activeRows(tenant.tenantKey, "11_risks_controls.csv")) {
    const risk = first(row, ["risk_or_control_name", "risk_name", "risk_or_gap", "business_name", "context_item"]);
    addSplit(tenant, out, seen, row, "risk", risk, "affects", "system", row.systems_impacted || row.affected_systems || row.systems, "11_risks_controls.csv", row.__sourceRowNumber);
    addSplit(tenant, out, seen, row, "leader", row.control_owner, "owns_control_for", "risk", risk, "11_risks_controls.csv", row.__sourceRowNumber);
  }
  return out;
}

function validateRows(tenant, rows) {
  const issues = [];
  const text = JSON.stringify(rows);
  for (const pattern of tenant.forbiddenPatterns) {
    if (pattern.test(text)) issues.push(`forbidden pattern ${pattern}`);
  }
  const missingEndpoints = rows.filter(
    (row) => !clean(row.from_object_name) || !clean(row.to_object_name),
  ).length;
  if (missingEndpoints) issues.push(`${missingEndpoints} relationship rows have missing endpoints`);
  const selfLoops = rows.filter(
    (row) => clean(row.from_object_name).toLowerCase() === clean(row.to_object_name).toLowerCase(),
  ).length;
  if (selfLoops) issues.push(`${selfLoops} relationship rows are self-loops`);
  const semanticKeys = new Set(
    rows.map((row) =>
      [
        row.from_object_type,
        clean(row.from_object_name).toLowerCase(),
        row.relationship_type,
        row.to_object_type,
        clean(row.to_object_name).toLowerCase(),
      ].join("|"),
    ),
  );
  const wrongTenant = rows.filter((row) => row.tenant_key !== tenant.tenantKey).length;
  if (wrongTenant) issues.push(`${wrongTenant} rows have wrong tenant_key`);
  if (rows.length < 25) issues.push(`too few relationship rows: ${rows.length}`);
  return { issues, missingEndpoints, selfLoops, semanticEdgeCount: semanticKeys.size };
}

function validateCandidateGraph(tenant) {
  if (!tenant.generatedGraphDir) {
    return { node_count: 0, edge_count: 0, orphan_edges: 0, self_loop_edges: 0, status: "not_applicable" };
  }
  const nodesFile = path.join(repoRoot, tenant.generatedGraphDir, "graph-nodes.csv");
  const edgesFile = path.join(repoRoot, tenant.generatedGraphDir, "graph-edges.csv");
  if (!exists(nodesFile) || !exists(edgesFile)) {
    return { node_count: 0, edge_count: 0, orphan_edges: 0, self_loop_edges: 0, status: "missing" };
  }
  const nodes = readCsv(nodesFile);
  const nodeKeys = new Set(nodes.map((node) => node.node_key));
  const edges = readCsv(edgesFile);
  const orphanEdges = edges.filter(
    (edge) => !nodeKeys.has(edge.from_node_key) || !nodeKeys.has(edge.to_node_key),
  ).length;
  const selfLoopEdges = edges.filter(
    (edge) => edge.from_node_key && edge.from_node_key === edge.to_node_key,
  ).length;
  return {
    node_count: nodes.length,
    edge_count: edges.length,
    orphan_edges: orphanEdges,
    self_loop_edges: selfLoopEdges,
    status: orphanEdges || selfLoopEdges ? "fail" : "pass",
  };
}

function promoteTenant(tenant) {
  const target = activeRelationshipFile(tenant.tenantKey);
  const beforeRows = readRowsIfPresent(target);
  const promotedRows =
    tenant.mode === "promote_candidate"
      ? promoteCandidateRelationships(tenant)
      : deriveActiveRelationships(tenant);
  const validation = validateRows(tenant, promotedRows);
  const graphValidation = validateCandidateGraph(tenant);
  if (validation.issues.length) {
    throw new Error(`${tenant.tenantKey} relationship validation failed: ${validation.issues.join("; ")}`);
  }
  writeCsv(target, HEADERS, promotedRows);
  return {
    tenant_key: tenant.tenantKey,
    route_key: tenant.routeKey,
    mode: tenant.mode,
    target_file: path.relative(repoRoot, target),
    rows_before: beforeRows.length,
    baseline_before_fix_rows: tenant.baselineBeforeFixRows,
    rows_after: promotedRows.length,
    unique_semantic_edges_after: validation.semanticEdgeCount,
    missing_endpoints_after: validation.missingEndpoints,
    self_loops_after: validation.selfLoops,
    candidate_graph_status: graphValidation.status,
    candidate_graph_nodes: graphValidation.node_count,
    candidate_graph_edges: graphValidation.edge_count,
    candidate_graph_orphan_edges: graphValidation.orphan_edges,
    candidate_graph_self_loop_edges: graphValidation.self_loop_edges,
    contract_version: tenant.contractVersion,
  };
}

function parseTenantArg() {
  const arg = process.argv.find((item) => item.startsWith("--tenant="));
  if (!arg) return TENANTS;
  const values = arg.split("=", 2)[1].split(",").map((item) => item.trim());
  if (values.includes("all")) return TENANTS;
  return TENANTS.filter(
    (tenant) => values.includes(tenant.tenantKey) || values.includes(tenant.routeKey),
  );
}

function writeReports(rows) {
  fs.mkdirSync(reportDir, { recursive: true });
  const jsonFile = path.join(reportDir, "relationship-depth-promotion-summary.json");
  const csvFile = path.join(reportDir, "relationship-depth-promotion-summary.csv");
  const mdFile = path.join(reportDir, "relationship-depth-promotion-summary.md");
  fs.writeFileSync(
    jsonFile,
    `${JSON.stringify({ generated_at: generatedAt, rows }, null, 2)}\n`,
  );
  writeCsv(csvFile, Object.keys(rows[0]), rows);
  const lines = [
    "# Active Relationship Depth Promotion",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This run promoted or derived planning-grade active relationship rows after structural validation. It did not mutate Azure/Postgres.",
    "",
    "| Tenant | Mode | Rows before | Rows after | Missing endpoints | Self-loops | Candidate graph check |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...rows.map(
      (row) =>
        `| ${row.tenant_key} | ${row.mode} | ${(row.baseline_before_fix_rows ?? row.rows_before).toLocaleString()} | ${row.rows_after.toLocaleString()} | ${row.missing_endpoints_after.toLocaleString()} | ${row.self_loops_after.toLocaleString()} | ${row.candidate_graph_status} |`,
    ),
    "",
    "## Boundary",
    "",
    "- Promoted rows are active planning-grade context, not client-certified production evidence.",
    "- Rich candidate graph CSVs were structurally checked for orphan edges and self-loops where present.",
    "- Lakeshore Holdings remains the only active Lakeshore path; stale `lakeshore-industries` was not used.",
    "- Azure graph/materialized context promotion remains a separate governed ACA data-build job.",
  ];
  fs.writeFileSync(mdFile, `${lines.join("\n")}\n`);
}

function main() {
  const tenants = parseTenantArg();
  if (!tenants.length) throw new Error("No tenants selected");
  const rows = tenants.map(promoteTenant);
  writeReports(rows);
  for (const row of rows) {
    console.log(
      `${row.tenant_key}: ${row.mode}, rows ${row.rows_before} -> ${row.rows_after}, endpoints=${row.missing_endpoints_after}, loops=${row.self_loops_after}, graph=${row.candidate_graph_status}`,
    );
  }
  console.log("Report: reports/home-tenant-coverage/relationship-depth-promotion-summary.md");
}

main();

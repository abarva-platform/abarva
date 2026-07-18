#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const allowedTenants = ["first-capital-financial", "skyharbor-air"];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function selectedTenant() {
  const tenant = arg("--tenant");
  if (!allowedTenants.includes(tenant)) throw new Error(`--tenant must be one of ${allowedTenants.join(", ")}`);
  return tenant;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`);
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text);
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function plannedWrites(manifest) {
  return [
    ["intelligence_v7.tenant_pack_runs", 1],
    ["intelligence_v7.source_files", manifest.counts.source_template_files + 1],
    ["public.enterprise_context_sources", manifest.counts.source_template_files + 1],
    ["public.enterprise_context_source_files", manifest.counts.source_template_files + 1],
    ["public.data_ingestion_runs", 1],
    ["public.pilot_ingestion_file_manifests", manifest.counts.source_template_files + 1],
    ["public.pilot_ingestion_load_commits", 1],
    ["intelligence_v7.business_records", manifest.counts.canonical_records],
    ["intelligence_v7.record_fields", manifest.counts.canonical_facts],
    ["public.enterprise_context_records", manifest.counts.canonical_records],
    ["public.enterprise_context_facts", manifest.counts.canonical_facts],
    ["public.enterprise_context_evidence", manifest.counts.evidence_references],
    ["public.enterprise_context_quality_issues", manifest.counts.context_gaps],
    ["public.enterprise_context_stewardship_tasks", manifest.counts.context_gaps],
    ["intelligence_v7.derived_intelligence_quality_reports", 1],
    ["intelligence_v7.module_readiness_scores", 5],
    ["public.home_expected_fields", 19],
    ["intelligence_v7.graph_nodes", manifest.counts.graph_nodes],
    ["intelligence_v7.relationship_edges", manifest.counts.graph_edges],
    ["public.enterprise_context_relationships", manifest.counts.graph_edges],
    ["public.enterprise_graph_nodes", manifest.counts.graph_nodes],
    ["public.enterprise_graph_edges", manifest.counts.graph_edges],
    ["public.enterprise_context_chunks", manifest.counts.retrieval_chunks],
    ["public.enterprise_context_chunk_queue", manifest.counts.retrieval_chunks],
    ["public.governed_object_readiness", manifest.counts.retrieval_chunks],
    ["cio_tower.source_registry", manifest.counts.source_template_files + 1],
    ["cio_tower.entities", manifest.counts.entity_profiles],
    ["cio_tower.facts", manifest.counts.canonical_facts],
    ["cio_tower.relationships", manifest.counts.graph_edges],
    ["cio_tower.measures", 80],
    ["cio_tower.measure_results", 80],
    ["cio_tower.question_contracts", 12],
    ["cio_tower.validation_runs", 1],
    ["cio_tower.validation_results", 12],
    ["public.program_origination_drafts", manifest.counts.candidate_ai_opportunities],
    ["public.generated_artifacts", 24],
    ["public.source_context_receipts", manifest.counts.vendors ?? 12],
    ["public.source_contract_evidence_manifests", 12],
    ["public.source_contract_evidence_rows", 120],
    ["public.admin_datasets", 1],
    ["public.admin_dataset_quality", 1],
    ["public.admin_blockers", 5],
    ["public.admin_audit_log", 1],
  ].map(([target_table, planned_rows]) => ({
    tenant_key: manifest.tenant_key,
    candidate_contract_version: manifest.candidate_contract_version,
    load_run_id: manifest.load_run_id,
    target_table,
    planned_rows,
    write_status: "dry_run_not_written",
  }));
}

function rollbackSql(manifest, rows) {
  const tables = rows.map((row) => row.target_table);
  return [
    "-- Candidate rollback SQL generated for dry-run review only.",
    "-- Run only in the approved non-prod database after explicit operator approval.",
    `-- tenant_key: ${manifest.tenant_key}`,
    `-- candidate_contract_version: ${manifest.candidate_contract_version}`,
    `-- load_run_id: ${manifest.load_run_id}`,
    "BEGIN;",
    ...tables.map((table) => `DELETE FROM ${table} WHERE tenant_key = '${manifest.tenant_key}' AND load_run_id = '${manifest.load_run_id}';`),
    "COMMIT;",
    "",
  ].join("\n");
}

function run() {
  const tenant = selectedTenant();
  const env = arg("--env", "not-confirmed");
  const execute = hasFlag("--execute");
  const dryRun = hasFlag("--dry-run") || !execute;
  if (execute) {
    throw new Error("Candidate DB writes are intentionally locked in this PR. Re-run after explicit non-prod target approval and a reviewed write implementation.");
  }
  const manifest = readJson(`datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/tenant-generation-manifest.json`);
  const outDir = path.join(repoRoot, "reports", `${tenant}-azure-persistence`);
  ensureDir(outDir);
  const rows = plannedWrites(manifest);
  writeCsv(path.join(outDir, "candidate-load-plan.csv"), Object.keys(rows[0]), rows);
  writeText(path.join(outDir, "rollback.sql"), rollbackSql(manifest, rows));
  writeJson(path.join(outDir, "candidate-load-manifest.json"), {
    tenant_key: tenant,
    env,
    dry_run: dryRun,
    azure_postgres_mutated: false,
    active_pointer_updated: false,
    candidate_contract_version: manifest.candidate_contract_version,
    load_run_id: manifest.load_run_id,
    planned_table_count: rows.length,
    planned_rows: rows.reduce((sum, row) => sum + Number(row.planned_rows), 0),
    required_before_write: [
      "approved non-prod target database",
      "backup/snapshot or delete-by-load_run_id rollback acceptance",
      "schema/table existence check",
      "tenant key confirmation",
      "explicit no-active-pointer-mutation confirmation",
    ],
  });
  console.log(JSON.stringify({ status: "dry_run_pass", tenant, env, planned_table_count: rows.length, azure_postgres_mutated: false }, null, 2));
}

run();

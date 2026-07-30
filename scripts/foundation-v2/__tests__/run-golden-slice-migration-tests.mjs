#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testPath), "../../..");
const migrationPath = path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql");
const sql = readFileSync(migrationPath, "utf8");

const requiredTables = [
  "source_releases",
  "source_files",
  "source_records",
  "source_field_values",
  "parser_executions",
  "normalized_objects",
  "knowledge_candidates",
  "review_batches",
  "review_decisions",
  "canonical_objects",
  "domain_publications",
  "publication_members",
  "baselines",
  "baseline_object_memberships",
  "projection_authority",
  "projection_rows",
  "projection_field_lineage",
  "cube_parity_results",
  "product_binding_proofs",
  "ava_packet_proofs",
  "gate_results",
];

const failures = [];

expectIncludes("CREATE SCHEMA IF NOT EXISTS foundation_v2", "schema creation");
expectIncludes("ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY", "isolation marker");
expectIncludes("PRESERVE_AS_IMMUTABLE_HISTORY", "V1 history classification");
expectIncludes("ENABLE ROW LEVEL SECURITY", "RLS enablement");
expectIncludes("current_setting(''app.tenant_key''", "tenant setting RLS");
expectIncludes("app.foundation_v2_test_namespace", "test namespace RLS");
expectIncludes("information_schema.columns", "generated non-empty text constraints");
expectIncludes("c.data_type = 'text'", "non-empty text constraint data type filter");
expectIncludes("c.is_nullable = 'NO'", "non-empty text constraint nullability filter");
expectIncludes("btrim(%I) <> ''''", "per-column non-empty text constraint");
expectIncludes("unsupported_claim_count integer NOT NULL DEFAULT 0 CHECK (unsupported_claim_count = 0)", "aVa unsupported claim guard");
expectIncludes("CHECK (render_gate_status <> 'passed' OR unsupported_claim_count = 0)", "product render unsupported claim guard");

for (const table of requiredTables) {
  expectIncludes(`CREATE TABLE IF NOT EXISTS foundation_v2.${table}`, `${table} table`);
  expectIncludes(`'foundation_v2.${table}'::regclass`, `${table} RLS registration`);
}

for (const forbidden of [
  "DROP TABLE",
  "TRUNCATE",
  "DELETE FROM public.",
  "UPDATE public.",
  "INSERT INTO public.",
  "ALTER TABLE public.",
  "CREATE TABLE IF NOT EXISTS public.",
  "CREATE EXTENSION",
  "internal-admin",
]) {
  if (sql.includes(forbidden)) {
    failures.push(`forbidden public/V1 mutation token present: ${forbidden}`);
  }
}

const requiredRlsFragments = [
  "nullif(current_setting(''app.tenant_key'', true), '''') IS NOT NULL",
  "nullif(current_setting(''app.client_key'', true), '''') IS NOT NULL",
  "nullif(current_setting(''app.foundation_v2_test_namespace'', true), '''') IS NOT NULL",
  "AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)",
];
for (const fragment of requiredRlsFragments) {
  expectIncludes(fragment, `strict exact-match RLS fragment ${fragment}`);
}

const simpleFoundationReferences = [
  ...sql.matchAll(/REFERENCES foundation_v2\.[a-z_]+\([a-z_]+_id\)/g),
].map((match) => match[0]);
if (simpleFoundationReferences.length > 0) {
  failures.push(`simple tenant-unsafe FK references present: ${simpleFoundationReferences.join("|")}`);
}

const fkBlocks = [...sql.matchAll(/FOREIGN KEY \(([^)]+)\)\s+REFERENCES foundation_v2\.[a-z_]+\(([^)]+)\)/g)];
if (fkBlocks.length < 18) {
  failures.push(`expected at least 18 composite FK blocks, found ${fkBlocks.length}`);
}
for (const [, childColumns, parentColumns] of fkBlocks) {
  for (const requiredColumn of ["tenant_key", "test_namespace"]) {
    if (!childColumns.includes(requiredColumn) || !parentColumns.includes(requiredColumn)) {
      failures.push(`FK missing ${requiredColumn}: FOREIGN KEY (${childColumns}) REFERENCES (...${parentColumns})`);
    }
  }
}

if (!/review_decision text NOT NULL CHECK \(review_decision IN \('accepted', 'deferred', 'rejected', 'quarantined'\)\)/.test(sql)) {
  failures.push("review decision enum constraint missing");
}

if (!/row_disposition text NOT NULL\s+CHECK \(row_disposition IN \('MATCHED', 'NO_EVIDENCE', 'STRUCTURAL', 'DUPLICATE', 'REJECTED', 'MALFORMED', 'RESTRICTED'\)\)/.test(sql)) {
  failures.push("row disposition enum constraint missing");
}

if (!/parity_status text NOT NULL CHECK \(parity_status IN \('passed', 'failed', 'not_applicable'\)\)/.test(sql)) {
  failures.push("Cube parity enum constraint missing");
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", migrationPath, requiredTables: requiredTables.length }, null, 2));

function expectIncludes(fragment, label) {
  if (!sql.includes(fragment)) {
    failures.push(`missing ${label}: ${fragment}`);
  }
}

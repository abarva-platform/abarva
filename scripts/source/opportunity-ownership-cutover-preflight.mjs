#!/usr/bin/env node

import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readOpportunityOwnershipManifest } from "./opportunity-ownership.mjs";

const REQUIRED = {
  optimization_opportunity: ["tenant_key", "dataset_version", "contract_id", "opportunity_id"],
  optimization_baseline: ["tenant_key", "dataset_version", "contract_id", "baseline_id"],
  optimization_case: ["tenant_key", "dataset_version", "contract_id", "optimization_case_id"],
};
const REF_TARGETS = {
  opportunity_id: "opportunity_id",
  overlaps_opportunity_id: "opportunity_id",
  optimization_case_id: "optimization_case_id",
  baseline_id: "baseline_id",
  calculation_run_id: "calculation_run_id",
  source_run_id: "calculation_run_id",
  requirement_id: "requirement_id",
  approval_request_id: "approval_request_id",
  realization_id: "realization_id",
};
const ID_COLUMNS = new Set(Object.values(REF_TARGETS));
const ID_SOURCES = {
  calculation_run: ["calculation_run_id"],
  opportunity_requirement_status: ["requirement_id"],
  evidence_request: ["requirement_id"],
  approval_request: ["approval_request_id"],
  finance_realization: ["realization_id"],
};
const EMPTY_CHECKSUM = "d41d8cd98f00b204e9800998ecf8427e";

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function required(value) {
  if (typeof value !== "string" || !value || value.trim() !== value) fail("invalid_manifest_identity");
  return value;
}

export function evidenceTuples(manifest) {
  if (manifest?.schema_version !== 1 || !Array.isArray(manifest.packages)) fail("invalid_ownership_manifest");
  const tuples = [];
  const keys = new Set();
  for (const entry of manifest.packages) {
    const tenantKey = required(entry.tenant_key);
    const datasetVersion = required(entry.dataset_version);
    for (const declaration of entry.contracts ?? []) {
      if (declaration.role !== "evidence_only") continue;
      const contractId = required(declaration.contract_id);
      const writerVersion = required(declaration.canonical_writer_dataset_version);
      const writer = manifest.packages.filter((candidate) =>
        candidate.tenant_key === tenantKey && candidate.dataset_version === writerVersion &&
        candidate.contracts?.some((c) => c.role === "canonical_writer" && c.contract_id === contractId &&
          c.evidence_only_dataset_versions?.includes(datasetVersion))
      );
      if (writer.length !== 1) fail("ambiguous_canonical_writer");
      const key = JSON.stringify([tenantKey, contractId, datasetVersion]);
      if (keys.has(key)) fail("duplicate_evidence_tuple");
      keys.add(key);
      tuples.push({ tenant_key: tenantKey, contract_id: contractId, dataset_version: datasetVersion,
        canonical_writer_dataset_version: writerVersion });
    }
  }
  if (!tuples.length) fail("no_evidence_only_tuples");
  return tuples;
}

function identifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) fail("invalid_catalog_identifier");
  return `"${value}"`;
}

function sorted(values) {
  return [...new Set(values)].sort();
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function inspectCatalog(client) {
  const columns = (await client.query(`
    SELECT c.table_name, c.column_name
      FROM information_schema.columns c
      JOIN pg_catalog.pg_class t ON t.relname = c.table_name
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace AND n.nspname = c.table_schema
     WHERE c.table_schema = 'source' AND t.relkind IN ('r', 'p')
     ORDER BY c.table_name, c.ordinal_position`)).rows;
  const tables = new Map();
  for (const row of columns) {
    if (!tables.has(row.table_name)) tables.set(row.table_name, new Set());
    tables.get(row.table_name).add(row.column_name);
  }
  for (const [table, names] of Object.entries(REQUIRED)) {
    if (!names.every((name) => tables.get(table)?.has(name))) fail("missing_required_opportunity_schema");
  }
  const dependents = [...tables].filter(([table, names]) =>
    !Object.hasOwn(REQUIRED, table) && names.has("tenant_key") && names.has("dataset_version") &&
    Object.keys(REF_TARGETS).some((name) => names.has(name))
  );
  const selected = [...Object.keys(REQUIRED), ...dependents.map(([table]) => table)].sort();
  const constraints = (await client.query(`
    SELECT t.relname AS table_name, c.conname AS name, c.contype AS type,
           pg_get_constraintdef(c.oid) AS definition
      FROM pg_catalog.pg_constraint c
      JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'source' AND t.relname = ANY($1::text[])
     ORDER BY t.relname, c.conname`, [selected])).rows;
  const indexes = (await client.query(`
    SELECT t.relname AS table_name, i.relname AS name, x.indisunique AS unique,
           x.indisvalid AS valid, pg_get_indexdef(i.oid) AS definition
      FROM pg_catalog.pg_index x
      JOIN pg_catalog.pg_class t ON t.oid = x.indrelid
      JOIN pg_catalog.pg_class i ON i.oid = x.indexrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'source' AND t.relname = ANY($1::text[])
     ORDER BY t.relname, i.relname`, [selected])).rows;
  return { tables, selected, constraints, indexes };
}

function scope(table, columns, ids, tuple) {
  const predicates = [];
  const values = [tuple.tenant_key, tuple.dataset_version];
  if (Object.hasOwn(REQUIRED, table)) {
    values.push(tuple.contract_id);
    predicates.push(`t."contract_id" = $3`);
  } else {
    if (columns.has("contract_id")) {
      values.push(tuple.contract_id);
      predicates.push(`t."contract_id" = $${values.length}`);
    }
    for (const [column, target] of Object.entries(REF_TARGETS)) {
      const matches = ids[target];
      if (!columns.has(column) || !matches?.length) continue;
      values.push(matches);
      predicates.push(`t.${identifier(column)} = ANY($${values.length}::text[])`);
    }
  }
  if (!predicates.length) return null;
  return { where: `t."tenant_key" = $1 AND t."dataset_version" = $2 AND (${predicates.join(" OR ")})`, values };
}

async function inventory(client, table, columns, ids, tuple) {
  const selected = scope(table, columns, ids, tuple);
  const refs = Object.entries(REF_TARGETS).filter(([column]) => columns.has(column));
  const emptyRefs = Object.fromEntries(refs.map(([column]) => [column, 0]));
  if (!selected) return { row_count: 0, row_checksum: EMPTY_CHECKSUM, reference_counts: emptyRefs, discovered: {} };
  const name = identifier(table);
  const result = await client.query(`
    SELECT count(*)::text AS row_count,
           md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), '')) AS row_checksum
      FROM "source".${name} t WHERE ${selected.where}`, selected.values);
  const referenceCounts = { ...emptyRefs };
  for (const [column, target] of refs) {
    if (!ids[target].length) continue;
    const params = [...selected.values, ids[target]];
    const count = await client.query(`SELECT count(*)::text AS reference_count
      FROM "source".${name} t WHERE ${selected.where}
        AND t.${identifier(column)} = ANY($${params.length}::text[])`, params);
    referenceCounts[column] = Number(count.rows[0].reference_count);
  }
  const idColumns = (Object.hasOwn(REQUIRED, table)
    ? REQUIRED[table].filter((column) => ID_COLUMNS.has(column))
    : ID_SOURCES[table] ?? []).filter((column) => columns.has(column));
  const discovered = {};
  for (const column of idColumns) {
    const rows = await client.query(`SELECT DISTINCT t.${identifier(column)} AS id
      FROM "source".${name} t WHERE ${selected.where} AND t.${identifier(column)} IS NOT NULL`, selected.values);
    discovered[column] = sorted(rows.rows.map((row) => row.id));
  }
  return { row_count: Number(result.rows[0].row_count), row_checksum: result.rows[0].row_checksum,
    reference_counts: referenceCounts, discovered };
}

async function inventoryTuple(client, catalog, tuple) {
  const ids = Object.fromEntries([...ID_COLUMNS].map((column) => [column, []]));
  const counts = {};
  for (const table of Object.keys(REQUIRED)) {
    const entry = await inventory(client, table, catalog.tables.get(table), ids, tuple);
    counts[table] = { row_count: entry.row_count, row_checksum: entry.row_checksum,
      reference_counts: entry.reference_counts };
    for (const [column, values] of Object.entries(entry.discovered)) ids[column] = sorted([...ids[column], ...values]);
  }
  // Follow soft references as well as declared FKs until no new identifiers appear.
  const dependents = catalog.selected.filter((table) => !Object.hasOwn(REQUIRED, table));
  for (let pass = 0; pass <= dependents.length; pass++) {
    let changed = false;
    for (const table of dependents) {
      const entry = await inventory(client, table, catalog.tables.get(table), ids, tuple);
      counts[table] = { row_count: entry.row_count, row_checksum: entry.row_checksum,
        reference_counts: entry.reference_counts };
      for (const [column, values] of Object.entries(entry.discovered)) {
        const merged = sorted([...ids[column], ...values]);
        if (merged.length !== ids[column].length) changed = true;
        ids[column] = merged;
      }
    }
    if (!changed) break;
    if (pass === dependents.length) fail("dependent_reference_traversal_incomplete");
  }
  return { ids, counts };
}

export async function buildProof(client, manifest) {
  const tuples = evidenceTuples(manifest);
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const catalog = await inspectCatalog(client);
    const proof = [];
    for (const tuple of tuples) {
      await client.query("SELECT set_config('app.tenant_key', $1, true)", [tuple.tenant_key]);
      const { ids, counts } = await inventoryTuple(client, catalog, tuple);
      const writerTuple = { ...tuple, dataset_version: tuple.canonical_writer_dataset_version };
      const { ids: writerIds, counts: writerCounts } = await inventoryTuple(client, catalog, writerTuple);
      const uniqueIndex = catalog.indexes.some((index) => index.table_name === "optimization_opportunity" &&
        index.unique && index.valid && /\(tenant_key, opportunity_id\)/.test(index.definition));
      proof.push({ tuple, opportunity_ids: ids.opportunity_id,
        opportunity_ids_sha256: hash(ids.opportunity_id),
        baseline_ids_sha256: hash(ids.baseline_id), case_ids_sha256: hash(ids.optimization_case_id),
        dependent_counts: counts,
        canonical_writer_control: { opportunity_ids_sha256: hash(writerIds.opportunity_id), counts: writerCounts },
        checks: {
          evidence_only_opportunities_absent: counts.optimization_opportunity.row_count === 0,
          evidence_only_ownership_rows_absent: Object.values(counts).every((entry) => entry.row_count === 0),
          canonical_writer_opportunities_present: writerCounts.optimization_opportunity.row_count > 0,
          tenant_opportunity_unique_index_valid: uniqueIndex,
        },
      });
    }
    await client.query("COMMIT");
    return { status: "inspected", ready: proof.every((entry) => Object.values(entry.checks).every(Boolean)),
      manifest_sha256: hash(manifest), transaction: "repeatable_read_read_only", schema: {
      tables: catalog.selected, constraints: catalog.constraints, indexes: catalog.indexes,
    }, evidence_tuples: proof };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function main() {
  if (process.argv.length !== 2) fail("unexpected_arguments");
  if (!process.env.DATABASE_URL) fail("database_url_required");
  const manifest = readOpportunityOwnershipManifest("verify");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log(JSON.stringify(await buildProof(client, manifest), null, 2));
  } finally {
    await client.end().catch(() => undefined);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ status: "error", code: error.code?.startsWith("ERR_") ? "runtime_error" :
      /^[a-z_]+$/.test(error.code ?? "") ? error.code : "preflight_failed" }));
    process.exitCode = 1;
  });
}

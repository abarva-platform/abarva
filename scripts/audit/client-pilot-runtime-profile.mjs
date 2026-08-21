#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const DEFAULT_OUT_DIR = "/tmp/client-pilot-data-plane-runtime-profile";
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

const REQUIRED_OUTPUTS = [
  "LIVE_DATABASE_OBJECT_PROFILE.csv",
  "LIVE_WRITER_READER_MATRIX.csv",
  "STATIC_VS_LIVE_DELTA.csv",
  "ACTIVE_WRITE_PATHS.csv",
  "ACTIVE_READ_AND_FALLBACK_PATHS.csv",
  "DUPLICATE_TRUTH_AND_DUAL_WRITE_REPORT.md",
  "TENANT_ISOLATION_AND_RLS_REPORT.md",
  "NON_DATABASE_STORE_INVENTORY.csv",
  "FINAL_TRUTH_AUTHORITY_MATRIX.csv",
  "TARGET_CLIENT_PILOT_DATA_ARCHITECTURE.md",
  "PILOT_MIGRATION_WAVES.csv",
  "CONSUMER_PARITY_TEST_PLAN.csv",
  "LEGACY_SUNSET_REGISTER.csv",
  "CUTOVER_AND_ROLLBACK_RUNBOOK.md",
];

function usage() {
  return `Usage:
  node scripts/audit/client-pilot-runtime-profile.mjs [options]

Options:
  --out-dir <path>                 Output directory. Default: ${DEFAULT_OUT_DIR}
  --tenant-scope <scope>           Scope label recorded in metadata. Default: all-active-registry-tenants
  --run-id <id>                    Stable run id. Default: generated timestamp id
  --exact-max-estimated-rows <n>   Exact count only when pg estimate <= n. Default: 100000
  --emit-proof-bundle              Emit base64 tarball markers for ACA wrapper extraction.
  --self-test                      Validate local report writers without a DB connection.
  --help                           Print this help.

Required for live run:
  READONLY_DATABASE_URL or READ_ONLY_DATABASE_URL or ABARVA_READONLY_DATABASE_URL

This script is intentionally read-only. It opens a READ ONLY transaction and fails
if the connected role has INSERT, UPDATE, DELETE, or TRUNCATE privileges on any
non-system table/view/materialized view.`;
}

function parseArgs(argv) {
  const options = {
    outDir: process.env.RUNTIME_PROFILE_OUT_DIR || DEFAULT_OUT_DIR,
    tenantScope: process.env.RUNTIME_PROFILE_TENANT_SCOPE || "all-active-registry-tenants",
    runId: process.env.RUNTIME_PROFILE_RUN_ID || `runtime-profile-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    exactMaxEstimatedRows: Number(process.env.RUNTIME_PROFILE_EXACT_MAX_ESTIMATED_ROWS || 100000),
    emitProofBundle: process.env.RUNTIME_PROFILE_EMIT_PROOF_BUNDLE === "true",
    selfTest: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--self-test") options.selfTest = true;
    else if (arg === "--emit-proof-bundle") options.emitProofBundle = true;
    else if (arg === "--out-dir") options.outDir = next();
    else if (arg === "--tenant-scope") options.tenantScope = next();
    else if (arg === "--run-id") options.runId = next();
    else if (arg === "--exact-max-estimated-rows") options.exactMaxEstimatedRows = Number(next());
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.exactMaxEstimatedRows) || options.exactMaxEstimatedRows < 0) {
    throw new Error("--exact-max-estimated-rows must be a non-negative number");
  }
  return options;
}

function requireWorkspacePackage(name) {
  const packageJson = path.join(ROOT, "package.json");
  return createRequire(packageJson)(name);
}

function readOnlyDatabaseUrl() {
  return (
    process.env.READONLY_DATABASE_URL ||
    process.env.READ_ONLY_DATABASE_URL ||
    process.env.ABARVA_READONLY_DATABASE_URL ||
    ""
  );
}

function ensureOutDir(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const str = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function writeCsv(file, rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvValue(row[header])).join(","));
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(file, lines) {
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function hashText(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeGitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return result.status === 0 ? result.stdout.trim() : process.env.GITHUB_SHA || "unknown";
}

function walk(dir, predicate = () => true) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p, predicate));
    else if (ent.isFile() && predicate(p)) out.push(p);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file);
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function scanMigrationObjects() {
  const files = walk(path.join(ROOT, "supabase/migrations"), (file) => file.endsWith(".sql")).sort();
  const patterns = [
    ["table", /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:ONLY\s+)?(["\w.]+)/gi],
    ["view", /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(["\w.]+)/gi],
    ["materialized_view", /CREATE\s+MATERIALIZED\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(["\w.]+)/gi],
  ];
  const byName = new Map();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const [kind, re] of patterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text))) {
        const physicalObject = match[1].replace(/"/g, "");
        const key = normalizeObjectName(physicalObject);
        const entry = byName.get(key) || {
          physicalObject,
          kind,
          creationMigration: `${rel(file)}:${lineOf(text, match.index)}`,
          lastStructuralMigration: `${rel(file)}:${lineOf(text, match.index)}`,
        };
        entry.lastStructuralMigration = `${rel(file)}:${lineOf(text, match.index)}`;
        byName.set(key, entry);
      }
    }
  }
  return byName;
}

function normalizeObjectName(name, schema = "public") {
  const clean = String(name).replace(/"/g, "");
  return clean.includes(".") ? clean : `${schema}.${clean}`;
}

function commandKind(query) {
  const trimmed = String(query || "").trim().toLowerCase();
  if (/^(insert|update|delete|merge|copy\s+\S+\s+from|truncate|create|alter|drop|refresh)\b/.test(trimmed)) return "write_or_ddl";
  if (/^(select|with|show|explain)\b/.test(trimmed)) return "read";
  return "unknown";
}

function objectFamily(objectName) {
  const lower = objectName.toLowerCase();
  if (lower.includes("source") && (lower.includes("contract") || lower.includes("vendor"))) return "Vendor/Contract";
  if (lower.includes("engagement") || lower.includes("program") || lower.includes("initiative") || lower.includes("use_case")) return "Program/Use Case";
  if (lower.includes("metric") || lower.includes("measure") || lower.includes("value") || lower.includes("budget")) return "Metric";
  if (lower.includes("evidence") || lower.includes("document") || lower.includes("chunk")) return "Evidence/Document";
  if (lower.includes("graph") || lower.includes("relationship") || lower.includes("edge")) return "Relationship";
  if (lower.includes("artifact") || lower.includes("snapshot")) return "Artifact";
  if (lower.includes("application") || lower.includes("cmdb") || lower.includes("system")) return "Application/System";
  if (lower.includes("tenant") || lower.includes("client")) return "Tenant/Control";
  return "Other";
}

function targetAuthorityForFamily(family) {
  const map = {
    "Application/System": "Canonical Application",
    "Program/Use Case": "Moves operational state plus Canonical Program for approved identity/facts",
    "Metric": "Metric Definition Registry and Governed Metric Observation",
    "Evidence/Document": "Canonical Evidence Registry",
    "Relationship": "Canonical Relationship",
    "Vendor/Contract": "Canonical Vendor/Contract",
    "Artifact": "Immutable Artifact Version; not canonical truth",
    "Tenant/Control": "Control/config tenant registry",
    Other: "Decision required",
  };
  return map[family] || "Decision required";
}

async function collectCatalog(client, staticObjects, exactMaxEstimatedRows) {
  const objects = (await client.query(`
    SELECT
      n.nspname AS schema_name,
      c.relname AS object_name,
      CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'p' THEN 'partitioned_table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized_view'
        ELSE c.relkind::text
      END AS object_type,
      c.relkind,
      c.oid::regclass::text AS regclass,
      COALESCE(s.n_live_tup, 0)::bigint AS estimated_rows,
      COALESCE(s.n_dead_tup, 0)::bigint AS estimated_dead_rows,
      CASE WHEN c.relkind IN ('r','p','m') THEN pg_total_relation_size(c.oid) ELSE 0 END::bigint AS total_bytes,
      s.last_vacuum,
      s.last_autovacuum,
      s.last_analyze,
      s.last_autoanalyze,
      c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
      AND n.nspname NOT LIKE 'pg_toast%'
      AND c.relkind IN ('r','p','v','m')
    ORDER BY n.nspname, c.relname
  `)).rows;

  const columns = (await client.query(`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name, ordinal_position
  `)).rows;
  const columnMap = new Map();
  for (const row of columns) {
    const key = `${row.table_schema}.${row.table_name}`;
    const list = columnMap.get(key) || [];
    list.push(row.column_name);
    columnMap.set(key, list);
  }

  const constraints = (await client.query(`
    SELECT
      ns.nspname AS schema_name,
      cls.relname AS object_name,
      con.contype,
      con.conname,
      pg_get_constraintdef(con.oid, true) AS definition
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE ns.nspname NOT IN ('pg_catalog','information_schema')
    ORDER BY ns.nspname, cls.relname, con.contype, con.conname
  `)).rows;
  const constraintMap = new Map();
  for (const row of constraints) {
    const key = `${row.schema_name}.${row.object_name}`;
    const entry = constraintMap.get(key) || { primaryKeys: [], uniqueKeys: [], foreignKeys: [] };
    if (row.contype === "p") entry.primaryKeys.push(row.definition);
    if (row.contype === "u") entry.uniqueKeys.push(row.definition);
    if (row.contype === "f") entry.foreignKeys.push(`${row.conname}: ${row.definition}`);
    constraintMap.set(key, entry);
  }

  const indexes = (await client.query(`
    SELECT schemaname AS schema_name, tablename AS object_name, indexname
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog','information_schema')
    ORDER BY schemaname, tablename, indexname
  `)).rows;
  const indexMap = groupByObject(indexes, (row) => row.indexname);

  const triggers = (await client.query(`
    SELECT event_object_schema AS schema_name, event_object_table AS object_name, trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY event_object_schema, event_object_table, trigger_name
  `)).rows;
  const triggerMap = groupByObject(triggers, (row) => row.trigger_name);

  const policies = (await client.query(`
    SELECT schemaname AS schema_name, tablename AS object_name, policyname
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog','information_schema')
    ORDER BY schemaname, tablename, policyname
  `)).rows;
  const policyMap = groupByObject(policies, (row) => row.policyname);

  const procs = (await client.query(`
    SELECT n.nspname AS schema_name, p.proname AS function_name, p.prosrc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
  `)).rows;

  const rows = [];
  for (const object of objects) {
    const fullName = `${object.schema_name}.${object.object_name}`;
    const cols = columnMap.get(fullName) || [];
    const exactCountSafe =
      ["table", "partitioned_table", "materialized_view"].includes(object.object_type) &&
      Number(object.estimated_rows) <= exactMaxEstimatedRows;
    let exactRows = "";
    let exactCountStatus = exactCountSafe ? "attempted" : "skipped_estimate_above_threshold_or_view";
    if (exactCountSafe) {
      try {
        const count = await client.query(`SELECT count(*)::bigint AS n FROM ${quoteIdent(object.schema_name)}.${quoteIdent(object.object_name)}`);
        exactRows = count.rows[0]?.n ?? "";
        exactCountStatus = "ok";
      } catch (error) {
        exactCountStatus = `failed:${error.message.slice(0, 120)}`;
      }
    }
    const cons = constraintMap.get(fullName) || { primaryKeys: [], uniqueKeys: [], foreignKeys: [] };
    const staticEntry = staticObjects.get(fullName) || staticObjects.get(object.object_name) || null;
    const tenantColumns = cols.filter((column) => /^(tenant_key|client_key|client_id|tenant_id)$/i.test(column));
    const functionsTouching = procs
      .filter((proc) => proc.prosrc?.includes(object.object_name) || proc.prosrc?.includes(fullName))
      .map((proc) => `${proc.schema_name}.${proc.function_name}`)
      .slice(0, 25);
    rows.push({
      schema: object.schema_name,
      object: object.object_name,
      physical_object: fullName,
      object_type: object.object_type,
      approximate_rows: object.estimated_rows,
      exact_rows: exactRows,
      exact_count_status: exactCountStatus,
      storage_bytes: object.total_bytes,
      last_vacuum: object.last_vacuum || "",
      last_autovacuum: object.last_autovacuum || "",
      last_analyze: object.last_analyze || "",
      last_autoanalyze: object.last_autoanalyze || "",
      primary_keys: cons.primaryKeys,
      unique_keys: cons.uniqueKeys,
      foreign_keys: cons.foreignKeys,
      indexes: indexMap.get(fullName) || [],
      triggers: triggerMap.get(fullName) || [],
      functions_touching_object: functionsTouching,
      rls_enabled: object.rls_enabled ? "yes" : "no",
      rls_policies: policyMap.get(fullName) || [],
      tenant_client_columns: tenantColumns,
      creation_migration: staticEntry?.creationMigration || "",
      last_structural_migration: staticEntry?.lastStructuralMigration || "",
    });
  }
  return rows;
}

function groupByObject(rows, selector) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.schema_name}.${row.object_name}`;
    const list = map.get(key) || [];
    list.push(selector(row));
    map.set(key, list);
  }
  return map;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function assertReadOnlyRole(client, outDir) {
  await client.query("BEGIN READ ONLY");
  await client.query("SET LOCAL statement_timeout = '60000ms'");
  await client.query("SET LOCAL lock_timeout = '2000ms'");
  const readOnly = (await client.query("SHOW transaction_read_only")).rows[0]?.transaction_read_only;
  if (readOnly !== "on") throw new Error(`READ ONLY transaction was not established; transaction_read_only=${readOnly}`);
  const violations = (await client.query(`
    SELECT
      n.nspname AS schema,
      c.relname AS object,
      c.relkind::text AS relkind,
      has_table_privilege(c.oid, 'INSERT') AS can_insert,
      has_table_privilege(c.oid, 'UPDATE') AS can_update,
      has_table_privilege(c.oid, 'DELETE') AS can_delete,
      has_table_privilege(c.oid, 'TRUNCATE') AS can_truncate
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
      AND n.nspname NOT LIKE 'pg_toast%'
      AND c.relkind IN ('r','p','v','m')
      AND (
        has_table_privilege(c.oid, 'INSERT')
        OR has_table_privilege(c.oid, 'UPDATE')
        OR has_table_privilege(c.oid, 'DELETE')
        OR has_table_privilege(c.oid, 'TRUNCATE')
      )
    ORDER BY n.nspname, c.relname
  `)).rows;
  writeCsv(
    path.join(outDir, "ROLE_WRITE_PRIVILEGE_VIOLATIONS.csv"),
    violations,
    ["schema", "object", "relkind", "can_insert", "can_update", "can_delete", "can_truncate"],
  );
  if (violations.length) {
    throw new Error(`Connected database role has write privileges on ${violations.length} object(s). Refusing to profile with this role.`);
  }
}

async function collectPgStatStatements(client, catalogRows) {
  const extension = await client.query("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') AS exists");
  if (!extension.rows[0]?.exists) return { available: false, rows: [] };
  const statements = (await client.query(`
    SELECT query, calls::bigint AS calls, rows::bigint AS rows
    FROM pg_stat_statements
    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    ORDER BY calls DESC
    LIMIT 5000
  `)).rows;
  const rows = [];
  for (const object of catalogRows) {
    const needles = [object.physical_object.toLowerCase(), object.object.toLowerCase()];
    const hits = statements.filter((statement) => {
      const query = String(statement.query || "").toLowerCase();
      return needles.some((needle) => query.includes(needle));
    });
    const reads = hits.filter((hit) => commandKind(hit.query) === "read");
    const writes = hits.filter((hit) => commandKind(hit.query) === "write_or_ddl");
    if (!hits.length) continue;
    rows.push({
      physical_object: object.physical_object,
      runtime_source: "pg_stat_statements",
      read_calls: reads.reduce((sum, hit) => sum + Number(hit.calls || 0), 0),
      write_or_ddl_calls: writes.reduce((sum, hit) => sum + Number(hit.calls || 0), 0),
      total_rows_reported: hits.reduce((sum, hit) => sum + Number(hit.rows || 0), 0),
      query_hashes: hits.slice(0, 10).map((hit) => hashText(hit.query).slice(0, 16)),
    });
  }
  return { available: true, rows };
}

function scanStaticCodeReferences(catalogRows) {
  const codeFiles = walk(path.join(ROOT, "src"), (file) => /\.(ts|tsx|mjs|js)$/.test(file))
    .concat(walk(path.join(ROOT, "scripts"), (file) => /\.(ts|tsx|mjs|js)$/.test(file)));
  const output = [];
  const routeRoots = new Set(walk(path.join(ROOT, "src/app"), (file) => file.endsWith("page.tsx") || file.endsWith("route.ts")).map(rel));
  const candidates = catalogRows
    .filter((row) => row.object.length >= 4)
    .map((row) => ({ object: row.physical_object, name: row.object, schema: row.schema, family: objectFamily(row.physical_object) }));
  for (const file of codeFiles) {
    const text = fs.readFileSync(file, "utf8");
    const lower = text.toLowerCase();
    for (const candidate of candidates) {
      if (!lower.includes(candidate.name.toLowerCase()) && !lower.includes(candidate.object.toLowerCase())) continue;
      const isWrite =
        /\.(insert|upsert|update|delete)\s*\(/.test(text) ||
        /\b(insert\s+into|update\s+["\w.]+|delete\s+from|truncate\s+table|refresh\s+materialized\s+view)\b/i.test(text);
      const isFallback = /\bfallback\b|try.*catch|catch\s*\(/i.test(text);
      output.push({
        physical_object: candidate.object,
        static_file: rel(file),
        static_surface: routeRoots.has(rel(file)) ? "route_or_page_root" : file.includes("/scripts/") ? "script_or_job" : "library",
        static_access_kind: isWrite ? "possible_write" : "possible_read",
        feature_flag_or_fallback: isFallback ? "fallback_or_error_path_present" : "",
        owner_guess: candidate.family,
      });
    }
  }
  return output;
}

function nonDatabaseStores() {
  const families = [
    ["tenant_input_files", "datasets/tenant-inputs"],
    ["golden_or_candidate_reports", "reports"],
    ["proof_bundles", "proof"],
    ["graph_migrations", "db/graph/migrations"],
    ["source_docs", "docs/enterprise-context"],
  ];
  return families.map(([store_type, store_path]) => {
    const abs = path.join(ROOT, store_path);
    const files = walk(abs);
    return {
      store_type,
      path: store_path,
      exists: fs.existsSync(abs) ? "yes" : "no",
      file_count: files.length,
      total_bytes: files.reduce((sum, file) => sum + fs.statSync(file).size, 0),
      runtime_use_status: "static_inventory_only_runtime_access_not_confirmed",
    };
  });
}

function buildDeltaRows(catalogRows, staticObjects) {
  const live = new Set(catalogRows.map((row) => row.physical_object));
  const rows = [];
  for (const row of catalogRows) {
    const staticEntry = staticObjects.get(row.physical_object) || staticObjects.get(row.object);
    rows.push({
      object_path: row.physical_object,
      static_inventory_says: staticEntry ? `defined:${staticEntry.kind}` : "absent_from_current_migration_scan",
      live_evidence_says: `exists:${row.object_type}; approx_rows:${row.approximate_rows}; exact_status:${row.exact_count_status}`,
      interpretation: staticEntry ? "static_and_live_present" : "live_only_or_migration_scan_gap",
      required_action: staticEntry ? "classify_runtime_use_and_authority" : "trace_creation_source_before_disposition",
    });
  }
  for (const [name, entry] of staticObjects) {
    if (live.has(name)) continue;
    rows.push({
      object_path: name,
      static_inventory_says: `defined:${entry.kind}`,
      live_evidence_says: "absent_or_unqualified_name_mismatch",
      interpretation: "static_only_candidate",
      required_action: "verify schema qualification and migration application status",
    });
  }
  return rows;
}

function classifyRuntime(catalogRow, staticRefs, runtimeRefs) {
  const hasRuntimeRead = runtimeRefs.some((row) => row.physical_object === catalogRow.physical_object && Number(row.read_calls || 0) > 0);
  const hasRuntimeWrite = runtimeRefs.some((row) => row.physical_object === catalogRow.physical_object && Number(row.write_or_ddl_calls || 0) > 0);
  const hasStaticRead = staticRefs.some((row) => row.physical_object === catalogRow.physical_object && row.static_access_kind === "possible_read");
  const hasStaticWrite = staticRefs.some((row) => row.physical_object === catalogRow.physical_object && row.static_access_kind === "possible_write");
  const family = objectFamily(catalogRow.physical_object);
  if (hasRuntimeWrite && hasRuntimeRead) return family === "Other" ? "active_operational" : "active_authoritative";
  if (hasRuntimeWrite) return "orphan_writer";
  if (hasRuntimeRead) return family === "Artifact" || family === "Metric" ? "active_consumption_projection" : "legacy_still_read";
  if (hasStaticWrite && hasStaticRead) return "unknown_requires_instrumentation";
  if (hasStaticWrite) return "unknown_requires_instrumentation";
  if (hasStaticRead) return "unknown_requires_instrumentation";
  return Number(catalogRow.approximate_rows || 0) > 0 ? "dormant_candidate" : "archive_candidate";
}

function writeDerivedReports(outDir, catalogRows, staticObjects, staticRefs, runtimeStatements, options, metadata) {
  const runtimeRefs = runtimeStatements.rows;
  const lineageRows = catalogRows.map((row) => ({
    object: row.physical_object,
    writers: staticRefs.filter((ref) => ref.physical_object === row.physical_object && ref.static_access_kind === "possible_write").map((ref) => ref.static_file),
    readers: staticRefs.filter((ref) => ref.physical_object === row.physical_object && ref.static_access_kind === "possible_read").map((ref) => ref.static_file),
    runtime_confirmed: runtimeRefs.some((ref) => ref.physical_object === row.physical_object) ? "yes" : "no",
    feature_flag: staticRefs.filter((ref) => ref.physical_object === row.physical_object && ref.feature_flag_or_fallback).map((ref) => ref.feature_flag_or_fallback),
    owner: objectFamily(row.physical_object),
    classification: classifyRuntime(row, staticRefs, runtimeRefs),
  }));
  writeCsv(path.join(outDir, "LIVE_WRITER_READER_MATRIX.csv"), lineageRows, [
    "object",
    "writers",
    "readers",
    "runtime_confirmed",
    "feature_flag",
    "owner",
    "classification",
  ]);

  writeCsv(path.join(outDir, "STATIC_VS_LIVE_DELTA.csv"), buildDeltaRows(catalogRows, staticObjects), [
    "object_path",
    "static_inventory_says",
    "live_evidence_says",
    "interpretation",
    "required_action",
  ]);

  const activeWrites = lineageRows
    .filter((row) => row.writers.length || ["orphan_writer", "active_authoritative", "active_operational"].includes(row.classification))
    .map((row) => ({
      object: row.object,
      static_writers: row.writers,
      runtime_writer_evidence: runtimeRefs.find((ref) => ref.physical_object === row.object)?.write_or_ddl_calls || 0,
      classification: row.classification,
      required_action: row.classification === "orphan_writer" ? "find consumer or stop writer after approval" : "confirm owner and parity",
    }));
  writeCsv(path.join(outDir, "ACTIVE_WRITE_PATHS.csv"), activeWrites, [
    "object",
    "static_writers",
    "runtime_writer_evidence",
    "classification",
    "required_action",
  ]);

  const activeReads = lineageRows
    .filter((row) => row.readers.length || row.runtime_confirmed === "yes")
    .map((row) => ({
      object: row.object,
      static_readers: row.readers,
      runtime_read_evidence: runtimeRefs.find((ref) => ref.physical_object === row.object)?.read_calls || 0,
      fallback_evidence: staticRefs.filter((ref) => ref.physical_object === row.object && ref.feature_flag_or_fallback).map((ref) => ref.static_file),
      classification: row.classification,
    }));
  writeCsv(path.join(outDir, "ACTIVE_READ_AND_FALLBACK_PATHS.csv"), activeReads, [
    "object",
    "static_readers",
    "runtime_read_evidence",
    "fallback_evidence",
    "classification",
  ]);

  const finalAuthority = Object.entries(
    lineageRows.reduce((acc, row) => {
      acc[row.owner] = acc[row.owner] || { count: 0, legacy: 0, unknown: 0 };
      acc[row.owner].count += 1;
      if (row.classification.startsWith("legacy")) acc[row.owner].legacy += 1;
      if (row.classification === "unknown_requires_instrumentation") acc[row.owner].unknown += 1;
      return acc;
    }, {}),
  ).map(([family, counts]) => ({
    business_concept: family,
    operational_owner: family === "Program/Use Case" ? "Moves" : family === "Vendor/Contract" ? "Source" : family === "Metric" ? "Tower/governance" : "domain workflow or intake",
    canonical_authority: targetAuthorityForFamily(family),
    consumption_projections: "graph; search; context packs; marts; product read models as applicable",
    legacy_copies: counts.legacy,
    unresolved_objects: counts.unknown,
    status: counts.unknown || counts.legacy ? "requires_review_before_authority_final" : "candidate_authority_assignment",
  }));
  writeCsv(path.join(outDir, "FINAL_TRUTH_AUTHORITY_MATRIX.csv"), finalAuthority, [
    "business_concept",
    "operational_owner",
    "canonical_authority",
    "consumption_projections",
    "legacy_copies",
    "unresolved_objects",
    "status",
  ]);

  writeCsv(path.join(outDir, "PILOT_MIGRATION_WAVES.csv"), [
    ["0", "Foundation", "tenant identity; canonical IDs; lineage; publication/outbox; telemetry", "runtime profile and authority approval", "not_authorized"],
    ["1", "Recorded enterprise context", "applications; systems; data assets; integrations; selected vendors", "identity collision resolution", "not_started"],
    ["2", "Evidence and relationships", "evidence files; parsed content; facts; relationships; review state", "evidence registry contract", "not_started"],
    ["3", "Program and metrics", "use cases; metric definitions; observations; decisions/actions", "Moves/Tower publication contracts", "not_started"],
    ["4", "Consumption", "Home; Intelligence; Tower; Moves; Source; graph/vector/search", "dual-run parity", "not_started"],
    ["5", "Artifacts", "immutable artifact versions and approved render outputs", "artifact authority separation", "not_started"],
  ].map(([wave, name, scope, dependency, status]) => ({ wave, name, scope, dependency, status })), [
    "wave",
    "name",
    "scope",
    "dependency",
    "status",
  ]);

  writeCsv(path.join(outDir, "CONSUMER_PARITY_TEST_PLAN.csv"), [
    ["Home", "signed-in route and snapshot/source-hash comparison", "legacy approved content/snapshot", "new canonical projection", "no hidden stale snapshot; source hashes visible"],
    ["Intelligence", "ask/brief route and context-pack citation proof", "current landscape/context model", "canonical context bundle", "citations resolve to reviewed evidence"],
    ["Moves", "portfolio/detail/artifact route parity", "engagements read path", "publication-backed program projection", "workflow state remains domain-owned"],
    ["Source", "portfolio/vendor/artifact/export route parity", "Source workflow/projection tables", "canonical vendor/contract/evidence projection", "generated drafts cannot become authority"],
    ["Tower", "command center/value/action mart parity", "current cio_tower marts", "rebuilt governed metric projection", "numeric lineage agrees with fact report"],
  ].map(([consumer, test, legacy_read, new_read, pass_condition]) => ({ consumer, test, legacy_read, new_read, pass_condition })), [
    "consumer",
    "test",
    "legacy_read",
    "new_read",
    "pass_condition",
  ]);

  writeCsv(path.join(outDir, "LEGACY_SUNSET_REGISTER.csv"), lineageRows.map((row) => ({
    legacy_path: row.object,
    current_runtime_use: row.runtime_confirmed === "yes" ? "observed_in_pg_stat_statements_or_stats" : "not_runtime_confirmed",
    target_replacement: targetAuthorityForFamily(row.owner),
    parity_criteria: "new read primary; parity passed; rollback exercised; write telemetry moved",
    read_only_date: "",
    archive_owner: row.owner,
    rollback_command: "feature flag or route config back to legacy read path; no archive/drop before approval",
    status: row.classification,
  })), [
    "legacy_path",
    "current_runtime_use",
    "target_replacement",
    "parity_criteria",
    "read_only_date",
    "archive_owner",
    "rollback_command",
    "status",
  ]);

  writeMarkdown(path.join(outDir, "DUPLICATE_TRUTH_AND_DUAL_WRITE_REPORT.md"), [
    "# Duplicate Truth And Dual Write Report",
    "",
    `Generated: ${metadata.generatedAt}`,
    "",
    "## Boundary",
    "",
    "This report is runtime profiling evidence, not migration authorization. Generated artifacts, marts, snapshots, graph/search/vector stores, and read models remain projections until authority is explicitly approved.",
    "",
    "## Runtime Evidence Source",
    "",
    runtimeStatements.available
      ? "- `pg_stat_statements` was available. Query text was not persisted; only aggregate counts and query hashes were recorded."
      : "- `pg_stat_statements` was not available. Runtime reader/writer evidence is limited to catalog/stat table signals and static code references.",
    "",
    "## High-Risk Classes",
    "",
    `- Objects with write evidence: ${activeWrites.length}`,
    `- Objects with read/fallback evidence: ${activeReads.length}`,
    `- Objects requiring instrumentation: ${lineageRows.filter((row) => row.classification === "unknown_requires_instrumentation").length}`,
    `- Dual write or dual truth candidates: ${lineageRows.filter((row) => row.classification === "active_authoritative" && row.owner !== "Tenant/Control").length}`,
    "",
    "## Required Action",
    "",
    "No object may be declared unused while classification is `unknown_requires_instrumentation`. No legacy path may be archived while an active writer, active reader, fallback, or tenant-isolation gap remains.",
  ]);

  const rlsDisabled = catalogRows.filter((row) => ["table", "partitioned_table"].includes(row.object_type) && row.rls_enabled !== "yes");
  const missingTenant = catalogRows.filter((row) => ["table", "partitioned_table", "materialized_view"].includes(row.object_type) && !String(row.tenant_client_columns || "").trim());
  writeMarkdown(path.join(outDir, "TENANT_ISOLATION_AND_RLS_REPORT.md"), [
    "# Tenant Isolation And RLS Report",
    "",
    `Generated: ${metadata.generatedAt}`,
    "",
    "## Role Guard",
    "",
    "- The script opened a `BEGIN READ ONLY` transaction.",
    "- The script checked for INSERT, UPDATE, DELETE, and TRUNCATE privileges on non-system objects before profiling.",
    "- If any write privilege is present, the script fails before producing authority conclusions.",
    "",
    "## RLS And Tenant Columns",
    "",
    `- Table/partitioned-table objects with RLS disabled: ${rlsDisabled.length}`,
    `- Table/materialized objects without obvious tenant/client columns: ${missingTenant.length}`,
    "",
    "## Required Action",
    "",
    "Objects without tenant/client columns are not automatically unsafe, but they require owner review. Objects with RLS disabled require either a documented non-tenant-scoped reason or a policy remediation before pilot migration authority.",
  ]);

  writeMarkdown(path.join(outDir, "TARGET_CLIENT_PILOT_DATA_ARCHITECTURE.md"), [
    "# Target Client Pilot Data Architecture",
    "",
    "## Layer Contract",
    "",
    "| Layer | System-of-record posture | Rebuildable? |",
    "| --- | --- | ---: |",
    "| Immutable source/evidence | Original received material | No |",
    "| Parsed/staging | Parser output and normalization | Yes |",
    "| Domain operational | Workflow, review, approval, jobs | No |",
    "| Canonical Knowledge | Identity, reviewed facts, evidence, relationships, metrics | Governed/versioned |",
    "| Shared consumption | Graph, vectors, search, marts, context packs | Yes |",
    "| Artifacts | Immutable versioned projections | Regenerable from approved source |",
    "| Audit/lineage | Hashes, runs, approvals, publication events | Append-only |",
    "",
    "## Pilot Rule",
    "",
    "Keep Source, Moves, and Tower workflow tables domain-owned initially. Publish approved facts through a controlled publication/outbox contract instead of copying workflow tables wholesale into a central schema.",
  ]);

  writeMarkdown(path.join(outDir, "CUTOVER_AND_ROLLBACK_RUNBOOK.md"), [
    "# Cutover And Rollback Runbook",
    "",
    "## Sequence",
    "",
    "```text",
    "ACTIVE",
    "-> DUAL_RUN",
    "-> NEW_READ_PRIMARY",
    "-> LEGACY_READ_ONLY",
    "-> ARCHIVED",
    "-> DROPPED",
    "```",
    "",
    "## Gates",
    "",
    "- Do not enter `DUAL_RUN` until every active writer and reader is identified.",
    "- Do not enter `NEW_READ_PRIMARY` until parity has passed for the selected consumer.",
    "- Do not enter `LEGACY_READ_ONLY` until rollback has been exercised and telemetry confirms writes moved.",
    "- Do not enter `ARCHIVED` while any writer remains active, tenant isolation remains unproven, or a material consumer diverges.",
    "- Do not enter `DROPPED` without explicit destructive-step approval.",
    "",
    "## Rollback",
    "",
    "Rollback is a feature-flag or route-config return to the legacy read path plus verification that no new writer remains active. Database drops are never rollback tools in the pilot phase.",
  ]);
}

function emitProofBundle(outDir) {
  const tarPath = path.join(os.tmpdir(), `client-pilot-runtime-profile-${Date.now()}.tgz`);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", outDir, "."], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "tar failed");
  process.stdout.write(`\n${PROOF_BEGIN}\n`);
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write(`\n${PROOF_END}\n`);
}

function selfTest(options) {
  ensureOutDir(options.outDir);
  const sampleRows = [{ a: "plain", b: "needs,quote", c: "quote\"inside" }];
  writeCsv(path.join(options.outDir, "SELF_TEST.csv"), sampleRows, ["a", "b", "c"]);
  const text = fs.readFileSync(path.join(options.outDir, "SELF_TEST.csv"), "utf8");
  if (!text.includes('"needs,quote"') || !text.includes('"quote""inside"')) {
    throw new Error("CSV escaping self-test failed");
  }
  writeJson(path.join(options.outDir, "SELF_TEST.json"), {
    ok: true,
    requiredOutputs: REQUIRED_OUTPUTS,
  });
  console.log(`self-test ok: ${options.outDir}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (options.selfTest) {
    selfTest(options);
    return;
  }

  const connectionString = readOnlyDatabaseUrl();
  if (!connectionString) {
    throw new Error("Missing read-only database URL. Set READONLY_DATABASE_URL, READ_ONLY_DATABASE_URL, or ABARVA_READONLY_DATABASE_URL.");
  }

  ensureOutDir(options.outDir);
  const metadata = {
    generatedAt: new Date().toISOString(),
    runId: options.runId,
    tenantScope: options.tenantScope,
    gitSha: safeGitSha(),
    mode: "read_only_runtime_profile",
    mutation: "none",
    outputContract: REQUIRED_OUTPUTS,
  };
  writeJson(path.join(options.outDir, "RUN_METADATA.json"), metadata);

  const { Client } = requireWorkspacePackage("pg");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    application_name: "client-pilot-runtime-profile-readonly",
  });

  try {
    await client.connect();
    await assertReadOnlyRole(client, options.outDir);
    const staticObjects = scanMigrationObjects();
    const catalogRows = await collectCatalog(client, staticObjects, options.exactMaxEstimatedRows);
    writeCsv(path.join(options.outDir, "LIVE_DATABASE_OBJECT_PROFILE.csv"), catalogRows, [
      "schema",
      "object",
      "physical_object",
      "object_type",
      "approximate_rows",
      "exact_rows",
      "exact_count_status",
      "storage_bytes",
      "last_vacuum",
      "last_autovacuum",
      "last_analyze",
      "last_autoanalyze",
      "primary_keys",
      "unique_keys",
      "foreign_keys",
      "indexes",
      "triggers",
      "functions_touching_object",
      "rls_enabled",
      "rls_policies",
      "tenant_client_columns",
      "creation_migration",
      "last_structural_migration",
    ]);

    const runtimeStatements = await collectPgStatStatements(client, catalogRows);
    const staticRefs = scanStaticCodeReferences(catalogRows);
    writeDerivedReports(options.outDir, catalogRows, staticObjects, staticRefs, runtimeStatements, options, metadata);
    writeCsv(path.join(options.outDir, "NON_DATABASE_STORE_INVENTORY.csv"), nonDatabaseStores(), [
      "store_type",
      "path",
      "exists",
      "file_count",
      "total_bytes",
      "runtime_use_status",
    ]);

    await client.query("ROLLBACK");
    const missing = REQUIRED_OUTPUTS.filter((name) => !fs.existsSync(path.join(options.outDir, name)));
    if (missing.length) throw new Error(`Missing required output(s): ${missing.join(", ")}`);
    writeJson(path.join(options.outDir, "SUMMARY.json"), {
      ...metadata,
      status: "succeeded",
      requiredOutputs: REQUIRED_OUTPUTS,
      outputCount: REQUIRED_OUTPUTS.length,
      pgStatStatementsAvailable: runtimeStatements.available,
      catalogObjectCount: catalogRows.length,
    });
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    console.log(`runtime profile succeeded: ${options.outDir}`);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures during connection/setup errors
    }
    writeJson(path.join(options.outDir, "SUMMARY.json"), {
      ...metadata,
      status: "failed",
      error: error.message,
    });
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

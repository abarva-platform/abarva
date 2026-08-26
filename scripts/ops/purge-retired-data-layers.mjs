#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const DEFAULT_SCHEMAS = ["intelligence_v6", "intelligence_v7", "cio_tower"];
const DEFAULT_STATUS_MAP = "reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_map.csv";
const DEFAULT_CODE_REFERENCE_MANIFEST = "docs/architecture/ecl-retired-code-reference-manifest.json";
const APPLY_SAFE_STATUSES = new Set(["REPLACE_WITH_ECL_PROJECTION", "ARCHIVE_ONLY"]);
const DEFAULT_CODE_REFERENCE_ROOTS = ["src", "scripts"];
const CODE_REFERENCE_EXCLUDE_PATHS = new Set([
  "scripts/ops/purge-retired-data-layers.mjs",
  "scripts/ecl/write_legacy_table_retirement_map.py",
]);
const CODE_REFERENCE_EXCLUDE_DIRS = new Set([
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "playwright-report",
  "reports",
  "test-results",
]);
const CODE_REFERENCE_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".py",
  ".sql",
  ".ts",
  ".tsx",
]);

async function loadPgClient() {
  const pg = await import("pg");
  return pg.Client ?? pg.default?.Client;
}

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function buildOutsideDependencyQuery() {
  return `with retired_namespace as (
            select oid, nspname
              from pg_namespace
             where nspname = any($1::text[])
          ),
          retired_objects as (
            select c.oid, n.nspname as schema_name, c.relname as object_name, c.relkind
              from pg_class c
              join pg_namespace n on n.oid = c.relnamespace
             where n.oid in (select oid from retired_namespace)
          )
          select distinct
                 source_ns.nspname as referencing_schema,
                 source_class.relname as referencing_object,
                 source_class.relkind as referencing_kind,
                 retired.schema_name as retired_schema,
                 retired.object_name as retired_object,
                 retired.relkind as retired_kind
            from pg_depend dep
            join retired_objects retired on retired.oid = dep.refobjid
            join pg_rewrite rewrite on rewrite.oid = dep.objid
            join pg_class source_class on source_class.oid = rewrite.ev_class
            join pg_namespace source_ns on source_ns.oid = source_class.relnamespace
           where not (source_ns.nspname = any($1::text[]))
           order by referencing_schema, referencing_object, retired.schema_name, retired.object_name`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}

function readStatusMap(statusMapPath) {
  const resolvedPath = path.resolve(process.cwd(), statusMapPath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      path: statusMapPath,
      resolved_path: resolvedPath,
      available: false,
      rows_by_schema: new Map(),
    };
  }

  const [headerLine, ...lines] = fs
    .readFileSync(resolvedPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(headerLine);
  const schemaIndex = headers.indexOf("schema");
  const statusIndex = headers.indexOf("sunset_status");
  const tableIndex = headers.indexOf("table");
  if (schemaIndex < 0 || statusIndex < 0) {
    throw new Error(`Retirement status map must include schema and sunset_status columns: ${statusMapPath}`);
  }

  const rowsBySchema = new Map();
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const schema = String(cells[schemaIndex] ?? "").trim();
    const status = String(cells[statusIndex] ?? "").trim();
    if (!schema || !status) continue;
    const table = tableIndex >= 0 ? String(cells[tableIndex] ?? "").trim() : "";
    const entry = rowsBySchema.get(schema) ?? { row_count: 0, statuses: new Map(), objects: new Set() };
    entry.row_count += 1;
    entry.statuses.set(status, (entry.statuses.get(status) ?? 0) + 1);
    if (table) entry.objects.add(table);
    rowsBySchema.set(schema, entry);
  }

  return {
    path: statusMapPath,
    resolved_path: resolvedPath,
    available: true,
    rows_by_schema: rowsBySchema,
  };
}

function readCodeReferenceManifest(manifestPath) {
  const resolvedPath = path.resolve(process.cwd(), manifestPath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      path: manifestPath,
      resolved_path: resolvedPath,
      available: false,
      entries: [],
      entries_by_file: new Map(),
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  if (parsed?.schema_version !== "ecl_retired_code_reference_manifest/v1") {
    throw new Error(`Unsupported retired code-reference manifest schema_version: ${manifestPath}`);
  }
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`Retired code-reference manifest must contain entries[]: ${manifestPath}`);
  }

  const entriesByFile = new Map();
  const entries = parsed.entries.map((entry, index) => {
    const file = String(entry?.file ?? "").trim();
    const retiredSchemas = Array.isArray(entry?.retired_schemas)
      ? entry.retired_schemas.map((schema) => String(schema).trim()).filter(Boolean)
      : [];
    const disposition = String(entry?.disposition ?? "").trim();
    const replacement = String(entry?.replacement ?? "").trim();
    if (!file || path.isAbsolute(file) || file.split(path.sep).includes("..")) {
      throw new Error(`Retired code-reference manifest entry ${index} has an invalid file path.`);
    }
    if (!file.startsWith("src/") && !file.startsWith("scripts/")) {
      throw new Error(`Retired code-reference manifest entry ${file} must live under src/ or scripts/.`);
    }
    if (retiredSchemas.length === 0) {
      throw new Error(`Retired code-reference manifest entry ${file} must name retired_schemas.`);
    }
    if (!disposition || !replacement) {
      throw new Error(`Retired code-reference manifest entry ${file} must include disposition and replacement.`);
    }
    const resolvedFile = path.resolve(process.cwd(), file);
    if (!fs.existsSync(resolvedFile)) {
      throw new Error(`Retired code-reference manifest entry points at a missing file: ${file}`);
    }
    const normalized = {
      file,
      retired_schemas: new Set(retiredSchemas),
      disposition,
      replacement,
    };
    entriesByFile.set(file, normalized);
    return {
      file,
      retired_schemas: retiredSchemas,
      disposition,
      replacement,
    };
  });

  return {
    path: manifestPath,
    resolved_path: resolvedPath,
    available: true,
    entries,
    entries_by_file: entriesByFile,
  };
}

function classifyCodeReference(reference, manifest) {
  const entry = manifest.entries_by_file.get(reference.file);
  if (!entry || !entry.retired_schemas.has(reference.schema)) {
    return {
      ...reference,
      reference_state: "active",
      retirement_disposition: null,
      replacement: null,
    };
  }
  return {
    ...reference,
    reference_state: "declared_retired",
    retirement_disposition: entry.disposition,
    replacement: entry.replacement,
  };
}

function statusGateForSchemas(schemas, statusMap) {
  const schemaSummaries = schemas.map((schema) => {
    const entry = statusMap.rows_by_schema.get(schema);
    const statuses = Object.fromEntries(entry?.statuses ?? []);
    const unsafeStatuses = Object.keys(statuses).filter((status) => !APPLY_SAFE_STATUSES.has(status));
    return {
      schema,
      status_map_rows: entry?.row_count ?? 0,
      statuses,
      status_map_known: Boolean(entry),
      apply_status_safe: Boolean(entry) && unsafeStatuses.length === 0,
      unsafe_statuses: unsafeStatuses,
    };
  });
  const unknownSchemas = schemaSummaries
    .filter((row) => !row.status_map_known)
    .map((row) => row.schema);
  const unsafeSchemas = schemaSummaries
    .filter((row) => row.status_map_known && !row.apply_status_safe)
    .map((row) => ({
      schema: row.schema,
      unsafe_statuses: row.unsafe_statuses,
      statuses: row.statuses,
    }));
  return {
    status_map: {
      path: statusMap.path,
      resolved_path: statusMap.resolved_path,
      available: statusMap.available,
      allowed_apply_statuses: Array.from(APPLY_SAFE_STATUSES).sort(),
    },
    schema_status_summaries: schemaSummaries,
    unknown_schemas: unknownSchemas,
    unsafe_schemas: unsafeSchemas,
    apply_allowed: statusMap.available && unknownSchemas.length === 0 && unsafeSchemas.length === 0,
  };
}

function isApplyAllowed({
  shouldApply,
  allowDependencies,
  dependencyInventory,
  allowCodeReferences,
  activeCodeReferenceInventory,
  allowStatusMix,
  statusGate,
}) {
  return (
    shouldApply &&
    (allowDependencies || dependencyInventory.length === 0) &&
    (allowCodeReferences || activeCodeReferenceInventory.length === 0) &&
    (allowStatusMix || statusGate.apply_allowed)
  );
}

function listFilesRecursive(rootPath) {
  if (!fs.existsSync(rootPath)) return [];
  const stat = fs.statSync(rootPath);
  if (!stat.isDirectory()) return [];

  const files = [];
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!CODE_REFERENCE_EXCLUDE_DIRS.has(entry.name)) {
          stack.push(fullPath);
        }
      } else if (entry.isFile() && CODE_REFERENCE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function buildCodeReferencePatterns(schemas, statusMap) {
  return schemas.flatMap((schema) => {
    const objectNames = Array.from(statusMap?.rows_by_schema.get(schema)?.objects ?? []);
    if (objectNames.length === 0) {
      return [
        {
          schema,
          object: null,
          regex: new RegExp(`\\b${escapeRegExp(schema)}\\.[A-Za-z_][A-Za-z0-9_$]*\\b`, "g"),
        },
      ];
    }
    return objectNames.map((objectName) => ({
      schema,
      object: objectName,
      regex: new RegExp(`\\b${escapeRegExp(schema)}\\.${escapeRegExp(objectName)}\\b`, "g"),
    }));
  });
}

function scanCodeReferences(schemas, statusMap = null, roots = DEFAULT_CODE_REFERENCE_ROOTS, manifest = readCodeReferenceManifest(DEFAULT_CODE_REFERENCE_MANIFEST)) {
  const patterns = buildCodeReferencePatterns(schemas, statusMap);
  const references = [];

  for (const root of roots) {
    const rootPath = path.resolve(process.cwd(), root);
    for (const filePath of listFilesRecursive(rootPath)) {
      const relativePath = path.relative(process.cwd(), filePath);
      if (CODE_REFERENCE_EXCLUDE_PATHS.has(relativePath)) continue;
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const pattern of patterns) {
          if (!pattern.regex.test(line)) continue;
          pattern.regex.lastIndex = 0;
          references.push(classifyCodeReference({
            schema: pattern.schema,
            object: pattern.object,
            file: relativePath,
            line: index + 1,
            text: line.trim().slice(0, 220),
          }, manifest));
        }
      });
    }
  }

  return references;
}

async function countRows(client, schemaName, tableName) {
  const sql = `select count(*)::bigint as row_count from ${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;
  const result = await client.query(sql);
  return Number(result.rows[0]?.row_count ?? 0);
}

function selfTest() {
  const query = buildOutsideDependencyQuery();
  if (!query.includes("nspname = any($1::text[])")) {
    throw new Error("Dependency query must select the full retired schema set.");
  }
  if (!query.includes("not (source_ns.nspname = any($1::text[]))")) {
    throw new Error("Dependency query must exclude dependencies inside the retired schema set.");
  }
  if (query.includes("source_ns.nspname <> $1")) {
    throw new Error("Dependency query must not use one-schema dependency filtering.");
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "retired-layer-status-map-"));
  const statusMapPath = path.join(tempDir, "map.csv");
  fs.writeFileSync(
    statusMapPath,
    [
      "schema,table,sunset_status",
      "safe_schema,a,REPLACE_WITH_ECL_PROJECTION",
      "safe_schema,b,ARCHIVE_ONLY",
      "mixed_schema,c,HOLD_UNTIL_LIVE_READBACK",
    ].join("\n"),
  );
  const statusGate = statusGateForSchemas(
    ["safe_schema", "mixed_schema", "unknown_schema"],
    readStatusMap(statusMapPath),
  );
  if (statusGate.apply_allowed) {
    throw new Error("Status gate must refuse mixed and unknown schemas.");
  }
  if (!statusGate.unsafe_schemas.some((row) => row.schema === "mixed_schema")) {
    throw new Error("Status gate must identify mixed-status schemas.");
  }
  if (!statusGate.unknown_schemas.includes("unknown_schema")) {
    throw new Error("Status gate must identify schemas absent from the status map.");
  }
  if (formatStructuredOutput({ event: "test", proof: { ok: true } }, true).includes("\n")) {
    throw new Error("Compact structured output must be emitted as one log line.");
  }
  const codeRefRoot = fs.mkdtempSync(path.join(os.tmpdir(), "retired-layer-code-ref-"));
  fs.mkdirSync(path.join(codeRefRoot, "src"), { recursive: true });
  fs.mkdirSync(path.join(codeRefRoot, "scripts/ops"), { recursive: true });
  fs.writeFileSync(path.join(codeRefRoot, "src/example.ts"), "const table = 'legacy_schema.table';\n");
  fs.writeFileSync(path.join(codeRefRoot, "src/method.ts"), "const value = legacy_schema.match(value);\n");
  fs.writeFileSync(
    path.join(codeRefRoot, "scripts/ops/purge-retired-data-layers.mjs"),
    "const ignored = 'legacy_schema.self';\n",
  );
  fs.mkdirSync(path.join(codeRefRoot, "docs/architecture"), { recursive: true });
  fs.writeFileSync(path.join(codeRefRoot, "src/retired.ts"), "const table = 'legacy_schema.table';\n");
  fs.writeFileSync(
    path.join(codeRefRoot, DEFAULT_CODE_REFERENCE_MANIFEST),
    JSON.stringify(
      {
        schema_version: "ecl_retired_code_reference_manifest/v1",
        entries: [
          {
            file: "src/retired.ts",
            retired_schemas: ["legacy_schema"],
            disposition: "historical_test_fixture",
            replacement: "new_schema.table",
          },
        ],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(codeRefRoot, "map.csv"), "schema,table,sunset_status\nlegacy_schema,table,ARCHIVE_ONLY\n");
  const priorCwd = process.cwd();
  process.chdir(codeRefRoot);
  try {
    const references = scanCodeReferences(
      ["legacy_schema"],
      readStatusMap("map.csv"),
      DEFAULT_CODE_REFERENCE_ROOTS,
      readCodeReferenceManifest(DEFAULT_CODE_REFERENCE_MANIFEST),
    );
    const activeReferences = references.filter((reference) => reference.reference_state === "active");
    const retiredReferences = references.filter((reference) => reference.reference_state === "declared_retired");
    if (activeReferences.length !== 1 || activeReferences[0].file !== "src/example.ts") {
      throw new Error("Code-reference gate must detect mapped object references and ignore method-shaped false positives.");
    }
    if (retiredReferences.length !== 1 || retiredReferences[0].file !== "src/retired.ts") {
      throw new Error("Code-reference gate must classify manifest-declared retired references separately.");
    }
    const safeStatusGate = statusGateForSchemas(["legacy_schema"], readStatusMap("map.csv"));
    if (!isApplyAllowed({
      shouldApply: true,
      allowDependencies: false,
      dependencyInventory: [],
      allowCodeReferences: false,
      activeCodeReferenceInventory: [],
      allowStatusMix: false,
      statusGate: safeStatusGate,
    })) {
      throw new Error("Declared-retired code references must not block the apply summary gate.");
    }
  } finally {
    process.chdir(priorCwd);
  }
  console.log(
    JSON.stringify({
      ok: true,
      mode: "self_test",
      dependency_scope: "retirement_set",
      compact_stdout_supported: true,
      status_map_apply_gate: "mixed_or_unknown_schemas_refused",
      code_reference_apply_gate: "schema_references_refused",
    }),
  );
}

function validateStatusMap(statusMapPath = DEFAULT_STATUS_MAP) {
  const statusMap = readStatusMap(statusMapPath);
  if (!statusMap.available) {
    throw new Error(
      `Retirement status map is not available at ${statusMap.resolved_path}. ` +
        "The ACA job image must package the committed retirement inventory.",
    );
  }
  if (statusMap.rows_by_schema.size === 0) {
    throw new Error(`Retirement status map has no schema rows: ${statusMap.resolved_path}`);
  }
  return statusMap;
}

function formatStructuredOutput(payload, compact) {
  return JSON.stringify(payload, null, compact ? 0 : 2);
}

async function main() {
  if (hasFlag("--self-test")) {
    selfTest();
    return;
  }

  const validateOnly = hasFlag("--validate-only");
  if (validateOnly) {
    const statusMap = validateStatusMap(
      String(argValue("--status-map", process.env.RETIRED_LAYER_PURGE_STATUS_MAP ?? DEFAULT_STATUS_MAP)),
    );
    console.log(
      JSON.stringify({
        ok: true,
        mode: "validate_only",
        default_schemas: DEFAULT_SCHEMAS,
        dependency_scope: "retirement_set",
        status_map: {
          path: statusMap.path,
          resolved_path: statusMap.resolved_path,
          available: statusMap.available,
          schema_count: statusMap.rows_by_schema.size,
        },
      }),
    );
    return;
  }

  const apply = hasFlag("--apply");
  const envApply = process.env.RETIRED_LAYER_PURGE_APPLY === "1";
  const allowDependencies =
    hasFlag("--allow-dependencies") || process.env.RETIRED_LAYER_PURGE_ALLOW_DEPENDENCIES === "1";
  const allowStatusMix =
    hasFlag("--allow-status-mix") || process.env.RETIRED_LAYER_PURGE_ALLOW_STATUS_MIX === "1";
  const allowCodeReferences =
    hasFlag("--allow-code-references") || process.env.RETIRED_LAYER_PURGE_ALLOW_CODE_REFERENCES === "1";
  const compactStdout =
    hasFlag("--compact-stdout") || process.env.RETIRED_LAYER_PURGE_COMPACT_STDOUT === "1";
  const statusMapPath = String(
    argValue("--status-map", process.env.RETIRED_LAYER_PURGE_STATUS_MAP ?? DEFAULT_STATUS_MAP),
  );
  const codeReferenceManifestPath = String(
    argValue(
      "--code-reference-manifest",
      process.env.RETIRED_LAYER_PURGE_CODE_REFERENCE_MANIFEST ?? DEFAULT_CODE_REFERENCE_MANIFEST,
    ),
  );
  const outDir =
    argValue("--out-dir", process.env.RETIRED_LAYER_PURGE_OUT_DIR) ??
    path.join(os.tmpdir(), "retired-layer-purge");
  const runId =
    argValue("--run-id") ??
    `retired-layer-purge-${new Date().toISOString().replace(/[:.]/g, "")}`;
  const schemas = String(
    argValue("--schemas", process.env.RETIRED_LAYER_PURGE_SCHEMAS ?? DEFAULT_SCHEMAS.join(",")),
  )
    .split(",")
    .map((schema) => schema.trim())
    .filter(Boolean);
  const shouldApply = apply || envApply;

  fs.mkdirSync(outDir, { recursive: true });

  if (hasFlag("--static-preflight-only")) {
    const statusMap = readStatusMap(statusMapPath);
    const statusGate = statusGateForSchemas(schemas, statusMap);
    const codeReferenceManifest = readCodeReferenceManifest(codeReferenceManifestPath);
    const codeReferenceInventory = scanCodeReferences(
      schemas,
      statusMap,
      DEFAULT_CODE_REFERENCE_ROOTS,
      codeReferenceManifest,
    );
    const activeCodeReferenceInventory = codeReferenceInventory.filter(
      (reference) => reference.reference_state === "active",
    );
    const declaredRetiredCodeReferenceInventory = codeReferenceInventory.filter(
      (reference) => reference.reference_state === "declared_retired",
    );
    const payload = {
      run_id: runId,
      generated_at: new Date().toISOString(),
      mode: "static_preflight_only",
      schemas,
      code_references_count: codeReferenceInventory.length,
      active_code_references_count: activeCodeReferenceInventory.length,
      declared_retired_code_references_count: declaredRetiredCodeReferenceInventory.length,
      active_code_references: activeCodeReferenceInventory,
      declared_retired_code_references: declaredRetiredCodeReferenceInventory,
      retired_code_reference_manifest: {
        path: codeReferenceManifest.path,
        resolved_path: codeReferenceManifest.resolved_path,
        available: codeReferenceManifest.available,
        entry_count: codeReferenceManifest.entries.length,
      },
      retirement_status_gate: {
        status_map: statusGate.status_map,
        unknown_schemas: statusGate.unknown_schemas,
        unsafe_schemas: statusGate.unsafe_schemas,
        apply_allowed: statusGate.apply_allowed,
      },
      gates: {
        active_code_references: activeCodeReferenceInventory.length,
        declared_retired_code_references: declaredRetiredCodeReferenceInventory.length,
        status_unsafe_or_unknown_schemas:
          statusGate.unsafe_schemas.length + statusGate.unknown_schemas.length,
        static_preflight_passed:
          activeCodeReferenceInventory.length === 0 && statusGate.apply_allowed,
      },
    };
    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(formatStructuredOutput({ ...payload, proof_path: proofPath }, compactStdout));
    return;
  }

  const databaseUrl =
    process.env.DATABASE_URL ??
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL, ABARVA_AZURE_DATABASE_URL, or AZURE_DATABASE_URL is required",
    );
  }

  const Client = await loadPgClient();
  if (!Client) {
    throw new Error("Could not load pg Client from the pg package.");
  }

  const client = new Client({
    connectionString: databaseUrl,
    application_name: `abarva-retired-layer-purge-${shouldApply ? "apply" : "dry-run"}`,
  });
  await client.connect();

  try {
    await client.query("begin");
    const schemaInventory = [];
    const statusMap = readStatusMap(statusMapPath);
    const statusGate = statusGateForSchemas(schemas, statusMap);
    const codeReferenceManifest = readCodeReferenceManifest(codeReferenceManifestPath);

    for (const schemaName of schemas) {
      const exists = await client.query(
        "select exists(select 1 from information_schema.schemata where schema_name = $1) as exists",
        [schemaName],
      );
      if (!exists.rows[0]?.exists) {
        schemaInventory.push({
          schema: schemaName,
          exists: false,
          tables: [],
          views: [],
          routines: [],
          row_count: 0,
        });
        continue;
      }

      const tableRows = await client.query(
        `select table_name, table_type
           from information_schema.tables
          where table_schema = $1
          order by table_name`,
        [schemaName],
      );
      const routineRows = await client.query(
        `select routine_name, routine_type
           from information_schema.routines
          where specific_schema = $1
          order by routine_name`,
        [schemaName],
      );
      const tables = [];
      const views = [];
      let schemaRowCount = 0;
      for (const row of tableRows.rows) {
        if (row.table_type === "BASE TABLE") {
          const rowCount = await countRows(client, schemaName, row.table_name);
          schemaRowCount += rowCount;
          tables.push({ table: row.table_name, row_count: rowCount });
        } else {
          views.push({ view: row.table_name, table_type: row.table_type });
        }
      }
      schemaInventory.push({
        schema: schemaName,
        exists: true,
        tables,
        views,
        routines: routineRows.rows.map((row) => ({
          routine: row.routine_name,
          routine_type: row.routine_type,
        })),
        row_count: schemaRowCount,
      });

    }

    const dependencies = await client.query(buildOutsideDependencyQuery(), [schemas]);
    const dependencyInventory = dependencies.rows;
    const codeReferenceInventory = scanCodeReferences(
      schemas,
      statusMap,
      DEFAULT_CODE_REFERENCE_ROOTS,
      codeReferenceManifest,
    );
    const activeCodeReferenceInventory = codeReferenceInventory.filter(
      (reference) => reference.reference_state === "active",
    );
    const declaredRetiredCodeReferenceInventory = codeReferenceInventory.filter(
      (reference) => reference.reference_state === "declared_retired",
    );
    const proof = {
      run_id: runId,
      generated_at: new Date().toISOString(),
      mode: shouldApply ? "apply" : "dry_run",
      schemas,
      dependencies_outside_retired_schemas: dependencyInventory,
      code_references: codeReferenceInventory,
      active_code_references: activeCodeReferenceInventory,
      declared_retired_code_references: declaredRetiredCodeReferenceInventory,
      retired_code_reference_manifest: {
        path: codeReferenceManifest.path,
        resolved_path: codeReferenceManifest.resolved_path,
        available: codeReferenceManifest.available,
        entry_count: codeReferenceManifest.entries.length,
      },
      retirement_status_gate: statusGate,
      schema_inventory: schemaInventory,
      gates: {
        schemas_discovered: schemaInventory.filter((row) => row.exists).length,
        outside_dependencies: dependencyInventory.length,
        code_references: codeReferenceInventory.length,
        active_code_references: activeCodeReferenceInventory.length,
        declared_retired_code_references: declaredRetiredCodeReferenceInventory.length,
        code_reference_gate_bypassed: allowCodeReferences,
        status_unsafe_or_unknown_schemas:
          statusGate.unsafe_schemas.length + statusGate.unknown_schemas.length,
        status_gate_bypassed: allowStatusMix,
        apply_allowed: isApplyAllowed({
          shouldApply,
          allowDependencies,
          dependencyInventory,
          allowCodeReferences,
          activeCodeReferenceInventory,
          allowStatusMix,
          statusGate,
        }),
      },
    };
    const proofSummary = {
      run_id: proof.run_id,
      generated_at: proof.generated_at,
      mode: proof.mode,
      schemas,
      schema_count: schemaInventory.length,
      schemas_discovered: proof.gates.schemas_discovered,
      schema_summaries: schemaInventory.map((row) => ({
        schema: row.schema,
        exists: row.exists,
        table_count: row.tables.length,
        view_count: row.views.length,
        routine_count: row.routines.length,
        row_count: row.row_count,
      })),
      table_count: schemaInventory.reduce((sum, row) => sum + row.tables.length, 0),
      view_count: schemaInventory.reduce((sum, row) => sum + row.views.length, 0),
      routine_count: schemaInventory.reduce((sum, row) => sum + row.routines.length, 0),
      total_row_count: schemaInventory.reduce((sum, row) => sum + row.row_count, 0),
      dependencies_outside_retired_schemas_count: dependencyInventory.length,
      dependencies_outside_retired_schemas: dependencyInventory,
      code_references_count: codeReferenceInventory.length,
      code_references: codeReferenceInventory,
      active_code_references_count: activeCodeReferenceInventory.length,
      active_code_references: activeCodeReferenceInventory,
      declared_retired_code_references_count: declaredRetiredCodeReferenceInventory.length,
      declared_retired_code_references: declaredRetiredCodeReferenceInventory,
      retired_code_reference_manifest: proof.retired_code_reference_manifest,
      retirement_status_gate: {
        status_map: statusGate.status_map,
        unknown_schemas: statusGate.unknown_schemas,
        unsafe_schemas: statusGate.unsafe_schemas,
        apply_allowed: statusGate.apply_allowed,
      },
      gates: proof.gates,
    };

    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);

    if (shouldApply && dependencyInventory.length > 0 && !allowDependencies) {
      throw new Error(
        `Refusing to apply: ${dependencyInventory.length} outside-schema dependencies found. Review ${proofPath}.`,
      );
    }
    if (shouldApply && activeCodeReferenceInventory.length > 0 && !allowCodeReferences) {
      throw new Error(
        `Refusing to apply: ${activeCodeReferenceInventory.length} active code references found. Review ${proofPath}.`,
      );
    }
    if (shouldApply && !statusGate.apply_allowed && !allowStatusMix) {
      throw new Error(
        `Refusing to apply: ${statusGate.unsafe_schemas.length} mixed-status schemas and ${statusGate.unknown_schemas.length} unknown schemas found. Review ${proofPath}.`,
      );
    }

    if (shouldApply) {
      for (const schemaName of schemas) {
        await client.query(`drop schema if exists ${quoteIdent(schemaName)} cascade`);
      }
      await client.query("commit");
      proof.applied_at = new Date().toISOString();
      fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
    } else {
      await client.query("rollback");
    }

    const stdoutPayload = {
      event: "retired_data_layer_purge_proof",
      structured_event: "retired_data_layer_purge_proof",
      ok: true,
      proof_path: proofPath,
      proof: compactStdout ? proofSummary : proof,
    };
    console.log(formatStructuredOutput(stdoutPayload, compactStdout));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});

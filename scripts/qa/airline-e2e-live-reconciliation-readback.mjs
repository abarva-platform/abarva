#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { ManagedIdentityCredential } from "@azure/identity";
import pg from "pg";

const { Pool } = pg;

const TENANT_KEY = "airline-demo-new";
const TENANT_TOKEN = "AIRLINE_DEMO_NEW";
const SOURCE_RELEASE_ID = "airline-demo-new-source-corpus-v1.0.0";
const BASELINE_ID = `${SOURCE_RELEASE_ID}:knowledge-baseline-v1`;
const EXPECTED_BASELINE_HASH =
  "135d860b9b104b2a2891fd108ea57286dc28bc057327498c63934c6552425549";
const EXPECTED_PROJECTION_HASH =
  "e043827303034319199613dcdac3631629ddd399e9ae841411a370b274655ef5";
const EXPECTED_SOURCE_ROWS = 99_883;
const STALE_PRIOR_AUDIT_ROWS = 110_895;
const POSTGRES_AAD_RESOURCE =
  "https://ossrdbms-aad.database.windows.net/.default";

const DEFAULT_SOURCE_ROOT = path.join(
  process.cwd(),
  "clients",
  "airline-demo-new",
  "19-template-instantiation-source-corpus",
  "03-source-corpus-design",
  "synthetic-source-samples",
);
const DEFAULT_OUT_DIR = path.join(
  os.tmpdir(),
  "airline-e2e-live-reconciliation-readback-2026-07-29",
);

const PROJECTION_TABLES = [
  "consumption.enterprise_brief_v1",
  "consumption.enterprise_identity_v1",
  "consumption.executive_perspective_v1",
  "consumption.strategic_interpretation_v1",
  "consumption.domain_summary_v1",
  "consumption.application_inventory_v1",
  "consumption.technology_estate_v1",
  "consumption.data_product_inventory_v1",
  "consumption.vendor_contract_inventory_v1",
  "consumption.evidence_gap_v1",
  "consumption.search_document_v1",
  "consumption.module_knowledge_packet_v1",
  "consumption.source_event_summary_v1",
  "consumption.source_vendor_comparison_v1",
  "consumption.source_pricing_comparison_v1",
  "consumption.source_evaluation_v1",
  "consumption.source_transition_risk_v1",
  "consumption.metric_observation_v1",
  "consumption.relationship_node_v1",
  "consumption.relationship_edge_v1",
  "consumption.relationship_evidence_v1",
];

const LAYER_TABLES = [
  "operations.run",
  "source_registry.source",
  "source_registry.source_version",
  "evidence.evidence_item",
  "working.entity_candidate",
  "working.fact_candidate",
  "working.relationship_candidate",
  "working.quarantine_item",
  "governance.review_batch",
  "governance.review_batch_approval",
  "governance.review_decision",
  "governance.evidence_gap",
  "knowledge.entity",
  "knowledge.fact_assertion",
  "knowledge.relationship_assertion",
  "metrics.metric_definition",
  "metrics.metric_observation",
  "publication.domain_publication",
  "publication.knowledge_baseline",
  "publication.publication_activation",
  "publication.projection_version",
  "consumption.consumer_reconciliation_ledger",
  "audit.lineage_event",
  ...PROJECTION_TABLES,
];

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    outDir: process.env.AIRLINE_E2E_RECON_OUT_DIR || DEFAULT_OUT_DIR,
    sourceRoot: process.env.AIRLINE_E2E_SOURCE_ROOT || DEFAULT_SOURCE_ROOT,
    requireDb: process.env.AIRLINE_E2E_REQUIRE_DB === "true",
    skipDb: process.env.AIRLINE_E2E_SKIP_DB === "true",
    verbose: process.env.AIRLINE_E2E_VERBOSE === "true",
    emitProofBundle: process.env.EMIT_ACA_PROOF_BUNDLE === "true",
    sampleLimit: Number(process.env.AIRLINE_E2E_SAMPLE_LIMIT || 50),
    fieldDetail: process.env.AIRLINE_E2E_FIELD_DETAIL !== "false",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--source-root") args.sourceRoot = next();
    else if (arg === "--require-db") args.requireDb = true;
    else if (arg === "--no-require-db") args.requireDb = false;
    else if (arg === "--skip-db") args.skipDb = true;
    else if (arg === "--verbose") args.verbose = true;
    else if (arg === "--emit-proof-bundle") args.emitProofBundle = true;
    else if (arg === "--sample-limit") args.sampleLimit = Number(next());
    else if (arg === "--no-field-detail") args.fieldDetail = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/qa/airline-e2e-live-reconciliation-readback.mjs [options]

Read-only Airline source-to-live-data-plane reconciliation.

Options:
  --source-root <path>     Root containing the 25 parser-visible source CSVs.
  --out-dir <path>         Proof output directory.
  --require-db             Fail if live Postgres cannot be reached.
  --no-require-db          Produce source-side proof even without DB.
  --skip-db                Do not attempt a DB connection; source-side smoke only.
  --verbose                Print phase timings to stderr.
  --no-field-detail        Skip per-field detail CSV; keep field summary only.
  --emit-proof-bundle      Emit __SEMANTIC2_PROOF_TGZ_* markers for ACA wrapper.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function phaseLogger(enabled) {
  const started = Date.now();
  let last = started;
  return (message) => {
    if (!enabled) return;
    const now = Date.now();
    process.stderr.write(
      `[airline-recon] ${message} +${now - last}ms total=${now - started}ms\n`,
    );
    last = now;
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function writeCsv(file, headers, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function createCsvWriter(file, headers) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const stream = fs.createWriteStream(file);
  stream.write(`${headers.map(csvEscape).join(",")}\n`);
  return {
    write(row) {
      stream.write(`${headers.map((header) => csvEscape(row[header])).join(",")}\n`);
    },
    end() {
      return new Promise((resolve, reject) => {
        stream.end(resolve);
        stream.on("error", reject);
      });
    },
  };
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function readCsv(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((item) => item.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push({ rowNumber: i, row });
  }
  return { headers, rows };
}

function primaryKeyField(headers) {
  const preferred = [
    "id",
    "application_id",
    "system_id",
    "contract_id",
    "vendor_id",
    "relationship_id",
    "risk_id",
    "control_id",
    "kpi_id",
    "program_id",
    "employee_id",
    "service_id",
    "proposal_id",
    "rate_card_id",
    "bafo_revision_id",
  ];
  return preferred.find((field) => headers.includes(field)) || headers[0] || "";
}

function sourceFamilyFromFile(file) {
  return path.basename(file, ".csv").replaceAll("-", "_");
}

function loadSourceAuthority(sourceRoot) {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Source root not found: ${sourceRoot}`);
  }
  const files = fs
    .readdirSync(sourceRoot)
    .filter((file) => file.endsWith(".csv"))
    .sort();
  const fileRows = [];
  const sourceRows = [];
  const fieldSummary = new Map();
  let fieldInstances = 0;

  for (const fileName of files) {
    const absolutePath = path.join(sourceRoot, fileName);
    const fileBytes = fs.readFileSync(absolutePath);
    const sourceFileHash = sha256(fileBytes);
    const { headers, rows } = readCsv(absolutePath);
    const pkField = primaryKeyField(headers);
    const pkValues = new Map();
    let blankPrimaryKeys = 0;
    for (const { rowNumber, row } of rows) {
      const primaryKeyValue = row[pkField] || "";
      if (!primaryKeyValue) blankPrimaryKeys += 1;
      pkValues.set(primaryKeyValue, (pkValues.get(primaryKeyValue) || 0) + 1);
      const normalizedRow = {};
      headers.forEach((header) => {
        normalizedRow[header] = row[header] ?? "";
      });
      const sourceRowHash = sha256(stableJson(normalizedRow));
      sourceRows.push({
        tenant_key: TENANT_KEY,
        source_release_id: SOURCE_RELEASE_ID,
        source_file: fileName,
        source_file_hash: sourceFileHash,
        source_family: sourceFamilyFromFile(fileName),
        source_row_number: rowNumber,
        primary_key_field: pkField,
        primary_key_value: primaryKeyValue,
        source_row_hash: sourceRowHash,
        row,
        headers,
      });
      for (const header of headers) {
        fieldInstances += 1;
        const key = `${fileName}:${header}`;
        const current = fieldSummary.get(key) || {
          source_file: fileName,
          source_family: sourceFamilyFromFile(fileName),
          source_field: header,
          field_instances: 0,
          non_blank_values: 0,
          blank_values: 0,
        };
        current.field_instances += 1;
        if (String(row[header] ?? "").trim()) current.non_blank_values += 1;
        else current.blank_values += 1;
        fieldSummary.set(key, current);
      }
    }
    const duplicatePrimaryKeys = [...pkValues.values()].filter((count) => count > 1).length;
    fileRows.push({
      tenant_key: TENANT_KEY,
      source_release_id: SOURCE_RELEASE_ID,
      source_file: fileName,
      source_family: sourceFamilyFromFile(fileName),
      source_file_hash: sourceFileHash,
      row_count: rows.length,
      field_count: rows.length * headers.length,
      header_count: headers.length,
      primary_key_field: pkField,
      blank_primary_keys: blankPrimaryKeys,
      duplicate_primary_keys: duplicatePrimaryKeys,
      control_total_status:
        blankPrimaryKeys || duplicatePrimaryKeys ? "SOURCE_KEY_WARNING" : "SOURCE_FILE_READY",
    });
  }

  return {
    fileRows,
    sourceRows,
    fieldSummary: [...fieldSummary.values()],
    totals: {
      files: files.length,
      rows: sourceRows.length,
      fieldInstances,
    },
  };
}

function storageCredential() {
  const clientId =
    envValue("ABARVA_STORAGE_AAD_CLIENT_ID") ||
    envValue("AZURE_STORAGE_AAD_CLIENT_ID") ||
    envValue("MANAGED_IDENTITY_CLIENT_ID") ||
    envValue("AZURE_CLIENT_ID");
  if (clientId) return new ManagedIdentityCredential(clientId);
  return null;
}

async function blobServiceClient(accountName) {
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const connectionString =
    envValue("AZURE_STORAGE_CONNECTION_STRING") ||
    envValue("ABARVA_AZURE_STORAGE_CONNECTION_STRING") ||
    envValue(`${accountName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_CONNECTION_STRING`);
  if (connectionString) return BlobServiceClient.fromConnectionString(connectionString);

  const credential = storageCredential();
  if (credential) {
    return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
  }

  const { DefaultAzureCredential } = await import("@azure/identity");
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
}

function blobRefFromUri(uri) {
  const value = String(uri || "").trim();
  const azblob = value.match(/^azblob:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (azblob) {
    return {
      accountName: azblob[1],
      containerName: azblob[2],
      blobName: decodeURIComponent(azblob[3]),
    };
  }

  if (/^https:\/\//i.test(value)) {
    const parsed = new URL(value);
    const accountName = parsed.hostname.split(".")[0];
    const [, containerName, ...blobParts] = parsed.pathname.split("/");
    if (accountName && containerName && blobParts.length) {
      return {
        accountName,
        containerName,
        blobName: decodeURIComponent(blobParts.join("/")),
      };
    }
  }

  return null;
}

function sourceFileNameFromRecord(record, blobName) {
  const candidates = [
    record?.source_name,
    record?.source_ref,
    blobName,
  ]
    .filter(Boolean)
    .map((value) => path.basename(String(value)));
  const csvName =
    candidates.find((value) => value.toLowerCase().endsWith(".csv")) ||
    candidates.find((value) => value.includes(".")) ||
    candidates[0];
  if (!csvName) return "";
  return csvName.toLowerCase().endsWith(".csv") ? csvName : `${csvName}.csv`;
}

async function hydrateSourceAuthorityFromLiveRegistry(sourceRecords, outDir) {
  const registryRows = [...new Map(
    (sourceRecords || [])
      .filter((record) => String(record.landed_uri || record.source_uri || "").trim())
      .map((record) => [record.source_ref || record.landed_uri || record.source_uri, record]),
  ).values()];
  if (!registryRows.length) {
    throw new Error("Source root is unavailable and live source_registry has no landed source URIs.");
  }

  const sourceRoot = path.join(outDir, "_live-source-authority");
  fs.rmSync(sourceRoot, { recursive: true, force: true });
  fs.mkdirSync(sourceRoot, { recursive: true });

  const downloadRows = [];
  for (const record of registryRows) {
    const uri = record.landed_uri || record.source_uri;
    const blobRef = blobRefFromUri(uri);
    if (!blobRef) {
      downloadRows.push({
        source_ref: record.source_ref,
        source_name: record.source_name,
        uri,
        source_file: "",
        download_status: "UNSUPPORTED_URI",
        expected_hash: record.content_hash || record.source_hash || "",
        actual_hash: "",
      });
      continue;
    }
    const fileName = sourceFileNameFromRecord(record, blobRef.blobName);
    if (!fileName) {
      downloadRows.push({
        source_ref: record.source_ref,
        source_name: record.source_name,
        uri,
        source_file: "",
        download_status: "MISSING_SOURCE_FILE_NAME",
        expected_hash: record.content_hash || record.source_hash || "",
        actual_hash: "",
      });
      continue;
    }

    const service = await blobServiceClient(blobRef.accountName);
    const blob = service
      .getContainerClient(blobRef.containerName)
      .getBlobClient(blobRef.blobName);
    const download = await blob.download();
    const chunks = [];
    for await (const chunk of download.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);
    const actualHash = sha256(body);
    const expectedHash = record.content_hash || record.source_hash || "";
    const destination = path.join(sourceRoot, fileName);
    fs.writeFileSync(destination, body);
    downloadRows.push({
      source_ref: record.source_ref,
      source_name: record.source_name,
      uri,
      source_file: fileName,
      download_status:
        expectedHash && expectedHash !== actualHash ? "HASH_MISMATCH" : "DOWNLOADED",
      expected_hash: expectedHash,
      actual_hash: actualHash,
    });
  }

  writeCsv(path.join(outDir, "live-source-authority-downloads.csv"), [
    "source_ref",
    "source_name",
    "uri",
    "source_file",
    "download_status",
    "expected_hash",
    "actual_hash",
  ], downloadRows);

  const failures = downloadRows.filter((row) => row.download_status !== "DOWNLOADED");
  if (failures.length) {
    throw new Error(
      `Failed to hydrate ${failures.length} source authority file(s) from live registry; see live-source-authority-downloads.csv`,
    );
  }

  return loadSourceAuthority(sourceRoot);
}

function envValue(name) {
  return process.env[name]?.trim() || "";
}

async function aadToken(clientId) {
  const credential = new ManagedIdentityCredential(clientId);
  const token = await credential.getToken(POSTGRES_AAD_RESOURCE);
  if (!token?.token) throw new Error("managed_identity_token_missing");
  return token.token;
}

async function dbConfig() {
  const connectionString =
    envValue(`ABARVA_TENANT_DATABASE_URL_${TENANT_TOKEN}`) ||
    envValue(`ABARVA_CLIENT_DATABASE_URL_${TENANT_TOKEN}`) ||
    envValue(`AZURE_CLIENT_DATABASE_URL_${TENANT_TOKEN}`) ||
    envValue("AIRLINE_DATABASE_URL") ||
    envValue("DATABASE_URL");
  if (connectionString) {
    return {
      config: {
        connectionString,
        ssl: connectionString.includes("sslmode=disable")
          ? false
          : { rejectUnauthorized: false },
      },
      target: maskConnectionString(connectionString),
    };
  }

  const host = envValue(`ABARVA_TENANT_PGHOST_${TENANT_TOKEN}`) || envValue("PGHOST");
  const port = Number.parseInt(
    envValue(`ABARVA_TENANT_PGPORT_${TENANT_TOKEN}`) || envValue("PGPORT") || "5432",
    10,
  );
  const user = envValue(`ABARVA_TENANT_PGUSER_${TENANT_TOKEN}`) || envValue("PGUSER");
  const database =
    envValue(`ABARVA_TENANT_PGDATABASE_${TENANT_TOKEN}`) || envValue("PGDATABASE");
  const aadClientId =
    envValue(`ABARVA_TENANT_POSTGRES_AAD_CLIENT_ID_${TENANT_TOKEN}`) ||
    envValue("ABARVA_POSTGRES_AAD_CLIENT_ID") ||
    envValue("MANAGED_IDENTITY_CLIENT_ID") ||
    envValue("AZURE_CLIENT_ID");
  const password =
    envValue(`ABARVA_TENANT_PGPASSWORD_${TENANT_TOKEN}`) ||
    envValue("PGPASSWORD") ||
    (aadClientId ? await aadToken(aadClientId) : "");
  const missing = [
    ["PGHOST", host],
    ["PGUSER", user],
    ["PGDATABASE", database],
    ["PGPASSWORD_or_AAD", password || aadClientId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(
      `missing_live_db_env:${missing.join(",")}. Provide DATABASE_URL or tenant PGHOST/PGUSER/PGDATABASE plus password/AAD.`,
    );
  }
  return {
    config: {
      host,
      port: Number.isFinite(port) ? port : 5432,
      user,
      database,
      password,
      ssl: { rejectUnauthorized: false },
    },
    target: `postgresql://${user}@${host}:${Number.isFinite(port) ? port : 5432}/${database}`,
  };
}

function maskConnectionString(value) {
  try {
    const url = new URL(value);
    if (url.password) url.password = "<redacted>";
    if (url.username) url.username = url.username ? url.username : "";
    return url.toString();
  } catch {
    return "<unparseable-connection-string>";
  }
}

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function splitRelation(relationName) {
  const [schemaName, tableName] = relationName.split(".");
  if (!schemaName || !tableName) throw new Error(`Invalid relation name: ${relationName}`);
  return { schemaName, tableName };
}

function relationSql(relationName) {
  const { schemaName, tableName } = splitRelation(relationName);
  return `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;
}

async function query(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function relationExists(client, relationName) {
  const rows = await query(client, "SELECT to_regclass($1) IS NOT NULL AS exists", [
    relationName,
  ]);
  return rows[0]?.exists === true;
}

async function columnsForRelation(client, relationName) {
  const { schemaName, tableName } = splitRelation(relationName);
  const rows = await query(
    client,
    `
      SELECT column_name
        FROM information_schema.columns
       WHERE table_schema=$1 AND table_name=$2
       ORDER BY ordinal_position
    `,
    [schemaName, tableName],
  );
  return rows.map((row) => row.column_name);
}

function hasColumn(columns, name) {
  return columns.includes(name);
}

async function countRelation(client, relationName, columns) {
  if (!(await relationExists(client, relationName))) {
    return {
      relation_name: relationName,
      exists: false,
      tenant_rows: "",
      baseline_rows: "",
      status: "MISSING_RELATION",
    };
  }
  const rel = relationSql(relationName);
  const tenantWhere = hasColumn(columns, "tenant_key") ? "WHERE tenant_key=$1" : "";
  const tenantRows = await query(
    client,
    `SELECT count(*)::bigint AS count FROM ${rel} ${tenantWhere}`,
    hasColumn(columns, "tenant_key") ? [TENANT_KEY] : [],
  );
  let baselineRows = "";
  if (hasColumn(columns, "knowledge_baseline_ref")) {
    const baseline = await query(
      client,
      `SELECT count(*)::bigint AS count FROM ${rel} WHERE tenant_key=$1 AND knowledge_baseline_ref=$2`,
      [TENANT_KEY, BASELINE_ID],
    );
    baselineRows = baseline[0]?.count ?? "0";
  }
  return {
    relation_name: relationName,
    exists: true,
    tenant_rows: tenantRows[0]?.count ?? "0",
    baseline_rows: baselineRows,
    status: "READABLE",
  };
}

async function readLiveDb() {
  const { config, target } = await dbConfig();
  const pool = new Pool({
    ...config,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    application_name: "airline-e2e-live-reconciliation-readback",
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query("SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);

    const identity = (
      await query(
        client,
        `
          SELECT current_database() AS database_name,
                 current_user AS database_user,
                 inet_server_addr()::text AS server_addr,
                 inet_server_port() AS server_port,
                 current_setting('app.tenant_key', true) AS tenant_setting,
                 version() AS postgres_version
        `,
      )
    )[0];

    const schemaRows = await query(client, `
      SELECT n.nspname AS schema_name,
             count(*) FILTER (WHERE c.relkind IN ('r','p'))::int AS table_count,
             count(*) FILTER (WHERE c.relkind = 'v')::int AS view_count,
             count(*) FILTER (WHERE c.relkind = 'm')::int AS materialized_view_count
        FROM pg_namespace n
        JOIN pg_class c ON c.relnamespace = n.oid
       WHERE n.nspname NOT LIKE 'pg_%'
         AND n.nspname <> 'information_schema'
       GROUP BY n.nspname
       ORDER BY n.nspname
    `);

    const relationRows = [];
    const columnMap = new Map();
    for (const relationName of LAYER_TABLES) {
      const exists = await relationExists(client, relationName);
      const columns = exists ? await columnsForRelation(client, relationName) : [];
      columnMap.set(relationName, columns);
      relationRows.push(await countRelation(client, relationName, columns));
    }

    const live = {
      target,
      identity,
      schemaRows,
      relationRows,
      sourceRecords: [],
      evidenceRows: [],
      candidateSummary: [],
      reviewSummary: [],
      canonicalSummary: [],
      publicationRows: [],
      baselineRows: [],
      projectionVersionRows: [],
      projectionCountRows: [],
      cubeParityRows: [],
      lineageEventRows: [],
    };

    if (await relationExists(client, "source_registry.source_version")) {
      live.sourceRecords = await query(client, `
        SELECT s.source_ref,
               s.source_family,
               s.source_name,
               s.source_uri,
               s.source_hash,
               v.source_version_ref,
               v.content_hash,
               v.landed_uri,
               v.manifest_ref,
               v.version_number
          FROM source_registry.source s
          LEFT JOIN source_registry.source_version v
            ON v.tenant_key=s.tenant_key AND v.source_ref=s.source_ref
         WHERE s.tenant_key=$1
         ORDER BY s.source_family, s.source_name, v.version_number
      `, [TENANT_KEY]);
    }

    if (await relationExists(client, "evidence.evidence_item")) {
      live.evidenceRows = await query(client, `
        SELECT evidence_ref,
               source_version_ref,
               source_row_ref,
               source_object_ref,
               evidence_hash,
               authority_state::text AS authority_state,
               availability_state::text AS availability_state,
               metadata
          FROM evidence.evidence_item
         WHERE tenant_key=$1
      `, [TENANT_KEY]);
    }

    const candidateQueries = [
      ["entity_candidate", "working.entity_candidate", "entity_type"],
      ["fact_candidate", "working.fact_candidate", "fact_type"],
      ["relationship_candidate", "working.relationship_candidate", "relationship_type_ref"],
    ];
    for (const [candidateType, relationName, typeColumn] of candidateQueries) {
      if (!(await relationExists(client, relationName))) continue;
      const rel = relationSql(relationName);
      live.candidateSummary.push(
        ...(await query(client, `
          SELECT $2 AS candidate_type,
                 source_version_ref,
                 ${quoteIdent(typeColumn)}::text AS object_type,
                 review_state::text AS review_state,
                 count(*)::bigint AS candidate_count,
                 count(*) FILTER (WHERE cardinality(evidence_refs) > 0)::bigint AS with_evidence_count,
                 round(avg(confidence), 4)::text AS avg_confidence
            FROM ${rel}
           WHERE tenant_key=$1
           GROUP BY source_version_ref, ${quoteIdent(typeColumn)}, review_state
           ORDER BY source_version_ref, ${quoteIdent(typeColumn)}, review_state
        `, [TENANT_KEY, candidateType])),
      );
    }

    if (await relationExists(client, "governance.review_decision")) {
      live.reviewSummary = await query(client, `
        SELECT coalesce(candidate_type, reviewed_object_schema) AS candidate_type,
               coalesce(source_version_ref, '') AS source_version_ref,
               coalesce(decision, review_state::text) AS decision,
               coalesce(policy_version, '') AS policy_version,
               coalesce(validation_run_ref, '') AS validation_run_ref,
               count(*)::bigint AS decision_count,
               count(*) FILTER (WHERE cardinality(evidence_refs) > 0)::bigint AS with_evidence_count
          FROM governance.review_decision
         WHERE tenant_key=$1
         GROUP BY coalesce(candidate_type, reviewed_object_schema),
                  coalesce(source_version_ref, ''),
                  coalesce(decision, review_state::text),
                  coalesce(policy_version, ''),
                  coalesce(validation_run_ref, '')
         ORDER BY candidate_type, decision, source_version_ref
      `, [TENANT_KEY]);
    }

    for (const [objectKind, relationName, typeColumn, hashColumn] of [
      ["entity", "knowledge.entity", "entity_type", "content_hash"],
      ["fact", "knowledge.fact_assertion", "fact_type", "content_hash"],
      ["relationship", "knowledge.relationship_assertion", "relationship_type_ref", "content_hash"],
      ["metric_definition", "metrics.metric_definition", "metric_domain", "content_hash"],
      ["metric_observation", "metrics.metric_observation", "metric_ref", "content_hash"],
    ]) {
      if (!(await relationExists(client, relationName))) continue;
      const columns = columnMap.get(relationName) || [];
      const rel = relationSql(relationName);
      const evidenceExpr = hasColumn(columns, "evidence_refs")
        ? "count(*) FILTER (WHERE cardinality(evidence_refs) > 0)::bigint"
        : "0::bigint";
      live.canonicalSummary.push(
        ...(await query(client, `
          SELECT $2 AS object_kind,
                 ${quoteIdent(typeColumn)}::text AS object_type,
                 count(*)::bigint AS object_count,
                 ${evidenceExpr} AS with_evidence_count,
                 count(distinct ${quoteIdent(hashColumn)})::bigint AS distinct_hashes
            FROM ${rel}
           WHERE tenant_key=$1
           GROUP BY ${quoteIdent(typeColumn)}
           ORDER BY object_kind, object_type
        `, [TENANT_KEY, objectKind])),
      );
    }

    if (await relationExists(client, "publication.domain_publication")) {
      live.publicationRows = await query(client, `
        SELECT domain_publication_ref,
               domain_ref,
               release_id,
               publication_state::text AS publication_state,
               source_content_hash,
               accepted_entity_count,
               accepted_fact_count,
               accepted_relationship_count,
               critical_gap_count,
               created_run_ref
          FROM publication.domain_publication
         WHERE tenant_key=$1
         ORDER BY created_at DESC
      `, [TENANT_KEY]);
    }

    if (await relationExists(client, "publication.knowledge_baseline")) {
      live.baselineRows = await query(client, `
        SELECT knowledge_baseline_ref,
               release_id,
               baseline_state::text AS baseline_state,
               is_active,
               domain_publication_refs,
               baseline_content_hash,
               projection_validation_hash,
               activated_run_ref,
               activated_at
          FROM publication.knowledge_baseline
         WHERE tenant_key=$1
         ORDER BY is_active DESC, activated_at DESC NULLS LAST
      `, [TENANT_KEY]);
    }

    if (await relationExists(client, "publication.projection_version")) {
      live.projectionVersionRows = await query(client, `
        SELECT projection_version_ref,
               knowledge_baseline_ref,
               projection_name,
               projection_contract_version,
               build_state::text AS build_state,
               is_active,
               input_hash,
               output_hash,
               row_count,
               validation_report_uri,
               built_run_ref,
               built_at
          FROM publication.projection_version
         WHERE tenant_key=$1
         ORDER BY is_active DESC, projection_name
      `, [TENANT_KEY]);
    }

    for (const relationName of PROJECTION_TABLES) {
      if (!(await relationExists(client, relationName))) continue;
      const columns = columnMap.get(relationName) || [];
      if (!hasColumn(columns, "tenant_key")) continue;
      const rel = relationSql(relationName);
      const baselineWhere = hasColumn(columns, "knowledge_baseline_ref")
        ? "AND knowledge_baseline_ref=$2"
        : "";
      const params = hasColumn(columns, "knowledge_baseline_ref")
        ? [TENANT_KEY, BASELINE_ID]
        : [TENANT_KEY];
      const rows = await query(client, `
        SELECT $${params.length + 1} AS projection_table,
               count(*)::bigint AS row_count,
               count(distinct content_hash)::bigint AS distinct_content_hashes,
               count(*) FILTER (WHERE availability_state::text='available')::bigint AS available_rows,
               count(*) FILTER (WHERE availability_state::text IN ('not_loaded','not_measured','withheld','conflicting','stale','candidate'))::bigint AS unavailable_or_candidate_rows
          FROM ${rel}
         WHERE tenant_key=$1 ${baselineWhere}
      `, [...params, relationName]);
      live.projectionCountRows.push(rows[0]);
    }

    if (await relationExists(client, "consumption.consumer_reconciliation_ledger")) {
      live.cubeParityRows = await query(client, `
        SELECT reconciliation_ref,
               knowledge_baseline_ref,
               projection_name,
               canonical_hash,
               publication_hash,
               consumption_hash,
               cube_hash,
               api_hash,
               ui_hash,
               canonical_count,
               consumption_count,
               cube_count,
               reconciliation_state::text AS reconciliation_state,
               failure_detail,
               checked_run_ref,
               checked_at
          FROM consumption.consumer_reconciliation_ledger
         WHERE tenant_key=$1
         ORDER BY checked_at DESC
      `, [TENANT_KEY]);
    }

    if (await relationExists(client, "audit.lineage_event")) {
      live.lineageEventRows = await query(client, `
        SELECT source_ref,
               source_version_ref,
               evidence_ref,
               candidate_ref,
               canonical_object_ref,
               domain_publication_ref,
               knowledge_baseline_ref,
               projection_version_ref,
               consumer_surface,
               count(*)::bigint AS event_count
          FROM audit.lineage_event
         WHERE tenant_key=$1
         GROUP BY source_ref,
                  source_version_ref,
                  evidence_ref,
                  candidate_ref,
                  canonical_object_ref,
                  domain_publication_ref,
                  knowledge_baseline_ref,
                  projection_version_ref,
                  consumer_surface
         ORDER BY event_count DESC
         LIMIT 5000
      `, [TENANT_KEY]);
    }

    await client.query("ROLLBACK");
    return live;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

function basenameCandidates(value) {
  const text = String(value || "");
  const names = new Set();
  if (!text) return names;
  names.add(path.basename(text));
  try {
    names.add(path.basename(new URL(text).pathname));
  } catch {
    // not a URL
  }
  return names;
}

function sourceVersionFileMap(sourceRecords) {
  const map = new Map();
  for (const record of sourceRecords || []) {
    const names = new Set([
      ...basenameCandidates(record.source_name),
      ...basenameCandidates(record.source_uri),
      ...basenameCandidates(record.landed_uri),
    ]);
    for (const name of names) {
      if (name.endsWith(".csv")) {
        map.set(name, record);
      }
    }
  }
  return map;
}

function rowRefKeys(row, sourceRecord) {
  const keys = new Set();
  const file = row.source_file;
  const rowNumber = String(row.source_row_number);
  const pk = String(row.primary_key_value || "");
  const hash = String(row.source_row_hash || "");
  const sourceVersion = sourceRecord?.source_version_ref || "";
  for (const prefix of [file, path.basename(file), sourceVersion]) {
    if (!prefix) continue;
    keys.add(`${prefix}:${rowNumber}`);
    keys.add(`${prefix}#${rowNumber}`);
    keys.add(`${prefix}:${pk}`);
    keys.add(`${prefix}#${pk}`);
    keys.add(`${prefix}:${hash}`);
    keys.add(`${prefix}#${hash}`);
  }
  keys.add(rowNumber);
  if (pk) keys.add(pk);
  if (hash) keys.add(hash);
  return keys;
}

function evidenceLookup(evidenceRows) {
  const map = new Map();
  for (const evidence of evidenceRows || []) {
    const keys = new Set();
    for (const value of [
      evidence.source_row_ref,
      evidence.source_object_ref,
      evidence.evidence_hash,
      evidence.metadata?.source_row_hash,
      evidence.metadata?.sourceRowHash,
      evidence.metadata?.primary_key_value,
      evidence.metadata?.primaryKeyValue,
    ]) {
      if (value) keys.add(String(value));
    }
    for (const key of keys) {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(evidence);
    }
  }
  return map;
}

function reconcileFiles(sourceAuthority, live) {
  const dbFiles = sourceVersionFileMap(live?.sourceRecords || []);
  return sourceAuthority.fileRows.map((row) => {
    const db = dbFiles.get(row.source_file);
    let status = "MISSING_DOWNSTREAM";
    let reason = "No source_registry.source/source_version row matched this source filename.";
    if (db) {
      const hashValues = [db.source_hash, db.content_hash].filter(Boolean);
      const hashMatched = hashValues.includes(row.source_file_hash);
      status = hashMatched ? "MATCHED_UNCHANGED" : "VALUE_MISMATCH";
      reason = hashMatched
        ? "Source file hash matches live source registry/version."
        : "Live source registry exists, but source/content hash does not match recomputed file hash.";
    }
    return {
      ...row,
      live_source_ref: db?.source_ref || "",
      live_source_version_ref: db?.source_version_ref || "",
      live_source_hash: db?.source_hash || "",
      live_content_hash: db?.content_hash || "",
      live_manifest_ref: db?.manifest_ref || "",
      final_disposition: status,
      first_broken_transition: status === "MATCHED_UNCHANGED" ? "" : "source_registration",
      reason,
    };
  });
}

function reconcileRows(sourceAuthority, live, fileReconRows) {
  const fileReconByFile = new Map(fileReconRows.map((row) => [row.source_file, row]));
  const lookup = evidenceLookup(live?.evidenceRows || []);
  const summary = new Map();
  const detail = [];
  if (!live) {
    for (const file of sourceAuthority.fileRows) {
      const fileRecon = fileReconByFile.get(file.source_file);
      const status = fileRecon?.final_disposition || "MISSING_DOWNSTREAM";
      const firstBroken =
        status === "MATCHED_UNCHANGED" ? "parser_or_evidence_extract" : "source_registration";
      summary.set(`${file.source_file}:${status}:${firstBroken}`, {
        source_file: file.source_file,
        source_family: file.source_family,
        final_disposition: status === "MATCHED_UNCHANGED" ? "MISSING_DOWNSTREAM" : status,
        first_broken_transition: firstBroken,
        row_count: file.row_count,
        reason:
          "Live database was not read in this run, so source rows cannot be certified downstream.",
      });
    }
    return { detail, summary: [...summary.values()] };
  }
  for (const row of sourceAuthority.sourceRows) {
    const file = fileReconByFile.get(row.source_file);
    const evidence = [];
    for (const key of rowRefKeys(row, file)) {
      const matches = lookup.get(key);
      if (matches) evidence.push(...matches);
    }
    const uniqueEvidence = [...new Map(evidence.map((item) => [item.evidence_ref, item])).values()];
    let status = "MISSING_DOWNSTREAM";
    let firstBroken = "parser_or_evidence_extract";
    let reason = "No live evidence row matched source row identity, row number, primary key, or row hash.";
    if (file?.final_disposition !== "MATCHED_UNCHANGED") {
      status = file?.final_disposition || "MISSING_DOWNSTREAM";
      firstBroken = "source_registration";
      reason = "Source file did not reconcile first, so row cannot be certified downstream.";
    } else if (uniqueEvidence.length > 0) {
      status = "MATCHED_TRANSFORMED";
      firstBroken = "";
      reason = "Live evidence rows matched this source-row identity.";
    }
    const key = `${row.source_file}:${status}:${firstBroken}`;
    const current = summary.get(key) || {
      source_file: row.source_file,
      source_family: row.source_family,
      final_disposition: status,
      first_broken_transition: firstBroken,
      row_count: 0,
      reason,
    };
    current.row_count += 1;
    summary.set(key, current);
    detail.push({
      tenant_key: TENANT_KEY,
      source_release_id: SOURCE_RELEASE_ID,
      source_file: row.source_file,
      source_family: row.source_family,
      source_row_number: row.source_row_number,
      primary_key_field: row.primary_key_field,
      primary_key_value: row.primary_key_value,
      source_row_hash: row.source_row_hash,
      live_source_version_ref: file?.live_source_version_ref || "",
      evidence_refs: uniqueEvidence.map((item) => item.evidence_ref).join(";"),
      evidence_count: uniqueEvidence.length,
      final_disposition: status,
      first_broken_transition: firstBroken,
      reason,
    });
  }
  return { detail, summary: [...summary.values()] };
}

async function reconcileFields(sourceAuthority, rowReconDetail, outDir, emitDetail) {
  if (!rowReconDetail.length) {
    return sourceAuthority.fieldSummary.map((row) => ({
      source_file: row.source_file,
      source_family: row.source_family,
      source_field: row.source_field,
      field_disposition: "MISSING_DOWNSTREAM",
      first_broken_transition: "live_db_not_read",
      field_instance_count: row.field_instances,
      reason:
        "Live database was not read in this run, so field-level downstream lineage cannot be certified.",
    }));
  }
  const rowStatusByKey = new Map(
    rowReconDetail.map((row) => [
      `${row.source_file}:${row.source_row_number}:${row.source_row_hash}`,
      row,
    ]),
  );
  const summary = new Map();
  let writer = null;
  const headers = [
    "tenant_key",
    "source_release_id",
    "source_file",
    "source_family",
    "source_row_number",
    "primary_key_value",
    "source_row_hash",
    "source_field",
    "original_value_hash",
    "row_final_disposition",
    "field_disposition",
    "first_broken_transition",
    "reason",
  ];
  if (emitDetail) {
    writer = createCsvWriter(path.join(outDir, "source-field-live-reconciliation.csv"), headers);
  }

  for (const row of sourceAuthority.sourceRows) {
    const rowRecon = rowStatusByKey.get(
      `${row.source_file}:${row.source_row_number}:${row.source_row_hash}`,
    );
    for (const header of row.headers) {
      const status =
        rowRecon?.final_disposition === "MATCHED_TRANSFORMED"
          ? "ROW_MATCHED_FIELD_NOT_EXPORTED"
          : "MISSING_DOWNSTREAM";
      const reason =
        status === "ROW_MATCHED_FIELD_NOT_EXPORTED"
          ? "The source row reached live evidence, but field-level downstream lineage is not exported by the current model."
          : "The source row did not reach live evidence, so field-level lineage cannot be certified.";
      const item = {
        tenant_key: TENANT_KEY,
        source_release_id: SOURCE_RELEASE_ID,
        source_file: row.source_file,
        source_family: row.source_family,
        source_row_number: row.source_row_number,
        primary_key_value: row.primary_key_value,
        source_row_hash: row.source_row_hash,
        source_field: header,
        original_value_hash: sha256(String(row.row[header] ?? "")),
        row_final_disposition: rowRecon?.final_disposition || "MISSING_DOWNSTREAM",
        field_disposition: status,
        first_broken_transition:
          status === "ROW_MATCHED_FIELD_NOT_EXPORTED"
            ? "field_lineage_export"
            : rowRecon?.first_broken_transition || "parser_or_evidence_extract",
        reason,
      };
      const key = `${item.source_file}:${item.source_field}:${item.field_disposition}:${item.first_broken_transition}`;
      const current = summary.get(key) || {
        source_file: item.source_file,
        source_family: item.source_family,
        source_field: item.source_field,
        field_disposition: item.field_disposition,
        first_broken_transition: item.first_broken_transition,
        field_instance_count: 0,
        reason: item.reason,
      };
      current.field_instance_count += 1;
      summary.set(key, current);
      if (writer) writer.write(item);
    }
  }
  if (writer) await writer.end();
  return [...summary.values()];
}

function buildVarianceRegister(sourceAuthority, fileRecon, rowRecon, fieldSummary, live) {
  const variances = [];
  const add = (layer, object, input, output, type, explained, reason, action) => {
    const variance = Number(input || 0) - Number(output || 0);
    variances.push({
      variance_id: `airline:${String(variances.length + 1).padStart(4, "0")}`,
      layer,
      object,
      input_count: input,
      output_count: output,
      variance_count: variance,
      variance_type: type,
      explained: explained ? "true" : "false",
      reason,
      required_action: action,
    });
  };

  const fileMatched = fileRecon.filter((row) => row.final_disposition === "MATCHED_UNCHANGED").length;
  add(
    "source_registration",
    "source_files",
    sourceAuthority.totals.files,
    fileMatched,
    fileMatched === sourceAuthority.totals.files ? "NONE" : "MISSING_OR_MISMATCHED",
    fileMatched === sourceAuthority.totals.files,
    fileMatched === sourceAuthority.totals.files
      ? "All source file hashes matched live registry."
      : "At least one source file is missing or hash-mismatched in live registry.",
    fileMatched === sourceAuthority.totals.files
      ? "none"
      : "Repair source registration and rerun readback.",
  );

  const rowMatched = rowRecon.summary
    .filter((row) => row.final_disposition === "MATCHED_TRANSFORMED")
    .reduce((sum, row) => sum + Number(row.row_count || 0), 0);
  add(
    "parser_evidence",
    "source_rows",
    sourceAuthority.totals.rows,
    rowMatched,
    rowMatched === sourceAuthority.totals.rows ? "NONE" : "MISSING_DOWNSTREAM",
    rowMatched === sourceAuthority.totals.rows,
    rowMatched === sourceAuthority.totals.rows
      ? "Every source row matched live evidence."
      : "Some source rows could not be matched to live evidence rows.",
    rowMatched === sourceAuthority.totals.rows
      ? "none"
      : "Repair parser/evidence source-row identity export.",
  );

  const fieldRowMatched = fieldSummary
    .filter((row) => row.field_disposition === "ROW_MATCHED_FIELD_NOT_EXPORTED")
    .reduce((sum, row) => sum + Number(row.field_instance_count || 0), 0);
  add(
    "field_lineage",
    "source_fields",
    sourceAuthority.totals.fieldInstances,
    fieldRowMatched,
    fieldRowMatched === sourceAuthority.totals.fieldInstances
      ? "FIELD_EXPORT_MISSING_BUT_ROW_REACHED"
      : "MISSING_DOWNSTREAM",
    false,
    "The current live model does not expose per-field downstream lineage; row-level evidence is not enough for final certification.",
    "Add field-level lineage export or explicit field-disposition table before certification.",
  );

  const reviewAccepted = (live?.reviewSummary || [])
    .filter((row) => row.decision === "accepted")
    .reduce((sum, row) => sum + Number(row.decision_count || 0), 0);
  const reviewDeferred = (live?.reviewSummary || [])
    .filter((row) => row.decision === "deferred")
    .reduce((sum, row) => sum + Number(row.decision_count || 0), 0);
  const reviewRejected = (live?.reviewSummary || [])
    .filter((row) => row.decision === "rejected")
    .reduce((sum, row) => sum + Number(row.decision_count || 0), 0);
  add(
    "review_decision",
    "candidate_decisions",
    264_230,
    reviewAccepted + reviewDeferred + reviewRejected,
    reviewAccepted + reviewDeferred + reviewRejected === 264_230 ? "NONE" : "COUNT_MISMATCH",
    reviewAccepted + reviewDeferred + reviewRejected === 264_230,
    "Governed candidate population must reconcile to exactly one current decision per candidate.",
    reviewAccepted + reviewDeferred + reviewRejected === 264_230
      ? "none"
      : "Read/rebuild review-decision ledger with candidate-hash binding.",
  );

  const activeBaseline = (live?.baselineRows || []).find((row) => row.is_active);
  add(
    "baseline_activation",
    "active_baseline_hash",
    1,
    activeBaseline?.baseline_content_hash === EXPECTED_BASELINE_HASH ? 1 : 0,
    activeBaseline?.baseline_content_hash === EXPECTED_BASELINE_HASH ? "NONE" : "VALUE_MISMATCH",
    activeBaseline?.baseline_content_hash === EXPECTED_BASELINE_HASH,
    activeBaseline?.baseline_content_hash === EXPECTED_BASELINE_HASH
      ? "Active baseline hash matches authority record."
      : "Active baseline hash does not match the authority record or no active baseline was read.",
    activeBaseline?.baseline_content_hash === EXPECTED_BASELINE_HASH
      ? "none"
      : "Stop product proof; reconcile environment/baseline authority.",
  );

  const activeProjectionRows = (live?.projectionVersionRows || []).filter(
    (row) => row.is_active && row.knowledge_baseline_ref === BASELINE_ID,
  );
  const projectionHashMatched = activeProjectionRows.some(
    (row) => row.output_hash === EXPECTED_PROJECTION_HASH,
  );
  add(
    "projection",
    "active_projection_hash",
    1,
    projectionHashMatched ? 1 : 0,
    projectionHashMatched ? "NONE" : "VALUE_MISMATCH",
    projectionHashMatched,
    projectionHashMatched
      ? "An active projection hash matches the authority record."
      : "No active projection hash matched the authority record.",
    projectionHashMatched ? "none" : "Reconcile projection build and authority record.",
  );

  return variances;
}

function sourceDiscrepancyRows() {
  return [
    {
      subject: "authoritative_parser_visible_source_rows",
      value: EXPECTED_SOURCE_ROWS,
      evidence_basis:
        "25 checked-in parser-visible source CSVs plus source-parse/evidence-extract wave logs.",
      disposition: "AUTHORITATIVE",
    },
    {
      subject: "stale_prior_audit_prose_rows",
      value: STALE_PRIOR_AUDIT_ROWS,
      evidence_basis:
        "Earlier prose-only audit statement; not reproducible from checked-in CSVs, package manifest, parser-visible manifest, validation reports, or wave logs.",
      disposition: "STALE_DOCUMENTATION_DRIFT",
    },
    {
      subject: "row_count_difference",
      value: STALE_PRIOR_AUDIT_ROWS - EXPECTED_SOURCE_ROWS,
      evidence_basis:
        "Computed as stale prior prose count minus authoritative parser-visible source-row count.",
      disposition: "EXPLAINED_AS_PRIOR_AUDIT_DRIFT",
    },
  ];
}

function projectionRegistryRows(live) {
  const versionByName = new Map(
    (live?.projectionVersionRows || []).map((row) => [row.projection_name, row]),
  );
  return PROJECTION_TABLES.map((table) => {
    const projectionName = table.split(".")[1];
    const count = (live?.projectionCountRows || []).find((row) => row.projection_table === table);
    const version = versionByName.get(table) || versionByName.get(projectionName);
    return {
      projection_table: table,
      registry_status: version ? "REGISTERED" : "REGISTRY_MISSING_OR_NAME_DRIFT",
      active_status: version?.is_active ? "ACTIVE" : "NOT_ACTIVE_OR_MISSING",
      db_row_count: count?.row_count ?? "",
      publication_row_count: version?.row_count ?? "",
      db_content_hashes: count?.distinct_content_hashes ?? "",
      projection_output_hash: version?.output_hash ?? "",
      build_state: version?.build_state ?? "",
      status:
        count && version
          ? "READABLE_WITH_REGISTRY"
          : count
            ? "READABLE_BUT_NOT_REGISTERED"
            : "NOT_READABLE",
    };
  });
}

function summaryMarkdown({ sourceAuthority, live, varianceRows, dbError }) {
  const activeBaseline = (live?.baselineRows || []).find((row) => row.is_active);
  const failedVariances = varianceRows.filter((row) => row.explained !== "true");
  return `# Airline E2E Live Reconciliation Readback

Generated: ${new Date().toISOString()}  
Tenant: \`${TENANT_KEY}\`  
Source release: \`${SOURCE_RELEASE_ID}\`  
Baseline: \`${BASELINE_ID}\`

## Mode

This verifier is read-only. It recomputes source authority from the checked-in source CSVs and, when run in the governed VNet, reads the live Airline PostgreSQL database inside a read-only transaction.

## Source Authority

- Source files: ${sourceAuthority.totals.files}
- Source rows: ${sourceAuthority.totals.rows}
- Source field instances: ${sourceAuthority.totals.fieldInstances}
- Row-count discrepancy disposition: 99,883 is authoritative; 110,895 is stale prior-audit prose and is not reproducible from checked-in source files or wave logs.

## Live DB Readback

${dbError ? `DB readback failed: \`${dbError}\`` : `DB readback succeeded against \`${live.target}\`.`}

${activeBaseline ? `Active baseline hash: \`${activeBaseline.baseline_content_hash}\`` : "Active baseline: not read"}

## Certification Result

This run ${failedVariances.length === 0 ? "found no unexplained variance in the checked gates" : `found ${failedVariances.length} unresolved variance gate(s)`}.

This is not final product certification unless:

- every source row and field reaches an explicit downstream disposition;
- review decisions reconcile candidate-by-candidate;
- canonical, publication, baseline, projection, Cube, API, and UI identities match;
- enabled Cube measures are all enabled-and-passed;
- no missing data renders as zero/no-risk/no-gap.

## Required Next Action

Fix the earliest broken transition for every row in \`live-unexplained-variance-register.csv\`, rerun this verifier inside the governed VNet, and only then proceed to product consumer proof.
`;
}

function emitProofBundle(outDir) {
  const tar = spawnSync("tar", ["-czf", "-", "-C", outDir, "."], {
    encoding: "buffer",
  });
  if (tar.status !== 0) {
    throw new Error(
      `Failed to create proof bundle: ${tar.stderr?.toString() || tar.stdout?.toString() || "tar failed"}`,
    );
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(tar.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main() {
  const args = parseArgs();
  const phase = phaseLogger(args.verbose);
  fs.mkdirSync(args.outDir, { recursive: true });
  phase("start");

  let live = null;
  let dbError = "";
  let sourceAuthority = null;
  if (fs.existsSync(args.sourceRoot)) {
    sourceAuthority = loadSourceAuthority(args.sourceRoot);
    phase("source authority loaded from local source root");
  } else if (args.skipDb) {
    throw new Error(`Source root not found: ${args.sourceRoot}`);
  } else {
    try {
      live = await readLiveDb();
      phase("live db read complete");
      sourceAuthority = await hydrateSourceAuthorityFromLiveRegistry(
        live.sourceRecords,
        args.outDir,
      );
      phase("source authority hydrated from live registry blobs");
    } catch (error) {
      if (args.requireDb) throw error;
      dbError = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Source root not found and live source hydration failed: ${dbError}`,
      );
    }
  }

  if (args.skipDb) {
    dbError = "skipped_by_cli";
  } else if (!live) {
    try {
      live = await readLiveDb();
      phase("live db read complete");
    } catch (error) {
      dbError = error instanceof Error ? error.message : String(error);
      if (args.requireDb) throw error;
    }
  }

  const fileRecon = reconcileFiles(sourceAuthority, live);
  phase("file reconciliation complete");
  const rowRecon = reconcileRows(sourceAuthority, live, fileRecon);
  phase("row reconciliation complete");
  const fieldReconSummary = await reconcileFields(
    sourceAuthority,
    rowRecon.detail,
    args.outDir,
    args.fieldDetail,
  );
  phase("field reconciliation complete");
  const varianceRows = buildVarianceRegister(
    sourceAuthority,
    fileRecon,
    rowRecon,
    fieldReconSummary,
    live,
  );
  phase("variance register built");

  writeCsv(path.join(args.outDir, "source-file-live-reconciliation.csv"), [
    "tenant_key",
    "source_release_id",
    "source_file",
    "source_family",
    "source_file_hash",
    "row_count",
    "field_count",
    "header_count",
    "primary_key_field",
    "blank_primary_keys",
    "duplicate_primary_keys",
    "control_total_status",
    "live_source_ref",
    "live_source_version_ref",
    "live_source_hash",
    "live_content_hash",
    "live_manifest_ref",
    "final_disposition",
    "first_broken_transition",
    "reason",
  ], fileRecon);
  phase("source file csv written");

  writeCsv(path.join(args.outDir, "source-row-live-reconciliation.csv"), [
    "tenant_key",
    "source_release_id",
    "source_file",
    "source_family",
    "source_row_number",
    "primary_key_field",
    "primary_key_value",
    "source_row_hash",
    "live_source_version_ref",
    "evidence_refs",
    "evidence_count",
    "final_disposition",
    "first_broken_transition",
    "reason",
  ], rowRecon.detail);
  phase("source row csv written");

  writeCsv(path.join(args.outDir, "source-row-live-reconciliation-summary.csv"), [
    "source_file",
    "source_family",
    "final_disposition",
    "first_broken_transition",
    "row_count",
    "reason",
  ], rowRecon.summary);
  phase("source row summary csv written");

  writeCsv(path.join(args.outDir, "source-field-live-reconciliation-summary.csv"), [
    "source_file",
    "source_family",
    "source_field",
    "field_disposition",
    "first_broken_transition",
    "field_instance_count",
    "reason",
  ], fieldReconSummary);
  phase("source field summary csv written");

  writeCsv(path.join(args.outDir, "source-row-count-discrepancy.csv"), [
    "subject",
    "value",
    "evidence_basis",
    "disposition",
  ], sourceDiscrepancyRows());

  writeCsv(path.join(args.outDir, "live-layer-table-readback.csv"), [
    "relation_name",
    "exists",
    "tenant_rows",
    "baseline_rows",
    "status",
  ], live?.relationRows || []);

  writeCsv(path.join(args.outDir, "live-candidate-summary.csv"), [
    "candidate_type",
    "source_version_ref",
    "object_type",
    "review_state",
    "candidate_count",
    "with_evidence_count",
    "avg_confidence",
  ], live?.candidateSummary || []);

  writeCsv(path.join(args.outDir, "live-review-decision-summary.csv"), [
    "candidate_type",
    "source_version_ref",
    "decision",
    "policy_version",
    "validation_run_ref",
    "decision_count",
    "with_evidence_count",
  ], live?.reviewSummary || []);

  writeCsv(path.join(args.outDir, "live-canonical-summary.csv"), [
    "object_kind",
    "object_type",
    "object_count",
    "with_evidence_count",
    "distinct_hashes",
  ], live?.canonicalSummary || []);

  writeCsv(path.join(args.outDir, "live-domain-publication-readback.csv"), [
    "domain_publication_ref",
    "domain_ref",
    "release_id",
    "publication_state",
    "source_content_hash",
    "accepted_entity_count",
    "accepted_fact_count",
    "accepted_relationship_count",
    "critical_gap_count",
    "created_run_ref",
  ], live?.publicationRows || []);

  writeCsv(path.join(args.outDir, "live-baseline-readback.csv"), [
    "knowledge_baseline_ref",
    "release_id",
    "baseline_state",
    "is_active",
    "domain_publication_refs",
    "baseline_content_hash",
    "projection_validation_hash",
    "activated_run_ref",
    "activated_at",
  ], live?.baselineRows || []);

  writeCsv(path.join(args.outDir, "live-projection-version-readback.csv"), [
    "projection_version_ref",
    "knowledge_baseline_ref",
    "projection_name",
    "projection_contract_version",
    "build_state",
    "is_active",
    "input_hash",
    "output_hash",
    "row_count",
    "validation_report_uri",
    "built_run_ref",
    "built_at",
  ], live?.projectionVersionRows || []);

  writeCsv(path.join(args.outDir, "live-projection-table-reconciliation.csv"), [
    "projection_table",
    "registry_status",
    "active_status",
    "db_row_count",
    "publication_row_count",
    "db_content_hashes",
    "projection_output_hash",
    "build_state",
    "status",
  ], projectionRegistryRows(live));

  writeCsv(path.join(args.outDir, "live-cube-parity-readback.csv"), [
    "reconciliation_ref",
    "knowledge_baseline_ref",
    "projection_name",
    "canonical_hash",
    "publication_hash",
    "consumption_hash",
    "cube_hash",
    "api_hash",
    "ui_hash",
    "canonical_count",
    "consumption_count",
    "cube_count",
    "reconciliation_state",
    "failure_detail",
    "checked_run_ref",
    "checked_at",
  ], live?.cubeParityRows || []);

  writeCsv(path.join(args.outDir, "live-lineage-event-summary.csv"), [
    "source_ref",
    "source_version_ref",
    "evidence_ref",
    "candidate_ref",
    "canonical_object_ref",
    "domain_publication_ref",
    "knowledge_baseline_ref",
    "projection_version_ref",
    "consumer_surface",
    "event_count",
  ], live?.lineageEventRows || []);

  writeCsv(path.join(args.outDir, "live-unexplained-variance-register.csv"), [
    "variance_id",
    "layer",
    "object",
    "input_count",
    "output_count",
    "variance_count",
    "variance_type",
    "explained",
    "reason",
    "required_action",
  ], varianceRows);

  const manifest = {
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    source_release_id: SOURCE_RELEASE_ID,
    baseline_id: BASELINE_ID,
    expected_baseline_hash: EXPECTED_BASELINE_HASH,
    expected_projection_hash: EXPECTED_PROJECTION_HASH,
    source_authority: sourceAuthority.totals,
    stale_prior_audit_rows: STALE_PRIOR_AUDIT_ROWS,
    row_count_discrepancy_status: "explained_as_prior_audit_documentation_drift",
    db_readback: dbError
      ? { status: "failed_or_not_run", error: dbError }
      : { status: "read_only_success", target: live.target, identity: live.identity },
    outputs: fs.readdirSync(args.outDir).sort(),
    certification_status: varianceRows.every((row) => row.explained === "true")
      ? "all_checked_gates_passed"
      : "not_certified_variance_remaining",
  };
  fs.writeFileSync(
    path.join(args.outDir, "LIVE_RECONCILIATION_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(args.outDir, "LIVE_RECONCILIATION_SUMMARY.md"),
    summaryMarkdown({ sourceAuthority, live, varianceRows, dbError }),
  );

  console.log(
    JSON.stringify(
      {
        ok: !dbError || !args.requireDb,
        outDir: args.outDir,
        sourceAuthority: sourceAuthority.totals,
        dbStatus: dbError ? "failed_or_not_run" : "read_only_success",
        unresolvedVarianceGates: varianceRows.filter((row) => row.explained !== "true").length,
      },
      null,
      2,
    ),
  );

  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});

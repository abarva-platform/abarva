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

const CORE_CONSUMPTION_PROJECTION_TABLES = [
  "consumption.enterprise_brief_v1",
  "consumption.enterprise_identity_v1",
  "consumption.domain_summary_v1",
  "consumption.application_inventory_v1",
  "consumption.technology_estate_v1",
  "consumption.data_product_inventory_v1",
  "consumption.vendor_contract_inventory_v1",
  "consumption.metric_observation_v1",
  "consumption.evidence_gap_v1",
  "consumption.search_document_v1",
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
    proofUploadAccount:
      process.env.AIRLINE_E2E_PROOF_UPLOAD_ACCOUNT ||
      process.env.ABARVA_AIRDN_STORAGE_ACCOUNT ||
      "",
    proofUploadContainer: process.env.AIRLINE_E2E_PROOF_UPLOAD_CONTAINER || "",
    proofUploadPrefix:
      process.env.AIRLINE_E2E_PROOF_UPLOAD_PREFIX ||
      `airline-demo-new/live-reconciliation-readback/${new Date().toISOString().replace(/[:.]/g, "-")}`,
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
    else if (arg === "--proof-upload-account") args.proofUploadAccount = next();
    else if (arg === "--proof-upload-container") args.proofUploadContainer = next();
    else if (arg === "--proof-upload-prefix") args.proofUploadPrefix = next();
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
  --emit-proof-bundle      Emit __SEMANTIC2_PROOF_TGZ_* pointer markers for ACA wrapper.
  --proof-upload-account <name>
                           Storage account for durable full proof upload.
  --proof-upload-container <name>
                           Blob container for durable full proof upload.
  --proof-upload-prefix <path>
                           Blob prefix for durable full proof upload.
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
    blobName,
    record?.landed_uri,
    record?.source_uri,
    record?.source_name,
    record?.source_ref,
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
      .filter((record) => record.source_visibility === "client_visible")
      .filter((record) => record.source_basis !== "restricted_evaluator")
      .filter((record) => record.parser_contract_ref)
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
        source_visibility: record.source_visibility || "",
        source_basis: record.source_basis || "",
        parser_contract_ref: record.parser_contract_ref || "",
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
        source_visibility: record.source_visibility || "",
        source_basis: record.source_basis || "",
        parser_contract_ref: record.parser_contract_ref || "",
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
      source_visibility: record.source_visibility || "",
      source_basis: record.source_basis || "",
      parser_contract_ref: record.parser_contract_ref || "",
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
    "source_visibility",
    "source_basis",
    "parser_contract_ref",
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

function isPermissionDenied(error) {
  return error?.code === "42501" || /permission denied/i.test(String(error?.message ?? error));
}

const inaccessibleRelations = new Map();

function recordInaccessibleRelation(relationName, error) {
  inaccessibleRelations.set(relationName, {
    relation_name: relationName,
    exists: "",
    tenant_rows: "",
    baseline_rows: "",
    status: "INACCESSIBLE_RELATION",
    error: error.message,
  });
}

async function withRelationProbe(client, probe) {
  await client.query("SAVEPOINT readback_relation_probe");
  try {
    const result = await probe();
    await client.query("RELEASE SAVEPOINT readback_relation_probe");
    return result;
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT readback_relation_probe").catch(() => undefined);
    await client.query("RELEASE SAVEPOINT readback_relation_probe").catch(() => undefined);
    throw error;
  }
}

async function relationExists(client, relationName) {
  try {
    const rows = await withRelationProbe(client, () =>
      query(client, "SELECT to_regclass($1) IS NOT NULL AS exists", [relationName]),
    );
    return rows[0]?.exists === true;
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;
    recordInaccessibleRelation(relationName, error);
    return false;
  }
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
    const inaccessible = inaccessibleRelations.get(relationName);
    if (inaccessible) return inaccessible;
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
  let tenantRows;
  try {
    tenantRows = await withRelationProbe(client, () =>
      query(
        client,
        `SELECT count(*)::bigint AS count FROM ${rel} ${tenantWhere}`,
        hasColumn(columns, "tenant_key") ? [TENANT_KEY] : [],
      ),
    );
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;
    recordInaccessibleRelation(relationName, error);
    return inaccessibleRelations.get(relationName);
  }
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
      inaccessibleRelationRows: [],
      sourceRecords: [],
      evidenceRows: [],
      factRows: [],
      candidateEvidenceRows: [],
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
               s.source_visibility,
               s.source_basis,
               s.parser_contract_ref,
               s.metadata,
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
               evidence_text,
               evidence_hash,
               authority_state::text AS authority_state,
               availability_state::text AS availability_state,
               metadata
          FROM evidence.evidence_item
         WHERE tenant_key=$1
      `, [TENANT_KEY]);
    }

    if (await relationExists(client, "knowledge.fact_assertion")) {
      live.factRows = await query(client, `
        SELECT fact_ref,
               entity_ref,
               fact_type,
               fact_value,
               evidence_refs,
               authority_state::text AS authority_state,
               availability_state::text AS availability_state
          FROM knowledge.fact_assertion
         WHERE tenant_key=$1
      `, [TENANT_KEY]);
    }

    if (
      (await relationExists(client, "working.entity_candidate")) &&
      (await relationExists(client, "working.fact_candidate")) &&
      (await relationExists(client, "working.relationship_candidate")) &&
      (await relationExists(client, "governance.review_decision"))
    ) {
      live.candidateEvidenceRows = await query(client, `
        WITH candidate_inventory AS (
          SELECT tenant_key, 'entity_candidate' AS candidate_type, candidate_ref, evidence_refs
            FROM working.entity_candidate WHERE tenant_key=$1
          UNION ALL
          SELECT tenant_key, 'fact_candidate' AS candidate_type, candidate_ref, evidence_refs
            FROM working.fact_candidate WHERE tenant_key=$1
          UNION ALL
          SELECT tenant_key, 'relationship_candidate' AS candidate_type, candidate_ref, evidence_refs
            FROM working.relationship_candidate WHERE tenant_key=$1
        ),
        expanded AS (
          SELECT c.candidate_type,
                 c.candidate_ref,
                 unnest(coalesce(c.evidence_refs, ARRAY[]::text[])) AS evidence_ref
            FROM candidate_inventory c
        )
        SELECT e.evidence_ref,
               count(*) FILTER (WHERE d.decision='accepted')::bigint AS accepted_candidate_count,
               count(*) FILTER (WHERE d.decision='deferred')::bigint AS deferred_candidate_count,
               count(*) FILTER (WHERE d.decision='rejected')::bigint AS rejected_candidate_count,
               count(*) FILTER (WHERE d.decision IS NULL)::bigint AS undecided_candidate_count
          FROM expanded e
          LEFT JOIN governance.review_decision d
            ON d.tenant_key=$1
           AND d.candidate_type=e.candidate_type
           AND d.candidate_ref=e.candidate_ref
         GROUP BY e.evidence_ref
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

    if (await relationExists(client, "knowledge.relationship_assertion")) {
      live.relationshipRows = await query(client, `
        SELECT relationship_ref,
               relationship_type_ref,
               current_target_state::text AS current_target_state,
               authority_state::text AS authority_state,
               evidence_refs,
               relationship_payload
          FROM knowledge.relationship_assertion
         WHERE tenant_key=$1
           AND authority_state='accepted'
      `, [TENANT_KEY]);
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
      const contentHashCount = hasColumn(columns, "content_hash")
        ? "count(distinct content_hash)::bigint"
        : "NULL::bigint";
      const availableRows = hasColumn(columns, "availability_state")
        ? "count(*) FILTER (WHERE availability_state::text='available')::bigint"
        : "NULL::bigint";
      const unavailableRows = hasColumn(columns, "availability_state")
        ? "count(*) FILTER (WHERE availability_state::text IN ('not_loaded','not_measured','withheld','conflicting','stale','candidate'))::bigint"
        : "NULL::bigint";
      const rows = await query(client, `
        SELECT $${params.length + 1} AS projection_table,
               count(*)::bigint AS row_count,
               ${contentHashCount} AS distinct_content_hashes,
               ${availableRows} AS available_rows,
               ${unavailableRows} AS unavailable_or_candidate_rows
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

    live.inaccessibleRelationRows = Array.from(inaccessibleRelations.values());
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
  const sourceRef = sourceRecord?.source_ref || sourceRecord?.live_source_ref || "";
  const sourceVersion =
    sourceRecord?.source_version_ref || sourceRecord?.live_source_version_ref || "";
  for (const prefix of [file, path.basename(file), sourceRef, sourceVersion]) {
    if (!prefix) continue;
    keys.add(`${prefix}:${rowNumber}`);
    keys.add(`${prefix}#${rowNumber}`);
    keys.add(`${prefix}:row:${rowNumber}`);
    keys.add(`${prefix}#row:${rowNumber}`);
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

function canonicalFactFieldLookup(factRows) {
  const map = new Map();
  for (const fact of factRows || []) {
    if (fact.authority_state !== "accepted") continue;
    const rawRow = fact.fact_value?.raw_row;
    if (!rawRow || typeof rawRow !== "object") continue;
    for (const evidenceRef of fact.evidence_refs || []) {
      if (!map.has(evidenceRef)) map.set(evidenceRef, []);
      map.get(evidenceRef).push(rawRow);
    }
  }
  return map;
}

function canonicalRelationshipFieldLookup(relationshipRows) {
  const map = new Map();
  for (const relationship of relationshipRows || []) {
    if (relationship.authority_state !== "accepted") continue;
    for (const evidenceRef of relationship.evidence_refs || []) {
      if (!map.has(evidenceRef)) map.set(evidenceRef, []);
      map.get(evidenceRef).push(relationship);
    }
  }
  return map;
}

function candidateDecisionLookup(candidateEvidenceRows) {
  const map = new Map();
  for (const row of candidateEvidenceRows || []) {
    map.set(row.evidence_ref, {
      accepted: Number(row.accepted_candidate_count || 0),
      deferred: Number(row.deferred_candidate_count || 0),
      rejected: Number(row.rejected_candidate_count || 0),
      undecided: Number(row.undecided_candidate_count || 0),
    });
  }
  return map;
}

function evidenceByRefLookup(evidenceRows) {
  const map = new Map();
  for (const evidence of evidenceRows || []) {
    if (evidence.evidence_ref) map.set(evidence.evidence_ref, evidence);
  }
  return map;
}

function fieldPreservedInFacts({ evidenceRefs, factLookup, header, expectedHash }) {
  for (const evidenceRef of evidenceRefs || []) {
    const rawRows = factLookup.get(evidenceRef) || [];
    for (const rawRow of rawRows) {
      if (!Object.prototype.hasOwnProperty.call(rawRow, header)) continue;
      if (sha256(String(rawRow[header] ?? "")) === expectedHash) return true;
    }
  }
  return false;
}

function parseJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function fieldPreservedInEvidence({ evidenceRefs, evidenceRefLookup, header, expectedHash }) {
  for (const evidenceRef of evidenceRefs || []) {
    const evidence = evidenceRefLookup.get(evidenceRef);
    if (!evidence) continue;
    const sourceRowPayload = parseJsonObject(evidence.evidence_text);
    if (sourceRowPayload && Object.prototype.hasOwnProperty.call(sourceRowPayload, header)) {
      if (sha256(String(sourceRowPayload[header] ?? "")) === expectedHash) return true;
    }
  }
  return false;
}

function fieldPreservedInRelationships({ evidenceRefs, relationshipLookup, header, expectedHash }) {
  for (const evidenceRef of evidenceRefs || []) {
    const relationships = relationshipLookup.get(evidenceRef) || [];
    for (const relationship of relationships) {
      const payload = relationship.relationship_payload || {};
      const evidenceTextByRef = payload.source_evidence_text_by_ref || {};
      const sourceRowPayload = parseJsonObject(evidenceTextByRef[evidenceRef]);
      if (sourceRowPayload && Object.prototype.hasOwnProperty.call(sourceRowPayload, header)) {
        if (sha256(String(sourceRowPayload[header] ?? "")) === expectedHash) return true;
      }
    }
  }
  return false;
}

function decisionDispositionForEvidence(evidenceRefs, decisionLookup) {
  const totals = { accepted: 0, deferred: 0, rejected: 0, undecided: 0 };
  for (const evidenceRef of evidenceRefs || []) {
    const row = decisionLookup.get(evidenceRef);
    if (!row) continue;
    totals.accepted += row.accepted;
    totals.deferred += row.deferred;
    totals.rejected += row.rejected;
    totals.undecided += row.undecided;
  }
  if (totals.accepted > 0) return "accepted";
  if (totals.deferred > 0) return "deferred";
  if (totals.rejected > 0) return "rejected";
  if (totals.undecided > 0) return "undecided";
  return "unknown";
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

async function reconcileFields(sourceAuthority, rowReconDetail, outDir, emitDetail, live = null) {
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
  const factLookup = canonicalFactFieldLookup(live?.factRows || []);
  const relationshipLookup = canonicalRelationshipFieldLookup(live?.relationshipRows || []);
  const decisionLookup = candidateDecisionLookup(live?.candidateEvidenceRows || []);
  const evidenceRefLookup = evidenceByRefLookup(live?.evidenceRows || []);
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
      const originalValueHash = sha256(String(row.row[header] ?? ""));
      const evidenceRefs = String(rowRecon?.evidence_refs || "").split(";").filter(Boolean);
      let status = "MISSING_DOWNSTREAM";
      let firstBroken = rowRecon?.first_broken_transition || "parser_or_evidence_extract";
      let reason = "The source row did not reach live evidence, so field-level lineage cannot be certified.";
      if (String(row.row[header] ?? "") === "") {
        status = "EMPTY_OR_NULL";
        firstBroken = "";
        reason = "The source field is empty/null in the input row and is explicitly accounted as non-semantic input absence.";
      }
      if (rowRecon?.final_disposition === "MATCHED_TRANSFORMED" && status !== "EMPTY_OR_NULL") {
        if (fieldPreservedInFacts({ evidenceRefs, factLookup, header, expectedHash: originalValueHash })) {
          status = "FIELD_PRESERVED_IN_CANONICAL_FACT";
          firstBroken = "";
          reason = "The source field value is preserved in an accepted canonical fact raw_row payload.";
        } else if (fieldPreservedInRelationships({ evidenceRefs, relationshipLookup, header, expectedHash: originalValueHash })) {
          status = "FIELD_PRESERVED_IN_CANONICAL_RELATIONSHIP";
          firstBroken = "";
          reason = "The source field value is preserved in an accepted canonical relationship payload.";
        } else if (fieldPreservedInEvidence({ evidenceRefs, evidenceRefLookup, header, expectedHash: originalValueHash })) {
          status = "PRESERVED_AS_EVIDENCE";
          firstBroken = "";
          reason =
            "The source field value is preserved in the live evidence record; it is explicitly accounted without forcing canonical promotion.";
        } else {
          const decision = decisionDispositionForEvidence(evidenceRefs, decisionLookup);
          if (decision === "deferred") {
            status = "FIELD_DEFERRED_BY_REVIEW";
            firstBroken = "review_decision";
            reason = "The source row reached evidence, but its candidate path is explicitly deferred by review.";
          } else if (decision === "rejected") {
            status = "FIELD_REJECTED_BY_REVIEW";
            firstBroken = "review_decision";
            reason = "The source row reached evidence, but its candidate path is explicitly rejected by review.";
          } else {
            status = "ROW_MATCHED_FIELD_NOT_EXPORTED";
            firstBroken = "field_lineage_export";
            reason = "The source row reached live evidence, but this field was not found in accepted canonical fact payloads or explicit review disposition.";
          }
        }
      }
      const item = {
        tenant_key: TENANT_KEY,
        source_release_id: SOURCE_RELEASE_ID,
        source_file: row.source_file,
        source_family: row.source_family,
        source_row_number: row.source_row_number,
        primary_key_value: row.primary_key_value,
        source_row_hash: row.source_row_hash,
        source_field: header,
        original_value_hash: originalValueHash,
        row_final_disposition: rowRecon?.final_disposition || "MISSING_DOWNSTREAM",
        field_disposition: status,
        first_broken_transition: firstBroken,
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

  const fieldAccounted = fieldSummary
    .filter((row) =>
      [
        "FIELD_PRESERVED_IN_CANONICAL_FACT",
        "FIELD_PRESERVED_IN_CANONICAL_RELATIONSHIP",
        "PRESERVED_AS_EVIDENCE",
        "NORMALIZED_TO_CANONICAL_FIELD",
        "USED_AS_BUSINESS_KEY",
        "USED_AS_RELATIONSHIP_KEY",
        "USED_IN_DERIVATION",
        "FIELD_DEFERRED_BY_REVIEW",
        "FIELD_REJECTED_BY_REVIEW",
        "EMPTY_OR_NULL",
        "TECHNICAL_OR_NON_SEMANTIC",
        "INTENTIONALLY_IGNORED_WITH_APPROVED_REASON",
      ].includes(row.field_disposition),
    )
    .reduce((sum, row) => sum + Number(row.field_instance_count || 0), 0);
  const allFieldsAccounted = fieldAccounted === sourceAuthority.totals.fieldInstances;
  add(
    "field_lineage",
    "source_fields",
    sourceAuthority.totals.fieldInstances,
    fieldAccounted,
    allFieldsAccounted
      ? "NONE"
      : "MISSING_DOWNSTREAM",
    allFieldsAccounted,
    allFieldsAccounted
      ? "Every source field is either preserved in an accepted canonical fact/relationship or explicitly accounted for by review disposition."
      : "Some source fields are neither preserved in accepted canonical facts/relationships nor explicitly accounted for by review disposition.",
    allFieldsAccounted
      ? "none"
      : "Repair field-level canonical preservation or explicit field-disposition export before certification.",
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

  const projectionAuthority = projectionAuthorityStatus(live);
  const projectionHashMatched = projectionAuthority.passed;
  add(
    "projection",
    "active_projection_hash",
    projectionAuthority.expectedCount,
    projectionAuthority.passedCount,
    projectionHashMatched ? "NONE" : "VALUE_MISMATCH",
    projectionHashMatched,
    projectionHashMatched
      ? "Every active core consumption projection authority row matches live table counts and deterministic output hashes."
      : "One or more active core consumption projection authority rows do not match live table counts and deterministic output hashes.",
    projectionHashMatched
      ? "none"
      : "Rebuild projections from the active baseline or repair projection authority registration.",
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

function coreProjectionCountsFromLive(live) {
  const countByTable = new Map(
    (live?.projectionCountRows || []).map((row) => [
      String(row.projection_table || ""),
      Number(row.row_count || 0),
    ]),
  );
  return {
    brief: countByTable.get("consumption.enterprise_brief_v1") || 0,
    identity: countByTable.get("consumption.enterprise_identity_v1") || 0,
    domains: countByTable.get("consumption.domain_summary_v1") || 0,
    applications: countByTable.get("consumption.application_inventory_v1") || 0,
    technology: countByTable.get("consumption.technology_estate_v1") || 0,
    data_products: countByTable.get("consumption.data_product_inventory_v1") || 0,
    vendors: countByTable.get("consumption.vendor_contract_inventory_v1") || 0,
    metrics: countByTable.get("consumption.metric_observation_v1") || 0,
    gaps: countByTable.get("consumption.evidence_gap_v1") || 0,
    search: countByTable.get("consumption.search_document_v1") || 0,
    nodes: countByTable.get("consumption.relationship_node_v1") || 0,
    edges: countByTable.get("consumption.relationship_edge_v1") || 0,
    edge_evidence: countByTable.get("consumption.relationship_evidence_v1") || 0,
  };
}

function projectionAuthorityStatus(live) {
  const countByTable = new Map(
    (live?.projectionCountRows || []).map((row) => [
      String(row.projection_table || ""),
      Number(row.row_count || 0),
    ]),
  );
  const activeByName = new Map(
    (live?.projectionVersionRows || [])
      .filter((row) => row.is_active && row.knowledge_baseline_ref === BASELINE_ID)
      .map((row) => [String(row.projection_name || ""), row]),
  );
  const projectionRows = CORE_CONSUMPTION_PROJECTION_TABLES.map((projectionName) => {
    const rowCount = countByTable.get(projectionName) || 0;
    const expectedOutputHash = sha256(
      stableJson({ projectionName, rowCount, baseline: BASELINE_ID }),
    );
    const authority = activeByName.get(projectionName) || null;
    const passed =
      Boolean(authority) &&
      authority.build_state === "passed" &&
      Number(authority.row_count || 0) === rowCount &&
      authority.output_hash === expectedOutputHash;
    return {
      projection_name: projectionName,
      db_row_count: rowCount,
      authority_row_count: authority?.row_count ?? null,
      expected_output_hash: expectedOutputHash,
      authority_output_hash: authority?.output_hash ?? null,
      build_state: authority?.build_state ?? null,
      is_active: authority?.is_active ?? false,
      passed,
    };
  });
  const coreProjectionCounts = coreProjectionCountsFromLive(live);
  const expectedCoreProjectionHash = sha256(stableJson(coreProjectionCounts));
  const expectedCoreProjectionRows = Object.values(coreProjectionCounts).reduce(
    (sum, count) => sum + Number(count || 0),
    0,
  );
  const activeCoreProjectionRow = activeByName.get("knowledge-consumption-core-v1") || null;
  const corePassed =
    !activeCoreProjectionRow ||
    (activeCoreProjectionRow.build_state === "passed" &&
      activeCoreProjectionRow.output_hash === expectedCoreProjectionHash &&
      Number(activeCoreProjectionRow.row_count || 0) === expectedCoreProjectionRows);
  return {
    projectionRows,
    passedCount: projectionRows.filter((row) => row.passed).length,
    expectedCount: projectionRows.length,
    allPerProjectionRowsPassed: projectionRows.every((row) => row.passed),
    coreProjectionCounts,
    expectedCoreProjectionHash,
    expectedCoreProjectionRows,
    activeCoreProjectionRow,
    corePassed,
    passed: projectionRows.every((row) => row.passed) && corePassed,
  };
}

function varianceLayerCode(layer) {
  const codes = {
    source_registration: "L1",
    parser_evidence: "L2",
    field_lineage: "L2-L6",
    review_decision: "L5",
    baseline_activation: "L8",
    projection: "L9",
  };
  return codes[layer] || "unknown";
}

function varianceClassification(row) {
  if (row.layer === "source_registration") return "LINEAGE_BREAK";
  if (row.layer === "parser_evidence") return "LINEAGE_BREAK";
  if (row.layer === "field_lineage") return "ACCOUNTING_CLASSIFICATION";
  if (row.layer === "review_decision") return "ACCOUNTING_CLASSIFICATION";
  if (row.layer === "baseline_activation") return "PROJECTION_DEFECT";
  if (row.layer === "projection") return "PROJECTION_DEFECT";
  return "GATE_DEFINITION_DEFECT";
}

function varianceAffectedProjection(row) {
  if (row.layer === "projection") return "publication.projection_version";
  if (row.layer === "baseline_activation") return "publication.knowledge_baseline";
  if (row.layer === "field_lineage") return "knowledge.fact_assertion";
  if (row.layer === "parser_evidence") return "evidence.evidence_item";
  if (row.layer === "source_registration") return "source_registry.source_version";
  if (row.layer === "review_decision") return "governance.review_decision";
  return "";
}

function varianceValidationQuery(row) {
  const queries = {
    source_registration:
      "select count(*) from source_registry.source_version where tenant_key = current_setting('app.tenant_key');",
    parser_evidence:
      "select count(distinct source_row_ref) from evidence.evidence_item where tenant_key = current_setting('app.tenant_key');",
    field_lineage:
      "compare source-field-live-reconciliation-summary.csv dispositions with source_authority.fieldInstances;",
    review_decision:
      "select decision, count(*) from governance.review_decision where tenant_key = current_setting('app.tenant_key') group by decision;",
    baseline_activation:
      "select knowledge_baseline_ref, baseline_content_hash, is_active from publication.knowledge_baseline where tenant_key = current_setting('app.tenant_key');",
    projection:
      "select projection_name, output_hash, is_active from publication.projection_version where tenant_key = current_setting('app.tenant_key');",
  };
  return queries[row.layer] || "see live-unexplained-variance-register.csv";
}

function sampleSourceRowIds(rows, limit = 8) {
  return rows.slice(0, limit).map((row) =>
    [
      row.source_file,
      `row=${row.source_row_number}`,
      row.primary_key_field && row.primary_key_value
        ? `${row.primary_key_field}=${row.primary_key_value}`
        : "",
    ]
      .filter(Boolean)
      .join("|"),
  );
}

function summarizeMissingSourceRows(rowReconDetail, limit = 8) {
  const missing = (rowReconDetail || []).filter(
    (row) => row.final_disposition !== "MATCHED_TRANSFORMED",
  );
  const byFile = new Map();
  for (const row of missing) {
    const current = byFile.get(row.source_file) || {
      source_file: row.source_file,
      source_family: row.source_family,
      missing_rows: 0,
      first_row_number: row.source_row_number,
      first_primary_key: row.primary_key_value,
      reason: row.reason,
    };
    current.missing_rows += 1;
    byFile.set(row.source_file, current);
  }
  return {
    total_missing_rows: missing.length,
    top_files: [...byFile.values()]
      .sort((a, b) => b.missing_rows - a.missing_rows || a.source_file.localeCompare(b.source_file))
      .slice(0, limit),
    sample_source_ids: sampleSourceRowIds(missing, limit),
  };
}

function summarizeMissingEvidenceIdentity(rowReconDetail, fileReconRows, live, limit = 8) {
  const missing = (rowReconDetail || []).filter(
    (row) => row.final_disposition !== "MATCHED_TRANSFORMED",
  );
  const fileReconByFile = new Map((fileReconRows || []).map((row) => [row.source_file, row]));
  const evidenceBySourceVersion = new Map();
  for (const row of live?.evidenceRows || []) {
    const key = row.source_version_ref || "";
    if (!key) continue;
    if (!evidenceBySourceVersion.has(key)) evidenceBySourceVersion.set(key, []);
    evidenceBySourceVersion.get(key).push(row);
  }
  const byFile = new Map();
  for (const row of missing) {
    const fileRecon = fileReconByFile.get(row.source_file);
    const sourceVersionRef = fileRecon?.live_source_version_ref || "";
    const evidenceRows = evidenceBySourceVersion.get(sourceVersionRef) || [];
    const current = byFile.get(row.source_file) || {
      source_file: row.source_file,
      source_family: row.source_family,
      missing_rows: 0,
      live_source_ref: fileRecon?.live_source_ref || "",
      live_source_version_ref: sourceVersionRef,
      live_evidence_rows_for_source_version: evidenceRows.length,
      first_missing_row_number: row.source_row_number,
      first_missing_primary_key: row.primary_key_value,
      evidence_identity_samples: evidenceRows.slice(0, 5).map((evidence) => ({
        evidence_ref: evidence.evidence_ref,
        source_row_ref: evidence.source_row_ref,
        source_object_ref: evidence.source_object_ref,
        evidence_hash: evidence.evidence_hash,
        metadata_primary_key_value:
          evidence.metadata?.primary_key_value || evidence.metadata?.primaryKeyValue || "",
        metadata_source_row_hash:
          evidence.metadata?.source_row_hash || evidence.metadata?.sourceRowHash || "",
      })),
    };
    current.missing_rows += 1;
    byFile.set(row.source_file, current);
  }
  return {
    top_missing_file_identities: [...byFile.values()]
      .sort((a, b) => b.missing_rows - a.missing_rows || a.source_file.localeCompare(b.source_file))
      .slice(0, limit),
  };
}

function summarizeUnaccountedFields(fieldSummary, limit = 8) {
  const unaccounted = (fieldSummary || []).filter(
    (row) =>
      ![
        "FIELD_PRESERVED_IN_CANONICAL_FACT",
        "FIELD_PRESERVED_IN_CANONICAL_RELATIONSHIP",
        "PRESERVED_AS_EVIDENCE",
        "NORMALIZED_TO_CANONICAL_FIELD",
        "USED_AS_BUSINESS_KEY",
        "USED_AS_RELATIONSHIP_KEY",
        "USED_IN_DERIVATION",
        "FIELD_DEFERRED_BY_REVIEW",
        "FIELD_REJECTED_BY_REVIEW",
        "EMPTY_OR_NULL",
        "TECHNICAL_OR_NON_SEMANTIC",
        "INTENTIONALLY_IGNORED_WITH_APPROVED_REASON",
      ].includes(row.field_disposition),
  );
  return {
    total_unaccounted_fields: unaccounted.reduce(
      (sum, row) => sum + Number(row.field_instance_count || 0),
      0,
    ),
    top_fields: unaccounted
      .sort(
        (a, b) =>
          Number(b.field_instance_count || 0) - Number(a.field_instance_count || 0) ||
          `${a.source_file}:${a.source_field}`.localeCompare(`${b.source_file}:${b.source_field}`),
      )
      .slice(0, limit)
      .map((row) => ({
        source_file: row.source_file,
        source_family: row.source_family,
        source_field: row.source_field,
        field_disposition: row.field_disposition,
        first_broken_transition: row.first_broken_transition,
        field_instance_count: Number(row.field_instance_count || 0),
        reason: row.reason,
      })),
  };
}

function summarizeProjectionHashes(live, limit = 8) {
  const projectionAuthority = projectionAuthorityStatus(live);
  return {
    expected_core_projection_hash: projectionAuthority.expectedCoreProjectionHash,
    expected_core_projection_row_count: projectionAuthority.expectedCoreProjectionRows,
    active_core_projection_row: projectionAuthority.activeCoreProjectionRow || null,
    per_projection_authority: projectionAuthority.projectionRows
      .filter((row) => !row.passed)
      .slice(0, limit),
    active_projection_rows: (live?.projectionVersionRows || [])
      .filter((row) => row.is_active)
      .slice(0, limit)
      .map((row) => ({
        projection_name: row.projection_name,
        knowledge_baseline_ref: row.knowledge_baseline_ref,
        output_hash: row.output_hash,
        is_active: row.is_active,
      })),
  };
}

function compactVarianceRegister(varianceRows, proofPointer = null, diagnostics = {}) {
  const proofBundleUri =
    proofPointer?.full_proof_bundle?.upload?.url ||
    (proofPointer?.full_proof_bundle?.upload
      ? `${proofPointer.full_proof_bundle.upload.container}/${proofPointer.full_proof_bundle.upload.blob}`
      : "");
  return varianceRows
    .filter((row) => row.explained !== "true")
    .map((row, index) => ({
      gate_id: row.variance_id,
      gate_name: `${row.layer}.${row.object}`,
      source_family:
        row.layer === "source_registration" ||
        row.layer === "parser_evidence" ||
        row.layer === "field_lineage"
          ? "all_parser_visible_source_families"
          : "governed_candidate_and_publication_layers",
      expected_count: Number(row.input_count || 0),
      actual_count: Number(row.output_count || 0),
      variance_count: Number(row.variance_count || 0),
      first_broken_layer: varianceLayerCode(row.layer),
      upstream_object: row.object,
      downstream_object: varianceAffectedProjection(row),
      affected_projection: varianceAffectedProjection(row),
      affected_cube_measure_or_dimension:
        row.layer === "projection" ? "all enabled cube projections dependent on active projection hash" : "",
      sample_source_ids:
        row.layer === "parser_evidence"
          ? diagnostics.missingSourceRows?.sample_source_ids || []
          : row.layer === "field_lineage"
            ? diagnostics.unaccountedFields?.top_fields || []
            : row.layer === "projection"
              ? diagnostics.projectionHashes?.active_projection_rows || []
              : "see_proof_bundle_detail_csv",
      sample_downstream_ids:
        row.layer === "projection"
          ? diagnostics.projectionHashes?.active_projection_rows || []
          : "see_proof_bundle_detail_csv",
      classification: varianceClassification(row),
      root_cause: row.reason,
      proposed_repair: row.required_action,
      rerun_scope:
        index === 0
          ? "repair earliest failing layer first, then rerun live readback"
          : "rerun after earlier variance gates are closed",
      validation_query: varianceValidationQuery(row),
      proof_bundle_uri: proofBundleUri || "pending_proof_bundle_upload",
      diagnostic_summary:
        row.layer === "parser_evidence"
          ? {
              ...(diagnostics.missingSourceRows || {}),
              ...(diagnostics.missingEvidenceIdentity || {}),
            }
          : row.layer === "field_lineage"
            ? diagnostics.unaccountedFields || {}
            : row.layer === "projection"
              ? diagnostics.projectionHashes || {}
              : {},
    }));
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

function createProofBundleArchive(outDir) {
  const bundlePath = path.join(
    os.tmpdir(),
    `airline-e2e-live-reconciliation-readback-${Date.now()}.tgz`,
  );
  const tar = spawnSync("tar", ["-czf", bundlePath, "-C", outDir, "."], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  if (tar.status !== 0) {
    throw new Error(
      `Failed to create proof bundle: ${tar.stderr || "tar failed"}`,
    );
  }
  const bytes = fs.readFileSync(bundlePath);
  return {
    path: bundlePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function safeBlobPart(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^A-Za-z0-9._/-]+/g, "-");
}

async function uploadProofBundle(bundle, args) {
  if (!args.proofUploadAccount || !args.proofUploadContainer) return null;
  const service = await blobServiceClient(args.proofUploadAccount);
  const prefix = safeBlobPart(args.proofUploadPrefix);
  const blobName = `${prefix ? `${prefix}/` : ""}airline-e2e-live-reconciliation-readback.tgz`;
  const blob = service
    .getContainerClient(args.proofUploadContainer)
    .getBlockBlobClient(blobName);
  await blob.uploadFile(bundle.path, {
    blobHTTPHeaders: { blobContentType: "application/gzip" },
    metadata: {
      tenant: TENANT_TOKEN.toLowerCase().replace(/_/g, "-"),
      sourceRelease: SOURCE_RELEASE_ID,
      baselineHash: EXPECTED_BASELINE_HASH,
      proofSha256: bundle.sha256,
    },
  });
  return {
    account: args.proofUploadAccount,
    container: args.proofUploadContainer,
    blob: blobName,
    url: blob.url,
  };
}

function emitSmallPointerBundle(pointer) {
  const pointerDir = fs.mkdtempSync(path.join(os.tmpdir(), "airline-recon-proof-pointer-"));
  fs.writeFileSync(
    path.join(pointerDir, "PROOF_BUNDLE_POINTER.json"),
    `${JSON.stringify(pointer, null, 2)}\n`,
  );
  const tar = spawnSync("tar", ["-czf", "-", "-C", pointerDir, "."], {
    encoding: "buffer",
    maxBuffer: 1024 * 1024,
  });
  if (tar.status !== 0) {
    throw new Error(`Failed to create proof pointer bundle: ${tar.stderr?.toString() || "tar failed"}`);
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(tar.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function emitProofBundle(outDir, args) {
  const bundle = createProofBundleArchive(outDir);
  const upload = await uploadProofBundle(bundle, args);
  const pointer = {
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    source_release_id: SOURCE_RELEASE_ID,
    baseline_id: BASELINE_ID,
    full_proof_bundle: {
      local_path: bundle.path,
      bytes: bundle.bytes,
      sha256: bundle.sha256,
      uploaded: Boolean(upload),
      upload,
    },
    log_contract:
      "ACA logs contain this small pointer bundle only. The full field-level proof is stored in Blob when upload is configured.",
  };
  fs.writeFileSync(
    path.join(outDir, "PROOF_BUNDLE_POINTER.json"),
    `${JSON.stringify(pointer, null, 2)}\n`,
  );
  emitSmallPointerBundle(pointer);
  console.log(
    JSON.stringify(
      {
        proofBundle: {
          bytes: bundle.bytes,
          sha256: bundle.sha256,
          uploaded: Boolean(upload),
          blob: upload ? `${upload.container}/${upload.blob}` : null,
        },
      },
      null,
      2,
    ),
  );
  return pointer;
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
    live,
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

  writeCsv(path.join(args.outDir, "live-inaccessible-relation-readback.csv"), [
    "relation_name",
    "exists",
    "tenant_rows",
    "baseline_rows",
    "status",
    "error",
  ], live?.inaccessibleRelationRows || []);

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
    expected_core_projection_hash: sha256(stableJson(coreProjectionCountsFromLive(live))),
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

  const proofPointer = args.emitProofBundle
    ? await emitProofBundle(args.outDir, args)
    : null;
  const failingVarianceRegister = compactVarianceRegister(
    varianceRows,
    proofPointer,
    {
      missingSourceRows: summarizeMissingSourceRows(rowRecon.detail),
      missingEvidenceIdentity: summarizeMissingEvidenceIdentity(rowRecon.detail, fileRecon, live),
      unaccountedFields: summarizeUnaccountedFields(fieldReconSummary),
      projectionHashes: summarizeProjectionHashes(live),
    },
  );
  if (failingVarianceRegister.length) {
    console.log(
      JSON.stringify(
        {
          event: "FAILING_VARIANCE_REGISTER",
          tenant_key: TENANT_KEY,
          source_release_id: SOURCE_RELEASE_ID,
          baseline_id: BASELINE_ID,
          failing_gate_count: failingVarianceRegister.length,
          gates_ranked_by_earliest_layer: failingVarianceRegister,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});

#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const SOURCE_SCHEMA = "source";
const DOC_SCHEMA = "doc";
const META_SCHEMA = "meta";
const TOWER_SCHEMA = "tower";
const DEFAULT_DATASET_ID = "skyharbor-source-v4-202608-golden-evidence";
const DEFAULT_DATASET_VERSION = "v4-golden-evidence";
const DEFAULT_TENANT_KEY = "skyharbor_global";
const DEFAULT_GOLDEN_CONTRACT_IDS = Object.freeze(["CTR-090", "CTR-061"]);
const SOURCE_THREAD_ID = "source_contract_optimization_golden_evidence_v1";
const DEFAULT_PACKAGE_DIR = path.join(
  REPO_ROOT,
  "datasets/source/contract-intelligence/skyharbor-golden-20260808",
);
let activePackageDir = DEFAULT_PACKAGE_DIR;

const PACKAGE_CSV_TABLES = Object.freeze([
  ["golden_contract_overview", "synthetic/contract_overview.csv"],
  ["golden_contract_pricing_schedule", "synthetic/contract_pricing_schedule.csv"],
  ["golden_contract_invoice_lines", "synthetic/invoice_lines.csv"],
  ["golden_contract_po_contract_match", "synthetic/po_contract_match.csv"],
  ["golden_contract_rate_card_variance", "synthetic/rate_card_variance.csv"],
  ["golden_contract_renewal_negotiation_history", "synthetic/renewal_negotiation_history.csv"],
  ["golden_contract_sla_incident_service_credit_monthly", "synthetic/sla_incident_service_credit_monthly.csv"],
  ["golden_contract_usage_entitlement_monthly", "synthetic/usage_entitlement_monthly.csv"],
  ["golden_contract_finance_value_confirmation", "synthetic/finance_value_confirmation.csv"],
  ["golden_contract_application_scope", "synthetic/contract_application_scope.csv"],
  ["contract_pdf_document_inventory", "synthetic/contract_pdf_document_inventory.csv"],
  ["contract_pdf_page_text", "synthetic/contract_pdf_page_text.csv"],
  ["contract_pdf_clause_extractions", "synthetic/contract_pdf_clause_extractions.csv"],
  ["golden_contract_reconciliation", "reconciliation/golden_contract_reconciliation.csv"],
  ["golden_contract_evidence_source_inventory", "templates/evidence_source_inventory.csv"],
  ["golden_contract_field_level_extraction_guide", "templates/field_level_extraction_guide.csv"],
  ["golden_contract_parser_persistence_mapping", "implementation/parser_persistence_mapping.csv"],
  ["golden_contract_talk_track", "story/contract_fact_based_talk_track.csv"],
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };
  return {
    apply:
      args.includes("--apply") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_APPLY === "true",
    tenantKey:
      value("--tenant-key") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_TENANT_KEY ||
      DEFAULT_TENANT_KEY,
    contractIds: [
      ...new Set(
        (
          value("--contract-id") ||
          process.env.SOURCE_GOLDEN_EVIDENCE_CONTRACT_ID ||
          DEFAULT_GOLDEN_CONTRACT_IDS.join(",")
        )
          .split(",")
          .map((contractId) => contractId.trim())
          .filter(Boolean),
      ),
    ],
    datasetId:
      value("--dataset-id") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_DATASET_ID ||
      DEFAULT_DATASET_ID,
    datasetVersion:
      value("--dataset-version") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_DATASET_VERSION ||
      DEFAULT_DATASET_VERSION,
    packageDir: path.resolve(
      value("--package-dir") ||
        process.env.SOURCE_GOLDEN_EVIDENCE_PACKAGE_DIR ||
        DEFAULT_PACKAGE_DIR,
    ),
    tenantAliases: [
      ...new Set(
        (value("--tenant-alias") ||
          process.env.SOURCE_GOLDEN_EVIDENCE_TENANT_ALIASES ||
          "")
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean),
      ),
    ],
    loadRunId:
      value("--load-run-id") ||
      process.env.LOAD_RUN_ID ||
      `source-golden-evidence-${stamp()}`,
  };
}

function databaseUrl() {
  return (
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL
  );
}

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  };
}

function stamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/gu, '""')}"`;
}

function readText(relativePath) {
  return fs.readFileSync(path.join(activePackageDir, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readCsv(relativePath) {
  const parsed = Papa.parse(readText(relativePath), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `CSV parse failed for ${relativePath}: ${parsed.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  return parsed.data.map((row) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(row)) {
      if (!key) continue;
      cleaned[key] = value == null ? "" : String(value);
    }
    return cleaned;
  });
}

function numericValue(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intValue(value) {
  const n = numericValue(value);
  return n == null ? null : Math.trunc(n);
}

function nonEmpty(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function validatePackageCsvSemantics() {
  const inventory = readCsv("synthetic/contract_pdf_document_inventory.csv");
  const pages = readCsv("synthetic/contract_pdf_page_text.csv");
  const inventoryByFile = new Map(
    inventory.map((row) => [row.source_file_id, row]),
  );
  const pageCounts = new Map();
  const failures = [];

  for (const [index, row] of pages.entries()) {
    const line = index + 2;
    const file = inventoryByFile.get(row.source_file_id);
    if (!file) {
      failures.push(
        `contract_pdf_page_text.csv:${line}: source_file_id ${row.source_file_id} is not in contract_pdf_document_inventory.csv`,
      );
      continue;
    }
    if (row.vendor_name !== file.vendor_name) {
      failures.push(
        `contract_pdf_page_text.csv:${line}: vendor_name ${JSON.stringify(
          row.vendor_name,
        )} does not match inventory ${JSON.stringify(file.vendor_name)}`,
      );
    }
    if (row.mapping_status !== file.mapping_status) {
      failures.push(
        `contract_pdf_page_text.csv:${line}: mapping_status ${JSON.stringify(
          row.mapping_status,
        )} does not match inventory ${JSON.stringify(file.mapping_status)}`,
      );
    }
    const pageNumber = intValue(row.source_page);
    if (pageNumber == null || String(pageNumber) !== row.source_page.trim()) {
      failures.push(
        `contract_pdf_page_text.csv:${line}: source_page must be an integer; got ${JSON.stringify(
          row.source_page,
        )}`,
      );
    } else if (pageNumber < 1 || pageNumber > intValue(file.page_count)) {
      failures.push(
        `contract_pdf_page_text.csv:${line}: source_page ${pageNumber} is outside inventory page_count ${file.page_count}`,
      );
    }
    if (!row.page_text) {
      failures.push(`contract_pdf_page_text.csv:${line}: page_text is required`);
    }
    const actualHash = sha256(row.page_text || "");
    if (row.page_text_sha256 !== actualHash) {
      failures.push(
        `contract_pdf_page_text.csv:${line}: page_text_sha256 does not match page_text`,
      );
    }
    pageCounts.set(
      row.source_file_id,
      (pageCounts.get(row.source_file_id) || 0) + 1,
    );
  }

  for (const file of inventory) {
    const expected = intValue(file.page_count);
    const actual = pageCounts.get(file.source_file_id) || 0;
    if (actual !== expected) {
      failures.push(
        `${file.source_file_id}: expected ${expected} page text rows, got ${actual}`,
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Golden evidence package semantic validation failed:\n${failures.join("\n")}`,
    );
  }
}

function relPackagePath(relativePath) {
  const repoRelativePackageDir = path.relative(REPO_ROOT, activePackageDir);
  if (!repoRelativePackageDir.startsWith("..") && !path.isAbsolute(repoRelativePackageDir)) {
    return `${repoRelativePackageDir}/${relativePath}`;
  }
  return `external-source-package/${path.basename(activePackageDir)}/${relativePath}`;
}

function tenantAliases(argsOrTenantKey) {
  const tenantKey =
    typeof argsOrTenantKey === "string" ? argsOrTenantKey : argsOrTenantKey.tenantKey;
  const explicitAliases =
    typeof argsOrTenantKey === "string" ? [] : argsOrTenantKey.tenantAliases || [];
  return [
    ...new Set(
      [
        tenantKey,
        tenantKey === "skyharbor_global" ? "skyharbor" : null,
        ...explicitAliases,
      ].filter(Boolean),
    ),
  ];
}

async function ensureSourceCsvTable(client, table, headers) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(SOURCE_SCHEMA)}`);
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(SOURCE_SCHEMA)}.${quoteIdent(table)} (
       _tenant_key text not null,
       _dataset_id text not null,
       _load_run_id text not null,
       _source_file text not null,
       _source_row_number int not null,
       _row_sha256 text not null,
       _loaded_at timestamptz not null default now()
     )`,
  );
  for (const header of headers) {
    if (!header || header.startsWith("_")) continue;
    await client.query(
      `ALTER TABLE ${quoteIdent(SOURCE_SCHEMA)}.${quoteIdent(table)}
         ADD COLUMN IF NOT EXISTS ${quoteIdent(header)} text`,
    );
  }
  await client.query(
    `CREATE INDEX IF NOT EXISTS ${quoteIdent(`idx_${table}_tenant_dataset`)}
       ON ${quoteIdent(SOURCE_SCHEMA)}.${quoteIdent(table)} (_tenant_key, _dataset_id)`,
  );
  if (headers.includes("contract_id")) {
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${quoteIdent(`idx_${table}_contract`)}
         ON ${quoteIdent(SOURCE_SCHEMA)}.${quoteIdent(table)} (contract_id)`,
    );
  }
}

async function loadPackageCsvTable(client, args, table, relativePath) {
  const rows = readCsv(relativePath);
  const headers = Object.keys(rows[0] || {});
  await ensureSourceCsvTable(client, table, headers);
  // Scope the delete to the declared tenant-key aliases (not just args.tenantKey), matching
  // deleteDocumentRows below. This table's own row keys carry no alias fallback -- a load
  // under one alias for this synthetic tenant leaves rows behind under that alias, and the
  // live read path (listContractEvidencePricing et al.) queries _tenant_key = ANY(aliases)
  // with no _dataset_id filter, so a stale copy is included alongside a corrected reload
  // with no guarantee the corrected rows win.
  await client.query(
    `DELETE FROM ${quoteIdent(SOURCE_SCHEMA)}.${quoteIdent(table)}
      WHERE _tenant_key = ANY($1::text[]) AND _dataset_id = $2`,
    [tenantAliases(args), args.datasetId],
  );
  for (const [index, row] of rows.entries()) {
    const logical = {
      ...row,
      _tenant_key: args.tenantKey,
      _dataset_id: args.datasetId,
      _load_run_id: args.loadRunId,
      _source_file: relPackagePath(relativePath),
      _source_row_number: index + 2,
    };
    const record = {
      ...logical,
      _row_sha256: sha256(JSON.stringify(row)),
      _loaded_at: new Date(),
    };
    const columns = [
      "_tenant_key",
      "_dataset_id",
      "_load_run_id",
      "_source_file",
      "_source_row_number",
      "_row_sha256",
      "_loaded_at",
      ...headers,
    ];
    const values = columns.map((column) => record[column] ?? null);
    await client.query(
      `INSERT INTO ${quoteIdent(SOURCE_SCHEMA)}.${quoteIdent(table)}
       (${columns.map(quoteIdent).join(", ")})
       VALUES (${values.map((_, valueIndex) => `$${valueIndex + 1}`).join(", ")})`,
      values,
    );
  }
  return rows.length;
}

async function loadPackageCsvTables(client, args) {
  const inserted = {};
  for (const [table, relativePath] of PACKAGE_CSV_TABLES) {
    inserted[table] = await loadPackageCsvTable(
      client,
      args,
      table,
      relativePath,
    );
  }
  return inserted;
}

async function ensureDocumentSchema(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(DOC_SCHEMA)}`);
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(META_SCHEMA)}`);
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(DOC_SCHEMA)}.file (
       file_id text primary key,
       tenant_key text not null,
       blob_uri text not null,
       content_sha256 text not null,
       file_name text,
       media_type text,
       page_count int,
       load_run_id text not null,
       source_event_id text,
       document_role text,
       document_type text,
       contract_ref text,
       sow_ref text,
       parent_file_id text,
       duplicate_of_file_id text,
       duplicate_state text,
       effective_date date,
       expiry_date date,
       visibility_class text not null default 'internal',
       content_authenticity text not null,
       uploaded_at timestamptz default now(),
       metadata_json jsonb not null default '{}'::jsonb,
       unique (tenant_key, file_id)
     )`,
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(DOC_SCHEMA)}.page (
       page_id text primary key,
       tenant_key text not null,
       file_id text not null,
       page_no int not null,
       page_text text,
       char_start int,
       char_end int,
       render_blob_uri text,
       page_sha256 text,
       unique (tenant_key, page_id),
       unique (tenant_key, file_id, page_no)
     )`,
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(DOC_SCHEMA)}.span (
       span_id text primary key,
       tenant_key text not null,
       file_id text not null,
       span_kind text,
       heading text,
       span_text text,
       page_from int,
       page_to int,
       char_start int,
       char_end int,
       bbox_json jsonb not null default '{}'::jsonb,
       visibility_class text not null default 'internal',
       content_authenticity text not null,
       unique (tenant_key, span_id)
     )`,
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(META_SCHEMA)}.concept (
       concept_ref text primary key,
       domain text not null,
       label text not null,
       datatype text not null,
       unit text,
       definition text not null,
       active boolean not null default true,
       created_at timestamptz not null default now()
     )`,
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(DOC_SCHEMA)}.extraction (
       extraction_id text primary key,
       tenant_key text not null,
       load_run_id text not null,
       concept_ref text not null,
       map_id text,
       extractor_version text,
       model_id text,
       prompt_version text,
       supersedes_extraction_id text,
       active_from timestamptz not null default now(),
       active_to timestamptz,
       subject_kind text not null,
       subject_ref text not null,
       group_id text,
       group_kind text,
       value_text text,
       value_num numeric,
       value_date date,
       value_bool boolean,
       unit text,
       source_kind text not null,
       source_span_id text,
       source_table text,
       source_row int,
       source_column text,
       source_file_id text,
       source_page int,
       source_section text,
       confidence numeric,
       method text,
       review_state text not null default 'unreviewed',
       reviewed_by_role text,
       reviewed_at timestamptz,
       manual_basis text,
       visibility_class text not null default 'internal',
       content_authenticity text not null,
       payload_json jsonb not null default '{}'::jsonb,
       extracted_at timestamptz default now(),
       unique (tenant_key, extraction_id)
     )`,
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_doc_extraction_subject
       ON ${quoteIdent(DOC_SCHEMA)}.extraction (tenant_key, subject_kind, subject_ref, concept_ref)
       WHERE active_to IS NULL`,
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_doc_file_tenant_contract
       ON ${quoteIdent(DOC_SCHEMA)}.file (tenant_key, contract_ref, document_role, load_run_id)`,
  );
}

function documentRole(row) {
  const type = row.document_type || "";
  if (type.includes("executed")) return "executed_agreement";
  if (type.includes("dpa")) return "dpa";
  if (type.includes("sow")) return "sow";
  return "supplemental_contract_pdf";
}

function blobUriFor(args, row) {
  return `azure-blob://abarva-source-contract-documents/${args.tenantKey}/${args.datasetId}/${row.source_file_name}`;
}

function pageId(row) {
  return `${row.source_file_id}:page:${String(row.source_page).padStart(4, "0")}`;
}

function spanId(row) {
  return `${row.extraction_id}:span`;
}

async function deleteDocumentRows(client, args, inventory, pages, clauses) {
  const fileIds = inventory.map((row) => row.source_file_id);
  const pageIds = pages.map(pageId);
  const spanIds = clauses.map(spanId);
  const extractionIds = clauses.map((row) => row.extraction_id);
  // file_id/page_id/span_id/extraction_id are content-derived, not tenant-scoped,
  // so a load of the same package under a different (equally valid) tenant-key
  // alias for this synthetic tenant leaves rows behind under that alias. Scope
  // the delete to the declared alias set (not just args.tenantKey) so a rerun
  // under the canonical key reclaims those rows instead of colliding with them
  // on insert. This never reaches outside the declared alias set for this run.
  const aliases = tenantAliases(args);
  if (extractionIds.length) {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.extraction
        WHERE tenant_key = ANY($1::text[]) AND (extraction_id = ANY($2::text[]) OR source_file_id = ANY($3::text[]))`,
      [aliases, extractionIds, fileIds],
    );
  }
  if (spanIds.length) {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.span
        WHERE tenant_key = ANY($1::text[]) AND span_id = ANY($2::text[])`,
      [aliases, spanIds],
    );
  }
  if (pageIds.length) {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.page
        WHERE tenant_key = ANY($1::text[]) AND page_id = ANY($2::text[])`,
      [aliases, pageIds],
    );
  }
  if (fileIds.length) {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.file
        WHERE tenant_key = ANY($1::text[]) AND file_id = ANY($2::text[])`,
      [aliases, fileIds],
    );
  }
}

async function loadDocumentEvidence(client, args) {
  await ensureDocumentSchema(client);
  const inventory = readCsv("synthetic/contract_pdf_document_inventory.csv");
  const pages = readCsv("synthetic/contract_pdf_page_text.csv");
  const clauses = readCsv("synthetic/contract_pdf_clause_extractions.csv");
  await deleteDocumentRows(client, args, inventory, pages, clauses);

  const concepts = new Map();
  for (const row of clauses) {
    const conceptRef = nonEmpty(row.concept_ref);
    if (!conceptRef) continue;
    const isNumeric = nonEmpty(row.value_num) != null;
    concepts.set(conceptRef, {
      concept_ref: conceptRef,
      domain: conceptRef.split(".")[0] || "contract",
      label: conceptRef
        .split(".")
        .slice(1)
        .join(" ")
        .replace(/_/gu, " "),
      datatype: isNumeric ? "numeric" : "text",
      unit: isNumeric && /value|cost|spend|credit|variance|amount/iu.test(conceptRef)
        ? "usd"
        : null,
      definition:
        "Synthetic contract-document concept extracted from governed PDF evidence package.",
    });
  }
  for (const concept of concepts.values()) {
    await client.query(
      `INSERT INTO ${quoteIdent(META_SCHEMA)}.concept
       (concept_ref, domain, label, datatype, unit, definition, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (concept_ref) DO UPDATE SET
         domain = excluded.domain,
         label = excluded.label,
         datatype = excluded.datatype,
         unit = excluded.unit,
         definition = excluded.definition,
         active = true`,
      [
        concept.concept_ref,
        concept.domain,
        concept.label,
        concept.datatype,
        concept.unit,
        concept.definition,
      ],
    );
  }

  for (const row of inventory) {
    const mapped = row.mapping_status === "mapped_to_register_contract";
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.file (
         file_id, tenant_key, blob_uri, content_sha256, file_name, media_type,
         page_count, load_run_id, document_role, document_type, contract_ref,
         duplicate_state, visibility_class, content_authenticity, metadata_json
       )
       VALUES ($1, $2, $3, $4, $5, 'application/pdf', $6, $7, $8, $9, $10,
               'not_checked', 'internal', 'synthetic', $11::jsonb)
       ON CONFLICT (file_id) DO UPDATE SET
         tenant_key = excluded.tenant_key,
         blob_uri = excluded.blob_uri,
         content_sha256 = excluded.content_sha256,
         file_name = excluded.file_name,
         media_type = excluded.media_type,
         page_count = excluded.page_count,
         load_run_id = excluded.load_run_id,
         document_role = excluded.document_role,
         document_type = excluded.document_type,
         contract_ref = excluded.contract_ref,
         duplicate_state = excluded.duplicate_state,
         visibility_class = excluded.visibility_class,
         content_authenticity = excluded.content_authenticity,
         metadata_json = excluded.metadata_json`,
      [
        row.source_file_id,
        args.tenantKey,
        blobUriFor(args, row),
        row.source_file_sha256,
        row.source_file_name,
        intValue(row.page_count),
        args.loadRunId,
        documentRole(row),
        row.document_type,
        mapped ? nonEmpty(row.contract_id) : null,
        JSON.stringify({
          dataset_id: args.datasetId,
          dataset_version: args.datasetVersion,
          mapping_status: row.mapping_status,
          storage_target: row.storage_target,
          parser_version: row.parser_version,
          loaded_policy: row.loaded_policy,
          source_package_path: relPackagePath(`documents/${row.source_file_name}`),
        }),
      ],
    );
  }

  for (const row of pages) {
    const text = row.page_text || "";
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.page (
         page_id, tenant_key, file_id, page_no, page_text, char_start, char_end, page_sha256
       )
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
       ON CONFLICT (page_id) DO UPDATE SET
         tenant_key = excluded.tenant_key,
         file_id = excluded.file_id,
         page_no = excluded.page_no,
         page_text = excluded.page_text,
         char_end = excluded.char_end,
         page_sha256 = excluded.page_sha256`,
      [
        pageId(row),
        args.tenantKey,
        row.source_file_id,
        intValue(row.source_page),
        text,
        text.length,
        row.page_text_sha256,
      ],
    );
  }

  for (const row of clauses) {
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.span (
         span_id, tenant_key, file_id, span_kind, heading, span_text, page_from, page_to,
         char_start, char_end, visibility_class, content_authenticity
       )
       VALUES ($1, $2, $3, 'clause', $4, $5, $6, $6, 0, $7, 'internal', 'synthetic')
       ON CONFLICT (span_id) DO UPDATE SET
         tenant_key = excluded.tenant_key,
         file_id = excluded.file_id,
         heading = excluded.heading,
         span_text = excluded.span_text,
         page_from = excluded.page_from,
         page_to = excluded.page_to,
         char_end = excluded.char_end`,
      [
        spanId(row),
        args.tenantKey,
        row.source_file_id,
        row.source_section || row.concept_ref,
        row.source_excerpt || row.value_text,
        intValue(row.source_page),
        String(row.source_excerpt || row.value_text || "").length,
      ],
    );
    const valueNum = numericValue(row.value_num);
    const valueText = valueNum == null ? nonEmpty(row.value_text) : null;
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.extraction (
         extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id,
         prompt_version, subject_kind, subject_ref, value_text, value_num, unit,
         source_kind, source_span_id, source_file_id, source_page, source_section,
         confidence, method, review_state, visibility_class, content_authenticity,
         payload_json, extracted_at
       )
       VALUES ($1, $2, $3, $4, $5, null, 'contract_pdf_adapter_v1', $6, $7, $8, $9, $10,
               'span', $11, $12, $13, $14, $15, $16, $17, 'internal', 'synthetic', $18::jsonb, now())
       ON CONFLICT (extraction_id) DO UPDATE SET
         tenant_key = excluded.tenant_key,
         load_run_id = excluded.load_run_id,
         concept_ref = excluded.concept_ref,
         extractor_version = excluded.extractor_version,
         subject_kind = excluded.subject_kind,
         subject_ref = excluded.subject_ref,
         value_text = excluded.value_text,
         value_num = excluded.value_num,
         unit = excluded.unit,
         source_span_id = excluded.source_span_id,
         source_file_id = excluded.source_file_id,
         source_page = excluded.source_page,
         source_section = excluded.source_section,
         confidence = excluded.confidence,
         method = excluded.method,
         review_state = excluded.review_state,
         payload_json = excluded.payload_json,
         extracted_at = excluded.extracted_at`,
      [
        row.extraction_id,
        args.tenantKey,
        args.loadRunId,
        row.concept_ref,
        row.extractor_version || "contract_pdf_adapter_v1",
        row.subject_kind || "contract",
        row.subject_ref || row.contract_id,
        valueText,
        valueNum,
        valueNum == null ? null : (row.ledger === "commercial" ? "usd" : null),
        spanId(row),
        row.source_file_id,
        intValue(row.source_page),
        row.source_section,
        numericValue(row.confidence),
        row.method || "pdf_text_extraction",
        row.review_state || "unreviewed",
        JSON.stringify({
          dataset_id: args.datasetId,
          dataset_version: args.datasetVersion,
          contract_id: row.contract_id,
          vendor_id: row.vendor_id,
          vendor_name: row.vendor_name,
          source_file_sha256: row.source_file_sha256,
          document_type: row.document_type,
          evidence_class: row.evidence_class,
          ledger: row.ledger,
          source_excerpt: row.source_excerpt,
        }),
      ],
    );
  }

  return {
    doc_file: inventory.length,
    doc_page: pages.length,
    doc_span: clauses.length,
    doc_extraction: clauses.length,
    mapped_contract_pdf: inventory.filter(
      (row) => row.mapping_status === "mapped_to_register_contract",
    ).length,
    supplemental_prior_pdf: inventory.filter((row) =>
      String(row.mapping_status).startsWith("supplemental"),
    ).length,
  };
}

async function verifyContractById(client, args, contractId) {
  const result = await client.query(
    `SELECT tenant_key, contract_id, vendor_ref, vendor_name, annual_value
       FROM source.contract_360
      WHERE tenant_key = ANY($1::text[]) AND contract_id = $2
      LIMIT 1`,
    [tenantAliases(args), contractId],
  );
  if (result.rows[0]) return result.rows[0];

  const overview = readCsv("synthetic/contract_overview.csv").find(
    (row) => row.contract_id === contractId,
  );
  if (!overview) {
    throw new Error(
      `Contract ${contractId} was not found in source.contract_360 or synthetic/contract_overview.csv for ${args.tenantKey}`,
    );
  }

  return {
    tenant_key: args.tenantKey,
    contract_id: overview.contract_id,
    vendor_ref: overview.vendor_id || null,
    vendor_name: overview.vendor_name || null,
    annual_value: numericValue(overview.annual_value_usd),
    contract_anchor: "evidence_package_overview",
  };
}

function reconciliationRowsByContract(contractIds) {
  const rows = readCsv("reconciliation/golden_contract_reconciliation.csv");
  const byId = new Map(rows.map((row) => [row.contract_id, row]));
  for (const contractId of contractIds) {
    if (!byId.has(contractId)) {
      throw new Error(
        `Package reconciliation is missing required contract_id ${contractId}`,
      );
    }
  }
  return byId;
}

async function upsertTowerClaim(client, args, contract, reconciliationRow) {
  // tracked_subject.subject_ref and value_claim.claim_id are each a bare
  // primary key with no tenant column in the key itself (same shape as the
  // doc.* tables above), while both are keyed here on the tenant-agnostic
  // contract id. A load of this same package under a different (equally
  // valid) tenant-key alias for this synthetic tenant left rows behind under
  // that alias, which the ON CONFLICT (tenant_key, ...) targets below cannot
  // see (that composite is a secondary unique constraint, not the primary
  // key). Reclaim across the declared alias set first, child before parent,
  // so the upserts below land cleanly under the current run's tenant key.
  const towerAliases = tenantAliases(args);
  const claimId = `claim-source-contract-golden-${contract.contract_id.toLowerCase()}`;
  await client.query(
    `DELETE FROM ${quoteIdent(TOWER_SCHEMA)}.value_claim
      WHERE tenant_key = ANY($1::text[]) AND claim_id = $2`,
    [towerAliases, claimId],
  );
  await client.query(
    `DELETE FROM ${quoteIdent(TOWER_SCHEMA)}.tracked_subject
      WHERE tenant_key = ANY($1::text[]) AND subject_ref = $2`,
    [towerAliases, contract.contract_id],
  );
  await client.query(
    `INSERT INTO ${quoteIdent(TOWER_SCHEMA)}.metric_definition (
       metric_ref, domain, label, description, value_type, unit, aggregation_rule,
       directionality, formula_version, freshness_days, required_sample_size, claim_gate_rule
     )
     VALUES (
       'value.claimable_amount', 'value', 'Claimable value amount',
       'Value that passed deterministic claim gates.', 'numeric', 'usd', 'sum',
       'higher_is_better', 'tower_claim_rule_v1', 90, null, 'all_gates_required'
     )
     ON CONFLICT (metric_ref) DO UPDATE SET
       label = excluded.label,
       description = excluded.description,
       active = true`,
  );
  await client.query(
    `INSERT INTO ${quoteIdent(TOWER_SCHEMA)}.tracked_subject (
       subject_ref, tenant_key, subject_kind, title, vendor_ref, contract_ref, owner_role, metadata_json
     )
     VALUES ($1, $2, 'contract', $3, $4, $1, 'Strategic sourcing lead', $5::jsonb)
     ON CONFLICT (tenant_key, subject_ref) DO UPDATE SET
       title = excluded.title,
       vendor_ref = excluded.vendor_ref,
       contract_ref = excluded.contract_ref,
       metadata_json = excluded.metadata_json`,
    [
      contract.contract_id,
      args.tenantKey,
      `${contract.vendor_name || "Selected vendor"} contract optimization canary`,
      contract.vendor_ref || null,
      JSON.stringify({
        dataset_id: args.datasetId,
        dataset_version: args.datasetVersion,
        synthetic_canary: true,
      }),
    ],
  );
  const claimInputHash = sha256(
    JSON.stringify({
      contract_id: contract.contract_id,
      dataset_id: args.datasetId,
      realized_value: numericValue(reconciliationRow.realized_value_usd),
      source_thread_id: SOURCE_THREAD_ID,
    }),
  );
  await client.query(
    `INSERT INTO ${quoteIdent(TOWER_SCHEMA)}.value_claim (
       claim_id, tenant_key, subject_ref, outcome_metric_ref, promised_value,
       calculated_value, currency, attribution_basis, quality_guardrail_state,
       risk_guardrail_state, claim_state, claim_rule_version, claim_input_hash,
       caveat, blocked_reason, next_gate, next_gate_owner_role, evaluated_at
     )
     VALUES (
       $1, $2, $3, 'value.claimable_amount', $4, $5, 'USD', $6,
       'finance_validated', 'pass', 'finance_validated',
       'source_contract_optimization_golden_v1', $7, $8, null, null, null, now()
     )
     ON CONFLICT (tenant_key, claim_id) DO UPDATE SET
       subject_ref = excluded.subject_ref,
       promised_value = excluded.promised_value,
       calculated_value = excluded.calculated_value,
       attribution_basis = excluded.attribution_basis,
       quality_guardrail_state = excluded.quality_guardrail_state,
       risk_guardrail_state = excluded.risk_guardrail_state,
       claim_state = excluded.claim_state,
       claim_input_hash = excluded.claim_input_hash,
       caveat = excluded.caveat,
       blocked_reason = null,
       next_gate = null,
       next_gate_owner_role = null,
       evaluated_at = now()`,
    [
      claimId,
      args.tenantKey,
      contract.contract_id,
      numericValue(reconciliationRow.negotiated_improvement_usd),
      numericValue(reconciliationRow.realized_value_usd),
      "Executed amendment, post-amendment AP invoice run-rate, recovered credits, and Finance/Tower attestation.",
      claimInputHash,
      "Synthetic canary evidence pack for product validation; not client fact.",
    ],
  );
}

async function reconcile(client, args) {
  const expectedByContract = reconciliationRowsByContract(args.contractIds);
  const result = await client.query(
    `
    WITH selected AS (
      SELECT UNNEST($3::text[]) AS contract_id
    )
    SELECT jsonb_object_agg(contract_id, payload) AS by_contract
    FROM (
      SELECT
        s.contract_id,
        jsonb_build_object(
          'service_credit_gap_usd',
            (SELECT COALESCE(SUM(service_credits_earned_usd::numeric - service_credits_claimed_usd::numeric), 0)
               FROM ${quoteIdent(SOURCE_SCHEMA)}.golden_contract_sla_incident_service_credit_monthly
              WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = s.contract_id),
          'invoice_line_exceptions_usd',
            (SELECT COALESCE(SUM(exception_amount_usd::numeric), 0)
               FROM ${quoteIdent(SOURCE_SCHEMA)}.golden_contract_invoice_lines
              WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = s.contract_id),
          'rate_card_variance_usd',
            (SELECT COALESCE(SUM(rate_variance_usd::numeric), 0)
               FROM ${quoteIdent(SOURCE_SCHEMA)}.golden_contract_rate_card_variance
              WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = s.contract_id),
          'recoverable_leakage_usd',
            (SELECT COALESCE(SUM(service_credits_earned_usd::numeric - service_credits_claimed_usd::numeric), 0)
               FROM ${quoteIdent(SOURCE_SCHEMA)}.golden_contract_sla_incident_service_credit_monthly
              WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = s.contract_id)
            +
            (SELECT COALESCE(SUM(exception_amount_usd::numeric), 0)
               FROM ${quoteIdent(SOURCE_SCHEMA)}.golden_contract_invoice_lines
              WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = s.contract_id)
            +
            (SELECT COALESCE(SUM(rate_variance_usd::numeric), 0)
               FROM ${quoteIdent(SOURCE_SCHEMA)}.golden_contract_rate_card_variance
              WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = s.contract_id),
          'realized_value_usd',
            (SELECT COALESCE(SUM(calculated_value), 0)
               FROM ${quoteIdent(TOWER_SCHEMA)}.value_claim
              WHERE tenant_key = $1 AND subject_ref = s.contract_id AND claim_state = 'finance_validated'),
          'doc_extraction_rows',
            (SELECT COUNT(*)
               FROM ${quoteIdent(DOC_SCHEMA)}.extraction
              WHERE tenant_key = $1 AND subject_ref = s.contract_id)
        ) AS payload
      FROM selected s
    ) checks
    `,
    [args.tenantKey, args.datasetId, args.contractIds],
  );
  const actualByContract = result.rows[0]?.by_contract || {};
  const failures = [];
  for (const contractId of args.contractIds) {
    const expected = expectedByContract.get(contractId);
    const actual = actualByContract[contractId] || {};
    for (const [expectedKey, actualKey] of [
      ["service_credit_gap_usd", "service_credit_gap_usd"],
      ["invoice_line_exceptions_usd", "invoice_line_exceptions_usd"],
      ["rate_card_variance_usd", "rate_card_variance_usd"],
      ["recoverable_leakage_usd", "recoverable_leakage_usd"],
      ["realized_value_usd", "realized_value_usd"],
    ]) {
      if (Number(actual[actualKey] || 0) !== Number(expected[expectedKey] || 0)) {
        failures.push(
          `${contractId}.${expectedKey}: expected ${expected[expectedKey]}, got ${actual[actualKey] || 0}`,
        );
      }
    }
    if (Number(actual.doc_extraction_rows || 0) <= 0) {
      failures.push(`${contractId}.doc_extraction_rows: expected > 0`);
    }
  }
  return {
    by_contract: actualByContract,
    passed: failures.length === 0,
    failures,
  };
}

async function main() {
  const args = parseArgs();
  activePackageDir = args.packageDir;
  validatePackageCsvSemantics();
  const manifest = readJson("manifest.json");
  const qualityReport = readJson("documents/pdf_extraction_quality_report.json");
  const plan = {
    event: "source_contract_golden_evidence_plan",
    apply: false,
    tenant_key: args.tenantKey,
    dataset_id: args.datasetId,
    dataset_version: args.datasetVersion,
    contract_ids: args.contractIds,
    load_run_id: args.loadRunId,
    evidence_rows: {
      package_csv_tables: PACKAGE_CSV_TABLES.length,
      source_rows: PACKAGE_CSV_TABLES.reduce(
        (sum, [, relativePath]) => sum + readCsv(relativePath).length,
        0,
      ),
      doc_file: readCsv("synthetic/contract_pdf_document_inventory.csv").length,
      doc_page: readCsv("synthetic/contract_pdf_page_text.csv").length,
      doc_extraction: readCsv("synthetic/contract_pdf_clause_extractions.csv").length,
      mapped_golden_pdf: qualityReport.mapped_golden_pdf_count,
      supplemental_prior_pdf: qualityReport.supplemental_prior_pdf_count,
      tower_value_claim: args.contractIds.length,
    },
    expected: manifest.contracts.filter((contract) =>
      args.contractIds.includes(contract.contract_id),
    ),
    prior_pdf_policy: qualityReport.prior_corpus_policy,
    note: "Governed synthetic canary evidence; PDFs and CSVs load through the same Source/document adapter path and remain clearly marked synthetic.",
  };
  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  const client = new Client(
    postgresClientOptions(url, "source-golden-contract-evidence-load"),
  );
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    const reconciliationByContract = reconciliationRowsByContract(
      args.contractIds,
    );
    const contracts = [];
    for (const contractId of args.contractIds) {
      contracts.push(await verifyContractById(client, args, contractId));
    }
    const sourceTablesInserted = await loadPackageCsvTables(client, args);
    const documentEvidenceInserted = await loadDocumentEvidence(client, args);
    const inserted = {
      source_tables: sourceTablesInserted,
      document_evidence: documentEvidenceInserted,
      tower_value_claim: args.contractIds.length,
    };
    for (const contract of contracts) {
      await upsertTowerClaim(
        client,
        args,
        contract,
        reconciliationByContract.get(contract.contract_id),
      );
    }
    const reconciliation = await reconcile(client, args);
    if (!reconciliation.passed) {
      throw new Error(
        `Golden evidence reconciliation failed: ${JSON.stringify(reconciliation)}`,
      );
    }
    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          ...plan,
          event: "source_contract_golden_evidence_loaded",
          apply: true,
          contracts,
          inserted,
          reconciliation,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message,
        code: error.code,
        detail: error.detail,
        schema: error.schema,
        table: error.table,
        column: error.column,
        constraint: error.constraint,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

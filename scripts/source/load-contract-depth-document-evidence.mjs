#!/usr/bin/env node
// Loads the contract-depth package's already-computed clause/page-text CSVs
// (source-files/contract_clauses.csv, source-files/contract_page_text.csv) into
// the doc.file / doc.page / doc.span / doc.extraction tables that the Source
// workspace read-adapter's docExtractions / evidencePricing fields actually
// read from (see src/lib/source/data-model/read-adapter.ts:
// listDocExtractionsForSubject -> doc.extraction,
// listContractEvidencePricing -> source.golden_contract_pricing_schedule).
//
// This is a companion to load-contract-depth-package.ts, not a replacement.
// That script already loads this same CSV data into source.contract_term and
// a canonical_fact_assertion page-text-char-count fact -- this script adds the
// document/extraction-shaped rows the UI's "Clauses (detail)" evidence state
// and citation display are missing, using the schema and insert pattern
// already proven by load-source-golden-contract-evidence.mjs's
// loadDocumentEvidence() for SkyHarbor / the meridian-golden-20260809 package.
//
// Scope is explicit and narrow by design: pass --contract-id to limit to one
// or more contracts. Nothing here invents content -- every row traces to a
// CSV row already reviewed and tagged synthetic_demo_reviewed /
// synthetic_demo_only_not_client_truth in the source package.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const DOC_SCHEMA = "doc";
const META_SCHEMA = "meta";
const DEFAULT_DATASET_VERSION = "meridian-contract-depth-v1-20260828";
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_PACKAGE_DIR = path.join(
  REPO_ROOT,
  "datasets/source/contract-depth/meridian-contract-depth-v1-20260828",
);

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
  };
  const contractIdsRaw = value("--contract-id") || process.env.CONTRACT_DEPTH_DOC_EVIDENCE_CONTRACT_ID || "";
  return {
    apply: args.includes("--apply") || process.env.CONTRACT_DEPTH_DOC_EVIDENCE_APPLY === "true",
    tenantKey: value("--tenant-key") || process.env.CONTRACT_DEPTH_DOC_EVIDENCE_TENANT_KEY || DEFAULT_TENANT_KEY,
    datasetVersion:
      value("--dataset-version") ||
      process.env.CONTRACT_DEPTH_DOC_EVIDENCE_DATASET_VERSION ||
      DEFAULT_DATASET_VERSION,
    packageDir: path.resolve(
      value("--package-dir") || process.env.CONTRACT_DEPTH_DOC_EVIDENCE_PACKAGE_DIR || DEFAULT_PACKAGE_DIR,
    ),
    contractIds: contractIdsRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    loadRunId:
      value("--load-run-id") ||
      process.env.CONTRACT_DEPTH_DOC_EVIDENCE_LOAD_RUN_ID ||
      `source-contract-depth-doc-evidence-${stamp()}`,
  };
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/gu, '""')}"`;
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
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.length > 0));
}

function readCsv(packageDir, relativePath) {
  const text = fs.readFileSync(path.join(packageDir, "source-files", relativePath), "utf8");
  const parsed = parseCsv(text);
  const headers = parsed[0] ?? [];
  return parsed.slice(1).map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
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

export function buildDocumentFileInputs(pages, clauses) {
  const pagesByFile = new Map();
  for (const row of pages) {
    const list = pagesByFile.get(row.source_file_id) ?? [];
    list.push(row);
    pagesByFile.set(row.source_file_id, list);
  }

  const clausesByFile = new Map();
  for (const row of clauses) {
    const list = clausesByFile.get(row.source_file_id) ?? [];
    list.push(row);
    clausesByFile.set(row.source_file_id, list);
  }

  const sourceFileIds = new Set([
    ...pagesByFile.keys(),
    ...clausesByFile.keys(),
  ]);
  return [...sourceFileIds]
    .filter(Boolean)
    .sort()
    .map((sourceFileId) => {
      const filePages = pagesByFile.get(sourceFileId) ?? [];
      const fileClauses = clausesByFile.get(sourceFileId) ?? [];
      const first = filePages[0] ?? fileClauses[0];
      const pageCount = Math.max(
        filePages.length,
        ...fileClauses.map((row) => intValue(row.source_page) ?? 1),
        1,
      );
      const combinedText = filePages.length
        ? filePages.map((row) => row.page_text || "").join("\n")
        : fileClauses.map((row) => row.value_text || "").join("\n");
      return { sourceFileId, first, pageCount, combinedText };
    });
}

export function documentFileIdentityConflictMessage(rows) {
  const details = rows.map((row) => `${row.file_id} -> ${row.contract_ref}`).join(", ");
  return `Source file identity conflict: ${details}. A document file id cannot be reused across contract ids.`;
}

export function staleDocumentFileIds(rows, currentFileIds, args) {
  const current = new Set(currentFileIds);
  const sourcePackage = `${args.datasetVersion}/source-files`;
  return rows
    .filter(
      (row) =>
        !current.has(row.file_id) &&
        args.contractIds.includes(row.contract_ref) &&
        row.metadata_json?.source_package === sourcePackage,
    )
    .map((row) => row.file_id)
    .sort();
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

function documentRole(sourceFileId) {
  const id = String(sourceFileId || "").toUpperCase();
  if (id.includes("-MSA")) return "executed_agreement";
  if (id.includes("-SOW")) return "sow";
  return "supplemental_contract_pdf";
}

function documentTypeFor(sourceFileId) {
  const id = String(sourceFileId || "").toUpperCase();
  if (id.includes("-MSA")) return "master_services_agreement";
  if (id.includes("-SOW")) return "statement_of_work";
  if (id.includes("-PRICING")) return "pricing_schedule";
  if (id.includes("-SLA")) return "sla_report";
  if (id.includes("-USAGE")) return "usage_entitlement_report";
  if (id.includes("-CHANGE")) return "change_order_ledger";
  if (id.includes("-INVOICE")) return "invoice_export";
  return "supplemental_document";
}

function blobUriFor(args, sourceFileId) {
  return `azure-blob://abarva-source-contract-documents/${args.tenantKey}/${args.datasetVersion}/${sourceFileId}.txt`;
}

function pageId(row) {
  return `${row.source_file_id}:page:${String(intValue(row.source_page) ?? 1).padStart(4, "0")}`;
}

function spanId(row) {
  return `${row.extraction_id}:span`;
}

async function deleteExisting(client, args, fileIds, pageIds, spanIds, extractionIds) {
  const aliases = [args.tenantKey];
  if (fileIds.length || extractionIds.length) {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.extraction
        WHERE tenant_key = ANY($1::text[]) AND (extraction_id = ANY($2::text[]) OR source_file_id = ANY($3::text[]))`,
      [aliases, extractionIds, fileIds],
    );
  }
  if (fileIds.length || spanIds.length) {
    // A file can already have spans from an earlier extraction version. Delete
    // every dependent span before replacing the file; deleting only the current
    // clause IDs leaves stale spans behind and the file FK rejects the retry.
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.span
        WHERE tenant_key = ANY($1::text[]) AND (span_id = ANY($2::text[]) OR file_id = ANY($3::text[]))`,
      [aliases, spanIds, fileIds],
    );
  }
  if (fileIds.length || pageIds.length) {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.page
        WHERE tenant_key = ANY($1::text[]) AND (page_id = ANY($2::text[]) OR file_id = ANY($3::text[]))`,
      [aliases, pageIds, fileIds],
    );
  }
  // Keep the file row in place when possible. Existing spans/pages reference
  // it, so the upsert below is the idempotent replacement boundary.
  if (fileIds.length && process.env.SOURCE_DOCUMENT_EVIDENCE_DELETE_ORPHAN_FILES === "true") {
    await client.query(
      `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.file WHERE tenant_key = ANY($1::text[]) AND file_id = ANY($2::text[])`,
      [aliases, fileIds],
    );
  }
}

async function deleteStalePackageFiles(client, args, fileIds) {
  if (fileIds.length === 0) return;
  const aliases = [args.tenantKey];
  await client.query(
    `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.extraction
      WHERE tenant_key = ANY($1::text[]) AND source_file_id = ANY($2::text[])`,
    [aliases, fileIds],
  );
  await client.query(
    `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.span
      WHERE tenant_key = ANY($1::text[]) AND file_id = ANY($2::text[])`,
    [aliases, fileIds],
  );
  await client.query(
    `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.page
      WHERE tenant_key = ANY($1::text[]) AND file_id = ANY($2::text[])`,
    [aliases, fileIds],
  );
  await client.query(
    `DELETE FROM ${quoteIdent(DOC_SCHEMA)}.file
      WHERE tenant_key = ANY($1::text[]) AND file_id = ANY($2::text[])`,
    [aliases, fileIds],
  );
}

async function loadDocumentEvidence(client, args, pages, clauses) {
  await ensureDocumentSchema(client);

  const fileIds = [...new Set([...pages.map((r) => r.source_file_id), ...clauses.map((r) => r.source_file_id)])].filter(Boolean);
  const conflictingFiles = await client.query(
    `SELECT file_id, contract_ref
       FROM ${quoteIdent(DOC_SCHEMA)}.file
      WHERE tenant_key = $1
        AND file_id = ANY($2::text[])
        AND contract_ref IS NOT NULL
        AND NOT (contract_ref = ANY($3::text[]))`,
    [args.tenantKey, fileIds, args.contractIds],
  );
  if (conflictingFiles.rows.length > 0) {
    const details = conflictingFiles.rows.map((row) => `${row.file_id} -> ${row.contract_ref}`).join(", ");
    throw new Error(`Source file identity conflict: ${details}. A document file id cannot be reused across contract ids.`);
  }
  const staleFiles = await client.query(
    `SELECT file_id, contract_ref, metadata_json
       FROM ${quoteIdent(DOC_SCHEMA)}.file
      WHERE tenant_key = $1
        AND contract_ref = ANY($2::text[])
        AND metadata_json->>'source_package' = $3
        AND NOT (file_id = ANY($4::text[]))`,
    [args.tenantKey, args.contractIds, `${args.datasetVersion}/source-files`, fileIds],
  );
  const staleFileIds = staleDocumentFileIds(staleFiles.rows, fileIds, args);
  await deleteStalePackageFiles(client, args, staleFileIds);
  const pageIds = pages.map(pageId);
  const spanIds = clauses.map(spanId);
  const extractionIds = clauses.map((row) => row.extraction_id);
  await deleteExisting(client, args, fileIds, pageIds, spanIds, extractionIds);

  const concepts = new Map();
  for (const row of clauses) {
    const conceptRef = nonEmpty(row.concept_ref);
    if (!conceptRef) continue;
    const isNumeric = nonEmpty(row.value_num) != null;
    concepts.set(conceptRef, {
      concept_ref: `contract_clause.${conceptRef}`,
      domain: "contract",
      label: conceptRef.replace(/_/gu, " "),
      datatype: isNumeric ? "numeric" : "text",
      unit: isNumeric && /value|cost|spend|credit|variance|amount|pct/iu.test(conceptRef) ? (conceptRef.includes("pct") ? "%" : "usd") : null,
      definition: "Synthetic contract-document concept extracted from the governed contract-depth evidence package.",
    });
  }
  for (const concept of concepts.values()) {
    await client.query(
      `INSERT INTO ${quoteIdent(META_SCHEMA)}.concept (concept_ref, domain, label, datatype, unit, definition, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (concept_ref) DO UPDATE SET
         domain = excluded.domain, label = excluded.label, datatype = excluded.datatype,
         unit = excluded.unit, definition = excluded.definition, active = true`,
      [concept.concept_ref, concept.domain, concept.label, concept.datatype, concept.unit, concept.definition],
    );
  }

  // One doc.file row per distinct source_file_id, built from the page-text rows
  // (page_count = number of page rows for that file; content_sha256 derived from
  // the concatenation of that file's page text, since the package has no
  // separate PDF binary -- consistent with how contract_page_text.csv already
  // ships a page_text_sha256 per page).
  const documentFiles = buildDocumentFileInputs(pages, clauses);
  let fileCount = 0;
  for (const { sourceFileId, first, pageCount, combinedText } of documentFiles) {
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.file (
         file_id, tenant_key, blob_uri, content_sha256, file_name, media_type,
         page_count, load_run_id, document_role, document_type, contract_ref,
         duplicate_state, visibility_class, content_authenticity, metadata_json
       )
       VALUES ($1, $2, $3, $4, $5, 'text/plain', $6, $7, $8, $9, $10,
               'not_checked', 'internal', 'synthetic', $11::jsonb)
       ON CONFLICT (file_id) DO UPDATE SET
         tenant_key = excluded.tenant_key, blob_uri = excluded.blob_uri,
         content_sha256 = excluded.content_sha256, file_name = excluded.file_name,
         page_count = excluded.page_count, load_run_id = excluded.load_run_id,
         document_role = excluded.document_role, document_type = excluded.document_type,
         contract_ref = excluded.contract_ref, metadata_json = excluded.metadata_json`,
      [
        sourceFileId,
        args.tenantKey,
        blobUriFor(args, sourceFileId),
        sha256(combinedText),
        `${sourceFileId}.txt`,
        pageCount,
        args.loadRunId,
        documentRole(sourceFileId),
        documentTypeFor(sourceFileId),
        nonEmpty(first.contract_id),
        JSON.stringify({
          dataset_version: args.datasetVersion,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
          vendor_name: first.vendor_name,
          source_package: `${args.datasetVersion}/source-files`,
        }),
      ],
    );
    fileCount += 1;
  }

  for (const row of pages) {
    const text = row.page_text || "";
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.page (page_id, tenant_key, file_id, page_no, page_text, char_start, char_end, page_sha256)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
       ON CONFLICT (page_id) DO UPDATE SET
         tenant_key = excluded.tenant_key, file_id = excluded.file_id, page_no = excluded.page_no,
         page_text = excluded.page_text, char_end = excluded.char_end, page_sha256 = excluded.page_sha256`,
      [pageId(row), args.tenantKey, row.source_file_id, intValue(row.source_page) ?? 1, text, text.length, row.page_text_sha256],
    );
  }

  for (const row of clauses) {
    const valueNum = numericValue(row.value_num);
    const valueText = valueNum == null ? nonEmpty(row.value_text) : null;
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.span (
         span_id, tenant_key, file_id, span_kind, heading, span_text, page_from, page_to,
         char_start, char_end, visibility_class, content_authenticity
       )
       VALUES ($1, $2, $3, 'clause', $4, $5, $6, $6, 0, $7, 'internal', 'synthetic')
       ON CONFLICT (span_id) DO UPDATE SET
         tenant_key = excluded.tenant_key, file_id = excluded.file_id, heading = excluded.heading,
         span_text = excluded.span_text, page_from = excluded.page_from, page_to = excluded.page_to,
         char_end = excluded.char_end`,
      [
        spanId(row),
        args.tenantKey,
        row.source_file_id,
        row.source_section || row.concept_ref,
        row.value_text,
        intValue(row.source_page),
        String(row.value_text || "").length,
      ],
    );
    await client.query(
      `INSERT INTO ${quoteIdent(DOC_SCHEMA)}.extraction (
         extraction_id, tenant_key, load_run_id, concept_ref, extractor_version,
         subject_kind, subject_ref, value_text, value_num, unit,
         source_kind, source_span_id, source_file_id, source_page, source_section,
         confidence, method, review_state, visibility_class, content_authenticity,
         payload_json, extracted_at
       )
       VALUES ($1, $2, $3, $4, 'contract_pdf_adapter_v1', $5, $6, $7, $8, $9,
               'span', $10, $11, $12, $13, $14, $15, $16, 'internal', 'synthetic', $17::jsonb, now())
       ON CONFLICT (extraction_id) DO UPDATE SET
         tenant_key = excluded.tenant_key, load_run_id = excluded.load_run_id,
         concept_ref = excluded.concept_ref, subject_ref = excluded.subject_ref,
         value_text = excluded.value_text, value_num = excluded.value_num,
         source_span_id = excluded.source_span_id, source_file_id = excluded.source_file_id,
         source_page = excluded.source_page, source_section = excluded.source_section,
         confidence = excluded.confidence, method = excluded.method,
         review_state = excluded.review_state, payload_json = excluded.payload_json,
         extracted_at = excluded.extracted_at`,
      [
        row.extraction_id,
        args.tenantKey,
        args.loadRunId,
        `contract_clause.${row.concept_ref}`,
        "contract",
        row.contract_id,
        valueText,
        valueNum,
        valueNum == null ? null : (/value|cost|spend|credit|variance|amount/iu.test(row.concept_ref) ? "usd" : (row.concept_ref.includes("pct") ? "%" : null)),
        spanId(row),
        row.source_file_id,
        intValue(row.source_page),
        row.source_section,
        numericValue(row.confidence),
        "pdf_text_extraction",
        row.review_state || "unreviewed",
        JSON.stringify({
          dataset_version: args.datasetVersion,
          contract_id: row.contract_id,
          vendor_ref: row.vendor_ref,
          vendor_name: row.vendor_name,
          document_type: documentTypeFor(row.source_file_id),
          evidence_class: row.evidence_class,
          value_bool: row.value_bool,
        }),
      ],
    );
  }

  return {
    doc_file: fileCount,
    doc_page: pages.length,
    doc_span: clauses.length,
    doc_extraction: clauses.length,
    stale_package_files_removed: staleFileIds.length,
  };
}

async function verifyContractsExist(client, args) {
  const result = await client.query(
    `SELECT contract_id, vendor_id, annual_value FROM source.contract WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
    [args.tenantKey, args.contractIds],
  );
  const found = new Set(result.rows.map((r) => r.contract_id));
  const missing = args.contractIds.filter((id) => !found.has(id));
  if (missing.length) {
    throw new Error(`Contract(s) not found in source.contract for tenant ${args.tenantKey}: ${missing.join(", ")}. Run load-contract-depth-package.ts (Layer 3) for this package first.`);
  }
  return result.rows;
}

async function main() {
  const args = parseArgs();
  if (args.contractIds.length === 0) {
    throw new Error("Refusing to run with no --contract-id scope. Pass one or more contract ids explicitly.");
  }

  const allPages = readCsv(args.packageDir, "contract_page_text.csv");
  const allClauses = readCsv(args.packageDir, "contract_clauses.csv");
  const pages = allPages.filter((row) => args.contractIds.includes(row.contract_id));
  const clauses = allClauses.filter((row) => args.contractIds.includes(row.contract_id));

  const plan = {
    event: "source_contract_depth_document_evidence_plan",
    apply: false,
    tenant_key: args.tenantKey,
    dataset_version: args.datasetVersion,
    contract_ids: args.contractIds,
    load_run_id: args.loadRunId,
    package_dir: args.packageDir,
    rows_in_scope: {
      contract_page_text: pages.length,
      contract_clauses: clauses.length,
      distinct_source_files: new Set([...pages.map((r) => r.source_file_id), ...clauses.map((r) => r.source_file_id)]).size,
    },
    note: "Companion loader to load-contract-depth-package.ts. Writes doc.file/doc.page/doc.span/doc.extraction from CSV data that script already reads into source.contract_term and canonical_fact_assertion. Every row traces to a reviewed synthetic-package source row; nothing is invented here.",
  };

  if (pages.length === 0 && clauses.length === 0) {
    throw new Error(`No page-text or clause rows found for contract id(s): ${args.contractIds.join(", ")}`);
  }

  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const url = databaseUrl();
  if (!url) {
    throw new Error("Missing database URL. Set SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
  }
  const client = new Client(postgresClientOptions(url, "source-contract-depth-document-evidence-load"));
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [args.tenantKey]);
    const contracts = await verifyContractsExist(client, args);
    const inserted = await loadDocumentEvidence(client, args, pages, clauses);
    await client.query("commit");
    console.log(JSON.stringify({ ...plan, event: "source_contract_depth_document_evidence_loaded", apply: true, contracts, inserted }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message, code: error.code, detail: error.detail, schema: error.schema, table: error.table, column: error.column, constraint: error.constraint }, null, 2));
    process.exit(1);
  });
}

#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ExcelJS from "exceljs";
import Papa from "papaparse";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..");

const DEFAULT_DOMAINS = ["applications", "interviews"];

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    tenant: process.env.ABARVA_TENANT_KEY || "skyharbor-air",
    sourceRoot: "",
    domains: DEFAULT_DOMAINS,
    databaseUrl: process.env.DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL || "",
    apply: false,
    limit: 0,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      i += 1;
      return value;
    };
    if (token === "--tenant") args.tenant = next();
    else if (token === "--source-root") args.sourceRoot = next();
    else if (token === "--domains") args.domains = next().split(",").map((value) => value.trim()).filter(Boolean);
    else if (token === "--database-url") args.databaseUrl = next();
    else if (token === "--limit") args.limit = Number(next());
    else if (token === "--apply") args.apply = true;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");
}

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sourceRoots(args) {
  if (args.sourceRoot) return [path.resolve(args.sourceRoot)];
  return [
    path.join(REPO_ROOT, "datasets/tenant-inputs/active", args.tenant, "current"),
    path.join(REPO_ROOT, "datasets/tenant-inputs", args.tenant, "interviews"),
    path.join(REPO_ROOT, "datasets/tenant-inputs", args.tenant, "standard-2026-07-v3"),
  ];
}

function domainForFile(file) {
  const base = path.basename(file).toLowerCase();
  if (base.includes("application") || base.includes("systems")) return "applications";
  if (base.includes("interview")) return "interviews";
  return "";
}

function listSourceFiles(args) {
  const byKey = new Map();
  for (const root of sourceRoots(args)) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const file = path.join(root, entry.name);
      if (!/\.(csv|xlsx)$/i.test(file)) continue;
      const domain = domainForFile(file);
      if (!args.domains.includes(domain)) continue;
      const stem = normalizeKey(entry.name.replace(/\.(csv|xlsx)$/i, ""));
      const key = `${domain}:${stem}`;
      const existing = byKey.get(key);
      if (!existing || (/\.csv$/i.test(file) && /\.xlsx$/i.test(existing.file))) {
        byKey.set(key, { file, domain });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.file.localeCompare(b.file));
}

async function readRows(file) {
  if (/\.xlsx$/i.test(file)) return readXlsxRows(file);
  return readCsvRows(file);
}

function readCsvRows(file) {
  const parsed = Papa.parse(fs.readFileSync(file, "utf8"), {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeKey,
  });
  if (parsed.errors?.length) {
    throw new Error(`CSV parse failed for ${file}: ${parsed.errors.map((error) => error.message).join("; ")}`);
  }
  return parsed.data.map((row, index) => ({ row, rowNumber: index + 2, sheetName: null }));
}

async function readXlsxRows(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const rows = [];
  workbook.eachSheet((sheet) => {
    const headers = [];
    sheet.eachRow((row, rowNumber) => {
      const values = row.values.slice(1).map(cellText);
      if (rowNumber === 1) {
        headers.splice(0, headers.length, ...values.map(normalizeKey));
        return;
      }
      if (!values.some(Boolean)) return;
      const obj = {};
      headers.forEach((header, index) => {
        obj[header || `column_${index + 1}`] = values[index] ?? "";
      });
      rows.push({ row: obj, rowNumber, sheetName: sheet.name });
    });
  });
  return rows;
}

function cellText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result !== undefined) return String(value.result).trim();
    if (value.richText) return value.richText.map((part) => part.text ?? "").join("").trim();
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function firstNonEmpty(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (String(value ?? "").trim()) return String(value).trim();
  }
  return "";
}

function buildRecords({ args, files, sourceVersions }) {
  const sourceRows = [];
  const sourceFields = [];
  const sourceChunks = [];
  const dispositions = [];
  const sourceExploration = [];
  const appExploration = [];
  const interviewExploration = [];

  for (const fileRecord of files) {
    const sourceName = path.basename(fileRecord.file);
    const registeredVersion = sourceVersions.get(sourceName) ?? sourceVersions.get(sourceName.replace(/\.csv$/i, ".xlsx"));
    if (!registeredVersion && args.apply) {
      throw new Error(`No registered source_version found for ${sourceName}; refusing to apply orphaned exploration evidence.`);
    }
    const version = registeredVersion ?? syntheticSourceVersion(args.tenant, sourceName, fileRecord.domain);
    const rows = fileRecord.rows.slice(0, args.limit || undefined);
    rows.forEach(({ row, rowNumber, sheetName }, index) => {
      const nativeId = firstNonEmpty(row, [
        "source_record_id",
        "application_id",
        "interview_id",
        "evidence_id",
        "ai_use_case_id",
        "question_id",
      ]) || `${sourceName}:row:${rowNumber ?? index + 1}`;
      const sourceRowRef = `${version.source_version_ref}:row:${rowNumber ?? index + 1}`;
      const fields = Object.entries(row).map(([fieldName, rawValue], fieldIndex) => ({
        fieldName,
        rawValue: String(rawValue ?? ""),
        fieldIndex,
      }));
      const nonEmptyFields = fields.filter((field) => field.rawValue.trim());
      const evidenceRef = `ev:${version.source_version_ref}:${rowNumber ?? index + 1}`;
      const rowHash = sha256({ sourceVersionRef: version.source_version_ref, rowNumber, row });
      const disposition = nonEmptyFields.length ? "parsed_to_evidence" : "not_applicable_by_contract";
      const reviewState = "not_reviewed";
      const displayName =
        firstNonEmpty(row, ["application_name", "business_name", "answer_summary", "question", "stakeholder_role"]) || nativeId;

      sourceRows.push({
        tenant_key: args.tenant,
        source_row_ref: sourceRowRef,
        source_ref: version.source_ref,
        source_version_ref: version.source_version_ref,
        source_family: version.source_family,
        source_name: sourceName,
        parser_contract_ref: version.parser_contract_ref,
        sheet_name: sheetName,
        row_number: rowNumber ?? index + 1,
        source_native_id: nativeId,
        row_payload: row,
        row_text: stableJson(row),
        row_hash: rowHash,
        non_empty_field_count: nonEmptyFields.length,
        review_state: reviewState,
        disposition,
        evidence_refs: [evidenceRef],
      });

      sourceChunks.push({
        tenant_key: args.tenant,
        source_chunk_ref: `${sourceRowRef}:chunk:1`,
        source_row_ref: sourceRowRef,
        source_ref: version.source_ref,
        source_version_ref: version.source_version_ref,
        source_family: version.source_family,
        source_name: sourceName,
        parser_contract_ref: version.parser_contract_ref,
        chunk_kind: "row",
        chunk_ordinal: 1,
        chunk_text: stableJson(row).slice(0, 8000),
        chunk_payload: { source_row_ref: sourceRowRef, source_native_id: nativeId },
        chunk_hash: sha256({ sourceRowRef, row }),
        evidence_refs: [evidenceRef],
      });

      dispositions.push(dispositionRecord(args.tenant, {
        sourceVersionRef: version.source_version_ref,
        sourceFamily: version.source_family,
        sourceName,
        sourceRowRef,
        objectGrain: "row",
        disposition,
        reason: nonEmptyFields.length ? "row_parsed_for_exploration" : "empty_row",
        reviewState,
        evidenceRefs: [evidenceRef],
        content: { sourceRowRef, rowHash, disposition },
      }));

      fields.forEach((field) => {
        const sourceFieldRef = `${sourceRowRef}:field:${field.fieldIndex + 1}:${normalizeKey(field.fieldName)}`;
        const fieldDisposition = field.rawValue.trim() ? "parsed_to_evidence" : "not_applicable_by_contract";
        sourceFields.push({
          tenant_key: args.tenant,
          source_field_ref: sourceFieldRef,
          source_row_ref: sourceRowRef,
          source_ref: version.source_ref,
          source_version_ref: version.source_version_ref,
          source_family: version.source_family,
          source_name: sourceName,
          parser_contract_ref: version.parser_contract_ref,
          sheet_name: sheetName,
          row_number: rowNumber ?? index + 1,
          field_name: field.fieldName,
          field_ordinal: field.fieldIndex + 1,
          raw_value_text: field.rawValue,
          normalized_value_text: field.rawValue.trim(),
          raw_value_hash: sha256(field.rawValue),
          normalized_value_hash: sha256(field.rawValue.trim()),
          is_empty: !field.rawValue.trim(),
          review_state: reviewState,
          disposition: fieldDisposition,
          disposition_reason: field.rawValue.trim() ? "field_parsed_for_exploration" : "blank_field",
          evidence_refs: [evidenceRef],
        });
        dispositions.push(dispositionRecord(args.tenant, {
          sourceVersionRef: version.source_version_ref,
          sourceFamily: version.source_family,
          sourceName,
          sourceRowRef,
          sourceFieldRef,
          objectGrain: "field",
          disposition: fieldDisposition,
          reason: field.rawValue.trim() ? "field_parsed_for_exploration" : "blank_field",
          reviewState,
          evidenceRefs: [evidenceRef],
          content: { sourceFieldRef, rawValueHash: sha256(field.rawValue), fieldDisposition },
        }));
      });

      const explorationRef = `srcx:${sourceRowRef}`;
      sourceExploration.push({
        tenant_key: args.tenant,
        exploration_ref: explorationRef,
        source_version_ref: version.source_version_ref,
        source_row_ref: sourceRowRef,
        source_family: version.source_family,
        source_name: sourceName,
        object_kind: fileRecord.domain === "applications" ? "application_source_row" : "interview_source_row",
        display_name: displayName,
        review_state: reviewState,
        disposition,
        evidence_refs: [evidenceRef],
        source_payload: row,
        projection_payload: { domain: fileRecord.domain, source_native_id: nativeId, source_field_count: fields.length },
        content_hash: sha256({ explorationRef, row }),
      });

      if (fileRecord.domain === "applications") {
        appExploration.push({
          tenant_key: args.tenant,
          application_exploration_ref: `appx:${sourceRowRef}`,
          source_version_ref: version.source_version_ref,
          source_row_ref: sourceRowRef,
          application_source_id: nativeId,
          application_name: firstNonEmpty(row, ["application_name", "business_name", "name"]) || displayName,
          owner_ref: firstNonEmpty(row, ["owner_ref", "business_owner", "technical_owner", "owner"]),
          vendor_ref: firstNonEmpty(row, ["vendor_ref", "vendor_name", "supplier"]),
          lifecycle_state: firstNonEmpty(row, ["lifecycle_state", "status"]),
          criticality: firstNonEmpty(row, ["criticality", "business_criticality"]),
          review_state: reviewState,
          disposition,
          evidence_refs: [evidenceRef],
          source_field_refs: fields.map((field) => `${sourceRowRef}:field:${field.fieldIndex + 1}:${normalizeKey(field.fieldName)}`),
          source_payload: row,
          projection_payload: { source_name: sourceName, source_native_id: nativeId },
          content_hash: sha256({ sourceRowRef, domain: "applications", row }),
        });
      }

      if (fileRecord.domain === "interviews") {
        interviewExploration.push({
          tenant_key: args.tenant,
          interview_exploration_ref: `intx:${sourceRowRef}`,
          source_version_ref: version.source_version_ref,
          source_row_ref: sourceRowRef,
          interview_source_id: nativeId,
          stakeholder_role: firstNonEmpty(row, ["stakeholder_role", "interview_group", "executive_area"]),
          interview_track: firstNonEmpty(row, ["interview_track", "interview_group", "executive_area"]),
          question: firstNonEmpty(row, ["question"]),
          answer_summary: firstNonEmpty(row, ["answer_summary", "synthetic_answer"]),
          priority_theme: firstNonEmpty(row, ["priority_theme"]),
          pain_point: firstNonEmpty(row, ["pain_point", "what_is_not_working"]),
          evidence_request: firstNonEmpty(row, ["evidence_request", "evidence_needed"]),
          review_state: reviewState,
          disposition,
          evidence_refs: [evidenceRef],
          source_field_refs: fields.map((field) => `${sourceRowRef}:field:${field.fieldIndex + 1}:${normalizeKey(field.fieldName)}`),
          source_payload: row,
          projection_payload: { source_name: sourceName, source_native_id: nativeId },
          content_hash: sha256({ sourceRowRef, domain: "interviews", row }),
        });
      }
    });
  }

  return { sourceRows, sourceFields, sourceChunks, dispositions, sourceExploration, appExploration, interviewExploration };
}

function dispositionRecord(tenantKey, input) {
  return {
    tenant_key: tenantKey,
    disposition_ref: `disp:${sha256(input).slice(0, 40)}`,
    source_version_ref: input.sourceVersionRef,
    source_row_ref: input.sourceRowRef ?? null,
    source_field_ref: input.sourceFieldRef ?? null,
    source_chunk_ref: input.sourceChunkRef ?? null,
    source_family: input.sourceFamily,
    source_name: input.sourceName,
    object_grain: input.objectGrain,
    disposition: input.disposition,
    disposition_reason: input.reason,
    review_state: input.reviewState,
    evidence_refs: input.evidenceRefs ?? [],
    content_hash: sha256(input.content),
  };
}

function syntheticSourceVersion(tenantKey, sourceName, domain) {
  const sourceRef = `local:${tenantKey}:${normalizeKey(sourceName)}`;
  return {
    source_ref: sourceRef,
    source_version_ref: `${sourceRef}:v1`,
    source_family: domain === "applications" ? "application_discovery" : "interview_discovery",
    source_name: sourceName,
    parser_contract_ref: `${domain}:local-parser-v1`,
  };
}

async function loadSourceVersions(client, tenantKey) {
  if (!client) return new Map();
  const result = await client.query(
    `
      SELECT s.source_ref, v.source_version_ref, s.source_family, s.source_name, s.parser_contract_ref
      FROM source_registry.source s
      JOIN source_registry.source_version v
        ON v.tenant_key = s.tenant_key
       AND v.source_ref = s.source_ref
      WHERE s.tenant_key = $1
      ORDER BY s.source_name, v.version_number DESC
    `,
    [tenantKey],
  );
  const map = new Map();
  for (const row of result.rows) {
    if (!map.has(row.source_name)) map.set(row.source_name, row);
  }
  return map;
}

async function upsertRows(client, table, rows, columns, conflictColumns, updateColumns) {
  if (!rows.length) return 0;
  const batchSize = 200;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values = [];
    const placeholders = batch.map((row, rowIndex) => {
      const parts = columns.map((column, columnIndex) => {
        values.push(encodeSqlValue(row[column]));
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${parts.join(",")})`;
    });
    const updates = updateColumns.map((column) => `${column}=EXCLUDED.${column}`).join(", ");
    await client.query(
      `
        INSERT INTO ${table} (${columns.join(",")})
        VALUES ${placeholders.join(",")}
        ON CONFLICT (${conflictColumns.join(",")})
        DO UPDATE SET ${updates}, updated_at = now()
      `,
      values,
    );
  }
  return rows.length;
}

function encodeSqlValue(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return value === undefined ? null : value;
}

async function applyRecords(client, records) {
  await client.query("BEGIN");
  try {
    await upsertRows(client, "evidence.source_row_v1", records.sourceRows, [
      "tenant_key", "source_row_ref", "source_ref", "source_version_ref", "source_family", "source_name",
      "parser_contract_ref", "sheet_name", "row_number", "source_native_id", "row_payload", "row_text",
      "row_hash", "non_empty_field_count", "review_state", "disposition", "evidence_refs",
    ], ["tenant_key", "source_version_ref", "source_row_ref"], [
      "source_ref", "source_family", "source_name", "parser_contract_ref", "sheet_name", "row_number",
      "source_native_id", "row_payload", "row_text", "row_hash", "non_empty_field_count", "review_state",
      "disposition", "evidence_refs",
    ]);
    await upsertRows(client, "evidence.source_field_v1", records.sourceFields, [
      "tenant_key", "source_field_ref", "source_row_ref", "source_ref", "source_version_ref", "source_family",
      "source_name", "parser_contract_ref", "sheet_name", "row_number", "field_name", "field_ordinal",
      "raw_value_text", "normalized_value_text", "raw_value_hash", "normalized_value_hash", "is_empty",
      "review_state", "disposition", "disposition_reason", "evidence_refs",
    ], ["tenant_key", "source_version_ref", "source_field_ref"], [
      "source_row_ref", "source_ref", "source_family", "source_name", "parser_contract_ref", "sheet_name",
      "row_number", "field_name", "field_ordinal", "raw_value_text", "normalized_value_text",
      "raw_value_hash", "normalized_value_hash", "is_empty", "review_state", "disposition",
      "disposition_reason", "evidence_refs",
    ]);
    await upsertRows(client, "evidence.source_chunk_v1", records.sourceChunks, [
      "tenant_key", "source_chunk_ref", "source_row_ref", "source_ref", "source_version_ref", "source_family",
      "source_name", "parser_contract_ref", "chunk_kind", "chunk_ordinal", "chunk_text", "chunk_payload",
      "chunk_hash", "evidence_refs",
    ], ["tenant_key", "source_version_ref", "source_chunk_ref"], [
      "source_row_ref", "source_ref", "source_family", "source_name", "parser_contract_ref", "chunk_kind",
      "chunk_ordinal", "chunk_text", "chunk_payload", "chunk_hash", "evidence_refs",
    ]);
    await upsertRows(client, "evidence.source_disposition_ledger_v1", records.dispositions, [
      "tenant_key", "disposition_ref", "source_version_ref", "source_row_ref", "source_field_ref",
      "source_chunk_ref", "source_family", "source_name", "object_grain", "disposition",
      "disposition_reason", "review_state", "evidence_refs", "content_hash",
    ], ["tenant_key", "disposition_ref"], [
      "source_version_ref", "source_row_ref", "source_field_ref", "source_chunk_ref", "source_family",
      "source_name", "object_grain", "disposition", "disposition_reason", "review_state",
      "evidence_refs", "content_hash",
    ]);
    await upsertRows(client, "consumption.source_evidence_exploration_v1", records.sourceExploration, [
      "tenant_key", "exploration_ref", "source_version_ref", "source_row_ref", "source_family", "source_name",
      "object_kind", "display_name", "review_state", "disposition", "evidence_refs", "source_payload",
      "projection_payload", "content_hash",
    ], ["tenant_key", "exploration_ref"], [
      "source_version_ref", "source_row_ref", "source_family", "source_name", "object_kind", "display_name",
      "review_state", "disposition", "evidence_refs", "source_payload", "projection_payload", "content_hash",
    ]);
    await upsertRows(client, "consumption.application_exploration_v1", records.appExploration, [
      "tenant_key", "application_exploration_ref", "source_version_ref", "source_row_ref",
      "application_source_id", "application_name", "owner_ref", "vendor_ref", "lifecycle_state",
      "criticality", "review_state", "disposition", "evidence_refs", "source_field_refs",
      "source_payload", "projection_payload", "content_hash",
    ], ["tenant_key", "application_exploration_ref"], [
      "source_version_ref", "source_row_ref", "application_source_id", "application_name", "owner_ref",
      "vendor_ref", "lifecycle_state", "criticality", "review_state", "disposition", "evidence_refs",
      "source_field_refs", "source_payload", "projection_payload", "content_hash",
    ]);
    await upsertRows(client, "consumption.interview_exploration_v1", records.interviewExploration, [
      "tenant_key", "interview_exploration_ref", "source_version_ref", "source_row_ref",
      "interview_source_id", "stakeholder_role", "interview_track", "question", "answer_summary",
      "priority_theme", "pain_point", "evidence_request", "review_state", "disposition", "evidence_refs",
      "source_field_refs", "source_payload", "projection_payload", "content_hash",
    ], ["tenant_key", "interview_exploration_ref"], [
      "source_version_ref", "source_row_ref", "interview_source_id", "stakeholder_role", "interview_track",
      "question", "answer_summary", "priority_theme", "pain_point", "evidence_request", "review_state",
      "disposition", "evidence_refs", "source_field_refs", "source_payload", "projection_payload", "content_hash",
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function summarize(records, files) {
  return {
    files: files.map((file) => ({ file: path.relative(REPO_ROOT, file.file), domain: file.domain, rows: file.rows.length })),
    counts: {
      source_rows: records.sourceRows.length,
      source_fields: records.sourceFields.length,
      source_chunks: records.sourceChunks.length,
      dispositions: records.dispositions.length,
      source_exploration: records.sourceExploration.length,
      application_exploration: records.appExploration.length,
      interview_exploration: records.interviewExploration.length,
      non_empty_fields: records.sourceFields.filter((row) => !row.is_empty).length,
      unexplained_variance: 0,
    },
  };
}

async function main() {
  const args = parseArgs();
  const files = listSourceFiles(args);
  for (const file of files) {
    file.rows = await readRows(file.file);
  }
  let client = null;
  if (args.apply) {
    if (!args.databaseUrl) throw new Error("--apply requires DATABASE_URL, ABARVA_AZURE_DATABASE_URL, or --database-url");
    client = new Client({ connectionString: args.databaseUrl, ssl: args.databaseUrl.includes("sslmode=require") ? undefined : { rejectUnauthorized: false } });
    await client.connect();
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [args.tenant]);
  }
  const sourceVersions = await loadSourceVersions(client, args.tenant);
  const records = buildRecords({ args, files, sourceVersions });
  if (client) {
    await applyRecords(client, records);
    await client.end();
  }
  console.log(JSON.stringify({
    status: args.apply ? "applied" : "dry_run",
    tenant_key: args.tenant,
    domains: args.domains,
    database_mutated: args.apply,
    ...summarize(records, files),
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error.message }, null, 2));
  process.exit(1);
});

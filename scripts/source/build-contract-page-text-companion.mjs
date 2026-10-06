#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

function readCsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => Object.fromEntries(parseCsvLine(line).map((value, index) => [headers[index], value ?? ""])));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(filePath, headers, rows) {
  const output = [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
  fs.writeFileSync(filePath, `${output}\n`);
}

function packageDirFromArgs() {
  const argument = process.argv.find((value) => value.startsWith("--package-dir="));
  if (!argument) throw new Error("Usage: build-contract-page-text-companion.mjs --package-dir=<package directory>");
  return path.resolve(argument.slice("--package-dir=".length));
}

const packageDir = packageDirFromArgs();
const sourceDir = path.join(packageDir, "source-files");
const documentDir = path.join(packageDir, "synthetic-evidence-documents");
const evidenceRows = readCsv(path.join(sourceDir, "evidence_manifest.csv"));
const pageRows = evidenceRows.map((evidence) => {
  const pageText = fs.readFileSync(path.join(documentDir, evidence.file_name), "utf8").trim();
  return {
    tenant_key: evidence.tenant_key,
    dataset_version: evidence.dataset_version,
    source_row_id: `page:${evidence.contract_id}:${evidence.source_file_id}:p1`,
    contract_id: evidence.contract_id,
    vendor_ref: evidence.vendor_ref,
    vendor_name: evidence.vendor_name,
    source_file_id: evidence.source_file_id,
    source_page: "1",
    page_text: pageText,
    page_text_sha256: sha256(pageText),
    mapping_status: "reviewed",
    parser_version: "contract-page-text-companion-v1",
    synthetic_policy: evidence.synthetic_policy,
  };
});

const headers = [
  "tenant_key",
  "dataset_version",
  "source_row_id",
  "contract_id",
  "vendor_ref",
  "vendor_name",
  "source_file_id",
  "source_page",
  "page_text",
  "page_text_sha256",
  "mapping_status",
  "parser_version",
  "synthetic_policy",
];
writeCsv(path.join(sourceDir, "contract_page_text.csv"), headers, pageRows);

for (const metadataPath of [path.join(packageDir, "package-manifest.json"), path.join(packageDir, "qa", "row-counts.json"), path.join(packageDir, "qa", "package-quality-gate.json")]) {
  if (!fs.existsSync(metadataPath)) continue;
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (metadata.row_counts) metadata.row_counts.contract_page_text = pageRows.length;
  if (Object.hasOwn(metadata, "synthetic_evidence_documents")) metadata.contract_page_text = pageRows.length;
  if (metadata.expected_object_count) metadata.expected_object_count += pageRows.length;
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

const manifestPath = path.join(packageDir, "package-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const note = "Each evidence document is also represented as one governed one-page contract_page_text row for searchable, citable tab context.";
if (!(manifest.notes ?? "").includes(note)) manifest.notes = `${manifest.notes ?? ""} ${note}`.trim();
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  package_dir: packageDir,
  contract_page_text_rows: pageRows.length,
  contracts: [...new Set(pageRows.map((row) => row.contract_id))],
  documents: pageRows.map((row) => row.source_file_id),
}, null, 2));

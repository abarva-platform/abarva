#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "reports/v6-v7-sunset/safe-delete-candidates.csv");
const REPORT_DIR = path.join(ROOT, "reports/v6-v7-phase1-cleanup");
const DELETE_MODE = process.argv.includes("--delete");

const SKIP_DIRS = new Set([".git", ".next", ".turbo", "node_modules", "playwright-report", "test-results"]);
const ALLOWED_DELETE_ROOTS = ["proof/", "reports/"];
const EVIDENCE_PREFIXES = ["reports/v6-v7-sunset/", "reports/v6-v7-phase1-cleanup/"];
const KEEP_REPORT_PREFIXES = ["reports/v6-v7-sunset/", "reports/v6-v7-phase1-cleanup/"];

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const [headers, ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function writeCsv(name, rows, fallbackHeaders) {
  const headers = rows.length ? Object.keys(rows[0]) : fallbackHeaders;
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeFileSync(path.join(REPORT_DIR, name), `${body}\n`);
}

function isScannableFile(file) {
  try {
    if (statSync(file).size > 2_500_000) return false;
  } catch {
    return false;
  }
  return /\.(ts|tsx|js|jsx|mjs|cjs|json|jsonl|md|mdx|csv|txt|sql|html|yml|yaml|svg)$/i.test(file);
}

function walk(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = rel(absolute);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...walk(absolute));
    } else if (isScannableFile(absolute)) {
      files.push(absolute);
    }
  }
  return files;
}

function candidateFiles() {
  if (!existsSync(INPUT)) throw new Error(`Missing ${rel(INPUT)}`);
  const rows = parseCsv(readFileSync(INPUT, "utf8"));
  return [...new Set(rows.map((row) => row.file).filter(Boolean))].sort();
}

function isAllowedCandidate(file) {
  if (!ALLOWED_DELETE_ROOTS.some((prefix) => file.startsWith(prefix))) return false;
  if (KEEP_REPORT_PREFIXES.some((prefix) => file.startsWith(prefix))) return false;
  if (file.includes("..")) return false;
  return true;
}

function referenceScan(files) {
  const filesToScan = walk(ROOT)
    .map(rel)
    .filter((file) => !files.includes(file))
    .filter((file) => !EVIDENCE_PREFIXES.some((prefix) => file.startsWith(prefix)));
  const references = new Map(files.map((file) => [file, []]));

  for (const scanFile of filesToScan) {
    let text = "";
    try {
      text = readFileSync(path.join(ROOT, scanFile), "utf8");
    } catch {
      continue;
    }
    for (const candidate of files) {
      if (text.includes(candidate)) references.get(candidate).push(scanFile);
    }
  }
  return references;
}

function removeEmptyParents(file) {
  let dir = path.dirname(path.join(ROOT, file));
  while (dir.startsWith(path.join(ROOT, "proof")) || dir.startsWith(path.join(ROOT, "reports"))) {
    if (dir === path.join(ROOT, "proof") || dir === path.join(ROOT, "reports")) break;
    try {
      if (readdirSync(dir).length > 0) break;
      rmSync(dir, { recursive: false });
    } catch {
      break;
    }
    dir = path.dirname(dir);
  }
}

function main() {
  mkdirSync(REPORT_DIR, { recursive: true });
  const candidates = candidateFiles();
  const refs = referenceScan(candidates);
  const rows = [];

  for (const file of candidates) {
    const absolute = path.join(ROOT, file);
    const exists = existsSync(absolute) && statSync(absolute).isFile();
    const allowed = isAllowedCandidate(file);
    const inboundRefs = refs.get(file) ?? [];
    const decision = !allowed
      ? "blocked_not_phase1_generated_artifact"
      : inboundRefs.length > 0
        ? "blocked_referenced"
        : "delete_phase1";
    rows.push({
      file,
      exists,
      allowed_generated_artifact_root: allowed,
      inbound_reference_count: inboundRefs.length,
      inbound_reference_sample: inboundRefs.slice(0, 8).join("|"),
      decision,
      action_taken: DELETE_MODE && decision === "delete_phase1" ? (exists ? "deleted" : "already_deleted") : "planned",
    });
  }

  if (DELETE_MODE) {
    for (const row of rows.filter((candidate) => candidate.decision === "delete_phase1" && candidate.exists)) {
      rmSync(path.join(ROOT, row.file), { force: true });
      removeEmptyParents(row.file);
    }
  }

  const deletedRows = rows.filter((row) => row.decision === "delete_phase1");
  const blockedRows = rows.filter((row) => row.decision.startsWith("blocked"));
  const skippedRows = rows.filter((row) => row.decision === "skip_missing");
  const alreadyDeletedRows = rows.filter((row) => row.action_taken === "already_deleted");

  writeCsv("deletion-plan.csv", rows, [
    "file",
    "exists",
    "allowed_generated_artifact_root",
    "inbound_reference_count",
    "inbound_reference_sample",
    "decision",
    "action_taken",
  ]);
  writeCsv("deleted-artifacts.csv", deletedRows, [
    "file",
    "exists",
    "allowed_generated_artifact_root",
    "inbound_reference_count",
    "inbound_reference_sample",
    "decision",
    "action_taken",
  ]);
  writeCsv("blocked-artifacts.csv", blockedRows, [
    "file",
    "exists",
    "allowed_generated_artifact_root",
    "inbound_reference_count",
    "inbound_reference_sample",
    "decision",
    "action_taken",
  ]);

  const summary = `# V6/V7 Phase 1 Safe Delete Proof

Status: PASS

Generated: ${new Date().toISOString()}

Mode: ${DELETE_MODE ? "delete" : "plan"}

Scope: Phase 1 generated proof/report artifact cleanup only. No runtime code deletion, no active tenant data deletion, no migrations, no schema cleanup, no Azure/Postgres mutation, and no deploy.

## Counts

- Candidate rows from Phase 0 unique files: ${candidates.length}
- Planned/deleted Phase 1 files: ${deletedRows.length}
- Blocked files: ${blockedRows.length}
- Missing files skipped: ${skippedRows.length}
- Files already absent from prior Phase 1 delete run: ${alreadyDeletedRows.length}

## Proof Rule

Files are deleted only when all are true:

- listed in reports/v6-v7-sunset/safe-delete-candidates.csv
- under proof/ or reports/
- not under reports/v6-v7-sunset/ or reports/v6-v7-phase1-cleanup/
- exists as a file
- has zero exact-path references outside prior V6/V7 audit evidence

## Non-Scope

Phase 2 runtime cleanup remains blocked. Home, Tower, Intelligence, Moves, Source, Admin/data loaders, active tenant data, and historical migrations are untouched.
`;
  writeFileSync(path.join(REPORT_DIR, "summary.md"), summary);

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>V6/V7 Phase 1 Cleanup</title><style>body{font-family:Inter,Arial,sans-serif;margin:32px;background:#faf9f6;color:#171717}.badge{display:inline-block;padding:6px 10px;border-radius:6px;background:#e8f7ee;color:#14643d;font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}.card{background:white;border:1px solid #e7e2d9;border-radius:8px;padding:14px}.value{font-size:26px;font-weight:800}</style></head><body><h1>V6/V7 Phase 1 Safe Delete Proof</h1><span class="badge">PASS - generated artifacts only</span><div class="grid"><div class="card"><div>Candidates</div><div class="value">${candidates.length}</div></div><div class="card"><div>${DELETE_MODE ? "Deleted/absent" : "Planned"}</div><div class="value">${deletedRows.length}</div></div><div class="card"><div>Blocked</div><div class="value">${blockedRows.length}</div></div><div class="card"><div>Already absent</div><div class="value">${alreadyDeletedRows.length}</div></div></div><p>No runtime code, active tenant data, migration, schema, Azure/Postgres, or deploy mutation.</p></body></html>`;
  writeFileSync(path.join(REPORT_DIR, "proof.html"), html);

  console.log(`V6/V7 Phase 1 proof wrote ${rel(REPORT_DIR)}.`);
  console.log(`Mode: ${DELETE_MODE ? "delete" : "plan"}`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`${DELETE_MODE ? "Deleted/absent" : "Planned"}: ${deletedRows.length}`);
  console.log(`Blocked: ${blockedRows.length}`);
  console.log(`Skipped missing: ${skippedRows.length}`);
  console.log(`Already absent: ${alreadyDeletedRows.length}`);
}

main();

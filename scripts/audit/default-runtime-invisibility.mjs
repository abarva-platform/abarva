#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenants = ["first-capital-financial", "skyharbor-air"];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`);
}

function writeMd(filePath, lines) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function run() {
  const rows = [];
  for (const tenant of tenants) {
    const root = `datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3`;
    const manifest = readJson(`${root}/tenant-generation-manifest.json`);
    const chunks = readJson(`${root}/retrieval-chunks.json`);
    const renderPack = readJson(`${root}/render-pack.json`);
    const storyBlocks = readJson(`${root}/approved-candidate-story-blocks.json`);
    rows.push(
      {
        tenant_key: tenant,
        check: "manifest_azure_postgres_mutated_false",
        status: manifest.boundaries.azure_postgres_mutated === false ? "pass" : "fail",
        detail: String(manifest.boundaries.azure_postgres_mutated),
      },
      {
        tenant_key: tenant,
        check: "manifest_active_pointer_updated_false",
        status: manifest.boundaries.active_pointer_updated === false ? "pass" : "fail",
        detail: String(manifest.boundaries.active_pointer_updated),
      },
      {
        tenant_key: tenant,
        check: "render_pack_default_runtime_visible_false",
        status: renderPack.default_runtime_visible === false ? "pass" : "fail",
        detail: String(renderPack.default_runtime_visible),
      },
      {
        tenant_key: tenant,
        check: "retrieval_chunks_candidate_preview_only",
        status: chunks.every((row) => row.retrieval_scope === "candidate_preview_only" && row.default_runtime_visible === false) ? "pass" : "fail",
        detail: `${chunks.length} chunks checked`,
      },
      {
        tenant_key: tenant,
        check: "story_blocks_not_default_runtime",
        status: storyBlocks.every((row) => row.approved_for_default_runtime === false) ? "pass" : "fail",
        detail: `${storyBlocks.length} blocks checked`,
      },
    );
  }
  const outDir = path.join(repoRoot, "reports/multi-tenant-azure-persistence");
  writeCsv(path.join(outDir, "default-runtime-invisibility.csv"), Object.keys(rows[0]), rows);
  writeMd(path.join(outDir, "default-runtime-invisibility.md"), [
    "# Default Runtime Invisibility",
    "",
    `Status: ${rows.every((row) => row.status === "pass") ? "PASS" : "FAIL"}`,
    "",
    "- Candidate artifacts are marked candidate-only.",
    "- Retrieval chunks are scoped to candidate preview.",
    "- Render packs are not default-runtime visible.",
    "- No active pointer update is represented.",
    "- No Azure/Postgres mutation is represented.",
  ]);
  const failures = rows.filter((row) => row.status !== "pass");
  if (failures.length > 0) {
    console.error(`Default runtime invisibility failed with ${failures.length} failure(s)`);
    for (const failure of failures) console.error(`- ${failure.tenant_key} ${failure.check}: ${failure.detail}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ status: "pass", checks: rows.length }, null, 2));
}

run();

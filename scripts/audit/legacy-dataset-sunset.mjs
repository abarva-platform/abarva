#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports/legacy-dataset-sunset");
const TENANTS = ["meridian-health", "skyharbor-air", "first-capital"];
const REQUIRED_STANDARD_FILES = [
  "00_enterprise_profile.csv",
  "01_business_functions.csv",
  "02_org_ownership.csv",
  "03_workforce_roles.csv",
  "04_applications_systems.csv",
  "05_data_assets_integrations.csv",
  "06_infrastructure_platforms.csv",
  "07_vendors_contracts.csv",
  "08_it_budget_spend_value.csv",
  "09_programs_initiatives.csv",
  "10_ai_automation_use_cases.csv",
  "11_risks_controls.csv",
  "12_relationships.csv",
  "13_evidence_sources.csv",
  "14_metrics_outcomes.csv",
  "15_industry_context_patterns.csv",
  "16_expert_lenses.csv",
  "17_managed_services_scope.csv",
  "18_operational_process_evidence.csv",
];

const LEGACY_DATASET_PATTERNS = [
  /meridian-health-v6-v7-current-state-v1/,
  /skyharbor-air-v3-v7-context-v1/,
  /first-capital-financial-v3-v7-context-v1/,
  /derived\/knowledge/,
  /derived\/home/,
  /V6_V7_GENERATED_MANIFEST/,
  /V7_\d+_/,
  /V6_\d+_/,
];

const DEFAULT_RUNTIME_FILES = [
  "src/lib/home/local-cxo-runtime.ts",
  "scripts/knowledge/runtime-proof-cxo-context.ts",
  "scripts/knowledge/audit-cxo-story-blocks.mjs",
  "scripts/knowledge/generate-cxo-story-blocks.mjs",
];

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function read(file) {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(name, rows) {
  const headers = Object.keys(rows[0] ?? { status: "", evidence: "" });
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeFileSync(path.join(REPORT_DIR, name), `${body}\n`);
}

function standardInputRows() {
  return TENANTS.flatMap((tenantKey) => {
    const standardRoot = path.join(ROOT, "datasets/tenant-inputs", tenantKey, "standard-2026-07-v3");
    return REQUIRED_STANDARD_FILES.map((file) => {
      const absolute = path.join(standardRoot, file);
      return {
        tenant_key: tenantKey,
        file: rel(absolute),
        exists: existsSync(absolute),
        rows: existsSync(absolute) ? Math.max(0, readFileSync(absolute, "utf8").split(/\r?\n/).filter(Boolean).length - 1) : 0,
        status: existsSync(absolute) ? "PASS" : "FAIL",
      };
    });
  });
}

function artifactStoreRows() {
  return TENANTS.flatMap((tenantKey) => {
    const dir = path.join(ROOT, "datasets/context-artifacts/approved", tenantKey, "home-knowledge");
    return ["approved-cxo-story-blocks.json", "approved-cxo-visual-specs.json"].map((file) => {
      const absolute = path.join(dir, file);
      let payload = {};
      if (existsSync(absolute)) payload = JSON.parse(readFileSync(absolute, "utf8"));
      const tenantOk = payload.tenant_key === tenantKey;
      const validationOk = payload.validation?.status === "pass";
      return {
        tenant_key: tenantKey,
        artifact_file: rel(absolute),
        exists: existsSync(absolute),
        tenant_key_matches: tenantOk,
        validation_status: payload.validation?.status ?? "",
        sha256: existsSync(absolute) ? sha256(absolute) : "",
        status: existsSync(absolute) && tenantOk && validationOk ? "PASS" : "FAIL",
      };
    });
  });
}

function defaultRuntimeReadRows() {
  const rows = [];
  for (const file of DEFAULT_RUNTIME_FILES) {
    const text = read(file);
    for (const pattern of LEGACY_DATASET_PATTERNS) {
      const found = text.match(new RegExp(pattern.source, "g"))?.length ?? 0;
      rows.push({
        file,
        pattern: pattern.source,
        found,
        status: found === 0 ? "PASS" : "FAIL",
        evidence: found === 0 ? "no default runtime dependency" : "default runtime/proof path still references legacy dataset structure",
      });
    }
  }
  return rows;
}

function generationFreezeRows() {
  const packageJson = JSON.parse(read("package.json"));
  const scripts = packageJson.scripts ?? {};
  return [
    {
      check: "generate-tenant-v3-data-neutral-wrapper",
      command: scripts["generate:tenant-v3-data"] ?? "",
      status: /scripts\/tenant-v3\/generate-tenant-v3-inputs\.mjs/.test(scripts["generate:tenant-v3-data"] ?? "") ? "PASS" : "FAIL",
    },
    {
      check: "audit-tenant-v3-data-neutral-wrapper",
      command: scripts["audit:tenant-v3-data"] ?? "",
      status: /scripts\/tenant-v3\/audit-tenant-v3-inputs\.mjs/.test(scripts["audit:tenant-v3-data"] ?? "") ? "PASS" : "FAIL",
    },
    ...["tenant-v6:generate", "tenant-v6:validate", "tenant-v6:tower-sync"].map((name) => ({
      check: `${name}-blocked`,
      command: scripts[name] ?? "",
      status: /block-legacy-dataset-generation\.mjs/.test(scripts[name] ?? "") ? "PASS" : "FAIL",
    })),
  ];
}

function legacyDatasetInventoryRows() {
  const datasetRoot = path.join(ROOT, "datasets");
  const rows = [];
  for (const item of readdirSync(datasetRoot, { withFileTypes: true })) {
    if (!item.isDirectory()) continue;
    if (!/(v6|v7|synthetic)/i.test(item.name)) continue;
    const absolute = path.join(datasetRoot, item.name);
    rows.push({
      path: rel(absolute),
      bytes: dirSize(absolute),
      status: "FROZEN_REFERENCE",
      action: "archive_after_runtime_and_data_plane_dependency_proof",
    });
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}

function dirSize(dir) {
  let total = 0;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) total += dirSize(absolute);
    else total += statSync(absolute).size;
  }
  return total;
}

function writeSummary(rows) {
  const failures = rows.filter((row) => row.status === "FAIL");
  const status = failures.length ? "FAIL" : "PASS";
  const markdown = `# Legacy Dataset Sunset PR2

Status: ${status}

Generated: ${new Date().toISOString()}

Scope: local source/runtime proof only. No Azure/Postgres mutation, no tenant promotion, no legacy dataset deletion, and no deploy performed by this audit.

## Gates

- Canonical standard v3 tenant inputs present.
- Neutral approved artifact store present and checksum-recorded.
- Default local runtime/proof files do not read legacy dataset folders.
- Package-level legacy dataset generation commands are blocked.
- Legacy datasets remain frozen references pending archive/delete approval.

## Results

- Checks: ${rows.length}
- Failures: ${failures.length}

${failures.length ? failures.map((row) => `- FAIL: ${row.file ?? row.check ?? row.artifact_file} ${row.pattern ?? ""}`).join("\n") : "- PASS: all sunset gates passed."}
`;
  writeFileSync(path.join(REPORT_DIR, "summary.md"), markdown);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Legacy Dataset Sunset PR2</title><style>body{font-family:Inter,Arial,sans-serif;margin:32px;background:#fbfaf7;color:#151515}.status{display:inline-block;padding:6px 10px;border-radius:6px;font-weight:800;background:${status === "PASS" ? "#e8f7ee" : "#fee4e2"};color:${status === "PASS" ? "#14643d" : "#912018"}}table{border-collapse:collapse;background:#fff;margin-top:18px}td,th{border:1px solid #e6e1d8;padding:8px 10px}</style></head><body><h1>Legacy Dataset Sunset PR2</h1><div class="status">${status}</div><p>No data-plane mutation, promotion, deploy, archive, or delete performed.</p><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Checks</td><td>${rows.length}</td></tr><tr><td>Failures</td><td>${failures.length}</td></tr></table></body></html>`;
  writeFileSync(path.join(REPORT_DIR, "proof.html"), html);
  return { status, failures };
}

function main() {
  mkdirSync(REPORT_DIR, { recursive: true });
  const standard = standardInputRows();
  const artifacts = artifactStoreRows();
  const runtime = defaultRuntimeReadRows();
  const freeze = generationFreezeRows();
  const inventory = legacyDatasetInventoryRows();
  writeCsv("standard-v3-inputs.csv", standard);
  writeCsv("neutral-artifact-store.csv", artifacts);
  writeCsv("default-runtime-read-scan.csv", runtime);
  writeCsv("generation-freeze.csv", freeze);
  writeCsv("legacy-dataset-inventory.csv", inventory);
  const result = writeSummary([...standard, ...artifacts, ...runtime, ...freeze]);
  if (result.failures.length) {
    console.error(`legacy dataset sunset audit failed: ${result.failures.length} failure(s)`);
    process.exit(1);
  }
  console.log(`legacy dataset sunset audit passed; wrote ${rel(REPORT_DIR)}.`);
}

main();

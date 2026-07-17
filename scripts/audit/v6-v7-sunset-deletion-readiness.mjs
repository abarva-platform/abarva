#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports/v6-v7-sunset");

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "node_modules",
  "playwright-report",
  "test-results",
]);

const SCAN_ROOTS = [
  "src",
  "scripts",
  "datasets",
  "docs",
  "reports",
  "supabase",
  "migrations",
  "tests",
  "proof",
];

const TERMS = [
  ["v6_label", /\bV6\b|\bv6[-_/]/g],
  ["v7_label", /\bV7\b|\bv7[-_/]/g],
  ["intelligence_v6", /\bintelligence_v6\b/g],
  ["intelligence_v7", /\bintelligence_v7\b/g],
  ["tenant_v6", /\btenant-v6\b|\btenant_v6\b/g],
  ["scripts_v7", /\bscripts\/v7\b/g],
  ["tenant_pack_runs", /\btenant_pack_runs\b/g],
  ["latest_loaded_validated", /\blatest\s+(?:loaded|validated)\b|\bload_status\b/g],
  ["v6_v7_dataset", /\bv6-v7\b|\bv3-v7\b|\bV6_V7\b/g],
  ["v7_csv", /\bV7_[0-9A-Za-z_]+\.csv\b/g],
  ["v6_csv", /\bV6_[0-9A-Za-z_]+\.csv\b/g],
];

const ACTIVE_RUNTIME_EXACT = new Set([
  "src/lib/home/v7-context-browser.ts",
  "src/lib/home/v6-context-browser.ts",
  "src/lib/home/know/v7-home-ask.ts",
  "src/lib/home/know/v6-home-ask.ts",
  "src/lib/home/know/v7-home-know-response.ts",
  "src/lib/home/know/v6-home-know-response.ts",
  "src/lib/home/know/home-v6-executive-synthesis.ts",
  "src/lib/intelligence/ask/retrievers/v7-dossier.ts",
  "src/lib/tower/v7-tower-projection.ts",
]);

const MODULES = [
  "Home",
  "Tower",
  "Intelligence",
  "Moves",
  "Source",
  "Admin/data loaders",
  "generated CXO/story-block pipeline",
];

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(name, rows, fallbackHeaders) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : fallbackHeaders;
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
      if (relative === "reports/v6-v7-sunset" || relative.startsWith("reports/v6-v7-sunset/")) continue;
      files.push(...walk(absolute));
    } else if (isScannableFile(absolute)) {
      files.push(absolute);
    }
  }
  return files;
}

function lineNumbers(text, regex) {
  const lines = text.split(/\r?\n/);
  const found = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    regex.lastIndex = 0;
    if (regex.test(line)) found.push(index + 1);
  }
  return found;
}

function classify(file, term, text) {
  if (isHistoricalMigration(file)) return "historical migration";
  if (isTestOnly(file)) return "test-only dependency";
  if (isActiveRuntime(file, term, text)) return "active runtime dependency";
  if (isHistoricalDocumentation(file)) return "historical documentation";
  if (isSafeDeleteCandidate(file, term)) return "safe-to-delete candidate";
  if (isBridgeDependency(file, term, text)) return "bridge/read-model dependency";
  if (isGeneratedArtifact(file)) return "generated artifact dependency";
  if (isAdminOrLoader(file, term)) return "bridge/read-model dependency";
  return "blocked-delete candidate";
}

function isHistoricalMigration(file) {
  return (
    file.startsWith("supabase/migrations/") ||
    file.startsWith("migrations/") ||
    file.includes("/migrations/") ||
    file.endsWith(".sql")
  );
}

function isTestOnly(file) {
  return file.startsWith("tests/") || file.includes("__tests__/") || /\.test\.[tj]sx?$/.test(file) || /\.spec\.[tj]sx?$/.test(file);
}

function isHistoricalDocumentation(file) {
  if (!file.startsWith("docs/")) return false;
  if (file.startsWith("docs/governance/dataset-manifests/")) return false;
  return true;
}

function isActiveRuntime(file, term, text) {
  if (ACTIVE_RUNTIME_EXACT.has(file)) return true;
  if (file.startsWith("src/app/") || file.startsWith("src/components/")) return true;
  if (!file.startsWith("src/")) return false;
  if (/azureRead|tenant_pack_runs|intelligence_v[67]|load_status|latest loaded|latest validated/i.test(text)) return true;
  return term === "intelligence_v7" || term === "intelligence_v6";
}

function isBridgeDependency(file, term, text) {
  if (file === "package.json") return true;
  if (file.startsWith("src/lib/enterprise-data/")) return true;
  if (file.startsWith("src/scripts/")) return true;
  if (file.startsWith("scripts/v7/") || file.startsWith("scripts/tenant-v6/")) return true;
  if (file.startsWith("scripts/knowledge/")) return true;
  if (file.startsWith("scripts/data-plane/") || file.startsWith("scripts/azure/")) return true;
  return /tenant_pack_runs|intelligence_v[67]|active_context|candidate_context|load_status/i.test(text) || term === "tenant_pack_runs";
}

function isAdminOrLoader(file) {
  return /loader|load|azure|postgres|candidate|promotion|backfill|sync|copy/i.test(file);
}

function isGeneratedArtifact(file) {
  if (file.startsWith("reports/")) return true;
  if (file.startsWith("proof/")) return true;
  if (file.includes("/derived/")) return true;
  if (file.includes("/narratives/generated/")) return true;
  return file.startsWith("datasets/") && /\.(json|csv|md|txt)$/i.test(file);
}

function isSafeDeleteCandidate(file) {
  if (file.startsWith("reports/")) return true;
  if (file.startsWith("proof/")) return true;
  return false;
}

function moduleFor(file) {
  if (file.includes("/home/") || file.includes("(maestro)/home")) return "Home";
  if (file.includes("/tower/") || /tower/i.test(file)) return "Tower";
  if (file.includes("/intelligence/") || /intelligence/i.test(file)) return "Intelligence";
  if (file.includes("/moves/") || /moves/i.test(file)) return "Moves";
  if (file.includes("/source/") || /source/i.test(file)) return "Source";
  if (/scripts\/(?:v7|tenant-v6|azure|data-plane)|load|loader|candidate|promotion|admin/i.test(file)) return "Admin/data loaders";
  if (/scripts\/knowledge|module-cxo|cxo|story-block|narrative|visual-spec/i.test(file)) return "generated CXO/story-block pipeline";
  if (file.startsWith("datasets/")) return "generated CXO/story-block pipeline";
  return "shared/platform";
}

function replacementRequired(module, classification, file, term) {
  if (classification === "historical migration") {
    return "None for deletion now. Preserve historical migration; any schema retirement requires explicit approval and a forward-only migration after runtime replacement is live-proven.";
  }
  if (classification === "historical documentation") {
    return "None for runtime. Keep or update as history; do not treat docs as runtime sunset proof.";
  }
  if (classification === "test-only dependency") {
    return "Keep until the V3 replacement has equivalent regression coverage, then update tests from V6/V7 fixtures to V3 active-context fixtures.";
  }
  if (module === "Home") {
    return "V3 Home/Knowledge reader backed by explicit active context pointer, governed V3 source/fact rows, safe fallback, signed-in browser proof, and no V6/V7 fallback.";
  }
  if (module === "Tower") {
    return "V3 Tower fact/projection layer using governed budget/program/metric/value-claim facts; same-or-better latency/quality and signed-in Tower browser proof.";
  }
  if (module === "Intelligence") {
    return "V3 dossier/retrieval path using governed context bundle with tenant-scoped citations, answer-quality gates, and signed-in Intelligence proof.";
  }
  if (module === "Moves") {
    return "V3 Moves readiness context view generated from governed V3 facts and approved advisory blocks, with tenant isolation proof.";
  }
  if (module === "Source") {
    return "V3 Source readiness/event context view generated from governed V3 facts and approved advisory blocks, with tenant isolation proof.";
  }
  if (module === "Admin/data loaders") {
    return "Neutral V3 candidate/active context loader, readback validation, rollback keys, tenant isolation, and no default runtime visibility for candidates.";
  }
  if (module === "generated CXO/story-block pipeline") {
    return "Generator inputs repointed to standard-2026-07-v3 and approved content store; current physical V3 dataset is Meridian only, with SkyHarbor Air and First Capital still WIP/planned.";
  }
  if (classification === "safe-to-delete candidate" || classification === "generated artifact dependency") {
    return "Archive/delete only after confirming no runtime import, package script, loader, release record, or proof harness references it.";
  }
  return `Replace ${term} in ${file} with governed V3 active-context naming and source/fact lineage before deletion.`;
}

function deletionPhase(classification) {
  if (classification === "safe-to-delete candidate") return "Phase 1 - dead generated artifact/dataset cleanup after proof";
  if (classification === "generated artifact dependency") return "Phase 1 - archive generated artifacts only if unreferenced";
  if (classification === "active runtime dependency") return "Phase 2 - runtime cutover cleanup after V3 live proof";
  if (classification === "bridge/read-model dependency") return "Phase 2 - bridge cleanup after replacement loader/read-model proof";
  if (classification === "historical migration") return "Phase 3 - forward schema retirement only with explicit approval";
  if (classification === "test-only dependency") return "Phase 2 - update tests after V3 replacement";
  if (classification === "historical documentation") return "Phase 0 - audit/history only";
  return "Phase 0 - blocked until investigated";
}

function deleteDecision(classification) {
  if (classification === "safe-to-delete candidate") return "safe_after_reference_proof";
  if (classification === "generated artifact dependency") return "candidate_after_reference_proof";
  if (classification === "historical documentation") return "keep_as_history";
  if (classification === "historical migration") return "do_not_delete_historical_migration";
  if (classification === "test-only dependency") return "blocked_until_v3_test_replacement";
  return "blocked_until_v3_live_proof";
}

function buildRows() {
  const files = [];
  for (const root of SCAN_ROOTS) files.push(...walk(path.join(ROOT, root)));
  if (existsSync(path.join(ROOT, "package.json"))) files.push(path.join(ROOT, "package.json"));

  const rows = [];
  for (const absolute of [...new Set(files)]) {
    const file = rel(absolute);
    let text = "";
    try {
      text = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }
    for (const [term, pattern] of TERMS) {
      const lines = lineNumbers(text, new RegExp(pattern.source, pattern.flags));
      if (lines.length === 0) continue;
      const module = moduleFor(file);
      const classification = classify(file, term, text);
      rows.push({
        file,
        module,
        term,
        references: lines.length,
        sample_lines: lines.slice(0, 8).join("|"),
        classification,
        deletion_phase: deletionPhase(classification),
        delete_decision: deleteDecision(classification),
        replacement_required: replacementRequired(module, classification, file, term),
      });
    }
  }
  return rows.sort((a, b) => a.file.localeCompare(b.file) || a.term.localeCompare(b.term));
}

function buildDependencyMap(rows) {
  const map = {};
  for (const module of MODULES) {
    const moduleRows = rows.filter((row) => row.module === module);
    map[module] = {
      reference_groups: moduleRows.length,
      total_references: moduleRows.reduce((sum, row) => sum + row.references, 0),
      active_runtime_dependencies: moduleRows.filter((row) => row.classification === "active runtime dependency").map(toDependency),
      bridge_read_model_dependencies: moduleRows.filter((row) => row.classification === "bridge/read-model dependency").map(toDependency),
      generated_artifact_dependencies: moduleRows.filter((row) => row.classification === "generated artifact dependency").map(toDependency),
      test_only_dependencies: moduleRows.filter((row) => row.classification === "test-only dependency").map(toDependency),
      historical_dependencies: moduleRows.filter((row) => row.classification === "historical documentation" || row.classification === "historical migration").map(toDependency),
      safe_delete_candidates: moduleRows.filter((row) => row.classification === "safe-to-delete candidate").map(toDependency),
      blocked_delete_candidates: moduleRows.filter((row) => row.delete_decision.startsWith("blocked") || row.delete_decision.startsWith("do_not_delete")).map(toDependency),
    };
  }
  map["shared/platform"] = {
    reference_groups: rows.filter((row) => row.module === "shared/platform").length,
    total_references: rows.filter((row) => row.module === "shared/platform").reduce((sum, row) => sum + row.references, 0),
    blocked_delete_candidates: rows.filter((row) => row.module === "shared/platform" && row.delete_decision !== "safe_after_reference_proof").map(toDependency),
    safe_delete_candidates: rows.filter((row) => row.module === "shared/platform" && row.delete_decision === "safe_after_reference_proof").map(toDependency),
  };
  return map;
}

function toDependency(row) {
  return {
    file: row.file,
    term: row.term,
    references: row.references,
    classification: row.classification,
    replacement_required: row.replacement_required,
  };
}

function uniqueReplacementRows(rows) {
  const seen = new Set();
  const replacements = [];
  for (const row of rows.filter((candidate) => {
    return !["safe-to-delete candidate", "historical documentation"].includes(candidate.classification);
  })) {
    const key = `${row.module}::${row.file}::${row.replacement_required}`;
    if (seen.has(key)) continue;
    seen.add(key);
    replacements.push({
      module: row.module,
      file: row.file,
      classification: row.classification,
      replacement_required: row.replacement_required,
      blocking_condition: row.classification === "historical migration" ? "forward schema retirement requires explicit approval" : "V3 replacement not live-proven",
    });
  }
  return replacements.sort((a, b) => a.module.localeCompare(b.module) || a.file.localeCompare(b.file));
}

function writeMarkdown(rows, dependencyMap) {
  const totals = {
    referenceGroups: rows.length,
    references: rows.reduce((sum, row) => sum + row.references, 0),
    activeRuntime: rows.filter((row) => row.classification === "active runtime dependency").length,
    bridge: rows.filter((row) => row.classification === "bridge/read-model dependency").length,
    generated: rows.filter((row) => row.classification === "generated artifact dependency").length,
    tests: rows.filter((row) => row.classification === "test-only dependency").length,
    migrations: rows.filter((row) => row.classification === "historical migration").length,
    safe: rows.filter((row) => row.delete_decision === "safe_after_reference_proof").length,
    blocked: rows.filter((row) => row.delete_decision.startsWith("blocked") || row.delete_decision.startsWith("do_not_delete")).length,
  };

  const moduleSections = MODULES.map((module) => {
    const entry = dependencyMap[module];
    return `## ${module}

- Reference groups: ${entry.reference_groups}
- Total references: ${entry.total_references}
- Active runtime dependency groups: ${entry.active_runtime_dependencies.length}
- Bridge/read-model dependency groups: ${entry.bridge_read_model_dependencies.length}
- Generated artifact dependency groups: ${entry.generated_artifact_dependencies.length}
- Blocked delete groups: ${entry.blocked_delete_candidates.length}

${summarizeExamples(entry.active_runtime_dependencies, "Active runtime examples")}
${summarizeExamples(entry.bridge_read_model_dependencies, "Bridge/read-model examples")}
${summarizeExamples(entry.safe_delete_candidates, "Safe-delete candidates after reference proof")}
`;
  }).join("\n");

  const markdown = `# V6/V7 Sunset Deletion Readiness Audit

Status: PASS for Phase 0 audit/report generation only.

Generated: ${new Date().toISOString()}

Scope: deletion-readiness audit and phased retirement plan. No runtime code deletion, no data deletion, no historical migration edits, no Azure/Postgres mutation, no deploy, and no tenant promotion were performed.

## Current Decision

V6/V7 is not ready for broad deletion. The repository still contains active runtime, bridge/read-model, generated artifact, test, documentation, dataset, and historical migration references. Deletion must be phased and blocked until each active dependency has a V3 replacement that is implemented, merged, deployed through the approved ACA main workflow when runtime-visible, signed-in browser-proven, tenant-safe, and same-or-better on latency and quality.

The current physical V3 dataset buildout is still in progress: Meridian is the current V3 physical dataset, while SkyHarbor Air and First Capital are WIP/planned for the new V3 physical dataset.

## Totals

- Reference groups: ${totals.referenceGroups}
- Total line references: ${totals.references}
- Active runtime dependency groups: ${totals.activeRuntime}
- Bridge/read-model dependency groups: ${totals.bridge}
- Generated artifact dependency groups: ${totals.generated}
- Test-only dependency groups: ${totals.tests}
- Historical migration groups: ${totals.migrations}
- Safe-delete candidate groups after reference proof: ${totals.safe}
- Blocked/do-not-delete groups: ${totals.blocked}

## Phase Plan

- Phase 0 - Audit only: this PR. Reports, dependency map, and release record only.
- Phase 1 - Disable dead generators and unused generated datasets only: only after reference proof shows no runtime, test, loader, or active proof-harness usage.
- Phase 2 - Runtime cutover cleanup: only after V3 replacements are implemented, merged, deployed when needed, signed-in browser-proven, tenant-safe, and same-or-better.
- Phase 3 - Forward schema retirement: only with explicit Anand approval and forward-only migrations. Historical migrations stay immutable.

${moduleSections}
## Required Files

- reports/v6-v7-sunset/dependency-map.json
- reports/v6-v7-sunset/safe-delete-candidates.csv
- reports/v6-v7-sunset/blocked-delete-candidates.csv
- reports/v6-v7-sunset/runtime-dependencies.csv
- reports/v6-v7-sunset/replacement-required.csv

## Guardrail

This audit is not approval to delete V6/V7 runtime code, datasets, schemas, or migrations. It is a control-plane readiness map for deciding what can be retired after V3 proof boundaries are satisfied.
`;
  writeFileSync(path.join(REPORT_DIR, "dependency-map.md"), markdown);
}

function summarizeExamples(items, title) {
  if (!items.length) return `### ${title}\n\nNone identified.\n`;
  const lines = items.slice(0, 8).map((item) => `- ${item.file} (${item.term}, ${item.references})`);
  return `### ${title}\n\n${lines.join("\n")}\n`;
}

function writeHtml(rows) {
  const active = rows.filter((row) => row.classification === "active runtime dependency").length;
  const blocked = rows.filter((row) => row.delete_decision.startsWith("blocked") || row.delete_decision.startsWith("do_not_delete")).length;
  const safe = rows.filter((row) => row.delete_decision === "safe_after_reference_proof").length;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>V6/V7 Sunset Deletion Readiness Audit</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;background:#faf9f6;color:#171717}
    h1{font-size:28px;margin-bottom:4px}
    .badge{display:inline-block;padding:6px 10px;border-radius:6px;background:#fff3cd;color:#6b4e00;font-weight:800}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
    .card{background:white;border:1px solid #e7e2d9;border-radius:8px;padding:14px}
    .value{font-size:26px;font-weight:800}
    table{border-collapse:collapse;background:white;width:100%;margin-top:18px}
    th,td{border:1px solid #e7e2d9;padding:8px;text-align:left;vertical-align:top}
    th{background:#f2eee7}
  </style>
</head>
<body>
  <h1>V6/V7 Sunset Deletion Readiness Audit</h1>
  <span class="badge">Phase 0 audit only - no deletion</span>
  <p>V6/V7 remains blocked for broad runtime deletion until V3 replacements are live-proven. Meridian is the current V3 physical dataset; SkyHarbor Air and First Capital are WIP/planned.</p>
  <div class="grid">
    <div class="card"><div>Reference groups</div><div class="value">${rows.length}</div></div>
    <div class="card"><div>Active runtime groups</div><div class="value">${active}</div></div>
    <div class="card"><div>Blocked groups</div><div class="value">${blocked}</div></div>
    <div class="card"><div>Safe candidates after proof</div><div class="value">${safe}</div></div>
  </div>
  <table>
    <tr><th>Phase</th><th>Rule</th></tr>
    <tr><td>Phase 0</td><td>Audit/report only.</td></tr>
    <tr><td>Phase 1</td><td>Only dead generated artifacts and unused datasets after reference proof.</td></tr>
    <tr><td>Phase 2</td><td>Runtime cleanup only after V3 replacement is implemented, merged, deployed if needed, signed-in browser-proven, tenant-safe, and same-or-better.</td></tr>
    <tr><td>Phase 3</td><td>Forward schema retirement only with explicit approval. Historical migrations remain immutable.</td></tr>
  </table>
</body>
</html>
`;
  writeFileSync(path.join(REPORT_DIR, "proof.html"), html);
}

function main() {
  mkdirSync(REPORT_DIR, { recursive: true });
  const rows = buildRows();
  const dependencyMap = buildDependencyMap(rows);

  writeFileSync(path.join(REPORT_DIR, "dependency-map.json"), `${JSON.stringify({ generated_at: new Date().toISOString(), rows, dependency_map: dependencyMap }, null, 2)}\n`);
  writeCsv("runtime-dependencies.csv", rows.filter((row) => row.classification === "active runtime dependency" || row.classification === "bridge/read-model dependency"), [
    "file",
    "module",
    "term",
    "references",
    "sample_lines",
    "classification",
    "deletion_phase",
    "delete_decision",
    "replacement_required",
  ]);
  writeCsv("safe-delete-candidates.csv", rows.filter((row) => row.delete_decision === "safe_after_reference_proof"), [
    "file",
    "module",
    "term",
    "references",
    "sample_lines",
    "classification",
    "deletion_phase",
    "delete_decision",
    "replacement_required",
  ]);
  writeCsv("blocked-delete-candidates.csv", rows.filter((row) => row.delete_decision.startsWith("blocked") || row.delete_decision.startsWith("do_not_delete")), [
    "file",
    "module",
    "term",
    "references",
    "sample_lines",
    "classification",
    "deletion_phase",
    "delete_decision",
    "replacement_required",
  ]);
  writeCsv("replacement-required.csv", uniqueReplacementRows(rows), [
    "module",
    "file",
    "classification",
    "replacement_required",
    "blocking_condition",
  ]);
  writeMarkdown(rows, dependencyMap);
  writeHtml(rows);

  console.log(`V6/V7 sunset deletion-readiness audit wrote ${rel(REPORT_DIR)}.`);
  console.log(`Reference groups: ${rows.length}`);
  console.log(`Active runtime groups: ${rows.filter((row) => row.classification === "active runtime dependency").length}`);
  console.log(`Blocked/do-not-delete groups: ${rows.filter((row) => row.delete_decision.startsWith("blocked") || row.delete_decision.startsWith("do_not_delete")).length}`);
}

main();

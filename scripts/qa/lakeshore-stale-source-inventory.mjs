#!/usr/bin/env node
/**
 * Lakeshore stale source inventory
 *
 * Produces a remediation table for retired Lakeshore facts/aliases across local
 * source packs, scripts, docs, and runtime code. This is an inventory only:
 * it does not delete or mutate any data.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUT_ROOT =
  process.env.LAKESHORE_STALE_INVENTORY_OUT ??
  "/Users/anand/Downloads/abarva-lakeshore-stale-source-inventory";
const outDir = path.join(OUT_ROOT, RUN_STAMP);

const ROOTS = [
  "datasets",
  "scripts",
  "src",
  "docs",
  "db",
  "supabase",
].map((root) => path.join(cwd, root));

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "out",
  "proof",
  "coverage",
  "dist",
  "build",
]);

const TEXT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".jsonl",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".sql",
  ".txt",
  ".html",
  ".yaml",
  ".yml",
]);

const STALE_PATTERNS = [
  {
    id: "old_revenue_54_2b",
    label: "Retired Lakeshore revenue $54.2B",
    re: /\$?\s*54\.2\s*(?:B|billion)\b/gi,
  },
  {
    id: "old_employee_count_72000",
    label: "Retired Lakeshore employee count 72,000",
    re: /\b72,?000\s+(?:FTEs?|employees|people|headcount)\b/gi,
  },
  {
    id: "old_plant_count_89",
    label: "Retired Lakeshore plant count 89 plants",
    re: /\b89\s+(?:manufacturing\s+)?plants\b/gi,
  },
  {
    id: "old_tech_budget_1_8b",
    label: "Retired Lakeshore technology budget $1.8B",
    re: /\$?\s*1\.8\s*(?:B|billion)\s+(?:annual\s+)?technology\s+budget\b/gi,
  },
  {
    id: "old_ai_budget_54m",
    label: "Retired Lakeshore AI/data budget $54M",
    re: /\$?\s*54\s*(?:M|million)\s+(?:AI|AI\/data|data)\s+budget\b/gi,
  },
  {
    id: "old_alias_lakeshore_industries",
    label: "Retired Lakeshore Industries alias",
    re: /\bLakeshore\s+(?:Holdings\s+)?Industries\b/gi,
  },
  {
    id: "old_opco_harborpoint",
    label: "Retired HarborPoint operating-company name",
    re: /\bHarborPoint(?:\s+Packaging\s+Group)?\b/gi,
  },
  {
    id: "old_opco_riverton",
    label: "Retired Riverton operating-company name",
    re: /\bRiverton(?:\s+Components\s+&\s+Field\s+Services| Consumer Products)?\b/gi,
  },
  {
    id: "old_opco_keystone",
    label: "Retired Keystone operating-company name",
    re: /\bKeystone\s+Industrial\s+Services\b/gi,
  },
];

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const files = [];
  for (const root of ROOTS) {
    if (!(await exists(root))) continue;
    await collectFiles(root, files);
  }

  const findings = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8").catch(() => "");
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    for (const pattern of STALE_PATTERNS) {
      for (const [lineIndex, line] of lines.entries()) {
        const matches = [...line.matchAll(pattern.re)];
        for (const match of matches) {
          findings.push(classifyFinding({
            file,
            lineNumber: lineIndex + 1,
            staleFactId: pattern.id,
            staleFact: pattern.label,
            match: match[0],
            excerpt: line.trim().slice(0, 500),
          }));
        }
      }
    }
  }

  const summary = summarize(findings);
  await fs.writeFile(
    path.join(outDir, "findings.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings }, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outDir, "findings.csv"), renderCsv(findings));
  await fs.writeFile(path.join(outDir, "report.md"), renderMarkdown(summary, findings));
  await fs.writeFile(path.join(outDir, "report.html"), renderHtml(summary, findings));

  const publicPrefix = `AbarVa_Lakeshore_Stale_Source_Inventory_${RUN_STAMP}`;
  await fs.copyFile(path.join(outDir, "report.html"), path.join("/Users/anand/Downloads", `${publicPrefix}.html`));
  await fs.copyFile(path.join(outDir, "findings.csv"), path.join("/Users/anand/Downloads", `${publicPrefix}.csv`));
  await fs.copyFile(path.join(outDir, "report.md"), path.join("/Users/anand/Downloads", `${publicPrefix}.md`));

  console.log(`Wrote ${outDir}`);
  console.log(`Findings: ${findings.length}`);
  console.log(`Downloads report: /Users/anand/Downloads/${publicPrefix}.html`);
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dir, files) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".archive") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await collectFiles(full, files);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;
    files.push(full);
  }
}

function classifyFinding(input) {
  const rel = path.relative(cwd, input.file);
  const currentPurpose = classifyPurpose(rel);
  const runtimeReachable = classifyRuntimeReachability(rel);
  return {
    ...input,
    file: rel,
    currentPurpose,
    runtimeReachable,
    recommendedAction: recommendAction(rel, currentPurpose, runtimeReachable),
  };
}

function classifyPurpose(file) {
  if (file === "src/lib/client-config.ts") return "inbound alias canonicalizer";
  if (/__tests__|\.test\.|\.spec\./.test(file)) return "regression guard or audit tooling";
  if (/retired-fact-gate|intelligence-extensive-api-audit|stale-source-inventory/.test(file)) {
    return "regression guard or audit tooling";
  }
  if (/docs\/releases\/records\//.test(file)) return "release/audit history";
  if (/docs\/governance|docs\/runbooks|docs\/strategy/.test(file)) return "governance or strategy documentation";
  if (/datasets\/lakeshore-industries-synthetic-v4/.test(file)) return "retired v4 demo dataset";
  if (/datasets\/lakeshore-holdings-synthetic-v4/.test(file)) return "superseded Lakeshore v4 dataset";
  if (/datasets\/lakeshore-industries-synthetic-v7-holdco/.test(file)) return "superseded generated v7 holdco dataset";
  if (/datasets\/lakeshore-kyriba-synthetic-v1/.test(file)) return "Kyriba synthetic source pack";
  if (/scripts\/v7\/build-lakeshore-holdco-v7/.test(file)) return "v7 data generator";
  if (/scripts\/lakeshore\/generate-lakeshore-v6-holdco-pack/.test(file)) return "v6 data generator";
  if (/scripts\/context-packs\/enrich-lakeshore-intelligence/.test(file)) return "legacy context-pack enrichment";
  if (/src\//.test(file)) return "runtime code or fixture";
  if (/supabase|db/.test(file)) return "database schema or migration";
  return "unknown";
}

function classifyRuntimeReachability(file) {
  if (file === "src/lib/client-config.ts") return "no";
  if (/__tests__|\.test\.|\.spec\./.test(file)) return "no";
  if (/retired-fact-gate|stale-source-inventory/.test(file)) return "no";
  if (/docs\/releases\/records\//.test(file)) return "no";
  if (/datasets\/.*\/source-docs|datasets\/.*\.csv|datasets\/.*\.json/.test(file)) return "unknown";
  if (/scripts\/.*(?:load|generate|build|enrich|backfill|ingest)/.test(file)) return "unknown";
  if (/src\/lib|src\/app|src\/data/.test(file)) return "yes";
  return "unknown";
}

function recommendAction(file, purpose, runtimeReachable) {
  if (purpose === "regression guard or audit tooling") return "keep_as_test_fixture";
  if (purpose === "inbound alias canonicalizer") return "keep_as_canonicalization_guard";
  if (purpose === "release/audit history") return "keep_historical_record";
  if (purpose === "retired v4 demo dataset") return "quarantine_test_fixture";
  if (purpose === "superseded Lakeshore v4 dataset") return "mark_retired_or_quarantine";
  if (purpose === "superseded generated v7 holdco dataset") return "mark_superseded_and_exclude_from_runtime";
  if (purpose === "legacy context-pack enrichment") return "delete_or_archive_if_not_used";
  if (purpose === "v7 data generator") return "repair_generator_then_rebuild_v7";
  if (purpose === "v6 data generator") return "repair_or_archive_after_v7_migration";
  if (runtimeReachable === "yes") return "block_until_reviewed";
  if (runtimeReachable === "unknown") return "trace_runtime_reachability_before_action";
  return "review";
}

function summarize(findings) {
  const byFact = countBy(findings, "staleFactId");
  const byPurpose = countBy(findings, "currentPurpose");
  const byRuntimeReachability = countBy(findings, "runtimeReachable");
  const byRecommendedAction = countBy(findings, "recommendedAction");
  const files = [...new Set(findings.map((finding) => finding.file))].sort();
  return {
    totalFindings: findings.length,
    totalFiles: files.length,
    byFact,
    byPurpose,
    byRuntimeReachability,
    byRecommendedAction,
    files,
  };
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] ?? 0) + 1;
  return out;
}

function renderCsv(findings) {
  const header = [
    "file",
    "line",
    "stale_fact_id",
    "match",
    "current_purpose",
    "runtime_reachable",
    "recommended_action",
    "excerpt",
  ];
  const rows = findings.map((finding) =>
    [
      finding.file,
      finding.lineNumber,
      finding.staleFactId,
      finding.match,
      finding.currentPurpose,
      finding.runtimeReachable,
      finding.recommendedAction,
      finding.excerpt,
    ]
      .map(csvCell)
      .join(","),
  );
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

function renderMarkdown(summary, findings) {
  const lines = [
    "# Lakeshore Stale Source Inventory",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Total findings: ${summary.totalFindings}`,
    `Files with findings: ${summary.totalFiles}`,
    "",
    "## Recommended Action Counts",
    "",
    "| Action | Count |",
    "|---|---:|",
    ...Object.entries(summary.byRecommendedAction).map(([key, count]) => `| ${key} | ${count} |`),
    "",
    "## Findings",
    "",
    "| File | Line | Stale fact | Match | Runtime reachable | Action |",
    "|---|---:|---|---|---|---|",
    ...findings.map(
      (finding) =>
        `| ${finding.file} | ${finding.lineNumber} | ${finding.staleFactId} | ${escapeMarkdown(finding.match)} | ${finding.runtimeReachable} | ${finding.recommendedAction} |`,
    ),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderHtml(summary, findings) {
  const rows = findings
    .map(
      (finding) => `<tr>
        <td>${escapeHtml(finding.file)}</td>
        <td>${finding.lineNumber}</td>
        <td>${escapeHtml(finding.staleFactId)}</td>
        <td>${escapeHtml(finding.match)}</td>
        <td>${escapeHtml(finding.currentPurpose)}</td>
        <td>${escapeHtml(finding.runtimeReachable)}</td>
        <td>${escapeHtml(finding.recommendedAction)}</td>
        <td><code>${escapeHtml(finding.excerpt)}</code></td>
      </tr>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lakeshore Stale Source Inventory</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f8fafc;color:#111827}
    header,main{max-width:1400px;margin:0 auto;padding:28px}
    h1{font:700 34px Georgia,serif;margin:0 0 8px}
    .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}
    .metric,.card{background:white;border:1px solid #d7dde7;border-radius:8px;padding:16px}
    .metric b{display:block;font:700 28px Georgia,serif}
    table{width:100%;border-collapse:collapse;background:white;border:1px solid #d7dde7}
    th,td{text-align:left;vertical-align:top;border-bottom:1px solid #edf2f7;padding:8px 10px;font-size:12px}
    th{color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-size:11px}
    code{white-space:pre-wrap}
  </style>
</head>
<body>
  <header>
    <h1>Lakeshore Stale Source Inventory</h1>
    <p>Inventory only. No files were deleted or mutated.</p>
    <section class="metrics">
      <div class="metric"><b>${summary.totalFindings}</b>Findings</div>
      <div class="metric"><b>${summary.totalFiles}</b>Files</div>
      <div class="metric"><b>${summary.byRuntimeReachability.yes ?? 0}</b>Runtime yes</div>
      <div class="metric"><b>${summary.byRuntimeReachability.unknown ?? 0}</b>Runtime unknown</div>
    </section>
    <section class="card">
      <h2>Action Counts</h2>
      <pre>${escapeHtml(JSON.stringify(summary.byRecommendedAction, null, 2))}</pre>
    </section>
  </header>
  <main>
    <table><thead><tr><th>File</th><th>Line</th><th>Stale Fact</th><th>Match</th><th>Purpose</th><th>Runtime</th><th>Action</th><th>Excerpt</th></tr></thead><tbody>${rows}</tbody></table>
  </main>
</body>
</html>`;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function escapeMarkdown(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

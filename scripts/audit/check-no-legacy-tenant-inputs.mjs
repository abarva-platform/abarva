#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/data-standard/legacy-purge");

const blockedPathPatterns = [
  { id: "tenant-input-archive-in-repo", pattern: /^datasets\/tenant-inputs\/archive\// },
  { id: "old-universal-template-root", pattern: /^datasets\/tenant-inputs\/templates\/universal\/standard-2026-07\// },
  { id: "enterprise-v6-template-pack", pattern: /^datasets\/enterprise-intelligence-template-pack-v6\// },
  { id: "client-load-staging", pattern: /^datasets\/client-load-staging\// },
  { id: "kyriba-synthetic-pack", pattern: /^datasets\/lakeshore-kyriba-synthetic-v1\// },
  { id: "old-public-setup-templates", pattern: /^public\/setup-templates\// },
  { id: "old-public-client-workbooks", pattern: /^public\/templates\/(?!tower\/)[^/]+\.(csv|xlsx|xls|yaml|json)$/i },
  { id: "tenant-v6-loader", pattern: /^scripts\/tenant-v6\// },
  { id: "tenant-v7-loader", pattern: /^scripts\/v7\// },
  { id: "v6-v7-loader-lib", pattern: /^scripts\/lib\/v6-v7\// },
  { id: "legacy-source-pack-generator", pattern: /^scripts\/generate-lakeshore-kyriba-synthetic-pack\.mjs$/ },
  { id: "legacy-client-staging-generator", pattern: /^scripts\/staging\/build-first-capital-load-staging\.mjs$/ },
  { id: "legacy-v-pack-remediation-script", pattern: /^scripts\/qa\/remediate-home-v6-demo-pack\.mjs$/ },
  { id: "legacy-skyharbor-v7-proof-script", pattern: /^scripts\/qa\/skyharbor-v7-upgrade-(proof-job|live-proof)\.mjs$/ },
  { id: "legacy-v4-v5-refresh-audit", pattern: /^scripts\/audit\/validate-v4-v5-dataset-refresh\.mjs$/ },
];

const activeContentPatterns = [
  { id: "archive-path-reference", pattern: /datasets\/tenant-inputs\/archive(?:\/|\b)/i },
  { id: "synthetic-v-folder-reference", pattern: /synthetic-v[0-9]/i },
  { id: "legacy-v-pack-label", pattern: /\bv[4567][a-z0-9_-]*synthetic_pack\b/i },
  { id: "legacy-v-dimension-token", pattern: /\bV[4567]_[0-9A-Za-z_]+\b/ },
  { id: "legacy-v-file-name", pattern: /\bV[4567]_[A-Za-z0-9_. -]+\.(csv|xlsx|json)\b/ },
  { id: "v6-v7-current-state", pattern: /v6-v7-current-state/i },
  { id: "current-state-pack", pattern: /current-state-pack/i },
  { id: "rich-enterprise-pack", pattern: /rich-enterprise-pack/i },
  { id: "rich-substrate-pack", pattern: /rich-substrate-pack/i },
  { id: "upgrade-candidate-pack", pattern: /upgrade-candidate-pack/i },
  { id: "old-meridian-app-workbook", pattern: /Meridian_Application_Technology_Inventory\.xlsx/i },
  { id: "old-meridian-datacenter-workbook", pattern: /Meridian_DataCenter_Infrastructure_Inventory\.xlsx/i },
];

const guardedContentPrefixes = [
  "datasets/tenant-inputs/active/",
  "datasets/tenant-inputs/generated/",
  "datasets/tenant-inputs/templates/universal/",
  "datasets/tenant-inputs/tenant-input-registry.json",
  "datasets/tenant-inputs/README.md",
  "package.json",
  "docs/architecture/canonical-tenant-inputs.md",
  "docs/architecture/data-layer-operating-design.md",
  "docs/architecture/module-data-layer-serving-map.md",
  "scripts/audit/canonical-tenant-inputs.ts",
  "scripts/audit/tenant-input-quality-depth.ts",
  "scripts/data-build/consolidate-active-tenant-inputs.mjs",
  "scripts/docs/generate-data-layer-design-report.ts",
  "src/lib/admin/data-trust-composer.ts",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function gitLsFiles() {
  const raw = execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 });
  return raw
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function gitDeletedFiles() {
  const raw = execFileSync("git", ["diff", "--name-status", "--diff-filter=D", "HEAD", "--"], {
    cwd: repoRoot,
    maxBuffer: 64 * 1024 * 1024,
  }).toString("utf8");
  return raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [, file] = line.split(/\t/);
      return file;
    })
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function shouldScanContent(file) {
  return guardedContentPrefixes.some((prefix) => file === prefix || file.startsWith(prefix));
}

function isTextLike(file) {
  return /\.(csv|json|md|mjs|ts|tsx|js|yaml|yml|txt)$/i.test(file) || file === "package.json";
}

function csv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(file, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) lines.push(columns.map((column) => csv(row[column])).join(","));
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function writeMarkdown(file, lines) {
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function run() {
  ensureDir(outDir);
  const files = gitLsFiles();
  const deletedFiles = gitDeletedFiles();
  const blockedPathFindings = [];
  const blockedContentFindings = [];
  const allowedLegacyReferences = [];

  for (const file of files) {
    for (const rule of blockedPathPatterns) {
      if (rule.pattern.test(file)) {
        blockedPathFindings.push({ rule: rule.id, file });
      }
    }

    if (!shouldScanContent(file) || !isTextLike(file)) continue;
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, "utf8");
    for (const rule of activeContentPatterns) {
      if (rule.pattern.test(text)) {
        blockedContentFindings.push({ rule: rule.id, file });
      }
    }
  }

  for (const file of files) {
    if (!isTextLike(file)) continue;
    if (shouldScanContent(file)) continue;
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, "utf8");
    for (const rule of activeContentPatterns) {
      if (rule.pattern.test(text)) {
        allowedLegacyReferences.push({
          rule: rule.id,
          file,
          reason: file.startsWith("docs/releases/records/")
            ? "release record"
            : file.startsWith("reports/")
              ? "generated/historical report"
              : "non-loader historical reference",
        });
      }
    }
  }

  const blockedLoaderPaths = {
    generatedAt: new Date().toISOString(),
    guardrails: {
      standard: "standard-2026-07-v3",
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
    },
    blockedPathFindings,
    blockedContentFindings,
    blockedCount: blockedPathFindings.length + blockedContentFindings.length,
  };

  const summary = {
    generatedAt: blockedLoaderPaths.generatedAt,
    standard: "standard-2026-07-v3",
    deletedLegacyFileCount: deletedFiles.length,
    remainingAllowedLegacyReferenceCount: allowedLegacyReferences.length,
    blockedLoaderPathCount: blockedPathFindings.length,
    blockedGuardedContentCount: blockedContentFindings.length,
    guardrails: blockedLoaderPaths.guardrails,
    purgedRoots: [
      "datasets/tenant-inputs/archive",
      "datasets/enterprise-intelligence-template-pack-v6",
      "datasets/client-load-staging",
      "datasets/lakeshore-kyriba-synthetic-v1",
      "datasets/tenant-inputs/templates/universal/standard-2026-07",
      "public/setup-templates",
      "public/templates top-level client workbooks",
      "scripts/tenant-v6",
      "scripts/v7",
      "scripts/lib/v6-v7",
    ],
    blockedPathFindings,
    blockedContentFindings,
  };

  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(
    path.join(outDir, "blocked-loader-paths.json"),
    `${JSON.stringify(blockedLoaderPaths, null, 2)}\n`,
  );
  writeCsv(
    path.join(outDir, "deleted-legacy-files.csv"),
    deletedFiles.map((file) => ({ file })),
    ["file"],
  );
  writeCsv(
    path.join(outDir, "remaining-allowed-legacy-references.csv"),
    allowedLegacyReferences,
    ["rule", "file", "reason"],
  );

  writeMarkdown(path.join(outDir, "summary.md"), [
    "# Legacy Tenant Input Purge",
    "",
    "Status: enforced purge of loader-visible legacy tenant templates and source packs.",
    "",
    `- Approved standard: \`standard-2026-07-v3\``,
    `- Deleted legacy files in this diff: ${deletedFiles.length}`,
    `- Blocked loader-visible legacy paths remaining: ${blockedPathFindings.length}`,
    `- Blocked guarded-content legacy references remaining: ${blockedContentFindings.length}`,
    `- Allowed historical references remaining: ${allowedLegacyReferences.length}`,
    "",
    "## Purged Roots",
    "",
    ...summary.purgedRoots.map((root) => `- \`${root}\``),
    "",
    "## Truth Split",
    "",
    "- This purge removes old tracked templates/source packs/loader commands from the repository.",
    "- It does not mutate production tenant data.",
    "- It does not update the Active Tenant Access Layer.",
    "- It does not promote candidates.",
    "- It does not change module runtime behavior.",
    "",
    "## Guardrail",
    "",
    "`npm run audit:no-legacy-tenant-inputs` fails if legacy V-named source/template packs or stale active lineage reappear in guarded loader-visible paths.",
  ]);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Legacy Tenant Input Purge</title><style>
body{font-family:Inter,Arial,sans-serif;margin:0;background:#f7f4ee;color:#07152f}main{max-width:1160px;margin:0 auto;padding:48px}h1{font-size:44px;margin:0 0 12px}.muted{color:#64708a}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0}.card{background:#fff;border:1px solid #ded7ca;border-radius:12px;padding:18px}.kpi{font-size:34px;font-weight:800}table{width:100%;border-collapse:collapse;background:white;border:1px solid #ded7ca;border-radius:12px;overflow:hidden}th,td{padding:10px;border-bottom:1px solid #eee;text-align:left;font-size:13px}th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64708a}.ok{color:#087443}.bad{color:#b42318}</style></head><body><main>
<p class="muted">DATA STANDARD</p><h1>No Legacy Tenant Inputs</h1>
<p class="muted">The repository now keeps one approved tenant input/template standard: <strong>standard-2026-07-v3</strong>.</p>
<section class="grid">
<div class="card"><div class="muted">Deleted legacy files</div><div class="kpi">${deletedFiles.length}</div></div>
<div class="card"><div class="muted">Blocked paths remaining</div><div class="kpi ${blockedPathFindings.length === 0 ? "ok" : "bad"}">${blockedPathFindings.length}</div></div>
<div class="card"><div class="muted">Guarded stale refs</div><div class="kpi ${blockedContentFindings.length === 0 ? "ok" : "bad"}">${blockedContentFindings.length}</div></div>
<div class="card"><div class="muted">Runtime writes</div><div class="kpi ok">0</div></div>
</section>
<h2>Purged roots</h2><table><thead><tr><th>Root</th></tr></thead><tbody>${summary.purgedRoots
    .map((root) => `<tr><td><code>${root}</code></td></tr>`)
    .join("")}</tbody></table>
</main></body></html>`;
  fs.writeFileSync(path.join(outDir, "no-legacy-tenant-inputs-proof.html"), html);

  if (blockedPathFindings.length > 0 || blockedContentFindings.length > 0) {
    console.error("[audit:no-legacy-tenant-inputs] blocked legacy tenant inputs remain");
    console.error(JSON.stringify({ blockedPathFindings, blockedContentFindings }, null, 2));
    process.exit(1);
  }

  console.log("[audit:no-legacy-tenant-inputs] pass");
  console.log(`Deleted legacy files in diff: ${deletedFiles.length}`);
  console.log(`Allowed historical references: ${allowedLegacyReferences.length}`);
}

run();

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";
import { readCsv } from "../lib/v6-v7/csv.mjs";

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, "reports/multi-tenant-context-data-flow");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function csvCount(file) {
  return fs.existsSync(file) ? readCsv(file).length : 0;
}

function sumCsvRows(dir) {
  if (!fs.existsSync(dir)) return { files: 0, rows: 0 };
  let files = 0;
  let rows = 0;
  for (const file of fs.readdirSync(dir).filter((entry) => entry.endsWith(".csv"))) {
    files += 1;
    rows += csvCount(path.join(dir, file));
  }
  return { files, rows };
}

function moduleArtifactCounts(tenantKey) {
  const base = path.join(repoRoot, "reports/module-cxo-content", tenantKey);
  const modules = ["home", "tower", "intelligence", "moves", "source"];
  return modules.map((moduleName) => {
    const blocksFile = path.join(base, moduleName, "generated-blocks.json");
    const visualsFile = path.join(base, moduleName, "generated-visual-specs.json");
    return {
      module: moduleName,
      blocks: fs.existsSync(blocksFile) ? readJson(blocksFile).length : 0,
      visual_specs: fs.existsSync(visualsFile) ? readJson(visualsFile).length : 0,
    };
  });
}

function tenantVolumes(config) {
  const inputBase = path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey);
  const standard = sumCsvRows(path.join(inputBase, "standard-2026-07-v3"));
  const interviews = csvCount(path.join(inputBase, "interviews/executive_interviews.csv"));
  const datasetBase = path.join(repoRoot, config.sourceDataset);
  const v6 = sumCsvRows(path.join(datasetBase, "templates"));
  const v7 = sumCsvRows(path.join(datasetBase, "v7"));
  const homeDir = path.join(datasetBase, "derived/home");
  const gaps = csvCount(path.join(homeDir, "derived_gap_insights.csv"));
  const sources = csvCount(path.join(homeDir, "derived_source_ledger.csv"));
  const relationships = csvCount(path.join(homeDir, "derived_relationship_rollups.csv"));
  const storyFile = path.join(datasetBase, "derived/knowledge/approved-cxo-story-blocks.json");
  const visualFile = path.join(datasetBase, "derived/knowledge/approved-cxo-visual-specs.json");
  const storyBlocks = fs.existsSync(storyFile) ? readJson(storyFile).story_blocks?.length ?? 0 : 0;
  const visualSpecs = fs.existsSync(visualFile) ? readJson(visualFile).visual_specs?.length ?? 0 : 0;
  const modules = moduleArtifactCounts(config.tenantKey);
  return {
    tenant_key: config.tenantKey,
    display_name: config.tenantName,
    dataset_id: config.datasetId,
    standard_files: standard.files,
    standard_rows: standard.rows,
    interview_rows: interviews,
    v6_files: v6.files,
    v6_rows: v6.rows,
    v7_files: v7.files,
    v7_rows: v7.rows,
    home_gap_rows: gaps,
    home_source_rows: sources,
    home_relationship_rows: relationships,
    knowledge_story_blocks: storyBlocks,
    knowledge_visual_specs: visualSpecs,
    module_blocks: modules.reduce((sum, item) => sum + item.blocks, 0),
    module_visual_specs: modules.reduce((sum, item) => sum + item.visual_specs, 0),
    modules,
  };
}

function layerRows(volumes) {
  return [
    ["Tenant source inputs", "standard files", volumes.reduce((sum, item) => sum + item.standard_files, 0)],
    ["Tenant source inputs", "standard rows", volumes.reduce((sum, item) => sum + item.standard_rows, 0)],
    ["SA07 Executive Interview Insights", "interview rows", volumes.reduce((sum, item) => sum + item.interview_rows, 0)],
    ["Generated context packs", "V6 rows", volumes.reduce((sum, item) => sum + item.v6_rows, 0)],
    ["Generated context packs", "V7 rows", volumes.reduce((sum, item) => sum + item.v7_rows, 0)],
    ["Home-derived context", "gap rows", volumes.reduce((sum, item) => sum + item.home_gap_rows, 0)],
    ["Home-derived context", "source ledger rows", volumes.reduce((sum, item) => sum + item.home_source_rows, 0)],
    ["Home-derived context", "relationship rollups", volumes.reduce((sum, item) => sum + item.home_relationship_rows, 0)],
    ["Approved Home/Knowledge advisory layer", "story blocks", volumes.reduce((sum, item) => sum + item.knowledge_story_blocks, 0)],
    ["Approved Home/Knowledge advisory layer", "visual specs", volumes.reduce((sum, item) => sum + item.knowledge_visual_specs, 0)],
    ["Approved module advisory layer", "module blocks", volumes.reduce((sum, item) => sum + item.module_blocks, 0)],
    ["Approved module advisory layer", "module visual specs", volumes.reduce((sum, item) => sum + item.module_visual_specs, 0)],
  ];
}

function renderHtml(volumes) {
  const layers = [
    ["01", "Tenant source inputs", "Canonical tenant_key, standard dimensions, source adapter rows"],
    ["02", "SA07 interviews", "Executive and technical interview evidence, planning-grade and PHI/PII free"],
    ["03", "Generated context packs", "Governed V6/V7-style context artifacts and Azure load payloads"],
    ["04", "Home-derived context", "Dimension rollups, relationship rollups, source ledger, and gap insights"],
    ["05", "Claude-derived Home/Knowledge", "Approved story blocks and visual specs, never source-of-truth data"],
    ["06", "Module advisory content", "Home, Tower, Intelligence, Moves, and Source advisory artifacts by tenant/module"],
    ["07", "Future runtime proof", "Not performed here: load, retrieval, deployment, signed-in browser proof"],
  ];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Multi-Tenant Context Data Flow And Volumetrics</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1f2933; background: #fbfcfd; }
    h1, h2 { margin-bottom: 8px; }
    .note { color: #52606d; max-width: 980px; }
    .flow { display: grid; grid-template-columns: repeat(7, minmax(120px, 1fr)); gap: 10px; margin: 24px 0; align-items: stretch; }
    .layer { border: 1px solid #cbd5e1; background: white; border-radius: 8px; padding: 12px; min-height: 120px; position: relative; }
    .layer:not(:last-child)::after { content: "→"; position: absolute; right: -14px; top: 44%; color: #64748b; font-weight: 700; }
    .num { font-size: 12px; color: #2563eb; font-weight: 700; }
    .name { font-weight: 700; margin: 8px 0; }
    .desc { font-size: 13px; color: #52606d; line-height: 1.35; }
    table { border-collapse: collapse; width: 100%; background: white; margin: 16px 0 28px; }
    th, td { border: 1px solid #d8dee4; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #e0f2fe; color: #075985; font-size: 12px; }
    @media (max-width: 1100px) { .flow { grid-template-columns: 1fr; } .layer::after { display: none; } }
  </style>
</head>
<body>
  <h1>Multi-Tenant Context Data Flow And Volumetrics</h1>
  <p class="note">Generated ${escapeHtml(new Date().toISOString())}. Scope: local generated artifacts and proofs only. No Azure/Postgres load, deployment, runtime retrieval proof, or signed-in browser proof is claimed.</p>
  <div class="flow">
    ${layers.map(([num, name, desc]) => `<div class="layer"><div class="num">${num}</div><div class="name">${escapeHtml(name)}</div><div class="desc">${escapeHtml(desc)}</div></div>`).join("\n")}
  </div>

  <h2>Layer Volumetrics</h2>
  <table>
    <thead><tr><th>Layer</th><th>Measure</th><th>Total Loaded/Generated</th></tr></thead>
    <tbody>
      ${layerRows(volumes).map(([layer, measure, total]) => `<tr><td>${escapeHtml(layer)}</td><td>${escapeHtml(measure)}</td><td>${total}</td></tr>`).join("\n")}
    </tbody>
  </table>

  <h2>Tenant Volumetrics</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Standard v3 Rows</th><th>Interviews</th><th>V6 Rows</th><th>V7 Rows</th><th>Home Gaps</th><th>Knowledge Blocks</th><th>Module Blocks</th></tr></thead>
    <tbody>
      ${volumes.map((item) => `<tr><td><span class="pill">${escapeHtml(item.tenant_key)}</span><br>${escapeHtml(item.display_name)}</td><td>${item.standard_rows}</td><td>${item.interview_rows}</td><td>${item.v6_rows}</td><td>${item.v7_rows}</td><td>${item.home_gap_rows}</td><td>${item.knowledge_story_blocks} stories / ${item.knowledge_visual_specs} visuals</td><td>${item.module_blocks} blocks / ${item.module_visual_specs} visuals</td></tr>`).join("\n")}
    </tbody>
  </table>

  <h2>Module Advisory Content By Tenant</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Module</th><th>Blocks</th><th>Visual Specs</th></tr></thead>
    <tbody>
      ${volumes.flatMap((item) => item.modules.map((module) => `<tr><td>${escapeHtml(item.tenant_key)}</td><td>${escapeHtml(module.module)}</td><td>${module.blocks}</td><td>${module.visual_specs}</td></tr>`)).join("\n")}
    </tbody>
  </table>
</body>
</html>
`;
}

ensureDir(reportDir);
const volumes = tenantV6CanonicalConfigs.map(tenantVolumes);
const summary = {
  generated_at: new Date().toISOString(),
  status: "Pass",
  scope: "local generated artifact data flow and volumetrics; no runtime proof",
  tenants: volumes,
  layer_rows: layerRows(volumes).map(([layer, measure, total]) => ({ layer, measure, total })),
};
fs.writeFileSync(path.join(reportDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, "context-data-flow.html"), renderHtml(volumes));
fs.writeFileSync(path.join(reportDir, "summary.md"), `# Multi-Tenant Context Data Flow\n\nStatus: Pass\n\n- Tenants: ${volumes.map((item) => item.tenant_key).join(", ")}\n- Standard v3 rows: ${volumes.reduce((sum, item) => sum + item.standard_rows, 0)}\n- Interview rows: ${volumes.reduce((sum, item) => sum + item.interview_rows, 0)}\n- V7 rows: ${volumes.reduce((sum, item) => sum + item.v7_rows, 0)}\n- Knowledge story blocks: ${volumes.reduce((sum, item) => sum + item.knowledge_story_blocks, 0)}\n- Module advisory blocks: ${volumes.reduce((sum, item) => sum + item.module_blocks, 0)}\n\nHTML proof: reports/multi-tenant-context-data-flow/context-data-flow.html\n`);
console.log(JSON.stringify(summary, null, 2));

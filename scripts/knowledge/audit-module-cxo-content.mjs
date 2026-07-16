#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getTenantV6Config, tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";
import { readCsv } from "../lib/v6-v7/csv.mjs";

const repoRoot = process.cwd();
const reportRoot = path.join(repoRoot, "reports/module-cxo-content");
const modules = ["home", "tower", "intelligence", "moves", "source"];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function auditOne(config, moduleName) {
  const dir = path.join(reportRoot, config.tenantKey, moduleName);
  const blocksFile = path.join(dir, "generated-blocks.json");
  const visualsFile = path.join(dir, "generated-visual-specs.json");
  const validationFile = path.join(dir, "validation-results.csv");
  const summaryFile = path.join(dir, "summary.md");
  const proofFile = path.join(dir, "proof.html");
  const failures = [];
  for (const file of [blocksFile, visualsFile, validationFile, summaryFile, proofFile]) {
    if (!fs.existsSync(file)) failures.push(`missing ${path.relative(repoRoot, file)}`);
  }
  let blocks = [];
  let visuals = [];
  let validationRows = [];
  if (!failures.length) {
    blocks = JSON.parse(fs.readFileSync(blocksFile, "utf8"));
    visuals = JSON.parse(fs.readFileSync(visualsFile, "utf8"));
    validationRows = readCsv(validationFile);
    if (blocks.length < 4) failures.push("expected at least 4 generated blocks");
    if (visuals.length < 4) failures.push("expected at least 4 visual specs");
    if (blocks.some((block) => block.tenant_key !== config.tenantKey || block.module !== moduleName)) failures.push("block tenant/module mismatch");
    if (visuals.some((visual) => visual.tenant_key !== config.tenantKey || visual.module !== moduleName)) failures.push("visual tenant/module mismatch");
    if (validationRows.some((row) => row.status !== "Pass")) failures.push("validation row failure");
    const text = JSON.stringify({ blocks, visuals });
    if (/V4|V5|V6|V7|packet|substrate|runtime|source_record_id|record ID|loaded records|loaded view|context layer is the hero|deterministic visual fallback|Healthcare Demo/i.test(text)) failures.push("hard-fail internal language");
    if (/RFP|BAFO|vendor response|negotiation memo|decision brief/i.test(text)) failures.push("Source event artifact language");
  }
  return {
    tenant_key: config.tenantKey,
    module: moduleName,
    status: failures.length ? "Fail" : "Pass",
    blocks: blocks.length,
    visual_specs: visuals.length,
    failures,
    report_dir: path.relative(repoRoot, dir),
  };
}

const requestedTenant = arg("--tenant");
const requestedModule = arg("--module");
const configs = requestedTenant ? [getTenantV6Config(requestedTenant)] : tenantV6CanonicalConfigs;
if (configs.some((config) => !config)) throw new Error(`Unknown tenant ${requestedTenant}`);
const selectedModules = requestedModule ? [requestedModule] : modules;
const results = [];
for (const config of configs) {
  for (const moduleName of selectedModules) {
    results.push(auditOne(config, moduleName));
  }
}
fs.mkdirSync(reportRoot, { recursive: true });
fs.writeFileSync(path.join(reportRoot, "audit-summary.json"), `${JSON.stringify({
  generated_at: new Date().toISOString(),
  status: results.every((result) => result.status === "Pass") ? "Pass" : "Fail",
  results,
}, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.status !== "Pass")) process.exit(1);

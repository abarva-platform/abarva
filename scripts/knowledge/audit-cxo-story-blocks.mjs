#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getTenantV6Config, tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";

const repoRoot = process.cwd();

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function canonicalInputLabel(config) {
  return `datasets/tenant-inputs/${config.tenantKey}/standard-2026-07-v3`;
}

function approvedArtifactDir(config) {
  return path.join(repoRoot, "datasets/context-artifacts/approved", config.tenantKey, "home-knowledge");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function auditTenant(config) {
  const artifactDir = approvedArtifactDir(config);
  const storyFile = path.join(artifactDir, "approved-cxo-story-blocks.json");
  const visualFile = path.join(artifactDir, "approved-cxo-visual-specs.json");
  if (!fs.existsSync(storyFile)) throw new Error(`missing ${storyFile}`);
  if (!fs.existsSync(visualFile)) throw new Error(`missing ${visualFile}`);
  const story = readJson(storyFile);
  const visual = readJson(visualFile);
  const failures = [];
  if (story.tenant_key !== config.tenantKey) failures.push("story tenant mismatch");
  if (visual.tenant_key !== config.tenantKey) failures.push("visual tenant mismatch");
  if (story.validation?.status !== "pass") failures.push("story validation is not pass");
  if (visual.validation?.status !== "pass") failures.push("visual validation is not pass");
  if ((story.story_blocks || []).length !== 20) failures.push("expected 20 story blocks");
  if ((visual.visual_specs || []).length < 8) failures.push("expected at least 8 visual specs");
  return {
    tenantKey: config.tenantKey,
    canonicalInput: canonicalInputLabel(config),
    status: failures.length ? "Fail" : "Pass",
    failures,
    storyBlocks: story.story_blocks?.length ?? 0,
    visualSpecs: visual.visual_specs?.length ?? 0,
    score: story.validation?.overall ?? "",
    storyStore: "approved tenant-key Home/Knowledge advisory artifact store",
    visualStore: "approved tenant-key Home/Knowledge visual artifact store",
  };
}

const requested = arg("--tenant");
const configs = process.argv.includes("--all") || !requested
  ? tenantV6CanonicalConfigs
  : [getTenantV6Config(requested)];
if (configs.some((config) => !config)) throw new Error(`Unknown tenant ${requested}`);
const results = configs.map(auditTenant);
const outDir = path.join(repoRoot, "reports/multi-tenant-cxo-story-generation");
ensureDir(outDir);
fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify({
  generated_at: new Date().toISOString(),
  audit_status: results.every((result) => result.status === "Pass") ? "Pass" : "Fail",
  results,
}, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "summary.md"), `# Multi-Tenant CXO Story Generation\n\n${results.map((result) => `- ${result.tenantKey}: ${result.status} (${result.storyBlocks} story blocks, ${result.visualSpecs} visual specs, score ${result.score})`).join("\n")}\n`);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.status !== "Pass")) process.exit(1);

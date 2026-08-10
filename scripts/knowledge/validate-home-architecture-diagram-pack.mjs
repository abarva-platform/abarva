#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const defaultManifest = path.join(
  repoRoot,
  "datasets/tenant-inputs/skyharbor-air/approved-content/home/claude-architecture-diagram-pack.json",
);

const args = new Set(process.argv.slice(2));
const manifestArgIndex = process.argv.findIndex((arg) => arg === "--manifest");
const manifestPath =
  manifestArgIndex >= 0
    ? path.resolve(process.argv[manifestArgIndex + 1] ?? "")
    : defaultManifest;
const requireClaude = args.has("--require-claude");

const requiredTabs = new Set([
  "patterns",
  "economics",
  "posture",
  "coherence",
  "trajectory",
]);

const forbiddenPatterns = [
  /<script[\s>]/i,
  /<foreignObject[\s>]/i,
  /\son[a-z]+\s*=/i,
  /href\s*=\s*["']https?:\/\//i,
  /xlink:href\s*=\s*["']https?:\/\//i,
  /data:image\//i,
  /url\(\s*https?:\/\//i,
];

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Cannot read JSON ${filePath}: ${error.message}`);
    return null;
  }
}

function assetFsPath(assetPath) {
  if (typeof assetPath !== "string" || !assetPath.startsWith("/")) {
    return null;
  }
  return path.join(repoRoot, "public", assetPath);
}

const manifest = readJson(manifestPath);
if (!manifest) {
  process.exit(1);
}

if (manifest.artifact_type !== "home_architecture_diagram_pack") {
  fail("artifact_type must be home_architecture_diagram_pack");
}
if (manifest.tenant_key !== "skyharbor-air") {
  fail("tenant_key must be skyharbor-air for this checked pack");
}
if (manifest.no_post_claude_mutation !== true) {
  fail("no_post_claude_mutation must be true");
}
if (requireClaude && !String(manifest.generated_model ?? "").startsWith("claude-")) {
  fail("--require-claude requires generated_model to start with claude-");
}
if (
  requireClaude &&
  ![
    "claude_generated_pending_validation",
    "claude_generated_validation_pass",
  ].includes(manifest.authoring_status)
) {
  fail(
    "--require-claude requires a Claude-generated authoring_status pending or passed validation",
  );
}
if (!Array.isArray(manifest.diagrams) || manifest.diagrams.length < requiredTabs.size) {
  fail(`diagrams must include at least ${requiredTabs.size} entries`);
}

const seenTabs = new Set();
for (const diagram of manifest.diagrams ?? []) {
  if (!diagram || typeof diagram !== "object") {
    fail("Each diagram must be an object");
    continue;
  }
  for (const field of ["id", "tab", "title", "subtitle", "asset_path"]) {
    if (!diagram[field] || typeof diagram[field] !== "string") {
      fail(`Diagram ${diagram.id ?? "(unknown)"} missing string field ${field}`);
    }
  }
  if (diagram.tab) seenTabs.add(diagram.tab);
  if (!Array.isArray(diagram.source_refs) || diagram.source_refs.length === 0) {
    fail(`Diagram ${diagram.id ?? "(unknown)"} must include source_refs`);
  }

  const filePath = assetFsPath(diagram.asset_path);
  if (!filePath) {
    fail(`Diagram ${diagram.id ?? "(unknown)"} asset_path must be root-relative`);
    continue;
  }
  if (!fs.existsSync(filePath)) {
    fail(`Diagram ${diagram.id ?? "(unknown)"} asset does not exist: ${filePath}`);
    continue;
  }

  const svg = fs.readFileSync(filePath, "utf8");
  if (!svg.trim().startsWith("<svg")) {
    fail(`Diagram ${diagram.id} asset must start with <svg`);
  }
  if (!/\sviewBox\s*=/.test(svg)) {
    fail(`Diagram ${diagram.id} missing viewBox`);
  }
  if (!/<title[\s>]/i.test(svg) || !/<desc[\s>]/i.test(svg)) {
    fail(`Diagram ${diagram.id} must include title and desc`);
  }
  if ((svg.match(/<text[\s>]/gi) ?? []).length < 12) {
    fail(`Diagram ${diagram.id} does not have enough diagram text density`);
  }
  if (svg.length < 2500) {
    fail(`Diagram ${diagram.id} is too small to be an enterprise-grade exhibit`);
  }
  const xmlCheck = spawnSync("xmllint", ["--noout", filePath], {
    encoding: "utf8",
  });
  if (xmlCheck.error?.code === "ENOENT") {
    warn("xmllint is not available; XML well-formedness check skipped");
  } else if (xmlCheck.status !== 0) {
    fail(`Diagram ${diagram.id} is not well-formed XML: ${xmlCheck.stderr.trim()}`);
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(svg)) {
      fail(`Diagram ${diagram.id} contains forbidden SVG pattern: ${pattern}`);
    }
  }
}

for (const tab of requiredTabs) {
  if (!seenTabs.has(tab)) {
    fail(`Missing required diagram tab coverage: ${tab}`);
  }
}

if (!String(manifest.generated_model ?? "").startsWith("claude-")) {
  warn(
    "Pack is not Claude-generated yet; run generate-home-architecture-diagram-pack.mjs with ANTHROPIC_API_KEY for the final authored pack.",
  );
}

const report = {
  manifest: path.relative(repoRoot, manifestPath),
  checked_at: new Date().toISOString(),
  status: failures.length ? "fail" : "pass",
  warnings,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  process.exit(1);
}

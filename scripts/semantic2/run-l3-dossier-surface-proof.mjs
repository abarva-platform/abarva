#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function run(command, args, logFile, options = {}) {
  const output = execFileSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  fs.writeFileSync(logFile, output);
}

function runCaptureBoth(command, args, logFile) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const combined = `${result.stdout || ""}${result.stderr || ""}`;
  fs.writeFileSync(logFile, combined);
  if (combined.trim()) process.stderr.write(combined);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

const rootName = `semantic2-dossier-surface-eligibility-${stamp()}`;
const root = path.join("/tmp", rootName);
fs.mkdirSync(root, { recursive: true });

runCaptureBoth("npm", ["run", "semantic2:l3-dossiers:self-test"], path.join(root, "self-test.log"));
runCaptureBoth(
  "node",
  [
    "scripts/semantic2/build-enriched-l3-dossiers.mjs",
    "--apply",
    "--out-dir",
    path.join(root, "build"),
    "--sample-tenant",
    "lakeshore-holdings",
    "--sample-dimension",
    "organization_leadership",
    "--only-sample",
  ],
  path.join(root, "build.log"),
);
runCaptureBoth(
  "npx",
  ["tsx", "scripts/semantic2-dossier-eligibility-report.ts", "--out-dir", path.join(root, "eligibility")],
  path.join(root, "eligibility.log"),
);

const releaseRecordPath = "docs/releases/records/2026-06-26-semantic2-l3-dossier-extraction-eligibility.md";
if (fs.existsSync(releaseRecordPath)) {
  fs.copyFileSync(releaseRecordPath, path.join(root, "release-record.md"));
} else {
  fs.writeFileSync(
    path.join(root, "release-record.md"),
    [
      "# Release Record",
      "",
      "The source release record is tracked at `docs/releases/records/2026-06-26-semantic2-l3-dossier-extraction-eligibility.md`.",
      "The ACA runtime image used for this operator proof does not include `docs/`; see the repository release record for the controlled-release details.",
      "",
    ].join("\n"),
  );
}

const after = JSON.parse(fs.readFileSync(path.join(root, "build", "SAMPLE_DOSSIER.json"), "utf8"));
const before =
  'Before: prior reviewed sample had 120 facts, entities=0, relationships=0, and first fact entity="enterprise source material:source reference", entityType="Evidence item", value="required".';
const beforeAfter = [
  "# SAMPLE BEFORE/AFTER",
  "",
  before,
  "",
  `After: facts=${after.facts?.length || 0}, entities=${after.entities?.length || 0}, relationships=${after.relationships?.length || 0}`,
  "",
  "## First After Facts",
  "",
  "```json",
  JSON.stringify((after.facts || []).slice(0, 8), null, 2),
  "```",
  "",
  "## First After Entities",
  "",
  "```json",
  JSON.stringify((after.entities || []).slice(0, 10), null, 2),
  "```",
  "",
  "## First After Relationships",
  "",
  "```json",
  JSON.stringify((after.relationships || []).slice(0, 10), null, 2),
  "```",
  "",
  "## Derived Insights",
  "",
  ...((after.derived_insights || []).map((insight) => `- ${insight.insight} (${insight.confidence})`)),
  "",
].join("\n");
fs.writeFileSync(path.join(root, "SAMPLE_BEFORE_AFTER.md"), beforeAfter);
fs.writeFileSync(
  path.join(root, "VALIDATION_NOW_CATCHES.md"),
  [
    "# Validation Now Catches Prior Placeholder Bug",
    "",
    "The builder self-test and Jest regression include the old source-reference/required/defined sample and require business_language_clean=false / blocked.",
    "See `self-test.log` and the committed `src/lib/semantic2/dossiers/__tests__/dossier-surface-eligibility.test.ts` regression.",
    "",
  ].join("\n"),
);

const tarPath = path.join("/tmp", `${rootName}.tgz`);
run("tar", ["-czf", tarPath, "-C", "/tmp", rootName], path.join(root, "tar.log"));
const encoded = fs.readFileSync(tarPath).toString("base64");
console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
console.log(encoded);
console.log("__SEMANTIC2_PROOF_TGZ_END__");
console.log(`__SEMANTIC2_PROOF_ROOT__${rootName}`);

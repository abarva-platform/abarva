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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function levelCounts(rows) {
  return rows.reduce((acc, row) => {
    acc[row.eligibility_level] = (acc[row.eligibility_level] || 0) + 1;
    return acc;
  }, {});
}

function relationshipBeforeAfter(beforeRows, afterRows) {
  const beforeByKey = new Map(beforeRows.map((row) => [`${row.tenant_key}:${row.dimension_key}`, row]));
  const afterByKey = new Map(afterRows.map((row) => [`${row.tenant_key}:${row.dimension_key}`, row]));
  const keys = [...new Set([...beforeByKey.keys(), ...afterByKey.keys()])].sort();
  return [
    "# Relationships Before / After",
    "",
    "| Tenant | Dimension | Before relationships | After relationships | Delta | After level | Remaining blocker |",
    "|---|---|---:|---:|---:|---|---|",
    ...keys.map((key) => {
      const before = beforeByKey.get(key);
      const after = afterByKey.get(key);
      const [tenant, dimension] = key.split(":");
      const beforeCount = Number(before?.relationships || 0);
      const afterCount = Number(after?.relationships || 0);
      return `| ${tenant} | ${dimension} | ${beforeCount} | ${afterCount} | ${afterCount - beforeCount} | ${after?.eligibility_level || "not active"} | ${after?.reasons || ""} |`;
    }),
    "",
  ].join("\n");
}

function supersededRelationshipComparison(summary, afterRows) {
  const details = Array.isArray(summary?.supersede?.supersededRowDetails)
    ? summary.supersede.supersededRowDetails
    : [];
  const afterByKey = new Map(afterRows.map((row) => [`${row.tenant_key}:${row.dimension_key}`, row]));
  const comparable = details
    .map((row) => {
      const after = afterByKey.get(`${row.tenant_key}:${row.dimension_key}`);
      if (!after) return null;
      const oldCount = Number(row.relationship_count || 0);
      const activeCount = Number(after.relationships || 0);
      return { ...row, activeCount, delta: activeCount - oldCount, level: after.eligibility_level, blockers: after.reasons || "" };
    })
    .filter(Boolean)
    .sort((a, b) => b.delta - a.delta || String(a.tenant_key).localeCompare(String(b.tenant_key)));

  const positive = comparable.filter((row) => row.delta > 0);
  return [
    "# Superseded Generation vs Active v2",
    "",
    "This section compares the recoverably invalidated older generation to the active v2 row for the same tenant/dimension. It stays meaningful even when a rerun is idempotent and the active-before/active-after delta is zero.",
    "",
    `Comparable superseded rows: ${comparable.length}`,
    `Rows with relationship increase: ${positive.length}`,
    "",
    "| Tenant | Dimension | Superseded prompt | Old relationships | Active v2 relationships | Delta | Active level | Remaining blocker |",
    "|---|---|---|---:|---:|---:|---|---|",
    ...(comparable.length
      ? comparable.map(
          (row) =>
            `| ${row.tenant_key} | ${row.dimension_key} | ${row.prompt_version} | ${row.relationship_count || 0} | ${row.activeCount} | ${row.delta} | ${row.level || ""} | ${row.blockers} |`,
        )
      : ["| n/a | n/a | n/a | 0 | 0 | 0 | n/a | No comparable superseded active rows in this run. |"]),
    "",
  ].join("\n");
}

function activeEligibilityMarkdown(rows) {
  const counts = levelCounts(rows);
  return [
    "# Active Eligibility Report",
    "",
    `Rows evaluated: ${rows.length}`,
    `Ready: ${counts.ready || 0}`,
    `Partial: ${counts.partial || 0}`,
    `Blocked: ${counts.blocked || 0}`,
    `Operator-only: ${counts.operator_only || 0}`,
    "",
    "| Tenant | Dimension | Level | Coverage | Confidence | Facts | Entities | Relationships | Usable citations | Reasons | Required fixes |",
    "|---|---|---|---:|---:|---:|---:|---:|---:|---|---|",
    ...rows.map((row) => `| ${row.tenant_key} | ${row.dimension_key} | ${row.eligibility_level} | ${row.coverage} | ${row.confidence} | ${row.facts} | ${row.entities} | ${row.relationships} | ${row.usable_citations} | ${row.reasons || "Ready"} | ${row.required_fixes || ""} |`),
    "",
  ].join("\n");
}

function edgeProvenanceMarkdown(sample) {
  const citations = new Map((sample.citations || []).map((citation) => [citation.citation_id, citation]));
  const relationships = (sample.relationships || []).slice(0, 10);
  return [
    "# Edge Provenance",
    "",
    "Sampled relationships are derived only from grouped structured source fields. The citation column points back to the business-readable source area retained in the dossier.",
    "",
    "| From | Relationship | To | Citation | Source area | Confidence |",
    "|---|---|---|---|---|---:|",
    ...relationships.map((relationship) => {
      const citationId = relationship.citation_ids?.[0] || "";
      const citation = citations.get(citationId) || {};
      return `| ${relationship.from} | ${relationship.relationship} | ${relationship.to} | ${citationId} | ${citation.source_area || citation.label || ""} | ${relationship.confidence ?? ""} |`;
    }),
    "",
  ].join("\n");
}

const rootName = `semantic2-dossier-active-eligibility-${stamp()}`;
const root = path.join("/tmp", rootName);
fs.mkdirSync(root, { recursive: true });

runCaptureBoth("npm", ["run", "semantic2:l3-dossiers:self-test"], path.join(root, "self-test.log"));

runCaptureBoth(
  "npx",
  ["tsx", "scripts/semantic2-dossier-eligibility-report.ts", "--out-dir", path.join(root, "eligibility-before")],
  path.join(root, "eligibility-before.log"),
);

const buildArgs = [
  "scripts/semantic2/build-enriched-l3-dossiers.mjs",
  "--apply",
  "--supersede-old-generations",
  "--out-dir",
  path.join(root, "build"),
  "--sample-tenant",
  "lakeshore-holdings",
  "--sample-dimension",
  "organization_leadership",
];
if (process.env.L3_DOSSIER_ONLY_SAMPLE === "1") buildArgs.push("--only-sample");

runCaptureBoth(
  "node",
  buildArgs,
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
const buildSummary = JSON.parse(fs.readFileSync(path.join(root, "build", "summary.json"), "utf8"));
const beforeEligibilityRows = readJson(path.join(root, "eligibility-before", "eligibility-report.json"));
const afterEligibilityRows = readJson(path.join(root, "eligibility", "eligibility-report.json"));
fs.copyFileSync(path.join(root, "eligibility", "eligibility-report.csv"), path.join(root, "ACTIVE_ELIGIBILITY_REPORT.csv"));
fs.writeFileSync(path.join(root, "ACTIVE_ELIGIBILITY_REPORT.md"), activeEligibilityMarkdown(afterEligibilityRows));
fs.writeFileSync(
  path.join(root, "RELATIONSHIPS_BEFORE_AFTER.md"),
  [relationshipBeforeAfter(beforeEligibilityRows, afterEligibilityRows), supersededRelationshipComparison(buildSummary, afterEligibilityRows)].join("\n"),
);
fs.writeFileSync(path.join(root, "EDGE_PROVENANCE.md"), edgeProvenanceMarkdown(after));
fs.copyFileSync(path.join(root, "build", "SUPERSEDE_RECORD.md"), path.join(root, "SUPERSEDE_RECORD.md"));

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

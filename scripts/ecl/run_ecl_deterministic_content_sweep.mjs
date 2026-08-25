#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PLAN_DOC = "docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md";
const FINDINGS_SPEC = "docs/architecture/meridian-demo-findings-20260824.json";

function cleanMarkdownCell(value) {
  return value.trim().replace(/^`|`$/g, "");
}

function extractMarkdownTable(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `${PLAN_DOC} must contain ${heading}`);
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n#{1,6}\s+/);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));
  assert(lines.length >= 2, `${heading} must contain a markdown table`);
  const headers = lines[0].split("|").slice(1, -1).map(cleanMarkdownCell);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").slice(1, -1).map(cleanMarkdownCell);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function countBy(rows, key) {
  const counts = new Map();
  for (const row of rows) counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))));
}

function expectFileContains(file, needles) {
  const content = readFileSync(file, "utf8");
  return needles
    .filter((needle) => !content.includes(needle))
    .map((needle) => `${file}: missing ${needle}`);
}

function runCommand(command) {
  const result = spawnSync(command[0], command.slice(1), {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    command: command.join(" "),
    accepted: result.status === 0,
    status: result.status,
    stdout_excerpt: result.stdout.trim().slice(-1600),
    stderr_excerpt: result.stderr.trim().slice(-1600),
  };
}

const plan = readFileSync(PLAN_DOC, "utf8");
const surfaces = extractMarkdownTable(plan, "### Serving Surface Enumeration");
const findings = JSON.parse(readFileSync(FINDINGS_SPEC, "utf8")).findings ?? [];
const productCounts = countBy(surfaces, "product");

const contractIssues = [
  surfaces.length === 40 ? null : `surface_denominator_${surfaces.length}_expected_40`,
  productCounts.Home === 16 ? null : `home_surface_count_${productCounts.Home ?? 0}_expected_16`,
  productCounts.Tower === 9 ? null : `tower_surface_count_${productCounts.Tower ?? 0}_expected_9`,
  productCounts.Source === 9 ? null : `source_surface_count_${productCounts.Source ?? 0}_expected_9`,
  productCounts.Intelligence === 6 ? null : `intelligence_surface_count_${productCounts.Intelligence ?? 0}_expected_6`,
  findings.length === 10 ? null : `demo_findings_${findings.length}_expected_10`,
  ...expectFileContains("scripts/ecl/run_product_ecl_browser_smoke.mjs", [
    "--default-routes",
    "actual_route_repointing: ROUTE_MODE === \"default_routes\"",
    "findings_demonstrable_on_real_surface",
    "/750\\s+applications/i",
    "/230\\s+contracts/i",
    "/102\\s+vendors/i",
  ]),
  ...expectFileContains("src/lib/ecl/product-provider.ts", [
    "ECL_PRODUCT_DEFAULT_PROVIDER",
    "ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE",
    "\"ecl_projection_db\"",
  ]),
  ...expectFileContains("src/app/(maestro)/home/preview/page.tsx", [
    "resolveEclProductProvider(provider)",
    "getHomeEclProjectionBundle(tenantKey)",
  ]),
  ...expectFileContains("src/app/(maestro)/tower/page.tsx", [
    "resolveEclProductProvider(requestedProvider)",
    "readTowerEclProjectionPreview(canonicalTenantKey(effectiveClientKey))",
  ]),
  ...expectFileContains("src/app/(maestro)/intelligence/page.tsx", [
    "resolveEclProductProvider(requestedProvider)",
    "readIntelligenceEclContextPackPreview(",
  ]),
].filter(Boolean);

const commandResults = [
  runCommand(["npm", "run", "ecl:product-browser:predeploy-gate"]),
];

if (process.argv.includes("--browser-default-routes")) {
  commandResults.push(
    runCommand(["node", "scripts/ecl/run_product_ecl_browser_smoke.mjs", "--default-routes"]),
  );
}

const commandIssues = commandResults
  .filter((result) => !result.accepted)
  .map((result) => `${result.command}: exited ${result.status}`);

const summary = {
  accepted: contractIssues.length === 0 && commandIssues.length === 0,
  checked_at: new Date().toISOString(),
  gate: "deterministic_content_verified_against_ecl",
  denominators: {
    surfaces_served_by_contract: {
      numerator: surfaces.length,
      denominator: 40,
      product_counts: productCounts,
    },
    demo_findings_declared: {
      numerator: findings.length,
      denominator: 10,
    },
    findings_demonstrable_on_default_routes: process.argv.includes("--browser-default-routes")
      ? "measured_by_browser_default_routes"
      : "pending_browser_default_routes",
  },
  contract_issues: contractIssues,
  command_results: commandResults,
  command_issues: commandIssues,
  issue_count: contractIssues.length + commandIssues.length,
};

console.log(JSON.stringify(summary, null, 2));
assert.equal(summary.accepted, true, "ECL deterministic content sweep failed");

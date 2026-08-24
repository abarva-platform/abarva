#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const CHECKS = [
  {
    key: "smoke_home_requires_dense_ecl_counts",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "/home/preview?tenant=",
      "provider=ecl_projection_db",
      "/750\\s+applications/i",
      "/1350\\s+data\\s+flows/i",
      "/230\\s+contracts/i",
      "/220\\s+(?:infra|infrastructure)/i",
    ],
  },
  {
    key: "smoke_source_requires_dense_ecl_counts",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "/source/preview/workspace?provider=ecl_projection_db",
      "/230\\s+contracts/i",
      "/102\\s+vendors/i",
    ],
  },
  {
    key: "smoke_tower_requires_projection_panel",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "/tower?provider=ecl_projection_db",
      "/Tower command center projection is loaded/i",
      "/Gate state/i",
    ],
  },
  {
    key: "smoke_intelligence_requires_projection_panel",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "/intelligence?provider=ecl_projection_db",
      "/Intelligence context pack projection is loaded/i",
      "/Permitted facts/i",
      "/Blocked facts/i",
    ],
  },
  {
    key: "source_route_accepts_shared_provider_alias",
    file: "src/app/(maestro)/source/preview/workspace/page.tsx",
    mustContain: [
      "provider?: string",
      "params.sourceProvider ?? params.provider",
      "normalized === \"ecl_projection_db\"",
    ],
  },
  {
    key: "home_route_uses_ecl_provider",
    file: "src/app/(maestro)/home/preview/page.tsx",
    mustContain: [
      "searchParams: Promise<{ tenant?: string; provider?: string }>",
      "provider === \"ecl_projection_db\"",
      "getHomeEclProjectionBundle(tenantKey)",
    ],
  },
  {
    key: "tower_route_uses_ecl_provider",
    file: "src/app/(maestro)/tower/page.tsx",
    mustContain: [
      "const requestedProvider = firstSearchValue(resolved?.provider)",
      "requestedProvider === \"ecl_projection_db\"",
      "readTowerEclProjectionPreview(canonicalTenantKey(effectiveClientKey))",
    ],
  },
  {
    key: "intelligence_route_uses_ecl_provider",
    file: "src/app/(maestro)/intelligence/page.tsx",
    mustContain: [
      "const requestedProvider = firstSearchValue(resolvedSearchParams?.provider)",
      "requestedProvider === \"ecl_projection_db\"",
      "readIntelligenceEclContextPackPreview(",
    ],
  },
  {
    key: "smoke_keeps_non_default_cutover_boundary",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "actual_route_repointing: false",
      "provider: \"ecl_projection_db\"",
    ],
  },
  {
    key: "smoke_asserts_demo_findings_on_surfaces",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "DEMO_FINDING_ASSERTIONS",
      "findings demonstrable on a real surface",
      "findings_demonstrable_on_real_surface",
      "--validate-demo-findings-contract",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8",
      "F9",
      "F10",
    ],
  },
];

const COMMAND_CHECKS = [
  {
    key: "product_serving_route_fence",
    command: ["npm", "run", "test:ecl-product-serving-route-fence"],
  },
  {
    key: "source_provider_alias_unit",
    command: [
      "npx",
      "jest",
      "--runTestsByPath",
      "src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts",
      "--runInBand",
    ],
  },
  {
    key: "demo_findings_browser_contract",
    command: [
      "node",
      "scripts/ecl/run_product_ecl_browser_smoke.mjs",
      "--validate-demo-findings-contract",
    ],
  },
];

function expectFileContains({ key, file, mustContain }) {
  const content = readFileSync(file, "utf8");
  const missing = mustContain.filter((needle) => !content.includes(needle));
  return {
    key,
    file,
    accepted: missing.length === 0,
    missing,
  };
}

function runCommand({ key, command }) {
  const result = spawnSync(command[0], command.slice(1), {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    key,
    command: command.join(" "),
    accepted: result.status === 0,
    status: result.status,
    stdout_excerpt: result.stdout.trim().slice(-2000),
    stderr_excerpt: result.stderr.trim().slice(-2000),
  };
}

const staticResults = CHECKS.map(expectFileContains);
const commandResults = COMMAND_CHECKS.map(runCommand);
const issues = [
  ...staticResults.flatMap((result) =>
    result.missing.map((needle) => `${result.key}: missing ${needle} in ${result.file}`),
  ),
  ...commandResults
    .filter((result) => !result.accepted)
    .map((result) => `${result.key}: command failed (${result.command})`),
];

const summary = {
  accepted: issues.length === 0,
  checked_at: new Date().toISOString(),
  checks: {
    static: staticResults,
    command: commandResults,
  },
  issue_count: issues.length,
  issues,
  purpose:
    "Local pre-deploy gate for ECL product preview routes. It blocks route/provider/count-signature drift before ACA browser smoke.",
};

console.log(JSON.stringify(summary, null, 2));
assert.deepEqual(issues, [], "ECL product pre-deploy gate failed");

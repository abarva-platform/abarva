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
      "eclPath(\"/source/preview/workspace\")",
      "/230\\s+contracts/i",
      "sourceVendorCount: 102",
      "sourceVendorCount: 94",
      "TENANT_PROFILE.sourceVendorCount",
    ],
  },
  {
    key: "smoke_tower_requires_projection_panel",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "eclPath(\"/tower\")",
      "/IT INVESTMENT TOWER|Tower/i",
      "/Value Proof/i",
      "/Decision Lanes/i",
      "/AI Portfolio/i",
    ],
  },
  {
    key: "smoke_intelligence_requires_projection_panel",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "eclPath(\"/intelligence\")",
      "/Intelligence context pack projection is loaded/i",
      "/Permitted facts/i",
      "/Blocked facts/i",
    ],
  },
  {
    key: "source_route_accepts_shared_provider_alias",
    file: "src/app/(maestro)/source/workspace/page.tsx",
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
      "tenant?: string",
      "provider?: string",
      "resolveEclProductProvider(provider)",
      "getHomeEclProjectionBundle(tenantKey)",
    ],
  },
  {
    key: "tower_route_uses_ecl_provider",
    file: "src/app/(maestro)/tower/page.tsx",
    mustContain: [
      "const requestedProvider = firstSearchValue(resolved?.provider)",
      "resolveEclProductProvider(requestedProvider)",
      "readTowerEclProjectionPreview(",
      "canonicalTenantKey(effectiveClientKey)",
    ],
  },
  {
    key: "intelligence_route_uses_ecl_provider",
    file: "src/app/(maestro)/intelligence/page.tsx",
    mustContain: [
      "const requestedProvider = firstSearchValue(resolvedSearchParams?.provider)",
      "resolveEclProductProvider(requestedProvider)",
      "readIntelligenceEclContextPackPreview(",
    ],
  },
  {
    key: "smoke_supports_default_route_cutover_proof",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "--default-routes",
      "actual_route_repointing: ROUTE_MODE === \"default_routes\"",
      "provider: \"ecl_projection_db\"",
      "route_mode: ROUTE_MODE",
    ],
  },
  {
    key: "shared_provider_resolver_defaults_to_ecl",
    file: "src/lib/ecl/product-provider.ts",
    mustContain: [
      "return configuredDefaultProvider()",
      ": \"ecl_projection_db\"",
      "ECL_PRODUCT_DEFAULT_PROVIDER",
      "ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE",
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
  {
    key: "smoke_asserts_named_surface_denominator",
    file: "scripts/ecl/run_product_ecl_browser_smoke.mjs",
    mustContain: [
      "SURFACE_BROWSER_ASSERTIONS",
      "named surfaces browser-proven",
      "named_surfaces_browser_proven",
      "surface_assertion_count_",
      "home_executive_brief",
      "tower_value_proof",
      "source_contract_360",
      "intelligence_context_summary",
      "denominator: 40",
    ],
  },
  {
    key: "ecl_surface_coverage_labels_rendered_by_product_panels",
    file: "src/components/ecl/EclServingSurfaceCoverage.tsx",
    mustContain: [
      "Compare",
      "Approvals",
      "Adoption Lens",
      "Insights & Evaluate",
      "Pattern Detail",
      "Serving surfaces",
    ],
  },
  {
    key: "source_serving_views_filter_workspace_tabs",
    file: "docs/architecture/sql-drafts/ecl_serving_views_v1_draft.sql",
    mustContain: [
      "source_event_rows('source_events', 'events', 'events')",
      "source_event_rows('source_compare', 'compare', 'compare')",
      "source_event_rows('source_approvals', 'approvals', 'approvals')",
      "p.workspace_tab = workspace_tab_arg",
    ],
  },
  {
    key: "source_serving_views_separate_portfolio_and_opportunities",
    file: "docs/architecture/sql-drafts/ecl_serving_views_v1_draft.sql",
    mustContain: [
      "page_key_arg = 'vendor_portfolio'",
      "page_key_arg = 'vendor_360'",
      "p.contract_count > 1",
      "page_key_arg = 'sourcing_opportunities'",
      "p.opportunity_type <> 'evidence_request'",
    ],
  },
  {
    key: "source_workspace_reads_distinct_event_views",
    file: "src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts",
    mustContain: [
      "readProjectionViews(tenantKey, [",
      "\"source_events\"",
      "\"source_compare\"",
      "\"source_approvals\"",
      "readProjectionView(tenantKey, \"source_vendor_portfolio\")",
    ],
  },
  {
    key: "source_projection_load_checks_surface_rowset_distinctness",
    file: "scripts/ecl/load_dense_source_room_source_projection_layer.py",
    mustContain: [
      "source_serving_duplicate_row_key_sets",
      "source_serving_duplicate_row_key_set_pairs",
      "source_serving_empty_view_keys",
      "source_serving_required_empty_views",
      "row_key_digest",
      "source_sourcing_opportunities",
    ],
  },
  {
    key: "source_tower_intelligence_import_surface_coverage",
    file: "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx",
    mustContain: [
      "EclServingSurfaceCoverage",
      "product=\"source\"",
    ],
  },
  {
    key: "tower_imports_surface_coverage",
    file: "src/app/(maestro)/tower/page.tsx",
    mustContain: [
      "EclServingSurfaceCoverage",
      "product=\"tower\"",
    ],
  },
  {
    key: "intelligence_imports_surface_coverage",
    file: "src/app/(maestro)/intelligence/page.tsx",
    mustContain: [
      "EclServingSurfaceCoverage",
      "product=\"intelligence\"",
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
      "src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts",
      "src/lib/ecl/__tests__/product-provider.test.ts",
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
  {
    key: "intelligence_ava_eval_contract",
    command: ["npm", "run", "ecl:ava-consultant-eval"],
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

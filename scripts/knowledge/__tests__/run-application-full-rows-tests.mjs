#!/usr/bin/env node
// Zero-cost, zero-network regression suite for a real gap: the 900-row
// Applications & Systems inventory (full_rows) was only ever injected into
// the static retired V4 review fixture file by
// reconcile-tenant-applications.mjs's CLI side effect -- never into the
// actual candidate persisted to Postgres by the real generation pipeline
// (processTenant()'s book-mode branch). A freshly generated, approved, and
// live-served candidate would have shipped with an empty Applications &
// Systems grid and portfolio summary.
// Run: node scripts/knowledge/__tests__/run-application-full-rows-tests.mjs

import { attachApplicationFullRows } from "../build-home-knowledge-v4-review-pack.mjs";
import { buildApplicationFullRows } from "../reconcile-tenant-applications.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// --- buildApplicationFullRows: real data, no side effects ---

const skyharborBuilt = buildApplicationFullRows("skyharbor-air");
assert(
  skyharborBuilt && skyharborBuilt.fullRows.length === 900,
  `buildApplicationFullRows("skyharbor-air") returns the real 900-application inventory (got ${skyharborBuilt?.fullRows?.length})`,
);
assert(
  skyharborBuilt.fullRows.every((row) => row.app_id && row.name),
  "every real application row carries a real app_id and name",
);

const unknownTenant = buildApplicationFullRows("not-a-real-tenant");
assert(unknownTenant === null, "an unknown tenant key returns null rather than throwing or fabricating rows");

// --- attachApplicationFullRows: the real fix ---

const dimensionsWithApps = [
  { dimension_key: "profile" },
  { dimension_key: "apps" },
  { dimension_key: "vendors" },
];

const attached = attachApplicationFullRows(dimensionsWithApps, "skyharbor-air");
const appsDim = attached.find((d) => d.dimension_key === "apps");
assert(
  Array.isArray(appsDim.data_tab?.full_rows) && appsDim.data_tab.full_rows.length === 900,
  `attachApplicationFullRows attaches the real 900-row inventory onto the apps dimension's data_tab.full_rows (got ${appsDim.data_tab?.full_rows?.length})`,
);
assert(
  !attached.find((d) => d.dimension_key === "vendors").data_tab,
  "only the apps dimension is touched -- other dimensions (e.g. vendors) are left completely unchanged",
);

// Missing apps dimension: no crash, dimensions returned unchanged.
const noAppsDimensions = [{ dimension_key: "profile" }, { dimension_key: "vendors" }];
const noAppsResult = attachApplicationFullRows(noAppsDimensions, "skyharbor-air");
assert(
  noAppsResult === noAppsDimensions && !noAppsResult.some((d) => d.data_tab),
  "a dimensions array with no apps dimension is returned unchanged, not fabricated",
);

// Unknown tenant: no crash, no fabricated rows.
const unknownTenantResult = attachApplicationFullRows([{ dimension_key: "apps" }], "not-a-real-tenant");
assert(
  !unknownTenantResult.find((d) => d.dimension_key === "apps").data_tab,
  "an unknown tenant produces no fabricated full_rows -- the apps dimension is left without data_tab rather than inventing rows",
);

// Real cross-tenant isolation: first-capital's rows are its own real 260, not skyharbor's 900.
const firstCapitalAttached = attachApplicationFullRows([{ dimension_key: "apps" }], "first-capital");
const firstCapitalRows = firstCapitalAttached.find((d) => d.dimension_key === "apps").data_tab.full_rows;
assert(
  firstCapitalRows.length === 260 && firstCapitalRows.every((row) => !skyharborBuilt.fullRows.some((s) => s.app_id === row.app_id)),
  `first-capital gets its own real 260-application inventory, with no cross-tenant leakage from skyharbor-air's app_ids (got ${firstCapitalRows.length} rows)`,
);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll application-full-rows tests passed.");

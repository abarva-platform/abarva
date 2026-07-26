#!/usr/bin/env node
// Zero-cost, zero-network regression suite for a real fabrication bug in
// resolveVisualDataPoints(): a blank numeric measure was coerced to 0
// instead of excluding the row, turning an explicit "we do not have this
// number" source signal into a fabricated $0 bar or (0,0) scatter point.
// Confirmed against real tenant data: meridian-health's F12 budget file has
// exactly one row, a deliberate sentinel (line_id "MER-BUDGET-NOT-LOADED",
// spend_type "not_loaded", budget_fy26_usd blank, notes "Tower projection
// intentionally avoids invented budget values"); meridian-health's T01
// programs file has 0/7 rows with promised_benefit_usd or
// measured_value_usd populated at all.
// Run: node scripts/knowledge/__tests__/run-visual-data-fabrication-tests.mjs

import {
  DIMENSION_DATASET_BINDINGS,
  VISUAL_RENDER_RULES,
  loadTenantDatasetRegistry,
  resolveVisualDataPoints,
} from "../build-home-knowledge-v4-review-pack.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

function visualBindingFor(dimensionKey) {
  const binding = DIMENSION_DATASET_BINDINGS[dimensionKey];
  const rule = VISUAL_RENDER_RULES[binding.primary_dataset];
  return {
    dataset_id: binding.primary_dataset,
    visual_type: rule.visual_type,
    dimension: rule.dimension,
    measure: rule.measure,
    sort: "descending",
    limit: rule.limit,
  };
}

function packetFor(tenantKey) {
  return { deterministic_dataset_registry: loadTenantDatasetRegistry(tenantKey) };
}

// --- meridian-health: the real sentinel-row case ---

const meridianBudget = resolveVisualDataPoints(visualBindingFor("budget"), packetFor("meridian-health"));
assert(
  meridianBudget.length === 0,
  `meridian-health budget has zero real budget_fy26_usd values (deliberate not_loaded sentinel row) -> resolveVisualDataPoints returns [] instead of a fabricated $0 bar (got ${meridianBudget.length} points)`,
);

const meridianPrograms = resolveVisualDataPoints(visualBindingFor("programs"), packetFor("meridian-health"));
assert(
  meridianPrograms.length === 0,
  `meridian-health programs has zero real measured_value_usd values -> resolveVisualDataPoints returns [] instead of fabricated (0,0) scatter points (got ${meridianPrograms.length} points)`,
);

// --- first-capital: real, well-populated data must still resolve ---

const firstCapitalBudget = resolveVisualDataPoints(visualBindingFor("budget"), packetFor("first-capital"));
assert(
  firstCapitalBudget.length > 0 && firstCapitalBudget.every((p) => p.value > 0),
  `first-capital budget has 13/13 real budget_fy26_usd values -> resolveVisualDataPoints returns real nonzero bars (got ${firstCapitalBudget.length} points)`,
);

const firstCapitalVendors = resolveVisualDataPoints(visualBindingFor("vendors"), packetFor("first-capital"));
assert(
  firstCapitalVendors.length > 0 && firstCapitalVendors.every((p) => p.value > 0),
  `first-capital vendors has 120/120 real annual_contract_value_usd values -> resolveVisualDataPoints returns real nonzero bars (got ${firstCapitalVendors.length} points)`,
);

// first-capital programs: 42 rows total, only 36 have a real measured_value_usd.
// The 6 rows without one must be excluded, not plotted at y=0.
const firstCapitalPrograms = resolveVisualDataPoints(visualBindingFor("programs"), packetFor("first-capital"));
assert(
  firstCapitalPrograms.length > 0 && firstCapitalPrograms.length <= 36,
  `first-capital programs excludes the 6/42 rows with no real measured_value_usd rather than plotting them at (x, 0) (got ${firstCapitalPrograms.length} points, expected <= 36)`,
);
assert(
  firstCapitalPrograms.every((p) => Number.isFinite(p.y) && p.y > 0),
  "first-capital programs scatter points all carry a real nonzero measured_value_usd, never a fabricated 0",
);

// --- skyharbor-air: partially-populated programs measure ---

const skyharborPrograms = resolveVisualDataPoints(visualBindingFor("programs"), packetFor("skyharbor-air"));
assert(
  skyharborPrograms.length > 0 && skyharborPrograms.length <= 16,
  `skyharbor-air programs excludes the 14/30 rows with no real measured_value_usd (got ${skyharborPrograms.length} points, expected <= 16)`,
);

// --- apps (count-based measure) is unaffected by the fix ---
// visual_binding.limit caps this at the top 7 domains, so the returned set
// is a subset of the real 900-application total, not the full sum -- this
// only checks the "count" code path still produces real, nonzero groups.

const skyharborApps = resolveVisualDataPoints(visualBindingFor("apps"), packetFor("skyharbor-air"));
assert(
  skyharborApps.length > 0 && skyharborApps.every((p) => Number.isFinite(p.value) && p.value > 0),
  `skyharbor-air apps (count measure, unaffected by the fix) still returns real nonzero domain counts (got ${skyharborApps.length} points)`,
);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll visual-data-fabrication tests passed.");

#!/usr/bin/env node
// Zero-cost, zero-network regression suite for a real, previously-shipped
// bug: HeatmapVisual (src/components/home/v4/HomeV4VisualRenderer.tsx)
// builds its grid from data_points[].row/col, but resolveVisualDataPoints()
// only ever produced {label, value} -- every point collapsed onto the same
// blank row/col key and rendered as a single empty cell. Confirmed live: the
// Risk & Controls heatmap rendered as a blank gray box on a real approved
// candidate. Fix: risk_register's VISUAL_RENDER_RULES entry now names a real
// secondary_dimension (control_status, a real T09_risk-governance.csv
// column), and resolveVisualDataPoints has a dedicated two-dimensional
// branch for visual_type "heatmap".
// Run: node scripts/knowledge/__tests__/run-heatmap-2d-tests.mjs

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
    secondary_dimension: rule.secondary_dimension,
    measure: rule.measure,
    limit: rule.limit,
  };
}

function packetFor(tenantKey) {
  return { deterministic_dataset_registry: loadTenantDatasetRegistry(tenantKey) };
}

// --- the real bug scenario, now fixed ---

assert(
  VISUAL_RENDER_RULES.risk_register.secondary_dimension === "control_status",
  "risk_register's render rule names a real secondary_dimension (control_status), not left as a single-dimension binding",
);

const skyharborRiskCells = resolveVisualDataPoints(visualBindingFor("risks"), packetFor("skyharbor-air"));

assert(
  skyharborRiskCells.length > 0,
  `skyharbor-air risk heatmap produces real (row, col) cells instead of collapsing to one blank cell (got ${skyharborRiskCells.length})`,
);
assert(
  skyharborRiskCells.every((cell) => cell.row && cell.col && Number.isFinite(cell.value) && cell.value > 0),
  "every cell carries a real row (risk_domain), a real col (control_status), and a real nonzero count",
);
assert(
  new Set(skyharborRiskCells.map((c) => c.row)).size > 1,
  `real distinct risk_domain values appear as rows (got ${new Set(skyharborRiskCells.map((c) => c.row)).size} distinct)`,
);
assert(
  new Set(skyharborRiskCells.map((c) => c.col)).size > 1,
  `real distinct control_status values appear as columns (got ${new Set(skyharborRiskCells.map((c) => c.col)).size} distinct)`,
);

const firstCapitalRiskCells = resolveVisualDataPoints(visualBindingFor("risks"), packetFor("first-capital"));
assert(
  firstCapitalRiskCells.length > 0 && firstCapitalRiskCells.every((c) => c.value > 0),
  `first-capital risk heatmap also produces real, nonzero 2D cells (got ${firstCapitalRiskCells.length})`,
);

// --- defensive: a heatmap binding with no secondary_dimension configured ---
// returns an honest empty array rather than guessing at a fake second axis.

const misconfigured = resolveVisualDataPoints(
  { dataset_id: "risk_register", visual_type: "heatmap", dimension: "risk_domain", measure: "count" },
  packetFor("skyharbor-air"),
);
assert(
  misconfigured.length === 0,
  "a heatmap binding with no secondary_dimension configured returns [] (honest empty state), not a fabricated single-cell grid",
);

// --- regression: non-heatmap visual types are unaffected ---

const skyharborApps = resolveVisualDataPoints(visualBindingFor("apps"), packetFor("skyharbor-air"));
assert(
  skyharborApps.length > 0 && skyharborApps.every((p) => "label" in p && "value" in p && !("row" in p)),
  "non-heatmap visual types (e.g. apps treemap) are completely unaffected -- still {label, value}, no row/col fields",
);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll heatmap 2D tests passed.");

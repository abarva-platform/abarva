#!/usr/bin/env node
// Zero-cost, zero-network regression suite for the relationship-graph
// schema-agnostic fix in deriveGraphBinding() / resolveRelationshipGraphVisual().
//
// Direct inspection of real regenerated content found relationship_samples
// is NOT one fixed shape across tenants: first-capital and skyharbor-air
// carry real typed edges (from_object_name/to_object_name/relationship_type),
// but meridian-health's real source data carries a different real shape
// instead (business_name/use_case/affected_systems, a semicolon-joined
// system list, no typed edges at all). The original single-shape reader
// silently produced node_count: 0 on meridian-health -- a real counting
// bug, not an honest "no relationship evidence" state. These tests cover
// both real shapes plus the empty case, and the new real graph_visual for
// the `rel` dimension.
//
// Run: node scripts/knowledge/__tests__/run-relationship-graph-tests.mjs

import { deriveGraphBinding, resolveRelationshipGraphVisual } from "../build-home-knowledge-v4-review-pack.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

const TYPED_EDGE_ROWS = [
  { row_index: 1, from_object_name: "Catering", to_object_name: "Catering Hub 8", relationship_type: "uses" },
  { row_index: 2, from_object_name: "Ops", to_object_name: "Flight Ops System", relationship_type: "owns" },
  { row_index: 3, from_object_name: "Flight Ops System", to_object_name: "Catering Hub 8", relationship_type: "feeds" },
  { row_index: 4, from_object_name: "Catering", to_object_name: "Vendor Portal", relationship_type: "uses" },
];

const ALTERNATE_SHAPE_ROWS = [
  {
    row_index: 1,
    business_name: "Unified clinical + claims lakehouse: No certified medallion architecture",
    use_case: "Unified clinical + claims lakehouse",
    affected_systems: "Epic Clarity; Epic Caboodle; Databricks on AWS",
  },
  {
    row_index: 2,
    business_name: "Unified clinical + claims lakehouse: No identity spine",
    use_case: "Unified clinical + claims lakehouse",
    affected_systems: "Epic Clarity; Epic Caboodle; Databricks on AWS",
  },
  {
    row_index: 3,
    business_name: "Governed data foundation: No formal governance",
    use_case: "Governed data foundation for AI / LLM automation",
    affected_systems: "SQL Server reporting marts; Needs evidence",
  },
];

// --- deriveGraphBinding ---

{
  const binding = deriveGraphBinding("rel", { business_context_samples: { relationship_samples: TYPED_EDGE_ROWS } });
  assert(binding.node_count === 5, `typed-edge rows: real distinct node count (got ${binding.node_count}, expected 5: Catering, Catering Hub 8, Ops, Flight Ops System, Vendor Portal)`);
  assert(binding.edge_count === 4, `typed-edge rows: edge count is row count (got ${binding.edge_count})`);
  assert(
    JSON.stringify(binding.relationship_types) === JSON.stringify(["feeds", "owns", "uses"]),
    `typed-edge rows: real distinct relationship types, sorted (got ${JSON.stringify(binding.relationship_types)})`,
  );
}

{
  // This exact shape previously produced node_count: 0 -- the real bug this fix closes.
  const binding = deriveGraphBinding("rel", { business_context_samples: { relationship_samples: ALTERNATE_SHAPE_ROWS } });
  assert(binding.node_count === 4, `alternate-shape rows: real distinct system count, excluding "Needs evidence" (got ${binding.node_count}, expected 4)`);
  assert(binding.edge_count === 3, `alternate-shape rows: edge count is row count (got ${binding.edge_count})`);
  assert(
    binding.relationship_types.includes("Governed data foundation for AI / LLM automation") &&
      binding.relationship_types.includes("Unified clinical + claims lakehouse"),
    "alternate-shape rows: distinct use_case values surfaced in place of relationship types",
  );
}

{
  const binding = deriveGraphBinding("rel", { business_context_samples: { relationship_samples: [] } });
  assert(binding.node_count === 0 && binding.edge_count === 0, "empty rows: honest zero counts, not a crash");
  assert(!!binding.empty_state, "empty rows: empty_state message present");
}

{
  const binding = deriveGraphBinding("vendors", { business_context_samples: { relationship_samples: TYPED_EDGE_ROWS } });
  assert(binding === null, "non-graph-eligible dimension (vendors) returns null, never forces a graph");
}

// --- resolveRelationshipGraphVisual ---

{
  const visual = resolveRelationshipGraphVisual({ business_context_samples: { relationship_samples: TYPED_EDGE_ROWS } });
  assert(visual.visual_type === "relationship_graph", "typed-edge rows: produces a real relationship_graph visual");
  const groupNames = visual.node_groups.map((g) => g.group).sort();
  assert(JSON.stringify(groupNames) === JSON.stringify(["feeds", "owns", "uses"]), `typed-edge rows: node_groups keyed by relationship_type (got ${JSON.stringify(groupNames)})`);
  const usesGroup = visual.node_groups.find((g) => g.group === "uses");
  assert(usesGroup.examples.length === 2, `typed-edge rows: "uses" group carries its 2 real from→to examples (got ${usesGroup.examples.length})`);
  assert(usesGroup.examples.every((e) => e.includes("→")), "typed-edge rows: examples are real from→to pairs, not placeholders");
}

{
  const visual = resolveRelationshipGraphVisual({ business_context_samples: { relationship_samples: ALTERNATE_SHAPE_ROWS } });
  assert(visual.visual_type === "relationship_graph", "alternate-shape rows: still produces a real relationship_graph visual");
  const lakehouseGroup = visual.node_groups.find((g) => g.group === "Unified clinical + claims lakehouse");
  assert(!!lakehouseGroup, "alternate-shape rows: node_groups keyed by use_case");
  assert(
    lakehouseGroup.examples.includes("Epic Clarity") && !lakehouseGroup.examples.includes("Needs evidence"),
    `alternate-shape rows: examples are real affected systems, "Needs evidence" filtered out (got ${JSON.stringify(lakehouseGroup.examples)})`,
  );
}

{
  const visual = resolveRelationshipGraphVisual({ business_context_samples: { relationship_samples: [] } });
  assert(visual === null, "empty rows: resolveRelationshipGraphVisual returns null rather than an empty/fake graph");
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll relationship-graph tests passed.");
}

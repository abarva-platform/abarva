#!/usr/bin/env node
// Gate 2.1 Phase B regression suite for scripts/data-build/tenant-scenario-model/scenario-model.mjs.
// Proves the stable-ID/reference/projection/validation engine works before
// Phase C (Meridian adapter) or Phase D (enrichment) build a single real
// graph on top of it.
//
// Run: node scripts/data-build/tenant-scenario-model/__tests__/run-scenario-model-tests.mjs
import {
  manifest,
  makeStableId,
  parseStableId,
  createGraph,
  addEntity,
  validateGraph,
  projectEntity,
  buildCrosswalk,
  UNRESOLVED_REF,
} from "../scenario-model.mjs";
import { semanticRules } from "../../../audit/tenant-input-semantic-quality.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// --- Manifest self-consistency: every reference field's refType(s) are real
// entity types (or "any"); every projectsTo.domain is a real Gate-2-known
// domain. Catches typos in the manifest itself before anyone builds on it. ---
{
  const entityTypeKeys = new Set(Object.keys(manifest.entityTypes));
  const knownDomains = new Set(Object.keys(semanticRules.domains));
  let badRefTypes = [];
  let badDomains = [];
  for (const [type, def] of Object.entries(manifest.entityTypes)) {
    for (const refDef of def.referenceFields || []) {
      const types = refDef.refType === "any" ? [] : Array.isArray(refDef.refType) ? refDef.refType : [refDef.refType];
      for (const t of types) if (!entityTypeKeys.has(t)) badRefTypes.push(`${type}.${refDef.field} -> ${t}`);
    }
    for (const projection of def.projectsTo || []) {
      if (!knownDomains.has(projection.domain)) badDomains.push(`${type} -> ${projection.domain}`);
    }
  }
  assert(badRefTypes.length === 0, `every referenceField's refType is a declared entity type (bad: ${badRefTypes.join(", ")})`);
  assert(badDomains.length === 0, `every projectsTo.domain is a real Gate-2-known domain (bad: ${badDomains.join(", ")})`);
  assert(entityTypeKeys.size === 24, `the manifest declares all 24 entity types from the Gate 2.1 directive (got ${entityTypeKeys.size})`);
}

// --- Stable IDs ---
assert(makeStableId("leader", 6) === "LEADER-006", "makeStableId zero-pads to 3 digits");
assert(makeStableId("application", 21) === "SYS-021", "makeStableId uses the entity type's declared idPrefix");
assert(parseStableId("LEADER-006").prefix === "LEADER" && parseStableId("LEADER-006").sequence === 6, "parseStableId round-trips a well-formed ID");
assert(parseStableId("not-an-id-at-all") === null, "parseStableId returns null for a malformed ID rather than throwing");
{
  let threw = false;
  try {
    makeStableId("not_a_real_type", 1);
  } catch {
    threw = true;
  }
  assert(threw, "makeStableId throws for an entity type not declared in the manifest");
}

// --- The user's own worked example: Program PRG-014 with sponsor/system/data/vendor/metric/risk refs ---
{
  const graph = createGraph("fixture-tenant");
  const leader = addEntity(graph, "leader", { display_name: "Chief Data Officer", title: "CDO" });
  const sys1 = addEntity(graph, "application", { system_name: "Retail Lakehouse" });
  const sys2 = addEntity(graph, "application", { system_name: "Order Management" });
  const dataAsset = addEntity(graph, "data_asset", { data_asset_name: "Customer 360 Feed", data_domain: "customer" });
  const vendor = addEntity(graph, "vendor", { vendor_name: "Databricks" });
  const metric = addEntity(graph, "metric", { metric_name: "Forecast accuracy" });
  const risk = addEntity(graph, "risk", { risk_or_control_name: "Data quality gap" });
  const program = addEntity(
    graph,
    "program",
    { program_name: "Retail lakehouse and customer inventory graph", objective: "Unify inventory and customer views", status: "at_risk", phase: "mobilize", budget_usd: "95000000", expected_value_usd: "95000000" },
    {
      sponsor_ref: leader.id,
      system_refs: [sys1.id, sys2.id],
      data_refs: [dataAsset.id],
      vendor_refs: [vendor.id],
      metric_refs: [metric.id],
      risk_refs: [risk.id],
    },
  );

  const validation = validateGraph(graph);
  assert(validation.valid, `the worked-example graph validates cleanly (errors: ${JSON.stringify(validation.errors)})`);

  const row = projectEntity(graph, program, "programs_initiatives");
  assert(row.program_name === "Retail lakehouse and customer inventory graph", "the projected program row carries the entity's own field");
  assert(row.business_sponsor === "Chief Data Officer", "the projected program row resolves sponsor_ref to the leader's display name, not the raw ID");

  const crosswalk = buildCrosswalk(graph);
  const programCrosswalkRow = crosswalk.find((r) => r.stable_id === program.id);
  assert(programCrosswalkRow && programCrosswalkRow.entity_type === "program" && programCrosswalkRow.projected_domain === "programs_initiatives", "the crosswalk preserves the program's stable ID against its projected domain");
}

// --- Validation catches real defects, doesn't silently pass them through ---
{
  const graph = createGraph("fixture-tenant");
  addEntity(graph, "program", { program_name: "Orphan program" }, { sponsor_ref: "LEADER-999" });
  const validation = validateGraph(graph);
  assert(validation.valid === false, "a reference pointing at a nonexistent entity fails validation");
  assert(validation.errors.some((e) => e.error.includes("does not exist in the graph")), "the validation error names the specific unresolved reference");
}
{
  const graph = createGraph("fixture-tenant");
  const vendor = addEntity(graph, "vendor", { vendor_name: "Salesforce" });
  addEntity(graph, "program", { program_name: "Wrong-typed sponsor" }, { sponsor_ref: vendor.id });
  const validation = validateGraph(graph);
  assert(validation.valid === false, "a reference pointing at an entity of the wrong type fails validation");
  assert(validation.errors.some((e) => e.error.includes("expected one of")), "the validation error names the expected type(s)");
}
{
  const graph = createGraph("fixture-tenant");
  addEntity(graph, "program", { program_name: "Missing required sponsor" }, {});
  const validation = validateGraph(graph);
  assert(validation.valid === false, "a missing required reference field fails validation");
}

// --- UNRESOLVED_REF: a disclosed, confirmed gap is a warning, not an error ---
{
  const graph = createGraph("fixture-tenant");
  addEntity(graph, "program", { program_name: "Source data has no sponsor field at all" }, { sponsor_ref: UNRESOLVED_REF });
  const validation = validateGraph(graph);
  assert(validation.valid === true, "an explicitly UNRESOLVED_REF required reference does not fail validation (it's a disclosed gap, not an omission)");
  assert(validation.warnings.some((w) => w.warning.includes("sponsor_ref") && w.warning.includes("unresolved")), "the unresolved reference is still surfaced as a warning, not silently dropped");
}
{
  const graph = createGraph("fixture-tenant");
  const program = addEntity(graph, "program", { program_name: "Unresolved sponsor projects blank, not a crash" }, { sponsor_ref: UNRESOLVED_REF });
  const row = projectEntity(graph, program, "programs_initiatives");
  assert(row.business_sponsor === "", "projecting an entity with an UNRESOLVED_REF reference produces a blank column, not a thrown error or a stray sentinel string");
}
{
  const graph = createGraph("fixture-tenant");
  const explicitId = "LEADER-001";
  addEntity(graph, "leader", { display_name: "A" }, {}, explicitId);
  let threw = false;
  try {
    addEntity(graph, "leader", { display_name: "B" }, {}, explicitId);
  } catch {
    threw = true;
  }
  assert(threw, "adding a duplicate stable ID throws rather than silently overwriting the first entity");
}

// --- Multi-value ("[]") projection ---
{
  const graph = createGraph("fixture-tenant");
  const fn1 = addEntity(graph, "function", { function_name: "Finance" });
  const fn2 = addEntity(graph, "function", { function_name: "Merchandising" });
  const bu = addEntity(graph, "business_unit", { org_unit: "Corporate" }, { owned_function_refs: [fn1.id, fn2.id] });
  const row = projectEntity(graph, bu, "org_ownership");
  assert(row.owned_functions === "Finance; Merchandising", `a many-cardinality reference projects as a "; "-joined list of display names (got "${row.owned_functions}")`);
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

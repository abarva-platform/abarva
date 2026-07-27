#!/usr/bin/env node
// Gate 2.1 Phase C regression suite for
// scripts/data-build/tenant-scenario-model/meridian-tower-fact-adapter.mjs.
// Proves, against meridian-health's real, git-tracked active files: the
// executive-interview-row filter works, the graph validates cleanly, real
// content resolves through real leader entities, deliberately unresolved
// fields are disclosed rather than fabricated or silently dropped, and the
// domains with no real content to adapt are explicitly marked NOT ADAPTED
// rather than force-fitted.
//
// Run: node scripts/data-build/tenant-scenario-model/__tests__/run-meridian-tower-fact-adapter-tests.mjs
import { buildMeridianGraph, realContentRows, readDomainCsv } from "../meridian-tower-fact-adapter.mjs";
import { validateGraph, projectEntity } from "../scenario-model.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// --- realContentRows: the universal executive-interview filter ---
{
  const { rows } = readDomainCsv("03");
  const real = realContentRows(rows);
  assert(rows.length === 221, `03_workforce_roles.csv has 221 raw rows in the real repo (got ${rows.length})`);
  assert(real.length === 0, `workforce_roles has zero non-interview rows -- confirmed no real workforce content exists to adapt (got ${real.length})`);
}
{
  const { rows } = readDomainCsv("01");
  const real = realContentRows(rows);
  assert(real.length === 7, `business_functions has exactly 7 real (non-interview) rows (got ${real.length})`);
  assert(real.every((r) => r.source_type !== "executive_interview"), "every real-content row genuinely excludes the executive_interview source_type");
}

// --- The full graph builds and validates cleanly against real data ---
const graph = buildMeridianGraph();
const validation = validateGraph(graph);
assert(validation.valid, `the meridian scenario graph validates cleanly (errors: ${JSON.stringify(validation.errors)})`);
assert(validation.warnings.length > 0, "the graph carries at least one disclosed UNRESOLVED_REF warning (program.sponsor_ref), proving unresolved fields are surfaced, not hidden");

const entities = [...graph.entities.values()];

// --- Real content resolves correctly end to end (graph -> projection) ---
{
  const enterprise = entities.find((e) => e.entityType === "enterprise");
  assert(enterprise.fields.entity_name === "Meridian Health System", `the enterprise entity's identity is the real business_name (got "${enterprise.fields.entity_name}")`);
  assert(Number(enterprise.fields.employee_count) > 0, "the enterprise entity's employee_count is populated from the disclosed detail row, not left blank");
}
{
  const fn = entities.find((e) => e.entityType === "function" && e.fields.function_name === "Enterprise Data and Analytics");
  assert(fn, "a real function entity exists for \"Enterprise Data and Analytics\"");
  const row = projectEntity(graph, fn, "business_functions");
  assert(row.executive_owner === "CDAO", `the function's executive_owner resolves through a real leader reference to the source's owner_role, not a raw ID or blank (got "${row.executive_owner}")`);
}
{
  const leaders = entities.filter((e) => e.entityType === "leader");
  const distinctNames = new Set(leaders.map((l) => l.fields.display_name));
  assert(leaders.length === distinctNames.size, "no two leader entities share the same display name -- deduplication across domains works");
  assert(leaders.some((l) => l.fields.display_name === "CDAO"), "a real leader entity was created for \"CDAO\", not left as a disconnected string");
}
{
  const program = entities.find((e) => e.entityType === "program" && e.fields.program_name === "Unified clinical + claims lakehouse");
  assert(program, "the grouped-by-use_case program entity exists with the real use_case as its identity");
  assert(program.refs.sponsor_ref === "__unresolved__", "the program's sponsor_ref is the explicit UNRESOLVED_REF sentinel, not a guessed leader or a silently omitted field");
  const row = projectEntity(graph, program, "programs_initiatives");
  assert(row.business_sponsor === "", "projecting the program produces a blank business_sponsor column, not a crash or a fabricated name");
}
{
  const vendor = entities.find((e) => e.entityType === "vendor" && e.fields.vendor_name === "Epic");
  const contract = entities.find((e) => e.entityType === "contract" && e.refs.vendor_ref === vendor?.id);
  assert(vendor && contract, "a real vendor+contract pair exists for \"Epic\", built from one source row per the v3 vendor+contract row-combination pattern");
}

// --- Entity counts match direct investigation of the real files ---
{
  const countsByType = {};
  for (const e of entities) countsByType[e.entityType] = (countsByType[e.entityType] || 0) + 1;
  assert(countsByType.function === 7, `7 function entities (matches business_functions' 7 real rows, got ${countsByType.function})`);
  assert(countsByType.business_unit === 7, `7 business_unit entities (matches org_ownership's 7 real rows, got ${countsByType.business_unit})`);
  assert(countsByType.application === 20, `20 application entities (matches applications_systems' 20 real rows, got ${countsByType.application})`);
  assert(countsByType.platform === 15, `15 platform entities -- infrastructure_platforms has NO interview contamination, confirmed directly (got ${countsByType.platform})`);
  assert(countsByType.industry_pattern === 7 && countsByType.expert_lens === 7, `industry_pattern and expert_lens both have exactly 7 entities from the same shared source rows (got ${countsByType.industry_pattern}/${countsByType.expert_lens})`);
  assert(!countsByType.data_asset, "no data_asset entities were created -- 05_data_assets_integrations' real content duplicates the program narrative, not discrete named assets, and forcing entities here would fabricate identity");
  assert(!countsByType.process, "no process entities were created -- 18_operational_process_evidence's real rows have zero process-specific fields populated");
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

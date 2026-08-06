#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import * as yaml from "js-yaml";
import pg from "pg";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const { Client } = pg;

const MERIDIAN_HEALTH_DEMO_TENANT = "meridian_health_global";
const SKYHARBOR_TENANT = "skyharbor_global";
const CANARY_SCHEMA = "foundation_v2_meridian_health_cube_canary";
const MODEL_PATH = firstExistingPath(["cube/model/meridian_health_demo.yml", "model/meridian_health_demo.yml"]);
const REWRITE_PATH = firstExistingPath(["cube/cube.py", "cube.py"]);

const args = parseArgs(process.argv.slice(2));
const baseUrl = (args.url || process.env.MERIDIAN_HEALTH_CUBE_CANARY_URL || process.env.SOURCE_CUBE_URL || "http://127.0.0.1:4000").replace(/\/$/u, "");
const apiSecret = args.secret || process.env.CUBEJS_API_SECRET;
const databaseUrl =
  process.env.SOURCE_CUBE_DATABASE_URL ||
  process.env.SOURCE_CONTEXT_DATABASE_URL ||
  process.env.AZURE_LAB_DATABASE_URL ||
  process.env.ABARVA_AZURE_DATABASE_URL ||
  process.env.AZURE_DATABASE_URL ||
  process.env.DATABASE_URL;

function firstExistingPath(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

const meridianFamilies = [
  {
    name: "vendor_portfolio",
    cubeMeasures: [
      "meridian_health_vendor_portfolio.count",
      "meridian_health_vendor_portfolio.contract_family_count",
      "meridian_health_vendor_portfolio.invoice_line_amount",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(contract_family_count)::numeric AS contract_family_count, sum(invoice_line_amount)::numeric AS invoice_line_amount FROM ${CANARY_SCHEMA}.meridian_health_vendor_portfolio_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_vendor_portfolio.count", "count", 0],
      ["meridian_health_vendor_portfolio.contract_family_count", "contract_family_count", 0.01],
      ["meridian_health_vendor_portfolio.invoice_line_amount", "invoice_line_amount", 0.01],
    ],
  },
  {
    name: "contract_families",
    cubeMeasures: [
      "meridian_health_contract_families.count",
      "meridian_health_contract_families.total_contract_value",
      "meridian_health_contract_families.sla_term_count",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(synthetic_midpoint_total_contract_value)::numeric AS total_contract_value, sum(sla_term_count)::numeric AS sla_term_count FROM ${CANARY_SCHEMA}.meridian_health_contract_family_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_contract_families.count", "count", 0],
      ["meridian_health_contract_families.total_contract_value", "total_contract_value", 0.01],
      ["meridian_health_contract_families.sla_term_count", "sla_term_count", 0.01],
    ],
  },
  {
    name: "contract_scope",
    cubeMeasures: [
      "meridian_health_contract_scope.count",
      "meridian_health_contract_scope.average_relationship_confidence",
    ],
    sourceSql: `SELECT count(*)::int AS count, avg(relationship_confidence)::numeric AS average_relationship_confidence FROM ${CANARY_SCHEMA}.meridian_health_contract_scope_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_contract_scope.count", "count", 0],
      ["meridian_health_contract_scope.average_relationship_confidence", "average_relationship_confidence", 0.0001],
    ],
  },
  {
    name: "spend_invoice_history",
    cubeMeasures: [
      "meridian_health_spend_invoice_history.invoice_lines",
      "meridian_health_spend_invoice_history.line_amount",
      "meridian_health_spend_invoice_history.rate_card_matched_lines",
    ],
    sourceSql: `SELECT sum(invoice_line_count)::numeric AS invoice_lines, sum(line_amount)::numeric AS line_amount, sum(rate_card_matched_lines)::numeric AS rate_card_matched_lines FROM ${CANARY_SCHEMA}.meridian_health_spend_invoice_history_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_spend_invoice_history.invoice_lines", "invoice_lines", 0.01],
      ["meridian_health_spend_invoice_history.line_amount", "line_amount", 0.01],
      ["meridian_health_spend_invoice_history.rate_card_matched_lines", "rate_card_matched_lines", 0.01],
    ],
  },
  {
    name: "service_performance",
    cubeMeasures: [
      "meridian_health_sla_itsm_performance.count",
      "meridian_health_sla_itsm_performance.tickets_opened",
      "meridian_health_sla_itsm_performance.sla_breach_count",
      "meridian_health_sla_itsm_performance.service_credit_eligible_amount",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(tickets_opened)::numeric AS tickets_opened, sum(sla_breach_count)::numeric AS sla_breach_count, sum(service_credit_eligible_amount)::numeric AS service_credit_eligible_amount FROM ${CANARY_SCHEMA}.meridian_health_sla_itsm_performance_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_sla_itsm_performance.count", "count", 0],
      ["meridian_health_sla_itsm_performance.tickets_opened", "tickets_opened", 0.01],
      ["meridian_health_sla_itsm_performance.sla_breach_count", "sla_breach_count", 0.01],
      ["meridian_health_sla_itsm_performance.service_credit_eligible_amount", "service_credit_eligible_amount", 0.01],
    ],
  },
  {
    name: "service_credits",
    cubeMeasures: [
      "meridian_health_service_credits.count",
      "meridian_health_service_credits.eligible_amount",
      "meridian_health_service_credits.claimed_amount",
      "meridian_health_service_credits.unclaimed_amount",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(eligible_amount)::numeric AS eligible_amount, sum(claimed_amount)::numeric AS claimed_amount, sum(coalesce(eligible_amount,0)-coalesce(claimed_amount,0))::numeric AS unclaimed_amount FROM ${CANARY_SCHEMA}.meridian_health_service_credit_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_service_credits.count", "count", 0],
      ["meridian_health_service_credits.eligible_amount", "eligible_amount", 0.01],
      ["meridian_health_service_credits.claimed_amount", "claimed_amount", 0.01],
      ["meridian_health_service_credits.unclaimed_amount", "unclaimed_amount", 0.01],
    ],
  },
  {
    name: "application_dependencies",
    cubeMeasures: [
      "meridian_health_application_dependencies.count",
      "meridian_health_application_dependencies.epic_interface_count",
      "meridian_health_application_dependencies.analytics_dependency_count",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(epic_interface_count)::numeric AS epic_interface_count, sum(analytics_dependency_count)::numeric AS analytics_dependency_count FROM ${CANARY_SCHEMA}.meridian_health_application_dependency_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_application_dependencies.count", "count", 0],
      ["meridian_health_application_dependencies.epic_interface_count", "epic_interface_count", 0.01],
      ["meridian_health_application_dependencies.analytics_dependency_count", "analytics_dependency_count", 0.01],
    ],
  },
  {
    name: "program_dependencies",
    cubeMeasures: [
      "meridian_health_program_dependencies.count",
      "meridian_health_program_dependencies.source_dependency_rows",
      "meridian_health_program_dependencies.canonical_initiative_concept_count",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(source_dependency_rows)::numeric AS source_dependency_rows, sum(canonical_initiative_concept_count)::numeric AS canonical_initiative_concept_count FROM ${CANARY_SCHEMA}.meridian_health_program_dependency_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_program_dependencies.count", "count", 0],
      ["meridian_health_program_dependencies.source_dependency_rows", "source_dependency_rows", 0.01],
      ["meridian_health_program_dependencies.canonical_initiative_concept_count", "canonical_initiative_concept_count", 0.01],
    ],
  },
  {
    name: "bpo_baseline",
    cubeMeasures: [
      "meridian_health_bpo_baseline.count",
      "meridian_health_bpo_baseline.monthly_volume",
      "meridian_health_bpo_baseline.baseline_cost",
      "meridian_health_bpo_baseline.five_year_current_state_baseline_cost",
      "meridian_health_bpo_baseline.annualized_current_state_cost",
      "meridian_health_bpo_baseline.current_resource_count",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(monthly_volume)::numeric AS monthly_volume, sum(coalesce(baseline_labor_cost,0)+coalesce(baseline_technology_cost,0)+coalesce(baseline_controls_cost,0))::numeric AS baseline_cost, sum(five_year_current_state_baseline_cost)::numeric AS five_year_current_state_baseline_cost, sum(annualized_current_state_cost)::numeric AS annualized_current_state_cost, sum(current_resource_count)::numeric AS current_resource_count FROM ${CANARY_SCHEMA}.meridian_health_bpo_baseline_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_bpo_baseline.count", "count", 0],
      ["meridian_health_bpo_baseline.monthly_volume", "monthly_volume", 0.01],
      ["meridian_health_bpo_baseline.baseline_cost", "baseline_cost", 0.01],
      ["meridian_health_bpo_baseline.five_year_current_state_baseline_cost", "five_year_current_state_baseline_cost", 0.01],
      ["meridian_health_bpo_baseline.annualized_current_state_cost", "annualized_current_state_cost", 0.01],
      ["meridian_health_bpo_baseline.current_resource_count", "current_resource_count", 0.01],
    ],
  },
  {
    name: "supplier_proposals_bafo",
    cubeMeasures: [
      "meridian_health_supplier_proposals_bafo.count",
      "meridian_health_supplier_proposals_bafo.five_year_service_fee",
      "meridian_health_supplier_proposals_bafo.transition_cost",
      "meridian_health_supplier_proposals_bafo.risk_adjustment",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(five_year_service_fee)::numeric AS five_year_service_fee, sum(transition_cost)::numeric AS transition_cost, sum(risk_adjustment)::numeric AS risk_adjustment FROM ${CANARY_SCHEMA}.meridian_health_supplier_proposal_bafo_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_supplier_proposals_bafo.count", "count", 0],
      ["meridian_health_supplier_proposals_bafo.five_year_service_fee", "five_year_service_fee", 0.01],
      ["meridian_health_supplier_proposals_bafo.transition_cost", "transition_cost", 0.01],
      ["meridian_health_supplier_proposals_bafo.risk_adjustment", "risk_adjustment", 0.01],
    ],
  },
  {
    name: "ai_automation_commitments",
    cubeMeasures: [
      "meridian_health_ai_automation_commitments.count",
      "meridian_health_ai_automation_commitments.current_manual_volume",
      "meridian_health_ai_automation_commitments.contracted_benefit_amount",
      "meridian_health_ai_automation_commitments.contractual_commitments",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(current_manual_volume)::numeric AS current_manual_volume, sum(contracted_benefit_amount)::numeric AS contracted_benefit_amount, sum(CASE WHEN automation_basis='contractual' THEN 1 ELSE 0 END)::numeric AS contractual_commitments FROM ${CANARY_SCHEMA}.meridian_health_ai_automation_commitment_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_ai_automation_commitments.count", "count", 0],
      ["meridian_health_ai_automation_commitments.current_manual_volume", "current_manual_volume", 0.01],
      ["meridian_health_ai_automation_commitments.contracted_benefit_amount", "contracted_benefit_amount", 0.01],
      ["meridian_health_ai_automation_commitments.contractual_commitments", "contractual_commitments", 0.01],
    ],
  },
  {
    name: "retained_org_scenarios",
    cubeMeasures: [
      "meridian_health_retained_org_scenarios.count",
      "meridian_health_retained_org_scenarios.transition_fte",
      "meridian_health_retained_org_scenarios.steady_state_fte",
      "meridian_health_retained_org_scenarios.annual_cost",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(transition_fte)::numeric AS transition_fte, sum(steady_state_fte)::numeric AS steady_state_fte, sum(annual_cost)::numeric AS annual_cost FROM ${CANARY_SCHEMA}.meridian_health_retained_org_scenario_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_retained_org_scenarios.count", "count", 0],
      ["meridian_health_retained_org_scenarios.transition_fte", "transition_fte", 0.01],
      ["meridian_health_retained_org_scenarios.steady_state_fte", "steady_state_fte", 0.01],
      ["meridian_health_retained_org_scenarios.annual_cost", "annual_cost", 0.01],
    ],
  },
  {
    name: "normalized_tco",
    cubeMeasures: [
      "meridian_health_normalized_tco_inputs.count",
      "meridian_health_normalized_tco_inputs.headline_price",
      "meridian_health_normalized_tco_inputs.normalized_tco",
      "meridian_health_normalized_tco_inputs.risk_adjustment",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(headline_price)::numeric AS headline_price, sum(normalized_five_year_tco)::numeric AS normalized_five_year_tco, sum(risk_adjustment)::numeric AS risk_adjustment FROM ${CANARY_SCHEMA}.meridian_health_normalized_tco_recommendation_input_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_normalized_tco_inputs.count", "count", 0],
      ["meridian_health_normalized_tco_inputs.headline_price", "headline_price", 0.01],
      ["meridian_health_normalized_tco_inputs.normalized_tco", "normalized_five_year_tco", 0.01],
      ["meridian_health_normalized_tco_inputs.risk_adjustment", "risk_adjustment", 0.01],
    ],
  },
  {
    name: "event_context_snapshot",
    cubeMeasures: [
      "meridian_health_event_context_snapshot.count",
      "meridian_health_event_context_snapshot.selected_sources",
      "meridian_health_event_context_snapshot.selected_entities",
      "meridian_health_event_context_snapshot.selected_relationships",
    ],
    sourceSql: `SELECT count(*)::int AS count, sum(selected_source_record_count)::numeric AS selected_source_record_count, sum(selected_canonical_entity_count)::numeric AS selected_canonical_entity_count, sum(selected_canonical_relationship_count)::numeric AS selected_canonical_relationship_count FROM ${CANARY_SCHEMA}.meridian_health_event_context_snapshot_v1 WHERE tenant_key=$1`,
    pairs: [
      ["meridian_health_event_context_snapshot.count", "count", 0],
      ["meridian_health_event_context_snapshot.selected_sources", "selected_source_record_count", 0.01],
      ["meridian_health_event_context_snapshot.selected_entities", "selected_canonical_entity_count", 0.01],
      ["meridian_health_event_context_snapshot.selected_relationships", "selected_canonical_relationship_count", 0.01],
    ],
  },
];

const skyharborFamilies = [
  {
    name: "skyharbor_contracts",
    cubeMeasures: [
      "source_v4_contracts.count",
      "source_v4_contracts.annual_value",
      "source_v4_contracts.total_committed_value",
    ],
    sourceSql: "SELECT count(*)::int AS count, sum(annual_value)::numeric AS annual_value, sum(total_committed_value)::numeric AS total_committed_value FROM consumption_v4_canary.sourcing_contract_v1 WHERE tenant_key=$1",
    expected: {
      "source_v4_contracts.count": 100,
      "source_v4_contracts.annual_value": 1480500000,
    },
    pairs: [
      ["source_v4_contracts.count", "count", 0],
      ["source_v4_contracts.annual_value", "annual_value", 0.01],
      ["source_v4_contracts.total_committed_value", "total_committed_value", 0.01],
    ],
  },
  {
    name: "skyharbor_vendors",
    cubeMeasures: [
      "source_v4_vendors.count",
      "source_v4_vendors.contract_count",
      "source_v4_vendors.annual_value",
    ],
    sourceSql: "SELECT count(*)::int AS count, sum(contract_count)::numeric AS contract_count, sum(annual_value)::numeric AS annual_value FROM consumption_v4_canary.sourcing_vendor_v1 WHERE tenant_key=$1",
    expected: {
      "source_v4_vendors.count": 60,
      "source_v4_vendors.contract_count": 100,
      "source_v4_vendors.annual_value": 1480500000,
    },
    pairs: [
      ["source_v4_vendors.count", "count", 0],
      ["source_v4_vendors.contract_count", "contract_count", 0.01],
      ["source_v4_vendors.annual_value", "annual_value", 0.01],
    ],
  },
  {
    name: "skyharbor_scope",
    cubeMeasures: [
      "source_v4_contract_scope.count",
      "source_v4_contract_scope.explicit_scope_count",
      "source_v4_contract_scope.inferred_scope_count",
    ],
    sourceSql: "SELECT count(*)::int AS count, sum(CASE WHEN relationship_method='explicit_contract_scope' THEN 1 ELSE 0 END)::numeric AS explicit_scope_count, sum(CASE WHEN relationship_method<>'explicit_contract_scope' THEN 1 ELSE 0 END)::numeric AS inferred_scope_count FROM consumption_v4_canary.sourcing_contract_scope_v1 WHERE tenant_key=$1",
    expected: {
      "source_v4_contract_scope.count": 5200,
      "source_v4_contract_scope.explicit_scope_count": 2600,
      "source_v4_contract_scope.inferred_scope_count": 2600,
    },
    pairs: [
      ["source_v4_contract_scope.count", "count", 0],
      ["source_v4_contract_scope.explicit_scope_count", "explicit_scope_count", 0.01],
      ["source_v4_contract_scope.inferred_scope_count", "inferred_scope_count", 0.01],
    ],
  },
];

await main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "MERIDIAN_HEALTH_DEMO_CUBE_CANARY_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

function parseArgs(argv) {
  const parsed = { mode: "all", outDir: process.env.MERIDIAN_HEALTH_CUBE_CANARY_VERIFY_OUT_DIR || null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--url") parsed.url = next();
    else if (arg.startsWith("--url=")) parsed.url = arg.slice("--url=".length);
    else if (arg === "--secret") parsed.secret = next();
    else if (arg.startsWith("--secret=")) parsed.secret = arg.slice("--secret=".length);
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

async function main() {
  const modelProof = validateModel();
  if (args.mode === "model") return emit(modelProof);
  if (!apiSecret) throw new Error("Missing CUBEJS_API_SECRET");
  if (!databaseUrl) throw new Error("Missing DATABASE_URL or SOURCE_CUBE_DATABASE_URL");
  const runtimeProof = await verifyRuntimeAndReconciliation();
  const result = {
    ok: modelProof.ok && runtimeProof.ok,
    status: modelProof.ok && runtimeProof.ok
      ? "MERIDIAN_HEALTH_DEMO_CUBE_CANARY_VERIFIED"
      : "MERIDIAN_HEALTH_DEMO_CUBE_CANARY_BLOCKED",
    generated_at: new Date().toISOString(),
    meridian_health_tenant_key: MERIDIAN_HEALTH_DEMO_TENANT,
    skyharbor_tenant_key: SKYHARBOR_TENANT,
    cube_url: baseUrl,
    traffic_shift_executed: false,
    model: modelProof,
    runtime: runtimeProof,
    failures: [...modelProof.failures, ...runtimeProof.failures],
  };
  emit(result);
  if (!result.ok) process.exitCode = 1;
}

function validateModel() {
  const model = yaml.load(fs.readFileSync(MODEL_PATH, "utf8"));
  const rewrite = fs.readFileSync(REWRITE_PATH, "utf8");
  const cubes = model.cubes || [];
  const failures = [];
  const cubeNames = new Set(cubes.map((cube) => cube.name));
  const expectedCubes = new Set([
    "meridian_health_vendor_portfolio",
    "meridian_health_contract_families",
    "meridian_health_contract_scope",
    "meridian_health_spend_invoice_history",
    "meridian_health_workforce_rate_card_economics",
    "meridian_health_sla_itsm_performance",
    "meridian_health_service_credits",
    "meridian_health_application_dependencies",
    "meridian_health_renewal_exit_terms",
    "meridian_health_program_dependencies",
    "meridian_health_enterprise_outcomes",
    "meridian_health_bpo_baseline",
    "meridian_health_supplier_proposals_bafo",
    "meridian_health_rebadge_transition_commitments",
    "meridian_health_ai_automation_commitments",
    "meridian_health_retained_org_scenarios",
    "meridian_health_normalized_tco_inputs",
    "meridian_health_event_context_snapshot",
  ]);
  for (const cube of expectedCubes) {
    if (!cubeNames.has(cube)) failures.push(`missing_cube:${cube}`);
    if (!rewrite.includes(`"${cube}"`)) failures.push(`cube_not_tenant_rewritten:${cube}`);
  }
  for (const cube of cubes) {
    if (!cube.dimensions?.some((dimension) => dimension.name === "tenant_key" && dimension.public === false)) {
      failures.push(`tenant_key_private_dimension_missing:${cube.name}`);
    }
    if (!cube.dimensions?.some((dimension) => dimension.primary_key === true)) {
      failures.push(`primary_key_missing:${cube.name}`);
    }
    if (!cube.hierarchies?.length) failures.push(`hierarchy_missing:${cube.name}`);
    for (const measure of cube.measures || []) {
      if (!Array.isArray(measure.drill_members) || measure.drill_members.length === 0) {
        failures.push(`drill_members_missing:${cube.name}.${measure.name}`);
      }
    }
  }
  return {
    ok: failures.length === 0,
    status: failures.length === 0 ? "MERIDIAN_HEALTH_CUBE_CANARY_MODEL_VERIFIED" : "MERIDIAN_HEALTH_CUBE_CANARY_MODEL_BLOCKED",
    cube_count: cubes.length,
    expected_cube_count: expectedCubes.size,
    hierarchy_count: cubes.reduce((count, cube) => count + (cube.hierarchies || []).length, 0),
    measure_count: cubes.reduce((count, cube) => count + (cube.measures || []).length, 0),
    failures,
  };
}

async function verifyRuntimeAndReconciliation() {
  const now = Math.floor(Date.now() / 1000);
  const meridianToken = signJwt({ tenant_key: MERIDIAN_HEALTH_DEMO_TENANT, iat: now, exp: now + 600 });
  const skyToken = signJwt({ tenant_key: SKYHARBOR_TENANT, iat: now, exp: now + 600 });
  const missingTenantToken = signJwt({ iat: now, exp: now + 600 });
  const client = new Client(clientOptions());
  await client.connect();
  try {
    const [readyz, livez, missingTenant] = await Promise.all([
      request("/readyz"),
      request("/livez"),
      load({ measures: ["meridian_health_vendor_portfolio.count"] }, missingTenantToken),
    ]);
    const meridianFamiliesResult = {};
    const skyFamiliesResult = {};
    const failures = [];
    if (!readyz.ok) failures.push(`readyz_status:${readyz.status}`);
    if (!livez.ok) failures.push(`livez_status:${livez.status}`);
    if (missingTenant.status !== 403) failures.push(`missing_tenant_expected_403_got_${missingTenant.status}`);

    for (const family of meridianFamilies) {
      meridianFamiliesResult[family.name] = await reconcileFamily(client, family, MERIDIAN_HEALTH_DEMO_TENANT, meridianToken, failures);
    }
    for (const family of skyharborFamilies) {
      skyFamiliesResult[family.name] = await reconcileFamily(client, family, SKYHARBOR_TENANT, skyToken, failures);
      for (const [measure, expected] of Object.entries(family.expected || {})) {
        const actual = number(skyFamiliesResult[family.name].cube?.[measure]);
        if (Math.abs(actual - expected) > 0.01) failures.push(`skyharbor_regression:${measure}:${actual}:${expected}`);
      }
    }

    const isolation = await verifyIsolation(meridianToken, skyToken, failures);
    const drillMembers = await verifyDrillMembers(meridianToken, failures);
    const tableCounts = await readCanaryTableCounts(client);
    return {
      ok: failures.length === 0,
      status: failures.length === 0 ? "MERIDIAN_HEALTH_CUBE_CANARY_RUNTIME_RECONCILED" : "MERIDIAN_HEALTH_CUBE_CANARY_RUNTIME_BLOCKED",
      health: {
        readyz: readyz.status,
        livez: livez.status,
      },
      security: {
        missing_tenant_status: missingTenant.status,
        tenant_isolation: isolation,
      },
      table_counts: tableCounts,
      meridian_health_reconciliation: meridianFamiliesResult,
      skyharbor_regression_reconciliation: skyFamiliesResult,
      drill_members: drillMembers,
      failures,
    };
  } finally {
    await client.end();
  }
}

async function reconcileFamily(client, family, tenantKey, token, failures) {
  const cubeResponse = await load({ measures: family.cubeMeasures }, token);
  const sourceResult = await client.query(family.sourceSql, [tenantKey]);
  const cubeRow = cubeResponse.json?.data?.[0] || {};
  const sourceRow = sourceResult.rows[0] || {};
  const familyFailures = [];
  if (!cubeResponse.ok) familyFailures.push(`cube_query_failed:${cubeResponse.status}:${cubeResponse.json?.error || cubeResponse.json?.message || "unknown"}`);
  if (cubeResponse.ok) {
    for (const [cubeKey, sourceKey, tolerance] of family.pairs) {
      compareNumber(familyFailures, cubeKey, cubeRow, sourceRow, sourceKey, tolerance);
    }
  }
  failures.push(...familyFailures.map((failure) => `${family.name}:${failure}`));
  return {
    ok: familyFailures.length === 0,
    cube_status: cubeResponse.status,
    cube: cubeRow,
    source: sourceRow,
    failures: familyFailures,
  };
}

async function verifyIsolation(meridianToken, skyToken, failures) {
  const skyReadsMeridian = await load({ measures: ["meridian_health_vendor_portfolio.count"] }, skyToken);
  const meridianReadsSky = await load({ measures: ["source_v4_contracts.count"] }, meridianToken);
  const skyReadsMeridianCount = number(skyReadsMeridian.json?.data?.[0]?.["meridian_health_vendor_portfolio.count"]);
  const meridianReadsSkyCount = number(meridianReadsSky.json?.data?.[0]?.["source_v4_contracts.count"]);
  if (!skyReadsMeridian.ok || skyReadsMeridianCount !== 0) failures.push(`skyharbor_token_meridian_health_count:${skyReadsMeridian.status}:${skyReadsMeridianCount}`);
  if (!meridianReadsSky.ok || meridianReadsSkyCount !== 0) failures.push(`meridian_health_token_skyharbor_count:${meridianReadsSky.status}:${meridianReadsSkyCount}`);
  return {
    skyharbor_token_meridian_health_count: skyReadsMeridianCount,
    meridian_health_token_skyharbor_count: meridianReadsSkyCount,
    skyharbor_token_meridian_health_status: skyReadsMeridian.status,
    meridian_health_token_skyharbor_status: meridianReadsSky.status,
  };
}

async function verifyDrillMembers(token, failures) {
  const query = {
    measures: ["meridian_health_normalized_tco_inputs.normalized_tco"],
    dimensions: [
      "meridian_health_normalized_tco_inputs.recommendation_state",
      "meridian_health_normalized_tco_inputs.scenario",
      "meridian_health_normalized_tco_inputs.supplier_id",
    ],
    limit: 10,
  };
  const response = await load(query, token);
  const rows = response.json?.data || [];
  if (!response.ok) failures.push(`drill_query_failed:${response.status}:${response.json?.error || response.json?.message || "unknown"}`);
  if (response.ok && rows.length === 0) failures.push("drill_query_returned_no_rows");
  return {
    status: response.status,
    row_count: rows.length,
    sample: rows.slice(0, 3),
  };
}

async function readCanaryTableCounts(client) {
  const result = await client.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1
      AND table_name LIKE 'meridian_health_%_v1'
    ORDER BY table_name
    `,
    [CANARY_SCHEMA],
  );
  const counts = {};
  for (const { table_name: tableName } of result.rows) {
    const rows = await client.query(`SELECT count(*)::int AS rows FROM ${sqlIdent(CANARY_SCHEMA)}.${sqlIdent(tableName)} WHERE tenant_key=$1`, [MERIDIAN_HEALTH_DEMO_TENANT]);
    counts[tableName] = rows.rows[0].rows;
  }
  return counts;
}

function clientOptions() {
  return {
    connectionString: databaseUrl,
    application_name: "meridian-health-demo-cube-canary-verify",
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
  };
}

async function request(apiPath, options = {}) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "content-type": "application/json",
    },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: response.ok, status: response.status, json };
}

function load(query, token) {
  return request("/cubejs-api/v1/load", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ query }),
  });
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const body = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", apiSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function base64Url(input) {
  return Buffer.from(input).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function compareNumber(failures, cubeKey, cubeRow, sourceRow, sourceKey, tolerance) {
  const cubeValue = number(cubeRow[cubeKey]);
  const sourceValue = number(sourceRow[sourceKey]);
  if (Number.isNaN(cubeValue) || Number.isNaN(sourceValue) || Math.abs(cubeValue - sourceValue) > tolerance) {
    failures.push(`${cubeKey}=${cubeRow[cubeKey]} source.${sourceKey}=${sourceRow[sourceKey]}`);
  }
}

function number(value) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function sqlIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
  return `"${value}"`;
}

function emit(result) {
  if (args.outDir) {
    fs.mkdirSync(path.join(args.outDir, "proof"), { recursive: true });
    fs.writeFileSync(path.join(args.outDir, "proof", "MERIDIAN_HEALTH_CUBE_CANARY_VERIFY.json"), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(
      path.join(args.outDir, "proof", "MERIDIAN_HEALTH_CUBE_CANARY_VERIFY_SIGNATURE.json"),
      `${JSON.stringify({ status: result.status, sha256: crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex") }, null, 2)}\n`,
    );
    if (args.emitProofBundle) {
      const marker = {
        status: "MERIDIAN_HEALTH_DEMO_CUBE_CANARY_VERIFY_PROOF_BUNDLE",
        generated_at: new Date().toISOString(),
        proof_root: path.join(args.outDir, "proof"),
      };
      console.log(`__ACA_PROOF_BUNDLE__${JSON.stringify(marker)}__ACA_PROOF_BUNDLE__`);
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

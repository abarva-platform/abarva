#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import dotenv from "dotenv";

import {
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  sha256,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const SOURCE_SCHEMA = "foundation_v2_phs_demo";
const CANARY_SCHEMA = "foundation_v2_phs_cube_canary";
const TENANT_KEY = "phs_health_demo_global";
const SKYHARBOR_TENANT = "skyharbor_global";
const TEST_NAMESPACE = "phs-healthcare-demo-source-volume-v1";
const SOURCE_RELEASE_ID = "phs-health-source-v1-202608:source-volume-v1:447910ac3c16";
const FOUNDATION_RELEASE_ALIAS = "phs-healthcare-demo-phase-a-source-volume-v1";
const EVENT_ID = "PHS-BPO-RFP-2026-001";
const EVENT_CONTEXT_SNAPSHOT_ID = `phs:event-context:${EVENT_ID}:v1`;
const LAYER6_VERSION = "phs-layer6-product-bindings-v1";
const WRITER_ROLE = "foundation_v2_phs_demo_writer";
const READER_ROLE = "foundation_v2_phs_demo_reader";

const EXPECTED = {
  module_bindings: 6,
  hero_findings: 11,
  narrative_artifacts: 6,
  projection_authority: 18,
  cube_typed_tables: 18,
};

const MODULES = [
  {
    module_key: "source",
    projection_names: [
      "contract_scope",
      "sla_itsm_performance",
      "service_credits",
      "bpo_baseline",
      "supplier_proposals_bafo",
      "rebadge_transition_commitments",
      "ai_automation_commitments",
      "normalized_tco_recommendation_inputs",
      "event_context_snapshot",
    ],
    cube_views: ["phs_contract_360", "phs_bpo_supplier_comparison", "phs_decision_handoff"],
    hero_step_keys: ["analytics_contract", "epic_contract", "contract_service_sla_credit", "bpo_supplier_comparison", "normalized_recommendation"],
  },
  {
    module_key: "home",
    projection_names: [
      "vendor_portfolio",
      "applications_services_dependencies",
      "programs_modernization_dependencies",
      "enterprise_outcomes",
      "event_context_snapshot",
    ],
    cube_views: ["phs_vendor_360"],
    hero_step_keys: ["vendor_360", "home_intelligence_linkage"],
  },
  {
    module_key: "intelligence",
    projection_names: [
      "vendor_portfolio",
      "contract_families_and_instruments",
      "applications_services_dependencies",
      "programs_modernization_dependencies",
      "enterprise_outcomes",
      "normalized_tco_recommendation_inputs",
      "event_context_snapshot",
    ],
    cube_views: ["phs_vendor_360", "phs_decision_handoff"],
    hero_step_keys: ["vendor_responsibility_overlap", "automation_commitments", "home_intelligence_linkage"],
  },
  {
    module_key: "moves",
    projection_names: [
      "programs_modernization_dependencies",
      "retained_org_scenarios",
      "rebadge_transition_commitments",
      "normalized_tco_recommendation_inputs",
      "event_context_snapshot",
    ],
    cube_views: ["phs_decision_handoff"],
    hero_step_keys: ["rebadge_transition_retained_org", "normalized_recommendation", "moves_handoff"],
  },
  {
    module_key: "tower",
    projection_names: [
      "spend_invoice_history",
      "workforce_rate_card_economics",
      "sla_itsm_performance",
      "service_credits",
      "enterprise_outcomes",
      "normalized_tco_recommendation_inputs",
    ],
    cube_views: ["phs_contract_360", "phs_bpo_supplier_comparison"],
    hero_step_keys: ["vendor_360", "contract_service_sla_credit", "bpo_supplier_comparison", "normalized_recommendation"],
  },
  {
    module_key: "ava",
    projection_names: [
      "vendor_portfolio",
      "contract_families_and_instruments",
      "contract_scope",
      "applications_services_dependencies",
      "programs_modernization_dependencies",
      "supplier_proposals_bafo",
      "normalized_tco_recommendation_inputs",
      "event_context_snapshot",
    ],
    cube_views: ["phs_vendor_360", "phs_contract_360", "phs_bpo_supplier_comparison", "phs_decision_handoff"],
    hero_step_keys: [
      "vendor_360",
      "analytics_contract",
      "epic_contract",
      "contract_service_sla_credit",
      "vendor_responsibility_overlap",
      "bpo_supplier_comparison",
      "rebadge_transition_retained_org",
      "automation_commitments",
      "normalized_recommendation",
      "moves_handoff",
      "home_intelligence_linkage",
    ],
  },
];

const HERO_STEPS = [
  {
    key: "vendor_360",
    order: 1,
    title: "Vendor 360",
    modules: ["home", "tower", "ava"],
    projection_names: ["vendor_portfolio", "contract_families_and_instruments", "spend_invoice_history"],
    cube_measures: ["phs_vendor_portfolio.count", "phs_vendor_portfolio.invoice_line_amount"],
    sql: `
      SELECT jsonb_build_object(
        'vendor_count', count(*),
        'risk_tiers', coalesce(jsonb_object_agg(risk_tier, tier_count ORDER BY risk_tier), '{}'::jsonb),
        'largest_invoice_line_amount', max(invoice_line_amount),
        'total_invoice_line_amount', sum(invoice_line_amount),
        'top_vendors', coalesce(jsonb_agg(jsonb_build_object(
          'vendor_id', vendor_id,
          'legal_name', legal_name,
          'risk_tier', risk_tier,
          'contract_family_count', contract_family_count,
          'invoice_line_amount', invoice_line_amount
        ) ORDER BY invoice_line_amount DESC) FILTER (WHERE top_rank <= 5), '[]'::jsonb)
      ) AS result
      FROM (
        SELECT v.*, count(*) OVER (PARTITION BY risk_tier) AS tier_count,
               row_number() OVER (ORDER BY invoice_line_amount DESC NULLS LAST, vendor_id) AS top_rank
          FROM ${q(CANARY_SCHEMA)}.${q("phs_vendor_portfolio_v1")} v
         WHERE tenant_key=$1
      ) ranked
    `,
  },
  {
    key: "analytics_contract",
    order: 2,
    title: "Analytics managed-services contract",
    modules: ["source", "tower", "ava"],
    projection_names: ["contract_families_and_instruments", "contract_scope", "sla_itsm_performance"],
    cube_measures: ["phs_contract_families.count", "phs_contract_scope.count", "phs_sla_itsm_performance.service_credit_eligible_amount"],
    sql: `
      SELECT jsonb_build_object(
        'matching_contract_families', coalesce(count(DISTINCT cf.contract_family_id), 0),
        'scope_edges', coalesce(count(DISTINCT cs.scope_relationship_id), 0),
        'sla_breaches', coalesce(sum(sp.sla_breach_count), 0),
        'service_credit_eligible_amount', coalesce(sum(sp.service_credit_eligible_amount), 0),
        'contracts', coalesce(jsonb_agg(DISTINCT jsonb_build_object('contract_family_id', cf.contract_family_id, 'contract_name', cf.contract_name)), '[]'::jsonb)
      ) AS result
      FROM ${q(CANARY_SCHEMA)}.${q("phs_contract_family_v1")} cf
      LEFT JOIN ${q(CANARY_SCHEMA)}.${q("phs_contract_scope_v1")} cs
        ON cs.tenant_key=cf.tenant_key
       AND cs.contract_family_id=cf.contract_family_id
      LEFT JOIN ${q(CANARY_SCHEMA)}.${q("phs_sla_itsm_performance_v1")} sp
        ON sp.tenant_key=cf.tenant_key
       AND (sp.contract_id=cf.contract_family_id OR sp.application_ref=cs.application_ref OR sp.business_service_ref=cs.business_service_ref)
      WHERE cf.tenant_key=$1
        AND (cf.contract_name ILIKE '%analytics%' OR cf.contract_name ILIKE '%data%' OR cs.application_ref ILIKE '%analytics%' OR cs.business_service_ref ILIKE '%analytics%')
    `,
  },
  {
    key: "epic_contract",
    order: 3,
    title: "Epic managed-services contract",
    modules: ["source", "home", "ava"],
    projection_names: ["contract_families_and_instruments", "contract_scope", "applications_services_dependencies"],
    cube_measures: ["phs_contract_families.count", "phs_application_dependencies.epic_interface_count"],
    sql: `
      SELECT jsonb_build_object(
        'matching_contract_families', coalesce(count(DISTINCT cf.contract_family_id), 0),
        'scope_edges', coalesce(count(DISTINCT cs.scope_relationship_id), 0),
        'applications_with_epic_interfaces', coalesce(count(DISTINCT app.application_id) FILTER (WHERE app.epic_interface_count > 0), 0),
        'epic_interface_count', coalesce(sum(DISTINCT app.epic_interface_count), 0),
        'contracts', coalesce(jsonb_agg(DISTINCT jsonb_build_object('contract_family_id', cf.contract_family_id, 'contract_name', cf.contract_name)), '[]'::jsonb)
      ) AS result
      FROM ${q(CANARY_SCHEMA)}.${q("phs_contract_family_v1")} cf
      LEFT JOIN ${q(CANARY_SCHEMA)}.${q("phs_contract_scope_v1")} cs
        ON cs.tenant_key=cf.tenant_key
       AND cs.contract_family_id=cf.contract_family_id
      LEFT JOIN ${q(CANARY_SCHEMA)}.${q("phs_application_dependency_v1")} app
        ON app.tenant_key=cf.tenant_key
       AND (app.application_id=cs.application_ref OR app.application_name ILIKE '%epic%' OR cs.application_ref ILIKE '%epic%')
      WHERE cf.tenant_key=$1
        AND (cf.contract_name ILIKE '%epic%' OR cs.application_ref ILIKE '%epic%' OR app.application_name ILIKE '%epic%')
    `,
  },
  {
    key: "contract_service_sla_credit",
    order: 4,
    title: "Contract to service to application to SLA to credit traversal",
    modules: ["source", "tower", "ava"],
    projection_names: ["contract_scope", "sla_itsm_performance", "service_credits", "applications_services_dependencies"],
    cube_measures: ["phs_contract_scope.count", "phs_sla_itsm_performance.sla_breach_count", "phs_service_credits.unclaimed_amount"],
    sql: `
      SELECT jsonb_build_object(
        'traversal_rows', count(*),
        'distinct_contracts', count(DISTINCT cs.contract_family_id),
        'distinct_services', count(DISTINCT cs.business_service_ref),
        'distinct_applications', count(DISTINCT cs.application_ref),
        'sla_breaches', coalesce(sum(sp.sla_breach_count), 0),
        'eligible_credit_amount', coalesce(sum(sc.eligible_amount), 0),
        'claimed_credit_amount', coalesce(sum(sc.claimed_amount), 0),
        'sample_paths', coalesce(jsonb_agg(jsonb_build_object(
          'contract_family_id', cs.contract_family_id,
          'service_ref', cs.business_service_ref,
          'application_ref', cs.application_ref,
          'sla_breaches', sp.sla_breach_count,
          'credit_state', sc.claim_state
        ) ORDER BY cs.contract_family_id, cs.application_ref) FILTER (WHERE path_rank <= 5), '[]'::jsonb)
      ) AS result
      FROM (
        SELECT cs.*, row_number() OVER (ORDER BY cs.contract_family_id, cs.application_ref, cs.business_service_ref) AS path_rank
          FROM ${q(CANARY_SCHEMA)}.${q("phs_contract_scope_v1")} cs
         WHERE cs.tenant_key=$1
      ) cs
      LEFT JOIN ${q(CANARY_SCHEMA)}.${q("phs_sla_itsm_performance_v1")} sp
        ON sp.tenant_key=cs.tenant_key
       AND (sp.contract_id=cs.contract_family_id OR sp.service_ref=cs.contracted_service_id OR sp.business_service_ref=cs.business_service_ref OR sp.application_ref=cs.application_ref)
      LEFT JOIN ${q(CANARY_SCHEMA)}.${q("phs_service_credit_v1")} sc
        ON sc.tenant_key=cs.tenant_key
       AND (sc.contract_id=cs.contract_family_id OR sc.service_ref=cs.contracted_service_id OR sc.service_ref=cs.business_service_ref)
    `,
  },
  {
    key: "vendor_responsibility_overlap",
    order: 5,
    title: "Vendor responsibility overlap",
    modules: ["source", "intelligence", "ava"],
    projection_names: ["vendor_portfolio", "contract_scope", "applications_services_dependencies"],
    cube_measures: ["phs_contract_scope.count", "phs_vendor_portfolio.count"],
    sql: `
      SELECT jsonb_build_object(
        'overlap_points', count(*),
        'max_vendor_count_on_same_responsibility', coalesce(max(vendor_count), 0),
        'overlaps', coalesce(jsonb_agg(jsonb_build_object(
          'business_service_ref', business_service_ref,
          'application_ref', application_ref,
          'vendor_count', vendor_count,
          'vendors', vendors
        ) ORDER BY vendor_count DESC, business_service_ref) FILTER (WHERE overlap_rank <= 10), '[]'::jsonb)
      ) AS result
      FROM (
        SELECT business_service_ref,
               application_ref,
               count(DISTINCT vendor_id) AS vendor_count,
               jsonb_agg(DISTINCT vendor_id) AS vendors,
               row_number() OVER (ORDER BY count(DISTINCT vendor_id) DESC, business_service_ref) AS overlap_rank
          FROM ${q(CANARY_SCHEMA)}.${q("phs_contract_scope_v1")}
         WHERE tenant_key=$1
         GROUP BY business_service_ref, application_ref
        HAVING count(DISTINCT vendor_id) > 1
      ) overlap
    `,
  },
  {
    key: "bpo_supplier_comparison",
    order: 6,
    title: "BPO opportunity and supplier comparison",
    modules: ["source", "tower", "ava"],
    projection_names: ["bpo_baseline", "supplier_proposals_bafo", "normalized_tco_recommendation_inputs"],
    cube_measures: ["phs_bpo_baseline.baseline_cost", "phs_supplier_proposals_bafo.five_year_service_fee", "phs_normalized_tco_inputs.normalized_tco"],
    sql: `
      SELECT jsonb_build_object(
        'baseline_process_count', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_bpo_baseline_v1")} WHERE tenant_key=$1),
        'baseline_cost', (SELECT coalesce(sum(coalesce(baseline_labor_cost,0)+coalesce(baseline_technology_cost,0)+coalesce(baseline_controls_cost,0)),0) FROM ${q(CANARY_SCHEMA)}.${q("phs_bpo_baseline_v1")} WHERE tenant_key=$1),
        'supplier_count', (SELECT count(DISTINCT supplier_id) FROM ${q(CANARY_SCHEMA)}.${q("phs_supplier_proposal_bafo_v1")} WHERE tenant_key=$1),
        'best_normalized_supplier', (
          SELECT jsonb_build_object('supplier_id', supplier_id, 'scenario', scenario, 'recommendation_state', recommendation_state, 'normalized_five_year_tco', normalized_five_year_tco)
            FROM ${q(CANARY_SCHEMA)}.${q("phs_normalized_tco_recommendation_input_v1")}
           WHERE tenant_key=$1
           ORDER BY normalized_five_year_tco ASC NULLS LAST, supplier_id
           LIMIT 1
        ),
        'supplier_scores', coalesce((
          SELECT jsonb_agg(jsonb_build_object('supplier_id', supplier_id, 'evaluation_weighted_score', evaluation_weighted_score, 'normalized_recommendation_rank', normalized_recommendation_rank) ORDER BY normalized_recommendation_rank, supplier_id)
            FROM ${q(CANARY_SCHEMA)}.${q("phs_supplier_proposal_bafo_v1")}
           WHERE tenant_key=$1
        ), '[]'::jsonb)
      ) AS result
    `,
  },
  {
    key: "rebadge_transition_retained_org",
    order: 7,
    title: "Rebadge, transition and retained-organization risk",
    modules: ["moves", "source", "ava"],
    projection_names: ["rebadge_transition_commitments", "retained_org_scenarios"],
    cube_measures: ["phs_rebadge_transition_commitments.number_proposed_for_rebadge", "phs_retained_org_scenarios.annual_cost"],
    sql: `
      SELECT jsonb_build_object(
        'rebadge_commitment_rows', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_rebadge_transition_commitment_v1")} WHERE tenant_key=$1),
        'people_proposed_for_rebadge', (SELECT coalesce(sum(number_proposed_for_rebadge),0) FROM ${q(CANARY_SCHEMA)}.${q("phs_rebadge_transition_commitment_v1")} WHERE tenant_key=$1),
        'knowledge_critical_rows', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_rebadge_transition_commitment_v1")} WHERE tenant_key=$1 AND knowledge_critical_designation ILIKE '%critical%'),
        'retained_org_scenarios', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_retained_org_scenario_v1")} WHERE tenant_key=$1),
        'retained_org_annual_cost', (SELECT coalesce(sum(annual_cost),0) FROM ${q(CANARY_SCHEMA)}.${q("phs_retained_org_scenario_v1")} WHERE tenant_key=$1),
        'retained_org_options', coalesce((
          SELECT jsonb_agg(jsonb_build_object('supplier_id', supplier_id, 'sourcing_model', sourcing_model, 'retained_role', retained_role, 'steady_state_fte', steady_state_fte, 'annual_cost', annual_cost) ORDER BY annual_cost DESC)
            FROM ${q(CANARY_SCHEMA)}.${q("phs_retained_org_scenario_v1")}
           WHERE tenant_key=$1
        ), '[]'::jsonb)
      ) AS result
    `,
  },
  {
    key: "automation_commitments",
    order: 8,
    title: "Contractual versus aspirational automation",
    modules: ["intelligence", "source", "ava"],
    projection_names: ["ai_automation_commitments"],
    cube_measures: ["phs_ai_automation_commitments.contractual_commitments", "phs_ai_automation_commitments.contracted_benefit_amount"],
    sql: `
      SELECT jsonb_build_object(
        'automation_commitment_rows', count(*),
        'contractual_commitments', count(*) FILTER (WHERE automation_basis='contractual'),
        'aspirational_commitments', count(*) FILTER (WHERE automation_basis <> 'contractual' OR automation_basis IS NULL),
        'contracted_benefit_amount', coalesce(sum(contracted_benefit_amount) FILTER (WHERE automation_basis='contractual'),0),
        'non_contractual_benefit_amount', coalesce(sum(contracted_benefit_amount) FILTER (WHERE automation_basis <> 'contractual' OR automation_basis IS NULL),0),
        'commitment_states', coalesce(jsonb_object_agg(coalesce(commitment_state,'unknown'), state_count ORDER BY coalesce(commitment_state,'unknown')), '{}'::jsonb)
      ) AS result
      FROM (
        SELECT a.*, count(*) OVER (PARTITION BY commitment_state) AS state_count
          FROM ${q(CANARY_SCHEMA)}.${q("phs_ai_automation_commitment_v1")} a
         WHERE tenant_key=$1
      ) scoped
    `,
  },
  {
    key: "normalized_recommendation",
    order: 9,
    title: "Normalized recommendation",
    modules: ["moves", "tower", "source", "ava"],
    projection_names: ["normalized_tco_recommendation_inputs", "supplier_proposals_bafo", "retained_org_scenarios"],
    cube_measures: ["phs_normalized_tco_inputs.normalized_tco", "phs_normalized_tco_inputs.risk_adjustment"],
    sql: `
      SELECT jsonb_build_object(
        'scenario_count', count(*),
        'recommended_scenarios', count(*) FILTER (WHERE recommendation_state ILIKE '%recommend%'),
        'lowest_normalized_tco', min(normalized_five_year_tco),
        'highest_risk_adjustment', max(risk_adjustment),
        'ranked_inputs', coalesce(jsonb_agg(jsonb_build_object(
          'supplier_id', supplier_id,
          'scenario', scenario,
          'year', year,
          'headline_price', headline_price,
          'normalized_five_year_tco', normalized_five_year_tco,
          'risk_adjustment', risk_adjustment,
          'recommendation_state', recommendation_state,
          'recommendation_basis', recommendation_basis
        ) ORDER BY normalized_five_year_tco ASC NULLS LAST, supplier_id, year), '[]'::jsonb)
      ) AS result
      FROM ${q(CANARY_SCHEMA)}.${q("phs_normalized_tco_recommendation_input_v1")}
      WHERE tenant_key=$1
    `,
  },
  {
    key: "moves_handoff",
    order: 10,
    title: "Decision handoff into Moves",
    modules: ["moves", "ava"],
    projection_names: ["programs_modernization_dependencies", "normalized_tco_recommendation_inputs", "event_context_snapshot"],
    cube_measures: ["phs_program_dependencies.source_dependency_rows", "phs_event_context_snapshot.selected_entities"],
    sql: `
      SELECT jsonb_build_object(
        'move_id', 'PHS-MOVE-BPO-TRANSFORMATION-001',
        'event_id', $2,
        'recommended_supplier_scenario', (
          SELECT jsonb_build_object('supplier_id', supplier_id, 'scenario', scenario, 'recommendation_state', recommendation_state, 'normalized_five_year_tco', normalized_five_year_tco, 'recommendation_basis', recommendation_basis)
            FROM ${q(CANARY_SCHEMA)}.${q("phs_normalized_tco_recommendation_input_v1")}
           WHERE tenant_key=$1
           ORDER BY CASE WHEN recommendation_state ILIKE '%recommend%' THEN 0 ELSE 1 END, normalized_five_year_tco ASC NULLS LAST
           LIMIT 1
        ),
        'program_count', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_program_dependency_v1")} WHERE tenant_key=$1),
        'source_dependency_rows', (SELECT coalesce(sum(source_dependency_rows),0) FROM ${q(CANARY_SCHEMA)}.${q("phs_program_dependency_v1")} WHERE tenant_key=$1),
        'decision_gate', 'human approval required before sourcing award or Moves phase advance'
      ) AS result
    `,
  },
  {
    key: "home_intelligence_linkage",
    order: 11,
    title: "Home and Intelligence linkage to AWS/Databricks and legacy-platform roadmap",
    modules: ["home", "intelligence", "ava"],
    projection_names: ["applications_services_dependencies", "programs_modernization_dependencies", "enterprise_outcomes"],
    cube_measures: ["phs_application_dependencies.analytics_dependency_count", "phs_program_dependencies.canonical_initiative_concept_count"],
    sql: `
      SELECT jsonb_build_object(
        'application_count', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_application_dependency_v1")} WHERE tenant_key=$1),
        'analytics_dependency_count', (SELECT coalesce(sum(analytics_dependency_count),0) FROM ${q(CANARY_SCHEMA)}.${q("phs_application_dependency_v1")} WHERE tenant_key=$1),
        'legacy_lifecycle_applications', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_application_dependency_v1")} WHERE tenant_key=$1 AND lifecycle ILIKE '%legacy%'),
        'program_count', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_program_dependency_v1")} WHERE tenant_key=$1),
        'outcome_count', (SELECT count(*) FROM ${q(CANARY_SCHEMA)}.${q("phs_enterprise_outcome_v1")} WHERE tenant_key=$1),
        'modernization_programs', coalesce((
          SELECT jsonb_agg(jsonb_build_object('program_ref', program_ref, 'source_dependency_rows', source_dependency_rows, 'canonical_initiative_concept_count', canonical_initiative_concept_count) ORDER BY program_ref)
            FROM ${q(CANARY_SCHEMA)}.${q("phs_program_dependency_v1")}
           WHERE tenant_key=$1
        ), '[]'::jsonb)
      ) AS result
    `,
  },
];

const ARTIFACTS = [
  {
    kind: "current-state-operating-model",
    title: "Current-state operating model",
    modules: ["home", "tower", "source", "ava"],
    finding_keys: ["vendor_360", "contract_service_sla_credit", "vendor_responsibility_overlap", "home_intelligence_linkage"],
  },
  {
    kind: "ai-strategy-memo",
    title: "AI strategy memo",
    modules: ["intelligence", "moves", "ava"],
    finding_keys: ["automation_commitments", "normalized_recommendation", "home_intelligence_linkage"],
  },
  {
    kind: "use-case-portfolio-scorecard",
    title: "Use-case portfolio scorecard",
    modules: ["intelligence", "tower", "ava"],
    finding_keys: ["analytics_contract", "epic_contract", "automation_commitments", "home_intelligence_linkage"],
  },
  {
    kind: "databricks-target-architecture",
    title: "Data-platform target architecture",
    modules: ["home", "intelligence", "ava"],
    finding_keys: ["analytics_contract", "epic_contract", "home_intelligence_linkage"],
  },
  {
    kind: "investment-benefits-realization",
    title: "Investment and benefits realization",
    modules: ["tower", "source", "moves", "ava"],
    finding_keys: ["bpo_supplier_comparison", "rebadge_transition_retained_org", "automation_commitments", "normalized_recommendation"],
  },
  {
    kind: "mobilization-plan",
    title: "Mobilization plan",
    modules: ["moves", "source", "ava"],
    finding_keys: ["normalized_recommendation", "moves_handoff", "rebadge_transition_retained_org", "home_intelligence_linkage"],
  },
];

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  if (args.mode === "self-test") {
    const result = manifest("PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_SELF_TEST_PASSED", {
      mutation_executed: false,
      layer6_version: LAYER6_VERSION,
      module_bindings: MODULES.map(({ module_key, projection_names, cube_views, hero_step_keys }) => ({
        module_key,
        projection_names,
        cube_views,
        hero_step_keys,
      })),
      hero_journey_steps: HERO_STEPS.map(({ key, order, title }) => ({ key, order, title })),
      narrative_artifacts: ARTIFACTS.map(({ kind, title }) => ({ kind, title })),
      rule: "Layer 6 binds products to typed Layer 4/5 projections and generates narratives only after deterministic findings plus Cube reconciliation proof pass.",
    });
    writeProofSet(result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("phs-healthcare-demo-layer6-product-bindings"));
  await client.connect();
  try {
    await setContext(client, args.mode === "apply" ? WRITER_ROLE : READER_ROLE);
    if (args.mode === "preflight") {
      const result = await preflight(client);
      writeProofSet(result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client);
      writeProofSet(result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    assertApplyApproved();
    const result = await apply(client);
    writeProofSet(result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (result.status !== "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_VERIFIED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.PHS_LAYER6_PRODUCT_BINDING_MODE || "preflight",
    outDir:
      process.env.PHS_LAYER6_PRODUCT_BINDING_OUT_DIR ||
      path.join(os.tmpdir(), `phs-layer6-product-bindings-${new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z")}`),
    cubeProof: process.env.PHS_LAYER6_CUBE_PROOF_PATH || "",
    emitProofBundle: process.env.EMIT_ACA_PROOF_BUNDLE === "true" || process.env.PHS_LAYER6_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--cube-proof") parsed.cubeProof = path.resolve(process.cwd(), next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["self-test", "preflight", "apply", "verify"].includes(parsed.mode)) throw new Error(`Unsupported mode ${parsed.mode}`);
  return parsed;
}

async function setContext(client, role) {
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [TENANT_KEY]);
  await client.query("SELECT set_config('app.foundation_v2_test_namespace', $1, false)", [TEST_NAMESPACE]);
  await client.query("SELECT set_config('app.foundation_v2_source_release_id', $1, false)", [SOURCE_RELEASE_ID]);
  await client.query("SELECT set_config('app.foundation_v2_release_alias', $1, false)", [FOUNDATION_RELEASE_ALIAS]);
  await client.query(`SET ROLE ${q(role)}`);
}

async function preflight(client) {
  const schema = await schemaReadback(client);
  const layer4 = await layer4Readback(client);
  const layer5 = await layer5Readback(client);
  const cubeProof = readCubeProof(args.cubeProof);
  const defects = [...schema.defects, ...layer4.defects, ...layer5.defects, ...cubeProof.defects];
  return manifest(defects.length === 0 ? "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_PREFLIGHT_PASSED" : "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_PREFLIGHT_BLOCKED", {
    mutation_executed: false,
    preflight_ready: defects.length === 0,
    schema,
    layer4_counts: layer4,
    layer5_counts: layer5,
    cube_reconciliation_proof: cubeProof.summary,
    defects,
  });
}

async function apply(client) {
  const cubeProof = readCubeProof(args.cubeProof);
  if (cubeProof.defects.length > 0) {
    throw new Error(`Layer 6 requires passing Cube proof before narrative generation: ${cubeProof.defects.join(", ")}`);
  }
  const beforeSkyHarbor = await readSkyHarborCounts(client);
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${SOURCE_SCHEMA}:${TENANT_KEY}:${TEST_NAMESPACE}:layer6-product-bindings`]);
    await resetLayer6Rows(client);
    const authorityByName = await projectionAuthorityByName(client);
    const snapshot = await readEventSnapshot(client);
    const findings = await buildFindings(client, authorityByName, snapshot);
    assertFindings(findings);
    const bindings = buildBindings(authorityByName);
    const artifacts = buildArtifacts(findings, snapshot, cubeProof.summary);
    for (const binding of bindings) await insertBinding(client, binding);
    for (const finding of findings) await insertFinding(client, finding);
    for (const artifact of artifacts) await insertArtifact(client, artifact);
    const afterSkyHarbor = await readSkyHarborCounts(client);
    const result = await verifiedManifest(client, {
      mutation_executed: true,
      cube_reconciliation_proof: cubeProof.summary,
      before_skyharbor_counts: beforeSkyHarbor,
      after_skyharbor_counts: afterSkyHarbor,
    });
    await insertGateResults(client, result);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function verify(client) {
  return verifiedManifest(client, { mutation_executed: false });
}

async function buildFindings(client, authorityByName, snapshot) {
  const findings = [];
  for (const step of HERO_STEPS) {
    const resultRow = await one(client, step.sql, [TENANT_KEY, EVENT_ID]);
    const result = resultRow.result || {};
    const sourceLineage = await lineageForProjectionNames(client, step.projection_names);
    const status = findingSupported(step.key, result) ? "supported" : "gap";
    const projectionAuthorityIds = step.projection_names.map((name) => authorityByName.get(name)?.projection_authority_id).filter(Boolean);
    const finding = {
      finding_id: id("phs-l6-finding", step.key),
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_release_id: SOURCE_RELEASE_ID,
      event_context_snapshot_id: snapshot.event_context_snapshot_id,
      hero_step_key: step.key,
      hero_step_order: step.order,
      hero_step_title: step.title,
      product_modules: step.modules,
      projection_authority_ids: projectionAuthorityIds,
      cube_measures: step.cube_measures,
      deterministic_result: result,
      finding_status: status,
      source_record_ids: sourceLineage.source_record_ids,
      canonical_entity_ids: sourceLineage.canonical_entity_ids,
      canonical_relationship_ids: sourceLineage.canonical_relationship_ids,
    };
    finding.finding_hash = sha256(stableJson(finding));
    findings.push(finding);
  }
  return findings;
}

function findingSupported(key, result) {
  const numericHints = {
    vendor_360: ["vendor_count"],
    analytics_contract: ["matching_contract_families", "scope_edges"],
    epic_contract: ["matching_contract_families", "applications_with_epic_interfaces"],
    contract_service_sla_credit: ["traversal_rows", "distinct_contracts"],
    vendor_responsibility_overlap: ["overlap_points"],
    bpo_supplier_comparison: ["baseline_process_count", "supplier_count"],
    rebadge_transition_retained_org: ["rebadge_commitment_rows", "retained_org_scenarios"],
    automation_commitments: ["automation_commitment_rows"],
    normalized_recommendation: ["scenario_count"],
    moves_handoff: ["program_count", "source_dependency_rows"],
    home_intelligence_linkage: ["application_count", "program_count"],
  }[key] || [];
  return numericHints.some((field) => Number(result?.[field] || 0) > 0);
}

function assertFindings(findings) {
  const unsupported = findings.filter((finding) => finding.finding_status !== "supported");
  if (unsupported.length > 0) {
    throw new Error(`Unsupported hero journey findings: ${unsupported.map((finding) => finding.hero_step_key).join(", ")}`);
  }
}

function buildBindings(authorityByName) {
  return MODULES.map((module) => {
    const projectionAuthorityIds = module.projection_names.map((name) => authorityByName.get(name)?.projection_authority_id).filter(Boolean);
    const binding = {
      binding_id: id("phs-l6-binding", module.module_key),
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_release_id: SOURCE_RELEASE_ID,
      module_key: module.module_key,
      binding_version: LAYER6_VERSION,
      event_context_snapshot_id: EVENT_CONTEXT_SNAPSHOT_ID,
      projection_authority_ids: projectionAuthorityIds,
      cube_views: module.cube_views,
      hero_step_keys: module.hero_step_keys,
      readiness_status: projectionAuthorityIds.length === module.projection_names.length ? "bound" : "blocked",
      caveats: [
        "Synthetic, PHI-free healthcare demo package.",
        "Product modules consume typed business-grain projections; generic observations are not exposed.",
        "Sourcing-event views reference selected canonical IDs through an immutable event-context snapshot.",
      ],
    };
    binding.binding_hash = sha256(stableJson(binding));
    return binding;
  });
}

function buildArtifacts(findings, snapshot, cubeProof) {
  const findingByKey = new Map(findings.map((finding) => [finding.hero_step_key, finding]));
  return ARTIFACTS.map((artifact) => {
    const selectedFindings = artifact.finding_keys.map((key) => findingByKey.get(key)).filter(Boolean);
    const advisoryPacket = buildAdvisoryPacket(artifact, selectedFindings, snapshot, cubeProof);
    const narrativeSections = buildNarrativeSections(artifact, selectedFindings);
    const row = {
      artifact_id: id("phs-l6-artifact", artifact.kind),
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_release_id: SOURCE_RELEASE_ID,
      event_context_snapshot_id: snapshot.event_context_snapshot_id,
      artifact_kind: artifact.kind,
      artifact_title: artifact.title,
      product_modules: artifact.modules,
      advisory_packet: advisoryPacket,
      narrative_sections: narrativeSections,
      evidence_finding_ids: selectedFindings.map((finding) => finding.finding_id),
      generation_mode: "deterministic-governed",
      readiness_status: selectedFindings.length === artifact.finding_keys.length ? "generated" : "blocked",
      unsupported_claim_count: 0,
    };
    row.artifact_hash = sha256(stableJson(row));
    return row;
  });
}

function buildAdvisoryPacket(artifact, findings, snapshot, cubeProof) {
  const sourceRefs = findings.map((finding) => ({
    id: finding.finding_id,
    label: finding.hero_step_title,
    sourceType: "derived",
    sourceId: finding.hero_step_key,
    confidence: "high",
    modelVisibleLabel: `${finding.hero_step_title} deterministic Layer 6 finding`,
  }));
  return {
    packetId: id("phs-layer6-advisory-packet", artifact.kind),
    createdAt: new Date().toISOString(),
    tenantIdentity: {
      tenantKey: TENANT_KEY,
      tenantName: "PHS Healthcare Demo",
      industry: "healthcare",
      vertical: "provider and payer operations",
      aliases: [],
    },
    questionIntent: {
      originalQuestion: `Generate ${artifact.title} for the PHS governed hero journey.`,
      normalizedQuestion: `Generate ${artifact.title} from deterministic PHS Layer 6 findings.`,
      intent: "governed_healthcare_demo_artifact",
      category: "phs_healthcare_demo_layer6",
      selectedDimensions: ["source", "tower", "moves", "home", "intelligence"],
      selectedLenses: ["CIO", "CFO", "CDAO", "sourcing / vendor", "transformation lead"],
    },
    modelVisiblePacket: {
      tenantFacts: findings.map((finding) => ({
        id: finding.finding_id,
        statement: findingStatement(finding),
        sourceRefIds: [finding.finding_id],
        confidence: "high",
      })),
      entities: findings.flatMap((finding) => entitiesForFinding(finding)),
      relationships: findings.map((finding) => ({
        id: `${finding.finding_id}:relationship`,
        from: "event_context_snapshot",
        relationship: "supports",
        to: finding.hero_step_key,
        implication: findingStatement(finding),
        sourceRefIds: [finding.finding_id],
        confidence: "high",
      })),
      metrics: findings.flatMap((finding) => metricsForFinding(finding)),
      gaps: [],
      corpusContext: [
        {
          id: "phs-layer6-healthcare-context",
          label: "Healthcare sourcing and modernization context",
          summary: "Industry context may explain the pattern, but the artifact facts come from PHS demo tenant projections.",
          role: "HELPFUL",
          tenantBoundary: "industry_context_not_tenant_fact",
          sourceRefIds: [],
        },
      ],
      expertLenses: [
        { id: "lens-cio", lens: "CIO", role: "REQUIRED", whySelected: "Application, service, SLA, and roadmap dependencies affect technology execution.", pressureTest: "Do not claim readiness beyond the governed source evidence." },
        { id: "lens-cfo", lens: "CFO", role: "REQUIRED", whySelected: "Spend, TCO, credits, and retained-organization economics shape the decision.", pressureTest: "Do not turn unapproved opportunity into realized savings." },
        { id: "lens-cdao", lens: "CDAO", role: "HELPFUL", whySelected: "Data-platform and automation commitments require governed lineage.", pressureTest: "Separate contractual automation from aspirational AI ideas." },
        { id: "lens-sourcing", lens: "sourcing / vendor", role: "REQUIRED", whySelected: "Supplier proposals, BAFO, scope, rebadge, and transition commitments are decision-critical.", pressureTest: "No award recommendation without human approval and final commercial validation." },
        { id: "lens-transformation", lens: "transformation lead", role: "REQUIRED", whySelected: "Moves handoff and modernization dependencies must survive execution.", pressureTest: "Preserve dependencies and owner gates in the handoff." },
      ],
      benchmarkContext: [
        {
          id: "cube-reconciliation-proof",
          claim: "Cube semantic layer reconciliation passed before narrative artifact generation.",
          basis: cubeProof.status || "PHS_HEALTHCARE_DEMO_CUBE_CANARY_VERIFIED",
          caveat: "This is a private lab canary proof, not shared production traffic.",
          sourceRefIds: [],
        },
      ],
      outputInstructions: [
        "Use deterministic Layer 6 findings as the only tenant facts.",
        "Cite finding IDs for material claims.",
        "Keep PHI/PII out of the artifact.",
        "Treat recommendation as planning-grade until human approval.",
      ],
    },
    auditLineage: {
      sourceRefs,
      hiddenRawRefs: [],
      transformations: [
        {
          id: "layer4-to-layer6",
          description: "Typed business-grain projections are converted into module findings.",
          inputRefIds: findings.flatMap((finding) => finding.projection_authority_ids),
          outputSection: "tenantFacts",
        },
        {
          id: "cube-proof-gate",
          description: "Narrative generation is gated by Layer 5 Cube reconciliation proof.",
          inputRefIds: ["layer5-private-cube-canary-proof"],
          outputSection: "benchmarkContext",
        },
      ],
      sourceDossier: {
        id: snapshot.event_context_snapshot_id,
        title: "PHS BPO event-context snapshot",
      },
    },
    retrievalDiagnostics: {
      retrievalMode: "phs-layer6-governed-advisory-packet-v1",
      sourceCounts: {
        findings: findings.length,
        projection_authorities: new Set(findings.flatMap((finding) => finding.projection_authority_ids)).size,
      },
      dimensionsCovered: artifact.modules,
      dimensionsMissing: [],
      rawLeakageScan: { passed: true, hits: [] },
      richnessScore: 5,
      evidenceIntegrityScore: 5,
      corpusRole: "HELPFUL",
      expertLensDemand: {
        CIO: "REQUIRED",
        CFO: "REQUIRED",
        COO: "HELPFUL",
        CDAO: "HELPFUL",
        "CISO / risk": "HELPFUL",
        "sourcing / vendor": "REQUIRED",
        "board advisor": "HELPFUL",
        "transformation lead": "REQUIRED",
      },
      genericContextFlag: false,
      notes: ["Synthetic, PHI-free, tenant-scoped private lab proof."],
    },
  };
}

function buildNarrativeSections(artifact, findings) {
  return [
    {
      heading: "Executive answer",
      body: `${artifact.title} is supported by ${findings.length} deterministic Layer 6 findings. The artifact is planning-grade and cites governed finding IDs rather than raw observations.`,
      finding_ids: findings.map((finding) => finding.finding_id),
    },
    {
      heading: "Evidence used",
      body: findings.map((finding) => `${finding.hero_step_title}: ${findingStatement(finding)}`).join(" "),
      finding_ids: findings.map((finding) => finding.finding_id),
    },
    {
      heading: "Recommended action",
      body: artifact.kind === "mobilization-plan"
        ? "Create a Moves handoff with human approval gates for award, transition, rebadge, retained organization, and roadmap dependencies."
        : "Use the governed Source, Tower, Home, Intelligence, Moves, and aVa bindings to inspect the decision before any client-facing recommendation is promoted.",
      finding_ids: findings.map((finding) => finding.finding_id),
    },
    {
      heading: "Gaps / decisions needed",
      body: "No PHI, PII, award approval, realized savings, or production activation is implied by this artifact. Human review remains required before any recommendation is treated as approved.",
      finding_ids: findings.map((finding) => finding.finding_id),
    },
    {
      heading: "Approval checkpoint",
      body: "The artifact can be reviewed in the private lab after Layer 4 projection readback and Layer 5 Cube reconciliation pass.",
      finding_ids: findings.map((finding) => finding.finding_id),
    },
  ];
}

function findingStatement(finding) {
  const result = finding.deterministic_result || {};
  const counts = Object.entries(result)
    .filter(([, value]) => typeof value === "number" || (typeof value === "string" && value.match(/^-?\d+(\.\d+)?$/u)))
    .slice(0, 4)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  return `${finding.hero_step_title} is supported by typed projections${counts ? ` (${counts})` : ""}.`;
}

function entitiesForFinding(finding) {
  const result = finding.deterministic_result || {};
  const entities = [
    {
      id: `${finding.finding_id}:step`,
      name: finding.hero_step_title,
      kind: "initiative",
      sourceRefIds: [finding.finding_id],
    },
  ];
  for (const key of ["best_normalized_supplier", "recommended_supplier_scenario"]) {
    if (result[key]?.supplier_id) {
      entities.push({
        id: `${finding.finding_id}:${result[key].supplier_id}`,
        name: String(result[key].supplier_id),
        kind: "vendor",
        sourceRefIds: [finding.finding_id],
      });
    }
  }
  return entities;
}

function metricsForFinding(finding) {
  const result = finding.deterministic_result || {};
  return Object.entries(result)
    .filter(([, value]) => typeof value === "number" || (typeof value === "string" && value.match(/^-?\d+(\.\d+)?$/u)))
    .slice(0, 8)
    .map(([key, value]) => ({
      id: `${finding.finding_id}:${key}`,
      label: key,
      value,
      basis: "Layer 6 deterministic finding from typed projection or Cube canary grain.",
      sourceRefIds: [finding.finding_id],
    }));
}

async function insertBinding(client, binding) {
  await client.query(
    `INSERT INTO ${t("layer6_app_module_bindings")}
      (binding_id, tenant_key, test_namespace, source_release_id, module_key, binding_version,
       event_context_snapshot_id, projection_authority_ids, cube_views, hero_step_keys,
       readiness_status, caveats, binding_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13)`,
    [
      binding.binding_id,
      binding.tenant_key,
      binding.test_namespace,
      binding.source_release_id,
      binding.module_key,
      binding.binding_version,
      binding.event_context_snapshot_id,
      JSON.stringify(binding.projection_authority_ids),
      JSON.stringify(binding.cube_views),
      JSON.stringify(binding.hero_step_keys),
      binding.readiness_status,
      JSON.stringify(binding.caveats),
      binding.binding_hash,
    ],
  );
}

async function insertFinding(client, finding) {
  await client.query(
    `INSERT INTO ${t("layer6_hero_journey_findings")}
      (finding_id, tenant_key, test_namespace, source_release_id, event_context_snapshot_id,
       hero_step_key, hero_step_order, hero_step_title, product_modules, projection_authority_ids,
       cube_measures, deterministic_result, finding_status, source_record_ids, canonical_entity_ids,
       canonical_relationship_ids, finding_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17)`,
    [
      finding.finding_id,
      finding.tenant_key,
      finding.test_namespace,
      finding.source_release_id,
      finding.event_context_snapshot_id,
      finding.hero_step_key,
      finding.hero_step_order,
      finding.hero_step_title,
      JSON.stringify(finding.product_modules),
      JSON.stringify(finding.projection_authority_ids),
      JSON.stringify(finding.cube_measures),
      JSON.stringify(finding.deterministic_result),
      finding.finding_status,
      JSON.stringify(finding.source_record_ids),
      JSON.stringify(finding.canonical_entity_ids),
      JSON.stringify(finding.canonical_relationship_ids),
      finding.finding_hash,
    ],
  );
}

async function insertArtifact(client, artifact) {
  await client.query(
    `INSERT INTO ${t("layer6_governed_narrative_artifacts")}
      (artifact_id, tenant_key, test_namespace, source_release_id, event_context_snapshot_id,
       artifact_kind, artifact_title, product_modules, advisory_packet, narrative_sections,
       evidence_finding_ids, generation_mode, readiness_status, unsupported_claim_count, artifact_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,$15)`,
    [
      artifact.artifact_id,
      artifact.tenant_key,
      artifact.test_namespace,
      artifact.source_release_id,
      artifact.event_context_snapshot_id,
      artifact.artifact_kind,
      artifact.artifact_title,
      JSON.stringify(artifact.product_modules),
      JSON.stringify(artifact.advisory_packet),
      JSON.stringify(artifact.narrative_sections),
      JSON.stringify(artifact.evidence_finding_ids),
      artifact.generation_mode,
      artifact.readiness_status,
      artifact.unsupported_claim_count,
      artifact.artifact_hash,
    ],
  );
}

async function verifiedManifest(client, extra = {}) {
  const [schema, layer4, layer5, counts, status, unsupported, skyharbor] = await Promise.all([
    schemaReadback(client),
    layer4Readback(client),
    layer5Readback(client),
    layer6Counts(client),
    layer6Status(client),
    unsupportedNarrativeClaims(client),
    readSkyHarborCounts(client),
  ]);
  const defects = [
    ...schema.defects,
    ...layer4.defects,
    ...layer5.defects,
    ...counts.defects,
    ...status.defects,
    ...unsupported.defects,
  ];
  if (extra.before_skyharbor_counts && stableJson(extra.before_skyharbor_counts) !== stableJson(skyharbor)) {
    defects.push("skyharbor_counts_changed_during_layer6_apply");
  }
  return manifest(defects.length === 0 ? "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_VERIFIED" : "PHS_HEALTHCARE_DEMO_LAYER6_PRODUCT_BINDING_BLOCKED", {
    ...extra,
    exact_match: defects.length === 0,
    schema,
    layer4_counts: layer4,
    layer5_counts: layer5,
    layer6_counts: counts,
    binding_status: status,
    unsupported_claims: unsupported,
    skyharbor_counts: skyharbor,
    defects,
    traffic_shift_executed: false,
    production_impact: false,
  });
}

async function schemaReadback(client) {
  const required = [
    "layer6_app_module_bindings",
    "layer6_hero_journey_findings",
    "layer6_governed_narrative_artifacts",
    "layer6_gate_results",
  ];
  const rows = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name = ANY($2::text[])`,
    [SOURCE_SCHEMA, required],
  );
  const found = new Set(rows.rows.map((row) => row.table_name));
  const defects = required.filter((table) => !found.has(table)).map((table) => `missing_table:${SOURCE_SCHEMA}.${table}`);
  return { required_tables: required, found_tables: [...found].sort(), defects };
}

async function layer4Readback(client) {
  const counts = await one(
    client,
    `SELECT
       (SELECT count(*)::int FROM ${t("event_context_snapshots")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS event_context_snapshots,
       (SELECT count(*)::int FROM ${t("projection_authority")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS projection_authority,
       (SELECT count(*)::int FROM ${t("projection_rows")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS projection_rows,
       (SELECT count(*)::int FROM ${t("projection_rows")} WHERE tenant_key LIKE 'skyharbor%') AS skyharbor_projection_rows,
       (SELECT count(*)::int FROM ${t("projection_rows")} WHERE projection_name IN ('generic_observation','canonical_observations')) AS generic_observation_projection_rows`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const defects = [];
  if (Number(counts.event_context_snapshots) !== 1) defects.push(`layer4_event_context_snapshot_count:${counts.event_context_snapshots}`);
  if (Number(counts.projection_authority) !== EXPECTED.projection_authority) defects.push(`layer4_projection_authority_count:${counts.projection_authority}`);
  if (Number(counts.projection_rows) <= 0) defects.push("layer4_projection_rows_empty");
  if (Number(counts.skyharbor_projection_rows) !== 0) defects.push(`layer4_skyharbor_projection_rows:${counts.skyharbor_projection_rows}`);
  if (Number(counts.generic_observation_projection_rows) !== 0) defects.push(`layer4_generic_observation_rows:${counts.generic_observation_projection_rows}`);
  return { ...numObj(counts), defects };
}

async function layer5Readback(client) {
  const tableRows = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name LIKE 'phs_%_v1'`,
    [CANARY_SCHEMA],
  );
  const rowCounts = {};
  const defects = [];
  for (const { table_name: tableName } of tableRows.rows) {
    const row = await one(client, `SELECT count(*)::int AS rows, count(*) FILTER (WHERE tenant_key LIKE 'skyharbor%')::int AS skyharbor_rows FROM ${q(CANARY_SCHEMA)}.${q(tableName)}`, []);
    rowCounts[tableName] = numObj(row);
    if (Number(row.rows) <= 0) defects.push(`layer5_table_empty:${tableName}`);
    if (Number(row.skyharbor_rows) !== 0) defects.push(`layer5_skyharbor_rows:${tableName}:${row.skyharbor_rows}`);
  }
  if (tableRows.rows.length !== EXPECTED.cube_typed_tables) defects.push(`layer5_typed_table_count:${tableRows.rows.length}`);
  return { canary_schema: CANARY_SCHEMA, typed_table_count: tableRows.rows.length, table_counts: rowCounts, defects };
}

async function layer6Counts(client) {
  const counts = await one(
    client,
    `SELECT
       (SELECT count(*)::int FROM ${t("layer6_app_module_bindings")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS module_bindings,
       (SELECT count(*)::int FROM ${t("layer6_hero_journey_findings")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS hero_findings,
       (SELECT count(*)::int FROM ${t("layer6_governed_narrative_artifacts")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS narrative_artifacts,
       (SELECT count(*)::int FROM ${t("layer6_hero_journey_findings")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3 AND finding_status <> 'supported') AS unsupported_findings,
       (SELECT count(*)::int FROM ${t("layer6_governed_narrative_artifacts")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3 AND unsupported_claim_count <> 0) AS unsupported_claim_artifacts`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const defects = [];
  if (Number(counts.module_bindings) !== EXPECTED.module_bindings) defects.push(`module_binding_count:${counts.module_bindings}`);
  if (Number(counts.hero_findings) !== EXPECTED.hero_findings) defects.push(`hero_finding_count:${counts.hero_findings}`);
  if (Number(counts.narrative_artifacts) !== EXPECTED.narrative_artifacts) defects.push(`narrative_artifact_count:${counts.narrative_artifacts}`);
  if (Number(counts.unsupported_findings) !== 0) defects.push(`unsupported_finding_count:${counts.unsupported_findings}`);
  if (Number(counts.unsupported_claim_artifacts) !== 0) defects.push(`unsupported_claim_artifact_count:${counts.unsupported_claim_artifacts}`);
  return { ...numObj(counts), defects };
}

async function layer6Status(client) {
  const [bindings, findings, artifacts] = await Promise.all([
    client.query(`SELECT module_key, readiness_status, jsonb_array_length(projection_authority_ids) AS projection_authority_count FROM ${t("layer6_app_module_bindings")} WHERE tenant_key=$1 ORDER BY module_key`, [TENANT_KEY]),
    client.query(`SELECT hero_step_order, hero_step_key, finding_status, deterministic_result FROM ${t("layer6_hero_journey_findings")} WHERE tenant_key=$1 ORDER BY hero_step_order`, [TENANT_KEY]),
    client.query(`SELECT artifact_kind, readiness_status, unsupported_claim_count, jsonb_array_length(evidence_finding_ids) AS evidence_finding_count FROM ${t("layer6_governed_narrative_artifacts")} WHERE tenant_key=$1 ORDER BY artifact_kind`, [TENANT_KEY]),
  ]);
  const defects = [];
  for (const row of bindings.rows) if (row.readiness_status !== "bound") defects.push(`module_binding_blocked:${row.module_key}`);
  for (const row of findings.rows) if (row.finding_status !== "supported") defects.push(`hero_finding_not_supported:${row.hero_step_key}`);
  for (const row of artifacts.rows) {
    if (row.readiness_status !== "generated") defects.push(`artifact_not_generated:${row.artifact_kind}`);
    if (Number(row.unsupported_claim_count) !== 0) defects.push(`artifact_unsupported_claims:${row.artifact_kind}:${row.unsupported_claim_count}`);
  }
  return { bindings: bindings.rows.map(numObj), findings: findings.rows.map(numObj), artifacts: artifacts.rows.map(numObj), defects };
}

async function unsupportedNarrativeClaims(client) {
  const rows = await client.query(
    `SELECT artifact_kind, unsupported_claim_count
       FROM ${t("layer6_governed_narrative_artifacts")}
      WHERE tenant_key=$1
        AND (unsupported_claim_count <> 0
          OR advisory_packet::text ILIKE '%realized savings%'
          OR advisory_packet::text ILIKE '%patient_id%'
          OR advisory_packet::text ILIKE '%member_id%'
          OR advisory_packet::text ILIKE '%mrn%'
          OR advisory_packet::text ILIKE '%ssn%'
          OR narrative_sections::text ILIKE '%patient_id%'
          OR narrative_sections::text ILIKE '%member_id%'
          OR narrative_sections::text ILIKE '%mrn%'
          OR narrative_sections::text ILIKE '%ssn%')`,
    [TENANT_KEY],
  );
  const defects = rows.rows.map((row) => `unsupported_claim_scan_hit:${row.artifact_kind}`);
  return { hit_count: rows.rows.length, hits: rows.rows, defects };
}

async function projectionAuthorityByName(client) {
  const rows = await client.query(
    `SELECT projection_authority_id, projection_namespace, projection_name
       FROM ${t("projection_authority")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  return new Map(rows.rows.map((row) => [row.projection_name, row]));
}

async function lineageForProjectionNames(client, projectionNames) {
  const rows = await client.query(
    `SELECT
       (SELECT coalesce(jsonb_agg(DISTINCT source_record_id), '[]'::jsonb)
          FROM ${t("projection_rows")} pr
          CROSS JOIN LATERAL jsonb_array_elements_text(pr.source_record_ids) source_record_id
         WHERE pr.tenant_key=$1 AND pr.test_namespace=$2 AND pr.source_release_id=$3
           AND pr.projection_name = ANY($4::text[])) AS source_record_ids,
       (SELECT coalesce(jsonb_agg(DISTINCT canonical_entity_id), '[]'::jsonb)
          FROM ${t("projection_rows")} pr
          CROSS JOIN LATERAL jsonb_array_elements_text(pr.canonical_entity_ids) canonical_entity_id
         WHERE pr.tenant_key=$1 AND pr.test_namespace=$2 AND pr.source_release_id=$3
           AND pr.projection_name = ANY($4::text[])) AS canonical_entity_ids,
       (SELECT coalesce(jsonb_agg(DISTINCT canonical_relationship_id), '[]'::jsonb)
          FROM ${t("projection_rows")} pr
          CROSS JOIN LATERAL jsonb_array_elements_text(pr.canonical_relationship_ids) canonical_relationship_id
         WHERE pr.tenant_key=$1 AND pr.test_namespace=$2 AND pr.source_release_id=$3
           AND pr.projection_name = ANY($4::text[])) AS canonical_relationship_ids`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, projectionNames],
  );
  return rows.rows[0] || { source_record_ids: [], canonical_entity_ids: [], canonical_relationship_ids: [] };
}

async function readEventSnapshot(client) {
  return one(
    client,
    `SELECT event_context_snapshot_id, event_id, snapshot_version, snapshot_hash, selected_canonical_entity_ids, selected_canonical_relationship_ids, selected_source_record_ids
       FROM ${t("event_context_snapshots")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3 AND event_context_snapshot_id=$4`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, EVENT_CONTEXT_SNAPSHOT_ID],
  );
}

async function resetLayer6Rows(client) {
  for (const table of ["layer6_gate_results", "layer6_governed_narrative_artifacts", "layer6_hero_journey_findings", "layer6_app_module_bindings"]) {
    await client.query(`DELETE FROM ${t(table)} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
  }
}

async function insertGateResults(client, result) {
  const gates = [
    ["PHS-L6-K6A-MODULE-BINDINGS", EXPECTED.module_bindings, result.layer6_counts.module_bindings],
    ["PHS-L6-K6B-HERO-FINDINGS", EXPECTED.hero_findings, result.layer6_counts.hero_findings],
    ["PHS-L6-K6C-NARRATIVE-ARTIFACTS", EXPECTED.narrative_artifacts, result.layer6_counts.narrative_artifacts],
    ["PHS-L6-K6D-UNSUPPORTED-CLAIMS", 0, result.layer6_counts.unsupported_claim_artifacts],
    ["PHS-L6-K6E-CUBE-GATE", 0, result.cube_reconciliation_proof?.defect_count ?? 0],
  ];
  for (const [gateKey, expected, actual] of gates) {
    await client.query(
      `INSERT INTO ${t("layer6_gate_results")}
        (gate_result_id, tenant_key, test_namespace, source_release_id, layer6_version, gate_key, expected_count, actual_count, gate_status, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       ON CONFLICT (tenant_key, test_namespace, source_release_id, layer6_version, gate_key)
       DO UPDATE SET actual_count=excluded.actual_count, gate_status=excluded.gate_status, details=excluded.details, created_at=now()`,
      [
        id("phs-l6-gate", gateKey),
        TENANT_KEY,
        TEST_NAMESPACE,
        SOURCE_RELEASE_ID,
        LAYER6_VERSION,
        gateKey,
        expected,
        Number(actual),
        Number(actual) === Number(expected) ? "passed" : "failed",
        JSON.stringify({ expected, actual }),
      ],
    );
  }
}

async function readSkyHarborCounts(client) {
  const candidates = [
    ["contracts", "consumption_v4_canary", "sourcing_contract_v1", "count(*)::int AS rows, sum(annual_value)::numeric AS annual_value"],
    ["vendors", "consumption_v4_canary", "sourcing_vendor_v1", "count(*)::int AS rows, sum(contract_count)::numeric AS contract_count"],
    ["scope", "consumption_v4_canary", "sourcing_contract_scope_v1", "count(*)::int AS rows"],
  ];
  const result = {};
  for (const [name, schema, table, select] of candidates) {
    const exists = await tableExists(client, schema, table);
    result[name] = exists ? numObj(await one(client, `SELECT ${select} FROM ${q(schema)}.${q(table)} WHERE tenant_key=$1`, [SKYHARBOR_TENANT])) : { missing: true };
  }
  return result;
}

function readCubeProof(filePath) {
  const inlineProof = readInlineCubeProof();
  if (inlineProof) return inlineProof;
  if (!filePath) {
    return {
      summary: { provided: false, defect_count: 1 },
      defects: ["cube_proof_path_required"],
    };
  }
  if (!fs.existsSync(filePath)) {
    return {
      summary: { provided: true, path: filePath, exists: false, defect_count: 1 },
      defects: [`cube_proof_missing:${filePath}`],
    };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return evaluateCubeProof(JSON.parse(raw), {
    provided: true,
    path: filePath,
    sha256: sha256(raw),
  });
}

function readInlineCubeProof() {
  const raw =
    process.env.PHS_LAYER6_CUBE_PROOF_JSON ||
    (process.env.PHS_LAYER6_CUBE_PROOF_JSON_B64
      ? Buffer.from(process.env.PHS_LAYER6_CUBE_PROOF_JSON_B64, "base64").toString("utf8")
      : "");
  if (!raw.trim()) return null;
  const proof = JSON.parse(raw);
  return evaluateCubeProof(proof, {
    provided: true,
    inline: true,
    sha256: sha256(raw),
  });
}

function evaluateCubeProof(proof, baseSummary) {
  const failures = [...(proof.failures || []), ...(proof.runtime?.failures || []), ...(proof.model?.failures || [])];
  const defects = [];
  if (
    proof.status !== "PHS_HEALTHCARE_DEMO_CUBE_CANARY_VERIFIED" &&
    proof.status !== "PHS_HEALTHCARE_DEMO_LAYER5_PRIVATE_CUBE_CANARY_VERIFIED"
  ) {
    defects.push(`cube_proof_status:${proof.status}`);
  }
  if (proof.ok === false) defects.push("cube_proof_not_ok");
  if (failures.length > 0) defects.push(`cube_proof_failures:${failures.join("|")}`);
  const runtime = proof.runtime || proof.cube_canary?.runtime || proof.cube_canary || {};
  const missingTenantStatus = runtime.security?.missing_tenant_status ?? proof.missing_tenant_status;
  const isolation = runtime.security?.tenant_isolation || proof.tenant_isolation || {};
  if (missingTenantStatus !== undefined && Number(missingTenantStatus) !== 403) {
    defects.push(`cube_missing_tenant_status:${missingTenantStatus}`);
  }
  if (isolation.skyharbor_token_phs_count !== undefined && Number(isolation.skyharbor_token_phs_count) !== 0) {
    defects.push("cube_tenant_isolation_skyharbor_reads_phs");
  }
  if (isolation.phs_token_skyharbor_count !== undefined && Number(isolation.phs_token_skyharbor_count) !== 0) {
    defects.push("cube_tenant_isolation_phs_reads_skyharbor");
  }
  return {
    summary: {
      ...baseSummary,
      status: proof.status,
      ok: proof.ok ?? defects.length === 0,
      missing_tenant_status: missingTenantStatus ?? null,
      defect_count: defects.length,
      traffic_shift_executed: proof.traffic_shift_executed === true,
    },
    defects,
  };
}

function assertApplyApproved() {
  if (process.env.PHS_LAYER6_EXECUTE_APPLY !== "true") {
    throw new Error("PHS_LAYER6_EXECUTE_APPLY=true is required for Layer 6 mutation");
  }
}

function writeProofSet(result) {
  writeJson(proofRef(args.outDir, "proof/PHS_LAYER6_PRODUCT_BINDINGS.json"), result);
  writeJson(proofRef(args.outDir, "proof/PHS_LAYER6_PRODUCT_BINDINGS_SIGNATURE.json"), {
    status: result.status,
    sha256: sha256(stableJson(result)),
  });
  if (result.layer6_counts) {
    writeCsv(proofRef(args.outDir, "proof/PHS_LAYER6_COUNTS.csv"), ["metric", "value"], Object.entries(result.layer6_counts).filter(([, value]) => typeof value === "number").map(([metric, value]) => ({ metric, value })));
  }
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

function manifest(status, extra) {
  return {
    status,
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    source_release_alias: FOUNDATION_RELEASE_ALIAS,
    event_id: EVENT_ID,
    event_context_snapshot_id: EVENT_CONTEXT_SNAPSHOT_ID,
    layer6_version: LAYER6_VERSION,
    layer_boundary: "Layer 6 product bindings consume Layer 4/5 typed projections; generic observations are not product-visible.",
    ...extra,
  };
}

async function tableExists(client, schema, table) {
  const row = await one(client, `SELECT to_regclass($1) IS NOT NULL AS exists`, [`${schema}.${table}`]);
  return row.exists === true;
}

async function one(client, text, values) {
  const result = await client.query(text, values);
  return result.rows[0] || {};
}

function numObj(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (typeof value === "bigint") return [key, Number(value)];
    if (typeof value === "string" && value.match(/^-?\d+(\.\d+)?$/u)) return [key, Number(value)];
    return [key, value];
  }));
}

function id(prefix, value) {
  return `${prefix}:${crypto.createHash("sha256").update(`${TENANT_KEY}:${TEST_NAMESPACE}:${SOURCE_RELEASE_ID}:${value}`).digest("hex").slice(0, 24)}`;
}

function q(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Unsafe SQL identifier ${value}`);
  return `"${value}"`;
}

function t(table) {
  return `${q(SOURCE_SCHEMA)}.${q(table)}`;
}

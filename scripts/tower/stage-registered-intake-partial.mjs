#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRegisteredIntakeCandidate, csvRows } from "./build-registered-intake-reload-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATASET_ID = "tower-registered-intake-partial-20261011";
const IDENTITY_PATH = path.join(ROOT, "scripts/tower/registered-intake-identity-contract.json");
const RELEASE_RECORD = "docs/releases/records/2026-10-11-tower-category-measure-basis.md";
const PAGE_TABLE = {
  command_center: "tower_command_center",
  decision_lanes: "tower_command_center",
  recommended_actions: "tower_command_center",
  value_proof: "tower_value_chain",
  cost_lens: "tower_value_chain",
  evidence: "tower_evidence_queue",
  risk_lens: "tower_evidence_queue",
  ai_portfolio: "tower_ai_portfolio",
  adoption_lens: "tower_ai_portfolio",
};
const PAGE_KEYS = Object.keys(PAGE_TABLE);
const PROJECTION_VERSION = 4;
const BUILD_VERSION = "tower-registered-intake-partial/v2";
const SOURCE_FIELDS_VARIANT = "source-fields-v1";
const SOURCE_ASSERTIONS_VARIANT = "source-assertions-v1";
const FOUNDATION_MEASURES = {
  organization: [["budget_authority_usd", "organization_source_budget_authority_usd", "USD"]],
  application: [["annual_cost_usd", "application_source_annual_cost_usd", "USD"]],
  data_flow: [],
  infrastructure: [["annual_cost_usd", "infrastructure_source_annual_cost_usd", "USD"],
    ["utilization_pct", "infrastructure_source_utilization_pct", "percent"]],
  process: [["transaction_volume", "process_source_transaction_volume", "source_unit"],
    ["error_rate_pct", "process_source_error_rate_pct", "percent"],
    ["rework_pct", "process_source_rework_pct", "percent"],
    ["automation_pct", "process_source_automation_pct", "percent"],
    ["cost_per_transaction", "process_source_cost_per_transaction", "source_unit"]],
};

function candidateConfig(report) {
  const sourceAssertions = report.candidate_rules_version === SOURCE_ASSERTIONS_VARIANT;
  const sourceFields = sourceAssertions || report.candidate_rules_version === SOURCE_FIELDS_VARIANT;
  const datasetId = sourceAssertions ? "tower-registered-intake-source-assertions-20261012" :
    sourceFields ? "tower-registered-intake-source-fields-20261012" : DATASET_ID;
  return {
    datasetId,
    manifestPath: path.join(ROOT, "docs/governance/dataset-manifests", `${datasetId}.json`),
    releaseRecord: sourceAssertions ? "docs/releases/records/2026-10-12-tower-source-assertions-candidate.md" :
      sourceFields ? "docs/releases/records/2026-10-12-tower-registered-source-fields.md" : RELEASE_RECORD,
    projectionVersion: sourceAssertions ? 6 : sourceFields ? 5 : PROJECTION_VERSION,
    buildVersion: sourceAssertions ? "tower-registered-intake-source-assertions/v1" :
      sourceFields ? "tower-registered-intake-source-fields/v1" : BUILD_VERSION,
    sourceFields,
    sourceAssertions,
  };
}
const IDENTITY = JSON.parse(fs.readFileSync(IDENTITY_PATH, "utf8"));
const SPEND_METRIC_KEY = IDENTITY.aggregate_spend_metric.object_key;

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function uuid(...parts) {
  const bits = hash(parts.join("|")).slice(0, 32).split("");
  bits[12] = "5";
  bits[16] = ((Number.parseInt(bits[16], 16) & 3) | 8).toString(16);
  const hex = bits.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function args() {
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  return {
    tenantKey: value("--tenant-key") || process.env.TOWER_RELOAD_TENANT_KEY,
    candidateVariant: value("--candidate-variant") || process.env.TOWER_RELOAD_CANDIDATE_VARIANT || null,
    outDir: value("--out-dir") || process.env.TOWER_RELOAD_OUT_DIR,
    write: process.argv.includes("--write"),
    reattest: process.argv.includes("--reattest"),
    jobRunId: value("--job-run-id") || process.env.TOWER_RELOAD_RUN_ID || process.env.ABARVA_OPERATOR_RUN_ID || null,
    stageJobRunId: value("--stage-job-run-id") || process.env.TOWER_RELOAD_STAGE_RUN_ID || null,
  };
}

function sourceRowId(report, ref) {
  return uuid("source_record", report.tenant_key, report.assessment_id, ref.source_file, ref.source_sha256, ref.source_row);
}

function objectId(report, type, key) {
  return uuid("object", report.tenant_key, report.assessment_id, type, key);
}

function sourceRefsFor(row) {
  return (row.source_refs || []).filter((ref) => Number.isInteger(ref.source_row) && ref.source_row >= 2);
}

function addObject(plan, report, type, key, title, ref, attrs = {}, reviewState = "not_reviewed") {
  const id = objectId(report, type, key);
  plan.objects.push({
    id, tenant_key: report.tenant_key, assessment_id: report.assessment_id,
    object_key: key, object_type: type, display_name: title || key,
    business_domain: null, lifecycle_state: "candidate",
    source_record_id: ref ? sourceRowId(report, ref) : null,
    basis: "source_recorded", value_state: "known", review_state: reviewState,
    confidence: 0.65, attributes_json: { ...attrs, canonical_semantic_type: type, source_ref: ref || null },
  });
  return id;
}

function addMeasure(plan, report, object, metric, value, unit, ref, state, attrs = {}) {
  if (value === null || value === undefined) return;
  plan.measures.push({
    id: uuid("measure", report.tenant_key, report.assessment_id, object, metric,
      ref?.source_file || "aggregate", ref?.source_row || "aggregate"),
    tenant_key: report.tenant_key, assessment_id: report.assessment_id,
    subject_object_id: object, metric_key: metric, value_number: value,
    value_text: null, unit, period_start: null, period_end: null,
    scenario: state === "estimated" ? "planned" : "current",
    source_record_id: ref ? sourceRowId(report, ref) : null,
    document_extraction_id: null, basis: "source_recorded", value_state: state,
    quality_state: state === "estimated" ? "estimated" : "usable",
    review_state: "not_reviewed", attributes_json: attrs,
  });
}

function addOutcomeTextMeasure(plan, report, object, value, scenario, sourceField, ref, sourcePeriodText = null) {
  if (typeof value !== "string" || value.trim() === "") return;
  plan.measures.push({
    id: uuid("measure", report.tenant_key, report.assessment_id, object,
      "outcome_source_value", scenario, sourceField),
    tenant_key: report.tenant_key, assessment_id: report.assessment_id,
    subject_object_id: object, metric_key: "outcome_source_value",
    value_number: null, value_text: value, unit: "source_text",
    period_start: null, period_end: null, scenario,
    source_record_id: sourceRowId(report, ref), document_extraction_id: null,
    basis: "source_recorded", value_state: "known", quality_state: "insufficient",
    review_state: "not_reviewed", attributes_json: {
      source_field: sourceField, source_period_text: sourcePeriodText,
      unit_and_period_not_normalized: true,
      claimable_value_usd: null,
    },
  });
}

function recordTypeFor(file) {
  if (file === "19_data_analytics_platform_maturity.csv") return "maturity_source_record_identity_unresolved";
  if (file.startsWith("SA08_")) return "ai_benefit_record";
  if (file.startsWith("SA09_")) return "ai_usage_record";
  if (file.startsWith("SA11_")) return "ai_outcome_record";
  return file.replace(/\.csv$/, "");
}

function sourceTypeFor(file) {
  if (file.startsWith("SA09_")) return "ai_telemetry";
  if (file.startsWith("09_")) return "ppm";
  if (file.startsWith("07_")) return "clm";
  if (file.startsWith("11_")) return "grc";
  if (file.startsWith("14_")) return "bi";
  return "manual_workbook";
}

function addSourceRows(plan, report) {
  const refs = new Map();
  for (const page of PAGE_KEYS) {
    for (const row of report.views[page]) {
      for (const ref of sourceRefsFor(row)) {
        const key = `${ref.source_file}:${ref.source_row}`;
        if (refs.has(key) && refs.get(key).source_sha256 !== ref.source_sha256) throw new Error(`Conflicting source hash for ${key}`);
        refs.set(key, ref);
      }
    }
  }
  for (const ref of report.canonical.programs.map((row) => row.source_ref)) refs.set(`${ref.source_file}:${ref.source_row}`, ref);
  for (const item of report.canonical.foundations.source_objects || []) {
    const ref = item.source_ref;
    refs.set(`${ref.source_file}:${ref.source_row}`, ref);
  }
  if (candidateConfig(report).sourceAssertions) {
    for (const [file, expectedRows] of [
      ["12_relationships.csv", report.canonical.foundations.relationship_census.source_rows],
      ["19_data_analytics_platform_maturity.csv", report.canonical.foundations.no_declared_row_id.row_count],
    ]) {
      const metadata = report.source_manifest[file];
      const bytes = fs.readFileSync(path.join(ROOT, metadata.source_path));
      if (hash(bytes) !== metadata.sha256) throw new Error(`${file} source hash changed after candidate review`);
      const rows = csvRows(bytes.toString("utf8"));
      if (rows.length !== expectedRows) throw new Error(`${file} source census changed after candidate review`);
      rows.forEach((row, index) => {
        if (row.tenant_key !== report.tenant_key) throw new Error(`${file} source tenant mismatch`);
        const ref = { source_file: file, source_sha256: metadata.sha256, source_row: index + 2,
          source_record_id: null };
        refs.set(`${file}:${index + 2}`, ref);
      });
    }
  }
  for (const file of Object.keys(report.source_manifest).sort()) {
    if (file.startsWith("extracts/")) continue;
    const metadata = report.source_manifest[file];
    plan.sourceFiles.push({
      id: uuid("source_file", report.tenant_key, report.assessment_id, file, metadata.sha256),
      tenant_key: report.tenant_key, assessment_id: report.assessment_id,
      source_type: sourceTypeFor(file), source_owner: "registered intake owner",
      file_name: file, blob_uri: `repo-synthetic://${metadata.source_path}`,
      file_hash: metadata.sha256, source_date: null, access_class: "internal",
      quality_state: file === "13_evidence_sources.csv" ? "blocked" : "partial",
      metadata_json: { source_path: metadata.source_path, row_count: metadata.row_count,
        content_loaded: file !== "13_evidence_sources.csv" && [...refs.values()].some((ref) => ref.source_file === file),
        canonical_identity_unresolved: file === "19_data_analytics_platform_maturity.csv" },
      origin: "synthetic_generator",
    });
  }
  const parsedFiles = new Map();
  for (const ref of refs.values()) {
    if (ref.source_file === "13_evidence_sources.csv") continue;
    const metadata = report.source_manifest[ref.source_file];
    if (!metadata || metadata.sha256 !== ref.source_sha256) throw new Error("Source reference hash does not match manifest");
    if (!parsedFiles.has(ref.source_file)) {
      const bytes = fs.readFileSync(path.join(ROOT, metadata.source_path));
      if (hash(bytes) !== metadata.sha256) throw new Error(`Source file changed after candidate build: ${ref.source_file}`);
      parsedFiles.set(ref.source_file, csvRows(bytes.toString("utf8")));
    }
    const payload = parsedFiles.get(ref.source_file)[ref.source_row - 2];
    if (!payload || payload.tenant_key !== report.tenant_key) throw new Error(`Invalid source row: ${ref.source_file}:${ref.source_row}`);
    plan.sourceRecords.push({
      id: sourceRowId(report, ref), tenant_key: report.tenant_key, assessment_id: report.assessment_id,
      source_file_id: uuid("source_file", report.tenant_key, report.assessment_id, ref.source_file, ref.source_sha256),
      native_id: ref.source_record_id || `${ref.source_file}#${ref.source_row}`,
      record_type: recordTypeFor(ref.source_file), row_number: ref.source_row,
      payload_json: payload, parse_state: "parsed",
      parse_notes: ref.source_file === "19_data_analytics_platform_maturity.csv" ?
        "source_row_only_identity_unresolved_no_canonical_object" : null,
    });
  }
}

function addCanonicalRows(plan, report) {
  const spendRefs = report.canonical.modeled_annual_spend.source_refs;
  if (spendRefs.length !== 27 || spendRefs.some((ref) => ref.source_file !== IDENTITY.aggregate_spend_metric.source_file)) {
    throw new Error("Aggregate spend identity contract does not match registered source rows");
  }
  const spendId = addObject(plan, report, "metric", SPEND_METRIC_KEY, "Modeled annual IT spend", null,
    { source_basis: IDENTITY.aggregate_spend_metric.basis, period: "annual_unspecified_year",
      source_refs: spendRefs, narrative_difference_usd: report.canonical.modeled_annual_spend.row_sum_difference_usd });
  const spendObject = plan.objects.find((row) => row.id === spendId);
  spendObject.basis = "calculated";
  spendObject.value_state = "estimated";
  addMeasure(plan, report, spendId, SPEND_METRIC_KEY, report.canonical.modeled_annual_spend.amount_usd,
    "USD", null, "estimated", { source_basis: IDENTITY.aggregate_spend_metric.basis,
      period: "annual_unspecified_year", source_refs: spendRefs,
      money_population: "modeled_it_spend", amount_role: "aggregate",
      do_not_add_to_category_rows: true, do_not_add_to_contract_spend: true });
  plan.measures.at(-1).basis = "calculated";
  for (const row of report.views.cost_lens.filter((item) => item.row_key.startsWith("spend:"))) {
    const ref = sourceRefsFor(row)[0];
    if (!ref || row.category_business_id !== null || row.source_row_identity_only !== true) {
      throw new Error(`Spend category lacks an explicit source-row-only identity: ${row.row_key}`);
    }
    addMeasure(plan, report, spendId, "modeled_annual_spend_category_usd", row.value,
      "USD", ref, "estimated", {
        category_business_id: null, category_label: row.category_label,
        identity_basis: "source_row_only", money_population: "modeled_it_spend",
        amount_role: "aggregate_component", parent_metric_key: SPEND_METRIC_KEY,
        period: "annual_unspecified_year", do_not_add_to_aggregate: true,
        do_not_add_to_contract_spend: true,
      });
    if (candidateConfig(report).sourceAssertions) {
      for (const [metric, field, sourceField] of [
        ["spend_source_prior_year_actual_usd", "source_prior_year_actual_usd", "prior_year_actual_usd"],
        ["spend_source_forecast_next_year_usd", "source_forecast_next_year_usd", "forecast_next_year_usd"],
        ["spend_source_savings_opportunity_usd", "source_savings_opportunity_usd", "savings_opportunity_usd"],
      ]) addMeasure(plan, report, spendId, metric, row[field], "USD", ref, "estimated", {
        category_business_id: null, category_label: row.category_label,
        identity_basis: "source_row_only", source_field: sourceField,
        source_assertion_only: true, approved_fy_budget_usd: null, claimable_value_usd: null,
        period_basis: "source_text_unverified", additive_to_aggregate_spend: false,
      });
    }
  }
  for (const program of report.canonical.programs) {
    const id = addObject(plan, report, "program", program.id, program.name, program.source_ref,
      { budget_basis: "planning_period_unapproved", fiscal_year: null,
        funding_approval_status: "not_verified",
        ...(candidateConfig(report).sourceFields ? {
          business_sponsor_role: program.business_sponsor_role,
          technology_owner_role: program.technology_owner_role,
          source_program_status: program.source_program_status,
          source_program_phase: program.source_program_phase,
          affected_functions: program.affected_functions.map(({ function_id, function_name }) => ({ function_id, function_name })),
          primary_funding_domain: null,
          ...(candidateConfig(report).sourceAssertions ? {
            source_stated_expected_value_usd: program.source_stated_expected_value_usd,
            source_start_date: program.source_start_date,
            source_end_date: program.source_end_date,
            source_pct_complete: program.source_pct_complete,
            source_stage_gate: program.source_stage_gate,
            source_benefit_realization_start: program.source_benefit_realization_start,
            source_blocked_reason: program.source_blocked_reason,
            source_objective: program.source_objective,
            source_target_outcomes: program.source_target_outcomes,
            source_assertion_caveat: "Planning source only; period, approval and realization are not verified.",
          } : {}),
        } : {}) });
    addMeasure(plan, report, id, "program_planning_budget_usd", program.planning_budget_usd, "USD", program.source_ref,
      "estimated", { approved_fy_budget_usd: null, fiscal_year: null,
        funding_approval_status: "not_verified", period_basis: "unspecified" });
    if (candidateConfig(report).sourceAssertions) addMeasure(plan, report, id,
      "program_source_expected_value_usd", program.source_stated_expected_value_usd, "USD", program.source_ref,
      "estimated", { source_assertion_only: true, claimable_value_usd: null,
        period_basis: "unspecified", source_field: "expected_value_usd" });
  }
  for (const item of report.canonical.ai_use_cases) {
    addObject(plan, report, "ai_use_case", item.id, item.name, item.source_refs[0],
      { source_population: "use_case_intake", claimable_value_usd: null,
        ...(candidateConfig(report).sourceFields ? {
          business_function: item.business_function,
          business_segment_key: item.business_segment_key,
          source_case_status: item.status,
          business_sponsor_role: item.sponsor_role,
          operational_owner_role: item.operational_owner_role,
          expected_value_archetype: item.expected_value_archetype,
          ...(candidateConfig(report).sourceAssertions ? {
            source_value_hypothesis: item.source_value_hypothesis,
            source_approval_path: item.source_approval_path,
            source_risk_controls: item.source_risk_controls,
            source_required_systems: item.source_required_systems,
          } : {}),
        } : {}) });
  }
  for (const claim of report.canonical.ai_claims) {
    const ref = claim.source_refs.find((item) => item.source_file.startsWith("SA09_"));
    const id = addObject(plan, report, "ai_use_case", claim.id, claim.name, ref,
      { source_population: "separate_benefit_usage_feed", linked_use_case_id: null,
        claimable_value_usd: null, evidence_reference_registered: claim.evidence_reference_registered,
        unregistered_evidence_ids: claim.unregistered_evidence_ids,
        program_budget_linked: claim.program_budget_linked,
        finance_feed_conflict: claim.finance_feed_conflict,
        finance_feed_missing: claim.finance_feed_missing,
        claim_status_feed_conflict: claim.claim_status_feed_conflict,
        claim_status_feed_missing: claim.claim_status_feed_missing,
        ...(candidateConfig(report).sourceAssertions ? {
          source_asserted_finance_value_usd: claim.source_asserted_finance_value_usd,
          benefit_feed_source_funded_spend_usd: claim.benefit_feed_source_funded_spend_usd,
          benefit_feed_source_actual_spend_ytd_usd: claim.benefit_feed_source_actual_spend_ytd_usd,
          usage_feed_source_promised_value_usd: claim.usage_feed_source_promised_value_usd,
          usage_feed_source_finance_assertion_usd: claim.usage_feed_source_finance_assertion_usd,
          usage_feed_source_claim_status: claim.usage_feed_source_claim_status,
          source_finance_validation_status: claim.source_finance_validation_status,
          source_value_claim_status: claim.source_value_claim_status,
          source_tower_claim_allowed: claim.source_tower_claim_allowed,
          source_realized_value_allowed: claim.source_realized_value_allowed,
          source_owner_attestation_status: claim.source_owner_attestation_status,
          source_evidence_id: claim.source_evidence_id,
          source_evidence_freshness_status: claim.source_evidence_freshness_status,
          source_duplicate_risk: claim.source_duplicate_risk,
          source_additive_status: claim.source_additive_status,
          source_assertion_caveat: claim.source_assertion_caveat,
          outcome_feed_kpi_name: claim.outcome_feed_kpi_name,
          outcome_feed_baseline: claim.outcome_feed_baseline,
          outcome_feed_target: claim.outcome_feed_target,
          outcome_feed_actual: claim.outcome_feed_actual,
          outcome_feed_unit: claim.outcome_feed_unit,
          outcome_feed_period_start: claim.outcome_feed_period_start,
          outcome_feed_period_end: claim.outcome_feed_period_end,
          outcome_feed_claim_status: claim.outcome_feed_claim_status,
          outcome_feed_claim_allowed: claim.outcome_feed_claim_allowed,
          outcome_feed_source_finance_assertion_usd: claim.outcome_feed_source_finance_assertion_usd,
          outcome_feed_source_record_id: claim.outcome_feed_source_record_id,
        } : {}) });
    addMeasure(plan, report, id, "usage_feed_active_users", claim.usage_active_users, "users", ref,
      "known", { enabled_users: claim.usage_denominator,
        licensed_users: claim.usage_licensed_users,
        reported_usage_rate_pct: claim.usage_feed_reported_rate_pct,
        reported_usage_rate_denominator: claim.usage_feed_usage_rate_basis,
        benefit_feed_usage_rate_denominator: claim.benefit_feed_usage_rate_basis,
        raw_detail_validates_usage: report.raw_usage_validation.validates_claim_usage,
        value_attribution_usd: null });
    if (candidateConfig(report).sourceAssertions) {
      for (const [metric, value, unit, sourceField] of [
        ["usage_feed_power_users", claim.usage_power_users, "users", "power_users"],
        ["usage_feed_usage_events", claim.usage_events, "events", "usage_events"],
      ]) addMeasure(plan, report, id, metric, value, unit, ref, "known", {
        source_field: sourceField, source_assertion_only: true,
        usage_period_start: claim.usage_period_start, usage_period_end: claim.usage_period_end,
        value_attribution_usd: null,
      });
    }
    const benefitRef = claim.source_refs.find((item) => item.source_file.startsWith("SA08_"));
    addMeasure(plan, report, id, "benefit_feed_planning_promise_usd", claim.planning_promise_usd, "USD", benefitRef,
      "estimated", { cross_source_conflict: claim.source_conflict, claimable_value_usd: null });
    if (candidateConfig(report).sourceAssertions) addMeasure(plan, report, id,
      "benefit_feed_source_finance_assertion_usd", claim.source_asserted_finance_value_usd,
      "USD", benefitRef, "estimated", { source_assertion_only: true, claimable_value_usd: null,
        source_field: "finance_validated_value_usd", source_finance_validation_status: claim.source_finance_validation_status,
        source_evidence_id: claim.source_evidence_id, cross_feed_conflict: claim.finance_feed_conflict,
        evidence_reference_registered: claim.evidence_reference_registered });
    if (candidateConfig(report).sourceAssertions) {
      for (const [metric, value, sourceField, sourceRef] of [
        ["benefit_feed_source_funded_spend_usd", claim.benefit_feed_source_funded_spend_usd, "funded_spend_usd", benefitRef],
        ["benefit_feed_source_actual_spend_ytd_usd", claim.benefit_feed_source_actual_spend_ytd_usd, "actual_spend_ytd_usd", benefitRef],
        ["usage_feed_source_promised_value_usd", claim.usage_feed_source_promised_value_usd, "promised_value_usd", ref],
        ["usage_feed_source_finance_assertion_usd", claim.usage_feed_source_finance_assertion_usd, "finance_validated_value_usd", ref],
      ]) addMeasure(plan, report, id, metric, value, "USD", sourceRef, "estimated", {
        source_field: sourceField, source_assertion_only: true,
        approved_fy_budget_usd: null, claimable_value_usd: null,
        do_not_sum_across_feeds: true, cross_feed_conflict: claim.finance_feed_conflict,
      });
    }
    if (candidateConfig(report).sourceAssertions) {
      const outcomeRef = claim.source_refs.find((item) => item.source_file.startsWith("SA11_"));
      for (const [metric, value, unit, sourceField] of [
        ["ai_outcome_feed_baseline", claim.outcome_feed_baseline, claim.outcome_feed_unit, "baseline_value"],
        ["ai_outcome_feed_target", claim.outcome_feed_target, claim.outcome_feed_unit, "target_value"],
        ["ai_outcome_feed_actual", claim.outcome_feed_actual, claim.outcome_feed_unit, "actual_value"],
        ["ai_outcome_feed_source_finance_assertion_usd", claim.outcome_feed_source_finance_assertion_usd, "USD", "finance_validated_value_usd"],
      ]) addMeasure(plan, report, id, metric, value, unit, outcomeRef, "estimated", {
        source_field: sourceField, source_assertion_only: true, claimable_value_usd: null,
        measurement_period_start: claim.outcome_feed_period_start,
        measurement_period_end: claim.outcome_feed_period_end,
      });
    }
  }
  for (const vendor of report.canonical.contract_exposure) {
    const id = addObject(plan, report, "vendor", vendor.id, vendor.vendor, vendor.source_ref,
      { overlap_with_it_spend_unknown: true,
        ...(candidateConfig(report).sourceAssertions ? {
          source_contract_name: vendor.source_contract_name,
          source_service_category: vendor.source_service_category,
          source_contract_owner_role: vendor.source_contract_owner_role,
          source_renewal_date: vendor.source_renewal_date,
          source_term_end: vendor.source_term_end,
          source_risk_rating: vendor.source_risk_rating,
        } : {}) });
    addMeasure(plan, report, id, "vendor_annual_contract_spend_usd", vendor.annual_contract_spend_usd,
      "USD", vendor.source_ref, "estimated", {
        money_population: "vendor_contract_exposure", amount_role: "separate_exposure",
        overlap_with_it_spend: "unknown", additive_to_it_spend: false,
      });
  }
  for (const row of report.views.risk_lens) {
    addObject(plan, report, "risk", row.row_key, row.title, sourceRefsFor(row)[0],
      { severity: row.severity, control_status: row.control_status,
        ...(candidateConfig(report).sourceAssertions ? {
          source_likelihood: row.source_likelihood,
          source_control_owner_role: row.source_control_owner_role,
          source_evidence_required: row.source_evidence_required,
          source_mitigation_plan: row.source_mitigation_plan,
          source_last_tested_date: row.source_last_tested_date,
          source_regulatory_driver: row.source_regulatory_driver,
        } : {}) });
  }
  for (const metric of report.canonical.outcome_metrics) {
    const id = addObject(plan, report, "metric", metric.id, metric.name, metric.source_ref,
      { baseline: metric.baseline, baseline_period: metric.baseline_period,
        target: metric.target, observed: metric.observed, observed_period: metric.observed_period,
        claimable_value_usd: null, blocked_reason: metric.blocked_reason,
        ...(candidateConfig(report).sourceAssertions ? {
          source_asserted_finance_value_usd: metric.source_asserted_finance_value_usd,
          source_definition: metric.source_definition,
          source_metric_domain: metric.source_metric_domain,
          source_business_function: metric.source_business_function,
          source_owner_role: metric.source_owner_role,
          source_data_source: metric.source_data_source,
          source_calculation_basis: metric.source_calculation_basis,
          source_unblock_target_period: metric.source_unblock_target_period,
          source_value_claim_status: metric.source_value_claim_status,
          source_claim_readiness: metric.source_claim_readiness,
          source_attestation_owner: metric.source_attestation_owner,
          source_evidence_basis: metric.evidence_basis,
          source_assertion_caveat: metric.source_assertion_caveat,
        } : {}) });
    addOutcomeTextMeasure(plan, report, id, metric.baseline, "baseline", "baseline", metric.source_ref,
      metric.baseline_period);
    addOutcomeTextMeasure(plan, report, id, metric.target, "target", "target", metric.source_ref);
    addOutcomeTextMeasure(plan, report, id, metric.observed, "actual", "observed", metric.source_ref,
      metric.observed_period);
    if (candidateConfig(report).sourceAssertions) addMeasure(plan, report, id,
      "outcome_source_finance_assertion_usd", metric.source_asserted_finance_value_usd,
      "USD", metric.source_ref, "estimated", { source_assertion_only: true,
        claimable_value_usd: null, source_field: "finance_attested_value_usd",
        source_value_claim_status: metric.source_value_claim_status,
        source_claim_readiness: metric.source_claim_readiness,
        source_evidence_basis: metric.evidence_basis });
  }
  for (const item of report.canonical.foundations.source_objects || []) {
    const id = addObject(plan, report, item.object_type, item.id, item.name, item.source_ref,
      { ...item.source_fields, source_semantic_type: item.object_type === "data_flow" ?
        "declared_data_asset_integration" : item.object_type,
      source_population: "registered_foundation_intake", no_inferred_relationships: true });
    for (const [sourceField, metric, unit] of FOUNDATION_MEASURES[item.object_type]) {
      const raw = item.source_fields[sourceField];
      const value = raw === null ? null : Number(raw);
      if (raw !== null && (!Number.isFinite(value) || value < 0)) {
        throw new Error(`Foundation source amount invalid: ${item.source_ref.source_file}:${item.source_ref.source_row}:${sourceField}`);
      }
      addMeasure(plan, report, id, metric, value, unit, item.source_ref, "estimated", {
        source_field: sourceField, source_assertion_only: true,
        approved_fy_budget_usd: null, claimable_value_usd: null,
        overlap_with_modeled_spend: "unknown", source_unit_not_normalized: unit === "source_unit",
      });
    }
  }
}

function physicalPreviewRows(report) {
  const result = Object.fromEntries(PAGE_KEYS.map((page) => [page, []]));
  for (const page of PAGE_KEYS) {
    result[page] = report.views[page];
  }
  result.decision_lanes = result.decision_lanes.map((row) => ({ ...row,
    value: null, value_state: "unknown", planning_budget_usd: row.value,
    approved_fy_budget_usd: null, decision_lane: null,
  }));
  const spendRefs = report.canonical.modeled_annual_spend.source_refs;
  result.cost_lens.unshift({
    row_key: "modeled_annual_spend", title: "Modeled annual IT spend",
    plain_language: "Annual category spend is a one-source planning estimate, not an approved budget. The category breakdown is tied to source rows; category business IDs are still missing.",
    value: report.canonical.modeled_annual_spend.amount_usd,
    value_state: "estimated", source_refs: spendRefs,
    metric_label: "Modeled annual spend", additive_to_contract_spend: false,
    additive_to_category_rows: false, money_population: "modeled_it_spend",
    amount_role: "aggregate", period_basis: "annual_unspecified_year",
    source_narrative_difference_usd: report.canonical.modeled_annual_spend.row_sum_difference_usd,
  });
  result.evidence = [{
    row_key: "evidence_approval_gap", title: "Evidence approval and reference gap",
    plain_language: `${report.evidence_rows_not_approved} source entries have not been approved for loading. ${report.unregistered_claim_evidence_ids.length} claim evidence IDs do not appear in the register and ${report.claim_evidence_missing_rows} claim feed rows have no evidence ID. No evidence content is presented as proof.`,
    value: null, value_state: "unknown", source_refs: [{
      source_file: "13_evidence_sources.csv",
      source_sha256: report.source_manifest["13_evidence_sources.csv"].sha256,
      source_row: null, scope: "register_coverage_only",
    }, ...["SA08_AI_Benefits_Realization_Usage_Ledger.csv", "SA09_AI_Tool_Usage_Feed.csv",
      "SA11_AI_KPI_Operational_Outcome_Feed.csv"].map((file) => ({
        source_file: file, source_sha256: report.source_manifest[file].sha256,
        source_row: null, scope: "claim_evidence_id_coverage_only",
      }))],
    approval_gap_count: report.evidence_rows_not_approved,
    unregistered_claim_evidence_id_count: report.unregistered_claim_evidence_ids.length,
    claim_evidence_missing_row_count: report.claim_evidence_missing_rows,
  }];
  return result;
}

function addProjectionRows(plan, report, views) {
  const { projectionVersion, buildVersion, sourceFields, sourceAssertions } = candidateConfig(report);
  const snapshotId = plan.snapshot.id;
  for (const page of PAGE_KEYS) {
    const table = PAGE_TABLE[page];
    const manifestId = uuid("projection_manifest", report.tenant_key, report.assessment_id, page, projectionVersion);
    plan.projectionManifests.push({
      id: manifestId, tenant_key: report.tenant_key, assessment_id: report.assessment_id,
      snapshot_id: snapshotId, projection_key: `tower_${page}`,
      projection_version: projectionVersion,
      rebuild_command: "npm run tower:registered-intake:stage",
      source_hash: report.input_fingerprint_sha256,
      projection_hash: hash(stable(views[page])), row_count: views[page].length,
      quality_state: "warning", admission_status: "not_applicable",
      admission_gate_results_json: [], gated_claim_count: views[page].filter((row) => row.value === null).length,
      proof_uri: "private:stage-receipt",
    });
    for (const row of views[page]) {
      const payload = { ...row, page_key: page, layer4_build_version: buildVersion,
        input_source_version: report.input_fingerprint_sha256 };
      let canonicalMeasure = null;
      let canonicalObjectId = null;
      let canonicalMeasureRefs = [];
      if (page === "cost_lens") {
        const contract = row.row_key.startsWith("contract:");
        const category = row.row_key.startsWith("spend:");
        canonicalObjectId = contract ? objectId(report, "vendor", row.row_key.slice(9)) :
          objectId(report, "metric", SPEND_METRIC_KEY);
        const metricKey = contract ? "vendor_annual_contract_spend_usd" :
          category ? "modeled_annual_spend_category_usd" : SPEND_METRIC_KEY;
        const matches = plan.measures.filter((measure) => measure.subject_object_id === canonicalObjectId &&
          measure.metric_key === metricKey && (!category ||
            measure.source_record_id === sourceRowId(report, sourceRefsFor(row)[0])));
        if (matches.length !== 1 || Number(matches[0].value_number) !== Number(row.value)) {
          throw new Error(`Canonical cost measure does not match ${row.row_key}`);
        }
        canonicalMeasure = matches[0];
        canonicalMeasureRefs = matches;
        if (sourceAssertions && category) {
          const sourceRecordId = sourceRowId(report, sourceRefsFor(row)[0]);
          const supplemental = plan.measures.filter((measure) => measure.subject_object_id === canonicalObjectId &&
            measure.source_record_id === sourceRecordId && measure.metric_key.startsWith("spend_source_"));
          if (supplemental.length !== 3) throw new Error(`Spend source fields lack canonical measures: ${row.row_key}`);
          canonicalMeasureRefs = [...matches, ...supplemental];
          payload.source_measure_refs = Object.fromEntries(supplemental.map((measure) => [measure.metric_key, measure.id]));
        }
        payload.canonical_measure_id = canonicalMeasure.id;
      } else if (sourceAssertions && page === "decision_lanes") {
        canonicalObjectId = objectId(report, "program", row.row_key);
        const assertion = plan.measures.find((measure) => measure.subject_object_id === canonicalObjectId &&
          measure.metric_key === "program_source_expected_value_usd");
        if (!assertion || assertion.value_number !== row.source_stated_expected_value_usd) {
          throw new Error(`Program source assertion has no canonical measure: ${row.row_key}`);
        }
        canonicalMeasureRefs = [assertion];
        payload.source_expected_value_measure_id = assertion.id;
      } else if (page === "value_proof" && row.row_key.startsWith("metric:")) {
        canonicalObjectId = objectId(report, "metric", row.row_key.slice(7));
        const measures = plan.measures.filter((measure) => measure.subject_object_id === canonicalObjectId &&
          measure.metric_key === "outcome_source_value");
        for (const [scenario, field] of [["baseline", "baseline"], ["target", "target"], ["actual", "observed"]]) {
          const match = measures.find((measure) => measure.scenario === scenario);
          if (row[field] && (!match || match.value_text !== row[field])) {
            throw new Error(`Canonical outcome measure does not match ${row.row_key}:${field}`);
          }
        }
        payload.canonical_measure_refs = Object.fromEntries(measures.map((measure) => [measure.scenario, measure.id]));
        canonicalMeasureRefs = measures;
        if (sourceAssertions && row.source_asserted_finance_value_usd !== null) {
          const assertion = plan.measures.find((measure) => measure.subject_object_id === canonicalObjectId &&
            measure.metric_key === "outcome_source_finance_assertion_usd");
          if (!assertion || assertion.value_number !== row.source_asserted_finance_value_usd) {
            throw new Error(`Outcome source assertion has no canonical measure: ${row.row_key}`);
          }
          canonicalMeasureRefs = [...measures, assertion];
          payload.source_finance_assertion_measure_id = assertion.id;
        }
        canonicalMeasure = measures.find((measure) => measure.scenario === "actual") || null;
      } else if (sourceAssertions && page === "value_proof" && row.source_asserted_finance_value_usd !== null) {
        canonicalObjectId = objectId(report, "ai_use_case", row.row_key);
        const assertion = plan.measures.find((measure) => measure.subject_object_id === canonicalObjectId &&
          measure.metric_key === "benefit_feed_source_finance_assertion_usd");
        if (!assertion || assertion.value_number !== row.source_asserted_finance_value_usd) {
          throw new Error(`Benefit source assertion has no canonical measure: ${row.row_key}`);
        }
        const outcomeRef = row.source_refs.find((ref) => ref.source_file.startsWith("SA11_"));
        const outcomeMeasures = plan.measures.filter((measure) => measure.subject_object_id === canonicalObjectId &&
          measure.source_record_id === sourceRowId(report, outcomeRef) &&
          measure.metric_key.startsWith("ai_outcome_feed_"));
        if (outcomeMeasures.length !== 4) throw new Error(`Outcome feed lacks canonical measures: ${row.row_key}`);
        const moneyMeasures = plan.measures.filter((measure) => measure.subject_object_id === canonicalObjectId &&
          ["benefit_feed_source_funded_spend_usd", "benefit_feed_source_actual_spend_ytd_usd",
            "usage_feed_source_promised_value_usd", "usage_feed_source_finance_assertion_usd"].includes(measure.metric_key));
        if (moneyMeasures.length !== 4) throw new Error(`Separate source money fields lack canonical measures: ${row.row_key}`);
        canonicalMeasureRefs = [assertion, ...outcomeMeasures, ...moneyMeasures];
        payload.outcome_feed_measure_refs = Object.fromEntries(outcomeMeasures.map((measure) => [measure.metric_key, measure.id]));
        payload.source_money_measure_refs = Object.fromEntries(moneyMeasures.map((measure) => [measure.metric_key, measure.id]));
        payload.source_finance_assertion_measure_id = assertion.id;
      } else if (sourceAssertions && page === "adoption_lens") {
        canonicalObjectId = objectId(report, "ai_use_case", row.row_key);
        const usageRef = sourceRefsFor(row)[0];
        const usageMeasures = plan.measures.filter((measure) => measure.subject_object_id === canonicalObjectId &&
          measure.source_record_id === sourceRowId(report, usageRef) &&
          ["usage_feed_power_users", "usage_feed_usage_events"].includes(measure.metric_key));
        if (usageMeasures.length !== 2) throw new Error(`Usage feed lacks supplemental measures: ${row.row_key}`);
        canonicalMeasureRefs = usageMeasures;
        payload.usage_feed_measure_refs = Object.fromEntries(usageMeasures.map((measure) => [measure.metric_key, measure.id]));
      }
      const refs = row.source_refs || [];
      const entryId = uuid("projection_entry", report.tenant_key, report.assessment_id, page, row.row_key, projectionVersion);
      const contentHash = hash(stable(payload));
      plan.projectionEntries.push({
        id: entryId, tenant_key: report.tenant_key, assessment_id: report.assessment_id,
        snapshot_id: snapshotId, projection_manifest_id: manifestId,
        projection_version: projectionVersion, surface_key: table,
        row_key: `${page}:${row.row_key}`, row_type: page === "command_center" ? "portfolio_summary" : "source_record",
        source_hash: contentHash, refs_content_hash: hash(stable(refs)),
        refs_cache_json: { source_refs: refs }, display_cache_json: payload,
      });
      for (const [index, measure] of canonicalMeasureRefs.entries()) {
        plan.projectionMeasureRefs.push({
          tenant_key: report.tenant_key, assessment_id: report.assessment_id,
          projection_entry_id: entryId, measure_id: measure.id,
          ref_role: measure.scenario === "actual" ? "primary" : "supporting",
          sort_order: index + 1, source_hash: hash(stable({ measure_id: measure.id, metric_key: measure.metric_key })),
        });
      }
      for (const [index, ref] of refs.entries()) {
        if (!Number.isInteger(ref.source_row)) continue;
        plan.projectionSourceRefs.push({
          tenant_key: report.tenant_key, assessment_id: report.assessment_id,
          projection_entry_id: entryId, source_record_id: sourceRowId(report, ref),
          ref_role: index === 0 ? "primary" : "supporting", sort_order: index + 1,
          source_hash: hash(stable(ref)),
        });
      }
      const common = {
        id: uuid(table, report.tenant_key, report.assessment_id, page, row.row_key),
        tenant_key: report.tenant_key, assessment_id: report.assessment_id,
        snapshot_id: snapshotId, projection_manifest_id: manifestId,
        projection_entry_id: entryId, projection_version: projectionVersion,
        row_key: row.row_key, source_refs_json: refs, display_payload_json: payload,
        source_hash: contentHash,
      };
      const primaryRef = sourceRefsFor(row)[0];
      if (table === "tower_command_center") {
        plan.commandRows.push({ ...common, page_key: page,
          row_type: page === "command_center" ? "portfolio_summary" : page === "decision_lanes" ? "program" : "recommended_action",
          primary_object_id: page === "decision_lanes" ? objectId(report, "program", row.row_key) : null,
          claim_id: page === "command_center" ? null : row.row_key,
          claim_gate_status: page === "command_center" ? "not_applicable" : "gated",
          claim_gate_reason_code: page === "command_center" ? null : "source_approval_needed",
          claim_gate_reason_detail: page === "command_center" ? null : row.plain_language,
          next_gate: page === "command_center" ? null : "owner_review",
          evidence_needed_json: page === "command_center" ? [] : ["Finance or source-owner approval"],
          funded_amount_usd: null, promised_value_usd: null,
          usage_supported_value_usd: null, finance_validated_value_usd: null,
          claimable_value_usd: null, blocked_value_usd: null,
          proof_maturity_score: null, risk_pressure_score: null,
          usage_strength_score: null, owner_role: sourceFields && page === "decision_lanes" ? row.business_sponsor_role : null, handoff_module: "Tower",
          value_state: "unknown", quality_state: "warning", metric_keys_json: [], gap_flags_json: ["unapproved_financial_basis"],
        });
      } else if (table === "tower_value_chain") {
        const isCost = page === "cost_lens";
        plan.valueRows.push({ ...common, page_key: page,
          row_type: isCost ? "cost_exposure" : "value_claim_gap",
          primary_object_id: canonicalObjectId || (row.row_key.startsWith("contract:") ? objectId(report, "vendor", row.row_key.slice(9)) :
            row.row_key.startsWith("metric:") ? objectId(report, "metric", row.row_key.slice(7)) :
            row.row_key === "modeled_annual_spend" ? objectId(report, "metric", SPEND_METRIC_KEY) :
            objectId(report, "ai_use_case", row.row_key)),
          claim_id: row.row_key, observation_key: `${page}:${row.row_key}`,
          metric_key: isCost ? row.row_key.startsWith("contract:") ? "vendor_annual_contract_spend_usd" :
            row.row_key.startsWith("spend:") ? "modeled_annual_spend_category_usd" : SPEND_METRIC_KEY : "unverified_value_claim",
          measure_id: canonicalMeasure?.id || null,
          source_record_id: row.row_key === "modeled_annual_spend" ? null :
            primaryRef ? sourceRowId(report, primaryRef) : null,
          review_event_id: null, evidence_state: "source_recorded",
          claim_gate_status: isCost ? "not_applicable" : "gated",
          claim_gate_reason_code: isCost ? null : "value_evidence_unapproved",
          claim_gate_reason_detail: isCost ? null : row.plain_language,
          next_gate: isCost ? null : "finance_and_evidence_review",
          evidence_needed_json: isCost ? [] : ["approved source evidence", "Finance attestation"],
          baseline_value: null, current_value: null, target_value: null,
          claimable_value_usd: null, blocked_value_usd: null,
          value_state: isCost ? "estimated" : "unknown", quality_state: "warning",
          gap_flags_json: isCost ? row.row_key.startsWith("spend:") ?
            ["planning_estimate", "category_business_id_missing", "do_not_add_to_aggregate"] :
            row.row_key.startsWith("contract:") ? ["planning_estimate", "spend_overlap_unknown"] :
              ["planning_estimate", "do_not_add_to_category_rows"] : ["value_not_claimable"],
        });
      } else if (table === "tower_evidence_queue") {
        plan.evidenceRows.push({ ...common, page_key: page, row_type: "evidence_gap",
          primary_object_id: page === "risk_lens" ? objectId(report, "risk", row.row_key) : null,
          claim_id: row.row_key, claim_gate_status: "blocked",
          claim_gate_reason_code: "evidence_not_approved",
          claim_gate_reason_detail: row.plain_language,
          evidence_needed_json: ["source-owner approval", "current evidence"],
          next_gate: "evidence_approval", owner_role: "source_owner",
          due_date: null, related_measure_id: null,
          source_record_id: primaryRef ? sourceRowId(report, primaryRef) : null,
          review_event_id: null, evidence_state: "not_approved",
          priority_score: null, gap_flags_json: ["evidence_not_approved", "priority_not_assessed"],
        });
      } else {
        const isAdoption = page === "adoption_lens";
        const claim = isAdoption ? report.canonical.ai_claims.find((item) => item.id === row.row_key) : null;
        plan.aiRows.push({ ...common,
          use_case_object_id: objectId(report, "ai_use_case", row.row_key),
          tool_object_id: null, function_object_id: null,
          use_case_name: row.title, tool_name: claim?.tool_name || (sourceFields ? "" : row.title),
          business_function: sourceFields && !isAdoption ? row.business_function : null, licensed_users: null,
          active_users: isAdoption ? row.value : null,
          usage_events: null, monthly_cost_usd: null, adoption_rate_percent: null,
          value_state: isAdoption ? "known" : "unknown", quality_state: "warning",
          review_state: "not_reviewed", metric_keys_json: isAdoption ? ["usage_feed_active_users"] : [],
          gap_flags_json: isAdoption && !report.raw_usage_validation.validates_claim_usage ?
            ["value_attribution_unapproved", "raw_detail_not_validated"] :
            sourceFields && !isAdoption ? ["value_attribution_unapproved", "tool_identity_not_declared"] :
              ["value_attribution_unapproved"],
        });
      }
    }
  }
}

export function buildPhysicalPlan(report) {
  if (report.contract_version !== "tower-registered-intake-candidate/v1" || report.quality_gate_status !== "pass") {
    throw new Error("Candidate integrity gate failed");
  }
  const plan = {
    sourceFiles: [], sourceRecords: [], objects: [], measures: [],
    metricDefinitions: [], projectionManifests: [], projectionEntries: [], projectionMeasureRefs: [],
    projectionSourceRefs: [], commandRows: [], valueRows: [], evidenceRows: [], aiRows: [],
    snapshot: {
      id: uuid("snapshot", report.tenant_key, report.assessment_id, candidateConfig(report).buildVersion),
      tenant_key: report.tenant_key, assessment_id: report.assessment_id,
      snapshot_key: "registered_intake_partial", snapshot_type: "projection_source",
      source_hash: report.input_fingerprint_sha256,
      context_hash: hash(stable(report.canonical)), created_by_job: candidateConfig(report).buildVersion,
      quality_state: "warning", proof_uri: "private:stage-receipt",
    },
  };
  const metricDefinitions = [
    [SPEND_METRIC_KEY, "Modeled annual IT spend", "One-source sum of annual category-spend rows; a planning estimate, not an approved budget.", "USD", "annual", "none"],
    ["modeled_annual_spend_category_usd", "Modeled annual spend category", "One source row within the modeled spend aggregate. Category business ID is unavailable; never add these rows to the aggregate or contract exposures.", "USD", "annual", "none"],
    ["program_planning_budget_usd", "Program planning budget", "Source-listed program budget with fiscal period and approval unverified.", "USD", "point_in_time", "none"],
    ["usage_feed_active_users", "AI usage feed active users", "Active users as reported by the usage source for its own denominator.", "users", "point_in_time", "none"],
    ["benefit_feed_planning_promise_usd", "AI benefit feed planning promise", "Source-specific planning promise; conflicting feeds prevent a claimable amount.", "USD", "point_in_time", "none"],
    ["vendor_annual_contract_spend_usd", "Vendor annual contract spend", "Contract exposure from source records; overlap with category spend is unknown.", "USD", "annual", "none"],
    ["unverified_value_claim", "Unverified value claim", "Placeholder metric key for value rows with no approved claimable amount.", "USD", "point_in_time", "none"],
    ["outcome_source_value", "Source-reported outcome value", "Raw baseline, target, or observed text with source unit and period unnormalized.", "source_text", "point_in_time", "none"],
    ...(candidateConfig(report).sourceAssertions ? [
      ...Object.values(FOUNDATION_MEASURES).flat().map(([sourceField, metric, unit]) => [
        metric, `Foundation source ${sourceField}`, "Source-recorded numeric field; no approval, overlap or aggregation inferred.",
        unit, "point_in_time", "none",
      ]),
      ["usage_feed_power_users", "Usage-feed power users", "Source-reported users for the source period; no dollar attribution.", "users", "point_in_time", "none"],
      ["usage_feed_usage_events", "Usage-feed events", "Source-reported activity events for the source period; no dollar attribution.", "events", "point_in_time", "none"],
      ["ai_outcome_feed_baseline", "AI outcome-feed baseline", "Source-specific operational KPI baseline; no cross-population join or benefit attribution.", "source_unit", "point_in_time", "none"],
      ["ai_outcome_feed_target", "AI outcome-feed target", "Source-specific operational KPI target; no cross-population join or benefit attribution.", "source_unit", "point_in_time", "none"],
      ["ai_outcome_feed_actual", "AI outcome-feed actual", "Source-specific operational KPI actual; no cross-population join or benefit attribution.", "source_unit", "point_in_time", "none"],
      ["ai_outcome_feed_source_finance_assertion_usd", "AI outcome-feed Finance assertion", "Source-specific dollar assertion with independent Finance and evidence approval unverified.", "USD", "point_in_time", "none"],
      ["spend_source_prior_year_actual_usd", "Source-reported prior-year spend", "One category source-row amount with fiscal period and Finance approval unverified.", "USD", "point_in_time", "none"],
      ["spend_source_forecast_next_year_usd", "Source-reported next-year forecast", "One category source-row forecast; not an approved budget.", "USD", "point_in_time", "none"],
      ["spend_source_savings_opportunity_usd", "Source-reported savings opportunity", "One category source-row planning opportunity; not verified or claimable savings.", "USD", "point_in_time", "none"],
      ["program_source_expected_value_usd", "Source-stated program expected value", "Planning source assertion with period, approval and realization unverified; never an approved or claimable amount.", "USD", "point_in_time", "none"],
      ["outcome_source_finance_assertion_usd", "Outcome-feed Finance assertion", "Exact source-stated amount only; independent Finance and evidence approval have not been verified for Tower.", "USD", "point_in_time", "none"],
      ["benefit_feed_source_finance_assertion_usd", "Benefit-feed Finance assertion", "Exact source-stated amount only; conflicting feeds and unapproved evidence prevent a claimable value.", "USD", "point_in_time", "none"],
      ["benefit_feed_source_funded_spend_usd", "Benefit-feed source funded spend", "Source-stated funded spend without an approved fiscal basis; not approved Tower funding.", "USD", "point_in_time", "none"],
      ["benefit_feed_source_actual_spend_ytd_usd", "Benefit-feed source YTD spend", "Source-stated spend for an unverified period; not realized value.", "USD", "point_in_time", "none"],
      ["usage_feed_source_promised_value_usd", "Usage-feed source promise", "Source-specific planning promise; do not add to benefit-feed promise.", "USD", "point_in_time", "none"],
      ["usage_feed_source_finance_assertion_usd", "Usage-feed Finance assertion", "Source-specific assertion that conflicts with other feeds; no approved claimable amount.", "USD", "point_in_time", "none"],
    ] : []),
  ];
  plan.metricDefinitions = metricDefinitions.map(([metric_key, metric_name, definition, unit, cadence, aggregation_rule]) => ({
    id: uuid("metric_definition", report.tenant_key, metric_key), tenant_key: report.tenant_key,
    metric_key, metric_name, definition, unit, directionality: "neutral", cadence, aggregation_rule,
  }));
  addSourceRows(plan, report);
  addCanonicalRows(plan, report);
  const views = physicalPreviewRows(report);
  addProjectionRows(plan, report, views);
  const viewCounts = Object.fromEntries(PAGE_KEYS.map((page) => [page, views[page].length]));
  if (Object.values(viewCounts).some((count) => count < 1)) throw new Error("A physical Tower view would be empty");
  const expectedObjects = 237 + (report.canonical.foundations.source_objects?.length || 0);
  if (plan.objects.length !== expectedObjects) throw new Error(`Canonical object count changed: ${plan.objects.length}`);
  return { plan, viewCounts };
}

function rowsForPage(plan, page) {
  const rows = PAGE_TABLE[page] === "tower_command_center" ? plan.commandRows :
    PAGE_TABLE[page] === "tower_value_chain" ? plan.valueRows :
      PAGE_TABLE[page] === "tower_evidence_queue" ? plan.evidenceRows : plan.aiRows;
  return rows.filter((row) => row.page_key === page || row.display_payload_json.page_key === page);
}

export function viewFingerprints(plan) {
  return Object.fromEntries(PAGE_KEYS.map((page) => [page, fingerprintRows(rowsForPage(plan, page))]));
}

function fingerprintRows(rows) {
  return hash(JSON.stringify(rows.map(({ row_key, source_hash }) => ({ row_key, source_hash }))
    .sort((left, right) => left.row_key.localeCompare(right.row_key) || left.source_hash.localeCompare(right.source_hash))));
}

export function validatePhysicalPlan(report, plan, viewCounts) {
  const errors = [];
  const expectedSourceRecords = 299 + (candidateConfig(report).sourceAssertions ?
    report.canonical.foundations.relationship_census.source_rows +
      report.canonical.foundations.no_declared_row_id.row_count : candidateConfig(report).sourceFields ?
      report.canonical.programs.reduce((count, program) => count + program.affected_functions.length, 0) : 0) +
    (report.canonical.foundations.source_objects?.length || 0);
  if (plan.sourceFiles.length !== 17 || plan.sourceRecords.length !== expectedSourceRecords) errors.push("source rows changed");
  if (plan.objects.length !== 237 + (report.canonical.foundations.source_objects?.length || 0)) errors.push("canonical object count changed");
  const fileById = new Map(plan.sourceFiles.map((row) => [row.id, row.file_name]));
  const userDetailRecordCount = plan.sourceRecords.filter((row) =>
    fileById.get(row.source_file_id)?.startsWith("extracts/") || row.record_type.includes("user_detail")).length;
  if (plan.sourceFiles.some((row) => row.file_name.startsWith("extracts/")) || userDetailRecordCount > 0) {
    errors.push("user-detail extract entered physical source rows");
  }
  const unapprovedEvidenceRecordCount = plan.sourceRecords.filter((row) => row.record_type === "13_evidence_sources" ||
      fileById.get(row.source_file_id) === "13_evidence_sources.csv").length;
  if (unapprovedEvidenceRecordCount > 0) {
    errors.push("unapproved evidence content entered source records");
  }
  if (plan.commandRows.some((row) => row.claimable_value_usd !== null || row.funded_amount_usd !== null) ||
      plan.valueRows.some((row) => row.claimable_value_usd !== null || row.blocked_value_usd !== null)) {
    errors.push("unknown financial amounts must be null");
  }
  for (const page of PAGE_KEYS) {
    if (rowsForPage(plan, page).length !== viewCounts[page] || viewCounts[page] < 1) errors.push(`${page} count mismatch`);
  }
  const objectIds = new Set(plan.objects.map((row) => row.id));
  const sourceIds = new Set(plan.sourceRecords.map((row) => row.id));
  const sourceRecordsById = new Map(plan.sourceRecords.map((row) => [row.id, row]));
  const measureIds = new Set(plan.measures.map((row) => row.id));
  const sourceFiles = new Map(plan.sourceFiles.map((row) => [row.file_name, row.file_hash]));
  if (candidateConfig(report).sourceAssertions) {
    const sourceRowsByFile = new Map();
    for (const record of plan.sourceRecords) {
      const file = fileById.get(record.source_file_id);
      const metadata = report.source_manifest[file];
      if (!metadata || sourceFiles.get(file) !== metadata.sha256) {
        errors.push(`source record file identity differs: ${record.id}`);
        continue;
      }
      if (!sourceRowsByFile.has(file)) {
        const bytes = fs.readFileSync(path.join(ROOT, metadata.source_path));
        if (hash(bytes) !== metadata.sha256) errors.push(`source file changed during validation: ${file}`);
        sourceRowsByFile.set(file, csvRows(bytes.toString("utf8")));
      }
      const raw = sourceRowsByFile.get(file)[record.row_number - 2];
      if (!raw || raw.tenant_key !== report.tenant_key || stable(raw) !== stable(record.payload_json)) {
        errors.push(`source record differs from exact intake: ${file}:${record.row_number}`);
      }
    }
    if (plan.sourceRecords.filter((row) => fileById.get(row.source_file_id) === "12_relationships.csv").length !==
        report.canonical.foundations.relationship_census.source_rows) {
      errors.push("raw relationship source-record coverage differs");
    }
    const maturityRows = plan.sourceRecords.filter((row) =>
      fileById.get(row.source_file_id) === "19_data_analytics_platform_maturity.csv");
    if (maturityRows.length !== report.canonical.foundations.no_declared_row_id.row_count ||
        maturityRows.some((row) => row.record_type !== "maturity_source_record_identity_unresolved" ||
          row.parse_notes !== "source_row_only_identity_unresolved_no_canonical_object") ||
        plan.objects.some((row) => row.source_record_id && maturityRows.some((source) => source.id === row.source_record_id))) {
      errors.push("raw maturity identity-unresolved coverage differs");
    }
  }
  if (objectIds.size !== plan.objects.length || sourceIds.size !== plan.sourceRecords.length ||
      measureIds.size !== plan.measures.length) errors.push("duplicate identity");
  for (const row of [...plan.commandRows, ...plan.valueRows, ...plan.evidenceRows, ...plan.aiRows]) {
    if (row.primary_object_id && !objectIds.has(row.primary_object_id)) errors.push(`missing object for ${row.row_key}`);
    if (row.use_case_object_id && !objectIds.has(row.use_case_object_id)) errors.push(`missing use case for ${row.row_key}`);
    for (const ref of row.source_refs_json) {
      if (ref.source_file.startsWith("extracts/")) errors.push(`user-detail extract cited by ${row.row_key}`);
      if (sourceFiles.get(ref.source_file) !== ref.source_sha256) errors.push(`source hash mismatch for ${row.row_key}`);
      if (Number.isInteger(ref.source_row) && !sourceIds.has(sourceRowId(report, ref))) errors.push(`missing source row for ${row.row_key}`);
      if (ref.source_file === "13_evidence_sources.csv" && ref.scope !== "register_coverage_only") errors.push("unapproved evidence cited");
    }
  }
  if (candidateConfig(report).sourceFields) {
    for (const row of rowsForPage(plan, "decision_lanes")) {
      const source = sourceRecordsById.get(sourceRowId(report, row.source_refs_json[0]));
      const raw = source?.payload_json;
      const display = row.display_payload_json;
      const fields = [
        ["business_sponsor_role", "business_sponsor"],
        ["technology_owner_role", "technology_owner"],
        ["source_program_status", "status"],
        ["source_program_phase", "phase"],
      ];
      if (!raw || fileById.get(source.source_file_id) !== "09_programs_initiatives.csv" ||
          raw.program_id !== row.row_key || row.owner_role !== (raw.business_sponsor || null) ||
          display.domain_name !== null ||
          fields.some(([target, input]) => display[target] !== (raw[input] || null))) {
        errors.push(`program source fields differ from intake: ${row.row_key}`);
      }
      const relationRefs = row.source_refs_json.slice(1);
      const affected = display.affected_functions;
      if (!Array.isArray(affected) || affected.length !== relationRefs.length ||
          relationRefs.some((ref, index) => {
            const relation = sourceRecordsById.get(sourceRowId(report, ref));
            const edge = relation?.payload_json;
            return !edge || fileById.get(relation.source_file_id) !== "12_relationships.csv" ||
              edge.from_object_type !== "program" || edge.from_object_id !== row.row_key ||
              edge.relationship_type !== "impacts" || edge.to_object_type !== "function" ||
              edge.to_object_id !== affected[index]?.function_id ||
              edge.to_object_name !== affected[index]?.function_name;
          }) ||
          display.affected_function_name !== (affected.length === 1 ? affected[0].function_name : null)) {
        errors.push(`affected function differs from declared relationship: ${row.row_key}`);
      }
    }
    for (const row of rowsForPage(plan, "ai_portfolio")) {
      const source = sourceRecordsById.get(sourceRowId(report, row.source_refs_json[0]));
      const raw = source?.payload_json;
      const display = row.display_payload_json;
      const fields = [
        ["business_function", "business_function"],
        ["business_segment_key", "business_segment_key"],
        ["source_case_status", "current_status"],
        ["business_sponsor_role", "sponsor_role"],
        ["operational_owner_role", "operational_owner_role"],
        ["expected_value_archetype", "expected_value_archetype"],
        ...(candidateConfig(report).sourceAssertions ? [
          ["source_value_hypothesis", "value_hypothesis"],
          ["source_approval_path", "approval_path"],
          ["source_risk_controls", "risk_controls"],
          ["source_required_systems", "required_systems"],
        ] : []),
      ];
      if (!raw || fileById.get(source.source_file_id) !== "10_ai_automation_use_cases.csv" ||
          raw.use_case_id !== row.row_key || row.business_function !== (raw.business_function || null) ||
          row.tool_object_id !== null || row.tool_name !== "" ||
          fields.some(([target, input]) => display[target] !== (raw[input] || null))) {
        errors.push(`AI case source fields differ from intake: ${row.row_key}`);
      }
    }
  }
  const evidencePageRows = rowsForPage(plan, "evidence");
  if (evidencePageRows.length !== 1 || evidencePageRows[0].source_refs_json[0]?.scope !== "register_coverage_only") {
    errors.push("evidence gap is not aggregate-only");
  }
  const measuresById = new Map(plan.measures.map((measure) => [measure.id, measure]));
  if (candidateConfig(report).sourceAssertions) {
    const foundation = report.canonical.foundations.source_objects || [];
    const objectsById = new Map(plan.objects.map((row) => [row.id, row]));
    if (foundation.length !== 1157) errors.push("Foundation declared-ID object coverage differs");
    for (const item of foundation) {
      const sourceId = sourceRowId(report, item.source_ref);
      const source = sourceRecordsById.get(sourceId);
      const object = objectsById.get(objectId(report, item.object_type, item.id));
      const raw = source?.payload_json;
      if (!source || fileById.get(source.source_file_id) !== item.source_ref.source_file ||
          !object || object.source_record_id !== sourceId || object.object_key !== item.id ||
          object.object_type !== item.object_type || object.display_name !== item.name ||
          Object.entries(item.source_fields).some(([field, value]) =>
            value !== (raw[field] || null) || object.attributes_json[field] !== value)) {
        errors.push(`Foundation object differs from exact source row: ${item.source_ref.source_file}:${item.source_ref.source_row}`);
      }
      for (const [sourceField, metric] of FOUNDATION_MEASURES[item.object_type] || []) {
        const expected = item.source_fields[sourceField] === null ? null : Number(item.source_fields[sourceField]);
        const matches = plan.measures.filter((row) => row.subject_object_id === object?.id &&
          row.metric_key === metric && row.source_record_id === sourceId);
        if (expected === null ? matches.length !== 0 : matches.length !== 1 ||
            matches[0].value_number !== expected || matches[0].attributes_json.source_assertion_only !== true ||
            matches[0].attributes_json.approved_fy_budget_usd !== null ||
            matches[0].attributes_json.claimable_value_usd !== null) {
          errors.push(`Foundation measure differs from exact source row: ${item.source_ref.source_file}:${item.source_ref.source_row}:${sourceField}`);
        }
      }
    }
  }
  const spendAggregate = plan.measures.find((measure) => measure.metric_key === SPEND_METRIC_KEY);
  const spendCategories = plan.measures.filter((measure) => measure.metric_key === "modeled_annual_spend_category_usd");
  const spendCategoryRows = rowsForPage(plan, "cost_lens").filter((row) => row.row_key.startsWith("spend:"));
  if (spendCategories.length !== report.canonical.modeled_annual_spend.source_refs.length ||
      spendCategoryRows.length !== spendCategories.length ||
      spendCategories.some((measure) => measure.subject_object_id !== spendAggregate?.subject_object_id ||
        measure.source_record_id === null || measure.attributes_json.category_business_id !== null ||
        measure.attributes_json.identity_basis !== "source_row_only" ||
        measure.attributes_json.do_not_add_to_aggregate !== true ||
        measure.attributes_json.do_not_add_to_contract_spend !== true) ||
      spendCategories.reduce((sum, measure) => sum + Number(measure.value_number), 0) !== Number(spendAggregate?.value_number)) {
    errors.push("spend categories do not reconcile to the single aggregate without double counting");
  }
  for (const measure of spendCategories) {
    const source = sourceRecordsById.get(measure.source_record_id);
    const recordedAmount = source?.payload_json?.annual_spend_usd;
    if (!source || fileById.get(source.source_file_id) !== "08_spend_value.csv" ||
        typeof recordedAmount !== "string" || recordedAmount.trim() === "" ||
        !Number.isFinite(Number(recordedAmount)) || Number(recordedAmount) !== Number(measure.value_number) ||
        source.payload_json.spend_category !== measure.attributes_json.category_label) {
      errors.push(`spend category measure differs from its source row: ${measure.id}`);
    }
  }
  for (const row of rowsForPage(plan, "cost_lens")) {
    const measure = measuresById.get(row.measure_id);
    if (!measure || measure.subject_object_id !== row.primary_object_id ||
        measure.metric_key !== row.metric_key || Number(measure.value_number) !== Number(row.display_payload_json.value) ||
        (row.row_key === "modeled_annual_spend" ?
          row.source_record_id !== null || measure.source_record_id !== null || row.source_refs_json.length !== 27 :
          measure.source_record_id !== row.source_record_id)) {
      errors.push(`cost amount is not tied to its canonical measure: ${row.row_key}`);
    }
    if (candidateConfig(report).sourceAssertions && row.row_key.startsWith("spend:")) {
      const raw = sourceRecordsById.get(row.source_record_id)?.payload_json;
      const fields = [
        ["source_prior_year_actual_usd", "prior_year_actual_usd", "spend_source_prior_year_actual_usd"],
        ["source_forecast_next_year_usd", "forecast_next_year_usd", "spend_source_forecast_next_year_usd"],
        ["source_savings_opportunity_usd", "savings_opportunity_usd", "spend_source_savings_opportunity_usd"],
      ];
      for (const [payloadField, sourceField, metric] of fields) {
        const amount = raw?.[sourceField]?.trim() ? Number(raw[sourceField]) : null;
        const supplemental = measuresById.get(row.display_payload_json.source_measure_refs?.[metric]);
        const linked = supplemental && plan.projectionMeasureRefs.some((ref) =>
          ref.projection_entry_id === row.projection_entry_id && ref.measure_id === supplemental.id);
        if (!raw || (amount !== null && (!Number.isFinite(amount) || amount < 0)) ||
            row.display_payload_json[payloadField] !== amount ||
            !supplemental || supplemental.value_number !== amount ||
            supplemental.source_record_id !== row.source_record_id ||
            supplemental.subject_object_id !== row.primary_object_id ||
            supplemental.attributes_json.source_assertion_only !== true || !linked ||
            row.display_payload_json.savings_claim_usd !== null) {
          errors.push(`spend source field differs from exact intake and canonical measure: ${row.row_key}:${sourceField}`);
        }
      }
    }
  }
  for (const row of rowsForPage(plan, "value_proof").filter((item) => item.row_key.startsWith("metric:"))) {
    const refs = row.display_payload_json.canonical_measure_refs || {};
    for (const [scenario, field] of [["baseline", "baseline"], ["target", "target"], ["actual", "observed"]]) {
      const sourceText = row.display_payload_json[field];
      const measure = measuresById.get(refs[scenario]);
      if (sourceText && (!measure || measure.subject_object_id !== row.primary_object_id ||
          measure.metric_key !== "outcome_source_value" || measure.scenario !== scenario ||
          measure.value_text !== sourceText || measure.source_record_id !== row.source_record_id)) {
        errors.push(`outcome text is not tied to its canonical measure: ${row.row_key}:${field}`);
      }
      const expectedPeriod = scenario === "baseline" ? row.display_payload_json.baseline_period :
        scenario === "actual" ? row.display_payload_json.observed_period : null;
      if (measure && (measure.attributes_json.source_period_text !== expectedPeriod ||
          measure.period_start !== null || measure.period_end !== null)) {
        errors.push(`outcome period was normalized or lost: ${row.row_key}:${field}`);
      }
    }
  }
  for (const row of rowsForPage(plan, "adoption_lens")) {
    const matching = plan.measures.filter((measure) => measure.subject_object_id === row.use_case_object_id &&
      measure.metric_key === "usage_feed_active_users");
    if (matching.length !== 1 || Number(matching[0].value_number) !== Number(row.active_users) ||
        row.source_refs_json.length !== 1 || !row.source_refs_json[0].source_file.startsWith("SA09_") ||
        matching[0].source_record_id !== sourceRowId(report, row.source_refs_json[0])) {
      errors.push(`adoption count is not tied to its usage source measure: ${row.row_key}`);
    }
  }
  if (candidateConfig(report).sourceAssertions) {
    for (const [page, file, fields] of [
      ["cost_lens", "07_vendors_contracts.csv", [["source_contract_name", "contract_name"],
        ["source_service_category", "service_category"], ["source_contract_owner_role", "contract_owner"],
        ["source_renewal_date", "renewal_date"], ["source_term_end", "term_end"],
        ["source_risk_rating", "risk_rating"]]],
      ["risk_lens", "11_risks_controls.csv", [["source_likelihood", "likelihood"],
        ["source_control_owner_role", "control_owner"], ["source_evidence_required", "evidence_required"],
        ["source_mitigation_plan", "mitigation_plan"], ["source_last_tested_date", "last_tested_date"],
        ["source_regulatory_driver", "regulatory_driver"]]],
    ]) {
      const rows = rowsForPage(plan, page).filter((row) => row.source_refs_json[0]?.source_file === file);
      if (rows.length !== report.source_manifest[file].row_count) errors.push(`source context row coverage differs: ${file}`);
      for (const row of rows) {
        const raw = sourceRecordsById.get(sourceRowId(report, row.source_refs_json[0]))?.payload_json;
        if (!raw || fields.some(([target, source]) => row.display_payload_json[target] !== (raw[source] || null))) {
          errors.push(`source context differs from exact intake: ${file}:${row.row_key}`);
        }
      }
    }
    const assertionFields = [
      { page: "decision_lanes", file: "09_programs_initiatives.csv", sourceId: "program_id",
        sourceAmount: "expected_value_usd", payloadAmount: "source_stated_expected_value_usd",
        metric: "program_source_expected_value_usd", measureId: "source_expected_value_measure_id",
        statuses: [["source_start_date", "start_date"], ["source_end_date", "end_date"],
          ["source_stage_gate", "stage_gate"], ["source_benefit_realization_start", "benefit_realization_start"],
          ["source_blocked_reason", "blocked_reason"], ["source_objective", "objective"],
          ["source_target_outcomes", "target_outcomes"]] },
      { page: "value_proof", file: "14_metrics_outcomes.csv", sourceId: "metric_id",
        sourceAmount: "finance_attested_value_usd", payloadAmount: "source_asserted_finance_value_usd",
        metric: "outcome_source_finance_assertion_usd", measureId: "source_finance_assertion_measure_id",
        statuses: [["source_value_claim_status", "value_claim_status"],
          ["source_claim_readiness", "claim_readiness"], ["source_attestation_owner", "attestation_owner"],
          ["source_evidence_basis", "evidence_basis"], ["source_definition", "definition"],
          ["source_metric_domain", "metric_domain"], ["source_business_function", "business_function"],
          ["source_owner_role", "owner"], ["source_data_source", "data_source"],
          ["source_calculation_basis", "calculation_basis"],
          ["source_unblock_target_period", "unblock_target_period"]] },
      { page: "value_proof", file: "SA08_AI_Benefits_Realization_Usage_Ledger.csv", sourceId: "ai_use_case_id",
        sourceAmount: "finance_validated_value_usd", payloadAmount: "source_asserted_finance_value_usd",
        metric: "benefit_feed_source_finance_assertion_usd", measureId: "source_finance_assertion_measure_id",
        statuses: [["source_finance_validation_status", "finance_validation_status"],
          ["source_value_claim_status", "value_claim_status"], ["source_tower_claim_allowed", "tower_claim_allowed"],
          ["source_realized_value_allowed", "realized_value_allowed"],
          ["source_owner_attestation_status", "owner_attestation_status"],
          ["source_evidence_id", "evidence_id"],
          ["source_evidence_freshness_status", "evidence_freshness_status"],
          ["source_duplicate_risk", "duplicate_risk"], ["source_additive_status", "additive_status"]] },
    ];
    for (const contract of assertionFields) {
      const rows = rowsForPage(plan, contract.page).filter((row) =>
        row.source_refs_json[0]?.source_file === contract.file);
      const expectedCount = report.source_manifest[contract.file].row_count;
      if (rows.length !== expectedCount) errors.push(`source assertion row coverage differs: ${contract.file}`);
      for (const row of rows) {
        const sourceId = sourceRowId(report, row.source_refs_json[0]);
        const raw = sourceRecordsById.get(sourceId)?.payload_json;
        const display = row.display_payload_json;
        const recorded = raw?.[contract.sourceAmount]?.trim();
        const expectedAmount = recorded ? Number(recorded) : null;
        const measure = measuresById.get(display[contract.measureId]);
        const hasRef = measure && plan.projectionMeasureRefs.some((ref) =>
          ref.projection_entry_id === row.projection_entry_id && ref.measure_id === measure.id);
        const badAmount = !raw || raw[contract.sourceId] !== row.row_key.replace(/^metric:/, "") ||
          (recorded && (!Number.isFinite(expectedAmount) || expectedAmount < 0)) ||
          display[contract.payloadAmount] !== expectedAmount ||
          (expectedAmount === null ? display[contract.measureId] !== undefined :
            !measure || measure.value_number !== expectedAmount || measure.metric_key !== contract.metric ||
            measure.subject_object_id !== row.primary_object_id || measure.source_record_id !== sourceId ||
            measure.attributes_json.source_assertion_only !== true || !hasRef) ||
          contract.statuses.some(([target, input]) => display[target] !== (raw[input] || null)) ||
          (contract.page === "decision_lanes" && display.source_pct_complete !== Number(raw.pct_complete)) ||
          !display.source_assertion_caveat ||
          (contract.page === "decision_lanes" ? display.approved_fy_budget_usd !== null :
            display.claimable_value_usd !== null) ||
          row.claimable_value_usd !== null || row.display_payload_json.value !== null;
        if (badAmount) errors.push(`source assertion differs from exact intake and canonical measure: ${contract.file}:${row.row_key}`);
      }
    }
    for (const row of rowsForPage(plan, "adoption_lens")) {
      const raw = sourceRecordsById.get(sourceRowId(report, row.source_refs_json[0]))?.payload_json;
      for (const [metric, payloadField, sourceField] of [
        ["usage_feed_power_users", "power_users", "power_users"],
        ["usage_feed_usage_events", "usage_events", "usage_events"],
      ]) {
        const measure = measuresById.get(row.display_payload_json.usage_feed_measure_refs?.[metric]);
        if (!raw || row.display_payload_json[payloadField] !== Number(raw[sourceField]) ||
            !measure || measure.value_number !== Number(raw[sourceField]) ||
            measure.source_record_id !== sourceRowId(report, row.source_refs_json[0]) ||
            measure.subject_object_id !== row.use_case_object_id ||
            !plan.projectionMeasureRefs.some((ref) => ref.projection_entry_id === row.projection_entry_id && ref.measure_id === measure.id)) {
          errors.push(`usage source field differs from exact intake and canonical measure: ${row.row_key}:${sourceField}`);
        }
      }
      if (raw && (row.display_payload_json.usage_period_start !== raw.usage_period_start ||
          row.display_payload_json.usage_period_end !== raw.usage_period_end ||
          row.display_payload_json.usage_source_system !== raw.source_system ||
          row.display_payload_json.value_attribution_usd !== null)) {
        errors.push(`usage source context differs from intake: ${row.row_key}`);
      }
    }
    for (const row of rowsForPage(plan, "value_proof").filter((item) => !item.row_key.startsWith("metric:"))) {
      for (const [metric, payloadField, sourceField, sourcePrefix] of [
        ["benefit_feed_source_funded_spend_usd", "benefit_feed_source_funded_spend_usd", "funded_spend_usd", "SA08_"],
        ["benefit_feed_source_actual_spend_ytd_usd", "benefit_feed_source_actual_spend_ytd_usd", "actual_spend_ytd_usd", "SA08_"],
        ["usage_feed_source_promised_value_usd", "usage_feed_source_promised_value_usd", "promised_value_usd", "SA09_"],
        ["usage_feed_source_finance_assertion_usd", "usage_feed_source_finance_assertion_usd", "finance_validated_value_usd", "SA09_"],
      ]) {
        const ref = row.source_refs_json.find((item) => item.source_file.startsWith(sourcePrefix));
        const sourceId = ref && sourceRowId(report, ref);
        const rawMoney = sourceRecordsById.get(sourceId)?.payload_json;
        const measure = measuresById.get(row.display_payload_json.source_money_measure_refs?.[metric]);
        if (!rawMoney || row.display_payload_json[payloadField] !== Number(rawMoney[sourceField]) ||
            !measure || measure.value_number !== Number(rawMoney[sourceField]) ||
            measure.source_record_id !== sourceId || measure.subject_object_id !== row.primary_object_id ||
            measure.attributes_json.source_assertion_only !== true ||
            measure.attributes_json.claimable_value_usd !== null ||
            !plan.projectionMeasureRefs.some((item) => item.projection_entry_id === row.projection_entry_id && item.measure_id === measure.id)) {
          errors.push(`separate money source field differs from exact intake and canonical measure: ${row.row_key}:${metric}`);
        }
      }
      const outcomeRef = row.source_refs_json.find((ref) => ref.source_file.startsWith("SA11_"));
      const raw = outcomeRef && sourceRecordsById.get(sourceRowId(report, outcomeRef))?.payload_json;
      for (const [metric, payloadField, sourceField] of [
        ["ai_outcome_feed_baseline", "outcome_feed_baseline", "baseline_value"],
        ["ai_outcome_feed_target", "outcome_feed_target", "target_value"],
        ["ai_outcome_feed_actual", "outcome_feed_actual", "actual_value"],
        ["ai_outcome_feed_source_finance_assertion_usd", "outcome_feed_source_finance_assertion_usd", "finance_validated_value_usd"],
      ]) {
        const measure = measuresById.get(row.display_payload_json.outcome_feed_measure_refs?.[metric]);
        if (!raw || raw.ai_use_case_id !== row.row_key ||
            row.display_payload_json[payloadField] !== Number(raw[sourceField]) ||
            !measure || measure.value_number !== Number(raw[sourceField]) ||
            measure.source_record_id !== sourceRowId(report, outcomeRef) ||
            measure.subject_object_id !== row.primary_object_id ||
            !plan.projectionMeasureRefs.some((ref) => ref.projection_entry_id === row.projection_entry_id && ref.measure_id === measure.id)) {
          errors.push(`outcome feed field differs from exact intake and canonical measure: ${row.row_key}:${sourceField}`);
        }
      }
      if (raw && (row.display_payload_json.outcome_feed_period_start !== raw.measurement_period_start ||
          row.display_payload_json.outcome_feed_period_end !== raw.measurement_period_end ||
          row.display_payload_json.outcome_feed_unit !== raw.metric_unit ||
          row.display_payload_json.outcome_feed_claim_status !== raw.value_claim_status ||
          row.display_payload_json.outcome_feed_claim_allowed !== raw.tower_claim_allowed ||
          row.display_payload_json.claimable_value_usd !== null)) {
        errors.push(`outcome feed context differs from intake: ${row.row_key}`);
      }
    }
    if (plan.measures.filter((row) => row.metric_key === "program_source_expected_value_usd").length !== 38 ||
        plan.measures.filter((row) => row.metric_key === "outcome_source_finance_assertion_usd").length !== 7 ||
        plan.measures.filter((row) => row.metric_key === "benefit_feed_source_finance_assertion_usd").length !== 18 ||
        plan.measures.filter((row) => row.metric_key.startsWith("spend_source_")).length !== 81 ||
        plan.measures.filter((row) => row.metric_key.startsWith("ai_outcome_feed_")).length !== 72 ||
        plan.measures.filter((row) => ["usage_feed_power_users", "usage_feed_usage_events"].includes(row.metric_key)).length !== 36 ||
        plan.measures.filter((row) => ["benefit_feed_source_funded_spend_usd", "benefit_feed_source_actual_spend_ytd_usd",
          "usage_feed_source_promised_value_usd", "usage_feed_source_finance_assertion_usd"].includes(row.metric_key)).length !== 72) {
      errors.push("source assertion measure coverage differs from declared source fields");
    }
  }
  return { status: errors.length === 0 ? "pass" : "fail", errors,
    checks: { source_files: plan.sourceFiles.length, source_records: plan.sourceRecords.length,
      canonical_objects: plan.objects.length, measures: plan.measures.length,
      foundation_objects: report.canonical.foundations.source_objects?.length || 0,
      physical_rows: Object.values(viewCounts).reduce((sum, count) => sum + count, 0),
      unapproved_evidence_records_loaded: unapprovedEvidenceRecordCount,
      user_detail_records_loaded: userDetailRecordCount,
      approved_fy_budget_known: false, claimable_value_known: false } };
}

export async function insertRows(client, table, rows) {
  for (const row of rows) {
    const columns = Object.keys(row);
    const values = columns.map((column) => column.endsWith("_json") && row[column] !== null &&
      typeof row[column] === "object" ? JSON.stringify(row[column]) : row[column]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    await client.query(`insert into ${table} (${columns.map((column) => `"${column}"`).join(",")}) values (${placeholders.join(",")})`, values);
  }
}

async function writePlan(report, plan) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --write");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, true)", [report.tenant_key]);
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [`tower-registry-stage:${report.tenant_key}`]);
    const declared = await client.query(
      "select assessment_id, projection_version from ecl_projection.tower_assessment_lifecycle where tenant_key = $1 and state = 'active' for update",
      [report.tenant_key],
    );
    if (declared.rows.length !== 1) throw new Error("Exact tenant has no single declared active lifecycle row");
    if (declared.rows[0].assessment_id === report.assessment_id) throw new Error("Candidate is already active");
    const selected = await client.query("select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key = $1", [report.tenant_key]);
    if (selected.rows.length !== 1 || selected.rows[0].assessment_id !== declared.rows[0].assessment_id ||
        Number(selected.rows[0].projection_version) !== Number(declared.rows[0].projection_version)) {
      throw new Error("Serving selector does not match declared active lifecycle row");
    }
    const existing = await client.query("select count(*)::int as rows from ecl_projection.projection_manifest where tenant_key = $1 and assessment_id = $2", [report.tenant_key, report.assessment_id]);
    if (existing.rows[0].rows !== 0) throw new Error("Candidate assessment already has projection rows; refusing overwrite");
    const nullable = await client.query(`
      select table_name, column_name, is_nullable, column_default from information_schema.columns
      where table_schema = 'ecl_projection' and (table_name, column_name) in (
        ('tower_value_chain', 'claimable_value_usd'),
        ('tower_value_chain', 'blocked_value_usd'),
        ('tower_evidence_queue', 'priority_score'))`);
    if (nullable.rows.length !== 3 || nullable.rows.some((row) => row.is_nullable !== "YES" || row.column_default !== null)) {
      throw new Error("Unknown-amount schema migration has not been applied and read back");
    }
    const unknownCheck = await client.query(`
      select 1 from pg_constraint where conrelid = 'ecl_projection.tower_value_chain'::regclass
        and conname = 'tower_value_chain_unknown_amounts_check'`);
    if (unknownCheck.rows.length !== 1) throw new Error("Unknown-amount schema check is absent");
    const existingMetrics = await client.query(
      "select metric_key, metric_name, definition, unit, directionality, cadence, aggregation_rule from ecl_context.metric_definition where tenant_key = $1 and metric_key = any($2::text[])",
      [report.tenant_key, plan.metricDefinitions.map((row) => row.metric_key)],
    );
    const byKey = new Map(existingMetrics.rows.map((row) => [row.metric_key, row]));
    const missingMetrics = plan.metricDefinitions.filter((row) => !byKey.has(row.metric_key));
    for (const row of plan.metricDefinitions) {
      const existingMetric = byKey.get(row.metric_key);
      if (!existingMetric) continue;
      for (const field of ["metric_name", "definition", "unit", "directionality", "cadence", "aggregation_rule"]) {
        if (existingMetric[field] !== row[field]) throw new Error(`Existing metric definition conflicts: ${row.metric_key}`);
      }
    }
    for (const [table, rows] of [
      ["ecl_source.source_file", plan.sourceFiles],
      ["ecl_source.source_record", plan.sourceRecords],
      ["ecl_context.snapshot", [plan.snapshot]],
      ["ecl_context.object", plan.objects],
      ["ecl_context.metric_definition", missingMetrics],
      ["ecl_context.measure", plan.measures],
      ["ecl_projection.projection_manifest", plan.projectionManifests],
      ["ecl_projection.projection_entry", plan.projectionEntries],
      ["ecl_projection.projection_entry_measure_ref", plan.projectionMeasureRefs],
      ["ecl_projection.projection_entry_source_record_ref", plan.projectionSourceRefs],
      ["ecl_projection.tower_command_center", plan.commandRows],
      ["ecl_projection.tower_value_chain", plan.valueRows],
      ["ecl_projection.tower_evidence_queue", plan.evidenceRows],
      ["ecl_projection.tower_ai_portfolio", plan.aiRows],
    ]) await insertRows(client, table, rows);
    const readback = { view_counts: {}, view_fingerprints: {},
      active_before: { assessment_id: declared.rows[0].assessment_id,
        projection_version: Number(declared.rows[0].projection_version) } };
    for (const page of PAGE_KEYS) {
      const pagePredicate = PAGE_TABLE[page] === "tower_ai_portfolio" ? "display_payload_json ->> 'page_key' = $3" : "page_key = $3";
      const rows = await client.query(
        `select row_key, source_hash from ecl_projection.${PAGE_TABLE[page]} where tenant_key = $1 and assessment_id = $2 and ${pagePredicate} order by row_key`,
        [report.tenant_key, report.assessment_id, page],
      );
      readback.view_counts[page] = rows.rows.length;
      readback.view_fingerprints[page] = fingerprintRows(rows.rows);
    }
    const expected = viewFingerprints(plan);
    for (const page of PAGE_KEYS) {
      if (readback.view_counts[page] !== rowsForPage(plan, page).length || readback.view_fingerprints[page] !== expected[page]) {
        throw new Error(`Transaction readback differs for ${page}`);
      }
    }
    const costParity = await client.query(`
      select count(*)::int as mismatches
      from ecl_projection.tower_value_chain p
      left join ecl_context.measure m
        on m.tenant_key = p.tenant_key and m.assessment_id = p.assessment_id and m.id = p.measure_id
      where p.tenant_key = $1 and p.assessment_id = $2 and p.page_key = 'cost_lens'
        and (m.id is null or m.subject_object_id is distinct from p.primary_object_id
          or m.metric_key is distinct from p.metric_key
          or m.value_number is distinct from (p.display_payload_json ->> 'value')::numeric
          or (p.row_key <> 'modeled_annual_spend' and m.source_record_id is distinct from p.source_record_id)
          or (p.row_key = 'modeled_annual_spend' and (m.source_record_id is not null or p.source_record_id is not null)))`,
      [report.tenant_key, report.assessment_id],
    );
    if (costParity.rows[0].mismatches !== 0) throw new Error("Transaction cost measure parity failed");
    const outcomeParity = await client.query(`
      select count(*)::int as mismatches
      from ecl_projection.tower_value_chain p
      join ecl_projection.projection_entry_measure_ref r
        on r.tenant_key = p.tenant_key and r.assessment_id = p.assessment_id
       and r.projection_entry_id = p.projection_entry_id
      left join ecl_context.measure m
        on m.tenant_key = p.tenant_key and m.assessment_id = p.assessment_id and m.id = r.measure_id
      where p.tenant_key = $1 and p.assessment_id = $2 and p.page_key = 'value_proof'
        and p.row_key like 'metric:%'
        and (m.id is null or m.subject_object_id is distinct from p.primary_object_id
          or m.metric_key <> 'outcome_source_value'
          or m.value_text is distinct from case m.scenario
            when 'baseline' then p.display_payload_json ->> 'baseline'
            when 'target' then p.display_payload_json ->> 'target'
            when 'actual' then p.display_payload_json ->> 'observed'
            else null end)`,
      [report.tenant_key, report.assessment_id],
    );
    if (outcomeParity.rows[0].mismatches !== 0) throw new Error("Transaction outcome measure parity failed");
    const measureRefCount = await client.query(`
      select count(*)::int as rows from ecl_projection.projection_entry_measure_ref
      where tenant_key = $1 and assessment_id = $2`, [report.tenant_key, report.assessment_id]);
    if (measureRefCount.rows[0].rows !== plan.projectionMeasureRefs.length) {
      throw new Error("Transaction measure reference count differs");
    }
    readback.cost_measure_mismatches = costParity.rows[0].mismatches;
    readback.outcome_measure_mismatches = outcomeParity.rows[0].mismatches;
    readback.projection_measure_ref_count = measureRefCount.rows[0].rows;
    await client.query("commit");
    return readback;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

async function reattestPlan(report, plan, expectedProofUri) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --reattest");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin read only");
    await client.query("select set_config('app.tenant_key', $1, true)", [report.tenant_key]);
    const active = await client.query(
      "select assessment_id, projection_version from ecl_projection.tower_assessment_lifecycle where tenant_key = $1 and state = 'active'",
      [report.tenant_key],
    );
    if (active.rows.length !== 1 || active.rows[0].assessment_id === report.assessment_id) {
      throw new Error("Candidate is active or exact tenant has no declared active assessment");
    }
    const sourceFiles = await client.query(
      "select file_name, file_hash from ecl_source.source_file where tenant_key = $1 and assessment_id = $2 order by file_name",
      [report.tenant_key, report.assessment_id],
    );
    const expectedFiles = plan.sourceFiles.map(({ file_name, file_hash }) => ({ file_name, file_hash }))
      .sort((left, right) => left.file_name.localeCompare(right.file_name));
    if (JSON.stringify(sourceFiles.rows) !== JSON.stringify(expectedFiles)) {
      throw new Error("Staged source-file identities differ from reviewed candidate");
    }
    const counts = await client.query(`
      select
        (select count(*)::int from ecl_source.source_record where tenant_key = $1 and assessment_id = $2) as source_records,
        (select count(*)::int from ecl_context.object where tenant_key = $1 and assessment_id = $2) as objects,
        (select count(*)::int from ecl_context.measure where tenant_key = $1 and assessment_id = $2) as measures,
        (select count(*)::int from ecl_projection.projection_entry_measure_ref where tenant_key = $1 and assessment_id = $2) as measure_refs,
        (select count(*)::int from ecl_projection.projection_manifest where tenant_key = $1 and assessment_id = $2) as manifests`,
      [report.tenant_key, report.assessment_id],
    );
    const count = counts.rows[0];
    if (count.source_records !== plan.sourceRecords.length || count.objects !== plan.objects.length ||
        count.measures !== plan.measures.length || count.measure_refs !== plan.projectionMeasureRefs.length ||
        count.manifests !== plan.projectionManifests.length) {
      throw new Error("Staged source/canonical/projection counts differ from reviewed candidate");
    }
    const excluded = await client.query(`
      select count(*)::int as rows from ecl_source.source_record r
      join ecl_source.source_file f on f.tenant_key = r.tenant_key and f.assessment_id = r.assessment_id and f.id = r.source_file_id
      where r.tenant_key = $1 and r.assessment_id = $2
        and (f.file_name = '13_evidence_sources.csv' or f.file_name like 'extracts/%')`,
      [report.tenant_key, report.assessment_id],
    );
    if (excluded.rows[0].rows !== 0) throw new Error("Excluded evidence or user-detail records appear in staged assessment");
    const stagedRecords = await client.query(
      "select id, payload_json from ecl_source.source_record where tenant_key = $1 and assessment_id = $2",
      [report.tenant_key, report.assessment_id],
    );
    const recordById = new Map(stagedRecords.rows.map((row) => [row.id, row.payload_json]));
    if (plan.sourceRecords.some((row) => stable(recordById.get(row.id)) !== stable(row.payload_json))) {
      throw new Error("Staged source-record content differs from registered intake");
    }
    const stagedObjects = await client.query(
      "select id, object_key, object_type, attributes_json from ecl_context.object where tenant_key = $1 and assessment_id = $2",
      [report.tenant_key, report.assessment_id],
    );
    const objectById = new Map(stagedObjects.rows.map((row) => [row.id, row]));
    if (plan.objects.some((row) => {
      const actual = objectById.get(row.id);
      return !actual || actual.object_key !== row.object_key || actual.object_type !== row.object_type ||
        stable(actual.attributes_json) !== stable(row.attributes_json);
    })) throw new Error("Staged canonical objects differ from reviewed identities/facts");
    const stagedMeasures = await client.query(
      "select id, subject_object_id, metric_key, value_number, value_text, scenario, source_record_id from ecl_context.measure where tenant_key = $1 and assessment_id = $2",
      [report.tenant_key, report.assessment_id],
    );
    const measureById = new Map(stagedMeasures.rows.map((row) => [row.id, row]));
    if (plan.measures.some((row) => {
      const actual = measureById.get(row.id);
      return !actual || actual.subject_object_id !== row.subject_object_id || actual.metric_key !== row.metric_key ||
        (actual.value_number === null ? null : Number(actual.value_number)) !== row.value_number ||
        actual.value_text !== row.value_text || actual.scenario !== row.scenario ||
        actual.source_record_id !== row.source_record_id;
    })) throw new Error("Staged canonical measures differ from reviewed values");
    const manifests = await client.query(`
      select projection_key, source_hash, row_count, proof_uri
      from ecl_projection.projection_manifest where tenant_key = $1 and assessment_id = $2 order by projection_key`,
      [report.tenant_key, report.assessment_id],
    );
    for (const expected of plan.projectionManifests) {
      const actual = manifests.rows.find((row) => row.projection_key === expected.projection_key);
      if (!actual || actual.source_hash !== report.input_fingerprint_sha256 ||
          actual.row_count !== expected.row_count || actual.proof_uri !== expectedProofUri) {
        throw new Error(`Staged manifest differs: ${expected.projection_key}`);
      }
    }
    const snapshot = await client.query(
      "select proof_uri from ecl_context.snapshot where tenant_key = $1 and assessment_id = $2 and id = $3",
      [report.tenant_key, report.assessment_id, plan.snapshot.id],
    );
    if (snapshot.rows.length !== 1 || snapshot.rows[0].proof_uri !== expectedProofUri) {
      throw new Error("Staged snapshot proof URI differs");
    }
    const readback = { view_counts: {}, view_fingerprints: {},
      active_before: { assessment_id: active.rows[0].assessment_id,
        projection_version: Number(active.rows[0].projection_version) } };
    const expectedFingerprints = viewFingerprints(plan);
    for (const page of PAGE_KEYS) {
      const pagePredicate = PAGE_TABLE[page] === "tower_ai_portfolio" ? "display_payload_json ->> 'page_key' = $3" : "page_key = $3";
      const rows = await client.query(
        `select row_key, source_hash, display_payload_json from ecl_projection.${PAGE_TABLE[page]} where tenant_key = $1 and assessment_id = $2 and ${pagePredicate}`,
        [report.tenant_key, report.assessment_id, page],
      );
      readback.view_counts[page] = rows.rows.length;
      readback.view_fingerprints[page] = fingerprintRows(rows.rows);
      if (rows.rows.some((row) => hash(stable(row.display_payload_json)) !== row.source_hash)) {
        throw new Error(`Staged physical payload hash differs: ${page}`);
      }
      if (rows.rows.length !== rowsForPage(plan, page).length ||
          readback.view_fingerprints[page] !== expectedFingerprints[page]) {
        throw new Error(`Staged physical view differs: ${page}`);
      }
    }
    await client.query("commit");
    return readback;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

async function verifyStagedInactive(report, expectedActive) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("select set_config('app.tenant_key', $1, false)", [report.tenant_key]);
    const declared = await client.query(
      "select assessment_id, projection_version from ecl_projection.tower_assessment_lifecycle where tenant_key = $1 and state = 'active'",
      [report.tenant_key],
    );
    const selected = await client.query(
      "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key = $1",
      [report.tenant_key],
    );
    const same = (row) => row?.assessment_id === expectedActive.assessment_id &&
      Number(row.projection_version) === expectedActive.projection_version;
    if (declared.rows.length !== 1 || selected.rows.length !== 1 ||
        !same(declared.rows[0]) || !same(selected.rows[0]) ||
        declared.rows[0].assessment_id === report.assessment_id) {
      throw new Error("Candidate stage changed or lost active assessment selection");
    }
    return { status: "candidate_inactive", active_assessment_id: expectedActive.assessment_id,
      active_projection_version: expectedActive.projection_version };
  } finally {
    await client.end();
  }
}

async function uploadProof(outDir, receipt, report) {
  const account = process.env.TOWER_RELOAD_PROOF_BLOB_ACCOUNT;
  const containerName = process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER;
  const prefix = process.env.TOWER_RELOAD_PROOF_BLOB_PREFIX || "operator-proof/tower-registered-partial";
  if (!/^[a-z0-9-]+$/.test(account) || !/^[a-z0-9-]+$/.test(containerName) ||
      !/^[a-z0-9/_-]+$/.test(prefix) || !/^[a-zA-Z0-9_-]+$/.test(receipt.job_run_id)) {
    throw new Error("Unsafe or missing private Blob proof destination");
  }
  const blobRoot = `${prefix}/${report.assessment_id}/${receipt.job_run_id}`;
  const baseUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobRoot}`;
  receipt.proof_bundle_uri = `${baseUrl}/tower-stage-proof.zip`;
  receipt.validation_output_uri = `${baseUrl}/stage-validation.json`;
  receipt.quality_gate_output_uri = `${baseUrl}/stage-quality-gate.json`;
  const files = ["candidate.json", "stage-preflight.json", "stage-validation.json", "stage-quality-gate.json"];
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const name of files) zip.file(name, fs.readFileSync(path.join(outDir, name)));
  zip.file("stage-receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
  zip.file("registered-intake-identity-contract.json", fs.readFileSync(IDENTITY_PATH));
  const zipBytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const { DefaultAzureCredential } = await import("@azure/identity");
  const client = process.env.AZURE_STORAGE_CONNECTION_STRING
    ? BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
    : new BlobServiceClient(`https://${account}.blob.core.windows.net`,
      new DefaultAzureCredential(process.env.AZURE_CLIENT_ID ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : undefined));
  const container = client.getContainerClient(containerName);
  for (const name of ["stage-validation.json", "stage-quality-gate.json"]) {
    await container.getBlockBlobClient(`${blobRoot}/${name}`).uploadData(fs.readFileSync(path.join(outDir, name)), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
  }
  const blob = container.getBlockBlobClient(`${blobRoot}/tower-stage-proof.zip`);
  await blob.uploadData(zipBytes, { blobHTTPHeaders: { blobContentType: "application/zip" } });
  const stored = await blob.downloadToBuffer();
  if (hash(stored) !== hash(zipBytes)) throw new Error("Private Blob proof readback hash differs");
  fs.writeFileSync(path.join(outDir, "proof-upload.json"), `${JSON.stringify({
    proof_bundle_uri: receipt.proof_bundle_uri, proof_bundle_sha256: hash(zipBytes),
    blob_readback_sha256: hash(stored), status: "verified",
  }, null, 2)}\n`);
  return { proof_bundle_uri: receipt.proof_bundle_uri, proof_bundle_sha256: hash(zipBytes) };
}

function proofBundleUri(report, jobRunId) {
  const account = process.env.TOWER_RELOAD_PROOF_BLOB_ACCOUNT;
  const container = process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER;
  const prefix = process.env.TOWER_RELOAD_PROOF_BLOB_PREFIX || "operator-proof/tower-registered-partial";
  if (!/^[a-z0-9-]+$/.test(account || "") || !/^[a-z0-9-]+$/.test(container || "") ||
      !/^[a-z0-9/_-]+$/.test(prefix) || !/^[a-zA-Z0-9_-]+$/.test(jobRunId || "")) {
    throw new Error("Unsafe or missing private Blob proof destination");
  }
  return `https://${account}.blob.core.windows.net/${container}/${prefix}/${report.assessment_id}/${jobRunId}/tower-stage-proof.zip`;
}

async function writeProgress(report, jobRunId, outDir, status, detail = {}) {
  const proofUri = proofBundleUri(report, jobRunId);
  const progressUri = proofUri.replace(/tower-stage-proof\.zip$/, "progress.json");
  const payload = {
    contract_version: "tower-physical-stage-progress/v1", status,
    recorded_at: new Date().toISOString(), tenant_key: report.tenant_key,
    assessment_id: report.assessment_id, job_run_id: jobRunId,
    build_version: candidateConfig(report).buildVersion, input_source_version: report.input_fingerprint_sha256,
    idempotency_key: `${report.assessment_id}:${report.input_fingerprint_sha256}`,
    ...detail,
  };
  const bytes = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "progress.json"), bytes);
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const { DefaultAzureCredential } = await import("@azure/identity");
  const account = process.env.TOWER_RELOAD_PROOF_BLOB_ACCOUNT;
  const service = process.env.AZURE_STORAGE_CONNECTION_STRING
    ? BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
    : new BlobServiceClient(`https://${account}.blob.core.windows.net`,
      new DefaultAzureCredential(process.env.AZURE_CLIENT_ID ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : undefined));
  const blob = service.getContainerClient(process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER)
    .getBlockBlobClient(new URL(progressUri).pathname.split(`/${process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER}/`)[1]);
  await blob.uploadData(bytes, { blobHTTPHeaders: { blobContentType: "application/json" } });
  const stored = await blob.downloadToBuffer();
  if (hash(stored) !== hash(bytes)) throw new Error("Private progress Blob readback hash differs");
  const checkpoint = service.getContainerClient(process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER)
    .getBlockBlobClient(new URL(progressUri.replace(/progress\.json$/, `progress-${status}.json`))
      .pathname.split(`/${process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER}/`)[1]);
  await checkpoint.uploadData(bytes, { blobHTTPHeaders: { blobContentType: "application/json" } });
  return progressUri;
}

async function main() {
  const options = args();
  if (!options.tenantKey || !options.outDir) throw new Error("--tenant-key and --out-dir are required");
  if (options.write && options.reattest) throw new Error("--write and --reattest are mutually exclusive");
  fs.mkdirSync(options.outDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const report = buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey: options.tenantKey,
    variant: options.candidateVariant });
  const config = candidateConfig(report);
  const candidateBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  const candidateHash = hash(candidateBytes);
  fs.writeFileSync(path.join(options.outDir, "candidate.json"), candidateBytes);
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const quality = validatePhysicalPlan(report, plan, viewCounts);
  const identityContractHash = hash(fs.readFileSync(IDENTITY_PATH));
  const fingerprints = viewFingerprints(plan);
  const manifestFiles = fs.readdirSync(path.dirname(config.manifestPath)).filter((file) => file.endsWith(".json"));
  const manifestEntries = manifestFiles.map((file) => ({
    file: path.join(path.dirname(config.manifestPath), file),
    raw: JSON.parse(fs.readFileSync(path.join(path.dirname(config.manifestPath), file), "utf8")),
  }));
  const manifest = manifestEntries.find((entry) => entry.file === config.manifestPath)?.raw;
  if (!manifest && !config.sourceFields) throw new Error("Dataset manifest is absent");
  if (manifest && manifest.dataset_id !== config.datasetId) throw new Error("Dataset manifest ID mismatch");
  const binding = {
    dataset_id: config.datasetId,
    tenant_key: report.tenant_key,
    assessment_id: report.assessment_id,
    source_set_hash: report.input_fingerprint_sha256,
    object_count: plan.objects.length,
    ingestion_method: "operator_aca_job",
  };
  const { resolveLoadApproval, validateManifest, validateManifestRegistry } = await import("../../src/lib/governance/dataset-manifest.ts");
  if (manifest) {
    const validation = validateManifest(manifest);
    if (!validation.ok) throw new Error(`Dataset manifest is invalid: ${validation.errors.join("; ")}`);
  }
  const registryErrors = validateManifestRegistry(manifestEntries, (relative) => fs.existsSync(path.join(ROOT, relative)));
  if (registryErrors.length) throw new Error(`Dataset manifest registry is invalid: ${registryErrors.join("; ")}`);
  const decision = manifest ? resolveLoadApproval(manifestEntries.map((entry) => entry.raw), binding) :
    { approved: false, reasons: ["new dataset manifest and named review are required before loading"] };
  const releaseRecordMatch = !decision.approved || decision.approval.release_record === config.releaseRecord;
  const preflight = {
    contract_version: "tower-physical-stage-preflight/v1",
    tenant_key: report.tenant_key, assessment_id: report.assessment_id,
    dataset_id: config.datasetId, input_fingerprint_sha256: report.input_fingerprint_sha256,
    candidate_sha256: candidateHash, object_count: plan.objects.length,
    identity_contract_sha256: identityContractHash,
    ingestion_method: "operator_aca_job", build_version: config.buildVersion,
    projection_version: config.projectionVersion, view_counts: viewCounts, view_fingerprints: fingerprints,
    load_approval_status: decision.approved && releaseRecordMatch ? "approved" : "missing_or_mismatched",
    load_approval_reasons: decision.approved ? releaseRecordMatch ? [] : ["approval release record does not match this build"] : decision.reasons,
    physical_quality_gate_status: quality.status,
    stage_status: "not_written",
  };
  fs.writeFileSync(path.join(options.outDir, "stage-preflight.json"), `${JSON.stringify(preflight, null, 2)}\n`);
  fs.writeFileSync(path.join(options.outDir, "stage-quality-gate.json"), `${JSON.stringify(quality, null, 2)}\n`);
  const validationOutput = {
    contract_version: "tower-physical-stage-validation/v1", status: quality.status,
    tenant_key: report.tenant_key, assessment_id: report.assessment_id,
    input_fingerprint_sha256: report.input_fingerprint_sha256,
    candidate_sha256: candidateHash, identity_contract_sha256: identityContractHash,
    view_counts: viewCounts, view_fingerprints: fingerprints,
    source_file_count: plan.sourceFiles.length, source_record_count: plan.sourceRecords.length,
    canonical_object_count: plan.objects.length, measure_count: plan.measures.length,
    materialized: false,
  };
  fs.writeFileSync(path.join(options.outDir, "stage-validation.json"), `${JSON.stringify(validationOutput, null, 2)}\n`);
  if (quality.status !== "pass") throw new Error(`Physical quality gate failed: ${quality.errors.join("; ")}`);
  if (!options.write && !options.reattest) {
    console.log(JSON.stringify({ stage_status: "dry_run", view_counts: viewCounts, object_count: plan.objects.length, load_approval_status: preflight.load_approval_status }));
    return;
  }
  if (!decision.approved || !releaseRecordMatch) throw new Error(`Refusing stage/proof: ${preflight.load_approval_reasons.join("; ")}`);
  if (!options.jobRunId) throw new Error("--job-run-id is required for stage or re-attestation");
  const stageJobRunId = options.reattest ? options.stageJobRunId : options.jobRunId;
  if (!stageJobRunId) throw new Error("--stage-job-run-id is required for re-attestation");
  const job = {
    job_name: process.env.TOWER_RELOAD_JOB_NAME,
    operator_identity: process.env.TOWER_RELOAD_OPERATOR_IDENTITY,
    git_sha: process.env.TOWER_RELOAD_GIT_SHA,
    image_digest: process.env.TOWER_RELOAD_IMAGE_DIGEST,
    retry_count: Number(process.env.TOWER_RELOAD_RETRY_COUNT),
    timeout_seconds: Number(process.env.TOWER_RELOAD_TIMEOUT_SECONDS),
    input_source_version: process.env.TOWER_RELOAD_INPUT_SOURCE_VERSION,
    declared_build_version: process.env.TOWER_RELOAD_BUILD_VERSION,
    declared_idempotency_key: process.env.TOWER_RELOAD_IDEMPOTENCY_KEY,
  };
  if (process.env.TOWER_RELOAD_EXECUTION_LANE !== "aca_operator_job" ||
      !job.job_name || !job.operator_identity || !/^[0-9a-f]{40}$/.test(job.git_sha || "") ||
      !/^sha256:[0-9a-f]{64}$/.test(job.image_digest || "") ||
      !Number.isInteger(job.retry_count) || job.retry_count < 0 ||
      !Number.isInteger(job.timeout_seconds) || job.timeout_seconds < 1 ||
      job.input_source_version !== report.input_fingerprint_sha256 ||
      job.declared_build_version !== config.buildVersion ||
      job.declared_idempotency_key !== `${report.assessment_id}:${report.input_fingerprint_sha256}` ||
      !process.env.TOWER_RELOAD_PROOF_BLOB_ACCOUNT || !process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER) {
    throw new Error("ACA job identity, build/input version, idempotency key, digest, retry/timeout, and private Blob proof destination are required");
  }
  const proofUri = proofBundleUri(report, stageJobRunId);
  plan.snapshot.proof_uri = proofUri;
  for (const row of plan.projectionManifests) row.proof_uri = proofUri;
  const progressUri = await writeProgress(report, stageJobRunId, options.outDir,
    options.reattest ? "reattest_running" : "running",
    { stage_rows_committed: options.reattest, reattest_job_run_id: options.reattest ? options.jobRunId : null });
  const readback = options.reattest ? await reattestPlan(report, plan, proofUri) : await writePlan(report, plan);
  let lifecycleReadback;
  try {
    lifecycleReadback = await verifyStagedInactive(report, readback.active_before);
    await writeProgress(report, stageJobRunId, options.outDir, options.reattest ? "reattested" : "committed",
      { stage_rows_committed: true, lifecycle_readback: lifecycleReadback,
        view_fingerprints: fingerprints, reattest_job_run_id: options.reattest ? options.jobRunId : null });
  } catch (error) {
    fs.writeFileSync(path.join(options.outDir, "stage-failure.json"), `${JSON.stringify({
      stage_rows_committed: true, stage_receipt_issued: false,
      post_commit_error: String(error),
      next_step: "Keep assessment inactive and reconcile by independent direct readback before retry",
    }, null, 2)}\n`);
    throw error;
  }
  validationOutput.materialized = true;
  validationOutput.transaction_readback = readback;
  validationOutput.re_attestation = options.reattest;
  validationOutput.lifecycle_readback = lifecycleReadback;
  fs.writeFileSync(path.join(options.outDir, "stage-validation.json"), `${JSON.stringify(validationOutput, null, 2)}\n`);
  const receipt = {
    contract_version: "tower-physical-stage-receipt/v1",
    tenant_key: report.tenant_key, assessment_id: report.assessment_id,
    dataset_id: config.datasetId, input_fingerprint_sha256: report.input_fingerprint_sha256,
    candidate_sha256: candidateHash, identity_contract_sha256: identityContractHash,
    object_count: plan.objects.length,
    source_file_count: plan.sourceFiles.length, source_record_count: plan.sourceRecords.length,
    ingestion_method: "operator_aca_job", projection_version: config.projectionVersion,
    quality_gate_status: "pass", runtime_eligible: true,
    stage_status: "staged_pending_independent_readback", job_run_id: stageJobRunId,
    re_attestation_job_run_id: options.reattest ? options.jobRunId : null,
    build_version: config.buildVersion, idempotency_key: `${report.assessment_id}:${report.input_fingerprint_sha256}`,
    view_counts: viewCounts, view_fingerprints: fingerprints,
    release_record: config.releaseRecord, started_at: startedAt, finished_at: new Date().toISOString(),
    status: "succeeded", retry_count: job.retry_count, timeout_seconds: job.timeout_seconds,
    job_name: job.job_name, operator_identity: job.operator_identity,
    git_sha: job.git_sha, image_digest: job.image_digest,
    progress_output_uri: progressUri,
    validation_output: "stage-validation.json", quality_gate_output: "stage-quality-gate.json",
  };
  try {
    const proof = await uploadProof(options.outDir, receipt, report);
    await writeProgress(report, stageJobRunId, options.outDir, "proof_verified",
      { stage_rows_committed: true, lifecycle_readback: lifecycleReadback,
        proof_bundle_uri: proof.proof_bundle_uri, proof_bundle_sha256: proof.proof_bundle_sha256,
        reattest_job_run_id: options.reattest ? options.jobRunId : null });
    console.log(JSON.stringify({ proof_bundle_uri: proof.proof_bundle_uri,
      proof_bundle_sha256: proof.proof_bundle_sha256, progress_output_uri: progressUri }));
  } catch (error) {
    let inactiveCheck;
    try { inactiveCheck = await verifyStagedInactive(report, readback.active_before); }
    catch (checkError) { inactiveCheck = { status: "unverified", reason: String(checkError) }; }
    fs.writeFileSync(path.join(options.outDir, "stage-failure.json"), `${JSON.stringify({
      stage_rows_committed: true, stage_receipt_issued: false,
      proof_upload_error: String(error), lifecycle_readback: inactiveCheck,
      next_step: "Keep assessment inactive and reconcile by independent direct readback before retry",
    }, null, 2)}\n`);
    try { await writeProgress(report, stageJobRunId, options.outDir, "failed_after_commit",
      { stage_rows_committed: true, lifecycle_readback: inactiveCheck, error: String(error) }); }
    catch { /* The local stage-failure proof preserves the error if Blob is unavailable. */ }
    throw error;
  }
  fs.writeFileSync(path.join(options.outDir, "stage-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ stage_status: receipt.stage_status, view_counts: viewCounts, receipt: path.join(options.outDir, "stage-receipt.json") }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}

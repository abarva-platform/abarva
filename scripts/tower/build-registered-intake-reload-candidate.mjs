#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = "datasets/tenant-inputs/tenant-input-registry.json";
const INPUT_FILES = [
  "02_org_ownership.csv",
  "04_applications_systems.csv",
  "05_data_assets_integrations.csv",
  "06_infrastructure_platforms.csv",
  "07_vendors_contracts.csv",
  "08_spend_value.csv",
  "09_programs_initiatives.csv",
  "10_ai_automation_use_cases.csv",
  "11_risks_controls.csv",
  "12_relationships.csv",
  "13_evidence_sources.csv",
  "14_metrics_outcomes.csv",
  "18_operational_process_evidence.csv",
  "19_data_analytics_platform_maturity.csv",
  "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
  "SA09_AI_Tool_Usage_Feed.csv",
  "SA11_AI_KPI_Operational_Outcome_Feed.csv",
];
const PAGES = [
  "command_center", "decision_lanes", "recommended_actions", "value_proof",
  "cost_lens", "evidence", "risk_lens", "ai_portfolio", "adoption_lens",
];
const SOURCE_FIELDS_VARIANT = "source-fields-v1";
const SOURCE_ASSERTIONS_VARIANT = "source-assertions-v1";
const FOUNDATION_OBJECT_CONTRACT = [
  ["02_org_ownership.csv", "organization", "org_unit_id", "org_unit",
    ["parent_org_unit", "leader_name_or_role", "decision_rights", "owned_functions", "location_scope", "budget_authority_usd"]],
  ["04_applications_systems.csv", "application", "system_id", "system_name",
    ["system_type", "business_function", "lifecycle_state", "criticality", "business_owner", "technology_owner", "annual_cost_usd", "annual_cost_basis"]],
  ["05_data_assets_integrations.csv", "data_flow", "data_asset_id", "data_asset_name",
    ["data_domain", "source_system", "target_system", "integration_type", "quality_status", "regulated_data_flag"]],
  ["06_infrastructure_platforms.csv", "infrastructure", "infrastructure_id", "platform_name",
    ["platform_type", "hosting_model", "lifecycle_state", "criticality", "operational_owner", "capacity_or_scale", "annual_cost_usd", "utilization_pct"]],
  ["18_operational_process_evidence.csv", "process", "process_id", "process_name",
    ["business_function", "process_owner", "systems_used", "volume_metric", "control_points", "automation_candidate",
      "transaction_volume", "error_rate_pct", "rework_pct", "automation_pct", "cost_per_transaction"]],
];

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function csvRows(text) {
  const records = [];
  let cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { cells.push(cell); cell = ""; }
    else if (ch === "\n") { cells.push(cell); records.push(cells); cells = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  if (cell || cells.length) { cells.push(cell); records.push(cells); }
  const [header, ...body] = records;
  if (!header?.length) return [];
  return body.filter((row) => row.some((value) => value.trim())).map((row, index) => {
    if (row.length !== header.length) throw new Error(`CSV row ${index + 2} has ${row.length} columns; expected ${header.length}`);
    return Object.fromEntries(header.map((key, column) => [key, row[column]]));
  });
}

function amount(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function sumKnown(rows, key) {
  const values = rows.map((row) => amount(row[key]));
  return values.every((value) => value !== null)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;
}

function reportedRateBasis(row, denominatorField) {
  const rate = amount(row?.usage_rate_pct);
  const active = amount(row?.active_users);
  const denominator = amount(row?.[denominatorField]);
  return rate !== null && active !== null && denominator > 0 &&
    Math.abs(rate - (active / denominator) * 100) < 0.15
    ? `active_over_${denominatorField}` : "not_reconciled";
}

export function isDeclaredProgramLink(aiProgramId, programIds) {
  const id = aiProgramId?.trim();
  return Boolean(id) && programIds.has(id);
}

export function assessRawUsageValidation(rawRows, usage) {
  const usageIds = new Set(usage.map((row) => row.ai_use_case_id));
  const declaredUseCaseJoin = rawRows.length > 0 && rawRows.every((row) =>
    row.ai_use_case_id && usageIds.has(row.ai_use_case_id));
  const declaredSourceSystemJoin = rawRows.length > 0 && rawRows.every((row) =>
    row.source_system && usage.some((item) => item.ai_use_case_id === row.ai_use_case_id &&
      item.source_system === row.source_system));
  const compatiblePeriod = rawRows.length > 0 && rawRows.every((row) =>
    row.usage_period_start && row.usage_period_end && usage.some((item) =>
      item.ai_use_case_id === row.ai_use_case_id && item.usage_period_start === row.usage_period_start &&
      item.usage_period_end === row.usage_period_end));
  const structurallyLinkable = declaredUseCaseJoin && declaredSourceSystemJoin && compatiblePeriod;
  return {
    detail_available: true, detail_row_count: rawRows.length,
    declared_use_case_join: declaredUseCaseJoin,
    declared_source_system_join: declaredSourceSystemJoin,
    compatible_period: compatiblePeriod,
    structurally_linkable: structurallyLinkable,
    aggregate_user_count_reconciled: false,
    validates_claim_usage: false,
    detail_report_periods: [...new Set(rawRows.map((row) => row.reportPeriod).filter(Boolean))].sort(),
    detail_refresh_dates: [...new Set(rawRows.map((row) => row.reportRefreshDate).filter(Boolean))].sort(),
  };
}

function modeledSegmentTotal(rows) {
  const byOwner = new Map();
  for (const row of rows) {
    const match = row.calculation_basis?.match(/=\s*\$([\d.]+)\s*([MB])\s+segment technology budget/i);
    if (!match || !row.cost_center_or_owner) return null;
    const amountUsd = Number(match[1]) * (match[2].toUpperCase() === "B" ? 1_000_000_000 : 1_000_000);
    const old = byOwner.get(row.cost_center_or_owner);
    if (old !== undefined && old !== amountUsd) return null;
    byOwner.set(row.cost_center_or_owner, amountUsd);
  }
  return byOwner.size ? [...byOwner.values()].reduce((sum, value) => sum + value, 0) : null;
}

function check(id, passed, detail) {
  return { id, status: passed ? "pass" : "fail", detail };
}

function coverage(id, present, detail) {
  return { id, status: present ? "covered" : "gap", detail };
}

function sourceRef(file, row, sourceManifest) {
  return {
    source_file: file,
    source_row: row.__source_row,
    source_record_id: row.source_record_id || row.use_case_id || row.program_id || row.risk_id || row.metric_id || row.evidence_id || null,
    source_sha256: sourceManifest[file].sha256,
  };
}

function rowsById(rows, idField, label) {
  const result = new Map();
  const duplicateIds = [];
  for (const row of rows) {
    const id = row[idField]?.trim();
    if (!id || result.has(id)) duplicateIds.push(id || "<missing>");
    else result.set(id, row);
  }
  return { result, duplicateIds: [...new Set(duplicateIds)].map((id) => `${label}:${id}`) };
}

function addPage(pages, key, id, title, text, value, refs, extras = {}) {
  pages[key].push({
    row_key: id,
    title,
    plain_language: text,
    value,
    value_state: value === null ? "unknown" : "source_recorded",
    source_refs: refs,
    ...extras,
  });
}

export function buildRegisteredIntakeCandidate({ repoRoot = REPO_ROOT, tenantKey, outDir, variant = null }) {
  if (variant !== null && ![SOURCE_FIELDS_VARIANT, SOURCE_ASSERTIONS_VARIANT].includes(variant)) throw new Error(`Unknown candidate variant: ${variant}`);
  const sourceFieldsEnabled = variant === SOURCE_FIELDS_VARIANT || variant === SOURCE_ASSERTIONS_VARIANT;
  const sourceAssertionsEnabled = variant === SOURCE_ASSERTIONS_VARIANT;
  if (!tenantKey) throw new Error("--tenant-key is required; tenancy must be declared in the active registry");
  const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, REGISTRY), "utf8"));
  const tenant = registry.activeTenants?.find((entry) => entry.tenantKey === tenantKey);
  if (!tenant) throw new Error("Tenant is not active in the input registry");
  const inputRoot = path.resolve(repoRoot, tenant.canonicalInputRoot);
  const canonicalRoot = path.resolve(repoRoot, registry.canonicalRoot);
  if (!inputRoot.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error("Active input root is outside the canonical registry root");
  const sourceManifest = {};
  const inputs = {};
  for (const file of INPUT_FILES) {
    const full = path.join(inputRoot, file);
    if (!fs.existsSync(full)) throw new Error(`Required active intake file is missing: ${file}`);
    const bytes = fs.readFileSync(full);
    const rows = csvRows(bytes.toString("utf8")).map((row, index) => ({ ...row, __source_row: index + 2 }));
    const wrongTenant = rows.filter((row) => row.tenant_key !== tenantKey);
    if (wrongTenant.length) throw new Error(`${file} has ${wrongTenant.length} rows outside the registered tenant`);
    sourceManifest[file] = { sha256: sha256(bytes), row_count: rows.length, source_path: path.join(tenant.canonicalInputRoot, file) };
    inputs[file] = rows;
  }

  const spend = inputs["08_spend_value.csv"];
  const owners = inputs["02_org_ownership.csv"];
  const applications = inputs["04_applications_systems.csv"];
  const assets = inputs["05_data_assets_integrations.csv"];
  const platforms = inputs["06_infrastructure_platforms.csv"];
  const vendors = inputs["07_vendors_contracts.csv"];
  const programs = inputs["09_programs_initiatives.csv"];
  const useCases = inputs["10_ai_automation_use_cases.csv"];
  const risks = inputs["11_risks_controls.csv"];
  const relationships = inputs["12_relationships.csv"];
  const evidence = inputs["13_evidence_sources.csv"];
  const metrics = inputs["14_metrics_outcomes.csv"];
  const processes = inputs["18_operational_process_evidence.csv"];
  const maturity = inputs["19_data_analytics_platform_maturity.csv"];
  const benefits = inputs["SA08_AI_Benefits_Realization_Usage_Ledger.csv"];
  const usage = inputs["SA09_AI_Tool_Usage_Feed.csv"];
  const kpis = inputs["SA11_AI_KPI_Operational_Outcome_Feed.csv"];
  const caseIndex = rowsById(useCases, "use_case_id", "use_case");
  const benefitIndex = rowsById(benefits, "ai_use_case_id", "benefit");
  const usageIndex = rowsById(usage, "ai_use_case_id", "usage");
  const kpiIndex = rowsById(kpis, "ai_use_case_id", "kpi");
  const duplicates = [caseIndex, benefitIndex, usageIndex, kpiIndex].flatMap((index) => index.duplicateIds);
  const foundationObjects = sourceAssertionsEnabled ? FOUNDATION_OBJECT_CONTRACT.flatMap(
    ([file, type, idField, nameField, fields]) => inputs[file].map((row) => ({
      object_type: type, id: row[idField]?.trim() || null, name: row[nameField] || null,
      source_ref: sourceRef(file, row, sourceManifest),
      source_fields: Object.fromEntries(fields.map((field) => [field, row[field] || null])),
    }))) : [];
  const foundationIdentityErrors = sourceAssertionsEnabled ? FOUNDATION_OBJECT_CONTRACT.flatMap(
    ([file, , idField]) => rowsById(inputs[file], idField, file).duplicateIds) : [];
  const completeRelationshipRows = relationships.filter((row) => row.from_object_id?.trim() && row.to_object_id?.trim());
  const uniqueRelationshipTriples = new Set(completeRelationshipRows.map((row) => [
    row.from_object_type, row.from_object_id, row.relationship_type, row.to_object_type, row.to_object_id,
  ].join("|")));
  const caseIds = [...caseIndex.result.keys()].sort();
  const benefitIds = [...benefitIndex.result.keys()].sort();
  const programIds = new Set(programs.map((row) => row.program_id).filter(Boolean));
  const affectedFunctionsByProgram = new Map();
  if (sourceFieldsEnabled) {
    for (const row of relationships) {
      if (row.from_object_type !== "program" || row.relationship_type !== "impacts" ||
          row.to_object_type !== "function" || !programIds.has(row.from_object_id) ||
          !row.to_object_id?.trim() || !row.to_object_name?.trim()) continue;
      const current = affectedFunctionsByProgram.get(row.from_object_id) || [];
      current.push({ function_id: row.to_object_id, function_name: row.to_object_name,
        source_ref: sourceRef("12_relationships.csv", row, sourceManifest) });
      affectedFunctionsByProgram.set(row.from_object_id, current);
    }
  }
  const claimProgramIds = [...new Set(benefits.map((row) => row.ai_program_id).filter(Boolean))].sort();
  const unlinkedClaimProgramIds = claimProgramIds.filter((id) =>
    !isDeclaredProgramLink(id, programIds));
  const missingClaimProgramIds = benefits.filter((row) => !row.ai_program_id?.trim()).length;
  const linked = benefitIds.every((id) => usageIndex.result.has(id) && kpiIndex.result.has(id));
  const extraIds = [usageIndex, kpiIndex].flatMap((index) => [...index.result.keys()].filter((id) => !benefitIndex.result.has(id)));
  // Generic relationship edges cannot establish identity equivalence or funding linkage.
  const declaredCrosswalk = caseIds.length === benefitIds.length &&
    caseIds.every((id) => benefitIndex.result.has(id));
  const conflicts = benefitIds.flatMap((id) => {
    const b = benefitIndex.result.get(id), u = usageIndex.result.get(id);
    if (!b || !u) return [];
    const differences = [];
    for (const field of ["promised_value_usd", "active_users", "enabled_users"]) {
      const left = amount(b[field]), right = amount(u[field]);
      if (left !== null && right !== null && left !== right) differences.push(field);
    }
    return differences.length ? [{ use_case_id: id, differing_fields: differences }] : [];
  });
  const financeValueConflicts = benefitIds.filter((id) => {
    const values = [benefitIndex, usageIndex, kpiIndex].map((index) =>
      amount(index.result.get(id)?.finance_validated_value_usd));
    return values.every((value) => value !== null) && new Set(values).size > 1;
  });
  const financeValueMissingIds = benefitIds.filter((id) =>
    [benefitIndex, usageIndex, kpiIndex].some((index) =>
      amount(index.result.get(id)?.finance_validated_value_usd) === null));
  const claimStatusConflicts = benefitIds.filter((id) => {
    const statuses = [benefitIndex, usageIndex, kpiIndex].map((index) =>
      index.result.get(id)?.value_claim_status?.trim()).filter(Boolean);
    return statuses.length === 3 && new Set(statuses).size > 1;
  });
  const claimStatusMissingIds = benefitIds.filter((id) =>
    [benefitIndex, usageIndex, kpiIndex].some((index) =>
      !index.result.get(id)?.value_claim_status?.trim()));
  const rejectedEvidence = evidence.filter((row) => String(row.approved_for_loading).trim().toLowerCase() !== "true");
  const registeredEvidenceIds = new Set(evidence.map((row) => row.evidence_id?.trim()).filter(Boolean));
  const claimEvidenceIds = [...new Set([...benefits, ...usage, ...kpis]
    .map((row) => row.evidence_id?.trim()).filter(Boolean))].sort();
  const unregisteredClaimEvidenceIds = claimEvidenceIds.filter((id) => !registeredEvidenceIds.has(id));
  const claimEvidenceMissingRows = [...benefits, ...usage, ...kpis]
    .filter((row) => !row.evidence_id?.trim()).length;
  const rawUsageFile = path.join(inputRoot, "extracts/ms365-copilot-usage-user-detail.csv");
  const rawUsageFilePresent = fs.existsSync(rawUsageFile);
  let rawUsageValidation = {
    detail_available: false, detail_row_count: 0, declared_use_case_join: false,
    declared_source_system_join: false, compatible_period: false,
    structurally_linkable: false, aggregate_user_count_reconciled: false,
    validates_claim_usage: false, detail_report_periods: [], detail_refresh_dates: [],
  };
  if (rawUsageFilePresent) {
    const rawBytes = fs.readFileSync(rawUsageFile);
    const rawRows = csvRows(rawBytes.toString("utf8"));
    rawUsageValidation = assessRawUsageValidation(rawRows, usage);
    sourceManifest["extracts/ms365-copilot-usage-user-detail.csv"] = {
      sha256: sha256(rawBytes),
      row_count: rawRows.length,
      source_path: path.join(tenant.canonicalInputRoot, "extracts/ms365-copilot-usage-user-detail.csv"),
      detail_suppressed: true,
    };
  }
  const approvedBudgetRows = spend.filter((row) => row.approved_budget_usd && row.fiscal_year && row.budget_approval_status === "approved");
  const approvedBudget = approvedBudgetRows.length === spend.length ? sumKnown(approvedBudgetRows, "approved_budget_usd") : null;
  const modeledAnnualSpend = sumKnown(spend, "annual_spend_usd");
  const sourceNarrativeModelTotal = modeledSegmentTotal(spend);
  const plannedProgramBudgets = sumKnown(programs, "budget_usd");

  const canonical = {
    budget: { approved_fy_budget_usd: approvedBudget, status: approvedBudget === null ? "unknown_no_approved_finance_extract" : "source_recorded" },
    modeled_annual_spend: {
      amount_usd: modeledAnnualSpend,
      status: "planning_estimate_one_source",
      source_narrative_model_total_usd: sourceNarrativeModelTotal,
      row_sum_difference_usd: sourceNarrativeModelTotal === null || modeledAnnualSpend === null ? null : modeledAnnualSpend - sourceNarrativeModelTotal,
      source_refs: spend.map((row) => sourceRef("08_spend_value.csv", row, sourceManifest)),
    },
    programs: programs.map((row) => ({ id: row.program_id, name: row.program_name, planning_budget_usd: amount(row.budget_usd), approved_fy_budget_usd: null, source_ref: sourceRef("09_programs_initiatives.csv", row, sourceManifest),
      ...(sourceFieldsEnabled ? {
        business_sponsor_role: row.business_sponsor || null,
        technology_owner_role: row.technology_owner || null,
        source_program_status: row.status || null,
        source_program_phase: row.phase || null,
        affected_functions: affectedFunctionsByProgram.get(row.program_id) || [],
        ...(sourceAssertionsEnabled ? {
          source_stated_expected_value_usd: amount(row.expected_value_usd),
          source_start_date: row.start_date || null,
          source_end_date: row.end_date || null,
          source_pct_complete: amount(row.pct_complete),
          source_stage_gate: row.stage_gate || null,
          source_benefit_realization_start: row.benefit_realization_start || null,
          source_blocked_reason: row.blocked_reason || null,
          source_objective: row.objective || null,
          source_target_outcomes: row.target_outcomes || null,
        } : {}),
      } : {}) })),
    ai_use_cases: caseIds.map((id) => {
      const row = caseIndex.result.get(id);
      return {
        id,
        name: row.use_case_name,
        status: row.current_status,
        sponsor_role: row.sponsor_role,
        ...(sourceFieldsEnabled ? {
          business_function: row.business_function || null,
          business_segment_key: row.business_segment_key || null,
          operational_owner_role: row.operational_owner_role || null,
          expected_value_archetype: row.expected_value_archetype || null,
          ...(sourceAssertionsEnabled ? {
            source_value_hypothesis: row.value_hypothesis || null,
            source_approval_path: row.approval_path || null,
            source_risk_controls: row.risk_controls || null,
            source_required_systems: row.required_systems || null,
          } : {}),
        } : {}),
        planning_promise_usd: null,
        active_users: null,
        claimable_value_usd: null,
        claim_status: "blocked_missing_declared_claim_crosswalk",
        source_refs: [sourceRef("10_ai_automation_use_cases.csv", row, sourceManifest)],
      };
    }),
    ai_claims: benefitIds.map((id) => {
      const b = benefitIndex.result.get(id), u = usageIndex.result.get(id), k = kpiIndex.result.get(id);
      return {
        id,
        name: b.program_name,
        tool_name: u?.tool_name || b.tool_name,
        planning_promise_usd: amount(b.promised_value_usd),
        source_conflict: conflicts.some((item) => item.use_case_id === id),
        evidence_reference_registered: [b, u, k].filter(Boolean).every((row) =>
          Boolean(row.evidence_id) && registeredEvidenceIds.has(row.evidence_id)),
        unregistered_evidence_ids: [...new Set([b, u, k].filter(Boolean)
          .map((row) => row.evidence_id).filter((evidenceId) =>
            !evidenceId || !registeredEvidenceIds.has(evidenceId)))].sort(),
        program_budget_linked: isDeclaredProgramLink(b.ai_program_id, programIds),
        finance_feed_conflict: financeValueConflicts.includes(id),
        finance_feed_missing: financeValueMissingIds.includes(id),
        claim_status_feed_conflict: claimStatusConflicts.includes(id),
        claim_status_feed_missing: claimStatusMissingIds.includes(id),
        benefit_feed_usage_rate_basis: reportedRateBasis(b, "enabled_users"),
        usage_feed_usage_rate_basis: reportedRateBasis(u, "licensed_users"),
        usage_feed_reported_rate_pct: amount(u?.usage_rate_pct),
        usage_licensed_users: amount(u?.licensed_users),
        usage_active_users: amount(u?.active_users),
        usage_denominator: amount(u?.enabled_users),
        ...(sourceAssertionsEnabled ? {
          usage_power_users: amount(u?.power_users),
          usage_events: amount(u?.usage_events),
          usage_period_start: u?.usage_period_start || null,
          usage_period_end: u?.usage_period_end || null,
          usage_source_system: u?.source_system || null,
          usage_collection_method: u?.collection_method || null,
          usage_refresh_lag_hours: amount(u?.refresh_lag_hours),
          usage_shadow_flag: u?.shadow_usage_flag || null,
          outcome_feed_kpi_name: k?.kpi_name || null,
          outcome_feed_baseline: amount(k?.baseline_value),
          outcome_feed_target: amount(k?.target_value),
          outcome_feed_actual: amount(k?.actual_value),
          outcome_feed_unit: k?.metric_unit || null,
          outcome_feed_period_start: k?.measurement_period_start || null,
          outcome_feed_period_end: k?.measurement_period_end || null,
          outcome_feed_claim_status: k?.value_claim_status || null,
          outcome_feed_claim_allowed: k?.tower_claim_allowed || null,
          outcome_feed_source_finance_assertion_usd: amount(k?.finance_validated_value_usd),
          outcome_feed_source_record_id: k?.source_record_id || null,
        } : {}),
        claimable_value_usd: null,
        ...(sourceAssertionsEnabled ? {
          source_asserted_finance_value_usd: amount(b.finance_validated_value_usd),
          benefit_feed_source_funded_spend_usd: amount(b.funded_spend_usd),
          benefit_feed_source_actual_spend_ytd_usd: amount(b.actual_spend_ytd_usd),
          usage_feed_source_promised_value_usd: amount(u?.promised_value_usd),
          usage_feed_source_finance_assertion_usd: amount(u?.finance_validated_value_usd),
          usage_feed_source_claim_status: u?.value_claim_status || null,
          source_finance_validation_status: b.finance_validation_status || null,
          source_value_claim_status: b.value_claim_status || null,
          source_tower_claim_allowed: b.tower_claim_allowed || null,
          source_realized_value_allowed: b.realized_value_allowed || null,
          source_owner_attestation_status: b.owner_attestation_status || null,
          source_evidence_id: b.evidence_id || null,
          source_evidence_freshness_status: b.evidence_freshness_status || null,
          source_duplicate_risk: b.duplicate_risk || null,
          source_additive_status: b.additive_status || null,
          source_assertion_caveat: "Benefit-feed assertion only; evidence is not load-approved and cross-feed amounts disagree. No value is claimable.",
        } : {}),
        source_refs: [
          sourceRef("SA08_AI_Benefits_Realization_Usage_Ledger.csv", b, sourceManifest),
          u && sourceRef("SA09_AI_Tool_Usage_Feed.csv", u, sourceManifest),
          k && sourceRef("SA11_AI_KPI_Operational_Outcome_Feed.csv", k, sourceManifest),
        ].filter(Boolean),
      };
    }),
    foundations: {
      owner_rows: owners.length,
      application_rows: applications.length,
      data_asset_rows: assets.length,
      platform_rows: platforms.length,
      relationship_rows: relationships.length,
      process_rows: processes.length,
      maturity_rows: maturity.length,
      itsm_extract_available: fs.existsSync(path.join(inputRoot, "20_itsm_platform_workflow.csv")),
      ...(sourceAssertionsEnabled ? {
        source_objects: foundationObjects,
        no_declared_row_id: { source_file: "19_data_analytics_platform_maturity.csv", row_count: maturity.length },
        relationship_census: {
          source_rows: relationships.length,
          complete_declared_endpoint_ids: completeRelationshipRows.length,
          missing_from_id: relationships.filter((row) => !row.from_object_id?.trim()).length,
          missing_to_id: relationships.filter((row) => !row.to_object_id?.trim()).length,
          unique_declared_edge_keys: uniqueRelationshipTriples.size,
          repeated_declared_edge_rows: completeRelationshipRows.length - uniqueRelationshipTriples.size,
          workshop_certified_rows: relationships.filter((row) =>
            !row.known_gaps?.includes("not yet certified by a client workshop")).length,
          canonical_edges_admitted: 0,
          rule: "Raw rows may be staged in Layer 2; no new graph edge passes independent evidence and physical dictionary review.",
        },
      } : {}),
    },
    contract_exposure: vendors.map((row) => ({
      id: row.vendor_id,
      vendor: row.vendor_name,
      annual_contract_spend_usd: amount(row.annual_spend_usd),
      ...(sourceAssertionsEnabled ? {
        source_contract_name: row.contract_name || null,
        source_service_category: row.service_category || null,
        source_contract_owner_role: row.contract_owner || null,
        source_renewal_date: row.renewal_date || null,
        source_term_end: row.term_end || null,
        source_risk_rating: row.risk_rating || null,
      } : {}),
      source_ref: sourceRef("07_vendors_contracts.csv", row, sourceManifest),
    })),
    outcome_metrics: metrics.map((row) => ({
      id: row.metric_id,
      name: row.metric_name,
      baseline: row.baseline_value || null,
      baseline_period: row.baseline_period || null,
      target: row.target_value || null,
      observed: row.actual_value || null,
      observed_period: row.actual_period || null,
      claimable_value_usd: null,
      source_ref: sourceRef("14_metrics_outcomes.csv", row, sourceManifest),
      evidence_basis: row.evidence_basis || null,
      ...(sourceAssertionsEnabled ? {
        source_asserted_finance_value_usd: amount(row.finance_attested_value_usd),
        source_definition: row.definition || null,
        source_metric_domain: row.metric_domain || null,
        source_business_function: row.business_function || null,
        source_owner_role: row.owner || null,
        source_data_source: row.data_source || null,
        source_calculation_basis: row.calculation_basis || null,
        source_unblock_target_period: row.unblock_target_period || null,
        source_value_claim_status: row.value_claim_status || null,
        source_claim_readiness: row.claim_readiness || null,
        source_attestation_owner: row.attestation_owner || null,
        source_assertion_caveat: "Outcome-feed assertion only; independent Finance and evidence approval have not been verified for Tower.",
      } : {}),
      blocked_reason: row.claim_blocked_reason || "Evidence approval and Finance reconciliation pending",
      next_action: row.unblock_action || "Approve evidence and reconcile the measurement",
    })),
  };

  const foundationSummary = sourceAssertionsEnabled ? { ...canonical.foundations } : canonical.foundations;
  if (sourceAssertionsEnabled) delete foundationSummary.source_objects;
  const pages = Object.fromEntries(PAGES.map((key) => [key, []]));
  addPage(pages, "command_center", "executive_summary", "Tower at a glance",
    "Approved FY budget is not supplied. The annual spend figure is a planning estimate from one source; program budgets cover unspecified periods. No realized AI value is ready to claim.",
    null, canonical.modeled_annual_spend.source_refs, {
      approved_fy_budget_usd: approvedBudget,
      modeled_annual_spend_usd: modeledAnnualSpend,
      modeled_spend_narrative_total_usd: sourceNarrativeModelTotal,
      modeled_spend_row_difference_usd: canonical.modeled_annual_spend.row_sum_difference_usd,
      planning_program_budgets_usd: plannedProgramBudgets,
      claimable_ai_value_usd: null,
      use_case_count: caseIds.length,
      separate_benefit_claim_record_count: benefitIds.length,
      unregistered_claim_evidence_id_count: unregisteredClaimEvidenceIds.length,
      unlinked_claim_program_id_count: unlinkedClaimProgramIds.length,
      finance_value_feed_conflict_count: financeValueConflicts.length,
      claim_status_feed_conflict_count: claimStatusConflicts.length,
      raw_usage_validates_claim_feed: rawUsageValidation.validates_claim_usage,
      use_case_to_benefit_ids_joined: declaredCrosswalk,
      foundations: foundationSummary,
    });
  for (const program of canonical.programs) {
    addPage(pages, "decision_lanes", program.id, program.name,
      sourceAssertionsEnabled ? "The source lists a planning budget and expected value. Neither is approved fiscal-year funding or measured return." :
        "Planning budget only. The amount has no approved fiscal-year basis in this extract.",
      program.planning_budget_usd,
      [program.source_ref, ...(program.affected_functions || []).map((item) => item.source_ref)],
      { fiscal_year: null, approval_state: "not_verified",
        ...(sourceFieldsEnabled ? {
          business_sponsor_role: program.business_sponsor_role,
          technology_owner_role: program.technology_owner_role,
          source_program_status: program.source_program_status,
          source_program_phase: program.source_program_phase,
          affected_functions: program.affected_functions.map(({ function_id, function_name }) => ({ function_id, function_name })),
          affected_function_name: program.affected_functions.length === 1 ? program.affected_functions[0].function_name : null,
          domain_name: null,
          ...(sourceAssertionsEnabled ? {
            source_stated_expected_value_usd: program.source_stated_expected_value_usd,
            source_start_date: program.source_start_date,
            source_end_date: program.source_end_date,
            source_pct_complete: program.source_pct_complete,
            source_stage_gate: program.source_stage_gate,
            source_benefit_realization_start: program.source_benefit_realization_start,
            source_blocked_reason: program.source_blocked_reason,
            source_objective: program.source_objective,
            source_target_outcomes: program.source_target_outcomes,
            source_assertion_caveat: "Source-stated planning value, not approved funding or realized value.",
          } : {}),
        } : {}) });
  }
  for (const item of canonical.ai_use_cases) {
    addPage(pages, "ai_portfolio", item.id, item.name,
      "This use case has no declared link to the benefit or usage records. Its money and adoption remain unknown.",
      null, item.source_refs, { claimable_value_usd: null,
        ...(sourceFieldsEnabled ? {
          business_function: item.business_function,
          business_segment_key: item.business_segment_key,
          source_case_status: item.status,
          business_sponsor_role: item.sponsor_role,
          operational_owner_role: item.operational_owner_role,
          expected_value_archetype: item.expected_value_archetype,
          ...(sourceAssertionsEnabled ? {
            source_value_hypothesis: item.source_value_hypothesis,
            source_approval_path: item.source_approval_path,
            source_risk_controls: item.source_risk_controls,
            source_required_systems: item.source_required_systems,
          } : {}),
        } : {}) });
    addPage(pages, "evidence", item.id, item.name, "Evidence has not been approved for loading or cited proof.", null, item.source_refs,
      { next_step: "Approve and reconcile evidence" });
    addPage(pages, "recommended_actions", item.id, item.name, "Reconcile source amounts and get Finance and evidence sign-off.", null, item.source_refs);
  }
  for (const item of canonical.ai_claims) {
    addPage(pages, "value_proof", item.id, item.name,
      sourceAssertionsEnabled ?
        `The benefit feed states a Finance value and claim status, but the feeds disagree and its evidence ID is not approved for loading. This is a source assertion, not cleared value.` :
        `Benefit and usage extracts give different amounts. ${item.evidence_reference_registered ? "The cited evidence ID is registered but not approved." : "The cited evidence ID is not in the evidence register."} The benefit promise is planning only; no realized value is claimable.`,
      null, item.source_refs, { planning_promise_usd: item.planning_promise_usd, claimable_value_usd: null,
        evidence_reference_registered: item.evidence_reference_registered,
        ...(sourceAssertionsEnabled ? {
          source_asserted_finance_value_usd: item.source_asserted_finance_value_usd,
          benefit_feed_source_funded_spend_usd: item.benefit_feed_source_funded_spend_usd,
          benefit_feed_source_actual_spend_ytd_usd: item.benefit_feed_source_actual_spend_ytd_usd,
          usage_feed_source_promised_value_usd: item.usage_feed_source_promised_value_usd,
          usage_feed_source_finance_assertion_usd: item.usage_feed_source_finance_assertion_usd,
          usage_feed_source_claim_status: item.usage_feed_source_claim_status,
          outcome_feed_kpi_name: item.outcome_feed_kpi_name,
          outcome_feed_baseline: item.outcome_feed_baseline,
          outcome_feed_target: item.outcome_feed_target,
          outcome_feed_actual: item.outcome_feed_actual,
          outcome_feed_unit: item.outcome_feed_unit,
          outcome_feed_period_start: item.outcome_feed_period_start,
          outcome_feed_period_end: item.outcome_feed_period_end,
          outcome_feed_claim_status: item.outcome_feed_claim_status,
          outcome_feed_claim_allowed: item.outcome_feed_claim_allowed,
          outcome_feed_source_finance_assertion_usd: item.outcome_feed_source_finance_assertion_usd,
          outcome_feed_source_record_id: item.outcome_feed_source_record_id,
          source_finance_validation_status: item.source_finance_validation_status,
          source_value_claim_status: item.source_value_claim_status,
          source_tower_claim_allowed: item.source_tower_claim_allowed,
          source_realized_value_allowed: item.source_realized_value_allowed,
          source_owner_attestation_status: item.source_owner_attestation_status,
          source_evidence_id: item.source_evidence_id,
          source_evidence_freshness_status: item.source_evidence_freshness_status,
          source_duplicate_risk: item.source_duplicate_risk,
          source_additive_status: item.source_additive_status,
          source_assertion_caveat: item.source_assertion_caveat,
        } : {}) });
    addPage(pages, "adoption_lens", item.id, item.name,
      `Active users and enabled users come from the usage feed. ${rawUsageValidation.validates_claim_usage ? "The separate user-detail file has matching identity, source and period fields." : "The separate user-detail file cannot validate these records."} Usage does not establish a dollar benefit.`,
      item.usage_active_users, item.source_refs.filter((ref) => ref.source_file === "SA09_AI_Tool_Usage_Feed.csv"),
      { metric_label: "Active users from usage feed", enabled_users: item.usage_denominator, value_attribution_usd: null,
        conflicting_benefit_feed: item.source_conflict,
        reported_usage_rate_pct: item.usage_feed_reported_rate_pct,
        reported_usage_rate_denominator: item.usage_feed_usage_rate_basis,
        licensed_users: item.usage_licensed_users,
        ...(sourceAssertionsEnabled ? {
          power_users: item.usage_power_users,
          usage_events: item.usage_events,
          usage_period_start: item.usage_period_start,
          usage_period_end: item.usage_period_end,
          usage_source_system: item.usage_source_system,
          usage_collection_method: item.usage_collection_method,
          usage_refresh_lag_hours: item.usage_refresh_lag_hours,
          usage_shadow_flag: item.usage_shadow_flag,
        } : {}),
        raw_detail_validation_status: rawUsageValidation.validates_claim_usage ? "validated" : "not_validated" });
  }
  for (const item of canonical.outcome_metrics) {
    addPage(pages, "value_proof", `metric:${item.id}`, item.name,
      sourceAssertionsEnabled ?
        "The outcome feed records baseline, target and observed values. Some rows state a Finance amount; Tower has not independently verified that assertion or approved evidence." :
        "Baseline, target and observed values come from the outcome feed. Dollar value is withheld until evidence and Finance review are complete.",
      null, [item.source_ref], {
        baseline: item.baseline, target: item.target, observed: item.observed,
        baseline_period: item.baseline_period, observed_period: item.observed_period,
        claimable_value_usd: null, claim_blocked_reason: item.blocked_reason,
        ...(sourceAssertionsEnabled ? {
          source_asserted_finance_value_usd: item.source_asserted_finance_value_usd,
          source_definition: item.source_definition,
          source_metric_domain: item.source_metric_domain,
          source_business_function: item.source_business_function,
          source_owner_role: item.source_owner_role,
          source_data_source: item.source_data_source,
          source_calculation_basis: item.source_calculation_basis,
          source_unblock_target_period: item.source_unblock_target_period,
          source_value_claim_status: item.source_value_claim_status,
          source_claim_readiness: item.source_claim_readiness,
          source_attestation_owner: item.source_attestation_owner,
          source_evidence_basis: item.evidence_basis,
          source_assertion_caveat: item.source_assertion_caveat,
        } : {}),
      });
    addPage(pages, "recommended_actions", `metric:${item.id}`, item.name,
      item.next_action, null, [item.source_ref]);
  }
  for (const row of evidence) {
    addPage(pages, "evidence", `source:${row.evidence_id}`, row.source_file,
      "Source is listed, but approval for loading is absent. Its facts cannot support a Tower claim yet.",
      null, [sourceRef("13_evidence_sources.csv", row, sourceManifest)],
      { approval_state: row.approved_for_loading, source_owner: row.source_owner });
  }
  for (const row of spend) {
    const ref = sourceRef("08_spend_value.csv", row, sourceManifest);
    addPage(pages, "cost_lens", `spend:${row.__source_row}`, row.spend_category,
      "Modeled annual spend for this category. This is not an approved budget or verified savings.",
      amount(row.annual_spend_usd), [ref], {
        metric_label: "Modeled annual spend category", savings_claim_usd: null,
        category_business_id: null, category_label: row.spend_category,
        source_row_identity_only: true, additive_to_aggregate_spend: false,
        additive_to_contract_spend: false, period_basis: "annual_unspecified_year",
        ...(sourceAssertionsEnabled ? {
          source_prior_year_actual_usd: amount(row.prior_year_actual_usd),
          source_forecast_next_year_usd: amount(row.forecast_next_year_usd),
          source_savings_opportunity_usd: amount(row.savings_opportunity_usd),
          source_savings_claim_status: "source_estimate_not_verified",
          source_calculation_basis: row.calculation_basis || null,
          source_budget_owner_role: row.budget_owner || null,
        } : {}),
      });
  }
  for (const row of vendors) {
    addPage(pages, "cost_lens", `contract:${row.vendor_id}`, row.vendor_name,
      "Annual contract spend is a separate exposure. It must not be added to modeled IT spend without a declared overlap rule.",
      amount(row.annual_spend_usd), [sourceRef("07_vendors_contracts.csv", row, sourceManifest)],
      { metric_label: "Annual contract spend", additive_to_it_spend: false,
        ...(sourceAssertionsEnabled ? {
          source_contract_name: row.contract_name || null,
          source_service_category: row.service_category || null,
          source_contract_owner_role: row.contract_owner || null,
          source_renewal_date: row.renewal_date || null,
          source_term_end: row.term_end || null,
          source_risk_rating: row.risk_rating || null,
        } : {}) });
  }
  for (const row of risks) {
    addPage(pages, "risk_lens", row.risk_id || `risk:${row.__source_row}`, row.risk_or_control_name,
      "Source-recorded risk. Review the control and evidence before making an executive assurance claim.",
      null, [sourceRef("11_risks_controls.csv", row, sourceManifest)], { severity: row.severity, control_status: row.control_status,
        ...(sourceAssertionsEnabled ? {
          source_likelihood: row.likelihood || null,
          source_control_owner_role: row.control_owner || null,
          source_evidence_required: row.evidence_required || null,
          source_mitigation_plan: row.mitigation_plan || null,
          source_last_tested_date: row.last_tested_date || null,
          source_regulatory_driver: row.regulatory_driver || null,
        } : {}) });
  }

  const assertionParity = !sourceAssertionsEnabled || (
    programs.every((raw) => {
      const item = canonical.programs.find((row) => row.id === raw.program_id);
      const page = pages.decision_lanes.find((row) => row.row_key === raw.program_id);
      return item && page && raw.expected_value_usd.trim() && amount(raw.expected_value_usd) !== null &&
        item.source_stated_expected_value_usd === amount(raw.expected_value_usd) &&
        page.source_stated_expected_value_usd === item.source_stated_expected_value_usd &&
        page.source_start_date === (raw.start_date || null) &&
        page.source_end_date === (raw.end_date || null) &&
        page.source_pct_complete === amount(raw.pct_complete) &&
        page.source_stage_gate === (raw.stage_gate || null) &&
        page.source_benefit_realization_start === (raw.benefit_realization_start || null) &&
        page.source_blocked_reason === (raw.blocked_reason || null) &&
        page.source_objective === (raw.objective || null) &&
        page.source_target_outcomes === (raw.target_outcomes || null) &&
        page.approved_fy_budget_usd === undefined && item.approved_fy_budget_usd === null;
    }) &&
    metrics.every((raw) => {
      const item = canonical.outcome_metrics.find((row) => row.id === raw.metric_id);
      const page = pages.value_proof.find((row) => row.row_key === `metric:${raw.metric_id}`);
      return item && page && (!raw.finance_attested_value_usd.trim() || amount(raw.finance_attested_value_usd) !== null) &&
        item.source_asserted_finance_value_usd === amount(raw.finance_attested_value_usd) &&
        page.source_asserted_finance_value_usd === item.source_asserted_finance_value_usd &&
        page.source_value_claim_status === raw.value_claim_status &&
        page.source_claim_readiness === raw.claim_readiness &&
        page.source_data_source === (raw.data_source || null) &&
        page.source_calculation_basis === (raw.calculation_basis || null) &&
        page.source_unblock_target_period === (raw.unblock_target_period || null) &&
        page.claimable_value_usd === null && item.claimable_value_usd === null;
    }) &&
    benefits.every((raw) => {
      const item = canonical.ai_claims.find((row) => row.id === raw.ai_use_case_id);
      const page = pages.value_proof.find((row) => row.row_key === raw.ai_use_case_id);
      return item && page && (!raw.finance_validated_value_usd.trim() || amount(raw.finance_validated_value_usd) !== null) &&
        item.source_asserted_finance_value_usd === amount(raw.finance_validated_value_usd) &&
        page.source_asserted_finance_value_usd === item.source_asserted_finance_value_usd &&
        page.source_finance_validation_status === raw.finance_validation_status &&
        page.source_value_claim_status === raw.value_claim_status &&
        page.benefit_feed_source_funded_spend_usd === amount(raw.funded_spend_usd) &&
        page.benefit_feed_source_actual_spend_ytd_usd === amount(raw.actual_spend_ytd_usd) &&
        page.source_evidence_id === raw.evidence_id &&
        page.claimable_value_usd === null && item.claimable_value_usd === null;
    }) && usage.every((raw) => {
      const page = pages.adoption_lens.find((row) => row.row_key === raw.ai_use_case_id);
      const value = pages.value_proof.find((row) => row.row_key === raw.ai_use_case_id);
      return page && value && value.usage_feed_source_promised_value_usd === amount(raw.promised_value_usd) &&
        value.usage_feed_source_finance_assertion_usd === amount(raw.finance_validated_value_usd) &&
        value.usage_feed_source_claim_status === (raw.value_claim_status || null) &&
        value.claimable_value_usd === null && page.power_users === amount(raw.power_users) &&
        page.usage_events === amount(raw.usage_events) &&
        page.usage_period_start === (raw.usage_period_start || null) &&
        page.usage_period_end === (raw.usage_period_end || null) &&
        page.usage_source_system === (raw.source_system || null) &&
        page.value_attribution_usd === null;
    }) && kpis.every((raw) => {
      const page = pages.value_proof.find((row) => row.row_key === raw.ai_use_case_id);
      return page && page.outcome_feed_baseline === amount(raw.baseline_value) &&
        page.outcome_feed_target === amount(raw.target_value) &&
        page.outcome_feed_actual === amount(raw.actual_value) &&
        page.outcome_feed_unit === (raw.metric_unit || null) &&
        page.outcome_feed_claim_status === (raw.value_claim_status || null) &&
        page.outcome_feed_claim_allowed === (raw.tower_claim_allowed || null) &&
        page.outcome_feed_source_finance_assertion_usd === amount(raw.finance_validated_value_usd) &&
        page.outcome_feed_source_record_id === (raw.source_record_id || null) &&
        page.claimable_value_usd === null;
    }) && vendors.every((raw) => {
      const page = pages.cost_lens.find((row) => row.row_key === `contract:${raw.vendor_id}`);
      return page && page.source_contract_name === (raw.contract_name || null) &&
        page.source_renewal_date === (raw.renewal_date || null) &&
        page.source_contract_owner_role === (raw.contract_owner || null);
    }) && useCases.every((raw) => {
      const page = pages.ai_portfolio.find((row) => row.row_key === raw.use_case_id);
      return page && page.source_value_hypothesis === (raw.value_hypothesis || null) &&
        page.source_approval_path === (raw.approval_path || null) &&
        page.claimable_value_usd === null;
    }) && risks.every((raw) => {
      const page = pages.risk_lens.find((row) => row.row_key === raw.risk_id);
      return page && page.source_likelihood === (raw.likelihood || null) &&
        page.source_mitigation_plan === (raw.mitigation_plan || null) &&
        page.value === null;
    }) && spend.every((raw) => {
      const page = pages.cost_lens.find((row) => row.row_key === `spend:${raw.__source_row}`);
      return page && page.source_prior_year_actual_usd === amount(raw.prior_year_actual_usd) &&
        page.source_forecast_next_year_usd === amount(raw.forecast_next_year_usd) &&
        page.source_savings_opportunity_usd === amount(raw.savings_opportunity_usd) &&
        page.source_calculation_basis === (raw.calculation_basis || null) &&
        page.savings_claim_usd === null;
    })
  );
  const gates = [
    check("active_registry_binding", true, "Tenant and source root were resolved from the active input registry."),
    check("intake_population", INPUT_FILES.every((file) => sourceManifest[file].row_count > 0), "Every required Tower input file must contain rows."),
    check("canonical_identity", !duplicates.length && linked && !extraIds.length, `Duplicate IDs: ${duplicates.length}; unlinked or extra benefit/usage/KPI IDs: ${(!linked ? 1 : 0) + extraIds.length}.`),
    ...(sourceAssertionsEnabled ? [check("foundation_declared_identity", !foundationIdentityErrors.length &&
      foundationObjects.length === owners.length + applications.length + assets.length + platforms.length + processes.length &&
      foundationObjects.every((row) => row.id && row.name && row.source_ref?.source_sha256),
    "Every included Foundation object must have a declared, unique source ID and exact source-row lineage.")] : []),
    ...(sourceAssertionsEnabled ? [check("relationship_source_census", relationships.length === 2302 &&
      completeRelationshipRows.length === 2123 && uniqueRelationshipTriples.size === 2027 &&
      relationships.every((row) => row.known_gaps?.includes("not yet certified by a client workshop")),
    "All relationship rows are counted by declared endpoint IDs; new canonical edges stay withheld pending evidence and dictionary proof.")] : []),
    check("no_inferred_case_claim_join", !declaredCrosswalk && canonical.ai_use_cases.every((row) => row.planning_promise_usd === null) || declaredCrosswalk,
      "Different identifier systems cannot be joined by matching names."),
    check("unapproved_evidence_not_consumed", canonical.ai_claims.every((row) => row.claimable_value_usd === null),
      "Unapproved evidence does not support claimable value."),
    check("conflicted_money_not_claimed", canonical.ai_claims.every((row) => row.claimable_value_usd === null),
      "Conflicting benefit and usage dollars remain source-specific and unclaimed."),
    check("modeled_spend_not_budget", approvedBudget !== null || canonical.budget.approved_fy_budget_usd === null,
      "Modeled annual spend must not be called an approved FY budget."),
    check("all_nine_views_mapped", PAGES.every((key) => pages[key].length > 0), "Each Tower view needs at least one source-backed candidate row."),
    check("no_claimable_value_without_proof", [...canonical.ai_use_cases, ...canonical.ai_claims].every((row) => row.claimable_value_usd === null), "No AI dollars become claimable while financial and evidence gates fail."),
    ...(sourceAssertionsEnabled ? [check("source_assertion_field_coverage", assertionParity,
      "Source-reported spend, program, outcome, and benefit fields must match exact source rows and remain unapproved or unclaimable where required.")] : []),
  ];
  const coverageGaps = [
    coverage("declared_case_claim_crosswalk", declaredCrosswalk, "Use-case IDs and benefit IDs differ; an explicit relationship is required before combining records."),
    coverage("source_evidence_approved", rejectedEvidence.length === 0, `${rejectedEvidence.length} of ${evidence.length} evidence-register rows are not approved for loading.`),
    coverage("claim_evidence_ids_registered", unregisteredClaimEvidenceIds.length === 0 && claimEvidenceMissingRows === 0,
      `${unregisteredClaimEvidenceIds.length} distinct claim evidence IDs are missing from the evidence register; ${claimEvidenceMissingRows} claim feed rows have no evidence ID. Claim records cannot cite these as proof.`),
    coverage("claim_program_ids_linked_to_pmo", unlinkedClaimProgramIds.length === 0 && missingClaimProgramIds === 0,
      `${unlinkedClaimProgramIds.length} distinct AI claim program IDs have no declared link to PMO program IDs; ${missingClaimProgramIds} benefit rows have no program ID. Benefit funding cannot be tied to PMO budgets.`),
    coverage("finance_values_reconciled_across_feeds", financeValueConflicts.length === 0 && financeValueMissingIds.length === 0,
      `${financeValueConflicts.length} claim IDs carry different Finance-value amounts and ${financeValueMissingIds.length} lack a value in at least one feed; none may be treated as verified value.`),
    coverage("claim_status_reconciled_across_feeds", claimStatusConflicts.length === 0 && claimStatusMissingIds.length === 0,
      `${claimStatusConflicts.length} claim IDs carry different claim statuses and ${claimStatusMissingIds.length} lack a status in at least one feed.`),
    coverage("usage_rate_denominator_consistent", benefitIds.every((id) => {
      const b = benefitIndex.result.get(id), u = usageIndex.result.get(id);
      const benefitBasis = reportedRateBasis(b, "enabled_users");
      const usageBasis = reportedRateBasis(u, "licensed_users");
      return benefitBasis !== "not_reconciled" && benefitBasis === usageBasis;
    }), "Benefit usage rates use active/enabled while usage-feed rates use active/licensed; the percentages are not comparable."),
    coverage("interview_evidence_linked", false,
      "Interview evidence is outside this candidate source manifest; it cannot corroborate claim value here."),
    coverage("ai_money_usage_reconciled", conflicts.length === 0, `${conflicts.length} use cases disagree between benefit and usage extracts.`),
    coverage("approved_fy_budget_available", approvedBudget !== null, "Approved FY budget needs an explicit Finance amount, year and approval state."),
    coverage("modeled_spend_rounding_reconciled", canonical.modeled_annual_spend.row_sum_difference_usd === 0,
      `Category row sum differs from source narrative model total by ${canonical.modeled_annual_spend.row_sum_difference_usd ?? "unknown"} USD; use the row sum as one-source modeled spend, not a tied-out budget.`),
    coverage("program_funding_period_approved", programs.every((row) => row.fiscal_year && row.approval_status === "approved"), "Program budgets need an approved fiscal period before they can be called funded."),
    coverage("foundation_itsm_extract", canonical.foundations.itsm_extract_available, "ITSM workflow extract is absent; show this as a Foundations gap."),
    coverage("raw_tool_usage_validates_claim_feed", rawUsageValidation.validates_claim_usage,
      `User-detail extract is ${rawUsageValidation.detail_available ? "present" : "absent"}; declared use-case join: ${rawUsageValidation.declared_use_case_join}; source-system join: ${rawUsageValidation.declared_source_system_join}; matching period: ${rawUsageValidation.compatible_period}; aggregate user-count reconciliation: ${rawUsageValidation.aggregate_user_count_reconciled}. A file hash or structural join cannot validate the claim usage feed.`),
  ];
  const fingerprint = sha256(JSON.stringify(sourceManifest));
  const assessmentId = variant !== null
    ? `tower-registry-candidate-${sha256(`${fingerprint}|${variant}`).slice(0, 16)}`
    : `tower-registry-candidate-${fingerprint.slice(0, 16)}`;
  const report = {
    contract_version: "tower-registered-intake-candidate/v1",
    tenant_key: tenantKey,
    input_root: tenant.canonicalInputRoot,
    input_fingerprint_sha256: fingerprint,
    assessment_id: assessmentId,
    ...(variant !== null ? { candidate_rules_version: variant } : {}),
    build_state: "dry_run_only",
    runtime_eligible: false,
    physical_write_ready: false,
    dataset_manifest_id: null,
    load_approval: null,
    lifecycle_preflight_status: "not_checked",
    all_view_candidate: true,
    source_manifest: sourceManifest,
    source_conflicts: conflicts,
    unregistered_claim_evidence_ids: unregisteredClaimEvidenceIds,
    claim_evidence_missing_rows: claimEvidenceMissingRows,
    unlinked_claim_program_ids: unlinkedClaimProgramIds,
    missing_claim_program_id_rows: missingClaimProgramIds,
    finance_value_conflict_ids: financeValueConflicts,
    finance_value_missing_ids: financeValueMissingIds,
    claim_status_conflict_ids: claimStatusConflicts,
    claim_status_missing_ids: claimStatusMissingIds,
    raw_usage_validation: rawUsageValidation,
    evidence_rows_not_approved: rejectedEvidence.length,
    ...(sourceAssertionsEnabled ? { source_assertion_coverage: {
      program_expected_value_rows: programs.filter((row) => row.expected_value_usd.trim()).length,
      outcome_finance_amount_rows: metrics.filter((row) => row.finance_attested_value_usd.trim()).length,
      benefit_finance_amount_rows: benefits.filter((row) => row.finance_validated_value_usd.trim()).length,
      benefit_funded_spend_rows: benefits.filter((row) => row.funded_spend_usd.trim()).length,
      benefit_actual_spend_ytd_rows: benefits.filter((row) => row.actual_spend_ytd_usd.trim()).length,
      usage_promise_rows: usage.filter((row) => row.promised_value_usd.trim()).length,
      usage_finance_amount_rows: usage.filter((row) => row.finance_validated_value_usd.trim()).length,
      outcome_feed_finance_amount_rows: kpis.filter((row) => row.finance_validated_value_usd.trim()).length,
    } } : {}),
    gates,
    coverage_gaps: coverageGaps,
    quality_gate_status: gates.every((gate) => gate.status === "pass") ? "pass" : "fail",
    canonical,
    views: pages,
    view_counts: Object.fromEntries(PAGES.map((key) => [key, pages[key].length])),
    activation_requirement: "Before any write, read the exact tenant's declared active lifecycle row and fail if absent. Stage under an inactive assessment, prove every view by direct assessment readback, then atomically promote the active key. Do not insert an executive summary into the current automatic selector.",
  };
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "candidate.json"), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(outDir, "quality-gate.json"), `${JSON.stringify({ status: report.quality_gate_status, gates, coverage_gaps: coverageGaps, view_counts: report.view_counts }, null, 2)}\n`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const read = (flag) => {
    const index = process.argv.indexOf(flag);
    return index < 0 ? null : process.argv[index + 1];
  };
  const tenantKey = read("--tenant-key");
  const outDir = read("--out-dir") || path.join(REPO_ROOT, "reports/tower-registered-intake-candidate", tenantKey || "unknown");
  const variant = read("--candidate-variant");
  try {
    const report = buildRegisteredIntakeCandidate({ tenantKey, outDir, variant });
    process.stdout.write(`${JSON.stringify({ assessment_id: report.assessment_id, quality_gate_status: report.quality_gate_status, view_counts: report.view_counts, out_dir: outDir })}\n`);
    if (report.quality_gate_status !== "pass") process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

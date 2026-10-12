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

export function buildRegisteredIntakeCandidate({ repoRoot = REPO_ROOT, tenantKey, outDir }) {
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
  const caseIds = [...caseIndex.result.keys()].sort();
  const benefitIds = [...benefitIndex.result.keys()].sort();
  const linked = benefitIds.every((id) => usageIndex.result.has(id) && kpiIndex.result.has(id));
  const extraIds = [usageIndex, kpiIndex].flatMap((index) => [...index.result.keys()].filter((id) => !benefitIndex.result.has(id)));
  // Distinct identifier systems are left unlinked until the intake declares a crosswalk.
  const declaredCrosswalk = relationships.some((row) =>
    (caseIndex.result.has(row.from_object_id) && benefitIndex.result.has(row.to_object_id)) ||
    (caseIndex.result.has(row.to_object_id) && benefitIndex.result.has(row.from_object_id)));
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
  const rejectedEvidence = evidence.filter((row) => String(row.approved_for_loading).trim().toLowerCase() !== "true");
  const rawUsageFile = path.join(inputRoot, "extracts/ms365-copilot-usage-user-detail.csv");
  const rawUsageFilePresent = fs.existsSync(rawUsageFile);
  if (rawUsageFilePresent) {
    const rawBytes = fs.readFileSync(rawUsageFile);
    sourceManifest["extracts/ms365-copilot-usage-user-detail.csv"] = {
      sha256: sha256(rawBytes),
      row_count: csvRows(rawBytes.toString("utf8")).length,
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
    programs: programs.map((row) => ({ id: row.program_id, name: row.program_name, planning_budget_usd: amount(row.budget_usd), approved_fy_budget_usd: null, source_ref: sourceRef("09_programs_initiatives.csv", row, sourceManifest) })),
    ai_use_cases: caseIds.map((id) => {
      const row = caseIndex.result.get(id);
      return {
        id,
        name: row.use_case_name,
        status: row.current_status,
        sponsor_role: row.sponsor_role,
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
        usage_active_users: amount(u?.active_users),
        usage_denominator: amount(u?.enabled_users),
        claimable_value_usd: null,
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
    },
    contract_exposure: vendors.map((row) => ({
      id: row.vendor_id,
      vendor: row.vendor_name,
      annual_contract_spend_usd: amount(row.annual_spend_usd),
      source_ref: sourceRef("07_vendors_contracts.csv", row, sourceManifest),
    })),
    outcome_metrics: metrics.map((row) => ({
      id: row.metric_id,
      name: row.metric_name,
      baseline: row.baseline_value || null,
      target: row.target_value || null,
      observed: row.actual_value || null,
      claimable_value_usd: null,
      source_ref: sourceRef("14_metrics_outcomes.csv", row, sourceManifest),
      evidence_basis: row.evidence_basis || null,
      blocked_reason: row.claim_blocked_reason || "Evidence approval and Finance reconciliation pending",
      next_action: row.unblock_action || "Approve evidence and reconcile the measurement",
    })),
  };

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
      use_case_to_benefit_ids_joined: declaredCrosswalk,
      foundations: canonical.foundations,
    });
  for (const program of canonical.programs) {
    addPage(pages, "decision_lanes", program.id, program.name,
      "Planning budget only. The amount has no approved fiscal-year basis in this extract.",
      program.planning_budget_usd, [program.source_ref], { fiscal_year: null, approval_state: "not_verified" });
  }
  for (const item of canonical.ai_use_cases) {
    addPage(pages, "ai_portfolio", item.id, item.name,
      "This use case has no declared link to the benefit or usage records. Its money and adoption remain unknown.",
      null, item.source_refs, { claimable_value_usd: null });
    addPage(pages, "evidence", item.id, item.name, "Evidence has not been approved for loading or cited proof.", null, item.source_refs,
      { next_step: "Approve and reconcile evidence" });
    addPage(pages, "recommended_actions", item.id, item.name, "Reconcile source amounts and get Finance and evidence sign-off.", null, item.source_refs);
  }
  for (const item of canonical.ai_claims) {
    addPage(pages, "value_proof", item.id, item.name,
      "Benefit and usage extracts give different amounts. The benefit promise is planning only; no realized value is claimable.",
      null, item.source_refs, { planning_promise_usd: item.planning_promise_usd, claimable_value_usd: null });
    addPage(pages, "adoption_lens", item.id, item.name,
      "Active users and enabled users come from the usage feed. They do not establish a dollar benefit.",
      item.usage_active_users, item.source_refs.filter((ref) => ref.source_file === "SA09_AI_Tool_Usage_Feed.csv"),
      { metric_label: "Active users from usage feed", enabled_users: item.usage_denominator, value_attribution_usd: null,
        conflicting_benefit_feed: item.source_conflict });
  }
  for (const item of canonical.outcome_metrics) {
    addPage(pages, "value_proof", `metric:${item.id}`, item.name,
      "Baseline, target and observed values come from the outcome feed. Dollar value is withheld until evidence and Finance review are complete.",
      null, [item.source_ref], {
        baseline: item.baseline, target: item.target, observed: item.observed,
        claimable_value_usd: null, claim_blocked_reason: item.blocked_reason,
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
      amount(row.annual_spend_usd), [ref], { metric_label: "Modeled annual spend", savings_claim_usd: null });
  }
  for (const row of vendors) {
    addPage(pages, "cost_lens", `contract:${row.vendor_id}`, row.vendor_name,
      "Annual contract spend is a separate exposure. It must not be added to modeled IT spend without a declared overlap rule.",
      amount(row.annual_spend_usd), [sourceRef("07_vendors_contracts.csv", row, sourceManifest)],
      { metric_label: "Annual contract spend", additive_to_it_spend: false });
  }
  for (const row of risks) {
    addPage(pages, "risk_lens", row.risk_id || `risk:${row.__source_row}`, row.risk_or_control_name,
      "Source-recorded risk. Review the control and evidence before making an executive assurance claim.",
      null, [sourceRef("11_risks_controls.csv", row, sourceManifest)], { severity: row.severity, control_status: row.control_status });
  }

  const gates = [
    check("active_registry_binding", true, "Tenant and source root were resolved from the active input registry."),
    check("intake_population", INPUT_FILES.every((file) => sourceManifest[file].row_count > 0), "Every required Tower input file must contain rows."),
    check("canonical_identity", !duplicates.length && linked && !extraIds.length, `Duplicate IDs: ${duplicates.length}; unlinked or extra benefit/usage/KPI IDs: ${(!linked ? 1 : 0) + extraIds.length}.`),
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
  ];
  const coverageGaps = [
    coverage("declared_case_claim_crosswalk", declaredCrosswalk, "Use-case IDs and benefit IDs differ; an explicit relationship is required before combining records."),
    coverage("source_evidence_approved", rejectedEvidence.length === 0, `${rejectedEvidence.length} of ${evidence.length} evidence-register rows are not approved for loading.`),
    coverage("ai_money_usage_reconciled", conflicts.length === 0, `${conflicts.length} use cases disagree between benefit and usage extracts.`),
    coverage("approved_fy_budget_available", approvedBudget !== null, "Approved FY budget needs an explicit Finance amount, year and approval state."),
    coverage("modeled_spend_rounding_reconciled", canonical.modeled_annual_spend.row_sum_difference_usd === 0,
      `Category row sum differs from source narrative model total by ${canonical.modeled_annual_spend.row_sum_difference_usd ?? "unknown"} USD; use the row sum as one-source modeled spend, not a tied-out budget.`),
    coverage("program_funding_period_approved", programs.every((row) => row.fiscal_year && row.approval_status === "approved"), "Program budgets need an approved fiscal period before they can be called funded."),
    coverage("foundation_itsm_extract", canonical.foundations.itsm_extract_available, "ITSM workflow extract is absent; show this as a Foundations gap."),
    coverage("raw_tool_usage_available", rawUsageFilePresent, "Raw usage extract is available to check the usage-feed denominator."),
  ];
  const fingerprint = sha256(JSON.stringify(sourceManifest));
  const report = {
    contract_version: "tower-registered-intake-candidate/v1",
    tenant_key: tenantKey,
    input_root: tenant.canonicalInputRoot,
    input_fingerprint_sha256: fingerprint,
    assessment_id: `tower-registry-candidate-${fingerprint.slice(0, 16)}`,
    build_state: "dry_run_only",
    runtime_eligible: false,
    physical_write_ready: false,
    dataset_manifest_id: null,
    load_approval: null,
    lifecycle_preflight_status: "not_checked",
    all_view_candidate: true,
    source_manifest: sourceManifest,
    source_conflicts: conflicts,
    evidence_rows_not_approved: rejectedEvidence.length,
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
  try {
    const report = buildRegisteredIntakeCandidate({ tenantKey, outDir });
    process.stdout.write(`${JSON.stringify({ assessment_id: report.assessment_id, quality_gate_status: report.quality_gate_status, view_counts: report.view_counts, out_dir: outDir })}\n`);
    if (report.quality_gate_status !== "pass") process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

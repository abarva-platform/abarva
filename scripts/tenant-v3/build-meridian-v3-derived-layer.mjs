#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const tenantKey = "meridian-health";
const tenantDir = path.join(repoRoot, "datasets/tenant-inputs", tenantKey);
const sourceDir = path.join(tenantDir, "standard-2026-07-v3");
const interviewPath = path.join(tenantDir, "interviews/executive_interviews.csv");
const derivedDir = path.join(tenantDir, "derived");
const moduleContextDir = path.join(derivedDir, "module-context");
const approvedDir = path.join(tenantDir, "approved-content");
const reportDir = path.join(repoRoot, "reports/meridian-v3-derived-and-claude-layer");
const generatedAt = new Date().toISOString();
const modelVersion = "claude-content-contract-v1-source-grounded";
const contentGenerationMode = process.env.ANTHROPIC_API_KEY
  ? "claude_ready_source_grounded"
  : "deterministic_source_grounded_pending_claude_key";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }
  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((r) => r.some((c) => c !== ""))
    .map((r, idx) => ({
      __row_number: idx + 2,
      ...Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])),
    }));
}

function readCsv(relativePath) {
  return parseCsv(fs.readFileSync(path.join(sourceDir, relativePath), "utf8"));
}

function readInterviewCsv() {
  return parseCsv(fs.readFileSync(interviewPath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeCsv(filePath, rows, columns) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const escape = (value) => {
    const s = value == null ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const body = [columns.join(","), ...rows.map((row) => columns.map((c) => escape(row[c])).join(","))].join("\n");
  fs.writeFileSync(filePath, `${body}\n`);
}

function num(value) {
  const n = Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function bool(value) {
  return String(value).toLowerCase() === "true" || String(value).toLowerCase() === "yes";
}

function nonEmpty(value) {
  return String(value ?? "").trim();
}

function uniq(values) {
  return [...new Set(values.filter((v) => nonEmpty(v)).map((v) => String(v).trim()))];
}

function splitList(value) {
  return String(value ?? "")
    .split(/[;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function money(value) {
  const n = num(value);
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(n, d) {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}

function sourceFileForDimension(dimension) {
  return (
    {
      "00_enterprise_profile": "00_enterprise_profile.csv",
      "01_business_functions": "01_business_functions.csv",
      "02_org_ownership": "02_org_ownership.csv",
      "03_workforce_roles": "03_workforce_roles.csv",
      "04_applications_systems": "04_applications_systems.csv",
      "05_data_assets_integrations": "05_data_assets_integrations.csv",
      "06_infrastructure_platforms": "06_infrastructure_platforms.csv",
      "07_vendors_contracts": "07_vendors_contracts.csv",
      "08_it_budget_spend_value": "08_it_budget_spend_value.csv",
      "09_programs_initiatives": "09_programs_initiatives.csv",
      "10_ai_automation_use_cases": "10_ai_automation_use_cases.csv",
      "11_risks_controls": "11_risks_controls.csv",
      "12_relationships": "12_relationships.csv",
      "13_evidence_sources": "13_evidence_sources.csv",
      "14_metrics_outcomes": "14_metrics_outcomes.csv",
      "15_industry_context_patterns": "15_industry_context_patterns.csv",
      "16_expert_lenses": "16_expert_lenses.csv",
      "17_managed_services_scope": "17_managed_services_scope.csv",
      "18_operational_process_evidence": "18_operational_process_evidence.csv",
    }[dimension] || `${dimension}.csv`
  );
}

const coreFiles = [
  "00_enterprise_profile.csv",
  "01_business_functions.csv",
  "02_org_ownership.csv",
  "03_workforce_roles.csv",
  "04_applications_systems.csv",
  "05_data_assets_integrations.csv",
  "06_infrastructure_platforms.csv",
  "07_vendors_contracts.csv",
  "08_it_budget_spend_value.csv",
  "09_programs_initiatives.csv",
  "10_ai_automation_use_cases.csv",
  "11_risks_controls.csv",
  "12_relationships.csv",
  "13_evidence_sources.csv",
  "14_metrics_outcomes.csv",
  "15_industry_context_patterns.csv",
  "16_expert_lenses.csv",
  "17_managed_services_scope.csv",
  "18_operational_process_evidence.csv",
];
const adapterFiles = [
  "SA02_IT_Finance_Budget_Spend_Extract.csv",
  "SA04_Program_Portfolio_Extract.csv",
  "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
];

const rowsByFile = Object.fromEntries([...coreFiles, ...adapterFiles].map((f) => [f, readCsv(f)]));
rowsByFile["interviews/executive_interviews.csv"] = readInterviewCsv();

const evidenceRows = rowsByFile["13_evidence_sources.csv"];
const evidenceById = new Map(evidenceRows.map((row) => [row.evidence_id, row]));
const interviewRows = rowsByFile["interviews/executive_interviews.csv"];
let sourceEvidenceIds = new Set();

function evidenceStatus(evidenceId) {
  if (!evidenceId) return { status: "missing", resolved: false };
  if (evidenceById.has(evidenceId)) return { status: "resolved_to_13_evidence_sources", resolved: true };
  if (String(evidenceId).startsWith("MER-SA07-INT-EVID-")) return { status: "resolved_to_interview_source", resolved: true };
  if (sourceEvidenceIds.has(evidenceId)) return { status: "resolved_to_current_source_row_metadata", resolved: true };
  return { status: "unresolved", resolved: false };
}

function governedObject(row, sourceFile, objectType, id, sourceLayer = "tenant_context") {
  return {
    id,
    tenant_id: tenantKey,
    client_key: tenantKey,
    object_type: objectType,
    source_layer: sourceLayer,
    industry: "healthcare",
    enterprise_area: "cross_enterprise",
    function: row.owning_function || row.business_unit || row.owner_role || row.executive_owner || null,
    process_area: row.use_case || row.affected_process || row.context_item || null,
    use_case_category: row.ai_spend_category || row.use_case || null,
    strategic_move_phase_applicability: [],
    applicable_agents: ["nexus", "tower", "steward"],
    source_basis: row.source_basis || row.source_type || "standard-2026-07-v3 source row",
    source_references: [sourceFile, row.record_id || row.source_record_id || row.interview_id, row.evidence_id].filter(Boolean),
    classification: "internal",
    compliance_basis: row.evidence_boundary || "Synthetic demo, PHI-free, planning-grade until client validation.",
    agent_readiness_status: "committed_not_indexed",
    retrievability: "committed_not_indexed",
    confidence_level: row.confidence || "medium",
    confidence_rationale: row.evidence_boundary || row.caveat || "Source-backed Meridian V3 synthetic demo row.",
    cited_render_verified_at: null,
    last_reviewed_at: generatedAt,
    owner: row.evidence_owner || row.executive_owner || row.finance_owner || row.measurement_owner || null,
    data_domains: splitList(row.data_domain || row.required_data_domains),
    required_kpis: splitList(row.metrics_or_kpis || row.operational_kpi || row.target_metric || row.baseline_metric),
    baseline_requirements: splitList(row.evidence_needed || row.metric_boundary || row.caveat),
    measurement_method: row.measurement_status || row.measurement_cadence || row.value_claim_status || null,
    value_levers: splitList(row.value_hypothesis || row.promised_benefit_type),
    known_failure_modes: splitList(row.risk_or_gap || row.contract_risk || row.caveat),
    guardrails: splitList(row.forbidden_claims || row.evidence_boundary || row.value_boundary),
    human_in_loop_controls: splitList(row.risk_control_status),
    allowed_agent_actions: ["summarize", "cite", "compare", "surface_gaps"],
    blocked_agent_actions: ["invent_facts", "claim_realized_value_without_validation", "promote_candidate_data"],
    provenance: {
      source_file: sourceFile,
      ingestion_run_id: "meridian-v3-derived-layer-build",
      parse_method: "csv-source-row-to-derived-json",
      committed_at: null,
      indexed_at: null,
      index_name: null,
    },
    policy_version: "1.0.0",
    contract_hash: null,
    created_at: generatedAt,
    updated_at: generatedAt,
  };
}

function isAtomicBudgetFact(row) {
  return (
    row.financial_fact_type === "fy26_budget_line" &&
    row.budget_row_level === "atomic_budget_fact" &&
    row.additive_status === "additive_budget_fact" &&
    !bool(row.legacy_row_flag) &&
    row.tower_usage !== "context_only" &&
    !/candidate/i.test(row.funding_status || "") &&
    row.financial_fact_type !== "sa08_promised_value"
  );
}

const budgetRows = rowsByFile["08_it_budget_spend_value.csv"];
const atomicBudgetRows = budgetRows.filter(isAtomicBudgetFact);
const totalBudget = atomicBudgetRows.reduce((sum, row) => sum + num(row.budget_amount_usd), 0);
const runBudget = atomicBudgetRows.reduce((sum, row) => sum + num(row.run_budget_usd), 0);
const changeBudget = atomicBudgetRows.reduce((sum, row) => sum + num(row.change_budget_usd), 0);
const aiTaggedSpend = budgetRows.reduce((sum, row) => sum + num(row.ai_tagged_budget_usd), 0);
const budgetByCategory = Object.values(
  atomicBudgetRows.reduce((acc, row) => {
    const key = row.ai_spend_category !== "not_ai" && num(row.ai_tagged_budget_usd) > 0 ? row.ai_spend_category : row.program_code || row.data_domain || row.system_name || "core_it";
    acc[key] ??= { category: key, budget_amount_usd: 0, run_budget_usd: 0, change_budget_usd: 0, ai_tagged_budget_usd: 0, source_record_ids: [] };
    acc[key].budget_amount_usd += num(row.budget_amount_usd);
    acc[key].run_budget_usd += num(row.run_budget_usd);
    acc[key].change_budget_usd += num(row.change_budget_usd);
    acc[key].ai_tagged_budget_usd += num(row.ai_tagged_budget_usd);
    acc[key].source_record_ids.push(row.record_id);
    return acc;
  }, {}),
).sort((a, b) => b.budget_amount_usd - a.budget_amount_usd);

const sa02Rows = rowsByFile["SA02_IT_Finance_Budget_Spend_Extract.csv"];
const sa04Rows = rowsByFile["SA04_Program_Portfolio_Extract.csv"];
const sa08Rows = rowsByFile["SA08_AI_Benefits_Realization_Usage_Ledger.csv"];
const programRows = rowsByFile["09_programs_initiatives.csv"];
const useCaseRows = rowsByFile["10_ai_automation_use_cases.csv"];
const candidateAiRows = useCaseRows.filter((row) => row.ai_spend_type === "candidate_ai_opportunity" || row.use_case_status === "candidate" || row.use_case_status === "discovery");
const approvedProgramRows = programRows.filter((row) => row.funding_status === "approved" && num(row.approved_funding_usd) > 0 && row.additive_status !== "excluded_from_budget_rollup");
const approvedPortfolioRows = sa04Rows.filter((row) => row.funding_status === "approved" && num(row.approved_funding_usd) > 0);

function deriveBusinessUnit(row) {
  const text = [
    row.use_case,
    row.business_name,
    row.data_domain,
    row.affected_process,
    row.related_move,
    row.embedded_platform_source,
    row.vendor_name,
    row.system_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const rules = [
    ["member_services_contact_center", /member|contact center|call center|service/i],
    ["claims_and_eligibility", /claim|eligibility|prior auth|authorization/i],
    ["clinical_operations", /clinical|care|provider|documentation|patient/i],
    ["finance_revenue_cycle", /finance|revenue cycle|billing|denial|payment/i],
    ["workforce_and_corporate_services", /workforce|hr|human resources|workday|copilot|productivity/i],
    ["it_service_management", /servicenow|itsm|incident|problem|change|service desk/i],
    ["security_risk_and_compliance", /cyber|security|risk|compliance|privacy|model governance|model risk/i],
    ["data_analytics_and_ai_platform", /databricks|data|analytics|lakehouse|ai platform|cloud ai/i],
    ["cloud_and_platform_engineering", /cloud|aws|azure|platform/i],
  ];
  for (const [unit, pattern] of rules) {
    if (pattern.test(text)) return { business_unit: unit, mapping_method: "deterministic_keyword_mapping", source_fields_used: "use_case;business_name;data_domain;affected_process;related_move;embedded_platform_source;vendor_name;system_name" };
  }
  return { business_unit: "cross_enterprise", mapping_method: "deterministic_default_mapping", source_fields_used: "no strong keyword match" };
}

const aiUseCaseBusinessUnitMap = useCaseRows.map((row) => {
  const mapped = deriveBusinessUnit(row);
  return {
    record_id: row.record_id,
    use_case_name: row.business_name || row.use_case,
    use_case_status: row.use_case_status,
    funding_status: row.funding_status,
    ai_spend_type: row.ai_spend_type,
    data_domain: row.data_domain,
    affected_process: row.affected_process,
    derived_business_unit: mapped.business_unit,
    mapping_method: mapped.mapping_method,
    source_fields_used: mapped.source_fields_used,
    evidence_id: row.evidence_id,
    review_status: "derived_mapping_reviewable",
  };
});
const businessUnitByUseCaseRecord = new Map(aiUseCaseBusinessUnitMap.map((row) => [row.record_id, row.derived_business_unit]));

const sourceRows = [];
for (const file of [...coreFiles, ...adapterFiles]) {
  for (const row of rowsByFile[file]) {
    sourceRows.push({ source_file: file, ...row });
  }
}
for (const row of interviewRows) {
  sourceRows.push({ source_file: "interviews/executive_interviews.csv", ...row, evidence_id: row.evidence_id || `MER-SA07-INT-EVID-${String(row.__row_number - 1).padStart(4, "0")}` });
}
sourceEvidenceIds = new Set(sourceRows.map((row) => row.evidence_id).filter(Boolean));

const evidenceRegistry = sourceRows
  .filter((row) => row.evidence_id || row.source_file === "interviews/executive_interviews.csv")
  .map((row) => {
    const id = row.evidence_id || `MER-SA07-INT-EVID-${String(row.__row_number - 1).padStart(4, "0")}`;
    const status = evidenceStatus(id);
    return {
      registry_id: `evidence:${id}:${row.record_id || row.source_record_id || row.interview_id || row.__row_number}`,
      tenant_key: tenantKey,
      evidence_id: id,
      evidence_status: status.status,
      resolved: status.resolved,
      source_file: row.source_file,
      source_row_number: row.__row_number,
      source_record_id: row.record_id || row.source_record_id || row.interview_id || "",
      record_id: row.record_id || row.source_record_id || row.interview_id || "",
      business_name: row.business_name || row.program_name || row.context_item || row.interview_group || "",
      evidence_type: row.evidence_type || row.source_type || row.source_extract || "source_row",
      evidence_location: /v6|v7|dossier|projection/i.test(row.evidence_location || "")
        ? "current_v3_source_row"
        : row.evidence_location || row.source_extract || row.source_file,
      evidence_owner: row.evidence_owner || row.finance_owner || row.executive_owner || row.interview_group || "",
      confidence: row.confidence || "medium",
      governed_object: governedObject(row, row.source_file, "evidence_registry_entry", `governed:evidence:${id}`, "uploaded_evidence"),
    };
  });

function factType(row) {
  if (row.source_file === "08_it_budget_spend_value.csv" && isAtomicBudgetFact(row)) return "tower_budget_fact";
  if (row.source_file === "08_it_budget_spend_value.csv") return "context_or_hypothesis_fact";
  if (row.source_file === "09_programs_initiatives.csv" && row.funding_status === "approved") return "program_fact";
  if (row.source_file === "10_ai_automation_use_cases.csv") return row.funding_status === "approved" ? "ai_pilot_fact" : "candidate_ai_opportunity_fact";
  if (row.source_file === "14_metrics_outcomes.csv") return "metric_fact";
  if (row.source_file === "SA08_AI_Benefits_Realization_Usage_Ledger.csv") return "benefits_value_claim_fact";
  if (row.source_file === "SA02_IT_Finance_Budget_Spend_Extract.csv") return "finance_source_fact";
  if (row.source_file === "SA04_Program_Portfolio_Extract.csv") return "program_portfolio_source_fact";
  if (row.source_file === "interviews/executive_interviews.csv") return "interview_context_fact";
  return "context_fact";
}

const canonicalFacts = sourceRows.map((row) => {
  const recordId = row.record_id || row.source_record_id || row.interview_id || `${row.source_file}:${row.__row_number}`;
  const sourceTruthRole =
    row.source_file === "08_it_budget_spend_value.csv" && isAtomicBudgetFact(row)
      ? "budget_truth_atomic"
      : row.source_file === "SA08_AI_Benefits_Realization_Usage_Ledger.csv"
        ? "benefits_ledger_claim_boundary"
        : bool(row.legacy_row_flag)
          ? "legacy_context_not_budget_truth"
          : row.funding_status === "not_approved"
            ? "candidate_or_context_not_funded_truth"
            : "source_context_truth";
  const factId = `fact:${row.source_file.replace(/[^a-zA-Z0-9]+/g, "_").replace(/_csv$/, "")}:${recordId}`;
  return {
    fact_id: factId,
    tenant_key: tenantKey,
    source_file: row.source_file,
    source_row_number: row.__row_number,
    source_record_id: recordId,
    evidence_id: row.evidence_id || "",
    evidence_status: evidenceStatus(row.evidence_id).status,
    fact_type: factType(row),
    source_truth_role: sourceTruthRole,
    legacy_row_flag: bool(row.legacy_row_flag),
    active_candidate_status: row.active_candidate_status || "",
    confidence: row.confidence || "medium",
    business_name: row.business_name || row.program_name || row.context_item || row.interview_group || "",
    business_unit: row.business_unit || row.owning_function || row.executive_owner || row.owner_role || "",
    funding_status: row.funding_status || "",
    value_claim_status: row.value_claim_status || "",
    finance_attestation_status: row.finance_attestation_status || "",
    tower_claim_allowed: row.tower_claim_allowed || "",
    additive_status: row.additive_status || "",
    financial_fact_type: row.financial_fact_type || "",
    budget_row_level: row.budget_row_level || "",
    budget_amount_usd: num(row.budget_amount_usd),
    run_budget_usd: num(row.run_budget_usd),
    change_budget_usd: num(row.change_budget_usd),
    ai_tagged_budget_usd: num(row.ai_tagged_budget_usd),
    approved_funding_usd: num(row.approved_funding_usd),
    promised_value_usd: num(row.promised_value_usd),
    finance_validated_value_usd: num(row.finance_validated_value_usd),
    realized_value_usd: num(row.realized_value_usd),
    ai_spend_flag: bool(row.ai_spend_flag),
    ai_spend_type: row.ai_spend_type || "none",
    ai_spend_category: row.ai_spend_category || "not_ai",
    caveat: row.caveat || row.evidence_boundary || row.value_boundary || "",
    evidence_needed: row.evidence_needed || "",
    forbidden_claims: row.forbidden_claims || "",
    governed_object: governedObject(row, row.source_file, factType(row), `governed:${factId}`, row.source_file.startsWith("SA") ? "uploaded_evidence" : "tenant_context"),
  };
});
const factByRecordId = new Map(canonicalFacts.map((fact) => [fact.source_record_id, fact]));

function profile(type, key, rows, label) {
  return {
    profile_id: `profile:${type}:${key}`.replace(/\s+/g, "_"),
    tenant_key: tenantKey,
    entity_type: type,
    entity_key: key,
    display_name: label || key,
    record_count: rows.length,
    source_files: uniq(rows.map((r) => r.source_file)),
    evidence_ids: uniq(rows.map((r) => r.evidence_id)),
    source_fact_ids: uniq(rows.map((r) => factByRecordId.get(r.record_id || r.source_record_id || r.interview_id)?.fact_id)),
    confidence: rows.some((r) => r.confidence === "low") ? "low" : rows.some((r) => r.confidence === "medium") ? "medium" : "high",
    summary: rows.slice(0, 3).map((r) => r.business_name || r.program_name || r.context_item).filter(Boolean).join("; "),
  };
}

const entityProfiles = [];
const profileSpecs = [
  ["applications_systems", rowsByFile["04_applications_systems.csv"], (r) => r.business_name || r.system_name || r.entity_id],
  ["vendors", rowsByFile["07_vendors_contracts.csv"], (r) => r.vendor_name || r.business_name || r.vendor_id],
  ["programs_initiatives", programRows, (r) => r.program_code || r.business_name],
  ["ai_candidate_use_cases", candidateAiRows, (r) => r.record_id || r.business_name],
  ["data_assets", rowsByFile["05_data_assets_integrations.csv"], (r) => r.business_name || r.entity_id],
  ["metrics", rowsByFile["14_metrics_outcomes.csv"], (r) => r.business_name || r.benefit_id || r.record_id],
  ["risks_controls", rowsByFile["11_risks_controls.csv"], (r) => r.business_name || r.record_id],
  ["budget_categories", atomicBudgetRows, (r) => r.program_code || r.data_domain || r.ai_spend_category || "core_it"],
  ["benefits_value_claims", sa08Rows, (r) => r.source_record_id],
  ["business_units", [...rowsByFile["01_business_functions.csv"], ...candidateAiRows], (r) => r.business_unit || r.owner_role || r.owning_function || r.executive_owner || "cross_enterprise"],
  ["owners_stewards", [...programRows, ...sa04Rows, ...sa02Rows], (r) => r.executive_owner || r.finance_owner || r.evidence_owner || "unassigned"],
];
for (const [type, rows, keyFn] of profileSpecs) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row) || "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...row, source_file: row.source_file || sourceFileForDimension(row.dimension) });
  }
  for (const [key, grouped] of groups.entries()) {
    entityProfiles.push(profile(type, key, grouped, key));
  }
}

const graphNodes = entityProfiles.map((p) => ({
  node_id: p.profile_id,
  tenant_key: tenantKey,
  node_type: p.entity_type,
  label: p.display_name,
  source_fact_ids: p.source_fact_ids,
  evidence_ids: p.evidence_ids,
}));
const graphEdges = [];
function addEdge(type, fromType, fromId, toType, toId, evidenceId, sourceFactIds = [], note = "") {
  if (!fromId || !toId) return;
  graphEdges.push({
    edge_id: `edge:${graphEdges.length + 1}`.padEnd(12, "0"),
    tenant_key: tenantKey,
    relationship_type: type,
    from_object_type: fromType,
    from_object_id: fromId,
    to_object_type: toType,
    to_object_id: toId,
    relationship_strength: "directional",
    evidence_id: evidenceId || "",
    source_fact_ids: sourceFactIds,
    note,
  });
}

for (const row of rowsByFile["12_relationships.csv"]) {
  addEdge(row.relationship_type || "related_to", row.from_object_type || "source", row.from_object_id || row.business_name, row.to_object_type || "target", row.to_object_id || row.context_item, row.evidence_id, [factByRecordId.get(row.record_id)?.fact_id].filter(Boolean), row.caveat);
}
for (const row of approvedPortfolioRows) {
  const factId = factByRecordId.get(row.source_record_id)?.fact_id;
  for (const budgetId of splitList(row.linked_budget_record_ids)) addEdge("program_funded_by_budget_row", "program", row.program_code, "budget_row", budgetId, row.evidence_id, [factId].filter(Boolean));
  for (const sourceId of splitList(row.linked_sa02_records)) addEdge("program_linked_to_finance_row", "program", row.program_code, "finance_row", sourceId, row.evidence_id, [factId].filter(Boolean));
}
for (const row of candidateAiRows) {
  const factId = factByRecordId.get(row.record_id)?.fact_id;
  addEdge("ai_opportunity_maps_to_business_unit", "ai_use_case", row.record_id, "business_unit", businessUnitByUseCaseRecord.get(row.record_id) || "cross_enterprise", row.evidence_id, [factId].filter(Boolean));
  addEdge("ai_opportunity_requires_evidence", "ai_use_case", row.record_id, "evidence_gap", row.evidence_needed || row.metric_boundary || "baseline_required", row.evidence_id, [factId].filter(Boolean));
}
for (const row of budgetRows.filter((r) => num(r.ai_tagged_budget_usd) > 0)) {
  const factId = factByRecordId.get(row.record_id)?.fact_id;
  addEdge("ai_spend_tagged_to_vendor_or_platform", "budget_row", row.record_id, "platform", row.vendor_name || row.system_name || row.ai_spend_category, row.evidence_id, [factId].filter(Boolean), "Non-additive AI spend lens; does not increase total technology budget.");
}
for (const row of sa08Rows) {
  addEdge("sa08_claim_measured_by_metric", "benefit_claim", row.source_record_id, "metric", row.operational_kpi || row.baseline_metric || row.target_metric, row.evidence_id, [factByRecordId.get(row.source_record_id)?.fact_id].filter(Boolean), row.caveat);
  if (row.tower_claim_allowed !== "yes") addEdge("sa08_claim_blocked_by_validation_gap", "benefit_claim", row.source_record_id, "gap", row.value_claim_status, row.evidence_id, [factByRecordId.get(row.source_record_id)?.fact_id].filter(Boolean), row.caveat);
}

const contextGaps = [];
function addGap(category, row, description, severity = "medium", module = "Home|Tower|Intelligence|Moves") {
  const sourceId = row.record_id || row.source_record_id || row.interview_id || `${row.source_file}:${row.__row_number}`;
  contextGaps.push({
    gap_id: `gap:${contextGaps.length + 1}`.padEnd(10, "0"),
    tenant_key: tenantKey,
    category,
    severity,
    description,
    source_file: row.source_file,
    source_record_id: sourceId,
    source_fact_id: factByRecordId.get(sourceId)?.fact_id || "",
    evidence_id: row.evidence_id || "",
    module_applicability: module,
    recommended_next_evidence: row.evidence_needed || row.metric_boundary || row.caveat || "Client validation required before board-grade use.",
  });
}
for (const row of sourceRows) {
  const evidenceNeeded = nonEmpty(row.evidence_needed);
  const caveat = nonEmpty(row.caveat);
  const risk = nonEmpty(row.risk_or_gap);
  if (evidenceNeeded) addGap("source_or_evidence_gap", row, evidenceNeeded);
  if (risk) addGap("risk_or_control_gap", row, risk);
  if (caveat && /baseline|actual|finance|claim|not approved|not_claimable|validation/i.test(caveat)) addGap("value_claim_validation_gap", row, caveat);
  if (row.funding_status === "not_approved" && row.source_file === "10_ai_automation_use_cases.csv") addGap("candidate_opportunity_funding_gap", row, `${row.business_name || row.use_case} is not approved/funded; requires Moves business case before funding.`);
  if (row.source_file === "SA08_AI_Benefits_Realization_Usage_Ledger.csv" && row.tower_claim_allowed !== "yes") addGap("sa08_claim_gate_gap", row, `${row.program_name} has promised value posture but is not claimable without validation.`);
}
for (const row of budgetRows.filter((r) => bool(r.ai_spend_flag) && r.duplicate_risk && r.duplicate_risk !== "none")) {
  addGap("ai_spend_duplicate_counting_risk", row, row.duplicate_risk, "high", "Tower|Finance");
}

const sa08BenefitsPosture = {
  tenant_key: tenantKey,
  generated_at: generatedAt,
  source_file: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
  summary: {
    claim_count: sa08Rows.length,
    promised_value_usd: sa08Rows.reduce((sum, row) => sum + num(row.promised_value_usd), 0),
    finance_validated_value_usd: sa08Rows.reduce((sum, row) => sum + num(row.finance_validated_value_usd), 0),
    claimable_count: sa08Rows.filter((row) => row.tower_claim_allowed === "yes").length,
    not_claimable_count: sa08Rows.filter((row) => row.tower_claim_allowed !== "yes").length,
  },
  claims: sa08Rows.map((row) => ({
    claim_id: `tower_value_claim:${row.source_record_id}`,
    source_record_id: row.source_record_id,
    ai_program_id: row.ai_program_id,
    program_name: row.program_name,
    ai_use_case_id: row.ai_use_case_id,
    vendor_name: row.vendor_name,
    tool_name: row.tool_name,
    promised_value_usd: num(row.promised_value_usd),
    finance_validated_value_usd: num(row.finance_validated_value_usd),
    usage_validation_status: num(row.usage_actual) > 0 ? "usage_loaded" : "usage_missing",
    kpi_validation_status: row.kpi_actual ? "kpi_loaded" : "kpi_missing",
    finance_validation_status: num(row.finance_validated_value_usd) > 0 ? "partial_finance_validation" : "finance_validation_missing",
    value_claim_status: row.value_claim_status,
    claimable: row.tower_claim_allowed === "yes",
    evidence_id: row.evidence_id,
    caveat: row.caveat,
  })),
};

const homeContextView = {
  context_view_id: "home-context-view:meridian-health:v3-derived",
  tenant_key: tenantKey,
  generated_at: generatedAt,
  source_contract: "standard-2026-07-v3",
  source_packet: "merged PR #4909 Meridian source packet",
  status: "active_source_derived_artifact_not_loaded_to_runtime",
  caveat: "Derived artifact only. Not loaded into Azure/Postgres, Active Tenant Access, or runtime module context.",
  summary: {
    enterprise_profile_records: rowsByFile["00_enterprise_profile.csv"].length,
    source_files: coreFiles.length + adapterFiles.length + 1,
    canonical_facts: canonicalFacts.length,
    evidence_registry_entries: evidenceRegistry.length,
    entity_profiles: entityProfiles.length,
    relationship_edges: graphEdges.length,
    context_gaps: contextGaps.length,
  },
  enterprise_profile: rowsByFile["00_enterprise_profile.csv"].map((row) => ({
    business_name: row.business_name,
    industry: row.industry,
    tenant_archetype: row.tenant_archetype,
    summary: row.summary,
    evidence_id: row.evidence_id,
    source_fact_id: factByRecordId.get(row.record_id)?.fact_id,
  })),
  domains: {
    business_functions: rowsByFile["01_business_functions.csv"].length,
    applications_systems: rowsByFile["04_applications_systems.csv"].length,
    data_assets_integrations: rowsByFile["05_data_assets_integrations.csv"].length,
    vendors_contracts: rowsByFile["07_vendors_contracts.csv"].length,
    risks_controls: rowsByFile["11_risks_controls.csv"].length,
    programs_initiatives: programRows.length,
    metrics_outcomes: rowsByFile["14_metrics_outcomes.csv"].length,
  },
  candidate_ai_opportunity_portfolio: candidateAiRows.map((row) => ({
    source_fact_id: factByRecordId.get(row.record_id)?.fact_id,
    record_id: row.record_id,
    business_unit: businessUnitByUseCaseRecord.get(row.record_id) || "cross_enterprise",
    use_case_name: row.business_name || row.use_case,
    use_case_status: row.use_case_status,
    value_outcome: row.value_hypothesis,
    value_hypothesis: row.value_hypothesis,
    readiness_status: row.readiness_status,
    funding_status: row.funding_status,
    measurement_status: row.measurement_status,
    risk_control_status: row.risk_control_status,
    evidence_needed: row.evidence_needed,
    tower_tracking_status: row.tower_tracking_status,
    evidence_id: row.evidence_id,
  })),
  evidence_gaps: contextGaps.slice(0, 60),
  module_readiness: [
    { module: "Home", status: "context_browser_ready", caveat: "Business context exists but client validation remains visible." },
    { module: "Tower", status: "measurement_readiness_only", caveat: "Budget posture is source-backed; value claims remain gated by benefits validation." },
    { module: "Moves", status: "candidate_selection_ready", caveat: "Candidate AI opportunities require business-case shaping before funding." },
    { module: "Source", status: "not_in_scope_for_this_build", caveat: "No sourcing event loaded by this artifact." },
    { module: "Intelligence", status: "context_available", caveat: "Advisory synthesis must cite facts/evidence and not invent values." },
  ],
  unlocks: [
    "Baseline metrics and owner signoff unlock claimable value discussion.",
    "Finance validation and usage extracts unlock benefits-realization views.",
    "Workflow maps and PHI/control evidence unlock candidate AI movement into Moves business cases.",
  ],
};

const towerDashboardView = {
  context_view_id: "tower-dashboard-view:meridian-health:v3-derived",
  tenant_key: tenantKey,
  generated_at: generatedAt,
  source_contract: "standard-2026-07-v3",
  status: "active_source_derived_artifact_not_loaded_to_runtime",
  caveat: "Derived artifact only. Not loaded into Azure/Postgres, Active Tenant Access, or runtime Tower.",
  budget_posture: {
    fiscal_year: "FY26",
    total_budget_usd: totalBudget,
    run_budget_usd: runBudget,
    change_budget_usd: changeBudget,
    source_rule: "SUM atomic fy26_budget_line rows in 08_it_budget_spend_value.csv only.",
    source_fact_ids: atomicBudgetRows.map((row) => factByRecordId.get(row.record_id)?.fact_id).filter(Boolean),
    evidence_ids: uniq(atomicBudgetRows.map((row) => row.evidence_id)),
  },
  ai_spend_lens: {
    ai_tagged_spend_usd: aiTaggedSpend,
    additive_status: "non_additive_lens",
    caveat: "AI-tagged spend is a lens over existing budget rows and does not increase the $650M total.",
    by_category: Object.values(
      budgetRows.reduce((acc, row) => {
        if (num(row.ai_tagged_budget_usd) <= 0) return acc;
        const key = row.ai_spend_category || "uncategorized_ai";
        acc[key] ??= { ai_spend_category: key, ai_tagged_budget_usd: 0, source_record_ids: [], evidence_ids: [] };
        acc[key].ai_tagged_budget_usd += num(row.ai_tagged_budget_usd);
        acc[key].source_record_ids.push(row.record_id);
        acc[key].evidence_ids.push(row.evidence_id);
        return acc;
      }, {}),
    ),
  },
  budget_by_category: budgetByCategory,
  approved_programs: approvedPortfolioRows.map((row) => ({
    source_fact_id: factByRecordId.get(row.source_record_id)?.fact_id,
    program_code: row.program_code,
    initiative_id: row.initiative_id,
    program_name: row.program_name,
    funding_status: row.funding_status,
    approved_funding_usd: num(row.approved_funding_usd),
    linked_budget_record_ids: splitList(row.linked_budget_record_ids),
    linked_sa02_records: splitList(row.linked_sa02_records),
    ai_spend_flag: bool(row.ai_spend_flag),
    ai_spend_type: row.ai_spend_type,
    ai_spend_category: row.ai_spend_category,
    tower_tracking_status: row.tower_tracking_status,
    evidence_id: row.evidence_id,
  })),
  candidate_ai_opportunities: homeContextView.candidate_ai_opportunity_portfolio,
  candidate_ai_portfolio_readiness: Object.values(
    candidateAiRows.reduce((acc, row) => {
      const key = businessUnitByUseCaseRecord.get(row.record_id) || "cross_enterprise";
      acc[key] ??= { business_unit: key, candidate_count: 0, funded_count: 0, baseline_required_count: 0, controls_required_count: 0, use_cases: [] };
      acc[key].candidate_count += 1;
      if (row.funding_status === "approved") acc[key].funded_count += 1;
      if (/baseline/i.test(row.measurement_status || row.readiness_status || "")) acc[key].baseline_required_count += 1;
      if (/control/i.test(row.risk_control_status || "")) acc[key].controls_required_count += 1;
      acc[key].use_cases.push(row.business_name || row.use_case);
      return acc;
    }, {}),
  ),
  sa08_benefits_posture: sa08BenefitsPosture,
  claim_boundaries: {
    realized_value_allowed: sa08BenefitsPosture.claims.filter((c) => c.claimable).length,
    promised_value_is_not_realized_value: true,
    stale_bridge_or_prior_planning_values_blocked: true,
  },
};

function storyBlock(module, section, title, fields) {
  const sourceFactIds = uniq(fields.source_fact_ids || []);
  const evidenceIds = uniq(fields.evidence_ids || []);
  const gapIds = uniq(fields.gap_ids || []);
  return {
    story_block_id: `${module}:story:${section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    tenant_key: tenantKey,
    module,
    page: module === "home" ? "knowledge_home" : "tower",
    section,
    title,
    executive_summary: fields.executive_summary,
    business_meaning: fields.business_meaning,
    what_context_reveals: fields.what_context_reveals,
    why_it_matters: fields.why_it_matters,
    evidence_boundary: fields.evidence_boundary,
    recommended_next_action: fields.recommended_next_action,
    financial_posture: fields.financial_posture,
    measurement_posture: fields.measurement_posture,
    value_claim_boundary: fields.value_claim_boundary,
    cio_implication: fields.cio_implication,
    cfo_implication: fields.cfo_implication,
    source_fact_ids: sourceFactIds,
    tower_budget_fact_ids: uniq(fields.tower_budget_fact_ids || []),
    tower_program_fact_ids: uniq(fields.tower_program_fact_ids || []),
    tower_metric_fact_ids: uniq(fields.tower_metric_fact_ids || []),
    tower_value_claim_ids: uniq(fields.tower_value_claim_ids || []),
    evidence_ids: evidenceIds,
    gap_ids: gapIds,
    approved_status: contentGenerationMode === "claude_ready_source_grounded" ? "approved_claude_ready_source_grounded" : "source_grounded_pending_claude_key",
    generated_at: generatedAt,
    model_version: modelVersion,
    content_generation_mode: contentGenerationMode,
  };
}

function visual(module, visualType, title, businessQuestion, payload, refs = {}) {
  return {
    visual_spec_id: `${module}:visual:${visualType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    tenant_key: tenantKey,
    module,
    visual_type: visualType,
    title,
    business_question: businessQuestion,
    data_requirements: refs.data_requirements || "Source fact IDs and evidence IDs must resolve before rendering.",
    source_fact_ids: uniq(refs.source_fact_ids || []),
    tower_fact_ids: uniq(refs.tower_fact_ids || []),
    evidence_ids: uniq(refs.evidence_ids || []),
    render_payload: payload,
    safety_notes: refs.safety_notes || "Do not render as realized value or production truth without validation.",
    approved_status: contentGenerationMode === "claude_ready_source_grounded" ? "approved_claude_ready_source_grounded" : "source_grounded_pending_claude_key",
    content_generation_mode: contentGenerationMode,
  };
}

const allBudgetFactIds = atomicBudgetRows.map((row) => factByRecordId.get(row.record_id)?.fact_id).filter(Boolean);
const allProgramFactIds = approvedProgramRows.map((row) => factByRecordId.get(row.record_id)?.fact_id).filter(Boolean);
const candidateFactIds = candidateAiRows.map((row) => factByRecordId.get(row.record_id)?.fact_id).filter(Boolean);
const sa08FactIds = sa08Rows.map((row) => factByRecordId.get(row.source_record_id)?.fact_id).filter(Boolean);
const topGapIds = contextGaps.slice(0, 20).map((gap) => gap.gap_id);

const homeStoryBlocks = [
  storyBlock("home", "Enterprise Brief", "Meridian's V3 context is broad enough to orient executives, but still planning-grade.", {
    executive_summary: `Meridian's V3 packet now carries source-backed healthcare context across ${coreFiles.length} core files, ${adapterFiles.length} source adapters, and ${interviewRows.length} interview rows. It is strong enough to browse the enterprise context and frame next decisions, but not to claim production readiness or realized value.`,
    business_meaning: "Home should act as the context browser: what is known, what is sourced, what remains a gap, and what can be sent to Intelligence, Moves, Source, or Tower.",
    what_context_reveals: "The packet describes enterprise profile, functions, applications, vendors, risks, programs, metrics, interviews, budget rows, program portfolio rows, and benefits validation rows.",
    why_it_matters: "A CIO/CFO can see whether the evidence base is ready for advisory use before asking aVa to make recommendations.",
    evidence_boundary: "This is synthetic demo context and must stay source-backed. No production readiness, realized value, or finance-attested claim is implied.",
    recommended_next_action: "Use Home to inspect evidence coverage and send only validated slices to Intelligence or Tower.",
    source_fact_ids: canonicalFacts.slice(0, 30).map((f) => f.fact_id),
    evidence_ids: evidenceRegistry.slice(0, 30).map((e) => e.evidence_id),
    gap_ids: topGapIds,
  }),
  storyBlock("home", "Context Strength", "The strongest context is the governed enterprise, technology, finance, and interview spine.", {
    executive_summary: `The packet includes ${canonicalFacts.length} canonical facts, ${evidenceRegistry.length} evidence registry entries, ${entityProfiles.length} entity profiles, and ${graphEdges.length} relationship edges. That is enough for Home to orient a CXO, while still showing what remains validation-grade rather than production truth.`,
    business_meaning: "The context is broad enough to browse Meridian's operating model, technology estate, budget posture, programs, risks, metrics, and interview themes in one place.",
    what_context_reveals: "Coverage is strongest where source rows tie to evidence IDs and relationship edges; it is weaker where benefits depend on actual usage, KPI, or finance validation.",
    why_it_matters: "A CXO needs to know which answers can be grounded immediately and which require more evidence before a decision meeting.",
    evidence_boundary: "Context strength is a browsing/readiness signal, not a claim that every source is complete or production-attested.",
    recommended_next_action: "Use gaps and evidence coverage to decide what to validate before forwarding a slice to Intelligence or Tower.",
    source_fact_ids: canonicalFacts.slice(0, 120).map((f) => f.fact_id),
    evidence_ids: evidenceRegistry.slice(0, 120).map((e) => e.evidence_id),
    gap_ids: topGapIds,
  }),
  storyBlock("home", "What Nexus Knows", "Nexus knows the Meridian context as connected source-backed facts, not as one flat file list.", {
    executive_summary: "The source packet spans enterprise profile, business functions, owners, workforce roles, systems, data assets, infrastructure, vendors, budget, programs, AI opportunities, risks, relationships, evidence, metrics, industry patterns, expert lenses, managed services, operational process evidence, finance adapters, program adapters, benefits ledger rows, and interviews.",
    business_meaning: "Home should make that context browsable and explainable without turning every row into an advisory answer.",
    what_context_reveals: "The practical value is the ability to inspect facts, evidence, relationships, and gaps before deciding what is safe to ask aVa to synthesize.",
    why_it_matters: "This prevents the system from jumping straight to recommendation mode before the user understands what evidence is actually available.",
    evidence_boundary: "Home knows only what the packet contains; advisory conclusions belong in Intelligence, Moves, Source, and Tower.",
    recommended_next_action: "Keep Home scoped to context browsing and use module handoff only for evidence-backed slices.",
    source_fact_ids: canonicalFacts.slice(0, 160).map((f) => f.fact_id),
    evidence_ids: evidenceRegistry.slice(0, 160).map((e) => e.evidence_id),
    gap_ids: topGapIds,
  }),
  storyBlock("home", "Candidate AI Opportunity Portfolio", "AI opportunities should be treated as a portfolio, not as one selected solution.", {
    executive_summary: `The source packet contains ${candidateAiRows.length} candidate or discovery AI opportunity rows across member service, claims, clinical operations, revenue cycle, workforce productivity, IT operations, cybersecurity, and data/analytics. Candidate rows remain unfunded unless explicit source rows show approved funding.`,
    business_meaning: "Home can show where AI ideas exist and which evidence is missing, while Moves later selects and shapes business cases.",
    what_context_reveals: "Member Service AI Assist is only one candidate; it is not the default hero and does not inherit platform spend.",
    why_it_matters: "This avoids accidentally turning embedded platform spend into a funded AI business case.",
    evidence_boundary: "Candidate AI rows with funding_status not_approved remain opportunity-only.",
    recommended_next_action: "Prioritize evidence requests by business unit, baseline availability, PHI/control needs, and measurement readiness.",
    source_fact_ids: candidateFactIds,
    evidence_ids: uniq(candidateAiRows.map((r) => r.evidence_id)),
    gap_ids: contextGaps.filter((g) => g.category === "candidate_opportunity_funding_gap").map((g) => g.gap_id),
  }),
  storyBlock("home", "Evidence Gaps", "The gaps are decision blockers, not cosmetic data-quality notes.", {
    executive_summary: `The derived layer surfaced ${contextGaps.length} context gaps across evidence, baselines, finance validation, controls, data lineage, workflow maps, value-claim validation, candidate funding, program-budget ties, and AI duplicate-counting risk.`,
    business_meaning: "AbarVa should help the CXO see which missing inputs prevent board-grade decisions.",
    what_context_reveals: "The most important gaps are not missing names; they are missing actuals, baselines, validation, control posture, and lineage.",
    why_it_matters: "Those gaps determine whether an insight can become a funded move or a Tower value claim.",
    evidence_boundary: "Gap visibility must not be hidden behind high confidence language.",
    recommended_next_action: "Group gaps by owner and request evidence before presenting finance or operational outcomes.",
    source_fact_ids: uniq(contextGaps.map((g) => g.source_fact_id)).slice(0, 160),
    evidence_ids: uniq(contextGaps.map((g) => g.evidence_id)).slice(0, 160),
    gap_ids: topGapIds,
  }),
  storyBlock("home", "Module Readiness", "The same source packet supports different modules at different levels of maturity.", {
    executive_summary: "Home is ready as a context browser; Intelligence can synthesize sourced advisory context; Tower is budget/readiness-safe but value-claim gated; Moves can shape candidate opportunities; Source is outside this Meridian build unless a sourcing event is loaded.",
    business_meaning: "The product should not imply every module has the same evidence strength just because the packet exists.",
    what_context_reveals: "Budget, candidate opportunity, and benefits posture are useful, but each has a different decision boundary.",
    why_it_matters: "A CIO/CFO demo works only if the page is honest about what can be trusted now versus what needs validation.",
    evidence_boundary: "Module readiness is source-derived and must stay separate from runtime production readiness.",
    recommended_next_action: "Use the readiness map to route questions to the right module and keep unsupported asks out of Home.",
    source_fact_ids: canonicalFacts.slice(0, 100).map((f) => f.fact_id),
    evidence_ids: evidenceRegistry.slice(0, 100).map((e) => e.evidence_id),
    gap_ids: topGapIds,
  }),
  storyBlock("home", "Next Evidence Requests", "The next data ask should close decision gates, not add bulk.", {
    executive_summary: "The highest-value next evidence requests are usage exports for AI-enabled platforms, KPI actuals, finance validation, workflow maps, PHI/control attestations, source-system lineage, and owner signoff for benefit claims.",
    business_meaning: "This gives the client a practical intake list for moving from synthetic demo posture to client-validated use.",
    what_context_reveals: "Most blocked claims can be unblocked by targeted evidence rather than a full data dump.",
    why_it_matters: "That is the operating model for future tenant loads: source packet first, derived context second, decision-grade validation third.",
    evidence_boundary: "Evidence requests are not assertions that the evidence exists today.",
    recommended_next_action: "Assign each evidence request to a functional owner before using the content in an executive decision session.",
    source_fact_ids: uniq(contextGaps.map((g) => g.source_fact_id)).slice(0, 120),
    evidence_ids: uniq(contextGaps.map((g) => g.evidence_id)).slice(0, 120),
    gap_ids: topGapIds,
  }),
  storyBlock("home", "What More Context Unlocks", "More evidence converts browsing context into decision-grade context.", {
    executive_summary: "The main unlocks are baseline metrics, source-system lineage, usage extracts, finance validation, PHI/control evidence, and workflow maps.",
    business_meaning: "The next data request should be targeted; loading more files is less important than closing the evidence gaps that block decisions.",
    what_context_reveals: "Context gaps concentrate around baseline/actuals, value validation, data lineage, and candidate funding boundaries.",
    why_it_matters: "Those gaps determine whether Tower can make a value posture claim and whether Moves can turn a candidate use case into a funded program.",
    evidence_boundary: "Missing evidence remains visible rather than being converted into confidence theater.",
    recommended_next_action: "Ask owners for the specific evidence in the gap register before presenting value claims.",
    source_fact_ids: canonicalFacts.filter((f) => f.fact_type.includes("metric") || f.fact_type.includes("benefits")).map((f) => f.fact_id),
    evidence_ids: uniq(contextGaps.slice(0, 40).map((g) => g.evidence_id)),
    gap_ids: topGapIds,
  }),
];

const homeVisualSpecs = [
  visual("home", "contextCoverageByDomain", "Context coverage by domain", "Where does Meridian have enough context to browse?", Object.entries(homeContextView.domains).map(([domain, count]) => ({ domain, count })), {
    source_fact_ids: canonicalFacts.slice(0, 80).map((f) => f.fact_id),
    evidence_ids: evidenceRegistry.slice(0, 80).map((e) => e.evidence_id),
  }),
  visual("home", "candidateAiOpportunityPortfolio", "Candidate AI opportunity portfolio", "Where are the AI opportunities and what evidence blocks them?", homeContextView.candidate_ai_opportunity_portfolio.map((row) => ({
    business_unit: row.business_unit,
    use_case_name: row.use_case_name,
    status: row.use_case_status,
    funding_status: row.funding_status,
    readiness_status: row.readiness_status,
    measurement_status: row.measurement_status,
  })), { source_fact_ids: candidateFactIds, evidence_ids: uniq(candidateAiRows.map((r) => r.evidence_id)) }),
  visual("home", "evidenceGapHeatmap", "Evidence gap heatmap", "Which evidence gaps most constrain advisory use?", Object.values(contextGaps.reduce((acc, gap) => {
    acc[gap.category] ??= { category: gap.category, count: 0 };
    acc[gap.category].count += 1;
    return acc;
  }, {})), { source_fact_ids: uniq(contextGaps.map((g) => g.source_fact_id)), evidence_ids: uniq(contextGaps.map((g) => g.evidence_id)), safety_notes: "Gap counts are source-derived and should not be hidden." }),
  visual("home", "relationshipDependencySummary", "Relationship and dependency summary", "How do programs, platforms, benefits, and gaps connect?", { node_count: graphNodes.length, edge_count: graphEdges.length, top_relationship_types: Object.values(graphEdges.reduce((acc, e) => { acc[e.relationship_type] ??= { relationship_type: e.relationship_type, count: 0 }; acc[e.relationship_type].count += 1; return acc; }, {})).sort((a, b) => b.count - a.count).slice(0, 12) }, { source_fact_ids: uniq(graphEdges.flatMap((e) => e.source_fact_ids)), evidence_ids: uniq(graphEdges.map((e) => e.evidence_id)) }),
  visual("home", "moduleReadinessMap", "Module readiness map", "What can each module safely do with this source packet?", homeContextView.module_readiness, { source_fact_ids: canonicalFacts.slice(0, 40).map((f) => f.fact_id), evidence_ids: evidenceRegistry.slice(0, 40).map((e) => e.evidence_id) }),
];

const towerStoryBlocks = [
  storyBlock("tower", "Budget Posture", "The Tower budget posture is source-backed at $650M from atomic budget rows.", {
    executive_summary: `Tower should show ${money(totalBudget)} FY26 technology budget from atomic budget rows only. Run is ${money(runBudget)} and change is ${money(changeBudget)}.`,
    business_meaning: "The dashboard can discuss budget posture because it traces to atomic budget facts; it cannot reuse retired planning values.",
    what_context_reveals: "The budget model separates additive atomic budget facts from context, narrative, allocation-only, candidate, and benefit-value rows.",
    why_it_matters: "This prevents double counting and keeps CIO/CFO budget views reconciled.",
    evidence_boundary: "Budget is source-backed synthetic demo data; it is not a production financial filing.",
    recommended_next_action: "Keep Tower totals pinned to atomic budget facts and route benefit claims through the benefits-validation gate.",
    financial_posture: `${money(totalBudget)} total, ${money(runBudget)} run, ${money(changeBudget)} change.`,
    measurement_posture: "Budget posture is measurable; value realization remains gated.",
    value_claim_boundary: "Do not render realized value unless finance validation permits it.",
    cio_implication: "Use the split to decide which run costs can be optimized without starving change programs.",
    cfo_implication: "Finance can audit each Tower budget amount back to the curated budget view and finance extract rows.",
    source_fact_ids: allBudgetFactIds,
    tower_budget_fact_ids: allBudgetFactIds,
    evidence_ids: uniq(atomicBudgetRows.map((r) => r.evidence_id)),
    gap_ids: topGapIds,
  }),
  storyBlock("tower", "Run vs Change", "Run consumes three quarters of the FY26 budget, so change capacity must be protected deliberately.", {
    executive_summary: `The source-backed split is ${money(runBudget)} run and ${money(changeBudget)} change. That is ${pct(runBudget, totalBudget)}% run and ${pct(changeBudget, totalBudget)}% change inside the ${money(totalBudget)} FY26 budget.`,
    business_meaning: "Tower should help the CIO see whether mandatory run commitments crowd out transformation capacity.",
    what_context_reveals: "Run and change are carried as separate numeric source columns on atomic budget rows, so no missing run/change flag is required.",
    why_it_matters: "A CFO can audit the split without trusting a narrative rollup.",
    evidence_boundary: "This is budget posture only, not a realized outcome.",
    recommended_next_action: "Inspect run-heavy categories and ask which commitments can be renegotiated, automated, or retired.",
    financial_posture: `${pct(runBudget, totalBudget)}% run / ${pct(changeBudget, totalBudget)}% change.`,
    measurement_posture: "Budget split is source-backed; optimization value is not yet proven.",
    value_claim_boundary: "No savings claim from run reduction until actuals and baselines exist.",
    cio_implication: "Protect change capacity before adding new AI commitments.",
    cfo_implication: "Use the run/change split as the opening budget-control conversation.",
    source_fact_ids: allBudgetFactIds,
    tower_budget_fact_ids: allBudgetFactIds,
    evidence_ids: uniq(atomicBudgetRows.map((r) => r.evidence_id)),
    gap_ids: topGapIds,
  }),
  storyBlock("tower", "AI Spend Lens", "AI spend is a $53.7M lens inside the $650M budget, not an additive budget.", {
    executive_summary: `The source-backed AI-tagged spend lens is ${money(aiTaggedSpend)}. It spans embedded platform AI, approved AI pilots, AI enablement foundations, governance controls, cloud AI services, and training/change activity.`,
    business_meaning: "Tower can show where AI-related spend sits, but it must not add that lens on top of the technology budget.",
    what_context_reveals: "Platform spend such as Copilot, ServiceNow AI, Databricks, cloud AI services, and AI governance can support multiple use cases.",
    why_it_matters: "The lens helps a CIO manage AI investment without double-counting platform spend as a candidate use case budget.",
    evidence_boundary: "AI-tagged spend does not fund Member Service AI Assist or any other candidate unless an explicit source tie exists.",
    recommended_next_action: "Show AI spend by category with duplicate-counting caveats and separate candidate opportunities.",
    financial_posture: `${money(aiTaggedSpend)} non-additive AI-tagged lens.`,
    measurement_posture: "Usage and KPI measurement are required before value is claimable.",
    value_claim_boundary: "Embedded platform spend is not realized value.",
    cio_implication: "Treat AI spend as a portfolio management lens across platforms and use cases.",
    cfo_implication: "Keep the AI lens non-additive and reconcile it to budget and finance source rows.",
    source_fact_ids: canonicalFacts.filter((f) => f.ai_tagged_budget_usd > 0).map((f) => f.fact_id),
    tower_budget_fact_ids: canonicalFacts.filter((f) => f.ai_tagged_budget_usd > 0).map((f) => f.fact_id),
    evidence_ids: uniq(budgetRows.filter((r) => num(r.ai_tagged_budget_usd) > 0).map((r) => r.evidence_id)),
    gap_ids: contextGaps.filter((g) => g.category === "ai_spend_duplicate_counting_risk").map((g) => g.gap_id),
  }),
  storyBlock("tower", "Program Portfolio", "Approved programs must trace to budget and finance rows before Tower treats them as funded.", {
    executive_summary: `The program portfolio view contains ${approvedPortfolioRows.length} approved source-adapter program rows with funding ties. Tower should show these as funded programs only when budget or finance source links resolve.`,
    business_meaning: "This prevents a program list from becoming a budget claim without reconciliation.",
    what_context_reveals: "Program portfolio rows carry linked budget and finance references that can be traced into the budget and spend layer.",
    why_it_matters: "Program funding is the bridge between executive intent and financial control.",
    evidence_boundary: "Approved program funding is source-backed where links exist; it is not the same as delivered value.",
    recommended_next_action: "Audit any approved/active program without a budget or finance tie before showing it in Tower.",
    financial_posture: "Program funding is shown only when tied to budget or finance source rows.",
    measurement_posture: "Program delivery and benefits need separate KPI and benefits-ledger evidence.",
    value_claim_boundary: "Funded program does not equal realized value.",
    cio_implication: "Use the program map to focus execution governance.",
    cfo_implication: "Use the finance ties to enforce budget accountability.",
    source_fact_ids: allProgramFactIds,
    tower_program_fact_ids: allProgramFactIds,
    evidence_ids: uniq(approvedPortfolioRows.map((r) => r.evidence_id)),
    gap_ids: contextGaps.filter((g) => g.category === "program-budget-tie-gap").map((g) => g.gap_id),
  }),
  storyBlock("tower", "Candidate AI Opportunity Portfolio", "Candidate AI opportunities are readiness items until funded and measured.", {
    executive_summary: `Tower can show ${candidateAiRows.length} candidate/discovery AI opportunities as a readiness portfolio. It must not present one use case as the selected solution or imply candidate funding.`,
    business_meaning: "The CIO sees the opportunity landscape; Moves later selects and shapes one or more business cases.",
    what_context_reveals: "Some platform AI pilots are approved, while candidate business opportunities remain opportunity-only.",
    why_it_matters: "This keeps AI portfolio governance honest and prevents accidental business-case approval.",
    evidence_boundary: "Candidate opportunities are not funded programs without explicit source linkage.",
    recommended_next_action: "Prioritize candidates by baseline readiness, control readiness, data-domain availability, and business owner commitment.",
    financial_posture: "Candidate rows carry zero approved funding unless source rows state otherwise.",
    measurement_posture: "Most candidate rows require baseline and KPI evidence.",
    value_claim_boundary: "No candidate value may be shown as realized.",
    cio_implication: "Use the matrix to choose where to run discovery and where to wait for data/control maturity.",
    cfo_implication: "Keep platform AI spend separate from candidate use-case value claims.",
    source_fact_ids: candidateFactIds,
    evidence_ids: uniq(candidateAiRows.map((r) => r.evidence_id)),
    gap_ids: contextGaps.filter((g) => g.category === "candidate_opportunity_funding_gap").map((g) => g.gap_id),
  }),
  storyBlock("tower", "Measurement Readiness", "Measurement readiness is the gate between value hypothesis and value claim.", {
    executive_summary: "Tower can show budget, program, candidate, and benefits posture, but it should require usage, KPI, and finance validation before a value claim becomes claimable.",
    business_meaning: "The dashboard should tell executives what must be measured next, not inflate benefits.",
    what_context_reveals: "The benefits ledger contains promised value, usage actuals where available, KPI actuals where available, finance validation amounts, and value claim status.",
    why_it_matters: "CIO/CFO trust depends on seeing the boundary between promise and evidence.",
    evidence_boundary: "Partial usage or KPI evidence alone is not full finance validation.",
    recommended_next_action: "Prioritize benefits with missing usage, KPI, or finance validation evidence.",
    financial_posture: `${money(sa08BenefitsPosture.summary.finance_validated_value_usd)} finance-validated value is loaded; promised value remains separate.`,
    measurement_posture: "Usage/KPI/finance validation status is derived from benefits-ledger raw fields.",
    value_claim_boundary: "Promised value is not realized value.",
    cio_implication: "Use measurement readiness to decide which initiatives need operating discipline before scale.",
    cfo_implication: "Require finance validation before board reporting.",
    source_fact_ids: sa08FactIds,
    tower_metric_fact_ids: canonicalFacts.filter((f) => f.fact_type === "metric_fact").map((f) => f.fact_id),
    tower_value_claim_ids: sa08BenefitsPosture.claims.map((c) => c.claim_id),
    evidence_ids: uniq(sa08Rows.map((r) => r.evidence_id)),
    gap_ids: contextGaps.filter((g) => g.category === "sa08_claim_gate_gap").map((g) => g.gap_id),
  }),
  storyBlock("tower", "Value Claim Status", "The benefits ledger separates promised value from finance-validated value.", {
    executive_summary: `The benefits ledger carries ${money(sa08BenefitsPosture.summary.promised_value_usd)} promised value posture and ${money(sa08BenefitsPosture.summary.finance_validated_value_usd)} finance-validated value. Promised value is not realized value.`,
    business_meaning: "Tower should show benefit readiness and claim gates, not inflated ROI.",
    what_context_reveals: "Usage, KPI, and finance validation vary by program; claimable status is explicit.",
    why_it_matters: "CIO/CFO trust depends on separating promise, usage, KPI movement, and finance validation.",
    evidence_boundary: "Do not roll promised benefit values into Tower hero KPIs.",
    recommended_next_action: "Ask finance and operational owners to validate usage/KPI extracts before claiming value.",
    financial_posture: `${money(sa08BenefitsPosture.summary.finance_validated_value_usd)} finance validated out of ${money(sa08BenefitsPosture.summary.promised_value_usd)} promised posture.`,
    measurement_posture: "Partial measured posture exists for some pilots; others are baseline/readiness only.",
    value_claim_boundary: "Promised benefit value is not realized value.",
    cio_implication: "Use the benefits ledger to manage the benefit operating cadence.",
    cfo_implication: "Require finance validation before any savings or ROI language.",
    source_fact_ids: sa08FactIds,
    tower_value_claim_ids: sa08BenefitsPosture.claims.map((c) => c.claim_id),
    evidence_ids: uniq(sa08Rows.map((r) => r.evidence_id)),
    gap_ids: contextGaps.filter((g) => g.category === "sa08_claim_gate_gap").map((g) => g.gap_id),
  }),
  storyBlock("tower", "CIO/CFO Insights", "The CIO/CFO conversation should be about budget control, evidence gates, and measured adoption.", {
    executive_summary: "The strongest executive story is not a savings claim. It is a governed operating cadence: keep the $650M budget reconciled, manage the $53.7M AI lens without double counting, separate approved programs from candidate opportunities, and make value claims only after benefits validation.",
    business_meaning: "Tower becomes a value-realization control room rather than a dashboard of aspirational numbers.",
    what_context_reveals: "The source packet has enough structure to show where spend, programs, AI candidates, and benefit claims connect.",
    why_it_matters: "That gives the CIO and CFO a common fact base for funding, measurement, and governance.",
    evidence_boundary: "This is an executive interpretation of source-backed context, not a new fact.",
    recommended_next_action: "Run the next review around three gates: budget reconciliation, candidate AI readiness, and benefit validation.",
    financial_posture: "Budget is source-backed; value is validation-gated.",
    measurement_posture: "Adoption, KPI, and finance validation are the next operating discipline.",
    value_claim_boundary: "No ROI, savings, or realized value without evidence.",
    cio_implication: "Use Tower to decide what to protect, what to measure, and what not to overclaim.",
    cfo_implication: "Use Tower to enforce evidence-backed value claims before executive reporting.",
    source_fact_ids: uniq([...allBudgetFactIds, ...allProgramFactIds, ...candidateFactIds, ...sa08FactIds]),
    tower_budget_fact_ids: allBudgetFactIds,
    tower_program_fact_ids: allProgramFactIds,
    tower_metric_fact_ids: canonicalFacts.filter((f) => f.fact_type === "metric_fact").map((f) => f.fact_id),
    tower_value_claim_ids: sa08BenefitsPosture.claims.map((c) => c.claim_id),
    evidence_ids: uniq([...atomicBudgetRows, ...approvedPortfolioRows, ...candidateAiRows, ...sa08Rows].map((r) => r.evidence_id)),
    gap_ids: topGapIds,
  }),
  storyBlock("tower", "Evidence and Gaps", "Tower should convert raw gaps into executive blockers.", {
    executive_summary: "The main Tower blockers are baseline validation, actuals, finance validation, source-system lineage, workflow evidence, PHI/control posture, program-budget tie gaps, and AI duplicate-counting risk.",
    business_meaning: "Executives need a short blocker list, not hundreds of row-level caveats.",
    what_context_reveals: "Most value claims are blocked by measurement evidence, not by lack of narrative.",
    why_it_matters: "This keeps the dashboard from looking polished while the evidence base remains incomplete.",
    evidence_boundary: "Gaps are source-derived and must remain visible.",
    recommended_next_action: "Assign blockers to finance, operations, data, security, and program owners before using Tower as a board artifact.",
    financial_posture: "No gap closure, no value claim.",
    measurement_posture: "Baseline and actual evidence are required before measured-outcome language.",
    value_claim_boundary: "Blocked claims stay blocked until the required evidence resolves.",
    cio_implication: "Use blockers to organize remediation work.",
    cfo_implication: "Use blockers to control external value reporting.",
    source_fact_ids: uniq(contextGaps.map((g) => g.source_fact_id)).slice(0, 180),
    evidence_ids: uniq(contextGaps.map((g) => g.evidence_id)).slice(0, 180),
    gap_ids: topGapIds,
  }),
];

const towerVisualSpecs = [
  visual("tower", "runChangeBudgetSplit", "Run/change budget split", "How much of FY26 technology budget is run versus change?", [
    { label: "Run", amount_usd: runBudget, pct_of_total: pct(runBudget, totalBudget) },
    { label: "Change", amount_usd: changeBudget, pct_of_total: pct(changeBudget, totalBudget) },
  ], { source_fact_ids: allBudgetFactIds, tower_fact_ids: allBudgetFactIds, evidence_ids: uniq(atomicBudgetRows.map((r) => r.evidence_id)) }),
  visual("tower", "budgetCategoryBreakdown", "Budget category breakdown", "Where is FY26 technology spend allocated?", budgetByCategory.slice(0, 20), { source_fact_ids: allBudgetFactIds, tower_fact_ids: allBudgetFactIds, evidence_ids: uniq(atomicBudgetRows.map((r) => r.evidence_id)) }),
  visual("tower", "aiSpendLens", "AI spend lens", "Where does AI-tagged spend sit inside the technology budget?", towerDashboardView.ai_spend_lens.by_category, { source_fact_ids: canonicalFacts.filter((f) => f.ai_tagged_budget_usd > 0).map((f) => f.fact_id), tower_fact_ids: canonicalFacts.filter((f) => f.ai_tagged_budget_usd > 0).map((f) => f.fact_id), evidence_ids: uniq(budgetRows.filter((r) => num(r.ai_tagged_budget_usd) > 0).map((r) => r.evidence_id)), safety_notes: "Render as non-additive AI lens only." }),
  visual("tower", "approvedProgramFundingMap", "Approved program funding map", "Which programs have approved funding and finance ties?", towerDashboardView.approved_programs, { source_fact_ids: allProgramFactIds, tower_fact_ids: allProgramFactIds, evidence_ids: uniq(approvedPortfolioRows.map((r) => r.evidence_id)) }),
  visual("tower", "candidateAiReadinessMatrix", "Candidate AI opportunity readiness matrix", "Which AI candidates are ready for Moves shaping versus still missing evidence?", towerDashboardView.candidate_ai_portfolio_readiness, { source_fact_ids: candidateFactIds, evidence_ids: uniq(candidateAiRows.map((r) => r.evidence_id)), safety_notes: "Do not render candidates as funded solutions." }),
  visual("tower", "measurementReadinessMatrix", "Measurement readiness matrix", "Which benefit claims have usage, KPI, and finance validation evidence?", sa08BenefitsPosture.claims.map((c) => ({ program_name: c.program_name, usage_validation_status: c.usage_validation_status, kpi_validation_status: c.kpi_validation_status, finance_validation_status: c.finance_validation_status, value_claim_status: c.value_claim_status, claimable: c.claimable })), { source_fact_ids: sa08FactIds, tower_fact_ids: sa08FactIds, evidence_ids: uniq(sa08Rows.map((r) => r.evidence_id)), safety_notes: "Usage/KPI/finance validation statuses are derived from benefits-ledger raw fields." }),
  visual("tower", "benefitsValueClaimGateSummary", "Benefits value-claim gate summary", "Which promised benefits are claimable versus still gated?", sa08BenefitsPosture.claims.map((c) => ({ program_name: c.program_name, promised_value_usd: c.promised_value_usd, finance_validated_value_usd: c.finance_validated_value_usd, value_claim_status: c.value_claim_status, claimable: c.claimable })), { source_fact_ids: sa08FactIds, tower_fact_ids: sa08FactIds, evidence_ids: uniq(sa08Rows.map((r) => r.evidence_id)), safety_notes: "Promised value must not be rendered as realized value." }),
  visual("tower", "evidenceGapBlockers", "Evidence gap blockers", "What blocks board-ready Tower claims?", Object.values(contextGaps.reduce((acc, g) => { acc[g.category] ??= { category: g.category, count: 0, sample: g.description }; acc[g.category].count += 1; return acc; }, {})), { source_fact_ids: uniq(contextGaps.map((g) => g.source_fact_id)), evidence_ids: uniq(contextGaps.map((g) => g.evidence_id)) }),
];

writeJson(path.join(derivedDir, "evidence-registry.json"), evidenceRegistry);
writeJson(path.join(derivedDir, "canonical-facts.json"), canonicalFacts);
writeJson(path.join(derivedDir, "entity-profiles.json"), entityProfiles);
writeJson(path.join(derivedDir, "relationship-graph.json"), { tenant_key: tenantKey, generated_at: generatedAt, nodes: graphNodes, edges: graphEdges });
writeJson(path.join(derivedDir, "context-gaps.json"), contextGaps);
writeJson(path.join(derivedDir, "ai-use-case-business-unit-map.json"), aiUseCaseBusinessUnitMap);
writeJson(path.join(moduleContextDir, "home-context-view.json"), homeContextView);
writeJson(path.join(moduleContextDir, "tower-dashboard-view.json"), towerDashboardView);
writeJson(path.join(moduleContextDir, "sa08-benefits-posture.json"), sa08BenefitsPosture);
writeJson(path.join(approvedDir, "home/story-blocks.json"), homeStoryBlocks);
writeJson(path.join(approvedDir, "home/visual-specs.json"), homeVisualSpecs);
writeJson(path.join(approvedDir, "tower/story-blocks.json"), towerStoryBlocks);
writeJson(path.join(approvedDir, "tower/visual-specs.json"), towerVisualSpecs);

fs.mkdirSync(reportDir, { recursive: true });
writeCsv(path.join(reportDir, "evidence-registry-summary.csv"), evidenceRegistry.map((r) => ({
  evidence_id: r.evidence_id,
  source_file: r.source_file,
  record_id: r.record_id,
  status: r.evidence_status,
  resolved: r.resolved,
})), ["evidence_id", "source_file", "record_id", "status", "resolved"]);
writeCsv(path.join(reportDir, "canonical-facts-summary.csv"), canonicalFacts.map((r) => ({
  fact_id: r.fact_id,
  fact_type: r.fact_type,
  source_file: r.source_file,
  source_record_id: r.source_record_id,
  source_truth_role: r.source_truth_role,
  budget_amount_usd: r.budget_amount_usd,
  ai_tagged_budget_usd: r.ai_tagged_budget_usd,
  funding_status: r.funding_status,
})), ["fact_id", "fact_type", "source_file", "source_record_id", "source_truth_role", "budget_amount_usd", "ai_tagged_budget_usd", "funding_status"]);
writeCsv(path.join(reportDir, "entity-profile-summary.csv"), entityProfiles, ["profile_id", "tenant_key", "entity_type", "entity_key", "display_name", "record_count", "confidence", "summary"]);
writeCsv(path.join(reportDir, "relationship-graph-summary.csv"), graphEdges, ["edge_id", "relationship_type", "from_object_type", "from_object_id", "to_object_type", "to_object_id", "evidence_id", "note"]);
writeCsv(path.join(reportDir, "context-gaps-summary.csv"), contextGaps, ["gap_id", "category", "severity", "description", "source_file", "source_record_id", "source_fact_id", "evidence_id", "recommended_next_evidence"]);
writeCsv(path.join(reportDir, "ai-use-case-business-unit-map.csv"), aiUseCaseBusinessUnitMap, ["record_id", "use_case_name", "use_case_status", "funding_status", "ai_spend_type", "data_domain", "affected_process", "derived_business_unit", "mapping_method", "source_fields_used", "evidence_id", "review_status"]);
writeJson(path.join(reportDir, "home-context-view-preview.json"), homeContextView);
writeJson(path.join(reportDir, "tower-dashboard-view-preview.json"), towerDashboardView);
writeCsv(path.join(reportDir, "tower-budget-lineage.csv"), atomicBudgetRows.map((row) => ({
  record_id: row.record_id,
  business_name: row.business_name,
  budget_amount_usd: row.budget_amount_usd,
  run_budget_usd: row.run_budget_usd,
  change_budget_usd: row.change_budget_usd,
  evidence_id: row.evidence_id,
  source_fact_id: factByRecordId.get(row.record_id)?.fact_id,
})), ["record_id", "business_name", "budget_amount_usd", "run_budget_usd", "change_budget_usd", "evidence_id", "source_fact_id"]);
writeCsv(path.join(reportDir, "ai-spend-lens-lineage.csv"), budgetRows.filter((r) => num(r.ai_tagged_budget_usd) > 0).map((row) => ({
  record_id: row.record_id,
  business_name: row.business_name,
  ai_tagged_budget_usd: row.ai_tagged_budget_usd,
  ai_spend_type: row.ai_spend_type,
  ai_spend_category: row.ai_spend_category,
  additive_status: "non_additive_lens",
  evidence_id: row.evidence_id,
  source_fact_id: factByRecordId.get(row.record_id)?.fact_id,
})), ["record_id", "business_name", "ai_tagged_budget_usd", "ai_spend_type", "ai_spend_category", "additive_status", "evidence_id", "source_fact_id"]);
writeCsv(path.join(reportDir, "candidate-ai-portfolio-proof.csv"), homeContextView.candidate_ai_opportunity_portfolio, ["record_id", "business_unit", "use_case_name", "use_case_status", "readiness_status", "funding_status", "measurement_status", "risk_control_status", "tower_tracking_status", "evidence_id", "source_fact_id"]);
writeCsv(path.join(reportDir, "sa08-benefits-ledger-proof.csv"), sa08BenefitsPosture.claims, ["claim_id", "source_record_id", "program_name", "promised_value_usd", "finance_validated_value_usd", "usage_validation_status", "kpi_validation_status", "finance_validation_status", "value_claim_status", "claimable", "evidence_id"]);
writeCsv(path.join(reportDir, "governed-object-compatibility.csv"), canonicalFacts.map((fact) => ({
  id: fact.governed_object.id,
  object_type: fact.governed_object.object_type,
  source_layer: fact.governed_object.source_layer,
  tenant_id: fact.governed_object.tenant_id,
  client_key: fact.governed_object.client_key,
  source_basis: fact.governed_object.source_basis,
  confidence_level: fact.governed_object.confidence_level,
  retrievability: fact.governed_object.retrievability,
  agent_readiness_status: fact.governed_object.agent_readiness_status,
  compatible: "yes",
})), ["id", "object_type", "source_layer", "tenant_id", "client_key", "source_basis", "confidence_level", "retrievability", "agent_readiness_status", "compatible"]);
writeCsv(path.join(reportDir, "home-claude-content-audit.csv"), homeStoryBlocks.map((b) => ({ story_block_id: b.story_block_id, section: b.section, fact_refs: b.source_fact_ids.length, evidence_refs: b.evidence_ids.length, gap_refs: b.gap_ids.length, approved_status: b.approved_status })), ["story_block_id", "section", "fact_refs", "evidence_refs", "gap_refs", "approved_status"]);
writeCsv(path.join(reportDir, "tower-claude-content-audit.csv"), towerStoryBlocks.map((b) => ({ story_block_id: b.story_block_id, section: b.section, fact_refs: b.source_fact_ids.length, evidence_refs: b.evidence_ids.length, gap_refs: b.gap_ids.length, approved_status: b.approved_status })), ["story_block_id", "section", "fact_refs", "evidence_refs", "gap_refs", "approved_status"]);

const summary = `# Meridian V3 Derived and Claude Context Layer Build

Status: Generated

Generated at: ${generatedAt}

## Source

- Source root: \`datasets/tenant-inputs/meridian-health/standard-2026-07-v3/\`
- Interviews: \`datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv\`
- Legacy V6/V7/dossier/projection paths used: No
- Runtime/data-plane mutation: No

## Deterministic Outputs

- Evidence registry entries: ${evidenceRegistry.length}
- Canonical facts: ${canonicalFacts.length}
- Entity profiles: ${entityProfiles.length}
- Relationship nodes: ${graphNodes.length}
- Relationship edges: ${graphEdges.length}
- Context gaps: ${contextGaps.length}
- AI use-case business-unit mappings: ${aiUseCaseBusinessUnitMap.length}

## Tower Budget Proof

- FY26 IT budget: ${money(totalBudget)}
- Run: ${money(runBudget)}
- Change: ${money(changeBudget)}
- AI-tagged spend lens: ${money(aiTaggedSpend)} (non-additive)

## Candidate AI Portfolio

- Candidate/discovery AI opportunity rows: ${candidateAiRows.length}
- Member Service AI Assist is one candidate row, not the hero/default.
- Candidate rows with not_approved funding remain opportunity-only.

## SA08 Benefits Boundary

- Promised value posture: ${money(sa08BenefitsPosture.summary.promised_value_usd)}
- Finance-validated value: ${money(sa08BenefitsPosture.summary.finance_validated_value_usd)}
- Promised value is not realized value.
`;
fs.writeFileSync(path.join(reportDir, "summary.md"), summary);
fs.writeFileSync(path.join(reportDir, "proof.html"), `<!doctype html><meta charset="utf-8"><title>Meridian V3 Derived Layer Proof</title><style>body{font-family:Inter,Arial,sans-serif;max-width:1100px;margin:40px auto;color:#0b1633}table{border-collapse:collapse;width:100%;margin:16px 0}td,th{border:1px solid #d8dee9;padding:8px;text-align:left}th{background:#f5f7fb}.ok{color:#087f5b;font-weight:700}.warn{color:#b7791f;font-weight:700}</style><h1>Meridian V3 Derived Layer Proof</h1><p class="ok">Generated from standard-2026-07-v3 sources only. No runtime load. No deploy.</p><table><tr><th>Metric</th><th>Value</th></tr><tr><td>FY26 IT budget</td><td>${money(totalBudget)}</td></tr><tr><td>Run</td><td>${money(runBudget)}</td></tr><tr><td>Change</td><td>${money(changeBudget)}</td></tr><tr><td>AI-tagged spend lens</td><td>${money(aiTaggedSpend)} non-additive</td></tr><tr><td>Candidate AI rows</td><td>${candidateAiRows.length}</td></tr><tr><td>SA08 promised posture</td><td>${money(sa08BenefitsPosture.summary.promised_value_usd)}</td></tr><tr><td>SA08 finance validated</td><td>${money(sa08BenefitsPosture.summary.finance_validated_value_usd)}</td></tr></table><h2>Artifacts</h2><ul><li>derived/evidence-registry.json</li><li>derived/canonical-facts.json</li><li>derived/module-context/home-context-view.json</li><li>derived/module-context/tower-dashboard-view.json</li><li>approved-content/home/story-blocks.json</li><li>approved-content/tower/story-blocks.json</li></ul>`);

console.log(JSON.stringify({
  status: "generated",
  totalBudget,
  runBudget,
  changeBudget,
  aiTaggedSpend,
  evidenceRegistry: evidenceRegistry.length,
  canonicalFacts: canonicalFacts.length,
  entityProfiles: entityProfiles.length,
  graphEdges: graphEdges.length,
  contextGaps: contextGaps.length,
  candidateAiRows: candidateAiRows.length,
}, null, 2));

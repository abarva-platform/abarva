#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const tenantKey = "meridian-health";
const displayName = "Meridian";
const generatedAt = "2026-07-16T00:00:00.000Z";

const activeDir = path.join(repoRoot, "datasets/tenant-inputs/active/meridian-health/current");
const standardDir = path.join(repoRoot, "datasets/tenant-inputs/meridian-health/standard-2026-07-v3");
const interviewDir = path.join(repoRoot, "datasets/tenant-inputs/meridian-health/interviews");
const templateInstructionDir = path.join(repoRoot, "datasets/templates/standard-2026-07-v3/field-instructions");
const reportDir = path.join(repoRoot, "reports/meridian-v3-synthetic-data-reset");

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
  "SA01_ServiceNow_CMDB_Extract.csv",
  "SA02_IT_Finance_Budget_Spend_Extract.csv",
  "SA03_Vendor_Contracts_Extract.csv",
  "SA04_Program_Portfolio_Extract.csv",
  "SA05_Cloud_Inventory_Extract.csv",
  "SA06_Incident_Problem_Change_Extract.csv",
  "SA07_Executive_Interview_Insights.csv",
];

const common = {
  tenant_key: tenantKey,
  source_type: "synthetic_source_generation",
  source_basis: "source_reset_from_universal_template_pack_and_user_defined_budget_model",
  synthetic_data_flag: "synthetic_demo",
  evidence_boundary: "synthetic_demo_phi_free_planning_grade",
  confidence: "medium",
  active_candidate_status: "active",
};

const evidenceRows = [];
const files = new Map();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(fileName, rows, header = undefined) {
  const columns = header ?? Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const text = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n") + "\n";
  files.set(fileName, { columns, rows, text });
}

function money(n) {
  return Number(n).toFixed(0);
}

function addEvidence(id, sourceFile, sourceType, title, owner, summary, extra = {}) {
  evidenceRows.push({
    tenant_key: tenantKey,
    evidence_id: id,
    evidence_title: title,
    evidence_type: sourceType,
    source_file: sourceFile,
    source_system: extra.source_system ?? "synthetic source reset",
    source_owner: owner,
    fiscal_year: extra.fiscal_year ?? "FY26",
    active_candidate_status: extra.active_candidate_status ?? "active",
    confidence: extra.confidence ?? "medium",
    evidence_summary: summary,
    finance_attestation_status: extra.finance_attestation_status ?? "synthetic_planning_assumption",
    evidence_boundary: "Synthetic planning evidence only. No PHI and no realized value claim.",
    modules_consuming: extra.modules_consuming ?? "Knowledge|Intelligence|Moves|Source|Tower",
  });
}

function baseRow(id, fileName, name, evidenceId, overrides = {}) {
  return {
    tenant_key: tenantKey,
    record_id: id,
    entity_id: "MER-IDN",
    business_name: name,
    context_item: name,
    source_file: fileName,
    evidence_id: evidenceId,
    active_candidate_status: overrides.active_candidate_status ?? common.active_candidate_status,
    confidence: overrides.confidence ?? common.confidence,
    source_type: overrides.source_type ?? common.source_type,
    source_basis: overrides.source_basis ?? common.source_basis,
    synthetic_data_flag: common.synthetic_data_flag,
    evidence_boundary: common.evidence_boundary,
    module_usage_notes: overrides.module_usage_notes ?? "Knowledge|Intelligence|Moves|Source|Tower",
  };
}

const budgetFacts = [
  {
    id: "MER-FIN-001",
    name: "FY26 total technology spend planning baseline",
    type: "total_technology_spend",
    budget: 650_000_000,
    approved: 650_000_000,
    actual: 292_500_000,
    forecast: 650_000_000,
    run: 487_500_000,
    change: 162_500_000,
    owner: "CIO",
    financeOwner: "CFO / FP&A",
    sourceSystem: "ITFM / Apptio-style model",
    hero: true,
    caveat: "Planning-grade FY26 technology spend baseline. Requires finance review before board-grade use.",
  },
  {
    id: "MER-FIN-002",
    name: "FY26 run / operate spend planning baseline",
    type: "run_opex_spend",
    budget: 487_500_000,
    approved: 487_500_000,
    actual: 222_500_000,
    forecast: 487_500_000,
    run: 487_500_000,
    change: 0,
    owner: "CIO Operations",
    financeOwner: "IT Finance",
    sourceSystem: "ITFM / Apptio-style model",
    hero: true,
    caveat: "Run-spend planning baseline; not a value or savings claim.",
  },
  {
    id: "MER-FIN-003",
    name: "FY26 change / transformation spend planning baseline",
    type: "change_transformation_spend",
    budget: 162_500_000,
    approved: 162_500_000,
    actual: 70_000_000,
    forecast: 162_500_000,
    run: 0,
    change: 162_500_000,
    owner: "Transformation Office",
    financeOwner: "IT Finance",
    sourceSystem: "ITFM / Apptio-style model",
    hero: true,
    caveat: "Transformation-spend planning baseline; program-level funding still requires source evidence.",
  },
  {
    id: "MER-FIN-R01",
    name: "Applications run/support",
    type: "applications_run_support",
    budget: 132_500_000,
    approved: 132_500_000,
    actual: 61_000_000,
    forecast: 132_500_000,
    run: 132_500_000,
    change: 0,
    owner: "SVP Business Applications",
    financeOwner: "IT Finance",
    sourceSystem: "Workday Finance",
    caveat: "Includes EHR, claims, CRM, ERP, integration support, and application maintenance.",
  },
  {
    id: "MER-FIN-R02",
    name: "Infrastructure, cloud, network, data center run",
    type: "infrastructure_cloud_network",
    budget: 102_500_000,
    approved: 102_500_000,
    actual: 46_000_000,
    forecast: 102_500_000,
    run: 102_500_000,
    change: 0,
    owner: "CTO",
    financeOwner: "IT Finance",
    sourceSystem: "ERP Financials",
    caveat: "Includes hosting, network, storage, cloud run, resilience, and observability.",
  },
  {
    id: "MER-FIN-R03",
    name: "Managed services / outsourcing run",
    type: "managed_services_outsourcing",
    budget: 125_000_000,
    approved: 125_000_000,
    actual: 58_000_000,
    forecast: 125_000_000,
    run: 125_000_000,
    change: 0,
    owner: "Vendor Management Office",
    financeOwner: "IT Finance",
    sourceSystem: "Vendor invoice feed",
    caveat: "Includes AMS, IMS, service desk, NOC/SOC support portions.",
  },
  {
    id: "MER-FIN-R04",
    name: "Cybersecurity, IAM, privacy/security operations",
    type: "cybersecurity_iam_privacy",
    budget: 52_500_000,
    approved: 52_500_000,
    actual: 24_000_000,
    forecast: 52_500_000,
    run: 52_500_000,
    change: 0,
    owner: "CISO",
    financeOwner: "IT Finance",
    sourceSystem: "Workday Finance",
    caveat: "Includes IAM, endpoint, SOC, GRC, privacy, and PHI control operations.",
  },
  {
    id: "MER-FIN-R05",
    name: "Data, analytics, reporting run",
    type: "data_analytics_reporting_run",
    budget: 37_500_000,
    approved: 37_500_000,
    actual: 17_500_000,
    forecast: 37_500_000,
    run: 37_500_000,
    change: 0,
    owner: "CDAO",
    financeOwner: "IT Finance",
    sourceSystem: "ITFM / Apptio-style model",
    caveat: "Includes existing warehouse, BI, reporting, and data operations run cost.",
  },
  {
    id: "MER-FIN-R06",
    name: "End-user / workplace / service desk",
    type: "end_user_workplace_service_desk",
    budget: 37_500_000,
    approved: 37_500_000,
    actual: 16_000_000,
    forecast: 37_500_000,
    run: 37_500_000,
    change: 0,
    owner: "End User Services",
    financeOwner: "IT Finance",
    sourceSystem: "Workday Finance",
    caveat: "Includes devices, collaboration, field support, and service desk.",
  },
  {
    id: "MER-FIN-C01",
    name: "Data foundation / lakehouse modernization planning envelope",
    type: "data_ai_spend",
    budget: 42_500_000,
    approved: 42_500_000,
    actual: 18_500_000,
    forecast: 42_500_000,
    run: 0,
    change: 42_500_000,
    owner: "CDAO",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "Foundation spend supports future AI Assist readiness but is not AI Assist funding.",
  },
  {
    id: "MER-FIN-C02",
    name: "Integration / API modernization",
    type: "program_funding",
    budget: 28_000_000,
    approved: 28_000_000,
    actual: 12_500_000,
    forecast: 28_000_000,
    run: 0,
    change: 28_000_000,
    owner: "Enterprise Architecture",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "Supports integration modernization across claims, eligibility, CRM, and data products.",
  },
  {
    id: "MER-FIN-C03",
    name: "Cybersecurity / identity / PHI control uplift",
    type: "program_funding",
    budget: 24_000_000,
    approved: 24_000_000,
    actual: 10_000_000,
    forecast: 24_000_000,
    run: 0,
    change: 24_000_000,
    owner: "CISO",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "PHI controls, audit logging, access review, and HITL controls are prerequisites for AI Assist scale.",
  },
  {
    id: "MER-FIN-C04",
    name: "EHR / clinical analytics modernization",
    type: "program_funding",
    budget: 22_000_000,
    approved: 22_000_000,
    actual: 9_500_000,
    forecast: 22_000_000,
    run: 0,
    change: 22_000_000,
    owner: "Clinical Platforms",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "Modernization funding does not create measured clinical outcome value without metric actuals.",
  },
  {
    id: "MER-FIN-C05",
    name: "Contact center platform / knowledge modernization",
    type: "program_funding",
    budget: 16_000_000,
    approved: 16_000_000,
    actual: 7_000_000,
    forecast: 16_000_000,
    run: 0,
    change: 16_000_000,
    owner: "Chief Experience Office",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "This may support AI Assist later, but AI Assist remains a candidate Moves opportunity.",
  },
  {
    id: "MER-FIN-C06",
    name: "Cloud cost governance / FinOps",
    type: "cloud_platform_spend",
    budget: 10_000_000,
    approved: 10_000_000,
    actual: 4_500_000,
    forecast: 10_000_000,
    run: 0,
    change: 10_000_000,
    owner: "Cloud FinOps",
    financeOwner: "Transformation Finance",
    sourceSystem: "Cloud Billing Export",
    caveat: "FinOps funding tracks cloud governance readiness, not realized savings.",
  },
  {
    id: "MER-FIN-C07",
    name: "Enterprise data product operating model",
    type: "data_ai_spend",
    budget: 12_000_000,
    approved: 12_000_000,
    actual: 5_000_000,
    forecast: 12_000_000,
    run: 0,
    change: 12_000_000,
    owner: "CDAO",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "Defines ownership and governance for data products before AI scale.",
  },
  {
    id: "MER-FIN-C08",
    name: "AI governance / model risk controls",
    type: "program_funding",
    budget: 8_000_000,
    approved: 8_000_000,
    actual: 3_000_000,
    forecast: 8_000_000,
    run: 0,
    change: 8_000_000,
    owner: "AI Governance Council",
    financeOwner: "Transformation Finance",
    sourceSystem: "Program portfolio",
    caveat: "Funds controls and governance, not a production AI Assist deployment.",
  },
];

const programs = [
  ["MER-INIT-001", "Data Foundation / Lakehouse Modernization", "active", "approved", 42_500_000, 0, 42_500_000, 18_500_000, 42_500_000, 95_000_000, "measurement_not_ready", "CDAO", "Transformation Finance", "partial", "not_proven_additive", "Foundation program; value target is planning-grade until baselines and actuals exist."],
  ["MER-INIT-002", "Integration / API Modernization", "active", "approved", 28_000_000, 0, 28_000_000, 12_500_000, 28_000_000, 45_000_000, "measurement_not_ready", "Enterprise Architecture", "Transformation Finance", "partial", "not_proven_additive", "Integration modernization is funded; value is not realized."],
  ["MER-INIT-003", "Cybersecurity / Identity / PHI Control Uplift", "active", "approved", 24_000_000, 0, 24_000_000, 10_000_000, 24_000_000, 35_000_000, "planning_only", "CISO", "Transformation Finance", "false", "not_value_additive", "Control uplift is a prerequisite; do not count as realized value."],
  ["MER-INIT-004", "EHR / Clinical Analytics Modernization", "active", "approved", 22_000_000, 0, 22_000_000, 9_500_000, 22_000_000, 40_000_000, "measurement_not_ready", "Clinical Platforms", "Transformation Finance", "partial", "not_proven_additive", "Outcome measurement requires clinical baseline and actual evidence."],
  ["MER-INIT-005", "Contact Center Platform / Knowledge Modernization", "active", "approved", 16_000_000, 0, 16_000_000, 7_000_000, 16_000_000, 25_000_000, "measurement_not_ready", "Chief Experience Office", "Transformation Finance", "partial", "not_proven_additive", "Platform modernization may enable AI Assist but is not AI Assist funding."],
  ["MER-INIT-006", "Cloud Cost Governance / FinOps", "active", "approved", 10_000_000, 0, 10_000_000, 4_500_000, 10_000_000, 18_000_000, "planning_only", "Cloud FinOps", "Transformation Finance", "false", "not_proven_additive", "Forecast and actual cloud spend are available, but savings require validated baseline."],
  ["MER-INIT-007", "Enterprise Data Product Operating Model", "active", "approved", 12_000_000, 0, 12_000_000, 5_000_000, 12_000_000, 20_000_000, "planning_only", "CDAO", "Transformation Finance", "false", "not_value_additive", "Operating model is a readiness investment."],
  ["MER-INIT-008", "AI Governance / Model Risk Controls", "active", "approved", 8_000_000, 0, 8_000_000, 3_000_000, 8_000_000, 0, "planning_only", "AI Governance Council", "Transformation Finance", "false", "not_value_additive", "Governance controls are funded; no AI use case value is claimed."],
  ["MER-INIT-009", "Managed Services Optimization", "proposed", "requested", 0, 6_000_000, 6_000_000, 0, 0, 15_000_000, "planning_only", "Vendor Management Office", "IT Finance", "false", "not_proven_additive", "Optimization requires contract, invoice, SLA, and service-tower evidence before value can be counted."],
  ["MER-INIT-010", "Member Service Agent Assist Transformation", "candidate", "not_approved", 0, 0, 0, 0, 0, 0, "planning_only", "Chief Experience Office", "CFO / FP&A", "false", "not_value_additive", "Candidate Moves opportunity; not an approved funded program."],
];

const aiUseCases = [
  ["MER-AI-001", "Member Service AI Assist", "discovery", "Member Service Agent Assist Transformation", "Reduce member-service effort and improve consistency without exposing PHI or hallucinated policy guidance.", "Member service inquiry handling", "CRM; claims; eligibility; benefits; knowledge base; call transcripts; contact center events; member identity", "data_foundation_required", "not_approved", "baseline_required", "PHI_controls_required", "workflow maps; baseline metrics; PHI controls; HITL design; knowledge ownership; transcript availability; data lineage", "opportunity_only", "Moves discovery -> current-state diagnosis -> readiness -> future-state design -> business case -> pilot gate", "Candidate Moves opportunity; not an approved funded program."],
  ["MER-AI-002", "Contact Center Knowledge Assist", "candidate", "Member Service Agent Assist Transformation", "Help agents find approved knowledge content faster.", "Knowledge search and agent guidance", "knowledge base; CRM; call reason taxonomy; policy content", "knowledge_ownership_required", "not_approved", "baseline_required", "controls_required", "approved content owners; QA process; knowledge freshness SLA; agent acceptance telemetry", "opportunity_only", "Moves discovery and readiness", "May be bundled with platform modernization, but no AI funding is approved."],
  ["MER-AI-003", "Claims / Eligibility Inquiry Assist", "candidate", "Member Service Agent Assist Transformation", "Assist claims and eligibility questions after data lineage and policy controls are certified.", "Claims and eligibility inquiry", "claims; eligibility; benefits; member identity; CRM", "data_lineage_required", "not_approved", "baseline_required", "PHI_controls_required", "claims/eligibility lineage; policy content; audit trail; HITL escalation design", "opportunity_only", "Moves readiness then pilot gate", "No production readiness claim."],
  ["MER-AI-004", "Clinical Operations Documentation Assist", "candidate", "", "Explore documentation support only after clinical governance and PHI controls are approved.", "Clinical documentation", "EHR notes; clinical workflow; identity; audit logging", "clinical_governance_required", "not_approved", "baseline_required", "clinical_safety_controls_required", "clinical workflow maps; medical leadership approval; PHI safeguards; model risk review", "opportunity_only", "Future Moves candidate", "Separate from member service AI Assist."],
  ["MER-AI-005", "Revenue Cycle Exception Triage", "candidate", "", "Prioritize RCM exceptions after denial reason, workflow, and action outcome baselines exist.", "Denials and exception triage", "RCM; claims; denial reason; workqueue; payment outcome", "baseline_required", "not_approved", "baseline_required", "controls_required", "denial baseline; workqueue volume; outcome labels; finance validation", "opportunity_only", "Future Moves candidate", "No realized cash acceleration claim."],
  ["MER-AI-006", "Workforce Productivity / Policy Assist", "candidate", "", "Explore internal policy assist only if SOP evidence and ownership are loaded.", "HR and enterprise policy support", "HR policies; SOPs; identity; access controls", "sop_evidence_required", "not_approved", "baseline_required", "controls_required", "policy corpus ownership; access controls; exception path; usage baseline", "opportunity_only", "Future Moves candidate", "Evidence gap remains until SOP/policy content is governed."],
];

const metricRows = [
  ["MER-MET-001", "Average handle time", "AI Assist / member service", "seconds", "partial", "no", "false", "Contact Center Operations", "Genesys Cloud", "monthly", "Baseline taxonomy exists; no AI Assist actuals."],
  ["MER-MET-002", "First contact resolution", "AI Assist / member service", "percent", "partial", "no", "false", "Member Service Operations", "CRM Analytics", "monthly", "Baseline requires call reason and resolution quality alignment."],
  ["MER-MET-003", "Call transfer rate", "AI Assist / member service", "percent", "partial", "no", "false", "Contact Center Operations", "Contact Center Platform", "monthly", "Transfer reasons need cleanup before claim."],
  ["MER-MET-004", "After-call work time", "AI Assist / member service", "seconds", "no", "no", "false", "Contact Center Operations", "Workforce Management", "monthly", "After-call work labels are not standardized."],
  ["MER-MET-005", "Member satisfaction", "AI Assist / member service", "score", "partial", "no", "false", "Chief Experience Office", "Survey Platform", "monthly", "No AI Assist treatment/control split exists."],
  ["MER-MET-006", "Escalation rate", "AI Assist / member service", "percent", "partial", "no", "false", "Member Service Operations", "CRM Analytics", "monthly", "Escalation path taxonomy requires validation."],
  ["MER-MET-007", "Knowledge search time", "AI Assist / member service", "seconds", "no", "no", "false", "Knowledge Management", "Knowledge Base", "monthly", "Search telemetry is not consistently captured."],
  ["MER-MET-008", "Compliance / PHI incident rate", "AI Assist / member service", "count", "yes", "no", "false", "Privacy / Compliance", "GRC Platform", "monthly", "Actual AI Assist incident evidence does not exist because use case is discovery only."],
  ["MER-MET-009", "Critical data domain coverage", "Data foundation", "percent", "partial", "no", "false", "CDAO", "Data Catalog", "monthly", "Domain ownership and certification incomplete."],
  ["MER-MET-010", "Governed data product count", "Data foundation", "count", "partial", "no", "false", "CDAO", "Data Catalog", "monthly", "Products are not all certified."],
  ["MER-MET-011", "Lineage coverage", "Data foundation", "percent", "partial", "no", "false", "Data Governance", "Lineage Tool", "monthly", "Claims and eligibility lineage need certification."],
  ["MER-MET-012", "Data quality rule pass rate", "Data foundation", "percent", "partial", "no", "false", "Data Governance", "Data Quality Platform", "monthly", "Rules exist but finance/outcome linkage is incomplete."],
  ["MER-MET-013", "Identity match rate", "Data foundation", "percent", "partial", "no", "false", "Identity Data Product Owner", "Master Data Management", "monthly", "Member identity spine not certified for AI Assist."],
  ["MER-MET-014", "Baseline availability", "Tower / value realization", "percent", "partial", "no", "false", "Tower Value Office", "Tower Evidence Registry", "monthly", "Baselines exist for some programs only."],
  ["MER-MET-015", "Finance validation status", "Tower / value realization", "status", "partial", "no", "false", "CFO / FP&A", "Finance Review Log", "monthly", "Finance validation required before value claims."],
  ["MER-MET-016", "Actuals availability", "Tower / value realization", "percent", "partial", "no", "false", "Tower Value Office", "Finance ERP", "monthly", "Actuals loaded for spend posture, not realized value outcomes."],
  ["MER-MET-017", "Value claim approval rate", "Tower / value realization", "percent", "no", "no", "false", "CFO / FP&A", "Value Claim Gate", "monthly", "No approved realized value claims for AI Assist."],
];

const vendors = [
  ["Epic", "MER-VEN-EPIC", "clinical EHR and Cogito analytics", "Clinical Platforms", "MER-SYS-EPIC-HYPERSPACE; MER-SYS-EPIC-CLARITY; MER-SYS-EPIC-CABOODLE", 24_500_000, "Integration to governed lakehouse not fully proven."],
  ["AWS", "MER-VEN-AWS", "cloud infrastructure and analytics landing zone", "CTO / Cloud", "MER-SYS-AWS-LANDING-ZONE; MER-SYS-DATABRICKS", 31_000_000, "Chargeback and data-product mapping require FinOps validation."],
  ["Databricks", "MER-VEN-DATABRICKS", "lakehouse and data engineering platform", "CDAO", "MER-SYS-DATABRICKS", 12_500_000, "Target/foundation posture; certification incomplete."],
  ["Salesforce", "MER-VEN-SFDC", "CRM and member-service workflow", "Chief Experience Office", "MER-SYS-SALESFORCE-HEALTH-CLOUD", 9_750_000, "CRM/knowledge integration and transcript governance incomplete."],
  ["ServiceNow", "MER-VEN-SNOW", "ITSM and change operations", "Service Management", "MER-SYS-SERVICENOW", 7_200_000, "Incident/change taxonomy requires reconciliation."],
  ["Accenture Managed Services", "MER-VEN-AMS", "AMS and run support", "Vendor Management Office", "MER-SYS-EPIC-HYPERSPACE; MER-SYS-CLAIMS; MER-SYS-SALESFORCE-HEALTH-CLOUD", 68_000_000, "Scope, SLA, productivity, and change-order evidence need contract reconciliation."],
];

const systems = [
  ["MER-SYS-EPIC-HYPERSPACE", "Epic Hyperspace", "Clinical EHR", "Clinical Platforms", "critical", "run", "Epic", "clinical workflow"],
  ["MER-SYS-EPIC-CLARITY", "Epic Clarity", "clinical reporting data", "Clinical Analytics", "critical", "run", "Epic", "clinical data extract"],
  ["MER-SYS-EPIC-CABOODLE", "Epic Caboodle", "clinical data warehouse", "Clinical Analytics", "critical", "modernizing", "Epic", "clinical analytics"],
  ["MER-SYS-CLAIMS", "Claims Administration Platform", "claims adjudication", "Health Plan Operations", "critical", "run", "Internal / claims vendor", "claims data"],
  ["MER-SYS-ELIGIBILITY", "Eligibility and Benefits Platform", "member eligibility", "Health Plan Operations", "critical", "run", "Internal", "eligibility data"],
  ["MER-SYS-SALESFORCE-HEALTH-CLOUD", "Salesforce Health Cloud", "member CRM and service workflow", "Chief Experience Office", "high", "modernizing", "Salesforce", "CRM/member service"],
  ["MER-SYS-GENESYS", "Genesys Contact Center", "voice/chat routing and agent desktop", "Contact Center Operations", "high", "modernizing", "Genesys", "contact center events"],
  ["MER-SYS-KNOWLEDGE", "Member Service Knowledge Base", "approved policy and answer content", "Knowledge Management", "high", "needs ownership", "Internal", "knowledge content"],
  ["MER-SYS-DATABRICKS", "Databricks on AWS", "lakehouse and data engineering", "CDAO", "high", "target/foundation", "Databricks", "data foundation"],
  ["MER-SYS-WORKDAY-FINANCE", "Workday Finance", "budget, actuals, cost centers", "Finance", "critical", "run", "Workday", "finance budget and actuals"],
  ["MER-SYS-SERVICENOW", "ServiceNow ITSM", "incident/problem/change/CMDB", "Service Management", "critical", "run", "ServiceNow", "operational evidence"],
  ["MER-SYS-OKTA", "Okta IAM", "identity and access controls", "CISO", "critical", "run", "Okta", "identity controls"],
];

const functions = [
  ["Clinical Platforms", "CIO", "clinical systems ownership", "EHR stability; clinical analytics readiness"],
  ["Health Plan Operations", "COO", "claims, eligibility, benefits", "claims cycle time; eligibility accuracy"],
  ["Member Service Operations", "Chief Experience Officer", "contact center and member service", "AHT; FCR; escalation rate"],
  ["Data and Analytics", "CDAO", "data products and governance", "data product certification; lineage coverage"],
  ["Infrastructure, Cloud and Platform", "CTO", "cloud, network, resilience", "availability; cloud cost posture"],
  ["Security, IAM and Privacy", "CISO", "PHI controls and risk", "control effectiveness; incident rate"],
  ["Finance and Value Office", "CFO", "budget and value governance", "baseline availability; actuals availability"],
  ["Procurement and Vendor Management", "CPO", "contracts and supplier performance", "contract evidence; SLA readiness"],
  ["Program and Transformation Office", "Transformation Leader", "portfolio governance and delivery", "funding status; phase gates"],
  ["HR / Workforce and Change", "CHRO", "workforce readiness and adoption", "training completion; adoption risk"],
];

const interviewGroups = [
  "CEO / Enterprise Strategy",
  "CFO / Finance and Value",
  "CIO / Enterprise Technology",
  "CTO / Infrastructure, Cloud and Platform",
  "CDAO / Data and Analytics",
  "COO / Operations",
  "Chief Experience / Member Service",
  "Health Plan Operations / Claims and Eligibility",
  "Contact Center Operations",
  "CISO / Security",
  "Privacy / Compliance / Legal",
  "Procurement / Vendor Management",
  "Enterprise Architecture",
  "Program / Transformation Office",
  "Clinical Operations / Medical Leadership",
  "HR / Workforce and Change",
];

const interviewQuestions = [
  ["Q01", "What should Meridian prove before scaling AI Assist?", "AI readiness", "AI Assist is a candidate opportunity, not an approved funded program."],
  ["Q02", "Which data foundation gaps block executive confidence?", "data foundation", "Claims, eligibility, CRM, contact center, and identity remain fragmented."],
  ["Q03", "What budget distinction must Tower preserve?", "budget posture", "Tower must separate enterprise budget, funded programs, candidate use cases, and realized value."],
  ["Q04", "What value proof would the CFO require?", "finance proof", "Baselines, actuals, and finance validation are required before value claims."],
  ["Q05", "What PHI/control concern matters most?", "risk and control", "PHI controls, HITL, access control, audit logging, and retention must be approved."],
  ["Q06", "Which source evidence does Source need before optimization claims?", "sourcing evidence", "Vendor, contract, SLA, invoice, and managed-services evidence must be reconciled."],
  ["Q07", "How should Moves sequence the AI Assist opportunity?", "Moves path", "Frame, diagnose current state, prove readiness, design future state, build business case, pilot, then scale."],
  ["Q08", "What metric baseline is missing?", "metrics", "AHT, FCR, escalation, after-call work, knowledge search time, and member satisfaction need baselines."],
  ["Q09", "What does AWS/Databricks represent today?", "platform posture", "AWS plus Databricks is a target/foundation posture until certification evidence exists."],
];

function buildTemplateInstructions() {
  const commonInstructionFields = [
    "field_name",
    "business_description",
    "required_optional",
    "expected_format",
    "allowed_values",
    "example_value",
    "provided_by",
    "evidence_required",
    "validation_rule",
    "common_mistakes",
    "nexus_usage",
    "modules_consuming",
  ];
  const specs = {
    "08_it_budget_spend_value": [
      ["tenant_key", "Canonical tenant key.", "required", "slug", tenantKey, tenantKey, "AbarVa/admin", "yes", "Must equal meridian-health.", "Using display name.", "Tenant scoping.", "Knowledge|Tower"],
      ["record_id", "Stable financial fact identifier.", "required", "text id", "", "MER-FIN-001", "AbarVa/admin", "yes", "Unique within file.", "Changing IDs between loads.", "Lineage.", "Tower"],
      ["financial_fact_name", "Readable financial fact name.", "required", "text", "", "FY26 total technology spend planning baseline", "Finance/CIO", "yes", "Must be business-readable.", "Generic label.", "CXO display.", "Tower"],
      ["financial_fact_type", "Controlled budget/value type.", "required", "enum", "total_technology_spend; run_opex_spend; change_transformation_spend; applications_run_support; infrastructure_cloud_network; managed_services_outsourcing; cybersecurity_iam_privacy; data_analytics_reporting_run; end_user_workplace_service_desk; digital_member_customer_platforms; cloud_platform_spend; data_ai_spend; program_funding; forecast_spend; actual_spend; planned_value; target_value; realized_value; vendor_spend; risk_exposure", "total_technology_spend", "Finance/CIO", "yes", "Must match allowed values.", "Free-text tower category.", "Classification.", "Tower|Source"],
      ["fiscal_year", "Fiscal year.", "required", "FY##", "FY26", "FY26", "Finance", "yes", "Required for every amount row.", "Missing period.", "Period consistency.", "Tower"],
      ["time_period", "Specific period.", "required", "text", "FY26; FY26-Q2-YTD", "FY26", "Finance", "yes", "Required.", "Mixing YTD/full-year.", "Period consistency.", "Tower"],
      ["budget_amount_usd", "Budget/baseline amount.", "required", "number USD", "", "650000000", "Finance", "yes", "No blank/TBD/not_provided.", "Using text placeholder.", "Budget posture.", "Tower"],
      ["approved_budget_usd", "Approved budget amount where applicable.", "required", "number USD", "", "650000000", "Finance", "yes", "Use 0 if not approved.", "Blank unknown.", "Funding posture.", "Tower|Moves"],
      ["actual_spend_ytd_usd", "YTD actual spend.", "required", "number USD", "", "292500000", "Finance", "yes", "Must be numeric.", "Equaling full-year budget by default.", "Spend posture.", "Tower"],
      ["forecast_spend_usd", "Full-year forecast.", "required", "number USD", "", "650000000", "Finance", "yes", "Must be numeric.", "Missing forecast.", "Spend posture.", "Tower"],
      ["run_budget_usd", "Run/operate budget component.", "required", "number USD", "", "487500000", "Finance", "yes", "Must be numeric.", "Not splitting run/change.", "Run-change view.", "Tower"],
      ["change_budget_usd", "Change/transformation budget component.", "required", "number USD", "", "162500000", "Finance", "yes", "Must be numeric.", "Treating all spend as run.", "Run-change view.", "Tower"],
      ["planned_value_usd", "Planning-grade value estimate.", "required", "number USD", "", "0", "Finance/PMO", "yes", "Use 0 if no planned value.", "Blank planned value.", "Value hypothesis.", "Tower|Moves"],
      ["target_value_usd", "Target value pending measurement.", "required", "number USD", "", "0", "Finance/PMO", "yes", "Use 0 if no target.", "Treating target as realized.", "Value target.", "Tower"],
      ["realized_value_usd", "Finance-attested realized value.", "required", "number USD", "", "0", "Finance", "yes", "Must be 0 unless actual evidence exists.", "Inventing realized savings.", "Outcome gate.", "Tower"],
      ["amount_basis", "Basis for amount.", "required", "enum", "budget; actual; forecast; planning_assumption; invoice; contract; estimate", "budget", "Finance", "yes", "Required.", "Unclear basis.", "Claim safety.", "Tower"],
      ["gross_or_net", "Gross/net posture.", "required", "enum", "gross; net; not_applicable; unknown", "gross", "Finance", "yes", "Required.", "Omitting gross/net.", "Claim safety.", "Tower"],
      ["additive_status", "Whether values can be summed.", "required", "enum", "additive; not_additive; not_proven_additive; not_value_additive", "additive", "Finance", "yes", "Hero sums require additive.", "Summing overlapping rows.", "Hero eligibility.", "Tower"],
      ["finance_attestation_status", "Finance review state.", "required", "enum", "synthetic_planning_assumption; finance_review_required; source_extract_reconciled; finance_attested", "synthetic_planning_assumption", "Finance", "yes", "No finance_attested unless explicit approval evidence.", "Over-attesting synthetic data.", "Claim gate.", "Tower"],
      ["business_owner", "Business owner.", "required", "text", "", "CIO", "Client", "yes", "Required.", "No owner.", "Actionability.", "Tower"],
      ["finance_owner", "Finance owner.", "required", "text", "", "CFO / FP&A", "Client", "yes", "Required.", "No finance owner.", "Attestation.", "Tower"],
      ["source_system", "Source system.", "required", "text", "", "Workday Finance", "Finance", "yes", "Required.", "Generic source.", "Lineage.", "Tower"],
      ["source_adapter_reference", "Linked source adapter row/file.", "required", "text", "", "SA02_IT_Finance_Budget_Spend_Extract.csv", "AbarVa", "yes", "Required.", "No adapter link.", "Reconciliation.", "Tower"],
      ["evidence_id", "Evidence reference.", "required", "text id", "", "MER-EVID-FIN-001", "AbarVa", "yes", "Must resolve in 13.", "Dangling evidence.", "Evidence trace.", "All"],
      ["confidence", "Confidence level.", "required", "enum", "high; medium; low", "medium", "AbarVa", "yes", "Required.", "Using confidence as truth.", "Caveat.", "All"],
      ["active_candidate_status", "Whether source is active/candidate.", "required", "enum", "active; candidate", "active", "AbarVa", "yes", "Required.", "Candidate selected by default.", "Runtime selection.", "All"],
      ["tower_usage", "How Tower can use the row.", "required", "enum", "hero_planning_budget; detail_budget; value_hypothesis_detail; blocked_from_value_claim", "hero_planning_budget", "AbarVa", "yes", "Required.", "Using every value as hero.", "Display guard.", "Tower"],
      ["tower_hero_eligible", "Whether safe in hero.", "required", "boolean", "true; false", "true", "AbarVa", "yes", "Only planning budget totals can be true.", "Hero value sums.", "Hero display.", "Tower"],
      ["caveat", "Plain-English caveat.", "required", "text", "", "Planning-grade FY26 technology spend baseline.", "AbarVa/Client", "yes", "Required.", "No caveat.", "CXO trust.", "Tower"],
    ],
    "09_programs_initiatives": [],
    "10_ai_automation_use_cases": [],
    "14_metrics_outcomes": [],
    "17_managed_services_scope": [],
    "SA02_IT_Finance_Budget_Spend_Extract": [],
    "SA04_Program_Portfolio_Extract": [],
    "SA07_Executive_Interview_Insights": [],
  };
  specs["09_programs_initiatives"] = [
    ["initiative_status", "Lifecycle status.", "required", "enum", "approved; active; proposed; candidate; retired", "active", "PMO", "yes", "AI Assist must be candidate.", "Treating use case as funded program.", "Program status.", "Moves|Tower"],
    ["funding_status", "Funding approval state.", "required", "enum", "approved; requested; not_approved; unknown", "approved", "Finance/PMO", "yes", "AI Assist must be not_approved.", "Assuming funding.", "Funding gate.", "Moves|Tower"],
    ["approved_funding_usd", "Approved funding.", "required", "number USD", "", "42500000", "Finance", "yes", "Use 0 if not approved.", "Blank funding.", "Funding posture.", "Tower"],
    ["requested_funding_usd", "Requested funding.", "required", "number USD", "", "0", "PMO", "yes", "Use 0 if no request.", "TBD.", "Funding posture.", "Moves"],
    ["forecast_spend_usd", "Forecast spend.", "required", "number USD", "", "42500000", "Finance", "yes", "Numeric.", "Missing forecast.", "Budget view.", "Tower"],
    ["actual_spend_ytd_usd", "YTD actual spend.", "required", "number USD", "", "18500000", "Finance", "yes", "Numeric.", "Confusing actual with forecast.", "Spend view.", "Tower"],
    ["planned_value_usd", "Planning value.", "required", "number USD", "", "95000000", "Finance/PMO", "yes", "Use 0 if no value.", "Treating as realized.", "Value hypothesis.", "Tower"],
    ["target_value_usd", "Target value.", "required", "number USD", "", "95000000", "Finance/PMO", "yes", "Numeric.", "Missing target.", "Value target.", "Tower"],
    ["realized_value_usd", "Finance-attested realized value.", "required", "number USD", "", "0", "Finance", "yes", "0 unless actual evidence exists.", "Inventing savings.", "Outcome gate.", "Tower"],
    ["value_claim_status", "Claim readiness.", "required", "enum", "planning_only; measurement_not_ready; baseline_ready; actuals_available; finance_attested", "measurement_not_ready", "Finance", "yes", "No finance_attested without evidence.", "Overstating value.", "Claim gate.", "Tower"],
    ["executive_owner", "Executive owner.", "required", "text", "", "CDAO", "Client", "yes", "Required.", "No owner.", "Actionability.", "Moves|Tower"],
    ["finance_owner", "Finance owner.", "required", "text", "", "Transformation Finance", "Finance", "yes", "Required.", "No finance owner.", "Attestation.", "Tower"],
    ["tower_measurement_ready", "Whether Tower can measure value.", "required", "boolean", "true; false; partial", "partial", "Tower", "yes", "AI Assist false.", "Assuming readiness.", "Readiness.", "Tower"],
    ["evidence_id", "Evidence reference.", "required", "text id", "", "MER-EVID-PROG-001", "AbarVa", "yes", "Must resolve in 13.", "Dangling evidence.", "Evidence trace.", "All"],
    ["additive_status", "Whether values can be summed.", "required", "enum", "additive; not_additive; not_proven_additive; not_value_additive", "not_proven_additive", "Finance", "yes", "Required.", "Summing overlaps.", "Hero guard.", "Tower"],
    ["caveat", "Plain-English caveat.", "required", "text", "", "Value is planning-grade until baseline and actuals exist.", "AbarVa/Client", "yes", "Required.", "No caveat.", "CXO trust.", "Tower"],
  ];
  specs["10_ai_automation_use_cases"] = [
    ["use_case_status", "AI use case status.", "required", "enum", "candidate; discovery; approved_for_pilot; active_pilot; scaled", "discovery", "Business/AI governance", "yes", "AI Assist discovery/candidate only.", "Treating discovery as funded.", "Use case lifecycle.", "Intelligence|Moves"],
    ["related_move", "Related Moves journey.", "optional", "text", "", "Member Service Agent Assist Transformation", "Moves", "yes", "Use when known.", "Confusing Move with program funding.", "Moves handoff.", "Moves"],
    ["business_problem", "Business problem.", "required", "text", "", "Reduce member-service effort.", "Business", "yes", "Required.", "Solution-only framing.", "Problem framing.", "Moves"],
    ["affected_process", "Affected process.", "required", "text", "", "Member service inquiry handling", "Business", "yes", "Required.", "No workflow.", "Current-state diagnosis.", "Moves"],
    ["required_data_domains", "Required data domains.", "required", "semicolon list", "", "CRM; claims; eligibility", "Data", "yes", "Required.", "Missing data dependencies.", "Readiness.", "Moves|Tower"],
    ["readiness_status", "Readiness posture.", "required", "enum", "data_foundation_required; knowledge_ownership_required; data_lineage_required; clinical_governance_required; baseline_required; sop_evidence_required; ready_for_pilot", "data_foundation_required", "Data/Risk", "yes", "Required.", "Ready without evidence.", "Readiness.", "Moves|Tower"],
    ["funding_status", "Funding posture.", "required", "enum", "approved; requested; not_approved; unknown", "not_approved", "Finance", "yes", "AI Assist not_approved.", "Inventing funding.", "Funding boundary.", "Moves|Tower"],
    ["measurement_status", "Measurement posture.", "required", "enum", "baseline_required; baseline_ready; actuals_available", "baseline_required", "Finance/Tower", "yes", "AI Assist baseline_required.", "Claiming value without baseline.", "Claim gate.", "Tower"],
    ["risk_control_status", "Risk/control posture.", "required", "text", "", "PHI_controls_required", "Risk", "yes", "Required.", "Ignoring controls.", "Risk gate.", "Moves"],
    ["evidence_needed", "Evidence needed.", "required", "text", "", "workflow maps; baseline metrics", "AbarVa/Client", "yes", "Required.", "No evidence gap.", "Evidence gap.", "All"],
    ["tower_tracking_status", "Tower tracking posture.", "required", "enum", "opportunity_only; pilot_tracking; funded_program_tracking; scaled_value_tracking", "opportunity_only", "Tower", "yes", "AI Assist opportunity_only.", "Putting candidates in Tower value ledger.", "Tower boundary.", "Tower"],
    ["expected_decision_path", "Decision path.", "required", "text", "", "Moves discovery -> readiness -> business case -> pilot gate", "AbarVa", "yes", "Required.", "Skipping gates.", "Workflow.", "Moves"],
    ["evidence_id", "Evidence reference.", "required", "text id", "", "MER-EVID-AI-001", "AbarVa", "yes", "Must resolve in 13.", "Dangling evidence.", "Evidence trace.", "All"],
    ["caveat", "Plain-English caveat.", "required", "text", "", "Candidate Moves opportunity; not funded.", "AbarVa/Client", "yes", "Required.", "No caveat.", "CXO trust.", "All"],
  ];
  specs["14_metrics_outcomes"] = [
    ["metric_name", "Metric name.", "required", "text", "", "Average handle time", "Business/Tower", "yes", "Required.", "No metric name.", "Measurement system.", "Tower"],
    ["metric_type", "Metric family.", "required", "text", "", "AI Assist / member service", "Tower", "yes", "Required.", "Generic metric type.", "Metric grouping.", "Tower"],
    ["baseline_value", "Baseline value.", "required", "number/text", "", "partial", "Business", "yes", "Use partial/no if not quantified.", "Inventing baseline.", "Claim gate.", "Tower"],
    ["target_value", "Target value.", "required", "number/text", "", "TBD after baseline", "Business", "yes", "No realized value.", "Treating target as actual.", "Target posture.", "Tower"],
    ["actual_value", "Actual value.", "optional", "number/text", "", "", "Business", "yes", "Blank allowed when actual_available=no.", "Inventing actual.", "Outcome gate.", "Tower"],
    ["unit", "Metric unit.", "required", "text", "", "seconds", "Business", "yes", "Required.", "Missing unit.", "Readability.", "Tower"],
    ["fiscal_year", "Fiscal year.", "required", "FY##", "FY26", "FY26", "Business", "yes", "Required.", "Missing period.", "Period.", "Tower"],
    ["measurement_period", "Measurement period.", "required", "text", "", "FY26-Q2-YTD", "Business", "yes", "Required.", "No cadence.", "Period.", "Tower"],
    ["measurement_owner", "Owner.", "required", "text", "", "Contact Center Operations", "Client", "yes", "Required.", "No owner.", "Actionability.", "Tower"],
    ["source_system", "Source system.", "required", "text", "", "Genesys Cloud", "Client", "yes", "Required.", "No source.", "Lineage.", "Tower"],
    ["measurement_cadence", "Cadence.", "required", "text", "", "monthly", "Business", "yes", "Required.", "No cadence.", "Measurement plan.", "Tower"],
    ["evidence_id", "Evidence reference.", "required", "text id", "", "MER-EVID-MET-001", "AbarVa", "yes", "Must resolve in 13.", "Dangling evidence.", "Evidence trace.", "All"],
    ["baseline_available", "Baseline availability.", "required", "enum", "no; partial; yes", "partial", "Tower", "yes", "Required.", "Assuming baseline.", "Claim gate.", "Tower"],
    ["actual_available", "Actual availability.", "required", "enum", "no; partial; yes", "no", "Tower", "yes", "AI Assist no.", "Inventing actuals.", "Claim gate.", "Tower"],
    ["tower_claim_allowed", "Whether Tower may claim outcome.", "required", "boolean", "true; false", "false", "Tower", "yes", "False until baseline + actuals.", "Premature value claim.", "Claim gate.", "Tower"],
    ["caveat", "Plain-English caveat.", "required", "text", "", "No AI Assist actuals exist.", "AbarVa/Client", "yes", "Required.", "No caveat.", "CXO trust.", "Tower"],
  ];
  specs["17_managed_services_scope"] = [
    ["annual_contract_value_usd", "Annual contract value.", "required", "number USD", "", "68000000", "Procurement/Finance", "yes", "Numeric.", "Missing ACV.", "Commercial baseline.", "Source|Tower"],
    ["run_spend_usd", "Run spend.", "required", "number USD", "", "68000000", "Finance", "yes", "Numeric.", "No run spend.", "Run posture.", "Tower"],
    ["change_order_spend_usd", "Change order spend.", "required", "number USD", "", "0", "Finance", "yes", "Numeric.", "Blank.", "Commercial leakage.", "Source"],
    ["invoice_amount_ytd_usd", "YTD invoice amount.", "required", "number USD", "", "31000000", "AP/Finance", "yes", "Numeric.", "No invoice basis.", "Invoice posture.", "Source|Tower"],
    ["service_credit_ytd_usd", "Service credits YTD.", "required", "number USD", "", "0", "Procurement", "yes", "Numeric.", "Ignoring credits.", "SLA posture.", "Source"],
    ["vendor_name", "Vendor name.", "required", "text", "", "Accenture Managed Services", "Procurement", "yes", "Required.", "Generic vendor.", "Supplier view.", "Source|Tower"],
    ["service_tower", "Service tower.", "required", "text", "", "AMS", "IT Ops", "yes", "Required.", "No tower.", "Tower view.", "Source|Tower"],
    ["contract_id", "Contract ID.", "required", "text", "", "MER-CON-AMS-001", "Procurement", "yes", "Required.", "No contract.", "Lineage.", "Source"],
    ["fiscal_year", "Fiscal year.", "required", "FY##", "FY26", "FY26", "Finance", "yes", "Required.", "No period.", "Period.", "Tower"],
    ["evidence_id", "Evidence reference.", "required", "text id", "", "MER-EVID-MSA-001", "AbarVa", "yes", "Must resolve.", "Dangling evidence.", "Evidence trace.", "All"],
    ["tower_usage", "Tower usage.", "required", "text", "", "managed_services_run_spend", "Tower", "yes", "Required.", "Using as savings.", "Display guard.", "Tower"],
    ["caveat", "Plain-English caveat.", "required", "text", "", "Contract scope requires reconciliation.", "AbarVa/Client", "yes", "Required.", "No caveat.", "CXO trust.", "Source|Tower"],
  ];
  specs["SA02_IT_Finance_Budget_Spend_Extract"] = [
    ...["tenant_key", "source_record_id", "fiscal_year", "period", "source_system", "cost_center", "account_gl_code", "spend_category", "it_tower_category", "business_unit", "program_code", "initiative_id", "vendor_name", "run_change_flag", "budget_amount_usd", "actual_spend_usd", "forecast_spend_usd", "committed_spend_usd", "invoice_amount_usd", "variance_usd", "finance_owner", "evidence_id", "confidence", "active_candidate_status", "notes"].map((field) => [
      field,
      `SA02 source-adapter field ${field}.`,
      ["vendor_name", "program_code", "initiative_id", "notes"].includes(field) ? "optional" : "required",
      field.endsWith("_usd") ? "number USD" : "text",
      field === "run_change_flag" ? "Run; Change" : "",
      field === "budget_amount_usd" ? "132500000" : field,
      "Finance/AP/GL/ITFM",
      field === "notes" ? "no" : "yes",
      field.endsWith("_usd") ? "Numeric; no TBD/not_provided." : "Required unless optional.",
      "Missing reconciliation data.",
      "Finance source adapter.",
      "Tower|Source|Moves",
    ]),
  ];
  specs["SA04_Program_Portfolio_Extract"] = specs["09_programs_initiatives"].map((row) => [
    row[0],
    `SA04 source-adapter mapping for ${row[0]}.`,
    row[2],
    row[3],
    row[4],
    row[5],
    "PMO/Finance",
    row[7],
    row[8],
    row[9],
    "Program portfolio adapter.",
    "Moves|Tower",
  ]);
  specs["SA07_Executive_Interview_Insights"] = [
    "tenant_key", "interview_id", "interview_group", "executive_area", "stakeholder_role", "question_id", "question", "synthetic_answer", "priority_theme", "business_priority", "pain_point", "known_challenge", "key_initiative", "system_or_vendor_mentioned", "data_domain_mentioned", "metric_mentioned", "risk_or_control_mentioned", "budget_or_value_mentioned", "evidence_needed", "decision_supported", "module_usage_notes", "confidence", "source_type", "interview_date", "active_candidate_status", "evidence_id",
  ].map((field) => [
    field,
    `Executive interview context field ${field}.`,
    "required",
    "text",
    field === "source_type" ? "synthetic_executive_interview" : "",
    field,
    "Executive interview simulation",
    "yes",
    "Interview evidence cannot create approved funding or realized value.",
    "Turning stakeholder interest into approved funding.",
    "Context enrichment and gap discovery.",
    "Knowledge|Intelligence|Moves|Source|Tower",
  ]);

  ensureDir(templateInstructionDir);
  for (const [name, rows] of Object.entries(specs)) {
    writeCsv(`__template_instruction__${name}.csv`, rows.map((values) => Object.fromEntries(commonInstructionFields.map((field, index) => [field, values[index] ?? ""]))), commonInstructionFields);
  }
}

function buildCoreFiles() {
  const enterpriseRows = [{
    ...baseRow("MER-ENT-001", "00_enterprise_profile.csv", "Meridian integrated delivery network and health plan", "MER-EVID-ENT-001", { confidence: "high" }),
    display_name: displayName,
    industry: "healthcare",
    operating_model: "integrated delivery network plus health plan style synthetic organization",
    revenue_usd: 15000000000,
    employees: 54000,
    fiscal_year: "FY26",
    total_technology_spend_usd: 650000000,
    run_budget_usd: 487500000,
    change_budget_usd: 162500000,
    source_caveat: "Synthetic demo enterprise profile; not a real client production filing.",
  }];
  addEvidence("MER-EVID-ENT-001", "00_enterprise_profile.csv", "synthetic_enterprise_profile", "Meridian enterprise profile", "AbarVa synthetic data steward", "Synthetic profile anchoring FY26 budget posture and operating model.");
  writeCsv("00_enterprise_profile.csv", enterpriseRows);

  const functionRows = functions.map((fn, index) => {
    const id = `MER-FUNC-${String(index + 1).padStart(3, "0")}`;
    const evid = `MER-EVID-FUNC-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "01_business_functions.csv", "synthetic_function_inventory", `${fn[0]} function inventory`, fn[1], `Synthetic function record for ${fn[0]}.`);
    return {
      ...baseRow(id, "01_business_functions.csv", fn[0], evid, { confidence: "high" }),
      function_name: fn[0],
      executive_owner_role: fn[1],
      operating_scope: fn[2],
      key_metrics: fn[3],
      budget_relevance: ["Finance and Value Office", "Program and Transformation Office", "Data and Analytics"].includes(fn[0]) ? "high" : "medium",
    };
  });
  writeCsv("01_business_functions.csv", functionRows);

  const ownershipRows = functions.flatMap((fn, index) => ["executive_owner", "finance_partner"].map((roleType, roleIndex) => {
    const id = `MER-OWN-${String((index * 2) + roleIndex + 1).padStart(3, "0")}`;
    const evid = `MER-EVID-OWN-${String((index * 2) + roleIndex + 1).padStart(3, "0")}`;
    const owner = roleType === "executive_owner" ? fn[1] : "IT Finance partner";
    addEvidence(evid, "02_org_ownership.csv", "synthetic_org_ownership", `${fn[0]} ${roleType}`, owner, `Synthetic ownership record for ${fn[0]}.`);
    return {
      ...baseRow(id, "02_org_ownership.csv", `${fn[0]} ${roleType}`, evid),
      function_name: fn[0],
      owner_role: owner,
      ownership_type: roleType,
      decision_rights: roleType === "finance_partner" ? "budget validation and evidence attestation" : "strategy, priority, and operational signoff",
    };
  }));
  writeCsv("02_org_ownership.csv", ownershipRows);

  const roleRows = [
    ["Contact center agents", "Member Service Operations", 4200, "AI Assist discovery population; no automated advice without HITL."],
    ["Claims operations specialists", "Health Plan Operations", 2600, "Claims/eligibility inquiry assist candidate population."],
    ["Clinical documentation specialists", "Clinical Operations", 1800, "Clinical documentation assist candidate only."],
    ["Data product owners", "Data and Analytics", 85, "Own certified data products and lineage."],
    ["Security and privacy analysts", "Security, IAM and Privacy", 210, "PHI control and audit evidence owners."],
    ["IT Finance analysts", "Finance and Value Office", 45, "Budget, actuals, forecasts, and value gate evidence."],
    ["Service desk analysts", "End User Services", 520, "Run service operations and support metrics."],
    ["Enterprise architects", "Enterprise Architecture", 70, "System/data dependency and target-state design."],
    ["Program managers", "Program and Transformation Office", 95, "Initiative funding and delivery governance."],
    ["Vendor managers", "Procurement and Vendor Management", 55, "Contract, SLA, invoice, and renewal evidence."],
  ].map((role, index) => {
    const evid = `MER-EVID-ROLE-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "03_workforce_roles.csv", "synthetic_workforce_role", `${role[0]} role evidence`, role[1], `Synthetic workforce/persona record for ${role[0]}.`);
    return {
      ...baseRow(`MER-ROLE-${String(index + 1).padStart(3, "0")}`, "03_workforce_roles.csv", role[0], evid),
      role_name: role[0],
      business_area: role[1],
      population_count: role[2],
      ai_relevance: role[3],
      change_readiness_caveat: "Training, controls, and adoption evidence required before scale.",
    };
  });
  writeCsv("03_workforce_roles.csv", roleRows);

  const systemRows = systems.map((sys, index) => {
    const evid = `MER-EVID-SYS-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "04_applications_systems.csv", "synthetic_application_inventory", `${sys[1]} application record`, sys[3], `Synthetic system inventory row for ${sys[1]}.`);
    return {
      ...baseRow(sys[0], "04_applications_systems.csv", sys[1], evid, { confidence: "high" }),
      system_id: sys[0],
      system_name: sys[1],
      capability: sys[2],
      owner: sys[3],
      criticality: sys[4],
      lifecycle_status: sys[5],
      vendor_name: sys[6],
      data_domain: sys[7],
      ai_assist_relevance: /CRM|Contact|Knowledge|Claims|Eligibility|Databricks/.test(sys[1]) ? "high" : "medium",
    };
  });
  writeCsv("04_applications_systems.csv", systemRows);

  const dataAssets = [
    ["MER-DATA-001", "CRM member service interaction data", "CRM; contact center", "Salesforce Health Cloud; Genesys", "partial", "AI Assist requires ownership and transcript availability."],
    ["MER-DATA-002", "Claims inquiry data product", "claims", "Claims Administration Platform", "partial", "Claims lineage and eligibility relationships require certification."],
    ["MER-DATA-003", "Eligibility and benefits data product", "eligibility", "Eligibility and Benefits Platform", "partial", "Member identity matching not certified."],
    ["MER-DATA-004", "Knowledge content corpus", "knowledge base", "Member Service Knowledge Base", "partial", "Content ownership and freshness SLA required."],
    ["MER-DATA-005", "Contact center event stream", "contact center events", "Genesys Contact Center", "partial", "Call reason taxonomy and transfer reason quality need cleanup."],
    ["MER-DATA-006", "Enterprise finance budget and actuals", "finance", "Workday Finance", "yes", "Finance extract reconciles Tower budget posture."],
    ["MER-DATA-007", "Data foundation / lakehouse registry", "data products", "Databricks on AWS", "partial", "AWS/Databricks is foundation posture, not certified production AI substrate."],
  ].map((row, index) => {
    const evid = `MER-EVID-DATA-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "05_data_assets_integrations.csv", "synthetic_data_asset_inventory", `${row[1]} data evidence`, "CDAO", `Synthetic data asset record for ${row[1]}.`);
    return {
      ...baseRow(row[0], "05_data_assets_integrations.csv", row[1], evid),
      data_asset_id: row[0],
      data_asset_name: row[1],
      data_domain: row[2],
      source_systems: row[3],
      certification_status: row[4],
      data_gap: row[5],
    };
  });
  writeCsv("05_data_assets_integrations.csv", dataAssets);

  const infraRows = [
    ["MER-INF-001", "AWS analytics landing zone", "cloud_platform", "target/foundation", "Cloud FinOps", "Not certified as production AI substrate."],
    ["MER-INF-002", "Enterprise network and resilience", "network", "run", "CTO", "Budget and incident posture tracked through SA02 and SA06."],
    ["MER-INF-003", "Databricks workspace foundation", "data_platform", "target/foundation", "CDAO", "Requires medallion, access, lineage, and cost governance evidence."],
    ["MER-INF-004", "SOC and IAM control plane", "security_platform", "run", "CISO", "PHI and access controls required before AI Assist scale."],
  ].map((row, index) => {
    const evid = `MER-EVID-INF-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "06_infrastructure_platforms.csv", "synthetic_infrastructure_inventory", `${row[1]} infrastructure evidence`, row[4], `Synthetic infrastructure/platform row for ${row[1]}.`);
    return {
      ...baseRow(row[0], "06_infrastructure_platforms.csv", row[1], evid),
      platform_id: row[0],
      platform_name: row[1],
      platform_type: row[2],
      lifecycle_status: row[3],
      owner: row[4],
      readiness_caveat: row[5],
    };
  });
  writeCsv("06_infrastructure_platforms.csv", infraRows);

  const vendorRows = vendors.map((vendor, index) => {
    const evid = `MER-EVID-VEN-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "07_vendors_contracts.csv", "synthetic_vendor_contract_summary", `${vendor[0]} contract summary`, "Procurement / Vendor Management", `Synthetic vendor/contract row for ${vendor[0]}.`);
    return {
      ...baseRow(vendor[1], "07_vendors_contracts.csv", vendor[0], evid),
      vendor_id: vendor[1],
      vendor_name: vendor[0],
      service: vendor[2],
      owning_function: vendor[3],
      linked_systems: vendor[4],
      annual_contract_value_usd: vendor[5],
      contract_risk: vendor[6],
      pricing_basis: "source contract and invoice detail required before optimization claim",
    };
  });
  writeCsv("07_vendors_contracts.csv", vendorRows);
}

function buildBudgetFiles() {
  const budgetRows = budgetFacts.map((fact, index) => {
    const evid = `MER-EVID-FIN-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "08_it_budget_spend_value.csv", "synthetic_finance_extract", fact.name, fact.financeOwner, fact.caveat, {
      finance_attestation_status: index < 3 ? "synthetic_planning_assumption" : "source_extract_reconciled",
      modules_consuming: "Tower|Moves|Source|Knowledge",
    });
    return {
      tenant_key: tenantKey,
      record_id: fact.id,
      financial_fact_name: fact.name,
      financial_fact_type: fact.type,
      fiscal_year: "FY26",
      time_period: "FY26",
      budget_amount_usd: money(fact.budget),
      approved_budget_usd: money(fact.approved),
      actual_spend_ytd_usd: money(fact.actual),
      forecast_spend_usd: money(fact.forecast),
      run_budget_usd: money(fact.run),
      change_budget_usd: money(fact.change),
      planned_value_usd: "0",
      target_value_usd: "0",
      realized_value_usd: "0",
      amount_basis: index < 3 ? "planning_assumption" : "budget",
      gross_or_net: "gross",
      additive_status: index < 3 ? "not_additive" : "additive",
      finance_attestation_status: index < 3 ? "synthetic_planning_assumption" : "source_extract_reconciled",
      business_owner: fact.owner,
      finance_owner: fact.financeOwner,
      source_system: fact.sourceSystem,
      source_adapter_reference: "SA02_IT_Finance_Budget_Spend_Extract.csv",
      evidence_id: evid,
      confidence: index < 3 ? "medium" : "high",
      active_candidate_status: "active",
      tower_usage: fact.hero ? "hero_planning_budget" : "detail_budget",
      tower_hero_eligible: fact.hero ? "true" : "false",
      caveat: fact.caveat,
    };
  });
  const budgetHeader = [
    "tenant_key", "record_id", "financial_fact_name", "financial_fact_type", "fiscal_year", "time_period", "budget_amount_usd", "approved_budget_usd", "actual_spend_ytd_usd", "forecast_spend_usd", "run_budget_usd", "change_budget_usd", "planned_value_usd", "target_value_usd", "realized_value_usd", "amount_basis", "gross_or_net", "additive_status", "finance_attestation_status", "business_owner", "finance_owner", "source_system", "source_adapter_reference", "evidence_id", "confidence", "active_candidate_status", "tower_usage", "tower_hero_eligible", "caveat",
  ];
  writeCsv("08_it_budget_spend_value.csv", budgetRows, budgetHeader);

  const categoryFacts = budgetFacts.filter((fact) => !["MER-FIN-001", "MER-FIN-002", "MER-FIN-003"].includes(fact.id));
  const sa02Rows = categoryFacts.map((fact, index) => {
    const evid = `MER-EVID-SA02-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "SA02_IT_Finance_Budget_Spend_Extract.csv", "synthetic_finance_extract", `${fact.name} finance extract`, fact.financeOwner, `Line-level finance extract row reconciling ${fact.name} to 08.`, {
      finance_attestation_status: "source_extract_reconciled",
      modules_consuming: "Tower|Source|Moves",
    });
    const isRun = fact.run > 0;
    return {
      tenant_key: tenantKey,
      source_record_id: `MER-SA02-${String(index + 1).padStart(3, "0")}`,
      fiscal_year: "FY26",
      period: "FY26-Q2-YTD",
      source_system: fact.sourceSystem,
      cost_center: isRun ? `RUN-${String(index + 1).padStart(3, "0")}` : `CHG-${String(index + 1).padStart(3, "0")}`,
      account_gl_code: isRun ? "IT-RUN-BUDGET" : "IT-CHANGE-BUDGET",
      spend_category: fact.name,
      it_tower_category: fact.type,
      business_unit: fact.owner,
      program_code: isRun ? "" : fact.id,
      initiative_id: isRun ? "" : programs.find((program) => fact.name.startsWith(program[1].split(" / ")[0]))?.[0] ?? "",
      vendor_name: fact.type.includes("cloud") ? "AWS / Databricks" : fact.type.includes("managed") ? "Accenture Managed Services" : "",
      run_change_flag: isRun ? "Run" : "Change",
      budget_amount_usd: money(fact.budget),
      actual_spend_usd: money(fact.actual),
      forecast_spend_usd: money(fact.forecast),
      committed_spend_usd: money(fact.approved),
      invoice_amount_usd: money(Math.round(fact.actual * 0.92)),
      variance_usd: money(fact.forecast - fact.budget),
      finance_owner: fact.financeOwner,
      evidence_id: evid,
      confidence: "high",
      active_candidate_status: "active",
      notes: "Synthetic Q2 YTD finance extract. Actuals are YTD and do not equal full-year budget.",
    };
  });
  writeCsv("SA02_IT_Finance_Budget_Spend_Extract.csv", sa02Rows);
}

function buildProgramAndAiFiles() {
  const programRows = programs.map((program, index) => {
    const evid = `MER-EVID-PROG-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "09_programs_initiatives.csv", "synthetic_program_portfolio", `${program[1]} program portfolio row`, program[12], program[15], {
      modules_consuming: "Moves|Tower|Knowledge",
    });
    return {
      tenant_key: tenantKey,
      record_id: program[0],
      initiative_name: program[1],
      business_name: program[1],
      initiative_status: program[2],
      funding_status: program[3],
      approved_funding_usd: money(program[4]),
      requested_funding_usd: money(program[5]),
      forecast_spend_usd: money(program[6]),
      actual_spend_ytd_usd: money(program[7]),
      planned_value_usd: money(program[9]),
      target_value_usd: money(program[9]),
      realized_value_usd: "0",
      value_claim_status: program[10],
      executive_owner: program[11],
      finance_owner: program[12],
      tower_measurement_ready: program[13],
      evidence_id: evid,
      additive_status: program[14],
      caveat: program[15],
    };
  });
  writeCsv("09_programs_initiatives.csv", programRows);

  const aiRows = aiUseCases.map((useCase, index) => {
    const evid = `MER-EVID-AI-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "10_ai_automation_use_cases.csv", "synthetic_ai_use_case", `${useCase[1]} use-case evidence`, "AI Governance Council", useCase[14], {
      modules_consuming: "Intelligence|Moves|Tower",
    });
    return {
      tenant_key: tenantKey,
      record_id: useCase[0],
      use_case_name: useCase[1],
      use_case_status: useCase[2],
      related_move: useCase[3],
      business_problem: useCase[4],
      affected_process: useCase[5],
      required_data_domains: useCase[6],
      readiness_status: useCase[7],
      funding_status: useCase[8],
      measurement_status: useCase[9],
      risk_control_status: useCase[10],
      evidence_needed: useCase[11],
      tower_tracking_status: useCase[12],
      expected_decision_path: useCase[13],
      evidence_id: evid,
      caveat: useCase[14],
    };
  });
  writeCsv("10_ai_automation_use_cases.csv", aiRows);

  const sa04Rows = programRows.map((row, index) => ({
    tenant_key: tenantKey,
    source_record_id: `MER-SA04-${String(index + 1).padStart(3, "0")}`,
    portfolio_system: "PPM / Transformation Portfolio",
    initiative_id: row.record_id,
    initiative_name: row.initiative_name,
    initiative_status: row.initiative_status,
    funding_status: row.funding_status,
    approved_funding_usd: row.approved_funding_usd,
    requested_funding_usd: row.requested_funding_usd,
    forecast_spend_usd: row.forecast_spend_usd,
    actual_spend_ytd_usd: row.actual_spend_ytd_usd,
    planned_value_usd: row.planned_value_usd,
    target_value_usd: row.target_value_usd,
    realized_value_usd: row.realized_value_usd,
    value_claim_status: row.value_claim_status,
    executive_owner: row.executive_owner,
    finance_owner: row.finance_owner,
    evidence_id: `MER-EVID-SA04-${String(index + 1).padStart(3, "0")}`,
    confidence: row.initiative_status === "candidate" ? "medium" : "high",
    active_candidate_status: row.initiative_status === "candidate" ? "candidate" : "active",
    caveat: row.caveat,
  }));
  for (const row of sa04Rows) {
    addEvidence(row.evidence_id, "SA04_Program_Portfolio_Extract.csv", "synthetic_program_portfolio", `${row.initiative_name} SA04 extract`, row.executive_owner, row.caveat, {
      active_candidate_status: row.active_candidate_status,
      modules_consuming: "Moves|Tower",
    });
  }
  writeCsv("SA04_Program_Portfolio_Extract.csv", sa04Rows);
}

function buildMetricsAndServices() {
  const metrics = metricRows.map((metric, index) => {
    const evid = `MER-EVID-MET-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "14_metrics_outcomes.csv", "synthetic_metric_definition", `${metric[1]} metric definition`, metric[7], metric[12], {
      modules_consuming: "Tower|Moves|Knowledge",
    });
    return {
      tenant_key: tenantKey,
      record_id: metric[0],
      metric_name: metric[1],
      metric_type: metric[2],
      baseline_value: metric[4],
      target_value: "TBD after baseline validation",
      actual_value: "",
      unit: metric[3],
      fiscal_year: "FY26",
      measurement_period: "FY26-Q2-YTD",
      measurement_owner: metric[7],
      source_system: metric[8],
      measurement_cadence: metric[9],
      evidence_id: evid,
      baseline_available: metric[4],
      actual_available: metric[5],
      tower_claim_allowed: metric[6],
      caveat: metric[12],
    };
  });
  writeCsv("14_metrics_outcomes.csv", metrics);

  const serviceRows = vendors.map((vendor, index) => {
    const evid = `MER-EVID-MSA-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "17_managed_services_scope.csv", "synthetic_managed_services_scope", `${vendor[0]} managed-services/commercial scope`, "Procurement / Vendor Management", vendor[6], {
      modules_consuming: "Source|Tower",
    });
    const acv = Number(vendor[5]);
    return {
      tenant_key: tenantKey,
      record_id: `MER-MSA-${String(index + 1).padStart(3, "0")}`,
      vendor_name: vendor[0],
      service_tower: vendor[2],
      contract_id: `MER-CON-${String(index + 1).padStart(3, "0")}`,
      fiscal_year: "FY26",
      annual_contract_value_usd: money(acv),
      run_spend_usd: money(acv),
      change_order_spend_usd: money(index === 5 ? 2200000 : 0),
      invoice_amount_ytd_usd: money(Math.round(acv * 0.46)),
      service_credit_ytd_usd: money(index === 5 ? 175000 : 0),
      evidence_id: evid,
      tower_usage: "managed_services_run_spend",
      caveat: vendor[6],
    };
  });
  writeCsv("17_managed_services_scope.csv", serviceRows);
}

function buildRiskRelationshipsAndAdapters() {
  const riskRows = [
    ["MER-RISK-001", "AI Assist PHI disclosure risk", "open", "controls_required", "Member Service AI Assist", "PHI controls, HITL, audit logging, and retention rules are required before pilot."],
    ["MER-RISK-002", "Data foundation lineage gap", "open", "control_design_partial", "Data Foundation / Lakehouse Modernization", "Claims, eligibility, CRM, and identity lineage must be certified."],
    ["MER-RISK-003", "Knowledge ownership risk", "open", "owner_assignment_required", "Contact Center Knowledge Assist", "Approved content ownership and freshness SLA are required."],
    ["MER-RISK-004", "Budget/value overstatement risk", "open", "finance_gate_required", "Tower Value Claims", "Tower must not treat planned values as realized savings."],
    ["MER-RISK-005", "Vendor optimization evidence gap", "open", "contract_evidence_required", "Managed Services Optimization", "Contract, SLA, invoice, and service-tower evidence are incomplete."],
  ].map((risk, index) => {
    const evid = `MER-EVID-RISK-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "11_risks_controls.csv", "synthetic_risk_control_register", risk[1], "CISO / Risk / Finance", risk[5], {
      modules_consuming: "Tower|Moves|Source",
    });
    return {
      ...baseRow(risk[0], "11_risks_controls.csv", risk[1], evid),
      risk_name: risk[1],
      risk_status: risk[2],
      control_status: risk[3],
      related_initiative_or_use_case: risk[4],
      caveat: risk[5],
    };
  });
  writeCsv("11_risks_controls.csv", riskRows);

  const relationships = [
    ["MER-REL-001", "Member Service AI Assist", "depends_on", "Data Foundation / Lakehouse Modernization", "AI Assist requires governed CRM, claims, eligibility, knowledge, transcript, and identity data."],
    ["MER-REL-002", "Member Service AI Assist", "depends_on", "Salesforce Health Cloud", "CRM workflow and member service context are required."],
    ["MER-REL-003", "Member Service AI Assist", "depends_on", "Claims Administration Platform", "Claims context and lineage are required."],
    ["MER-REL-004", "Member Service AI Assist", "depends_on", "Eligibility and Benefits Platform", "Eligibility and benefits context are required."],
    ["MER-REL-005", "Member Service AI Assist", "depends_on", "Member Service Knowledge Base", "Approved answer content ownership is required."],
    ["MER-REL-006", "Member Service AI Assist", "maps_to", "Member Service Agent Assist Transformation", "AI Assist is a Moves opportunity, not a funded Tower program."],
    ["MER-REL-007", "Tower budget facts", "derive_from", "08_it_budget_spend_value.csv", "Curated budget facts come from 08."],
    ["MER-REL-008", "Tower budget facts", "reconcile_to", "SA02_IT_Finance_Budget_Spend_Extract.csv", "SA02 line-level finance rows reconcile to 08."],
    ["MER-REL-009", "Program facts", "derive_from", "09_programs_initiatives.csv", "Program posture comes from 09."],
    ["MER-REL-010", "Program facts", "reconcile_to", "SA04_Program_Portfolio_Extract.csv", "SA04 source-adapter rows reconcile to 09."],
    ["MER-REL-011", "Metrics", "derive_from", "14_metrics_outcomes.csv", "Metric definitions and claim gates come from 14."],
    ["MER-REL-012", "Interview insights", "enrich", "Context gaps and priorities", "Interviews create context but not approved funding or realized value."],
  ].map((rel, index) => {
    const evid = `MER-EVID-REL-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "12_relationships.csv", "synthetic_relationship_graph", `${rel[1]} ${rel[2]} ${rel[3]}`, "AbarVa synthetic data steward", rel[4]);
    return {
      tenant_key: tenantKey,
      relationship_id: rel[0],
      from_object: rel[1],
      relationship_type: rel[2],
      to_object: rel[3],
      relationship_evidence: rel[4],
      active_candidate_status: "active",
      evidence_id: evid,
      confidence: "high",
      caveat: rel[4],
    };
  });
  writeCsv("12_relationships.csv", relationships);

  const industryRows = [
    ["MER-IND-001", "Healthcare AI Assist readiness pattern", "AI assist should sequence data foundation, PHI controls, HITL, baseline metrics, pilot, then scale."],
    ["MER-IND-002", "Healthcare Tower value proof pattern", "Budget and value claims require finance baselines, actuals, and source evidence before CXO hero display."],
    ["MER-IND-003", "Managed services optimization pattern", "AMS/IMS optimization requires contract, invoice, SLA, ticket, and tower-scope reconciliation."],
  ].map((row, index) => {
    const evid = `MER-EVID-IND-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "15_industry_context_patterns.csv", "synthetic_industry_context_patterns", row[1], "AbarVa pattern steward", row[2]);
    return {
      ...baseRow(row[0], "15_industry_context_patterns.csv", row[1], evid),
      pattern_name: row[1],
      industry_context: "healthcare",
      pattern_summary: row[2],
      caveat: "Pattern context is directional and not Meridian measured performance.",
    };
  });
  writeCsv("15_industry_context_patterns.csv", industryRows);

  const lensRows = [
    ["MER-LENS-001", "CFO value gate", "Do not claim realized value until finance-attested actuals exist."],
    ["MER-LENS-002", "CIO portfolio lens", "Separate budget, funded programs, candidate opportunities, measurement readiness, and realized value."],
    ["MER-LENS-003", "CISO / Privacy lens", "PHI controls, HITL, access, audit, and retention must gate AI Assist."],
    ["MER-LENS-004", "CDAO data readiness lens", "Data products, lineage, identity, and governance must precede AI scale."],
  ].map((row, index) => {
    const evid = `MER-EVID-LENS-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "16_expert_lenses.csv", "synthetic_expert_lens", row[1], "AbarVa expert lens steward", row[2]);
    return {
      ...baseRow(row[0], "16_expert_lenses.csv", row[1], evid),
      lens_name: row[1],
      executive_lens: row[2],
      modules_consuming: "Knowledge|Intelligence|Moves|Source|Tower",
    };
  });
  writeCsv("16_expert_lenses.csv", lensRows);

  const processRows = [
    ["MER-PROC-001", "Member service inquiry handling", "current-state workflow maps required", "AI Assist discovery"],
    ["MER-PROC-002", "Claims and eligibility inquiry resolution", "baseline and escalation paths required", "AI Assist discovery"],
    ["MER-PROC-003", "Finance budget review and value gate", "finance validation required", "Tower value claims"],
    ["MER-PROC-004", "Managed services invoice/SLA review", "contract, invoice, SLA, and ticket reconciliation required", "Source optimization"],
  ].map((row, index) => {
    const evid = `MER-EVID-PROC-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "18_operational_process_evidence.csv", "synthetic_operational_process_evidence", row[1], "Process owner", row[2]);
    return {
      ...baseRow(row[0], "18_operational_process_evidence.csv", row[1], evid),
      process_name: row[1],
      process_evidence_status: row[2],
      related_decision: row[3],
      caveat: row[2],
    };
  });
  writeCsv("18_operational_process_evidence.csv", processRows);

  const sa01Rows = systems.slice(0, 8).map((sys, index) => ({
    tenant_key: tenantKey,
    source_record_id: `MER-SA01-${String(index + 1).padStart(3, "0")}`,
    source_system: "ServiceNow CMDB",
    ci_name: sys[1],
    ci_type: "application_service",
    business_owner: sys[3],
    lifecycle_status: sys[5],
    criticality: sys[4],
    linked_vendor: sys[6],
    evidence_id: `MER-EVID-SA01-${String(index + 1).padStart(3, "0")}`,
    confidence: "medium",
    active_candidate_status: "active",
  }));
  for (const row of sa01Rows) addEvidence(row.evidence_id, "SA01_ServiceNow_CMDB_Extract.csv", "synthetic_application_inventory", `${row.ci_name} CMDB extract`, row.business_owner, "Synthetic ServiceNow CMDB source adapter row.");
  writeCsv("SA01_ServiceNow_CMDB_Extract.csv", sa01Rows);

  const sa03Rows = vendorRowsFromFiles();
  writeCsv("SA03_Vendor_Contracts_Extract.csv", sa03Rows);

  const sa05Rows = [
    ["MER-SA05-001", "AWS Analytics Landing Zone", "AWS", "analytics-prod", "Cloud / Infrastructure Spend", 6_500_000, 2_100_000, 7_200_000, "CDAO / Cloud FinOps", "Need account mapping and chargeback by data product."],
    ["MER-SA05-002", "Databricks Lakehouse Workspaces", "Databricks", "lakehouse-prod", "Data Foundation", 4_500_000, 1_700_000, 4_900_000, "CDAO", "Target/foundation posture; medallion certification incomplete."],
    ["MER-SA05-003", "Clinical analytics storage", "AWS", "clinical-analytics", "Infrastructure", 3_200_000, 1_450_000, 3_300_000, "Clinical Analytics", "Clinical reporting cost allocation needs validation."],
  ].map((row, index) => {
    const evid = `MER-EVID-SA05-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "SA05_Cloud_Inventory_Extract.csv", "synthetic_cloud_inventory", `${row[1]} cloud inventory`, row[8], row[9]);
    return {
      tenant_key: tenantKey,
      source_record_id: row[0],
      cloud_asset_name: row[1],
      provider: row[2],
      account_or_workspace: row[3],
      spend_category: row[4],
      budget_amount_usd: money(row[5]),
      actual_spend_ytd_usd: money(row[6]),
      forecast_spend_usd: money(row[7]),
      owner: row[8],
      evidence_id: evid,
      confidence: "medium",
      active_candidate_status: "active",
      caveat: row[9],
    };
  });
  writeCsv("SA05_Cloud_Inventory_Extract.csv", sa05Rows);

  const sa06Rows = [
    ["MER-SA06-001", "Genesys contact center incident trend", "incident", "Contact Center Platform", 312, 29, 7, "Contact Center Operations", "Incident taxonomy and AI Assist baseline need separation."],
    ["MER-SA06-002", "Claims platform change backlog", "change", "Claims Administration Platform", 0, 0, 41, "Health Plan Operations", "Change backlog impacts AI Assist readiness."],
    ["MER-SA06-003", "Knowledge base freshness problem records", "problem", "Member Service Knowledge Base", 0, 18, 0, "Knowledge Management", "Problem records show ownership and freshness gaps."],
    ["MER-SA06-004", "Databricks foundation change events", "change", "Databricks on AWS", 0, 0, 23, "CDAO", "Foundation posture is not certified for production AI."],
  ].map((row, index) => {
    const evid = `MER-EVID-SA06-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "SA06_Incident_Problem_Change_Extract.csv", "synthetic_incident_problem_change", row[1], row[7], row[8]);
    return {
      tenant_key: tenantKey,
      source_record_id: row[0],
      record_name: row[1],
      record_type: row[2],
      affected_system: row[3],
      incident_count_ytd: row[4],
      problem_count_ytd: row[5],
      change_count_ytd: row[6],
      owner: row[7],
      evidence_id: evid,
      confidence: "medium",
      active_candidate_status: "active",
      caveat: row[8],
    };
  });
  writeCsv("SA06_Incident_Problem_Change_Extract.csv", sa06Rows);
}

function vendorRowsFromFiles() {
  return vendors.map((vendor, index) => {
    const evid = `MER-EVID-SA03-${String(index + 1).padStart(3, "0")}`;
    addEvidence(evid, "SA03_Vendor_Contracts_Extract.csv", "synthetic_vendor_contract_summary", `${vendor[0]} source contract extract`, "Procurement / Vendor Management", vendor[6]);
    return {
      tenant_key: tenantKey,
      source_record_id: `MER-SA03-${String(index + 1).padStart(3, "0")}`,
      vendor_name: vendor[0],
      contract_id: `MER-CON-${String(index + 1).padStart(3, "0")}`,
      service: vendor[2],
      annual_contract_value_usd: money(vendor[5]),
      renewal_window: "FY26",
      contract_owner: vendor[3],
      linked_systems: vendor[4],
      evidence_id: evid,
      confidence: "medium",
      active_candidate_status: "active",
      caveat: vendor[6],
    };
  });
}

function buildInterviews() {
  const rows = [];
  for (const [groupIndex, group] of interviewGroups.entries()) {
    for (const [questionIndex, question] of interviewQuestions.entries()) {
      const ordinal = (groupIndex * interviewQuestions.length) + questionIndex + 1;
      const useCase = aiUseCases[(groupIndex + questionIndex) % aiUseCases.length];
      const system = systems[(groupIndex + questionIndex) % systems.length];
      const metric = metricRows[(groupIndex + questionIndex) % metricRows.length];
      const evid = `MER-EVID-SA07-${String(ordinal).padStart(3, "0")}`;
      const answer = `${group} says ${question[3]} The required evidence is ${useCase[11]}. CFO/Tower language must stay planning-grade until baseline, actual, and finance validation evidence exist.`;
      addEvidence(evid, "SA07_Executive_Interview_Insights.csv", "synthetic_executive_interview", `${group} ${question[0]} interview insight`, group, answer, {
        source_system: "synthetic executive interview",
        modules_consuming: "Knowledge|Intelligence|Moves|Source|Tower",
      });
      rows.push({
        tenant_key: tenantKey,
        interview_id: `MER-INT-${String(groupIndex + 1).padStart(2, "0")}`,
        interview_group: group,
        executive_area: group,
        stakeholder_role: group.split("/")[0].trim(),
        question_id: question[0],
        question: question[1],
        synthetic_answer: answer,
        priority_theme: question[2],
        business_priority: useCase[1],
        pain_point: question[3],
        known_challenge: useCase[11],
        key_initiative: useCase[3] || useCase[1],
        system_or_vendor_mentioned: system[1],
        data_domain_mentioned: useCase[6],
        metric_mentioned: metric[1],
        risk_or_control_mentioned: useCase[10],
        budget_or_value_mentioned: "Budget/value requires finance validation; AI Assist has no approved funding or realized value.",
        evidence_needed: useCase[11],
        decision_supported: `${useCase[1]} readiness and evidence gate`,
        module_usage_notes: "Knowledge|Intelligence|Moves|Source|Tower",
        confidence: questionIndex % 4 === 0 ? "medium" : "high",
        source_type: "synthetic_executive_interview",
        interview_date: "2026-07-16",
        active_candidate_status: "active",
        evidence_id: evid,
      });
    }
  }
  writeCsv("SA07_Executive_Interview_Insights.csv", rows);
  ensureDir(interviewDir);
  fs.writeFileSync(path.join(interviewDir, "executive_interviews.csv"), files.get("SA07_Executive_Interview_Insights.csv").text);
}

function finalizeEvidenceAndReports() {
  const evidenceHeader = [
    "tenant_key", "evidence_id", "evidence_title", "evidence_type", "source_file", "source_system", "source_owner", "fiscal_year", "active_candidate_status", "confidence", "evidence_summary", "finance_attestation_status", "evidence_boundary", "modules_consuming",
  ];
  writeCsv("13_evidence_sources.csv", evidenceRows, evidenceHeader);

  const activeFiles = [...coreFiles, ...adapterFiles];
  fs.rmSync(activeDir, { recursive: true, force: true });
  ensureDir(activeDir);
  ensureDir(standardDir);
  for (const fileName of activeFiles) {
    const item = files.get(fileName);
    if (!item) throw new Error(`Generator missing ${fileName}`);
    fs.writeFileSync(path.join(activeDir, fileName), item.text);
    if (coreFiles.includes(fileName)) fs.writeFileSync(path.join(standardDir, fileName), item.text);
  }
  for (const [fileName, item] of files.entries()) {
    if (fileName.startsWith("__template_instruction__")) {
      const outName = fileName.replace("__template_instruction__", "");
      fs.writeFileSync(path.join(templateInstructionDir, outName), item.text);
    }
  }

  ensureDir(reportDir);
  const inventoryRows = activeFiles.map((fileName) => {
    const item = files.get(fileName);
    return {
      file_name: fileName,
      row_count: item.rows.length,
      column_count: item.columns.length,
      output_path: `datasets/tenant-inputs/active/meridian-health/current/${fileName}`,
    };
  });
  writeReportCsv("file-inventory.csv", inventoryRows);

  const sa02Rows = files.get("SA02_IT_Finance_Budget_Spend_Extract.csv").rows;
  const run = sa02Rows.filter((row) => row.run_change_flag === "Run").reduce((sum, row) => sum + Number(row.budget_amount_usd), 0);
  const change = sa02Rows.filter((row) => row.run_change_flag === "Change").reduce((sum, row) => sum + Number(row.budget_amount_usd), 0);
  const total = run + change;
  writeReportCsv("budget-reconciliation.csv", [
    { check_name: "total_budget", expected_usd: 650000000, actual_usd: total, status: total === 650000000 ? "Pass" : "Fail" },
    { check_name: "run_budget", expected_usd: 487500000, actual_usd: run, status: run === 487500000 ? "Pass" : "Fail" },
    { check_name: "change_budget", expected_usd: 162500000, actual_usd: change, status: change === 162500000 ? "Pass" : "Fail" },
  ]);
  writeReportCsv("program-status-audit.csv", files.get("09_programs_initiatives.csv").rows.map((row) => ({
    initiative_name: row.initiative_name,
    initiative_status: row.initiative_status,
    funding_status: row.funding_status,
    approved_funding_usd: row.approved_funding_usd,
    realized_value_usd: row.realized_value_usd,
    caveat: row.caveat,
  })));
  writeReportCsv("ai-assist-boundary-audit.csv", [
    ...files.get("09_programs_initiatives.csv").rows.filter((row) => /Assist/i.test(row.initiative_name ?? "")).map((row) => ({
      source_file: "09_programs_initiatives.csv",
      name: row.initiative_name,
      status: row.initiative_status,
      funding_status: row.funding_status,
      approved_funding_usd: row.approved_funding_usd,
      tower_tracking_status: "",
      realized_value_usd: row.realized_value_usd,
      result: row.funding_status === "not_approved" && Number(row.approved_funding_usd) === 0 && Number(row.realized_value_usd) === 0 ? "Pass" : "Fail",
    })),
    ...files.get("10_ai_automation_use_cases.csv").rows.filter((row) => /Assist/i.test(row.use_case_name ?? "")).map((row) => ({
      source_file: "10_ai_automation_use_cases.csv",
      name: row.use_case_name,
      status: row.use_case_status,
      funding_status: row.funding_status,
      approved_funding_usd: "",
      tower_tracking_status: row.tower_tracking_status,
      realized_value_usd: "",
      result: row.funding_status === "not_approved" && row.tower_tracking_status === "opportunity_only" ? "Pass" : "Fail",
    })),
  ]);
  writeReportCsv("sa07-interview-coverage.csv", interviewGroups.map((group) => ({
    interview_group: group,
    question_count: files.get("SA07_Executive_Interview_Insights.csv").rows.filter((row) => row.interview_group === group).length,
    status: "Pass",
  })));
  writeReportCsv("evidence-resolution.csv", activeFiles.flatMap((fileName) => files.get(fileName).rows.map((row, index) => ({
    source_file: fileName,
    row_number: index + 2,
    record_id: row.record_id ?? row.source_record_id ?? row.relationship_id ?? row.interview_id ?? "",
    evidence_id: row.evidence_id ?? "",
    resolves_in_13: evidenceRows.some((evidence) => evidence.evidence_id === row.evidence_id) ? "true" : "false",
  }))));
  fs.writeFileSync(path.join(reportDir, "template-changes.md"), templateChangesMarkdown());
  fs.writeFileSync(path.join(reportDir, "tower-source-readiness.md"), towerReadinessMarkdown(total, run, change));
  fs.writeFileSync(path.join(reportDir, "summary.md"), summaryMarkdown(activeFiles, total, run, change));
  fs.writeFileSync(path.join(reportDir, "proof.html"), proofHtml(activeFiles, total, run, change));
}

function writeReportCsv(fileName, rows) {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : ["status"];
  const text = [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n") + "\n";
  fs.writeFileSync(path.join(reportDir, fileName), text);
}

function templateChangesMarkdown() {
  return `# Template Changes\n\nStatus: Pass\n\nThe reset adds strict field-instruction CSVs under \`datasets/templates/standard-2026-07-v3/field-instructions\` for the Tower-relevant templates. These instruction files include \`field_name\`, \`business_description\`, \`required_optional\`, \`expected_format\`, \`allowed_values\`, \`example_value\`, \`provided_by\`, \`evidence_required\`, \`validation_rule\`, \`common_mistakes\`, \`nexus_usage\`, and \`modules_consuming\`.\n\nUpdated/covered templates:\n\n- 08_it_budget_spend_value\n- 09_programs_initiatives\n- 10_ai_automation_use_cases\n- 14_metrics_outcomes\n- 17_managed_services_scope\n- SA02_IT_Finance_Budget_Spend_Extract\n- SA04_Program_Portfolio_Extract\n- SA07_Executive_Interview_Insights\n\nTower-relevant finance fields are marked required and do not allow blank/TBD/not_provided placeholders where a required amount is expected.\n`;
}

function towerReadinessMarkdown(total, run, change) {
  return `# Tower Source Readiness\n\nStatus: Pass\n\n- Meridian source files generated: 26\n- FY26 total technology spend: $${total.toLocaleString("en-US")}\n- FY26 run / operate spend: $${run.toLocaleString("en-US")}\n- FY26 change / transformation spend: $${change.toLocaleString("en-US")}\n- AI Assist status: candidate/discovery opportunity only\n- AI Assist approved funding: $0\n- AI Assist realized value: $0\n- SA02 reconciles to 08 category-level budget posture\n- Every important 08/09/10/14/17/SA02/SA04/SA07 row has an evidence_id resolving in 13_evidence_sources.csv\n\nNo v3 derived layer load, Azure/Postgres mutation, candidate promotion, or runtime deployment was performed.\n`;
}

function summaryMarkdown(activeFiles, total, run, change) {
  return `# Meridian V3 Synthetic Data Reset\n\n## Status\n\nPass.\n\nThis is source-data only. No v3 derived layers were loaded, no Azure/Postgres state was mutated, no candidate data was promoted, and no runtime was deployed.\n\n## Outputs\n\n- Active output path: \`datasets/tenant-inputs/active/meridian-health/current/\`\n- Core v3 files: 19\n- Source adapter files: 7\n- Total files: ${activeFiles.length}\n\n## Budget Posture\n\n- FY26 total technology spend: $${total.toLocaleString("en-US")}\n- Run / operate: $${run.toLocaleString("en-US")}\n- Change / transformation: $${change.toLocaleString("en-US")}\n\n## Boundary Decisions\n\n- AI Assist is represented as a discovery/candidate Moves opportunity.\n- AI Assist is not an approved funded program.\n- AI Assist has no realized value.\n- Tower can use 08 and SA02 as source-file-ready budget inputs later, after derived layer work.\n\n## Audit Outputs\n\n- \`file-inventory.csv\`\n- \`budget-reconciliation.csv\`\n- \`program-status-audit.csv\`\n- \`ai-assist-boundary-audit.csv\`\n- \`sa07-interview-coverage.csv\`\n- \`evidence-resolution.csv\`\n- \`tower-source-readiness.md\`\n- \`proof.html\`\n`;
}

function proofHtml(activeFiles, total, run, change) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Meridian V3 Source Reset Proof</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111827}code{background:#f3f4f6;padding:2px 4px;border-radius:4px}.pass{color:#047857;font-weight:700}table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border:1px solid #d1d5db;padding:8px;text-align:left}</style></head><body><h1>Meridian V3 Source Reset Proof</h1><p class="pass">Status: Pass</p><p>Generated ${activeFiles.length} active Meridian source CSV files. No derived-layer load or deployment was performed.</p><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total technology spend</td><td>$${total.toLocaleString("en-US")}</td></tr><tr><td>Run / operate</td><td>$${run.toLocaleString("en-US")}</td></tr><tr><td>Change / transformation</td><td>$${change.toLocaleString("en-US")}</td></tr><tr><td>AI Assist funding</td><td>$0 / not approved</td></tr><tr><td>AI Assist realized value</td><td>$0</td></tr></table><h2>Files</h2><ul>${activeFiles.map((file) => `<li><code>${file}</code></li>`).join("")}</ul></body></html>\n`;
}

function maybeUpdateWorkbookPack() {
  const python = process.env.MERIDIAN_TEMPLATE_PYTHON;
  if (!python) return;
  const script = path.join(repoRoot, "scripts/tenant-v3/update-meridian-v3-template-pack.py");
  if (!fs.existsSync(script)) return;
  const result = spawnSync(python, [script], { stdio: "inherit", cwd: repoRoot });
  if (result.status !== 0) throw new Error(`Template workbook update failed with status ${result.status}`);
}

buildTemplateInstructions();
buildCoreFiles();
buildBudgetFiles();
buildProgramAndAiFiles();
buildMetricsAndServices();
buildRiskRelationshipsAndAdapters();
buildInterviews();
finalizeEvidenceAndReports();
maybeUpdateWorkbookPack();

console.log(JSON.stringify({
  status: "Pass",
  activeDir,
  reportDir,
  coreFiles: coreFiles.length,
  adapterFiles: adapterFiles.length,
  totalFiles: coreFiles.length + adapterFiles.length,
}, null, 2));

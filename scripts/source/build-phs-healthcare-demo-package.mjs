#!/usr/bin/env node

import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  EXPECTED,
  canonicalRowHash,
  csvEscape,
  validateCorruptedCanaries,
  validatePackage,
} from "./validate-phs-healthcare-demo-package.mjs";

const execFileAsync = promisify(execFile);

const GENERATOR_VERSION = "phs-healthcare-demo-phase-a-v1";
const SEED = 20260805;
const LOAD_RUN_ID = "phs-phase-a-generated-not-loaded-20260805";
const EXTRACT_TIMESTAMP = "2026-08-05T12:00:00.000Z";
const DEFAULT_OUT_DIR = "/Users/anand/Downloads";

const COMMON_FIELDS = [
  "tenant_key",
  "dataset_id",
  "dataset_version",
  "source_system",
  "source_module",
  "source_object",
  "source_record_id",
  "source_record_url_or_path",
  "extract_method",
  "extract_timestamp",
  "as_of_date",
  "period_start",
  "period_end",
  "load_run_id",
  "is_synthetic",
  "source_quality_state",
  "evidence_state",
  "review_state",
  "story_thread_ref",
  "row_hash",
];

const storyThreads = [
  "data_analytics_managed_services_value_leakage",
  "epic_operational_performance_and_scope_overlap",
  "workday_usage_and_bpo_dependency",
  "medsurg_local_procurement_fragmentation",
  "facilities_evs_service_credit_leakage",
  "bpo_normalized_tco_not_lowest_price",
  "health_plan_analytics_and_cloud_decisions",
];

const OUTCOME_KPI_CORE_QUESTIONS = [
  "What are the five most important outcomes for your portfolio?",
  "Which indicators do you personally review?",
  "What decisions do those indicators influence?",
  "Which leading indicators provide early warning?",
  "Which quality, risk or regulatory guardrails must not be compromised?",
  "Which outcomes are difficult to measure today?",
  "Which business units materially influence your results?",
  "Which systems, data platforms or vendors are critical to performance?",
  "Which reported indicators do you not fully trust?",
  "What must be materially different in 12-24 months?",
  "What evidence would convince you that a transformation investment delivered value?",
];

const contractFamilies = [
  ["CF-001", "Data and Analytics Managed Services", "VND-001", 35_000_000, "tier_1_full_evidence", storyThreads[0]],
  ["CF-002", "Epic Managed Services", "VND-002", 25_000_000, "tier_1_full_evidence", storyThreads[1]],
  ["CF-003", "Workday Finance HCM SaaS and Services", "VND-003", 12_500_000, "tier_2_selected_evidence", storyThreads[2]],
  ["CF-004", "Medical Surgical Supplies Distribution", "VND-004", 68_000_000, "tier_2_selected_evidence", storyThreads[3]],
  ["CF-005", "Facilities EVS Services", "VND-005", 18_000_000, "tier_2_selected_evidence", storyThreads[4]],
  ["CF-006", "Cybersecurity Managed Detection", "VND-006", 9_500_000, "tier_3_context_only", storyThreads[6]],
];

const vendors = [
  ["VND-001", "Crestline Analytics Services LLC", "managed_services", "strategic"],
  ["VND-002", "Northstar Clinical Platform Services LLC", "clinical_platform_services", "strategic"],
  ["VND-003", "Workday Inc.", "finance_hcm_platform", "strategic"],
  ["VND-004", "Summit Medical Distribution LLC", "medical_surgical_distribution", "strategic"],
  ["VND-005", "Harbor Facilities Services LLC", "facilities_evs", "material"],
  ["VND-006", "Sentinel Cyber Operations LLC", "cybersecurity", "material"],
  ["VND-007", "Databricks Inc.", "data_platform_target", "context"],
  ["VND-008", "Amazon Web Services Inc.", "cloud_platform_target", "context"],
  ["VND-009", "ServiceNow Inc.", "service_management_platform", "material"],
  ["VND-010", "Integrated BPO Advisors LLC", "sourcing_advisor", "context"],
];

const sourceFileSpecs = [
  ["WORKDAY_SUPPLIERS.csv", "finance_procurement", "Workday Financial Management", "Supplier", "supplier", "vendor_id"],
  ["WORKDAY_SUPPLIER_INVOICES.csv", "finance_procurement", "Workday Financial Management", "Supplier Invoice", "invoice_line", "invoice_line_id"],
  ["WORKDAY_PAYMENTS.csv", "finance_procurement", "Workday Financial Management", "Supplier Payment", "payment_line", "payment_id"],
  ["WORKDAY_COST_CENTERS.csv", "finance_procurement", "Workday Financial Management", "Cost Center", "cost_center", "cost_center_id"],
  ["WORKDAY_SPEND_CATEGORIES.csv", "finance_procurement", "Workday Financial Management", "Spend Category", "spend_category", "spend_category_id"],
  ["WORKDAY_WORKER_ROLE_SUMMARY.csv", "workforce_operating_model", "Workday HCM", "Worker Position Summary", "role_month", "role_month_id"],
  ["LOCAL_HOSPITAL_PURCHASES.csv", "medical_surgical_procurement", "Local Hospital Purchasing Workbook", "Purchase Lines", "purchase_order_line", "po_line_id"],
  ["MEDSURG_ITEM_MASTER.csv", "medical_surgical_procurement", "Distributor Portal", "Item Master", "item", "item_id"],
  ["MEDSURG_PRICE_TIERS.csv", "medical_surgical_procurement", "Distributor Portal", "Price Tier", "item_facility_tier", "price_tier_id"],
  ["MEDSURG_BACKORDERS_SUBSTITUTIONS.csv", "medical_surgical_procurement", "Distributor Portal", "Backorder Substitution", "item_facility_month", "substitution_id"],
  ["MEDSURG_REBATES_CREDITS.csv", "medical_surgical_procurement", "Distributor Portal", "Rebate Credit", "facility_category_month", "rebate_id"],
  ["CONTRACT_REGISTER.csv", "contract_repository", "SharePoint Contract Repository", "Agreement Register", "contract_family", "contract_family_id"],
  ["CONTRACT_INSTRUMENTS.csv", "contract_repository", "SharePoint Contract Repository", "Legal Instrument", "instrument", "instrument_id"],
  ["CONTRACT_AMENDMENTS.csv", "contract_repository", "CLM Compatible Metadata", "Amendment", "amendment", "amendment_id"],
  ["CONTRACT_RATE_CARDS.csv", "contract_repository", "Contract Repository", "Rate Card", "rate_card_line", "rate_card_id"],
  ["CONTRACT_SLA_TERMS.csv", "contract_repository", "Contract Repository", "SLA Terms", "sla_term", "sla_term_id"],
  ["CONTRACT_RENEWAL_EXIT_TERMS.csv", "contract_repository", "Contract Repository", "Renewal Exit Terms", "clause", "clause_id"],
  ["SERVICENOW_VENDOR_SERVICES.csv", "service_management_cmdb", "ServiceNow Vendor Management", "Vendor Services", "vendor_service", "vendor_service_id"],
  ["SERVICENOW_CMDB_APPLICATIONS.csv", "service_management_cmdb", "ServiceNow CMDB", "Business Application", "application", "application_id"],
  ["SERVICENOW_CSDM_BUSINESS_SERVICES.csv", "service_management_cmdb", "ServiceNow CSDM", "Business Service CI", "business_service_ci", "ci_id"],
  ["SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "service_management_cmdb", "ServiceNow ITSM", "Incident Problem Change Aggregate", "application_month", "itsm_summary_id"],
  ["SERVICENOW_MONTHLY_SLA_SUMMARY.csv", "service_management_cmdb", "ServiceNow SLA", "Task SLA Monthly", "service_metric_month", "sla_summary_id"],
  ["SERVICENOW_SERVICE_CREDITS.csv", "service_management_cmdb", "ServiceNow Vendor Management", "Service Credit", "contract_service_month", "service_credit_id"],
  ["EPIC_MODULE_INVENTORY.csv", "clinical_platforms", "Epic", "Module Inventory", "module", "module_id"],
  ["EPIC_INTERFACE_INVENTORY.csv", "clinical_platforms", "Epic Bridges", "Interface Inventory", "interface", "interface_id"],
  ["CLARITY_CABOODLE_ASSET_INVENTORY.csv", "analytics_platforms", "Epic Clarity Caboodle", "Data Asset Inventory", "asset", "asset_id"],
  ["HADOOP_CLUSTER_WORKLOADS.csv", "analytics_platforms", "Hadoop Inventory", "Cluster Workload", "workload", "workload_id"],
  ["SQL_SERVER_DATA_MARTS.csv", "analytics_platforms", "SQL Server Inventory", "Data Mart", "data_mart", "mart_id"],
  ["SAS_APPLICATIONS_AND_USERS.csv", "analytics_platforms", "SAS Platform Inventory", "SAS Application Usage", "application_month", "sas_usage_id"],
  ["ANALYTICS_PLATFORM_DEPENDENCIES.csv", "architecture_dependencies", "Enterprise Architecture Repository", "Platform Dependency", "dependency", "dependency_id"],
  ["SAAS_MODULE_USAGE_MONTHLY.csv", "saas_cloud_usage", "SaaS Admin Center", "Module Usage Monthly", "module_month", "usage_id"],
  ["AWS_TARGET_COMMITMENT_SCENARIOS.csv", "saas_cloud_usage", "AWS Commercial Planning", "Target Commitment Scenario", "service_month_scenario", "aws_scenario_id"],
  ["DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv", "saas_cloud_usage", "Databricks Commercial Planning", "Target Commitment Scenario", "workspace_month_scenario", "databricks_scenario_id"],
  ["VENDOR_WORKFORCE_MONTHLY.csv", "workforce_rate_cards", "VMS Fieldglass Compatible", "Workforce Monthly", "role_location_month", "workforce_month_id"],
  ["VENDOR_RATE_CARD_INVOICES.csv", "workforce_rate_cards", "VMS Fieldglass Compatible", "Rate Card Invoice", "role_invoice_line", "rate_invoice_id"],
  ["CONTRACT_SCOPE_RELATIONSHIPS.csv", "contract_scope", "Source Scope Mapping Workbook", "Contract Scope Relationship", "contract_service_application_ci", "scope_relationship_id"],
  ["PROGRAMS_INITIATIVES_DEPENDENCIES.csv", "programs_initiatives", "PMO Portfolio Export", "Program Initiative Dependency", "initiative_dependency", "program_dependency_id"],
  ["RISK_CONTROL_OBSERVATIONS.csv", "risk_controls", "GRC Register", "Risk Control Observation", "risk_control_month", "risk_control_id"],
];

const bpoFileSpecs = [
  ["BPO_CURRENT_STATE_PROCESS_VOLUMES.csv", "bpo_sourcing", "BPO Current State Workbook", "Process Volumes", "process_month", "process_volume_id"],
  ["BPO_CURRENT_STATE_WORKFORCE.csv", "bpo_sourcing", "Workday Workforce Summary", "Current Workforce", "role_function_location", "current_workforce_id"],
  ["BPO_CURRENT_STATE_COST_BASELINE.csv", "bpo_sourcing", "Finance Baseline", "Current Cost Baseline", "function_month", "cost_baseline_id"],
  ["BPO_RFP_REQUIREMENTS.csv", "bpo_sourcing", "RFP Requirement Library", "Requirement", "requirement", "requirement_id"],
  ["BPO_SUPPLIERS.csv", "bpo_sourcing", "Sourcing Event Workspace", "Supplier", "supplier_event_invite", "supplier_event_id"],
  ["BPO_SUPPLIER_RESPONSES.csv", "bpo_sourcing", "Supplier Response Workbook", "Supplier Response", "supplier_requirement_response", "supplier_response_id"],
  ["BPO_COMMERCIAL_LINES.csv", "bpo_sourcing", "Supplier Pricing Workbook", "Commercial Line", "supplier_function_year_line", "commercial_line_id"],
  ["BPO_EVALUATION_SCORES.csv", "bpo_sourcing", "Evaluation Workbook", "Evaluation Score", "evaluator_requirement_supplier", "evaluation_score_id"],
  ["BPO_CLARIFICATIONS.csv", "bpo_sourcing", "Clarification Log", "Clarification", "clarification", "clarification_id"],
  ["BPO_BAFO_RESPONSES.csv", "bpo_sourcing", "BAFO Workbook", "BAFO Response", "supplier_bafo_line", "bafo_response_id"],
  ["BPO_NORMALIZED_TCO.csv", "bpo_sourcing", "TCO Normalization Model", "Normalized TCO", "supplier_scenario_year", "normalized_tco_id"],
];

function argValue(name, fallback = null) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] ?? fallback;
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? fallback;
}

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const random = rng(SEED);
const pick = (items) => items[Math.floor(random() * items.length)];
const money = (amount) => Number(amount.toFixed(2));
const pad = (number, width = 4) => String(number).padStart(width, "0");

function months() {
  const out = [];
  for (let year = 2024; year <= 2026; year += 1) {
    const startMonth = year === 2024 ? 8 : 1;
    const endMonth = year === 2026 ? 7 : 12;
    for (let month = startMonth; month <= endMonth; month += 1) {
      const start = `${year}-${pad(month, 2)}-01`;
      const endDate = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
      out.push({ key: `${year}-${pad(month, 2)}`, start, end: endDate });
    }
  }
  return out;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function common(meta, specific) {
  const sourceRecordId = specific[meta.primaryKey] || specific.source_record_id;
  const row = {
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    source_system: meta.sourceSystem,
    source_module: meta.sourceModule,
    source_object: meta.sourceObject,
    source_record_id: sourceRecordId,
    source_record_url_or_path: `source://${EXPECTED.tenantKey}/${EXPECTED.datasetId}/${meta.path}/${sourceRecordId}`,
    extract_method: "deterministic_synthetic_source_export",
    extract_timestamp: EXTRACT_TIMESTAMP,
    as_of_date: EXPECTED.asOfDate,
    period_start: specific.period_start || EXPECTED.historyStart,
    period_end: specific.period_end || EXPECTED.historyEnd,
    load_run_id: LOAD_RUN_ID,
    is_synthetic: "true",
    source_quality_state: specific.source_quality_state || "synthetic_demo_complete",
    evidence_state: specific.evidence_state || "synthetic_evidence_available",
    review_state: specific.review_state || "audit_ready",
    story_thread_ref: specific.story_thread_ref || meta.storyThread || storyThreads[0],
    ...specific,
  };
  row.row_hash = canonicalRowHash(row);
  return row;
}

function makeSpec(tuple, group) {
  const [name, domain, sourceSystem, sourceObject, grain, primaryKey] = tuple;
  return {
    name,
    path: `${group}/${name}`,
    format: "csv",
    domain_contract: domain,
    source_system: sourceSystem,
    source_object: sourceObject,
    source_module: sourceObject.split(" ")[0],
    grain,
    primary_key: primaryKey,
    native_id_field: primaryKey,
    required_fields: [],
    expected_rows: 0,
    time_coverage: "2024-08-01..2026-07-31 where monthly",
    story_coverage: storyThreads,
    quality_rules: [
      "tenant and dataset identity required",
      "row_hash recomputes from row payload",
      "source path must remain tenant and dataset scoped",
      "no PII, PHI, patient-level facts or free-text ticket detail",
    ],
  };
}

function buildWorkbookFieldGuidance() {
  const sourceExamples = {
    ServiceNow: ["Vendor Management -> Vendor Performance", "ITSM -> Incident Problem Change aggregate", "CMDB/CSDM -> Business Application Business Service CI", "SLA -> Task SLA attainment summary"],
    Workday: ["Supplier", "Supplier Invoice", "Accounting Journal", "Cost Center", "Spend Category", "Worker Position summary", "Finance/HCM module entitlement and usage exports"],
    "Contract repository": ["Agreement register", "Executed agreement", "SOW", "Amendment", "Pricing schedule", "SLA schedule", "Renewal termination clause"],
    Epic: ["Application module inventory", "Clarity Caboodle database and reporting inventory", "Interface inventory", "Release support responsibility mapping"],
  };
  const domainTabs = [
    "12_VENDORS", "13_CONTRACT_FAMILIES", "14_LEGAL_INSTRUMENTS", "15_CONTRACT_DOCUMENTS",
    "16_INVOICES_AND_SPEND", "17_PURCHASE_ORDERS", "18_APPLICATIONS_AND_PLATFORMS",
    "19_CMDB_SERVICES_AND_CIS", "20_SLA_AND_TICKET_SUMMARIES", "21_SERVICE_CREDITS",
    "22_WORKFORCE_AND_RATE_CARDS", "23_SAAS_AND_LICENSE_USAGE", "24_CLOUD_AND_DATA_PLATFORM_USAGE",
    "25_PROGRAMS_AND_INITIATIVES", "26_ARCHITECTURE_AND_DEPENDENCIES", "27_METRICS_AND_OUTCOMES",
    "28_RISKS_AND_CONTROLS", "29_SOURCING_EVENTS", "30_SUPPLIER_RESPONSES",
    "31_BAFO_AND_NORMALIZATION", "32_BPO_CURRENT_STATE_VOLUMES", "33_BPO_CURRENT_STATE_WORKFORCE",
    "34_BPO_PROCESS_AND_CONTROL_MATRIX",
  ];
  const fields = [];
  for (const tab of domainTabs) {
    const domain = tab.replace(/^\d+_/u, "").toLowerCase();
    for (const field of ["native_id", "owner_role", "financial_amount", "service_scope", "period_month", "evidence_ref", "quality_state"]) {
      const source = field.includes("financial") ? "Workday" : field.includes("service") ? "ServiceNow" : field.includes("evidence") ? "Contract repository" : "Epic";
      fields.push({
        tab,
        "AbarVa target domain": domain,
        "AbarVa target entity": domain.replaceAll("_", " "),
        "target field": field,
        "plain-English definition": `${field.replaceAll("_", " ")} at the ${domain.replaceAll("_", " ")} grain.`,
        "why it matters": "Needed for source-first answerability, evidence lineage, reconciliation and later Cube drill paths.",
        requirement: field === "evidence_ref" ? "conditional" : "required",
        "preferred source system": source,
        "source module": sourceExamples[source][0],
        "exact source object/table": sourceExamples[source].join("; "),
        "exact report/API/export name": `${source} ${field} governed export`,
        "UI navigation or extraction path": `${source} admin export -> ${sourceExamples[source][0]} -> CSV`,
        "native source field": field,
        "alternate source": "Structured team workbook only when authoritative extract is unavailable.",
        "record grain": "one row per native object or month depending on tab",
        "primary key": `${domain}_id`,
        "join key": "vendor_id contract_family_id application_id evidence_ref as applicable",
        "time period": "2024-08-01 through 2026-07-31 for monthly history",
        "transformation/mapping": "Map native field to canonical candidate; preserve upstream lineage without product shaping.",
        "allowed values": "Declared enums in template or explicit evidence gap.",
        "realistic example": `${domain.toUpperCase()}-${pad(fields.length + 1, 5)}`,
        "responsible collecting role": "System or data owner for the native export.",
        "accountable validation role": "Accountable executive delegate or finance/vendor owner.",
        "interview fallback": "Allowed only as answer_source=interview with validation status pending.",
        "evidence requirement": "Authoritative extract, governed report, executed document or explicit gap.",
        "confidence rule": "High for system extract, medium for governed workbook, low for interview-only.",
        "data-quality rule": "Required keys, tenant identity, row hash, allowed enum and relationship checks must pass.",
        "synthetic generation rule": "Deterministic seed creates values and records formula key in manifest.",
      });
    }
  }
  return fields;
}

function buildEnterpriseOutcomesKpiMap() {
  const portfolioSpecs = [
    ["enterprise", 6, "Enterprise Strategy Sponsor", "enterprise_operating_committee"],
    ["health plan", 8, "Health Plan Executive", "plan_business_review"],
    ["hospitals and clinical operations", 8, "Clinical Operations Executive", "clinical_operations_review"],
    ["revenue cycle", 4, "Revenue Cycle Executive", "revenue_cycle_review"],
    ["finance", 5, "CFO Finance Executive", "finance_performance_review"],
    ["supply chain and procurement", 5, "Chief Procurement Supply Chain Officer", "supply_chain_review"],
    ["human resources", 3, "HR Operations Executive", "workforce_review"],
    ["shared services", 3, "Shared Services BPO Executive", "shared_services_review"],
    ["digital and patient/member experience", 3, "Digital Experience Executive", "experience_review"],
    ["information technology", 8, "CIO", "technology_portfolio_review"],
    ["data, analytics and AI", 8, "CDAO", "data_analytics_ai_review"],
    ["cybersecurity", 5, "CISO", "security_risk_review"],
    ["quality, compliance and enterprise risk", 4, "Compliance Risk Executive", "quality_risk_review"],
  ];
  const classifications = [
    "enterprise_outcome",
    "business_unit_outcome",
    "leading_driver",
    "operational_indicator",
    "risk_guardrail",
  ];
  const desiredDirections = ["increase", "decrease", "maintain", "optimize", "monitor"];
  const evidenceStates = ["confirmed", "reported", "estimated", "unresolved"];
  const rows = [];
  for (const [portfolio, count, executiveOwner, forum] of portfolioSpecs) {
    for (let i = 0; i < count; i += 1) {
      const classification = classifications[(rows.length + i) % classifications.length];
      rows.push({
        record_id: `OUTCOME-${pad(rows.length + 1, 3)}`,
        enterprise_or_business_unit: portfolio === "enterprise" ? "enterprise" : "business_unit",
        portfolio_or_function: portfolio,
        business_purpose: `Clarify what ${portfolio} exists to accomplish during four-week discovery.`,
        strategic_priority: pick(["access and affordability", "operational reliability", "margin resilience", "member and patient experience", "risk reduction", "data-driven transformation"]),
        outcome_or_indicator_name: `${portfolio} ${classification.replaceAll("_", " ")} ${i + 1}`,
        classification,
        "plain-English definition": `A lightweight discovery record for a meaningful ${portfolio} outcome, driver or guardrail.`,
        why_it_matters: "Gives Home, Intelligence, Moves, Tower and Source enough business context without forcing a full KPI redesign.",
        desired_direction: desiredDirections[(rows.length + i) % desiredDirections.length],
        executive_owner_role: executiveOwner,
        operating_owner_role: `${portfolio} operating leader`,
        primary_decision_supported: pick(["portfolio priority validation", "vendor dependency review", "transformation sequencing", "investment trade-off", "risk guardrail confirmation"]),
        review_forum: forum,
        review_cadence: pick(["monthly", "quarterly", "weekly operations", "board cycle", "as needed"]),
        related_business_units: portfolio === "enterprise" ? "enterprise; health plan; hospitals and clinical operations" : portfolio,
        related_capabilities: pick(["vendor management; analytics", "clinical operations; service management", "finance operations; procurement", "security; risk management", "digital experience; data platforms"]),
        related_processes: pick(["planning and budgeting", "sourcing and contract governance", "incident and service review", "claims and operations review", "workforce and shared services planning"]),
        key_systems_or_data_sources: pick(["Workday; ServiceNow; contract repository", "Epic; Clarity; Caboodle; analytics marts", "supplier reports; local purchasing files", "security scorecards; GRC register", "strategy documents; scorecards; board materials"]),
        material_vendor_or_contract_dependency: pick(["data analytics managed services", "Epic managed services", "Workday SaaS and services", "medical surgical distribution", "facilities EVS", "BPO sourcing event"]),
        related_initiatives: pick(["Hadoop retirement", "AWS Databricks decision", "BPO operating model", "SAS rationalization", "contract scope cleanup"]),
        current_value_optional: i % 4 === 0 ? "" : "optional during discovery",
        target_value_optional: i % 5 === 0 ? "" : "optional during discovery",
        formula_optional: i % 3 === 0 ? "" : "team supplied if available",
        history_available: pick(["yes", "partial", "no", "unknown"]),
        evidence_source: pick(["strategy document", "operating plan", "scorecard", "board material", "existing report", "team prework"]),
        confidence_state: evidenceStates[(rows.length + i) % evidenceStates.length],
        validation_owner_role: `${portfolio} validation owner`,
        notes_or_known_gap: i % 6 === 0 ? "Formula or source lineage may require follow-on enrichment." : "",
      });
    }
  }
  return rows.slice(0, 52);
}

async function writeCsv(filePath, rows) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const text = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n") + "\n";
  await fs.writeFile(filePath, text);
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function writeText(filePath, text) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text);
}

function colName(index) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const rem = (value - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

async function writeXlsx(filePath, sheets) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "phs-xlsx-"));
  await fs.mkdir(path.join(tmp, "_rels"), { recursive: true });
  await fs.mkdir(path.join(tmp, "xl", "_rels"), { recursive: true });
  await fs.mkdir(path.join(tmp, "xl", "worksheets"), { recursive: true });
  await writeText(path.join(tmp, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  await writeText(path.join(tmp, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  await writeText(path.join(tmp, "xl", "_rels", "workbook.xml.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`);
  await writeText(path.join(tmp, "xl", "workbook.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, i) => `<sheet name="${xmlEscape(sheet.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  for (const [sheetIndex, sheet] of sheets.entries()) {
    const rows = sheet.rows || [];
    const sheetData = rows.map((row, rowIndex) => {
      const cells = row.map((value, colIndex) => `<c r="${colName(colIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
    await writeText(path.join(tmp, "xl", "worksheets", `sheet${sheetIndex + 1}.xml`), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`);
  }
  await fs.rm(filePath, { force: true });
  await execFileAsync("zip", ["-qr", filePath, "."], { cwd: tmp });
  await fs.rm(tmp, { recursive: true, force: true });
}

async function zipDir(sourceDir, zipPath) {
  await fs.rm(zipPath, { force: true });
  await execFileAsync("zip", ["-qr", zipPath, "."], { cwd: sourceDir });
}

async function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(await fs.readFile(filePath));
  return hash.digest("hex");
}

async function copyToDownloads(stagePath, downloadsPath) {
  await fs.copyFile(stagePath, downloadsPath);
  return { path: downloadsPath, sha256: await sha256File(downloadsPath) };
}

function buildRows() {
  const fileRows = new Map();
  const fileContracts = [];
  const addSpec = (tuple, group) => {
    const spec = makeSpec(tuple, group);
    fileRows.set(spec.path, []);
    fileContracts.push(spec);
    return spec;
  };
  const specs = Object.fromEntries(sourceFileSpecs.map((tuple) => [tuple[0], addSpec(tuple, "source_system_extracts")]));
  const bpoSpecs = Object.fromEntries(bpoFileSpecs.map((tuple) => [tuple[0], addSpec(tuple, "bpo_sourcing_event")]));
  const add = (spec, specific) => {
    fileRows.get(spec.path).push(common({
      path: spec.path,
      sourceSystem: spec.source_system,
      sourceModule: spec.source_module,
      sourceObject: spec.source_object,
      primaryKey: spec.primary_key,
      storyThread: specific.story_thread_ref,
    }, specific));
  };
  const periodMonths = months();
  const facilities = ["Hospital North", "Hospital Central", "Hospital West", "Ambulatory East", "Plan Operations"];
  const functions = ["finance_operations", "hr_operations", "supply_chain_operations", "procurement_support", "shared_services_admin"];
  const applications = Array.from({ length: 180 }, (_, i) => `APP-${pad(i + 1, 4)}`);
  const services = Array.from({ length: 220 }, (_, i) => `CI-${pad(i + 1, 4)}`);

  for (const [vendor_id, legal_name, category, tier] of vendors) {
    add(specs["WORKDAY_SUPPLIERS.csv"], { vendor_id, legal_name, supplier_category: category, risk_tier: tier, status: "active", story_thread_ref: storyThreads[vendors.findIndex((v) => v[0] === vendor_id) % storyThreads.length] });
  }
  for (let i = 0; i < 18_000; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    const contract = contractFamilies[i % contractFamilies.length];
    const line = {
      invoice_line_id: `WD-INV-L-${pad(i + 1, 6)}`,
      invoice_id: `WD-INV-${pad(Math.floor(i / 6) + 1, 5)}`,
      vendor_id: contract[2],
      contract_family_id: contract[0],
      cost_center_id: `CC-${pad((i % 45) + 1, 3)}`,
      spend_category_id: `SC-${pad((i % 32) + 1, 3)}`,
      period_start: month.start,
      period_end: month.end,
      invoice_date: month.end,
      line_amount: money(850 + random() * 42_000 + (contract[0] === "CF-001" ? 6500 : 0)),
      rate_card_match_state: i % 17 === 0 ? "variance_requires_review" : "matched_or_expected",
      evidence_ref: `EVID-SPAN-${pad((i % 16_000) + 1, 5)}`,
      story_thread_ref: contract[5],
    };
    add(specs["WORKDAY_SUPPLIER_INVOICES.csv"], line);
  }
  for (let i = 0; i < 2_400; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["WORKDAY_PAYMENTS.csv"], { payment_id: `WD-PAY-${pad(i + 1, 5)}`, invoice_id: `WD-INV-${pad((i % 3000) + 1, 5)}`, vendor_id: contractFamilies[i % contractFamilies.length][2], period_start: month.start, period_end: month.end, payment_amount: money(15_000 + random() * 180_000), payment_status: "settled", story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 45; i += 1) add(specs["WORKDAY_COST_CENTERS.csv"], { cost_center_id: `CC-${pad(i + 1, 3)}`, cost_center_name: `${pick(functions)} cost center ${i + 1}`, owner_role: pick(["Finance partner", "Supply chain controller", "IT finance lead"]), story_thread_ref: storyThreads[i % storyThreads.length] });
  for (let i = 0; i < 32; i += 1) add(specs["WORKDAY_SPEND_CATEGORIES.csv"], { spend_category_id: `SC-${pad(i + 1, 3)}`, spend_category_name: pick(["managed services", "software subscriptions", "medical supplies", "facilities services", "professional services"]), category_owner_role: pick(["CPO delegate", "IT finance", "Facilities finance"]), story_thread_ref: storyThreads[i % storyThreads.length] });
  for (let i = 0; i < 1_800; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["WORKDAY_WORKER_ROLE_SUMMARY.csv"], { role_month_id: `WD-WR-${pad(i + 1, 5)}`, function_ref: functions[i % functions.length], role_family: pick(["analyst", "specialist", "manager", "supervisor", "operations lead"]), location_model: "US_based_internal", fte_count: 1 + (i % 4), loaded_labor_cost: money(7_500 + random() * 8_000), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[5] });
  }
  for (let i = 0; i < 6_000; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["LOCAL_HOSPITAL_PURCHASES.csv"], { po_line_id: `LHP-PO-${pad(i + 1, 6)}`, facility: facilities[i % facilities.length], item_id: `ITEM-${pad((i % 420) + 1, 4)}`, contract_family_id: "CF-004", purchase_channel: i % 9 === 0 ? "off_contract_local" : "contracted_distributor", quantity: 1 + (i % 120), unit_price: money(3 + random() * 950), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[3] });
  }
  for (let i = 0; i < 420; i += 1) add(specs["MEDSURG_ITEM_MASTER.csv"], { item_id: `ITEM-${pad(i + 1, 4)}`, category: pick(["gloves", "syringes", "wound care", "lab consumable", "procedure kit"]), equivalent_group: `EQ-${pad((i % 80) + 1, 3)}`, contracted_item: i % 7 === 0 ? "false" : "true", story_thread_ref: storyThreads[3] });
  for (let i = 0; i < 840; i += 1) add(specs["MEDSURG_PRICE_TIERS.csv"], { price_tier_id: `MST-${pad(i + 1, 5)}`, item_id: `ITEM-${pad((i % 420) + 1, 4)}`, facility: facilities[i % facilities.length], tier: `tier_${(i % 4) + 1}`, unit_price: money(2 + random() * 900), story_thread_ref: storyThreads[3] });
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["MEDSURG_BACKORDERS_SUBSTITUTIONS.csv"], { substitution_id: `MSS-${pad(i + 1, 5)}`, item_id: `ITEM-${pad((i % 420) + 1, 4)}`, facility: facilities[i % facilities.length], backorder_count: i % 6, substitution_count: i % 5, incremental_cost: money(random() * 1200), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[3] });
  }
  for (let i = 0; i < 480; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["MEDSURG_REBATES_CREDITS.csv"], { rebate_id: `MSR-${pad(i + 1, 5)}`, facility: facilities[i % facilities.length], category: pick(["gloves", "wound care", "procedure kit"]), earned_rebate_amount: money(300 + random() * 9000), reconciled_rebate_amount: money(200 + random() * 7000), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[3] });
  }
  for (const contract of contractFamilies) {
    add(specs["CONTRACT_REGISTER.csv"], { contract_family_id: contract[0], contract_name: contract[1], vendor_id: contract[2], synthetic_midpoint_total_contract_value: contract[3], evidence_tier: contract[4], renewal_window: "2027 planning", story_thread_ref: contract[5] });
  }
  for (let i = 0; i < 24; i += 1) {
    const contract = contractFamilies[i % contractFamilies.length];
    add(specs["CONTRACT_INSTRUMENTS.csv"], { instrument_id: `LI-${pad(i + 1, 3)}`, contract_family_id: contract[0], instrument_type: pick(["MSA", "SOW", "Amendment", "Pricing Schedule", "SLA Schedule", "Security Schedule", "Exit Terms"]), effective_date: `202${4 + (i % 3)}-${pad((i % 12) + 1, 2)}-01`, document_ref: `DOC-${pad((i % 30) + 1, 3)}`, story_thread_ref: contract[5] });
  }
  for (let i = 0; i < 18; i += 1) add(specs["CONTRACT_AMENDMENTS.csv"], { amendment_id: `AMD-${pad(i + 1, 3)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], amendment_theme: pick(["scope change", "rate update", "term extension", "service level revision"]), financial_effect: money(-50_000 + random() * 400_000), story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < 420; i += 1) add(specs["CONTRACT_RATE_CARDS.csv"], { rate_card_id: `RC-${pad(i + 1, 4)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], role_title: pick(["developer", "analyst", "architect", "service manager", "operations specialist"]), location_model: pick(["US", "nearshore", "offshore"]), contracted_rate: money(45 + random() * 175), billed_rate_observed: money(48 + random() * 195), story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < 96; i += 1) add(specs["CONTRACT_SLA_TERMS.csv"], { sla_term_id: `SLA-T-${pad(i + 1, 4)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], metric_name: pick(["P1 response", "P2 resolution", "availability", "backlog aging", "fill rate"]), target: pick(["95", "98", "99.5", "30 days"]), credit_formula_key: "synthetic_credit_schedule_v1", story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < 54; i += 1) add(specs["CONTRACT_RENEWAL_EXIT_TERMS.csv"], { clause_id: `CL-${pad(i + 1, 4)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], clause_type: pick(["renewal notice", "termination for convenience", "exit assistance", "knowledge transfer", "data return"]), extracted_state: i % 5 === 0 ? "partial_evidence" : "accepted_extraction", story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < 90; i += 1) add(specs["SERVICENOW_VENDOR_SERVICES.csv"], { vendor_service_id: `SN-VS-${pad(i + 1, 4)}`, vendor_id: contractFamilies[i % contractFamilies.length][2], contract_family_id: contractFamilies[i % contractFamilies.length][0], service_tower: pick(["application support", "data operations", "clinical platform", "facilities", "cyber operations"]), business_service_ref: `BS-${pad((i % 70) + 1, 3)}`, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < applications.length; i += 1) add(specs["SERVICENOW_CMDB_APPLICATIONS.csv"], { application_id: applications[i], application_name: `Synthetic Healthcare Application ${pad(i + 1, 3)}`, owner_function: pick(["clinical operations", "health plan analytics", "finance", "supply chain", "data and analytics"]), lifecycle: pick(["run", "modernize", "retire_candidate", "consolidate"]), criticality: pick(["high", "medium", "low"]), story_thread_ref: i % 3 === 0 ? storyThreads[6] : storyThreads[i % storyThreads.length] });
  for (let i = 0; i < services.length; i += 1) add(specs["SERVICENOW_CSDM_BUSINESS_SERVICES.csv"], { ci_id: services[i], business_service_ref: `BS-${pad((i % 70) + 1, 3)}`, application_id: applications[i % applications.length], ci_class: pick(["business_service", "application_service", "database", "interface", "platform"]), support_group: pick(["Epic support", "Data operations", "Enterprise apps", "Infrastructure"]), story_thread_ref: storyThreads[i % storyThreads.length] });
  for (let i = 0; i < 5_040; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["SERVICENOW_MONTHLY_ITSM_SUMMARY.csv"], { itsm_summary_id: `SN-ITSM-${pad(i + 1, 6)}`, vendor_id: contractFamilies[i % contractFamilies.length][2], contract_id: contractFamilies[i % contractFamilies.length][0], service_ref: `SV-${pad((i % 90) + 1, 3)}`, business_service_ref: `BS-${pad((i % 70) + 1, 3)}`, application_ref: applications[i % applications.length], ci_ref: services[i % services.length], ci_class: pick(["application", "database", "interface", "platform"]), service_tower: pick(["clinical", "analytics", "corporate", "supply_chain"]), tickets_opened: 5 + (i % 70), tickets_closed: 4 + (i % 69), p1_count: i % 21 === 0 ? 1 : 0, p2_count: i % 7, sla_breach_count: i % 13 === 0 ? 2 : i % 4, response_sla_pct: money(91 + random() * 8), resolution_sla_pct: money(88 + random() * 10), mean_time_to_acknowledge: money(0.4 + random() * 3), mean_time_to_resolve: money(4 + random() * 72), backlog_count: i % 55, backlog_over_30_days: i % 9, reopened_count: i % 8, problem_records_opened: i % 4, problem_records_closed: i % 3, changes_completed: i % 20, failed_changes: i % 17 === 0 ? 1 : 0, availability_pct: money(98.5 + random() * 1.4), service_credit_eligible_amount: money((i % 13 === 0 ? 1 : 0) * (1000 + random() * 9000)), service_credit_claimed_amount: money((i % 26 === 0 ? 1 : 0) * (500 + random() * 4000)), evidence_ref: `EVID-SPAN-${pad((i % 16_000) + 1, 5)}`, source_report_or_api: "ServiceNow monthly aggregate export", period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 2_880; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["SERVICENOW_MONTHLY_SLA_SUMMARY.csv"], { sla_summary_id: `SN-SLA-${pad(i + 1, 6)}`, vendor_id: contractFamilies[i % contractFamilies.length][2], contract_id: contractFamilies[i % contractFamilies.length][0], service_ref: `SV-${pad((i % 90) + 1, 3)}`, sla_metric: pick(["P1 response", "P2 resolution", "backlog aging", "availability"]), target_pct: 95, actual_pct: money(88 + random() * 12), breach_count: i % 11, period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    const eligible = money((i % 3 === 0 ? 1 : 0) * (800 + random() * 12_000));
    add(specs["SERVICENOW_SERVICE_CREDITS.csv"], { service_credit_id: `SN-CRED-${pad(i + 1, 5)}`, contract_id: contractFamilies[i % contractFamilies.length][0], service_ref: `SV-${pad((i % 90) + 1, 3)}`, eligible_amount: eligible, claimed_amount: money(eligible * (i % 4 === 0 ? 0.25 : 0)), claim_state: eligible > 0 ? "eligible_underclaimed" : "not_earned", period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 34; i += 1) add(specs["EPIC_MODULE_INVENTORY.csv"], { module_id: `EPIC-MOD-${pad(i + 1, 3)}`, module_name: pick(["Resolute", "Cadence", "Prelude", "Willow", "Clarity", "Caboodle", "Bridges"]), support_scope_state: i % 6 === 0 ? "overlap_requires_resolution" : "explicit", contract_family_id: "CF-002", story_thread_ref: storyThreads[1] });
  for (let i = 0; i < 240; i += 1) add(specs["EPIC_INTERFACE_INVENTORY.csv"], { interface_id: `EPIC-IF-${pad(i + 1, 4)}`, module_id: `EPIC-MOD-${pad((i % 34) + 1, 3)}`, application_id: applications[i % applications.length], interface_type: pick(["HL7", "FHIR", "batch", "API"]), responsibility_state: i % 9 === 0 ? "unresolved" : "explicit", story_thread_ref: storyThreads[1] });
  for (let i = 0; i < 180; i += 1) add(specs["CLARITY_CABOODLE_ASSET_INVENTORY.csv"], { asset_id: `EC-ASSET-${pad(i + 1, 4)}`, platform: pick(["Clarity", "Caboodle"]), reporting_domain: pick(["clinical quality", "population health", "finance", "operations"]), downstream_mart_id: `MART-${pad((i % 140) + 1, 4)}`, story_thread_ref: storyThreads[6] });
  for (let i = 0; i < 96; i += 1) add(specs["HADOOP_CLUSTER_WORKLOADS.csv"], { workload_id: `HD-WL-${pad(i + 1, 4)}`, cluster_ref: `HADOOP-${(i % 5) + 1}`, workload_name: `synthetic workload ${i + 1}`, retirement_dependency: i % 3 === 0 ? "contract_scope_fee_reduction_not_linked" : "migration_candidate", story_thread_ref: storyThreads[0] });
  for (let i = 0; i < 140; i += 1) add(specs["SQL_SERVER_DATA_MARTS.csv"], { mart_id: `MART-${pad(i + 1, 4)}`, owner_function: pick(["analytics", "finance", "clinical operations", "health plan"]), redundancy_state: i % 5 === 0 ? "overlap_with_sas_or_caboodle" : "unique_current_use", story_thread_ref: storyThreads[6] });
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["SAS_APPLICATIONS_AND_USERS.csv"], { sas_usage_id: `SAS-U-${pad(i + 1, 5)}`, application_ref: `SAS-APP-${pad((i % 80) + 1, 3)}`, usage_group: pick(["actuarial", "quality", "finance", "population health"]), active_user_count: 2 + (i % 70), migration_state: i % 6 === 0 ? "needs_decision" : "inventory_only", period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[6] });
  }
  for (let i = 0; i < 760; i += 1) add(specs["ANALYTICS_PLATFORM_DEPENDENCIES.csv"], { dependency_id: `DEP-${pad(i + 1, 5)}`, source_ref: pick([...applications, `MART-${pad((i % 140) + 1, 4)}`]), target_ref: pick(["AWS", "Databricks", "Epic Caboodle", "Hadoop retirement", "SAS rationalization"]), dependency_type: pick(["feeds", "hosts", "replaces", "must_sequence_before", "funding_dependency"]), decision_required: i % 4 === 0 ? "true" : "false", story_thread_ref: storyThreads[6] });
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["SAAS_MODULE_USAGE_MONTHLY.csv"], { usage_id: `SAAS-U-${pad(i + 1, 5)}`, vendor_id: pick(["VND-003", "VND-009"]), module_name: pick(["Workday Prism", "Workday Adaptive", "ServiceNow APM", "Vendor Management"]), entitled_users: 500 + (i % 2500), active_users: 100 + (i % 1300), low_usage_flag: i % 5 === 0 ? "true" : "false", period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[2] });
  }
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["AWS_TARGET_COMMITMENT_SCENARIOS.csv"], { aws_scenario_id: `AWS-SC-${pad(i + 1, 5)}`, scenario: pick(["retain_on_premise_longer", "balanced_migration", "accelerated_data_platform"]), service_name: pick(["EC2", "S3", "Redshift", "Glue"]), estimated_monthly_commitment: money(20_000 + random() * 420_000), prerequisite_decision: pick(["Databricks direction", "Hadoop retirement", "SAS strategy"]), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[6] });
  }
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv"], { databricks_scenario_id: `DBX-SC-${pad(i + 1, 5)}`, workspace: `workspace_${(i % 8) + 1}`, estimated_dbu_commitment: money(500 + random() * 15_000), prerequisite_decision: pick(["AWS landing zone", "data governance model", "legacy platform retirement"]), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[6] });
  }
  for (let i = 0; i < 1_800; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["VENDOR_WORKFORCE_MONTHLY.csv"], { workforce_month_id: `VWF-${pad(i + 1, 5)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], role_title: pick(["analyst", "developer", "service manager", "data engineer", "architect"]), location_model: pick(["US", "nearshore", "offshore"]), contracted_pyramid_band: pick(["lead", "senior", "mid", "junior"]), billed_fte: money(0.5 + random() * 8), contracted_mix_pct: money(5 + random() * 25), billed_mix_pct: money(5 + random() * 35), period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 2_400; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["VENDOR_RATE_CARD_INVOICES.csv"], { rate_invoice_id: `VRI-${pad(i + 1, 6)}`, invoice_line_id: `WD-INV-L-${pad((i % 18_000) + 1, 6)}`, rate_card_id: `RC-${pad((i % 420) + 1, 4)}`, billed_hours: money(20 + random() * 160), billed_rate: money(50 + random() * 190), contracted_rate: money(45 + random() * 170), variance_state: i % 8 === 0 ? "above_contract_band" : "within_band", period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 720; i += 1) add(specs["CONTRACT_SCOPE_RELATIONSHIPS.csv"], { scope_relationship_id: `SCOPE-${pad(i + 1, 5)}`, vendor_id: contractFamilies[i % contractFamilies.length][2], contract_family_id: contractFamilies[i % contractFamilies.length][0], legal_instrument_id: `LI-${pad((i % 24) + 1, 3)}`, contracted_service_id: `SV-${pad((i % 90) + 1, 3)}`, business_service_ref: `BS-${pad((i % 70) + 1, 3)}`, application_ref: applications[i % applications.length], ci_ref: services[i % services.length], relationship_confidence: i % 11 === 0 ? "inferred_requires_review" : "explicit", story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < 360; i += 1) add(specs["PROGRAMS_INITIATIVES_DEPENDENCIES.csv"], { program_dependency_id: `PROG-DEP-${pad(i + 1, 5)}`, program_ref: `PROG-${pad((i % 24) + 1, 3)}`, initiative_ref: `INIT-${pad(i + 1, 4)}`, dependency_ref: pick(["AWS decision", "Databricks decision", "BPO operating model", "Epic scope resolution", "Hadoop retirement"]), target_quarter: `202${6 + (i % 2)}Q${(i % 4) + 1}`, story_thread_ref: storyThreads[i % storyThreads.length] });
  for (let i = 0; i < 480; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["RISK_CONTROL_OBSERVATIONS.csv"], { risk_control_id: `RC-OBS-${pad(i + 1, 5)}`, risk_ref: `RISK-${pad((i % 60) + 1, 3)}`, control_ref: `CTRL-${pad((i % 75) + 1, 3)}`, domain: pick(["vendor", "security", "financial", "operational", "data_governance"]), observation_state: i % 6 === 0 ? "gap_requires_validation" : "operating", period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[i % storyThreads.length] });
  }

  for (let i = 0; i < 360; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(bpoSpecs["BPO_CURRENT_STATE_PROCESS_VOLUMES.csv"], { process_volume_id: `BPO-PV-${pad(i + 1, 5)}`, function_ref: functions[i % functions.length], process_name: pick(["invoice processing", "employee inquiry", "supplier onboarding", "purchase support", "shared service administration"]), monthly_volume: 500 + (i % 9000), current_sla: pick(["2 days", "5 days", "10 days"]), automation_opportunity: i % 3 === 0 ? "high" : "medium", period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[5] });
  }
  for (let i = 0; i < 150; i += 1) add(bpoSpecs["BPO_CURRENT_STATE_WORKFORCE.csv"], { current_workforce_id: `BPO-WF-${pad(i + 1, 4)}`, function_ref: functions[i % functions.length], role_family: pick(["processor", "specialist", "supervisor", "manager"]), location_model: "US_internal", resource_count: 1, loaded_labor_cost_annual: money(82_000 + random() * 48_000), leadership_or_retained_org: i % 15 === 0 ? "retained_leadership" : "delivery_baseline", story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 360; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(bpoSpecs["BPO_CURRENT_STATE_COST_BASELINE.csv"], { cost_baseline_id: `BPO-COST-${pad(i + 1, 5)}`, function_ref: functions[i % functions.length], labor_cost: money(240_000 + random() * 900_000), technology_cost: money(20_000 + random() * 120_000), controls_cost: money(10_000 + random() * 50_000), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[5] });
  }
  const suppliers = ["BPO-A", "BPO-B", "BPO-C", "BPO-D", "BPO-E"];
  for (let i = 0; i < 360; i += 1) add(bpoSpecs["BPO_RFP_REQUIREMENTS.csv"], { requirement_id: `BPO-REQ-${pad(i + 1, 4)}`, requirement_domain: functions[i % functions.length], requirement_text: `Structured requirement ${i + 1} for ${functions[i % functions.length]} scope, controls, transition or automation.`, criticality: pick(["must_have", "weighted", "nice_to_have"]), evidence_required: "supplier response plus pricing or staffing support", story_thread_ref: storyThreads[5] });
  for (const [i, supplier] of suppliers.entries()) add(bpoSpecs["BPO_SUPPLIERS.csv"], { supplier_event_id: `BPO-SUP-${pad(i + 1, 3)}`, supplier_id: supplier, invitation_state: "invited", headline_price_rank: i + 1, normalized_recommendation_rank: supplier === "BPO-C" ? 1 : i + 2, story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 720; i += 1) add(bpoSpecs["BPO_SUPPLIER_RESPONSES.csv"], { supplier_response_id: `BPO-RSP-${pad(i + 1, 5)}`, supplier_id: suppliers[i % suppliers.length], requirement_id: `BPO-REQ-${pad((i % 360) + 1, 4)}`, response_state: pick(["meets", "partially_meets", "exception_taken"]), automation_commitment: money(3 + random() * 18), evidence_ref: `EVID-SPAN-${pad((i % 16_000) + 1, 5)}`, story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 720; i += 1) add(bpoSpecs["BPO_COMMERCIAL_LINES.csv"], { commercial_line_id: `BPO-COM-${pad(i + 1, 5)}`, supplier_id: suppliers[i % suppliers.length], function_ref: functions[i % functions.length], year: 2027 + (i % 5), service_fee: money(25_000 + random() * 320_000), transition_cost: money(i % 5 === 0 ? 50_000 + random() * 500_000 : random() * 50_000), retained_org_cost: money(10_000 + random() * 80_000), risk_adjustment: money(random() * 65_000), story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 720; i += 1) add(bpoSpecs["BPO_EVALUATION_SCORES.csv"], { evaluation_score_id: `BPO-EVAL-${pad(i + 1, 5)}`, supplier_id: suppliers[i % suppliers.length], requirement_id: `BPO-REQ-${pad((i % 360) + 1, 4)}`, evaluator_role: pick(["finance", "procurement", "operations", "controls", "technology"]), score: money(2.5 + random() * 2.5), weighted_score: money(1 + random() * 10), story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 180; i += 1) add(bpoSpecs["BPO_CLARIFICATIONS.csv"], { clarification_id: `BPO-CLAR-${pad(i + 1, 4)}`, supplier_id: suppliers[i % suppliers.length], requirement_id: `BPO-REQ-${pad((i % 360) + 1, 4)}`, topic: pick(["transition", "controls", "automation", "retained organization", "pricing"]), status: pick(["answered", "open", "incorporated_in_bafo"]), story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 300; i += 1) add(bpoSpecs["BPO_BAFO_RESPONSES.csv"], { bafo_response_id: `BPO-BAFO-${pad(i + 1, 4)}`, supplier_id: suppliers[i % suppliers.length], function_ref: functions[i % functions.length], bafo_service_fee: money(22_000 + random() * 280_000), bafo_exception_state: i % 6 === 0 ? "exception_remains" : "accepted", story_thread_ref: storyThreads[5] });
  for (let i = 0; i < 25; i += 1) add(bpoSpecs["BPO_NORMALIZED_TCO.csv"], { normalized_tco_id: `BPO-TCO-${pad(i + 1, 3)}`, supplier_id: suppliers[i % suppliers.length], scenario: pick(["retain_and_automate", "hybrid_shared_services", "function_managed_services", "single_provider_bpo", "multi_provider_specialist"]), year: 2027 + (i % 5), headline_price: money(8_000_000 + random() * 25_000_000), normalized_five_year_tco: money((suppliers[i % suppliers.length] === "BPO-C" ? 42_000_000 : 45_000_000) + random() * 18_000_000), recommendation_state: suppliers[i % suppliers.length] === "BPO-C" ? "recommended_after_normalization" : "not_recommended_after_normalization", story_thread_ref: storyThreads[5] });

  for (const spec of fileContracts) {
    spec.expected_rows = fileRows.get(spec.path).length;
    spec.required_fields = Array.from(new Set(fileRows.get(spec.path).flatMap((row) => Object.keys(row)))).sort();
  }
  return { fileRows, fileContracts };
}

function buildQuestionBank() {
  const domains = ["Source vendor 360", "contract economics", "spend and invoices", "SLA service credits", "renewal leverage", "CMDB dependencies", "application architecture", "SaaS usage", "cloud data commitments", "workforce rate cards", "medical surgical procurement", "operational services", "BPO sourcing", "supplier BAFO", "Home enterprise context", "health plan context", "data analytics current state", "Intelligence advisory", "Moves roadmap", "Tower value proof", "evidence lineage"];
  const questions = [];
  const coverage = [];
  for (let i = 0; i < 180; i += 1) {
    const domain = domains[i % domains.length];
    const story = storyThreads[i % storyThreads.length];
    const qid = `PHS-HQ-${pad(i + 1, 3)}`;
    questions.push({
      question_id: qid,
      domain,
      question: `Which ${domain.toLowerCase()} pattern requires executive action for synthetic story thread ${story.replaceAll("_", " ")}?`,
      executive_intent: `Clarify action, owner and evidence depth for ${domain}.`,
      expected_answer: "A tenant-scoped answer with cited source extracts, document spans, relationship keys and explicit caveats.",
      required_source_domains: ["contract_repository", "finance_procurement", "service_management_cmdb", "bpo_sourcing"].slice(0, 2 + (i % 3)),
      required_measures: ["spend", "count", "variance", "service_credit", "normalized_tco"].slice(0, 2 + (i % 4)),
      required_dimensions: ["vendor", "contract_family", "service", "application", "facility", "month"].slice(0, 3 + (i % 3)),
      required_grain: pick(["vendor_contract_month", "contract_service_application_month", "facility_category_month", "supplier_requirement_line", "platform_dependency"]),
      required_relationship: "Vendor -> Contract family -> Legal instrument -> Service -> Business service -> Application or CI -> Evidence.",
      required_history: i % 2 === 0 ? "24 months" : "current snapshot plus 24-month supporting trend",
      required_evidence_depth: { min_source_domains: 2, min_source_records: 5, evidence_tier: i % 4 === 0 ? "tier_1_full_evidence" : "selected_or_context_evidence" },
      expected_visualization: pick(["table", "waterfall", "time_series", "heatmap", "funnel", "evidence_drawer"]),
      expected_cube_drill_path: ["tenant_key", "dataset_id", "vendor_id", "contract_family_id", "period_month"],
      allowed_conclusion: "May identify exposure, opportunity, evidence gap or recommended next action as synthetic demo analysis.",
      prohibited_overstatement: "Must not call an estimate verified, realized, live-proven or production-active without Phase B evidence.",
      expected_action: pick(["validate evidence", "renegotiate scope", "sequence roadmap decision", "request missing extract", "normalize supplier economics"]),
      acceptance_rule: "Pass if the answer cites source rows and evidence refs, exposes unknowns, and never defaults to another tenant.",
      story_thread_ref: story,
    });
    coverage.push({
      question_id: qid,
      required_source_files: ["CONTRACT_REGISTER.csv", "WORKDAY_SUPPLIER_INVOICES.csv", "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "BPO_NORMALIZED_TCO.csv"].slice(0, 2 + (i % 3)),
      required_columns: ["tenant_key", "dataset_id", "vendor_id", "contract_family_id", "period_start", "evidence_ref"],
      planted_scenario_records: [`${story}:record:${pad(i + 1, 3)}`],
      evidence_refs: [`EVID-SPAN-${pad((i % 16_000) + 1, 5)}`],
      cube_view: pick(["source_vendor_360", "source_contract_economics", "source_service_performance", "consumption_sourcing_bpo", "tower_value_proof"]),
      drill_members: ["tenant_key", "dataset_id", "vendor_id", "contract_family_id", "period_month"],
      expected_answer: "Tenant-scoped, evidence-cited, audit-only answer.",
      evidence_requirement: "At least two source domains plus one structured evidence span.",
      story_thread_ref: story,
    });
  }
  return {
    questionBank: {
      tenant_key: EXPECTED.tenantKey,
      dataset_id: EXPECTED.datasetId,
      dataset_version: EXPECTED.datasetVersion,
      question_count: questions.length,
      questions,
    },
    coverageMatrix: {
      tenant_key: EXPECTED.tenantKey,
      dataset_id: EXPECTED.datasetId,
      dataset_version: EXPECTED.datasetVersion,
      coverage_count: coverage.length,
      coverage,
    },
  };
}

function buildRoleMatrix() {
  const roles = [
    ["CEO or Enterprise Strategy Sponsor", 24, "enterprise strategy"],
    ["CIO", 38, "technology portfolio"],
    ["CTO", 38, "architecture and cloud"],
    ["CDAO", 60, "data analytics and AI"],
    ["CISO", 36, "security risk"],
    ["CFO Finance Executive", 34, "finance"],
    ["Chief Procurement Supply Chain Officer", 38, "procurement"],
    ["Health Plan Executive", 28, "health plan"],
    ["Clinical Health System Operations Executive", 28, "clinical operations"],
    ["Transformation Strategy Executive", 24, "transformation"],
    ["SVP Infrastructure Cloud and Data Centers", 32, "infrastructure"],
    ["SVP ERP and Corporate Applications", 32, "ERP corporate applications"],
    ["VP Clinical Applications Epic", 36, "Epic"],
    ["VP Data Platforms and Engineering", 38, "data platforms"],
    ["VP Analytics BI and Data Science", 38, "analytics"],
    ["VP Integration and Interoperability", 32, "integration"],
    ["VP Digital and Patient Member Experience", 30, "digital"],
    ["VP Enterprise Architecture", 34, "architecture"],
    ["VP Service Management IT Operations", 34, "IT operations"],
    ["VP Cybersecurity Operations GRC", 32, "cybersecurity"],
    ["VP PMO Transformation Delivery", 30, "PMO"],
    ["VP Vendor Management IT Finance", 34, "vendor finance"],
    ["VP Finance Operations", 28, "finance operations"],
    ["VP HR Operations", 28, "HR operations"],
    ["VP Supply Chain Operations", 32, "supply chain"],
    ["VP Revenue Cycle", 24, "revenue cycle"],
    ["VP Shared Services BPO", 36, "BPO"],
    ["VP Facilities EVS", 28, "facilities EVS"],
    ["VP Plan Analytics Population Health", 34, "plan analytics"],
    ["VP Clinical Analytics Quality", 34, "clinical analytics"],
  ];
  const matrixRoles = roles.map(([role, questionCount, domain], index) => ({
    role,
    domain,
    accountable_executive: role.includes("VP") || role.includes("SVP") ? "Relevant C-suite sponsor" : role,
    operating_leader: role.includes("Executive") || role.includes("Chief") || ["CIO", "CTO", "CDAO", "CISO"].includes(role) ? "Delegated operating VP or director" : role,
    supporting_team: `${domain} directors, architects, analysts and vendor managers`,
    system_data_owner: `${domain} system or report owner`,
    vendor_contract_owner: index % 2 === 0 ? "Vendor management lead" : "Contract family owner",
    finance_partner: "FP&A or controllership partner",
    required_interview_pack: `interview_packs/${role.replaceAll(/[^A-Za-z0-9]+/gu, "_")}.md`,
    required_evidence: ["system extract", "contract evidence", "metric report", "explicit gap register"],
    decisions_supported: ["Phase B load readiness", "model-fit gap triage", "executive validation"],
    question_count: questionCount + OUTCOME_KPI_CORE_QUESTIONS.length,
  }));
  return {
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    roles: matrixRoles,
  };
}

function questionsForRole(role, count, domain) {
  const questions = [];
  const baseCount = Math.max(0, count - OUTCOME_KPI_CORE_QUESTIONS.length);
  for (let i = 0; i < baseCount; i += 1) {
    const section = i < Math.ceil(count * 0.5) ? "TEAM PREWORK" : i < Math.ceil(count * 0.72) ? "EXECUTIVE VALIDATION" : "DIRECT EXECUTIVE QUESTIONS";
    questions.push({
      question_id: `INT-${role.replaceAll(/[^A-Za-z0-9]+/gu, "-").toUpperCase()}-${pad(i + 1, 3)}`,
      role,
      domain,
      section,
      question_text: section === "DIRECT EXECUTIVE QUESTIONS" ? `What decision, risk appetite or operating-model choice should govern ${domain} priority ${i + 1}?` : `What source extract, metric, contract evidence or team fact supports ${domain} priority ${i + 1}?`,
      strategic_or_operational: section === "DIRECT EXECUTIVE QUESTIONS" ? "strategic" : "operational",
      direct_executive_required: section === "DIRECT EXECUTIVE QUESTIONS",
      delegable_to_team: section !== "DIRECT EXECUTIVE QUESTIONS",
      expected_answer_type: pick(["enum", "numeric", "relationship", "evidence_ref", "decision"]),
      preferred_system_source: pick(["Workday", "ServiceNow", "SharePoint contract repository", "Epic inventory", "PMO workbook"]),
      required_evidence: "Source-first extract or executed document; interview-only requires validation.",
      target_entities: ["Vendor", "Contract", "Application", "Metric", "Evidence"],
      target_fields: ["tenant_key", "dataset_id", "source_record_id", "evidence_ref", "confidence"],
      relationships_created: ["supports", "owned_by", "contracted_under"],
      metrics_created: ["count", "spend", "service_level", "variance"],
      finding_supported: storyThreads[i % storyThreads.length],
      decision_supported: "Phase B staging and executive validation.",
      follow_up_trigger: "Evidence conflict, missing owner or low confidence.",
      confidence_rule: "High for authoritative extract, medium for governed report, low for interview-only.",
      validation_rule: "Interview answers never replace system evidence without accountable validation.",
    });
  }
  for (const [index, questionText] of OUTCOME_KPI_CORE_QUESTIONS.entries()) {
    const isExecutiveJudgment = index <= 10 && ![5, 7].includes(index);
    questions.push({
      question_id: `INT-${role.replaceAll(/[^A-Za-z0-9]+/gu, "-").toUpperCase()}-OKV-${pad(index + 1, 2)}`,
      role,
      domain,
      section: "OUTCOMES, KPIS AND VALUE DRIVERS",
      question_text: questionText,
      strategic_or_operational: isExecutiveJudgment ? "strategic" : "operational",
      direct_executive_required: isExecutiveJudgment,
      delegable_to_team: !isExecutiveJudgment,
      expected_answer_type: "outcome_map_update",
      preferred_system_source: "strategy documents, operating plans, scorecards, board materials or existing reports",
      required_evidence: "Prepopulated outcome map row or explicit evidence gap; values and formulas may remain unknown.",
      target_entities: ["Outcome", "Metric", "Capability", "Vendor", "Initiative"],
      target_fields: ["business_purpose", "desired_direction", "executive_owner_role", "evidence_source", "confidence_state"],
      relationships_created: ["influences", "depends_on", "supports_decision"],
      metrics_created: ["outcome_context", "leading_driver", "risk_guardrail"],
      finding_supported: "enterprise_outcomes_and_kpi_map",
      decision_supported: "Four-week business-context discovery for Home, Intelligence, Moves, Tower and Source.",
      follow_up_trigger: "Unsupported metric, missing owner, disputed priority or formula/source detail needed later.",
      confidence_rule: "Confirmed, reported, estimated or unresolved; unknown values do not fail discovery.",
      validation_rule: "Executives validate priorities and judgment; teams supply formulas, sources and detailed mechanics.",
    });
  }
  return questions;
}

function buildEvidenceRows() {
  const rows = [];
  for (let i = 0; i < 16_000; i += 1) {
    const contract = contractFamilies[i % contractFamilies.length];
    rows.push(common({
      path: "contract_and_evidence_corpus/EVIDENCE_SPANS.csv",
      sourceSystem: "SharePoint Contract Repository",
      sourceModule: "Evidence",
      sourceObject: "Evidence Span Extraction",
      primaryKey: "evidence_ref",
      storyThread: contract[5],
    }, {
      evidence_ref: `EVID-SPAN-${pad(i + 1, 5)}`,
      document_ref: `DOC-${pad((i % 30) + 1, 3)}`,
      contract_family_id: contract[0],
      page_or_section: `section_${(i % 40) + 1}`,
      span_type: pick(["pricing", "rate_card", "sla", "renewal", "termination", "scope", "security", "transition"]),
      accepted_extraction: `Synthetic aggregate clause extraction ${i + 1} for ${contract[1]}.`,
      extraction_confidence: pick(["high", "medium"]),
      evidence_state: contract[4] === "tier_3_context_only" ? "document_unavailable_context_only" : "synthetic_evidence_available",
      review_state: i % 23 === 0 ? "needs_audit_review" : "audit_ready",
      story_thread_ref: contract[5],
    }));
  }
  return rows;
}

function buildModelFitAudit(questionCount) {
  const gapRows = [
    ["canonical.contract_scope_relationship", "contract_service_application_ci", "tenant-safe relationship id", "MISSING_ADDITIVE_TABLE", "Required to persist 500-1000 cross-domain scope links with upstream lineage.", "source_contract_scope_relationships", "Scope overlap and service credit questions.", "Additive table with tenant_key and dataset_id; no backfill to existing clients."],
    ["source.service_credit_fact", "contract_service_month", "service_credit_id", "MISSING_ADDITIVE_FIELD", "Current service performance paths do not fully separate eligible, claimed and unclaimed credits.", "source_service_credit_monthly", "Unclaimed credit questions.", "Add nullable claimed/eligible fields to source projection."],
    ["consumption.sourcing_bpo_normalized_tco", "supplier_scenario_year", "normalized_tco_id", "NEW_CONSUMPTION_PROJECTION_REQUIRED", "BPO comparison needs retained org, transition, automation and risk normalization.", "consumption_sourcing_bpo_tco", "BPO recommendation questions.", "Additive projection after Phase B migration approval."],
    ["cube.SourceContractEconomics", "contract_family_month", "tenant_key/dataset_id/period", "NEW_CUBE_MEMBER_REQUIRED", "Cube drill paths need tenant/dataset/as-of cache keys and evidence depth measures.", "source_contract_economics", "Executive drill paths.", "Add members only after staged data load proves source projection."],
    ["doc.evidence_span", "document_page_span", "evidence_ref", "EXISTING_TABLE_NEW_ROW", "Document evidence can use existing evidence concepts but needs accepted extraction and review state rows.", "doc_evidence_spans", "Evidence drawer questions.", "Prefer existing doc table rows and additive columns only if needed."],
  ];
  return `# Synthetic Healthcare Demo Model-Fit Audit

Status: candidate, audit_only, not_released

This Phase A audit evaluates the generated source-shaped package against the current shared AbarVa model. No migration is created or applied in this phase.

## Summary

- Questions evaluated: ${questionCount}
- Preferred posture: reuse existing doc.*, source.*, tower.*, and consumption.sourcing_* paths where possible.
- Phase B prerequisite: add the healthcare tenant key through a governed bootstrap before any staged load.
- Hard boundary: product surfaces remain projections; the source-shaped files are Layer 1 intake and must flow through adapters before product use.

## Candidate Gaps

| Proposed canonical entity | Exact grain | Primary key | Classification | Why existing model is insufficient | Expected Cube view/member | Questions blocked | Additive recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
${gapRows.map((row) => `| ${row.join(" | ")} |`).join("\n")}

## Rejected In Phase A

- Any migration that makes the synthetic healthcare tenant active.
- Any fallback from missing healthcare tenant resolution to SkyHarbor.
- Any product-specific source extract that bypasses canonical adapters.
`;
}

function buildPhaseBPlan() {
  return `# Synthetic Healthcare Demo Phase B Test-Load Plan

Status: designed_only. Do not execute without explicit approval.

1. Review Phase A proof ZIP, generated package SHA-256 values, model-fit gaps and canary output.
2. Add only approved additive migrations and tenant bootstrap code through a separate PR.
3. Load tenant_key=${EXPECTED.tenantKey}, dataset_id=${EXPECTED.datasetId}, activation_state=staged into an isolated lab/test tenant only.
4. Load source-shaped raw records, canonical candidates, document evidence, source projections, tower metrics and consumption.sourcing_* views.
5. Rebuild or refresh Cube in the isolated environment; securityContext must include tenant_key, dataset_id, dataset_version and as_of_date.
6. Reconcile vendor counts, contract counts, invoice totals, service credits, scope relationships, off-contract med/surg spend, rate-card variance, SaaS utilization, BPO normalized TCO and evidence counts.
7. Exercise Source, Home, Tower, Intelligence, Moves and aVa signed-in paths.
8. Run isolation checks: SkyHarbor sees no healthcare context; healthcare sees no airline context; invalid tenant blocks with no fallback.
9. Keep activation_state=staged and stop again for approval.
`;
}

function buildPhaseCSpec() {
  return `# Synthetic Healthcare Demo One-Click Migration Specification

Status: specification_only. Do not execute in Phase A.

Future command: \`ops:aca-job --script source:healthcare-demo:activate --tenant-key ${EXPECTED.tenantKey} --dataset-id ${EXPECTED.datasetId} --package-sha <approved-sha> --dry-run\`

The future ACA operator command must validate package SHA-256, tenant identity, dataset identity, approved additive migrations, tenant bootstrap, grain counts, relationship integrity, document evidence, Source projections, Tower projections, consumption views, Cube runtime, cross-tenant isolation and exact reconciliation before atomically moving the active dataset pointer.

It must be tenant-scoped, dataset-versioned, idempotent where appropriate, dry-run capable, fail-closed, operator-executed, hash-verified, fully logged and rollback-capable.

It must never truncate shared tables, mutate SkyHarbor, make the healthcare tenant default, overwrite a previous dataset without versioned activation, or bypass CI/source control for migrations.
`;
}

async function buildPackage() {
  const outDir = argValue("--out-dir", DEFAULT_OUT_DIR);
  const timestamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
  const stageDir = path.join(outDir, `phs_healthcare_demo_phase_a_${timestamp}`);
  await fs.rm(stageDir, { recursive: true, force: true });
  await fs.mkdir(stageDir, { recursive: true });

  const { fileRows, fileContracts } = buildRows();
  const evidenceRows = buildEvidenceRows();
  const outcomeRows = buildEnterpriseOutcomesKpiMap();
  const evidenceSpec = makeSpec(["EVIDENCE_SPANS.csv", "contract_evidence", "SharePoint Contract Repository", "Evidence Span Extraction", "document_page_span", "evidence_ref"], "contract_and_evidence_corpus");
  evidenceSpec.expected_rows = evidenceRows.length;
  evidenceSpec.required_fields = Array.from(new Set(evidenceRows.flatMap((row) => Object.keys(row)))).sort();
  fileContracts.push(evidenceSpec);
  fileRows.set(evidenceSpec.path, evidenceRows);

  for (const [relativePath, rows] of fileRows.entries()) {
    await writeCsv(path.join(stageDir, relativePath), rows);
  }

  const fieldGuidance = buildWorkbookFieldGuidance();
  const clientWorkbookSheets = [
    { name: "00_READ_ME", rows: [["Purpose", "Audit-only synthetic healthcare demo collection workbook"], ["Tenant", EXPECTED.tenantKey], ["Dataset", EXPECTED.datasetId], ["No runtime mutation", "true"]] },
    { name: "01_COLLECTION_PLAN", rows: [["Domain", "Owner", "Source-first extract", "Fallback"], ...Array.from(new Set(fieldGuidance.map((row) => row.tab))).map((tab) => [tab, "Named data owner", "Authoritative native export", "Interview attestation with validation"])] },
    { name: "02_ROLE_DOMAIN_MATRIX", rows: [["Role", "Domain", "Evidence"], ...buildRoleMatrix().roles.map((role) => [role.role, role.domain, role.required_evidence.join("; ")])] },
    { name: "03_SOURCE_SYSTEM_INVENTORY", rows: [["System", "Concrete extraction examples"], ["ServiceNow", "Vendor Management; ITSM aggregate; CMDB/CSDM; SLA summaries"], ["Workday", "Supplier; invoice; payment; cost center; spend category; worker summary"], ["Contract repository", "Agreement; SOW; amendment; pricing; SLA; renewal clause"], ["Epic", "Module inventory; interface inventory; Clarity/Caboodle assets"]] },
    { name: "04_FIELD_SOURCE_MAP", rows: [Object.keys(fieldGuidance[0]), ...fieldGuidance.map((row) => Object.values(row))] },
    { name: "05_INTERVIEW_ROSTER", rows: [["Role", "Question Count"], ...buildRoleMatrix().roles.map((role) => [role.role, role.question_count])] },
    { name: "06_INTERVIEW_QUESTION_MASTER", rows: [["Question ID", "Role", "Section", "Question"], ...buildRoleMatrix().roles.flatMap((role) => questionsForRole(role.role, role.question_count, role.domain).map((question) => [question.question_id, role.role, question.section, question.question_text]))] },
    { name: "07_INTERVIEW_RESPONSE_TRACKER", rows: [["question_id", "answer_source", "interview_id", "respondent_role", "confidence", "needs_validation", "validation_status"]] },
    { name: "08_EVIDENCE_REGISTER", rows: [["evidence_ref", "document_ref", "contract_family_id", "review_state"], ...evidenceRows.slice(0, 300).map((row) => [row.evidence_ref, row.document_ref, row.contract_family_id, row.review_state])] },
    { name: "09_DATA_GAP_REGISTER", rows: [["gap_id", "domain", "gap", "status"], ["GAP-001", "tenant bootstrap", "tenant key not yet active in code", "phase_b_prerequisite"]] },
    { name: "10_DECISION_REGISTER", rows: [["decision_id", "decision", "phase"], ["DEC-001", "Approve or reject Phase A package for isolated staged load", "Phase A audit"]] },
    { name: "11_QUALITY_AND_APPROVAL", rows: [["Gate", "State"], ["Offline validation", "pass required"], ["Database load", "not executed"], ["Runtime deploy", "not executed"]] },
    { name: "ENTERPRISE_OUTCOMES_AND_KPI_MAP", rows: [Object.keys(outcomeRows[0]), ...outcomeRows.map((row) => Object.values(row))] },
    ...Array.from(new Set(fieldGuidance.map((row) => row.tab))).map((tab) => ({ name: tab, rows: [Object.keys(fieldGuidance[0]), ...fieldGuidance.filter((row) => row.tab === tab).map((row) => Object.values(row))] })),
  ];
  const clientWorkbook = path.join(stageDir, "PHS_Healthcare_Demo_Client_Data_Request.xlsx");
  await writeXlsx(clientWorkbook, clientWorkbookSheets);

  const roleMatrix = buildRoleMatrix();
  await writeJson(path.join(stageDir, "phs_healthcare_demo_role_domain_matrix.json"), roleMatrix);
  for (const role of roleMatrix.roles) {
    const questions = questionsForRole(role.role, role.question_count, role.domain);
    const safeName = role.role.replaceAll(/[^A-Za-z0-9]+/gu, "_");
    await writeJson(path.join(stageDir, "interview_packs", `${safeName}.json`), { role: role.role, questions });
    await writeCsv(path.join(stageDir, "interview_packs", `${safeName}_response_template.csv`), questions.map((question) => ({
      question_id: question.question_id,
      answer_source: "",
      interview_id: "",
      respondent_role: role.role,
      response_date: "",
      strategic_or_operational: question.strategic_or_operational,
      direct_exec_answer: "",
      delegated_team_answer: "",
      confidence: "",
      supporting_evidence_ref: "",
      needs_validation: "true",
      accountable_validation_role: role.accountable_executive,
      validation_status: "not_started",
      validated_at: "",
      data_entities_created: question.target_entities.join(";"),
      decisions_supported: question.decision_supported,
    })));
    await writeText(path.join(stageDir, "interview_packs", `${safeName}.md`), `# ${role.role} Interview Pack

Domain: ${role.domain}

## Team Prework
${questions.filter((q) => q.section === "TEAM PREWORK").map((q) => `- ${q.question_id}: ${q.question_text}`).join("\n")}

## Outcomes, KPIs And Value Drivers
${questions.filter((q) => q.section === "OUTCOMES, KPIS AND VALUE DRIVERS").map((q) => `- ${q.question_id}: ${q.question_text}`).join("\n")}

## Executive Validation
${questions.filter((q) => q.section === "EXECUTIVE VALIDATION").map((q) => `- ${q.question_id}: ${q.question_text}`).join("\n")}

## Direct Executive Questions
${questions.filter((q) => q.section === "DIRECT EXECUTIVE QUESTIONS").map((q) => `- ${q.question_id}: ${q.question_text}`).join("\n")}
`);
  }

  const { questionBank, coverageMatrix } = buildQuestionBank();
  await writeJson(path.join(stageDir, "phs_healthcare_demo_question_bank.json"), questionBank);
  await writeJson(path.join(stageDir, "phs_healthcare_demo_question_coverage_matrix.json"), coverageMatrix);
  await writeText(path.join(stageDir, "phs_healthcare_demo_model_fit_audit.md"), buildModelFitAudit(questionBank.question_count));
  await writeJson(path.join(stageDir, "phs_healthcare_demo_reconciliation_expectations.json"), {
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    expectations: [
      "vendor counts reconcile to CONTRACT_REGISTER and WORKDAY_SUPPLIERS",
      "invoice-line totals reconcile to monthly spend and payments",
      "eligible minus claimed service credits remain explicit unclaimed amounts",
      "BPO normalized recommendation does not equal lowest headline price by default",
      "unknown values remain blank or explicit unknown, never zero-filled",
    ],
  });
  await writeText(path.join(stageDir, "phs_healthcare_demo_test_load_plan.md"), buildPhaseBPlan());
  await writeText(path.join(stageDir, "phs_healthcare_demo_one_click_migration_spec.md"), buildPhaseCSpec());
  await writeJson(path.join(stageDir, "phs_healthcare_demo_dataset_policy_manifest.generated_not_loaded.json"), {
    dataset_id: EXPECTED.datasetId,
    title: "Synthetic healthcare demo source package",
    client_key: EXPECTED.tenantKey,
    source_layer: "tenant_context",
    classification: "synthetic_demo",
    owner: "AbarVa demo data architecture",
    source_basis: "deterministic_synthetic_generation",
    ingestion_method: "operator_aca_job",
    retrieval_plan: "not_retrievable",
    retrieval_proof_required: true,
    pii_phi_handling: "No PHI, patient names, MRNs, DOBs, clinical free text, employee names, personal emails, phone numbers or credentials are generated.",
    expected_object_count: Array.from(fileRows.values()).reduce((sum, rows) => sum + rows.length, 0),
    approved_by: "Phase A audit required before approval",
    approved_at: "2026-08-05",
    notes: "Generated manifest only; not committed under docs/governance/dataset-manifests until canonical tenant bootstrap is approved.",
  });

  for (let i = 0; i < 30; i += 1) {
    const contract = contractFamilies[i % contractFamilies.length];
    await writeText(path.join(stageDir, "contract_and_evidence_corpus", "documents", `DOC-${pad(i + 1, 3)}.md`), `# Synthetic Evidence Document DOC-${pad(i + 1, 3)}

Contract family: ${contract[1]}
Evidence tier: ${contract[4]}
Synthetic only: true

This document contains aggregate commercial, operational, service-level, renewal, exit, security or transition terms for audit-only testing. It contains no patient-level data, no employee identity data and no real credentials.
`);
  }
  await writeText(path.join(stageDir, "bpo_sourcing_event", "BPO_RFP_STRATEGY.md"), "# Enterprise Back-Office BPO RFP Strategy\n\nAudit-only synthetic package comparing retain-and-automate, hybrid shared-services, function managed services, single-provider BPO and multi-provider specialist models. The planted recommendation selects normalized best value after transition, retained organization, automation, risk and service scope.\n");

  const totalRows = Array.from(fileRows.values()).reduce((sum, rows) => sum + rows.length, 0);
  const countsByFile = Object.fromEntries(Array.from(fileRows.entries()).map(([file, rows]) => [file, rows.length]));
  const manifest = {
    tenant_key: EXPECTED.tenantKey,
    display_name: "Presbyterian Health Services - Synthetic Demonstration Tenant",
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    data_classification: "synthetic_demo",
    as_of_date: EXPECTED.asOfDate,
    history_start: EXPECTED.historyStart,
    history_end: EXPECTED.historyEnd,
    activation_state: "generated_not_loaded",
    generator_seed: SEED,
    generator_version: GENERATOR_VERSION,
    load_run_id: LOAD_RUN_ID,
    counts: {
      structured_total: totalRows,
      evidence_spans: evidenceRows.length,
      vendors: vendors.length,
      contract_families: contractFamilies.length,
      legal_instruments: 24,
      applications_services_platforms_cis: 400,
      contract_scope_relationships: countsByFile["source_system_extracts/CONTRACT_SCOPE_RELATIONSHIPS.csv"],
      hard_questions: questionBank.question_count,
      interview_roles: roleMatrix.roles.length,
      enterprise_outcomes_kpi_map: outcomeRows.length,
    },
    file_contracts: fileContracts,
    counts_by_file: countsByFile,
    phase_a_hard_stop: {
      database_loaded: false,
      migration_applied: false,
      cube_runtime_changed: false,
      web_runtime_deployed: false,
      skyharbor_mutated: false,
      stopped_for_audit: true,
    },
    synthetic_assumptions: [
      "Healthcare system plus health-plan structure is sponsor-provided synthetic demo context.",
      "Enterprise outcomes and KPI map values, targets, formulas and detailed source lineage are optional during four-week discovery.",
      "Financial values are deterministic synthetic assumptions and not verified public facts.",
      "No PHI, PII, patient-level detail, employee identities or real credentials are generated.",
    ],
  };
  await writeJson(path.join(stageDir, "phs_healthcare_demo_package_manifest.json"), manifest);

  const normalizedSheets = [
    { name: "Summary", rows: [["Metric", "Value"], ...Object.entries(manifest.counts).map(([key, value]) => [key, value])] },
    { name: "File Counts", rows: [["File", "Rows"], ...Object.entries(countsByFile)] },
    { name: "Story Threads", rows: [["Story Thread"], ...storyThreads.map((thread) => [thread])] },
    { name: "Outcome Map", rows: [Object.keys(outcomeRows[0]), ...outcomeRows.map((row) => Object.values(row))] },
    { name: "Model Fit Gaps", rows: [["Gap", "Classification"], ["contract scope relationship", "MISSING_ADDITIVE_TABLE"], ["BPO normalized TCO", "NEW_CONSUMPTION_PROJECTION_REQUIRED"]] },
  ];
  await writeXlsx(path.join(stageDir, "PHS_Healthcare_Demo_Normalized_Audit_View.xlsx"), normalizedSheets);

  const validation = await validatePackage(stageDir);
  const canaryOutputs = await validateCorruptedCanaries(stageDir);
  const validationReport = {
    generated_at: new Date().toISOString(),
    generator_seed: SEED,
    generator_version: GENERATOR_VERSION,
    package_dir: stageDir,
    validation,
    corrupted_canaries: canaryOutputs,
    no_runtime_mutation_statement: "No database, migration, Cube runtime, web runtime, ACA runtime or SkyHarbor data mutation was executed.",
  };
  await writeJson(path.join(stageDir, "phs_healthcare_demo_offline_validation_report.json"), validationReport);
  await writeText(path.join(stageDir, "phs_healthcare_demo_offline_validation_report.html"), `<!doctype html><html><head><meta charset="utf-8"><title>PHS Healthcare Demo Offline Validation</title></head><body><h1>Offline Validation Report</h1><p>Status: ${validation.ok ? "PASS" : "FAIL"}</p><p>Structured rows: ${validation.summary.structuredRows}</p><p>Questions: ${validation.summary.questions}</p><p>CDAO questions: ${validation.summary.cdaoQuestions}</p><p>PII/PHI scan: ${validation.failures.some((f) => /pii|phi/iu.test(f.code)) ? "FAIL" : "PASS"}</p><p>No database/runtime mutation occurred.</p><pre>${xmlEscape(JSON.stringify(validationReport, null, 2))}</pre></body></html>`);

  const downloads = [];
  for (const name of [
    "PHS_Healthcare_Demo_Client_Data_Request.xlsx",
    "PHS_Healthcare_Demo_Normalized_Audit_View.xlsx",
    "phs_healthcare_demo_package_manifest.json",
    "phs_healthcare_demo_question_bank.json",
    "phs_healthcare_demo_question_coverage_matrix.json",
    "phs_healthcare_demo_role_domain_matrix.json",
    "phs_healthcare_demo_model_fit_audit.md",
    "phs_healthcare_demo_reconciliation_expectations.json",
    "phs_healthcare_demo_test_load_plan.md",
    "phs_healthcare_demo_one_click_migration_spec.md",
    "phs_healthcare_demo_offline_validation_report.html",
    "phs_healthcare_demo_offline_validation_report.json",
  ]) {
    downloads.push(await copyToDownloads(path.join(stageDir, name), path.join(outDir, name)));
  }
  const zipTargets = [
    ["interview_packs", "PHS_Healthcare_Demo_Interview_Packs.zip"],
    ["source_system_extracts", "PHS_Healthcare_Demo_Synthetic_System_Extracts.zip"],
    ["contract_and_evidence_corpus", "PHS_Healthcare_Demo_Contract_and_Evidence_Corpus.zip"],
    ["bpo_sourcing_event", "PHS_Healthcare_Demo_BPO_Sourcing_Event.zip"],
  ];
  for (const [folder, zipName] of zipTargets) {
    const zipPath = path.join(outDir, zipName);
    await zipDir(path.join(stageDir, folder), zipPath);
    downloads.push({ path: zipPath, sha256: await sha256File(zipPath) });
  }
  await writeJson(path.join(stageDir, "proof_file_hashes.json"), Object.fromEntries(downloads.map((entry) => [path.basename(entry.path), entry.sha256])));
  await writeText(path.join(stageDir, "AUDIT_STOP_STATEMENT.txt"), "PHASE A HARD STOP: no synthetic healthcare data was loaded; no migration was applied; no Cube runtime was changed; no web runtime was deployed; SkyHarbor was not mutated; execution stopped for audit.\n");
  await writeJson(path.join(stageDir, "phase_a_result.json"), {
    stage_dir: stageDir,
    proof_zip: `PHS_Healthcare_Demo_Audit_Proof_${timestamp}.zip`,
    proof_zip_sha256: "computed_after_zip_creation",
    downloads,
    manifest_counts: manifest.counts,
    validation_ok: validation.ok,
  });
  const proofZip = path.join(outDir, `PHS_Healthcare_Demo_Audit_Proof_${timestamp}.zip`);
  await zipDir(stageDir, proofZip);
  const proofSha = await sha256File(proofZip);
  console.log(JSON.stringify({
    stage_dir: stageDir,
    proof_zip: proofZip,
    proof_zip_sha256: proofSha,
    downloads,
    counts: manifest.counts,
    validation_ok: validation.ok,
  }, null, 2));
  if (!validation.ok) process.exit(1);
}

buildPackage().catch((error) => {
  console.error(error);
  process.exit(1);
});

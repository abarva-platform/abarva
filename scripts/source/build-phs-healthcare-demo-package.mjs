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

function buildWorkbookFieldGuidance(fileRows = new Map()) {
  const domainContracts = {
    "12_VENDORS": {
      domain: "vendor master",
      entity: "Vendor",
      source: "Workday Financial Management",
      module: "Supplier",
      object: "Supplier master",
      export: "WORKDAY_SUPPLIERS.csv",
      path: "Workday -> Suppliers -> Supplier status and risk export",
      grain: "one row per supplier",
      primary: "vendor_id",
      join: "vendor_id",
      owner: "Vendor management data owner",
      validator: "Procurement operations lead",
    },
    "13_CONTRACT_FAMILIES": {
      domain: "contract family",
      entity: "ContractFamily",
      source: "SharePoint contract repository",
      module: "Agreement register",
      object: "Contract family register",
      export: "CONTRACT_REGISTER.csv",
      path: "Contract repository -> Agreement register -> family metadata export",
      grain: "one row per contract family",
      primary: "contract_family_id",
      join: "vendor_id; contract_family_id",
      owner: "Contract management owner",
      validator: "Procurement legal liaison",
    },
    "14_LEGAL_INSTRUMENTS": {
      domain: "legal instrument",
      entity: "LegalInstrument",
      source: "SharePoint contract repository",
      module: "Executed agreements",
      object: "MSA SOW amendment pricing SLA security exit documents",
      export: "CONTRACT_INSTRUMENTS.csv",
      path: "Contract repository -> Legal folder -> instrument metadata export",
      grain: "one row per executed instrument",
      primary: "instrument_id",
      join: "contract_family_id; document_ref",
      owner: "Legal operations",
      validator: "Contract counsel delegate",
    },
    "15_CONTRACT_DOCUMENTS": {
      domain: "contract evidence",
      entity: "Evidence",
      source: "SharePoint contract repository",
      module: "Evidence extraction",
      object: "Document page span",
      export: "EVIDENCE_SPANS.csv",
      path: "Contract repository -> reviewed extraction set -> accepted spans",
      grain: "one row per accepted page or section span",
      primary: "evidence_ref",
      join: "contract_family_id; document_ref; evidence_ref",
      owner: "Document evidence lead",
      validator: "Audit reviewer",
    },
    "16_INVOICES_AND_SPEND": {
      domain: "invoice and spend",
      entity: "Spend",
      source: "Workday Financial Management",
      module: "Supplier Invoice",
      object: "Supplier invoice line",
      export: "WORKDAY_SUPPLIER_INVOICES.csv",
      path: "Workday -> Supplier invoices -> invoice line export",
      grain: "one row per supplier invoice line",
      primary: "invoice_line_id",
      join: "vendor_id; contract_family_id; cost_center_id; spend_category_id",
      owner: "AP and finance systems owner",
      validator: "FP&A partner",
    },
    "17_PURCHASE_ORDERS": {
      domain: "local purchasing",
      entity: "PurchaseOrderLine",
      source: "Local hospital purchasing workbook",
      module: "Purchase orders",
      object: "Facility PO line",
      export: "LOCAL_HOSPITAL_PURCHASES.csv",
      path: "Facility purchasing folder -> monthly PO line workbook",
      grain: "one row per facility purchase-order line",
      primary: "po_line_id",
      join: "facility; item_id; contract_family_id",
      owner: "Hospital supply chain analyst",
      validator: "Supply chain operations lead",
    },
    "18_APPLICATIONS_AND_PLATFORMS": {
      domain: "applications and platforms",
      entity: "Application",
      source: "ServiceNow CMDB",
      module: "CMDB/CSDM",
      object: "Business Application",
      export: "SERVICENOW_CMDB_APPLICATIONS.csv",
      path: "ServiceNow -> CMDB -> Business Applications export",
      grain: "one row per application",
      primary: "application_id",
      join: "application_id; owner_function",
      owner: "CMDB application owner",
      validator: "Enterprise architecture lead",
    },
    "19_CMDB_SERVICES_AND_CIS": {
      domain: "business services and CIs",
      entity: "ConfigurationItem",
      source: "ServiceNow CSDM",
      module: "Business Service / Application Service / CI",
      object: "Business service CI",
      export: "SERVICENOW_CSDM_BUSINESS_SERVICES.csv",
      path: "ServiceNow -> CSDM -> Business service and CI export",
      grain: "one row per business service or CI",
      primary: "ci_id",
      join: "business_service_ref; application_id; ci_id",
      owner: "Service management data owner",
      validator: "IT operations lead",
    },
    "20_SLA_AND_TICKET_SUMMARIES": {
      domain: "SLA and ITSM aggregate",
      entity: "ServicePerformance",
      source: "ServiceNow ITSM and SLA",
      module: "Incident Problem Change aggregate",
      object: "Monthly service summary",
      export: "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv",
      path: "ServiceNow -> Performance Analytics -> monthly aggregate export",
      grain: "one row per application/service month",
      primary: "itsm_summary_id",
      join: "vendor_id; contract_id; service_ref; application_ref; ci_ref",
      owner: "IT operations reporting owner",
      validator: "Service management leader",
    },
    "21_SERVICE_CREDITS": {
      domain: "service credits",
      entity: "ServiceCreditFact",
      source: "ServiceNow Vendor Management",
      module: "Vendor performance",
      object: "Service credit monthly fact",
      export: "SERVICENOW_SERVICE_CREDITS.csv",
      path: "ServiceNow -> Vendor performance -> credit reconciliation export",
      grain: "one row per contract service month",
      primary: "service_credit_id",
      join: "contract_id; service_ref",
      owner: "Vendor performance analyst",
      validator: "Procurement finance partner",
    },
    "22_WORKFORCE_AND_RATE_CARDS": {
      domain: "workforce and rate cards",
      entity: "RateCardObservation",
      source: "VMS Fieldglass-compatible export",
      module: "Work order and rate-card invoice",
      object: "Role invoice line",
      export: "VENDOR_RATE_CARD_INVOICES.csv",
      path: "VMS -> Work orders -> approved rate and invoice export",
      grain: "one row per role invoice line",
      primary: "rate_invoice_id",
      join: "invoice_line_id; rate_card_id",
      owner: "Vendor workforce owner",
      validator: "IT finance lead",
    },
    "23_SAAS_AND_LICENSE_USAGE": {
      domain: "SaaS and license usage",
      entity: "ToolUsage",
      source: "SaaS admin center",
      module: "Module usage",
      object: "Monthly entitlement and active usage",
      export: "SAAS_MODULE_USAGE_MONTHLY.csv",
      path: "SaaS admin center -> module usage monthly export",
      grain: "one row per module month",
      primary: "usage_id",
      join: "vendor_id; module_name",
      owner: "SaaS platform owner",
      validator: "Corporate applications leader",
    },
    "24_CLOUD_AND_DATA_PLATFORM_USAGE": {
      domain: "cloud and data platform usage",
      entity: "PlatformScenario",
      source: "AWS and Databricks commercial planning",
      module: "Target commitment scenarios",
      object: "Service or workspace commitment scenario",
      export: "AWS_TARGET_COMMITMENT_SCENARIOS.csv; DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv",
      path: "Cloud/data platform planning model -> monthly scenario export",
      grain: "one row per service or workspace scenario month",
      primary: "aws_scenario_id or databricks_scenario_id",
      join: "scenario; prerequisite_decision",
      owner: "Cloud/data platform finance owner",
      validator: "CDAO/CTO delegate",
    },
    "25_PROGRAMS_AND_INITIATIVES": {
      domain: "program initiatives",
      entity: "Initiative",
      source: "PMO portfolio export",
      module: "Program dependencies",
      object: "Program initiative dependency",
      export: "PROGRAMS_INITIATIVES_DEPENDENCIES.csv",
      path: "PMO tool -> initiative dependency export",
      grain: "one row per initiative dependency",
      primary: "program_dependency_id",
      join: "program_ref; initiative_ref; dependency_ref",
      owner: "PMO data owner",
      validator: "Transformation delivery lead",
    },
    "26_ARCHITECTURE_AND_DEPENDENCIES": {
      domain: "architecture dependencies",
      entity: "Dependency",
      source: "Enterprise architecture repository",
      module: "Platform dependency map",
      object: "Application data platform dependency",
      export: "ANALYTICS_PLATFORM_DEPENDENCIES.csv",
      path: "Architecture repository -> dependency export",
      grain: "one row per dependency",
      primary: "dependency_id",
      join: "source_ref; target_ref",
      owner: "Enterprise architecture owner",
      validator: "Architecture review board delegate",
    },
    "27_METRICS_AND_OUTCOMES": {
      domain: "enterprise outcomes",
      entity: "Outcome",
      source: "Strategy documents and scorecards",
      module: "Outcome map",
      object: "Enterprise outcome/KPI map row",
      export: "ENTERPRISE_OUTCOMES_AND_KPI_MAP",
      path: "Strategy documents -> prepopulated outcome map -> team correction",
      grain: "one row per meaningful outcome, driver or guardrail",
      primary: "record_id",
      join: "portfolio_or_function; related_initiatives",
      owner: "Portfolio strategy owner",
      validator: "Executive sponsor delegate",
    },
    "28_RISKS_AND_CONTROLS": {
      domain: "risks and controls",
      entity: "Risk",
      source: "GRC register",
      module: "Risk and control observations",
      object: "Monthly risk-control observation",
      export: "RISK_CONTROL_OBSERVATIONS.csv",
      path: "GRC platform -> control observation export",
      grain: "one row per risk-control month",
      primary: "risk_control_id",
      join: "risk_ref; control_ref; domain",
      owner: "GRC data owner",
      validator: "Risk and compliance leader",
    },
    "29_SOURCING_EVENTS": {
      domain: "sourcing event",
      entity: "SourcingEvent",
      source: "Sourcing event workspace",
      module: "BPO event",
      object: "Supplier invitation and RFP requirements",
      export: "BPO_SUPPLIERS.csv; BPO_RFP_REQUIREMENTS.csv",
      path: "Source workspace -> BPO event -> supplier and requirement exports",
      grain: "one row per invited supplier or requirement",
      primary: "supplier_event_id or requirement_id",
      join: "supplier_id; requirement_id",
      owner: "Sourcing event owner",
      validator: "Procurement transformation lead",
    },
    "30_SUPPLIER_RESPONSES": {
      domain: "supplier response",
      entity: "SupplierResponse",
      source: "Supplier response workbook",
      module: "BPO proposal response",
      object: "Supplier requirement response",
      export: "BPO_SUPPLIER_RESPONSES.csv",
      path: "Supplier response workbook -> requirement response tab",
      grain: "one row per supplier requirement response",
      primary: "supplier_response_id",
      join: "supplier_id; requirement_id",
      owner: "Sourcing analyst",
      validator: "Evaluation committee lead",
    },
    "31_BAFO_AND_NORMALIZATION": {
      domain: "BAFO and normalized TCO",
      entity: "NormalizedTco",
      source: "BAFO workbook and TCO normalization model",
      module: "BAFO/TCO",
      object: "Supplier scenario year",
      export: "BPO_BAFO_RESPONSES.csv; BPO_NORMALIZED_TCO.csv",
      path: "Source workspace -> BAFO and normalization model exports",
      grain: "one row per supplier scenario year or BAFO line",
      primary: "bafo_response_id or normalized_tco_id",
      join: "supplier_id; scenario; year",
      owner: "Commercial evaluation owner",
      validator: "Finance and procurement co-review",
    },
    "32_BPO_CURRENT_STATE_VOLUMES": {
      domain: "BPO process volumes",
      entity: "ProcessVolume",
      source: "BPO current-state workbook",
      module: "Process volumes",
      object: "Function process monthly volume",
      export: "BPO_CURRENT_STATE_PROCESS_VOLUMES.csv",
      path: "Shared-services team workbook -> process volume tab",
      grain: "one row per process month",
      primary: "process_volume_id",
      join: "function_ref; process_name",
      owner: "Shared-services process owner",
      validator: "BPO operating-model lead",
    },
    "33_BPO_CURRENT_STATE_WORKFORCE": {
      domain: "BPO workforce",
      entity: "WorkforceRole",
      source: "Workday workforce summary",
      module: "Current workforce",
      object: "Role function location",
      export: "BPO_CURRENT_STATE_WORKFORCE.csv",
      path: "Workday -> workforce summary -> role/function/location export",
      grain: "one row per role function location",
      primary: "current_workforce_id",
      join: "function_ref; role_family",
      owner: "HR operations data owner",
      validator: "Shared-services finance partner",
    },
    "34_BPO_PROCESS_AND_CONTROL_MATRIX": {
      domain: "BPO process and controls",
      entity: "ControlRequirement",
      source: "RFP requirement library",
      module: "Process and control matrix",
      object: "Requirement row",
      export: "BPO_RFP_REQUIREMENTS.csv",
      path: "RFP library -> process and control requirements export",
      grain: "one row per requirement",
      primary: "requirement_id",
      join: "requirement_domain; criticality",
      owner: "Controls and process design owner",
      validator: "Risk/control reviewer",
    },
  };
  const rowsByBase = new Map(Array.from(fileRows.entries()).map(([relativePath, rows]) => [path.basename(relativePath), rows]));
  const domainTabs = Object.keys(domainContracts);
  const fields = [];
  for (const tab of domainTabs) {
    const contract = domainContracts[tab];
    const exportFiles = contract.export
      .split(";")
      .map((entry) => entry.trim())
      .filter((entry) => entry.endsWith(".csv"));
    const nativeFields = Array.from(new Set(exportFiles.flatMap((file) => Object.keys(rowsByBase.get(file)?.[0] || {}))));
    const fieldsToMap = nativeFields.length > 0 ? nativeFields : ["client_native_field_to_confirm"];
    for (const field of fieldsToMap) {
      const isEvidenceField = field === "evidence_ref" || field === "document_ref";
      const isAmountField = /amount|cost|price|rate|value|fee|commitment|credit|rebate|spend|tco|score|pct|count|users|fte|hours|volume/iu.test(field);
      const isPeriodField = /period|date|month|quarter|year/iu.test(field);
      const targetField = COMMON_FIELDS.includes(field) ? field : `${contract.entity.replaceAll(/[^A-Za-z0-9]+/gu, "_").toLowerCase()}_${field}`;
      fields.push({
        tab,
        "AbarVa target domain": contract.domain,
        "AbarVa target entity": contract.entity,
        "target field": targetField,
        "plain-English definition": `${field.replaceAll("_", " ")} at the ${contract.grain} grain.`,
        "why it matters": "Needed for source-first answerability, evidence lineage, reconciliation and later Cube drill paths.",
        requirement: isEvidenceField || isAmountField ? "conditional" : "required",
        "preferred source system": contract.source,
        "source module": contract.module,
        "exact source object/table": contract.object,
        "exact report/API/export name": contract.export,
        "UI navigation or extraction path": contract.path,
        "native source field": field,
        "alternate source": isEvidenceField ? "Executed document or explicit evidence gap register." : "Structured team-completed workbook only when authoritative export is unavailable.",
        "record grain": contract.grain,
        "primary key": contract.primary,
        "join key": contract.join,
        "time period": isPeriodField ? "2024-08-01 through 2026-07-31 for monthly history" : "Current snapshot, with monthly history where applicable",
        "transformation/mapping": field === "client_native_field_to_confirm" ? "Client confirms exact native export field during collection." : `Map native ${field} to ${targetField}; preserve upstream source path and row hash.`,
        "allowed values": "Declared enums in template or explicit evidence gap.",
        "realistic example": `${contract.primary.split(" ")[0].toUpperCase()}-${pad(fields.length + 1, 5)}`,
        "responsible collecting role": contract.owner,
        "accountable validation role": contract.validator,
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
  const definitions = [
    ["enterprise", "enterprise_outcome", "Enterprise margin resilience while preserving access", "Measures whether enterprise operating choices protect sustainable margin without reducing access priorities.", "optimize", "Enterprise Strategy Sponsor", "CFO Finance Executive", "enterprise strategy council", "quarterly", "Workday; board materials; operating plan", "Workday SaaS and services", "BPO operating model", "reported"],
    ["enterprise", "enterprise_outcome", "Integrated care and plan operating alignment", "Tracks whether health-system and health-plan priorities are managed as one enterprise portfolio.", "increase", "Enterprise Strategy Sponsor", "Health Plan Executive", "enterprise operating committee", "monthly", "strategy documents; scorecards", "Epic managed services", "plan analytics roadmap", "reported"],
    ["enterprise", "leading_driver", "Transformation decisions with named evidence gaps", "Counts material decisions where evidence is sufficient, unresolved or explicitly missing.", "increase", "Transformation Strategy Executive", "PMO Transformation Delivery", "transformation council", "monthly", "PMO portfolio export; evidence register", "data analytics managed services", "AWS Databricks decision", "confirmed"],
    ["enterprise", "risk_guardrail", "No patient or member trust compromise during sourcing", "Guardrail that sourcing and technology changes must preserve privacy, continuity and compliance.", "maintain", "Enterprise Strategy Sponsor", "Compliance Risk Executive", "risk committee", "monthly", "GRC register; security scorecards", "BPO sourcing event", "contract scope cleanup", "reported"],
    ["health plan", "business_unit_outcome", "Medicare member retention and experience stability", "Captures whether plan operations protect member experience through operational and data changes.", "increase", "Health Plan Executive", "VP Plan Analytics Population Health", "plan business review", "monthly", "plan scorecards; analytics marts", "data analytics managed services", "plan analytics roadmap", "reported"],
    ["health plan", "leading_driver", "Population-health analytics freshness", "Indicates whether analytics refresh timing supports plan decisions without stale extracts.", "increase", "CDAO", "VP Plan Analytics Population Health", "plan analytics review", "weekly operations", "Clarity; Caboodle; SQL Server marts", "data analytics managed services", "SQL Server rationalization", "estimated"],
    ["health plan", "operational_indicator", "Claims and utilization reporting backlog", "Tracks aggregate reporting backlog affecting health-plan operating decisions.", "decrease", "Health Plan Executive", "VP Plan Analytics Population Health", "plan operations review", "monthly", "analytics marts; ServiceNow aggregate", "data analytics managed services", "Hadoop retirement", "unresolved"],
    ["health plan", "risk_guardrail", "Medicare reporting control readiness", "Ensures platform and sourcing decisions do not weaken regulated plan reporting controls.", "maintain", "Health Plan Executive", "Compliance Risk Executive", "compliance review", "quarterly", "GRC register; plan scorecards", "Workday SaaS and services", "data governance operating model", "reported"],
    ["hospitals and clinical operations", "business_unit_outcome", "Clinical operations continuity during platform modernization", "Captures whether modernization sequencing protects hospital operational continuity.", "maintain", "Clinical Health System Operations Executive", "VP Clinical Applications Epic", "clinical operations review", "monthly", "Epic module inventory; ServiceNow ITSM", "Epic managed services", "Epic scope resolution", "confirmed"],
    ["hospitals and clinical operations", "operational_indicator", "Epic module incident concentration", "Identifies modules with recurring aggregate incidents requiring scope or problem-management action.", "decrease", "VP Clinical Applications Epic", "Service Management IT Operations", "clinical IT operations review", "monthly", "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv; EPIC_MODULE_INVENTORY.csv", "Epic managed services", "problem closure improvement", "confirmed"],
    ["hospitals and clinical operations", "leading_driver", "Interface responsibility clarity", "Shows whether interface ownership is explicit, inferred or unresolved before renewal decisions.", "increase", "VP Clinical Applications Epic", "VP Integration and Interoperability", "integration review", "monthly", "EPIC_INTERFACE_INVENTORY.csv", "Epic managed services", "contract scope cleanup", "estimated"],
    ["hospitals and clinical operations", "risk_guardrail", "No detailed clinical text in sourcing evidence", "Ensures demo and future discovery use only aggregate operational facts.", "maintain", "Clinical Health System Operations Executive", "Audit reviewer", "evidence review", "monthly", "evidence register", "all material contract families", "evidence governance", "confirmed"],
    ["revenue cycle", "business_unit_outcome", "Revenue-cycle shared-services readiness", "Captures whether functions can move into a shared-services/BPO design without losing control.", "increase", "VP Revenue Cycle", "VP Shared Services BPO", "revenue cycle review", "monthly", "BPO_CURRENT_STATE_PROCESS_VOLUMES.csv", "BPO sourcing event", "BPO operating model", "reported"],
    ["revenue cycle", "leading_driver", "Denial and billing process evidence availability", "Records whether source evidence exists for revenue-cycle processes before sourcing decisions.", "increase", "VP Revenue Cycle", "Shared-services process owner", "process workshop", "weekly operations", "team prework; scorecards", "BPO sourcing event", "process evidence enrichment", "unresolved"],
    ["finance", "business_unit_outcome", "Finance operations cost transparency", "Shows whether Workday and AP extracts can explain vendor, labor and technology cost drivers.", "increase", "CFO Finance Executive", "FP&A partner", "finance performance review", "monthly", "WORKDAY_SUPPLIER_INVOICES.csv; WORKDAY_PAYMENTS.csv", "Workday SaaS and services", "BPO operating model", "confirmed"],
    ["finance", "operational_indicator", "Invoice lines above contract rate expectations", "Tracks invoice lines requiring rate-card variance review.", "decrease", "CFO Finance Executive", "IT finance lead", "vendor finance review", "monthly", "WORKDAY_SUPPLIER_INVOICES.csv; VENDOR_RATE_CARD_INVOICES.csv", "data analytics managed services", "rate-card cleanup", "confirmed"],
    ["finance", "risk_guardrail", "Unknown financial values are not zero-filled", "Ensures estimates, blanks and unresolved values remain distinct from verified facts.", "maintain", "CFO Finance Executive", "Audit reviewer", "quality review", "monthly", "validation report; model-fit audit", "all material contract families", "evidence governance", "confirmed"],
    ["supply chain and procurement", "business_unit_outcome", "Enterprise contract leverage capture", "Captures whether fragmented purchasing is converted into governed enterprise leverage.", "increase", "Chief Procurement Supply Chain Officer", "Supply Chain Operations Lead", "supply chain review", "monthly", "CONTRACT_REGISTER.csv; LOCAL_HOSPITAL_PURCHASES.csv", "medical surgical distribution", "contract leverage program", "reported"],
    ["supply chain and procurement", "operational_indicator", "Off-contract facility purchase rate", "Identifies facility-level purchasing outside contracted distribution channels.", "decrease", "Chief Procurement Supply Chain Officer", "Hospital supply chain analyst", "facility procurement review", "monthly", "LOCAL_HOSPITAL_PURCHASES.csv", "medical surgical distribution", "local procurement cleanup", "confirmed"],
    ["supply chain and procurement", "leading_driver", "Earned rebate reconciliation completeness", "Shows whether earned rebates and credits are reconciled across facilities.", "increase", "Chief Procurement Supply Chain Officer", "Procurement finance partner", "rebate review", "monthly", "MEDSURG_REBATES_CREDITS.csv", "medical surgical distribution", "rebate recovery workflow", "estimated"],
    ["human resources", "business_unit_outcome", "Workforce transition clarity for shared services", "Captures the roles, costs and retained leadership choices needed before BPO decisions.", "increase", "HR Operations Executive", "VP Shared Services BPO", "workforce review", "monthly", "WORKDAY_WORKER_ROLE_SUMMARY.csv; BPO_CURRENT_STATE_WORKFORCE.csv", "BPO sourcing event", "retained organization design", "reported"],
    ["human resources", "risk_guardrail", "No personal employee detail in workforce analysis", "Guardrail that workforce analysis remains role and aggregate-cost based.", "maintain", "HR Operations Executive", "Audit reviewer", "data governance review", "monthly", "validation report; workforce extract contract", "BPO sourcing event", "workforce evidence governance", "confirmed"],
    ["shared services", "business_unit_outcome", "Back-office service-level reliability", "Tracks whether shared-services options improve reliability without losing controls.", "increase", "VP Shared Services BPO", "Shared-services process owner", "shared-services review", "monthly", "BPO_CURRENT_STATE_PROCESS_VOLUMES.csv; BPO_RFP_REQUIREMENTS.csv", "BPO sourcing event", "shared services operating model", "reported"],
    ["shared services", "leading_driver", "Automation commitment credibility", "Shows whether supplier automation commitments are backed by response and pricing evidence.", "increase", "VP Shared Services BPO", "Commercial evaluation owner", "BPO evaluation committee", "weekly operations", "BPO_SUPPLIER_RESPONSES.csv; BPO_COMMERCIAL_LINES.csv", "BPO sourcing event", "automation commitment review", "estimated"],
    ["digital and patient/member experience", "business_unit_outcome", "Experience roadmap dependency clarity", "Captures digital experience dependencies on data, vendor and platform decisions.", "increase", "Digital Experience Executive", "VP Digital Patient Member Experience", "experience review", "monthly", "applications inventory; dependency map", "data analytics managed services", "AWS Databricks decision", "unresolved"],
    ["digital and patient/member experience", "risk_guardrail", "No experience degradation during vendor transition", "Guardrail for transformation sequencing across patient/member-facing capabilities.", "maintain", "Digital Experience Executive", "IT Operations Leader", "experience risk review", "monthly", "ServiceNow ITSM; PMO dependencies", "Epic managed services", "transition roadmap", "reported"],
    ["information technology", "business_unit_outcome", "Critical application support stability", "Shows whether managed-service and internal teams keep critical applications within support expectations.", "maintain", "CIO", "VP Service Management IT Operations", "technology portfolio review", "monthly", "SERVICENOW_CMDB_APPLICATIONS.csv; SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "data analytics managed services", "problem closure improvement", "confirmed"],
    ["information technology", "operational_indicator", "Backlog aging above contractual target", "Tracks backlog records over 30 days for services under vendor contracts.", "decrease", "CIO", "Service management leader", "IT operations review", "monthly", "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "Epic managed services", "vendor performance remediation", "confirmed"],
    ["information technology", "leading_driver", "Contract scope mapped to applications and CIs", "Indicates whether contract scope is traceable to services, applications and CIs.", "increase", "CIO", "Enterprise architecture lead", "architecture review board", "monthly", "CONTRACT_SCOPE_RELATIONSHIPS.csv", "all material contract families", "contract scope cleanup", "confirmed"],
    ["information technology", "risk_guardrail", "No default tenant fallback in answer paths", "Guardrail that missing healthcare tenant resolution must block rather than default to another tenant.", "maintain", "CIO", "Platform engineering owner", "tenant isolation review", "monthly", "test-load plan; validator", "not applicable", "tenant bootstrap", "confirmed"],
    ["information technology", "business_unit_outcome", "Legacy platform retirement sequencing", "Captures whether Hadoop, SAS and SQL Server retirement decisions are sequenced with contracts.", "optimize", "CTO", "VP Enterprise Architecture", "technology roadmap review", "monthly", "HADOOP_CLUSTER_WORKLOADS.csv; SQL_SERVER_DATA_MARTS.csv; SAS_APPLICATIONS_AND_USERS.csv", "data analytics managed services", "Hadoop retirement", "reported"],
    ["information technology", "leading_driver", "Cloud commitment decision readiness", "Shows whether AWS and Databricks commitments have prerequisite decisions named.", "increase", "CTO", "Cloud/data platform finance owner", "cloud steering committee", "monthly", "AWS_TARGET_COMMITMENT_SCENARIOS.csv; DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv", "AWS and Databricks", "AWS Databricks decision", "estimated"],
    ["data, analytics and AI", "business_unit_outcome", "Trusted analytics operating model", "Captures whether data teams, governance and platforms can support enterprise decision context.", "increase", "CDAO", "VP Analytics BI and Data Science", "data analytics AI review", "monthly", "strategy documents; analytics platform dependencies", "data analytics managed services", "data governance operating model", "reported"],
    ["data, analytics and AI", "leading_driver", "Clarity/Caboodle to lakehouse dependency readiness", "Identifies source assets and dependencies that affect cloud/data-platform sequencing.", "increase", "CDAO", "VP Data Platforms and Engineering", "data platform review", "monthly", "CLARITY_CABOODLE_ASSET_INVENTORY.csv; ANALYTICS_PLATFORM_DEPENDENCIES.csv", "Databricks Inc.", "AWS Databricks decision", "estimated"],
    ["data, analytics and AI", "operational_indicator", "SAS usage requiring migration decision", "Tracks SAS application/user groups that need explicit future-state decisions.", "decrease", "CDAO", "VP Analytics BI and Data Science", "analytics modernization review", "monthly", "SAS_APPLICATIONS_AND_USERS.csv", "data analytics managed services", "SAS rationalization", "reported"],
    ["data, analytics and AI", "risk_guardrail", "AI value claims require baseline and outcome evidence", "Guardrail that adoption signals alone cannot become value claims.", "maintain", "CDAO", "AI governance owner", "AI governance review", "monthly", "question bank; evidence register", "data analytics managed services", "AI evidence model", "confirmed"],
    ["data, analytics and AI", "business_unit_outcome", "Data product prioritization tied to enterprise decisions", "Shows whether analytics work is tied to executive decisions rather than report inventory alone.", "increase", "CDAO", "Data product owner", "portfolio review", "monthly", "outcome map; PMO dependencies", "data analytics managed services", "data product roadmap", "unresolved"],
    ["cybersecurity", "risk_guardrail", "Third-party risk posture preserved through sourcing", "Ensures sourcing and contract changes do not weaken vendor security obligations.", "maintain", "CISO", "VP Cybersecurity Operations GRC", "security risk review", "monthly", "GRC register; contract security schedules", "BPO sourcing event", "third-party risk review", "reported"],
    ["cybersecurity", "operational_indicator", "Security exception closure aging", "Tracks aggregate security exceptions that could affect vendor or platform decisions.", "decrease", "CISO", "GRC operations owner", "security operations review", "monthly", "RISK_CONTROL_OBSERVATIONS.csv", "cybersecurity managed detection", "risk remediation", "estimated"],
    ["cybersecurity", "leading_driver", "Identity and access readiness for shared-services model", "Captures IAM dependencies before back-office sourcing or retained organization decisions.", "increase", "CISO", "Cybersecurity operations lead", "BPO control review", "monthly", "RISK_CONTROL_OBSERVATIONS.csv; BPO_RFP_REQUIREMENTS.csv", "BPO sourcing event", "control matrix finalization", "unresolved"],
    ["quality, compliance and enterprise risk", "risk_guardrail", "Regulatory reporting definitions remain controlled", "Ensures platform, sourcing and analytics changes do not alter reporting definitions without approval.", "maintain", "Compliance Risk Executive", "Quality Analytics Lead", "quality compliance review", "quarterly", "scorecards; GRC register; analytics marts", "data analytics managed services", "data governance operating model", "reported"],
    ["quality, compliance and enterprise risk", "business_unit_outcome", "Evidence gaps are visible before executive claims", "Captures whether gaps are named before Home, Tower, Source or aVa present conclusions.", "increase", "Compliance Risk Executive", "Audit reviewer", "audit playback", "monthly", "validation report; evidence register", "all material contract families", "evidence governance", "confirmed"],
    ["quality, compliance and enterprise risk", "operational_indicator", "Controls linked to BPO requirements", "Tracks whether risk and control expectations are present in BPO requirements and supplier responses.", "increase", "Compliance Risk Executive", "Controls and process design owner", "BPO risk review", "weekly operations", "BPO_RFP_REQUIREMENTS.csv; BPO_SUPPLIER_RESPONSES.csv", "BPO sourcing event", "control matrix finalization", "reported"],
    ["quality, compliance and enterprise risk", "leading_driver", "Contradictions resolved before activation", "Shows whether conflicting source, interview or document claims are resolved before staged activation.", "increase", "Compliance Risk Executive", "Phase A audit owner", "executive playback", "monthly", "validation report; model-fit audit", "not applicable", "Phase B approval gate", "confirmed"],
  ];
  return definitions.map((row, index) => {
    const [
      portfolio,
      classification,
      name,
      definition,
      desiredDirection,
      executiveOwner,
      operatingOwner,
      forum,
      cadence,
      systems,
      vendorDependency,
      initiative,
      confidence,
    ] = row;
    return {
      record_id: `OUTCOME-${pad(index + 1, 3)}`,
      enterprise_or_business_unit: portfolio === "enterprise" ? "enterprise" : "business_unit",
      portfolio_or_function: portfolio,
      business_purpose: `${portfolio} uses this discovery row to connect leadership intent to systems, vendors, contracts, initiatives and evidence.`,
      strategic_priority: pick(["access and affordability", "operational reliability", "margin resilience", "member and patient experience", "risk reduction", "data-driven transformation"]),
      outcome_or_indicator_name: name,
      classification,
      "plain-English definition": definition,
      why_it_matters: "Supports four-week discovery by identifying what leadership cares about and what operational evidence is needed before deeper enrichment.",
      desired_direction: desiredDirection,
      executive_owner_role: executiveOwner,
      operating_owner_role: operatingOwner,
      primary_decision_supported: pick(["portfolio priority validation", "vendor dependency review", "transformation sequencing", "investment trade-off", "risk guardrail confirmation"]),
      review_forum: forum,
      review_cadence: cadence,
      related_business_units: portfolio === "enterprise" ? "enterprise; health plan; hospitals and clinical operations" : portfolio,
      related_capabilities: pick(["vendor management; analytics", "clinical operations; service management", "finance operations; procurement", "security; risk management", "digital experience; data platforms"]),
      related_processes: pick(["planning and budgeting", "sourcing and contract governance", "incident and service review", "claims and operations review", "workforce and shared services planning"]),
      key_systems_or_data_sources: systems,
      material_vendor_or_contract_dependency: vendorDependency,
      related_initiatives: initiative,
      current_value_optional: confidence === "confirmed" && index % 4 !== 0 ? "synthetic discovery placeholder; not Phase B verified" : "",
      target_value_optional: index % 5 === 0 ? "" : "optional during four-week discovery",
      formula_optional: index % 3 === 0 ? "" : "team supplied if available; unresolved until validated",
      history_available: pick(["yes", "partial", "no", "unknown"]),
      evidence_source: pick(["strategy document", "operating plan", "scorecard", "board material", "existing report", "team prework"]),
      confidence_state: confidence,
      validation_owner_role: `${operatingOwner} validation delegate`,
      notes_or_known_gap: confidence === "unresolved" ? "Relationship or source evidence requires follow-on enrichment." : "Synthetic discovery context; not a verified baseline.",
    };
  });
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
  await writeText(path.join(tmp, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  await writeText(path.join(tmp, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  await writeText(path.join(tmp, "xl", "_rels", "workbook.xml.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  await writeText(path.join(tmp, "xl", "styles.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9EEF7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  await writeText(path.join(tmp, "xl", "workbook.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, i) => `<sheet name="${xmlEscape(sheet.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  for (const [sheetIndex, sheet] of sheets.entries()) {
    const rows = sheet.rows || [];
    const maxCols = Math.max(1, ...rows.map((row) => row.length));
    const lastCell = `${colName(maxCols - 1)}${Math.max(rows.length, 1)}`;
    const cols = Array.from({ length: maxCols }, (_, i) => `<col min="${i + 1}" max="${i + 1}" width="${i === 0 ? 24 : 32}" customWidth="1"/>`).join("");
    const sheetData = rows.map((row, rowIndex) => {
      const cells = row.map((value, colIndex) => `<c r="${colName(colIndex)}${rowIndex + 1}" t="inlineStr"${rowIndex === 0 ? ' s="1"' : ""}><is><t>${xmlEscape(value)}</t></is></c>`).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
    const filter = rows.length > 1 ? `<autoFilter ref="A1:${colName(maxCols - 1)}${rows.length}"/>` : "";
    await writeText(path.join(tmp, "xl", "worksheets", `sheet${sheetIndex + 1}.xml`), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCell}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${sheetData}</sheetData>${filter}</worksheet>`);
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
  const medCategories = ["gloves", "syringes", "wound care", "lab consumable", "procedure kit"];
  const workforceRoles = ["developer", "analyst", "architect", "service manager", "operations specialist"];
  const workforceLocations = ["US", "nearshore", "offshore"];
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
    add(specs["WORKDAY_WORKER_ROLE_SUMMARY.csv"], { role_month_id: `WD-WR-${pad(i + 1, 5)}`, function_ref: functions[i % functions.length], role_family: pick(["analyst", "specialist", "manager", "supervisor", "operations lead"]), location_model: "US_based_internal", normalized_location_model: "us_internal", fte_count: 1 + (i % 4), loaded_labor_cost: money(7_500 + random() * 8_000), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[5] });
  }
  for (let i = 0; i < 6_000; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["LOCAL_HOSPITAL_PURCHASES.csv"], { po_line_id: `LHP-PO-${pad(i + 1, 6)}`, facility: facilities[i % facilities.length], item_id: `ITEM-${pad((i % 420) + 1, 4)}`, contract_family_id: "CF-004", purchase_channel: i % 9 === 0 ? "off_contract_local" : "contracted_distributor", quantity: 1 + (i % 120), unit_price: money(3 + random() * 950), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[3] });
  }
  for (let i = 0; i < 420; i += 1) add(specs["MEDSURG_ITEM_MASTER.csv"], { item_id: `ITEM-${pad(i + 1, 4)}`, category: medCategories[i % medCategories.length], equivalent_group: `EQ-${pad((i % 80) + 1, 3)}`, contracted_item: i % 7 === 0 ? "false" : "true", story_thread_ref: storyThreads[3] });
  for (let i = 0; i < 840; i += 1) add(specs["MEDSURG_PRICE_TIERS.csv"], { price_tier_id: `MST-${pad(i + 1, 5)}`, item_id: `ITEM-${pad((i % 420) + 1, 4)}`, facility: facilities[i % facilities.length], category: medCategories[i % medCategories.length], tier: `tier_${(i % 4) + 1}`, unit_price: money(2 + random() * 900), story_thread_ref: storyThreads[3] });
  for (let i = 0; i < 720; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["MEDSURG_BACKORDERS_SUBSTITUTIONS.csv"], { substitution_id: `MSS-${pad(i + 1, 5)}`, item_id: `ITEM-${pad((i % 420) + 1, 4)}`, facility: facilities[i % facilities.length], backorder_count: i % 6, substitution_count: i % 5, incremental_cost: money(random() * 1200), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[3] });
  }
  for (let i = 0; i < 480; i += 1) {
    const month = periodMonths[i % periodMonths.length];
    add(specs["MEDSURG_REBATES_CREDITS.csv"], { rebate_id: `MSR-${pad(i + 1, 5)}`, facility: facilities[i % facilities.length], category: medCategories[i % medCategories.length], earned_rebate_amount: money(300 + random() * 9000), reconciled_rebate_amount: money(200 + random() * 7000), period_start: month.start, period_end: month.end, story_thread_ref: storyThreads[3] });
  }
  for (const contract of contractFamilies) {
    add(specs["CONTRACT_REGISTER.csv"], { contract_family_id: contract[0], contract_name: contract[1], vendor_id: contract[2], synthetic_midpoint_total_contract_value: contract[3], evidence_tier: contract[4], renewal_window: "2027 planning", story_thread_ref: contract[5] });
  }
  for (let i = 0; i < 24; i += 1) {
    const contract = contractFamilies[i % contractFamilies.length];
    add(specs["CONTRACT_INSTRUMENTS.csv"], { instrument_id: `LI-${pad(i + 1, 3)}`, contract_family_id: contract[0], instrument_type: pick(["MSA", "SOW", "Amendment", "Pricing Schedule", "SLA Schedule", "Security Schedule", "Exit Terms"]), effective_date: `202${4 + (i % 3)}-${pad((i % 12) + 1, 2)}-01`, document_ref: `DOC-${pad((i % 30) + 1, 3)}`, story_thread_ref: contract[5] });
  }
  for (let i = 0; i < 18; i += 1) add(specs["CONTRACT_AMENDMENTS.csv"], { amendment_id: `AMD-${pad(i + 1, 3)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], amendment_theme: pick(["scope change", "rate update", "term extension", "service level revision"]), financial_effect: money(-50_000 + random() * 400_000), story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  for (let i = 0; i < 420; i += 1) add(specs["CONTRACT_RATE_CARDS.csv"], { rate_card_id: `RC-${pad(i + 1, 4)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], role_title: workforceRoles[i % workforceRoles.length], location_model: workforceLocations[i % workforceLocations.length], contracted_rate: money(45 + random() * 175), billed_rate_observed: money(48 + random() * 195), story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
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
    const contract = contractFamilies[i % contractFamilies.length];
    const eligible = money(((i % 3 === 0 || (contract[0] === "CF-005" && i % 10 === 4)) ? 1 : 0) * (800 + random() * 12_000));
    add(specs["SERVICENOW_SERVICE_CREDITS.csv"], { service_credit_id: `SN-CRED-${pad(i + 1, 5)}`, contract_id: contractFamilies[i % contractFamilies.length][0], service_ref: `SV-${pad((i % 90) + 1, 3)}`, eligible_amount: eligible, claimed_amount: money(eligible * (i % 4 === 0 ? 0.25 : 0)), claim_state: eligible > 0 ? "eligible_underclaimed" : "not_earned", period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
  }
  for (let i = 0; i < 34; i += 1) add(specs["EPIC_MODULE_INVENTORY.csv"], { module_id: `EPIC-MOD-${pad(i + 1, 3)}`, module_name: pick(["Resolute", "Cadence", "Prelude", "Willow", "Clarity", "Caboodle", "Bridges"]), support_scope_state: i % 6 === 0 ? "overlap_requires_resolution" : "explicit", contract_family_id: "CF-002", story_thread_ref: storyThreads[1] });
  for (let i = 0; i < 240; i += 1) add(specs["EPIC_INTERFACE_INVENTORY.csv"], { interface_id: `EPIC-IF-${pad(i + 1, 4)}`, module_id: `EPIC-MOD-${pad((i % 34) + 1, 3)}`, application_id: applications[i % applications.length], interface_type: pick(["HL7", "FHIR", "batch", "API"]), responsibility_state: i % 9 === 0 ? "unresolved" : "explicit", story_thread_ref: storyThreads[1] });
  for (let i = 0; i < 180; i += 1) add(specs["CLARITY_CABOODLE_ASSET_INVENTORY.csv"], { asset_id: `EC-ASSET-${pad(i + 1, 4)}`, platform: pick(["Clarity", "Caboodle"]), reporting_domain: pick(["clinical quality", "population health", "finance", "operations"]), downstream_mart_id: `MART-${pad((i % 140) + 1, 4)}`, story_thread_ref: storyThreads[6] });
  for (let i = 0; i < 96; i += 1) add(specs["HADOOP_CLUSTER_WORKLOADS.csv"], { workload_id: `HD-WL-${pad(i + 1, 4)}`, cluster_ref: `HADOOP-${(i % 5) + 1}`, workload_name: `synthetic workload ${i + 1}`, retirement_dependency: i % 3 === 0 ? "contract_scope_fee_reduction_not_linked" : "migration_candidate", story_thread_ref: storyThreads[6] });
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
    add(specs["VENDOR_WORKFORCE_MONTHLY.csv"], { workforce_month_id: `VWF-${pad(i + 1, 5)}`, contract_family_id: contractFamilies[i % contractFamilies.length][0], role_title: workforceRoles[i % workforceRoles.length], location_model: workforceLocations[i % workforceLocations.length], contracted_pyramid_band: pick(["lead", "senior", "mid", "junior"]), billed_fte: money(0.5 + random() * 8), contracted_mix_pct: money(5 + random() * 25), billed_mix_pct: money(5 + random() * 35), period_start: month.start, period_end: month.end, story_thread_ref: contractFamilies[i % contractFamilies.length][5] });
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
  for (let i = 0; i < 150; i += 1) add(bpoSpecs["BPO_CURRENT_STATE_WORKFORCE.csv"], { current_workforce_id: `BPO-WF-${pad(i + 1, 4)}`, function_ref: functions[i % functions.length], role_family: pick(["processor", "specialist", "supervisor", "manager"]), location_model: "US_internal", normalized_location_model: "us_internal", resource_count: 1, loaded_labor_cost_annual: money(82_000 + random() * 48_000), leadership_or_retained_org: i % 15 === 0 ? "retained_leadership" : "delivery_baseline", story_thread_ref: storyThreads[5] });
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

function buildQuestionBank(fileRows) {
  const rowsByBase = new Map(Array.from(fileRows.entries()).map(([relativePath, rows]) => [path.basename(relativePath), rows]));
  const byBase = (base) => rowsByBase.get(base) || [];
  const n = (value) => Number(value || 0);
  const choose = (base, predicate) => {
    const row = byBase(base).find(predicate);
    if (!row) throw new Error(`Unable to find planted question row in ${base}`);
    return row;
  };
  const chooseContract = (base, story, contractId, predicate = () => true) =>
    choose(base, (row) => row.story_thread_ref === story && (row.contract_family_id === contractId || row.contract_id === contractId) && predicate(row));
  const evidenceRows = byBase("EVIDENCE_SPANS.csv");
  const rowValue = (row, key) => {
    const aliases = {
      contract_family_id: ["contract_family_id", "contract_id"],
      contract_id: ["contract_id", "contract_family_id"],
      application_id: ["application_id", "application_ref"],
      application_ref: ["application_ref", "application_id"],
      downstream_mart_id: ["downstream_mart_id", "mart_id"],
      mart_id: ["mart_id", "downstream_mart_id"],
    };
    for (const field of aliases[key] || [key]) {
      if (row[field]) return row[field];
    }
    return "";
  };
  const evidenceFor = (story, plantedRows, spanTypes = [], subjectTerms = []) => {
    const contractRefs = new Set(plantedRows.map((row) => row.contract_family_id || row.contract_id).filter(Boolean));
    const subjectMatches = (candidate) => subjectTerms.length === 0 || subjectTerms.some((term) => String(candidate.evidence_subject || candidate.accepted_extraction || "").toLowerCase().includes(term.toLowerCase()));
    for (const row of plantedRows) {
      if (!row.evidence_ref) continue;
      const evidence = evidenceRows.find((candidate) => candidate.evidence_ref === row.evidence_ref);
      if (evidence && evidence.story_thread_ref === story && (contractRefs.size === 0 || contractRefs.has(evidence.contract_family_id)) && (spanTypes.length === 0 || spanTypes.includes(evidence.span_type)) && subjectMatches(evidence)) return evidence;
    }
    return evidenceRows.find((candidate) =>
      candidate.story_thread_ref === story &&
      (contractRefs.size === 0 || contractRefs.has(candidate.contract_family_id)) &&
      (spanTypes.length === 0 || spanTypes.includes(candidate.span_type)) &&
      subjectMatches(candidate),
    ) || evidenceRows.find((candidate) => candidate.story_thread_ref === story);
  };
  const makeScenario = ({ domain, story, files, rows, measures, dimensions, grain, challenge, cube, predicate, evidenceTypes = [], evidenceSubjectTerms = [], joinKeys = [], crossDomainRelationships = [] }) => {
    const evidence = evidenceFor(story, rows, evidenceTypes, evidenceSubjectTerms);
    if (!evidence) throw new Error(`Unable to find aligned evidence for ${domain}`);
    return {
      domain,
      story,
      files,
      records: rows.map((row) => row.source_record_id),
      measures,
      dimensions,
      grain,
      challenge,
      cube,
      predicate,
      evidence_ref: evidence.evidence_ref,
      evidence_type: evidence.span_type,
      evidence_subject_terms: evidenceSubjectTerms,
      join_keys: joinKeys.filter((key) => rows.filter((record) => rowValue(record, key)).length > 1),
      cross_domain_relationships: crossDomainRelationships,
    };
  };
  const scenarios = [
    makeScenario({
      domain: "contract economics",
      story: storyThreads[0],
      files: ["WORKDAY_SUPPLIER_INVOICES.csv", "CONTRACT_RATE_CARDS.csv"],
      rows: [
        chooseContract("WORKDAY_SUPPLIER_INVOICES.csv", storyThreads[0], "CF-001", (row) => row.rate_card_match_state === "variance_requires_review"),
        chooseContract("CONTRACT_RATE_CARDS.csv", storyThreads[0], "CF-001", (row) => n(row.billed_rate_observed) > n(row.contracted_rate)),
      ],
      measures: ["line_amount", "billed_rate_observed", "contracted_rate"],
      dimensions: ["vendor_id", "contract_family_id", "period_start"],
      grain: "vendor_contract_month",
      challenge: "analytics managed-services invoice lines exceeding contracted role rates",
      cube: "source_contract_economics",
      predicate: "rate_overbilling",
      evidenceTypes: ["pricing", "rate_card"],
      evidenceSubjectTerms: ["managed-services", "rate-card", "contract economics"],
      joinKeys: ["contract_family_id"],
    }),
    makeScenario({
      domain: "SLA service credits",
      story: storyThreads[0],
      files: ["SERVICENOW_SERVICE_CREDITS.csv", "CONTRACT_SLA_TERMS.csv"],
      rows: [
        chooseContract("SERVICENOW_SERVICE_CREDITS.csv", storyThreads[0], "CF-001", (row) => n(row.eligible_amount) > n(row.claimed_amount)),
        chooseContract("CONTRACT_SLA_TERMS.csv", storyThreads[0], "CF-001"),
      ],
      measures: ["eligible_amount", "claimed_amount"],
      dimensions: ["contract_id", "service_ref", "period_start"],
      grain: "contract_service_month",
      challenge: "managed-services credits earned but not claimed",
      cube: "source_service_performance",
      predicate: "unclaimed_credit",
      evidenceTypes: ["sla"],
      evidenceSubjectTerms: ["SLA", "service credits"],
      joinKeys: ["contract_family_id"],
    }),
    makeScenario({
      domain: "Epic operational performance",
      story: storyThreads[1],
      files: ["SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "EPIC_MODULE_INVENTORY.csv"],
      rows: [
        chooseContract("SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", storyThreads[1], "CF-002", (row) => n(row.p1_count) > 0 || n(row.backlog_over_30_days) > 0),
        choose("EPIC_MODULE_INVENTORY.csv", (row) => row.story_thread_ref === storyThreads[1] && row.contract_family_id === "CF-002" && row.support_scope_state === "overlap_requires_resolution"),
      ],
      measures: ["p1_count", "p2_count", "sla_breach_count", "backlog_over_30_days"],
      dimensions: ["contract_id", "application_ref", "ci_ref"],
      grain: "application_service_month",
      challenge: "Epic support areas with recurring incident concentration or backlog aging",
      cube: "source_service_performance",
      predicate: "incident_or_backlog_pressure",
      evidenceTypes: ["scope", "sla"],
      evidenceSubjectTerms: ["Epic", "SLA", "scope"],
      joinKeys: ["contract_family_id"],
    }),
    makeScenario({
      domain: "Epic interface scope",
      story: storyThreads[1],
      files: ["EPIC_INTERFACE_INVENTORY.csv", "CONTRACT_SCOPE_RELATIONSHIPS.csv"],
      rows: (() => {
        const iface = choose("EPIC_INTERFACE_INVENTORY.csv", (row) => row.story_thread_ref === storyThreads[1] && row.responsibility_state === "unresolved");
        const scope = chooseContract("CONTRACT_SCOPE_RELATIONSHIPS.csv", storyThreads[1], "CF-002", (row) => row.relationship_confidence === "inferred_requires_review");
        return [iface, scope];
      })(),
      measures: ["responsibility_state", "relationship_confidence"],
      dimensions: ["module_id", "application_id", "contract_family_id"],
      grain: "interface_contract_scope",
      challenge: "unresolved Epic interface responsibilities before renewal decisions",
      cube: "source_contract_scope",
      predicate: "unresolved_scope",
      evidenceTypes: ["scope"],
      evidenceSubjectTerms: ["Epic", "scope"],
      crossDomainRelationships: ["Unresolved interface inventory and contract scope relationship rows are same-story evidence for Epic scope triage; the source adapter must resolve the exact interface-service bridge in Phase B."],
    }),
    makeScenario({
      domain: "Workday SaaS usage",
      story: storyThreads[2],
      files: ["SAAS_MODULE_USAGE_MONTHLY.csv", "WORKDAY_SUPPLIERS.csv"],
      rows: [
        choose("SAAS_MODULE_USAGE_MONTHLY.csv", (row) => row.story_thread_ref === storyThreads[2] && row.vendor_id === "VND-003" && row.low_usage_flag === "true"),
        choose("WORKDAY_SUPPLIERS.csv", (row) => row.story_thread_ref === storyThreads[2] && row.vendor_id === "VND-003"),
      ],
      measures: ["entitled_users", "active_users", "low_usage_flag"],
      dimensions: ["vendor_id", "module_name", "period_start"],
      grain: "module_month",
      challenge: "persistently underused Workday or workflow modules before renewal",
      cube: "source_saas_usage",
      predicate: "low_utilization",
      evidenceSubjectTerms: ["Workday", "module usage"],
      joinKeys: ["vendor_id"],
    }),
    makeScenario({
      domain: "Workday BPO dependency",
      story: storyThreads[5],
      files: ["WORKDAY_WORKER_ROLE_SUMMARY.csv", "BPO_CURRENT_STATE_WORKFORCE.csv"],
      rows: (() => {
        const retainedRole = choose("BPO_CURRENT_STATE_WORKFORCE.csv", (row) => row.story_thread_ref === storyThreads[5] && row.leadership_or_retained_org === "retained_leadership");
        const workerSummary = choose("WORKDAY_WORKER_ROLE_SUMMARY.csv", (row) => row.story_thread_ref === storyThreads[5] && row.function_ref === retainedRole.function_ref && row.normalized_location_model === retainedRole.normalized_location_model && n(row.loaded_labor_cost) > 0);
        return [workerSummary, retainedRole];
      })(),
      measures: ["fte_count", "loaded_labor_cost", "loaded_labor_cost_annual"],
      dimensions: ["function_ref", "role_family", "location_model", "normalized_location_model"],
      grain: "role_function_location",
      challenge: "internal roles that must be retained or transitioned in the BPO model",
      cube: "consumption_sourcing_bpo",
      predicate: "workforce_transition_cost",
      evidenceSubjectTerms: ["BPO", "retained organization", "transition"],
      joinKeys: ["function_ref", "normalized_location_model"],
    }),
    makeScenario({
      domain: "medical surgical procurement",
      story: storyThreads[3],
      files: ["LOCAL_HOSPITAL_PURCHASES.csv", "MEDSURG_ITEM_MASTER.csv"],
      rows: (() => {
        const purchase = choose("LOCAL_HOSPITAL_PURCHASES.csv", (row) => row.story_thread_ref === storyThreads[3] && row.purchase_channel === "off_contract_local");
        const item = choose("MEDSURG_ITEM_MASTER.csv", (row) => row.story_thread_ref === storyThreads[3] && row.item_id === purchase.item_id);
        return [purchase, item];
      })(),
      measures: ["quantity", "unit_price"],
      dimensions: ["facility", "item_id", "purchase_channel"],
      grain: "facility_item_month",
      challenge: "facility-level off-contract medical/surgical purchasing",
      cube: "source_medsurg_procurement",
      predicate: "off_contract_purchase",
      evidenceSubjectTerms: ["Medical surgical", "facility", "item"],
      joinKeys: ["item_id"],
    }),
    makeScenario({
      domain: "medical surgical rebate",
      story: storyThreads[3],
      files: ["MEDSURG_REBATES_CREDITS.csv", "MEDSURG_PRICE_TIERS.csv"],
      rows: (() => {
        const rebate = choose("MEDSURG_REBATES_CREDITS.csv", (row) => row.story_thread_ref === storyThreads[3] && n(row.earned_rebate_amount) > n(row.reconciled_rebate_amount));
        const tier = choose("MEDSURG_PRICE_TIERS.csv", (row) => row.story_thread_ref === storyThreads[3] && row.facility === rebate.facility && row.category === rebate.category);
        return [rebate, tier];
      })(),
      measures: ["earned_rebate_amount", "reconciled_rebate_amount", "unit_price"],
      dimensions: ["facility", "category", "item_id"],
      grain: "facility_category_month",
      challenge: "earned medical/surgical rebates that remain unreconciled",
      cube: "source_medsurg_procurement",
      predicate: "rebate_gap",
      evidenceSubjectTerms: ["Medical surgical", "rebate", "price-tier"],
      joinKeys: ["facility", "category"],
    }),
    makeScenario({
      domain: "facilities EVS service",
      story: storyThreads[4],
      files: ["SERVICENOW_MONTHLY_SLA_SUMMARY.csv", "SERVICENOW_SERVICE_CREDITS.csv"],
      rows: [
        chooseContract("SERVICENOW_MONTHLY_SLA_SUMMARY.csv", storyThreads[4], "CF-005", (row) => n(row.breach_count) > 0),
        chooseContract("SERVICENOW_SERVICE_CREDITS.csv", storyThreads[4], "CF-005", (row) => n(row.eligible_amount) > n(row.claimed_amount)),
      ],
      measures: ["actual_pct", "breach_count", "eligible_amount", "claimed_amount"],
      dimensions: ["contract_id", "service_ref", "period_start"],
      grain: "facility_service_month",
      challenge: "operational-services SLA misses that create unclaimed penalty exposure",
      cube: "source_service_performance",
      predicate: "service_credit_gap",
      evidenceTypes: ["sla"],
      evidenceSubjectTerms: ["Facilities EVS", "service credits"],
      joinKeys: ["contract_family_id", "service_ref", "period_start"],
    }),
    makeScenario({
      domain: "BPO normalized TCO",
      story: storyThreads[5],
      files: ["BPO_COMMERCIAL_LINES.csv", "BPO_NORMALIZED_TCO.csv"],
      rows: [
        choose("BPO_COMMERCIAL_LINES.csv", (row) => row.story_thread_ref === storyThreads[5] && row.supplier_id === "BPO-C"),
        choose("BPO_NORMALIZED_TCO.csv", (row) => row.story_thread_ref === storyThreads[5] && row.supplier_id === "BPO-C" && row.recommendation_state === "recommended_after_normalization"),
      ],
      measures: ["headline_price", "normalized_five_year_tco", "transition_cost", "retained_org_cost", "risk_adjustment"],
      dimensions: ["supplier_id", "scenario", "year"],
      grain: "supplier_scenario_year",
      challenge: "BPO supplier choice after transition, retained organization, automation and risk normalization",
      cube: "consumption_sourcing_bpo",
      predicate: "normalized_tco_recommendation",
      evidenceTypes: ["transition", "pricing"],
      evidenceSubjectTerms: ["BPO", "normalized TCO", "transition"],
      joinKeys: ["supplier_id"],
    }),
    makeScenario({
      domain: "BPO supplier quality",
      story: storyThreads[5],
      files: ["BPO_SUPPLIER_RESPONSES.csv", "BPO_EVALUATION_SCORES.csv"],
      rows: (() => {
        const response = choose("BPO_SUPPLIER_RESPONSES.csv", (row) => row.story_thread_ref === storyThreads[5] && row.response_state !== "meets");
        const score = choose("BPO_EVALUATION_SCORES.csv", (row) => row.story_thread_ref === storyThreads[5] && row.supplier_id === response.supplier_id && row.requirement_id === response.requirement_id);
        return [response, score];
      })(),
      measures: ["automation_commitment", "score", "weighted_score"],
      dimensions: ["supplier_id", "requirement_id", "evaluator_role"],
      grain: "supplier_requirement_evaluator",
      challenge: "BPO suppliers that trade headline price for weaker scope, controls or automation commitments",
      cube: "consumption_sourcing_bpo",
      predicate: "supplier_quality_tradeoff",
      evidenceSubjectTerms: ["BPO", "supplier", "controls", "automation"],
      joinKeys: ["supplier_id", "requirement_id"],
    }),
    makeScenario({
      domain: "BPO clarification risk",
      story: storyThreads[5],
      files: ["BPO_CLARIFICATIONS.csv", "BPO_BAFO_RESPONSES.csv"],
      rows: (() => {
        const bafo = choose("BPO_BAFO_RESPONSES.csv", (row) => row.story_thread_ref === storyThreads[5] && row.bafo_exception_state === "exception_remains");
        const clarification = choose("BPO_CLARIFICATIONS.csv", (row) => row.story_thread_ref === storyThreads[5] && row.supplier_id === bafo.supplier_id && row.status === "open");
        return [clarification, bafo];
      })(),
      measures: ["bafo_service_fee", "bafo_exception_state"],
      dimensions: ["supplier_id", "requirement_id", "topic"],
      grain: "supplier_clarification_bafo",
      challenge: "BAFO exceptions that should block a lowest-price recommendation",
      cube: "consumption_sourcing_bpo",
      predicate: "bafo_exception",
      evidenceSubjectTerms: ["BPO", "supplier", "pricing"],
      joinKeys: ["supplier_id"],
    }),
    makeScenario({
      domain: "health plan analytics",
      story: storyThreads[6],
      files: ["CLARITY_CABOODLE_ASSET_INVENTORY.csv", "SQL_SERVER_DATA_MARTS.csv"],
      rows: [
        choose("CLARITY_CABOODLE_ASSET_INVENTORY.csv", (row) => row.story_thread_ref === storyThreads[6]),
        choose("SQL_SERVER_DATA_MARTS.csv", (row) => row.story_thread_ref === storyThreads[6] && row.redundancy_state === "overlap_with_sas_or_caboodle"),
      ],
      measures: ["reporting_domain", "redundancy_state"],
      dimensions: ["platform", "downstream_mart_id", "owner_function"],
      grain: "asset_mart_dependency",
      challenge: "health-plan analytics capabilities dependent on legacy marts or Epic data assets",
      cube: "source_data_platform",
      predicate: "legacy_dependency",
      evidenceSubjectTerms: ["health-plan analytics", "legacy", "Epic Caboodle"],
      joinKeys: ["downstream_mart_id"],
    }),
    makeScenario({
      domain: "legacy platform retirement",
      story: storyThreads[6],
      files: ["HADOOP_CLUSTER_WORKLOADS.csv", "SAS_APPLICATIONS_AND_USERS.csv"],
      rows: [
        choose("HADOOP_CLUSTER_WORKLOADS.csv", (row) => row.story_thread_ref === storyThreads[6] && row.retirement_dependency === "contract_scope_fee_reduction_not_linked"),
        choose("SAS_APPLICATIONS_AND_USERS.csv", (row) => row.story_thread_ref === storyThreads[6] && row.migration_state === "needs_decision"),
      ],
      measures: ["retirement_dependency", "active_user_count", "migration_state"],
      dimensions: ["cluster_ref", "application_ref", "usage_group"],
      grain: "legacy_platform_workload_month",
      challenge: "Hadoop or SAS workloads creating transition risk",
      cube: "source_data_platform",
      predicate: "legacy_dependency",
      evidenceSubjectTerms: ["legacy", "Hadoop", "SAS"],
      crossDomainRelationships: ["Hadoop workloads and SAS usage are separate legacy platform facts joined by the same modernization story thread for retirement sequencing."],
    }),
    makeScenario({
      domain: "cloud commitment readiness",
      story: storyThreads[6],
      files: ["AWS_TARGET_COMMITMENT_SCENARIOS.csv", "DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv"],
      rows: [
        choose("AWS_TARGET_COMMITMENT_SCENARIOS.csv", (row) => row.story_thread_ref === storyThreads[6] && Boolean(row.prerequisite_decision)),
        choose("DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv", (row) => row.story_thread_ref === storyThreads[6] && Boolean(row.prerequisite_decision)),
      ],
      measures: ["estimated_monthly_commitment", "estimated_dbu_commitment"],
      dimensions: ["scenario", "service_name", "workspace", "prerequisite_decision"],
      grain: "platform_commitment_scenario_month",
      challenge: "AWS or Databricks commitments waiting on prerequisite decisions",
      cube: "source_cloud_commitments",
      predicate: "cloud_prerequisite",
      evidenceSubjectTerms: ["AWS", "Databricks", "cloud"],
      crossDomainRelationships: ["AWS and Databricks commitment scenarios are paired by the same cloud decision story thread rather than a single source-system key."],
    }),
    makeScenario({
      domain: "architecture dependency",
      story: storyThreads[6],
      files: ["ANALYTICS_PLATFORM_DEPENDENCIES.csv", "PROGRAMS_INITIATIVES_DEPENDENCIES.csv"],
      rows: [
        choose("ANALYTICS_PLATFORM_DEPENDENCIES.csv", (row) => row.story_thread_ref === storyThreads[6] && row.decision_required === "true"),
        choose("PROGRAMS_INITIATIVES_DEPENDENCIES.csv", (row) => row.story_thread_ref === storyThreads[6] && Boolean(row.target_quarter)),
      ],
      measures: ["decision_required", "target_quarter"],
      dimensions: ["source_ref", "target_ref", "dependency_ref"],
      grain: "dependency_initiative",
      challenge: "architecture dependencies that sequence the transformation roadmap",
      cube: "source_architecture_dependencies",
      predicate: "architecture_sequence",
      evidenceSubjectTerms: ["architecture", "dependency", "roadmap"],
      crossDomainRelationships: ["Architecture dependencies and PMO dependencies are joined by the same roadmap sequencing decision thread."],
    }),
    makeScenario({
      domain: "risk control readiness",
      story: storyThreads[6],
      files: ["RISK_CONTROL_OBSERVATIONS.csv", "BPO_RFP_REQUIREMENTS.csv"],
      rows: [
        choose("RISK_CONTROL_OBSERVATIONS.csv", (row) => row.story_thread_ref === storyThreads[6] && row.observation_state === "gap_requires_validation"),
        choose("BPO_RFP_REQUIREMENTS.csv", (row) => row.story_thread_ref === storyThreads[5] && row.criticality === "must_have"),
      ],
      measures: ["observation_state", "criticality"],
      dimensions: ["risk_ref", "control_ref", "requirement_domain"],
      grain: "risk_control_requirement",
      challenge: "control gaps that must be resolved before BPO or platform decisions",
      cube: "source_risk_controls",
      predicate: "risk_control_gap",
      evidenceSubjectTerms: ["health-plan analytics", "cloud", "architecture"],
      crossDomainRelationships: ["BPO requirements are cross-domain control inputs for platform decision gating in this story thread."],
    }),
    makeScenario({
      domain: "vendor 360",
      story: storyThreads[0],
      files: ["WORKDAY_SUPPLIERS.csv", "CONTRACT_REGISTER.csv", "CONTRACT_SCOPE_RELATIONSHIPS.csv"],
      rows: [
        choose("WORKDAY_SUPPLIERS.csv", (row) => row.story_thread_ref === storyThreads[0] && row.vendor_id === "VND-001"),
        chooseContract("CONTRACT_REGISTER.csv", storyThreads[0], "CF-001"),
        chooseContract("CONTRACT_SCOPE_RELATIONSHIPS.csv", storyThreads[0], "CF-001", (row) => row.relationship_confidence === "inferred_requires_review"),
      ],
      measures: ["synthetic_midpoint_total_contract_value", "relationship_confidence"],
      dimensions: ["vendor_id", "contract_family_id", "business_service_ref"],
      grain: "vendor_contract_scope",
      challenge: "strategic vendors with ambiguous contract-to-service scope",
      cube: "source_vendor_360",
      predicate: "vendor_scope_ambiguity",
      evidenceTypes: ["scope"],
      evidenceSubjectTerms: ["managed-services", "scope"],
      joinKeys: ["vendor_id", "contract_family_id"],
    }),
    makeScenario({
      domain: "renewal leverage",
      story: storyThreads[1],
      files: ["CONTRACT_RENEWAL_EXIT_TERMS.csv", "CONTRACT_AMENDMENTS.csv"],
      rows: [
        chooseContract("CONTRACT_RENEWAL_EXIT_TERMS.csv", storyThreads[1], "CF-002", (row) => row.extracted_state === "partial_evidence"),
        chooseContract("CONTRACT_AMENDMENTS.csv", storyThreads[1], "CF-002", (row) => n(row.financial_effect) !== 0),
      ],
      measures: ["financial_effect", "extracted_state"],
      dimensions: ["contract_family_id", "clause_type", "amendment_theme"],
      grain: "contract_clause_amendment",
      challenge: "renewal or exit terms creating near-term leverage or risk",
      cube: "source_contract_economics",
      predicate: "renewal_leverage",
      evidenceTypes: ["renewal", "termination"],
      evidenceSubjectTerms: ["Epic", "renewal"],
      joinKeys: ["contract_family_id"],
    }),
    makeScenario({
      domain: "evidence lineage",
      story: storyThreads[0],
      files: ["EVIDENCE_SPANS.csv", "CONTRACT_INSTRUMENTS.csv"],
      rows: [
        choose("EVIDENCE_SPANS.csv", (row) => row.story_thread_ref === storyThreads[0] && row.contract_family_id === "CF-001" && row.review_state === "needs_audit_review"),
        chooseContract("CONTRACT_INSTRUMENTS.csv", storyThreads[0], "CF-001"),
      ],
      measures: ["extraction_confidence", "review_state"],
      dimensions: ["document_ref", "contract_family_id", "span_type"],
      grain: "document_page_span",
      challenge: "conclusions blocked by partial evidence or low extraction confidence",
      cube: "source_evidence_lineage",
      predicate: "evidence_blocker",
      evidenceSubjectTerms: ["managed-services", "contract economics"],
      joinKeys: ["document_ref", "contract_family_id"],
    }),
    makeScenario({
      domain: "purchase substitution",
      story: storyThreads[3],
      files: ["MEDSURG_BACKORDERS_SUBSTITUTIONS.csv", "LOCAL_HOSPITAL_PURCHASES.csv"],
      rows: (() => {
        const substitution = choose("MEDSURG_BACKORDERS_SUBSTITUTIONS.csv", (row) => row.story_thread_ref === storyThreads[3] && n(row.incremental_cost) > 0 && n(row.substitution_count) > 0);
        const purchase = choose("LOCAL_HOSPITAL_PURCHASES.csv", (row) => row.story_thread_ref === storyThreads[3] && row.facility === substitution.facility && row.item_id === substitution.item_id && n(row.unit_price) > 0);
        return [substitution, purchase];
      })(),
      measures: ["backorder_count", "substitution_count", "incremental_cost", "unit_price"],
      dimensions: ["facility", "item_id", "period_start"],
      grain: "facility_item_month",
      challenge: "substitutions increasing cost in fragmented local procurement",
      cube: "source_medsurg_procurement",
      predicate: "substitution_cost",
      evidenceSubjectTerms: ["Medical surgical", "substitution", "item"],
      joinKeys: ["facility", "item_id", "period_start"],
    }),
    makeScenario({
      domain: "service backlog",
      story: storyThreads[1],
      files: ["SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "SERVICENOW_MONTHLY_SLA_SUMMARY.csv"],
      rows: [
        chooseContract("SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", storyThreads[1], "CF-002", (row) => n(row.backlog_over_30_days) > 0),
        chooseContract("SERVICENOW_MONTHLY_SLA_SUMMARY.csv", storyThreads[1], "CF-002", (row) => n(row.breach_count) > 0),
      ],
      measures: ["backlog_count", "backlog_over_30_days", "actual_pct", "breach_count"],
      dimensions: ["contract_id", "service_ref", "period_start"],
      grain: "service_month",
      challenge: "vendor services with backlog aging above contractual targets",
      cube: "source_service_performance",
      predicate: "incident_or_backlog_pressure",
      evidenceTypes: ["sla"],
      evidenceSubjectTerms: ["Epic", "SLA"],
      joinKeys: ["contract_family_id", "service_ref", "period_start"],
    }),
    makeScenario({
      domain: "workforce pyramid",
      story: storyThreads[0],
      files: ["VENDOR_WORKFORCE_MONTHLY.csv", "CONTRACT_RATE_CARDS.csv"],
      rows: (() => {
        const workforce = chooseContract("VENDOR_WORKFORCE_MONTHLY.csv", storyThreads[0], "CF-001", (row) => n(row.billed_mix_pct) !== n(row.contracted_mix_pct));
        const rateCard = chooseContract("CONTRACT_RATE_CARDS.csv", storyThreads[0], "CF-001", (row) => row.role_title === workforce.role_title && row.location_model === workforce.location_model);
        return [workforce, rateCard];
      })(),
      measures: ["billed_fte", "contracted_mix_pct", "billed_mix_pct", "contracted_rate"],
      dimensions: ["contract_family_id", "role_title", "location_model"],
      grain: "role_location_month",
      challenge: "billed staffing mix diverging from the contracted pyramid",
      cube: "source_workforce_rate_card",
      predicate: "workforce_mix_variance",
      evidenceTypes: ["rate_card"],
      evidenceSubjectTerms: ["managed-services", "rate-card"],
      joinKeys: ["contract_family_id", "role_title", "location_model"],
    }),
    makeScenario({
      domain: "payments reconciliation",
      story: storyThreads[2],
      files: ["WORKDAY_PAYMENTS.csv", "WORKDAY_SUPPLIER_INVOICES.csv"],
      rows: (() => {
        const payment = choose("WORKDAY_PAYMENTS.csv", (row) => row.story_thread_ref === storyThreads[2] && row.vendor_id === "VND-003" && n(row.payment_amount) > 0);
        const invoice = chooseContract("WORKDAY_SUPPLIER_INVOICES.csv", storyThreads[2], "CF-003", (row) => row.invoice_id === payment.invoice_id && n(row.line_amount) > 0);
        return [payment, invoice];
      })(),
      measures: ["payment_amount", "line_amount"],
      dimensions: ["vendor_id", "invoice_id", "period_start"],
      grain: "invoice_payment",
      challenge: "payment and invoice totals needing reconciliation before finance conclusions",
      cube: "source_financial_reconciliation",
      predicate: "finance_reconciliation_gap",
      evidenceSubjectTerms: ["Workday", "invoice", "payment"],
      joinKeys: ["vendor_id", "invoice_id"],
    }),
    makeScenario({
      domain: "BPO current baseline",
      story: storyThreads[5],
      files: ["BPO_CURRENT_STATE_PROCESS_VOLUMES.csv", "BPO_CURRENT_STATE_COST_BASELINE.csv"],
      rows: [
        choose("BPO_CURRENT_STATE_PROCESS_VOLUMES.csv", (row) => row.story_thread_ref === storyThreads[5] && n(row.monthly_volume) > 0),
        choose("BPO_CURRENT_STATE_COST_BASELINE.csv", (row) => row.story_thread_ref === storyThreads[5] && n(row.labor_cost) > 0),
      ],
      measures: ["monthly_volume", "labor_cost", "technology_cost", "controls_cost"],
      dimensions: ["function_ref", "process_name", "period_start"],
      grain: "function_process_month",
      challenge: "current-state processes with the largest BPO baseline cost and volume exposure",
      cube: "consumption_sourcing_bpo",
      predicate: "bpo_baseline_exposure",
      evidenceSubjectTerms: ["BPO", "baseline"],
      joinKeys: ["function_ref", "period_start"],
    }),
    makeScenario({
      domain: "SaaS low usage",
      story: storyThreads[2],
      files: ["SAAS_MODULE_USAGE_MONTHLY.csv", "CONTRACT_REGISTER.csv"],
      rows: [
        choose("SAAS_MODULE_USAGE_MONTHLY.csv", (row) => row.story_thread_ref === storyThreads[2] && row.vendor_id === "VND-003" && row.low_usage_flag === "true"),
        chooseContract("CONTRACT_REGISTER.csv", storyThreads[2], "CF-003"),
      ],
      measures: ["entitled_users", "active_users", "low_usage_flag"],
      dimensions: ["vendor_id", "module_name", "period_start"],
      grain: "module_month",
      challenge: "licensed SaaS modules that should be challenged before renewal",
      cube: "source_saas_usage",
      predicate: "low_utilization",
      evidenceSubjectTerms: ["Workday", "module usage"],
      joinKeys: ["vendor_id"],
    }),
    makeScenario({
      domain: "program sequencing",
      story: storyThreads[6],
      files: ["PROGRAMS_INITIATIVES_DEPENDENCIES.csv", "AWS_TARGET_COMMITMENT_SCENARIOS.csv"],
      rows: [
        choose("PROGRAMS_INITIATIVES_DEPENDENCIES.csv", (row) => row.story_thread_ref === storyThreads[6] && Boolean(row.target_quarter)),
        choose("AWS_TARGET_COMMITMENT_SCENARIOS.csv", (row) => row.story_thread_ref === storyThreads[6] && Boolean(row.prerequisite_decision)),
      ],
      measures: ["target_quarter", "estimated_monthly_commitment"],
      dimensions: ["program_ref", "initiative_ref", "prerequisite_decision"],
      grain: "initiative_platform_scenario",
      challenge: "roadmap decisions that must precede cloud commitment approval",
      cube: "source_program_roadmap",
      predicate: "architecture_sequence",
      evidenceSubjectTerms: ["cloud", "architecture", "dependency"],
      crossDomainRelationships: ["PMO initiative dependencies and cloud commitment scenarios are joined by prerequisite decision context in the roadmap story thread."],
    }),
    makeScenario({
      domain: "quality guardrail",
      story: storyThreads[6],
      files: ["RISK_CONTROL_OBSERVATIONS.csv", "EVIDENCE_SPANS.csv"],
      rows: [
        choose("RISK_CONTROL_OBSERVATIONS.csv", (row) => row.story_thread_ref === storyThreads[6] && row.observation_state === "gap_requires_validation"),
        choose("EVIDENCE_SPANS.csv", (row) => row.story_thread_ref === storyThreads[6] && row.review_state === "needs_audit_review"),
      ],
      measures: ["observation_state", "extraction_confidence"],
      dimensions: ["domain", "risk_ref", "span_type"],
      grain: "risk_evidence",
      challenge: "risk guardrails lacking evidence strong enough for executive claims",
      cube: "source_risk_evidence",
      predicate: "evidence_blocker",
      evidenceSubjectTerms: ["health-plan analytics", "cloud", "risk"],
      crossDomainRelationships: ["Risk observations and evidence spans are joined by the same audit guardrail story thread."],
    }),
    makeScenario({
      domain: "contract document completeness",
      story: storyThreads[0],
      files: ["CONTRACT_INSTRUMENTS.csv", "EVIDENCE_SPANS.csv"],
      rows: (() => {
        const evidence = choose("EVIDENCE_SPANS.csv", (row) => row.story_thread_ref === storyThreads[0] && row.contract_family_id === "CF-001" && row.review_state === "audit_ready" && row.evidence_state !== "document_unavailable_context_only");
        const instrument = chooseContract("CONTRACT_INSTRUMENTS.csv", storyThreads[0], "CF-001", (row) => row.document_ref === evidence.document_ref);
        return [instrument, evidence];
      })(),
      measures: ["extraction_confidence", "review_state"],
      dimensions: ["instrument_type", "document_ref", "contract_family_id"],
      grain: "instrument_evidence",
      challenge: "contract instruments with enough evidence for pricing, SLA and exit analysis",
      cube: "source_evidence_lineage",
      predicate: "document_complete",
      evidenceSubjectTerms: ["managed-services", "contract economics"],
      joinKeys: ["document_ref", "contract_family_id"],
    }),
    makeScenario({
      domain: "supplier invitation coverage",
      story: storyThreads[5],
      files: ["BPO_SUPPLIERS.csv", "BPO_RFP_REQUIREMENTS.csv"],
      rows: [
        choose("BPO_SUPPLIERS.csv", (row) => row.story_thread_ref === storyThreads[5] && row.supplier_id === "BPO-C"),
        choose("BPO_RFP_REQUIREMENTS.csv", (row) => row.story_thread_ref === storyThreads[5] && row.criticality === "must_have"),
      ],
      measures: ["headline_price_rank", "normalized_recommendation_rank", "criticality"],
      dimensions: ["supplier_id", "requirement_domain"],
      grain: "supplier_requirement",
      challenge: "invited suppliers covering critical BPO requirements",
      cube: "consumption_sourcing_bpo",
      predicate: "supplier_requirement_coverage",
      evidenceSubjectTerms: ["BPO", "supplier"],
      crossDomainRelationships: ["Supplier invitations and RFP requirements define event coverage together even though one row is supplier-grain and the other is requirement-grain."],
    }),
  ];
  const angleTemplates = [
    { label: "executive_decision", make: (scenario) => `Which executive decision follows from the planted evidence on ${scenario.challenge}?`, action: "set the decision owner and next evidence request", visual: "table" },
    { label: "evidence_gap", make: (scenario) => `What evidence gap could change the decision on ${scenario.challenge}?`, action: "withhold the claim until evidence is complete", visual: "evidence_drawer" },
    { label: "trend_or_variance", make: (scenario) => `What trend or variance in the source rows should leaders investigate for ${scenario.challenge}?`, action: "prioritize reconciliation or remediation", visual: "time_series" },
    { label: "commercial_leverage", make: (scenario) => `Where does the cited source evidence create negotiation leverage for ${scenario.challenge}?`, action: "prepare supplier challenge or negotiation", visual: "waterfall" },
    { label: "risk_guardrail", make: (scenario) => `Which risk guardrail constrains the recommended action on ${scenario.challenge}?`, action: "escalate the guardrail before recommendation", visual: "heatmap" },
    { label: "cube_drill", make: (scenario) => `How should a Cube drill prove or disprove the finding on ${scenario.challenge}?`, action: "drill to tenant-scoped source rows and evidence", visual: "funnel" },
  ];
  const questions = [];
  const coverage = [];
  for (const scenario of scenarios) {
    for (const angle of angleTemplates) {
      const index = questions.length;
      const qidFixed = `PHS-HQ-${pad(index + 1, 3)}`;
    questions.push({
      question_id: qidFixed,
      domain: scenario.domain,
      question: angle.make(scenario),
      executive_intent: `Use ${scenario.domain} evidence to ${angle.action}.`,
      expected_answer: `Answer must cite ${scenario.files.join(", ")} records ${scenario.records.join(", ")} and evidence ${scenario.evidence_ref}.`,
      required_source_domains: Array.from(new Set(scenario.files.map((file) => file.replace(/\.csv$/u, "").toLowerCase()))),
      required_measures: scenario.measures,
      required_dimensions: scenario.dimensions,
      required_grain: scenario.grain,
      required_relationship: "Tenant -> dataset -> source file -> planted source_record_id -> evidence_ref -> decision.",
      required_history: scenario.grain.includes("month") ? "24 months where source is monthly" : "current snapshot with source lineage",
      required_evidence_depth: { min_source_domains: Math.min(2, scenario.files.length), min_source_records: scenario.records.length, evidence_tier: scenario.story.includes("bpo") ? "tier_1_full_evidence" : "source_or_selected_evidence" },
      expected_visualization: angle.visual,
      expected_cube_drill_path: ["tenant_key", "dataset_id", ...scenario.dimensions.slice(0, 3)],
      allowed_conclusion: "May identify exposure, opportunity, risk, evidence gap or next action as synthetic demo analysis.",
      prohibited_overstatement: "Must not call an estimate verified, realized, live-proven or production-active without Phase B evidence.",
      expected_action: angle.action,
      acceptance_rule: `Pass if planted records satisfy predicate ${scenario.predicate} and align to the mapped evidence.`,
      story_thread_ref: scenario.story,
      question_predicate: scenario.predicate,
      planted_source_join_keys: scenario.join_keys,
      expected_evidence_subject_terms: scenario.evidence_subject_terms,
    });
    coverage.push({
      question_id: qidFixed,
      required_source_files: scenario.files,
      required_columns: Array.from(new Set(["tenant_key", "dataset_id", "source_record_id", "story_thread_ref", ...scenario.measures, ...scenario.dimensions])),
      planted_scenario_records: scenario.records,
      evidence_refs: [scenario.evidence_ref],
      expected_evidence_span_types: [scenario.evidence_type],
      expected_evidence_subject_terms: scenario.evidence_subject_terms,
      planted_source_join_keys: scenario.join_keys,
      question_predicate: scenario.predicate,
      cross_domain_relationships: [
        ...scenario.cross_domain_relationships,
        ...(scenario.story === storyThreads[6] && scenario.files.includes("BPO_RFP_REQUIREMENTS.csv") ? ["BPO_RFP_REQUIREMENTS.csv is cross-domain control evidence for platform/BPO decision gating."] : []),
      ],
      cube_view: scenario.cube,
      drill_members: ["tenant_key", "dataset_id", ...scenario.dimensions.slice(0, 4)],
      expected_answer: "Tenant-scoped, evidence-cited, audit-only answer.",
      evidence_requirement: "Mapped source files, planted records, semantic predicates, story threads and evidence refs must resolve.",
      required_measures: scenario.measures,
      required_dimensions: scenario.dimensions,
      story_thread_ref: scenario.story,
    });
    }
  }
  if (questions.length !== 180) {
    throw new Error(`hard question bank expected 180 questions, got ${questions.length}`);
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

function evidenceSubjectFor(contract, spanType) {
  if (contract[5] === storyThreads[5]) {
    return `Back-office BPO sourcing ${spanType} evidence for supplier scope, controls, transition, retained organization, pricing and normalized TCO.`;
  }
  if (contract[5] === storyThreads[6]) {
    return `Health-plan analytics and cloud ${spanType} evidence for AWS, Databricks, legacy Hadoop, SAS, Epic Caboodle and architecture dependency decisions.`;
  }
  if (contract[5] === storyThreads[3]) {
    return `Medical surgical procurement ${spanType} evidence for facility, item, category, price-tier, rebate and substitution analysis.`;
  }
  if (contract[5] === storyThreads[1]) {
    return `Epic operational performance ${spanType} evidence for service scope, interface responsibility, SLA and renewal review.`;
  }
  if (contract[5] === storyThreads[2]) {
    return `Workday SaaS and finance ${spanType} evidence for supplier, invoice, payment, module usage and BPO dependency review.`;
  }
  if (contract[5] === storyThreads[4]) {
    return `Facilities EVS ${spanType} evidence for service-level performance, penalties and unclaimed service credits.`;
  }
  return `Analytics managed-services ${spanType} evidence for rate-card, SLA, scope, invoice and contract economics review.`;
}

function buildEvidenceRows() {
  const rows = [];
  for (let i = 0; i < 16_000; i += 1) {
    const contract = i % 7 === 5
      ? ["", "Back-Office BPO Sourcing Event", "", 0, "tier_1_full_evidence", storyThreads[5]]
      : contractFamilies[i % contractFamilies.length];
    const spanType = pick(["pricing", "rate_card", "sla", "renewal", "termination", "scope", "security", "transition"]);
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
      span_type: spanType,
      evidence_subject: evidenceSubjectFor(contract, spanType),
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

  const fieldGuidance = buildWorkbookFieldGuidance(fileRows);
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
  await writeJson(path.join(stageDir, "phs_healthcare_demo_enterprise_outcomes_kpi_map.json"), {
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    discovery_model: "four_week_lightweight_discovery",
    record_count: outcomeRows.length,
    rows: outcomeRows,
  });
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

  const { questionBank, coverageMatrix } = buildQuestionBank(fileRows);
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
    "phs_healthcare_demo_enterprise_outcomes_kpi_map.json",
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
    proof_zip_sha256_attestation: `PHS_Healthcare_Demo_Audit_Proof_${timestamp}.zip.sha256`,
    downloads,
    manifest_counts: manifest.counts,
    validation_ok: validation.ok,
  });
  const proofZip = path.join(outDir, `PHS_Healthcare_Demo_Audit_Proof_${timestamp}.zip`);
  await zipDir(stageDir, proofZip);
  const proofSha = await sha256File(proofZip);
  const proofShaPath = `${proofZip}.sha256`;
  await writeText(proofShaPath, `${proofSha}  ${path.basename(proofZip)}\n`);
  console.log(JSON.stringify({
    stage_dir: stageDir,
    proof_zip: proofZip,
    proof_zip_sha256: proofSha,
    proof_zip_sha256_attestation: proofShaPath,
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

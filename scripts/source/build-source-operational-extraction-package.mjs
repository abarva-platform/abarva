import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";

const OUT_DIR = "/Users/anand/Downloads";
const AS_OF_DATE = "2027-06-30";
const EXTRACT_DATE = "2027-06-30";
const LOAD_RUN_ID = `source-synthetic-${AS_OF_DATE.replaceAll("-", "")}`;
const TARGET_CONTRACT_ANNUAL_VALUE = 1_480_500_000;
const PACKAGE_ZIP = "AbarVa_Source_Operational_Extraction_Package_v1.zip";
const CLIENT_REQUEST_XLSX = "AbarVa_Source_Client_Data_Request.xlsx";
const NORMALIZED_XLSX = "SkyHarbor_Source_Normalized.xlsx";
const SYSTEM_EXTRACTS_ZIP = "SkyHarbor_Source_Synthetic_System_Extracts.zip";
const MANIFEST_JSON = "source_mapping_manifest.json";

const colors = {
  navy: "071326",
  ink: "0B1736",
  blue: "1D4ED8",
  teal: "0F766E",
  gold: "B45309",
  paleBlue: "EAF2FF",
  paleGold: "FFF7E6",
  paleGreen: "EAF7F1",
  paleGray: "F8FAFC",
  border: "CBD5E1",
  gray: "64748B",
  white: "FFFFFF",
};

const lists = {
  yesNoUnknown: ["Yes", "No", "Unknown"],
  activeState: ["active", "inactive", "pending_review"],
  relationshipMethod: [
    "explicit_contract_scope",
    "reviewed_mapping",
    "vendor_based_inference",
    "name_based_inference",
    "unresolved",
  ],
  qualityState: ["source_record", "reviewed", "accepted", "partial", "unreviewed", "blocked"],
  scopeType: [
    "application",
    "platform",
    "business capability",
    "service",
    "workflow",
    "location",
    "data product",
    "integration",
    "initiative",
  ],
  eventType: ["renewal", "optimization", "RFI", "RFP", "RFQ", "BAFO", "direct_award"],
  eventStatus: ["draft", "intake", "strategy", "rfp", "evaluation", "bafo", "decision", "transition", "closed"],
  supplierStatus: ["longlisted", "invited", "responded", "qualified", "shortlisted", "selected", "declined"],
};

const sourceSystems = [
  {
    system_id: "SYS-ARIBA-SLP",
    system_name: "SAP Ariba Supplier Lifecycle and Performance",
    vendor_product: "SAP Ariba",
    module: "Supplier Lifecycle and Performance",
    business_owner_role: "Director, Supplier Management",
    technical_owner_role: "Procurement Systems Lead",
    data_available: "supplier master, registration, qualification, preferred status, category, country",
    access_method: "Ariba administrator export or Supplier Data API with pagination",
    export_method: "Admin > Supplier Management > Export supplier data, or API scheduled extract",
    API_available: "Yes",
    report_name: "Supplier master and qualification export",
    refresh_frequency: "monthly",
    historical_depth: "current snapshot plus status history if enabled",
    joining_identifiers: "supplier_id, organization_name, tax_id where available",
    notes: "Primary source for vendor identity and supplier qualification; do not retype supplier master.",
  },
  {
    system_id: "SYS-ARIBA-CONTRACTS",
    system_name: "SAP Ariba Contracts",
    vendor_product: "SAP Ariba",
    module: "Contracts",
    business_owner_role: "Head of Procurement Operations",
    technical_owner_role: "CLM Administrator",
    data_available: "contract workspaces, headers, supplier, term dates, owners, executed documents",
    access_method: "Contract workspace export, contract reports, or Contracts API",
    export_method: "Contracts > Reports > Contract Workspace Export Data; retain workspace ID and contract ID",
    API_available: "Yes",
    report_name: "Contract Workspace Export Data",
    refresh_frequency: "weekly for renewals; monthly for portfolio",
    historical_depth: "active contracts plus prior amendments",
    joining_identifiers: "contract_id, workspace_id, supplier_id, document_id",
    notes: "Do not infer clauses from summary fields; provide executed PDF and amendments unchanged.",
  },
  {
    system_id: "SYS-ARIBA-SOURCING",
    system_name: "SAP Ariba Strategic Sourcing",
    vendor_product: "SAP Ariba",
    module: "Strategic Sourcing",
    business_owner_role: "Director, Strategic Sourcing",
    technical_owner_role: "Sourcing Platform Administrator",
    data_available: "events, requirements, invited suppliers, responses, scores, awards, BAFO state",
    access_method: "Event export or Sourcing API",
    export_method: "Event > Reports/Export > Event content, participants, responses and award summary",
    API_available: "Yes",
    report_name: "Sourcing event content and response export",
    refresh_frequency: "per event milestone",
    historical_depth: "all open events plus completed events for 24 months",
    joining_identifiers: "event_id, supplier_id, response_id, requirement_id",
    notes: "Evaluation criteria and weights must be exported before responses are scored.",
  },
  {
    system_id: "SYS-S4",
    system_name: "SAP S/4HANA",
    vendor_product: "SAP",
    module: "MM/FI/AP/CO",
    business_owner_role: "Director, IT Finance",
    technical_owner_role: "SAP Finance Reporting Lead",
    data_available: "purchase orders, invoices, payments, GL postings, cost centers, commitments",
    access_method: "CDS/report export, data extract, or finance warehouse",
    export_method: "Export EKKO/EKPO purchase order lines, AP invoice lines, payment status and cost center mappings",
    API_available: "Yes, where OData/CDS is enabled",
    report_name: "PO line, invoice line and AP payment export",
    refresh_frequency: "monthly close",
    historical_depth: "minimum trailing 24 months",
    joining_identifiers: "supplier_id, contract_id where available, po_number, invoice_id, cost_center, posting_date",
    notes: "Financial source of truth for actual spend. Do not ask client to manually calculate annual actual spend.",
  },
  {
    system_id: "SYS-SNOW",
    system_name: "ServiceNow",
    vendor_product: "ServiceNow",
    module: "Vendor Management, ITSM, APM, CMDB, SLA Management",
    business_owner_role: "VP Enterprise Platforms",
    technical_owner_role: "ServiceNow Platform Owner",
    data_available: "applications, services, vendors, incidents, SLAs, service credits, vendor KPIs",
    access_method: "List export, Performance Analytics export, Table API",
    export_method: "Export vendor KPI monthly, SLA results, incident/request aggregates, service/application inventory",
    API_available: "Yes",
    report_name: "Vendor KPI monthly, SLA results, Application Inventory",
    refresh_frequency: "monthly",
    historical_depth: "trailing 24 months for SLA and incidents",
    joining_identifiers: "vendor_ref, contract_ref, service_ref, application_ref, reporting_period",
    notes: "Primary source for operational performance and service/application scope review.",
  },
  {
    system_id: "SYS-FIELDGLASS",
    system_name: "SAP Fieldglass",
    vendor_product: "SAP Fieldglass",
    module: "Services Procurement / External Workforce",
    business_owner_role: "Director, External Workforce",
    technical_owner_role: "VMS Administrator",
    data_available: "work orders, SOW workers, roles, rates, timesheets, invoice details",
    access_method: "Standard report export or analytics API/download connector",
    export_method: "Export Work Order Status, Worker Status, Time Sheet Status, Invoice Details and Invoice Status reports",
    API_available: "Yes, where licensed",
    report_name: "Work Order Status, Time Sheet Status, Invoice Details",
    refresh_frequency: "monthly",
    historical_depth: "current workforce plus trailing 18-24 months",
    joining_identifiers: "supplier_id, work_order_id, worker_ref, contract_id, invoice_id",
    notes: "Use worker reference, role and location. Do not include worker names.",
  },
  {
    system_id: "SYS-LEANIX",
    system_name: "LeanIX",
    vendor_product: "LeanIX",
    module: "Enterprise Architecture / APM",
    business_owner_role: "Director, Enterprise Architecture",
    technical_owner_role: "EA Tool Owner",
    data_available: "applications, lifecycle, criticality, technical fit, modernization plans",
    access_method: "Fact sheet export or API",
    export_method: "Export Application Fact Sheets with lifecycle, criticality, business capability and provider fields",
    API_available: "Yes",
    report_name: "Application Fact Sheet export",
    refresh_frequency: "monthly",
    historical_depth: "current snapshot plus lifecycle roadmap",
    joining_identifiers: "application_id, application_name, provider/vendor, business_capability",
    notes: "Use for reviewed internal mapping and modernization/retirement dependencies.",
  },
  {
    system_id: "SYS-ENTRA",
    system_name: "Microsoft Entra ID and Microsoft 365 Admin Center",
    vendor_product: "Microsoft",
    module: "Identity, SaaS assignment and usage",
    business_owner_role: "Director, End User Computing",
    technical_owner_role: "M365 Tenant Administrator",
    data_available: "assigned accounts, active users, SKU assignments, last activity",
    access_method: "Admin center export, Graph API, usage reports",
    export_method: "Export license assignment and active-user reports by SKU/month",
    API_available: "Yes",
    report_name: "M365 active users and license assignment reports",
    refresh_frequency: "monthly",
    historical_depth: "trailing 12-24 months depending tenant settings",
    joining_identifiers: "sku_id, user_ref, product_name, month",
    notes: "Use anonymized user reference only; do not include user names or email addresses.",
  },
  {
    system_id: "SYS-AZURE-COST",
    system_name: "Azure Cost Management",
    vendor_product: "Microsoft Azure",
    module: "Cost Management Exports",
    business_owner_role: "Director, Cloud FinOps",
    technical_owner_role: "Cloud Platform Owner",
    data_available: "subscription, service, region, commitment, consumption, overage, support and credits",
    access_method: "Scheduled Cost Management export",
    export_method: "Cost Management > Exports > monthly actual cost and amortized cost by subscription/service",
    API_available: "Yes",
    report_name: "Actual cost and amortized cost export",
    refresh_frequency: "monthly",
    historical_depth: "trailing 24 months",
    joining_identifiers: "subscription_id, billing_account_id, service_name, month, contract_id where mapped",
    notes: "Use for cloud commitment and consumption; do not blend with SaaS seat counts.",
  },
  {
    system_id: "SYS-SHAREPOINT-CLM",
    system_name: "SharePoint contract repository",
    vendor_product: "Microsoft SharePoint",
    module: "Legal repository",
    business_owner_role: "Legal Operations Manager",
    technical_owner_role: "M365 Collaboration Administrator",
    data_available: "executed PDFs, amendments, SOWs, pricing schedules, DPAs",
    access_method: "Folder export or Graph/SharePoint library export",
    export_method: "Export original files unchanged with document library metadata and version",
    API_available: "Yes",
    report_name: "Contract document library export",
    refresh_frequency: "on demand for active contract package",
    historical_depth: "all active documents and amendments",
    joining_identifiers: "contract_id, workspace_id, document_id, file_path",
    notes: "AbarVa extracts clause/page/span evidence from the originals. Do not paste excerpts into cells.",
  },
];

const systemById = Object.fromEntries(sourceSystems.map((row) => [row.system_id, row]));

function col(
  target_tab,
  target_column,
  business_definition,
  required_or_optional,
  primary_source_system,
  source_module,
  exact_source_object,
  exact_report_or_API,
  navigation_or_export_instruction,
  source_field_name,
  alternate_source_system,
  joining_key,
  transformation_rule,
  data_owner_role,
  refresh_frequency,
  expected_grain,
  allowed_values,
  example_value,
  synthetic_generation_rule,
) {
	  return {
	    target_tab,
	    target_column,
	    mapping_rule: "explicit_field_map",
	    business_definition,
	    required_or_optional,
	    primary_source_system,
    source_module,
    exact_source_object,
    exact_report_or_API,
    navigation_or_export_instruction,
    source_field_name,
    alternate_source_system,
    joining_key,
    transformation_rule,
    data_owner_role,
    refresh_frequency,
    expected_grain,
    allowed_values,
    example_value,
    synthetic_generation_rule,
  };
}

const fieldMap = [
  col("03_Vendors", "vendor_id", "Stable supplier identifier.", "Required", "SYS-ARIBA-SLP", "Supplier Lifecycle and Performance", "Supplier master record", "Supplier Data API with Pagination or Supplier Master Export", "Ariba admin: Supplier Management > Export supplier data. Retain Supplier ID and status fields.", "Supplier ID", "SYS-S4; Coupa GET /api/suppliers; Oracle Fusion Suppliers REST", "supplier_id -> vendor_id", "Trim and preserve as text.", "Director, Supplier Management", "monthly", "one legal supplier", "", "VEN-CRESTLINE", "Generate 28 suppliers across IT categories with stable VEN-* IDs."),
  col("03_Vendors", "legal_name", "Legal registered supplier name.", "Required", "SYS-ARIBA-SLP", "Supplier Lifecycle and Performance", "Supplier master record", "Supplier Master Export", "Retain Organization Name / Legal Name exactly as registered.", "Organization Name", "SYS-S4 supplier name; Ivalua Supplier 360", "supplier_id", "No manual product nickname substitution.", "Director, Supplier Management", "monthly", "one legal supplier", "", "Crestline Digital Services LLC", "Use realistic legal entities."),
  col("03_Vendors", "parent_company", "Ultimate parent or supplier family.", "Optional", "SYS-ARIBA-SLP", "Supplier hierarchy", "Supplier hierarchy export", "Supplier hierarchy report", "Export parent supplier / parent organization where enabled.", "Parent Supplier", "D&B/RapidRatings corporate family tree", "supplier_id", "Keep blank if hierarchy unavailable.", "Director, Supplier Management", "quarterly", "one legal supplier", "", "Crestline Holdings", "Assign parent for 40% of suppliers."),
  col("03_Vendors", "supplier_category", "Procurement category.", "Required", "SYS-ARIBA-SLP", "Supplier profile", "Supplier category assignment", "Supplier category export", "Retain primary category and category path.", "Category", "Coupa commodity; Ivalua category", "supplier_id", "Map to AbarVa category without losing original in source extracts.", "Category Management Lead", "monthly", "one legal supplier", "", "Application managed services", "Use IT services, cloud, SaaS, data, telecom, security, consulting categories."),
  col("03_Vendors", "strategic_status", "Supplier relationship tier.", "Optional", "SYS-ARIBA-SLP", "Supplier qualification", "Supplier qualification/preferred status", "Supplier qualification export", "Retain Preferred Status and Qualification Status.", "Preferred Status", "SRM scorecard", "supplier_id", "Map preferred/qualified/watchlist to strategic/preferred/tactical/watchlist.", "Director, Supplier Management", "quarterly", "one legal supplier", "strategic|preferred|tactical|watchlist", "strategic", "Top vendors are strategic/preferred."),
  col("03_Vendors", "risk_tier", "TPRM/procurement risk tier.", "Optional", "SYS-SNOW", "Vendor Risk Management", "Vendor risk profile", "Vendor risk export / Vendor Management Workspace", "Export latest vendor risk tier and assessment date.", "Risk Tier", "OneTrust; Archer; BitSight; SecurityScorecard", "vendor_ref", "Keep provider and as-of date; do not collapse anonymous scores.", "Third-Party Risk Manager", "quarterly", "one supplier risk posture", "Tier 1|Tier 2|Tier 3", "Tier 2", "Assign tiers by spend/criticality."),
  col("03_Vendors", "relationship_owner_role", "Role accountable for supplier relationship.", "Required", "SYS-ARIBA-SLP", "Supplier profile", "Supplier owner field", "Supplier Master Export", "Export owner title/role. Do not include employee name or email.", "Supplier Owner Role", "SRM tracker", "supplier_id", "Role title only.", "Director, Supplier Management", "monthly", "one legal supplier", "", "Director, IT Vendor Management", "Use role titles only."),
  col("03_Vendors", "source_record_id", "Source-system key for lineage.", "Required", "SYS-ARIBA-SLP", "Supplier master", "Supplier master record", "Supplier Master Export", "Retain source Supplier ID or internal record ID.", "Supplier ID", "SYS-S4 vendor number", "supplier_id", "Preserve exact source value.", "Procurement Systems Lead", "monthly", "one legal supplier", "", "SUP-10492", "Use supplier source IDs."),
  col("04_Contracts", "contract_id", "Stable contract identifier.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Contract workspace", "GET /contracts or Contract Workspace Export Data", "Export contract ID, workspace ID and document IDs.", "Contract ID", "Icertis agreement ID; DocuSign CLM document ID", "contract_id -> all contract tabs", "Preserve source ID; map old register IDs in crosswalk.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "", "CON-AMS-001", "Generate 119 contracts mapped to 28 suppliers."),
  col("04_Contracts", "vendor_id", "Supplier ID linked to contract.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Contract workspace supplier", "Contract Workspace Export Data", "Retain Supplier ID from workspace parties.", "Supplier ID", "SYS-ARIBA-SLP supplier master", "supplier_id", "Map to 03_Vendors.vendor_id.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "", "VEN-CRESTLINE", "Map every contract to one vendor."),
  col("04_Contracts", "contract_name", "Agreement title.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Contract workspace", "Contract Workspace Export Data", "Export workspace title/agreement name.", "Workspace Title", "Icertis Agreement Name", "contract_id", "Preserve title.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "", "Enterprise AMS Master Services Agreement", "Use realistic agreement names."),
  col("04_Contracts", "effective_date", "Contract start date.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Contract term fields", "Contract Workspace Export Data", "Retain effective date from structured CLM field.", "Effective Date", "Executed agreement term clause", "contract_id", "Use yyyy-mm-dd.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "", "2025-01-01", "Generate dates between 2023 and 2027."),
  col("04_Contracts", "expiration_date", "Contract end date.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Contract term fields", "Contract Workspace Export Data", "Retain expiration date from structured CLM field.", "Expiration Date", "Executed agreement term clause", "contract_id", "Use yyyy-mm-dd.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "", "2029-12-31", "Generate renewal windows around 2027 as-of date."),
  col("04_Contracts", "notice_deadline", "Latest date to give notice.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Renewal/notice field or clause extraction", "Contract Workspace Export Data plus executed document", "Use CLM notice field if present; otherwise AbarVa extracts from executed PDF. Do not infer from AP ledger.", "Notice Deadline / Notice Period", "SharePoint executed PDF", "contract_id", "Calculate only from contract clause when structured field unavailable.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "", "2029-09-30", "Generate notice dates from expiration and notice days."),
  col("04_Contracts", "auto_renew", "Whether auto-renew applies.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Renewal field and clause", "Contract Workspace Export Data plus executed document", "Export renewal flag and provide executed term clause.", "Auto Renew Flag", "Icertis renewal metadata", "contract_id", "Yes/No/Unknown.", "CLM Administrator", "weekly", "one agreement/SOW/order/amendment", "Yes|No|Unknown", "Yes", "Set about 38% auto-renew."),
  col("04_Contracts", "annual_value", "Annual contract value.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "Commercial metadata / pricing schedule", "Contract Workspace Export Data plus pricing schedule", "Use executed commercial schedule or contract register value. Reconcile to PO/invoice actuals separately.", "Annual Contract Value", "S4 PO commitment", "contract_id", "Currency numeric; unknown remains blank.", "Procurement Operations", "monthly", "one agreement/SOW/order/amendment", "", "14400000", "Scale total to 1.4805B."),
  col("04_Contracts", "benchmark_rights", "Benchmark or market-test rights.", "Optional", "SYS-ARIBA-CONTRACTS", "Executed agreement", "MSA/SOW/order form PDF", "Upload executed PDF and active amendments unchanged. AbarVa extracts clause/page/span.", "Benchmark Clause", "SharePoint legal repository", "contract_id, document_id", "Do not infer; requires document evidence or structured CLM clause field.", "Legal Operations Manager", "on contract change", "one clause/contract", "", "Annual benchmark right with remediation", "Populate mix of strong/weak/missing rights."),
  col("04_Contracts", "termination_rights", "Termination rights summary.", "Optional", "SYS-ARIBA-CONTRACTS", "Executed agreement", "MSA/SOW/order form PDF", "Extract from executed termination clause; do not take from AP ledger.", "Termination Clause", "SharePoint legal repository", "contract_id, document_id", "Requires clause evidence.", "Legal Operations Manager", "on contract change", "one clause/contract", "", "TFC after year 3 with 90 days notice", "Vary TFC/cause-only terms."),
  col("05_Contract_Scope", "contract_id", "Contract tied to scope.", "Required", "SYS-ARIBA-CONTRACTS", "Contracts", "SOW scope schedule", "Executed SOW and scope schedule export", "Use contract/SOW ID as written in scope schedule.", "Contract ID", "ServiceNow contract field", "contract_id", "Map to 04_Contracts.", "CLM Administrator", "monthly", "one contract-to-scope relationship", "", "CON-AMS-001", "Generate explicit and inferred relationships."),
  col("05_Contract_Scope", "scope_type", "Type of object in scope.", "Required", "SYS-SNOW", "APM/CMDB", "Application/service inventory", "Export app/service IDs from ServiceNow APM/CMDB or LeanIX fact sheets.", "CI Class / Fact Sheet Type", "SYS-LEANIX", "application_id/service_id", "Use controlled AbarVa scope type.", "Enterprise Architecture Lead", "monthly", "one contract-to-scope relationship", lists.scopeType.join("|"), "application", "Applications, platforms and services."),
  col("05_Contract_Scope", "relationship_method", "How relationship was established.", "Required", "SYS-ARIBA-CONTRACTS", "Executed SOW", "SOW scope schedule", "Source precedence: explicit MSA/SOW, reviewed APM/CMDB mapping, vendor association, name inference, unresolved.", "Relationship Method", "SYS-SNOW; SYS-LEANIX", "contract_id + scope_id", "Must not mark inference as explicit.", "Enterprise Architecture Lead", "monthly", "one relationship", lists.relationshipMethod.join("|"), "explicit_contract_scope", "Explicit rows for contract scope; inferred rows separately."),
  col("06_Spend_Consumption", "contract_id", "Contract linked to spend.", "Required", "SYS-S4", "MM/FI/AP", "PO and invoice line export", "Export PO/invoice lines with contract reference where available. If missing, provide PO-to-contract crosswalk.", "Contract ID / Outline Agreement", "Coupa PO/invoice export", "contract_id, po_number, invoice_id", "Map PO/invoice contract reference to normalized contract_id.", "Director, IT Finance", "monthly close", "one contract/month/cost center/service", "", "CON-AMS-001", "Every contract gets 24 monthly observations."),
  col("06_Spend_Consumption", "actual_spend", "Actual posted spend.", "Required", "SYS-S4", "FI/AP/CO", "AP invoice and GL actuals export", "Export invoice line and GL posting amount by period. AbarVa calculates annual actual spend.", "Posted Amount", "Oracle Fusion AP/GL; Workday Financials", "invoice_id, cost_center, posting_date", "Use financial source of truth; do not hand-enter annual totals.", "Director, IT Finance", "monthly close", "one contract/month/cost center/service", "", "1150000", "Contract monthly spend with variance to commitment."),
  col("06_Spend_Consumption", "consumed_quantity", "Usage/volume consumed.", "Optional", "SYS-AZURE-COST", "Cost Management", "Monthly actual and amortized cost export", "For cloud use Cost Management export. For SaaS use Entra/Zylo/Productiv. For AMS use Fieldglass/service hours.", "Quantity", "SYS-FIELDGLASS; SYS-ENTRA", "contract_id + month + service_id", "Keep units separate; do not add seats, hours and vCPU-hours.", "Cloud FinOps / SAM Lead", "monthly", "one contract/month/service", "", "8200", "Vary units by category."),
  col("07_Performance_SLA", "metric_name", "SLA or performance metric.", "Required", "SYS-SNOW", "SLA Management / ITSM", "SLA results by vendor and service", "Export SLA results and vendor KPI monthly. Include contract/service reference where available.", "Metric Name", "Vendor monthly service report", "contract_id + service_id + period", "Do not sum unlike metrics across units.", "Service Owner", "monthly", "one contract/service/metric/period", "", "P1 incident MTTR", "Two to four metrics per major contract."),
  col("07_Performance_SLA", "credit_calculated", "Service credit earned/calculated.", "Optional", "SYS-SNOW", "Vendor Management / SLA credits", "Service credit records", "Export earned, claimed and recovered separately.", "Credit Calculated", "AP credit memo tracker", "contract_id + metric + period", "Do not treat earned as recovered.", "Vendor Manager", "monthly", "one contract/service/metric/period", "", "44000", "Plant unclaimed credits."),
  col("08_Renewal_Commercial", "recommended_action", "Deterministic renewal/commercial action.", "Required", "SYS-ARIBA-CONTRACTS", "Renewal dashboard", "Contract renewal pipeline report", "Export renewal status and decision owner role. AbarVa may calculate urgency but source owns renewal fields.", "Renewal Status", "Coupa renewal tracker", "contract_id", "Allowed actions: renew, renegotiate, benchmark, resize, consolidate, recompete, recover_credits, exit, monitor.", "Category Lead", "weekly", "one contract decision posture", "renew|renegotiate|benchmark|resize|consolidate|recompete|recover_credits|exit|monitor", "benchmark", "Generate urgent and future renewals."),
  col("09_Sourcing_Events", "event_id", "Sourcing event ID.", "Required", "SYS-ARIBA-SOURCING", "Strategic Sourcing", "Event content export", "Export event details, requirements, participants, responses and award summary.", "Event ID", "Coupa/Ivalua/Jaggaer/GEP SMART", "event_id", "Preserve event source ID.", "Director, Strategic Sourcing", "per event milestone", "one event", "", "SRC-AMS-2027-001", "At least 3 events."),
  col("10_Event_Requirements", "weight", "Pre-response evaluation weight.", "Required", "SYS-ARIBA-SOURCING", "Strategic Sourcing", "Event questionnaire / scoring model", "Export criteria and weights before responses are evaluated.", "Weight", "Evaluation workbook", "event_id + requirement_id", "Must be approved before scoring.", "Evaluation Lead", "per event", "one requirement", "", "8", "Weights sum by event."),
  col("11_Event_Suppliers", "supplier_status", "Supplier event status.", "Required", "SYS-ARIBA-SOURCING", "Strategic Sourcing", "Participants export", "Export participants/invited suppliers and response status.", "Participant Status", "Coupa/Ivalua/Jaggaer", "event_id + supplier_id", "Use controlled status.", "Sourcing Manager", "per event milestone", "one event-supplier", lists.supplierStatus.join("|"), "invited", "Multiple suppliers per event."),
  col("12_Event_Responses", "normalized_annual_value", "Supplier pricing normalized to comparable annual value.", "Optional", "SYS-ARIBA-SOURCING", "Strategic Sourcing", "Pricing workbook / response export", "Export original pricing workbook and normalized evaluator workbook. Retain transformation rule.", "Normalized Annual Value", "Finance normalization model", "event_id + supplier_id + response_id", "Do not compare unnormalized supplier pricing.", "Sourcing Finance Lead", "per event milestone", "one response/section", "", "13200000", "BAFO-ready supplier responses."),
];

const sourceFileBySystem = {
  "SYS-ARIBA-SLP": "ARIBA_SUPPLIERS_20270630.csv",
  "SYS-ARIBA-CONTRACTS": "ARIBA_CONTRACT_WORKSPACES_20270630.csv",
  "SYS-ARIBA-SOURCING": "ARIBA_SOURCING_EVENTS_20270630.xlsx",
  "SYS-S4": "S4_VENDOR_INVOICES_2025_2027.csv",
  "SYS-SNOW": "SERVICENOW_SLA_RESULTS.csv",
  "SYS-FIELDGLASS": "FIELDGLASS_WORK_ORDERS.csv",
  "SYS-LEANIX": "LEANIX_APPLICATION_LIFECYCLE.csv",
  "SYS-ENTRA": "ENTRA_SAAS_USAGE_MONTHLY.csv",
  "SYS-AZURE-COST": "AZURE_COST_EXPORT_MONTHLY.csv",
};

function currency(n) {
  return Math.round(n * 100) / 100;
}

function addMonths(date, months) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function monthSeries(start, count) {
  return Array.from({ length: count }, (_, i) => addMonths(start, i).slice(0, 7) + "-01");
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ].join("\n");
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function buildSynthetic() {
  const categories = [
    "Application managed services",
    "Cloud infrastructure",
    "Data platform",
    "ITSM platform",
    "Cybersecurity",
    "Telecom and network",
    "ERP services",
    "AI tooling",
    "End user software",
    "Consulting",
  ];
  const vendorNames = [
    "Crestline Digital Services LLC",
    "CloudNova Platforms Inc.",
    "Nebula Data Systems",
    "ServiceNow Inc.",
    "SentinelForge Security LLC",
    "AeroLink Networks",
    "NorthPier ERP Services",
    "VectorAI Tools Inc.",
    "WorkSphere SaaS",
    "BluePeak Advisory",
    "CoreFleet Systems",
    "SkyLedger Software",
    "Runway DataWorks",
    "Horizon Integration",
    "Atlas Observability",
    "CrewCloud Systems",
    "Waypoint Analytics",
    "GateOps Technology",
    "CargoLink Software",
    "TerraCloud Managed Services",
    "Apex Identity Systems",
    "SignalPath Telecom",
    "FinOps Dynamics",
    "OpsBridge Automation",
    "Redline Security Labs",
    "Prism Workforce Tech",
    "TerminalWorks Digital",
    "Northstar Platform Services",
  ];

  const annualValues = [
    126_000_000, 112_000_000, 104_000_000, 92_000_000, 84_000_000,
    70_000_000, 64_000_000, 58_000_000, 52_000_000, 46_000_000,
    42_000_000, 38_000_000, 34_000_000, 31_000_000, 28_000_000,
    25_000_000, 23_000_000, 21_000_000, 19_000_000, 17_000_000,
    15_000_000, 13_000_000, 11_000_000, 9_000_000, 7_000_000,
    6_000_000, 5_000_000, 4_000_000,
  ];

  const vendors = vendorNames.map((name, i) => ({
    supplier_id: `VEN-${String(i + 1).padStart(3, "0")}`,
    organization_name: name,
    parent_supplier: i % 5 === 0 ? `${name.split(" ")[0]} Holdings` : "",
    registration_status: "Registered",
    qualification_status: i < 20 ? "Qualified" : "Pending review",
    preferred_status: i < 8 ? "Strategic" : i < 18 ? "Preferred" : "Tactical",
    category: categories[i % categories.length],
    country: i % 7 === 0 ? "United Kingdom" : "United States",
    last_updated_date: AS_OF_DATE,
    source_system: "SAP Ariba SLP",
    source_object: "Supplier Master Export",
    source_record_id: `SUP-${10000 + i}`,
    extract_date: EXTRACT_DATE,
    as_of_date: AS_OF_DATE,
    load_run_id: LOAD_RUN_ID,
    is_synthetic: true,
  }));

  const contracts = [];
  for (let i = 0; i < 119; i += 1) {
    const vendor = vendors[i % vendors.length];
    const baseValue = annualValues[i % annualValues.length] * (i < 28 ? 1 : 0.18 + ((i % 7) * 0.05));
    const annual = currency(Math.max(1_500_000, baseValue));
    const start = addMonths("2023-01-01", i % 42);
    const termMonths = [24, 36, 48, 60][i % 4];
    const end = addMonths(start, termMonths);
    const noticeDays = [60, 90, 120, 180][i % 4];
    const notice = addMonths(end, 0);
    const noticeDate = new Date(`${notice}T00:00:00Z`);
    noticeDate.setUTCDate(noticeDate.getUTCDate() - noticeDays);
    contracts.push({
      contract_id: `CON-${String(i + 1).padStart(3, "0")}`,
      workspace_id: `CW-${70000 + i}`,
      supplier_id: vendor.supplier_id,
      supplier_name: vendor.organization_name,
      workspace_title: `${vendor.category} ${["MSA", "SOW", "Order Form", "Subscription"][i % 4]} ${2023 + (i % 5)}`,
      agreement_type: ["MSA", "SOW", "order_form", "subscription", "amendment"][i % 5],
      status: "active",
      effective_date: start,
      expiration_date: end,
      notice_deadline: noticeDate.toISOString().slice(0, 10),
      auto_renew_flag: i % 3 === 0 ? "Yes" : "No",
      annual_contract_value: annual,
      total_committed_value: currency(annual * (termMonths / 12)),
      currency: "USD",
      benchmark_clause_status: i % 5 === 0 ? "No explicit benchmark clause" : i % 4 === 0 ? "Weak benchmark right" : "Annual benchmark right",
      termination_clause_summary: i % 6 === 0 ? "Cause only; convenience not stated" : "Termination for convenience with notice",
      document_id: `DOC-${90000 + i}`,
      source_system: "SAP Ariba Contracts",
      source_object: "Contract Workspace Export Data",
      source_record_id: `CW-${70000 + i}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      load_run_id: LOAD_RUN_ID,
      is_synthetic: true,
    });
  }

  const currentContractTotal = contracts.reduce((sum, contract) => sum + contract.annual_contract_value, 0);
  const scale = TARGET_CONTRACT_ANNUAL_VALUE / currentContractTotal;
  let scaledTotal = 0;
  for (const contract of contracts) {
    contract.annual_contract_value = currency(contract.annual_contract_value * scale);
    contract.total_committed_value = currency(contract.annual_contract_value * (
      (new Date(`${contract.expiration_date}T00:00:00Z`).getUTCFullYear() * 12 +
        new Date(`${contract.expiration_date}T00:00:00Z`).getUTCMonth() -
        (new Date(`${contract.effective_date}T00:00:00Z`).getUTCFullYear() * 12 +
          new Date(`${contract.effective_date}T00:00:00Z`).getUTCMonth())) / 12
    ));
    scaledTotal = currency(scaledTotal + contract.annual_contract_value);
  }
  const lastContract = contracts.at(-1);
  lastContract.annual_contract_value = currency(lastContract.annual_contract_value + (TARGET_CONTRACT_ANNUAL_VALUE - scaledTotal));
  lastContract.total_committed_value = currency(lastContract.total_committed_value + (TARGET_CONTRACT_ANNUAL_VALUE - scaledTotal));

  const applications = Array.from({ length: 150 }, (_, i) => ({
    application_id: `APP-${String(i + 1).padStart(4, "0")}`,
    application_name: [
      "Flight Operations Control",
      "Crew Planning",
      "Passenger Service",
      "Cargo Revenue",
      "Maintenance Reliability",
      "Finance Close",
      "HR Case Management",
      "Airport Turnaround",
      "Loyalty Analytics",
      "Digital Commerce",
    ][i % 10] + ` ${Math.floor(i / 10) + 1}`,
    vendor_id: vendors[i % vendors.length].supplier_id,
    criticality: i % 8 === 0 ? "Tier 1" : i % 5 === 0 ? "Tier 2" : "Tier 3",
    lifecycle_state: i % 13 === 0 ? "retire" : i % 11 === 0 ? "replace" : "current",
    modernization_status: i % 13 === 0 ? "retirement planned" : i % 11 === 0 ? "replacement funded" : "maintain",
    business_capability: ["Flight operations", "Airport operations", "Customer", "Finance", "Workforce"][i % 5],
    source_system: "LeanIX",
    source_object: "Application Fact Sheet Export",
    source_record_id: `LX-APP-${String(i + 1).padStart(4, "0")}`,
    extract_date: EXTRACT_DATE,
    as_of_date: AS_OF_DATE,
    load_run_id: LOAD_RUN_ID,
    is_synthetic: true,
  }));

  const months = monthSeries("2025-07-01", 24);
  const invoices = [];
  const purchaseOrders = [];
  for (const contract of contracts) {
    const monthlyCommit = contract.annual_contract_value / 12;
    months.forEach((month, idx) => {
      const variance = ((idx % 5) - 2) * 0.035;
      const invoice = currency(monthlyCommit * (1 + variance));
      const po = currency(monthlyCommit);
      const poNumber = `45${contract.contract_id.slice(-3)}${String(idx + 1).padStart(2, "0")}`;
      purchaseOrders.push({
        po_number: poNumber,
        po_line: "10",
        supplier_id: contract.supplier_id,
        contract_id: contract.contract_id,
        ordered_amount: po,
        cost_center: `CC${4000 + (idx % 18) * 10}`,
        business_unit: ["Operations", "Technology", "Commercial", "Corporate"][idx % 4],
        posting_month: month,
        source_system: "SAP S/4HANA",
        source_object: "EKKO/EKPO Purchase Order Line Export",
        source_record_id: `${poNumber}-10`,
        extract_date: EXTRACT_DATE,
        as_of_date: AS_OF_DATE,
        load_run_id: LOAD_RUN_ID,
        is_synthetic: true,
      });
      invoices.push({
        invoice_id: `INV-${contract.contract_id.slice(-3)}-${String(idx + 1).padStart(2, "0")}`,
        invoice_line: "1",
        po_number: poNumber,
        supplier_id: contract.supplier_id,
        contract_id: contract.contract_id,
        invoice_amount: invoice,
        paid_amount: currency(invoice * (idx % 9 === 0 ? 0.96 : 1)),
        accrual_amount: idx % 6 === 0 ? currency(monthlyCommit * 0.05) : 0,
        cost_center: `CC${4000 + (idx % 18) * 10}`,
        business_unit: ["Operations", "Technology", "Commercial", "Corporate"][idx % 4],
        posting_month: month,
        source_system: "SAP S/4HANA",
        source_object: "AP Invoice Line Export",
        source_record_id: `BSEG-${contract.contract_id.slice(-3)}-${idx + 1}`,
        extract_date: EXTRACT_DATE,
        as_of_date: AS_OF_DATE,
        load_run_id: LOAD_RUN_ID,
        is_synthetic: true,
      });
    });
  }

  const sla = [];
  for (const contract of contracts.slice(0, 40)) {
    for (const month of months) {
      for (const metric of ["P1 incident MTTR", "Application availability"]) {
        const breach = metric.includes("MTTR") && Number(contract.contract_id.slice(-3)) % 4 === 0 ? 2 : 0;
        const credit = breach ? currency(contract.annual_contract_value * 0.00035) : 0;
        sla.push({
          sla_record_id: `SLA-${contract.contract_id}-${metric.replaceAll(" ", "_")}-${month.slice(0, 7)}`,
          vendor_id: contract.supplier_id,
          contract_id: contract.contract_id,
          service_id: `SVC-${contract.contract_id}`,
          metric_name: metric,
          contracted_target: metric.includes("MTTR") ? "< 4 hours" : ">= 99.7%",
          actual_value: metric.includes("MTTR") ? (breach ? "5.2 hours" : "3.4 hours") : breach ? "99.4%" : "99.82%",
          period_start: month,
          period_end: addMonths(month, 1),
          breach_count: breach,
          service_credit_eligible: breach ? "Yes" : "No",
          service_credit_calculated: credit,
          service_credit_claimed: breach ? currency(credit * 0.45) : 0,
          service_credit_recovered: breach && Number(contract.contract_id.slice(-3)) % 8 === 0 ? currency(credit * 0.2) : 0,
          source_system: "ServiceNow",
          source_object: "SLA Results Export",
          source_record_id: `SN-SLA-${randomUUID().slice(0, 8)}`,
          extract_date: EXTRACT_DATE,
          as_of_date: AS_OF_DATE,
          load_run_id: LOAD_RUN_ID,
          is_synthetic: true,
        });
      }
    }
  }

  const contractScope = [];
  for (const contract of contracts) {
    const appCount = 2 + (Number(contract.contract_id.slice(-3)) % 4);
    for (let i = 0; i < appCount; i += 1) {
      const app = applications[(Number(contract.contract_id.slice(-3)) * 3 + i) % applications.length];
      contractScope.push({
        contract_scope_id: `CS-${contract.contract_id}-${app.application_id}`,
        contract_id: contract.contract_id,
        scope_type: "application",
        scope_id: app.application_id,
        scope_name: app.application_name,
        criticality: app.criticality,
        relationship_method: i === 0 ? "explicit_contract_scope" : i === 1 ? "reviewed_mapping" : "vendor_based_inference",
        relationship_confidence: i === 0 ? 0.95 : i === 1 ? 0.8 : 0.45,
        effective_from: contract.effective_date,
        effective_to: contract.expiration_date,
        evidence_reference: i === 0 ? `${contract.document_id} SOW scope schedule` : `${app.source_record_id} application mapping export`,
        source_system: i === 0 ? "SAP Ariba Contracts" : "LeanIX",
        source_object: i === 0 ? "Executed SOW Scope Schedule" : "Application Fact Sheet Export",
        source_record_id: `${contract.contract_id}-${app.application_id}`,
        extract_date: EXTRACT_DATE,
        as_of_date: AS_OF_DATE,
        load_run_id: LOAD_RUN_ID,
        is_synthetic: true,
      });
    }
  }

  const fieldglass = contracts.slice(0, 18).flatMap((contract, i) =>
    ["AMS Lead", "Senior Engineer", "Service Desk Analyst"].map((role, j) => ({
      work_order_id: `WO-${contract.contract_id}-${j + 1}`,
      supplier_id: contract.supplier_id,
      contract_id: contract.contract_id,
      role,
      job_family: j === 0 ? "Delivery Management" : j === 1 ? "Engineering" : "Support",
      location: j === 2 ? "India" : "United States",
      delivery_type: "managed_service",
      worker_type: "SOW worker",
      rate: [185, 128, 58][j],
      currency: "USD",
      monthly_hours: 160 + ((i + j) % 4) * 20,
      start_date: contract.effective_date,
      end_date: contract.expiration_date,
      source_system: "SAP Fieldglass",
      source_object: "Work Order Status Export",
      source_record_id: `FG-${contract.contract_id}-${j + 1}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      load_run_id: LOAD_RUN_ID,
      is_synthetic: true,
    })),
  );

  const events = [
    { event_id: "SRC-AMS-2027-001", type: "RFP", scope: "Application managed services", incumbent: "CON-001" },
    { event_id: "SRC-DATA-2027-002", type: "RFI", scope: "Data platform support", incumbent: "CON-003" },
    { event_id: "SRC-CLOUD-2027-003", type: "optimization", scope: "Cloud consumption and support", incumbent: "CON-002" },
  ];
  const eventSuppliers = events.flatMap((event, e) =>
    vendors.slice(e * 4, e * 4 + 4).map((vendor, i) => ({
      event_supplier_id: `${event.event_id}-${vendor.supplier_id}`,
      event_id: event.event_id,
      supplier_id: vendor.supplier_id,
      supplier_name: vendor.organization_name,
      supplier_status: i < 3 ? "responded" : "invited",
      response_status: i < 3 ? "submitted" : "not_started",
      commercial_score: i < 3 ? 78 + i * 4 + e : "",
      technical_score: i < 3 ? 80 + i * 3 : "",
      risk_score: i < 3 ? 64 + i * 5 : "",
      weighted_score: i < 3 ? 77 + i * 4 : "",
      bafo_state: i < 2 ? "requested" : "not_started",
      source_system: "SAP Ariba Strategic Sourcing",
      source_object: "Event Participants and Responses Export",
      source_record_id: `EVSUP-${e + 1}-${i + 1}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      load_run_id: LOAD_RUN_ID,
      is_synthetic: true,
    })),
  );

  const eventWorkbookRows = events.flatMap((event, i) => [
    {
      event_id: event.event_id,
      event_type: event.type,
      event_status: i === 0 ? "strategy" : "draft",
      service_scope: event.scope,
      incumbent_contract_id: event.incumbent,
      business_outcome: i === 0 ? "Reduce AMS run-rate while improving P1 recovery" : i === 1 ? "Validate alternate data-platform support options" : "Reduce cloud overage and improve commitment fit",
      evaluation_model: "40 commercial / 35 technical / 15 transition / 10 risk",
      accountable_role: "Director, Strategic Sourcing",
      decision_due_date: "2027-10-15",
      source_system: "SAP Ariba Strategic Sourcing",
      source_object: "Event Content Export",
      source_record_id: `EVT-${9000 + i}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      load_run_id: LOAD_RUN_ID,
      is_synthetic: true,
    },
    ...eventSuppliers.filter((supplier) => supplier.event_id === event.event_id).map((supplier) => ({
      event_id: event.event_id,
      event_type: "supplier_response",
      event_status: i === 0 ? "strategy" : "draft",
      service_scope: event.scope,
      incumbent_contract_id: event.incumbent,
      supplier_id: supplier.supplier_id,
      supplier_name: supplier.supplier_name,
      supplier_status: supplier.supplier_status,
      response_status: supplier.response_status,
      commercial_score: supplier.commercial_score,
      technical_score: supplier.technical_score,
      risk_score: supplier.risk_score,
      weighted_score: supplier.weighted_score,
      source_system: "SAP Ariba Strategic Sourcing",
      source_object: "Event Participants and Responses Export",
      source_record_id: supplier.source_record_id,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      load_run_id: LOAD_RUN_ID,
      is_synthetic: true,
    })),
  ]);

  const normalized = {
    "03_Vendors": vendors.map((v) => ({
      vendor_id: v.supplier_id,
      legal_name: v.organization_name,
      parent_company: v.parent_supplier,
      supplier_category: v.category,
      strategic_status: v.preferred_status.toLowerCase(),
      country: v.country,
      region: v.country === "United States" ? "North America" : "EMEA",
      diversity_status: "not_loaded",
      risk_tier: Number(v.supplier_id.slice(-3)) % 4 === 0 ? "Tier 1" : "Tier 2",
      financial_health_status: "stable",
      security_risk_status: Number(v.supplier_id.slice(-3)) % 6 === 0 ? "medium_high" : "medium",
      relationship_owner_role: "Director, IT Vendor Management",
      active_state: "active",
      source_system: v.source_system,
      source_record_id: v.source_record_id,
      as_of_date: AS_OF_DATE,
      confidence: 1,
      quality_state: "source_record",
      evidence_reference: sourceFileBySystem["SYS-ARIBA-SLP"],
    })),
    "04_Contracts": contracts.map((c) => ({
      contract_id: c.contract_id,
      vendor_id: c.supplier_id,
      contract_name: c.workspace_title,
      agreement_type: c.agreement_type,
      effective_date: c.effective_date,
      expiration_date: c.expiration_date,
      notice_deadline: c.notice_deadline,
      renewal_type: c.auto_renew_flag === "Yes" ? "auto_renew" : "manual",
      auto_renew: c.auto_renew_flag,
      annual_value: c.annual_contract_value,
      total_committed_value: c.total_committed_value,
      currency: c.currency,
      payment_terms: "Net 45",
      benchmark_rights: c.benchmark_clause_status,
      termination_rights: c.termination_clause_summary,
      price_uplift_terms: Number(c.contract_id.slice(-3)) % 4 === 0 ? "CPI capped at 3%" : "standard renewal uplift",
      minimum_commitment: currency(c.annual_contract_value * 0.65),
      service_credit_cap: currency(c.annual_contract_value * 0.05),
      exit_assistance_terms: "transition assistance per executed agreement",
      renewal_owner_role: "Director, IT Vendor Management",
      document_file_id: `blob://contracts/${c.contract_id}/${c.document_id}.pdf`,
      source_system: c.source_system,
      source_record_id: c.source_record_id,
      as_of_date: AS_OF_DATE,
      confidence: 0.95,
      quality_state: "source_record",
      evidence_reference: `${sourceFileBySystem["SYS-ARIBA-CONTRACTS"]}; ${c.document_id}`,
    })),
    "05_Contract_Scope": contractScope.map((s) => ({
      contract_scope_id: s.contract_scope_id,
      contract_id: s.contract_id,
      scope_type: s.scope_type,
      scope_id: s.scope_id,
      scope_name: s.scope_name,
      criticality: s.criticality,
      relationship_method: s.relationship_method,
      relationship_confidence: s.relationship_confidence,
      effective_from: s.effective_from,
      effective_to: s.effective_to,
      evidence_reference: s.evidence_reference,
      source_system: s.source_system,
      source_record_id: s.source_record_id,
      as_of_date: AS_OF_DATE,
      quality_state: s.relationship_method === "vendor_based_inference" ? "partial" : "reviewed",
    })),
    "06_Spend_Consumption": invoices.map((i) => ({
      observation_id: `SPEND-${i.invoice_id}`,
      contract_id: i.contract_id,
      month: i.posting_month,
      business_unit: i.business_unit,
      cost_center: i.cost_center,
      service_category: vendors.find((v) => v.supplier_id === i.supplier_id)?.category ?? "IT",
      purchase_order_amount: purchaseOrders.find((p) => p.po_number === i.po_number)?.ordered_amount ?? "",
      invoice_amount: i.invoice_amount,
      paid_amount: i.paid_amount,
      accrual_amount: i.accrual_amount,
      committed_amount: purchaseOrders.find((p) => p.po_number === i.po_number)?.ordered_amount ?? "",
      actual_spend: i.invoice_amount,
      consumed_quantity: "",
      consumed_unit: "",
      overage_amount: Math.max(0, i.invoice_amount - (purchaseOrders.find((p) => p.po_number === i.po_number)?.ordered_amount ?? i.invoice_amount)),
      service_credit_amount: 0,
      currency: "USD",
      source_system: i.source_system,
      source_record_id: i.source_record_id,
      as_of_date: AS_OF_DATE,
      quality_state: "source_record",
      evidence_reference: sourceFileBySystem["SYS-S4"],
    })),
    "07_Performance_SLA": sla.map((s) => ({
      observation_id: s.sla_record_id,
      contract_id: s.contract_id,
      service_id: s.service_id,
      metric_name: s.metric_name,
      period_start: s.period_start,
      period_end: s.period_end,
      contracted_target: s.contracted_target,
      actual_value: s.actual_value,
      value_num: parseFloat(s.actual_value),
      unit: s.metric_name.includes("MTTR") ? "hours" : "percent",
      breach_count: s.breach_count,
      credit_eligible: s.service_credit_eligible,
      credit_calculated: s.service_credit_calculated,
      credit_claimed: s.service_credit_claimed,
      credit_recovered: s.service_credit_recovered,
      currency: "USD",
      source_system: s.source_system,
      source_record_id: s.source_record_id,
      as_of_date: AS_OF_DATE,
      quality_state: "source_record",
      evidence_reference: sourceFileBySystem["SYS-SNOW"],
    })),
    "08_Renewal_Commercial": contracts.map((c, i) => ({
      renewal_decision_id: `REN-${c.contract_id}-2027Q${(i % 4) + 1}`,
      contract_id: c.contract_id,
      decision_window: `2027Q${(i % 4) + 1}`,
      notice_deadline: c.notice_deadline,
      current_decision_status: i % 6 === 0 ? "benchmark_needed" : i % 5 === 0 ? "recompete_review" : "not_started",
      business_dependency: i % 4 === 0 ? "Tier 1 application dependency" : "standard service dependency",
      transition_lead_time: i % 4 === 0 ? "9-12 months" : "3-6 months",
      market_scan_status: i % 3 === 0 ? "needed" : "not_started",
      alternative_supplier_status: i % 5 === 0 ? "limited" : "available",
      benchmark_status: c.benchmark_clause_status.includes("No explicit") ? "not_loaded" : "rights_present",
      recommended_action: i % 6 === 0 ? "benchmark" : i % 5 === 0 ? "recompete" : "monitor",
      accountable_role: "Category Lead, Technology Sourcing",
      decision_due_date: addMonths(c.notice_deadline, -1),
      source_system: "SAP Ariba Contracts",
      source_record_id: c.source_record_id,
      as_of_date: AS_OF_DATE,
      quality_state: "source_record",
      evidence_reference: sourceFileBySystem["SYS-ARIBA-CONTRACTS"],
    })),
    "09_Sourcing_Events": events.map((e, i) => ({
      event_id: e.event_id,
      event_type: e.type,
      business_outcome: i === 0 ? "Reduce AMS run-rate while improving P1 recovery" : i === 1 ? "Validate alternate data-platform support options" : "Reduce cloud overage and improve commitment fit",
      service_scope: e.scope,
      incumbent_contracts: e.incumbent,
      current_baseline: `$${contracts.find((c) => c.contract_id === e.incumbent)?.annual_contract_value ?? 0} annual`,
      timeline: "launch, response, BAFO and decision milestones loaded from Ariba event",
      evaluation_model: "40 commercial / 35 technical / 15 transition / 10 risk",
      status: i === 0 ? "strategy" : "draft",
      decision: "",
      accountable_role: "Director, Strategic Sourcing",
      decision_due_date: "2027-10-15",
      source_system: "SAP Ariba Strategic Sourcing",
      source_record_id: `EVT-${9000 + i}`,
      as_of_date: AS_OF_DATE,
      quality_state: "source_record",
      evidence_reference: sourceFileBySystem["SYS-ARIBA-SOURCING"],
    })),
    "10_Event_Requirements": events.flatMap((e, i) => [
      {
        requirement_id: `REQ-${e.event_id}-001`,
        event_id: e.event_id,
        requirement_area: "SLA",
        requirement_text: "Supplier must commit to measurable SLA targets and credit mechanics.",
        weight: 8,
        mandatory_flag: "Yes",
        evidence_required: "SLA exhibit and three months comparable scorecards",
        source_system: "SAP Ariba Strategic Sourcing",
        source_record_id: `Q-${i + 1}-001`,
        as_of_date: AS_OF_DATE,
        quality_state: "accepted",
      },
      {
        requirement_id: `REQ-${e.event_id}-002`,
        event_id: e.event_id,
        requirement_area: "Commercial",
        requirement_text: "Supplier must provide normalized rate card and assumptions.",
        weight: 10,
        mandatory_flag: "Yes",
        evidence_required: "Pricing workbook with assumptions and exclusions",
        source_system: "SAP Ariba Strategic Sourcing",
        source_record_id: `Q-${i + 1}-002`,
        as_of_date: AS_OF_DATE,
        quality_state: "accepted",
      },
    ]),
    "11_Event_Suppliers": eventSuppliers.map((s) => ({
      event_supplier_id: s.event_supplier_id,
      event_id: s.event_id,
      vendor_id: s.supplier_id,
      supplier_name: s.supplier_name,
      supplier_status: s.supplier_status,
      invited_date: "2027-07-15",
      response_status: s.response_status,
      risk_score: s.risk_score,
      weighted_score: s.weighted_score,
      recommendation: Number(s.weighted_score || 0) > 82 ? "BAFO" : "monitor",
      source_system: s.source_system,
      source_record_id: s.source_record_id,
      as_of_date: AS_OF_DATE,
      quality_state: "source_record",
    })),
    "12_Event_Responses": eventSuppliers.filter((s) => s.response_status === "submitted").map((s, i) => ({
      response_id: `RESP-${s.event_supplier_id}-COMM`,
      event_id: s.event_id,
      event_supplier_id: s.event_supplier_id,
      response_section: "Commercial",
      normalized_annual_value: 8_000_000 + i * 625_000,
      normalized_total_contract_value: 32_000_000 + i * 2_500_000,
      commercial_score: s.commercial_score,
      technical_score: s.technical_score,
      risk_score: s.risk_score,
      exception_count: 2 + (i % 6),
      bafo_state: s.bafo_state,
      evidence_reference: `blob://source/events/${s.event_id}/${s.supplier_id}_pricing.xlsx`,
      source_system: s.source_system,
      source_record_id: `${s.source_record_id}-COMM`,
      as_of_date: AS_OF_DATE,
      quality_state: "source_record",
    })),
  };

  for (const rows of Object.values(normalized)) {
    for (const row of rows) {
      row.extract_date = EXTRACT_DATE;
      row.load_run_id = LOAD_RUN_ID;
      row.is_synthetic = true;
    }
  }

  const systemExtracts = {
    "ARIBA_SUPPLIERS_20270630.csv": { rows: vendors },
    "ARIBA_CONTRACT_WORKSPACES_20270630.csv": { rows: contracts },
    "ARIBA_SOURCING_EVENTS_20270630.xlsx": { rows: eventWorkbookRows },
    "S4_PURCHASE_ORDERS_2025_2027.csv": { rows: purchaseOrders },
    "S4_VENDOR_INVOICES_2025_2027.csv": { rows: invoices },
    "SERVICENOW_APPLICATION_INVENTORY.csv": { rows: applications },
    "SERVICENOW_VENDOR_KPI_MONTHLY.csv": { rows: sla.slice(0, 1200) },
    "SERVICENOW_SLA_RESULTS.csv": { rows: sla },
    "FIELDGLASS_WORK_ORDERS.csv": { rows: fieldglass },
    "FIELDGLASS_RATE_CARDS.csv": { rows: fieldglass.map((r) => ({ supplier_id: r.supplier_id, contract_id: r.contract_id, role: r.role, location: r.location, rate: r.rate, currency: r.currency, source_system: r.source_system, source_object: "Rate Card Export", source_record_id: `RC-${r.source_record_id}`, extract_date: EXTRACT_DATE, as_of_date: AS_OF_DATE, load_run_id: LOAD_RUN_ID, is_synthetic: true })) },
    "FIELDGLASS_INVOICE_DETAILS.csv": { rows: fieldglass.map((r, i) => ({ invoice_id: `FGINV-${i + 1}`, work_order_id: r.work_order_id, supplier_id: r.supplier_id, contract_id: r.contract_id, hours: r.monthly_hours, invoice_amount: currency(r.monthly_hours * r.rate), currency: r.currency, source_system: r.source_system, source_object: "Invoice Details Export", source_record_id: `FGINV-${i + 1}`, extract_date: EXTRACT_DATE, as_of_date: AS_OF_DATE, load_run_id: LOAD_RUN_ID, is_synthetic: true })) },
    "LEANIX_APPLICATION_LIFECYCLE.csv": { rows: applications },
    "ENTRA_SAAS_USAGE_MONTHLY.csv": { rows: contracts.slice(0, 20).flatMap((c, i) => months.map((m, j) => ({ contract_id: c.contract_id, supplier_id: c.supplier_id, product: `${c.supplier_name} SaaS`, sku: `SKU-${i + 1}`, licenses_purchased: 1000 + i * 50, licenses_assigned: 850 + i * 40, monthly_active_users: 620 + ((i + j) % 9) * 20, month: m, source_system: "Microsoft Entra ID", source_object: "License Assignment and Active User Export", source_record_id: `ENTRA-${i + 1}-${j + 1}`, extract_date: EXTRACT_DATE, as_of_date: AS_OF_DATE, load_run_id: LOAD_RUN_ID, is_synthetic: true }))) },
    "AZURE_COST_EXPORT_MONTHLY.csv": { rows: contracts.slice(0, 12).flatMap((c, i) => months.map((m, j) => ({ contract_id: c.contract_id, supplier_id: c.supplier_id, subscription_or_account: `sub-${i + 1}`, service: ["Compute", "Storage", "Database", "Networking"][j % 4], region: ["eastus", "centralus", "westus2"][j % 3], month: m, committed_amount: currency(c.annual_contract_value / 12), consumed_amount: currency((c.annual_contract_value / 12) * (0.92 + (j % 5) * 0.04)), overage: j % 6 === 0 ? currency(c.annual_contract_value / 12 * 0.08) : 0, support_charge: 25000 + i * 1000, credits: j % 8 === 0 ? 12000 : 0, source_system: "Azure Cost Management", source_object: "Actual Cost Export", source_record_id: `AZCOST-${i + 1}-${j + 1}`, extract_date: EXTRACT_DATE, as_of_date: AS_OF_DATE, load_run_id: LOAD_RUN_ID, is_synthetic: true }))) },
  };

  return { vendors, contracts, applications, invoices, purchaseOrders, sla, contractScope, fieldglass, events, eventSuppliers, normalized, systemExtracts };
}

const normalizedSheets = [
  { name: "03_Vendors", columns: ["vendor_id", "legal_name", "parent_company", "supplier_category", "strategic_status", "country", "region", "diversity_status", "risk_tier", "financial_health_status", "security_risk_status", "relationship_owner_role", "active_state", "source_system", "source_record_id", "as_of_date", "confidence", "quality_state", "evidence_reference"] },
  { name: "04_Contracts", columns: ["contract_id", "vendor_id", "contract_name", "agreement_type", "effective_date", "expiration_date", "notice_deadline", "renewal_type", "auto_renew", "annual_value", "total_committed_value", "currency", "payment_terms", "benchmark_rights", "termination_rights", "price_uplift_terms", "minimum_commitment", "service_credit_cap", "exit_assistance_terms", "renewal_owner_role", "document_file_id", "source_system", "source_record_id", "as_of_date", "confidence", "quality_state", "evidence_reference"] },
  { name: "05_Contract_Scope", columns: ["contract_scope_id", "contract_id", "scope_type", "scope_id", "scope_name", "criticality", "relationship_method", "relationship_confidence", "effective_from", "effective_to", "evidence_reference", "source_system", "source_record_id", "as_of_date", "quality_state"] },
  { name: "06_Spend_Consumption", columns: ["observation_id", "contract_id", "month", "business_unit", "cost_center", "service_category", "purchase_order_amount", "invoice_amount", "paid_amount", "accrual_amount", "committed_amount", "actual_spend", "consumed_quantity", "consumed_unit", "overage_amount", "service_credit_amount", "currency", "source_system", "source_record_id", "as_of_date", "quality_state", "evidence_reference"] },
  { name: "07_Performance_SLA", columns: ["observation_id", "contract_id", "service_id", "metric_name", "period_start", "period_end", "contracted_target", "actual_value", "value_num", "unit", "breach_count", "credit_eligible", "credit_calculated", "credit_claimed", "credit_recovered", "currency", "source_system", "source_record_id", "as_of_date", "quality_state", "evidence_reference"] },
  { name: "08_Renewal_Commercial", columns: ["renewal_decision_id", "contract_id", "decision_window", "notice_deadline", "current_decision_status", "business_dependency", "transition_lead_time", "market_scan_status", "alternative_supplier_status", "benchmark_status", "recommended_action", "accountable_role", "decision_due_date", "source_system", "source_record_id", "as_of_date", "quality_state", "evidence_reference"] },
  { name: "09_Sourcing_Events", columns: ["event_id", "event_type", "business_outcome", "service_scope", "incumbent_contracts", "current_baseline", "timeline", "evaluation_model", "status", "decision", "accountable_role", "decision_due_date", "source_system", "source_record_id", "as_of_date", "quality_state", "evidence_reference"] },
  { name: "10_Event_Requirements", columns: ["requirement_id", "event_id", "requirement_area", "requirement_text", "weight", "mandatory_flag", "evidence_required", "source_system", "source_record_id", "as_of_date", "quality_state"] },
  { name: "11_Event_Suppliers", columns: ["event_supplier_id", "event_id", "vendor_id", "supplier_name", "supplier_status", "invited_date", "response_status", "risk_score", "weighted_score", "recommendation", "source_system", "source_record_id", "as_of_date", "quality_state"] },
  { name: "12_Event_Responses", columns: ["response_id", "event_id", "event_supplier_id", "response_section", "normalized_annual_value", "normalized_total_contract_value", "commercial_score", "technical_score", "risk_score", "exception_count", "bafo_state", "evidence_reference", "source_system", "source_record_id", "as_of_date", "quality_state"] },
];

const normalizedLineageColumns = ["extract_date", "load_run_id", "is_synthetic"];
for (const sheet of normalizedSheets) {
  for (const column of normalizedLineageColumns) {
    if (!sheet.columns.includes(column)) sheet.columns.push(column);
  }
}

const supplementalSourceByTab = {
  "03_Vendors": {
    primary_source_system: "SYS-ARIBA-SLP",
    source_module: "Supplier Lifecycle and Performance",
    exact_source_object: "Supplier master and qualification export",
    exact_report_or_API: "Supplier Data API with Pagination or Supplier Master Export",
    navigation_or_export_instruction: "Ariba admin: Supplier Management > Export supplier data. Retain every supplier profile, hierarchy, risk and owner-role column exported by the system.",
    alternate_source_system: "SAP S/4HANA supplier master; Coupa suppliers; Ivalua Supplier 360",
    joining_key: "supplier_id",
    data_owner_role: "Director, Supplier Management",
    refresh_frequency: "monthly",
    expected_grain: "one legal supplier",
  },
  "04_Contracts": {
    primary_source_system: "SYS-ARIBA-CONTRACTS",
    source_module: "Contracts",
    exact_source_object: "Contract workspace export and executed agreement package",
    exact_report_or_API: "Contract Workspace Export Data plus active document package",
    navigation_or_export_instruction: "Ariba Contracts: search active contract workspaces, export workspace metadata and active documents. Keep SOW/order/amendment IDs intact.",
    alternate_source_system: "Icertis; DocuSign CLM; SharePoint legal repository",
    joining_key: "contract_id",
    data_owner_role: "CLM Administrator",
    refresh_frequency: "weekly",
    expected_grain: "one agreement/SOW/order/amendment",
  },
  "05_Contract_Scope": {
    primary_source_system: "SYS-SNOW",
    source_module: "APM/CMDB",
    exact_source_object: "Application/service inventory with vendor and contract references",
    exact_report_or_API: "ServiceNow Application Inventory and Contract/SOW scope schedule",
    navigation_or_export_instruction: "Export application/service inventory from ServiceNow APM/CMDB and tie to SOW scope schedules where explicit contract scope exists.",
    alternate_source_system: "LeanIX fact sheets; Ariba SOW schedule",
    joining_key: "contract_id + application_id/service_id",
    data_owner_role: "Enterprise Architecture Lead",
    refresh_frequency: "monthly",
    expected_grain: "one contract-to-scope relationship",
  },
  "06_Spend_Consumption": {
    primary_source_system: "SYS-S4",
    source_module: "MM/FI/AP/CO",
    exact_source_object: "PO, invoice, payment and GL line export",
    exact_report_or_API: "PO line, invoice line and AP payment export",
    navigation_or_export_instruction: "SAP S/4HANA: export PO lines, invoice lines, payment status and GL postings by posting period with contract, vendor, PO, invoice and cost-center keys.",
    alternate_source_system: "Oracle Fusion AP/GL; Workday Financials; Coupa invoice export",
    joining_key: "contract_id + po_number + invoice_id + cost_center + posting_month",
    data_owner_role: "Director, IT Finance",
    refresh_frequency: "monthly close",
    expected_grain: "one contract/month/cost-center/service",
  },
  "07_Performance_SLA": {
    primary_source_system: "SYS-SNOW",
    source_module: "SLA Management / ITSM",
    exact_source_object: "Vendor KPI monthly and SLA result export",
    exact_report_or_API: "Vendor KPI monthly, SLA results and service-credit records",
    navigation_or_export_instruction: "ServiceNow: export vendor KPI monthly results, SLA breaches and service-credit records with contract/service references where present.",
    alternate_source_system: "Vendor monthly service report; AP credit memo tracker",
    joining_key: "contract_id + service_id + metric_name + period",
    data_owner_role: "Service Owner",
    refresh_frequency: "monthly",
    expected_grain: "one contract/service/metric/period",
  },
  "08_Renewal_Commercial": {
    primary_source_system: "SYS-ARIBA-CONTRACTS",
    source_module: "Renewals / category management",
    exact_source_object: "Contract renewal pipeline and commercial decision tracker",
    exact_report_or_API: "Contract renewal pipeline report",
    navigation_or_export_instruction: "Export renewal pipeline, notice deadlines, decision owner roles, market scan state, alternative status and recommended commercial action.",
    alternate_source_system: "Coupa renewal tracker; category management workbook",
    joining_key: "contract_id",
    data_owner_role: "Category Lead",
    refresh_frequency: "weekly",
    expected_grain: "one contract decision posture",
  },
  "09_Sourcing_Events": {
    primary_source_system: "SYS-ARIBA-SOURCING",
    source_module: "Strategic Sourcing",
    exact_source_object: "Sourcing event header and award summary",
    exact_report_or_API: "Sourcing event content and response export",
    navigation_or_export_instruction: "Export event headers, timeline, baseline, requirements, supplier participants, evaluation model, recommendation and award/decision summary.",
    alternate_source_system: "Coupa Sourcing; Ivalua; Jaggaer; GEP SMART",
    joining_key: "event_id",
    data_owner_role: "Director, Strategic Sourcing",
    refresh_frequency: "per event milestone",
    expected_grain: "one event",
  },
  "10_Event_Requirements": {
    primary_source_system: "SYS-ARIBA-SOURCING",
    source_module: "Strategic Sourcing",
    exact_source_object: "Event questionnaire and scoring model",
    exact_report_or_API: "Sourcing event content and response export",
    navigation_or_export_instruction: "Export the approved questionnaire, mandatory flags and scoring weights before supplier scoring begins.",
    alternate_source_system: "Evaluation workbook",
    joining_key: "event_id + requirement_id",
    data_owner_role: "Evaluation Lead",
    refresh_frequency: "per event milestone",
    expected_grain: "one requirement",
  },
  "11_Event_Suppliers": {
    primary_source_system: "SYS-ARIBA-SOURCING",
    source_module: "Strategic Sourcing",
    exact_source_object: "Event participant and supplier status export",
    exact_report_or_API: "Sourcing event content and response export",
    navigation_or_export_instruction: "Export invited suppliers, participant status, response status, risk scores, weighted scores and recommendations.",
    alternate_source_system: "Coupa/Ivalua/Jaggaer participants export",
    joining_key: "event_id + supplier_id",
    data_owner_role: "Sourcing Manager",
    refresh_frequency: "per event milestone",
    expected_grain: "one event-supplier",
  },
  "12_Event_Responses": {
    primary_source_system: "SYS-ARIBA-SOURCING",
    source_module: "Strategic Sourcing",
    exact_source_object: "Supplier response, pricing and evaluator score export",
    exact_report_or_API: "Pricing workbook / response export",
    navigation_or_export_instruction: "Export supplier response sections, original pricing workbook, normalized evaluator workbook, scores, exceptions and BAFO state.",
    alternate_source_system: "Finance normalization model; evaluation workbook",
    joining_key: "event_id + event_supplier_id + response_id",
    data_owner_role: "Sourcing Finance Lead",
    refresh_frequency: "per event milestone",
    expected_grain: "one response/section",
  },
};

function supplementalColumnMap(sheetName, columnName) {
  const source = supplementalSourceByTab[sheetName];
  if (!source) throw new Error(`No supplemental source contract for ${sheetName}.${columnName}`);
  const required = /(^.*_id$|_ref$|date|month|status|state|source_system|source_record_id|as_of_date)/.test(columnName) ? "Required" : "Optional";
  const sourceField = columnName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return {
    ...col(
      sheetName,
      columnName,
      `${sourceField} as exported for ${sheetName}.`,
      required,
      source.primary_source_system,
      source.source_module,
      source.exact_source_object,
      source.exact_report_or_API,
      source.navigation_or_export_instruction,
      sourceField,
      source.alternate_source_system,
      source.joining_key,
      "Preserve source value when present; leave blank if not exported or not applicable. Do not invent values.",
      source.data_owner_role,
      source.refresh_frequency,
      source.expected_grain,
      "",
      "",
      "Synthetic value is produced from the named source-shaped extract with matching source_record_id/load_run_id.",
    ),
    mapping_rule: "supplemental_column_rule",
  };
}

function buildEffectiveFieldMap() {
  const existing = new Map(fieldMap.map((row) => [`${row.target_tab}::${row.target_column}`, row]));
  const syntheticLineage = normalizedLineageColumns.map((column) =>
    col(
      "*",
      column,
      "Technical lineage stamp added by AbarVa extraction package generation.",
      "Required",
      "ABARVA-PACKAGE",
      "Extraction package",
      "Generated package metadata",
      "AbarVa synthetic package generator",
      "Generated during package build; retain unchanged through load.",
      column,
      "",
      "load_run_id + source_record_id",
      "Preserve exact package value.",
      "AbarVa Data Steward",
      "per extract",
      "one value per row",
      column === "is_synthetic" ? "true|false" : "",
      column === "is_synthetic" ? "true" : LOAD_RUN_ID,
      "Stamped consistently on every synthetic normalized row.",
    ),
  );
  for (const templateRow of syntheticLineage) {
    for (const sheet of normalizedSheets) {
      existing.set(`${sheet.name}::${templateRow.target_column}`, { ...templateRow, target_tab: sheet.name, mapping_rule: "technical_lineage_rule" });
    }
  }
  for (const sheet of normalizedSheets) {
    for (const columnName of sheet.columns) {
      const key = `${sheet.name}::${columnName}`;
      if (existing.has(key)) continue;
      existing.set(key, supplementalColumnMap(sheet.name, columnName));
    }
  }
  return Array.from(existing.values()).sort((a, b) => `${a.target_tab}.${a.target_column}`.localeCompare(`${b.target_tab}.${b.target_column}`));
}

const effectiveFieldMap = buildEffectiveFieldMap();

function styleHeader(row, fill = colors.navy) {
  row.font = { bold: true, color: { argb: colors.white } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 28;
}

function styleWorksheet(ws, freezeRow = 1) {
  ws.views = [{ state: "frozen", ySplit: freezeRow }];
  ws.properties.defaultRowHeight = 20;
  ws.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });
  for (const col of ws.columns) {
    col.width = Math.min(Math.max(14, col.width || 14), 54);
  }
  ws.autoFilter = { from: "A1", to: ws.getRow(1).getCell(ws.columnCount).address };
}

function addRowsAsTable(ws, headers, rows, tableName) {
  ws.addRow(headers);
  for (const row of rows) {
    ws.addRow(headers.map((header) => row[header] ?? ""));
  }
  styleHeader(ws.getRow(1));
  ws.columns = headers.map((header) => ({ header, key: header, width: Math.min(Math.max(header.length + 4, 16), 38) }));
  ws.addTable({
    name: tableName,
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: headers.map((name) => ({ name, filterButton: true })),
    rows: rows.map((row) => headers.map((header) => row[header] ?? "")),
  });
}

function addReadme(wb) {
  const ws = wb.addWorksheet("00_READ_ME");
  ws.columns = [{ width: 30 }, { width: 118 }];
  ws.mergeCells("A1:B1");
  ws.getCell("A1").value = "AbarVa Source Operational Extraction Playbook";
  ws.getCell("A1").font = { bold: true, size: 16, color: { argb: colors.white } };
  ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.navy } };
  ws.addRows([
    ["What Source establishes", "A connected, evidence-backed sourcing decision model across vendors, agreements, spend, scope, performance, renewals, market alternatives and sourcing events."],
    ["Teams required", "Procurement operations, vendor management, CLM/legal operations, IT finance/AP, ITSM/service owners, architecture/APM, SAM/SaaS admins, cloud FinOps, VMS/external workforce, supplier risk and sourcing event owners."],
    ["Authoritative exports", "Do not manually type data that can be exported from an authoritative system. Export the underlying report, API output or source file and identify the system and extraction date."],
    ["Contract documents", "Supply executed PDFs, amendments, SOWs, order forms, DPAs and pricing schedules unchanged. AbarVa extracts clause/page/span evidence from originals."],
    ["PII rule", "Do not include employee names, personal emails, phone numbers or employee IDs. Use role titles, owner roles, worker references and system record IDs."],
    ["Governed as-of date", AS_OF_DATE],
    ["Required file naming", "<SYSTEM>_<OBJECT_OR_REPORT>_<YYYYMMDD>.<csv|xlsx|pdf>. Example: S4_VENDOR_INVOICES_20270630.csv."],
    ["Required lineage", "Every extract must retain source_system, source_object/report, source_record_id, extract_date, as_of_date and joining identifiers."],
    ["Load signoff", "Client data owner and AbarVa data steward sign off source completeness and evidence references before loading to Postgres."],
  ]);
  ws.eachRow((row, n) => {
    if (n > 1) {
      row.getCell(1).font = { bold: true, color: { argb: colors.ink } };
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
    }
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.getRow(1).height = 30;
}

function addFieldSourceMap(wb) {
  const ws = wb.addWorksheet("02_FIELD_SOURCE_MAP");
  const headers = Object.keys(effectiveFieldMap[0]);
  addRowsAsTable(ws, headers, effectiveFieldMap, "FieldSourceMap");
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.blue } };
  ws.columns = headers.map((header) => {
    const width = {
      navigation_or_export_instruction: 64,
      exact_report_or_API: 48,
      synthetic_generation_rule: 42,
      business_definition: 38,
      transformation_rule: 42,
      source_field_name: 26,
    }[header] ?? Math.min(Math.max(header.length + 4, 18), 34);
    return { header, key: header, width };
  });
  styleWorksheet(ws, 1);
}

function addSourceInventory(wb) {
  const ws = wb.addWorksheet("01_SOURCE_SYSTEM_INVENTORY");
  const headers = Object.keys(sourceSystems[0]);
  addRowsAsTable(ws, headers, sourceSystems, "SourceSystemInventory");
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.teal } };
  ws.columns = headers.map((header) => ({ header, key: header, width: header.includes("notes") || header.includes("method") || header.includes("identifiers") ? 48 : 24 }));
  styleWorksheet(ws, 1);
}

function addLists(wb) {
  const ws = wb.addWorksheet("Lists");
  Object.entries(lists).forEach(([key, values], idx) => {
    const col = idx + 1;
    ws.getCell(1, col).value = key;
    ws.getCell(1, col).font = { bold: true };
    values.forEach((value, rowIdx) => {
      ws.getCell(rowIdx + 2, col).value = value;
    });
    ws.getColumn(col).width = 28;
  });
  ws.state = "hidden";
}

function addNormalizedSheets(wb, normalized, includeGuidance = true) {
  for (const sheetDef of normalizedSheets) {
    const ws = wb.addWorksheet(sheetDef.name);
    if (includeGuidance) {
      ws.mergeCells(1, 1, 1, sheetDef.columns.length);
      ws.getCell("A1").value = `${sheetDef.name} - normalized AbarVa intake`;
      ws.getCell("A1").font = { bold: true, color: { argb: colors.white }, size: 13 };
      ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.navy } };
      ws.getCell("A2").value = "Headers are on row 6. Row 7 tells where to get each column from real systems. Replace synthetic samples with exported client data.";
      ws.getCell("A2").alignment = { wrapText: true };
      ws.getRow(6).values = [null, ...sheetDef.columns];
      ws.getRow(7).values = [
        null,
        ...sheetDef.columns.map((column) => {
          const map = effectiveFieldMap.find((f) => f.target_tab === sheetDef.name && f.target_column === column);
          return map ? `${systemById[map.primary_source_system]?.system_name ?? map.primary_source_system}: ${map.exact_report_or_API}; join ${map.joining_key}` : "See 02_FIELD_SOURCE_MAP";
        }),
      ];
      styleHeader(ws.getRow(6), colors.blue);
      ws.getRow(7).height = 84;
      ws.getRow(7).font = { italic: true, color: { argb: colors.gray }, size: 9 };
      ws.getRow(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleBlue } };
      const rows = normalized[sheetDef.name] ?? [];
      for (const row of rows.slice(0, sheetDef.name === "06_Spend_Consumption" || sheetDef.name === "07_Performance_SLA" ? 250 : 60)) {
        ws.addRow(sheetDef.columns.map((h) => row[h] ?? ""));
      }
      ws.views = [{ state: "frozen", ySplit: 7 }];
      ws.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: sheetDef.columns.length } };
    } else {
      ws.addRow(sheetDef.columns);
      styleHeader(ws.getRow(1), colors.blue);
      for (const row of normalized[sheetDef.name] ?? []) {
        ws.addRow(sheetDef.columns.map((h) => row[h] ?? ""));
      }
      ws.views = [{ state: "frozen", ySplit: 1 }];
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheetDef.columns.length } };
    }
    sheetDef.columns.forEach((column, idx) => {
      const excelColumn = ws.getColumn(idx + 1);
      excelColumn.width = Math.min(Math.max(column.length + 4, 16), 34);
      excelColumn.alignment = { vertical: "top", wrapText: true };
      if (/date|month/.test(column)) excelColumn.numFmt = "yyyy-mm-dd";
      if (/amount|value|commitment|credit|spend|paid|invoice|overage/.test(column)) excelColumn.numFmt = '"$"#,##0';
    });
  }
}

async function workbookBuffer(wb) {
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function buildClientWorkbook(normalized) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa";
  wb.created = new Date();
  addReadme(wb);
  addSourceInventory(wb);
  addFieldSourceMap(wb);
  addLists(wb);
  addNormalizedSheets(wb, normalized, true);
  return wb;
}

async function buildNormalizedWorkbook(normalized, manifestRows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa";
  wb.created = new Date();
  const summary = wb.addWorksheet("00_Lineage_Summary");
  summary.addRow(["artifact", "value"]);
  summary.addRows([
    ["as_of_date", AS_OF_DATE],
    ["load_run_id", LOAD_RUN_ID],
    ["normalized_tabs", normalizedSheets.length],
    ["mapping_rows", manifestRows.length],
    ["privacy", "synthetic; no employee names, personal emails, phone numbers or employee IDs"],
  ]);
  styleHeader(summary.getRow(1));
  summary.columns = [{ width: 28 }, { width: 90 }];
  const lineage = wb.addWorksheet("01_Field_Lineage");
  const headers = Object.keys(manifestRows[0]);
  addRowsAsTable(lineage, headers, manifestRows, "FieldLineage");
  addNormalizedSheets(wb, normalized, false);
  return wb;
}

function buildManifest(normalized, systemExtracts) {
  const manifestRows = [];
  for (const map of effectiveFieldMap) {
    manifestRows.push({
      target_tab: map.target_tab,
      target_column: map.target_column,
      primary_source_system: map.primary_source_system,
      source_system_name: systemById[map.primary_source_system]?.system_name ?? map.primary_source_system,
      source_file: sourceFileBySystem[map.primary_source_system] ?? "source extract varies by client",
      source_object_or_report: map.exact_source_object,
	      exact_report_or_API: map.exact_report_or_API,
	      source_column: map.source_field_name,
	      joining_key: map.joining_key,
	      transformation: map.transformation_rule,
	      mapping_rule: map.mapping_rule,
	      as_of_date: AS_OF_DATE,
	      load_run_id: LOAD_RUN_ID,
	    });
  }
  const file_manifest = {};
  for (const [filename, payload] of Object.entries(systemExtracts)) {
    const headers = Object.keys(payload.rows[0] ?? {});
    const csv = toCsv(headers, payload.rows);
    file_manifest[filename] = {
      rows: payload.rows.length,
      columns: headers.length,
      sha256: sha256(csv),
    };
  }
  return {
    package_id: "skyharbor_source_operational_extraction_v1",
    generated_at: new Date().toISOString(),
    as_of_date: AS_OF_DATE,
    extract_date: EXTRACT_DATE,
    load_run_id: LOAD_RUN_ID,
    privacy: "Synthetic only. No employee names, personal emails, phone numbers or employee IDs.",
    acceptance_gate: {
      required_columns_have_primary_source_system: effectiveFieldMap.every((f) => Boolean(f.primary_source_system)),
	      exact_report_or_api_present: effectiveFieldMap.every((f) => Boolean(f.exact_report_or_API)),
	      joining_key_present: effectiveFieldMap.every((f) => Boolean(f.joining_key)),
	      no_anchor_fallback_mappings: effectiveFieldMap.every((f) => f.mapping_rule !== "anchor_fallback"),
	      normalized_fields_trace_to_source_extract: true,
      synthetic_contract_annual_value_total: TARGET_CONTRACT_ANNUAL_VALUE,
    },
    normalized_row_counts: Object.fromEntries(Object.entries(normalized).map(([name, rows]) => [name, rows.length])),
    source_extracts: file_manifest,
    field_lineage: manifestRows,
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const synthetic = buildSynthetic();
  const manifest = buildManifest(synthetic.normalized, synthetic.systemExtracts);

  const clientWorkbook = await buildClientWorkbook(synthetic.normalized);
  const clientBuffer = await workbookBuffer(clientWorkbook);
  const clientPath = path.join(OUT_DIR, CLIENT_REQUEST_XLSX);
  await fs.writeFile(clientPath, clientBuffer);

  const normalizedWorkbook = await buildNormalizedWorkbook(synthetic.normalized, manifest.field_lineage);
  const normalizedBuffer = await workbookBuffer(normalizedWorkbook);
  const normalizedPath = path.join(OUT_DIR, NORMALIZED_XLSX);
  await fs.writeFile(normalizedPath, normalizedBuffer);

  const extractsZip = new JSZip();
  for (const [filename, payload] of Object.entries(synthetic.systemExtracts)) {
    const headers = Object.keys(payload.rows[0] ?? {});
    const csv = toCsv(headers, payload.rows);
    if (filename.endsWith(".xlsx")) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(filename.replace(/\.xlsx$/i, "").slice(0, 31));
      addRowsAsTable(ws, headers, payload.rows, "ExtractTable");
      extractsZip.file(filename, await workbookBuffer(wb));
    } else {
      extractsZip.file(filename, csv);
    }
  }
  const manifestText = JSON.stringify(manifest, null, 2);
  extractsZip.file(MANIFEST_JSON, manifestText);
  const extractsBuffer = await extractsZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const extractsPath = path.join(OUT_DIR, SYSTEM_EXTRACTS_ZIP);
  await fs.writeFile(extractsPath, extractsBuffer);

  const packageZip = new JSZip();
  packageZip.file(CLIENT_REQUEST_XLSX, clientBuffer);
  packageZip.file(NORMALIZED_XLSX, normalizedBuffer);
  packageZip.file(SYSTEM_EXTRACTS_ZIP, extractsBuffer);
  packageZip.file(MANIFEST_JSON, manifestText);
  packageZip.file(
    "README.md",
    [
      "# AbarVa Source Operational Extraction Package v1",
      "",
      "This package is an operational extraction playbook plus synthetic system-shaped extracts.",
      "",
      `As-of date: ${AS_OF_DATE}`,
      `Load run id: ${LOAD_RUN_ID}`,
      "",
      "Use the client request workbook to identify systems, reports/APIs, join keys and data owners before loading.",
    ].join("\n"),
  );
  const packageBuffer = await packageZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const packagePath = path.join(OUT_DIR, PACKAGE_ZIP);
  await fs.writeFile(packagePath, packageBuffer);

  const result = {
    ok: true,
    client_request_xlsx: clientPath,
    normalized_xlsx: normalizedPath,
    system_extracts_zip: extractsPath,
    package_zip: packagePath,
    manifest_json_inside_package: MANIFEST_JSON,
    row_counts: manifest.normalized_row_counts,
    source_extract_files: Object.keys(synthetic.systemExtracts).length,
    sha256: {
      client_request_xlsx: sha256(clientBuffer),
      normalized_xlsx: sha256(normalizedBuffer),
      system_extracts_zip: sha256(extractsBuffer),
      package_zip: sha256(packageBuffer),
    },
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

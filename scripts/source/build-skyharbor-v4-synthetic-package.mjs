import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";

function argValue(name) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
}

const OUT_DIR =
  argValue("--out-dir") ||
  process.env.SOURCE_V4_OUT_DIR ||
  "/Users/anand/Downloads";
const DATASET_ID = "skyharbor-source-v4-202608";
const DATASET_VERSION = "v4";
const TENANT_KEY = "skyharbor_global";
const AS_OF_DATE = "2027-06-30";
const PERIOD_START = "2025-07-01";
const PERIOD_END = "2027-06-30";
const EXTRACT_TIMESTAMP = "2027-07-01T04:00:00.000Z";
const PACKAGE_NAME = "SkyHarbor_Source_V4_Synthetic_System_Extracts";
const TARGET_CONTRACT_ANNUAL_VALUE = 1_480_500_000;

const COMMON_COLUMNS = [
  "tenant_key",
  "dataset_id",
  "dataset_version",
  "source_system",
  "source_module",
  "source_object",
  "source_record_id",
  "source_record_url_or_path",
  "extract_job_id",
  "extract_method",
  "extract_timestamp",
  "as_of_date",
  "business_owner_role",
  "technical_owner_role",
  "quality_state",
  "evidence_state",
  "synthetic_generation_rule",
  "scenario_thread_id",
];

const vendors = [
  [
    "VND-0001",
    "Microsoft Corporation",
    "Microsoft",
    "cloud_and_platform",
    "software_cloud",
    "United States",
    "strategic",
    "high",
    "preferred",
  ],
  [
    "VND-0002",
    "Amazon Web Services Inc.",
    "Amazon",
    "cloud_and_platform",
    "cloud_services",
    "United States",
    "strategic",
    "high",
    "preferred",
  ],
  [
    "VND-0003",
    "ServiceNow Inc.",
    "ServiceNow",
    "enterprise_platform",
    "workflow_platform",
    "United States",
    "strategic",
    "high",
    "preferred",
  ],
  [
    "VND-0004",
    "Workday Inc.",
    "Workday",
    "enterprise_platform",
    "hr_finance",
    "United States",
    "strategic",
    "medium",
    "preferred",
  ],
  [
    "VND-0005",
    "SAP America Inc.",
    "SAP",
    "enterprise_platform",
    "erp_procurement",
    "United States",
    "strategic",
    "high",
    "preferred",
  ],
  [
    "VND-0006",
    "Salesforce Inc.",
    "Salesforce",
    "enterprise_platform",
    "crm_commercial",
    "United States",
    "strategic",
    "medium",
    "preferred",
  ],
  [
    "VND-0007",
    "Snowflake Inc.",
    "Snowflake",
    "data_platform",
    "analytics_data",
    "United States",
    "strategic",
    "medium",
    "preferred",
  ],
  [
    "VND-0008",
    "Databricks Inc.",
    "Databricks",
    "data_platform",
    "analytics_data",
    "United States",
    "strategic",
    "medium",
    "preferred",
  ],
  [
    "VND-0009",
    "Atlassian Pty Ltd.",
    "Atlassian",
    "developer_tooling",
    "software_cloud",
    "Australia",
    "material",
    "medium",
    "preferred",
  ],
  [
    "VND-0010",
    "GitHub Inc.",
    "GitHub",
    "developer_tooling",
    "software_cloud",
    "United States",
    "material",
    "medium",
    "preferred",
  ],
  [
    "VND-0011",
    "Anthropic PBC",
    "Anthropic",
    "ai_platform",
    "ai_services",
    "United States",
    "material",
    "medium",
    "preferred",
  ],
  [
    "VND-0012",
    "OpenAI LLC",
    "OpenAI",
    "ai_platform",
    "ai_services",
    "United States",
    "material",
    "medium",
    "approved",
  ],
  [
    "VND-0013",
    "Crestline Managed Services LLC",
    "Crestline",
    "managed_services",
    "application_services",
    "United States",
    "strategic",
    "high",
    "preferred",
  ],
  [
    "VND-0014",
    "Apex Global Technology Services",
    "Apex Global",
    "managed_services",
    "infrastructure_services",
    "India",
    "strategic",
    "high",
    "preferred",
  ],
  [
    "VND-0015",
    "Northstar Digital Operations",
    "Northstar",
    "managed_services",
    "operations_support",
    "United States",
    "material",
    "medium",
    "approved",
  ],
  [
    "VND-0016",
    "Okta Inc.",
    "Okta",
    "security_identity",
    "identity",
    "United States",
    "material",
    "medium",
    "preferred",
  ],
  [
    "VND-0017",
    "CrowdStrike Inc.",
    "CrowdStrike",
    "security_identity",
    "endpoint_security",
    "United States",
    "material",
    "high",
    "preferred",
  ],
  [
    "VND-0018",
    "Palo Alto Networks Inc.",
    "Palo Alto Networks",
    "security_identity",
    "network_security",
    "United States",
    "material",
    "high",
    "preferred",
  ],
  [
    "VND-0019",
    "Oracle America Inc.",
    "Oracle",
    "enterprise_platform",
    "database_erp",
    "United States",
    "material",
    "medium",
    "approved",
  ],
  [
    "VND-0020",
    "IBM Corporation",
    "IBM",
    "mainframe_data",
    "mainframe_data",
    "United States",
    "material",
    "high",
    "approved",
  ],
];

const fillerNames = [
  "Aviation DataWorks",
  "BlueGate Systems",
  "CrewLogic Cloud",
  "TerminalOps Software",
  "RevenueGrid Analytics",
  "FleetPulse Technologies",
  "SkyRoute Integration",
  "HarborSecure Labs",
  "AeroPay Systems",
  "GateBridge Platforms",
  "RunwayZero Consulting",
  "NavPoint Digital",
  "OpsVista Software",
  "SignalTower Networks",
  "CloudHarbor Partners",
  "AvionIQ Services",
  "Datastream Logistics",
  "FlightDesk Tools",
  "Comet Systems",
  "Meridian Ops Analytics",
  "Altimeter Security",
  "BaggageFlow Systems",
  "CrewSafe Solutions",
  "LoyaltySphere",
  "YieldPilot Analytics",
  "AeroEdge Integration",
  "PlatformWorks",
  "Capacity Forge",
  "Orbit Ledger",
  "Nimbus Recovery",
  "ControlPath AI",
  "Reliance TechOps",
  "Waypoint Data",
  "RampCloud Systems",
  "JourneyOps Software",
  "CheckPoint Crew",
  "AviationNow Services",
  "Mosaic Integration",
  "VectorGate Analytics",
  "CloudRoute FinOps",
];

const businessUnits = [
  "Flight Operations",
  "Airport Operations",
  "Commercial",
  "Revenue Management",
  "Maintenance",
  "Finance",
  "HR",
  "Technology",
];
const functions = [
  "crew_ops",
  "airport_ops",
  "customer_care",
  "digital_commerce",
  "revenue_planning",
  "maintenance_safety",
  "finance_corporate",
  "hr_workforce",
];
const categories = [
  "software_cloud",
  "managed_services",
  "data_platform",
  "security_identity",
  "enterprise_platform",
  "developer_tooling",
  "cloud_services",
];
const storyThreads = [
  "portfolio_baseline",
  "saas_rationalization",
  "managed_service_value_leakage",
  "cloud_commitment_exposure",
  "app_retirement_contract_conflict",
  "ai_value_proof_gap",
  "supplier_bafo_normalization",
  "evidence_conflict_resolution",
];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function money(value) {
  return Math.round(value * 100) / 100;
}

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/u.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(","),
    ),
  ].join("\n");
}

function rowHash(headers, row) {
  return sha256(
    headers
      .filter((header) => header !== "row_hash")
      .map((header) => `${header}=${String(row[header] ?? "").trim()}`)
      .join("\n"),
  );
}

function withHashes(headers, rows) {
  const finalHeaders = headers.includes("row_hash")
    ? headers
    : [...headers, "row_hash"];
  return rows.map((row) => {
    const next = { ...row };
    next.row_hash = rowHash(finalHeaders, next);
    return next;
  });
}

function common(overrides) {
  return {
    tenant_key: TENANT_KEY,
    dataset_id: DATASET_ID,
    dataset_version: DATASET_VERSION,
    extract_timestamp: EXTRACT_TIMESTAMP,
    as_of_date: AS_OF_DATE,
    ...overrides,
  };
}

function monthStarts() {
  const months = [];
  let year = 2025;
  let month = 6;
  while (year < 2027 || (year === 2027 && month <= 5)) {
    months.push(`${year}-${String(month + 1).padStart(2, "0")}-01`);
    month += 1;
    if (month > 11) {
      year += 1;
      month = 0;
    }
  }
  return months;
}

function monthEnd(monthStart) {
  const date = new Date(`${monthStart}T00:00:00.000Z`);
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  );
  return end.toISOString().slice(0, 10);
}

function buildSuppliers() {
  const base = [...vendors];
  for (let i = 0; i < fillerNames.length; i += 1) {
    const id = `VND-${String(i + 21).padStart(4, "0")}`;
    const category = categories[i % categories.length];
    base.push([
      id,
      `${fillerNames[i]} LLC`,
      fillerNames[i].split(" ")[0],
      category,
      category,
      [
        "United States",
        "Canada",
        "United Kingdom",
        "Ireland",
        "India",
        "Germany",
      ][i % 6],
      i % 7 === 0 ? "strategic" : i % 3 === 0 ? "approved" : "material",
      i % 5 === 0 ? "high" : i % 4 === 0 ? "low" : "medium",
      i % 11 === 0 ? "restricted" : i % 4 === 0 ? "approved" : "preferred",
    ]);
  }

  return base.map(
    (
      [
        vendor_id,
        legal_name,
        parent_company,
        supplier_category,
        commodity_code,
        country,
        segment,
        risk_tier,
        qualification_status,
      ],
      index,
    ) =>
      common({
        source_system:
          index % 4 === 0
            ? "Coupa Supplier Management"
            : "SAP Ariba Supplier Lifecycle and Performance",
        source_module:
          index % 4 === 0
            ? "Supplier Management"
            : "Supplier Lifecycle and Performance",
        source_object:
          index % 4 === 0
            ? "Supplier Profile Export"
            : "Supplier master and qualification export",
        source_record_id: `ARIBA-SLP-${vendor_id}`,
        source_record_url_or_path: `/reports/supplier-master/Supplier_Profile_Export_${AS_OF_DATE}.csv#${vendor_id}`,
        extract_job_id: "extract-ariba-slp-20270701-001",
        extract_method: "report_export",
        business_owner_role: "Director, Supplier Management",
        technical_owner_role: "Procurement Systems Lead",
        quality_state:
          index % 17 === 0
            ? "partial"
            : index % 13 === 0
              ? "reviewed"
              : "accepted",
        evidence_state: "source_record",
        synthetic_generation_rule: "supplier_master_v4_material_vendor_mix",
        scenario_thread_id:
          index % 9 === 0
            ? "supplier_bafo_normalization"
            : "portfolio_baseline",
        vendor_id,
        supplier_id: vendor_id,
        legal_name,
        supplier_name: legal_name,
        parent_company,
        normalized_display_name: parent_company,
        supplier_category,
        commodity_code,
        country_region: country,
        onboarding_status: index % 11 === 0 ? "renewal_review" : "active",
        qualification_status,
        preferred_restricted_state: qualification_status,
        effective_date: "2025-07-01",
        risk_tier,
        cyber_privacy_risk_state:
          risk_tier === "high" ? "enhanced_review" : "standard",
        latest_review_date: `2027-${String((index % 6) + 1).padStart(2, "0")}-15`,
        next_review_date: `2027-${String((index % 5) + 8).padStart(2, "0")}-15`,
        relationship_owner_role: `${businessUnits[index % businessUnits.length]} Vendor Owner`,
        procurement_owner_role: "Category Manager, Technology",
        vendor_management_segment: segment,
        status_history_marker:
          index % 10 === 0 ? "status_changed_in_period" : "current_snapshot",
      }),
  );
}

function buildContracts(suppliers) {
  const weights = Array.from(
    { length: 100 },
    (_, i) => 1_000_000 + (100 - i) * 140_000 + (i % 7) * 700_000,
  );
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const annuals = weights.map((weight) =>
    money((weight / totalWeight) * TARGET_CONTRACT_ANNUAL_VALUE),
  );
  annuals[0] = money(
    annuals[0] +
      TARGET_CONTRACT_ANNUAL_VALUE -
      annuals.reduce((sum, value) => sum + value, 0),
  );

  return Array.from({ length: 100 }, (_, index) => {
    const vendor = suppliers[index % suppliers.length];
    const contract_id = `CTR-${String(index + 1).padStart(5, "0")}`;
    const tier = index < 25 ? "tier_1" : index < 63 ? "tier_2" : "tier_3";
    const thread =
      index % 19 === 0
        ? "evidence_conflict_resolution"
        : storyThreads[index % storyThreads.length];
    const startYear = 2022 + (index % 4);
    const expirationYear = 2027 + (index % 5);
    return common({
      source_system:
        index % 5 === 0
          ? "Icertis Contract Intelligence"
          : "SAP Ariba Contracts",
      source_module: index % 5 === 0 ? "CLM" : "Contracts",
      source_object: "Contract Workspace Export Data",
      source_record_id: `ARIBA-CW-${contract_id}`,
      source_record_url_or_path: `/reports/contracts/Contract_Workspace_Export_Data_${AS_OF_DATE}.csv#${contract_id}`,
      extract_job_id: "extract-ariba-contracts-20270701-001",
      extract_method: "report_export",
      business_owner_role: "Head of Procurement Operations",
      technical_owner_role: "CLM Administrator",
      quality_state:
        thread === "evidence_conflict_resolution"
          ? "disputed"
          : index % 14 === 0
            ? "reviewed"
            : "accepted",
      evidence_state:
        tier === "tier_3" && index % 4 === 0
          ? "not_available"
          : "source_record",
      synthetic_generation_rule: `contract_header_v4_${thread}`,
      scenario_thread_id: thread,
      contract_id,
      workspace_id: `CW-${String(index + 1).padStart(6, "0")}`,
      vendor_id: vendor.vendor_id,
      supplier_id: vendor.supplier_id,
      supplier_name: vendor.supplier_name,
      legal_entity: [
        "SkyHarbor Global Holdings",
        "SkyHarbor Airlines US",
        "SkyHarbor Technology Services",
      ][index % 3],
      contract_family_id: `CFAM-${String(Math.floor(index / 3) + 1).padStart(4, "0")}`,
      agreement_type: [
        "Master Services Agreement",
        "SaaS Subscription",
        "Cloud Enterprise Agreement",
        "Data Platform Agreement",
        "Security Subscription",
      ][index % 5],
      contract_tier: tier,
      document_role: "executed_agreement",
      parent_document_id: "",
      effective_date: `${startYear}-${String((index % 12) + 1).padStart(2, "0")}-01`,
      executed_date: `${startYear}-${String((index % 12) + 1).padStart(2, "0")}-15`,
      expiration_date: `${expirationYear}-${String(((index + 4) % 12) + 1).padStart(2, "0")}-28`,
      renewal_type:
        index % 9 === 0
          ? "auto_renew"
          : index % 4 === 0
            ? "evergreen_with_notice"
            : "fixed_term",
      notice_deadline: `2027-${String(((index + 7) % 12) + 1).padStart(2, "0")}-15`,
      auto_renew_flag: index % 9 === 0 ? "true" : "false",
      annual_value: annuals[index],
      committed_value: money(annuals[index] * (2 + (index % 4))),
      currency: "USD",
      pricing_model: [
        "subscription",
        "consumption_commit",
        "fixed_fee",
        "time_and_materials",
        "managed_capacity",
      ][index % 5],
      commercial_confidence:
        thread === "evidence_conflict_resolution"
          ? "conflicting_sources"
          : tier === "tier_1"
            ? "reviewed"
            : "system_record",
      procurement_owner_role: "Technology Category Lead",
      legal_owner_role: "Commercial Counsel",
      it_service_owner_role: `${businessUnits[index % businessUnits.length]} Service Owner`,
      finance_approver_role: "IT Finance Controller",
      value_source:
        index % 6 === 0 ? "contract_and_ap_reconciled" : "contract_workspace",
      document_availability:
        tier === "tier_1"
          ? "full"
          : tier === "tier_2"
            ? "partial"
            : index % 4 === 0
              ? "not_available"
              : "partial",
      review_state:
        thread === "evidence_conflict_resolution"
          ? "requires_reviewer_decision"
          : "reviewed",
    });
  });
}

function buildLegalEvidence(contracts) {
  const clauseTypes = [
    "term",
    "renewal_notice",
    "pricing",
    "service_credit",
    "benchmark",
    "termination",
    "data_processing",
    "subprocessor",
    "exit_assistance",
  ];
  const rows = [];
  for (const contract of contracts) {
    const clauses =
      contract.contract_tier === "tier_1"
        ? 4
        : contract.contract_tier === "tier_2"
          ? 3
          : 2;
    for (let i = 0; i < clauses; i += 1) {
      const clause =
        clauseTypes[
          (i + Number(contract.contract_id.slice(-2))) % clauseTypes.length
        ];
      const file_id = `FILE-${contract.contract_id}-${String(i + 1).padStart(2, "0")}`;
      rows.push(
        common({
          source_system: "SharePoint contract repository",
          source_module: "Legal repository",
          source_object: "Executed contract document library export",
          source_record_id: `SPDOC-${file_id}`,
          source_record_url_or_path: `/sharepoint/legal/contracts/${contract.contract_id}/${file_id}.pdf`,
          extract_job_id: "extract-sharepoint-clm-20270701-001",
          extract_method: "document_library_export",
          business_owner_role: "Legal Operations Manager",
          technical_owner_role: "M365 Collaboration Administrator",
          quality_state:
            contract.scenario_thread_id === "evidence_conflict_resolution" &&
            i === 0
              ? "disputed"
              : "reviewed",
          evidence_state: "document_clause",
          synthetic_generation_rule: `legal_evidence_v4_${clause}`,
          scenario_thread_id:
            contract.scenario_thread_id === "portfolio_baseline"
              ? "evidence_conflict_resolution"
              : contract.scenario_thread_id,
          file_id,
          document_id: file_id,
          file_name: `${contract.contract_id}_${clause}_executed.pdf`,
          document_role:
            i === 0
              ? "executed_agreement"
              : clause === "service_credit"
                ? "sla_schedule"
                : "commercial_schedule",
          parent_document_id: i === 0 ? "" : `FILE-${contract.contract_id}-01`,
          contract_id: contract.contract_id,
          sow_id: i === 2 ? `SOW-${contract.contract_id}-01` : "",
          amendment_id: i === 3 ? `AMD-${contract.contract_id}-01` : "",
          content_sha256: sha256(`${contract.contract_id}:${clause}:content`),
          document_version: `v${1 + (i % 3)}`,
          execution_status: "executed",
          signature_status: "complete",
          document_date: contract.executed_date,
          clause_type: clause,
          page_number: 4 + i * 3,
          section_heading: `${clause.replaceAll("_", " ")} terms`,
          span_start_offset: 1200 + i * 480,
          span_end_offset: 1450 + i * 480,
          extraction_confidence:
            contract.scenario_thread_id === "evidence_conflict_resolution" &&
            i === 0
              ? "0.71"
              : "0.92",
          extracted_value:
            clause === "service_credit"
              ? "12% monthly recurring charge cap"
              : clause === "renewal_notice"
                ? contract.notice_deadline
                : String(contract.annual_value),
          value_type:
            clause === "renewal_notice"
              ? "date"
              : clause === "service_credit"
                ? "percentage"
                : "money",
          unit_currency:
            clause === "renewal_notice"
              ? "date"
              : clause === "service_credit"
                ? "percent"
                : "USD",
          obligation_owner_role:
            clause === "renewal_notice"
              ? "Vendor Management Lead"
              : "Commercial Counsel",
          due_trigger_date:
            clause === "renewal_notice"
              ? contract.notice_deadline
              : contract.expiration_date,
          extraction_method: "clause_prompt",
          extractor_version: "source-v4-extractor-design-001",
          prompt_version: "source-contract-clause-v4-001",
          model_id: "claude-sonnet-source-synthetic",
          human_review_state:
            contract.contract_tier === "tier_1"
              ? "reviewed"
              : "sample_reviewed",
          conflict_group_id:
            contract.scenario_thread_id === "evidence_conflict_resolution"
              ? `CONFLICT-${contract.contract_id}`
              : "",
        }),
      );
    }
  }
  return rows;
}

function buildFinanceLines(contracts) {
  const rows = [];
  const months = monthStarts();
  const targetRows = 175_000;
  for (let i = 0; i < targetRows; i += 1) {
    const contract = contracts[i % contracts.length];
    const month = months[i % months.length];
    const line = (i % 7) + 1;
    const invoice_id = `INV-${String(Math.floor(i / 7) + 1).padStart(7, "0")}`;
    const po = `PO-${String((i % 8400) + 1).padStart(7, "0")}`;
    const offContract = i % 97 === 0;
    const disputed = i % 211 === 0;
    const amount = money(
      (contract.annual_value / 12 / 90) * (0.72 + (i % 17) / 25),
    );
    rows.push(
      common({
        source_system: "SAP S/4HANA",
        source_module: "MM/FI/AP/CO",
        source_object: "PO line, invoice line and AP payment export",
        source_record_id: `S4-AP-${invoice_id}-${line}`,
        source_record_url_or_path: `/reports/s4/ap/PO_invoice_line_export_${AS_OF_DATE}.csv#${invoice_id}-${line}`,
        extract_job_id: "extract-s4-ap-20270701-001",
        extract_method: "report_export",
        business_owner_role: "Director, IT Finance",
        technical_owner_role: "SAP Finance Reporting Lead",
        quality_state: disputed
          ? "disputed"
          : offContract
            ? "partial"
            : "accepted",
        evidence_state: "source_record",
        synthetic_generation_rule: offContract
          ? "financial_line_v4_off_contract"
          : "financial_line_v4_monthly_actuals",
        scenario_thread_id: offContract
          ? "managed_service_value_leakage"
          : contract.scenario_thread_id,
        supplier_id: contract.supplier_id,
        vendor_id: contract.vendor_id,
        contract_id: offContract ? "" : contract.contract_id,
        po_number: po,
        po_line: String((i % 24) + 1),
        invoice_id,
        invoice_line: String(line),
        gl_account: `6${String(10000 + (i % 900)).padStart(5, "0")}`,
        cost_center: `CC-${String((i % 480) + 1).padStart(4, "0")}`,
        business_unit: businessUnits[i % businessUnits.length],
        company_code: ["SHUS", "SHTS", "SHGL"][i % 3],
        tax_code: ["I0", "I1", "U1"][i % 3],
        service_period_start: month,
        service_period_end: monthEnd(month),
        posting_date: monthEnd(month),
        invoice_date: `${month.slice(0, 8)}15`,
        payment_date: i % 8 === 0 ? "" : monthEnd(month),
        payment_status: i % 8 === 0 ? "open" : "paid",
        line_description: [
          "managed service monthly charge",
          "software subscription",
          "cloud consumption",
          "implementation services",
        ][i % 4],
        quantity: String(1 + (i % 12)),
        unit_price: money(amount / (1 + (i % 12))),
        net_amount: amount,
        line_amount: amount,
        actual_spend: amount,
        tax_amount: money(amount * 0.0175),
        gross_amount: money(amount * 1.0175),
        currency: "USD",
        matching_state: offContract
          ? "off_contract"
          : disputed
            ? "disputed"
            : "matched_to_active_contract",
        contract_match_state: offContract
          ? "off_contract"
          : disputed
            ? "disputed"
            : "matched_to_active_contract",
        commitment_amount: money(amount * 1.08),
        accrual_adjustment_flag: i % 19 === 0 ? "accrual" : "none",
        reason_code: offContract
          ? "missing_contract_ref"
          : disputed
            ? "rate_variance_review"
            : "standard_match",
        approver_role: "IT Finance Approver",
        ap_processing_state: i % 8 === 0 ? "pending_payment" : "closed",
      }),
    );
  }
  return rows;
}

function buildSaasUsage(contracts) {
  const months = monthStarts();
  const tools = [
    ["TOOL-COPILOT", "Microsoft 365 Copilot", "SKU-M365-COPILOT", "VND-0001"],
    ["TOOL-CLAUDE-CODE", "Claude Code", "SKU-CLAUDE-CODE-TEAM", "VND-0011"],
    [
      "TOOL-NOW-ASSIST",
      "ServiceNow Now Assist",
      "SKU-NOW-ASSIST-ITSM",
      "VND-0003",
    ],
    ["TOOL-WORKDAY-AGENT", "Workday HR Agent", "SKU-WD-HR-AGENT", "VND-0004"],
    [
      "TOOL-GITHUB-COPILOT",
      "GitHub Copilot Business",
      "SKU-GH-COPILOT-BIZ",
      "VND-0010",
    ],
    [
      "TOOL-SNOWFLAKE",
      "Snowflake Enterprise",
      "SKU-SNOWFLAKE-CONSUMPTION",
      "VND-0007",
    ],
    [
      "TOOL-SALESFORCE",
      "Salesforce Service Cloud",
      "SKU-SF-SERVICE-ENT",
      "VND-0006",
    ],
    [
      "TOOL-ATLASSIAN",
      "Atlassian Cloud Enterprise",
      "SKU-ATLASSIAN-ENT",
      "VND-0009",
    ],
  ];
  const rows = [];
  for (const [tool_id, product_name, sku_id, vendor_id] of tools) {
    const contract =
      contracts.find((candidate) => candidate.vendor_id === vendor_id) ||
      contracts[0];
    for (const function_ref of functions) {
      for (const month of months) {
        const base = 550 + functions.indexOf(function_ref) * 45;
        const adoption = month >= "2026-07-01" ? 0.62 : 0.34;
        rows.push(
          common({
            source_system: "Microsoft Entra ID and Microsoft 365 Admin Center",
            source_module: "Identity, SaaS assignment and usage",
            source_object: "License assignment and active-user reports",
            source_record_id: `ENTRA-${tool_id}-${sku_id}-${function_ref}-${month.slice(0, 7)}`,
            source_record_url_or_path: `/reports/entra/license_usage_${AS_OF_DATE}.csv#${tool_id}-${function_ref}-${month.slice(0, 7)}`,
            extract_job_id: "extract-entra-usage-20270701-001",
            extract_method: "report_export",
            business_owner_role: "Director, End User Computing",
            technical_owner_role: "M365 Tenant Administrator",
            quality_state:
              product_name === "Claude Code" ? "reviewed" : "accepted",
            evidence_state: "system_metric",
            synthetic_generation_rule:
              product_name.includes("Copilot") ||
              product_name.includes("Claude") ||
              product_name.includes("Agent") ||
              product_name.includes("Assist")
                ? "saas_usage_v4_ai_value_proof_gap"
                : "saas_usage_v4_monthly_utilization",
            scenario_thread_id:
              product_name.includes("Copilot") ||
              product_name.includes("Claude") ||
              product_name.includes("Agent") ||
              product_name.includes("Assist")
                ? "ai_value_proof_gap"
                : "saas_rationalization",
            tool_id,
            product_id: tool_id,
            product_name,
            sku_id,
            contract_id: contract.contract_id,
            vendor_id,
            tenant_subscription_workspace_id: `TENANT-${function_ref}`,
            function_ref,
            team_ref: `TEAM-${function_ref.toUpperCase()}`,
            assigned_seats: Math.round(base * 1.08),
            active_users: Math.round(
              base * adoption + (months.indexOf(month) % 5) * 11,
            ),
            inactive_users: Math.round(base * (1 - adoption)),
            paid_seats: Math.round(base * 1.12),
            overage_seats: months.indexOf(month) % 11 === 0 ? 15 : 0,
            usage_metric_name: "monthly_active_users",
            usage_count: Math.round(base * adoption),
            last_activity_band: adoption > 0.5 ? "0-30_days" : "31-90_days",
            month,
            period_start: month,
            period_end: monthEnd(month),
            unit_cost:
              product_name === "Claude Code"
                ? 39
                : product_name.includes("Copilot")
                  ? 30
                  : 24,
            committed_amount: money(base * 30),
            actual_cost: money(
              Math.round(base * 1.08) *
                (product_name === "Claude Code"
                  ? 39
                  : product_name.includes("Copilot")
                    ? 30
                    : 24),
            ),
            allocation_basis: "assigned_seats_by_function",
            renewal_true_up_linkage: `REN-${contract.contract_id}`,
            recoverability_state:
              months.indexOf(month) % 13 === 0
                ? "true_up_window_open"
                : "recoverability_requires_notice",
            usage_evidence_state: "admin_export",
            baseline_metric_state:
              months.indexOf(month) < 12
                ? "pre_baseline_period"
                : "post_metric_present",
            finance_validation_state:
              months.indexOf(month) > 20
                ? "sample_reviewed"
                : "not_finance_validated",
            claimable_value_state: "not_claimable",
          }),
        );
      }
    }
  }
  return rows;
}

function buildCloudConsumption(contracts) {
  const months = monthStarts();
  const services = [
    "Virtual Machines",
    "Storage",
    "Azure SQL",
    "AKS",
    "Data Factory",
    "Network",
  ];
  const rows = [];
  const cloudContracts = contracts
    .filter((contract) => ["VND-0001", "VND-0002"].includes(contract.vendor_id))
    .slice(0, 8);
  for (let account = 0; account < 24; account += 1) {
    const contract =
      cloudContracts[account % cloudContracts.length] || contracts[0];
    for (const service_name of services) {
      for (const month of months) {
        const monthly = contract.annual_value / 12 / 24;
        rows.push(
          common({
            source_system:
              account % 2 === 0
                ? "Azure Cost Management"
                : "AWS Cost and Usage Report",
            source_module:
              account % 2 === 0 ? "Cost Management Exports" : "Billing Export",
            source_object:
              account % 2 === 0
                ? "Actual cost and amortized cost export"
                : "AWS CUR line item export",
            source_record_id: `CLOUD-${String(account + 1).padStart(3, "0")}-${service_name.replaceAll(" ", "")}-${month.slice(0, 7)}`,
            source_record_url_or_path: `/reports/cloud/cost_export_${AS_OF_DATE}.csv#${account + 1}-${service_name}-${month.slice(0, 7)}`,
            extract_job_id: "extract-cloud-cost-20270701-001",
            extract_method: "report_export",
            business_owner_role: "Director, Cloud FinOps",
            technical_owner_role: "Cloud Platform Owner",
            quality_state: account % 17 === 0 ? "partial" : "accepted",
            evidence_state: "system_metric",
            synthetic_generation_rule:
              "cloud_consumption_v4_commitment_exposure",
            scenario_thread_id: "cloud_commitment_exposure",
            contract_id: contract.contract_id,
            vendor_id: contract.vendor_id,
            billing_account: `BILL-${String(account + 1).padStart(4, "0")}`,
            subscription_id: `SUB-${String(account + 1).padStart(4, "0")}`,
            account_id: `ACCT-${String(account + 1).padStart(4, "0")}`,
            project_id: `PRJ-${String(account + 1).padStart(4, "0")}`,
            service_name,
            meter: `${service_name} meter`,
            region: ["eastus", "centralus", "westus2", "westeurope"][
              account % 4
            ],
            resource_group_tag: `rg-${functions[account % functions.length]}`,
            commitment_id: `COMMIT-${contract.contract_id}`,
            commitment_type:
              account % 3 === 0 ? "reserved_instance" : "enterprise_commit",
            reserved_instance_marker: account % 3 === 0 ? "true" : "false",
            period_start: month,
            period_end: monthEnd(month),
            usage_quantity: money(
              900 + account * 12 + months.indexOf(month) * 3,
            ),
            usage_unit: service_name === "Storage" ? "gb_month" : "unit_hours",
            list_cost: money(monthly * 1.14),
            negotiated_rate: money(monthly * 0.92),
            actual_cost: money(monthly * (0.82 + (account % 7) / 20)),
            amortized_cost: money(monthly * (0.88 + (account % 5) / 30)),
            credit_discount_type:
              account % 5 === 0 ? "enterprise_discount" : "standard_discount",
            overage_amount: account % 11 === 0 ? money(monthly * 0.08) : 0,
            allocation_method:
              account % 4 === 0 ? "tagged_application" : "cost_center_rule",
            allocation_confidence: account % 4 === 0 ? "reviewed" : "inferred",
            forecast_state:
              account % 6 === 0 ? "under_consuming_commit" : "on_track",
            optimization_recommendation_state:
              account % 6 === 0 ? "review_commit_before_renewal" : "monitor",
          }),
        );
      }
    }
  }
  return rows;
}

function buildServicePerformance(contracts) {
  const months = monthStarts();
  const metrics = [
    "Availability",
    "P1 incident restoration",
    "Request fulfillment",
    "Batch completion",
  ];
  const rows = [];
  for (const contract of contracts.slice(0, 75)) {
    for (const metric_name of metrics) {
      for (const month of months) {
        const breach =
          (Number(contract.contract_id.slice(-2)) +
            months.indexOf(month) +
            metrics.indexOf(metric_name)) %
            9 ===
          0;
        rows.push(
          common({
            source_system: "ServiceNow",
            source_module: "Vendor Management, ITSM, APM, CMDB, SLA Management",
            source_object: "Vendor KPI monthly and SLA result export",
            source_record_id: `SNOW-SLA-${contract.contract_id}-${metric_name.replaceAll(" ", "-")}-${month.slice(0, 7)}`,
            source_record_url_or_path: `/reports/servicenow/sla_results_${AS_OF_DATE}.csv#${contract.contract_id}-${month.slice(0, 7)}`,
            extract_job_id: "extract-servicenow-sla-20270701-001",
            extract_method: "report_export",
            business_owner_role: "VP Enterprise Platforms",
            technical_owner_role: "ServiceNow Platform Owner",
            quality_state: breach ? "reviewed" : "accepted",
            evidence_state: "system_metric",
            synthetic_generation_rule: breach
              ? "service_performance_v4_earned_unclaimed_credit"
              : "service_performance_v4_monthly_sla",
            scenario_thread_id: breach
              ? "managed_service_value_leakage"
              : contract.scenario_thread_id,
            contract_id: contract.contract_id,
            service_id: `SVC-${String(Number(contract.contract_id.slice(-3)) % 60).padStart(3, "0")}`,
            application_id: `APP-${String(Number(contract.contract_id.slice(-3)) % 220).padStart(4, "0")}`,
            metric_name,
            target: metric_name === "Availability" ? "99.90" : "95.00",
            actual: breach
              ? metric_name === "Availability"
                ? "99.42"
                : "88.50"
              : metric_name === "Availability"
                ? "99.95"
                : "97.20",
            unit:
              metric_name === "Availability" ? "percent" : "percent_within_sla",
            period_start: month,
            period_end: monthEnd(month),
            breach_count: breach ? 1 + (months.indexOf(month) % 3) : 0,
            severity_mix: breach ? "P1:1;P2:3;P3:9" : "P2:1;P3:4",
            incident_count: breach ? 32 : 11,
            request_count: 800 + months.indexOf(month) * 7,
            change_count: 40 + (months.indexOf(month) % 5),
            credit_eligible: breach ? "true" : "false",
            credit_calculated: breach
              ? money((contract.annual_value / 12) * 0.012)
              : 0,
            credit_earned: breach
              ? money((contract.annual_value / 12) * 0.012)
              : 0,
            credit_claimed:
              breach && months.indexOf(month) % 4 === 0
                ? money((contract.annual_value / 12) * 0.004)
                : 0,
            credit_recovered:
              breach && months.indexOf(month) % 6 === 0
                ? money((contract.annual_value / 12) * 0.002)
                : 0,
            claim_state: breach ? "earned_not_fully_claimed" : "not_applicable",
            root_cause_category: breach ? "vendor_operations" : "within_target",
            vendor_responsibility_marker: breach
              ? "vendor_responsible"
              : "not_applicable",
            dispute_status:
              breach && months.indexOf(month) % 5 === 0
                ? "supplier_disputed"
                : "not_disputed",
            review_state: breach ? "reviewed" : "system_record",
          }),
        );
      }
    }
  }
  return rows;
}

function buildWorkforce(contracts) {
  const roles = [
    "Application Architect",
    "Data Engineer",
    "Service Desk Analyst",
    "SAP Functional Lead",
    "Cloud Engineer",
    "Integration Developer",
  ];
  const rows = [];
  for (let i = 0; i < 2_400; i += 1) {
    const contract = contracts[i % contracts.length];
    const sequence = Math.floor(i / roles.length) + 1;
    const role = roles[i % roles.length];
    const approved = 82 + (i % 11) * 9;
    const drift = i % 29 === 0;
    rows.push(
      common({
        source_system: "SAP Fieldglass",
        source_module: "Services Procurement / External Workforce",
        source_object: "Work Order Status and Time Sheet Status reports",
        source_record_id: `FG-WO-${String(i + 1).padStart(6, "0")}`,
        source_record_url_or_path: `/reports/fieldglass/work_order_status_${AS_OF_DATE}.csv#${i + 1}`,
        extract_job_id: "extract-fieldglass-20270701-001",
        extract_method: "report_export",
        business_owner_role: "Director, External Workforce",
        technical_owner_role: "VMS Administrator",
        quality_state: drift ? "disputed" : "accepted",
        evidence_state: "source_record",
        synthetic_generation_rule: drift
          ? "workforce_rate_card_v4_rate_drift"
          : "workforce_rate_card_v4_sow_delivery",
        scenario_thread_id: drift
          ? "managed_service_value_leakage"
          : contract.scenario_thread_id,
        contract_id: contract.contract_id,
        sow_id: `SOW-${contract.contract_id}-${String((sequence % 6) + 1).padStart(2, "0")}`,
        work_order_id: `WO-${String(i + 1).padStart(6, "0")}`,
        role,
        role_title: role,
        level: ["L2", "L3", "L4", "Lead"][i % 4],
        location: ["US", "India", "Mexico", "Poland"][i % 4],
        rate_card_id: `RC-${contract.contract_id}`,
        rate_effective_start: "2026-01-01",
        rate_effective_end: "2027-12-31",
        worker_ref: `WRKREF-${String(i + 1).padStart(6, "0")}`,
        bill_rate: drift ? money(approved * 1.11) : approved,
        billed_rate: drift ? money(approved * 1.11) : approved,
        approved_rate: approved,
        currency: "USD",
        hours: 120 + (i % 40),
        utilization: money(0.72 + (i % 18) / 100),
        blended_rate: drift ? money(approved * 1.06) : money(approved * 0.98),
        onshore_offshore_mix: i % 4 === 0 ? "onshore" : "offshore",
        variance: drift ? money(approved * 0.11) : 0,
        approval_state: drift ? "variance_unapproved" : "approved",
        reason_code: drift ? "rate_card_amendment_missing" : "standard_rate",
        change_order_id:
          i % 13 === 0
            ? `CO-${contract.contract_id}-${String(i % 9).padStart(2, "0")}`
            : "",
        rate_card_amendment_exists: drift ? "false" : "true",
      }),
    );
  }
  return rows;
}

function buildSourcingEvents(suppliers) {
  const rows = [];
  for (let event = 0; event < 12; event += 1) {
    for (let supplier = 0; supplier < 6; supplier += 1) {
      for (let req = 0; req < 10; req += 1) {
        const vendor = suppliers[(event * 5 + supplier) % suppliers.length];
        const headline = 8_000_000 + supplier * 420_000 - event * 20_000;
        const normalized =
          headline +
          (supplier === 0 ? 1_900_000 : supplier === 1 ? 650_000 : 180_000);
        rows.push(
          common({
            source_system: "SAP Ariba Strategic Sourcing",
            source_module: "Strategic Sourcing",
            source_object: "Sourcing event content and response export",
            source_record_id: `ARIBA-SRC-EVT-${String(event + 1).padStart(3, "0")}-SUP-${supplier + 1}-REQ-${req + 1}`,
            source_record_url_or_path: `/reports/sourcing/event_response_export_${AS_OF_DATE}.csv#EVT-${event + 1}-${supplier + 1}-${req + 1}`,
            extract_job_id: "extract-ariba-sourcing-20270701-001",
            extract_method: "report_export",
            business_owner_role: "Director, Strategic Sourcing",
            technical_owner_role: "Sourcing Platform Administrator",
            quality_state: "reviewed",
            evidence_state: "source_record",
            synthetic_generation_rule:
              supplier === 0
                ? "sourcing_event_v4_headline_low_normalized_high"
                : "sourcing_event_v4_supplier_bafo",
            scenario_thread_id: "supplier_bafo_normalization",
            event_id: `EVT-${String(event + 1).padStart(4, "0")}`,
            event_type: event % 3 === 0 ? "RFP" : "BAFO",
            stage: event % 3 === 0 ? "evaluation" : "bafo",
            round: event % 3 === 0 ? "round_1" : "bafo_round",
            lot_package: [
              "AMS",
              "Cloud FinOps",
              "SaaS Optimization",
              "Service Desk",
            ][event % 4],
            requirement_id: `REQ-${String(req + 1).padStart(3, "0")}`,
            scoring_weight: 5 + (req % 5) * 5,
            supplier_id: vendor.supplier_id,
            vendor_id: vendor.vendor_id,
            response_id: `RESP-EVT-${String(event + 1).padStart(4, "0")}-${vendor.vendor_id}`,
            response_status: "submitted",
            submitted_timestamp: `2027-05-${String(10 + supplier).padStart(2, "0")}T14:00:00.000Z`,
            bafo_marker: event % 3 === 0 ? "false" : "true",
            commercial_line_item: `Line ${req + 1}`,
            unit: "annual_service",
            volume_assumption: 1000 + req * 50,
            price: money(headline / 10),
            transition_cost:
              supplier === 0 ? 1_900_000 : 450_000 + supplier * 100_000,
            optional_excluded_cost: supplier === 0 ? 850_000 : 120_000,
            technical_score: 70 + ((supplier + req) % 25),
            commercial_score: 82 - supplier * 2 + (req % 4),
            risk_score: 20 + supplier * 8,
            score: 76 + supplier + (req % 6),
            evaluator_role: "Sourcing Evaluation Panel",
            exception_type:
              supplier === 0
                ? "excluded_transition_cost"
                : "standard_exception",
            clarification_state:
              supplier === 0 ? "requires_normalization" : "clarified",
            normalized_cost: normalized,
            line_item_cost: headline,
            comparability_flag:
              supplier === 0 ? "not_comparable_until_normalized" : "comparable",
            unresolved_gap_reason:
              supplier === 0 ? "transition_cost_excluded_from_headline" : "",
          }),
        );
      }
    }
  }
  return rows;
}

function buildScopeMappings(contracts) {
  const rows = [];
  for (let i = 0; i < 5_200; i += 1) {
    const contract = contracts[i % contracts.length];
    const explicit = i < 2_600;
    rows.push(
      common({
        source_system: explicit ? "SAP Ariba Contracts" : "LeanIX",
        source_module: explicit ? "Contracts" : "Enterprise Architecture / APM",
        source_object: explicit
          ? "SOW scope schedule export"
          : "Application Fact Sheet export",
        source_record_id: `SCOPE-${String(i + 1).padStart(6, "0")}`,
        source_record_url_or_path: explicit
          ? `/reports/contracts/sow_scope_schedule_${AS_OF_DATE}.csv#${i + 1}`
          : `/reports/leanix/application_fact_sheets_${AS_OF_DATE}.csv#${i + 1}`,
        extract_job_id: explicit
          ? "extract-ariba-scope-20270701-001"
          : "extract-leanix-apm-20270701-001",
        extract_method: "report_export",
        business_owner_role: "Director, Enterprise Architecture",
        technical_owner_role: "EA Tool Owner",
        quality_state: explicit ? "reviewed" : "inferred",
        evidence_state: explicit
          ? "source_record"
          : "inferred_from_relationship",
        synthetic_generation_rule: explicit
          ? "scope_mapping_v4_explicit_contract_scope"
          : "scope_mapping_v4_inferred_provider_mapping",
        scenario_thread_id:
          i % 17 === 0
            ? "app_retirement_contract_conflict"
            : contract.scenario_thread_id,
        contract_id: contract.contract_id,
        vendor_id: contract.vendor_id,
        application_id: `APP-${String((i % 720) + 1).padStart(4, "0")}`,
        platform_id: `PLAT-${String((i % 160) + 1).padStart(4, "0")}`,
        service_id: `SVC-${String((i % 260) + 1).padStart(4, "0")}`,
        application_name: [
          "Crew Planning",
          "Passenger Service",
          "Revenue Management",
          "Maintenance Control",
          "Finance ERP",
          "Workday HR",
        ][i % 6],
        platform_name: [
          "SAP S/4HANA",
          "ServiceNow",
          "Azure Data Factory",
          "Snowflake",
          "Ab Initio",
          "Mainframe COBOL",
        ][i % 6],
        business_capability: [
          "Crew Operations",
          "Customer Recovery",
          "Revenue Planning",
          "Maintenance Safety",
          "Finance Close",
          "HR Workforce",
        ][i % 6],
        criticality:
          i % 5 === 0 ? "Tier 1" : i % 3 === 0 ? "Critical" : "Tier 2",
        lifecycle:
          i % 19 === 0
            ? "retire_candidate"
            : i % 11 === 0
              ? "modernize"
              : "run",
        hosting_model: ["SaaS", "Azure", "AWS", "On premise", "Private cloud"][
          i % 5
        ],
        relationship_method: explicit
          ? "explicit_contract_scope"
          : "inferred_provider_mapping",
        relationship_confidence: explicit ? "0.92" : "0.61",
        relationship_source: explicit
          ? "contract_scope_schedule"
          : "cmdb_provider_field",
        review_state: explicit ? "reviewed" : "requires_owner_review",
        retirement_modernization_milestone:
          i % 19 === 0 ? "planned_retirement_before_renewal" : "",
        dependency:
          i % 13 === 0
            ? "upstream_integration_dependency"
            : "standard_service_dependency",
      }),
    );
  }
  return rows;
}

function buildFiles() {
  const suppliers = buildSuppliers();
  const contracts = buildContracts(suppliers);
  const files = {
    "suppliers/ARIBA_SUPPLIERS.csv": {
      domain_contract: "supplier_master",
      grain: "supplier",
      primary_key: ["vendor_id"],
      rows: suppliers,
    },
    "contracts/ARIBA_CONTRACT_WORKSPACES.csv": {
      domain_contract: "contract_header",
      grain: "contract_family",
      primary_key: ["contract_id"],
      rows: contracts,
    },
    "legal/SHAREPOINT_CONTRACT_EVIDENCE.csv": {
      domain_contract: "legal_evidence",
      grain: "clause_span",
      primary_key: ["file_id", "clause_type"],
      rows: buildLegalEvidence(contracts),
    },
    "finance/S4_VENDOR_INVOICE_LINES.csv": {
      domain_contract: "financial_line",
      grain: "invoice_line",
      primary_key: ["invoice_id", "invoice_line"],
      rows: buildFinanceLines(contracts),
    },
    "usage/ENTRA_SAAS_USAGE_MONTHLY.csv": {
      domain_contract: "saas_usage",
      grain: "tool_sku_function_month",
      primary_key: ["tool_id", "sku_id", "function_ref", "period_start"],
      time_series: true,
      expected_months: 24,
      require_complete_months: true,
      rows: buildSaasUsage(contracts),
    },
    "cloud/AZURE_COST_MONTHLY.csv": {
      domain_contract: "cloud_consumption",
      grain: "subscription_service_region_month",
      primary_key: [
        "subscription_id",
        "service_name",
        "region",
        "period_start",
      ],
      time_series: true,
      expected_months: 24,
      require_complete_months: true,
      rows: buildCloudConsumption(contracts),
    },
    "performance/SERVICENOW_SLA_MONTHLY.csv": {
      domain_contract: "service_performance",
      grain: "contract_service_metric_month",
      primary_key: ["contract_id", "service_id", "metric_name", "period_start"],
      time_series: true,
      expected_months: 24,
      require_complete_months: true,
      rows: buildServicePerformance(contracts),
    },
    "workforce/FIELDGLASS_RATE_CARD.csv": {
      domain_contract: "workforce_rate_card",
      grain: "work_order_role_period",
      primary_key: ["work_order_id"],
      rows: buildWorkforce(contracts),
    },
    "sourcing/ARIBA_SOURCING_EVENTS.csv": {
      domain_contract: "sourcing_event",
      grain: "event_supplier_requirement_response",
      primary_key: ["event_id", "supplier_id", "requirement_id"],
      rows: buildSourcingEvents(suppliers),
    },
    "scope/LEANIX_CONTRACT_SCOPE.csv": {
      domain_contract: "scope_mapping",
      grain: "contract_to_application_platform_service",
      primary_key: ["source_record_id"],
      rows: buildScopeMappings(contracts),
    },
  };
  return files;
}

function fileDeclaration(file, payload, csv) {
  return {
    file,
    domain_contract: payload.domain_contract,
    grain: payload.grain,
    primary_key: payload.primary_key,
    expected_rows: payload.rows.length,
    allow_duplicate_source_record_id: false,
    ...(payload.time_series
      ? {
          time_series: true,
          expected_months: payload.expected_months,
          require_complete_months: payload.require_complete_months,
        }
      : {}),
    sha256: sha256(csv),
  };
}

function buildManifest(fileEntries) {
  return {
    dataset_id: DATASET_ID,
    dataset_version: DATASET_VERSION,
    tenant_key: TENANT_KEY,
    as_of_date: AS_OF_DATE,
    generated_at: new Date().toISOString(),
    generator: "scripts/source/build-skyharbor-v4-synthetic-package.mjs",
    package_mode: "full",
    privacy:
      "Synthetic only. No employee names, personal emails, phone numbers or employee IDs.",
    period_window: {
      start: PERIOD_START,
      end: PERIOD_END,
      expected_months: 24,
    },
    files: fileEntries.map(({ file, payload, csv }) =>
      fileDeclaration(file, payload, csv),
    ),
    references: [
      [
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "vendor_id",
        "suppliers/ARIBA_SUPPLIERS.csv",
        "vendor_id",
        false,
      ],
      [
        "legal/SHAREPOINT_CONTRACT_EVIDENCE.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        false,
      ],
      [
        "finance/S4_VENDOR_INVOICE_LINES.csv",
        "vendor_id",
        "suppliers/ARIBA_SUPPLIERS.csv",
        "vendor_id",
        false,
      ],
      [
        "finance/S4_VENDOR_INVOICE_LINES.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        true,
      ],
      [
        "usage/ENTRA_SAAS_USAGE_MONTHLY.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        false,
      ],
      [
        "cloud/AZURE_COST_MONTHLY.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        false,
      ],
      [
        "performance/SERVICENOW_SLA_MONTHLY.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        false,
      ],
      [
        "workforce/FIELDGLASS_RATE_CARD.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        false,
      ],
      [
        "sourcing/ARIBA_SOURCING_EVENTS.csv",
        "supplier_id",
        "suppliers/ARIBA_SUPPLIERS.csv",
        "supplier_id",
        false,
      ],
      [
        "scope/LEANIX_CONTRACT_SCOPE.csv",
        "contract_id",
        "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
        "contract_id",
        false,
      ],
    ].map(([file, column, ref_file, ref_column, allow_blank]) => ({
      file,
      column,
      ref_file,
      ref_column,
      allow_blank,
    })),
    portfolio_expectations: {
      material_vendors: 60,
      contract_families: 100,
      contract_tiers: {
        tier_1: 25,
        tier_2_min: 35,
        tier_2_max: 40,
        tier_3_min: 35,
        tier_3_max: 40,
      },
      legal_instruments_min: 275,
      legal_instruments_max: 350,
      explicit_contract_scope_min: 2000,
      explicit_contract_scope_max: 3000,
      inferred_contract_scope_min: 2000,
      inferred_contract_scope_max: 4000,
      structured_records_min: 180000,
      structured_records_max: 250000,
    },
    story_threads: {
      saas_rationalization: {
        minimum_records: 1000,
        required_domains: ["contract_header", "saas_usage", "financial_line"],
      },
      managed_service_value_leakage: {
        minimum_records: 1000,
        required_domains: [
          "contract_header",
          "workforce_rate_card",
          "financial_line",
          "service_performance",
        ],
      },
      cloud_commitment_exposure: {
        minimum_records: 500,
        required_domains: [
          "contract_header",
          "cloud_consumption",
          "financial_line",
        ],
      },
      app_retirement_contract_conflict: {
        minimum_records: 250,
        required_domains: ["contract_header", "scope_mapping"],
      },
      ai_value_proof_gap: {
        minimum_records: 500,
        required_domains: [
          "saas_usage",
          "service_performance",
          "financial_line",
        ],
      },
      supplier_bafo_normalization: {
        minimum_records: 500,
        required_domains: ["sourcing_event", "supplier_master"],
      },
      evidence_conflict_resolution: {
        minimum_records: 100,
        required_domains: ["legal_evidence", "contract_header"],
      },
    },
    acceptance_rules: [
      "Every row carries source-system lineage and row_hash.",
      "Usage does not imply claimable value; AI rows require baseline and finance validation before value claims.",
      "Contract value conflicts remain disputed unless a reviewed winner is declared.",
      "Off-contract invoice rows remain loadable but are marked as quality observations.",
    ],
  };
}

function extractionInstructions() {
  return [
    "# Source v4 Operational Extraction Instructions",
    "",
    "This synthetic package mirrors the practical extraction plan for a large airline technology function. Client teams should pull these fields from systems of record rather than manually retyping them.",
    "",
    "| Extract | System of record | Where to get it | Join keys | Owner role |",
    "| --- | --- | --- | --- | --- |",
    "| Supplier master | SAP Ariba SLP or Coupa Supplier Management | Supplier Management > Export supplier profile and qualification status; include parent, category, risk and status history fields | supplier_id, vendor_id | Director, Supplier Management |",
    "| Contract workspaces | SAP Ariba Contracts, Icertis, DocuSign CLM | Contract Workspace Export Data plus active document package; preserve workspace ID, contract ID, SOW and amendment references | contract_id, workspace_id, supplier_id | CLM Administrator |",
    "| Legal evidence | SharePoint legal repository, Box, Google Drive, DocuSign | Export executed PDFs and clause extraction spans with page, section, prompt/model version and review state | file_id, contract_id, parent_document_id | Legal Operations Manager |",
    "| Invoice lines | SAP S/4HANA MM/FI/AP/CO, Oracle Fusion, Coupa P2P, Workday Financials | PO line, invoice line, payment and GL posting export for trailing 24 months | supplier_id, contract_id, po_number, invoice_id, cost_center | Director, IT Finance |",
    "| SaaS usage | Microsoft Entra, M365 Admin Center, Zylo, Productiv, Okta, GitHub admin | Monthly license assignment and active user reports by SKU, function and workspace | tool_id, sku_id, function_ref, period_start | Director, End User Computing |",
    "| Cloud consumption | Azure Cost Management, AWS CUR, GCP Billing Export, Apptio Cloudability | Scheduled actual and amortized cost exports by account, service, region, commitment and tag | subscription_id, account_id, commitment_id, period_start | Director, Cloud FinOps |",
    "| SLA performance | ServiceNow Vendor Management, ITSM, SLA Management, Datadog/Splunk | Vendor KPI monthly and SLA result export; preserve credit calculated, claimed and recovered separately | contract_id, service_id, metric_name, period_start | VP Enterprise Platforms |",
    "| Workforce rates | SAP Fieldglass, Beeline, Coupa Services Maestro | Work Order Status, Time Sheet Status, Invoice Details and Rate Card reports | sow_id, work_order_id, rate_card_id, worker_ref | Director, External Workforce |",
    "| Sourcing responses | SAP Ariba Sourcing, Coupa Sourcing Optimization, Ivalua, Jaggaer | Event content, participant, response, score, BAFO and award summary exports | event_id, supplier_id, response_id, requirement_id | Director, Strategic Sourcing |",
    "| Scope mapping | ServiceNow CMDB/APM, LeanIX, Apptio, EA repository | Application fact sheets, CMDB service/application inventory and SOW scope schedules | contract_id, application_id, platform_id, service_id | Director, Enterprise Architecture |",
    "",
    "Privacy rule: use role, team, function and worker references only. Do not extract personal names, emails, phone numbers or employee IDs.",
  ].join("\n");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
  const workDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `skyharbor-source-v4-${stamp}-`),
  );
  const csvRoot = path.join(workDir, "csv");
  await fs.mkdir(csvRoot, { recursive: true });

  const files = buildFiles();
  const fileEntries = [];
  for (const [file, payload] of Object.entries(files)) {
    const headers = [
      ...new Set([
        ...COMMON_COLUMNS,
        ...Object.keys(payload.rows[0]).filter(
          (header) => !COMMON_COLUMNS.includes(header),
        ),
        "row_hash",
      ]),
    ];
    const rows = withHashes(headers, payload.rows);
    const csv = toCsv(headers, rows);
    const fullPath = path.join(csvRoot, file);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, csv);
    fileEntries.push({ file, payload: { ...payload, rows }, csv });
  }

  const manifest = buildManifest(fileEntries);
  await fs.writeFile(
    path.join(csvRoot, "source_v4_package_manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(workDir, "SOURCE_EXTRACTION_INSTRUCTIONS.md"),
    extractionInstructions(),
  );
  await fs.writeFile(
    path.join(workDir, "README.md"),
    [
      "# SkyHarbor Source v4 Synthetic System Extracts",
      "",
      "Synthetic, system-of-record-shaped pressure-test package for Source v4.",
      "",
      `Dataset: ${DATASET_ID}`,
      `Tenant: ${TENANT_KEY}`,
      `As of: ${AS_OF_DATE}`,
      "",
      "Validate the unpacked `csv/` directory with:",
      "",
      "```bash",
      "npm run source:v4:row-depth:verify -- /path/to/csv",
      "```",
    ].join("\n"),
  );

  const zip = new JSZip();
  async function addDir(dir, prefix = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.join(prefix, entry.name);
      if (entry.isDirectory()) await addDir(full, rel);
      else zip.file(rel, await fs.readFile(full));
    }
  }
  await addDir(workDir);
  const packagePath = path.join(OUT_DIR, `${PACKAGE_NAME}_${stamp}.zip`);
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  await fs.writeFile(packagePath, buffer);

  const result = {
    ok: true,
    package_path: packagePath,
    package_sha256: sha256(buffer),
    csv_dir: csvRoot,
    dataset_id: DATASET_ID,
    dataset_version: DATASET_VERSION,
    tenant_key: TENANT_KEY,
    files: fileEntries.map(({ file, payload, csv }) => ({
      file,
      rows: payload.rows.length,
      sha256: sha256(csv),
    })),
    total_rows: fileEntries.reduce(
      (sum, { payload }) => sum + payload.rows.length,
      0,
    ),
    contract_annual_value: TARGET_CONTRACT_ANNUAL_VALUE,
    instructions: "SOURCE_EXTRACTION_INSTRUCTIONS.md",
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenantInputs = path.join(repoRoot, "datasets", "tenant-inputs");
const templateDir = path.join(tenantInputs, "templates", "standard-2026-07-v3-reload");
const outputReportDir = path.join(repoRoot, "reports", "ai-value-realization-day1");

const adapterFiles = {
  sa08: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
  sa09: "SA09_AI_Tool_Usage_Feed.csv",
  sa10: "SA10_AI_Value_Interview_Evidence.csv",
  sa11: "SA11_AI_KPI_Operational_Outcome_Feed.csv",
};

const sharedStatuses = [
  "not_started",
  "baseline_only",
  "usage_measured",
  "kpi_movement_seen",
  "finance_validated_partial",
  "realized_value_allowed",
  "not_claimable",
  "blocked_missing_baseline",
  "blocked_missing_usage",
  "blocked_missing_kpi_actual",
  "blocked_missing_finance_validation",
  "blocked_missing_owner",
];

const tenantProfiles = {
  "apex-retail": {
    label: "Retail Demo",
    industry: "specialty retail",
    prefix: "APX",
    functions: ["Stores", "Digital Commerce", "Merchandising", "Supply Chain", "Marketing", "Engineering"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Store and HQ Productivity Copilot", "PROG-STORE-COPILOT", "VP Store Operations", 4200000, 6200000, 700000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "Retail ITSM AI Resolution", "PROG-RETAIL-ITSM-AI", "VP IT Operations", 2300000, 3600000, 400000, "kpi_movement_seen", "scale"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Digital Commerce Engineering Copilot", "PROG-COMMERCE-ENG-AI", "VP Digital Engineering", 1700000, 3100000, 250000, "usage_measured", "scale"],
      ["Retail Media AI", "Adobe / Salesforce", "crm_contact_center_ai", "Retail Media Optimization AI", "PROG-RETAIL-MEDIA-AI", "CMO", 5200000, 9000000, 0, "blocked_missing_kpi_actual", "fix"],
      ["Inventory Availability AI", "Blue Yonder / Azure AI", "cloud_ai_services", "Inventory Availability and Allocation AI", "PROG-INVENTORY-AI", "SVP Supply Chain", 6800000, 12000000, 0, "baseline_only", "fix"],
      ["Customer 360 AI Foundation", "Databricks / Azure", "data_ai_platform", "Customer 360 and Loyalty Data Foundation", "PROG-C360-FOUNDATION", "CDAO", 7400000, 0, 0, "not_claimable", "needs_evidence"],
      ["AI Governance Controls", "OneTrust / Collibra", "ai_governance", "Retail AI Governance Controls", "PROG-AI-GOV", "CISO and CDAO", 3200000, 0, 0, "blocked_missing_owner", "needs_evidence"],
      ["Associate Task Agent", "Candidate", "copilot_productivity", "Associate Task Agent Candidate", "CAND-ASSOCIATE-AGENT", "VP Store Operations", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
  "first-capital-financial": {
    label: "Financial Services Demo",
    industry: "financial services",
    prefix: "FCF",
    functions: ["Fraud Operations", "AML/KYC", "Contact Center", "Lending", "Regulatory Reporting", "Engineering"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Banker Productivity Copilot", "PROG-BANKER-COPILOT", "Head of Retail Banking", 5800000, 7600000, 900000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "ITSM AI Resolution Pilot", "PROG-ITSM-AI", "CIO", 2800000, 4500000, 550000, "kpi_movement_seen", "scale"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Core Banking Engineering Copilot", "PROG-CORE-ENG-AI", "VP Engineering", 2100000, 3800000, 300000, "usage_measured", "scale"],
      ["Fraud Copilot", "SAS / Azure AI", "claims_ai", "Fraud Copilot Readiness", "PROG-FRAUD-COPILOT", "Chief Risk Officer", 7200000, 16000000, 0, "blocked_missing_finance_validation", "fix"],
      ["AML/KYC Operations Assist", "Pega / Azure AI", "ai_governance", "AML/KYC Operations Assist", "PROG-AML-KYC-AI", "BSA Officer", 6400000, 12000000, 0, "blocked_missing_kpi_actual", "fix"],
      ["Customer 360 AI Foundation", "Databricks / Azure", "data_ai_platform", "Customer 360 and Identity Resolution", "PROG-C360-AI", "CDAO", 9200000, 0, 0, "not_claimable", "needs_evidence"],
      ["Loan Operations AI", "nCino / Custom AI", "erp_ai", "Loan Operations Automation", "PROG-LOAN-AI", "COO Lending", 4300000, 6900000, 0, "baseline_only", "fix"],
      ["Regulatory Reporting AI", "Workiva / Snowflake", "ai_governance", "Regulatory Reporting Modernization", "CAND-REG-REPORT-AI", "Controller", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
  "lakeshore-holdings": {
    label: "Industrial Demo",
    industry: "industrial holding company",
    prefix: "LKH",
    functions: ["Shared Services", "Finance", "Treasury", "Legal", "HR", "Manufacturing Operations"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Shared Services Productivity Copilot", "PROG-SHARED-COPILOT", "VP Shared Services", 5200000, 7800000, 850000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "Enterprise Service Management AI", "PROG-ESM-AI", "CIO", 3100000, 5200000, 500000, "kpi_movement_seen", "scale"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Industrial App Engineering Copilot", "PROG-ENG-AI", "VP Engineering", 1900000, 3300000, 300000, "usage_measured", "scale"],
      ["Workday AI", "Workday", "workday_ai", "HR Service Delivery AI Pilot", "PROG-HR-AI", "CHRO", 2400000, 4100000, 0, "baseline_only", "fix"],
      ["ERP Finance AI", "SAP / Oracle", "erp_ai", "Finance Close and AP Automation AI", "PROG-FINANCE-AI", "CFO", 6100000, 11000000, 0, "blocked_missing_finance_validation", "fix"],
      ["Legal Intake AI", "Ironclad / Microsoft", "ai_governance", "Legal Intake and Contract Review AI", "PROG-LEGAL-AI", "General Counsel", 1800000, 2800000, 0, "blocked_missing_kpi_actual", "fix"],
      ["Data and Analytics AI Foundation", "Databricks / Azure", "data_ai_platform", "Industrial Data and AI Foundation", "PROG-DATA-AI", "CDAO", 8300000, 0, 0, "not_claimable", "needs_evidence"],
      ["Procurement Agent Assist", "Candidate", "ai_governance", "Procurement Agent Assist Candidate", "CAND-PROCURE-AI", "CPO", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
  "lakeshore-industries": {
    label: "Industrial Demo",
    industry: "industrial manufacturing",
    prefix: "LKI",
    functions: ["Manufacturing Operations", "Field Services", "Supply Chain", "Finance", "HR", "Engineering"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Plant and Field Productivity Copilot", "PROG-PLANT-COPILOT", "COO", 3900000, 5800000, 600000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "Field Service AI Triage", "PROG-FIELD-SNOW-AI", "VP Field Services", 2200000, 3500000, 350000, "kpi_movement_seen", "scale"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Factory App Engineering Copilot", "PROG-FACTORY-ENG-AI", "VP Engineering", 1500000, 2700000, 200000, "usage_measured", "scale"],
      ["SAP AI", "SAP", "erp_ai", "SAP Supply Chain AI Workflow Pilot", "PROG-SAP-SC-AI", "VP Supply Chain", 4700000, 8500000, 0, "baseline_only", "fix"],
      ["Workday AI", "Workday", "workday_ai", "Workforce Planning AI Pilot", "PROG-WORKFORCE-AI", "CHRO", 1600000, 2500000, 0, "blocked_missing_kpi_actual", "fix"],
      ["Quality Analytics AI", "Databricks / Azure AI", "data_ai_platform", "Quality Analytics AI Foundation", "PROG-QUALITY-AI", "VP Quality", 5400000, 0, 0, "not_claimable", "needs_evidence"],
      ["AI Governance Controls", "Collibra / Archer", "ai_governance", "Industrial AI Governance Controls", "PROG-AI-GOV", "CISO and CDAO", 2800000, 0, 0, "blocked_missing_owner", "needs_evidence"],
      ["Maintenance Copilot", "Candidate", "cloud_ai_services", "Maintenance Copilot Candidate", "CAND-MAINT-AI", "VP Maintenance", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
  "meridian-health": {
    label: "Healthcare Demo",
    industry: "healthcare payer-provider",
    prefix: "MER",
    functions: ["Member Services", "Clinical Operations", "Health Plan Operations", "Finance", "Engineering", "Data and Analytics"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Microsoft 365 Copilot Productivity Enablement", "PROG-COPILOT-ADOPT", "VP Workplace Technology", 10500000, 14000000, 2100000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "ServiceNow AI / ITSM Automation Pilot", "PROG-SNOW-AI", "VP Service Management", 4000000, 6000000, 800000, "kpi_movement_seen", "scale"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Developer Productivity AI / SDLC Automation", "PROG-DEV-PRODUCTIVITY", "VP Engineering", 2900000, 4500000, 500000, "usage_measured", "scale"],
      ["Workday AI", "Workday", "workday_ai", "Workday HR/Finance AI Workflow Pilot", "PROG-WORKDAY-AI", "CHRO and CFO", 1200000, 3000000, 400000, "usage_measured", "fix"],
      ["Contact Center Agent Assist", "Genesys / Azure OpenAI", "crm_contact_center_ai", "Contact Center Platform / Knowledge Modernization", "PROG-CONTACT-KNOW", "Chief Experience Officer", 16000000, 8000000, 0, "baseline_only", "fix"],
      ["Databricks AI Platform", "Databricks / AWS", "data_ai_platform", "Data Foundation / Lakehouse Modernization", "PROG-DATA-FOUNDATION", "CDAO", 14000000, 0, 0, "not_claimable", "needs_evidence"],
      ["AI Governance Controls", "Archer / Collibra", "ai_governance", "AI Governance / Model Risk Controls", "PROG-AI-GOV", "CISO and CDAO", 8000000, 0, 0, "blocked_missing_owner", "needs_evidence"],
      ["Member Service AI Assist", "Candidate", "crm_contact_center_ai", "Member Service AI Assist Candidate", "CAND-MEMBER-AI-ASSIST", "Chief Experience Officer", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
  "skyharbor-air": {
    label: "Airline Demo",
    industry: "airline",
    prefix: "SKY",
    functions: ["Operations", "Crew Operations", "Loyalty", "Customer Care", "Engineering", "Data and Analytics"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Crew and Station Productivity Copilot", "PROG-CREW-COPILOT", "VP Crew Operations", 7200000, 9800000, 1300000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "IROPS Service Desk Agent Assist", "PROG-IROPS-SNOW-AI", "VP IT Operations", 3600000, 6200000, 700000, "kpi_movement_seen", "fix"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Digital Engineering Copilot", "PROG-DIGITAL-ENG-AI", "VP Digital Engineering", 2400000, 4200000, 450000, "usage_measured", "scale"],
      ["Loyalty Personalization AI", "Salesforce / Adobe", "crm_contact_center_ai", "Loyalty Personalization AI", "PROG-LOYALTY-AI", "President Loyalty", 12500000, 18000000, 3200000, "finance_validated_partial", "scale"],
      ["Crew Recovery AI", "Lufthansa Systems / Azure AI", "cloud_ai_services", "Crew Recovery Copilot", "PROG-CREW-RECOVERY-AI", "EVP Operations", 10800000, 27000000, 0, "blocked_missing_kpi_actual", "fix"],
      ["Predictive Maintenance AI", "GE / Databricks", "data_ai_platform", "Predictive Maintenance AI", "PROG-MX-PREDICT", "SVP Maintenance", 8600000, 15000000, 0, "baseline_only", "needs_evidence"],
      ["IROPS Decision Assistant", "Custom / Azure AI", "cloud_ai_services", "IROPS Decision Assistant", "CAND-IROPS-DECISION-AI", "EVP Operations", 0, 0, 0, "not_claimable", "freeze"],
      ["Customer Disruption Recovery AI", "Candidate", "crm_contact_center_ai", "Customer Disruption Recovery AI", "CAND-CUST-DISRUPTION-AI", "President Customer", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
  "first-capital": {
    label: "Financial Services Demo",
    industry: "financial services",
    prefix: "FCF",
    functions: ["Fraud Operations", "AML/KYC", "Contact Center", "Lending", "Regulatory Reporting", "Engineering"],
    tools: [
      ["Microsoft 365 Copilot", "Microsoft", "copilot_productivity", "Banker Productivity Copilot", "PROG-BANKER-COPILOT", "Head of Retail Banking", 5800000, 7600000, 900000, "usage_measured", "scale"],
      ["ServiceNow Now Assist", "ServiceNow", "servicenow_ai", "ITSM AI Resolution Pilot", "PROG-ITSM-AI", "CIO", 2800000, 4500000, 550000, "kpi_movement_seen", "scale"],
      ["GitHub Copilot and Codex", "GitHub / OpenAI", "developer_productivity_ai", "Core Banking Engineering Copilot", "PROG-CORE-ENG-AI", "VP Engineering", 2100000, 3800000, 300000, "usage_measured", "scale"],
      ["Fraud Copilot", "SAS / Azure AI", "claims_ai", "Fraud Copilot Readiness", "PROG-FRAUD-COPILOT", "Chief Risk Officer", 7200000, 16000000, 0, "blocked_missing_finance_validation", "fix"],
      ["AML/KYC Operations Assist", "Pega / Azure AI", "ai_governance", "AML/KYC Operations Assist", "PROG-AML-KYC-AI", "BSA Officer", 6400000, 12000000, 0, "blocked_missing_kpi_actual", "fix"],
      ["Customer 360 AI Foundation", "Databricks / Azure", "data_ai_platform", "Customer 360 and Identity Resolution", "PROG-C360-AI", "CDAO", 9200000, 0, 0, "not_claimable", "needs_evidence"],
      ["Loan Operations AI", "nCino / Custom AI", "erp_ai", "Loan Operations Automation", "PROG-LOAN-AI", "COO Lending", 4300000, 6900000, 0, "baseline_only", "fix"],
      ["Regulatory Reporting AI", "Workiva / Snowflake", "ai_governance", "Regulatory Reporting Modernization", "CAND-REG-REPORT-AI", "Controller", 0, 0, 0, "not_claimable", "freeze"],
    ],
  },
};

const fieldInstructions = [
  ["source_record_id", "Stable row identifier for the source adapter row.", "required", "string", "tenant-defined ID", "SA09-USAGE-001", "yes", "Must be unique inside the adapter file.", "Home|Intelligence|Moves|Tower"],
  ["ai_program_id", "Program code or candidate code that ties usage/value evidence to the funded or candidate AI program.", "required", "string", "program_code or candidate code", "PROG-COPILOT-ADOPT", "yes", "Approved/funded rows must reconcile to 09 or SA04; candidates must be marked not approved.", "Intelligence|Moves|Tower"],
  ["ai_use_case_id", "Stable AI use case identifier used to join to dimension 10.", "required", "string", "tenant-defined ID", "UC-COPILOT-PRODUCTIVITY", "yes", "Must be present for rows consumed by Intelligence or Moves.", "Intelligence|Moves|Tower"],
  ["tool_name", "Name of the AI tool, product capability, agent, or platform capability being measured.", "required", "string", "vendor/tool name", "Microsoft 365 Copilot", "yes", "Cannot be blank when usage metrics are populated.", "Home|Intelligence|Tower"],
  ["usage_period_start", "Start date for the usage measurement window.", "required", "date", "yyyy-mm-dd", "2026-04-01", "yes", "Must be on or before usage_period_end.", "Tower|Intelligence"],
  ["usage_period_end", "End date for the usage measurement window.", "required", "date", "yyyy-mm-dd", "2026-06-30", "yes", "Must be on or after usage_period_start.", "Tower|Intelligence"],
  ["licensed_users", "Users or seats licensed for the AI tool during the period.", "optional", "number", "integer", "8000", "yes", "Must be >= enabled_users when both are provided.", "Tower"],
  ["enabled_users", "Users enabled or provisioned for the AI tool.", "optional", "number", "integer", "6400", "yes", "Must be >= active_users when both are provided.", "Tower"],
  ["active_users", "Users who actually used the AI capability in the period.", "required for usage claims", "number", "integer", "3200", "yes", "Usage-measured rows require active_users or usage_events.", "Tower|Intelligence"],
  ["usage_rate_pct", "Active users divided by enabled users, or a source-system equivalent adoption metric.", "required for usage claims", "percent", "0-100", "50.0", "yes", "Must be between 0 and 100.", "Tower|Intelligence"],
  ["usage_events", "Prompts, actions, agent conversations, accepted suggestions, transactions touched, or source-specific usage event count.", "optional", "number", "integer", "125000", "yes", "Must be non-negative.", "Tower|Intelligence"],
  ["baseline_metric", "Business or delivery metric before the AI capability was deployed.", "required", "string", "metric name", "Average handle time", "yes", "Every value claim needs a baseline metric.", "Tower|Moves"],
  ["target_metric", "Target metric value or target metric name from the business case.", "required", "string/number", "metric target", "Reduce AHT by 8%", "yes", "Every promised value needs a target.", "Tower|Moves"],
  ["actual_metric", "Measured current-state metric value from telemetry or operations reports.", "required for value claims", "string/number", "metric actual", "AHT down 3%", "yes", "Finance-validated or realized claims require actual_metric.", "Tower|Intelligence"],
  ["promised_value_usd", "Business-case or vendor-promised value; not realized value.", "optional", "number", "USD integer", "14000000", "yes", "Must not be displayed as realized value.", "Tower|Intelligence"],
  ["finance_validated_value_usd", "Finance-attested partial or full value validated against actuals.", "optional", "number", "USD integer", "2100000", "yes", "Required before any realized-value claim.", "Tower"],
  ["value_claim_status", "Claim gate status for the row.", "required", "enum", sharedStatuses.join("|"), "usage_measured", "yes", "realized_value_allowed requires usage, KPI actual, finance value, and evidence.", "Tower|Intelligence|Moves"],
  ["decision_action", "Recommended action for the program or use case based on usage and value proof.", "required", "enum", "scale|fix|freeze|stop|continue_monitoring|needs_evidence|needs_finance_validation", "fix", "yes", "Candidates with no funding should be freeze or needs_evidence.", "Moves|Tower|Intelligence"],
  ["evidence_source_system", "System of record or export source for the telemetry.", "required", "string", "source system", "Microsoft 365 Admin Center", "yes", "Must identify where the usage/value evidence comes from.", "Home|Tower"],
  ["owner_attestation_status", "Whether a named business/IT/finance owner has attested the metric.", "required", "enum", "not_requested|requested|business_attested|it_attested|finance_attested|rejected", "requested", "yes", "Finance-attested value requires finance_attested.", "Tower|Moves"],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (inQuotes) {
      if (c === '"' && n === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v !== ""));
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const header = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(header.map((h, i) => [h, row[i] ?? ""])));
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function writeCsv(filePath, rows, header) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [header.join(",")];
  for (const row of rows) lines.push(header.map((h) => csvEscape(row[h] ?? "")).join(","));
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

function pct(active, enabled) {
  if (!enabled) return 0;
  return Math.round((active / enabled) * 1000) / 10;
}

function statusToAllowed(status) {
  if (status === "realized_value_allowed") return "yes";
  if (status === "finance_validated_partial" || status === "kpi_movement_seen" || status === "usage_measured") return "partial";
  return "no";
}

function syntheticRowsFor(profile) {
  const sa08 = [];
  const sa09 = [];
  const sa10 = [];
  const sa11 = [];
  profile.tools.forEach((tool, index) => {
    const [toolName, vendorName, category, programName, programCode, owner, spend, promised, validated, status, action] = tool;
    const id = String(index + 1).padStart(3, "0");
    const functionName = profile.functions[index % profile.functions.length];
    const useCaseId = `${profile.prefix}-AI-UC-${id}`;
    const sourceRecordId = `SA08-BEN-${id}`;
    const enabled = spend > 0 ? 900 + index * 275 : 0;
    const active = spend > 0 ? Math.round(enabled * (0.34 + (index % 4) * 0.08)) : 0;
    const licensed = spend > 0 ? Math.round(enabled * 1.15) : 0;
    const usageEvents = spend > 0 ? active * (18 + index * 3) : 0;
    const baselineMetric = category === "developer_productivity_ai" ? "Lead time for changes" : category === "servicenow_ai" ? "Ticket resolution time" : category === "copilot_productivity" ? "Knowledge-worker time to draft/review" : "Process cycle time";
    const targetMetric = category === "developer_productivity_ai" ? "Reduce lead time 15%" : category === "servicenow_ai" ? "Reduce MTTR 12%" : category === "copilot_productivity" ? "Increase active weekly usage to 60%" : "Reduce cycle time 10%";
    const actualMetric = status === "not_claimable" || status.startsWith("blocked") || status === "baseline_only" ? "" : category === "developer_productivity_ai" ? "Lead time down 6%" : category === "servicenow_ai" ? "MTTR down 5%" : "Partial movement observed";
    const evidenceId = `${profile.prefix}-DAY1-AI-EVID-${id}`;
    const sourceSystem = category === "copilot_productivity" ? "Microsoft 365 Admin Center / Copilot usage export" : category === "servicenow_ai" ? "ServiceNow Virtual Agent and ITSM analytics" : category === "developer_productivity_ai" ? "GitHub Copilot metrics and DORA dashboard" : category === "workday_ai" ? "Workday analytics export" : category === "erp_ai" ? "ERP workflow analytics export" : "AI platform usage and KPI export";
    sa08.push({
      tenant_key: profile.key,
      source_record_id: sourceRecordId,
      ai_program_id: programCode,
      program_name: programName,
      ai_use_case_id: useCaseId,
      vendor_name: vendorName,
      tool_name: toolName,
      business_function: functionName,
      process_area: programName,
      promised_benefit_type: promised > 0 ? "productivity_or_cycle_time" : "readiness_or_candidate",
      promised_value_usd: promised,
      funded_spend_usd: spend,
      actual_spend_ytd_usd: Math.round(spend * 0.42),
      baseline_metric: baselineMetric,
      baseline_value: "baseline_required_or_partially_loaded",
      target_metric: targetMetric,
      target_value: targetMetric,
      usage_metric: "active_users_or_agent_events",
      usage_target: enabled ? Math.round(enabled * 0.6) : 0,
      usage_actual: active,
      adoption_rate_pct: pct(active, enabled),
      enabled_users: enabled,
      active_users: active,
      usage_rate_pct: pct(active, enabled),
      operational_kpi: baselineMetric,
      kpi_baseline: "loaded_or_requested",
      kpi_actual: actualMetric,
      finance_validated_value_usd: validated,
      finance_validation_status: validated > 0 ? "finance_validated_partial" : "not_validated",
      value_claim_status: status,
      evidence_id: evidenceId,
      source_extract: sourceSystem,
      refresh_cadence: "monthly",
      tower_claim_allowed: statusToAllowed(status),
      caveat: "Synthetic Day 1 planning context; value is not realized unless usage, KPI movement, and finance validation are all evidenced.",
      evidence_type: "source_adapter_synthetic",
      evidence_owner: owner,
      evidence_source_system: sourceSystem,
      evidence_extract_date: "2026-07-18",
      evidence_period_start: "2026-04-01",
      evidence_period_end: "2026-06-30",
      evidence_refresh_cadence: "monthly",
      evidence_freshness_status: "current",
      owner_attestation_status: validated > 0 ? "finance_attested" : "requested",
      duplicate_risk: spend > 0 ? "platform_overlap" : "none",
      additive_status: "non_additive_lens",
      realized_value_allowed: "false",
      decision_action: action,
    });
    sa09.push({
      tenant_key: profile.key,
      source_record_id: `SA09-USAGE-${id}`,
      ai_program_id: programCode,
      ai_use_case_id: useCaseId,
      vendor_name: vendorName,
      tool_name: toolName,
      tool_category: category,
      business_function: functionName,
      process_area: programName,
      usage_period_start: "2026-04-01",
      usage_period_end: "2026-06-30",
      licensed_users: licensed,
      enabled_users: enabled,
      active_users: active,
      power_users: active ? Math.round(active * 0.18) : 0,
      usage_events: usageEvents,
      usage_rate_pct: pct(active, enabled),
      adoption_target_pct: enabled ? 60 : 0,
      adoption_gap_pct: enabled ? Math.round((60 - pct(active, enabled)) * 10) / 10 : 0,
      baseline_metric_name: baselineMetric,
      baseline_metric_value: "baseline_required_or_partially_loaded",
      target_metric_value: targetMetric,
      actual_metric_value: actualMetric,
      metric_unit: "mixed",
      promised_value_usd: promised,
      finance_validated_value_usd: validated,
      value_claim_status: status,
      evidence_id: evidenceId,
      source_system: sourceSystem,
      extract_date: "2026-07-18",
      business_owner: owner,
      it_owner: owner.includes("CIO") ? owner : "CIO delegate",
      finance_validator: validated > 0 ? "Finance value office" : "not_attested",
      confidence: validated > 0 ? "medium" : "planning",
      notes: "Day 1 template row; replace synthetic values with source export or API feed before client-grade claims.",
    });
    sa10.push({
      tenant_key: profile.key,
      source_record_id: `SA10-INT-${id}`,
      ai_program_id: programCode,
      ai_use_case_id: useCaseId,
      stakeholder_role: owner,
      interview_track: index % 2 === 0 ? "business" : "technical",
      question: `What evidence would prove ${programName} is working versus just being deployed?`,
      answer_summary: `${programName} needs usage telemetry, KPI movement, and finance validation before value can be claimed.`,
      what_is_working: active ? `${toolName} has measurable usage in the synthetic Day 1 telemetry.` : "Interest exists, but usage evidence is not loaded.",
      what_is_not_working: validated > 0 ? "Value is only partially finance validated." : "Finance validation and KPI actuals remain incomplete.",
      current_baseline: baselineMetric,
      target_or_promise: promised > 0 ? `$${promised} promised value requires proof.` : "Candidate/readiness opportunity; no approved value claim.",
      evidence_request: `Provide ${sourceSystem} export plus KPI baseline and owner attestation.`,
      follow_up_artifact_needed: "Monthly usage export; KPI baseline/actual report; finance value attestation",
      decision_pressure: action,
      named_owner: owner,
      confidence: validated > 0 ? "medium" : "planning",
      evidence_id: evidenceId,
    });
    sa11.push({
      tenant_key: profile.key,
      source_record_id: `SA11-KPI-${id}`,
      ai_program_id: programCode,
      ai_use_case_id: useCaseId,
      business_function: functionName,
      process_area: programName,
      kpi_name: baselineMetric,
      kpi_definition: `Business outcome metric used to validate whether ${programName} is producing value.`,
      baseline_value: "baseline_required_or_partially_loaded",
      target_value: targetMetric,
      actual_value: actualMetric,
      metric_unit: "mixed",
      measurement_period_start: "2026-04-01",
      measurement_period_end: "2026-06-30",
      measurement_owner: owner,
      source_system: sourceSystem,
      usage_record_ids: `SA09-USAGE-${id}`,
      benefit_record_ids: sourceRecordId,
      finance_validated_value_usd: validated,
      value_claim_status: status,
      tower_claim_allowed: statusToAllowed(status),
      evidence_id: evidenceId,
      caveat: "Operational KPI movement must be reconciled to finance before Tower may present realized value.",
    });
  });
  return { sa08, sa09, sa10, sa11 };
}

const headers = {
  sa08: [
    "tenant_key", "source_record_id", "ai_program_id", "program_name", "ai_use_case_id", "vendor_name", "tool_name", "business_function", "process_area", "promised_benefit_type", "promised_value_usd", "funded_spend_usd", "actual_spend_ytd_usd", "baseline_metric", "baseline_value", "target_metric", "target_value", "usage_metric", "usage_target", "usage_actual", "adoption_rate_pct", "enabled_users", "active_users", "usage_rate_pct", "operational_kpi", "kpi_baseline", "kpi_actual", "finance_validated_value_usd", "finance_validation_status", "value_claim_status", "evidence_id", "source_extract", "refresh_cadence", "tower_claim_allowed", "caveat", "evidence_type", "evidence_owner", "evidence_source_system", "evidence_extract_date", "evidence_period_start", "evidence_period_end", "evidence_refresh_cadence", "evidence_freshness_status", "owner_attestation_status", "duplicate_risk", "additive_status", "realized_value_allowed", "decision_action",
  ],
  sa09: [
    "tenant_key", "source_record_id", "ai_program_id", "ai_use_case_id", "vendor_name", "tool_name", "tool_category", "business_function", "process_area", "usage_period_start", "usage_period_end", "licensed_users", "enabled_users", "active_users", "power_users", "usage_events", "usage_rate_pct", "adoption_target_pct", "adoption_gap_pct", "baseline_metric_name", "baseline_metric_value", "target_metric_value", "actual_metric_value", "metric_unit", "promised_value_usd", "finance_validated_value_usd", "value_claim_status", "evidence_id", "source_system", "extract_date", "business_owner", "it_owner", "finance_validator", "confidence", "notes",
  ],
  sa10: [
    "tenant_key", "source_record_id", "ai_program_id", "ai_use_case_id", "stakeholder_role", "interview_track", "question", "answer_summary", "what_is_working", "what_is_not_working", "current_baseline", "target_or_promise", "evidence_request", "follow_up_artifact_needed", "decision_pressure", "named_owner", "confidence", "evidence_id",
  ],
  sa11: [
    "tenant_key", "source_record_id", "ai_program_id", "ai_use_case_id", "business_function", "process_area", "kpi_name", "kpi_definition", "baseline_value", "target_value", "actual_value", "metric_unit", "measurement_period_start", "measurement_period_end", "measurement_owner", "source_system", "usage_record_ids", "benefit_record_ids", "finance_validated_value_usd", "value_claim_status", "tower_claim_allowed", "evidence_id", "caveat",
  ],
};

function discoverTenantStandardDirs() {
  const standardDirs = fs.readdirSync(tenantInputs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .map((tenant) => ({ tenant, packet: "standard", dir: path.join(tenantInputs, tenant, "standard-2026-07-v3") }))
    .filter(({ dir }) => fs.existsSync(dir));
  const activeRoot = path.join(tenantInputs, "active");
  const activeDirs = fs.existsSync(activeRoot)
    ? fs.readdirSync(activeRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .map((tenant) => ({ tenant, packet: "active", dir: path.join(activeRoot, tenant, "current") }))
      .filter(({ dir }) => fs.existsSync(dir))
    : [];
  const seen = new Set();
  return [...standardDirs, ...activeDirs].filter((entry) => {
    const key = `${entry.tenant}|${entry.dir}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function writeTemplates() {
  for (const [key, fileName] of Object.entries(adapterFiles)) {
    writeCsv(path.join(templateDir, fileName.replace(".csv", "_TEMPLATE.csv")), [], headers[key]);
  }
  const instructionPath = path.join(templateDir, "AI_VALUE_REALIZATION_FIELD_INSTRUCTIONS.csv");
  writeCsv(instructionPath, fieldInstructions.map((row) => ({
    field_name: row[0],
    business_description: row[1],
    required_optional: row[2],
    expected_format: row[3],
    allowed_values: row[4],
    example_value: row[5],
    evidence_required: row[6],
    validation_rule: row[7],
    modules_consuming: row[8],
  })), ["field_name", "business_description", "required_optional", "expected_format", "allowed_values", "example_value", "evidence_required", "validation_rule", "modules_consuming"]);
}

function mergeEvidenceSources(dir, profile, rows) {
  const filePath = path.join(dir, "13_evidence_sources.csv");
  const existing = readCsv(filePath);
  let header = [];
  if (fs.existsSync(filePath)) {
    const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));
    header = parsed.shift() || [];
  }
  if (!header.length) return;
  for (const required of ["evidence_id", "business_name", "context_item", "dimension", "evidence_type", "evidence_location", "evidence_owner", "evidence_boundary", "module_usage_notes"]) {
    if (!header.includes(required)) header.push(required);
  }
  const cleanedExisting = existing.filter((row) => !(row.source_type === "synthetic_source_adapter" && !row.evidence_id && !row.source_file));
  const existingIds = new Set(existing.map((r) => r.evidence_id).filter(Boolean));
  const additions = rows.sa08
    .filter((row) => !existingIds.has(row.evidence_id))
    .map((row, idx) => {
      const out = Object.fromEntries(header.map((h) => [h, ""]));
      out.tenant_key = profile.key;
      out.record_id = `${profile.prefix}-DAY1-AI-EVID-REC-${String(idx + 1).padStart(3, "0")}`;
      out.entity_id = row.ai_program_id;
      out.business_name = row.program_name;
      out.context_item = `${row.tool_name} usage and value proof evidence`;
      out.dimension = "13_evidence_sources";
      out.evidence_id = row.evidence_id;
      out.active_candidate_status = "active";
      out.confidence = row.finance_validated_value_usd > 0 ? "medium" : "planning";
      out.source_type = "synthetic_source_adapter";
      out.source_basis = row.evidence_source_system;
      out.synthetic_data_flag = "true";
      out.evidence_boundary = "Synthetic Day 1 telemetry template; replace with source export/API before client claims.";
      out.module_usage_notes = "Home|Intelligence|Moves|Tower can use as planning evidence, not realized value.";
      out.evidence_type = "usage_value_telemetry";
      out.evidence_location = row.evidence_source_system;
      out.evidence_owner = row.evidence_owner;
      out.source_file = "SA08/SA09/SA10/SA11 AI value realization source adapters";
      out.source_owner = row.evidence_owner;
      out.source_date = row.evidence_extract_date;
      out.as_of_date = row.evidence_period_end;
      out.confidentiality = "synthetic_demo";
      out.domains_covered = row.business_function;
      out.row_count_or_pages = "4 linked source-adapter rows";
      out.quality_notes = "Synthetic Day 1 telemetry; replace with source-system export/API before client-grade claims.";
      out.approved_for_loading = "yes";
      out.known_gaps = row.caveat;
      out.original_source_file = row.evidence_source_system;
      out.original_packet = path.relative(repoRoot, dir);
      out.original_row_id = row.source_record_id;
      out.source_classification = "synthetic_day1_ai_value_realization";
      out.consolidation_rule_used = "generated_day1_adapter_family";
      out.conflict_status = "none";
      return out;
    });
  writeCsv(filePath, [...cleanedExisting, ...additions], header);
}

function main() {
  fs.mkdirSync(outputReportDir, { recursive: true });
  writeTemplates();
  const summary = [];
  for (const { tenant, packet, dir } of discoverTenantStandardDirs()) {
    const baseProfile = tenantProfiles[tenant];
    if (!baseProfile) {
      summary.push({ tenant, packet, path: path.relative(repoRoot, dir), status: "skipped_no_profile", sa08: 0, sa09: 0, sa10: 0, sa11: 0 });
      continue;
    }
    const profile = { ...baseProfile, key: tenant };
    const rows = syntheticRowsFor(profile);
    writeCsv(path.join(dir, adapterFiles.sa08), rows.sa08, headers.sa08);
    writeCsv(path.join(dir, adapterFiles.sa09), rows.sa09, headers.sa09);
    writeCsv(path.join(dir, adapterFiles.sa10), rows.sa10, headers.sa10);
    writeCsv(path.join(dir, adapterFiles.sa11), rows.sa11, headers.sa11);
    mergeEvidenceSources(dir, profile, rows);
    summary.push({ tenant, packet, path: path.relative(repoRoot, dir), status: "generated", sa08: rows.sa08.length, sa09: rows.sa09.length, sa10: rows.sa10.length, sa11: rows.sa11.length });
  }
  writeCsv(path.join(outputReportDir, "generation-summary.csv"), summary, ["tenant", "packet", "path", "status", "sa08", "sa09", "sa10", "sa11"]);
  fs.writeFileSync(path.join(outputReportDir, "summary.md"), [
    "# Day 1 AI Value Realization Template Pack",
    "",
    "Generated source-adapter CSVs for AI benefits realization, AI tool usage telemetry, interview evidence leads, and KPI/outcome feeds.",
    "",
    "This is a template/source-adapter layer. It does not promote candidate data, claim realized value, or mutate Azure/Postgres by itself.",
    "",
    "| Tenant | Packet | Status | SA08 | SA09 | SA10 | SA11 |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...summary.map((row) => `| ${row.tenant} | ${row.packet} | ${row.status} | ${row.sa08} | ${row.sa09} | ${row.sa10} | ${row.sa11} |`),
    "",
  ].join("\n"));
  console.log(JSON.stringify({ ok: true, outputReportDir, summary }, null, 2));
}

main();

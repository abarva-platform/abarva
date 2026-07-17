#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const tenantKey = "meridian-health";
const baseDir = path.join(repoRoot, "datasets/tenant-inputs/meridian-health/standard-2026-07-v3");
const interviewsPath = path.join(repoRoot, "datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv");
const reportDir = path.join(repoRoot, "reports/meridian-v3-real-repo-integration");

const COMMON = {
  tenant_key: tenantKey,
  entity_id: "MER-HS",
  active_candidate_status: "active",
  confidence: "high",
  source_type: "synthetic_v3_context_generation",
  source_basis: "meridian_health_v3_reload_template_finalization_2026_07_17",
  synthetic_data_flag: "synthetic_demo",
  evidence_boundary: "synthetic_demo_phi_free_planning_grade",
  module_usage_notes: "Home|Knowledge|Intelligence|Moves|Tower|Source",
};

const MONEY = {
  total: 650_000_000,
  run: 487_500_000,
  change: 162_500_000,
};

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
  return rows.filter((r) => r.some((c) => c !== "")).map((r) => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(file, rows, preferredColumns = []) {
  const columns = [];
  for (const col of preferredColumns) if (!columns.includes(col)) columns.push(col);
  for (const row of rows) {
    for (const col of Object.keys(row)) {
      if (!columns.includes(col)) columns.push(col);
    }
  }
  const lines = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => columns.map((col) => csvEscape(row[col] ?? "")).join(",")),
  ];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function readCsv(relativePath) {
  return parseCsv(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function upsertBy(rows, key, value, row) {
  const idx = rows.findIndex((existing) => existing[key] === value);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...row };
    return "updated";
  }
  rows.push(row);
  return "added";
}

function addColumns(rows, defaults) {
  for (const row of rows) {
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in row) || row[key] === "") row[key] = value;
    }
  }
}

function evidence(id, name, owner = "AbarVa synthetic data steward") {
  return {
    ...COMMON,
    record_id: id.replace("MER-V3-EVID-", "MER-V3-EVID-ROW-"),
    business_name: name,
    context_item: name,
    dimension: "13_evidence_sources",
    evidence_id: id,
    evidence_type: "synthetic_reload_source_template",
    evidence_location: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3",
    evidence_owner: owner,
  };
}

const budgetLines = [
  ["RUN-APP-01", "Applications", "Epic clinical/EHR run support", "run", 58_000_000, "Epic Hyperspace, Clarity, Caboodle run-state support", "Epic", "Epic Hyperspace; Epic Clarity; Epic Caboodle", "none", "not_ai"],
  ["RUN-APP-02", "Applications", "Payer claims/core admin run support", "run", 42_000_000, "QNXT/Facets-style claims platform operations", "HealthEdge; Cognizant", "HealthRules Payer; TriZetto QNXT; Facets", "none", "not_ai"],
  ["RUN-APP-03", "Applications", "ERP, revenue cycle, and corporate apps support", "run", 16_800_000, "Oracle ERP, Waystar, corporate finance apps", "Oracle; Waystar", "Oracle ERP; Waystar RCM", "none", "not_ai"],
  ["RUN-APP-04", "Applications", "Integration and middleware run support", "run", 8_500_000, "MuleSoft/Apigee run-state integration layer", "Salesforce; Google", "MuleSoft; Apigee", "embedded_platform_ai", "erp_ai"],
  ["RUN-APP-05", "Applications", "Quality/regulatory reporting app support", "run", 6_000_000, "Regulatory and quality measure reporting tools", "NCQA; Tableau", "Quality reporting mart; Tableau", "none", "not_ai"],
  ["RUN-APP-06", "Applications", "Workday HR/finance platform run and AI-enabled workflow support", "run", 1_200_000, "Workday platform run support plus AI-enabled HR/finance assistant capability", "Workday", "Workday HCM; Workday Finance; Workday AI", "embedded_platform_ai", "workday_ai"],
  ["RUN-INFRA-01", "Infrastructure", "Hybrid infrastructure and data center operations", "run", 30_000_000, "On-prem data center plus hybrid compute run", "Kyndryl; Dell", "VMware; enterprise storage", "none", "not_ai"],
  ["RUN-INFRA-02", "Infrastructure", "Cloud consumption and platform run", "run", 28_000_000, "AWS/Azure run-state consumption, including AI services usage", "AWS; Microsoft", "AWS; Azure", "embedded_platform_ai", "cloud_ai_services"],
  ["RUN-INFRA-03", "Infrastructure", "Network, telecom, and connectivity", "run", 18_000_000, "WAN/LAN, telecom circuits, SD-WAN", "Cisco; AT&T", "Cisco network estate", "none", "not_ai"],
  ["RUN-INFRA-04", "Infrastructure", "Database and middleware operations", "run", 14_000_000, "DB administration, middleware run support", "Microsoft; Oracle", "SQL Server; Oracle DB", "none", "not_ai"],
  ["RUN-INFRA-05", "Infrastructure", "Backup, DR, monitoring, observability", "run", 12_500_000, "Backup/DR tooling, Splunk/Dynatrace-style monitoring", "Splunk; Dynatrace", "Monitoring platforms", "none", "not_ai"],
  ["RUN-MGS-01", "Managed Services", "EHR managed services / release support", "run", 30_000_000, "Epic-focused AMS/release management", "Deloitte", "Epic", "none", "not_ai"],
  ["RUN-MGS-02", "Managed Services", "Enterprise application managed services", "run", 34_000_000, "AMS across ERP/CRM/claims apps", "Accenture; Cognizant", "ERP; CRM; Claims", "none", "not_ai"],
  ["RUN-MGS-03", "Managed Services", "Infrastructure managed services", "run", 28_000_000, "IMS for compute/network/storage", "Infosys", "Infrastructure estate", "none", "not_ai"],
  ["RUN-MGS-04", "Managed Services", "Security managed services", "run", 14_000_000, "MDR/SOC-as-a-service", "CrowdStrike; Splunk", "SOC; SIEM", "embedded_platform_ai", "cyber_ai"],
  ["RUN-MGS-05", "Managed Services", "Service desk managed services", "run", 12_000_000, "Tier 1/2 service desk outsourcing and ServiceNow AI pilot", "ServiceNow; Infosys", "ServiceNow ITSM", "embedded_platform_ai", "servicenow_ai"],
  ["RUN-MGS-06", "Managed Services", "Data & analytics AMS / SI support", "run", 7_000_000, "Managed data platform/BI support under five-year SI contract", "Accenture", "Databricks; Power BI; Tableau", "ai_run_operations", "data_ai_platform"],
  ["RUN-CYBER-01", "Cybersecurity", "SOC, MDR, SIEM operations", "run", 17_000_000, "24x7 SOC plus SIEM run operations", "CrowdStrike; Splunk", "CrowdStrike; Splunk", "embedded_platform_ai", "cyber_ai"],
  ["RUN-CYBER-02", "Cybersecurity", "IAM / PAM run operations", "run", 14_000_000, "Identity and privileged access management run", "Okta; CyberArk", "Okta; CyberArk", "none", "not_ai"],
  ["RUN-CYBER-03", "Cybersecurity", "Privacy / PHI compliance tooling", "run", 8_000_000, "PHI-focused compliance and DLP tooling", "OneTrust; Microsoft Purview", "Privacy tooling", "none", "not_ai"],
  ["RUN-CYBER-04", "Cybersecurity", "Endpoint protection", "run", 8_000_000, "EDR/antivirus fleet coverage", "CrowdStrike", "CrowdStrike Falcon", "embedded_platform_ai", "cyber_ai"],
  ["RUN-CYBER-05", "Cybersecurity", "GRC and audit tooling", "run", 5_500_000, "Governance, risk, and compliance platform run", "ServiceNow", "ServiceNow GRC", "none", "not_ai"],
  ["RUN-DATA-01", "Data & Analytics", "BI/reporting operations", "run", 9_000_000, "Tableau/Power BI run-state reporting", "Microsoft; Salesforce", "Power BI; Tableau", "none", "not_ai"],
  ["RUN-DATA-02", "Data & Analytics", "Data pipeline operations", "run", 8_000_000, "ETL/ELT pipeline run support", "Informatica; Databricks", "Informatica; Databricks", "ai_run_operations", "data_ai_platform"],
  ["RUN-DATA-03", "Data & Analytics", "SQL/Tableau/Power BI platform support", "run", 7_500_000, "Platform administration and licensing", "Microsoft; Salesforce", "SQL Server; Tableau; Power BI", "none", "not_ai"],
  ["RUN-DATA-04", "Data & Analytics", "Data quality/governance operations", "run", 6_000_000, "Data quality monitoring and stewardship run", "Collibra; Informatica", "Collibra; Informatica DQ", "none", "not_ai"],
  ["RUN-DATA-05", "Data & Analytics", "Analytics platform support", "run", 7_000_000, "Analytics platform administration", "Databricks; Microsoft", "Databricks; Power BI", "ai_run_operations", "data_ai_platform"],
  ["RUN-WKPL-01", "Workplace", "Microsoft 365 / collaboration licenses", "run", 16_000_000, "M365 suite licensing including Copilot seats", "Microsoft", "Microsoft 365 Copilot", "embedded_platform_ai", "copilot_productivity"],
  ["RUN-WKPL-02", "Workplace", "Service desk operations", "run", 10_000_000, "Internal service desk run operations", "ServiceNow; Infosys", "ServiceNow ITSM", "none", "not_ai"],
  ["RUN-WKPL-03", "Workplace", "Endpoint management", "run", 6_000_000, "Device fleet management", "Microsoft; Jamf", "Intune; device management", "none", "not_ai"],
  ["RUN-WKPL-04", "Workplace", "Collaboration adoption/change support", "run", 5_500_000, "Adoption/change management for workplace tools", "Microsoft", "M365; Viva", "ai_training_change", "copilot_productivity"],
  ["CHG-DATA-01", "Data & Analytics", "Databricks/lakehouse modernization", "change", 14_000_000, "Lakehouse build-out on AWS/Databricks", "Databricks; AWS", "Databricks Lakehouse; AWS", "ai_enablement_foundation", "data_ai_platform"],
  ["CHG-DATA-02", "Data & Analytics", "Patient/member identity spine", "change", 8_000_000, "Master identity resolution across EMR/claims", "Reltio; Informatica", "Reltio MDM", "ai_enablement_foundation", "data_ai_platform"],
  ["CHG-DATA-03", "Data & Analytics", "Claims/clinical/pharmacy harmonization", "change", 7_000_000, "Cross-domain data harmonization", "Databricks; Epic", "Claims; Epic; pharmacy data", "ai_enablement_foundation", "data_ai_platform"],
  ["CHG-DATA-04", "Data & Analytics", "Certified semantic layer", "change", 5_000_000, "Governed semantic/metrics layer", "Microsoft; dbt", "Power BI semantic layer; dbt", "ai_enablement_foundation", "data_ai_platform"],
  ["CHG-DATA-05", "Data & Analytics", "Data catalog/governance controls", "change", 4_500_000, "Collibra-style catalog and lineage", "Collibra", "Collibra", "ai_governance_controls", "data_ai_platform"],
  ["CHG-DATA-06", "Data & Analytics", "Data migration and validation", "change", 4_000_000, "Migration and validation workstreams", "Accenture", "Databricks migration", "none", "not_ai"],
  ["CHG-INT-01", "Integration", "API gateway modernization", "change", 5_800_000, "MuleSoft/Apigee gateway modernization", "Salesforce; Google", "MuleSoft; Apigee", "none", "not_ai"],
  ["CHG-INT-02", "Integration", "EHR/claims integration modernization", "change", 7_000_000, "Modernized EHR-claims integration paths", "Epic; HealthEdge", "Epic Bridges; claims APIs", "none", "not_ai"],
  ["CHG-INT-03", "Integration", "HL7/FHIR event streaming", "change", 6_000_000, "Event-driven HL7/FHIR streaming", "Redox; AWS", "FHIR streaming", "none", "not_ai"],
  ["CHG-INT-04", "Integration", "Provider/member API enablement", "change", 4_000_000, "External-facing API enablement", "Apigee; Salesforce", "Provider/member APIs", "none", "not_ai"],
  ["CHG-INT-05", "Integration", "Integration observability", "change", 3_000_000, "Integration-layer monitoring/observability", "Datadog; Splunk", "Integration observability", "none", "not_ai"],
  ["CHG-INT-06", "Integration", "Developer productivity AI and SDLC automation", "change", 2_200_000, "GitHub Copilot, code assist, and test automation enablement", "GitHub; Microsoft", "GitHub Copilot; Azure DevOps", "embedded_platform_ai", "developer_productivity_ai"],
  ["CHG-CYBER-01", "Cybersecurity", "Zero trust / IAM uplift", "change", 8_000_000, "Zero-trust architecture rollout", "Okta; Zscaler", "Okta; Zscaler", "none", "not_ai"],
  ["CHG-CYBER-02", "Cybersecurity", "PHI access logging and monitoring", "change", 6_000_000, "PHI-specific access audit logging", "Splunk; Microsoft", "PHI audit logging", "ai_governance_controls", "ai_governance"],
  ["CHG-CYBER-03", "Cybersecurity", "PAM uplift", "change", 4_000_000, "Privileged access management uplift", "CyberArk", "CyberArk", "none", "not_ai"],
  ["CHG-CYBER-04", "Cybersecurity", "Security data lake", "change", 3_000_000, "Security telemetry data lake", "Splunk; AWS", "Security data lake", "embedded_platform_ai", "cyber_ai"],
  ["CHG-CYBER-05", "Cybersecurity", "Audit automation", "change", 3_000_000, "Automated audit/compliance evidence collection", "ServiceNow; Archer", "Audit automation", "embedded_platform_ai", "cyber_ai"],
  ["CHG-EHR-01", "Clinical / EHR", "Epic Cogito quality analytics", "change", 8_000_000, "Epic Cogito rollout for quality analytics", "Epic", "Epic Cogito", "none", "not_ai"],
  ["CHG-EHR-02", "Clinical / EHR", "Clinical operations dashboarding", "change", 5_000_000, "Clinical operations dashboards", "Epic; Tableau", "Epic; Tableau", "none", "not_ai"],
  ["CHG-EHR-03", "Clinical / EHR", "Revenue cycle analytics", "change", 4_000_000, "Revenue cycle analytics build-out", "Waystar; Epic", "Waystar; Epic", "none", "not_ai"],
  ["CHG-EHR-04", "Clinical / EHR", "Population health measures", "change", 3_000_000, "Population health measure development", "Epic; Innovaccer", "Population health analytics", "none", "not_ai"],
  ["CHG-EHR-05", "Clinical / EHR", "Clinical data validation", "change", 2_000_000, "Clinical data validation workstream", "Epic", "Clinical data validation", "none", "not_ai"],
  ["CHG-MBR-01", "Member Experience", "Contact center platform modernization", "change", 5_000_000, "Genesys Cloud CX modernization", "Genesys", "Genesys Cloud CX", "ai_enablement_foundation", "crm_contact_center_ai"],
  ["CHG-MBR-02", "Member Experience", "CRM/member service workflow", "change", 4_000_000, "Salesforce Health Cloud workflow build-out", "Salesforce", "Salesforce Health Cloud", "ai_enablement_foundation", "crm_contact_center_ai"],
  ["CHG-MBR-03", "Member Experience", "Telephony/routing modernization", "change", 3_000_000, "Telephony and routing modernization", "Genesys", "Genesys routing", "ai_enablement_foundation", "crm_contact_center_ai"],
  ["CHG-MBR-04", "Member Experience", "Knowledge base migration", "change", 2_000_000, "Knowledge base platform migration", "ServiceNow; Salesforce", "Knowledge base", "ai_enablement_foundation", "crm_contact_center_ai"],
  ["CHG-MBR-05", "Member Experience", "Agent knowledge foundation", "change", 2_000_000, "Agent-facing knowledge foundation build", "ServiceNow; Salesforce", "Agent knowledge foundation", "ai_enablement_foundation", "crm_contact_center_ai"],
  ["CHG-CLOUD-01", "Cloud / FinOps", "Cloud tagging/showback", "change", 3_000_000, "Cost allocation tagging and showback", "Apptio; AWS", "FinOps tagging", "none", "not_ai"],
  ["CHG-CLOUD-02", "Cloud / FinOps", "Reserved capacity optimization", "change", 2_500_000, "Reserved instance/commitment optimization", "AWS; Azure", "Cloud commitments", "none", "not_ai"],
  ["CHG-CLOUD-03", "Cloud / FinOps", "Cloud security posture", "change", 2_000_000, "CSPM tooling rollout", "Wiz", "Cloud security posture", "embedded_platform_ai", "cyber_ai"],
  ["CHG-CLOUD-04", "Cloud / FinOps", "Landing zone automation", "change", 2_500_000, "Automated cloud landing zone build", "Terraform; AWS", "Cloud landing zone", "none", "not_ai"],
  ["CHG-OPM-01", "Operating Model", "Data product operating model", "change", 4_000_000, "Data-product operating model design", "AbarVa; Accenture", "Operating model", "none", "not_ai"],
  ["CHG-OPM-02", "Operating Model", "Domain ownership / stewardship", "change", 3_000_000, "Domain data ownership rollout", "AbarVa; Collibra", "Domain stewardship", "none", "not_ai"],
  ["CHG-OPM-03", "Operating Model", "Data product training", "change", 2_000_000, "Training for data-product operating model", "AbarVa", "Training", "none", "not_ai"],
  ["CHG-OPM-04", "Operating Model", "Quality/control framework", "change", 3_000_000, "Data quality control framework", "Informatica; Collibra", "Quality controls", "none", "not_ai"],
  ["CHG-AIGOV-01", "AI Governance", "AI policy and controls", "change", 2_500_000, "Enterprise AI policy and control framework", "AbarVa; Legal", "AI policy controls", "ai_governance_controls", "ai_governance"],
  ["CHG-AIGOV-02", "AI Governance", "Model inventory and risk register", "change", 2_000_000, "AI/ML model inventory and risk register", "ServiceNow; Collibra", "Model inventory", "ai_governance_controls", "ai_governance"],
  ["CHG-AIGOV-03", "AI Governance", "HITL/privacy validation", "change", 2_000_000, "Human-in-the-loop and privacy validation controls", "OneTrust; Legal", "HITL controls", "ai_governance_controls", "ai_governance"],
  ["CHG-AIGOV-04", "AI Governance", "AI adoption/change enablement", "change", 1_500_000, "Change management for AI rollout", "AbarVa; Microsoft", "AI adoption", "ai_training_change", "ai_training_change"],
];

const aiSpendTags = [
  ["AI-SPEND-01", "data_ai_platform", "Databricks lakehouse / ML enablement", "ai_enablement_foundation", "approved", "CHG-DATA-01", 14_000_000, "Full line is AI/ML platform build-out."],
  ["AI-SPEND-02", "cloud_ai_services", "Cloud AI services (AWS/Azure AI)", "embedded_platform_ai", "approved", "RUN-INFRA-02", 4_000_000, "Tag inside broader cloud consumption run spend."],
  ["AI-SPEND-03", "data_ai_platform", "Data catalog / lineage / governance tooling", "ai_enablement_foundation", "approved", "CHG-DATA-05", 3_500_000, "Tag inside data catalog/governance controls line."],
  ["AI-SPEND-04", "copilot_productivity", "Microsoft 365 Copilot pilot + licensing", "embedded_platform_ai", "approved", "RUN-WKPL-01", 8_500_000, "Tag inside M365/collaboration licensing line."],
  ["AI-SPEND-05", "copilot_productivity", "Copilot adoption / change / training", "ai_training_change", "approved", "RUN-WKPL-04", 2_000_000, "Tag inside collaboration adoption/change support line."],
  ["AI-SPEND-06", "erp_ai", "Power Platform / low-code AI automation", "embedded_platform_ai", "approved", "RUN-APP-04", 2_500_000, "Tag inside integration/middleware run line."],
  ["AI-SPEND-07", "servicenow_ai", "ServiceNow AI / ITSM virtual agent + ticket summarization", "embedded_platform_ai", "approved", "RUN-MGS-05", 4_000_000, "Tag inside service desk managed-services line."],
  ["AI-SPEND-08", "developer_productivity_ai", "GitHub Copilot / code assist", "embedded_platform_ai", "approved", "CHG-INT-06", 2_200_000, "Dedicated developer-productivity AI line."],
  ["AI-SPEND-09", "developer_productivity_ai", "Test automation / DevSecOps AI assist", "embedded_platform_ai", "approved", "CHG-INT-06", 700_000, "Tag inside developer productivity AI and SDLC automation."],
  ["AI-SPEND-10", "crm_contact_center_ai", "Genesys contact-center AI-ready routing + knowledge foundation", "ai_enablement_foundation", "approved", "CHG-MBR-01", 3_800_000, "Tag inside contact center platform modernization line."],
  ["AI-SPEND-11", "crm_contact_center_ai", "Knowledge base modernization for future AI Assist", "ai_enablement_foundation", "approved", "CHG-MBR-04", 2_000_000, "Enables AI Assist but does not fund AI Assist."],
  ["AI-SPEND-12", "ai_governance", "AI policy, model inventory, and risk register", "ai_governance_controls", "approved", "CHG-AIGOV-02", 2_000_000, "Full line is AI model inventory/risk register."],
  ["AI-SPEND-13", "ai_governance", "PHI controls, HITL validation, audit logging", "ai_governance_controls", "approved", "CHG-AIGOV-03", 2_000_000, "Full line is HITL/privacy validation controls."],
  ["AI-SPEND-14", "ai_training_change", "Responsible AI training and adoption controls", "ai_training_change", "approved", "CHG-AIGOV-04", 1_300_000, "Tag inside AI adoption/change-enablement line."],
  ["AI-SPEND-15", "workday_ai", "Workday AI HR/finance workflow assist", "embedded_platform_ai", "approved", "RUN-APP-06", 1_200_000, "Workday platform AI assistant capability in HR/finance run support."],
];

const budgetById = Object.fromEntries(budgetLines.map(([id, tower, name, kind, amount, notes, vendor, system, aiType, aiCategory]) => [id, { id, tower, name, kind, amount, notes, vendor, system, aiType, aiCategory }]));
const aiSpendById = Object.fromEntries(aiSpendTags.map(([id, category, tool, aiType, funding, budgetId, amount, notes]) => [id, { id, category, tool, aiType, funding, budgetId, amount, notes }]));
const programAiSpendMap = {
  "PROG-DEV-PRODUCTIVITY": ["AI-SPEND-08", "AI-SPEND-09"],
  "PROG-COPILOT-ADOPT": ["AI-SPEND-04", "AI-SPEND-05"],
  "PROG-SNOW-AI": ["AI-SPEND-07"],
  "PROG-WORKDAY-AI": ["AI-SPEND-15"],
};

function programApprovedAmount(programCode, funding, budgetIds) {
  if (funding !== "approved") return 0;
  const aiSpendIds = programAiSpendMap[programCode] ?? [];
  if (aiSpendIds.length) {
    return aiSpendIds.reduce((sum, id) => sum + (aiSpendById[id]?.amount ?? 0), 0);
  }
  return budgetIds.reduce((sum, id) => sum + (budgetById[id]?.amount ?? 0), 0);
}

const programs = [
  ["PROG-DATA-FOUNDATION", "Data Foundation / Lakehouse Modernization", "active", "approved", ["CHG-DATA-01", "CHG-DATA-02", "CHG-DATA-03", "CHG-DATA-04", "CHG-DATA-05", "CHG-DATA-06"], "CDAO", "ai_enablement_foundation", "data_ai_platform"],
  ["PROG-API-MOD", "Integration / API Modernization", "active", "approved", ["CHG-INT-01", "CHG-INT-02", "CHG-INT-03", "CHG-INT-04", "CHG-INT-05"], "Chief Architect", "none", "not_ai"],
  ["PROG-DEV-PRODUCTIVITY", "Developer Productivity AI / SDLC Automation", "active", "approved", ["CHG-INT-06"], "VP Engineering", "embedded_platform_ai", "developer_productivity_ai"],
  ["PROG-PHI-IAM", "Cybersecurity / Identity / PHI Control Uplift", "active", "approved", ["CHG-CYBER-01", "CHG-CYBER-02", "CHG-CYBER-03", "CHG-CYBER-04", "CHG-CYBER-05"], "CISO", "ai_governance_controls", "ai_governance"],
  ["PROG-EHR-CLIN", "EHR / Clinical Analytics Modernization", "active", "approved", ["CHG-EHR-01", "CHG-EHR-02", "CHG-EHR-03", "CHG-EHR-04", "CHG-EHR-05"], "CMIO", "none", "not_ai"],
  ["PROG-CONTACT-KNOW", "Contact Center Platform / Knowledge Modernization", "active", "approved", ["CHG-MBR-01", "CHG-MBR-02", "CHG-MBR-03", "CHG-MBR-04", "CHG-MBR-05"], "Chief Experience Officer", "ai_enablement_foundation", "crm_contact_center_ai"],
  ["PROG-FINOPS", "Cloud Cost Governance / FinOps", "active", "approved", ["CHG-CLOUD-01", "CHG-CLOUD-02", "CHG-CLOUD-03", "CHG-CLOUD-04"], "SVP Infrastructure and Cloud", "none", "not_ai"],
  ["PROG-DATA-PRODUCT-OPS", "Enterprise Data Product Operating Model", "proposed", "requested", ["CHG-OPM-01", "CHG-OPM-02", "CHG-OPM-03", "CHG-OPM-04"], "CDAO", "none", "not_ai"],
  ["PROG-AI-GOV", "AI Governance / Model Risk Controls", "active", "approved", ["CHG-AIGOV-01", "CHG-AIGOV-02", "CHG-AIGOV-03", "CHG-AIGOV-04"], "Chief Risk Officer", "ai_governance_controls", "ai_governance"],
  ["PROG-MSO", "Managed Services Optimization", "active", "approved", ["RUN-MGS-01", "RUN-MGS-02", "RUN-MGS-03", "RUN-MGS-04", "RUN-MGS-05", "RUN-MGS-06"], "VP IT Operations", "none", "not_ai"],
  ["PROG-COPILOT-ADOPT", "Microsoft 365 Copilot Productivity Enablement", "active", "approved", ["RUN-WKPL-01", "RUN-WKPL-04"], "VP Workplace Technology", "embedded_platform_ai", "copilot_productivity"],
  ["PROG-SNOW-AI", "ServiceNow AI / ITSM Automation Pilot", "active", "approved", ["RUN-MGS-05"], "VP Service Management", "embedded_platform_ai", "servicenow_ai"],
  ["PROG-WORKDAY-AI", "Workday HR/Finance AI Workflow Pilot", "active", "approved", ["RUN-APP-06"], "CHRO and CFO", "embedded_platform_ai", "workday_ai"],
  ["PROG-AI-ASSIST-CANDIDATE", "Member Service AI Assist Candidate", "candidate", "not_approved", [], "Chief Experience Officer", "candidate_ai_opportunity", "crm_contact_center_ai"],
];

const useCases = [
  ["AI-UC-001", "Member Service AI Assist", "discovery", "not_approved", "PROG-AI-ASSIST-CANDIDATE", 0, "opportunity_only", "CRM; claims; eligibility; benefits; knowledge base; call transcripts; contact center events; member identity", "PHI_controls_required"],
  ["AI-UC-002", "Contact Center Knowledge Assist", "candidate", "not_approved", "PROG-AI-ASSIST-CANDIDATE", 0, "opportunity_only", "knowledge articles; SOPs; contact reasons; call transcripts", "controls_required"],
  ["AI-UC-003", "Claims / Eligibility Inquiry Assist", "candidate", "not_approved", "PROG-AI-ASSIST-CANDIDATE", 0, "opportunity_only", "claims; eligibility; benefits; member identity", "PHI_controls_required"],
  ["AI-UC-004", "Clinical Operations Documentation Assist", "candidate", "not_approved", "PROG-AI-ASSIST-CANDIDATE", 0, "opportunity_only", "Epic encounter; note templates; clinical policies", "clinical_risk_review_required"],
  ["AI-UC-005", "Revenue Cycle Exception Triage", "candidate", "not_approved", "PROG-AI-ASSIST-CANDIDATE", 0, "opportunity_only", "denials; claims edits; coding work queues", "controls_required"],
  ["AI-UC-006", "Workforce Productivity / Policy Assist", "approved_for_pilot", "approved", "PROG-COPILOT-ADOPT", 10_500_000, "tracked_hypothesis", "HR policies; IT knowledge; compliance SOPs", "controls_required"],
  ["AI-UC-007", "ServiceNow ITSM Virtual Agent / Ticket Summary", "approved_for_pilot", "approved", "PROG-SNOW-AI", 4_000_000, "tracked_hypothesis", "tickets; knowledge articles; incident history", "controls_required"],
  ["AI-UC-008", "Workday HR/Finance Workflow Assist", "approved_for_pilot", "approved", "PROG-WORKDAY-AI", 1_200_000, "tracked_hypothesis", "HR case; finance workflow; policy; approval data", "controls_required"],
  ["AI-UC-009", "Developer Productivity Code Assist", "approved_for_pilot", "approved", "PROG-DEV-PRODUCTIVITY", 2_200_000, "tracked_hypothesis", "repos; pull requests; build/test telemetry", "secure_sdlc_controls_required"],
];

const benefitRows = [
  ["BEN-001", "PROG-COPILOT-ADOPT", "AI-UC-006", "Microsoft", "Microsoft 365 Copilot", "productivity_hours", 14_000_000, "Average hours/week spent on document, meeting, and policy search tasks", 6.2, "hours saved per active user/month", 3.0, "monthly active users", 4800, 0.62, "hours saved/user/month", 0, 1.4, 2_100_000, "measured_partial", "M365 Copilot usage export; time-study sample; FP&A partial validation", "monthly", "partial", "Savings not yet labor-released; count as partial finance-validated productivity value only."],
  ["BEN-002", "PROG-SNOW-AI", "AI-UC-007", "ServiceNow", "ServiceNow AI Agent Assist", "ticket_productivity", 6_000_000, "Average handle time for Tier 1/2 tickets", 22.0, "minutes saved per resolved assisted ticket", 4.0, "AI-assisted ticket resolutions", 18500, 0.38, "average handle time minutes", 22.0, 20.1, 800_000, "measured_partial", "ServiceNow AI usage export; ticket-volume extract; service desk finance model", "monthly", "partial", "Value is productivity capacity; do not claim headcount reduction without operating decision."],
  ["BEN-003", "PROG-WORKDAY-AI", "AI-UC-008", "Workday", "Workday AI HR/Finance Assist", "case_cycle_time", 3_000_000, "HR/finance case resolution cycle time", 5.8, "days to resolve assisted case", 4.5, "AI-assisted HR/finance cases", 3200, 0.29, "case cycle time days", 5.8, 5.1, 400_000, "measured_partial", "Workday usage extract; HR case export; FP&A review", "monthly", "partial", "Early pilot; value is operational improvement until finance validates durable capacity release."],
  ["BEN-004", "PROG-DEV-PRODUCTIVITY", "AI-UC-009", "GitHub", "GitHub Copilot Enterprise", "engineering_throughput", 4_500_000, "Story cycle time and PR throughput", 8.4, "cycle time days", 7.0, "active developers", 650, 0.54, "PR cycle time days", 8.4, 7.8, 500_000, "measured_partial", "GitHub Copilot usage; PR metrics; engineering throughput review", "monthly", "partial", "Do not count savings without delivery-capacity or cost impact evidence."],
  ["BEN-005", "PROG-CONTACT-KNOW", "AI-UC-002", "Genesys / Salesforce", "Contact Center Knowledge Foundation", "member_service_readiness", 8_000_000, "Knowledge lookup time and transfer rate", 92.0, "seconds saved per knowledge lookup", 30.0, "knowledge searches", 0, 0, "lookup time seconds", 92.0, "", 0, "baseline_only", "Knowledge migration tracker; no production AI Assist usage yet", "monthly", "no", "Foundation spend only; does not fund Member Service AI Assist and cannot claim AI Assist value."],
  ["BEN-006", "PROG-DATA-FOUNDATION", "", "Databricks / AWS / Collibra", "Data and AI Platform Enablement", "platform_readiness", 0, "Certified data-product coverage", 0.18, "certified high-value domains", 0.65, "certified domains", 4, 0.18, "certified domain coverage", 0.18, 0.24, 0, "readiness_only", "Data catalog extract; domain certification log", "monthly", "no", "Platform enablement is a prerequisite; no direct realized AI value claim."],
  ["BEN-007", "PROG-AI-GOV", "", "AbarVa / ServiceNow / Legal", "AI Governance Controls", "risk_control_readiness", 0, "Model inventory/control coverage", 0.1, "registered models with owner/control", 0.9, "registered AI systems", 12, 0.2, "control coverage", 0.1, 0.2, 0, "readiness_only", "AI model inventory; governance council minutes", "monthly", "no", "Governance spend reduces risk and gates scale; do not claim financial value."],
  ["BEN-008", "PROG-AI-ASSIST-CANDIDATE", "AI-UC-001", "TBD", "Member Service AI Assist", "candidate_opportunity", 0, "Member-service baseline required", "", "approved business case", "", "approved funding", 0, 0, "AHT/FCR/CSAT/transfer rate", "", "", 0, "not_claimable", "No approved funding; no production usage extract", "not_started", "no", "Candidate only. Depends on contact center/data/governance work but inherits none of their funding or value."],
];

function finalize() {
  fs.mkdirSync(reportDir, { recursive: true });
  const rowReport = [];

  const coreFiles = {
    f01: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/01_business_functions.csv",
    f02: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/02_org_ownership.csv",
    f03: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/03_workforce_roles.csv",
    f04: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/04_applications_systems.csv",
    f05: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/05_data_assets_integrations.csv",
    f07: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/07_vendors_contracts.csv",
    f08: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/08_it_budget_spend_value.csv",
    f09: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/09_programs_initiatives.csv",
    f10: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/10_ai_automation_use_cases.csv",
    f11: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/11_risks_controls.csv",
    f12: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/12_relationships.csv",
    f13: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/13_evidence_sources.csv",
    f14: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/14_metrics_outcomes.csv",
    f17: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/17_managed_services_scope.csv",
    f18: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3/18_operational_process_evidence.csv",
  };

  const f01 = readCsv(coreFiles.f01);
  const f02 = readCsv(coreFiles.f02);
  const f03 = readCsv(coreFiles.f03);
  const f04 = readCsv(coreFiles.f04);
  const f05 = readCsv(coreFiles.f05);
  const f07 = readCsv(coreFiles.f07);
  const f08 = readCsv(coreFiles.f08);
  const f09 = readCsv(coreFiles.f09);
  const f10 = readCsv(coreFiles.f10);
  const f11 = readCsv(coreFiles.f11);
  const f12 = readCsv(coreFiles.f12);
  const f13 = readCsv(coreFiles.f13);
  const f14 = readCsv(coreFiles.f14);
  const f17 = readCsv(coreFiles.f17);
  const f18 = readCsv(coreFiles.f18);
  const interviews = parseCsv(fs.readFileSync(interviewsPath, "utf8"));

  for (const [name, rows] of Object.entries({ f08, f09, f10, f14, f17 })) {
    rowReport.push({ file: name, old_rows: rows.length, preserved_rows: rows.length, rows_removed: 0 });
  }

  addColumns(f08, {
    legacy_row_flag: "true",
    source_row_status: "preserved_legacy_context",
    migration_action: "reclassified_not_deleted",
    financial_fact_type: "narrative_value_hypothesis",
    fiscal_year: "",
    time_period: "",
    budget_amount_usd: "",
    approved_budget_usd: "",
    actual_spend_ytd_usd: "",
    forecast_spend_usd: "",
    run_budget_usd: "",
    change_budget_usd: "",
    planned_value_usd: "",
    target_value_usd: "",
    amount_basis: "not_budget_fact",
    gross_or_net: "",
    additive_status: "excluded_from_budget_rollup",
    duplicate_risk: "not_applicable",
    budget_row_level: "narrative_not_budget_fact",
    finance_attestation_status: "not_applicable_narrative_row",
    program_code: "",
    initiative_id: "",
    linked_budget_record_ids: "",
    linked_sa02_records: "",
    ai_spend_flag: "false",
    ai_spend_type: "none",
    ai_spend_category: "not_ai",
    ai_tagged_budget_usd: "0",
    platform_embedded_ai_flag: "false",
    vendor_name: "",
    system_name: "",
    source_adapter_reference: "",
    tower_usage: "context_only",
    tower_hero_eligible: "false",
    caveat: "Preserved legacy narrative context. Not a budget fact and excluded from Tower totals.",
  });

  addColumns(f09, {
    legacy_row_flag: "true",
    source_row_status: "preserved_legacy_context",
    migration_action: "reclassified_not_deleted",
    initiative_status: "context_only",
    funding_status: "not_approved",
    approved_funding_usd: "0",
    requested_funding_usd: "0",
    forecast_spend_usd: "0",
    actual_spend_ytd_usd: "0",
    planned_value_usd: "0",
    target_value_usd: "0",
    realized_value_usd: "0",
    value_claim_status: "not_claimable",
    executive_owner: "",
    finance_owner: "",
    tower_measurement_ready: "false",
    program_code: "",
    initiative_id: "",
    linked_budget_record_ids: "",
    linked_sa02_records: "",
    ai_spend_flag: "false",
    ai_spend_type: "none",
    ai_spend_category: "not_ai",
    additive_status: "excluded_from_program_funding",
    duplicate_risk: "not_applicable",
    caveat: "Preserved legacy program/use-case narrative. Not approved funding unless linked to budget rows.",
  });

  addColumns(f10, {
    legacy_row_flag: "true",
    source_row_status: "preserved_legacy_context",
    migration_action: "reclassified_not_deleted",
    use_case_status: "candidate",
    related_move: "",
    business_problem: "",
    affected_process: "",
    required_data_domains: "",
    readiness_status: "not_assessed",
    funding_status: "not_approved",
    approved_funding_usd: "0",
    measurement_status: "baseline_required",
    risk_control_status: "controls_required",
    evidence_needed: "",
    tower_tracking_status: "opportunity_only",
    expected_decision_path: "Moves business case before funding",
    linked_program_code: "",
    linked_initiative_id: "",
    linked_budget_record_ids: "",
    embedded_platform_source: "",
    ai_spend_flag: "false",
    ai_spend_type: "candidate_ai_opportunity",
    ai_spend_category: "not_ai",
    caveat: "Preserved legacy candidate context. Not funded and not claimable.",
  });

  addColumns(f14, {
    baseline_available: "false",
    actual_available: "false",
    tower_claim_allowed: "false",
    measurement_owner: "",
    measurement_cadence: "",
    source_system: "",
    benefit_id: "",
    linked_program_code: "",
    linked_use_case_id: "",
    baseline_value: "",
    target_value: "",
    actual_value: "",
    finance_validated_value_usd: "0",
    value_claim_status: "not_claimable",
    caveat: "Preserved metric/gap row. Requires baseline, actual, owner, evidence, and finance validation before Tower value claim.",
  });

  addColumns(f17, {
    annual_contract_value_usd: "",
    run_spend_usd: "",
    change_order_spend_usd: "",
    invoice_amount_ytd_usd: "",
    service_credit_ytd_usd: "",
    vendor_name: "",
    service_tower: "",
    contract_id: "",
    fiscal_year: "",
    linked_budget_record_ids: "",
    linked_sa02_records: "",
    ai_spend_flag: "false",
    tower_usage: "contract_context",
    caveat: "Preserved managed-services scope. No savings or realized value unless backed by invoice/SLA evidence.",
  });

  for (const line of budgetLines) {
    const [id, tower, name, kind, amount, notes, vendor, system, aiType, aiCategory] = line;
    const evidenceId = `MER-V3-EVID-BUD-${id}`;
    const aiTaggedAmount = aiSpendTags.filter((tag) => tag[5] === id).reduce((sum, tag) => sum + tag[6], 0);
    upsertBy(f08, "record_id", `MER-V3-BUD-${id}`, {
      ...COMMON,
      record_id: `MER-V3-BUD-${id}`,
      business_name: `${name} FY26 budget`,
      context_item: `${name} FY26 budget`,
      dimension: "08_it_budget_spend_value",
      evidence_id: evidenceId,
      value_hypothesis: `${name} is a source-backed FY26 technology budget line for ${tower}.`,
      amount_usd: String(amount),
      realized_value_usd: "0",
      value_boundary: "budget_fact_only_no_realized_value",
      legacy_row_flag: "false",
      source_row_status: "new_structured_budget_fact",
      migration_action: "added_for_v3_reload",
      financial_fact_type: "fy26_budget_line",
      fiscal_year: "FY26",
      time_period: "FY26",
      budget_amount_usd: String(amount),
      approved_budget_usd: String(amount),
      actual_spend_ytd_usd: String(Math.round(amount * 0.26)),
      forecast_spend_usd: String(Math.round(amount * 0.965)),
      run_budget_usd: kind === "run" ? String(amount) : "0",
      change_budget_usd: kind === "change" ? String(amount) : "0",
      planned_value_usd: "0",
      target_value_usd: "0",
      amount_basis: "synthetic_fy26_budget_model",
      gross_or_net: "gross_budget",
      additive_status: "additive_budget_fact",
      duplicate_risk: "low_atomic_budget_line",
      budget_row_level: "atomic_budget_fact",
      finance_attestation_status: "synthetic_planning_attested",
      program_code: "",
      initiative_id: "",
      linked_budget_record_ids: id,
      linked_sa02_records: `SA02-${id}`,
      ai_spend_flag: aiCategory === "not_ai" ? "false" : "true",
      ai_spend_type: aiType,
      ai_spend_category: aiCategory,
      ai_tagged_budget_usd: String(aiTaggedAmount),
      platform_embedded_ai_flag: aiType === "embedded_platform_ai" ? "true" : "false",
      vendor_name: vendor,
      system_name: system,
      source_adapter_reference: `SA02-${id}`,
      tower_usage: "budget_rollup",
      tower_hero_eligible: "true",
      caveat: notes,
    });
    upsertBy(f13, "evidence_id", evidenceId, evidence(evidenceId, `${name} FY26 budget source row`));
  }

  for (const [programCode, name, status, funding, budgetIds, owner, aiType, aiCategory] of programs) {
    const amount = budgetIds.reduce((sum, id) => sum + (budgetById[id]?.amount ?? 0), 0);
    const approved = programApprovedAmount(programCode, funding, budgetIds);
    const linkedAiSpendIds = programAiSpendMap[programCode] ?? [];
    const evidenceId = `MER-V3-EVID-PROG-${programCode}`;
    upsertBy(f09, "record_id", `MER-V3-PROG-${programCode}`, {
      ...COMMON,
      record_id: `MER-V3-PROG-${programCode}`,
      business_name: name,
      context_item: name,
      dimension: "09_programs_initiatives",
      evidence_id: evidenceId,
      use_case: name,
      data_domain: budgetIds.map((id) => budgetById[id]?.tower).filter(Boolean).join("; "),
      systems: budgetIds.map((id) => budgetById[id]?.system).filter(Boolean).join("; "),
      value_hypothesis: `${name} is ${funding}; Tower may track budget and measurement readiness but cannot claim realized value without actuals.`,
      evidence_needed: funding === "approved" ? "Baseline, actual usage, operational KPI, and finance validation required before value claim." : "Funding approval and budget tie required before this can be treated as an approved program.",
      legacy_row_flag: "false",
      source_row_status: "new_structured_program",
      migration_action: "added_for_v3_reload",
      initiative_status: status,
      funding_status: funding,
      approved_funding_usd: String(approved),
      requested_funding_usd: String(amount),
      forecast_spend_usd: String(Math.round(approved * 0.965)),
      actual_spend_ytd_usd: String(Math.round(approved * 0.26)),
      planned_value_usd: "0",
      target_value_usd: "0",
      realized_value_usd: "0",
      value_claim_status: "not_claimable_without_benefit_ledger",
      executive_owner: owner,
      finance_owner: "FP&A Technology Finance Lead",
      tower_measurement_ready: "false",
      program_code: programCode,
      initiative_id: programCode.replace("PROG-", "INIT-"),
      linked_budget_record_ids: budgetIds.join(";"),
      linked_sa02_records: budgetIds.map((id) => `SA02-${id}`).join(";"),
      linked_ai_spend_ids: linkedAiSpendIds.join(";"),
      ai_tagged_approved_funding_usd: String(linkedAiSpendIds.reduce((sum, id) => sum + (aiSpendById[id]?.amount ?? 0), 0)),
      ai_spend_flag: aiCategory === "not_ai" ? "false" : "true",
      ai_spend_type: aiType,
      ai_spend_category: aiCategory,
      additive_status: "program_budget_view_non_additive",
      duplicate_risk: "program_view_do_not_sum_with_08",
      caveat: linkedAiSpendIds.length
        ? "Approved AI program amount is the AI-tagged sub-amount inside linked parent budget rows; value is not realized."
        : funding === "approved" ? "Approved funding is tied to budget rows but value is not realized." : "Requested/not-approved; no approved funding may be counted.",
    });
    upsertBy(f13, "evidence_id", evidenceId, evidence(evidenceId, `${name} program source row`));
  }

  for (const [id, name, status, funding, programCode, approvedFunding, tracking, domains, risk] of useCases) {
    const evidenceId = `MER-V3-EVID-AIUC-${id}`;
    const program = programs.find((p) => p[0] === programCode);
    const budgetIds = program?.[4] ?? [];
    upsertBy(f10, "record_id", `MER-V3-${id}`, {
      ...COMMON,
      record_id: `MER-V3-${id}`,
      business_name: name,
      context_item: name,
      dimension: "10_ai_automation_use_cases",
      evidence_id: evidenceId,
      use_case: name,
      data_domain: domains,
      systems: name.includes("ServiceNow") ? "ServiceNow ITSM" : name.includes("Workday") ? "Workday HCM; Workday Finance" : name.includes("Code") ? "GitHub Copilot; Azure DevOps" : name.includes("Workforce") ? "Microsoft 365 Copilot" : "Genesys Cloud CX; Salesforce Health Cloud; claims platform; knowledge base",
      value_hypothesis: `${name} is ${funding}. Benefits must be proven through usage, KPI movement, and finance validation.`,
      evidence_needed: "Baseline, usage extract, KPI actuals, finance validation, and control evidence.",
      legacy_row_flag: "false",
      source_row_status: "new_structured_ai_use_case",
      migration_action: "added_for_v3_reload",
      use_case_status: status,
      related_move: name === "Member Service AI Assist" ? "Member Service Agent Assist Transformation" : `${name} Value Proof`,
      business_problem: name === "Member Service AI Assist" ? "Member-service demand, handle time, transfers, and knowledge friction" : "AI-enabled productivity and service improvement",
      affected_process: name.includes("Workday") ? "HR and finance service workflows" : name.includes("ServiceNow") ? "IT service management" : name.includes("Code") ? "Software delivery" : name.includes("Workforce") ? "Knowledge work" : "Member service",
      required_data_domains: domains,
      readiness_status: funding === "approved" ? "pilot_ready_with_controls" : "discovery_baseline_required",
      funding_status: funding,
      approved_funding_usd: String(approvedFunding),
      measurement_status: funding === "approved" ? "usage_and_kpi_measurement_required" : "baseline_required",
      risk_control_status: risk,
      tower_tracking_status: tracking,
      expected_decision_path: funding === "approved" ? "Track usage and benefit actuals before scaling." : "Moves business case before funding.",
      linked_program_code: programCode,
      linked_initiative_id: programCode.replace("PROG-", "INIT-"),
      linked_budget_record_ids: budgetIds.join(";"),
      embedded_platform_source: budgetIds.map((bid) => budgetById[bid]?.vendor).filter(Boolean).join("; "),
      ai_spend_flag: funding === "approved" ? "true" : "false",
      ai_spend_type: funding === "approved" ? "embedded_platform_ai" : "candidate_ai_opportunity",
      ai_spend_category: name.includes("Workday") ? "workday_ai" : name.includes("ServiceNow") ? "servicenow_ai" : name.includes("Code") ? "developer_productivity_ai" : name.includes("Workforce") ? "copilot_productivity" : "crm_contact_center_ai",
      caveat: funding === "approved" ? "Funded pilot/platform AI spend; no realized value without benefits ledger evidence." : "Candidate opportunity only; no approved funding and no inherited platform spend.",
    });
    upsertBy(f13, "evidence_id", evidenceId, evidence(evidenceId, `${name} AI use case source row`));
  }

  for (const [benefitId, programCode, useCaseId, vendor, tool, benefitType, promised, baselineMetric, baselineValue, targetMetric, targetValue, usageMetric, usageActual, adoptionRate, opKpi, kpiBaseline, kpiActual, financeValue, claimStatus, sourceExtract, cadence, towerAllowed, caveat] of benefitRows) {
    const evidenceId = `MER-V3-EVID-${benefitId}`;
    upsertBy(f14, "record_id", `MER-V3-${benefitId}`, {
      ...COMMON,
      record_id: `MER-V3-${benefitId}`,
      business_name: `${tool} benefit measurement`,
      context_item: `${tool} benefit measurement`,
      dimension: "14_metrics_outcomes",
      evidence_id: evidenceId,
      use_case: useCaseId,
      risk_or_gap: caveat,
      affected_systems: tool,
      metric_boundary: towerAllowed === "no" ? "not_claimable" : "partial_finance_validation_only",
      forbidden_claims: "Do not claim realized AI value unless tower_claim_allowed is partial/yes and finance_validated_value_usd is populated.",
      baseline_available: baselineValue === "" ? "false" : "true",
      actual_available: kpiActual === "" ? "false" : "true",
      tower_claim_allowed: towerAllowed,
      measurement_owner: "FP&A Technology Finance Lead",
      measurement_cadence: cadence,
      source_system: sourceExtract,
      benefit_id: benefitId,
      linked_program_code: programCode,
      linked_use_case_id: useCaseId,
      baseline_value: String(baselineValue),
      target_value: String(targetValue),
      actual_value: String(kpiActual),
      finance_validated_value_usd: String(financeValue),
      value_claim_status: claimStatus,
      caveat,
    });
    upsertBy(f13, "evidence_id", evidenceId, evidence(evidenceId, `${tool} benefits realization evidence`));
  }

  for (const [id, category, tool, aiType, funding, budgetId, amount, notes] of aiSpendTags) {
    upsertBy(f13, "evidence_id", `MER-V3-EVID-${id}`, evidence(`MER-V3-EVID-${id}`, `${tool} AI spend tag`));
  }

  const systemsToAdd = [
    ["MER-V3-SYS-AI-001", "Microsoft 365 Copilot", "workplace_productivity_ai", "Workplace Technology", "high", "pilot", "MER-VEN-MICROSOFT", "Microsoft Graph; M365 audit logs", "usage, prompt/session telemetry, adoption cohorts"],
    ["MER-V3-SYS-AI-002", "GitHub Copilot Enterprise", "developer_productivity_ai", "Engineering", "medium", "pilot", "MER-VEN-GITHUB", "GitHub Enterprise; Azure DevOps", "developer usage, PR metrics, secure SDLC controls"],
    ["MER-V3-SYS-AI-003", "ServiceNow AI / Now Assist", "itsm_ai", "Service Management", "high", "pilot", "MER-VEN-SERVICENOW", "ServiceNow ITSM; Knowledge", "ticket summaries, virtual agent, deflection, AHT"],
    ["MER-V3-SYS-AI-004", "Workday AI", "hr_finance_workflow_ai", "HR / Finance", "medium", "pilot", "MER-VEN-WORKDAY", "Workday HCM; Workday Finance", "case workflow, policy assist, approval automation"],
    ["MER-V3-SYS-AI-005", "Genesys AI Routing and Knowledge", "contact_center_ai_foundation", "Member Experience", "high", "foundation", "MER-VEN-GENESYS", "Genesys Cloud CX; Salesforce Health Cloud", "routing, knowledge usage, AHT/FCR readiness"],
  ];
  for (const [recordId, name, capability, owner, criticality, lifecycle, vendorId, integrations, deps] of systemsToAdd) {
    upsertBy(f04, "business_name", name, {
      ...COMMON,
      record_id: recordId,
      business_name: name,
      context_item: name,
      dimension: "04_applications_systems",
      evidence_id: `MER-V3-EVID-SYS-${recordId}`,
      capability,
      owner,
      criticality,
      lifecycle_status: lifecycle,
      vendor_id: vendorId,
      integrations,
      data_dependencies: deps,
    });
    upsertBy(f13, "evidence_id", `MER-V3-EVID-SYS-${recordId}`, evidence(`MER-V3-EVID-SYS-${recordId}`, `${name} system evidence`));
  }

  const vendorsToAdd = [
    ["MER-V3-VEN-AI-001", "GitHub", "GitHub Copilot Enterprise", "Engineering", "MER-V3-SYS-AI-002", "Usage and secure SDLC evidence required before value claim.", "pilot subscription", 2_200_000, "PROG-DEV-PRODUCTIVITY"],
    ["MER-V3-VEN-AI-002", "Workday", "Workday AI HR/finance workflow assist", "HR / Finance", "MER-V3-SYS-AI-004", "Workflow and case baseline evidence required before value claim.", "embedded SaaS AI entitlement", 1_200_000, "PROG-WORKDAY-AI"],
    ["MER-V3-VEN-AI-003", "ServiceNow", "Now Assist / ITSM AI", "Service Management", "MER-V3-SYS-AI-003", "Ticket usage and deflection evidence required before value claim.", "embedded SaaS AI pilot", 4_000_000, "PROG-SNOW-AI"],
  ];
  addColumns(f07, { vendor_category: "", ai_capability: "", annual_contract_value_usd: "", linked_budget_record_ids: "", linked_program_code: "", ai_spend_flag: "false" });
  for (const [recordId, vendor, service, owner, systems, risk, pricing, acv, programCode] of vendorsToAdd) {
    upsertBy(f07, "business_name", vendor, {
      ...COMMON,
      record_id: recordId,
      business_name: vendor,
      context_item: vendor,
      dimension: "07_vendors_contracts",
      evidence_id: `MER-V3-EVID-VEN-${recordId}`,
      vendor_id: recordId.replace("MER-V3-", "MER-"),
      service,
      owning_function: owner,
      linked_systems: systems,
      contract_risk: risk,
      pricing_basis: pricing,
      vendor_category: "ai_saas_or_productivity_tool",
      ai_capability: service,
      annual_contract_value_usd: String(acv),
      linked_budget_record_ids: programs.find((p) => p[0] === programCode)?.[4].join(";") ?? "",
      linked_program_code: programCode,
      ai_spend_flag: "true",
    });
    upsertBy(f13, "evidence_id", `MER-V3-EVID-VEN-${recordId}`, evidence(`MER-V3-EVID-VEN-${recordId}`, `${vendor} AI vendor evidence`));
  }

  for (const [programCode, name, status, funding, budgetIds] of programs) {
    for (const budgetId of budgetIds) {
      const relationId = `MER-V3-REL-${programCode}-${budgetId}`;
      upsertBy(f12, "record_id", relationId, {
        ...COMMON,
        record_id: relationId,
        business_name: `${programCode} funded by ${budgetId}`,
        context_item: `${programCode} funded by ${budgetId}`,
        dimension: "12_relationships",
        evidence_id: `MER-V3-EVID-REL-${programCode}-${budgetId}`,
        use_case: programCode,
        risk_or_gap: funding === "approved" ? "Budget tie exists; value evidence still required." : "Budget tie is requested/not approved.",
        affected_systems: budgetById[budgetId]?.system ?? "",
        metric_boundary: "relationship_context_no_value_claim",
        forbidden_claims: "Do not infer realized value from budget-program relationship.",
        relationship_type: "funded_by_budget_row",
        from_object_type: "program",
        from_object_id: programCode,
        to_object_type: "budget_row",
        to_object_id: budgetId,
        relationship_strength: "source_backed_synthetic",
        caveat: funding === "approved" ? "Approved program funding link." : "Requested funding only.",
      });
      upsertBy(f13, "evidence_id", `MER-V3-EVID-REL-${programCode}-${budgetId}`, evidence(`MER-V3-EVID-REL-${programCode}-${budgetId}`, `${programCode} to ${budgetId} relationship evidence`));
    }
  }

  const sa02 = budgetLines.map(([id, tower, name, kind, amount, notes, vendor, system, aiType, aiCategory]) => ({
    tenant_key: tenantKey,
    source_record_id: `SA02-${id}`,
    fiscal_year: "FY26",
    period: "FY26-Q2-YTD",
    source_system: "synthetic_it_finance_budget_spend_extract",
    cost_center: `${tower.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_")}_CC`,
    account_gl_code: kind === "run" ? "IT-RUN-6100" : "IT-CHANGE-7300",
    spend_category: tower,
    it_tower_category: tower,
    business_unit: "Meridian Health Enterprise",
    program_code: programs.find((p) => p[4].includes(id))?.[0] ?? "",
    initiative_id: programs.find((p) => p[4].includes(id))?.[0]?.replace("PROG-", "INIT-") ?? "",
    vendor_name: vendor,
    system_name: system,
    run_change_flag: kind,
    budget_amount_usd: String(amount),
    actual_spend_usd: String(Math.round(amount * 0.26)),
    forecast_spend_usd: String(Math.round(amount * 0.965)),
    committed_spend_usd: String(Math.round(amount * 0.58)),
    invoice_amount_usd: String(Math.round(amount * 0.24)),
    variance_usd: String(Math.round(amount * 0.965) - amount),
    ai_spend_flag: aiCategory === "not_ai" ? "false" : "true",
    ai_spend_type: aiType,
    ai_spend_category: aiCategory,
    platform_embedded_ai_flag: aiType === "embedded_platform_ai" ? "true" : "false",
    finance_owner: "FP&A Technology Finance Lead",
    evidence_id: `MER-V3-EVID-BUD-${id}`,
    confidence: "high",
    active_candidate_status: "active",
    notes,
  }));

  const sa04 = programs.map(([programCode, name, status, funding, budgetIds, owner, aiType, aiCategory]) => {
    const amount = budgetIds.reduce((sum, id) => sum + (budgetById[id]?.amount ?? 0), 0);
    const approved = programApprovedAmount(programCode, funding, budgetIds);
    const linkedAiSpendIds = programAiSpendMap[programCode] ?? [];
    return {
      tenant_key: tenantKey,
      source_record_id: `SA04-${programCode}`,
      program_code: programCode,
      initiative_id: programCode.replace("PROG-", "INIT-"),
      program_name: name,
      initiative_status: status,
      funding_status: funding,
      approved_funding_usd: String(approved),
      requested_funding_usd: String(amount),
      linked_budget_record_ids: budgetIds.join(";"),
      linked_sa02_records: budgetIds.map((id) => `SA02-${id}`).join(";"),
      linked_ai_spend_ids: linkedAiSpendIds.join(";"),
      ai_tagged_approved_funding_usd: String(linkedAiSpendIds.reduce((sum, id) => sum + (aiSpendById[id]?.amount ?? 0), 0)),
      ai_spend_flag: aiCategory === "not_ai" ? "false" : "true",
      ai_spend_type: aiType,
      ai_spend_category: aiCategory,
      platform_embedded_ai_flag: aiType === "embedded_platform_ai" ? "true" : "false",
      executive_owner: owner,
      finance_owner: "FP&A Technology Finance Lead",
      tower_tracking_status: funding === "approved" ? "track_budget_and_measurement" : "requested_or_candidate",
      evidence_id: `MER-V3-EVID-PROG-${programCode}`,
      active_candidate_status: "active",
      notes: linkedAiSpendIds.length
        ? "Budget-linked approved AI program; amount is the AI-tagged sub-amount inside parent budget rows. Benefits require usage/KPI/finance evidence."
        : funding === "approved" ? "Budget-linked approved program; benefits require usage/KPI/finance evidence." : "Not approved; cannot be counted as funded.",
    };
  });

  const sa08 = benefitRows.map(([benefitId, programCode, useCaseId, vendor, tool, benefitType, promised, baselineMetric, baselineValue, targetMetric, targetValue, usageMetric, usageActual, adoptionRate, opKpi, kpiBaseline, kpiActual, financeValue, claimStatus, sourceExtract, cadence, towerAllowed, caveat]) => ({
    tenant_key: tenantKey,
    source_record_id: `SA08-${benefitId}`,
    ai_program_id: programCode,
    program_name: programs.find((p) => p[0] === programCode)?.[1] ?? programCode,
    ai_use_case_id: useCaseId,
    vendor_name: vendor,
    tool_name: tool,
    promised_benefit_type: benefitType,
    promised_value_usd: String(promised),
    baseline_metric: baselineMetric,
    baseline_value: String(baselineValue),
    target_metric: targetMetric,
    target_value: String(targetValue),
    usage_metric: usageMetric,
    usage_actual: String(usageActual),
    adoption_rate_pct: String(adoptionRate),
    operational_kpi: opKpi,
    kpi_baseline: String(kpiBaseline),
    kpi_actual: String(kpiActual),
    finance_validated_value_usd: String(financeValue),
    value_claim_status: claimStatus,
    evidence_id: `MER-V3-EVID-${benefitId}`,
    source_extract: sourceExtract,
    refresh_cadence: cadence,
    tower_claim_allowed: towerAllowed,
    caveat,
  }));

  const newInterviews = [
    ["MER-INT-19", "CFO / Finance & Value", "CFO", "Q13", "What must be true before AI spend can be counted as delivered value?", "The CFO would not let Tower count AI spend as delivered value until the usage extract, operational KPI movement, and FP&A validation all reconcile to the same program code. Copilot, ServiceNow, Workday, and developer productivity pilots can be measured, but Member Service AI Assist remains a candidate with no approved funding.", "value proof", "AI benefits realization", "finance validation", "AI spend can look adopted without released value", "AI Benefits Realization Ledger", "MER-MOVE-AI-BENEFITS", "M365 Copilot; ServiceNow; Workday; GitHub Copilot", "usage and finance actuals", "finance_validated_value_required", "FP&A validation and usage extracts required"],
    ["MER-INT-20", "Chief Experience Officer / Member Experience", "Chief Experience Officer", "Q13", "Is Member Service AI Assist funded?", "No. Member Service AI Assist is a candidate/discovery opportunity. The funded work is the contact-center platform, knowledge foundation, data readiness, and AI governance controls. A separate Moves business case is required before AI Assist receives approved funding.", "funding boundary", "Member Service AI Assist", "candidate funding boundary", "platform spend could be mistaken for AI Assist funding", "Member Service Agent Assist Transformation", "MER-MOVE-AI-ASSIST", "Genesys; Salesforce; ServiceNow", "member service data", "candidate_not_funded", "Approved business case, baseline, and PHI controls required"],
    ["MER-INT-21", "CISO / Security", "CISO", "Q13", "What blocks AI pilots from scaling?", "PHI access logging, human-in-the-loop validation, prompt/audit trails, and model inventory ownership must be complete before service, Workday, or member-facing AI pilots scale beyond controlled pilots.", "risk control", "AI governance", "PHI and model controls", "AI usage without audit controls creates compliance risk", "AI Governance / Model Risk Controls", "MER-MOVE-AI-GOV", "OneTrust; ServiceNow; Microsoft Purview", "PHI audit logs; model inventory", "controls_required", "HITL, audit logging, and model-risk evidence required"],
    ["MER-INT-22", "Contact Center / Member Service Operations", "Contact Center Operations", "Q13", "What usage data would prove AI Assist readiness?", "Operations needs call reason, AHT, FCR, transfer, knowledge-search, QA, and escalation baselines before AI Assist is funded. Usage data from Genesys and the knowledge platform should prove the foundation first.", "usage proof", "Member Service AI Assist", "baseline gap", "No AI Assist production usage exists yet", "Contact Center Platform / Knowledge Modernization", "MER-MOVE-CONTACT-KNOW", "Genesys; Salesforce; ServiceNow", "contact center events; knowledge base", "baseline_required", "AHT, FCR, transfer, CSAT, and QA baselines required"],
    ["MER-INT-23", "CIO / Enterprise Technology", "CIO", "Q13", "How should IT explain approved AI spend?", "The CIO should show AI spend as tagged inside approved platforms and programs: Copilot, ServiceNow, Workday, GitHub Copilot, Databricks, cloud AI services, and governance controls. It should not be described as a separate AI budget or as a delivered financial outcome.", "spend governance", "AI spend lens", "double-count risk", "AI spend is embedded across platforms", "FY26 AI spend governance", "MER-MOVE-AI-SPEND", "Microsoft; ServiceNow; Workday; GitHub; Databricks; AWS", "program and finance rows", "non_additive_ai_spend", "Budget, program, and benefits ledger ties required"],
  ];
  addColumns(interviews, { budget_or_value_mentioned: "" });
  for (const [interviewId, group, role, qid, question, answer, theme, priority, pain, challenge, initiative, move, systems, domain, metric, needed] of newInterviews) {
    const evidenceId = `MER-SA07-INT-EVID-9${interviewId.replace("MER-INT-", "").padStart(3, "0")}`;
    upsertBy(interviews, "interview_id", interviewId, {
      tenant_key: tenantKey,
      interview_id: interviewId,
      interview_group: group,
      executive_area: group,
      stakeholder_role: role,
      question_id: qid,
      question,
      synthetic_answer: answer,
      priority_theme: theme,
      business_priority: priority,
      pain_point: pain,
      known_challenge: challenge,
      key_initiative: initiative,
      initiative_link: move,
      system_or_vendor_mentioned: systems,
      data_domain_mentioned: domain,
      metric_mentioned: metric,
      risk_or_control_mentioned: needed,
      evidence_needed: needed,
      decision_supported: `${initiative} funding, measurement, or control decision`,
      confidence: "high",
      source_type: "executive_interview",
      source_adapter_id: "SA07",
      source_adapter_name: "SA07 Executive Interview Insights",
      interview_date: "2026-07-17",
      active_candidate_status: "active",
      evidence_id: evidenceId,
      module_usage_notes: COMMON.module_usage_notes,
      budget_or_value_mentioned: "yes",
    });

    const mappedDimensions = [
      ["01_business_functions", f01],
      ["02_org_ownership", f02],
      ["03_workforce_roles", f03],
      ["04_applications_systems", f04],
      ["05_data_assets_integrations", f05],
      ["07_vendors_contracts", f07],
      ["08_it_budget_spend_value", f08],
      ["09_programs_initiatives", f09],
      ["10_ai_automation_use_cases", f10],
      ["11_risks_controls", f11],
      ["12_relationships", f12],
      ["13_evidence_sources", f13],
      ["14_metrics_outcomes", f14],
      ["17_managed_services_scope", f17],
      ["18_operational_process_evidence", f18],
    ];
    for (const [dimension, rows] of mappedDimensions) {
      const recordId = `MER-SA07-${dimension.toUpperCase()}-9${interviewId.replace("MER-INT-", "").padStart(3, "0")}`;
      const context = `${group} says ${initiative} needs ${needed}: ${answer}`;
      upsertBy(rows, "record_id", recordId, {
        ...COMMON,
        record_id: recordId,
        business_name: dimension === "13_evidence_sources" ? `${group} interview evidence` : `${group}: ${initiative}`,
        context_item: context,
        dimension,
        evidence_id: evidenceId,
        active_candidate_status: "candidate",
        confidence: "medium",
        source_type: "executive_interview",
        source_basis: "synthetic_executive_interview_evidence",
        module_usage_notes: "Enterprise Profile|Business Functions|Org Ownership|Workforce Roles|Applications & Systems|Data Assets & Integrations|Vendors & Contracts|IT Budget Spend Value|Programs & Initiatives|Risks & Controls|Metrics & Outcomes|Managed Services Scope|Operational Process Evidence|SourceContextPack|MovesContextPack|TowerContextPack|Knowledge/Home CXO story blocks",
        use_case: initiative,
        data_domain: domain,
        systems,
        value_hypothesis: "",
        evidence_needed: needed,
        risk_or_gap: challenge,
        affected_systems: systems,
        metric_boundary: "interview_context_only",
        forbidden_claims: "Interview context cannot create approved funding or value claims.",
        legacy_row_flag: "true",
        source_row_status: "preserved_legacy_context",
        migration_action: "interview_gap_fill_mapped_not_financial_fact",
        additive_status: "excluded_from_budget_rollup",
        amount_basis: "not_budget_fact",
        finance_attestation_status: "not_applicable_interview_context",
        funding_status: "not_approved",
        approved_funding_usd: "0",
        realized_value_usd: "0",
        tower_claim_allowed: "no",
        evidence_type: dimension === "13_evidence_sources" ? "synthetic_executive_interview" : "",
        evidence_location: dimension === "13_evidence_sources" ? "datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv" : "",
        evidence_owner: dimension === "13_evidence_sources" ? role : "",
        caveat: "Interview-derived context only; requires source-system and finance evidence before budget or value claims.",
      });
    }
  }

  const rowsWithEvidence = [f01, f02, f03, f04, f05, f07, f08, f09, f10, f11, f12, f14, f17, f18, sa02, sa04, sa08].flat();
  for (const row of rowsWithEvidence) {
    const evidenceId = row.evidence_id;
    if (!evidenceId || String(evidenceId).startsWith("MER-SA07-INT-EVID-")) continue;
    upsertBy(
      f13,
      "evidence_id",
      evidenceId,
      evidence(
        evidenceId,
        `${row.business_name || row.program_name || row.tool_name || row.source_record_id || row.record_id || "Meridian source row"} evidence resolver`,
      ),
    );
  }

  writeCsv(path.join(repoRoot, coreFiles.f01), f01);
  writeCsv(path.join(repoRoot, coreFiles.f02), f02);
  writeCsv(path.join(repoRoot, coreFiles.f03), f03);
  writeCsv(path.join(repoRoot, coreFiles.f04), f04);
  writeCsv(path.join(repoRoot, coreFiles.f05), f05);
  writeCsv(path.join(repoRoot, coreFiles.f07), f07);
  writeCsv(path.join(repoRoot, coreFiles.f08), f08);
  writeCsv(path.join(repoRoot, coreFiles.f09), f09);
  writeCsv(path.join(repoRoot, coreFiles.f10), f10);
  writeCsv(path.join(repoRoot, coreFiles.f11), f11);
  writeCsv(path.join(repoRoot, coreFiles.f12), f12);
  writeCsv(path.join(repoRoot, coreFiles.f13), f13);
  writeCsv(path.join(repoRoot, coreFiles.f14), f14);
  writeCsv(path.join(repoRoot, coreFiles.f17), f17);
  writeCsv(path.join(repoRoot, coreFiles.f18), f18);
  writeCsv(interviewsPath, interviews);
  writeCsv(path.join(baseDir, "SA02_IT_Finance_Budget_Spend_Extract.csv"), sa02);
  writeCsv(path.join(baseDir, "SA04_Program_Portfolio_Extract.csv"), sa04);
  writeCsv(path.join(baseDir, "SA08_AI_Benefits_Realization_Usage_Ledger.csv"), sa08);

  const runTotal = budgetLines.filter((l) => l[3] === "run").reduce((s, l) => s + l[4], 0);
  const changeTotal = budgetLines.filter((l) => l[3] === "change").reduce((s, l) => s + l[4], 0);
  const aiTotal = aiSpendTags.reduce((s, l) => s + l[6], 0);
  const report = {
    generated_at: new Date().toISOString(),
    budget: { runTotal, changeTotal, total: runTotal + changeTotal, expected: MONEY, aiTaggedSpendNonAdditive: aiTotal },
    row_counts: {
      "08": f08.length,
      "09": f09.length,
      "10": f10.length,
      "14": f14.length,
      "17": f17.length,
      sa02: sa02.length,
      sa04: sa04.length,
      sa08: sa08.length,
      interviews: interviews.length,
    },
    row_preservation: rowReport,
  };
  fs.writeFileSync(path.join(reportDir, "summary.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeCsv(path.join(reportDir, "budget-reconciliation.csv"), [
    { check: "run_total", expected_usd: MONEY.run, actual_usd: runTotal, result: runTotal === MONEY.run ? "PASS" : "FAIL" },
    { check: "change_total", expected_usd: MONEY.change, actual_usd: changeTotal, result: changeTotal === MONEY.change ? "PASS" : "FAIL" },
    { check: "total_budget", expected_usd: MONEY.total, actual_usd: runTotal + changeTotal, result: runTotal + changeTotal === MONEY.total ? "PASS" : "FAIL" },
    { check: "ai_tagged_spend_non_additive", expected_usd: "formula_sum", actual_usd: aiTotal, result: "PASS" },
  ]);
  writeCsv(path.join(reportDir, "program-budget-links.csv"), programs.map(([programCode, name, status, funding, budgetIds]) => ({
    program_code: programCode,
    program_name: name,
    initiative_status: status,
    funding_status: funding,
    linked_budget_record_ids: budgetIds.join(";"),
    linked_budget_count: budgetIds.length,
    approved_funding_usd: funding === "approved" ? budgetIds.reduce((s, id) => s + (budgetById[id]?.amount ?? 0), 0) : 0,
    result: funding === "approved" && budgetIds.length === 0 ? "FAIL" : "PASS",
  })));
  writeCsv(path.join(reportDir, "ai-benefits-ledger-summary.csv"), benefitRows.map((row) => ({
    benefit_id: row[0],
    program_code: row[1],
    use_case_id: row[2],
    vendor_name: row[3],
    tool_name: row[4],
    promised_value_usd: row[6],
    finance_validated_value_usd: row[17],
    value_claim_status: row[18],
    tower_claim_allowed: row[21],
  })));
  fs.writeFileSync(path.join(reportDir, "summary.md"), `# Meridian V3 Real Repo Integration\n\nGenerated source templates for V3 reload.\n\n- FY26 technology budget: $${(runTotal + changeTotal).toLocaleString()}\n- Run: $${runTotal.toLocaleString()}\n- Change: $${changeTotal.toLocaleString()}\n- AI-tagged spend, non-additive: $${aiTotal.toLocaleString()}\n- SA02 finance rows: ${sa02.length}\n- SA04 program rows: ${sa04.length}\n- SA08 benefits ledger rows: ${sa08.length}\n- Existing 08/09/10/14/17 rows preserved and reclassified, not deleted.\n\nNo Azure/Postgres load, promotion, deploy, or runtime update was performed.\n`);
}

finalize();

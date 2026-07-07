import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenantDir = path.join(repoRoot, "datasets/lakeshore-holdings-synthetic-v6");
const templateDir = path.join(tenantDir, "templates");
const holdcoDir = path.join(tenantDir, "holdco_tower");

const TENANT_KEY = "lakeshore-holdings";
const CLIENT = "Lakeshore Holdings";
const VERSION = "v6.0";
const AS_OF = "2026-06-18";
const CREATED = "2026-06-28T00:00:00Z";
const UPDATED = "2026-07-01T18:00:00Z";

const baseDefaults = {
  tenant_key: TENANT_KEY,
  client_display_name: CLIENT,
  v6_contract_version: VERSION,
  source_system: "v6_holdco_synthetic_pack",
  source_owner: "AbarVa Synthetic Data Steward",
  source_basis: "synthetic_demo",
  as_of_date: AS_OF,
  period_start: "2026-01-01",
  period_end: "2026-12-31",
  refresh_frequency: "quarterly",
  confidence: "high",
  synthetic_demo_flag: "synthetic_demo",
  data_sensitivity: "synthetic_confidential",
  required_for_surfaces: "Home|Intelligence|Tower|Moves|Source",
  allowed_answer_types: "facts|tables|charts|graphs|benchmark_context|decision_support",
  not_allowed_claims: "public_real_company_claim|actual_financial_filing_claim|cross_tenant_claim|unsupported_roi_claim",
  known_gaps: "none",
  created_at: CREATED,
  updated_at: UPDATED,
};

function readHeader(fileName) {
  const file = path.join(templateDir, fileName);
  return fs.readFileSync(file, "utf8").split(/\r?\n/)[0].split(",");
}

function csvEscape(value) {
  const text = String(value ?? "not_applicable");
  if (text === "") return "not_applicable";
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(fileName, rows) {
  const headers = readHeader(fileName);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  fs.writeFileSync(path.join(templateDir, fileName), `${lines.join("\n")}\n`);
}

function shared(family, id, name, sourceFile, rowNumber, owner = "AbarVa Synthetic Data Steward") {
  return {
    ...baseDefaults,
    business_object_family: family,
    record_id: id,
    record_name: name,
    source_owner: owner,
    source_file: sourceFile,
    source_row_number: rowNumber,
  };
}

const entities = [
  {
    entity_id: "LH-HOLDCO",
    entity_name: "Lakeshore Holdings",
    entity_type: "holding_company",
    parent_entity_id: "none",
    industry: "Diversified private holding company",
    revenue_usd: 0,
    employees: 11800,
    it_budget_usd: 190600000,
    cio_role: "Group CIO",
    notes: "Holdco direct revenue is zero for answer purposes; portfolio-company revenue rolls up to 7.12B. Direct IT budget excludes internal allocation rows.",
  },
  {
    entity_id: "LH-CORP",
    entity_name: "Corporate Shared Services",
    entity_type: "corporate_shared_services",
    parent_entity_id: "LH-HOLDCO",
    industry: "Corporate center",
    revenue_usd: 0,
    employees: 610,
    it_budget_usd: 36500000,
    cio_role: "Group CIO",
    notes: "Runs HR, legal, finance, treasury, investments, governance, productivity, identity, integration, reporting, and enterprise platforms.",
  },
  {
    entity_id: "LH-INNOV",
    entity_name: "Corporate Innovation IT and Data AI",
    entity_type: "corporate_innovation_it",
    parent_entity_id: "LH-CORP",
    industry: "Data and AI enablement",
    revenue_usd: 0,
    employees: 42,
    it_budget_usd: 11800000,
    cio_role: "VP Corporate Innovation IT and Data AI",
    notes: "Subset of Corporate IT budget; not additive to enterprise total. Leads shared data products, AI experiments, governance, and reusable automation patterns.",
  },
  {
    entity_id: "LH-NORTHLINE",
    entity_name: "Northline",
    entity_type: "portfolio_company",
    parent_entity_id: "LH-HOLDCO",
    industry: "Logistics and warehouse operations",
    revenue_usd: 1500000000,
    employees: 6000,
    it_budget_usd: 42600000,
    cio_role: "Northline CIO",
    notes: "Local IT owns warehouse, transportation, telematics, labor, and logistics data platforms while consuming corporate shared services.",
  },
  {
    entity_id: "LH-BRIGHTMARK",
    entity_name: "Brightmark",
    entity_type: "portfolio_company",
    parent_entity_id: "LH-HOLDCO",
    industry: "Marketing services",
    revenue_usd: 720000000,
    employees: 2450,
    it_budget_usd: 33600000,
    cio_role: "Brightmark CIO",
    notes: "Local IT owns CRM, campaign operations, project margin, resource planning, creative operations, and customer analytics.",
  },
  {
    entity_id: "LH-FORGEFIELD",
    entity_name: "Forge & Field",
    entity_type: "portfolio_company",
    parent_entity_id: "LH-HOLDCO",
    industry: "Consumer products and direct-to-consumer commerce",
    revenue_usd: 800000000,
    employees: 1530,
    it_budget_usd: 45500000,
    cio_role: "Forge & Field CIO",
    notes: "Local IT owns ERP, demand planning, commerce, customer data, manufacturing planning, and supply-chain analytics.",
  },
  {
    entity_id: "LH-GLPANTRY",
    entity_name: "Great Lakes Pantry",
    entity_type: "portfolio_company",
    parent_entity_id: "LH-HOLDCO",
    industry: "Workplace services",
    revenue_usd: 540000000,
    employees: 1210,
    it_budget_usd: 32400000,
    cio_role: "Great Lakes Pantry IT Director",
    notes: "Local IT owns field service, workforce scheduling, billing, customer support, asset data, and service quality reporting.",
  },
  {
    entity_id: "LH-OPCO-ALLOC",
    entity_name: "Operating-company revenue allocation bucket",
    entity_type: "portfolio_company_revenue_bucket",
    parent_entity_id: "LH-HOLDCO",
    industry: "Operating-company allocation required",
    revenue_usd: 3560000000,
    employees: 0,
    it_budget_usd: 0,
    cio_role: "Group CFO",
    notes: "This is not holding-company revenue. It is the remaining operating-company revenue bucket that must be spread to named or additional operating companies before board-grade opco reporting.",
  },
];

const opcos = entities.filter((entity) => entity.entity_type === "portfolio_company");
const directBudgetEntities = entities.filter((entity) =>
  ["corporate_shared_services", "portfolio_company"].includes(entity.entity_type),
);
const directItBudget = directBudgetEntities.reduce((sum, entity) => sum + entity.it_budget_usd, 0);
const innovationBudget = entities.find((entity) => entity.entity_id === "LH-INNOV").it_budget_usd;

const functions = [
  ["LH-FN-FIN", "Corporate Finance and Treasury", "CFO", "shared_service", "close cycle days|cash visibility|bank connectivity control rate", "record-to-report|treasury operations|cash forecasting"],
  ["LH-FN-HR", "Corporate HR and Talent", "Chief People Officer", "shared_service", "employee master accuracy|time-to-hire|HR case SLA", "hire-to-retire|payroll governance|talent mobility"],
  ["LH-FN-LEGAL", "Corporate Legal and Compliance", "General Counsel", "shared_service", "contract cycle time|matter aging|policy attestation rate", "contract lifecycle|matter management|legal holds"],
  ["LH-FN-INVEST", "Investments and Portfolio Management", "Chief Investment Officer", "shared_service", "portfolio KPI freshness|deal pipeline accuracy|board pack cycle time", "portfolio review|M and A diligence|capital allocation"],
  ["LH-FN-CORP-IT", "Corporate IT", "Group CIO", "shared_it", "platform uptime|ticket SLA|security control coverage|run change mix", "enterprise platforms|identity|collaboration|integration|security"],
  ["LH-FN-INNOV", "Corporate Innovation IT and Data AI", "VP Corporate Innovation IT and Data AI", "innovation_it", "experiment-to-scale rate|data product reuse|AI governance coverage", "AI opportunity discovery|data product factory|model risk intake"],
  ["LH-FN-NORTHLINE-OPS", "Northline Logistics Operations", "Northline COO", "portfolio_company", "on-time dispatch|warehouse throughput|labor utilization", "warehouse execution|transportation planning|telematics operations"],
  ["LH-FN-NORTHLINE-IT", "Northline Local IT", "Northline CIO", "portfolio_company_it", "WMS availability|TMS integration freshness|local ticket SLA", "local applications|local data products|opco IT operations"],
  ["LH-FN-CRESTPOINT-OPS", "Brightmark Client Delivery", "Brightmark COO", "portfolio_company", "project margin|resource utilization|campaign cycle time", "client delivery|resource planning|campaign operations"],
  ["LH-FN-CRESTPOINT-IT", "Brightmark Local IT", "Brightmark CIO", "portfolio_company_it", "CRM quality|creative workflow uptime|analytics freshness", "local applications|local data products|opco IT operations"],
  ["LH-FN-RIVERTON-OPS", "Forge & Field Commercial and Supply Chain", "Forge & Field COO", "portfolio_company", "fill rate|forecast accuracy|DTC conversion", "demand planning|DTC commerce|supply planning"],
  ["LH-FN-RIVERTON-IT", "Forge & Field Local IT", "Forge & Field CIO", "portfolio_company_it", "ERP uptime|commerce incident rate|planning data quality", "local applications|local data products|opco IT operations"],
  ["LH-FN-ARBORFIELD-OPS", "Great Lakes Pantry Service Operations", "Great Lakes Pantry COO", "portfolio_company", "technician productivity|first-time fix|billing leakage", "field service|workforce scheduling|billing operations"],
  ["LH-FN-ARBORFIELD-IT", "Great Lakes Pantry Local IT", "Great Lakes Pantry IT Director", "portfolio_company_it", "FSM uptime|billing data quality|service desk SLA", "local applications|local data products|opco IT operations"],
];

const systems = [
  ["LH-SYS-WORKDAY", "Workday HCM and Finance", "Corporate HR and Finance operations", "Group CIO", "high", "modernizing", "LH-VDR-WORKDAY", 6800000, "Kyriba;ServiceNow;Azure Data Lakehouse", "employee master;cost center;payroll journal", "medium"],
  ["LH-SYS-ORACLE", "Oracle Fusion ERP", "Corporate finance and shared services ERP", "VP Corporate Platforms", "high", "scale", "LH-VDR-ORACLE", 7900000, "Kyriba;Power BI;MuleSoft", "general ledger;AP;AR;procurement", "medium"],
  ["LH-SYS-KYRIBA", "Kyriba Treasury", "Treasury cash visibility and payments", "Treasurer", "high", "scale", "LH-VDR-KYRIBA", 2100000, "Oracle Fusion ERP;bank gateways;Power BI", "cash position;bank transactions;payments", "high"],
  ["LH-SYS-IRONCLAD", "Ironclad CLM", "Legal contract lifecycle management", "General Counsel", "medium", "pilot", "LH-VDR-IRONCLAD", 900000, "Oracle Fusion ERP;ServiceNow", "contracts;obligations;renewals", "medium"],
  ["LH-SYS-DEALCLOUD", "DealCloud Portfolio CRM", "Investment pipeline and portfolio reviews", "Chief Investment Officer", "medium", "scale", "LH-VDR-DEALCLOUD", 1100000, "Power BI;Azure Data Lakehouse", "portfolio KPIs;deal stages;board actions", "high"],
  ["LH-SYS-SNOW", "ServiceNow ITSM", "Enterprise service management", "VP Corporate Platforms", "high", "modernizing", "LH-VDR-SERVICENOW", 4300000, "Workday;MuleSoft;Entra ID", "incidents;requests;change records;CMDB", "high"],
  ["LH-SYS-AZURE-LAKE", "Azure Data Lakehouse", "Shared analytics and portfolio data products", "VP Corporate Innovation IT and Data AI", "high", "build", "LH-VDR-MICROSOFT", 5200000, "Power BI;Databricks;opco source extracts", "financial actuals;program spend;operational KPIs", "high"],
  ["LH-SYS-DATABRICKS", "Databricks Innovation Workspace", "AI and analytics experimentation", "VP Corporate Innovation IT and Data AI", "medium", "pilot", "LH-VDR-DATABRICKS", 1800000, "Azure Data Lakehouse;AI Governance Registry", "feature sets;model outputs;experiment logs", "high"],
  ["LH-SYS-ENTRA", "Microsoft Entra ID", "Identity and access management", "CISO", "high", "scale", "LH-VDR-MICROSOFT", 3600000, "Workday;ServiceNow;opco apps", "identity;access policies;privileged accounts", "medium"],
  ["LH-SYS-M365", "Microsoft 365 and Copilot", "Collaboration and productivity", "VP Corporate Platforms", "high", "scale", "LH-VDR-MICROSOFT", 8200000, "Entra ID;Purview;ServiceNow", "mail;documents;collaboration telemetry", "high"],
  ["LH-SYS-MULESOFT", "MuleSoft Integration Hub", "Enterprise integration and API management", "VP Corporate Platforms", "high", "modernizing", "LH-VDR-SALESFORCE", 2500000, "Oracle Fusion ERP;Workday;opco APIs", "API transactions;integration health", "medium"],
  ["LH-SYS-AI-GOV", "AI Governance Registry", "AI intake and model risk workflow", "VP Corporate Innovation IT and Data AI", "medium", "build", "LH-VDR-SERVICENOW", 650000, "ServiceNow;Databricks;Power BI", "use cases;risk reviews;approval status", "high"],
  ["LH-SYS-NORTH-WMS", "Northline Warehouse WMS", "Warehouse execution", "Northline CIO", "high", "modernizing", "LH-VDR-MANHATTAN", 6100000, "Northline TMS;Azure Data Lakehouse", "orders;inventory;pick labor", "high"],
  ["LH-SYS-NORTH-TMS", "Northline TMS", "Transportation planning and dispatch", "Northline CIO", "high", "scale", "LH-VDR-BLUEYONDER", 4800000, "Northline WMS;telematics;Power BI", "loads;routes;carrier performance", "high"],
  ["LH-SYS-NORTH-TELE", "Northline Fleet Telematics", "Fleet telemetry and safety", "Northline CIO", "medium", "scale", "LH-VDR-GEOTAB", 1500000, "Northline TMS;Azure Data Lakehouse", "vehicle telemetry;driver events", "medium"],
  ["LH-SYS-CREST-CRM", "Brightmark Salesforce CRM", "Client pipeline and account operations", "Brightmark CIO", "high", "scale", "LH-VDR-SALESFORCE", 4700000, "Brightmark PSA;Marketing Automation", "accounts;opportunities;client health", "high"],
  ["LH-SYS-CREST-PSA", "Brightmark Professional Services Automation", "Project margin and resource planning", "Brightmark CIO", "high", "modernizing", "LH-VDR-KANTATA", 3300000, "Salesforce CRM;Workday;Power BI", "projects;time;margin;resource plan", "high"],
  ["LH-SYS-CREST-MKT", "Brightmark Marketing Automation", "Campaign orchestration", "Brightmark CIO", "medium", "scale", "LH-VDR-ADOBE", 2600000, "Salesforce CRM;Data Lakehouse", "campaigns;leads;content performance", "medium"],
  ["LH-SYS-RIV-ERP", "Forge & Field SAP S/4", "Consumer products ERP and planning", "Forge & Field CIO", "high", "modernizing", "LH-VDR-SAP", 8700000, "Demand Planning;DTC Commerce;Azure Data Lakehouse", "orders;inventory;costs;production plan", "high"],
  ["LH-SYS-RIV-DTC", "Forge & Field DTC Commerce", "Direct-to-consumer storefront and order capture", "Forge & Field CIO", "high", "scale", "LH-VDR-SHOPIFY", 4100000, "SAP S/4;Customer Data Platform", "orders;customer behavior;conversion", "high"],
  ["LH-SYS-RIV-DEMAND", "Forge & Field Demand Planning", "Forecasting and supply planning", "Forge & Field CIO", "high", "build", "LH-VDR-BLUEYONDER", 3600000, "SAP S/4;DTC Commerce;Azure Data Lakehouse", "forecast;inventory;replenishment", "high"],
  ["LH-SYS-ARB-FSM", "Great Lakes Pantry Field Service", "Technician dispatch and service execution", "Great Lakes Pantry IT Director", "high", "modernizing", "LH-VDR-SERVICEMAX", 3900000, "Scheduling;Billing;Power BI", "work orders;technician status;parts usage", "high"],
  ["LH-SYS-ARB-SCHED", "Great Lakes Pantry Workforce Scheduling", "Technician and field workforce planning", "Great Lakes Pantry IT Director", "medium", "scale", "LH-VDR-UKG", 2200000, "Field Service;Workday", "schedules;availability;overtime", "medium"],
  ["LH-SYS-ARB-BILL", "Great Lakes Pantry Billing Platform", "Billing leakage and revenue operations", "Great Lakes Pantry IT Director", "high", "modernizing", "LH-VDR-ZUORA", 2500000, "Field Service;Oracle Fusion ERP", "invoices;usage;credits;collections", "high"],
];

const vendors = [
  ["LH-VDR-WORKDAY", "Workday", "LH-CTR-WORKDAY-001", "HCM and finance SaaS", 6800000, "2027-02-28", "Corporate HR and Finance", "LH-SYS-WORKDAY", "medium", "subscription plus implementation services"],
  ["LH-VDR-ORACLE", "Oracle", "LH-CTR-ORACLE-001", "ERP and database services", 7900000, "2026-12-31", "Corporate Finance and IT", "LH-SYS-ORACLE", "medium", "subscription plus support"],
  ["LH-VDR-KYRIBA", "Kyriba", "LH-CTR-KYRIBA-001", "Treasury workstation and bank connectivity", 2100000, "2026-09-30", "Corporate Treasury", "LH-SYS-KYRIBA", "medium", "subscription plus bank connectivity"],
  ["LH-VDR-IRONCLAD", "Ironclad", "LH-CTR-IRON-001", "Contract lifecycle management", 900000, "2026-11-30", "Corporate Legal", "LH-SYS-IRONCLAD", "medium", "subscription"],
  ["LH-VDR-DEALCLOUD", "DealCloud", "LH-CTR-DEAL-001", "Portfolio CRM and investment pipeline", 1100000, "2027-04-30", "Investments and Portfolio Management", "LH-SYS-DEALCLOUD", "low", "subscription"],
  ["LH-VDR-MICROSOFT", "Microsoft", "LH-CTR-MSFT-001", "Cloud, identity, productivity, and AI", 17200000, "2027-06-30", "Corporate IT", "LH-SYS-M365|LH-SYS-ENTRA|LH-SYS-AZURE-LAKE", "high", "enterprise agreement and consumption"],
  ["LH-VDR-SERVICENOW", "ServiceNow", "LH-CTR-SNOW-001", "ITSM and AI governance workflow", 4950000, "2026-11-30", "Corporate IT", "LH-SYS-SNOW|LH-SYS-AI-GOV", "medium", "subscription plus workflow automation"],
  ["LH-VDR-DATABRICKS", "Databricks", "LH-CTR-DBX-001", "AI and analytics workspace", 1800000, "2027-01-31", "Innovation IT", "LH-SYS-DATABRICKS", "medium", "consumption"],
  ["LH-VDR-SALESFORCE", "Salesforce", "LH-CTR-SFDC-001", "CRM and integration platform", 7200000, "2026-10-31", "Brightmark and Corporate IT", "LH-SYS-CREST-CRM|LH-SYS-MULESOFT", "medium", "subscription plus integration"],
  ["LH-VDR-MANHATTAN", "Manhattan Associates", "LH-CTR-MANH-001", "Warehouse execution", 6100000, "2027-03-31", "Northline IT", "LH-SYS-NORTH-WMS", "medium", "subscription plus support"],
  ["LH-VDR-BLUEYONDER", "Blue Yonder", "LH-CTR-BY-001", "Transportation and demand planning", 8400000, "2026-09-30", "Northline and Forge & Field IT", "LH-SYS-NORTH-TMS|LH-SYS-RIV-DEMAND", "high", "subscription plus optimization"],
  ["LH-VDR-GEOTAB", "Geotab", "LH-CTR-GEOTAB-001", "Fleet telematics", 1500000, "2027-02-28", "Northline IT", "LH-SYS-NORTH-TELE", "medium", "subscription by vehicle"],
  ["LH-VDR-KANTATA", "Kantata", "LH-CTR-KANTATA-001", "Professional services automation", 3300000, "2026-12-31", "Brightmark IT", "LH-SYS-CREST-PSA", "medium", "subscription"],
  ["LH-VDR-ADOBE", "Adobe", "LH-CTR-ADOBE-001", "Marketing automation and creative workflow", 2600000, "2027-01-31", "Brightmark IT", "LH-SYS-CREST-MKT", "medium", "subscription"],
  ["LH-VDR-SAP", "SAP", "LH-CTR-SAP-001", "ERP platform for Forge & Field", 8700000, "2027-05-31", "Forge & Field IT", "LH-SYS-RIV-ERP", "medium", "subscription and managed support"],
  ["LH-VDR-SHOPIFY", "Shopify", "LH-CTR-SHOP-001", "DTC commerce platform", 4100000, "2027-02-28", "Forge & Field IT", "LH-SYS-RIV-DTC", "medium", "subscription plus transaction fees"],
  ["LH-VDR-SERVICEMAX", "ServiceMax", "LH-CTR-SMAX-001", "Field service management", 3900000, "2026-08-31", "Great Lakes Pantry IT", "LH-SYS-ARB-FSM", "high", "subscription plus mobile platform"],
  ["LH-VDR-UKG", "UKG", "LH-CTR-UKG-001", "Workforce scheduling", 2200000, "2027-03-31", "Great Lakes Pantry IT", "LH-SYS-ARB-SCHED", "low", "subscription by worker"],
  ["LH-VDR-ZUORA", "Zuora", "LH-CTR-ZUORA-001", "Billing platform", 2500000, "2026-10-31", "Great Lakes Pantry IT", "LH-SYS-ARB-BILL", "medium", "subscription plus transaction volume"],
];

const budgetByEntity = [
  ["LH-CORP", "Corporate Shared Services IT", 36500000, 23600000, 12900000, "Corporate IT budget supporting HR, legal, finance, treasury, investments, productivity, identity, integration, and shared data platforms."],
  ["LH-NORTHLINE", "Northline IT", 42600000, 27000000, 15600000, "Local IT budget for warehouse, transportation, telematics, labor, and logistics analytics."],
  ["LH-CRESTPOINT", "Brightmark IT", 33600000, 20400000, 13200000, "Local IT budget for CRM, project delivery, creative operations, marketing automation, and analytics."],
  ["LH-RIVERTON", "Forge & Field IT", 45500000, 27800000, 17700000, "Local IT budget for ERP, commerce, demand planning, manufacturing planning, and supply chain analytics."],
  ["LH-ARBORFIELD", "Great Lakes Pantry IT", 32400000, 19400000, 13000000, "Local IT budget for field service, workforce scheduling, billing, and service quality analytics."],
];

const programs = [
  ["LH-PGM-CORP-ERP", "Corporate ERP and HCM controls modernization", "CFO", "VP Corporate Platforms", "Group CIO", "build", 12000000, 5200000, 20000000, 2800000, "control automation and close-cycle reduction", "watch", "2027-03-31", "Oracle Fusion ERP;Workday;ServiceNow", "Benefits evidence needs quarterly attestation", "Continue with value proof gate"],
  ["LH-PGM-TREASURY", "Treasury cash visibility standardization", "Treasurer", "VP Corporate Platforms", "CFO", "scale", 7500000, 2400000, 10000000, 1200000, "cash visibility, reduced idle cash, bank fee control", "on_track", "2026-12-31", "Kyriba;Oracle Fusion ERP;bank connectivity", "Bank interface remediation still open for two opcos", "Scale after bank-control evidence"],
  ["LH-PGM-LEGAL-CLM", "Legal contract lifecycle foundation", "General Counsel", "VP Corporate Platforms", "General Counsel", "pilot", 3800000, 1100000, 4500000, 300000, "cycle time and renewal obligation capture", "watch", "2026-11-30", "Ironclad CLM;Oracle Fusion ERP", "Legacy contract migration incomplete", "Hold broad rollout until contract migration coverage improves"],
  ["LH-PGM-DATA-FOUND", "Portfolio data foundation", "Chief Investment Officer", "VP Corporate Innovation IT and Data AI", "Group CIO", "build", 11800000, 4800000, 19000000, 1700000, "reusable portfolio KPI and board-pack data products", "on_track", "2027-02-28", "Azure Data Lakehouse;Databricks;Power BI", "Source freshness varies by opco", "Fund next tranche with opco data-owner signoff"],
  ["LH-PGM-AI-GOV", "AI governance and opportunity intake", "Group CIO", "VP Corporate Innovation IT and Data AI", "Group CIO", "build", 2800000, 900000, 4000000, 200000, "faster AI intake with model risk controls", "on_track", "2026-10-31", "AI Governance Registry;ServiceNow;Databricks", "Measured value is early", "Scale intake workflow before model experimentation expands"],
  ["LH-PGM-NORTH-WARE", "Northline warehouse automation analytics", "Northline COO", "Northline CIO", "Northline CEO", "scale", 8600000, 3100000, 13000000, 2500000, "labor productivity and throughput improvement", "on_track", "2027-01-31", "Northline WMS;Azure Data Lakehouse", "Labor standard baselines need validation", "Scale in two largest distribution centers"],
  ["LH-PGM-NORTH-TMS", "Northline transport visibility cockpit", "Northline COO", "Northline CIO", "Northline CEO", "build", 6400000, 2200000, 8000000, 1100000, "route exception reduction and carrier performance", "watch", "2026-12-15", "Northline TMS;Fleet Telematics", "Carrier data quality is inconsistent", "Fix carrier feed quality before expanding AI dispatch"],
  ["LH-PGM-CREST-MARGIN", "Brightmark project margin cockpit", "Brightmark CFO", "Brightmark CIO", "Brightmark CEO", "pilot", 5800000, 1900000, 7000000, 900000, "project margin visibility and writeoff reduction", "watch", "2027-02-28", "Brightmark PSA;Salesforce CRM", "Timesheet compliance is not uniform", "Continue pilot with resource governance"],
  ["LH-PGM-CREST-GENAI", "Brightmark proposal and creative GenAI assistant", "Brightmark COO", "Brightmark CIO", "Brightmark CEO", "pilot", 3200000, 1000000, 5000000, 400000, "proposal cycle-time reduction and content reuse", "watch", "2026-11-30", "Microsoft 365 Copilot;Salesforce CRM;Adobe", "Content approval and brand-risk controls pending", "Hold scale until approval workflow evidence is loaded"],
  ["LH-PGM-RIV-DEMAND", "Forge & Field DTC demand sensing", "Forge & Field COO", "Forge & Field CIO", "Forge & Field CEO", "build", 7200000, 2600000, 11000000, 1200000, "forecast accuracy and stockout reduction", "watch", "2027-01-31", "Forge & Field Demand Planning;DTC Commerce;SAP S/4", "SKU-location quality is uneven", "Gate scale on forecast-error baseline"],
  ["LH-PGM-RIV-SUPPLY", "Forge & Field supply planning modernization", "Forge & Field COO", "Forge & Field CIO", "Forge & Field CEO", "build", 6800000, 2000000, 9000000, 800000, "planning cycle-time and inventory control", "watch", "2027-03-31", "SAP S/4;Demand Planning", "Master-data ownership is fragmented", "Resolve master-data ownership before heavy automation"],
  ["LH-PGM-ARB-TECH", "Great Lakes Pantry technician productivity", "Great Lakes Pantry COO", "Great Lakes Pantry IT Director", "Great Lakes Pantry CEO", "scale", 4900000, 1600000, 6000000, 600000, "first-time fix and route productivity", "on_track", "2026-12-31", "Great Lakes Pantry Field Service;Workforce Scheduling", "Parts availability data is incomplete", "Scale with parts-data remediation"],
  ["LH-PGM-ARB-BILL", "Great Lakes Pantry billing leakage controls", "Great Lakes Pantry CFO", "Great Lakes Pantry IT Director", "Great Lakes Pantry CEO", "pilot", 3700000, 1200000, 5500000, 700000, "billing leakage reduction and faster collections", "on_track", "2026-10-31", "Billing Platform;Oracle Fusion ERP", "Credit memo root-cause coding is thin", "Continue pilot and standardize leakage reason codes"],
  ["LH-PGM-ZT", "Enterprise zero-trust access cleanup", "CISO", "VP Corporate Platforms", "Group CIO", "build", 6000000, 2400000, 0, 0, "risk reduction and privileged-access control", "watch", "2026-12-31", "Entra ID;ServiceNow;opco apps", "Risk avoided is not a measured value claim", "Treat as risk program, not ROI program"],
  ["LH-PGM-ITSM", "ServiceNow ITSM standardization", "Group CIO", "VP Corporate Platforms", "Group CIO", "build", 5200000, 1800000, 6200000, 500000, "ticket SLA, change quality, and CMDB completeness", "watch", "2027-01-31", "ServiceNow ITSM;opco service desks", "Opco service catalogs are inconsistent", "Standardize service taxonomy before enterprise reporting"],
];

const aiInitiatives = [
  ["LH-AI-001", "Portfolio KPI narrative assistant", "board reporting", "Claude via governed dossier", "Board packet narrative copilot", "Corporate investments team", 45, 18, "40% recurring monthly use", "reduce board-pack preparation time and improve consistency", 350000, "pilot", "medium", "tier_2", "medium", "continue", "scale_with_guardrails"],
  ["LH-AI-002", "Treasury cash anomaly monitor", "treasury operations", "Azure ML and rules engine", "Cash anomaly agent", "Treasury analysts", 16, 9, "weekly exception triage", "catch duplicate or late payment anomalies", 120000, "pilot", "medium", "tier_2", "high", "continue", "scale_after_bank_feed_cleanup"],
  ["LH-AI-003", "Northline dispatch exception assistant", "transportation dispatch", "LLM plus TMS context", "Dispatch exception advisor", "dispatch supervisors", 80, 24, "daily use in two regions", "reduce manual triage and delay escalations", 420000, "pilot", "medium", "tier_2", "medium", "need carrier feed controls", "hold_until_feed_quality"],
  ["LH-AI-004", "Brightmark proposal drafting assistant", "proposal operations", "Microsoft 365 Copilot", "Proposal copilot", "sales and creative teams", 220, 76, "35% active weekly", "shorten proposal cycle time", 400000, "pilot", "medium", "tier_1", "medium", "need brand approval workflow", "hold"],
  ["LH-AI-005", "Forge & Field demand sensing pilot", "demand planning", "forecast model and feature store", "Demand sensing model", "planning team", 35, 12, "weekly planner review", "improve forecast accuracy", 650000, "pilot", "high", "tier_2", "medium", "need SKU-location quality baseline", "hold_until_data_quality"],
  ["LH-AI-006", "Great Lakes Pantry technician next-best-action", "field service", "rules plus service history model", "Technician assist", "field supervisors", 60, 20, "limited pilot", "increase first-time fix", 250000, "pilot", "medium", "tier_2", "medium", "parts data incomplete", "continue_small_pilot"],
  ["LH-AI-007", "Service desk ticket summarization", "ITSM", "ServiceNow AI", "Ticket summary assistant", "IT support agents", 120, 64, "53% active weekly", "reduce handle time and improve knowledge capture", 280000, "production", "low", "tier_1", "high", "expand with quality monitoring", "scale"],
  ["LH-AI-008", "Contract renewal risk summarizer", "legal operations", "LLM over CLM obligations", "Renewal risk assistant", "legal and procurement", 28, 8, "early pilot", "surface renewal obligations and risk", 70000, "pilot", "medium", "tier_2", "low", "legacy contracts not migrated", "hold"],
];

function makeProfileRows() {
  return [
    {
      ...shared("enterprise_profile", "LH-ENT-001", "Lakeshore Holdings enterprise profile", "holdco/entity-profile.csv", 1, "Group CIO"),
      company_name: CLIENT,
      industry: "Diversified private holding company",
      sub_industry: "portfolio-company operator with corporate shared services",
      revenue_usd: 0,
      employee_count: 11800,
      known_gaps: "direct holding-company revenue is not a valid claim; revenue is held at operating-company rollup level",
      business_model: "Holding company with four named operating companies plus an operating-company revenue allocation bucket. Corporate IT carries its own budget and supports shared services and enterprise platforms; each operating company carries its own local IT and operating budget.",
      strategic_priorities: `portfolio_company_revenue_rollup_usd:7120000000|named_operating_company_revenue_usd:3560000000|opco_revenue_to_allocate_usd:3560000000|direct_holdco_revenue_usd:0|total_employees:11800|direct_it_budget_usd:${directItBudget}|corporate_it_budget_usd:36500000|portfolio_company_local_it_budget_usd:154100000|innovation_it_subset_usd:${innovationBudget}|do_not_add_allocated_shared_service_rows_to_enterprise_total`,
    },
  ];
}

function makeFunctionRows() {
  return functions.map(([id, name, owner, model, kpis, processes], index) => ({
    ...shared("business_function", id, name, "holdco/business-functions.csv", index + 1, owner),
    function_id: id,
    function_name: name,
    executive_owner: owner,
    operating_model: model,
    primary_kpis: kpis,
    critical_processes: processes,
  }));
}

function makeOrgRows() {
  const rows = [
    ["LH-ORG-GROUP-CIO", "Group CIO Office", "Group CIO", "CEO and Board Technology Committee", "Enterprise technology strategy, shared platforms, cyber, data governance, and cross-portfolio investment sequencing.", "Oracle Fusion ERP|Workday|ServiceNow ITSM|Azure Data Lakehouse|Microsoft 365|Entra ID", "technology governance|portfolio technology review|enterprise architecture"],
    ["LH-ORG-CORP-PLAT", "Corporate Platforms", "VP Corporate Platforms", "Group CIO", "Owns enterprise ERP, HRIS, ITSM, identity, integration, collaboration, and shared platform operations.", "Oracle Fusion ERP|Workday|ServiceNow ITSM|MuleSoft Integration Hub|Microsoft 365|Entra ID", "platform operations|change control|shared services support"],
    ["LH-ORG-INNOV", "Corporate Innovation IT and Data AI", "VP Corporate Innovation IT and Data AI", "Group CIO", "Leads shared data products, AI opportunity discovery, model-risk intake, reusable automation patterns, and cross-opco analytics.", "Azure Data Lakehouse|Databricks Innovation Workspace|AI Governance Registry|Power BI", "AI intake|data product factory|portfolio analytics|model governance"],
    ["LH-ORG-CISO", "Information Security", "CISO", "Group CIO", "Owns cyber controls, identity risk, vulnerability remediation, and security architecture across corporate and opco systems.", "Entra ID|ServiceNow ITSM|Microsoft Purview", "access governance|incident response|risk reporting"],
    ["LH-ORG-NORTH-CIO", "Northline Local IT", "Northline CIO", "Northline CEO and Group CIO", "Owns local logistics systems, data feeds, service desk, and IT budget for Northline.", "Northline Warehouse WMS|Northline TMS|Northline Fleet Telematics", "warehouse technology|transportation technology|local service management"],
    ["LH-ORG-CREST-CIO", "Brightmark Local IT", "Brightmark CIO", "Brightmark CEO and Group CIO", "Owns local client-delivery systems, CRM, project margin systems, creative operations, and local IT budget.", "Brightmark Salesforce CRM|Brightmark Professional Services Automation|Brightmark Marketing Automation", "client technology|resource planning|creative workflow support"],
    ["LH-ORG-RIV-CIO", "Forge & Field Local IT", "Forge & Field CIO", "Forge & Field CEO and Group CIO", "Owns Forge & Field ERP, DTC commerce, demand planning, manufacturing planning, and local IT budget.", "Forge & Field SAP S/4|Forge & Field DTC Commerce|Forge & Field Demand Planning", "commercial technology|supply-chain technology|local service management"],
    ["LH-ORG-ARB-IT", "Great Lakes Pantry Local IT", "Great Lakes Pantry IT Director", "Great Lakes Pantry CEO and Group CIO", "Owns field-service, scheduling, billing, asset, and service quality systems plus local IT budget.", "Great Lakes Pantry Field Service|Great Lakes Pantry Workforce Scheduling|Great Lakes Pantry Billing Platform", "field service technology|billing technology|local service management"],
  ];
  return rows.map(([id, name, leader, reports, rights, ownedSystems, ownedProcesses], index) => ({
    ...shared("org_ownership", id, name, "holdco/org-ownership.csv", index + 1, leader),
    org_unit_id: id,
    org_unit_name: name,
    leader_role: leader,
    reports_to_role: reports,
    decision_rights: rights,
    owned_systems: ownedSystems,
    owned_processes: ownedProcesses,
  }));
}

function makePersonaRows() {
  const personas = [
    ["LH-PER-CORP-FIN", "Corporate finance analyst", "Corporate Finance and Treasury", 76, "medium", "close, cash, variance, and portfolio financial reporting"],
    ["LH-PER-HR", "Corporate HR operations specialist", "Corporate HR and Talent", 42, "medium", "employee lifecycle, HR case management, and policy support"],
    ["LH-PER-LEGAL", "Corporate legal operations manager", "Corporate Legal and Compliance", 18, "medium", "contract intake, matter tracking, obligation follow-up"],
    ["LH-PER-INVEST", "Portfolio operations associate", "Investments and Portfolio Management", 34, "high", "portfolio KPI updates, board materials, initiative review"],
    ["LH-PER-IT-SUPPORT", "IT service desk analyst", "Corporate IT", 58, "high", "ticket triage, knowledge search, access requests"],
    ["LH-PER-DATA", "Data product owner", "Corporate Innovation IT and Data AI", 16, "high", "data product roadmap, quality, reuse, AI readiness"],
    ["LH-PER-NORTH-DISP", "Northline dispatch supervisor", "Northline Logistics Operations", 120, "high", "route exceptions, carrier issues, warehouse coordination"],
    ["LH-PER-CREST-PM", "Brightmark project manager", "Brightmark Client Delivery", 210, "medium", "resource plans, project margin, delivery risk"],
    ["LH-PER-RIV-PLANNER", "Forge & Field demand planner", "Forge & Field Commercial and Supply Chain", 64, "high", "forecast exceptions, inventory risk, DTC demand"],
    ["LH-PER-ARB-DISPATCH", "Great Lakes Pantry field dispatcher", "Great Lakes Pantry Service Operations", 95, "high", "technician dispatch, parts availability, customer commitments"],
  ];
  return personas.map(([id, name, area, population, relevance, context], index) => ({
    ...shared("workforce_persona", id, name, "holdco/workforce-personas.csv", index + 1),
    persona_id: id,
    persona_name: name,
    business_area: area,
    population_count: population,
    ai_relevance: relevance,
    work_context: context,
  }));
}

function makeSystemRows() {
  return systems.map(([id, name, capability, owner, criticality, lifecycle, vendor, cost, integrations, dependencies, ai], index) => ({
    ...shared("application_system", id, name, "holdco/applications-systems.csv", index + 1, owner),
    system_id: id,
    system_name: name,
    business_capability: capability,
    system_owner: owner,
    criticality,
    lifecycle_status: lifecycle,
    vendor_id: vendor,
    annual_cost_usd: cost,
    integrations,
    data_dependencies: dependencies,
    ai_relevance: ai,
  }));
}

function makeDataAssetRows() {
  const assets = [
    ["LH-DATA-EMPLOYEE", "Enterprise workforce master", "Chief People Officer", "Workday HCM and Finance", "Workday to Azure Data Lakehouse to Power BI", "HR|Finance|Security|ITSM", 0.86, "governed"],
    ["LH-DATA-GL", "Corporate GL and cost-center actuals", "CFO", "Oracle Fusion ERP", "Oracle Fusion ERP to Azure Data Lakehouse", "Finance|Tower|Portfolio Management", 0.9, "governed"],
    ["LH-DATA-CASH", "Treasury cash position", "Treasurer", "Kyriba Treasury", "Kyriba to Oracle to Power BI", "Treasury|CFO|Board reporting", 0.82, "watch"],
    ["LH-DATA-CONTRACTS", "Contract obligations and renewals", "General Counsel", "Ironclad CLM", "Ironclad to ServiceNow renewal watch", "Legal|Procurement|Tower", 0.63, "data_thin"],
    ["LH-DATA-PORTFOLIO-KPI", "Portfolio company KPI hub", "Chief Investment Officer", "Azure Data Lakehouse", "opco source extracts to Lakehouse to board pack", "Investments|Tower|Intelligence", 0.74, "watch"],
    ["LH-DATA-AI-REG", "AI opportunity and risk registry", "VP Corporate Innovation IT and Data AI", "AI Governance Registry", "ServiceNow AI intake to Databricks and Power BI", "Group CIO|CISO|Innovation IT", 0.78, "governed"],
    ["LH-DATA-NORTH-OPS", "Northline warehouse and transportation facts", "Northline CIO", "Northline WMS and TMS", "WMS/TMS to Azure Data Lakehouse", "Northline Ops|Group CIO|Tower", 0.71, "watch"],
    ["LH-DATA-CREST-MARGIN", "Brightmark project margin facts", "Brightmark CIO", "Brightmark PSA", "PSA to Salesforce to Power BI", "Brightmark CFO|Tower", 0.69, "watch"],
    ["LH-DATA-RIV-DEMAND", "Forge & Field demand and commerce facts", "Forge & Field CIO", "Forge & Field Demand Planning and DTC Commerce", "Commerce and planning extracts to Azure Data Lakehouse", "Forge & Field Ops|Innovation IT|Tower", 0.66, "watch"],
    ["LH-DATA-ARB-SERVICE", "Great Lakes Pantry service execution facts", "Great Lakes Pantry IT Director", "Great Lakes Pantry Field Service", "FSM to Billing Platform to Power BI", "Great Lakes Pantry COO|Tower", 0.72, "watch"],
  ];
  const curated = assets.map(([id, name, owner, system, lineage, consumers, quality, governance], index) => ({
    ...shared("data_asset_integration", id, name, "holdco/data-assets-integrations.csv", index + 1, owner),
    data_asset_id: id,
    data_asset_name: name,
    data_owner: owner,
    system_of_record: system,
    lineage,
    consumers,
    quality_score: quality,
    governance_status: governance,
  }));
  const systemAssets = systems.map(([systemId, systemName, capability, owner, criticality, lifecycle, vendor, cost, integrations, dependencies, ai], index) => ({
    ...shared("data_asset_integration", `LH-DATA-${systemId.replace("LH-SYS-", "")}`, `${systemName} operational dataset`, "holdco/data-assets-integrations.csv", curated.length + index + 1, owner),
    data_asset_id: `LH-DATA-${systemId.replace("LH-SYS-", "")}`,
    data_asset_name: `${systemName} operational dataset`,
    data_owner: owner,
    system_of_record: systemName,
    lineage: `${systemName} to governed extract to Azure Data Lakehouse or local reporting mart`,
    consumers: `Tower|Home|Intelligence|${owner}`,
    quality_score: criticality === "high" ? 0.78 : 0.68,
    governance_status: lifecycle === "build" || lifecycle === "pilot" ? "watch" : "governed",
  }));
  return [...curated, ...systemAssets];
}

function makeVendorRows() {
  return vendors.map(([id, name, contract, service, cost, renewal, owner, linked, risk, pricing], index) => ({
    ...shared("vendor_contract", id, name, "holdco/vendors-contracts.csv", index + 1, owner),
    vendor_id: id,
    vendor_name: name,
    contract_id: contract,
    service,
    annual_cost_usd: cost,
    renewal_date: renewal,
    owning_function: owner,
    linked_systems: linked,
    contract_risk: risk,
    pricing_basis: pricing,
  }));
}

function spendRow(id, name, amount, type, owner, programId, vendorId, systemId, committed, date, linkage, unit, index) {
  return {
    ...shared("spend_value", id, name, "holdco/spend-value.csv", index, owner),
    spend_id: id,
    amount_usd: amount,
    amount_type: type,
    owner,
    program_id: programId,
    vendor_id: vendorId,
    system_id: systemId,
    committed_vs_discretionary: committed,
    renewal_or_gate_date: date,
    value_linkage: linkage,
    unit_economics: unit,
  };
}

function makeSpendRows() {
  const rows = [];
  let index = 1;
  for (const [entityId, name, total, run, change, note] of budgetByEntity) {
    rows.push(spendRow(`LH-SPEND-${entityId}-BUDGET`, `${name} FY26 annual IT budget`, total, "annual_it_budget", name, "not_applicable", "not_applicable", "not_applicable", "budget_control", "2026-12-31", note, "enterprise total includes this direct budget row", index++));
    rows.push(spendRow(`LH-SPEND-${entityId}-RUN`, `${name} FY26 run budget`, run, "run_budget", name, "not_applicable", "not_applicable", "not_applicable", "committed", "2026-12-31", "Run budget component of annual IT budget.", "component of annual_it_budget; do not add to total separately", index++));
    rows.push(spendRow(`LH-SPEND-${entityId}-CHANGE`, `${name} FY26 change budget`, change, "change_budget", name, "not_applicable", "not_applicable", "not_applicable", "discretionary", "2026-12-31", "Change budget component of annual IT budget.", "component of annual_it_budget; do not add to total separately", index++));
    rows.push(spendRow(`LH-SPEND-${entityId}-YTD`, `${name} FY26 spend to date`, Math.round(total * 0.42), "actual_spend_ytd", name, "not_applicable", "not_applicable", "not_applicable", "actual", "2026-06-18", "Mid-year actual spend proxy for synthetic demo.", "do not compare to committed value without period context", index++));
  }
  rows.push(spendRow("LH-SPEND-INNOV-COMPONENT", "Corporate Innovation IT and Data AI budget component", innovationBudget, "component_budget", "VP Corporate Innovation IT and Data AI", "LH-PGM-DATA-FOUND", "LH-VDR-DATABRICKS", "LH-SYS-DATABRICKS", "discretionary", "2026-12-31", "Subset of Corporate Shared Services IT budget for data, AI, innovation, and governance.", "not additive to enterprise total", index++));
  const allocations = [
    ["LH-NORTHLINE", "Northline allocated corporate shared-services IT consumption", 14200000],
    ["LH-CRESTPOINT", "Brightmark allocated corporate shared-services IT consumption", 9800000],
    ["LH-RIVERTON", "Forge & Field allocated corporate shared-services IT consumption", 7800000],
    ["LH-ARBORFIELD", "Great Lakes Pantry allocated corporate shared-services IT consumption", 4700000],
  ];
  for (const [entityId, name, amount] of allocations) {
    rows.push(spendRow(`LH-SPEND-${entityId}-ALLOC`, name, amount, "allocated_shared_services_cost", "Corporate IT chargeback office", "not_applicable", "not_applicable", "not_applicable", "allocated", "2026-12-31", "Allocation of corporate IT budget to portfolio company consumption.", "allocation view only; excluded from enterprise direct IT budget", index++));
  }
  for (const program of programs) {
    const [programId, name, businessOwner, techOwner, sponsor, phase, budget, spend, expected, realized] = program;
    rows.push(spendRow(`LH-SPEND-${programId}-BUDGET`, `${name} committed program budget`, budget, "program_committed_budget", techOwner, programId, "not_applicable", "not_applicable", "committed", "2026-12-31", `Committed budget for ${name}.`, "program-level commitment; can be summed for program portfolio", index++));
    rows.push(spendRow(`LH-SPEND-${programId}-YTD`, `${name} spend to date`, spend, "program_spend_to_date", techOwner, programId, "not_applicable", "not_applicable", "actual", "2026-06-18", `Spend-to-date for ${name}.`, "period-bound actual; do not annualize without forecast", index++));
    rows.push(spendRow(`LH-VALUE-${programId}-EXPECTED`, `${name} expected value`, expected, "expected_value", businessOwner, programId, "not_applicable", "not_applicable", "value_hypothesis", "2026-12-31", `Expected value hypothesis for ${name}.`, "value-at-stake; not spend", index++));
    rows.push(spendRow(`LH-VALUE-${programId}-REALIZED`, `${name} measured value`, realized, "measured_value", businessOwner, programId, "not_applicable", "not_applicable", "measured", "2026-06-18", `Measured value evidence for ${name}.`, "measured value; not spend", index++));
  }
  return rows;
}

function makeProgramRows() {
  return programs.map(([id, name, businessOwner, techOwner, sponsor, phase, budget, spend, expected, realized, basis, status, target, deps, risks, decision], index) => ({
    ...shared("program_initiative", id, name, "holdco/programs-initiatives.csv", index + 1, techOwner),
    program_id: id,
    business_owner: businessOwner,
    technology_owner: techOwner,
    executive_sponsor: sponsor,
    phase,
    budget_usd: budget,
    spend_to_date_usd: spend,
    expected_value_usd: expected,
    realized_value_usd: realized,
    value_basis: basis,
    status,
    target_date: target,
    dependencies: deps,
    risks,
    decision_needed: decision,
  }));
}

function makeAiRows() {
  return aiInitiatives.map(([id, useCase, process, tool, agent, userGroup, licensed, active, adoption, valueHypothesis, measured, prod, risk, tier, readiness, decision, scale], index) => ({
    ...shared("ai_initiative", id, useCase, "holdco/ai-initiatives.csv", index + 1, userGroup),
    ai_initiative_id: id,
    use_case: useCase,
    business_process: process,
    tool_or_model: tool,
    agent_or_copilot_name: agent,
    user_group: userGroup,
    licensed_users: licensed,
    active_users: active,
    adoption_metric: adoption,
    value_hypothesis: valueHypothesis,
    measured_value_usd: measured,
    production_status: prod,
    risk_status: risk,
    model_risk_tier: tier,
    data_readiness: readiness,
    decision_needed: decision,
    scale_hold_stop: scale,
  }));
}

function makeRiskRows() {
  const risks = [
    ["close and consolidation", "CFO", "medium", "watch", "monthly close control checklist", "Oracle Fusion ERP|Workday", "manual reconciliation still slows close"],
    ["bank connectivity", "Treasurer", "high", "watch", "bank interface control evidence", "Kyriba Treasury|Oracle Fusion ERP", "two opco bank feeds are not certified"],
    ["contract renewal visibility", "General Counsel", "medium", "watch", "renewal obligation migration control", "Ironclad CLM", "legacy contract migration incomplete"],
    ["portfolio KPI freshness", "Chief Investment Officer", "medium", "watch", "quarterly portfolio KPI attestation", "Azure Data Lakehouse|DealCloud Portfolio CRM", "opco KPI refresh cadence varies"],
    ["AI model-risk intake", "VP Corporate Innovation IT and Data AI", "medium", "controlled", "AI use-case registry approval", "AI Governance Registry|Databricks Innovation Workspace", "model-risk evidence required before scale"],
    ["Northline carrier feed quality", "Northline CIO", "high", "watch", "carrier feed data-quality checks", "Northline TMS|Northline Fleet Telematics", "carrier feed quality blocks AI dispatch scale"],
    ["Brightmark brand-risk approval", "Brightmark CIO", "medium", "watch", "content approval workflow", "Brightmark Marketing Automation|Microsoft 365 and Copilot", "proposal AI needs approval evidence"],
    ["Forge & Field SKU-location quality", "Forge & Field CIO", "high", "watch", "SKU-location quality threshold", "Forge & Field SAP S/4|Forge & Field Demand Planning", "demand sensing cannot scale without quality baseline"],
    ["Great Lakes Pantry parts availability data", "Great Lakes Pantry IT Director", "medium", "watch", "parts master-data quality control", "Great Lakes Pantry Field Service", "technician recommendations limited by parts data"],
    ["enterprise access cleanup", "CISO", "high", "watch", "privileged access review", "Entra ID|ServiceNow ITSM", "zero-trust benefit is risk reduction, not measured ROI"],
  ];
  return risks.map(([process, owner, severity, status, control, systemsAffected, impact], index) => ({
    ...shared("operations_risk_control", `LH-RISK-${String(index + 1).padStart(3, "0")}`, process, "holdco/operations-risk-controls.csv", index + 1, owner),
    process,
    process_owner: owner,
    severity,
    status,
    control,
    affected_systems: systemsAffected,
    business_impact: impact,
  }));
}

function relationship(fromFamily, fromId, type, toFamily, toId, name, index, confidence = "high") {
  return {
    ...shared("relationship", `LH-EDGE-${String(index).padStart(4, "0")}`, name, "holdco/context-relationships.csv", index),
    relationship_id: `LH-EDGE-${String(index).padStart(4, "0")}`,
    from_object_family: fromFamily,
    from_record_id: fromId,
    relationship_type: type,
    to_object_family: toFamily,
    to_record_id: toId,
    evidence_basis: `LH-EVID-${String(Math.max(1, Math.min(index, 24))).padStart(3, "0")}`,
    relationship_confidence: confidence,
  };
}

function makeRelationshipRows() {
  const rows = [];
  let index = 1;
  for (const [functionId, functionName] of functions) {
    const matchedSystems = systems.filter(([, , capability, owner]) =>
      capability.includes(functionName.split(" ")[0]) || owner.includes(functionName.split(" ")[0]) || functionName.includes(owner.split(" ")[0]),
    );
    for (const [systemId, systemName] of matchedSystems.slice(0, 2)) {
      rows.push(relationship("business_function", functionId, "supported_by", "application_system", systemId, `${functionName} is supported by ${systemName}`, index++));
    }
  }
  for (const [vendorId, vendorName, , , , , , linked] of vendors) {
    for (const systemId of linked.split("|")) {
      rows.push(relationship("vendor_contract", vendorId, "supplies", "application_system", systemId, `${vendorName} supplies ${systemId}`, index++));
    }
  }
  const systemAssetIds = new Map(systems.map(([systemId]) => [systemId, `LH-DATA-${systemId.replace("LH-SYS-", "")}`]));
  for (const [systemId, systemName, capability, owner] of systems) {
    rows.push(relationship("application_system", systemId, "produces", "data_asset_integration", systemAssetIds.get(systemId), `${systemName} produces operational data for ${capability}`, index++));
  }
  for (const [dataAssetId, dataAssetName, dataOwner, systemOfRecord] of [
    ["LH-DATA-EMPLOYEE", "Enterprise workforce master", "Chief People Officer", "Workday HCM and Finance"],
    ["LH-DATA-GL", "Corporate GL and cost-center actuals", "CFO", "Oracle Fusion ERP"],
    ["LH-DATA-CASH", "Treasury cash position", "Treasurer", "Kyriba Treasury"],
    ["LH-DATA-CONTRACTS", "Contract obligations and renewals", "General Counsel", "Ironclad CLM"],
    ["LH-DATA-PORTFOLIO-KPI", "Portfolio company KPI hub", "Chief Investment Officer", "Azure Data Lakehouse"],
    ["LH-DATA-AI-REG", "AI opportunity and risk registry", "VP Corporate Innovation IT and Data AI", "AI Governance Registry"],
    ["LH-DATA-NORTH-OPS", "Northline warehouse and transportation facts", "Northline CIO", "Northline Warehouse WMS"],
    ["LH-DATA-CREST-MARGIN", "Brightmark project margin facts", "Brightmark CIO", "Brightmark Professional Services Automation"],
    ["LH-DATA-RIV-DEMAND", "Forge & Field demand and commerce facts", "Forge & Field CIO", "Forge & Field Demand Planning"],
    ["LH-DATA-ARB-SERVICE", "Great Lakes Pantry service execution facts", "Great Lakes Pantry IT Director", "Great Lakes Pantry Field Service"],
  ]) {
    const system = systems.find(([, name]) => name === systemOfRecord);
    if (system) {
      rows.push(relationship("application_system", system[0], "is_system_of_record_for", "data_asset_integration", dataAssetId, `${systemOfRecord} is the system of record for ${dataAssetName}`, index++));
    }
  }
  for (const [programId, programName, , techOwner, , , , , , , , , , deps] of programs) {
    const relatedSystems = systems.filter(([, systemName]) => deps.includes(systemName) || deps.includes(systemName.split(" ")[0])).slice(0, 3);
    for (const [systemId, systemName] of relatedSystems) {
      rows.push(relationship("program_initiative", programId, "depends_on", "application_system", systemId, `${programName} depends on ${systemName}`, index++));
    }
    const ownerFunction = functions.find(([, , owner]) => owner === techOwner);
    if (ownerFunction) {
      rows.push(relationship("program_initiative", programId, "owned_by", "business_function", ownerFunction[0], `${programName} owned by ${ownerFunction[1]}`, index++));
    }
  }
  for (const [entityId, entityName] of opcos.map((entity) => [entity.entity_id, entity.entity_name])) {
    rows.push(relationship("enterprise_profile", "LH-ENT-001", "has_portfolio_company", "business_function", `${entityId}-IT-SCOPE`, `${CLIENT} includes ${entityName}`, index++, "medium"));
  }
  for (const row of makeSpendRows().filter((spend) => spend.program_id !== "not_applicable").slice(0, 80)) {
    rows.push(relationship("spend_value", row.spend_id, row.amount_type.includes("value") ? "measures_value_for" : "funds", "program_initiative", row.program_id, `${row.record_name} links to ${row.program_id}`, index++));
  }
  for (const ai of aiInitiatives) {
    const [aiId, useCase, process] = ai;
    const relatedProgram = programs.find(([, name]) => name.toLowerCase().includes(process.split(" ")[0])) ?? programs.find(([, name]) => name.includes("AI") || name.includes("data"));
    if (relatedProgram) {
      rows.push(relationship("ai_initiative", aiId, "supports", "program_initiative", relatedProgram[0], `${useCase} supports ${relatedProgram[1]}`, index++));
    }
  }
  return rows;
}

function makeEvidenceRows() {
  const evidence = [
    ["LH-EVID-001", "Holdco entity hierarchy and assumptions", "synthetic_template", "holdco/entity-hierarchy.csv", "AbarVa Synthetic Data Steward", "high"],
    ["LH-EVID-002", "Corporate shared services systems inventory", "synthetic_template", "holdco/applications-systems.csv", "Group CIO", "high"],
    ["LH-EVID-003", "Portfolio company IT budget model", "synthetic_template", "holdco/spend-value.csv", "Group CIO", "high"],
    ["LH-EVID-004", "Corporate Innovation IT operating model", "synthetic_template", "holdco/business-functions.csv", "VP Corporate Innovation IT and Data AI", "high"],
    ["LH-EVID-005", "Portfolio company local IT ownership map", "synthetic_template", "holdco/org-ownership.csv", "Group CIO", "high"],
    ["LH-EVID-006", "Program value and risk register", "synthetic_template", "holdco/programs-initiatives.csv", "Portfolio Management Office", "high"],
    ["LH-EVID-007", "AI initiative and adoption register", "synthetic_template", "holdco/ai-initiatives.csv", "VP Corporate Innovation IT and Data AI", "high"],
    ["LH-EVID-008", "Vendor and renewal exposure register", "synthetic_template", "holdco/vendors-contracts.csv", "Corporate Procurement", "high"],
    ["LH-EVID-009", "Operational risk and controls register", "synthetic_template", "holdco/operations-risk-controls.csv", "CISO", "high"],
    ["LH-EVID-010", "Dashboard metric formula map", "synthetic_template", "holdco/dashboard-metric-map.csv", "AbarVa Synthetic Data Steward", "high"],
  ];
  return evidence.map(([id, title, type, location, owner, confidence], index) => ({
    ...shared("evidence_source", id, title, "holdco/evidence-sources.csv", index + 1, owner),
    evidence_id: id,
    evidence_title: title,
    evidence_type: type,
    source_location: location,
    evidence_owner: owner,
    evidence_confidence: confidence,
  }));
}

function makeMetricRows() {
  const metrics = [
    ["LH-MET-TOTAL-IT-BUDGET", "FY26 direct IT budget", "Sum annual_it_budget rows for Corporate Shared Services IT and portfolio-company local IT. Excludes allocated shared-service rows and innovation component rows.", "sum(V6_08.amount_usd where amount_type=annual_it_budget)", "USD", "Group CIO", "board_ready"],
    ["LH-MET-RUN-BUDGET", "FY26 run budget", "Sum run_budget component rows. Component of direct IT budget.", "sum(V6_08.amount_usd where amount_type=run_budget)", "USD", "Group CIO", "operating_metric"],
    ["LH-MET-CHANGE-BUDGET", "FY26 change budget", "Sum change_budget component rows. Component of direct IT budget.", "sum(V6_08.amount_usd where amount_type=change_budget)", "USD", "Group CIO", "operating_metric"],
    ["LH-MET-SPEND-YTD", "FY26 spend to date", "Sum actual_spend_ytd rows through as_of_date.", "sum(V6_08.amount_usd where amount_type=actual_spend_ytd)", "USD", "Group CIO", "period_actual"],
    ["LH-MET-PROGRAM-BUDGET", "Program committed budget", "Sum program_committed_budget rows.", "sum(V6_08.amount_usd where amount_type=program_committed_budget)", "USD", "Portfolio Management Office", "portfolio_metric"],
    ["LH-MET-EXPECTED-VALUE", "Expected value", "Sum expected_value rows. This is value-at-stake, not spend.", "sum(V6_08.amount_usd where amount_type=expected_value)", "USD", "Portfolio Management Office", "value_hypothesis"],
    ["LH-MET-MEASURED-VALUE", "Measured value", "Sum measured_value rows. This is realized/attested value, not spend.", "sum(V6_08.amount_usd where amount_type=measured_value)", "USD", "Portfolio Management Office", "measured_value"],
    ["LH-MET-VALUE-GAP", "Value proof gap", "Expected value minus measured value.", "LH-MET-EXPECTED-VALUE - LH-MET-MEASURED-VALUE", "USD", "Portfolio Management Office", "derived"],
    ["LH-MET-AI-BUDGET", "AI and innovation component", "Corporate Innovation IT budget component plus AI initiative program budgets where applicable. Treat component rows as subset, not additive to enterprise direct IT total.", "component_budget plus AI-tagged program budgets with de-duplication", "USD", "VP Corporate Innovation IT and Data AI", "operating_metric"],
    ["LH-MET-VENDOR-EXPOSURE", "Vendor exposure", "Annual cost by vendor contract.", "sum(V6_07.annual_cost_usd by vendor_id)", "USD", "Corporate Procurement", "portfolio_metric"],
    ["LH-MET-RENEWAL-90", "Renewals within 90 days", "Count vendor contracts with renewal_date within 90 days of as_of_date.", "count(V6_07 where renewal_date between as_of_date and as_of_date+90)", "count", "Corporate Procurement", "risk_metric"],
    ["LH-MET-ALLOCATED-SHARED", "Allocated shared-services IT consumption", "Sum allocated_shared_services_cost rows. This is a management allocation view and excluded from direct IT budget.", "sum(V6_08.amount_usd where amount_type=allocated_shared_services_cost)", "USD", "Corporate IT chargeback office", "allocation_view"],
  ];
  return metrics.map(([id, name, definition, basis, unit, owner, claim], index) => ({
    ...shared("metric_definition", id, name, "holdco/metric-definitions.csv", index + 1, owner),
    metric_id: id,
    metric_name: name,
    metric_definition: definition,
    calculation_basis: basis,
    unit_of_measure: unit,
    metric_owner: owner,
    metric_claim_level: claim,
  }));
}

function makePatternRows() {
  const patterns = [
    ["LH-PAT-HOLDCO-IT-01", "Holding-company IT rollup", "private-equity-and-holding-company", "Use when a corporate center has shared-service IT plus local opco IT budgets.", "multiple portfolio companies|shared service allocation|local CIOs", "Separate direct budget from allocation; report opco and corporate scopes side by side.", "holding-company operating model"],
    ["LH-PAT-SS-01", "Shared-services platform modernization", "corporate-functions", "Use when HR, legal, finance, treasury, and investments share corporate platforms.", "shared ERP|shared HRIS|treasury platform|CLM", "Measure close-cycle, cash visibility, contract migration, and service SLA before claiming value.", "corporate shared services"],
    ["LH-PAT-AI-01", "Central innovation IT with local operating data", "data-and-ai", "Use when a central AI group depends on opco data products.", "central data platform|opco source feeds|model risk registry", "Gate scale on data product ownership and model-risk evidence.", "data and AI operating model"],
    ["LH-PAT-OPCO-01", "Portfolio-company local IT autonomy", "operating-company-it", "Use when each portfolio company has local systems and CIO ownership.", "local CIO|local applications|corporate shared platform consumption", "Keep local budget and shared-service allocation separate to avoid double-counting.", "portfolio company technology"],
  ];
  return patterns.map(([id, name, domain, apply, signals, actions, label], index) => ({
    ...shared("industry_corpus_pattern", id, name, "holdco/industry-corpus-patterns.csv", index + 1),
    pattern_id: id,
    pattern_name: name,
    industry_domain: domain,
    when_to_apply: apply,
    signals,
    recommended_actions: actions,
    corpus_context_label: label,
  }));
}

function makeExpertRows() {
  const lenses = [
    ["LH-EXP-HOLDCO-CIO", "Holding Company CIO Operating Model Expert", "holdco IT rollup, corporate/shared service IT, local opco IT", "questions about enterprise total, shared services allocation, local CIO ownership, or opco IT budgets", "What is direct vs allocated? Which CIO owns the system? Which spend is local vs corporate?", "Do not double-count allocated shared services as enterprise spend."],
    ["LH-EXP-CORP-SERVICES", "Corporate Shared Services Technology Expert", "HR, legal, finance, treasury, investments platforms", "questions about Corporate Shared Services systems, shared business processes, or support model", "Which corporate function owns the process? Which system is authoritative? What field is missing?", "Do not imply the corporate center runs opco local systems."],
    ["LH-EXP-DATA-AI", "Corporate Innovation IT and Data AI Expert", "cross-portfolio data products and AI governance", "questions about AI investment, data products, innovation, model risk, or reusable automation", "Is this an experiment, governed data product, or scale candidate? What data quality gate exists?", "Do not claim AI ROI where measured value is not loaded."],
    ["LH-EXP-OPCO", "Portfolio Company Technology Expert", "local IT systems, local CIO responsibilities, opco operating data", "questions about Northline, Brightmark, Forge & Field, or Great Lakes Pantry systems and budgets", "Which opco owns it? What local system or process does it support? Does it consume corporate shared services?", "Do not merge opco facts without showing entity scope."],
  ];
  return lenses.map(([id, name, focus, activation, questions, forbidden], index) => ({
    ...shared("expert_lens", id, name, "holdco/expert-lenses.csv", index + 1),
    expert_lens_id: id,
    expert_lens_name: name,
    domain_focus: focus,
    activation_conditions: activation,
    lens_questions: questions,
    lens_forbidden_claims: forbidden,
  }));
}

function ensureHoldcoDir() {
  fs.mkdirSync(holdcoDir, { recursive: true });
}

function writeSupplementalCsv(fileName, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  fs.writeFileSync(path.join(holdcoDir, fileName), `${lines.join("\n")}\n`);
}

function writeSupplementalFiles() {
  ensureHoldcoDir();
  writeSupplementalCsv(
    "H01_entity_hierarchy.csv",
    ["tenant_key", "client_display_name", "entity_id", "entity_name", "entity_type", "parent_entity_id", "industry", "revenue_usd", "employees", "it_budget_usd", "cio_role", "budget_additivity_rule", "notes"],
    entities.map((entity) => ({
      tenant_key: TENANT_KEY,
      client_display_name: CLIENT,
      ...entity,
      budget_additivity_rule:
        entity.entity_type === "corporate_innovation_it"
          ? "subset_of_corporate_it_budget_not_additive"
          : entity.entity_type === "portfolio_company_revenue_bucket"
            ? "revenue_bucket_requires_opco_allocation_not_direct_holdco"
          : entity.entity_type === "portfolio_company" || entity.entity_type === "corporate_shared_services"
            ? "direct_it_budget_additive_to_enterprise_total"
            : "rollup_entity_do_not_add_as_source_row",
    })),
  );

  const metricRows = [
    {
      metric_key: "portfolio_company_revenue_rollup_fy26",
      metric_label: "FY26 portfolio-company revenue rollup",
      value_usd: 7120000000,
      formula: "named operating-company revenue plus operating-company allocation bucket",
      included_amount_types: "portfolio_company_revenue|opco_revenue_allocation",
      excluded_amount_types: "holding_company_revenue",
      source_files: "H01_entity_hierarchy.csv|V6_01_enterprise_profile.csv",
    },
    {
      metric_key: "named_portfolio_company_revenue_fy26",
      metric_label: "FY26 named portfolio-company revenue",
      value_usd: 3560000000,
      formula: "Northline plus Brightmark plus Forge & Field plus Great Lakes Pantry revenue",
      included_amount_types: "portfolio_company_revenue",
      excluded_amount_types: "holding_company_revenue|opco_revenue_allocation",
      source_files: "H01_entity_hierarchy.csv",
    },
    {
      metric_key: "opco_revenue_to_allocate_fy26",
      metric_label: "FY26 operating-company revenue to allocate",
      value_usd: 3560000000,
      formula: "remaining portfolio-company revenue requiring opco naming or split before board-grade reporting",
      included_amount_types: "opco_revenue_allocation",
      excluded_amount_types: "holding_company_revenue",
      source_files: "H01_entity_hierarchy.csv|V6_01_enterprise_profile.csv",
    },
    {
      metric_key: "total_direct_it_budget_fy26",
      metric_label: "FY26 direct IT budget",
      value_usd: directItBudget,
      formula: "sum direct annual_it_budget rows for Corporate Shared Services IT and four portfolio-company local IT budgets",
      included_amount_types: "annual_it_budget",
      excluded_amount_types: "run_budget|change_budget|component_budget|allocated_shared_services_cost|expected_value|measured_value",
      source_files: "V6_08_spend_value.csv|H01_entity_hierarchy.csv",
    },
    {
      metric_key: "corporate_it_budget_fy26",
      metric_label: "Corporate Shared Services IT budget",
      value_usd: 36500000,
      formula: "Corporate Shared Services annual_it_budget row",
      included_amount_types: "annual_it_budget",
      excluded_amount_types: "component_budget|allocated_shared_services_cost",
      source_files: "V6_08_spend_value.csv|H01_entity_hierarchy.csv",
    },
    {
      metric_key: "innovation_it_component_fy26",
      metric_label: "Corporate Innovation IT and Data AI component",
      value_usd: innovationBudget,
      formula: "component_budget row inside Corporate Shared Services IT budget",
      included_amount_types: "component_budget",
      excluded_amount_types: "annual_it_budget_total_addition",
      source_files: "V6_08_spend_value.csv|H01_entity_hierarchy.csv",
    },
    {
      metric_key: "portfolio_company_local_it_budget_fy26",
      metric_label: "Portfolio-company local IT budget",
      value_usd: opcos.reduce((sum, entity) => sum + entity.it_budget_usd, 0),
      formula: "sum annual_it_budget rows for Northline, Brightmark, Forge & Field, and Great Lakes Pantry",
      included_amount_types: "annual_it_budget",
      excluded_amount_types: "allocated_shared_services_cost",
      source_files: "V6_08_spend_value.csv|H01_entity_hierarchy.csv",
    },
    {
      metric_key: "allocated_shared_service_consumption_fy26",
      metric_label: "Allocated shared-services IT consumption",
      value_usd: 36500000,
      formula: "sum allocated_shared_services_cost rows by portfolio company",
      included_amount_types: "allocated_shared_services_cost",
      excluded_amount_types: "enterprise_total_direct_it_budget",
      source_files: "V6_08_spend_value.csv",
    },
  ];
  writeSupplementalCsv(
    "H02_dashboard_metric_map.csv",
    ["tenant_key", "client_display_name", "metric_key", "metric_label", "value_usd", "formula", "included_amount_types", "excluded_amount_types", "source_files"],
    metricRows.map((row) => ({ tenant_key: TENANT_KEY, client_display_name: CLIENT, ...row })),
  );

  fs.writeFileSync(
    path.join(holdcoDir, "README.md"),
    `# Lakeshore Holdings V6 Holdco Tower Supplemental Pack

This supplemental pack makes the Lakeshore holding-company model explicit while the shared V6 templates keep their stable headers.

## Scope model

- Lakeshore Holdings is the enterprise rollup.
- Corporate Shared Services includes HR, legal, finance, treasury, investments, governance, and corporate business operations.
- Corporate IT runs the systems that support Corporate Shared Services.
- Corporate Innovation IT and Data AI is a subset of Corporate IT budget and leads cross-portfolio data and AI ideas.
- Northline, Brightmark, Forge & Field, and Great Lakes Pantry each have local IT leadership, systems, processes, vendors, budgets, and programs.

## Budget rule

Direct enterprise IT budget is the sum of Corporate Shared Services IT plus portfolio-company local IT annual budget rows. Shared-services allocations and innovation component rows are management views and must not be added again.

## Generated totals

- Direct FY26 IT budget: $${directItBudget.toLocaleString("en-US")}
- Corporate Shared Services IT budget: $36,500,000
- Innovation IT and Data AI component: $${innovationBudget.toLocaleString("en-US")} (subset of Corporate IT)
- Portfolio-company local IT budget: $${opcos.reduce((sum, entity) => sum + entity.it_budget_usd, 0).toLocaleString("en-US")}
- Allocated shared-services consumption view: $36,500,000 (not additive)
`,
  );
}

function updateTenantDocs() {
  const readmePath = path.join(tenantDir, "README.md");
  fs.writeFileSync(
    readmePath,
    `# Lakeshore Holdings V6 Synthetic Intelligence Pack

This package contains the Lakeshore Holdings synthetic V6 enterprise intelligence templates.

## Model

Lakeshore Holdings is modeled as a private holding company with corporate shared services, Corporate IT, a Corporate Innovation IT and Data AI group, and four portfolio companies with their own local IT leadership and systems.

## Key rules

- Corporate Shared Services includes HR, legal, finance, treasury, investments, governance, and corporate business operations.
- Corporate IT runs the systems that support Corporate Shared Services.
- Corporate Innovation IT and Data AI is a subset of Corporate IT budget, not an additive enterprise budget line.
- Each portfolio company has local IT, local systems, local vendors, local programs, and local spend.
- Allocated shared-services consumption rows are management allocation views and must not be added to the direct enterprise IT budget.

## Validation

Run:

\`\`\`bash
node scripts/lakeshore/generate-lakeshore-v6-holdco-pack.mjs
node scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs
\`\`\`

The validator writes \`out/lakeshore-v6-holdco-validation.json\`.
`,
  );

  const dictionaryPath = path.join(tenantDir, "V6_BUSINESS_METADATA_DICTIONARY.csv");
  if (fs.existsSync(dictionaryPath)) {
    const dictionary = fs
      .readFileSync(dictionaryPath, "utf8")
      .replaceAll("lakeshore-industries", TENANT_KEY)
      .replaceAll("Lakeshore Industries", CLIENT);
    fs.writeFileSync(dictionaryPath, dictionary);
  }
}

function updateManifest() {
  const manifestPath = path.join(tenantDir, "V6_GENERATED_MANIFEST.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.tenantKey = TENANT_KEY;
  manifest.clientDisplayName = CLIENT;
  manifest.sourceDataset = "datasets/lakeshore-holdings-synthetic-v4";
  manifest.canonicalTenantKey = TENANT_KEY;
  manifest.holdcoRealignment = {
    generatedAt: UPDATED,
    canonicalTenantKey: TENANT_KEY,
    displayName: CLIENT,
    model: "holding_company_with_corporate_shared_services_and_portfolio_company_local_it",
    portfolioCompanyRevenueRollupUsd: 7120000000,
    namedOperatingCompanyRevenueUsd: 3560000000,
    opcoRevenueToAllocateUsd: 3560000000,
    directHoldcoRevenueUsd: 0,
    employeeRollup: 11800,
    directItBudgetUsd: directItBudget,
    corporateSharedServicesItBudgetUsd: 36500000,
    innovationItDataAiComponentUsd: innovationBudget,
    portfolioCompanyCount: opcos.length,
    portfolioCompanyNames: opcos.map((entity) => entity.entity_name),
    nonAdditiveAmountTypes: ["component_budget", "allocated_shared_services_cost", "expected_value", "measured_value"],
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function main() {
  writeCsv("V6_01_enterprise_profile.csv", makeProfileRows());
  writeCsv("V6_02_business_functions.csv", makeFunctionRows());
  writeCsv("V6_03_org_ownership.csv", makeOrgRows());
  writeCsv("V6_04_workforce_personas.csv", makePersonaRows());
  writeCsv("V6_05_applications_systems.csv", makeSystemRows());
  writeCsv("V6_06_data_assets_integrations.csv", makeDataAssetRows());
  writeCsv("V6_07_vendors_contracts.csv", makeVendorRows());
  writeCsv("V6_08_spend_value.csv", makeSpendRows());
  writeCsv("V6_09_programs_initiatives.csv", makeProgramRows());
  writeCsv("V6_10_ai_initiatives.csv", makeAiRows());
  writeCsv("V6_11_operations_risk_controls.csv", makeRiskRows());
  writeCsv("V6_12_relationships.csv", makeRelationshipRows());
  writeCsv("V6_13_evidence_sources.csv", makeEvidenceRows());
  writeCsv("V6_14_metric_definitions.csv", makeMetricRows());
  writeCsv("V6_15_industry_corpus_patterns.csv", makePatternRows());
  writeCsv("V6_16_expert_lenses.csv", makeExpertRows());
  writeSupplementalFiles();
  updateTenantDocs();
  updateManifest();

  console.log(
    JSON.stringify(
      {
        tenantKey: TENANT_KEY,
        clientDisplayName: CLIENT,
        directItBudget,
        portfolioCompanies: opcos.map((entity) => ({
          entityId: entity.entity_id,
          name: entity.entity_name,
          revenueUsd: entity.revenue_usd,
          employees: entity.employees,
          itBudgetUsd: entity.it_budget_usd,
          cioRole: entity.cio_role,
        })),
        corporateSharedServicesItBudgetUsd: 36500000,
        innovationItDataAiComponentUsd: innovationBudget,
      },
      null,
      2,
    ),
  );
}

main();

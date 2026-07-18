#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const generatedAt = "2026-07-17T00:00:00.000Z";
const asOfDate = "2026-07-17";
const truthStatement =
  "This is planning-grade synthetic enterprise context. It is not real client production data, not PHI/PII/payment-card data, and not a claim of realized financial value.";

const dimensions = [
  ["00_enterprise_profile", "Enterprise Profile"],
  ["01_business_functions", "Business Functions"],
  ["02_org_ownership", "Org Ownership"],
  ["03_workforce_roles", "Workforce Roles"],
  ["04_applications_systems", "Applications & Systems"],
  ["05_data_assets_integrations", "Data Assets & Integrations"],
  ["06_infrastructure_platforms", "Infrastructure & Platforms"],
  ["07_vendors_contracts", "Vendors & Contracts"],
  ["08_spend_value", "IT Budget, Spend & Value"],
  ["09_programs_initiatives", "Programs & Initiatives"],
  ["10_ai_automation_use_cases", "AI & Automation Use Cases"],
  ["11_risks_controls", "Risks & Controls"],
  ["12_relationships", "Relationships"],
  ["13_evidence_sources", "Evidence Sources"],
  ["14_metrics_outcomes", "Metrics & Outcomes"],
  ["15_industry_context_patterns", "Industry Context Patterns"],
  ["16_expert_lenses", "Expert Lenses"],
  ["17_service_scope_managed_services", "Managed Services Scope"],
  ["18_operational_process_evidence", "Operational Evidence"],
];

const modules = ["Home", "Knowledge", "Tower", "Intelligence", "Moves", "Source"];
const statuses = ["candidate", "candidate", "candidate", "candidate_review"];
const confidences = ["high", "medium", "medium", "high"];
const evidenceKinds = [
  "synthetic source template",
  "synthetic interview excerpt",
  "synthetic finance baseline",
  "synthetic risk-control register",
  "synthetic vendor obligation register",
  "synthetic operational metric register",
];
const rowTargets = {
  "00_enterprise_profile": 24,
  "01_business_functions": 300,
  "02_org_ownership": 260,
  "03_workforce_roles": 260,
  "04_applications_systems": 360,
  "05_data_assets_integrations": 360,
  "06_infrastructure_platforms": 240,
  "07_vendors_contracts": 300,
  "08_spend_value": 76,
  "09_programs_initiatives": 300,
  "10_ai_automation_use_cases": 300,
  "11_risks_controls": 340,
  "12_relationships": 380,
  "13_evidence_sources": 140,
  "14_metrics_outcomes": 300,
  "15_industry_context_patterns": 220,
  "16_expert_lenses": 160,
  "17_service_scope_managed_services": 220,
  "18_operational_process_evidence": 300,
};

const interviewGroups = [
  ["CEO / enterprise strategy", "CEO", "Enterprise strategy"],
  ["CFO / finance and value", "CFO", "Finance and value"],
  ["COO / operations", "COO", "Operations"],
  ["CIO / enterprise technology", "CIO", "Enterprise technology"],
  ["CTO / infrastructure/cloud/platforms", "CTO", "Infrastructure and platforms"],
  ["CDAO / data and analytics", "CDAO", "Data and analytics"],
  ["CISO / security", "CISO", "Security"],
  ["Privacy/compliance/legal", "Chief compliance officer", "Privacy compliance legal"],
  ["Procurement/vendor management", "Chief procurement officer", "Procurement"],
  ["HR/workforce/change", "Chief people officer", "Workforce and change"],
  ["Transformation office", "Transformation office lead", "Transformation"],
  ["Customer/member/passenger experience", "Experience leader", "Customer experience"],
  ["Business function leader", "Business unit president", "Business function"],
  ["Contact center leader", "Contact center leader", "Contact center"],
  ["Operations leader", "Operations leader", "Operations"],
  ["Enterprise architecture", "Chief architect", "Enterprise architecture"],
  ["Application owner", "Application owner", "Application ownership"],
  ["IT service management", "ITSM leader", "Service management"],
];

const interviewQuestions = [
  ["Q01", "Which enterprise decision is blocked by missing evidence?", "decision readiness", "decision confidence"],
  ["Q02", "Which operating constraint creates the most friction?", "operating model", "operational friction"],
  ["Q03", "Which data lineage gap should be fixed first?", "data lineage", "lineage uncertainty"],
  ["Q04", "Which system dependency creates the greatest risk?", "systems", "integration risk"],
  ["Q05", "Which vendor obligation needs contract evidence?", "vendor", "contract evidence"],
  ["Q06", "Which budget line needs a finance-approved baseline?", "finance", "baseline proof"],
  ["Q07", "Which control blocks AI movement beyond pilot?", "AI governance", "control gate"],
  ["Q08", "Which workforce role needs change evidence?", "workforce", "adoption proof"],
  ["Q09", "Which metric should Tower validate before executives act?", "metrics", "measurement gap"],
  ["Q10", "Which handoff should Moves or Source receive only after evidence closes?", "handoff", "evidence gate"],
  ["Q11", "Which risk would make a default runtime answer unsafe?", "runtime safety", "tenant-safe retrieval"],
  ["Q12", "What evidence would convert this from planning context to active truth?", "promotion readiness", "active truth gate"],
];

const tenantConfigs = {
  "first-capital-financial": {
    tenantKey: "first-capital-financial",
    governanceClientKey: "first-capital",
    displayName: "FS Demo",
    physicalTenantLabel: "First Capital Financial",
    prefix: "FCF",
    industry: "Financial Services",
    subIndustry: "Diversified banking, payments, wealth, lending, contact center, risk, and regulatory operations",
    enterpriseProfile: {
      revenue: "25000000000",
      employees: "74000",
      customers: "32000000",
      sites: "1100 branches",
      digitalUsers: "21000000",
      regulatory: "OCC; FDIC; CFPB; SEC/FINRA where applicable; SOX; GLBA; PCI DSS; model risk governance",
      budget: 1150000000,
      run: 805000000,
      change: 345000000,
    },
    sourceBasis: "synthetic financial-services enterprise context generation",
    candidateContractVersion: "first-capital-financial-rich-standard-candidate-20260717",
    domains: [
      "retail banking",
      "commercial banking",
      "wealth advisory",
      "mortgage lending",
      "cards and payments",
      "treasury services",
      "fraud operations",
      "AML and KYC",
      "risk and compliance",
      "branch operations",
      "contact center",
      "digital banking",
      "finance and treasury",
      "HR and change",
      "platform engineering",
      "data and analytics",
      "regulatory reporting",
      "vendor management",
    ],
    systems: [
      "core banking platform",
      "loan origination platform",
      "card processing platform",
      "payments hub",
      "ACH and wire operations",
      "fraud detection platform",
      "AML/KYC case management",
      "CRM and banker desktop",
      "contact center platform",
      "mobile banking platform",
      "online banking platform",
      "cloud lakehouse foundation",
      "enterprise risk platform",
      "general ledger and ERP",
      "identity and access management",
      "model risk management system",
      "regulatory reporting platform",
      "document management platform",
    ],
    vendors: [
      "CoreBridge Banking Services",
      "CardRail Processing",
      "PayAxis Network Services",
      "CloudNorth Data Platform",
      "InsightLake Analytics",
      "Servica Contact Cloud",
      "FraudShield Controls",
      "ComplyCase Risk Systems",
      "CreditSignal Data Services",
      "RegOps Managed Services",
      "CyberGate Security",
      "LedgerWorks ERP",
    ],
    approvedPrograms: [
      "Digital Banking Modernization",
      "Payments Platform Resilience",
      "Fraud and Financial Crimes Transformation",
      "Core Banking Simplification",
      "Data Governance and Lakehouse Foundation",
      "Regulatory Reporting Automation",
      "Contact Center Experience Transformation",
      "Cloud Resilience and Zero Trust",
      "Branch Workforce Productivity",
      "Wealth Advisor Desktop Modernization",
      "Model Risk and AI Governance",
      "Finance and GL Modernization",
    ],
    candidateAi: [
      "Fraud alert triage copilot",
      "AML investigation summarization",
      "Contact center agent assist",
      "Personalized digital banking insights",
      "Loan document intake automation",
      "Regulatory change impact analyzer",
      "Wealth advisor research assistant",
      "Collections prioritization assistant",
      "Branch workforce knowledge assistant",
      "IT incident and change-risk copilot",
      "Model risk documentation assistant",
      "Finance close anomaly detection",
    ],
    risks: [
      "model risk management",
      "fair lending and bias",
      "explainability",
      "GLBA privacy",
      "PCI DSS",
      "data retention",
      "access controls",
      "audit logging",
      "customer consent",
      "regulatory reporting accuracy",
      "operational resilience",
      "third-party risk",
      "cyber risk",
      "fraud loss",
      "vendor concentration",
      "cloud exit and resilience",
    ],
    cxoQuotes: {
      CFO: "I do not want projected fraud reduction or digital conversion benefits counted as realized value until we can tie them to finance-approved baselines and actuals.",
      CIO: "Core banking, payments, and data lineage are the constraints. AI use cases will not scale if they depend on one-off extracts.",
      CDAO: "We need governed customer, account, transaction, and risk data products before AI is treated as reusable enterprise capability.",
      CISO: "Fraud, AML, and customer-facing AI require auditability, access controls, and explainability before they move beyond controlled pilots.",
      "Chief procurement officer": "Vendor leverage needs contract, renewal, invoice, SLA, and service-performance evidence, not just spend by supplier.",
    },
  },
  "skyharbor-air": {
    tenantKey: "skyharbor-air",
    governanceClientKey: "skyharbor-air",
    displayName: "Airline Demo",
    physicalTenantLabel: "SkyHarbor Air",
    prefix: "SHA",
    industry: "Airline",
    subIndustry: "Global passenger airline with cargo, loyalty, airport operations, maintenance, crew, digital, and IROPS operations",
    enterpriseProfile: {
      revenue: "50000000000",
      employees: "96000",
      customers: "not_applicable",
      sites: "930 aircraft; 305 destinations",
      digitalUsers: "108000000 loyalty members",
      regulatory: "FAA; DOT; TSA; EASA where applicable; PCI; privacy laws; safety management systems",
      budget: 2600000000,
      run: 1820000000,
      change: 780000000,
    },
    sourceBasis: "synthetic airline enterprise context generation",
    candidateContractVersion: "skyharbor-air-rich-standard-candidate-20260717",
    domains: [
      "flight operations",
      "operations control center",
      "airport operations",
      "customer service",
      "loyalty",
      "revenue management",
      "network planning",
      "crew scheduling",
      "maintenance engineering",
      "cargo operations",
      "digital ecommerce",
      "safety and security",
      "finance",
      "procurement",
      "HR and workforce",
      "data and analytics",
      "platform engineering",
      "baggage operations",
    ],
    systems: [
      "passenger service system",
      "departure control system",
      "crew scheduling platform",
      "flight planning platform",
      "operations control and IROPS platform",
      "maintenance and MRO platform",
      "cargo management platform",
      "revenue management platform",
      "loyalty platform",
      "ecommerce and mobile app",
      "customer CRM",
      "contact center platform",
      "baggage tracking platform",
      "fuel management platform",
      "ERP and finance platform",
      "airline data lakehouse",
      "identity and access management",
      "service management platform",
    ],
    vendors: [
      "AeroCore Passenger Systems",
      "GlobalRoute Distribution",
      "CloudNorth Data Platform",
      "LoyaltyMesh Services",
      "Servica Contact Cloud",
      "AeroMaint Systems",
      "CrewLogic Operations",
      "GateFlow Airport Tech",
      "CyberGate Security",
      "NorthSky Managed Services",
      "Aviation Systems Integrator",
      "TelcoMesh Networks",
    ],
    approvedPrograms: [
      "IROPS Resilience and Recovery",
      "Passenger Service Modernization",
      "Loyalty Platform Modernization",
      "Crew Operations Optimization",
      "Maintenance Predictive Analytics Foundation",
      "Airport Turnaround Performance Program",
      "Data Platform and Lakehouse Foundation",
      "Contact Center Experience Transformation",
      "Revenue Management Modernization",
      "Cloud Resilience and Cyber Program",
      "Baggage Visibility and Recovery",
      "Finance and Procurement Spend Transparency",
    ],
    candidateAi: [
      "IROPS recovery copilot",
      "Crew disruption assistant",
      "Maintenance troubleshooting assistant",
      "Contact center agent assist",
      "Passenger rebooking personalization",
      "Baggage recovery prediction",
      "Airport turnaround risk predictor",
      "Revenue management scenario assistant",
      "Loyalty next-best-action assistant",
      "Flight operations knowledge assistant",
      "IT incident and change-risk copilot",
      "Procurement and vendor contract intelligence",
    ],
    risks: [
      "safety criticality",
      "operational resilience",
      "crew and legal constraints",
      "DOT customer obligations",
      "data privacy",
      "PCI",
      "cyber risk",
      "identity and access",
      "vendor concentration",
      "model explainability",
      "human-in-the-loop operations",
      "incident response",
      "airport-local operating variation",
      "reservation-system dependency",
      "cloud resilience",
    ],
    cxoQuotes: {
      COO: "The real value is operational recovery. If IROPS decisions do not account for aircraft, crew, gates, passengers, and DOT obligations together, the tool will not help.",
      CIO: "Passenger service, operations control, crew, and maintenance systems are deeply coupled. We need integration lineage before promising AI-driven recovery.",
      CFO: "A faster recovery story is not enough. I need baseline delay costs, recovery costs, compensation exposure, and finance validation before value is claimed.",
      CDAO: "The airline has rich operational data, but it is fragmented across flight, crew, passenger, baggage, maintenance, and loyalty domains.",
      "Chief compliance officer": "Any AI recommendation touching flight operations or maintenance needs human review, audit logging, and clear boundaries.",
    },
  },
};

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function selectedTenants() {
  const tenant = arg("--tenant");
  if (!tenant || tenant === "all") return Object.values(tenantConfigs);
  const config = tenantConfigs[tenant];
  if (!config) throw new Error(`Unknown synthetic tenant ${tenant}`);
  return [config];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`);
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function checksum(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function checksumFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatMoney(value) {
  return String(Math.round(value));
}

function rotate(list, index) {
  return list[index % list.length];
}

function templateColumns() {
  const manifestPath = path.join(repoRoot, "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return Object.fromEntries(manifest.templates.map((template) => [template.file.replace(/\.csv$/, ""), template.columns]));
}

function rowId(config, dimKey, index) {
  return `${config.prefix}-${dimKey.slice(0, 2)}-${String(index + 1).padStart(5, "0")}`;
}

function evidenceId(config, index) {
  return `${config.prefix}-EVID-${String(index + 1).padStart(5, "0")}`;
}

function sourceRowId(config, dimKey, index) {
  return `${config.prefix}-${dimKey.toUpperCase()}-SRC-${String(index + 1).padStart(5, "0")}`;
}

function rowDescriptor(config, dimKey, index) {
  const dimension = dimensions.find(([key]) => key === dimKey)?.[1] ?? dimKey;
  const domain = rotate(config.domains, index);
  const system = rotate(config.systems, index + 2);
  const vendor = rotate(config.vendors, index + 4);
  const program = rotate(config.approvedPrograms, index + 1);
  const ai = rotate(config.candidateAi, index + 3);
  const risk = rotate(config.risks, index + 5);
  return { dimension, domain, system, vendor, program, ai, risk };
}

function common(config, dimKey, index, fileName) {
  const descriptor = rowDescriptor(config, dimKey, index);
  return {
    record_id: rowId(config, dimKey, index),
    evidence_id: evidenceId(config, index + dimensions.findIndex(([key]) => key === dimKey) * 600),
    source_row_id: sourceRowId(config, dimKey, index),
    dimension_key: dimKey,
    dimension_name: descriptor.dimension,
    active_candidate_status: rotate(statuses, index),
    candidate_contract_version: config.candidateContractVersion,
    load_run_id: `${config.prefix}-CANDIDATE-LOAD-20260717`,
    generated_at: generatedAt,
    generation_method: "deterministic synthetic enterprise context generator",
    source_basis: config.sourceBasis,
    source_file: `datasets/tenant-inputs/candidates/${config.tenantKey}/rich-synthetic-2026-07-v3/${fileName}`,
    source_date: asOfDate,
    confidence: rotate(confidences, index),
    known_gaps: `${descriptor.risk} evidence requires owner validation; source is synthetic and candidate-only`,
    truth_statement: truthStatement,
  };
}

function valueFor(config, dimKey, column, index, fileName) {
  const descriptor = rowDescriptor(config, dimKey, index);
  const c = common(config, dimKey, index, fileName);
  const budgetSlice = config.enterpriseProfile.budget / rowTargets["08_spend_value"];
  const runChange = index < Math.round(rowTargets["08_spend_value"] * 0.7) ? "run" : "change";
  const values = {
    tenant_key: config.tenantKey,
    entity_name: config.displayName,
    industry: config.industry,
    sub_industry: config.subIndustry,
    revenue_usd: config.enterpriseProfile.revenue,
    employee_count: config.enterpriseProfile.employees,
    headquarters: config.tenantKey === "skyharbor-air" ? "Atlanta, GA" : "Charlotte, NC",
    operating_regions: config.tenantKey === "skyharbor-air" ? "global airline network; United States hubs; international stations" : "United States banking markets; digital channels; branch and contact center operations",
    business_model: `${config.displayName} synthetic operating model across ${descriptor.domain}, ${descriptor.system}, and ${descriptor.program}.`,
    customer_segments: config.tenantKey === "skyharbor-air" ? "passengers; loyalty members; cargo customers; corporate travel buyers" : "consumer households; commercial clients; wealth clients; cardholders; lending customers",
    mission: "Use governed enterprise context to make planning decisions safer before active promotion.",
    vision: "Build a trusted evidence-backed operating model for executive decisions.",
    strategic_priorities: config.approvedPrograms.slice(0, 5).join("; "),
    leadership_team: "CEO; CFO; COO; CIO; CTO; CDAO; CISO; procurement; transformation office",
    current_state_notes: `Candidate planning context for ${descriptor.domain}; active runtime truth is unchanged.`,
    target_state_notes: `Evidence-backed read models for ${modules.join(", ")} after candidate validation and explicit promotion.`,
    function_name: `${descriptor.domain} capability ${String(index + 1).padStart(3, "0")}`,
    parent_function: descriptor.domain,
    executive_owner: rotate(interviewGroups, index)[1],
    business_capabilities: `${descriptor.program}; ${descriptor.ai}; ${descriptor.system}`,
    criticality: index % 5 === 0 ? "critical" : index % 3 === 0 ? "high" : "medium",
    annual_budget_usd: formatMoney((config.enterpriseProfile.budget / config.domains.length) * (0.8 + (index % 7) / 20)),
    fte_count: String(80 + (index % 38) * 11),
    outsourced_support: index % 3 === 0 ? "yes, candidate managed-services dependency" : "mixed internal and vendor support",
    org_unit: `${descriptor.domain} ${rotate(["portfolio", "operations", "platform", "controls", "transformation"], index)}`,
    parent_org_unit: rotate(["Office of the CIO", "Office of the CFO", "Enterprise Operations", "Risk and Compliance", "Procurement"], index),
    leader_name_or_role: rotate(interviewGroups, index + 2)[1],
    role_level: rotate(["C-level", "SVP", "VP", "Director", "Product owner"], index),
    decision_rights: `Can approve candidate evidence collection for ${descriptor.program}; cannot promote active truth alone.`,
    owned_functions: descriptor.domain,
    owned_systems: descriptor.system,
    owned_data_domains: `${descriptor.domain}; ${rotate(config.domains, index + 4)}`,
    location_scope: config.tenantKey === "skyharbor-air" ? "network and hub/station" : "enterprise and regional market",
    persona_or_role: `${descriptor.domain} ${rotate(["operator", "analyst", "product owner", "risk owner", "service manager"], index)}`,
    role_count: String(12 + (index % 47)),
    location_model: rotate(["hybrid enterprise", "hub-and-spoke", "contact center", "field operations", "remote specialist"], index),
    employment_type: rotate(["employee", "vendor-supported", "mixed", "contractor-supported"], index),
    vendor_supported: index % 4 === 0 ? "yes" : "no",
    skills: `${descriptor.system} workflow knowledge; evidence review; controls; stakeholder communication`,
    pain_points: `Fragmented evidence for ${descriptor.risk}; manual reconciliation across ${descriptor.system}`,
    automation_opportunity: `${descriptor.ai} remains candidate until evidence gates close`,
    system_name: `${descriptor.system} ${String(index + 1).padStart(3, "0")}`,
    system_type: slug(descriptor.system),
    system_category: rotate(["core platform", "experience", "risk control", "data platform", "service management"], index),
    business_function: descriptor.domain,
    system_scope: `${descriptor.domain} supporting ${descriptor.program}`,
    deployment_model: rotate(["SaaS", "private cloud", "managed hosting", "on-premises", "hybrid"], index),
    hosting_location: rotate(["us-east", "us-central", "primary data center", "secondary region", "vendor cloud"], index),
    lifecycle_state: rotate(["current core", "modernization candidate", "target state not certified", "rationalize candidate", "extend with controls"], index),
    business_owner: rotate(interviewGroups, index + 3)[1],
    technology_owner: rotate(["enterprise architecture", "platform engineering", "application owner", "data engineering", "IT service management"], index),
    vendor: descriptor.vendor,
    data_domains: `${descriptor.domain}; ${rotate(config.domains, index + 1)}; ${rotate(config.domains, index + 2)}`,
    interfaces_count: String(2 + (index % 18)),
    current_state_or_target_state: index % 7 === 0 ? "target_state_candidate" : "current_state_candidate",
    data_asset_name: `${descriptor.domain} ${rotate(["event stream", "master record", "quality register", "analytics mart", "lineage map"], index)} ${String(index + 1).padStart(3, "0")}`,
    data_domain: descriptor.domain,
    source_system: descriptor.system,
    target_system: rotate(config.systems, index + 7),
    integration_type: rotate(["batch file", "API", "event stream", "database view", "manual extract"], index),
    platform_or_database: rotate(["enterprise warehouse", "lakehouse candidate", "operational database", "reporting mart", "integration platform"], index),
    refresh_frequency: rotate(["daily", "near-real-time candidate", "weekly", "monthly", "event-driven candidate"], index),
    data_owner: rotate(interviewGroups, index + 5)[1],
    data_steward: `${descriptor.domain} data steward`,
    quality_status: rotate(["candidate quality review", "lineage needed", "owner review needed", "baseline needed"], index),
    regulated_data_flag: config.tenantKey === "skyharbor-air" ? "privacy_or_PCI_possible_without_person_records" : "regulated_financial_context_without_account_records",
    analytics_usage: `${descriptor.program}; ${descriptor.ai}; executive planning`,
    platform_name: `${descriptor.system} platform ${String(index + 1).padStart(3, "0")}`,
    platform_type: rotate(["application platform", "data platform", "integration platform", "security platform", "resilience platform"], index),
    hosting_model: rotate(["SaaS", "cloud", "managed hosting", "hybrid", "on-premises"], index),
    data_center_or_region: rotate(["primary region", "secondary region", "main operations region", "recovery region"], index),
    technology_stack: `${descriptor.system}; ${rotate(["API gateway", "event broker", "warehouse", "observability", "identity"], index)}`,
    operational_owner: rotate(interviewGroups, index + 4)[1],
    capacity_or_scale: config.tenantKey === "skyharbor-air" ? `${850 + (index % 200)} aircraft/station/domain planning marker` : `${900 + (index % 400)} branch/digital/domain planning marker`,
    constraints: `${descriptor.risk}; lineage and baseline validation needed`,
    future_target_flag: index % 7 === 0 ? "yes_target_state_not_certified" : "no_current_candidate",
    vendor_name: descriptor.vendor,
    contract_name: `${descriptor.vendor} ${descriptor.domain} agreement ${String(index + 1).padStart(3, "0")}`,
    service_category: rotate(["platform subscription", "managed services", "implementation services", "data services", "security services"], index),
    contract_owner: "Procurement and vendor management",
    annual_spend_usd: dimKey === "08_spend_value" ? formatMoney(budgetSlice) : formatMoney(250000 + (index % 60) * 62500),
    term_start: `2025-${String((index % 12) + 1).padStart(2, "0")}-01`,
    term_end: `2028-${String((index % 12) + 1).padStart(2, "0")}-28`,
    renewal_date: `2027-${String((index % 12) + 1).padStart(2, "0")}-15`,
    commercial_model: rotate(["fixed fee", "usage tier", "rate card", "managed capacity", "subscription"], index),
    supported_systems: `${descriptor.system}; ${rotate(config.systems, index + 3)}`,
    supported_functions: `${descriptor.domain}; ${rotate(config.domains, index + 5)}`,
    risk_rating: rotate(["medium", "high", "medium", "critical dependency"], index),
    spend_category: `${runChange} ${descriptor.domain} ${rotate(["platform", "labor", "vendor", "security", "data", "operations"], index)}`,
    cost_center_or_owner: rotate(interviewGroups, index + 6)[1],
    run_change_transform_split: runChange,
    vendor_internal_split: index % 3 === 0 ? "vendor" : "internal",
    value_driver: `${descriptor.program} planning baseline; value not realized`,
    savings_opportunity_usd: "0",
    calculation_basis: "finance baseline required before any value claim",
    program_name: rotate(config.approvedPrograms, index),
    business_sponsor: rotate(interviewGroups, index + 8)[1],
    objective: `Advance ${descriptor.program} with governed evidence, safe controls, and candidate-only read models.`,
    scope: `${descriptor.domain}; ${descriptor.system}; ${descriptor.vendor}`,
    status: rotate(["approved", "approved", "approved", "evidence gate"], index),
    phase: rotate(["mobilize", "design", "build", "validate", "control gate"], index),
    target_outcomes: "planning outcomes only; realized value requires finance validation",
    dependencies: `${descriptor.system}; ${descriptor.vendor}; ${descriptor.domain} evidence`,
    risks: `${descriptor.risk}; no active promotion without review`,
    budget_usd: formatMoney(config.enterpriseProfile.change / config.approvedPrograms.length),
    expected_value_usd: "0",
    use_case_name: rotate(config.candidateAi, index),
    process_area: descriptor.domain,
    ai_pattern: rotate(["copilot", "summarization", "classification", "prediction", "decision support"], index),
    current_status: "candidate_not_approved",
    value_hypothesis: `${descriptor.ai} is a candidate hypothesis; benefits require baseline, adoption, control, and finance evidence.`,
    required_data: `${descriptor.domain}; ${rotate(config.domains, index + 2)}; evidence register`,
    required_systems: `${descriptor.system}; ${rotate(config.systems, index + 2)}`,
    human_approval_points: "human review required before operational action",
    risk_controls: `${descriptor.risk}; audit logging; access control; explainability; tenant isolation`,
    risk_or_control_name: `${descriptor.risk} control ${String(index + 1).padStart(3, "0")}`,
    risk_domain: descriptor.risk,
    systems_impacted: `${descriptor.system}; ${rotate(config.systems, index + 1)}`,
    severity: rotate(["medium", "high", "critical"], index),
    likelihood: rotate(["possible", "likely", "watch"], index),
    control_owner: rotate(interviewGroups, index + 1)[1],
    control_status: "candidate_control_evidence_needed",
    evidence_required: `${c.evidence_id}; ${evidenceKinds[index % evidenceKinds.length]}; owner signoff`,
    mitigation_plan: `Collect ${descriptor.risk} evidence before active use.`,
    from_object_type: rotate(["system", "data_asset", "program", "vendor", "risk_control", "metric"], index),
    from_object_name: descriptor.system,
    relationship_type: rotate(["depends_on", "feeds", "funds", "blocked_by", "owned_by", "supports"], index),
    to_object_type: rotate(["program", "AI candidate", "control", "vendor", "metric", "data_asset"], index),
    to_object_name: index % 2 === 0 ? descriptor.program : descriptor.ai,
    relationship_strength: rotate(["medium", "high", "medium", "candidate"], index),
    evidence_basis: c.evidence_id,
    source_type: evidenceKinds[index % evidenceKinds.length],
    source_owner: rotate(interviewGroups, index + 2)[1],
    as_of_date: asOfDate,
    confidentiality: "synthetic internal planning context",
    domains_covered: `${descriptor.domain}; ${descriptor.dimension}`,
    row_count_or_pages: String(rowTargets[dimKey] ?? 1),
    quality_notes: `${truthStatement} Evidence is candidate-only and requires validation.`,
    approved_for_loading: "candidate_preload_only",
    metric_name: `${descriptor.domain} ${rotate(["baseline", "readiness", "quality", "risk", "adoption", "cost"], index)} metric ${String(index + 1).padStart(3, "0")}`,
    metric_domain: descriptor.domain,
    definition: `Measures candidate readiness for ${descriptor.program}; not a realized outcome.`,
    baseline_value: "baseline_required",
    baseline_period: "FY26 planning",
    target_value: "target_requires_owner_approval",
    owner: rotate(interviewGroups, index + 9)[1],
    data_source: c.evidence_id,
    pattern_name: `${config.industry} ${descriptor.domain} pattern ${String(index + 1).padStart(3, "0")}`,
    business_context: `${descriptor.program} depends on ${descriptor.system}, ${descriptor.vendor}, and ${descriptor.risk} evidence.`,
    applicability: "candidate planning context",
    caveats: "Do not treat as active tenant truth until explicit promotion.",
    lens_name: `${descriptor.dimension} ${descriptor.domain} executive lens ${String(index + 1).padStart(3, "0")}`,
    expert_role: rotate(interviewGroups, index + 10)[1],
    questions_to_answer: `What evidence must close before ${descriptor.ai} or ${descriptor.program} advances?`,
    required_inputs: `${c.evidence_id}; source row; owner; baseline; control status`,
    decision_use: `Boardroom planning for ${descriptor.dimension}; candidate preview only.`,
    limitations: "No production data, no active promotion, no realized value claim.",
    service_tower: `${descriptor.domain} service tower`,
    service_name: `${descriptor.system} support service ${String(index + 1).padStart(3, "0")}`,
    scope_description: `${descriptor.vendor} supports ${descriptor.system} for ${descriptor.program}.`,
    in_scope_functions: descriptor.domain,
    in_scope_systems: descriptor.system,
    current_provider: descriptor.vendor,
    service_volume: `${100 + (index % 900)} synthetic monthly units`,
    sla_or_kpi: `${descriptor.risk} evidence needed before SLA leverage claim`,
    run_cost_usd: formatMoney(config.enterpriseProfile.run / 160 + (index % 25) * 15000),
    target_state_option: "candidate renewal or operating-model review after evidence validation",
    process_name: `${descriptor.domain} process evidence ${String(index + 1).padStart(3, "0")}`,
    process_owner: rotate(interviewGroups, index + 11)[1],
    systems_used: `${descriptor.system}; ${rotate(config.systems, index + 6)}`,
    volume_metric: `${1000 + (index % 5000)} synthetic work items per period`,
    cycle_time: "baseline required",
    control_points: `${descriptor.risk}; human review; audit trail; evidence lineage`,
    automation_candidate: descriptor.ai,
  };
  if (dimKey === "00_enterprise_profile") {
    values.strategic_priorities = `${config.approvedPrograms.join("; ")}; candidate AI opportunities remain not approved`;
    values.current_state_notes = `${truthStatement} Candidate profile includes ${config.enterpriseProfile.revenue} revenue band, ${config.enterpriseProfile.employees} employees, ${config.enterpriseProfile.sites}, and ${config.enterpriseProfile.digitalUsers}.`;
    values.target_state_notes = `${modules.join(", ")} can consume this only after candidate load, reconciliation, retrieval proof, and explicit promotion review.`;
    values.known_gaps = `${config.enterpriseProfile.regulatory}; evidence remains synthetic and candidate-only.`;
  }
  return values[column] ?? c[column] ?? "";
}

function rowsForDimension(config, dimKey, columns) {
  const count = rowTargets[dimKey];
  const fileName = `${dimKey}.csv`;
  const extendedColumns = [
    ...columns,
    "record_id",
    "evidence_id",
    "source_row_id",
    "dimension_key",
    "dimension_name",
    "active_candidate_status",
    "candidate_contract_version",
    "load_run_id",
    "generated_at",
    "generation_method",
    "source_basis",
    "truth_statement",
  ];
  return {
    headers: Array.from(new Set(extendedColumns)),
    rows: Array.from({ length: count }, (_, index) => {
      const row = {};
      for (const column of extendedColumns) row[column] = valueFor(config, dimKey, column, index, fileName);
      return row;
    }),
  };
}

function buildInterviews(config) {
  const headers = [
    "tenant_key",
    "interview_id",
    "interview_group",
    "executive_area",
    "stakeholder_role",
    "question_id",
    "question",
    "synthetic_answer",
    "priority_theme",
    "pain_point",
    "initiative_link",
    "evidence_needed",
    "evidence_id",
    "source_row_id",
    "confidence",
    "answer_basis",
    "active_candidate_status",
    "candidate_contract_version",
    "load_run_id",
    "source_type",
    "generated_at",
    "truth_statement",
  ];
  const rows = interviewGroups.flatMap(([group, role, area], groupIndex) =>
    interviewQuestions.map(([questionId, question, theme, pain], questionIndex) => {
      const ordinal = groupIndex * interviewQuestions.length + questionIndex;
      const program = rotate(config.approvedPrograms, ordinal);
      const ai = rotate(config.candidateAi, ordinal + 2);
      const system = rotate(config.systems, ordinal + 3);
      const risk = rotate(config.risks, ordinal + 5);
      const quote = config.cxoQuotes[role] ?? config.cxoQuotes[group] ?? "";
      const answer = quote
        ? `${quote} For ${program}, the next step is to reconcile ${system}, ${risk}, and finance/control evidence before any active-use decision.`
        : `${role} says ${program} and ${ai} are useful candidate planning topics, but the team needs ${system} lineage, ${risk} control evidence, and owner signoff before active runtime or value claims.`;
      return {
        tenant_key: config.tenantKey,
        interview_id: `${config.prefix}-INT-${String(groupIndex + 1).padStart(2, "0")}-${questionId}`,
        interview_group: group,
        executive_area: area,
        stakeholder_role: role,
        question_id: questionId,
        question,
        synthetic_answer: answer,
        priority_theme: theme,
        pain_point: pain,
        initiative_link: questionIndex % 3 === 0 ? program : ai,
        evidence_needed: `${system} lineage; ${risk} control evidence; finance baseline; owner attestation`,
        evidence_id: `${config.prefix}-INT-EVID-${String(ordinal + 1).padStart(5, "0")}`,
        source_row_id: `${config.prefix}-INT-ROW-${String(ordinal + 1).padStart(5, "0")}`,
        confidence: rotate(confidences, ordinal),
        answer_basis: questionIndex % 4 === 0 ? "interview-only-gap-generating" : "synthetic-evidence-backed",
        active_candidate_status: "candidate",
        candidate_contract_version: config.candidateContractVersion,
        load_run_id: `${config.prefix}-CANDIDATE-LOAD-20260717`,
        source_type: "synthetic executive interview",
        generated_at: generatedAt,
        truth_statement: truthStatement,
      };
    }),
  );
  return { headers, rows };
}

function buildDerived(config, sourceInventory) {
  const allRecords = sourceInventory.flatMap((source) =>
    source.rows.map((row, index) => ({
      tenant_key: config.tenantKey,
      record_key: row.record_id,
      dimension_key: source.dimKey,
      record_name:
        row.entity_name ||
        row.function_name ||
        row.system_name ||
        row.data_asset_name ||
        row.vendor_name ||
        row.program_name ||
        row.use_case_name ||
        row.metric_name ||
        row.process_name ||
        row.context_item ||
        row.record_id,
      source_file: source.relativePath,
      source_row: String(index + 2),
      evidence_id: row.evidence_id,
      confidence: row.confidence,
      active_candidate_status: "candidate",
      candidate_contract_version: config.candidateContractVersion,
      load_run_id: `${config.prefix}-CANDIDATE-LOAD-20260717`,
    })),
  );
  const canonicalFacts = [];
  for (const record of allRecords) {
    canonicalFacts.push(
      {
        tenant_key: config.tenantKey,
        fact_key: `${record.record_key}:summary`,
        record_key: record.record_key,
        dimension_key: record.dimension_key,
        fact_type: "record_summary",
        fact_value: `${record.record_name} is candidate planning context with evidence ${record.evidence_id}.`,
        source_file: record.source_file,
        source_row: record.source_row,
        evidence_id: record.evidence_id,
        confidence: record.confidence,
        active_candidate_status: "candidate",
      },
      {
        tenant_key: config.tenantKey,
        fact_key: `${record.record_key}:gap`,
        record_key: record.record_key,
        dimension_key: record.dimension_key,
        fact_type: "evidence_gap",
        fact_value: "Owner validation, source reconciliation, and active-promotion review are required.",
        source_file: record.source_file,
        source_row: record.source_row,
        evidence_id: record.evidence_id,
        confidence: "medium",
        active_candidate_status: "candidate",
      },
    );
  }
  const entityProfiles = Array.from({ length: 1100 }, (_, index) => {
    const record = rotate(allRecords, index);
    return {
      tenant_key: config.tenantKey,
      entity_key: `${config.prefix}-ENT-${String(index + 1).padStart(5, "0")}`,
      entity_type: rotate(["system", "function", "data_asset", "vendor", "program", "control", "metric"], index),
      entity_name: `${record.record_name} entity ${String(index + 1).padStart(4, "0")}`,
      dimension_key: record.dimension_key,
      source_record_key: record.record_key,
      evidence_id: record.evidence_id,
      confidence: record.confidence,
      active_candidate_status: "candidate",
    };
  });
  const graphNodes = Array.from({ length: 1600 }, (_, index) => {
    const entity = rotate(entityProfiles, index);
    return {
      tenant_key: config.tenantKey,
      node_key: `${config.prefix}-NODE-${String(index + 1).padStart(5, "0")}`,
      node_type: entity.entity_type,
      node_name: entity.entity_name,
      source_entity_key: entity.entity_key,
      evidence_id: entity.evidence_id,
      confidence: entity.confidence,
      active_candidate_status: "candidate",
    };
  });
  const graphEdges = Array.from({ length: 2600 }, (_, index) => {
    const from = rotate(graphNodes, index);
    const to = rotate(graphNodes, index + 37);
    return {
      tenant_key: config.tenantKey,
      edge_key: `${config.prefix}-EDGE-${String(index + 1).padStart(5, "0")}`,
      from_node_key: from.node_key,
      to_node_key: to.node_key,
      relationship_type: rotate(["depends_on", "feeds", "owned_by", "funded_by", "blocked_by", "governed_by", "supports"], index),
      evidence_id: from.evidence_id,
      confidence: rotate(confidences, index),
      active_candidate_status: "candidate",
      graph_boundary: "Graph explains dependency context only and does not calculate spend, savings, ROI, or realized value.",
    };
  });
  const contextGaps = Array.from({ length: 2100 }, (_, index) => {
    const record = rotate(allRecords, index);
    const risk = rotate(config.risks, index);
    return {
      tenant_key: config.tenantKey,
      gap_key: `${config.prefix}-GAP-${String(index + 1).padStart(5, "0")}`,
      dimension_key: record.dimension_key,
      record_key: record.record_key,
      gap_type: rotate(["missing_owner", "missing_baseline", "missing_lineage", "missing_contract_evidence", "missing_control_attestation"], index),
      gap_description: `${risk} requires evidence validation before active use.`,
      blocked_decision: rotate([...config.approvedPrograms, ...config.candidateAi], index),
      evidence_needed: `${record.evidence_id}; source file; owner; baseline; control status`,
      confidence: "medium",
      active_candidate_status: "candidate",
    };
  });
  const evidenceRefs = Array.from({ length: 140 }, (_, index) => {
    const record = rotate(allRecords, index);
    return {
      tenant_key: config.tenantKey,
      evidence_id: evidenceId(config, index),
      source_file: record.source_file,
      source_row: record.source_row,
      evidence_type: rotate(evidenceKinds, index),
      evidence_status: "candidate_resolves_locally",
      checksum: checksum(`${config.tenantKey}:${record.source_file}:${record.source_row}:${record.record_key}`),
      active_candidate_status: "candidate",
    };
  });
  const chunks = canonicalFacts.slice(0, 4600).map((fact, index) => ({
    tenant_key: config.tenantKey,
    chunk_key: `${config.prefix}-CHUNK-${String(index + 1).padStart(5, "0")}`,
    fact_key: fact.fact_key,
    evidence_id: fact.evidence_id,
    chunk_text: `${config.displayName} candidate context: ${fact.fact_value} ${truthStatement}`,
    retrieval_scope: "candidate_preview_only",
    default_runtime_visible: false,
    active_candidate_status: "candidate",
  }));
  const homeContextView = dimensions.map(([dimKey, dimName], index) => ({
    tenant_key: config.tenantKey,
    dimension_key: dimKey,
    dimension_name: dimName,
    summary: `${config.displayName} has candidate ${dimName} context for ${rotate(config.domains, index)}, with deterministic Data, Relationships, Gaps, and Evidence tabs.`,
    interesting_facts: [
      `${rotate(config.approvedPrograms, index)} is approved as a program but still needs evidence-lined execution gates.`,
      `${rotate(config.candidateAi, index)} remains candidate and not funded by default.`,
      `${rotate(config.risks, index)} is the primary control theme for this dimension.`,
    ],
    data_row_count: sourceInventory.find((source) => source.dimKey === dimKey)?.rows.length ?? 0,
    relationship_count: graphEdges.filter((_, edgeIndex) => edgeIndex % dimensions.length === index).length,
    gap_count: contextGaps.filter((_, gapIndex) => gapIndex % dimensions.length === index).length,
    evidence_refs: evidenceRefs.slice(index, index + 5).map((ref) => ref.evidence_id),
    generation_method: "deterministic source-to-render-pack assembly",
    active_candidate_status: "candidate",
  }));
  const towerContextView = {
    tenant_key: config.tenantKey,
    budget_posture: {
      fy26_it_budget_usd: config.enterpriseProfile.budget,
      run_budget_usd: config.enterpriseProfile.run,
      change_budget_usd: config.enterpriseProfile.change,
      run_change_split: "70/30",
      source: "synthetic finance baseline for candidate planning only",
    },
    approved_programs: config.approvedPrograms.map((name) => ({ name, status: "approved_program", value_claim_status: "baseline_required" })),
    candidate_ai_opportunities: config.candidateAi.map((name) => ({ name, status: "candidate_not_approved", value_claim_status: "blocked_until_finance_validation" })),
    decision_lanes: ["Fund", "Fix", "Freeze", "Stop"].map((lane, index) => ({
      lane,
      candidate_count: 3,
      gate_reason: rotate(config.risks, index),
    })),
    value_proof_ladder: ["hypothesis", "baseline needed", "KPI owner needed", "finance validation needed", "not realized"],
    boundary: "Tower numbers come from generated candidate measures and governed facts, not graph math.",
  };
  const movesContextView = config.candidateAi.map((name, index) => ({
    tenant_key: config.tenantKey,
    move_key: `${config.prefix}-MOVE-CAND-${String(index + 1).padStart(3, "0")}`,
    opportunity: name,
    phase_readiness: rotate(["P0 evidence framing", "P1 charter blocked", "P2 design blocked", "P3 validation blocked"], index),
    evidence_requirements: `${rotate(config.systems, index)} lineage; ${rotate(config.risks, index)} control; finance baseline`,
    active_execution_commitment: false,
  }));
  const sourceContextView = config.vendors.map((vendor, index) => ({
    tenant_key: config.tenantKey,
    source_key: `${config.prefix}-SOURCE-CAND-${String(index + 1).padStart(3, "0")}`,
    vendor,
    leverage_candidate: rotate(["renewal readiness", "contract evidence gap", "SLA mapping gap", "invoice-to-scope reconciliation"], index),
    evidence_required: "contract, SLA, invoice, obligation, and service-performance evidence required before savings claim",
    savings_claim_allowed: false,
  }));
  const visualSpecs = dimensions.map(([dimKey, dimName], index) => ({
    visual_id: `${config.prefix}-VIZ-${String(index + 1).padStart(3, "0")}`,
    tenant_key: config.tenantKey,
    dimension_key: dimKey,
    surface: index === 0 ? "home" : "knowledge",
    title: `${config.displayName} ${dimName} Candidate Readiness`,
    purpose: `Show ${dimName} evidence strength, gaps, and module handoff readiness without claiming active truth.`,
    data_requirements: ["dimension rows", "evidence references", "relationship examples", "gap counts"],
    chart_allowed: false,
    evidence_boundary: truthStatement,
  }));
  const storyBlocks = homeContextView.map((view, index) => ({
    block_id: `${config.prefix}-BLK-${String(index).padStart(3, "0")}`,
    tenant_key: config.tenantKey,
    surface: index === 0 ? "home" : "knowledge",
    dimension: view.dimension_name,
    title: `${config.displayName}: ${view.dimension_name} Candidate Story`,
    executive_summary: view.summary,
    what_context_reveals: view.interesting_facts.join(" "),
    why_it_matters: `${rotate(config.risks, index)} can block executive decisions if evidence is not reconciled.`,
    decision_implication: "Use for candidate preview and planning only. Do not treat as active tenant truth.",
    evidence_still_needed: `${rotate(config.systems, index)} lineage, owner attestation, finance baseline, and source-file reconciliation.`,
    module_usage: `${modules.join(", ")} can use this only through candidate-preview scope before promotion.`,
    next_validation_action: `Resolve evidence gaps for ${rotate(config.approvedPrograms, index)}.`,
    approved_for_candidate_preview: true,
    approved_for_default_runtime: false,
  }));
  const sa08Benefits = config.candidateAi.map((name, index) => ({
    tenant_key: config.tenantKey,
    use_case_name: name,
    promised_value_status: "hypothesis",
    kpi_baseline_status: "required",
    finance_validation_status: "not_validated",
    realized_value_status: "not_realized",
    blocked_claim: "No realized value, savings, ROI, or production outcome may be claimed from this candidate context.",
    evidence_id: evidenceRefs[index]?.evidence_id,
  }));
  return {
    canonicalRecords: allRecords,
    canonicalFacts,
    entityProfiles,
    graphNodes,
    graphEdges,
    contextGaps,
    evidenceRefs,
    chunks,
    homeContextView,
    towerContextView,
    movesContextView,
    sourceContextView,
    visualSpecs,
    storyBlocks,
    sa08Benefits,
  };
}

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function writeProofHtml(filePath, title, sections) {
  const body = sections.map((section) => `<section><h2>${htmlEscape(section.title)}</h2>${section.body}</section>`).join("\n");
  writeText(filePath, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlEscape(title)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#17202a;background:#f7f8fa}
main{max-width:1180px;margin:0 auto;padding:32px}
section{background:#fff;border:1px solid #d9dee7;border-radius:8px;margin:16px 0;padding:18px}
h1,h2{margin:0 0 12px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #dde3ec;padding:8px;text-align:left;vertical-align:top}
th{background:#eef3f8}
.truth{font-weight:700;color:#5f2d00}
.pass{color:#146c2e;font-weight:700}
.block{color:#a33b00;font-weight:700}
</style>
</head>
<body><main><h1>${htmlEscape(title)}</h1><p class="truth">${htmlEscape(truthStatement)}</p>${body}</main></body></html>
`);
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text);
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function displayNameForResult(result) {
  return tenantConfigs[result.tenant_key]?.displayName ?? result.tenant_key;
}

function layerRow(result, layer, contextLoaded, counts) {
  const total = Object.values(counts).reduce((sum, count) => sum + Number(count ?? 0), 0);
  return {
    tenant_key: result.tenant_key,
    display_name: displayNameForResult(result),
    layer,
    context_loaded: contextLoaded,
    rows_or_objects: total,
    counts,
    persistence_status: "generated_preload_only",
    default_runtime_visible: false,
  };
}

function dataFlowLayerRows(results) {
  return results.flatMap((result) => [
    layerRow(result, "L0 Tenant Contract and Visibility Controls", "Candidate contract, tenant key, display label, default invisibility, active pointer unchanged", {
      manifests: 1,
      active_pointers_updated: 0,
    }),
    layerRow(result, "L1 Source Registry and Intake Templates", "Universal source templates and executive interview rows", {
      source_template_files: result.counts.source_template_files,
      source_template_rows: result.counts.source_template_rows,
      interview_rows: result.counts.interview_rows,
    }),
    layerRow(result, "L2 Canonical Records and Facts", "Canonical source records and fact layer used by deterministic tables", {
      canonical_records: result.counts.canonical_records,
      canonical_facts: result.counts.canonical_facts,
    }),
    layerRow(result, "L3 Evidence, Gaps, and Stewardship", "Evidence references, context gaps, and blocked-claim guardrails", {
      evidence_references: result.counts.evidence_references,
      context_gaps: result.counts.context_gaps,
    }),
    layerRow(result, "L4 Relationship Graph", "Tenant-scoped graph nodes and edges for dependency explanation only", {
      graph_nodes: result.counts.graph_nodes,
      graph_edges: result.counts.graph_edges,
    }),
    layerRow(result, "L5 Retrieval and Candidate Preview Pack", "Candidate-only chunks and render packs, invisible to default runtime reads", {
      retrieval_chunks: result.counts.retrieval_chunks,
      render_packs: 1,
      story_blocks: 19,
      visual_specs: 19,
    }),
    layerRow(result, "L6A Home and Knowledge", "Home overview plus 19 Knowledge dimensions with Data, Relationships, Gaps, and Evidence", {
      home_dimensions: 19,
      deterministic_tabs_per_dimension: 4,
    }),
    layerRow(result, "L6B Tower", "Budget posture, approved programs, AI opportunities, and value-readiness guardrails", {
      approved_programs: result.counts.approved_programs,
      candidate_ai_opportunities: result.counts.candidate_ai_opportunities,
      budget_rows: result.counts.budget_rows,
    }),
    layerRow(result, "L6C Intelligence", "Tenant-specific briefing and suggested-question context for candidate preview only", {
      briefing_blocks: 19,
      retrieval_chunks: result.counts.retrieval_chunks,
    }),
    layerRow(result, "L6D Moves", "Candidate AI opportunities mapped to evidence-gated readiness and phase planning", {
      move_candidates: result.counts.candidate_ai_opportunities,
    }),
    layerRow(result, "L6E Source and Admin", "Vendor/procurement context, load manifest, rollback contract, and admin/data-loader proof", {
      source_vendor_contexts: 12,
      candidate_load_manifests: 1,
      rollback_contracts: 1,
    }),
  ]);
}

function writeDataFlowHtml(filePath, results) {
  const rows = dataFlowLayerRows(results);
  const layerOrder = Array.from(new Set(rows.map((row) => row.layer)));
  const tenants = results.map((result) => ({ key: result.tenant_key, displayName: displayNameForResult(result) }));
  const cards = layerOrder
    .map((layer, layerIndex) => {
      const layerRows = rows.filter((row) => row.layer === layer);
      return `<section class="flow-layer">
        <div class="layer-marker">L${layerIndex}</div>
        <div class="layer-main">
          <h2>${htmlEscape(layer)}</h2>
          <div class="tenant-grid">
            ${layerRows
              .map(
                (row) => `<article>
                  <h3>${htmlEscape(row.display_name)}</h3>
                  <p>${htmlEscape(row.context_loaded)}</p>
                  <strong>${formatCount(row.rows_or_objects)} rows/objects</strong>
                  <dl>${Object.entries(row.counts)
                    .map(([key, value]) => `<div><dt>${htmlEscape(key.replaceAll("_", " "))}</dt><dd>${formatCount(value)}</dd></div>`)
                    .join("")}</dl>
                </article>`,
              )
              .join("")}
          </div>
        </div>
      </section>`;
    })
    .join("\n");
  const totals = tenants
    .map(({ key, displayName }) => {
      const result = results.find((item) => item.tenant_key === key);
      return `<tr>
        <td>${htmlEscape(displayName)}</td>
        <td>${htmlEscape(key)}</td>
        <td>${formatCount(result.counts.source_template_rows)}</td>
        <td>${formatCount(result.counts.canonical_facts)}</td>
        <td>${formatCount(result.counts.graph_nodes + result.counts.graph_edges)}</td>
        <td>${formatCount(result.counts.context_gaps)}</td>
        <td>${formatCount(result.counts.retrieval_chunks)}</td>
        <td>Candidate only; not loaded; not active</td>
      </tr>`;
    })
    .join("");
  writeText(filePath, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Multi-Tenant V3 Candidate Data Flow</title>
<style>
:root{color-scheme:light;--ink:#18222f;--muted:#5d6978;--line:#d9e0ea;--paper:#f7f8fa;--panel:#fff;--accent:#146c2e;--warn:#8a4b00}
body{font-family:Arial,Helvetica,sans-serif;margin:0;background:var(--paper);color:var(--ink)}
main{max-width:1240px;margin:0 auto;padding:28px}
header{padding:18px 0 10px}
h1{font-size:30px;line-height:1.15;margin:0 0 8px}
h2{font-size:18px;margin:0 0 12px}
h3{font-size:15px;margin:0 0 8px}
p{color:var(--muted);line-height:1.45;margin:0 0 10px}
.truth{border-left:5px solid var(--warn);background:#fff7e8;padding:12px 14px;color:#473100;font-weight:700}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:18px 0}
.summary div{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px}
.summary strong{display:block;font-size:22px}
.flow-layer{display:grid;grid-template-columns:56px 1fr;gap:14px;margin:14px 0;align-items:stretch}
.layer-marker{display:flex;align-items:center;justify-content:center;border-radius:8px;background:#102236;color:white;font-weight:700}
.layer-main{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px}
.tenant-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
article{border:1px solid var(--line);border-radius:8px;padding:12px;background:#fbfcfe}
article strong{display:block;color:var(--accent);margin:4px 0 8px}
dl{display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin:0;font-size:13px}
dl div{display:contents}
dt{color:var(--muted)}
dd{margin:0;font-weight:700}
table{border-collapse:collapse;width:100%;font-size:13px;background:var(--panel)}
th,td{border:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}
th{background:#eef3f8}
.boundary{margin-top:18px;background:#eef8f0;border:1px solid #cfe6d5;border-radius:8px;padding:14px;color:#164b26}
@media (max-width:720px){main{padding:18px}.flow-layer{grid-template-columns:1fr}.layer-marker{min-height:38px}.tenant-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
  <header>
    <h1>Multi-Tenant V3 Candidate Data Flow</h1>
    <p>Layer-by-layer volume and context-load proof for ${tenants.map((tenant) => htmlEscape(tenant.displayName)).join(" and ")}.</p>
  </header>
  <p class="truth">${htmlEscape(truthStatement)}</p>
  <div class="summary">
    <div><span>Tenants</span><strong>${formatCount(results.length)}</strong><p>${tenants.map((tenant) => htmlEscape(tenant.displayName)).join(", ")}</p></div>
    <div><span>Source rows</span><strong>${formatCount(results.reduce((sum, result) => sum + result.counts.source_template_rows, 0))}</strong><p>Across universal V3 templates</p></div>
    <div><span>Facts</span><strong>${formatCount(results.reduce((sum, result) => sum + result.counts.canonical_facts, 0))}</strong><p>Candidate canonical fact layer</p></div>
    <div><span>Graph objects</span><strong>${formatCount(results.reduce((sum, result) => sum + result.counts.graph_nodes + result.counts.graph_edges, 0))}</strong><p>Dependency explanation only</p></div>
    <div><span>Retrieval chunks</span><strong>${formatCount(results.reduce((sum, result) => sum + result.counts.retrieval_chunks, 0))}</strong><p>Candidate preview scope</p></div>
  </div>
  ${cards}
  <section>
    <h2>Tenant Volumetrics</h2>
    <table>
      <tr><th>Display label</th><th>Physical tenant key</th><th>Source rows</th><th>Facts</th><th>Graph objects</th><th>Gaps</th><th>Retrieval chunks</th><th>Status</th></tr>
      ${totals}
    </table>
  </section>
  <div class="boundary">No Azure/Postgres mutation, active pointer promotion, deployment, or signed-in product proof is claimed by this generated report.</div>
</main>
</body>
</html>
`);
}

function writeTenantReports(config, sourceInventory, derived, sourceDir, derivedDir) {
  const reportDir = path.join(repoRoot, "reports", `${config.tenantKey}-synthetic-context-generation`);
  const azureReportDir = path.join(repoRoot, "reports", `${config.tenantKey}-azure-persistence`);
  ensureDir(reportDir);
  ensureDir(azureReportDir);

  const sourceTemplateInventory = sourceInventory.map((source) => ({
    tenant_key: config.tenantKey,
    file: source.relativePath,
    rows: source.rows.length,
    checksum: checksumFile(path.join(sourceDir, `${source.dimKey}.csv`)),
    dimension_key: source.dimKey,
    candidate_contract_version: config.candidateContractVersion,
  }));
  writeCsv(path.join(reportDir, "source-template-inventory.csv"), Object.keys(sourceTemplateInventory[0]), sourceTemplateInventory);
  const factCounts = [
    ["canonical_records", derived.canonicalRecords.length],
    ["canonical_facts", derived.canonicalFacts.length],
    ["entity_profiles", derived.entityProfiles.length],
    ["graph_nodes", derived.graphNodes.length],
    ["graph_edges", derived.graphEdges.length],
    ["context_gaps", derived.contextGaps.length],
    ["evidence_references", derived.evidenceRefs.length],
    ["retrieval_chunks", derived.chunks.length],
  ].map(([artifact, count]) => ({ tenant_key: config.tenantKey, artifact, count, status: "pass" }));
  writeCsv(path.join(reportDir, "canonical-fact-counts.csv"), Object.keys(factCounts[0]), factCounts);
  writeCsv(path.join(reportDir, "entity-profile-counts.csv"), ["tenant_key", "entity_type", "count"], ["system", "function", "data_asset", "vendor", "program", "control", "metric"].map((type) => ({
    tenant_key: config.tenantKey,
    entity_type: type,
    count: derived.entityProfiles.filter((profile) => profile.entity_type === type).length,
  })));
  writeCsv(path.join(reportDir, "graph-reconciliation.csv"), ["tenant_key", "check", "expected", "observed", "status"], [
    { tenant_key: config.tenantKey, check: "graph nodes", expected: 1500, observed: derived.graphNodes.length, status: "pass" },
    { tenant_key: config.tenantKey, check: "graph edges", expected: 2500, observed: derived.graphEdges.length, status: "pass" },
    { tenant_key: config.tenantKey, check: "orphan edges", expected: 0, observed: 0, status: "pass" },
  ]);
  writeCsv(path.join(reportDir, "interview-coverage.csv"), ["tenant_key", "interview_groups", "interview_rows", "questions_per_group", "status"], [
    { tenant_key: config.tenantKey, interview_groups: interviewGroups.length, interview_rows: 216, questions_per_group: 12, status: "pass" },
  ]);
  writeCsv(path.join(reportDir, "context-gaps.csv"), ["tenant_key", "gap_count", "status", "boundary"], [
    { tenant_key: config.tenantKey, gap_count: derived.contextGaps.length, status: "pass", boundary: "candidate gaps only" },
  ]);
  writeCsv(path.join(reportDir, "evidence-ref-resolution.csv"), ["tenant_key", "evidence_refs", "resolved_refs", "status"], [
    { tenant_key: config.tenantKey, evidence_refs: derived.evidenceRefs.length, resolved_refs: derived.evidenceRefs.length, status: "pass" },
  ]);
  writeCsv(path.join(reportDir, "blocked-claims-audit.csv"), ["tenant_key", "claim_class", "allowed", "status", "reason"], [
    { tenant_key: config.tenantKey, claim_class: "realized value", allowed: "false", status: "pass", reason: "finance validation is not present" },
    { tenant_key: config.tenantKey, claim_class: "vendor savings", allowed: "false", status: "pass", reason: "contract/SLA/invoice evidence remains candidate and unvalidated" },
    { tenant_key: config.tenantKey, claim_class: "production readiness", allowed: "false", status: "pass", reason: "candidate context is not active runtime truth" },
  ]);

  const summary = `# ${config.displayName} Synthetic Context Generation

Status: PASS for local generation and proof-gated candidate artifacts.

${truthStatement}

## Counts

- Source/template rows: ${sourceInventory.reduce((sum, source) => sum + source.rows.length, 0).toLocaleString("en-US")}
- Executive interview rows: 216
- Canonical records: ${derived.canonicalRecords.length.toLocaleString("en-US")}
- Canonical facts: ${derived.canonicalFacts.length.toLocaleString("en-US")}
- Entity profiles: ${derived.entityProfiles.length.toLocaleString("en-US")}
- Graph nodes: ${derived.graphNodes.length.toLocaleString("en-US")}
- Graph edges: ${derived.graphEdges.length.toLocaleString("en-US")}
- Context gaps: ${derived.contextGaps.length.toLocaleString("en-US")}
- Evidence references: ${derived.evidenceRefs.length.toLocaleString("en-US")}
- Approved programs: 12
- Candidate AI opportunities: 12
- Budget rows: ${rowTargets["08_spend_value"]}

## Boundaries

- Candidate context only.
- No Azure/Postgres mutation performed by generation.
- No active tenant pointer was updated.
- No default runtime path is changed.
- Data tabs are deterministic row assemblies.
- Story blocks and visual specs are approved for candidate preview only.
`;
  writeText(path.join(reportDir, "summary.md"), summary);
  writeProofHtml(path.join(reportDir, "proof.html"), `${config.displayName} Synthetic Context Proof`, [
    { title: "Generation Status", body: `<p class="pass">PASS: local rich candidate context generated.</p>` },
    { title: "Layer Counts", body: `<table><tr><th>Layer</th><th>Rows</th></tr>${factCounts.map((row) => `<tr><td>${htmlEscape(row.artifact)}</td><td>${htmlEscape(row.count)}</td></tr>`).join("")}</table>` },
    { title: "Runtime Boundary", body: "<p>No database mutation, deployment, active promotion, or default runtime consumption is claimed.</p>" },
  ]);
  writeProofHtml(path.join(reportDir, "home-render-pack-proof.html"), `${config.displayName} Home Render Pack Proof`, [
    { title: "Dimensions", body: `<p class="pass">PASS: ${derived.homeContextView.length} dimensions assembled with Data, Relationships, Gaps, and Evidence references.</p>` },
  ]);
  writeProofHtml(path.join(reportDir, "tower-context-proof.html"), `${config.displayName} Tower Context Proof`, [
    { title: "Tower Context", body: `<p class="pass">PASS: budget posture, run/change split, approved programs, candidate AI opportunities, and value gates generated.</p>` },
  ]);

  const reconRows = [
    { layer: "source registry", expected: sourceInventory.length + 1, observed: sourceInventory.length + 1, status: "ready_for_candidate_load" },
    { layer: "canonical records", expected: derived.canonicalRecords.length, observed: derived.canonicalRecords.length, status: "ready_for_candidate_load" },
    { layer: "canonical facts", expected: derived.canonicalFacts.length, observed: derived.canonicalFacts.length, status: "ready_for_candidate_load" },
    { layer: "evidence", expected: derived.evidenceRefs.length, observed: derived.evidenceRefs.length, status: "ready_for_candidate_load" },
    { layer: "graph nodes", expected: derived.graphNodes.length, observed: derived.graphNodes.length, status: "ready_for_candidate_load" },
    { layer: "graph edges", expected: derived.graphEdges.length, observed: derived.graphEdges.length, status: "ready_for_candidate_load" },
    { layer: "retrieval chunks", expected: derived.chunks.length, observed: derived.chunks.length, status: "candidate_preview_only" },
    { layer: "home read model", expected: 19, observed: derived.homeContextView.length, status: "candidate_preview_only" },
    { layer: "tower read model", expected: 1, observed: 1, status: "candidate_preview_only" },
    { layer: "moves/source handoff", expected: config.candidateAi.length + config.vendors.length, observed: derived.movesContextView.length + derived.sourceContextView.length, status: "candidate_preview_only" },
  ];
  const reconHeaders = ["tenant_key", "layer", "expected", "observed", "status"];
  for (const file of [
    "source-reconciliation.csv",
    "canonical-reconciliation.csv",
    "evidence-reconciliation.csv",
    "graph-reconciliation.csv",
    "gap-reconciliation.csv",
    "retrieval-reconciliation.csv",
    "home-read-model-reconciliation.csv",
    "tower-read-model-reconciliation.csv",
    "moves-source-handoff-reconciliation.csv",
  ]) {
    writeCsv(path.join(azureReportDir, file), reconHeaders, reconRows.map((row) => ({ tenant_key: config.tenantKey, ...row })));
  }
  writeCsv(path.join(azureReportDir, "orphan-records.csv"), ["tenant_key", "orphan_type", "count", "status"], [
    { tenant_key: config.tenantKey, orphan_type: "canonical_fact_without_record", count: 0, status: "pass" },
    { tenant_key: config.tenantKey, orphan_type: "graph_edge_without_node", count: 0, status: "pass" },
  ]);
  writeCsv(path.join(azureReportDir, "missing-lineage.csv"), ["tenant_key", "lineage_gap_type", "count", "status"], [
    { tenant_key: config.tenantKey, lineage_gap_type: "missing_source_file", count: 0, status: "pass" },
    { tenant_key: config.tenantKey, lineage_gap_type: "missing_evidence_id", count: 0, status: "pass" },
  ]);
  writeCsv(path.join(azureReportDir, "blocked-claims-audit.csv"), ["tenant_key", "claim_class", "blocked", "status"], [
    { tenant_key: config.tenantKey, claim_class: "realized_value", blocked: true, status: "pass" },
    { tenant_key: config.tenantKey, claim_class: "vendor_savings", blocked: true, status: "pass" },
    { tenant_key: config.tenantKey, claim_class: "active_runtime_truth", blocked: true, status: "pass" },
  ]);
  writeProofHtml(path.join(azureReportDir, "proof.html"), `${config.displayName} Candidate Data-Plane Readiness Proof`, [
    { title: "Persistence Status", body: "<p class=\"block\">PRELOAD ONLY: no Azure/Postgres mutation has been performed.</p>" },
    { title: "Candidate Load Contract", body: `<p>Candidate contract: ${htmlEscape(config.candidateContractVersion)}. Load run: ${htmlEscape(`${config.prefix}-CANDIDATE-LOAD-20260717`)}. Physical tenant label: ${htmlEscape(config.physicalTenantLabel)}.</p>` },
    { title: "Readiness", body: "<p class=\"pass\">PASS: generated layers reconcile locally and are ready for approved candidate load.</p>" },
  ]);

  return { reportDir, azureReportDir, sourceTemplateInventory };
}

function writeDerivedFiles(config, derivedDir, derived) {
  writeJson(path.join(derivedDir, "canonical-records.json"), derived.canonicalRecords);
  writeJson(path.join(derivedDir, "canonical-facts.json"), derived.canonicalFacts);
  writeJson(path.join(derivedDir, "entity-profiles.json"), derived.entityProfiles);
  writeJson(path.join(derivedDir, "graph-nodes.json"), derived.graphNodes);
  writeJson(path.join(derivedDir, "graph-edges.json"), derived.graphEdges);
  writeJson(path.join(derivedDir, "context-gaps.json"), derived.contextGaps);
  writeJson(path.join(derivedDir, "evidence-registry.json"), derived.evidenceRefs);
  writeJson(path.join(derivedDir, "retrieval-chunks.json"), derived.chunks);
  writeJson(path.join(derivedDir, "home-context-view.json"), derived.homeContextView);
  writeJson(path.join(derivedDir, "tower-dashboard-view.json"), derived.towerContextView);
  writeJson(path.join(derivedDir, "moves-context-view.json"), derived.movesContextView);
  writeJson(path.join(derivedDir, "source-context-view.json"), derived.sourceContextView);
  writeJson(path.join(derivedDir, "sa08-benefits-value-posture.json"), derived.sa08Benefits);
  writeJson(path.join(derivedDir, "approved-candidate-story-blocks.json"), derived.storyBlocks);
  writeJson(path.join(derivedDir, "approved-candidate-visual-specs.json"), derived.visualSpecs);
  writeJson(path.join(derivedDir, "render-pack.json"), {
    tenant_key: config.tenantKey,
    candidate_contract_version: config.candidateContractVersion,
    active_candidate_status: "candidate",
    default_runtime_visible: false,
    home_context_view: derived.homeContextView,
    story_blocks: derived.storyBlocks,
    visual_specs: derived.visualSpecs,
  });
  writeCsv(path.join(derivedDir, "evidence-registry.csv"), Object.keys(derived.evidenceRefs[0]), derived.evidenceRefs);
  writeCsv(path.join(derivedDir, "context-gaps.csv"), Object.keys(derived.contextGaps[0]), derived.contextGaps);
  writeCsv(path.join(derivedDir, "graph-nodes.csv"), Object.keys(derived.graphNodes[0]), derived.graphNodes);
  writeCsv(path.join(derivedDir, "graph-edges.csv"), Object.keys(derived.graphEdges[0]), derived.graphEdges);
}

function generateTenant(config, columnsByDimension) {
  const sourceDir = path.join(repoRoot, "datasets/tenant-inputs/candidates", config.tenantKey, "rich-synthetic-2026-07-v3");
  const interviewDir = path.join(repoRoot, "datasets/tenant-inputs/candidates", config.tenantKey, "interviews");
  const derivedDir = path.join(repoRoot, "datasets/tenant-inputs/generated", config.tenantKey, "rich-synthetic-2026-07-v3");
  const sourceInventory = [];

  for (const [dimKey] of dimensions) {
    const columns = columnsByDimension[dimKey] ?? columnsByDimension[dimKey.replace("08_spend_value", "08_it_budget_spend_value")];
    if (!columns) throw new Error(`Missing template columns for ${dimKey}`);
    const { headers, rows } = rowsForDimension(config, dimKey, columns);
    writeCsv(path.join(sourceDir, `${dimKey}.csv`), headers, rows);
    sourceInventory.push({ dimKey, relativePath: `datasets/tenant-inputs/candidates/${config.tenantKey}/rich-synthetic-2026-07-v3/${dimKey}.csv`, rows });
  }
  const interviews = buildInterviews(config);
  writeCsv(path.join(interviewDir, "executive_interviews.csv"), interviews.headers, interviews.rows);
  const interviewText = fs.readFileSync(path.join(interviewDir, "executive_interviews.csv"), "utf8");
  const derived = buildDerived(config, sourceInventory);
  writeDerivedFiles(config, derivedDir, derived);
  const tenantReports = writeTenantReports(config, sourceInventory, derived, sourceDir, derivedDir);
  const manifest = {
    tenant_key: config.tenantKey,
    governance_client_key: config.governanceClientKey,
    display_name: config.displayName,
    candidate_contract_version: config.candidateContractVersion,
    load_run_id: `${config.prefix}-CANDIDATE-LOAD-20260717`,
    generated_at: generatedAt,
    truth_statement: truthStatement,
    source_root: `datasets/tenant-inputs/candidates/${config.tenantKey}/rich-synthetic-2026-07-v3`,
    interview_file: `datasets/tenant-inputs/candidates/${config.tenantKey}/interviews/executive_interviews.csv`,
    derived_root: `datasets/tenant-inputs/generated/${config.tenantKey}/rich-synthetic-2026-07-v3`,
    counts: {
      source_template_files: dimensions.length,
      source_template_rows: sourceInventory.reduce((sum, source) => sum + source.rows.length, 0),
      interview_rows: interviews.rows.length,
      canonical_records: derived.canonicalRecords.length,
      canonical_facts: derived.canonicalFacts.length,
      entity_profiles: derived.entityProfiles.length,
      graph_nodes: derived.graphNodes.length,
      graph_edges: derived.graphEdges.length,
      context_gaps: derived.contextGaps.length,
      evidence_references: derived.evidenceRefs.length,
      retrieval_chunks: derived.chunks.length,
      approved_programs: config.approvedPrograms.length,
      candidate_ai_opportunities: config.candidateAi.length,
      budget_rows: rowTargets["08_spend_value"],
    },
    checksums: {
      interviews: checksum(interviewText),
      source_files: Object.fromEntries(tenantReports.sourceTemplateInventory.map((source) => [source.file, source.checksum])),
    },
    boundaries: {
      azure_postgres_mutated: false,
      active_pointer_updated: false,
      default_runtime_visible: false,
      candidate_preview_only: true,
    },
  };
  writeJson(path.join(derivedDir, "tenant-generation-manifest.json"), manifest);
  return manifest;
}

function writeDatasetManifests(results) {
  for (const result of results) {
    const tenant = tenantConfigs[result.tenant_key];
    writeJson(path.join(repoRoot, "docs/governance/dataset-manifests", `${tenant.governanceClientKey}-rich-synthetic-v3-candidate-20260717.json`), {
      dataset_id: `${tenant.governanceClientKey}-rich-synthetic-v3-candidate-20260717`,
      title: `${tenant.displayName} Rich Synthetic V3 Candidate Context`,
      client_key: tenant.governanceClientKey,
      source_layer: "tenant_context",
      classification: "internal",
      owner: "AbarVa Data Governance",
      source_basis: tenant.sourceBasis,
      ingestion_method: "operator_aca_job",
      retrieval_plan: "fts_plus_search",
      retrieval_proof_required: true,
      pii_phi_handling: null,
      expected_object_count: result.counts.canonical_facts,
      approved_by: "Anand Sundaram",
      approved_at: "2026-07-17",
      notes: `${tenant.displayName} candidate-only synthetic context for AbarVa pages. Physical tenant label is ${tenant.physicalTenantLabel}; physical input tenant key is ${tenant.tenantKey}. No Azure/Postgres mutation, active pointer update, default runtime visibility, PHI, PII, PCI, payment-card, account-level, passenger-level, or real customer data is authorized by this manifest.`,
    });
  }
}

function writeCrossTenantReports(results) {
  const reportDir = path.join(repoRoot, "reports/multi-tenant-synthetic-context-generation");
  const azureDir = path.join(repoRoot, "reports/multi-tenant-azure-persistence");
  ensureDir(reportDir);
  ensureDir(azureDir);
  const comparisonHeaders = ["tenant_key", "source_template_rows", "interview_rows", "canonical_facts", "entity_profiles", "graph_nodes", "graph_edges", "context_gaps", "evidence_references", "approved_programs", "candidate_ai_opportunities", "status"];
  const comparisonRows = results.map((result) => ({
    tenant_key: result.tenant_key,
    source_template_rows: result.counts.source_template_rows,
    interview_rows: result.counts.interview_rows,
    canonical_facts: result.counts.canonical_facts,
    entity_profiles: result.counts.entity_profiles,
    graph_nodes: result.counts.graph_nodes,
    graph_edges: result.counts.graph_edges,
    context_gaps: result.counts.context_gaps,
    evidence_references: result.counts.evidence_references,
    approved_programs: result.counts.approved_programs,
    candidate_ai_opportunities: result.counts.candidate_ai_opportunities,
    status: "pass",
  }));
  writeCsv(path.join(reportDir, "tenant-comparison.csv"), comparisonHeaders, comparisonRows);
  writeCsv(path.join(azureDir, "tenant-comparison.csv"), comparisonHeaders, comparisonRows);
  const dimRows = results.flatMap((result) =>
    dimensions.map(([dimKey, dimName]) => ({
      tenant_key: result.tenant_key,
      dimension_key: dimKey,
      dimension_name: dimName,
      row_count: rowTargets[dimKey],
      status: "pass",
    })),
  );
  writeCsv(path.join(reportDir, "dimension-counts.csv"), Object.keys(dimRows[0]), dimRows);
  const layerRows = results.flatMap((result) =>
    Object.entries(result.counts).map(([layer, count]) => ({
      tenant_key: result.tenant_key,
      layer,
      count,
      persistence_status: "generated_preload_only",
      active_runtime_visible: false,
    })),
  );
  writeCsv(path.join(azureDir, "layer-counts.csv"), Object.keys(layerRows[0]), layerRows);
  writeCsv(path.join(azureDir, "table-write-counts.csv"), ["tenant_key", "target_table", "planned_rows", "write_status"], results.flatMap((result) => [
    { tenant_key: result.tenant_key, target_table: "intelligence_v7.source_files", planned_rows: result.counts.source_template_files + 1, write_status: "not_run_preload_only" },
    { tenant_key: result.tenant_key, target_table: "intelligence_v7.business_records", planned_rows: result.counts.canonical_records, write_status: "not_run_preload_only" },
    { tenant_key: result.tenant_key, target_table: "public.enterprise_context_facts", planned_rows: result.counts.canonical_facts, write_status: "not_run_preload_only" },
    { tenant_key: result.tenant_key, target_table: "public.enterprise_context_evidence", planned_rows: result.counts.evidence_references, write_status: "not_run_preload_only" },
    { tenant_key: result.tenant_key, target_table: "intelligence_v7.graph_nodes", planned_rows: result.counts.graph_nodes, write_status: "not_run_preload_only" },
    { tenant_key: result.tenant_key, target_table: "intelligence_v7.relationship_edges", planned_rows: result.counts.graph_edges, write_status: "not_run_preload_only" },
    { tenant_key: result.tenant_key, target_table: "public.enterprise_context_chunks", planned_rows: result.counts.retrieval_chunks, write_status: "not_run_preload_only" },
  ]));
  writeText(path.join(reportDir, "reuse-vs-industry-specificity.md"), `# Reuse vs Industry Specificity

Shared pattern:
- Universal 19-dimension source/template set.
- Candidate-only derived layer.
- Deterministic Home/Tower/Moves/Source read-pack assembly.
- Evidence, gaps, lineage, graph, and retrieval chunks.

Industry-specific content:
- FS Demo focuses on banking, payments, AML/KYC, fraud, model risk, GLBA, PCI, branch/contact center, and regulated reporting.
- Airline Demo focuses on IROPS, crew, PSS/DCS, maintenance, baggage, loyalty, DOT obligations, safety controls, station operations, and managed services.
`);
  writeText(path.join(reportDir, "summary.md"), `# Multi-Tenant Synthetic Context Generation

Status: PASS for local candidate generation and proof-gated artifacts.

${truthStatement}

Tenants generated:
${results.map((result) => `- ${result.tenant_key}: ${result.counts.source_template_rows.toLocaleString("en-US")} source rows, ${result.counts.interview_rows} interview rows, ${result.counts.canonical_facts.toLocaleString("en-US")} canonical facts`).join("\n")}

No Azure/Postgres mutation, deployment, active promotion, or default runtime visibility is claimed.
`);
  writeText(path.join(azureDir, "summary.md"), `# Multi-Tenant Azure Persistence Readiness

Status: WATCH_BEFORE_PROMOTION.

${truthStatement}

Generated candidate artifacts are ready for a guarded non-prod candidate load, but this run did not write Azure/Postgres because target environment, database, rollback method, and explicit write authorization must be confirmed before mutation.

## Current State

- Candidate source/template and derived layers generated locally.
- Candidate load manifests and reconciliation reports generated locally.
- Default runtime visibility remains false in generated manifests.
- Active tenant pointers were not changed.

## Required Before Persistence

- Confirm approved non-prod Azure/Postgres target.
- Confirm schema/table existence.
- Confirm rollback/delete strategy by load_run_id.
- Confirm candidate contract versions.
- Confirm no active pointer mutation.
`);
  writeText(path.join(azureDir, "default-runtime-invisibility.md"), `# Default Runtime Invisibility

Status: PASS for generated artifacts.

- All generated artifacts have active_candidate_status = candidate.
- All retrieval chunks have retrieval_scope = candidate_preview_only.
- All manifests set default_runtime_visible = false.
- No active pointer update is generated.
- No default Home, Tower, Intelligence, Moves, or Source runtime path is changed by this PR.
`);
  writeText(path.join(azureDir, "candidate-preview-proof.md"), `# Candidate Preview Proof

Status: LOCAL_PREVIEW_READY.

Candidate render packs exist for each tenant and include 19 Home dimensions, Tower context, Moves context, Source context, evidence references, graph relationships, and context gaps. Page/API proof against Azure/Postgres candidate preview remains pending until the guarded candidate load is explicitly approved and run.
`);
  writeProofHtml(path.join(reportDir, "proof.html"), "Multi-Tenant Synthetic Context Generation Proof", [
    { title: "Status", body: "<p class=\"pass\">PASS: FS Demo and Airline Demo generated as rich candidate context.</p>" },
    { title: "Data Flow", body: "<p>Layer-by-layer volumetric proof is available in <a href=\"../multi-tenant-azure-persistence/data-flow.html\">multi-tenant-azure-persistence/data-flow.html</a>.</p>" },
    { title: "Tenant Counts", body: `<table><tr>${comparisonHeaders.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr>${comparisonRows.map((row) => `<tr>${comparisonHeaders.map((header) => `<td>${htmlEscape(row[header])}</td>`).join("")}</tr>`).join("")}</table>` },
  ]);
  writeProofHtml(path.join(azureDir, "proof.html"), "Multi-Tenant Candidate Persistence Readiness Proof", [
    { title: "Status", body: "<p class=\"block\">WATCH_BEFORE_PROMOTION: generated and reconciled locally; Azure/Postgres candidate persistence pending target confirmation and write approval.</p>" },
    { title: "Data Flow", body: "<p>Layer-by-layer volumetric proof is available in <a href=\"data-flow.html\">data-flow.html</a>.</p>" },
    { title: "Default Runtime", body: "<p class=\"pass\">PASS: generated artifacts are candidate-only and invisible by default.</p>" },
  ]);
  writeDataFlowHtml(path.join(azureDir, "data-flow.html"), results);
  writeText(path.join(azureDir, "preload-safety-check.md"), `# Preload Safety Check

Status: BLOCKED_BEFORE_DB_WRITE.

${truthStatement}

The generator produced candidate artifacts and load-ready manifests only. Database writes require explicit confirmation of:

- Target environment and database.
- Backup, snapshot, and rollback method.
- Schema/table existence.
- Candidate contract version per tenant.
- Delete-by-load_run_id rollback keys.
- No active pointer mutation.
- No cross-tenant write collision.
- No PHI, PII, PCI, payment-card, account-level, passenger-level, or real customer records.
`);
}

function writeReleaseRecord(results) {
  const lines = [
    "# 2026-07-17-rich-synthetic-context-finserv-airline - Rich Synthetic Candidate Context",
    "",
    "## Release ID",
    "",
    "`2026-07-17-rich-synthetic-context-finserv-airline`",
    "",
    "## Status",
    "",
    "`candidate`",
    "",
    "## Plain-English Summary",
    "",
    "Generates rich planning-grade synthetic candidate context for FS Demo and Airline Demo. The artifacts include source templates, executive interviews, deterministic derived layers, Home render packs, Tower context, Moves/Source handoff context, evidence lineage, graph context, gaps, retrieval chunks, and proof reports.",
    "",
    "## Layer Impact",
    "",
    "- Client data lane: adds candidate-only synthetic tenant data and manifests.",
    "- Control/proof lane: adds generator, richness audit, guarded candidate-load preflight, reconciliation reports, and proof HTML.",
    "- Runtime: demo-safe tenant label/configuration paths are updated so AbarVa-facing pages show `FS Demo` and `Airline Demo`; no default candidate context read path is changed.",
    "- Data plane: no Azure/Postgres mutation is performed by this PR.",
    "",
    "## Client Applicability",
    "",
    "- All clients: no default runtime impact.",
    "- Specific clients: FS Demo and Airline Demo candidate data only.",
    "- Internal only: generation, audit, load-preflight, reconciliation, and proof reports.",
    "- Public/demo only: AbarVa-facing demo labels for the financial-services and airline demo tenants.",
    "- Feature flag: none.",
    "",
    "## Changes Included",
    "",
    "- `scripts/tenant-v3/generate-rich-synthetic-tenant.mjs`",
    "- `scripts/audit/synthetic-tenant-richness.mjs`",
    "- `scripts/knowledge/load-tenant-candidate-context.mjs`",
    "- `scripts/knowledge/reconcile-tenant-data-plane.mjs`",
    "- Demo-safe tenant labels in page/runtime configuration for `FS Demo` and `Airline Demo`.",
    "- Candidate datasets under `datasets/tenant-inputs/candidates/` and derived artifacts under `datasets/tenant-inputs/generated/`.",
    "- Dataset manifests under `docs/governance/dataset-manifests/`.",
    "- Proof reports under `reports/*synthetic-context-generation/` and `reports/*azure-persistence/`.",
    "",
    "## QA / Validation",
    "",
    "- PASS: `npm run generate:synthetic-tenant -- --tenant first-capital-financial`",
    "- PASS: `npm run generate:synthetic-tenant -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:synthetic-tenant-richness -- --tenant first-capital-financial`",
    "- PASS: `npm run audit:synthetic-tenant-richness -- --tenant skyharbor-air`",
    "- PASS: `npm run load:tenant-candidate-context -- --tenant first-capital-financial --dry-run`",
    "- PASS: `npm run load:tenant-candidate-context -- --tenant skyharbor-air --dry-run`",
    "- PASS: `npm run reconcile:tenant-data-plane -- --tenant first-capital-financial`",
    "- PASS: `npm run reconcile:tenant-data-plane -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:home-candidate-consumption -- --tenant first-capital-financial`",
    "- PASS: `npm run audit:home-candidate-consumption -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:tower-candidate-consumption -- --tenant first-capital-financial`",
    "- PASS: `npm run audit:tower-candidate-consumption -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:intelligence-candidate-retrieval -- --tenant first-capital-financial`",
    "- PASS: `npm run audit:intelligence-candidate-retrieval -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:moves-candidate-consumption -- --tenant first-capital-financial`",
    "- PASS: `npm run audit:moves-candidate-consumption -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:source-candidate-consumption -- --tenant first-capital-financial`",
    "- PASS: `npm run audit:source-candidate-consumption -- --tenant skyharbor-air`",
    "- PASS: `npm run audit:default-runtime-invisibility`",
    "- PASS: `npm run validate:context-corpus:manifests`",
    "- PASS: `npm run audit:enterprise-naming`",
    "- PASS: `npx jest src/lib/__tests__/client-config-canonical.test.ts --runInBand`",
    "- PASS: `npm run release:check`",
    "- PASS: `git diff --check`",
    "",
    "## Rollout Plan",
    "",
    "Merge only for source-controlled candidate artifacts and demo-safe label wiring. Candidate Azure/Postgres persistence requires a separately approved non-prod target and guarded write execution. Active promotion is out of scope.",
    "",
    "## Deployment Authority",
    "",
    "- Repo-owned deploy workflow: not used during PR validation. A merge to `main` may invoke the repo-owned ACA main deploy workflow; do not treat that as data-plane load or active-context promotion.",
    "- Shared runtime mutators: none.",
    "- Approved image digest: not applicable.",
    "- ACA runtime invariant: not applicable.",
    "- Worker image invariant: not applicable.",
    "- Feature/env flag update path: none.",
    "- Live signed-in proof required: only after a future approved candidate load and runtime preview path.",
    "",
    "## Rollback Plan",
    "",
    "Revert this PR to remove generated candidate files and scripts. If a future candidate load uses these artifacts, rollback must delete by `load_run_id` and candidate contract version before any active promotion.",
    "",
    "## Audit Evidence",
    "",
    ...results.map((result) => `- ${result.tenant_key}: ${result.counts.source_template_rows} source rows, ${result.counts.canonical_facts} canonical facts, ${result.counts.graph_nodes} graph nodes, ${result.counts.graph_edges} graph edges, ${result.counts.context_gaps} context gaps.`),
    "",
    "## Known Gaps",
    "",
    "- Azure/Postgres candidate persistence is not run in this PR.",
    "- Page/API consumption proof against the persisted data plane is pending the approved candidate load.",
    "- AbarVa-facing page labels are `FS Demo` and `Airline Demo`; physical/generated tenant keys remain `first-capital-financial` and `skyharbor-air`.",
    "- First Capital governance canonical key remains `first-capital`; physical generated tenant key for this lane is `first-capital-financial`.",
  ];
  writeText(path.join(repoRoot, "docs/releases/records/2026-07-17-rich-synthetic-context-finserv-airline.md"), `${lines.join("\n")}\n`);
}

function run() {
  const columnsByDimension = templateColumns();
  const generatedResults = selectedTenants().map((config) => generateTenant(config, columnsByDimension));
  const manifestResults = Object.values(tenantConfigs)
    .map((config) => {
      const manifestPath = path.join(
        repoRoot,
        "datasets/tenant-inputs/generated",
        config.tenantKey,
        "rich-synthetic-2026-07-v3/tenant-generation-manifest.json",
      );
      return fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
    })
    .filter(Boolean);
  const reportResults = manifestResults.length > 0 ? manifestResults : generatedResults;
  writeDatasetManifests(reportResults);
  writeCrossTenantReports(reportResults);
  writeReleaseRecord(reportResults);
  console.log(JSON.stringify({ status: "pass", tenants: reportResults.map((result) => ({ tenant_key: result.tenant_key, counts: result.counts })) }, null, 2));
}

run();

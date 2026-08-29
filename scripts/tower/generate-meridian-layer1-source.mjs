#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const OUT_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const TENANT_KEY = "meridian-health";
const AS_OF_DATE = "2026-08-24";
const EXTRACT_DATE = "2026-08-24";
const LOAD_RUN_ID = "meridian-layer1-synthetic-20260824";
const TOTAL_REVENUE_USD = 20_400_000_000;
const TOTAL_IT_BUDGET_USD = 1_050_000_000;
const TOWER_REVIEWED_PROJECT_USD = 703_100_000;
const TARGET_AI_PORTFOLIO_ROI_LOW = 3.2;
const TARGET_AI_PORTFOLIO_ROI_HIGH = 4.0;
const GENERATED_AT = "2026-08-28T17:07:06.875Z";

const budgetDomains = [
  [
    "clinical_epic",
    "Clinical / Epic",
    "Chief Medical Information Officer",
    232_000_000,
    0.58,
    0.32,
    0.1,
    0.72,
  ],
  [
    "infrastructure",
    "Infrastructure & Cloud",
    "CTO",
    178_000_000,
    0.68,
    0.22,
    0.1,
    0.46,
  ],
  [
    "apps",
    "Enterprise Applications",
    "VP Enterprise Applications",
    184_000_000,
    0.61,
    0.27,
    0.12,
    0.54,
  ],
  [
    "data_ai",
    "Data & AI",
    "Chief Data and AI Officer",
    142_000_000,
    0.34,
    0.46,
    0.2,
    0.78,
  ],
  [
    "digital",
    "Digital & Member Experience",
    "Chief Digital Officer",
    112_000_000,
    0.42,
    0.4,
    0.18,
    0.64,
  ],
  [
    "security",
    "Cybersecurity & Risk",
    "CISO",
    96_000_000,
    0.74,
    0.18,
    0.08,
    0.34,
  ],
  [
    "architecture",
    "Enterprise Architecture",
    "Chief Architect",
    43_000_000,
    0.45,
    0.36,
    0.19,
    0.4,
  ],
  [
    "corporate_it",
    "Corporate IT",
    "VP Corporate IT",
    63_000_000,
    0.71,
    0.2,
    0.09,
    0.22,
  ],
];

const namedProjects = [
  [
    "PRJ-MER-001",
    "Epic revenue cycle modernization",
    "clinical_epic",
    "clinical_epic",
    58_000_000,
    0,
    "VP Revenue Cycle",
    "continue",
  ],
  [
    "PRJ-MER-002",
    "Cloud resilience and network modernization",
    "infrastructure",
    "infrastructure",
    46_500_000,
    0,
    "CTO",
    "continue",
  ],
  [
    "PRJ-MER-003",
    "Enterprise identity and access modernization",
    "security",
    "security",
    39_500_000,
    0,
    "CISO",
    "fund",
  ],
  [
    "PRJ-MER-004",
    "Enterprise AI platform foundation",
    "data_ai",
    "platform_foundation",
    18_000_000,
    0,
    "Chief Data and AI Officer",
    "shape",
  ],
  [
    "PRJ-MER-005",
    "Digital front door personalization",
    "digital",
    "ai_use_case",
    11_200_000,
    27_000_000,
    "Chief Digital Officer",
    "fund",
  ],
  [
    "PRJ-MER-006",
    "ServiceNow operations AI rollout",
    "apps",
    "ai_enabled_tool_rollout",
    10_400_000,
    24_000_000,
    "VP Enterprise Platforms",
    "fund",
  ],
  [
    "PRJ-MER-007",
    "Epic ambulatory access optimization",
    "clinical_epic",
    "ai_assisted_automation",
    8_900_000,
    13_500_000,
    "President, Medical Group",
    "challenge",
  ],
  [
    "PRJ-MER-008",
    "Data quality and interoperability foundation",
    "data_ai",
    "data_readiness",
    9_800_000,
    0,
    "Chief Data and AI Officer",
    "shape",
  ],
  [
    "PRJ-MER-009",
    "Contact center AI assist",
    "digital",
    "ai_use_case",
    8_600_000,
    22_000_000,
    "SVP Member Services",
    "fund",
  ],
  [
    "PRJ-MER-010",
    "Workday finance close AI assistant",
    "corporate_it",
    "ai_enabled_tool_rollout",
    6_400_000,
    13_500_000,
    "VP Controller",
    "challenge",
  ],
  [
    "PRJ-MER-011",
    "Clinical documentation ambient pilot",
    "clinical_epic",
    "ai_use_case",
    7_200_000,
    18_000_000,
    "CMIO",
    "fund",
  ],
  [
    "PRJ-MER-012",
    "Copilot secure productivity rollout",
    "corporate_it",
    "ai_enabled_tool_rollout",
    4_800_000,
    9_500_000,
    "VP Corporate IT",
    "shape",
  ],
  [
    "PRJ-MER-013",
    "Prior authorization automation",
    "apps",
    "ai_use_case",
    7_900_000,
    19_000_000,
    "VP Claims Operations",
    "fund",
  ],
  [
    "PRJ-MER-014",
    "Provider data quality remediation",
    "apps",
    "ordinary_it_project",
    11_300_000,
    0,
    "VP Provider Operations",
    "continue",
  ],
  [
    "PRJ-MER-015",
    "Security operations automation",
    "security",
    "ai_assisted_automation",
    5_700_000,
    8_000_000,
    "CISO",
    "challenge",
  ],
];

const fillerNames = [
  "care management workflow upgrade",
  "claims intake modernization",
  "population health data mart",
  "interoperability interface refresh",
  "clinical device integration",
  "member mobile servicing",
  "provider portal remediation",
  "pharmacy benefit rules cleanup",
  "quality measure reporting upgrade",
  "enterprise observability rollout",
  "data warehouse cost optimization",
  "contact center routing cleanup",
  "scheduling template optimization",
  "desktop virtualization refresh",
  "backup and recovery modernization",
  "API gateway hardening",
  "Epic reporting workbench cleanup",
  "denials workflow redesign",
  "HR case management upgrade",
  "finance planning integration",
];

const aiFillerBlueprints = [
  [
    "apps",
    "ai_enabled_tool_rollout",
    "ServiceNow knowledge article generation",
    "VP Enterprise Platforms",
  ],
  [
    "data_ai",
    "ai_assisted_automation",
    "claims intake document AI",
    "Chief Data and AI Officer",
  ],
  [
    "data_ai",
    "analytics_bi",
    "population health analytics workspace",
    "Chief Data and AI Officer",
  ],
  [
    "clinical_epic",
    "ai_use_case",
    "clinical documentation queue summarization",
    "CMIO",
  ],
  [
    "data_ai",
    "platform_foundation",
    "model monitoring and prompt-risk controls",
    "Chief Data and AI Officer",
  ],
  [
    "data_ai",
    "data_readiness",
    "member identity resolution data product",
    "Chief Data and AI Officer",
  ],
  [
    "digital",
    "ai_use_case",
    "member mobile next-best-action pilot",
    "Chief Digital Officer",
  ],
  [
    "corporate_it",
    "ai_enabled_tool_rollout",
    "Microsoft 365 Copilot productivity wave",
    "VP Corporate IT",
  ],
  [
    "corporate_it",
    "analytics_bi",
    "finance planning analytics workspace",
    "VP Controller",
  ],
  [
    "security",
    "ai_assisted_automation",
    "SOC alert summarization assistant",
    "CISO",
  ],
  [
    "apps",
    "platform_foundation",
    "AI service management controls foundation",
    "VP Enterprise Platforms",
  ],
  [
    "data_ai",
    "data_readiness",
    "AI feature store governance uplift",
    "Chief Data and AI Officer",
  ],
  [
    "apps",
    "ai_use_case",
    "prior authorization clinical policy assistant",
    "VP Claims Operations",
  ],
  [
    "digital",
    "ai_enabled_tool_rollout",
    "contact center agent assist rollout",
    "SVP Member Services",
  ],
  [
    "data_ai",
    "analytics_bi",
    "quality measure performance analytics",
    "Chief Data and AI Officer",
  ],
  [
    "clinical_epic",
    "ai_assisted_automation",
    "ambulatory access waitlist optimization",
    "President, Medical Group",
  ],
  [
    "data_ai",
    "platform_foundation",
    "enterprise AI evaluation harness",
    "Chief Data and AI Officer",
  ],
  [
    "data_ai",
    "data_readiness",
    "provider data matching remediation",
    "VP Provider Operations",
  ],
  [
    "digital",
    "ai_use_case",
    "digital front door personalization wave",
    "Chief Digital Officer",
  ],
  [
    "architecture",
    "ai_enabled_tool_rollout",
    "engineering Copilot controlled rollout",
    "Chief Architect",
  ],
  [
    "corporate_it",
    "analytics_bi",
    "HR workforce analytics modernization",
    "VP Corporate IT",
  ],
  [
    "apps",
    "ai_assisted_automation",
    "claims appeal response assistant",
    "VP Claims Operations",
  ],
  [
    "data_ai",
    "platform_foundation",
    "regulated AI sandbox foundation",
    "Chief Data and AI Officer",
  ],
  [
    "data_ai",
    "data_readiness",
    "business glossary and value lineage cleanup",
    "Chief Data and AI Officer",
  ],
  [
    "clinical_epic",
    "ai_use_case",
    "clinical inbox summarization pilot",
    "CMIO",
  ],
  [
    "corporate_it",
    "ai_enabled_tool_rollout",
    "Workday finance close assistant expansion",
    "VP Controller",
  ],
  [
    "data_ai",
    "analytics_bi",
    "enterprise KPI semantic model",
    "Chief Data and AI Officer",
  ],
  [
    "security",
    "ai_assisted_automation",
    "security incident narrative assistant",
    "CISO",
  ],
  [
    "data_ai",
    "platform_foundation",
    "AI model registry foundation",
    "Chief Data and AI Officer",
  ],
  [
    "data_ai",
    "data_readiness",
    "contract and policy corpus normalization",
    "Chief Data and AI Officer",
  ],
  [
    "digital",
    "ai_use_case",
    "member service intent detection pilot",
    "SVP Member Services",
  ],
  [
    "apps",
    "ai_enabled_tool_rollout",
    "ServiceNow virtual agent expansion",
    "VP Enterprise Platforms",
  ],
  [
    "corporate_it",
    "analytics_bi",
    "monthly close dashboard refresh",
    "VP Controller",
  ],
  [
    "clinical_epic",
    "ai_assisted_automation",
    "clinical referral triage assistant",
    "CMIO",
  ],
  [
    "data_ai",
    "platform_foundation",
    "enterprise AI access management foundation",
    "Chief Data and AI Officer",
  ],
  [
    "data_ai",
    "data_readiness",
    "measurement baseline data product",
    "Chief Data and AI Officer",
  ],
  [
    "apps",
    "ai_use_case",
    "provider service request classification",
    "VP Provider Operations",
  ],
];

const toolCatalog = [
  [
    "TOOL-MER-000",
    "Enterprise AI platform",
    "Microsoft Azure / Databricks",
    "data_ai",
    "governed model build and serving foundation",
    520,
    54,
  ],
  [
    "TOOL-MER-001",
    "ServiceNow Now Assist",
    "ServiceNow",
    "apps",
    "case deflection and ticket resolution",
    5200,
    61,
  ],
  [
    "TOOL-MER-002",
    "Microsoft 365 Copilot",
    "Microsoft",
    "corporate_it",
    "knowledge worker productivity",
    8400,
    48,
  ],
  [
    "TOOL-MER-003",
    "GitHub Copilot",
    "Microsoft GitHub",
    "data_ai",
    "engineering productivity",
    1100,
    58,
  ],
  [
    "TOOL-MER-003A",
    "AI coding agents",
    "OpenAI / Anthropic / Microsoft GitHub",
    "architecture",
    "product engineering throughput and build-vs-buy leverage",
    680,
    52,
  ],
  [
    "TOOL-MER-004",
    "Workday AI",
    "Workday",
    "corporate_it",
    "finance and HR workflow assist",
    1400,
    43,
  ],
  [
    "TOOL-MER-005",
    "Epic clinical AI assist",
    "Epic",
    "clinical_epic",
    "clinical workflow summarization",
    2600,
    37,
  ],
  [
    "TOOL-MER-006",
    "Databricks Mosaic AI",
    "Databricks",
    "data_ai",
    "model serving and governed AI platform",
    420,
    54,
  ],
  [
    "TOOL-MER-007",
    "Power BI Copilot",
    "Microsoft",
    "data_ai",
    "self-service analytics assistance",
    2300,
    46,
  ],
  [
    "TOOL-MER-008",
    "Contact center agent assist",
    "Genesys",
    "digital",
    "member service call guidance",
    1800,
    52,
  ],
  [
    "TOOL-MER-009",
    "Prior auth document AI",
    "Internal build",
    "apps",
    "authorization document triage",
    620,
    29,
  ],
  [
    "TOOL-MER-010",
    "Security operations assistant",
    "Microsoft",
    "security",
    "SOC investigation summarization",
    260,
    41,
  ],
  [
    "TOOL-MER-011",
    "Digital front door AI decisioning",
    "Internal build",
    "digital",
    "personalized member navigation and offer selection",
    4100,
    45,
  ],
];

function money(n) {
  return Math.round(n);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function monthSequence(start, count) {
  const [year, month] = start.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(Date.UTC(year, month - 1 + index, 1));
    return d.toISOString().slice(0, 7);
  });
}

function domainLabel(key) {
  return budgetDomains.find(([domainKey]) => domainKey === key)?.[1] ?? key;
}

function classifyAi(value) {
  return [
    "ai_use_case",
    "ai_enabled_tool_rollout",
    "ai_assisted_automation",
    "platform_foundation",
    "data_readiness",
  ].includes(value);
}

function selectToolForProject(project) {
  const name = project.project_name.toLowerCase();
  const findTool = (toolName) =>
    toolCatalog.find((tool) => tool[1] === toolName);
  if (name.includes("servicenow")) return findTool("ServiceNow Now Assist");
  if (name.includes("service management"))
    return findTool("ServiceNow Now Assist");
  if (name.includes("workday")) return findTool("Workday AI");
  if (name.includes("copilot secure") || name.includes("productivity"))
    return findTool("Microsoft 365 Copilot");
  if (name.includes("github") || name.includes("engineering"))
    return findTool("AI coding agents");
  if (
    name.includes("epic") ||
    name.includes("clinical documentation") ||
    project.domain_key === "clinical_epic"
  )
    return findTool("Epic clinical AI assist");
  if (name.includes("contact center") || name.includes("member service"))
    return findTool("Contact center agent assist");
  if (
    name.includes("prior authorization") ||
    (name.includes("claims intake") && project.domain_key === "apps")
  )
    return findTool("Prior auth document AI");
  if (name.includes("provider service"))
    return findTool("ServiceNow Now Assist");
  if (name.includes("security operations") || project.domain_key === "security")
    return findTool("Security operations assistant");
  if (name.includes("digital front door") || name.includes("member mobile"))
    return findTool("Digital front door AI decisioning");
  if (
    project.project_classification === "platform_foundation" ||
    project.project_classification === "data_readiness" ||
    project.domain_key === "data_ai"
  ) {
    return findTool("Enterprise AI platform");
  }
  if (
    project.project_classification === "ai_enabled_tool_rollout" &&
    project.domain_key === "corporate_it"
  )
    return findTool("Microsoft 365 Copilot");
  if (
    project.project_classification === "ai_enabled_tool_rollout" &&
    project.domain_key === "apps"
  )
    return findTool("ServiceNow Now Assist");
  if (
    project.project_classification === "ai_assisted_automation" &&
    project.domain_key === "apps"
  )
    return findTool("Prior auth document AI");
  return findTool("Enterprise AI platform");
}

function valueModelForCase(project, index, noDirectRoi) {
  if (noDirectRoi) {
    return {
      business_value_type: "Foundation",
      business_value_story:
        "Required foundation for downstream AI value; do not count it as direct annual value until linked use cases prove benefit.",
      success_metric: "downstream value cases enabled",
      baseline_value: 0,
      target_value: 6 + (index % 5),
      metric_unit: "count",
      proof_needed:
        "Link this foundation to funded use cases that have measured outcomes.",
    };
  }

  const models = {
    product_delivery_efficiency: {
      business_value_type: "Build faster",
      metric: ["software delivery capex avoided", 18.4, 15.1, "usd_million"],
      story:
        "Coding agents reduce product-development effort, lower build CAPEX, and speed releases.",
      proof:
        "Compare delivery cost, cycle time, defects, and release volume before and after rollout.",
    },
    back_office_capex_reduction: {
      business_value_type: "Reduce cost",
      metric: ["manual review hours avoided", 1200, 620, "hours_per_month"],
      story:
        "AI reduces manual work in finance, claims, service, and back-office operations.",
      proof:
        "Show monthly hours avoided, work completed, error rate, and Finance-reviewed savings.",
    },
    clinical_capacity_growth: {
      business_value_type: "Create capacity",
      metric: ["clinical capacity released", 0, 4.8, "fte_equivalent"],
      story:
        "Clinical AI frees capacity by reducing documentation, triage, and access friction.",
      proof:
        "Show clinician time released, encounters supported, access improvement, and quality guardrails.",
    },
    member_and_revenue_growth: {
      business_value_type: "Grow revenue",
      metric: ["digital conversion lift", 0, 3.2, "percent"],
      story:
        "AI improves member experience, conversion, retention, and channel containment.",
      proof:
        "Show conversion, retention, channel shift, and net financial impact against baseline.",
    },
    operating_cost_takeout: {
      business_value_type: "Reduce cost",
      metric: ["cost per resolved service case", 41, 27, "usd"],
      story:
        "AI-assisted routing, resolution, and knowledge retrieval lower unit cost in high-volume queues.",
      proof:
        "Show unit cost, handle time, containment, quality, and Finance-reviewed savings.",
    },
  };
  const name = project.project_name.toLowerCase();
  const modelKey =
    name.includes("github") || name.includes("engineering")
      ? "product_delivery_efficiency"
      : name.includes("workday") ||
          name.includes("finance") ||
          name.includes("hr ") ||
          name.includes("claims") ||
          name.includes("prior authorization")
        ? "back_office_capex_reduction"
        : name.includes("epic") ||
            name.includes("clinical") ||
            name.includes("ambulatory") ||
            name.includes("referral")
          ? "clinical_capacity_growth"
          : name.includes("digital front door") ||
              name.includes("member mobile") ||
              name.includes("personalization")
            ? "member_and_revenue_growth"
            : name.includes("servicenow") ||
                name.includes("service management") ||
                name.includes("contact center") ||
                name.includes("member service") ||
                name.includes("provider service") ||
                project.domain_key === "security"
              ? "operating_cost_takeout"
              : "back_office_capex_reduction";
  const model = models[modelKey];
  return {
    business_value_type: model.business_value_type,
    business_value_story: model.story,
    success_metric: model.metric[0],
    baseline_value: model.metric[1],
    target_value: model.metric[2],
    metric_unit: model.metric[3],
    proof_needed: model.proof,
  };
}

function buildBudgetRows() {
  return budgetDomains.map(
    ([
      domain_key,
      domain_name,
      budget_owner_role,
      approved_budget_usd,
      run_ratio,
      change_ratio,
      transform_ratio,
      project_allocated_ratio,
    ]) => ({
      tenant_key: TENANT_KEY,
      fiscal_year: "FY26",
      domain_key,
      domain_name,
      it_segment: domain_name,
      budget_owner_role,
      approved_budget_usd,
      run_budget_usd: money(approved_budget_usd * run_ratio),
      change_budget_usd: money(approved_budget_usd * change_ratio),
      transform_budget_usd: money(approved_budget_usd * transform_ratio),
      capex_usd: money(
        approved_budget_usd * (domain_key === "infrastructure" ? 0.42 : 0.28),
      ),
      opex_usd: money(
        approved_budget_usd * (domain_key === "infrastructure" ? 0.58 : 0.72),
      ),
      tower_reviewed_project_budget_usd: money(
        approved_budget_usd * project_allocated_ratio,
      ),
      source_system: "IT Finance / FP&A",
      source_object: "FY26 IT budget by domain",
      source_record_id: `BUD-${domain_key}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      refresh_cadence: "monthly_close",
      quality_state: "synthetic_review_ready",
      synthetic_basis:
        "$20.4B health system revenue; IT budget modeled at 5.15% of revenue.",
    }),
  );
}

function buildProjectRows() {
  const rows = namedProjects.map((row, index) => {
    const [
      project_id,
      project_name,
      domain_key,
      project_classification,
      approved_budget_usd,
      promised_annual_value_usd,
      sponsor_role,
      committee_decision,
    ] = row;
    return {
      tenant_key: TENANT_KEY,
      project_id,
      project_name,
      domain_key,
      domain_name: domainLabel(domain_key),
      project_classification,
      is_ai_related: classifyAi(project_classification) ? "true" : "false",
      sponsor_role,
      technology_owner_role:
        domain_key === "clinical_epic"
          ? "CMIO"
          : domain_key === "security"
            ? "CISO"
            : "CTO delegate",
      finance_partner_role: "IT Finance Business Partner",
      approved_budget_usd,
      actual_spend_ytd_usd: money(
        approved_budget_usd * (0.18 + (index % 5) * 0.08),
      ),
      forecast_spend_usd: money(
        approved_budget_usd * (0.93 + (index % 4) * 0.035),
      ),
      promised_annual_value_usd,
      committee_decision,
      lifecycle_stage:
        index < 4 ? "build" : index < 10 ? "funded" : "business_case",
      start_date: `2026-${String((index % 6) + 1).padStart(2, "0")}-01`,
      target_go_live_date: `2027-${String((index % 9) + 1).padStart(2, "0")}-28`,
      realization_start_month:
        promised_annual_value_usd > 0
          ? `2027-${String(((index + 4) % 9) + 1).padStart(2, "0")}`
          : "",
      value_tracking_required: promised_annual_value_usd > 0 ? "true" : "false",
      source_system: "PMO / IT portfolio tracker",
      source_record_id: project_id,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      refresh_cadence: "monthly",
      quality_state: "synthetic_review_ready",
    };
  });

  const remainingCount = 140 - rows.length;
  const currentTotal = rows.reduce(
    (sum, row) => sum + row.approved_budget_usd,
    0,
  );
  const remainingTotal = TOWER_REVIEWED_PROJECT_USD - currentTotal;
  const weights = Array.from(
    { length: remainingCount },
    (_, index) => 1 + ((index * 7) % 13) / 10,
  );
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let allocated = 0;

  for (let index = 0; index < remainingCount; index += 1) {
    const ordinal = rows.length + 1;
    const isLast = index === remainingCount - 1;
    const amount = isLast
      ? remainingTotal - allocated
      : money((remainingTotal * weights[index]) / weightTotal);
    allocated += amount;
    const aiBlueprint = aiFillerBlueprints[index % aiFillerBlueprints.length];
    const domain =
      budgetDomains.find(([domainKey]) => domainKey === aiBlueprint[0]) ??
      budgetDomains[(index + 2) % budgetDomains.length];
    const domain_key =
      ordinal <= 52
        ? aiBlueprint[0]
        : budgetDomains[(index + 2) % budgetDomains.length][0];
    const domainForRow =
      budgetDomains.find(([domainKey]) => domainKey === domain_key) ?? domain;
    const classification =
      ordinal <= 52
        ? aiBlueprint[1]
        : [
            "ordinary_it_project",
            "clinical_epic",
            "infrastructure",
            "security",
            "mandatory_compliance",
          ][index % 5];
    const promised =
      classifyAi(classification) &&
      !["platform_foundation", "data_readiness"].includes(classification)
        ? money(amount * (1.35 + (index % 6) * 0.22))
        : 0;
    rows.push({
      tenant_key: TENANT_KEY,
      project_id: `PRJ-MER-${String(ordinal).padStart(3, "0")}`,
      project_name:
        ordinal <= 52
          ? `${aiBlueprint[2]} ${Math.floor(index / aiFillerBlueprints.length) + 1}`
          : `${domainForRow[1]} ${fillerNames[index % fillerNames.length]} wave ${Math.floor(index / fillerNames.length) + 1}`,
      domain_key,
      domain_name: domainForRow[1],
      project_classification: classification,
      is_ai_related: classifyAi(classification) ? "true" : "false",
      sponsor_role: ordinal <= 52 ? aiBlueprint[3] : domainForRow[2],
      technology_owner_role: domainForRow[2],
      finance_partner_role: "IT Finance Business Partner",
      approved_budget_usd: amount,
      actual_spend_ytd_usd: money(amount * (0.12 + (index % 7) * 0.07)),
      forecast_spend_usd: money(amount * (0.9 + (index % 5) * 0.025)),
      promised_annual_value_usd: promised,
      committee_decision:
        promised > amount * 1.4
          ? "fund"
          : promised > 0
            ? "challenge"
            : index % 8 === 0
              ? "defer"
              : "continue",
      lifecycle_stage: [
        "intake",
        "business_case",
        "funded",
        "build",
        "pilot",
        "scale",
      ][index % 6],
      start_date: `2026-${String((index % 9) + 1).padStart(2, "0")}-01`,
      target_go_live_date: `2027-${String((index % 10) + 1).padStart(2, "0")}-28`,
      realization_start_month:
        promised > 0
          ? `2027-${String(((index + 5) % 10) + 1).padStart(2, "0")}`
          : "",
      value_tracking_required: promised > 0 ? "true" : "false",
      source_system: "PMO / IT portfolio tracker",
      source_record_id: `PRJ-MER-${String(ordinal).padStart(3, "0")}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      refresh_cadence: "monthly",
      quality_state: "synthetic_review_ready",
    });
  }

  return rows;
}

function buildAiBusinessCases(projectRows) {
  const candidates = projectRows.filter((row) => row.is_ai_related === "true");
  const aiProjectBudget = projectRows
    .filter((row) => row.is_ai_related === "true")
    .reduce((sum, row) => sum + Number(row.approved_budget_usd), 0);
  const targetLowTotal = money(aiProjectBudget * TARGET_AI_PORTFOLIO_ROI_LOW);
  const targetHighTotal = money(aiProjectBudget * TARGET_AI_PORTFOLIO_ROI_HIGH);
  const baseCases = candidates.map((project, index) => {
    const noDirectRoi = ["platform_foundation", "data_readiness"].includes(
      project.project_classification,
    );
    const valueModel = valueModelForCase(project, index, noDirectRoi);
    const baseLow = noDirectRoi
      ? 0
      : money(project.approved_budget_usd * (4.0 + (index % 5) * 0.45));
    const baseHigh = noDirectRoi
      ? 0
      : money(baseLow * (1.18 + (index % 4) * 0.07));
    const tool = selectToolForProject(project);
    return {
      tenant_key: TENANT_KEY,
      business_case_id: `BC-MER-${String(index + 1).padStart(3, "0")}`,
      project_id: project.project_id,
      initiative_name: project.project_name,
      initiative_classification: project.project_classification,
      primary_tool_or_platform: tool[1],
      vendor_name: tool[2],
      domain_key: project.domain_key,
      business_value_type: valueModel.business_value_type,
      business_value_story: valueModel.business_value_story,
      cost_to_build_low_usd: money(project.approved_budget_usd * 0.82),
      cost_to_build_high_usd: money(project.approved_budget_usd * 1.12),
      projected_annual_value_low_usd: baseLow,
      projected_annual_value_high_usd: baseHigh,
      roi_low_multiple:
        baseLow > 0
          ? Math.round((baseLow / (project.approved_budget_usd || 1)) * 10) / 10
          : "",
      roi_high_multiple:
        baseHigh > 0
          ? Math.round((baseHigh / (project.approved_budget_usd || 1)) * 10) /
            10
          : "",
      payback_months_target:
        baseLow > 0
          ? Math.max(
              3,
              Math.round((project.approved_budget_usd / baseLow) * 12),
            )
          : "",
      benefit_realization_lag_months: [3, 6, 9, 12][index % 4],
      success_metric: valueModel.success_metric,
      baseline_value: valueModel.baseline_value,
      target_value: valueModel.target_value,
      metric_unit: valueModel.metric_unit,
      proof_needed: valueModel.proof_needed,
      business_sponsor_role: project.sponsor_role,
      finance_partner_role: project.finance_partner_role,
      finance_status: [
        "sponsor_claimed",
        "finance_challenged",
        "cfo_approved_target",
        "not_submitted",
        "finance_validated_actual",
      ][index % 5],
      cfo_approval_date: index % 5 === 2 ? "2026-08-15" : "",
      committee_decision: project.committee_decision,
      readiness_score: 42 + ((index * 11) % 49),
      confidence_level: ["low", "medium", "medium", "high"][index % 4],
      gating_constraint: [
        "baseline definition",
        "data quality",
        "workflow adoption",
        "control review",
        "Finance value treatment",
      ][index % 5],
      value_tracking_cadence: "monthly",
      source_system: "AI Portfolio and Business Case Tracker",
      source_record_id: `BC-MER-${String(index + 1).padStart(3, "0")}`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      quality_state: "synthetic_review_ready",
    };
  });
  const directCases = baseCases.filter(
    (row) => Number(row.projected_annual_value_low_usd) > 0,
  );
  const lowBaseTotal = directCases.reduce(
    (sum, row) => sum + Number(row.projected_annual_value_low_usd),
    0,
  );
  const highBaseTotal = directCases.reduce(
    (sum, row) => sum + Number(row.projected_annual_value_high_usd),
    0,
  );
  let lowAllocated = 0;
  let highAllocated = 0;
  for (const row of directCases) {
    const isLast = row === directCases[directCases.length - 1];
    const low = isLast
      ? targetLowTotal - lowAllocated
      : money(
          (Number(row.projected_annual_value_low_usd) * targetLowTotal) /
            lowBaseTotal,
        );
    const high = isLast
      ? targetHighTotal - highAllocated
      : money(
          (Number(row.projected_annual_value_high_usd) * targetHighTotal) /
            highBaseTotal,
        );
    lowAllocated += low;
    highAllocated += high;
    row.projected_annual_value_low_usd = low;
    row.projected_annual_value_high_usd = high;
    row.roi_low_multiple =
      Math.round((low / Number(row.cost_to_build_high_usd)) * 10) / 10;
    row.roi_high_multiple =
      Math.round((high / Number(row.cost_to_build_high_usd)) * 10) / 10;
    row.payback_months_target = Math.max(
      3,
      Math.round((Number(row.cost_to_build_high_usd) / low) * 12),
    );
  }
  return baseCases;
}

function buildToolRollouts(aiCases) {
  return toolCatalog.map((tool, index) => {
    const linked = aiCases.filter(
      (row) => row.primary_tool_or_platform === tool[1],
    );
    const targetUsers = tool[5];
    const actualPct = tool[6] - (index % 3) * 8;
    return {
      tenant_key: TENANT_KEY,
      tool_rollout_id: tool[0],
      tool_name: tool[1],
      vendor_name: tool[2],
      domain_key: tool[3],
      rollout_goal: tool[4],
      linked_business_case_count: linked.length,
      rollout_target_users: targetUsers,
      enabled_users: money(targetUsers * (0.45 + (index % 4) * 0.1)),
      monthly_active_users: money(targetUsers * (actualPct / 100)),
      adoption_target_pct: tool[6],
      adoption_actual_pct: actualPct,
      rollout_stage: ["pilot", "funded", "scale", "controlled_rollout"][
        index % 4
      ],
      control_blocker: [
        "DLP policy",
        "workflow telemetry",
        "clinical safety review",
        "SOX evidence",
        "none",
      ][index % 5],
      business_owner_role:
        linked[0]?.business_sponsor_role ?? "AI Portfolio Operations Lead",
      finance_partner_role:
        linked[0]?.finance_partner_role ?? "IT Finance Business Partner",
      source_system:
        index === 1
          ? "Microsoft Entra ID and Microsoft 365 Admin Center"
          : "AI Portfolio and Business Case Tracker",
      source_record_id: tool[0],
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      refresh_cadence: "monthly",
      quality_state: "synthetic_review_ready",
    };
  });
}

function buildMonthlyValue(aiCases) {
  const months = monthSequence("2025-09", 12);
  return aiCases.flatMap((item, caseIndex) => {
    const low = Number(item.projected_annual_value_low_usd || 0);
    return months.map((month, monthIndex) => {
      const ramp = Math.max(0, Math.min(1, (monthIndex - (caseIndex % 4)) / 8));
      const sponsorClaimed = money((low / 12) * ramp);
      const financeReviewed = money(
        sponsorClaimed * (0.62 + (caseIndex % 3) * 0.08),
      );
      const financeValidated =
        item.finance_status === "finance_validated_actual"
          ? money(financeReviewed * 0.85)
          : 0;
      return {
        tenant_key: TENANT_KEY,
        observation_id: `VAL-${item.business_case_id}-${month}`,
        business_case_id: item.business_case_id,
        project_id: item.project_id,
        reporting_month: month,
        baseline_value: item.baseline_value,
        target_value: item.target_value,
        actual_value: money(
          Number(item.baseline_value || 0) +
            (Number(item.target_value || 0) -
              Number(item.baseline_value || 0)) *
              ramp *
              0.72,
        ),
        metric_unit: item.metric_unit,
        sponsor_claimed_value_usd: sponsorClaimed,
        finance_reviewed_value_usd: financeReviewed,
        finance_validated_value_usd: financeValidated,
        board_claimable_value_usd:
          item.finance_status === "finance_validated_actual"
            ? financeValidated
            : 0,
        validation_state:
          financeValidated > 0
            ? "finance_validated_actual"
            : sponsorClaimed > 0
              ? "sponsor_claimed"
              : "not_yet_measurable",
        evidence_id: `EVID-${item.business_case_id}-${month}`,
        reviewer_role: financeValidated > 0 ? item.finance_partner_role : "",
        source_system: "AI Portfolio and Business Case Tracker",
        source_record_id: `VAL-${item.business_case_id}-${month}`,
        extract_date: EXTRACT_DATE,
        as_of_date: AS_OF_DATE,
        refresh_cadence: "monthly",
        quality_state: "synthetic_review_ready",
      };
    });
  });
}

function buildFinanceLedger(aiCases) {
  return aiCases.flatMap((item, index) => [
    {
      tenant_key: TENANT_KEY,
      approval_event_id: `FIN-${item.business_case_id}-SPONSOR`,
      business_case_id: item.business_case_id,
      project_id: item.project_id,
      event_type: "sponsor_claim",
      approval_state: "sponsor_claimed",
      approver_role: item.business_sponsor_role,
      event_date: "2026-06-15",
      amount_usd: item.projected_annual_value_high_usd,
      amount_basis: "projected_annual_value_high",
      notes: "Sponsor-projected value; not Finance validated.",
      source_system: "AI Portfolio and Business Case Tracker",
      source_record_id: `FIN-${item.business_case_id}-SPONSOR`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      quality_state: "synthetic_review_ready",
    },
    {
      tenant_key: TENANT_KEY,
      approval_event_id: `FIN-${item.business_case_id}-FINANCE`,
      business_case_id: item.business_case_id,
      project_id: item.project_id,
      event_type: index % 5 === 4 ? "actual_validation" : "target_review",
      approval_state: item.finance_status,
      approver_role: item.finance_partner_role,
      event_date: index % 5 === 2 ? "2026-08-15" : "2026-08-01",
      amount_usd:
        index % 5 === 4
          ? money(Number(item.projected_annual_value_low_usd) * 0.38)
          : item.projected_annual_value_low_usd,
      amount_basis:
        index % 5 === 4
          ? "finance_validated_actual_ytd"
          : "projected_annual_value_low",
      notes:
        "Finance state captured separately from sponsor claim and refreshed monthly.",
      source_system: "Finance approval ledger",
      source_record_id: `FIN-${item.business_case_id}-FINANCE`,
      extract_date: EXTRACT_DATE,
      as_of_date: AS_OF_DATE,
      quality_state: "synthetic_review_ready",
    },
  ]);
}

function buildEvidence(projectRows, aiCases, monthlyRows) {
  const projectEvidence = projectRows.slice(0, 70).map((project, index) => ({
    tenant_key: TENANT_KEY,
    evidence_id: `EVID-PRJ-${String(index + 1).padStart(3, "0")}`,
    related_object_type: "project",
    related_object_id: project.project_id,
    evidence_type: "portfolio_record",
    evidence_name: `${project.project_name} portfolio approval record`,
    source_system: "PMO / IT portfolio tracker",
    source_record_id: project.project_id,
    evidence_date: EXTRACT_DATE,
    owner_role: project.sponsor_role,
    freshness_state: "current",
    confidence: "medium",
    quality_state: "synthetic_review_ready",
  }));
  const caseEvidence = aiCases.map((item, index) => ({
    tenant_key: TENANT_KEY,
    evidence_id: `EVID-BC-${String(index + 1).padStart(3, "0")}`,
    related_object_type: "business_case",
    related_object_id: item.business_case_id,
    evidence_type: "business_case_workbook",
    evidence_name: `${item.initiative_name} business case`,
    source_system: "AI Portfolio and Business Case Tracker",
    source_record_id: item.business_case_id,
    evidence_date: EXTRACT_DATE,
    owner_role: item.business_sponsor_role,
    freshness_state: "current",
    confidence: item.confidence_level,
    quality_state: "synthetic_review_ready",
  }));
  const monthlyEvidence = monthlyRows
    .filter((_, index) => index % 6 === 0)
    .map((row) => ({
      tenant_key: TENANT_KEY,
      evidence_id: row.evidence_id,
      related_object_type: "monthly_value_observation",
      related_object_id: row.observation_id,
      evidence_type:
        row.finance_validated_value_usd > 0
          ? "finance_validation"
          : "monthly_metric_extract",
      evidence_name: `${row.business_case_id} ${row.reporting_month} value tracking`,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      evidence_date: `${row.reporting_month}-28`,
      owner_role: row.reviewer_role || "AI Portfolio Operations Lead",
      freshness_state: "current",
      confidence: row.finance_validated_value_usd > 0 ? "high" : "medium",
      quality_state: "synthetic_review_ready",
    }));
  return [...projectEvidence, ...caseEvidence, ...monthlyEvidence];
}

function buildAdapterArtifacts(sources) {
  const sourceFiles = [
    ["20_it_budget_by_domain.csv", "budget_domain", "Budget"],
    ["21_it_project_portfolio.csv", "it_project", "Project"],
    ["22_ai_business_cases.csv", "ai_business_case", "AIUseCase"],
    ["23_ai_tool_rollout.csv", "tool_rollout", "Tool"],
    ["24_monthly_value_tracking.csv", "monthly_value", "MetricObservation"],
    ["25_finance_approval_ledger.csv", "finance_approval", "ApprovalEvent"],
    ["26_evidence_register.csv", "evidence", "Evidence"],
  ];
  const adapterRuns = sourceFiles.map(([file, adapter_id, object_type]) => ({
    tenant_key: TENANT_KEY,
    adapter_id: `meridian_${adapter_id}_adapter`,
    source_file: file,
    emitted_object_type: object_type,
    run_id: LOAD_RUN_ID,
    run_status: "synthetic_offline_pass",
    lineage_status: "preserved",
    no_runtime_load: "true",
    extract_date: EXTRACT_DATE,
    as_of_date: AS_OF_DATE,
  }));
  const emittedObjects = [
    ...sources.budgetRows.map((row, index) => ({
      adapter_id: "meridian_budget_domain_adapter",
      canonical_object_type: "Budget",
      canonical_object_id: `BUDGET:${row.domain_key}:FY26`,
      source_file: "20_it_budget_by_domain.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
    ...sources.projectRows.map((row, index) => ({
      adapter_id: "meridian_it_project_adapter",
      canonical_object_type: "Project",
      canonical_object_id: `PROJECT:${row.project_id}`,
      source_file: "21_it_project_portfolio.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
    ...sources.aiCases.map((row, index) => ({
      adapter_id: "meridian_ai_business_case_adapter",
      canonical_object_type: "AIUseCase",
      canonical_object_id: `AI_USE_CASE:${row.business_case_id}`,
      source_file: "22_ai_business_cases.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
    ...sources.toolRollouts.map((row, index) => ({
      adapter_id: "meridian_tool_rollout_adapter",
      canonical_object_type: "Tool",
      canonical_object_id: `TOOL:${row.tool_rollout_id}`,
      source_file: "23_ai_tool_rollout.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
    ...sources.monthlyValue.map((row, index) => ({
      adapter_id: "meridian_monthly_value_adapter",
      canonical_object_type: "MetricObservation",
      canonical_object_id: `VALUE_OBSERVATION:${row.observation_id}`,
      source_file: "24_monthly_value_tracking.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
    ...sources.financeLedger.map((row, index) => ({
      adapter_id: "meridian_finance_approval_adapter",
      canonical_object_type: "ApprovalEvent",
      canonical_object_id: `APPROVAL:${row.approval_event_id}`,
      source_file: "25_finance_approval_ledger.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
    ...sources.evidence.map((row, index) => ({
      adapter_id: "meridian_evidence_adapter",
      canonical_object_type: "Evidence",
      canonical_object_id: `EVIDENCE:${row.evidence_id}`,
      source_file: "26_evidence_register.csv",
      source_row: index + 2,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      lineage_status: "preserved",
    })),
  ].map((row) => ({
    tenant_key: TENANT_KEY,
    ...row,
    extract_date: EXTRACT_DATE,
    as_of_date: AS_OF_DATE,
  }));
  return { adapterRuns, emittedObjects };
}

function buildCanonicalArtifacts(sources) {
  const projectById = new Map(
    sources.projectRows.map((row) => [row.project_id, row]),
  );
  const toolByName = new Map(
    sources.toolRollouts.map((row) => [row.tool_name, row]),
  );
  const canonicalBudgets = sources.budgetRows.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_budget_id: `BUDGET:${row.domain_key}:FY26`,
    fiscal_year: row.fiscal_year,
    domain_key: row.domain_key,
    domain_name: row.domain_name,
    budget_owner_role: row.budget_owner_role,
    approved_budget_usd: row.approved_budget_usd,
    tower_reviewed_project_budget_usd: row.tower_reviewed_project_budget_usd,
    source_file: "20_it_budget_by_domain.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalProjects = sources.projectRows.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_project_id: `PROJECT:${row.project_id}`,
    project_id: row.project_id,
    project_name: row.project_name,
    domain_key: row.domain_key,
    domain_name: row.domain_name,
    project_classification: row.project_classification,
    is_ai_related: row.is_ai_related,
    approved_budget_usd: row.approved_budget_usd,
    projected_annual_value_low_usd: row.promised_annual_value_usd,
    lifecycle_stage: row.lifecycle_stage,
    committee_decision: row.committee_decision,
    sponsor_role: row.sponsor_role,
    finance_partner_role: row.finance_partner_role,
    source_file: "21_it_project_portfolio.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalCases = sources.aiCases.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_ai_use_case_id: `AI_USE_CASE:${row.business_case_id}`,
    business_case_id: row.business_case_id,
    project_id: row.project_id,
    initiative_name: row.initiative_name,
    domain_key: row.domain_key,
    business_value_type: row.business_value_type,
    primary_tool_or_platform: row.primary_tool_or_platform,
    projected_annual_value_low_usd: row.projected_annual_value_low_usd,
    projected_annual_value_high_usd: row.projected_annual_value_high_usd,
    roi_low_multiple: row.roi_low_multiple,
    roi_high_multiple: row.roi_high_multiple,
    payback_months_target: row.payback_months_target,
    success_metric: row.success_metric,
    proof_needed: row.proof_needed,
    finance_status: row.finance_status,
    readiness_score: row.readiness_score,
    confidence_level: row.confidence_level,
    // Carried because products reason about them, not merely display them: gating_constraint is
    // what actually separates a validated case from a blocked one, and the cost-to-build band is
    // the only spend figure a case carries before a project budget is approved against it.
    gating_constraint: row.gating_constraint,
    cost_to_build_low_usd: row.cost_to_build_low_usd,
    cost_to_build_high_usd: row.cost_to_build_high_usd,
    business_sponsor_role: row.business_sponsor_role,
    source_file: "22_ai_business_cases.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalTools = sources.toolRollouts.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_tool_id: `TOOL:${row.tool_rollout_id}`,
    tool_rollout_id: row.tool_rollout_id,
    tool_name: row.tool_name,
    vendor_name: row.vendor_name,
    domain_key: row.domain_key,
    rollout_goal: row.rollout_goal,
    linked_business_case_count: row.linked_business_case_count,
    rollout_target_users: row.rollout_target_users,
    monthly_active_users: row.monthly_active_users,
    adoption_target_pct: row.adoption_target_pct,
    adoption_actual_pct: row.adoption_actual_pct,
    rollout_stage: row.rollout_stage,
    // The named reason a rollout cannot progress. Without it a tool reads as merely under-adopted
    // when the actual obstacle is a control review nobody has scheduled.
    control_blocker: row.control_blocker,
    business_owner_role: row.business_owner_role,
    source_file: "23_ai_tool_rollout.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalMonthlyValues = sources.monthlyValue.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_value_observation_id: `VALUE_OBSERVATION:${row.observation_id}`,
    business_case_id: row.business_case_id,
    project_id: row.project_id,
    reporting_month: row.reporting_month,
    success_metric: projectById.has(row.project_id)
      ? sources.aiCases.find(
          (item) => item.business_case_id === row.business_case_id,
        )?.success_metric
      : "",
    sponsor_claimed_value_usd: row.sponsor_claimed_value_usd,
    finance_reviewed_value_usd: row.finance_reviewed_value_usd,
    finance_validated_value_usd: row.finance_validated_value_usd,
    board_claimable_value_usd: row.board_claimable_value_usd,
    validation_state: row.validation_state,
    source_file: "24_monthly_value_tracking.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalFinanceEvents = sources.financeLedger.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_approval_event_id: `APPROVAL:${row.approval_event_id}`,
    business_case_id: row.business_case_id,
    project_id: row.project_id,
    event_type: row.event_type,
    approval_state: row.approval_state,
    approver_role: row.approver_role,
    event_date: row.event_date,
    amount_usd: row.amount_usd,
    amount_basis: row.amount_basis,
    notes: row.notes,
    source_file: "25_finance_approval_ledger.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalEvidence = sources.evidence.map((row, index) => ({
    tenant_key: TENANT_KEY,
    canonical_evidence_id: `EVIDENCE:${row.evidence_id}`,
    evidence_id: row.evidence_id,
    related_object_type: row.related_object_type,
    related_object_id: row.related_object_id,
    evidence_type: row.evidence_type,
    evidence_name: row.evidence_name,
    owner_role: row.owner_role,
    freshness_state: row.freshness_state,
    confidence: row.confidence,
    source_file: "26_evidence_register.csv",
    source_row: index + 2,
    source_system: row.source_system,
    source_record_id: row.source_record_id,
    as_of_date: AS_OF_DATE,
  }));
  const canonicalRelationships = [
    ...sources.aiCases.map((row) => ({
      tenant_key: TENANT_KEY,
      from_object_type: "Project",
      from_object_id: `PROJECT:${row.project_id}`,
      relationship_type: "implements",
      to_object_type: "AIUseCase",
      to_object_id: `AI_USE_CASE:${row.business_case_id}`,
      source_file: "22_ai_business_cases.csv",
      source_record_id: row.source_record_id,
    })),
    ...sources.aiCases.map((row) => ({
      tenant_key: TENANT_KEY,
      from_object_type: "Tool",
      from_object_id: `TOOL:${toolByName.get(row.primary_tool_or_platform)?.tool_rollout_id}`,
      relationship_type: "supports",
      to_object_type: "AIUseCase",
      to_object_id: `AI_USE_CASE:${row.business_case_id}`,
      source_file: "22_ai_business_cases.csv",
      source_record_id: row.source_record_id,
    })),
    ...sources.evidence.map((row) => ({
      tenant_key: TENANT_KEY,
      from_object_type: "Evidence",
      from_object_id: `EVIDENCE:${row.evidence_id}`,
      relationship_type: "supports",
      to_object_type: row.related_object_type,
      to_object_id: row.related_object_id,
      source_file: "26_evidence_register.csv",
      source_record_id: row.source_record_id,
    })),
  ].map((row) => ({
    ...row,
    as_of_date: AS_OF_DATE,
    quality_state: "synthetic_review_ready",
  }));
  return {
    canonicalBudgets,
    canonicalProjects,
    canonicalCases,
    canonicalTools,
    canonicalMonthlyValues,
    canonicalFinanceEvents,
    canonicalEvidence,
    canonicalRelationships,
  };
}

function aggregate(rows, keyFn, seedFn, addFn) {
  const buckets = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!buckets.has(key)) buckets.set(key, seedFn(row));
    addFn(buckets.get(key), row);
  }
  return [...buckets.values()];
}

function buildCubeArtifacts(sources) {
  const projectById = new Map(
    sources.projectRows.map((row) => [row.project_id, row]),
  );
  const monthlyByCase = aggregate(
    sources.monthlyValue,
    (row) => row.business_case_id,
    (row) => ({
      business_case_id: row.business_case_id,
      board_claimable_ytd_usd: 0,
      finance_validated_ytd_usd: 0,
    }),
    (bucket, row) => {
      bucket.board_claimable_ytd_usd += Number(row.board_claimable_value_usd);
      bucket.finance_validated_ytd_usd += Number(
        row.finance_validated_value_usd,
      );
    },
  );
  const monthlyMap = new Map(
    monthlyByCase.map((row) => [row.business_case_id, row]),
  );
  const caseRows = sources.aiCases.map((row) => {
    const project = projectById.get(row.project_id);
    const monthly = monthlyMap.get(row.business_case_id) ?? {
      board_claimable_ytd_usd: 0,
      finance_validated_ytd_usd: 0,
    };
    return {
      tenant_key: TENANT_KEY,
      as_of_date: AS_OF_DATE,
      business_case_id: row.business_case_id,
      project_id: row.project_id,
      initiative_name: row.initiative_name,
      domain_name: project?.domain_name ?? row.domain_key,
      business_value_type: row.business_value_type,
      finance_status: row.finance_status,
      committee_decision: row.committee_decision,
      approved_investment_usd: project?.approved_budget_usd ?? 0,
      projected_annual_value_low_usd: row.projected_annual_value_low_usd,
      projected_annual_value_high_usd: row.projected_annual_value_high_usd,
      board_claimable_ytd_usd: monthly.board_claimable_ytd_usd,
      finance_validated_ytd_usd: monthly.finance_validated_ytd_usd,
      roi_low_multiple: row.roi_low_multiple,
      roi_high_multiple: row.roi_high_multiple,
      readiness_score: row.readiness_score,
      source_object_id: `AI_USE_CASE:${row.business_case_id}`,
    };
  });
  const portfolioCube = aggregate(
    caseRows,
    (row) =>
      `${row.domain_name}|${row.business_value_type}|${row.finance_status}`,
    (row) => ({
      tenant_key: TENANT_KEY,
      as_of_date: AS_OF_DATE,
      domain_name: row.domain_name,
      business_value_type: row.business_value_type,
      finance_status: row.finance_status,
      business_case_count: 0,
      approved_investment_usd: 0,
      projected_annual_value_low_usd: 0,
      projected_annual_value_high_usd: 0,
      board_claimable_ytd_usd: 0,
      finance_validated_ytd_usd: 0,
    }),
    (bucket, row) => {
      bucket.business_case_count += 1;
      bucket.approved_investment_usd += Number(row.approved_investment_usd);
      bucket.projected_annual_value_low_usd += Number(
        row.projected_annual_value_low_usd,
      );
      bucket.projected_annual_value_high_usd += Number(
        row.projected_annual_value_high_usd,
      );
      bucket.board_claimable_ytd_usd += Number(row.board_claimable_ytd_usd);
      bucket.finance_validated_ytd_usd += Number(row.finance_validated_ytd_usd);
    },
  ).map((row) => ({
    ...row,
    roi_low_multiple:
      row.approved_investment_usd > 0
        ? Math.round(
            (row.projected_annual_value_low_usd / row.approved_investment_usd) *
              10,
          ) / 10
        : "",
    roi_high_multiple:
      row.approved_investment_usd > 0
        ? Math.round(
            (row.projected_annual_value_high_usd /
              row.approved_investment_usd) *
              10,
          ) / 10
        : "",
  }));
  const cubeMeasures = [
    ["approved_investment_usd", "yes", "IT Finance"],
    ["projected_annual_value_low_usd", "yes", "business sponsor"],
    ["projected_annual_value_high_usd", "yes", "business sponsor"],
    ["finance_validated_ytd_usd", "yes_by_month", "Finance"],
    ["board_claimable_ytd_usd", "yes_by_month", "Finance"],
    ["roi_low_multiple", "derived_ratio", "deterministic cube"],
    ["roi_high_multiple", "derived_ratio", "deterministic cube"],
  ].map(([measure_name, additive, owner]) => ({
    measure_name,
    additive,
    owner,
  }));
  const cubeDimensions = [
    ["domain_name", "IT/business ownership"],
    ["business_value_type", "plain value type"],
    ["finance_status", "current Finance status"],
    ["committee_decision", "committee disposition"],
    ["primary_tool_or_platform", "tool or platform"],
  ].map(([dimension_name, purpose]) => ({ dimension_name, purpose }));
  const cubeGateFlags = [
    [
      "finance_validated_required",
      "Value is not board-claimable until Finance validates actuals.",
    ],
    [
      "foundation_not_direct_roi",
      "Foundation rows must not carry direct projected annual value.",
    ],
    [
      "ai_classification_explicit",
      "AI status comes from project classification, not folder or BI label.",
    ],
    [
      "roi_floor_required",
      "Direct-value AI cases must clear the 3x low-case ROI floor.",
    ],
  ].map(([gate_name, rule]) => ({ gate_name, rule }));
  return {
    caseRows,
    portfolioCube,
    cubeMeasures,
    cubeDimensions,
    cubeGateFlags,
  };
}

function buildReadModels(sources, cube) {
  const aiInvestment = sources.projectRows
    .filter((row) => row.is_ai_related === "true")
    .reduce((sum, row) => sum + Number(row.approved_budget_usd), 0);
  const projectedLow = sources.aiCases.reduce(
    (sum, row) => sum + Number(row.projected_annual_value_low_usd),
    0,
  );
  const projectedHigh = sources.aiCases.reduce(
    (sum, row) => sum + Number(row.projected_annual_value_high_usd),
    0,
  );
  const boardClaimable = sources.monthlyValue.reduce(
    (sum, row) => sum + Number(row.board_claimable_value_usd),
    0,
  );
  const executiveSummary = [
    {
      tenant_key: TENANT_KEY,
      as_of_date: AS_OF_DATE,
      total_it_budget_usd: TOTAL_IT_BUDGET_USD,
      reviewed_project_budget_usd: TOWER_REVIEWED_PROJECT_USD,
      ai_related_investment_usd: aiInvestment,
      projected_annual_value_low_usd: projectedLow,
      projected_annual_value_high_usd: projectedHigh,
      portfolio_roi_low_multiple:
        Math.round((projectedLow / aiInvestment) * 10) / 10,
      portfolio_roi_high_multiple:
        Math.round((projectedHigh / aiInvestment) * 10) / 10,
      board_claimable_ytd_usd: boardClaimable,
      business_case_count: sources.aiCases.length,
      tool_rollout_count: sources.toolRollouts.length,
      headline:
        "AI value is a 3x-4x portfolio bet; only Finance-validated actuals are board-claimable.",
    },
  ];
  const initiativeTable = cube.caseRows.map((row) => ({
    tenant_key: TENANT_KEY,
    business_case_id: row.business_case_id,
    initiative_name: row.initiative_name,
    domain_name: row.domain_name,
    business_value_type: row.business_value_type,
    approved_investment_usd: row.approved_investment_usd,
    projected_annual_value_low_usd: row.projected_annual_value_low_usd,
    projected_annual_value_high_usd: row.projected_annual_value_high_usd,
    roi_low_multiple: row.roi_low_multiple,
    finance_status: row.finance_status,
    committee_decision: row.committee_decision,
    board_claimable_ytd_usd: row.board_claimable_ytd_usd,
  }));
  const toolTable = sources.toolRollouts.map((row) => ({
    tenant_key: TENANT_KEY,
    tool_name: row.tool_name,
    vendor_name: row.vendor_name,
    rollout_goal: row.rollout_goal,
    linked_business_case_count: row.linked_business_case_count,
    rollout_target_users: row.rollout_target_users,
    monthly_active_users: row.monthly_active_users,
    adoption_target_pct: row.adoption_target_pct,
    adoption_actual_pct: row.adoption_actual_pct,
    rollout_stage: row.rollout_stage,
  }));
  const proofQueue = sources.aiCases
    .filter((row) => row.finance_status !== "finance_validated_actual")
    .map((row) => ({
      tenant_key: TENANT_KEY,
      business_case_id: row.business_case_id,
      initiative_name: row.initiative_name,
      business_value_type: row.business_value_type,
      projected_annual_value_low_usd: row.projected_annual_value_low_usd,
      finance_status: row.finance_status,
      proof_needed: row.proof_needed,
      next_action:
        row.business_value_type === "Foundation"
          ? "Link to funded use cases with measured outcomes."
          : "Capture monthly actuals and request Finance validation.",
    }));
  return { executiveSummary, initiativeTable, toolTable, proofQueue };
}

function formatUsdMillions(value) {
  if (value >= 1_000_000_000) {
    return `$${Math.round((value / 1_000_000_000) * 100) / 100}B`;
  }
  return `$${(Math.round(value / 100_000) / 10).toFixed(1)}M`;
}

function formatMultiple(value) {
  return `${(Math.round(value * 10) / 10).toFixed(1)}x`;
}

function countBy(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const key = String(row[field] ?? "").trim() || "(blank)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function orderedCounts(rows, field, preferredOrder) {
  const counts = new Map(countBy(rows, field));
  return [
    ...preferredOrder.filter((key) => counts.has(key)).map((key) => [key, counts.get(key)]),
    ...[...counts.entries()].filter(([key]) => !preferredOrder.includes(key)),
  ];
}

function buildLayer1Signoff({ budgetRows, projectRows, aiCases, toolRollouts, monthlyValue, financeLedger, evidence }) {
  const totalItBudget = budgetRows.reduce((sum, row) => sum + Number(row.approved_budget_usd), 0);
  const reviewedProjectBudget = projectRows.reduce((sum, row) => sum + Number(row.approved_budget_usd), 0);
  const aiProjects = projectRows.filter((row) => row.is_ai_related === "true");
  const aiInvestment = aiProjects.reduce((sum, row) => sum + Number(row.approved_budget_usd), 0);
  const projectedLow = aiCases.reduce((sum, row) => sum + Number(row.projected_annual_value_low_usd || 0), 0);
  const projectedHigh = aiCases.reduce((sum, row) => sum + Number(row.projected_annual_value_high_usd || 0), 0);
  const boardClaimable = monthlyValue.reduce((sum, row) => sum + Number(row.board_claimable_value_usd || 0), 0);
  const directValueCases = aiCases.filter((row) => Number(row.projected_annual_value_low_usd || 0) > 0);
  const foundationCases = aiCases.length - directValueCases.length;
  const topProjects = [...projectRows]
    .sort((a, b) => Number(b.approved_budget_usd) - Number(a.approved_budget_usd))
    .slice(0, 10);
  const valueTypeRows = orderedCounts(aiCases, "business_value_type", [
    "Reduce cost",
    "Create capacity",
    "Grow revenue",
    "Build faster",
    "Foundation",
  ]).map(([valueType, count]) => {
    const rows = aiCases.filter((row) => row.business_value_type === valueType);
    const highBuild = rows.reduce((sum, row) => sum + Number(row.cost_to_build_high_usd || 0), 0);
    const lowValue = rows.reduce((sum, row) => sum + Number(row.projected_annual_value_low_usd || 0), 0);
    const highValue = rows.reduce((sum, row) => sum + Number(row.projected_annual_value_high_usd || 0), 0);
    return `| ${valueType} | ${count} | \`${formatUsdMillions(highBuild)}\` | \`${formatUsdMillions(lowValue)}-${formatUsdMillions(highValue)}\` |`;
  });
  const financeRows = orderedCounts(financeLedger, "approval_state", [
    "sponsor_claimed",
    "finance_challenged",
    "cfo_approved_target",
    "not_submitted",
    "finance_validated_actual",
  ]).map(
    ([state, count]) => `| ${state} | ${count} |`,
  );

  return `# Meridian Tower Synthetic Source Data - Layer 1 Signoff

Package: \`tower-layer1-v2026-08-business-case\`
Tenant key: \`meridian-health\`
Status: synthetic review package only; not loaded to runtime
As of: ${AS_OF_DATE}

## Layer 1 Purpose

Layer 1 represents what Meridian would provide or maintain as client-owned source inputs. It is organized by data owner and business workflow, not by Tower screens or internal canonical tables.

The source layer answers five simple executive questions:

1. What is the overall IT budget?
2. Which approved projects are under review?
3. Which projects are explicitly AI or AI-enabled?
4. What value did the sponsor project, and what proof is needed?
5. What has Finance reviewed, approved, validated, or rejected?

## Included Source Files

| File | Owner | Purpose | Refresh |
| --- | --- | --- | --- |
| \`20_it_budget_by_domain.csv\` | IT Finance / FP&A | Total IT budget by function/domain | Monthly close |
| \`21_it_project_portfolio.csv\` | PMO | Approved IT project portfolio, including AI flags | Monthly |
| \`22_ai_business_cases.csv\` | Business sponsors + Finance | One business case per explicit AI / AI-enabled project | Monthly |
| \`23_ai_tool_rollout.csv\` | Platform administrators | Tool rollout goals, target users, enabled users, active users | Monthly |
| \`24_monthly_value_tracking.csv\` | Business sponsors + Finance | Sponsor, Finance, and board-claimable value tracking | Monthly |
| \`25_finance_approval_ledger.csv\` | Finance | Sponsor claims, CFO target approvals, challenges, and actual validation events | Monthly |
| \`26_evidence_register.csv\` | Initiative owners | Source evidence tied to projects, business cases, value observations, and finance events | Monthly |

## Source-Layer Economics

| Measure | Value | Source-layer meaning |
| --- | ---: | --- |
| Total IT budget | \`${formatUsdMillions(totalItBudget)}\` | Full IT budget context for a Meridian-scale organization |
| Reviewed IT project portfolio | \`${formatUsdMillions(reviewedProjectBudget)}\` | Approved project portfolio in Tower scope |
| Explicit AI / AI-enabled investment | \`${formatUsdMillions(aiInvestment)}\` | Subset of reviewed portfolio where \`is_ai_related=true\` |
| Projected annual AI value, low case | \`${formatUsdMillions(projectedLow)}\` | Sponsor-projected annual value after business-case challenge |
| Projected annual AI value, high case | \`${formatUsdMillions(projectedHigh)}\` | Upper planning case; not board-claimable without evidence |
| AI portfolio ROI range | \`${formatMultiple(projectedLow / aiInvestment)}-${formatMultiple(projectedHigh / aiInvestment)}\` | Projected annual value divided by explicit AI / AI-enabled investment |
| Board-claimable value YTD | \`${formatUsdMillions(boardClaimable)}\` | Finance-validated value released by the monthly workflow |

| Source population | Rows | What it controls |
| --- | ---: | --- |
| IT budget domains | ${budgetRows.length} | Full IT budget context |
| Reviewed IT projects | ${projectRows.length} | Approved work in Tower scope |
| AI business cases | ${aiCases.length} | One case per explicit AI / AI-enabled project |
| Direct-value AI cases | ${directValueCases.length} | Cases with projected annual value and ROI |
| Foundation / readiness AI cases | ${foundationCases} | Enablement work without standalone ROI |
| Tool rollouts | ${toolRollouts.length} | Adoption goals and active usage by tool |
| Monthly value observations | ${monthlyValue.length} | Refreshable value-tracking rows |
| Finance approval events | ${financeLedger.length} | Ongoing CFO / Finance review states |
| Evidence rows | ${evidence.length} | Proof tied to source objects and monthly observations |

These measures must remain separate:

- Approved spend is not value.
- Projected value is not Finance-validated actual value.
- Finance-validated actual value is not automatically board-claimable.
- Foundation work carries no direct ROI until linked downstream use cases prove value.

## Top Investment Reality Check

The top 10 approved projects are intentionally not all AI. This preserves the executive question a CFO would ask: where does AI sit inside the broader IT portfolio?

| Rank | Project | Domain | Classification | AI-related | Approved budget |
| ---: | --- | --- | --- | --- | ---: |
${topProjects
  .map(
    (row, index) =>
      `| ${index + 1} | ${row.project_name} | ${row.domain_name} | ${row.project_classification} | ${row.is_ai_related} | \`${formatUsdMillions(Number(row.approved_budget_usd))}\` |`,
  )
  .join("\n")}

## Business Case Simplicity

Every explicit AI / AI-enabled project has one business case. The value story uses plain categories:

| Value type | Cases | Build cost, high case | Projected annual value |
| --- | ---: | ---: | ---: |
${valueTypeRows.join("\n")}

Direct-value cases clear the investment hurdle: low-case annual value is at least 3x high-case build cost. Foundation/readiness cases are shown separately because they enable downstream use cases but should not be counted as standalone value.

## Finance And Proof Workflow

The source layer tracks value as a monthly workflow:

1. Sponsor states the target value.
2. Finance can challenge or approve the target.
3. Monthly tracking records actual movement against the baseline.
4. Finance validates actual value when evidence is sufficient.
5. Board-claimable value is released only after the Finance validation gate.

Finance ledger coverage:

| Approval state | Rows |
| --- | ---: |
${financeRows.join("\n")}

## Layer 1 Validation Gates

Layer 1 is ready for signoff if the following remain true:

- All rows use tenant key \`meridian-health\`.
- Total IT budget equals \`${formatUsdMillions(TOTAL_IT_BUDGET_USD)}\`.
- Reviewed project portfolio equals \`${formatUsdMillions(TOWER_REVIEWED_PROJECT_USD)}\`.
- Explicit AI / AI-enabled investment equals \`${formatUsdMillions(aiInvestment)}\`.
- AI is explicit through \`is_ai_related\`; BI is not automatically AI.
- There are ${projectRows.length} project rows and ${aiCases.length} AI business cases.
- Every explicit AI / AI-enabled project has exactly one business case.
- Tool rollouts include goals, target users, enabled users, and active users across ${toolRollouts.length} tools.
- Monthly tracking has ${monthlyValue.length} rows, Finance has ${financeLedger.length} approval events, and evidence has ${evidence.length} source rows.
- Projected annual AI value remains in the 3x-4x portfolio range.
- Sponsor value, Finance-reviewed value, Finance-validated value, and board-claimable value stay separate.

## Open Signoff Decisions

Before moving beyond Layer 2, sign off or revise these choices:

1. Is \`${formatUsdMillions(aiInvestment)}\` the right synthetic AI / AI-enabled investment pool inside a \`${formatUsdMillions(reviewedProjectBudget)}\` reviewed IT project portfolio?
2. Is \`${formatMultiple(projectedLow / aiInvestment)}-${formatMultiple(projectedHigh / aiInvestment)}\` the right projected annual AI value range for the demo story?
3. Are the five value types simple enough: Reduce cost, Create capacity, Grow revenue, Build faster, Foundation?
4. Should foundation/readiness work stay at zero direct ROI until linked use cases prove value?
5. Are monthly Finance states sufficient for the demo: sponsor claimed, challenged, CFO-approved target, not submitted, finance-validated actual?

Layer 1 signoff means the source inputs are credible enough to map forward. It does not mean the data has been loaded, projected, deployed, or proven in the live Tower UI.
`;
}

function buildLayer2Signoff({ adapter, sourceRows }) {
  const sourceExtractCount = Object.values(sourceRows).reduce((total, rows) => total + rows.length, 0);
  const sourceRecordCount = sourceExtractCount + adapter.adapterRuns.length + adapter.emittedObjects.length;
  return `# Tower Synthetic Source Data - Layer 2 Signoff

Package: \`tower-layer1-v2026-08-business-case\`
Layer: Source adapters
Status: locally validated; Azure write path prepared; live Azure write requires governed ACA job approval
As of: ${AS_OF_DATE}

## Layer 2 Purpose

Layer 2 converts client-owned Layer 1 source files into auditable adapter outputs. The client does not see this layer. It exists so every future canonical object can be traced back to the exact source file and CSV row that produced it.

This layer answers four questions:

1. Which source files were read?
2. Which adapter handled each file?
3. What canonical object did each source row emit?
4. Can every emitted object be traced back to a source file and source row?

## Adapter Coverage

| Adapter | Source file | Emits |
| --- | --- | --- |
| \`meridian_budget_domain_adapter\` | \`20_it_budget_by_domain.csv\` | Budget |
| \`meridian_it_project_adapter\` | \`21_it_project_portfolio.csv\` | Project |
| \`meridian_ai_business_case_adapter\` | \`22_ai_business_cases.csv\` | AIUseCase |
| \`meridian_tool_rollout_adapter\` | \`23_ai_tool_rollout.csv\` | Tool |
| \`meridian_monthly_value_adapter\` | \`24_monthly_value_tracking.csv\` | MetricObservation |
| \`meridian_finance_approval_adapter\` | \`25_finance_approval_ledger.csv\` | ApprovalEvent |
| \`meridian_evidence_adapter\` | \`26_evidence_register.csv\` | Evidence |

## Expected Azure Landing Counts

The Layer 2 Azure load lands records into \`ecl_source\` only.

| Record type | Count |
| --- | ---: |
| Source files | 9 |
| Total source records | ${sourceRecordCount.toLocaleString("en-US")} |
| Client source extract records | ${sourceExtractCount} |
| Adapter run records | ${adapter.adapterRuns.length} |
| Adapter emission records | ${adapter.emittedObjects.length} |

The 9 source files are the 7 Layer 1 source extracts plus 2 Layer 2 adapter audit files.

## Validation Results

Local validation must pass:

- ${adapter.adapterRuns.length} adapter runs
- ${adapter.emittedObjects.length} adapter emissions for ${sourceExtractCount} Layer 1 source rows
- 0 adapter emissions without preserved lineage
- 0 duplicate emitted canonical object IDs
- 0 tenant payload drift rows
- 0 adapter-lineage drift rows

Azure readback is a separate gate. It is not complete until a governed ACA operator job writes this package to \`ecl_source\` and the readback SQL confirms the same counts above.

## Azure Load Contract

The real Azure load must run through the governed ACA operator job after this loader and package are merged and built into a digest-pinned image.

\`\`\`bash
npm run ops:aca-job -- \\
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \\
  --script tower:healthcare-demo-layer2-source-adapters:write-job \\
  --secret-env DATABASE_URL=azure-postgres-control-database-url \\
  --env TOWER_LAYER2_TENANT_KEY=meridian-health \\
  --env TOWER_LAYER2_ASSESSMENT_ID=meridian-tower-layer2-source-adapters-v2026-08 \\
  --env TOWER_LAYER2_BUILD_VERSION=tower-layer2-source-adapters-v2026-08 \\
  --env TOWER_LAYER2_INPUT_SOURCE_VERSION=tower-layer1-v2026-08-business-case \\
  --env TOWER_LAYER2_IDEMPOTENCY_KEY=meridian-tower-layer2-source-adapters-v2026-08:<main-sha> \\
  --out-dir /tmp/tower-layer2-aca-proof
\`\`\`

The loader refuses direct Azure writes unless both are true:

- \`DATABASE_URL\` is present.
- \`TOWER_LAYER2_AZURE_WRITE_APPROVED=true\`.

## Sunset Rule

After Azure readback passes, older overlapping Tower source-adapter demo slices can be sunset. The purge must be scoped by tenant and assessment ID. Do not delete unrelated source files, canonical rows, cube rows, product projections, or other tenant data.

Layer 2 signoff means the adapter landing layer is credible and loadable. It does not mean Layer 3 canonical objects or Layer 4 Tower screens are refreshed.
`;
}

function buildLayer3Signoff({ canonical, sources }) {
  const directValueCases = sources.aiCases.filter(
    (row) => Number(row.projected_annual_value_low_usd || 0) > 0,
  );
  const foundationCases = sources.aiCases.length - directValueCases.length;
  return `# Tower Synthetic Source Data - Layer 3 Signoff

Package: \`tower-layer1-v2026-08-business-case\`
Layer: Canonical enterprise model
Status: Azure loaded and validator-passed for Layer 3; cubes and product projections pending
As of: ${AS_OF_DATE}
Azure proof captured: 2026-08-28

## Layer 3 Purpose

Layer 3 is the source of truth for the synthetic Tower demo package. It converts the Layer 2 source-adapter rows into stable canonical objects, relationships, and measures.

This layer answers six plain questions:

1. What IT budgets exist by domain?
2. Which projects are AI-related and which are ordinary IT?
3. Which AI use cases have a business case?
4. Which AI tools are being rolled out?
5. Which values are promised, finance-reviewed, validated, or board-claimable?
6. Which evidence item supports each project, business case, and monthly value observation?

## Canonical Counts

| Canonical object | Count | Meaning |
| --- | ---: | --- |
| Budget | ${canonical.canonicalBudgets.length} | IT budget by domain or segment |
| Program / project | ${canonical.canonicalProjects.length} | Total IT project portfolio rows |
| AI use case | ${canonical.canonicalCases.length} | AI-related business cases and foundation work |
| AI tool | ${canonical.canonicalTools.length} | Tool rollouts such as copilots, workflow assistants, or analytic agents |
| Monthly value observation | ${canonical.canonicalMonthlyValues.length} | Monthly tracking rows across AI use cases |
| Finance approval event | ${canonical.canonicalFinanceEvents.length} | Sponsor claim, target review, or actual validation events |
| Evidence item | ${canonical.canonicalEvidence.length} | Portfolio, business case, monthly metric, or finance-validation evidence |

Layer 3 also carries ${canonical.canonicalRelationships.length} relationships and 20 governed metric definitions.

Azure stores these rows using the approved physical object families: 512 \`metric\` objects, 140 \`program\` objects, 42 \`ai_use_case\` objects, 13 \`ai_tool\` objects, and 280 \`control\` objects. The more specific business meaning, such as Budget, Monthly value observation, Finance approval event, and Evidence item, is retained as \`canonical_semantic_type\` on each canonical object.

## Value Semantics

These terms must remain separate in every product projection:

| Term | Plain meaning |
| --- | --- |
| Approved budget | What the organization approved to spend on the project or domain |
| Promised value | The sponsor or business case estimate before full validation |
| Finance-reviewed value | Value Finance has reviewed but not fully validated as actual |
| Finance-validated value | Value Finance has accepted against a measurement method |
| Board-claimable value | Validated value cleared for executive or board reporting |

Approved budget is never a fallback for promised value. Promised value is never a fallback for validated value. If one value is missing, downstream products must show a gap instead of substituting another metric.

## AI Portfolio Semantics

The total IT project portfolio contains ${canonical.canonicalProjects.length} projects. Only ${canonical.canonicalCases.length} are AI-related. The non-AI projects stay in the canonical portfolio so Tower can compare AI investment against the full IT budget, but they do not receive synthetic promised-value measures.

The AI-related population is intentionally split:

| Population | Count | Tracking rule |
| --- | ---: | --- |
| Direct-value AI cases | ${directValueCases.length} | Carry promised annual value, ROI band, payback target, readiness, monthly value observations, and finance events |
| Foundation AI cases | ${foundationCases} | Carry readiness and enablement evidence, but no direct ROI claim |
| Tool rollouts | ${sources.toolRollouts.length} | Carry target users, active users, adoption target, actual adoption, and linked business-case count |

## Refresh Process for All Product Pages

The monthly refresh should run in this order:

1. Layer 1 intake: Data owners refresh source extracts for IT budget, project portfolio, AI business cases, tool rollout, monthly value tracking, finance approvals, and evidence.
2. Layer 2 adapters: Each source file lands into \`ecl_source\` with source file, source row, adapter run, and adapter emission lineage.
3. Layer 3 canonical: Canonical objects, relationships, metric definitions, and measures are rebuilt from Layer 2 only.
4. Cube build: Cubes are rebuilt from Layer 3 only. They may denormalize for speed, but they do not own facts.
5. Product projections: Home, Source, Intelligence, Tower, and any charting surface read disposable projections derived from the cube or canonical layer.
6. Product QA: Run fact-lineage checks, readback counts, route smoke tests, and signed-in visual QA before demo or client use.
7. Sunset: Retire older overlapping layers only after the replacement layer has passed readback, parity checks, and product-route proof.

## Azure Load Contract

The real Azure load must run through the governed ACA operator job after this loader and package are merged and built into a digest-pinned image. The completed Layer 3 load used this approved path.

Completed Azure execution:

- Main merge SHA: \`268aa5b689c87dac807aee4a99eb19e61e4c847e\`
- ACA deploy run: \`33201786753\`
- Deployed web image: \`acrabarvalab001.azurecr.io/abarva/web@sha256:2629418746b419d8c6c8810fcf1ebefe65c851a252156178b95af1d4eeb9cc0d\`
- Operator execution: \`job-abarva-private-operator-eus-qml12rw\`
- Proof bundle: \`/tmp/tower-layer3-aca-proof-268aa5b68/proof/meridian-tower-layer3-canonical\`

Use this command shape for approved reruns:

\`\`\`bash
npm run ops:aca-job -- \\
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \\
  --script tower:healthcare-demo-layer3-canonical:write-job \\
  --secret-env DATABASE_URL=azure-postgres-control-database-url \\
  --env TOWER_LAYER3_TENANT_KEY=meridian-health \\
  --env TOWER_LAYER3_ASSESSMENT_ID=meridian-tower-layer2-source-adapters-v2026-08 \\
  --env TOWER_LAYER3_BUILD_VERSION=tower-layer3-canonical-v2026-08 \\
  --env TOWER_LAYER3_INPUT_SOURCE_VERSION=tower-layer1-v2026-08-business-case \\
  --env TOWER_LAYER3_IDEMPOTENCY_KEY=meridian-tower-layer3-canonical-v2026-08:<main-sha> \\
  --out-dir /tmp/tower-layer3-aca-proof
\`\`\`

The loader refuses direct Azure writes unless all are true:

- \`DATABASE_URL\` is present.
- \`TOWER_LAYER3_WRITE=true\`.
- \`TOWER_LAYER3_AZURE_WRITE_APPROVED=true\`.

## Validation Gates

Layer 3 signoff requires:

- 987 canonical objects loaded.
- Physical object family counts match: 512 metric, 140 program, 42 AI use case, 13 AI tool, and 280 control.
- Semantic object counts match: 8 budget, 140 program, 42 AI use case, 13 AI tool, 504 value observation, 84 finance approval event, and 196 evidence item.
- 0 objects missing \`canonical_semantic_type\`.
- 280 canonical relationships loaded.
- 20 metric definitions loaded.
- More than 2,500 measures loaded.
- 0 objects without source-record lineage.
- 0 relationships without source-record lineage.
- 0 measures without source-record lineage.
- 0 tenant payload drift rows.
- 0 canonical objects whose source record is absent from Layer 2.
- 0 product projection or cube rows written by the Layer 3 loader.

Azure readback passed the original Layer 3 gates with 987 canonical objects, 280 relationships, 20 metric definitions, 2,531 measures, 1,981 Layer 2 source records available, and no tenant drift or lineage gaps. The follow-on semantic-count gate now requires any rerun to prove the same 987 objects by business meaning, not only by physical object family.

Layer 3 signoff does not mean Tower, Home, Source, Intelligence, or cubes are refreshed. Those are Layer 4 and cube work.
`;
}

async function writeFile(name, headers, rows, manifestFiles) {
  const text = toCsv(headers, rows);
  await fs.mkdir(path.dirname(path.join(OUT_DIR, name)), { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, name), text, "utf8");
  manifestFiles.push({ file: name, rows: rows.length, sha256: sha256(text) });
}

async function writeTextFile(name, text, manifestFiles) {
  await fs.mkdir(path.dirname(path.join(OUT_DIR, name)), { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, name), text, "utf8");
  manifestFiles.push({ file: name, rows: null, sha256: sha256(text) });
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const budgetRows = buildBudgetRows();
  const projectRows = buildProjectRows();
  const aiCases = buildAiBusinessCases(projectRows);
  const aiCaseByProjectId = new Map(
    aiCases.map((item) => [item.project_id, item]),
  );
  for (const project of projectRows) {
    const aiCase = aiCaseByProjectId.get(project.project_id);
    if (aiCase) {
      project.promised_annual_value_usd = aiCase.projected_annual_value_low_usd;
      project.value_tracking_required =
        Number(aiCase.projected_annual_value_low_usd) > 0 ? "true" : "false";
    }
  }
  const toolRollouts = buildToolRollouts(aiCases);
  const monthlyValue = buildMonthlyValue(aiCases);
  const financeLedger = buildFinanceLedger(aiCases);
  const evidence = buildEvidence(projectRows, aiCases, monthlyValue);
  const adapter = buildAdapterArtifacts({
    budgetRows,
    projectRows,
    aiCases,
    toolRollouts,
    monthlyValue,
    financeLedger,
    evidence,
  });
  const canonical = buildCanonicalArtifacts({
    budgetRows,
    projectRows,
    aiCases,
    toolRollouts,
    monthlyValue,
    financeLedger,
    evidence,
  });
  const cube = buildCubeArtifacts({
    projectRows,
    aiCases,
    monthlyValue,
  });
  const readModels = buildReadModels(
    {
      projectRows,
      aiCases,
      toolRollouts,
      monthlyValue,
    },
    cube,
  );
  const manifestFiles = [];

  await writeFile(
    "20_it_budget_by_domain.csv",
    Object.keys(budgetRows[0]),
    budgetRows,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/20_it_budget_by_domain.csv",
    Object.keys(budgetRows[0]),
    budgetRows,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/21_it_project_portfolio.csv",
    Object.keys(projectRows[0]),
    projectRows,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/22_ai_business_cases.csv",
    Object.keys(aiCases[0]),
    aiCases,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/23_ai_tool_rollout.csv",
    Object.keys(toolRollouts[0]),
    toolRollouts,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/24_monthly_value_tracking.csv",
    Object.keys(monthlyValue[0]),
    monthlyValue,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/25_finance_approval_ledger.csv",
    Object.keys(financeLedger[0]),
    financeLedger,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/source_system_extracts/26_evidence_register.csv",
    Object.keys(evidence[0]),
    evidence,
    manifestFiles,
  );
  await writeFile(
    "21_it_project_portfolio.csv",
    Object.keys(projectRows[0]),
    projectRows,
    manifestFiles,
  );
  await writeFile(
    "22_ai_business_cases.csv",
    Object.keys(aiCases[0]),
    aiCases,
    manifestFiles,
  );
  await writeFile(
    "23_ai_tool_rollout.csv",
    Object.keys(toolRollouts[0]),
    toolRollouts,
    manifestFiles,
  );
  await writeFile(
    "24_monthly_value_tracking.csv",
    Object.keys(monthlyValue[0]),
    monthlyValue,
    manifestFiles,
  );
  await writeFile(
    "25_finance_approval_ledger.csv",
    Object.keys(financeLedger[0]),
    financeLedger,
    manifestFiles,
  );
  await writeFile(
    "26_evidence_register.csv",
    Object.keys(evidence[0]),
    evidence,
    manifestFiles,
  );

  const readmeRows = [
    {
      tenant_key: TENANT_KEY,
      package_id: LOAD_RUN_ID,
      layer: "Layer 1 client intake",
      purpose:
        "Synthetic Meridian Tower source data for signoff before adapter, canonical, cube, or product changes.",
      rule: "Total IT budget is broader than AI. AI-related status is explicit classification, never inferred from BI/tool labels.",
      generated_at: GENERATED_AT,
    },
  ];
  await writeFile(
    "00_layer1_readme.csv",
    Object.keys(readmeRows[0]),
    readmeRows,
    manifestFiles,
  );
  await writeFile(
    "layer_1_client_intake/00_layer1_readme.csv",
    Object.keys(readmeRows[0]),
    readmeRows,
    manifestFiles,
  );

  const sourceManifestRows = [
    ["20_it_budget_by_domain.csv", "IT Finance / FP&A", "IT budget by domain"],
    ["21_it_project_portfolio.csv", "PMO", "IT project portfolio"],
    [
      "22_ai_business_cases.csv",
      "Business sponsors + Finance",
      "AI business cases",
    ],
    ["23_ai_tool_rollout.csv", "Platform administrators", "AI tool rollout"],
    [
      "24_monthly_value_tracking.csv",
      "Business sponsors + Finance",
      "Monthly value tracking",
    ],
    ["25_finance_approval_ledger.csv", "Finance", "Finance approval ledger"],
    ["26_evidence_register.csv", "Initiative owners", "Evidence register"],
  ].map(([source_file, owner_role, description]) => ({
    tenant_key: TENANT_KEY,
    source_file,
    owner_role,
    description,
    source_layer: "Layer 1 client intake",
    refresh_cadence: "monthly",
    quality_state: "synthetic_review_ready",
  }));
  await writeFile(
    "layer_1_client_intake/source_file_manifest.csv",
    Object.keys(sourceManifestRows[0]),
    sourceManifestRows,
    manifestFiles,
  );

  await writeFile(
    "layer_2_source_adapters/adapter_runs.csv",
    Object.keys(adapter.adapterRuns[0]),
    adapter.adapterRuns,
    manifestFiles,
  );
  await writeFile(
    "layer_2_source_adapters/adapter_emitted_objects.csv",
    Object.keys(adapter.emittedObjects[0]),
    adapter.emittedObjects,
    manifestFiles,
  );

  await writeFile(
    "layer_3_canonical/canonical_budgets.csv",
    Object.keys(canonical.canonicalBudgets[0]),
    canonical.canonicalBudgets,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_projects.csv",
    Object.keys(canonical.canonicalProjects[0]),
    canonical.canonicalProjects,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_ai_use_cases.csv",
    Object.keys(canonical.canonicalCases[0]),
    canonical.canonicalCases,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_tools.csv",
    Object.keys(canonical.canonicalTools[0]),
    canonical.canonicalTools,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_monthly_value_observations.csv",
    Object.keys(canonical.canonicalMonthlyValues[0]),
    canonical.canonicalMonthlyValues,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_finance_approval_events.csv",
    Object.keys(canonical.canonicalFinanceEvents[0]),
    canonical.canonicalFinanceEvents,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_evidence_items.csv",
    Object.keys(canonical.canonicalEvidence[0]),
    canonical.canonicalEvidence,
    manifestFiles,
  );
  await writeFile(
    "layer_3_canonical/canonical_relationships.csv",
    Object.keys(canonical.canonicalRelationships[0]),
    canonical.canonicalRelationships,
    manifestFiles,
  );

  await writeFile(
    "cube/tower_ai_case_cube.csv",
    Object.keys(cube.caseRows[0]),
    cube.caseRows,
    manifestFiles,
  );
  await writeFile(
    "cube/tower_ai_portfolio_cube.csv",
    Object.keys(cube.portfolioCube[0]),
    cube.portfolioCube,
    manifestFiles,
  );
  await writeFile(
    "cube/cube_measures.csv",
    Object.keys(cube.cubeMeasures[0]),
    cube.cubeMeasures,
    manifestFiles,
  );
  await writeFile(
    "cube/cube_dimensions.csv",
    Object.keys(cube.cubeDimensions[0]),
    cube.cubeDimensions,
    manifestFiles,
  );
  await writeFile(
    "cube/cube_gate_flags.csv",
    Object.keys(cube.cubeGateFlags[0]),
    cube.cubeGateFlags,
    manifestFiles,
  );

  await writeFile(
    "layer_4_read_models/tower_executive_summary.csv",
    Object.keys(readModels.executiveSummary[0]),
    readModels.executiveSummary,
    manifestFiles,
  );
  await writeFile(
    "layer_4_read_models/tower_ai_initiatives_table.csv",
    Object.keys(readModels.initiativeTable[0]),
    readModels.initiativeTable,
    manifestFiles,
  );
  await writeFile(
    "layer_4_read_models/tower_tools_table.csv",
    Object.keys(readModels.toolTable[0]),
    readModels.toolTable,
    manifestFiles,
  );
  await writeFile(
    "layer_4_read_models/tower_value_proof_queue.csv",
    Object.keys(readModels.proofQueue[0]),
    readModels.proofQueue,
    manifestFiles,
  );

  const packageReadme = `# Meridian Tower Synthetic Data Package

Synthetic demo data only. This package is offline and marked no_runtime_load=true.

The generated layers follow the enterprise information architecture:

- Layer 1 client intake: owner-oriented source extracts
- Layer 2 source adapters: emitted canonical object log with upstream lineage
- Layer 3 canonical: canonical budgets, projects, AI use cases, tools, value observations, approvals, evidence and relationships
- Cube/read models: deterministic Tower-ready aggregates and simple executive tables

Headline economics:

- Total IT budget: $1.05B
- Reviewed project portfolio: $703.1M
- Explicit AI / AI-enabled investment: $211.8M
- Projected annual AI value: $677.8M-$847.2M
- AI portfolio ROI: 3.2x-4.0x

Rules:

- AI status is explicit, never inferred from BI or folder names.
- Foundation work carries no direct ROI until linked downstream use cases prove value.
- Finance-validated actuals are separate from projected annual value.
- Products read Layer 4 projections derived from Layer 3; no product owns source data.
`;
  await writeTextFile("README.md", packageReadme, manifestFiles);
  await writeTextFile(
    "layer_1_client_intake/LAYER_1_SIGNOFF.md",
    buildLayer1Signoff({
      budgetRows,
      projectRows,
      aiCases,
      toolRollouts,
      monthlyValue,
      financeLedger,
      evidence,
    }),
    manifestFiles,
  );
  await writeTextFile(
    "layer_2_source_adapters/LAYER_2_SIGNOFF.md",
    buildLayer2Signoff({
      adapter,
      sourceRows: {
        budgetRows,
        projectRows,
        aiCases,
        toolRollouts,
        monthlyValue,
        financeLedger,
        evidence,
      },
    }),
    manifestFiles,
  );
  await writeTextFile(
    "layer_3_canonical/LAYER_3_SIGNOFF.md",
    buildLayer3Signoff({
      canonical,
      sources: {
        aiCases,
        toolRollouts,
      },
    }),
    manifestFiles,
  );

  const manifest = {
    package_id: LOAD_RUN_ID,
    tenant_key: TENANT_KEY,
    generated_at: GENERATED_AT,
    package_type: "tower_full_synthetic_layer_cube_package",
    status: "offline_layer_cube_proof_no_load_no_deploy",
    no_runtime_load: true,
    layers: {
      layer_1_client_intake: "generated",
      layer_2_source_adapters: "generated",
      layer_3_canonical: "generated",
      cube: "generated",
      layer_4_read_models: "generated",
    },
    revenue_usd: TOTAL_REVENUE_USD,
    total_it_budget_usd: TOTAL_IT_BUDGET_USD,
    tower_reviewed_project_budget_usd: TOWER_REVIEWED_PROJECT_USD,
    files: manifestFiles,
  };
  await fs.writeFile(
    path.join(OUT_DIR, "package_manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(OUT_DIR, "proof_manifest.json"),
    `${JSON.stringify(
      {
        ...manifest,
        warning: "SYNTHETIC DEMO DATA - NOT CLIENT DATA - OFFLINE ONLY",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ outDir: OUT_DIR, ...manifest }, null, 2));
}

await main();

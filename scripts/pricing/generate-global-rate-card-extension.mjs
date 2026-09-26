#!/usr/bin/env node
/**
 * Nexus Pricing Engine global extension.
 *
 * Builds tenant-inheritable Moves solution-pricing reference assets from the
 * existing pricing-engine-v1 taxonomy. This is offline reference data only:
 * no tenant data is loaded, no runtime path changes, and tenant/client rate
 * cards remain the governed override source.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const packDir = path.join(repoRoot, "datasets", "reference", "pricing-engine-v1");
const manifestPath = path.join(packDir, "manifest.json");
const GENERATED_AT = "2026-08-05T00:00:00.000Z";
const EXTENSION_VERSION = "1.0.0";

const INTERNAL_PROVIDER = {
  provider_class_code: "INTERNAL",
  class_name: "Internal team",
  archetype_label: "Internal employee or contractor cost basis",
  tier_multiplier: "1",
  status: "active",
  version: "1",
};

const FILES = {
  technologies: "pricing_technologies.csv",
  roleTechnologyMap: "pricing_role_technology_map.csv",
  providerLocationEligibility: "pricing_provider_location_eligibility.csv",
  materializedInternalRates: "pricing_materialized_internal_rates.csv",
  materializedProviderRates: "pricing_materialized_provider_rates.csv",
  rateSelectionPolicies: "pricing_rate_selection_policies.csv",
  industryOverlays: "pricing_industry_overlays.csv",
};

const HEADERS = {
  [FILES.technologies]: [
    "technology_code",
    "technology_name",
    "technology_family",
    "vendor_or_standard",
    "domain",
    "industry_relevance",
    "regulated_data_touchpoint",
    "source_artifact",
    "status",
    "version",
    "notes",
  ],
  [FILES.roleTechnologyMap]: [
    "map_code",
    "role_code",
    "canonical_role_name",
    "capability_code",
    "capability_name",
    "technology_code",
    "technology_name",
    "industry_overlay_code",
    "relevance",
    "delivery_constraint",
    "source_artifact",
    "status",
    "version",
    "notes",
  ],
  [FILES.providerLocationEligibility]: [
    "eligibility_code",
    "provider_class_code",
    "provider_class_name",
    "location_code",
    "location_name",
    "shore_category",
    "role_delivery_group",
    "eligibility",
    "requires_manual_review",
    "source_artifact",
    "status",
    "version",
    "notes",
  ],
  [FILES.materializedInternalRates]: [
    "rate_line_id",
    "scope",
    "tenant_key",
    "client_applicability",
    "role_code",
    "canonical_role_name",
    "level_code",
    "level_name",
    "tower_code",
    "tower_name",
    "capability_code",
    "capability_name",
    "role_family_code",
    "role_family_name",
    "role_type",
    "role_delivery_group",
    "technology_codes",
    "location_code",
    "location_name",
    "shore_category",
    "rate_type",
    "currency",
    "rate_unit",
    "base_loaded_rate_usd_per_hour",
    "base_scarcity_adjusted_rate_usd_per_hour",
    "salary_multiplier",
    "planning_rate_low_usd_per_hour",
    "planning_rate_base_usd_per_hour",
    "planning_rate_high_usd_per_hour",
    "internal_loaded_rate_usd_per_hour",
    "internal_scarcity_adjusted_rate_usd_per_hour",
    "partner_buy_rate_usd_per_hour",
    "abarva_sell_rate_usd_per_hour",
    "source_rate_band_code",
    "source_formula",
    "confidence",
    "approval_status",
    "status",
    "version",
    "notes",
  ],
  [FILES.materializedProviderRates]: [
    "rate_line_id",
    "scope",
    "tenant_key",
    "client_applicability",
    "role_code",
    "canonical_role_name",
    "level_code",
    "level_name",
    "tower_code",
    "tower_name",
    "capability_code",
    "capability_name",
    "role_family_code",
    "role_family_name",
    "role_type",
    "role_delivery_group",
    "technology_codes",
    "provider_class_code",
    "provider_class_name",
    "provider_archetype_label",
    "location_code",
    "location_name",
    "shore_category",
    "rate_type",
    "currency",
    "rate_unit",
    "base_indicative_bill_rate_usd_per_hour",
    "location_rate_multiplier",
    "si_t1_multiplier",
    "target_provider_multiplier",
    "provider_multiplier_ratio_vs_si_t1",
    "planning_rate_low_usd_per_hour",
    "planning_rate_base_usd_per_hour",
    "planning_rate_high_usd_per_hour",
    "partner_market_bill_rate_usd_per_hour",
    "partner_buy_rate_usd_per_hour",
    "abarva_sell_rate_usd_per_hour",
    "source_rate_band_code",
    "source_formula",
    "eligibility_code",
    "confidence",
    "approval_status",
    "status",
    "version",
    "notes",
  ],
  [FILES.rateSelectionPolicies]: [
    "policy_code",
    "precedence_rank",
    "rate_source_kind",
    "selected_rate_source_label",
    "description",
    "required_evidence",
    "allow_unapproved",
    "eligible_for_committed_solution_price",
    "snapshot_behavior",
    "conflict_rule",
    "status",
    "version",
  ],
  [FILES.industryOverlays]: [
    "overlay_code",
    "industry_code",
    "industry_name",
    "technology_code",
    "technology_name",
    "relevant_tower_codes",
    "relevant_capability_codes",
    "required_shore_policy",
    "rate_source_kind",
    "confidence_adjustment",
    "approval_status",
    "status",
    "version",
    "notes",
  ],
};

const TECHNOLOGIES = [
  ["TECH-EPIC-CLARITY", "Epic Clarity", "clinical_data_platform", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-EPIC-CABOODLE", "Epic Caboodle", "clinical_data_platform", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-EPIC-COGITO", "Epic Cogito", "clinical_analytics", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-EPIC-BRIDGES", "Epic Bridges", "clinical_integration", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-EPIC-RESOLUTE", "Epic Resolute", "revenue_cycle", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-EPIC-CADENCE", "Epic Cadence", "patient_access", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-EPIC-WILLOW", "Epic Willow", "clinical_pharmacy", "Epic", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-WORKDAY-HCM", "Workday HCM", "erp_workforce", "Workday", "enterprise_platform", "global", "employee_data"],
  ["TECH-WORKDAY-FINANCE", "Workday Finance", "erp_finance", "Workday", "enterprise_platform", "global", "financial_data"],
  ["TECH-WORKDAY-SCM", "Workday Supply Chain", "erp_supply_chain", "Workday", "enterprise_platform", "healthcare", "supplier_data"],
  ["TECH-WORKDAY-PRISM", "Workday Prism", "erp_analytics", "Workday", "enterprise_platform", "global", "employee_or_financial_data"],
  ["TECH-WORKDAY-ADAPTIVE", "Workday Adaptive Planning", "planning", "Workday", "enterprise_platform", "global", "financial_data"],
  ["TECH-WORKDAY-STUDIO", "Workday Studio", "integration", "Workday", "enterprise_platform", "global", "employee_or_financial_data"],
  ["TECH-WORKDAY-EIB", "Workday EIB", "integration", "Workday", "enterprise_platform", "global", "employee_or_financial_data"],
  ["TECH-SERVICENOW-ITSM", "ServiceNow ITSM", "itsm", "ServiceNow", "enterprise_platform", "global", "operational_data"],
  ["TECH-SERVICENOW-CSDM", "ServiceNow CSDM", "service_model", "ServiceNow", "enterprise_platform", "global", "operational_data"],
  ["TECH-SERVICENOW-CMDB", "ServiceNow CMDB", "configuration_management", "ServiceNow", "enterprise_platform", "global", "asset_and_system_data"],
  ["TECH-SERVICENOW-APM", "ServiceNow APM", "application_portfolio", "ServiceNow", "enterprise_platform", "global", "application_data"],
  ["TECH-SERVICENOW-VRM", "ServiceNow Vendor Management", "vendor_management", "ServiceNow", "enterprise_platform", "global", "supplier_data"],
  ["TECH-AWS-LANDING-ZONE", "AWS Landing Zone", "cloud_foundation", "AWS", "cloud_platform", "global", "infrastructure_metadata"],
  ["TECH-AWS-IAM", "AWS IAM", "identity_access", "AWS", "cloud_platform", "global", "identity_data"],
  ["TECH-AWS-NETWORKING", "AWS Networking", "network", "AWS", "cloud_platform", "global", "infrastructure_metadata"],
  ["TECH-AWS-COMPUTE", "AWS Compute", "compute", "AWS", "cloud_platform", "global", "infrastructure_metadata"],
  ["TECH-AWS-STORAGE", "AWS Storage", "storage", "AWS", "cloud_platform", "global", "infrastructure_metadata"],
  ["TECH-AWS-SECURITY", "AWS Security", "cloud_security", "AWS", "cloud_platform", "global", "security_data"],
  ["TECH-DATABRICKS-ADMIN", "Databricks Platform Administration", "data_platform", "Databricks", "data_platform", "global", "analytics_data"],
  ["TECH-DATABRICKS-ENGINEERING", "Databricks Data Engineering", "data_engineering", "Databricks", "data_platform", "global", "analytics_data"],
  ["TECH-DATABRICKS-UNITY-CATALOG", "Databricks Unity Catalog", "data_governance", "Databricks", "data_platform", "regulated_industries", "lineage_and_policy_data"],
  ["TECH-DATABRICKS-ML-GENAI", "Databricks ML and GenAI", "ai_ml", "Databricks", "data_platform", "global", "model_and_feature_data"],
  ["TECH-SNOWFLAKE-PLATFORM", "Snowflake", "data_platform", "Snowflake", "data_platform", "global", "analytics_data"],
  ["TECH-HL7", "HL7", "healthcare_integration_standard", "HL7", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-FHIR", "FHIR", "healthcare_interoperability_standard", "HL7", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-SAS", "SAS", "analytics_platform", "SAS", "analytics", "regulated_industries", "analytics_data"],
  ["TECH-HADOOP", "Hadoop", "legacy_data_platform", "Apache", "data_platform", "global", "analytics_data"],
  ["TECH-SQL-SERVER", "SQL Server", "database_platform", "Microsoft", "data_platform", "global", "application_or_analytics_data"],
  ["TECH-HEALTHCARE-ANALYTICS", "Healthcare Analytics", "industry_analytics", "Industry", "healthcare", "healthcare", "restricted_phi_possible"],
  ["TECH-PAYER-DOMAIN", "Payer Domain", "industry_domain", "Industry", "healthcare_payer", "healthcare", "claims_and_member_data"],
  ["TECH-PROVIDER-DOMAIN", "Provider Domain", "industry_domain", "Industry", "healthcare_provider", "healthcare", "restricted_phi_possible"],
  ["TECH-CLINICAL-QUALITY", "Clinical Quality", "industry_analytics", "Industry", "healthcare_provider", "healthcare", "restricted_phi_possible"],
];

const RATE_SELECTION_POLICIES = [
  {
    policy_code: "POL-DEAL-OVERRIDE",
    precedence_rank: 1,
    rate_source_kind: "deal_override",
    selected_rate_source_label: "Deal or SOW-specific override",
    description: "Approved deal/SOW override with reason, owner, effective date, and expiration if temporary.",
    required_evidence: "approved_deal_or_sow_override",
    allow_unapproved: "false",
    eligible_for_committed_solution_price: "true",
    snapshot_behavior: "Freeze into approved solution snapshots; compare-only after supersession.",
    conflict_rule: "Higher-priority explicit override wins; equal-rank duplicate source is invalid.",
  },
  {
    policy_code: "POL-TENANT-CONTRACTED",
    precedence_rank: 2,
    rate_source_kind: "tenant_contracted_rate",
    selected_rate_source_label: "Tenant contracted/vendor rate",
    description: "Approved tenant rate-card version or vendor quote lineage.",
    required_evidence: "approved_tenant_rate_card_or_vendor_quote",
    allow_unapproved: "false",
    eligible_for_committed_solution_price: "true",
    snapshot_behavior: "New approved tenant versions reprice draft/open Moves only; historical snapshots remain frozen.",
    conflict_rule: "Most recent approved effective version wins within the same tenant and scope.",
  },
  {
    policy_code: "POL-TENANT-INTERNAL",
    precedence_rank: 3,
    rate_source_kind: "tenant_internal_rate",
    selected_rate_source_label: "Tenant internal loaded cost",
    description: "Approved tenant workforce/finance source with loaded-cost methodology.",
    required_evidence: "approved_tenant_internal_loaded_cost_source",
    allow_unapproved: "false",
    eligible_for_committed_solution_price: "true",
    snapshot_behavior: "New approved tenant versions reprice draft/open Moves only; historical snapshots remain frozen.",
    conflict_rule: "Tenant internal cost does not override a higher-priority deal or contracted partner rate.",
  },
  {
    policy_code: "POL-INDUSTRY-OVERLAY",
    precedence_rank: 4,
    rate_source_kind: "industry_overlay",
    selected_rate_source_label: "Industry overlay assumption",
    description: "Industry overlay row plus technology/role relevance mapping.",
    required_evidence: "industry_overlay_and_role_technology_relevance",
    allow_unapproved: "true",
    eligible_for_committed_solution_price: "false",
    snapshot_behavior: "Planning assumption only until replaced by approved tenant/deal source.",
    conflict_rule: "Overlay can adjust selection/restriction but cannot create a committed commercial rate.",
  },
  {
    policy_code: "POL-GLOBAL-REFERENCE",
    precedence_rank: 5,
    rate_source_kind: "global_reference",
    selected_rate_source_label: "Global reference rate",
    description: "pricing-engine-v1 reference pack row and derived extension checksum.",
    required_evidence: "global_reference_row_and_manifest_checksum",
    allow_unapproved: "true",
    eligible_for_committed_solution_price: "false",
    snapshot_behavior: "Planning assumption only until replaced by approved tenant/deal source.",
    conflict_rule: "Global reference is the final fallback and must retain approval_status.",
  },
];

const HEALTHCARE_OVERLAY_TECH_CODES = new Set([
  "TECH-EPIC-CLARITY",
  "TECH-EPIC-CABOODLE",
  "TECH-EPIC-COGITO",
  "TECH-EPIC-BRIDGES",
  "TECH-EPIC-RESOLUTE",
  "TECH-EPIC-CADENCE",
  "TECH-EPIC-WILLOW",
  "TECH-WORKDAY-HCM",
  "TECH-WORKDAY-FINANCE",
  "TECH-WORKDAY-SCM",
  "TECH-WORKDAY-PRISM",
  "TECH-WORKDAY-ADAPTIVE",
  "TECH-WORKDAY-STUDIO",
  "TECH-WORKDAY-EIB",
  "TECH-SERVICENOW-ITSM",
  "TECH-SERVICENOW-CSDM",
  "TECH-SERVICENOW-CMDB",
  "TECH-SERVICENOW-APM",
  "TECH-SERVICENOW-VRM",
  "TECH-AWS-LANDING-ZONE",
  "TECH-AWS-IAM",
  "TECH-AWS-NETWORKING",
  "TECH-AWS-COMPUTE",
  "TECH-AWS-STORAGE",
  "TECH-AWS-SECURITY",
  "TECH-DATABRICKS-ADMIN",
  "TECH-DATABRICKS-ENGINEERING",
  "TECH-DATABRICKS-UNITY-CATALOG",
  "TECH-DATABRICKS-ML-GENAI",
  "TECH-SNOWFLAKE-PLATFORM",
  "TECH-HL7",
  "TECH-FHIR",
  "TECH-SAS",
  "TECH-HADOOP",
  "TECH-SQL-SERVER",
  "TECH-HEALTHCARE-ANALYTICS",
  "TECH-PAYER-DOMAIN",
  "TECH-PROVIDER-DOMAIN",
  "TECH-CLINICAL-QUALITY",
]);

function readCsv(fileName) {
  const raw = fs.readFileSync(path.join(packDir, fileName), "utf8");
  const rows = parseCsv(raw);
  if (rows.length === 0) return [];
  const [headers, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((value) => value !== ""))
    .map((row, rowIndex) => {
      if (row.length !== headers.length) {
        throw new Error(`${fileName}: row ${rowIndex + 2} has ${row.length} fields, expected ${headers.length}`);
      }
      return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
    });
}

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvField(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s) || s !== s.trim()) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(fileName, rows) {
  const headers = HEADERS[fileName];
  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvField(row[h])).join(","));
  return `${lines.join("\n")}\n`;
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function keyBy(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function numeric(value, label) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric ${label}: ${value}`);
  return n;
}

function roundMoney(value) {
  return Number(value).toFixed(2);
}

function roundMultiplier(value) {
  return Number(value).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function assertUnique(rows, key, fileName) {
  const seen = new Set();
  for (const row of rows) {
    if (!row[key]) throw new Error(`${fileName}: missing ${key}`);
    if (seen.has(row[key])) throw new Error(`${fileName}: duplicate ${key} ${row[key]}`);
    seen.add(row[key]);
  }
}

function includesAny(text, terms) {
  const haystack = text.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function mapTechnologiesForRole(role, capability, tower) {
  const text = `${role.canonical_name} ${capability.capability_name} ${tower.tower_name}`.toLowerCase();
  const codes = new Set();

  if (includesAny(text, ["healthcare domain", "healthcare", "clinical", "revenue cycle"])) {
    ["TECH-HEALTHCARE-ANALYTICS", "TECH-CLINICAL-QUALITY"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["payer"])) codes.add("TECH-PAYER-DOMAIN");
  if (includesAny(text, ["provider"])) codes.add("TECH-PROVIDER-DOMAIN");
  if (includesAny(text, ["epic", "clinical", "provider", "healthcare"])) {
    ["TECH-EPIC-CLARITY", "TECH-EPIC-CABOODLE", "TECH-EPIC-COGITO"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["interface", "integration", "edi", "middleware"])) {
    ["TECH-HL7", "TECH-FHIR"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["workday"])) {
    ["TECH-WORKDAY-HCM", "TECH-WORKDAY-FINANCE", "TECH-WORKDAY-STUDIO", "TECH-WORKDAY-EIB"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["finance"])) codes.add("TECH-WORKDAY-FINANCE");
  if (includesAny(text, ["supply chain"])) codes.add("TECH-WORKDAY-SCM");
  if (includesAny(text, ["servicenow", "itsm", "service operations", "cmdb", "apm", "vendor management"])) {
    ["TECH-SERVICENOW-ITSM", "TECH-SERVICENOW-CSDM", "TECH-SERVICENOW-CMDB", "TECH-SERVICENOW-APM", "TECH-SERVICENOW-VRM"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["aws", "cloud", "platform engineering", "devops", "sre", "security"])) {
    ["TECH-AWS-LANDING-ZONE", "TECH-AWS-IAM", "TECH-AWS-NETWORKING", "TECH-AWS-COMPUTE", "TECH-AWS-STORAGE", "TECH-AWS-SECURITY"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["databricks", "lakehouse", "data engineering", "data platform", "machine learning", "genai", "mlops"])) {
    ["TECH-DATABRICKS-ADMIN", "TECH-DATABRICKS-ENGINEERING", "TECH-DATABRICKS-UNITY-CATALOG", "TECH-DATABRICKS-ML-GENAI"].forEach((code) => codes.add(code));
  }
  if (includesAny(text, ["snowflake", "data warehouse", "data platform", "analytics", "bi"])) codes.add("TECH-SNOWFLAKE-PLATFORM");
  if (includesAny(text, ["sas", "analytics"])) codes.add("TECH-SAS");
  if (includesAny(text, ["hadoop", "legacy data", "modernization"])) codes.add("TECH-HADOOP");
  if (includesAny(text, ["sql server", "database", "data engineering"])) codes.add("TECH-SQL-SERVER");

  return [...codes].sort();
}

function roleDeliveryGroup(role, capability, tower) {
  const text = `${role.canonical_name} ${capability.capability_name} ${tower.tower_name}`.toLowerCase();
  if (role.allowed_level_min === "Partner" || role.allowed_level_min === "Director" || includesAny(text, ["executive", "partner", "strategy"])) {
    return "executive_advisory";
  }
  if (includesAny(text, ["healthcare", "payer", "provider", "clinical", "privacy", "grc", "compliance"])) {
    return "regulated_domain";
  }
  if (role.role_type === "architecture" || includesAny(text, ["architecture", "security", "iam", "soc", "zero trust"])) {
    return "architecture_security";
  }
  if (includesAny(text, ["engineer", "developer", "admin", "platform", "cloud", "data", "integration", "workday", "servicenow", "snowflake", "databricks", "qa", "automation"])) {
    return "platform_delivery";
  }
  return "commodity_delivery";
}

function providerAllowed(providerCode, shore, group) {
  if (providerCode === "INTERNAL") return { eligibility: "eligible", review: "false" };
  if (group === "executive_advisory") {
    if (shore === "onshore") return { eligibility: ["CONS-T1", "SI-T1"].includes(providerCode) ? "eligible" : "not_eligible", review: "false" };
    if (shore === "nearshore") return { eligibility: ["CONS-T1", "SI-T1"].includes(providerCode) ? "conditional_review" : "not_eligible", review: "true" };
    return { eligibility: "not_eligible", review: "false" };
  }
  if (group === "regulated_domain" || group === "architecture_security") {
    if (shore === "onshore") return { eligibility: providerCode === "SI-T2" ? "conditional_review" : "eligible", review: providerCode === "SI-T2" ? "true" : "false" };
    if (shore === "nearshore") return { eligibility: ["SI-T1", "SI-T2", "ENG-B", "AI-B"].includes(providerCode) ? "conditional_review" : "not_eligible", review: "true" };
    return { eligibility: "not_eligible", review: "false" };
  }
  if (group === "platform_delivery") {
    if (providerCode === "CONS-T1" && shore === "offshore") return { eligibility: "not_eligible", review: "false" };
    return { eligibility: shore === "onshore" ? "eligible" : "conditional_review", review: shore === "onshore" ? "false" : "true" };
  }
  if (group === "commodity_delivery") {
    if (providerCode === "CONS-T1" && shore === "offshore") return { eligibility: "not_eligible", review: "false" };
    return { eligibility: "eligible", review: "false" };
  }
  return { eligibility: "not_eligible", review: "false" };
}

function buildAssets() {
  const towers = readCsv("pricing_towers.csv");
  const capabilities = readCsv("pricing_capabilities.csv");
  const roleFamilies = readCsv("pricing_role_families.csv");
  const roles = readCsv("pricing_roles.csv");
  const levels = readCsv("pricing_seniority_levels.csv");
  const rateBands = readCsv("pricing_rate_bands.csv");
  const providers = readCsv("pricing_provider_classes.csv");
  const locations = readCsv("pricing_delivery_locations.csv");

  for (const [fileName, rows, key] of [
    ["pricing_towers.csv", towers, "tower_code"],
    ["pricing_capabilities.csv", capabilities, "capability_code"],
    ["pricing_role_families.csv", roleFamilies, "role_family_code"],
    ["pricing_roles.csv", roles, "role_code"],
    ["pricing_seniority_levels.csv", levels, "level_code"],
    ["pricing_rate_bands.csv", rateBands, "rate_band_code"],
    ["pricing_provider_classes.csv", providers, "provider_class_code"],
    ["pricing_delivery_locations.csv", locations, "location_code"],
  ]) {
    assertUnique(rows, key, fileName);
  }

  const towerByCode = keyBy(towers, "tower_code");
  const capabilityByCode = keyBy(capabilities, "capability_code");
  const familyByCode = keyBy(roleFamilies, "role_family_code");
  const roleByCode = keyBy(roles, "role_code");
  const levelByCode = keyBy(levels, "level_code");
  const siT1 = providers.find((provider) => provider.provider_class_code === "SI-T1");
  if (!siT1) throw new Error("pricing_provider_classes.csv: missing SI-T1 baseline provider");
  const siT1Multiplier = numeric(siT1.tier_multiplier, "SI-T1 tier_multiplier");
  const activeProviders = providers.filter((provider) => provider.status === "active").sort((a, b) => a.provider_class_code.localeCompare(b.provider_class_code));
  const providersWithInternal = [INTERNAL_PROVIDER, ...activeProviders];
  const activeLocations = locations.filter((location) => location.status === "active").sort((a, b) => a.location_code.localeCompare(b.location_code));

  const technologies = TECHNOLOGIES.map(([technology_code, technology_name, technology_family, vendor_or_standard, domain, industry_relevance, regulated_data_touchpoint]) => ({
    technology_code,
    technology_name,
    technology_family,
    vendor_or_standard,
    domain,
    industry_relevance,
    regulated_data_touchpoint,
    source_artifact: "hand-authored-global-pricing-extension",
    status: "active",
    version: EXTENSION_VERSION,
    notes: "Reference technology for role relevance and Moves solution-pricing selection.",
  }));
  const techByCode = keyBy(technologies, "technology_code");

  const roleContext = new Map();
  const roleTechnologyMap = [];
  for (const role of roles.filter((r) => r.status === "active")) {
    const tower = towerByCode.get(role.tower_code);
    const capability = capabilityByCode.get(role.capability_code);
    const family = familyByCode.get(role.role_family_code);
    if (!tower || !capability || !family) throw new Error(`Role ${role.role_code} has invalid taxonomy references`);
    const techCodes = mapTechnologiesForRole(role, capability, tower);
    const deliveryGroup = roleDeliveryGroup(role, capability, tower);
    roleContext.set(role.role_code, { tower, capability, family, techCodes, deliveryGroup });
    for (const technologyCode of techCodes) {
      const tech = techByCode.get(technologyCode);
      if (!tech) throw new Error(`Role ${role.role_code} mapped to unknown technology ${technologyCode}`);
      const overlayCode = HEALTHCARE_OVERLAY_TECH_CODES.has(technologyCode) ? "IND-HEALTHCARE-001" : "";
      roleTechnologyMap.push({
        map_code: `RTM-${role.role_code}-${technologyCode}`,
        role_code: role.role_code,
        canonical_role_name: role.canonical_name,
        capability_code: capability.capability_code,
        capability_name: capability.capability_name,
        technology_code: technologyCode,
        technology_name: tech.technology_name,
        industry_overlay_code: overlayCode,
        relevance: overlayCode ? "healthcare_first_overlay" : "global_reference",
        delivery_constraint: deliveryGroup,
        source_artifact: "derived: pricing_roles + pricing_capabilities + pricing_technologies",
        status: "active",
        version: EXTENSION_VERSION,
        notes: "Maps canonical global roles to technology relevance; does not redefine the role taxonomy.",
      });
    }
  }
  roleTechnologyMap.sort((a, b) => a.map_code.localeCompare(b.map_code));

  const industryOverlays = technologies
    .filter((tech) => HEALTHCARE_OVERLAY_TECH_CODES.has(tech.technology_code))
    .map((tech, index) => {
      const relatedMaps = roleTechnologyMap.filter((map) => map.technology_code === tech.technology_code);
      return {
        overlay_code: `IND-HEALTHCARE-${String(index + 1).padStart(3, "0")}`,
        industry_code: "healthcare",
        industry_name: "Healthcare payer/provider",
        technology_code: tech.technology_code,
        technology_name: tech.technology_name,
        relevant_tower_codes: [...new Set(relatedMaps.map((map) => roleByCode.get(map.role_code)?.tower_code).filter(Boolean))].sort().join("|"),
        relevant_capability_codes: [...new Set(relatedMaps.map((map) => map.capability_code))].sort().join("|"),
        required_shore_policy: ["restricted_phi_possible", "claims_and_member_data"].includes(tech.regulated_data_touchpoint)
          ? "onshore_default_nearshore_review_offshore_blocked"
          : "global_eligibility_applies",
        rate_source_kind: "industry_overlay",
        confidence_adjustment: "no_price_override",
        approval_status: "global_starter_unapproved",
        status: "active",
        version: EXTENSION_VERSION,
        notes: "Healthcare overlay constrains and enriches role/technology relevance; it does not create committed commercial rates.",
      };
    });

  const groups = ["executive_advisory", "regulated_domain", "architecture_security", "platform_delivery", "commodity_delivery"];
  const providerLocationEligibility = [];
  for (const provider of providersWithInternal) {
    for (const location of activeLocations) {
      for (const group of groups) {
        const decision = providerAllowed(provider.provider_class_code, location.shore_category, group);
        providerLocationEligibility.push({
          eligibility_code: `ELIG-${provider.provider_class_code}-${location.location_code}-${group.toUpperCase().replace(/_/g, "-")}`,
          provider_class_code: provider.provider_class_code,
          provider_class_name: provider.class_name,
          location_code: location.location_code,
          location_name: location.region_name,
          shore_category: location.shore_category,
          role_delivery_group: group,
          eligibility: decision.eligibility,
          requires_manual_review: decision.review,
          source_artifact: "hand-authored-global-pricing-extension",
          status: "active",
          version: EXTENSION_VERSION,
          notes: "Explicit provider/location/role eligibility contract used before materializing rates.",
        });
      }
    }
  }
  const eligibilityByKey = keyBy(
    providerLocationEligibility,
    "eligibility_code",
  );

  const rateSelectionPolicies = RATE_SELECTION_POLICIES.map((policy) => ({
    ...policy,
    status: "active",
    version: EXTENSION_VERSION,
  }));

  const materializedInternalRates = [];
  const materializedProviderRates = [];
  for (const rateBand of rateBands.filter((row) => row.status === "active")) {
    const role = roleByCode.get(rateBand.role_code);
    const level = levelByCode.get(rateBand.level_code);
    if (!role || !level) throw new Error(`Rate band ${rateBand.rate_band_code} has invalid role/level`);
    const context = roleContext.get(role.role_code);
    const loadedRate = numeric(rateBand.loaded_rate, `${rateBand.rate_band_code} loaded_rate`);
    const scarcityRate = numeric(rateBand.scarcity_adj_rate, `${rateBand.rate_band_code} scarcity_adj_rate`);
    const billRate = numeric(rateBand.indicative_bill_rate, `${rateBand.rate_band_code} indicative_bill_rate`);
    const techCodes = context.techCodes.join("|");

    for (const location of activeLocations) {
      const salaryMultiplier = numeric(location.salary_multiplier, `${location.location_code} salary_multiplier`);
      const loadedLocationRate = loadedRate * salaryMultiplier;
      const scarcityLocationRate = scarcityRate * salaryMultiplier;
      materializedInternalRates.push({
        rate_line_id: `INT-${rateBand.rate_band_code}-${location.location_code}`,
        scope: "global",
        tenant_key: "",
        client_applicability: "all_tenants_default_until_client_override",
        role_code: role.role_code,
        canonical_role_name: role.canonical_name,
        level_code: level.level_code,
        level_name: level.level_name,
        tower_code: context.tower.tower_code,
        tower_name: context.tower.tower_name,
        capability_code: context.capability.capability_code,
        capability_name: context.capability.capability_name,
        role_family_code: context.family.role_family_code,
        role_family_name: context.family.family_name,
        role_type: role.role_type,
        role_delivery_group: context.deliveryGroup,
        technology_codes: techCodes,
        location_code: location.location_code,
        location_name: location.region_name,
        shore_category: location.shore_category,
        rate_type: "internal_loaded_and_scarcity_adjusted_cost",
        currency: rateBand.currency,
        rate_unit: rateBand.rate_unit,
        base_loaded_rate_usd_per_hour: roundMoney(loadedRate),
        base_scarcity_adjusted_rate_usd_per_hour: roundMoney(scarcityRate),
        salary_multiplier: roundMultiplier(salaryMultiplier),
        planning_rate_low_usd_per_hour: roundMoney(loadedLocationRate),
        planning_rate_base_usd_per_hour: roundMoney(scarcityLocationRate),
        planning_rate_high_usd_per_hour: roundMoney(scarcityLocationRate),
        internal_loaded_rate_usd_per_hour: roundMoney(loadedLocationRate),
        internal_scarcity_adjusted_rate_usd_per_hour: roundMoney(scarcityLocationRate),
        partner_buy_rate_usd_per_hour: "",
        abarva_sell_rate_usd_per_hour: "",
        source_rate_band_code: rateBand.rate_band_code,
        source_formula: "loaded_rate * salary_multiplier; scarcity_adj_rate * salary_multiplier",
        confidence: rateBand.confidence,
        approval_status: rateBand.approval_status,
        status: "active",
        version: EXTENSION_VERSION,
        notes: "Planning assumption only. Tenant internal loaded-cost source supersedes this global default.",
      });

      for (const provider of activeProviders) {
        const eligibilityCode = `ELIG-${provider.provider_class_code}-${location.location_code}-${context.deliveryGroup.toUpperCase().replace(/_/g, "-")}`;
        const eligibility = eligibilityByKey.get(eligibilityCode);
        if (!eligibility || eligibility.eligibility === "not_eligible") continue;
        const locationRateMultiplier = numeric(location.rate_multiplier, `${location.location_code} rate_multiplier`);
        const targetProviderMultiplier = numeric(provider.tier_multiplier, `${provider.provider_class_code} tier_multiplier`);
        const ratio = targetProviderMultiplier / siT1Multiplier;
        const partnerBillRate = billRate * locationRateMultiplier * ratio;
        materializedProviderRates.push({
          rate_line_id: `PRV-${rateBand.rate_band_code}-${provider.provider_class_code}-${location.location_code}`,
          scope: "global",
          tenant_key: "",
          client_applicability: "all_tenants_default_until_client_override",
          role_code: role.role_code,
          canonical_role_name: role.canonical_name,
          level_code: level.level_code,
          level_name: level.level_name,
          tower_code: context.tower.tower_code,
          tower_name: context.tower.tower_name,
          capability_code: context.capability.capability_code,
          capability_name: context.capability.capability_name,
          role_family_code: context.family.role_family_code,
          role_family_name: context.family.family_name,
          role_type: role.role_type,
          role_delivery_group: context.deliveryGroup,
          technology_codes: techCodes,
          provider_class_code: provider.provider_class_code,
          provider_class_name: provider.class_name,
          provider_archetype_label: provider.archetype_label,
          location_code: location.location_code,
          location_name: location.region_name,
          shore_category: location.shore_category,
          rate_type: eligibility.eligibility === "conditional_review" ? "partner_market_bill_rate_requires_review" : "partner_market_bill_rate",
          currency: rateBand.currency,
          rate_unit: rateBand.rate_unit,
          base_indicative_bill_rate_usd_per_hour: roundMoney(billRate),
          location_rate_multiplier: roundMultiplier(locationRateMultiplier),
          si_t1_multiplier: roundMultiplier(siT1Multiplier),
          target_provider_multiplier: roundMultiplier(targetProviderMultiplier),
          provider_multiplier_ratio_vs_si_t1: roundMultiplier(ratio),
          planning_rate_low_usd_per_hour: roundMoney(partnerBillRate),
          planning_rate_base_usd_per_hour: roundMoney(partnerBillRate),
          planning_rate_high_usd_per_hour: roundMoney(partnerBillRate),
          partner_market_bill_rate_usd_per_hour: roundMoney(partnerBillRate),
          partner_buy_rate_usd_per_hour: "",
          abarva_sell_rate_usd_per_hour: "",
          source_rate_band_code: rateBand.rate_band_code,
          source_formula: "indicative_bill_rate * location_rate_multiplier * (target_provider_multiplier / SI_T1_multiplier)",
          eligibility_code: eligibilityCode,
          confidence: rateBand.confidence,
          approval_status: rateBand.approval_status,
          status: "active",
          version: EXTENSION_VERSION,
          notes: "Planning assumption only. Deal, tenant, or vendor-specific approved rates supersede this global default.",
        });
      }
    }
  }

  return {
    [FILES.technologies]: technologies.sort((a, b) => a.technology_code.localeCompare(b.technology_code)),
    [FILES.roleTechnologyMap]: roleTechnologyMap,
    [FILES.providerLocationEligibility]: providerLocationEligibility.sort((a, b) => a.eligibility_code.localeCompare(b.eligibility_code)),
    [FILES.materializedInternalRates]: materializedInternalRates.sort((a, b) => a.rate_line_id.localeCompare(b.rate_line_id)),
    [FILES.materializedProviderRates]: materializedProviderRates.sort((a, b) => a.rate_line_id.localeCompare(b.rate_line_id)),
    [FILES.rateSelectionPolicies]: rateSelectionPolicies.sort((a, b) => Number(a.precedence_rank) - Number(b.precedence_rank)),
    [FILES.industryOverlays]: industryOverlays.sort((a, b) => a.overlay_code.localeCompare(b.overlay_code)),
  };
}

function duplicateKeys(rows, fields) {
  const seen = new Map();
  const duplicates = [];
  for (const row of rows) {
    const key = fields.map((field) => row[field] ?? "").join("||");
    if (seen.has(key)) duplicates.push(key);
    seen.set(key, true);
  }
  return duplicates;
}

function validateAssets(assets) {
  const errors = [];
  const roles = readCsv("pricing_roles.csv");
  const levels = readCsv("pricing_seniority_levels.csv");
  const rateBands = readCsv("pricing_rate_bands.csv");
  const providers = readCsv("pricing_provider_classes.csv");
  const locations = readCsv("pricing_delivery_locations.csv");
  const siT1 = providers.find((provider) => provider.provider_class_code === "SI-T1");
  const siT1Multiplier = numeric(siT1?.tier_multiplier, "SI-T1 tier_multiplier");
  const roleCodes = new Set(roles.map((row) => row.role_code));
  const levelCodes = new Set(levels.map((row) => row.level_code));
  const rateBandByCode = keyBy(rateBands, "rate_band_code");
  const techCodes = new Set(assets[FILES.technologies].map((row) => row.technology_code));
  const providerCodes = new Set(providers.map((row) => row.provider_class_code));
  const locationByCode = keyBy(locations, "location_code");
  const eligibilityByCode = keyBy(assets[FILES.providerLocationEligibility], "eligibility_code");

  for (const [fileName, idField] of [
    [FILES.technologies, "technology_code"],
    [FILES.roleTechnologyMap, "map_code"],
    [FILES.providerLocationEligibility, "eligibility_code"],
    [FILES.materializedInternalRates, "rate_line_id"],
    [FILES.materializedProviderRates, "rate_line_id"],
    [FILES.rateSelectionPolicies, "policy_code"],
    [FILES.industryOverlays, "overlay_code"],
  ]) {
    const duplicates = duplicateKeys(assets[fileName], [idField]);
    if (duplicates.length > 0) errors.push(`${fileName}: duplicate ${idField}: ${duplicates.slice(0, 3).join(", ")}`);
  }

  for (const row of assets[FILES.roleTechnologyMap]) {
    if (!roleCodes.has(row.role_code)) errors.push(`${FILES.roleTechnologyMap}: invalid role_code ${row.role_code}`);
    if (!techCodes.has(row.technology_code)) errors.push(`${FILES.roleTechnologyMap}: invalid technology_code ${row.technology_code}`);
  }

  for (const row of [...assets[FILES.materializedInternalRates], ...assets[FILES.materializedProviderRates]]) {
    if (!roleCodes.has(row.role_code)) errors.push(`${row.rate_line_id}: invalid role_code ${row.role_code}`);
    if (!levelCodes.has(row.level_code)) errors.push(`${row.rate_line_id}: invalid level_code ${row.level_code}`);
    if (!rateBandByCode.has(row.source_rate_band_code)) errors.push(`${row.rate_line_id}: invalid source_rate_band_code ${row.source_rate_band_code}`);
    for (const technologyCode of String(row.technology_codes || "").split("|").filter(Boolean)) {
      if (!techCodes.has(technologyCode)) errors.push(`${row.rate_line_id}: invalid materialized technology ${technologyCode}`);
    }
  }

  const internalDuplicateKeys = duplicateKeys(assets[FILES.materializedInternalRates], [
    "scope",
    "role_code",
    "level_code",
    "location_code",
    "rate_type",
    "source_rate_band_code",
  ]);
  if (internalDuplicateKeys.length > 0) errors.push(`${FILES.materializedInternalRates}: duplicate composite rate key`);

  const providerDuplicateKeys = duplicateKeys(assets[FILES.materializedProviderRates], [
    "scope",
    "role_code",
    "level_code",
    "provider_class_code",
    "location_code",
    "rate_type",
    "source_rate_band_code",
  ]);
  if (providerDuplicateKeys.length > 0) errors.push(`${FILES.materializedProviderRates}: duplicate composite rate key`);

  for (const row of assets[FILES.materializedProviderRates]) {
    if (!providerCodes.has(row.provider_class_code)) errors.push(`${row.rate_line_id}: invalid provider_class_code ${row.provider_class_code}`);
    const eligibility = eligibilityByCode.get(row.eligibility_code);
    if (!eligibility || eligibility.eligibility === "not_eligible") errors.push(`${row.rate_line_id}: invalid provider/location eligibility`);
    const source = rateBandByCode.get(row.source_rate_band_code);
    const expected =
      numeric(source.indicative_bill_rate, `${source.rate_band_code} indicative_bill_rate`) *
      numeric(row.location_rate_multiplier, `${row.rate_line_id} location_rate_multiplier`) *
      (numeric(row.target_provider_multiplier, `${row.rate_line_id} target_provider_multiplier`) / siT1Multiplier);
    if (Math.abs(numeric(row.partner_market_bill_rate_usd_per_hour, `${row.rate_line_id} partner_market_bill_rate`) - Number(roundMoney(expected))) > 0.005) {
      errors.push(`${row.rate_line_id}: provider rate formula mismatch`);
    }
    if (row.provider_class_code === "SI-T1") {
      const expectedSiT1 =
        numeric(source.indicative_bill_rate, `${source.rate_band_code} indicative_bill_rate`) *
        numeric(row.location_rate_multiplier, `${row.rate_line_id} location_rate_multiplier`);
      if (Math.abs(numeric(row.partner_market_bill_rate_usd_per_hour, `${row.rate_line_id} partner_market_bill_rate`) - Number(roundMoney(expectedSiT1))) > 0.005) {
        errors.push(`${row.rate_line_id}: SI-T1 double-count guard failed`);
      }
    }
  }

  for (const row of assets[FILES.materializedInternalRates]) {
    const source = rateBandByCode.get(row.source_rate_band_code);
    const location = locationByCode.get(row.location_code);
    if (!location) errors.push(`${row.rate_line_id}: invalid location_code ${row.location_code}`);
    const salaryMultiplier = numeric(location.salary_multiplier, `${location.location_code} salary_multiplier`);
    const expectedLoaded = numeric(source.loaded_rate, `${source.rate_band_code} loaded_rate`) * salaryMultiplier;
    const expectedScarcity = numeric(source.scarcity_adj_rate, `${source.rate_band_code} scarcity_adj_rate`) * salaryMultiplier;
    if (Math.abs(numeric(row.internal_loaded_rate_usd_per_hour, `${row.rate_line_id} internal_loaded_rate`) - Number(roundMoney(expectedLoaded))) > 0.005) {
      errors.push(`${row.rate_line_id}: internal loaded-rate location normalization mismatch`);
    }
    if (Math.abs(numeric(row.internal_scarcity_adjusted_rate_usd_per_hour, `${row.rate_line_id} internal_scarcity_rate`) - Number(roundMoney(expectedScarcity))) > 0.005) {
      errors.push(`${row.rate_line_id}: internal scarcity-adjusted location normalization mismatch`);
    }
  }

  for (const shore of ["onshore", "nearshore", "offshore"]) {
    if (!assets[FILES.providerLocationEligibility].some((row) => row.shore_category === shore && row.eligibility !== "not_eligible")) {
      errors.push(`${FILES.providerLocationEligibility}: missing eligible ${shore} coverage`);
    }
    if (!assets[FILES.materializedInternalRates].some((row) => row.shore_category === shore)) {
      errors.push(`${FILES.materializedInternalRates}: missing ${shore} coverage`);
    }
    if (!assets[FILES.materializedProviderRates].some((row) => row.shore_category === shore)) {
      errors.push(`${FILES.materializedProviderRates}: missing ${shore} coverage`);
    }
  }

  const policyRanks = assets[FILES.rateSelectionPolicies].map((row) => Number(row.precedence_rank));
  const policyKinds = assets[FILES.rateSelectionPolicies].map((row) => row.rate_source_kind);
  if (new Set(policyRanks).size !== policyRanks.length) errors.push(`${FILES.rateSelectionPolicies}: duplicate precedence_rank`);
  if (new Set(policyKinds).size !== policyKinds.length) errors.push(`${FILES.rateSelectionPolicies}: duplicate rate_source_kind`);
  const expectedOrder = ["deal_override", "tenant_contracted_rate", "tenant_internal_rate", "industry_overlay", "global_reference"];
  if (policyKinds.join("|") !== expectedOrder.join("|")) errors.push(`${FILES.rateSelectionPolicies}: precedence order conflict`);
  for (const row of assets[FILES.rateSelectionPolicies]) {
    if (!row.required_evidence || row.required_evidence === "true" || row.required_evidence === "false") {
      errors.push(`${FILES.rateSelectionPolicies}: ${row.policy_code} has invalid required_evidence`);
    }
    if (!["true", "false"].includes(row.allow_unapproved)) {
      errors.push(`${FILES.rateSelectionPolicies}: ${row.policy_code} has invalid allow_unapproved`);
    }
    if (!["true", "false"].includes(row.eligible_for_committed_solution_price)) {
      errors.push(`${FILES.rateSelectionPolicies}: ${row.policy_code} has invalid eligible_for_committed_solution_price`);
    }
  }

  const unsupportedCommittedLanguage = /\b(guaranteed price|committed savings|approved commercial rate|contracted price)\b/i;
  for (const [fileName, rows] of Object.entries(assets)) {
    if (![FILES.materializedInternalRates, FILES.materializedProviderRates, FILES.industryOverlays].includes(fileName)) continue;
    const badRow = rows.find((row) => unsupportedCommittedLanguage.test(Object.values(row).join(" ")));
    if (badRow) errors.push(`${fileName}: unsupported committed-price language in ${badRow.rate_line_id || badRow.overlay_code}`);
  }

  if (errors.length > 0) throw new Error(`Global pricing extension validation failed:\n- ${errors.join("\n- ")}`);
}

function writeAssets(assets) {
  const checksums = {};
  const rowCounts = {};
  for (const [fileName, rows] of Object.entries(assets)) {
    const csv = toCsv(fileName, rows);
    fs.writeFileSync(path.join(packDir, fileName), csv, "utf8");
    rowCounts[fileName] = rows.length;
    checksums[fileName] = sha256Hex(csv);
  }
  return { checksums, rowCounts };
}

function assertFilesCurrent(assets) {
  const checksums = {};
  const rowCounts = {};
  for (const [fileName, rows] of Object.entries(assets)) {
    const expectedCsv = toCsv(fileName, rows);
    const filePath = path.join(packDir, fileName);
    const actualCsv = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    if (actualCsv !== expectedCsv) {
      throw new Error(`${fileName} is out of date; run npm run pricing:generate-global-rate-card-extension`);
    }
    rowCounts[fileName] = rows.length;
    checksums[fileName] = sha256Hex(expectedCsv);
  }
  return { checksums, rowCounts };
}

function updateManifest(rowCounts, checksums) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.derived_reference_objects = {
    ...(manifest.derived_reference_objects ?? {}),
    global_moves_pricing_extension: {
      version: EXTENSION_VERSION,
      generated_at: GENERATED_AT,
      generation_script: "scripts/pricing/generate-global-rate-card-extension.mjs",
      purpose:
        "Global AbarVa pricing asset for Moves solution pricing across tenants. Tenant, vendor, deal, or SOW-specific rates supersede these planning defaults.",
      formula_contract: {
        provider_bill_rate:
          "indicative_bill_rate * location_rate_multiplier * (target_provider_multiplier / SI_T1_multiplier)",
        internal_loaded_rate: "loaded_rate * salary_multiplier",
        internal_scarcity_adjusted_rate: "scarcity_adj_rate * salary_multiplier",
      },
      update_contract:
        "Client changed files should be reprocessed through governed parse, validation, diff preview, approval, and new version creation. Draft/open Moves can be repriced from the new effective version; approved historical pricing snapshots remain frozen unless explicitly revised.",
      row_counts: rowCounts,
      file_checksums_sha256: checksums,
      governance:
        "Planning-grade reference data only; does not change Moves runtime, load a database, deploy, or activate pricing.",
    },
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function validateManifest(rowCounts, checksums) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const recorded = manifest.derived_reference_objects?.global_moves_pricing_extension;
  if (!recorded) throw new Error("manifest.json missing derived_reference_objects.global_moves_pricing_extension");
  for (const fileName of Object.values(FILES)) {
    if (recorded.row_counts?.[fileName] !== rowCounts[fileName]) {
      throw new Error(`manifest row_count mismatch for ${fileName}`);
    }
    if (recorded.file_checksums_sha256?.[fileName] !== checksums[fileName]) {
      throw new Error(`manifest checksum mismatch for ${fileName}`);
    }
  }
}

function summarize(assets, checksums, mode) {
  const healthcareRoleMaps = assets[FILES.roleTechnologyMap].filter((row) => row.industry_overlay_code).length;
  const providerRows = assets[FILES.materializedProviderRates];
  const internalRows = assets[FILES.materializedInternalRates];
  const summary = {
    mode,
    output_dir: packDir,
    files: Object.fromEntries(Object.entries(assets).map(([fileName, rows]) => [fileName, rows.length])),
    healthcare_role_technology_mappings: healthcareRoleMaps,
    provider_rows_by_shore: Object.fromEntries(["onshore", "nearshore", "offshore"].map((shore) => [shore, providerRows.filter((row) => row.shore_category === shore).length])),
    internal_rows_by_shore: Object.fromEntries(["onshore", "nearshore", "offshore"].map((shore) => [shore, internalRows.filter((row) => row.shore_category === shore).length])),
    checksums,
  };
  console.log(JSON.stringify(summary, null, 2));
}

function main() {
  const check = process.argv.includes("--check");
  const assets = buildAssets();
  validateAssets(assets);
  const { checksums, rowCounts } = check ? assertFilesCurrent(assets) : writeAssets(assets);
  if (check) validateManifest(rowCounts, checksums);
  else updateManifest(rowCounts, checksums);
  summarize(assets, checksums, check ? "check" : "write");
}

main();

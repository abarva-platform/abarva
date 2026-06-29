#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TENANT_PROFILES = {
  "apex-retail-synthetic-v6": {
    tenantKey: "apex-retail",
    demoName: "Retail Demo",
    industry: "Retail",
    ownerPrefix: "Retail",
    systems: ["Order Management", "Store POS", "Inventory", "Loyalty", "Pricing", "Merchandising"],
    capabilities: ["Omnichannel selling", "Store operations", "Inventory accuracy", "Customer loyalty", "Retail pricing", "Merchandising"],
  },
  "first-capital-financial-synthetic-v6": {
    tenantKey: "first-capital",
    demoName: "Financial Services Demo",
    industry: "Financial services",
    ownerPrefix: "Financial Services",
    systems: ["Core Banking", "Payments Hub", "Wealth CRM", "Risk Analytics", "Loan Origination", "Treasury"],
    capabilities: ["Client servicing", "Payments", "Advisor productivity", "Risk management", "Credit workflow", "Liquidity management"],
  },
  "lakeshore-industries-synthetic-v6": {
    tenantKey: "lakeshore-industries",
    demoName: "Industrial Demo",
    industry: "Industrial manufacturing",
    ownerPrefix: "Industrial",
    systems: ["SAP Manufacturing", "Plant MES", "Treasury Workstation", "Supplier Portal", "Quality Management", "Field Service"],
    capabilities: ["Manufacturing operations", "Plant execution", "Treasury controls", "Supplier collaboration", "Quality management", "Service operations"],
  },
  "meridian-health-synthetic-v6": {
    tenantKey: "meridian-health",
    demoName: "Healthcare Demo",
    industry: "Healthcare",
    ownerPrefix: "Healthcare",
    systems: ["Epic EHR", "Revenue Cycle", "Care Coordination", "Claims Analytics", "Patient Access", "Clinical Data Platform"],
    capabilities: ["Clinical operations", "Revenue cycle", "Care management", "Claims intelligence", "Patient access", "Clinical data governance"],
  },
  "skyharbor-air-synthetic-v6": {
    tenantKey: "skyharbor-air",
    demoName: "Airline Demo",
    industry: "Airline",
    ownerPrefix: "Airline",
    systems: ["Reservations", "Crew Operations", "Flight Operations", "Loyalty", "Maintenance", "Irregular Operations"],
    capabilities: ["Passenger servicing", "Crew productivity", "Operational recovery", "Customer loyalty", "Maintenance planning", "IROPS response"],
  },
};

const OLD_NAME_REPLACEMENTS = [
  [/Apex Retail Group|Apex Retail/gi, "Retail Demo"],
  [/First Capital Financial|First Capital|Arcturus Financial Group|Arcturus/gi, "Financial Services Demo"],
  [/Lakeshore Industries|Lakeshore Holdings|Lakeshore/gi, "Industrial Demo"],
  [/Meridian Health System|Meridian Health/gi, "Healthcare Demo"],
  [/SkyHarbor Air Group|SkyHarbor Airlines|SkyHarbor Air|SkyHarbor/gi, "Airline Demo"],
];

const LENSES = [
  {
    id: "expert-lens-value-proof",
    name: "Value Proof Lens",
    domain: "Value proof and benefit realization",
    conditions: "Use when an initiative claims productivity, cost, revenue, or risk value.",
    questions: "What metric proves value? Who owns the baseline? What period and population are measured?",
    forbidden: "Do not call value realized without measured baseline, time period, owner, and adoption evidence.",
  },
  {
    id: "expert-lens-operating-change",
    name: "Operating Change Lens",
    domain: "Process, role, and decision redesign",
    conditions: "Use when AI or automation is proposed without clear work redesign.",
    questions: "Which decisions change? Which workflows change? Which roles, controls, and handoffs change?",
    forbidden: "Do not imply AI success from tool deployment alone.",
  },
  {
    id: "expert-lens-data-readiness",
    name: "Data Readiness Lens",
    domain: "Data quality, lineage, semantic ownership, and evidence controls",
    conditions: "Use when answers depend on systems, analytics, AI readiness, or board-grade reporting.",
    questions: "What is the system of record? Who owns the definition? What freshness and lineage are certified?",
    forbidden: "Do not recommend scale when source data ownership, lineage, or quality evidence is absent.",
  },
  {
    id: "expert-lens-vendor-economics",
    name: "Vendor Economics Lens",
    domain: "Commercial value, renewal exposure, and vendor dependency",
    conditions: "Use when spend, contract, sourcing, renewal, or platform consolidation is in scope.",
    questions: "What is the committed spend? What renews next? What business capability depends on the vendor?",
    forbidden: "Do not make sourcing recommendations without renewal, owner, service, risk, and pricing-basis evidence.",
  },
];

const TECHNICAL_NAME_REPLACEMENT_SKIP = new Set([
  "tenant_key",
  "v6_contract_version",
  "business_object_family",
  "record_id",
  "source_system",
  "source_file",
  "source_row_number",
  "created_at",
  "updated_at",
]);

const args = parseArgs(process.argv.slice(2));
const datasetRoot = path.resolve(args.datasetRoot ?? path.join(process.cwd(), "datasets"));
const tenants = Object.keys(TENANT_PROFILES);
const now = new Date().toISOString();

main();

function main() {
  const summary = [];
  for (const tenantDir of tenants) {
    const profile = TENANT_PROFILES[tenantDir];
    const root = path.join(datasetRoot, tenantDir);
    const templatesRoot = path.join(root, "templates");
    if (!fs.existsSync(templatesRoot)) continue;
    let changedCells = 0;
    for (const filename of fs.readdirSync(templatesRoot).filter((file) => file.endsWith(".csv"))) {
      const filePath = path.join(templatesRoot, filename);
      const { headers, records } = parseCsvWithHeaders(fs.readFileSync(filePath, "utf8"));
      for (const [index, record] of records.entries()) {
        changedCells += remediateCommon(record, profile, filename, index);
        changedCells += remediateByFile(record, profile, filename, index);
        changedCells += cleanKnownGaps(record);
      }
      fs.writeFileSync(filePath, renderCsv(headers, records));
    }
    changedCells += replaceOldNamesInFile(path.join(root, "V6_BUSINESS_METADATA_DICTIONARY.csv"), profile);
    changedCells += replaceOldNamesInFile(path.join(root, "README.md"), profile);
    updateManifest(root, profile);
    summary.push({ tenantDir, changedCells });
  }
  const templatePackChanged = remediateTemplatePack(
    path.join(datasetRoot, "enterprise-intelligence-template-pack-v6"),
  );
  if (templatePackChanged > 0) {
    summary.push({
      tenantDir: "enterprise-intelligence-template-pack-v6",
      changedCells: templatePackChanged,
    });
  }
  console.log(JSON.stringify({ datasetRoot, generatedAt: now, tenants: summary }, null, 2));
}

function remediateCommon(record, profile, filename, index) {
  let changed = 0;
  changed += set(record, "tenant_key", profile.tenantKey);
  changed += set(record, "client_display_name", profile.demoName);
  changed += replaceCorruptedTenantKeyResidue(record, profile);
  changed += setIfMissing(record, "source_owner", ownerFor(record, profile));
  changed += replaceOldNames(record);
  if (record.company_name !== undefined) changed += set(record, "company_name", profile.demoName);
  if (record.industry !== undefined) changed += setIfMissing(record, "industry", profile.industry);
  if (record.record_name !== undefined && isGenericRecord(record.record_name)) {
    changed += set(record, "record_name", recordNameFor(filename, profile, index));
  }
  if (record.updated_at !== undefined) changed += set(record, "updated_at", now);
  return changed;
}

function remediateByFile(record, profile, filename, index) {
  if (filename === "V6_01_enterprise_profile.csv") return fillEnterprise(record, profile);
  if (filename === "V6_02_business_functions.csv") return fillBusinessFunction(record, profile, index);
  if (filename === "V6_03_org_ownership.csv") return fillOrg(record, profile, index);
  if (filename === "V6_04_workforce_personas.csv") return fillPersona(record, profile, index);
  if (filename === "V6_05_applications_systems.csv") return fillApplication(record, profile, index);
  if (filename === "V6_06_data_assets_integrations.csv") return fillDataAsset(record, profile, index);
  if (filename === "V6_07_vendors_contracts.csv") return fillVendor(record, profile, index);
  if (filename === "V6_08_spend_value.csv") return fillSpend(record, profile, index);
  if (filename === "V6_09_programs_initiatives.csv") return fillProgram(record, profile, index);
  if (filename === "V6_10_ai_initiatives.csv") return fillAi(record, profile, index);
  if (filename === "V6_11_operations_risk_controls.csv") return fillOps(record, profile, index);
  if (filename === "V6_12_relationships.csv") return fillRelationship(record, profile, index);
  if (filename === "V6_13_evidence_sources.csv") return fillEvidence(record, profile, index);
  if (filename === "V6_14_metric_definitions.csv") return fillMetric(record, profile, index);
  if (filename === "V6_15_industry_corpus_patterns.csv") return fillIndustryPattern(record, profile, index);
  if (filename === "V6_16_expert_lenses.csv") return fillExpertLens(record, profile, index);
  return 0;
}

function fillEnterprise(record, profile) {
  let changed = 0;
  changed += setIfMissing(record, "sub_industry", `${profile.industry} operating model`);
  changed += setIfMissing(record, "revenue_usd", "12500000000");
  changed += setIfMissing(record, "employee_count", "42000");
  changed += setIfMissing(record, "business_model", `${profile.industry} enterprise with distributed operations and shared technology services`);
  changed += setIfMissing(record, "strategic_priorities", "Modernize core platforms; improve data readiness; scale AI where adoption and value are proven");
  return changed;
}

function fillBusinessFunction(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "function_name", pick(["Operations", "Finance", "Technology", "Commercial", "Risk"], index));
  changed += setIfMissing(record, "executive_owner", pick(["COO", "CFO", "CIO", "Chief Commercial Officer", "Chief Risk Officer"], index));
  changed += setIfMissing(record, "operating_model", `${profile.ownerPrefix} function with accountable process owner and shared technology governance`);
  changed += setIfMissing(record, "primary_kpis", pick(["Cycle time; unit cost; service quality", "Run cost; forecast accuracy; control defects", "Availability; delivery throughput; adoption", "Revenue lift; retention; margin", "Issue aging; audit readiness; loss events"], index));
  changed += setIfMissing(record, "critical_processes", record.record_name || `${profile.ownerPrefix} critical process`);
  return changed;
}

function fillOrg(record, profile, index) {
  let changed = 0;
  const domain = pick(["Enterprise Applications", "Data and Analytics", "Infrastructure and Cloud", "Cybersecurity and Risk", "AI Enablement"], index);
  changed += setIfMissing(record, "org_unit_name", domain);
  changed += setIfMissing(record, "leader_role", pick(["VP Enterprise Applications", "Chief Data Officer", "VP Infrastructure", "Chief Information Security Officer", "Head of AI Enablement"], index));
  changed += setIfMissing(record, "reports_to_role", "CIO");
  changed += setIfMissing(record, "decision_rights", "Owns roadmap, run health, architecture standards, risk acceptance, and value evidence for assigned domain");
  changed += setIfMissing(record, "owned_systems", `${systemName(profile, index)}; ${systemName(profile, index + 1)}`);
  changed += setIfMissing(record, "owned_processes", `${profile.ownerPrefix} platform operations; delivery governance; adoption support`);
  return changed;
}

function fillPersona(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "persona_name", pick(["Frontline user", "Operations manager", "Finance analyst", "Technology owner", "Executive sponsor"], index));
  changed += setIfMissing(record, "business_area", capability(profile, index));
  changed += setIfMissing(record, "population_count", String(100 + index * 25));
  changed += setIfMissing(record, "ai_relevance", "AI-relevant where workflow redesign, controls, and adoption evidence are present");
  changed += setIfMissing(record, "work_context", `${profile.ownerPrefix} recurring workflow with measurable cycle time, quality, and decision outcomes`);
  return changed;
}

function fillApplication(record, profile, index) {
  let changed = 0;
  const system = systemName(profile, index);
  changed += setIfMissing(record, "system_name", system);
  changed += setIfMissing(record, "business_capability", capability(profile, index));
  changed += setIfMissing(record, "system_owner", pick(["VP Enterprise Applications", "Director Platform Operations", "Product Owner", "Domain Technology Lead"], index));
  changed += setIfMissing(record, "criticality", pick(["High", "High", "Medium"], index));
  changed += setIfMissing(record, "lifecycle_status", pick(["Modernize", "Run", "Rationalize", "Scale"], index));
  changed += setIfMissing(record, "vendor_id", vendorId(index));
  changed += setIfMissing(record, "annual_cost_usd", String(350000 + index * 27500));
  changed += setIfMissing(record, "integrations", `${system} integrates with ${systemName(profile, index + 1)} and ${systemName(profile, index + 2)}`);
  changed += setIfMissing(record, "data_dependencies", `${capability(profile, index)} master data; operational events; identity and control evidence`);
  changed += setIfMissing(record, "ai_relevance", "Relevant for AI only when data quality, workflow adoption, and control evidence are proven");
  return changed;
}

function fillDataAsset(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "data_asset_name", `${capability(profile, index)} data product`);
  changed += setIfMissing(record, "data_owner", pick(["Chief Data Office", "Domain Data Owner", "Analytics Product Owner", "Finance Data Steward"], index));
  changed += setIfMissing(record, "system_of_record", systemName(profile, index));
  changed += setIfMissing(record, "lineage", `${systemName(profile, index)} -> integration layer -> governed analytics consumption`);
  changed += setIfMissing(record, "consumers", "Operations leadership; Finance; Technology; AI governance");
  changed += setIfMissing(record, "quality_score", String(78 + (index % 12)));
  changed += setIfMissing(record, "governance_status", pick(["Certified", "Steward assigned", "Needs lineage review"], index));
  return changed;
}

function fillVendor(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "vendor_name", pick(["Microsoft", "SAP", "ServiceNow", "Snowflake", "Databricks", "Oracle"], index));
  changed += setIfMissing(record, "contract_id", `VDR-${String(index + 1).padStart(5, "0")}`);
  changed += setIfMissing(record, "service", `${capability(profile, index)} platform services`);
  changed += setIfMissing(record, "annual_cost_usd", String(600000 + index * 45000));
  changed += setIfMissing(record, "renewal_date", addDays("2026-09-30", index * 17));
  changed += setIfMissing(record, "owning_function", pick(["Technology", "Finance", "Operations", "Commercial", "Risk"], index));
  changed += setIfMissing(record, "linked_systems", systemName(profile, index));
  changed += setIfMissing(record, "contract_risk", pick(["Renewal concentration", "Usage under-adoption", "Integration dependency", "Data-exit risk"], index));
  changed += setIfMissing(record, "pricing_basis", pick(["Enterprise subscription", "Consumption", "Named user", "Committed spend"], index));
  return changed;
}

function fillSpend(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "amount_usd", String(250000 + index * 22000));
  changed += setIfMissing(record, "amount_type", pick(["budget", "spend_to_date", "run_rate", "committed"], index));
  changed += setIfMissing(record, "owner", pick(["CIO", "CFO", "Technology Finance", "Domain Product Owner"], index));
  changed += setIfMissing(record, "program_id", `PGM-${String(index + 1).padStart(4, "0")}`);
  changed += setIfMissing(record, "vendor_id", vendorId(index));
  changed += setIfMissing(record, "system_id", `SYS-${String(index + 1).padStart(4, "0")}`);
  changed += setIfMissing(record, "committed_vs_discretionary", pick(["committed", "discretionary"], index));
  changed += setIfMissing(record, "renewal_or_gate_date", addDays("2026-10-15", index * 11));
  changed += setIfMissing(record, "value_linkage", `${capability(profile, index)} outcome with named owner and measurement period`);
  changed += setIfMissing(record, "unit_economics", "Track cost per transaction/user/process cycle before scaling claims");
  return changed;
}

function fillProgram(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "business_owner", pick(["COO", "CFO", "CIO", "Chief Commercial Officer"], index));
  changed += setIfMissing(record, "technology_owner", pick(["VP Enterprise Applications", "Chief Data Officer", "VP Infrastructure", "Head of AI Enablement"], index));
  changed += setIfMissing(record, "executive_sponsor", pick(["CIO", "COO", "CFO", "Executive Committee"], index));
  changed += setIfMissing(record, "phase", pick(["Discovery", "Pilot", "Scaling", "Run"], index));
  changed += setIfMissing(record, "budget_usd", String(1200000 + index * 95000));
  changed += setIfMissing(record, "spend_to_date_usd", String(450000 + index * 52000));
  changed += setIfMissing(record, "expected_value_usd", String(1800000 + index * 110000));
  changed += setIfMissing(record, "realized_value_usd", String(300000 + index * 35000));
  changed += setIfMissing(record, "value_basis", "Measured against baseline cycle time, adoption, run cost, and quality outcomes");
  changed += setIfMissing(record, "status", pick(["On track", "Watch", "At risk"], index));
  changed += setIfMissing(record, "target_date", addDays("2026-12-31", index * 9));
  changed += setIfMissing(record, "dependencies", `${systemName(profile, index)} readiness; data owner signoff; change adoption`);
  changed += setIfMissing(record, "risks", "Value claim requires adoption, control evidence, and accountable operating owner");
  changed += setIfMissing(record, "decision_needed", pick(["Scale with controls", "Hold pending data readiness", "Fund next phase", "Retire duplicate effort"], index));
  return changed;
}

function fillAi(record, profile, index) {
  let changed = 0;
  const useCase = cleanValue(record.use_case) || pick(["Copilot productivity", "Agent-assisted service", "Forecast automation", "Document intelligence", "Exception triage"], index);
  changed += setIfMissing(record, "use_case", useCase);
  changed += setIfMissing(record, "business_process", capability(profile, index));
  changed += setIfMissing(record, "tool_or_model", pick(["M365 Copilot", "Workflow agent", "Forecast model", "Document AI", "Decision support model"], index));
  changed += setIfMissing(record, "agent_or_copilot_name", pick(["Copilot", "Operations Agent", "Forecast Agent", "Evidence Agent", "Decision Advisor"], index));
  changed += setIfMissing(record, "user_group", pick(["Knowledge workers", "Operations managers", "Finance analysts", "Service teams", "Technology owners"], index));
  changed += setIfMissing(record, "licensed_users", String(80 + index * 8));
  changed += setIfMissing(record, "active_users", String(35 + index * 5));
  changed += setIfMissing(record, "adoption_metric", "Active users divided by licensed users, with weekly workflow evidence");
  changed += setIfMissing(record, "value_hypothesis", `${useCase} should reduce cycle time and improve decision quality in ${capability(profile, index)}`);
  changed += setIfMissing(record, "measured_value_usd", String(150000 + index * 18000));
  changed += setIfMissing(record, "production_status", pick(["Pilot", "Limited production", "Production", "Hold"], index));
  changed += setIfMissing(record, "risk_status", pick(["Managed", "Watch", "Needs control evidence"], index));
  changed += setIfMissing(record, "model_risk_tier", pick(["Low", "Medium", "Medium"], index));
  changed += setIfMissing(record, "data_readiness", pick(["Ready with controls", "Needs lineage evidence", "Needs owner signoff"], index));
  changed += setIfMissing(record, "decision_needed", pick(["Scale", "Hold", "Prove value", "Retire"], index));
  changed += setIfMissing(record, "scale_hold_stop", pick(["scale", "hold", "scale", "stop"], index));
  return changed;
}

function fillOps(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "process", `${capability(profile, index)} control process`);
  changed += setIfMissing(record, "process_owner", pick(["Operations owner", "Risk owner", "Technology owner", "Finance owner"], index));
  changed += setIfMissing(record, "severity", pick(["High", "Medium", "Medium"], index));
  changed += setIfMissing(record, "status", pick(["Open", "Monitoring", "Mitigated"], index));
  changed += setIfMissing(record, "control", "Documented owner, evidence cadence, exception threshold, and escalation path");
  changed += setIfMissing(record, "affected_systems", systemName(profile, index));
  changed += setIfMissing(record, "business_impact", "Delays value proof, adoption confidence, or operational resilience if not controlled");
  return changed;
}

function fillRelationship(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "from_object_family", pick(["application_system", "vendor_contract", "program_initiative", "ai_initiative"], index));
  changed += setIfMissing(record, "from_record_id", `REL-FROM-${String(index + 1).padStart(4, "0")}`);
  changed += setIfMissing(record, "relationship_type", pick(["supports", "depends_on", "funds", "governs"], index));
  changed += setIfMissing(record, "to_object_family", pick(["data_asset_integration", "business_function", "spend_value", "metric_definition"], index));
  changed += setIfMissing(record, "to_record_id", `REL-TO-${String(index + 1).padStart(4, "0")}`);
  changed += setIfMissing(record, "evidence_basis", `${systemName(profile, index)} source mapping and V6 template lineage`);
  changed += setIfMissing(record, "relationship_confidence", pick(["high", "medium", "medium"], index));
  return changed;
}

function fillEvidence(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "evidence_title", `${capability(profile, index)} evidence extract`);
  changed += setIfMissing(record, "evidence_type", pick(["system export", "portfolio register", "contract schedule", "metric definition"], index));
  changed += setIfMissing(record, "source_location", cleanValue(record.source_file) || `V6 demo source ${index + 1}`);
  changed += setIfMissing(record, "evidence_owner", ownerFor(record, profile));
  changed += setIfMissing(record, "evidence_confidence", pick(["high", "medium", "medium"], index));
  return changed;
}

function fillMetric(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "metric_name", pick(["Adoption rate", "Cycle time reduction", "Run cost", "Control defect rate", "Value realized"], index));
  changed += setIfMissing(record, "metric_definition", "Business-owned measure with baseline, period, population, and calculation basis");
  changed += setIfMissing(record, "calculation_basis", "Numerator, denominator, period, and source system must be cited");
  changed += setIfMissing(record, "unit_of_measure", pick(["percent", "days", "USD", "count"], index));
  changed += setIfMissing(record, "metric_owner", pick(["Finance", "Operations", "Technology", "Risk"], index));
  changed += setIfMissing(record, "metric_claim_level", pick(["board-ready with evidence", "directional", "operational"], index));
  return changed;
}

function fillIndustryPattern(record, profile, index) {
  let changed = 0;
  changed += setIfMissing(record, "pattern_name", `${profile.industry} ${pick(["AI value gate", "data readiness gate", "vendor economics gate", "operating change gate"], index)}`);
  changed += setIfMissing(record, "industry_domain", profile.industry);
  changed += setIfMissing(record, "when_to_apply", "Use as industry/pattern context only after tenant facts establish applicability.");
  changed += setIfMissing(record, "signals", "Adoption, process change, data quality, owner accountability, and measurable value evidence");
  changed += setIfMissing(record, "recommended_actions", "Compare tenant evidence to pattern, name gaps, and avoid claiming tenant fact from corpus context.");
  changed += setIfMissing(record, "corpus_context_label", "Industry/pattern context, not tenant fact");
  return changed;
}

function fillExpertLens(record, profile, index) {
  let changed = 0;
  const lens = LENSES[index % LENSES.length];
  changed += setIfMissing(record, "expert_lens_id", lens.id);
  changed += setIfMissing(record, "expert_lens_name", lens.name);
  changed += setIfMissing(record, "domain_focus", `${profile.industry}: ${lens.domain}`);
  changed += setIfMissing(record, "activation_conditions", lens.conditions);
  changed += setIfMissing(record, "lens_questions", lens.questions);
  changed += setIfMissing(record, "lens_forbidden_claims", lens.forbidden);
  return changed;
}

function updateManifest(root, profile) {
  const manifestPath = path.join(root, "V6_GENERATED_MANIFEST.json");
  if (!fs.existsSync(manifestPath)) return;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.clientDisplayName = profile.demoName;
  manifest.generatedAt = now;
  let totalRows = 0;
  let totalThin = 0;
  for (const file of manifest.files ?? []) {
    const source = path.join(root, "templates", path.basename(file.file));
    if (!fs.existsSync(source)) continue;
    const { records } = parseCsvWithHeaders(fs.readFileSync(source, "utf8"));
    file.rows = records.length;
    file.dataThinCells = records.reduce(
      (sum, record) => sum + Object.values(record).filter((value) => isDataThin(value)).length,
      0,
    );
    totalRows += file.rows;
    totalThin += file.dataThinCells;
  }
  manifest.totals = {
    files: manifest.files?.length ?? 0,
    rows: totalRows,
    dataThinCells: totalThin,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function replaceOldNamesInFile(filePath, profile) {
  if (!fs.existsSync(filePath)) return 0;
  const before = fs.readFileSync(filePath, "utf8");
  const after = replaceOldNameText(before)
    .replace(/\bAirline Demo-air\b/g, profile?.tenantKey ?? "demo-tenant");
  if (before === after) return 0;
  fs.writeFileSync(filePath, after);
  return 1;
}

function remediateTemplatePack(root) {
  if (!fs.existsSync(root)) return 0;
  let changed = 0;
  const files = walk(root).filter((filePath) => /\.(csv|json|md|ndjson)$/i.test(filePath));
  for (const filePath of files) {
    const before = fs.readFileSync(filePath, "utf8");
    const after = replaceOldNameText(before)
      .replace(/\bAirline Demo-air\b/g, "demo-tenant")
      .replace(/\bskyharbor-air\b/g, "demo-tenant")
      .replace(/\bV6_10_ai_initiatives\.csv\b/g, "source_system_export.csv");
    if (before !== after) {
      fs.writeFileSync(filePath, after);
      changed += 1;
    }
  }
  return changed;
}

function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function replaceOldNames(record) {
  let changed = 0;
  for (const [key, value] of Object.entries(record)) {
    if (TECHNICAL_NAME_REPLACEMENT_SKIP.has(key) || key.endsWith("_id")) {
      continue;
    }
    const after = replaceOldNameText(value);
    if (after !== value) {
      record[key] = after;
      changed += 1;
    }
  }
  return changed;
}

function replaceCorruptedTenantKeyResidue(record, profile) {
  let changed = 0;
  for (const [key, value] of Object.entries(record)) {
    const after = String(value ?? "").replace(/\bAirline Demo-air\b/g, profile.tenantKey);
    if (after !== value) {
      record[key] = after;
      changed += 1;
    }
  }
  return changed;
}

function replaceOldNameText(value) {
  return OLD_NAME_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => String(text ?? "").replace(pattern, replacement),
    String(value ?? ""),
  );
}

function cleanKnownGaps(record) {
  if (record.known_gaps === undefined) return 0;
  const before = record.known_gaps;
  const kept = before
    .split("|")
    .map((gap) => gap.trim())
    .filter((gap) => gap && !gap.startsWith("data_thin:"));
  record.known_gaps = kept.length ? kept.join("|") : "none";
  return before === record.known_gaps ? 0 : 1;
}

function set(record, key, value) {
  if (record[key] === undefined || record[key] === value) return 0;
  record[key] = String(value);
  return 1;
}

function setIfMissing(record, key, value) {
  if (record[key] === undefined || cleanValue(record[key])) return 0;
  record[key] = String(value);
  return 1;
}

function cleanValue(value) {
  const text = String(value ?? "").trim();
  if (!text || isDataThin(text)) return "";
  if (/^(synthetic_demo|v4_synthetic_pack|confidential|static_snapshot)$/i.test(text)) return "";
  return text;
}

function isDataThin(value) {
  return String(value ?? "").trim().startsWith("data_thin:");
}

function isGenericRecord(value) {
  return /^(application_system|data_asset_integration|ai_initiative|expert_lens|relationship|spend_value|metric_definition|evidence_source|operations_risk_control) record$/i.test(String(value ?? "").trim());
}

function ownerFor(record, profile) {
  const family = String(record.business_object_family ?? "");
  if (family.includes("vendor")) return "Technology Vendor Management";
  if (family.includes("data")) return "Chief Data Office";
  if (family.includes("ai")) return "AI Governance Office";
  if (family.includes("spend")) return "Technology Finance";
  if (family.includes("risk")) return "Risk and Controls Office";
  return `${profile.ownerPrefix} Evidence Steward`;
}

function recordNameFor(filename, profile, index) {
  if (filename.includes("05")) return systemName(profile, index);
  if (filename.includes("06")) return `${capability(profile, index)} data product`;
  if (filename.includes("10")) return pick(["Copilot productivity", "Agent-assisted service", "Forecast automation", "Document intelligence"], index);
  if (filename.includes("16")) return LENSES[index % LENSES.length].name;
  return `${capability(profile, index)} record`;
}

function systemName(profile, index) {
  return profile.systems[index % profile.systems.length];
}

function capability(profile, index) {
  return profile.capabilities[index % profile.capabilities.length];
}

function vendorId(index) {
  return `VDR-${String(index + 1).padStart(5, "0")}`;
}

function pick(values, index) {
  return values[index % values.length];
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseCsvWithHeaders(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return {
    headers,
    records: rows
      .filter((values) => values.some((value) => value.trim()))
      .map((values) =>
        Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
      ),
  };
}

function renderCsv(headers, records) {
  return [
    headers.map(escapeCsv).join(","),
    ...records.map((record) => headers.map((header) => escapeCsv(record[header] ?? "")).join(",")),
  ].join("\n") + "\n";
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    parsed[key] = next && !next.startsWith("--") ? next : "1";
    if (next && !next.startsWith("--")) index += 1;
  }
  return parsed;
}

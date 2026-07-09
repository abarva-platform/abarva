#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import meridianHealthConfig from "./configs/meridian-health.mjs";
import { csvEscape, readCsv, readHeader } from "../lib/v6-v7/csv.mjs";

const configs = { "meridian-health": meridianHealthConfig };

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

function writeWithTemplate(templateFile, outFile, rows) {
  const headers = readHeader(templateFile);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? "")).join(","));
  }
  fs.writeFileSync(outFile, `${lines.join("\n")}\n`);
  return rows.length;
}

function appendMissingWithTemplate(templateFile, outFile, rows, keyField) {
  const headers = fs.existsSync(outFile) ? readHeader(outFile) : readHeader(templateFile);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const existingRows = fs.existsSync(outFile) ? readCsv(outFile) : [];
  const existingKeys = new Set(existingRows.map((row) => row[keyField]).filter(Boolean));
  const lines = fs.existsSync(outFile)
    ? fs.readFileSync(outFile, "utf8").trimEnd().split(/\r?\n/)
    : [headers.join(",")];

  let appended = 0;
  for (const row of rows) {
    const key = row[keyField];
    if (key && existingKeys.has(key)) continue;
    lines.push(headers.map((h) => csvEscape(row[h] ?? "")).join(","));
    if (key) existingKeys.add(key);
    appended += 1;
  }

  fs.writeFileSync(outFile, `${lines.join("\n")}\n`);
  return appended;
}

const tenantKey = arg("--tenant", "meridian-health");
const config = configs[tenantKey];
if (!config) throw new Error(`Unknown tenant config ${tenantKey}`);
const datasetDir = arg("--dataset", path.join(process.cwd(), config.sourceDataset));
const towerRoot = arg("--out", path.join(process.cwd(), "tower-standardized-v1", config.tenantKey));
const templateRoot = path.join(process.cwd(), "tower-standardized-v1", "first-capital-financial");

const programs = readCsv(path.join(datasetDir, "templates/V6_09_programs_initiatives.csv"));
const vendors = readCsv(path.join(datasetDir, "templates/V6_07_vendors_contracts.csv"));
const systems = readCsv(path.join(datasetDir, "templates/V6_05_applications_systems.csv"));
const relationships = readCsv(path.join(datasetDir, "templates/V6_12_relationships.csv"));

const counts = {};
counts["ai-control-tower/T01_initiative-registry.csv"] = writeWithTemplate(
  path.join(templateRoot, "ai-control-tower/T01_initiative-registry.csv"),
  path.join(towerRoot, "ai-control-tower/T01_initiative-registry.csv"),
  programs.map((p, i) => ({
    tenant_key: config.tenantKey,
    source_file: "templates/V6_09_programs_initiatives.csv",
    source_row: String(i + 2),
    value_source: "tenant_file",
    initiative_id: p.program_id,
    initiative_name: p.record_name,
    business_area: p.business_owner,
    portfolio_segment: "Meridian Health System",
    owner_role: p.technology_owner,
    business_sponsor_role: p.executive_sponsor,
    stage: p.phase,
    promised_benefit_usd: "",
    measured_value_usd: "",
    value_confidence: p.confidence,
    status: p.status,
    evidence_status: "planning_grade_not_quantified",
    scale_decision: p.decision_needed,
    primary_blocker: p.risks,
    evidence_id: `MER-TOWER-EVID-${String(i + 1).padStart(3, "0")}`,
    notes: p.value_basis,
  })),
);

counts["ai-control-tower/T08_spend-contracts.csv"] = writeWithTemplate(
  path.join(templateRoot, "ai-control-tower/T08_spend-contracts.csv"),
  path.join(towerRoot, "ai-control-tower/T08_spend-contracts.csv"),
  vendors.map((v, i) => ({
    tenant_key: config.tenantKey,
    source_file: "templates/V6_07_vendors_contracts.csv",
    source_row: String(i + 2),
    value_source: "tenant_file",
    line_id: `${v.vendor_id}-CONTRACT`,
    vendor_or_tool: v.vendor_name,
    spend_category: v.service,
    contract_value_usd: "",
    renewal_date: "",
    unit_economic_note: v.pricing_basis,
    view: "vendor_contract",
    is_rollup_of: v.vendor_id,
    basis: "not_loaded",
    period: "not_loaded",
    formula: "from_v6_vendor_contracts",
    formula_version: config.v6ContractVersion,
    notes: `${v.contract_risk}; ${v.linked_systems}`,
  })),
);

counts["family-4-financial-commercial/F12_it-budget-financials.csv"] = writeWithTemplate(
  path.join(templateRoot, "family-4-financial-commercial/F12_it-budget-financials.csv"),
  path.join(towerRoot, "family-4-financial-commercial/F12_it-budget-financials.csv"),
  [{
    tenant_key: config.tenantKey,
    source_file: "templates/V6_08_spend_value.csv",
    source_row: "2",
    value_source: "tenant_file",
    line_id: "MER-BUDGET-NOT-LOADED",
    budget_area: "Meridian analytics/data estate",
    function_or_platform: "Enterprise Data and Analytics",
    owner_role: "CDAO",
    spend_type: "not_loaded",
    budget_fy26_usd: "",
    run_budget_fy26_usd: "",
    change_budget_fy26_usd: "",
    budget_pressure: "120+ resources, roughly 80 percent maintenance / 20 percent net-new; dollars not provided.",
    basis: "not_loaded",
    period: "not_loaded",
    formula: "no_dollar_values_loaded",
    formula_version: config.v6ContractVersion,
    notes: "Tower projection intentionally avoids invented budget values.",
  }],
);

counts["family-8-semantic-enrichment/F20_capability-system-dependency.csv"] = appendMissingWithTemplate(
  path.join(templateRoot, "family-8-semantic-enrichment/F20_capability-system-dependency.csv"),
  path.join(towerRoot, "family-8-semantic-enrichment/F20_capability-system-dependency.csv"),
  relationships.slice(0, 80).map((r, i) => ({
    tenant_key: config.tenantKey,
    dependency_id: r.relationship_id,
    source_file: "templates/V6_12_relationships.csv",
    source_row: String(i + 2),
    capability_id: r.to_record_id,
    capability_name: r.record_name,
    system_id: r.from_record_id,
    system_name: r.from_record_id,
    support_level: r.relationship_type,
    criticality: "workshop_candidate",
    evidence_basis: r.evidence_basis,
    confidence: r.relationship_confidence,
    caveat: r.known_gaps,
    value_source: "tenant_file",
  })),
  "dependency_id",
);

counts["family-8-semantic-enrichment/F22_contract-system-service-map.csv"] = appendMissingWithTemplate(
  path.join(templateRoot, "family-8-semantic-enrichment/F22_contract-system-service-map.csv"),
  path.join(towerRoot, "family-8-semantic-enrichment/F22_contract-system-service-map.csv"),
  systems.map((s, i) => ({
    tenant_key: config.tenantKey,
    map_id: `${s.system_id}-CONTRACT-SCOPE`,
    source_file: "templates/V6_05_applications_systems.csv",
    source_row: String(i + 2),
    vendor_id: s.vendor_id,
    vendor_name: s.vendor_id,
    contract_or_scope: s.business_capability,
    annual_value_usd: "",
    renewal_date: "",
    supported_system_id: s.system_id,
    supported_system_name: s.system_name,
    owner_role: s.technology_owner,
    source_basis: s.source_basis,
    confidence: s.confidence,
    caveat: `${s.lifecycle_status}; ${s.known_gaps}`,
    value_source: "tenant_file",
  })),
  "map_id",
);

counts["family-8-semantic-enrichment/F25_context-node-dictionary.csv"] = appendMissingWithTemplate(
  path.join(templateRoot, "family-8-semantic-enrichment/F25_context-node-dictionary.csv"),
  path.join(towerRoot, "family-8-semantic-enrichment/F25_context-node-dictionary.csv"),
  systems.map((s, i) => ({
    tenant_key: config.tenantKey,
    source_file: "templates/V6_05_applications_systems.csv",
    source_row: String(i + 2),
    value_source: "tenant_file",
    node_id: s.system_id,
    business_label: s.system_name,
    node_type: "application",
    readable_summary: s.data_dependencies,
    confidence: s.confidence,
    caveat: s.known_gaps,
  })),
  "node_id",
);

fs.mkdirSync(path.join(towerRoot, "derived"), { recursive: true });
fs.writeFileSync(path.join(towerRoot, "derived/tower_financial_amounts.csv"), "tenant_key,metric_key,metric_label,amount_usd,amount_type,source_file,source_row,notes\nmeridian-health,budget_not_loaded,Budget not loaded,,not_loaded,templates/V6_08_spend_value.csv,2,No invented dollar values in Meridian V6/V7 v1\n");
fs.writeFileSync(path.join(towerRoot, "derived/tower_financial_amounts_fy2025_trend.csv"), "tenant_key,metric_key,period,amount_usd,notes\nmeridian-health,budget_not_loaded,FY2025,,No trend loaded\n");
counts["derived/tower_financial_amounts.csv"] = 1;
counts["derived/tower_financial_amounts_fy2025_trend.csv"] = 1;

const summary = { tenantKey: config.tenantKey, towerRoot, counts, validation: "projected" };
fs.mkdirSync(path.join(process.cwd(), "out"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "out", `${config.datasetId}-tower-sync.json`), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));

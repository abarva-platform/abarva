#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TENANT_KEY = "lakeshore-industries";
const V6_ROOT = path.join(ROOT, "datasets", "lakeshore-industries-synthetic-v6");
const TEMPLATE_ROOT = path.join(V6_ROOT, "templates");
const HOLDCO_ROOT = path.join(V6_ROOT, "holdco_tower");
const TOWER_ROOT = path.join(ROOT, "tower-standardized-v1", TENANT_KEY);
const SOURCE_VERSION = "lakeshore_v6_holdco_20260701";

const TARGETS = {
  initiatives: path.join(TOWER_ROOT, "ai-control-tower", "T01_initiative-registry.csv"),
  contracts: path.join(TOWER_ROOT, "ai-control-tower", "T08_spend-contracts.csv"),
  budget: path.join(TOWER_ROOT, "family-4-financial-commercial", "F12_it-budget-financials.csv"),
  capSystem: path.join(TOWER_ROOT, "family-8-semantic-enrichment", "F20_capability-system-dependency.csv"),
  vendorSystem: path.join(TOWER_ROOT, "family-8-semantic-enrichment", "F22_contract-system-service-map.csv"),
  dictionary: path.join(TOWER_ROOT, "family-8-semantic-enrichment", "F25_context-node-dictionary.csv"),
  facts: path.join(TOWER_ROOT, "derived", "tower_financial_amounts.csv"),
  trend: path.join(TOWER_ROOT, "derived", "tower_financial_amounts_fy2025_trend.csv"),
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => Object.fromEntries(header.map((headerName, index) => [headerName, cells[index] ?? ""])));
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, rows) {
  const headers = fs.readFileSync(filePath, "utf8").split(/\r?\n/)[0].split(",");
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? "")).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return String(Math.round(asNumber(value)));
}

function byId(rows, field) {
  return new Map(rows.map((row) => [row[field], row]));
}

function sourceRow(row) {
  return row.source_row_number || row.source_row || "";
}

function portfolioSegment(row) {
  const text = `${row.program_id ?? ""} ${row.record_name ?? ""} ${row.technology_owner ?? ""}`;
  if (/NORTH/i.test(text)) return "Northline Logistics Group";
  if (/CREST/i.test(text)) return "Crestpoint Marketing Services";
  if (/RIV/i.test(text)) return "Riverton Consumer Products";
  if (/ARB/i.test(text)) return "Arborfield Workplace Services";
  if (/INNOV|DATA|AI/i.test(text)) return "Corporate Innovation IT and Data AI";
  return "Corporate Shared Services";
}

function systemNameFor(systemId, systemsById) {
  return systemsById.get(systemId)?.system_name || systemId;
}

function confidenceNumber(label) {
  if (label === "high") return "0.86";
  if (label === "low") return "0.45";
  return "0.68";
}

function rowBase(sourceFile, sourceRowNumber, extra = {}) {
  return {
    tenant_key: TENANT_KEY,
    source_file: sourceFile,
    source_row: sourceRowNumber,
    value_source: "tenant_file",
    ...extra,
  };
}

function makeInitiatives(programs) {
  return programs.map((program, index) => ({
    ...rowBase("ai-control-tower/T01_initiative-registry.csv", String(index + 2)),
    initiative_id: program.program_id,
    initiative_name: program.record_name,
    business_area: program.business_owner,
    portfolio_segment: portfolioSegment(program),
    owner_role: program.technology_owner,
    business_sponsor_role: program.executive_sponsor,
    stage: program.phase,
    promised_benefit_usd: money(program.expected_value_usd),
    measured_value_usd: money(program.realized_value_usd),
    value_confidence: program.confidence || "high",
    status: program.status,
    evidence_status: asNumber(program.realized_value_usd) > 0 ? "measured_value_loaded" : "value_not_attested",
    scale_decision: program.decision_needed,
    primary_blocker: program.risks,
    evidence_id: `LH-EVID-${String(index + 1).padStart(3, "0")}`,
    amount_type: "none",
    view: "program_portfolio",
    is_rollup_of: "",
    basis: "actual",
    period: "fy26",
    formula: "from_v6_programs_initiatives",
    formula_version: SOURCE_VERSION,
    notes: program.value_basis,
  }));
}

function makeContracts(programs, vendors) {
  const vendorRows = vendors.map((vendor, index) => ({
    ...rowBase("ai-control-tower/T08_spend-contracts.csv", String(index + 2)),
    line_id: `${vendor.vendor_id}-CONTRACT`,
    initiative_id: "",
    vendor_or_tool: vendor.vendor_name,
    spend_category: vendor.service,
    budget_fy26_usd: "",
    actual_ytd_usd: "",
    contract_value_usd: money(vendor.annual_cost_usd),
    renewal_date: vendor.renewal_date,
    unit_economic_note: vendor.pricing_basis,
    amount_type: "none",
    view: "vendor_contract",
    is_rollup_of: vendor.vendor_id,
    basis: "annual_contract_value",
    period: "fy26",
    formula: "from_v6_vendors_contracts",
    formula_version: SOURCE_VERSION,
    notes: `supports ${vendor.linked_systems}`,
  }));

  const offset = vendorRows.length + 2;
  const programRows = programs.map((program, index) => ({
    ...rowBase("ai-control-tower/T08_spend-contracts.csv", String(offset + index)),
    line_id: `${program.program_id}-BUDGET`,
    initiative_id: program.program_id,
    vendor_or_tool: (program.dependencies || "").split(";")[0] || "program portfolio",
    spend_category: portfolioSegment(program),
    budget_fy26_usd: money(program.budget_usd),
    actual_ytd_usd: money(program.spend_to_date_usd),
    contract_value_usd: "",
    renewal_date: program.target_date,
    unit_economic_note: program.value_basis,
    amount_type: "none",
    view: "initiative_budget",
    is_rollup_of: program.program_id,
    basis: "committed",
    period: "fy26",
    formula: "from_v6_programs_initiatives",
    formula_version: SOURCE_VERSION,
    notes: program.risks,
  }));

  return [...vendorRows, ...programRows];
}

function makeBudget(spendRows) {
  const byOwner = new Map();
  for (const row of spendRows) {
    if (!byOwner.has(row.owner)) byOwner.set(row.owner, {});
    byOwner.get(row.owner)[row.amount_type] = row;
  }

  return [...byOwner.entries()]
    .filter(([, group]) => group.annual_it_budget)
    .map(([owner, group], index) => ({
      ...rowBase("family-4-financial-commercial/F12_it-budget-financials.csv", String(index + 2)),
      line_id: group.annual_it_budget.spend_id,
      budget_area: owner,
      function_or_platform: owner,
      owner_role: owner,
      owner_team_id: owner.replaceAll(/\W+/g, "_").toLowerCase(),
      spend_type: "direct_it_budget",
      budget_fy26_usd: money(group.annual_it_budget.amount_usd),
      run_budget_fy26_usd: group.run_budget ? money(group.run_budget.amount_usd) : "",
      change_budget_fy26_usd: group.change_budget ? money(group.change_budget.amount_usd) : "",
      ai_data_budget_fy26_usd: owner === "Corporate Shared Services IT" ? "11800000" : "",
      capex_budget_fy26_usd: "",
      opex_budget_fy26_usd: "",
      labor_pct: "",
      vendor_pct: "",
      cloud_infra_pct: "",
      budget_pressure: group.annual_it_budget.value_linkage,
      amount_type: "none",
      view: "it_budget",
      is_rollup_of: group.annual_it_budget.spend_id,
      basis: "committed",
      period: "fy26",
      formula: "direct_annual_it_budget_only",
      formula_version: SOURCE_VERSION,
      notes: group.annual_it_budget.unit_economics,
    }));
}

function makeFacts(spendRows, programs) {
  const rows = [];
  let index = 2;
  for (const row of spendRows) {
    if (row.amount_type === "annual_it_budget") {
      rows.push(fact(row, "it_budget", "none", "committed", "fy26", row.amount_usd, row.spend_id, "", "", "direct_annual_it_budget_only", index++));
    } else if (row.amount_type === "run_budget") {
      rows.push(fact(row, "it_budget", "run", "committed", "fy26", row.amount_usd, row.spend_id, "", row.spend_id.replace("-RUN", "-BUDGET"), "run_component_of_annual_it_budget", index++));
    } else if (row.amount_type === "change_budget") {
      rows.push(fact(row, "it_budget", "change", "committed", "fy26", row.amount_usd, row.spend_id, "", row.spend_id.replace("-CHANGE", "-BUDGET"), "change_component_of_annual_it_budget", index++));
    } else if (row.amount_type === "program_committed_budget") {
      rows.push(fact(row, "initiative_budget", "none", "committed", "fy26", row.amount_usd, row.program_id, row.program_id, "", "program_committed_budget", index++));
    } else if (row.amount_type === "program_spend_to_date") {
      rows.push(fact(row, "initiative_budget", "none", "actual", "ytd", row.amount_usd, row.program_id, row.program_id, "", "program_spend_to_date", index++));
    } else if (row.amount_type === "expected_value") {
      rows.push(fact(row, "value", "none", "forecast", "fy26", row.amount_usd, row.program_id, row.program_id, "", "expected_value_not_spend", index++));
    } else if (row.amount_type === "measured_value") {
      rows.push(fact(row, "value", "none", "actual", "ytd", row.amount_usd, row.program_id, row.program_id, "", "measured_value_not_spend", index++));
    }
  }

  const expectedPrograms = new Set(programs.map((program) => program.program_id));
  const factPrograms = new Set(rows.filter((row) => row.view === "initiative_budget").map((row) => row.source_record_id));
  for (const programId of expectedPrograms) {
    if (!factPrograms.has(programId)) {
      throw new Error(`Missing initiative budget fact for ${programId}`);
    }
  }
  return rows;
}

function fact(row, view, amountType, basis, period, amount, recordId, rollup, componentOf, formula, sourceRowNumber) {
  return {
    ...rowBase("derived/tower_financial_amounts.csv", String(sourceRowNumber)),
    source_record_id: recordId,
    source_label: row.record_name,
    view,
    amount_type: amountType,
    basis,
    period,
    amount_usd: money(amount),
    is_rollup_of: rollup,
    component_of: componentOf,
    formula,
    formula_version: SOURCE_VERSION,
    reconciles_to_view: view,
    reconciles_to_record_id: recordId,
    reconciliation_envelope_usd: "",
    notes: row.unit_economics || row.value_linkage,
  };
}

function makeTrendFacts(spendRows) {
  return spendRows
    .filter((row) => row.amount_type === "annual_it_budget")
    .map((row, index) => ({
      ...rowBase("derived/tower_financial_amounts_fy2025_trend.csv", String(index + 2), { value_source: "synthetic" }),
      source_record_id: `${row.spend_id}-FY2025`,
      source_label: `${row.record_name} FY2025 trend baseline`,
      view: "it_budget",
      amount_type: "none",
      basis: "actual",
      period: "fy25",
      amount_usd: money(asNumber(row.amount_usd) * 0.94),
      is_rollup_of: row.spend_id,
      component_of: "",
      formula: "synthetic_backcast_from_fy26_multiplier_0_94",
      formula_version: `${SOURCE_VERSION}_fy2025_trend`,
      reconciles_to_view: "it_budget",
      reconciles_to_record_id: row.spend_id,
      reconciliation_envelope_usd: "",
      notes: "Synthetic FY2025 trend baseline for demo trending only; not client-attested.",
    }));
}

function makeDictionary({ entities, functions, systems, vendors, programs }) {
  const rows = [];
  const push = (node_id, business_label, node_type, readable_summary, confidence, caveat, originalSourceFile, sourceRowNumber) => {
    rows.push({
      tenant_key: TENANT_KEY,
      node_id,
      business_label,
      node_type,
      source_file: "family-8-semantic-enrichment/F25_context-node-dictionary.csv",
      readable_summary: `${readable_summary} Source: ${originalSourceFile}.`,
      confidence,
      caveat,
      source_row: sourceRowNumber,
      value_source: "tenant_file",
    });
  };

  for (const row of entities) {
    push(row.entity_id, row.entity_name, row.entity_type, row.notes, "high", row.budget_additivity_rule, "holdco_tower/H01_entity_hierarchy.csv", sourceRow(row));
  }
  for (const row of functions) {
    push(row.function_id, row.function_name, "business_function", `${row.executive_owner} owns ${row.critical_processes}.`, row.confidence, row.known_gaps, "templates/V6_02_business_functions.csv", sourceRow(row));
  }
  for (const row of systems) {
    push(row.system_id, row.system_name, "system", `${row.business_capability}; owner ${row.system_owner}.`, row.confidence, `AI relevance ${row.ai_relevance}`, "templates/V6_05_applications_systems.csv", sourceRow(row));
  }
  for (const row of vendors) {
    push(row.vendor_id, row.vendor_name, "vendor", `${row.service}; renewal ${row.renewal_date}.`, row.confidence, `contract risk ${row.contract_risk}`, "templates/V6_07_vendors_contracts.csv", sourceRow(row));
  }
  for (const row of programs) {
    push(row.program_id, row.record_name, "initiative", `${row.technology_owner}; ${row.value_basis}.`, row.confidence, row.risks, "templates/V6_09_programs_initiatives.csv", sourceRow(row));
  }
  return rows;
}

function makeCapabilitySystemRows(relationships, functionsById, systemsById) {
  return relationships
    .filter((row) => row.from_object_family === "business_function" && row.to_object_family === "application_system")
    .map((row, index) => ({
      ...rowBase("family-8-semantic-enrichment/F20_capability-system-dependency.csv", String(index + 2)),
      dependency_id: row.relationship_id,
      capability_id: row.from_record_id,
      capability_name: functionsById.get(row.from_record_id)?.function_name || row.from_record_id,
      system_id: row.to_record_id,
      system_name: systemNameFor(row.to_record_id, systemsById),
      support_level: row.relationship_type,
      criticality: systemsById.get(row.to_record_id)?.criticality || "medium",
      evidence_basis: row.evidence_basis,
      confidence: confidenceNumber(row.relationship_confidence),
      caveat: "",
    }));
}

function makeVendorSystemRows(vendors, systemsById) {
  const rows = [];
  for (const vendor of vendors) {
    const systemIds = String(vendor.linked_systems || "").split("|").filter(Boolean);
    for (const systemId of systemIds) {
      rows.push({
        ...rowBase("family-8-semantic-enrichment/F22_contract-system-service-map.csv", String(rows.length + 2)),
        map_id: `${vendor.vendor_id}-${systemId}`,
        vendor_id: vendor.vendor_id,
        vendor_name: vendor.vendor_name,
        contract_or_scope: vendor.service,
        annual_value_usd: money(vendor.annual_cost_usd),
        renewal_date: vendor.renewal_date,
        supported_system_id: systemId,
        supported_system_name: systemNameFor(systemId, systemsById),
        owner_role: vendor.owning_function,
        source_basis: vendor.pricing_basis,
        confidence: confidenceNumber(vendor.confidence),
        caveat: `contract risk ${vendor.contract_risk}`,
      });
    }
  }
  return rows;
}

function assertTotals(spendRows, facts) {
  const directBudget = spendRows
    .filter((row) => row.amount_type === "annual_it_budget")
    .reduce((sum, row) => sum + asNumber(row.amount_usd), 0);
  const factBudget = facts
    .filter((row) => row.view === "it_budget" && row.amount_type === "none" && row.period === "fy26")
    .reduce((sum, row) => sum + asNumber(row.amount_usd), 0);
  if (directBudget !== factBudget) {
    throw new Error(`FY26 IT budget mismatch: v6=${directBudget}, facts=${factBudget}`);
  }
  const allocated = spendRows
    .filter((row) => row.amount_type === "allocated_shared_services_cost")
    .reduce((sum, row) => sum + asNumber(row.amount_usd), 0);
  if (allocated > 0 && facts.some((row) => row.source_record_id.includes("ALLOC"))) {
    throw new Error("Allocated shared-services rows leaked into additive Tower facts.");
  }
  return { directBudget, allocated };
}

const inputs = {
  entities: readCsv(path.join(HOLDCO_ROOT, "H01_entity_hierarchy.csv")),
  functions: readCsv(path.join(TEMPLATE_ROOT, "V6_02_business_functions.csv")),
  systems: readCsv(path.join(TEMPLATE_ROOT, "V6_05_applications_systems.csv")),
  vendors: readCsv(path.join(TEMPLATE_ROOT, "V6_07_vendors_contracts.csv")),
  spendRows: readCsv(path.join(TEMPLATE_ROOT, "V6_08_spend_value.csv")),
  programs: readCsv(path.join(TEMPLATE_ROOT, "V6_09_programs_initiatives.csv")),
  relationships: readCsv(path.join(TEMPLATE_ROOT, "V6_12_relationships.csv")),
};

const functionsById = byId(inputs.functions, "function_id");
const systemsById = byId(inputs.systems, "system_id");

const initiatives = makeInitiatives(inputs.programs);
const contracts = makeContracts(inputs.programs, inputs.vendors);
const budget = makeBudget(inputs.spendRows);
const facts = makeFacts(inputs.spendRows, inputs.programs);
const trend = makeTrendFacts(inputs.spendRows);
const dictionary = makeDictionary(inputs);
const capSystem = makeCapabilitySystemRows(inputs.relationships, functionsById, systemsById);
const vendorSystem = makeVendorSystemRows(inputs.vendors, systemsById);
const totals = assertTotals(inputs.spendRows, facts);

writeCsv(TARGETS.initiatives, initiatives);
writeCsv(TARGETS.contracts, contracts);
writeCsv(TARGETS.budget, budget);
writeCsv(TARGETS.facts, facts);
writeCsv(TARGETS.trend, trend);
writeCsv(TARGETS.dictionary, dictionary);
writeCsv(TARGETS.capSystem, capSystem);
writeCsv(TARGETS.vendorSystem, vendorSystem);

console.log(JSON.stringify({
  status: "synced",
  tenantKey: TENANT_KEY,
  sourceVersion: SOURCE_VERSION,
  totals,
  rows: {
    initiatives: initiatives.length,
    contracts: contracts.length,
    budget: budget.length,
    facts: facts.length,
    trend: trend.length,
    dictionary: dictionary.length,
    capabilitySystem: capSystem.length,
    vendorSystem: vendorSystem.length,
  },
}, null, 2));

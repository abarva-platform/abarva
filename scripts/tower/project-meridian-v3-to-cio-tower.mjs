#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const TENANT_KEY = "meridian-health";
const TENANT_LABEL = "Healthcare Demo";
const ENTERPRISE_ENTITY_KEY = `${TENANT_KEY}::enterprise`;
const ENTERPRISE_ENTITY_TYPE = "holding_company";
const STANDARD_VERSION = "standard-2026-07-v3";
const FORMULA_VERSION = "meridian_v3_cio_tower_projection_v1";
const DEFAULT_OUT_DIR = path.join(ROOT, "reports/meridian-v3-cio-tower-projection");
const args = new Set(process.argv.slice(2));
const OUT_DIR = valueArg("--out-dir") ?? DEFAULT_OUT_DIR;
const WRITE = args.has("--write");
const DRY_RUN = args.has("--dry-run") || !WRITE;
const EMIT_PROOF_BUNDLE = args.has("--emit-proof-bundle");

const SOURCE_DIR = path.join(ROOT, "datasets/tenant-inputs", TENANT_KEY, STANDARD_VERSION);
const FILES = {
  budget08: "08_it_budget_spend_value.csv",
  programs09: "09_programs_initiatives.csv",
  ai10: "10_ai_automation_use_cases.csv",
  vendors07: "07_vendors_contracts.csv",
  metrics14: "14_metrics_outcomes.csv",
  ops18: "18_operational_process_evidence.csv",
  financeSa02: "SA02_IT_Finance_Budget_Spend_Extract.csv",
  programSa04: "SA04_Program_Portfolio_Extract.csv",
  benefitsSa08: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
};

function valueArg(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === "\"" && next === "\"") {
        value += "\"";
        i += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === "\"") {
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
  const headers = rows.shift() ?? [];
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function readCsv(fileName) {
  const fullPath = path.join(SOURCE_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required source file: ${fullPath}`);
  }
  return parseCsv(fs.readFileSync(fullPath, "utf8"));
}

function checksum(fileName) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(SOURCE_DIR, fileName))).digest("hex");
}

function number(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).trim().replace(/[$,%\s]/g, "");
  if (!cleaned || cleaned === "not_provided") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function budgetAmountType(row) {
  if (number(row.run_budget_usd) > 0 && number(row.change_budget_usd) === 0) return "run";
  if (number(row.change_budget_usd) > 0 && number(row.run_budget_usd) === 0) return "change";
  return "none";
}

function bool(value) {
  return String(value ?? "").toLowerCase() === "true";
}

function safeKey(...parts) {
  return parts
    .filter((part) => part !== null && part !== undefined && String(part).trim() !== "")
    .map((part) => String(part).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join("::")
    .slice(0, 240);
}

function sourceKey(fileName) {
  return `${TENANT_KEY}::${STANDARD_VERSION}::${fileName}`;
}

function sourceRowId(row) {
  return row.source_record_id || row.record_id || row.entity_id || row.business_name || row.context_item || "row";
}

function sourceRef(fileName, row) {
  return `${fileName}#${sourceRowId(row)}`;
}

function json(value) {
  return JSON.stringify(value ?? {});
}

function addUnique(map, row, keyField = "entity_key") {
  if (!row[keyField]) throw new Error(`Missing key ${keyField}`);
  map.set(row[keyField], { ...map.get(row[keyField]), ...row });
}

function entityForProgram(programCode, programName, sourceFile, sourceRow) {
  return {
    entity_key: `${TENANT_KEY}::initiative::${safeKey(programCode || programName)}`,
    tenant_key: TENANT_KEY,
    entity_type: "initiative",
    display_name: programName || programCode,
    parent_entity_key: ENTERPRISE_ENTITY_KEY,
    source_key: sourceKey(sourceFile),
    source_row: sourceRowId(sourceRow),
    attributes: json({
      program_code: programCode,
      initiative_id: sourceRow.initiative_id || sourceRow.linked_initiative_id || "",
      executive_owner: sourceRow.executive_owner || sourceRow.evidence_owner || "",
      finance_owner: sourceRow.finance_owner || "",
      funding_status: sourceRow.funding_status || "",
      ai_spend_flag: bool(sourceRow.ai_spend_flag),
      ai_spend_type: sourceRow.ai_spend_type || "none",
      ai_spend_category: sourceRow.ai_spend_category || "not_ai",
    }),
  };
}

function entityForVendor(vendorName, sourceFile, sourceRow) {
  return {
    entity_key: `${TENANT_KEY}::vendor::${safeKey(vendorName)}`,
    tenant_key: TENANT_KEY,
    entity_type: "vendor",
    display_name: vendorName,
    parent_entity_key: ENTERPRISE_ENTITY_KEY,
    source_key: sourceKey(sourceFile),
    source_row: sourceRowId(sourceRow),
    attributes: json({ vendor_name: vendorName }),
  };
}

function entityForSystem(systemName, sourceFile, sourceRow) {
  return {
    entity_key: `${TENANT_KEY}::system::${safeKey(systemName)}`,
    tenant_key: TENANT_KEY,
    entity_type: "system",
    display_name: systemName,
    parent_entity_key: ENTERPRISE_ENTITY_KEY,
    source_key: sourceKey(sourceFile),
    source_row: sourceRowId(sourceRow),
    attributes: json({ system_name: systemName }),
  };
}

function factKey(...parts) {
  return `${TENANT_KEY}::${safeKey(...parts)}`;
}

function fact({
  keyParts,
  entityKey,
  entityType = "other",
  measure,
  scope = "other",
  view,
  amountType = "none",
  basis = "committed",
  period = "fy26",
  valueNumeric = null,
  valueText = null,
  unit = "usd",
  sourceFile,
  sourceRow,
  componentOf = "",
  isRollupOf = "",
  attributes = {},
  confidence,
  valueSource = "tenant_file",
}) {
  return {
    fact_key: factKey(...keyParts),
    tenant_key: TENANT_KEY,
    entity_key: entityKey || null,
    entity_type: entityType,
    measure,
    scope,
    view,
    amount_type: amountType,
    basis,
    period,
    value_numeric: valueNumeric === null || valueNumeric === undefined ? null : valueNumeric,
    value_text: valueText,
    value_date: null,
    value_bool: null,
    unit,
    value_source: valueSource,
    confidence: confidence || sourceRow?.confidence || "medium",
    source_key: sourceFile ? sourceKey(sourceFile) : null,
    source_row: sourceRow ? sourceRowId(sourceRow) : null,
    formula_key: "",
    formula_version: FORMULA_VERSION,
    is_rollup_of: isRollupOf,
    component_of: componentOf,
    superseded_by: "",
    valid_from: null,
    valid_to: null,
    attributes: json({
      evidence_id: sourceRow?.evidence_id || "",
      source_ref: sourceFile && sourceRow ? sourceRef(sourceFile, sourceRow) : "",
      ...attributes,
    }),
  };
}

function measureResult(measureKey, scope, period, basis, dimensions, valueNumeric, facts, extra = {}) {
  return {
    result_key: `${TENANT_KEY}::${measureKey}::${scope}::${period}::${basis}::${safeKey(JSON.stringify(dimensions || {}))}`,
    tenant_key: TENANT_KEY,
    measure_key: measureKey,
    scope,
    period,
    basis,
    dimensions: json(dimensions ?? {}),
    value_numeric: valueNumeric,
    value_json: json({ ...extra, source_fact_count: facts.length }),
    source_fact_keys: facts.map((row) => row.fact_key),
    formula_version: FORMULA_VERSION,
  };
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + number(row[field]), 0);
}

function groupBy(rows, getKey) {
  const out = new Map();
  for (const row of rows) {
    const key = getKey(row);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(row);
  }
  return out;
}

function buildProjection() {
  const data = Object.fromEntries(Object.entries(FILES).map(([name, file]) => [name, readCsv(file)]));
  const sources = Object.values(FILES).map((fileName) => ({
    source_key: sourceKey(fileName),
    tenant_key: TENANT_KEY,
    source_system: STANDARD_VERSION,
    source_file: `datasets/tenant-inputs/${TENANT_KEY}/${STANDARD_VERSION}/${fileName}`,
    source_kind: "file",
    source_version: "2026-07-17-meridian-v3-refresh",
    trust_tier: "synthetic_demo",
    row_count: data[Object.keys(FILES).find((key) => FILES[key] === fileName)].length,
    freshness_date: "2026-07-17",
    metadata: json({ checksum_sha256: checksum(fileName), source_standard: STANDARD_VERSION }),
  }));

  const entityMap = new Map();
  addUnique(entityMap, {
    entity_key: ENTERPRISE_ENTITY_KEY,
    tenant_key: TENANT_KEY,
    entity_type: ENTERPRISE_ENTITY_TYPE,
    display_name: TENANT_LABEL,
    parent_entity_key: null,
    source_key: sourceKey(FILES.budget08),
    source_row: "enterprise",
    attributes: json({
      tenant_key: TENANT_KEY,
      source_standard: STANDARD_VERSION,
      entity_role: "enterprise_envelope",
    }),
  });

  const facts = [];
  const relationships = new Map();

  const atomicBudgetRows = data.budget08.filter(
    (row) => row.financial_fact_type === "fy26_budget_line" && row.additive_status === "additive_budget_fact",
  );
  const runBudgetFacts = [];
  const changeBudgetFacts = [];
  for (const row of atomicBudgetRows) {
    const entityKey = `${TENANT_KEY}::budget-line::${safeKey(row.record_id)}`;
    addUnique(entityMap, {
      entity_key: entityKey,
      tenant_key: TENANT_KEY,
      entity_type: "org_unit",
      display_name: row.business_name || row.context_item || row.record_id,
      parent_entity_key: ENTERPRISE_ENTITY_KEY,
      source_key: sourceKey(FILES.budget08),
      source_row: sourceRowId(row),
      attributes: json({
        budget_row_level: row.budget_row_level,
        program_code: row.program_code,
        initiative_id: row.initiative_id,
        ai_spend_flag: bool(row.ai_spend_flag),
        ai_spend_type: row.ai_spend_type || "none",
        ai_spend_category: row.ai_spend_category || "not_ai",
        vendor_name: row.vendor_name,
        system_name: row.system_name,
      }),
    });
    if (number(row.run_budget_usd) > 0) {
      const budgetFact = fact({
        keyParts: ["budget", row.record_id, "run", "fy26"],
        entityKey,
        entityType: "org_unit",
        measure: "run_budget_fy26",
        scope: "enterprise_envelope",
        view: "it_budget",
        amountType: "run",
        basis: "committed",
        period: "fy26",
        valueNumeric: number(row.run_budget_usd),
        unit: "usd",
        sourceFile: FILES.budget08,
        sourceRow: row,
        componentOf: "fy26_total_it_budget",
        attributes: { source_amount_field: "run_budget_usd" },
      });
      facts.push(budgetFact);
      runBudgetFacts.push(budgetFact);
    }
    if (number(row.change_budget_usd) > 0) {
      const budgetFact = fact({
        keyParts: ["budget", row.record_id, "change", "fy26"],
        entityKey,
        entityType: "org_unit",
        measure: "change_budget_fy26",
        scope: "enterprise_envelope",
        view: "it_budget",
        amountType: "change",
        basis: "committed",
        period: "fy26",
        valueNumeric: number(row.change_budget_usd),
        unit: "usd",
        sourceFile: FILES.budget08,
        sourceRow: row,
        componentOf: "fy26_total_it_budget",
        attributes: { source_amount_field: "change_budget_usd" },
      });
      facts.push(budgetFact);
      changeBudgetFacts.push(budgetFact);
    }
  }

  const totalBudgetFact = fact({
    keyParts: ["budget", "total-it-budget", "fy26"],
    entityKey: ENTERPRISE_ENTITY_KEY,
    entityType: ENTERPRISE_ENTITY_TYPE,
    measure: "total_it_budget_fy26",
    scope: "enterprise_envelope",
    view: "it_budget",
    amountType: "none",
    basis: "committed",
    period: "fy26",
    valueNumeric: sum(atomicBudgetRows, "budget_amount_usd"),
    unit: "usd",
    sourceFile: FILES.budget08,
    sourceRow: atomicBudgetRows[0],
    isRollupOf: "SUM additive fy26_budget_line budget_amount_usd rows from 08_it_budget_spend_value.csv",
    attributes: {
      rollup_rule: "SUM 08 rows where financial_fact_type=fy26_budget_line and additive_status=additive_budget_fact",
      row_count: atomicBudgetRows.length,
    },
  });
  facts.push(totalBudgetFact);

  const programFacts = [];
  const programRows = data.programSa04.filter((row) => row.active_candidate_status === "active");
  for (const row of programRows) {
    const entity = entityForProgram(row.program_code, row.program_name, FILES.programSa04, row);
    addUnique(entityMap, entity);
    if (row.initiative_status === "active" && row.funding_status === "approved" && number(row.approved_funding_usd) > 0) {
      const programFact = fact({
        keyParts: ["program", row.program_code, "approved-budget", "fy26"],
        entityKey: entity.entity_key,
        entityType: "initiative",
        measure: "initiative_budget_fy26",
        scope: "initiative",
        view: "initiative_budget",
        amountType: "none",
        basis: "committed",
        period: "fy26",
        valueNumeric: number(row.approved_funding_usd),
        unit: "usd",
        sourceFile: FILES.programSa04,
        sourceRow: row,
        attributes: {
          program_code: row.program_code,
          initiative_id: row.initiative_id,
          program_name: row.program_name,
          executive_owner: row.executive_owner,
          finance_owner: row.finance_owner,
          funding_status: row.funding_status,
          ai_spend_flag: bool(row.ai_spend_flag),
          ai_spend_type: row.ai_spend_type,
          ai_spend_category: row.ai_spend_category,
          linked_sa02_records: row.linked_sa02_records,
        },
      });
      facts.push(programFact);
      programFacts.push(programFact);
    }
  }

  const aiSpendRows = data.budget08.filter(
    (row) =>
      row.financial_fact_type === "fy26_budget_line" &&
      row.additive_status === "additive_budget_fact" &&
      bool(row.ai_spend_flag) &&
      number(row.ai_tagged_budget_usd) > 0,
  );
  const aiSpendFacts = [];
  for (const row of aiSpendRows) {
    if (row.vendor_name) {
      for (const vendorName of row.vendor_name.split(";").map((item) => item.trim()).filter(Boolean)) {
        addUnique(entityMap, entityForVendor(vendorName, FILES.budget08, row));
      }
    }
    if (row.system_name) {
      for (const systemName of row.system_name.split(";").map((item) => item.trim()).filter(Boolean)) {
        addUnique(entityMap, entityForSystem(systemName, FILES.budget08, row));
      }
    }
    const aiFact = fact({
      keyParts: ["ai-spend", row.record_id, "fy26"],
      entityKey: row.program_code ? `${TENANT_KEY}::initiative::${safeKey(row.program_code)}` : ENTERPRISE_ENTITY_KEY,
      entityType: row.program_code ? "initiative" : ENTERPRISE_ENTITY_TYPE,
      measure: "ai_tagged_spend_fy26",
      scope: row.program_code ? "initiative" : "enterprise_envelope",
      view: row.program_code ? "initiative_budget" : "it_budget",
      amountType: budgetAmountType(row),
      basis: "committed",
      period: "fy26",
      valueNumeric: number(row.ai_tagged_budget_usd),
      unit: "usd",
      sourceFile: FILES.budget08,
      sourceRow: row,
      attributes: {
        parent_budget_amount_usd: number(row.budget_amount_usd),
        source_amount_field: "ai_tagged_budget_usd",
        program_code: row.program_code,
        initiative_id: row.initiative_id,
        vendor_name: row.vendor_name,
        system_name: row.system_name,
        ai_spend_type: row.ai_spend_type,
        ai_spend_category: row.ai_spend_category,
        platform_embedded_ai_flag: bool(row.platform_embedded_ai_flag),
        additive_status: "non_additive_ai_lens",
        actual_spend_ytd_usd: number(row.actual_spend_ytd_usd),
        forecast_spend_usd: number(row.forecast_spend_usd),
      },
    });
    facts.push(aiFact);
    aiSpendFacts.push(aiFact);
  }

  const benefitRows = data.benefitsSa08;
  const promisedValueFacts = [];
  const partialValueFacts = [];
  const adoptionFacts = [];
  const kpiFacts = [];
  for (const row of benefitRows) {
    const programEntityKey = row.ai_program_id ? `${TENANT_KEY}::initiative::${safeKey(row.ai_program_id)}` : `${TENANT_KEY}::enterprise`;
    if (row.vendor_name) addUnique(entityMap, entityForVendor(row.vendor_name, FILES.benefitsSa08, row));
    if (row.tool_name) addUnique(entityMap, entityForSystem(row.tool_name, FILES.benefitsSa08, row));
    if (number(row.promised_value_usd) > 0) {
      const promised = fact({
        keyParts: ["benefit", row.source_record_id, "promised-value"],
        entityKey: programEntityKey,
        entityType: "initiative",
        measure: "promised_value_fy26",
        scope: "initiative",
        view: "value",
        amountType: "none",
        basis: "forecast",
        period: "fy26",
        valueNumeric: number(row.promised_value_usd),
        unit: "usd",
        sourceFile: FILES.benefitsSa08,
        sourceRow: row,
        attributes: {
          program_name: row.program_name,
          ai_use_case_id: row.ai_use_case_id,
          vendor_name: row.vendor_name,
          tool_name: row.tool_name,
          promised_benefit_type: row.promised_benefit_type,
          value_claim_status: row.value_claim_status,
          tower_claim_allowed: row.tower_claim_allowed,
          caveat: row.caveat,
        },
      });
      facts.push(promised);
      promisedValueFacts.push(promised);
    }
    if (number(row.finance_validated_value_usd) > 0 && row.tower_claim_allowed === "partial") {
      const partial = fact({
        keyParts: ["benefit", row.source_record_id, "partial-finance-validated-value"],
        entityKey: programEntityKey,
        entityType: "initiative",
        measure: "partial_finance_validated_value_ytd",
        scope: "initiative",
        view: "value",
        amountType: "none",
        basis: "actual",
        period: "ytd",
        valueNumeric: number(row.finance_validated_value_usd),
        unit: "usd",
        sourceFile: FILES.benefitsSa08,
        sourceRow: row,
        attributes: {
          program_name: row.program_name,
          ai_use_case_id: row.ai_use_case_id,
          vendor_name: row.vendor_name,
          tool_name: row.tool_name,
          value_claim_status: row.value_claim_status,
          tower_claim_allowed: row.tower_claim_allowed,
          caveat: row.caveat,
          forbidden_wording: "Do not label as realized/proven/delivered savings.",
        },
      });
      facts.push(partial);
      partialValueFacts.push(partial);
    }
    if (row.usage_metric) {
      const usage = fact({
        keyParts: ["adoption", row.source_record_id, "usage"],
        entityKey: programEntityKey,
        entityType: "initiative",
        measure: "ai_usage_signal",
        scope: "initiative",
        view: "adoption",
        amountType: "none",
        basis: "actual",
        period: "ytd",
        valueNumeric: number(row.usage_actual),
        unit: "count",
        sourceFile: FILES.benefitsSa08,
        sourceRow: row,
        attributes: {
          program_name: row.program_name,
          vendor_name: row.vendor_name,
          tool_name: row.tool_name,
          usage_metric: row.usage_metric,
          adoption_rate_pct: number(row.adoption_rate_pct),
          value_claim_status: row.value_claim_status,
          caveat: row.caveat,
        },
      });
      facts.push(usage);
      adoptionFacts.push(usage);
    }
    if (row.operational_kpi) {
      const kpi = fact({
        keyParts: ["kpi", row.source_record_id, row.operational_kpi],
        entityKey: programEntityKey,
        entityType: "initiative",
        measure: "ai_operational_kpi_signal",
        scope: "initiative",
        view: "operational_kpi",
        amountType: "none",
        basis: "actual",
        period: "ytd",
        valueNumeric: number(row.kpi_actual),
        unit: "ratio",
        sourceFile: FILES.benefitsSa08,
        sourceRow: row,
        attributes: {
          program_name: row.program_name,
          vendor_name: row.vendor_name,
          tool_name: row.tool_name,
          operational_kpi: row.operational_kpi,
          baseline: row.kpi_baseline,
          target: row.target_value,
          value_claim_status: row.value_claim_status,
          caveat: row.caveat,
        },
      });
      facts.push(kpi);
      kpiFacts.push(kpi);
    }
  }

  const candidateUseCases = data.ai10.filter((row) => ["candidate", "discovery"].includes(row.use_case_status));
  const candidateFacts = [];
  for (const row of candidateUseCases) {
    const candidateFact = fact({
      keyParts: ["candidate-ai", row.record_id, row.use_case_status],
      entityKey: ENTERPRISE_ENTITY_KEY,
      entityType: ENTERPRISE_ENTITY_TYPE,
      measure: "candidate_ai_opportunity_count",
      scope: "initiative",
      view: "risk",
      amountType: "none",
      basis: "baseline",
      period: "current",
      valueNumeric: 1,
      unit: "count",
      sourceFile: FILES.ai10,
      sourceRow: row,
      attributes: {
        use_case: row.use_case || row.business_name,
        business_problem: row.business_problem,
        affected_process: row.affected_process,
        readiness_status: row.readiness_status,
        funding_status: row.funding_status,
        expected_decision_path: row.expected_decision_path,
        linked_program_code: row.linked_program_code,
        embedded_platform_source: row.embedded_platform_source,
        caveat: row.caveat,
        risk_or_gap: row.risk_or_gap,
        should_not_fund_directly: row.funding_status !== "approved",
      },
    });
    facts.push(candidateFact);
    candidateFacts.push(candidateFact);
  }

  const pressureRows = [
    ...data.metrics14.filter((row) => row.risk_or_gap || row.evidence_needed || row.value_claim_status === "not_claimable"),
    ...data.ops18.filter((row) => row.signals || row.risk_or_gap || row.evidence_needed),
  ];
  const pressureFacts = [];
  for (const row of pressureRows.slice(0, 80)) {
    const pressureFact = fact({
      keyParts: ["pressure", row.record_id || row.source_record_id, row.risk_or_gap || row.signals || row.evidence_needed],
      entityKey: ENTERPRISE_ENTITY_KEY,
      entityType: ENTERPRISE_ENTITY_TYPE,
      measure: "tower_watch_pressure_signal",
      scope: "enterprise_envelope",
      view: "risk",
      amountType: "none",
      basis: "baseline",
      period: "current",
      valueNumeric: 1,
      unit: "count",
      sourceFile: row.dimension === "18_operational_process_evidence" ? FILES.ops18 : FILES.metrics14,
      sourceRow: row,
      attributes: {
        topic: row.business_name || row.context_item,
        use_case: row.use_case,
        data_domain: row.data_domain,
        systems: row.systems || row.affected_systems,
        risk_or_gap: row.risk_or_gap || row.signals || row.evidence_needed,
        metric_boundary: row.metric_boundary,
        forbidden_claims: row.forbidden_claims,
        caveat: row.caveat,
        module_next_actions: row.module_next_actions,
      },
    });
    facts.push(pressureFact);
    pressureFacts.push(pressureFact);
  }

  for (const row of programRows) {
    if (!row.program_code) continue;
    const linkedSa02Records = (row.linked_sa02_records || "").split(";").map((item) => item.trim()).filter(Boolean);
    if (!linkedSa02Records.length) continue;
    const relKey = `${TENANT_KEY}::rel::${safeKey("enterprise", "funds", row.program_code)}`;
    relationships.set(relKey, {
      relationship_key: relKey,
      tenant_key: TENANT_KEY,
      from_entity_key: ENTERPRISE_ENTITY_KEY,
      to_entity_key: `${TENANT_KEY}::initiative::${safeKey(row.program_code)}`,
      relationship_type: "funds",
      confidence: row.confidence || "high",
      source_key: sourceKey(FILES.programSa04),
      source_row: sourceRowId(row),
      attributes: json({
        linked_sa02_records: linkedSa02Records,
        program_name: row.program_name,
      }),
    });
  }

  const measures = [
    ["total_it_budget_fy26", "FY26 IT budget", "Committed FY26 IT budget from V3 additive budget rows.", "enterprise_envelope", "metric_card"],
    ["run_budget_fy26", "FY26 run budget", "Run component of FY26 technology spend.", "enterprise_envelope", "chart"],
    ["change_budget_fy26", "FY26 change budget", "Change component of FY26 technology spend.", "enterprise_envelope", "chart"],
    ["initiative_budget_fy26", "FY26 initiative budget", "Approved program and initiative funding tied to budget rows.", "initiative", "table"],
    ["ai_tagged_spend_fy26", "FY26 AI-tagged spend lens", "AI-related spend across explicit AI, embedded platform AI, enablement, governance, training, and run operations. Non-additive lens.", "initiative", "table"],
    ["promised_value_fy26", "Promised value FY26", "Promised or target value from benefits ledger. Not realized value.", "initiative", "table"],
    ["partial_finance_validated_value_ytd", "Partial finance-validated value YTD", "Partial value evidence from usage/KPI/finance extracts. Must not be labeled realized savings.", "initiative", "metric_card"],
    ["ai_usage_signal", "AI usage signals", "Usage/adoption signals from benefits realization usage ledger.", "initiative", "table"],
    ["ai_operational_kpi_signal", "AI operating KPI signals", "Operational KPI movement tied to AI/tool adoption rows.", "initiative", "table"],
    ["candidate_ai_opportunity_count", "Candidate AI opportunities", "Candidate/discovery AI opportunities that must not inherit funding from platform work.", "initiative", "table"],
    ["tower_watch_pressure_signal", "Tower watch and pressure signals", "Pain, pressure, caveat, and evidence-gap signals from metrics and operational process evidence.", "enterprise_envelope", "table"],
    ["measured_value_ytd", "Measured realized value YTD", "Realized/proven value. This remains zero unless actual outcome-proof rows explicitly permit it.", "initiative", "metric_card"],
  ].map(([measure_key, label, description, default_scope, artifact_default]) => ({
    measure_key,
    label,
    description,
    default_scope,
    grain_filter: json({ source: "meridian_v3_projection" }),
    group_by: json([]),
    aggregation: measure_key.endsWith("_count") ? "count" : "sum",
    numerator_filter: null,
    denominator_filter: null,
    reconciles_to_measure_key: null,
    honesty_rule: "return_not_loaded_when_no_matching_facts",
    artifact_default,
    formula: `${FORMULA_VERSION}: deterministic projection from ${STANDARD_VERSION}`,
    formula_version: FORMULA_VERSION,
    active: true,
  }));

  const questionContracts = [
    ["tower_total_it_spend", "lookup", "total_it_spend", "total_it_budget_fy26", "enterprise_envelope", "metric_card", ["What is the FY26 technology budget?", "Where is the budget split between run and change?"]],
    ["tower_top_it_programs_by_budget", "table", "top_it_programs_by_budget", "initiative_budget_fy26", "initiative", "table", ["Which funded programs are biggest?", "Which initiatives should the CIO inspect first?"]],
    ["tower_ai_spend_portfolio", "table", "ai_spend_portfolio", "ai_tagged_spend_fy26", "initiative", "table", ["Where is AI spend going by platform, vendor, and program?", "How much Copilot, ServiceNow, Workday, Databricks, cloud, and governance spend exists?"]],
    ["tower_ai_usage_value", "diagnose", "ai_usage_value", "ai_usage_signal", "initiative", "table", ["What usage evidence exists for Copilot, ServiceNow, Workday, and developer AI?", "Why is Copilot not successful yet?"]],
    ["tower_value_realization", "diagnose", "value_realization", "partial_finance_validated_value_ytd", "initiative", "table", ["What value is working versus not proven?", "Which AI investments have partial finance validation?"]],
    ["tower_watch_stop_scale", "diagnose", "watch_stop_scale", "tower_watch_pressure_signal", "enterprise_envelope", "table", ["Which initiatives should be watched, stopped, or held?", "Where is the pressure or pain in the portfolio?"]],
  ].map(([contract_key, intent, question_family, measure_key, default_scope, artifact_type, examples]) => ({
    contract_key,
    surface: "tower",
    intent,
    question_family,
    measure_key,
    default_scope,
    dimensions: json(["program", "vendor", "system", "funding", "usage", "value", "evidence"]),
    filters_schema: json({ tenant_key: TENANT_KEY }),
    required_fields: json(["source_fact_keys", "evidence_id", "value_claim_status", "caveat"]),
    artifact_type,
    outside_scope_rule: "refuse_and_offer_tower_scope",
    prompt_policy_key: "cio_tower_visible_answer_v1",
    visible_answer_contract: "Claude owns prose. AbarVa owns deterministic Tower facts, evidence lineage, and value-claim gates. Renderer must not relabel partial value as realized value.",
    examples: json(examples),
    active: true,
  }));

  const measureResults = [
    measureResult("total_it_budget_fy26", "enterprise_envelope", "fy26", "committed", {}, totalBudgetFact.value_numeric, [totalBudgetFact], {
      source_file: FILES.budget08,
      source_rule: "SUM additive fy26_budget_line rows only",
    }),
    measureResult("run_budget_fy26", "enterprise_envelope", "fy26", "committed", {}, sum(atomicBudgetRows, "run_budget_usd"), runBudgetFacts),
    measureResult("change_budget_fy26", "enterprise_envelope", "fy26", "committed", {}, sum(atomicBudgetRows, "change_budget_usd"), changeBudgetFacts),
    measureResult("initiative_budget_fy26", "initiative", "fy26", "committed", {}, sum(programRows.filter((row) => row.initiative_status === "active" && row.funding_status === "approved"), "approved_funding_usd"), programFacts, {
      approved_program_count: programFacts.length,
    }),
    measureResult("ai_tagged_spend_fy26", "initiative", "fy26", "committed", {}, sum(aiSpendRows, "ai_tagged_budget_usd"), aiSpendFacts, {
      additive_status: "non_additive_ai_lens",
      warning: "AI spend lens should not be added to total IT budget; it cuts across program/platform rows.",
      by_category: Object.fromEntries([...groupBy(aiSpendRows, (row) => row.ai_spend_category || "unknown")].map(([key, rows]) => [key, sum(rows, "ai_tagged_budget_usd")])),
      by_vendor: Object.fromEntries([...groupBy(aiSpendRows, (row) => row.vendor_name || "unknown")].map(([key, rows]) => [key, sum(rows, "ai_tagged_budget_usd")])),
    }),
    measureResult("promised_value_fy26", "initiative", "fy26", "forecast", {}, sum(benefitRows, "promised_value_usd"), promisedValueFacts, {
      realized_value_allowed: false,
    }),
    measureResult("partial_finance_validated_value_ytd", "initiative", "ytd", "actual", {}, sum(benefitRows.filter((row) => row.tower_claim_allowed === "partial"), "finance_validated_value_usd"), partialValueFacts, {
      caveat: "Partial finance-validated value only; not realized savings.",
    }),
    measureResult("ai_usage_signal", "initiative", "ytd", "actual", {}, adoptionFacts.length, adoptionFacts, {
      rows: adoptionFacts.map((row) => ({
        fact_key: row.fact_key,
        value_numeric: row.value_numeric,
        attributes: JSON.parse(row.attributes),
      })),
    }),
    measureResult("measured_value_ytd", "initiative", "ytd", "actual", {}, 0, [], {
      claim_gate: "blocked",
      reason: "No row allows realized/proven/delivered value language.",
    }),
    measureResult("candidate_ai_opportunity_count", "initiative", "current", "baseline", {}, candidateFacts.length, candidateFacts, {
      member_service_ai_assist_funded: false,
    }),
    measureResult("tower_watch_pressure_signal", "enterprise_envelope", "current", "baseline", {}, pressureFacts.length, pressureFacts, {
      sample_themes: summarizePressureThemes(pressureFacts),
    }),
  ];

  const projection = {
    generated_at: new Date().toISOString(),
    mode: DRY_RUN ? "dry_run" : "write_requested",
    tenant_key: TENANT_KEY,
    tenant_label: TENANT_LABEL,
    source_standard: STANDARD_VERSION,
    formula_version: FORMULA_VERSION,
    truth_split: {
      source_packet_refreshed: true,
      azure_postgres_written_by_this_run: false,
      active_tenant_access_updated: false,
      realized_value_language_allowed: false,
      partial_value_language_allowed_with_caveat: true,
    },
    source_volumetrics: Object.fromEntries(Object.entries(FILES).map(([key, file]) => [key, { file, rows: data[key].length, checksum_sha256: checksum(file) }])),
    output_counts: {
      sources: sources.length,
      entities: entityMap.size,
      facts: facts.length,
      relationships: relationships.size,
      measures: measures.length,
      question_contracts: questionContracts.length,
      measure_results: measureResults.length,
    },
    headline: {
      total_it_budget_fy26: totalBudgetFact.value_numeric,
      run_budget_fy26: sum(atomicBudgetRows, "run_budget_usd"),
      change_budget_fy26: sum(atomicBudgetRows, "change_budget_usd"),
      approved_program_budget_fy26: sum(programRows.filter((row) => row.initiative_status === "active" && row.funding_status === "approved"), "approved_funding_usd"),
    ai_tagged_spend_fy26_non_additive: sum(aiSpendRows, "ai_tagged_budget_usd"),
      promised_value_fy26: sum(benefitRows, "promised_value_usd"),
      partial_finance_validated_value_ytd: sum(benefitRows.filter((row) => row.tower_claim_allowed === "partial"), "finance_validated_value_usd"),
      realized_value_ytd_allowed: 0,
      candidate_ai_opportunities: candidateFacts.length,
      watch_pressure_signals: pressureFacts.length,
    },
    decision_lenses: buildDecisionLenses(data, { aiSpendRows, benefitRows, programRows, candidateUseCases, pressureFacts }),
    sources,
    entities: [...entityMap.values()],
    facts,
    relationships: [...relationships.values()],
    measures,
    question_contracts: questionContracts,
    measure_results: measureResults,
  };

  return projection;
}

function summarizePressureThemes(pressureFacts) {
  const text = pressureFacts.map((factRow) => factRow.attributes).join(" ").toLowerCase();
  return [
    ["identity_and_governance", /identity|governance|audit|control/.test(text)],
    ["baseline_and_actuals", /baseline|actual|finance/.test(text)],
    ["data_lineage", /lineage|semantic|data quality|certified/.test(text)],
    ["contact_center_readiness", /contact center|member|transcript|crm/.test(text)],
    ["platform_readiness", /platform|databricks|aws|cloud|medallion/.test(text)],
  ].filter(([, present]) => present).map(([theme]) => theme);
}

function buildDecisionLenses(data, { aiSpendRows, benefitRows, programRows, candidateUseCases, pressureFacts }) {
  const benefitsByProgram = new Map(benefitRows.map((row) => [row.ai_program_id, row]));
  const programLens = programRows
    .filter((row) => row.initiative_status === "active" || row.funding_status === "approved")
    .map((row) => {
      const benefit = benefitsByProgram.get(row.program_code);
      const spendRows = aiSpendRows.filter((spend) => spend.program_code === row.program_code);
      const posture =
        benefit?.tower_claim_allowed === "partial"
          ? "working_partial_value"
          : benefit?.tower_claim_allowed === "no"
            ? "watch_foundation_or_not_claimable"
            : row.funding_status === "approved"
              ? "watch_measurement_required"
              : "hold_not_funded";
      return {
        program_code: row.program_code,
        program_name: row.program_name,
        approved_funding_usd: number(row.approved_funding_usd),
      ai_tagged_spend_usd: number(row.ai_tagged_approved_funding_usd),
        ai_spend_category: row.ai_spend_category || "not_ai",
        executive_owner: row.executive_owner,
        finance_owner: row.finance_owner,
        usage_metric: benefit?.usage_metric || "",
        usage_actual: benefit ? number(benefit.usage_actual) : null,
        adoption_rate_pct: benefit ? number(benefit.adoption_rate_pct) : null,
        partial_finance_validated_value_usd: benefit ? number(benefit.finance_validated_value_usd) : 0,
        value_claim_status: benefit?.value_claim_status || "not_loaded",
        tower_claim_allowed: benefit?.tower_claim_allowed || "not_loaded",
        posture,
        caveat: benefit?.caveat || row.notes || "",
      };
    });

  return {
    program_portfolio: programLens,
    ai_spend_by_category: Object.entries(
      Object.fromEntries([...groupBy(aiSpendRows, (row) => row.ai_spend_category || "unknown")].map(([key, rows]) => [key, sum(rows, "ai_tagged_budget_usd")])),
    ).map(([category, amount_usd]) => ({ category, amount_usd })),
    ai_spend_by_vendor: Object.entries(
      Object.fromEntries([...groupBy(aiSpendRows, (row) => row.vendor_name || "unknown")].map(([key, rows]) => [key, sum(rows, "ai_tagged_budget_usd")])),
    ).map(([vendor, amount_usd]) => ({ vendor, amount_usd })),
    usage_and_benefits: benefitRows.map((row) => ({
      program_name: row.program_name,
      vendor_name: row.vendor_name,
      tool_name: row.tool_name,
      promised_value_usd: number(row.promised_value_usd),
      usage_metric: row.usage_metric,
      usage_actual: number(row.usage_actual),
      adoption_rate_pct: number(row.adoption_rate_pct),
      operational_kpi: row.operational_kpi,
      kpi_baseline: row.kpi_baseline,
      kpi_actual: row.kpi_actual,
      finance_validated_value_usd: number(row.finance_validated_value_usd),
      value_claim_status: row.value_claim_status,
      tower_claim_allowed: row.tower_claim_allowed,
      caveat: row.caveat,
    })),
    candidate_ai_opportunities: candidateUseCases.map((row) => ({
      use_case: row.use_case || row.business_name,
      business_problem: row.business_problem,
      affected_process: row.affected_process,
      readiness_status: row.readiness_status,
      funding_status: row.funding_status,
      approved_funding_usd: number(row.approved_funding_usd),
      expected_decision_path: row.expected_decision_path,
      caveat: row.caveat,
    })),
    watch_pressure_themes: summarizePressureThemes(pressureFacts),
  };
}

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, "\"\"")}"` : str;
}

function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscape(row[col])).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function formatUsd(value) {
  return `$${(Number(value || 0) / 1_000_000).toFixed(1)}M`;
}

function renderMarkdown(projection) {
  const rows = [
    ["FY26 total technology budget", formatUsd(projection.headline.total_it_budget_fy26), "08_it_budget_spend_value.csv"],
    ["FY26 run budget", formatUsd(projection.headline.run_budget_fy26), "08_it_budget_spend_value.csv"],
    ["FY26 change budget", formatUsd(projection.headline.change_budget_fy26), "08_it_budget_spend_value.csv"],
    ["Approved program budget", formatUsd(projection.headline.approved_program_budget_fy26), "SA04 + 09"],
    ["AI-tagged spend lens", formatUsd(projection.headline.ai_tagged_spend_fy26_non_additive), "SA02 + 08"],
    ["Promised AI value", formatUsd(projection.headline.promised_value_fy26), "SA08"],
    ["Partial finance-validated value", formatUsd(projection.headline.partial_finance_validated_value_ytd), "SA08"],
    ["Realized/proven value allowed", "$0.0M", "Blocked by claim gate"],
  ];
  const mdRows = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `# Meridian V3 to CIO Tower Projection\n\nGenerated: ${projection.generated_at}\n\nThis projection turns the refreshed Meridian V3 source packet into the row families Tower actually needs: budget, funded programs, AI spend by platform/vendor, usage/adoption/benefit evidence, candidate AI opportunities, and watch/pressure signals.\n\nIt is a dry-run artifact unless executed by the governed ACA data-build job with \`--write\`.\n\n## Headline\n\n| Item | Value | Source |\n| --- | ---: | --- |\n${mdRows}\n\n## Counts\n\n- Sources: ${projection.output_counts.sources}\n- Entities: ${projection.output_counts.entities}\n- Facts: ${projection.output_counts.facts}\n- Relationships: ${projection.output_counts.relationships}\n- Measures: ${projection.output_counts.measures}\n- Measure results: ${projection.output_counts.measure_results}\n\n## Decision Lenses\n\n- Program portfolio rows: ${projection.decision_lenses.program_portfolio.length}\n- AI spend categories: ${projection.decision_lenses.ai_spend_by_category.length}\n- AI spend vendors/tools: ${projection.decision_lenses.ai_spend_by_vendor.length}\n- Usage/benefit rows: ${projection.decision_lenses.usage_and_benefits.length}\n- Candidate AI opportunities: ${projection.decision_lenses.candidate_ai_opportunities.length}\n- Watch/pressure themes: ${projection.decision_lenses.watch_pressure_themes.join(", ")}\n\n## Truth Split\n\n- No Azure/Postgres write is claimed by this dry-run artifact.\n- No Active Tenant Access update is claimed.\n- No realized/proven/delivered value language is allowed.\n- Partial finance-validated value may be shown only with the SA08 caveats.\n`;
}

function renderHtml(projection) {
  const cards = [
    ["FY26 technology budget", projection.headline.total_it_budget_fy26],
    ["Run budget", projection.headline.run_budget_fy26],
    ["Change budget", projection.headline.change_budget_fy26],
    ["Approved program budget", projection.headline.approved_program_budget_fy26],
    ["AI-tagged spend lens", projection.headline.ai_tagged_spend_fy26_non_additive],
    ["Partial finance-validated value", projection.headline.partial_finance_validated_value_ytd],
  ]
    .map(([label, value]) => `<div class="card"><div class="k">${label}</div><div class="v">${formatUsd(value)}</div></div>`)
    .join("");
  const programRows = projection.decision_lenses.program_portfolio
    .slice(0, 20)
    .map((row) => `<tr><td>${row.program_name}</td><td>${formatUsd(row.approved_funding_usd)}</td><td>${formatUsd(row.ai_tagged_spend_usd)}</td><td>${row.value_claim_status}</td><td>${row.posture}</td><td>${row.caveat}</td></tr>`)
    .join("");
  const usageRows = projection.decision_lenses.usage_and_benefits
    .map((row) => `<tr><td>${row.tool_name}</td><td>${row.vendor_name}</td><td>${row.usage_metric}: ${row.usage_actual}</td><td>${Math.round(row.adoption_rate_pct * 100)}%</td><td>${formatUsd(row.finance_validated_value_usd)}</td><td>${row.value_claim_status}</td><td>${row.caveat}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Meridian V3 Tower Projection</title><style>body{font-family:Inter,Arial,sans-serif;margin:32px;color:#0b1736;background:#f7f8fb}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card{background:white;border:1px solid #dfe5ef;border-radius:12px;padding:18px;box-shadow:0 10px 30px rgba(15,23,42,.06)}.k{text-transform:uppercase;letter-spacing:.08em;color:#657089;font-size:12px}.v{font-size:30px;font-weight:800;margin-top:8px}table{width:100%;border-collapse:collapse;background:white;border:1px solid #dfe5ef;border-radius:12px;overflow:hidden;margin:18px 0}th,td{padding:10px 12px;border-bottom:1px solid #e8edf5;text-align:left;vertical-align:top;font-size:13px}th{background:#eef2f7}.warn{background:#fff7ed;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:8px;margin:18px 0}.ok{background:#ecfdf5;border-left:4px solid #10b981;padding:14px 16px;border-radius:8px;margin:18px 0}</style></head><body><h1>Meridian V3 to Tower Projection</h1><p>This is the broader Tower decision layer: budget, funded programs, AI spend, usage/adoption, value posture, candidate opportunities, and watch signals.</p><div class="warn">Dry run only unless executed by the governed ACA data-build job. Realized/proven value remains blocked.</div><div class="grid">${cards}</div><h2>Program Portfolio</h2><table><thead><tr><th>Program</th><th>Approved funding</th><th>AI spend lens</th><th>Value status</th><th>Posture</th><th>Caveat</th></tr></thead><tbody>${programRows}</tbody></table><h2>Usage And Benefit Evidence</h2><table><thead><tr><th>Tool</th><th>Vendor</th><th>Usage</th><th>Adoption</th><th>Partial value</th><th>Status</th><th>Caveat</th></tr></thead><tbody>${usageRows}</tbody></table><div class="ok">Projection facts: ${projection.output_counts.facts}. Measures: ${projection.output_counts.measure_results}. Source rows remain traceable to refreshed V3 templates.</div></body></html>`;
}

async function upsertBatch(client, table, rows, conflictCols) {
  if (!rows.length) return 0;
  const cols = Object.keys(rows[0]);
  const updateCols = cols.filter((col) => !conflictCols.includes(col));
  let written = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const values = [];
    const tuples = batch.map((row) => {
      const placeholders = cols.map((col) => {
        let value = row[col] ?? null;
        if (["grain_filter", "group_by", "numerator_filter", "denominator_filter", "dimensions", "filters_schema", "required_fields", "examples", "attributes", "metadata", "value_json"].includes(col) && typeof value === "object") {
          value = JSON.stringify(value);
        }
        values.push(value);
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    const conflictClause = updateCols.length
      ? `DO UPDATE SET ${updateCols.map((col) => `${col} = EXCLUDED.${col}`).join(", ")}`
      : "DO NOTHING";
    await client.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES ${tuples.join(", ")} ON CONFLICT (${conflictCols.join(", ")}) ${conflictClause}`, values);
    written += batch.length;
  }
  return written;
}

async function writeToDatabase(projection) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for --write. Use the governed ACA data-build job path.");
  }
  if (process.env.MERIDIAN_CIO_TOWER_WRITE_APPROVED !== "true") {
    throw new Error("MERIDIAN_CIO_TOWER_WRITE_APPROVED=true is required for --write.");
  }
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM cio_tower.measure_results WHERE tenant_key = $1", [TENANT_KEY]);
    await client.query("DELETE FROM cio_tower.relationships WHERE tenant_key = $1", [TENANT_KEY]);
    await client.query("DELETE FROM cio_tower.facts WHERE tenant_key = $1", [TENANT_KEY]);
    await client.query("DELETE FROM cio_tower.entities WHERE tenant_key = $1", [TENANT_KEY]);
    await client.query("DELETE FROM cio_tower.source_registry WHERE tenant_key = $1", [TENANT_KEY]);
    await upsertBatch(client, "cio_tower.source_registry", projection.sources, ["source_key"]);
    await upsertBatch(client, "cio_tower.measures", projection.measures, ["measure_key"]);
    await upsertBatch(client, "cio_tower.question_contracts", projection.question_contracts, ["contract_key"]);
    await upsertBatch(client, "cio_tower.entities", projection.entities, ["entity_key"]);
    await upsertBatch(client, "cio_tower.facts", projection.facts, ["fact_key"]);
    await upsertBatch(client, "cio_tower.relationships", projection.relationships, ["relationship_key"]);
    await upsertBatch(client, "cio_tower.measure_results", projection.measure_results, ["result_key"]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

function emitProofBundle(outDir) {
  const tarPath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`Failed to create proof bundle: ${result.stderr || result.stdout}`);
  }
  const payload = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(payload);
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main() {
  const projection = buildProjection();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "projection.json"), JSON.stringify(projection, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "summary.md"), renderMarkdown(projection));
  fs.writeFileSync(path.join(OUT_DIR, "proof.html"), renderHtml(projection));
  writeCsv(path.join(OUT_DIR, "measure-results.csv"), projection.measure_results, ["result_key", "measure_key", "scope", "period", "basis", "value_numeric", "value_json"]);
  writeCsv(path.join(OUT_DIR, "source-to-fact-lineage.csv"), projection.facts, ["fact_key", "measure", "view", "scope", "basis", "period", "value_numeric", "source_key", "source_row", "attributes"]);
  writeCsv(path.join(OUT_DIR, "program-portfolio-lens.csv"), projection.decision_lenses.program_portfolio, ["program_code", "program_name", "approved_funding_usd", "ai_tagged_spend_usd", "ai_spend_category", "executive_owner", "usage_metric", "usage_actual", "adoption_rate_pct", "partial_finance_validated_value_usd", "value_claim_status", "tower_claim_allowed", "posture", "caveat"]);
  writeCsv(path.join(OUT_DIR, "usage-benefit-lens.csv"), projection.decision_lenses.usage_and_benefits, ["program_name", "vendor_name", "tool_name", "promised_value_usd", "usage_metric", "usage_actual", "adoption_rate_pct", "operational_kpi", "kpi_baseline", "kpi_actual", "finance_validated_value_usd", "value_claim_status", "tower_claim_allowed", "caveat"]);
  console.log(`Projection written to ${OUT_DIR}`);
  console.log(JSON.stringify(projection.headline, null, 2));
  if (WRITE) {
    await writeToDatabase(projection);
    console.log("Database write complete.");
  } else {
    console.log("Dry-run only. No Azure/Postgres rows were written.");
  }
  if (EMIT_PROOF_BUNDLE) {
    emitProofBundle(OUT_DIR);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

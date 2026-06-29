#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TENANTS = [
  "apex-retail-synthetic-v6",
  "first-capital-financial-synthetic-v6",
  "lakeshore-industries-synthetic-v6",
  "meridian-health-synthetic-v6",
  "skyharbor-air-synthetic-v6",
];

const DIMENSION_FILES = {
  enterprise_profile: "V6_01_enterprise_profile.csv",
  business_function: "V6_02_business_functions.csv",
  org_ownership: "V6_03_org_ownership.csv",
  workforce_persona: "V6_04_workforce_personas.csv",
  application_system: "V6_05_applications_systems.csv",
  data_asset_integration: "V6_06_data_assets_integrations.csv",
  vendor_contract: "V6_07_vendors_contracts.csv",
  spend_value: "V6_08_spend_value.csv",
  program_initiative: "V6_09_programs_initiatives.csv",
  ai_initiative: "V6_10_ai_initiatives.csv",
  operations_risk_control: "V6_11_operations_risk_controls.csv",
  relationship: "V6_12_relationships.csv",
  evidence_source: "V6_13_evidence_sources.csv",
  metric_definition: "V6_14_metric_definitions.csv",
  industry_corpus_pattern: "V6_15_industry_corpus_patterns.csv",
  expert_lens: "V6_16_expert_lenses.csv",
};

const CRITICAL_COLUMNS = {
  enterprise_profile: ["company_name", "industry", "sub_industry", "revenue_usd", "employee_count", "business_model", "strategic_priorities"],
  business_function: ["function_name", "executive_owner", "operating_model", "primary_kpis", "critical_processes"],
  org_ownership: ["org_unit_name", "leader_role", "reports_to_role", "decision_rights", "owned_systems", "owned_processes"],
  workforce_persona: ["persona_name", "business_area", "population_count", "ai_relevance", "work_context"],
  application_system: ["system_name", "business_capability", "system_owner", "criticality", "lifecycle_status", "vendor_id", "annual_cost_usd", "integrations", "data_dependencies", "ai_relevance"],
  data_asset_integration: ["data_asset_name", "data_owner", "system_of_record", "lineage", "consumers", "quality_score", "governance_status"],
  vendor_contract: ["vendor_name", "contract_id", "service", "annual_cost_usd", "renewal_date", "owning_function", "linked_systems", "contract_risk", "pricing_basis"],
  spend_value: ["amount_usd", "amount_type", "owner", "program_id", "vendor_id", "system_id", "committed_vs_discretionary", "renewal_or_gate_date", "value_linkage", "unit_economics"],
  program_initiative: ["business_owner", "technology_owner", "executive_sponsor", "phase", "budget_usd", "spend_to_date_usd", "expected_value_usd", "realized_value_usd", "value_basis", "status", "target_date", "dependencies", "risks", "decision_needed"],
  ai_initiative: ["use_case", "business_process", "tool_or_model", "agent_or_copilot_name", "user_group", "licensed_users", "active_users", "adoption_metric", "value_hypothesis", "measured_value_usd", "production_status", "risk_status", "model_risk_tier", "data_readiness", "decision_needed", "scale_hold_stop"],
  operations_risk_control: ["process", "process_owner", "severity", "status", "control", "affected_systems", "business_impact"],
  relationship: ["from_object_family", "from_record_id", "relationship_type", "to_object_family", "to_record_id", "evidence_basis", "relationship_confidence"],
  evidence_source: ["evidence_title", "evidence_type", "source_location", "evidence_owner", "evidence_confidence"],
  metric_definition: ["metric_name", "metric_definition", "calculation_basis", "unit_of_measure", "metric_owner", "metric_claim_level"],
  industry_corpus_pattern: ["pattern_name", "industry_domain", "when_to_apply", "signals", "recommended_actions", "corpus_context_label"],
  expert_lens: ["expert_lens_name", "domain_focus", "activation_conditions", "lens_questions", "lens_forbidden_claims"],
};

const MONEY_VALUE_COLUMNS = {
  application_system: ["annual_cost_usd"],
  vendor_contract: ["annual_cost_usd", "renewal_date", "contract_risk", "pricing_basis"],
  spend_value: ["amount_usd", "amount_type", "owner", "period_start", "period_end", "value_linkage", "unit_economics"],
  program_initiative: ["budget_usd", "spend_to_date_usd", "expected_value_usd", "realized_value_usd", "value_basis", "target_date"],
  ai_initiative: ["licensed_users", "active_users", "adoption_metric", "value_hypothesis", "measured_value_usd", "production_status", "risk_status", "data_readiness", "scale_hold_stop"],
};

const OLD_DEMO_NAME_RE =
  /\b(Apex Retail Group|Apex Retail|Meridian Health System|Meridian Health|First Capital Financial|First Capital|Arcturus Financial Group|Arcturus|SkyHarbor Air Group|SkyHarbor Airlines|SkyHarbor Air|SkyHarbor|Lakeshore Industries|Lakeshore Holdings|Lakeshore)\b/i;
const TECHNICAL_OLD_NAME_SCAN_SKIP = new Set([
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

const PRIORITY_OVERRIDES = new Map([
  ["skyharbor-air-synthetic-v6:application_system", 1],
  ["skyharbor-air-synthetic-v6:data_asset_integration", 2],
  ["skyharbor-air-synthetic-v6:vendor_contract", 3],
  ["skyharbor-air-synthetic-v6:program_initiative", 4],
  ["skyharbor-air-synthetic-v6:ai_initiative", 5],
  ["lakeshore-industries-synthetic-v6:business_function", 6],
  ["lakeshore-industries-synthetic-v6:vendor_contract", 7],
  ["lakeshore-industries-synthetic-v6:operations_risk_control", 8],
  ["lakeshore-industries-synthetic-v6:application_system", 9],
]);

const args = parseArgs(process.argv.slice(2));
const repoRoot = path.resolve(args.repoRoot ?? process.cwd());
const datasetRoot = path.resolve(args.datasetRoot ?? path.join(repoRoot, "datasets"));
const outDir = path.resolve(
  args.outDir ??
    path.join(repoRoot, "reports", `home-v6-critical-gap-report-${todayStamp()}`),
);
const tenants = (args.tenants ? args.tenants.split(",") : DEFAULT_TENANTS).filter(Boolean);
const failOnHigh = args.check === "1" || args.check === "true";

main();

function main() {
  const rows = [];
  for (const tenantDir of tenants) {
    for (const [dimension, filename] of Object.entries(DIMENSION_FILES)) {
      const filePath = path.join(datasetRoot, tenantDir, "templates", filename);
      const records = fs.existsSync(filePath)
        ? parseCsv(fs.readFileSync(filePath, "utf8"))
        : [];
      rows.push(scoreFile({ tenantDir, dimension, filename, filePath, records }));
    }
  }

  rows.sort((a, b) => a.priority - b.priority || b.riskScore - a.riskScore || a.tenantDir.localeCompare(b.tenantDir));
  const summary = summarize(rows);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(outDir, "file-gaps.json"), JSON.stringify(rows, null, 2));
  fs.writeFileSync(path.join(outDir, "file-gaps.csv"), renderCsv(rows));
  fs.writeFileSync(path.join(outDir, "readme.md"), renderMarkdown(summary, rows));

  console.log(JSON.stringify(summary, null, 2));
  if (failOnHigh && summary.highRiskFileCount > 0) {
    process.exitCode = 1;
  }
}

function scoreFile({ tenantDir, dimension, filename, filePath, records }) {
  const criticalColumns = CRITICAL_COLUMNS[dimension] ?? [];
  const moneyColumns = MONEY_VALUE_COLUMNS[dimension] ?? [];
  const missingColumns = [];
  const missingMoneyColumns = [];
  let oldNameHits = 0;
  let sourceOwnerMissing = 0;

  for (const column of criticalColumns) {
    const missingRows = records.filter((record) => !cleanValue(record[column])).length;
    if (missingRows > 0) {
      missingColumns.push({
        column,
        missingRows,
        missingRate: records.length > 0 ? missingRows / records.length : 1,
      });
    }
  }

  for (const column of moneyColumns) {
    const missingRows = records.filter((record) => !cleanValue(record[column])).length;
    if (missingRows > 0) {
      missingMoneyColumns.push({
        column,
        missingRows,
        missingRate: records.length > 0 ? missingRows / records.length : 1,
      });
    }
  }

  for (const record of records) {
    if (!cleanValue(record.source_owner)) sourceOwnerMissing += 1;
    for (const [column, value] of Object.entries(record)) {
      if (shouldSkipOldNameScan(column)) continue;
      if (OLD_DEMO_NAME_RE.test(String(value))) oldNameHits += 1;
    }
  }

  const criticalCompleteness = completeness(records.length, criticalColumns.length, missingColumns);
  const moneyValueCompleteness = completeness(records.length, moneyColumns.length, missingMoneyColumns, true);
  const sourceOwnerGapRate = records.length > 0 ? sourceOwnerMissing / records.length : 1;
  const priority = PRIORITY_OVERRIDES.get(`${tenantDir}:${dimension}`) ?? (dimension === "expert_lens" ? 10 : 100);
  const riskScore = calculateRiskScore({
    records,
    criticalCompleteness,
    moneyValueCompleteness,
    sourceOwnerGapRate,
    oldNameHits,
    missingColumns,
    moneyColumns,
  });

  return {
    tenantDir,
    dimension,
    filename,
    filePath,
    rowCount: records.length,
    priority,
    riskLevel: riskScore >= 80 ? "high" : riskScore >= 50 ? "medium" : "low",
    riskScore,
    criticalCompleteness,
    moneyValueCompleteness,
    sourceOwnerGapRate,
    oldNameHitCount: oldNameHits,
    missingCriticalColumns: missingColumns
      .sort((a, b) => b.missingRate - a.missingRate || a.column.localeCompare(b.column))
      .slice(0, 12),
    missingMoneyValueColumns: missingMoneyColumns
      .sort((a, b) => b.missingRate - a.missingRate || a.column.localeCompare(b.column))
      .slice(0, 12),
    recommendedAction: recommendedAction({
      records,
      criticalCompleteness,
      moneyValueCompleteness,
      sourceOwnerGapRate,
      oldNameHits,
      missingColumns,
      missingMoneyColumns,
    }),
  };
}

function completeness(rowCount, columnCount, missingColumns, neutralIfNoColumns = false) {
  if (columnCount === 0) return neutralIfNoColumns ? 1 : 0;
  if (rowCount === 0) return 0;
  const total = rowCount * columnCount;
  const missing = missingColumns.reduce((sum, item) => sum + item.missingRows, 0);
  return Number(((total - missing) / total).toFixed(4));
}

function calculateRiskScore(args) {
  if (args.records.length === 0) return 100;
  let score = 0;
  if (args.criticalCompleteness < 0.35) score += 45;
  else if (args.criticalCompleteness < 0.65) score += 30;
  else if (args.criticalCompleteness < 0.85) score += 15;

  if (args.moneyColumns.length > 0) {
    if (args.moneyValueCompleteness < 0.25) score += 35;
    else if (args.moneyValueCompleteness < 0.7) score += 20;
  }

  if (args.sourceOwnerGapRate > 0.8) score += 20;
  else if (args.sourceOwnerGapRate > 0.5) score += 10;
  if (args.oldNameHits > 0) score += 10;
  if (args.missingColumns.some((item) => item.missingRate >= 0.8)) score += 15;
  return Math.min(score, 100);
}

function recommendedAction(args) {
  if (args.records.length === 0) return "Add V6 rows or mark the dimension explicitly out of scope.";
  const actions = [];
  if (args.oldNameHits > 0) actions.push("Replace raw old demo/legal names with generic demo tenant names in user-visible fields.");
  if (args.criticalCompleteness < 0.85) actions.push("Fill critical business metadata fields before using this file for rich Home answers.");
  if (args.moneyValueCompleteness < 0.7 && args.missingMoneyColumns.length > 0) actions.push("Do not answer dollar, value, adoption, or ROI claims from this file until money/value fields are filled.");
  if (args.sourceOwnerGapRate > 0.5) actions.push("Fill source_owner or evidence_owner so answers can prove stewardship.");
  return actions.join(" ") || "Keep as low-risk; validate with live answer QA.";
}

function summarize(rows) {
  const highRisk = rows.filter((row) => row.riskLevel === "high");
  const mediumRisk = rows.filter((row) => row.riskLevel === "medium");
  const byTenant = group(rows, "tenantDir");
  return {
    generatedAt: new Date().toISOString(),
    datasetRoot,
    outDir,
    tenants,
    fileCount: rows.length,
    highRiskFileCount: highRisk.length,
    mediumRiskFileCount: mediumRisk.length,
    oldNameRiskFileCount: rows.filter((row) => row.oldNameHitCount > 0).length,
    moneyValueNotReadyFileCount: rows.filter((row) => row.moneyValueCompleteness < 0.7).length,
    priorityFiles: rows.slice(0, 15).map((row) => ({
      tenantDir: row.tenantDir,
      dimension: row.dimension,
      filename: row.filename,
      riskLevel: row.riskLevel,
      riskScore: row.riskScore,
      criticalCompleteness: row.criticalCompleteness,
      moneyValueCompleteness: row.moneyValueCompleteness,
      recommendedAction: row.recommendedAction,
    })),
    byTenant,
  };
}

function group(rows, key) {
  const grouped = {};
  for (const row of rows) {
    const groupKey = row[key];
    const current =
      grouped[groupKey] ??
      { files: 0, highRisk: 0, mediumRisk: 0, oldNameRisk: 0, moneyValueNotReady: 0 };
    current.files += 1;
    current.highRisk += row.riskLevel === "high" ? 1 : 0;
    current.mediumRisk += row.riskLevel === "medium" ? 1 : 0;
    current.oldNameRisk += row.oldNameHitCount > 0 ? 1 : 0;
    current.moneyValueNotReady += row.moneyValueCompleteness < 0.7 ? 1 : 0;
    grouped[groupKey] = current;
  }
  return grouped;
}

function renderMarkdown(summary, rows) {
  const lines = [
    "# Home V6 Critical Gap Report",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "This report audits the V6 files directly. It does not call the app, Claude, or the renderer.",
    "",
    "## Summary",
    "",
    `- Files audited: ${summary.fileCount}`,
    `- High-risk files: ${summary.highRiskFileCount}`,
    `- Medium-risk files: ${summary.mediumRiskFileCount}`,
    `- Files with raw old-name risk: ${summary.oldNameRiskFileCount}`,
    `- Files not ready for money/value/adoption claims: ${summary.moneyValueNotReadyFileCount}`,
    "",
    "## Priority Fixes",
    "",
    "| Tenant | Dimension | File | Risk | Critical complete | Money/value complete | Action |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ];
  for (const row of rows.slice(0, 25)) {
    lines.push(
      `| ${row.tenantDir} | ${row.dimension} | ${row.filename} | ${row.riskLevel} ${row.riskScore} | ${pct(row.criticalCompleteness)} | ${pct(row.moneyValueCompleteness)} | ${escapeMd(row.recommendedAction)} |`,
    );
  }
  lines.push("", "## High-Risk Missing Columns", "");
  for (const row of rows.filter((item) => item.riskLevel === "high").slice(0, 25)) {
    lines.push(`- ${row.tenantDir} / ${row.filename}`);
    if (row.missingCriticalColumns.length) {
      lines.push(`  Critical: ${row.missingCriticalColumns.map((item) => `${item.column} (${pct(item.missingRate)} missing)`).join(", ")}`);
    }
    if (row.missingMoneyValueColumns.length) {
      lines.push(`  Money/value: ${row.missingMoneyValueColumns.map((item) => `${item.column} (${pct(item.missingRate)} missing)`).join(", ")}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderCsv(rows) {
  const headers = [
    "tenantDir",
    "dimension",
    "filename",
    "riskLevel",
    "riskScore",
    "rowCount",
    "criticalCompleteness",
    "moneyValueCompleteness",
    "sourceOwnerGapRate",
    "oldNameHitCount",
    "missingCriticalColumns",
    "missingMoneyValueColumns",
    "recommendedAction",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((header) => {
          if (header === "missingCriticalColumns") return csv(row.missingCriticalColumns.map((item) => item.column).join("|"));
          if (header === "missingMoneyValueColumns") return csv(row.missingMoneyValueColumns.map((item) => item.column).join("|"));
          return csv(row[header]);
        })
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows
    .filter((values) => values.some((value) => String(value).trim()))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "1";
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function cleanValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^data_thin:/i.test(text)) return "";
  if (/^unknown$/i.test(text)) return "";
  if (/^synthetic_demo$/i.test(text)) return "";
  if (/^v4_synthetic_pack$/i.test(text)) return "";
  if (/^static_snapshot$/i.test(text)) return "";
  if (/^confidential$/i.test(text)) return "";
  return text;
}

function shouldSkipOldNameScan(column) {
  return TECHNICAL_OLD_NAME_SCAN_SKIP.has(column) || column.endsWith("_id");
}

function csv(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function pct(value) {
  return `${Math.round(Number(value || 0) * 1000) / 10}%`;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

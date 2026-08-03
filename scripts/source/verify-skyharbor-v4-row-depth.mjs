import fs from "node:fs/promises";
import path from "node:path";

const packageDir = process.argv[2];

const commonRequiredColumns = [
  "tenant_key",
  "dataset_id",
  "dataset_version",
  "source_system",
  "source_module",
  "source_object",
  "source_record_id",
  "extract_job_id",
  "extract_method",
  "extract_timestamp",
  "as_of_date",
  "business_owner_role",
  "technical_owner_role",
  "quality_state",
  "evidence_state",
  "synthetic_generation_rule",
  "scenario_thread_id",
  "row_hash",
];

const validQualityStates = new Set([
  "accepted",
  "reviewed",
  "partial",
  "inferred",
  "disputed",
  "missing_evidence",
  "blocked",
]);

const validEvidenceStates = new Set([
  "source_record",
  "document_clause",
  "system_metric",
  "inferred_from_relationship",
  "self_reported",
  "not_available",
]);

const requiredThreads = new Set([
  "saas_rationalization",
  "managed_service_value_leakage",
  "cloud_commitment_exposure",
  "app_retirement_contract_conflict",
  "ai_value_proof_gap",
  "supplier_bafo_normalization",
  "evidence_conflict_resolution",
]);

const domainContracts = [
  {
    name: "supplier_master",
    match: /supplier|vendor/i,
    requiredAny: [["supplier_id", "vendor_id"], ["legal_name", "supplier_name", "vendor_name"], ["supplier_category", "commodity_code"], ["risk_tier", "supplier_risk_tier"]],
  },
  {
    name: "contract_header",
    match: /contract.*(workspace|header|register|family)|contracts?/i,
    requiredAny: [["contract_id"], ["vendor_id", "supplier_id"], ["agreement_type", "contract_type"], ["effective_date"], ["expiration_date"], ["annual_value", "contract_annual_value"], ["renewal_type"], ["notice_deadline"]],
  },
  {
    name: "legal_evidence",
    match: /document|clause|span|evidence|dpa|sow|amendment|instrument/i,
    requiredAny: [["file_id", "document_id"], ["document_role"], ["contract_id"], ["content_sha256", "file_sha256"], ["extraction_confidence", "confidence"], ["review_state", "quality_state"]],
  },
  {
    name: "financial_line",
    match: /invoice|purchase.?order|payment|accrual|po_/i,
    requiredAny: [["supplier_id", "vendor_id"], ["po_number", "purchase_order_number"], ["invoice_id", "invoice_number"], ["cost_center"], ["posting_date", "invoice_date"], ["net_amount", "line_amount", "actual_spend"], ["matching_state", "contract_match_state"]],
  },
  {
    name: "saas_usage",
    match: /saas|license|entra|m365|usage|copilot|github|atlassian/i,
    requiredAny: [["product_id", "sku_id", "tool_id"], ["assigned_seats", "paid_seats"], ["active_users", "monthly_active_users"], ["usage_metric_name"], ["month", "period_start"], ["unit_cost", "actual_cost"]],
  },
  {
    name: "cloud_consumption",
    match: /azure|aws|gcp|cloud|billing|cur|cost/i,
    requiredAny: [["subscription_id", "account_id", "project_id"], ["service_name"], ["region"], ["usage_quantity"], ["actual_cost", "amortized_cost"], ["commitment_id", "commitment_type"]],
  },
  {
    name: "service_performance",
    match: /sla|kpi|incident|request|change|performance|credit/i,
    requiredAny: [["contract_id"], ["metric_name"], ["target"], ["actual"], ["period_start"], ["breach_count"], ["credit_eligible"], ["credit_calculated", "credit_earned"]],
  },
  {
    name: "workforce_rate_card",
    match: /fieldglass|work.?order|worker|rate.?card|timesheet/i,
    requiredAny: [["sow_id", "work_order_id"], ["role", "role_title"], ["location"], ["bill_rate", "billed_rate"], ["hours"], ["approved_rate", "rate_card_id"]],
  },
  {
    name: "sourcing_event",
    match: /sourcing|event|supplier_response|bafo|rfp|rfq|rfi|evaluation/i,
    requiredAny: [["event_id"], ["event_type"], ["stage", "event_status"], ["supplier_id", "vendor_id"], ["response_id"], ["score", "technical_score", "commercial_score"], ["normalized_cost", "line_item_cost"]],
  },
  {
    name: "scope_mapping",
    match: /scope|application|platform|cmdb|leanix|dependency/i,
    requiredAny: [["contract_id"], ["application_id", "platform_id", "service_id"], ["criticality"], ["lifecycle"], ["relationship_method"], ["relationship_confidence", "confidence"]],
  },
];

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function normalizedHeader(header) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function detectDomain(fileName, headers) {
  const haystack = `${fileName} ${headers.join(" ")}`;
  return domainContracts.filter((contract) => contract.match.test(haystack));
}

function present(headers, alternatives) {
  return alternatives.some((column) => headers.has(normalizedHeader(column)));
}

function hasValue(row, headerIndex, column) {
  const index = headerIndex.get(column);
  if (index === undefined) return false;
  return String(row[index] ?? "").trim() !== "";
}

function rowHasAnyValue(row, headerIndex, alternatives) {
  return alternatives.some((column) => hasValue(row, headerIndex, normalizedHeader(column)));
}

async function listCsvFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listCsvFiles(fullPath));
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) files.push(fullPath);
  }
  return files;
}

async function validateCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const parsed = parseCsv(text);
  if (parsed.length < 2) fail("CSV has no data rows.", { filePath });

  const headers = parsed[0].map(normalizedHeader);
  const headerSet = new Set(headers);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const missingCommon = commonRequiredColumns.filter((column) => !headerSet.has(column));
  const domainMatches = detectDomain(path.basename(filePath), headers);
  const missingDomain = [];

  for (const domain of domainMatches) {
    for (const alternatives of domain.requiredAny) {
      if (!present(headerSet, alternatives)) missingDomain.push({ domain: domain.name, alternatives });
    }
  }

  const issues = [];
  const scenarioThreads = new Set();
  const qualityStates = new Set();
  const evidenceStates = new Set();
  const sampleRows = parsed.slice(1, Math.min(parsed.length, 202));

  for (const [offset, row] of sampleRows.entries()) {
    const rowNumber = offset + 2;
    for (const column of commonRequiredColumns) {
      if (!hasValue(row, headerIndex, column)) issues.push({ rowNumber, issue: "blank_common_field", column });
    }
    const qualityState = String(row[headerIndex.get("quality_state")] ?? "").trim();
    const evidenceState = String(row[headerIndex.get("evidence_state")] ?? "").trim();
    const thread = String(row[headerIndex.get("scenario_thread_id")] ?? "").trim();
    if (qualityState) qualityStates.add(qualityState);
    if (evidenceState) evidenceStates.add(evidenceState);
    if (thread) scenarioThreads.add(thread);
    if (qualityState && !validQualityStates.has(qualityState)) issues.push({ rowNumber, issue: "invalid_quality_state", qualityState });
    if (evidenceState && !validEvidenceStates.has(evidenceState)) issues.push({ rowNumber, issue: "invalid_evidence_state", evidenceState });

    for (const domain of domainMatches) {
      for (const alternatives of domain.requiredAny) {
        if (!rowHasAnyValue(row, headerIndex, alternatives)) {
          issues.push({ rowNumber, issue: "blank_domain_depth_field", domain: domain.name, alternatives });
        }
      }
    }
  }

  return {
    file: path.relative(packageDir, filePath),
    rows: parsed.length - 1,
    columns: headers.length,
    domains: domainMatches.map((domain) => domain.name),
    missing_common_columns: missingCommon,
    missing_domain_columns: missingDomain,
    sampled_issues: issues.slice(0, 20),
    sampled_issue_count: issues.length,
    scenario_threads: [...scenarioThreads].sort(),
    quality_states: [...qualityStates].sort(),
    evidence_states: [...evidenceStates].sort(),
  };
}

async function main() {
  if (!packageDir) fail("Usage: node scripts/source/verify-skyharbor-v4-row-depth.mjs <csv-directory>");
  const stat = await fs.stat(packageDir).catch(() => null);
  if (!stat?.isDirectory()) fail("Input must be a directory of generated CSV extracts.", { packageDir });

  const csvFiles = await listCsvFiles(packageDir);
  if (!csvFiles.length) fail("No CSV files found.", { packageDir });

  const results = [];
  for (const filePath of csvFiles) results.push(await validateCsv(filePath));

  const allThreads = new Set(results.flatMap((result) => result.scenario_threads));
  const missingThreads = [...requiredThreads].filter((thread) => !allThreads.has(thread));
  const failures = results.flatMap((result) => {
    const fileFailures = [];
    if (result.missing_common_columns.length) fileFailures.push({ file: result.file, missing_common_columns: result.missing_common_columns });
    if (result.missing_domain_columns.length) fileFailures.push({ file: result.file, missing_domain_columns: result.missing_domain_columns });
    if (result.sampled_issue_count) fileFailures.push({ file: result.file, sampled_issue_count: result.sampled_issue_count, sampled_issues: result.sampled_issues });
    return fileFailures;
  });

  if (missingThreads.length) failures.push({ missing_required_story_threads: missingThreads });

  const report = {
    ok: failures.length === 0,
    package_dir: path.resolve(packageDir),
    csv_files: csvFiles.length,
    total_rows: results.reduce((sum, result) => sum + result.rows, 0),
    required_story_threads: [...requiredThreads].sort(),
    observed_story_threads: [...allThreads].sort(),
    files: results,
    failures,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, details: error.details ?? {} }, null, 2));
  process.exit(1);
});

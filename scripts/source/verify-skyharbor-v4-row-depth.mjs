import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const packageDir = process.argv[2];
const args = new Map(
  process.argv.slice(3).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const DEFAULT_MANIFEST = "source_v4_package_manifest.json";
const DEFAULT_TENANT_KEY = "skyharbor_global";
const DEFAULT_DATASET_VERSION = "v4";
const DEFAULT_AS_OF_DATE = "2027-06-30";
const DEFAULT_PERIOD_START = "2025-07-01";
const DEFAULT_PERIOD_END = "2027-06-30";
const DEFAULT_EXPECTED_MONTHS = 24;
const MAX_REPORTED_ISSUES_PER_FILE = 50;

const commonRequiredColumns = [
  "tenant_key",
  "dataset_id",
  "dataset_version",
  "source_system",
  "source_module",
  "source_object",
  "source_record_id",
  "source_record_url_or_path",
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

const validExtractMethods = new Set([
  "api",
  "report_export",
  "scheduled_file_drop",
  "data_warehouse_extract",
  "document_library_export",
  "manual_approved_extract",
]);

const piiColumnBlocklist = [
  /^employee(_|$)/u,
  /^employee_id$/u,
  /^employee_number$/u,
  /^person(_|$)/u,
  /^person_name$/u,
  /(^|_)email($|_)/u,
  /(^|_)phone($|_)/u,
  /(^|_)mobile($|_)/u,
  /(^|_)ssn($|_)/u,
  /(^|_)worker_name$/u,
  /(^|_)owner_name$/u,
  /(^|_)approver_name$/u,
  /(^|_)requester_name$/u,
  /(^|_)user_name$/u,
];

const allowedNameColumns = new Set([
  "legal_name",
  "supplier_name",
  "vendor_name",
  "application_name",
  "platform_name",
  "service_name",
  "scope_name",
  "metric_name",
  "product_name",
  "file_name",
  "source_system",
  "source_module",
  "source_object",
  "business_unit_name",
  "cost_center_name",
]);

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu;
const phonePattern = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/u;
const employeeIdPattern = /\b(?:emp|employee|eid)[-_ ]?\d{4,}\b/iu;
const piiValueSkipColumns = new Set(["row_hash", "content_sha256", "file_sha256", "source_csv_sha256"]);

const requiredThreads = new Map([
  ["saas_rationalization", { minimumRecords: 1_000, requiredDomains: ["contract_header", "saas_usage", "financial_line"] }],
  [
    "managed_service_value_leakage",
    {
      minimumRecords: 1_000,
      requiredDomains: ["contract_header", "workforce_rate_card", "financial_line", "service_performance"],
    },
  ],
  ["cloud_commitment_exposure", { minimumRecords: 500, requiredDomains: ["contract_header", "cloud_consumption", "financial_line"] }],
  ["app_retirement_contract_conflict", { minimumRecords: 250, requiredDomains: ["contract_header", "scope_mapping"] }],
  ["ai_value_proof_gap", { minimumRecords: 500, requiredDomains: ["saas_usage", "service_performance", "financial_line"] }],
  ["supplier_bafo_normalization", { minimumRecords: 500, requiredDomains: ["sourcing_event", "supplier_master"] }],
  ["evidence_conflict_resolution", { minimumRecords: 100, requiredDomains: ["legal_evidence", "contract_header"] }],
]);

const domainContracts = new Map([
  [
    "supplier_master",
    {
      match: /supplier|vendor/i,
      requiredAny: [
        ["supplier_id", "vendor_id"],
        ["legal_name", "supplier_name", "vendor_name"],
        ["supplier_category", "commodity_code"],
        ["risk_tier", "supplier_risk_tier"],
        ["onboarding_status", "qualification_status", "supplier_status"],
      ],
    },
  ],
  [
    "contract_header",
    {
      match: /contract.*(workspace|header|register|family)|contracts?/i,
      requiredAny: [
        ["contract_id"],
        ["vendor_id", "supplier_id"],
        ["agreement_type", "contract_type"],
        ["effective_date"],
        ["expiration_date"],
        ["annual_value", "contract_annual_value"],
        ["renewal_type"],
        ["notice_deadline"],
        ["document_availability"],
      ],
    },
  ],
  [
    "legal_evidence",
    {
      match: /document|clause|span|evidence|dpa|sow|amendment|instrument/i,
      requiredAny: [
        ["file_id", "document_id"],
        ["document_role"],
        ["contract_id"],
        ["content_sha256", "file_sha256"],
        ["extraction_confidence", "confidence"],
        ["review_state", "quality_state"],
      ],
    },
  ],
  [
    "financial_line",
    {
      match: /invoice|purchase.?order|payment|accrual|po_/i,
      requiredAny: [
        ["supplier_id", "vendor_id"],
        ["po_number", "purchase_order_number"],
        ["invoice_id", "invoice_number"],
        ["cost_center"],
        ["posting_date", "invoice_date"],
        ["net_amount", "line_amount", "actual_spend"],
        ["matching_state", "contract_match_state"],
      ],
    },
  ],
  [
    "saas_usage",
    {
      match: /saas|license|entra|m365|usage|copilot|github|atlassian/i,
      timeSeries: true,
      requiredAny: [
        ["product_id", "sku_id", "tool_id"],
        ["assigned_seats", "paid_seats"],
        ["active_users", "monthly_active_users"],
        ["usage_metric_name"],
        ["month", "period_start"],
        ["unit_cost", "actual_cost"],
      ],
    },
  ],
  [
    "cloud_consumption",
    {
      match: /azure|aws|gcp|cloud|billing|cur|cost/i,
      timeSeries: true,
      requiredAny: [
        ["subscription_id", "account_id", "project_id"],
        ["service_name"],
        ["region"],
        ["usage_quantity"],
        ["actual_cost", "amortized_cost"],
        ["commitment_id", "commitment_type"],
      ],
    },
  ],
  [
    "service_performance",
    {
      match: /sla|kpi|incident|request|change|performance|credit/i,
      timeSeries: true,
      requiredAny: [
        ["contract_id"],
        ["metric_name"],
        ["target"],
        ["actual"],
        ["period_start"],
        ["breach_count"],
        ["credit_eligible"],
        ["credit_calculated", "credit_earned"],
      ],
    },
  ],
  [
    "workforce_rate_card",
    {
      match: /fieldglass|work.?order|worker|rate.?card|timesheet/i,
      requiredAny: [
        ["sow_id", "work_order_id"],
        ["role", "role_title"],
        ["location"],
        ["bill_rate", "billed_rate"],
        ["hours"],
        ["approved_rate", "rate_card_id"],
      ],
    },
  ],
  [
    "sourcing_event",
    {
      match: /sourcing|event|supplier_response|bafo|rfp|rfq|rfi|evaluation/i,
      requiredAny: [
        ["event_id"],
        ["event_type"],
        ["stage", "event_status"],
        ["supplier_id", "vendor_id"],
        ["response_id"],
        ["score", "technical_score", "commercial_score"],
        ["normalized_cost", "line_item_cost"],
      ],
    },
  ],
  [
    "scope_mapping",
    {
      match: /scope|application|platform|cmdb|leanix|dependency/i,
      requiredAny: [
        ["contract_id"],
        ["application_id", "platform_id", "service_id"],
        ["criticality"],
        ["lifecycle"],
        ["relationship_method"],
        ["relationship_confidence", "confidence"],
      ],
    },
  ],
]);

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
  return String(header).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function monthKey(value) {
  const date = normalizeDate(value);
  return date ? date.slice(0, 7) : null;
}

function monthsBetweenInclusive(start, end) {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const months = [];
  for (
    let year = startDate.getUTCFullYear(), month = startDate.getUTCMonth();
    year < endDate.getUTCFullYear() || (year === endDate.getUTCFullYear() && month <= endDate.getUTCMonth());
    month += 1
  ) {
    if (month > 11) {
      month = 0;
      year += 1;
    }
    months.push(`${year}-${String(month + 1).padStart(2, "0")}`);
  }
  return months;
}

function detectDomain(fileName, headers) {
  const haystack = `${fileName} ${headers.join(" ")}`;
  return [...domainContracts.entries()]
    .filter(([, contract]) => contract.match.test(haystack))
    .map(([name]) => name);
}

function present(headers, alternatives) {
  return alternatives.some((column) => headers.has(normalizedHeader(column)));
}

function valueFor(row, headerIndex, column) {
  const index = headerIndex.get(normalizedHeader(column));
  if (index === undefined) return "";
  return String(row[index] ?? "").trim();
}

function hasValue(row, headerIndex, column) {
  return valueFor(row, headerIndex, column) !== "";
}

function rowHasAnyValue(row, headerIndex, alternatives) {
  return alternatives.some((column) => hasValue(row, headerIndex, column));
}

function rowObject(row, headers) {
  return Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()]));
}

function rowHash(row, headers) {
  const hashInput = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => header !== "row_hash")
    .map(({ header, index }) => `${header}=${String(row[index] ?? "").trim()}`)
    .join("\n");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

function joinKey(row, headerIndex, columns) {
  return columns.map((column) => valueFor(row, headerIndex, column)).join("||");
}

function extractPathLooksValid(method, sourcePath) {
  const pathValue = String(sourcePath ?? "").trim();
  if (!pathValue) return false;
  if (method === "api") return /^(\/|https?:\/\/|[a-z0-9_.-]+\/)/iu.test(pathValue);
  if (method === "report_export") return /report|export|csv|xlsx|xls|download/iu.test(pathValue);
  if (method === "scheduled_file_drop") return /\/|\\|sftp|blob|csv|xlsx|parquet/iu.test(pathValue);
  if (method === "data_warehouse_extract") return /select|view|table|schema|warehouse|dataset|query/iu.test(pathValue);
  if (method === "document_library_export") return /sharepoint|box|drive|document|library|pdf|docx|contract/iu.test(pathValue);
  if (method === "manual_approved_extract") return /approved|review|worksheet|template|csv|xlsx/iu.test(pathValue);
  return true;
}

function piiColumnIssue(column) {
  if (allowedNameColumns.has(column)) return null;
  if (piiColumnBlocklist.some((pattern) => pattern.test(column))) return "pii_column_name";
  return null;
}

function piiValueIssue(value) {
  const text = String(value ?? "");
  if (!text) return null;
  if (emailPattern.test(text)) return "email_value";
  if (phonePattern.test(text)) return "phone_value";
  if (employeeIdPattern.test(text)) return "employee_id_value";
  return null;
}

function issuePush(issues, issue) {
  if (issues.length < MAX_REPORTED_ISSUES_PER_FILE) issues.push(issue);
}

function manifestFileMap(manifest) {
  return new Map((manifest?.files || []).map((file) => [file.file, file]));
}

async function loadManifest(root) {
  const explicitManifest = args.get("manifest");
  const manifestPath = explicitManifest ? path.resolve(explicitManifest) : path.join(root, DEFAULT_MANIFEST);
  const text = await fs.readFile(manifestPath, "utf8").catch(() => null);
  if (!text) return null;
  const manifest = JSON.parse(text);
  manifest.__path = manifestPath;
  return manifest;
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

async function validateCsv(filePath, context) {
  const text = await fs.readFile(filePath, "utf8");
  const parsed = parseCsv(text);
  if (parsed.length < 2) fail("CSV has no data rows.", { filePath });

  const relativeFile = path.relative(packageDir, filePath);
  const declared = context.files.get(relativeFile) || context.files.get(path.basename(filePath));
  const headers = parsed[0].map(normalizedHeader);
  const headerSet = new Set(headers);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const inferredDomains = detectDomain(path.basename(filePath), headers);
  const domains = declared?.domain_contract ? [declared.domain_contract] : inferredDomains;
  const missingCommon = commonRequiredColumns.filter((column) => !headerSet.has(column));
  const missingDomain = [];
  const primaryKey = (declared?.primary_key || []).map(normalizedHeader);
  const grain = declared?.grain || "undeclared";
  const timeSeries = Boolean(declared?.time_series || domains.some((domain) => domainContracts.get(domain)?.timeSeries));
  const expectedMonths = Number(declared?.expected_months || context.expectedMonths);
  const periodStart = declared?.period_start || context.periodStart;
  const periodEnd = declared?.period_end || context.periodEnd;

  for (const domainName of domains) {
    const domain = domainContracts.get(domainName);
    if (!domain) {
      missingDomain.push({ domain: domainName, issue: "unknown_domain_contract" });
      continue;
    }
    for (const alternatives of domain.requiredAny) {
      if (!present(headerSet, alternatives)) missingDomain.push({ domain: domainName, alternatives });
    }
  }

  for (const column of primaryKey) {
    if (!headerSet.has(column)) missingDomain.push({ grain, issue: "missing_primary_key_column", column });
  }

  const issues = [];
  const scenarioThreads = new Map();
  const scenarioThreadDomains = new Map();
  const qualityStates = new Set();
  const evidenceStates = new Set();
  const contractTiers = new Map();
  const rowHashes = new Set();
  const duplicateHashes = new Set();
  const nativeRecordIds = new Set();
  const duplicateNativeRecordIds = new Set();
  const primaryKeys = new Set();
  const duplicatePrimaryKeys = new Set();
  const entityMonths = new Map();
  const rows = parsed.slice(1);
  const rowCount = rows.length;

  for (const column of headers) {
    const piiIssue = piiColumnIssue(column);
    if (piiIssue) issuePush(issues, { rowNumber: 1, issue: piiIssue, column });
  }

  for (const [offset, row] of rows.entries()) {
    const rowNumber = offset + 2;
    for (const column of commonRequiredColumns) {
      if (!hasValue(row, headerIndex, column)) issuePush(issues, { rowNumber, issue: "blank_common_field", column });
    }

    const rowTenant = valueFor(row, headerIndex, "tenant_key");
    const rowDatasetId = valueFor(row, headerIndex, "dataset_id");
    const rowDatasetVersion = valueFor(row, headerIndex, "dataset_version");
    const rowAsOfDate = valueFor(row, headerIndex, "as_of_date");
    const qualityState = valueFor(row, headerIndex, "quality_state");
    const evidenceState = valueFor(row, headerIndex, "evidence_state");
    const extractMethod = valueFor(row, headerIndex, "extract_method");
    const sourcePath = valueFor(row, headerIndex, "source_record_url_or_path");
    const thread = valueFor(row, headerIndex, "scenario_thread_id");
    const providedHash = valueFor(row, headerIndex, "row_hash");
    const recomputedHash = rowHash(row, headers);
    const sourceRecordId = valueFor(row, headerIndex, "source_record_id");

    if (rowTenant !== context.tenantKey) issuePush(issues, { rowNumber, issue: "tenant_key_mismatch", expected: context.tenantKey, actual: rowTenant });
    if (rowDatasetId !== context.datasetId) issuePush(issues, { rowNumber, issue: "dataset_id_mismatch", expected: context.datasetId, actual: rowDatasetId });
    if (rowDatasetVersion !== context.datasetVersion) {
      issuePush(issues, { rowNumber, issue: "dataset_version_mismatch", expected: context.datasetVersion, actual: rowDatasetVersion });
    }
    if (rowAsOfDate !== context.asOfDate) issuePush(issues, { rowNumber, issue: "as_of_date_mismatch", expected: context.asOfDate, actual: rowAsOfDate });
    if (qualityState) qualityStates.add(qualityState);
    if (evidenceState) evidenceStates.add(evidenceState);
    if (thread) {
      scenarioThreads.set(thread, (scenarioThreads.get(thread) || 0) + 1);
      if (!scenarioThreadDomains.has(thread)) scenarioThreadDomains.set(thread, new Set());
      for (const domain of domains) scenarioThreadDomains.get(thread).add(domain);
    }
    if (domains.includes("contract_header")) {
      const tier = valueFor(row, headerIndex, "contract_tier") || valueFor(row, headerIndex, "evidence_tier");
      if (tier) contractTiers.set(tier, (contractTiers.get(tier) || 0) + 1);
    }
    if (qualityState && !validQualityStates.has(qualityState)) issuePush(issues, { rowNumber, issue: "invalid_quality_state", qualityState });
    if (evidenceState && !validEvidenceStates.has(evidenceState)) issuePush(issues, { rowNumber, issue: "invalid_evidence_state", evidenceState });
    if (extractMethod && !validExtractMethods.has(extractMethod)) issuePush(issues, { rowNumber, issue: "invalid_extract_method", extractMethod });
    if (extractMethod && !extractPathLooksValid(extractMethod, sourcePath)) {
      issuePush(issues, { rowNumber, issue: "source_record_url_or_path_inconsistent_with_extract_method", extractMethod, sourcePath });
    }
    if (providedHash && providedHash !== recomputedHash) issuePush(issues, { rowNumber, issue: "row_hash_mismatch", providedHash, recomputedHash });
    if (providedHash) {
      if (rowHashes.has(providedHash)) duplicateHashes.add(providedHash);
      rowHashes.add(providedHash);
    }
    if (sourceRecordId) {
      if (nativeRecordIds.has(sourceRecordId)) duplicateNativeRecordIds.add(sourceRecordId);
      nativeRecordIds.add(sourceRecordId);
    }
    if (primaryKey.length) {
      const key = joinKey(row, headerIndex, primaryKey);
      if (key.includes("||") && key.split("||").some((part) => !part)) {
        issuePush(issues, { rowNumber, issue: "blank_primary_key_part", primaryKey });
      } else {
        if (primaryKeys.has(key)) duplicatePrimaryKeys.add(key);
        primaryKeys.add(key);
      }
    }

    for (const [columnIndex, value] of row.entries()) {
      if (piiValueSkipColumns.has(headers[columnIndex])) continue;
      const piiIssue = piiValueIssue(value);
      if (piiIssue) issuePush(issues, { rowNumber, issue: piiIssue, column: headers[columnIndex] });
    }

    for (const domainName of domains) {
      const domain = domainContracts.get(domainName);
      if (!domain) continue;
      for (const alternatives of domain.requiredAny) {
        if (!rowHasAnyValue(row, headerIndex, alternatives)) {
          issuePush(issues, { rowNumber, issue: "blank_domain_depth_field", domain: domainName, alternatives });
        }
      }
    }

    if (timeSeries) {
      const start = normalizeDate(valueFor(row, headerIndex, "period_start") || valueFor(row, headerIndex, "month"));
      const end = normalizeDate(valueFor(row, headerIndex, "period_end") || valueFor(row, headerIndex, "month"));
      if (!start || !end) {
        issuePush(issues, { rowNumber, issue: "invalid_or_missing_period_dates" });
      } else {
        if (start > end) issuePush(issues, { rowNumber, issue: "period_start_after_period_end", period_start: start, period_end: end });
        if (start < periodStart || end > periodEnd) issuePush(issues, { rowNumber, issue: "period_outside_authorized_window", period_start: start, period_end: end });
        const entityColumns = primaryKey.length ? primaryKey.filter((column) => !["period_start", "period_end", "month"].includes(column)) : ["source_record_id"];
        const entityKey = joinKey(row, headerIndex, entityColumns);
        const month = monthKey(start);
        if (month) {
          if (!entityMonths.has(entityKey)) entityMonths.set(entityKey, new Set());
          entityMonths.get(entityKey).add(month);
        }
      }
    }
  }

  if (duplicateHashes.size) issuePush(issues, { issue: "duplicate_row_hashes", count: duplicateHashes.size, sample: [...duplicateHashes].slice(0, 5) });
  if (duplicateNativeRecordIds.size && !declared?.allow_duplicate_source_record_id) {
    issuePush(issues, {
      issue: "duplicate_source_record_ids",
      count: duplicateNativeRecordIds.size,
      sample: [...duplicateNativeRecordIds].slice(0, 5),
    });
  }
  if (duplicatePrimaryKeys.size) issuePush(issues, { issue: "duplicate_primary_keys", count: duplicatePrimaryKeys.size, sample: [...duplicatePrimaryKeys].slice(0, 5) });

  if (timeSeries && declared?.require_complete_months !== false) {
    const expectedMonthKeys = monthsBetweenInclusive(periodStart, periodEnd);
    if (expectedMonthKeys.length !== expectedMonths) {
      issuePush(issues, { issue: "configured_period_window_month_count_mismatch", expectedMonths, actualMonths: expectedMonthKeys.length });
    }
    for (const [entityKey, months] of entityMonths.entries()) {
      const missingMonths = expectedMonthKeys.filter((month) => !months.has(month));
      if (missingMonths.length) {
        issuePush(issues, {
          issue: "missing_entity_month_coverage",
          entityKey,
          expectedMonths: expectedMonthKeys.length,
          actualMonths: months.size,
          missingMonths: missingMonths.slice(0, 6),
        });
      }
    }
  }
  if (declared?.expected_rows !== undefined && rowCount !== Number(declared.expected_rows)) {
    issuePush(issues, { issue: "expected_rows_mismatch", expected: Number(declared.expected_rows), actual: rowCount });
  }
  if (declared?.expected_rows_min !== undefined && rowCount < Number(declared.expected_rows_min)) {
    issuePush(issues, { issue: "expected_rows_min_not_met", expected: Number(declared.expected_rows_min), actual: rowCount });
  }
  if (declared?.expected_rows_max !== undefined && rowCount > Number(declared.expected_rows_max)) {
    issuePush(issues, { issue: "expected_rows_max_exceeded", expected: Number(declared.expected_rows_max), actual: rowCount });
  }

  return {
    file: relativeFile,
    rows: rowCount,
    columns: headers.length,
    declared_domain: declared?.domain_contract || null,
    inferred_domains: inferredDomains,
    domains,
    grain,
    primary_key: primaryKey,
    missing_common_columns: missingCommon,
    missing_domain_columns: missingDomain,
    issue_sample: issues,
    issue_count: issues.length,
    scenario_threads: Object.fromEntries([...scenarioThreads.entries()].sort()),
    scenario_thread_domains: Object.fromEntries([...scenarioThreadDomains.entries()].map(([thread, set]) => [thread, [...set].sort()])),
    contract_tiers: Object.fromEntries([...contractTiers.entries()].sort()),
    quality_states: [...qualityStates].sort(),
    evidence_states: [...evidenceStates].sort(),
  };
}

function buildLookup(data) {
  const lookup = new Set();
  for (const row of data.rows) {
    lookup.add(valueFor(row, data.headerIndex, data.column));
  }
  return lookup;
}

async function readCsvData(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const parsed = parseCsv(text);
  const headers = parsed[0].map(normalizedHeader);
  return {
    headers,
    headerIndex: new Map(headers.map((header, index) => [header, index])),
    rows: parsed.slice(1),
  };
}

async function validateReferences(root, manifest, csvFiles) {
  const failures = [];
  const filePaths = new Map(csvFiles.map((filePath) => [path.relative(root, filePath), filePath]));
  for (const ref of manifest?.references || []) {
    const fromPath = filePaths.get(ref.file);
    const toPath = filePaths.get(ref.ref_file);
    if (!fromPath || !toPath) {
      failures.push({ issue: "reference_file_missing", reference: ref });
      continue;
    }
    const fromData = await readCsvData(fromPath);
    const toData = await readCsvData(toPath);
    const fromColumn = normalizedHeader(ref.column);
    const toColumn = normalizedHeader(ref.ref_column);
    if (!fromData.headerIndex.has(fromColumn) || !toData.headerIndex.has(toColumn)) {
      failures.push({ issue: "reference_column_missing", reference: ref });
      continue;
    }
    const lookup = buildLookup({ ...toData, column: toColumn });
    let missing = 0;
    const sample = [];
    for (const [index, row] of fromData.rows.entries()) {
      const value = valueFor(row, fromData.headerIndex, fromColumn);
      if (!value && ref.allow_blank) continue;
      if (!lookup.has(value)) {
        missing += 1;
        if (sample.length < 5) sample.push({ rowNumber: index + 2, value });
      }
    }
    if (missing) failures.push({ issue: "reference_integrity_failure", reference: ref, missing, sample });
  }
  return failures;
}

function validatePortfolioCounts(results, manifest) {
  const failures = [];
  const expectations = manifest?.portfolio_expectations || {};
  const countByDomain = new Map();
  for (const result of results) {
    for (const domain of result.domains) countByDomain.set(domain, (countByDomain.get(domain) || 0) + result.rows);
  }
  if (expectations.contract_families) {
    const actual = countByDomain.get("contract_header") || 0;
    if (actual !== expectations.contract_families) failures.push({ issue: "contract_family_count_mismatch", expected: expectations.contract_families, actual });
  }
  if (expectations.material_vendors) {
    const actual = countByDomain.get("supplier_master") || 0;
    if (actual !== expectations.material_vendors) failures.push({ issue: "material_vendor_count_mismatch", expected: expectations.material_vendors, actual });
  }
  if (expectations.tiers) {
    for (const [tier, expected] of Object.entries(expectations.tiers)) {
      const actual = results
        .filter((result) => result.domains.includes("contract_header"))
        .reduce((sum, result) => sum + (result.contract_tiers[tier] || 0), 0);
      if (typeof expected === "number" && actual !== expected) failures.push({ issue: "tier_count_mismatch", tier, expected, actual });
    }
  }
  if (expectations.contract_tiers) {
    const actualTiers = new Map();
    for (const result of results.filter((result) => result.domains.includes("contract_header"))) {
      for (const [tier, count] of Object.entries(result.contract_tiers)) actualTiers.set(tier, (actualTiers.get(tier) || 0) + count);
    }
    for (const [key, expected] of Object.entries(expectations.contract_tiers)) {
      if (key.endsWith("_min")) {
        const tier = key.replace(/_min$/u, "");
        const actual = actualTiers.get(tier) || 0;
        if (actual < Number(expected)) failures.push({ issue: "contract_tier_min_not_met", tier, expected, actual });
      } else if (key.endsWith("_max")) {
        const tier = key.replace(/_max$/u, "");
        const actual = actualTiers.get(tier) || 0;
        if (actual > Number(expected)) failures.push({ issue: "contract_tier_max_exceeded", tier, expected, actual });
      } else if (typeof expected === "number") {
        const actual = actualTiers.get(key) || 0;
        if (actual !== Number(expected)) failures.push({ issue: "contract_tier_count_mismatch", tier: key, expected, actual });
      }
    }
  }
  return failures;
}

function validateStoryCoverage(results, manifest) {
  const failures = [];
  const coverage = new Map();
  const manifestThreads = manifest?.story_threads || {};

  for (const result of results) {
    for (const [thread, count] of Object.entries(result.scenario_threads)) {
      if (!coverage.has(thread)) coverage.set(thread, { count: 0, domains: new Set(), files: new Set() });
      coverage.get(thread).count += count;
      coverage.get(thread).files.add(result.file);
      for (const domain of result.scenario_thread_domains[thread] || result.domains) coverage.get(thread).domains.add(domain);
    }
  }

  for (const [thread, defaultRule] of requiredThreads.entries()) {
    const override = manifestThreads[thread] || {};
    const rule = {
      minimumRecords: override.minimum_records ?? defaultRule.minimumRecords,
      requiredDomains: override.required_domains ?? defaultRule.requiredDomains,
    };
    const actual = coverage.get(thread);
    if (!actual) {
      failures.push({ issue: "missing_required_story_thread", thread });
      continue;
    }
    if (actual.count < rule.minimumRecords) failures.push({ issue: "story_thread_minimum_records_not_met", thread, expected: rule.minimumRecords, actual: actual.count });
    const missingDomains = rule.requiredDomains.filter((domain) => !actual.domains.has(domain));
    if (missingDomains.length) {
      failures.push({
        issue: "story_thread_missing_required_domains",
        thread,
        missingDomains,
        observedDomains: [...actual.domains].sort(),
      });
    }
  }

  return {
    failures,
    coverage: Object.fromEntries(
      [...coverage.entries()]
        .sort()
        .map(([thread, value]) => [thread, { records: value.count, domains: [...value.domains].sort(), files: [...value.files].sort() }]),
    ),
  };
}

async function main() {
  if (!packageDir) fail("Usage: node scripts/source/verify-skyharbor-v4-row-depth.mjs <csv-directory> [--manifest=path] [--dataset-id=id]");
  const stat = await fs.stat(packageDir).catch(() => null);
  if (!stat?.isDirectory()) fail("Input must be a directory of generated CSV extracts.", { packageDir });

  const manifest = await loadManifest(packageDir);
  const datasetId = args.get("dataset-id") || manifest?.dataset_id;
  if (!datasetId) fail("Missing dataset id. Provide --dataset-id or source_v4_package_manifest.json.");

  const context = {
    tenantKey: args.get("tenant") || manifest?.tenant_key || DEFAULT_TENANT_KEY,
    datasetId,
    datasetVersion: args.get("dataset-version") || manifest?.dataset_version || DEFAULT_DATASET_VERSION,
    asOfDate: args.get("as-of-date") || manifest?.as_of_date || DEFAULT_AS_OF_DATE,
    periodStart: manifest?.period_window?.start || DEFAULT_PERIOD_START,
    periodEnd: manifest?.period_window?.end || DEFAULT_PERIOD_END,
    expectedMonths: manifest?.period_window?.expected_months || DEFAULT_EXPECTED_MONTHS,
    files: manifestFileMap(manifest),
  };

  const csvFiles = await listCsvFiles(packageDir);
  if (!csvFiles.length) fail("No CSV files found.", { packageDir });

  const expectedFiles = new Set(manifest?.files?.map((file) => file.file) || []);
  const actualFiles = new Set(csvFiles.map((filePath) => path.relative(packageDir, filePath)));
  const missingManifestFiles = [...expectedFiles].filter((file) => !actualFiles.has(file));
  const undeclaredCsvFiles = manifest ? [...actualFiles].filter((file) => !expectedFiles.has(file)) : [];

  const results = [];
  for (const filePath of csvFiles) results.push(await validateCsv(filePath, context));

  const story = validateStoryCoverage(results, manifest);
  const referenceFailures = await validateReferences(packageDir, manifest, csvFiles);
  const portfolioFailures = validatePortfolioCounts(results, manifest);
  const fileFailures = results.flatMap((result) => {
    const failures = [];
    if (result.missing_common_columns.length) failures.push({ file: result.file, missing_common_columns: result.missing_common_columns });
    if (result.missing_domain_columns.length) failures.push({ file: result.file, missing_domain_columns: result.missing_domain_columns });
    if (result.issue_count) failures.push({ file: result.file, issue_count: result.issue_count, issue_sample: result.issue_sample });
    if (result.declared_domain && result.inferred_domains.length && !result.inferred_domains.includes(result.declared_domain)) {
      failures.push({
        file: result.file,
        issue: "declared_domain_differs_from_regex_diagnostic",
        declared_domain: result.declared_domain,
        inferred_domains: result.inferred_domains,
      });
    }
    return failures;
  });

  const failures = [
    ...fileFailures,
    ...story.failures,
    ...referenceFailures,
    ...portfolioFailures,
    ...(missingManifestFiles.length ? [{ issue: "manifest_declared_files_missing", files: missingManifestFiles }] : []),
    ...(undeclaredCsvFiles.length ? [{ issue: "csv_files_not_declared_in_manifest", files: undeclaredCsvFiles }] : []),
  ];

  const report = {
    ok: failures.length === 0,
    package_dir: path.resolve(packageDir),
    manifest_path: manifest?.__path || null,
    dataset_identity: context,
    csv_files: csvFiles.length,
    total_rows: results.reduce((sum, result) => sum + result.rows, 0),
    story_coverage: story.coverage,
    files: results,
    failures,
  };
  delete report.dataset_identity.files;

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, details: error.details ?? {} }, null, 2));
  process.exit(1);
});

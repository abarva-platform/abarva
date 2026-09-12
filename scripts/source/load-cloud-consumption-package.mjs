#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

loadDotenv(path.resolve(process.cwd(), ".env.local"));
loadDotenv(path.resolve(process.cwd(), ".env"));

const MODES = new Set(["plan", "apply-layer2", "apply-layer3", "apply-layer4", "verify", "verify-layer4"]);
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_DATASET_VERSION = "meridian-cloud-consumption-depth-v1-20260907";
const DEFAULT_PACKAGE_DIR =
  "datasets/source/cloud-consumption/meridian-cloud-consumption-depth-v1-20260907";
const SOURCE_SYSTEM = "source_cloud_consumption_package_loader";
const SYNTHETIC_POLICY = "synthetic_demo_only_not_client_truth";
const CONTRACT_CONTEXT_FACTS = [
  {
    column: "contract_english_overview",
    factKey: "contract.purpose_summary",
    label: "contract plain-English overview",
    minLength: 120,
  },
  {
    column: "scope_english_summary",
    factKey: "contract.scope_summary",
    label: "contract scope summary",
    minLength: 100,
  },
  {
    column: "commercial_thesis",
    factKey: "contract.commercial_thesis",
    label: "contract commercial thesis",
    minLength: 100,
  },
  {
    column: "relationship_summary",
    factKey: "contract.relationship_summary",
    label: "contract relationship summary",
    minLength: 80,
  },
  {
    column: "evidence_boundary_summary",
    factKey: "contract.evidence_boundary",
    label: "contract evidence boundary",
    minLength: 80,
  },
];

const ADAPTER_SPECS = [
  ["contract_register_adapter", "cloud_contract_register.csv", ["source_row_id"]],
  ["cloud_account_adapter", "cloud_accounts.csv", ["source_row_id", "cloud_account_id"]],
  ["cmdb_application_adapter", "cmdb_applications.csv", ["application_ref"]],
  ["contract_scope_adapter", "cmdb_application_scope.csv", ["source_row_id"]],
  ["contract_consumption_adapter", "monthly_spend.csv", ["source_row_id"]],
  ["cloud_service_usage_adapter", "cloud_service_usage_monthly.csv", ["source_row_id"]],
  ["cloud_commitment_adapter", "cloud_commitments.csv", ["source_row_id", "commitment_id"]],
  ["cloud_commitment_coverage_adapter", "cloud_commitment_coverage_monthly.csv", ["source_row_id"]],
  ["cloud_resource_inventory_adapter", "cloud_resource_inventory.csv", ["source_row_id", "resource_id"]],
  ["cloud_tag_quality_adapter", "cloud_tag_quality.csv", ["source_row_id"]],
  ["cloud_ap_invoice_reconciliation_adapter", "cloud_ap_invoice_reconciliation.csv", ["source_row_id"]],
  ["contract_clause_adapter", "contract_clauses.csv", ["extraction_id"]],
  ["optimization_opportunity_adapter", "optimization_opportunities.csv", ["opportunity_id"]],
  ["evidence_document_adapter", "evidence_manifest.csv", ["source_file_id"]],
  ["native_tool_context_adapter", "native_tool_comparison.csv", ["native_tool"]],
  ["source_extraction_guide_adapter", "source_extraction_guide.csv", ["source_owner", "source_system", "workbook_tab"]],
  ["layer_cube_map_adapter", "layer_cube_map.csv", ["source_file_tab"]],
  ["reconciliation_control_adapter", "reconciliation.csv", ["check"]],
];

const REQUIRED_LAYER2_TABLES = [
  "cloud_consumption_package_load_run",
  "cloud_consumption_adapter_row",
];

const REQUIRED_LAYER3_TABLES = [
  "vendor",
  "contract",
  "contract_term",
  "contract_scope",
  "contract_consumption_observation",
  "optimization_opportunity",
  "optimization_baseline",
  "optimization_case",
  "case_opportunity",
  "opportunity_evidence",
  "calculation_rule",
  "calculation_run",
  "calculation_input",
  "calculation_output",
  "opportunity_valuation",
  "evidence_requirement",
  "opportunity_requirement_status",
  "evidence_request",
  "source_record_snapshot",
  "canonical_fact_assertion",
  "cloud_account",
  "cloud_service_usage_observation",
  "cloud_commitment",
  "cloud_commitment_coverage_observation",
  "cloud_resource_inventory",
  "cloud_tag_quality_observation",
  "cloud_ap_invoice_reconciliation",
];

function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseArgs() {
  const mode = argValue("mode") ?? process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_MODE ?? "plan";
  if (!MODES.has(mode)) throw new Error(`Unsupported SOURCE_CLOUD_CONSUMPTION_PACKAGE_MODE: ${mode}`);
  const datasetVersion =
    argValue("dataset-version") ??
    process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_DATASET_VERSION ??
    DEFAULT_DATASET_VERSION;
  const tenantKey =
    argValue("tenant-key") ??
    process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_TENANT_KEY ??
    DEFAULT_TENANT_KEY;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const loadRunId =
    argValue("load-run-id") ??
    process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_LOAD_RUN_ID ??
    `source-cloud-consumption-package-${datasetVersion}-${stamp}`;
  return {
    mode,
    packageDir: path.resolve(
      process.cwd(),
      argValue("package-dir") ??
        process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_DIR ??
        DEFAULT_PACKAGE_DIR,
    ),
    tenantKey,
    datasetVersion,
    idempotencyKey:
      argValue("idempotency-key") ??
      process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_IDEMPOTENCY_KEY ??
      `${tenantKey}:${datasetVersion}:layer2-layer3`,
    loadRunId,
    layer3LoadRunId:
      argValue("layer3-load-run-id") ??
      process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_LAYER3_LOAD_RUN_ID ??
      loadRunId,
    proofDir: path.resolve(
      argValue("proof-dir") ??
        process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_PROOF_DIR ??
        `/tmp/source-cloud-consumption-package-${mode}-${stamp}`,
    ),
    applyApproved:
      process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_APPLY_APPROVED === "true" ||
      process.argv.includes("--apply-approved"),
  };
}

function databaseUrl() {
  const url =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function shouldDisablePostgresSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    if (sslMode === "disable") return true;
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    ...(applicationName ? { application_name: applicationName } : {}),
    ssl: shouldDisablePostgresSsl(connectionString) ? false : { rejectUnauthorized: false },
  };
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.length > 0));
}

function readCsv(filePath) {
  const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = parsed[0] ?? [];
  return parsed.slice(1).map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function readSourceFiles(packageDir) {
  const sourceDir = path.join(packageDir, "source-files");
  return Object.fromEntries(
    ADAPTER_SPECS.map(([, sourceFileName]) => [sourceFileName, readCsv(path.join(sourceDir, sourceFileName))]),
  );
}

function readOptionalSourceFile(packageDir, fileName) {
  const filePath = path.join(packageDir, "source-files", fileName);
  return fs.existsSync(filePath) ? readCsv(filePath) : [];
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function shouldEmitProofBundle() {
  return (
    process.env.SOURCE_CLOUD_CONSUMPTION_PACKAGE_EMIT_PROOF_BUNDLE === "true" ||
    process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
    process.argv.includes("--emit-proof-bundle")
  );
}

function emitProofBundle(proofDir) {
  const parent = path.dirname(proofDir);
  const base = path.basename(proofDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) throw new Error(tar.stderr || tar.stdout || "Failed to build proof bundle");
  const encoded = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) {
    console.log(encoded.slice(index, index + 7600));
  }
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

function value(row, key) {
  return row[key] ?? "";
}

function numberValue(row, key) {
  const raw = String(row[key] ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw.replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function totalCommittedValue(row) {
  return (
    numberValue(row, "total_committed_value_usd") ??
    numberValue(row, "total_committed_usd") ??
    numberValue(row, "committed_annual_spend_usd")
  );
}

function requiredNumber(row, key) {
  const parsed = numberValue(row, key);
  if (parsed === null) throw new Error(`Missing numeric field ${key} on ${value(row, "source_row_id") || value(row, "contract_id") || value(row, "opportunity_id")}`);
  return parsed;
}

function canonicalOpportunityValueType(row) {
  const sourceType = value(row, "opportunity_type");
  return sourceType === "governance_action" ? "control_action" : sourceType;
}

function opportunityStage(row) {
  const stage = value(row, "stage");
  if (stage) return stage;
  const confidence = numberValue(row, "confidence");
  return confidence !== null && confidence < 0.5 ? "signal" : "quantified";
}

function opportunityAmountState(row) {
  const amountState = value(row, "amount_state");
  if (amountState) return amountState;
  const confidence = numberValue(row, "confidence");
  return confidence !== null && confidence < 0.5 ? "range" : "exact";
}

function opportunityEvidenceGrade(row) {
  const evidenceGrade = value(row, "evidence_grade");
  if (evidenceGrade) return evidenceGrade;
  const confidence = numberValue(row, "confidence");
  return confidence !== null && confidence < 0.5 ? "system_evidenced" : "document_evidenced";
}

function opportunityBlockingGap(row) {
  return (
    value(row, "blocking_gap") ||
    "Finance confirmation and owner approval are required before realized value can be claimed."
  );
}

function opportunityValuationBasis(row) {
  return opportunityStage(row) === "signal"
    ? "Cloud opportunity amount is a low-confidence signal and requires additional evidence before upgrade."
    : "Cloud opportunity amount is evidence-backed but not finance-confirmed.";
}

function opportunityRequirementStatusDetail(row) {
  return opportunityStage(row) === "signal"
    ? "Candidate opportunity is signal-stage and requires supporting evidence plus finance confirmation before upgrade."
    : "Candidate opportunity is quantified, but finance confirmation remains not_confirmed.";
}

function boolValue(row, key) {
  const raw = value(row, key).trim().toLowerCase();
  if (!raw) return null;
  return ["true", "1", "yes", "y"].includes(raw);
}

function pctValue(row, key) {
  const parsed = numberValue(row, key);
  if (parsed === null) return null;
  return parsed <= 1 ? parsed * 100 : parsed;
}

function monthEnd(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

function periodStart(row) {
  const explicitStart = value(row, "period_start") || value(row, "start_date");
  if (explicitStart) return explicitStart;
  const month = value(row, "month");
  return month ? `${month}-01` : "";
}

function periodEnd(row) {
  const explicitEnd = value(row, "period_end") || value(row, "end_date");
  if (explicitEnd) return explicitEnd;
  const month = value(row, "month");
  return month ? monthEnd(month) : "";
}

function uniqueRows(rows, key) {
  const seen = new Set();
  const output = [];
  for (const row of rows) {
    const candidate = value(row, key);
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    output.push(row);
  }
  return output;
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const groupKey = value(row, key);
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), row]);
  }
  return grouped;
}

function adapterSourceRowId(row, fields) {
  return fields.map((field) => value(row, field)).filter(Boolean).join(":");
}

function adapterRows(sourceFiles) {
  const output = [];
  for (const [adapterName, sourceFileName, rowIdFields] of ADAPTER_SPECS) {
    const rows = sourceFiles[sourceFileName] ?? [];
    for (const [index, sourceRow] of rows.entries()) {
      const row = {
        ...sourceRow,
        adapter_name: adapterName,
        adapter_row_number: String(index + 1),
        adapter_version: "source-cloud-consumption-v1",
      };
      const sourceRowId = adapterSourceRowId(row, rowIdFields);
      if (!sourceRowId) throw new Error(`${adapterName} row is missing ${rowIdFields.join(" or ")}`);
      output.push({
        adapterName,
        sourceFileName,
        sourceRowId,
        sourceRowNumber: index + 1,
        sourceHash: sha256(JSON.stringify(row)),
        payload: row,
      });
    }
  }
  return output;
}

function adapterCountByName(rows) {
  return rows.reduce((acc, row) => {
    acc[row.adapterName] = (acc[row.adapterName] ?? 0) + 1;
    return acc;
  }, {});
}

function sourcePackageHash(sourceFiles, syntheticDocs, companionSourceFiles) {
  return sha256(JSON.stringify({ sourceFiles, syntheticDocs, companionSourceFiles }));
}

function syntheticDocs(packageDir) {
  const dir = path.join(packageDir, "synthetic-evidence-documents");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => ({
      file_name: file,
      sha256: sha256(fs.readFileSync(path.join(dir, file), "utf8")),
    }));
}

function qualifyPackage(args, sourceFiles, docs) {
  const failures = [];
  const contracts = sourceFiles["cloud_contract_register.csv"];
  const contractIds = new Set(contracts.map((row) => value(row, "contract_id")).filter(Boolean));
  const evidenceIds = new Set(sourceFiles["evidence_manifest.csv"].map((row) => value(row, "source_file_id")).filter(Boolean));
  const rowCounts = Object.fromEntries(Object.entries(sourceFiles).map(([fileName, rows]) => [fileName.replace(/\.csv$/, ""), rows.length]));
  const rowsWithTenant = Object.entries(sourceFiles).filter(([, rows]) => rows.some((row) => "tenant_key" in row));

  for (const [fileName, rows] of rowsWithTenant) {
    for (const row of rows) {
      const rowId = value(row, "source_row_id") || value(row, "source_file_id") || value(row, "contract_id") || value(row, "opportunity_id") || fileName;
      if (value(row, "tenant_key") !== args.tenantKey) failures.push(`${fileName}:${rowId} has wrong tenant_key`);
      if ("dataset_version" in row && value(row, "dataset_version") !== args.datasetVersion) failures.push(`${fileName}:${rowId} has wrong dataset_version`);
    }
  }

  const contractScopedFiles = [
    "monthly_spend.csv",
    "cloud_service_usage_monthly.csv",
    "cloud_commitments.csv",
    "cloud_commitment_coverage_monthly.csv",
    "cloud_resource_inventory.csv",
    "cloud_tag_quality.csv",
    "cloud_ap_invoice_reconciliation.csv",
    "contract_clauses.csv",
    "optimization_opportunities.csv",
    "evidence_manifest.csv",
    "cmdb_application_scope.csv",
  ];
  for (const fileName of contractScopedFiles) {
    for (const row of sourceFiles[fileName]) {
      const contractId = value(row, "contract_id");
      if (contractId && !contractIds.has(contractId)) failures.push(`${fileName}:${contractId} points to unknown contract`);
    }
  }

  for (const row of sourceFiles["evidence_manifest.csv"]) {
    if (value(row, "synthetic_policy") !== SYNTHETIC_POLICY) failures.push(`${value(row, "source_file_id")} missing ${SYNTHETIC_POLICY}`);
    if (!docs.some((doc) => doc.file_name === value(row, "file_name"))) failures.push(`${value(row, "source_file_id")} missing synthetic document file`);
  }

  const spendByContract = groupBy(sourceFiles["monthly_spend.csv"], "contract_id");
  const usageByContract = groupBy(sourceFiles["cloud_service_usage_monthly.csv"], "contract_id");
  const coverageByContract = groupBy(sourceFiles["cloud_commitment_coverage_monthly.csv"], "contract_id");
  const tagsByContract = groupBy(sourceFiles["cloud_tag_quality.csv"], "contract_id");
  const apByContract = groupBy(sourceFiles["cloud_ap_invoice_reconciliation.csv"], "contract_id");
  const oppsByContract = groupBy(sourceFiles["optimization_opportunities.csv"], "contract_id");
  for (const contract of contracts) {
    const contractId = value(contract, "contract_id");
    for (const contextFact of CONTRACT_CONTEXT_FACTS) {
      const text = value(contract, contextFact.column).trim();
      if (text.length < contextFact.minLength) {
        failures.push(`${contractId} missing ${contextFact.label}`);
      }
      if (/^(not established|unknown|unresolved|none|null|n\/a)$/i.test(text)) {
        failures.push(`${contractId} has placeholder ${contextFact.label}`);
      }
    }
    if (!["reviewed", "approved"].includes(value(contract, "context_review_state"))) {
      failures.push(`${contractId} must carry reviewed or approved contract context`);
    }
    if (!value(contract, "context_reviewer_role")) {
      failures.push(`${contractId} missing contract context reviewer role`);
    }
    if (!value(contract, "context_reviewed_at")) {
      failures.push(`${contractId} missing contract context reviewed timestamp`);
    }
    if (new Set((spendByContract.get(contractId) ?? []).map((row) => value(row, "month"))).size !== 12) failures.push(`${contractId} must carry 12 spend months`);
    if ((usageByContract.get(contractId) ?? []).length < 48) failures.push(`${contractId} must carry service usage rows`);
    if (new Set((coverageByContract.get(contractId) ?? []).map((row) => value(row, "month"))).size !== 12) failures.push(`${contractId} must carry 12 commitment coverage months`);
    if (new Set((tagsByContract.get(contractId) ?? []).map((row) => value(row, "month"))).size !== 12) failures.push(`${contractId} must carry 12 tag quality months`);
    if (new Set((apByContract.get(contractId) ?? []).map((row) => value(row, "month"))).size !== 12) failures.push(`${contractId} must carry 12 AP reconciliation months`);
    if ((oppsByContract.get(contractId) ?? []).length === 0) failures.push(`${contractId} must carry optimization candidates`);
  }
  if (!contracts.some((row) => value(row, "cloud_provider") === "aws" || value(row, "vendor_ref") === "VEN-AWS")) failures.push("AWS contract is required for the cloud-consumption story");
  for (const opportunity of sourceFiles["optimization_opportunities.csv"]) {
    const opportunityId = value(opportunity, "opportunity_id");
    if (value(opportunity, "finance_confirmation_state") !== "not_confirmed") failures.push(`${value(opportunity, "opportunity_id")} must remain not_confirmed`);
    if (!value(opportunity, "evidence_rows")) failures.push(`${value(opportunity, "opportunity_id")} missing evidence_rows`);
    if (!["signal", "quantified", "approved", "realized"].includes(opportunityStage(opportunity))) failures.push(`${opportunityId} has unsupported stage ${opportunityStage(opportunity)}`);
    if (!["exact", "range", "not_sized"].includes(opportunityAmountState(opportunity))) failures.push(`${opportunityId} has unsupported amount_state ${opportunityAmountState(opportunity)}`);
    if (!["document_evidenced", "system_evidenced", "human_validated", "missing", "not_loaded"].includes(opportunityEvidenceGrade(opportunity))) failures.push(`${opportunityId} has unsupported evidence_grade ${opportunityEvidenceGrade(opportunity)}`);
    for (const field of ["buyer_ask", "negotiation_language", "vendor_concession", "timing_dependency", "owner_role", "priority", "risk_if_ignored"]) {
      if (!value(opportunity, field)) failures.push(`${value(opportunity, "opportunity_id")} missing ${field}`);
    }
    for (const evidenceRef of value(opportunity, "evidence_rows").split(";").map((item) => item.trim()).filter(Boolean)) {
      const found = Object.values(sourceFiles).some((rows) =>
        rows.some((row) =>
          value(row, "source_row_id") === evidenceRef ||
          value(row, "source_file_id") === evidenceRef ||
          value(row, "commitment_id") === evidenceRef ||
          value(row, "extraction_id") === evidenceRef,
        ),
      ) || evidenceIds.has(evidenceRef);
      if (!found) failures.push(`${value(opportunity, "opportunity_id")} cites unknown evidence row ${evidenceRef}`);
    }
  }

  return {
    status: failures.length ? "FAIL" : "PASS",
    tenantKey: args.tenantKey,
    datasetVersion: args.datasetVersion,
    failures,
    rowCounts: { ...rowCounts, synthetic_evidence_documents: docs.length },
    richness: {
      contracts: contracts.length,
      cloudProviders: new Set(contracts.map((row) => value(row, "vendor_name"))).size,
      contractsWithTwelveSpendMonths: contracts.filter((row) => new Set((spendByContract.get(value(row, "contract_id")) ?? []).map((spend) => value(spend, "month"))).size === 12).length,
      serviceUsageRows: sourceFiles["cloud_service_usage_monthly.csv"].length,
      resourceInventoryRows: sourceFiles["cloud_resource_inventory.csv"].length,
      opportunityRows: sourceFiles["optimization_opportunities.csv"].length,
      evidenceDocuments: docs.length,
    },
  };
}

function requireApplyApproval(args) {
  if (!args.applyApproved) throw new Error("Refusing to mutate Azure without SOURCE_CLOUD_CONSUMPTION_PACKAGE_APPLY_APPROVED=true.");
}

async function assertTables(client, tableNames) {
  const result = await client.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'source'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [tableNames],
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = tableNames.filter((tableName) => !found.has(tableName));
  if (missing.length) throw new Error(`Missing Source tables: ${missing.join(", ")}`);
}

async function writeRunStatus(client, args, packageHash, status, layer2RowCount, qualityGate, layer3Summary = {}) {
  await client.query(
    `INSERT INTO source.cloud_consumption_package_load_run (
       tenant_key, dataset_version, load_run_id, idempotency_key, package_sha256,
       mode, status, layer2_row_count, layer3_summary, quality_gate,
       proof_bundle_path, payload, completed_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11,
       $12::jsonb, CASE WHEN $7 IN ('completed', 'failed') THEN now() ELSE NULL END
     )
     ON CONFLICT (tenant_key, dataset_version, load_run_id)
     DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key,
                   package_sha256 = EXCLUDED.package_sha256,
                   mode = EXCLUDED.mode,
                   status = EXCLUDED.status,
                   layer2_row_count = EXCLUDED.layer2_row_count,
                   layer3_summary = EXCLUDED.layer3_summary,
                   quality_gate = EXCLUDED.quality_gate,
                   proof_bundle_path = EXCLUDED.proof_bundle_path,
                   payload = EXCLUDED.payload,
                   completed_at = EXCLUDED.completed_at,
                   updated_at = now()`,
    [
      args.tenantKey,
      args.datasetVersion,
      args.loadRunId,
      args.idempotencyKey,
      packageHash,
      args.mode,
      status,
      layer2RowCount,
      JSON.stringify(layer3Summary),
      JSON.stringify(qualityGate),
      args.proofDir,
      JSON.stringify({
        job_name: process.env.ACA_JOB_NAME ?? process.env.CONTAINER_APP_JOB_NAME ?? null,
        branch_commit: process.env.ABARVA_OPERATOR_BRANCH_COMMIT ?? null,
        mode: args.mode,
      }),
    ],
  );
}

async function applyLayer2(client, args, rows, packageHash, qualityGate) {
  await assertTables(client, REQUIRED_LAYER2_TABLES);
  await writeRunStatus(client, args, packageHash, "running", 0, qualityGate);
  for (const row of rows) {
    await client.query(
      `INSERT INTO source.cloud_consumption_adapter_row (
         tenant_key, dataset_version, adapter_name, source_row_id, source_file_name,
         source_row_number, source_hash, payload, lineage, quality_state, load_run_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, 'adapter_validated', $10)
       ON CONFLICT (tenant_key, dataset_version, adapter_name, source_row_id)
       DO UPDATE SET source_file_name = EXCLUDED.source_file_name,
                     source_row_number = EXCLUDED.source_row_number,
                     source_hash = EXCLUDED.source_hash,
                     payload = EXCLUDED.payload,
                     lineage = EXCLUDED.lineage,
                     quality_state = EXCLUDED.quality_state,
                     load_run_id = EXCLUDED.load_run_id,
                     updated_at = now()`,
      [
        args.tenantKey,
        args.datasetVersion,
        row.adapterName,
        row.sourceRowId,
        row.sourceFileName,
        row.sourceRowNumber,
        row.sourceHash,
        JSON.stringify(row.payload),
        JSON.stringify({
          package_sha256: packageHash,
          source_file_name: row.sourceFileName,
          layer: 2,
          adapter_version: value(row.payload, "adapter_version"),
        }),
        args.loadRunId,
      ],
    );
  }
  await writeRunStatus(client, args, packageHash, "completed", rows.length, qualityGate);
}

async function layer2Readback(client, args) {
  const result = await client.query(
    `SELECT adapter_name, count(*)::text AS count
       FROM source.cloud_consumption_adapter_row
      WHERE tenant_key = $1 AND dataset_version = $2
      GROUP BY adapter_name
      ORDER BY adapter_name`,
    [args.tenantKey, args.datasetVersion],
  );
  return Object.fromEntries(result.rows.map((row) => [row.adapter_name, Number(row.count)]));
}

function assertCounts(expected, actual, label) {
  const failures = Object.entries(expected)
    .filter(([name, count]) => actual[name] !== count)
    .map(([name, count]) => `${name}: expected ${count}, read ${actual[name] ?? 0}`);
  if (failures.length) throw new Error(`${label} count mismatch: ${failures.join("; ")}`);
}

async function insertSnapshots(client, args, rows) {
  for (const row of rows) {
    const payload = row.payload;
    const start = periodStart(payload);
    const end = periodEnd(payload);
    await client.query(
      `INSERT INTO source.source_record_snapshot (
         tenant_key, dataset_version, snapshot_id, source_system, source_table,
         source_record_id, source_record_hash, native_record_key, contract_id,
         vendor_id, period_start, period_end, payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $6, NULLIF($8, ''), NULLIF($9, ''),
         NULLIF($10, '')::date, NULLIF($11, '')::date, $12::jsonb
       )
       ON CONFLICT (tenant_key, dataset_version, snapshot_id)
       DO UPDATE SET source_record_hash = EXCLUDED.source_record_hash,
                     contract_id = EXCLUDED.contract_id,
                     vendor_id = EXCLUDED.vendor_id,
                     period_start = EXCLUDED.period_start,
                     period_end = EXCLUDED.period_end,
                     payload = EXCLUDED.payload`,
      [
        args.tenantKey,
        args.datasetVersion,
        `${row.adapterName}:${row.sourceRowId}`,
        SOURCE_SYSTEM,
        `source.cloud_consumption_adapter_row.${row.adapterName}`,
        row.sourceRowId,
        row.sourceHash,
        value(payload, "contract_id"),
        value(payload, "vendor_ref"),
        start,
        end,
        JSON.stringify(payload),
      ],
    );
  }
}

async function upsertVendors(client, args, contracts) {
  for (const contract of uniqueRows(contracts, "vendor_ref")) {
    await client.query(
      `INSERT INTO source.vendor (
         tenant_key, vendor_id, legal_name, supplier_category, strategic_status,
         relationship_owner_role, active_state, source_system, source_record_id,
         as_of_date, confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, 'portfolio_candidate', $5, 'active', $6, $7,
         CURRENT_DATE, $8, 'reviewed', $9, $10, $11::jsonb
       )
       ON CONFLICT (tenant_key, vendor_id)
       DO UPDATE SET legal_name = EXCLUDED.legal_name,
                     supplier_category = EXCLUDED.supplier_category,
                     relationship_owner_role = EXCLUDED.relationship_owner_role,
                     confidence = EXCLUDED.confidence,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        value(contract, "vendor_ref"),
        value(contract, "vendor_name"),
        value(contract, "archetype") || value(contract, "category"),
        value(contract, "business_owner"),
        SOURCE_SYSTEM,
        value(contract, "source_row_id"),
        numberValue(contract, "source_confidence") ?? 0.88,
        `source_cloud_consumption_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify({ dataset_version: args.datasetVersion, synthetic_policy: SYNTHETIC_POLICY }),
      ],
    );
  }
}

async function upsertContracts(client, args, contracts) {
  for (const contract of contracts) {
    await client.query(
      `INSERT INTO source.contract (
         tenant_key, contract_id, vendor_id, contract_name, agreement_type,
         effective_date, expiration_date, notice_deadline, renewal_type,
         auto_renew, annual_value, total_committed_value, minimum_commitment,
         currency, benchmark_rights, termination_rights, renewal_owner_role,
         document_file_id, source_system, source_record_id, as_of_date,
         confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, $5, NULLIF($6, '')::date, NULLIF($7, '')::date,
         NULLIF($8, '')::date, 'review_required', $9, $10, $11, $12, 'USD',
         $13, $14, $15, $16, $17, $18, CURRENT_DATE, $19, 'reviewed',
         $20, $21, $22::jsonb
       )
       ON CONFLICT (tenant_key, contract_id)
       DO UPDATE SET vendor_id = EXCLUDED.vendor_id,
                     contract_name = EXCLUDED.contract_name,
                     agreement_type = EXCLUDED.agreement_type,
                     effective_date = EXCLUDED.effective_date,
                     expiration_date = EXCLUDED.expiration_date,
                     notice_deadline = EXCLUDED.notice_deadline,
                     auto_renew = EXCLUDED.auto_renew,
                     annual_value = EXCLUDED.annual_value,
                     total_committed_value = EXCLUDED.total_committed_value,
                     minimum_commitment = EXCLUDED.minimum_commitment,
                     benchmark_rights = EXCLUDED.benchmark_rights,
                     termination_rights = EXCLUDED.termination_rights,
                     renewal_owner_role = EXCLUDED.renewal_owner_role,
                     document_file_id = EXCLUDED.document_file_id,
                     confidence = EXCLUDED.confidence,
                     quality_state = EXCLUDED.quality_state,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        value(contract, "contract_id"),
        value(contract, "vendor_ref"),
        value(contract, "contract_name"),
        value(contract, "category"),
        value(contract, "start_date"),
        value(contract, "end_date"),
        value(contract, "renewal_notice_date"),
        boolValue(contract, "auto_renew"),
        numberValue(contract, "annual_value_usd"),
        totalCommittedValue(contract),
        numberValue(contract, "committed_annual_spend_usd"),
        value(contract, "benchmarking_clause"),
        value(contract, "termination_rights"),
        value(contract, "business_owner"),
        value(contract, "source_file_id"),
        SOURCE_SYSTEM,
        value(contract, "source_row_id"),
        numberValue(contract, "source_confidence") ?? 0.88,
        `source_cloud_consumption_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify({
          ...contract,
          contract_archetype: value(contract, "archetype"),
          synthetic_policy: SYNTHETIC_POLICY,
          alternatives_available: null,
        }),
      ],
    );
  }
}

async function upsertContractTerms(client, args, clauses) {
  for (const clause of clauses) {
    await client.query(
      `INSERT INTO source.contract_term (
         tenant_key, term_id, contract_id, term_type, term_name, term_value,
         value_num, unit, currency, page_ref, clause_ref, source_system,
         source_record_id, as_of_date, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, NULL, 'USD', $8, $9, $10, $2,
         CURRENT_DATE, $11, 'reviewed', $12, $13, $14::jsonb
       )
       ON CONFLICT (tenant_key, term_id)
       DO UPDATE SET term_value = EXCLUDED.term_value,
                     value_num = EXCLUDED.value_num,
                     page_ref = EXCLUDED.page_ref,
                     confidence = EXCLUDED.confidence,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        value(clause, "extraction_id"),
        value(clause, "contract_id"),
        value(clause, "evidence_class") || value(clause, "concept_ref"),
        value(clause, "concept_ref"),
        value(clause, "value_text") || value(clause, "value_bool"),
        numberValue(clause, "value_num"),
        value(clause, "source_page"),
        value(clause, "source_section"),
        SOURCE_SYSTEM,
        numberValue(clause, "confidence") ?? 0.86,
        `source_cloud_consumption_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(clause),
      ],
    );
  }
}

async function upsertContractScope(client, args, scopeRows) {
  for (const row of scopeRows) {
    await client.query(
      `INSERT INTO source.contract_scope (
         tenant_key, contract_scope_id, contract_id, scope_type, scope_ref,
         scope_name, service_id, relationship_method, relationship_confidence,
         criticality, source_system, source_record_id, as_of_date, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, 'application', $4, $5, $6, $7, $8, $9, $10, $2,
         CURRENT_DATE, 'reviewed', $11, $12, $13::jsonb
       )
       ON CONFLICT (tenant_key, contract_scope_id)
       DO UPDATE SET scope_ref = EXCLUDED.scope_ref,
                     scope_name = EXCLUDED.scope_name,
                     service_id = EXCLUDED.service_id,
                     relationship_method = EXCLUDED.relationship_method,
                     relationship_confidence = EXCLUDED.relationship_confidence,
                     criticality = EXCLUDED.criticality,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        value(row, "source_row_id"),
        value(row, "contract_id"),
        value(row, "application_ref"),
        value(row, "application_name"),
        value(row, "scope_role"),
        value(row, "relationship_method"),
        numberValue(row, "relationship_confidence") ?? 0.86,
        value(row, "criticality"),
        SOURCE_SYSTEM,
        `source_cloud_consumption_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(row),
      ],
    );
  }
}

async function upsertSpend(client, args, spendRows) {
  for (const row of spendRows) {
    await client.query(
      `INSERT INTO source.contract_consumption_observation (
         tenant_key, observation_id, contract_id, business_unit, cost_center,
         period_start, period_end, committed_amount, invoice_amount, paid_amount,
         actual_spend, currency, source_system, source_record_id, as_of_date,
         confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, 'Cloud Platform', $4, $5::date, $6::date, $7, $8, $9, $10, $11,
         $12, $2, CURRENT_DATE, 0.9, 'reviewed', $13, $14, $15::jsonb
       )
       ON CONFLICT (tenant_key, observation_id)
       DO UPDATE SET period_start = EXCLUDED.period_start,
                     period_end = EXCLUDED.period_end,
                     committed_amount = EXCLUDED.committed_amount,
                     invoice_amount = EXCLUDED.invoice_amount,
                     paid_amount = EXCLUDED.paid_amount,
                     actual_spend = EXCLUDED.actual_spend,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        value(row, "source_row_id"),
        value(row, "contract_id"),
        value(row, "vendor_ref"),
        value(row, "period_start"),
        value(row, "period_end"),
        numberValue(row, "committed_base_amount_usd"),
        numberValue(row, "invoice_amount_usd"),
        numberValue(row, "paid_amount_usd"),
        numberValue(row, "actual_spend_usd"),
        value(row, "currency") || "USD",
        SOURCE_SYSTEM,
        `source_cloud_consumption_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(row),
      ],
    );
  }
}

async function upsertCloudTables(client, args, files) {
  for (const row of files["cloud_accounts.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_account (
         tenant_key, dataset_version, cloud_account_id, cloud_provider, account_name,
         business_unit, technical_owner, account_type, source_system, tag_policy_state,
         source_file_id, confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0.88,'reviewed',$12,$13,$14::jsonb)
       ON CONFLICT (tenant_key, dataset_version, cloud_account_id)
       DO UPDATE SET account_name = EXCLUDED.account_name,
                     business_unit = EXCLUDED.business_unit,
                     technical_owner = EXCLUDED.technical_owner,
                     account_type = EXCLUDED.account_type,
                     tag_policy_state = EXCLUDED.tag_policy_state,
                     source_file_id = EXCLUDED.source_file_id,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "cloud_account_id"), value(row, "cloud_provider"), value(row, "account_name"), value(row, "business_unit"), value(row, "technical_owner"), value(row, "account_type"), value(row, "source_system"), value(row, "tag_policy_state"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }

  for (const row of files["cloud_service_usage_monthly.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_service_usage_observation (
         tenant_key, dataset_version, usage_id, contract_id, vendor_id, vendor_name,
         cloud_provider, cloud_account_id, business_unit, application_ref, service_name,
         usage_type, region, period_start, period_end, usage_quantity, usage_unit,
         on_demand_spend_usd, covered_spend_usd, total_spend_usd,
         owner_tag, environment_tag, source_file_id, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::date,$15::date,$16,$17,$18,$19,$20,$21,$22,$23,0.9,'reviewed',$24,$25,$26::jsonb)
       ON CONFLICT (tenant_key, dataset_version, usage_id)
       DO UPDATE SET total_spend_usd = EXCLUDED.total_spend_usd,
                     on_demand_spend_usd = EXCLUDED.on_demand_spend_usd,
                     covered_spend_usd = EXCLUDED.covered_spend_usd,
                     usage_quantity = EXCLUDED.usage_quantity,
                     owner_tag = EXCLUDED.owner_tag,
                     environment_tag = EXCLUDED.environment_tag,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "source_row_id"), value(row, "contract_id"), value(row, "vendor_ref"), value(row, "vendor_name"), value(row, "cloud_provider"), value(row, "cloud_account_id"), value(row, "business_unit"), value(row, "application_ref"), value(row, "service_name"), value(row, "usage_type"), value(row, "region"), periodStart(row), periodEnd(row), numberValue(row, "usage_quantity"), value(row, "usage_unit"), numberValue(row, "on_demand_spend_usd"), numberValue(row, "covered_spend_usd"), numberValue(row, "total_spend_usd"), value(row, "owner_tag"), value(row, "environment_tag"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }

  for (const row of files["cloud_commitments.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_commitment (
         tenant_key, dataset_version, commitment_id, contract_id, vendor_id, vendor_name,
         cloud_provider, commitment_type, annual_commitment_usd, hourly_commitment_usd,
         start_date, end_date, utilization_pct, source_file_id, confidence,
         quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULLIF($11,'')::date,NULLIF($12,'')::date,$13,$14,0.9,'reviewed',$15,$16,$17::jsonb)
       ON CONFLICT (tenant_key, dataset_version, commitment_id)
       DO UPDATE SET annual_commitment_usd = EXCLUDED.annual_commitment_usd,
                     hourly_commitment_usd = EXCLUDED.hourly_commitment_usd,
                     utilization_pct = EXCLUDED.utilization_pct,
                     source_file_id = EXCLUDED.source_file_id,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "commitment_id"), value(row, "contract_id"), value(row, "vendor_ref"), value(row, "vendor_name"), value(row, "cloud_provider"), value(row, "commitment_type"), numberValue(row, "annual_commitment_usd"), numberValue(row, "hourly_commitment_usd"), value(row, "start_date"), value(row, "end_date"), pctValue(row, "utilization_pct"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }

  for (const row of files["cloud_commitment_coverage_monthly.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_commitment_coverage_observation (
         tenant_key, dataset_version, coverage_id, contract_id, vendor_id, vendor_name,
         cloud_provider, period_start, period_end, eligible_stable_workload_spend_usd,
         commitment_covered_spend_usd, on_demand_eligible_spend_usd,
         commitment_coverage_pct, commitment_utilization_pct, recommended_step_up_usd,
         expected_discount_pct, candidate_monthly_savings_usd, source_file_id,
         confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9::date,$10,$11,$12,$13,$14,$15,$16,$17,$18,0.9,'reviewed',$19,$20,$21::jsonb)
       ON CONFLICT (tenant_key, dataset_version, coverage_id)
       DO UPDATE SET commitment_coverage_pct = EXCLUDED.commitment_coverage_pct,
                     commitment_utilization_pct = EXCLUDED.commitment_utilization_pct,
                     candidate_monthly_savings_usd = EXCLUDED.candidate_monthly_savings_usd,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "source_row_id"), value(row, "contract_id"), value(row, "vendor_ref"), value(row, "vendor_name"), value(row, "cloud_provider"), periodStart(row), periodEnd(row), numberValue(row, "eligible_stable_workload_spend_usd"), numberValue(row, "commitment_covered_spend_usd"), numberValue(row, "on_demand_eligible_spend_usd"), pctValue(row, "commitment_coverage_pct"), pctValue(row, "commitment_utilization_pct"), numberValue(row, "recommended_step_up_usd"), pctValue(row, "expected_discount_pct"), numberValue(row, "candidate_monthly_savings_usd"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }

  for (const row of files["cloud_resource_inventory.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_resource_inventory (
         tenant_key, dataset_version, resource_inventory_id, resource_id, contract_id,
         vendor_id, vendor_name, cloud_provider, service_name, sku, region,
         application_ref, business_unit, owner_tag, environment_tag,
         avg_cpu_utilization_pct, avg_memory_utilization_pct, monthly_spend_usd,
         rightsize_signal, source_file_id, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,0.88,'reviewed',$21,$22,$23::jsonb)
       ON CONFLICT (tenant_key, dataset_version, resource_inventory_id)
       DO UPDATE SET monthly_spend_usd = EXCLUDED.monthly_spend_usd,
                     avg_cpu_utilization_pct = EXCLUDED.avg_cpu_utilization_pct,
                     avg_memory_utilization_pct = EXCLUDED.avg_memory_utilization_pct,
                     rightsize_signal = EXCLUDED.rightsize_signal,
                     owner_tag = EXCLUDED.owner_tag,
                     environment_tag = EXCLUDED.environment_tag,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "source_row_id"), value(row, "resource_id"), value(row, "contract_id"), value(row, "vendor_ref"), value(row, "vendor_name"), value(row, "cloud_provider"), value(row, "service_name"), value(row, "sku"), value(row, "region"), value(row, "application_ref"), value(row, "business_unit"), value(row, "owner_tag"), value(row, "environment_tag"), pctValue(row, "avg_cpu_utilization_pct"), pctValue(row, "avg_memory_utilization_pct"), numberValue(row, "monthly_spend_usd"), value(row, "rightsize_signal"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }

  for (const row of files["cloud_tag_quality.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_tag_quality_observation (
         tenant_key, dataset_version, tag_quality_id, contract_id, vendor_id, vendor_name,
         cloud_provider, account_subscription_id, period_start, period_end,
         total_spend_usd, owner_tagged_spend_usd, application_tagged_spend_usd,
         untagged_spend_usd, owner_tag_coverage_pct, application_tag_coverage_pct,
         data_quality_state, source_file_id, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,$10::date,$11,$12,$13,$14,$15,$16,$17,$18,0.9,'reviewed',$19,$20,$21::jsonb)
       ON CONFLICT (tenant_key, dataset_version, tag_quality_id)
       DO UPDATE SET total_spend_usd = EXCLUDED.total_spend_usd,
                     untagged_spend_usd = EXCLUDED.untagged_spend_usd,
                     owner_tag_coverage_pct = EXCLUDED.owner_tag_coverage_pct,
                     application_tag_coverage_pct = EXCLUDED.application_tag_coverage_pct,
                     data_quality_state = EXCLUDED.data_quality_state,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "source_row_id"), value(row, "contract_id"), value(row, "vendor_ref"), value(row, "vendor_name"), value(row, "cloud_provider"), value(row, "account_subscription_id"), periodStart(row), periodEnd(row), numberValue(row, "total_spend_usd"), numberValue(row, "owner_tagged_spend_usd"), numberValue(row, "application_tagged_spend_usd"), numberValue(row, "untagged_spend_usd"), pctValue(row, "owner_tag_coverage_pct"), pctValue(row, "application_tag_coverage_pct"), value(row, "data_quality_state"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }

  for (const row of files["cloud_ap_invoice_reconciliation.csv"]) {
    await client.query(
      `INSERT INTO source.cloud_ap_invoice_reconciliation (
         tenant_key, dataset_version, reconciliation_id, contract_id, vendor_id,
         vendor_name, period_start, period_end, cloud_billing_export_amount_usd,
         ap_invoice_amount_usd, paid_amount_usd, variance_usd,
         reconciliation_state, source_file_id, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8::date,$9,$10,$11,$12,$13,$14,0.9,'reviewed',$15,$16,$17::jsonb)
       ON CONFLICT (tenant_key, dataset_version, reconciliation_id)
       DO UPDATE SET cloud_billing_export_amount_usd = EXCLUDED.cloud_billing_export_amount_usd,
                     ap_invoice_amount_usd = EXCLUDED.ap_invoice_amount_usd,
                     paid_amount_usd = EXCLUDED.paid_amount_usd,
                     variance_usd = EXCLUDED.variance_usd,
                     reconciliation_state = EXCLUDED.reconciliation_state,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [args.tenantKey, args.datasetVersion, value(row, "source_row_id"), value(row, "contract_id"), value(row, "vendor_ref"), value(row, "vendor_name"), periodStart(row), periodEnd(row), numberValue(row, "cloud_billing_export_amount_usd"), numberValue(row, "ap_invoice_amount_usd"), numberValue(row, "paid_amount_usd"), numberValue(row, "variance_usd"), value(row, "reconciliation_state"), value(row, "source_file_id"), `source_cloud_consumption_package:${args.datasetVersion}`, args.loadRunId, JSON.stringify(row)],
    );
  }
}

async function insertCanonicalFact(client, args, fact) {
  await client.query(
    `INSERT INTO source.canonical_fact_assertion (
       tenant_key, dataset_version, assertion_id, entity_kind, entity_id,
       contract_id, vendor_id, fact_key, value_numeric, currency, unit,
       period_start, period_end, source_system, source_table, source_record_id,
       source_document_id, assertion_basis, confidence, review_state, source_refs, payload
     )
     VALUES (
       $1, $2, $3, 'contract', $4, $4, $5, $6, $7, $8, $9,
       NULLIF($10, '')::date, NULLIF($11, '')::date, $12, $13, $14, $15,
       $16, $17, $18, $19::jsonb, $20::jsonb
     )
     ON CONFLICT (tenant_key, dataset_version, assertion_id)
     DO UPDATE SET value_numeric = EXCLUDED.value_numeric,
                   currency = EXCLUDED.currency,
                   unit = EXCLUDED.unit,
                   period_start = EXCLUDED.period_start,
                   period_end = EXCLUDED.period_end,
                   source_document_id = EXCLUDED.source_document_id,
                   assertion_basis = EXCLUDED.assertion_basis,
                   source_refs = EXCLUDED.source_refs,
                   payload = EXCLUDED.payload`,
    [
      args.tenantKey,
      args.datasetVersion,
      fact.assertionId,
      fact.contractId,
      fact.vendorId,
      fact.factKey,
      fact.numeric,
      fact.currency ?? null,
      fact.unit ?? null,
      fact.periodStart ?? "",
      fact.periodEnd ?? "",
      SOURCE_SYSTEM,
      fact.sourceTable,
      fact.sourceRecordId,
      fact.sourceDocumentId ?? null,
      fact.assertionBasis,
      fact.confidence ?? 0.88,
      fact.reviewState ?? "system_extracted",
      JSON.stringify(fact.sourceRefs),
      JSON.stringify(fact.payload),
    ],
  );
}

async function upsertCloudCanonicalFacts(client, args, files) {
  for (const row of files["cloud_contract_register.csv"]) {
    for (const contextFact of CONTRACT_CONTEXT_FACTS) {
      const text = value(row, contextFact.column).trim();
      await insertCanonicalFact(client, args, {
        assertionId: `${value(row, "source_row_id")}:${contextFact.column}`,
        contractId: value(row, "contract_id"),
        vendorId: value(row, "vendor_ref"),
        factKey: contextFact.factKey,
        numeric: null,
        unit: "text",
        sourceTable: "source.contract",
        sourceRecordId: value(row, "source_row_id"),
        sourceDocumentId: value(row, "source_file_id"),
        assertionBasis: `${contextFact.label} loaded from the governed cloud contract register, not generated by the product surface.`,
        sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
        payload: {
          value_text: text,
          source_column: contextFact.column,
          basis_type: "reviewed_contract_intelligence",
          context_review_state: value(row, "context_review_state"),
          context_reviewer_role: value(row, "context_reviewer_role"),
          context_reviewed_at: value(row, "context_reviewed_at"),
          derived_from_load_run_id: args.loadRunId,
          synthetic_policy: SYNTHETIC_POLICY,
        },
        confidence: numberValue(row, "source_confidence") ?? 0.88,
        reviewState: value(row, "context_review_state"),
      });
    }
  }
  for (const row of files["monthly_spend.csv"]) {
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:actual_spend_usd`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "cloud.ap_reconciled_actual_spend_usd",
      numeric: requiredNumber(row, "actual_spend_usd"),
      currency: "USD",
      periodStart: periodStart(row),
      periodEnd: periodEnd(row),
      sourceTable: "source.contract_consumption_observation",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Monthly cloud actual spend reconciled from invoice and AP-paid rows.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: row,
    });
  }
  for (const row of files["cloud_service_usage_monthly.csv"]) {
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:total_spend_usd`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "cloud.service_usage_total_spend_usd",
      numeric: requiredNumber(row, "total_spend_usd"),
      currency: "USD",
      periodStart: periodStart(row),
      periodEnd: periodEnd(row),
      sourceTable: "source.cloud_service_usage_observation",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Native cloud service usage row linked to contract, account, application, service, and region.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: row,
    });
  }
  for (const row of files["cloud_commitment_coverage_monthly.csv"]) {
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:candidate_monthly_savings_usd`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "cloud.commitment_candidate_monthly_savings_usd",
      numeric: requiredNumber(row, "candidate_monthly_savings_usd"),
      currency: "USD",
      periodStart: periodStart(row),
      periodEnd: periodEnd(row),
      sourceTable: "source.cloud_commitment_coverage_observation",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Coverage opportunity from native commitment data, not finance-confirmed realized savings.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: row,
    });
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:commitment_coverage_pct`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "cloud.commitment_coverage_pct",
      numeric: pctValue(row, "commitment_coverage_pct"),
      unit: "%",
      periodStart: periodStart(row),
      periodEnd: periodEnd(row),
      sourceTable: "source.cloud_commitment_coverage_observation",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Committed-use coverage percentage from native cloud commitment evidence.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: row,
    });
  }
  for (const row of files["cloud_resource_inventory.csv"]) {
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:monthly_spend_usd`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "cloud.resource_monthly_spend_usd",
      numeric: requiredNumber(row, "monthly_spend_usd"),
      currency: "USD",
      sourceTable: "source.cloud_resource_inventory",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Resource-level monthly spend with utilization and rightsize signal.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: row,
    });
  }
  for (const row of files["cloud_tag_quality.csv"]) {
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:untagged_spend_usd`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "cloud.untagged_spend_usd",
      numeric: requiredNumber(row, "untagged_spend_usd"),
      currency: "USD",
      periodStart: periodStart(row),
      periodEnd: periodEnd(row),
      sourceTable: "source.cloud_tag_quality_observation",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Untagged cloud spend blocks owner-level savings allocation.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: row,
    });
  }
}

async function upsertCloudPageTextFacts(client, args, pageRows) {
  for (const row of pageRows) {
    const pageText = value(row, "page_text");
    await insertCanonicalFact(client, args, {
      assertionId: `${value(row, "source_row_id")}:page_text_char_count`,
      contractId: value(row, "contract_id"),
      vendorId: value(row, "vendor_ref"),
      factKey: "document.page_text_char_count",
      numeric: pageText.length,
      unit: "character",
      sourceTable: "source.contract_page_text_adapter",
      sourceRecordId: value(row, "source_row_id"),
      sourceDocumentId: value(row, "source_file_id"),
      assertionBasis: "Searchable page text is present for this reviewed synthetic contract evidence document.",
      sourceRefs: [value(row, "source_row_id"), value(row, "source_file_id")],
      payload: {
        source_file_id: value(row, "source_file_id"),
        source_page: value(row, "source_page"),
        page_text_sha256: value(row, "page_text_sha256"),
        synthetic_policy: SYNTHETIC_POLICY,
      },
    });
  }
}

async function upsertOptimizationSpine(client, args, files) {
  const opportunities = files["optimization_opportunities.csv"];
  const contracts = files["cloud_contract_register.csv"];
  const contractsById = new Map(contracts.map((contract) => [value(contract, "contract_id"), contract]));
  const spendByContract = groupBy(files["monthly_spend.csv"], "contract_id");
  const opportunityIds = opportunities.map((row) => value(row, "opportunity_id"));
  const contractIds = contracts.map((row) => value(row, "contract_id"));
  const calculationRunIds = opportunityIds.map((opportunityId) => `cloud-consumption:${opportunityId}:calculation`);
  const caseIds = contractIds.map((contractId) => `cloud-consumption:${contractId}:case`);
  const requirementIds = opportunityIds.map((opportunityId) => `cloud-consumption:${opportunityId}:finance-review`);

  await client.query(`DELETE FROM source.calculation_output WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, calculationRunIds]);
  await client.query(`DELETE FROM source.calculation_input WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, calculationRunIds]);
  await client.query(`DELETE FROM source.calculation_run WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, calculationRunIds]);
  await client.query(`DELETE FROM source.opportunity_valuation WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, opportunityIds]);
  await client.query(`DELETE FROM source.opportunity_evidence WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, opportunityIds]);
  await client.query(`DELETE FROM source.opportunity_requirement_status WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, opportunityIds]);
  await client.query(`DELETE FROM source.evidence_request WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, opportunityIds]);
  await client.query(`DELETE FROM source.case_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND optimization_case_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, caseIds]);
  await client.query(`DELETE FROM source.optimization_case WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, contractIds]);
  await client.query(`DELETE FROM source.optimization_baseline WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, contractIds]);
  await client.query(`DELETE FROM source.evidence_requirement WHERE tenant_key = $1 AND dataset_version = $2 AND requirement_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, requirementIds]);
  await client.query(`DELETE FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`, [args.tenantKey, args.datasetVersion, opportunityIds]);

  await client.query(
    `INSERT INTO source.calculation_rule (
       tenant_key, dataset_version, rule_id, rule_version, formula, input_contract, output_contract, payload
     )
     VALUES (
       $1, $2, 'source.cloud_consumption_package.opportunity.v1', '1.0.0',
       'Native cloud recommendations become candidate value only after CLM terms, AP-paid spend, CMDB ownership, and evidence rows reconcile.',
       $3::jsonb, $4::jsonb, '{}'::jsonb
     )
     ON CONFLICT (tenant_key, dataset_version, rule_id, rule_version)
     DO UPDATE SET formula = EXCLUDED.formula`,
    [args.tenantKey, args.datasetVersion, JSON.stringify(["cloud_usage", "commitment_coverage", "resource_inventory", "ap_reconciliation", "contract_terms"]), JSON.stringify(["calculated_amount_usd"])],
  );

  for (const contract of contracts) {
    const contractId = value(contract, "contract_id");
    const spend = spendByContract.get(contractId) ?? [];
    await client.query(
      `INSERT INTO source.optimization_baseline (
         tenant_key, dataset_version, baseline_id, contract_id, baseline_state,
         annual_value_usd, pricing_schedule_annual_value_usd, actual_annual_spend_usd,
         total_committed_value_usd, conflict_amount_usd, detail, source_refs, payload
       )
       VALUES ($1,$2,$3,$4,'ready',$5,NULL,$6,$7,NULL,$8,$9::jsonb,$10::jsonb)`,
      [
        args.tenantKey,
        args.datasetVersion,
        `cloud-consumption:${contractId}:baseline`,
        contractId,
        numberValue(contract, "annual_value_usd"),
        spend.reduce((total, row) => total + requiredNumber(row, "actual_spend_usd"), 0),
        totalCommittedValue(contract),
        "Baseline uses 12 monthly AP-reconciled cloud spend observations plus native cloud evidence rows.",
        JSON.stringify(spend.map((row) => value(row, "source_row_id"))),
        JSON.stringify({ synthetic_policy: SYNTHETIC_POLICY }),
      ],
    );
  }

  for (const opportunity of opportunities) {
    const opportunityId = value(opportunity, "opportunity_id");
    const contract = contractsById.get(value(opportunity, "contract_id"));
    if (!contract) throw new Error(`Unknown contract for opportunity ${opportunityId}`);
    const calculationRunId = `cloud-consumption:${opportunityId}:calculation`;
    const caseId = `cloud-consumption:${value(opportunity, "contract_id")}:case`;
    const requirementId = `cloud-consumption:${opportunityId}:finance-review`;
    const evidenceRows = value(opportunity, "evidence_rows").split(";").map((item) => item.trim()).filter(Boolean);
    const amount = requiredNumber(opportunity, "annual_value_usd");

    await client.query(
      `INSERT INTO source.optimization_opportunity (
         tenant_key, dataset_version, opportunity_id, contract_id, vendor_id,
         value_type, stage, amount_usd, amount_state, evidence_grade, confidence,
         owner, next_action, blocking_gap, deadline, overlap_treatment,
         approval_state, narrative, payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
         NULL,'standalone_candidate','requires_review',$15,$16::jsonb)`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        value(opportunity, "contract_id"),
        value(opportunity, "vendor_ref"),
        canonicalOpportunityValueType(opportunity),
        opportunityStage(opportunity),
        amount,
        opportunityAmountState(opportunity),
        opportunityEvidenceGrade(opportunity),
        numberValue(opportunity, "confidence") ?? 0.8,
        value(contract, "business_owner"),
        value(opportunity, "recommended_action"),
        opportunityBlockingGap(opportunity),
        value(opportunity, "title"),
        JSON.stringify({
          ...opportunity,
          label: value(opportunity, "title"),
          short_label: value(opportunity, "title"),
          source_opportunity_type: value(opportunity, "opportunity_type"),
          canonical_value_type: canonicalOpportunityValueType(opportunity),
          finance_confirmation_state: "not_confirmed",
          synthetic_policy: SYNTHETIC_POLICY,
        }),
      ],
    );
    await client.query(
      `INSERT INTO source.optimization_case (
         tenant_key, dataset_version, optimization_case_id, contract_id,
         vendor_id, baseline_id, case_state, owner, next_action, payload
       )
       VALUES ($1,$2,$3,$4,$5,$6,'evidence_review',$7,$8,$9::jsonb)
       ON CONFLICT (tenant_key, dataset_version, optimization_case_id)
       DO UPDATE SET vendor_id = EXCLUDED.vendor_id,
                     baseline_id = EXCLUDED.baseline_id,
                     case_state = EXCLUDED.case_state,
                     owner = EXCLUDED.owner,
                     next_action = EXCLUDED.next_action,
                     payload = EXCLUDED.payload`,
      [args.tenantKey, args.datasetVersion, caseId, value(opportunity, "contract_id"), value(opportunity, "vendor_ref"), `cloud-consumption:${value(opportunity, "contract_id")}:baseline`, value(contract, "business_owner"), value(opportunity, "recommended_action"), JSON.stringify({ synthetic_policy: SYNTHETIC_POLICY })],
    );
    await client.query(`INSERT INTO source.case_opportunity (tenant_key, dataset_version, optimization_case_id, opportunity_id, selected_for_action, sequence, payload) VALUES ($1,$2,$3,$4,false,1,'{}'::jsonb)`, [args.tenantKey, args.datasetVersion, caseId, opportunityId]);
    await client.query(
      `INSERT INTO source.calculation_run (
         tenant_key, dataset_version, calculation_run_id, opportunity_id,
         rule_id, rule_version, run_state, run_hash, completed_at, payload
       )
       VALUES ($1,$2,$3,$4,'source.cloud_consumption_package.opportunity.v1','1.0.0','completed',$5,now(),$6::jsonb)`,
      [args.tenantKey, args.datasetVersion, calculationRunId, opportunityId, sha256(JSON.stringify(opportunity)), JSON.stringify({ evidence_row_count: evidenceRows.length })],
    );
    for (const [index, evidenceRow] of evidenceRows.entries()) {
      await client.query(
        `INSERT INTO source.opportunity_evidence (
           tenant_key, dataset_version, opportunity_id, evidence_class,
           source_system, source_table, source_record_id, source_file_report,
           review_state, evidence_status, amount_usd, quantity, unit, payload
         )
         VALUES ($1,$2,$3,$4,$5,'source.cloud_consumption_adapter_row',$6,$7,'system_evidenced','EVIDENCE_AVAILABLE',NULL,1,'row',$8::jsonb)`,
        [args.tenantKey, args.datasetVersion, opportunityId, value(opportunity, "evidence_family"), SOURCE_SYSTEM, evidenceRow, value(opportunity, "source_file_id"), JSON.stringify({ evidence_row_index: index + 1 })],
      );
      await client.query(
        `INSERT INTO source.calculation_input (
           tenant_key, dataset_version, calculation_run_id, input_key,
           source_table, source_record_id, value_numeric, value_text, unit,
           inclusion_state, inclusion_reason, payload
         )
         VALUES ($1,$2,$3,$4,'source.cloud_consumption_adapter_row',$5,NULL,$5,'row','included','Cloud package opportunity cites this evidence row.','{}'::jsonb)`,
        [args.tenantKey, args.datasetVersion, calculationRunId, `evidence_row_${index + 1}`, evidenceRow],
      );
    }
    await client.query(
      `INSERT INTO source.calculation_output (
         tenant_key, dataset_version, calculation_run_id, output_key,
         amount_usd, quantity, unit, payload
       )
       VALUES
         ($1,$2,$3,'calculated_amount_usd',$4,NULL,'USD','{}'::jsonb),
         ($1,$2,$3,'evidence_row_count',NULL,$5,'row','{}'::jsonb)`,
      [args.tenantKey, args.datasetVersion, calculationRunId, amount, evidenceRows.length],
    );
    await client.query(
      `INSERT INTO source.opportunity_valuation (
         tenant_key, dataset_version, opportunity_id, valuation_type,
         amount_usd, valuation_state, basis, source_run_id, effective_date, payload
       )
       VALUES ($1,$2,$3,'potential',$4,'candidate_quantified',$5,$6,CURRENT_DATE,$7::jsonb)`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        amount,
        opportunityValuationBasis(opportunity),
        calculationRunId,
        JSON.stringify({ finance_confirmation_state: "not_confirmed", stage: opportunityStage(opportunity) }),
      ],
    );
    await client.query(
      `INSERT INTO source.evidence_requirement (
         tenant_key, dataset_version, requirement_id, evidence_class,
         requirement_text, grain, minimum_period_months, owner_role, payload
       )
       VALUES ($1,$2,$3,'finance_confirmation','Finance confirmation is required before this candidate amount becomes realized value.','contract_opportunity',1,$4,'{}'::jsonb)`,
      [args.tenantKey, args.datasetVersion, requirementId, value(contract, "business_owner")],
    );
    await client.query(
      `INSERT INTO source.opportunity_requirement_status (
         tenant_key, dataset_version, opportunity_id, requirement_id,
         status, status_detail, owner, payload
       )
       VALUES ($1,$2,$3,$4,'workflow_required',$5,$6,'{}'::jsonb)`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        requirementId,
        opportunityRequirementStatusDetail(opportunity),
        value(contract, "business_owner"),
      ],
    );
    await client.query(
      `INSERT INTO source.evidence_request (
         tenant_key, dataset_version, evidence_request_id, opportunity_id,
         requirement_id, request_text, owner, request_state, payload
       )
       VALUES ($1,$2,$3,$4,$5,'Confirm finance owner acceptance before claiming realized savings.',$6,'open','{}'::jsonb)`,
      [args.tenantKey, args.datasetVersion, `cloud-consumption:${opportunityId}:finance-confirmation-request`, opportunityId, requirementId, value(contract, "business_owner")],
    );
  }
}

function expectedLayer3(files, rows, pageRows = []) {
  const opportunities = files["optimization_opportunities.csv"];
  const evidenceInputCount = opportunities.reduce((sum, row) => sum + value(row, "evidence_rows").split(";").map((item) => item.trim()).filter(Boolean).length, 0);
  const canonicalFactCount =
    files["cloud_contract_register.csv"].length * CONTRACT_CONTEXT_FACTS.length +
    files["monthly_spend.csv"].length +
    files["cloud_service_usage_monthly.csv"].length +
    files["cloud_commitment_coverage_monthly.csv"].length * 2 +
    files["cloud_resource_inventory.csv"].length +
    files["cloud_tag_quality.csv"].length + pageRows.length;
  return {
    source_record_snapshot: rows.length,
    source_vendor: uniqueRows(files["cloud_contract_register.csv"], "vendor_ref").length,
    source_contract: files["cloud_contract_register.csv"].length,
    source_contract_term: files["contract_clauses.csv"].length,
    source_contract_scope: files["cmdb_application_scope.csv"].length,
    source_contract_consumption_observation: files["monthly_spend.csv"].length,
    source_cloud_account: files["cloud_accounts.csv"].length,
    source_cloud_service_usage_observation: files["cloud_service_usage_monthly.csv"].length,
    source_cloud_commitment: files["cloud_commitments.csv"].length,
    source_cloud_commitment_coverage_observation: files["cloud_commitment_coverage_monthly.csv"].length,
    source_cloud_resource_inventory: files["cloud_resource_inventory.csv"].length,
    source_cloud_tag_quality_observation: files["cloud_tag_quality.csv"].length,
    source_cloud_ap_invoice_reconciliation: files["cloud_ap_invoice_reconciliation.csv"].length,
    source_optimization_opportunity: opportunities.length,
    source_optimization_baseline: files["cloud_contract_register.csv"].length,
    source_optimization_case: files["cloud_contract_register.csv"].length,
    source_case_opportunity: opportunities.length,
    source_opportunity_evidence: evidenceInputCount,
    source_calculation_run: opportunities.length,
    source_calculation_input: evidenceInputCount,
    source_calculation_output: opportunities.length * 2,
    source_opportunity_valuation: opportunities.length,
    source_evidence_requirement: opportunities.length,
    source_opportunity_requirement_status: opportunities.length,
    source_evidence_request: opportunities.length,
    source_canonical_fact_assertion: canonicalFactCount,
  };
}

function expectedLayer4(files) {
  const opportunities = files["optimization_opportunities.csv"];
  return {
    source_contract_360_cloud_contracts: files["cloud_contract_register.csv"].length,
    source_contract_360_actual_spend_ready: files["cloud_contract_register.csv"].length,
    source_vendor_contract_portfolio_cloud_vendors: uniqueRows(files["cloud_contract_register.csv"], "vendor_ref").length,
    consumption_sourcing_spend_monthly_v1_cloud_rows: files["monthly_spend.csv"].length,
    consumption_sourcing_opportunity_v1_cloud_rows: opportunities.length,
    consumption_sourcing_opportunity_v1_finance_required_rows: opportunities.filter(
      (row) => canonicalOpportunityValueType(row) !== "control_action" && requiredNumber(row, "annual_value_usd") > 0,
    ).length,
    consumption_sourcing_opportunity_v1_control_required_rows: opportunities.filter(
      (row) => canonicalOpportunityValueType(row) === "control_action",
    ).length,
    consumption_sourcing_cloud_usage_monthly_v1: files["cloud_service_usage_monthly.csv"].length,
    consumption_sourcing_cloud_commitment_coverage_v1: files["cloud_commitment_coverage_monthly.csv"].length,
    consumption_sourcing_cloud_resource_inventory_v1: files["cloud_resource_inventory.csv"].length,
    consumption_sourcing_cloud_tag_quality_v1: files["cloud_tag_quality.csv"].length,
    consumption_sourcing_cloud_ap_invoice_reconciliation_v1: files["cloud_ap_invoice_reconciliation.csv"].length,
  };
}

async function applyLayer3(client, args, files, rows, expectedL2, pageRows = []) {
  await assertTables(client, [...REQUIRED_LAYER2_TABLES, ...REQUIRED_LAYER3_TABLES]);
  assertCounts(expectedL2, await layer2Readback(client, args), "Layer 2");
  await insertSnapshots(client, args, rows);
  await upsertVendors(client, args, files["cloud_contract_register.csv"]);
  await upsertContracts(client, args, files["cloud_contract_register.csv"]);
  await upsertContractTerms(client, args, files["contract_clauses.csv"]);
  await upsertContractScope(client, args, files["cmdb_application_scope.csv"]);
  await upsertSpend(client, args, files["monthly_spend.csv"]);
  await upsertCloudTables(client, args, files);
  await upsertCloudCanonicalFacts(client, args, files);
  await upsertCloudPageTextFacts(client, args, pageRows);
  await upsertOptimizationSpine(client, args, files);
  return layer3Readback(client, args, files);
}

async function layer3Readback(client, args, files) {
  const contractIds = files["cloud_contract_register.csv"].map((row) => value(row, "contract_id"));
  const vendorIds = uniqueRows(files["cloud_contract_register.csv"], "vendor_ref").map((row) => value(row, "vendor_ref"));
  const opportunityIds = files["optimization_opportunities.csv"].map((row) => value(row, "opportunity_id"));
  const calculationRunIds = opportunityIds.map((opportunityId) => `cloud-consumption:${opportunityId}:calculation`);
  const caseIds = contractIds.map((contractId) => `cloud-consumption:${contractId}:case`);
  const result = await client.query(
    `SELECT
       (SELECT count(*)::text FROM source.source_record_snapshot WHERE tenant_key = $1 AND dataset_version = $2) AS source_record_snapshot,
       (SELECT count(*)::text FROM source.vendor WHERE tenant_key = $1 AND vendor_id = ANY($3::text[]) AND load_run_id = $7) AS source_vendor,
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = $1 AND contract_id = ANY($4::text[]) AND load_run_id = $7) AS source_contract,
       (SELECT count(*)::text FROM source.contract_term WHERE tenant_key = $1 AND contract_id = ANY($4::text[]) AND load_run_id = $7) AS source_contract_term,
       (SELECT count(*)::text FROM source.contract_scope WHERE tenant_key = $1 AND contract_id = ANY($4::text[]) AND load_run_id = $7) AS source_contract_scope,
       (SELECT count(*)::text FROM source.contract_consumption_observation WHERE tenant_key = $1 AND contract_id = ANY($4::text[]) AND load_run_id = $7) AS source_contract_consumption_observation,
       (SELECT count(*)::text FROM source.cloud_account WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_account,
       (SELECT count(*)::text FROM source.cloud_service_usage_observation WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_service_usage_observation,
       (SELECT count(*)::text FROM source.cloud_commitment WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_commitment,
       (SELECT count(*)::text FROM source.cloud_commitment_coverage_observation WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_commitment_coverage_observation,
       (SELECT count(*)::text FROM source.cloud_resource_inventory WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_resource_inventory,
       (SELECT count(*)::text FROM source.cloud_tag_quality_observation WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_tag_quality_observation,
       (SELECT count(*)::text FROM source.cloud_ap_invoice_reconciliation WHERE tenant_key = $1 AND dataset_version = $2 AND load_run_id = $7) AS source_cloud_ap_invoice_reconciliation,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_optimization_opportunity,
       (SELECT count(*)::text FROM source.optimization_baseline WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($4::text[])) AS source_optimization_baseline,
       (SELECT count(*)::text FROM source.optimization_case WHERE tenant_key = $1 AND dataset_version = $2 AND optimization_case_id = ANY($6::text[])) AS source_optimization_case,
       (SELECT count(*)::text FROM source.case_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_case_opportunity,
       (SELECT count(*)::text FROM source.opportunity_evidence WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_opportunity_evidence,
       (SELECT count(*)::text FROM source.calculation_run WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_calculation_run,
       (SELECT count(*)::text FROM source.calculation_input WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($8::text[])) AS source_calculation_input,
       (SELECT count(*)::text FROM source.calculation_output WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($8::text[])) AS source_calculation_output,
       (SELECT count(*)::text FROM source.opportunity_valuation WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_opportunity_valuation,
       (SELECT count(*)::text FROM source.evidence_requirement WHERE tenant_key = $1 AND dataset_version = $2 AND requirement_id LIKE 'cloud-consumption:%') AS source_evidence_requirement,
       (SELECT count(*)::text FROM source.opportunity_requirement_status WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_opportunity_requirement_status,
       (SELECT count(*)::text FROM source.evidence_request WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($5::text[])) AS source_evidence_request,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($4::text[])) AS source_canonical_fact_assertion`,
    [args.tenantKey, args.datasetVersion, vendorIds, contractIds, opportunityIds, caseIds, args.layer3LoadRunId, calculationRunIds],
  );
  return Object.fromEntries(Object.entries(result.rows[0] ?? {}).map(([key, count]) => [key, Number(count)]));
}

async function layer4Readback(client, args, files) {
  const contractIds = files["cloud_contract_register.csv"].map((row) => value(row, "contract_id"));
  const opportunityIds = files["optimization_opportunities.csv"].map((row) => value(row, "opportunity_id"));
  const result = await client.query(
    `SELECT
       (SELECT count(*)::text
          FROM source.contract_360
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS source_contract_360_cloud_contracts,
       (SELECT count(*)::text
          FROM source.contract_360
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])
           AND actual_annual_spend IS NOT NULL) AS source_contract_360_actual_spend_ready,
       (SELECT count(*)::text
          FROM source.vendor_contract_portfolio
         WHERE tenant_key = $1
           AND contract_refs && $2::text[]) AS source_vendor_contract_portfolio_cloud_vendors,
       (SELECT count(*)::text
          FROM consumption.sourcing_spend_monthly_v1
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS consumption_sourcing_spend_monthly_v1_cloud_rows,
       (SELECT count(*)::text
          FROM consumption.sourcing_opportunity_v1
         WHERE tenant_key = $1
           AND opportunity_id = ANY($3::text[])) AS consumption_sourcing_opportunity_v1_cloud_rows,
       (SELECT count(*)::text
          FROM consumption.sourcing_opportunity_v1
         WHERE tenant_key = $1
           AND opportunity_id = ANY($3::text[])
           AND readiness_state = 'finance_confirmation_required') AS consumption_sourcing_opportunity_v1_finance_required_rows,
       (SELECT count(*)::text
          FROM consumption.sourcing_opportunity_v1
         WHERE tenant_key = $1
           AND opportunity_id = ANY($3::text[])
           AND readiness_state = 'control_required') AS consumption_sourcing_opportunity_v1_control_required_rows,
       (SELECT count(*)::text
          FROM consumption.sourcing_cloud_usage_monthly_v1
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS consumption_sourcing_cloud_usage_monthly_v1,
       (SELECT count(*)::text
          FROM consumption.sourcing_cloud_commitment_coverage_v1
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS consumption_sourcing_cloud_commitment_coverage_v1,
       (SELECT count(*)::text
          FROM consumption.sourcing_cloud_resource_inventory_v1
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS consumption_sourcing_cloud_resource_inventory_v1,
       (SELECT count(*)::text
          FROM consumption.sourcing_cloud_tag_quality_v1
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS consumption_sourcing_cloud_tag_quality_v1,
       (SELECT count(*)::text
          FROM consumption.sourcing_cloud_ap_invoice_reconciliation_v1
         WHERE tenant_key = $1
           AND contract_id = ANY($2::text[])) AS consumption_sourcing_cloud_ap_invoice_reconciliation_v1`,
    [args.tenantKey, contractIds, opportunityIds],
  );
  return Object.fromEntries(Object.entries(result.rows[0] ?? {}).map(([key, count]) => [key, Number(count)]));
}

async function activateLayer4Overlay(client, args) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.l4_cube_active_load_run_overlay (
      tenant_key TEXT NOT NULL,
      load_run_id TEXT NOT NULL,
      dataset_version TEXT NOT NULL,
      input_source_version TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      overlay_role TEXT NOT NULL,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      PRIMARY KEY (tenant_key, load_run_id)
    )`);

  await client.query(
    `INSERT INTO source.l4_cube_active_load_run_overlay
       (tenant_key, load_run_id, dataset_version, input_source_version, idempotency_key, overlay_role, raw_payload)
     VALUES ($1, $2, $3, $3, $4, 'cloud_consumption_package', $5::jsonb)
     ON CONFLICT (tenant_key, load_run_id)
     DO UPDATE SET dataset_version = EXCLUDED.dataset_version,
                   input_source_version = EXCLUDED.input_source_version,
                   idempotency_key = EXCLUDED.idempotency_key,
                   overlay_role = EXCLUDED.overlay_role,
                   activated_at = now(),
                   raw_payload = EXCLUDED.raw_payload`,
    [
      args.tenantKey,
      args.loadRunId,
      args.datasetVersion,
      args.idempotencyKey,
      JSON.stringify({
        projection: "source-cloud-consumption-layer4-overlay",
        synthetic_policy: SYNTHETIC_POLICY,
      }),
    ],
  );
}

async function setTenant(client, tenantKey) {
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
}

async function main() {
  const args = parseArgs();
  const sourceFiles = readSourceFiles(args.packageDir);
  const companionSourceFiles = {
    contract_page_text: readOptionalSourceFile(args.packageDir, "contract_page_text.csv"),
  };
  const docs = syntheticDocs(args.packageDir);
  const rows = adapterRows(sourceFiles);
  const packageHash = sourcePackageHash(sourceFiles, docs, companionSourceFiles);
  const qualityGate = qualifyPackage(args, sourceFiles, docs);
  const expectedL2 = adapterCountByName(rows);
  const expectedL3 = expectedLayer3(sourceFiles, rows, companionSourceFiles.contract_page_text);
  const expectedL4 = expectedLayer4(sourceFiles);
  const summary = {
    event: "source_cloud_consumption_package_started",
    mode: args.mode,
    tenant_key: args.tenantKey,
    dataset_version: args.datasetVersion,
    load_run_id: args.loadRunId,
    idempotency_key: args.idempotencyKey,
    package_dir: args.packageDir,
    package_sha256: packageHash,
    synthetic_evidence_documents: docs.length,
    companion_source_rows: Object.fromEntries(
      Object.entries(companionSourceFiles).map(([fileName, fileRows]) => [fileName, fileRows.length]),
    ),
    layer2_expected_rows: rows.length,
    layer2_expected_by_adapter: expectedL2,
    layer3_expected_readback: expectedL3,
    layer4_expected_readback: expectedL4,
    quality_gate: qualityGate,
  };
  writeJson(path.join(args.proofDir, "summary.json"), summary);
  if (qualityGate.status !== "PASS") throw new Error(`Quality gate failed: ${qualityGate.failures.join("; ")}`);

  if (args.mode === "plan") {
    console.log(JSON.stringify({ ...summary, event: "source_cloud_consumption_package_planned" }, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(databaseUrl(), "source-cloud-consumption-package"));
  await client.connect();
  try {
    await setTenant(client, args.tenantKey);
    if (args.mode === "apply-layer2") {
      requireApplyApproval(args);
      await client.query("BEGIN");
      await applyLayer2(client, args, rows, packageHash, qualityGate);
      await client.query("COMMIT");
      const readback = await layer2Readback(client, args);
      assertCounts(expectedL2, readback, "Layer 2");
      summary.event = "source_cloud_consumption_package_layer2_applied";
      summary.layer2_readback = readback;
    } else if (args.mode === "apply-layer3") {
      requireApplyApproval(args);
      await client.query("BEGIN");
      const readback = await applyLayer3(client, args, sourceFiles, rows, expectedL2, companionSourceFiles.contract_page_text);
      assertCounts(expectedL3, readback, "Layer 3");
      await writeRunStatus(client, args, packageHash, "completed", rows.length, qualityGate, readback);
      await client.query("COMMIT");
      summary.event = "source_cloud_consumption_package_layer3_applied";
      summary.layer2_readback = await layer2Readback(client, args);
      summary.layer3_readback = readback;
    } else if (args.mode === "verify") {
      const layer2 = await layer2Readback(client, args);
      const layer3 = await layer3Readback(client, args, sourceFiles);
      assertCounts(expectedL2, layer2, "Layer 2");
      assertCounts(expectedL3, layer3, "Layer 3");
      summary.event = "source_cloud_consumption_package_layer23_verified";
      summary.layer2_readback = layer2;
      summary.layer3_readback = layer3;
    } else if (args.mode === "apply-layer4") {
      requireApplyApproval(args);
      const layer3 = await layer3Readback(client, args, sourceFiles);
      assertCounts(expectedL3, layer3, "Layer 3");
      await client.query("BEGIN");
      await activateLayer4Overlay(client, args);
      const layer4 = await layer4Readback(client, args, sourceFiles);
      assertCounts(expectedL4, layer4, "Layer 4");
      await client.query("COMMIT");
      summary.event = "source_cloud_consumption_package_layer4_applied";
      summary.layer3_readback = layer3;
      summary.layer4_readback = layer4;
    } else if (args.mode === "verify-layer4") {
      const layer4 = await layer4Readback(client, args, sourceFiles);
      assertCounts(expectedL4, layer4, "Layer 4");
      summary.event = "source_cloud_consumption_package_layer4_verified";
      summary.layer4_readback = layer4;
    }
    writeJson(path.join(args.proofDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    summary.event = "source_cloud_consumption_package_failed";
    summary.error = error instanceof Error ? error.message : String(error);
    writeJson(path.join(args.proofDir, "summary.json"), summary);
    throw error;
  } finally {
    await client.end();
  }
  if (shouldEmitProofBundle()) emitProofBundle(args.proofDir);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

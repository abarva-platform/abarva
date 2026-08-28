import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { Client } from "pg";

import {
  adaptContractDepthPackage,
  type ContractDepthAdapterOutput,
  type ContractDepthSourceFileInput,
} from "../../src/lib/source/contract-depth-package/adapter";
import { projectContractDepthPackage } from "../../src/lib/source/contract-depth-package/projection";
import type { CsvRecord } from "../../src/lib/source/contract-depth-package/projection";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

type Mode = "plan" | "apply-layer2" | "apply-layer3" | "verify";

interface Args {
  readonly mode: Mode;
  readonly packageDir: string;
  readonly tenantKey: string;
  readonly datasetVersion: string;
  readonly idempotencyKey: string;
  readonly loadRunId: string;
  readonly proofDir: string;
  readonly applyApproved: boolean;
}

interface Layer2Row {
  readonly adapterName: string;
  readonly sourceFileName: string;
  readonly sourceRowId: string;
  readonly sourceRowNumber: number | null;
  readonly sourceHash: string;
  readonly payload: CsvRecord;
}

const DEFAULT_DATASET_VERSION = "meridian-contract-depth-v1-20260828";
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_PACKAGE_DIR = "datasets/source/contract-depth/meridian-contract-depth-v1-20260828";
const SOURCE_SYSTEM = "source_contract_depth_package_loader";

const ADAPTER_SPECS = Object.freeze([
  {
    key: "contractRegisterAdapter",
    adapterName: "contract_register_adapter",
    sourceFileName: "contracts.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "contractClauseAdapter",
    adapterName: "contract_clause_adapter",
    sourceFileName: "contract_clauses.csv",
    rowIdField: "extraction_id",
  },
  {
    key: "cmdbApplicationAdapter",
    adapterName: "cmdb_application_adapter",
    sourceFileName: "cmdb_applications.csv",
    rowIdField: "application_ref",
  },
  {
    key: "contractScopeAdapter",
    adapterName: "contract_scope_adapter",
    sourceFileName: "cmdb_application_scope.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "spendAdapter",
    adapterName: "contract_consumption_adapter",
    sourceFileName: "monthly_spend.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "usageAdapter",
    adapterName: "usage_entitlement_adapter",
    sourceFileName: "saas_usage.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "ticketVolumeAdapter",
    adapterName: "ticket_volumetrics_adapter",
    sourceFileName: "ticket_volumetrics.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "performanceAdapter",
    adapterName: "contract_performance_adapter",
    sourceFileName: "sla_performance.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "optimizationAdapter",
    adapterName: "optimization_opportunity_adapter",
    sourceFileName: "optimization_opportunities.csv",
    rowIdField: "opportunity_id",
  },
  {
    key: "evidenceDocumentAdapter",
    adapterName: "evidence_document_adapter",
    sourceFileName: "evidence_manifest.csv",
    rowIdField: "source_file_id",
  },
] as const);

const REQUIRED_LAYER2_TABLES = Object.freeze([
  "contract_depth_package_load_run",
  "contract_depth_adapter_row",
]);

const REQUIRED_LAYER3_TABLES = Object.freeze([
  "vendor",
  "contract",
  "contract_term",
  "contract_scope",
  "contract_consumption_observation",
  "contract_performance_observation",
  "contract_service_credit",
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
]);

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseArgs(): Args {
  const mode = (argValue("mode") ?? process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_MODE ?? "plan") as Mode;
  if (!["plan", "apply-layer2", "apply-layer3", "verify"].includes(mode)) {
    throw new Error(`Unsupported SOURCE_CONTRACT_DEPTH_PACKAGE_MODE: ${mode}`);
  }
  const datasetVersion =
    argValue("dataset-version") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_DATASET_VERSION ??
    DEFAULT_DATASET_VERSION;
  const tenantKey =
    argValue("tenant-key") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_TENANT_KEY ??
    DEFAULT_TENANT_KEY;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const loadRunId =
    argValue("load-run-id") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_LOAD_RUN_ID ??
    `source-contract-depth-package-${datasetVersion}-${stamp}`;
  return {
    mode,
    packageDir: path.resolve(
      process.cwd(),
      argValue("package-dir") ??
        process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_DIR ??
        DEFAULT_PACKAGE_DIR,
    ),
    tenantKey,
    datasetVersion,
    idempotencyKey:
      argValue("idempotency-key") ??
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_IDEMPOTENCY_KEY ??
      `${tenantKey}:${datasetVersion}:layer2-layer3`,
    loadRunId,
    proofDir: path.resolve(
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_PROOF_DIR ??
        `/tmp/source-contract-depth-package-${mode}-${stamp}`,
    ),
    applyApproved:
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_APPLY_APPROVED === "true" ||
      process.argv.includes("--apply-approved"),
  };
}

function databaseUrl(): string {
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

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
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

function readCsv(filePath: string): CsvRecord[] {
  const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = parsed[0] ?? [];
  return parsed.slice(1).map((values) => {
    const row: CsvRecord = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function readSourceFiles(packageDir: string): ContractDepthSourceFileInput {
  const sourceDir = path.join(packageDir, "source-files");
  return {
    contracts: readCsv(path.join(sourceDir, "contracts.csv")),
    applications: readCsv(path.join(sourceDir, "cmdb_applications.csv")),
    applicationScope: readCsv(path.join(sourceDir, "cmdb_application_scope.csv")),
    monthlySpend: readCsv(path.join(sourceDir, "monthly_spend.csv")),
    saasUsage: readCsv(path.join(sourceDir, "saas_usage.csv")),
    slaPerformance: readCsv(path.join(sourceDir, "sla_performance.csv")),
    ticketVolumetrics: readCsv(path.join(sourceDir, "ticket_volumetrics.csv")),
    contractClauses: readCsv(path.join(sourceDir, "contract_clauses.csv")),
    evidenceManifest: readCsv(path.join(sourceDir, "evidence_manifest.csv")),
    optimizationOpportunities: readCsv(path.join(sourceDir, "optimization_opportunities.csv")),
  };
}

function sourcePackageHash(sourceFiles: ContractDepthSourceFileInput): string {
  return sha256(JSON.stringify(sourceFiles));
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function numberValue(row: CsvRecord, key: string): number | null {
  const raw = (row[key] ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw.replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredNumber(row: CsvRecord, key: string): number {
  const parsed = numberValue(row, key);
  if (parsed === null) throw new Error(`Missing numeric field ${key} on ${row.source_row_id ?? row.contract_id ?? row.opportunity_id}`);
  return parsed;
}

function stringValue(row: CsvRecord, key: string): string {
  return row[key] ?? "";
}

function boolValue(row: CsvRecord, key: string): boolean | null {
  const raw = stringValue(row, key).trim().toLowerCase();
  if (!raw) return null;
  return ["true", "1", "yes", "y"].includes(raw);
}

function pctValue(row: CsvRecord, key: string): number | null {
  const parsed = numberValue(row, key);
  if (parsed === null) return null;
  return parsed <= 1 ? parsed * 100 : parsed;
}

function monthEnd(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

function periodStart(row: CsvRecord): string {
  const explicitStart = stringValue(row, "period_start");
  if (explicitStart) return explicitStart;
  const month = stringValue(row, "month");
  return month ? `${month}-01` : "";
}

function periodEnd(row: CsvRecord): string {
  const explicitEnd = stringValue(row, "period_end");
  if (explicitEnd) return explicitEnd;
  const month = stringValue(row, "month");
  return month ? monthEnd(month) : "";
}

function groupBy<T extends CsvRecord>(rows: readonly T[], key: string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const groupKey = stringValue(row, key);
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), row]);
  }
  return grouped;
}

function uniqueRows<T extends CsvRecord>(rows: readonly T[], key: string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const row of rows) {
    const value = stringValue(row, key);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    output.push(row);
  }
  return output;
}

function adapterRows(adapted: ContractDepthAdapterOutput): Layer2Row[] {
  const output: Layer2Row[] = [];
  for (const spec of ADAPTER_SPECS) {
    const rows = adapted[spec.key] as readonly CsvRecord[];
    for (const row of rows) {
      const sourceRowId = stringValue(row, spec.rowIdField);
      if (!sourceRowId) {
        throw new Error(`${spec.adapterName} row is missing ${spec.rowIdField}`);
      }
      output.push({
        adapterName: spec.adapterName,
        sourceFileName: spec.sourceFileName,
        sourceRowId,
        sourceRowNumber: Number(row.adapter_row_number) || null,
        sourceHash: sha256(JSON.stringify(row)),
        payload: row,
      });
    }
  }
  return output;
}

function adapterCountByName(rows: readonly Layer2Row[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.adapterName] = (acc[row.adapterName] ?? 0) + 1;
    return acc;
  }, {});
}

function requireApplyApproval(args: Args): void {
  if (!args.applyApproved) {
    throw new Error(
      "Refusing to mutate Azure without SOURCE_CONTRACT_DEPTH_PACKAGE_APPLY_APPROVED=true.",
    );
  }
}

async function assertTables(client: Client, tableNames: readonly string[]): Promise<void> {
  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'source'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [tableNames],
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = tableNames.filter((tableName) => !found.has(tableName));
  if (missing.length) {
    throw new Error(`Missing Source tables: ${missing.join(", ")}`);
  }
}

async function writeRunStatus(
  client: Client,
  args: Args,
  packageHash: string,
  status: "running" | "completed" | "failed",
  layer2RowCount: number,
  qualityGate: unknown,
  layer3Summary: unknown = {},
): Promise<void> {
  await client.query(
    `INSERT INTO source.contract_depth_package_load_run (
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
                   status = EXCLUDED.status,
                   mode = EXCLUDED.mode,
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

async function applyLayer2(
  client: Client,
  args: Args,
  rows: readonly Layer2Row[],
  packageHash: string,
  qualityGate: ContractDepthAdapterOutput["qualityGate"],
): Promise<void> {
  await assertTables(client, REQUIRED_LAYER2_TABLES);
  await writeRunStatus(client, args, packageHash, "running", 0, qualityGate);
  for (const row of rows) {
    await client.query(
      `INSERT INTO source.contract_depth_adapter_row (
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
          adapter_version: stringValue(row.payload, "adapter_version"),
        }),
        args.loadRunId,
      ],
    );
  }
  await writeRunStatus(client, args, packageHash, "completed", rows.length, qualityGate);
}

async function layer2Readback(client: Client, args: Args): Promise<Record<string, number>> {
  const result = await client.query<{ adapter_name: string; count: string }>(
    `SELECT adapter_name, count(*)::text AS count
       FROM source.contract_depth_adapter_row
      WHERE tenant_key = $1
        AND dataset_version = $2
      GROUP BY adapter_name
      ORDER BY adapter_name`,
    [args.tenantKey, args.datasetVersion],
  );
  return Object.fromEntries(result.rows.map((row) => [row.adapter_name, Number(row.count)]));
}

function assertLayer2Matches(expected: Record<string, number>, actual: Record<string, number>): void {
  const failures = Object.entries(expected)
    .filter(([name, count]) => actual[name] !== count)
    .map(([name, count]) => `${name}: expected ${count}, read ${actual[name] ?? 0}`);
  if (failures.length) {
    throw new Error(`Layer 3 blocked because Layer 2 readback does not match package quality gate: ${failures.join("; ")}`);
  }
}

async function insertSnapshots(
  client: Client,
  args: Args,
  rows: readonly Layer2Row[],
): Promise<void> {
  for (const row of rows) {
    const payload = row.payload;
    const snapshotId = `${row.adapterName}:${row.sourceRowId}`;
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
        snapshotId,
        SOURCE_SYSTEM,
        `source.contract_depth_adapter_row.${row.adapterName}`,
        row.sourceRowId,
        row.sourceHash,
        stringValue(payload, "contract_id"),
        stringValue(payload, "vendor_ref"),
        periodStart(payload),
        periodEnd(payload),
        JSON.stringify(payload),
      ],
    );
  }
}

async function upsertVendors(client: Client, args: Args, contracts: readonly CsvRecord[]): Promise<void> {
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
       DO NOTHING`,
      [
        args.tenantKey,
        stringValue(contract, "vendor_ref"),
        stringValue(contract, "vendor_name"),
        stringValue(contract, "category"),
        stringValue(contract, "business_owner"),
        SOURCE_SYSTEM,
        stringValue(contract, "source_row_id"),
        numberValue(contract, "source_confidence") ?? 0.86,
        `source_contract_depth_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify({ dataset_version: args.datasetVersion, synthetic_policy: "synthetic_demo_only_not_client_truth" }),
      ],
    );
  }
}

async function upsertContracts(client: Client, args: Args, contracts: readonly CsvRecord[]): Promise<void> {
  for (const contract of contracts) {
    await client.query(
      `INSERT INTO source.contract (
         tenant_key, contract_id, vendor_id, contract_name, agreement_type,
         effective_date, expiration_date, notice_deadline, renewal_type,
         auto_renew, annual_value, total_committed_value, currency,
         benchmark_rights, termination_rights, renewal_owner_role,
         document_file_id, source_system, source_record_id, as_of_date,
         confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, $5, NULLIF($6, '')::date, NULLIF($7, '')::date,
         NULLIF($8, '')::date, 'review_required', $9, $10, $11, 'USD',
         $12, $13, $14, $15, $16, $17, CURRENT_DATE, $18, 'reviewed',
         $19, $20, $21::jsonb
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
        stringValue(contract, "contract_id"),
        stringValue(contract, "vendor_ref"),
        stringValue(contract, "contract_name"),
        stringValue(contract, "category"),
        stringValue(contract, "start_date"),
        stringValue(contract, "end_date"),
        stringValue(contract, "renewal_notice_date"),
        boolValue(contract, "auto_renew"),
        numberValue(contract, "annual_value_usd"),
        numberValue(contract, "committed_annual_spend_usd"),
        stringValue(contract, "benchmarking_clause"),
        stringValue(contract, "termination_rights"),
        stringValue(contract, "business_owner"),
        stringValue(contract, "source_file_id"),
        SOURCE_SYSTEM,
        stringValue(contract, "source_row_id"),
        numberValue(contract, "source_confidence") ?? 0.86,
        `source_contract_depth_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify({
          ...contract,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
          alternatives_available: null,
        }),
      ],
    );
  }
}

async function upsertContractTerms(client: Client, args: Args, clauses: readonly CsvRecord[]): Promise<void> {
  for (const clause of clauses) {
    await client.query(
      `INSERT INTO source.contract_term (
         tenant_key, term_id, contract_id, term_type, term_name, term_value,
         value_num, effective_date, page_ref, clause_ref, source_system,
         source_record_id, as_of_date, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, $2,
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
        stringValue(clause, "extraction_id"),
        stringValue(clause, "contract_id"),
        stringValue(clause, "evidence_class") || stringValue(clause, "concept_ref"),
        stringValue(clause, "concept_ref"),
        stringValue(clause, "value_text"),
        numberValue(clause, "value_num"),
        stringValue(clause, "source_page"),
        stringValue(clause, "source_section"),
        SOURCE_SYSTEM,
        numberValue(clause, "confidence") ?? 0.82,
        `source_contract_depth_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(clause),
      ],
    );
  }
}

async function upsertContractScope(client: Client, args: Args, scopeRows: readonly CsvRecord[]): Promise<void> {
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
                     quality_state = EXCLUDED.quality_state,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        stringValue(row, "source_row_id"),
        stringValue(row, "contract_id"),
        stringValue(row, "application_ref"),
        stringValue(row, "application_name"),
        stringValue(row, "scope_role"),
        stringValue(row, "relationship_method"),
        numberValue(row, "relationship_confidence") ?? 0.8,
        stringValue(row, "criticality"),
        SOURCE_SYSTEM,
        `source_contract_depth_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(row),
      ],
    );
  }
}

async function upsertSpend(client: Client, args: Args, spendRows: readonly CsvRecord[]): Promise<void> {
  for (const row of spendRows) {
    await client.query(
      `INSERT INTO source.contract_consumption_observation (
         tenant_key, observation_id, contract_id, business_unit, cost_center,
         period_start, period_end, committed_amount, invoice_amount, paid_amount,
         actual_spend, currency, source_system, source_record_id, as_of_date,
         confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, $11, $12,
         $13, $2, CURRENT_DATE, 0.9, 'reviewed', $14, $15, $16::jsonb
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
        stringValue(row, "source_row_id"),
        stringValue(row, "contract_id"),
        "Technology",
        stringValue(row, "vendor_ref"),
        stringValue(row, "period_start"),
        stringValue(row, "period_end"),
        numberValue(row, "committed_base_amount_usd"),
        numberValue(row, "invoice_amount_usd"),
        numberValue(row, "paid_amount_usd"),
        numberValue(row, "actual_spend_usd"),
        stringValue(row, "currency") || "USD",
        SOURCE_SYSTEM,
        `source_contract_depth_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(row),
      ],
    );
  }
}

async function upsertPerformance(client: Client, args: Args, performanceRows: readonly CsvRecord[]): Promise<void> {
  for (const row of performanceRows) {
    const creditOwed = numberValue(row, "credit_owed_usd") ?? 0;
    const creditClaimed = boolValue(row, "credit_claimed") ? creditOwed : 0;
    const actualPct = pctValue(row, "actual_result_pct");
    const thresholdPct = pctValue(row, "committed_threshold_pct");
    await client.query(
      `INSERT INTO source.contract_performance_observation (
         tenant_key, observation_id, contract_id, service_id, metric_name,
         period_start, period_end, contracted_target, actual_value, value_num,
         unit, breach_count, credit_eligible, credit_calculated,
         credit_claimed, credit_recovered, currency, source_system,
         source_record_id, as_of_date, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, '%',
         $11, $12, $13, $14, $15, 'USD', $16, $2, CURRENT_DATE, 0.9,
         'reviewed', $17, $18, $19::jsonb
       )
       ON CONFLICT (tenant_key, observation_id)
       DO UPDATE SET contracted_target = EXCLUDED.contracted_target,
                     actual_value = EXCLUDED.actual_value,
                     value_num = EXCLUDED.value_num,
                     breach_count = EXCLUDED.breach_count,
                     credit_eligible = EXCLUDED.credit_eligible,
                     credit_calculated = EXCLUDED.credit_calculated,
                     credit_claimed = EXCLUDED.credit_claimed,
                     credit_recovered = EXCLUDED.credit_recovered,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        stringValue(row, "source_row_id"),
        stringValue(row, "contract_id"),
        stringValue(row, "service_tower"),
        stringValue(row, "metric_name"),
        stringValue(row, "period_start"),
        stringValue(row, "period_end"),
        thresholdPct === null ? null : `${thresholdPct.toFixed(1)}%`,
        actualPct === null ? null : `${actualPct.toFixed(1)}%`,
        actualPct,
        stringValue(row, "breach_state") === "breached" ? 1 : 0,
        creditOwed > 0,
        creditOwed,
        creditClaimed,
        numberValue(row, "credit_recovered_usd") ?? 0,
        SOURCE_SYSTEM,
        `source_contract_depth_package:${args.datasetVersion}`,
        args.loadRunId,
        JSON.stringify(row),
      ],
    );

    if (creditOwed > 0) {
      await client.query(
        `INSERT INTO source.contract_service_credit (
           tenant_key, service_credit_id, contract_id, service_id,
           period_start, period_end, trigger_metric, credit_earned,
           credit_claimed, credit_recovered, credit_waived, currency,
           status, owner_role, source_system, source_record_id, as_of_date,
           confidence, quality_state, evidence_reference, load_run_id, raw_payload
         )
         VALUES (
           $1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, $10, 0, 'USD',
           'identified', 'Vendor management / service owner', $11, $12,
           CURRENT_DATE, 0.9, 'reviewed', $13, $14, $15::jsonb
         )
         ON CONFLICT (tenant_key, service_credit_id)
         DO UPDATE SET credit_earned = EXCLUDED.credit_earned,
                       credit_claimed = EXCLUDED.credit_claimed,
                       credit_recovered = EXCLUDED.credit_recovered,
                       evidence_reference = EXCLUDED.evidence_reference,
                       load_run_id = EXCLUDED.load_run_id,
                       raw_payload = EXCLUDED.raw_payload,
                       updated_at = now()`,
        [
          args.tenantKey,
          `service_credit:${stringValue(row, "source_row_id")}`,
          stringValue(row, "contract_id"),
          stringValue(row, "service_tower"),
          stringValue(row, "period_start"),
          stringValue(row, "period_end"),
          stringValue(row, "metric_name"),
          creditOwed,
          creditClaimed,
          numberValue(row, "credit_recovered_usd") ?? 0,
          SOURCE_SYSTEM,
          stringValue(row, "source_row_id"),
          `source_contract_depth_package:${args.datasetVersion}`,
          args.loadRunId,
          JSON.stringify(row),
        ],
      );
    }
  }
}

async function upsertUsageFacts(client: Client, args: Args, usageRows: readonly CsvRecord[]): Promise<void> {
  for (const row of usageRows) {
    const factPrefix = `usage_entitlement:${stringValue(row, "source_row_id")}`;
    const facts = [
      ["entitled_quantity", numberValue(row, "entitled_quantity"), null, stringValue(row, "unit")],
      ["active_quantity", numberValue(row, "active_quantity"), null, stringValue(row, "unit")],
      ["unused_quantity", numberValue(row, "unused_quantity"), null, stringValue(row, "unit")],
      ["utilization_pct", pctValue(row, "utilization_pct"), null, "%"],
      ["annual_opportunity_usd", numberValue(row, "annual_opportunity_usd"), "USD", null],
    ] as const;
    for (const [factKey, numeric, currency, unit] of facts) {
      if (numeric === null) continue;
      await client.query(
        `INSERT INTO source.canonical_fact_assertion (
           tenant_key, dataset_version, assertion_id, entity_kind, entity_id,
           contract_id, vendor_id, fact_key, value_numeric, currency, unit,
           source_system, source_table, source_record_id, source_document_id,
           assertion_basis, confidence, review_state, source_refs, payload
         )
         VALUES (
           $1, $2, $3, 'contract', $4, $4, $5, $6, $7, $8, $9, $10,
           'source.contract_depth_adapter_row', $11, $12, $13, 0.86,
           'system_extracted', $14::jsonb, $15::jsonb
         )
         ON CONFLICT (tenant_key, dataset_version, assertion_id)
         DO UPDATE SET value_numeric = EXCLUDED.value_numeric,
                       payload = EXCLUDED.payload`,
        [
          args.tenantKey,
          args.datasetVersion,
          `${factPrefix}:${factKey}`,
          stringValue(row, "contract_id"),
          stringValue(row, "vendor_ref"),
          `usage_entitlement.${stringValue(row, "metric_name")}.${factKey}`,
          numeric,
          currency,
          unit,
          SOURCE_SYSTEM,
          stringValue(row, "source_row_id"),
          stringValue(row, "source_file_id"),
          "Synthetic usage entitlement row loaded through package adapter.",
          JSON.stringify([stringValue(row, "source_row_id"), stringValue(row, "source_file_id")]),
          JSON.stringify(row),
        ],
      );
    }
  }
}

async function upsertOptimizationSpine(
  client: Client,
  args: Args,
  sourceFiles: ContractDepthSourceFileInput,
): Promise<void> {
  const contractsById = new Map(sourceFiles.contracts.map((contract) => [stringValue(contract, "contract_id"), contract]));
  const opportunityIds = sourceFiles.optimizationOpportunities.map((row) => stringValue(row, "opportunity_id"));
  const contractIds = sourceFiles.contracts.map((row) => stringValue(row, "contract_id"));

  await client.query(
    `DELETE FROM source.optimization_case
      WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, contractIds],
  );
  await client.query(
    `DELETE FROM source.optimization_baseline
      WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, contractIds],
  );
  await client.query(
    `DELETE FROM source.evidence_requirement
      WHERE tenant_key = $1 AND dataset_version = $2 AND requirement_id LIKE 'contract-depth:%'`,
    [args.tenantKey, args.datasetVersion],
  );
  await client.query(
    `DELETE FROM source.optimization_opportunity
      WHERE tenant_key = $1 AND opportunity_id = ANY($2::text[])`,
    [args.tenantKey, opportunityIds],
  );

  const spendByContract = groupBy(sourceFiles.monthlySpend, "contract_id");
  await client.query(
    `INSERT INTO source.calculation_rule (
       tenant_key, dataset_version, rule_id, rule_version, formula,
       input_contract, output_contract, payload
     )
     VALUES (
       $1, $2, 'source.contract_depth_package.opportunity.v1', '1.0.0',
       'Package opportunity amount is accepted only as candidate value; finance_confirmation_state remains not_confirmed.',
       $3::jsonb, $4::jsonb, '{}'::jsonb
     )
     ON CONFLICT (tenant_key, dataset_version, rule_id, rule_version)
     DO UPDATE SET formula = EXCLUDED.formula`,
    [
      args.tenantKey,
      args.datasetVersion,
      JSON.stringify(["optimization_opportunities.evidence_rows", "amount_usd"]),
      JSON.stringify(["candidate_amount_usd"]),
    ],
  );

  for (const contract of sourceFiles.contracts) {
    const contractId = stringValue(contract, "contract_id");
    const spend = spendByContract.get(contractId) ?? [];
    const actualSpend = spend.reduce((total, row) => total + requiredNumber(row, "actual_spend_usd"), 0);
    const baselineId = `contract-depth:${contractId}:baseline`;
    await client.query(
      `INSERT INTO source.optimization_baseline (
         tenant_key, dataset_version, baseline_id, contract_id, baseline_state,
         annual_value_usd, pricing_schedule_annual_value_usd,
         actual_annual_spend_usd, total_committed_value_usd,
         conflict_amount_usd, detail, source_refs, payload
       )
       VALUES (
         $1, $2, $3, $4, 'ready', $5, NULL, $6, $7, NULL,
         $8, $9::jsonb, $10::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        baselineId,
        contractId,
        numberValue(contract, "annual_value_usd"),
        actualSpend,
        numberValue(contract, "committed_annual_spend_usd"),
        "Baseline uses 12 monthly spend observations from the package-backed Source adapter.",
        JSON.stringify(spend.map((row) => stringValue(row, "source_row_id"))),
        JSON.stringify({ synthetic_policy: "synthetic_demo_only_not_client_truth" }),
      ],
    );
  }

  for (const opportunity of sourceFiles.optimizationOpportunities) {
    const opportunityId = stringValue(opportunity, "opportunity_id");
    const contract = contractsById.get(stringValue(opportunity, "contract_id"));
    if (!contract) throw new Error(`Unknown contract for opportunity ${opportunityId}`);
    const opportunityType = stringValue(opportunity, "opportunity_type") as "recoverable_leakage" | "avoided_cost" | "negotiated_improvement";
    const amount = requiredNumber(opportunity, "annual_value_usd");
    const calculationRunId = `contract-depth:${opportunityId}:calculation`;
    const caseId = `contract-depth:${stringValue(opportunity, "contract_id")}:case`;
    const requirementId = `contract-depth:${opportunityId}:finance-review`;
    const evidenceRows = stringValue(opportunity, "evidence_rows")
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean);

    await client.query(
      `INSERT INTO source.optimization_opportunity (
         tenant_key, dataset_version, opportunity_id, contract_id, vendor_id,
         value_type, stage, amount_usd, amount_state, evidence_grade,
         confidence, owner, next_action, blocking_gap, deadline,
         overlap_treatment, approval_state, narrative, payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, 'quantified', $7, 'exact',
         'package_evidenced', $8, $9, $10,
         'Finance confirmation and owner approval are required before realized value can be claimed.',
         NULL, 'standalone_candidate', 'requires_review', $11, $12::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        stringValue(opportunity, "contract_id"),
        stringValue(opportunity, "vendor_ref"),
        opportunityType,
        amount,
        numberValue(opportunity, "confidence") ?? 0.8,
        stringValue(contract, "business_owner"),
        stringValue(opportunity, "recommended_action"),
        stringValue(opportunity, "title"),
        JSON.stringify({
          ...opportunity,
          finance_confirmation_state: "not_confirmed",
          selected_for_action_state: stringValue(opportunity, "selected_for_action_state"),
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        }),
      ],
    );

    await client.query(
      `INSERT INTO source.optimization_case (
         tenant_key, dataset_version, optimization_case_id, contract_id,
         vendor_id, baseline_id, case_state, owner, next_action, payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, 'evidence_review', $7, $8, $9::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        caseId,
        stringValue(opportunity, "contract_id"),
        stringValue(opportunity, "vendor_ref"),
        `contract-depth:${stringValue(opportunity, "contract_id")}:baseline`,
        stringValue(contract, "business_owner"),
        stringValue(opportunity, "recommended_action"),
        JSON.stringify({ synthetic_policy: "synthetic_demo_only_not_client_truth" }),
      ],
    );

    await client.query(
      `INSERT INTO source.case_opportunity (
         tenant_key, dataset_version, optimization_case_id, opportunity_id,
         selected_for_action, sequence, payload
       )
       VALUES ($1, $2, $3, $4, false, 1, '{}'::jsonb)`,
      [args.tenantKey, args.datasetVersion, caseId, opportunityId],
    );

    await client.query(
      `INSERT INTO source.calculation_run (
         tenant_key, dataset_version, calculation_run_id, opportunity_id,
         rule_id, rule_version, run_state, run_hash, completed_at, payload
       )
       VALUES (
         $1, $2, $3, $4, 'source.contract_depth_package.opportunity.v1',
         '1.0.0', 'completed', $5, now(), $6::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        calculationRunId,
        opportunityId,
        sha256(JSON.stringify(opportunity)),
        JSON.stringify({ evidence_row_count: evidenceRows.length }),
      ],
    );

    for (const [index, evidenceRow] of evidenceRows.entries()) {
      await client.query(
        `INSERT INTO source.opportunity_evidence (
           tenant_key, dataset_version, opportunity_id, evidence_class,
           source_system, source_table, source_record_id, source_file_report,
           review_state, evidence_status, amount_usd, quantity, unit, payload
         )
         VALUES (
           $1, $2, $3, $4, $5, 'source.contract_depth_adapter_row', $6,
           $7, 'system_evidenced', 'EVIDENCE_AVAILABLE', NULL, 1, 'row', $8::jsonb
         )`,
        [
          args.tenantKey,
          args.datasetVersion,
          opportunityId,
          stringValue(opportunity, "evidence_family"),
          SOURCE_SYSTEM,
          evidenceRow,
          stringValue(opportunity, "source_file_id"),
          JSON.stringify({ evidence_row_index: index + 1 }),
        ],
      );
      await client.query(
        `INSERT INTO source.calculation_input (
           tenant_key, dataset_version, calculation_run_id, input_key,
           source_table, source_record_id, value_numeric, value_text, unit,
           inclusion_state, inclusion_reason, payload
         )
         VALUES (
           $1, $2, $3, $4, 'source.contract_depth_adapter_row', $5,
           NULL, $5, 'row', 'included',
           'Package opportunity cites this evidence row.', '{}'::jsonb
         )`,
        [
          args.tenantKey,
          args.datasetVersion,
          calculationRunId,
          `evidence_row_${index + 1}`,
          evidenceRow,
        ],
      );
    }

    await client.query(
      `INSERT INTO source.calculation_output (
         tenant_key, dataset_version, calculation_run_id, output_key,
         amount_usd, quantity, unit, payload
       )
       VALUES
         ($1, $2, $3, 'candidate_amount_usd', $4, NULL, 'USD', '{}'::jsonb),
         ($1, $2, $3, 'evidence_row_count', NULL, $5, 'row', '{}'::jsonb)`,
      [args.tenantKey, args.datasetVersion, calculationRunId, amount, evidenceRows.length],
    );

    await client.query(
      `INSERT INTO source.opportunity_valuation (
         tenant_key, dataset_version, opportunity_id, valuation_type,
         amount_usd, valuation_state, basis, source_run_id, effective_date, payload
       )
       VALUES (
         $1, $2, $3, 'potential', $4, 'candidate_quantified',
         'Package opportunity amount is evidence-backed but not finance-confirmed.',
         $5, CURRENT_DATE, $6::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        amount,
        calculationRunId,
        JSON.stringify({ finance_confirmation_state: "not_confirmed" }),
      ],
    );

    await client.query(
      `INSERT INTO source.evidence_requirement (
         tenant_key, dataset_version, requirement_id, evidence_class,
         requirement_text, grain, minimum_period_months, owner_role, payload
       )
       VALUES (
         $1, $2, $3, 'finance_confirmation',
         'Finance confirmation is required before this candidate amount becomes realized value.',
         'contract_opportunity', 1, $4, '{}'::jsonb
       )`,
      [args.tenantKey, args.datasetVersion, requirementId, stringValue(contract, "business_owner")],
    );

    await client.query(
      `INSERT INTO source.opportunity_requirement_status (
         tenant_key, dataset_version, opportunity_id, requirement_id,
         status, status_detail, owner, payload
       )
       VALUES (
         $1, $2, $3, $4, 'workflow_required',
         'Candidate opportunity is quantified, but finance confirmation remains not_confirmed.',
         $5, '{}'::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        requirementId,
        stringValue(contract, "business_owner"),
      ],
    );

    await client.query(
      `INSERT INTO source.evidence_request (
         tenant_key, dataset_version, evidence_request_id, opportunity_id,
         requirement_id, request_text, owner, request_state, payload
       )
       VALUES (
         $1, $2, $3, $4, $5,
         'Confirm finance owner acceptance before claiming realized savings.',
         $6, 'open', '{}'::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        `contract-depth:${opportunityId}:finance-confirmation-request`,
        opportunityId,
        requirementId,
        stringValue(contract, "business_owner"),
      ],
    );
  }
}

async function applyLayer3(
  client: Client,
  args: Args,
  sourceFiles: ContractDepthSourceFileInput,
  rows: readonly Layer2Row[],
  expectedLayer2: Record<string, number>,
): Promise<Record<string, number | string>> {
  await assertTables(client, [...REQUIRED_LAYER2_TABLES, ...REQUIRED_LAYER3_TABLES]);
  assertLayer2Matches(expectedLayer2, await layer2Readback(client, args));

  await insertSnapshots(client, args, rows);
  await upsertVendors(client, args, sourceFiles.contracts);
  await upsertContracts(client, args, sourceFiles.contracts);
  await upsertContractTerms(client, args, sourceFiles.contractClauses);
  await upsertContractScope(client, args, sourceFiles.applicationScope);
  await upsertSpend(client, args, sourceFiles.monthlySpend);
  await upsertPerformance(client, args, sourceFiles.slaPerformance);
  await upsertUsageFacts(client, args, sourceFiles.saasUsage);
  await upsertOptimizationSpine(client, args, sourceFiles);

  return layer3Readback(client, args, sourceFiles);
}

async function layer3Readback(
  client: Client,
  args: Args,
  sourceFiles: ContractDepthSourceFileInput,
): Promise<Record<string, number | string>> {
  const contractIds = sourceFiles.contracts.map((row) => stringValue(row, "contract_id"));
  const opportunityIds = sourceFiles.optimizationOpportunities.map((row) => stringValue(row, "opportunity_id"));
  const result = await client.query<Record<string, string>>(
    `SELECT
       (SELECT count(*)::text FROM source.contract_depth_adapter_row WHERE tenant_key = $1 AND dataset_version = $2) AS layer2_adapter_rows,
       (SELECT count(*)::text FROM source.source_record_snapshot WHERE tenant_key = $1 AND dataset_version = $2) AS source_record_snapshot,
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5) AS source_contract,
       (SELECT count(*)::text FROM source.contract_term WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5) AS source_contract_term,
       (SELECT count(*)::text FROM source.contract_scope WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5) AS source_contract_scope,
       (SELECT count(*)::text FROM source.contract_consumption_observation WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5) AS source_contract_consumption_observation,
       (SELECT count(*)::text FROM source.contract_performance_observation WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5) AS source_contract_performance_observation,
       (SELECT count(*)::text FROM source.contract_service_credit WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5) AS source_contract_service_credit,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS optimization_opportunity,
       (SELECT count(*)::text FROM source.optimization_baseline WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS optimization_baseline,
       (SELECT count(*)::text FROM source.optimization_case WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS optimization_case,
       (SELECT count(*)::text FROM source.opportunity_evidence WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_evidence,
       (SELECT count(*)::text FROM source.calculation_run WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS calculation_run,
       (SELECT count(*)::text FROM source.opportunity_valuation WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_valuation,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS canonical_fact_assertion,
       (SELECT coalesce(sum(amount_usd), 0)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_amount_usd,
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5 AND coalesce(raw_payload->>'alternatives_available', '') <> '') AS contracts_with_assessed_alternatives,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[]) AND payload->>'finance_confirmation_state' = 'not_confirmed') AS opportunities_not_finance_confirmed`,
    [args.tenantKey, args.datasetVersion, contractIds, opportunityIds, args.loadRunId],
  );
  const row = result.rows[0] ?? {};
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      Number.isFinite(Number(value)) && value !== "" ? Number(value) : value,
    ]),
  );
}

function expectedLayer3(sourceFiles: ContractDepthSourceFileInput, rows: readonly Layer2Row[]): Record<string, number> {
  return {
    layer2_adapter_rows: rows.length,
    source_record_snapshot: rows.length,
    source_contract: sourceFiles.contracts.length,
    source_contract_term: sourceFiles.contractClauses.length,
    source_contract_scope: sourceFiles.applicationScope.length,
    source_contract_consumption_observation: sourceFiles.monthlySpend.length,
    source_contract_performance_observation: sourceFiles.slaPerformance.length,
    source_contract_service_credit: sourceFiles.slaPerformance.filter((row) => (numberValue(row, "credit_owed_usd") ?? 0) > 0).length,
    optimization_opportunity: sourceFiles.optimizationOpportunities.length,
    optimization_baseline: sourceFiles.contracts.length,
    optimization_case: sourceFiles.optimizationOpportunities.length,
    calculation_run: sourceFiles.optimizationOpportunities.length,
    opportunity_valuation: sourceFiles.optimizationOpportunities.length,
    opportunities_not_finance_confirmed: sourceFiles.optimizationOpportunities.length,
    contracts_with_assessed_alternatives: 0,
  };
}

function layer3Failures(expected: Record<string, number>, actual: Record<string, number | string>): string[] {
  return Object.entries(expected)
    .filter(([key, count]) => actual[key] !== count)
    .map(([key, count]) => `${key}: expected ${count}, read ${actual[key] ?? 0}`);
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-contract-depth-package-loader"),
  );
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const sourceFiles = readSourceFiles(args.packageDir);
  const adapted = adaptContractDepthPackage(sourceFiles);
  const projection = projectContractDepthPackage(sourceFiles);
  const rows = adapterRows(adapted);
  const packageHash = sourcePackageHash(sourceFiles);
  const expectedAdapterCounts = adapterCountByName(rows);
  const plan = {
    event: "source_contract_depth_package_layer23_plan",
    mode: args.mode,
    tenant_key: args.tenantKey,
    dataset_version: args.datasetVersion,
    package_dir: args.packageDir,
    package_sha256: packageHash,
    idempotency_key: args.idempotencyKey,
    load_run_id: args.loadRunId,
    proof_dir: args.proofDir,
    layer2_expected_rows: rows.length,
    layer2_expected_counts: expectedAdapterCounts,
    adapter_quality_gate: adapted.qualityGate,
    projection_quality_gate: projection.qualityGate,
  };
  writeJson(path.join(args.proofDir, "plan.json"), plan);

  if (adapted.qualityGate.status !== "PASS" || projection.qualityGate.status !== "PASS") {
    console.log(JSON.stringify(plan, null, 2));
    throw new Error("Package quality gate failed; refusing Azure load.");
  }

  if (args.mode === "plan") {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  requireApplyApproval(args);

  const result = await withClient(async (client) => {
    if (args.mode === "apply-layer2") {
      await client.query("BEGIN");
      try {
        await applyLayer2(client, args, rows, packageHash, adapted.qualityGate);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        await writeRunStatus(client, args, packageHash, "failed", 0, adapted.qualityGate, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      const readback = await layer2Readback(client, args);
      return {
        ...plan,
        event: "source_contract_depth_package_layer2_applied",
        layer2_readback: readback,
        layer2_readback_failures: Object.entries(expectedAdapterCounts)
          .filter(([name, count]) => readback[name] !== count)
          .map(([name, count]) => `${name}: expected ${count}, read ${readback[name] ?? 0}`),
      };
    }

    if (args.mode === "apply-layer3") {
      await client.query("BEGIN");
      let readback: Record<string, number | string>;
      try {
        readback = await applyLayer3(client, args, sourceFiles, rows, expectedAdapterCounts);
        const expected = expectedLayer3(sourceFiles, rows);
        const failures = layer3Failures(expected, readback);
        await writeRunStatus(client, args, packageHash, failures.length ? "failed" : "completed", rows.length, adapted.qualityGate, readback);
        if (failures.length) throw new Error(`Layer 3 readback failed: ${failures.join("; ")}`);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
      return {
        ...plan,
        event: "source_contract_depth_package_layer3_applied",
        layer3_expected: expectedLayer3(sourceFiles, rows),
        layer3_readback: readback,
        layer3_readback_failures: [],
      };
    }

    const layer2 = await layer2Readback(client, args);
    const layer3 = await layer3Readback(client, args, sourceFiles);
    return {
      ...plan,
      event: "source_contract_depth_package_layer23_verified",
      layer2_readback: layer2,
      layer3_expected: expectedLayer3(sourceFiles, rows),
      layer3_readback: layer3,
      layer3_readback_failures: layer3Failures(expectedLayer3(sourceFiles, rows), layer3),
    };
  });

  writeJson(path.join(args.proofDir, "result.json"), result);
  console.log(JSON.stringify(result, null, 2));
  if (
    "layer2_readback_failures" in result &&
    Array.isArray(result.layer2_readback_failures) &&
    result.layer2_readback_failures.length > 0
  ) {
    process.exitCode = 1;
  }
  if (
    "layer3_readback_failures" in result &&
    Array.isArray(result.layer3_readback_failures) &&
    result.layer3_readback_failures.length > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

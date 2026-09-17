import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
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
const DEFAULT_PACKAGE_DIR =
  "datasets/source/contract-depth/meridian-contract-depth-v1-20260828";
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
    key: "changeOrderAdapter",
    adapterName: "change_order_adapter",
    sourceFileName: "change_orders.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "contractPageTextAdapter",
    adapterName: "contract_page_text_adapter",
    sourceFileName: "contract_page_text.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "cmdbApplicationAdapter",
    adapterName: "cmdb_application_adapter",
    sourceFileName: "cmdb_applications.csv",
    rowIdField: "application_id",
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
    key: "resourceModelAdapter",
    adapterName: "contract_resource_model_adapter",
    sourceFileName: "resource_model.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "pricingBridgeAdapter",
    adapterName: "contract_pricing_bridge_adapter",
    sourceFileName: "pricing_bridge.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "invoiceLineAdapter",
    adapterName: "invoice_line_adapter",
    sourceFileName: "invoice_line_detail.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "batchOperationsAdapter",
    adapterName: "batch_operations_adapter",
    sourceFileName: "batch_job_volumetrics.csv",
    rowIdField: "source_row_id",
  },
  {
    key: "qbrAdapter",
    adapterName: "qbr_scorecard_adapter",
    sourceFileName: "qbr_scorecards.csv",
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
  {
    key: "negotiationFindingAdapter",
    adapterName: "negotiation_finding_adapter",
    sourceFileName: "negotiation_findings.csv",
    rowIdField: "finding_id",
  },
  {
    key: "negotiationLeverAdapter",
    adapterName: "negotiation_lever_adapter",
    sourceFileName: "negotiation_levers.csv",
    rowIdField: "lever_id",
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
  "opportunity_claim",
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
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

function parseArgs(): Args {
  const mode = (argValue("mode") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_MODE ??
    "plan") as Mode;
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
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
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
  return rows.filter((candidate) =>
    candidate.some((value) => value.length > 0),
  );
}

function readCsv(filePath: string): CsvRecord[] {
  if (!fs.existsSync(filePath)) return [];
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

function readSourceFiles(
  packageDir: string,
  expectedTenantKey: string,
  expectedDatasetVersion: string,
): ContractDepthSourceFileInput {
  const sourceDir = path.join(packageDir, "source-files");
  const rawContracts = readCsv(path.join(sourceDir, "contracts.csv"));
  const rawApplications: CsvRecord[] = readCsv(
    path.join(sourceDir, "cmdb_applications.csv"),
  ).map((row) => ({
    ...row,
    application_id:
      stringValue(row, "application_id") ||
      stringValue(row, "application_ref") ||
      stringValue(row, "source_record_id"),
    business_unit:
      stringValue(row, "business_unit") ||
      stringValue(row, "business_function"),
    lifecycle_status:
      stringValue(row, "lifecycle_status") ||
      stringValue(row, "lifecycle_state"),
    source_row_id:
      stringValue(row, "source_row_id") ||
      stringValue(row, "source_record_id") ||
      stringValue(row, "application_ref"),
  }));
  const rawScope: CsvRecord[] = readCsv(
    path.join(sourceDir, "cmdb_application_scope.csv"),
  ).map((row) => ({
    ...row,
    application_id:
      stringValue(row, "application_id") || stringValue(row, "application_ref"),
  }));
  const rawClauses: CsvRecord[] = readCsv(
    path.join(sourceDir, "contract_clauses.csv"),
  ).map((row) => ({
    ...row,
    clause_id:
      stringValue(row, "clause_id") ||
      stringValue(row, "extraction_id") ||
      stringValue(row, "source_row_id"),
    source_row_id:
      stringValue(row, "source_row_id") || stringValue(row, "extraction_id"),
    clause_type:
      stringValue(row, "clause_type") || stringValue(row, "concept_ref"),
    source_page_ref:
      stringValue(row, "source_page_ref") ||
      stringValue(row, "source_page") ||
      stringValue(row, "source_section"),
  }));
  const rawChangeOrders = readCsv(path.join(sourceDir, "change_orders.csv"));
  const rawManifest: CsvRecord[] = readCsv(
    path.join(sourceDir, "evidence_manifest.csv"),
  ).map((row) => ({
    ...row,
    source_row_id:
      stringValue(row, "source_row_id") ||
      stringValue(row, "evidence_id") ||
      stringValue(row, "source_file_id"),
  }));
  const rawSpend = readCsv(path.join(sourceDir, "monthly_spend.csv"));
  const rawUsage = readCsv(path.join(sourceDir, "saas_usage.csv"));
  const rawPerformance = readCsv(path.join(sourceDir, "sla_performance.csv"));
  const rawTickets = readCsv(path.join(sourceDir, "ticket_volumetrics.csv"));
  const rawBatch = readCsv(path.join(sourceDir, "batch_job_volumetrics.csv"));
  const rawQbr = readCsv(path.join(sourceDir, "qbr_scorecards.csv"));
  const rawInvoices = readCsv(path.join(sourceDir, "invoice_line_detail.csv"));
  const rawPricing = readCsv(path.join(sourceDir, "pricing_bridge.csv"));
  const rawOpportunities = readCsv(
    path.join(sourceDir, "optimization_opportunities.csv"),
  );
  const rawFindings = readCsv(path.join(sourceDir, "negotiation_findings.csv"));
  const rawLevers = readCsv(path.join(sourceDir, "negotiation_levers.csv"));
  const identityRows = [
    ...rawContracts,
    ...rawApplications,
    ...rawScope,
    ...rawClauses,
    ...rawChangeOrders,
    ...rawManifest,
    ...rawSpend,
    ...rawUsage,
    ...rawPerformance,
    ...rawTickets,
    ...rawBatch,
    ...rawQbr,
    ...rawInvoices,
    ...rawPricing,
    ...rawOpportunities,
    ...rawFindings,
    ...rawLevers,
  ].filter((row) => row.dataset_version || row.tenant_key);
  const identityFailures = identityRows.filter((row) => {
    const tenantKey = stringValue(row, "tenant_key");
    const datasetVersion = stringValue(row, "dataset_version");
    return (
      (tenantKey.length > 0 && tenantKey !== expectedTenantKey) ||
      (datasetVersion.length > 0 && datasetVersion !== expectedDatasetVersion)
    );
  });
  if (identityFailures.length > 0) {
    throw new Error(
      `Package identity mismatch: expected ${expectedTenantKey}/${expectedDatasetVersion}, found ${identityFailures
        .slice(0, 5)
        .map(
          (row) =>
            `${stringValue(row, "tenant_key")}/${stringValue(row, "dataset_version")}`,
        )
        .join(", ")}`,
    );
  }
  const appById = new Map(
    rawApplications.map((row) => [stringValue(row, "application_id"), row]),
  );
  const contractById = new Map(
    rawContracts.map((row) => [stringValue(row, "contract_id"), row]),
  );
  const rowsByFile = {
    monthly_spend: rawSpend,
    invoice_line_detail: rawInvoices,
    qbr_scorecards: rawQbr,
    ticket_volumetrics: rawTickets,
    pricing_bridge: rawPricing,
    contract_clauses: rawClauses,
    change_orders: rawChangeOrders,
  } as const;
  return {
    contracts: rawContracts.map((row) => ({
      ...row,
      renewal_notice_date: daysBefore(
        stringValue(row, "end_date"),
        Number(row.notice_period_days) || 0,
      ),
      source_file_id: stringValue(row, "source_file_id") || "EVID-01",
    })),
    applications: rawApplications.map((row) =>
      alias(
        alias(row, "application_ref", "application_id"),
        "business_function",
        "business_unit",
      ),
    ),
    applicationScope: rawScope.map((row) => {
      const app = appById.get(stringValue(row, "application_id"));
      const contract = contractById.get(stringValue(row, "contract_id"));
      return {
        ...row,
        application_ref: stringValue(row, "application_id"),
        application_name: stringValue(app ?? {}, "application_name"),
        business_function: stringValue(app ?? {}, "business_unit"),
        criticality: stringValue(row, "scope_status") || "declared scope",
        hosting_model: "vendor-hosted",
        scope_role: stringValue(row, "scope_status"),
        relationship_method: "declared_contract_scope",
        relationship_confidence: "1",
        vendor_ref: stringValue(contract ?? {}, "vendor_ref"),
        vendor_name: stringValue(contract ?? {}, "vendor_name"),
        source_file_id:
          stringValue(row, "source_file_id") ||
          stringValue(contract ?? {}, "source_file_id") ||
          "EVID-01",
      };
    }),
    changeOrders: rawChangeOrders.map((row) => {
      const contract = contractById.get(stringValue(row, "contract_id"));
      return {
        ...row,
        vendor_ref: stringValue(contract ?? {}, "vendor_ref"),
        vendor_name: stringValue(contract ?? {}, "vendor_name"),
        change_order_type:
          stringValue(row, "change_order_type") ||
          stringValue(row, "change_type") ||
          "scope_change",
        effective_date:
          stringValue(row, "effective_date") ||
          stringValue(row, "request_date") ||
          stringValue(row, "date_proposed"),
        approval_date:
          stringValue(row, "approval_date") ||
          stringValue(row, "request_date") ||
          stringValue(row, "date_proposed"),
        approval_owner:
          stringValue(row, "approval_owner") ||
          stringValue(contract ?? {}, "business_owner"),
        scope_summary:
          stringValue(row, "scope_summary") || stringValue(row, "description"),
        commercial_impact:
          stringValue(row, "commercial_impact") ||
          stringValue(row, "requested_amount_usd") ||
          stringValue(row, "value_impact_usd"),
        recurring: stringValue(row, "recurring") || "false",
        annualized_spend_usd:
          stringValue(row, "annualized_spend_usd") ||
          stringValue(row, "value_impact_usd"),
        one_time_spend_usd: stringValue(row, "one_time_spend_usd") || "0",
        source_file_id:
          stringValue(row, "source_file_id") ||
          stringValue(contract ?? {}, "source_file_id") ||
          "EVID-01",
        source_page: "Order Form change order record",
      };
    }),
    contractPageText: readCsv(path.join(sourceDir, "contract_page_text.csv")),
    resourceModel: readCsv(path.join(sourceDir, "resource_model.csv")),
    pricingBridge: rawPricing.map((row) => ({
      ...row,
      bridge_component:
        stringValue(row, "bridge_component") || stringValue(row, "scenario"),
      amount_usd:
        stringValue(row, "amount_usd") ||
        stringValue(row, "total_annual_usd") ||
        stringValue(row, "net_annual_commitment_usd"),
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
      source_file_id: "EVID-01",
    })),
    invoiceLineDetail: rawInvoices.map((row) => ({
      ...row,
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
      source_file_id: "EVID-02",
    })),
    batchJobVolumetrics: rawBatch.map((row) => ({
      ...row,
      failed_jobs: "0",
      late_completion_count: "0",
      manual_restarts: "0",
      source_file_id: "EVID-03",
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
    })),
    qbrScorecards: rawQbr.map((row) => ({
      ...row,
      source_file_id: "EVID-03",
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
    })),
    monthlySpend: rawSpend.map((row) => ({
      ...row,
      period_start:
        stringValue(row, "period_start") ||
        monthStart(stringValue(row, "month")),
      period_end:
        stringValue(row, "period_end") || monthEnd(stringValue(row, "month")),
      committed_base_amount_usd:
        stringValue(row, "committed_base_amount_usd") ||
        stringValue(row, "commitment_run_rate_usd"),
      invoice_amount_usd:
        stringValue(row, "invoice_amount_usd") || stringValue(row, "spend_usd"),
      paid_amount_usd:
        stringValue(row, "paid_amount_usd") || stringValue(row, "spend_usd"),
      actual_spend_usd:
        stringValue(row, "actual_spend_usd") || stringValue(row, "spend_usd"),
      currency: "USD",
      invoice_ref: `DBX-${stringValue(row, "month")}`,
      source_file_id: "EVID-03",
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
    })),
    saasUsage: rawUsage.map((row) => ({
      ...row,
      source_file_id: "EVID-03",
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
      metric_name: "workspace_entitlement",
      entitled_quantity: stringValue(row, "entitled_seats"),
      active_quantity: stringValue(row, "active_seats"),
      unused_quantity: "0",
      utilization_pct: "",
      unit: "seats",
      annual_opportunity_usd: "",
    })),
    slaPerformance: rawPerformance.map((row) => ({
      ...row,
      period_start:
        stringValue(row, "period_start") ||
        monthStart(stringValue(row, "month")),
      period_end:
        stringValue(row, "period_end") || monthEnd(stringValue(row, "month")),
      metric_name:
        stringValue(row, "metric_name") || stringValue(row, "sla_metric"),
      service_tower:
        stringValue(row, "service_tower") ||
        stringValue(row, "vendor_category"),
      committed_threshold_pct:
        stringValue(row, "committed_threshold_pct") ||
        stringValue(row, "target_pct"),
      actual_result_pct:
        stringValue(row, "actual_result_pct") || stringValue(row, "actual_pct"),
      credit_owed_usd:
        stringValue(row, "credit_owed_usd") ||
        stringValue(row, "credit_amount_usd") ||
        "0",
      credit_recovered_usd: stringValue(row, "credit_recovered_usd") || "0",
      source_file_id:
        stringValue(row, "source_file_id") ||
        stringValue(row, "evidence_reference") ||
        "EVID-03",
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
    })),
    ticketVolumetrics: rawTickets.map((row) => ({
      ...row,
      period_start:
        stringValue(row, "period_start") ||
        monthStart(stringValue(row, "month")),
      period_end:
        stringValue(row, "period_end") || monthEnd(stringValue(row, "month")),
      service_tower: stringValue(row, "category"),
      severity: stringValue(row, "severity_mix"),
      source_file_id: "EVID-03",
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
    })),
    contractClauses: rawClauses.map((row) => ({
      ...row,
      extraction_id:
        stringValue(row, "clause_id") || stringValue(row, "source_row_id"),
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
      vendor_name: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_name",
      ),
      concept_ref: stringValue(row, "clause_type"),
      evidence_class: "contract_clause",
      subject_kind: "contract",
      subject_ref: stringValue(row, "contract_id"),
      source_section: stringValue(row, "source_page_ref"),
      source_page: stringValue(row, "source_page_ref"),
      confidence: "0.95",
      review_state: "system_extracted_synthetic_demo",
    })),
    evidenceManifest: rawManifest.map((row) => ({
      ...row,
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
      expected_layer: "layer_3_document_evidence",
    })),
    optimizationOpportunities: rawOpportunities.map((row) => ({
      ...row,
      ...(rawFindings.find(
        (finding) =>
          stringValue(finding, "finding_id") ===
          `F-${stringValue(row, "opportunity_id").replace(/^OPP-/u, "")}`,
      ) ?? {}),
      ...(rawLevers.find(
        (lever) =>
          stringValue(lever, "finding_id") ===
          `F-${stringValue(row, "opportunity_id").replace(/^OPP-/u, "")}`,
      ) ?? {}),
      opportunity_type:
        stringValue(row, "opportunity_type") || stringValue(row, "value_type"),
      title: stringValue(row, "title") || stringValue(row, "label"),
      annual_value_usd:
        stringValue(row, "amount_state") === "signal"
          ? ""
          : stringValue(row, "annual_value_usd") ||
            stringValue(row, "amount_low_usd"),
      confidence:
        stringValue(row, "confidence") ||
        (stringValue(row, "confidence_level") === "high"
          ? "0.9"
          : stringValue(row, "confidence_level") === "medium"
            ? "0.75"
            : "0.6"),
      finance_confirmation_state: stringValue(
        row,
        "finance_confirmation_state",
      ),
      evidence_family:
        stringValue(row, "evidence_family") || stringValue(row, "value_type"),
      evidence_rows: denseEvidenceRefs(
        stringValue(row, "evidence_rows"),
        rowsByFile,
      ),
      recommended_action:
        stringValue(row, "recommended_action") ||
        stringValue(row, "next_action"),
      vendor_ref: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_ref",
      ),
      vendor_name: stringValue(
        contractById.get(stringValue(row, "contract_id")) ?? {},
        "vendor_name",
      ),
      selected_for_action_state: "candidate",
      source_file_id: "EVID-01",
    })),
    negotiationFindings: rawFindings,
    negotiationLevers: rawLevers,
  };
}

function sourcePackageHash(sourceFiles: ContractDepthSourceFileInput): string {
  return sha256(JSON.stringify(sourceFiles));
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function shouldEmitProofBundle(): boolean {
  return (
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_EMIT_PROOF_BUNDLE === "true" ||
    process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
    process.argv.includes("--emit-proof-bundle")
  );
}

function emitProofBundle(proofDir: string): void {
  const parent = path.dirname(proofDir);
  const base = path.basename(proofDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(tar.stderr || tar.stdout || "Failed to build proof bundle");
  }
  const encoded = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) {
    console.log(encoded.slice(index, index + 7600));
  }
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

function numberValue(row: CsvRecord, key: string): number | null {
  const raw = (row[key] ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw.replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function totalCommittedValue(row: CsvRecord): number | null {
  return (
    numberValue(row, "total_committed_value_usd") ??
    numberValue(row, "total_committed_usd") ??
    numberValue(row, "committed_annual_spend_usd")
  );
}

function requiredNumber(row: CsvRecord, key: string): number {
  const parsed = numberValue(row, key);
  if (parsed === null)
    throw new Error(
      `Missing numeric field ${key} on ${row.source_row_id ?? row.contract_id ?? row.opportunity_id}`,
    );
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
  const quarter = month.match(/^(\d{4})-Q([1-4])$/u);
  if (quarter) {
    const year = Number(quarter[1]);
    const quarterNumber = Number(quarter[2]);
    return new Date(Date.UTC(year, quarterNumber * 3, 0))
      .toISOString()
      .slice(0, 10);
  }
  const [year, monthNumber] = month.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) return "";
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

function monthStart(month: string): string {
  const quarter = month.match(/^(\d{4})-Q([1-4])$/u);
  if (quarter)
    return `${quarter[1]}-${String((Number(quarter[2]) - 1) * 3 + 1).padStart(2, "0")}-01`;
  return month ? `${month}-01` : "";
}

function daysBefore(date: string, days: number): string {
  if (!date) return "";
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime())) return "";
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function alias(row: CsvRecord, key: string, ...fallbacks: string[]): CsvRecord {
  if (row[key]) return row;
  const fallback = fallbacks.map((candidate) => row[candidate]).find(Boolean);
  return fallback ? { ...row, [key]: fallback } : row;
}

function denseEvidenceRefs(
  raw: string,
  rowsByFile: Readonly<Record<string, readonly CsvRecord[]>>,
): string {
  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const match = entry.match(/^([^ ]+) x(\d+)$/u);
      if (!match) return [entry];
      const rows = rowsByFile[match[1]] ?? [];
      const requestedCount = Number(match[2]);
      if (rows.length < requestedCount) return [entry];
      return rows
        .slice(0, requestedCount)
        .map((row) => stringValue(row, "source_row_id"));
    })
    .filter(Boolean)
    .join(";");
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

function groupBy<T extends CsvRecord>(
  rows: readonly T[],
  key: string,
): Map<string, T[]> {
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
        throw new Error(
          `${spec.adapterName} row is missing ${spec.rowIdField}`,
        );
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

function adapterCountByName(
  rows: readonly Layer2Row[],
): Record<string, number> {
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

async function assertTables(
  client: Client,
  tableNames: readonly string[],
): Promise<void> {
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
        job_name:
          process.env.ACA_JOB_NAME ??
          process.env.CONTAINER_APP_JOB_NAME ??
          null,
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
  await writeRunStatus(
    client,
    args,
    packageHash,
    "completed",
    rows.length,
    qualityGate,
  );
}

async function layer2Readback(
  client: Client,
  args: Args,
): Promise<Record<string, number>> {
  const result = await client.query<{ adapter_name: string; count: string }>(
    `SELECT adapter_name, count(*)::text AS count
       FROM source.contract_depth_adapter_row
      WHERE tenant_key = $1
        AND dataset_version = $2
      GROUP BY adapter_name
      ORDER BY adapter_name`,
    [args.tenantKey, args.datasetVersion],
  );
  return Object.fromEntries(
    result.rows.map((row) => [row.adapter_name, Number(row.count)]),
  );
}

function assertLayer2Matches(
  expected: Record<string, number>,
  actual: Record<string, number>,
): void {
  const failures = Object.entries(expected)
    .filter(([name, count]) => actual[name] !== count)
    .map(
      ([name, count]) =>
        `${name}: expected ${count}, read ${actual[name] ?? 0}`,
    );
  if (failures.length) {
    throw new Error(
      `Layer 3 blocked because Layer 2 readback does not match package quality gate: ${failures.join("; ")}`,
    );
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

async function upsertVendors(
  client: Client,
  args: Args,
  contracts: readonly CsvRecord[],
): Promise<void> {
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
        JSON.stringify({
          dataset_version: args.datasetVersion,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        }),
      ],
    );
  }
}

async function upsertContracts(
  client: Client,
  args: Args,
  contracts: readonly CsvRecord[],
): Promise<void> {
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
        totalCommittedValue(contract),
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

async function upsertContractContextFacts(
  client: Client,
  args: Args,
  contracts: readonly CsvRecord[],
): Promise<void> {
  for (const contract of contracts) {
    const purpose = stringValue(contract, "contract_purpose_summary");
    if (!purpose) continue;

    const contractId = stringValue(contract, "contract_id");
    const sourceRecordId = stringValue(contract, "source_row_id");
    await client.query(
      `INSERT INTO source.canonical_fact_assertion (
         tenant_key, dataset_version, assertion_id, entity_kind, entity_id,
         contract_id, vendor_id, fact_key, value_numeric, currency, unit,
         source_system, source_table, source_record_id, source_document_id,
         assertion_basis, confidence, review_state, source_refs, payload
       )
       VALUES (
         $1, $2, $3, 'contract', $4, $4, $5, 'contract.purpose_summary',
         NULL, NULL, NULL, $6, 'source.contract_depth_adapter_row', $7, $8,
         'Deterministic contract purpose composed from the declared archetype, contract header, and governed document extracts.',
         0.86, 'system_extracted_synthetic_demo', $9::jsonb, $10::jsonb
       )
       ON CONFLICT (tenant_key, dataset_version, assertion_id)
       DO UPDATE SET
         source_record_id = EXCLUDED.source_record_id,
         source_document_id = EXCLUDED.source_document_id,
         assertion_basis = EXCLUDED.assertion_basis,
         confidence = EXCLUDED.confidence,
         review_state = EXCLUDED.review_state,
         source_refs = EXCLUDED.source_refs,
         payload = EXCLUDED.payload`,
      [
        args.tenantKey,
        args.datasetVersion,
        `${sourceRecordId}:contract.purpose_summary`,
        contractId,
        stringValue(contract, "vendor_ref"),
        SOURCE_SYSTEM,
        sourceRecordId,
        "EVID-01",
        JSON.stringify([sourceRecordId, "EVID-01"]),
        JSON.stringify({
          value_text: purpose,
          contract_id: contractId,
          archetype: stringValue(contract, "archetype"),
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        }),
      ],
    );
  }
}

async function upsertContractTerms(
  client: Client,
  args: Args,
  clauses: readonly CsvRecord[],
): Promise<void> {
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
        stringValue(clause, "evidence_class") ||
          stringValue(clause, "concept_ref"),
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

async function upsertContractScope(
  client: Client,
  args: Args,
  scopeRows: readonly CsvRecord[],
): Promise<void> {
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

async function upsertSpend(
  client: Client,
  args: Args,
  spendRows: readonly CsvRecord[],
): Promise<void> {
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
       DO UPDATE SET contract_id = EXCLUDED.contract_id,
                     business_unit = EXCLUDED.business_unit,
                     cost_center = EXCLUDED.cost_center,
                     period_start = EXCLUDED.period_start,
                     period_end = EXCLUDED.period_end,
                     committed_amount = EXCLUDED.committed_amount,
                     invoice_amount = EXCLUDED.invoice_amount,
                     paid_amount = EXCLUDED.paid_amount,
                     actual_spend = EXCLUDED.actual_spend,
                     currency = EXCLUDED.currency,
                     source_system = EXCLUDED.source_system,
                     source_record_id = EXCLUDED.source_record_id,
                     as_of_date = EXCLUDED.as_of_date,
                     confidence = EXCLUDED.confidence,
                     quality_state = EXCLUDED.quality_state,
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

async function upsertPerformance(
  client: Client,
  args: Args,
  performanceRows: readonly CsvRecord[],
): Promise<void> {
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

async function upsertUsageFacts(
  client: Client,
  args: Args,
  usageRows: readonly CsvRecord[],
): Promise<void> {
  for (const row of usageRows) {
    const factPrefix = `usage_entitlement:${stringValue(row, "source_row_id")}`;
    const facts = [
      [
        "entitled_quantity",
        numberValue(row, "entitled_quantity"),
        null,
        stringValue(row, "unit"),
      ],
      [
        "active_quantity",
        numberValue(row, "active_quantity"),
        null,
        stringValue(row, "unit"),
      ],
      [
        "unused_quantity",
        numberValue(row, "unused_quantity"),
        null,
        stringValue(row, "unit"),
      ],
      ["utilization_pct", pctValue(row, "utilization_pct"), null, "%"],
      [
        "annual_opportunity_usd",
        numberValue(row, "annual_opportunity_usd"),
        "USD",
        null,
      ],
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
          JSON.stringify([
            stringValue(row, "source_row_id"),
            stringValue(row, "source_file_id"),
          ]),
          JSON.stringify(row),
        ],
      );
    }
  }
}

async function insertCanonicalFact(
  client: Client,
  args: Args,
  fact: {
    readonly assertionId: string;
    readonly contractId: string;
    readonly vendorId: string;
    readonly factKey: string;
    readonly numeric: number;
    readonly currency?: string | null;
    readonly unit?: string | null;
    readonly sourceRecordId: string;
    readonly sourceDocumentId?: string | null;
    readonly assertionBasis: string;
    readonly sourceRefs: readonly string[];
    readonly payload: CsvRecord | Record<string, unknown>;
  },
): Promise<void> {
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
                   currency = EXCLUDED.currency,
                   unit = EXCLUDED.unit,
                   source_record_id = EXCLUDED.source_record_id,
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
      SOURCE_SYSTEM,
      fact.sourceRecordId,
      fact.sourceDocumentId ?? null,
      fact.assertionBasis,
      JSON.stringify(fact.sourceRefs),
      JSON.stringify(fact.payload),
    ],
  );
}

async function upsertChangeOrderFacts(
  client: Client,
  args: Args,
  changeRows: readonly CsvRecord[],
): Promise<void> {
  const byContract = groupBy(changeRows, "contract_id");
  for (const row of changeRows) {
    const annualized = numberValue(row, "annualized_spend_usd") ?? 0;
    const oneTime = numberValue(row, "one_time_spend_usd") ?? 0;
    await insertCanonicalFact(client, args, {
      assertionId: `${stringValue(row, "source_row_id")}:annualized_spend_usd`,
      contractId: stringValue(row, "contract_id"),
      vendorId: stringValue(row, "vendor_ref"),
      factKey: "change_order.annualized_spend_usd",
      numeric: annualized,
      currency: "USD",
      sourceRecordId: stringValue(row, "source_row_id"),
      sourceDocumentId: stringValue(row, "source_file_id"),
      assertionBasis:
        "Annualized spend from synthetic change-order ledger row.",
      sourceRefs: [
        stringValue(row, "source_row_id"),
        stringValue(row, "source_file_id"),
      ],
      payload: row,
    });
    await insertCanonicalFact(client, args, {
      assertionId: `${stringValue(row, "source_row_id")}:one_time_spend_usd`,
      contractId: stringValue(row, "contract_id"),
      vendorId: stringValue(row, "vendor_ref"),
      factKey: "change_order.one_time_spend_usd",
      numeric: oneTime,
      currency: "USD",
      sourceRecordId: stringValue(row, "source_row_id"),
      sourceDocumentId: stringValue(row, "source_file_id"),
      assertionBasis: "One-time spend from synthetic change-order ledger row.",
      sourceRefs: [
        stringValue(row, "source_row_id"),
        stringValue(row, "source_file_id"),
      ],
      payload: row,
    });
  }

  for (const [contractId, rows] of byContract.entries()) {
    const vendorId = stringValue(rows[0], "vendor_ref");
    const recurring = rows.filter((row) => boolValue(row, "recurring"));
    const annualizedTotal = rows.reduce(
      (total, row) => total + (numberValue(row, "annualized_spend_usd") ?? 0),
      0,
    );
    const recurringAnnualized = recurring.reduce(
      (total, row) => total + (numberValue(row, "annualized_spend_usd") ?? 0),
      0,
    );
    const sourceRefs = rows.map((row) => stringValue(row, "source_row_id"));
    const docRefs = [
      ...new Set(
        rows.map((row) => stringValue(row, "source_file_id")).filter(Boolean),
      ),
    ];
    await insertCanonicalFact(client, args, {
      assertionId: `change_order:${contractId}:annual_change_order_spend`,
      contractId,
      vendorId,
      factKey: "annual_change_order_spend",
      numeric: annualizedTotal,
      currency: "USD",
      sourceRecordId: sourceRefs[0],
      sourceDocumentId: docRefs[0] ?? null,
      assertionBasis: "Sum of annualized change-order spend for this contract.",
      sourceRefs: [...sourceRefs, ...docRefs],
      payload: {
        contract_id: contractId,
        row_count: rows.length,
        synthetic_policy: "synthetic_demo_only_not_client_truth",
      },
    });
    await insertCanonicalFact(client, args, {
      assertionId: `change_order:${contractId}:recurring_change_order_spend`,
      contractId,
      vendorId,
      factKey: "recurring_change_order_spend",
      numeric: recurringAnnualized,
      currency: "USD",
      sourceRecordId: sourceRefs[0],
      sourceDocumentId: docRefs[0] ?? null,
      assertionBasis:
        "Sum of recurring annualized change-order spend for this contract.",
      sourceRefs: [
        ...recurring.map((row) => stringValue(row, "source_row_id")),
        ...docRefs,
      ],
      payload: {
        contract_id: contractId,
        recurring_row_count: recurring.length,
        synthetic_policy: "synthetic_demo_only_not_client_truth",
      },
    });
    await insertCanonicalFact(client, args, {
      assertionId: `change_order:${contractId}:change_order_count`,
      contractId,
      vendorId,
      factKey: "change_order_count",
      numeric: rows.length,
      unit: "row",
      sourceRecordId: sourceRefs[0],
      sourceDocumentId: docRefs[0] ?? null,
      assertionBasis:
        "Count of change-order ledger rows linked to this contract.",
      sourceRefs: [...sourceRefs, ...docRefs],
      payload: {
        contract_id: contractId,
        synthetic_policy: "synthetic_demo_only_not_client_truth",
      },
    });
    if (recurringAnnualized > 0) {
      await insertCanonicalFact(client, args, {
        assertionId: `change_order:${contractId}:recurring_avoidable_pct`,
        contractId,
        vendorId,
        factKey: "recurring_avoidable_pct",
        numeric: 30,
        unit: "%",
        sourceRecordId: sourceRefs[0],
        sourceDocumentId: docRefs[0] ?? null,
        assertionBasis:
          "Conservative synthetic demo assumption for recurring change-order leakage candidate value; finance confirmation remains required.",
        sourceRefs: [
          ...recurring.map((row) => stringValue(row, "source_row_id")),
          ...docRefs,
        ],
        payload: {
          contract_id: contractId,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        },
      });
    }
  }
}

async function upsertPageTextFacts(
  client: Client,
  args: Args,
  pageRows: readonly CsvRecord[],
): Promise<void> {
  for (const row of pageRows) {
    await insertCanonicalFact(client, args, {
      assertionId: `${stringValue(row, "source_row_id")}:page_text_char_count`,
      contractId: stringValue(row, "contract_id"),
      vendorId: stringValue(row, "vendor_ref"),
      factKey: "document.page_text_char_count",
      numeric: stringValue(row, "page_text").length,
      unit: "character",
      sourceRecordId: stringValue(row, "source_row_id"),
      sourceDocumentId: stringValue(row, "source_file_id"),
      assertionBasis:
        "Searchable page text is present for this synthetic contract evidence document.",
      sourceRefs: [
        stringValue(row, "source_row_id"),
        stringValue(row, "source_file_id"),
      ],
      payload: {
        source_file_id: stringValue(row, "source_file_id"),
        source_page: stringValue(row, "source_page"),
        page_text_sha256: stringValue(row, "page_text_sha256"),
        synthetic_policy: "synthetic_demo_only_not_client_truth",
      },
    });
  }
}

async function upsertResourceModelFacts(
  client: Client,
  args: Args,
  resourceRows: readonly CsvRecord[],
): Promise<void> {
  const byContract = groupBy(resourceRows, "contract_id");
  for (const row of resourceRows) {
    const rowId = stringValue(row, "source_row_id");
    const contractId = stringValue(row, "contract_id");
    const vendorId = stringValue(row, "vendor_ref");
    const sourceFileId = stringValue(row, "source_file_id");
    const facts = [
      ["resource_model.fte", numberValue(row, "fte"), null, "FTE"],
      [
        "resource_model.annual_client_bill_rate_usd",
        numberValue(row, "annual_client_bill_rate_usd"),
        "USD",
        null,
      ],
      [
        "resource_model.annual_vendor_cost_usd",
        numberValue(row, "annual_vendor_cost_usd"),
        "USD",
        null,
      ],
      [
        "resource_model.annual_billed_amount_usd",
        numberValue(row, "annual_billed_amount_usd"),
        "USD",
        null,
      ],
    ] as const;
    for (const [factKey, numeric, currency, unit] of facts) {
      if (numeric === null) continue;
      await insertCanonicalFact(client, args, {
        assertionId: `${rowId}:${factKey}`,
        contractId,
        vendorId,
        factKey,
        numeric,
        currency,
        unit,
        sourceRecordId: rowId,
        sourceDocumentId: sourceFileId,
        assertionBasis:
          "Role-level resource model loaded from the managed-services SOW evidence package.",
        sourceRefs: [rowId, sourceFileId],
        payload: row,
      });
    }
  }
  for (const [contractId, rows] of byContract.entries()) {
    const vendorId = stringValue(rows[0], "vendor_ref");
    const sourceRefs = rows.map((row) => stringValue(row, "source_row_id"));
    const sourceFileId = stringValue(rows[0], "source_file_id");
    const aggregateFacts = [
      [
        "resource_model.total_fte",
        rows.reduce((total, row) => total + (numberValue(row, "fte") ?? 0), 0),
        null,
        "FTE",
      ],
      [
        "resource_model.onshore_fte",
        rows
          .filter((row) => stringValue(row, "location_mix") === "onshore")
          .reduce((total, row) => total + (numberValue(row, "fte") ?? 0), 0),
        null,
        "FTE",
      ],
      [
        "resource_model.offshore_fte",
        rows
          .filter((row) => stringValue(row, "location_mix") === "offshore")
          .reduce((total, row) => total + (numberValue(row, "fte") ?? 0), 0),
        null,
        "FTE",
      ],
      [
        "resource_model.annual_billed_amount_usd",
        rows.reduce(
          (total, row) =>
            total + (numberValue(row, "annual_billed_amount_usd") ?? 0),
          0,
        ),
        "USD",
        null,
      ],
      [
        "resource_model.annual_vendor_cost_usd",
        rows.reduce(
          (total, row) =>
            total + (numberValue(row, "annual_vendor_cost_usd") ?? 0),
          0,
        ),
        "USD",
        null,
      ],
    ] as const;
    for (const [factKey, numeric, currency, unit] of aggregateFacts) {
      await insertCanonicalFact(client, args, {
        assertionId: `${contractId}:${factKey}:aggregate`,
        contractId,
        vendorId,
        factKey,
        numeric,
        currency,
        unit,
        sourceRecordId: sourceRefs[0],
        sourceDocumentId: sourceFileId,
        assertionBasis:
          "Contract-level resource economics aggregated from role-level SOW rows.",
        sourceRefs: [...sourceRefs, sourceFileId],
        payload: {
          contract_id: contractId,
          row_count: rows.length,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        },
      });
    }
  }
}

async function upsertPricingBridgeFacts(
  client: Client,
  args: Args,
  rows: readonly CsvRecord[],
): Promise<void> {
  for (const row of rows) {
    const amount = numberValue(row, "amount_usd");
    if (amount === null) continue;
    await insertCanonicalFact(client, args, {
      assertionId: `${stringValue(row, "source_row_id")}:pricing_bridge.amount_usd`,
      contractId: stringValue(row, "contract_id"),
      vendorId: stringValue(row, "vendor_ref"),
      factKey: `pricing_bridge.${stringValue(row, "bridge_component")}.amount_usd`,
      numeric: amount,
      currency: "USD",
      sourceRecordId: stringValue(row, "source_row_id"),
      sourceDocumentId: stringValue(row, "source_file_id"),
      assertionBasis:
        "Pricing bridge row ties resource model, fees, and improvement pool to the contract annual value.",
      sourceRefs: [
        stringValue(row, "source_row_id"),
        stringValue(row, "source_file_id"),
      ],
      payload: row,
    });
  }
}

async function upsertInvoiceLineFacts(
  client: Client,
  args: Args,
  rows: readonly CsvRecord[],
): Promise<void> {
  const byContract = groupBy(rows, "contract_id");
  for (const row of rows) {
    const amount = numberValue(row, "line_amount_usd");
    if (amount === null) continue;
    await insertCanonicalFact(client, args, {
      assertionId: `${stringValue(row, "source_row_id")}:invoice_line.amount_usd`,
      contractId: stringValue(row, "contract_id"),
      vendorId: stringValue(row, "vendor_ref"),
      factKey: `invoice_line.${stringValue(row, "line_type")}.amount_usd`,
      numeric: amount,
      currency: "USD",
      sourceRecordId: stringValue(row, "source_row_id"),
      sourceDocumentId: stringValue(row, "source_file_id"),
      assertionBasis:
        "AP invoice line detail loaded to separate base run charges from change-order and variable support charges.",
      sourceRefs: [
        stringValue(row, "source_row_id"),
        stringValue(row, "source_file_id"),
      ],
      payload: row,
    });
  }
  for (const [contractId, contractRows] of byContract.entries()) {
    const vendorId = stringValue(contractRows[0], "vendor_ref");
    const sourceRefs = contractRows.map((row) =>
      stringValue(row, "source_row_id"),
    );
    const sourceFileId = stringValue(contractRows[0], "source_file_id");
    const changeOrderSpend = contractRows
      .filter((row) => stringValue(row, "line_type") === "change_order")
      .reduce(
        (total, row) => total + (numberValue(row, "line_amount_usd") ?? 0),
        0,
      );
    const aggregateFacts = [
      ["invoice_line.count", contractRows.length, null, "row"],
      ["invoice_line.change_order_spend_usd", changeOrderSpend, "USD", null],
    ] as const;
    for (const [factKey, numeric, currency, unit] of aggregateFacts) {
      await insertCanonicalFact(client, args, {
        assertionId: `${contractId}:${factKey}:aggregate`,
        contractId,
        vendorId,
        factKey,
        numeric,
        currency,
        unit,
        sourceRecordId: sourceRefs[0],
        sourceDocumentId: sourceFileId,
        assertionBasis: "Invoice-line aggregate derived from AP line detail.",
        sourceRefs: [...sourceRefs, sourceFileId],
        payload: {
          contract_id: contractId,
          row_count: contractRows.length,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        },
      });
    }
  }
}

async function upsertBatchOperationFacts(
  client: Client,
  args: Args,
  rows: readonly CsvRecord[],
): Promise<void> {
  const byContract = groupBy(rows, "contract_id");
  for (const row of rows) {
    const rowId = stringValue(row, "source_row_id");
    const facts = [
      [
        "batch_operations.failed_jobs",
        numberValue(row, "failed_jobs"),
        null,
        "job",
      ],
      [
        "batch_operations.late_completion_count",
        numberValue(row, "late_completion_count"),
        null,
        "job",
      ],
      [
        "batch_operations.manual_restarts",
        numberValue(row, "manual_restarts"),
        null,
        "restart",
      ],
    ] as const;
    for (const [factKey, numeric, currency, unit] of facts) {
      if (numeric === null) continue;
      await insertCanonicalFact(client, args, {
        assertionId: `${rowId}:${factKey}`,
        contractId: stringValue(row, "contract_id"),
        vendorId: stringValue(row, "vendor_ref"),
        factKey,
        numeric,
        currency,
        unit,
        sourceRecordId: rowId,
        sourceDocumentId: stringValue(row, "source_file_id"),
        assertionBasis:
          "Operational batch volumetric row loaded from service operations evidence.",
        sourceRefs: [rowId, stringValue(row, "source_file_id")],
        payload: row,
      });
    }
  }
  for (const [contractId, contractRows] of byContract.entries()) {
    const vendorId = stringValue(contractRows[0], "vendor_ref");
    const sourceRefs = contractRows.map((row) =>
      stringValue(row, "source_row_id"),
    );
    const sourceFileId = stringValue(contractRows[0], "source_file_id");
    const aggregateFacts = [
      [
        "batch_operations.failed_jobs_total",
        contractRows.reduce(
          (total, row) => total + (numberValue(row, "failed_jobs") ?? 0),
          0,
        ),
        null,
        "job",
      ],
      [
        "batch_operations.late_completion_total",
        contractRows.reduce(
          (total, row) =>
            total + (numberValue(row, "late_completion_count") ?? 0),
          0,
        ),
        null,
        "job",
      ],
      [
        "batch_operations.manual_restarts_total",
        contractRows.reduce(
          (total, row) => total + (numberValue(row, "manual_restarts") ?? 0),
          0,
        ),
        null,
        "restart",
      ],
    ] as const;
    for (const [factKey, numeric, currency, unit] of aggregateFacts) {
      await insertCanonicalFact(client, args, {
        assertionId: `${contractId}:${factKey}:aggregate`,
        contractId,
        vendorId,
        factKey,
        numeric,
        currency,
        unit,
        sourceRecordId: sourceRefs[0],
        sourceDocumentId: sourceFileId,
        assertionBasis:
          "Contract-level operations aggregate derived from batch/job volumetric evidence.",
        sourceRefs: [...sourceRefs, sourceFileId],
        payload: {
          contract_id: contractId,
          row_count: contractRows.length,
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        },
      });
    }
  }
}

async function upsertQbrFacts(
  client: Client,
  args: Args,
  rows: readonly CsvRecord[],
): Promise<void> {
  for (const row of rows) {
    const rowId = stringValue(row, "source_row_id");
    const facts = [
      ["qbr.run_percent", pctValue(row, "run_percent"), null, "%"],
      ["qbr.transform_percent", pctValue(row, "transform_percent"), null, "%"],
      [
        "qbr.automation_backlog_items",
        numberValue(row, "automation_backlog_items"),
        null,
        "item",
      ],
      [
        "qbr.report_retirement_candidates",
        numberValue(row, "report_retirement_candidates"),
        null,
        "report",
      ],
      [
        "qbr.client_satisfaction_score",
        numberValue(row, "client_satisfaction_score"),
        null,
        "score",
      ],
    ] as const;
    for (const [factKey, numeric, currency, unit] of facts) {
      if (numeric === null) continue;
      await insertCanonicalFact(client, args, {
        assertionId: `${rowId}:${factKey}`,
        contractId: stringValue(row, "contract_id"),
        vendorId: stringValue(row, "vendor_ref"),
        factKey,
        numeric,
        currency,
        unit,
        sourceRecordId: rowId,
        sourceDocumentId: stringValue(row, "source_file_id"),
        assertionBasis:
          "Quarterly business review metric loaded from the vendor scorecard evidence.",
        sourceRefs: [rowId, stringValue(row, "source_file_id")],
        payload: row,
      });
    }
  }
}

async function upsertOptimizationSpine(
  client: Client,
  args: Args,
  sourceFiles: ContractDepthSourceFileInput,
): Promise<void> {
  const contractsById = new Map(
    sourceFiles.contracts.map((contract) => [
      stringValue(contract, "contract_id"),
      contract,
    ]),
  );
  const opportunityIds = sourceFiles.optimizationOpportunities.map((row) =>
    stringValue(row, "opportunity_id"),
  );
  const contractIds = sourceFiles.contracts.map((row) =>
    stringValue(row, "contract_id"),
  );
  const calculationRunIds = opportunityIds.map(
    (opportunityId) => `contract-depth:${opportunityId}:calculation`,
  );
  const requirementIds = opportunityIds.map(
    (opportunityId) => `contract-depth:${opportunityId}:finance-review`,
  );
  const caseIds = contractIds.map(
    (contractId) => `contract-depth:${contractId}:case`,
  );

  await client.query(
    `DELETE FROM source.calculation_output
      WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, calculationRunIds],
  );
  await client.query(
    `DELETE FROM source.calculation_input
      WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, calculationRunIds],
  );
  await client.query(
    `DELETE FROM source.calculation_run
      WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, calculationRunIds],
  );
  await client.query(
    `DELETE FROM source.opportunity_valuation
      WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, opportunityIds],
  );
  await client.query(
    `DELETE FROM source.opportunity_evidence
      WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, opportunityIds],
  );
  await client.query(
    `DELETE FROM source.opportunity_requirement_status
      WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, opportunityIds],
  );
  await client.query(
    `DELETE FROM source.evidence_request
      WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, opportunityIds],
  );
  await client.query(
    `DELETE FROM source.case_opportunity
      WHERE tenant_key = $1 AND dataset_version = $2 AND optimization_case_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, caseIds],
  );
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
      WHERE tenant_key = $1 AND dataset_version = $2 AND requirement_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, requirementIds],
  );
  await client.query(
    `DELETE FROM source.optimization_opportunity
      WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])`,
    [args.tenantKey, args.datasetVersion, opportunityIds],
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
      JSON.stringify([
        "optimization_opportunities.evidence_rows",
        "amount_usd",
      ]),
      JSON.stringify(["candidate_amount_usd"]),
    ],
  );

  for (const contract of sourceFiles.contracts) {
    const contractId = stringValue(contract, "contract_id");
    const spend = spendByContract.get(contractId) ?? [];
    const actualSpend = spend.reduce(
      (total, row) => total + requiredNumber(row, "actual_spend_usd"),
      0,
    );
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
        totalCommittedValue(contract),
        "Baseline uses 12 monthly spend observations from the package-backed Source adapter.",
        JSON.stringify(spend.map((row) => stringValue(row, "source_row_id"))),
        JSON.stringify({
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        }),
      ],
    );
  }

  for (const opportunity of sourceFiles.optimizationOpportunities) {
    const opportunityId = stringValue(opportunity, "opportunity_id");
    const contract = contractsById.get(stringValue(opportunity, "contract_id"));
    if (!contract)
      throw new Error(`Unknown contract for opportunity ${opportunityId}`);
    const opportunityType = stringValue(opportunity, "opportunity_type");
    if (
      ![
        "recoverable_leakage",
        "avoided_cost",
        "negotiated_improvement",
      ].includes(opportunityType)
    ) {
      throw new Error(
        `Unsupported canonical optimization opportunity value_type for ${opportunityId}: ${opportunityType || "<empty>"}`,
      );
    }
    const amount = numberValue(opportunity, "annual_value_usd");
    const amountState =
      stringValue(opportunity, "amount_state") ||
      (amount === null ? "not_sized" : "exact");
    const stage =
      stringValue(opportunity, "stage") ||
      (amount === null ? "signal" : "quantified");
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
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         'package_evidenced', $10, $11, $12,
         'Finance confirmation and owner approval are required before realized value can be claimed.',
         $13, 'standalone_candidate', 'requires_review', $14, $15::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        stringValue(opportunity, "contract_id"),
        stringValue(opportunity, "vendor_ref"),
        opportunityType,
        stage,
        amount,
        amountState,
        numberValue(opportunity, "confidence") ?? 0.8,
        stringValue(contract, "business_owner"),
        stringValue(opportunity, "recommended_action"),
        stringValue(opportunity, "deadline") || null,
        stringValue(opportunity, "title"),
        JSON.stringify({
          ...opportunity,
          amount_low_usd: stringValue(opportunity, "amount_low_usd"),
          amount_high_usd: stringValue(opportunity, "amount_high_usd"),
          amount_state: amountState,
          stage,
          buyer_ask: stringValue(opportunity, "buyer_ask"),
          negotiation_language: stringValue(
            opportunity,
            "negotiation_language",
          ),
          vendor_concession: stringValue(opportunity, "vendor_give"),
          timing_dependency: stringValue(opportunity, "timing_dependency"),
          owner_role: stringValue(opportunity, "owner_role"),
          priority: stringValue(opportunity, "priority"),
          risk_if_ignored: stringValue(opportunity, "risk_if_ignored"),
          finance_confirmation_state: "not_confirmed",
          selected_for_action_state: stringValue(
            opportunity,
            "selected_for_action_state",
          ),
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
       )
       ON CONFLICT (tenant_key, dataset_version, optimization_case_id)
       DO UPDATE SET vendor_id = EXCLUDED.vendor_id,
                     baseline_id = EXCLUDED.baseline_id,
                     case_state = EXCLUDED.case_state,
                     owner = EXCLUDED.owner,
                     next_action = EXCLUDED.next_action,
                     payload = EXCLUDED.payload`,
      [
        args.tenantKey,
        args.datasetVersion,
        caseId,
        stringValue(opportunity, "contract_id"),
        stringValue(opportunity, "vendor_ref"),
        `contract-depth:${stringValue(opportunity, "contract_id")}:baseline`,
        stringValue(contract, "business_owner"),
        stringValue(opportunity, "recommended_action"),
        JSON.stringify({
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        }),
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
      [
        args.tenantKey,
        args.datasetVersion,
        calculationRunId,
        amount,
        evidenceRows.length,
      ],
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
      [
        args.tenantKey,
        args.datasetVersion,
        requirementId,
        stringValue(contract, "business_owner"),
      ],
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

  // Keep claim-level provenance separate from the legacy opportunity row.
  // Existing package amounts are candidate inputs, not reproducible sizing
  // until the calculation rule and inputs can be independently recomputed.
  await client.query(
    `WITH evidence AS (
       SELECT evidence_row.opportunity_id,
         jsonb_agg(jsonb_build_object(
           'sourceSystem', source_system,
           'sourceTable', source_table,
           'sourceRecordId', source_record_id,
           'sourceFileReport', source_file_report,
           'pageSpan', COALESCE(source_span, source_page),
           'reviewState', review_state
         ) ORDER BY source_record_id)
           FILTER (WHERE EXISTS (
             SELECT 1
             FROM source.source_record_snapshot snapshot
             WHERE snapshot.tenant_key = evidence_row.tenant_key
               AND snapshot.dataset_version = evidence_row.dataset_version
               AND snapshot.contract_id = opportunity.contract_id
               AND snapshot.source_record_id = evidence_row.source_record_id
           )) AS source_refs,
         count(*) FILTER (WHERE EXISTS (
           SELECT 1
           FROM source.source_record_snapshot snapshot
           WHERE snapshot.tenant_key = evidence_row.tenant_key
             AND snapshot.dataset_version = evidence_row.dataset_version
             AND snapshot.contract_id = opportunity.contract_id
             AND snapshot.source_record_id = evidence_row.source_record_id
         )) AS resolved_ref_count
       FROM source.opportunity_evidence evidence_row
       JOIN source.optimization_opportunity opportunity
         ON opportunity.tenant_key = evidence_row.tenant_key
        AND opportunity.dataset_version = evidence_row.dataset_version
        AND opportunity.opportunity_id = evidence_row.opportunity_id
       WHERE evidence_row.tenant_key = $1 AND evidence_row.dataset_version = $2
         AND evidence_row.opportunity_id = ANY($3::text[])
       GROUP BY evidence_row.opportunity_id
     )
     INSERT INTO source.opportunity_claim (
       tenant_key, dataset_version, claim_id, opportunity_id, contract_id,
       claim_role, statement, basis, scenario_kind, evidence_status,
       review_status, source_refs, produced_by, load_run_id
     )
     SELECT $1, $2, o.opportunity_id || ':problem', o.opportunity_id, o.contract_id,
       'problem', COALESCE(o.payload->>'label', o.opportunity_id),
       CASE WHEN COALESCE(e.resolved_ref_count, 0) > 0
            THEN 'client_record' ELSE 'not_recorded' END,
       'signed_record',
       CASE WHEN COALESCE(e.resolved_ref_count, 0) > 0
            THEN 'partial' ELSE 'not_established' END,
       'draft', COALESCE(e.source_refs, '[]'::jsonb), 'deterministic_loader', $4
     FROM source.optimization_opportunity o
     LEFT JOIN evidence e ON e.opportunity_id = o.opportunity_id
     WHERE o.tenant_key = $1 AND o.dataset_version = $2
       AND o.opportunity_id = ANY($3::text[])
     ON CONFLICT (tenant_key, dataset_version, claim_id)
     DO UPDATE SET statement = EXCLUDED.statement,
       basis = EXCLUDED.basis, evidence_status = EXCLUDED.evidence_status,
       source_refs = EXCLUDED.source_refs, load_run_id = EXCLUDED.load_run_id,
       updated_at = now()`,
    [args.tenantKey, args.datasetVersion, opportunityIds, args.loadRunId],
  );
  await client.query(
    `INSERT INTO source.opportunity_claim (
       tenant_key, dataset_version, claim_id, opportunity_id, contract_id,
       claim_role, statement, basis, scenario_kind, evidence_status,
       review_status, source_refs, produced_by, load_run_id
     )
     SELECT tenant_key, dataset_version, opportunity_id || ':sizing', opportunity_id,
       contract_id, 'sizing',
       'Sizing remains unestablished until a reproducible calculation is recorded.',
       'not_recorded', 'signed_record', 'not_established', 'draft', '[]'::jsonb,
       'deterministic_loader', $4
     FROM source.optimization_opportunity
     WHERE tenant_key = $1 AND dataset_version = $2
       AND opportunity_id = ANY($3::text[])
     ON CONFLICT (tenant_key, dataset_version, claim_id)
     DO UPDATE SET statement = EXCLUDED.statement,
       basis = EXCLUDED.basis, evidence_status = EXCLUDED.evidence_status,
       source_refs = EXCLUDED.source_refs, load_run_id = EXCLUDED.load_run_id,
       updated_at = now()`,
    [args.tenantKey, args.datasetVersion, opportunityIds, args.loadRunId],
  );
}

async function reconcileCanonicalFactsForPackage(
  client: Client,
  args: Args,
  contractIds: readonly string[],
): Promise<void> {
  if (contractIds.length === 0) {
    throw new Error("Contract-depth package has no contract ids to reconcile.");
  }
  await client.query(
    `DELETE FROM source.canonical_fact_assertion
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND source_system = $3
        AND contract_id = ANY($4::text[])`,
    [args.tenantKey, args.datasetVersion, SOURCE_SYSTEM, contractIds],
  );
}

async function applyLayer3(
  client: Client,
  args: Args,
  sourceFiles: ContractDepthSourceFileInput,
  rows: readonly Layer2Row[],
  expectedLayer2: Record<string, number>,
): Promise<Record<string, number | string>> {
  await assertTables(client, [
    ...REQUIRED_LAYER2_TABLES,
    ...REQUIRED_LAYER3_TABLES,
  ]);
  assertLayer2Matches(expectedLayer2, await layer2Readback(client, args));

  await reconcileCanonicalFactsForPackage(
    client,
    args,
    sourceFiles.contracts.map((contract) =>
      stringValue(contract, "contract_id"),
    ),
  );
  await insertSnapshots(client, args, rows);
  await upsertVendors(client, args, sourceFiles.contracts);
  await upsertContracts(client, args, sourceFiles.contracts);
  await upsertContractContextFacts(client, args, sourceFiles.contracts);
  await upsertContractTerms(client, args, sourceFiles.contractClauses);
  await upsertContractScope(client, args, sourceFiles.applicationScope);
  await upsertSpend(client, args, sourceFiles.monthlySpend);
  await upsertPerformance(client, args, sourceFiles.slaPerformance);
  await upsertUsageFacts(client, args, sourceFiles.saasUsage);
  await upsertChangeOrderFacts(client, args, sourceFiles.changeOrders);
  await upsertPageTextFacts(client, args, sourceFiles.contractPageText);
  await upsertResourceModelFacts(client, args, sourceFiles.resourceModel);
  await upsertPricingBridgeFacts(client, args, sourceFiles.pricingBridge);
  await upsertInvoiceLineFacts(client, args, sourceFiles.invoiceLineDetail);
  await upsertBatchOperationFacts(
    client,
    args,
    sourceFiles.batchJobVolumetrics,
  );
  await upsertQbrFacts(client, args, sourceFiles.qbrScorecards);
  await upsertOptimizationSpine(client, args, sourceFiles);

  return layer3Readback(client, args, sourceFiles);
}

async function layer3Readback(
  client: Client,
  args: Args,
  sourceFiles: ContractDepthSourceFileInput,
): Promise<Record<string, number | string>> {
  const contractIds = sourceFiles.contracts.map((row) =>
    stringValue(row, "contract_id"),
  );
  const opportunityIds = sourceFiles.optimizationOpportunities.map((row) =>
    stringValue(row, "opportunity_id"),
  );
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
       (SELECT count(*)::text FROM source.case_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS case_opportunity,
       (SELECT count(*)::text FROM source.opportunity_evidence WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_evidence,
       (SELECT count(*)::text FROM source.opportunity_claim WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_claim,
       (SELECT count(*)::text FROM source.calculation_run WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS calculation_run,
       (SELECT count(*)::text FROM source.calculation_input WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($6::text[])) AS calculation_input,
       (SELECT count(*)::text FROM source.calculation_output WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($6::text[])) AS calculation_output,
       (SELECT count(*)::text FROM source.opportunity_valuation WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_valuation,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS canonical_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND fact_key = 'document.page_text_char_count' AND contract_id = ANY($3::text[])) AS page_text_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[]) AND (fact_key LIKE 'change_order%' OR fact_key IN ('annual_change_order_spend', 'recurring_change_order_spend', 'recurring_avoidable_pct'))) AS change_order_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[]) AND fact_key LIKE 'resource_model.%') AS resource_model_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[]) AND fact_key LIKE 'pricing_bridge.%') AS pricing_bridge_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[]) AND fact_key LIKE 'invoice_line.%') AS invoice_line_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[]) AND fact_key LIKE 'batch_operations.%') AS batch_operations_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[]) AND fact_key LIKE 'qbr.%') AS qbr_fact_assertion,
       (SELECT coalesce(sum(amount_usd), 0)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[])) AS opportunity_amount_usd,
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = $1 AND contract_id = ANY($3::text[]) AND load_run_id = $5 AND coalesce(raw_payload->>'alternatives_available', '') <> '') AS contracts_with_assessed_alternatives,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($4::text[]) AND payload->>'finance_confirmation_state' = 'not_confirmed') AS opportunities_not_finance_confirmed`,
    [
      args.tenantKey,
      args.datasetVersion,
      contractIds,
      opportunityIds,
      args.loadRunId,
      opportunityIds.map(
        (opportunityId) => `contract-depth:${opportunityId}:calculation`,
      ),
    ],
  );
  const row = result.rows[0] ?? {};
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      Number.isFinite(Number(value)) && value !== "" ? Number(value) : value,
    ]),
  );
}

function expectedLayer3(
  sourceFiles: ContractDepthSourceFileInput,
  rows: readonly Layer2Row[],
): Record<string, number> {
  const opportunityEvidenceRows = sourceFiles.optimizationOpportunities.reduce(
    (total, row) =>
      total +
      stringValue(row, "evidence_rows")
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean).length,
    0,
  );
  const contractsWithChangeOrders = new Set(
    sourceFiles.changeOrders
      .map((row) => stringValue(row, "contract_id"))
      .filter(Boolean),
  );
  const contractsWithRecurringChangeOrders = new Set(
    sourceFiles.changeOrders
      .filter((row) => boolValue(row, "recurring"))
      .map((row) => stringValue(row, "contract_id"))
      .filter(Boolean),
  );
  const usageFactCount = sourceFiles.saasUsage.reduce((total, row) => {
    return (
      total +
      [
        numberValue(row, "entitled_quantity"),
        numberValue(row, "active_quantity"),
        numberValue(row, "unused_quantity"),
        pctValue(row, "utilization_pct"),
        numberValue(row, "annual_opportunity_usd"),
      ].filter((value) => value !== null).length
    );
  }, 0);
  const changeOrderFactCount =
    sourceFiles.changeOrders.length * 2 +
    contractsWithChangeOrders.size * 3 +
    contractsWithRecurringChangeOrders.size;
  const pageTextFactCount = sourceFiles.contractPageText.length;
  const resourceModelFactCount =
    sourceFiles.resourceModel.length * 4 +
    new Set(
      sourceFiles.resourceModel
        .map((row) => stringValue(row, "contract_id"))
        .filter(Boolean),
    ).size *
      5;
  const pricingBridgeFactCount = sourceFiles.pricingBridge.filter(
    (row) => numberValue(row, "amount_usd") !== null,
  ).length;
  const invoiceLineFactCount =
    sourceFiles.invoiceLineDetail.filter(
      (row) => numberValue(row, "line_amount_usd") !== null,
    ).length +
    new Set(
      sourceFiles.invoiceLineDetail
        .map((row) => stringValue(row, "contract_id"))
        .filter(Boolean),
    ).size *
      2;
  const batchOperationsFactCount =
    sourceFiles.batchJobVolumetrics.length * 3 +
    new Set(
      sourceFiles.batchJobVolumetrics
        .map((row) => stringValue(row, "contract_id"))
        .filter(Boolean),
    ).size *
      3;
  const qbrFactCount = sourceFiles.qbrScorecards.reduce((total, row) => {
    return (
      total +
      [
        pctValue(row, "run_percent"),
        pctValue(row, "transform_percent"),
        numberValue(row, "automation_backlog_items"),
        numberValue(row, "report_retirement_candidates"),
        numberValue(row, "client_satisfaction_score"),
      ].filter((value) => value !== null).length
    );
  }, 0);
  const contractContextFactCount = sourceFiles.contracts.filter(
    (row) => stringValue(row, "contract_purpose_summary") !== "",
  ).length;
  return {
    layer2_adapter_rows: rows.length,
    source_record_snapshot: rows.length,
    source_contract: sourceFiles.contracts.length,
    source_contract_term: sourceFiles.contractClauses.length,
    source_contract_scope: sourceFiles.applicationScope.length,
    source_contract_consumption_observation: sourceFiles.monthlySpend.length,
    source_contract_performance_observation: sourceFiles.slaPerformance.length,
    source_contract_service_credit: sourceFiles.slaPerformance.filter(
      (row) => (numberValue(row, "credit_owed_usd") ?? 0) > 0,
    ).length,
    optimization_opportunity: sourceFiles.optimizationOpportunities.length,
    optimization_baseline: sourceFiles.contracts.length,
    optimization_case: new Set(
      sourceFiles.optimizationOpportunities.map((row) =>
        stringValue(row, "contract_id"),
      ),
    ).size,
    case_opportunity: sourceFiles.optimizationOpportunities.length,
    opportunity_evidence: opportunityEvidenceRows,
    opportunity_claim: sourceFiles.optimizationOpportunities.length * 2,
    calculation_run: sourceFiles.optimizationOpportunities.length,
    calculation_input: opportunityEvidenceRows,
    calculation_output: sourceFiles.optimizationOpportunities.length * 2,
    opportunity_valuation: sourceFiles.optimizationOpportunities.length,
    canonical_fact_assertion:
      contractContextFactCount +
      usageFactCount +
      changeOrderFactCount +
      pageTextFactCount +
      resourceModelFactCount +
      pricingBridgeFactCount +
      invoiceLineFactCount +
      batchOperationsFactCount +
      qbrFactCount,
    page_text_fact_assertion: pageTextFactCount,
    change_order_fact_assertion: changeOrderFactCount,
    resource_model_fact_assertion: resourceModelFactCount,
    pricing_bridge_fact_assertion: pricingBridgeFactCount,
    invoice_line_fact_assertion: invoiceLineFactCount,
    batch_operations_fact_assertion: batchOperationsFactCount,
    qbr_fact_assertion: qbrFactCount,
    opportunities_not_finance_confirmed:
      sourceFiles.optimizationOpportunities.length,
    contracts_with_assessed_alternatives: 0,
  };
}

function layer3Failures(
  expected: Record<string, number>,
  actual: Record<string, number | string>,
): string[] {
  return Object.entries(expected)
    .filter(([key, count]) => actual[key] !== count)
    .map(
      ([key, count]) => `${key}: expected ${count}, read ${actual[key] ?? 0}`,
    );
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(
    postgresClientOptions(
      databaseUrl(),
      "source-contract-depth-package-loader",
    ),
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
  const sourceFiles = readSourceFiles(
    args.packageDir,
    args.tenantKey,
    args.datasetVersion,
  );
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

  if (
    adapted.qualityGate.status !== "PASS" ||
    projection.qualityGate.status !== "PASS"
  ) {
    console.log(JSON.stringify(plan, null, 2));
    throw new Error("Package quality gate failed; refusing Azure load.");
  }

  if (args.mode === "plan") {
    console.log(JSON.stringify(plan, null, 2));
    if (shouldEmitProofBundle()) {
      emitProofBundle(args.proofDir);
    }
    return;
  }

  const result = await withClient(async (client) => {
    if (args.mode === "apply-layer2") {
      requireApplyApproval(args);
      await client.query("BEGIN");
      try {
        await applyLayer2(client, args, rows, packageHash, adapted.qualityGate);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        await writeRunStatus(
          client,
          args,
          packageHash,
          "failed",
          0,
          adapted.qualityGate,
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
        throw error;
      }
      const readback = await layer2Readback(client, args);
      return {
        ...plan,
        event: "source_contract_depth_package_layer2_applied",
        layer2_readback: readback,
        layer2_readback_failures: Object.entries(expectedAdapterCounts)
          .filter(([name, count]) => readback[name] !== count)
          .map(
            ([name, count]) =>
              `${name}: expected ${count}, read ${readback[name] ?? 0}`,
          ),
      };
    }

    if (args.mode === "apply-layer3") {
      requireApplyApproval(args);
      await client.query("BEGIN");
      let readback: Record<string, number | string>;
      try {
        readback = await applyLayer3(
          client,
          args,
          sourceFiles,
          rows,
          expectedAdapterCounts,
        );
        const expected = expectedLayer3(sourceFiles, rows);
        const failures = layer3Failures(expected, readback);
        await writeRunStatus(
          client,
          args,
          packageHash,
          failures.length ? "failed" : "completed",
          rows.length,
          adapted.qualityGate,
          readback,
        );
        if (failures.length)
          throw new Error(`Layer 3 readback failed: ${failures.join("; ")}`);
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
      layer3_readback_failures: layer3Failures(
        expectedLayer3(sourceFiles, rows),
        layer3,
      ),
    };
  });

  writeJson(path.join(args.proofDir, "result.json"), result);
  console.log(JSON.stringify(result, null, 2));
  if (shouldEmitProofBundle()) {
    emitProofBundle(args.proofDir);
  }
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

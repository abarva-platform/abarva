import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

import { stageFileToBlob } from "@/lib/context-ingestion/blob-stager";
import { commitContextBatch } from "@/lib/context-ingestion/context-commit";
import { loadCsvUploadToTenantContext } from "@/lib/context-ingestion/csv-upload-connector";
import { loadJsonlGraphEdges } from "@/lib/context-ingestion/jsonl-graph-loader";
import { getTemplateById } from "@/lib/context-ingestion/template-registry";
import {
  DIMENSION_FAMILY_MAP,
  type ContextDimension,
  type ContextDimensionFamily,
} from "@/lib/context-ingestion/types";
import { loadYamlToContext } from "@/lib/context-ingestion/yaml-loader";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

const TENANT_KEY = process.env.TENANT_KEY ?? "first-capital";
const CLIENT_ID =
  process.env.CLIENT_ID ?? "a75687bf-71b9-4524-ab4e-68ae3f28d200";
const DATASET_PATH =
  process.env.DATASET_PATH ?? "datasets/first-capital-financial-synthetic-v2";
const UPLOADED_BY = process.env.UPLOADED_BY ?? "aca-seed-job";

interface ManifestLoadEntry {
  order: number;
  type?: string;
  family?: string;
  dimension?: string;
  file: string;
  template_id?: string;
}

interface FileReceipt {
  file: string;
  order: number;
  type: "yaml" | "csv" | "jsonl";
  dimension: string | null;
  dimensionFamily: string | null;
  records: number;
  facts: number;
  chunks: number;
  edges: number;
  blobUrl: string | null;
  blobStaged: boolean;
  status: "loaded" | "graph_loaded";
}

const CLASSIFICATION_BY_FAMILY: Record<
  ContextDimensionFamily,
  {
    domainSegment: string;
    businessFunction: string;
  }
> = {
  enterprise_operating_model: {
    domainSegment: "OPERATIONS",
    businessFunction: "CORPORATE",
  },
  technology_estate: {
    domainSegment: "INFRASTRUCTURE",
    businessFunction: "IT",
  },
  data_connectivity: {
    domainSegment: "DATA_ANALYTICS",
    businessFunction: "IT",
  },
  financial_commercial: {
    domainSegment: "ERP",
    businessFunction: "FINANCE",
  },
  execution_operations: {
    domainSegment: "OPERATIONS",
    businessFunction: "IT",
  },
  governance_ai_evidence: {
    domainSegment: "SECURITY_IDENTITY",
    businessFunction: "COMPLIANCE_LEGAL",
  },
  personas_workforce: {
    domainSegment: "HR_WORKFORCE",
    businessFunction: "HUMAN_RESOURCES",
  },
};

const TOWER_SUPPLEMENT_ENTRIES: ManifestLoadEntry[] = [
  {
    order: 7,
    family: "execution_operations",
    dimension: "initiative_milestones",
    file: "ai-control-tower/T01_initiative-milestones.csv",
    template_id: "initiative-milestones",
  },
  {
    order: 7,
    family: "execution_operations",
    dimension: "benefit_realization",
    file: "ai-control-tower/T02_benefit-realization.csv",
    template_id: "benefit-realization",
  },
  {
    order: 7,
    family: "financial_commercial",
    dimension: "ai_spend_by_initiative",
    file: "ai-control-tower/T08_ai-spend-by-initiative.csv",
    template_id: "ai-spend-by-initiative",
  },
  {
    order: 7,
    family: "governance_ai_evidence",
    dimension: "gate_approval_history",
    file: "ai-control-tower/T10_gate-approval-history.csv",
    template_id: "gate-approval-history",
  },
  {
    order: 8,
    family: "execution_operations",
    dimension: "servicenow_automation_metrics",
    file: "ai-control-tower/T05_servicenow-automation-metrics.csv",
    template_id: "servicenow-automation-metrics",
  },
  {
    order: 9,
    family: "personas_workforce",
    dimension: "copilot_adoption_by_function",
    file: "ai-control-tower/T03_copilot-adoption-by-function.csv",
    template_id: "copilot-adoption-by-function",
  },
  {
    order: 9,
    family: "technology_estate",
    dimension: "erp_platform_agents",
    file: "ai-control-tower/T04_erp-platform-agents.csv",
    template_id: "erp-platform-agents",
  },
  {
    order: 9,
    family: "execution_operations",
    dimension: "function_ai_productivity_scorecard",
    file: "ai-control-tower/T06_function-ai-productivity-scorecard.csv",
    template_id: "function-ai-productivity-scorecard",
  },
  {
    order: 9,
    family: "governance_ai_evidence",
    dimension: "model_risk_inventory",
    file: "ai-control-tower/T07_model-risk-inventory.csv",
    template_id: "model-risk-inventory",
  },
  {
    order: 9,
    family: "governance_ai_evidence",
    dimension: "ai_risk_register",
    file: "ai-control-tower/T09_ai-risk-register.csv",
    template_id: "ai-risk-register",
  },
];

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("first_capital_manifest_invalid");
  }
  return value as Record<string, unknown>;
}

function cleanManifestFile(value: string): string {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`first_capital_manifest_unsafe_file:${value}`);
  }
  return normalized;
}

function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function mimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".yaml") || lower.endsWith(".yml"))
    return "application/x-yaml";
  if (lower.endsWith(".jsonl")) return "application/x-ndjson";
  return "text/csv";
}

function entryType(fileName: string): "yaml" | "csv" | "jsonl" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".jsonl")) return "jsonl";
  return "csv";
}

async function readManifest(datasetRoot: string): Promise<ManifestLoadEntry[]> {
  const manifestText = await fs.readFile(
    path.join(datasetRoot, "manifest.yaml"),
    "utf8",
  );
  const raw = asObject(yaml.load(manifestText));
  const loadOrder = raw.load_order;
  if (!Array.isArray(loadOrder)) throw new Error("manifest_load_missing_order");
  const baseEntries = loadOrder.map((entry) => {
    const object = asObject(entry);
    return {
      order: Number(object.order ?? 999),
      type: typeof object.type === "string" ? object.type : undefined,
      family: typeof object.family === "string" ? object.family : undefined,
      dimension:
        typeof object.dimension === "string" ? object.dimension : undefined,
      file: cleanManifestFile(String(object.file ?? "")),
      template_id:
        typeof object.template_id === "string" ? object.template_id : undefined,
    } satisfies ManifestLoadEntry;
  });
  const present = new Set(baseEntries.map((entry) => entry.file));
  return [
    ...baseEntries,
    ...TOWER_SUPPLEMENT_ENTRIES.filter((entry) => !present.has(entry.file)),
  ].sort((a, b) => {
    if (a.type === "relationship_graph") return 1;
    if (b.type === "relationship_graph") return -1;
    return a.order - b.order || a.file.localeCompare(b.file);
  });
}

function isMissingOptionalTable(
  table: string,
  error: { message: string } | null,
): boolean {
  return (
    table === "data_ingestion_runs" &&
    /relation ["']?data_ingestion_runs["']? does not exist/i.test(
      error?.message ?? "",
    )
  );
}

async function tenantScopedDelete(table: string): Promise<number> {
  const db = getAzureWriteFluentClient();
  const result = await db
    .from(table)
    .delete({ count: "exact" })
    .eq("tenant_key", TENANT_KEY);
  if (result.error) {
    if (isMissingOptionalTable(table, result.error)) return 0;
    throw new Error(`first_capital_delete_failed:${table}:${result.error.message}`);
  }
  return result.count ?? 0;
}

async function resetTenantContext(): Promise<Record<string, number>> {
  const deleted: Record<string, number> = {};
  for (const table of [
    "enterprise_context_relationships",
    "enterprise_context_evidence",
    "enterprise_context_facts",
    "enterprise_context_chunks",
    "enterprise_context_records",
    "enterprise_context_source_files",
    "enterprise_context_sources",
    "data_ingestion_runs",
  ]) {
    deleted[table] = await tenantScopedDelete(table);
  }
  return deleted;
}

async function loadFile(
  datasetRoot: string,
  entry: ManifestLoadEntry,
): Promise<FileReceipt> {
  const db = getAzureWriteFluentClient();
  const filePath = path.join(datasetRoot, cleanManifestFile(entry.file));
  const bytes = await fs.readFile(filePath);
  const fileText = bytes.toString("utf8");
  const type = entryType(entry.file);
  const dimension = entry.dimension as ContextDimension | undefined;
  const dimensionFamily = (
    entry.family ??
    (dimension ? DIMENSION_FAMILY_MAP[dimension] : null)
  ) as ContextDimensionFamily | null;

  if (type === "jsonl" || entry.type === "relationship_graph") {
    const staged = await stageFileToBlob({
      tenantKey: TENANT_KEY,
      dimensionFamily: "relationship_graph",
      fileName: path.basename(entry.file),
      fileBytes: bytes,
      mimeType: mimeType(entry.file),
      recordCount: fileText.split(/\r?\n/).filter(Boolean).length,
    });
    const result = await loadJsonlGraphEdges({
      jsonlText: fileText,
      tenantKey: TENANT_KEY,
      db,
    });
    return {
      file: entry.file,
      order: entry.order,
      type: "jsonl",
      dimension: null,
      dimensionFamily: null,
      records: 0,
      facts: 0,
      chunks: 0,
      edges: result.edgesWritten,
      blobUrl: staged.blobUrl,
      blobStaged: staged.staged,
      status: "graph_loaded",
    };
  }

  if (!dimension || !dimensionFamily || !entry.template_id) {
    throw new Error(`first_capital_manifest_missing_dimension:${entry.file}`);
  }
  const template = getTemplateById(entry.template_id, { tenantKey: TENANT_KEY });
  if (!template) {
    throw new Error(`first_capital_unknown_template:${entry.template_id}`);
  }

  const staged = await stageFileToBlob({
    tenantKey: TENANT_KEY,
    dimensionFamily,
    fileName: path.basename(entry.file),
    fileBytes: bytes,
    mimeType: mimeType(entry.file),
  });

  if (type === "yaml") {
    const parsed = await loadYamlToContext({
      yamlText: fileText,
      tenantKey: TENANT_KEY,
      fileName: entry.file,
      templateId: entry.template_id,
    });
    const receipt = await commitContextBatch(
      {
        clientId: CLIENT_ID,
        tenantKey: TENANT_KEY,
        dimension,
        dimensionFamily,
        templateId: entry.template_id,
        fileName: entry.file,
        uploadedBy: UPLOADED_BY,
        sourceFileHash: sha256(bytes),
        sourcePathBase: staged.blobUrl,
        blobUrl: staged.blobUrl,
        blobContainer: staged.blobContainer,
        blobObjectKey: staged.blobObjectKey,
        byteSize: bytes.byteLength,
        loadOrder: entry.order,
        records: parsed.records,
        facts: parsed.facts,
      },
      db,
    );
    return {
      file: entry.file,
      order: entry.order,
      type,
      dimension,
      dimensionFamily,
      records: receipt.recordsUpserted,
      facts: receipt.factsUpserted,
      chunks: receipt.chunksUpserted,
      edges: 0,
      blobUrl: staged.blobUrl,
      blobStaged: staged.staged,
      status: "loaded",
    };
  }

  const result = await loadCsvUploadToTenantContext({
    clientId: CLIENT_ID,
    tenantKey: TENANT_KEY,
    uploadedBy: UPLOADED_BY,
    fileName: entry.file,
    csvText: fileText,
    sourceBlob: {
      bucket: staged.blobContainer ?? "context-drops",
      path: staged.blobObjectKey ?? entry.file,
      sha256: sha256(bytes),
      url: staged.blobUrl,
      byteSize: bytes.byteLength,
    },
    mapping: { templateId: entry.template_id },
    classificationOverrides: CLASSIFICATION_BY_FAMILY[dimensionFamily],
    loadOrder: entry.order,
    db,
  });

  return {
    file: entry.file,
    order: entry.order,
    type,
    dimension,
    dimensionFamily,
    records: result.enterpriseContextPromotion.recordsPromoted,
    facts: result.enterpriseContextPromotion.factsPromoted,
    chunks: result.persistence.chunkRowsInserted,
    edges: 0,
    blobUrl: staged.blobUrl,
    blobStaged: staged.staged,
    status: "loaded",
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const datasetRoot = path.resolve(process.cwd(), DATASET_PATH);
  const deleted = await resetTenantContext();
  const entries = await readManifest(datasetRoot);
  const files: FileReceipt[] = [];

  for (const entry of entries) {
    files.push(await loadFile(datasetRoot, entry));
  }

  const receipt = {
    ok: true,
    tenantKey: TENANT_KEY,
    clientId: CLIENT_ID,
    datasetPath: DATASET_PATH,
    startedAt,
    completedAt: new Date().toISOString(),
    deleted,
    files,
    totals: {
      files: files.length,
      records: files.reduce((sum, file) => sum + file.records, 0),
      facts: files.reduce((sum, file) => sum + file.facts, 0),
      chunks: files.reduce((sum, file) => sum + file.chunks, 0),
      edges: files.reduce((sum, file) => sum + file.edges, 0),
      blobStaged: files.filter((file) => file.blobStaged).length,
    },
  };
  console.log(JSON.stringify(receipt, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        tenantKey: TENANT_KEY,
        datasetPath: DATASET_PATH,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

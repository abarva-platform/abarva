import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
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
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ManifestLoadEntry {
  order: number;
  type?: string;
  family?: string;
  dimension?: string;
  file: string;
  template_id?: string;
  description?: string;
}

interface ManifestLoadRequest {
  tenantKey?: string;
  datasetPath?: string;
  dryRun?: boolean;
}

interface LoadPhaseResult {
  file: string;
  order: number;
  type: "yaml" | "csv" | "jsonl";
  dimension: string | null;
  dimensionFamily: string | null;
  status: "validated" | "committed" | "graph_committed" | "skipped";
  records: number;
  facts: number;
  chunks: number;
  edges: number;
  blobUrl: string | null;
  blobStaged: boolean;
  detail: string;
}

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
    throw new Error("manifest_load_invalid_body");
  }
  return value as Record<string, unknown>;
}

function cleanDatasetPath(value: string): string {
  const root = path.resolve(/* turbopackIgnore: true */ process.cwd(), "datasets");
  const resolved = path.resolve(/* turbopackIgnore: true */ process.cwd(), value);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    throw new Error("manifest_load_dataset_path_outside_datasets");
  }
  return resolved;
}

function cleanManifestFile(value: string): string {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`manifest_load_unsafe_file:${value}`);
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
  if (lower.endsWith(".json")) return "application/json";
  return "text/csv";
}

function entryType(fileName: string): "yaml" | "csv" | "jsonl" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".jsonl")) return "jsonl";
  return "csv";
}

async function readManifest(datasetRoot: string): Promise<{
  tenantKey: string;
  clientId: string;
  entries: ManifestLoadEntry[];
}> {
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
      description:
        typeof object.description === "string" ? object.description : undefined,
    } satisfies ManifestLoadEntry;
  });
  const present = new Set(baseEntries.map((entry) => entry.file));
  const supplement = TOWER_SUPPLEMENT_ENTRIES.filter(
    (entry) => !present.has(entry.file),
  );
  return {
    tenantKey: String(raw.tenant_key ?? ""),
    clientId: String(raw.client_id ?? ""),
    entries: [...baseEntries, ...supplement].sort((a, b) => {
      if (a.type === "relationship_graph") return 1;
      if (b.type === "relationship_graph") return -1;
      return a.order - b.order || a.file.localeCompare(b.file);
    }),
  };
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  let body: ManifestLoadRequest;
  try {
    body = (await request.json()) as ManifestLoadRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const requestedTenant = canonicalTenantKey(body.tenantKey ?? "");
    if (!requestedTenant) {
      return NextResponse.json(
        { error: "tenantKey required" },
        { status: 400 },
      );
    }
    if (
      tenancy.clientKey &&
      requestedTenant !== canonicalTenantKey(tenancy.clientKey)
    ) {
      return NextResponse.json(
        { error: "forbidden_cross_tenant" },
        { status: 403 },
      );
    }

    const datasetRoot = cleanDatasetPath(
      body.datasetPath ?? "datasets/first-capital-financial-synthetic-v2",
    );
    const manifest = await readManifest(datasetRoot);
    const tenantKey = requestedTenant || manifest.tenantKey;
    const clientId = tenancy.clientId ?? manifest.clientId;
    const dryRun = Boolean(body.dryRun);
    const db = getAzureWriteFluentClient();
    const phases: LoadPhaseResult[] = [];

    for (const entry of manifest.entries) {
      const filePath = path.join(/* turbopackIgnore: true */ datasetRoot, cleanManifestFile(entry.file));
      const bytes = await fs.readFile(filePath);
      const fileText = bytes.toString("utf8");
      const type = entryType(entry.file);
      const dimension = entry.dimension as ContextDimension | undefined;
      const dimensionFamily = (entry.family ??
        (dimension
          ? DIMENSION_FAMILY_MAP[dimension]
          : null)) as ContextDimensionFamily | null;

      if (type === "jsonl" || entry.type === "relationship_graph") {
        const staged = dryRun
          ? {
              blobUrl: null,
              blobContainer: null,
              blobObjectKey: null,
              staged: false,
            }
          : await stageFileToBlob({
              tenantKey,
              dimensionFamily: "relationship_graph",
              fileName: path.basename(entry.file),
              fileBytes: bytes,
              mimeType: mimeType(entry.file),
              recordCount: fileText.split(/\r?\n/).filter(Boolean).length,
            });
        if (dryRun) {
          phases.push({
            file: entry.file,
            order: entry.order,
            type: "jsonl",
            dimension: null,
            dimensionFamily: null,
            status: "validated",
            records: 0,
            facts: 0,
            chunks: 0,
            edges: fileText.split(/\r?\n/).filter(Boolean).length,
            blobUrl: staged.blobUrl,
            blobStaged: staged.staged,
            detail: "Graph JSONL parsed; dry-run skipped edge writes.",
          });
          continue;
        }
        const graph = await loadJsonlGraphEdges({
          jsonlText: fileText,
          tenantKey,
          db,
        });
        phases.push({
          file: entry.file,
          order: entry.order,
          type: "jsonl",
          dimension: null,
          dimensionFamily: null,
          status: "graph_committed",
          records: 0,
          facts: 0,
          chunks: 0,
          edges: graph.edgesWritten,
          blobUrl: staged.blobUrl,
          blobStaged: staged.staged,
          detail: `${graph.edgesWritten} graph edges written; ${graph.fkResolutionErrors} unresolved edges skipped.`,
        });
        continue;
      }

      if (!dimension || !dimensionFamily || !entry.template_id) {
        throw new Error(`manifest_load_missing_dimension:${entry.file}`);
      }
      const template = getTemplateById(entry.template_id, { tenantKey });
      if (!template) {
        throw new Error(`manifest_load_unknown_template:${entry.template_id}`);
      }

      const staged = dryRun
        ? {
            blobUrl: null,
            blobContainer: null,
            blobObjectKey: null,
            staged: false,
          }
        : await stageFileToBlob({
            tenantKey,
            dimensionFamily,
            fileName: path.basename(entry.file),
            fileBytes: bytes,
            mimeType: mimeType(entry.file),
          });

      if (type === "yaml") {
        const parsed = await loadYamlToContext({
          yamlText: fileText,
          tenantKey,
          fileName: entry.file,
          templateId: entry.template_id,
        });
        if (dryRun) {
          phases.push({
            file: entry.file,
            order: entry.order,
            type,
            dimension,
            dimensionFamily,
            status: "validated",
            records: parsed.records.length,
            facts: parsed.facts.length,
            chunks: 0,
            edges: 0,
            blobUrl: null,
            blobStaged: false,
            detail: "YAML parsed; dry-run skipped blob staging and DB commit.",
          });
          continue;
        }
        const receipt = await commitContextBatch(
          {
            clientId,
            tenantKey,
            dimension,
            dimensionFamily,
            templateId: entry.template_id,
            fileName: entry.file,
            uploadedBy: tenancy.userId,
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
        phases.push({
          file: entry.file,
          order: entry.order,
          type,
          dimension,
          dimensionFamily,
          status: "committed",
          records: receipt.recordsUpserted,
          facts: receipt.factsUpserted,
          chunks: receipt.chunksUpserted,
          edges: 0,
          blobUrl: receipt.blobUrl,
          blobStaged: staged.staged,
          detail: "YAML committed to enterprise context.",
        });
        continue;
      }

      if (dryRun) {
        const rowCount = fileText.split(/\r?\n/).filter(Boolean).length - 1;
        phases.push({
          file: entry.file,
          order: entry.order,
          type,
          dimension,
          dimensionFamily,
          status: "validated",
          records: Math.max(0, rowCount),
          facts: 0,
          chunks: 0,
          edges: 0,
          blobUrl: null,
          blobStaged: false,
          detail: "CSV counted; dry-run skipped blob staging and DB commit.",
        });
        continue;
      }

      const result = await loadCsvUploadToTenantContext({
        clientId,
        tenantKey,
        uploadedBy: tenancy.userId,
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
        loadOrder: entry.order,
        db,
      });
      phases.push({
        file: entry.file,
        order: entry.order,
        type,
        dimension,
        dimensionFamily,
        status: "committed",
        records: result.enterpriseContextPromotion.recordsPromoted,
        facts: result.enterpriseContextPromotion.factsPromoted,
        chunks: result.persistence.chunkRowsInserted,
        edges: 0,
        blobUrl: staged.blobUrl,
        blobStaged: staged.staged,
        detail: result.persistence.detail,
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      tenantKey,
      datasetPath: path.relative(process.cwd(), datasetRoot),
      phases,
      totalRecords: phases.reduce((sum, phase) => sum + phase.records, 0),
      totalFacts: phases.reduce((sum, phase) => sum + phase.facts, 0),
      totalChunks: phases.reduce((sum, phase) => sum + phase.chunks, 0),
      totalEdges: phases.reduce((sum, phase) => sum + phase.edges, 0),
      blobUrls: Object.fromEntries(
        phases
          .filter((phase) => phase.blobUrl)
          .map((phase) => [phase.file, phase.blobUrl]),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "manifest_load_failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

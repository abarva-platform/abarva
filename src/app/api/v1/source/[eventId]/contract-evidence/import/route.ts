import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  buildContractEvidenceRuntimeSummary,
  persistContractEvidencePack,
  type SourceContractEvidenceArchetypeKey,
  type SourceContractEvidenceFamily,
  type SourceContractEvidenceRowInput,
  type SourceContractEvidenceSourceType,
} from "@/lib/source/contract-evidence";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ eventId?: string }>;
};

const ARCHETYPES = new Set<SourceContractEvidenceArchetypeKey>([
  "ams_contract_optimization",
  "bpo_contract_optimization",
  "saas_renewal_optimization",
]);

const SOURCE_TYPES = new Set<SourceContractEvidenceSourceType>([
  "client_uploaded",
  "system_export",
  "vendor_provided",
  "synthetic_demo",
]);

const FAMILIES = new Set<SourceContractEvidenceFamily>([
  "contract_baseline",
  "invoice_summary",
  "invoice_exception",
  "sla_performance",
  "ticket_volume",
  "staffing_model",
  "change_order",
  "renewal_terms",
  "evidence_reference",
]);

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const tenancy = await requireTenancy();
    const { eventId } = await params;
    if (!eventId?.trim()) {
      return Response.json(
        { ok: false, error: "missing_event_id" },
        { status: 400 },
      );
    }

    const activeClient =
      (await getActiveClientRow(tenancy.clientKey).catch(() => null)) ?? {
        id: tenancy.clientId,
        key: tenancy.clientKey,
        name: tenancy.clientKey,
      };
    if (!activeClient?.key || activeClient.id !== tenancy.clientId) {
      return Response.json(
        { ok: false, error: "no_active_client" },
        { status: 403 },
      );
    }

    const event = await getSourcingEventForResolvedClient(eventId, {
      activeClientKey: activeClient.key,
      activeClientName: activeClient.name ?? activeClient.key,
      tenancy,
    });
    if (!event) {
      return Response.json(
        { ok: false, error: "not_found", detail: "No Source event found for the active client." },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = parseImportBody(body);
    if (!parsed.ok) {
      return Response.json(
        { ok: false, error: "bad_request", detail: parsed.detail },
        { status: 400 },
      );
    }

    const persisted = await persistContractEvidencePack(
      {
        tenantKey: activeClient.key,
        sourceEventId: event.id,
        ...parsed.input,
      },
      getAzureWriteFluentClient(),
    );
    const summary = buildContractEvidenceRuntimeSummary({
      sourceEventId: event.id,
      tenantKey: activeClient.key,
      manifests: [
        {
          id: persisted.manifestId,
          evidencePackName: persisted.manifest.evidence_pack_name,
          sourceType: persisted.manifest.source_type,
          validationStatus: persisted.manifest.validation_status,
          rowCount: persisted.manifest.row_count,
          requiredFamilyCount: persisted.manifest.required_family_count,
          coveredRequiredFamilyCount:
            persisted.manifest.covered_required_family_count,
          missingFamilies: persisted.manifest.missing_required_families,
          warnings: persisted.manifest.warnings,
          sourceArtifactId: persisted.manifest.source_artifact_id,
          createdAt: new Date().toISOString(),
        },
      ],
      rows: persisted.rows.map((row) => ({
        evidence_family: row.evidence_family,
        validation_status: row.validation_status,
      })),
      metrics: persisted.metrics.map((metric) => ({
        key: metric.metric_key,
        label: metric.metric_label,
        value: metric.metric_value,
        unit: metric.unit,
        family: metric.evidence_family,
        confidence: metric.confidence,
      })),
    });

    return Response.json({
      ok: true,
      sourceEventId: event.id,
      tenantKey: activeClient.key,
      manifestId: persisted.manifestId,
      summary,
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: "internal_error",
          detail: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  }
}

function parseImportBody(body: unknown):
  | {
      ok: true;
      input: {
        sourceArtifactId?: string | null;
        archetypeKey: SourceContractEvidenceArchetypeKey;
        evidencePackName: string;
        uploadBatchId: string;
        sourceType: SourceContractEvidenceSourceType;
        rows: SourceContractEvidenceRowInput[];
        metadata?: Record<string, unknown>;
      };
    }
  | { ok: false; detail: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, detail: "JSON body is required." };
  }
  const record = body as Record<string, unknown>;
  const archetypeKey = stringValue(record.archetypeKey);
  const sourceType = stringValue(record.sourceType) ?? "client_uploaded";
  const evidencePackName = stringValue(record.evidencePackName);
  const uploadBatchId = stringValue(record.uploadBatchId);
  const rows = record.rows;

  if (!archetypeKey || !ARCHETYPES.has(archetypeKey as SourceContractEvidenceArchetypeKey)) {
    return { ok: false, detail: "archetypeKey must be a supported Source contract evidence archetype." };
  }
  if (!SOURCE_TYPES.has(sourceType as SourceContractEvidenceSourceType)) {
    return { ok: false, detail: "sourceType is not supported." };
  }
  if (!evidencePackName) {
    return { ok: false, detail: "evidencePackName is required." };
  }
  if (!uploadBatchId) {
    return { ok: false, detail: "uploadBatchId is required." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, detail: "At least one structured evidence row is required." };
  }

  const parsedRows: SourceContractEvidenceRowInput[] = [];
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== "object") {
      return { ok: false, detail: `Row ${index + 1} must be an object.` };
    }
    const rowRecord = row as Record<string, unknown>;
    const family = stringValue(rowRecord.family);
    if (!family || !FAMILIES.has(family as SourceContractEvidenceFamily)) {
      return { ok: false, detail: `Row ${index + 1} has an unsupported evidence family.` };
    }
    if (!rowRecord.payload || typeof rowRecord.payload !== "object") {
      return { ok: false, detail: `Row ${index + 1} requires a payload object.` };
    }
    parsedRows.push({
      family: family as SourceContractEvidenceFamily,
      sourceSheet: stringValue(rowRecord.sourceSheet),
      sourceRowNumber:
        typeof rowRecord.sourceRowNumber === "number"
          ? rowRecord.sourceRowNumber
          : undefined,
      payload: rowRecord.payload as Record<string, unknown>,
    });
  }

  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : undefined;

  return {
    ok: true,
    input: {
      sourceArtifactId: stringValue(record.sourceArtifactId) ?? null,
      archetypeKey: archetypeKey as SourceContractEvidenceArchetypeKey,
      evidencePackName,
      uploadBatchId,
      sourceType: sourceType as SourceContractEvidenceSourceType,
      rows: parsedRows,
      metadata,
    },
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  detectStructuredUploadFormat,
  loadCsvUploadToTenantContext,
  parseCsvUpload,
  parseFieldMappings,
  parseTextColumns,
} from "@/lib/context-ingestion/csv-upload-connector";
import { validatePilotUploadAttestation } from "@/lib/context-ingestion/upload-attestation";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";
import {
  parseGeoModifierRows,
  parseInternalRateCardRows,
  parseVendorRateCardRows,
} from "@/lib/programs/expert-kernel/rate-card/rate-card-row-parser";
import { getRateCardTemplateById } from "@/lib/programs/expert-kernel/rate-card/rate-card-templates";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { recordContextRefreshEvent } from "@/lib/intelligence/refresh-events";
import { LEGACY_CONTROLLED_IMPORT_WARNING } from "@/lib/admin/setup-control";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const DIRECT_CONTEXT_BUCKET = "context-uploads";
const REVIEW_ONLY_EXTENSIONS = [".xlsx", ".pdf", ".docx", ".pptx", ".zip"];
const LEGACY_CONTROLLED_IMPORT = {
  legacyControlledImport: true,
  directActiveMutationPossible: true,
  candidateRunwayBypassed: true,
  warning: LEGACY_CONTROLLED_IMPORT_WARNING,
} as const;

function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function safePathPart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "upload"
  );
}

function compactTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9a-z]/gi, "")
    .slice(0, 15);
}

function metadataValue(value: unknown): string {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9 _.-]/g, "_")
    .slice(0, 256);
}

function detectReviewOnlyUploadFormat(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  return (
    REVIEW_ONLY_EXTENSIONS.find((extension) =>
      lower.endsWith(extension),
    )?.slice(1) ?? null
  );
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const clientId = formString(formData, "clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }
  if (clientId !== tenancy.clientId) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const uploadFormat = detectStructuredUploadFormat(file.name);
  const reviewOnlyFormat = detectReviewOnlyUploadFormat(file.name);
  if (!uploadFormat && !reviewOnlyFormat) {
    return NextResponse.json(
      {
        error: "unsupported_file_type",
        detail:
          "Use CSV, JSON, JSONL, or YAML for direct commit. Excel, PDF, Word, PowerPoint, and ZIP files can be preserved for review.",
      },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file exceeds ${MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  const attestation = validatePilotUploadAttestation({
    accepted: formData.get("operatorAttestationAccepted"),
    version: formData.get("operatorAttestationVersion"),
    authorityConfirmed: formData.get("operatorDataAuthorityConfirmed"),
    dataUseConfirmed: formData.get("operatorDataUseConfirmed"),
    sensitiveDataConfirmed: formData.get("operatorSensitiveDataConfirmed"),
    note: formData.get("operatorAttestationNote"),
  });
  if ("error" in attestation) {
    return NextResponse.json(attestation, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const dataProtection = evaluateSensitiveUpload({
    filename: file.name,
    mimeType: file.type || "text/csv",
    bytes,
    declaredClassification: formData.get("dataClassification"),
  });
  if (dataProtection.decision === "quarantine") {
    return sensitiveUploadRejectedResponse(dataProtection) as NextResponse;
  }

  const csvText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  try {
    const templateId = formString(formData, "templateId");
    const tenantKey = canonicalTenantKey(tenancy.clientKey);
    const fileHash = crypto
      .createHash("sha256")
      .update(Buffer.from(bytes))
      .digest("hex");
    const blobPath = [
      safePathPart(tenantKey),
      uploadFormat ? "_direct-csv" : "_review-required",
      fileHash.slice(0, 12),
      compactTimestamp(),
      safePathPart(file.name),
    ].join("/");
    if (!uploadFormat) {
      await getObjectStorageAdapter().upload(
        DIRECT_CONTEXT_BUCKET,
        blobPath,
        Buffer.from(bytes),
        {
          contentType: file.type || "application/octet-stream",
          upsert: false,
          metadata: {
            tenantClientKey: metadataValue(tenantKey),
            tenantKey: metadataValue(tenantKey),
            clientId: metadataValue(tenancy.clientId),
            sourceSystem: "admin_review_required_upload",
            templateId: metadataValue(templateId ?? "auto"),
            attestationVersion: metadataValue(attestation.version),
            declaredClassification: metadataValue(
              formString(formData, "dataClassification") ?? "confidential",
            ),
            sha256: fileHash,
            uploadedBy: metadataValue(tenancy.userId),
            initiatedByUserId: metadataValue(tenancy.userId),
            reviewRequired: "true",
            uploadFormat: metadataValue(reviewOnlyFormat ?? "binary"),
          },
        },
      );

      return NextResponse.json(
        {
          ok: false,
          reviewRequired: true,
          readyForCommit: false,
          rowsParsed: 0,
          factsPromoted: 0,
          detail:
            "This file was preserved for review. Document and workbook facts are not committed until reviewed with source-location evidence.",
          attestation,
          dataProtection,
          persistence: {
            status: "needs_operator_review",
            detail:
              "The original file was staged for review; no tenant context rows or facts were committed.",
          },
          legacyControlledImport: {
            ...LEGACY_CONTROLLED_IMPORT,
            directActiveMutationPossible: false,
            candidateRunwayBypassed: false,
          },
          sourceBlob: {
            bucket: DIRECT_CONTEXT_BUCKET,
            path: blobPath,
            sha256: fileHash,
          },
        },
        { status: 202 },
      );
    }

    const rateCardTemplate = templateId
      ? getRateCardTemplateById(templateId)
      : null;
    if (rateCardTemplate) {
      if (uploadFormat !== "csv") {
        return NextResponse.json(
          {
            error: "unsupported_file_type",
            detail: "Rate-card validation currently requires a .csv file.",
          },
          { status: 400 },
        );
      }
      const parsed = parseCsvUpload(csvText);
      const preview =
        rateCardTemplate.objectType === "rate_card_internal"
          ? parseInternalRateCardRows(parsed.rows)
          : rateCardTemplate.objectType === "rate_card_vendor"
            ? parseVendorRateCardRows(parsed.rows)
            : parseGeoModifierRows(parsed.rows);

      return NextResponse.json(
        {
          ok: false,
          mode: "rate_card_validation_preview",
          readyForCommit: preview.validation.valid,
          template: preview.template,
          rowsParsed: preview.rows.length,
          validation: preview.validation,
          attestation,
          dataProtection,
          persistence: {
            status: "validation_only",
            detail: preview.validation.valid
              ? "Rate-card rows validated. Commit to the tenant data plane is blocked until the rate-card commit slice lands."
              : "Rate-card rows were parsed but did not pass validation. Fix the listed errors before commit.",
          },
          legacyControlledImport: {
            ...LEGACY_CONTROLLED_IMPORT,
            directActiveMutationPossible: false,
            candidateRunwayBypassed: false,
          },
        },
        { status: 202 },
      );
    }

    await getObjectStorageAdapter().upload(
      DIRECT_CONTEXT_BUCKET,
      blobPath,
      Buffer.from(bytes),
      {
        contentType: file.type || "text/csv",
        upsert: false,
        metadata: {
          tenantClientKey: metadataValue(tenantKey),
          tenantKey: metadataValue(tenantKey),
          clientId: metadataValue(tenancy.clientId),
          sourceSystem: "admin_direct_csv_upload",
          templateId: metadataValue(templateId ?? "auto"),
          attestationVersion: metadataValue(attestation.version),
          declaredClassification: metadataValue(
            formString(formData, "dataClassification") ?? "confidential",
          ),
          sha256: fileHash,
          uploadedBy: metadataValue(tenancy.userId),
          initiatedByUserId: metadataValue(tenancy.userId),
        },
      },
    );

    const result = await loadCsvUploadToTenantContext({
      clientId: tenancy.clientId,
      tenantKey,
      uploadedBy: tenancy.userId,
      fileName: file.name,
      csvText,
      sourceBlob: {
        bucket: DIRECT_CONTEXT_BUCKET,
        path: blobPath,
        sha256: fileHash,
      },
      attestation,
      mapping: {
        templateId: templateId ?? undefined,
        sourceRecordIdColumn: formString(formData, "sourceRecordIdColumn"),
        titleColumn: formString(formData, "titleColumn"),
        textColumns: parseTextColumns(formData.get("textColumns")),
        fieldMappings: parseFieldMappings(formData.get("fieldMappings")),
        dataClassification: formString(formData, "dataClassification"),
      },
    });

    const classificationMessage =
      result.needsClassificationCount > 0
        ? `${result.needsClassificationCount} record${result.needsClassificationCount === 1 ? "" : "s"} need classification — visit Setup > Triage Queue to confirm.`
        : undefined;
    const refreshEvent = await recordContextRefreshEvent({
      clientId: tenancy.clientId,
      tenantKey,
      triggeredBy: "csv_upload",
      sourceLabel: file.name,
      rowsSeen: result.rowsParsed,
      rowsAccepted: result.enterpriseContextPromotion.recordsPromoted,
      rowsRejected: result.needsClassificationCount,
      factsCreated: result.enterpriseContextPromotion.factsPromoted,
      factsSuperseded: result.enterpriseContextPromotion.factsSuperseded,
      approvalRequired: result.needsClassificationCount > 0,
      affectedSurfaces: ["explore", "coverage", "insights", "change-log"],
      receiptUrl: `${DIRECT_CONTEXT_BUCKET}/${blobPath}`,
    }).catch((error) => {
      console.warn("[csv-upload] refresh event failed", {
        tenantKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    });

    return NextResponse.json(
      {
        ok: result.persistence.status === "inserted",
        ...result,
        needsClassification: result.needsClassificationCount,
        autoInferred: result.autoInferredCount,
        ...(classificationMessage ? { classificationMessage } : {}),
        attestation,
        dataProtection,
        sourceBlob: {
          bucket: DIRECT_CONTEXT_BUCKET,
          path: blobPath,
          sha256: fileHash,
        },
        legacyControlledImport: LEGACY_CONTROLLED_IMPORT,
        refreshEventId: refreshEvent?.id ?? null,
      },
      { status: result.persistence.status === "inserted" ? 200 : 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("csv_") ? 400 : 500;
    return NextResponse.json(
      {
        error: status === 400 ? "csv_upload_invalid" : "csv_upload_failed",
        detail: message,
      },
      { status },
    );
  }
}

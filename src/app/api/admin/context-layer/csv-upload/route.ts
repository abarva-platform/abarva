import { NextRequest, NextResponse } from "next/server";

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  if (!uploadFormat) {
    return NextResponse.json(
      {
        error: "unsupported_file_type",
        detail:
          "Structured context uploads require .csv, .json, .jsonl, .yaml, or .yml.",
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
        },
        { status: 202 },
      );
    }

    const result = await loadCsvUploadToTenantContext({
      clientId: tenancy.clientId,
      tenantKey: canonicalTenantKey(tenancy.clientKey),
      uploadedBy: tenancy.userId,
      fileName: file.name,
      csvText,
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

    return NextResponse.json(
      {
        ok: result.persistence.status === "inserted",
        ...result,
        attestation,
        dataProtection,
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

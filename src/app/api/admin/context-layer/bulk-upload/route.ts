import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  parseBulkContextUploadManifest,
  runBulkContextUpload,
} from "@/lib/context-ingestion/bulk-context-upload";
import { validatePilotUploadAttestation } from "@/lib/context-ingestion/upload-attestation";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function readManifest(formData: FormData): Promise<string> {
  const inline = formString(formData, "manifestJson");
  if (inline) return inline;
  const manifestFile = formData.get("manifest");
  if (manifestFile instanceof File) return manifestFile.text();
  throw new Error("manifest required");
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

  const tenantKey = canonicalTenantKey(tenancy.clientKey);
  const rawMode = formString(formData, "mode");
  const mode =
    rawMode === "stage_and_process" || rawMode === "stage_and_enqueue"
      ? rawMode
      : "validate_only";

  try {
    const manifest = parseBulkContextUploadManifest(
      await readManifest(formData),
      tenantKey,
    );
    const uploadedFiles = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File);
    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "files required" }, { status: 400 });
    }
    for (const file of uploadedFiles) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `file exceeds ${MAX_FILE_BYTES} bytes`, fileName: file.name },
          { status: 413 },
        );
      }
    }

    const result = await runBulkContextUpload({
      clientId: tenancy.clientId,
      tenantKey,
      uploadedBy: tenancy.userId,
      manifest,
      mode,
      attestation,
      files: await Promise.all(
        uploadedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          bytes: await file.arrayBuffer(),
        })),
      ),
    });

    return NextResponse.json(result, {
      status: mode === "validate_only" ? 202 : 200,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const status =
      detail.startsWith("bulk_manifest_") ||
      detail.startsWith("bulk_upload_") ||
      detail === "manifest required"
        ? 400
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: status === 400 ? "bulk_upload_invalid" : "bulk_upload_failed",
        detail,
      },
      { status },
    );
  }
}

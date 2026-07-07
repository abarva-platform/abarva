import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { validatePilotUploadAttestation } from "@/lib/context-ingestion/upload-attestation";
import { commitAcceptedProposals } from "@/lib/context-ingestion/loader/commit-adapter";
import type { MappingProposal } from "@/lib/context-ingestion/loader/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function parseAcceptedProposals(raw: string | null): MappingProposal[] {
  if (!raw) throw new Error("loader_commit_missing_accepted");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("loader_commit_accepted_not_json");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("loader_commit_no_accepted_files");
  }
  return parsed as MappingProposal[];
}

/**
 * Admin Loader — "commit" stage. Takes operator-accepted proposals and the
 * original files, synthesizes a manifest, and runs the GOVERNED bulk pipeline
 * (blob staging + attestation + queue + tenant-context commit). Reuses the
 * existing governed path — no parallel ingestion route.
 */
export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const clientId = (formData.get("clientId") as string | null)?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }
  if (clientId !== tenancy.clientId) {
    return NextResponse.json({ error: "forbidden_cross_tenant" }, { status: 403 });
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

  const rawMode = (formData.get("mode") as string | null)?.trim();
  const mode =
    rawMode === "stage_and_process" || rawMode === "stage_and_enqueue" ? rawMode : "validate_only";
  const loadName = ((formData.get("loadName") as string | null)?.trim()) || "admin-loader";

  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  try {
    const accepted = parseAcceptedProposals(formData.get("acceptedProposals") as string | null);

    const rawFiles = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (rawFiles.length === 0) {
      return NextResponse.json({ error: "files required" }, { status: 400 });
    }
    for (const file of rawFiles) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `file exceeds ${MAX_FILE_BYTES} bytes`, fileName: file.name },
          { status: 413 },
        );
      }
    }
    const files = await Promise.all(
      rawFiles.map(async (file) => ({
        name: file.name,
        ...(file.type ? { type: file.type } : {}),
        bytes: await file.arrayBuffer(),
      })),
    );

    const { result, skippedReviewRequired } = await commitAcceptedProposals({
      loadName,
      accepted,
      tenantKey,
      clientId: tenancy.clientId,
      uploadedBy: tenancy.userId,
      attestation,
      mode,
      files,
    });

    return NextResponse.json(
      { ok: result.ok, mode, result, skippedReviewRequired },
      { status: mode === "validate_only" ? 202 : 200 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const status = detail.startsWith("loader_commit_") ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: status === 400 ? "loader_commit_invalid" : "loader_commit_failed", detail },
      { status },
    );
  }
}

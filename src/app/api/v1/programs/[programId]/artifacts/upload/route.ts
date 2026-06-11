// POST /api/v1/programs/:programId/artifacts/upload  (multipart/form-data)
// Uploads a file as durable Move evidence: stores the bytes in Azure Blob and
// registers it in move_artifacts so it appears in the File Cabinet. This is the
// in-tool entry point for the off-platform evidence (meeting notes, session
// outputs, data exports, filled templates) that grounds deliverables and closes
// gates. Fields: file (required), phase, family, title.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  saveMoveArtifact,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import {
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/lib/programs/attachments/mime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const UPLOAD_FAMILIES = new Set<ArtifactFamily>([
  "uploaded_evidence",
  "session_artifact",
  "template",
  "approval_artifact",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        {
          error: "file_required",
          detail: "multipart field 'file' is required",
        },
        { status: 400 },
      );
    }
    if (!isWithinSizeLimit(file.size)) {
      return Response.json(
        {
          error: "file_too_large",
          detail: `max ${MAX_ATTACHMENT_SIZE_BYTES} bytes`,
        },
        { status: 413 },
      );
    }
    if (file.type && !isAllowedMimeType(file.type)) {
      return Response.json(
        { error: "unsupported_type", detail: file.type },
        { status: 415 },
      );
    }

    const phase = Number(form.get("phase") ?? 0) || 0;
    const familyRaw = String(form.get("family") ?? "uploaded_evidence");
    const family = (
      UPLOAD_FAMILIES.has(familyRaw as ArtifactFamily)
        ? familyRaw
        : "uploaded_evidence"
    ) as ArtifactFamily;
    const title = String(form.get("title") ?? "").trim() || file.name;
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const body = Buffer.from(await file.arrayBuffer());

    const saved = await saveMoveArtifact(ctx, {
      moveId: programId,
      phase,
      artifactType: family,
      artifactFamily: family,
      title,
      description: "Uploaded evidence.",
      fileName: file.name,
      fileFormat: ext,
      body,
      status: "aligned",
      sourceBasis: "client_upload",
      confidence: "high",
      citationReady: false,
      generatedBy: ctx.email ?? "upload",
      metadata: { uploadedBy: ctx.email ?? null, mime: file.type || null },
    });

    return Response.json({
      ok: true,
      artifactId: saved.artifactId,
      version: saved.version,
      blobStored: saved.blobStored,
      family,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}

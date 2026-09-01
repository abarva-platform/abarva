// POST /api/v1/programs/:programId/current-state/ingest-doc
// Multipart: file (PDF/PPTX/DOCX/XLSX/CSV) + family + phase? + archetypeId?
// Parses the document for a QUALITATIVE current-state family, appends the cited
// evidence (append-only), and opens the governed review record. Free-form docs
// land 'review_required'; a schema-validated structured KPI table auto-commits.
// Tenant + move scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  getArchetype,
  resolveProgramArchetype,
} from "@/lib/programs/archetypes/registry";
import {
  ingestCurrentStateDoc,
  isDocumentFamily,
  QuarantinedDocumentError,
} from "@/lib/programs/current-state-doc-ingest";
import { structuredCurrentStateUploadDetail } from "@/lib/programs/current-state-routing";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
};

function resolveMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();

    const form = await req.formData();
    const file = form.get("file");
    const familyKey = String(form.get("family") ?? "");
    const phase = Number(form.get("phase") ?? "1");
    const archetypeId = String(form.get("archetypeId") ?? "");

    if (!(file instanceof File)) {
      return Response.json({ error: "file_required" }, { status: 400 });
    }

    // Caller-declared archetype id wins (the readiness panel sends the id its
    // report was resolved against); otherwise resolve (defaults to AI-PDLC).
    const archetype =
      getArchetype(archetypeId) ??
      resolveProgramArchetype({ archetype: archetypeId || null });
    const family = archetype.evidenceFamilies.find((f) => f.key === familyKey);
    if (!family) {
      return Response.json(
        { error: "unknown_family", detail: `no family '${familyKey}'` },
        { status: 400 },
      );
    }
    if (!isDocumentFamily(family)) {
      return Response.json(
        {
          error: "structured_family",
          detail: structuredCurrentStateUploadDetail(family),
        },
        { status: 400 },
      );
    }

    const mimeType = resolveMime(file);
    const buffer = Buffer.from(await file.arrayBuffer());

    const declaredClassification = form.get("dataClassification");

    // Layer 1 — scan-before-extract (audit B5a): catches text/CSV PII and any
    // declared regulated classification before the parser even runs.
    const dataProtection = evaluateSensitiveUpload({
      filename: file.name,
      mimeType,
      bytes: buffer,
      declaredClassification,
    });
    if (dataProtection.decision === "quarantine") {
      return sensitiveUploadRejectedResponse(dataProtection);
    }

    // Layer 2 — office-aware post-extract scan happens inside ingestCurrentStateDoc
    // (DOCX/PPTX/XLSX are ZIPs; their PII is only visible after decode). On a hit
    // it throws QuarantinedDocumentError and nothing is written.
    const result = await ingestCurrentStateDoc(ctx, {
      moveId: programId,
      family,
      archetypeId: archetype.id,
      phase: Number.isFinite(phase) ? phase : 1,
      filename: file.name,
      mimeType,
      buffer,
      declaredClassification:
        typeof declaredClassification === "string"
          ? declaredClassification
          : null,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof QuarantinedDocumentError) {
      return sensitiveUploadRejectedResponse(err.result);
    }
    return tenancyErrorResponse(err);
  }
}

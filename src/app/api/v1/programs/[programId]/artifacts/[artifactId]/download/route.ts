// GET /api/v1/programs/:programId/artifacts/:artifactId/download?inline=1
// Streams the artifact bytes from Azure Blob (tenant-scoped). Reads the blob
// server-side via the object-storage adapter rather than minting a SAS URL, so
// it works under managed identity without needing user-delegation-key rights.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { downloadArtifactOutcome } from "@/lib/programs/deliverables/move-artifacts";
import { moveArtifactDownloadRefusal } from "@/lib/programs/move-artifact-download-refusal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  html: "text/html; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  pdf: "application/pdf",
  csv: "text/csv; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { artifactId, programId } = await params;
    const ctx = await requireTenancy();
    const outcome = await downloadArtifactOutcome(ctx, artifactId, programId);
    if (!outcome.ok) {
      // Both controls on a cabinet row are plain anchors at this URL, so this
      // body is rendered to the reader as a page. Name the cause and its
      // remedy: a file whose bytes were never retained is gone and must be
      // replaced, while unreachable storage has lost nothing and wants a wait.
      const refusal = moveArtifactDownloadRefusal(outcome.reason);
      return Response.json(
        { error: refusal.error, detail: refusal.detail },
        { status: refusal.status },
      );
    }
    const file = outcome.file;
    const inline = req.nextUrl.searchParams.get("inline") === "1";
    return new Response(new Uint8Array(file.bytes), {
      status: 200,
      headers: {
        "content-type": MIME[file.fileFormat] ?? "application/octet-stream",
        "content-disposition": `${inline ? "inline" : "attachment"}; filename="${file.fileName.replace(/[\r\n"]/g, "_")}"`,
        "content-length": String(file.bytes.length),
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}

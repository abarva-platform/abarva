// GET /api/v1/programs/:programId/artifacts/:artifactId/download?inline=1
// Streams the artifact bytes from Azure Blob (tenant-scoped). Reads the blob
// server-side via the object-storage adapter rather than minting a SAS URL, so
// it works under managed identity without needing user-delegation-key rights.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { downloadArtifactBytes } from "@/lib/programs/deliverables/move-artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  html: "text/html; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  pdf: "application/pdf",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { artifactId } = await params;
    const ctx = await requireTenancy();
    const file = await downloadArtifactBytes(ctx, artifactId);
    if (!file) {
      return Response.json(
        {
          error: "artifact_unavailable",
          detail: "not found or storage unconfigured",
        },
        { status: 404 },
      );
    }
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

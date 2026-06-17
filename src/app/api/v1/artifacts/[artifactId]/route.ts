import { Packer } from "docx";
import { getActiveClientRow } from "@/lib/active-client";
import {
  getGeneratedArtifactById,
  renderableDocFromGeneratedArtifact,
  renderedHtmlFromGeneratedArtifact,
  type GeneratedArtifactRecord,
} from "@/lib/artifacts/repository";
import {
  renderDeliverableDocx,
  renderDeliverableExcelCompanion,
} from "@/lib/deliverables/orchestrator/renderers";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type DownloadFormat = "docx" | "xlsx" | "html";

/** A non-html artifact whose structured doc is missing can only serve its HTML. */
function resolveRequestedFormat(
  req: Request,
  record: GeneratedArtifactRecord,
): DownloadFormat {
  const raw = new URL(req.url).searchParams.get("format")?.toLowerCase();
  if (raw === "docx" || raw === "xlsx" || raw === "html") return raw;
  // Default = the artifact's persisted prescribed format. 'pptx'/'pdf' have no
  // renderer here yet, so they fall back to docx (their structured doc still
  // renders as a Word document); anything else → html preview.
  const out = record.outputFormat;
  if (out === "docx") return "docx";
  if (out === "xlsx") return "xlsx";
  if (out === "pptx" || out === "pdf") return "docx";
  return "html";
}

function safeFilename(title: string, ext: string): string {
  // Header values are Latin-1; strip control + non-ASCII so an em-dash/smart-quote
  // in the title can never make Response throw on a ByteString conversion. The
  // full-fidelity name is carried via RFC 5987 `filename*` in attachmentHeaders.
  const base =
    title
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/[^\x20-\x7e]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "deliverable";
  return `${base}.${ext}`;
}

function attachmentHeaders(
  record: GeneratedArtifactRecord,
  contentType: string,
  filename: string,
  byteLength: number,
): HeadersInit {
  // ASCII `filename` for old clients + UTF-8 `filename*` (RFC 5987) for the rest.
  const utf8 = encodeURIComponent(filename);
  return {
    "content-type": contentType,
    "content-disposition": `attachment; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${utf8}`,
    "content-length": String(byteLength),
    "cache-control": "no-store",
    "x-generated-artifact-id": record.id,
    "x-generated-artifact-source-ref": record.sourceArtifactRef,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ artifactId: string }> },
): Promise<Response> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return Response.json(
      { error: "unauthorized", detail: "A signed-in session is required." },
      { status: 401 },
    );
  }

  const { artifactId } = await params;
  if (!artifactId?.trim()) {
    return Response.json(
      { error: "bad_request", detail: "artifactId is required." },
      { status: 400 },
    );
  }
  // `generated_artifacts.id` is a uuid column; a malformed id would otherwise
  // reach the DB and throw "invalid input syntax for type uuid" → an unhandled
  // 500. A non-uuid id can never match a row, so treat it as not-found.
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      artifactId,
    )
  ) {
    return Response.json(
      { error: "not_found", detail: "Generated artifact was not found." },
      { status: 404 },
    );
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) {
    return Response.json(
      { error: "forbidden", detail: "Active tenant could not be resolved." },
      { status: 403 },
    );
  }

  // Scope by the client UUID. generated_artifacts.client_id stores the resolved client id
  // (ctx.clientId), NOT the app client key — querying by the key returned null and surfaced
  // a generated deliverable as a spurious 404.
  const record = await getGeneratedArtifactById(artifactId, {
    clientId: activeClient.id,
  });
  if (!record) {
    return Response.json(
      { error: "not_found", detail: "Generated artifact was not found." },
      { status: 404 },
    );
  }

  const html = renderedHtmlFromGeneratedArtifact(record);
  const structuredDoc = renderableDocFromGeneratedArtifact(record) as
    | RenderableDeliverable
    | null;
  const requested = resolveRequestedFormat(_req, record);

  // Inline HTML preview — unchanged behavior. Served whenever HTML is requested
  // (or is the artifact's format) and stored HTML exists.
  const wantsHtml =
    requested === "html" || (record.outputFormat === "html" && !structuredDoc);
  if (wantsHtml && html) {
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-generated-artifact-id": record.id,
        "x-generated-artifact-source-ref": record.sourceArtifactRef,
      },
    });
  }

  // Binary formats (docx/xlsx) require the structured document. Older artifacts
  // that predate structured persistence fall back to the stored HTML — never 500.
  if ((requested === "docx" || requested === "xlsx") && structuredDoc) {
    try {
      if (requested === "xlsx") {
        const wb = renderDeliverableExcelCompanion(structuredDoc);
        if (wb) {
          const buf = Buffer.from(await wb.xlsx.writeBuffer());
          return new Response(new Uint8Array(buf), {
            status: 200,
            headers: attachmentHeaders(
              record,
              XLSX_CONTENT_TYPE,
              safeFilename(structuredDoc.title, "xlsx"),
              buf.length,
            ),
          });
        }
        // No xlsx-flagged tables → there is no workbook to build. Gracefully
        // fall through to the DOCX rendering of the same document.
      }

      const buf = await Packer.toBuffer(renderDeliverableDocx(structuredDoc));
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: attachmentHeaders(
          record,
          DOCX_CONTENT_TYPE,
          safeFilename(structuredDoc.title, "docx"),
          buf.length,
        ),
      });
    } catch (err) {
      console.error(
        "[GET /api/v1/artifacts/[artifactId]] render failed; falling back",
        err,
      );
      // fall through to HTML / JSON fallback below
    }
  }

  // Fallback: serve stored HTML if we have it (covers older artifacts with no
  // structured doc), otherwise return JSON metadata.
  if (html) {
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-generated-artifact-id": record.id,
        "x-generated-artifact-source-ref": record.sourceArtifactRef,
        "x-generated-artifact-format-fallback": "html",
      },
    });
  }

  return Response.json(
    {
      id: record.id,
      clientId: record.clientId,
      artifactType: record.artifactType,
      sourceArtifactRef: record.sourceArtifactRef,
      outputFormat: record.outputFormat,
      blobUrl: record.blobUrl,
      blobSha256: record.blobSha256,
      renderedAt: record.renderedAt,
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-generated-artifact-id": record.id,
      },
    },
  );
}

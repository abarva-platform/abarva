import { getActiveClientKey } from "@/lib/active-client";
import {
  getGeneratedArtifactById,
  renderedHtmlFromGeneratedArtifact,
} from "@/lib/artifacts/repository";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const activeClientId = await getActiveClientKey().catch(() => null);
  if (!activeClientId) {
    return Response.json(
      { error: "forbidden", detail: "Active tenant could not be resolved." },
      { status: 403 },
    );
  }

  const record = await getGeneratedArtifactById(artifactId, {
    clientId: activeClientId,
  });
  if (!record) {
    return Response.json(
      { error: "not_found", detail: "Generated artifact was not found." },
      { status: 404 },
    );
  }

  const html = renderedHtmlFromGeneratedArtifact(record);
  if (record.outputFormat === "html" && html) {
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

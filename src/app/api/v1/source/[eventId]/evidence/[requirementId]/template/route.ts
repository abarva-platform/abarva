// GET /api/v1/source/:eventId/evidence/:requirementId/template
//
// Streams a blank, pre-shaped XLSX intake template for one evidence
// requirement. The workbook contains NO client data beyond the event code/name
// the user already sees on the canvas — it is a fillable form. Once filled and
// re-uploaded through artifacts/upload, the filename token reconciles it back
// to this requirement automatically (see input-template.ts).

import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { evidenceById } from "@/lib/source/canonical-specs";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";
import {
  buildInputTemplateWorkbook,
  inputTemplateFilename,
  XLSX_CONTENT_TYPE,
} from "@/lib/source/exports/input-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ eventId: string; requirementId: string }>;
};

function jsonError(status: number, error: string, detail: string): Response {
  return Response.json({ ok: false, error, detail }, { status });
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, requirementId } = await params;
  const requirement = evidenceById(requirementId);
  if (!requirement) {
    return jsonError(404, "unknown_requirement", "Unknown evidence requirement.");
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const fallbackClientKey =
    (isClientKey(currentUser?.metadataClientKey)
      ? currentUser.metadataClientKey
      : null) ?? inferClientKeyFromEmail(currentUser?.email);
  const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
  if (!effectiveClientKey) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return jsonError(403, "no_client", "No active client for Source template.");
  }

  const resolvedEventId = await resolveSourceEventUuidForClient(
    eventId,
    effectiveClientKey,
  ).catch(() => null);
  const persistedEventId = resolvedEventId ?? eventId;
  const db = getAzureReadFluentClient();
  const { data: persistedEvent, error: fetchError } = await db
    .from("source_events")
    .select("id, client_key, event_code, event_name")
    .eq("id", persistedEventId)
    .maybeSingle();
  if (fetchError) {
    return jsonError(500, "lookup_failed", fetchError.message);
  }
  if (!persistedEvent || persistedEvent.client_key !== effectiveClientKey) {
    return jsonError(404, "not_found", `No source event with id ${eventId}`);
  }

  // A template is a blank form, but we still require the same contributor
  // rights the upload itself needs — no point handing a form to someone who
  // cannot submit it, and it keeps the surface consistent with the fence.
  const accessPolicy =
    tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: persistedEvent.id,
        }).catch(() => null)
      : null;
  const canDownload = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
      accessPolicy?.canGenerateSourcingArtifacts ||
      accessPolicy?.canCreateSourceEvents ||
      accessPolicy?.canApproveSourceStages,
  );
  if (!canDownload) {
    return jsonError(
      403,
      "forbidden",
      "Source contributor rights are required to download an input template.",
    );
  }

  const buffer = await buildInputTemplateWorkbook({
    requirement,
    event: {
      eventCode: String(persistedEvent.event_code ?? eventId),
      eventName: String(persistedEvent.event_name ?? "Source event"),
      companyName: activeClient?.name ?? effectiveClientKey,
      generatedAtIso: new Date().toISOString(),
    },
  });
  const filename = inputTemplateFilename(requirement);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": XLSX_CONTENT_TYPE,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

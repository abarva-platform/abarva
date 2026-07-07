// POST /api/v1/source/:eventId/evidence-requests
//
// Creates an internal evidence request task by writing a visible Source
// activity row. No external email or vendor communication is sent from this
// route; it is the governed audit trail for the Maestro's request.

import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

interface EvidenceRequestBody {
  requirementId?: unknown;
  label?: unknown;
  sourceLabel?: unknown;
  owner?: unknown;
  dueDate?: unknown;
  note?: unknown;
  stage?: unknown;
  minimumState?: unknown;
}

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function badRequest(detail: string): Response {
  return Response.json({ ok: false, error: "bad_request", detail }, { status: 400 });
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId } = await params;
    const body = (await req.json().catch(() => null)) as EvidenceRequestBody | null;
    if (!body) return badRequest("Request body must be JSON.");

    const requirementId = cleanString(body.requirementId, 160);
    const label = cleanString(body.label, 240);
    if (!requirementId) return badRequest("requirementId is required.");
    if (!label) return badRequest("label is required.");

    const sourceLabel = cleanString(body.sourceLabel, 160);
    const owner = cleanString(body.owner, 160);
    const dueDate = cleanString(body.dueDate, 40);
    const note = cleanString(body.note, 800);
    const stage = cleanString(body.stage, 80);
    const minimumState = cleanString(body.minimumState, 80);
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return badRequest("dueDate must be YYYY-MM-DD.");
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
      return Response.json(
        {
          ok: false,
          error: "no_client",
          detail: "No active client for Source evidence request.",
        },
        { status: 403 },
      );
    }

    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventId,
      effectiveClientKey,
    ).catch(() => null);
    const persistedEventLookupId = resolvedEventId ?? eventId;
    const { data: persistedEvent, error: fetchError } = await getAzureReadFluentClient()
      .from("source_events")
      .select("id, client_key, current_stage_key")
      .eq("id", persistedEventLookupId)
      .maybeSingle();
    if (fetchError) {
      return Response.json(
        { ok: false, error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent || persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { ok: false, error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent.id,
          }).catch(() => null)
        : null;
    const canRequest = Boolean(
      accessPolicy?.canUploadSourceArtifacts ||
        accessPolicy?.canGenerateSourcingArtifacts ||
        accessPolicy?.canApproveSourceStages ||
        accessPolicy?.canCreateSourceEvents,
    );
    if (!canRequest) {
      return Response.json(
        {
          ok: false,
          error: "forbidden",
          detail: "Source contributor rights are required to request evidence.",
        },
        { status: 403 },
      );
    }

    const nowIso = new Date().toISOString();
    const sourceWrite = selectSourceWriteAdapter(undefined, effectiveClientKey);
    const activityWrite = await sourceWrite.insertActivityLog({
      eventId: persistedEvent.id,
      clientKey: effectiveClientKey,
      actorUserId: currentUser?.personId ?? currentUser?.clerkUserId ?? tenancy?.userId ?? null,
      actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
      actorRole: currentUser?.primaryRole ?? null,
      actionType: "evidence_requested",
      actionLabel: `Requested evidence: ${label}`,
      stageKey: stage ?? persistedEvent.current_stage_key ?? null,
      criterionId: requirementId,
      reason: note,
      metadata: {
        requirementId,
        label,
        sourceLabel,
        owner,
        dueDate,
        minimumState,
        externalSend: false,
      },
      occurredAtIso: nowIso,
    });
    if (!activityWrite.ok) {
      return Response.json(
        { ok: false, error: "activity_write_failed", detail: activityWrite.error },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      request: {
        eventId: persistedEvent.id,
        requirementId,
        label,
        owner,
        dueDate,
        stage: stage ?? persistedEvent.current_stage_key ?? null,
        externalSend: false,
      },
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/evidence-requests]", err);
    return Response.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

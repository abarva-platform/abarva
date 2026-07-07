// POST /api/v1/source/:eventId/evidence/:requirementId/answer
//
// Captures a short client-stated answer as evidence for the simple Source
// front. This is deliberately not a file upload: provenance remains
// "client-stated", the original answer is stored in notes + activity metadata,
// and stronger uploaded evidence can still supersede it later.

import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { evidenceById } from "@/lib/source/canonical-specs";
import {
  evidenceStateRowToView,
  type SourceEventEvidenceCurrentState,
  type SourceEventEvidenceStateRow,
} from "@/lib/source/canvas-substrate/types";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ eventId: string; requirementId: string }>;
};

const CLIENT_STATED_STATE: SourceEventEvidenceCurrentState = "Available";

const STATE_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Stale: 0,
  "Low Confidence": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
};

function cleanAnswer(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 8) return null;
  return trimmed.slice(0, 8_000);
}

function badRequest(detail: string): Response {
  return Response.json(
    { ok: false, error: "bad_request", detail },
    { status: 400 },
  );
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
    const { eventId, requirementId } = await params;
    const requirement = evidenceById(requirementId);
    if (!requirement) return badRequest("Unknown evidence requirement.");

    const body = (await req.json().catch(() => null)) as {
      answer?: unknown;
      stage?: unknown;
    } | null;
    const answer = cleanAnswer(body?.answer);
    if (!answer) return badRequest("answer must be at least 8 characters.");

    const requestedStage =
      typeof body?.stage === "string" ? normalizeSourceStageKey(body.stage) : null;
    if (requestedStage && requestedStage !== requirement.stage) {
      return badRequest(
        `requirement ${requirementId} belongs to ${requirement.stage}, not ${requestedStage}.`,
      );
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
          detail: "No active client for Source evidence answer.",
        },
        { status: 403 },
      );
    }

    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventId,
      effectiveClientKey,
    ).catch(() => null);
    const persistedEventId = resolvedEventId ?? eventId;
    const db = getAzureWriteFluentClient();
    const { data: persistedEvent, error: fetchError } = await db
      .from("source_events")
      .select("id, client_key, current_stage_key")
      .eq("id", persistedEventId)
      .maybeSingle();
    if (fetchError) {
      return Response.json(
        { ok: false, error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent || persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        {
          ok: false,
          error: "not_found",
          detail: `No source event with id ${eventId}`,
        },
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
    const canAnswer = Boolean(
      accessPolicy?.canUploadSourceArtifacts ||
        accessPolicy?.canGenerateSourcingArtifacts ||
        accessPolicy?.canCreateSourceEvents ||
        accessPolicy?.canApproveSourceStages,
    );
    if (!canAnswer) {
      return Response.json(
        {
          ok: false,
          error: "forbidden",
          detail: "Source contributor rights are required to answer evidence.",
        },
        { status: 403 },
      );
    }

    const nowIso = new Date().toISOString();
    const clientStatedNote = [
      `Client-stated answer (${nowIso})`,
      answer,
    ].join(": ");
    const { data: existing, error: readError } = await db
      .from("source_event_evidence_states")
      .select("*")
      .eq("source_event_id", persistedEvent.id)
      .eq("requirement_id", requirementId)
      .maybeSingle<SourceEventEvidenceStateRow>();
    if (readError) {
      return Response.json(
        { ok: false, error: "lookup_failed", detail: readError.message },
        { status: 500 },
      );
    }

    const existingRank = existing ? STATE_RANK[existing.current_state] : -1;
    const targetState =
      existing && existingRank > STATE_RANK[CLIENT_STATED_STATE]
        ? existing.current_state
        : CLIENT_STATED_STATE;
    const notes = existing?.notes
      ? `${existing.notes}\n${clientStatedNote}`
      : clientStatedNote;

    let row: SourceEventEvidenceStateRow | null = null;
    if (existing) {
      const { data, error } = await db
        .from("source_event_evidence_states")
        .update({
          current_state: targetState,
          notes,
          last_synced_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", existing.id)
        .select("*")
        .single<SourceEventEvidenceStateRow>();
      if (error) {
        return Response.json(
          { ok: false, error: "update_failed", detail: error.message },
          { status: 500 },
        );
      }
      row = data;
    } else {
      const { data, error } = await db
        .from("source_event_evidence_states")
        .insert({
          source_event_id: persistedEvent.id,
          tenant_key: persistedEvent.client_key,
          requirement_id: requirementId,
          stage_key: requirement.stage,
          current_state: CLIENT_STATED_STATE,
          source_artifact_id: null,
          notes,
          last_synced_at: nowIso,
        })
        .select("*")
        .single<SourceEventEvidenceStateRow>();
      if (error) {
        return Response.json(
          { ok: false, error: "insert_failed", detail: error.message },
          { status: 500 },
        );
      }
      row = data;
    }

    const sourceWrite = selectSourceWriteAdapter(undefined, effectiveClientKey);
    const activityWrite = await sourceWrite.insertActivityLog({
      eventId: persistedEvent.id,
      clientKey: effectiveClientKey,
      actorUserId:
        currentUser?.personId ?? currentUser?.clerkUserId ?? tenancy?.userId ?? null,
      actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
      actorRole: currentUser?.primaryRole ?? null,
      actionType: "evidence_answered",
      actionLabel: `Answered evidence: ${requirement.label}`,
      stageKey: requirement.stage,
      criterionId: requirementId,
      reason: "client-stated evidence",
      metadata: {
        requirementId,
        label: requirement.label,
        provenance: "client-stated",
        answer,
        state: targetState,
      },
      occurredAtIso: nowIso,
    });
    if (!activityWrite.ok) {
      console.error(
        "[source evidence answer activity] insert failed:",
        activityWrite.error,
      );
    }

    return Response.json({
      ok: true,
      evidence: row ? evidenceStateRowToView(row) : null,
      provenance: "client-stated",
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/evidence/:requirementId/answer]", err);
    return Response.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

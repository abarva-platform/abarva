// POST /api/v1/source/:eventId/communications/draft
//
// Creates an internal communication draft for Q&A, BAFO, award, or
// follow-up messaging. This route never sends external email; it returns
// copy-ready draft text and appends a Source event activity row so the
// action is visible in the Log tab.

import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { buildSourceGenerationContext } from "@/lib/source/agent-generation/server";
import {
  buildSourceCommunicationDraft,
  isSourceCommunicationDraftType,
  labelForCommunicationDraft,
} from "@/lib/source/communication-drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
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
    const payload = (await req.json().catch(() => null)) as
      | { draftType?: unknown; recipientName?: unknown; note?: unknown }
      | null;
    if (!payload || !isSourceCommunicationDraftType(payload.draftType)) {
      return Response.json(
        {
          ok: false,
          error: "bad_request",
          detail:
            "draftType must be one of: qa_follow_up, bafo_request, award_notice, vendor_follow_up.",
        },
        { status: 400 },
      );
    }

    const [ctx, activeClient, currentUser] = await Promise.all([
      buildSourceGenerationContext(eventId),
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);
    if (!ctx) {
      return Response.json(
        { ok: false, error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: ctx.event.id,
          }).catch(() => null)
        : null;
    const canDraft = Boolean(
      accessPolicy?.canGenerateSourcingArtifacts ||
        accessPolicy?.canUploadSourceArtifacts ||
        accessPolicy?.canCreateSourceEvents ||
        accessPolicy?.canApproveSourceStages,
    );
    if (!canDraft) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        {
          ok: false,
          error: "forbidden",
          detail: "Source contributor rights are required to create communication drafts.",
        },
        { status: 403 },
      );
    }

    const draft = buildSourceCommunicationDraft({
      draftType: payload.draftType,
      clientName: ctx.tenantName,
      eventName: ctx.event.name,
      eventSlug: ctx.event.code,
      currentStage: ctx.event.currentStageKey,
      decisionOwner: ctx.event.owner,
      valueAtStakeUsd: ctx.event.estimatedValueUsd,
      scopeDescription: ctx.event.scopeDescription,
      recipientName: cleanString(payload.recipientName, 160),
      note: cleanString(payload.note, 800),
    });

    const nowIso = new Date().toISOString();
    const sourceWrite = selectSourceWriteAdapter(undefined, ctx.tenantKey);
    const activityWrite = await sourceWrite.insertActivityLog({
      eventId: ctx.event.id,
      clientKey: ctx.tenantKey,
      actorUserId: currentUser?.personId ?? currentUser?.clerkUserId ?? tenancy?.userId ?? null,
      actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
      actorRole: currentUser?.primaryRole ?? null,
      actionType: "communication_draft_generated",
      actionLabel: `Generated ${labelForCommunicationDraft(payload.draftType)} draft`,
      stageKey: ctx.event.currentStageKey,
      reason: draft.disclaimer,
      metadata: {
        draftType: payload.draftType,
        subject: draft.subject,
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
      draft,
      generatedAt: nowIso,
      externalSend: false,
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/communications/draft]", err);
    return Response.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

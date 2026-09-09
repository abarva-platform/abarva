import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { evidenceStateRowToView, type SourceEventEvidenceStateRow } from "@/lib/source/canvas-substrate/types";
import {
  contractEvidenceReviewTarget,
  normalizeEvidenceReviewReason,
} from "@/lib/source/contract-evidence/evidence-review";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ eventId: string; requirementId: string }>;
};

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const tenancy = await requireTenancy();
    const { eventId, requirementId } = await params;
    const target = contractEvidenceReviewTarget(requirementId);
    if (!target) {
      return Response.json(
        { ok: false, error: "unsupported_requirement" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      manifestId?: unknown;
      reason?: unknown;
    } | null;
    const manifestId =
      typeof body?.manifestId === "string" ? body.manifestId.trim() : "";
    const reason = normalizeEvidenceReviewReason(body?.reason);
    if (!manifestId || !reason) {
      return Response.json(
        {
          ok: false,
          error: "bad_request",
          detail: "manifestId and a review reason of at least 20 characters are required.",
        },
        { status: 400 },
      );
    }

    const activeClient = await getActiveClientRow(tenancy.clientKey).catch(
      () => null,
    );
    if (!activeClient?.key || activeClient.id !== tenancy.clientId) {
      return Response.json(
        { ok: false, error: "no_active_client" },
        { status: 403 },
      );
    }
    const currentUser = await getCurrentUser().catch(() => null);
    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventId,
      activeClient.key,
    ).catch(() => null);
    if (!resolvedEventId) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
      activeClientKey: activeClient.key,
      sourceEventId: resolvedEventId,
    }).catch(() => null);
    if (!accessPolicy?.canApproveSourceStages) {
      return Response.json(
        {
          ok: false,
          error: "forbidden",
          detail: "Source stage-approval rights are required to review evidence.",
        },
        { status: 403 },
      );
    }

    const db = getAzureWriteFluentClient();
    const { data: manifest, error: manifestError } = await db
      .from("source_contract_evidence_manifests")
      .select("id,tenant_key,source_event_id,validation_status,evidence_pack_name")
      .eq("id", manifestId)
      .eq("tenant_key", activeClient.key)
      .eq("source_event_id", resolvedEventId)
      .maybeSingle();
    if (manifestError) {
      return Response.json(
        { ok: false, error: "lookup_failed", detail: manifestError.message },
        { status: 500 },
      );
    }
    if (!manifest || manifest.validation_status !== "accepted") {
      return Response.json(
        {
          ok: false,
          error: "manifest_not_accepted",
          detail: "The reviewed manifest must be accepted for this tenant and event.",
        },
        { status: 409 },
      );
    }

    const { data: familyRows, error: familyError } = await db
      .from("source_contract_evidence_rows")
      .select("row_hash")
      .eq("manifest_id", manifestId)
      .eq("tenant_key", activeClient.key)
      .eq("source_event_id", resolvedEventId)
      .eq("evidence_family", target.family)
      .eq("validation_status", "accepted")
      .limit(1);
    if (familyError) {
      return Response.json(
        { ok: false, error: "lookup_failed", detail: familyError.message },
        { status: 500 },
      );
    }
    if (!familyRows?.length) {
      return Response.json(
        {
          ok: false,
          error: "accepted_family_missing",
          detail: `No accepted ${target.family} evidence exists in this manifest.`,
        },
        { status: 409 },
      );
    }

    const { data: existing, error: existingError } = await db
      .from("source_event_evidence_states")
      .select("*")
      .eq("source_event_id", resolvedEventId)
      .eq("requirement_id", requirementId)
      .maybeSingle<SourceEventEvidenceStateRow>();
    if (existingError) {
      return Response.json(
        { ok: false, error: "lookup_failed", detail: existingError.message },
        { status: 500 },
      );
    }
    if (!existing) {
      return Response.json(
        { ok: false, error: "evidence_state_not_found" },
        { status: 404 },
      );
    }

    const nowIso = new Date().toISOString();
    const reviewNote = `Structured evidence reviewed (${nowIso}): ${reason}`;
    const { data: updated, error: updateError } = await db
      .from("source_event_evidence_states")
      .update({
        current_state: target.targetState,
        notes: existing.notes ? `${existing.notes}\n${reviewNote}` : reviewNote,
        last_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", existing.id)
      .select("*")
      .single<SourceEventEvidenceStateRow>();
    if (updateError) {
      return Response.json(
        { ok: false, error: "update_failed", detail: updateError.message },
        { status: 500 },
      );
    }
    if (!updated) {
      return Response.json(
        { ok: false, error: "update_failed", detail: "Evidence review did not return a row." },
        { status: 500 },
      );
    }

    const sourceWrite = selectSourceWriteAdapter(undefined, activeClient.key);
    await sourceWrite.insertActivityLog({
      eventId: resolvedEventId,
      clientKey: activeClient.key,
      actorUserId:
        currentUser?.personId ?? currentUser?.clerkUserId ?? tenancy.userId ?? null,
      actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
      actorRole: currentUser?.primaryRole ?? tenancy.role ?? null,
      actionType: "evidence_reviewed",
      actionLabel: `Reviewed structured evidence: ${requirementId}`,
      stageKey: "scope",
      criterionId: requirementId,
      reason,
      metadata: {
        requirementId,
        manifestId,
        evidenceFamily: target.family,
        targetState: target.targetState,
      },
      occurredAtIso: nowIso,
    });

    return Response.json({
      ok: true,
      manifestId,
      evidenceFamily: target.family,
      evidence: evidenceStateRowToView(updated),
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: "internal_error",
          detail: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  }
}

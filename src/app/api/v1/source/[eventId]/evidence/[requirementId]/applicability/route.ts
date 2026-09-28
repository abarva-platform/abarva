// An absence declaration changes a requirement's applicability, never its
// evidence readiness or the underlying contract/spend record.
import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { azureRead } from "@/lib/data-plane/azureRead";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { evidenceById } from "@/lib/source/canonical-specs";
import type { SourceEventEvidenceStateRow } from "@/lib/source/canvas-substrate/types";
import { permitsAbsenceDeclaration } from "@/lib/source/evidence-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string; requirementId: string }> };
type Decision = "not_applicable" | "applicable";

function failure(status: number, error: string, detail: string): Response {
  return Response.json({ ok: false, error, detail }, { status });
}

export async function POST(req: NextRequest, { params }: RouteCtx): Promise<Response> {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const { eventId, requirementId } = await params;
  const requirement = evidenceById(requirementId);
  if (!requirement || !permitsAbsenceDeclaration(requirementId)) {
    return failure(422, "absence_not_allowed", "This requirement cannot be declared not applicable.");
  }

  const body = (await req.json().catch(() => null)) as {
    decision?: unknown;
    reason?: unknown;
    confirmsAbsence?: unknown;
  } | null;
  const decision = body?.decision;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (
    (decision !== "not_applicable" && decision !== "applicable") ||
    reason.length < 24 || reason.length > 2_000 ||
    (decision === "not_applicable" && body?.confirmsAbsence !== true)
  ) {
    return failure(400, "decision_invalid", "A decision, explicit confirmation of absence, and a 24-character audit reason are required.");
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  if (!activeClient || activeClient.key !== tenancy.clientKey) {
    return failure(403, "no_client", "An active tenant session is required.");
  }

  const db = getAzureWriteFluentClient();
  const { data: event, error: eventError } = await db
    .from("source_events")
    .select("id, client_key, current_stage_key, lifecycle_state, created_by_user_id")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError) return failure(500, "lookup_failed", eventError.message);
  if (!event || event.client_key !== activeClient.key) {
    return failure(404, "not_found", "Source event not found for this tenant.");
  }
  if (event.lifecycle_state !== "active" || event.current_stage_key !== requirement.stage) {
    return failure(409, "wrong_stage", "Only an active requirement in the current stage can be decided.");
  }

  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: event.id,
  }).catch(() => null);
  const actorUserId = currentUser?.clerkUserId ?? tenancy.userId;
  if (
    !access?.canApproveSourceStages ||
    (access.accessLevel !== "client_admin" && event.created_by_user_id !== tenancy.userId) ||
    !actorUserId
  ) {
    return failure(403, "event_owner_or_admin_required", "The Event Owner or client admin must record this decision.");
  }

  let state: (SourceEventEvidenceStateRow & { updated_at_exact: string }) | undefined;
  try {
    const rows = await azureRead.query<SourceEventEvidenceStateRow & { updated_at_exact: string }>(
      `SELECT *, updated_at::text AS updated_at_exact
       FROM public.source_event_evidence_states
       WHERE source_event_id = $1 AND requirement_id = $2 AND tenant_key = $3
       LIMIT 1`,
      [event.id, requirementId, activeClient.key],
    );
    state = rows[0];
  } catch (error) {
    return failure(500, "lookup_failed", error instanceof Error ? error.message : String(error));
  }
  if (!state || state.tenant_key !== activeClient.key || state.stage_key !== requirement.stage) {
    return failure(409, "evidence_row_missing", "The event requirement row must be scaffolded first.");
  }
  if (!state.updated_at_exact) {
    return failure(500, "lookup_failed", "The evidence row has no precise version.");
  }
  if (state.applicability_status === undefined) {
    return failure(503, "schema_pending", "Evidence applicability is not available in this environment yet.");
  }
  if (
    decision === "not_applicable" &&
    (state.current_state !== "Not Requested" || state.source_artifact_id !== null)
  ) {
    return failure(409, "record_already_present", "An existing source record cannot be replaced by an absence declaration.");
  }

  const decidedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("source_event_evidence_states")
    .update({
      applicability_status: decision as Decision,
      applicability_reason: reason,
      applicability_actor_user_id: actorUserId,
      applicability_decided_at: decidedAt,
    })
    .eq("id", state.id)
    .eq("source_event_id", event.id)
    .eq("tenant_key", activeClient.key)
    .eq("updated_at", state.updated_at_exact)
    .select("*")
    .maybeSingle<SourceEventEvidenceStateRow>();
  if (updateError) return failure(500, "decision_failed", updateError.message);
  if (!updated) return failure(409, "stale_requirement", "The requirement changed; reload before deciding.");

  return Response.json({
    ok: true,
    requirementId,
    decision,
    decidedAt: updated.applicability_decided_at,
    evidenceState: updated.current_state,
  });
}

// GET /api/v1/source/events/:eventId
//
// Tenant-safe event-by-id lookup. Returns the serialized SourcingEventDetail
// when the caller's active tenant owns the event, and a 404 (NOT 403) when
// the event does not exist or belongs to a different tenant — the same
// anti-enumeration rule applied across the Source API surface.
//
// The bulk of the tenancy check lives inside `getSourcingEvent`, which after
// the Finding 1 fix returns `null` for cross-tenant ids. This route layers an
// auth gate on top so unauthenticated callers never reach the data layer.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { getSourcingEvent } from "@/lib/source/queries";
import { syncEventIntakeEvidence } from "@/lib/source/canvas-substrate/event-intake-sync";
import {
  firstGovernanceBlocker,
  normalizeApprovalReason,
  validateApprovalReason,
} from "@/lib/source/source-governance-enforcement";
import type { SourcingEventDetail } from "@/lib/source/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

// Serialize the SourcingEventDetail for the API consumer. The internal type
// is camelCase; the API contract exposes snake_case `current_stage_key` (and
// related fields) so callers don't have to know the in-memory shape. Both
// shapes are included for backwards compatibility with existing consumers
// that already read the camelCase form.
function serializeEvent(event: SourcingEventDetail) {
  return {
    ...event,
    current_stage_key: event.currentStageKey,
    current_stage_label: event.currentStageLabel,
  };
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) {
    // No active tenant → treat as not-found rather than leaking auth state.
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { eventId } = await params;

  let event: SourcingEventDetail | null;
  try {
    event = await getSourcingEvent(eventId);
  } catch (err) {
    console.error("[GET /api/v1/source/events/:eventId]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }

  if (!event) {
    // Cross-tenant or genuinely missing — both return 404 to prevent
    // enumeration of other tenants' event ids.
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json({ event: serializeEvent(event) }, { status: 200 });
}

interface UpdateEventIntakeBody {
  confirmed?: unknown;
  reason?: unknown;
  triggerDescription?: unknown;
  scopeDescription?: unknown;
  decisionOwner?: unknown;
  estimatedValueUsd?: unknown;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
}

/**
 * Corrects the governed intake record without changing stage or lifecycle.
 * This deliberately exposes a narrow field allowlist and requires the same
 * explicit human reason used by Source gate decisions.
 */
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { eventId } = await params;
  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!accessPolicy?.canApproveSourceStages) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as UpdateEventIntakeBody;
  if (body.confirmed !== true) {
    return Response.json({ error: "confirmation_required" }, { status: 409 });
  }
  const reason = normalizeApprovalReason(body.reason);
  const reasonVerdict = validateApprovalReason(reason);
  if (!reasonVerdict.ok) {
    const blocker = firstGovernanceBlocker(reasonVerdict);
    return Response.json(
      { error: blocker.code, detail: blocker.detail },
      { status: 409 },
    );
  }

  const triggerDescription = optionalText(body.triggerDescription);
  const scopeDescription = optionalText(body.scopeDescription);
  const decisionOwner = optionalText(body.decisionOwner);
  const estimatedValueUsd = optionalNonNegativeNumber(body.estimatedValueUsd);
  if (
    triggerDescription === undefined &&
    scopeDescription === undefined &&
    decisionOwner === undefined &&
    estimatedValueUsd === undefined
  ) {
    return Response.json(
      { error: "no_intake_fields", detail: "No valid intake fields supplied." },
      { status: 400 },
    );
  }

  const { data: existing, error: lookupError } =
    await getAzureReadFluentClient()
      .from("source_events")
      .select(
        "id, client_key, trigger_description, scope_description, decision_owner, estimated_value_usd",
      )
      .eq("id", eventId)
      .eq("client_key", activeClient.key)
      .maybeSingle();
  if (lookupError) {
    return Response.json(
      { error: "lookup_failed", detail: lookupError.message },
      { status: 500 },
    );
  }
  if (!existing) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const updatedAtIso = new Date().toISOString();
  const sourceWrite = selectSourceWriteAdapter(undefined, activeClient.key);
  const update = await sourceWrite.updateEventIntake({
    eventId,
    clientKey: activeClient.key,
    triggerDescription,
    scopeDescription,
    decisionOwner,
    estimatedValueUsd,
    updatedAtIso,
  });
  if (!update.ok) {
    return Response.json(
      { error: "update_failed", detail: update.error },
      { status: 500 },
    );
  }

  if (triggerDescription !== undefined) {
    await syncEventIntakeEvidence({
      sourceEventId: eventId,
      tenantKey: activeClient.key,
      triggerDescription,
    }).catch((error) => {
      console.warn(
        "[PATCH /api/v1/source/events/:eventId] trigger evidence sync failed",
        error instanceof Error ? error.message : String(error),
      );
    });
  }

  await sourceWrite.insertActivityLog({
    eventId,
    clientKey: activeClient.key,
    actorUserId: tenancy.userId,
    actorDisplayName: tenancy.email ?? tenancy.userId,
    actorRole: tenancy.role ?? accessPolicy.accessLevel,
    actionType: "source_event_intake_corrected",
    actionLabel: "Source event intake corrected",
    stageKey: null,
    reason,
    metadata: {
      changedFields: [
        triggerDescription !== undefined ? "trigger_description" : null,
        scopeDescription !== undefined ? "scope_description" : null,
        decisionOwner !== undefined ? "decision_owner" : null,
        estimatedValueUsd !== undefined ? "estimated_value_usd" : null,
      ].filter(Boolean),
    },
    occurredAtIso: updatedAtIso,
  });

  const updatedEvent = await getSourcingEvent(eventId).catch(() => null);
  return Response.json(
    {
      ok: true,
      event: updatedEvent ? serializeEvent(updatedEvent) : null,
    },
    { status: 200 },
  );
}

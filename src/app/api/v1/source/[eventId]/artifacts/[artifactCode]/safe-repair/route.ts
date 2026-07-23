// POST /api/v1/source/:eventId/artifacts/:artifactCode/safe-repair
//
// Explicit repair lane for old persisted Source artifact bodies that predate
// current client-facing hygiene. This route never runs automatically and never
// calls a model. Dry-run returns the content-QA diff; apply requires a selected
// artifact row id, exact body hash, confirmation flag, and confirmation phrase.

import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import {
  appendSafeRepairReceipt,
  buildSourceArtifactSafeRepairPlan,
  expectedSafeRepairConfirmationPhrase,
  type SourceArtifactSafeRepairMode,
} from "@/lib/source/artifact-safe-repair";
import {
  artifactStateRowToView,
  type SourceEventArtifactStateRow,
} from "@/lib/source/canvas-substrate/types";
import { scaffoldNewEventSubstrate } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const TERMINAL_REPAIR_STATUSES = new Set(["locked", "superseded"]);

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function activeClientName(activeClient: unknown): string | null {
  if (!activeClient || typeof activeClient !== "object") return null;
  const row = activeClient as { name?: unknown; displayName?: unknown };
  return typeof row.name === "string"
    ? row.name
    : typeof row.displayName === "string"
      ? row.displayName
      : null;
}

function parseMode(value: unknown): SourceArtifactSafeRepairMode {
  return value === "apply" ? "apply" : "dry_run";
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
    const { eventId, artifactCode } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const payload = (await req.json().catch(() => null)) as
      | {
          artifactStateId?: unknown;
          mode?: unknown;
          confirmApply?: unknown;
          confirmationPhrase?: unknown;
          expectedBodySha256?: unknown;
        }
      | null;
    const artifactStateId =
      typeof payload?.artifactStateId === "string"
        ? payload.artifactStateId.trim()
        : "";
    if (!artifactStateId) {
      return Response.json(
        {
          error: "bad_request",
          detail:
            "artifactStateId is required so safe repair only runs on an explicitly selected artifact row.",
        },
        { status: 400 },
      );
    }
    const mode = parseMode(payload?.mode);

    const supabase = getAzureReadFluentClient();
    const eventQuery = supabase.from("source_events").select("id, client_key");
    const { data: persistedEvent, error: fetchError } = isUuid(eventId)
      ? await eventQuery.eq("id", eventId).maybeSingle()
      : { data: null, error: null };
    if (fetchError) {
      return Response.json(
        { error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey)
        ? currentUser.metadataClientKey
        : null) ?? inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        {
          error: "no_client",
          detail: "No active client for Source artifact safe repair.",
        },
        { status: 403 },
      );
    }
    if (persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    await scaffoldNewEventSubstrate(
      persistedEvent.id,
      persistedEvent.client_key,
    ).catch((error) => {
      console.warn(
        "[source artifact safe repair] substrate scaffold repair failed:",
        error instanceof Error ? error.message : String(error),
      );
    });

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent.id,
          }).catch(() => null)
        : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      persistedEvent.client_key === effectiveClientKey;
    const canMutate = Boolean(
      accessPolicy?.canUploadSourceArtifacts || canonicalAdminFallbackAllowed,
    );
    if (!canMutate) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "Source artifact upload rights are required to safe-repair artifact bodies.",
        },
        { status: 403 },
      );
    }

    const { data: artifactRow, error: artifactFetchError } = await supabase
      .from("source_event_artifact_states")
      .select("*")
      .eq("id", artifactStateId)
      .eq("source_event_id", persistedEvent.id)
      .eq("artifact_code", artifactCode)
      .maybeSingle<SourceEventArtifactStateRow>();
    if (artifactFetchError) {
      return Response.json(
        { error: "lookup_failed", detail: artifactFetchError.message },
        { status: 500 },
      );
    }
    if (!artifactRow) {
      return Response.json(
        {
          error: "artifact_not_found",
          detail: `No selected artifact row ${artifactStateId} for ${artifactCode}.`,
        },
        { status: 404 },
      );
    }
    if (!artifactRow.body || artifactRow.body.trim().length === 0) {
      return Response.json(
        {
          error: "no_body_to_repair",
          detail: `Artifact ${artifactCode} has no persisted body to repair.`,
        },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    const plan = buildSourceArtifactSafeRepairPlan({
      sourceEventId: persistedEvent.id,
      artifactStateId: artifactRow.id,
      artifactCode,
      status: artifactRow.status,
      body: artifactRow.body,
      companyName: activeClientName(activeClient) ?? effectiveClientKey,
      nowIso,
      actorUserId: currentUser?.clerkUserId ?? null,
      mode,
    });

    if (mode === "dry_run") {
      return Response.json(
        {
          ok: true,
          mode,
          receipt: plan.receipt,
          confirmationRequired: true,
          expectedBodySha256: plan.receipt.beforeSha256,
          confirmationPhrase:
            expectedSafeRepairConfirmationPhrase(artifactCode),
        },
        { status: 200 },
      );
    }

    if (!TERMINAL_REPAIR_STATUSES.has(artifactRow.status)) {
      return Response.json(
        {
          error: "not_terminal_state",
          detail:
            "Safe repair apply is reserved for locked or superseded persisted drafts; use the normal body editor for active drafts.",
          receipt: plan.receipt,
        },
        { status: 409 },
      );
    }
    if (
      payload?.confirmApply !== true ||
      payload.confirmationPhrase !==
        expectedSafeRepairConfirmationPhrase(artifactCode)
    ) {
      return Response.json(
        {
          error: "confirmation_required",
          detail:
            "Set confirmApply=true and provide the exact confirmationPhrase returned by dry_run.",
          receipt: plan.receipt,
          confirmationPhrase:
            expectedSafeRepairConfirmationPhrase(artifactCode),
        },
        { status: 409 },
      );
    }
    if (payload.expectedBodySha256 !== plan.receipt.beforeSha256) {
      return Response.json(
        {
          error: "body_hash_mismatch",
          detail:
            "The persisted artifact body changed after dry_run; run dry_run again before applying repair.",
          receipt: plan.receipt,
        },
        { status: 409 },
      );
    }
    if (!plan.receipt.diff.changed) {
      return Response.json(
        {
          error: "no_repair_needed",
          detail:
            "The deterministic safe-repair pass did not change this artifact body.",
          receipt: plan.receipt,
        },
        { status: 409 },
      );
    }
    if (plan.receipt.afterBannedTermMatches.length > 0) {
      return Response.json(
        {
          error: "repair_still_blocked",
          detail:
            "Safe repair could not clear all content blockers; use manual review instead of applying an incomplete repair.",
          receipt: plan.receipt,
        },
        { status: 409 },
      );
    }

    const repairedMetadata = appendSafeRepairReceipt(
      artifactRow.body_generation_metadata,
      plan.receipt,
    );
    const sourceWrite = selectSourceWriteAdapter(
      undefined,
      effectiveClientKey,
    );
    const bodyWrite = await sourceWrite.updateArtifactBody({
      artifactRowId: artifactRow.id,
      columns: {
        body: plan.repairedBody,
        body_format: artifactRow.body_format ?? "markdown",
        body_authored_by: currentUser?.clerkUserId ?? null,
        body_updated_at: nowIso,
        body_generation_metadata: repairedMetadata,
        updated_at: nowIso,
      },
    });
    if (!bodyWrite.ok || !bodyWrite.data) {
      return Response.json(
        { error: "update_failed", detail: bodyWrite.error },
        { status: 500 },
      );
    }

    const activityWrite = await sourceWrite.insertActivityLog({
      eventId: persistedEvent.id,
      clientKey: effectiveClientKey,
      actorUserId: currentUser?.personId ?? currentUser?.clerkUserId ?? null,
      actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
      actorRole: currentUser?.primaryRole ?? null,
      actionType: "artifact_safe_repair_applied",
      actionLabel: `Applied safe repair to ${artifactCode}`,
      stageKey: artifactRow.stage_key,
      artifactCode,
      reason: null,
      metadata: {
        receipt: plan.receipt,
        expectedBodySha256: plan.receipt.beforeSha256,
      },
      occurredAtIso: nowIso,
    });
    if (!activityWrite.ok) {
      console.error(
        "[source artifact safe repair activity] insert failed:",
        activityWrite.error,
      );
    }

    return Response.json(
      {
        ok: true,
        mode,
        receipt: plan.receipt,
        artifact: artifactStateRowToView(
          bodyWrite.data as unknown as SourceEventArtifactStateRow,
        ),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/safe-repair]",
      err,
    );
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

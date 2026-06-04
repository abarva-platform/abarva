import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { resolveSourceEventUuidForClient, scaffoldNewEventSubstrate } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

const GOLDEN_EVENT_CODE = "SRC-004";
const GOLDEN_EVENT_SLUG = "apex-retail-ams-outsourcing-2026";
const STRATEGY_ARTIFACT_CODES = [
  "d01_strategy_memo",
  "d02_value_target",
  "d03_archetype_decision",
] as const;
const STRATEGY_CRITERION_IDS = [
  "GATE-STRATEGY-01",
  "GATE-STRATEGY-02",
  "GATE-STRATEGY-03",
] as const;
const STRATEGY_EVIDENCE_BASELINE = [
  { requirementId: "EVID-SRC-STR-INCUMBENT", currentState: "Available" },
  { requirementId: "EVID-SRC-STR-SPONSOR-COMMIT", currentState: "Loaded" },
] as const;

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function POST(_req: Request, { params }: RouteCtx) {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "not_found", detail: "No reset route for this environment." },
      { status: 404 },
    );
  }

  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    tenancyError = error;
  }

  try {
    const { eventId } = await params;
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
          error: "no_client",
          detail: "No active client for Source golden-event reset.",
        },
        { status: 403 },
      );
    }

    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventId,
      effectiveClientKey,
    ).catch(() => null);
    const lookupId = resolvedEventId ?? eventId;
    const supabase = getAzureWriteFluentClient();

    const { data: persistedEvent, error: fetchError } = await supabase
      .from("source_events")
      .select("id, client_key, event_code, event_name")
      .eq("id", lookupId)
      .maybeSingle();

    if (fetchError) {
      return Response.json(
        { error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent || persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }
    if (
      persistedEvent.event_code !== GOLDEN_EVENT_CODE &&
      eventId !== GOLDEN_EVENT_SLUG
    ) {
      return Response.json(
        {
          error: "forbidden",
          detail: "This reset route is only available for the Apex golden event.",
        },
        { status: 403 },
      );
    }

    await scaffoldNewEventSubstrate(
      persistedEvent.id,
      persistedEvent.client_key,
    ).catch((error) => {
      console.warn(
        "[source golden reset] substrate scaffold repair failed:",
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
    const canReset = Boolean(
      accessPolicy?.canApproveSourceStages || canonicalAdminFallbackAllowed,
    );
    if (!canReset) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "Source stage-approval rights are required to reset the golden event.",
        },
        { status: 403 },
      );
    }

    const nowIso = new Date().toISOString();
    const updates = await Promise.all([
      supabase
        .from("source_events")
        .update({
          current_stage_key: "strategy",
          lifecycle_state: "active",
          updated_at: nowIso,
        })
        .eq("id", persistedEvent.id)
        .eq("client_key", effectiveClientKey),
      supabase
        .from("source_event_gate_criterion_states")
        .update({
          state: "pending",
          reviewer_user_id: null,
          reviewed_at: null,
          notes: null,
          evidence_artifact_ids: [],
          waiver_approval_id: null,
          updated_at: nowIso,
        })
        .eq("source_event_id", persistedEvent.id)
        .in("criterion_id", [...STRATEGY_CRITERION_IDS]),
      supabase
        .from("source_event_artifact_states")
        .update({
          status: "not_started",
          linked_artifact_id: null,
          notes: null,
          body: null,
          body_authored_by: null,
          body_updated_at: null,
          body_generation_metadata: null,
          updated_at: nowIso,
        })
        .eq("source_event_id", persistedEvent.id)
        .eq("stage_key", "strategy")
        .in("artifact_code", [...STRATEGY_ARTIFACT_CODES]),
    ]);

    const failedUpdate = updates.find((result) => result.error);
    if (failedUpdate?.error) {
      return Response.json(
        { error: "update_failed", detail: failedUpdate.error.message },
        { status: 500 },
      );
    }

    for (const evidenceState of STRATEGY_EVIDENCE_BASELINE) {
      const { error } = await supabase
        .from("source_event_evidence_states")
        .update({
          current_state: evidenceState.currentState,
          source_artifact_id: null,
          notes: null,
          last_synced_at: nowIso,
          updated_at: nowIso,
        })
        .eq("source_event_id", persistedEvent.id)
        .eq("stage_key", "strategy")
        .eq("requirement_id", evidenceState.requirementId);
      if (error) {
        return Response.json(
          { error: "update_failed", detail: error.message },
          { status: 500 },
        );
      }
    }

    return Response.json({
      ok: true,
      eventId: persistedEvent.id,
      eventCode: persistedEvent.event_code,
      stageKey: "strategy",
      reset: {
        criteria: STRATEGY_CRITERION_IDS.length,
        artifacts: STRATEGY_ARTIFACT_CODES.length,
        evidence: STRATEGY_EVIDENCE_BASELINE.length,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/source/:eventId/test-reset]", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

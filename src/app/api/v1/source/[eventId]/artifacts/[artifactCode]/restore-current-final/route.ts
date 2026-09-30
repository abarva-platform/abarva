import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { findCurrentAcceptedClientFinal } from "@/lib/source/contracts/current-client-final";
import { readVerifiedClientFinalText } from "@/lib/source/contracts/verified-client-final-text";
import type { SourceEventArtifactStateRow } from "@/lib/source/canvas-substrate/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId?: string; artifactCode?: string }>;
};

function error(status: number, code: string): Response {
  return Response.json({ ok: false, error: code }, { status });
}

export async function POST(_request: Request, { params }: RouteContext) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    tenancy = await requireTenancy();
  } catch (cause) {
    return tenancyErrorResponse(cause);
  }
  const { eventId, artifactCode } = await params;
  if (!eventId || !artifactCode) return error(400, "missing_artifact_identity");

  const client = await getActiveClientRow();
  if (!client || client.id !== tenancy.clientId) return error(403, "no_active_client");
  const tenantKey = clientKeyToInventorySubstrateKey(client.key);
  const read = getAzureReadFluentClient();
  const { data: event, error: eventError } = await read
    .from("source_events")
    .select("id, client_key")
    .eq("id", eventId)
    .eq("client_key", client.key)
    .maybeSingle();
  if (eventError) return error(500, "event_lookup_failed");
  if (!event || event.client_key !== client.key) return error(403, "forbidden_event");

  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: client.key,
    sourceEventId: event.id,
  }).catch(() => null);
  if (!policy?.canUploadSourceArtifacts || !policy.canApproveSourceStages) {
    return error(403, "approval_rights_required");
  }

  const { data: state, error: stateError } = await read
    .from("source_event_artifact_states")
    .select("*")
    .eq("source_event_id", event.id)
    .eq("tenant_key", client.key)
    .eq("artifact_code", artifactCode)
    .maybeSingle<SourceEventArtifactStateRow>();
  if (stateError) return error(500, "artifact_state_lookup_failed");
  if (!state) return error(404, "artifact_state_not_found");
  if (state.status !== "approved") return error(409, "approved_state_required");

  let final;
  try {
    final = await findCurrentAcceptedClientFinal(event.id, client.key, artifactCode);
  } catch {
    return error(500, "client_final_lookup_failed");
  }
  if (!final) return error(409, "current_client_final_required");
  let extracted: Awaited<ReturnType<typeof readVerifiedClientFinalText>>;
  try {
    extracted = await readVerifiedClientFinalText(final, tenantKey, event.id);
  } catch (cause) {
    const code = cause instanceof Error ? cause.message : "";
    if (["invalid_client_final_storage", "client_final_hash_mismatch", "unreadable_client_final"].includes(code)) {
      return error(409, code);
    }
    return error(503, "client_final_unavailable");
  }
  if (state.linked_artifact_id === final.id && state.body === extracted.text) {
    return Response.json({ ok: true, artifactId: final.id, restored: false });
  }

  const now = new Date().toISOString();
  const write = selectSourceWriteAdapter(undefined, client.key);
  const restored = await write.updateArtifactBody({
    artifactRowId: state.id,
    columns: {
      body: extracted.text,
      body_format: "markdown",
      body_authored_by: final.clientFinalAcceptedBy,
      body_updated_at: now,
      linked_artifact_id: final.id,
      status: "approved",
      body_generation_metadata: {
        clientFinal: {
          artifactId: final.id,
          fileName: final.fileName,
          version: final.version,
          acceptedAt: final.clientFinalAcceptedAt,
          acceptedBy: final.clientFinalAcceptedBy,
          textExtraction: { method: extracted.method, bodyAvailable: true },
        },
        restoration: {
          previousLinkedArtifactId: state.linked_artifact_id,
          restoredAt: now,
          restoredBy: tenancy.userId,
        },
      },
      updated_at: now,
    },
  });
  if (!restored.ok) return error(500, "artifact_restore_failed");

  const audit = await write.insertActivityLog({
    eventId: event.id,
    clientKey: client.key,
    actorUserId: tenancy.userId,
    actorDisplayName: null,
    actorRole: null,
    actionType: "artifact_client_final_link_restored",
    actionLabel: `Restored accepted Client Final link for ${artifactCode}`,
    stageKey: state.stage_key,
    artifactCode,
    reason: "Accepted Client Final record and stage substrate disagreed; restored verified stored bytes.",
    metadata: {
      artifactId: final.id,
      previousLinkedArtifactId: state.linked_artifact_id,
      blobSha256: final.blobSha256,
    },
    occurredAtIso: now,
  });
  if (!audit.ok) {
    console.error("[source restore-current-final] activity_insert_failed", {
      eventId: event.id,
      artifactCode,
      error: audit.error,
    });
  }
  return Response.json({ ok: true, artifactId: final.id, restored: true });
}

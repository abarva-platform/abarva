import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { strategyBasisReady, strategyConfirmationVersion, type StrategyConfirmationEvent } from "@/lib/source/strategy-confirmation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const { eventId } = await params;
  const body = (await request.json().catch(() => null)) as {
    version?: unknown;
    confirmed?: unknown;
  } | null;
  if (body?.confirmed !== true || typeof body.version !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const client = await getActiveClientRow().catch(() => null);
  if (!client?.key) {
    return Response.json({ error: "no_client" }, { status: 403 });
  }
  const db = getAzureWriteFluentClient();
  const { data: event, error: readError } = await db
    .from("source_events")
    .select("id, client_key, current_stage_key, approval_policy_code, created_by_user_id, decision_owner, trigger_description, scope_description, estimated_value_usd, updated_at")
    .eq("id", eventId)
    .eq("client_key", client.key)
    .maybeSingle<StrategyConfirmationEvent & {
      current_stage_key: string;
      created_by_user_id: string | null;
    }>();
  if (readError) return Response.json({ error: "lookup_failed" }, { status: 500 });
  if (!event) return Response.json({ error: "not_found" }, { status: 404 });
  if (event.approval_policy_code !== "self_v1") {
    return Response.json({ error: "strict_policy" }, { status: 403 });
  }
  if (event.current_stage_key !== "strategy") {
    return Response.json({ error: "wrong_stage" }, { status: 409 });
  }

  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: client.key,
    sourceEventId: event.id,
  }).catch(() => null);
  if (!access?.canApproveSourceStages ||
      (access.accessLevel !== "client_admin" && event.created_by_user_id !== tenancy.userId)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const currentVersion = strategyConfirmationVersion(event);
  if (body.version !== currentVersion) {
    return Response.json(
      { error: "stale_strategy", detail: "The strategy changed. Reload and review it before confirming." },
      { status: 409 },
    );
  }
  if (!strategyBasisReady(event)) {
    return Response.json(
      { error: "strategy_basis_incomplete", detail: "Complete the decision owner, mandate and planning value thesis before confirming." },
      { status: 409 },
    );
  }

  const actor = await getCurrentUser().catch(() => null);
  const { data: receipt, error: writeError } = await db
    .from("source_event_activity")
    .insert({
      event_id: event.id,
      client_key: client.key,
      actor_user_id: tenancy.userId,
      actor_display_name: actor?.name ?? actor?.email ?? null,
      actor_role: actor?.primaryRole ?? null,
      action_type: "strategy_owner_confirmed",
      action_label: "Event Owner confirmed current strategy basis",
      stage_key: "strategy",
      reason: "Reviewed current mandate, decision owner and planning value thesis; this is not sponsor sign-off or stage approval.",
      metadata: { version: currentVersion, decision: "event_owner_strategy_confirmation" },
    })
    .select("id")
    .single<{ id: string }>();
  if (writeError || !receipt) {
    return Response.json({ error: "write_failed" }, { status: 500 });
  }
  return Response.json({ ok: true, receiptId: receipt.id });
}

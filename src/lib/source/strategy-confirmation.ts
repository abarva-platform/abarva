import { createHash } from "node:crypto";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export interface StrategyConfirmationEvent {
  id: string;
  client_key: string;
  approval_policy_code: string | null;
  decision_owner: string | null;
  trigger_description: string | null;
  scope_description: string | null;
  estimated_value_usd: number | null;
  updated_at: string | Date;
}

interface StrategyConfirmationActivity {
  action_type: string;
  stage_key: string | null;
  metadata: Record<string, unknown> | null;
}

export function strategyConfirmationVersion(event: StrategyConfirmationEvent): string {
  const revision = new Date(event.updated_at).toISOString();
  const basis = [
    event.id,
    event.client_key,
    event.approval_policy_code,
    event.decision_owner,
    event.trigger_description,
    event.scope_description,
    event.estimated_value_usd,
    revision,
  ];
  return createHash("sha256").update(JSON.stringify(basis)).digest("hex");
}

export function confirmationMatchesCurrentEvent(
  event: StrategyConfirmationEvent,
  activity: StrategyConfirmationActivity | null,
): boolean {
  return event.approval_policy_code === "self_v1" &&
    activity?.action_type === "strategy_owner_confirmed" &&
    activity.stage_key === "strategy" &&
    activity.metadata?.version === strategyConfirmationVersion(event);
}

export async function hasCurrentStrategyOwnerConfirmation(
  event: StrategyConfirmationEvent,
): Promise<boolean> {
  if (event.approval_policy_code !== "self_v1") return false;
  const { data, error } = await getAzureReadFluentClient()
    .from("source_event_activity")
    .select("action_type, stage_key, metadata")
    .eq("event_id", event.id)
    .eq("client_key", event.client_key)
    .eq("action_type", "strategy_owner_confirmed")
    .eq("stage_key", "strategy")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle<StrategyConfirmationActivity>();
  if (error) throw new Error(error.message);
  return confirmationMatchesCurrentEvent(event, data);
}

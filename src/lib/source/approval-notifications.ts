import "server-only";

import { emitNotification } from "@/lib/admin/broker/notification-broker";

export function emitSourceApprovalNotificationBestEffort(input: {
  tenantKey: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorUserId?: string | null;
  targetResourceId?: string | null;
}): void {
  void emitNotification({
    tenantKey: input.tenantKey,
    eventType: input.eventType,
    payload: input.payload,
    actorUserId: input.actorUserId ?? undefined,
    targetResourceId: input.targetResourceId ?? undefined,
  }).catch((err: unknown) => {
    console.warn(
      JSON.stringify({
        event: "source.approval_notification_emit_failed",
        event_type: input.eventType,
        tenant_key: input.tenantKey,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  });
}

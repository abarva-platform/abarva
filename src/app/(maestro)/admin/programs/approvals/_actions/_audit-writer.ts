import 'server-only';

// PRE-W4-PR-4 · Approval escalation audit writer
//
// Centralises the `admin_audit_log` write used by the notify-sponsor
// and escalate-to-platform-admin server actions. The schema lives in
// `20260426120500_admin_audit_log.sql` — category='approval' is one
// of the canonical buckets allowed by the table's CHECK constraint.
//
// Wave 4 wiring · the two action strings written here
//   • `approval_sponsor_notified` → Tier 1 `approval.escalated`
//   • `approval_escalated`         → Tier 2 `approval.escalated`
// are the source events for the `approval.escalated` notification
// channel introduced in Wave 4 at severity = critical. The audit row
// is the source of truth; the runtime mutation on
// `program_approval_requests` is the state-machine side effect.
//
// Failure handling · audit-write failures MUST NOT block the runtime
// flow. The caller catches and emits a structured warn. The action
// returns success because the user-visible mutation already landed;
// downstream Wave 4 can backfill via a periodic reconciliation
// against `program_approval_requests.last_notified_at`.

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { tenantAliasesFor } from '@/lib/tenant/aliases';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';

export type ApprovalEscalationAuditAction =
  | 'approval_sponsor_notified'
  | 'approval_escalated';

export interface ApprovalEscalationAuditInput {
  tenantKey: string;
  actorUserId: string;
  action: ApprovalEscalationAuditAction;
  requestId: string;
  programId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

async function resolveClientIdByCanonicalKey(
  canonicalKey: string,
): Promise<string | null> {
  try {
    const aliases = tenantAliasesFor(canonicalKey);
    for (const alias of aliases) {
      const row = await azureRead.maybeSingle<{ id: string }>({
        table: 'clients',
        columns: ['id'],
        where: { tenant_key: alias },
      });
      if (row?.id) return row.id;
    }
    for (const alias of aliases) {
      const row = await azureRead.maybeSingle<{ id: string }>({
        table: 'clients',
        columns: ['id'],
        where: { slug: alias },
      });
      if (row?.id) return row.id;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Append one immutable `admin_audit_log` row for an escalation
 * transition. Returns true when the row was written; false when the
 * env is fixture-only, the destination client_id is unresolved, or
 * the write itself fails.
 */
export async function writeApprovalEscalationAudit(
  input: ApprovalEscalationAuditInput,
): Promise<boolean> {
  if (isFixtureMode()) {
    return false;
  }

  const clientId = await resolveClientIdByCanonicalKey(input.tenantKey);
  if (!clientId) {
    console.warn(
      JSON.stringify({
        event: 'approval_escalation_audit_skipped',
        reason: 'unresolved_client_id',
        tenant: input.tenantKey,
        action: input.action,
        requestId: input.requestId,
      }),
    );
    return false;
  }

  try {
    const supabase = getAzureWriteFluentClient();
    const { error } = await supabase.from('admin_audit_log').insert({
      client_id: clientId,
      actor_person_id: null,
      category: 'approval',
      action: input.action,
      target_kind: 'program_approval_request',
      target_id: null,
      summary: input.summary,
      metadata: {
        actor_user_id: input.actorUserId,
        request_id: input.requestId,
        program_id: input.programId,
        tenant_key: input.tenantKey,
        ...(input.metadata ?? {}),
      },
    });
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'approval_escalation_audit_failed',
          reason: error.message ?? 'unknown',
          action: input.action,
          requestId: input.requestId,
        }),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'approval_escalation_audit_failed',
        reason: err instanceof Error ? err.message : 'unknown',
        action: input.action,
        requestId: input.requestId,
      }),
    );
    return false;
  }
}

'use server';

// PRE-W4-PR-4 · Approval escalation · "Escalate to platform admin" action
//
// Tier-2 admin-initiated escalation. Flips `escalation_level` to 2 and
// records the target platform-admin user id in `escalated_to_user_id`.
//
// Wave 4 wiring · the audit row written here
// (`category='approval'`, `action='approval_escalated'`) is the source
// of the `approval.escalated` (Tier 2) notification event introduced
// in Trust Plane Wave 4 at severity = critical.
//
// Auto-escalation cron arrives in Wave 7. This PR ships the
// admin-initiated path only.
//
// Broker boundary · This file lives under `_actions/` so direct calls
// into `escalateToPlatformAdmin` (the approval lib) and the audit
// writer are allowed. The lint excludes `_actions/` paths.

import { revalidatePath } from 'next/cache';
import {
  escalateToPlatformAdmin,
  getApprovalRequestById,
} from '@/lib/programs/approval';
import {
  AdminAuthError,
  requireAdminDecide,
} from '@/app/api/admin/programs/approvals/_auth';
import { writeApprovalEscalationAudit } from './_audit-writer';

export interface EscalateApprovalResult {
  ok: boolean;
  /** New escalation level after the call. */
  escalationLevel: 0 | 1 | 2;
  /** Clerk user id of the platform-admin recipient. */
  escalatedToUserId: string | null;
  error?:
    | 'unauthorized'
    | 'not_found'
    | 'wrong_tenant'
    | 'already_escalated'
    | 'failed';
  detail?: string;
}

/**
 * `escalatedToUserId` may be omitted by the caller — when it is, we
 * route to a sentinel "platform-admin queue" user id derived from the
 * tenant. Wave 4 ships a real recipient resolver; PR-4 uses the
 * actor's own user id (a self-routed audit-only escalation) so the
 * action is wired end-to-end without depending on the resolver.
 */
export async function escalateApprovalAction(
  requestId: string,
  escalatedToUserIdOverride?: string,
): Promise<EscalateApprovalResult> {
  if (!requestId || typeof requestId !== 'string') {
    return {
      ok: false,
      escalationLevel: 0,
      escalatedToUserId: null,
      error: 'failed',
      detail: 'requestId required',
    };
  }

  let auth;
  try {
    auth = await requireAdminDecide();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return {
        ok: false,
        escalationLevel: 0,
        escalatedToUserId: null,
        error: 'unauthorized',
        detail: err.code,
      };
    }
    throw err;
  }

  const existing = await getApprovalRequestById(requestId).catch(() => null);
  if (!existing) {
    return {
      ok: false,
      escalationLevel: 0,
      escalatedToUserId: null,
      error: 'not_found',
    };
  }
  if (existing.tenantKey !== auth.tenantKey) {
    return {
      ok: false,
      escalationLevel: 0,
      escalatedToUserId: null,
      error: 'wrong_tenant',
    };
  }
  if (existing.escalationLevel === 2) {
    return {
      ok: false,
      escalationLevel: 2,
      escalatedToUserId: existing.escalatedToUserId,
      error: 'already_escalated',
    };
  }

  const targetUserId =
    escalatedToUserIdOverride && escalatedToUserIdOverride.trim().length > 0
      ? escalatedToUserIdOverride.trim()
      : auth.userId;

  try {
    const updated = await escalateToPlatformAdmin({
      requestId,
      escalatedToUserId: targetUserId,
    });

    await writeApprovalEscalationAudit({
      tenantKey: updated.tenantKey,
      actorUserId: auth.userId,
      action: 'approval_escalated',
      requestId: updated.id,
      programId: updated.programId,
      summary: `Approval escalated to platform admin · ${targetUserId}`,
      metadata: {
        escalation_level: updated.escalationLevel,
        escalated_to_user_id: updated.escalatedToUserId,
        from_level: existing.escalationLevel,
      },
    }).catch((err: unknown) => {
      console.warn(
        JSON.stringify({
          event: 'approval_escalation_audit_failed',
          action: 'approval_escalated',
          requestId: updated.id,
          reason: err instanceof Error ? err.message : String(err),
        }),
      );
    });

    revalidatePath('/admin/programs/approvals');
    revalidatePath(`/admin/programs/approvals/${requestId}`);

    return {
      ok: true,
      escalationLevel: updated.escalationLevel,
      escalatedToUserId: updated.escalatedToUserId,
    };
  } catch (err) {
    return {
      ok: false,
      escalationLevel: existing.escalationLevel,
      escalatedToUserId: existing.escalatedToUserId,
      error: 'failed',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

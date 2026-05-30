'use server';

// PRE-W4-PR-4 · Approval escalation · "Notify sponsor" server action
//
// This is the Tier-1 admin-initiated escalation. It increments the
// `notify_count` on the approval request, sets `last_notified_at`, and
// bumps `escalation_level` from 0 → 1 (no-op if already higher).
//
// Wave 4 wiring · this action writes an `admin_audit_log` row with
// `category='approval'` + `action='approval_sponsor_notified'`. That
// row is the source of the `approval.escalated` (Tier 1) notification
// event introduced in Trust Plane Wave 4 (severity: critical). Wave 4
// reads `admin_audit_log` rather than `program_approval_requests` so
// the runtime mutation and the event source stay decoupled.
//
// Auth posture · `requireAdminDecide` matches the existing POST
// /api/admin/programs/approvals/[requestId] gate. Notify is a decide-
// adjacent action (admin-only); ordinary tenant members cannot fire it.
//
// Broker boundary · This file lives under `_actions/` so direct
// supabase imports via `markSponsorNotified` and the admin_audit_log
// writer are explicitly allowed (the broker-boundary lint excludes
// `_actions/` paths — see broker-boundary.test.ts).

import { revalidatePath } from 'next/cache';
import {
  getApprovalRequestById,
  markSponsorNotified,
} from '@/lib/programs/approval';
import {
  AdminAuthError,
  requireAdminDecide,
} from '@/app/api/admin/programs/approvals/_auth';
import { writeApprovalEscalationAudit } from './_audit-writer';

export interface NotifySponsorResult {
  ok: boolean;
  /** Wall-clock ISO of the reminder. Used by the UI banner. */
  notifiedAt: string | null;
  /** New cumulative count after this call. */
  notifyCount: number;
  /** Always 1 or 2 after a successful notify. */
  escalationLevel: 0 | 1 | 2;
  error?: 'unauthorized' | 'not_found' | 'wrong_tenant' | 'failed';
  detail?: string;
}

export async function notifySponsorAction(
  requestId: string,
): Promise<NotifySponsorResult> {
  if (!requestId || typeof requestId !== 'string') {
    return {
      ok: false,
      notifiedAt: null,
      notifyCount: 0,
      escalationLevel: 0,
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
        notifiedAt: null,
        notifyCount: 0,
        escalationLevel: 0,
        error: 'unauthorized',
        detail: err.code,
      };
    }
    throw err;
  }

  // Tenant-scope guard. Avoid leaking across tenants even when the
  // attacker knows another tenant's request id.
  const existing = await getApprovalRequestById(requestId).catch(() => null);
  if (!existing) {
    return {
      ok: false,
      notifiedAt: null,
      notifyCount: 0,
      escalationLevel: 0,
      error: 'not_found',
    };
  }
  if (existing.tenantKey !== auth.tenantKey) {
    return {
      ok: false,
      notifiedAt: null,
      notifyCount: 0,
      escalationLevel: 0,
      error: 'wrong_tenant',
    };
  }

  try {
    const updated = await markSponsorNotified({ requestId });

    // Append-only audit. Failure here MUST NOT break the runtime flow
    // (the UI banner is the second audit channel via structured log).
    await writeApprovalEscalationAudit({
      tenantKey: updated.tenantKey,
      actorUserId: auth.userId,
      action: 'approval_sponsor_notified',
      requestId: updated.id,
      programId: updated.programId,
      summary:
        `Sponsor reminded · attempt #${updated.notifyCount} · ` +
        `level ${updated.escalationLevel}`,
      metadata: {
        notify_count: updated.notifyCount,
        escalation_level: updated.escalationLevel,
        last_notified_at: updated.lastNotifiedAt,
      },
    }).catch((err: unknown) => {
      console.warn(
        JSON.stringify({
          event: 'approval_escalation_audit_failed',
          action: 'approval_sponsor_notified',
          requestId: updated.id,
          reason: err instanceof Error ? err.message : String(err),
        }),
      );
    });

    revalidatePath('/admin/programs/approvals');
    revalidatePath(`/admin/programs/approvals/${requestId}`);

    return {
      ok: true,
      notifiedAt: updated.lastNotifiedAt,
      notifyCount: updated.notifyCount,
      escalationLevel: updated.escalationLevel,
    };
  } catch (err) {
    return {
      ok: false,
      notifiedAt: null,
      notifyCount: existing.notifyCount,
      escalationLevel: existing.escalationLevel,
      error: 'failed',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

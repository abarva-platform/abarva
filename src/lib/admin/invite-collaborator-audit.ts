/**
 * Invite-collaborator audit writer — PRE-W4-PR-1.
 *
 * Writes one row to `admin_audit_log` per successful Clerk invitation
 * issued from the `Invite collaborator` dialog (and one row per accepted
 * invitation, sourced from the Clerk webhook). Category `'auth'` is the
 * canonical category for identity / session-shaping events per the
 * table-schema CHECK constraint in `20260426120500_admin_audit_log.sql`.
 *
 * Why a dedicated module: the server action and the webhook route MUST
 * stay thin. The audit write needs explicit fixture-mode handling (the
 * broker boundary disallows direct supabase-client imports from
 * app-tier code, but `azureRead` / `getAzureWriteFluentClient` are the
 * sanctioned data-plane seams that the existing `tenant-switch-audit.ts`
 * already uses). `admin_audit_log` is not yet writable through a
 * higher-level adapter — see `admin-audit-log-adapter.ts` "Wave 27+
 * writes events" — so app-tier writes go straight through these seams.
 *
 * PII masking: the invitee email NEVER lands in the audit row in plain
 * text. We persist only `first-char + domain` (`m***@example.com`). The
 * raw email is in Clerk, which is the source of truth; the audit row
 * carries enough signal to correlate (invitation_id + masked address)
 * without spraying inbound emails across our Supabase exports.
 *
 * Failure handling: a failed audit write MUST NOT block the user-visible
 * action. The server action / webhook handler emits a structured-log
 * warning instead — that line is the second audit channel.
 *
 * Wave 4 contract: this writer is the source of truth for the
 * `auth.invite_sent` and `auth.invite_accepted` comms events. The Wave
 * 4 surface SELECTs `admin_audit_log` WHERE `action IN
 * ('invite_sent', 'invite_accepted')` and renders the timeline. Do not
 * change `action` strings without coordinating with the Wave 4 lane.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { tenantAliasesFor } from '@/lib/tenant/aliases';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';

/**
 * Mask an email for audit storage. We keep the first character of the
 * local part and the full domain so a reader can still answer "did we
 * invite <m***@example.com>?" without exposing the full address.
 *
 * Examples:
 *   - `morgan@example.com` → `m***@example.com`
 *   - `q@x.test`           → `q***@x.test`
 *   - `not-an-email`       → `***@***` (defensive fallback)
 */
export function maskInviteeEmail(email: string): string {
  const trimmed = (email ?? '').trim();
  const at = trimmed.indexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return '***@***';
  const first = trimmed[0]!;
  const domain = trimmed.slice(at + 1);
  return `${first}***@${domain}`;
}

export type InviteAuditAction = 'invite_sent' | 'invite_accepted';

export interface InviteAuditInput {
  /** Canonical tenant key (e.g. `apex-retail`). Resolves to `clients.id`. */
  tenantCanonicalKey: string;
  /** Clerk user id of the actor (sender for invite_sent; null for accepted). */
  actorUserId: string | null;
  /** Raw invitee email — masked before persistence. */
  inviteeEmail: string;
  /** Clerk-issued invitation id (returned by `clerkClient.invitations.createInvitation`). */
  invitationId: string;
  /** Role offered in the invitation. */
  role: string;
  /** Optional list of program ids the invitee will be provisioned to. */
  programs?: readonly string[];
  /** Either `invite_sent` (action) or `invite_accepted` (webhook). */
  action: InviteAuditAction;
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
 * Writes one row to admin_audit_log for an invite-related event.
 * Returns true when the row landed; false (and emits a structured-log
 * warning) when fixture mode, an unresolved client_id, or a DB error
 * prevents the write. Callers MUST NOT gate the user-visible action on
 * the return value — the structured-log channel is the second audit
 * trail.
 */
export async function writeInviteAudit(input: InviteAuditInput): Promise<boolean> {
  if (isFixtureMode()) {
    return false;
  }

  const clientId = await resolveClientIdByCanonicalKey(input.tenantCanonicalKey);
  if (!clientId) {
    console.warn(
      JSON.stringify({
        event: 'invite_audit_skipped',
        reason: 'unresolved_client_id',
        action: input.action,
        tenant: input.tenantCanonicalKey,
      }),
    );
    return false;
  }

  const masked = maskInviteeEmail(input.inviteeEmail);
  const summary =
    input.action === 'invite_sent'
      ? `Invitation sent · ${masked} (${input.role})`
      : `Invitation accepted · ${masked}`;

  try {
    const supabase = getAzureWriteFluentClient();
    const { error } = await supabase.from('admin_audit_log').insert({
      client_id: clientId,
      actor_person_id: null,
      category: 'auth',
      action: input.action,
      target_kind: 'invitation',
      target_id: null,
      summary,
      metadata: {
        actor_user_id: input.actorUserId,
        invitee_email_masked: masked,
        invitation_id: input.invitationId,
        role: input.role,
        ...(input.programs && input.programs.length > 0
          ? { programs: [...input.programs] }
          : {}),
      },
    });
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'invite_audit_failed',
          reason: error.message ?? 'unknown',
          action: input.action,
          tenant: input.tenantCanonicalKey,
        }),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'invite_audit_failed',
        reason: err instanceof Error ? err.message : 'unknown',
        action: input.action,
        tenant: input.tenantCanonicalKey,
      }),
    );
    return false;
  }
}

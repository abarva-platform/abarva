import 'server-only';

// Source vendor portal — data access.
//
// SECURITY NOTE, and it is the crux of this module.
//
// Every other Source DAO relies on RLS for tenant scoping because the caller is
// an authenticated user inside a tenant. A VENDOR HAS NO TENANT SESSION — they
// are outside the organisation entirely. So nothing here may lean on ambient
// scoping: every read and write is explicitly bounded by `vendor_id`, and the
// vendor id is only ever derived from a verified session token, never from
// anything the request supplies.
//
// The rule this enforces: one vendor must never be able to address another
// vendor's row, even by guessing an id.

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { hashToken, sessionIsLive } from './session';
import type { InvitationState } from './access';
import type { VendorActivityType } from './portal-view';

export interface VendorRow {
  id: string;
  sourceEventId: string;
  tenantKey: string;
  vendorLegalName: string;
  vendorDisplayName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  invitationState: InvitationState;
  acceptBy: Date;
  respondBy: Date;
  acknowledgedAt: Date | null;
}

interface VendorDbRow {
  id: string;
  source_event_id: string;
  tenant_key: string;
  vendor_legal_name: string;
  vendor_display_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  username: string;
  password_hash: string;
  password_salt: string;
  invitation_state: InvitationState;
  accept_by: string | Date;
  respond_by: string | Date;
  acknowledged_at: string | Date | null;
}

function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v);
}

function mapVendor(r: VendorDbRow): VendorRow {
  return {
    id: r.id,
    sourceEventId: r.source_event_id,
    tenantKey: r.tenant_key,
    vendorLegalName: r.vendor_legal_name,
    vendorDisplayName: r.vendor_display_name,
    primaryContactName: r.primary_contact_name,
    primaryContactEmail: r.primary_contact_email,
    username: r.username,
    passwordHash: r.password_hash,
    passwordSalt: r.password_salt,
    invitationState: r.invitation_state,
    acceptBy: toDate(r.accept_by),
    respondBy: toDate(r.respond_by),
    acknowledgedAt: r.acknowledged_at ? toDate(r.acknowledged_at) : null,
  };
}

/**
 * Look up a credential for sign-in.
 *
 * Scoped to (event, username) so the same vendor competing in two events has
 * two independent credentials — revoking one cannot affect the other.
 *
 * Returns null for "no such username". The CALLER must still run password
 * verification against a dummy hash in that case, or the response time alone
 * tells an attacker which usernames exist.
 */
export async function findVendorForSignIn(
  sourceEventId: string,
  username: string,
): Promise<VendorRow | null> {
  try {
    const rows = await azureRead.query<VendorDbRow>(
      `SELECT * FROM source_event_vendors
        WHERE source_event_id = $1 AND username = $2
        LIMIT 1`,
      [sourceEventId, username],
      { missingTable: 'empty' },
    );
    return rows[0] ? mapVendor(rows[0]) : null;
  } catch (error) {
    console.error('[findVendorForSignIn]', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Resolve a vendor from a session cookie.
 *
 * This is the ONLY way a request becomes a vendor identity. The session token
 * is hashed and matched; the vendor id is read from the joined row, never from
 * the request.
 */
export async function resolveVendorBySession(
  sourceEventId: string,
  sessionToken: string,
): Promise<VendorRow | null> {
  if (!sessionToken) return null;
  try {
    const rows = await azureRead.query<VendorDbRow & { expires_at: string; revoked_at: string | null }>(
      `SELECT v.*, s.expires_at, s.revoked_at
         FROM source_event_vendor_sessions s
         JOIN source_event_vendors v ON v.id = s.vendor_id
        WHERE s.session_token_hash = $1
          AND v.source_event_id = $2
        LIMIT 1`,
      [hashToken(sessionToken), sourceEventId],
      { missingTable: 'empty' },
    );
    const row = rows[0];
    if (!row) return null;
    if (!sessionIsLive({ expiresAt: toDate(row.expires_at), revokedAt: row.revoked_at })) {
      return null;
    }
    return mapVendor(row);
  } catch (error) {
    console.error('[resolveVendorBySession]', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function createSession(input: {
  vendorId: string;
  tenantKey: string;
  tokenHash: string;
  expiresAt: Date;
  ipHash: string | null;
  userAgent: string | null;
}): Promise<boolean> {
  try {
    const db = getAzureWriteFluentClient();
    const { error } = await db.from('source_event_vendor_sessions').insert({
      vendor_id: input.vendorId,
      tenant_key: input.tenantKey,
      session_token_hash: input.tokenHash,
      expires_at: input.expiresAt.toISOString(),
      ip_hash: input.ipHash,
      user_agent: input.userAgent,
    });
    return !error;
  } catch (error) {
    console.error('[createSession]', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function revokeSession(tokenHash: string): Promise<void> {
  try {
    const db = getAzureWriteFluentClient();
    await db
      .from('source_event_vendor_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_token_hash', tokenHash);
  } catch (error) {
    console.error('[revokeSession]', error instanceof Error ? error.message : error);
  }
}

/**
 * Append to the audit spine.
 *
 * Deliberately swallows its own failure: this table is evidence, and a failed
 * audit write must never take down the action the vendor was performing. A
 * missing audit row is a gap we can see; a 500 during acknowledgement on the
 * last day of a bid window is a vendor excluded from a procurement.
 * Failures are logged loudly so the gap is detectable.
 */
export async function recordVendorEvent(input: {
  vendorId: string;
  tenantKey: string;
  type: VendorActivityType | 'sign_in_failed' | 'signed_out';
  payload?: Record<string, unknown>;
  ipHash?: string | null;
}): Promise<void> {
  try {
    const db = getAzureWriteFluentClient();
    const { error } = await db.from('source_event_vendor_events').insert({
      vendor_id: input.vendorId,
      tenant_key: input.tenantKey,
      event_type: input.type,
      payload: input.payload ?? {},
      ip_hash: input.ipHash ?? null,
    });
    if (error) console.error('[recordVendorEvent] AUDIT GAP', input.type, error.message);
  } catch (error) {
    console.error('[recordVendorEvent] AUDIT GAP', input.type, error instanceof Error ? error.message : error);
  }
}

export async function listVendorEvents(
  vendorId: string,
  limit = 50,
): Promise<Array<{ type: VendorActivityType; occurredAt: Date }>> {
  try {
    const rows = await azureRead.query<{ event_type: VendorActivityType; occurred_at: string }>(
      `SELECT event_type, occurred_at
         FROM source_event_vendor_events
        WHERE vendor_id = $1
        ORDER BY occurred_at DESC
        LIMIT $2`,
      [vendorId, limit],
      { missingTable: 'empty' },
    );
    return rows.map((r) => ({ type: r.event_type, occurredAt: toDate(r.occurred_at) }));
  } catch (error) {
    console.error('[listVendorEvents]', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Record acceptance or decline.
 *
 * The declared contact is what someone holding the SHARED credential typed. It
 * is stored as a vendor assertion and must never be rendered as verified
 * identity — see the migration comment on these columns.
 */
export async function recordAcknowledgement(input: {
  vendorId: string;
  intendsToRespond: boolean;
  declaredName: string;
  declaredTitle: string;
  declaredEmail: string;
  declineReason?: string;
}): Promise<boolean> {
  try {
    const db = getAzureWriteFluentClient();
    const now = new Date().toISOString();
    const patch = input.intendsToRespond
      ? {
          invitation_state: 'accepted',
          acknowledged_at: now,
          ack_intends_to_respond: true,
          ack_declared_name: input.declaredName,
          ack_declared_title: input.declaredTitle,
          ack_declared_email: input.declaredEmail,
          updated_at: now,
        }
      : {
          invitation_state: 'declined',
          declined_at: now,
          ack_intends_to_respond: false,
          ack_declared_name: input.declaredName,
          ack_declared_title: input.declaredTitle,
          ack_declared_email: input.declaredEmail,
          decline_reason: input.declineReason ?? null,
          updated_at: now,
        };
    const { error, count } = await db
      .from('source_event_vendors')
      .update(patch)
      // Only an invitation still open may be answered. A vendor cannot
      // re-acknowledge to reset a decline, and cannot answer after withdrawal.
      .eq('id', input.vendorId)
      .eq('invitation_state', 'invited');
    return !error && count === 1;
  } catch (error) {
    console.error('[recordAcknowledgement]', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function countSubmissions(vendorId: string): Promise<number> {
  try {
    const rows = await azureRead.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
         FROM source_event_vendor_submissions
        WHERE vendor_id = $1 AND supersedes_submission_id IS NULL`,
      [vendorId],
      { missingTable: 'empty' },
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

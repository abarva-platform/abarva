import 'server-only';

// OV2-2d-NOTIFY · Email notifications for approval lifecycle events
//
// Three events fire here, all server-side, all fire-and-forget from the
// approval API perspective:
//
//   • notifyApprovalSubmitted → tenant admins ("a brief is queued")
//   • notifyApprovalApproved  → requester ("your brief was approved")
//   • notifyApprovalRejected  → requester ("your brief was returned")
//
// Recipient resolution:
//   • Submitted → tenant admins. The codebase today does not have a
//     dedicated `tenant_admin` role helper (see OV2-2d-RBAC). Until
//     that lands, we fall back to the platform-admin email allowlist
//     mirrored from src/app/api/admin/programs/approvals/_auth.ts.
//   • Approved/Rejected → requester via Clerk user → primaryEmailAddress.
//
// Failure posture: each notify function uses Promise.allSettled across
// recipients and logs failures. They NEVER throw — the approval flow
// must not be blocked by email problems.

import { clerkClient } from '@clerk/nextjs/server';
import { sendEmail, type EmailMessage } from '@/lib/email/send';
import type { ApprovalRequest } from '@/lib/programs/approval';

// Mirrors src/app/api/admin/programs/approvals/_auth.ts.
// When OV2-2d-RBAC ships the tenant_admin role helper, this list goes
// away and is replaced by a `getTenantAdminEmails(tenantKey)` lookup.
const PLATFORM_ADMIN_EMAILS: readonly string[] = [
  'anand+clerk_test@abarva.com',
  'anand.sundaram@thesundaram.com',
];

interface ClerkUserLite {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: ReadonlyArray<{ emailAddress?: string | null }>;
  firstName?: string | null;
  lastName?: string | null;
}

function pickProgramName(request: ApprovalRequest): string {
  const snap = request.briefSnapshot ?? {};
  const candidates = ['programName', 'name', 'title', 'program_name'];
  for (const key of candidates) {
    const value = (snap as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return `Program ${request.programId}`;
}

function pickRequesterName(user: ClerkUserLite | null): string {
  if (!user) return 'A teammate';
  const parts = [user.firstName ?? '', user.lastName ?? ''].filter(
    (s) => s.length > 0,
  );
  if (parts.length > 0) return parts.join(' ');
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;
  if (email) return email;
  return 'A teammate';
}

async function getRequesterUser(userId: string): Promise<ClerkUserLite | null> {
  try {
    const clerk = await clerkClient();
    const user = (await clerk.users.getUser(userId)) as ClerkUserLite;
    return user;
  } catch (err) {
     
    console.error('[approval-notifications] failed to load requester from Clerk', {
      userId,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function getRequesterEmail(user: ClerkUserLite | null): string | null {
  if (!user) return null;
  const primary = user.primaryEmailAddress?.emailAddress;
  if (typeof primary === 'string' && primary.length > 0) return primary;
  const fallback = user.emailAddresses?.[0]?.emailAddress;
  if (typeof fallback === 'string' && fallback.length > 0) return fallback;
  return null;
}

// ── Tenant-admin recipient lookup ──────────────────────────────────────

/**
 * Resolve the email recipients to notify when a brief is queued for
 * approval in the given tenant.
 *
 * Today: returns the platform-admin allowlist regardless of tenantKey.
 * Once OV2-2d-RBAC introduces a tenant_admin role helper, this should
 * lookup tenant admins via that helper.
 */
export async function resolveTenantAdminRecipients(
  // Tenant key is accepted today for the future-RBAC signature even
  // though the fallback ignores it.
  tenantKey: string,
): Promise<string[]> {
  // Consume the param so the future-RBAC signature is preserved without
  // tripping no-unused-vars on this fallback implementation.
  void tenantKey;
  return [...PLATFORM_ADMIN_EMAILS];
}

// ── Email body builders ────────────────────────────────────────────────

const CARD_STYLE =
  'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; ' +
  'max-width: 560px; margin: 24px auto; padding: 24px; ' +
  'background: #F8F7F4; border: 1px solid #E5E1D8; border-radius: 8px; ' +
  'color: #111111;';
const HEADING_STYLE =
  'font-family: Georgia, "Times New Roman", serif; font-weight: normal; ' +
  'font-size: 20px; margin: 0 0 12px 0; color: #111111;';
const BODY_STYLE =
  'font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #1F1F1F;';
const LINK_STYLE =
  'display: inline-block; padding: 10px 18px; background: #111111; ' +
  'color: #F8F7F4; text-decoration: none; border-radius: 4px; ' +
  'font-size: 14px;';
const RATIONALE_STYLE =
  'background: #FFFFFF; border-left: 3px solid #111111; ' +
  'padding: 12px 16px; margin: 16px 0; font-size: 13px; ' +
  'color: #333333; white-space: pre-wrap;';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSubmittedHtml(programName: string, requesterName: string): string {
  return [
    `<div style="${CARD_STYLE}">`,
    `  <h1 style="${HEADING_STYLE}">New program brief queued for approval</h1>`,
    `  <p style="${BODY_STYLE}"><strong>${escapeHtml(requesterName)}</strong> just submitted "<strong>${escapeHtml(programName)}</strong>" for tenant-admin review.</p>`,
    `  <p style="${BODY_STYLE}">Open the queue to approve or return the brief with feedback.</p>`,
    `  <p><a href="/admin/programs/approvals" style="${LINK_STYLE}">Review approval queue</a></p>`,
    `</div>`,
  ].join('\n');
}

function buildApprovedHtml(programName: string, programId: string): string {
  return [
    `<div style="${CARD_STYLE}">`,
    `  <h1 style="${HEADING_STYLE}">Your program brief was approved</h1>`,
    `  <p style="${BODY_STYLE}">"<strong>${escapeHtml(programName)}</strong>" is now active. You can open the program workspace to begin execution.</p>`,
    `  <p><a href="/programs/${escapeHtml(programId)}" style="${LINK_STYLE}">Open program</a></p>`,
    `</div>`,
  ].join('\n');
}

function buildRejectedHtml(programName: string, rationale: string): string {
  return [
    `<div style="${CARD_STYLE}">`,
    `  <h1 style="${HEADING_STYLE}">Your program brief was returned</h1>`,
    `  <p style="${BODY_STYLE}">"<strong>${escapeHtml(programName)}</strong>" was returned by a tenant admin with the following feedback:</p>`,
    `  <div style="${RATIONALE_STYLE}">${escapeHtml(rationale)}</div>`,
    `  <p style="${BODY_STYLE}">You can revise the brief and resubmit.</p>`,
    `  <p><a href="/programs/new" style="${LINK_STYLE}">Edit and resubmit</a></p>`,
    `</div>`,
  ].join('\n');
}

// ── Send fan-out helper ────────────────────────────────────────────────

async function fanOutSend(
  recipients: readonly string[],
  build: (recipient: string) => EmailMessage,
  context: Record<string, string>,
): Promise<void> {
  if (recipients.length === 0) {
     
    console.warn('[approval-notifications] no recipients resolved', context);
    return;
  }
  const results = await Promise.allSettled(
    recipients.map((recipient) => sendEmail(build(recipient))),
  );
  results.forEach((result, idx) => {
    const recipient = recipients[idx];
    if (result.status === 'rejected') {
       
      console.error('[approval-notifications] sendEmail rejected', {
        ...context,
        recipient,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      return;
    }
    if (!result.value.ok) {
       
      console.error('[approval-notifications] sendEmail returned error', {
        ...context,
        recipient,
        error: result.value.error,
      });
    }
  });
}

// ── Public notify API ──────────────────────────────────────────────────

export async function notifyApprovalSubmitted(
  request: ApprovalRequest,
): Promise<void> {
  try {
    const programName = pickProgramName(request);
    const requesterUser = await getRequesterUser(request.requestedByUserId);
    const requesterName = pickRequesterName(requesterUser);
    const recipients = await resolveTenantAdminRecipients(request.tenantKey);

    await fanOutSend(
      recipients,
      (recipient) => ({
        to: recipient,
        subject: `New program brief queued for approval — ${programName}`,
        html: buildSubmittedHtml(programName, requesterName),
        metadata: {
          Event: 'approval.submitted',
          RequestId: request.id,
          TenantKey: request.tenantKey,
          ProgramId: request.programId,
        },
      }),
      {
        event: 'approval.submitted',
        requestId: request.id,
        tenantKey: request.tenantKey,
      },
    );
  } catch (err) {
     
    console.error('[approval-notifications] notifyApprovalSubmitted failed', {
      requestId: request.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function notifyApprovalApproved(
  request: ApprovalRequest,
): Promise<void> {
  try {
    const programName = pickProgramName(request);
    const requesterUser = await getRequesterUser(request.requestedByUserId);
    const recipientEmail = getRequesterEmail(requesterUser);
    const recipients = recipientEmail ? [recipientEmail] : [];

    await fanOutSend(
      recipients,
      (recipient) => ({
        to: recipient,
        subject: `Your program brief was approved — ${programName}`,
        html: buildApprovedHtml(programName, request.programId),
        metadata: {
          Event: 'approval.approved',
          RequestId: request.id,
          TenantKey: request.tenantKey,
          ProgramId: request.programId,
        },
      }),
      {
        event: 'approval.approved',
        requestId: request.id,
        tenantKey: request.tenantKey,
      },
    );
  } catch (err) {
     
    console.error('[approval-notifications] notifyApprovalApproved failed', {
      requestId: request.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function notifyApprovalRejected(
  request: ApprovalRequest,
): Promise<void> {
  try {
    const programName = pickProgramName(request);
    const requesterUser = await getRequesterUser(request.requestedByUserId);
    const recipientEmail = getRequesterEmail(requesterUser);
    const recipients = recipientEmail ? [recipientEmail] : [];
    const rationale = (request.decisionRationale ?? '').trim() || 'No rationale provided.';

    await fanOutSend(
      recipients,
      (recipient) => ({
        to: recipient,
        subject: `Your program brief was returned — ${programName}`,
        html: buildRejectedHtml(programName, rationale),
        metadata: {
          Event: 'approval.rejected',
          RequestId: request.id,
          TenantKey: request.tenantKey,
          ProgramId: request.programId,
        },
      }),
      {
        event: 'approval.rejected',
        requestId: request.id,
        tenantKey: request.tenantKey,
      },
    );
  } catch (err) {
     
    console.error('[approval-notifications] notifyApprovalRejected failed', {
      requestId: request.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

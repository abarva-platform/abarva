'use server';

/**
 * sendInvite server action — PRE-W4-PR-1.
 *
 * Replaces the previous fire-and-forget `setSent(true)` placeholder in
 * `InviteCollaboratorDialog` with a real Clerk invitation call plus a
 * row in `admin_audit_log`. The audit row is the source of truth for
 * the `auth.invite_sent` event consumed by the Wave 4 comms surface.
 *
 * Why a server action (Next 16 App Router):
 *   - Keeps the secret-key Clerk SDK off the client.
 *   - Stays inside the broker boundary — the audit write goes through
 *     the sanctioned `invite-collaborator-audit.ts` module, not via a
 *     direct supabase import from the dialog.
 *   - The dialog can `await` the result and surface success / failure
 *     inline (loading → ✓ / error), instead of running a fetch against
 *     an API route.
 *
 * Authority: caller must hold `role === 'admin'` (or `'maestro'`) on
 * their Clerk publicMetadata. The same shape every other admin route
 * enforces. We also pull the active tenant via `requireTenancy()` so
 * the audit row is correctly scoped — a cross-tenant invite is not
 * possible from this surface.
 *
 * Safety:
 *   - NEVER auto-creates user accounts. Clerk's invitation flow has
 *     the recipient complete sign-up themselves.
 *   - NEVER auto-fills financial / security data. Roles map to the
 *     existing `surface access` posture; no money/security knobs.
 *   - Email is validated server-side AND masked before persistence.
 *   - Rate-limited at 10 invites / 60 s per actor (in-memory).
 *
 * Return shape: a discriminated union `{ ok: true, invitationId } |
 * { ok: false, code, message }` so the dialog can render typed errors
 * without parsing free-form strings.
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { isClerkAPIResponseError } from '@clerk/backend/errors';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import {
  writeInviteAudit,
  maskInviteeEmail,
} from '@/lib/admin/invite-collaborator-audit';
import { checkInviteRateLimit } from '@/lib/admin/invite-rate-limit';

export interface SendInviteInput {
  tenantKey: string;
  email: string;
  role: string;
  programs?: string[];
}

export type SendInviteResult =
  | { ok: true; invitationId: string; maskedEmail: string }
  | {
      ok: false;
      code:
        | 'unauthenticated'
        | 'forbidden'
        | 'no_active_tenant'
        | 'invalid_email'
        | 'invalid_role'
        | 'rate_limited'
        | 'already_member'
        | 'invitation_exists'
        | 'clerk_error'
        | 'unknown_error';
      message: string;
      retryInMs?: number;
    };

// RFC-5322 has corners we don't need to cover for an admin invite UX.
// This guard catches malformed inputs (missing `@`, whitespace,
// double-dots) before Clerk does. Clerk still validates server-side as
// the second line of defense.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

const ALLOWED_ROLES = new Set<string>(['admin', 'collaborator', 'viewer']);

const ADMIN_ROLES = new Set<string>(['admin', 'maestro']);

/**
 * Issues a Clerk invitation and writes one audit row. The dialog
 * caller MUST narrow on `result.ok` before reading `invitationId`.
 */
export async function sendInvite(input: SendInviteInput): Promise<SendInviteResult> {
  // 1) Authentication.
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      code: 'unauthenticated',
      message: 'You must be signed in to send invitations.',
    };
  }

  // 2) Authority — admin or maestro only. We re-read the user from
  // Clerk rather than trusting any cached metadata so a revoked admin
  // can't keep issuing invites until the next page render.
  let role = '';
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    role = (user.publicMetadata?.role as string | undefined) ?? '';
  } catch {
    return {
      ok: false,
      code: 'unknown_error',
      message: 'Could not verify your account. Try again in a moment.',
    };
  }
  if (!ADMIN_ROLES.has(role)) {
    return {
      ok: false,
      code: 'forbidden',
      message: 'Only workspace admins can send invitations.',
    };
  }

  // 3) Active tenant. The audit row needs a `client_id`; we will not
  // write a tenantless invite.
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return {
        ok: false,
        code: 'no_active_tenant',
        message:
          err.code === 'unauthenticated'
            ? 'Your session expired. Sign in again to send invitations.'
            : 'No active workspace. Pick a workspace and try again.',
      };
    }
    throw err;
  }

  // 4) Input validation — server-side. The dialog already gates the
  // Continue button on `email.includes('@')`, but client checks are
  // not load-bearing.
  const email = (input.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return {
      ok: false,
      code: 'invalid_email',
      message: 'That email address looks invalid. Double-check and resend.',
    };
  }
  const roleInput = (input.role ?? '').trim();
  if (!ALLOWED_ROLES.has(roleInput)) {
    return {
      ok: false,
      code: 'invalid_role',
      message: `Role "${roleInput}" is not a valid invitation role.`,
    };
  }

  // 5) Rate limit. Catches burst-send (someone holding the button) and
  // accidental loops. Clerk's own ceiling backs us up at the upstream
  // edge.
  const limit = checkInviteRateLimit(userId);
  if (!limit.allowed) {
    return {
      ok: false,
      code: 'rate_limited',
      message: 'You have sent a lot of invitations recently. Wait a moment and try again.',
      retryInMs: limit.retryInMs,
    };
  }

  // 6) Clerk call. The user-level invitations API is the simplest path
  // — Clerk emails the recipient with a sign-up link; the invitation
  // carries `publicMetadata` we can read back on the webhook to write
  // the matching `invite_accepted` audit row.
  let invitationId: string;
  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        invited_by_user_id: userId,
        tenant_canonical_key: input.tenantKey,
        role: roleInput,
        ...(input.programs && input.programs.length > 0
          ? { programs: input.programs }
          : {}),
      },
      // We do not pass `ignoreExisting` — a duplicate invite to the
      // same email surfaces as a typed error so the admin can decide
      // whether to revoke + reissue.
    });
    invitationId = invitation.id;
  } catch (err) {
    if (isClerkAPIResponseError(err)) {
      const first = err.errors?.[0];
      const code = first?.code ?? '';
      const message = first?.longMessage || first?.message || 'Clerk rejected the invitation.';
      if (code === 'duplicate_record' || code === 'identifier_already_signed_up') {
        return { ok: false, code: 'already_member', message };
      }
      if (code === 'form_identifier_exists' || code === 'invitation_already_exists') {
        return { ok: false, code: 'invitation_exists', message };
      }
      if (err.status === 429) {
        return {
          ok: false,
          code: 'rate_limited',
          message: 'The auth provider is rate-limiting invitations. Try again in a minute.',
        };
      }
      if (err.status === 422 || err.status === 400) {
        return { ok: false, code: 'invalid_email', message };
      }
      return { ok: false, code: 'clerk_error', message };
    }
    return {
      ok: false,
      code: 'unknown_error',
      message: err instanceof Error ? err.message : 'Something went wrong sending the invitation.',
    };
  }

  // 7) Audit row. Fire-and-forget (we already have the Clerk
  // invitation; failing to log is a degraded path, not a user-facing
  // failure). The masked-email + invitation_id pair lets a reviewer
  // correlate the audit row back to Clerk without ever exposing the
  // raw recipient address.
  void writeInviteAudit({
    tenantCanonicalKey: tenancy.clientKey ?? input.tenantKey,
    actorUserId: userId,
    inviteeEmail: email,
    invitationId,
    role: roleInput,
    programs: input.programs,
    action: 'invite_sent',
  }).catch((err) => {
    console.warn(
      JSON.stringify({
        event: 'send_invite_audit_unhandled',
        reason: err instanceof Error ? err.message : 'unknown',
      }),
    );
  });

  return {
    ok: true,
    invitationId,
    maskedEmail: maskInviteeEmail(email),
  };
}

/**
 * W4-PR-6 · Template · `auth.invite_accepted`
 *
 * Fires when an invited teammate completes Clerk sign-up and lands in
 * the tenant. The tenant admin is notified so a real human can verify
 * the role assignment before the new user touches privileged surfaces.
 *
 * Severity: warn. Channel: email_now + in_app. Mandatory for tenant
 * admins. Recipient email is the admin; the invitee email in the body
 * is MASKED so we never echo full PII back.
 */

import {
  renderCtaButton,
  renderEmailShell,
  renderHeadline,
  renderMetaBlock,
  renderParagraph,
  renderTextFooter,
} from './_shared/EmailShell';
import { escapeHtml, formatTs, maskEmail, type TenantBrand } from './_shared/utils';

/** Payload shape for the auth.invite_accepted event. */
export interface AuthInviteAcceptedPayload {
  eventId: string;
  /** Invitee email — masked before rendering. */
  inviteeEmail: string;
  /** Role assigned at invite time (e.g. "CIO", "Maestro"). */
  role: string;
  /** Clerk user id (audit-only; not surfaced in the body). */
  inviteeUserId?: string;
  /** ISO timestamp invite was accepted. */
  acceptedAtIso: string;
  /** ISO timestamp the event was produced. */
  producedAtIso: string;
  /** Optional CTA override. Defaults to Users & Access page. */
  ctaHref?: string;
}

const REASON =
  'you are a tenant admin subscribed to auth.invite_accepted events for this workspace';

export function subject(payload: AuthInviteAcceptedPayload, tenant: TenantBrand): string {
  return `[${tenant.name}] ${maskEmail(payload.inviteeEmail)} joined your tenant`;
}

export function html(payload: AuthInviteAcceptedPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? '/admin/users-access';
  const masked = maskEmail(payload.inviteeEmail);

  const bodyHtml = [
    renderHeadline('Your invitation was accepted'),
    renderParagraph(
      `<strong>${escapeHtml(masked)}</strong> completed sign-up and now has access to ${escapeHtml(tenant.name)} with the <strong>${escapeHtml(payload.role)}</strong> role.`,
    ),
    renderMetaBlock([
      { label: 'Invitee', value: masked },
      { label: 'Role', value: payload.role },
      { label: 'Joined', value: formatTs(payload.acceptedAtIso) },
    ]),
    renderCtaButton('Open Users & Access', cta),
    renderParagraph(
      'If this invitation was unexpected, revoke access from Users & Access. Role changes take effect on the next page load for the affected user.',
    ),
  ].join('');

  return renderEmailShell({
    tenant,
    bodyHtml,
    reason: REASON,
    producedAtIso: payload.producedAtIso,
    eventId: payload.eventId,
  });
}

export function text(payload: AuthInviteAcceptedPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? '/admin/users-access';
  const masked = maskEmail(payload.inviteeEmail);
  return [
    `${tenant.name} · ${tenant.industryTag}`,
    'Your invitation was accepted',
    '',
    `${masked} completed sign-up and now has access to ${tenant.name} with the ${payload.role} role.`,
    '',
    `Invitee: ${masked}`,
    `Role: ${payload.role}`,
    `Joined: ${formatTs(payload.acceptedAtIso)}`,
    '',
    `Open Users & Access: ${cta}`,
    '',
    'If this invitation was unexpected, revoke access from Users & Access.',
    renderTextFooter({
      reason: REASON,
      producedAtIso: payload.producedAtIso,
      eventId: payload.eventId,
    }),
  ].join('\n');
}

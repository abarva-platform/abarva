/**
 * W4-PR-6 · Template · `approval.requested`
 *
 * Fires when a Move / program advancement, a connector activation, or
 * any governed action needs a CXO sign-off. Recipients are the
 * configured approver(s) for the tenant + audit class.
 *
 * Severity: critical. Channel: email_now + in_app. Mandatory.
 */

import {
  renderCtaButton,
  renderEmailShell,
  renderHeadline,
  renderMetaBlock,
  renderParagraph,
  renderTextFooter,
} from './_shared/EmailShell';
import { escapeHtml, formatTs, type TenantBrand } from './_shared/utils';

/** Payload shape for the approval.requested event. */
export interface ApprovalRequestedPayload {
  /** Notification event id (audit pairing). */
  eventId: string;
  /** Stable approval request id; powers the CTA href. */
  requestId: string;
  /** Display name of the program awaiting approval. */
  programName: string;
  /** Current phase the program is in (e.g. "2 · Define"). */
  phase: string;
  /** Display name of the person who submitted the request. */
  requesterName: string;
  /** Optional rationale / scope summary written by the requester. */
  rationale?: string | null;
  /** ISO timestamp when the event was produced. */
  producedAtIso: string;
  /** Optional override for the CTA href. Defaults to admin approvals. */
  ctaHref?: string;
}

/** CAN-SPAM "you're receiving this because" line. */
const REASON =
  'you are a tenant admin subscribed to approval.requested events for this workspace';

export function subject(payload: ApprovalRequestedPayload, tenant: TenantBrand): string {
  return `[${tenant.name}] Approval requested: ${payload.programName} (Phase ${payload.phase})`;
}

export function html(payload: ApprovalRequestedPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? `/admin/programs/approvals/${encodeURIComponent(payload.requestId)}`;
  const bodyHtml = [
    renderHeadline('Your decision is needed'),
    renderParagraph(
      `<strong>${escapeHtml(payload.requesterName)}</strong> submitted <strong>${escapeHtml(payload.programName)}</strong> for approval to advance to Phase ${escapeHtml(payload.phase)}.`,
    ),
    renderMetaBlock([
      { label: 'Program', value: payload.programName },
      { label: 'Phase', value: payload.phase },
      { label: 'Requested by', value: payload.requesterName },
      { label: 'Submitted', value: formatTs(payload.producedAtIso) },
      ...(payload.rationale
        ? [{ label: 'Rationale', value: payload.rationale }]
        : []),
    ]),
    renderCtaButton('Review approval', cta),
    renderParagraph(
      'Approvals expire after 72 hours of inactivity per tenant policy. Action taken here is recorded in the program audit trail.',
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

export function text(payload: ApprovalRequestedPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? `/admin/programs/approvals/${payload.requestId}`;
  const rationaleLine = payload.rationale ? `\nRationale: ${payload.rationale}` : '';
  return [
    `${tenant.name} · ${tenant.industryTag}`,
    'Your decision is needed',
    '',
    `${payload.requesterName} submitted "${payload.programName}" for approval to advance to Phase ${payload.phase}.`,
    `Submitted: ${formatTs(payload.producedAtIso)}${rationaleLine}`,
    '',
    `Review approval: ${cta}`,
    '',
    'Approvals expire after 72 hours of inactivity per tenant policy.',
    renderTextFooter({
      reason: REASON,
      producedAtIso: payload.producedAtIso,
      eventId: payload.eventId,
    }),
  ].join('\n');
}

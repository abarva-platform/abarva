import 'server-only';

// Source approval-request notification.
//
// Emails a Source approver that a sourcing event is waiting for their
// approval, so approvals can be simulated end-to-end by email during pilot
// testing. The caller must pass a recipient resolved from an authorized
// event participant; the mailer never guesses or falls back to an admin.
//
// Delivery goes through the legacy pilot-safe email channel
// (src/lib/email/send.ts): when RESEND_API_KEY is set it sends via Resend,
// otherwise it logs a structured record and returns ok with a `console-*`
// id. We surface that distinction in the result via the `channel` field so
// callers/testers can tell a real send apart from the logged fallback.

import { sendEmail } from '@/lib/email/send';

// The from-address domain MUST be a Resend-verified domain or sends bounce. The
// verified sender domain is the `send.abarva.ai` subdomain (root abarva.ai keeps
// its Google MX and is intentionally NOT verified in Resend). Override via
// SOURCE_APPROVAL_FROM_EMAIL only with an address on a verified domain.
const DEFAULT_APPROVAL_FROM = 'support@send.abarva.ai';

function resolveApprovalFrom(): string {
  const override = process.env.SOURCE_APPROVAL_FROM_EMAIL?.trim();
  return override && override.length > 0 ? override : DEFAULT_APPROVAL_FROM;
}

export interface ApprovalRequestInput {
  approvalKind?: 'stage_gate' | 'sponsor_commitment';
  eventId: string;
  eventName: string;
  stageLabel: string;
  reviewUrl: string;
  approverEmail: string;
  requestedBy?: string | null;
  tenantName?: string | null;
}

export interface ApprovalRequestResult {
  delivered: boolean;
  channel: 'email_sent' | 'logged_fallback' | 'error';
  id?: string;
  to: string;
  error?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildText(input: ApprovalRequestInput): string {
  const lines: string[] = [];
  const sponsorRequest = input.approvalKind === 'sponsor_commitment';
  lines.push(`${sponsorRequest ? 'Sponsor review needed' : 'Approval needed'}: ${input.eventName} — ${input.stageLabel}`);
  lines.push('');
  lines.push(
    sponsorRequest
      ? 'Please review the event scope and provide the verified signed sponsor commitment.'
      : `A sourcing event is waiting for your approval at the "${input.stageLabel}" stage gate.`,
  );
  if (input.tenantName) lines.push(`Tenant: ${input.tenantName}`);
  if (input.requestedBy) lines.push(`Requested by: ${input.requestedBy}`);
  lines.push('');
  lines.push('Review and decide here:');
  lines.push(input.reviewUrl);
  if (sponsorRequest) lines.push('Opening this link does not approve or sign the commitment.');
  lines.push('');
  lines.push('— AbarVa');
  return lines.join('\n');
}

function buildHtml(input: ApprovalRequestInput): string {
  const sponsorRequest = input.approvalKind === 'sponsor_commitment';
  const eventName = escapeHtml(input.eventName);
  const stageLabel = escapeHtml(input.stageLabel);
  const reviewUrl = escapeHtml(input.reviewUrl);
  const tenantRow = input.tenantName
    ? `<tr><td style="padding:2px 0;color:#706D66;">Tenant</td><td style="padding:2px 0 2px 16px;color:#0C1A3A;font-weight:600;">${escapeHtml(input.tenantName)}</td></tr>`
    : '';
  const requestedRow = input.requestedBy
    ? `<tr><td style="padding:2px 0;color:#706D66;">Requested by</td><td style="padding:2px 0 2px 16px;color:#0C1A3A;font-weight:600;">${escapeHtml(input.requestedBy)}</td></tr>`
    : '';

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#F8F7F4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e1da;border-radius:10px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
        <tr><td style="padding:24px 28px 8px 28px;">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#706D66;">AbarVa · Source</div>
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:22px;color:#0C1A3A;margin:8px 0 0 0;">${sponsorRequest ? 'Sponsor review needed' : 'Approval needed'}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 0 28px;">
          <p style="font-size:14px;line-height:1.5;color:#333333;margin:12px 0;">
            ${sponsorRequest
              ? 'Please review the event scope and provide the verified signed sponsor commitment.'
              : `A sourcing event is waiting for your approval at the <strong style="color:#0C1A3A;">${stageLabel}</strong> stage gate.`}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;margin:4px 0 8px 0;">
            <tr><td style="padding:2px 0;color:#706D66;">Event</td><td style="padding:2px 0 2px 16px;color:#0C1A3A;font-weight:600;">${eventName}</td></tr>
            <tr><td style="padding:2px 0;color:#706D66;">Stage</td><td style="padding:2px 0 2px 16px;color:#0C1A3A;font-weight:600;">${stageLabel}</td></tr>
            ${tenantRow}
            ${requestedRow}
          </table>
        </td></tr>
        <tr><td style="padding:12px 28px 28px 28px;">
          <a href="${reviewUrl}" style="display:inline-block;background:#0C1A3A;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;">${sponsorRequest ? 'Review Scope' : 'Review &amp; decide'}</a>
          ${sponsorRequest ? '<p style="font-size:12px;line-height:1.5;color:#706D66;">Opening this link does not approve or sign the commitment.</p>' : ''}
          <p style="font-size:12px;line-height:1.5;color:#706D66;margin:16px 0 0 0;">
            If the button does not work, open this link:<br/>
            <a href="${reviewUrl}" style="color:#1d5e87;word-break:break-all;">${reviewUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 24px 28px;">
          <hr style="border:none;border-top:1px solid #efece5;margin:0 0 12px 0;"/>
          <div style="font-size:11px;color:#9a968d;">This is an automated approval request from AbarVa Source.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendApprovalRequestEmail(
  input: ApprovalRequestInput,
): Promise<ApprovalRequestResult> {
  const recipient = input.approverEmail?.trim();
  if (!recipient) {
    return { delivered: false, channel: 'error', to: '', error: 'approver_email_required' };
  }
  const subject = `${input.approvalKind === 'sponsor_commitment' ? 'Sponsor review needed' : 'Approval needed'}: ${input.eventName} — ${input.stageLabel}`;

  const result = await sendEmail({
    from: resolveApprovalFrom(),
    to: recipient,
    subject,
    html: buildHtml(input),
    text: buildText(input),
    metadata: { eventId: input.eventId, kind: 'source_approval_request' },
  });

  const delivered = result.ok === true;
  let channel: ApprovalRequestResult['channel'];
  if (delivered) {
    channel = result.id?.startsWith('console-') ? 'logged_fallback' : 'email_sent';
  } else {
    channel = 'error';
  }

  return {
    delivered,
    channel,
    id: result.id,
    to: recipient,
    error: result.error,
  };
}

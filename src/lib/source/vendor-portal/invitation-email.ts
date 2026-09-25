import 'server-only';

// Source vendor portal — the invitation a competing vendor receives.
//
// This is the ONE place the plaintext credential exists after issuance. It is
// passed in, rendered, sent, and dropped. It is never persisted, never logged,
// and never returned to an internal surface — reissue is the only recovery path.
//
// The email has to carry enough for a bid team to act on it without a call:
// what the work is, when the gates are, what they must do first, and how to get
// in. Everything else lives behind the sign-in.

import { sendEmail, type EmailSendResult } from '@/lib/email/send';

export interface VendorInvitationInput {
  vendorDisplayName: string;
  contactName: string;
  contactEmail: string;
  eventName: string;
  buyerDisplayName: string;
  portalUrl: string;
  username: string;
  /** Plaintext. Rendered once, then out of scope. */
  password: string;
  acceptBy: Date;
  respondBy: Date;
  procurementContactName: string;
  procurementContactEmail: string;
}

function fmt(d: Date): string {
  return d.toUTCString();
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderVendorInvitationHtml(input: VendorInvitationInput): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f5ef;font-family:Inter,'Segoe UI',system-ui,sans-serif;color:#1b2b5c">
<div style="max-width:640px;margin:0 auto;padding:32px 28px">
  <p style="font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#5d6c80;margin:0">Request for Proposal</p>
  <h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;line-height:1.25;margin:12px 0 4px">${esc(input.eventName)}</h1>
  <p style="margin:0 0 24px;color:#5d6c80;font-size:14px">Issued by ${esc(input.buyerDisplayName)} to ${esc(input.vendorDisplayName)}</p>

  <p style="font-size:15px;line-height:1.6">${esc(input.contactName)},</p>
  <p style="font-size:15px;line-height:1.6">Your organisation has been invited to compete for the work above. To take part, confirm your intent to respond in the portal below. <strong>The RFP package becomes available to download once that confirmation is recorded.</strong></p>

  <div style="margin:24px 0;padding:18px 20px;border:1px solid #e8cfa0;background:#fdf6ea;border-radius:12px">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8a6118">Two dates that matter</p>
    <p style="margin:10px 0 0;font-size:14.5px;line-height:1.6;color:#6b4c18">
      <strong>Confirm intent to respond by ${esc(fmt(input.acceptBy))}.</strong><br/>
      Submit your response by ${esc(fmt(input.respondBy))}.
    </p>
  </div>

  <div style="margin:24px 0;padding:18px 20px;border:1px solid #dde3ea;background:#fff;border-radius:12px">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#3d5570">Your access</p>
    <p style="margin:10px 0 0;font-size:14px;line-height:1.7;font-family:ui-monospace,Menlo,monospace">
      Username: <strong>${esc(input.username)}</strong><br/>
      Password: <strong>${esc(input.password)}</strong>
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#5d6c80">This login is issued to your organisation and may be shared with colleagues preparing the response. It is specific to this solicitation.</p>
    <p style="margin:16px 0 0"><a href="${esc(input.portalUrl)}" style="display:inline-block;padding:11px 22px;border-radius:8px;background:#1b2b5c;color:#fff;text-decoration:none;font-weight:700;font-size:14px">Open the RFP portal</a></p>
  </div>

  <p style="font-size:14px;line-height:1.6;color:#5d6c80">Questions about this solicitation should go to ${esc(input.procurementContactName)} at <a href="mailto:${esc(input.procurementContactEmail)}" style="color:#1b2b5c">${esc(input.procurementContactEmail)}</a>. Please do not approach other personnel while the procurement is open.</p>
  <p style="font-size:12.5px;line-height:1.5;color:#8a97a8;margin-top:28px;padding-top:16px;border-top:1px solid #dde3ea">This password cannot be retrieved later. If it is lost, ask the procurement contact to reissue it.</p>
</div></body></html>`;
}

export function renderVendorInvitationText(input: VendorInvitationInput): string {
  return [
    `${input.contactName},`,
    ``,
    `Your organisation (${input.vendorDisplayName}) has been invited to compete for:`,
    `  ${input.eventName}`,
    `  Issued by ${input.buyerDisplayName}`,
    ``,
    `Confirm intent to respond by: ${fmt(input.acceptBy)}`,
    `Submit your response by:      ${fmt(input.respondBy)}`,
    ``,
    `The RFP package becomes available to download once your confirmation is recorded.`,
    ``,
    `Portal:   ${input.portalUrl}`,
    `Username: ${input.username}`,
    `Password: ${input.password}`,
    ``,
    `This login is issued to your organisation and may be shared with colleagues`,
    `preparing the response. It is specific to this solicitation, and the password`,
    `cannot be retrieved later — ask for a reissue if it is lost.`,
    ``,
    `Questions: ${input.procurementContactName}, ${input.procurementContactEmail}`,
    `Please do not approach other personnel while the procurement is open.`,
  ].join('\n');
}

export async function sendVendorInvitation(
  input: VendorInvitationInput,
): Promise<EmailSendResult> {
  return sendEmail({
    to: input.contactEmail,
    subject: `RFP invitation — ${input.eventName}`,
    html: renderVendorInvitationHtml(input),
    text: renderVendorInvitationText(input),
    replyTo: input.procurementContactEmail,
    // Deliberately no credential in metadata: metadata reaches the email
    // provider's dashboard and our webhook logs.
    metadata: { kind: 'source_vendor_invitation' },
  });
}

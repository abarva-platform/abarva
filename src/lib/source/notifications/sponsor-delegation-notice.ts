import "server-only";

import { sendEmail } from "@/lib/email/send";

export interface SponsorDelegationNoticeInput {
  sponsorEmail: string;
  sponsorName: string;
  delegateName: string;
  eventName: string;
  reviewUrl: string;
  eventId: string;
}

export interface SponsorDelegationNoticeResult {
  channel: "email_sent" | "logged_fallback" | "error";
  providerMessageId: string | null;
}

export async function sendSponsorDelegationNotice(
  input: SponsorDelegationNoticeInput,
): Promise<SponsorDelegationNoticeResult> {
  const body = [
    `Sponsor commitment update: ${input.eventName}`,
    "",
    `${input.delegateName} acknowledged the current Scope commitment as a delegate on behalf of ${input.sponsorName}.`,
    "This records the delegate's action, not your signature or personal approval.",
    "Review the event and raise any objection with your sourcing lead:",
    input.reviewUrl,
    "",
    "This notification does not authorize supplier contact, RFx release, an award, or a contract.",
  ].join("\n");
  const result = await sendEmail({
    from: process.env.SOURCE_APPROVAL_FROM_EMAIL?.trim() || "support@send.abarva.ai",
    to: input.sponsorEmail,
    subject: `Delegate acknowledged Scope: ${input.eventName}`,
    text: body,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;white-space:pre-wrap">${escapeHtml(body)}</div>`,
    metadata: { eventId: input.eventId, kind: "source_sponsor_delegate_notice" },
  });
  if (!result.ok) return { channel: "error", providerMessageId: null };
  if (!result.id || result.id.startsWith("console-")) {
    return { channel: "logged_fallback", providerMessageId: null };
  }
  return { channel: "email_sent", providerMessageId: result.id };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

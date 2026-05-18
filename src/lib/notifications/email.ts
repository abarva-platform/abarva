import 'server-only';

import { sendEmail, type EmailMessage } from '@/lib/email/send';
import { routeNotification } from './policy';
import type { NotificationEvent } from './types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildNotificationEmail(
  event: NotificationEvent,
  recipient: string,
): EmailMessage {
  return {
    to: recipient,
    subject: `[AbarVa] ${event.title}`,
    html: [
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:620px;margin:24px auto;padding:24px;background:#F8F7F4;border:1px solid #E5E1D8;color:#111">',
      `<p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px;color:#5B6C8A">${escapeHtml(event.module)} · ${escapeHtml(event.severity)}</p>`,
      `<h1 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin:0 0 12px">${escapeHtml(event.title)}</h1>`,
      `<p style="font-size:14px;line-height:1.6;margin:0 0 18px">${escapeHtml(event.body)}</p>`,
      `<p style="margin:0 0 18px"><a href="${escapeHtml(event.href)}" style="display:inline-block;padding:10px 16px;background:#111;color:#F8F7F4;text-decoration:none;border-radius:4px">Open in AbarVa</a></p>`,
      `<p style="font-size:12px;line-height:1.5;color:#5B6C8A;margin:0">Subject: ${escapeHtml(event.subject.label)} · Evidence: ${escapeHtml(event.evidenceRefs.join(', ') || 'not recorded')}</p>`,
      '</div>',
    ].join('\n'),
    text: `${event.title}\n\n${event.body}\n\nOpen: ${event.href}`,
    metadata: {
      Event: event.sourceEventType,
      TenantKey: event.tenantKey,
      Module: event.module,
      Severity: event.severity,
      NotificationId: event.id,
    },
  };
}

export async function sendNotificationEmail(
  event: NotificationEvent,
  recipients: readonly string[],
): Promise<void> {
  const policy = routeNotification(event);
  if (!policy.channels.includes('email_now')) return;

  const uniqueRecipients = Array.from(new Set(recipients.map((r) => r.trim()).filter(Boolean)));
  await Promise.allSettled(
    uniqueRecipients.map((recipient) => sendEmail(buildNotificationEmail(event, recipient))),
  );
}

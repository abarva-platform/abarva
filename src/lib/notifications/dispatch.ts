import { sendEmail, type EmailSendResult } from '@/lib/email/send';
import { routeNotification } from './policy';
import { buildNotificationEmail } from './email';
import type { NotificationAudience, NotificationEvent } from './types';

export interface NotificationRoleEmailMap {
  readonly [roleRef: string]: readonly string[];
}

export interface NotificationEmailRecipient {
  readonly audienceRef: string;
  readonly email: string;
}

export interface NotificationEmailDispatchTask {
  readonly taskKey: string;
  readonly event: NotificationEvent;
  readonly recipient: NotificationEmailRecipient;
}

export interface NotificationEmailDispatchResult {
  readonly taskKey: string;
  readonly eventId: string;
  readonly tenantKey: string;
  readonly recipientRef: string;
  readonly recipientEmail: string;
  readonly status: 'sent' | 'skipped' | 'failed';
  readonly providerMessageId: string | null;
  readonly errorText: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  return EMAIL_RE.test(value) ? value : null;
}

function emailsFromAudience(
  audience: NotificationAudience,
  roleEmails: NotificationRoleEmailMap,
): NotificationEmailRecipient[] {
  if (audience.kind === 'user') {
    const email = cleanEmail(audience.ref);
    return email ? [{ audienceRef: audience.ref, email }] : [];
  }

  if (audience.kind === 'role' || audience.kind === 'team' || audience.kind === 'tenant_admin') {
    const emails = roleEmails[audience.ref] ?? [];
    return emails
      .map(cleanEmail)
      .filter((email): email is string => Boolean(email))
      .map((email) => ({ audienceRef: audience.ref, email }));
  }

  return [];
}

export function parseNotificationRoleEmailMap(raw: string | undefined): NotificationRoleEmailMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [roleRef, value] of Object.entries(parsed)) {
      const list = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',')
          : [];
      const emails = list
        .map((entry) => (typeof entry === 'string' ? cleanEmail(entry) : null))
        .filter((email): email is string => Boolean(email));
      if (emails.length > 0) out[roleRef] = Array.from(new Set(emails));
    }
    return out;
  } catch {
    return {};
  }
}

export function resolveNotificationEmailRecipients(
  event: NotificationEvent,
  roleEmails: NotificationRoleEmailMap = {},
): NotificationEmailRecipient[] {
  const byEmail = new Map<string, NotificationEmailRecipient>();
  for (const audience of event.audience) {
    for (const recipient of emailsFromAudience(audience, roleEmails)) {
      byEmail.set(recipient.email, recipient);
    }
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export function buildNotificationEmailDispatchTasks(args: {
  readonly events: readonly NotificationEvent[];
  readonly deliveredTaskKeys?: ReadonlySet<string>;
  readonly roleEmails?: NotificationRoleEmailMap;
}): NotificationEmailDispatchTask[] {
  const delivered = args.deliveredTaskKeys ?? new Set<string>();
  const roleEmails = args.roleEmails ?? {};
  const tasks: NotificationEmailDispatchTask[] = [];

  for (const event of args.events) {
    if (!routeNotification(event).channels.includes('email_now')) continue;
    for (const recipient of resolveNotificationEmailRecipients(event, roleEmails)) {
      const taskKey = `${event.id}:email_now:${recipient.email}`;
      if (delivered.has(taskKey)) continue;
      tasks.push({ taskKey, event, recipient });
    }
  }

  return tasks.sort((a, b) => {
    const aDue = a.event.dueAt ? Date.parse(a.event.dueAt) : Number.POSITIVE_INFINITY;
    const bDue = b.event.dueAt ? Date.parse(b.event.dueAt) : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return a.taskKey.localeCompare(b.taskKey);
  });
}

export async function dispatchNotificationEmailTasks(
  tasks: readonly NotificationEmailDispatchTask[],
  sender: (task: NotificationEmailDispatchTask) => Promise<EmailSendResult> = async (task) =>
    sendEmail(buildNotificationEmail(task.event, task.recipient.email)),
): Promise<NotificationEmailDispatchResult[]> {
  const results: NotificationEmailDispatchResult[] = [];

  for (const task of tasks) {
    const sent = await sender(task);
    results.push({
      taskKey: task.taskKey,
      eventId: task.event.id,
      tenantKey: task.event.tenantKey,
      recipientRef: task.recipient.audienceRef,
      recipientEmail: task.recipient.email,
      status: sent.ok ? 'sent' : 'failed',
      providerMessageId: sent.id ?? null,
      errorText: sent.ok ? null : sent.error ?? 'unknown_email_error',
    });
  }

  return results;
}

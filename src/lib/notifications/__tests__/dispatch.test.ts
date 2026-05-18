import type { NotificationEvent } from '../types';
import {
  buildNotificationEmailDispatchTasks,
  dispatchNotificationEmailTasks,
  parseNotificationRoleEmailMap,
  resolveNotificationEmailRecipients,
} from '../dispatch';

const URGENT_EVENT: NotificationEvent = {
  id: 'event-urgent',
  tenantKey: 'apex-retail',
  module: 'source',
  severity: 'urgent',
  title: 'ServiceNow notice window needs action',
  body: 'Serve notice before the renewal locks.',
  href: '/source/renewal/vendor_contracts%3Aapex-servicenow-itsm/execution',
  subject: {
    type: 'contract',
    id: 'vendor_contracts:apex-servicenow-itsm',
    label: 'ServiceNow - IT Service Management',
  },
  audience: [
    { kind: 'user', ref: 'Source.Owner@Example.com', label: 'Source owner' },
    { kind: 'role', ref: 'legal', label: 'Legal' },
  ],
  producedAt: '2026-05-17T12:00:00.000Z',
  dueAt: '2026-05-18T00:00:00.000Z',
  dedupeKey: 'source:apex-retail:servicenow:notice',
  sourceEventType: 'source.renewal.notice_window',
  evidenceRefs: ['vendor_contracts:apex-servicenow-itsm'],
};

const ATTENTION_EVENT: NotificationEvent = {
  ...URGENT_EVENT,
  id: 'event-attention',
  severity: 'attention',
  title: 'Context is stale',
  sourceEventType: 'context.trust.stale',
};

describe('notification email dispatch', () => {
  it('parses role email routing from JSON env shape', () => {
    const map = parseNotificationRoleEmailMap(JSON.stringify({
      legal: ['legal@example.com', 'bad-address', 'LEGAL@example.com'],
      source_owner: 'vp-source@example.com,not-an-email',
    }));

    expect(map).toEqual({
      legal: ['legal@example.com'],
      source_owner: ['vp-source@example.com'],
    });
  });

  it('resolves direct users and role-routed recipients without inventing addresses', () => {
    const recipients = resolveNotificationEmailRecipients(URGENT_EVENT, {
      legal: ['legal@example.com'],
      missing_role: ['nobody@example.com'],
    });

    expect(recipients).toEqual([
      { audienceRef: 'legal', email: 'legal@example.com' },
      { audienceRef: 'Source.Owner@Example.com', email: 'source.owner@example.com' },
    ]);
  });

  it('builds email-now dispatch tasks only for routed urgent events', () => {
    const tasks = buildNotificationEmailDispatchTasks({
      events: [ATTENTION_EVENT, URGENT_EVENT],
      roleEmails: { legal: ['legal@example.com'] },
      deliveredTaskKeys: new Set(['event-urgent:email_now:legal@example.com']),
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskKey).toBe('event-urgent:email_now:source.owner@example.com');
  });

  it('returns structured delivery results from the sender', async () => {
    const [task] = buildNotificationEmailDispatchTasks({
      events: [URGENT_EVENT],
      roleEmails: {},
    });

    const [result] = await dispatchNotificationEmailTasks([task], async () => ({
      ok: true,
      id: 'email-123',
    }));

    expect(result).toMatchObject({
      taskKey: 'event-urgent:email_now:source.owner@example.com',
      eventId: 'event-urgent',
      tenantKey: 'apex-retail',
      recipientEmail: 'source.owner@example.com',
      status: 'sent',
      providerMessageId: 'email-123',
    });
  });

  it('captures failed sends without throwing', async () => {
    const [task] = buildNotificationEmailDispatchTasks({
      events: [URGENT_EVENT],
      roleEmails: {},
    });

    const [result] = await dispatchNotificationEmailTasks([task], async () => ({
      ok: false,
      error: 'resend down',
    }));

    expect(result.status).toBe('failed');
    expect(result.errorText).toBe('resend down');
  });
});

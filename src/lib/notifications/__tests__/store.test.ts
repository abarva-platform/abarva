import type { NotificationEvent } from '../types';
import {
  assertNotificationTenant,
  fromPlatformNotificationRow,
  parseNotificationEventsPayload,
  toPlatformNotificationColumns,
} from '../store';

const EVENT: NotificationEvent = {
  id: 'moves:move-1:gate',
  tenantKey: 'arcturus',
  module: 'moves',
  severity: 'urgent',
  title: 'Gate blocked: SR 11-7 validation',
  body: 'Independent validation evidence is missing.',
  href: '/strategic-moves/move-1',
  subject: {
    type: 'program',
    id: 'move-1',
    label: 'MRM Evidence Agent',
  },
  audience: [{ kind: 'role', ref: 'program_owner', label: 'Program owner' }],
  producedAt: '2026-05-17T12:00:00.000Z',
  dueAt: '2026-05-24T00:00:00.000Z',
  dedupeKey: 'moves:first-capital:move-1:gate_blocked',
  sourceEventType: 'moves.gate_blocked',
  evidenceRefs: ['program_deliverables:mrm-validation-pack'],
  metadata: { guard: 'sr_11_7' },
};

describe('notification store contract', () => {
  it('accepts a single event or an events array payload', () => {
    expect(parseNotificationEventsPayload({ event: EVENT }).ok).toBe(true);
    const parsed = parseNotificationEventsPayload({ events: [EVENT] });

    expect(parsed.ok).toBe(true);
    expect(parsed.data?.[0].id).toBe(EVENT.id);
  });

  it('rejects malformed payloads before persistence', () => {
    expect(parseNotificationEventsPayload({}).ok).toBe(false);
    expect(
      parseNotificationEventsPayload({
        event: { ...EVENT, href: 'https://external.example.com' },
      }).ok,
    ).toBe(false);
    expect(
      parseNotificationEventsPayload({
        events: Array.from({ length: 51 }, () => EVENT),
      }).ok,
    ).toBe(false);
  });

  it('canonicalizes known tenant aliases and rejects cross-tenant events', () => {
    const ok = assertNotificationTenant([EVENT], 'first-capital');

    expect(ok.ok).toBe(true);
    expect(ok.data?.[0].tenantKey).toBe('first-capital');
    expect(assertNotificationTenant([EVENT], 'apex-retail').ok).toBe(false);
  });

  it('serializes notification events to platform_notification_events columns', () => {
    const row = toPlatformNotificationColumns(EVENT);

    expect(row).toMatchObject({
      tenant_key: 'first-capital',
      module: 'moves',
      severity: 'urgent',
      source_event_type: 'moves.gate_blocked',
      subject_type: 'program',
      subject_id: 'move-1',
      channels_jsonb: ['in_app', 'email_now', 'email_digest'],
      evidence_refs_jsonb: ['program_deliverables:mrm-validation-pack'],
    });
  });

  it('maps platform rows back to the NotificationEvent contract', () => {
    const event = fromPlatformNotificationRow({
      id: 'ecf1185c-17aa-40f4-8751-b4b09fa6e31a',
      ...toPlatformNotificationColumns(EVENT),
    });

    expect(event.id).toBe('ecf1185c-17aa-40f4-8751-b4b09fa6e31a');
    expect(event.tenantKey).toBe('first-capital');
    expect(event.subject).toEqual(EVENT.subject);
    expect(event.evidenceRefs).toEqual(EVENT.evidenceRefs);
  });
});

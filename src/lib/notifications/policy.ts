import type {
  NotificationBellItem,
  NotificationChannel,
  NotificationDeliveryPolicy,
  NotificationEvent,
  NotificationModule,
  NotificationSeverity,
} from './types';

const MODULE_KIND: Record<NotificationModule, NotificationBellItem['kind']> = {
  home: 'platform-alert',
  source: 'source-alert',
  moves: 'moves-alert',
  tower: 'tower-alert',
  intelligence: 'intelligence-alert',
  context: 'context-alert',
  admin: 'admin-alert',
  platform: 'platform-alert',
};

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  critical: 0,
  urgent: 1,
  attention: 2,
  info: 3,
};

export function routeNotification(
  event: NotificationEvent,
): NotificationDeliveryPolicy {
  if (event.severity === 'critical') {
    return {
      eventId: event.id,
      severity: event.severity,
      channels: ['in_app', 'email_now'],
      interrupt: true,
      digestEligible: false,
      escalationAfterHours: 4,
      rationale:
        'Critical events interrupt immediately and escalate if not acknowledged.',
    };
  }

  if (event.severity === 'urgent') {
    return {
      eventId: event.id,
      severity: event.severity,
      channels: ['in_app', 'email_now', 'email_digest'],
      interrupt: true,
      digestEligible: true,
      escalationAfterHours: 24,
      rationale:
        'Urgent events are visible in-app and mirrored by email because a deadline or owner gap can change the decision.',
    };
  }

  if (event.severity === 'attention') {
    return {
      eventId: event.id,
      severity: event.severity,
      channels: ['in_app', 'email_digest'],
      interrupt: false,
      digestEligible: true,
      escalationAfterHours: null,
      rationale:
        'Attention events belong in the decision inbox and digest, not as immediate interruptions.',
    };
  }

  return {
    eventId: event.id,
    severity: event.severity,
    channels: ['in_app'],
    interrupt: false,
    digestEligible: false,
    escalationAfterHours: null,
    rationale:
      'Informational events stay in-app to avoid creating notification noise.',
  };
}

export function channelsForNotification(
  event: NotificationEvent,
): readonly NotificationChannel[] {
  return routeNotification(event).channels;
}

export function compareNotificationEvents(
  a: NotificationEvent,
  b: NotificationEvent,
): number {
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (bySeverity !== 0) return bySeverity;

  const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;

  if (a.producedAt !== b.producedAt) {
    return a.producedAt < b.producedAt ? 1 : -1;
  }
  return a.id.localeCompare(b.id);
}

export function toBellItem(
  event: NotificationEvent,
  callerEmail: string | null = null,
): NotificationBellItem {
  void callerEmail;
  const policy = routeNotification(event);
  return {
    id: event.id,
    kind: MODULE_KIND[event.module],
    actorName: null,
    actorEmail: null,
    subject: event.title,
    programCode: event.subject.type === 'program' ? event.subject.id : null,
    deliverableCode: null,
    timestamp: event.producedAt,
    href: event.href,
    forCaller: false,
    severity: event.severity,
    module: event.module,
    body: event.body,
    channels: policy.channels,
  };
}

export function dedupeNotifications(
  events: readonly NotificationEvent[],
): NotificationEvent[] {
  const byKey = new Map<string, NotificationEvent>();
  for (const event of events) {
    const existing = byKey.get(event.dedupeKey);
    if (!existing || compareNotificationEvents(event, existing) < 0) {
      byKey.set(event.dedupeKey, event);
    }
  }
  return [...byKey.values()].sort(compareNotificationEvents);
}

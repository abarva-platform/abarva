// Platform notification contracts.
//
// AbarVa notifications are operating signals, not generic chatter. The same
// event shape should work for Source, Moves, Tower, Intelligence, Context,
// Steward, and platform operations; each module decides what is worth
// producing, while the routing policy decides how loudly to interrupt users.

export type NotificationModule =
  | 'home'
  | 'source'
  | 'moves'
  | 'tower'
  | 'intelligence'
  | 'context'
  | 'admin'
  | 'platform';

export type NotificationSeverity =
  | 'info'
  | 'attention'
  | 'urgent'
  | 'critical';

export type NotificationChannel =
  | 'in_app'
  | 'email_now'
  | 'email_digest'
  | 'slack'
  | 'teams'
  | 'webhook';

export type NotificationAudienceKind =
  | 'user'
  | 'role'
  | 'team'
  | 'owner_ref'
  | 'tenant_admin';

export interface NotificationAudience {
  kind: NotificationAudienceKind;
  ref: string;
  label?: string;
}

export interface NotificationSubject {
  type:
    | 'contract'
    | 'source_event'
    | 'program'
    | 'tower_move'
    | 'context_segment'
    | 'agent_answer'
    | 'security_event'
    | 'platform_resource';
  id: string;
  label: string;
}

export interface NotificationEvent {
  id: string;
  tenantKey: string;
  module: NotificationModule;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string;
  subject: NotificationSubject;
  audience: readonly NotificationAudience[];
  producedAt: string;
  dueAt: string | null;
  dedupeKey: string;
  sourceEventType: string;
  evidenceRefs: readonly string[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface NotificationDeliveryPolicy {
  eventId: string;
  severity: NotificationSeverity;
  channels: readonly NotificationChannel[];
  interrupt: boolean;
  digestEligible: boolean;
  escalationAfterHours: number | null;
  rationale: string;
}

export interface NotificationBellItem {
  id: string;
  kind:
    | 'task-assigned'
    | 'task-done'
    | 'approval'
    | 'phase-gate'
    | 'source-alert'
    | 'moves-alert'
    | 'tower-alert'
    | 'intelligence-alert'
    | 'context-alert'
    | 'admin-alert'
    | 'platform-alert';
  actorName: string | null;
  actorEmail: string | null;
  subject: string;
  programCode: string | null;
  deliverableCode: string | null;
  timestamp: string;
  href: string;
  forCaller: boolean;
  severity?: NotificationSeverity;
  module?: NotificationModule;
  body?: string;
  channels?: readonly NotificationChannel[];
}

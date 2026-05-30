/**
 * W4-PR-2 · Enterprise Comms Spine · Notification event REGISTRY
 *
 * The single source of truth for every notification event the platform
 * can emit. The broker validates every `emitNotification()` call against
 * this registry — emitting an unregistered event_type throws.
 *
 * Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §2 (event
 * taxonomy). 42 events across six source modules:
 *
 *   - Setup        (8) · admin / governance plane events
 *   - Moves        (8) · program lifecycle events
 *   - Source       (7) · sourcing-decision-room events
 *   - Intelligence (6) · ask / grounding / consistency events
 *   - Tower        (4) · executive portfolio events
 *   - System       (9) · platform / security / billing / digest events
 *
 * Each entry encodes the defaults the broker uses when there is no
 * explicit user preference: which channels to fan out to, what cadence,
 * how to classify for retention and PII handling. Per-user preferences
 * override the channel/frequency defaults via `notification_preferences`.
 *
 * piiClass legend (per Spine §5):
 *   • none              — no PII in payload; full log retention OK
 *   • redacted          — payload pre-redacted by emitter; log as-is
 *   • personal_redacted — contains personal data; logs must redact
 *                         email to first-char+domain, hash user_id
 *
 * auditClass legend (per Spine §5):
 *   • transactional — 90-day retention; routine operating signal
 *   • security      — 7-year retention; SOC 2 / incident-response anchor
 *   • compliance    — 7-year retention; SR 11-7 / SOX / GDPR anchor
 */

import type {
  NotificationAuditClass,
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationSeverity,
  NotificationSourceModule,
} from '@/lib/admin/broker/notifications-types';

// ─────────────────────────────────────────────────────────────────────────────
// Registry contract — what each event entry declares.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default-channel set for an event. The broker uses this list when a
 * subscriber has no explicit `notification_preferences` row for the
 * event_type. Only `email` and `in_app` are wired in Phase 1; the
 * other channels remain in the type for forward-compat.
 */
export type DefaultChannel = Extract<NotificationChannel, 'email' | 'in_app'>;

/**
 * Registry retention class (in days). Mirrors the audit_class retention
 * policy defined in Spine §5:
 *   - transactional → 90 days
 *   - security      → 2555 days (7 years)
 *   - compliance    → 2555 days (7 years)
 */
export type RetentionDays = 90 | 2555;

export interface EventDefinition {
  /** Canonical event identifier (lowercase, dot-namespaced). */
  eventType: string;
  /** Originating module — drives subscriber persona matching. */
  sourceModule: NotificationSourceModule;
  /** Severity tier — drives quiet-hours, escalation, fan-out volume. */
  severity: NotificationSeverity;
  /** Functional category — drives persona-default subscriptions. */
  category: NotificationCategory;
  /**
   * Channels the broker uses by default when the subscriber has no
   * explicit preference for this event_type. The end-user can override
   * via `notification_preferences`.
   */
  defaultChannels: readonly DefaultChannel[];
  /** Cadence the broker uses by default. */
  defaultFrequency: NotificationFrequency;
  /** Audit retention class — drives log retention + redaction posture. */
  auditClass: NotificationAuditClass;
  /** Concrete retention window in days; aligned to auditClass. */
  retentionDays: RetentionDays;
  /** PII classification — drives log redaction in the broker. */
  piiClass: 'none' | 'redacted' | 'personal_redacted';
}

// ─────────────────────────────────────────────────────────────────────────────
// The 42 events (Spine §2). Add new events in lock-step with subscribers
// in `persona-defaults.ts` and any matching seed helpers.
// ─────────────────────────────────────────────────────────────────────────────

export const NOTIFICATION_REGISTRY = {
  // ── Setup / Admin (8) ────────────────────────────────────────────────────
  /**
   * Tenant admin invites a new collaborator (Clerk invite created).
   * Payload: { inviteeEmail, role, tenantKey, inviteId }
   */
  'invite.sent': {
    eventType: 'invite.sent',
    sourceModule: 'setup',
    severity: 'info',
    category: 'governance',
    defaultChannels: ['in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'personal_redacted',
  },
  /**
   * Invitee accepted the invite and signed in for the first time.
   * Payload: { userId, role, tenantKey }
   */
  'invite.accepted': {
    eventType: 'invite.accepted',
    sourceModule: 'setup',
    severity: 'info',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'personal_redacted',
  },
  /**
   * A user's role changed within a tenant (e.g. sme → tenant_admin).
   * Payload: { userId, fromRole, toRole, changedBy }
   */
  'auth.role_changed': {
    eventType: 'auth.role_changed',
    sourceModule: 'setup',
    severity: 'warn',
    category: 'security',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'personal_redacted',
  },
  /**
   * A tenant policy (AI policy, RLS scope, retention) was created.
   * Payload: { policyKind, policyId, createdBy }
   */
  'policy.created': {
    eventType: 'policy.created',
    sourceModule: 'setup',
    severity: 'info',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A tenant policy was updated. Diff lives in tenant_policy_audit.
   * Payload: { policyKind, policyId, reason, updatedBy }
   */
  'policy.updated': {
    eventType: 'policy.updated',
    sourceModule: 'setup',
    severity: 'warn',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A tenant policy was deleted.
   * Payload: { policyKind, policyId, reason, deletedBy }
   */
  'policy.deleted': {
    eventType: 'policy.deleted',
    sourceModule: 'setup',
    severity: 'critical',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * RLS policy on a tenant-scoped table changed.
   * Payload: { tableName, policyName, changeKind }
   */
  'rls.policy_change': {
    eventType: 'rls.policy_change',
    sourceModule: 'setup',
    severity: 'critical',
    category: 'security',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A connector reached a terminal failure state (auth, schema, quota).
   * Payload: { connectorId, kind, errorClass, failedAt }
   */
  'connector.failed': {
    eventType: 'connector.failed',
    sourceModule: 'setup',
    severity: 'critical',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'none',
  },

  // ── Moves (8) ────────────────────────────────────────────────────────────
  /**
   * A new program was originated (DRAFT state).
   * Payload: { programId, programName, sponsorId, originatedBy }
   */
  'program.originated': {
    eventType: 'program.originated',
    sourceModule: 'moves',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * A program advanced to a new phase (Discover → Estimate, etc).
   * Payload: { programId, fromPhase, toPhase, advancedBy }
   */
  'program.phase_advanced': {
    eventType: 'program.phase_advanced',
    sourceModule: 'moves',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * A program was paused.
   * Payload: { programId, reason, pausedBy }
   */
  'program.paused': {
    eventType: 'program.paused',
    sourceModule: 'moves',
    severity: 'warn',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * A program was cancelled before completion.
   * Payload: { programId, reason, cancelledBy }
   */
  'program.cancelled': {
    eventType: 'program.cancelled',
    sourceModule: 'moves',
    severity: 'critical',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A gate requires approval (sponsor / finance / legal / security / IT).
   * Payload: { programId, gateId, approverRole, requestedBy }
   */
  'approval.requested': {
    eventType: 'approval.requested',
    sourceModule: 'moves',
    severity: 'warn',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * An approval was granted.
   * Payload: { programId, gateId, approvedBy, decisionNote }
   */
  'approval.granted': {
    eventType: 'approval.granted',
    sourceModule: 'moves',
    severity: 'info',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * An approval was rejected.
   * Payload: { programId, gateId, rejectedBy, reason }
   */
  'approval.rejected': {
    eventType: 'approval.rejected',
    sourceModule: 'moves',
    severity: 'warn',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * An approval was escalated past its SLA without decision.
   * Payload: { programId, gateId, originalApproverId, escalatedToId, age_hours }
   */
  'approval.escalated': {
    eventType: 'approval.escalated',
    sourceModule: 'moves',
    severity: 'critical',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },

  // ── Source (7) ───────────────────────────────────────────────────────────
  /**
   * A new sourcing event was created (RFI / RFP / RFQ).
   * Payload: { sourcingEventId, kind, programId, sponsorId }
   */
  'source.event_created': {
    eventType: 'source.event_created',
    sourceModule: 'source',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * The notice window is closing within 72 hours; final question call.
   * Payload: { sourcingEventId, closesAt }
   */
  'source.notice_window_closing': {
    eventType: 'source.notice_window_closing',
    sourceModule: 'source',
    severity: 'warn',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * The notice window has passed without a final decision recorded.
   * Payload: { sourcingEventId, closedAt }
   */
  'source.notice_window_overdue': {
    eventType: 'source.notice_window_overdue',
    sourceModule: 'source',
    severity: 'critical',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * Finance / legal / security / IT-owner approval is required.
   * Payload: { sourcingEventId, approverFunction, requestedBy }
   */
  'source.approval_needed': {
    eventType: 'source.approval_needed',
    sourceModule: 'source',
    severity: 'warn',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A final sourcing decision (award / decline / abandon) was recorded.
   * Payload: { sourcingEventId, decision, decidedBy, decisionNote }
   */
  'source.decision_recorded': {
    eventType: 'source.decision_recorded',
    sourceModule: 'source',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A new vendor was onboarded to the supplier roster.
   * Payload: { vendorId, vendorName, onboardedBy }
   */
  'source.vendor_onboarded': {
    eventType: 'source.vendor_onboarded',
    sourceModule: 'source',
    severity: 'info',
    category: 'business',
    defaultChannels: ['in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * A contract was signed; a renewal alarm is now scheduled.
   * Payload: { contractId, vendorId, signedAt, renewsAt }
   */
  'source.contract_signed': {
    eventType: 'source.contract_signed',
    sourceModule: 'source',
    severity: 'info',
    category: 'business',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },

  // ── Intelligence (6) ─────────────────────────────────────────────────────
  /**
   * A user submitted an Ask to Sentinel / Intelligence.
   * Payload: { askId, question_hash, askedBy }
   */
  'intelligence.ask_submitted': {
    eventType: 'intelligence.ask_submitted',
    sourceModule: 'intelligence',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'redacted',
  },
  /**
   * Sentinel returned a grounded answer.
   * Payload: { askId, answerId, evidenceRefs }
   */
  'intelligence.ask_answered': {
    eventType: 'intelligence.ask_answered',
    sourceModule: 'intelligence',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'redacted',
  },
  /**
   * Sentinel found the canonical grounding evidence weak / missing.
   * Payload: { askId, gapKind, missingSegments }
   */
  'intelligence.grounding_gap': {
    eventType: 'intelligence.grounding_gap',
    sourceModule: 'intelligence',
    severity: 'warn',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * Sentinel internal-consistency guard flagged a material issue.
   * Payload: { askId, answerId, inconsistencyKind }
   */
  'intelligence.consistency_alert': {
    eventType: 'intelligence.consistency_alert',
    sourceModule: 'intelligence',
    severity: 'warn',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A context segment is stale beyond its freshness window.
   * Payload: { segmentId, segmentLabel, lastVerifiedAt }
   */
  'intelligence.context_stale': {
    eventType: 'intelligence.context_stale',
    sourceModule: 'intelligence',
    severity: 'warn',
    category: 'operational',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * A context segment was refreshed (re-grounded / re-verified).
   * Payload: { segmentId, refreshedBy }
   */
  'intelligence.context_refreshed': {
    eventType: 'intelligence.context_refreshed',
    sourceModule: 'intelligence',
    severity: 'info',
    category: 'operational',
    defaultChannels: ['in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },

  // ── Tower (4) ────────────────────────────────────────────────────────────
  /**
   * Executive action surfaced on the Tower portfolio queue.
   * Payload: { actionId, programId, priority, dueAt }
   */
  'tower.executive_action': {
    eventType: 'tower.executive_action',
    sourceModule: 'tower',
    severity: 'warn',
    category: 'business',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * Regulatory lens flagged a non-low exposure (SR 11-7, BSA/AML, etc).
   * Payload: { riskId, programId, regimeKey, severity }
   */
  'tower.regulatory_risk': {
    eventType: 'tower.regulatory_risk',
    sourceModule: 'tower',
    severity: 'critical',
    category: 'governance',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * Portfolio health changed bucket (e.g. green → amber).
   * Payload: { programId, fromHealth, toHealth, reason }
   */
  'tower.portfolio_health_change': {
    eventType: 'tower.portfolio_health_change',
    sourceModule: 'tower',
    severity: 'warn',
    category: 'business',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * A CXO weekly digest is ready (sourced from Tower aggregates).
   * Payload: { digestId, period, programCount }
   */
  'tower.cxo_digest_ready': {
    eventType: 'tower.cxo_digest_ready',
    sourceModule: 'tower',
    severity: 'info',
    category: 'digest',
    defaultChannels: ['email'],
    defaultFrequency: 'digest_weekly',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },

  // ── System (9) ───────────────────────────────────────────────────────────
  /**
   * A billing threshold (usage / spend) was crossed.
   * Payload: { thresholdKind, currentValue, limit }
   */
  'billing.alert': {
    eventType: 'billing.alert',
    sourceModule: 'system',
    severity: 'critical',
    category: 'business',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A subscription / plan changed (upgrade, downgrade, renewal).
   * Payload: { fromPlan, toPlan, changedBy }
   */
  'billing.subscription_changed': {
    eventType: 'billing.subscription_changed',
    sourceModule: 'system',
    severity: 'info',
    category: 'business',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'compliance',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * Tenant tier-isolation anomaly detected (e.g. STRESS-P0-006 class).
   * Payload: { anomalyKind, intendedTenant, resolvedTenant, workflow }
   */
  'isolation.anomaly': {
    eventType: 'isolation.anomaly',
    sourceModule: 'system',
    severity: 'critical',
    category: 'security',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * A tenant-isolation policy was breached (cross-tenant access caught).
   * Payload: { policyName, attemptingUserId, targetTenantId }
   */
  'isolation.policy_breach': {
    eventType: 'isolation.policy_breach',
    sourceModule: 'system',
    severity: 'critical',
    category: 'security',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'personal_redacted',
  },
  /**
   * AI provider egress denied by policy.
   * Payload: { provider, route, dataClass, decisionReason }
   */
  'egress.denied': {
    eventType: 'egress.denied',
    sourceModule: 'system',
    severity: 'warn',
    category: 'security',
    defaultChannels: ['in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'none',
  },
  /**
   * AI provider call errored (not policy denial — provider/network).
   * Payload: { provider, errorClass, workflow }
   */
  'egress.error': {
    eventType: 'egress.error',
    sourceModule: 'system',
    severity: 'warn',
    category: 'operational',
    defaultChannels: ['in_app'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * Daily operational digest summary.
   * Payload: { period, eventCount, summary }
   */
  'system.daily_digest': {
    eventType: 'system.daily_digest',
    sourceModule: 'system',
    severity: 'info',
    category: 'digest',
    defaultChannels: ['email'],
    defaultFrequency: 'digest_daily',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * Weekly operational digest summary.
   * Payload: { period, eventCount, summary }
   */
  'system.weekly_digest': {
    eventType: 'system.weekly_digest',
    sourceModule: 'system',
    severity: 'info',
    category: 'digest',
    defaultChannels: ['email'],
    defaultFrequency: 'digest_weekly',
    auditClass: 'transactional',
    retentionDays: 90,
    piiClass: 'none',
  },
  /**
   * An incident was declared by the on-call runbook.
   * Payload: { incidentId, severity, summary, declaredBy }
   */
  'system.incident_declared': {
    eventType: 'system.incident_declared',
    sourceModule: 'system',
    severity: 'critical',
    category: 'security',
    defaultChannels: ['email', 'in_app'],
    defaultFrequency: 'immediate',
    auditClass: 'security',
    retentionDays: 2555,
    piiClass: 'none',
  },
} as const satisfies Record<string, EventDefinition>;

/**
 * Convenience type — the keys of the registry, narrowly typed.
 */
export type RegisteredEventType = keyof typeof NOTIFICATION_REGISTRY;

/**
 * Lookup helper. Returns the event definition or `null` when the
 * event_type is not registered. The broker uses this to validate every
 * emit call.
 */
export function lookupEventDefinition(
  eventType: string,
): EventDefinition | null {
  const reg = NOTIFICATION_REGISTRY as Record<string, EventDefinition>;
  return reg[eventType] ?? null;
}

/**
 * The full set of registered event_types as a Set for O(1) membership.
 */
export const REGISTERED_EVENT_TYPES: ReadonlySet<string> = new Set(
  Object.keys(NOTIFICATION_REGISTRY),
);

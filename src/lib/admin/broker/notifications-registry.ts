/**
 * NOTIFICATION_REGISTRY · W4-PR-4 placeholder
 *
 * Source-of-truth registry of every notification `event_type` the
 * Enterprise Comms Spine surfaces in the preferences UI. Each entry
 * declares:
 *
 *   - eventType       · canonical dot-notation key (e.g. 'auth.invite_sent')
 *   - sourceModule    · which product surface produced the event
 *   - category        · governance / security / operational / business / digest
 *   - severity        · info / warn / critical
 *   - auditClass      · transactional / security / compliance / marketing
 *   - label           · short human title shown in the matrix row
 *   - description     · one-line plain-English explainer under the row
 *   - defaultChannel  · what the preference defaults to before user edits
 *   - defaultFrequency
 *
 * Coordination note
 * -----------------
 * W4-PR-2 (the NotificationsBroker) ALSO ships a registry. When that PR
 * lands first this file should be deleted and its consumers re-pointed
 * at the canonical registry. The two registries MUST agree on
 * `eventType`, `sourceModule`, `category`, `severity`, and `auditClass`
 * — if they diverge, the broker's mandatory-flag enforcement and the
 * page's matrix will desync.
 *
 * Until then, this file is the authoritative list the preferences page
 * renders. The 5 mandatory event types from
 * `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES` (notifications-types.ts) are
 * included.
 */

import type {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationSeverity,
  NotificationSourceModule,
  NotificationAuditClass,
} from '@/lib/admin/broker/notifications-types';

export interface NotificationRegistryEntry {
  eventType: string;
  sourceModule: NotificationSourceModule;
  category: NotificationCategory;
  severity: NotificationSeverity;
  auditClass: NotificationAuditClass;
  label: string;
  description: string;
  defaultChannel: NotificationChannel;
  defaultFrequency: NotificationFrequency;
}

/**
 * Default registry shipped with W4-PR-4. Will be replaced by the
 * W4-PR-2 broker's registry on merge of that PR.
 *
 * Ordering: within each module, list governance/security events first
 * so the matrix surfaces what auditors care about at a glance.
 */
export const NOTIFICATION_REGISTRY: readonly NotificationRegistryEntry[] = [
  // ── Setup (substrate, auth, governance) ────────────────────────────
  {
    eventType: 'auth.invite_sent',
    sourceModule: 'setup',
    category: 'governance',
    severity: 'info',
    auditClass: 'security',
    label: 'Invitation sent',
    description: 'A teammate received an invite to join the workspace.',
    defaultChannel: 'in_app',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'auth.invite_accepted',
    sourceModule: 'setup',
    category: 'governance',
    severity: 'info',
    auditClass: 'security',
    label: 'Invitation accepted',
    description: 'An invitee completed sign-up and joined the workspace.',
    defaultChannel: 'in_app',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'rls.policy_change',
    sourceModule: 'setup',
    category: 'security',
    severity: 'critical',
    auditClass: 'security',
    label: 'RLS policy changed',
    description: 'A row-level security policy was added, modified, or removed.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'connector.failed',
    sourceModule: 'setup',
    category: 'security',
    severity: 'critical',
    auditClass: 'security',
    label: 'Connector failed',
    description: 'A live data connector probe failed or auth was revoked.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'connector.test_passed',
    sourceModule: 'setup',
    category: 'operational',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Connector test passed',
    description: 'A "Test connection" probe returned healthy.',
    defaultChannel: 'in_app',
    defaultFrequency: 'digest_daily',
  },

  // ── Moves ─────────────────────────────────────────────────────────
  {
    eventType: 'approval.requested',
    sourceModule: 'moves',
    category: 'governance',
    severity: 'critical',
    auditClass: 'compliance',
    label: 'Approval requested',
    description: 'A phase gate or move needs your sign-off.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'approval.escalated',
    sourceModule: 'moves',
    category: 'governance',
    severity: 'critical',
    auditClass: 'compliance',
    label: 'Approval escalated',
    description: 'A pending approval breached its SLA and escalated to a sponsor.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'approval.granted',
    sourceModule: 'moves',
    category: 'governance',
    severity: 'info',
    auditClass: 'compliance',
    label: 'Approval granted',
    description: 'A gate or move you sponsored was approved.',
    defaultChannel: 'in_app',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'program.phase_advanced',
    sourceModule: 'moves',
    category: 'operational',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Phase advanced',
    description: 'A program you follow moved to its next phase.',
    defaultChannel: 'in_app',
    defaultFrequency: 'digest_daily',
  },

  // ── Source ────────────────────────────────────────────────────────
  {
    eventType: 'source.evidence_published',
    sourceModule: 'source',
    category: 'operational',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Evidence published',
    description: 'Sentinel published a new evidence brief for a workflow you own.',
    defaultChannel: 'in_app',
    defaultFrequency: 'digest_daily',
  },
  {
    eventType: 'source.gap_detected',
    sourceModule: 'source',
    category: 'operational',
    severity: 'warn',
    auditClass: 'transactional',
    label: 'Evidence gap detected',
    description: 'Sentinel flagged missing evidence on a workflow you own.',
    defaultChannel: 'email',
    defaultFrequency: 'digest_daily',
  },

  // ── Intelligence ─────────────────────────────────────────────────
  {
    eventType: 'intelligence.pattern_detected',
    sourceModule: 'intelligence',
    category: 'business',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Pattern detected',
    description: 'A new pattern landed in your Intelligence funnel.',
    defaultChannel: 'in_app',
    defaultFrequency: 'digest_weekly',
  },
  {
    eventType: 'intelligence.move_recommended',
    sourceModule: 'intelligence',
    category: 'business',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Move recommended',
    description: 'Intelligence promoted a pattern into a recommended move.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },

  // ── Tower ─────────────────────────────────────────────────────────
  {
    eventType: 'tower.dora_breach',
    sourceModule: 'tower',
    category: 'operational',
    severity: 'warn',
    auditClass: 'transactional',
    label: 'DORA SLO breach',
    description: 'A DORA SLO target was missed (DF, LT, CFR, or MTTR).',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'tower.ingest_drift',
    sourceModule: 'tower',
    category: 'operational',
    severity: 'warn',
    auditClass: 'transactional',
    label: 'Tower ingest drift',
    description: 'A Tower ingest pipeline drifted from its expected window.',
    defaultChannel: 'in_app',
    defaultFrequency: 'digest_daily',
  },

  // ── System (digests + health) ────────────────────────────────────
  {
    eventType: 'system.daily_digest',
    sourceModule: 'system',
    category: 'digest',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Daily digest',
    description: 'Summary of overnight activity across the workspace.',
    defaultChannel: 'email',
    defaultFrequency: 'digest_daily',
  },
  {
    eventType: 'system.weekly_digest',
    sourceModule: 'system',
    category: 'digest',
    severity: 'info',
    auditClass: 'transactional',
    label: 'Weekly digest',
    description: 'Summary of the week across programs, moves, and evidence.',
    defaultChannel: 'email',
    defaultFrequency: 'digest_weekly',
  },
  {
    eventType: 'system.health_alert',
    sourceModule: 'system',
    category: 'operational',
    severity: 'critical',
    auditClass: 'transactional',
    label: 'System health alert',
    description: 'A platform health probe surfaced a degraded service.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
  {
    eventType: 'billing.alert',
    sourceModule: 'system',
    category: 'business',
    severity: 'critical',
    auditClass: 'transactional',
    label: 'Billing alert',
    description: 'A billing threshold, charge, or invoice surfaced an alert.',
    defaultChannel: 'email',
    defaultFrequency: 'immediate',
  },
];

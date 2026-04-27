/**
 * ADMIN-DATA2 — Admin audit-log adapter types.
 *
 * Read-only events shape for cross-page recent-activity feeds.
 */

export type AdminAuditCategory =
  | 'auth'
  | 'role_change'
  | 'connector'
  | 'dataset'
  | 'approval'
  | 'blocker'
  | 'setup_progress'
  | 'readiness_state'
  | 'other';

export interface AdminAuditEvent {
  id: string;
  category: AdminAuditCategory;
  action: string;
  actorPersonId: string | null;
  actorDisplayName: string | null;
  targetKind: string | null;
  targetId: string | null;
  summary: string;
  createdAt: string;
}

export interface AdminAuditLogQueryOptions {
  limit?: number;
  category?: AdminAuditCategory;
  since?: string;
}

// Sourcing work-item model — typed contracts.
//
// One persisted work-item model backs the three Renewal Cockpit action-bar
// actions (serve notice, assign owner, Tower watch) AND the owner + SLA read
// the Decision Queue cards project. The shapes here are pure types — no DB,
// no network, no React — shared by the data-plane adapter, the API routes,
// the cockpit action bar, and the queue-card projection.
//
// Backed by `sourcing_work_items` (migration 20260517100000).

/** The subject a work item attaches to. */
export type WorkItemSubjectKind = 'contract' | 'source_event' | 'vendor';

/**
 * The work-item flavor.
 *
 * The first three kinds correspond one-to-one to the three Renewal Cockpit
 * action-bar actions this slice originally made real (serve notice, assign
 * owner, Tower watch).
 *
 * `workplan_item` and `stakeholder_approval` were added additively when the
 * Source Execution Room converged onto this table as its single persistence
 * backbone (migration 20260517210000): the Execution Room's action workplan
 * persists as `workplan_item` rows, and its finance / legal / security /
 * sponsor / IT approvals persist as `stakeholder_approval` rows. One model,
 * wired across the cockpit action bar AND the Execution Room.
 */
export type WorkItemKind =
  | 'serve_notice'
  | 'owner_assignment'
  | 'tower_watch'
  | 'workplan_item'
  | 'stakeholder_approval';

/** Lifecycle status of a work item. */
export type WorkItemStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

/**
 * Off-system legal workflow state for a serve-notice item. AbarVa never
 * issues the formal legal notice itself; this tracks the hand-off.
 */
export type WorkItemLegalStatus =
  | 'not_started'
  | 'drafting'
  | 'in_review'
  | 'served'
  | 'not_applicable';

/** Off-system procurement workflow state for a serve-notice item. */
export type WorkItemProcurementStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'not_applicable';

export const WORK_ITEM_KINDS: readonly WorkItemKind[] = [
  'serve_notice',
  'owner_assignment',
  'tower_watch',
  'workplan_item',
  'stakeholder_approval',
];

export const WORK_ITEM_SUBJECT_KINDS: readonly WorkItemSubjectKind[] = [
  'contract',
  'source_event',
  'vendor',
];

export const WORK_ITEM_STATUSES: readonly WorkItemStatus[] = [
  'open',
  'in_progress',
  'done',
  'cancelled',
];

/**
 * The discriminator a converged Execution Room row carries inside `metadata`.
 *
 * A `workplan_item` row stores the Execution Room `ExecutionActionKind` it
 * persists (`serve_notice`, `finance_approval`, …) under `metadata.subKind`;
 * a `stakeholder_approval` row stores the `ExecutionApprovalRole`. This lets
 * the room reconcile its deterministic composer output against persisted
 * rows without a parallel table — the work-item `kind` stays coarse, the
 * `subKind` carries the room-specific slot id.
 */
export type WorkItemMetadata = {
  /**
   * The Execution Room slot this work item persists — an `ExecutionActionKind`
   * for a `workplan_item`, an `ExecutionApprovalRole` for a
   * `stakeholder_approval`. Absent on cockpit action-bar rows.
   */
  subKind?: string;
} & Record<string, string>;

/** A persisted sourcing work item — the row shape, view-model side. */
export interface SourcingWorkItem {
  id: string;
  tenantClientKey: string;
  subjectKind: WorkItemSubjectKind;
  /** Contract id / source-event id / vendor key the item is attached to. */
  subjectRef: string;
  /** Human-readable subject name — "Adobe — Creative Cloud". */
  subjectLabel: string;
  kind: WorkItemKind;
  title: string;
  /** Accountable owner (name or email); null until one is named. */
  owner: string | null;
  /** SLA — the date the work must complete by; null when none set. */
  dueDate: string | null;
  status: WorkItemStatus;
  legalStatus: WorkItemLegalStatus | null;
  procurementStatus: WorkItemProcurementStatus | null;
  note: string | null;
  /**
   * Free-form string map persisted in the `metadata` JSONB column. Carries
   * `subKind` for converged Execution Room rows; `{}` otherwise.
   */
  metadata: WorkItemMetadata;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

/**
 * The fields needed to create a work item. Audit timestamps and the id are
 * assigned by the data plane; `createdBy` carries the acting user.
 */
export interface NewSourcingWorkItem {
  tenantClientKey: string;
  subjectKind: WorkItemSubjectKind;
  subjectRef: string;
  subjectLabel: string;
  kind: WorkItemKind;
  title: string;
  owner: string | null;
  dueDate: string | null;
  status: WorkItemStatus;
  legalStatus: WorkItemLegalStatus | null;
  procurementStatus: WorkItemProcurementStatus | null;
  note: string | null;
  /** Optional string map persisted to the `metadata` JSONB column. */
  metadata?: WorkItemMetadata;
  createdBy: string | null;
}

/**
 * The owner + SLA accountability summary the Decision Queue cards surface.
 * Projected from the open work items on a contract so a VP sees who owns the
 * renewal and when it is due, directly on the card.
 */
export interface WorkItemAccountability {
  /** The owning work item's owner, when one is assigned. */
  owner: string | null;
  /** The soonest SLA / due date across the contract's open work items. */
  dueDate: string | null;
  /** Count of open / in-progress work items on the subject. */
  openCount: number;
  /** True when a serve-notice item exists and is not yet done. */
  hasOpenNotice: boolean;
  /** True when a tower_watch item exists on the subject. */
  hasTowerWatch: boolean;
}

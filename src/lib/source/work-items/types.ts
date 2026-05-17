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
 * The work-item flavor. The three kinds correspond one-to-one to the three
 * Renewal Cockpit action-bar actions this slice makes real.
 */
export type WorkItemKind = 'serve_notice' | 'owner_assignment' | 'tower_watch';

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

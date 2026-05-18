// Sourcing work-item model — pure domain logic.
//
// Validation for new work items and the accountability projection the
// Decision Queue cards render. Pure: no DB, no network, no clock — every
// caller injects what it needs. The data-plane adapter and the API routes
// build on this; the queue-card read projects through `accountabilityFor`.

import type {
  NewSourcingWorkItem,
  SourcingWorkItem,
  WorkItemAccountability,
  WorkItemKind,
} from './types';
import {
  WORK_ITEM_KINDS,
  WORK_ITEM_STATUSES,
  WORK_ITEM_SUBJECT_KINDS,
} from './types';

/** Outcome of validating a candidate work item. */
export interface WorkItemValidation {
  ok: boolean;
  /** A human-readable reason, present only when `ok` is false. */
  error?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a candidate work item before it is persisted. Truthful, not
 * permissive — a serve-notice item with no due date, or an owner-assignment
 * with no owner, is rejected so the persisted row is never half-formed.
 */
export function validateNewWorkItem(
  input: NewSourcingWorkItem,
): WorkItemValidation {
  if (!input.tenantClientKey.trim()) {
    return { ok: false, error: 'tenantClientKey is required' };
  }
  if (!WORK_ITEM_SUBJECT_KINDS.includes(input.subjectKind)) {
    return { ok: false, error: `unknown subjectKind: ${input.subjectKind}` };
  }
  if (!input.subjectRef.trim()) {
    return { ok: false, error: 'subjectRef is required' };
  }
  if (!WORK_ITEM_KINDS.includes(input.kind)) {
    return { ok: false, error: `unknown work-item kind: ${input.kind}` };
  }
  if (!WORK_ITEM_STATUSES.includes(input.status)) {
    return { ok: false, error: `unknown status: ${input.status}` };
  }
  if (!input.title.trim()) {
    return { ok: false, error: 'title is required' };
  }
  if (input.dueDate !== null && !ISO_DATE.test(input.dueDate)) {
    return { ok: false, error: 'dueDate must be an ISO date (YYYY-MM-DD)' };
  }
  // An owner-assignment with no owner is meaningless — reject it.
  if (input.kind === 'owner_assignment' && !(input.owner ?? '').trim()) {
    return {
      ok: false,
      error: 'owner_assignment work items require an owner',
    };
  }
  return { ok: true };
}

/** True when a work item is still active (not done / cancelled). */
export function isOpenWorkItem(item: SourcingWorkItem): boolean {
  return item.status === 'open' || item.status === 'in_progress';
}

/**
 * Project the owner + SLA accountability summary the Decision Queue card
 * renders, from the work items attached to one subject.
 *
 * Deterministic: the same set of items always yields the same summary.
 *  - `owner` is the owner of the most recently created open work item that
 *    has one — the freshest accountability signal.
 *  - `dueDate` is the soonest due date across open work items — the SLA the
 *    VP must not miss.
 */
export function accountabilityFor(
  items: readonly SourcingWorkItem[],
): WorkItemAccountability {
  const open = items.filter(isOpenWorkItem);

  // Owner: freshest open item carrying an owner.
  const withOwner = open
    .filter((i) => (i.owner ?? '').trim().length > 0)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const owner = withOwner[0]?.owner ?? null;

  // SLA: soonest due date across open items.
  const dueDates = open
    .map((i) => i.dueDate)
    .filter((d): d is string => d !== null && d.trim().length > 0)
    .sort();
  const dueDate = dueDates[0] ?? null;

  const hasOpenNotice = open.some((i) => i.kind === 'serve_notice');
  const hasTowerWatch = items.some((i) => i.kind === 'tower_watch');

  return {
    owner,
    dueDate,
    openCount: open.length,
    hasOpenNotice,
    hasTowerWatch,
  };
}

/**
 * Group work items by their `subjectRef` — used to project accountability
 * for many contracts at once when assembling the Decision Queue.
 */
export function groupBySubject(
  items: readonly SourcingWorkItem[],
): Map<string, SourcingWorkItem[]> {
  const groups = new Map<string, SourcingWorkItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.subjectRef) ?? [];
    bucket.push(item);
    groups.set(item.subjectRef, bucket);
  }
  return groups;
}

/** Human-readable label for a work-item kind. */
export const WORK_ITEM_KIND_LABEL: Record<WorkItemKind, string> = {
  serve_notice: 'Serve notice',
  owner_assignment: 'Owner assignment',
  tower_watch: 'Tower watch',
  workplan_item: 'Workplan item',
  stakeholder_approval: 'Stakeholder approval',
};

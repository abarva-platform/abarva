// Source Execution Room persistence — convergence onto sourcing_work_items.
//
// The Execution Room composer (`execution-room.ts`) is a pure deterministic
// view: it never persists. PR #2127 shipped a *designed* persistence layer
// (three proposed `source_execution_*` tables) that was never built. The
// `sourcing_work_items` table (migration 20260517100000) IS the built
// persistence layer — owner, due date, status, legal/procurement workflow
// state, and created/updated audit fields on every row.
//
// This module is the convergence seam. It maps the Execution Room's persisted
// concepts onto `sourcing_work_items` rows, with NO parallel table:
//
//   - each `ExecutionAction` (the action workplan, incl. serve-notice and
//     owner assignment) persists as a `workplan_item` work item;
//   - each `ExecutionApproval` (finance / legal / security / sponsor / IT)
//     persists as a `stakeholder_approval` work item;
//   - the room-specific slot id — the `ExecutionActionKind` or
//     `ExecutionApprovalRole` — rides in `metadata.subKind`;
//   - `sourcing_work_items` audit fields (created_by/at, updated_by/at) ARE
//     the execution audit trail the design doc asked for.
//
// Pure: this file builds work-item write payloads and reconciles persisted
// rows back onto the room view-model. The data plane is reached only through
// the work-item service (see `loadExecutionRoom` in `load.ts`).

import type {
  NewSourcingWorkItem,
  SourcingWorkItem,
  WorkItemStatus,
} from '@/lib/source/work-items/types';
import { NOT_RECORDED } from './execution-room';
import type {
  ExecutionAction,
  ExecutionActionStatus,
  ExecutionApproval,
  ExecutionRoom,
} from './types';

/**
 * Map a work-item lifecycle status back onto the Execution Room's richer
 * action status. `done` → `complete`; `open` keeps the deterministic
 * composer status (which already encodes the not-started / blocked nuance).
 */
function actionStatusFromWorkItem(
  item: SourcingWorkItem,
  fallback: ExecutionActionStatus,
): ExecutionActionStatus {
  switch (item.status) {
    case 'done':
      return 'complete';
    case 'in_progress':
      return 'in_progress';
    case 'cancelled':
      // A cancelled work item means the slot is no longer active — surface
      // it as blocked so the room does not silently drop the row.
      return 'blocked';
    case 'open':
    default:
      return fallback;
  }
}

/**
 * Map an Execution Room action status onto the work-item lifecycle status —
 * used when seeding a `workplan_item` row from the composer output.
 */
export function workItemStatusFromAction(
  status: ExecutionActionStatus,
): WorkItemStatus {
  switch (status) {
    case 'complete':
      return 'done';
    case 'in_progress':
    case 'pending_external':
      return 'in_progress';
    case 'not_started':
    case 'blocked':
    default:
      return 'open';
  }
}

/** Index persisted rows by `metadata.subKind` for one work-item kind. */
function bySubKind(
  items: readonly SourcingWorkItem[],
  kind: SourcingWorkItem['kind'],
): Map<string, SourcingWorkItem> {
  const map = new Map<string, SourcingWorkItem>();
  // Newest first wins — `items` arrives newest-first from the adapter, so the
  // first row seen for a subKind is the freshest.
  for (const item of items) {
    if (item.kind !== kind) continue;
    const subKind = item.metadata.subKind;
    if (!subKind || map.has(subKind)) continue;
    map.set(subKind, item);
  }
  return map;
}

/**
 * Reconcile a deterministic Execution Room against the persisted
 * `sourcing_work_items` rows for its contract.
 *
 * The composer output is the baseline; a persisted `workplan_item` /
 * `stakeholder_approval` row for a slot overlays the persisted owner, due
 * date, and status onto that slot. Slots with no persisted row are returned
 * exactly as the composer produced them — the room stays honest about what
 * has and has not been persisted.
 *
 * Pure and deterministic: same room + same rows always yield the same result.
 */
export function reconcileExecutionRoom(
  room: ExecutionRoom,
  workItems: readonly SourcingWorkItem[],
): ExecutionRoom {
  if (workItems.length === 0) return room;

  const workplanRows = bySubKind(workItems, 'workplan_item');
  const approvalRows = bySubKind(workItems, 'stakeholder_approval');

  const actions: ExecutionAction[] = room.actions.map((action) => {
    const row = workplanRows.get(action.kind);
    if (!row) return action;
    return {
      ...action,
      owner: (row.owner ?? '').trim() || action.owner,
      dueDate: row.dueDate ?? action.dueDate,
      status: actionStatusFromWorkItem(row, action.status),
      // The action is now persisted — replace the "pending persistence"
      // linked-action stub with a recorded marker, preserving route/draft
      // links so the negotiation brief and email draft stay reachable.
      linkedAction:
        action.linkedAction.type === 'pending'
          ? {
              type: 'pending',
              label: 'Work item recorded',
              reason: `Persisted as sourcing work item ${row.id} — owner, SLA and status are now durable.`,
            }
          : action.linkedAction,
    };
  });

  const approvals: ExecutionApproval[] = room.approvals.map((approval) => {
    const row = approvalRows.get(approval.role);
    if (!row) return approval;
    return {
      ...approval,
      owner: (row.owner ?? '').trim() || approval.owner,
      dueDate: row.dueDate ?? approval.dueDate,
      status: actionStatusFromWorkItem(row, approval.status),
    };
  });

  // The accountable owner: the freshest persisted workplan owner, else the
  // composer's owner. Mirrors `accountabilityFor` in the work-item model.
  const persistedOwner = [...workplanRows.values()]
    .map((r) => (r.owner ?? '').trim())
    .find((o) => o.length > 0);

  return {
    ...room,
    accountableOwner:
      persistedOwner && room.accountableOwner === NOT_RECORDED
        ? persistedOwner
        : room.accountableOwner,
    actions,
    approvals,
  };
}

/**
 * Build the `workplan_item` work-item write payload for one Execution Room
 * action. The Execution Room action-id rides in `metadata.subKind` so a
 * later reconcile can match the persisted row back to the slot.
 */
export function workplanItemPayload(
  room: ExecutionRoom,
  action: ExecutionAction,
  createdBy: string | null,
): NewSourcingWorkItem {
  const isServeNotice = action.kind === 'serve_notice';
  return {
    tenantClientKey: room.clientKey,
    subjectKind: 'contract',
    subjectRef: room.contractId,
    subjectLabel: `${room.vendorName} — ${room.product}`,
    kind: 'workplan_item',
    title: action.title,
    owner: action.owner === NOT_RECORDED ? null : action.owner,
    dueDate: action.dueDate,
    status: workItemStatusFromAction(action.status),
    // Serve-notice carries the off-system legal / procurement hand-off state.
    legalStatus: isServeNotice ? 'not_started' : null,
    procurementStatus: isServeNotice ? 'not_started' : null,
    note: action.evidenceBasis,
    metadata: { subKind: action.kind },
    createdBy,
  };
}

/**
 * Build the `stakeholder_approval` work-item write payload for one Execution
 * Room approval. The approval role rides in `metadata.subKind`.
 */
export function stakeholderApprovalPayload(
  room: ExecutionRoom,
  approval: ExecutionApproval,
  createdBy: string | null,
): NewSourcingWorkItem {
  return {
    tenantClientKey: room.clientKey,
    subjectKind: 'contract',
    subjectRef: room.contractId,
    subjectLabel: `${room.vendorName} — ${room.product}`,
    kind: 'stakeholder_approval',
    title: `${approval.label} approval — ${room.vendorName} ${room.product}`,
    owner: approval.owner === NOT_RECORDED ? null : approval.owner,
    dueDate: approval.dueDate,
    status: workItemStatusFromAction(approval.status),
    legalStatus: null,
    procurementStatus: null,
    note: approval.decisionNeeded,
    metadata: { subKind: approval.role },
    createdBy,
  };
}

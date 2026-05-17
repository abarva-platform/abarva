// Sourcing work-item service — server-side orchestration.
//
// The one entry point the cockpit action routes and the Decision Queue
// loader use. It wires the work-item domain model (pure) to the data-plane
// read/write seam, so callers never touch the adapters directly.
//
// Thin: validation and the accountability projection live in the pure model;
// this file only routes reads/writes through the configured data plane.

import 'server-only';
import {
  selectSourcingWorkItemsReadAdapter,
} from '@/lib/data-plane/read-adapters/sourcingWorkItemsReadAdapter';
import {
  selectSourcingWorkItemsWriteAdapter,
  type WorkItemWriteOutcome,
} from '@/lib/data-plane/write-adapters/sourcingWorkItemsWriteAdapter';
import { accountabilityFor, groupBySubject } from './work-item-model';
import type {
  NewSourcingWorkItem,
  SourcingWorkItem,
  WorkItemAccountability,
  WorkItemKind,
  WorkItemSubjectKind,
} from './types';

/** Persist a new sourcing work item through the data-plane write seam. */
export async function createWorkItem(
  input: NewSourcingWorkItem,
): Promise<WorkItemWriteOutcome<SourcingWorkItem>> {
  return selectSourcingWorkItemsWriteAdapter().createWorkItem(input);
}

/** All work items attached to one subject (e.g. a Renewal Cockpit contract). */
export async function listWorkItemsForSubject(
  tenantKey: string,
  subjectKind: WorkItemSubjectKind,
  subjectRef: string,
): Promise<SourcingWorkItem[]> {
  return selectSourcingWorkItemsReadAdapter().listForSubject(
    tenantKey,
    subjectKind,
    subjectRef,
  );
}

/**
 * The owner + SLA accountability summary for one contract — projected from
 * its open work items. The Renewal Cockpit and the Decision Queue card both
 * surface this so a VP sees accountability immediately.
 */
export async function accountabilityForContract(
  tenantKey: string,
  contractId: string,
): Promise<WorkItemAccountability> {
  const items = await listWorkItemsForSubject(tenantKey, 'contract', contractId);
  return accountabilityFor(items);
}

/**
 * Accountability for many contracts at once — used when assembling the
 * Decision Queue so every card carries its owner + SLA without N round-trips.
 * Returns a map keyed by contract id; absent ids have no work items.
 */
export async function accountabilityForContracts(
  tenantKey: string,
  contractIds: readonly string[],
): Promise<Map<string, WorkItemAccountability>> {
  const result = new Map<string, WorkItemAccountability>();
  if (contractIds.length === 0) return result;
  // One tenant-scoped read, then project per-contract from the pure model.
  const all = await selectSourcingWorkItemsReadAdapter().listForTenant(tenantKey);
  const contractItems = all.filter((i) => i.subjectKind === 'contract');
  const grouped = groupBySubject(contractItems);
  for (const id of contractIds) {
    result.set(id, accountabilityFor(grouped.get(id) ?? []));
  }
  return result;
}

/**
 * All work items of one kind for a tenant — backs the Tower read of
 * `tower_watch` items. Tower reads these to surface watched renewals in the
 * portfolio without a Tower-specific table.
 */
export async function listWorkItemsByKind(
  tenantKey: string,
  kind: WorkItemKind,
): Promise<SourcingWorkItem[]> {
  return selectSourcingWorkItemsReadAdapter().listByKind(tenantKey, kind);
}

/**
 * The Tower-watch read: every open `tower_watch` work item for a tenant, so
 * the Tower portfolio surface can render watched renewals. A pure read — this
 * slice does not build a Tower UI.
 */
export async function listTowerWatchItems(
  tenantKey: string,
): Promise<SourcingWorkItem[]> {
  const items = await listWorkItemsByKind(tenantKey, 'tower_watch');
  return items.filter((i) => i.status === 'open' || i.status === 'in_progress');
}

// Source Execution Room server loader.
//
// Thin orchestration: build the deterministic Execution Room from a grounded
// Renewal Cockpit, then reconcile it against the persisted `sourcing_work_items`
// rows for the contract — so the action workplan and stakeholder approvals
// reflect the durable owner / SLA / status, not just the composer baseline.
//
// `sourcing_work_items` is the single persistence backbone (see
// docs/architecture/source/SOURCING_EXECUTION_ROOM_PERSISTENCE.md). This file
// reaches the data plane only through the work-item service; the reconcile
// itself is the pure `reconcileExecutionRoom`.
//
// Fail-soft: a missing work-items table (the migration is authored-not-applied
// until the founder runs db:migrate) degrades to the deterministic room
// exactly as the composer produced it.

import 'server-only';
import type { RenewalCockpit } from '@/lib/source/renewal-cockpit/cockpit';
import { listWorkItemsForSubject } from '@/lib/source/work-items/service';
import { buildExecutionRoom } from './execution-room';
import { reconcileExecutionRoom } from './persistence';
import type { ExecutionRoom } from './types';

/**
 * Build the Execution Room for a contract and reconcile it against the
 * tenant's persisted sourcing work items.
 *
 * `asOf` is injectable for fixed-clock rendering; it defaults to the cockpit's
 * own generated-at instant. The result is deterministic for a fixed `asOf` +
 * cockpit + persisted rows.
 */
export async function loadExecutionRoom(
  cockpit: RenewalCockpit,
  asOf: Date = new Date(cockpit.generatedAt),
): Promise<ExecutionRoom> {
  const room = buildExecutionRoom(cockpit, asOf);
  let workItems;
  try {
    workItems = await listWorkItemsForSubject(
      cockpit.clientKey,
      'contract',
      cockpit.contractId,
    );
  } catch {
    // Fail-soft — the work-items migration may not be applied yet.
    return room;
  }
  return reconcileExecutionRoom(room, workItems);
}

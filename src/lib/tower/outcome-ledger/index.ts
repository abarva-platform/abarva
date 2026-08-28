// Outcome ledger · Wave 3, Slice 3.1.
//
// Public surface for the Tower outcome ledger: the typed row + view
// model shapes, the pure view-model builders, and `readOutcomeLedger`
// — the one read entry point Tower-facing code should call.
//
// `readOutcomeLedger` routes through the data-plane read-adapter seam
// (`selectOutcomeLedgerReadAdapter`) so it is Azure-cutover-safe, then
// projects the rows with `buildOutcomeLedgerView`. The queue UI lands
// in Slice 3.2; the adoption + value-realization read model is Slice
// 3.4; outcome-feedback into the pattern graph is Slice 3.6.

import { selectOutcomeLedgerReadAdapter } from '@/lib/data-plane/read-adapters/outcomeLedgerReadAdapter';
import type { DataPlane } from '@/lib/data-plane/read-adapters/types';
import { buildOutcomeLedgerView } from './view-model';
import { buildTowerAdoptionRealizationView } from './adoption-realization-view';
import type { OutcomeLedgerView } from './types';
import type { TowerAdoptionRealizationView } from './adoption-realization-view';

export type {
  OutcomeLedgerEntryView,
  OutcomeLedgerRow,
  OutcomeLedgerSummary,
  OutcomeLedgerView,
  OutcomeSubjectKind,
  OutcomeValueTier,
} from './types';
export { OUTCOME_SUBJECT_KINDS, OUTCOME_VALUE_TIERS } from './types';
export {
  buildOutcomeLedgerView,
  rungToValueTier,
  summarizeOutcomeLedger,
  toOutcomeLedgerEntryView,
} from './view-model';
export {
  buildTowerAdoptionRealizationView,
  buildTowerAdoptionSignal,
  buildTowerValueRealizationSignal,
  composeEarningSummary,
  type AdoptionSignalState,
  type TowerAdoptionRealizationView,
  type TowerAdoptionSignal,
  type TowerValueRealizationSignal,
} from './adoption-realization-view';
export {
  selectOutcomeLedgerReadAdapter,
  type OutcomeLedgerReadAdapter,
} from '@/lib/data-plane/read-adapters/outcomeLedgerReadAdapter';

/**
 * Read the current outcome ledger view model for one tenant.
 *
 * Tenant scope is enforced twice: the read adapter filters by
 * `tenant_client_key`, and the `outcome_ledger` RLS policy
 * (`can_read_tenant_by_key`) scopes any authenticated-role read. The
 * adapter degrades to an empty ledger rather than throwing when the
 * table is absent.
 *
 * @param tenantClientKey canonical tenant slug (e.g. `apexretail`).
 * @param plane optional data-plane override (defaults to env config).
 */
export async function readOutcomeLedger(
  tenantClientKey: string,
  plane?: DataPlane,
): Promise<OutcomeLedgerView> {
  const adapter = selectOutcomeLedgerReadAdapter(plane, tenantClientKey);
  const rows = await adapter.getCurrentEntries(tenantClientKey);
  return buildOutcomeLedgerView(tenantClientKey, rows);
}

/**
 * Read the Slice 3.4 adoption + value-realization view model for one
 * tenant. Reads the outcome ledger once (via `readOutcomeLedger`) and
 * re-projects it into the adoption + benefit-realization read model —
 * no extra data-plane round trip.
 *
 * @param tenantClientKey canonical tenant slug (e.g. `apexretail`).
 * @param plane optional data-plane override (defaults to env config).
 */
export async function readTowerAdoptionRealization(
  tenantClientKey: string,
  plane?: DataPlane,
): Promise<TowerAdoptionRealizationView> {
  const ledger = await readOutcomeLedger(tenantClientKey, plane);
  return buildTowerAdoptionRealizationView(ledger);
}

/**
 * W32F — Production Readiness Blocker Detail Drawer View Model
 *
 * ADMIN-DATA8 — refactored to delegate to admin-blockers-adapter.
 *   The previous hardcoded `APEX_RETAIL_BLOCKERS` constant was lifted into
 *   `src/lib/admin/data/fixtures/admin-blockers-fixture.ts` (DATA2). This
 *   module now maps adapter `AdminBlockerRow` rows into the existing
 *   `BlockerDetail` shape so that consumers (TopBlockersTable,
 *   ReadinessTileExpanded, BlockerDetailDrawer) continue to compile
 *   unchanged. Live mode is gated by `ADMIN_DATA_MODE=fixture` (default)
 *   until DATA10 ships migrations.
 *
 * Pure TypeScript read-model. No React. No network calls. No model calls.
 * Output shape is preserved. No blocker is ever marked resolved unless the
 * underlying adapter row carries `resolvedAt !== null`.
 */

import type {
  AdminBlockerOwnerAgent,
  AdminBlockerRow,
} from './data/admin-blockers-adapter-types';
import {
  getAdminBlockerById,
  getAdminBlockers,
  getAdminCriticalBlockers,
} from './data/admin-blockers-adapter';

// ---------------------------------------------------------------------------
// Types — preserved for component / test compatibility
// ---------------------------------------------------------------------------

export type BlockerSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BlockerOwner = 'steward' | 'nexus' | 'atlas' | 'founder' | 'engineering';

export interface BlockerDetail {
  id: string;
  title: string;
  description: string;
  severity: BlockerSeverity;
  impactedComponent: string;
  evidenceBasis: string;
  nextAction: string;
  owner: BlockerOwner;
  estimatedResolutionPath: string;
  pilotImpact: boolean;
  productionImpact: boolean;
  deterministicSeed: true;
}

export interface BlockerDetailDrawerView {
  blockerId: string;
  blocker: BlockerDetail | null;
  relatedBlockers: BlockerDetail[];
  drawerTitle: string;
  caveat: string;
  deterministicSeed: true;
}

const DETERMINISTIC_CAVEAT =
  'Blocker details are deterministic seed data — not live system monitoring. ' +
  'Status and descriptions reflect the Wave 2 seed state and will update when runtime ' +
  'ingestion is wired.';

// ---------------------------------------------------------------------------
// Mapper — AdminBlockerRow → BlockerDetail
// ---------------------------------------------------------------------------

const KNOWN_OWNERS: ReadonlySet<BlockerOwner> = new Set([
  'steward',
  'nexus',
  'atlas',
  'founder',
  'engineering',
]);

function mapOwner(agent: AdminBlockerOwnerAgent): BlockerOwner {
  // `sentinel` is in the adapter union but not in the legacy BlockerOwner union;
  // map it to `nexus` (closest equivalent) so the legacy contract stays intact.
  if (agent === 'sentinel') return 'nexus';
  return (KNOWN_OWNERS.has(agent as BlockerOwner) ? agent : 'engineering') as BlockerOwner;
}

export function mapBlockerRowToDetail(row: AdminBlockerRow): BlockerDetail {
  const nextAction = row.unblockSteps.length > 0 ? row.unblockSteps[0] : '';
  const estimatedResolutionPath =
    row.unblockSteps.length > 1
      ? row.unblockSteps.slice(1).join(' ')
      : row.unblockSteps[0] ?? '';

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    impactedComponent: row.impactedComponent,
    evidenceBasis: row.evidenceBasis,
    nextAction,
    owner: mapOwner(row.ownerAgent),
    estimatedResolutionPath,
    pilotImpact: row.pilotImpact,
    productionImpact: row.productionImpact,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------------
// Public API — async, delegates to admin-blockers-adapter
// ---------------------------------------------------------------------------

/**
 * Returns all blocker details for the given tenant.
 * ADMIN-DATA8: async — sources rows from `getAdminBlockers`.
 */
export async function getAllBlockerDetails(tenantSlug: string): Promise<BlockerDetail[]> {
  const rows = await getAdminBlockers(tenantSlug);
  return rows.map(mapBlockerRowToDetail);
}

/**
 * Returns only critical-severity blockers for the given tenant.
 * ADMIN-DATA8: async — sources rows from `getAdminCriticalBlockers`.
 */
export async function getCriticalBlockers(tenantSlug: string): Promise<BlockerDetail[]> {
  const rows = await getAdminCriticalBlockers(tenantSlug);
  return rows.map(mapBlockerRowToDetail);
}

/**
 * Builds the BlockerDetailDrawerView for a specific blocker.
 * ADMIN-DATA8: async — sources rows from `getAdminBlockerById` + `getAdminBlockers`.
 */
export async function buildBlockerDetailDrawerView(
  blockerId: string,
  tenantSlug: string,
): Promise<BlockerDetailDrawerView> {
  const [row, allRows] = await Promise.all([
    getAdminBlockerById(tenantSlug, blockerId),
    getAdminBlockers(tenantSlug),
  ]);

  const blocker = row ? mapBlockerRowToDetail(row) : null;

  // Related blockers = same severity or same impactedComponent, excluding the main blocker.
  const relatedBlockers = blocker
    ? allRows
        .filter(
          (r) =>
            r.id !== blockerId &&
            (r.severity === blocker.severity ||
              r.impactedComponent === blocker.impactedComponent),
        )
        .map(mapBlockerRowToDetail)
    : [];

  const drawerTitle = blocker ? blocker.title : 'Blocker not found';

  return {
    blockerId,
    blocker,
    relatedBlockers,
    drawerTitle,
    caveat: DETERMINISTIC_CAVEAT,
    deterministicSeed: true,
  };
}

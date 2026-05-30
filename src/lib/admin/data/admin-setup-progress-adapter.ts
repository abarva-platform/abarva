/**
 * ADMIN-DATA2 — Admin setup-progress adapter.
 * DATA11 — Live path wired to Azure read plane.
 */

import type {
  AdminSetupStep,
  AdminSetupStepId,
  AdminSetupStepStatus,
} from './admin-setup-progress-adapter-types';
import {
  isFixtureMode,
} from './admin-data-mode';
import { adminSetupProgressFixture } from './fixtures/admin-setup-progress-fixture';
import { azureRead } from '@/lib/data-plane/azureRead';
import { requireClientId, SETUP_STEP_LABELS } from './admin-db-helpers';

export async function getAdminSetupProgress(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminSetupStep>> {
  if (isFixtureMode()) return adminSetupProgressFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const rows = await azureRead.select<{
    step_id: string;
    status: string;
    description: string;
    computed_at: string;
  }>({
    table: 'admin_setup_progress',
    columns: ['step_id', 'status', 'description', 'computed_at'],
    where: { client_id: clientId },
    orderBy: { column: 'step_id' },
  });
  return rows.map((row) => ({
    id: row.step_id as AdminSetupStepId,
    label: SETUP_STEP_LABELS[row.step_id as AdminSetupStepId] ?? row.step_id,
    status: row.status as AdminSetupStepStatus,
    description: row.description,
    computedAt: row.computed_at,
  }));
}

export function getAdminSetupProgressFixture(
  tenantSlug: string,
): ReadonlyArray<AdminSetupStep> {
  return adminSetupProgressFixture(tenantSlug);
}

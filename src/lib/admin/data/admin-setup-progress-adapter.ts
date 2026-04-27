/**
 * ADMIN-DATA2 — Admin setup-progress adapter.
 * DATA11 — Live path wired to Supabase.
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
import { getServerSupabase } from '@/lib/supabase-server';
import { requireClientId, SETUP_STEP_LABELS } from './admin-db-helpers';

export async function getAdminSetupProgress(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminSetupStep>> {
  if (isFixtureMode()) return adminSetupProgressFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_setup_progress')
    .select('step_id, status, description, computed_at')
    .eq('client_id', clientId)
    .order('step_id');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.step_id as AdminSetupStepId,
    label: SETUP_STEP_LABELS[row.step_id as AdminSetupStepId] ?? row.step_id,
    status: row.status as AdminSetupStepStatus,
    description: row.description,
    computedAt: row.computed_at,
  }));
}

export function getAdminSetupProgressFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminSetupStep> {
  return adminSetupProgressFixture(tenantSlug);
}

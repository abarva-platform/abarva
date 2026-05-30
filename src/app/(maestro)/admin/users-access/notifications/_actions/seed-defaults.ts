'use server';

/**
 * seedDefaults server action · W4-PR-4
 *
 * Applies the registry defaults for the current user. Idempotent —
 * the broker upserts on the natural key (tenant_id, user_id, event_type).
 *
 * Surfaced by the empty-state banner in the preferences page when the
 * user has not configured any preferences yet.
 */

import { auth } from '@clerk/nextjs/server';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import {
  resolveTenantId,
  seedDefaultPreferences,
  loadUserMandatorySubscriptions,
} from '@/lib/admin/broker/notifications-preferences-broker';

export type SeedDefaultsActionResult =
  | { ok: true; count: number }
  | { ok: false; code: string; message: string };

export async function seedDefaults(): Promise<SeedDefaultsActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, code: 'unauthenticated', message: 'Sign in to seed defaults.' };
  }
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return { ok: false, code: 'no_active_tenant', message: 'No active workspace.' };
    }
    throw err;
  }
  const tenantId = await resolveTenantId(tenancy.clientKey ?? '');
  if (!tenantId) {
    return { ok: false, code: 'unresolved_tenant', message: 'Could not resolve your tenant.' };
  }
  const subs = await loadUserMandatorySubscriptions({ tenantId, userId });
  const mandatoryEventTypes = subs.map((s) => s.event_type);
  const result = await seedDefaultPreferences({
    tenantId,
    userId,
    mandatoryEventTypes,
  });
  if (!result.ok) {
    return { ok: false, code: 'db_error', message: result.message ?? 'Seed failed.' };
  }
  return { ok: true, count: result.count };
}
